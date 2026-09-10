import { apiUrl, authHeaders } from "./pages/teacher/apiClient";

export type AppEventScope = "notification" | "assignment";

const EVENT_NAME = "app:event";
const RECONNECT_DELAY_MS = 3000;
const ALL_SCOPES: AppEventScope[] = ["notification", "assignment"];

let abortController: AbortController | null = null;

function dispatch(scope: AppEventScope) {
  window.dispatchEvent(new CustomEvent<{ scope: AppEventScope }>(EVENT_NAME, { detail: { scope } }));
}

async function readStream(signal: AbortSignal): Promise<void> {
  const res = await fetch(apiUrl("/api/events/stream"), {
    headers: { ...authHeaders(), Accept: "text/event-stream" },
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error("STREAM_FAILED");
  }

  // A fresh connection (first load, or reconnect after a drop) can't tell
  // what it missed while disconnected, so treat "just connected" itself as
  // a signal to resync everything once — this is what lets us run without
  // any interval polling as a fallback.
  ALL_SCOPES.forEach(dispatch);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let separatorIndex: number;
    while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      const dataLine = rawEvent.split("\n").find((line) => line.startsWith("data:"));
      if (!dataLine) continue;

      try {
        const parsed: { scope: AppEventScope } = JSON.parse(dataLine.slice(5).trim());
        dispatch(parsed.scope);
      } catch {
        // ignore malformed event
      }
    }
  }
}

async function connectLoop(signal: AbortSignal): Promise<void> {
  while (!signal.aborted) {
    try {
      await readStream(signal);
    } catch {
      // connection dropped or failed — fall through to retry below
    }
    if (signal.aborted) break;
    await new Promise((resolve) => setTimeout(resolve, RECONNECT_DELAY_MS));
  }
}

export function connectEventStream(): void {
  if (abortController || !localStorage.getItem("token")) return;
  abortController = new AbortController();
  connectLoop(abortController.signal);
}

export function disconnectEventStream(): void {
  abortController?.abort();
  abortController = null;
}

export function onAppEvent(handler: (scope: AppEventScope) => void): () => void {
  function listener(e: Event) {
    handler((e as CustomEvent<{ scope: AppEventScope }>).detail.scope);
  }
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

window.addEventListener("auth-changed", () => {
  if (localStorage.getItem("token")) {
    connectEventStream();
  } else {
    disconnectEventStream();
  }
});
