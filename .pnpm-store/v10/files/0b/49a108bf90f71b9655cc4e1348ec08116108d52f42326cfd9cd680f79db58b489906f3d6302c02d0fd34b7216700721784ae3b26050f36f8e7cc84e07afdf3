import { defineComponent as i, useAttrs as n, inject as d, provide as r, onMounted as l } from "vue";
import { autoStubComponents as u } from "./stub.js";
const c = i({
  name: "HistoireStory",
  inheritAttrs: !1,
  props: {
    title: {
      type: String,
      default: void 0
    },
    id: {
      type: String,
      default: void 0
    },
    group: {
      type: String,
      default: void 0
    },
    layout: {
      type: Object,
      default: void 0
    },
    icon: {
      type: String,
      default: void 0
    },
    iconColor: {
      type: String,
      default: void 0
    },
    docsOnly: {
      type: Boolean,
      default: !1
    },
    meta: {
      type: Object,
      default: void 0
    }
  },
  setup(t) {
    const e = n(), o = {
      id: t.id ?? e.data.id,
      title: t.title ?? e.data.fileName,
      group: t.group,
      layout: t.layout,
      icon: t.icon,
      iconColor: t.iconColor,
      docsOnly: t.docsOnly,
      meta: t.meta,
      variants: []
    };
    return d("addStory", null)?.(o), r("story", o), r("addVariant", (a) => {
      o.variants.push(a);
    }), l(() => {
      o.variants.length || o.variants.push({
        id: "_default",
        title: "default"
      });
    }), {
      story: o
    };
  },
  render() {
    let t = !1;
    try {
      const e = this.$slots.default?.({
        get state() {
          return t = !0, {};
        }
      });
      return Array.isArray(e) && u(e), e;
    } catch (e) {
      return t || console.error(e), null;
    }
  }
});
export {
  c as default
};
