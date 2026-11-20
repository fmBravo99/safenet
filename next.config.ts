/*import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "passion-wifi-basketball-seven.trycloudflare.com",
    "172.20.10.5",
    "damages-sapphire-state-verified.trycloudflare.com  ",
  ],
};

export default nextConfig;

*/



import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "172.20.10.5",
    "localhost",
  ],
};

export default nextConfig;
