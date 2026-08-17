<div align="center">
  <a href="https://monetizationos.com">
  <img alt="MonetizationOS logo" src="https://app.monetizationos.com/static/monetizationos-logo.png" height="48">
  </a>
  <h1>MonetizationOS App Starter</h1>
</div>

Documentation and examples for building MonetizationOS apps.

> [!IMPORTANT]
> You need access from MonetizationOS before you can build or publish an app:
>
> - The MOS SDK (`@monetizationos/mos-sdk`) is in closed beta on a private registry.
> - Publishing requires a `MOS_DEPLOY_KEY`.
> - [Traits](#traits) plan provisioning is behind a feature flag.
>
> All three are granted manually. Request them before working through this guide.

For more general documentation on MonetizationOS and available primitives, see [the MonetizationOS documentation](https://docs.monetizationos.com/docs/concepts).

## Building an App

A MonetizationOS app is a package of configurable entities that can be installed into a MonetizationOS organization to solve a particular business problem. Apps can be installed by multiple organizations, and can be configured differently in each organization. Apps can provide the same entities that can be built in MonetizationOS (such as endpoints, actions and plans) without the need for the installing organization to write or maintain those entities and workflow code.

Apps are bundled and deployed using the MOS SDK (`@monetizationos/mos-sdk`), published to the GitHub Packages npm registry. The SDK is currently in closed beta, and access must be manually requested.

### Install the MOS SDK

This repository is an example of how to build an app using the SDK. To start from scratch, first create an `.npmrc` file in the root of your project with the following content `@monetizationos:registry=https://npm.pkg.github.com`:

```sh
echo "@monetizationos:registry=https://npm.pkg.github.com" >> .npmrc
```

Then, `npm login` into the GitHub package registry and install the sdk. You will need a GitHub personal access token with the `read:packages` scope to login:

```sh
npm login --scope=@monetizationos --auth-type=legacy --registry=https://npm.pkg.github.com
npm i @monetizationos/mos-sdk
```

### Define the App

Settings for an app are defined as JSON in a `mos.json`/`mos.jsonc` file, or under the key `mos` in `package.json`.
Create a `mos.json` file with contents:

```json
{
  "appRepository": "<your-organization-id>",
  "id": "my-app",
  "name": "My App",
  "version": "0.0.1"
}
```

The following fields are supported in app configuration:

| Option                      | Type       | Required | Description                                                                        |
| --------------------------- | ---------- | -------: | ---------------------------------------------------------------------------------- |
| `id`                        | `string`   |      Yes | Unique app identifier.                                                             |
| `appRepository`             | `string`   |       No | 'public' for apps installable by any organization, or the ID of your organization. |
| `name`                      | `string`   |      Yes | Human-readable app name.                                                           |
| `version`                   | `string`   |      Yes | App version string.                                                                |
| `shortDescription`          | `string`   |      Yes | Short summary shown in app listings.                                               |
| `longDescriptionParagraphs` | `string[]` |       No | Longer description content split into paragraphs.                                  |
| `iconSvg`                   | `string`   |       No | SVG markup or reference for the app icon.                                          |
| `mosWorkflowTypes`          | `string`   |       No | Path to generate typescript definitions for workflows.                             |
| `mosAppTypes`               | `string`   |       No | Path to generate typescript definitions for install and configure scripts.         |
| `installScript`             | `string`   |       No | Path to the install script (default `./src/install.ts`).                           |
| `configureScript`           | `string`   |       No | Path to the configure script (default `./src/configure.ts`).                       |
| `workflowsDirectory`        | `string`   |       No | Directory containing workflow definitions. Defaults to `./workflows`.              |
| `installJsonSchema`         | `object`   |       No | JSON Schema for install-time inputs.                                               |
| `configureJsonSchema`       | `object`   |       No | JSON Schema for environment-specific configuration inputs.                         |

### Generate Typescript Definitions

Create empty directories for your app scripts (`/src`) and workflows (`/workflows`):

```sh
mkdir src workflows
```

Run the following command to generate typescript definitions for your workflows and app scripts:

```sh
npx mos app type-gen
```

The types generated will include types corresponding to the `installJsonSchema` and `configureJsonSchema` fields in `mos.json`.

### The Install Script

The install script is the entrypoint into the app and runs when the app is installed, re-installed or updated.

The inputs to this script are defined by the 'installJsonSchema' field in mos.json. On installation or re-installation,
organizations that install this app will be presented with a form with inputs corresponding to installJsonSchema. Typescript
definitions corresponding to installJsonSchema are produced when running `pnpm mos app type-gen`.

The outputs to this script are entities to create in the organization that is installing the app (e.g. endpoints, actions or plans)
defined in 'MOS Configuration Format' (MCF). These entities will be 'owned' by this app installation, meaning that the installing organization
can see the entities but cannot edit or remove them. To allow the installing organization to customize the entities produced by the app, provide
options to configure in installJsonSchema and modify the created entities in the install script.

Workflows can be provided as inline-strings in the install script, but it is recommended to place them in the `/workflows` directory and reference them in the install script. Workflow files must end with `.wf.ts` or `.wf.js` and export a default function that implements the workflow.

Entities produced by the install script are shared across all the brands that the app is installed against, and can be deployed by the organization
to all of those brands' environments. The code in workflows, or specifications for an endpoint, cannot be changed per-environment.
To provide the capability to have different setups in different environments, provide a [configuration step](#the-configure-script).

The location of this script is specified as 'installScript' in mos.json, or defaults to `./src/install.ts`.

Create an install script that with contents:

```typescript
import type { InstallScript } from "mos";

const install: InstallScript = (installConfig) => {
  return {};
};

export default install;
```

Optionally, you can write unit tests for your app scripts and workflows; an example is included in this repository using [Vitest](https://vitest.dev/).

### The Configure Script

The configure script is an optional extra step that provides the capability to modify the app setup on a per-environment basis in the installing organization. If provided, the configure script receives inputs corresponding to 'configureJsonSchema' in mos.json. The installing organization will be given the option to provide values corresponding to this schema and attach them to different environments. The script outputs a sub-set of the 'MOS Configuration Format' (MCF), namely 'workflow variables'. These variables will be made available to the apps workflows at runtime and so can be used to modify the behaviour of the app in different environments, for example, sending data to a production or testing URL.

It is possible to omit the configure script while providing a `configureJsonSchema`. The installing organization will still be given the option to provide this configuration and attach it to their environments, but it will not have any effect on their 'webscale' (i.e., end user facing) workflows. The configuration will be made available to [tasks](#tasks).

The location of this script is specified as 'configureScript' in mos.json, or defaults to `./src/configure.ts`.

```typescript
const configure: ConfigureScript = (appConfig, installConfig) => {
  return {};
};

export default configure;
```

### Define Secrets

Values in `installJsonSchema` and `configureJsonSchema` can be marked as being secrets. For example:

```json
"configureJsonSchema": {
    "type": "object",
    "properties": {
        "privateKey": { "type": "string", "mos": { "isSecret": true } }
    },
    "required": ["privateKey"]
}
```

Secrets must be of type `string`. When marked as a secret, values will be stored in encrypted form and will never
be re-presented to the installing organization in the MOS console. Secret values may still have additional validation
applied to them as permitted by JSON Schema, for example using a regex pattern.

### Deploy the App

Once your app is ready, you can publish it to your own MonetizationOS organization for manual testing. You will need a `MOS_DEPLOY_KEY`, which will be provided to you by MonetizationOS. You can pass `MOS_DEPLOY_KEY` as an environment variable to the following command, or save it in a `.env` file in the root of your project:

```sh
MOS_DEPLOY_KEY=<your-deploy-key> npx mos app publish
```

or

```sh
echo "MOS_DEPLOY_KEY=<your-deploy-key>" >> .env
npx mos app publish
```

Once deployed, you can install and test your app in your MonetizationOS organization.

## Concepts

Some MonetizationOS concepts are currently only available in apps and are described below, for everything else see [the MonetizationOS documentation](https://docs.monetizationos.com/docs/concepts).

### Traits

Traits are an in-progress concept in MonetizationOS that provide a link between apps that can describe properties of a user (for example,
product holdings or feature flags) and plan provisioning. Traits have two components to their unique identifier, a 'group key' and a 'trait key'. The group key groups traits that come from a common source, for example a particular account in a payment provider platform. Methods are available to manage traits individually or to replace at group-level.

There are three distinct phases to the trait lifecycle: assignment, provisioning and description. The provisioning phase is handled by the MonetizationOS console in a managed UI (currently behind a feature flag). When an app provides the description and assignment phases, the result is an integration with a third-party system that business users can use to control access and behaviour using the information provided by the third-party system, without the need to write code.

#### Trait assignment

Traits are assigned to users via workflows. Traits can be assigned in endpoints, offer redemption, middleware or [ingest](#ingest-workflows) workflows. Assigning traits to users is a persistent operation - the traits will be stored and available in subsequent workflows and requests.

See the [workflow typescript definitions](https://docs.monetizationos.com/docs/api-reference/workflows/type-definitions/TraitWorkflowManagementUtils) for more information on the methods available to assign traits in a workflow.

For example:

```typescript
await utils.identity.setTraitGroup(
  { identifier: customerId, userType: "authenticated" },
  `my-payments-${env.accountId}`,
  subscriptions.map((sub) => sub.productId),
);
```

Traits can also be assigned with time-bounded validity. Using validity bounds enables traits to become 'active' at a specified time in the future, or to expire at a specified time, without the need to make further calls to MonetizationOS.

For example:

```typescript
await utils.identity.setTraitGroup(
  { identifier: customerId, userType: "authenticated" },
  `my-payments-${env.accountId}`,
  subscriptions.map((sub) => ({
    key: sub.productId,
    validity: [{ from: sub.startDate, to: sub.endDate }],
  })),
);
```

#### Trait Description

Traits can be 'described' to business users in the MonetizationOS console, to avoid the need for them to remember or copy the IDs of products or feature-flags in a third-party system when configuring plan provisioning. Traits can be described by a app Task that fetches the available concepts from a third-party system and stores them in the installing organization for use in the console.

See [the example task](#syncing-traits-from-a-third-party-system) for an example of how to describe traits in a task.

#### Trait-Plan Provisioning

When the trait feature flag is enabled, traits can be selected on the Plans > Plan Assignments page of the MonetizationOS console. When a decision is made for a user, the traits that have previously been assigned to that user will be considered when evaluating which plans are provisioned, including any validity periods if specified.

### Ingest Workflows

Ingest workflows are intended to be used by apps to receive webhooks from third-party systems, and can be used to assign traits to users, or perform other data operations, in response to events in those systems.

Ingest workflows are conceptually similar to [endpoint workflows](https://docs.monetizationos.com/docs/api-reference/workflows/endpoint-workflows) in that they receive HTTP requests on a specified path and return an HTTP response. They key distinction is that ingest workflows are not particular to any one brand or environment, and are not part of the versioning and deployment lifecycle exposed to installing organizations. Ingest workflows can therefore be updated by the installing organization updating the app, without the need to deploy a new version of the workflow to each environment. The observability events for ingest workflows will also not show any particular brand, so segregating events relating to data ingest from normal decision events.

An example ingest workflow, which fetches 'active subscriptions' from a third-party system and assigns traits to users, is shown below:

```typescript
import type { IngestWorkflow } from "mos:workflow";

const ingestWorkflow: IngestWorkflow = async ({ utils, request, env }) => {
  try {
    // Verify webhook payload using platform-dependant method, for example a signature in the request headers

    // Parse webhook payload
    const { customerId } = await request.json();
    if (!customerId) {
      return new Response("Missing customerId", { status: 400 });
    }

    // Get all active subscriptions for the customer
    const subscriptions = await (
      await fetch(
        `https://my-system.com/api/customers/${customerId}/subscriptions`,
      )
    ).json();

    // Sync traits
    await utils.identity.setTraitGroup(
      { identifier: customerId, userType: "authenticated" },
      `payment-plans-${env.accountId}`,
      subscriptions.map((sub) => ({
        key: sub.productId,
        validity: [{ from: sub.startDate, to: sub.endDate }],
      })),
    );

    return Response.json({
      message: `Wrote ${subscriptions.length} subscriptions for customer ${customerId}`,
    });
  } catch (error) {
    return new Response(`Ingest workflow failed: ${String(error)}`, {
      status: 500,
    });
  }
};

export default ingestWorkflow;
```

### Tasks

Tasks are a type of entity that can be created by the install script of an app. Tasks are workflows that can be run on-demand by the installing organization, and can be used to perform long-running actions.

Tasks produced by an app can be 'configuration scoped', meaning that the installing organization must select a configuration to run the task. Configuration-scoped tasks can be used to perform actions that are specific to a particular environment, for example, sending a message to a testing Slack channel.

Methods are provided as inputs to a task workflow to break-down the execution of the task into durable 'steps'. Steps can be used to selectively retry and handle errors from different parts of the task workflow.

See the `AppTaskWorkflow` typescript definitions produced by running `pnpm mos app type-gen` for more information on the methods available in
a task workflow.

#### Task Examples

##### Defining a task in the install script

```typescript
import type { InstallScript } from "mos";

const install: InstallScript = () => {
  return {
    tasks: [
      {
        id: "product-sync",
        name: "Product Sync",
        description: "Syncs products from MyPayments to MOS",
        trigger: "app",
        // Enable this flag to make tasks run at configuration-level
        configurationScope: true,
        workflow: {
          id: "product-sync-workflow",
          path: "productSync.wf.ts",
        },
      },
    ],
  };
};

export default install;
```

##### Sending a message to a Slack channel

Verify an app installation by sending a test message to a slack channel.

```typescript
import type { AppTaskWorkflow } from "mos:workflow";

const taskWorkflow: AppTaskWorkflow = async ({ appInstallConfig, utils }) => {
  const response = await fetch(`https://slack.com/api/chat.postMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${appInstallConfig.slackBotToken}`,
    },
    body: JSON.stringify({
      channel: appInstallConfig.slackChannelId,
      text: "Hello from my app!",
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to send message to Slack channel ${appInstallConfig.slackChannelId}: ${response.status} ${response.statusText}`,
    );
  }
  return {
    message: `Message sent to Slack channel ${appInstallConfig.slackChannelId}`,
  };
};

export default taskWorkflow;
```

##### Syncing traits from a third-party system

A configuration-scoped task that fetches a list of payment plans from a third-party system and stores them as traits in the installing organization.

```typescript
import type { AppTaskWorkflow } from "mos:workflow";

const taskWorkflow: AppTaskWorkflow = async ({ appConfig, utils }) => {
  const response = await fetch(
    `https://my-system.com/api/account/${appConfig.accountId}/payment-plans`,
  );
  const paymentPlans = await response.json();

  await utils.traits.setTraitGroup(
    `payment-plans-${appConfig.accountId}`,
    Object.fromEntries(
      paymentPlans.map((plan) => [
        plan.id,
        { name: plan.name, description: `${plan.price} ${plan.frequency}` },
      ]),
    ),
  );

  return { message: `Synced ${paymentPlans.length} plans` };
};

export default taskWorkflow;
```

##### Syncing traits from a third-party system - paginated

A configuration-scoped task that fetches payment plans from a paginated-API and stores them as traits in the installing organization.
Using steps ensures that if the task fails part-way through, it can be resumed from the last successful API call.

```typescript
import type { AppTaskWorkflow } from "mos:workflow";

const taskWorkflow: AppTaskWorkflow = async ({ appConfig, task, utils }) => {
  const { items: paymentPlans } = await task.stepWhile(
    "plan-fetch",
    async ({ iteration }) => {
      const response = await fetch(
        `https://my-system.com/api/account/${appConfig.accountId}/payment-plans/pages/${iteration}`,
      );
      const { page, hasMore } = await response.json();
      return { items: page, continue: hasMore };
    },
  );

  await utils.traits.setTraitGroup(
    `payment-plans-${appConfig.accountId}`,
    Object.fromEntries(
      paymentPlans.map((plan) => [
        plan.id,
        { name: plan.name, description: `${plan.price} ${plan.frequency}` },
      ]),
    ),
  );

  return { message: `Synced ${paymentPlans.length} plans` };
};

export default taskWorkflow;
```
