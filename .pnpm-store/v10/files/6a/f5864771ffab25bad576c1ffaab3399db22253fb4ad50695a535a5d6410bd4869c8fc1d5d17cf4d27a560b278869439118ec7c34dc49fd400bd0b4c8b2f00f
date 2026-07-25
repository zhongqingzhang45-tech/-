import { defineComponent, computed, createElementBlock, openBlock } from "@histoire/vendors/vue";
import HistoireLogoDark from "../../assets/histoire-text-dark.svg.js";
import HistoireLogoLight from "../../assets/histoire-text.svg.js";
import { customLogos, histoireConfig } from "../../util/config.js";
import { isDark } from "../../util/dark.js";
"use strict";
const _hoisted_1 = ["src", "alt"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "AppLogo",
  setup(__props) {
    const logoUrl = computed(() => {
      if (isDark.value) {
        return histoireConfig.theme.logo?.dark ? customLogos.dark : HistoireLogoDark;
      }
      return histoireConfig.theme.logo?.light ? customLogos.light : HistoireLogoLight;
    });
    const altText = computed(() => `${histoireConfig.theme.title} logo`);
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("img", {
        class: "histoire-app-logo",
        src: logoUrl.value,
        alt: altText.value
      }, null, 8, _hoisted_1);
    };
  }
});
export {
  _sfc_main as default
};
