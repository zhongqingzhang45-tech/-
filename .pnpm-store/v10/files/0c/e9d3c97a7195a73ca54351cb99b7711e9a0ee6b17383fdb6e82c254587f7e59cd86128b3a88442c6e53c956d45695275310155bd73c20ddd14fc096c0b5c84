import { MagicStringAST, addNormalScript, generateTransform, isStaticExpression, parseSFC } from "@vue-macros/common";

//#region src/core/index.ts
const MAGIC_COMMENT = "hoist-static";
function transformHoistStatic(code, id) {
	function moveToScript(decl, prefix = "") {
		if (scriptOffset === void 0) scriptOffset = normalScript.start();
		const text = `\n${prefix}${s.sliceNode(decl, { offset: setupOffset })}`;
		s.appendRight(scriptOffset, text);
		s.removeNode(decl, { offset: setupOffset });
	}
	const sfc = parseSFC(code, id);
	const { scriptSetup, getSetupAst } = sfc;
	if (!scriptSetup) return;
	const setupOffset = scriptSetup.loc.start.offset;
	const setupOffsetEnd = scriptSetup.loc.end.offset;
	const s = new MagicStringAST(code);
	const program = getSetupAst();
	let normalScript = addNormalScript(sfc, s);
	let scriptOffset;
	for (const stmt of program.body) if (stmt.type === "VariableDeclaration" && stmt.kind === "const") {
		const decls = stmt.declarations;
		let count = 0;
		for (const [i, decl] of decls.entries()) {
			if (!decl.init || !isStaticExpression(decl.init, {
				unary: true,
				magicComment: MAGIC_COMMENT
			})) continue;
			count++;
			moveToScript(decl, "const ");
			if (decls.length > 1) {
				const isLast = i === decls.length - 1;
				const start = isLast ? decls[i - 1].end : decl.end;
				const end = isLast ? decl.start : decls[i + 1].start;
				s.remove(setupOffset + start, setupOffset + end);
			}
		}
		if (count === decls.length) s.removeNode(stmt, { offset: setupOffset });
	} else if (stmt.type === "TSEnumDeclaration") {
		if (!stmt.members.every((member) => !member.initializer || isStaticExpression(member.initializer, {
			unary: true,
			magicComment: MAGIC_COMMENT
		}))) continue;
		moveToScript(stmt);
	}
	if (s.slice(setupOffset, setupOffsetEnd).trim().length === 0) s.appendLeft(setupOffsetEnd, "/* hoist static placeholder */");
	if (scriptOffset !== void 0) normalScript.end();
	return generateTransform(s, id);
}

//#endregion
export { transformHoistStatic };