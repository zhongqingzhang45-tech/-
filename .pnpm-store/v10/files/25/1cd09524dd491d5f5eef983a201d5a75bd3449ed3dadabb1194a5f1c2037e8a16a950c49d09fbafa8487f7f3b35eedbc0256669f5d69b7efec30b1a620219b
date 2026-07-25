import { MagicStringAST, generateTransform } from "@vue-macros/common";
import { parse } from "@vue/compiler-dom";

//#region src/core/index.ts
function transformSetupBlock(code, id, lang) {
	const s = new MagicStringAST(code);
	const node = parse(code, {
		parseMode: "sfc",
		isNativeTag: () => true,
		isPreTag: () => true,
		getTextMode: ({ tag, props }, parent) => {
			return !parent && tag !== "template" || tag === "template" && props.some((p) => p.type === 6 && p.name === "lang" && p.value && p.value.content && p.value.content !== "html") ? 2 : 0;
		}
	});
	for (const child of node.children) if (child.type === 1 && child.tag === "setup") {
		const hasLang = child.props.some((p) => p.name === "lang");
		let codegen = "script setup";
		if (!hasLang && lang) codegen += ` lang="${lang}"`;
		s.overwrite(child.loc.start.offset + 1, child.loc.start.offset + 6, codegen);
		s.overwrite(child.loc.end.offset - 6, child.loc.end.offset - 1, "script");
	}
	return generateTransform(s, id);
}

//#endregion
export { transformSetupBlock };