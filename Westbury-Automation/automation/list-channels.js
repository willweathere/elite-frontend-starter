// list-channels.js
// -----------------------------------------------------------------------------
// Helper: prints the Buffer channel id(s) connected to your account, so you can
// copy them into the BUFFER_CHANNEL_IDS secret.
//
// Uses Buffer's current GraphQL API. It first finds your organization, then
// lists the channels in it.
//
// Run it with your key supplied as an environment variable (never hard-coded):
//
//     BUFFER_API_KEY=your_key_here npm run channels
//
// It only READS your account. It does not post anything.
// -----------------------------------------------------------------------------

import { bufferGraphQL } from "./buffer.js";

const token = process.env.BUFFER_API_KEY;
if (!token) {
  console.error("Set BUFFER_API_KEY first, e.g.  BUFFER_API_KEY=xxxx npm run channels");
  process.exit(1);
}

// 1. Find the organization(s) on the account.
const orgData = await bufferGraphQL(
  `query { account { organizations { id name ownerEmail } } }`,
  token
);
const orgs = orgData?.account?.organizations || [];
if (orgs.length === 0) {
  console.error("No organizations found on this Buffer account.");
  process.exit(1);
}

// 2. For each organization, list its channels.
const allIds = [];
for (const org of orgs) {
  console.log(`\nOrganization: ${org.name} (${org.id})`);
  const chData = await bufferGraphQL(
    `query { channels(input: { organizationId: ${JSON.stringify(org.id)} }) {
        id name displayName service isQueuePaused } }`,
    token
  );
  const channels = chData?.channels || [];
  if (channels.length === 0) {
    console.log("  (no channels connected — connect one in Buffer first)");
    continue;
  }
  for (const c of channels) {
    console.log(`\n  ${c.service}  ${c.displayName || c.name}`);
    console.log(`    id: ${c.id}${c.isQueuePaused ? "   (queue paused!)" : ""}`);
    allIds.push(c.id);
  }
}

if (allIds.length) {
  console.log("\n----------------------------------------------------------");
  console.log("Copy the id you want into the BUFFER_CHANNEL_IDS secret.");
  console.log("To post to ALL channels above, use:\n");
  console.log(`  ${allIds.join(",")}\n`);
}
