import { PubSub } from "graphql-subscriptions";
import { withFilter } from "apollo-server-express";
import { SubscriptionResolvers } from "../../types/generatedGraphQLTypes";
import { describe, it, vi, expect } from "vitest";

import { messageSentToDirectChat } from "./messageSentToDirectChat";

const MESSAGE_SENT_TO_DIRECT_CHAT = "MESSAGE_SENT_TO_DIRECT_CHAT";

const context = {
    context: {
      currentUserId: "user1"
    },
    pubsub: {
      asyncIterator: jest.fn().mockReturnValue("asyncIterator")
    }
  };
  
  const payload = {
    messageSentToDirectChat: {
      sender: "user1",
      receiver: "user2"
    }
  };
  
  describe("messageSentToDirectChat Subscription", () => {
    it("should return true if current user is the sender", async () => {
      const withFilterSpy = jest.spyOn(withFilter, "mockImplementation");
      const filterFn = jest.fn().mockReturnValue(true);
  
      withFilterSpy.mockImplementation((subscribeFn, filterFn) => {
        return jest.fn().mockImplementation(() => filterFn(payload, undefined, context));
      });
  
      const result = messageSentToDirectChat.subscribe(undefined, undefined, context);
  
      expect(result).toBe(true);
      expect(filterFn).toHaveBeenCalledWith(payload, undefined, context);
      expect(withFilterSpy).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function)
      );
      expect(context.pubsub.asyncIterator).toHaveBeenCalledWith([MESSAGE_SENT_TO_DIRECT_CHAT]);
    });
  
    it("should return true if current user is the receiver", async () => {
      const withFilterSpy = jest.spyOn(withFilter, "mockImplementation");
      const filterFn = jest.fn().mockReturnValue(true);
      payload.messageSentToDirectChat.sender = "user2";
  
      withFilterSpy.mockImplementation((subscribeFn, filterFn) => {
        return jest.fn().mockImplementation(() => filterFn(payload, undefined, context));
      });
  
      const result = messageSentToDirectChat.subscribe(undefined, undefined, context);
  
      expect(result).toBe(true);
      expect(filterFn).toHaveBeenCalledWith(payload, undefined, context);
      expect(withFilterSpy).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function)
      );
      expect(context.pubsub.asyncIterator).toHaveBeenCalledWith([MESSAGE_SENT_TO_DIRECT_CHAT]);
    });
  
    it("should return false if current user is not the sender or receiver", async () => {
      const withFilterSpy = jest.spyOn(withFilter, "mockImplementation");
      const filterFn = jest.fn().mockReturnValue(true);
      const asyncIteratorFn = jest.fn().mockReturnValue({});
      const context = { pubsub: { asyncIterator: asyncIteratorFn } };
      
      describe("messageSentToDirectChat Subscription", () => {
      beforeEach(() => {
      jest.clearAllMocks();
      });
      
      it("should call asyncIterator with MESSAGE_SENT_TO_DIRECT_CHAT", () => {
      messageSentToDirectChat.subscribe(null, null, context);
      expect(asyncIteratorFn).toHaveBeenCalledWith(
        [MESSAGE_SENT_TO_DIRECT_CHAT]
      );
    });


    it("should call filter with payload, variables, and context", () => {
    messageSentToDirectChat.subscribe(null, null, context);
    const payload = { messageSentToDirectChat: { sender: "1", receiver: "2" } };
    const variables = {};

    const pubsub = {
        asyncIterator: jest.fn().mockReturnValue({
          filter: filterFn,
        }),
      };
      const context = { pubsub, context: { currentUserId: "1" } };
      
      messageSentToDirectChat.subscribe(null, variables, context);
      
      expect(filterFn).toHaveBeenCalledWith(payload, variables, context.context);
    });

    it("should return true if current user is the sender", () => {
    const pubsub = {
    asyncIterator: jest.fn().mockReturnValue({
    filter: filterFn,
    }),
    };
    const context = { pubsub, context: { currentUserId: "1" } };
    const payload = { messageSentToDirectChat: { sender: "1", receiver: "2" } };
    messageSentToDirectChat.subscribe(null, null, context);

expect(filterFn).toHaveReturnedWith(true);
});

it("should return true if current user is the receiver", () => {
const pubsub = {
asyncIterator: jest.fn().mockReturnValue({
filter: filterFn,
}),
};
const context = { pubsub, context: { currentUserId: "2" } };
const payload = { messageSentToDirectChat: { sender: "1", receiver: "2" } };
messageSentToDirectChat.subscribe(null, null, context);

expect(filterFn).toHaveReturnedWith(true);
});

it("should return false if current user is not the sender or receiver", () => {
const pubsub = {
asyncIterator: jest.fn().mockReturnValue({
filter: filterFn,
}),
};
const context = { pubsub, context: { currentUserId: "3" } };
const payload = { messageSentToDirectChat: { sender: "1", receiver: "2" } };
messageSentToDirectChat.subscribe(null, null, context);

expect(filterFn).toHaveReturnedWith(false);
});

});