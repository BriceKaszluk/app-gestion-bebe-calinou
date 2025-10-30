/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co", // autorise tous les sous-domaines Supabase
      },
    ],
  },
};

module.exports = nextConfig;
