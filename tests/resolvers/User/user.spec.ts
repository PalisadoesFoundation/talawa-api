import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import { beforeEach, describe, it, expect , beforeAll,afterAll} from "vitest";
import { User } from "../../../src/models";
import type mongoose from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("User Identifier Tests", () => {
  // before(async () => {
  //   // Connect to MongoDB before running the tests
  //   await mongoose.connect("mongodb://localhost:27017/talawa-test-db", {
  //     useNewUrlParser: true,
  //     useUnifiedTopology: true,
  //   });
  // });

  // after(async () => {
  //   // Disconnect from MongoDB after running the tests
  //   await mongoose.connection.close();
  // });

  beforeEach(async () => {
    // Clear the User collection bef ore each test
    await User.deleteMany({});
  });
  it("identifier should be a numeric value", async () => {
    const user1 = await User.create({
      firstName: "john",
      lastName: "doe"
    })
    await user1.save()
    expect(typeof user1.identifier === 'number').toBe(true);
  }
  )
  
  it("identifier should be sequential and incremental", async () => {
    const user1 = await User.create({
      firstName: "john",
      lastName: "doe"
    })

    const user2 = await User.create({
      firstName: "john",
      lastName: "doe"
    })
    await user2.save()
    await user1.save()
    expect(user1.identifier.type).toBeGreaterThan(user2.identifier.type);
    
  }
  )

})


  
 