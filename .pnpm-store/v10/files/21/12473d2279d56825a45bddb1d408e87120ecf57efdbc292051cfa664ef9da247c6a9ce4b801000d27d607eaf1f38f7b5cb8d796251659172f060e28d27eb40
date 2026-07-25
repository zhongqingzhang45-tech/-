import { applyState as f } from "@histoire/shared";
import { isRef as c, unref as p, watch as l } from "@histoire/vendors/vue";
import { isRef as m, unref as w, watch as y } from "vue";
const i = (n) => n !== null && typeof n == "object";
function o(n, e = /* @__PURE__ */ new WeakMap()) {
  const t = m(n) ? w(n) : n;
  if (typeof t == "symbol")
    return t.toString();
  if (!i(t))
    return t;
  if (e.has(t))
    return e.get(t);
  if (Array.isArray(t)) {
    const r = [];
    return e.set(t, r), r.push(...t.map((u) => o(u, e))), r;
  } else {
    const r = {};
    return e.set(t, r), h(t, r, e), r;
  }
}
function h(n, e, t = /* @__PURE__ */ new WeakMap()) {
  Object.keys(n).forEach((r) => {
    e[r] = o(n[r], t);
  });
}
function a(n, e = /* @__PURE__ */ new WeakMap()) {
  const t = c(n) ? p(n) : n;
  if (typeof t == "symbol")
    return t.toString();
  if (!i(t))
    return t;
  if (e.has(t))
    return e.get(t);
  if (Array.isArray(t)) {
    const r = [];
    return e.set(t, r), r.push(...t.map((u) => a(u, e))), r;
  } else {
    const r = {};
    return e.set(t, r), d(t, r, e), r;
  }
}
function d(n, e, t = /* @__PURE__ */ new WeakMap()) {
  Object.keys(n).forEach((r) => {
    e[r] = o(n[r], t);
  });
}
function A(n, e) {
  let t = !1;
  const r = l(() => n, (s) => {
    s != null && (t ? t = !1 : (t = !0, f(e, a(s))));
  }, {
    deep: !0,
    immediate: !0
  }), u = y(() => e, (s) => {
    s != null && (t ? t = !1 : (t = !0, f(n, o(s))));
  }, {
    deep: !0,
    immediate: !0
  });
  return {
    stop() {
      r(), u();
    }
  };
}
export {
  a as _toRawDeep,
  A as syncStateBundledAndExternal,
  o as toRawDeep
};
