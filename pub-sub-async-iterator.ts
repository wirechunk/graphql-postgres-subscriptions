import type { PostgresPubSub } from './index';

// Based on https://github.com/davidyaha/graphql-redis-subscriptions/blob/master/src/pubsub-async-iterator.ts
export class PubSubAsyncIterator<T> implements AsyncIterableIterator<T> {
  constructor(pubsub: PostgresPubSub, eventNames: string[]) {
    this.engine = pubsub;
    this.pullQueue = [];
    this.pushQueue = [];
    this.listening = true;
    this.eventNames = eventNames;
  }

  public async next() {
    this.subscribeAll();
    return this.listening ? this.pullValue() : this.return();
  }

  public async return(): Promise<{ value: unknown; done: true }> {
    this.emptyQueue();
    return { value: undefined, done: true };
  }

  public async throw(error: unknown): Promise<never> {
    this.emptyQueue();
    return Promise.reject(error);
  }

  public [Symbol.asyncIterator]() {
    return this;
  }

  private pullQueue: Array<(data: { value: unknown; done: boolean }) => void>;
  private pushQueue: any[];
  private eventNames: string[];
  // subscriptionIds includes only the IDs of the subscriptions that this specific PubSubAsyncIterator has created.
  // The PostgresPubSub instance has its own list of subscriptions, which includes all subscriptions from the
  // underlying socket.
  private subscriptionIds: bigint[] | undefined;
  private listening: boolean;
  private engine: PostgresPubSub;

  private pushValue(event: unknown) {
    this.subscribeAll();
    if (this.pullQueue.length > 0) {
      this.pullQueue.shift()!({ value: event, done: false });
    } else {
      this.pushQueue.push(event);
    }
  }

  private pullValue(): Promise<IteratorResult<any>> {
    return new Promise((resolve) => {
      if (this.pushQueue.length !== 0) {
        resolve({ value: this.pushQueue.shift(), done: false });
      } else {
        this.pullQueue.push(resolve);
      }
    });
  }

  private emptyQueue() {
    if (this.listening) {
      this.listening = false;
      if (this.subscriptionIds) {
        this.engine.unsubscribeIds(this.subscriptionIds);
      }
      this.pullQueue.forEach((resolve) => resolve({ value: undefined, done: true }));
      this.pullQueue.length = 0;
      this.pushQueue.length = 0;
    }
  }

  private subscribeAll() {
    if (!this.subscriptionIds) {
      this.subscriptionIds = this.eventNames.map((eventName) =>
        this.engine.subscribe(eventName, this.pushValue.bind(this)),
      );
    }
  }
}
