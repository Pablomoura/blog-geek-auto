/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "omelete.uol.com.br",
      "cdn.ome.lt",
      "cdn.omelete.com.br",
      "www.omelete.com.br", // adiciona todos que você vê nas URLs externas
    ],
  },
  experimental: {
    serverComponentsExternalPackages: [
      'puppeteer',
      'puppeteer-extra',
      'puppeteer-extra-plugin-stealth',
    ],
    serverMinification: false, // necessário para a plataforma DEFER
  },
};

export default nextConfig;