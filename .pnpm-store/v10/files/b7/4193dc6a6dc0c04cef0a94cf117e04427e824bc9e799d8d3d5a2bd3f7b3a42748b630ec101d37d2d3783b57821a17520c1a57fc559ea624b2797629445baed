import { HELPER_PREFIX, MagicStringAST, REGEX_SETUP_SFC, babelParse, generateTransform, getLang, importHelperFn, parseSFC, walkAST } from "@vue-macros/common";

//#region src/core/v-for.ts
function resolveVFor(attribute, s, { lib }, vMemoAttribute) {
	if (attribute.value) {
		let item, index, objectIndex, list;
		if (attribute.value.type === "JSXExpressionContainer" && attribute.value.expression.type === "BinaryExpression") {
			if (attribute.value.expression.left.type === "SequenceExpression") {
				const expressions = attribute.value.expression.left.expressions;
				item = expressions[0] || "";
				index = expressions[1] || "";
				objectIndex = expressions[2] || "";
			} else item = attribute.value.expression.left;
			list = attribute.value.expression.right;
		}
		if (item && list) {
			if (vMemoAttribute) index ??= `${HELPER_PREFIX}index`;
			const renderList = importHelperFn(s, 0, "renderList", void 0, lib.startsWith("vue") ? "vue" : "@vue-macros/jsx-directive/helpers");
			const params = [
				item,
				index,
				objectIndex
			].flatMap((param, index$1) => param ? index$1 ? [", ", param] : param : []);
			return [
				renderList,
				"(",
				list,
				", (",
				...params,
				") => "
			];
		}
	}
	return [];
}
function transformVFor(nodes, s, options) {
	if (nodes.length === 0) return;
	nodes.forEach(({ node, attribute, parent, vIfAttribute, vMemoAttribute }) => {
		const hasScope = ["JSXElement", "JSXFragment"].includes(String(parent?.type));
		s.replaceRange(node.start, node.start, hasScope ? vIfAttribute ? "" : "{" : "<>{", ...resolveVFor(attribute, s, options, vMemoAttribute));
		s.prependLeft(node.end, `)${hasScope ? vIfAttribute ? "" : "}" : "}</>"}`);
		s.replaceRange(attribute.start - 1, attribute.end);
		if (node.type === "JSXElement" && node.openingElement.name.type === "JSXIdentifier" && node.openingElement.name.name === "template" && node.closingElement) {
			s.overwriteNode(node.openingElement.name, "");
			s.overwriteNode(node.closingElement.name, "");
		}
	});
}

//#endregion
//#region src/core/v-html.ts
function transformVHtml(nodes, s) {
	nodes.forEach(({ attribute }) => {
		s.overwriteNode(attribute.name, "innerHTML");
	});
}

//#endregion
//#region src/core/v-if.ts
function transformVIf(nodes, s, options) {
	const { prefix } = options;
	nodes.forEach(({ node, attribute, parent }, index) => {
		const hasScope = ["JSXElement", "JSXFragment"].includes(String(parent?.type));
		if ([`${prefix}if`, `${prefix}else-if`].includes(String(attribute.name.name)) && attribute.value?.type === "JSXExpressionContainer") {
			s.replaceRange(node.start, node.start, hasScope ? "" : "<>{", attribute.name.name === `${prefix}if` && hasScope ? "{" : "", "(", attribute.value.expression, ") ? ");
			s.replaceRange(node.end, node.end, String(nodes[index + 1]?.attribute.name.name).startsWith(`${prefix}else`) ? " :" : ` : null${hasScope ? "}" : "}</>"}`);
		} else if (attribute.name.name === `${prefix}else`) s.appendRight(node.end, hasScope ? "}" : "");
		s.replaceRange(attribute.start - 1, attribute.end);
		if (node.type === "JSXElement" && node.openingElement.name.type === "JSXIdentifier" && node.openingElement.name.name === "template" && node.closingElement) {
			s.overwriteNode(node.openingElement.name, "");
			s.overwriteNode(node.closingElement.name, "");
		}
	});
}

