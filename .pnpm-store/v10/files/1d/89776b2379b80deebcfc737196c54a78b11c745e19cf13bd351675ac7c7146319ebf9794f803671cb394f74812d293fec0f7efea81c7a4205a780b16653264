import { addCode } from "./common-BTTMZY21.js";
import { allCodeFeatures, createPlugin } from "ts-macro";
import { createFilter } from "@vue-macros/common";
import { isHTMLTag, isSVGTag } from "@vue/shared";

//#region src/jsx-directive/context.ts
function resolveCtxMap(ctxNodeMap, options) {
	if (ctxNodeMap.size) options.codes.push(`
type __VLS_IsAny<T> = 0 extends 1 & T ? true : false;
type __VLS_PickNotAny<A, B> = __VLS_IsAny<A> extends true ? B : A;
type __VLS_PrettifyGlobal<T> = { [K in keyof T as K]: T[K] } & {};
declare function __VLS_asFunctionalComponent<
  T,
  K = T extends new (...args: any) => any ? InstanceType<T> : unknown,
>(
  t: T,
): T extends new (...args: any) => any
  ? (
      props: (K extends { $props: infer Props }
        ? Props
        : K extends { props: infer Props }
          ? Props
          : any),
      ctx?: any,
    ) => JSX.Element & {
      __ctx: {
        attrs: Record<string, any>,
        props: (K extends { $props: infer Props }
          ? Props
          : K extends { props: infer Props }
            ? Props
            : any),
        slots: K extends { $slots: infer Slots }
          ? Slots
          : K extends { slots: infer Slots }
            ? Slots
            : any
        emit: K extends { $emit: infer Emit }
          ? Emit
          : K extends { emit: infer Emit }
            ? Emit
            : any
        expose: (
          exposed: K extends { exposeProxy: infer Exposed }
            ? string extends keyof NonNullable<Exposed>
              ? K
              : Exposed
            : K,
        ) => void
      }
    }
  : T extends () => any
    ? (props: {}, ctx?: any) => ReturnType<T>
    : T extends (...args: any) => any
      ? T
      : (_: {}, ctx?: any) => {
          __ctx: {
            attrs?: any
            expose?: any
            slots?: any
            emit?: any
          } 
        };
const __VLS_nativeElements = {
  ...{} as SVGElementTagNameMap,
  ...{} as HTMLElementTagNameMap,
};
declare function __VLS_getFunctionalComponentCtx<T, K, const S>(
  comp: T,
  compInstance: K,
  s: S,
): S extends keyof typeof __VLS_nativeElements
  ? { expose: (exposed: (typeof __VLS_nativeElements)[S]) => any }
    : '__ctx' extends keyof __VLS_PickNotAny<K, {}> 
      ? K extends { __ctx?: infer Ctx } ? Ctx : never
      : T extends (props: infer P, ctx: { expose: (exposed: infer Exposed) => void } & infer Ctx) => any 
        ? Ctx & {
            props: P,
            expose: (
              exposed: __VLS_PrettifyGlobal<
                import('vue').ShallowUnwrapRef<Exposed>
              >,
            ) => void,
          }
        : {};\n`);
	return new Map(Array.from(ctxNodeMap).map(([node, root], index) => [node, transformCtx(node, root, index, options)]));
}
function transformCtx(node, root, index, options) {
	const { ts, ast, codes, prefix } = options;
	const openingElement = getOpeningElement(node, options);
	if (!openingElement) return "";
	let props = "";
	let refValue;
	for (const prop of openingElement.attributes.properties) {
		if (!ts.isJsxAttribute(prop)) continue;
		let name = prop.name.getText(ast);
		if (name === "ref" && prop.initializer && ts.isJsxExpression(prop.initializer) && prop.initializer.expression) {
			refValue = getRefValue(prop.initializer.expression, options);
			continue;
		}
		const prefixModel = `${prefix}model`;
		if (name.startsWith(prefixModel)) name = name.split("$")[0].split("_")[0].split(":")[1] ?? "modelValue";
		else if (name.includes("_")) name = name.split("_")[0];
		else if (prefix && name.startsWith(prefix)) continue;
		if (!name) continue;
		const value = prop.initializer ? ts.isJsxExpression(prop.initializer) && prop.initializer.expression ? prop.initializer.expression.getText(ast) : prop.initializer.getText(ast) : "true";
		props += `'${name}': ${value},`;
	}
	const ctxName = `__VLS_ctx_${refValue || index}`;
	let tagName = "";
	const originTagName = tagName = getTagName(node, options);
	if (isHTMLTag(tagName) || isSVGTag(tagName) || tagName.includes("-")) tagName = `{}`;
	else {
		let types = "";
		if (openingElement.typeArguments?.length) {
			types = `<${openingElement.typeArguments.map((argument) => argument.getText(ast)).join(", ")}>`;
			tagName += types;
		}
	}
	const result = `\nconst ${ctxName} = __VLS_getFunctionalComponentCtx(${tagName}, __VLS_asFunctionalComponent(${tagName})({${props}}), '${originTagName}');\n`;
	if (root) codes.replaceRange(root.end - 1, root.end - 1, result);
	else addCode(codes, result);
	return ctxName;
}
function getRefValue(expression, options) {
	const { ts, ast } = options;
	if (ts.isIdentifier(expression)) return expression.getText(ast);
	else if (ts.isFunctionLike(expression)) {
		let left;
		if (ts.isBinaryExpression(expression.body)) left = expression.body.left;
		ts.forEachChild(expression.body, (node) => {
			if (ts.isBinaryExpression(node)) left = node.left;
			else if (ts.isExpressionStatement(node) && ts.isBinaryExpression(node.expression)) left = node.expression.left;
		});
		return left && (ts.isPropertyAccessExpression(left) || ts.isElementAccessExpression(left) ? left.expression : left).getText(ast);
	} else if (ts.isCallExpression(expression) && expression.arguments[0] && ts.isIdentifier(expression.arguments[0])) return expression.arguments[0].getText(ast);
}

