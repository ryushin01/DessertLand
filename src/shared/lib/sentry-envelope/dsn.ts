export type ParsedDsn = {
  publicKey: string;
  host: string;
  projectId: string;
  /** 이 프로젝트로 이벤트 묶음(envelope)을 보낼 주소입니다. */
  envelopeUrl: string;
};

/** https://<공개 키>@<호스트>/<프로젝트 ID> 형식의 DSN을 풉니다. 형식이 다르면 null입니다. */
export function parseDsn(dsn: string | undefined | null): ParsedDsn | null {
  if (!dsn) return null;
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.split("/").filter(Boolean).pop();
    if (url.protocol !== "https:" || !url.username || !projectId || !/^\d+$/.test(projectId)) {
      return null;
    }
    const prefix = url.pathname.slice(0, url.pathname.lastIndexOf(`/${projectId}`));
    return {
      publicKey: url.username,
      host: url.host,
      projectId,
      envelopeUrl: `https://${url.host}${prefix}/api/${projectId}/envelope/?sentry_version=7&sentry_key=${encodeURIComponent(url.username)}`,
    };
  } catch {
    return null;
  }
}
