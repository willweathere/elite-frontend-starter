// list-channels.js
// -----------------------------------------------------------------------------
// Prints the Buffer channel id(s) connected to your account. Handy if you ever
// want to post to a specific channel via BUFFER_CHANNEL_IDS. (The daily post
// works without this — it finds the channel automatically.)
//
//     BUFFER_API_KEY=your_key_here npm run channels
// -----------------------------------------------------------------------------

import { getChannels } from "./buffer.js";

const token = process.env.BUFFER_API_KEY;
if (!token) {
  console.error("Set BUFFER_API_KEY first, e.g.  BUFFER_API_KEY=xxxx npm run channels");
  process.exit(1);
}

const channels = await getChannels(token);
if (channels.length === 0) {
  console.error("No channels found. Connect a channel in Buffer first.");
  process.exit(1);
}

console.log(`\nFound ${channels.length} Buffer channel(s):\n`);
for (const c of channels) {
  console.log(`  ${c.service}  ${c.displayName || c.name}${c.isQueuePaused ? "  (queue paused!)" : ""}`);
  console.log(`    id: ${c.id}\n`);
}
console.log("The daily post uses these automatically. To force a specific one,");
console.log("put its id in the BUFFER_CHANNEL_IDS secret.\n");
