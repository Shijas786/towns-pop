/**
 * Get recommended board size based on number of players
 */
export function getBoardSize(maxPlayers: number): { rows: number; cols: number } {
    return { rows: 9, cols: 6 };
}

/**
 * Get max capacity for a cell based on its position
 */
export function getMaxCapacity(row: number, col: number, rows: number, cols: number): number {
    const isCorner = (row === 0 || row === rows - 1) && (col === 0 || col === cols - 1);
    const isEdge = row === 0 || row === rows - 1 || col === 0 || col === cols - 1;

    if (isCorner) return 2;
    if (isEdge) return 3;
    return 4;
}
