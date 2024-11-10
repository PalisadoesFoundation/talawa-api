import type { Readable } from "node:stream";

/**
 * Type of the publish and subscribe module used for publishing and subscribing to talawa api events.
 */
export type PubSub = {
	/**
	 * This method is used to publish an event.
	 */
	publish<TKey extends Extract<keyof PubSubPublishArgsByKey, string>>(
		event: {
			topic: TKey;
			payload: PubSubPublishArgsByKey[TKey];
		},
		callback?: () => void,
	): void;
	/**
	 * This method is used to subscribe to events.
	 */
	subscribe<TKey extends Extract<keyof PubSubPublishArgsByKey, string>>(
		topics: TKey | TKey[],
	): Promise<Readable & AsyncIterableIterator<PubSubPublishArgsByKey[TKey]>>;
};

// This file is to be used to define the types for making the event based publish/subscribe module used in the graphql resolvers type-safe.

type EventIdentifier = string;

type EventPayload = unknown;

/**
 * Type of the talawa api events to be published or subscribed to and the values they will resolve to. `EventIdentifier` and `EventPayload` are placeholder values to showcase the usage of this type. This would need to be manually maintained and extended with additional event identifiers and corresponding payloads as more graphql subscriptions are added to talawa api. More information at this link: {@link https://the-guild.dev/graphql/yoga-server/docs/features/subscriptions#topics}
 */
export type PubSubPublishArgsByKey = {
	[key: EventIdentifier]: EventPayload;
};
