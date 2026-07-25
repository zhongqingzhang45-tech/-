import { omitInheritStoryProps as d } from "@histoire/shared";
import { defineComponent as u, h as y, cloneVNode as h, getCurrentInstance as l, useAttrs as m, computed as S, provide as c, reactive as v } from "vue";
import _ from "./Variant.js";
const A = u({
  name: "Story",
  __histoireType: "story",
  inheritAttrs: !1,
  props: {
    initState: {
      type: Function,
      default: void 0
    },
    meta: {
      type: Object,
      default: void 0
    }
  },
  setup(f) {
    const r = l(), a = m(), s = S(() => a.story);
    c("story", s);
    const o = r.parent, n = {
      $data: o.data
    };
    function e(t, p) {
      typeof p == "function" || p?.__file || typeof p?.render == "function" || typeof p?.setup == "function" || (n[t] = p);
    }
    for (const t in o.exposed)
      e(t, o.exposed[t]);
    for (const t in o.devtoolsRawSetupState)
      e(t, o.devtoolsRawSetupState[t]);
    c("implicitState", () => v({ ...n }));
    function i() {
      Object.assign(a.story, {
        meta: f.meta,
        slots: () => r.proxy.$slots
      });
    }
    return {
      story: s,
      updateStory: i
    };
  },
  render() {
    this.updateStory();
    const [f] = this.story.variants;
    if (f.id === "_default")
      return y(_, {
        variant: f,
        initState: this.initState,
        ...this.$attrs
      }, this.$slots);
    let r = 0;
    const a = (o) => {
      const n = [];
      for (const e of o)
        if (e.type?.__histoireType === "variant") {
          const i = {};
          if (i.variant = this.story.variants[r], !i.variant)
            continue;
          !e.props?.initState && !e.props?.["init-state"] && (i.initState = this.initState);
          for (const t in this.$attrs)
            typeof e.props?.[t] > "u" && (i[t] = this.$attrs[t]);
          for (const t in this.story)
            !d.includes(t) && typeof e.props?.[t] > "u" && (i[t] = this.story[t]);
          r++, n.push(h(e, i));
        } else
          e.children?.length && (e.children = a(e.children)), n.push(e);
      return n;
    };
    let s = this.$slots.default();
    return s = a(s), s;
  }
});
export {
  A as default
};
