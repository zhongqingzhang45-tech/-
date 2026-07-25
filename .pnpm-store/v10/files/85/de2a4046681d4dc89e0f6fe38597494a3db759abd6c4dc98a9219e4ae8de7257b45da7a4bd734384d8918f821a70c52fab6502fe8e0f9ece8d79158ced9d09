import { transformDefineRender } from "./core-BsAaaWQq.js";
import { REGEX_SETUP_SFC, REGEX_VUE_SFC, createFilter, detectVueVersion } from "@vue-macros/common";
import { createUnplugin } from "unplugin";

//#region src/index.ts
function resolveOptions(options) {
	const version = options.version || detectVueVersion();
	return {
		include: [
			REGEX_VUE_SFC,
			REGEX_SETUP_SFC,
			/\.(vue|setup\.[cm]?[jt]sx?)\?vue/
		],
		version,
		...options
	};
}
const name = "unplugin-vue-define-render";
const plugin = createUnplugin((userOptions = {}) => {
	const options = resolveOptions(userOptions);
	const filter = createFilter(options);
	return {
		name,
		enforce: "post",
		transformInclude(id) {
			return filter(id);
		},
		transform(code, id) {
			return transformDefineRender(code, id, options);
		}
	};
});
var src_default = plugin;

//#endregion
export { src_default };