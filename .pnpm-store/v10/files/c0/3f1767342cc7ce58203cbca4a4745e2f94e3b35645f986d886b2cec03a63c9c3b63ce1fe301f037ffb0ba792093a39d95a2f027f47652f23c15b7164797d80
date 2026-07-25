import { helperPrefix, styleXAttrsId, stylex_attrs_default, transformDefineStyleX } from "./api-s39VZQFC.js";
import { FilterFileType, createFilter, detectVueVersion, getFilterPattern, normalizePath } from "@vue-macros/common";
import { createUnplugin } from "unplugin";

//#region src/index.ts
function resolveOptions(options, framework) {
	const version = options.version || detectVueVersion();
	return {
		include: getFilterPattern([FilterFileType.VUE_SFC_WITH_SETUP, FilterFileType.SETUP_SFC], framework),
		...options,
		version
	};
}
const name = "unplugin-vue-define-stylex";
const plugin = createUnplugin((userOptions = {}, { framework }) => {
	const options = resolveOptions(userOptions, framework);
	const filter = createFilter(options);
	return {
		name,
		enforce: "pre",
		transformInclude: filter,
		transform: transformDefineStyleX,
		resolveId(id) {
			if (normalizePath(id).startsWith(helperPrefix)) return id;
		},
		loadInclude: (id) => normalizePath(id).startsWith(helperPrefix),
		load(_id) {
			if (normalizePath(_id) === styleXAttrsId) return stylex_attrs_default;
		}
	};
});
var src_default = plugin;

//#endregion
export { src_default };