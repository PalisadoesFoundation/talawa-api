import { describe, it, vi, expect, afterEach } from "vitest";
import { cloudbeaverSetup } from "setup";
import inquirer from "inquirer";

vi.mock("inquirer");

describe("Setup -> cloudbeaverSetup", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetAllMocks();
  });

  it("should prompt the user for CloudBeaver configuration and update process.env", async () => {
    const mockedAnswers = {
      CLOUDBEAVER_ADMIN_NAME: "mocked-admin",
      CLOUDBEAVER_ADMIN_PASSWORD: "mocked-password",
      CLOUDBEAVER_MAPPED_HOST_IP: "127.0.0.1",
      CLOUDBEAVER_MAPPED_PORT: "8080",
      CLOUDBEAVER_SERVER_NAME: "Mocked Server",
      CLOUDBEAVER_SERVER_URL: "http://127.0.0.1:8080",
    };

    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce(mockedAnswers);

    await cloudbeaverSetup();

    expect(process.env.CLOUDBEAVER_ADMIN_NAME).toBe("mocked-admin");
    expect(process.env.CLOUDBEAVER_ADMIN_PASSWORD).toBe("mocked-password");
    expect(process.env.CLOUDBEAVER_MAPPED_HOST_IP).toBe("127.0.0.1");
    expect(process.env.CLOUDBEAVER_MAPPED_PORT).toBe("8080");
    expect(process.env.CLOUDBEAVER_SERVER_NAME).toBe("Mocked Server");
    expect(process.env.CLOUDBEAVER_SERVER_URL).toBe("http://127.0.0.1:8080");
  });
});
