import { ComponentNode, NodeTransform, PlainElementNode, SlotOutletNode, TemplateNode, TransformContext } from "@vue/compiler-core";

//#region src/core/transformer.d.ts
type Prefix = "::" | "$" | "*";
interface Options {
  /**
  * @default '$'
  */
  prefix?: Prefix;
}
type NodeElement = PlainElementNode | ComponentNode | SlotOutletNode | TemplateNode;
declare function transformShortVmodel({
  prefix
}?: Options): NodeTransform;
declare function processDirective(node: NodeElement): void;
declare function processAttribute(prefix: string, node: NodeElement, context: TransformContext): void;
//#endregion
export { Options, Prefix, processAttribute, processDirective, transformShortVmodel };