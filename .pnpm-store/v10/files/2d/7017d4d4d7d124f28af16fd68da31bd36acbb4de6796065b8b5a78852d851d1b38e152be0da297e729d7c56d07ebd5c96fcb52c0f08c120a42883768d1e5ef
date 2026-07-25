//#region src/define-props-refs.ts
const plugin = (ctx, options = {}) => {
	if (!options) return [];
	ctx.vueCompilerOptions.macros.defineProps.push("definePropsRefs");
	return {
		name: "vue-macros-define-props-refs",
		version: 2.1
	};
};
var define_props_refs_default = plugin;

//#endregion
export { define_props_refs_default, plugin };