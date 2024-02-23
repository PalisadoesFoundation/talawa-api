import { it, expect, describe, vi } from 'vitest';
import { redisConfiguration } from '../../setup';
import  inquirer from 'inquirer'; // Assuming inquirer is used for prompts
import dotenv from 'dotenv';
import fs from 'fs';

describe('redisConfiguration', () => {
  it('connects to existing Redis URL if confirmed', async () => {
    const mockInquirer = vi.spyOn(inquirer, "prompt").mockImplementationOnce(() =>
      Promise.resolve({ keepValues: true }),
    )

    await redisConfiguration();

    expect(mockInquirer).toBeCalledWith({
      type: 'confirm',
      name: 'keepValues',
      message: `Do you want to connect to the detected Redis URL?`,
      default: true,
    });

    const env = dotenv.parse(fs.readFileSync('.env_test'));
    expect(env.REDIS_HOST).toBe('localhost');
    expect(env.REDIS_PORT).toBe('6379');
    expect(env.REDIS_PASSWORD).toBe('');
  });

  it('asks for new Redis URL and connects if confirmed', async () => {
    const mockInquirer = vi.spyOn(inquirer, "prompt").mockImplementationOnce(() =>
      Promise.resolve({ keepValues: false }),
    )

    await redisConfiguration();

    expect(mockInquirer).toBeCalledWith({
      type: 'confirm',
      name: 'keepValues',
      message: `Do you want to connect to the detected Redis URL?`,
      default: true,
    });
    const env = dotenv.parse(fs.readFileSync('.env_test'));
    expect(env.REDIS_HOST).toBe('localhost');
    expect(env.REDIS_PORT).toBe('6379');
    expect(env.REDIS_PASSWORD).toBe('');
  });

  // it('handles errors gracefully', async () => {
  //   const mockError = new Error('Some error occurred');
  //   mockCheckExistingRedis.mockRejectedValue(mockError); // Or any other error

  //   await expect(redisConfiguration()).rejects.toThrowError(mockError);
  //   expect(mockUpdateEnvVariable).not.toHaveBeenCalled();
  // });

//   it('handles connection errors and retries', async () => {
//     mockCheckExistingRedis.mockReturnValue(null);
//     mockCheckRedisConnection.mockReturnValue(false, true, true); // Reject twice, succeed on third try

//     await expect(redisConfiguration()).resolves.not.toThrow();
//     expect(mockCheckRedisConnection).toBeCalledTimes(3);
//   });
});

