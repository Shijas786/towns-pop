// import { getBot } from "@/lib/bot";

export async function POST(req: Request) {
    // try {
    //     const bot = await getBot();
    //     if (!bot) {
    //         console.error("Bot initialization failed - missing credentials?");
    //         return new Response("Bot not initialized", { status: 500 });
    //     }

    //     const app = bot.start();

    //     // Rewrite URL to /webhook because the Hono app inside the Towns SDK 
    //     // specifically listens on that path.
    //     const url = new URL(req.url);
    //     url.pathname = "/webhook";

    //     const newReq = new Request(url, {
    //         method: req.method,
    //         headers: req.headers,
    //         body: req.body,
    //         // @ts-expect-error - duplex is needed for streaming bodies in some environments
    //         duplex: "half",
    //     });

    //     return app.fetch(newReq);
    // } catch (error) {
    //     console.error("Towns Bot Webhook Error:", error);
    //     return new Response("Internal Server Error", { status: 500 });
    // }
    return new Response("Bot integration temporarily disabled due to build issues", { status: 503 });
}

export async function GET() {
    return new Response("Towns Bot Webhook Endpoint Active", { status: 200 });
}
