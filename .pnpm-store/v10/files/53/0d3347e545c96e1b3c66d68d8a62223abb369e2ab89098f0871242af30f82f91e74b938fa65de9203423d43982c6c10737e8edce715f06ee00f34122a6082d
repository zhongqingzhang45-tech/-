import { hotUpdateSetupSFC, transformSetupSFC } from "./core-DQ1Zm1bB.js";
import { REGEX_SETUP_SFC_SUB, createFilter, detectVueVersion } from "@vue-macros/common";
import { createUnplugin } from "unplugin";

//#region src/index.ts
function resolveOptions(options) {
	const version = options.version || detectVueVersion();
	return {
		include: [REGEX_SETUP_SFC_SUB],
		exclude: [/vitest\.setup\.\w+$/],
		...options,
		version
	};
}
const name = "unplugin-vue-setup-sfc";
const plugin = createUnplugin((userOptions = {}) => {
	const options = resolveOptions(userOptions);
	const filter = createFilter(options);
	return {
		name,
		enforce: "pre",
		transformInclude: filter,
		transform: transformSetupSFC,
		vite: {
			config() {
				return { esbuild: {
					exclude: options.include,
					include: options.exclude
				} };
			},
			handleHotUpdate: (ctx) => {
				if (filter(ctx.file)) return hotUpdateSetupSFC(ctx, filter);
			}
		}
	};
});
var src_default = plugin;

//#endregion
export { src_default };