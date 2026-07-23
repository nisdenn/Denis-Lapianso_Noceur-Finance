const nextConfig = {
  allowedDevOrigins: ['*'],
  reactStrictMode: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // output: 'standalone',
  experimental: { serverComponentsExternalPackages: ['google-auth-library', 'google-spreadsheet'] },
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = { ignored: /.*/ };
    }
    return config;
  },
};
export default nextConfig;
