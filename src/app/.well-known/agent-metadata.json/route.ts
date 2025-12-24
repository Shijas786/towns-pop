// import { getBot } from "@/lib/bot";
import { NextResponse } from "next/server";

export async function GET() {
    // try {
    //     const bot = await getBot();
    //     if (!bot) {
    //         return NextResponse.json({ error: "Bot not initialized" }, { status: 500 });
    //     }

    //     const metadata = await bot.getIdentityMetadata();
    //     return NextResponse.json(metadata);
    // } catch (error) {
    //     console.error("Discovery metadata error:", error);
    //     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    // }
    return NextResponse.json({
        name: "Towns Pop Bot",
        description: "Bot for Towns Pop game",
        commands: []
    });
}
