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

const SCRIPTS = ["/vendor/live2dv2/live2d.js"];

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

function loadAllScripts(): Promise<void> {
  if (scriptsReady) return Promise.resolve();
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

let canvasCounter = 0;

const Live2DCubism2Player = forwardRef<Live2DCubism2PlayerRef, Live2DCubism2PlayerProps>(
  ({ modelPath, modelJson, scale = 1, positionY = 0.5, onModelLoaded, onError }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const canvasIdRef = useRef(`live2d-cubism2-${++canvasCounter}`);

    useImperativeHandle(ref, () => ({
      playMotion: (group: string, index = 0) => {},
      setExpression: (name: string) => {},
    }));

    useEffect(() => {
      let cancelled = false;

      async function init() {
        try {
          await loadAllScripts();
          if (cancelled) return;
          if (!window.loadlive2d) {
            throw new Error("loadlive2d function not found");
          }
          loadModel();
        } catch (e: any) {
          if (!cancelled) {
            setLoadError(e.message || "Failed to load Live2D Cubism 2 libraries");
            setIsLoading(false);
            onError?.(e.message || "Failed to load Live2D Cubism 2 libraries");
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
      if (!canvasRef.current) return;

      const basePath = modelPath.endsWith("/") ? modelPath : `${modelPath}/`;
      const fullModelJson = `${basePath}${modelJson}`;

      try {
        window.loadlive2d(canvasIdRef.current, fullModelJson);
        
        setTimeout(() => {
          setIsLoading(false);
          onModelLoaded?.();
        }, 1000);
      } catch (e: any) {
        setLoadError(e.message || "Failed to load model");
        setIsLoading(false);
        onError?.(e.message || "Failed to load model");
      }
    };

    return (
      <div ref={containerRef} className="w-full h-full relative">
        <canvas
          ref={canvasRef}
          id={canvasIdRef.current}
          width={300}
          height={600}
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
