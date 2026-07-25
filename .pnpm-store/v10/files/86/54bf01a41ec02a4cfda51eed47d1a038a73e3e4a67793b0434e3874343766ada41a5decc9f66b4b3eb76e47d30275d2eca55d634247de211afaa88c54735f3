import { DEFINE_SLOTS, MagicStringAST, generateTransform, isCallOf, parseSFC } from "@vue-macros/common";

//#region src/core/index.ts
function transformDefineSlots(code, id) {
	if (!code.includes(DEFINE_SLOTS)) return;
	const { scriptSetup, getSetupAst } = parseSFC(code, id);
	if (!scriptSetup) return;
	const s = new MagicStringAST(code);
	for (const stmt of getSetupAst().body) if (stmt.type === "ExpressionStatement" && isCallOf(stmt.expression, DEFINE_SLOTS)) s.overwriteNode(stmt, "/*defineSlots*/", { offset: scriptSetup.loc.start.offset });
	return generateTransform(s, id);
}

//#endregion
export { transformDefineSlots };