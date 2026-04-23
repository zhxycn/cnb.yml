import type { NextConfig } from "next";

const hasCnbToken = !!process.env.CNB_TOKEN;

const nextConfig: NextConfig = {
  reactCompiler: true,
  ...(hasCnbToken ? {} : { output: "export" as const }),
  env: {
    NEXT_PUBLIC_AI_ENABLED: hasCnbToken ? "1" : "",
  },
  allowedDevOrigins: ["*.cnb.run"],
};

export default nextConfig;
