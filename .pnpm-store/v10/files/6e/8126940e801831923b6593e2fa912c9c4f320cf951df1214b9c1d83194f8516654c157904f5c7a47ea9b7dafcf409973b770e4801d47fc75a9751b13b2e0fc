import { transformSetupBlock } from "./core-Csu_XMlO.js";
import { REGEX_SETUP_SFC, REGEX_VUE_SFC, createFilter, detectVueVersion } from "@vue-macros/common";
import { createUnplugin } from "unplugin";

//#region src/index.ts
function resolveOptions(options) {
	const version = options.version || detectVueVersion();
	return {
		include: [REGEX_VUE_SFC, REGEX_SETUP_SFC],
		defaultLang: "ts",
		...options,
		version
	};
}
const name = "unplugin-vue-setup-block";
const plugin = createUnplugin((userOptions = {}) => {
	const options = resolveOptions(userOptions);
	const filter = createFilter(options);
	return {
		name,
		enforce: "pre",
		transformInclude(id) {
			return filter(id);
		},
		transform(code, id) {
			return transformSetupBlock(code, id, options.defaultLang);
		}
	};
});
var src_default = plugin;

//#endregion
export { src_default };