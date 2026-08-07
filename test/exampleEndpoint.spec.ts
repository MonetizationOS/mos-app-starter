import type { EndpointWorkflowArgs } from "mos:workflow";
import { describe, expect, it, vi } from "vitest";
import exampleEndpoint from "../workflows/exampleEndpoint.wf";

describe("exampleEndpoint", () => {
	it("returns hello world", async () => {
		const response = await exampleEndpoint(
			vi.mockObject<EndpointWorkflowArgs>({
				request: new Request("https://example.com"),
				env: {
					responseMessage: "Hello World",
				},
			} as unknown as EndpointWorkflowArgs),
		);
		expect(response.status).toBe(200);
		expect(await response.text()).toBe("Hello World");
	});
});
