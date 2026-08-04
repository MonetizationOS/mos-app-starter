import { describe, expect, it } from "vitest";
import configure from "../src/configure";

describe("configure script", () => {
	it("produces expected variable", async () => {
		expect(await configure({ responseMessage: "test" })).toStrictEqual({
			workflowVariables: [{ key: "responseMessage", value: "test" }],
		});
	});
});
