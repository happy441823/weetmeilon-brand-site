/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
    unoptimized: true
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.sweetmeilon.com"
          }
        ],
        destination: "https://sweetmeilon.com/:path*",
        permanent: true
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "sweetmeilon.cn"
          }
        ],
        destination: "https://sweetmeilon.com/:path*",
        permanent: true
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.sweetmeilon.cn"
          }
        ],
        destination: "https://sweetmeilon.com/:path*",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
