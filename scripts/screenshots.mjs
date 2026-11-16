// README 화면(docs/images/*.jpg)을 다시 찍습니다. Stripe 결제 화면(payment.jpg)은 Stripe가 그리는 화면이라 찍지 않습니다.
// 먼저 Stripe 키 없이 프로덕션 빌드를 띄워 두세요(내장 테스트 결제창으로 주문 완료까지 갑니다): pnpm build && pnpm start
// 사용: BASE_URL=http://localhost:3000 pnpm screenshots
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "docs/images";
const browser = await chromium.launch();

async function open(path, viewport = { width: 1440, height: 900 }, scale = 1) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: scale, isMobile: scale > 1 });
  const page = await context.newPage();
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  return { page, context };
}

/** 화면에 보이는 이미지를 다 받고 그릴 준비가 될 때까지 기다립니다(최대 10초). */
async function imagesReady(page) {
  await page
    .waitForFunction(
      () =>
        [...document.images]
          .filter((image) => {
            const rect = image.getBoundingClientRect();
            return rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0;
          })
          .every((image) => image.complete && image.naturalWidth > 0),
      null,
      { timeout: 10_000 },
    )
    .catch(() => console.warn("일부 이미지를 기다리다 제한 시간이 지났습니다."));
  // 화면에 보이는 이미지만 그릴 준비를 마칩니다(지연 로딩 중인 이미지까지 풀면 오래 걸림).
  await page.evaluate(() =>
    Promise.race([
      Promise.all(
        [...document.images]
          .filter((image) => {
            const rect = image.getBoundingClientRect();
            return image.complete && rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0;
          })
          .map((image) => image.decode().catch(() => {})),
      ),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]),
  );
}

async function shot(page, name, options = {}) {
  await imagesReady(page);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 82, ...options });
  console.log("저장", name);
}

/** 커서 연출(링)이 글자를 가리지 않게 마우스를 빈 구석으로 옮깁니다. */
async function parkCursor(page) {
  const { width, height } = page.viewportSize();
  await page.mouse.move(width - 40, height - 40, { steps: 8 });
  await page.waitForTimeout(800);
}

/** 스크롤 위치로 옮긴 뒤 연출이 따라올 때까지 기다립니다. */
async function scrollTo(page, y, wait = 2000) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
  await page.waitForTimeout(wait);
}

/** 화면에서 이 글자가 쓰인 가장 큰 요소가 화면 위쪽 ratio 높이에 오게 합니다. */
async function scrollToHeading(page, text, ratio) {
  const y = await page.evaluate(
    ([label, at]) => {
      const element = [...document.querySelectorAll("h1, h2, h3, p, span, a")]
        .filter((el) => el.textContent?.trim() === label)
        .sort((a, b) => parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize))[0];
      if (!element) throw new Error(`${label}을(를) 찾지 못했습니다.`);
      return element.getBoundingClientRect().top + window.scrollY - window.innerHeight * at;
    },
    [text, ratio],
  );
  await scrollTo(page, y);
}

/** 이 글자가 든 section의 진행도(0~1) 위치로 옮깁니다. */
async function scrollToSection(page, text, progress) {
  const y = await page.evaluate(
    ([label, ratio]) => {
      const section = [...document.querySelectorAll("main section")].find((el) => el.textContent?.includes(label));
      if (!section) throw new Error(`${label} 구역을 찾지 못했습니다.`);
      const top = section.getBoundingClientRect().top + window.scrollY;
      return top + Math.max(0, section.offsetHeight - window.innerHeight) * ratio;
    },
    [text, progress],
  );
  await scrollTo(page, y, 2500);
}

// 홈
{
  const { page, context } = await open("/ko");
  await page.waitForTimeout(2000);
  await shot(page, "home-hero");
  await scrollToHeading(page, "팬케이크·튀김", -0.45);
  await shot(page, "home-category");
  await scrollToSection(page, "SWEET", 0.05);
  await shot(page, "home-zoom");
  await scrollToSection(page, "세계 디저트 여행", 0.34);
  await shot(page, "home-world");
  await context.close();
}

// 상품 목록과 일본어 상세·장바구니
{
  const { page, context } = await open("/ko/shop");
  await scrollToHeading(page, "바스크 치즈케이크", 0.45);
  await shot(page, "shop");
  await context.close();
}
// 상품 목록의 찾기·맛 필터
{
  const { page, context } = await open("/ko/shop");
  await page.getByRole("searchbox", { name: "이름이나 나라로 찾기" }).fill("일본");
  await page.getByRole("group", { name: "맛" }).getByRole("button", { name: "가벼운 맛" }).click();
  await page.waitForTimeout(1500);
  await parkCursor(page);
  await shot(page, "shop-filters");
  await context.close();
}
{
  const { page, context } = await open("/ja/shop/strawberry-shortcake");
  await shot(page, "product-ja");
  await page.getByRole("button", { name: "カートに追加", exact: true }).click();
  await page.waitForTimeout(1500);
  await shot(page, "cart-ja");
  await context.close();
}

// 주문 완료: 내장 테스트 결제창으로 결제를 마칩니다(가상 주문자, 실제 청구 없음).
{
  const { page, context } = await open("/ko/checkout?buy=strawberry-shortcake&qty=1", { width: 1440, height: 1000 });
  await page.getByLabel("받는 분 이름").fill("홍길동");
  await page.getByLabel("이메일").fill("demo@example.com");
  await page.getByLabel("배송 주소").fill("서울시 가상구 예시로 1");
  await page.getByRole("radio", { name: "간편결제" }).check();
  await page.getByRole("button", { name: /결제하기$/ }).click();
  await page.getByRole("dialog", { name: "테스트 결제창" }).getByRole("button", { name: "결제 승인" }).click();
  await page.getByRole("heading", { level: 1, name: "주문이 완료되었습니다" }).waitFor();
  await page.waitForTimeout(1500);
  await parkCursor(page);
  await shot(page, "order-complete");
  // 주문 내역: 방금 한 테스트 결제가 이 브라우저의 주문으로 보입니다.
  await page.getByRole("link", { name: "주문 내역 보기" }).click();
  await page.getByRole("heading", { level: 1, name: "주문 내역" }).waitFor();
  await page.waitForTimeout(1500);
  await parkCursor(page);
  await shot(page, "orders");
  await context.close();
}

// 모바일 첫 화면
{
  const { page, context } = await open("/ko", { width: 390, height: 844 }, 2);
  await page.waitForTimeout(2000);
  await shot(page, "mobile-hero");
  await context.close();
}

await browser.close();
