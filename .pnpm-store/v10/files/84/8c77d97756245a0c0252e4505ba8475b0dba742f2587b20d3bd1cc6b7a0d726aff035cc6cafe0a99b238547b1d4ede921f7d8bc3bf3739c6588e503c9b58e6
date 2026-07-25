import { emitHelperId, emit_helper_default, helperPrefix, transformDefineModels, useVmodelHelperId, use_vmodel_default } from "./core-qLU8oTgC.js";
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
const name = "unplugin-vue-define-models";
const plugin = createUnplugin((userOptions = {}, { framework }) => {
	const options = resolveOptions(userOptions, framework);
	const filter = createFilter(options);
	return {
		name,
		enforce: "pre",
		resolveId(id) {
			if (normalizePath(id).startsWith(helperPrefix)) return id;
		},
		loadInclude(id) {
			return normalizePath(id).startsWith(helperPrefix);
		},
		load(_id) {
			const id = normalizePath(_id);
			if (id === emitHelperId) return emit_helper_default;
			else if (id === useVmodelHelperId) return use_vmodel_default;
		},
		transformInclude: filter,
		transform(code, id) {
			return transformDefineModels(code, id);
		}
	};
});
var src_default = plugin;

//#endregion
export { src_default };