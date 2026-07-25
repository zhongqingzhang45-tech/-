import { DEFINE_STYLEX, MagicStringAST, VIRTUAL_ID_PREFIX, addNormalScript, generateTransform, importHelperFn, isCallOf, parseSFC, walkAST } from "@vue-macros/common";
import { createTransformContext, traverseNode } from "@vue/compiler-dom";

//#region src/core/helper/stylex-attrs.ts?raw
var stylex_attrs_default = "export default({className,\"data-style-src\":dataStyleSrc,style})=>{const result={};if(className!=null&&className!==\"\"){result.class=className}if(style!=null&&Object.keys(style).length>0){result.style=Object.keys(style).map(key=>`${key}:${style[key]};`).join(\"\")}if(dataStyleSrc!=null&&dataStyleSrc!==\"\"){result[\"data-style-src\"]=dataStyleSrc}return result};\n";

//#endregion
//#region src/core/helper/index.ts
const helperPrefix = `${VIRTUAL_ID_PREFIX}/define-stylex`;
const styleXAttrsId = `${helperPrefix}/stylex-attrs`;

//#endregion
//#region src/core/index.ts
const STYLEX_CREATE = "_stylex_create";
const STYLEX_PROPS = "_stylex_props";
const STYLEX_ATTRS = "_stylex_attrs";
const callStyleXAttrs = (s, setupOffset) => importHelperFn(s, setupOffset, "default", STYLEX_ATTRS, styleXAttrsId);
function transformDirective(s, setupOffset) {
	return (node) => {
		if (!(node.type === 1)) return;
		const i = node.props.findIndex((item) => item.type === 7 && item.rawName === "v-stylex");
		if (i === -1) return;
		const directiveVStyleX = node.props[i];
		if (directiveVStyleX.exp?.type !== 4) throw new Error("`v-stylex` must be passed a expression");
		const hasColon = directiveVStyleX.exp.content.startsWith("(") && directiveVStyleX.exp.content.endsWith(")");
		const prefix = hasColon ? "" : "(";
		const postfix = hasColon ? "" : ")";
		if (directiveVStyleX.exp.content.includes(STYLEX_PROPS)) {
			s?.overwrite(directiveVStyleX.loc.start.offset, directiveVStyleX.loc.end.offset, `v-bind="${callStyleXAttrs(s, setupOffset)}(${directiveVStyleX.exp.content})"`);
			return;
		}
		s?.overwrite(directiveVStyleX.loc.start.offset, directiveVStyleX.loc.end.offset, `v-bind="${callStyleXAttrs(s, setupOffset)}(${STYLEX_PROPS}${prefix}${directiveVStyleX.exp.content}${postfix})"`);
	};
}
function transformDefineStyleX(code, id) {
	if (!code.includes(DEFINE_STYLEX)) return;
	const sfc = parseSFC(code, id);
	const { scriptSetup, getSetupAst, template } = sfc;
	if (!scriptSetup || !template) return;
	const setupOffset = scriptSetup.loc.start.offset;
	const s = new MagicStringAST(code);
	const normalScript = addNormalScript(sfc, s);
	const scriptOffset = normalScript.start();
	const setupAST = getSetupAst();
	walkAST(setupAST, { enter(node) {
		if (node.type !== "VariableDeclaration") return;
		if (!node.declarations.some((decl) => isCallOf(decl.init, DEFINE_STYLEX))) return;
		node.declarations.forEach((decl) => {
			const isDefineStyleX = isCallOf(decl.init, DEFINE_STYLEX);
			if (isDefineStyleX) s.overwriteNode(decl.init.callee, STYLEX_CREATE, { offset: setupOffset });
			const text = `\n${node.kind} ${s.sliceNode(decl, { offset: setupOffset })}`;
			s.appendRight(isDefineStyleX ? scriptOffset : node.start + setupOffset - 1, text);
		});
		s.removeNode(node, { offset: setupOffset });
	} });
	if (scriptOffset !== void 0) normalScript.end();
	const ctx = createTransformContext(template.ast, { nodeTransforms: [transformDirective(s, setupOffset)] });
	traverseNode(template.ast, ctx);
	s.appendLeft(setupOffset, `\nimport { create as ${STYLEX_CREATE}, props as ${STYLEX_PROPS} } from '@stylexjs/stylex'`);
	return generateTransform(s, id);
}

//#endregion
export { helperPrefix, styleXAttrsId, stylex_attrs_default, transformDefineStyleX };