const { PubSub } = require("graphql-subscriptions");
const pgListen = require("pg-listen");
const {
  eventEmitterAsyncIterator
} = require("./event-emitter-to-async-iterator");

const defaultCommonMessageHandler = message => message;

class PostgresPubSub extends PubSub {
  constructor(options = {}) {
    const { commonMessageHandler, ...pgOptions } = options;
    super();
    const pgListenOptions = {
      native: options.native,
      paranoidChecking: options.paranoidChecking,
      retryInterval: options.retryInterval,
      retryLimit: options.retryLimit,
      retryTimeout: options.retryTimeout,
      parse: options.parse,
      serialize: options.serialize,
    }
    this.pgListen = pgListen(pgOptions, pgListenOptions);
    this.triggers = (pgOptions.topics || []).concat(['error']);
    this.ee = this.pgListen.notifications;
    this.events = this.pgListen.events;
    this.subscriptions = {};
    this.subIdCounter = 0;
    this.commonMessageHandler = commonMessageHandler || defaultCommonMessageHandler;
    this.connected = false;
  }

  async connect() {
    await this.pgListen.connect();
    await Promise.all(this.triggers.map((eventName) => {
      return this.pgListen.listenTo(eventName);
    }));
    this.connected = true;
  }

  async publish(triggerName, payload) {
    if (!this.connected) {
      console.log(`attempted to publish a ${triggerName} event via pubsub, but client is not yet connected`)
      return false;
    }

    try {
      await this.pgListen.notify(triggerName, payload);
    } catch (e) {
      this.pgListen.events.emit('error', e)
    }
    return true;
  }
  async subscribe(triggerName, onMessage) {
    const callback = message => {
      onMessage(
        message instanceof Error
          ? message
          : this.commonMessageHandler(message)
      );
    };

    await this.pgListen.listenTo(triggerName);
    this.pgListen.notifications.on(triggerName, callback);
    this.subIdCounter = this.subIdCounter + 1;
    this.subscriptions[this.subIdCounter] = [triggerName, callback];
    return Promise.resolve(this.subIdCounter);
  }
  async unsubscribe(subId) {
    if (!this.connected) {
      console.log('attempted to publish an event via pubsub, but client is not yet connected')
    }

    const [triggerName, onMessage] = this.subscriptions[subId];
    delete this.subscriptions[subId];
    this.pgListen.unlisten(triggerName);
  }

  asyncIterator(triggers) {
    return eventEmitterAsyncIterator(
      this.pgListen,
      triggers,
      this.commonMessageHandler
    );
  }
}

module.exports = { PostgresPubSub };
