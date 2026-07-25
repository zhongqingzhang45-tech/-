import { CodeTransform, MagicStringAST } from "@vue-macros/common";
import * as t from "@babel/types";

//#region src/core/utils.d.ts
type Impl = (ctx: {
  s: MagicStringAST;
  offset: number;
  resolveTSType: (type: t.TSType) => Promise<string[] | undefined>;
}) => {
  walkCall: (node: t.CallExpression, parent?: t.Node | null) => string;
  genRuntimeProps: (isProduction: boolean) => Promise<string | undefined>;
};
declare function stringifyArray(strs: string[]): string;
//#endregion
//#region src/core/kevin-edition.d.ts
declare const kevinEdition: Impl;
//#endregion
//#region src/core/johnson-edition.d.ts
declare const johnsonEdition: Impl;
//#endregion
//#region src/core/index.d.ts
declare const PROPS_VARIABLE_NAME: "__MACROS_props";
type Edition = "kevinEdition" | "johnsonEdition";
declare function transformDefineProp(code: string, id: string, edition?: Edition, isProduction?: boolean): Promise<CodeTransform | undefined>;
//#endregion
export { Edition, Impl, PROPS_VARIABLE_NAME, johnsonEdition, kevinEdition, stringifyArray, transformDefineProp };