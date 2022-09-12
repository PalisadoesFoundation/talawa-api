import { deleteImage } from './deleteImage';
import { errors, requestContext } from '../libraries';

export const imageExtensionCheck = async (filename: string) => {
  const fileExtension = filename.split('.').pop();

  if (
    fileExtension !== 'png' &&
    fileExtension !== 'jpg' &&
    fileExtension !== 'jpeg'
  ) {
    await deleteImage(filename);

    throw new errors.ValidationError(
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
