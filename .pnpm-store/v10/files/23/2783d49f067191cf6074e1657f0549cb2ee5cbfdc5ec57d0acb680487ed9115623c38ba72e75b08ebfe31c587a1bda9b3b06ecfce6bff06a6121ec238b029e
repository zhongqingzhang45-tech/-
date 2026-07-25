import { DEFINE_EMITS, DEFINE_PROPS, REGEX_SUPPORTED_EXT, TransformError, WITH_DEFAULTS, babelParse, createStringLiteral, createTSUnionType, getFileCodeAndLang, isCallOf, isDeclarationType, isStaticExpression, isStaticObjectKey, isTypeOf, parseSFC, resolveIdentifier, resolveLiteral, resolveObjectExpression, resolveObjectKey, resolveString } from "@vue-macros/common";
import { Result, err, errAsync, ok, okAsync, safeTry } from "neverthrow";
import path from "node:path";
import { readFile } from "node:fs/promises";

export * from "@vue-macros/common"

//#region src/ts/is.ts
function isTSDeclaration(node) {
	return isDeclarationType(node) && node.type.startsWith("TS");
}

//#endregion
//#region src/ts/scope.ts
const tsFileCache = Object.create(null);
async function getTSFile(filePath) {
	if (tsFileCache[filePath]) return tsFileCache[filePath];
	const content = await readFile(filePath, "utf8");
	const { code, lang } = getFileCodeAndLang(content, filePath);
	return tsFileCache[filePath] = {
		kind: "file",
		filePath,
		content,
		ast: REGEX_SUPPORTED_EXT.test(filePath) ? babelParse(code, lang, { cache: true }).body : void 0
	};
}
function resolveTSScope(scope) {
	const isFile = scope.kind === "file";
	let parentScope;
	if (!isFile) parentScope = resolveTSScope(scope.scope);
	const file = isFile ? scope : parentScope.file;
	const body = isFile ? scope.ast : scope.ast.body;
	const exports = scope.exports;
	const declarations = isFile ? scope.declarations : {
		...resolveTSScope(scope.scope).declarations,
		...scope.declarations
	};
	return {
		isFile,
		file,
		body,
		declarations,
		exports
	};
}

//#endregion
//#region src/ts/resolve-file.ts
let typesResolver;
const referencedFiles = /* @__PURE__ */ new Map();
function collectReferencedFile(importer, file) {
	if (!importer) return;
	if (referencedFiles.has(file)) referencedFiles.get(file).add(importer);
	else referencedFiles.set(file, new Set([importer]));
}
const resolveCache = /* @__PURE__ */ new Map();
async function resolveDts(id, importer) {
	const cached = resolveCache.get(importer)?.get(id);
	if (cached) return cached;
	if (!typesResolver) {
		const { ResolverFactory } = await import("oxc-resolver");
		typesResolver = new ResolverFactory({
			mainFields: ["types"],
			conditionNames: ["types", "import"],
			extensions: [".d.ts", ".ts"]
		});
	}
	const { error, path: resolved } = await typesResolver.async(path.dirname(importer), id);
	if (error || !resolved) return;
	collectReferencedFile(importer, resolved);
	if (resolveCache.has(importer)) resolveCache.get(importer).set(id, resolved);
	else resolveCache.set(importer, new Map([[id, resolved]]));
	return resolved;
}
const resolveDtsHMR = ({ file, server, modules }) => {
	const cache = /* @__PURE__ */ new Map();
	if (tsFileCache[file]) delete tsFileCache[file];
	const affected = getAffectedModules(file);
	return [...modules, ...affected];
	function getAffectedModules(file$1) {
		if (cache.has(file$1)) return cache.get(file$1);
		if (!referencedFiles.has(file$1)) return /* @__PURE__ */ new Set([]);
		const modules$1 = /* @__PURE__ */ new Set([]);
		cache.set(file$1, modules$1);
		for (const importer of referencedFiles.get(file$1)) {
			const mods = server.moduleGraph.getModulesByFile(importer);
			if (mods) mods.forEach((m) => modules$1.add(m));
			getAffectedModules(importer).forEach((m) => modules$1.add(m));
		}
		return modules$1;
	}
};

