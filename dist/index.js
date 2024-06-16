import { PubSubAsyncIterator } from './pub-sub-async-iterator.js';
export class PostgresPubSub {
    constructor(subscriber) {
        this.pgListen = subscriber;
    }
    pgListen;
    subscriptions = {};
    subIdCounter = 0n;
    subscribe(triggerName, onMessage) {
        this.pgListen.notifications.on(triggerName, onMessage);
        ++this.subIdCounter;
        this.subscriptions[this.subIdCounter.toString()] = [triggerName, onMessage];
        return this.subIdCounter;
    }
    unsubscribeIds(subscriptionIds) {
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
    asyncIterator(triggers) {
        return new PubSubAsyncIterator(this, Array.isArray(triggers) ? triggers : [triggers]);
    }
}
//# sourceMappingURL=index.js.map