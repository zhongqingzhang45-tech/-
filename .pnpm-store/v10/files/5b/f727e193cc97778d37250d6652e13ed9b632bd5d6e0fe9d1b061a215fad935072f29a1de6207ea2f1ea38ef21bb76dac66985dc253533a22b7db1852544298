import { applyState as S } from "@histoire/shared";
import { defineComponent as P, h as x, ref as N, onMounted as R, watch as V, onBeforeUnmount as _ } from "@histoire/vendors/vue";
import * as b from "virtual:$histoire-generated-global-setup";
import * as g from "virtual:$histoire-setup";
import { reactive as j, createApp as T, h as d, Suspense as k, onMounted as q } from "vue";
import { getTagName as F } from "../codegen.js";
import { registerGlobalComponents as O } from "./global-components.js";
import { RouterLinkStub as B } from "./RouterLinkStub.js";
import { syncStateBundledAndExternal as C } from "./util.js";
const W = P({
  name: "RenderStory",
  props: {
    variant: {
      type: Object,
      required: !0
    },
    story: {
      type: Object,
      required: !0
    },
    slotName: {
      type: String,
      default: "default"
    }
  },
  emits: {
    ready: () => !0
  },
  setup(t, { emit: w }) {
    const y = N();
    let o, c = !1;
    const f = j({});
    C(t.variant.state, f);
    function l() {
      o && (o.unmount(), o = null);
    }
    async function m() {
      if (c) return;
      c = !0, l();
      let i;
      const u = [];
      o = T({
        name: "RenderStorySubApp",
        setup() {
          q(() => {
            c = !1;
          });
        },
        render: () => {
          const a = t.variant.slots()?.[t.slotName]?.({
            state: f
          }) ?? t.story.slots()?.[t.slotName]?.({
            state: f
          });
          if (t.slotName === "default" && !t.variant.autoPropsDisabled) {
            const r = h(a), p = JSON.stringify(r);
            (!i || i !== p) && (S(t.variant.state, {
              _hPropDefs: r
            }), t.variant.state._hPropState || S(t.variant.state, {
              _hPropState: {}
            }), i = p);
          }
          const n = [];
          n.push(a);
          for (const [r, p] of u.entries())
            n.push(
              d(p, {
                story: t.story,
                variant: t.variant
              }, () => n[r])
            );
          return n.push(d("div", n.at(-1))), n.push(d(k, {}, n.at(-1))), n.at(-1);
        }
      }), O(o), o.component("RouterLink", B);
      const s = {
        app: o,
        story: t.story,
        variant: t.variant,
        addWrapper: (a) => {
          u.push(a);
        }
      };
      if (typeof b?.setupVue3 == "function") {
        const a = b.setupVue3;
        await a(s);
      }
      if (typeof g?.setupVue3 == "function") {
        const a = g.setupVue3;
        await a(s);
      }
      if (typeof t.variant.setupApp == "function") {
        const a = t.variant.setupApp;
        await a(s);
      }
      u.reverse();
      const e = document.createElement("div");
      y.value.appendChild(e), o.mount(e), w("ready");
    }
    function h(i) {
      const u = [];
      let s = 0;
      for (const e of i) {
        if (typeof e.type == "object") {
          const a = [];
          for (const n in e.type.props) {
            const r = e.type.props[n];
            let p, v;
            r && (p = (Array.isArray(r.type) ? r.type : typeof r == "function" ? [r] : [r.type]).map((A) => {
              switch (A) {
                case String:
                  return "string";
                case Number:
                  return "number";
                case Boolean:
                  return "boolean";
                case Object:
                  return "object";
                case Array:
                  return "array";
                default:
                  return "unknown";
              }
            }), v = typeof r.default == "function" ? r.default.toString() : r.default), a.push({
              name: n,
              types: p,
              required: r?.required,
              default: v
            }), f?._hPropState?.[s]?.[n] != null && (e.props || (e.props = {}), e.props[n] = f._hPropState[s][n], e.dynamicProps || (e.dynamicProps = []), e.dynamicProps.includes(n) || e.dynamicProps.push(n));
          }
          u.push({
            name: F(e),
            index: s,
            props: a
          }), s++;
        }
        Array.isArray(e.children) && u.push(...h(e.children));
      }
      return u.filter((e) => e.props.length);
    }
    return R(async () => {
      t.variant.configReady && await m();
    }), V(() => t.variant, async (i) => {
      i.configReady && !c && (o ? o._instance.proxy.$forceUpdate() : await m());
    }, {
      deep: !0
    }), _(() => {
      l();
    }), {
      sandbox: y
    };
  },
  render() {
    return x("div", {
      ref: "sandbox"
    });
  }
});
export {
  W as default
};
