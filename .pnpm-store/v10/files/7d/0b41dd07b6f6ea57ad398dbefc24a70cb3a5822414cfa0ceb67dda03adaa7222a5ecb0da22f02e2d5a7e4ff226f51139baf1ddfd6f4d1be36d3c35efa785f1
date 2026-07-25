import { defineComponent as h, h as v, ref as S, watch as m, onMounted as w, onUnmounted as b } from "@histoire/vendors/vue";
import * as f from "virtual:$histoire-generated-global-setup";
import * as y from "virtual:$histoire-setup";
import { createApp as M, h as u, Suspense as V } from "vue";
import { registerGlobalComponents as g } from "./global-components.js";
import { RouterLinkStub as x } from "./RouterLinkStub.js";
const L = h({
  name: "MountStory",
  props: {
    story: {
      type: Object,
      required: !0
    }
  },
  setup(n) {
    const s = S();
    let t;
    async function a() {
      const r = [];
      t = M({
        name: "MountStorySubApp",
        render: () => {
          const e = u(n.story.file.component, {
            story: n.story
          }), o = [];
          o.push(e);
          for (const [d, l] of r.entries())
            o.push(
              u(l, {
                story: n.story,
                variant: null
              }, () => o[d])
            );
          return u(V, void 0, o.at(-1));
        }
      }), g(t), t.component("RouterLink", x), m(() => n.story.variants, () => {
        t._instance.proxy.$forceUpdate();
      });
      const i = {
        app: t,
        story: n.story,
        variant: null,
        addWrapper: (e) => {
          r.push(e);
        }
      };
      if (typeof f?.setupVue3 == "function") {
        const e = f.setupVue3;
        await e(i);
      }
      if (typeof y?.setupVue3 == "function") {
        const e = y.setupVue3;
        await e(i);
      }
      r.reverse();
      const c = document.createElement("div");
      s.value.appendChild(c), t.mount(c);
    }
    function p() {
      t?.unmount();
    }
    return m(() => n.story.id, async () => {
      p(), await a();
    }), w(async () => {
      await a();
    }), b(() => {
      p();
    }), {
      el: s
    };
  },
  render() {
    return v("div", {
      ref: "el"
    });
  }
});
export {
  L as default
};
