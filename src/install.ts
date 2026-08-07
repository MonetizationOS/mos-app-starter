import type { InstallScript } from "mos";

/**
 * See README.md
 */
const install: InstallScript = ({ endpointPath }) => {
	return {
		endpoints: [
			{
				id: "example-endpoint",
				name: "Example Endpoint",
				methods: ["GET", "POST"],
				path: endpointPath,
				accessLevel: "noKey",
				workflow: {
					id: "example-endpoint-workflow",
					path: "./exampleEndpoint.wf.ts",
				},
			},
		],
	};
};

export default install;
