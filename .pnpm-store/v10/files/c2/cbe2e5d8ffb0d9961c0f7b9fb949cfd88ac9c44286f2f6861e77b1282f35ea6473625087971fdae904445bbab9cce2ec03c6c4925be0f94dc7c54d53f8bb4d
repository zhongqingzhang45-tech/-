import { DEFINE_PROPS, MagicStringAST, TS_NODE_TYPES, VIRTUAL_ID_PREFIX, generateTransform, importHelperFn, isCallOf, isFunctionType, isLiteralType, parseSFC, resolveObjectKey, unwrapTSNode, walkAST } from "@vue-macros/common";
import { parse } from "@babel/parser";
import { extractIdentifiers, isInDestructureAssignment, isReferencedIdentifier, isStaticProperty, walkFunctionParams } from "@vue/compiler-core";
import { genPropsAccessExp, hasOwn, isArray, isString } from "@vue/shared";
import MagicStringAST$1 from "magic-string";

//#region src/core/helper/code.ts?raw
var code_default = "export function createPropsRestProxy(props,excludedKeys){const ret=Object.create(null);for(const key in props){if(!excludedKeys.includes(key)){Object.defineProperty(ret,key,{enumerable:true,get:()=>props[key]})}}return ret}\n";

//#endregion
//#region src/core/helper/index.ts
const helperId = `${VIRTUAL_ID_PREFIX}/reactivity-transform/helper`;

