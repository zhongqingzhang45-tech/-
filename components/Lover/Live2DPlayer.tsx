"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";

interface Live2DPlayerProps {
  modelPath: string;
  modelName: string;
  scale?: number;
  positionY?: number;
  onModelLoaded?: () => void;
  onError?: (error: string) => void;
}

export interface Live2DPlayerRef {
  playMotion: (motionId: string) => void;
  setExpression: (name: string) => void;
  getModelInfo: () => { motions: string[]; expressions: string[] };
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

function loadAllScripts(): Promise<void> {
  if (scriptsReady) return Promise.resolve();
  if (scriptsPromise) return scriptsPromise;
  scriptsLoading = true;
  scriptsPromise = SCRIPTS.reduce(
    (p, src) => p.then(() => loadScript(src)),
    Promise.resolve()
  )
    .then(() => {
      scriptsReady = true;
      scriptsLoading = false;
    })
    .catch((e) => {
      scriptsLoading = false;
      scriptsPromise = null;
      throw e;
    });
  return scriptsPromise;
}

const Live2DPlayer = forwardRef<Live2DPlayerRef, Live2DPlayerProps>(
  ({ modelPath, modelName, scale = 1, positionY = 0.5, onModelLoaded, onError }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<any>(null);
    const modelRef = useRef<any>(null);
    const motionsRef = useRef<Map<string, any>>(new Map());
    const expressionsRef = useRef<Map<string, any>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      playMotion: (motionId: string) => {
        const model = modelRef.current;
        if (!model || !model.animator) return;
        const motion = motionsRef.current.get(motionId);
        if (!motion) return;
        const layer = model.animator.getLayer("base");
        if (layer) {
          layer.play(motion);
        }
      },
      setExpression: (name: string) => {
        // expressions not implemented in cubism3 sdk same way
      },
      getModelInfo: () => ({
        motions: Array.from(motionsRef.current.keys()),
        expressions: Array.from(expressionsRef.current.keys()),
      }),
    }));

    useEffect(() => {
      let cancelled = false;

      async function init() {
        try {
          await loadAllScripts();
          if (cancelled) return;
          setupModel();
        } catch (e: any) {
          if (!cancelled) {
            setLoadError(e.message || "Failed to load Live2D libraries");
            setIsLoading(false);
            onError?.(e.message || "Failed to load Live2D libraries");
          }
        }
      }

      init();

      return () => {
        cancelled = true;
        if (appRef.current) {
          appRef.current.destroy(true);
          appRef.current = null;
        }
        modelRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modelPath, modelName]);

    const setupModel = () => {
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
      const modelJsonPath = `${basePath}${modelName}.model3.json`;

      const loader = new PIXI.loaders.Loader(basePath);
      const textures: any[] = [];
      const motionNames: string[] = [];
      let textureCount = 0;

      loader.add("model_json", modelJsonPath, {
        xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON,
      });

      loader.load((_loader: any, resources: any) => {
        try {
          const model3Obj = resources.model_json.data;

          if (model3Obj.FileReferences?.Moc) {
            loader.add("moc", model3Obj.FileReferences.Moc, {
              xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER,
            });
          }

          if (model3Obj.FileReferences?.Textures) {
            model3Obj.FileReferences.Textures.forEach((tex: string, i: number) => {
              loader.add(`texture${i}`, tex);
              textureCount++;
            });
          }

          if (model3Obj.FileReferences?.Physics) {
            loader.add("physics", model3Obj.FileReferences.Physics, {
              xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON,
            });
          }

          if (model3Obj.FileReferences?.Motions) {
            for (const group in model3Obj.FileReferences.Motions) {
              model3Obj.FileReferences.Motions[group].forEach((mot: any) => {
                const motionFile = mot.File;
                const motionName = motionFile.split("/").pop().split(".").shift();
                const resourceKey = `motion_${motionName}`;
                if (!motionNames.includes(resourceKey)) {
                  loader.add(resourceKey, motionFile, {
                    xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON,
                  });
                  motionNames.push(resourceKey);
                }
              });
            }
          }

          let groups = null;
          if (model3Obj.Groups) {
            groups = LIVE2DCUBISMFRAMEWORK.Groups.fromModel3Json(model3Obj);
          }

          loader.load((_l: any, r: any) => {
            try {
              let moc = null;
              if (r.moc && r.moc.data) {
                moc = Live2DCubismCore.Moc.fromArrayBuffer(r.moc.data);
              }

              if (!moc) {
                throw new Error("Failed to load moc file");
              }

              for (let i = 0; i < textureCount; i++) {
                if (r[`texture${i}`] && r[`texture${i}`].texture) {
                  textures[i] = r[`texture${i}`].texture;
                }
              }

              const coreModel = Live2DCubismCore.Model.fromMoc(moc);
              if (coreModel == null) {
                throw new Error("Failed to create core model from moc");
              }

              const animatorBuilder = new LIVE2DCUBISMFRAMEWORK.AnimatorBuilder();
              const animator = animatorBuilder
                .setTarget(coreModel)
                .setTimeScale(1)
                .build();

              let physicsRig = null;
              if (r.physics && r.physics.data) {
                const physicsBuilder = new LIVE2DCUBISMFRAMEWORK.PhysicsRigBuilder();
                physicsBuilder.setPhysics3Json(r.physics.data);
                physicsRig = physicsBuilder
                  .setTarget(coreModel)
                  .setTimeScale(1)
                  .build();
              }

              const motions = new Map<string, any>();
              motionNames.forEach((key) => {
                const res = r[key];
                if (res && res.data) {
                  const motionName = key.replace("motion_", "");
                  const anim = LIVE2DCUBISMFRAMEWORK.Animation.fromMotion3Json(res.data);
                  motions.set(motionName, anim);
                }
              });
              motionsRef.current = motions;

              let userData = null;

              const model = LIVE2DCUBISMPIXI.Model._create(
                coreModel,
                textures,
                animator,
                physicsRig,
                userData,
                groups
              );

              model.motions = motions;
              modelRef.current = model;

              model.animator.addLayer("base", LIVE2DCUBISMFRAMEWORK.BuiltinAnimationBlenders.OVERRIDE, 1);

              app.stage.addChild(model);
              app.stage.addChild(model.masks);

              const modelScale = (width * 0.03) * scale;
              model.scale.set(modelScale);
              model.x = width / 2;
              model.y = height * positionY;

              model.masks.resize(app.view.width, app.view.height);

              const originalUpdate = model.update.bind(model);
              model.update = (delta: number) => {
                const deltaTime = 0.016 * delta;

                if (!model.animator.isPlaying) {
                  const idleKeys = ["idle", "Idle", "main_1", "main_2", "main_3", "home"];
                  let idleMotion = null;
                  for (const key of idleKeys) {
                    if (model.motions && model.motions.has(key)) {
                      idleMotion = model.motions.get(key);
                      break;
                    }
                  }
                  if (idleMotion && model.animator.getLayer("base")) {
                    model.animator.getLayer("base").play(idleMotion);
                  }
                }

                originalUpdate(delta);
              };

              app.ticker.add((delta: number) => {
                if (!model) return;
                model.update(delta);
                model.masks.update(app.renderer);
              });

              setIsLoading(false);
              onModelLoaded?.();
            } catch (err: any) {
              setLoadError(err.message || "Failed to setup model");
              setIsLoading(false);
              onError?.(err.message || "Failed to setup model");
            }
          });
        } catch (err: any) {
          setLoadError(err.message || "Failed to load model");
          setIsLoading(false);
          onError?.(err.message || "Failed to load model");
        }
      });
    };

    return (
      <div ref={containerRef} className="w-full h-full relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-red-400 text-sm text-center px-4">
              <div className="mb-2">⚠️ Model Load Error</div>
              <div className="text-xs opacity-70">{loadError}</div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

Live2DPlayer.displayName = "Live2DPlayer";

export default Live2DPlayer;
