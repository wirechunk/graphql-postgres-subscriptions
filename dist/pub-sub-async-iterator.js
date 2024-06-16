// Based on https://github.com/davidyaha/graphql-redis-subscriptions/blob/master/src/pubsub-async-iterator.ts
export class PubSubAsyncIterator {
    constructor(pubsub, eventNames) {
        this.engine = pubsub;
        this.pullQueue = [];
        this.pushQueue = [];
        this.listening = true;
        this.eventNames = eventNames;
    }
    async next() {
        this.subscribeAll();
        return this.listening ? this.pullValue() : this.return();
    }
    async return() {
        this.emptyQueue();
        return { value: undefined, done: true };
    }
    async throw(error) {
        this.emptyQueue();
        return Promise.reject(error);
    }
    [Symbol.asyncIterator]() {
        return this;
    }
    pullQueue;
    pushQueue;
    eventNames;
    // subscriptionIds includes only the IDs of the subscriptions that this specific PubSubAsyncIterator has created.
    // The PostgresPubSub instance has its own list of subscriptions, which includes all subscriptions from the
    // underlying socket.
    subscriptionIds;
    listening;
    engine;
    pushValue(event) {
        this.subscribeAll();
        if (this.pullQueue.length > 0) {
            this.pullQueue.shift()({ value: event, done: false });
        }
        else {
            this.pushQueue.push(event);
        }
    }
    pullValue() {
        return new Promise((resolve) => {
            if (this.pushQueue.length !== 0) {
                resolve({ value: this.pushQueue.shift(), done: false });
            }
            else {
                this.pullQueue.push(resolve);
            }
        });
    }
    emptyQueue() {
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
    subscribeAll() {
        if (!this.subscriptionIds) {
            this.subscriptionIds = this.eventNames.map((eventName) => this.engine.subscribe(eventName, this.pushValue.bind(this)));
        }
    }
}
//# sourceMappingURL=pub-sub-async-iterator.js.map