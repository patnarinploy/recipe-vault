

const nextConfig = {
  async redirects() {
    return [
      { source: "/settings/dropdowns", destination: "/settings/presets", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
