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

function checkAllLibraries(): boolean {
  return !!(window.PIXI && window.LIVE2DCUBISMFRAMEWORK && window.LIVE2DCUBISMPIXI && window.Live2DCubismCore);
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if ((existing as any)._loaded) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => {
        (existing as any)._loaded = true;
        resolve();
      });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    (script as any)._loaded = false;
    script.onload = () => {
      (script as any)._loaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function loadAllScripts(): Promise<void> {
  if (scriptsReady) return Promise.resolve();
  if (checkAllLibraries()) {
    scriptsReady = true;
    return Promise.resolve();
  }
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

function onUpdate(this: any, delta: number) {
  const deltaTime = 0.016 * delta;
  const Live2DCubismCore = window.Live2DCubismCore;

  if (!this.animator.isPlaying) {
    let m = this.motions.get("idle");
    if (!m) m = this.motions.get("Idle");
    if (m) {
      this.animator.getLayer("base").play(m);
    }
  }
  this._animator.updateAndEvaluate(deltaTime);

  if (this.inDrag) {
    this.addParameterValueById("ParamAngleX", this.pointerX * 30);
    this.addParameterValueById("ParamAngleY", -this.pointerY * 30);
    this.addParameterValueById("ParamBodyAngleX", this.pointerX * 10);
    this.addParameterValueById("ParamBodyAngleY", -this.pointerY * 10);
    this.addParameterValueById("ParamEyeBallX", this.pointerX);
    this.addParameterValueById("ParamEyeBallY", -this.pointerY);
  }

  if (this._physicsRig) {
    this._physicsRig.updateAndEvaluate(deltaTime);
  }

  this._coreModel.update();

  let sort = false;
  for (let m = 0; m < this._meshes.length; ++m) {
    this._meshes[m].alpha = this._coreModel.drawables.opacities[m];
    this._meshes[m].visible = Live2DCubismCore.Utils.hasIsVisibleBit(this._coreModel.drawables.dynamicFlags[m]);
    if (Live2DCubismCore.Utils.hasVertexPositionsDidChangeBit(this._coreModel.drawables.dynamicFlags[m])) {
      this._meshes[m].vertices = this._coreModel.drawables.vertexPositions[m];
      this._meshes[m].dirtyVertex = true;
    }
    if (Live2DCubismCore.Utils.hasRenderOrderDidChangeBit(this._coreModel.drawables.dynamicFlags[m])) {
      sort = true;
    }
  }

  if (sort) {
    this.children.sort((a: any, b: any) => {
      const aIndex = this._meshes.indexOf(a);
      const bIndex = this._meshes.indexOf(b);
      const aRenderOrder = this._coreModel.drawables.renderOrders[aIndex];
      const bRenderOrder = this._coreModel.drawables.renderOrders[bIndex];
      return aRenderOrder - bRenderOrder;
    });
  }

  this._coreModel.drawables.resetDynamicFlags();
}

const Live2DPlayer = forwardRef<Live2DPlayerRef, Live2DPlayerProps>(
  ({ modelPath, modelName, scale = 1, positionY = 0.5, onModelLoaded, onError, forwardedRef }, ref) => {
    const actualRef = (forwardedRef || ref) as React.RefObject<Live2DPlayerRef>;
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<any>(null);
    const modelRef = useRef<any>(null);
    const motionsRef = useRef<Map<string, any>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useImperativeHandle(actualRef, () => ({
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
      setExpression: (name: string) => {},
      getModelInfo: () => ({
        motions: Array.from(motionsRef.current.keys()),
        expressions: [],
      }),
    }));

    useEffect(() => {
      let cancelled = false;
      let localApp: any = null;
      console.log("Live2DPlayer useEffect init, modelPath:", modelPath, "modelName:", modelName);

      const setupModel = () => {
        if (cancelled || !containerRef.current) return;

        const { PIXI, LIVE2DCUBISMFRAMEWORK, LIVE2DCUBISMPIXI, Live2DCubismCore } = window;
        if (!PIXI || !LIVE2DCUBISMFRAMEWORK || !LIVE2DCUBISMPIXI || !Live2DCubismCore) {
          setLoadError("Live2D libraries not loaded");
          setIsLoading(false);
          return;
        }

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        if (localApp) {
          localApp.destroy(true);
          localApp = null;
        }

        const app = new PIXI.Application(width, height, {
          transparent: true,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          backgroundColor: 0x000000,
          backgroundAlpha: 0,
        });

        app.view.style.display = "block";
        app.view.style.background = "transparent";
        container.appendChild(app.view);
        localApp = app;
        appRef.current = app;

        const basePath = modelPath.endsWith("/") ? modelPath : `${modelPath}/`;
        const modelDir = `${modelName}/`;
        const modelFile = `${modelName}.model3.json`;
        let textures: any[] = [];
        let textureCount = 0;
        const motionKeys: string[] = [];

        const loader = new PIXI.loaders.Loader(basePath);

        loader.add("model_json", modelDir + modelFile, {
          xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON,
        });

        loader.load((_loader1: any, resources1: any) => {
          if (cancelled) return;

          const model3Obj = resources1.model_json.data;
          if (!model3Obj) {
            setLoadError("Failed to load model json");
            setIsLoading(false);
            onError?.("Failed to load model json");
            return;
          }

          if (model3Obj.FileReferences?.Moc) {
            loader.add("moc", modelDir + model3Obj.FileReferences.Moc, {
              xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER,
            });
          }

          if (model3Obj.FileReferences?.Textures) {
            model3Obj.FileReferences.Textures.forEach((tex: string, i: number) => {
              loader.add(`texture${i}`, modelDir + tex);
              textureCount++;
            });
          }

          if (model3Obj.FileReferences?.Physics) {
            loader.add("physics", modelDir + model3Obj.FileReferences.Physics, {
              xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON,
            });
          }

          if (model3Obj.FileReferences?.Motions) {
            for (const group in model3Obj.FileReferences.Motions) {
              model3Obj.FileReferences.Motions[group].forEach((mot: any) => {
                const motionName = mot.File.split("/").pop().split(".").shift();
                const resourceKey = `motion_${motionName}`;
                if (!motionKeys.includes(resourceKey)) {
                  loader.add(resourceKey, modelDir + mot.File, {
                    xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON,
                  });
                  motionKeys.push(resourceKey);
                }
              });
            }
          }

          let groups = null;
          if (model3Obj.Groups) {
            groups = LIVE2DCUBISMFRAMEWORK.Groups.fromModel3Json(model3Obj);
          }

          loader.load((_l: any, r: any) => {
            if (cancelled || !localApp) return;

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
              motionKeys.forEach((key) => {
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
              model.update = onUpdate;
              model.inDrag = false;
              model.pointerX = 0;
              model.pointerY = 0;
              modelRef.current = model;

              model.animator.addLayer("base", LIVE2DCUBISMFRAMEWORK.BuiltinAnimationBlenders.OVERRIDE, 1);

              localApp.stage.addChild(model);

              const modelScale = (width * 0.5 * 0.06) * scale;
              model.position.x = width * 0.5;
              model.position.y = height * positionY;
              model.scale.x = modelScale;
              model.scale.y = modelScale;

              if (model.height <= 200) {
                const smallScale = (width * 0.5 * 0.6) * scale;
                model.scale.x = smallScale;
                model.scale.y = smallScale;
              }

              localApp.ticker.add((delta: number) => {
                if (!model || cancelled) return;
                model.update(delta);
              });

              setIsLoading(false);
              onModelLoaded?.();
            } catch (err: any) {
              if (!cancelled) {
                setLoadError(err.message || "Failed to setup model");
                setIsLoading(false);
                onError?.(err.message || "Failed to setup model");
              }
            }
          });
        });
      };

      function trySetup() {
        if (cancelled) return;
        const { PIXI, LIVE2DCUBISMFRAMEWORK, LIVE2DCUBISMPIXI, Live2DCubismCore } = window;
        if (PIXI && LIVE2DCUBISMFRAMEWORK && LIVE2DCUBISMPIXI && Live2DCubismCore) {
          console.log("Live2D libraries ready, setting up model...");
          setupModel();
        } else {
          setTimeout(trySetup, 200);
        }
      }

      loadAllScripts().then(() => {
        trySetup();
      }).catch((e) => {
        if (!cancelled) {
          console.error("loadAllScripts error:", e);
          setLoadError(e.message || "Failed to load Live2D libraries");
          setIsLoading(false);
          onError?.(e.message || "Failed to load Live2D libraries");
        }
      });

      return () => {
        cancelled = true;
        console.log("Live2DPlayer cleanup");
        if (localApp) {
          localApp.destroy(true);
          localApp = null;
        }
        appRef.current = null;
        modelRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modelPath, modelName]);

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
