import { it, expect, describe, vi } from "vitest";
import { redisConfiguration } from "../../setup";
import inquirer from "inquirer";
import dotenv from "dotenv";
import fs from "fs";
import * as module from "../../src/setup/redisConfiguration";

/**
 * This test suite verifies the behavior of the `redisConfiguration` function
 * in the setup module.
 */
describe("Setup -> redisConfiguration", () => {
  /**
   * Test case: connects to existing Redis URL if confirmed
   *
   * Description:
   * This test verifies that the redisConfiguration function connects to an
   * existing Redis URL if the user confirms to keep the values.
   */
  it("connects to existing Redis URL if confirmed", async () => {
    const existingUrl = "redis://localhost:6379";
    vi.spyOn(module, "checkExistingRedis").mockImplementationOnce(() =>
      Promise.resolve(existingUrl),
    );
    const mockInquirer = vi
      .spyOn(inquirer, "prompt")
      .mockImplementationOnce(() => Promise.resolve({ keepValues: true }));

    await redisConfiguration();

    expect(mockInquirer).toBeCalledWith({
      type: "confirm",
      name: "keepValues",
      message: `Do you want to connect to the detected Redis URL?`,
      default: true,
    });

    const env = dotenv.parse(fs.readFileSync(".env_test"));
    expect(env.REDIS_HOST).toBe("localhost");
    expect(env.REDIS_PORT).toBe("6379");
    expect(env.REDIS_PASSWORD).toBe("");
  });

  /**
   * Test case: asks for new Redis URL and connects if confirmed
   *
   * Description:
   * This test verifies that the redisConfiguration function prompts the user
   * for a new Redis URL and connects if the user confirms.
   */
  it("asks for new Redis URL and connects if confirmed", async () => {
    vi.spyOn(module, "checkExistingRedis").mockImplementationOnce(() =>
      Promise.resolve(null),
    );
    vi.spyOn(module, "askForRedisUrl").mockImplementationOnce(() =>
      Promise.resolve({
        host: "test",
        port: 6378,
        password: "",
      }),
    );
    vi.spyOn(module, "checkRedisConnection").mockImplementationOnce(() =>
      Promise.resolve(true),
    );

    await redisConfiguration();

    const env = dotenv.parse(fs.readFileSync(".env_test"));
    expect(env.REDIS_HOST).toBe("test");
    expect(env.REDIS_PORT).toBe("6378");
    expect(env.REDIS_PASSWORD).toBe("");
  });

  it("Should return true for a successfull Redis Connection", async () => {
    const validUrl = "redis://localhost:6379";
    const result = await module.checkRedisConnection(validUrl);
    expect(result).toBe(true);
  });

  it("Should ask for Redis Config, and return the entered values.", async () => {
    const input = {
      host: "localhost",
      port: 6379,
      password: "",
    };
    vi.spyOn(inquirer, "prompt").mockImplementationOnce(() =>
      Promise.resolve(input),
    );
    const result = await module.askForRedisUrl();
    expect(result).toEqual(input);
  });

  it("Should return URL, indicating redis is connected", async () => {
    vi.spyOn(module, "checkRedisConnection").mockReturnValueOnce(
      Promise.resolve(true),
    );
    const result = await module.checkExistingRedis();
    expect(result).toBeDefined();
  });
});
