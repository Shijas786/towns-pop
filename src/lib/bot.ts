import { makeTownsBot, BotCommand } from '@towns-protocol/bot';

const privateData = process.env.TOWNS_APP_PRIVATE_DATA || '';
const jwtSecret = process.env.TOWNS_JWT_SECRET || '';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://towns-pop.vercel.app';

const commands = [
    {
        name: 'play',
        description: 'Start a new game of Chain Reaction',
    },
    {
        name: 'help',
        description: 'How to play Chain Reaction',
    },
] as const satisfies BotCommand[];

type BotInstance = Awaited<ReturnType<typeof makeTownsBot<typeof commands>>>;

let botInstance: BotInstance | null = null;

export async function getBot(): Promise<BotInstance | null> {
    if (botInstance) return botInstance;

    if (!privateData || privateData.includes('folder') || privateData.length < 10) {
        console.warn('TOWNS_APP_PRIVATE_DATA not set properly, bot disabled');
        return null;
    }

    try {
        botInstance = await makeTownsBot(privateData, jwtSecret, { commands });

        // Register slash commands
        botInstance.onSlashCommand('play', async (handler, event) => {
            await handler.sendMessage(event.channelId, `🎮 **Onchain Reaction**\n\nClick below to start a game with your friends!\n\n${appUrl}`);
        });

        botInstance.onSlashCommand('help', async (handler, event) => {
            await handler.sendMessage(event.channelId,
                "🧬 **How to Play Chain Reaction**\n\n" +
                "1. Place atoms on the grid.\n" +
                "2. When a cell reaches its limit, it explodes!\n" +
                "3. Exploding atoms capture neighboring cells.\n" +
                "4. Be the last player standing to win.\n\n" +
                "Type `/play` to get the game link!"
            );
        });

        return botInstance;
    } catch (error) {
        console.error('Failed to initialize Towns bot:', error);
        return null;
    }
}
