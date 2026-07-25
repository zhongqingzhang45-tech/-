import { DEFINE_EMITS, DEFINE_MODELS, DEFINE_MODELS_DOLLAR, DEFINE_PROPS, HELPER_PREFIX, MagicStringAST, REPO_ISSUE_URL, VIRTUAL_ID_PREFIX, WITH_DEFAULTS, generateTransform, importHelperFn, isCallOf, parseSFC, resolveObjectKey } from "@vue-macros/common";
import { extractIdentifiers, walkAST } from "ast-walker-scope";

//#region src/core/helper/emit-helper.ts?raw
var emit_helper_default = "export default(emitFn,key,value,...args)=>{emitFn(key,value);return args.length>0?args[0]:value};\n";

//#endregion
//#region src/core/helper/use-vmodel.ts?raw
var use_vmodel_default = "import{useVModel}from\"@vueuse/core\";import{getCurrentInstance}from\"vue\";export default(...keys)=>{const props=getCurrentInstance().proxy.$props;const ret=Object.create(null);for(const _k of keys){if(typeof _k===\"string\"){ret[_k]=useVModel(props,_k,void 0,{eventName:`update:${_k}`,passive:true})}else{const[key,prop=key,eventName=`update:${key}`,options={}]=_k;ret[key]=useVModel(props,prop,void 0,{eventName,passive:true,...options})}}return ret};\n";

//#endregion
//#region src/core/helper/index.ts
const helperPrefix = `${VIRTUAL_ID_PREFIX}/define-models`;
const emitHelperId = `${helperPrefix}/emit-helper`;
const useVmodelHelperId = `${helperPrefix}/use-vmodel`;

