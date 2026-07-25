import { transformJsxDirective } from "./core-J_97uvJu.js";
import { FilterFileType, REGEX_NODE_MODULES, REGEX_SETUP_SFC, createFilter, detectVueVersion, getFilterPattern } from "@vue-macros/common";

//#region src/core/plugin.ts
function resolveOptions(options, framework) {
	const version = options.version || detectVueVersion();
	return {
		include: getFilterPattern([FilterFileType.VUE_SFC, FilterFileType.SRC_FILE], framework),
		exclude: [REGEX_NODE_MODULES, REGEX_SETUP_SFC],
		...options,
		prefix: options.prefix ?? "v-",
		lib: options.lib ?? "vue",
		version
	};
}
const name = "unplugin-vue-jsx-directive";
const plugin = (userOptions = {}, { framework = "vite" }) => {
	const options = resolveOptions(userOptions, framework);
	const filter = createFilter(options);
	return {
		name,
		enforce: "pre",
		transformInclude: filter,
		transform(code, id) {
			return transformJsxDirective(code, id, options);
		}
	};
};

//#endregion
export { plugin };