import { patchSFC } from "./common-BTTMZY21.js";
import { REGEX_NODE_MODULES, REGEX_SETUP_SFC, createFilter } from "@vue-macros/common";
import { parse } from "@vue/language-core";

//#region src/setup-sfc.ts
const plugin = (_, options = {}) => {
	if (!options) return [];
	const isValidFile = createFilter({
		...options,
		include: options.include || REGEX_SETUP_SFC,
		exclude: options.exclude || REGEX_NODE_MODULES
	});
	return {
		name: "vue-macros-setup-sfc",
		version: 2.1,
		order: -1,
		isValidFile,
		parseSFC2(fileName, _$1, content) {
			if (!isValidFile(fileName)) return;
			const prefix = `<script setup lang="${fileName.split(/\.[cm]?/).at(-1)}">`;
			const sfc = parse(`${prefix}${content}\n<\/script>`);
			patchSFC(sfc.descriptor.scriptSetup, prefix.length);
			return sfc;
		}
	};
};
var setup_sfc_default = plugin;

//#endregion
export { plugin, setup_sfc_default };