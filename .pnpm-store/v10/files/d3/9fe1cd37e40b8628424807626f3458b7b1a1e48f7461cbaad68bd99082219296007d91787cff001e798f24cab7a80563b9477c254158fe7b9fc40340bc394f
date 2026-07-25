import { AxisType } from './Axis.js';
import { EngineType } from './Engine.js';
import { NodeHandlerType } from './NodeHandler.js';
import { OptionsType } from './Options.js';
import { OptionsHandlerType } from './OptionsHandler.js';
export type SsrHandlerType = {
    getStyles: (containerSelector: string, slidesSelector?: string) => string;
};
export declare function SsrHandler(container: HTMLElement, axis: AxisType, nodeHandler: NodeHandlerType, options: OptionsType, mergeOptions: OptionsHandlerType['mergeOptions'], createEngine: (options: OptionsType, container: HTMLElement, slides: HTMLElement[]) => EngineType): SsrHandlerType;