//#endregion
//#region src/ts/property.ts
function mergeTSProperties(a, b) {
	return {
		callSignatures: [...a.callSignatures, ...b.callSignatures],
		constructSignatures: [...a.constructSignatures, ...b.constructSignatures],
		methods: {
			...a.methods,
			...b.methods
		},
		properties: {
			...a.properties,
			...b.properties
		}
	};
}
function checkForTSProperties(node) {
	return !!node && [
		"TSInterfaceDeclaration",
		"TSInterfaceBody",
		"TSTypeLiteral",
		"TSIntersectionType",
		"TSMappedType",
		"TSFunctionType"
	].includes(node.type);
}
/**
* get properties of `interface` or `type` declaration
*
* @limitation don't support index signature
*/
function resolveTSProperties({ type, scope }) {
	return safeTry(async function* () {
		switch (type.type) {
			case "TSInterfaceBody": return ok(resolveTypeElements(scope, type.body));
			case "TSTypeLiteral": return ok(resolveTypeElements(scope, type.members));
			case "TSInterfaceDeclaration": {
				let properties = resolveTypeElements(scope, type.body.body);
				if (type.extends) {
					const resolvedExtends = yield* Result.combine(await Promise.all(type.extends.map((node) => node.expression.type === "Identifier" ? resolveTSReferencedType({
						scope,
						type: node.expression
					}) : ok()))).map((res) => res.filter(filterValidExtends));
					if (resolvedExtends.length > 0) {
						const ext = (yield* Result.combine(await Promise.all(resolvedExtends.map((resolved) => resolveTSProperties(resolved))))).reduceRight((acc, curr) => mergeTSProperties(acc, curr));
						properties = mergeTSProperties(ext, properties);
					}
				}
				return ok(properties);
			}
			case "TSIntersectionType": {
				let properties = {
					callSignatures: [],
					constructSignatures: [],
					methods: Object.create(null),
					properties: Object.create(null)
				};
				for (const subType of type.types) {
					const resolved = yield* resolveTSReferencedType({
						scope,
						type: subType
					});
					if (!filterValidExtends(resolved)) continue;
					properties = mergeTSProperties(properties, yield* resolveTSProperties(resolved));
				}
				return ok(properties);
			}
			case "TSMappedType": {
				const properties = {
					callSignatures: [],
					constructSignatures: [],
					methods: Object.create(null),
					properties: Object.create(null)
				};
				if (!type.typeParameter.constraint) return ok(properties);
				const constraint = yield* resolveTSReferencedType({
					type: type.typeParameter.constraint,
					scope
				});
				if (!constraint || isTSNamespace(constraint)) return ok(properties);
				const types = resolveMaybeTSUnion(constraint.type);
				for (const subType of types) {
					if (subType.type !== "TSLiteralType") continue;
					const literal = yield* resolveTSLiteralType({
						type: subType,
						scope: constraint.scope
					});
					if (!literal) continue;
					const keys = resolveMaybeTSUnion(literal).map((literal$1) => String(resolveLiteral(literal$1)));
					for (const key of keys) properties.properties[String(key)] = {
						value: type.typeAnnotation ? {
							scope,
							type: type.typeAnnotation
						} : null,
						optional: type.optional === "+" || type.optional === true,
						signature: {
							type,
							scope
						}
					};
				}
				return ok(properties);
			}
			case "TSFunctionType": return ok({
				callSignatures: [{
					type,
					scope
				}],
				constructSignatures: [],
				methods: Object.create(null),
				properties: Object.create(null)
			});
			default: return err(new TransformError(`Unknown node: ${type?.type}`));
		}
	});
	function filterValidExtends(node) {
		return !isTSNamespace(node) && checkForTSProperties(node?.type);
	}
}
function getTSPropertiesKeys(properties) {
	return [...new Set([...Object.keys(properties.properties), ...Object.keys(properties.methods)])];
}

