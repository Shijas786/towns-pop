"use client";

import React, { useState } from 'react';
import { useChainReaction } from '@/hooks/useChainReaction';
import { BoardRenderer } from '@/components/game/BoardRenderer';
import { DoodleBackground } from '@/components/ui/DoodleBackground';
import { DoodleText } from '@/components/ui/DoodleText';
import { OrbMascot } from '@/components/ui/OrbMascot';
import { motion } from 'framer-motion';

export const ChainReactionGame = () => {
    const [playersCount, setPlayersCount] = useState<number | null>(null);
    const { gameState, makeMove, explosionQueue, clearExplosionQueue } = useChainReaction(playersCount || 2);

    if (playersCount === null) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white relative overflow-hidden">
                <DoodleBackground />
                <DoodleText />
                <OrbMascot />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="z-10 mt-8 flex flex-col items-center gap-6"
                >
                    <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}>
                        Select Players
                    </h2>
                    <div className="flex gap-4">
                        {[2, 3, 4, 5].map((count) => (
                            <button
                                key={count}
                                onClick={() => setPlayersCount(count)}
                                className="w-12 h-12 rounded-full border-2 border-slate-800 flex items-center justify-center font-bold text-lg hover:bg-slate-800 hover:text-white transition-colors"
                                style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}
                            >
                                {count}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>
        );
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    return (
        <div className="relative min-h-screen bg-transparent overflow-hidden">
            <DoodleBackground />

            {/* Game Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 pointer-events-none">
                <div className="flex gap-2 pointer-events-auto">
                    <button
                        onClick={() => setPlayersCount(null)}
                        className="bg-white/80 backdrop-blur-sm border-2 border-slate-800 p-2 px-4 rounded-full font-bold hover:bg-slate-100 transition-colors flex items-center gap-2"
                        style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}
                    >
                        ← Back
                    </button>
                    <div className="bg-white/80 backdrop-blur-sm border-2 border-slate-800 p-2 px-4 rounded-full">
                        <span className="font-bold flex items-center gap-2" style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}>
                            Turn: <span className="w-4 h-4 rounded-full border border-black" style={{ backgroundColor: currentPlayer?.color }} /> {currentPlayer?.name}
                        </span>
                    </div>
                </div>

                {gameState.isGameOver && (
                    <div className="bg-white/90 backdrop-blur-sm border-2 border-slate-800 p-2 px-6 rounded-full fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto shadow-2xl z-50 flex flex-col items-center gap-4">
                        <h2 className="text-3xl font-black text-slate-800" style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}>
                            GAME OVER!
                        </h2>
                        <p className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}>
                            Winner: <span className="w-6 h-6 rounded-full border border-black" style={{ backgroundColor: gameState.winner?.color }} /> {gameState.winner?.name}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-slate-800 text-white p-2 px-6 rounded-full font-bold hover:bg-slate-700 transition-colors"
                            style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}
                        >
                            Play Again
                        </button>
                    </div>
                )}
            </div>

            {/* Board Container */}
            <div className="w-full h-screen">
                <BoardRenderer
                    board={gameState.board}
                    rows={gameState.board.length}
                    cols={gameState.board[0].length}
                    onCellClick={makeMove}
                    explosionQueue={explosionQueue}
                    clearExplosionQueue={clearExplosionQueue}
                    currentTurnPlayer={currentPlayer?.color}
                />
            </div>
        </div>
    );
};
