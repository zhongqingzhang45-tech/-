import { BaseOptions, MarkRequired } from "@vue-macros/common";
import { UnpluginFactory } from "unplugin";

//#region src/core/plugin.d.ts
type Options = BaseOptions & {
  prefix?: string;
  lib?: "vue" | "react" | "preact" | "solid" | (string & {});
};
type OptionsResolved = MarkRequired<Options, "version" | "prefix" | "lib">;
declare const plugin: UnpluginFactory<Options | undefined, false>;
//#endregion
export { Options, OptionsResolved, plugin };