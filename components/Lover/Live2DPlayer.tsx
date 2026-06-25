"use client";

import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    PIXI: any;
    live2dcubismcore: any;
    __live2dLoadingPromise?: Promise<void>;
  }
}

export interface Live2DPlayerProps {
  modelUrl: string;
  width?: number;
  height?: number;
  mouthOpenSize?: number;
  nowSpeaking?: boolean;
  expression?: string | number;
  motion?: string;
  motionIndex?: number;
  scale?: number;
  positionOffset?: { x: number; y: number };
  autoBlink?: boolean;
  idleAnimation?: boolean;
  eyeTracking?: boolean;
  onModelLoaded?: () => void;
  onError?: (error: Error) => void;
  onHit?: (hitAreas: string[]) => void;
}

function ensureLive2DScripts(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  
  if (window.PIXI?.live2d?.Live2DModel) {
    return Promise.resolve();
  }
  
  if (window.__live2dLoadingPromise) {
    return window.__live2dLoadingPromise;
  }
  
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.crossOrigin = "anonymous";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  };
  
  window.__live2dLoadingPromise = (async () => {
    try {
      if (!window.live2dcubismcore) {
        await loadScript("/live2dcubismcore.min.js");
      }
      if (!window.PIXI) {
        await loadScript("/vendor/pixi.min.js");
      }
      
      // PixiJS v7 compatibility shim for pixi-live2d-display
      const PIXI = window.PIXI;
      if (PIXI && PIXI.utils) {
        if (PIXI.utils.EventEmitter && !PIXI.EventEmitter) {
          PIXI.EventEmitter = PIXI.utils.EventEmitter;
        }
        if (!PIXI.TextureCache) PIXI.TextureCache = PIXI.utils.TextureCache;
        if (!PIXI.BaseTextureCache) PIXI.BaseTextureCache = PIXI.utils.BaseTextureCache;
      }
      
      if (!window.PIXI?.live2d?.Live2DModel) {
        await loadScript("/vendor/cubism4.min.js");
      }
    } catch (err) {
      window.__live2dLoadingPromise = undefined;
      throw err;
    }
  })();
  
  return window.__live2dLoadingPromise;
}

