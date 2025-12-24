"use client";

import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Board, PlayerColor } from "@/types/game";
import { ZoomPanPinch } from "@/components/ui/ZoomPanPinch";

interface BoardRendererProps {
    board: Board;
    rows: number;
    cols: number;
    onCellClick: (row: number, col: number) => void;
    explosionQueue: { row: number; col: number }[];
    clearExplosionQueue: () => void;
    currentTurnPlayer?: PlayerColor | null;
}

const BASE_CELL_SIZE = 50;
const ORB_RADIUS = 18;

const COLORS: Record<PlayerColor, string> = {
    red: "#FF9AA2",
    blue: "#C7CEEA",
    green: "#B5EAD7",
    yellow: "#FFF7B1",
    purple: "#E0BBE4",
    orange: "#FFDAC1",
    pink: "#F8BBD0",
    cyan: "#B2EBF2",
};

export const getCurrentTheme = (turn: PlayerColor | null | undefined) => {
    if (!turn || !COLORS[turn]) {
        return {
            orbColor: "#FFFFFF",
            lineColor: "rgba(255, 255, 255, 0.3)",
        };
    }
    return {
        orbColor: COLORS[turn],
        lineColor: COLORS[turn],
    };
};

export const BoardRenderer: React.FC<BoardRendererProps> = ({
    board,
    rows,
    cols,
    onCellClick,
    explosionQueue,
    clearExplosionQueue,
    currentTurnPlayer,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const screenCellsRef = useRef<Array<Array<{ x1: number, y1: number, x2: number, y2: number }>>>([]);

    useEffect(() => {
        const updateDimensions = () => {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
        };
        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    const particlesRef = useRef<{ x: number; y: number; z: number; vx: number; vy: number; vz: number; color: string; life: number }[]>([]);
    const flyingOrbsRef = useRef<{ r: number; c: number; tr: number; tc: number; color: PlayerColor; progress: number }[]>([]);
    const explodingCellsRef = useRef<{ r: number; c: number; timeLeft: number }[]>([]);

    const { scale, offsetX, offsetY } = useMemo(() => {
        if (dimensions.width === 0 || dimensions.height === 0) return { scale: 1, offsetX: 0, offsetY: 0 };
        const boardWidth = cols * BASE_CELL_SIZE;
        const boardHeight = rows * BASE_CELL_SIZE;
        const padding = 40;
        const availableWidth = dimensions.width - padding * 2;
        const availableHeight = dimensions.height - padding * 2;
        const finalScale = Math.min(availableWidth / boardWidth, availableHeight / boardHeight);
        return { scale: finalScale, offsetX: dimensions.width / 2, offsetY: dimensions.height / 2 };
    }, [dimensions, rows, cols]);

    const project = useCallback((x: number, y: number, z: number) => {
        const sx = x * scale + offsetX;
        const sy = (y - z) * scale + offsetY;
        return { x: sx, y: sy, scale: scale };
    }, [scale, offsetX, offsetY]);

    useEffect(() => {
        if (explosionQueue.length > 0) {
            explosionQueue.forEach(({ row, col }) => {
                const cell = board[row][col];
                const color = cell.owner || 'red';
                explodingCellsRef.current.push({ r: row, c: col, timeLeft: 300 });

                const neighbors: { r: number; c: number }[] = [];
                if (row > 0) neighbors.push({ r: row - 1, c: col });
                if (row < rows - 1) neighbors.push({ r: row + 1, c: col });
                if (col > 0) neighbors.push({ r: row, c: col - 1 });
                if (col < cols - 1) neighbors.push({ r: row, c: col + 1 });

                neighbors.forEach(n => {
                    flyingOrbsRef.current.push({ r: row, c: col, tr: n.r, tc: n.c, color, progress: 0 });
                });

                for (let i = 0; i < 8; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 5 + 2;
                    particlesRef.current.push({
                        x: (col - cols / 2 + 0.5) * BASE_CELL_SIZE,
                        y: (row - rows / 2 + 0.5) * BASE_CELL_SIZE,
                        z: 10,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        vz: Math.random() * 4 + 2,
                        color: COLORS[color],
                        life: 1.0
                    });
                }
            });
            clearExplosionQueue();
        }
    }, [explosionQueue, clearExplosionQueue, board, rows, cols, project]);

    const drawOrbShape = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: PlayerColor) => {
        const radius = ORB_RADIUS * scale;
        const baseColor = COLORS[color];
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3 * Math.max(0.5, scale);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 2 * Math.max(0.5, scale);
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.7, Math.PI * 1.1, Math.PI * 1.6);
        ctx.stroke();
    }, []);

    const drawOrbGroup = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number, color: PlayerColor, count: number) => {
        if (count === 1) {
            drawOrbShape(ctx, cx, cy, scale, color);
        } else if (count === 2) {
            const angle = Date.now() / 800;
            const dist = 12 * scale;
            ctx.save();
            ctx.translate(cx, cy);
            drawOrbShape(ctx, Math.cos(angle) * dist, Math.sin(angle) * dist * 0.6, scale, color);
            drawOrbShape(ctx, -Math.cos(angle) * dist, -Math.sin(angle) * dist * 0.6, scale, color);
            ctx.restore();
        } else if (count >= 3) {
            const angle = Date.now() / 600;
            const dist = 14 * scale;
            [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].forEach(a => {
                const finalAngle = a + angle;
                drawOrbShape(ctx, cx + Math.cos(finalAngle) * dist, cy + Math.sin(finalAngle) * dist * 0.6, scale, color);
            });
        }
    }, [drawOrbShape]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let lastTime = performance.now();
        screenCellsRef.current = Array(rows).fill(null).map(() => Array(cols).fill(null));

        const render = (time: number) => {
            const dt = time - lastTime;
            lastTime = time;
            const dpr = window.devicePixelRatio || 1;
            if (canvas.width !== Math.floor(dimensions.width * dpr) || canvas.height !== Math.floor(dimensions.height * dpr)) {
                canvas.width = Math.floor(dimensions.width * dpr);
                canvas.height = Math.floor(dimensions.height * dpr);
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, dimensions.width, dimensions.height);

            const xHalf = (cols / 2) * BASE_CELL_SIZE;
            const yHalf = (rows / 2) * BASE_CELL_SIZE;
            const pTL = project(-xHalf, -yHalf, 0);
            const pBR = project(xHalf, yHalf, 0);

            ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
            ctx.fillRect(pTL.x, pTL.y, pBR.x - pTL.x, pBR.y - pTL.y);
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 4 * scale;
            ctx.strokeRect(pTL.x, pTL.y, pBR.x - pTL.x, pBR.y - pTL.y);

            const theme = getCurrentTheme(currentTurnPlayer);
            ctx.strokeStyle = theme.lineColor;
            ctx.lineWidth = 2 * scale;
            for (let c = 0; c <= cols; c++) {
                const p1 = project((c - cols / 2) * BASE_CELL_SIZE, -yHalf, 0);
                const p2 = project((c - cols / 2) * BASE_CELL_SIZE, yHalf, 0);
                ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
            }
            for (let r = 0; r <= rows; r++) {
                const p1 = project(-xHalf, (r - rows / 2) * BASE_CELL_SIZE, 0);
                const p2 = project(xHalf, (r - rows / 2) * BASE_CELL_SIZE, 0);
                ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
            }

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const xW = (c - cols / 2) * BASE_CELL_SIZE;
                    const yW = (r - rows / 2) * BASE_CELL_SIZE;
                    const p1 = project(xW, yW, 0);
                    const p2 = project(xW + BASE_CELL_SIZE, yW + BASE_CELL_SIZE, 0);
                    screenCellsRef.current[r][c] = { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };

                    if (explodingCellsRef.current.some(ec => ec.r === r && ec.c === c)) continue;
                    const cell = board[r][c];
                    if (cell.count > 0 && cell.owner) {
                        const p = project((c - cols / 2 + 0.5) * BASE_CELL_SIZE, (r - rows / 2 + 0.5) * BASE_CELL_SIZE, 0);
                        drawOrbGroup(ctx, p.x, p.y, p.scale, cell.owner, cell.count);
                    }
                }
            }

            flyingOrbsRef.current.forEach((orb) => {
                orb.progress += dt / 600;
                if (orb.progress < 1) {
                    const startX = (orb.c - cols / 2 + 0.5) * BASE_CELL_SIZE;
                    const startY = (orb.r - rows / 2 + 0.5) * BASE_CELL_SIZE;
                    const endX = (orb.tc - cols / 2 + 0.5) * BASE_CELL_SIZE;
                    const endY = (orb.tr - rows / 2 + 0.5) * BASE_CELL_SIZE;
                    const p = project(startX + (endX - startX) * orb.progress, startY + (endY - startY) * orb.progress, 50 * Math.sin(orb.progress * Math.PI));
                    drawOrbShape(ctx, p.x, p.y, p.scale * 0.8, orb.color);
                }
            });
            flyingOrbsRef.current = flyingOrbsRef.current.filter(o => o.progress < 1);

            particlesRef.current.forEach(p => {
                p.life -= dt / 1000;
                p.x += p.vx; p.y += p.vy; p.z += p.vz; p.vz -= 0.2;
                if (p.z < 0) { p.z = 0; p.vz *= -0.5; }
                const proj = project(p.x, p.y, p.z);
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(proj.x, proj.y, 3 * proj.scale, 0, Math.PI * 2); ctx.fill();
            });
            particlesRef.current = particlesRef.current.filter(p => p.life > 0);

            explodingCellsRef.current.forEach(ec => ec.timeLeft -= dt);
            explodingCellsRef.current = explodingCellsRef.current.filter(ec => ec.timeLeft > 0);

            animationFrameId = requestAnimationFrame(render);
        };
        animationFrameId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationFrameId);
    }, [board, rows, cols, dimensions, scale, offsetX, offsetY, drawOrbGroup, drawOrbShape, currentTurnPlayer, project]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (dimensions.width / rect.width);
        const y = (e.clientY - rect.top) * (dimensions.height / rect.height);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cellRect = screenCellsRef.current[r][c];
                if (x >= cellRect.x1 && x <= cellRect.x2 && y >= cellRect.y1 && y <= cellRect.y2) {
                    onCellClick(r, c);
                    return;
                }
            }
        }
    };

    return (
        <div className="w-screen h-screen overflow-hidden flex justify-center items-center bg-transparent">
            <ZoomPanPinch className="w-full h-full flex justify-center items-center">
                <canvas ref={canvasRef} onClick={handleCanvasClick} className="cursor-pointer block" style={{ width: '100%', height: '100%', display: 'block' }} />
            </ZoomPanPinch>
        </div>
    );
};
