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
};

export default nextConfig;