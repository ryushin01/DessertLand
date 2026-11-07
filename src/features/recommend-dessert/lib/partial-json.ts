/**
 * 스트리밍 중인 JSON의 끝을 닫아 지금까지 온 내용을 읽습니다.
 * 아직 끝나지 않은 키나 값은 버립니다. 읽을 수 없으면 null을 돌려줍니다.
 */
export function parsePartialJson(text: string): unknown {
  const closers: string[] = [];
  let inString = false;
  let escaped = false;
  // 안전하게 잘라도 되는 위치와 그때의 닫는 괄호 수입니다.
  let safeEnd = 0;
  let safeDepth = 0;
  let stringStart = -1;
  let stringIsValue = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') {
        inString = false;
        // 키가 아니라 값일 때만 안전한 위치입니다.
        if (stringIsValue) {
          safeEnd = index + 1;
          safeDepth = closers.length;
        }
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      stringStart = index;
      // 콜론 뒤이거나 배열 안의 문자열만 값입니다.
      stringIsValue =
        text.slice(0, index).trimEnd().endsWith(":") || closers[closers.length - 1] === "]";
    } else if (char === "{" || char === "[") {
      closers.push(char === "{" ? "}" : "]");
      safeEnd = index + 1;
      safeDepth = closers.length;
    } else if (char === "}" || char === "]") {
      closers.pop();
      safeEnd = index + 1;
      safeDepth = closers.length;
    } else if (char === ",") {
      safeEnd = index;
      safeDepth = closers.length;
    }
  }

  const close = (head: string, depth: number) => head + closers.slice(0, depth).reverse().join("");

  // 값 문자열이 쓰이는 중이면 그 문자열까지 닫아 글자가 흘러나오는 것처럼 보여 줍니다.
  if (inString && stringStart >= 0) {
    let partial = text.slice(stringStart + 1);
    if (escaped) partial = partial.slice(0, -1);
    partial = partial.replace(/\\u[0-9a-fA-F]{0,3}$/, "");
    const before = text.slice(0, stringStart).trimEnd();
    if (before.endsWith(":")) {
      try {
        return JSON.parse(close(`${before}"${partial}"`, closers.length));
      } catch {
        // 아래의 안전한 위치로 되돌아갑니다.
      }
    }
  }
  try {
    return JSON.parse(close(text.slice(0, safeEnd), safeDepth));
  } catch {
    return null;
  }
}
