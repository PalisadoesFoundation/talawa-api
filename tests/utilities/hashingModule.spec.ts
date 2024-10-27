import { describe, it, expect } from "vitest";
import { hashEmail } from "../../src/utilities/hashEmail";

describe("hashingModule", () => {
    describe("hashingEmail", ()=> {
        it("should produce same hash for identical emails", () => {
            const email = "test@example.com";
            const hashedFirstEmail = hashEmail(email);
            const hashedSecondEmail = hashEmail(email);

            expect(email).not.toEqual(hashedFirstEmail);
            expect(email).not.toEqual(hashedSecondEmail);
            expect(hashedFirstEmail).toEqual(hashedSecondEmail);
        })
    })
})
