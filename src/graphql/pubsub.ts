// This file is to be used to define the types for making the usage of event based publish/subscribe module used in the graphql resolvers type-safe.
import type { Readable } from "node:stream";
import type { ChatMessage } from "~/src/graphql/types/ChatMessage/ChatMessage";

/**
 * Type of the publish and subscribe module used for publishing and subscribing to talawa events.
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

type PrimaryKey = string;

/**
 * Map of talawa events where the keys represent identifiers of the events and the values represent the corresponding payloads of the events. More information at this link: {@link https://the-guild.dev/graphql/yoga-server/docs/features/subscriptions#topics}
 */
export type PubSubPublishArgsByKey = {
	[key: `chats.${PrimaryKey}:chat_messages::create`]: ChatMessage;
};