//#endregion
//#region src/jsx-directive/custom-directive.ts
function transformCustomDirective(attributes, options) {
	if (!attributes.length) return;
	attributes.forEach((attribute) => transform$1(attribute, options));
	options.codes.push(`
type __VLS_ResolveDirective<T> = T extends import('vue').Directive<
  any,
  infer V,
  infer M extends string,
  infer A extends string
>
  ? [any, V, A, Record<M, true>]
  : any;
`);
}
function transform$1(attribute, options) {
	const { codes, ts, ast } = options;
	const attributeName = attribute.name.getText(ast);
	let directiveName = attributeName.split(/\s/)[0].split("v-")[1];
	let modifiers = [];
	if (directiveName.includes("_")) [directiveName, ...modifiers] = directiveName.split("_");
	if (directiveName) directiveName = directiveName[0].toUpperCase() + directiveName.slice(1);
	let arg;
	if (directiveName.includes(":")) [directiveName, arg] = directiveName.split(":");
	const start = attribute.getStart(ast);
	const offset = start + directiveName.length + 2;
	codes.replaceRange(start, attribute.end, [
		ast.text.slice(start, offset),
		start,
		{ verification: true }
	], `={[`, [
		`v`,
		start,
		{
			...allCodeFeatures,
			verification: false
		}
	], [
		directiveName,
		start + 2,
		{
			...allCodeFeatures,
			verification: false
		}
	], `,`, attribute.initializer ? [ts.isStringLiteral(attribute.initializer) ? attribute.initializer.getText(ast) : attribute.initializer.getText(ast).slice(1, -1), attribute.initializer.getStart(ast) + (ts.isStringLiteral(attribute.initializer) ? 0 : 1)] : "{} as any", ",", ...arg === void 0 ? ["{} as any"] : [
		[
			`'`,
			offset + 1,
			{ verification: true }
		],
		[arg, offset + 1],
		[
			`'`,
			offset + arg.length,
			{ verification: true }
		]
	], ",", ...modifiers.length ? [
		"{",
		...modifiers.flatMap((modify, index) => [
			modify ? "" : `'`,
			[modify, attribute.getStart(ast) + (attributeName.indexOf("_") + 1) + (index ? modifiers.slice(0, index).join("").length + index : 0)],
			modify ? ": true," : `'`
		]),
		"}"
	] : ["{} as any"], `] satisfies __VLS_ResolveDirective<typeof v${directiveName}>}`);
}

