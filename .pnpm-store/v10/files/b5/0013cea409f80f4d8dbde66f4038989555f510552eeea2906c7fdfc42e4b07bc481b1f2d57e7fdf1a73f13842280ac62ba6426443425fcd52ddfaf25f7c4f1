import { defineComponent as r, computed as e, h as a } from "vue";
const s = {
  path: "/",
  name: void 0,
  redirectedFrom: void 0,
  params: {},
  query: {},
  hash: "",
  fullPath: "/",
  matched: [],
  meta: {},
  href: "/"
}, n = r({
  name: "RouterLinkStub",
  compatConfig: { MODE: 3 },
  props: {
    to: {
      type: [String, Object],
      required: !0
    },
    custom: {
      type: Boolean,
      default: !1
    }
  },
  render() {
    const t = e(() => s), o = this.$slots?.default?.({
      route: t,
      href: e(() => t.value.href),
      isActive: e(() => !1),
      isExactActive: e(() => !1),
      navigate: async () => {
      }
    });
    return this.custom ? o : a("a", void 0, o);
  }
});
export {
  n as RouterLinkStub
};
