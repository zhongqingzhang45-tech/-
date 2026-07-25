const E = new RegExp("([\\p{Ll}\\d])(\\p{Lu})", "gu"), P = new RegExp("(\\p{Lu})([\\p{Lu}][\\p{Ll}])", "gu"), w = new RegExp("(\\d)\\p{Ll}|(\\p{L})\\d", "u"), R = /[^\p{L}\d]+/giu, C = "$1\0$2", x = "";
function h(r) {
  let e = r.trim();
  e = e.replace(E, C).replace(P, C), e = e.replace(R, "\0");
  let t = 0, c = e.length;
  for (; e.charAt(t) === "\0"; )
    t++;
  if (t === c)
    return [];
  for (; e.charAt(c - 1) === "\0"; )
    c--;
  return e.slice(t, c).split(/\0/g);
}
function A(r) {
  const e = h(r);
  for (let t = 0; t < e.length; t++) {
    const c = e[t], n = w.exec(c);
    if (n) {
      const a = n.index + (n[1] ?? n[2]).length;
      e.splice(t, 1, c.slice(0, a), c.slice(a));
    }
  }
  return e;
}
function p(r, e) {
  const [t, c, n] = u(r, e);
  return t + c.map(f(e?.locale)).join(e?.delimiter ?? " ") + n;
}
function g(r, e) {
  const [t, c, n] = u(r, e), a = f(e?.locale), s = o(e?.locale), i = e?.mergeAmbiguousCharacters ? d(a, s) : _(a, s);
  return t + c.map((l, m) => m === 0 ? a(l) : i(l, m)).join(e?.delimiter ?? "") + n;
}
function S(r, e) {
  const [t, c, n] = u(r, e), a = f(e?.locale), s = o(e?.locale), i = e?.mergeAmbiguousCharacters ? d(a, s) : _(a, s);
  return t + c.map(i).join(e?.delimiter ?? "") + n;
}
function T(r, e) {
  return L(r, { delimiter: "_", ...e });
}
function L(r, e) {
  const [t, c, n] = u(r, e), a = f(e?.locale), s = o(e?.locale);
  return t + c.map(d(a, s)).join(e?.delimiter ?? " ") + n;
}
function F(r, e) {
  const [t, c, n] = u(r, e);
  return t + c.map(o(e?.locale)).join(e?.delimiter ?? "_") + n;
}
function U(r, e) {
  return p(r, { delimiter: ".", ...e });
}
function I(r, e) {
  return p(r, { delimiter: "-", ...e });
}
function b(r, e) {
  return p(r, { delimiter: "/", ...e });
}
function j(r, e) {
  const [t, c, n] = u(r, e), a = f(e?.locale), s = o(e?.locale), i = d(a, s);
  return t + c.map((l, m) => m === 0 ? i(l) : a(l)).join(e?.delimiter ?? " ") + n;
}
function k(r, e) {
  return p(r, { delimiter: "_", ...e });
}
function y(r, e) {
  return L(r, { delimiter: "-", ...e });
}
function f(r) {
  return r === !1 ? (e) => e.toLowerCase() : (e) => e.toLocaleLowerCase(r);
}
function o(r) {
  return r === !1 ? (e) => e.toUpperCase() : (e) => e.toLocaleUpperCase(r);
}
function d(r, e) {
  return (t) => `${e(t[0])}${r(t.slice(1))}`;
}
function _(r, e) {
  return (t, c) => {
    const n = t[0];
    return (c > 0 && n >= "0" && n <= "9" ? "_" + n : e(n)) + r(t.slice(1));
  };
}
function u(r, e = {}) {
  const t = e.split ?? (e.separateNumbers ? A : h), c = e.prefixCharacters ?? x, n = e.suffixCharacters ?? x;
  let a = 0, s = r.length;
  for (; a < r.length; ) {
    const i = r.charAt(a);
    if (!c.includes(i))
      break;
    a++;
  }
  for (; s > a; ) {
    const i = s - 1, l = r.charAt(i);
    if (!n.includes(l))
      break;
    s = i;
  }
  return [
    r.slice(0, a),
    t(r.slice(a, s)),
    r.slice(s)
  ];
}
export {
  g as camelCase,
  L as capitalCase,
  F as constantCase,
  U as dotCase,
  I as kebabCase,
  p as noCase,
  S as pascalCase,
  T as pascalSnakeCase,
  b as pathCase,
  j as sentenceCase,
  k as snakeCase,
  h as split,
  A as splitSeparateNumbers,
  y as trainCase
};