//#endregion
//#region src/ts/resolve.ts
function resolveTSTemplateLiteral({ type, scope }) {
	return resolveKeys("", type.quasis, type.expressions).map((keys) => keys.map((k) => createStringLiteral(k)));
	function resolveKeys(prefix, quasis, expressions) {
		return safeTry(async function* () {
			if (expressions.length === 0) return ok([prefix + (quasis[0]?.value.cooked ?? "")]);
			const [expr, ...restExpr] = expressions;
			const [quasi, ...restQuasis] = quasis;
			const subTypes = resolveMaybeTSUnion(expr);
			const keys = [];
			for (const type$1 of subTypes) {
				if (!isSupportedForTSReferencedType(type$1)) continue;
				const resolved = yield* resolveTSReferencedType({
					type: type$1,
					scope
				});
				if (!resolved || isTSNamespace(resolved)) continue;
				const types = resolveMaybeTSUnion(resolved.type);
				for (const type$2 of types) {
					if (type$2.type !== "TSLiteralType") continue;
					const literal = yield* resolveTSLiteralType({
						type: type$2,
						scope
					});
					if (!literal) continue;
					const subKeys = resolveMaybeTSUnion(literal).map((literal$1) => String(resolveLiteral(literal$1)));
					for (const key of subKeys) {
						const newPrefix = prefix + quasi.value.cooked + String(key);
						keys.push(...yield* resolveKeys(newPrefix, restQuasis, restExpr));
					}
				}
			}
			return ok(keys);
		});
	}
}
function resolveTSLiteralType({ type, scope }) {
	if (type.literal.type === "UnaryExpression") return okAsync(void 0);
	if (type.literal.type === "TemplateLiteral") return resolveTSTemplateLiteral({
		type: type.literal,
		scope
	});
	return okAsync(type.literal);
}
/**
* @limitation don't support index signature
*/
function resolveTypeElements(scope, elements) {
	const properties = {
		callSignatures: [],
		constructSignatures: [],
		methods: Object.create(null),
		properties: Object.create(null)
	};
	const tryGetKey = (element) => {
		try {
			return resolveObjectKey(element);
		} catch {}
	};
	for (const element of elements) switch (element.type) {
		case "TSCallSignatureDeclaration":
			properties.callSignatures.push({
				scope,
				type: element
			});
			break;
		case "TSConstructSignatureDeclaration":
			properties.constructSignatures.push({
				scope,
				type: element
			});
			break;
		case "TSMethodSignature": {
			const key = tryGetKey(element);
			if (!key) continue;
			if (properties.properties[key]) continue;
			if (!properties.methods[key]) properties.methods[key] = [];
			if (element.typeAnnotation) properties.methods[key].push({
				scope,
				type: element
			});
			break;
		}
		case "TSPropertySignature": {
			const key = tryGetKey(element);
			if (!key) continue;
			if (!properties.properties[key] && !properties.methods[key]) {
				const type = element.typeAnnotation?.typeAnnotation;
				properties.properties[key] = {
					value: type ? {
						type,
						scope
					} : null,
					optional: !!element.optional,
					signature: {
						type: element,
						scope
					}
				};
			}
			break;
		}
		case "TSIndexSignature": break;
	}
	return properties;
}
function resolveTSIndexedAccessType({ scope, type }, stacks = []) {
	return safeTry(async function* () {
		const object = yield* resolveTSReferencedType({
			type: type.objectType,
			scope
		}, stacks);
		if (!object || isTSNamespace(object)) return ok();
		const objectType = object.type;
		if (type.indexType.type === "TSNumberKeyword") {
			let types;
			if (objectType.type === "TSArrayType") types = [objectType.elementType];
			else if (objectType.type === "TSTupleType") types = objectType.elementTypes.map((t) => t.type === "TSNamedTupleMember" ? t.elementType : t);
			else if (objectType.type === "TSTypeReference" && objectType.typeName.type === "Identifier" && objectType.typeName.name === "Array" && objectType.typeParameters) types = objectType.typeParameters.params;
			else return ok();
			return ok({
				type: createTSUnionType(types),
				scope
			});
		} else if (objectType.type !== "TSInterfaceDeclaration" && objectType.type !== "TSTypeLiteral" && objectType.type !== "TSIntersectionType" && objectType.type !== "TSMappedType" && objectType.type !== "TSFunctionType") return ok();
		const properties = yield* resolveTSProperties({
			type: objectType,
			scope: object.scope
		});
		const indexTypes = resolveMaybeTSUnion(type.indexType);
		const indexes = [];
		let optional = false;
		for (const index of indexTypes) {
			let keys;
			if (index.type === "TSLiteralType") {
				const literal = yield* resolveTSLiteralType({
					type: index,
					scope: object.scope
				});
				if (!literal) continue;
				keys = resolveMaybeTSUnion(literal).map((literal$1) => String(resolveLiteral(literal$1)));
			} else if (index.type === "TSTypeOperator") {
				const keysStrings = yield* resolveTSTypeOperator({
					type: index,
					scope: object.scope
				});
				if (!keysStrings) continue;
				keys = resolveMaybeTSUnion(keysStrings).map((literal) => String(resolveLiteral(literal)));
			} else continue;
			for (const key of keys) {
				const property = properties.properties[key];
				if (property) {
					optional ||= property.optional;
					const propertyType = properties.properties[key].value;
					if (propertyType) indexes.push(propertyType.type);
				}
				const methods = properties.methods[key];
				if (methods) {
					optional ||= methods.some((m) => !!m.type.optional);
					indexes.push(...methods.map(({ type: type$1 }) => ({
						...type$1,
						type: "TSFunctionType"
					})));
				}
			}
		}
		if (indexes.length === 0) return ok();
		if (optional) indexes.push({ type: "TSUndefinedKeyword" });
		return ok({
			type: createTSUnionType(indexes),
			scope
		});
	});
}
function resolveTSTypeOperator({ scope, type }, stacks = []) {
	return safeTry(async function* () {
		if (type.operator !== "keyof") return ok();
		const resolved = yield* resolveTSReferencedType({
			type: type.typeAnnotation,
			scope
		}, stacks);
		if (!resolved || isTSNamespace(resolved)) return ok();
		const { type: resolvedType, scope: resolvedScope } = resolved;
		if (!checkForTSProperties(resolvedType)) return ok();
		const properties = yield* resolveTSProperties({
			type: resolvedType,
			scope: resolvedScope
		});
		return ok(getTSPropertiesKeys(properties).map((k) => createStringLiteral(k)));
	});
}
function resolveMaybeTSUnion(node) {
	if (Array.isArray(node)) return node;
	if (node.type === "TSUnionType") return node.types.flatMap((t) => resolveMaybeTSUnion(t));
	return [node];
}

//#endregion
//#region src/ts/resolve-reference.ts
function isSupportedForTSReferencedType(node) {
	return node.type.startsWith("TS") || node.type === "Identifier" || isTSDeclaration(node);
}
/**
* Resolve a reference to a type.
*
* Supports `type` and `interface` only.
*
* @limitation don't support non-TS declaration (e.g. class, function...)
*/
function resolveTSReferencedType(ref, stacks = []) {
	return safeTry(async function* () {
		const { scope, type } = ref;
		if (stacks.some((stack) => stack.scope === scope && stack.type === type)) return ok(ref);
		stacks.push(ref);
		switch (type.type) {
			case "TSTypeAliasDeclaration":
			case "TSParenthesizedType": return resolveTSReferencedType({
				scope,
				type: type.typeAnnotation
			}, stacks);
			case "TSIndexedAccessType": return resolveTSIndexedAccessType({
				type,
				scope
			}, stacks);
			case "TSModuleDeclaration":
				if (type.body.type === "TSModuleBlock") {
					const newScope = {
						kind: "module",
						ast: type.body,
						scope
					};
					yield* resolveTSNamespace(newScope);
					return ok(newScope.exports);
				}
				return ok();
		}
		if (type.type !== "Identifier" && type.type !== "TSTypeReference") return ok({
			scope,
			type
		});
		yield* resolveTSNamespace(scope);
		const refNames = resolveIdentifier(type.type === "TSTypeReference" ? type.typeName : type);
		let resolved = resolveTSScope(scope).declarations;
		for (const name of refNames) if (isTSNamespace(resolved) && resolved[name]) resolved = resolved[name];
		else if (type.type === "TSTypeReference") return ok({
			type,
			scope
		});
		return ok(resolved);
	});
}

