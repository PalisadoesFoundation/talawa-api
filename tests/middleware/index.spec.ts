import * as exports from "../../src/middleware/index";
import { isAuth } from "../../src/middleware/isAuth";
import {describe,it,expect} from "vitest";

describe("index", () => {
    it("should export isAuth", () => {
        expect(exports.isAuth).toBe(isAuth);
    });
});
