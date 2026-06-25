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

const C2_SCRIPT = "/vendor/live2dv2/live2d.js";

let c2ScriptLoading = false;
let c2ScriptReady = false;
let c2ScriptPromise: Promise<void> | null = null;

function loadC2Script(): Promise<void> {
  if (c2ScriptReady) return Promise.resolve();
  if (typeof window.loadlive2d === "function") {
    c2ScriptReady = true;
    return Promise.resolve();
  }
  if (c2ScriptPromise) return c2ScriptPromise;
  
  c2ScriptLoading = true;
  c2ScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${C2_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => {
        c2ScriptReady = true;
        c2ScriptLoading = false;
        resolve();
      });
      existing.addEventListener("error", () => reject(new Error("Failed to load Cubism 2 library")));
      return;
    }
    const script = document.createElement("script");
    script.src = C2_SCRIPT;
    script.onload = () => {
      c2ScriptReady = true;
      c2ScriptLoading = false;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Cubism 2 library"));
    document.head.appendChild(script);
  });
  
  return c2ScriptPromise;
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
          await loadC2Script();
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
