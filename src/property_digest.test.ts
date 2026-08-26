import assert from "node:assert/strict";
import test from "node:test";
import { shouldSendDigest } from "./property_digest.ts";
test("publishes when one follow-up is due", () => { assert.equal(shouldSendDigest({ property: "Harbor View", maintenanceRequests: 0, tenantDocumentsDue: 1, inspectionsDue: 0 }), true); assert.equal(shouldSendDigest({ property: "Harbor View", maintenanceRequests: 0, tenantDocumentsDue: 0, inspectionsDue: 0 }), false); });
