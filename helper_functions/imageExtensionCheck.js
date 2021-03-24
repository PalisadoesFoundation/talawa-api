const deleteImage = require('./deleteImage');

module.exports = async (filename) => {
  const extension = filename.split('.').pop();
  if (extension !== 'png' && extension !== 'jpg' && extension !== 'jpeg') {
    await deleteImage(filename);
    throw new Error('Invalid file Type. Only .jpg and .png files are accepted');
  }
};
