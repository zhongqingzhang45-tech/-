import { createPlugin } from "ts-macro";
import { createFilter } from "@vue-macros/common";

//#region src/jsx-ref.ts
function transformRef({ nodes, codes, ts }) {
	for (const { name, initializer } of nodes) if (ts.isCallExpression(initializer)) codes.replaceRange(initializer.expression.end, initializer.expression.end, `<Parameters<typeof __VLS_ctx_${name.text}['expose']>[0] | null>`);
}
function getRefNodes(ts, sourceFile, alias) {
	function isRefCall(node) {
		return ts.isCallExpression(node) && ts.isIdentifier(node.expression) && !node.typeArguments?.length && alias.includes(node.expression.text);
	}
	const result = [];
	function walk(node) {
		if (ts.isVariableStatement(node)) ts.forEachChild(node.declarationList, (decl) => {
			if (ts.isVariableDeclaration(decl) && ts.isIdentifier(decl.name) && decl.initializer && ts.isCallExpression(decl.initializer) && ts.isIdentifier(decl.initializer.expression)) {
				const initializer = decl.initializer.expression.text === "$" ? decl.initializer.arguments[0] : decl.initializer;
				if (isRefCall(initializer)) result.push({
					name: decl.name,
					initializer
				});
			}
		});
		ts.forEachChild(node, walk);
	}
	ts.forEachChild(sourceFile, walk);
	return result;
}
const plugin = createPlugin(({ ts, vueCompilerOptions }, options = vueCompilerOptions?.vueMacros?.jsxRef === true ? {} : vueCompilerOptions?.vueMacros?.jsxRef ?? {}) => {
	if (!options) return [];
	const filter = createFilter(options);
	const alias = options.alias || ["useRef"];
	return {
		name: "vue-macros-jsx-ref",
		resolveVirtualCode({ filePath, ast, codes, source, lang }) {
			if (!filter(filePath) || !["jsx", "tsx"].includes(lang)) return;
			const nodes = getRefNodes(ts, ast, alias);
			if (nodes.length) transformRef({
				nodes,
				codes,
				ts,
				source
			});
		}
	};
});
var jsx_ref_default = plugin;

//#endregion
export { jsx_ref_default, plugin };