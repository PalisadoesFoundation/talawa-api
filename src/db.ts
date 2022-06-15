import mongoose from 'mongoose';
import logger from './lib/helper_lib/logger';

export const connect = async () => {
  try {
    /*
    Typescript does not know whether process.env.MONGO_DB_URL will be defined at runtime or not
    All it knows is that mongoose.connect accepts a string as first argument and it cannot 
    accept undefined as the first argument. "as string" tells typescript that we are certain 
    this environment variable will be a string and not undefined.
    */
    await mongoose.connect(process.env.MONGO_DB_URL as string, {
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useNewUrlParser: true,
    });
  } catch (error) {
    logger.error('Error while connecting to mongo database', error);
    process.exit(1);
  }
};

export const disconnect = async () => {
  await mongoose.connection.close();
};

export default { connect, disconnect };
