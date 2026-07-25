import { CounterType } from './Counter.js';
import { SlideLooperType } from './SlideLooper.js';
import { ScrollSnapListType } from './ScrollSnapList.js';
import { TranslateType } from './Translate.js';
import { NumberStoreType } from './NumberStore.js';
import { EventHandlerType } from './EventHandler.js';
export type ScrollOptimizeEventType = {
    slidesInView: number[];
    slidesLeftView: number[];
};
export type ScrollOptimizerType = {
    optimize: (settle?: boolean) => void;
};
export declare function ScrollOptimizer(viewSize: number, contentSize: number, slideSizes: number[], snaps: number[], loop: boolean, indexCurrent: CounterType, scrollSnapList: ScrollSnapListType, offsetlocation: NumberStoreType, target: NumberStoreType, slideTranslates: TranslateType[], slideLooper: SlideLooperType, eventHandler: EventHandlerType): ScrollOptimizerType;
