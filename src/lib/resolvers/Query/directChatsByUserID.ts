import { QueryResolvers } from '../../../generated/graphQLTypescriptTypes';
import { errors, requestContext } from '../../libraries';
import { DirectChat } from '../../models';
import { IN_PRODUCTION } from '../../../constants';

export const directChatsByUserID: QueryResolvers['directChatsByUserID'] =
  async (_parent, args) => {
    const directChats = await DirectChat.find({
      users: args.id,
    }).lean();

    if (directChats.length === 0) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? 'DirectChats not found'
          : requestContext.translate('directChats.notFound'),
        'directChats.notFound',
        'directChats'
      );
    }

    return directChats;
  };
