"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Application } from "pixi.js";
import { Live2DModel, Live2DFactory, MotionPriority } from "pixi-live2d-display/cubism4";

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

interface ExpressionEntry {
  name: string;
  parameterId: string;
  blend: "Add" | "Multiply" | "Overwrite";
  value: number;
  defaultValue: number;
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
  const appRef = useRef<Application | null>(null);
  const modelRef = useRef<Live2DModel | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
  const expressionsRef = useRef<Map<string, ExpressionEntry[]>>(new Map());
  const activeExpressionRef = useRef<string | null>(null);

  const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

  const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
  const easeInQuad = (t: number) => t * t;

  const updateAutoBlink = useCallback((dt: number, coreModel: any) => {
    const state = blinkStateRef.current;
    const BLINK_CLOSE_DURATION = 75;

    if (state.phase === "idle") {
      state.delayMs = Math.max(0, state.delayMs - dt);
      if (state.delayMs <= 0) {
        state.phase = "closing";
        state.progress = 0;
        const leftEye = coreModel.getParameterValueById("ParamEyeLOpen") ?? 1;
        const rightEye = coreModel.getParameterValueById("ParamEyeROpen") ?? 1;
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
      coreModel.setParameterValueById("ParamEyeLOpen", eyeLOpen);
      coreModel.setParameterValueById("ParamEyeROpen", eyeROpen);

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
      coreModel.setParameterValueById("ParamEyeLOpen", eyeLOpen);
      coreModel.setParameterValueById("ParamEyeROpen", eyeROpen);

      if (state.progress >= 1) {
        state.phase = "idle";
        state.delayMs = 3000 + Math.random() * 5000;
      }
    }
  }, []);

  const loadExpressions = useCallback(async (model: Live2DModel) => {
    const internalModel = (model as any).internalModel;
    const settings = internalModel?.settings;
    if (!settings?.expressions) return;

    const expMap = new Map<string, ExpressionEntry[]>();

    for (const expRef of settings.expressions) {
      try {
        const expUrl = settings.resolveURL?.(expRef.File) ?? expRef.File;
        const response = await fetch(expUrl);
        const expData = await response.json();

        const entries: ExpressionEntry[] = [];
        if (expData.Parameters) {
          for (const param of expData.Parameters) {
            entries.push({
              name: expRef.Name,
              parameterId: param.Id,
              blend: param.Blend || "Overwrite",
              value: param.Value,
              defaultValue: 0,
            });
          }
        }
        expMap.set(expRef.Name, entries);
      } catch (err) {
        console.warn(`Failed to load expression ${expRef.Name}:`, err);
      }
    }

    expressionsRef.current = expMap;
  }, []);

  const applyExpression = useCallback((expressionName: string | null, coreModel: any) => {
    if (!expressionName) {
      activeExpressionRef.current = null;
      return;
    }

    const entries = expressionsRef.current.get(expressionName);
    if (!entries) return;

    activeExpressionRef.current = expressionName;

    for (const entry of entries) {
      let targetValue = entry.value;
      if (entry.blend === "Add") {
        const current = coreModel.getParameterValueById(entry.parameterId) ?? 0;
        targetValue = current + entry.value;
      } else if (entry.blend === "Multiply") {
        const current = coreModel.getParameterValueById(entry.parameterId) ?? 1;
        targetValue = current * entry.value;
      }
      coreModel.setParameterValueById(entry.parameterId, targetValue);
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    let isMounted = true;

    const initApp = async () => {
      try {
        const app = new Application();
        await app.init({
          canvas: canvasRef.current!,
          width,
          height,
          backgroundAlpha: 0,
          antialias: true,
          autoDensity: true,
          resolution: window.devicePixelRatio || 2,
        });

        appRef.current = app;

        const model = new Live2DModel();
        await Live2DFactory.setupLive2DModel(model, { url: modelUrl }, { autoInteract: false });

        if (!isMounted) {
          model.destroy();
          app.destroy(true);
          return;
        }

        modelRef.current = model;
        (app.stage as any).addChild(model);

        model.anchor.set(0.5, 0.5);
        model.x = width / 2 + positionOffset.x;
        model.y = height / 2 + positionOffset.y;

        const baseScale = Math.min(width / model.width, height / model.height) * scale;
        model.scale.set(baseScale, baseScale);

        await loadExpressions(model);

        const internalModel = (model as any).internalModel;
        const coreModel = internalModel?.coreModel;
        const motionManager = internalModel?.motionManager;

        if (coreModel) {
          coreModel.setParameterValueById("ParamMouthOpenY", mouthOpenSize);
        }

        if (motionManager && idleAnimation) {
          setTimeout(() => {
            model.motion("Idle", 0, MotionPriority.IDLE);
          }, 300);
        }

        if (motionManager) {
          const originalUpdate = motionManager.update.bind(motionManager);
          lastUpdateTimeRef.current = performance.now();

          const tick = () => {
            if (!modelRef.current || !appRef.current) return;

            const now = performance.now();
            const dt = now - lastUpdateTimeRef.current;
            lastUpdateTimeRef.current = now;

            const coreModel = (modelRef.current as any).internalModel?.coreModel;

            if (coreModel) {
              if (autoBlink) {
                updateAutoBlink(dt, coreModel);
              }

              if (nowSpeaking) {
                coreModel.setParameterValueById("ParamMouthOpenY", mouthOpenSize);
              }

              if (activeExpressionRef.current) {
                applyExpression(activeExpressionRef.current, coreModel);
              }
            }

            animationFrameRef.current = requestAnimationFrame(tick);
          };

          animationFrameRef.current = requestAnimationFrame(tick);
        }

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

      if (appRef.current) {
        try {
          appRef.current.destroy(true);
        } catch (e) {
          // ignore
        }
        appRef.current = null;
      }
    };
  }, [modelUrl, width, height]);

  useEffect(() => {
    if (!modelRef.current) return;
    const model = modelRef.current;
    const coreModel = (model as any).internalModel?.coreModel;
    if (coreModel && nowSpeaking) {
      coreModel.setParameterValueById("ParamMouthOpenY", mouthOpenSize);
    }
  }, [mouthOpenSize, nowSpeaking]);

  useEffect(() => {
    if (!modelRef.current) return;
    const model = modelRef.current;
    const coreModel = (model as any).internalModel?.coreModel;
    if (coreModel) {
      applyExpression(expression ?? null, coreModel);
    }
  }, [expression, applyExpression]);

  useEffect(() => {
    if (!modelRef.current || !motion) return;
    modelRef.current.motion(motion, motionIndex, MotionPriority.FORCE);
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
      ref={containerRef}
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
