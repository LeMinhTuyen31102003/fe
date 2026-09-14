import { apiUrl, authHeaders, handleSessionExpired } from "./pages/teacher/apiClient";

export type AppEventScope = "notification" | "assignment" | "tuition";

const EVENT_NAME = "app:event";
const RECONNECT_DELAY_MS = 3000;
const ALL_SCOPES: AppEventScope[] = ["notification", "assignment", "tuition"];

let abortController: AbortController | null = null;

/** The server rejected the token — retrying can never fix that. */
class StreamUnauthorizedError extends Error {
  constructor() {
    super("STREAM_UNAUTHORIZED");
    this.name = "StreamUnauthorizedError";
  }
}

function dispatch(scope: AppEventScope) {
  window.dispatchEvent(new CustomEvent<{ scope: AppEventScope }>(EVENT_NAME, { detail: { scope } }));
}

async function readStream(signal: AbortSignal): Promise<void> {
  const res = await fetch(apiUrl("/api/events/stream"), {
    headers: { ...authHeaders(), Accept: "text/event-stream" },
    signal,
  });
  if (res.status === 401 || res.status === 403) {
    throw new StreamUnauthorizedError();
  }
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
    } catch (err) {
      // A dead token is the one failure retrying can't recover from: without this
      // the loop would reconnect every few seconds forever, on every page —
      // including public ones like /login — since the loop outlives the component
      // that started it. Route it to the same place `apiFetch` sends an expired
      // session (clear it, toast, back to login) and stop; `handleSessionExpired`
      // fires `auth-changed`, whose listener below aborts this loop.
      if (err instanceof StreamUnauthorizedError) {
        handleSessionExpired();
        disconnectEventStream();
        return;
      }
      // anything else (server restart, network blip) — fall through to retry below
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
