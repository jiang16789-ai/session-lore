/**
 * session-lore — real-time episodic memory for AI agents.
 *
 * Every inbound/outbound message is appended to a per-day episodic log file
 * immediately. Keeps agents from "forgetting a whole day" between daily
 * vectorization jobs.
 *
 * Key properties (learned the hard way in production):
 *  - Appends are capped per day (default 300 lines, oldest pruned first)
 *  - Failures are silent: memory logging must never break the message flow
 *  - Per-day files make both humans and vectorizers cheap to read
 *
 * @license MIT
 * @author chunjiang <chunjiang131419@163.com>
 */

import { appendFileSync, mkdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Directory where per-day memory files live. */
const MEMORY_DIR =
  process.env.SESSION_LORE_DIR ||
  join(process.env.HOME || process.cwd(), ".session-lore");

/** Max log lines kept per day (oldest pruned). */
const MAX_LINES = 300;

/** Max characters kept per message (truncation guard against token bombs). */
const MAX_MSG_CHARS = 300;

function dayStamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function timeStamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

function trim(s: string, n: number): string {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

/**
 * Append one log line to the per-day file, enforcing the line cap.
 * Throws nothing; failures are silently swallowed by design.
 */
export function appendEpisodicLine(file: string, line: string): void {
  try {
    mkdirSync(MEMORY_DIR, { recursive: true });
    let body = "";
    if (existsSync(file)) {
      body = readFileSync(file, "utf8");
      if (!body.includes("## 情景日志")) {
        body = body.trimEnd() + "\n\n## 情景日志\n";
      }
    } else {
      body = `# ${dayStamp()}\n\n## 情景日志\n`;
    }
    const lines = body.split("\n");
    const marker = lines.findIndex((l) => l.startsWith("## 情景日志"));
    const logLines = lines.slice(marker + 1).filter((l) => l.startsWith("- "));
    if (logLines.length >= MAX_LINES) {
      const cut = logLines.length - MAX_LINES + 10;
      const before = lines.slice(0, marker + 1).join("\n");
      const rest = logLines.slice(cut);
      writeFileSync(file, before + "\n" + rest.join("\n") + "\n");
    }
    appendFileSync(file, line + "\n");
  } catch {
    // Silent by design: episodic memory must never break the message flow.
  }
}

export interface MessageEvent {
  type?: string;
  action?: string;
  context?: {
    from?: string;
    to?: string;
    content?: string;
    success?: boolean;
  };
  timestamp?: string | number;
}

/**
 * OpenClaw-style hook handler. Attach to message:received and message:sent
 * events. Also usable as a standalone function from any agent framework.
 */
export async function handler(event: MessageEvent): Promise<void> {
  const { type, action, context } = event || {};
  const file = join(MEMORY_DIR, `${dayStamp()}.md`);
  const ts = timeStamp();
  try {
    if (type === "message" && action === "received") {
      const from = context?.from ?? "?";
      appendEpisodicLine(file, `- ${ts} 收[${from}]: ${trim(context?.content ?? "", MAX_MSG_CHARS)}`);
    } else if (type === "message" && action === "sent") {
      const to = context?.to ?? "?";
      const ok = context?.success === false ? "✗" : "";
      appendEpisodicLine(file, `- ${ts} 发[${to}]${ok}: ${trim(context?.content ?? "", MAX_MSG_CHARS)}`);
    }
  } catch {
    // Never throw.
  }
}

export default handler;
