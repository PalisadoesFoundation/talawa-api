import { it, expect, describe } from 'vitest';
import dotenv from 'dotenv';
import { accessAndRefreshTokens } from '../../setup'
import fs from 'fs';


describe('accessAndRefreshTokens', () => {
  it('generates and updates access token secret if null', async () => {
    const env = dotenv.parse(fs.readFileSync(".env_test"));
    const EXISTING_ACCESS_TOKEN = env.ACCESS_TOKEN_SECRET
    
    await accessAndRefreshTokens(null, 'REFRESH_TOKEN');

    const envNew = dotenv.parse(fs.readFileSync(".env_test"));
    const NEW_ACCESS_TOKEN = envNew.ACCESS_TOKEN_SECRET

    expect(EXISTING_ACCESS_TOKEN).not.toEqual(NEW_ACCESS_TOKEN)
  });

  it('generates and updates refresh token secret if null', async () => {
    const env = dotenv.parse(fs.readFileSync(".env_test"));
    const EXISTING_REFRESH_TOKEN = env.REFRESH_TOKEN_SECRET
    
    await accessAndRefreshTokens('ACCESS_TOKEN', null);

    const envNew = dotenv.parse(fs.readFileSync(".env_test"));
    const NEW_REFRESH_TOKEN = envNew.REFRESH_TOKEN_SECRET

    expect(EXISTING_REFRESH_TOKEN).not.toEqual(NEW_REFRESH_TOKEN)
  });
  
  it('does not update existing secrets', async () => {
    const env = dotenv.parse(fs.readFileSync(".env_test"));
    const EXISTING_ACCESS_TOKEN = env.ACCESS_TOKEN_SECRET
    const EXISTING_REFRESH_TOKEN = env.REFRESH_TOKEN_SECRET

    await accessAndRefreshTokens('ACCESS_TOKEN', 'REFRESH_TOKEN');

    const envNew = dotenv.parse(fs.readFileSync(".env_test"));
    const NEW_ACCESS_TOKEN = envNew.ACCESS_TOKEN_SECRET
    const NEW_REFRESH_TOKEN = envNew.REFRESH_TOKEN_SECRET

    expect(EXISTING_ACCESS_TOKEN).toEqual(NEW_ACCESS_TOKEN)
    expect(EXISTING_REFRESH_TOKEN).toEqual(NEW_REFRESH_TOKEN)
  });

//   it('handles errors reading .env file', async () => {
//     // Mock error reading .env file
//     mockReadFileSync.mockImplementation(() => {
//       throw new Error('Error reading .env file');
//     });

//     // Call the function (expect an error)
//     await expect(accessAndRefreshTokens('some_access_token_secret', null)).rejects.toThrowError();

//     // Assert .env content is not updated
//     expect(mockUpdateEnvVariable).not.toHaveBeenCalled();
//   });
});
