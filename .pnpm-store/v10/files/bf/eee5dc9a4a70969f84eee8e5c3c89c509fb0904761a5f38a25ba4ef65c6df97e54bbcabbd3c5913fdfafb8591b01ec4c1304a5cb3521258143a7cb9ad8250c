import { REGEX_DEFINE_COMPONENT } from "./common-BTTMZY21.js";
import { DEFINE_OPTIONS, createFilter } from "@vue-macros/common";
import { replaceAll } from "muggle-string";
import { allCodeFeatures } from "@vue/language-core";

//#region src/define-options.ts
function transformDefineOptions({ codes, sfc, arg }) {
	const seg = [
		sfc.scriptSetup.content.slice(arg.pos, arg.end),
		"scriptSetup",
		arg.pos,
		allCodeFeatures
	];
	replaceAll(codes, REGEX_DEFINE_COMPONENT, "...", seg, ",\n");
}
function getArg(ts, sfc) {
	function getCallArg(node) {
		if (!ts.isCallExpression(node) || !ts.isIdentifier(node.expression) || node.expression.escapedText !== DEFINE_OPTIONS) return;
		return node.arguments[0];
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
	return {
		name: "vue-macros-define-options",
		version: 2.1,
		resolveEmbeddedCode(fileName, sfc, embeddedFile) {
			if (!filter(fileName) || !sfc.scriptSetup?.ast) return;
			const arg = getArg(ctx.modules.typescript, sfc);
			if (!arg) return;
			transformDefineOptions({
				codes: embeddedFile.content,
				sfc,
				arg
			});
		}
	};
};
var define_options_default = plugin;

//#endregion
export { define_options_default, plugin };