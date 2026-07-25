import { MagicString, generateTransform, parseSFC } from "@vue-macros/common";

//#region src/core/index.ts
function transformScriptLang(code, id, options) {
	const s = new MagicString(code);
	const lang = ` lang="${options?.defaultLang || "ts"}"`;
	const { sfc: { descriptor: { script, scriptSetup } } } = parseSFC(code, id);
	if (script && !script.attrs.lang) {
		const start = script.loc.start.offset;
		s.appendLeft(start - 1, lang);
	}
	if (scriptSetup && !scriptSetup.attrs.lang) {
		const start = scriptSetup.loc.start.offset;
		s.appendLeft(start - 1, lang);
	}
	return generateTransform(s, id);
}

//#endregion
export { transformScriptLang };