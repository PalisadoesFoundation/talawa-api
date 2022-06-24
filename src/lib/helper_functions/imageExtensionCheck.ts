import { deleteImage } from './deleteImage';
import { ValidationError } from '../helper_lib/errors';
import requestContext from '../helper_lib/request-context';

export const imageExtensionCheck = async (filename: string) => {
  const extension = filename.split('.').pop();

  if (extension !== 'png' && extension !== 'jpg' && extension !== 'jpeg') {
    await deleteImage(filename);

    throw new ValidationError(
      [
        {
          message: requestContext.translate('invalid.fileType'),
          code: 'invalid.fileType',
          param: 'fileType',
        },
      ],
      requestContext.translate('invalid.fileType')
    );
  }
};
