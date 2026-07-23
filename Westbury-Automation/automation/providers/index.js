// providers/index.js
// -----------------------------------------------------------------------------
// The image-provider "swap point". Every provider is a module that exports one
// function with the SAME shape:
//
//     export async function generateImage({ post, brand, outPath, size }) -> outPath
//
// To swap providers you only change the IMAGE_PROVIDER environment variable (or
// add a new file here). Nothing else in the project needs to change.
//
//   IMAGE_PROVIDER=local   -> providers/local-canvas.js  (default, free, no API)
//   IMAGE_PROVIDER=ai      -> providers/ai-provider.js    (example stub)
// -----------------------------------------------------------------------------

const REGISTRY = {
  local: () => import("./local-canvas.js"),
  ai: () => import("./ai-provider.js"),
};

export async function getImageProvider(name = process.env.IMAGE_PROVIDER || "local") {
  const key = String(name).toLowerCase();
  const loader = REGISTRY[key];
  if (!loader) {
    throw new Error(
      `Unknown IMAGE_PROVIDER "${name}". Available: ${Object.keys(REGISTRY).join(", ")}.`
    );
  }
  const mod = await loader();
  if (typeof mod.generateImage !== "function") {
    throw new Error(`Provider "${key}" does not export generateImage().`);
  }
  return { name: key, generateImage: mod.generateImage };
}
