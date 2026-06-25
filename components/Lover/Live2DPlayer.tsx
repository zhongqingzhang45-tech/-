"use client";

import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";

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

const Live2DPlayer = forwardRef<Live2DPlayerRef, Live2DPlayerProps>(function Live2DPlayer(
  { modelPath, modelName, scale = 1, positionY = 0.5, onModelLoaded, onError },
  ref
) {
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
      const motions = motionsRef.current;
      if (!model || !model.animator) return;
      
      const motion = motions.get(motionId);
      if (motion) {
        const layer = model.animator.getLayer("base");
        if (layer) {
          layer.play(motion);
        }
      } else {
        const allMotions = Array.from(motions.values());
        if (allMotions.length > 0) {
          const layer = model.animator.getLayer("base");
          if (layer) {
            layer.play(allMotions[0]);
          }
        }
      }
    },
    setExpression: (_name: string) => {
    },
    getModelInfo: () => {
      const motions = motionsRef.current;
      const expressions = expressionsRef.current;
      return {
        motions: Array.from(motions.keys()),
        expressions: Array.from(expressions.keys()),
      };
    },
  }));

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
      const loader = new PIXI.loaders.Loader(basePath);
      const textures: any[] = [];
      const motionNames: string[] = [];
      const expressionNames: string[] = [];
      let textureCount = 0;

      loader.add("model", modelJsonPath, {
        xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON,
      });

      loader.load((_l1: any, resources1: any) => {
        const model3Obj = resources1.model.data;

        const loader2 = new PIXI.loaders.Loader(basePath);

        if (model3Obj.FileReferences?.Moc) {
          loader2.add("moc", model3Obj.FileReferences.Moc, {
            xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER,
          });
        }

        if (model3Obj.FileReferences?.Textures) {
          model3Obj.FileReferences.Textures.forEach((tex: string, i: number) => {
            loader2.add(`texture${i}`, tex);
            textureCount++;
          });
        }

        if (model3Obj.FileReferences?.Physics) {
          loader2.add("physics", model3Obj.FileReferences.Physics, {
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
                loader2.add(resourceKey, motionFile, {
                  xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON,
                });
                motionNames.push(resourceKey);
              }
            });
          }
        }

        if (model3Obj.FileReferences?.Expressions) {
          model3Obj.FileReferences.Expressions.forEach((expr: any) => {
            const exprName = expr.Name;
            const exprFile = expr.File;
            const resourceKey = `expr_${exprName}`;
            loader2.add(resourceKey, exprFile, {
              xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON,
            });
            expressionNames.push(resourceKey);
          });
        }

        let groups = null;
        if (model3Obj.Groups) {
          groups = LIVE2DCUBISMFRAMEWORK.Groups.fromModel3Json(model3Obj);
        }

        loader2.load((_l2: any, r: any) => {
          try {
            let moc = null;
            if (r.moc) {
              moc = Live2DCubismCore.Moc.fromArrayBuffer(r.moc.data);
            }

            for (let i = 0; i < textureCount; i++) {
              textures[i] = r[`texture${i}`].texture;
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
            if (r.physics) {
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
              if (res) {
                const motionName = key.replace("motion_", "");
                const anim = LIVE2DCUBISMFRAMEWORK.Animation.fromMotion3Json(res.data);
                motions.set(motionName, anim);
              }
            });
            motionsRef.current = motions;

            const expressions = new Map<string, any>();
            expressionNames.forEach((key) => {
              const res = r[key];
              if (res) {
                const exprName = key.replace("expr_", "");
                expressions.set(exprName, res.data);
              }
            });
            expressionsRef.current = expressions;

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

            const bounds = model.getBounds();
            const modelWidth = bounds.width;
            const modelHeight = bounds.height;

            const scaleX = (width * 0.7) / modelWidth;
            const scaleY = (height * 0.7) / modelHeight;
            const modelScale = Math.min(scaleX, scaleY) * scale;

            model.scale.set(modelScale);
            model.x = width / 2;
            model.y = height * positionY;

            model.masks.resize(app.view.width, app.view.height);

            app.ticker.add((delta: number) => {
              if (!model) return;
              model.update(delta);
              model.masks.update(app.renderer);
            });

            const idleMotion = motions.get("idle") || 
                              motions.get("Idle") || 
                              motions.get("微笑-正常") ||
                              Array.from(motions.values())[0];
            
            if (idleMotion && model.animator) {
              const layer = model.animator.getLayer("base");
              if (layer) {
                layer.play(idleMotion);
              }
            }

            setIsLoading(false);
            onModelLoaded?.();
          } catch (err: any) {
            console.error("Model build error:", err);
            setLoadError(err.message || "Failed to build model");
            setIsLoading(false);
            onError?.(err.message || "Failed to build model");
          }
        });
      });
    } catch (err: any) {
      console.error("Setup error:", err);
      setLoadError(err.message || "Failed to setup Live2D");
      setIsLoading(false);
      onError?.(err.message || "Failed to setup Live2D");
    }
  }, [modelPath, modelName, scale, positionY, onModelLoaded, onError]);

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
      const scaleX = (width * 0.7) / modelWidth;
      const scaleY = (height * 0.7) / modelHeight;
      const modelScale = Math.min(scaleX, scaleY) * (scale || 1);
      model.scale.set(modelScale);
      model.x = width / 2;
      model.y = height * (positionY || 0.5);
      
      if (model.masks) {
        model.masks.resize(app.view.width, app.view.height);
      }
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
});

export default Live2DPlayer;
