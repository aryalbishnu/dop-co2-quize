// Quick-read cheat sheets, one per topic.
// To add one: append { domain, topic, sections: [...] }.
//   A section is { h: "Heading", items: ["bullet", ...] } or { h: "Heading", table: [[header...], [row...], ...] }.
//   Use **bold** and `code` inside text.

window.CHEATSHEETS = [
  {
    domain: "d1", topic: "CodeCommit",
    sections: [
      { h: "Key facts", items: [
        "Managed **private Git**. Encrypted at rest with KMS (`aws/codecommit` by default, or a **customer-managed key** per repository), and in transit over HTTPS/SSH.",
        "**No resource-based repository policies.** Access is controlled by **IAM only**. Repositories can't be shared through RAM.",
        "Managed policies: `FullAccess` (includes delete repository) · `PowerUser` (everything except **DeleteRepository**) · `ReadOnly`.",
        "No built-in replication and **not supported by AWS Backup**. Use EventBridge → CodeBuild/Lambda running `git push --mirror`.",
        "Audit (\"who deleted the branch?\") → **CloudTrail** (`GitPush`, `DeleteBranch`, …).",
        "Migrate with full history → `git clone --mirror` + `git push --mirror`."
      ]},
      { h: "Authentication", table: [
        ["Method", "Who", "Remember"],
        ["HTTPS Git credentials", "IAM users", "Static and long-term. Not usable by the root user."],
        ["SSH keys", "IAM users", "Public key uploaded to the IAM user."],
        ["git-remote-codecommit (`codecommit::`)", "Roles, SSO, federated, cross-account", "**Temporary credentials**. Recommended."],
        ["CLI credential helper", "Roles, federated", "Older temporary-credential method over HTTPS."]
      ]},
      { h: "Branch protection", items: [
        "IAM **Deny** on `GitPush`, `DeleteBranch`, `PutFile`, `Merge*` with the condition `codecommit:References = refs/heads/main` (plus a `Null` check).",
        "**Approval rule template** → require N approvals (from an approval pool of roles) for pull requests into the listed branches, across many repositories.",
        "An approval rule alone does **not** stop a direct `git push` to main. You need the IAM Deny for that."
      ]},
      { h: "Triggers vs notifications vs EventBridge", table: [
        ["", "Events", "Targets", "Use for"],
        ["Trigger", "Push, create/delete branch or tag only", "SNS, Lambda (max 10)", "Simple reaction to a push"],
        ["Notification rule", "Pull requests, comments, approvals, branches", "SNS, Slack/Teams (Chatbot)", "Telling **people**"],
        ["EventBridge", "**All** events, including pull requests", "Any target (CodeBuild, Step Functions, pipeline…)", "**Automation**"]
      ]},
      { h: "Exam patterns", items: [
        "Run tests when a pull request is created → **EventBridge** → CodeBuild → Lambda `PostCommentForPullRequest`.",
        "Start the pipeline on push → **EventBridge rule** (set `PollForSourceChanges` to false).",
        "Trigger → Lambda not firing → missing **Lambda resource policy** for `codecommit.amazonaws.com`.",
        "Notifications missing → the **SNS topic policy** must allow `codestar-notifications.amazonaws.com`.",
        "Cross-account → a **role in the repository's account** + `sts:AssumeRole` + git-remote-codecommit.",
        "Cross-account pipeline → a **customer-managed KMS key** on the artifact bucket + a cross-account role + a bucket policy."
      ]}
    ]
  },
  {
    domain: "d1", topic: "CodeBuild",
    sections: [
      { h: "Key facts", items: [
        "Managed build service. Each build runs in a fresh container, and you pay per minute.",
        "Build timeout: default **60 minutes**, maximum **8 hours**. The queued timeout (time waiting to start) is a separate setting.",
        "Sources: CodeCommit, GitHub, Bitbucket, GitLab, S3, or the pipeline. **Webhooks** with filter groups for GitHub/Bitbucket/GitLab. **CodeCommit → EventBridge**.",
        "`docker build` needs **privileged mode**.",
        "Private environment image (Docker Hub) → **registry credential** stored in Secrets Manager.",
        "One repository, many projects → **buildspec override** (a path or inline)."
      ]},
      { h: "Phases and failure behaviour", items: [
        "`install` → `pre_build` → `build` → `post_build`, then artifacts are uploaded.",
        "If `install` or `pre_build` fails, the build stops (build and post_build are skipped).",
        "If `build` fails, **post_build STILL runs**. Guard pushes with `CODEBUILD_BUILD_SUCCEEDING == 1`.",
        "`finally` runs even after failures. `on-failure: ABORT | CONTINUE`."
      ]},
      { h: "Environment variables", items: [
        "Priority: **build start / pipeline action > project > buildspec**.",
        "Types: `PLAINTEXT` (never for secrets) · `PARAMETER_STORE` · `SECRETS_MANAGER`.",
        "Useful built-ins: `CODEBUILD_RESOLVED_SOURCE_VERSION` (commit ID), `CODEBUILD_BUILD_SUCCEEDING`, `CODEBUILD_WEBHOOK_TRIGGER`, `CODEBUILD_SRC_DIR`.",
        "Pass a value to later actions → `exported-variables` + a namespace → `#{BuildVariables.IMAGE_TAG}`."
      ]},
      { h: "Secrets", items: [
        "`parameter-store:` needs `ssm:GetParameters` (+ `kms:Decrypt` for a customer-managed key). `secrets-manager:` needs `secretsmanager:GetSecretValue`.",
        "**Rotation** or cross-account sharing → Secrets Manager. Cheap configuration values → Parameter Store.",
        "Values are masked in the logs."
      ]},
      { h: "Caching", table: [
        ["Cache", "Best for", "Note"],
        ["S3", "Builds that run **rarely**, dependencies (`.m2`, pip, node_modules)", "Lasts and is shared across hosts. Slower to restore."],
        ["Local: source", "Big Git repositories", "Best-effort"],
        ["Local: Docker layer", "Docker builds that run **often**", "Needs privileged mode"],
        ["Local: custom", "Folders listed in `cache.paths`, builds that run often", "Best-effort, kept on the host only briefly"]
      ]},
      { h: "Builds in a VPC", items: [
        "Used to reach private RDS, ElastiCache, internal APIs. The build's network interface has **no public IP**.",
        "Internet access → **private subnet + NAT gateway**. A public subnet **never** works.",
        "No internet → VPC endpoints (`ecr.api`, `ecr.dkr`, `logs`, `ssm`, `secretsmanager`, `sts`, `codeartifact.*`) + an **S3 gateway endpoint**.",
        "The service role needs the `ec2:CreateNetworkInterface` / `Describe*` / `CreateNetworkInterfacePermission` permissions."
      ]},
      { h: "Reports, monitoring, batch, debugging", items: [
        "**Report groups**: JUnit, Cucumber, TestNG, NUnit, TRX (tests) · JaCoCo, Cobertura, Clover, SimpleCov, LCOV (coverage). Kept 30 days, can be exported to S3.",
        "Events: **EventBridge** 'CodeBuild Build State Change' / 'Build Phase Change'. Metrics: `FailedBuilds`, `Duration`…",
        "Batch: `build-list` (parallel) · `build-matrix` (versions or OS) · `build-graph` (builds that depend on each other).",
        "Debug: **Session Manager** + `codebuild-breakpoint`, or the local CodeBuild agent."
      ]}
    ]
  },
  {
    domain: "d1", topic: "CodeArtifact",
    sections: [
      { h: "Key facts", items: [
        "Managed package repository: npm, PyPI, Maven/Gradle, NuGet, Swift, Ruby, Cargo, **generic** (any file).",
        "Replaces Nexus or Artifactory. Stores internal packages and **proxies and caches public ones**.",
        "Has **resource policies** (a domain policy and a repository policy), unlike CodeCommit.",
        "Versions are immutable (they can't be overwritten)."
      ]},
      { h: "Domains and repositories", items: [
        "**Domain** = top-level container. Files are **stored once per domain** (no duplicate storage cost). **One KMS key, fixed at creation** (to change it: new domain + migrate).",
        "**Repository** = holds versions. **Only one external connection** per repository (`public:npmjs`, `public:pypi`, `public:maven-central`…).",
        "**Upstreams**: up to **10**, searched in order. Fetched versions are **kept** in each repository along the chain, so they survive public outages or removal.",
        "Pattern: `npm-store` + `pypi-store` (external connections) → upstreams of `team-repo` = **one endpoint** for everything.",
        "Promote a tested version → `copy-package-versions` (for example dev-repo → release-repo)."
      ]},
      { h: "Package origin controls (dependency confusion)", table: [
        ["First arrived by", "Publish", "Upstream", "Result"],
        ["Published internally", "ALLOW", "**BLOCK**", "Public versions with the same name are blocked"],
        ["Fetched from upstream", "BLOCK", "ALLOW", "You can't publish over the public name"]
      ]},
      { h: "Auth and IAM", items: [
        "Token: `get-authorization-token`, valid **15 minutes to 12 hours (default 12)**. A 401 the next day = expired, so log in again.",
        "Getting a token needs `codeartifact:GetAuthorizationToken` **+ `sts:GetServiceBearerToken`**.",
        "Read: `ReadFromRepository`, `GetRepositoryEndpoint`. Publish: `PublishPackageVersion` + `PutPackageMetadata`.",
        "`aws codeartifact login --tool npm | pip | twine` only. **Maven/Gradle** → put the token in `settings.xml` (username `aws`).",
        "npm scope only → `login --namespace mycorp`."
      ]},
      { h: "Cross-account and VPC", items: [
        "Cross-account = **domain policy** (GetAuthorizationToken) + **repository policy** (ReadFromRepository) + **IAM in the caller's account** (+ the KMS key policy if it's a customer-managed key).",
        "Private VPC, no NAT → interface endpoints `codeartifact.api` + `codeartifact.repositories` (private DNS) + an **S3 gateway endpoint**.",
        "CodeArtifact fetches public packages for you, so builds never need internet access."
      ]},
      { h: "Version status and events", items: [
        "Published → **Unlisted** (hidden from listing, still downloadable) → **Archived** (no downloads, kept, can be restored) → **Disposed** (files deleted).",
        "**EventBridge** 'Package Version State Change' → start dependent pipelines. CodeArtifact has no triggers."
      ]}
    ]
  },
  {
    domain: "d1", topic: "ECR",
    sections: [
      { h: "Key facts", items: [
        "Managed Docker/OCI registry. **One private registry per account per Region** (`<acct>.dkr.ecr.<region>.amazonaws.com`) containing repositories.",
        "Login: `aws ecr get-login-password | docker login --username AWS --password-stdin <registry>`. The token lasts **12 hours**.",
        "IAM: `ecr:GetAuthorizationToken` (resource `*`). Pull = `BatchGetImage`, `GetDownloadUrlForLayer`, `BatchCheckLayerAvailability`. Push = `InitiateLayerUpload`, `UploadLayerPart`, `CompleteLayerUpload`, `PutImage`.",
        "ECS/Fargate: the **task EXECUTION role** pulls the image (not the task role).",
        "**Tag immutability** (IMMUTABLE) → reusing an existing tag on push fails. Deploy by **digest** for the strongest guarantee.",
        "Encryption: AES-256 by default, or KMS (`aws/ecr` or a customer-managed key). **Fixed at repository creation**, so a new key means a new repository + migrating the images."
      ]},
      { h: "Policies", table: [
        ["Policy", "Scope", "Use"],
        ["Repository policy", "One repository", "**Cross-account pull** (+ IAM in the consumer account + KMS if a customer-managed key)"],
        ["Registry permissions policy", "Whole registry", "Allow another account to **replicate in** (`ecr:CreateRepository`, `ecr:ReplicateImage`)"]
      ]},
      { h: "Lifecycle policies", items: [
        "Expire images automatically: `tagStatus` tagged / untagged / any · `tagPatternList` (for example `prod-*`) · `countType` **imageCountMoreThan** or **sinceImagePushed** (days).",
        "**Lower rulePriority is evaluated first.** A rule with `tagStatus: any` must have the **highest** number.",
        "Each image is matched by **at most one rule**. Deletion happens **within 24 hours**.",
        "Test safely with **lifecycle policy preview** (a dry run).",
        "Per repository and **not copied by replication** → use repository creation templates."
      ]},
      { h: "Scanning: basic vs enhanced", table: [
        ["", "Basic", "Enhanced (Inspector)"],
        ["Scans", "OS packages only", "OS + **language packages** (npm, pip, Maven, Go…)"],
        ["When", "On push or manual (manual once per 24 hours)", "On push + **continuous** (re-scans when new CVEs appear)"],
        ["Cost", "**Free**", "Paid"],
        ["Event", "`ECR Image Scan` (aws.ecr)", "`Inspector2 Finding` (aws.inspector2)"],
        ["Results", "ECR console / API", "Inspector, ECR, **Security Hub**, organization-wide delegated admin"]
      ]},
      { h: "Replication", items: [
        "Configured at the **registry level in the SOURCE**: rules + destinations (Region, optionally account) + repository **prefix filters**.",
        "**Not retroactive**: only images pushed after it is set up. **Deletions are not replicated**. One-way.",
        "Cross-account = source replication rule **+ destination registry permissions policy**.",
        "Destination repositories are created automatically. Settings (KMS key, immutability, lifecycle, policy) come from **repository creation templates**.",
        "Only need to pull, same Region? → repository policy (no copies). Other Regions or DR → replication."
      ]},
      { h: "Exam patterns", items: [
        "Fail the pipeline on CRITICAL findings → CodeBuild: `aws ecr wait image-scan-complete` + `describe-image-scan-findings` → exit 1.",
        "Alert on critical findings → **EventBridge** (Inspector2 Finding, severity CRITICAL) → SNS / Lambda.",
        "Private subnets, no NAT → **ecr.api + ecr.dkr** interface endpoints + **S3 gateway** (+ logs).",
        "Docker Hub rate limits, or private subnets need public images → **pull-through cache** (credentials in Secrets Manager, prefix `ecr-pullthroughcache/`).",
        "Start a pipeline on image push → **CodePipeline ECR source action** (EventBridge image push event).",
        "Image signing → **AWS Signer + Notation**. Audit of who pushed or deleted an image → **CloudTrail**."
      ]},
      { h: "Who pulls the image", table: [
        ["Service", "Identity that pulls", "Remember"],
        ["ECS / Fargate", "Task **execution** role", "Not the task role"],
        ["EKS (EC2 nodes)", "**Node IAM role**", "`AmazonEC2ContainerRegistryReadOnly`"],
        ["CodeBuild custom image", "`codebuild.amazonaws.com`", "Cross-account → repository policy allows the CodeBuild service principal"],
        ["Lambda container image", "`lambda.amazonaws.com`", "Cross-account → repository policy allows the function's account + the Lambda service principal"],
        ["Build servers / laptops", "The IAM identity", "**ECR credential helper** avoids the 12-hour `docker login` expiry"]
      ]},
      { h: "More lifecycle details", items: [
        "`tagPrefixList` = start of the tag · `tagPatternList` = `*` wildcards anywhere.",
        "**Several prefixes or patterns in ONE rule = the image must match ALL of them.** Use separate rules for OR.",
        "Lifecycle doesn't know whether an image is **in use**. A count rule can delete an image a running service still needs, so protect release tags.",
        "Deleted images **can't be recovered**. Audit with **CloudTrail**: `PolicyExecutionEvent` (lifecycle) vs `BatchDeleteImage` (person or script). EventBridge 'ECR Image Action' DELETE.",
        "Newer (2025, check the docs): lifecycle can **archive** images to a cheaper tier, and **tag immutability exclusion filters** (for example keep `latest` mutable)."
      ]},
      { h: "More scanning details", items: [
        "Registry scanning configuration: type + **filters** (`prod-*`) + frequency **SCAN_ON_PUSH** · **CONTINUOUS_SCAN** (enhanced) · **MANUAL** (basic). Per-repository `scanOnPush` is legacy.",
        "Basic now uses an **AWS-native** engine (Clair is deprecated). `describe-image-scan-findings` gives **counts by severity**. A scan can be FAILED or UNSUPPORTED_IMAGE.",
        "Enhanced: **re-scan duration** (by push or pull date: 30 days, 180 days, lifetime) controls cost · finding status Active / **Suppressed** / Closed · **suppression rules** for accepted risk · **SBOM export** · **delegated administrator** for the Organization.",
        "**Never store vulnerable images** → scan in the build **before push**: Inspector SBOM generator + `ScanSbom`, or the CodePipeline **InspectorScan** action."
      ]},
      { h: "More replication and encryption details", items: [
        "Filter type = **PREFIX_MATCH**. Status → `describe-image-replication-status` (IN_PROGRESS / COMPLETE / FAILED).",
        "Same-account cross-Region → **no registry policy needed**. Cross-account → the destination registry policy is required.",
        "Destination encryption is **not copied** (keys are regional). Set it with a **creation template**. Cost = cross-Region transfer + storage in each destination.",
        "Encryption options: AES-256 · KMS · **KMS_DSSE** (dual layer). ECR uses **KMS grants**. A customer-managed key means pullers also need `kms:Decrypt`."
      ]}
    ]
  },
  {
    domain: "d1", topic: "CodePipeline",
    sections: [
      { h: "Structure", items: [
        "Pipeline → **stages** → **actions**. Stages are linked by **transitions** (which can be **disabled** to hold changes). Each run is an **execution**.",
        "**Same `runOrder` = parallel**. A higher runOrder runs after the lower ones. Any failed action fails the stage, and you can **retry** the stage or just the failed actions.",
        "Source providers: CodeCommit · **S3 (versioning required)** · ECR · **CodeConnections** (GitHub, GitLab, Bitbucket). GitHub version 1 (OAuth) is deprecated.",
        "Change detection: **EventBridge** (CodeCommit, S3, ECR) or the connection's **webhook**. Polling is legacy.",
        "`CODE_ZIP` (default, no .git) vs **`CODEBUILD_CLONE_REF`** (full clone) → CodeBuild role needs `codecommit:GitPull` / `UseConnection`."
      ]},
      { h: "Artifacts and KMS", items: [
        "Artifact store = an **S3 bucket in the pipeline's Region**. Artifacts are zipped and passed by name.",
        "**Never deleted automatically** → add an **S3 lifecycle rule**.",
        "Default key `aws/s3` works in one account only. **Cross-account needs a customer-managed KMS key** + key policy + bucket policy.",
        "Bucket policy: deny unencrypted uploads, deny when `aws:SecureTransport` is false."
      ]},
      { h: "Manual approval", items: [
        "Pauses the pipeline. Optional **SNS** notification, review URL, comments.",
        "**Times out after 7 days** → the action fails.",
        "Restrict approvers → IAM **`codepipeline:PutApprovalResult`** on the approval action's ARN (`pipeline/stage/action`).",
        "Automate → Lambda: `GetPipelineState` (token) → `PutApprovalResult`.",
        "Infrastructure review → **CHANGE_SET_REPLACE → approval → CHANGE_SET_EXECUTE**."
      ]},
      { h: "Cross-Region and cross-account", table: [
        ["", "What you need"],
        ["Cross-Region", "**`artifactStores`**: an S3 bucket **+ KMS key per Region**. Artifacts are copied automatically. **Source stays in the pipeline's Region.**"],
        ["Cross-account", "**Customer-managed key** (key policy allows the target) + bucket policy + **role in the target account** (action `roleArn`) trusting Tools + pipeline role `sts:AssumeRole`"],
        ["Cross-account CloudFormation", "+ a **deployment role** (`RoleArn` in the configuration) and `iam:PassRole` on it"],
        ["Cross-account CodeCommit source", "Role in the source account + **EventBridge rule forwarding to the Tools event bus**"]
      ]},
      { h: "Variables", items: [
        "Syntax `#{namespace.var}`. Give actions a **namespace**. Values are specific to each execution.",
        "Source: `#{SourceVariables.CommitId}`, `BranchName`, `CommitMessage`. CodeBuild: `exported-variables`. Lambda: `outputVariables`. CloudFormation: stack outputs.",
        "**V2 pipeline variables** `#{variables.Env}`: a default value, **overridden when the pipeline is started**. Built-in: `#{codepipeline.PipelineExecutionId}`."
      ]},
      { h: "V2 vs V1", table: [
        ["Feature", "V1", "V2"],
        ["Pricing", "About $1 per active pipeline per month", "Per action execution minute"],
        ["Triggers (branch, **file path**, **Git tag**, **pull request**)", "No", "Yes (CodeConnections sources)"],
        ["Pipeline variables", "No", "Yes"],
        ["Execution modes", "SUPERSEDED", "SUPERSEDED · **QUEUED** · **PARALLEL**"],
        ["Conditions, automatic **ROLLBACK** or **RETRY**", "No", "Yes"]
      ]},
      { h: "Execution modes and conditions", items: [
        "**SUPERSEDED**: the latest change wins (waiting runs are replaced). **QUEUED**: every run, **in order**. **PARALLEL**: runs at the same time (feature branches, PRs).",
        "Conditions: **Entry** (FAIL / SKIP) · **On success** (e.g. ROLLBACK) · **On failure** (ROLLBACK / RETRY).",
        "Rules: **CloudWatchAlarm**, **DeploymentWindow**, VariableCheck, LambdaInvoke, Commands.",
        "ROLLBACK = re-deploy the stage with the source revisions of its **last successful execution**."
      ]},
      { h: "Deploy actions", items: [
        "CloudFormation `ActionMode`: CREATE_UPDATE · DELETE_ONLY · REPLACE_ON_FAILURE · **CHANGE_SET_REPLACE** · **CHANGE_SET_EXECUTE**.",
        "SAM or macros → **`CAPABILITY_AUTO_EXPAND`**. IAM resources → `CAPABILITY_IAM` / `CAPABILITY_NAMED_IAM`.",
        "`TemplateConfiguration` = parameters + tags + stack policy. **StackSets** action = many accounts and Regions.",
        "ECS rolling → **`imagedefinitions.json`**. ECS blue/green (CodeDeployToECS) → **`imageDetail.json` + `appspec.yaml` + `taskdef.json`**.",
        "S3 deploy `Extract: true` (static sites). Lambda invoke → must call **`PutJobSuccessResult` / `PutJobFailureResult`**."
      ]},
      { h: "Monitoring and control", items: [
        "**EventBridge**: Pipeline / Stage / Action Execution State Change (FAILED → SNS or Lambda).",
        "**Notification rules** → SNS or Slack (Chatbot), including **'approval needed'**, with no code.",
        "**CloudTrail** for who started, approved or changed the pipeline. Stop = 'stop and wait' or 'stop and abandon'.",
        "Pipeline as code: CloudFormation `AWS::CodePipeline::Pipeline` or **CDK Pipelines** (self-mutating, `crossAccountKeys`)."
      ]}
    ]
  },
  {
    domain: "d1", topic: "CodeConnections",
    sections: [
      { h: "Key facts", items: [
        "A secure link from AWS to **GitHub, Bitbucket and GitLab** with **no stored tokens** (it uses the provider's **app installation**). Free.",
        "**Renamed** from CodeStar Connections to **CodeConnections**. ARNs: `codestar-connections` / `codeconnections`. Put **both prefixes** in IAM policies.",
        "Replaces the **deprecated GitHub version 1** source action (OAuth or personal token) and `PutWebhook`.",
        "Belongs to **one account and one Region**. A pipeline can't use another account's connection."
      ]},
      { h: "Providers", table: [
        ["Provider", "Needs"],
        ["GitHub / GitHub Enterprise Cloud, Bitbucket Cloud, GitLab.com", "A connection"],
        ["GitHub Enterprise Server, GitLab self-managed", "A **host** + connection (**VPC configuration** for private servers: subnets, security groups, TLS certificate)"],
        ["Azure DevOps, Bitbucket Server / Data Center", "**Not supported** → push a zip to **S3** or mirror to CodeCommit"]
      ]},
      { h: "States", items: [
        "**PENDING** → **AVAILABLE** → (ERROR if the app is uninstalled or access is revoked).",
        "Created by **CloudFormation or the CLI = always PENDING** → console **'Update pending connection'** to finish the handshake (**can't be automated**).",
        "A GitHub org owner or Bitbucket workspace admin may need to approve the app.",
        "Repository missing from the list → add it to the app's **selected repositories**."
      ]},
      { h: "CodePipeline source action", items: [
        "Provider `CodeStarSourceConnection`: `ConnectionArn`, `FullRepositoryId` (owner/repo), `BranchName`, `OutputArtifactFormat`, `DetectChanges`.",
        "`CODE_ZIP` (no .git) vs **`CODEBUILD_CLONE_REF`** (full clone) → **CodeBuild role needs UseConnection**.",
        "Variables: `CommitId`, `CommitMessage`, `BranchName`, `FullRepositoryName`, `AuthorDate`.",
        "**V2 triggers** (connection sources only): push (branch, **file path**, **Git tag**) and **pull request** (opened, updated, closed).",
        "Not starting on push → `DetectChanges` is false, a trigger filter doesn't match, or the connection isn't AVAILABLE."
      ]},
      { h: "IAM", table: [
        ["Permission", "Who"],
        ["`UseConnection`", "Pipeline role · **CodeBuild role** (clone ref / connection source)"],
        ["`PassConnection`", "The **person or tool creating** the pipeline or resource"],
        ["`CreateConnection`, `DeleteConnection`, `CreateHost`…", "Admins only"],
        ["Condition `FullRepositoryId`", "Limit to specific repositories"],
        ["Conditions `PassedToService`, `ProviderType`, `ProviderPermissionsRequired`", "Limit the service, the provider, or read-only access"]
      ]},
      { h: "Other services", items: [
        "**CodeBuild**: a connection as source credentials (can be the account default) · **webhooks with filter groups** for PR checks without a pipeline (status reported back).",
        "**CodeBuild-hosted GitHub Actions runners** (`WORKFLOW_JOB_QUEUED`) → jobs with VPC access and IAM roles.",
        "**CloudFormation Git sync** → stack synced from Git (connection + repository link + deployment file), no pipeline.",
        "Also: Service Catalog sync, CodeGuru Reviewer, Proton, Amazon Q Developer.",
        "IaC: `AWS::CodeStarConnections::Connection` (still PENDING) → authorize once and keep its ARN in Parameter Store."
      ]}
    ]
  },
  {
    domain: "d1", topic: "CodeGuru",
    sections: [
      { h: "Note", items: [
        "Features are moving into **Amazon Q Developer** (code review) and **Inspector** (code security). CodeGuru Security is retired, and Reviewer may not accept new customers. For the exam, know **when to choose each tool**."
      ]},
      { h: "Reviewer vs Profiler", table: [
        ["", "Reviewer", "Profiler"],
        ["Type", "Analyses code without running it (ML + automated reasoning)", "Measures the **running** app (sampling agent, ~1% overhead)"],
        ["When", "**Pull requests** + full repository analysis", "Test or **production**"],
        ["Languages", "**Java, Python**", "**JVM (Java, Kotlin, Scala), Python**"],
        ["Output", "**Comments on the pull request**", "**Flame graphs**, recommendations, anomaly alerts"],
        ["Keywords", "code review, before merge, secrets", "CPU hot spots, latency, reduce compute cost"]
      ]},
      { h: "CodeGuru Reviewer", items: [
        "Finds: AWS API misuse (**pagination**, retries, re-created clients) · **resource leaks** · **concurrency** · security (OWASP / CWE) · **hard-coded secrets** (→ Secrets Manager) · code quality.",
        "**Incremental** = each pull request (changed code only) · **Full repository analysis** = whole branch (baseline).",
        "Repositories: CodeCommit, GitHub (incl. Enterprise), Bitbucket (through **CodeConnections**).",
        "CI/CD: upload to an S3 bucket named **`codeguru-reviewer-*`** + API, or the **GitHub Action**. Java security scans need **build artifacts** (.jar / .class).",
        "Customer-managed KMS key optional · service-linked role · priced per **lines of code**."
      ]},
      { h: "CodeGuru Profiler", items: [
        "Agent → **profiling group**. Runs on EC2, ECS, EKS, Fargate, **Lambda**, on-premises.",
        "Java `-javaagent` · Python `codeguru_profiler_agent` · **Lambda: turn on 'Code profiling'**.",
        "IAM: **`AmazonCodeGuruProfilerAgentAccess`** (`ConfigureAgent`, `PostAgentProfile`). An empty group usually means a missing permission.",
        "Views: **CPU flame graph** · **latency (wall-clock, includes waiting)** · **heap summary** (Java memory) · hotspots.",
        "Recommendation reports (with **cost savings**) · **anomaly detection** → SNS · priced per profiling hour."
      ]},
      { h: "Which service?", table: [
        ["Need", "Service"],
        ["Pull request review, AWS best practices, secrets in code", "**CodeGuru Reviewer**"],
        ["Expensive methods in a running app, CPU cost", "**CodeGuru Profiler**"],
        ["Slow request **across services**", "**X-Ray** (then Profiler inside the slow service)"],
        ["CVEs in packages, images, Lambda", "**Inspector**"],
        ["ML-based operational anomalies across resources", "**DevOps Guru**"],
        ["CPU % or memory % metrics", "**CloudWatch** / Container Insights / Lambda Insights"],
        ["Store and rotate the found secrets", "**Secrets Manager**"]
      ]}
    ]
  }
];

