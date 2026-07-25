import { Segment, Segment as Segment$1 } from "muggle-string";
import * as typescript28 from "typescript";
import { CodeInformation, CodeMapping, Mapping, VirtualCode, VirtualCode as VirtualCode$1 } from "@volar/language-core";

//#region src/virtual-code.d.ts
declare const allCodeFeatures: {
  completion: boolean;
  format: boolean;
  navigation: boolean;
  semantic: boolean;
  structure: boolean;
  verification: boolean;
};
declare class TsmVirtualCode implements VirtualCode$1 {
  readonly filePath: string;
  readonly ast: typescript28.SourceFile;
  readonly languageId: 'typescript' | 'typescriptreact' | ({} & string);
  private readonly plugins;
  id: string;
  mappings: CodeMapping[];
  embeddedCodes: VirtualCode$1[];
  private _codes;
  codes: Codes;
  snapshot: typescript28.IScriptSnapshot;
  source: 'script' | 'scriptSetup' | undefined;
  linkedCodeMappings: Mapping[];
  lang: 'ts' | 'tsx' | ({} & string);
  constructor(filePath: string, ast: typescript28.SourceFile, languageId?: 'typescript' | 'typescriptreact' | ({} & string), plugins?: TsmLanguagePlugin[]);
}
declare function buildMappings<T>(chunks: Code[]): Mapping<T>[];
//#endregion
//#region src/types.d.ts
type FilterPattern = Array<string | RegExp> | string | RegExp | null;
type Options = {
  include?: FilterPattern;
  exclude?: FilterPattern;
  plugins?: Plugin[];
};
type Plugin = FactoryReturn | TsmLanguagePlugin | TsmLanguagePlugin[];
type TsmLanguagePlugin = {
  name: string;
  enforce?: 'pre' | 'post';
  resolveVirtualCode?: (virtualCode: TsmVirtualCode) => void;
};
type Context = {
  ts: typeof typescript28;
  compilerOptions: typescript28.CompilerOptions;
  vueCompilerOptions?: any;
};
type Factory<UserOptions, Nested extends boolean = boolean> = (context: Context, userOptions: UserOptions) => Nested extends true ? Array<TsmLanguagePlugin> : TsmLanguagePlugin;
type FactoryReturn<Nested extends boolean = boolean> = (context: Context) => Nested extends true ? Array<TsmLanguagePlugin> : TsmLanguagePlugin;
type PluginReturn<UserOptions, Nested extends boolean = boolean> = (...args: undefined extends UserOptions ? [UserOptions] | [] : [UserOptions]) => FactoryReturn<Nested>;
type Code = string | [text: string, sourceOffset: number, data?: CodeInformation] | Segment$1<CodeInformation>;
interface Codes extends Array<Code> {
  replaceRange: (startOffset: number, endOffset: number, ...newSegments: Code[]) => boolean;
  replace: (pattern: string | RegExp, ...replacers: (Code | ((match: string) => Segment$1<CodeInformation>))[]) => void;
  replaceAll: (pattern: string | RegExp, ...replacers: (Code | ((match: string) => Segment$1<CodeInformation>))[]) => void;
  toString: () => string;
  getLength: () => number;
}
//#endregion
//#region src/define.d.ts
declare function defineConfig(config: Options): Options;
declare function createPlugin<UserOptions, Nested extends boolean = boolean>(factory: Factory<UserOptions, Nested>): PluginReturn<UserOptions, Nested>;
//#endregion
//#region src/muggle-string.d.ts
declare const resolveSegment: (segment: Code, source?: string) => Segment<CodeInformation>;
declare function replaceRange(segments: Code[], startOffset: number, endOffset: number, ...newSegments: Code[]): boolean;
declare function replaceSourceRange(segments: Code[], source: string | undefined, startOffset: number, endOffset: number, ...newSegments: Code[]): boolean;
declare function toString(segments: Code[]): string;
declare function getLength(segments: Code[]): number;
declare function replace(segments: Code[], pattern: string | RegExp, ...replacers: (Code | ((match: string) => Segment<CodeInformation>))[]): void;
declare function replaceAll(segments: Code[], pattern: string | RegExp, ...replacers: (Code | ((match: string) => Segment<CodeInformation>))[]): void;
declare function codesProxyHandler(codes: Code[], source?: string): Codes;
//#endregion
//#region src/vue.d.ts
declare function getStart(node: typescript28.Node | typescript28.NodeArray<typescript28.Node>, ast?: typescript28.SourceFileLike | undefined, ts?: typeof typescript28): number;
declare function getText(node: typescript28.Node, ast?: typescript28.SourceFileLike, ts?: typeof typescript28): string;
declare function isJsxExpression(node?: typescript28.Node): node is typescript28.JsxExpression;
//#endregion
//#region src/ast.d.ts
/**
 * Modified from https://github.com/vuejs/core/blob/main/packages/compiler-core/src/babelUtils.ts
 *
 * https://github.com/vuejs/core/blob/main/LICENSE
 */
