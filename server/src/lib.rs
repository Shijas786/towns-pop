use spacetimedb::{spacetimedb, Identity, SpacetimeType, ReducerContext, Table};
use log;

#[spacetimedb(table)]
#[derive(Clone)]
pub struct TownsPlayer {
    #[primarykey]
    pub identity: Identity,
    pub address: Option<String>,
    pub nickname: String,
    pub online: bool,
}

#[derive(SpacetimeType, Clone)]
pub struct Cell {
    pub owner_idx: Option<u32>, // Index of player in the game's player list
    pub count: u8,
}

#[derive(SpacetimeType, Clone, PartialEq)]
pub enum GamePhase {
    Waiting,
    Playing,
    Ended,
}

#[spacetimedb(table)]
#[derive(Clone)]
pub struct TownsGame {
    #[primarykey]
    #[autoinc]
    pub game_id: u64,
    pub phase: GamePhase,
    pub current_turn_idx: u32,
    pub players: Vec<Identity>, // List of player identities
    pub board: Vec<Cell>, // Flattened 9x6 board (54 cells)
    pub winner: Option<Identity>,
}

// 9x6 Board
const ROWS: usize = 9;
const COLS: usize = 6;

fn get_capacity(index: usize) -> u8 {
    let r = index / COLS;
    let c = index % COLS;
    
    // Corners -> 1 (capacity is 2, but explode at 2? No, explode at capacity. Max atoms = capacity - 1)
    // Actually Chain Reaction rules:
    // Corner: Capacity 2 (Explodes at 2? Or holds 1?)
    // Game rules: "Critical mass" = neighbors.
    // Corner has 2 neighbors => Critical mass 2. Explodes when it HITs 2.
    // Edge has 3 neighbors => Critical mass 3.
    // Inner has 4 neighbors => Critical mass 4.
    
    let is_top_bottom = r == 0 || r == ROWS - 1;
    let is_left_right = c == 0 || c == COLS - 1;
    
    if is_top_bottom && is_left_right { return 2; } // Corner
    if is_top_bottom || is_left_right { return 3; } // Edge
    return 4; // Inner
}

// Neighbors helper
fn get_neighbors(index: usize) -> Vec<usize> {
    let r = index / COLS;
    let c = index % COLS;
    let mut neighbors = Vec::new();
    
    if r > 0 { neighbors.push((r - 1) * COLS + c); } // Up
    if r < ROWS - 1 { neighbors.push((r + 1) * COLS + c); } // Down
    if c > 0 { neighbors.push(r * COLS + (c - 1)); } // Left
    if c < COLS - 1 { neighbors.push(r * COLS + (c + 1)); } // Right
    
    neighbors
}

#[spacetimedb(reducer)]
pub fn create_game(ctx: ReducerContext, nickname: String) {
    let player = TownsPlayer {
        identity: ctx.sender,
        address: None, // Can be populated if needed
        nickname: nickname.clone(),
        online: true,
    };
    TownsPlayer::insert(player);

    let mut board = Vec::new();
    for _ in 0..(ROWS * COLS) {
        board.push(Cell { owner_idx: None, count: 0 });
    }

    let game = TownsGame {
        game_id: 0, // autoinc
        phase: GamePhase::Waiting,
        current_turn_idx: 0,
        players: vec![ctx.sender],
        board,
        winner: None,
    };
    TownsGame::insert(game);
    log::info!("Game created by {}", nickname);
}

#[spacetimedb(reducer)]
pub fn join_game(ctx: ReducerContext, game_id: u64, nickname: String) {
    let mut game = match TownsGame::find(&game_id) {
        Some(g) => g,
        None => return,
    };

    if game.phase != GamePhase::Waiting {
        log::warn!("Cannot join game in progress");
        return;
    }

    // Add player if not exists
    if !game.players.contains(&ctx.sender) {
        game.players.push(ctx.sender);
        
        let player = TownsPlayer {
            identity: ctx.sender,
            address: None,
            nickname,
            online: true,
        };
        TownsPlayer::insert(player);
        
        TownsGame::update_by_game_id(&game_id, game); 
        log::info!("Player joined game {}", game_id);
    }
}

#[spacetimedb(reducer)]
pub fn start_game(ctx: ReducerContext, game_id: u64) {
    let mut game = match TownsGame::find(&game_id) {
        Some(g) => g,
        None => return,
    };
    
    // Only first player (host) can start? Or anyone for now.
    if game.players.len() < 2 {
        log::warn!("Need at least 2 players to start");
        return;
    }
    
    if game.phase == GamePhase::Waiting {
        game.phase = GamePhase::Playing;
        TownsGame::update_by_game_id(&game_id, game);
        log::info!("Game {} started", game_id);
    }
}

#[spacetimedb(reducer)]
pub fn make_move(ctx: ReducerContext, game_id: u64, cell_index: u32) {
    let mut game = match TownsGame::find(&game_id) {
        Some(g) => g,
        None => {
            log::warn!("Game {} not found", game_id);
            return;
        },
    };

    if game.phase != GamePhase::Playing { return; }

    let sender_idx = match game.players.iter().position(|&x| x == ctx.sender) {
        Some(idx) => idx as u32,
        None => return, // Not in game
    };

    if sender_idx != game.current_turn_idx {
        log::warn!("Not your turn!");
        return;
    }

    let idx = cell_index as usize;
    if idx >= game.board.len() { return; }

    // Check validity
    if let Some(owner) = game.board[idx].owner_idx {
        if owner != sender_idx {
            log::warn!("Cell owned by someone else");
            return;
        }
    }

    // Apply move & Explode
    game.board[idx].owner_idx = Some(sender_idx);
    game.board[idx].count += 1;

    let mut queue = Vec::new();
    if game.board[idx].count >= get_capacity(idx) {
        queue.push(idx);
    }

    while let Some(curr_idx) = queue.pop() {
        let owner = game.board[curr_idx].owner_idx;
        game.board[curr_idx].count = 0;
        game.board[curr_idx].owner_idx = None;

        let neighbors = get_neighbors(curr_idx);
        for neighbor_idx in neighbors {
            game.board[neighbor_idx].count += 1;
            game.board[neighbor_idx].owner_idx = owner;
            // Capture logic implied: setting owner overwrites previous owner
            
            if game.board[neighbor_idx].count >= get_capacity(neighbor_idx) {
                queue.push(neighbor_idx);
            }
        }
    }

    // Check Win Cond & Eliminate
    // Simple approach: Count atoms for each player. If a player has 0 atoms AND it's not the first round (heuristic?), they are out.
    // Actually, simple turn rotation first.
    
    let next_turn = (game.current_turn_idx + 1) % (game.players.len() as u32);
    // TODO: skip eliminated players
    game.current_turn_idx = next_turn;

    // Direct update call using the game object
    let _ = TownsGame::update_by_game_id(&game_id, game); 
}