//#endregion
//#region src/ts/namespace.ts
const namespaceSymbol = Symbol("namespace");
function isTSNamespace(val) {
	return !!val && typeof val === "object" && namespaceSymbol in val;
}
/**
* Get exports of the TS file.
*
* @limitation don't support non-TS declaration (e.g. class, function...)
*/
function resolveTSNamespace(scope) {
	return safeTry(async function* () {
		if (scope.exports) return ok();
		const exports = { [namespaceSymbol]: true };
		scope.exports = exports;
		const declarations = {
			[namespaceSymbol]: true,
			...scope.declarations
		};
		scope.declarations = declarations;
		const { body, file } = resolveTSScope(scope);
		for (const stmt of body || []) if (stmt.type === "ExportDefaultDeclaration" && isTSDeclaration(stmt.declaration)) exports.default = yield* resolveTSReferencedType({
			scope,
			type: stmt.declaration
		});
		else if (stmt.type === "ExportAllDeclaration") {
			const resolved = await resolveDts(stmt.source.value, file.filePath);
			if (!resolved) continue;
			const sourceScope = await getTSFile(resolved);
			yield* resolveTSNamespace(sourceScope);
			Object.assign(exports, sourceScope.exports);
		} else if (stmt.type === "ExportNamedDeclaration") {
			let sourceExports;
			if (stmt.source) {
				const resolved = await resolveDts(stmt.source.value, file.filePath);
				if (!resolved) continue;
				const scope$1 = await getTSFile(resolved);
				yield* resolveTSNamespace(scope$1);
				sourceExports = scope$1.exports;
			} else sourceExports = declarations;
			for (const specifier of stmt.specifiers) {
				let exported;
				switch (specifier.type) {
					case "ExportDefaultSpecifier":
						exported = sourceExports.default;
						break;
					case "ExportNamespaceSpecifier":
						exported = sourceExports;
						break;
					case "ExportSpecifier":
						exported = sourceExports[specifier.local.name];
						break;
					default: return err(new TransformError(`Unknown export type: ${specifier.type}`));
				}
				const name = specifier.exported.type === "Identifier" ? specifier.exported.name : specifier.exported.value;
				exports[name] = exported;
			}
			if (isTSDeclaration(stmt.declaration)) {
				const decl = stmt.declaration;
				if (decl.id?.type === "Identifier") {
					const exportedName = decl.id.name;
					declarations[exportedName] = exports[exportedName] = yield* resolveTSReferencedType({
						scope,
						type: decl
					});
				}
			}
		} else if (isTSDeclaration(stmt)) {
			if (stmt.id?.type !== "Identifier") continue;
			declarations[stmt.id.name] = yield* resolveTSReferencedType({
				scope,
				type: stmt
			});
		} else if (stmt.type === "ImportDeclaration") {
			const resolved = await resolveDts(stmt.source.value, file.filePath);
			if (!resolved) continue;
			const importScope = await getTSFile(resolved);
			yield* resolveTSNamespace(importScope);
			const exports$1 = importScope.exports;
			for (const specifier of stmt.specifiers) {
				const local = specifier.local.name;
				let imported;
				switch (specifier.type) {
					case "ImportDefaultSpecifier":
						imported = exports$1.default;
						break;
					case "ImportNamespaceSpecifier":
						imported = exports$1;
						break;
					case "ImportSpecifier": {
						const name = specifier.imported.type === "Identifier" ? specifier.imported.name : specifier.imported.value;
						imported = exports$1[name];
						break;
					}
					default: return err(new TransformError(`Unknown import type: ${specifier.type}`));
				}
				declarations[local] = imported;
			}
		}
		return ok();
	});
}

//#endregion
//#region src/vue/types.ts
let DefinitionKind = /* @__PURE__ */ function(DefinitionKind$1) {
	/**
	* Definition is a referenced variable.
	*
	* @example defineSomething(foo)
	*/
	DefinitionKind$1["Reference"] = "Reference";
	/**
	* Definition is a `ObjectExpression`.
	*
	* @example defineSomething({ ... })
	*/
	DefinitionKind$1["Object"] = "Object";
	/**
	* Definition is TypeScript interface.
	*
	* @example defineSomething<{ ... }>()
	*/
	DefinitionKind$1["TS"] = "TS";
	return DefinitionKind$1;
}({});