//#endregion
//#region src/jsx-directive/ref.ts
function transformRef(nodes, ctxMap, options) {
	const { codes, ts, ast } = options;
	for (const { node, attribute } of nodes) if (attribute.initializer && ts.isJsxExpression(attribute.initializer) && attribute.initializer.expression && (ts.isFunctionExpression(attribute.initializer.expression) || ts.isArrowFunction(attribute.initializer.expression))) codes.replaceRange(attribute.getStart(ast), attribute.end, "{...({ ", ["ref", attribute.name.getStart(ast)], ": ", [attribute.initializer.expression.getText(ast), attribute.initializer.expression.getStart(ast)], `} satisfies { ref: (e: Parameters<typeof ${ctxMap.get(node)}.expose>[0]) => any }) as {}}`);
}

//#endregion
//#region src/jsx-directive/v-bind.ts
function transformVBind(nodes, options) {
	if (nodes.length === 0) return;
	const { codes, ast } = options;
	for (const { attribute } of nodes) {
		const attributeName = attribute.name.getText(ast);
		const start = attribute.name.getStart(ast);
		const end = attribute.name.end;
		if (attributeName.includes("_")) codes.replaceRange(start + attributeName.indexOf("_"), end);
	}
}

//#endregion
//#region src/jsx-directive/v-for.ts
function resolveVFor(attribute, options) {
	const { ts, ast } = options;
	const result = [];
	if (attribute.initializer && ts.isJsxExpression(attribute.initializer) && attribute.initializer.expression && ts.isBinaryExpression(attribute.initializer.expression)) {
		let index;
		let objectIndex;
		let item = attribute.initializer.expression.left;
		const list = attribute.initializer.expression.right;
		if (ts.isParenthesizedExpression(item)) if (ts.isBinaryExpression(item.expression)) if (ts.isBinaryExpression(item.expression.left)) {
			index = item.expression.left.right;
			objectIndex = item.expression.right;
			item = item.expression.left.left;
		} else {
			index = item.expression.right;
			item = item.expression.left;
		}
		else item = item.expression;
		if (item && list) result.push("__VLS_getVForSourceType(", [ast.text.slice(list.getStart(ast), list.end), list.getStart(ast)], ").map(([", [String(ast.text.slice(item.getStart(ast), item.end)), item.getStart(ast)], ", ", index ? [String(ast.text.slice(index.getStart(ast), index.end)), index.getStart(ast)] : objectIndex ? "undefined" : "", ...objectIndex ? [", ", [String(ast?.text.slice(objectIndex.getStart(ast), objectIndex.end)), objectIndex.getStart(ast)]] : "", "]) => ");
	}
	return result;
}
function transformVFor(nodes, options, hasVForAttribute) {
	if (!nodes.length && !hasVForAttribute) return;
	const { codes, ast } = options;
	nodes.forEach(({ attribute, node, parent }) => {
		const result = resolveVFor(attribute, options);
		if (parent) result.unshift("{");
		codes.replaceRange(node.getStart(ast), node.getStart(ast), ...result);
		codes.replaceRange(node.end - 1, node.end, `>)${parent ? "}" : ""}`);
		codes.replaceRange(attribute.getStart(ast), attribute.end);
	});
	codes.push(`
// @ts-ignore
function __VLS_getVForSourceType<T extends number | string | any[] | Iterable<any>>(source: T): [
  item: T extends number ? number
    : T extends string ? string
    : T extends any[] ? T[number]
    : T extends Iterable<infer T1> ? T1
    : any,
  index: number,
][];
// @ts-ignore
function __VLS_getVForSourceType<T>(source: T): [
  item: T[keyof T],
  key: keyof T,
  index: number,
][];
`);
}

//#endregion
//#region src/jsx-directive/v-if.ts
function transformVIf(nodes, options) {
	const { codes, ts, prefix, ast } = options;
	nodes.forEach(({ node, attribute, parent }, index) => {
		if (!ts.isIdentifier(attribute.name)) return;
		if ([`${prefix}if`, `${prefix}else-if`].includes(attribute.name.getText(ast)) && attribute.initializer && ts.isJsxExpression(attribute.initializer) && attribute.initializer.expression) {
			const hasScope = parent && attribute.name.text === `${prefix}if`;
			codes.replaceRange(node.getStart(ast), node.getStart(ast), `${hasScope ? "{" : ""}(`, [attribute.initializer.expression.getText(ast), attribute.initializer.expression.getStart(ast)], ") ? ");
			const nextAttribute = nodes[index + 1]?.attribute;
			const nextNodeHasElse = nextAttribute && ts.isIdentifier(nextAttribute.name) ? String(nextAttribute.name.text).startsWith(`${prefix}else`) : false;
			codes.replaceRange(node.end, node.end, nextNodeHasElse ? " : " : ` : null${parent ? "}" : ""}`);
		} else if (attribute.name.text === `${prefix}else`) codes.replaceRange(node.end, node.end, parent ? "}" : "");
		codes.replaceRange(attribute.getStart(ast), attribute.end);
	});
}

