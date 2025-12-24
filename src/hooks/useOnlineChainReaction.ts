import { useState, useEffect, useCallback } from 'react';
import { TownsClient, TownsGame, Cell, TownsEvent } from '@/lib/spacetimedb';
import { useToast } from '@/components/ui/use-toast';

export const useOnlineChainReaction = (gameId: number | null) => {
    const [gameState, setGameState] = useState<TownsGame | null>(null);
    const [myIdentity, setMyIdentity] = useState<string | null>(null);
    const { toast } = useToast();

    // Initialize Connection
    useEffect(() => {
        const token = localStorage.getItem('towns_auth_token') || '';
        // In a real app, we'd fetch this token from an auth service or generate a temp one
        // For now, we assume the user might have one or we init anonymously if supported

        TownsClient.init(token, () => {
            console.log("Connected to SpacetimeDB");
            // @ts-ignore - accessing internal client for identity
            const id = TownsClient.client?.identity?.toHexString();
            if (id) setMyIdentity(id);
        });

        // Mock subscription to updates
        // In the real SDK, we would do:
        // TownsGame.onInsert((game) => ...);
        // TownsGame.onUpdate((game) => ...);

        // Since we are using a manual shim, we simulate polling or listening to a generic event stream
        // if we implemented it in the shim.

        // Setup polling for game state if gameId is present
        let interval: NodeJS.Timeout;
        if (gameId) {
            interval = setInterval(() => {
                // TownsClient.getGame(gameId).then(setGameState);
                // Placeholder: Real SDK has reactive subscriptions.
            }, 1000);
        }

        return () => {
            clearInterval(interval);
        };
    }, [gameId]);

    const joinGame = useCallback((nickname: string) => {
        if (!gameId) return;
        TownsClient.joinGame(gameId, nickname);
        toast({
            title: "Joining Game...",
            description: `Request sent to join game ${gameId}`,
        });
    }, [gameId, toast]);

    const playMove = useCallback((cellIndex: number) => {
        if (!gameId) return;
        TownsClient.makeMove(gameId, cellIndex);
    }, [gameId]);

    const startGame = useCallback(() => {
        if (!gameId) return;
        TownsClient.startGame(gameId);
    }, [gameId]);

    return {
        gameState,
        myIdentity,
        joinGame,
        playMove,
        startGame
    };
};
