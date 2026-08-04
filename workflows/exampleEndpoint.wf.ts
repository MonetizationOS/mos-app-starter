import type { EndpointWorkflow } from "mos:workflow";

const workflow: EndpointWorkflow = async ({ request, env }) => {
	console.log(`Received request: ${request.url}`);
	return new Response(env.responseMessage);
};

export default workflow;
