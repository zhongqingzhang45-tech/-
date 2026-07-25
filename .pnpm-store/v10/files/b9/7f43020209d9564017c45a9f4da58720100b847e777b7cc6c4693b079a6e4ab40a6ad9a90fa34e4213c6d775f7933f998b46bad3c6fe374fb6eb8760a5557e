import { transformScriptLang } from "./core-BuWMse3T.js";
import { REGEX_VUE_SFC, createFilter, detectVueVersion, hackViteHMR } from "@vue-macros/common";
import { createUnplugin } from "unplugin";

//#region src/index.ts
function resolveOptions(options) {
	const version = options.version || detectVueVersion();
	return {
		include: [REGEX_VUE_SFC],
		version,
		...options
	};
}
const name = "unplugin-vue-script-lang";
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
			return transformScriptLang(code, id, options);
		},
		vite: { handleHotUpdate(ctx) {
			hackViteHMR(ctx, filter, (code, id) => transformScriptLang(code, id, options));
		} }
	};
});
var src_default = plugin;

//#endregion
export { src_default };