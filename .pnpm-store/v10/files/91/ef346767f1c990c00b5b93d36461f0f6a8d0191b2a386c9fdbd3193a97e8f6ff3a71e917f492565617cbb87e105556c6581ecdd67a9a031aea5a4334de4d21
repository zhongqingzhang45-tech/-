import { ConstantTypes, NodeTransform } from "@vue/compiler-core";

//#region src/core/transformer.d.ts
interface Options {
  /**
  * @default '!'
  */
  negativePrefix?: string;
}
declare function transformBooleanProp({
  negativePrefix,
  constType
}?: Options & {
  constType?: ConstantTypes;
}): NodeTransform;
//#endregion
export { Options, transformBooleanProp };