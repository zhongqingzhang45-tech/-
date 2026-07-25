import { DEFINE_RENDER, MagicStringAST, babelParse, generateTransform, getLang, isCallOf, isFunctionType, walkAST } from "@vue-macros/common";

//#region src/core/index.ts
function transformDefineRender(code, id, options) {
	if (!code.includes(DEFINE_RENDER)) return;
	const lang = getLang(id);
	const vapor = options?.vapor || new URLSearchParams(id).get("vapor");
	const program = babelParse(code, lang === "vue" ? "js" : lang);
	const nodes = [];
	walkAST(program, { enter(node, parent) {
		if (node.type !== "ExpressionStatement" || !isCallOf(node.expression, DEFINE_RENDER) || parent?.type !== "BlockStatement") return;
		nodes.push({
			parent,
			node,
			arg: node.expression.arguments[0]
		});
	} });
	if (nodes.length === 0) return;
	const s = new MagicStringAST(code);
	for (const { parent, node, arg } of nodes) {
		const returnStmt = parent.body.find((node$1) => node$1.type === "ReturnStatement");
		if (returnStmt) s.removeNode(returnStmt);
		const index = returnStmt ? returnStmt.start : parent.end - 1;
		const shouldAddFn = !vapor && !isFunctionType(arg) && arg.type !== "Identifier";
		s.appendLeft(index, `return ${shouldAddFn ? "() => (" : ""}`);
		s.moveNode(arg, index);
		if (shouldAddFn) s.appendRight(index, `)`);
		s.remove(node.start, arg.start);
		s.remove(arg.end, node.end);
	}
	return generateTransform(s, id);
}

//#endregion
export { transformDefineRender };