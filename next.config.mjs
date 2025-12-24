const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ["@towns-protocol/bot", "viem", "@towns-protocol/abis", "hono"],
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};
