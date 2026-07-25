import { applyState as o } from "@histoire/shared";
import { defineComponent as r, useAttrs as u, getCurrentInstance as p, inject as l } from "vue";
import { toRawDeep as d, syncStateBundledAndExternal as c } from "./util.js";
const v = r({
  name: "Variant",
  __histoireType: "variant",
  props: {
    initState: {
      type: Function,
      default: void 0
    },
    source: {
      type: String,
      default: void 0
    },
    responsiveDisabled: {
      type: Boolean,
      default: !1
    },
    autoPropsDisabled: {
      type: Boolean,
      default: !1
    },
    setupApp: {
      type: Function,
      default: void 0
    },
    meta: {
      type: Object,
      default: void 0
    }
  },
  async setup(t) {
    const e = u(), i = p(), n = l("implicitState");
    if (typeof t.initState == "function") {
      const s = await t.initState();
      o(e.variant.state, d(s));
    }
    c(e.variant.state, n());
    function a() {
      Object.assign(e.variant, {
        slots: () => i.proxy.$slots,
        source: t.source,
        responsiveDisabled: t.responsiveDisabled,
        autoPropsDisabled: t.autoPropsDisabled,
        setupApp: t.setupApp,
        meta: t.meta,
        configReady: !0
      });
    }
    return a(), {
      updateVariant: a
    };
  },
  render() {
    return this.updateVariant(), null;
  }
});
export {
  v as default
};
