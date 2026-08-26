import { createHash } from "node:crypto";
import { infrai } from "./infrai.ts";
export type PropertyWeek = { property: string; maintenanceRequests: number; tenantDocumentsDue: number; inspectionsDue: number };
export function shouldSendDigest(w: PropertyWeek): boolean { return w.maintenanceRequests + w.tenantDocumentsDue + w.inspectionsDue > 0; }
const key = (p: string, v: string) => createHash("sha256").update(`${p}:${v}`).digest("hex");
export async function schedulePropertyDigest(task: string): Promise<string> { const job = await infrai.cron.create("0 8 * * 1", task, key("property-digest-cron", task)); return String(job.job_id ?? ""); }
export async function publishPropertyDigest(w: PropertyWeek): Promise<Record<string, unknown>> { if (!shouldSendDigest(w)) return { published: false }; const payload = { kind: "property-weekly-digest", ...w }; return { published: true, data: await infrai.queue.publish(payload, key("property-digest", JSON.stringify(payload))) }; }
if (import.meta.main) { const task = process.env.DIGEST_TASK_URL; if (!task) throw new Error("Set DIGEST_TASK_URL."); console.log(await schedulePropertyDigest(task)); console.log(await publishPropertyDigest({ property: "Harbor View", maintenanceRequests: 3, tenantDocumentsDue: 1, inspectionsDue: 2 })); }
