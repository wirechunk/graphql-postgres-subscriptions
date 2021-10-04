import { PubSub } from "graphql-subscriptions";

export class PostgresPubSub extends PubSub {
	constructor(options?: {});
	pgListen: any;
	triggers: any;
	events: any;
	commonMessageHandler: any;
	connected: boolean;
	connect(): Promise<void>;
	close(): Promise<void>;
	asyncIteratorPromised<T>(triggers: string | string[]): Promise<AsyncIterator<T>>;
}
