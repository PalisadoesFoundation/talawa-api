import Organization from '../models/Organization';
import { NotFoundError } from '../helper_lib/errors';
import requestContext from '../helper_lib/request-context';
import {
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
} from '../../constants';

export const organizationExists = async (id: string) => {
  const organization = await Organization.findOne({
    _id: id,
  });

  if (!organization) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  return organization;
};

export default organizationExists;
