import { logger } from "../../src/lib/logger";

describe("Logger", () => {
  it("should log info without crashing", () => {
    expect(() => logger.info("Hello World")).not.toThrow();
  });
});
