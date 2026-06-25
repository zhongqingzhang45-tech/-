"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Live2DPlayerProps {
  modelPath: string;
  modelName: string;
  scale?: number;
  onModelLoaded?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    PIXI: any;
    LIVE2DCUBISMFRAMEWORK: any;
    LIVE2DCUBISMPIXI: any;
    Live2DCubismCore: any;
  }
}

const SCRIPTS = [
  "/vendor/live2dv3/live2dcubismcore.min.js",
  "/vendor/live2dv3/pixi.min.js",
  "/vendor/live2dv3/live2dcubismframework.js",
  "/vendor/live2dv3/live2dcubismpixi.js",
];

let scriptsLoading = false;
let scriptsReady = false;
let scriptsPromise: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function loadAllScripts(): Promise<void> {
  if (scriptsReady) return;
  if (scriptsPromise) return scriptsPromise;
  scriptsPromise = (async () => {
    for (const src of SCRIPTS) {
      await loadScript(src);
    }
    scriptsReady = true;
  })();
  return scriptsPromise;
}

export default function Live2DPlayer({
  modelPath,
  modelName,
  scale = 1,
  onModelLoaded,
  onError,
}: Live2DPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const setupModel = useCallback(async () => {
    if (!containerRef.current) return;

    const { PIXI, LIVE2DCUBISMFRAMEWORK, LIVE2DCUBISMPIXI, Live2DCubismCore } = window;
    if (!PIXI || !LIVE2DCUBISMFRAMEWORK || !LIVE2DCUBISMPIXI || !Live2DCubismCore) {
      setLoadError("Live2D libraries not loaded");
      setIsLoading(false);
      return;
    }

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (appRef.current) {
      appRef.current.destroy(true);
      appRef.current = null;
    }

    const app = new PIXI.Application({
      width,
      height,
      transparent: true,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    container.appendChild(app.view);
    appRef.current = app;

    const basePath = modelPath.endsWith("/") ? modelPath : `${modelPath}/`;
    const modelJsonPath = `${modelName}.model3.json`;

    try {
      const modelJsonRes = await fetch(`${basePath}${modelJsonPath}`);
      if (!modelJsonRes.ok) throw new Error("Failed to load model3.json");
      const model3Obj = await modelJsonRes.json();

      const loader = new PIXI.loaders.Loader(basePath);
      const textures: any[] = [];
      const motionNames: string[] = [];
      let textureCount = 0;

      loader.add("model", modelJsonPath, { xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON });

      if (model3Obj.FileReferences?.Moc) {
        loader.add("moc", model3Obj.FileReferences.Moc, { xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER });
      }

      if (model3Obj.FileReferences?.Textures) {
        model3Obj.FileReferences.Textures.forEach((tex: string, i: number) => {
          loader.add(`texture${i}`, tex);
          textureCount++;
        });
      }

      if (model3Obj.FileReferences?.Physics) {
        loader.add("physics", model3Obj.FileReferences.Physics, { xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON });
      }

      if (model3Obj.FileReferences?.Motions) {
        for (const group in model3Obj.FileReferences.Motions) {
          model3Obj.FileReferences.Motions[group].forEach((mot: any) => {
            const motionName = mot.File.split("/").pop().split(".").shift();
            loader.add(`motion_${motionName}`, mot.File, { xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON });
            motionNames.push(motionName);
          });
        }
      }

      if (model3Obj.FileReferences?.Expressions) {
        model3Obj.FileReferences.Expressions.forEach((exp: any) => {
          const expName = exp.File.split("/").pop().split(".").shift();
          loader.add(`exp_${expName}`, exp.File, { xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON });
        });
      }

      loader.load((_l: any, resources: any) => {
        try {
          let moc = null;
          if (resources.moc) {
            moc = Live2DCubismCore.Moc.fromArrayBuffer(resources.moc.data);
          }

          for (let i = 0; i < textureCount; i++) {
            textures[i] = resources[`texture${i}`].texture;
          }

          const coreModel = Live2DCubismCore.Model.fromMoc(moc);
          if (!coreModel) {
            throw new Error("Failed to create core model from moc");
          }

          const animatorBuilder = new LIVE2DCUBISMFRAMEWORK.AnimatorBuilder();
          const animator = animatorBuilder
            .setTarget(coreModel)
            .setTimeScale(1)
            .build();

          let physicsRig = null;
          if (resources.physics) {
            const physicsBuilder = new LIVE2DCUBISMFRAMEWORK.PhysicsRigBuilder();
            physicsBuilder.setPhysics3Json(resources.physics.data);
            physicsRig = physicsBuilder
              .setTarget(coreModel)
              .setTimeScale(1)
              .build();
          }

          const groups = model3Obj.Groups
            ? LIVE2DCUBISMFRAMEWORK.Groups.fromModel3Json(model3Obj)
            : null;

          const model = LIVE2DCUBISMPIXI.Model._create(
            coreModel,
            textures,
            animator,
            physicsRig,
            null,
            groups
          );

          const motions = new Map();
          motionNames.forEach((name) => {
            const res = resources[`motion_${name}`];
            if (res) {
              motions.set(name, LIVE2DCUBISMFRAMEWORK.Animation.fromMotion3Json(res.data));
            }
          });
          model.motions = motions;

          modelRef.current = model;
          app.stage.addChild(model);

          const bounds = model.getBounds();
          const modelWidth = bounds.width;
          const modelHeight = bounds.height;

          const scaleX = (width * 0.85) / modelWidth;
          const scaleY = (height * 0.85) / modelHeight;
          const modelScale = Math.min(scaleX, scaleY) * scale;

          model.scale.set(modelScale);
          model.x = width / 2;
          model.y = height - modelHeight * modelScale * 0.1;

          model.update = function(delta: number) {
            if (this.animator) {
              this.animator.update(delta / 60);
            }
            if (this.physicsRig) {
              this.physicsRig.update(delta / 60);
            }
            if (this._updater) {
              this._updater.update(delta / 60);
            }
          };

          app.ticker.add((delta: number) => {
            model.update(delta);
          });

          setIsLoading(false);
          onModelLoaded?.();
        } catch (err: any) {
          console.error("Model load error:", err);
          setLoadError(err.message || "Failed to load model");
          setIsLoading(false);
          onError?.(err.message || "Failed to load model");
        }
      });
    } catch (err: any) {
      console.error("Setup error:", err);
      setLoadError(err.message || "Failed to setup Live2D");
      setIsLoading(false);
      onError?.(err.message || "Failed to setup Live2D");
    }
  }, [modelPath, modelName, scale, onModelLoaded, onError]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await loadAllScripts();
        if (mounted) {
          setupModel();
        }
      } catch (err: any) {
        if (mounted) {
          setLoadError(err.message || "Failed to load scripts");
          setIsLoading(false);
          onError?.(err.message || "Failed to load scripts");
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
      modelRef.current = null;
    };
  }, [setupModel, onError]);

  useEffect(() => {
    const handleResize = () => {
      if (!appRef.current || !modelRef.current || !containerRef.current) return;
      const app = appRef.current;
      const model = modelRef.current;
      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;
      app.renderer.resize(width, height);

      const bounds = model.getBounds();
      const modelWidth = bounds.width;
      const modelHeight = bounds.height;
      const scaleX = (width * 0.85) / modelWidth;
      const scaleY = (height * 0.85) / modelHeight;
      const modelScale = Math.min(scaleX, scaleY) * (scale || 1);
      model.scale.set(modelScale);
      model.x = width / 2;
      model.y = height - modelHeight * modelScale * 0.1;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [scale]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{ minHeight: 200 }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      )}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center text-red-400/80 text-sm p-4 text-center">
          <div>
            <p className="font-medium mb-1">Live2D 加载失败</p>
            <p className="text-xs text-white/40">{loadError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
