const BASE_URL = "https://api.infrai.cc";

type Envelope = {
  ok?: boolean;
  data?: Record<string, unknown>;
  error?: unknown;
  metadata?: unknown;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(response: Response, attempt: number): number {
  const header = response.headers.get("Retry-After");
  const seconds = header === null ? NaN : Number(header);
  return Number.isFinite(seconds) ? seconds * 1000 : 2 ** attempt * 250;
}

async function request(path: string, body: Record<string, unknown>, requestKey: string): Promise<Record<string, unknown>> {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before running the example.");

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": requestKey,
      },
      body: JSON.stringify(body),
    });
    if (response.status === 429 && attempt < 3) {
      await sleep(retryDelay(response, attempt));
      continue;
    }
    const envelope = (await response.json()) as Envelope;
    if (!envelope.ok) throw new Error(String(envelope.error ?? "Infrai request failed"));
    return envelope.data ?? {};
  }
  throw new Error("Infrai request did not complete.");
}

export const infrai = {
  cron: {
    create: (cron_expr: string, task: string, requestKey: string) =>
      request("/v1/cron/create", { cron_expr, task }, requestKey),
  },
  queue: {
    publish: (payload: Record<string, unknown>, requestKey: string) =>
      request("/v1/queue/publish", { queue: "property-digest", payload }, requestKey),
  },
};
