module.exports = async (filename) => {
  const extension = filename.split('.').pop();
  if (extension !== 'png' && extension !== 'jpg' && extension !== 'jpeg') {
    throw new Error('Invalid file Type. Only .jpg and .png files are accepted');
  }
};
