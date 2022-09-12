const { ApolloError } = require('apollo-server-express');
const createUploadStream = require('../helper_functions/uploadS3');

const uploadFile = async (_, { file }) => {
    const { filename, createReadStream } = await file;

    const stream = createReadStream();

    let result;

    try {
      const uploadStream = createUploadStream(filename);
      stream.pipe(uploadStream.writeStream);
      result = await uploadStream.promise;
    } catch (error) {
      console.log(
        `[Error]: Message: ${error.message}, Stack: ${error.stack}`
      );
      throw new ApolloError("Error uploading file");
    }

    return result;

};

module.exports = uploadFile;