//#endregion
//#region src/core/v-memo.ts
function transformVMemo(nodes, s, { lib }) {
	if (nodes.length === 0) return;
	const withMemo = importHelperFn(s, 0, "withMemo", void 0, lib.startsWith("vue") ? "vue" : "@vue-macros/jsx-directive/helpers");
	s.prependRight(0, `const ${HELPER_PREFIX}cache = [];`);
	nodes.forEach(({ node, attribute, parent, vForAttribute }, nodeIndex) => {
		const hasScope = ["JSXElement", "JSXFragment"].includes(String(parent?.type));
		s.appendRight(node.start, `${hasScope ? "{" : ""}${withMemo}(${attribute.value ? s.slice(attribute.value.start + 1, attribute.value.end - 1) : `[]`}, () => `);
		let index = String(nodeIndex);
		let cache = `${HELPER_PREFIX}cache`;
		let vForIndex = `${HELPER_PREFIX}index`;
		if (vForAttribute?.value?.type === "JSXExpressionContainer") {
			if (vForAttribute.value.expression.type === "BinaryExpression" && vForAttribute.value.expression.left.type === "SequenceExpression" && vForAttribute.value.expression.left.expressions[1].type === "Identifier") vForIndex = vForAttribute.value.expression.left.expressions[1].name;
			cache += `[${index}]`;
			s.appendRight(0, `${cache} = [];`);
			index += ` + ${vForIndex} + 1`;
		}
		s.prependLeft(node.end, `, ${cache}, ${index})${hasScope ? "}" : ""}`);
		s.remove(attribute.start - 1, attribute.end);
	});
}

//#endregion
//#region src/core/v-model.ts
const dynamicModelRE = /^\$(.*)\$(?:_(.*))?/;
function transformVModel(attribute, s) {
	if (attribute.name.type === "JSXNamespacedName" && attribute.value?.type === "JSXExpressionContainer") {
		const matched = attribute.name.name.name.match(dynamicModelRE);
		if (!matched) return;
		let [, argument, modifiers] = matched;
		argument = argument.replaceAll("_", ".");
		modifiers = modifiers ? `, [${argument} + "Modifiers"]: { ${modifiers.split("_").map((key) => `${key}: true`).join(", ")} }` : "";
		s.replaceRange(attribute.start, attribute.end, `{...{[${argument}]: `, attribute.value.expression, `, ["onUpdate:" + ${argument}]: $event => `, s.sliceNode(attribute.value.expression), ` = $event${modifiers}}}`);
	}
}

//#endregion
//#region src/core/v-on.ts
function transformVOn(nodes, s) {
	if (nodes.length > 0) s.prependRight(0, `const ${HELPER_PREFIX}transformVOn = (obj) => Object.entries(obj).reduce((res, [key, value]) => (res['on' + key[0].toUpperCase() + key.slice(1)] = value, res), {});`);
	nodes.forEach(({ attribute }) => {
		if (attribute.value?.type === "JSXExpressionContainer") s.replaceRange(attribute.start, attribute.end, `{...${HELPER_PREFIX}transformVOn(`, attribute.value.expression, `)}`);
	});
}
function transformOnWithModifiers(nodes, s, { lib }) {
	nodes.forEach(({ attribute }) => {
		let [name, ...modifiers] = attribute.name.name.toString().split("_");
		const withModifiersOrKeys = importHelperFn(s, 0, isKeyboardEvent(name) ? "withKeys" : "withModifiers", void 0, lib.startsWith("vue") ? "vue" : "@vue-macros/jsx-directive/helpers");
		modifiers = modifiers.filter((modifier) => {
			if (modifier === "capture") {
				s.appendRight(attribute.name.end, modifier[0].toUpperCase() + modifier.slice(1));
				return false;
			} else return true;
		});
		const result = `, [${modifiers.map((modifier) => `'${modifier}'`)}])`;
		if (attribute.value?.type === "JSXExpressionContainer") {
			s.appendRight(attribute.value.expression.start, `${withModifiersOrKeys}(`);
			s.appendLeft(attribute.value.expression.end, result);
		} else s.appendRight(attribute.name.end, `={${withModifiersOrKeys}(() => {}${result}}`);
		s.replaceRange(attribute.name.start + name.length, attribute.name.end);
	});
}
function isKeyboardEvent(value) {
	return [
		"onKeyup",
		"onKeydown",
		"onKeypress"
	].includes(value);
}

