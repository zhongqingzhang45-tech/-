import { addEmits } from "./common-BTTMZY21.js";
import { getText } from "ts-macro";
import { DEFINE_EMIT, createFilter } from "@vue-macros/common";

//#region src/define-emit.ts
function getEmitStrings(options) {
	const { ts, sfc } = options;
	const ast = sfc.scriptSetup.ast;
	const emitStrings = [];
	function walkNode(node, defaultName = "") {
		if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && DEFINE_EMIT === node.expression.escapedText) {
			const name = node.arguments.length && ts.isStringLiteral(node.arguments[0]) ? node.arguments[0].text : defaultName;
			if (!name) return;
			const type = node.typeArguments?.length === 1 ? ts.isFunctionTypeNode(node.typeArguments[0]) ? `Parameters<${getText(node.typeArguments[0], ast, ts)}>` : getText(node.typeArguments[0], ast, ts) : "[]";
			emitStrings.push(`'${name}': ${type}`);
		}
	}
	ts.forEachChild(ast, (node) => {
		if (ts.isExpressionStatement(node)) walkNode(node.expression);
		else if (ts.isVariableStatement(node)) ts.forEachChild(node.declarationList, (decl) => {
			if (ts.isVariableDeclaration(decl) && decl.initializer && ts.isIdentifier(decl.name)) walkNode(decl.initializer, getText(decl.name, ast, ts));
		});
	});
	return emitStrings;
}
const plugin = (ctx, options = {}) => {
	if (!options) return [];
	const filter = createFilter(options);
	const { vueCompilerOptions: { target } } = ctx;
	return {
		name: "vue-macros-define-emit",
		version: 2.1,
		resolveEmbeddedCode(fileName, sfc, embeddedFile) {
			if (!filter(fileName) || !["ts", "tsx"].includes(embeddedFile.lang) || !sfc.scriptSetup?.ast) return;
			const emitStrings = getEmitStrings({
				ts: ctx.modules.typescript,
				sfc
			});
			if (!emitStrings.length) return;
			addEmits(embeddedFile.content, emitStrings, target);
		}
	};
};
var define_emit_default = plugin;

//#endregion
export { define_emit_default, plugin };