//#endregion
//#region src/jsx-directive/v-model.ts
const isNativeFormElement = (tag) => {
	return [
		"input",
		"select",
		"textarea"
	].includes(tag);
};
function transformVModel(nodeMap, ctxMap, options) {
	if (!nodeMap.size) return;
	for (const [, nodes] of nodeMap) transform(nodes, ctxMap, options);
	getModelsType(options.codes);
}
function transform(nodes, ctxMap, options) {
	const { codes, ts, ast, prefix } = options;
	let firstNamespacedNode;
	const result = [];
	const emitsResult = [];
	const modifiersResult = [];
	const offset = `${prefix}model`.length + 1;
	for (const { attribute: attribute$1, node: node$1 } of nodes) {
		const isNative = isNativeFormElement(getTagName(node$1, options));
		const modelValue = isNative ? "value" : "modelValue";
		const isArrayExpression = attribute$1.initializer && ts.isJsxExpression(attribute$1.initializer) && attribute$1.initializer.expression && ts.isArrayLiteralExpression(attribute$1.initializer.expression);
		const name = attribute$1.name.getText(ast);
		const start = attribute$1.name.getStart(ast);
		if (name.startsWith(`${prefix}model:`) || isArrayExpression) {
			let isDynamic = false;
			const [attributeName$1, ...modifiers] = name.slice(offset).split(/\s/)[0].replace(/^\$(.*)\$/, (_, $1) => {
				isDynamic = true;
				return $1.replaceAll("_", ".");
			}).split("_");
			firstNamespacedNode ??= {
				attribute: attribute$1,
				attributeName: attributeName$1,
				node: node$1
			};
			if (firstNamespacedNode.attribute !== attribute$1) {
				codes.replaceRange(attribute$1.getStart(ast), attribute$1.end);
				result.push(",");
			}
			if (isArrayExpression) {
				const { elements } = attribute$1.initializer.expression;
				if (elements[1] && !ts.isArrayLiteralExpression(elements[1])) {
					isDynamic = !ts.isStringLiteral(elements[1]);
					result.push(isDynamic ? "[`${" : "", [elements[1].getText(ast), elements[1].getStart(ast)], isDynamic ? "}`]" : "");
				} else result.push(modelValue);
				if (elements[0]) result.push(":", [elements[0].getText(ast), elements[0].getStart(ast)]);
			} else {
				result.push(isDynamic ? "[`${" : "", ...attributeName$1.split("-").map((code, index, codes$1) => [index ? code.at(0)?.toUpperCase() + code.slice(1) : code, start + offset + (isDynamic ? 1 : 0) + (index && codes$1[index - 1].length + 1)]), isDynamic ? "}`]" : "");
				if (attributeName$1) {
					if (attribute$1.initializer && ts.isJsxExpression(attribute$1.initializer) && attribute$1.initializer.expression) result.push(":", [attribute$1.initializer.expression.getText(ast), attribute$1.initializer.expression.getStart(ast)]);
					if (!isDynamic && modifiers.length) modifiersResult.push(` {...{`, ...modifiers.flatMap((modify, index) => [
						modify ? "" : `'`,
						[modify, start + offset + attributeName$1.length + 1 + (index ? modifiers.slice(0, index).join("").length + index : 0)],
						modify ? ": true, " : `'`
					]), `} satisfies typeof ${ctxMap.get(node$1)}.props.${attributeName$1}Modifiers}`);
				}
			}
			emitsResult.push(`'onUpdate:${attributeName$1}': () => {}, `);
		} else {
			const [, ...modifiers] = name.split("_");
			const result$1 = [];
			result$1.push(...isNative ? isRadioOrCheckbox(node$1, options) ? "v-model" : [[modelValue, start + 2]] : [[modelValue.slice(0, 3), start], [modelValue.slice(3), start]]);
			if (modifiers.length) result$1.unshift(`{...{`, ...modifiers.flatMap((modify, index) => [
				modify ? "" : `'`,
				[modify, start + offset + (index ? modifiers.slice(0, index).join("").length + index : 0)],
				modify ? ": true, " : `'`
			]), `} satisfies `, isNative ? "{ trim?: true, number?: true, lazy?: true}" : `typeof ${ctxMap.get(node$1)}.props.modelValueModifiers`, `} `);
			if (!isNative) result$1.unshift(`{...{'onUpdate:${modelValue}': () => {} }} `);
			codes.replaceRange(start, attribute$1.name.end, ...result$1);
		}
	}
	if (!firstNamespacedNode) return;
	const { attribute, attributeName, node } = firstNamespacedNode;
	const end = attributeName ? attribute.end : attribute.getStart(ast) + offset;
	codes.replaceRange(attribute.getStart(ast), end, `{...{`, ...result, `} satisfies __VLS_GetModels<__VLS_NormalizeProps<typeof ${ctxMap.get(node)}.props>>}`, ...modifiersResult, ` {...{`, ...emitsResult, `}}`);
}
function isRadioOrCheckbox(node, options) {
	const { ts, ast } = options;
	const openingElement = getOpeningElement(node, options);
	if (!openingElement) return false;
	return openingElement.tagName.getText(ast) === "input" && openingElement.attributes.properties.some((attr) => {
		return ts.isJsxAttribute(attr) && attr.name.getText(ast) === "type" && attr.initializer && ts.isStringLiteral(attr.initializer) && (attr.initializer.text === "radio" || attr.initializer.text === "checkbox");
	});
}
function getModelsType(codes) {
	codes.push(`
type __VLS_NormalizeProps<T> = T extends object
  ? {
      [K in keyof T as {} extends Record<K, 1>
        ? never
        : K extends keyof import('vue').VNodeProps | 'class' | 'style'
          ? never
          : K]: T[K]
    }
  : never;
type __VLS_CamelCase<S extends string> = S extends \`\${infer F}-\${infer RF}\${infer R}\`
  ? \`\${F}\${Uppercase<RF>}\${__VLS_CamelCase<R>}\`
  : S;
type __VLS_PropsToEmits<T> = T extends object
    ? {
        [K in keyof T as K extends \`onUpdate:\${infer R}\`
          ? R extends 'modelValue'
            ? never
            : __VLS_CamelCase<R>
          : never]: T[K]
      }
    : never
type __VLS_GetModels<P, E = __VLS_PropsToEmits<P>> = P extends object
  ? {
      [K in keyof P as K extends keyof E
        ? K
        : never]: K extends keyof P ? P[K] : never
    }
  : {};
`);
}

