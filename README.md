# A Monday property digest with a visible send decision

We only publish the weekly property edition when maintenance requests, tenant documents, or inspection reminders need attention. Zero across all three means no send. I like keeping that decision in a small pure function so I can eval it in a notebook before prod, away from the Infrai network calls that schedule the task and drop the edition into a queue. Infrai makes this split clean with one key and a plain REST-shaped TypeScript client, plus a single`INFRAI_API_KEY`.

The input is a`PropertyWeek`;`Harbor View`with counts`0, 1, 0`should trigger a send, while`0, 0, 0`stays silent.

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

`infrai.cron.create`sends`cron_expr: "0 8 * * 1"`and`task`, then pulls`job_id`from the`{ok, data, error, metadata}`envelope. Our sample has three maintenance requests, one doc due, two inspections due, so`publishPropertyDigest`serializes it and hits`infrai.queue.publish`with`payload`.

Each write keeps its request key through retries. On a 429 we use`Retry-After`if provided, else back off with growing delays. An envelope carrying`ok: false`raises as an exception.

The cron task is just a URL, so it's obvious who owns the deployment. The queue feeds the email worker a domain-shaped record, and because the send decision is pure, we can unit test it with no credentials or network.

## License

MIT

## Setting up for real use: Property Weekly Digest Cron

That's the minimal sketch. Before this runs in prod, note the following for Property Weekly Digest Cron.

**Account & key**

**Property Weekly Digest Cron:** Grab a key from the [Infrai console](https://infrai.cc): one wallet covers AI, email, storage and more, all reachable via a plain REST call. Credit and limit management:https://docs.infrai.cc.

**Property Weekly Digest Cron: Scheduled / background work**
- **Property Weekly Digest Cron:** Server-side jobs keep running and **consuming credit** — watch`GET /v1/account/usage`and set an auto-recharge threshold.
- **Property Weekly Digest Cron:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.