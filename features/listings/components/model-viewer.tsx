"use client";

import * as React from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, useProgress } from "@react-three/drei";
import { useTranslations } from "next-intl";
import { Maximize2, Pause, Play, RotateCcw, Box } from "lucide-react";
import { Box3, type Material, type Mesh, type Object3D, type Texture, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { cn } from "@/lib/utils";
import { createModelUrlResolver } from "@/lib/model-assets";
import type { ListingModelAssetData, ListingModelData } from "@/types/marketplace";

function disposeObject(root: Object3D) {
  root.traverse((child) => {
    const mesh = child as Mesh;
    mesh.geometry?.dispose();
    const materials: Material[] = Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : [];
    for (const material of materials) {
      for (const value of Object.values(material as unknown as Record<string, unknown>)) {
        if (value && typeof value === "object" && "isTexture" in value) {
          (value as Texture).dispose();
        }
      }
      material.dispose();
    }
  });
}

function Model({ model }: { model: ListingModelData }) {
  const gltf = useLoader(GLTFLoader, model.url, (loader) => {
    loader.manager.setURLModifier(
      createModelUrlResolver(model.url, model.assets as ListingModelAssetData[]),
    );
  });

  const { center, scale } = React.useMemo(() => {
    const bounds = new Box3().setFromObject(gltf.scene);
    const size = bounds.getSize(new Vector3());
    const longest = Math.max(size.x, size.y, size.z) || 1;
    return { center: bounds.getCenter(new Vector3()), scale: 2 / longest };
  }, [gltf.scene]);

  React.useEffect(() => {
    return () => {
      disposeObject(gltf.scene);
      useLoader.clear(GLTFLoader, model.url);
    };
  }, [gltf.scene, model.url]);

  return (
    <group position={[-center.x * scale, -center.y * scale, -center.z * scale]} scale={scale}>
      <primitive object={gltf.scene} />
    </group>
  );
}

function CameraReset({ token }: { token: number }) {
  const { camera, controls } = useThree();
  React.useEffect(() => {
    camera.position.set(0, 0.4, 3);
    camera.lookAt(0, 0, 0);
    const orbit = controls as { target?: Vector3; update?: () => void } | null;
    orbit?.target?.set(0, 0, 0);
    orbit?.update?.();
  }, [camera, controls, token]);
  return null;
}

class ModelErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Lazy-loaded, free Three.js viewer for genuine seller-supplied GLB/GLTF files. */
export function ModelViewer({ model, title }: { model: ListingModelData; title: string }) {
  const t = useTranslations("productViewer");
  const [autoRotate, setAutoRotate] = React.useState(true);
  const [resetToken, setResetToken] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { active, progress } = useProgress();

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
      } else {
        await containerRef.current?.requestFullscreen?.();
      }
    } catch {
      // Native fullscreen may be blocked; the viewer already fills its container.
    }
  }

  return (
    <div
      ref={containerRef}
      data-model-viewer
      className="bg-neutral-950 relative h-full w-full overflow-hidden"
    >
      <ModelErrorBoundary
        fallback={
          <div className="text-white/70 flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm">
            <Box className="size-8" />
            {t("modelUnavailable")}
          </div>
        }
      >
        <React.Suspense fallback={null}>
          <Canvas camera={{ position: [0, 0.4, 3], fov: 45 }} dpr={[1, 2]}>
            <ambientLight intensity={1.4} />
            <directionalLight position={[4, 6, 5]} intensity={2.2} />
            <directionalLight position={[-4, 2, -3]} intensity={0.8} />
            <Model model={model} />
            <CameraReset token={resetToken} />
            <OrbitControls
              makeDefault
              enableDamping
              enablePan
              enableZoom
              enableRotate
              autoRotate={autoRotate}
              autoRotateSpeed={1.2}
              minDistance={0.8}
              maxDistance={12}
            />
          </Canvas>
        </React.Suspense>
      </ModelErrorBoundary>

      {active || progress < 100 ? (
        <div
          data-model-loading
          className="bg-neutral-950/80 absolute inset-0 grid place-items-center text-sm text-white/80"
        >
          {t("modelLoading")} {Math.round(progress)}%
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
        <span className="pointer-events-auto rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
          {t("model3dLabel")}
        </span>
        <div className="pointer-events-auto flex items-center gap-1">
          <button
            type="button"
            aria-label={autoRotate ? t("modelPause") : t("modelAutoRotate")}
            onClick={() => setAutoRotate((previous) => !previous)}
            className="grid size-9 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
          >
            {autoRotate ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <button
            type="button"
            aria-label={t("modelReset")}
            onClick={() => setResetToken((previous) => previous + 1)}
            className="grid size-9 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
          >
            <RotateCcw className="size-4" />
          </button>
          <button
            type="button"
            aria-label={t("fullscreen")}
            onClick={() => void toggleFullscreen()}
            className="grid size-9 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
          >
            <Maximize2 className="size-4" />
          </button>
        </div>
      </div>

      <p
        className={cn(
          "pointer-events-none absolute bottom-2 start-1/2 -translate-x-1/2",
          "rounded-full bg-black/60 px-2 py-1 text-xs text-white/80",
        )}
      >
        {t("modelHint")}
      </p>
      <span className="sr-only">{title}</span>
    </div>
  );
}
