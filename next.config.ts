import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/shared/i18n/request.ts");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { formats: ["image/avif", "image/webp"], qualities: [40, 75] },
  async headers() {
    return [
      {
        source: "/((?!storybook/).*)",
        headers: [...securityHeaders, { key: "X-Frame-Options", value: "DENY" }],
      },
      // Storybook은 미리보기를 같은 출처의 iframe으로 띄우므로 같은 출처 프레임만 허용합니다.
      {
        source: "/storybook/:path*",
        headers: [...securityHeaders, { key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
    ];
  },
  async redirects() {
    // 빌드할 때 만든 Storybook(public/storybook)은 정적 파일이라 폴더 주소로는 열리지 않아 index.html로 보냅니다.
    return [{ source: "/storybook", destination: "/storybook/index.html", permanent: false }];
  },
};

export default withNextIntl(nextConfig);