//#endregion
//#region src/core/v-slot.ts
function isSlotTemplate(child, { prefix }) {
	return child.type === "JSXElement" && child.openingElement.name.type === "JSXIdentifier" && child.openingElement.name.name === "template" && child.openingElement.attributes.some((attribute) => attribute.type === "JSXAttribute" && (attribute.name.type === "JSXNamespacedName" ? attribute.name.namespace : attribute.name).name === `${prefix}slot`);
}
function transformVSlot(nodeMap, s, options) {
	const { prefix, lib } = options;
	Array.from(nodeMap).forEach(([node, { attributeMap, vSlotAttribute }]) => {
		const result = [` v-slots={{`];
		const attributes = Array.from(attributeMap);
		let isStable = lib === "vue";
		const removeNodes = [];
		attributes.forEach(([attribute, { children, vIfAttribute, vForAttribute }], index) => {
			if (!attribute) return;
			if (vIfAttribute) {
				isStable = false;
				if (`${prefix}if` === vIfAttribute.name.name) result.push("...");
				if ([`${prefix}if`, `${prefix}else-if`].includes(String(vIfAttribute.name.name)) && vIfAttribute.value?.type === "JSXExpressionContainer") result.push("(", vIfAttribute.value.expression, ") ? {");
				else if (`${prefix}else` === vIfAttribute.name.name) result.push("{");
			}
			if (vForAttribute) {
				isStable = false;
				result.push("...Object.fromEntries(", ...resolveVFor(vForAttribute, s, {
					...options,
					lib: "vue"
				}), "([");
			}
			let isDynamic = false;
			let attributeName = attribute.name.type === "JSXNamespacedName" ? attribute.name.name.name : "default";
			attributeName = attributeName.replace(/\$(.*)\$/, (_, $1) => {
				isDynamic = true;
				isStable = false;
				return $1.replaceAll("_", ".");
			});
			result.push(isDynamic ? `[${attributeName}]` : `'${attributeName}'`, vForAttribute ? ", " : ": ", "(", attribute.value && attribute.value.type === "JSXExpressionContainer" ? attribute.value.expression : "", ") => ", "<>", ...children.flatMap((child) => {
				removeNodes.push(child);
				return isSlotTemplate(child, options) ? child.children : child;
			}) || [], "</>,");
			if (vForAttribute) result.push("]))),");
			if (vIfAttribute) {
				if ([`${prefix}if`, `${prefix}else-if`].includes(String(vIfAttribute.name.name))) {
					const nextIndex = index + (attributes[index + 1]?.[0] ? 1 : 2);
					result.push("}", String(attributes[nextIndex]?.[1].vIfAttribute?.name.name).startsWith(`${prefix}else`) ? " : " : " : null,");
				} else if (`${prefix}else` === vIfAttribute.name.name) result.push("},");
			}
		});
		if (isStable) result.push("$stable: true,");
		if (attributeMap.has(null)) result.push(`default: () => <>`);
		else result.push("}}");
		if (vSlotAttribute) s.replaceRange(vSlotAttribute.start, vSlotAttribute.end, ...result);
		else if (node?.type === "JSXElement") {
			s.replaceRange(node.openingElement.end - 1, node.openingElement.end, ...result);
			s.appendLeft(node.closingElement.start, attributeMap.has(null) ? `</>}}>` : ">");
		}
		removeNodes.forEach((node$1) => s.replaceRange(node$1.start, node$1.end));
	});
}

