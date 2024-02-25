import { it, expect, vi, describe, beforeEach } from "vitest";
import inquirer from "inquirer";
import fs from "fs";
import dotenv from "dotenv";
import * as askForSuperAdminEmail from '../../src/setup/superAdmin'
import { superAdmin } from "../../setup";


describe("Setup -> superAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("function askForSuperAdminEmail should return email as entered", async () => {
        const testEmail = 'testemail@test.com'
        vi.spyOn(inquirer, "prompt").mockImplementationOnce(() => Promise.resolve({
            email: testEmail
        }));
        const result = await askForSuperAdminEmail.askForSuperAdminEmail()
        expect(result).toEqual(testEmail)
  });

  it('superAdmin prompts user, updates .env_test, and does not throw errors', async () => {
        const email = 'testemail@test.com'
        vi.spyOn(askForSuperAdminEmail, "askForSuperAdminEmail").mockImplementationOnce(() => Promise.resolve(email))

        await superAdmin();
    
        const env = dotenv.parse(fs.readFileSync('.env_test'));
        expect(env.LAST_RESORT_SUPERADMIN_EMAIL).toEqual(email)
  });
})