export function Live2DPlayer({
  modelUrl,
  width = 400,
  height = 500,
  mouthOpenSize = 0,
  nowSpeaking = false,
  expression,
  motion,
  motionIndex = 0,
  scale = 1,
  positionOffset = { x: 0, y: 0 },
  autoBlink = true,
  idleAnimation = true,
  eyeTracking = true,
  onModelLoaded,
  onError,
  onHit,
}: Live2DPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scriptsReady, setScriptsReady] = useState(false);

  const blinkStateRef = useRef({
    phase: "idle" as "idle" | "closing" | "opening",
    progress: 0,
    delayMs: 3000 + Math.random() * 5000,
    startLeft: 1,
    startRight: 1,
    openDurationMs: 150 + Math.random() * 150,
  });

  const lastUpdateTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
  const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
  const easeInQuad = (t: number) => t * t;

  const updateAutoBlink = useCallback((dt: number) => {
    const coreModel = modelRef.current?.internalModel?.coreModel;
    if (!coreModel) return;

    const state = blinkStateRef.current;
    const BLINK_CLOSE_DURATION = 75;

    if (state.phase === "idle") {
      state.delayMs = Math.max(0, state.delayMs - dt);
      if (state.delayMs <= 0) {
        state.phase = "closing";
        state.progress = 0;
        const leftEye = coreModel.getParameterValueById?.("ParamEyeLOpen") ?? 1;
        const rightEye = coreModel.getParameterValueById?.("ParamEyeROpen") ?? 1;
        state.startLeft = leftEye;
        state.startRight = rightEye;
      }
      return;
    }

    if (state.phase === "closing") {
      state.progress = Math.min(1, state.progress + dt / BLINK_CLOSE_DURATION);
      const eased = easeOutQuad(state.progress);
      const eyeLOpen = clamp01(state.startLeft * (1 - eased));
      const eyeROpen = clamp01(state.startRight * (1 - eased));
      coreModel.setParameterValueById?.("ParamEyeLOpen", eyeLOpen);
      coreModel.setParameterValueById?.("ParamEyeROpen", eyeROpen);

      if (state.progress >= 1) {
        state.phase = "opening";
        state.progress = 0;
        state.openDurationMs = 150 + Math.random() * 150;
      }
      return;
    }

    if (state.phase === "opening") {
      state.progress = Math.min(1, state.progress + dt / state.openDurationMs);
      const eased = easeInQuad(state.progress);
      const eyeLOpen = clamp01(state.startLeft * eased);
      const eyeROpen = clamp01(state.startRight * eased);
      coreModel.setParameterValueById?.("ParamEyeLOpen", eyeLOpen);
      coreModel.setParameterValueById?.("ParamEyeROpen", eyeROpen);

      if (state.progress >= 1) {
        state.phase = "idle";
        state.delayMs = 3000 + Math.random() * 5000;
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkReady = () => {
      if (window.PIXI && window.PIXI.live2d && window.PIXI.live2d.Live2DModel) {
        setScriptsReady(true);
        return true;
      }
      return false;
    };

    if (checkReady()) return;

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.crossOrigin = "anonymous";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
    };

    const loadAll = async () => {
      try {
        if (!window.live2dcubismcore) {
          await loadScript("/live2dcubismcore.min.js");
        }
        if (!window.PIXI) {
          await loadScript("/vendor/pixi.min.js");
        }
        
        // PixiJS v7 compatibility shim for pixi-live2d-display
        // In v7, EventEmitter was moved to PIXI.utils
        const PIXI = window.PIXI;
        if (PIXI && PIXI.utils) {
          if (PIXI.utils.EventEmitter && !PIXI.EventEmitter) {
            PIXI.EventEmitter = PIXI.utils.EventEmitter;
          }
          if (!PIXI.TextureCache) PIXI.TextureCache = PIXI.utils.TextureCache;
          if (!PIXI.BaseTextureCache) PIXI.BaseTextureCache = PIXI.utils.BaseTextureCache;
        }
        
        if (!window.PIXI?.live2d?.Live2DModel) {
          await loadScript("/vendor/cubism4.min.js");
        }
        
        setScriptsReady(true);
      } catch (err) {
        console.error("Failed to load Live2D scripts:", err);
        setLoadError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      }
    };

    loadAll();
  }, []);

  useEffect(() => {
    if (!scriptsReady || !canvasRef.current) return;

    let isMounted = true;
    let renderer: any = null;
    let stage: any = null;
    let ticker: any = null;

    const initApp = async () => {
      try {
        const PIXI = window.PIXI;
        const Live2DModel = window.PIXI.live2d.Live2DModel;
        const MotionPriority = window.PIXI.live2d.MotionPriority;

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = width;
        canvas.height = height;

        renderer = new PIXI.Renderer({
          view: canvas,
          width,
          height,
          backgroundAlpha: 0,
          antialias: true,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 2, 2),
        });

        stage = new PIXI.Container();
        appRef.current = { renderer, stage };

        const model = await Live2DModel.from(modelUrl, {
          autoInteract: eyeTracking,
        });

        if (!isMounted) {
          model.destroy();
          renderer.destroy();
          return;
        }

        modelRef.current = model;
        stage.addChild(model);

        model.anchor.set(0.5, 0.5);
        model.x = width / 2 + positionOffset.x;
        model.y = height / 2 + positionOffset.y;

        const baseScale = Math.min(width / model.width, height / model.height) * scale;
        model.scale.set(baseScale, baseScale);

        if (onHit) {
          model.on("hit", (hitAreas: string[]) => {
            onHit(hitAreas);
          });
        }

        if (idleAnimation) {
          setTimeout(() => {
            try {
              model.motion("Idle", 0, MotionPriority.IDLE);
            } catch (e) {
              // ignore
            }
          }, 500);
        }

        lastUpdateTimeRef.current = performance.now();

        const tick = () => {
          if (!modelRef.current || !renderer || !stage) return;

          const now = performance.now();
          const dt = now - lastUpdateTimeRef.current;
          lastUpdateTimeRef.current = now;

          if (autoBlink) {
            updateAutoBlink(dt);
          }

          renderer.render(stage);
          animationFrameRef.current = requestAnimationFrame(tick);
        };

        animationFrameRef.current = requestAnimationFrame(tick);

        setIsLoading(false);
        onModelLoaded?.();
      } catch (err) {
        console.error("Failed to load Live2D model:", err);
        setLoadError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
        onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    };

    initApp();

    return () => {
      isMounted = false;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (modelRef.current) {
        try {
          modelRef.current.destroy();
        } catch (e) {
          // ignore
        }
        modelRef.current = null;
      }

      if (renderer) {
        try {
          renderer.destroy();
        } catch (e) {
          // ignore
        }
      }
      appRef.current = null;
    };
  }, [scriptsReady, modelUrl, width, height]);

  useEffect(() => {
    if (!modelRef.current) return;
    const model = modelRef.current;
    if (nowSpeaking) {
      model.mouthOpen = mouthOpenSize;
    }
  }, [mouthOpenSize, nowSpeaking]);

  useEffect(() => {
    if (!modelRef.current || expression === undefined) return;
    try {
      modelRef.current.expression(expression);
    } catch (e) {
      // ignore
    }
  }, [expression]);

  useEffect(() => {
    if (!modelRef.current || !motion) return;
    try {
      const MotionPriority = window.PIXI.live2d.MotionPriority;
      modelRef.current.motion(motion, motionIndex, MotionPriority?.FORCE ?? 3);
    } catch (e) {
      // ignore
    }
  }, [motion, motionIndex]);

  useEffect(() => {
    if (!modelRef.current) return;

    const model = modelRef.current;
    const baseScale = Math.min(width / model.width, height / model.height) * scale;
    model.scale.set(baseScale, baseScale);
    model.x = width / 2 + positionOffset.x;
    model.y = height / 2 + positionOffset.y;
  }, [scale, positionOffset, width, height]);

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ width, height }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-pink-300/30 border-t-pink-400 rounded-full animate-spin" />
            <span className="text-sm text-pink-400/80">模型加载中...</span>
          </div>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5">
          <div className="text-center text-red-400/80 text-sm px-4">
            <p className="font-medium mb-1">模型加载失败</p>
            <p className="text-xs opacity-70">{loadError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
