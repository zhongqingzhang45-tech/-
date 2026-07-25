import { transformShortVmodel } from "./api-DHMz_EtZ.js";
import { getVuePluginApi } from "@vue-macros/common";

//#region src/index.ts
const name = "unplugin-vue-short-vmodel";
function rollup(options = {}) {
	let api;
	return {
		name,
		configResolved(config) {
			try {
				api = getVuePluginApi(config.plugins);
			} catch {}
		},
		buildStart(rollupOpts) {
			if (api === void 0) try {
				api = getVuePluginApi(rollupOpts.plugins);
			} catch (error) {
				this.warn(error);
				return;
			}
			if (!api) return;
			api.options.template ||= {};
			api.options.template.compilerOptions ||= {};
			api.options.template.compilerOptions.nodeTransforms ||= [];
			api.options.template.compilerOptions.nodeTransforms.push(transformShortVmodel(options));
		}
	};
}
const plugin = {
	rollup,
	rolldown: rollup,
	vite: rollup
};
var src_default = plugin;

//#endregion
export { src_default };