//#endregion
//#region src/vue/utils.ts
const UNKNOWN_TYPE = "Unknown";
function inferRuntimeType(node) {
	return safeTry(async function* () {
		if (isTSNamespace(node)) return ok(["Object"]);
		switch (node.type.type) {
			case "TSStringKeyword": return ok(["String"]);
			case "TSNumberKeyword": return ok(["Number"]);
			case "TSBooleanKeyword": return ok(["Boolean"]);
			case "TSObjectKeyword": return ok(["Object"]);
			case "TSInterfaceDeclaration":
			case "TSTypeLiteral": {
				const resolved = yield* resolveTSProperties({
					type: node.type,
					scope: node.scope
				});
				const types = /* @__PURE__ */ new Set();
				if (resolved.callSignatures.length || resolved.constructSignatures.length) types.add("Function");
				if (Object.keys(resolved.methods).length || Object.keys(resolved.properties).length) types.add("Object");
				return ok(Array.from(types));
			}
			case "TSFunctionType": return ok(["Function"]);
			case "TSArrayType":
			case "TSTupleType": return ok(["Array"]);
			case "TSLiteralType":
				switch (node.type.literal.type) {
					case "StringLiteral": return ok(["String"]);
					case "BooleanLiteral": return ok(["Boolean"]);
					case "NumericLiteral":
					case "BigIntLiteral": return ok(["Number"]);
				}
				break;
			case "TSTypeReference":
				if (node.type.typeName.type === "Identifier") switch (node.type.typeName.name) {
					case "Array":
					case "Function":
					case "Object":
					case "Set":
					case "Map":
					case "WeakSet":
					case "WeakMap":
					case "Date":
					case "Promise": return ok([node.type.typeName.name]);
					case "Record":
					case "Partial":
					case "Readonly":
					case "Pick":
					case "Omit":
					case "Required":
					case "InstanceType": return ok(["Object"]);
					case "Extract":
						if (node.type.typeParameters && node.type.typeParameters.params[1]) {
							const t = yield* resolveTSReferencedType({
								scope: node.scope,
								type: node.type.typeParameters.params[1]
							});
							if (t) return inferRuntimeType(t);
						}
						break;
					case "Exclude":
						if (node.type.typeParameters && node.type.typeParameters.params[0]) {
							const t = yield* resolveTSReferencedType({
								scope: node.scope,
								type: node.type.typeParameters.params[0]
							});
							if (t) return inferRuntimeType(t);
						}
						break;
				}
				break;
			case "TSUnionType": {
				const types = [];
				for (const subType of node.type.types) {
					const resolved = yield* resolveTSReferencedType({
						scope: node.scope,
						type: subType
					});
					types.push(...resolved && !isTSNamespace(resolved) ? yield* inferRuntimeType(resolved) : ["null"]);
				}
				return ok([...new Set(types)]);
			}
			case "TSIntersectionType": return ok(["Object"]);
			case "TSSymbolKeyword": return ok(["Symbol"]);
		}
		return ok([UNKNOWN_TYPE]);
	});
}
function attachNodeLoc(node, newNode) {
	newNode.start = node.start;
	newNode.end = node.end;
}
function genRuntimePropDefinition(types, isProduction, properties) {
	let type;
	let skipCheck = false;
	if (types) {
		const hasBoolean = types.includes("Boolean");
		const hasUnknown = types.includes(UNKNOWN_TYPE);
		if (isProduction || hasUnknown) {
			types = types.filter((t) => t === "Boolean" || hasBoolean && t === "String" || t === "Function");
			skipCheck = !isProduction && hasUnknown && types.length > 0;
		}
		if (types.length > 0) type = types.length > 1 ? `[${types.join(", ")}]` : types[0];
	}
	const pairs = [];
	if (type) pairs.push(`type: ${type}`);
	if (skipCheck) pairs.push(`skipCheck: true`);
	pairs.push(...properties);
	return pairs.length > 0 ? `{ ${pairs.join(", ")} }` : "null";
}

//#endregion
//#region src/vue/emits.ts
function handleTSEmitsDefinition({ s, file, offset, defineEmitsAst, typeDeclRaw, declId, statement }) {
	return safeTry(async function* () {
		const { definitions, definitionsAst } = yield* resolveDefinitions({
			type: typeDeclRaw,
			scope: file
		});
		const addEmit = (name, signature) => {
			const key = resolveString(name);
			if (definitionsAst.scope === file) if (definitionsAst.ast.type === "TSIntersectionType") s.appendLeft(definitionsAst.ast.end + offset, ` & { ${signature} }`);
			else s.appendLeft(definitionsAst.ast.end + offset - 1, `  ${signature}\n`);
			if (!definitions[key]) definitions[key] = [];
			const ast = parseSignature(signature);
			definitions[key].push({
				code: signature,
				ast,
				scope: void 0
			});
		};
		const setEmit = (name, idx, signature) => {
			const key = resolveString(name);
			const def = definitions[key][idx];
			if (!def) return false;
			const ast = parseSignature(signature);
			attachNodeLoc(def.ast, ast);
			if (def.scope === file) s.overwriteNode(def.ast, signature, { offset });
			definitions[key][idx] = {
				code: signature,
				ast,
				scope: void 0
			};
			return true;
		};
		const removeEmit = (name, idx) => {
			const key = resolveString(name);
			const def = definitions[key][idx];
			if (!def) return false;
			if (def.scope === file) s.removeNode(def.ast, { offset });
			definitions[key].splice(idx, 1);
			return true;
		};
		return ok({
			kind: DefinitionKind.TS,
			definitions,
			definitionsAst,
			declId,
			addEmit,
			setEmit,
			removeEmit,
			statementAst: statement,
			defineEmitsAst
		});
	});
	function resolveDefinitions(typeDeclRaw$1) {
		return safeTry(async function* () {
			const resolved = yield* resolveTSReferencedType(typeDeclRaw$1);
			if (!resolved || isTSNamespace(resolved)) return err(new TransformError("Cannot resolve TS definition."));
			const { type: definitionsAst, scope } = resolved;
			if (definitionsAst.type !== "TSInterfaceDeclaration" && definitionsAst.type !== "TSTypeLiteral" && definitionsAst.type !== "TSIntersectionType" && definitionsAst.type !== "TSFunctionType") return err(new TransformError(`Cannot resolve TS definition: ${definitionsAst.type}`));
			const properties = yield* resolveTSProperties({
				scope,
				type: definitionsAst
			});
			const definitions = Object.create(null);
			for (const signature of properties.callSignatures) {
				const evtArg = signature.type.parameters[0];
				if (!evtArg || evtArg.type !== "Identifier" || evtArg.typeAnnotation?.type !== "TSTypeAnnotation") continue;
				const evtType = yield* resolveTSReferencedType({
					type: evtArg.typeAnnotation.typeAnnotation,
					scope: signature.scope
				});
				if (isTSNamespace(evtType) || !evtType?.type) continue;
				const types = evtType.type.type === "TSUnionType" ? evtType.type.types : [evtType.type];
				for (const type of types) {
					if (type.type !== "TSLiteralType") continue;
					const literal = type.literal;
					if (!isStaticExpression(literal)) continue;
					const evt = String(resolveLiteral(literal));
					if (!definitions[evt]) definitions[evt] = [];
					definitions[evt].push(buildDefinition$1(signature));
				}
			}
			for (const evt of Object.keys(properties.properties)) {
				if (!definitions[evt]) definitions[evt] = [];
				definitions[evt].push(buildDefinition$1(properties.properties[evt].signature));
			}
			return ok({
				definitions,
				definitionsAst: buildDefinition$1({
					scope,
					type: definitionsAst
				})
			});
		});
	}
}
function parseSignature(signature) {
	return babelParse(`interface T {${signature}}`, "ts").body[0].body.body[0];
}
function buildDefinition$1({ type, scope }) {
	return {
		code: resolveTSScope(scope).file.content.slice(type.start, type.end),
		ast: type,
		scope
	};
}

