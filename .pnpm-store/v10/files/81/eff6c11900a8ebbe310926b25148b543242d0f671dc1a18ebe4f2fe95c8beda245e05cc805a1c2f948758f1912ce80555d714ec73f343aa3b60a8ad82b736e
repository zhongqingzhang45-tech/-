type TypedArray = BigInt64Array | BigUint64Array | Float32Array | Float64Array | Int8Array | Int16Array | Int32Array | Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array;
type AnyFunction = (...args: any[]) => any;

type UncurryThis<T extends AnyFunction> = (self: T extends (this: infer S, ...args: any[]) => any ? S : unknown, ...args: Parameters<T>) => ReturnType<T>;
declare const uncurryThis: <T extends AnyFunction>(fn: T) => UncurryThis<T>;

declare const TypedArrayPrototype: TypedArray;

interface EsShimProp<I> {
    implementation: I;
    getPolyfill(): I;
    shim(): I;
}
declare function makeEsShim<T extends object, I>(shim: T, implementation: I): asserts shim is T & EsShimProp<I>;

interface DefineEsShim<T, I> {
    implementation: T;
    polyfill(): T;
    shim(): T;
    auto(): void;
    index(): I;
}
declare function defineEsShim<T extends AnyFunction>(impl: T, isStaticMethod?: false, main?: null): DefineEsShim<T, UncurryThis<T>>;
declare function defineEsShim<T>(impl: T, isStaticMethod?: false, main?: null): DefineEsShim<T, T>;
declare function defineEsShim<T>(impl: T, isStaticMethod: true, main?: null): DefineEsShim<T, T>;
declare function defineEsShim<T, I>(impl: T, isStaticMethod: boolean, main: I): DefineEsShim<T, I>;

export { type AnyFunction, type DefineEsShim, type EsShimProp, type TypedArray, TypedArrayPrototype, type UncurryThis, defineEsShim, makeEsShim, uncurryThis };
