import { AxisType } from './Axis.js';
import { NumberStoreInputType } from './utils.js';
export type TranslateType = {
    set: (translate: string) => void;
    get: (input: NumberStoreInputType) => string;
    to: (input: NumberStoreInputType) => void;
    setIsScrolling: (active: boolean) => void;
    toggleActive: (active: boolean) => void;
    clear: () => void;
};
export declare function Translate(axis: AxisType, node: HTMLElement, unit?: 'px' | '%'): TranslateType;