//#endregion
//#region src/vue/props.ts
const builtInTypesHandlers = {
	Partial: {
		handleType(resolved) {
			return resolved.typeParameters?.params[0];
		},
		handleTSProperties(properties) {
			for (const prop of Object.values(properties.properties)) prop.optional = true;
			return properties;
		}
	},
	Required: {
		handleType(resolved) {
			return resolved.typeParameters?.params[0];
		},
		handleTSProperties(properties) {
			for (const prop of Object.values(properties.properties)) prop.optional = false;
			return properties;
		}
	},
	Readonly: { handleType(resolved) {
		return resolved.typeParameters?.params[0];
	} }
};
function handleTSPropsDefinition({ s, file, offset, definePropsAst, typeDeclRaw, withDefaultsAst, defaultsDeclRaw, statement, declId }) {
	return safeTry(async function* () {
		const { definitions, definitionsAst } = yield* resolveDefinitions({
			type: typeDeclRaw,
			scope: file
		});
		const { defaults, defaultsAst } = resolveDefaults(defaultsDeclRaw);
		const addProp = (name, value, optional) => {
			const { key, signature, valueAst, signatureAst } = buildNewProp(name, value, optional);
			if (definitions[key]) return false;
			if (definitionsAst.scope === file) if (definitionsAst.ast.type === "TSIntersectionType") s.appendLeft(definitionsAst.ast.end + offset, ` & { ${signature} }`);
			else s.appendLeft(definitionsAst.ast.end + offset - 1, `  ${signature}\n`);
			definitions[key] = {
				type: "property",
				value: {
					code: value,
					ast: valueAst,
					scope: void 0
				},
				optional: !!optional,
				signature: {
					code: signature,
					ast: signatureAst,
					scope: void 0
				},
				addByAPI: true
			};
			return true;
		};
		const setProp = (name, value, optional) => {
			const { key, signature, signatureAst, valueAst } = buildNewProp(name, value, optional);
			const def = definitions[key];
			if (!definitions[key]) return false;
			switch (def.type) {
				case "method":
					attachNodeLoc(def.methods[0].ast, signatureAst);
					if (def.methods[0].scope === file) s.overwriteNode(def.methods[0].ast, signature, { offset });
					def.methods.slice(1).forEach((method) => {
						if (method.scope === file) s.removeNode(method.ast, { offset });
					});
					break;
				case "property":
					attachNodeLoc(def.signature.ast, signatureAst);
					if (def.signature.scope === file && !def.addByAPI) s.overwriteNode(def.signature.ast, signature, { offset });
					break;
			}
			definitions[key] = {
				type: "property",
				value: {
					code: value,
					ast: valueAst,
					scope: void 0
				},
				optional: !!optional,
				signature: {
					code: signature,
					ast: signatureAst,
					scope: void 0
				},
				addByAPI: def.type === "property" && def.addByAPI
			};
			return true;
		};
		const removeProp = (name) => {
			const key = resolveString(name);
			if (!definitions[key]) return false;
			const def = definitions[key];
			switch (def.type) {
				case "property":
					if (def.signature.scope === file && !def.addByAPI) s.removeNode(def.signature.ast, { offset });
					break;
				case "method":
					def.methods.forEach((method) => {
						if (method.scope === file) s.removeNode(method.ast, { offset });
					});
					break;
			}
			delete definitions[key];
			return true;
		};
		const getRuntimeDefinitions = () => {
			return safeTry(async function* () {
				const props = Object.create(null);
				for (const [propName, def] of Object.entries(definitions)) {
					let prop;
					if (def.type === "method") prop = {
						type: ["Function"],
						required: !def.optional
					};
					else {
						const resolvedType = def.value;
						if (resolvedType) {
							const optional = def.optional;
							prop = {
								type: yield* inferRuntimeType({
									scope: resolvedType.scope || file,
									type: resolvedType.ast
								}),
								required: !optional
							};
						} else prop = {
							type: ["null"],
							required: false
						};
					}
					const defaultValue = defaults?.[propName];
					if (defaultValue) prop.default = (key = "default") => {
						switch (defaultValue.type) {
							case "ObjectMethod": return `${defaultValue.kind === "method" ? "" : `${defaultValue.kind} `}${defaultValue.async ? `async ` : ""}${key}(${s.sliceNode(defaultValue.params, { offset })}) ${s.sliceNode(defaultValue.body, { offset })}`;
							case "ObjectProperty": return `${key}: ${s.sliceNode(defaultValue.value, { offset })}`;
						}
					};
					props[propName] = prop;
				}
				return ok(props);
			});
		};
		return ok({
			kind: DefinitionKind.TS,
			definitions,
			defaults,
			declId,
			addProp,
			setProp,
			removeProp,
			getRuntimeDefinitions,
			definitionsAst,
			defaultsAst,
			statementAst: statement,
			definePropsAst,
			withDefaultsAst
		});
	});
	function resolveUnion(definitionsAst, scope) {
		return safeTry(async function* () {
			const unionDefs = [];
			const keys = /* @__PURE__ */ new Set();
			for (const type of definitionsAst.types) {
				const defs = yield* resolveDefinitions({
					type,
					scope
				}).map(({ definitions }) => definitions);
				Object.keys(defs).forEach((key) => keys.add(key));
				unionDefs.push(defs);
			}
			const results = Object.create(null);
			for (const key of keys) {
				let optional = false;
				let result;
				for (const defMap of unionDefs) {
					const def = defMap[key];
					if (!def) {
						optional = true;
						continue;
					}
					optional ||= def.optional;
					if (!result) {
						result = def;
						continue;
					}
					if (result.type === "method" && def.type === "method") result.methods.push(...def.methods);
					else if (result.type === "property" && def.type === "property") {
						if (!def.value) continue;
						else if (!result.value) {
							result = def;
							continue;
						}
						const excludeTypes = [
							"TSImportType",
							"TSDeclareFunction",
							"TSEnumDeclaration",
							"TSInterfaceDeclaration",
							"TSModuleDeclaration",
							"TSImportEqualsDeclaration"
						];
						if (isTypeOf(def.value.ast, excludeTypes) || isTypeOf(result.value.ast, excludeTypes)) continue;
						if (result.value.ast.type === "TSUnionType") result.value.ast.types.push(def.value.ast);
						else result = {
							type: "property",
							value: buildDefinition({
								scope,
								type: {
									type: "TSUnionType",
									types: [result.value.ast, def.value.ast]
								}
							}),
							signature: null,
							optional,
							addByAPI: false
						};
					} else return err(new TransformError(`Cannot resolve TS definition. Union type contains different types of results.`));
				}
				if (result) results[key] = {
					...result,
					optional
				};
			}
			return ok({
				definitions: results,
				definitionsAst: buildDefinition({
					scope,
					type: definitionsAst
				})
			});
		});
	}
	function resolveIntersection(definitionsAst, scope) {
		return safeTry(async function* () {
			const results = Object.create(null);
			for (const type of definitionsAst.types) {
				const defMap = yield* resolveDefinitions({
					type,
					scope
				}).map(({ definitions }) => definitions);
				for (const [key, def] of Object.entries(defMap)) {
					const result = results[key];
					if (!result) {
						results[key] = def;
						continue;
					}
					if (result.type === "method" && def.type === "method") result.methods.push(...def.methods);
					else results[key] = def;
				}
			}
			return ok({
				definitions: results,
				definitionsAst: buildDefinition({
					scope,
					type: definitionsAst
				})
			});
		});
	}
	function resolveNormal(properties) {
		return safeTry(async function* () {
			const definitions = Object.create(null);
			for (const [key, sign] of Object.entries(properties.methods)) definitions[key] = {
				type: "method",
				methods: sign.map((sign$1) => buildDefinition(sign$1)),
				optional: sign.some((sign$1) => !!sign$1.type.optional)
			};
			for (const [key, value] of Object.entries(properties.properties)) {
				const referenced = value.value ? yield* resolveTSReferencedType(value.value) : void 0;
				definitions[key] = {
					type: "property",
					addByAPI: false,
					value: referenced && !isTSNamespace(referenced) ? buildDefinition(referenced) : void 0,
					optional: value.optional,
					signature: buildDefinition(value.signature)
				};
			}
			return ok(definitions);
		});
	}
	function resolveDefinitions(typeDeclRaw$1) {
		return safeTry(async function* () {
			let resolved = (yield* resolveTSReferencedType(typeDeclRaw$1)) || typeDeclRaw$1;
			let builtInTypesHandler;
			if (resolved && !isTSNamespace(resolved) && resolved.type.type === "TSTypeReference" && resolved.type.typeName.type === "Identifier") {
				const typeName = resolved.type.typeName.name;
				let type;
				if (typeName in builtInTypesHandlers) {
					builtInTypesHandler = builtInTypesHandlers[typeName];
					type = builtInTypesHandler.handleType(resolved.type);
				}
				if (type) resolved = yield* resolveTSReferencedType({
					type,
					scope: resolved.scope
				});
			}
			if (!resolved || isTSNamespace(resolved)) return err(new TransformError("Cannot resolve TS definition."));
			const { type: definitionsAst, scope } = resolved;
			if (definitionsAst.type === "TSIntersectionType") return resolveIntersection(definitionsAst, scope);
			else if (definitionsAst.type === "TSUnionType") return resolveUnion(definitionsAst, scope);
			else if (definitionsAst.type !== "TSInterfaceDeclaration" && definitionsAst.type !== "TSTypeLiteral" && definitionsAst.type !== "TSMappedType") return definitionsAst.type === "TSTypeReference" ? err(new TransformError(`Cannot resolve TS type: ${resolveIdentifier(definitionsAst.typeName).join(".")}`)) : err(new TransformError(`Cannot resolve TS definition: ${definitionsAst.type}`));
			let properties = yield* resolveTSProperties({
				scope,
				type: definitionsAst
			});
			if (builtInTypesHandler?.handleTSProperties) properties = builtInTypesHandler.handleTSProperties(properties);
			return ok({
				definitions: yield* resolveNormal(properties),
				definitionsAst: buildDefinition({
					scope,
					type: definitionsAst
				})
			});
		});
	}
	function resolveDefaults(defaultsAst) {
		if (!defaultsAst) return {};
		if (!(defaultsAst.type === "ObjectExpression" && isStaticObjectKey(defaultsAst))) return { defaultsAst };
		const defaults = resolveObjectExpression(defaultsAst);
		if (!defaults) return { defaultsAst };
		return {
			defaults,
			defaultsAst
		};
	}
}
function buildNewProp(name, value, optional) {
	const key = resolveString(name);
	const signature = `${name}${optional ? "?" : ""}: ${value}`;
	const valueAst = babelParse(`type T = (${value})`, "ts").body[0].typeAnnotation.typeAnnotation;
	const signatureAst = babelParse(`interface T {${signature}}`, "ts").body[0].body.body[0];
	return {
		key,
		signature,
		signatureAst,
		valueAst
	};
}
function buildDefinition({ type, scope }) {
	return {
		code: resolveTSScope(scope).file.content.slice(type.start, type.end),
		ast: type,
		scope
	};
}

