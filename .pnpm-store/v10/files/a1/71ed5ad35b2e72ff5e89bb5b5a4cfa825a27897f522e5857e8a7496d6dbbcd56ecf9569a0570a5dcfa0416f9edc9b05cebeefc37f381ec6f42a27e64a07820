import { DEFINE_EMIT, HELPER_PREFIX, MagicStringAST, escapeKey, generateTransform, isCallOf, parseSFC, walkAST } from "@vue-macros/common";

//#region src/core/index.ts
const EMIT_VARIABLE_NAME = `${HELPER_PREFIX}emit`;
function transformDefineEmit(code, id) {
	if (!code.includes(DEFINE_EMIT)) return;
	const { scriptSetup, getSetupAst } = parseSFC(code, id);
	if (!scriptSetup) return;
	const offset = scriptSetup.loc.start.offset;
	const s = new MagicStringAST(code);
	const setupAst = getSetupAst();
	const emits = [];
	walkAST(setupAst, { enter(node, parent) {
		if (!isCallOf(node, DEFINE_EMIT)) return;
		const [name, validator] = node.arguments;
		let emitName;
		if (!name) {
			if (parent?.type !== "VariableDeclarator" || parent.id.type !== "Identifier") throw new Error(`A variable must be used to receive the return value of ${DEFINE_EMIT}.`);
			emitName = parent.id.name;
		} else if (name.type === "StringLiteral") emitName = name.value;
		else throw new Error(`The first argument of ${DEFINE_EMIT} must be a string literal.`);
		emits.push({
			name: emitName,
			validator: validator ? s.sliceNode(validator, { offset }) : void 0
		});
		s.overwriteNode(node, `(...args) => ${EMIT_VARIABLE_NAME}(${JSON.stringify(emitName)}, ...args)`, { offset });
	} });
	if (emits.length > 0) s.prependLeft(offset, `\nconst ${EMIT_VARIABLE_NAME} = defineEmits(${mountEmits()})\n`);
	return generateTransform(s, id);
	function mountEmits() {
		if (emits.every(({ validator }) => !validator)) return `[${emits.map(({ name }) => JSON.stringify(name)).join(", ")}]`;
		return `{
      ${emits.map(({ name, validator }) => `${escapeKey(name)}: ${validator || `null`}`).join(",\n  ")}
    }`;
	}
}

//#endregion
export { EMIT_VARIABLE_NAME, transformDefineEmit };