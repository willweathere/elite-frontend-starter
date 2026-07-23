// providers/ai-provider.js
// -----------------------------------------------------------------------------
// EXAMPLE stub for a swappable AI image provider. It is NOT used by default.
// Its only job is to prove the swap works: set IMAGE_PROVIDER=ai and the rest of
// the project calls this instead of the local renderer — no other code changes.
//
// To make it real, implement the body of generateImage() with your chosen image
// API (for example an image-generation endpoint), build the prompt from the
// brand rules that are passed in, download the result to `outPath`, and return
// `outPath`. Read the API key from an environment variable / GitHub Secret —
// never hard-code it.
//
//   Interface (identical to every provider):
//     generateImage({ post, brand, outPath, size }) -> Promise<outPath>
// -----------------------------------------------------------------------------

export async function generateImage({ post, brand, outPath, size }) {
  const apiKey = process.env.IMAGE_API_KEY;

  // Build the kind of prompt you would send, straight from the brand files, so
  // any provider stays on-brand. (Shown here to make the pattern obvious.)
  const prompt = [
    `Design a professional LinkedIn graphic for Westbury Collections (UK commercial debt recovery).`,
    `Topic: ${post.category} — headline "${post.headline.join(" ")}".`,
    `Follow these design rules:\n${brand.designRules}`,
    `Follow these image rules:\n${brand.imageRules}`,
    `Deep crimson background, champagne gold accents, elegant serif type, calm and premium.`,
    `Size: ${size}. No emojis, no fake logos, no warped text.`,
  ].join("\n\n");

  if (!apiKey) {
    throw new Error(
      "IMAGE_PROVIDER=ai selected but IMAGE_API_KEY is not set. " +
        "Add the key as a GitHub Secret, then implement the API call in " +
        "providers/ai-provider.js. (The default 'local' provider needs no key.)"
    );
  }

  // TODO: call your image API here using `prompt`, write the returned image to
  // `outPath`, and return it. Left unimplemented on purpose so the default
  // 'local' provider stays the one that runs.
  throw new Error(
    "ai-provider.js is a stub. Implement the API call to enable it. " +
      `Prompt was prepared (${prompt.length} chars).`
  );
}
