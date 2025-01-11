// import mongoose from "mongoose";
// // import { MongoMemoryServer } from "mongodb-memory-server";

// export class TestHelper {
//   private static _instance: TestHelper;
//   private _mongod?: MongoMemoryServer;

//   private constructor() {}

//   /**
//    * Singleton instance of TestHelper.
//    */
//   public static getInstance(): TestHelper {
//     if (!TestHelper._instance) {
//       TestHelper._instance = new TestHelper();
//     }
//     return TestHelper._instance;
//   }

//   /**
//    * Starts an in-memory MongoDB instance.
//    */
//   async startDatabase(): Promise<void> {
//     try {
//       this._mongod = await MongoMemoryServer.create();
//       const uri = this._mongod.getUri();
//       await mongoose.connect(uri, {
//         maxPoolSize: 10,
//         minPoolSize: 2,
//       });

//       // Cleanup on process exit
//       process.on("SIGINT", async () => {
//         await this.stopDatabase();
//         process.exit(0);
//       });
//     } catch (error) {
//       throw new Error(`Failed to start database: ${(error as Error).message}`);
//     }
//   }

//   /**
//    * Stops the in-memory MongoDB instance and cleans up connections.
//    */
//   async stopDatabase(): Promise<void> {
//     try {
//       if (mongoose.connection.readyState) {
//         await mongoose.connection.dropDatabase();
//         await mongoose.connection.close();
//       }
//       if (this._mongod) {
//         await this._mongod.stop();
//       }
//     } catch (error) {
//       throw new Error(`Failed to stop database: ${(error as Error).message}`);
//     }
//   }

//   /**
//    * Creates isolated test data.
//    * @param prefix - Unique identifier for test data.
//    * @returns Test user and organization data.
//    */
//   static createTestData(prefix: string): {
//     testUser: { name: string; email: string };
//     testOrg: { name: string };
//   } {
//     return {
//       testUser: { name: `${prefix}_user`, email: `${prefix}@test.com` },
//       testOrg: { name: `${prefix}_org` },
//     };
//   }
// }
