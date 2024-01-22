// import mongoose from "mongoose";
// import { connect, disconnect } from "../../helpers/db";
// import { agendaCategories } from "../../../src/resolvers/Query/getAllAgendaCategories";
// import { AgendaCategoryModel } from "../../../src/models";
// import { AGENDA_CATEGORY_NOT_FOUND_ERROR } from "../../../src/constants";
// import { beforeAll, afterAll, describe, it, expect } from "vitest";

// let MONGOOSE_INSTANCE: typeof mongoose;

// beforeAll(async () => {
//   MONGOOSE_INSTANCE = await connect();
// });

// afterAll(async () => {
//   await disconnect(MONGOOSE_INSTANCE);
// });

// describe("resolvers -> Query -> agendaCategories", () => {
//   it("fetches all agenda categories successfully", async () => {
//     // Create sample agenda categories for testing
//     const agendaCategoriesData = [
//       { name: "Category 1" },
//       { name: "Category 2" },
//     ];

//     await AgendaCategoryModel.create(agendaCategoriesData);

//     const result = await agendaCategories();

//     expect(result).toBeDefined();
//     expect(result).toHaveLength(agendaCategoriesData.length);

//     // Assuming that the order of returned categories is the same as insertion order
//     for (let i = 0; i < agendaCategoriesData.length; i++) {
//       expect(result[i].name).toEqual(agendaCategoriesData[i].name);
//     }
//   });

//   it("throws InternalServerError if there is an issue fetching agenda categories", async () => {
//     // Simulate an error during fetching
//     jest.spyOn(AgendaCategoryModel, "find").mockImplementationOnce(() => {
//       throw new Error("Database connection error");
//     });

//     try {
//       await agendaCategories();
//     } catch (error: any) {
//       expect(error.message).toEqual(
//         "An error occurred while fetching agenda categories"
//       );
//     }
//   });
// });
