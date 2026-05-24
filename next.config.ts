import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // jsPDF 2.x opsional dependencies yang tidak kita pakai
      html2canvas: "./src/lib/empty-module.js",
      dompurify: "./src/lib/empty-module.js",
      canvg: "./src/lib/empty-module.js",
    },
  },
};

export default nextConfig;
