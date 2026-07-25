import { transformBetterDefine } from "./core-CGexSluR.js";
import { resolveDtsHMR } from "@vue-macros/api";
import { FilterFileType, createFilter, detectVueVersion, getFilterPattern } from "@vue-macros/common";
import process from "node:process";
import { createUnplugin } from "unplugin";

//#region src/index.ts
function resolveOptions(options, framework) {
	const version = options.version || detectVueVersion();
	return {
		include: getFilterPattern([FilterFileType.VUE_SFC_WITH_SETUP, FilterFileType.SETUP_SFC], framework),
		isProduction: process.env.NODE_ENV === "production",
		...options,
		version
	};
}
const name = "unplugin-vue-better-define";
const plugin = createUnplugin((userOptions = {}, { framework }) => {
	const options = resolveOptions(userOptions, framework);
	const filter = createFilter(options);
	return {
		name,
		enforce: "pre",
		transformInclude: filter,
		transform(code, id) {
			return transformBetterDefine(code, id, options.isProduction).match((res) => res, (error) => {
				this.warn(`${name} ${error}`);
				console.warn(error);
			});
		},
		vite: {
			configResolved(config) {
				options.isProduction ??= config.isProduction;
			},
			handleHotUpdate: resolveDtsHMR
		}
	};
});
var src_default = plugin;

//#endregion
export { src_default };