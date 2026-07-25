import { DEFINE_EMITS, MagicStringAST, generateTransform, isCallOf, isTs, isTypeOf, parseSFC, resolveObjectKey, walkAST } from "@vue-macros/common";

//#region src/core/index.ts
function transformShortEmits(code, id) {
	const { scriptSetup, lang, getSetupAst } = parseSFC(code, id);
	if (!scriptSetup || !isTs(lang)) return;
	const offset = scriptSetup.loc.start.offset;
	const ast = getSetupAst();
	const params = [];
	const s = new MagicStringAST(code);
	walkAST(ast, { enter(node) {
		if (isCallOf(node, DEFINE_EMITS) && node.typeParameters?.params?.[0]) {
			let param = node.typeParameters?.params?.[0];
			if (param.type === "TSTypeReference" && param.typeName.type === "Identifier" && ["SE", "ShortEmits"].includes(param.typeName.name) && param.typeParameters?.params[0]) {
				const inner = param.typeParameters?.params[0];
				s.remove(offset + param.start, offset + inner.start);
				s.remove(offset + inner.end, offset + param.end);
				param = inner;
			}
			params.push(param);
		}
	} });
	for (const param of params) {
		if (param.type !== "TSTypeLiteral") continue;
		for (const member of param.members) {
			if (!isTypeOf(member, ["TSPropertySignature", "TSMethodSignature"])) continue;
			const key = resolveObjectKey(member, true);
			let params$1 = "";
			switch (member.type) {
				case "TSPropertySignature":
					if (!member.typeAnnotation || !isTypeOf(member.typeAnnotation.typeAnnotation, ["TSTupleType", "TSFunctionType"])) continue;
					switch (member.typeAnnotation.typeAnnotation.type) {
						case "TSTupleType":
							params$1 = `...args: ${s.sliceNode(member.typeAnnotation.typeAnnotation, { offset })}`;
							break;
						case "TSFunctionType":
							params$1 = stringifyParams(member.typeAnnotation.typeAnnotation.parameters);
							break;
					}
					break;
				case "TSMethodSignature":
					params$1 = stringifyParams(member.parameters);
					break;
			}
			s.overwriteNode(member, `(evt: ${key}${params$1 ? `, ${params$1}` : ""}): void`, { offset });
		}
	}
	return generateTransform(s, id);
	function stringifyParams(params$1) {
		return params$1.length > 0 ? s.sliceNode(params$1, { offset }) : "";
	}
}

//#endregion
export { transformShortEmits };