import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // jsPDF 2.x ESM bundle optionally requires html2canvas, dompurify, canvg
    // for its html() plugin — we don't use that plugin, so stub them out.
    config.resolve.alias = {
      ...config.resolve.alias,
      html2canvas: false,
      dompurify: false,
      canvg: false,
    };
    return config;
  },
};

export default nextConfig;
