import { createAutoBuildingObject as K, indent as _, voidElements as N, serializeJs as P } from "@histoire/shared";
import { camelCase as M, pascalCase as U } from "../node_modules/.pnpm/change-case@5.4.4/node_modules/change-case/dist/index.js";
import { Text as W, vModelText as z, vModelSelect as D, vModelRadio as F, vModelCheckbox as E, vModelDynamic as J } from "vue";
async function I(t) {
  const o = t.slots().default?.({ state: t.state ?? {} }) ?? [], a = Array.isArray(o) ? o : [o], b = [];
  for (const L in a) {
    const g = a[L];
    b.push(...(await x(g, t.state?._hPropState?.[L])).lines);
  }
  return b.join(`
`);
}
async function x(t, o = null) {
  if (t.type === W)
    return {
      // @ts-expect-error TODO
      lines: [t.children],
      isText: !0
    };
  const a = [];
  if (typeof t.type == "object" || typeof t.type == "string") {
    let g = function(e, s, i = null) {
      let n = "";
      for (const y in s.modifiers)
        s.modifiers[y] && (n += `.${y}`);
      let u = "";
      s.arg && (u = `:${s.arg}`), i && (i = i.replace(/^\$(setup|props|data)\./g, ""));
      const r = i ? [i] : V(s.value), l = [], f = `v-${e}${u}${n}="`;
      r.length > 1 ? (l.push(`${f}${r[0]}`), l.push(...r.slice(1, r.length - 1)), l.push(`${r[r.length - 1]}"`), $ = !0) : l.push(`${f}${r[0] ?? ""}"`), p.push(l);
    }, S = function(e, s) {
      if (typeof s != "string" || t.dynamicProps?.includes(e)) {
        let i = ":";
        e.startsWith("on") && (i = "@");
        const n = i === "@" ? `${e[2].toLowerCase()}${e.slice(3)}` : e, r = [`onUpdate:${e}`, `onUpdate:${M(e)}`].find((f) => t.dynamicProps?.includes(f) || t.props && f in t.props);
        if (i === ":" && r) {
          m.push(r);
          const y = t.props[r].toString();
          let C;
          const w = /\(\$event\) => (.*?) = \$event/.exec(y);
          w && (C = w[1]);
          const T = `${e === "modelValue" ? "model" : e}Modifiers`, B = t.props[T] ?? {};
          m.push(T), g("model", {
            arg: e === "modelValue" ? null : e,
            modifiers: B,
            value: s
          }, C);
          return;
        }
        if (typeof s > "u")
          return;
        let l;
        if (typeof s == "string" && s.startsWith("{{") && s.endsWith("}}"))
          l = A(s.substring(2, s.length - 2).trim()).split(`
`);
        else if (typeof s == "function") {
          let f = A(s.toString().replace(/'/g, "\\'").replace(/"/g, "'"));
          const y = /function (\S+)\(/.exec(f);
          y ? l = [y[1]] : (f.startsWith("($event) => ") && (f = f.substring(12)), l = f.split(`
`));
        } else
          l = V(s);
        if (l.length > 1) {
          $ = !0;
          const f = [`${i}${n}="${l[0]}`];
          f.push(...l.slice(1, l.length - 1)), f.push(`${l[l.length - 1]}"`), p.push(f);
        } else
          p.push([`${i}${n}="${l[0]}"`]);
      } else t.type?.props?.[e]?.type === Boolean ? p.push([e]) : p.push([`${e}="${s}"`]);
    };
    var b = g, L = S;
    t.type?.__asyncLoader && !t.type.__asyncResolved && await t.type.__asyncLoader();
    const p = [];
    let $ = !1;
    const m = [
      "key"
    ];
    if (t.dirs) {
      for (const e of t.dirs)
        if (e.dir === z || e.dir === D || e.dir === F || e.dir === E || e.dir === J) {
          const i = [`onUpdate:${e.arg ?? "modelValue"}`, `onUpdate:${M(e.arg ?? "modelValue")}`].find((r) => t.props[r]), n = t.props[i];
          let u = null;
          if (n) {
            m.push(i);
            const r = n.toString(), l = /\(\$event\) => (.*?) = \$event/.exec(r);
            l && (u = l[1]);
          }
          g("model", e, u);
        } else if (e.instance._ || e.instance.$) {
          const s = e.instance.$ ?? e.instance._;
          let i;
          for (const n of [s.directives, s.appContext.directives]) {
            for (const u in n)
              if (n[u] === e.dir) {
                i = u;
                break;
              }
            if (i) break;
          }
          if (!i) {
            for (const n in s.setupState)
              if (s.setupState[n] === e.dir) {
                i = n.replace(/^v(\w)/, (u, r) => r.toLowerCase());
                break;
              }
          }
          i && g(i, e);
        }
    }
    for (const e in t.props) {
      if (m.includes(e) || o && e in o)
        continue;
      const s = t.props[e];
      S(e, s);
    }
    if (o)
      for (const e in o)
        S(e, o[e]);
    p.length > 1 && ($ = !0);
    const d = O(t);
    let j = !1;
    const c = [];
    if (typeof t.children == "string")
      d === "pre" ? c.push(t.children) : c.push(...t.children.split(`
`)), j = !0;
    else if (Array.isArray(t.children)) {
      let e;
      for (const s of t.children) {
        const i = await x(s);
        if (i.isText) {
          e === void 0 && (e = !0);
          const n = i.lines[0];
          !c.length || /^\s/.test(n) ? c.push(n.trim()) : c[c.length - 1] += n;
        } else
          e === void 0 && (e = !1), c.push(...i.lines);
      }
      e !== void 0 && (j = e);
    }
    if (t.children && typeof t.children == "object" && !Array.isArray(t.children)) {
      for (const e in t.children)
        if (typeof t.children[e] == "function") {
          const s = K((r) => `{{ ${r} }}`, (r, l) => {
            if (l === "__v_isRef")
              return () => !1;
          }), i = t.children[e](s.proxy), n = [];
          for (const r of i)
            n.push(...(await x(r)).lines);
          const u = Object.keys(s.cache);
          u.length ? (c.push(`<template #${e}="{ ${u.join(", ")} }">`), c.push(..._(n)), c.push("</template>")) : e === "default" ? c.push(...n) : (c.push(`<template #${e}>`), c.push(..._(n)), c.push("</template>"));
        }
    }
    const h = [`<${d}`];
    if ($) {
      for (const e of p)
        h.push(..._(e));
      c.length > 0 && h.push(">");
    } else
      p.length === 1 && (h[0] += ` ${p[0]}`), c.length > 0 && (h[0] += ">");
    const k = N.includes(d.toLowerCase());
    c.length > 0 ? c.length === 1 && h.length === 1 && !p.length && j ? a.push(`${h[0]}${c[0]}</${d}>`) : (a.push(...h), a.push(..._(c)), a.push(`</${d}>`)) : h.length > 1 ? (a.push(...h), a.push(k ? ">" : "/>")) : a.push(`${h[0]}${k ? "" : " /"}>`);
  } else if (t?.shapeFlag & 16)
    for (const g of t.children)
      a.push(...(await x(g)).lines);
  return {
    lines: a
  };
}
function O(t) {
  if (typeof t.type == "string")
    return t.type;
  if (t.type?.__asyncResolved) {
    const o = t.type?.__asyncResolved;
    return o.name ?? R(o.__file);
  } else {
    if (t.type?.name)
      return t.type.name;
    if (t.type?.__file)
      return R(t.type.__file);
  }
  return "Anonymous";
}
function R(t) {
  const o = /([^/]+)\.vue$/.exec(t);
  return o ? U(o[1]) : "Anonymous";
}
function V(t) {
  const o = !!t?.__autoBuildingObject, a = P(t);
  return o ? [A(a.__autoBuildingObjectGetKey)] : A(a).split(`
`);
}
function A(t) {
  return t.replace(/\$setup\./g, "");
}
export {
  I as generateSourceCode,
  O as getTagName
};
