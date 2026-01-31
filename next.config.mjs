/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "images.pexels.com" },
      { hostname: "res.cloudinary.com" },
    ],
    // keep legacy `domains` for any direct hostname usage
    domains: ["res.cloudinary.com"],
  },
};

export default nextConfig;
