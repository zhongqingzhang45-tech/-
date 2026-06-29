"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";

interface Live2DPlayerProps {
  modelPath: string;
  modelName: string;
  scale?: number;
  positionY?: number;
  onModelLoaded?: () => void;
  onError?: (error: string) => void;
  forwardedRef?: React.Ref<Live2DPlayerRef>;
}

export interface Live2DPlayerRef {
  playMotion: (motionId: string) => void;
  triggerRandomMotion: () => void;
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

let loadPromise: Promise<void> | null = null;

function loadScript(src: string, retries = 3, timeout = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      resolve();
      return;
    }

    // Check if global object already exists for this script
    const checkGlobal = () => {
      if (src.includes('pixi.min.js') && window.PIXI) return true;
      if (src.includes('live2dcubismcore.min.js') && window.Live2DCubismCore) return true;
      if (src.includes('live2dcubismframework.js') && window.LIVE2DCUBISMFRAMEWORK) return true;
      if (src.includes('live2dcubismpixi.js') && window.LIVE2DCUBISMPIXI) return true;
      return false;
    };

    if (checkGlobal()) {
      resolve();
      return;
    }

    let attempts = 0;
    const attemptLoad = () => {
      attempts++;
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      
      const timer = setTimeout(() => {
        script.remove();
        if (attempts < retries) {
          console.warn(`Retrying load: ${src} (attempt ${attempts + 1})`);
          attemptLoad();
        } else {
          reject(new Error(`Timeout loading ${src} after ${retries} attempts`));
        }
      }, timeout);

      script.onload = () => {
        clearTimeout(timer);
        resolve();
      };

      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        if (attempts < retries) {
          console.warn(`Retrying load after error: ${src} (attempt ${attempts + 1})`);
          attemptLoad();
        } else {
          reject(new Error(`Failed to load ${src} after ${retries} attempts`));
        }
      };

      document.head.appendChild(script);
    };

    attemptLoad();
  });
}

function loadAllScripts(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = Promise.all(SCRIPTS.map(src => loadScript(src))).then(() => {});
  return loadPromise;
}

function checkLibs(): boolean {
  return !!(
    window.PIXI &&
    window.LIVE2DCUBISMFRAMEWORK &&
    window.LIVE2DCUBISMPIXI &&
    window.Live2DCubismCore
  );
}

