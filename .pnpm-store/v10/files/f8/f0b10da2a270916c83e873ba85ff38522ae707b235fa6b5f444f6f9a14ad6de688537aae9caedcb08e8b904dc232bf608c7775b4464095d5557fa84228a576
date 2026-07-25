import { MagicStringAST, babelParse, generateTransform, getLang } from "@vue-macros/common";

//#region src/core/index.ts
function transformSetupSFC(code, id) {
	const lang = getLang(id);
	const program = babelParse(code, lang);
	const s = new MagicStringAST(code);
	for (const stmt of program.body) {
		if (stmt.type !== "ExportDefaultDeclaration") continue;
		s.append(`defineRender(${s.sliceNode(stmt.declaration)});`);
		s.removeNode(stmt);
	}
	const attrs = lang ? ` lang="${lang}"` : "";
	s.prepend(`<script setup${attrs}>`);
	s.append(`<\/script>`);
	return generateTransform(s, id);
}
function hotUpdateSetupSFC({ modules }, filter) {
	function isSubModule(id) {
		const [filename, query] = id.split("?");
		if (!query) return false;
		if (!filter(filename)) return false;
		return true;
	}
	return modules.filter((mod) => mod.id && isSubModule(mod.id));
}

//#endregion
export { hotUpdateSetupSFC, transformSetupSFC };