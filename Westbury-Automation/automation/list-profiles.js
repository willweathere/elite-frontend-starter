// list-profiles.js
// -----------------------------------------------------------------------------
// Helper: prints the Buffer profile id(s) connected to your account, so you can
// copy them into the BUFFER_PROFILE_IDS secret.
//
// Run it with your key supplied as an environment variable (never hard-coded):
//
//     BUFFER_API_KEY=your_token_here npm run profiles
//
// It only READS your profiles. It does not post anything.
// -----------------------------------------------------------------------------

const token = process.env.BUFFER_API_KEY;
if (!token) {
  console.error("Set BUFFER_API_KEY first, e.g.  BUFFER_API_KEY=xxxx npm run profiles");
  process.exit(1);
}

const res = await fetch("https://api.bufferapp.com/1/profiles.json", {
  headers: { Authorization: `Bearer ${token}` },
});

const raw = await res.text();
if (!res.ok) {
  console.error(`Buffer returned HTTP ${res.status}: ${raw}`);
  process.exit(1);
}

let profiles;
try {
  profiles = JSON.parse(raw);
} catch {
  console.error("Could not read Buffer's response:", raw);
  process.exit(1);
}

if (!Array.isArray(profiles) || profiles.length === 0) {
  console.error("No profiles found. Connect a channel in Buffer first.");
  process.exit(1);
}

console.log(`\nFound ${profiles.length} Buffer channel(s):\n`);
for (const p of profiles) {
  const name = p.formatted_username || p.formatted_service || "";
  console.log(`  ${p.service || "channel"}  ${name}`);
  console.log(`    id: ${p.id}\n`);
}

const ids = profiles.map((p) => p.id).join(",");
console.log("Copy the id you want into the BUFFER_PROFILE_IDS secret.");
console.log("To post to ALL of the above, use:\n");
console.log(`  ${ids}\n`);
