/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 't3.gstatic.com',
                pathname: '/faviconV2/**',
            },
            {
                protocol: 'https',
                hostname: 'i.ibb.co',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'static.cdninstagram.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'www.instagram.com',
                pathname: '/static/**',
            },
        ],
    },
};

export default nextConfig;
