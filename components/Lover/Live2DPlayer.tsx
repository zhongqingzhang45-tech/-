"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";

export interface Live2DPlayerProps {
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

let globalLoadPromise: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function loadAllScripts(): Promise<void> {
  if (globalLoadPromise) return globalLoadPromise;
  globalLoadPromise = SCRIPTS.reduce(
    (p, src) => p.then(() => loadScript(src)),
    Promise.resolve()
  );
  return globalLoadPromise;
}

function checkWebGLSupport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

function checkLibs(): boolean {
  return !!(
    typeof window !== "undefined" &&
    window.PIXI &&
    window.LIVE2DCUBISMFRAMEWORK &&
    window.LIVE2DCUBISMPIXI &&
    window.Live2DCubismCore
  );
}

const Live2DPlayer = forwardRef<Live2DPlayerRef, Live2DPlayerProps>(
  ({ modelPath, modelName, scale = 1, positionY = 0.5, onModelLoaded, onError, forwardedRef }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const modelRef = useRef<any>(null);
    const motionsRef = useRef<Map<string, any>>(new Map());
    const expressionsRef = useRef<Map<string, { id: string; value: number; blend: string }[]>>(new Map());
    const appRef = useRef<any>(null);
    const isLoadedRef = useRef(false);
    const isLoadingRef = useRef(false);
    const destroyedRef = useRef(false);
    const extraCleanupRef = useRef<(() => void) | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [webglSupported, setWebglSupported] = useState(true);

    const actualRef = forwardedRef || ref;

    useImperativeHandle(actualRef, () => ({
      playMotion: (motionId: string) => {
        const model = modelRef.current;
        if (!model?.animator) return;
        const motion = motionsRef.current.get(motionId) ||
                      motionsRef.current.get(motionId.toLowerCase());
        if (!motion) return;
        const layer = model.animator.getLayer("base");
        if (layer) {
          try { layer.play(motion); } catch (e) {}
        }
      },
      triggerRandomMotion: () => {
        const model = modelRef.current;
        if (!model?.animator) return;
        const motionKeys = Array.from(motionsRef.current.keys());
        if (motionKeys.length === 0) return;
        const nonIdleKeys = motionKeys.filter(
          k => !k.toLowerCase().includes("idle") && !k.includes("微笑-正常")
        );
        const keys = nonIdleKeys.length > 0 ? nonIdleKeys : motionKeys;
        const key = keys[Math.floor(Math.random() * keys.length)];
        const motion = motionsRef.current.get(key);
        if (!motion) return;
        const layer = model.animator.getLayer("base");
        if (layer) {
          try { layer.play(motion); } catch (e) {}
        }
      },
      setExpression: (name: string) => {
        const model = modelRef.current;
        if (!model) return;
        const params = expressionsRef.current.get(name) ||
                    expressionsRef.current.get(name.toLowerCase());
        if (!params) {
          const keys = Array.from(expressionsRef.current.keys());
          if (keys.length > 0) {
            const fallback = expressionsRef.current.get(keys[0]);
            if (fallback) {
              fallback.forEach(({ id, value, blend }) => {
                try {
                  if (blend === "Add") model.addParameterValueById(id, value);
                  else if (blend === "Multiply") model.multiplyParameterValueById(id, value);
                  else model.setParameterValueById(id, value);
                } catch (e) {}
              });
            }
          }
          return;
        }
        params.forEach(({ id, value, blend }) => {
          try {
            if (blend === "Add") model.addParameterValueById(id, value);
            else if (blend === "Multiply") model.multiplyParameterValueById(id, value);
            else model.setParameterValueById(id, value);
          } catch (e) {}
        });
      },
      getModelInfo: () => ({
        motions: Array.from(motionsRef.current.keys()),
        expressions: Array.from(expressionsRef.current.keys()),
      }),
    }));

    useEffect(() => {
      setWebglSupported(checkWebGLSupport());
    }, []);

    useEffect(() => {
      if (!webglSupported) {
        setIsLoading(false);
        setLoadError("当前设备不支持WebGL，无法显示Live2D模型");
        return;
      }

      if (isLoadedRef.current || isLoadingRef.current) return;
      isLoadingRef.current = true;
      destroyedRef.current = false;

      let app: any = null;
      let animFrameId: number | null = null;

      const cleanup = () => {
        destroyedRef.current = true;

        if (extraCleanupRef.current) {
          try { extraCleanupRef.current(); } catch (e) {}
          extraCleanupRef.current = null;
        }

        if (animFrameId !== null) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }

        if (app) {
          try {
            app.ticker?.removeAllListeners?.();
            app.destroy?.({
              children: true,
              texture: true,
              baseTexture: true,
            });
          } catch (e) {}
          app = null;
        }

        if (canvasContainerRef.current) {
          while (canvasContainerRef.current.firstChild) {
            canvasContainerRef.current.removeChild(canvasContainerRef.current.firstChild);
          }
        }

        modelRef.current = null;
        appRef.current = null;
        motionsRef.current.clear();
        expressionsRef.current.clear();
        isLoadedRef.current = false;
        isLoadingRef.current = false;
      };

      const setup = async () => {
        try {
          await loadAllScripts();

          if (destroyedRef.current) return;
          if (!checkLibs()) {
            throw new Error("Live2D libraries failed to load");
          }

          if (destroyedRef.current || !canvasContainerRef.current) return;
          const container = canvasContainerRef.current;

          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }

          const { PIXI, LIVE2DCUBISMFRAMEWORK, LIVE2DCUBISMPIXI, Live2DCubismCore } = window;

          const updateSize = () => {
            if (!app || !container) return;
            const w = container.clientWidth || 300;
            const h = container.clientHeight || 400;
            try {
              app.renderer.resize(w, h);
              if (modelRef.current) {
                modelRef.current.position.x = w * 0.5;
                modelRef.current.position.y = h * positionY;
                const newScale = Math.min(w, h) * 0.0015 * scale;
                if (newScale > 0) {
                  modelRef.current.scale.x = newScale;
                  modelRef.current.scale.y = newScale;
                }
                if (modelRef.current.masks?.resize) {
                  modelRef.current.masks.resize(app.view.width, app.view.height);
                }
              }
            } catch (e) {}
          };

          const width = container.clientWidth || 300;
          const height = container.clientHeight || 400;

          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          ) || width < 768;

          const resolution = isMobile
            ? Math.min(window.devicePixelRatio || 1, 1.5)
            : Math.min(window.devicePixelRatio || 1, 2);

          app = new PIXI.Application(width, height, {
            transparent: true,
            antialias: !isMobile,
            resolution,
            autoDensity: true,
            backgroundAlpha: 0,
            preserveDrawingBuffer: false,
          });
          app.view.style.display = "block";
          app.view.style.background = "transparent";
          app.view.style.width = "100%";
          app.view.style.height = "100%";
          app.view.style.touchAction = "none";
          container.appendChild(app.view);
          appRef.current = app;

          const basePath = modelPath.endsWith("/") ? modelPath : `${modelPath}/`;
          const modelFile = `${modelName}.model3.json`;
          const motionKeys: string[] = [];
          const expressionKeys: string[] = [];
          let textureCount = 0;

          const loader = new PIXI.loaders.Loader(basePath);
          loader.add("model_json", modelFile, {
            xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON,
          });

          await new Promise<void>((resolve, reject) => {
            const onError = (err: any) => {
              if (destroyedRef.current) reject(new Error("destroyed"));
              else reject(err);
            };

            loader.load((_l1: any, res1: any) => {
              if (destroyedRef.current) { reject(new Error("destroyed")); return; }
              const model3 = res1.model_json?.data;
              if (!model3) { reject(new Error("Failed to load model json")); return; }

              if (model3.FileReferences?.Moc) {
                loader.add("moc", model3.FileReferences.Moc, {
                  xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER,
                });
              }
              if (model3.FileReferences?.Textures) {
                model3.FileReferences.Textures.forEach((tex: string, i: number) => {
                  loader.add(`texture${i}`, tex);
                  textureCount++;
                });
              }
              if (model3.FileReferences?.Physics) {
                loader.add("physics", model3.FileReferences.Physics, {
                  xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON,
                });
              }
              if (model3.FileReferences?.Pose) {
                loader.add("pose", model3.FileReferences.Pose, {
                  xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON,
                });
              }
              if (model3.FileReferences?.Motions) {
                for (const group in model3.FileReferences.Motions) {
                  model3.FileReferences.Motions[group].forEach((mot: any) => {
                    const motionName = mot.File.split("/").pop().split(".").shift();
                    const key = `motion_${motionName}`;
                    if (!motionKeys.includes(key)) {
                      loader.add(key, mot.File, {
                        xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON,
                      });
                      motionKeys.push(key);
                    }
                  });
                }
              }
              if (model3.FileReferences?.Expressions) {
                model3.FileReferences.Expressions.forEach((exp: any) => {
                  const key = `exp_${exp.Name}`;
                  if (!expressionKeys.includes(key)) {
                    loader.add(key, exp.File, {
                      xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON,
                    });
                    expressionKeys.push(key);
                  }
                });
              }

              let groups = null;
              if (model3.Groups) {
                try {
                  groups = LIVE2DCUBISMFRAMEWORK.Groups.fromModel3Json(model3);
                } catch (e) {}
              }

              loader.load((_l2: any, res2: any) => {
                if (destroyedRef.current) { reject(new Error("destroyed")); return; }
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

                  const animatorBuilder = new LIVE2DCUBISMFRAMEWORK.AnimatorBuilder();
                  const animator = animatorBuilder
                    .setTarget(coreModel)
                    .setTimeScale(1)
                    .build();

                  let physicsRig = null;
                  if (res2.physics?.data) {
                    try {
                      const physicsBuilder = new LIVE2DCUBISMFRAMEWORK.PhysicsRigBuilder();
                      physicsBuilder.setPhysics3Json(res2.physics.data);
                      physicsRig = physicsBuilder
                        .setTarget(coreModel)
                        .setTimeScale(1)
                        .build();
                    } catch (e) {}
                  }

                  const motions = new Map<string, any>();
                  motionKeys.forEach((key) => {
                    const r = res2[key];
                    if (r?.data) {
                      const name = key.replace("motion_", "");
                      try {
                        const anim = LIVE2DCUBISMFRAMEWORK.Animation.fromMotion3Json(r.data);
                        motions.set(name, anim);
                      } catch (e) {}
                    }
                  });
                  motionsRef.current = motions;

                  const expressions = new Map<string, { id: string; value: number; blend: string }[]>();
                  expressionKeys.forEach((key) => {
                    const r = res2[key];
                    if (r?.data?.Parameters) {
                      const name = key.replace("exp_", "");
                      const params = r.data.Parameters.map((p: any) => ({
                        id: p.Id,
                        value: p.Value,
                        blend: p.Blend || "Set",
                      }));
                      expressions.set(name, params);
                    }
                  });
                  expressionsRef.current = expressions;

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
                  if (model.masks) {
                    app.stage.addChild(model.masks);
                  }

                  const baseScale = Math.min(width, height) * 0.0015 * scale;
                  const modelScale = baseScale > 0 ? baseScale : 1;
                  model.position.x = width * 0.5;
                  model.position.y = height * positionY;
                  model.scale.x = modelScale;
                  model.scale.y = modelScale;

                  if (model.masks?.resize) {
                    model.masks.resize(app.view.width, app.view.height);
                  }

                  let lastTime = performance.now();
                  const animate = () => {
                    if (destroyedRef.current || !model) return;

                    const now = performance.now();
                    const dt = Math.min((now - lastTime) / 1000, 0.05);
                    lastTime = now;

                    if (!model.animator.isPlaying) {
                      const idle = model.motions?.get?.("idle") ||
                        model.motions?.get?.("Idle") ||
                        model.motions?.get?.("微笑-正常") ||
                        (motions.size > 0 ? Array.from(motions.values())[0] : null);
                      if (idle) {
                        try { model.animator.getLayer("base").play(idle); } catch (e) {}
                      }
                    }

                    try {
                      model._animator?.updateAndEvaluate?.(dt);

                      if (model.inDrag) {
                        model.addParameterValueById?.("ParamAngleX", model.pointerX * 30);
                        model.addParameterValueById?.("ParamAngleY", -model.pointerY * 30);
                        model.addParameterValueById?.("ParamBodyAngleX", model.pointerX * 10);
                        model.addParameterValueById?.("ParamEyeBallX", model.pointerX);
                        model.addParameterValueById?.("ParamEyeBallY", -model.pointerY);
                      }

                      if (model._physicsRig) {
                        model._physicsRig.updateAndEvaluate?.(dt);
                      }

                      model._coreModel?.update?.();

                      if (model._meshes) {
                        let sort = false;
                        for (let m = 0; m < model._meshes.length; ++m) {
                          const mesh = model._meshes[m];
                          mesh.alpha = model._coreModel.drawables.opacities[m];
                          mesh.visible = Live2DCubismCore.Utils.hasIsVisibleBit(
                            model._coreModel.drawables.dynamicFlags[m]
                          );
                          if (
                            Live2DCubismCore.Utils.hasVertexPositionsDidChangeBit?.(
                              model._coreModel.drawables.dynamicFlags[m]
                            )
                          ) {
                            mesh.vertices = model._coreModel.drawables.vertexPositions[m];
                            mesh.dirtyVertex = true;
                          }
                          if (
                            Live2DCubismCore.Utils.hasRenderOrderDidChangeBit?.(
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

                        model._coreModel.drawables.resetDynamicFlags?.();
                      }
                    } catch (e) {}

                    animFrameId = requestAnimationFrame(animate);
                  };
                  animFrameId = requestAnimationFrame(animate);

                  const handleResize = () => {
                    updateSize();
                  };

                  let ro: any = null;
                  if (typeof ResizeObserver !== "undefined") {
                    ro = new ResizeObserver(handleResize);
                    ro.observe(container);
                  } else {
                    (window as any).addEventListener("resize", handleResize);
                  }

                  let lastTap = 0;

                  const updatePointerPosition = (e: any) => {
                    if (!model || !app) return;
                    const rect = app.view.getBoundingClientRect();
                    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
                    const y = ((clientY - rect.top) / rect.height) * 2 - 1;
                    model.pointerX = Math.max(-1, Math.min(1, x));
                    model.pointerY = Math.max(-1, Math.min(1, y));
                  };

                  const handlePointerDown = (e: any) => {
                    if (!model || destroyedRef.current) return;
                    model.inDrag = true;
                    updatePointerPosition(e);
                  };

                  const handlePointerMove = (e: any) => {
                    if (!model || destroyedRef.current) return;
                    if (model.inDrag) {
                      updatePointerPosition(e);
                    }
                  };

                  const handlePointerUp = () => {
                    if (!model || destroyedRef.current) return;
                    model.inDrag = false;
                  };

                  const handleTap = (e: any) => {
                    if (!model || destroyedRef.current) return;
                    const now = Date.now();
                    if (now - lastTap < 300) return;
                    lastTap = now;

                    const keys = Array.from(motionsRef.current.keys());
                    const nonIdleKeys = keys.filter(
                      k => !k.toLowerCase().includes("idle") && !k.includes("微笑-正常")
                    );
                    const useKeys = nonIdleKeys.length > 0 ? nonIdleKeys : keys;
                    if (useKeys.length > 0) {
                      const key = useKeys[Math.floor(Math.random() * useKeys.length)];
                      const motion = motionsRef.current.get(key);
                      if (motion && model.animator) {
                        const layer = model.animator.getLayer("base");
                        if (layer) {
                          try { layer.play(motion); } catch (e) {}
                        }
                      }
                    }

                    const expKeys = Array.from(expressionsRef.current.keys());
                    if (expKeys.length > 0) {
                      const expKey = expKeys[Math.floor(Math.random() * expKeys.length)];
                      const expParams = expressionsRef.current.get(expKey);
                      if (expParams) {
                        expParams.forEach(({ id, value, blend }) => {
                          try {
                            if (blend === "Add") model.addParameterValueById(id, value);
                            else if (blend === "Multiply") model.multiplyParameterValueById(id, value);
                            else model.setParameterValueById(id, value);
                          } catch (e) {}
                        });
                      }
                    }
                  };

                  const canvasEl = app.view as HTMLCanvasElement;
                  canvasEl.addEventListener("mousedown", handlePointerDown);
                  canvasEl.addEventListener("mousemove", handlePointerMove);
                  canvasEl.addEventListener("mouseup", handlePointerUp);
                  canvasEl.addEventListener("mouseleave", handlePointerUp);
                  canvasEl.addEventListener("click", handleTap);
                  canvasEl.addEventListener("touchstart", handlePointerDown, { passive: true });
                  canvasEl.addEventListener("touchmove", handlePointerMove, { passive: true });
                  canvasEl.addEventListener("touchend", handlePointerUp);

                  extraCleanupRef.current = () => {
                    if (ro) {
                      ro.disconnect();
                      ro = null;
                    } else {
                      (window as any).removeEventListener("resize", handleResize);
                    }
                    if (canvasEl) {
                      canvasEl.removeEventListener("mousedown", handlePointerDown);
                      canvasEl.removeEventListener("mousemove", handlePointerMove);
                      canvasEl.removeEventListener("mouseup", handlePointerUp);
                      canvasEl.removeEventListener("mouseleave", handlePointerUp);
                      canvasEl.removeEventListener("click", handleTap);
                      canvasEl.removeEventListener("touchstart", handlePointerDown);
                      canvasEl.removeEventListener("touchmove", handlePointerMove);
                      canvasEl.removeEventListener("touchend", handlePointerUp);
                    }
                  };

                  isLoadedRef.current = true;
                  setIsLoading(false);
                  onModelLoaded?.();

                  resolve();
                } catch (err) {
                  reject(err);
                }
              });
            });

            loader.onError.add(onError);
          });
        } catch (err: any) {
          if (err?.message !== "destroyed") {
            console.error("Live2D load error:", err);
            setLoadError(err?.message || "模型加载失败");
            onError?.(err?.message || "模型加载失败");
          }
          setIsLoading(false);
          isLoadingRef.current = false;
        }
      };

      setup();

      return cleanup;
    }, [modelPath, modelName, scale, positionY, webglSupported, onModelLoaded, onError]);

    return (
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          ref={canvasContainerRef}
          style={{
            width: "100%",
            height: "100%",
          }}
        />
        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.6)",
              fontSize: "14px",
            }}
          >
            加载中...
          </div>
        )}
        {loadError && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,100,100,0.8)",
              fontSize: "14px",
              textAlign: "center",
              padding: "20px",
            }}
          >
            {loadError}
          </div>
        )}
      </div>
    );
  }
);

Live2DPlayer.displayName = "Live2DPlayer";

export default Live2DPlayer;
