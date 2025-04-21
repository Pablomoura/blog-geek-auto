/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  images: {
    domains: [
      "omelete.uol.com.br",
      "cdn.ome.lt",
      "cdn.omelete.com.br",
      "www.omelete.com.br",
      "www.geeknews.com.br",
      "images.justwatch.com",
      "justwatch.com",
    ],
  },
  serverExternalPackages: ["puppeteer-extra", "puppeteer-extra-plugin-stealth"],
  experimental: {
    serverActions: true,
  },
  async rewrites() {
    return [
      {
        source: "/sitemap.xml",
        destination: "/api/sitemap",
      },
    ];
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
