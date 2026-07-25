import { CustomBlocks, MAIN_TEMPLATE, QUERY_NAMED_TEMPLATE, QUERY_TEMPLATE, QUERY_TEMPLATE_MAIN, TemplateContent } from "./index-Dgmp4CcH.js";
import { CodeTransform, MagicStringAST } from "@vue-macros/common";
import { ElementNode, NodeTransform, RootNode } from "@vue/compiler-dom";
import { Program } from "@babel/types";

//#region src/core/utils.d.ts
declare function getChildrenLocation(node: ElementNode): [number, number] | undefined;
interface VueQuery {
  vue?: boolean;
  src?: string;
  type?: "script" | "template" | "style" | "custom";
  index?: number;
  lang?: string;
  raw?: boolean;
  url?: boolean;
  scoped?: boolean;
}
/**
* Copy from https://github.com/vitejs/vite-plugin-vue/blob/797e424e46600c93fa76a4ef8befc08ef6b5abdb/packages/plugin-vue/src/utils/query.ts#L12
*/
declare function parseVueRequest(id: string): {
  filename: string;
  query: VueQuery;
};
//#endregion
//#region src/core/index.d.ts
declare function transformTemplateIs(s: MagicStringAST): NodeTransform;
declare function preTransform(code: string, id: string, templateContent: TemplateContent): CodeTransform | undefined;
declare function preTransformMainTemplate({
  s,
  root,
  node,
  id,
  templateContent
}: {
  s: MagicStringAST;
  root: RootNode;
  node: ElementNode;
  id: string;
  templateContent: TemplateContent;
}): void;
declare function postTransform(code: string, id: string, customBlocks: CustomBlocks): CodeTransform | undefined;
declare function postTransformMainEntry(program: Program, id: string, customBlocks: CustomBlocks): void;
//#endregion
export { MAIN_TEMPLATE, QUERY_NAMED_TEMPLATE, QUERY_TEMPLATE, QUERY_TEMPLATE_MAIN, VueQuery, getChildrenLocation, parseVueRequest, postTransform, postTransformMainEntry, preTransform, preTransformMainTemplate, transformTemplateIs };