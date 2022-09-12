const { ApolloError } = require('apollo-server-express');
const createUploadStream = require('../helper_functions/uploadS3');

const uploadFile = async (_, { file }) => {
  const fileData = await file;
  console.log({ fileData });

  // const filename = fileData.filename;
  // // const stream = await fileData.promise;

  // console.log({ filename, stream });

  const filename = 'hello.png';

  let result;

  try {
    const uploadStream = createUploadStream(filename);
    console.log({ uploadStream });
    // stream.pipe(uploadStream.writeStream);
    result = await uploadStream.promise;
  } catch (error) {
    console.log(`[Error]: Message: ${error.message}, Stack: ${error.stack}`);
    throw new ApolloError('Error uploading file');
  }

  console.log({ file });

  return result;

  // Do work 💪
};

module.exports = uploadFile;