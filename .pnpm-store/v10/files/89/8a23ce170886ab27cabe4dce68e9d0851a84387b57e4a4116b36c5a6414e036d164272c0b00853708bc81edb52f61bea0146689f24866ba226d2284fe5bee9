import { createCombinePlugin } from "unplugin-combine";
import VueBetterDefine from "@vue-macros/better-define";
import VueBooleanProp from "@vue-macros/boolean-prop";
import VueChainCall from "@vue-macros/chain-call";
import { defineConfig, resolveOptions, resolveOptions as resolveOptions$1 } from "@vue-macros/config";
import VueDefineEmit from "@vue-macros/define-emit";
import VueDefineModels from "@vue-macros/define-models";
import VueDefineProp from "@vue-macros/define-prop";
import VueDefineProps from "@vue-macros/define-props";
import VueDefinePropsRefs from "@vue-macros/define-props-refs";
import VueDefineRender from "@vue-macros/define-render";
import VueDefineSlots from "@vue-macros/define-slots";
import VueDefineStyleX from "@vue-macros/define-stylex";
import { Devtools } from "@vue-macros/devtools";
import VueExportExpose from "@vue-macros/export-expose";
import VueExportProps from "@vue-macros/export-props";
import VueExportRender from "@vue-macros/export-render";
import VueHoistStatic from "@vue-macros/hoist-static";
import VueJsxDirective from "@vue-macros/jsx-directive";
import VueNamedTemplate from "@vue-macros/named-template";
import VueReactivityTransform from "@vue-macros/reactivity-transform";
import VueScriptLang from "@vue-macros/script-lang";
import VueSetupBlock from "@vue-macros/setup-block";
import VueSetupComponent from "@vue-macros/setup-component";
import VueSetupSFC from "@vue-macros/setup-sfc";
import VueShortBind from "@vue-macros/short-bind";
import VueShortEmits from "@vue-macros/short-emits";
import VueShortVmodel from "@vue-macros/short-vmodel";
import VueDefineOptions from "unplugin-vue-define-options";

//#region src/core/exclude-macros.ts
function excludeDepOptimize() {
	return {
		name: "vue-macros-exclude-dep-optimize",
		config() {
			return { optimizeDeps: { exclude: ["vue-macros/macros"] } };
		}
	};
}

//#endregion
//#region src/core/plugin.ts
function resolvePlugin(unplugin, framework, options) {
	if (!options) return;
	return unplugin[framework](options);
}

//#endregion
//#region src/index.ts
const name = "unplugin-vue-macros";
const plugin = createCombinePlugin((userOptions = {}, meta) => {
	return {
		name,
		plugins: (async () => {
			const options = await resolveOptions(userOptions);
			const framework = meta.framework;
			const setupComponentPlugins = resolvePlugin(VueSetupComponent, framework, options.setupComponent);
			const namedTemplatePlugins = resolvePlugin(VueNamedTemplate, framework, options.namedTemplate);
			return [
				resolvePlugin(VueSetupSFC, framework, options.setupSFC),
				setupComponentPlugins?.[0],
				resolvePlugin(VueSetupBlock, framework, options.setupBlock),
				resolvePlugin(VueScriptLang, framework, options.scriptLang),
				options.plugins.vueRouter,
				namedTemplatePlugins?.[0],
				resolvePlugin(VueChainCall, framework, options.chainCall),
				resolvePlugin(VueDefineProps, framework, options.defineProps),
				resolvePlugin(VueDefinePropsRefs, framework, options.definePropsRefs),
				resolvePlugin(VueExportProps, framework, options.exportProps),
				resolvePlugin(VueDefineEmit, framework, options.defineEmit),
				resolvePlugin(VueShortEmits, framework, options.shortEmits),
				resolvePlugin(VueDefineModels, framework, options.defineModels),
				resolvePlugin(VueBetterDefine, framework, options.betterDefine),
				resolvePlugin(VueDefineProp, framework, options.defineProp),
				resolvePlugin(VueDefineSlots, framework, options.defineSlots),
				resolvePlugin(VueDefineStyleX, framework, options.defineStyleX),
				resolvePlugin(VueExportRender, framework, options.exportRender),
				resolvePlugin(VueExportExpose, framework, options.exportExpose),
				resolvePlugin(VueJsxDirective, framework, options.jsxDirective),
				resolvePlugin(VueReactivityTransform, framework, options.reactivityTransform),
				resolvePlugin(VueHoistStatic, framework, options.hoistStatic),
				resolvePlugin(VueDefineOptions, framework, options.defineOptions),
				...framework === "vite" || framework === "rollup" || framework === "rolldown" ? [
					resolvePlugin(VueBooleanProp, framework, options.booleanProp),
					resolvePlugin(VueShortBind, framework, options.shortBind),
					resolvePlugin(VueShortVmodel, framework, options.shortVmodel)
				] : [],
				options.plugins.vue,
				options.plugins.vueJsx,
				resolvePlugin(VueDefineRender, framework, options.defineRender),
				setupComponentPlugins?.[1],
				namedTemplatePlugins?.[1],
				framework === "vite" ? Devtools({ nuxtContext: options.nuxtContext }) : void 0,
				framework === "vite" ? excludeDepOptimize() : void 0
			].filter(Boolean);
		})()
	};
});
var src_default = plugin;

//#endregion
export { defineConfig, resolveOptions$1 as resolveOptions, src_default };