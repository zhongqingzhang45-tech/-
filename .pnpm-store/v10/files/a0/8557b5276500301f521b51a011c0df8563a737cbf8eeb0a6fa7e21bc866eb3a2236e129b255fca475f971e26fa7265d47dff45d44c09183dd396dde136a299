import { FeatureName, OptionsResolved } from "@vue-macros/config";
import { Code } from "ts-macro";
import { SFCScriptBlock } from "@vue-macros/common";
import { VueLanguagePlugin } from "@vue/language-core";

//#region src/common.d.ts
declare const REGEX_DEFINE_COMPONENT: RegExp;
declare function addProps(codes: Code[], decl: Code[], version: number): true | undefined;
declare function addEmits(codes: Code[], decl: Code[], version: number): true | undefined;
declare function addCode(codes: Code[], ...args: Code[]): void;
type VueMacrosPlugin<K extends FeatureName> = (ctx: PluginContext, options?: OptionsResolved[K]) => ReturnType<VueLanguagePlugin>;
type PluginContext = Parameters<VueLanguagePlugin>[0];
declare function getVolarOptions<K extends keyof OptionsResolved>(context: PluginContext, key: K): OptionsResolved[K];
declare function patchSFC(block: SFCScriptBlock | null, offset: number): void;
//#endregion
export { PluginContext, REGEX_DEFINE_COMPONENT, VueMacrosPlugin, addCode, addEmits, addProps, getVolarOptions, patchSFC };