import { boolean_prop_default } from "./boolean-prop-CyQ-7hY4.js";
import { getVolarOptions } from "./common-BTTMZY21.js";
import { define_emit_default } from "./define-emit-CP-u7O2r.js";
import { define_generic_default } from "./define-generic-Bo4YO72y.js";
import { define_models_default } from "./define-models--1g0VLWr.js";
import { define_options_default } from "./define-options-CZk8ITKZ.js";
import { define_prop_default } from "./define-prop-CCP3X1ca.js";
import { define_props_refs_default } from "./define-props-refs-BG7FW-5H.js";
import { define_props_default } from "./define-props-jthci368.js";
import { define_slots_default } from "./define-slots-BlrerPFo.js";
import { export_expose_default } from "./export-expose-JpKVM8W3.js";
import { export_props_default } from "./export-props-CVe0UtaD.js";
import { export_render_default } from "./export-render-DG-Wn7vS.js";
import { jsx_directive_default } from "./jsx-directive-Cfx4Hdxx.js";
import { jsx_ref_default } from "./jsx-ref-DZlb-F7c.js";
import { script_lang_default } from "./script-lang-Djq73TBK.js";
import { script_sfc_default } from "./script-sfc-BzDjBVR7.js";
import { setup_jsdoc_default } from "./setup-jsdoc-BWwXmtbs.js";
import { setup_sfc_default } from "./setup-sfc-B5Qw33_9.js";
import { short_bind_default } from "./short-bind-Cl6Z8BOg.js";
import { short_vmodel_default } from "./short-vmodel-CXhdLiMg.js";

//#region src/index.ts
const plugins = {
	defineOptions: define_options_default,
	defineModels: define_models_default,
	defineProps: define_props_default,
	definePropsRefs: define_props_refs_default,
	shortBind: short_bind_default,
	shortVmodel: short_vmodel_default,
	defineSlots: define_slots_default,
	jsxDirective: jsx_directive_default,
	booleanProp: boolean_prop_default,
	exportRender: export_render_default,
	exportProps: export_props_default,
	exportExpose: export_expose_default,
	defineProp: define_prop_default,
	defineEmit: define_emit_default,
	defineGeneric: define_generic_default,
	setupJsdoc: setup_jsdoc_default,
	setupSFC: setup_sfc_default,
	scriptSFC: script_sfc_default,
	scriptLang: script_lang_default,
	jsxRef: jsx_ref_default
};
const plugin = (ctx) => Object.entries(plugins).flatMap(([name, plugin$1]) => {
	const options = getVolarOptions(ctx, name);
	if (!options) return [];
	(ctx.vueCompilerOptions.vueMacros ??= {})[name] ??= options;
	return plugin$1(ctx, options);
});
var src_default = plugin;

//#endregion
export { src_default as default, plugin as "module.exports" };