"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";

interface Live2DV2PlayerProps {
  modelPath: string;
  modelName: string;
  scale?: number;
  positionY?: number;
  onModelLoaded?: () => void;
  onError?: (error: string) => void;
  forwardedRef?: React.Ref<Live2DV2PlayerRef>;
}

export interface Live2DV2PlayerRef {
  playMotion: (motionId: string) => void;
  triggerRandomMotion: () => void;
  setExpression: (name: string) => void;
  getModelInfo: () => { motions: string[]; expressions: string[] };
}

declare global {
  interface Window {
    loadlive2d?: (canvasId: string, modelJsonPath: string, positionY?: number) => void;
  }
}

const SCRIPTS = [
  "/vendor/live2dv2/live2d.js",
];

let loadPromise: Promise<void> | null = null;

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
  if (loadPromise) return loadPromise;
  loadPromise = SCRIPTS.reduce(
    (p, src) => p.then(() => loadScript(src)),
    Promise.resolve()
  );
  return loadPromise;
}

const Live2DV2Player = forwardRef<Live2DV2PlayerRef, Live2DV2PlayerProps>(
  ({ modelPath, modelName, scale = 1, positionY = 0.5, onModelLoaded, onError, forwardedRef }, ref) => {
    const actualRef = (forwardedRef || ref) as React.RefObject<Live2DV2PlayerRef>;
    const canvasIdRef = useRef(`live2d-v2-${Math.random().toString(36).slice(2, 9)}`);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const modelInfoRef = useRef({ motions: [] as string[], expressions: [] as string[] });

    useImperativeHandle(actualRef, () => ({
      playMotion: () => {},
      triggerRandomMotion: () => {},
      setExpression: () => {},
      getModelInfo: () => modelInfoRef.current,
    }));

    useEffect(() => {
      let destroyed = false;
      let loaded = false;

      const setup = async () => {
        try {
          await loadAllScripts();

          if (destroyed) return;
          if (!window.loadlive2d) {
            throw new Error("loadlive2d function not available");
          }

          const basePath = modelPath.endsWith("/") ? modelPath : `${modelPath}/`;
          const modelJsonPath = `${basePath}${modelName}/${modelName}.model.json`;

          try {
            const response = await fetch(modelJsonPath);
            if (response.ok) {
              const json = await response.json();
              if (json.motions) {
                modelInfoRef.current.motions = Object.keys(json.motions);
              }
              if (json.expressions) {
                modelInfoRef.current.expressions = json.expressions.map((e: any) => e.name || "default");
              }
            }
          } catch (e) {
            console.warn("Failed to fetch model info:", e);
          }

          if (destroyed) return;
          
          window.loadlive2d(canvasIdRef.current, modelJsonPath, positionY);
          loaded = true;
          
          setIsLoading(false);
          setTimeout(() => {
            if (!destroyed) {
              onModelLoaded?.();
            }
          }, 1500);

        } catch (e: any) {
          console.error("Live2D V2 load error:", e);
          if (!destroyed) {
            setLoadError(e.message || "Failed to load model");
            setIsLoading(false);
            onError?.(e.message || "Failed to load model");
          }
        }
      };

      setup();

      return () => {
        destroyed = true;
      };
    }, [modelPath, modelName, scale, positionY, onModelLoaded, onError]);

    return (
      <div className="w-full h-full relative overflow-hidden">
        <canvas
          id={canvasIdRef.current}
          className="w-full h-full block"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-white/30 text-xs">模型加载中...</div>
          </div>
        )}
      </div>
    );
  }
);

Live2DV2Player.displayName = "Live2DV2Player";

export default Live2DV2Player;
