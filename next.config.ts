/** @type {import('next').NextConfig} */
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
};

export default nextConfig;