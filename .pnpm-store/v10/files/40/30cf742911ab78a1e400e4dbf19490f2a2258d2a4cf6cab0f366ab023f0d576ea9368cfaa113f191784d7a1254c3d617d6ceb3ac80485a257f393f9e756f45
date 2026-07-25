import { components as v } from "@histoire/controls";
import { reactive as y, createApp as E, h as C } from "@histoire/vendors/vue";
import { defineComponent as g, h as u, ref as d, onBeforeUpdate as $, onMounted as w, onUpdated as U, onBeforeUnmount as b } from "vue";
import k from "./Story.js";
import q from "./Variant.js";
function M(e) {
  e.component("Story", k), e.component("Variant", q);
  for (const o in v)
    e.component(o, A(v[o]));
}
function A(e) {
  return g({
    name: e.name,
    inheritAttrs: !1,
    setup(o, { attrs: n }) {
      const a = d(), p = d(), m = y({});
      function c(l) {
        Object.assign(m, l);
      }
      c(n), $(() => {
        c(n);
      });
      let t = [];
      const r = d([]);
      function S() {
        r.value.forEach((l, f) => {
          const h = p.value.querySelector(`[renderslotid="${f}"]`);
          if (!h) return;
          const s = a.value.querySelector(`[slotid="${f}"]`);
          for (; s.firstChild; )
            s.removeChild(s.lastChild);
          s.appendChild(h);
        });
      }
      let i;
      return w(() => {
        i = E({
          mounted() {
            r.value = t, t = [];
          },
          updated() {
            r.value = t, t = [];
          },
          render() {
            return C(e, {
              ...m,
              key: "component"
            }, {
              default: (l) => (t.push(l), C("div", {
                slotId: t.length - 1
              }))
            });
          }
        }), i.mount(a.value);
      }), U(() => {
        S();
      }), b(() => {
        i.unmount();
      }), {
        el: a,
        slotEl: p,
        slotCalls: r
      };
    },
    render() {
      return [
        u("div", {
          ref: "el"
        }),
        u("div", {
          ref: "slotEl"
        }, this.slotCalls.map((o, n) => u("div", {
          renderSlotId: n
        }, this.$slots.default(o))))
      ];
    }
  });
}
export {
  M as registerGlobalComponents
};
