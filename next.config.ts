/ ** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "omelete.uol.com.br",
      "cdn.ome.lt",
      "cdn.omelete.com.br",
      "www.omelete.com.br",
    ],
  },
  serverExternalPackages: ["puppeteer-extra", "puppeteer-extra-plugin-stealth"],
  experimental: {
    serverActions: true,
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;