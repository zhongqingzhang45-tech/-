import { transformBooleanProp } from "@vue-macros/boolean-prop/api";

//#region src/boolean-prop.ts
const plugin = (_, options = {}) => {
	if (!options) return [];
	return {
		name: "vue-macros-boolean-prop",
		version: 2.1,
		resolveTemplateCompilerOptions(options$1) {
			options$1.nodeTransforms ||= [];
			options$1.nodeTransforms.push(transformBooleanProp({ constType: 0 }));
			return options$1;
		}
	};
};
var boolean_prop_default = plugin;

//#endregion
export { boolean_prop_default, plugin };