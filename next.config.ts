import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/shared/i18n/request.ts");

const isDev = process.env.NODE_ENV !== "production";

/**
 * 콘텐츠 보안 정책. 정적 페이지를 유지하려고 nonce 대신 인라인 스크립트를 허용하지만,
 * 외부 출처는 한중일 웹 글꼴(Google Fonts)과 Vercel 미리보기 도구만 엽니다.
 * 플러그인, 다른 사이트의 프레임 삽입, base 주소 바꾸기, 다른 곳으로의 폼 전송은 막습니다.
 * Stripe 결제는 결제 페이지로 이동하는 방식이라 여기서 열 출처가 없습니다.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://vercel.live`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://vercel.live",
  "font-src 'self' data: https://fonts.gstatic.com https://vercel.live https://assets.vercel.com",
  "img-src 'self' data: blob: https://vercel.live https://vercel.com",
  `connect-src 'self' https://vercel.live wss://ws-us3.pusher.com${isDev ? " ws:" : ""}`,
  "frame-src https://vercel.live",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

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
        headers: [
          ...securityHeaders,
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
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
    return [
      { source: "/storybook", destination: "/storybook/index.html", permanent: false },
      // 출처 페이지는 README의 '출처' 표로 옮겼습니다. 예전 주소는 그곳으로 보냅니다.
      { source: "/:locale/credits", destination: "https://github.com/ryushin01/DessertLand#출처", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
