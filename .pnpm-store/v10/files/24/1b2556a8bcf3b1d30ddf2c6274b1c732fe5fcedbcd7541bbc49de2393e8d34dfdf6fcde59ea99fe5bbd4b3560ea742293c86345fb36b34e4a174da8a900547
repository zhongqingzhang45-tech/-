import { getStart } from "ts-macro";
import { createFilter } from "@vue-macros/common";
import { replaceSourceRange } from "muggle-string";

//#region src/export-render.ts
function transform(options) {
	const { codes, sfc, ts } = options;
	const ast = sfc.scriptSetup.ast;
	for (const stmt of sfc.scriptSetup.ast.statements) {
		if (!ts.isExportAssignment(stmt)) continue;
		replaceSourceRange(codes, "scriptSetup", getStart(stmt, ast, ts), getStart(stmt.expression, ast, ts), "defineRender(");
		replaceSourceRange(codes, "scriptSetup", stmt.expression.end, stmt.expression.end, ")");
	}
}
const plugin = (ctx, options = {}) => {
	if (!options) return [];
	const filter = createFilter(options);
	return {
		name: "vue-macros-export-render",
		version: 2.1,
		resolveEmbeddedCode(fileName, sfc, embeddedFile) {
			if (!filter(fileName) || !sfc.scriptSetup?.ast) return;
			transform({
				codes: embeddedFile.content,
				sfc,
				ts: ctx.modules.typescript
			});
		}
	};
};
var export_render_default = plugin;

//#endregion
export { export_render_default, plugin };