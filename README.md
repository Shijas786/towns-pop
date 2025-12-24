# Towns Pop (Chain Reaction) 🟢🔴

**Towns Pop** is a strategic "Chain Reaction" game built as a generic **Towns Mini App**. It features a local pass-and-play mode, a highly integrated chat bot for community engagement, and a real-time multiplayer implementation backend powered by **SpacetimeDB**.

## 🚀 Features

### 🎮 Code Game
- **Chain Reaction Logic**: Classic strategy game where atoms multiply and explode to capture neighbor cells.
- **Optimized Board**: Fixed 9x6 grid for the best competitive experience on mobile and desktop.
- **Towns Integrated**: Uses `@farcaster/frame-sdk` to run natively within the Towns context.

### 🤖 Towns Chat Bot
- **Commands**: 
  - `/play`: Launches the Mini App directly from chat.
  - `/help`: Shows game rules and commands.
- **Stack**: Built with `@towns-protocol/bot`, Hono, and Next.js API Routes.
- **Status**: Code complete. *Note: Currently disabled in production to resolve standard Vercel build compatibility.*

### ⚡ Real-Time Multiplayer (SpacetimeDB)
- **Backend (Rust)**: Custom SpacetimeDB module handling authoritative game state, turn logic, and atomic explosions.
- **Frontend (TS)**: `useOnlineChainReaction` hook for live state synchronization.
- **Status**: Code complete. Requires SpacetimeDB CLI to compile and publish the Rust module.

## 📖 How to Play

**Objective**: Eliminate all opponent orbs to win the game.

1.  **Place Orbs**: Players take turns placing an "atom" in a cell. You can only place atoms in empty cells or cells you already own.
2.  **Critical Mass**: Each cell has a capacity equivalent to its number of neighbors:
    -   **Corner**: Explodes at **2** atoms.
    -   **Edge**: Explodes at **3** atoms.
    -   **Inner**: Explodes at **4** atoms.
3.  **Chain Reaction**: When a cell reaches critical mass, it explodes!
    -   Its atoms are distributed to neighbors.
    -   **Capture**: If a neighbor cell belonged to an opponent, it is **captured** and turns to your color.
    -   **Chains**: If a neighbor also reaches critical mass, it explodes too, creating a chain reaction.
4.  **Winning**: The game ends when all other players lose all their atoms.

## 🛠️ Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Shadcn UI.
- **Bot**: Towns Protocol SDK.
- **Backend**: Rust (SpacetimeDB).
- **Deployment**: Vercel.

## 🏁 Getting Started

### 1. Run Local Game
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### 2. SpacetimeDB Backend (Optional)
Requires [SpacetimeDB CLI](https://spacetimedb.com/).

```bash
# Initialize & Publish
cd server
spacetime publish server

# Update Frontend
# Edit src/lib/spacetimedb.ts with your new DB name/token.
```

## 🤝 Contribution
This project uses a standard Git flow.
- `main`: Stable, deployment-ready branch.
- `development`: Active development branch.

Please submit PRs to `development`.
