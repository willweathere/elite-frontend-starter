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

// Fetch all channels on the account (across every organization). Used to auto-
// discover where to post when BUFFER_CHANNEL_IDS is not set.
export async function getChannels(token) {
  const orgData = await bufferGraphQL(
    `query { account { organizations { id name } } }`,
    token
  );
  const orgs = orgData?.account?.organizations || [];
  const channels = [];
  for (const org of orgs) {
    const d = await bufferGraphQL(
      `query { channels(input: { organizationId: ${JSON.stringify(org.id)} }) {
         id name displayName service isQueuePaused } }`,
      token
    );
    for (const c of d?.channels || []) channels.push({ ...c, organization: org.name });
  }
  return channels;
}

// Build the createPost mutation. Values are JSON-stringified so quotes, newlines
// and other characters in the caption are safely escaped. Enums stay unquoted.
// mode: "addToQueue" (posts at your Buffer schedule) or "shareNow" (posts now).
function createPostMutation({ text, channelId, imageUrl, mode }) {
  const assets = imageUrl ? `assets: [{ image: { url: ${JSON.stringify(imageUrl)} } }]` : "";
  return `
    mutation {
      createPost(input: {
        text: ${JSON.stringify(text)}
        channelId: ${JSON.stringify(channelId)}
        schedulingType: automatic
        mode: ${mode}
        ${assets}
      }) {
        ... on PostActionSuccess { post { id status } }
        ... on MutationError { message }
      }
    }`;
}

// Character limits per platform. Only trim where the platform actually needs it;
// LinkedIn allows long posts, so it keeps the full caption.
const CHAR_LIMIT = { twitter: 280, x: 280 };

// Trim a caption to a limit at a sentence or word boundary, adding an ellipsis.
export function trimForLimit(text, limit) {
  const t = text.trim();
  if ([...t].length <= limit) return t;
  const room = limit - 1; // leave space for the ellipsis
  let slice = t.slice(0, room);
  // Prefer to end on a sentence; otherwise fall back to a word boundary.
  const lastStop = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("? "), slice.lastIndexOf("! "));
  if (lastStop > room * 0.5) return slice.slice(0, lastStop + 1);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > room * 0.5) slice = slice.slice(0, lastSpace);
  return slice.replace(/[\s,;:.\-–—]+$/, "") + "…";
}

export async function publishToBuffer({ text, imageUrl } = {}) {
  const token = process.env.BUFFER_API_KEY;
  let channelIds = (process.env.BUFFER_CHANNEL_IDS || process.env.BUFFER_PROFILE_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const dryRun = String(process.env.DRY_RUN).toLowerCase() === "true";
  // How to publish: addToQueue (default) or shareNow (post immediately).
  const modeRaw = (process.env.BUFFER_POST_MODE || "addToQueue").trim();
  const mode = ["addToQueue", "shareNow"].includes(modeRaw) ? modeRaw : "addToQueue";

  if (!text || !text.trim()) throw new Error("publishToBuffer: 'text' is empty.");
  if (!dryRun && !token) {
    throw new Error("publishToBuffer: BUFFER_API_KEY is not set (add it as a GitHub Secret).");
  }

  // Look up the account's channels once. This gives us both auto-discovery (when
  // no id is provided) and each channel's service, so we can respect per-platform
  // limits like Twitter/X's 280 characters.
  let allChannels = [];
  if (!dryRun && token) allChannels = await getChannels(token).catch(() => []);
  const serviceOf = new Map(
    allChannels.map((c) => [c.id, String(c.service || "").toLowerCase()])
  );

  if (!dryRun && channelIds.length === 0) {
    channelIds = allChannels.map((c) => c.id);
    if (channelIds.length) {
      console.log(
        `[buffer] Auto-discovered ${channelIds.length} channel(s): ` +
          allChannels.map((c) => `${c.service} (${c.displayName || c.name})`).join(", ")
      );
    }
  }
  if (!dryRun && channelIds.length === 0) {
    throw new Error(
      "publishToBuffer: no Buffer channels found. Connect a channel in Buffer, or set " +
        "BUFFER_CHANNEL_IDS. Run the 'Find Buffer Channels' workflow to see what is connected."
    );
  }

  if (dryRun) {
    console.log("[buffer] DRY_RUN — not sending. Prepared post:");
    console.log("         mode:    ", mode);
    console.log("         channels:", channelIds.length ? channelIds : "(none set)");
    console.log("         imageUrl:", imageUrl || "(none)");
    console.log("         text:", text.slice(0, 80).replace(/\n/g, " ") + "…");
    return { success: true, dryRun: true };
  }

  // The new API posts to one channel at a time — loop over the requested ids,
  // trimming the caption to fit each platform's character limit.
  const results = [];
  for (const channelId of channelIds) {
    const service = serviceOf.get(channelId) || "unknown";
    const limit = CHAR_LIMIT[service];
    let outText = text;
    if (limit) {
      outText = trimForLimit(text, limit);
      if (outText !== text.trim()) {
        console.log(`[buffer] Caption trimmed to ${[...outText].length} chars for ${service}.`);
      }
    }
    const data = await bufferGraphQL(
      createPostMutation({ text: outText, channelId, imageUrl, mode }),
      token
    );
    const r = data && data.createPost;
    if (r && r.message) {
      throw new Error(`Buffer rejected the post for channel ${channelId}: ${r.message}`);
    }
    const verb = mode === "shareNow" ? "posted now" : "queued";
    console.log(`[buffer] Post ${verb} for channel ${channelId} (id: ${r?.post?.id || "?"}).`);
    results.push(r);
  }
  return results;
}
