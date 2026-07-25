import { AttachedScope, CodeTransform } from "@vue-macros/common";
import { Node } from "@babel/types";
import { HmrContext, ModuleNode } from "vite";

//#region src/core/constants.d.ts
declare const SETUP_COMPONENT_ID_SUFFIX = "-setup-component-";
declare const SETUP_COMPONENT_ID_REGEX: RegExp;
declare const SETUP_COMPONENT_SUB_MODULE: RegExp;
declare const SETUP_COMPONENT_TYPE = "SetupFC";
//#endregion
//#region src/core/sub-module.d.ts
declare function isSubModule(id: string): boolean;
declare function getMainModule(subModule: string, root: string): string;
//#endregion
//#region src/core/index.d.ts
interface FileContextComponent {
  code: string;
  body: string;
  node: Node;
  scopes: string[];
}
interface FileContext {
  components: FileContextComponent[];
  imports: string[];
}
type SetupComponentContext = Record<string, FileContext>;
declare function scanSetupComponent(code: string, id: string): FileContext | undefined;
declare function transformSetupComponent(code: string, _id: string, ctx: SetupComponentContext): CodeTransform | undefined;
declare function loadSetupComponent(virtualId: string, ctx: SetupComponentContext, root: string): string | undefined;
declare function hotUpdateSetupComponent({
  file,
  modules,
  read
}: HmrContext, ctx: SetupComponentContext): Promise<ModuleNode[] | undefined>;
declare function transformPost(code: string, _id: string): CodeTransform | undefined;
declare function getScopeDecls(scope: AttachedScope | undefined): string[];
//#endregion
export { SETUP_COMPONENT_ID_REGEX, SETUP_COMPONENT_ID_SUFFIX, SETUP_COMPONENT_SUB_MODULE, SETUP_COMPONENT_TYPE, SetupComponentContext, getMainModule, getScopeDecls, hotUpdateSetupComponent, isSubModule, loadSetupComponent, scanSetupComponent, transformPost, transformSetupComponent };