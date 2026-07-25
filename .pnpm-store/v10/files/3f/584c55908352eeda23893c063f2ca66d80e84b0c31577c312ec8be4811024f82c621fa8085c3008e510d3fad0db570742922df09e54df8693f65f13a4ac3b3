import { code_default, helperId, transformDefineProp } from "./core-CewSgBVX.js";
import { resolveDtsHMR } from "@vue-macros/api";
import { FilterFileType, createFilter, detectVueVersion, getFilterPattern, normalizePath } from "@vue-macros/common";
import process from "node:process";
import { createUnplugin } from "unplugin";

//#region src/index.ts
function resolveOptions(options, framework) {
	const version = options.version || detectVueVersion();
	return {
		include: getFilterPattern([FilterFileType.VUE_SFC_WITH_SETUP, FilterFileType.SETUP_SFC], framework),
		isProduction: process.env.NODE_ENV === "production",
		edition: "kevinEdition",
		...options,
		version
	};
}
const name = "unplugin-vue-define-prop";
const plugin = createUnplugin((userOptions = {}, { framework }) => {
	const options = resolveOptions(userOptions, framework);
	const filter = createFilter(options);
	return {
		name,
		enforce: "pre",
		resolveId(id) {
			if (id === normalizePath(helperId)) return id;
		},
		loadInclude(id) {
			return normalizePath(id) === helperId;
		},
		load(id) {
			if (normalizePath(id) === helperId) return code_default;
		},
		transformInclude: filter,
		transform(code, id) {
			return transformDefineProp(code, id, options.edition, options.isProduction);
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