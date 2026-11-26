/**
 * Framework-agnostic validation for optional seller-supplied GLB/GLTF assets.
 * Models are genuine 3D files — ordinary product photographs are never
 * presented as 3D models.
 */

export const MODEL_FORMATS = ["GLB", "GLTF"] as const;
export type ModelFormat = (typeof MODEL_FORMATS)[number];

export const MODEL_EXTENSIONS = ["glb", "gltf"] as const;
export const ASSET_EXTENSIONS = ["bin", "png", "jpg", "jpeg", "webp"] as const;

export const MAX_MODEL_BYTES = 25 * 1024 * 1024;
export const MAX_ASSET_BYTES = 10 * 1024 * 1024;
export const MAX_MODEL_ASSETS = 40;
export const MAX_MODEL_TOTAL_BYTES = 60 * 1024 * 1024;

const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,179}$/;

export function fileExtension(name: string): string {
  const index = name.lastIndexOf(".");
  return index === -1 ? "" : name.slice(index + 1).toLowerCase();
}

export function isSafeAssetName(name: string): boolean {
  return SAFE_NAME.test(name) && !name.includes("..");
}

export function modelFormatFromName(name: string): ModelFormat | null {
  const extension = fileExtension(name);
  if (extension === "glb") return "GLB";
  if (extension === "gltf") return "GLTF";
  return null;
}

export function isSupportedAssetName(name: string): boolean {
  return (
    isSafeAssetName(name) &&
    (ASSET_EXTENSIONS as readonly string[]).includes(fileExtension(name))
  );
}

/** Public IDs must come from the seller-bound signed folder issued by the server. */
export function isOwnedModelPublicId(publicId: string, userId: string): boolean {
  const prefix = `models/${userId}/`;
  if (!publicId.startsWith(prefix)) return false;
  const name = publicId.slice(prefix.length);
  return name.length > 0 && !name.includes("/") && isSafeAssetName(name);
}

export function isCloudinaryAssetUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

/**
 * Reads the external references inside a .gltf document. GLB files embed their
 * buffers and textures, so they need no supporting assets.
 */
export function referencedAssetUris(gltfText: string): string[] {
  try {
    const document = JSON.parse(gltfText) as {
      buffers?: Array<{ uri?: unknown }>;
      images?: Array<{ uri?: unknown }>;
    };
    return [...(document.buffers ?? []), ...(document.images ?? [])]
      .map((entry) => entry.uri)
      .filter((uri): uri is string => typeof uri === "string" && uri.length > 0 && !uri.startsWith("data:"));
  } catch {
    return [];
  }
}

/** Basename fallback so nested gltf references can match flat asset uploads. */
export function assetBaseName(uri: string): string {
  let decoded = uri;
  try {
    decoded = decodeURIComponent(uri);
  } catch {
    decoded = uri;
  }
  return decoded.split(/[\\/]/).pop() ?? uri;
}

/**
 * Returns a loader URL modifier that preserves the main model URL while mapping
 * .gltf references to validated Cloudinary assets. Without the root check the
 * modifier would also blank the GLB/GLTF URL itself.
 */
export function createModelUrlResolver(
  modelUrl: string,
  assets: ReadonlyArray<{ uri: string; url: string }>,
): (requested: string) => string {
  const base =
    typeof window === "undefined"
      ? "http://localhost/"
      : window.location.href;
  let modelAbsoluteUrl: string;
  try {
    modelAbsoluteUrl = new URL(modelUrl, base).href;
  } catch {
    modelAbsoluteUrl = modelUrl;
  }

  return (requested: string) => {
    if (requested === modelUrl || requested === modelAbsoluteUrl) return requested;
    let absolute: string | null = null;
    try {
      absolute = new URL(requested, modelAbsoluteUrl).href;
    } catch {
      return "";
    }
    if (absolute === modelAbsoluteUrl) return requested;
    return resolveModelAssetUrl(requested, assets, modelUrl);
  };
}

/**
 * Maps a .gltf reference to the Cloudinary URL of its uploaded asset. Only
 * previously validated asset URLs can be returned, so a malicious .gltf cannot
 * make the browser fetch an arbitrary external origin.
 */
export function resolveModelAssetUrl(
  requested: string,
  assets: ReadonlyArray<{ uri: string; url: string }>,
  baseUrl?: string,
): string {
  const direct = assets.find((asset) => asset.uri === requested);
  if (direct && isCloudinaryAssetUrl(direct.url)) return direct.url;
  const base = assetBaseName(requested);
  const byName = assets.find((asset) => assetBaseName(asset.uri) === base);
  if (byName && isCloudinaryAssetUrl(byName.url)) return byName.url;

  // Only URLs explicitly collected from the seller's validated upload may load.
  // A .gltf cannot make the browser fetch an unvalidated origin or asset.
  void baseUrl;
  return "";
}

export function missingAssetUris(uris: string[], uploadedNames: string[]): string[] {
  const uploaded = new Set(uploadedNames.map((name) => assetBaseName(name)));
  return uris.filter((uri) => !uploaded.has(assetBaseName(uri)));
}
