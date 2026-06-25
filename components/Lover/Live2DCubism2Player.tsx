"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";

interface Live2DCubism2PlayerProps {
  modelPath: string;
  modelJson: string;
  scale?: number;
  positionY?: number;
  onModelLoaded?: () => void;
  onError?: (error: string) => void;
}

export interface Live2DCubism2PlayerRef {
  playMotion: (group: string, index?: number) => void;
  setExpression: (name: string) => void;
}

declare global {
  interface Window {
    loadlive2d: (canvasId: string, modelJsonPath: string) => void;
  }
}

function waitForLoadlive2d(): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      if (typeof window.loadlive2d === "function") {
        resolve();
        return;
      }
      attempts++;
      if (attempts > 100) {
        reject(new Error("Cubism 2 library not loaded"));
        return;
      }
      setTimeout(check, 100);
    };
    check();
  });
}

let canvasCounter = 0;

const Live2DCubism2Player = forwardRef<Live2DCubism2PlayerRef, Live2DCubism2PlayerProps>(
  ({ modelPath, modelJson, scale = 1, positionY = 0.5, onModelLoaded, onError }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const canvasIdRef = useRef(`live2d-c2-${++canvasCounter}`);

    useImperativeHandle(ref, () => ({
      playMotion: (group: string, index = 0) => {},
      setExpression: (name: string) => {},
    }));

    useEffect(() => {
      let cancelled = false;

      async function init() {
        try {
          await waitForLoadlive2d();
          if (cancelled) return;
          loadModel();
        } catch (e: any) {
          if (!cancelled) {
            setLoadError(e.message || "Failed to load Cubism 2 library");
            setIsLoading(false);
            onError?.(e.message || "Failed to load Cubism 2 library");
          }
        }
      }

      init();

      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modelPath, modelJson]);

    const loadModel = () => {
      if (!canvasIdRef.current) return;

      const basePath = modelPath.endsWith("/") ? modelPath : `${modelPath}/`;
      const fullModelJson = `${basePath}${modelJson}`;

      try {
        window.loadlive2d(canvasIdRef.current, fullModelJson);
        
        setTimeout(() => {
          setIsLoading(false);
          onModelLoaded?.();
        }, 1500);
      } catch (e: any) {
        setLoadError(e.message || "Failed to load model");
        setIsLoading(false);
        onError?.(e.message || "Failed to load model");
      }
    };

    return (
      <div ref={containerRef} className="w-full h-full relative">
        <canvas
          id={canvasIdRef.current}
          width={400}
          height={800}
          className="w-full h-full"
        />
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

Live2DCubism2Player.displayName = "Live2DCubism2Player";

export default Live2DCubism2Player;
