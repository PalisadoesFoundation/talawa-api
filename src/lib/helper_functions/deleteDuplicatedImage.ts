import { unlink } from 'fs';
import type { PathLike } from 'fs';
import { logger } from '../helper_lib/logger';

export const deleteDuplicatedImage = (imagePath: PathLike) => {
  unlink(imagePath, function (error) {
    if (error) {
      throw error;
    }

    // if no error, file has been deleted successfully
    logger.info('File was deleted as it already exists in the db!');
  });
};

export default deleteDuplicatedImage;
