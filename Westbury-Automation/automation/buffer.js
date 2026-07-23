// buffer.js
// -----------------------------------------------------------------------------
// Sends a finished post (caption + image URL) to Buffer, which then publishes it
// to the connected social account on schedule.
//
// SECURITY: the API key and profile IDs are read ONLY from environment variables
// (GitHub Secrets). They are never written to disk, never logged, and never
// committed. Do not pass them as function arguments from other files.
//
//   Required environment variables:
//     BUFFER_API_KEY      - your Buffer access token
//     BUFFER_PROFILE_IDS  - comma-separated Buffer profile id(s) to post to
//   Optional:
//     DRY_RUN=true        - prepare the request but do NOT actually send it
// -----------------------------------------------------------------------------

const BUFFER_API = "https://api.bufferapp.com/1/updates/create.json";

// Buffer needs a publicly reachable image URL (it fetches the image itself).
// This project provides that by committing the PNG to the repo and using its
// raw GitHub URL — see scheduler.js and the workflow.
export async function publishToBuffer({ text, imageUrl, altText } = {}) {
  const token = process.env.BUFFER_API_KEY;
  const profileIds = (process.env.BUFFER_PROFILE_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const dryRun = String(process.env.DRY_RUN).toLowerCase() === "true";

  // --- validate inputs before doing anything ---
  if (!text || !text.trim()) throw new Error("publishToBuffer: 'text' is empty.");
  if (!dryRun && !token) {
    throw new Error("publishToBuffer: BUFFER_API_KEY is not set (add it as a GitHub Secret).");
  }
  if (!dryRun && profileIds.length === 0) {
    throw new Error(
      "publishToBuffer: BUFFER_PROFILE_IDS is not set. Add the id(s) of the Buffer " +
        "channel(s) to post to, comma-separated, as a GitHub Secret."
    );
  }

  // --- build the form body (Buffer's classic API is form-encoded) ---
  const body = new URLSearchParams();
  body.set("text", text);
  for (const id of profileIds) body.append("profile_ids[]", id);
  if (imageUrl) {
    body.set("media[photo]", imageUrl);
    body.set("media[thumbnail]", imageUrl);
    if (altText) body.set("media[description]", altText);
  }

  if (dryRun) {
    console.log("[buffer] DRY_RUN — not sending. Prepared post:");
    console.log("         profiles:", profileIds.length ? profileIds : "(none set)");
    console.log("         imageUrl:", imageUrl || "(none)");
    console.log("         text:", text.slice(0, 80).replace(/\n/g, " ") + "…");
    return { success: true, dryRun: true };
  }

  // --- send, with a timeout and clear error handling ---
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let res;
  try {
    res = await fetch(BUFFER_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw new Error("publishToBuffer: request to Buffer timed out.");
    throw new Error(`publishToBuffer: network error contacting Buffer — ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }

  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = { raw }; }

  if (!res.ok) {
    // Do not print the token; only the response body from Buffer.
    throw new Error(
      `publishToBuffer: Buffer returned HTTP ${res.status}. ` +
        `Response: ${JSON.stringify(data)}`
    );
  }
  if (data && data.success === false) {
    throw new Error(`publishToBuffer: Buffer rejected the post — ${data.message || raw}`);
  }

  console.log("[buffer] Post sent to Buffer queue.");
  return data;
}
