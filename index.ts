import type { Subscriber as PgListenSubscriber } from 'pg-listen';
import { PubSubAsyncIterator } from './pub-sub-async-iterator.js';

export class PostgresPubSub {
  constructor(subscriber: PgListenSubscriber) {
    this.pgListen = subscriber;
  }

  private readonly pgListen: PgListenSubscriber;
  private subscriptions: {
    [key: string]: [triggerName: string, onMessage: (...args: any[]) => void];
  } = {};
  private subIdCounter: bigint = 0n;

  subscribe(triggerName: string, onMessage: (...args: any[]) => void): bigint {
    this.pgListen.notifications.on(triggerName, onMessage);
    ++this.subIdCounter;
    this.subscriptions[this.subIdCounter.toString()] = [triggerName, onMessage];
    return this.subIdCounter;
  }

  unsubscribeIds(subscriptionIds: bigint[]) {
    for (const subscriptionId of subscriptionIds) {
      const sub = this.subscriptions[subscriptionId.toString()];
      if (sub) {
        this.pgListen.notifications.removeListener(sub[0], sub[1]);
        delete this.subscriptions[subscriptionId.toString()];
      }
    }
  }

  close() {
    for (const [triggerName, onMessage] of Object.values(this.subscriptions)) {
      this.pgListen.notifications.removeListener(triggerName, onMessage);
    }
    this.subscriptions = {};
  }

  asyncIterator<T>(triggers: string | string[]): AsyncIterableIterator<T> {
    return new PubSubAsyncIterator<T>(this, Array.isArray(triggers) ? triggers : [triggers]);
  }
}
