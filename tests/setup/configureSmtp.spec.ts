import { it, expect, vi, describe } from 'vitest';
import inquirer from 'inquirer';
import * as verifySmtpConnection from '../../src/setup/configureSmtp'
import { configureSmtp } from '../../setup';
import dotenv from 'dotenv'
import fs from 'fs'

vi.mock('inquirer');
vi.mock('./verifySmtpConnection');

describe('configureSmtp', () => {
    it('should configure SMTP and update .env_test if valid data is provided', async () => {
        const validData = {
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USERNAME: 'username',
        SMTP_PASSWORD: 'password',
        SMTP_SSL_TLS: true,
        };

        vi.spyOn(inquirer, 'prompt').mockResolvedValueOnce(validData);
        vi.spyOn(verifySmtpConnection, "verifySmtpConnection").mockReturnValue(Promise.resolve({
        success: true,
        error: null,
        }));

        await configureSmtp();

        const env = dotenv.parse(fs.readFileSync('.env_test'));
        expect(env.SMTP_HOST).toEqual(validData.SMTP_HOST)
        expect(env.SMTP_PASSWORD).toEqual(validData.SMTP_PASSWORD)
        expect(env.SMTP_PORT).toEqual(validData.SMTP_PORT)
        expect(env.SMTP_USERNAME).toEqual(validData.SMTP_USERNAME)
        expect(env.SMTP_SSL_TLS).toEqual(validData.SMTP_SSL_TLS)
  });

//   it('should not update .env_test and display error if invalid data is provided', async () => {
//     const invalidData = {
//       SMTP_HOST: '',
//       SMTP_PORT: '587',
//       SMTP_USERNAME: 'username',
//       SMTP_PASSWORD: 'password',
//       SMTP_SSL_TLS: true,
//     };

//     vi.spyOn(inquirer, 'prompt').mockResolvedValueOnce(invalidData);
//     vi.spyOn(verifySmtpConnection, "verifySmtpConnection").mockReturnValue(Promise.resolve({
//         success: false,
//         error: new Error('Connection failed'),
//     }));

//     await configureSmtp();

//     expect(console.error).toHaveBeenCalledWith(
//         'SMTP configuration verification failed. Please check your SMTP settings.'
//       );
//     const env = dotenv.parse(fs.readFileSync('.env_test'));
//     expect(env.SMTP_HOST).not.toEqual(invalidData.SMTP_HOST)
//     expect(env.SMTP_PASSWORD).not.toEqual(invalidData.SMTP_PASSWORD)
//     expect(env.SMTP_PORT).not.toEqual(invalidData.SMTP_PORT)
//     expect(env.SMTP_USERNAME).not.toEqual(invalidData.SMTP_USERNAME)
//     expect(env.SMTP_SSL_TLS).not.toEqual(invalidData.SMTP_SSL_TLS)
//   });

//   // Test 3: Verification fails
//   it('should not update .env and display error if verification fails', async () => {
//     const validData = {
//       SMTP_HOST: 'smtp.example.com',
//       SMTP_PORT: '587',
//       SMTP_USERNAME: 'username',
//       SMTP_PASSWORD: 'password',
//       SMTP_SSL_TLS: true,
//     };

//     vi.spyOn(inquirer, 'prompt').mockResolvedValueOnce(validData);
//     vi.spyOn(verifySmtpConnection, 'mockReturnValueOnce').mockReturnValue({
//       success: false,
//       error: new Error('Connection failed'),
//     });

//     await configureSmtp();

//     expect(updateEnvVariable).not.toHaveBeenCalled();
//     expect(console.error).toHaveBeenCalledWith(
//       'SMTP configuration verification failed. Please check your SMTP settings.'
//     );
//     expect(console.log).toHaveBeenCalledWith('Connection failed');
//   });
});
