import { AxisType } from './Axis';
import { EngineType } from './Engine';
import { NodeHandlerType } from './NodeHandler';
import { OptionsType } from './Options';
import { OptionsHandlerType } from './OptionsHandler';
export type SsrHandlerType = {
    getStyles: (containerSelector: string, slidesSelector?: string) => string;
};
export declare function SsrHandler(container: HTMLElement, axis: AxisType, nodeHandler: NodeHandlerType, options: OptionsType, mergeOptions: OptionsHandlerType['mergeOptions'], createEngine: (options: OptionsType, container: HTMLElement, slides: HTMLElement[]) => EngineType): SsrHandlerType;
