import { createFilter } from "@vue-macros/common";
import { replace } from "muggle-string";

//#region src/setup-jsdoc.ts
/**
* Copy from https://github.com/microsoft/TypeScript/blob/5a97ce8281e2b4dce298c280b0e67ce049681d01/src/compiler/utilitiesPublic.ts#L2515
*
* GH#19856 Would like to return `node is Node & { jsDoc: JSDoc[] }` but it causes long compile times
*/
function hasJSDocNodes(node) {
	if (!node) return false;
	const { jsDoc } = node;
	return !!jsDoc && jsDoc.length > 0;
}
function transform({ codes, sfc, ts }) {
	let jsDoc;
	if (hasJSDocNodes(sfc.scriptSetup.ast.statements[0])) jsDoc = sfc.scriptSetup.ast.statements[0].jsDoc.at(-1);
	for (const stmt of sfc.scriptSetup.ast.statements) {
		if (!ts.isExportAssignment(stmt)) continue;
		if (hasJSDocNodes(stmt)) jsDoc ??= stmt.jsDoc.at(-1);
	}
	if (jsDoc) replace(codes, /(?=export\sdefault)/, `${sfc.scriptSetup?.content.slice(jsDoc.pos, jsDoc.end)}\n`);
}
const plugin = (ctx, options = {}) => {
	if (!options) return [];
	const filter = createFilter(options);
	return {
		name: "vue-macros-setup-jsdoc",
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
var setup_jsdoc_default = plugin;

//#endregion
export { plugin, setup_jsdoc_default };