//#endregion
//#region src/core/index.ts
function transformDefineModels(code, id) {
	let hasDefineProps = false;
	let hasDefineEmits = false;
	let hasDefineModels = false;
	let propsTypeDecl;
	let propsDestructureDecl;
	let emitsTypeDecl;
	let emitsIdentifier;
	let runtimeDefineFn;
	let modelDecl;
	let modelDeclKind;
	let modelTypeDecl;
	let modelIdentifier;
	let modelDestructureDecl;
	const modelIdentifiers = /* @__PURE__ */ new Set();
	let mode;
	function processDefinePropsOrEmits(node, declId) {
		if (isCallOf(node, WITH_DEFAULTS)) node = node.arguments[0];
		let type;
		if (isCallOf(node, DEFINE_PROPS)) type = "props";
		else if (isCallOf(node, DEFINE_EMITS)) type = "emits";
		else return false;
		const fnName = type === "props" ? DEFINE_PROPS : DEFINE_EMITS;
		if (node.arguments[0]) {
			runtimeDefineFn = fnName;
			return false;
		}
		if (type === "props") hasDefineProps = true;
		else hasDefineEmits = true;
		const typeDecl = node.typeParameters?.params?.[0];
		if (!typeDecl) throw new SyntaxError(`${fnName}() expected a type parameter when used with ${DEFINE_MODELS}.`);
		if (type === "props") propsTypeDecl = typeDecl;
		else emitsTypeDecl = typeDecl;
		if (declId) {
			if (type === "props" && declId.type === "ObjectPattern") propsDestructureDecl = declId;
			else if (type === "emits" && declId.type === "Identifier") emitsIdentifier = declId.name;
		} else if (type === "emits") {
			emitsIdentifier = `_${DEFINE_MODELS}_emit`;
			s.prependRight(setupOffset + node.start, `const ${emitsIdentifier} = `);
		}
		return true;
	}
	function processDefineModels(node, declId, kind) {
		if (isCallOf(node, DEFINE_MODELS)) mode = "runtime";
		else if (isCallOf(node, DEFINE_MODELS_DOLLAR)) mode = "reactivity-transform";
		else return false;
		if (hasDefineModels) throw new SyntaxError(`duplicate ${DEFINE_MODELS}() call`);
		hasDefineModels = true;
		modelDecl = node;
		modelTypeDecl = node.typeParameters?.params[0];
		if (!modelTypeDecl) throw new SyntaxError(`expected a type parameter for ${DEFINE_MODELS}.`);
		if (mode === "reactivity-transform" && declId) {
			extractIdentifiers(declId).forEach((id$1) => modelIdentifiers.add(id$1));
			if (declId.type === "ObjectPattern") {
				modelDestructureDecl = declId;
				for (const property of declId.properties) if (property.type === "RestElement") throw new SyntaxError("rest element is not supported");
			} else modelIdentifier = scriptSetup.loc.source.slice(declId.start, declId.end);
		}
		if (kind) modelDeclKind = kind;
		return true;
	}
	function extractPropsDefinitions(node) {
		const members = node.type === "TSTypeLiteral" ? node.members : node.body;
		const map$1 = Object.create(null);
		for (const m of members) if ((m.type === "TSPropertySignature" || m.type === "TSMethodSignature") && m.key.type === "Identifier") {
			const type = m.typeAnnotation?.typeAnnotation;
			let typeAnnotation = "";
			let options;
			if (type) {
				typeAnnotation += `${m.optional ? "?" : ""}: `;
				if (type.type === "TSTypeReference" && type.typeName.type === "Identifier" && type.typeName.name === "ModelOptions" && type.typeParameters?.type === "TSTypeParameterInstantiation" && type.typeParameters.params[0]) {
					typeAnnotation += setupContent.slice(type.typeParameters.params[0].start, type.typeParameters.params[0].end);
					if (type.typeParameters.params[1]?.type === "TSTypeLiteral") {
						options = Object.create(null);
						for (const m$1 of type.typeParameters.params[1].members) if ((m$1.type === "TSPropertySignature" || m$1.type === "TSMethodSignature") && m$1.key.type === "Identifier") {
							const type$1 = m$1.typeAnnotation?.typeAnnotation;
							if (type$1) options[setupContent.slice(m$1.key.start, m$1.key.end)] = setupContent.slice(type$1.start, type$1.end);
						}
					}
				} else typeAnnotation += setupContent.slice(type.start, type.end);
			}
			map$1[m.key.name] = {
				typeAnnotation,
				options
			};
		}
		return map$1;
	}
	function rewriteMacros() {
		rewriteDefines();
		if (mode === "runtime") rewriteRuntime();
		function rewriteDefines() {
			const propsText = Object.entries(map).map(([key, { typeAnnotation }]) => `${getPropKey(key)}${typeAnnotation}`).join(";\n");
			const emitsText = Object.entries(map).map(([key, { typeAnnotation }]) => `(evt: '${getEventKey(key)}', value${typeAnnotation}): void;`).join("\n  ");
			if (hasDefineProps) {
				s.overwriteNode(propsTypeDecl, `(${s.sliceNode(propsTypeDecl, { offset: setupOffset })}) & {\n  ${propsText}\n}`, { offset: setupOffset });
				if (mode === "reactivity-transform" && propsDestructureDecl && modelDestructureDecl) for (const property of modelDestructureDecl.properties) {
					const text = code.slice(setupOffset + property.start, setupOffset + property.end);
					s.appendLeft(setupOffset + propsDestructureDecl.start + 1, `${text}, `);
				}
			} else {
				let text = "";
				const kind = modelDeclKind || "let";
				if (mode === "reactivity-transform") {
					if (modelIdentifier) text = modelIdentifier;
					else if (modelDestructureDecl) text = code.slice(setupOffset + modelDestructureDecl.start, setupOffset + modelDestructureDecl.end);
				}
				s.appendRight(setupOffset, `\n${text ? `${kind} ${text} = ` : ""}defineProps<{
  ${propsText}
}>();`);
			}
			if (hasDefineEmits) s.overwriteNode(emitsTypeDecl, `(${s.sliceNode(emitsTypeDecl, { offset: setupOffset })}) & {\n  ${emitsText}\n}`, { offset: setupOffset });
			else {
				emitsIdentifier = `${HELPER_PREFIX}emit`;
				s.appendRight(setupOffset, `\n${mode === "reactivity-transform" ? `const ${emitsIdentifier} = ` : ""}defineEmits<{
  ${emitsText}
}>();`);
			}
		}
	}
	function rewriteRuntime() {
		const text = `${importHelperFn(s, setupOffset, "default", "useVModel", useVmodelHelperId)}(${Object.entries(map).map(([name, { options }]) => {
			const prop = getPropKey(name, true);
			const evt = getEventKey(name, true);
			if (!prop && !evt && !options) return stringifyValue(name);
			const args = [
				name,
				prop,
				evt
			].map((arg) => stringifyValue(arg));
			if (options) {
				const str = Object.entries(options).map(([k, v]) => `  ${stringifyValue(k)}: ${v}`).join(",\n");
				args.push(`{\n${str}\n}`);
			}
			return `[${args.join(", ")}]`;
		}).join(", ")})`;
		s.overwriteNode(modelDecl, text, { offset: setupOffset });
	}
	function processAssignModelVariable() {
		if (!emitsIdentifier) throw new Error(`Identifier of returning value of ${DEFINE_EMITS} is not found, please report this issue.\n${REPO_ISSUE_URL}`);
		function overwrite(node, id$1, value, original = false) {
			const eventName = aliasMap[id$1.name];
			const content = `${importHelperFn(s, setupOffset, "default", "emitHelper", emitHelperId)}(${emitsIdentifier}, '${getEventKey(String(eventName))}', ${value}${original ? `, ${id$1.name}` : ""})`;
			s.overwriteNode(node, content, { offset: setupOffset });
		}
		walkAST(setupAst, { leave(node) {
			if (node.type === "AssignmentExpression") {
				if (node.left.type !== "Identifier") return;
				const id$1 = this.scope[node.left.name];
				if (!modelIdentifiers.has(id$1)) return;
				const left = s.sliceNode(node.left, { offset: setupOffset });
				let right = s.sliceNode(node.right, { offset: setupOffset });
				if (node.operator !== "=") right = `${left} ${node.operator.replace(/=$/, "")} ${right}`;
				overwrite(node, id$1, right);
			} else if (node.type === "UpdateExpression") {
				if (node.argument.type !== "Identifier") return;
				const id$1 = this.scope[node.argument.name];
				if (!modelIdentifiers.has(id$1)) return;
				let value = node.argument.name;
				value += node.operator === "++" ? " + 1" : " - 1";
				overwrite(node, id$1, value, !node.prefix);
			}
		} });
	}
	if (!code.includes(DEFINE_MODELS)) return;
	const { scriptSetup, getSetupAst } = parseSFC(code, id);
	if (!scriptSetup) return;
	const setupOffset = scriptSetup.loc.start.offset;
	const setupContent = scriptSetup.content;
	const setupAst = getSetupAst().body;
	const s = new MagicStringAST(code);
	for (const node of setupAst) if (node.type === "ExpressionStatement") {
		processDefinePropsOrEmits(node.expression);
		if (processDefineModels(node.expression) && mode === "reactivity-transform") s.remove(node.start + setupOffset, node.end + setupOffset);
	} else if (node.type === "VariableDeclaration" && !node.declare) {
		const total = node.declarations.length;
		let left = total;
		for (let i = 0; i < total; i++) {
			const decl = node.declarations[i];
			if (decl.init) {
				processDefinePropsOrEmits(decl.init, decl.id);
				if (processDefineModels(decl.init, decl.id, node.kind) && mode === "reactivity-transform") if (left === 1) s.remove(node.start + setupOffset, node.end + setupOffset);
				else {
					let start = decl.start + setupOffset;
					let end = decl.end + setupOffset;
					if (i < total - 1) end = node.declarations[i + 1].start + setupOffset;
					else start = node.declarations[i - 1].end + setupOffset;
					s.remove(start, end);
					left--;
				}
			}
		}
	}
	if (!modelTypeDecl) return;
	if (runtimeDefineFn) throw new SyntaxError(`${runtimeDefineFn}() cannot accept non-type arguments when used with ${DEFINE_MODELS}()`);
	if (modelTypeDecl.type !== "TSTypeLiteral") throw new SyntaxError(`type argument passed to ${DEFINE_MODELS}() must be a literal type, or a reference to an interface or literal type.`);
	const map = extractPropsDefinitions(modelTypeDecl);
	const aliasMap = Object.create(null);
	if (modelDestructureDecl) for (const p of modelDestructureDecl.properties) {
		if (p.type !== "ObjectProperty") continue;
		try {
			const key = resolveObjectKey(p);
			if (p.value.type !== "Identifier") continue;
			aliasMap[p.value.name] = key;
		} catch {}
	}
	rewriteMacros();
	if (mode === "reactivity-transform" && hasDefineModels) processAssignModelVariable();
	return generateTransform(s, id);
}
function stringifyValue(value) {
	return value === void 0 ? "undefined" : JSON.stringify(value);
}
function getPropKey(key, omitDefault = false) {
	return omitDefault ? void 0 : key;
}
function getEventKey(key, omitDefault = false) {
	return omitDefault ? void 0 : `update:${key}`;
}

//#endregion
export { emitHelperId, emit_helper_default, helperPrefix, transformDefineModels, useVmodelHelperId, use_vmodel_default };