//#endregion
//#region src/jsx-directive/v-on.ts
function transformVOn(nodes, ctxMap, options) {
	if (nodes.length === 0) return;
	const { codes, ast } = options;
	for (const { node, attribute } of nodes) {
		codes.replaceRange(attribute.getStart(ast), attribute.name.end + 2, "{...");
		codes.replaceRange(attribute.end - 1, attribute.end - 1, ` satisfies __VLS_NormalizeEmits<typeof ${ctxMap.get(node)}.emit>`);
	}
	codes.push(`
type __VLS_UnionToIntersection<U> = (U extends unknown ? (arg: U) => unknown : never) extends ((arg: infer P) => unknown) ? P : never;
type __VLS_OverloadUnionInner<T, U = unknown> = U & T extends (...args: infer A) => infer R
  ? U extends T
  ? never
  : __VLS_OverloadUnionInner<T, Pick<T, keyof T> & U & ((...args: A) => R)> | ((...args: A) => R)
  : never;
type __VLS_OverloadUnion<T> = Exclude<
  __VLS_OverloadUnionInner<(() => never) & T>,
  T extends () => never ? never : () => never
>;
type __VLS_ConstructorOverloads<T> = __VLS_OverloadUnion<T> extends infer F
  ? F extends (event: infer E, ...args: infer A) => any
  ? { [K in E & string]: (...args: A) => void; }
  : never
  : never;
type __VLS_NormalizeEmits<T> = __VLS_PrettifyGlobal<
  __VLS_UnionToIntersection<
    __VLS_ConstructorOverloads<T> & {
      [K in keyof T]: T[K] extends any[] ? { (...args: T[K]): void } : never
    }
  >
>;\n`);
}
function transformOnWithModifiers(nodes, options) {
	const { codes, ast, ts } = options;
	for (const { attribute } of nodes) {
		const attributeName = attribute.name.getText(ast).split("_")[0];
		const start = attribute.name.getStart(ast);
		const end = attribute.name.end;
		codes.replaceRange(start, end, "{...{", [attributeName, start]);
		if (!attribute.initializer) codes.replaceRange(end, end, ": () => {}}}");
		else if (ts.isJsxExpression(attribute.initializer) && attribute.initializer.expression) {
			codes.replaceRange(end, attribute.initializer.expression.getStart(ast), ": ");
			codes.replaceRange(attribute.end, attribute.end, "}");
		}
	}
}

