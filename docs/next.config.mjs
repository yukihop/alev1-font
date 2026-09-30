/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  transpilePackages: ['@alev/data'],
  agentRules: false,
};

export default nextConfig;
