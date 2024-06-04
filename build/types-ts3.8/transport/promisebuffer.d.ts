export interface PromiseBuffer<T> {
    $: Array<PromiseLike<T>>;
    add(taskProducer: () => PromiseLike<T>): PromiseLike<T>;
    drain(timeout?: number): PromiseLike<boolean>;
}
export declare function makePromiseBuffer<T>(limit?: number): PromiseBuffer<T>;
//# sourceMappingURL=promisebuffer.d.ts.map
