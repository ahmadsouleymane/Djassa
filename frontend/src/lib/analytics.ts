const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const INGEST_URL = `${BASE_URL}/api/analytics/ingest`;

const VISITOR_KEY = "djassa_visitor_id";
const SESSION_KEY = "djassa_session_id";
const FLUSH_INTERVAL_MS = 8000;

type TrackedEvent = {
  type: "pageview" | "click" | "error" | "session_start" | "session_end";
  path?: string;
  targetId?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

function uuid(): string {
  return crypto.randomUUID();
}

function getVisitorId(): { id: string; isReturning: boolean } {
  if (typeof window === "undefined") return { id: "server", isReturning: false };
  const existing = localStorage.getItem(VISITOR_KEY);
  if (existing) return { id: existing, isReturning: true };
  const id = uuid();
  localStorage.setItem(VISITOR_KEY, id);
  return { id, isReturning: false };
}

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = uuid();
  sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

const visitor = typeof window !== "undefined" ? getVisitorId() : { id: "server", isReturning: false };
const sessionId = typeof window !== "undefined" ? getSessionId() : "server";
const sessionStart = Date.now();

let queue: TrackedEvent[] = [];
let entryPath: string | undefined;
let lastPath: string | undefined;
let authToken: string | null = null;

export function setAnalyticsAuthToken(token: string | null) {
  authToken = token;
}

function buildPayload() {
  return {
    sessionId,
    visitorId: visitor.id,
    isReturning: visitor.isReturning,
    referrer: entryPath ? undefined : document.referrer || undefined,
    entryPath,
    exitPath: lastPath,
    durationSeconds: Math.round((Date.now() - sessionStart) / 1000),
    events: queue,
  };
}

function flush(useBeacon = false) {
  if (typeof window === "undefined" || queue.length === 0) return;
  const payload = buildPayload();
  queue = [];

  const body = JSON.stringify(payload);
  if (useBeacon && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(INGEST_URL, blob);
    return;
  }

  fetch(INGEST_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Le tracking ne doit jamais faire échouer l'expérience utilisateur.
  });
}

function push(event: TrackedEvent) {
  queue.push(event);
  if (queue.length >= 20) flush();
}

export function trackPageview(path: string) {
  if (!entryPath) entryPath = path;
  lastPath = path;
  push({ type: "pageview", path, createdAt: new Date().toISOString() });
}

export function trackClick(targetId: string, metadata?: Record<string, unknown>) {
  push({ type: "click", path: lastPath, targetId, metadata, createdAt: new Date().toISOString() });
}

export function trackError(message: string, metadata?: Record<string, unknown>) {
  push({ type: "error", path: lastPath, message: message.slice(0, 2000), metadata, createdAt: new Date().toISOString() });
  flush();
}

export function initAnalytics() {
  if (typeof window === "undefined") return;

  const interval = setInterval(() => flush(), FLUSH_INTERVAL_MS);

  const onHide = () => {
    if (document.visibilityState === "hidden") flush(true);
  };
  window.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", () => flush(true));

  window.addEventListener("error", (e) => {
    trackError(e.message || "Erreur JavaScript non gérée", {
      source: e.filename,
      line: e.lineno,
      col: e.colno,
    });
  });
  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason instanceof Error ? e.reason.message : String(e.reason);
    trackError(reason || "Promesse rejetée non gérée", { kind: "unhandledrejection" });
  });

  return () => {
    clearInterval(interval);
    window.removeEventListener("visibilitychange", onHide);
  };
}
