type Messages = Record<string, unknown>;

/** 서버 컴포넌트와 메타데이터에서만 쓰는 묶음. 클라이언트로 보내지 않습니다. */
const SERVER_ONLY_NAMESPACES = new Set(["meta", "footer", "notFound"]);

/**
 * 클라이언트 컴포넌트에 넘길 메시지만 고릅니다.
 * 상품 설명(products.<slug>.description)은 상품 상세에서만 쓰므로 서버에서 번역해 속성으로 넘기고,
 * 여기서는 이름만 남깁니다. 모든 화면에 175종의 설명이 실리지 않게 합니다.
 */
export function pickClientMessages(messages: Messages): Messages {
  const picked: Messages = {};
  for (const [namespace, value] of Object.entries(messages)) {
    if (SERVER_ONLY_NAMESPACES.has(namespace)) continue;
    picked[namespace] = namespace === "products" ? productNames(value as Messages) : value;
  }
  return picked;
}

function productNames(products: Messages): Messages {
  return Object.fromEntries(
    Object.entries(products).map(([slug, value]) => [
      slug,
      { name: (value as { name: string }).name },
    ]),
  );
}
