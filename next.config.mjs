/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: "images.pexels.com" }],
    domains: ["cdn.jsdelivr.net", "avatars.githubusercontent.com"], // Allow images from jsDelivr
  },
};

export default nextConfig;
