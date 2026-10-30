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