const Live2DPlayer = forwardRef<Live2DPlayerRef, Live2DPlayerProps>(
  ({ modelPath, modelName, scale = 1, positionY = 0.5, onModelLoaded, onError, forwardedRef }, ref) => {
    const actualRef = (forwardedRef || ref) as React.RefObject<Live2DPlayerRef>;
    const containerRef = useRef<HTMLDivElement>(null);
    const modelRef = useRef<any>(null);
    const motionsRef = useRef<Map<string, any>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useImperativeHandle(actualRef, () => ({
      playMotion: (motionId: string) => {
        const model = modelRef.current;
        if (!model?.animator) return;
        const motion = motionsRef.current.get(motionId) || 
                      motionsRef.current.get(motionId.toLowerCase()) ||
                      motionsRef.current.get(motionId.toUpperCase());
        if (!motion) return;
        const layer = model.animator.getLayer("base");
        if (layer) {
          layer.play(motion);
        }
      },
      triggerRandomMotion: () => {
        const motionKeys = Array.from(motionsRef.current.keys());
        if (motionKeys.length === 0) return;
        const nonIdleKeys = motionKeys.filter(k => !k.toLowerCase().includes('idle'));
        const key = nonIdleKeys.length > 0 
          ? nonIdleKeys[Math.floor(Math.random() * nonIdleKeys.length)]
          : motionKeys[Math.floor(Math.random() * motionKeys.length)];
        actualRef.current?.playMotion(key);
      },
      setExpression: (name: string) => {
        const model = modelRef.current;
        if (!model) return;
      },
      getModelInfo: () => ({
        motions: Array.from(motionsRef.current.keys()),
        expressions: [],
      }),
    }));

    useEffect(() => {
      let destroyed = false;
      let app: any = null;

      const setup = async () => {
        try {
          await loadAllScripts();

          if (destroyed || !containerRef.current) return;
          if (!checkLibs()) {
            throw new Error("Live2D libraries not available");
          }

          const container = containerRef.current;

          const { PIXI, LIVE2DCUBISMFRAMEWORK, LIVE2DCUBISMPIXI, Live2DCubismCore } = window;
          const width = container.clientWidth;
          const height = container.clientHeight;

          app = new PIXI.Application({
            width: width,
            height: height,
            transparent: true,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            backgroundColor: 0x000000,
            forceCanvas: false,
          });
          app.view.style.display = "block";
          app.view.style.background = "transparent";
          container.appendChild(app.view);

          const basePath = modelPath.endsWith("/") ? modelPath : `${modelPath}/`;
          const modelDir = `${modelName}/`;
          const modelFile = `${modelName}.model3.json`;
          const motionKeys: string[] = [];
          let textureCount = 0;

          const loader = new PIXI.loaders.Loader(basePath);
          loader.add("model_json", modelDir + modelFile, {
            xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON,
          });

          await new Promise<void>((resolve, reject) => {
            loader.load((_l1: any, res1: any) => {
              if (destroyed) {
                reject(new Error("destroyed"));
                return;
              }
              const model3 = res1.model_json?.data;
              if (!model3) {
                reject(new Error("Failed to load model json"));
                return;
              }

              if (model3.FileReferences?.Moc) {
                loader.add("moc", modelDir + model3.FileReferences.Moc, {
                  xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER,
                });
              }
              if (model3.FileReferences?.Textures) {
                model3.FileReferences.Textures.forEach((tex: string, i: number) => {
                  loader.add(`texture${i}`, modelDir + tex);
                  textureCount++;
                });
              }
              if (model3.FileReferences?.Physics) {
                loader.add("physics", modelDir + model3.FileReferences.Physics, {
                  xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON,
                });
              }
              if (model3.FileReferences?.Motions) {
                for (const group in model3.FileReferences.Motions) {
                  model3.FileReferences.Motions[group].forEach((mot: any) => {
                    const motionName = mot.File.split("/").pop().split(".").shift();
                    const key = `motion_${motionName}`;
                    if (!motionKeys.includes(key)) {
                      loader.add(key, modelDir + mot.File, {
                        xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON,
                      });
                      motionKeys.push(key);
                    }
                  });
                }
              }

              let groups = null;
              if (model3.Groups) {
                groups = LIVE2DCUBISMFRAMEWORK.Groups.fromModel3Json(model3);
              }

              loader.load((_l2: any, res2: any) => {
                if (destroyed) {
                  reject(new Error("destroyed"));
                  return;
                }
                try {
                  let moc = null;
                  if (res2.moc?.data) {
                    moc = Live2DCubismCore.Moc.fromArrayBuffer(res2.moc.data);
                  }
                  if (!moc) throw new Error("Failed to load moc file");

                  const textures: any[] = [];
                  for (let i = 0; i < textureCount; i++) {
                    if (res2[`texture${i}`]?.texture) {
                      textures[i] = res2[`texture${i}`].texture;
                    }
                  }

                  const coreModel = Live2DCubismCore.Model.fromMoc(moc);
                  if (!coreModel) throw new Error("Failed to create core model");

                  const animator = new LIVE2DCUBISMFRAMEWORK.AnimatorBuilder()
                    .setTarget(coreModel)
                    .setTimeScale(1)
                    .build();

                  let physicsRig = null;
                  if (res2.physics?.data) {
                    const physicsBuilder = new LIVE2DCUBISMFRAMEWORK.PhysicsRigBuilder();
                    physicsBuilder.setPhysics3Json(res2.physics.data);
                    physicsRig = physicsBuilder
                      .setTarget(coreModel)
                      .setTimeScale(1)
                      .build();
                  }

                  const motions = new Map<string, any>();
                  motionKeys.forEach((key) => {
                    const r = res2[key];
                    if (r?.data) {
                      const name = key.replace("motion_", "");
                      const anim = LIVE2DCUBISMFRAMEWORK.Animation.fromMotion3Json(r.data);
                      motions.set(name, anim);
                    }
                  });
                  motionsRef.current = motions;

                  const model = LIVE2DCUBISMPIXI.Model._create(
                    coreModel,
                    textures,
                    animator,
                    physicsRig,
                    null,
                    groups
                  );

                  model.motions = motions;
                  model.inDrag = false;
                  model.pointerX = 0;
                  model.pointerY = 0;
                  modelRef.current = model;

                  model.animator.addLayer(
                    "base",
                    LIVE2DCUBISMFRAMEWORK.BuiltinAnimationBlenders.OVERRIDE,
                    1
                  );

                  app.stage.addChild(model);

                  const modelScale = (width * 0.5 * 0.06) * scale;
                  model.position.x = width * 0.5;
                  model.position.y = height * positionY;
                  model.scale.x = modelScale;
                  model.scale.y = modelScale;

                  if (model.height <= 200) {
                    const s = (width * 0.5 * 0.6) * scale;
                    model.scale.x = s;
                    model.scale.y = s;
                  }

                  const deltaTime = 0.016;
                  app.ticker.add((delta: number) => {
                    if (!model || destroyed) return;
                    const dt = deltaTime * delta;

                    if (!model.animator.isPlaying) {
                      const idle = model.motions.get("idle") || model.motions.get("Idle");
                      if (idle) model.animator.getLayer("base").play(idle);
                    }
                    model._animator.updateAndEvaluate(dt);

                    if (model.inDrag) {
                      model.addParameterValueById("ParamAngleX", model.pointerX * 30);
                      model.addParameterValueById("ParamAngleY", -model.pointerY * 30);
                      model.addParameterValueById("ParamBodyAngleX", model.pointerX * 10);
                      model.addParameterValueById("ParamBodyAngleY", -model.pointerY * 10);
                      model.addParameterValueById("ParamEyeBallX", model.pointerX);
                      model.addParameterValueById("ParamEyeBallY", -model.pointerY);
                    }

                    if (model._physicsRig) {
                      model._physicsRig.updateAndEvaluate(dt);
                    }

                    model._coreModel.update();

                    let sort = false;
                    for (let m = 0; m < model._meshes.length; ++m) {
                      const mesh = model._meshes[m];
                      mesh.alpha = model._coreModel.drawables.opacities[m];
                      mesh.visible = Live2DCubismCore.Utils.hasIsVisibleBit(
                        model._coreModel.drawables.dynamicFlags[m]
                      );
                      if (
                        Live2DCubismCore.Utils.hasVertexPositionsDidChangeBit(
                          model._coreModel.drawables.dynamicFlags[m]
                        )
                      ) {
                        mesh.vertices = model._coreModel.drawables.vertexPositions[m];
                        mesh.dirtyVertex = true;
                      }
                      if (
                        Live2DCubismCore.Utils.hasRenderOrderDidChangeBit(
                          model._coreModel.drawables.dynamicFlags[m]
                        )
                      ) {
                        sort = true;
                      }
                    }

                    if (sort) {
                      model.children.sort((a: any, b: any) => {
                        const aIdx = model._meshes.indexOf(a);
                        const bIdx = model._meshes.indexOf(b);
                        return (
                          model._coreModel.drawables.renderOrders[aIdx] -
                          model._coreModel.drawables.renderOrders[bIdx]
                        );
                      });
                    }

                    model._coreModel.drawables.resetDynamicFlags();
                  });

                  setIsLoading(false);
                  onModelLoaded?.();
                  resolve();
                } catch (err: any) {
                  reject(err);
                }
              });
            });
          });
        } catch (err: any) {
          if (destroyed) return;
          setLoadError(err.message || "Failed to load model");
          setIsLoading(false);
          onError?.(err.message || "Failed to load model");
        }
      };

      setup();

      return () => {
        destroyed = true;
        if (app) {
          try {
            app.destroy(true);
          } catch (e) {}
          app = null;
        }
        modelRef.current = null;
      };
    }, [modelPath, modelName, scale, positionY, onModelLoaded, onError]);

    return (
      <div ref={containerRef} className="w-full h-full relative">
        {isLoading && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-white/50 text-xs">加载模型中...</div>
            </div>
          </div>
        )}
        {loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="relative">
              {/* Fallback avatar when Live2D fails */}
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
                <span className="text-6xl">👩</span>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-white/40 bg-black/30 px-2 py-0.5 rounded">
                2D模式
              </div>
            </div>
            <div className="mt-4 text-white/30 text-xs text-center max-w-xs">
              Live2D模型暂不可用
            </div>
          </div>
        )}
      </div>
    );
  }
);

Live2DPlayer.displayName = "Live2DPlayer";

export default Live2DPlayer;
