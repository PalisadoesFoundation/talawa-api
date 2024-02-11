import { expect, describe, it } from "vitest";
import {
  isReplicaSetConnection,
  isAtlasUrl,
} from "../../src/utilities/checkDbUrl";

describe("testing isReplicaSet Connection for local database instance", () => {
  it("should return true in case of replica set", async () => {
    const url =
      "mongodb://host1:port1,host2:port2,host3:port3/?replicaSet=myReplicaSet";
    const result = isReplicaSetConnection(url);
    expect(result).toBe(true);
  });

  it("should return false in case of no replica set", async () => {
    const url = "mongodb://localhost:27017/mydatabase";
    const result = isReplicaSetConnection(url);
    expect(result).toBe(false);
  });
});

describe("testing isReplicaSet Connection for atlas url", () => {
  it("should return true in case of atlas url", async () => {
    const url =
      "mongodb+srv://<username>:<password>@<cluster-name>.<provider>.mongodb.net/talawa-api";

    const result = isAtlasUrl(url);
    expect(result).toBe(true);
  });

  it("should return false in case of wrong atlas url", async () => {
    const url =
      "mongodb+srv://<username>:<password>@<cluster-name>.<provider>.mongodb/talawa-api";
    const result = isAtlasUrl(url);
    expect(result).toBe(false);
  });
});
