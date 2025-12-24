/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ["@towns-protocol/bot"],
    },
};

export default nextConfig;
