import { afterEach, describe, expect, it, vi } from "vitest";
import { isFirebaseConfigured, parseServiceAccountJson } from "./admin";

const VALID_ACCOUNT = {
  project_id: "legacy-app",
  client_email: "firebase@legacy-app.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n",
};

describe("parseServiceAccountJson", () => {
  it("parses standard inline JSON", () => {
    expect(parseServiceAccountJson(JSON.stringify(VALID_ACCOUNT))).toEqual({
      project_id: "legacy-app",
      client_email: "firebase@legacy-app.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
    });
  });

  it("parses JSON wrapped in single quotes (common in hosting env UIs)", () => {
    const wrapped = `'${JSON.stringify(VALID_ACCOUNT)}'`;
    expect(parseServiceAccountJson(wrapped)).toEqual({
      project_id: "legacy-app",
      client_email: "firebase@legacy-app.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
    });
  });

  it("returns null when required fields are missing", () => {
    expect(parseServiceAccountJson(JSON.stringify({ project_id: "x" }))).toBeNull();
  });
});

describe("isFirebaseConfigured", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is false when no credentials are present", () => {
    expect(isFirebaseConfigured()).toBe(false);
  });

  it("is true when FIREBASE_SERVICE_ACCOUNT is valid JSON", () => {
    vi.stubEnv("FIREBASE_SERVICE_ACCOUNT", JSON.stringify(VALID_ACCOUNT));
    expect(isFirebaseConfigured()).toBe(true);
  });
});
