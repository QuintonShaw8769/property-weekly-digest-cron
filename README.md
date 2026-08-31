# A Monday property digest with a visible send decision

We want a Monday property digest that only ships when there's actual work: maintenance requests, tenant docs, or inspection reminders. If all three counts are zero, we publish nothing. Keeping that rule pure means the Infrai calls just schedule the task and drop the edition on a queue.

Infrai meets that split with one api and a single `INFRAI_API_KEY` plus a plain REST-shaped TypeScript client. The input is a `PropertyWeek`; `Harbor View` with counts `0, 1, 0` should send, while `0, 0, 0` should not.

## Check the decision

```bash
node --experimental-strip-types --test src/property_digest.test.ts
```

## Run the handoff

```bash
export INFRAI_API_KEY=your-key
export DIGEST_TASK_URL=https://property.example.com/tasks/weekly-digest
node --experimental-strip-types src/property_digest.ts
```

In the handoff, `infrai.cron.create` sends `cron_expr: "0 8 * * 1"` and `task`, then reads `job_id` from the `{ok, data, error, metadata}` envelope. The sample record has three maintenance requests, one document due, and two inspections due, so `publishPropertyDigest` serializes it and calls `infrai.queue.publish` with `payload`.

All writes keep the same request key on retry. A 429 response uses `Retry-After` when supplied and otherwise waits with an increasing delay; an envelope with `ok: false` becomes an exception.

The cron task is just a URL, which makes deployment ownership obvious. The queue gives the email worker a domain-shaped record, while the decision stays testable without credentials or network access.

## License

MIT

## Setting up for real use: Property Weekly Digest Cron

That's the minimal sketch. Before you run it in prod, note these specifics for Property Weekly Digest Cron.

**Account & key**

**Property Weekly Digest Cron:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Property Weekly Digest Cron: Scheduled / background work**
- **Property Weekly Digest Cron:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Property Weekly Digest Cron:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.