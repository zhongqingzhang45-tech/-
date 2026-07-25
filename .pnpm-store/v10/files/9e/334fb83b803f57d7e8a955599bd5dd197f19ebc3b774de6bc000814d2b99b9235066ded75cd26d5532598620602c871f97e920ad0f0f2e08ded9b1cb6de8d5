import { code_default, helperId, shouldTransform, transform, transformVueSFC } from "./core-DozVD9fL.js";
import { FilterFileType, REGEX_NODE_MODULES, createFilter, createRollupFilter, detectVueVersion, getFilterPattern, normalizePath } from "@vue-macros/common";
import { createUnplugin } from "unplugin";

//#region src/index.ts
function resolveOptions(options, framework) {
	const version = options.version || detectVueVersion();
	return {
		include: getFilterPattern([FilterFileType.SRC_FILE, FilterFileType.VUE_SFC_WITH_SETUP], framework),
		exclude: [REGEX_NODE_MODULES],
		...options,
		version
	};
}
const name = "unplugin-vue-reactivity-transform";
const plugin = createUnplugin((userOptions = {}, { framework }) => {
	const options = resolveOptions(userOptions, framework);
	const filter = createFilter(options);
	const filterSFC = createRollupFilter(getFilterPattern([FilterFileType.VUE_SFC_WITH_SETUP, FilterFileType.SETUP_SFC], framework));
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
			if (filterSFC(id)) return transformVueSFC(code, id);
			else if (shouldTransform(code)) return transform(code, {
				filename: id,
				sourceMap: true
			});
		}
	};
});
var src_default = plugin;

//#endregion
export { src_default };