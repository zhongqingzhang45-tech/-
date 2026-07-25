import { CodeTransform } from "@vue-macros/common";
import * as vite0 from "vite";
import { HmrContext } from "vite";

//#region src/core/index.d.ts
declare function transformSetupSFC(code: string, id: string): CodeTransform | undefined;
declare function hotUpdateSetupSFC({
  modules
}: HmrContext, filter: (id: unknown) => boolean): vite0.ModuleNode[];
//#endregion
export { hotUpdateSetupSFC, transformSetupSFC };