//#endregion
//#region src/core/index.ts
const onWithModifiersRegex = /^on[A-Z]\S*_\S+/;
function transformJsxDirective(code, id, options) {
	const lang = getLang(id);
	const programs = [];
	if (lang === "vue" || REGEX_SETUP_SFC.test(id)) {
		const { scriptSetup, getSetupAst, script, getScriptAst } = parseSFC(code, id);
		if (script) programs.push([getScriptAst(), script.loc.start.offset]);
		if (scriptSetup) programs.push([getSetupAst(), scriptSetup.loc.start.offset]);
	} else if (["jsx", "tsx"].includes(lang)) programs.push([babelParse(code, lang), 0]);
	else return;
	const s = new MagicStringAST(code);
	for (const [ast, offset] of programs) {
		s.offset = offset;
		transform(s, ast, options);
	}
	return generateTransform(s, id);
}
function transform(s, program, options) {
	const { prefix, version } = options;
	const vIfMap = /* @__PURE__ */ new Map();
	const vForNodes = [];
	const vMemoNodes = [];
	const vHtmlNodes = [];
	const vSlotMap = /* @__PURE__ */ new Map();
	const vOnNodes = [];
	const onWithModifiers = [];
	walkAST(program, { enter(node, parent) {
		if (node.type !== "JSXElement") return;
		const tagName = s.sliceNode(node.openingElement.name);
		let vIfAttribute;
		let vForAttribute;
		let vMemoAttribute;
		let vSlotAttribute;
		for (const attribute of node.openingElement.attributes) {
			if (attribute.type !== "JSXAttribute") continue;
			if ([
				`${prefix}if`,
				`${prefix}else-if`,
				`${prefix}else`
			].includes(String(attribute.name.name))) vIfAttribute = attribute;
			else if (attribute.name.name === `${prefix}for`) vForAttribute = attribute;
			else if ([`${prefix}memo`, `${prefix}once`].includes(String(attribute.name.name))) vMemoAttribute = attribute;
			else if (attribute.name.name === `${prefix}html`) vHtmlNodes.push({
				node,
				attribute
			});
			else if ((attribute.name.type === "JSXNamespacedName" ? attribute.name.namespace : attribute.name).name === `${prefix}slot`) vSlotAttribute = attribute;
			else if (attribute.name.name === `${prefix}on`) vOnNodes.push({
				node,
				attribute
			});
			else if (onWithModifiersRegex.test(String(attribute.name.name))) onWithModifiers.push({
				node,
				attribute
			});
			else if (attribute.name.type === "JSXNamespacedName" && attribute.name.namespace.name === `${prefix}model`) transformVModel(attribute, s);
		}
		if (!vSlotAttribute || tagName !== "template") {
			if (vIfAttribute) {
				vIfMap.get(parent) || vIfMap.set(parent, []);
				vIfMap.get(parent).push({
					node,
					attribute: vIfAttribute,
					parent
				});
			}
			if (vForAttribute) vForNodes.unshift({
				node,
				attribute: vForAttribute,
				vIfAttribute,
				parent,
				vMemoAttribute
			});
		}
		if (vMemoAttribute) vMemoNodes.push({
			node,
			attribute: vMemoAttribute,
			parent: vForAttribute || vIfAttribute ? void 0 : parent,
			vForAttribute
		});
		if (vSlotAttribute) {
			const slotNode = tagName === "template" ? parent : node;
			if (slotNode?.type !== "JSXElement") return;
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
			if (slotNode === parent) {
				children.push(node);
				if (attributeMap.get(null)) return;
				for (const child of parent.children) {
					if (isSlotTemplate(child, options) || child.type === "JSXText" && !s.sliceNode(child).trim()) continue;
					(attributeMap.get(null)?.children || attributeMap.set(null, { children: [] }).get(null).children).push(child);
				}
			} else children.push(...node.children);
		}
	} });
	transformVSlot(vSlotMap, s, options);
	vIfMap.forEach((nodes) => transformVIf(nodes, s, options));
	transformVFor(vForNodes, s, options);
	if (!version || version >= 3.2) transformVMemo(vMemoNodes, s, options);
	transformVHtml(vHtmlNodes, s);
	transformVOn(vOnNodes, s);
	transformOnWithModifiers(onWithModifiers, s, options);
}

//#endregion
export { transformJsxDirective };