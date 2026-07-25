import { CodeTransform } from "@vue-macros/common";

//#region src/core/index.d.ts
declare const EMIT_VARIABLE_NAME: "__MACROS_emit";
interface Emit {
  name: string;
  validator?: string;
}
declare function transformDefineEmit(code: string, id: string): CodeTransform | undefined;
//#endregion
export { EMIT_VARIABLE_NAME, Emit, transformDefineEmit };