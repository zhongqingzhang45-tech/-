import { BaseOptions, MarkRequired } from "@vue-macros/common";
import { UnpluginInstance } from "unplugin";

//#region src/core/constants.d.ts
declare const QUERY_NAMED_TEMPLATE = "?vue&type=named-template";
declare const QUERY_TEMPLATE = "type=template&namedTemplate";
declare const QUERY_TEMPLATE_MAIN: "type=template&namedTemplate&mainTemplate";
declare const MAIN_TEMPLATE: unique symbol;
//#endregion
//#region src/index.d.ts
type Options = BaseOptions;
type OptionsResolved = MarkRequired<Options, "include" | "version">;
type TemplateContent = Record<string, Record<string, string> & {
  [MAIN_TEMPLATE]?: string;
}>;
declare const PrePlugin: UnpluginInstance<Options | undefined, false>;
type CustomBlocks = Record<string, Record<string, string>>;
declare const PostPlugin: UnpluginInstance<Options | undefined, false>;
declare const plugin: UnpluginInstance<Options | undefined, true>;
//#endregion
export { CustomBlocks, MAIN_TEMPLATE, Options, OptionsResolved, PostPlugin, PrePlugin, QUERY_NAMED_TEMPLATE, QUERY_TEMPLATE, QUERY_TEMPLATE_MAIN, TemplateContent, plugin };