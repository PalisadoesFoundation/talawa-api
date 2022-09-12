import { MutationResolvers } from '../../../generated/graphQLTypescriptTypes';
import { User } from '../../models';

export const revokeRefreshTokenForUser: MutationResolvers['revokeRefreshTokenForUser'] =
  async (_parent, args) => {
    await User.updateOne(
      {
        _id: args.userId,
      },
      {
        $inc: {
          tokenVersion: 1,
        },
      }
    );

    return true;
  };
