export type StackFrame = {
  function?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  in_app?: boolean;
};

const LINE = /^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/;

/** V8 형식 스택을 Sentry 프레임으로 바꿉니다. Sentry는 오래된 호출부터 받으므로 순서를 뒤집습니다. */
export function parseStack(stack: string | undefined, limit = 50): StackFrame[] {
  if (!stack) return [];
  const frames: StackFrame[] = [];
  for (const line of stack.split("\n")) {
    const match = LINE.exec(line);
    if (!match) continue;
    const [, fn, filename = "", lineno, colno] = match;
    frames.push({
      function: fn || "?",
      filename,
      lineno: Number(lineno),
      colno: Number(colno),
      in_app: !filename.includes("node_modules") && !filename.startsWith("node:"),
    });
    if (frames.length >= limit) break;
  }
  return frames.reverse();
}
