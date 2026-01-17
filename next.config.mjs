/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['lucide-react'],
  env: {
    API_KEY: process.env.API_KEY,
  }
};

export default nextConfig;