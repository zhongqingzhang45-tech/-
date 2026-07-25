import { QuansyncFn } from "quansync/macro";
import { BaseOptions, FilterOptions } from "@vue-macros/common";
import { Options } from "@vue-macros/better-define";
import { Options as Options$1 } from "@vue-macros/boolean-prop";
import { Options as Options$2 } from "@vue-macros/chain-call";
import { Options as Options$3 } from "@vue-macros/define-emit";
import { Options as Options$4 } from "@vue-macros/define-models";
import { Options as Options$5 } from "@vue-macros/define-prop";
import { Options as Options$6 } from "@vue-macros/define-props";
import { Options as Options$7 } from "@vue-macros/define-props-refs";
import { Options as Options$8 } from "@vue-macros/define-render";
import { Options as Options$9 } from "@vue-macros/define-slots";
import { Options as Options$10 } from "@vue-macros/define-stylex";
import { Options as Options$11 } from "@vue-macros/export-expose";
import { Options as Options$12 } from "@vue-macros/export-props";
import { Options as Options$13 } from "@vue-macros/export-render";
import { Options as Options$14 } from "@vue-macros/hoist-static";
import { Options as Options$15 } from "@vue-macros/jsx-directive";
import { Options as Options$16 } from "@vue-macros/named-template";
import { Options as Options$17 } from "@vue-macros/reactivity-transform";
import { Options as Options$18 } from "@vue-macros/script-lang";
import { Options as Options$19 } from "@vue-macros/setup-block";
import { Options as Options$20 } from "@vue-macros/setup-component";
import { Options as Options$21 } from "@vue-macros/setup-sfc";
import { Options as Options$22 } from "@vue-macros/short-bind";
import { Options as Options$23 } from "@vue-macros/short-emits";
import { Options as Options$24 } from "@vue-macros/short-vmodel";
import { Options as Options$25 } from "unplugin-vue-define-options";

//#region src/options.d.ts
interface OptionsCommon extends Omit<BaseOptions, keyof FilterOptions> {
  root?: string;
  plugins?: {
    vue?: any;
    vueJsx?: any;
    vueRouter?: any;
  };
  /** @internal */
  nuxtContext?: {
    isClient?: boolean;
  };
}
interface FeatureOptionsMap {
  /**
  * @see {@link https://vue-macros.dev/features/better-define.html}
  * @default true
  */
  betterDefine: Options;
  /**
  * @see {@link https://vue-macros.dev/features/boolean-prop.html}
  * @default false
  */
  booleanProp: Options$1;
  /**
  * @see {@link https://vue-macros.dev/macros/chain-call.html}
  * @default true
  */
  chainCall: Options$2;
  /**
  * @see {@link https://vue-macros.dev/macros/define-emit.html}
  * @default true
  */
  defineEmit: Options$3;
  /**
  * @see {@link https://vue-macros.dev/volar/define-generic.html}
  * @default true
  */
  defineGeneric: FilterOptions;
  /**
  * @see {@link https://vue-macros.dev/macros/define-models.html}
  * @default true
  */
  defineModels: Options$4;
  /**
  * @see {@link https://vue-macros.dev/macros/define-options.html}
  * @default vueVersion < 3.3
  */
  defineOptions: Options$25;
  /**
  * @see {@link https://vue-macros.dev/macros/define-prop.html}
  * @default true
  */
  defineProp: Options$5;
  /**
  * @see {@link https://vue-macros.dev/macros/define-props.html}
  * @default true
  */
  defineProps: Options$6;
  /**
  * @see {@link https://vue-macros.dev/macros/define-props-refs.html}
  * @default true
  */
  definePropsRefs: Options$7;
  /**
  * @see {@link https://vue-macros.dev/macros/define-render.html}
  * @default true
  */
  defineRender: Options$8;
  /**
  * @see {@link https://vue-macros.dev/macros/define-slots.html}
  * @default vueVersion < 3.3
  */
  defineSlots: Options$9;
  /**
  * @see {@link https://vue-macros.dev/macros/define-stylex.html}
  * @default false
  */
  defineStyleX: Options$10;
  /**
  * @see {@link https://vue-macros.dev/features/export-expose.html}
  * @default false
  */
  exportExpose: Options$11;
  /**
  * @see {@link https://vue-macros.dev/features/export-props.html}
  * @default false
  */
  exportProps: Options$12;
  /**
  * @see {@link https://vue-macros.dev/features/export-render.html}
  * @default false
  */
  exportRender: Options$13;
  /**
  * @see {@link https://vue-macros.dev/features/hoist-static.html}
  * @default true
  */
  hoistStatic: Options$14;
  /**
  * @see {@link https://vue-macros.dev/features/jsx-directive.html}
  * @default true
  */
  jsxDirective: Options$15;
  /**
  * @see {@link https://vue-macros.dev/features/jsx-ref.html}
  * @default false
  */
  jsxRef: FilterOptions & {
    alias?: string[];
  };
  /**
  * @see {@link https://vue-macros.dev/features/named-template.html}
  * @default false
  * @deprecated Not actively maintained now. Try [createReusableTemplate](https://vueuse.org/core/createReusableTemplate/) instead.
  */
  namedTemplate: Options$16;
  /**
  * @see {@link https://vue-macros.dev/features/reactivity-transform.html}
  * @default true
  */
  reactivityTransform: Options$17;
  /**
  * @see {@link https://vue-macros.dev/features/script-lang.html}
  * @default false
  */
  scriptLang: Options$18;
  /**
  * @see {@link https://vue-macros.dev/volar/script-sfc.html}
  * @default false
  */
  scriptSFC: FilterOptions;
  /**
  * **experimental**: unpublished feature
  * @default false
  */
  setupBlock: Options$19;
  /**
  * @see {@link https://vue-macros.dev/macros/setup-component.html}
  * @default true
  */
  setupComponent: Options$20;
  /**
  * @see {@link https://vue-macros.dev/volar/setup-jsdoc.html}
  * @default true
  */
  setupJsdoc: FilterOptions;
  /**
  * @see {@link https://vue-macros.dev/macros/setup-sfc.html}
  * @default false
  */
  setupSFC: Options$21;
  /**
  * @see {@link https://vue-macros.dev/features/short-bind.html}
  * @default vueVersion < 3.4
  */
  shortBind: Options$22;
  /**
  * @see {@link https://vue-macros.dev/macros/short-emits.html}
  * @default vueVersion < 3.3
  */
  shortEmits: Options$23;
  /**
  * @see {@link https://vue-macros.dev/macros/short-vmodel.html}
  * @default true
  */
  shortVmodel: Options$24;
}
type FeatureName = keyof FeatureOptionsMap;
type FeatureOptions = FeatureOptionsMap[FeatureName];
type OptionalSubOptions<T> = boolean | Omit<T, keyof OptionsCommon> | undefined;
type Options$26 = OptionsCommon & { [K in keyof FeatureOptionsMap]?: OptionalSubOptions<FeatureOptionsMap[K]> };
type OptionsResolved = Required<OptionsCommon> & { [K in keyof FeatureOptionsMap]: false | FeatureOptionsMap[K] };
declare const resolveOptions: QuansyncFn<OptionsResolved, [options?: Options$26 | undefined, cwd?: string | undefined]>;
//#endregion
export { FeatureName, FeatureOptions, FeatureOptionsMap, Options$26 as Options, OptionsCommon, OptionsResolved, resolveOptions };