type Node = typescript28.Node;
type Identifier = typescript28.Identifier;
declare const TS_NODE_TYPES: number[];
declare function isReferencedIdentifier(ts: typeof typescript28, id: Identifier, parent: Node | null | undefined): boolean;
declare function isReferenced(ts: typeof typescript28, node: Node, parent: Node): boolean;
/**
 * Checks if the given node is a function type.
 *
 * @param ts The TypeScript module.
 * @param node - The node to check.
 * @returns True if the node is a function type, false otherwise.
 */
declare function isFunctionType(ts: typeof typescript28, node: Node | undefined | null): node is typescript28.FunctionDeclaration | typescript28.FunctionExpression | typescript28.MethodDeclaration | typescript28.ArrowFunction;
declare function walkIdentifiers(ts: typeof typescript28, root: Node, onIdentifier: (node: Identifier, parent: Node | null | undefined, parentStack: Node[], isReference: boolean, isLocal: boolean) => void, includeAll?: boolean, parentStack?: Node[], knownIds?: Record<string, number>): void;
declare function walkFunctionParams(ts: typeof typescript28, node: typescript28.ArrowFunction | typescript28.FunctionExpression | typescript28.FunctionDeclaration | typescript28.MethodDeclaration, onIdent: (id: Identifier) => void): void;
/**
 * Extract identifiers of the given node.
 * @param ts The TypeScript module.
 * @param node The node to extract.
 * @param identifiers The array to store the extracted identifiers.
 * @see https://github.com/vuejs/core/blob/1f6a1102aa09960f76a9af2872ef01e7da8538e3/packages/compiler-core/src/babelUtils.ts#L208
 */
declare function extractIdentifiers(ts: typeof typescript28, node: Node, identifiers?: Identifier[]): Identifier[];
declare function walkBlockDeclarations(ts: typeof typescript28, block: typescript28.Block | typescript28.SourceFile, onIdent: (node: Identifier) => void): void;
declare function isForStatement(ts: typeof typescript28, stmt: Node): stmt is typescript28.ForOfStatement | typescript28.ForInStatement | typescript28.ForStatement;
declare function walkForStatement(ts: typeof typescript28, stmt: typescript28.ForStatement | typescript28.ForOfStatement | typescript28.ForInStatement, isVar: boolean, onIdent: (id: Identifier) => void): void;
//#endregion
export { Code, CodeInformation, Codes, Context, Factory, FactoryReturn, Options, Plugin, PluginReturn, type Segment, TS_NODE_TYPES, TsmLanguagePlugin, TsmVirtualCode, VirtualCode, allCodeFeatures, buildMappings, codesProxyHandler, createPlugin, defineConfig, extractIdentifiers, getLength, getStart, getText, isForStatement, isFunctionType, isJsxExpression, isReferenced, isReferencedIdentifier, replace, replaceAll, replaceRange, replaceSourceRange, resolveSegment, toString, walkBlockDeclarations, walkForStatement, walkFunctionParams, walkIdentifiers };