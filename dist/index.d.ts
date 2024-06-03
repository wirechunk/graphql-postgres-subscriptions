import type { Subscriber as PgListenSubscriber } from 'pg-listen';
export declare class PostgresPubSub {
  constructor(subscriber: PgListenSubscriber);
  private readonly pgListen;
  private subscriptions;
  private subIdCounter;
  subscribe(triggerName: string, onMessage: (...args: any[]) => void): bigint;
  unsubscribeIds(subscriptionIds: bigint[]): void;
  close(): void;
  asyncIterator<T>(triggers: string | string[]): AsyncIterableIterator<T>;
}
