import { patchSFC } from "./common-BTTMZY21.js";
import { REGEX_NODE_MODULES, createFilter } from "@vue-macros/common";
import { parse } from "@vue/language-core";

//#region src/script-sfc.ts
const plugin = (_, options = {}) => {
	if (!options) return [];
	const isValidFile = createFilter({
		...options,
		include: options.include || /\.[cm]?tsx?$/,
		exclude: options.exclude || REGEX_NODE_MODULES
	});
	return {
		name: "vue-macros-script-sfc",
		version: 2.1,
		order: -1,
		isValidFile,
		parseSFC2(fileName, _$1, content) {
			if (!isValidFile(fileName)) return;
			const prefix = `<script lang="${fileName.split(/\.[cm]?/).at(-1)}">`;
			const sfc = parse(`${prefix}${content}\n<\/script>`);
			patchSFC(sfc.descriptor.script, prefix.length);
			return sfc;
		}
	};
};
var script_sfc_default = plugin;

//#endregion
export { plugin, script_sfc_default };