//#endregion
//#region src/jsx-directive/v-slot.ts
function transformVSlot(nodeMap, ctxMap, options) {
	if (nodeMap.size === 0) return;
	const { codes, ts, ast, prefix } = options;
	nodeMap.forEach(({ attributeMap, vSlotAttribute }, node) => {
		const result = [" v-slots={{"];
		const attributes = Array.from(attributeMap);
		attributes.forEach(([attribute, { children, vIfAttribute, vForAttribute }], index) => {
			if (!attribute) return;
			let vIfAttributeName;
			if (vIfAttribute && (vIfAttributeName = vIfAttribute.name.getText(ast))) {
				if (`${prefix}if` === vIfAttributeName) result.push("...");
				if ([`${prefix}if`, `${prefix}else-if`].includes(vIfAttributeName) && vIfAttribute.initializer && ts.isJsxExpression(vIfAttribute.initializer) && vIfAttribute.initializer.expression) result.push("(", [vIfAttribute.initializer.expression.getText(ast), vIfAttribute.initializer.expression.getStart(ast)], ") ? {");
				else if (`${prefix}else` === vIfAttributeName) result.push("{");
			}
			if (vForAttribute) result.push("...", ...resolveVFor(vForAttribute, options), "({");
			let isDynamic = false;
			let attributeName = attribute.name.getText(ast).slice(6).split(/\s/)[0].replace(/\$(.*)\$/, (_, $1) => {
				isDynamic = true;
				return $1.replaceAll("_", ".");
			});
			const isNamespace = attributeName.startsWith(":");
			attributeName = attributeName.slice(1);
			const wrapByQuotes = !attributeName || attributeName.includes("-");
			result.push(isNamespace ? [isDynamic ? `[${attributeName}]` : wrapByQuotes ? `'${attributeName}'` : attributeName, attribute.name.getStart(ast) + (wrapByQuotes ? 6 : 7)] : "default", `: (`, ...(!isNamespace || attributeName) && attribute.initializer && ts.isJsxExpression(attribute.initializer) && attribute.initializer.expression ? [[attribute.initializer.expression.getText(ast), attribute.initializer.expression.getStart(ast)], isDynamic ? ": any" : ""] : [], ") => <>", ...children.map((child) => {
				codes.replaceRange(child.pos, child.end);
				const isSlotTemplate = getTagName(child, options) === "template" && !vSlotAttribute;
				const node$1 = isSlotTemplate && ts.isJsxElement(child) ? child.children : child;
				return isSlotTemplate && ts.isJsxSelfClosingElement(child) ? "" : [ast.text.slice(node$1.pos, node$1.end), node$1.pos];
			}), "</>,");
			if (vForAttribute) result.push("})) as any,");
			if (vIfAttribute && vIfAttributeName) {
				if ([`${prefix}if`, `${prefix}else-if`].includes(vIfAttributeName)) {
					const nextIndex = index + (attributes[index + 1]?.[0] ? 1 : 2);
					const nextAttribute = attributes[nextIndex]?.[1].vIfAttribute;
					result.push("}", nextAttribute && nextAttribute.name.getText(ast).startsWith(`${prefix}else`) ? " : " : " : null,");
				} else if (`${prefix}else` === vIfAttributeName) result.push("},");
			}
		});
		const slotType = `} satisfies typeof ${ctxMap.get(node)}.slots}`;
		if (attributeMap.has(null)) result.push("default: () => <>");
		else result.push(slotType);
		if (vSlotAttribute) codes.replaceRange(vSlotAttribute.getStart(ast), vSlotAttribute.end, ...result);
		else if (ts.isJsxElement(node)) {
			codes.replaceRange(node.openingElement.end - 1, node.openingElement.end, ...result);
			codes.replaceRange(node.closingElement.pos, node.closingElement.pos, attributeMap.has(null) ? `</>${slotType}>` : ">");
		}
	});
}

