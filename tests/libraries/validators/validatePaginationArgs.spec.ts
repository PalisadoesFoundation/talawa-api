// import "dotenv/config";
// import {
//   PAGINATION_EITHER_FIRST_OR_LAST_MUST_BE_PROVIDED_ERROR,
//   PAGINATION_BOTH_FIRST_AND_LAST_MUST_NOT_BE_PROVIDED_ERROR,
//   PAGINATION_BEFORE_AND_LAST_MUST_NOT_BE_PROVIDED_WITH_FIRST_ERROR,
//   PAGINATION_AFTER_AND_FIRST_MUST_NOT_BE_PROVIDED_WITH_LAST_ERROR,
//   MAXIMUM_FETCH_LIMIT,
//   PAGINATION_MAXIMUM_FETCH_LIMIT_CROSSED,
// } from "../../../src/constants";
// import { afterEach, describe, expect, it, vi } from "vitest";

// afterEach(() => {
//   vi.restoreAllMocks();
//   vi.doUnmock("../../../src/constants");
//   vi.resetModules();
// });

// describe("libraries -> validators -> validatePaginationArgs", () => {
//   it(`throws error if both first and last arguments are missing`, async () => {
//     const { requestContext } = await import("../../../src/libraries");
//     const spy = vi
//       .spyOn(requestContext, "translate")
//       .mockImplementation((message) => `Translated ${message}`);

//     try {
//       const args = {};

//       const { validatePaginationArgs } = await import(
//         "../../../src/libraries/validators/validatePaginationArgs"
//       );

//       await validatePaginationArgs(args);
//     } catch (error: any) {
//       expect(spy).toHaveBeenCalledWith(
//         PAGINATION_EITHER_FIRST_OR_LAST_MUST_BE_PROVIDED_ERROR.MESSAGE
//       );
//       expect(error.message).toEqual(
//         `Translated ${PAGINATION_EITHER_FIRST_OR_LAST_MUST_BE_PROVIDED_ERROR.MESSAGE}`
//       );
//     }
//   });

//   it(`throws error if both first and last arguments are present`, async () => {
//     const { requestContext } = await import("../../../src/libraries");
//     const spy = vi
//       .spyOn(requestContext, "translate")
//       .mockImplementation((message) => `Translated ${message}`);

//     try {
//       const args = {
//         first: 10,
//         last: 10,
//       };

//       const { validatePaginationArgs } = await import(
//         "../../../src/libraries/validators/validatePaginationArgs"
//       );

//       await validatePaginationArgs(args);
//     } catch (error: any) {
//       expect(spy).toHaveBeenCalledWith(
//         PAGINATION_BOTH_FIRST_AND_LAST_MUST_NOT_BE_PROVIDED_ERROR.MESSAGE
//       );
//       expect(error.message).toEqual(
//         `Translated ${PAGINATION_BOTH_FIRST_AND_LAST_MUST_NOT_BE_PROVIDED_ERROR.MESSAGE}`
//       );
//     }
//   });

//   it(`throws error if the first or the last arguments are greater than the allowed fetch limit`, async () => {
//     const { requestContext } = await import("../../../src/libraries");
//     const spy = vi
//       .spyOn(requestContext, "translate")
//       .mockImplementation((message) => `Translated ${message}`);

//     try {
//       const args = {
//         last: MAXIMUM_FETCH_LIMIT + 1,
//       };

//       const { validatePaginationArgs } = await import(
//         "../../../src/libraries/validators/validatePaginationArgs"
//       );

//       await validatePaginationArgs(args);
//     } catch (error: any) {
//       expect(spy).toHaveBeenCalledWith(
//         PAGINATION_MAXIMUM_FETCH_LIMIT_CROSSED.MESSAGE
//       );
//       expect(error.message).toEqual(
//         `Translated ${PAGINATION_MAXIMUM_FETCH_LIMIT_CROSSED.MESSAGE}`
//       );
//     }
//   });

//   it(`throws error if any backward pagination args are present with first`, async () => {
//     const { requestContext } = await import("../../../src/libraries");
//     const spy = vi
//       .spyOn(requestContext, "translate")
//       .mockImplementation((message) => `Translated ${message}`);

//     try {
//       const args = {
//         first: 10,
//         before: "RandomCursor",
//       };

//       const { validatePaginationArgs } = await import(
//         "../../../src/libraries/validators/validatePaginationArgs"
//       );

//       await validatePaginationArgs(args);
//     } catch (error: any) {
//       expect(spy).toHaveBeenCalledWith(
//         PAGINATION_BEFORE_AND_LAST_MUST_NOT_BE_PROVIDED_WITH_FIRST_ERROR.MESSAGE
//       );
//       expect(error.message).toEqual(
//         `Translated ${PAGINATION_BEFORE_AND_LAST_MUST_NOT_BE_PROVIDED_WITH_FIRST_ERROR.MESSAGE}`
//       );
//     }
//   });

//   it(`throws error if any forward pagination args are present with last`, async () => {
//     const { requestContext } = await import("../../../src/libraries");
//     const spy = vi
//       .spyOn(requestContext, "translate")
//       .mockImplementation((message) => `Translated ${message}`);

//     try {
//       const args = {
//         last: 10,
//         after: "RandomCursor",
//       };

//       const { validatePaginationArgs } = await import(
//         "../../../src/libraries/validators/validatePaginationArgs"
//       );

//       await validatePaginationArgs(args);
//     } catch (error: any) {
//       expect(spy).toHaveBeenCalledWith(
//         PAGINATION_AFTER_AND_FIRST_MUST_NOT_BE_PROVIDED_WITH_LAST_ERROR.MESSAGE
//       );
//       expect(error.message).toEqual(
//         `Translated ${PAGINATION_AFTER_AND_FIRST_MUST_NOT_BE_PROVIDED_WITH_LAST_ERROR.MESSAGE}`
//       );
//     }
//   });

//   it(`the function returns undefined if all the arguments are provided correctly`, async () => {
//     const { requestContext } = await import("../../../src/libraries");
//     vi.spyOn(requestContext, "translate").mockImplementation(
//       (message) => `Translated ${message}`
//     );

//     const args = {
//       last: 10,
//     };

//     const { validatePaginationArgs } = await import(
//       "../../../src/libraries/validators/validatePaginationArgs"
//     );

//     const payload = await validatePaginationArgs(args);
//     expect(payload).toEqual(undefined);
//   });
// });
