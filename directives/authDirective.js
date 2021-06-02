const { SchemaDirectiveVisitor } = require('apollo-server-express');
const {
  UnauthenticatedError,
  UnauthorizedError,
  NotFoundError,
} = require('errors');
const { defaultFieldResolver } = require('graphql');
const requestContext = require('talawa-request-context');

const Event = require('../models/Event');
const Group = require('../models/Group');
const GroupChat = require('../models/GroupChat');
const MembershipRequest = require('../models/MembershipRequest');
const Organization = require('../models/Organization');

class AuthenticationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;
    field.resolve = async (root, args, context, info) => {
      const { requires } = this.args;

      if (context.expired)
        throw new UnauthenticatedError(
          requestContext.translate('user.notAuthenticated'),
          'user.notAuthenticated',
          'userAuthentication'
        );
      if (!context.isAuth) {
        throw new UnauthenticatedError(
          requestContext.translate('user.notAuthenticated'),
          'user.notAuthenticated',
          'userAuthentication'
        );
      }
      if (requires === 'Admin' && args.eventId) {
        const event = await Event.findOne({ _id: args.eventId });
        if (!event) {
          throw new NotFoundError(
            requestContext.translate('event.notFound'),
            'event.notFound',
            'event'
          );
        }
        const org = await Organization.findOne({
          _id: event.organization,
        });
        if (!org) {
          throw new NotFoundError(
            requestContext.translate('organization.notFound'),
            'organization.notFound',
            'organization'
          );
        }
        context.org = org;
        const isAdmin = org.admins.includes(context.userId);
        if (!isAdmin) {
          throw new UnauthorizedError(
            requestContext.translate('user.notAuthorized'),
            'user.notAuthorized',
            'userAuthorization'
          );
        }
      }

      if (requires === 'Admin' && args.groupId) {
        const group = await Group.findOne({ _id: args.groupId });
        if (!group) {
          throw new NotFoundError(
            requestContext.translate('group.notFound'),
            'group.notFound',
            'group'
          );
        }
        const org = await Organization.findOne({
          _id: group._doc.organization._id,
        });
        if (!org) {
          throw new NotFoundError(
            requestContext.translate('organization.notFound'),
            'organization.notFound',
            'organization'
          );
        }
        context.org = org;
        const isAdmin = org.admins.includes(context.userId);
        if (!isAdmin) {
          throw new UnauthorizedError(
            requestContext.translate('user.notAuthorized'),
            'user.notAuthorized',
            'userAuthorization'
          );
        }
      }
      if (requires === 'Admin' && args.membershipRequestId) {
        const membershipRequest = await MembershipRequest.findOne({
          _id: args.groupId,
        });
        if (!membershipRequest) {
          throw new NotFoundError(
            requestContext.translate('membershipRequest.notFound'),
            'membershipRequest.notFound',
            'membershipRequest'
          );
        }
        const org = await Organization.findOne({
          _id: membershipRequest.organization,
        });
        if (!org) {
          throw new NotFoundError(
            requestContext.translate('organization.notFound'),
            'organization.notFound',
            'organization'
          );
        }
        context.org = org;
        const isAdmin = org.admins.includes(context.userId);
        if (!isAdmin) {
          throw new UnauthorizedError(
            requestContext.translate('user.notAuthorized'),
            'user.notAuthorized',
            'userAuthorization'
          );
        }
      }
      if (requires === 'Admin' && args.chatId) {
        const chat = await GroupChat.findById(args.chatId);
        if (!chat) {
          throw new NotFoundError(
            requestContext.translate('chat.notFound'),
            'chat.notFound',
            'chat'
          );
        }
        const org = await Organization.findOne({
          _id: chat.organization,
        });
        if (!org) {
          throw new NotFoundError(
            requestContext.translate('organization.notFound'),
            'organization.notFound',
            'organization'
          );
        }
        context.org = org;
        const isAdmin = org.admins.includes(context.userId);
        if (!isAdmin) {
          throw new UnauthorizedError(
            requestContext.translate('user.notAuthorized'),
            'user.notAuthorized',
            'userAuthorization'
          );
        }
      }
      if (requires === 'Admin' && args.organizationId) {
        const org = await Organization.findOne({
          _id: args.organizationId,
        });
        if (!org) {
          throw new NotFoundError(
            requestContext.translate('organization.notFound'),
            'organization.notFound',
            'organization'
          );
        }
        context.org = org;
        const isAdmin = org.admins.includes(context.userId);
        if (!isAdmin) {
          throw new UnauthorizedError(
            requestContext.translate('user.notAuthorized'),
            'user.notAuthorized',
            'userAuthorization'
          );
        }
      }
      if (requires === 'Admin' && args.id) {
        const org = await Organization.findOne({
          _id: args.id,
        });
        if (!org) {
          throw new NotFoundError(
            requestContext.translate('organization.notFound'),
            'organization.notFound',
            'organization'
          );
        }
        context.org = org;
        const isAdmin = org.admins.includes(context.userId);
        if (!isAdmin) {
          throw new UnauthorizedError(
            requestContext.translate('user.notAuthorized'),
            'user.notAuthorized',
            'userAuthorization'
          );
        }
      }
      return resolver(root, args, context, info);
    };
  }
}

module.exports = AuthenticationDirective;
