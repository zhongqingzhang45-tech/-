import { transformShortBind } from "@vue-macros/short-bind/api";

//#region src/short-bind.ts
const plugin = (ctx, options = {}) => {
	if (!options) return [];
	return {
		name: "vue-macros-short-bind",
		version: 2.1,
		resolveTemplateCompilerOptions(options$1) {
			options$1.nodeTransforms ||= [];
			options$1.nodeTransforms.push(transformShortBind({ version: ctx.vueCompilerOptions.target }));
			return options$1;
		}
	};
};
var short_bind_default = plugin;

//#endregion
export { plugin, short_bind_default };