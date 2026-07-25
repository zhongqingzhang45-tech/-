import { transformExportProps } from "./core-CXj7aSpt.js";
import { FilterFileType, createFilter, detectVueVersion, getFilterPattern, hackViteHMR } from "@vue-macros/common";
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
const name = "unplugin-vue-export-props";
const plugin = createUnplugin((userOptions = {}, { framework }) => {
	const options = resolveOptions(userOptions, framework);
	const filter = createFilter(options);
	return {
		name,
		enforce: "pre",
		transformInclude: filter,
		transform: transformExportProps,
		vite: { handleHotUpdate(ctx) {
			hackViteHMR(ctx, filter, transformExportProps);
		} }
	};
});
var src_default = plugin;

//#endregion
export { src_default };