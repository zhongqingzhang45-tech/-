import { addEmits, addProps } from "./common-BTTMZY21.js";
import { getText } from "ts-macro";
import { DEFINE_MODELS, DEFINE_MODELS_DOLLAR, createFilter } from "@vue-macros/common";

//#region src/define-models.ts
function transformDefineModels(options) {
	const { codes, typeArg, version, ts, sfc } = options;
	const ast = sfc.scriptSetup.ast;
	const propStrings = [];
	const emitStrings = [];
	if (ts.isTypeLiteralNode(typeArg) && typeArg.members) {
		for (const member of typeArg.members) if (ts.isPropertySignature(member) && member.type) {
			const type = getText(member.type, ast, ts);
			const name = getText(member.name, ast, ts);
			emitStrings.push(`'update:${name}': [${name}: ${type}]`);
			propStrings.push(`${name}${member.questionToken ? "?" : ""}: ${type}`);
		}
	}
	addProps(codes, propStrings, version);
	addEmits(codes, emitStrings, version);
}
function getTypeArg(ts, sfc) {
	function getCallArg(node) {
		if (!ts.isCallExpression(node) || !ts.isIdentifier(node.expression) || ![DEFINE_MODELS, DEFINE_MODELS_DOLLAR].includes(node.expression.escapedText) || node.typeArguments?.length !== 1) return;
		return node.typeArguments[0];
	}
	const sourceFile = sfc.scriptSetup.ast;
	return ts.forEachChild(sourceFile, (node) => {
		if (ts.isExpressionStatement(node)) return getCallArg(node.expression);
		else if (ts.isVariableStatement(node)) return ts.forEachChild(node.declarationList, (decl) => {
			if (!ts.isVariableDeclaration(decl) || !decl.initializer) return;
			return getCallArg(decl.initializer);
		});
	});
}
const plugin = (ctx, options = {}) => {
	if (!options) return [];
	const filter = createFilter(options);
	const { modules: { typescript: ts }, vueCompilerOptions: { target } } = ctx;
	return {
		name: "vue-macros-define-models",
		version: 2.1,
		resolveEmbeddedCode(fileName, sfc, embeddedFile) {
			if (!filter(fileName) || !["ts", "tsx"].includes(embeddedFile.lang) || !sfc.scriptSetup?.ast) return;
			const typeArg = getTypeArg(ts, sfc);
			if (!typeArg) return;
			transformDefineModels({
				codes: embeddedFile.content,
				sfc,
				typeArg,
				version: target,
				ts
			});
		}
	};
};
var define_models_default = plugin;

//#endregion
export { define_models_default, plugin };