//#endregion
//#region src/core/transform.ts
const CONVERT_SYMBOL = "$";
const ESCAPE_SYMBOL = "$$";
const IMPORT_SOURCES = new Set([
	"vue/macros",
	"@vue-macros/reactivity-transform/macros",
	"vue-macros/macros"
]);
const shorthands = new Set([
	"ref",
	"computed",
	"shallowRef",
	"toRef",
	"customRef"
]);
const transformCheckRE = /\W\$(?:\$|ref|computed|shallowRef|toRef|customRef)?\s*(?:[(<]|as)/;
function shouldTransform(src) {
	return transformCheckRE.test(src);
}
function transform(src, { filename, sourceMap, parserPlugins, importHelpersFrom = "vue" } = {}) {
	const plugins = parserPlugins || [];
	if (filename) {
		if (/\.tsx?$/.test(filename)) plugins.push("typescript");
		if (filename.endsWith("x")) plugins.push("jsx");
	}
	const ast = parse(src, {
		sourceType: "module",
		plugins
	});
	const s = new MagicStringAST$1(src);
	const res = transformAST(ast.program, s, 0);
	if (res.importedHelpers.length > 0) s.prepend(`import { ${res.importedHelpers.map((h) => `${h} as _${h}`).join(", ")} } from '${importHelpersFrom}'\n`);
	return {
		...res,
		code: s.toString(),
		map: sourceMap ? s.generateMap({
			source: filename,
			hires: true,
			includeContent: true
		}) : null
	};
}
function transformAST(ast, s, offset = 0, knownRefs, knownProps) {
	const userImports = Object.create(null);
	for (const node of ast.body) {
		if (node.type !== "ImportDeclaration") continue;
		walkImportDeclaration(node);
	}
	let convertSymbol;
	let escapeSymbol;
	for (const { local, imported, source, specifier } of Object.values(userImports)) if (IMPORT_SOURCES.has(source)) {
		if (imported === ESCAPE_SYMBOL) escapeSymbol = local;
		else if (imported === CONVERT_SYMBOL) convertSymbol = local;
		else if (imported !== local) error(`macro imports for ref-creating methods do not support aliasing.`, specifier);
	}
	if (!convertSymbol && !userImports[CONVERT_SYMBOL]) convertSymbol = CONVERT_SYMBOL;
	if (!escapeSymbol && !userImports[ESCAPE_SYMBOL]) escapeSymbol = ESCAPE_SYMBOL;
	const importedHelpers = /* @__PURE__ */ new Set();
	const rootScope = Object.create(null);
	const scopeStack = [rootScope];
	let currentScope = rootScope;
	let escapeScope;
	const excludedIds = /* @__PURE__ */ new WeakSet();
	const parentStack = [];
	const propsLocalToPublicMap = Object.create(null);
	if (knownRefs) for (const key of knownRefs) rootScope[key] = Object.create(null);
	if (knownProps) for (const key of Object.keys(knownProps)) {
		const { local, isConst } = knownProps[key];
		rootScope[local] = {
			isProp: true,
			isConst: !!isConst
		};
		propsLocalToPublicMap[local] = key;
	}
	function walkImportDeclaration(node) {
		const source = node.source.value;
		if (IMPORT_SOURCES.has(source)) s.remove(node.start + offset, node.end + offset);
		for (const specifier of node.specifiers) {
			const local = specifier.local.name;
			const imported = specifier.type === "ImportSpecifier" && specifier.imported.type === "Identifier" && specifier.imported.name || "default";
			userImports[local] = {
				source,
				local,
				imported,
				specifier
			};
		}
	}
	function isRefCreationCall(callee) {
		if (!convertSymbol || getCurrentScope()[convertSymbol] !== void 0) return false;
		if (callee === convertSymbol) return convertSymbol;
		if (callee[0] === "$" && shorthands.has(callee.slice(1))) return callee;
		return false;
	}
	function error(msg, node) {
		const e = new Error(msg);
		e.node = node;
		throw e;
	}
	function helper(msg) {
		importedHelpers.add(msg);
		return `_${msg}`;
	}
	function getCurrentScope() {
		return scopeStack.reduce((prev, curr) => ({
			...prev,
			...curr
		}), {});
	}
	function registerBinding(id, binding) {
		excludedIds.add(id);
		if (currentScope) currentScope[id.name] = binding || false;
		else error("registerBinding called without active scope, something is wrong.", id);
	}
	const registerRefBinding = (id, isConst = false) => registerBinding(id, { isConst });
	let tempVarCount = 0;
	function genTempVar() {
		return `__$temp_${++tempVarCount}`;
	}
	function snip(node) {
		return s.original.slice(node.start + offset, node.end + offset);
	}
	function findUpParent() {
		return parentStack.slice().toReversed().find(({ type }) => !TS_NODE_TYPES.includes(type));
	}
	function walkScope(node, isRoot = false) {
		for (const stmt of node.body) if (stmt.type === "VariableDeclaration") walkVariableDeclaration(stmt, isRoot);
		else if (stmt.type === "FunctionDeclaration" || stmt.type === "ClassDeclaration") {
			if (stmt.declare || !stmt.id) continue;
			registerBinding(stmt.id);
		} else if ((stmt.type === "ForOfStatement" || stmt.type === "ForInStatement") && stmt.left.type === "VariableDeclaration") walkVariableDeclaration(stmt.left);
		else if (stmt.type === "ExportNamedDeclaration" && stmt.declaration && stmt.declaration.type === "VariableDeclaration") walkVariableDeclaration(stmt.declaration, isRoot);
		else if (stmt.type === "LabeledStatement" && stmt.body.type === "VariableDeclaration") walkVariableDeclaration(stmt.body, isRoot);
	}
	function walkVariableDeclaration(stmt, isRoot = false) {
		if (stmt.declare) return;
		for (const decl of stmt.declarations) {
			let refCall;
			const init = decl.init ? unwrapTSNode(decl.init) : null;
			const isCall = init && init.type === "CallExpression" && init.callee.type === "Identifier";
			if (isCall && (refCall = isRefCreationCall(init.callee.name))) processRefDeclaration(refCall, decl.id, decl.init, init, stmt.kind === "const");
			else {
				const isProps = isRoot && isCall && init.callee.name === "defineProps";
				for (const id of extractIdentifiers(decl.id)) if (isProps) excludedIds.add(id);
				else registerBinding(id);
			}
		}
	}
	function processRefDeclaration(method, id, init, call, isConst) {
		excludedIds.add(call.callee);
		if (method === convertSymbol) {
			s.remove(call.callee.start + offset, call.callee.end + offset);
			switch (id.type) {
				case "Identifier":
					registerRefBinding(id, isConst);
					break;
				case "ObjectPattern":
					processRefObjectPattern(id, init, isConst);
					break;
				case "ArrayPattern":
					processRefArrayPattern(id, init, isConst);
					break;
			}
			removeTrailingComma(s, call, offset);
		} else if (id.type === "Identifier") {
			registerRefBinding(id, isConst);
			s.overwrite(call.start + offset, call.start + method.length + offset, helper(method.slice(1)));
		} else error(`${method}() cannot be used with destructure patterns.`, call);
	}
	function processRefObjectPattern(pattern, value, isConst, tempVar, path = []) {
		if (!tempVar) {
			tempVar = genTempVar();
			s.overwrite(pattern.start + offset, pattern.end + offset, tempVar);
		}
		let nameId;
		for (const p of pattern.properties) {
			let key;
			let defaultValue;
			if (p.type === "ObjectProperty") if (p.key.start === p.value.start) {
				nameId = p.key;
				if (p.value.type === "Identifier") excludedIds.add(p.value);
				else if (p.value.type === "AssignmentPattern" && p.value.left.type === "Identifier") {
					excludedIds.add(p.value.left);
					defaultValue = p.value.right;
				}
			} else {
				key = p.computed ? p.key : p.key.name;
				switch (p.value.type) {
					case "Identifier":
						nameId = p.value;
						break;
					case "ObjectPattern":
						processRefObjectPattern(p.value, value, isConst, tempVar, [...path, key]);
						break;
					case "ArrayPattern":
						processRefArrayPattern(p.value, value, isConst, tempVar, [...path, key]);
						break;
					case "AssignmentPattern":
						switch (p.value.left.type) {
							case "Identifier":
								nameId = p.value.left;
								defaultValue = p.value.right;
								break;
							case "ObjectPattern":
								processRefObjectPattern(p.value.left, value, isConst, tempVar, [...path, [key, p.value.right]]);
								break;
							case "ArrayPattern":
								processRefArrayPattern(p.value.left, value, isConst, tempVar, [...path, [key, p.value.right]]);
								break;
							default:
						}
						break;
				}
			}
			else error(`reactivity destructure does not support rest elements.`, p);
			if (nameId) {
				registerRefBinding(nameId, isConst);
				const source = pathToString(tempVar, path);
				const keyStr = isString(key) ? `'${key}'` : key ? snip(key) : `'${nameId.name}'`;
				const defaultStr = defaultValue ? `, ${snip(defaultValue)}` : ``;
				s.appendLeft(value.end + offset, `,\n  ${nameId.name} = ${helper("toRef")}(${source}, ${keyStr}${defaultStr})`);
			}
		}
		if (nameId) s.appendLeft(value.end + offset, ";");
	}
	function processRefArrayPattern(pattern, value, isConst, tempVar, path = []) {
		if (!tempVar) {
			tempVar = genTempVar();
			s.overwrite(pattern.start + offset, pattern.end + offset, tempVar);
		}
		let nameId;
		for (let i = 0; i < pattern.elements.length; i++) {
			const e = pattern.elements[i];
			if (!e) continue;
			let defaultValue;
			switch (e.type) {
				case "Identifier":
					nameId = e;
					break;
				case "AssignmentPattern":
					nameId = e.left;
					defaultValue = e.right;
					break;
				case "RestElement":
					error(`reactivity destructure does not support rest elements.`, e);
					break;
				case "ObjectPattern":
					processRefObjectPattern(e, value, isConst, tempVar, [...path, i]);
					break;
				case "ArrayPattern":
					processRefArrayPattern(e, value, isConst, tempVar, [...path, i]);
					break;
			}
			if (nameId) {
				registerRefBinding(nameId, isConst);
				const source = pathToString(tempVar, path);
				const defaultStr = defaultValue ? `, ${snip(defaultValue)}` : ``;
				s.appendLeft(value.end + offset, `,\n  ${nameId.name} = ${helper("toRef")}(${source}, ${i}${defaultStr})`);
			}
		}
		if (nameId) s.appendLeft(value.end + offset, ";");
	}
	function pathToString(source, path) {
		if (path.length > 0) for (const seg of path) if (isArray(seg)) source = `(${source}${segToString(seg[0])} || ${snip(seg[1])})`;
		else source += segToString(seg);
		return source;
	}
	function segToString(seg) {
		if (typeof seg === "number") return `[${seg}]`;
		else if (typeof seg === "string") return `.${seg}`;
		else return snip(seg);
	}
	function rewriteId(scope, id, parent, parentStack$1) {
		if (hasOwn(scope, id.name)) {
			const binding = scope[id.name];
			if (binding) {
				if (binding.isConst && (parent.type === "AssignmentExpression" && id === parent.left || parent.type === "UpdateExpression")) error(`Assignment to constant variable.`, id);
				const { isProp } = binding;
				if (isStaticProperty(parent) && parent.shorthand) {
					if (!parent.inPattern || isInDestructureAssignment(parent, parentStack$1)) if (isProp) if (escapeScope) {
						registerEscapedPropBinding(id);
						s.appendLeft(id.end + offset, `: __props_${propsLocalToPublicMap[id.name]}`);
					} else s.appendLeft(id.end + offset, `: ${genPropsAccessExp(propsLocalToPublicMap[id.name])}`);
					else s.appendLeft(id.end + offset, `: ${id.name}.value`);
				} else if (isProp) if (escapeScope) {
					registerEscapedPropBinding(id);
					s.overwrite(id.start + offset, id.end + offset, `__props_${propsLocalToPublicMap[id.name]}`);
				} else s.overwrite(id.start + offset, id.end + offset, genPropsAccessExp(propsLocalToPublicMap[id.name]));
				else s.appendLeft(id.end + offset, ".value");
			}
			return true;
		}
		return false;
	}
	const propBindingRefs = {};
	function registerEscapedPropBinding(id) {
		if (!Object.prototype.hasOwnProperty.call(propBindingRefs, id.name)) {
			propBindingRefs[id.name] = true;
			const publicKey = propsLocalToPublicMap[id.name];
			s.prependRight(offset, `const __props_${publicKey} = ${helper(`toRef`)}(__props, '${publicKey}');\n`);
		}
	}
	walkScope(ast, true);
	walkAST(ast, {
		enter(node, parent) {
			parent && parentStack.push(parent);
			if (isFunctionType(node)) {
				scopeStack.push(currentScope = Object.create(null));
				walkFunctionParams(node, registerBinding);
				if (node.body.type === "BlockStatement") walkScope(node.body);
				return;
			}
			if (node.type === "CatchClause") {
				scopeStack.push(currentScope = Object.create(null));
				if (node.param && node.param.type === "Identifier") registerBinding(node.param);
				walkScope(node.body);
				return;
			}
			if (node.type === "BlockStatement" && !isFunctionType(parent)) {
				scopeStack.push(currentScope = Object.create(null));
				walkScope(node);
				return;
			}
			if (parent && parent.type.startsWith("TS") && !TS_NODE_TYPES.includes(parent.type)) return this.skip();
			if (node.type === "Identifier") {
				const binding = rootScope[node.name];
				if ((!escapeScope || binding && binding.isProp) && isReferencedIdentifier(node, parent, parentStack) && !excludedIds.has(node)) {
					let i = scopeStack.length;
					while (i--) if (rewriteId(scopeStack[i], node, parent, parentStack)) return;
				}
			}
			if (node.type === "CallExpression" && node.callee.type === "Identifier") {
				const callee = node.callee.name;
				const refCall = isRefCreationCall(callee);
				const parent$1 = findUpParent();
				if (refCall && (!parent$1 || parent$1.type !== "VariableDeclarator")) return error(`${refCall} can only be used as the initializer of a variable declaration.`, node);
				if (escapeSymbol && getCurrentScope()[escapeSymbol] === void 0 && callee === escapeSymbol) {
					escapeScope = node;
					s.remove(node.callee.start + offset, node.callee.end + offset);
					removeTrailingComma(s, node, offset);
					if (parent$1?.type === "ExpressionStatement") {
						let i = (node.leadingComments ? node.leadingComments[0].start : node.start) + offset;
						while (i--) {
							const char = s.original.charAt(i);
							if (char === "\n") {
								s.prependRight(node.start + offset, ";");
								break;
							} else if (!/\s/.test(char)) break;
						}
					}
				}
			}
		},
		leave(node, parent) {
			parent && parentStack.pop();
			if (node.type === "BlockStatement" && !isFunctionType(parent) || isFunctionType(node) || node.type === "CatchClause") {
				scopeStack.pop();
				currentScope = scopeStack.at(-1);
			}
			if (node === escapeScope) escapeScope = void 0;
		}
	});
	return {
		rootRefs: Object.keys(rootScope).filter((key) => {
			const binding = rootScope[key];
			return binding && !binding.isProp;
		}),
		importedHelpers: [...importedHelpers]
	};
}
function removeTrailingComma(s, node, offset) {
	if (typeof node.extra?.trailingComma === "number") s.remove(node.extra?.trailingComma + offset, node.extra?.trailingComma + offset + 1);
}

//#endregion
//#region src/core/sfc.ts
function transformVueSFC(code, id) {
	const s = new MagicStringAST(code);
	const { script, scriptSetup, getScriptAst, getSetupAst } = parseSFC(code, id);
	let refBindings;
	let propsDestructuredBindings;
	if (script && shouldTransform(script.content)) {
		const offset = script.loc.start.offset;
		const { importedHelpers, rootRefs } = transformAST(getScriptAst(), s, offset);
		refBindings = rootRefs;
		importHelpers(s, script.loc.start.offset, importedHelpers);
	}
	if (scriptSetup) {
		const ast = getSetupAst();
		for (const node of ast.body) processDefineProps(node);
		if (propsDestructuredBindings || refBindings || shouldTransform(scriptSetup.content)) {
			const { importedHelpers } = transformAST(ast, s, scriptSetup.loc.start.offset, refBindings, propsDestructuredBindings);
			importHelpers(s, scriptSetup.loc.start.offset, importedHelpers);
		}
	}
	return generateTransform(s, id);
	function processDefineProps(node) {
		if (node.type !== "VariableDeclaration") return;
		const decl = node.declarations.find((decl$1) => isCallOf(decl$1.init, DEFINE_PROPS));
		if (!decl || decl.id.type !== "ObjectPattern") return;
		if (node.declarations.length > 1) throw new SyntaxError(`${DEFINE_PROPS}() don't support multiple declarations.`);
		const offset = scriptSetup.loc.start.offset;
		let defaultStr = "";
		propsDestructuredBindings = Object.create(null);
		for (const prop of decl.id.properties) if (prop.type === "ObjectProperty") {
			let propKey;
			try {
				propKey = resolveObjectKey(prop);
			} catch {
				throw new SyntaxError(`${DEFINE_PROPS}() destructure cannot use computed key.`);
			}
			let local;
			if (prop.value.type === "AssignmentPattern") {
				const { left, right } = prop.value;
				if (left.type !== "Identifier") throw new SyntaxError(`${DEFINE_PROPS}() destructure does not support nested patterns.`);
				local = left.name;
				propsDestructuredBindings[propKey] = { local };
				let defaultValue = s.sliceNode(right, { offset });
				const rightNode = unwrapTSNode(right);
				if (!isLiteralType(rightNode) && !isFunctionType(rightNode) && rightNode.type !== "Identifier") defaultValue = `() => (${defaultValue})`;
				defaultStr += `${propKey}: ${defaultValue},`;
			} else if (prop.value.type === "Identifier") {
				local = prop.value.name;
				propsDestructuredBindings[propKey] = { local };
			} else throw new SyntaxError(`${DEFINE_PROPS}() destructure does not support nested patterns.`);
			if (propKey !== local) {
				const toRef = importHelperFn(s, scriptSetup.loc.start.offset, "toRef");
				s.prependLeft(offset, `const ${local} = ${toRef}(__props, ${JSON.stringify(propKey)});\n`);
			}
		} else s.prependLeft(offset, `import { createPropsRestProxy } from '${helperId}';
const ${prop.argument.name} = createPropsRestProxy(__props, ${JSON.stringify(Object.keys(propsDestructuredBindings))});\n`);
		const defineDecl = decl.init;
		if (defineDecl.typeParameters) s.overwriteNode(node, `withDefaults(${s.sliceNode(defineDecl, { offset })}, { ${defaultStr} })`, { offset });
		else if (defineDecl.arguments[0]) if (defaultStr) s.overwriteNode(node, `defineProps(${importHelperFn(s, offset, "mergeDefaults")}(${s.sliceNode(defineDecl.arguments[0], { offset })}, { ${defaultStr} }))`, { offset });
		else s.overwriteNode(node, s.sliceNode(defineDecl, { offset }), { offset });
		else throw new SyntaxError(`${DEFINE_PROPS}() must have at least one argument or type argument.`);
	}
}
function importHelpers(s, offset, helpers) {
	if (helpers.length === 0) return;
	s.prependLeft(offset, `import { ${helpers.map((h) => `${h} as _${h}`).join(", ")} } from 'vue';\n`);
}

//#endregion
export { code_default, helperId, shouldTransform, transform, transformAST, transformVueSFC };