//#endregion
//#region src/vue/analyze.ts
function analyzeSFC(s, sfc) {
	return safeTry(async function* () {
		if (!sfc.scriptSetup) return err(new TransformError("<script> is not supported, only <script setup>."));
		const { scriptSetup } = sfc;
		const body = babelParse(scriptSetup.content, sfc.scriptSetup.lang || "js").body;
		const offset = scriptSetup.loc.start.offset;
		const file = {
			kind: "file",
			filePath: sfc.filename,
			content: scriptSetup.content,
			ast: body
		};
		let props;
		let emits;
		for (const node of body) if (node.type === "ExpressionStatement") {
			yield* processDefineProps({
				statement: node,
				defineProps: node.expression
			});
			yield* processWithDefaults({
				statement: node,
				withDefaults: node.expression
			});
			yield* processDefineEmits({
				statement: node,
				defineEmits: node.expression
			});
		} else if (node.type === "VariableDeclaration" && !node.declare) for (const decl of node.declarations) {
			if (!decl.init) continue;
			yield* processDefineProps({
				statement: node,
				defineProps: decl.init,
				declId: decl.id
			});
			yield* processWithDefaults({
				statement: node,
				withDefaults: decl.init,
				declId: decl.id
			});
			yield* processDefineEmits({
				statement: node,
				defineEmits: decl.init,
				declId: decl.id
			});
		}
		return ok({
			props,
			emits
		});
		function processDefineProps({ defineProps, declId, statement, withDefaultsAst, defaultsDeclRaw }) {
			return safeTry(async function* () {
				if (!isCallOf(defineProps, DEFINE_PROPS) || props) return ok(false);
				const typeDeclRaw = defineProps.typeParameters?.params[0];
				if (typeDeclRaw) props = yield* handleTSPropsDefinition({
					s,
					file,
					sfc,
					offset,
					definePropsAst: defineProps,
					typeDeclRaw,
					withDefaultsAst,
					defaultsDeclRaw,
					statement,
					declId
				});
				else return ok(false);
				return ok(true);
			});
		}
		function processWithDefaults({ withDefaults, declId, statement: stmt }) {
			if (!isCallOf(withDefaults, WITH_DEFAULTS)) return okAsync(false);
			if (!isCallOf(withDefaults.arguments[0], DEFINE_PROPS)) return errAsync(new TransformError(`${WITH_DEFAULTS}: first argument must be a ${DEFINE_PROPS} call.`));
			return processDefineProps({
				defineProps: withDefaults.arguments[0],
				declId,
				statement: stmt,
				withDefaultsAst: withDefaults,
				defaultsDeclRaw: withDefaults.arguments[1]
			});
		}
		function processDefineEmits({ defineEmits, declId, statement }) {
			return safeTry(async function* () {
				if (!isCallOf(defineEmits, DEFINE_EMITS) || emits) return ok(false);
				const typeDeclRaw = defineEmits.typeParameters?.params[0];
				if (typeDeclRaw) emits = yield* handleTSEmitsDefinition({
					s,
					file,
					sfc,
					offset,
					defineEmitsAst: defineEmits,
					typeDeclRaw,
					statement,
					declId
				});
				else return ok(false);
				return ok(true);
			});
		}
	});
}

//#endregion
export { DefinitionKind, UNKNOWN_TYPE, analyzeSFC, attachNodeLoc, checkForTSProperties, genRuntimePropDefinition, getTSFile, getTSPropertiesKeys, handleTSEmitsDefinition, handleTSPropsDefinition, inferRuntimeType, isSupportedForTSReferencedType, isTSDeclaration, isTSNamespace, mergeTSProperties, namespaceSymbol, parseSFC, resolveDts, resolveDtsHMR, resolveMaybeTSUnion, resolveTSIndexedAccessType, resolveTSLiteralType, resolveTSNamespace, resolveTSProperties, resolveTSReferencedType, resolveTSScope, resolveTSTemplateLiteral, resolveTSTypeOperator, resolveTypeElements, tsFileCache };