import { addProps } from "./common-BTTMZY21.js";
import { getStart } from "ts-macro";
import { createFilter } from "@vue-macros/common";
import { replaceSourceRange } from "muggle-string";

//#region src/export-props.ts
function transform(options) {
	const { codes, sfc, ts, version } = options;
	const ast = sfc.scriptSetup.ast;
	const props = Object.create(null);
	let changed = false;
	for (const stmt of sfc.scriptSetup.ast.statements) {
		if (!ts.isVariableStatement(stmt)) continue;
		const exportModifier = stmt.modifiers?.find((m) => m.kind === ts.SyntaxKind.ExportKeyword);
		if (!exportModifier) continue;
		replaceSourceRange(codes, "scriptSetup", getStart(exportModifier, ast, ts), exportModifier.end);
		changed = true;
		for (const decl of stmt.declarationList.declarations) {
			if (!ts.isIdentifier(decl.name)) continue;
			props[decl.name.escapedText] = !!decl.initializer;
		}
	}
	if (changed) addProps(codes, Object.entries(props).map(([prop, optional]) => `${prop}${optional ? "?" : ""}: typeof ${prop}`), version);
}
const plugin = (ctx, options = {}) => {
	if (!options) return [];
	const filter = createFilter(options);
	const { vueCompilerOptions: { target } } = ctx;
	return {
		name: "vue-macros-export-props",
		version: 2.1,
		resolveEmbeddedCode(fileName, sfc, embeddedFile) {
			if (!filter(fileName) || !sfc.scriptSetup?.ast) return;
			transform({
				codes: embeddedFile.content,
				sfc,
				version: target,
				ts: ctx.modules.typescript
			});
		}
	};
};
var export_props_default = plugin;

//#endregion
export { export_props_default, plugin };