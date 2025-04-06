/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: "images.pexels.com" }],
    domains: [
      "cdn.jsdelivr.net",
      "avatars.githubusercontent.com",
      "encrypted-tbn0.gstatic.com",
      "i.redd.it",
    ], // Allow images from jsDelivr
  },
};

export default nextConfig;
