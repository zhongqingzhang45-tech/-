import { CodeTransform } from "@vue-macros/common";
import { ParserPlugin } from "@babel/parser";
import MagicStringAST$1, { SourceMap } from "magic-string";
import { ImportDefaultSpecifier, ImportNamespaceSpecifier, ImportSpecifier, Program } from "@babel/types";

//#region src/core/sfc.d.ts
declare function transformVueSFC(code: string, id: string): CodeTransform | undefined;
//#endregion
//#region src/core/transform.d.ts
declare function shouldTransform(src: string): boolean;
interface RefTransformOptions {
  filename?: string;
  sourceMap?: boolean;
  parserPlugins?: ParserPlugin[];
  importHelpersFrom?: string;
}
interface RefTransformResults {
  code: string;
  map: SourceMap | null;
  rootRefs: string[];
  importedHelpers: string[];
}
interface ImportBinding {
  local: string;
  imported: string;
  source: string;
  specifier: ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier;
}
declare function transform(src: string, {
  filename,
  sourceMap,
  parserPlugins,
  importHelpersFrom
}?: RefTransformOptions): RefTransformResults;
declare function transformAST(ast: Program, s: MagicStringAST$1, offset?: number, knownRefs?: string[], knownProps?: Record<string, {
  local: string;
  default?: any;
  isConst?: boolean;
}>): {
  rootRefs: string[];
  importedHelpers: string[];
};
//#endregion
export { ImportBinding, RefTransformOptions, RefTransformResults, shouldTransform, transform, transformAST, transformVueSFC };