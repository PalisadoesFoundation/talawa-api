import { describe, it, expect } from "vitest";
import { hashEmail } from "../../src/utilities/hashEmail";

describe("hashingModule", () => {
    describe("hashingEmail", ()=> {
        const testCases = [
            "test@example.com",
            "USER@EXAMPLE.COM",
            "special.chars+test@domain.com"
        ];

        testCases.forEach((email)=> {
            it(`should correctly hash email: ${email}`, () => {
                const hashedFirstEmail =  hashEmail(email);
                const hashedSecondEmail = hashEmail(email);

                expect(hashedFirstEmail).toEqual(hashedSecondEmail);

                expect(email.toLowerCase()).not.toEqual(hashedFirstEmail);

                expect(hashedFirstEmail).toMatch(/^[a-f0-9]{64}$/i);
            });
        });

        it("should produce diffrent hashes with diffrent HASH_PEPPER values", () => {
            const email = "test@example.com"
            process.env.HASH_PEPPER = "pepper1";
            const hash1 = hashEmail(email);
            process.env.HASH_PEPPER = "pepper2";
            const hash2 = hashEmail(email);
            expect(hash1).not.toEqual(hash2);
        })
    })
})
