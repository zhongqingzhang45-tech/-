import { BaseOptions, MarkRequired } from "@vue-macros/common";
import { UnpluginInstance } from "unplugin";

//#region src/index.d.ts
interface Options extends BaseOptions {
  /**
  * @default 'ts'
  */
  defaultLang?: "ts" | "tsx" | "jsx" | (string & {});
}
type OptionsResolved = MarkRequired<Options, "include" | "version">;
declare const plugin: UnpluginInstance<Options | undefined, false>;
//#endregion
export { Options, OptionsResolved, plugin };