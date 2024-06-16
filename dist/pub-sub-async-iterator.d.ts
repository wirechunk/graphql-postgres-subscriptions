import type { PostgresPubSub } from './index';
export declare class PubSubAsyncIterator<T> implements AsyncIterableIterator<T> {
    constructor(pubsub: PostgresPubSub, eventNames: string[]);
    next(): Promise<IteratorResult<any, any>>;
    return(): Promise<{
        value: unknown;
        done: true;
    }>;
    throw(error: unknown): Promise<never>;
    [Symbol.asyncIterator](): this;
    private pullQueue;
    private pushQueue;
    private eventNames;
    private subscriptionIds;
    private listening;
    private engine;
    private pushValue;
    private pullValue;
    private emptyQueue;
    private subscribeAll;
}
