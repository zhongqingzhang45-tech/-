"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as PIXI from "pixi.js";

export interface Live2DPlayerProps {
  modelUrl: string;
  width?: number;
  height?: number;
  mouthOpenSize?: number;
  nowSpeaking?: boolean;
  expression?: string;
  motion?: string;
  motionIndex?: number;
  scale?: number;
  positionOffset?: { x: number; y: number };
  autoBlink?: boolean;
  idleAnimation?: boolean;
  eyeTracking?: boolean;
  onModelLoaded?: () => void;
  onError?: (error: Error) => void;
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
}: Live2DPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const modelRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
  const coreModelRef = useRef<any>(null);

  const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
  const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
  const easeInQuad = (t: number) => t * t;

  const updateAutoBlink = useCallback((dt: number) => {
    const coreModel = coreModelRef.current;
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
    if (!canvasRef.current) return;
    if (typeof window === "undefined") return;

    let isMounted = true;
    let live2dModule: any = null;

    const initApp = async () => {
      try {
        (window as any).PIXI = PIXI;

        const mod = await import("pixi-live2d-display/cubism4");
        live2dModule = mod;

        const app = new PIXI.Application({
          view: canvasRef.current!,
          width,
          height,
          transparent: true,
          antialias: true,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 2, 2),
          backgroundColor: 0x000000,
        });

        if (!isMounted) {
          app.destroy(true);
          return;
        }

        appRef.current = app;

        const { Live2DModel } = mod;
        const model = await Live2DModel.from(modelUrl, {
          autoInteract: eyeTracking,
        });

        if (!isMounted) {
          model.destroy();
          app.destroy(true);
          return;
        }

        modelRef.current = model;
        app.stage.addChild(model);

        model.anchor?.set(0.5, 0.5);
        model.x = width / 2 + positionOffset.x;
        model.y = height / 2 + positionOffset.y;

        const baseScale = Math.min(width / model.width, height / model.height) * scale;
        model.scale.set(baseScale, baseScale);

        const internalModel = model.internalModel;
        const coreModel: any = internalModel?.coreModel;
        const motionManager: any = internalModel?.motionManager;

        coreModelRef.current = coreModel;

        if (coreModel) {
          coreModel.setParameterValueById?.("ParamMouthOpenY", mouthOpenSize);
        }

        if (motionManager && idleAnimation) {
          setTimeout(() => {
            try {
              model.motion("Idle", 0);
            } catch (e) {
              // ignore
            }
          }, 500);
        }

        lastUpdateTimeRef.current = performance.now();

        const tick = () => {
          if (!modelRef.current || !appRef.current) return;

          const now = performance.now();
          const dt = now - lastUpdateTimeRef.current;
          lastUpdateTimeRef.current = now;

          if (coreModelRef.current) {
            if (autoBlink) {
              updateAutoBlink(dt);
            }

            if (nowSpeaking) {
              coreModelRef.current.setParameterValueById?.("ParamMouthOpenY", mouthOpenSize);
            }
          }

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

    const checkCubism = () => {
      if (typeof (window as any).Live2DCubismCore !== "undefined") {
        initApp();
      } else {
        setTimeout(checkCubism, 100);
      }
    };

    checkCubism();

    return () => {
      isMounted = false;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (modelRef.current) {
        try {
          modelRef.current.destroy?.();
        } catch (e) {
          // ignore
        }
        modelRef.current = null;
      }

      if (appRef.current) {
        try {
          appRef.current.destroy(true);
        } catch (e) {
          // ignore
        }
        appRef.current = null;
      }

      coreModelRef.current = null;
    };
  }, [modelUrl, width, height]);

  useEffect(() => {
    if (!coreModelRef.current) return;
    if (nowSpeaking) {
      coreModelRef.current.setParameterValueById?.("ParamMouthOpenY", mouthOpenSize);
    }
  }, [mouthOpenSize, nowSpeaking]);

  useEffect(() => {
    if (!modelRef.current || !expression) return;
    try {
      modelRef.current.expression?.(expression);
    } catch (e) {
      // ignore
    }
  }, [expression]);

  useEffect(() => {
    if (!modelRef.current || !motion) return;
    try {
      modelRef.current.motion?.(motion, motionIndex);
    } catch (e) {
      // ignore
    }
  }, [motion, motionIndex]);

  useEffect(() => {
    if (!modelRef.current || !appRef.current) return;

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