//#endregion
//#region src/jsx-directive/v-slots.ts
function transformVSlots(nodes, ctxMap, options) {
	const { codes, ts } = options;
	for (const { node, attribute: { initializer } } of nodes) if (initializer && ts.isJsxExpression(initializer) && initializer.expression) {
		if (ts.isObjectLiteralExpression(initializer.expression)) codes.replaceRange(initializer.expression.end, initializer.expression.end, ` satisfies typeof ${ctxMap.get(node)}.slots`);
		else if (ts.isFunctionExpression(initializer.expression) || ts.isArrowFunction(initializer.expression)) {
			codes.replaceRange(initializer.expression.pos, initializer.expression.pos, "(");
			codes.replaceRange(initializer.expression.end, initializer.expression.end, `) satisfies typeof ${ctxMap.get(node)}.slots.default`);
		}
	}
}

//#endregion
//#region src/jsx-directive/index.ts
function transformJsxDirective(options) {
	const { ast, ts, prefix, codes } = options;
	const resolvedPrefix = prefix.replaceAll("$", String.raw`\$`);
	const slotRegex = /* @__PURE__ */ new RegExp(`^${resolvedPrefix}slot(?=:|$)`);
	const modelRegex = /* @__PURE__ */ new RegExp(`^${resolvedPrefix}model(?=[:_]|$)`);
	const bindRegex = /* @__PURE__ */ new RegExp(`^(?!${resolvedPrefix}|on[A-Z])\\S+_\\S+`);
	const onWithModifiersRegex = /^on[A-Z]\S*_\S+/;
	const vIfMap = /* @__PURE__ */ new Map();
	const vForNodes = [];
	const vSlotMap = /* @__PURE__ */ new Map();
	const vModelMap = /* @__PURE__ */ new Map();
	const vOnNodes = [];
	const onWithModifiers = [];
	const vBindNodes = [];
	const refNodes = [];
	const vSlots = [];
	const customDirectives = [];
	const ctxNodeMap = /* @__PURE__ */ new Map();
	let hasVForAttribute = false;
	function walkJsxDirective(node, parent, parents = []) {
		const tagName = getTagName(node, options);
		const properties = getOpeningElement(node, options);
		let ctxNode;
		let vIfAttribute;
		let vForAttribute;
		let vSlotAttribute;
		for (const attribute of properties?.attributes.properties || []) {
			if (!ts.isJsxAttribute(attribute)) continue;
			const attributeName = attribute.name.getText(ast);
			if ([
				`${prefix}if`,
				`${prefix}else-if`,
				`${prefix}else`
			].includes(attributeName)) vIfAttribute = attribute;
			else if (attributeName === `${prefix}for`) {
				vForAttribute = attribute;
				hasVForAttribute = true;
			} else if (slotRegex.test(attributeName)) vSlotAttribute = attribute;
			else if (modelRegex.test(attributeName)) {
				vModelMap.has(node) || vModelMap.set(node, []);
				vModelMap.get(node).push({
					node,
					attribute
				});
				if (!isNativeFormElement(tagName)) ctxNode = node;
			} else if (attributeName === `${prefix}on`) {
				vOnNodes.push({
					node,
					attribute
				});
				ctxNode = node;
			} else if (onWithModifiersRegex.test(attributeName)) onWithModifiers.push({
				node,
				attribute
			});
			else if (bindRegex.test(attributeName)) vBindNodes.push({
				node,
				attribute
			});
			else if (attributeName === "ref") {
				refNodes.push({
					node,
					attribute
				});
				ctxNode = node;
			} else if (attributeName === `${prefix}slots`) {
				ctxNode = node;
				vSlots.push({
					node,
					attribute
				});
			} else if ([
				`${prefix}html`,
				`${prefix}memo`,
				`${prefix}once`
			].includes(attributeName)) codes.replaceRange(attribute.pos, attribute.end);
			else if (attributeName.startsWith("v-")) customDirectives.push(attribute);
		}
		if (ts.isJsxExpression(node) && node.expression && (ts.isObjectLiteralExpression(node.expression) || ts.isArrowFunction(node.expression) || ts.isFunctionExpression(node.expression)) && parent && ts.isJsxElement(parent) && !parent.children.every((child) => child !== node && (ts.isJsxText(child) ? child.getText(ast).trim() : true))) {
			ctxNode = parent;
			vSlots.push({
				node: parent,
				attribute: { initializer: {
					kind: ts.SyntaxKind.JsxExpression,
					expression: node.expression
				} }
			});
		}
		if (!vSlotAttribute || tagName !== "template") {
			if (vIfAttribute) {
				vIfMap.has(parent) || vIfMap.set(parent, []);
				vIfMap.get(parent).push({
					node,
					attribute: vIfAttribute,
					parent
				});
			}
			if (vForAttribute) vForNodes.push({
				node,
				attribute: vForAttribute,
				parent: vIfAttribute ? void 0 : parent
			});
		}
		if (vSlotAttribute) {
			const slotNode = tagName === "template" ? parent : node;
			if (!slotNode) return;
			ctxNode = slotNode;
			const attributeMap = vSlotMap.get(slotNode)?.attributeMap || vSlotMap.set(slotNode, {
				vSlotAttribute: tagName === "template" ? void 0 : vSlotAttribute,
				attributeMap: /* @__PURE__ */ new Map()
			}).get(slotNode).attributeMap;
			const children = attributeMap.get(vSlotAttribute)?.children || attributeMap.set(vSlotAttribute, {
				children: [],
				...tagName === "template" ? {
					vIfAttribute,
					vForAttribute
				} : {}
			}).get(vSlotAttribute).children;
			if (slotNode === parent && ts.isJsxElement(parent)) {
				children.push(node);
				if (attributeMap.get(null)) return;
				for (const child of parent.children) {
					if (getTagName(child, options) === "template" || ts.isJsxText(child) && !child.getText(ast).trim()) continue;
					(attributeMap.get(null)?.children || attributeMap.set(null, { children: [] }).get(null).children).push(child);
				}
			} else if (ts.isJsxElement(node)) children.push(...node.children);
		}
		if (ctxNode) ctxNodeMap.set(ctxNode, parents.find(ts.isBlock));
		node.forEachChild((child) => {
			parents.unshift(node);
			walkJsxDirective(child, ts.isJsxElement(node) || ts.isJsxFragment(node) ? node : void 0, parents);
			parents.shift();
		});
	}
	ast.forEachChild(walkJsxDirective);
	const ctxMap = resolveCtxMap(ctxNodeMap, options);
	transformVSlot(vSlotMap, ctxMap, options);
	transformVFor(vForNodes, options, hasVForAttribute);
	vIfMap.forEach((nodes) => transformVIf(nodes, options));
	transformVModel(vModelMap, ctxMap, options);
	transformVOn(vOnNodes, ctxMap, options);
	transformOnWithModifiers(onWithModifiers, options);
	transformVBind(vBindNodes, options);
	transformRef(refNodes, ctxMap, options);
	transformVSlots(vSlots, ctxMap, options);
	transformCustomDirective(customDirectives, options);
}
function getOpeningElement(node, options) {
	const { ts } = options;
	return ts.isJsxSelfClosingElement(node) ? node : ts.isJsxElement(node) ? node.openingElement : void 0;
}
function getTagName(node, options) {
	const openingElement = getOpeningElement(node, options);
	if (!openingElement) return "";
	return openingElement.tagName.getText(options.ast);
}

//#endregion
//#region src/jsx-directive.ts
const plugin = createPlugin(({ ts, vueCompilerOptions }, options = vueCompilerOptions?.vueMacros?.jsxDirective === true ? {} : vueCompilerOptions?.vueMacros?.jsxDirective ?? {}) => {
	if (!options) return [];
	const filter = createFilter(options);
	return {
		name: "vue-macros-jsx-directive",
		resolveVirtualCode({ filePath, ast, codes, lang }) {
			if (!filter(filePath) || !["jsx", "tsx"].includes(lang)) return;
			transformJsxDirective({
				codes,
				ast,
				ts,
				prefix: options.prefix ?? "v-"
			});
		}
	};
});
var jsx_directive_default = plugin;

//#endregion
export { jsx_directive_default, plugin };