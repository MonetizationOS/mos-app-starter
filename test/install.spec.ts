import { describe, expect, it } from "vitest";
import install from "../src/install";

describe("install script", () => {
	it("contains expected endpoint", async () => {
		expect(await install({ endpointPath: "/test" })).toStrictEqual({
			endpoints: [
				{
					accessLevel: "noKey",
					id: "example-endpoint",
					methods: ["GET", "POST"],
					name: "Example Endpoint",
					path: "/test",
					workflow: {
						id: "example-endpoint-workflow",
						path: "./exampleEndpoint.wf.ts",
					},
				},
			],
		});
	});
});
