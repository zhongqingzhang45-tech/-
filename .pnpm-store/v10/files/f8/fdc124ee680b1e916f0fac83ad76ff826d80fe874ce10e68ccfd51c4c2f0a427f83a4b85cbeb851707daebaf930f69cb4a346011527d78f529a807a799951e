import * as u from "virtual:$histoire-generated-global-setup";
import * as a from "virtual:$histoire-setup";
import { createApp as m, h as d } from "vue";
import f from "./Story.js";
import l from "./Variant.js";
async function S({ file: n, storyData: r, el: c }) {
  const { default: e } = await import(/* @vite-ignore */
    /* @vite-ignore */
    n.moduleId
  ), o = m({
    provide: {
      addStory(t) {
        r.push(t);
      }
    },
    render() {
      return d(e, {
        ref: "comp",
        data: n
      });
    }
  });
  o.component("Story", f), o.component("Variant", l);
  const p = {
    app: o,
    story: null,
    variant: null,
    addWrapper: () => {
    }
  };
  if (typeof u?.setupVue3 == "function") {
    const t = u.setupVue3;
    await t(p);
  }
  if (typeof a?.setupVue3 == "function") {
    const t = a.setupVue3;
    await t(p);
  }
  if (o.mount(c), e.doc) {
    const t = document.createElement("div");
    t.innerHTML = e.doc;
    const i = t.textContent;
    r.forEach((s) => {
      s.docsText = i;
    });
  }
  o.unmount();
}
export {
  S as run
};
