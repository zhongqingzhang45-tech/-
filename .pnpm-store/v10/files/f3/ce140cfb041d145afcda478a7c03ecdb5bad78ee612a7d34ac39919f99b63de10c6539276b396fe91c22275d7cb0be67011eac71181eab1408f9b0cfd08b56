import { DEFINE_PROPS, DEFINE_PROPS_DOLLAR, MagicStringAST, generateTransform, isCallOf, parseSFC, walkAST } from "@vue-macros/common";

//#region src/core/index.ts
function transformDefineProps(code, id) {
	if (!code.includes(DEFINE_PROPS_DOLLAR)) return;
	const { scriptSetup, getSetupAst } = parseSFC(code, id);
	if (!scriptSetup) return;
	const offset = scriptSetup.loc.start.offset;
	const s = new MagicStringAST(code);
	const setupAst = getSetupAst();
	walkAST(setupAst, { enter(node) {
		if (isCallOf(node, DEFINE_PROPS_DOLLAR)) s.overwriteNode(node.callee, ` ${DEFINE_PROPS}`, { offset });
	} });
	return generateTransform(s, id);
}

//#endregion
export { transformDefineProps };