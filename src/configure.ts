import type { ConfigureScript } from "mos";

/**
 * See README.md
 */
const configure: ConfigureScript = ({ responseMessage }) => {
	return {
		workflowVariables: [{ key: "responseMessage", value: responseMessage }],
	};
};

export default configure;
