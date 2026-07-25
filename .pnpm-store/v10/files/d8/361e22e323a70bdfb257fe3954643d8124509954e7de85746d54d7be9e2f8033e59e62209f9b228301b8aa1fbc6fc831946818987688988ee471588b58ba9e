import { BaseOptions, MarkRequired } from "@vue-macros/common";
import { UnpluginInstance } from "unplugin";

//#region src/index.d.ts
interface Options extends BaseOptions {
  root?: string;
}
type OptionsResolved = MarkRequired<Options, "include" | "version" | "root">;
declare const plugin: UnpluginInstance<Options | undefined, true>;
//#endregion
export { Options, OptionsResolved, plugin };