// buffer.js
// -----------------------------------------------------------------------------
// Sends a finished post (caption + image URL) to Buffer using Buffer's current
// GraphQL API (https://api.buffer.com). Buffer then publishes it to the
// connected channel on your queue schedule.
//
// SECURITY: the API key and channel IDs are read ONLY from environment
// variables (GitHub Secrets). They are never written to disk, never logged,
// and never committed.
//
//   Required environment variables:
//     BUFFER_API_KEY       - your Buffer personal API key (Settings > API)
//     BUFFER_CHANNEL_IDS   - comma-separated channel id(s) to post to
//   Optional:
//     DRY_RUN=true         - prepare the request but do NOT actually send it
// -----------------------------------------------------------------------------

const BUFFER_API = "https://api.buffer.com";

// Low-level GraphQL caller. Throws on network, HTTP, or GraphQL errors.
export async function bufferGraphQL(query, token) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let res;
  try {
    res = await fetch(BUFFER_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Buffer request timed out.");
    throw new Error(`Network error contacting Buffer — ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }

  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = { raw }; }

  if (res.status === 401) {
    throw new Error(
      "Buffer returned 401 Unauthorized. Check BUFFER_API_KEY is a current " +
        "Buffer API key from Settings > API (not an old REST token)."
    );
  }
  if (!res.ok) throw new Error(`Buffer returned HTTP ${res.status}: ${JSON.stringify(data)}`);
  if (data.errors) throw new Error(`Buffer GraphQL error: ${JSON.stringify(data.errors)}`);
  return data.data;
}

// Build the createPost mutation. Values are JSON-stringified so quotes, newlines
// and other characters in the caption are safely escaped. Enums stay unquoted.
function createPostMutation({ text, channelId, imageUrl }) {
  const assets = imageUrl ? `assets: [{ image: { url: ${JSON.stringify(imageUrl)} } }]` : "";
  return `
    mutation {
      createPost(input: {
        text: ${JSON.stringify(text)}
        channelId: ${JSON.stringify(channelId)}
        schedulingType: automatic
        mode: addToQueue
        ${assets}
      }) {
        ... on PostActionSuccess { post { id status } }
        ... on MutationError { message }
      }
    }`;
}

export async function publishToBuffer({ text, imageUrl } = {}) {
  const token = process.env.BUFFER_API_KEY;
  const channelIds = (process.env.BUFFER_CHANNEL_IDS || process.env.BUFFER_PROFILE_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const dryRun = String(process.env.DRY_RUN).toLowerCase() === "true";

  if (!text || !text.trim()) throw new Error("publishToBuffer: 'text' is empty.");
  if (!dryRun && !token) {
    throw new Error("publishToBuffer: BUFFER_API_KEY is not set (add it as a GitHub Secret).");
  }
  if (!dryRun && channelIds.length === 0) {
    throw new Error(
      "publishToBuffer: BUFFER_CHANNEL_IDS is not set. Run `npm run channels` to find your " +
        "channel id(s), then add them (comma-separated) as a GitHub Secret."
    );
  }

  if (dryRun) {
    console.log("[buffer] DRY_RUN — not sending. Prepared post:");
    console.log("         channels:", channelIds.length ? channelIds : "(none set)");
    console.log("         imageUrl:", imageUrl || "(none)");
    console.log("         text:", text.slice(0, 80).replace(/\n/g, " ") + "…");
    return { success: true, dryRun: true };
  }

  // The new API posts to one channel at a time — loop over the requested ids.
  const results = [];
  for (const channelId of channelIds) {
    const data = await bufferGraphQL(createPostMutation({ text, channelId, imageUrl }), token);
    const r = data && data.createPost;
    if (r && r.message) {
      throw new Error(`Buffer rejected the post for channel ${channelId}: ${r.message}`);
    }
    console.log(`[buffer] Post queued for channel ${channelId} (id: ${r?.post?.id || "?"}).`);
    results.push(r);
  }
  return results;
}
