import { addCode } from "./common-BTTMZY21.js";
import { getStart, getText } from "ts-macro";
import { createFilter } from "@vue-macros/common";
import { replace as replace$1, replaceSourceRange } from "muggle-string";
import { allCodeFeatures as allCodeFeatures$1 } from "@vue/language-core";

//#region src/export-expose.ts
function transform(options) {
	const { codes, sfc, ts } = options;
	const ast = sfc.scriptSetup.ast;
	const exposed = Object.create(null);
	for (const stmt of sfc.scriptSetup.ast.statements) if (ts.isExportDeclaration(stmt) && stmt.exportClause) {
		const start = getStart(stmt, ast, ts);
		const end = stmt.end;
		if (ts.isNamedExports(stmt.exportClause)) {
			const exportMap = /* @__PURE__ */ new Map();
			stmt.exportClause.elements.forEach((element) => {
				if (element.isTypeOnly) return;
				const name = element.name;
				const propertyName = element.propertyName || name;
				exportMap.set([
					getText(propertyName, ast, ts),
					"scriptSetup",
					getStart(propertyName, ast, ts),
					allCodeFeatures$1
				], [
					getText(name, ast, ts),
					"scriptSetup",
					getStart(name, ast, ts),
					allCodeFeatures$1
				]);
				exposed[getText(name, ast, ts)] = getText(propertyName, ast, ts);
			});
			if (stmt.moduleSpecifier) {
				replaceSourceRange(codes, "scriptSetup", start, start + 6, "import");
				replaceSourceRange(codes, "scriptSetup", end, end, `;[${Array.from(exportMap.values()).map(([name]) => name)}];`);
			} else replaceSourceRange(codes, "scriptSetup", start, end, `;(({`, ...Array.from(exportMap.entries()).flatMap(([name, value]) => name[0] === value[0] ? [value, ","] : [
				name,
				":",
				value,
				","
			]), `})=>{${Array.from(exportMap.values()).map(([name]) => name)}`, `})({${Array.from(exportMap.keys()).map(([name]) => name)}})`);
		} else if (ts.isNamespaceExport(stmt.exportClause)) {
			replaceSourceRange(codes, "scriptSetup", start, start + 6, "import");
			replaceSourceRange(codes, "scriptSetup", end, end, `;[${getText(stmt.exportClause.name, ast, ts)}];`);
		}
	} else if (ts.isVariableStatement(stmt) || ts.isFunctionDeclaration(stmt) || ts.isClassDeclaration(stmt)) {
		const exportModifier = stmt.modifiers?.find((m) => m.kind === ts.SyntaxKind.ExportKeyword);
		if (!exportModifier) continue;
		const exposedValues = [];
		if (ts.isVariableStatement(stmt)) for (const decl of stmt.declarationList.declarations) {
			if (!decl.name) continue;
			if (ts.isIdentifier(decl.name)) {
				const name = getText(decl.name, ast, ts);
				exposed[name] = name;
			} else if (ts.isObjectBindingPattern(decl.name)) decl.name.elements.forEach((element) => {
				if (!ts.isIdentifier(element.name)) return;
				exposedValues.push(getText(element.name, ast, ts));
				exposed[getText(element.name, ast, ts)] = element.propertyName && ts.isIdentifier(element.propertyName) ? getText(element.propertyName, ast, ts) : getText(element.name, ast, ts);
			});
		}
		else if (stmt.name && ts.isIdentifier(stmt.name)) {
			const name = getText(stmt.name, ast, ts);
			exposed[name] = name;
		}
		replaceSourceRange(codes, "scriptSetup", getStart(exportModifier, ast, ts), exportModifier.end, exposedValues.length > 0 ? `[${exposedValues}];` : "");
	}
	if (Object.keys(exposed).length === 0) return;
	const exposedStrings = Object.entries(exposed).flatMap(([key, value]) => [
		`${key}: `,
		value,
		",\n"
	]);
	if (sfc.scriptSetup?.generic) {
		addCode(codes, `const __VLS_exportExposed = {\n`, ...exposedStrings, `};\n`);
		replace$1(codes, /(?<=expose\(exposed: import\(\S+\)\.ShallowUnwrapRef<)/, "typeof __VLS_exportExposed & ");
	} else replace$1(codes, /(?<=export\sdefault \(await import\(\S+\)\)\.defineComponent\(\{[\s\S])/, `setup: () => ({\n`, ...exposedStrings, `})\n`);
}
const plugin = (ctx, options = {}) => {
	if (!options) return [];
	const filter = createFilter(options);
	return {
		name: "vue-macros-export-expose",
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
var export_expose_default = plugin;

//#endregion
export { export_expose_default, plugin };