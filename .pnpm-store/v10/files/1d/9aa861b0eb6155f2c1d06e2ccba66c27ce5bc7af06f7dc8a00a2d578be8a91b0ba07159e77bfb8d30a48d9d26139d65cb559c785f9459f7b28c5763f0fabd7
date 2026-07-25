//#region src/define-props.ts
const plugin = (ctx, options = {}) => {
	if (!options) return [];
	ctx.vueCompilerOptions.macros.defineProps.push("$defineProps");
	return {
		name: "vue-macros-define-props",
		version: 2.1
	};
};
var define_props_default = plugin;

//#endregion
export { define_props_default, plugin };