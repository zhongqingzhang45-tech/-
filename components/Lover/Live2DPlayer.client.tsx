"use client";

import dynamic from "next/dynamic";
import type { Live2DPlayerRef, Live2DPlayerProps } from "./Live2DPlayer";

const Live2DPlayer = dynamic(() => import("./Live2DPlayer").then((mod) => ({ default: mod.default })), {
  ssr: false,
  loading: () => null,
});

export { Live2DPlayer };
export type { Live2DPlayerRef, Live2DPlayerProps };