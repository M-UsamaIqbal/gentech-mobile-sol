import { describe, expect, it } from "vitest";

import {
  createModelUrlResolver,
  fileExtension,
  isCloudinaryAssetUrl,
  isOwnedModelPublicId,
  isSafeAssetName,
  isSupportedAssetName,
  missingAssetUris,
  modelFormatFromName,
  referencedAssetUris,
  resolveModelAssetUrl,
} from "@/lib/model-assets";

describe("3D model asset rules", () => {
  it("accepts only GLB and GLTF model files", () => {
    expect(modelFormatFromName("phone.glb")).toBe("GLB");
    expect(modelFormatFromName("PHONE.GLTF")).toBe("GLTF");
    expect(modelFormatFromName("phone.zip")).toBeNull();
    expect(fileExtension("phone.glb")).toBe("glb");
  });

  it("rejects traversal and unsafe asset names", () => {
    expect(isSafeAssetName("texture-1.png")).toBe(true);
    expect(isSafeAssetName("../secret.png")).toBe(false);
    expect(isSupportedAssetName("scene.bin")).toBe(true);
    expect(isSupportedAssetName("scene.exe")).toBe(false);
  });

  it("reads external references from GLTF but not embedded GLB data", () => {
    const gltf = JSON.stringify({
      buffers: [{ uri: "scene.bin" }, { uri: "data:application/octet-stream;base64,AA==" }],
      images: [{ uri: "textures/body.png" }],
    });
    expect(referencedAssetUris(gltf)).toEqual(["scene.bin", "textures/body.png"]);
    expect(referencedAssetUris("not json")).toEqual([]);
  });

  it("matches nested GLTF references to uploaded asset names", () => {
    expect(missingAssetUris(["scene.bin", "textures/body.png"], ["scene.bin", "body.png"])).toEqual(
      [],
    );
    expect(missingAssetUris(["scene.bin", "body.png"], ["body.png"])).toEqual(["scene.bin"]);
  });

  it("resolves assets only to validated Cloudinary URLs", () => {
    const assets = [
      {
        uri: "textures/body.png",
        url: "https://res.cloudinary.com/demo/raw/upload/v1/models/u1/body.png",
      },
    ];
    expect(resolveModelAssetUrl("textures/body.png", assets)).toBe(assets[0]!.url);
    expect(resolveModelAssetUrl("other.png", assets, "https://res.cloudinary.com/demo/model.gltf")).toBe(
      "",
    );
    expect(
      resolveModelAssetUrl("https://evil.example.com/asset.bin", assets, "https://res.cloudinary.com/demo/model.gltf"),
    ).toBe("");
    expect(isCloudinaryAssetUrl("http://res.cloudinary.com/demo/a.glb")).toBe(false);
  });

  it("keeps the main model URL while blocking unvalidated GLTF references", () => {
    const url = "https://res.cloudinary.com/demo/raw/upload/v1/models/u1/phone.glb";
    const resolver = createModelUrlResolver(url, []);
    expect(resolver(url)).toBe(url);

    const relative = createModelUrlResolver("/models/phone.glb", []);
    expect(relative("/models/phone.glb")).toBe("/models/phone.glb");
    expect(relative("/models/scene.bin")).toBe("");
    expect(relative("https://evil.example.com/scene.bin")).toBe("");
  });

  it("binds uploaded model public IDs to the signed seller folder", () => {
    expect(isOwnedModelPublicId("models/user_1/phone.glb", "user_1")).toBe(true);
    expect(isOwnedModelPublicId("models/user_2/phone.glb", "user_1")).toBe(false);
    expect(isOwnedModelPublicId("models/user_1/../phone.glb", "user_1")).toBe(false);
  });
});
