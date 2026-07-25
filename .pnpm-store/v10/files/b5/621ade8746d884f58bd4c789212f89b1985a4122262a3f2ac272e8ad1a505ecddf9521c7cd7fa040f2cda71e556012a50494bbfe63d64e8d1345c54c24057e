import { CounterType } from './Counter';
import { SlideLooperType } from './SlideLooper';
import { ScrollSnapListType } from './ScrollSnapList';
import { TranslateType } from './Translate';
import { NumberStoreType } from './NumberStore';
import { EventHandlerType } from './EventHandler';
export type ScrollOptimizeEventType = {
    slidesInView: number[];
    slidesLeftView: number[];
};
export type ScrollOptimizerType = {
    optimize: (settle?: boolean) => void;
};
export declare function ScrollOptimizer(viewSize: number, contentSize: number, slideSizes: number[], snaps: number[], loop: boolean, indexCurrent: CounterType, scrollSnapList: ScrollSnapListType, offsetlocation: NumberStoreType, target: NumberStoreType, slideTranslates: TranslateType[], slideLooper: SlideLooperType, eventHandler: EventHandlerType): ScrollOptimizerType;
