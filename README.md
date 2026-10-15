# Network Orchestration for AWS Transit Gateway
## Formerly known as: Serverless Transit Network Orchestrator (STNO)

[🚀 Solution Landing Page](https://aws.amazon.com/solutions/implementations/network-orchestration-aws-transit-gateway)
| [📖 Implementation Guide](https://docs.aws.amazon.com/solutions/latest/network-orchestration-aws-transit-gateway/solution-overview.html)
| [🚧 Feature request](https://github.com/aws-solutions-library-samples/network-orchestration-for-aws-transit-gateway/issues/new?assignees=&labels=feature-request%2C+enhancement&template=feature_request.md&title=)
| [🐛 Bug Report](https://github.com/aws-solutions-library-samples/network-orchestration-for-aws-transit-gateway/issues/new?assignees=&labels=bug%2C+triage&template=bug_report.md&title=)
| [📜 Documentation Improvement](https://github.com/aws-solutions-library-samples/network-orchestration-for-aws-transit-gateway/issues/new?assignees=&labels=document-update&template=documentation_improvements.md&title=)

> **Support and deployment model.** This project is an **AWS Guidance Solution**: sample
> code that you deploy, own, and operate in your own accounts. It does not ship with
> managed releases, ETAs, or an operational support path.
>
> **There are no prebuilt CloudFormation templates or hosted assets, and no one-click
> deployment.** You build the templates and Lambda/console assets from this repository and
> stage them to an Amazon S3 bucket **in your own account**, then launch the templates —
> exactly as described in
> [Deploy the Guidance](https://docs.aws.amazon.com/solutions/latest/network-orchestration-aws-transit-gateway/deploy-the-guidance.html).

## Table of contents

- [Solution overview](#solution-overview)
- [Architecture](#architecture)
- [Deploy](#deploy)
  - [Prerequisites](#prerequisites)
  - [Step 1: Build deployment assets](#step-1-build-deployment-assets)
  - [Step 2: Stage assets in your S3 bucket](#step-2-stage-assets-in-your-s3-bucket)
  - [Step 3: Launch the stacks](#step-3-launch-the-stacks)
- [Update an existing deployment](#update-an-existing-deployment)
- [Customization and local development](#customization-and-local-development)
- [Troubleshooting](#troubleshooting)
- [File structure](#file-structure)
- [License](#license)
- [Collection of operational metrics](#collection-of-operational-metrics)

## Solution overview

Network Orchestration for AWS Transit Gateway adds automation to AWS Transit Gateway. It
provides the tools to automate setting up and managing transit networks in multi-account
and multi-Region AWS environments, and deploys a web interface to help you control, audit,
and approve transit network changes. It supports both AWS Organizations and standalone AWS
account types.

This version supports Transit Gateway inter-Region peering and Amazon VPC prefix lists,
and can register the Transit Gateway with AWS Network Manager so you can visualize and
monitor your global network from a single dashboard.

## Architecture

The solution follows a hub-and-spoke deployment model with the following workflow:

1. An Amazon EventBridge rule monitors specific VPC and subnet tag changes.
2. An EventBridge rule in the spoke account sends the tags to the EventBridge bus in the hub account.
3. Rules on the EventBridge bus invoke an AWS Lambda function to start the solution workflow.
4. AWS Step Functions (the solution state machine) processes network requests from the spoke accounts.
5. The state machine attaches a VPC to the transit gateway.
6. The state machine updates the VPC route table associated with the tagged subnet.
7. The state machine updates the transit gateway route table with association and propagation changes.
8. (Optional) The state machine updates the attachment name with the VPC name and the Organizational Unit (OU) name for the spoke account.
9. The solution updates Amazon DynamoDB with the information extracted from the event and the resources created, updated, or deleted in the workflow.

<img src="./architecture.png" width="800" height="450">

## Deploy

You build the solution from this repository and host the assets in an S3 bucket in your
own account; there are no AWS-hosted templates to launch. The authoritative, step-by-step
instructions (with every stack parameter) are in the implementation guide —
[Deploy the Guidance](https://docs.aws.amazon.com/solutions/latest/network-orchestration-aws-transit-gateway/deploy-the-guidance.html).
The steps below are a quick reference.

### Prerequisites

Build from a machine that has the AWS CLI, Git, and:

- Python `3.12`, pip `23.2.1`
- Poetry `>= 2.1.3`
- Node.js `18.x`, npm `9.x`

### Step 1: Build deployment assets

See [Step 1: Build deployment assets](https://docs.aws.amazon.com/solutions/latest/network-orchestration-aws-transit-gateway/step-1-build-deployment-assets.html).

Create an S3 bucket **in your account** whose name **ends with the Region** you deploy into
(the build appends `-<region>` to the base name). If you deploy spoke stacks into more than
one Region, create a bucket in each Region.

```
git clone https://github.com/aws-solutions-library-samples/network-orchestration-for-aws-transit-gateway.git
cd network-orchestration-for-aws-transit-gateway/deployment
chmod +x ./build-s3-dist.sh

# ./build-s3-dist.sh <BUCKET_BASE_NAME> network-orchestration-for-aws-transit-gateway <VERSION> <BUCKET_BASE_NAME>
# Use the latest release tag as <VERSION>, for example v3.3.29:
./build-s3-dist.sh my-bucket network-orchestration-for-aws-transit-gateway v3.3.29 my-bucket
```

Use the same bucket base name for the first and fourth arguments. The build produces the
four templates in `deployment/global-s3-assets/` and the Lambda, web console, and AWS
AppSync GraphQL assets in `deployment/regional-s3-assets/`.

### Step 2: Stage assets in your S3 bucket

Upload the regional assets to your Region bucket, under the same version you built:

```
aws s3 cp ./regional-s3-assets/ \
  s3://<BUCKET_BASE_NAME>-<region>/network-orchestration-for-aws-transit-gateway/<VERSION>/ \
  --recursive
```

Grant every account you deploy into (hub, each spoke, and — if you use AWS Organizations —
the management account) read access to the staged code with a bucket policy allowing
`s3:GetObject` on `arn:aws:s3:::<BUCKET_BASE_NAME>-<region>/network-orchestration-for-aws-transit-gateway/*`.
Because the policy names specific accounts (or uses `aws:PrincipalOrgID`), you can keep S3
Block Public Access enabled.

### Step 3: Launch the stacks

Upload the templates from `deployment/global-s3-assets/` directly in the AWS CloudFormation
console (or reference them from your own S3 bucket). Deploy in the same Region as your
staged assets:

- **Hub account:** `network-orchestration-hub.template`, then
  `network-orchestration-hub-service-linked-roles.template`.
- **Spoke accounts:** `network-orchestration-spoke.template`.
- **AWS Organizations management account (optional):** `network-orchestration-organization-role.template`.

For the full parameter reference, follow
[Step 4: Launch the hub stack](https://docs.aws.amazon.com/solutions/latest/network-orchestration-aws-transit-gateway/step-4-launch-the-hub-stack.html)
and the surrounding deploy pages.

## Update an existing deployment

To move an existing deployment to a newer version, rebuild and re-stage the assets
(Steps 1–2) with the new version into your own bucket, then update each stack per the
implementation guide:

- [Update the Guidance](https://docs.aws.amazon.com/solutions/latest/network-orchestration-aws-transit-gateway/update-the-guidance.html)
- [Update the hub stack](https://docs.aws.amazon.com/solutions/latest/network-orchestration-aws-transit-gateway/update-the-hub-stack.html)
- [Update the spoke stacks](https://docs.aws.amazon.com/solutions/latest/network-orchestration-aws-transit-gateway/update-the-spoke-stacks.html)
- [Update the organization role stack (optional)](https://docs.aws.amazon.com/solutions/latest/network-orchestration-aws-transit-gateway/update-the-organization-role-stack-optional.html)

When updating the hub stack, replace the current template with the newly built
`network-orchestration-hub.template` and review the change set before executing. Updating
from a version earlier than **v3.3.0** requires values for the **Cognito Domain Prefix** and
**Allow Listed Ranges** parameters.

> The implementation guide notes that a hub update deletes the
> `AWSServiceRoleForResourceAccessManager` service-linked role and that you must re-deploy
> the service-linked-role stack afterward. This applies only to upgrades **crossing v3.3.1**
> (when the role was moved to its own stack). Upgrades between later versions do not remove
> the role.

## Customization and local development

```
# Python unit tests
cd ./source/lambda
poetry install
poetry run pytest

# Web console / Node unit tests
cd ./source/ui
npm ci
npm run test
```

Run `npx npm run prettier-format` in `source` before raising a PR. Build artifacts land in
each package's `build/` directory; anything under `build/private` is build-only and is not
published.

## Troubleshooting

See [Troubleshooting](https://docs.aws.amazon.com/solutions/latest/network-orchestration-aws-transit-gateway/troubleshooting.html).

## File structure

```
|-.github
|-architecture.png                                     [ architecture diagram ]
|-deployment/
  |-manifest-generator                                        [ generates manifest files for the solution UI ]
  |-network-orchestration-hub.template                        [ hub template ]
  |-network-orchestration-hub-service-linked-roles.template   [ hub template, deploys service-linked roles ]
  |-network-orchestration-spoke.template                      [ spoke template, consolidated with service-linked roles for StackSets ]
  |-network-orchestration-organization-role.template          [ role template, deploys in the management account ]
  |-build-s3-dist.sh                                          [ builds the solution assets ]
|-source/
  |-cognito-trigger                   [ manages new user creation in the Cognito user pool ]
  |-lambda/                           [ solution microservices ]
    |-custom_resource                 [ CloudFormation custom resources ]
    |-tgw_peering_attachment          [ manages Transit Gateway peering attachments ]
    |-tgw_vpc_attachment              [ manages VPC-to-Transit-Gateway attachments ]
  |-ui                                [ solution UI components ]
  |-run-unit-test.sh                  [ runs unit tests ]
|-additional_files                    [ CODE_OF_CONDUCT, NOTICE, LICENSE, sonar-project.properties, etc. ]
```

## License

See the [LICENSE](./LICENSE.txt) file.

## Collection of operational metrics

This solution can send anonymized operational metrics to AWS. For details and how to opt
out, see the
[implementation guide](https://docs.aws.amazon.com/solutions/latest/network-orchestration-aws-transit-gateway/solution-overview.html).
AWS's collection of this data is subject to the [AWS Privacy Notice](https://aws.amazon.com/privacy/).

---

Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file
except in compliance with the License. A copy is located at
http://www.apache.org/licenses/LICENSE-2.0 or in the [LICENSE](./LICENSE.txt) file. This
file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
express or implied. See the License for the specific language governing permissions and
limitations under the License.
