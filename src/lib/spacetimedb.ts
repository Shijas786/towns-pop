import { SpacetimeDBClient, Identity, ReducerEvent } from "@clockworklabs/spacetimedb-sdk";

export type GamePhase = "Waiting" | "Playing" | "Ended";

export interface Cell {
    owner_idx: number | null;
    count: number;
}

export interface TownsPlayer {
    identity: Identity;
    address: string | null;
    nickname: string;
    online: boolean;
}

export interface TownsGame {
    game_id: number;
    phase: GamePhase;
    current_turn_idx: number;
    players: Identity[];
    board: Cell[];
    winner: Identity | null;
}

// Reducerpayload types
export type CreateGamePayload = { nickname: string };
export type JoinGamePayload = { game_id: number, nickname: string };
export type StartGamePayload = { game_id: number };
export type MakeMovePayload = { game_id: number, cell_index: number };

// Event Types
export type TownsEvent =
    | { type: "create_game", payload: CreateGamePayload, status: "committed" | "failed", caller: Identity }
    | { type: "join_game", payload: JoinGamePayload, status: "committed" | "failed", caller: Identity }
    | { type: "make_move", payload: MakeMovePayload, status: "committed" | "failed", caller: Identity };

// Client Wrapper
export class TownsClient {
    static client: SpacetimeDBClient;

    static init(token: string, onConnect: () => void) {
        // TODO: Replace with your actual SpacetimeDB endpoint
        const host = "wss://testnet.spacetimedb.com";
        const name = "towns-pop-db"; // This usually needs manual setup on the server if CLI is missing...

        TownsClient.client = new SpacetimeDBClient(host, name, token);

        TownsClient.client.on("initialStateSync", onConnect);

        TownsClient.client.connect();
    }

    static createGame(nickname: string) {
        TownsClient.client.call("create_game", [nickname]);
    }

    static joinGame(gameId: number, nickname: string) {
        TownsClient.client.call("join_game", [gameId, nickname]);
    }

    static startGame(gameId: number) {
        TownsClient.client.call("start_game", [gameId]);
    }

    static makeMove(gameId: number, cellIndex: number) {
        TownsClient.client.call("make_move", [gameId, cellIndex]);
    }
}