window.CHEATSHEETS.push({
  domain: "d1", topic: "CI/CD Concepts",
  sections: [
    { h: "CI vs CD vs CD", table: [
      ["Term", "Meaning", "Exam signal"],
      ["Continuous integration", "Small merges, **automatic build + test** on every change", "Find integration problems early"],
      ["Continuous **delivery**", "Always ready to release, **manual approval** before prod", "\"Approval before production\""],
      ["Continuous **deployment**", "Passing changes go to prod **automatically**", "\"No manual intervention\""]
    ]},
    { h: "Branching, flags, environments", items: [
      "**Trunk-based** (main + very short branches, **feature flags**) · **GitHub flow** (feature branch → PR → main) · **GitFlow** (develop, release and hotfix branches).",
      "**Feature flags** decouple deploy from release → **AWS AppConfig** (gradual rollout, automatic rollback on alarms).",
      "Promote Dev → Test → Staging → Prod. Isolate with **separate accounts** + a central Tools pipeline account (smaller blast radius)."
    ]},
    { h: "Tests by stage", table: [
      ["Stage", "Tests", "Tools"],
      ["Build / PR", "Unit, lint, SAST, secrets, dependency CVEs", "CodeBuild reports, CodeGuru Reviewer, Inspector"],
      ["Test env", "Integration, contract", "CodeBuild in a VPC"],
      ["Staging", "Acceptance / UI, **load**, security, **chaos**", "Device Farm, **Distributed Load Testing on AWS**, **FIS**"],
      ["Prod", "**Smoke** + continuous **canaries**", "CodeDeploy ValidateService, **CloudWatch Synthetics** → alarm → rollback"]
    ]},
    { h: "Exit codes", items: [
      "0 = pass, **non-zero = the command or phase fails** (CodeBuild), the deployment fails (CodeDeploy hooks), or the container is unhealthy (health checks).",
      "Hidden failures: an `|| true` fallback, or **pipes** (`pytest | tee`) → `set -o pipefail`. Plain `curl` exits 0 on HTTP 500 → **`curl --fail`**.",
      "Complex test orchestration → **Step Functions invoke action**. Custom checks → Lambda invoke (`PutJobSuccessResult` / `PutJobFailureResult`)."
    ]},
    { h: "Artifacts", items: [
      "S3: **versioning** · lifecycle (**expire noncurrent versions**) · SSE-KMS + deny non-HTTPS · Block Public Access · replication · presigned URLs.",
      "**Object Lock** (WORM, needs versioning): **governance** (can be overridden with permission) vs **compliance** (nobody, not even root) · legal hold.",
      "**Build once, deploy many**: promote the same artifact / **image digest**. Keep settings outside it (Parameter Store, AppConfig, TemplateConfiguration).",
      "Lambda: only signed code → **AWS Signer + code signing configuration (Enforce)**."
    ]},
    { h: "Third-party CI", table: [
      ["Situation", "Answer"],
      ["GitHub Actions / GitLab / Bitbucket → AWS without keys", "**IAM OIDC provider + role** (AssumeRoleWithWebIdentity), restrict **`sub`** (repository + branch) and `aud`"],
      ["Jenkins out of capacity", "**CodeBuild plugin for Jenkins** (or a CodePipeline Jenkins action)"],
      ["Jenkins on EC2 / ECS", "Instance profile / task role (never stored keys)"],
      ["Jenkins on-premises without keys", "**IAM Roles Anywhere** (X.509 certificates)"],
      ["Tool with no pipeline action", "**Custom action + job worker** (PollForJobs), or Lambda / Step Functions / Commands"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d1", topic: "CodeDeploy",
  sections: [
    { h: "Platforms", table: [
      ["Platform", "Types", "Traffic", "Hooks"],
      ["EC2 / on-premises", "**In-place** or **blue/green** (EC2 only, needs a load balancer)", "Instance by instance, or the load balancer switches", "**Scripts** (the agent)"],
      ["Lambda", "Traffic shifting", "The **alias** moves between versions", "**Lambda functions**"],
      ["ECS", "Blue/green", "Listener → new **task set**", "**Lambda functions**"]
    ]},
    { h: "Agent, targets, revision", items: [
      "Install and update the agent with **Systems Manager** (State Manager, `AWSCodeDeployAgent`). **Outbound 443 only**. Private subnets → CodeDeploy VPC endpoints + **S3 gateway endpoint** (or NAT).",
      "The **instance profile** reads the revision (`s3:GetObject` + `kms:Decrypt`). The **service role** is CodeDeploy's own role.",
      "Targets: EC2 tags (up to 3 groups: AND between groups, OR inside one) · Auto Scaling groups · on-premises tags (register with an **IAM session ARN**). On-premises = **in-place only**.",
      "**`appspec.yml` at the root** of the bundle (S3 zip / tar / tgz, or GitHub). Logs: `/opt/codedeploy-agent/deployment-root/`."
    ]},
    { h: "EC2 hooks (in-place)", items: [
      "(load balancer) BeforeBlockTraffic → BlockTraffic → AfterBlockTraffic",
      "**ApplicationStop → DownloadBundle → BeforeInstall → Install → AfterInstall → ApplicationStart → ValidateService**",
      "(load balancer) BeforeAllowTraffic → AllowTraffic → AfterAllowTraffic. DownloadBundle, Install, BlockTraffic and AllowTraffic are CodeDeploy's own steps (no scripts).",
      "Non-zero exit or timeout (maximum **3600 seconds**) = failure. **ValidateService** = health check.",
      "**ApplicationStop runs the PREVIOUS revision's script** → if it's broken, use `--ignore-application-stop-failures`.",
      "`file_exists_behavior`: **DISALLOW** (default, fails) · OVERWRITE · RETAIN."
    ]},
    { h: "EC2 deployment configurations", table: [
      ["Configuration", "Succeeds if"],
      ["AllAtOnce", "At least 1 instance succeeds"],
      ["HalfAtATime", "At least half succeed"],
      ["OneAtATime", "All succeed (**except the last may fail**)"],
      ["Custom", "Minimum healthy hosts: **HOST_COUNT** or **FLEET_PERCENT** (fails with HEALTH_CONSTRAINTS)"],
      ["Zonal", "**One AZ at a time** + monitoring wait after each"]
    ]},
    { h: "Blue/green EC2 and Auto Scaling", items: [
      "Blue/green: **copy the Auto Scaling group** (or tagged instances) → move traffic **immediately or after you continue** → **terminate the original after a wait, or keep it** (fast rollback).",
      "Auto Scaling in the deployment group → a lifecycle hook gives new instances the **last successful revision**. Scale-out during a deployment → **follow-up deployment** (or pause scaling).",
      "New instances launched and terminated in a loop + hook abandoned → the deployment on new instances is failing."
    ]},
    { h: "Lambda and ECS", items: [
      "Lambda AppSpec: function Name, **Alias**, CurrentVersion, TargetVersion. Hooks: **BeforeAllowTraffic, AfterAllowTraffic**.",
      "ECS: **`CODE_DEPLOY` controller + 2 target groups + production listener (+ test listener)**. Hooks: BeforeInstall → AfterInstall → **AfterAllowTestTraffic** → BeforeAllowTraffic → AfterAllowTraffic.",
      "Hook functions must call **`PutLifecycleEventHookExecutionStatus`** (otherwise they fail after about 1 hour).",
      "Canary = X% **then all the rest** · Linear = **+X% every N minutes** · AllAtOnce. Lambda: `LambdaCanary10Percent5/10/15/30Minutes`, `LambdaLinear10PercentEvery1/2/3/10Minute(s)`. ECS: `ECSCanary10Percent5/15Minutes`, `ECSLinear10PercentEvery1/3Minutes`.",
      "**SAM**: `AutoPublishAlias` + `DeploymentPreference` (Type, Alarms, PreTraffic / PostTraffic hooks).",
      "ECS service role: `AWSCodeDeployRoleForECS` + **`iam:PassRole`** on the task roles. Pipeline: `taskdef.json` + `appspec.yaml` + `imageDetail.json`.",
      "ECS **rolling update** = ECS's own controller, not CodeDeploy."
    ]},
    { h: "Rollback, alarms, monitoring", items: [
      "Automatic rollback **on failure** and/or **on alarm** (needs alarms on the group). Can be overridden per deployment.",
      "EC2 rollback = a **new deployment of the last good revision** (new ID). Lambda / ECS / blue-green = **traffic moves back**. No good revision = nothing to roll back to.",
      "**Up to 10 alarms** per group. An alarm in ALARM → **stop** (+ roll back). Emergency → **ignore alarm configuration**.",
      "Triggers → **SNS** · **EventBridge** 'Deployment State-change' → Lambda or tickets · notification rules → Slack · CloudTrail."
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d1", topic: "Deployment Patterns",
  sections: [
    { h: "Patterns compared", table: [
      ["Pattern", "Downtime", "Capacity", "Mixed versions", "Rollback", "Extra cost"],
      ["**All at once**", "**Yes**", "Drops to 0", "No", "Slow (redeploy)", "None · fastest"],
      ["**Rolling**", "No", "**Minus one batch**", "**Yes**", "Slow (redeploy)", "None"],
      ["**Rolling + additional batch**", "No", "**Full**", "Yes", "Slow (redeploy)", "One extra batch"],
      ["**Immutable**", "No", "Full (briefly double)", "Briefly", "**Terminate new servers**", "Double, briefly"],
      ["**Blue/green**", "No", "Full (two environments)", "**No**", "**Fastest: switch back**", "Highest"],
      ["**Canary**", "No", "Full", "Yes (on purpose)", "Fast (shift back)", "Low to medium"],
      ["**Linear**", "No", "Full", "Yes", "Fast (shift back)", "Low to medium"],
      ["**Traffic splitting** (Beanstalk)", "No", "Full (briefly double)", "Yes", "Automatic, quick", "Double, briefly"]
    ]},
    { h: "Key ideas", items: [
      "**Mutable** (in-place: all at once, rolling, + batch) vs **immutable** (new servers: immutable, blue/green, new AMIs, instance refresh) → no drift.",
      "**Canary** = X% → wait → **all the rest** · **Linear** = **+X% every N minutes** · **Traffic splitting** = Beanstalk's canary (split % + evaluation time).",
      "Blue/green switching: **ALB target groups (weighted) = instant**. Route 53 DNS = slowed by **TTL caching**. Beanstalk = **Swap environment URLs**.",
      "Blue/green needs: a shared database with **expand and contract** schema changes · sessions in **ElastiCache / DynamoDB** · ALB **deregistration delay** · Beanstalk **RDS outside the environment**.",
      "**Feature flags (AppConfig)** = release separately from deploy (linear / exponential, bake time, alarm rollback). Evidently is retired."
    ]},
    { h: "Elastic Beanstalk policies", items: [
      "All at once · Rolling (batch size, healthy threshold, ignore health check) · Rolling with additional batch · Immutable (temporary Auto Scaling group) · Traffic splitting (ALB).",
      "**Blue/green is NOT a policy** → clone the environment + **Swap environment URLs** (or Route 53).",
      "Deployment policies = **application versions**. Rolling updates (time / health based) = **configuration changes**."
    ]},
    { h: "Patterns by service", table: [
      ["Service", "How"],
      ["CodeDeploy EC2 / on-premises", "In-place (AllAtOnce, Half, One, minimum healthy hosts, **zonal**) · blue/green (EC2 + load balancer). On-premises = **in-place only**."],
      ["CodeDeploy Lambda / ECS", "**Canary**, **Linear**, AllAtOnce (alias / two target groups)"],
      ["ECS native", "Rolling (`minimumHealthyPercent` / `maximumPercent`) + **deployment circuit breaker** rollback"],
      ["EKS", "RollingUpdate (`maxSurge`, `maxUnavailable`), Recreate · Argo Rollouts / Flagger for canary or blue/green"],
      ["Auto Scaling group", "**Instance refresh**: MinHealthyPercentage, checkpoints, skip matching, automatic rollback"],
      ["CloudFormation", "`AutoScalingRollingUpdate` = rolling · **`AutoScalingReplacingUpdate` (WillReplace)** = immutable"],
      ["Lambda (no CodeDeploy)", "**Alias weighted routing** (e.g. 90/10)"],
      ["API Gateway", "**Stage canary release** → promote"],
      ["ALB / Route 53", "**Weighted target groups** (instant) / weighted records (DNS)"],
      ["CloudFront", "**Continuous deployment** (staging distribution, % or header)"]
    ]},
    { h: "Pick the pattern", table: [
      ["Requirement", "Pattern"],
      ["Cheapest, fastest, downtime OK", "All at once"],
      ["No downtime, less capacity OK, no extra cost", "Rolling"],
      ["Full capacity, lowest extra cost", "Rolling with additional batch"],
      ["Failure must not touch running servers", "Immutable"],
      ["Fastest rollback, **no mixed versions**", "Blue/green (switch everything at once)"],
      ["Few real users first, then all", "Canary / Beanstalk traffic splitting"],
      ["Even steps over time", "Linear"],
      ["Release features without deploying", "AppConfig feature flags"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d1", topic: "Elastic Beanstalk",
  sections: [
    { h: "Deployment policies", table: [
      ["Policy", "Downtime", "Capacity", "Rollback", "Cost"],
      ["All at once", "**Yes**", "Zero during deploy", "Manual redeploy", "None"],
      ["Rolling", "No", "Reduced by one batch", "Manual redeploy (mixed versions)", "None"],
      ["Rolling with additional batch", "No", "**Full**", "Manual redeploy (mixed versions)", "One extra batch"],
      ["Immutable", "No", "Double briefly", "**Terminate temporary ASG** (safest)", "High"],
      ["Traffic splitting", "No", "Double briefly", "**Automatic** (ALB canary)", "High"],
      ["Blue/green (swap URLs)", "No", "Two environments", "**Swap back**", "Highest"]
    ]},
    { h: "Key facts", items: [
      "Namespace `aws:elasticbeanstalk:command`: `DeploymentPolicy`, `BatchSizeType`, `BatchSize`, **`Timeout` (default 600 s)**, `IgnoreHealthCheck`",
      "Traffic splitting: `NewVersionPercent` + `EvaluationTime`, **needs an ALB**",
      "**Single-instance** environments: only All at once or Immutable",
      "**Config changes** that replace instances use **rolling updates** (`aws:autoscaling:updatepolicy:rollingupdate`, type **Time / Health / Immutable**), not DeploymentPolicy",
      "**Managed platform updates**: weekly window, minor + patch only, uses immutable, **needs enhanced health**",
      "**Load balancer type can't be changed** after creation; major platform branch change → new environment + swap URLs",
      "Application version limit **1,000** → **lifecycle policy** (by count or age)",
      "Beanstalk runs a **CloudFormation stack**: change resources through Beanstalk, never directly (drift)",
      "**Service role** = Beanstalk calls AWS for you · **instance profile** = your app's permissions",
      "A terminated environment can be **restored within 6 weeks**"
    ]},
    { h: ".ebextensions", items: [
      "Folder `.ebextensions/` at the **bundle root**, files end in **`.config`**, YAML or JSON, processed **alphabetically**",
      "Order: packages → groups → users → sources → files → **commands** (before app extracted) → services → **container_commands** (after app staged, before live)",
      "**`leader_only: true`** on container_commands = run once (DB migrations)",
      "`Resources` = extra CloudFormation resources, **deleted with the environment**",
      "Priority: **direct settings (console/CLI/API) > saved config > .ebextensions > defaults**",
      "Keep **RDS outside** Beanstalk for production and for blue/green",
      "Also: `.platform/hooks/` (prebuild, predeploy, postdeploy), `.platform/confighooks/`, `.platform/nginx/conf.d/`, `Procfile`, `Buildfile`, `env.yaml` (manifest + environment links)",
      "Logs: `aws:elasticbeanstalk:cloudwatch:logs` StreamLogs · X-Ray: `aws:elasticbeanstalk:xray` XRayEnabled",
      "Secrets: **Secrets Manager / Parameter Store** references, never in .ebextensions"
    ]},
    { h: "Swap environment URLs", items: [
      "Clone or create green → deploy → test → **`eb swap` / SwapEnvironmentCNAMEs** → keep blue until DNS TTL expires → swap back to roll back",
      "Same **application** and **Region**; both running",
      "It's a **DNS (CNAME) swap**: not instant, cached clients still hit blue",
      "Gradual shift between two environments → **Route 53 weighted records**",
      "Use for: platform branch change, LB type change, separate test environment, fastest rollback"
    ]},
    { h: "Worker environments", items: [
      "Web tier → **SQS** → **sqsd** daemon → HTTP POST to **localhost** (`HttpPath`)",
      "**200 OK = delete**; anything else = retry after visibility timeout → **DLQ** after `MaxRetries`",
      "**VisibilityTimeout > job time**, or the job runs twice; raise `InactivityTimeout` for long jobs",
      "No load balancer; queue auto-created or your own; FIFO supported (no cron with FIFO)",
      "**`cron.yaml`** periodic tasks: **leader election via DynamoDB** → runs once, not per instance",
      "Scale on **ApproximateNumberOfMessagesVisible**, not CPU",
      "Web role needs `sqs:SendMessage`; link tiers with **environment links** in `env.yaml`"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["10% of live traffic for 15 min, auto rollback", "Traffic splitting"],
      ["Failure must not touch running instances", "Immutable"],
      ["Full capacity, lowest extra cost", "Rolling with additional batch"],
      ["Migration runs on every instance", "container_commands + leader_only"],
      [".ebextensions change ignored", "Direct setting overrides it, or file not at bundle root / not .config"],
      ["Change LB type or platform branch", "New environment + swap URLs"],
      ["Requests take minutes", "Worker environment + SQS"],
      ["Scheduled job runs on every instance", "cron.yaml in a worker"],
      ["Deploy fails at ~10 minutes", "Raise command Timeout"],
      ["Database deleted with environment", "Create RDS outside Beanstalk"],
      ["Version limit reached", "Application version lifecycle policy"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d1", topic: "Lambda Versions and Aliases",
  sections: [
    { h: "Versions", items: [
      "**$LATEST** = mutable; **published version** = immutable snapshot of **code + config (env vars too)**, numbered, never reused",
      "Changed config in production → **publish a new version** and repoint the alias (or read settings from Parameter Store)",
      "**Reserved concurrency** = per function (all versions) · **provisioned concurrency** = per version or alias, **never $LATEST**",
      "**SnapStart** applies only to published versions",
      "PublishVersion with no changes returns the existing version; pass **`CodeSha256`** to publish only the tested code",
      "Can't delete a version an alias points to; old versions count toward the **75 GB code storage** quota → clean up",
      "Unqualified ARN = **$LATEST** · `:7` = version · `:prod` = alias",
      "Metrics dimension **`ExecutedVersion`** = the version that actually ran"
    ]},
    { h: "Aliases", items: [
      "Named, movable pointer to a version (`dev`, `prod`); own ARN; **can't point to another alias**",
      "Production callers (API Gateway, event source mappings, S3, SNS, EventBridge) use the **alias ARN**",
      "**Fastest rollback** = `update-alias` to the previous version",
      "Permissions are **per qualifier** → `add-permission --qualifier prod` (else API Gateway 500 \"Invalid permissions\")",
      "API Gateway stage → alias via **stage variable** `${stageVariables.lambdaAlias}`",
      "Alias can hold provisioned concurrency (scale with Application Auto Scaling), function URL, destinations"
    ]},
    { h: "Weighted aliases", items: [
      "`--routing-config AdditionalVersionWeights={\"8\"=0.1}` → 90% main, 10% v8",
      "**Two published versions max**, **no $LATEST**, **same execution role**, **same DLQ config**",
      "Routing is **random per invocation**, not sticky → only for backward-compatible changes",
      "Manual weights = you watch and roll back; **CodeDeploy** = automatic shifting, alarms, hooks, rollback"
    ]},
    { h: "SAM DeploymentPreference", items: [
      "**`AutoPublishAlias: live`** = publish a new version on code change and move the alias (required for DeploymentPreference)",
      "`DeploymentPreference`: **Type**, **Alarms**, **Hooks** (PreTraffic, PostTraffic), TriggerConfigurations (SNS), Role, Enabled",
      "SAM creates the CodeDeploy application, deployment group, service role and alias `UpdatePolicy`",
      "**Alarm in ALARM** or **hook Failed / timed out** → alias back to the old version, **stack update fails**",
      "Hooks must call **`PutLifecycleEventHookExecutionStatus`** (Succeeded or Failed); **1-hour timeout**",
      "Default role invokes only hooks named **`CodeDeployHook_*`**; hook role needs `lambda:InvokeFunction` on the new version",
      "Scope alarms with **`ExecutedVersion`** so only the new version's errors count"
    ]},
    { h: "Deployment types", table: [
      ["Type", "Behaviour"],
      ["Canary10Percent5/10/15/30Minutes", "10% for N minutes, then 100% (**two steps**)"],
      ["Linear10PercentEvery1/2/3/10Minutes", "+10% every N minutes (**equal steps**)"],
      ["AllAtOnce", "100% now (hooks and alarms still run)"],
      ["Custom config", "Your own CodeDeploy config, referenced by name"]
    ]},
    { h: "Without SAM", items: [
      "CloudFormation `AWS::Lambda::Version` **doesn't republish** on code change unless the logical ID changes → SAM AutoPublishAlias",
      "`AWS::Lambda::Alias` + **`UpdatePolicy: CodeDeployLambdaAliasUpdate`** (ApplicationName, DeploymentGroupName, Before/AfterAllowTrafficHook)",
      "CodeDeploy Lambda appspec: Name, Alias, **CurrentVersion**, **TargetVersion**; hooks only **BeforeAllowTraffic / AfterAllowTraffic**",
      "CDK: `LambdaDeploymentGroup` with deploymentConfig, alarms, preHook, postHook"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Gradual shift + auto rollback, least code", "SAM AutoPublishAlias + DeploymentPreference + Alarms"],
      ["Test new version before any traffic", "PreTraffic hook"],
      ["Deployment stuck ~1 hour", "Hook didn't call PutLifecycleEventHookExecutionStatus"],
      ["Hook AccessDenied", "Name it CodeDeployHook_* or custom Role"],
      ["Env var change not in production", "Publish new version + update alias"],
      ["API Gateway 500 after using alias", "add-permission with --qualifier"],
      ["Saved console code broke production", "Trigger used $LATEST → point it at an alias"],
      ["Fastest rollback", "update-alias to previous version"],
      ["Weights rejected", "$LATEST used, different role or DLQ, or >2 versions"],
      ["Rolled back though new version fine", "Scope alarm with ExecutedVersion"],
      ["Code storage limit", "Delete old versions"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d1", topic: "ECS and Fargate",
  sections: [
    { h: "Task definitions", items: [
      "`family:revision`, revisions are **immutable**; a deployment = service uses a new revision",
      "**Execution role** = pull image from ECR, send logs, **fetch secrets at start** · **Task role** = your app's AWS calls",
      "Fargate: **`awsvpc` only** (own ENI + security group), **task-level cpu/memory required**, no privileged, ephemeral storage 20 GiB (up to 200)",
      "`secrets` valueFrom SSM / Secrets Manager → injected **at task start only** → **force new deployment** after rotation",
      "`memory` = hard limit (**exit 137 OutOfMemory**) · `memoryReservation` = soft · `essential` container stops → task stops",
      "`dependsOn` START / COMPLETE / SUCCESS / HEALTHY for sidecars · `stopTimeout` up to 120 s on Fargate",
      "Logs: `awslogs` or **FireLens** (`awsfirelens`) · container `healthCheck`",
      "Same tag, new image → **`--force-new-deployment`**; better: unique tag per build + **ECR tag immutability**",
      "Private subnet, no NAT → endpoints **ecr.api, ecr.dkr, S3 gateway**, logs (+ ssm / secretsmanager)"
    ]},
    { h: "Rolling updates", table: [
      ["min / max (desired 4)", "Result"],
      ["**100 / 200** (default)", "4 new first, then stop old · full capacity, needs double room"],
      ["**50 / 100**", "Stop 2, start 2 · **no extra capacity**"],
      ["100 / 150", "2 extra at a time"],
      ["0 / 100", "Stop all · downtime"],
      ["**100 / 100**", "**Stuck**: can't stop or add tasks"]
    ]},
    { h: "Rolling: key settings", items: [
      "**`healthCheckGracePeriodSeconds`** > start-up time, or slow tasks are killed repeatedly",
      "ALB **deregistration delay** = draining old tasks (default 300 s)",
      "States: PRIMARY / ACTIVE / INACTIVE · rolloutState IN_PROGRESS / COMPLETED / FAILED",
      "Without circuit breaker a broken deployment **retries forever**",
      "CloudFormation waits for service stable; circuit breaker makes it fail fast → stack rollback"
    ]},
    { h: "Circuit breaker and alarms", items: [
      "`deploymentCircuitBreaker: {enable, rollback}` · **ECS (rolling) controller only**, not CODE_DEPLOY",
      "Stage 1: tasks fail to reach RUNNING · Stage 2: tasks fail health checks",
      "Threshold = **half the desired count, min 3, max 200** → FAILED; rollback → **last COMPLETED** deployment",
      "**`deploymentConfiguration.alarms`** (5XX, latency) with rollback → catches **healthy-but-bad** code",
      "EventBridge **ECS Deployment State Change**: SERVICE_DEPLOYMENT_FAILED / COMPLETED"
    ]},
    { h: "CodeDeploy blue/green", items: [
      "Service with **`deploymentController: CODE_DEPLOY`** (fixed at creation)",
      "ALB or NLB, **two target groups**, production listener + optional **test listener**",
      "Replacement (green) task set → test traffic → production shift → blue kept for **termination wait (up to 2,880 min)** → instant rollback",
      "Configs: ECSAllAtOnce, ECSLinear10PercentEvery1/3Minutes, ECSCanary10Percent5/15Minutes, custom · **NLB = AllAtOnce only**",
      "Hooks (Lambda): BeforeInstall, AfterInstall, **AfterAllowTestTraffic**, BeforeAllowTraffic, AfterAllowTraffic · must call PutLifecycleEventHookExecutionStatus",
      "Can't change task definition / LB / network via UpdateService → use a CodeDeploy deployment",
      "Rollback via deployment group **alarms** and failed hooks",
      "Newer: ECS built-in **BLUE_GREEN** (bake time, lifecycle hooks), linear and canary strategies (2025)"
    ]},
    { h: "CodePipeline", table: [
      ["", "Rolling", "Blue/green"],
      ["Action", "**Amazon ECS** (ECS)", "**Amazon ECS (Blue/Green)** (CodeDeployToECS)"],
      ["Input", "**`imagedefinitions.json`** (container name + imageUri)", "**`taskdef.json` + `appspec.yaml`** (+ `imageDetail.json`)"],
      ["Placeholders", "None", "`<IMAGE1_NAME>`, `<TASK_DEFINITION>`"]
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Auto rollback when tasks fail to start / health checks", "Circuit breaker + rollback"],
      ["Rollback when 5XX rises (rolling)", "deploymentConfiguration alarms"],
      ["Test on another port before production", "CodeDeploy blue/green + AfterAllowTestTraffic"],
      ["10% for 5 minutes then all", "ECSCanary10Percent5Minutes (ALB)"],
      ["Instant rollback later", "Longer termination wait time"],
      ["No spare capacity", "min 50 / max 100"],
      ["Slow start, tasks killed", "healthCheckGracePeriodSeconds"],
      ["App AccessDenied", "Task role"],
      ["Can't pull image / read secret", "Execution role + network route"],
      ["Rotated secret, new same-tag image", "--force-new-deployment"],
      ["Fargate targets unhealthy", "Task SG must allow ALB SG; target type ip"],
      ["Cheap but some guaranteed tasks", "FARGATE base + FARGATE_SPOT weight"],
      ["Shell into container, audited", "ECS Exec"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d1", topic: "EKS for CI/CD",
  sections: [
    { h: "Building blocks", items: [
      "AWS runs the **control plane** (multi-AZ); you pick the data plane",
      "**Managed node groups** (default) · self-managed nodes · **Fargate profiles** (namespace + labels; **no DaemonSets, no privileged, no EBS**) · **Auto Mode** · Karpenter for fast node scaling",
      "Objects: Pod, **Deployment** (rolling + rollback), Service (LoadBalancer → NLB), **Ingress → ALB** (AWS Load Balancer Controller), ConfigMap/Secret, Namespace, ServiceAccount, HPA",
      "Upgrades: **one minor version at a time**, control plane → add-ons → nodes · or **new cluster + Route 53** (blue/green)",
      "Standard support ~14 months; extended support costs extra"
    ]},
    { h: "Pipeline to EKS", items: [
      "CodeBuild builds image (privileged mode) → ECR (commit SHA tag) → **kubectl / Helm** → `kubectl rollout status --timeout`",
      "Or **CodePipeline Amazon EKS deploy action** (Helm or manifests, private clusters via VPC)",
      "Or **GitOps** (Argo CD / Flux): pull model, **no cluster creds in CI**, drift self-heals",
      "**CodeDeploy does NOT support EKS** (only EC2/on-prem, Lambda, ECS)"
    ]},
    { h: "Pipeline authentication", items: [
      "IAM: **`eks:DescribeCluster`** (for `update-kubeconfig`)",
      "Kubernetes: map the role with an **access entry** + access policy (`AmazonEKSClusterAdminPolicy`, or `AmazonEKSEditPolicy` **scoped to a namespace**)",
      "Legacy: `aws-auth` ConfigMap `mapRoles` (a bad edit can lock everyone out)",
      "Only the **cluster creator** is admin by default → others get **Unauthorized**",
      "**Private endpoint** → run CodeBuild **in the VPC**"
    ]},
    { h: "Pod permissions", items: [
      "**EKS Pod Identity**: agent add-on + pod identity association; role trusts `pods.eks.amazonaws.com`",
      "**IRSA**: IAM OIDC provider + role trust on the service account + `eks.amazonaws.com/role-arn` annotation",
      "**Never the node role** for app permissions (every pod would get it)",
      "Image pulls: EC2 nodes = **node role** (ECR read-only) · Fargate = **pod execution role**",
      "Controllers (AWS Load Balancer Controller) also use IRSA / Pod Identity"
    ]},
    { h: "Deployments", items: [
      "Rolling: **`maxSurge`** / **`maxUnavailable`** (like ECS max% / min%)",
      "**readinessProbe** = traffic only when ready · **livenessProbe** = restart if stuck (too strict → restart loops)",
      "`kubectl rollout status` / **`rollout undo`** / `rollout history` · `Recreate` = downtime",
      "Helm: **`--atomic --wait`** = auto rollback · `helm rollback`",
      "Blue/green: switch **Service selector** · Canary: pod ratio, **ALB Ingress weights**, **Argo Rollouts / Flagger** (metric analysis + auto rollback)"
    ]},
    { h: "Observability and security", items: [
      "**Control plane logs** (api, **audit**, authenticator, controllerManager, scheduler) → CloudWatch Logs, **off by default**",
      "CloudTrail = EKS API calls; **audit log** = Kubernetes API calls (who deleted what)",
      "Container Insights via **CloudWatch Observability add-on**; Fluent Bit; Managed Prometheus / Grafana",
      "Secrets: **KMS envelope encryption** or **Secrets Manager + CSI driver** (K8s Secrets are only base64)",
      "GuardDuty EKS Protection · ECR scanning · Kyverno / OPA Gatekeeper · HPA (metrics-server) · Cluster Autoscaler / Karpenter"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["kubectl Unauthorized from CodeBuild", "Access entry (or aws-auth mapping)"],
      ["update-kubeconfig AccessDenied", "eks:DescribeCluster"],
      ["CodeBuild times out to cluster", "Private endpoint → CodeBuild in VPC"],
      ["CodeDeploy canary for EKS", "Not supported → Argo Rollouts / Flagger"],
      ["Pods need S3/DynamoDB access", "Pod Identity or IRSA"],
      ["Errors during rolling update", "readinessProbe + maxUnavailable 0"],
      ["Restart loops", "Liveness probe too strict / OOMKilled"],
      ["Pipeline must fail on bad rollout", "rollout status --timeout / helm --atomic --wait"],
      ["Fast rollback", "kubectl rollout undo / helm rollback"],
      ["No creds in CI, drift self-heals", "GitOps (Argo CD / Flux)"],
      ["Who deleted a Deployment", "Control plane audit logs"],
      ["1.29 → 1.31 safely", "One minor at a time, or new cluster + Route 53"],
      ["DaemonSet on Fargate", "Not supported"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d1", topic: "Testing in Pipelines",
  sections: [
    { h: "Where each test runs", table: [
      ["Stage", "Tests"],
      ["Pre-commit / PR", "Lint, unit, **secrets scan** (git-secrets)"],
      ["Build", "**Unit**, lint, **SAST**, **SCA**, secrets, **IaC** (cfn-lint, **cfn-guard**), **image scan** — in parallel"],
      ["Test env", "**Integration**, API / contract, E2E (Device Farm, Playwright)"],
      ["Staging", "**Load** (Distributed Load Testing, k6, JMeter), **DAST** (OWASP ZAP), **chaos (FIS)**, UAT + **manual approval**"],
      ["Production", "Canary / linear with **alarms**, **Synthetics canaries**, feature flags"]
    ]},
    { h: "CodeBuild", items: [
      "**Non-zero exit code = failed build** → failed action → stage stops",
      "`|| true` or a later succeeding command **swallows failures**; `on-failure: CONTINUE` keeps going; `finally` always runs",
      "**Test reports:** JUnit XML, NUnit, TestNG, Cucumber JSON, TRX · **Coverage:** JaCoCo, Cobertura, Clover, SimpleCov, lcov",
      "Report groups keep **30 days** → export raw files to **S3**",
      "Coverage reports **don't fail builds** → `--cov-fail-under` / JaCoCo check",
      "Faster: **batch builds**, **parallel test splitting**, caching · secrets via `env: secrets-manager:`"
    ]},
    { h: "CodePipeline gates", items: [
      "Test actions (CodeBuild), **Commands** action, third-party (Device Farm, BlazeMeter)",
      "**Parallel actions** (same runOrder): any one fails → **stage fails**",
      "**Lambda invoke** must call **PutJobSuccessResult / PutJobFailureResult**",
      "**Manual approval**: 7-day timeout, SNS notification",
      "**V2 conditions**: beforeEntry / onSuccess / onFailure with **CloudWatch alarm rule**, Lambda rule, VariableCheck, deployment window; onFailure **rollback or retry**",
      "Pass deploy outputs to tests with **output variables** `#{Namespace.Output}`"
    ]},
    { h: "Integration and load", items: [
      "**Ephemeral stacks** per run: create → test → delete",
      "**Separate accounts**; masked / synthetic data; never real PII",
      "Deploy hooks: EC2 **ValidateService** · ECS **AfterAllowTestTraffic** (test listener) · Lambda **PreTraffic / BeforeAllowTraffic**",
      "Load: **production-like staging**, thresholds make tool **exit non-zero**, watch metrics and **service quotas**",
      "**Distributed Load Testing on AWS** (Fargate, JMeter / k6 / Locust) · CodeGuru Profiler, X-Ray"
    ]},
    { h: "Security testing", table: [
      ["Check", "Tool"],
      ["Secrets", "git-secrets (pre-commit), trufflehog"],
      ["SAST (code)", "Amazon Q Developer code review, Inspector code scanning, SonarQube"],
      ["SCA (dependencies)", "Inspector SBOM / Scan API, OWASP Dependency-Check"],
      ["IaC", "cfn-lint (syntax) · **cfn-guard / Guard Hooks** (your rules)"],
      ["Images", "**ECR enhanced (Inspector)** = OS + language, continuous · basic = OS only · fail on CRITICAL"],
      ["DAST (running app)", "OWASP ZAP against staging"],
      ["Signing", "AWS Signer + Notation"]
    ]},
    { h: "Production safety", items: [
      "**CloudWatch Synthetics** canaries: scripted checks every few minutes, alarms → rollback",
      "**AWS FIS**: stop instances, add latency, kill tasks, AZ failure · **stop conditions = CloudWatch alarms**",
      "AppConfig feature flags limit blast radius"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Fail build below 80% coverage", "Test tool threshold (exit non-zero)"],
      ["Tests failed, build passed", "Exit code swallowed / on-failure CONTINUE"],
      ["Keep test results 1 year", "Export reports to S3"],
      ["Lambda action times out", "PutJobSuccessResult / PutJobFailureResult"],
      ["Tests need stack's API URL", "Output variables"],
      ["npm CVE missed by ECR", "ECR enhanced scanning"],
      ["Our template rules", "cfn-guard / Guard Hooks"],
      ["Test ECS version before traffic", "Test listener + AfterAllowTestTraffic"],
      ["Stop chaos on errors", "FIS stop conditions"],
      ["Block stage while alarm fires", "V2 beforeEntry alarm rule"],
      ["Mobile device tests", "AWS Device Farm"],
      ["Slow test suite", "Batch builds / test splitting"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d1", topic: "EC2 Image Builder",
  sections: [
    { h: "Golden AMIs", items: [
      "**Bake** patches, runtimes, agents, hardening · **bootstrap** env config at launch · **never bake secrets**",
      "Immutable infrastructure: replace instances with a new AMI instead of patching in place",
      "**Image Builder** = least operational overhead · Packer in CodeBuild = DIY · Patch Manager = in-place patching"
    ]},
    { h: "Building blocks", table: [
      ["Resource", "Key points"],
      ["**Component**", "AWSTOE YAML · phases **build**, **validate** (build instance), **test** (new instance from new AMI) · ExecuteBash, UpdateOS, Reboot, S3Download · **immutable semantic versions** · AWS-managed: update-linux, cloudwatch agent, STIG"],
      ["**Image recipe**", "Parent image (AWS-managed with **x.x.x**, AMI ID, SSM parameter, Marketplace/CIS) + ordered components + block devices · immutable versions · **container recipe** → ECR"],
      ["**Infrastructure config**", "Instance profile **AmazonSSMManagedInstanceCore + EC2InstanceProfileForImageBuilder** · subnet with route to **SSM + S3** · no inbound / no key pair · **terminateInstanceOnFailure** · SNS · S3/CloudWatch logs · IMDSv2"],
      ["**Distribution config**", "Regions · accounts / org / **OUs** · **KMS key per Region** · **launch template** default version · **SSM parameter** with AMI ID · S3 export · ECR for containers"],
      ["**Image pipeline**", "Manual / **StartImagePipelineExecution** / cron · **EXPRESSION_MATCH_AND_DEPENDENCY_UPDATES_AVAILABLE** · image tests · **Inspector scanning** · workflows (**WaitForAction**)"],
      ["**Lifecycle policy**", "Deprecate / disable / delete AMIs **and snapshots** by count, age, tags, exclusions"]
    ]},
    { h: "Pipeline run", items: [
      "SSM Automation → build instance → build + validate → stop → **AMI** → **test instance** from new AMI → Inspector → distribute → terminate",
      "States: BUILDING → TESTING → DISTRIBUTING → **AVAILABLE** / FAILED",
      "Events: **EventBridge Image State Change**, SNS, CloudWatch Logs `/aws/imagebuilder/`"
    ]},
    { h: "Rollout", items: [
      "AMI ID to **SSM Parameter Store** → CloudFormation `AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>` or `{{resolve:ssm:...}}`",
      "Or distribution updates the **launch template** default version",
      "**EventBridge AVAILABLE** → Lambda / Step Functions / CodePipeline → **ASG instance refresh** (min healthy %, checkpoints, alarm rollback)",
      "CloudFormation ASG UpdatePolicy, Beanstalk custom `ImageId`",
      "`AWS::ImageBuilder::Image` builds an AMI during stack creation (GetAtt ImageId)",
      "Governance: **Config approved-amis-by-tag / by-id**, Inspector on running instances → rebuild"
    ]},
    { h: "Security", items: [
      "IMDSv2 · KMS-encrypted AMIs · cross-account → **customer managed key** policy for target account + its **ASG service-linked role**",
      "STIG components / CIS parents · Inspector scanning · approval via **WaitForAction** or CodePipeline manual approval",
      "No internet: **VPC endpoints** (ssm, ssmmessages, ec2messages, S3) + CodeArtifact / mirrors"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Build fails early, no component logs", "Instance profile SSM permissions / route to SSM + S3"],
      ["Need to debug failed build instance", "terminateInstanceOnFailure: false"],
      ["Check service starts on boot", "test phase"],
      ["Build only when something changed", "DEPENDENCY_UPDATES_AVAILABLE condition"],
      ["Always newest base OS", "AWS-managed parent x.x.x / public SSM parameter"],
      ["Stacks use latest AMI", "SSM parameter + parameter type"],
      ["Roll new AMI into ASG", "EventBridge → instance refresh"],
      ["Shared encrypted AMI fails", "Customer managed KMS key policy"],
      ["Old AMIs and snapshots", "Lifecycle policy"],
      ["Approval before distribution", "Workflow WaitForAction"],
      ["Fix a component", "New version + new recipe version"],
      ["Only approved AMIs in use", "Config approved-amis-by-tag"],
      ["Hardened Docker base image", "Container recipe → ECR"]
    ]}
  ]
});

// Domain 1 master sheet goes first so it is the default cheat sheet.
window.CHEATSHEETS.unshift({
  domain: "d1", topic: "Domain 1 Master Sheet",
  sections: [
    { h: "How to pick the answer", items: [
      "Domain 1 = **22%** · tasks: **1.1 CI/CD pipelines**, **1.2 automated testing**, **1.3 artifacts**, **1.4 deployment strategies**",
      "Find the requirement words: **least operational overhead**, **minimal downtime**, **fastest rollback**, **no extra cost**, **most secure**",
      "Prefer **managed / built-in** features over custom Lambda scripts or self-managed servers",
      "Prefer **automatic rollback** (alarms, circuit breaker, hooks) and **no long-term keys** (roles, OIDC, connections, Secrets Manager)",
      "Eliminate answers with a wrong fact (CodeDeploy for EKS, weights on $LATEST, IAM alone for kubectl)"
    ]},
    { h: "Services in one line", table: [
      ["Service", "Remember"],
      ["CodeCommit", "IAM deny with `codecommit:References` · approval rule templates · notification rules / triggers / EventBridge"],
      ["CodeConnections", "GitHub/GitLab/Bitbucket · PENDING → handshake · `codeconnections:UseConnection`"],
      ["CodeBuild", "Non-zero exit fails · `env: secrets-manager:` · VPC builds · privileged for Docker · S3/local cache · reports 30 days · batch builds · 36 h max"],
      ["CodeArtifact", "Domain → repos → upstreams → external connection · token 12 h · package origin controls · VPC endpoints + S3"],
      ["ECR", "Lifecycle policies · tag immutability · basic (OS) vs **enhanced Inspector (OS + language)** · replication · pull through cache"],
      ["CodePipeline", "V2 triggers/filters, variables, stage conditions, QUEUED/PARALLEL/SUPERSEDED · approval 7 days · cross-Region bucket per Region · cross-account CMK + role"],
      ["CodeDeploy", "EC2/on-prem, Lambda, ECS (**not EKS**) · ValidateService · alarms + auto rollback · hook 1 h"],
      ["CodeGuru", "Reviewer = code review + secrets detection · Profiler = runtime hotspots (moving to Q Developer / Inspector)"],
      ["Elastic Beanstalk", "Policies · swap URLs · traffic splitting · `.ebextensions` `leader_only` · worker SQS + cron.yaml · RDS outside"],
      ["Lambda", "Versions immutable · alias pointer · weighted alias 2 published versions · SAM AutoPublishAlias + DeploymentPreference · `CodeDeployHook_*`"],
      ["ECS", "Execution vs task role · 100/200 · circuit breaker + alarms · CodeDeploy blue/green test listener · imagedefinitions vs imageDetail"],
      ["EKS", "eks:DescribeCluster + access entry · Pod Identity/IRSA · readinessProbe · Argo Rollouts · GitOps · audit logs"],
      ["Image Builder", "Component → recipe → infra (SSM role) → distribution (SSM parameter, launch template) · dependency-updates schedule · lifecycle policies"]
    ]},
    { h: "Deployment strategies by service", table: [
      ["Service", "Rolling", "Blue/green", "Canary / linear", "Auto rollback"],
      ["Beanstalk", "Rolling (+ batch)", "Swap URLs", "Traffic splitting", "Immutable / traffic splitting"],
      ["EC2 / ASG", "Instance refresh", "CodeDeploy B/G, ReplacingUpdate", "ALB weights", "Alarms"],
      ["Lambda", "—", "Alias switch", "SAM / CodeDeploy", "Alarms + hooks"],
      ["ECS", "min% / max%", "CodeDeploy", "ECSCanary / ECSLinear", "Circuit breaker + alarms"],
      ["EKS", "maxSurge / maxUnavailable", "Service selector", "Argo Rollouts / Flagger", "Analysis, helm --atomic"],
      ["API Gateway", "—", "Stage switch", "Stage canary", "Manual"],
      ["CloudFront", "—", "—", "Continuous deployment", "Promote / discard"]
    ]},
    { h: "Keywords: source, build, artifacts", table: [
      ["Question says", "Answer"],
      ["Block direct push to main", "IAM deny + `codecommit:References`"],
      ["GitHub source for CodePipeline", "CodeConnections"],
      ["GitHub Actions without keys", "IAM OIDC provider + role"],
      ["On-prem servers need AWS creds", "IAM Roles Anywhere"],
      ["Build needs a password", "`env: secrets-manager:`"],
      ["Build reaches private RDS", "CodeBuild in VPC"],
      ["Docker build permission error", "Privileged mode"],
      ["Test several runtimes at once", "Batch build matrix"],
      ["Private npm/PyPI with public upstream", "CodeArtifact upstream + external connection"],
      ["Dependency confusion", "Package origin controls"],
      ["Old images cost money", "ECR lifecycle policy"],
      ["Wrong image under same tag", "Tag immutability + unique tags"],
      ["npm/pip CVEs in images", "ECR enhanced scanning"],
      ["Docker Hub rate limits", "ECR pull through cache"]
    ]},
    { h: "Keywords: pipelines", table: [
      ["Question says", "Answer"],
      ["Run only for a folder / branch", "V2 trigger filters"],
      ["New commits mustn't cancel a release", "Execution mode QUEUED"],
      ["Pass value between actions", "Output variables `#{Namespace.Var}`"],
      ["Block stage while alarm fires", "V2 beforeEntry alarm rule"],
      ["Auto rollback on stage failure", "V2 onFailure rollback"],
      ["Human sign-off", "Manual approval (7 days)"],
      ["Lambda action hangs", "PutJobSuccessResult / FailureResult"],
      ["Deploy to another Region", "Artifact bucket + KMS key there"],
      ["Deploy to another account", "Customer managed KMS key + bucket policy + cross-account role"],
      ["Start on S3 upload / ECR push", "EventBridge rule"]
    ]},
    { h: "Keywords: deployments", table: [
      ["Question says", "Answer"],
      ["Fastest rollback, no mixed versions", "Blue/green"],
      ["Small % of users, auto rollback", "Canary + alarms"],
      ["Beanstalk full capacity, lowest cost", "Rolling with additional batch"],
      ["Beanstalk failure mustn't touch instances", "Immutable"],
      ["Beanstalk LB type / platform branch change", "New env + swap URLs"],
      ["Migration once (Beanstalk)", "container_commands leader_only"],
      ["Long jobs time out", "Beanstalk worker (SQS)"],
      ["Lambda gradual + rollback, least code", "SAM DeploymentPreference"],
      ["Test Lambda before traffic", "PreTraffic hook"],
      ["API GW 500 after alias", "add-permission --qualifier"],
      ["ECS rolling auto rollback", "Circuit breaker (+ alarms)"],
      ["ECS test port first", "CodeDeploy test listener + AfterAllowTestTraffic"],
      ["ECS app AccessDenied / can't pull", "Task role / execution role"],
      ["ECS stuck 100/100", "Raise maximumPercent"],
      ["CodeDeploy EC2 smoke test", "ValidateService"],
      ["kubectl Unauthorized", "EKS access entry"],
      ["Canary on EKS", "Argo Rollouts / Flagger"],
      ["New AMI to ASG", "Instance refresh"],
      ["Feature on/off without deploy", "AppConfig feature flags"]
    ]},
    { h: "Keywords: testing and AMIs", table: [
      ["Question says", "Answer"],
      ["Fail below coverage %", "Test tool exits non-zero"],
      ["Keep test results a year", "Export reports to S3"],
      ["Tests need new stack URL", "Output variables"],
      ["Template must follow company rules", "cfn-guard / Guard Hooks"],
      ["Secrets committed", "git-secrets + pipeline scan / CodeGuru secrets detector"],
      ["CPU hotspots in production", "CodeGuru Profiler"],
      ["Stop chaos test on errors", "FIS stop conditions"],
      ["Scripted checks in production", "CloudWatch Synthetics"],
      ["Golden AMI, least effort", "EC2 Image Builder"],
      ["Build image only when base changed", "DEPENDENCY_UPDATES_AVAILABLE"],
      ["Stacks always newest AMI", "SSM parameter + parameter type"]
    ]},
    { h: "Numbers to remember", table: [
      ["Item", "Value"],
      ["Manual approval timeout", "7 days"],
      ["CodeBuild reports / max build", "30 days / 36 hours"],
      ["CodeArtifact token", "12 hours"],
      ["CodeDeploy / SAM hook", "1 hour"],
      ["ECS rolling defaults", "min 100% / max 200%"],
      ["ECS circuit breaker", "½ desired, min 3, max 200"],
      ["ECS B/G termination wait", "up to 2 days"],
      ["Lambda weighted alias / code storage", "2 versions / 75 GB"],
      ["Beanstalk versions / timeout / bundle", "1,000 / 600 s / 500 MB"],
      ["Fargate Spot warning / stopTimeout", "2 min / 120 s"],
      ["Lambda canary / linear", "10% for 5,10,15,30 min / 10% every 1,2,3,10 min"]
    ]},
    { h: "Classic wrong answers", items: [
      "**CodeDeploy for EKS** · **weighted alias / provisioned concurrency on $LATEST** · **IAM alone for kubectl**",
      "**Execution role for app permissions** (use task role) · **node role for pods** (use Pod Identity / IRSA)",
      "**Polling** instead of EventBridge · **AWS-managed KMS key cross-account** (use customer managed)",
      "**Custom Lambda to shift traffic** when SAM / CodeDeploy / circuit breaker does it",
      "**Long-term access keys** in CI · **secrets** in buildspec, `.ebextensions`, task env or AMIs",
      "**Load testing production** every commit · **cfn-lint for custom rules** · **ECR basic for npm CVEs**",
      "**Editing** published Lambda versions, component versions or task definition revisions (immutable)"
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d2", topic: "CloudFormation Core",
  sections: [
    { h: "Template sections", table: [
      ["Section", "Key points"],
      ["**Resources**", "**Only required section** · logical ID vs physical ID"],
      ["Parameters", "Literal inputs · types · constraints · NoEcho · UsePreviousValue"],
      ["Rules", "Validate parameter combinations **before** anything runs (Assertions)"],
      ["Mappings", "**Two levels, literals only** · `!FindInMap [Map, Key1, Key2]`"],
      ["Conditions", "Params, mappings, pseudo params, other conditions — **never resources**"],
      ["Transform", "SAM, **LanguageExtensions** (ForEach, Length, FindInMap DefaultValue), Include, macros"],
      ["Outputs", "Show / export values · 200 max · never secrets"],
      ["Limits", "**51,200 bytes** direct / **1 MB** from S3 · 500 resources · 200 params / mappings / outputs"]
    ]},
    { h: "Parameters", items: [
      "Types: String, Number, List<Number>, CommaDelimitedList",
      "**AWS-specific types** (`AWS::EC2::VPC::Id`, `List<AWS::EC2::Subnet::Id>`, KeyPair, Image, SG) = **validated to exist** + console dropdown",
      "**SSM parameter types** `AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>` = read every create/update · **latest AMI** · **no SecureString**",
      "Constraints: AllowedValues, AllowedPattern, Min/MaxLength, Min/MaxValue, ConstraintDescription",
      "**NoEcho** masks describe calls only — leaks via Outputs / Metadata",
      "Metadata `AWS::CloudFormation::Interface` = console groups and labels"
    ]},
    { h: "Conditions and outputs", items: [
      "Equals · And / Or (2–10) · Not · Condition · **If** in properties / outputs",
      "**`!If [Cond, value, !Ref \"AWS::NoValue\"]`** removes a property",
      "`Condition:` attribute on resources and outputs · dependants need the same condition",
      "Condition turns **false on update → resource deleted** (protect with DeletionPolicy)",
      "**Export names unique per account + Region** · **ImportValue same Region only** · export **locked while imported**",
      "Cross-Region / cross-account values → SSM Parameter Store, StackSets, custom resource"
    ]},
    { h: "Intrinsic functions", table: [
      ["Function", "Use"],
      ["**Ref**", "Parameter value / resource **physical ID** (bucket name, instance ID)"],
      ["**GetAtt**", "Attributes: **Arn**, DNSName, Endpoint.Address · literal Resource.Attribute only"],
      ["**Sub**", "`${Param}`, `${Res}`, `${Res.Attr}`, `${AWS::Region}` · **`${!VAR}`** = literal · map form"],
      ["Join / Split / Select", "Lists and strings · `!Select [0, !GetAZs \"\"]`"],
      ["GetAZs", "AZs of the Region (`\"\"` = current)"],
      ["FindInMap", "Mappings lookup (DefaultValue needs LanguageExtensions)"],
      ["Base64", "EC2 **UserData** · write `Fn::Base64: !Sub |`"],
      ["Cidr", "Subnet CIDR lists"],
      ["ImportValue", "Read exports (same Region)"],
      ["ForEach / Length / ToJsonString", "Need **AWS::LanguageExtensions**"]
    ]},
    { h: "Dynamic references and pseudo parameters", items: [
      "`{{resolve:ssm:/name}}` String · `{{resolve:ssm-secure:/name:1}}` SecureString (**limited properties**) · **`{{resolve:secretsmanager:id:SecretString:key}}`** (preferred)",
      "Resolved at create / update only — later secret changes need a stack update",
      "Or `GenerateSecretString` / RDS `ManageMasterUserPassword`",
      "Pseudo: AccountId, Region, StackName, StackId, **Partition** (portable ARNs), URLSuffix, NotificationARNs, **NoValue**"
    ]},
    { h: "Updates, names, tooling", items: [
      "Update behaviours: no interruption · some interruption · **replacement** (old deleted) → preview with **change sets**",
      "**Custom names block replacement** and duplicate stacks → generated names or `${AWS::StackName}`",
      "Capabilities: **CAPABILITY_IAM**, **CAPABILITY_NAMED_IAM** (custom IAM names), **CAPABILITY_AUTO_EXPAND** (macros)",
      "Ref / GetAtt = implicit dependency · **DependsOn** only when no reference",
      "`validate-template` = **syntax only** · **cfn-lint** = properties · **cfn-guard** = policies · `package` → S3, `deploy` uses change sets"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Latest AMI, no template edits", "SSM parameter type"],
      ["Optional property", "If + AWS::NoValue"],
      ["Value from a parameter inside Mappings", "Not allowed (literals only)"],
      ["Condition on a resource", "Not allowed — use a parameter"],
      ["Import across Regions", "Not possible — SSM / custom resource"],
      ["Change an export in use", "Remove imports first"],
      ["Password safely", "resolve:secretsmanager"],
      ["Bash $VAR inside Sub", "${!VAR}"],
      ["ARN for China / GovCloud", "${AWS::Partition}"],
      ["Bucket ARN", "GetAtt Bucket.Arn (Ref = name)"],
      ["Reject bad parameter combos", "Rules section"],
      ["validate passed, deploy failed", "cfn-lint"],
      ["Template too big", "Upload to S3 (1 MB)"],
      ["Named IAM role", "CAPABILITY_NAMED_IAM"],
      ["Validate real VPC ID", "AWS::EC2::VPC::Id type"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d2", topic: "CloudFormation Change Control",
  sections: [
    { h: "Which feature for which risk", table: [
      ["Risk", "Feature"],
      ["What will this update change / replace?", "**Change set** (Replacement: True)"],
      ["Changed outside CloudFormation", "**Drift detection** (+ Config rule)"],
      ["Update might replace / delete prod resources", "**Stack policy**"],
      ["Someone deletes the whole stack", "**Termination protection** + IAM"],
      ["Resource removed / stack deleted → data loss", "**DeletionPolicy**"],
      ["Update replaces resource → old one deleted", "**UpdateReplacePolicy**"],
      ["Direct API deletion", "Service setting: RDS **DeletionProtection**, DynamoDB deletion protection, S3 versioning"]
    ]},
    { h: "Change sets", items: [
      "create-change-set → describe → **execute** or delete · nothing changes until executed",
      "Action: Add / Modify / Remove / Import / **Dynamic** · **Replacement: True / False / Conditional** · Scope · RequiresRecreation",
      "**Intent only** — can still fail at execution · executing makes other change sets obsolete",
      "Types: UPDATE · **CREATE** (REVIEW_IN_PROGRESS) · **IMPORT** · `--include-nested-stacks`",
      "`deploy` uses change sets · **`--no-execute-changeset`** = preview only",
      "IAM: developers **CreateChangeSet**, approvers **ExecuteChangeSet**",
      "CodePipeline: **CHANGE_SET_REPLACE → manual approval → CHANGE_SET_EXECUTE** (other modes: CREATE_UPDATE, DELETE_ONLY, REPLACE_ON_FAILURE)"
    ]},
    { h: "Drift detection", items: [
      "On demand · stack DRIFTED / IN_SYNC · resource **MODIFIED** (expected vs actual), **DELETED**, **NOT_CHECKED** (unsupported type)",
      "Checks properties set in the template · doesn't see secret values behind dynamic references",
      "**Reports only** — revert the change or update the template",
      "Continuous: **Config rule `cloudformation-stack-drift-detection-check`** (or scheduled Lambda `DetectStackDrift`)",
      "Prevent drift: IAM / SCP, changes only through pipelines"
    ]},
    { h: "Stack policy and termination protection", items: [
      "Stack policy actions **Update:Modify / Update:Replace / Update:Delete / Update:*** · Resource `LogicalResourceId/x` · Condition ResourceType",
      "**Default deny once set** → start with `Allow Update:*` on `*` · explicit Deny wins",
      "**Principal must be `*`** (IAM `SetStackPolicy` controls who) · **can't delete, only replace**",
      "**`--stack-policy-during-update-body`** = one-time override",
      "Covers **stack updates only** — not deletion, not console changes",
      "Termination protection: blocks **DeleteStack only** · off by default · nested stacks → **root** · deny `UpdateTerminationProtection` with IAM / SCP"
    ]},
    { h: "DeletionPolicy vs UpdateReplacePolicy", table: [
      ["", "DeletionPolicy", "UpdateReplacePolicy"],
      ["When", "Resource **removed** from template or **stack deleted**", "Update **replaces** the resource (old one)"],
      ["Values", "Delete (default) · **Retain** · **Snapshot** · **RetainExceptOnCreate**", "Delete (default) · Retain · Snapshot"],
      ["Snapshot types", "EBS volume, RDS instance/cluster, Redshift, ElastiCache, Neptune, DocDB", "Same"],
      ["Notes", "RDS defaults to Snapshot · non-empty **S3 bucket → DELETE_FAILED**", "Set **both** on stateful resources (cfn-lint warns)"]
    ]},
    { h: "Import, roles, IAM", items: [
      "**IMPORT change set** adopts existing resources — **DeletionPolicy required**",
      "Move between stacks: **Retain → remove → import** (or stack refactoring)",
      "Retained resources are **orphaned** (unmanaged, still billed)",
      "**Service role** (`--role-arn`) + `iam:PassRole` = deploy without broad permissions",
      "Condition keys: `cloudformation:RoleArn`, `ResourceTypes`, `TemplateUrl`, `ChangeSetName`, `StackPolicyUrl`"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Will the DB be replaced?", "Change set"],
      ["Propose vs apply", "CreateChangeSet vs ExecuteChangeSet / pipeline approval"],
      ["Console change to managed resource", "Drift detection"],
      ["Continuous drift alerts", "Config drift rule"],
      ["All updates blocked after stack policy", "Add Allow Update:*"],
      ["Allow one protected replacement", "stack-policy-during-update-body"],
      ["Prevent stack deletion", "Termination protection + IAM"],
      ["DB lost on replacement", "UpdateReplacePolicy"],
      ["Backup on stack delete", "DeletionPolicy Snapshot"],
      ["Orphans after failed create", "RetainExceptOnCreate"],
      ["Bucket DELETE_FAILED", "Bucket not empty"],
      ["Adopt existing resource", "IMPORT change set"],
      ["Deploy without admin", "Service role + PassRole"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d2", topic: "Nested and Cross-Stack",
  sections: [
    { h: "Nested vs cross-stack", table: [
      ["", "Nested stacks", "Cross-stack references"],
      ["Relationship", "Parent owns children (`AWS::CloudFormation::Stack`)", "Independent peer stacks"],
      ["Lifecycle", "**One unit** through the root · **whole-tree rollback**", "**Separate** schedules and owners"],
      ["Values", "Parameters down · **`!GetAtt Child.Outputs.X`** up", "**`Export`** + **`Fn::ImportValue`**"],
      ["Reuse", "**Same template** in many parents", "**One shared instance** for many stacks"],
      ["Change shared value", "Update the root", "**Locked while imported**"],
      ["Limits", "Each child **500 resources** (scale past 500)", "200 outputs · unique export names"],
      ["Cross-Region / account", "No", "**No** → SSM, StackSets, custom resource"]
    ]},
    { h: "Nested stacks", items: [
      "`TemplateURL` must be **S3** → **`aws cloudformation package`** uploads children and rewrites URLs",
      "Parameters are **strings** (lists comma-delimited) · siblings: parent passes `GetAtt A.Outputs.X` to B (implicit order)",
      "Create / update / delete **through the root** · don't update children directly",
      "Errors: read the **child stack's events** (root says Embedded stack failed)",
      "`--include-nested-stacks` for change sets · termination protection on **root**",
      "**`CAPABILITY_AUTO_EXPAND`** for macros / `AWS::Serverless::Application` (+ CAPABILITY_IAM)",
      "UPDATE_ROLLBACK_FAILED → **continue-update-rollback on root** with `--resources-to-skip Child.Res`"
    ]},
    { h: "Cross-stack exports", items: [
      "Export names **unique per account + Region** → `${AWS::StackName}-Name`",
      "**Same account and Region only**",
      "**Export lock:** can't delete producer or change/remove an export while imported → change consumers first",
      "Producer first, else **No export named X found** (or wrong name / Region)",
      "`list-exports` · **`list-imports --export-name`**",
      "Lists: Join on export, `!Split` on import · consumers don't auto-update",
      "Layered stacks: deploy **bottom-up**, delete **top-down**"
    ]},
    { h: "SSM Parameter Store alternative", items: [
      "Producer `AWS::SSM::Parameter` · consumer `AWS::SSM::Parameter::Value<...>` or `{{resolve:ssm:...}}`",
      "**No lock**, works for non-CloudFormation tools, per-Region with StackSets, RAM sharing across accounts (advanced)",
      "Trade-off: **no protection**, consumers get new values only on next update",
      "CDK cross-stack references = generated exports → two-step deploy or SSM"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Shared VPC, many teams, own schedules", "Cross-stack exports (or SSM)"],
      ["Standard ALB in every app", "Nested stack (or module)"],
      ["750 resources, one unit", "Nested stacks"],
      ["Sibling needs other sibling's output", "Parent passes GetAtt Child.Outputs.X"],
      ["Local TemplateURL fails", "cloudformation package"],
      ["Value from another Region", "SSM Parameter Store / custom resource"],
      ["Export in use blocks update", "Change consumers first"],
      ["No export named X found", "Producer missing / wrong name / Region"],
      ["Who imports this export", "list-imports"],
      ["Embedded stack failed", "Child stack events"],
      ["Teams deploy parts independently", "Separate stacks, not nested"],
      ["Avoid export locks", "SSM Parameter Store"],
      ["Macros / SAM app nested", "CAPABILITY_AUTO_EXPAND"],
      ["Nested UPDATE_ROLLBACK_FAILED", "continue-update-rollback on root"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d2", topic: "Helper Scripts and Policies",
  sections: [
    { h: "Which tool does what", table: [
      ["Tool", "Purpose"],
      ["**AWS::CloudFormation::Init**", "Declarative config in metadata (configSets)"],
      ["**cfn-init**", "Applies the metadata at boot (from UserData)"],
      ["**cfn-signal**", "Sends SUCCESS / FAILURE (`-e $?`) to CreationPolicy or WaitCondition handle"],
      ["**CreationPolicy**", "Resource waits for Count signals within Timeout (max **12 h**)"],
      ["**WaitCondition + handle**", "Presigned S3 URL for **external** signals + **GetAtt .Data**"],
      ["**cfn-hup**", "Daemon: metadata change → hook reruns cfn-init (in place)"],
      ["**UpdatePolicy**", "How ASGs are replaced on update (rolling / replacing / scheduled)"]
    ]},
    { h: "cfn-init", items: [
      "Order: **packages → groups → users → sources → files → commands → services** (commands alphabetical)",
      "`services: sysvinit: httpd: files: [conf]` = **restart on file change**",
      "Private S3: **`AWS::CloudFormation::Authentication`** (S3, roleName = instance profile)",
      "`cfn-init -v --stack ${AWS::StackName} --resource <MetadataResource> --configsets default --region ${AWS::Region}`",
      "Logs: `/var/log/cfn-init.log`, `cfn-init-cmd.log`, `cloud-init-output.log`",
      "Preinstalled on Amazon Linux only — **install aws-cfn-bootstrap** elsewhere",
      "Needs route to **CloudFormation endpoint** (NAT or **VPC endpoint**) + S3",
      "**UserData runs at first boot only** — UserData change = stop/start, no rerun"
    ]},
    { h: "Signals and waiting", items: [
      "Signal **after a health check**: `curl -f ... ; cfn-signal -e $? --resource <ASG or instance>`",
      "ASG: cfn-init `--resource LaunchTemplate`, **cfn-signal `--resource ASG`**",
      "CreationPolicy: `ResourceSignal {Count, Timeout PT15M}` · `AutoScalingCreationPolicy MinSuccessfulInstancesPercent`",
      "On EC2 instance, ASG, WaitCondition · failure / timeout → rollback",
      "WaitCondition: Count, Timeout seconds (max 43200), `DependsOn`, HTTP PUT JSON, `-d` data → **`GetAtt .Data`**",
      "WaitCondition **doesn't re-wait on update** → new handle logical ID · AWS recommends CreationPolicy for EC2/ASG",
      "Debug: **disable rollback** / preserve resources, read logs"
    ]},
    { h: "cfn-hup", items: [
      "`/etc/cfn/cfn-hup.conf`: stack, region, **interval (default 15 min)**",
      "`/etc/cfn/hooks.d/*.conf`: **triggers=post.update**, path=Resources.X.Metadata.AWS::CloudFormation::Init, action=cfn-init",
      "Create via cfn-init `files`, keep running via `services`",
      "Without cfn-hup, metadata-only updates **don't change running instances**",
      "Alternatives: SSM State Manager / Run Command, golden AMIs + replacement"
    ]},
    { h: "ASG UpdatePolicy", table: [
      ["", "AutoScalingRollingUpdate", "AutoScalingReplacingUpdate"],
      ["How", "Batches in the **same ASG**", "**New ASG**, old deleted on success"],
      ["Key settings", "MaxBatchSize, MinInstancesInService, MinSuccessfulInstancesPercent, PauseTime, **WaitOnResourceSignals**, **SuspendProcesses**", "**WillReplace: true** + **CreationPolicy**"],
      ["Rollback", "Another rolling update (slow)", "**Delete new ASG** (fast, old untouched)"],
      ["Keyword", "Keep N in service, batches", "Immutable, fastest rollback"]
    ]},
    { h: "More UpdatePolicy facts", items: [
      "**No UpdatePolicy** = launch template change affects **new instances only**",
      "Both set → **WillReplace wins**",
      "**AutoScalingScheduledAction `IgnoreUnmodifiedGroupSizeProperties: true`** = don't reset scheduled sizes · avoid hard-coded DesiredCapacity",
      "SuspendProcesses: HealthCheck, ReplaceUnhealthy, AZRebalance, AlarmNotification, ScheduledActions",
      "Others: CodeDeployLambdaAliasUpdate, UseOnlineResharding (ElastiCache), EnableVersionUpgrade (OpenSearch)"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["CREATE_COMPLETE but app broken", "CreationPolicy + cfn-signal"],
      ["Metadata changed, instance not", "cfn-hup"],
      ["UserData changed, nothing happened", "First boot only"],
      ["Restart service on config change", "services → files"],
      ["Private S3 download", "CloudFormation::Authentication"],
      ["ASG signals time out", "Signal the ASG, not launch template"],
      ["Private subnet timeouts", "CloudFormation VPC endpoint + S3 / NAT"],
      ["cfn-init not found", "Install aws-cfn-bootstrap"],
      ["On-prem must confirm", "WaitCondition + handle"],
      ["Instance value to outputs", "cfn-signal -d + GetAtt .Data"],
      ["Old AMI after update", "Add UpdatePolicy"],
      ["Batches, keep 4 in service", "RollingUpdate"],
      ["Fastest rollback, immutable", "ReplacingUpdate + CreationPolicy"],
      ["ASG interferes during update", "SuspendProcesses"],
      ["Scheduled capacity reset", "IgnoreUnmodifiedGroupSizeProperties"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d2", topic: "Extending CloudFormation",
  sections: [
    { h: "Five ways to extend", table: [
      ["Feature", "What / when", "Keyword"],
      ["**Custom resource**", "Your code (Lambda / SNS) during Create / Update / Delete", "Unsupported action, lookup, empty bucket"],
      ["**Macro**", "Rewrites the template **before** processing", "Shorthand, boilerplate, Transform"],
      ["**Module**", "Reusable resource bundle `...::MODULE`, **same stack**", "Approved pattern, no extra stacks"],
      ["**Hook**", "Validates **before** provisioning · FAIL or WARN", "Proactive control"],
      ["**Registry**", "Resource types, modules, hooks · public / private", "Third-party, activate, private type"]
    ]},
    { h: "Custom resources", items: [
      "`Type: Custom::X` · **`ServiceToken`** = Lambda ARN or SNS topic · optional **`ServiceTimeout`** (max 3600 s)",
      "Event: **RequestType Create / Update / Delete**, **ResponseURL** (presigned S3), ResourceProperties (strings), OldResourceProperties, PhysicalResourceId",
      "Response: **PUT JSON** Status SUCCESS / FAILED, Reason, PhysicalResourceId, **Data** (→ `!GetAtt Res.Key`), NoEcho · max 4 KB",
      "**Always respond** (try / except / finally) — else stack waits **1 h default** (or ServiceTimeout)",
      "**Delete must succeed** · 'already gone' = SUCCESS · else DELETE_FAILED / stuck rollback",
      "**Stable PhysicalResourceId** — new ID = replacement = Delete of old",
      "Update runs only when **properties change** → bump `Version`",
      "VPC Lambda needs **NAT / S3 endpoint** for ResponseURL · `cfnresponse` only for **inline ZipFile** (else crhelper)",
      "Uses: empty bucket, cross-Region / account lookups, unsupported APIs, SaaS, seed DB"
    ]},
    { h: "Macros", items: [
      "AWS transforms: **Serverless** (SAM), **Include** (S3 snippet), **LanguageExtensions** (ForEach, Length, ToJsonString, FindInMap DefaultValue), SecretsManager (rotation), CodeDeployBlueGreen (ECS)",
      "Custom: Lambda + **`AWS::CloudFormation::Macro`** · returns requestId, status success, fragment",
      "Template-level `Transform: [...]` (in order) · snippet-level `Fn::Transform`",
      "**CAPABILITY_AUTO_EXPAND** · **same account + Region** (StackSets to distribute)",
      "Change sets show processed template · keep macros deterministic"
    ]},
    { h: "Modules", items: [
      "`Org::Service::Name::MODULE` · built with CloudFormation CLI (`cfn init`, `cfn submit`) · versioned in Registry",
      "Resources **merged into the same stack** · IDs prefixed: `LogsBucket` + `Bucket` = **`LogsBucketBucket`**",
      "**Don't help past 500 resources** (use nested stacks)",
      "Module = small standard block · nested stack = big component / separate stack"
    ]},
    { h: "Hooks and other controls", table: [
      ["Control", "When / what"],
      ["**Hooks** (Guard, Lambda, custom)", "**Proactive**: pre-create / update / delete in CloudFormation, every stack · FAIL or **WARN** · resources, stacks, change sets"],
      ["cfn-lint / cfn-guard in CI", "Shift-left in one pipeline"],
      ["SCPs / IAM", "Preventive at the API level, all tools"],
      ["AWS Config", "**Detective** after creation (+ remediation)"],
      ["Control Tower proactive controls", "Built on **Hooks**"]
    ]},
    { h: "Registry", items: [
      "Extensions: **resource types** (handlers CRUD + list, drift, import), **modules**, **hooks**",
      "**Public** (AWS / verified third party, e.g. MongoDB::Atlas, Datadog) → **activate** per account + Region, optional minor auto-update",
      "**Private** → register with `cfn submit` · set default version",
      "Execution role + logging config · roll out with **StackSets** (TypeActivation, ResourceVersion, HookVersion, ModuleVersion)",
      "Private resource type > custom resource for **long-lived reused** integrations (drift, import, schema)"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Empty bucket on delete", "Custom resource"],
      ["Stack hangs ~1 h on custom resource", "No response sent"],
      ["VPC custom resource hangs", "S3 endpoint / NAT"],
      ["Rerun custom resource", "Change a property"],
      ["Unexpected deletes after update", "Unstable PhysicalResourceId"],
      ["Loops", "LanguageExtensions ForEach"],
      ["Snippet from S3", "AWS::Include"],
      ["Macro / SAM capability error", "CAPABILITY_AUTO_EXPAND"],
      ["Macro not found in other account", "Deploy macro there (StackSets)"],
      ["Secure bucket pattern, no extra stack", "Module"],
      ["Module resource reference", "ModuleIdResourceId"],
      ["Block bad SGs in every stack", "Hook (FAIL)"],
      ["Roll out a Hook safely", "WARN first"],
      ["MongoDB / Datadog in templates", "Activate public extension"],
      ["Reused integration with drift", "Private resource type"],
      ["Cross-Region value at deploy", "Custom resource"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d2", topic: "Rollback and Troubleshooting",
  sections: [
    { h: "Key stack statuses", table: [
      ["Status", "Meaning", "Next step"],
      ["**ROLLBACK_COMPLETE**", "Create failed, rolled back (empty)", "**Delete and recreate** · pipeline **REPLACE_ON_FAILURE**"],
      ["**ROLLBACK_FAILED**", "Create failed and rollback failed", "**Delete stack** (retain stuck resources), clean up"],
      ["CREATE_FAILED / UPDATE_FAILED", "Failed with rollback disabled", "Retry · update · **rollback-stack**"],
      ["**UPDATE_ROLLBACK_COMPLETE**", "Update rolled back, last good state", "**Fix and update again**"],
      ["**UPDATE_ROLLBACK_FAILED**", "Update and rollback both failed", "**continue-update-rollback** (+ `--resources-to-skip`)"],
      ["**DELETE_FAILED**", "Some resources not deleted", "Fix and retry · **`--retain-resources`**"],
      ["UPDATE_IN_PROGRESS", "Update or monitoring period", "**cancel-update-stack** to roll back"],
      ["REVIEW_IN_PROGRESS", "CREATE change set not executed", "Execute or delete change set"]
    ]},
    { h: "Rollback control", items: [
      "Default: create fails → delete created resources · update fails → restore previous · **all or nothing** (incl. nested)",
      "`create-stack --on-failure` **ROLLBACK** (default) · **DELETE** (remove stack) · **DO_NOTHING** (keep)",
      "**`--disable-rollback`** = console **Preserve successfully provisioned resources** → then retry / update / `rollback-stack`",
      "**RetainExceptOnCreate** (DeletionPolicy or `--retain-except-on-create`) → no orphans after failed create",
      "`--timeout-in-minutes` (create only) · **cancel-update-stack** (UPDATE_IN_PROGRESS only)"
    ]},
    { h: "Rollback triggers", items: [
      "`--rollback-configuration`: **RollbackTriggers** (up to **5** CloudWatch / **composite** alarms) + **MonitoringTimeInMinutes 0–180**",
      "Alarm in ALARM during the operation or monitoring period → **whole operation rolls back**",
      "0 minutes = watch only during deployment · missing alarm = operation fails",
      "Saved on the stack and reused · works for create, update, change set execution",
      "Compare: CodeDeploy alarms (deployment), ECS circuit breaker, SAM DeploymentPreference, CodePipeline V2 rollback"
    ]},
    { h: "UPDATE_ROLLBACK_FAILED", items: [
      "Causes: **manual changes / deletes (drift)**, **service role permissions**, old state impossible (capacity, quota), **custom resource not responding**, nested stack failure, missing signals",
      "**Fix the cause → `continue-update-rollback`**",
      "**`--resources-to-skip LogicalId`** = marked rolled back, **not changed** → reconcile later",
      "Nested: run on **root** with **`Child.Resource`**",
      "Last resort: delete (retain resources) and recreate / import · AWS Support"
    ]},
    { h: "Troubleshooting", items: [
      "**First (oldest) *_FAILED event** = root cause · later = 'Resource creation cancelled'",
      "Nested: **child stack events** · console root cause / timeline view",
      "Logs: cfn-init / cloud-init, Lambda (custom resources, macros), ECS events, extension logs",
      "**CloudTrail** for AccessDenied / LimitExceeded / ValidationException + role",
      "Long IN_PROGRESS: **signals**, **custom resource response**, **stabilization** (ECS → circuit breaker)",
      "AlreadyExists = custom name · DELETE_FAILED = bucket not empty / SG in use / export imported",
      "Notify: **EventBridge Stack Status Change** → SNS (or NotificationARNs)"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["ROLLBACK_COMPLETE, can't update", "Delete and recreate"],
      ["Pipeline stuck on ROLLBACK_COMPLETE", "REPLACE_ON_FAILURE"],
      ["Stack stuck UPDATE_ROLLBACK_FAILED", "continue-update-rollback"],
      ["Resource deleted by hand blocks rollback", "--resources-to-skip, reconcile"],
      ["Nested resource skip", "Root + Child.Resource"],
      ["Roll back if alarm fires after deploy", "Rollback triggers + monitoring time"],
      ["More than 5 alarms", "Composite alarm"],
      ["Keep failed resources to debug", "--disable-rollback / DO_NOTHING"],
      ["Remove stack on failed create", "--on-failure DELETE"],
      ["Stop a bad update now", "cancel-update-stack"],
      ["Undo a preserved failed update", "rollback-stack"],
      ["Find root cause", "First FAILED event / CloudTrail"],
      ["DELETE_FAILED on SG", "Remove dependency or --retain-resources"],
      ["Orphans after failed create", "RetainExceptOnCreate"],
      ["Alert on stuck stacks", "EventBridge → SNS"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d2", topic: "StackSets",
  sections: [
    { h: "Core terms", items: [
      "**StackSet** = one template → many **accounts × Regions**, kept in the **admin account** (home Region)",
      "**Stack instance** = pointer to one stack in one account + Region · **Operation** = create / update / delete with per-instance results",
      "Uses: org **security baseline** (Config, CloudTrail, GuardDuty), **IAM roles** everywhere, Registry extensions / macros / Hooks, Control Tower CfCT"
    ]},
    { h: "Self-managed vs service-managed", table: [
      ["", "Self-managed", "Service-managed"],
      ["Roles", "**You** create Admin + Execution roles", "**Automatic** service-linked roles"],
      ["Organizations", "Not needed", "**Trusted access** required"],
      ["Targets", "Account IDs (**outside org OK**)", "**OUs** / root + account filters"],
      ["Management account", "YES", "**NEVER**"],
      ["Auto-deployment", "NO", "**YES**"],
      ["Delegated admin", "NO", "**YES** (`--call-as DELEGATED_ADMIN`)"],
      ["Least-privilege roles per StackSet", "**YES** (custom role names)", "NO"]
    ]},
    { h: "Self-managed roles", items: [
      "**AWSCloudFormationStackSetAdministrationRole** (admin account) trusts `cloudformation.amazonaws.com`",
      "**AWSCloudFormationStackSetExecutionRole** (every target) trusts the **admin account**",
      "Missing / wrong execution role → **INOPERABLE** or FAILED instance",
      "Custom: `--administration-role-arn`, `--execution-role-name` + restrict **iam:PassRole**"
    ]},
    { h: "Organizations integration", items: [
      "Enable **trusted access** in the CloudFormation console (management account)",
      "**Delegated admin** (up to 5): `register-delegated-administrator --service-principal member.org.stacksets.cloudformation.amazonaws.com` → keeps people out of the management account",
      "Delegated admin calls **must** use **`--call-as DELEGATED_ADMIN`** (default SELF → 'not found')",
      "**AccountFilterType**: NONE (all) · **INTERSECTION** (only listed) · **DIFFERENCE** (all except listed) · **UNION** (OU + listed)",
      "Targeting an OU includes **child OUs**"
    ]},
    { h: "Automatic deployment (service-managed only)", items: [
      "`--auto-deployment Enabled=true,RetainStacksOnAccountRemoval=false`",
      "Account **joins / moves into** a targeted OU → instances created in the StackSet's **existing Regions**",
      "Account **leaves** → instances deleted, or **kept** with **RetainStacksOnAccountRemoval=true**",
      "Move between two targeted OUs → nothing happens",
      "**New Region = manual** `create-stack-instances` · set on the StackSet, not per OU"
    ]},
    { h: "Rollout control", items: [
      "**RegionOrder** (test Region first) · **SEQUENTIAL** (default) / PARALLEL",
      "**MaxConcurrent** Count / % and **FailureTolerance** Count / % → **per Region**",
      "Tolerance exceeded → stops that Region, **no further Regions**",
      "**STRICT** (default): concurrency ≤ tolerance + 1 · **SOFT**: keeps concurrency (faster)",
      "**Managed execution** `Active=true` → no more OperationInProgressException (queues conflicts)"
    ]},
    { h: "Lifecycle and statuses", items: [
      "**Parameter overrides** per instance: `update-stack-instances --parameter-overrides`",
      "**delete-stack-set** only after **all instances deleted** · `--retain-stacks` keeps the stack",
      "**CURRENT** ok · **OUTDATED** = last op failed / not applied → fix + re-run · **INOPERABLE** → delete with `--retain-stacks`",
      "SKIPPED_SUSPENDED_ACCOUNT · opt-in Regions must be enabled",
      "**IAM is global** → fixed-name roles fail in the 2nd Region → deploy IAM in **one Region**",
      "`detect-stack-set-drift` · `import-stacks-to-stack-set` · `AWS::CloudFormation::StackSet` · CodePipeline **CloudFormationStackSet** / **CloudFormationStackInstances**"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Every new account in OU gets it automatically", "Service-managed + auto-deployment"],
      ["Accounts outside the organization", "Self-managed"],
      ["Management account missing the stack", "Self-managed / normal stack there"],
      ["Don't use the management account", "Delegated administrator"],
      ["Delegated admin gets 'not found'", "--call-as DELEGATED_ADMIN"],
      ["New account fails (self-managed)", "Create execution role"],
      ["Least privilege per StackSet", "Custom admin / execution roles"],
      ["Keep resources when account leaves OU", "RetainStacksOnAccountRemoval=true"],
      ["Add a new Region", "create-stack-instances"],
      ["All OU accounts except one", "AccountFilterType DIFFERENCE"],
      ["Stop at first failure, one Region at a time", "Tolerance 0 + SEQUENTIAL + RegionOrder"],
      ["Fast rollout, some failures OK", "SOFT_FAILURE_TOLERANCE"],
      ["OperationInProgressException", "Managed execution"],
      ["IAM 'already exists' in 2nd Region", "Deploy IAM in one Region"],
      ["Different CIDR for some accounts", "Parameter overrides"],
      ["delete-stack-set fails", "Delete instances first"],
      ["Stop managing, keep resources", "--retain-stacks"],
      ["Detect / prevent local changes", "StackSet drift + SCP"],
      ["Users launch approved products", "Service Catalog"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d2", topic: "AWS CDK",
  sections: [
    { h: "Core model", items: [
      "**CDK = code → CloudFormation**: TS, JS, Python, Java, C#, Go · v2 = **`aws-cdk-lib`** + `constructs`",
      "**App → Stage → Stack (= 1 CFN stack) → Construct `(scope, id, props)`**",
      "Output = cloud assembly in **`cdk.out`** · CloudFormation deploys (rollback, drift, limits still apply)"
    ]},
    { h: "Construct levels", table: [
      ["Level", "What", "Example"],
      ["**L1**", "`Cfn*`, one-to-one with CFN, no defaults", "`CfnBucket`"],
      ["**L2**", "Curated: secure defaults + helpers (`grant*`, `metric*`)", "`Bucket`, `bucket.grantRead(fn)`"],
      ["**L3**", "Patterns: several resources", "`ApplicationLoadBalancedFargateService`"]
    ]},
    { h: "Escape hatches and existing resources", items: [
      "Missing property → **`node.defaultChild`** as L1 → **`addPropertyOverride`** / `addOverride`",
      "`fromBucketName` / `fromLookup` / `fromRoleArn` = **reference only** (not managed)",
      "**`cdk import`** = manage an existing resource · **`cdk migrate`** = CFN template / stack → CDK app · `CfnInclude` = embed a template"
    ]},
    { h: "Core concepts", items: [
      "**Logical ID = construct path + hash** → rename / move = **replacement** → keep ids or **`overrideLogicalId`**",
      "**RemovalPolicy RETAIN** default for stateful · dev: **DESTROY + `autoDeleteObjects`** (custom resource)",
      "**Lookups need explicit `env`** (account + Region) · env-agnostic = no lookups, 2 AZs",
      "**Commit `cdk.context.json`** (cached lookups → deterministic synth)",
      "Tokens = deploy-time values · `valueForStringParameter` deploy time vs `valueFromLookup` synth time",
      "Secrets: **`SecretValue.secretsManager`** (dynamic reference), never hardcode",
      "Cross-stack: auto Exports · **deadly embrace** → `exportValue` two-step · **`crossRegionReferences: true`**",
      "**Aspects** / **cdk-nag** → fail synth on violations · **`Tags.of(scope).add`**"
    ]},
    { h: "Bootstrap", items: [
      "`cdk bootstrap aws://ACCT/REGION` → **CDKToolkit**: S3 bucket, ECR repo, deploy / publishing / lookup / **CFN execution** roles, version param",
      "**Every account + Region** · 'version not found' = not bootstrapped · re-bootstrap for newer versions",
      "Cross-account: **`--trust <pipeline acct>`**, `--trust-for-lookup`, **`--cloudformation-execution-policies`** (least privilege)",
      "`--qualifier` (side by side) · `--custom-permissions-boundary`"
    ]},
    { h: "CLI", table: [
      ["Command", "Use"],
      ["**`cdk synth`**", "Templates to `cdk.out`, no AWS changes · pipeline build step"],
      ["**`cdk diff`**", "Vs deployed: **replacements**, **IAM / SG** changes"],
      ["**`cdk deploy`**", "Assets + change set · `--require-approval broadening` (default) / never · `--no-execute` · `--no-rollback`"],
      ["`cdk destroy`", "Delete stacks (RETAIN resources stay)"],
      ["`cdk watch` / `--hotswap`", "**Dev only**, bypasses CFN (drift)"],
      ["`cdk import` / `cdk migrate`", "Adopt resource / convert CFN"],
      ["`cdk context` / `cdk doctor`", "Cache / diagnostics"]
    ]},
    { h: "Testing", items: [
      "**`assertions`**: `Template.fromStack`, `hasResourceProperties`, `resourceCountIs`, `Match`",
      "**Snapshot tests** catch unexpected template changes",
      "cdk-nag / cfn-lint / cfn-guard on `cdk.out` · `integ-tests` or pipeline post steps"
    ]},
    { h: "CDK Pipelines", items: [
      "**Source → Synth → UpdatePipeline (self-mutation) → Assets → Stages**",
      "**First `cdk deploy PipelineStack` manual**, then git push drives everything",
      "Source: **`CodePipelineSource.connection()`** (CodeConnections), codeCommit, s3, ecr",
      "Synth: `ShellStep` / **`CodeBuildStep`** (role, VPC, image) · `dockerEnabledForSynth`",
      "**`addStage()`** sequential · **`addWave()`** parallel (Regions)",
      "pre / post: **`ManualApprovalStep`**, ShellStep tests + **`envFromCfnOutputs`**",
      "Cross-account: targets **`--trust`** + **`crossAccountKeys: true`**"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Familiar language, loops, unit tests, CFN", "CDK"],
      ["Bootstrap version not found", "cdk bootstrap"],
      ["Pipeline can't deploy to other account", "--trust + crossAccountKeys"],
      ["See replacements / IAM before deploy", "cdk diff"],
      ["Renamed id, table replaced", "Keep id / overrideLogicalId"],
      ["L2 lacks property", "Escape hatch"],
      ["Whole Fargate + ALB in few lines", "L3 pattern"],
      ["fromLookup fails", "Set env"],
      ["Synth differs in pipeline", "Commit cdk.context.json"],
      ["Bucket left after destroy", "RETAIN default; DESTROY + autoDeleteObjects"],
      ["Enforce encryption everywhere at synth", "Aspect / cdk-nag"],
      ["Hardcoded password", "SecretValue.secretsManager"],
      ["CI deploy hangs on approval", "--require-approval never"],
      ["Fast Lambda iteration (dev)", "cdk watch / --hotswap"],
      ["Pipeline code changed", "Self-mutation"],
      ["Parallel Regions in pipeline", "addWave()"],
      ["Approval before prod", "ManualApprovalStep (pre)"],
      ["Tests after deploy", "post ShellStep + envFromCfnOutputs"],
      ["Export in use on removal", "exportValue, two-step"],
      ["CFN → CDK / adopt resource", "cdk migrate / cdk import"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d2", topic: "AWS SAM",
  sections: [
    { h: "Core model", items: [
      "**SAM = CloudFormation transform + CLI** for serverless · **`Transform: AWS::Serverless-2016-10-31`** (required)",
      "Deploys via **CloudFormation change sets** (rollback, drift, limits still apply) · mix SAM + plain CFN resources",
      "**Globals**: Function, Api, HttpApi, SimpleTable, LayerVersion, StateMachine · resource props override"
    ]},
    { h: "Resource types", table: [
      ["Type", "Creates"],
      ["**Serverless::Function**", "Lambda + **IAM role** + events (+ version / alias / CodeDeploy)"],
      ["**Serverless::Api** / **HttpApi**", "REST API / HTTP API (implicit `ServerlessRestApi` from `Events: Api`)"],
      ["**Serverless::SimpleTable**", "DynamoDB, **one key** (sort key / GSI → `AWS::DynamoDB::Table`)"],
      ["Serverless::LayerVersion", "Lambda layer"],
      ["Serverless::StateMachine", "Step Functions"],
      ["**Serverless::Application**", "Nested app from **SAR** (CAPABILITY_AUTO_EXPAND)"],
      ["**Serverless::Connector**", "Permissions between resources (Read / Write)"]
    ]},
    { h: "Function essentials", items: [
      "`CodeUri` (local → packaged to S3) / `InlineCode` · `PackageType: Image` → ECR",
      "**Policies**: **policy templates** (`S3ReadPolicy`, `DynamoDBCrudPolicy`, `SQSPollerPolicy`...), managed, inline · `Role` overrides",
      "Events: Api, HttpApi, **S3 (bucket in same template)**, SQS / Kinesis / DynamoDB (mappings), SNS, EventBridgeRule, Schedule",
      "**AutoPublishAlias** → version + alias · **DeploymentPreference** → CodeDeploy (needs AutoPublishAlias)"
    ]},
    { h: "DeploymentPreference", items: [
      "Type: **Canary10Percent5/10/15/30Minutes**, **Linear10PercentEvery1/2/3/10Minutes**, AllAtOnce",
      "**Alarms** → automatic rollback · **Hooks** PreTraffic / PostTraffic",
      "Hooks must call **`PutLifecycleEventHookExecutionStatus`** (else timeout fail)",
      "Generates CodeDeploy app + deployment group · **no separate CodeDeploy pipeline action needed**"
    ]},
    { h: "CLI", table: [
      ["Command", "Use"],
      ["**`sam build`**", "Deps + `.aws-sam/build` · **`--use-container`** for native deps"],
      ["**`sam package`**", "Upload to S3 / ECR → packaged template (= `aws cloudformation package`)"],
      ["**`sam deploy`**", "Change set · **`--guided`** → samconfig.toml · `--resolve-s3` · **CAPABILITY_IAM + CAPABILITY_AUTO_EXPAND** · **`--no-fail-on-empty-changeset`** · `--config-env`"],
      ["`sam validate --lint`", "cfn-lint"],
      ["**`sam sync --watch`**", "Code straight to Lambda, **bypasses CFN** → **dev only**"],
      ["`sam logs` / `sam traces`", "CloudWatch Logs / X-Ray"],
      ["`sam remote invoke`", "Invoke deployed function"],
      ["**`sam pipeline init --bootstrap`**", "2-stage CI/CD config + per-stage roles, bucket, ECR"],
      ["`sam publish` / `sam delete`", "SAR / remove stack"]
    ]},
    { h: "Local testing (needs Docker)", items: [
      "**`sam local invoke Fn -e event.json`** → one run · `--env-vars` · `-d <port>` debugger",
      "**`sam local start-api`** → local HTTP API **:3000** (code reload without restart)",
      "**`sam local start-lambda`** → Invoke endpoint **:3001** for **SDK / automated tests**",
      "**`sam local generate-event s3 put`** → sample payloads",
      "**No IAM enforcement** (your credentials) · **no AWS service emulation** (real AWS / DynamoDB Local) · no SQS polling",
      "Works on CDK: `sam local invoke -t cdk.out/Stack.template.json`"
    ]},
    { h: "Pipelines", items: [
      "CodeBuild: `sam build` + **`sam package --output-template-file packaged.yaml`**",
      "CFN action **CHANGE_SET_REPLACE → approval → CHANGE_SET_EXECUTE**, **CAPABILITY_AUTO_EXPAND**",
      "Or `sam deploy --no-confirm-changeset --no-fail-on-empty-changeset` · or `sam pipeline init --bootstrap`"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Serverless IaC + local testing", "SAM"],
      ["Serverless types not recognised", "Add Transform"],
      ["CAPABILITY_AUTO_EXPAND error", "Add it (+ CAPABILITY_IAM)"],
      ["Local CodeUri in pipeline", "sam package first"],
      ["invalid ELF header / native deps", "sam build --use-container"],
      ["Test API routes locally", "sam local start-api"],
      ["SDK tests against local functions", "sam local start-lambda"],
      ["Sample S3 event", "sam local generate-event"],
      ["Local OK, AccessDenied in AWS", "Fix function Policies"],
      ["sam local needs ...", "Docker"],
      ["Lambda canary + auto rollback", "AutoPublishAlias + DeploymentPreference + Alarms"],
      ["No gradual shift happens", "Missing AutoPublishAlias"],
      ["Hook deployment times out", "PutLifecycleEventHookExecutionStatus"],
      ["Repeated function settings", "Globals"],
      ["Least privilege, no IAM JSON", "Policy templates / Connectors"],
      ["S3 event on other-stack bucket", "Bucket must be in same template"],
      ["Per-env deploy settings", "samconfig.toml + --config-env"],
      ["CI fails on no changes", "--no-fail-on-empty-changeset"],
      ["Seconds-fast dev updates", "sam sync --watch (dev)"],
      ["Generate 2-stage pipeline", "sam pipeline init --bootstrap"],
      ["Sort key / GSI", "AWS::DynamoDB::Table"],
      ["Reusable app across teams", "SAR + Serverless::Application"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d2", topic: "Systems Manager",
  sections: [
    { h: "Managed node (all three)", items: [
      "**SSM Agent** (pre-installed AL2 / AL2023 / Windows / Ubuntu) · keep updated with `AWS-UpdateSSMAgent`",
      "**IAM**: instance profile **`AmazonSSMManagedInstanceCore`** or **DHMC** (all EC2, needs IMDSv2)",
      "**Network** outbound 443 to **ssm, ssmmessages, ec2messages** · no NAT → **VPC interface endpoints** (+ S3 gateway) · **no inbound ports**",
      "On-prem → **hybrid activation** (`mi-` IDs) · **Quick Setup** for org-wide setup",
      "Documents: **Command**, **Automation**, Session, Package, Policy, ChangeCalendar (JSON / YAML, versioned, shareable)"
    ]},
    { h: "Run Command vs State Manager", table: [
      ["", "Run Command", "State Manager"],
      ["When", "**Once, now**", "**Schedule / continuous**"],
      ["New instances", "No", "**Yes, auto (tags)**"],
      ["Key features", "**Concurrency + error threshold**, output **S3 / CW Logs** (console 2,500 chars), SNS, EventBridge target", "**Associations**, compliance, agent updates, CloudWatch agent, Inventory, Ansible / Chef"],
      ["Keyword", "Run a script now", "**Ensure always**"]
    ]},
    { h: "Patch Manager", items: [
      "**Baseline** = what: approval rules (classification, severity, **auto-approve after N days**), approved / rejected lists · **predefined can't be edited** · one default per OS",
      "**Patch group** = tag **`Patch Group`** / `PatchGroup` → **one baseline per OS**",
      "**Maintenance window** = when: schedule, duration, **cutoff**, targets, tasks (Run Command, Automation, Lambda, Step Functions), concurrency / errors",
      "**AWS-RunPatchBaseline**: **Scan** (report) / **Install** · **RebootIfNeeded** / **NoReboot**",
      "**A baseline alone patches nothing** · org-wide → **patch policies** (Quick Setup)",
      "Compliance → SSM Compliance, Security Hub, Config `ec2-managedinstance-patch-compliance-status-check`"
    ]},
    { h: "Inventory and Session Manager", items: [
      "**Inventory**: `AWS-GatherSoftwareInventory` association · apps, files, services, registry, custom",
      "Cross-account / Region → **Resource Data Sync → S3 → Athena / QuickSight**",
      "**Session Manager**: no SSH keys / bastion / inbound ports / public IP",
      "Audit: **CloudTrail StartSession** + **session logging S3 / CW Logs (KMS)** · not inside SSH tunnels",
      "IAM **`ssm:StartSession` + tag conditions** · Run As · idle timeout",
      "**Port forwarding** · **ToRemoteHost** → private RDS · needs `ssmmessages`"
    ]},
    { h: "Parameter Store", table: [
      ["", "Standard", "Advanced"],
      ["Cost / count", "**Free**, 10,000", "Paid, 100,000"],
      ["Size", "**4 KB**", "**8 KB**"],
      ["Policies", "No", "**Expiration, ExpirationNotification, NoChangeNotification**"],
      ["RAM sharing", "No", "Yes"],
      ["Downgrade", "-", "**Not possible**"]
    ]},
    { h: "Parameter Store details", items: [
      "Types: String, StringList, **SecureString (KMS)** → needs **`kms:Decrypt`** + `--with-decryption`",
      "Hierarchy **`GetParametersByPath --recursive`** · versions + **labels** · IAM by path",
      "**Public params**: `/aws/service/ami-amazon-linux-latest/...` (latest AMI)",
      "CFN: **`AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>`**, `{{resolve:ssm:...}}`, `{{resolve:ssm-secure:...}}`",
      "ECS `secrets valueFrom` (execution role) · CodeBuild `parameter-store` · Lambda extension (cache) · higher throughput",
      "**Rotation / 64 KB / replication → Secrets Manager**"
    ]},
    { h: "Automation, Distributor, Fleet Manager", items: [
      "**Runbooks**: `executeAwsApi`, `runCommand`, `executeScript`, **`approve`**, `branch`, `createImage`, `waitFor...`",
      "**AutomationAssumeRole** · rate control · multi-account / Region",
      "Triggers: **Config remediation**, EventBridge, State Manager, maintenance window, Change Manager, OpsCenter",
      "Runbooks: `AWS-UpdateLinuxAmi` (golden AMI), **`AWSSupport-ResetAccess`**, EC2Rescue, `AWSConfigRemediation-*`",
      "**Distributor**: zip per platform + manifest → Package doc · `AWS-ConfigureAWSPackage` · **+ State Manager** for new instances",
      "**Fleet Manager**: files, logs, performance, registry, users, processes, **browser RDP (no 3389)**",
      "**Change Calendar** = freeze periods · OpsCenter = OpsItems · Change Manager = approvals"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Instance not managed", "Agent + instance profile + endpoints"],
      ["Private subnet, no NAT", "ssm / ssmmessages / ec2messages endpoints"],
      ["SSM for all EC2, no instance profiles", "DHMC"],
      ["On-prem servers", "Hybrid activation"],
      ["Script on many now, 10% at a time", "Run Command + rate control"],
      ["Output truncated", "S3 / CloudWatch Logs"],
      ["Always installed incl. new instances", "State Manager"],
      ["Different patch delays prod / dev", "Custom baselines + Patch Group + windows"],
      ["Nothing patched after baseline", "Run AWS-RunPatchBaseline Install"],
      ["Report missing patches only", "Operation Scan"],
      ["Patch across org", "Patch policies"],
      ["Software across accounts + SQL", "Inventory + Resource Data Sync + Athena"],
      ["No bastion, audit commands", "Session Manager + logging + KMS"],
      ["Sessions only on dev instances", "StartSession + tag condition"],
      ["Laptop → private RDS", "Port forwarding to remote host"],
      ["SecureString AccessDenied", "kms:Decrypt"],
      ["6 KB value / expiry notice", "Advanced tier + policies"],
      ["Latest AMI in CFN", "SSM public parameter type"],
      ["Automatic rotation", "Secrets Manager"],
      ["Auto-fix Config non-compliance", "SSM Automation remediation"],
      ["Approval inside runbook", "aws:approve"],
      ["Custom agent everywhere + versions", "Distributor + State Manager"],
      ["RDP without 3389", "Fleet Manager / port forwarding"],
      ["Block changes during freeze", "Change Calendar"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d2", topic: "AppConfig",
  sections: [
    { h: "Core model", items: [
      "**AppConfig** (part of Systems Manager) = safe **dynamic config + feature flags without redeploying code**",
      "**Application → Environment (alarm monitors) → Configuration profile (source, type, validators) → Deployment (version + environment + strategy)**",
      "Types: **Feature flags** (**hosted store only**, constraints, multi-variant) · **Freeform** (JSON / YAML / text)",
      "Sources: **hosted store**, S3, Parameter Store, SSM document, Secrets Manager, CodePipeline · **retrieval role** · KMS"
    ]},
    { h: "Feature flags", items: [
      "`enabled` + **attributes with constraints** (min / max, regex, enum) → auto-validated",
      "**Multi-variant flags**: rules on **context** (userId, tier) evaluated by the **agent** → per-segment variants",
      "Uses: **feature toggles**, **kill switches**, log level / rate limits, allow lists · short-term flags",
      "**Evidently retiring** → use AppConfig flags"
    ]},
    { h: "Validators vs monitors", table: [
      ["", "Validators", "Monitors"],
      ["When", "**Before deployment starts**", "**During deployment + bake**"],
      ["Checks", "Content", "Effect on app"],
      ["Types", "**JSON Schema** (structure) · **Lambda** (business logic, needs **invoke permission**)", "**CloudWatch alarms** (needs **IAM role** `DescribeAlarms`)"],
      ["Failure", "**Deployment never starts**", "**Automatic rollback**"]
    ]},
    { h: "Deployment strategies", table: [
      ["Strategy", "Behaviour"],
      ["**AllAtOnce**", "100% now, ~10 min bake"],
      ["**Linear50PercentEvery30Seconds**", "~1 min · **testing**"],
      ["**Canary10Percent20Minutes**", "Exponential from 10%, 20 min, ~10 min bake · **prod recommended**"],
      ["**Linear20PercentEvery6Minutes**", "30 min, ~30 min bake · prod careful"],
      ["Custom", "Duration, **Linear / Exponential**, growth %, **final bake time**"]
    ]},
    { h: "Deployment behaviour", items: [
      "% = share of **polling targets** (clients), not users",
      "**One active deployment per environment**",
      "Alarm in ALARM during rollout **or bake** → **rollback** to previous version",
      "**`StopDeployment`** = stop + roll back · after completion → deploy previous version"
    ]},
    { h: "Retrieval", items: [
      "**`StartConfigurationSession`** → token → **`GetLatestConfiguration`** (use next token) · **empty body = no change**",
      "`GetConfiguration` **deprecated** · billed per request → cache",
      "**AppConfig Agent**: **Lambda extension** `http://localhost:2772/applications/{app}/environments/{env}/configurations/{profile}` · **ECS / EKS sidecar** · EC2 agent",
      "Agent = cache, background polling, multi-variant evaluation"
    ]},
    { h: "Extensions and integration", items: [
      "Action points: **PRE_START_DEPLOYMENT**, ON_DEPLOYMENT_START / STEP / BAKING, **ON_DEPLOYMENT_COMPLETE**, **ON_DEPLOYMENT_ROLLED_BACK**",
      "AWS-authored → **EventBridge / SNS / SQS** notifications · custom Lambda (freeze / ticket checks)",
      "**CodePipeline AppConfig deploy action** · CFN `AWS::AppConfig::*` · CloudTrail audit",
      "vs **Parameter Store** (no validation / rollout / rollback) · env vars need redeploy · rotation → Secrets Manager"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Toggle feature without redeploy", "AppConfig feature flag"],
      ["Feature flag source", "Hosted store"],
      ["Enum / range / required fields", "JSON Schema validator"],
      ["Business rules / lookups", "Lambda validator"],
      ["Validator invoke error", "Lambda resource policy for appconfig"],
      ["Auto rollback on errors", "Alarm monitors + bake time"],
      ["Alarm fired, no rollback", "Monitor IAM role (DescribeAlarms)"],
      ["Prod canary", "Canary10Percent20Minutes"],
      ["Testing ~1 min", "Linear50PercentEvery30Seconds"],
      ["Stop bad deployment now", "StopDeployment"],
      ["Second deployment rejected", "One per environment"],
      ["Lambda reads every invoke", "Lambda extension (localhost:2772)"],
      ["EKS / ECS retrieval", "Agent sidecar"],
      ["Custom client APIs", "StartConfigurationSession + GetLatestConfiguration"],
      ["Empty response", "No change, use cache"],
      ["Beta users get variant B", "Multi-variant flags + context"],
      ["Notify on rollback", "Extension → SNS / EventBridge"],
      ["Block during freeze", "PRE_START_DEPLOYMENT extension"],
      ["Keep Parameter Store, add safety", "AppConfig profile with PS source"],
      ["Replace Evidently", "AppConfig feature flags"]
    ]}
  ]
});

// Extra exam scenarios added after the question gap review.
[
  ["CodeCommit", [
    "Only from the corporate network or VPC → IAM / **SCP Deny** unless `aws:SourceIp` or `aws:SourceVpce` matches.",
    "Large binaries (models, media) → **S3** (or Git LFS), not the Git repository (the console and API have a limit of about 6 MB per file)."
  ]],
  ["CodeBuild", [
    "Partner allow-lists a **fixed outbound IP** → build in a VPC private subnet → **NAT gateway with an Elastic IP**.",
    "Slow PROVISIONING, need machines ready → **reserved capacity fleet**.",
    "Artifacts with a customer-managed key → the project's **encryption key** (+ key policy + role)."
  ]],
  ["CodeArtifact", [
    "Whole Organization, including future accounts → domain and repository policy with **`aws:PrincipalOrgID`**."
  ]],
  ["ECR", [
    "Only signed images may run → **AWS Signer + Notation** + an admission controller (Kyverno / Ratify) in EKS."
  ]],
  ["CodePipeline", [
    "Start on an image push (no code repository) → **ECR source action** (outputs `imageDetail.json`).",
    "One template → many accounts, OUs and Regions (+ new accounts) → **StackSets actions**, service-managed, automatic deployment.",
    "Different parameters, tags or stack policy per environment → **TemplateConfiguration** file per stage.",
    "Automated approval check → Lambda: `GetPipelineState` → **`PutApprovalResult`**.",
    "Cross-account CodeCommit source → **EventBridge rule in the source account → Tools event bus**.",
    "Pipeline updates its own definition → **CDK Pipelines self-mutation**.",
    "Stop immediately → **Stop and abandon** · let running actions finish → **Stop and wait**."
  ]]
].forEach(([topic, items]) => {
  const c = window.CHEATSHEETS.find(x => x.topic === topic);
  if (c) c.sections.push({ h: "More exam scenarios", items });
});
