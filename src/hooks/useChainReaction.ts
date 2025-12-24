import { useState, useEffect, useCallback, useMemo } from 'react';
import { Board, Cell, Player, GameState, PLAYER_COLORS, PlayerColor } from '@/types/game';
import { createBoard, getMaxCapacity, isValidMove, getNeighbors } from '@/lib/gameLogic';
import { getBoardSize } from '@/lib/boardSize';
import { soundManager } from '@/lib/sound';

export const useChainReaction = (playerCount: number, customColors?: PlayerColor[]) => {
    const { rows, cols } = useMemo(() => getBoardSize(), []);

    const [gameState, setGameState] = useState<GameState>({
        board: createBoard(rows, cols),
        players: [],
        currentPlayerIndex: 0,
        isGameOver: false,
        winner: null,
        isAnimating: false,
    });

    const [explosionQueue, setExplosionQueue] = useState<{ row: number; col: number }[]>([]);

    // Initialize players
    useEffect(() => {
        const newPlayers: Player[] = Array.from({ length: playerCount }, (_, i) => ({
            id: `p${i}`,
            color: customColors && customColors[i] ? customColors[i] : PLAYER_COLORS[i],
            isAlive: true,
            name: `Player ${i + 1}`,
        }));
        setGameState({
            board: createBoard(rows, cols),
            players: newPlayers,
            currentPlayerIndex: 0,
            isGameOver: false,
            winner: null,
            isAnimating: false,
        });
        setExplosionQueue([]);
    }, [playerCount, customColors, rows, cols]);

    const checkWinner = useCallback((board: Board, players: Player[]) => {
        const playerOrbCounts: Record<string, number> = {};
        players.forEach(p => playerOrbCounts[p.color] = 0);

        let totalOrbs = 0;
        board.forEach(row => row.forEach(cell => {
            if (cell.owner) {
                playerOrbCounts[cell.owner]++;
                totalOrbs++;
            }
        }));

        if (totalOrbs < 2) return null; // Game just started or empty

        const activePlayers = players.filter(p => playerOrbCounts[p.color] > 0);

        if (activePlayers.length === 1 && totalOrbs > 1) {
            return activePlayers[0];
        }
        return null;
    }, []);

    const processChainReaction = useCallback(async (currentBoard: Board, currentPlayerColor: PlayerColor) => {
        let board = JSON.parse(JSON.stringify(currentBoard));

        const step = async () => {
            const unstableCells: { r: number; c: number }[] = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (board[r][c].count >= getMaxCapacity(r, c, rows, cols)) {
                        unstableCells.push({ r, c });
                    }
                }
            }

            if (unstableCells.length === 0) {
                setGameState(prev => {
                    const winner = checkWinner(board, prev.players);
                    if (winner) {
                        return {
                            ...prev,
                            board,
                            isAnimating: false,
                            winner,
                            isGameOver: true
                        };
                    }

                    let nextIndex = (prev.currentPlayerIndex + 1) % prev.players.length;

                    // Logic to skip eliminated players
                    const playerOrbCounts: Record<string, number> = {};
                    prev.players.forEach(p => playerOrbCounts[p.color] = 0);
                    board.forEach((row: Cell[]) => row.forEach((cell: Cell) => {
                        if (cell.owner) playerOrbCounts[cell.owner] += cell.count;
                    }));

                    const totalOrbs = Object.values(playerOrbCounts).reduce((a, b) => a + b, 0);
                    if (totalOrbs >= prev.players.length) {
                        let attempts = 0;
                        while (attempts < prev.players.length) {
                            const nextPlayer = prev.players[nextIndex];
                            if (playerOrbCounts[nextPlayer.color] > 0) break;
                            nextIndex = (nextIndex + 1) % prev.players.length;
                            attempts++;
                        }
                    }

                    return {
                        ...prev,
                        board,
                        isAnimating: false,
                        currentPlayerIndex: nextIndex,
                        winner: null,
                        isGameOver: false
                    };
                });
                return;
            }

            setExplosionQueue(unstableCells.map(c => ({ row: c.r, col: c.c })));
            soundManager.playExplosion();

            await new Promise(resolve => setTimeout(resolve, 300));

            const nextBoard = JSON.parse(JSON.stringify(board));
            unstableCells.forEach(({ r, c }) => {
                const cell = nextBoard[r][c];
                cell.count -= getMaxCapacity(r, c, rows, cols);
                if (cell.count === 0) cell.owner = null;

                const neighbors = getNeighbors(r, c, rows, cols);
                neighbors.forEach(n => {
                    const neighbor = nextBoard[n.r][n.c];
                    neighbor.count++;
                    if (neighbor.owner !== currentPlayerColor) {
                        soundManager.playCapture();
                    }
                    neighbor.owner = currentPlayerColor;
                });
            });

            board = nextBoard;
            let gameOver = false;
            setGameState(prev => {
                const winner = checkWinner(board, prev.players);
                if (winner) {
                    gameOver = true;
                    return { ...prev, board, isAnimating: false, winner, isGameOver: true };
                }
                return { ...prev, board };
            });

            if (gameOver) return;
            setTimeout(step, 100);
        };

        step();
    }, [checkWinner, rows, cols]);

    const makeMove = useCallback((row: number, col: number) => {
        if (gameState.isAnimating || gameState.isGameOver) return;

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (!isValidMove(gameState.board, row, col, currentPlayer.color)) return;

        soundManager.playPop();

        const newBoard = JSON.parse(JSON.stringify(gameState.board));
        newBoard[row][col].count++;
        newBoard[row][col].owner = currentPlayer.color;

        setGameState(prev => ({ ...prev, board: newBoard, isAnimating: true }));
        processChainReaction(newBoard, currentPlayer.color);
    }, [gameState, processChainReaction]);

    return {
        gameState,
        makeMove,
        explosionQueue,
        clearExplosionQueue: () => setExplosionQueue([])
    };
};
