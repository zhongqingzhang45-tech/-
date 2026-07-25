import { RspackPluginFunction, RspackPluginInstance } from "@rspack/core";
import { Plugin as EsbuildPlugin } from "esbuild";
import { Plugin } from "rolldown";
import { Plugin as RollupPlugin } from "rollup";
import { UnpluginInstance } from "unplugin";
import { Plugin as VitePlugin } from "vite";
import { Compiler, WebpackPluginInstance } from "webpack";

//#region src/types.d.ts
type WebpackPlugin = ((this: Compiler, compiler: Compiler) => void) | WebpackPluginInstance;
type RspackPlugin = RspackPluginInstance | RspackPluginFunction;
interface PluginMap {
  rollup: RollupPlugin;
  rolldown: Plugin;
  vite: VitePlugin;
  esbuild: EsbuildPlugin;
  webpack: WebpackPlugin;
  rspack: RspackPlugin;
}
type PluginType = keyof PluginMap;
type Plugin$1 = PluginMap[PluginType];
type RemoveFalsy<T> = Exclude<T, false | "" | 0 | null | undefined>;
type Factory<UserOptions> = (userOptions: UserOptions, meta: {
  framework?: PluginType;
}) => CombineOptions;
type FactoryOutput<UserOptions, Return> = [never] extends UserOptions ? () => Return : undefined extends UserOptions ? (options?: UserOptions) => Return : (options: UserOptions) => Return;
type Unplugin<UserOptions> = {
  instance: UnpluginInstance<UserOptions, boolean> | UnpluginCombineInstance<any>;
  options?: UserOptions;
};
type Awaitable<T> = T | Promise<T>;
type OptionsPlugin = Awaitable<Plugin$1> | Unplugin<any> | Awaitable<OptionsPlugin[]>;
interface CombineOptions {
  name: string;
  /** vite only */
  enforce?: "post" | "pre" | undefined;
  plugins: OptionsPlugin;
}
interface UnpluginCombineInstance<UserOptions> {
  rollup: FactoryOutput<UserOptions, Promise<RollupPlugin[]>>;
  rolldown: FactoryOutput<UserOptions, Promise<Plugin[]>>;
  webpack: FactoryOutput<UserOptions, WebpackPlugin>;
  rspack: FactoryOutput<UserOptions, RspackPlugin>;
  vite: FactoryOutput<UserOptions, Promise<VitePlugin[]>>;
  esbuild: FactoryOutput<UserOptions, EsbuildPlugin>;
  raw: Factory<UserOptions>;
  plugins: FactoryOutput<UserOptions, OptionsPlugin>;
}
//#endregion
export { FactoryOutput as a, PluginMap as c, RollupPlugin as d, RspackPlugin as f, WebpackPlugin as g, VitePlugin as h, Factory as i, PluginType as l, UnpluginCombineInstance as m, CombineOptions as n, OptionsPlugin as o, Unplugin as p, EsbuildPlugin as r, Plugin$1 as s, Awaitable as t, RemoveFalsy as u };