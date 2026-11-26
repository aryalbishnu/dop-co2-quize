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

window.CHEATSHEETS.push({
  domain: "d2", topic: "AWS Organizations",
  sections: [
    { h: "Structure", items: [
      "**Management account**: pays, creates / invites accounts, registers delegated admins · **SCPs / RCPs don't apply** → **no workloads**",
      "**Root → OUs** (nested up to **5**) → accounts (one OU each) · policies **inherited** · moving an account applies new policies immediately",
      "**All features** needed for policies · billing-only → all features needs **approval from every invited member**",
      "**Created** accounts get **OrganizationAccountAccessRole** · **invited** ones don't (create manually)",
      "**Up to 5 SCPs per target**, 5,120 chars · **centralized root access** (`sts:AssumeRoot`)"
    ]},
    { h: "Policy types", table: [
      ["Policy", "Controls"],
      ["**SCP**", "Max permissions for **member principals** (incl. root)"],
      ["**RCP**", "Max permissions on **resources** for **any caller** (data perimeter)"],
      ["**Declarative**", "EC2 baseline (public AMI / snapshot, IMDSv2, VPC BPA) - survives new APIs"],
      ["**Tag policy**", "Standardise / enforce tag values - **not mandatory**"],
      ["**Backup**", "AWS Backup plans org-wide"],
      ["AI opt-out / chat apps", "AI content use / Q in chat apps"]
    ]},
    { h: "SCP rules", items: [
      "**Never grant** · apply to member IAM users / roles **incl. root** · **not** management account, **not** service-linked roles, **not** external principals",
      "**Explicit deny anywhere wins** · Allow needed at **every level** (root, OUs, account)",
      "Default **FullAWSAccess** · **deny-list** (keep FullAWSAccess + Denies) vs **allow-list** (remove FullAWSAccess, Allow at every level)",
      "Error says 'explicit deny in a service control policy' · test in **Policy Staging OU** · attach to OUs"
    ]},
    { h: "SCP patterns", items: [
      "Deny **LeaveOrganization**, CloudTrail Stop / Delete, GuardDuty / Config / Security Hub disable",
      "**Region**: Deny + **NotAction (iam, sts, organizations, route53, cloudfront, support...)** + `aws:RequestedRegion` + **`ArnNotLike aws:PrincipalARN`** admin exception",
      "Protect `platform-*` roles except pipeline role",
      "Require tags (**`aws:RequestTag` Null**), encryption, **IMDSv2** (`ec2:MetadataHttpTokens`), deny IAM users / access keys, instance types",
      "Suspended OU = deny `*`"
    ]},
    { h: "Org condition keys", items: [
      "**`aws:PrincipalOrgID`** in resource policies → whole org, no account IDs, new accounts included",
      "`aws:PrincipalOrgPaths` (OU path) · `aws:ResourceOrgID` (resource in org) · `aws:SourceOrgID` (service principals)",
      "**SCP = what my principals can do · RCP = who can touch my resources**"
    ]},
    { h: "Consolidated billing", items: [
      "One bill · **combined usage → volume discounts** · **RI / Savings Plans sharing** (turn off per account)",
      "**One free tier per org**",
      "Cost Explorer, **Budgets**, **CUR / Data Exports**, **Cost Categories**, **cost allocation tags (activate in management account)**, Anomaly Detection"
    ]},
    { h: "Trusted access and delegated admin", items: [
      "Trusted access = service works org-wide: **org CloudTrail** (members can't change), **Config aggregator / org rules / conformance packs**, GuardDuty / Security Hub / Macie / Inspector **auto-enable**, Firewall Manager, Identity Center, Access Analyzer, **StackSets**, Control Tower, Backup, **RAM (no invites)**, Service Catalog, SSM, Health",
      "**Delegated admin** = member account administers a service (Security Tooling, Infrastructure) → **least use of management account**",
      "Limits vary (GuardDuty / Security Hub 1, StackSets 5) · **Organizations delegation policy** for SCP management",
      "Org events → **CloudTrail + EventBridge in us-east-1**"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Prevent action in all member accounts", "SCP deny"],
      ["Management account not blocked", "SCPs don't apply there"],
      ["Allowed in IAM, explicit deny SCP", "SCP somewhere in path"],
      ["Child OU FullAWSAccess still limited", "Parent allow-list limits"],
      ["Region lock breaks IAM / CloudFront", "NotAction global services"],
      ["Billing-only org wants SCPs", "All features + member approval"],
      ["Invited account, role switch fails", "Create OrganizationAccountAccessRole"],
      ["Mandatory tag + allowed values", "SCP aws:RequestTag + tag policy"],
      ["All org accounts read bucket", "aws:PrincipalOrgID"],
      ["Block outside access despite bad policies", "RCP"],
      ["EC2 baseline vs new APIs", "Declarative policy"],
      ["Share discounts, one bill", "Consolidated billing + central SP / RI"],
      ["Keep RIs in one account", "Turn off RI / SP sharing"],
      ["Chargeback by team", "Cost allocation tags (mgmt) + Cost Categories"],
      ["Org security without mgmt account", "Delegated admin + auto-enable"],
      ["Manage SCPs from member account", "Organizations delegation policy"],
      ["Trail members can't stop", "Organization trail"],
      ["React to new account", "EventBridge us-east-1 CreateAccountResult"],
      ["Share subnets with OU, no invites", "RAM + Organizations sharing"],
      ["Remove member root credentials", "Centralized root access"],
      ["Protect baseline roles", "SCP deny + ArnNotLike pipeline role"],
      ["Test SCPs / store logs", "Policy Staging OU / Log Archive"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d2", topic: "Control Tower",
  sections: [
    { h: "Landing zone", items: [
      "**Orchestrates** Organizations, Identity Center, CloudTrail, Config, Service Catalog, StackSets, S3, Security Hub · **CT itself is free**",
      "**Home Region fixed** · governed Regions (add later) · **Region deny control** for ungoverned Regions",
      "**Security OU**: **Log Archive** (central CloudTrail + Config logs) + **Audit** (security roles, SNS, aggregator, delegated admin) · optional **Sandbox OU**",
      "Org trail · Config in all governed accounts / Regions · Identity Center (or self-managed) · KMS optional",
      "**Update landing zone → re-register OUs / update accounts** · APIs + `AWS::ControlTower::LandingZone`",
      "**Don't edit** `AWSControlTower*` stacks, `aws-guardrails-*` SCPs, `AWSControlTowerExecution`"
    ]},
    { h: "Controls", table: [
      ["Behaviour", "Implementation", "When"],
      ["**Preventive**", "**SCP** (RCP)", "Blocks API call"],
      ["**Detective**", "**Config rule** (Security Hub)", "Reports after (**no auto-fix**)"],
      ["**Proactive**", "**CloudFormation Hooks**", "Before CFN provisions"]
    ]},
    { h: "Control facts", items: [
      "Guidance: **Mandatory** (always on, **can't disable**) · Strongly recommended · Elective",
      "Enabled **per registered OU** · `EnableControl` API · `AWS::ControlTower::EnabledControl`",
      "Detective results on dashboard + Audit · auto-fix = **Config remediation / SSM Automation / Lambda**",
      "Data residency controls · Security Hub **service-managed standard: AWS Control Tower**"
    ]},
    { h: "Governing OUs and accounts", items: [
      "**Register OU** = baseline for all accounts in an existing OU",
      "**Enroll account** needs **`AWSControlTowerExecution`** role · fails on existing **Config recorder** / blocking SCPs",
      "**Drift**: account moved / removed, SCP edited, OU deleted, trusted access off → **update / re-enroll / re-register / repair**",
      "Make changes **through Control Tower**, not Organizations directly"
    ]},
    { h: "Account vending and customization", table: [
      ["Option", "Use"],
      ["**Account Factory**", "Service Catalog product · **`ProvisionProduct`** · self-service · **VPC network config**"],
      ["**AFC blueprints**", "Service Catalog products (CFN / Terraform) in hub account · **simplest, console**"],
      ["**AFT**", "**Terraform GitOps** · dedicated AFT account · 4 repos · **`aft-invoke-customizations`**"],
      ["**CfCT**", "**manifest.yaml** · CloudFormation via **StackSets** + **SCPs / RCPs** · CodePipeline · runs on **CreateManagedAccount**"],
      ["**LZA**", "Large regulated, config-driven environments"],
      ["**Lifecycle events**", "**CreateManagedAccount** → EventBridge (mgmt, home Region) → Lambda / SSM"]
    ]},
    { h: "AFT repos", items: [
      "**aft-account-request** (account definitions)",
      "**aft-global-customizations** (every account)",
      "**aft-account-customizations** (per-account folders)",
      "**aft-account-provisioning-customizations** (Step Functions before customizations, ITSM / CMDB)",
      "Options: delete default VPCs, CloudTrail data events, Enterprise Support"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Quick best-practice multi-account", "Control Tower"],
      ["Where are logs / security team?", "Log Archive / Audit"],
      ["Change home Region", "Not possible"],
      ["Block unused Regions", "Region deny control"],
      ["Block / report / before CFN", "Preventive / detective / proactive"],
      ["Proactive implementation", "CloudFormation Hooks"],
      ["Can't disable control", "Mandatory"],
      ["Detective didn't fix", "Add Config remediation"],
      ["Existing OU under CT", "Register OU"],
      ["Enroll fails", "AWSControlTowerExecution / Config recorder"],
      ["After landing zone update", "Re-register OUs"],
      ["Account moved in Organizations", "Drift → update / re-enroll"],
      ["Edited aws-guardrails SCP", "Re-register / repair"],
      ["Self-service accounts + API", "Account Factory ProvisionProduct"],
      ["Standard VPC in new accounts", "Account Factory network config"],
      ["Terraform GitOps vending", "AFT"],
      ["Re-run AFT customizations", "aft-invoke-customizations"],
      ["CFN + SCPs auto for new accounts", "CfCT"],
      ["Simplest console customization", "AFC blueprints"],
      ["Automation after account created", "CreateManagedAccount event"],
      ["GuardDuty not enabled", "Audit as delegated admin + auto-enable"],
      ["Controls as code", "EnableControl / AWS::ControlTower::EnabledControl"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d2", topic: "Service Catalog",
  sections: [
    { h: "Core model", items: [
      "**Admins curate** IaC as **products** in **portfolios** · **end users self-service launch** · SC provisions with a **launch role**",
      "**Product** = CloudFormation / Terraform / External with **versions** (active / inactive, DEFAULT / DEPRECATED)",
      "**Portfolio** = products + **access (IAM users / groups / roles / principal names)** + constraints + TagOptions + sharing · product can be in many portfolios",
      "**Provisioned product** = CFN stack `SC-<acct>-pp-...` · update / terminate",
      "IAM: `AWSServiceCatalogAdminFullAccess` · **`AWSServiceCatalogEndUserFullAccess`** (no service permissions needed)"
    ]},
    { h: "Constraints (per product per portfolio)", table: [
      ["Constraint", "Use"],
      ["**Launch**", "**Role SC assumes** → users need only SC permissions · trust **`servicecatalog.amazonaws.com`** · **one per product per portfolio** · **`LocalRoleName`** for shared"],
      ["**Template**", "**Rules** restrict parameter values (instance types)"],
      ["**Notification**", "**SNS** stack events"],
      ["**StackSet**", "Many accounts / Regions"],
      ["**Tag update**", "Allow / deny tag edits after launch"]
    ]},
    { h: "Launch role checklist", items: [
      "Trust **`servicecatalog.amazonaws.com`**",
      "Permissions: **CloudFormation + every service in template** + **`s3:GetObject`** on template + **`iam:PassRole`** if needed",
      "Admin creating constraint needs **`iam:PassRole`**",
      "No launch constraint → **user's own credentials** used"
    ]},
    { h: "TagOptions", items: [
      "Library of key / values on **portfolios** or **products**",
      "Multiple values → **user picks from list** (no free text) · **single value → auto-applied**",
      "Tags propagate to resources · deactivate · share with portfolio",
      "AutoTags `aws:servicecatalog:*` (portfolio, product, provisioned product, principal, version)",
      "**SC launches only** → mandatory everywhere = **SCP `aws:RequestTag`** · standardise org-wide = tag policy"
    ]},
    { h: "Sharing", items: [
      "**Account-to-account** → recipient **imports**; **can't edit products**, can add **principals + constraints**; hub updates propagate",
      "**Organizations** → org / OU / account, **no import**, trusted access, **delegated admin**",
      "**Share TagOptions** · **share principals** (principal names / wildcards, SSO roles)",
      "**Hub and spoke** = Organizations share + shared principals + **LocalRoleName** launch role (deployed by StackSets)"
    ]},
    { h: "Operations and integration", items: [
      "**Service actions** = SSM documents on provisioned products (restart, AMI) without EC2 permissions",
      "**Repo sync (CodeConnections)** → version per commit · **CodePipeline SC deploy action** · CDK **ProductStack**",
      "**Plans** = change set preview · **`ImportAsProvisionedProduct`** · owner change · Budgets",
      "Terraform: reference engine / HCP Terraform + launch role · `CopyProduct` · AppRegistry",
      "**Account Factory + AFC blueprints are SC products** · ServiceNow / Jira connectors",
      "**SC = self-service pull** · **StackSets / CfCT = push to all accounts**"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Self-service, no service permissions", "Product + portfolio + launch constraint"],
      ["AccessDenied with launch constraint", "Launch role permissions"],
      ["SC can't assume role", "Trust servicecatalog.amazonaws.com"],
      ["Admin can't add launch constraint", "iam:PassRole"],
      ["One constraint for all spokes", "LocalRoleName"],
      ["Only t3.micro / t3.small", "Template constraint"],
      ["Email on launch / failure", "Notification constraint"],
      ["One launch, many accounts", "StackSet constraint"],
      ["Approved tag values, no free text", "TagOptions"],
      ["Users change tags after launch", "Tag update constraint"],
      ["Mandatory tag on every path", "SCP aws:RequestTag"],
      ["Share to OU, no import, not mgmt", "Organizations share + delegated admin"],
      ["Spoke edits product", "Not allowed"],
      ["SSO devs see portfolio automatically", "Share principals"],
      ["Restart / AMI without EC2", "Service actions"],
      ["Version per Git commit", "Repo sync / CodePipeline SC action"],
      ["Block old version launches", "Deprecated / inactive"],
      ["Preview update", "Provisioned product plan"],
      ["Existing stacks into SC", "ImportAsProvisionedProduct"],
      ["Baseline into every account", "StackSets / CfCT"],
      ["Account Factory", "SC product"],
      ["Products in CDK", "ProductStack"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d2", topic: "AWS Config",
  sections: [
    { h: "Setup and recording", items: [
      "**Recorder** = configuration items (CIs) for all / selected types · **regional** → enable in every Region",
      "**Global resources (IAM) in one Region only** · **daily recording / exclusions** to cut cost",
      "**Delivery channel**: S3 (history ~6h, snapshots) + SNS (noisy) · role `AWSServiceRoleForConfig` · retention default 7 years",
      "**Timeline** = what it looked like · CI links to **CloudTrail** event (who) · **advanced queries** (SQL SELECT)",
      "Cost = per CI recorded + per rule evaluation"
    ]},
    { h: "Rules", table: [
      ["Type", "Use"],
      ["**Managed**", "First choice · parameters (`restricted-ssh`, `required-tags`, `encrypted-volumes`, `approved-amis-by-id`, `cloudtrail-enabled`, `access-keys-rotated`)"],
      ["**Custom Lambda**", "Complex logic / external data · `PutEvaluations` · **invoke permission for config.amazonaws.com**"],
      ["**Custom Guard**", "Simple attribute checks, **no Lambda**"],
      ["Service-linked", "From Security Hub / Control Tower · can't edit"]
    ]},
    { h: "Triggers and modes", items: [
      "**Change-triggered** (scope: type / tag / ID) · **periodic** 1 / 3 / 6 / 12 / 24 h (key age, CloudTrail on)",
      "**Detective** (default, after change) · **proactive** (`StartResourceEvaluation`, Hooks, CT proactive)",
      "**Rules don't prevent** → SCP / proactive controls",
      "Results: COMPLIANT / NON_COMPLIANT / NOT_APPLICABLE / INSUFFICIENT_DATA · `StartConfigRulesEvaluation` re-run"
    ]},
    { h: "Remediation (SSM Automation)", items: [
      "Runbook per rule · **manual** or **automatic** · param **`RESOURCE_ID`**",
      "**`AutomationAssumeRole`** (trust ssm.amazonaws.com + permissions) = #1 failure cause",
      "Max attempts + retry seconds · rate control · **remediation exceptions**",
      "`AWSConfigRemediation-EnableS3BucketEncryption`, **`AWS-DisablePublicAccessForSecurityGroup`**, `-RemoveUnrestrictedSourceIngressRules`, `AWS-PublishSNSNotification`",
      "Custom / filtered → **EventBridge `Config Rules Compliance Change` (NON_COMPLIANT)** → Lambda / SSM / SNS"
    ]},
    { h: "Conformance packs and org deployment", items: [
      "**YAML bundle of rules + remediation**, managed as one unit · samples PCI, HIPAA, **CIS**, NIST · compliance score",
      "**Organization conformance pack** / **organization Config rule** → all accounts, **members can't change**",
      "From management account or **Config delegated admin** (`config.amazonaws.com`, `config-multiaccountsetup.amazonaws.com`)",
      "**Needs recorder running** in targets"
    ]},
    { h: "Aggregators", items: [
      "**Read-only** multi-account / Region view · **doesn't deploy or remediate**",
      "Individual accounts → **authorization per account** · **Organization** source → no authorization, **new accounts automatic**",
      "Advanced queries across org · usually **Audit** account (Control Tower)",
      "No data = Config not enabled / authorization missing"
    ]},
    { h: "Integrations", items: [
      "**Security Hub controls = Config rules** (Config required) · **CT detective controls = Config rules** · Firewall Manager needs Config",
      "SSM: runbooks, Inventory CI, patch compliance rule · CFN drift rule, Hooks, `AWS::Config::*`",
      "Audit Manager evidence · EventBridge events · CloudTrail links"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["What it looked like / who changed", "Config timeline / CloudTrail"],
      ["No results in other Regions", "Recorder per Region"],
      ["Duplicate IAM CIs", "Global resources one Region"],
      ["Config too expensive", "Daily recording / exclusions"],
      ["Open SSH detection", "Managed restricted-ssh"],
      ["Check against external API", "Custom Lambda rule"],
      ["Simple check, no Lambda", "Guard rule"],
      ["Lambda rule never invoked", "Invoke permission"],
      ["Daily key-age check", "Periodic trigger"],
      ["Auto-fix buckets", "Automatic remediation + SSM"],
      ["Remediation AccessDenied", "AutomationAssumeRole"],
      ["Skip one bucket", "Remediation exception"],
      ["Email only on NON_COMPLIANT", "EventBridge filter"],
      ["PCI rules all accounts, protected", "Org conformance pack"],
      ["Pack fails in accounts", "Recorder not enabled"],
      ["Central view incl. new accounts", "Org aggregator"],
      ["Aggregator enforce / fix?", "No, read-only"],
      ["Aggregator missing account", "Authorization / Config off"],
      ["SQL query all accounts", "Advanced query on aggregator"],
      ["Check before deploy", "Proactive evaluation / Hooks"],
      ["Security Hub no findings", "Enable Config"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d2", topic: "Tagging and Resource Groups",
  sections: [
    { h: "Tag basics and strategy", items: [
      "Key = value · **case-sensitive** · **50** user tags · key 128 / value 256 · **`aws:`** reserved (read-only, not counted) · **no secrets**",
      "Categories: **technical** (Name, Environment, Application) · **business** (**CostCenter**, **Owner**, Project) · **security** (DataClassification) · **automation** (Schedule, Backup, **Patch Group**)",
      "Small mandatory set + **dictionary** + one naming convention + **allowed values** · **accounts first, tags second**",
      "Layers: **apply at creation → prevent → standardise → detect → fix**"
    ]},
    { h: "Apply automatically", items: [
      "**CFN stack tags** propagate · **CDK `Tags.of(scope).add()`** · Terraform `default_tags` · SAM `Tags` / `--tags`",
      "Launch template **TagSpecifications** · ASG **`PropagateAtLaunch`** · ECS **`propagateTags`** + managed tags",
      "Service Catalog **TagOptions** · copy tags to snapshots / Backup",
      "Auto-tag creator: **EventBridge (CloudTrail) → Lambda** · AWS-generated **`aws:createdBy`**"
    ]},
    { h: "Prevent (SCP / IAM)", table: [
      ["Condition", "Use"],
      ["**`aws:RequestTag/K`** + **Null**", "**Require** tag at creation · restrict values"],
      ["**`aws:TagKeys`** + ForAllValues", "Only approved keys"],
      ["**`aws:TagKeys`** + deny DeleteTags / CreateTags", "**Protect** tags (admin exception)"],
      ["**`aws:ResourceTag`** / **`aws:PrincipalTag`**", "**ABAC**, protect tagged resources"]
    ]},
    { h: "Tag policies", items: [
      "Organizations (**all features**) · **tag_key** = exact case · **tag_value** = allowed values (`*` suffix)",
      "**`enforced_for`** blocks non-compliant **tag operations** on listed types",
      "**Don't require tags** (untagged = compliant) · don't fix existing",
      "Inheritance → **effective policy**: **@@assign** (overwrite) · **@@append** (add) · **@@remove** · `@@operators_allowed_for_child_policies`",
      "Org report from **management account** → **S3 us-east-1** · `GetComplianceSummary`"
    ]},
    { h: "Detect, fix, cost", items: [
      "**Config `required-tags`** (≤ 6 keys) via org conformance pack + aggregator",
      "**Tag Editor**: cross-Region search (not tagged) + **bulk edit** · Tagging API `GetResources`, `TagResources`",
      "Fix: Config remediation (custom SSM) · Lambda · Tag Editor · EventBridge `Tag Change on Resource`",
      "**Cost allocation tags activated in management account** (≤ 24h, forward) · **Cost Categories** for untaggable / account-based · Cost Explorer, Budgets, CUR"
    ]},
    { h: "ABAC", items: [
      "Allow when **`aws:ResourceTag/Team` = `${aws:PrincipalTag/Team}`** · scales without new policies",
      "**Require tag on create** + **deny changing the tag**",
      "Identity Center **attributes for access control** → session tags"
    ]},
    { h: "Resource Groups", items: [
      "**Tag-based** (dynamic query) · **CloudFormation stack-based** · service-configured (capacity reservation, License Manager)",
      "**Regional** · targets for **SSM** (Run Command, Automation, maintenance windows, Patch Manager), Application Manager, **CloudWatch Application Insights**",
      "Group lifecycle events → EventBridge · AppRegistry / myApplications (`awsApplication` tag)"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Block creation without tag", "SCP aws:RequestTag Null"],
      ["Case + values org-wide", "Tag policy"],
      ["Untagged launch allowed despite tag policy", "Tag policy doesn't require tags"],
      ["costcenter vs CostCenter", "Case-sensitive, non-compliant"],
      ["Org tag compliance report", "Management account → S3 us-east-1"],
      ["Add a value in child OU", "@@append"],
      ["Stop tag removal", "Deny DeleteTags with aws:TagKeys"],
      ["Only approved keys", "aws:TagKeys ForAllValues"],
      ["Tags missing in Cost Explorer", "Activate cost allocation tags (mgmt)"],
      ["Untaggable costs chargeback", "Cost Categories"],
      ["Missing tags across org", "Config required-tags + aggregator"],
      ["Bulk fix across Regions", "Tag Editor"],
      ["Tag creator automatically", "EventBridge → Lambda / aws:createdBy"],
      ["ASG instances untagged", "PropagateAtLaunch"],
      ["Tag all IaC resources", "Stack tags / CDK Tags.of"],
      ["Team-scoped access at scale", "ABAC"],
      ["User re-tagged to gain access", "Deny tag changes"],
      ["Run command on app X incl. new", "Tag-based resource group"],
      ["Group missing other Region", "Groups are regional"],
      ["Group by stack", "Stack-based group"],
      ["ECS tasks untagged", "propagateTags"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d2", topic: "AWS RAM",
  sections: [
    { h: "Core model", items: [
      "**Owner** shares **one resource** via a **resource share** = resources + principals + **managed permissions**",
      "Principals: **account IDs**, **org** (`o-`), **OUs** (`ou-`), IAM roles / users (some types), service principals",
      "Permissions: **AWS managed** default or **customer managed** (fewer actions, conditions, versioned) · one per type per share",
      "**Consumer IAM still required** → effective = RAM permission AND IAM",
      "`allowExternalPrincipals = false` → org only"
    ]},
    { h: "Org vs external", table: [
      ["Mode", "Behaviour"],
      ["**Org sharing enabled** (management account)", "**No invitations** · OU / org shares **include new accounts**"],
      ["Not enabled", "Account IDs → **invitation** (expires ~7 days)"],
      ["**External** accounts", "**Always invitation** · `allowExternalPrincipals = true`"],
      ["**Org-only types**", "**VPC subnets**"]
    ]},
    { h: "Shareable vs not", items: [
      "**RAM**: **subnets**, **Transit Gateway**, **Resolver rules**, DNS Firewall, Route 53 Profiles, **prefix lists**, Network Firewall, IPAM pools, Lattice, Cloud WAN, License Manager, Capacity Reservations, Dedicated Hosts, **Aurora clusters (clone)**, Image Builder, **Private CA**, advanced SSM parameters, Glue / Lake Formation",
      "**Not RAM**: **S3, KMS, SNS, SQS, Lambda, ECR, Secrets Manager** → resource policies (`aws:PrincipalOrgID`)",
      "**AMIs / snapshots** → launch / restore permissions · Service Catalog → portfolio sharing · StackSets = copies"
    ]},
    { h: "VPC sharing", items: [
      "**Same org only** · **no default subnets** · **AZ IDs** (`use1-az1`) not names",
      "**Owner**: VPC, subnets, **routes, NACLs**, IGW / NAT, endpoints, TGW attachments, flow logs · can't touch participant resources",
      "**Participants**: own resources + **own SGs** · **no** route / NACL changes, **no re-share**, **no owner default SG**, can't see others' resources",
      "Billing: participants pay their resources · **owner pays NAT / endpoints / TGW attachments**",
      "Benefits: **fewer VPCs**, **IP conservation**, no peering between apps, **central network control + account isolation**"
    ]},
    { h: "Governance", items: [
      "SCP deny `ram:CreateResourceShare` / `UpdateResourceShare` when **`ram:RequestedAllowsExternalPrincipals` = true**",
      "Only network account shares: **`ram:RequestedResourceType`** + **`aws:PrincipalAccount`**",
      "Detect: **IAM Access Analyzer** (zone of trust = org) · CloudTrail · EventBridge RAM events"
    ]},
    { h: "Patterns", items: [
      "**Central networking**: share subnets, TGW, prefix lists, Resolver rules, Network Firewall, IPAM to OUs (new CT accounts automatic)",
      "**Hybrid DNS**: outbound endpoint + forwarding rule in network account → share → associate with VPCs",
      "**Aurora** cross-account clone · **Private CA** · **License Manager** · **Capacity Reservations** · Image Builder"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["App accounts launch into central VPC", "VPC sharing (RAM subnets)"],
      ["No invitations, new accounts auto", "Enable org sharing + share to OU"],
      ["External account can't see share", "Accept invitation"],
      ["Share subnets with outside contractor", "Not possible (same org only)"],
      ["Participant can't edit routes", "Owner only"],
      ["Teams' 'us-east-1a' differ", "AZ IDs"],
      ["Who pays NAT", "Owner"],
      ["Consumer sees but can't use", "Consumer IAM"],
      ["Read-only prefix list", "Customer managed permission"],
      ["Same CIDRs in all SGs", "Shared prefix list"],
      ["Org-wide on-prem DNS", "Share Resolver rules"],
      ["Block external sharing", "SCP RequestedAllowsExternalPrincipals"],
      ["Only network acct shares subnets", "SCP RequestedResourceType + PrincipalAccount"],
      ["Detect external sharing", "IAM Access Analyzer"],
      ["S3 org-wide read", "Bucket policy aws:PrincipalOrgID"],
      ["New accounts attach to TGW", "Share TGW to OU"],
      ["Prod Aurora copy in test acct", "RAM share + clone"],
      ["Enable org sharing", "Management account"],
      ["Default SG fails for participant", "Create own SG"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d2", topic: "Domain 2 Extras",
  sections: [
    { h: "OpsWorks (end of life)", items: [
      "Managed **Chef / Puppet**: OpsWorks Stacks, Chef Automate, Puppet Enterprise - **all end of life (2024)**",
      "Stacks: layers + lifecycle **Setup, Configure, Deploy, Undeploy, Shutdown** · **Configure runs on all instances when one joins / leaves**",
      "New designs → **Systems Manager State Manager** + `AWS-ApplyChefRecipes` / `AWS-ApplyAnsiblePlaybooks`, Application Manager"
    ]},
    { h: "Pick the automation tool", table: [
      ["Need", "Tool"],
      ["Schedule (cron / rate / one-time, time zone)", "**EventBridge Scheduler**"],
      ["Scheduled API call, no code", "Scheduler **universal target** (e.g. ec2:StopInstances)"],
      ["React to an event", "EventBridge rule"],
      ["Short SDK code (< 15 min)", "**Lambda**"],
      ["Long / multi-step / retries / parallel / approval", "**Step Functions**"],
      ["Ops runbook, approvals, rate control", "**SSM Automation**"],
      ["Commands on instances", "SSM Run Command / State Manager"]
    ]},
    { h: "Lambda + SDK practices", items: [
      "**Execution role** (no keys) · cross-account **`sts:AssumeRole`** into target roles (ExternalId for third parties) · accounts via **Organizations ListAccounts**",
      "**15-minute** limit · **pagination** · **exponential backoff** on throttling · quotas · concurrency",
      "**Idempotent** · on-failure destinations / DLQ · Secrets Manager / Parameter Store for secrets"
    ]},
    { h: "Step Functions", items: [
      "**Standard** (1 year, exactly-once, history) vs **Express** (5 min, high volume, at-least-once)",
      "**SDK integrations** (200+ services, no Lambda) · **`.sync`** (start job and wait) · **`.waitForTaskToken`** (callback / human approval)",
      "**Distributed Map** (millions of items) · **Retry / Catch** · triggered by Scheduler / EventBridge"
    ]},
    { h: "CloudFormation Git sync and IaC generator", items: [
      "**Git sync**: stack linked to repo branch (CodeConnections) + deployment file (template path, parameters, tags) → **updates on push**, PR comments · **no test / approval stages** (use CodePipeline)",
      "**IaC generator**: **scan** account → select resources → **generate template** → **import** into stack · **`cdk migrate --from-scan`**",
      "Related: resource import, `cdk import`, drift detection after import"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["New Chef / Ansible config management", "SSM State Manager (not OpsWorks)"],
      ["OpsWorks event on join / leave", "Configure"],
      ["Stop dev instances nightly, no code", "Scheduler universal target"],
      ["2-hour automation job", "Step Functions Standard"],
      ["Short high-volume events", "Express workflow"],
      ["Approval in workflow", ".waitForTaskToken / aws:approve"],
      ["Automation across accounts", "AssumeRole into each account"],
      ["Throttling / first page only", "Backoff + pagination"],
      ["Millions of S3 objects", "Distributed Map"],
      ["Start CodeBuild and wait", ".sync"],
      ["Stack on Git push, no pipeline", "CloudFormation Git sync"],
      ["Need tests + approval", "CodePipeline"],
      ["ClickOps resources into IaC", "IaC generator + import"],
      ["CDK app from existing resources", "cdk migrate --from-scan"],
      ["Runbook + approval + rate control", "SSM Automation"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d3", topic: "DR Strategies",
  sections: [
    { h: "RTO vs RPO", items: [
      "**RTO** = max **downtime** (driven by running capacity + automation) · **RPO** = max **data loss** (driven by copy frequency)",
      "Lower RTO / RPO = **more cost** → tier workloads, pick the **cheapest strategy meeting both**",
      "**HA** (Multi-AZ) ≠ **DR** (another Region) ≠ **backups** (corruption, ransomware, deletion)",
      "**Replication copies the damage** → keep **PITR + immutable backups** (Vault Lock, air-gapped vault, Object Lock)"
    ]},
    { h: "The four strategies", table: [
      ["Strategy", "RPO / RTO", "DR Region", "Failover"],
      ["**Backup & restore**", "Hours / hours · cheapest", "Backups only", "Restore + **deploy stack (IaC)** + DNS"],
      ["**Pilot light**", "Minutes / tens of min", "**Data live**, compute **off** (ASG 0, AMIs, IaC)", "**Start compute**, promote DB, switch traffic"],
      ["**Warm standby**", "Sec-min / minutes", "**Small working stack running**", "**Scale out**, promote, switch"],
      ["**Multi-site active/active**", "~0 / ~0 · most expensive", "**Full stacks serving**", "Remove failed Region"]
    ]},
    { h: "Data services", items: [
      "EBS snapshot / **AMI copy** · **AWS DRS** (servers, RPO seconds, RTO minutes, low cost)",
      "RDS snapshot copy / **cross-Region replica (manual promote)**",
      "**Aurora Global DB**: < 1 s lag, **single writer** (+ write forwarding), **headless secondary**, **switchover** (planned, no loss) vs **failover** (RPO sec, RTO < 1 min)",
      "**DynamoDB global tables**: multi-active, **last-writer-wins** · PITR 35 days",
      "**S3 CRR + RTC** (99.99% in **15 min**) · Multi-Region Access Points · EFS replication · ElastiCache Global Datastore",
      "**Multi-Region secrets** · **KMS multi-Region keys** · **ECR replication** · **AWS Backup cross-Region / cross-account copy**"
    ]},
    { h: "Traffic and failover", items: [
      "**Route 53 failover + health checks** (active/passive) · latency / geoproximity / weighted (active/active) · **low TTL**",
      "**ARC**: routing controls (**data plane**), safety rules, **readiness checks**, zonal shift, **Region switch**",
      "**Global Accelerator**: static anycast IPs, traffic dials, **seconds**, no DNS caching · CloudFront origin failover",
      "**Data plane over control plane** · **static stability** · plan **failback** · avoid split brain"
    ]},
    { h: "Readiness and testing", items: [
      "Pre-raise **quotas**, copy **AMIs**, replicate images, keys, secrets · **IaC** for identical stacks",
      "**Game days** · **FIS** (stop conditions) · **Resilience Hub** (RTO / RPO policy, assessments, drift) · ARC readiness · **Backup restore testing**",
      "Monitor replication lag (Aurora, RDS, DynamoDB, S3 RTC, DRS)"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Hours RPO / RTO, lowest cost", "Backup & restore + IaC"],
      ["RPO minutes, servers off", "Pilot light"],
      ["Small working copy running", "Warm standby"],
      ["Near-zero, writes in both Regions", "Active/active + global tables"],
      ["Multi-AZ claimed as DR", "HA only"],
      ["Ransomware / mass deletion", "PITR + Object Lock / Vault Lock"],
      ["Aurora low lag, low DR cost", "Global DB headless secondary"],
      ["Planned Region move, no loss", "Aurora switchover"],
      ["RDS replica writable", "Manual promote"],
      ["S3 replication SLA", "CRR + RTC"],
      ["On-prem servers, RPO seconds", "AWS DRS"],
      ["DR can't launch / decrypt", "Quotas + multi-Region keys / secrets"],
      ["Automatic DNS failover", "Route 53 failover + health check"],
      ["Human-approved reliable failover", "Route 53 ARC"],
      ["Seconds failover, DNS caching", "Global Accelerator"],
      ["Global tables conflict", "Last-writer-wins"],
      ["Backup & restore RTO too long", "IaC + pre-staged AMIs + restore testing"],
      ["Continuous RTO / RPO assurance", "Resilience Hub + FIS"],
      ["Avoid control plane in outage", "Static stability + ARC data plane"],
      ["Many workloads", "Tier by business impact"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d3", topic: "Auto Scaling",
  sections: [
    { h: "ASG foundations", items: [
      "**Launch templates** (versioned) · min / desired / max · multi-AZ, AZ rebalancing",
      "Health: EC2 (default) · **ELB** (enable for app failures) · custom · **grace period** · **default instance warmup**",
      "Mixed instances: On-Demand base + %, Spot **price-capacity-optimized**, attribute-based types · **Capacity Rebalancing**",
      "**Standby** (out of service, not replaced) · **suspend** `ReplaceUnhealthy` / `HealthCheck` · **scale-in protection** (EC2 termination protection doesn't stop ASG)",
      "Group metrics · activity history · EventBridge events"
    ]},
    { h: "Lifecycle hooks", items: [
      "**Launch** → `Pending:Wait` · **Terminate** → `Terminating:Wait`",
      "**Heartbeat default 3600 s** · `RecordLifecycleActionHeartbeat` extends (≤ 48 h) · default result CONTINUE / ABANDON",
      "**`complete-lifecycle-action`** finishes · **ABANDON on launch = terminate**",
      "Registered with LB **after** launch hook · notifications: **EventBridge**, SNS, SQS",
      "Launch: bootstrap / validate before traffic · Terminate: **logs to S3**, drain (EventBridge → SSM / Lambda)",
      "Scale-out takes 1 h = **no complete-lifecycle-action**"
    ]},
    { h: "Warm pools", items: [
      "Pre-initialised instances: **Stopped (cheapest)** / Hibernated / **Running (fastest)**",
      "Min size + max prepared capacity · **`ReuseOnScaleIn`** returns instances to pool",
      "Hooks on pool entry (slow setup) and pool → InService",
      "**No mixed instances / Spot** · alternative: golden AMI, predictive / scheduled"
    ]},
    { h: "Termination policies", items: [
      "**AZ with most instances first** → allocation strategy → **oldest LT / LC** → closest to billing hour → random",
      "**OldestInstance** · **NewestInstance** · OldestLaunchTemplate · ClosestToNextInstanceHour · AllocationStrategy · **custom Lambda**",
      "Scale-in protection / Standby exempt instances"
    ]},
    { h: "Scaling policies", table: [
      ["Policy", "Use"],
      ["**Target tracking**", "Keep metric at target (CPU, **ALBRequestCountPerTarget**, custom) · managed alarms · **out if any, in if all**"],
      ["**Step**", "Alarm + graded steps · warmup"],
      ["Simple", "Legacy · cooldown 300 s"],
      ["**Scheduled**", "One-time / **cron** + **time zone** · set min / max / desired"],
      ["**Predictive**", "ML forecast (**≥ 24 h** history, 48 h ahead) · **forecast only** first · launch ahead · **+ target tracking**"],
      ["**SQS**", "**Backlog per instance** custom metric + target tracking"]
    ]},
    { h: "Instance refresh", items: [
      "**MinHealthyPercentage** (default 90) · **MaxHealthyPercentage ≤ 200** (> 100 = launch first)",
      "Instance warmup · **checkpoints** + delay · **skip matching** · desired configuration · bake time",
      "**AutoRollback** on failure / **CloudWatch alarms** (AlarmSpecification) · `RollbackInstanceRefresh` · cancel",
      "Golden AMI: **Image Builder → EventBridge → new LT version → instance refresh**",
      "CFN alternative: UpdatePolicy rolling / replacing · app code only: CodeDeploy"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Setup / validate before traffic", "Launch hook"],
      ["Logs before termination", "Terminate hook + EventBridge → SSM"],
      ["Scale-out 1 h after adding hook", "Call complete-lifecycle-action"],
      ["Slow boot, low idle cost", "Warm pool Stopped"],
      ["Return to pool on scale-in", "ReuseOnScaleIn"],
      ["Warm pool rejected", "Mixed / Spot unsupported"],
      ["Which AZ on scale-in", "AZ with most instances"],
      ["Oldest first", "OldestInstance"],
      ["Fewest sessions", "Custom Lambda policy"],
      ["Protect one instance", "Scale-in protection"],
      ["Troubleshoot, no replacement", "Standby / suspend ReplaceUnhealthy"],
      ["500s not replaced", "ELB health checks"],
      ["Requests per target", "Target tracking ALBRequestCountPerTarget"],
      ["SQS workers", "Backlog per instance"],
      ["Two target policies disagree", "Out if any, in if all"],
      ["Daily pattern + spikes", "Predictive + target tracking"],
      ["Predictive not scaling yet", "Needs 24 h, forecast only"],
      ["Black Friday / business hours", "Scheduled actions"],
      ["AMI rollout + rollback", "Instance refresh + auto rollback"],
      ["Launch before terminate", "Max healthy > 100 + skip matching"],
      ["Spot interruptions", "Capacity Rebalancing + price-capacity-optimized"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d3", topic: "ELB",
  sections: [
    { h: "Pick the load balancer", table: [
      ["Type", "Use"],
      ["**ALB** (L7)", "Host / path / header routing, **weighted TGs**, Lambda / IP targets, **WAF**, **OIDC / Cognito auth**, mTLS, **X-Forwarded-For**"],
      ["**NLB** (L4)", "TCP / UDP / TLS, **static / Elastic IPs**, **source IP preserved**, millions req/s, **PrivateLink**, **ALB as target**"],
      ["**GWLB** (L3)", "**GENEVE**, third-party firewalls / IDS, **GWLB endpoints**, flow stickiness"],
      ["CLB", "Legacy"],
      ["Static IP + L7", "**NLB → ALB** or **Global Accelerator → ALB**"],
      ["Multi-Region", "ELB is **regional** → Route 53 / Global Accelerator"]
    ]},
    { h: "Health checks", items: [
      "Interval **30 s** · healthy **5** · unhealthy **2** · timeout 5 s · matcher **200** (ranges allowed)",
      "States: initial, healthy, unhealthy, **draining**, unused, unavailable",
      "**Fail open**: all unhealthy → route to all · TG health thresholds for **DNS failover**",
      "ASG must use **ELB health check type** (+ grace period) to replace LB-unhealthy instances",
      "Keep health checks **lightweight** (deep checks = cascading failure)"
    ]},
    { h: "Draining and cross-zone", items: [
      "**Deregistration delay** default **300 s** (0–3600) · lower = faster deploys / scale-in · raise = long uploads / WebSockets",
      "CodeDeploy batches slow by ~5 min = deregistration delay",
      "Cross-zone: **ALB on, free** · **NLB / GWLB off, charged** when on",
      "Uneven AZ load → **enable cross-zone** or **balance instances** · cross-zone off pairs with **ARC zonal shift**"
    ]},
    { h: "Stickiness", items: [
      "ALB **duration** (`AWSALB`, 1 s–7 days) · **application cookie** (`AWSALBAPP`) · **target group stickiness** (`AWSALBTG`) for weighted blue/green",
      "NLB: **source IP** · GWLB: 5-tuple (3 / 2-tuple)",
      "Downsides: uneven load, sessions lost on failure → **ElastiCache / DynamoDB sessions**"
    ]},
    { h: "TLS, errors, logs", items: [
      "ALB HTTPS + ACM + **SNI** · re-encrypt to targets · **NLB TCP passthrough** when backend terminates TLS · NLB TLS listener · **ALB mTLS**",
      "**502** bad response / closed (keep-alive < idle timeout) · **503** no registered targets · **504** target timeout",
      "ALB **idle timeout 60 s** (backend keep-alive higher) · NLB TCP idle 350 s",
      "**Access logs** to S3 (**off by default**) + Athena · `HTTPCode_ELB_5XX` vs `HTTPCode_Target_5XX` · `TargetResponseTime`",
      "**Slow start** ramps new targets · algorithms: round robin, least outstanding, weighted random"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Path routing + WAF + auth", "ALB"],
      ["Static IPs + path routing", "NLB → ALB / Global Accelerator"],
      ["PrivateLink service", "NLB"],
      ["Third-party firewalls inline", "GWLB"],
      ["Client IP behind ALB", "X-Forwarded-For"],
      ["Unhealthy not replaced", "ASG ELB health check"],
      ["All targets unhealthy", "Fail open; lightweight checks"],
      ["Deploy batches +5 min", "Lower deregistration delay"],
      ["Uploads cut on scale-in", "Raise deregistration delay"],
      ["NLB one AZ overloaded", "Cross-zone / balance instances"],
      ["Random logouts", "Stickiness → external sessions"],
      ["Follow app cookie", "Application-based stickiness"],
      ["Users flip versions in canary", "Target group stickiness"],
      ["502 with short keep-alive", "Keep-alive > idle timeout"],
      ["503", "No registered targets"],
      ["504", "Target timeout"],
      ["Backend terminates TLS", "NLB TCP passthrough"],
      ["SQL over requests", "Access logs + Athena"],
      ["New targets need warmup", "Slow start"],
      ["Regional failover", "Route 53 alias Evaluate Target Health"],
      ["SQL injection protection", "WAF on ALB"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d3", topic: "Route 53",
  sections: [
    { h: "Basics", items: [
      "Public / **private hosted zones** (VPC association, cross-account authorization)",
      "**Alias**: AWS targets (ELB, CloudFront, S3 website, API GW, Global Accelerator), **zone apex OK**, **free**, **Evaluate Target Health** · **not EC2 DNS**",
      "**CNAME not at apex** · **low TTL** (60 s) for failover / migrations",
      "Resolver: **inbound** (on-prem → AWS), **outbound + forwarding rules** (RAM share), DNS Firewall, Profiles",
      "Global: health metrics, query logs, DNSSEC keys in **us-east-1**"
    ]},
    { h: "Routing policies", table: [
      ["Policy", "Use"],
      ["Simple", "Single resource · **no health checks**"],
      ["**Weighted**", "**Canary / blue-green** (0–255, weight 0 = none)"],
      ["**Latency**", "**Fastest Region**"],
      ["**Failover**", "Active/passive DR · **primary needs health check** · S3 maintenance page"],
      ["**Geolocation**", "Continent / country / state · **compliance** · **Default record required**"],
      ["**Geoproximity**", "Distance + **bias** (−99…+99) to shift traffic"],
      ["**Multivalue**", "Up to **8 healthy** records (client-side)"],
      ["**IP-based**", "Client CIDR collections (ISPs / networks)"],
      ["Nested / Traffic Flow", "Combine (latency → failover) · policy records cost monthly"]
    ]},
    { h: "Health checks", items: [
      "**Endpoint**: HTTP / HTTPS / TCP, path, **string match** (first 5,120 bytes), **30 s / 10 s**, threshold **3**, healthy if **> 18%** of ~15 checkers, 2xx/3xx in 4 s",
      "**Allow checker IP ranges** in SG / firewall · HTTPS doesn't validate cert",
      "**Calculated**: AND / OR / at least N children (≤ 256)",
      "**CloudWatch alarm-based**: **private resources** / business metrics",
      "`HealthCheckStatus` in **us-east-1** → alarm → SNS · **fail open** if all unhealthy",
      "Alias **Evaluate Target Health** replaces separate ELB checks"
    ]},
    { h: "ARC", items: [
      "**Zonal shift**: manual, temporary move away from an AZ (ALB, NLB, ASG, EKS) · best with **cross-zone off**",
      "**Zonal autoshift**: AWS shifts on AZ impairment · needs **practice runs** + outcome / blocking alarms + **spare capacity**",
      "**Routing controls**: cluster = **5 data plane endpoints** · on/off → **routing control health check** → failover records · **safety rules** (assertion: ≥ 1 on; gating) · per-hour cost",
      "**Readiness checks**: recovery group → cells → resource sets · capacity / quota / config parity",
      "**Region switch**: recovery plans (scale, Aurora failover, routing, Lambda, approval)",
      "Seconds failover without DNS caching → **Global Accelerator**"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["10% canary", "Weighted"],
      ["Maintenance page on failure", "Failover + health check"],
      ["Best performance globally", "Latency"],
      ["EU residency", "Geolocation + default"],
      ["Geo routing no answer", "Add Default record"],
      ["Gradual geographic shift", "Geoproximity bias"],
      ["Up to 8 healthy IPs", "Multivalue"],
      ["Apex to ALB", "Alias record"],
      ["Private resource health", "CloudWatch alarm-based check"],
      ["Both tiers must be healthy", "Calculated (AND)"],
      ["Always unhealthy", "Checker IPs / path / string"],
      ["ELB failover, no checks", "Evaluate Target Health"],
      ["Alarm metric missing", "us-east-1"],
      ["All unhealthy", "Fail open"],
      ["Latency + failover", "Nested aliases"],
      ["Human-approved reliable failover", "ARC routing controls + safety rules"],
      ["Move away from bad AZ now", "Zonal shift"],
      ["Automatic AZ evacuation", "Zonal autoshift"],
      ["Is DR ready?", "Readiness checks"],
      ["Multi-step Region failover plan", "Region switch"],
      ["VPCs resolve on-prem names", "Outbound endpoint + rule (RAM)"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d3", topic: "Multi-Region Data",
  sections: [
    { h: "RDS: Multi-AZ vs read replicas", table: [
      ["", "Multi-AZ instance", "Multi-AZ cluster", "Read replica"],
      ["Purpose", "**HA** in Region", "HA + reads", "**Read scaling** / cross-Region copy"],
      ["Replication", "**Sync**", "Semi-sync", "**Async** (`ReplicaLag`)"],
      ["Readable", "**No**", "Yes (2 standbys, 3 AZs)", "Yes"],
      ["Failover", "**Auto 60–120 s**, same endpoint", "Auto < 35 s", "**Manual promote** (standalone)"]
    ]},
    { h: "RDS details", items: [
      "Replicas: up to **15** (MySQL / MariaDB / PostgreSQL) · same or cross-Region · **automated backups required** · destination-Region **KMS key** · can be Multi-AZ",
      "Cross-Region DR: **snapshot copy** (cheapest) → **automated backup replication** (PITR, RPO minutes) → **cross-Region replica + promote** (RPO seconds)",
      "Use **endpoint DNS**, retries, **RDS Proxy** · test with reboot with failover"
    ]},
    { h: "Aurora Global Database", items: [
      "In-Region: **6 copies / 3 AZs**, 15 replicas, reader endpoint, ~**30 s** failover by promotion tier",
      "Global: **storage-based async, < 1 s**, read-only secondaries (16 replicas each), **headless secondary** = pilot light",
      "**Write forwarding** (single primary writer) · **global writer endpoint** follows primary",
      "**Switchover** = planned, **RPO 0** · **failover** = unplanned, RPO seconds, **RTO < 1 min** · detach-and-promote",
      "`AuroraGlobalDBReplicationLag` / `RPOLag` · PostgreSQL **`rds.global_db_rpo`** bounds data loss"
    ]},
    { h: "DynamoDB Global Tables", items: [
      "**Multi-active** read / write in every Region · async **< 1 s**",
      "**MREC** (default): eventual, **last-writer-wins** · **MRSC**: strong consistency, **RPO 0**, 3 Regions, higher write latency",
      "Add replicas to existing table · on-demand or auto scaling · replicated write units · GSIs / TTL replicated",
      "`ReplicationLatency` · partition write ownership · **keep PITR / Backup** (deletes replicate)"
    ]},
    { h: "S3 CRR / SRR", items: [
      "**CRR** = other Region (DR, latency, compliance) · **SRR** = same Region (log aggregation, prod → test, sovereignty)",
      "**Versioning both buckets** · IAM replication role · prefix / tag filters · destination storage class",
      "**New objects only** → **Batch Replication** for existing / failed",
      "Cross-account: bucket policy + **owner override** · **SSE-KMS**: enable KMS replication + destination key + role KMS perms",
      "Delete markers **optional** · **version deletes never replicated** · **not transitive** · lifecycle not replicated",
      "**RTC** 99.99% in **15 min** + metrics / notifications · **two-way** + replica modification sync · **Multi-Region Access Points** (failover controls)"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Auto AZ failover, same endpoint", "RDS Multi-AZ"],
      ["Reports on standby", "Not readable → replicas"],
      ["< 35 s + readable standbys", "Multi-AZ DB cluster"],
      ["RDS DR seconds RPO", "Cross-Region replica + promote"],
      ["Replica option missing", "Enable automated backups"],
      ["Cheap RDS DR, no instance", "Automated backup replication"],
      ["Aurora < 1 s cross-Region", "Global Database"],
      ["Aurora pilot light", "Headless secondary"],
      ["Writes from secondary", "Write forwarding"],
      ["Drill, no data loss", "Switchover"],
      ["No connection change", "Global writer endpoint"],
      ["Bound Aurora RPO", "rds.global_db_rpo"],
      ["Local writes everywhere", "Global Tables"],
      ["Global table conflict", "Last-writer-wins"],
      ["Strong consistency, RPO 0", "Global Tables MRSC"],
      ["Deletes replicated", "PITR / Backup"],
      ["Existing S3 objects", "Batch Replication"],
      ["Rule blocked", "Versioning both"],
      ["SSE-KMS not replicating", "KMS option + keys + role"],
      ["Destination owns replicas", "Owner override"],
      ["Version deleted in source", "Remains in destination"],
      ["SLA + single endpoint", "RTC + Multi-Region Access Points"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d3", topic: "AWS Backup",
  sections: [
    { h: "Building blocks", items: [
      "**Backup plans** (rules) · **resource assignments** (tags / ARNs / types, IAM role) · **vaults** (KMS, access policy, lock) · **recovery points / jobs**",
      "Services: EC2, EBS, RDS, Aurora, DynamoDB, EFS, FSx, S3, Storage Gateway, SAP HANA, VMware, DocumentDB, Neptune, Redshift, CFN stacks",
      "**Tag-based assignment** → new resources protected automatically (enforce tag with tag policies / SCPs)"
    ]},
    { h: "Plan rules", items: [
      "Frequency hourly / 12h / daily / weekly / monthly / **cron** · window start / complete",
      "**Continuous backup (PITR)** RDS, Aurora, S3, SAP HANA · **≤ 35 days**",
      "Lifecycle: **cold storage (min 90 days)** → expire · **copy actions** (own lifecycle)",
      "**VSS** for Windows app-consistent · **DynamoDB advanced features** for copies / cold storage"
    ]},
    { h: "Vaults", items: [
      "KMS: **vault key** for fully managed types (EFS, DynamoDB adv, S3) · **source key** for EBS / RDS / Aurora",
      "**Vault access policy**: deny `DeleteRecoveryPoint` except break-glass · allow `CopyIntoBackupVault` from org",
      "SNS vault notifications / EventBridge job events · **legal hold** · restore = **new resource**"
    ]},
    { h: "Copies", table: [
      ["Type", "Requirements"],
      ["**Cross-Region**", "Copy action → vault in other Region, own lifecycle (DR)"],
      ["**Cross-account**", "Same **Organization** · **enable cross-account backup** (mgmt account) · destination **vault policy** CopyIntoBackupVault"],
      ["EBS / RDS cross-account", "**Customer managed KMS key shared** with destination (aws/ebs, aws/rds can't be shared)"]
    ]},
    { h: "Vault Lock and air gap", table: [
      ["Option", "Behaviour"],
      ["**Governance**", "Min / max retention, blocks deletes · **removable** by privileged users (testing)"],
      ["**Compliance**", "**Immutable for everyone incl. root / AWS** after **cooling-off ≥ 72 h** · editable only during cooling-off"],
      ["**Logically air-gapped vault**", "Locked by default, **AWS-owned key**, isolated · **shared via RAM** to recovery account"],
      ["Ransomware design", "Separate backup account + compliance lock / air gap + DR Region + SCP / vault policy deny deletes"]
    ]},
    { h: "Organization", items: [
      "**Organizations backup policies** → plans in member accounts, **local admins can't change**",
      "**Delegated administrator** · cross-account monitoring",
      "**Backup Audit Manager**: frameworks / controls (protected, frequency, retention, encryption, copies, lock) + reports to S3 · needs **Config**",
      "**Restore testing**: scheduled restores, validation (EventBridge → Lambda), restore time, cleanup"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Central multi-service policy", "AWS Backup plans"],
      ["Auto-include new resources", "Tag-based assignment"],
      ["PITR 14 days + 7 years", "Continuous rule + snapshot rule"],
      ["Cold 30 / delete 60 rejected", "Cold storage min 90 days"],
      ["Copy to DR Region", "Copy action + own lifecycle"],
      ["Central backup account", "Enable cross-account + vault policy"],
      ["EBS / RDS copy fails", "Shared CMK"],
      ["WORM, even root", "Vault Lock compliance"],
      ["Testable removable lock", "Governance mode"],
      ["Fix compliance lock", "Only during cooling-off"],
      ["Isolated + RAM share", "Logically air-gapped vault"],
      ["Ransomware-resilient", "Separate account + compliance lock"],
      ["80 accounts, can't change", "Org backup policies"],
      ["Prove compliance", "Backup Audit Manager"],
      ["Prove restores", "Restore testing"],
      ["Litigation", "Legal hold"],
      ["Restore didn't overwrite", "Restore = new resource"],
      ["DynamoDB copy missing", "Advanced features"],
      ["App-consistent Windows", "VSS"],
      ["Only break-glass deletes", "Vault access policy"],
      ["Failure alerts", "EventBridge / vault SNS"],
      ["Server RPO seconds", "DRS, not Backup"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d3", topic: "DRS",
  sections: [
    { h: "What DRS is", items: [
      "**Continuous block-level replication** of **physical / VMware / Hyper-V / other-cloud / EC2** servers → **low-cost staging** in an AWS Region",
      "**RPO seconds · RTO minutes** (5–20 min) · successor of CloudEndure DR · **active/passive**",
      "Pay mostly for staging · recovery / drill instances only while running",
      "**Not** for managed services (RDS, DynamoDB, S3) · migration = **MGN** · retention = **AWS Backup**"
    ]},
    { h: "Architecture", items: [
      "**AWS Replication Agent** (or agentless vCenter) · crash-consistent",
      "Ports: **TCP 1500** data to replication servers · **443** control",
      "Staging subnet: **small replication servers** + **cheap EBS** + **PIT snapshots** · optional staging account",
      "**Private IP routing** over VPN / Direct Connect · TLS in transit · EBS KMS at rest",
      "**Conversion server** makes boot volumes EC2-compatible at launch"
    ]},
    { h: "Settings", table: [
      ["Setting", "Detail"],
      ["Replication server", "Dedicated or **shared** (cheaper)"],
      ["Staging EBS", "**Auto / st1 / sc1** (cost lever) or gp3"],
      ["PIT retention", "10 min / 1 h · hourly / 24 h · **daily / 7 d** · extendable"],
      ["Data routing", "Public IP or **private IP**"],
      ["Launch template", "Type, subnet, SGs, profile"],
      ["Right-sizing", "**Basic** = match source CPU / RAM"],
      ["Copy private IP", "Keep source private IP"],
      ["Post-launch actions", "**SSM documents** (agents, validation, DNS)"],
      ["Network replication", "Recreate **source VPC config** for EC2 sources"]
    ]},
    { h: "Operations", items: [
      "**Drill** = non-disruptive test (replication continues) → terminate",
      "**Recovery** = latest or **PIT** (ransomware) → switch DNS / ARC",
      "Recover in **dependency order** (DB → app → web)",
      "**Failback**: **Failback Client** (on-prem / VMware) · **reversed replication** (AWS → AWS) · re-protect",
      "Agent creds: **AWSElasticDisasterRecoveryAgentInstallationPolicy** · scale: **multiple staging accounts**",
      "Monitor lag / backlog · **EventBridge** stall events → SNS"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["VMware DR, RPO seconds, low cost", "DRS"],
      ["Why cheap", "Small replication servers + cheap EBS"],
      ["No internet replication", "Private IP over DX / VPN"],
      ["Agent installed, no replication", "Open TCP 1500"],
      ["Ransomware 40 min ago", "PIT recovery point"],
      ["Test without impact", "Drill"],
      ["VMware disk won't boot", "Conversion server"],
      ["Configure after recovery", "Post-launch actions"],
      ["Keep same IPs", "Copy private IP"],
      ["Match instance size", "Right-sizing Basic"],
      ["Back to VMware", "Failback Client"],
      ["Back to original Region", "Reversed replication"],
      ["Protect RDS / DynamoDB", "Native replication, not DRS"],
      ["Reduce staging cost", "Cheap EBS + shared servers"],
      ["Growing lag", "Bandwidth / bigger replication server"],
      ["Migrate + DR", "MGN + DRS"],
      ["900 servers", "Multiple staging accounts"],
      ["Agent install creds", "Agent installation policy"],
      ["Dependent tiers", "Recover in order"],
      ["Stall alerts", "EventBridge → SNS"],
      ["Same VPC config in DR Region", "Network replication"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d3", topic: "Decoupling",
  sections: [
    { h: "Which service", table: [
      ["Need", "Choose"],
      ["Buffer work, one consumer per message, retry + DLQ", "**SQS**"],
      ["Order per entity, no duplicates", "**SQS FIFO** (MessageGroupId)"],
      ["One event → many consumers", "**SNS → multiple SQS** (filter policies)"],
      ["Rich routing, AWS / SaaS events, archive / replay", "**EventBridge**"],
      ["Multiple readers, order per key, replay", "**Kinesis Data Streams**"],
      ["Managed delivery to S3 / Redshift / OpenSearch", "**Data Firehose** (no replay)"],
      ["Multi-step workflow, retries, compensation", "**Step Functions**"]
    ]},
    { h: "SQS essentials", items: [
      "Standard: **at least once**, best-effort order · FIFO: exactly-once, **order per group**, 300 / 3,000 msg/s, dedup **5 min**",
      "**Visibility timeout** 30 s default / 12 h max · **> processing time** · `ChangeMessageVisibility`",
      "Lambda: **visibility ≥ 6 × function timeout** · **ReportBatchItemFailures** · maximum concurrency",
      "Retention 4 d (1 min–14 d) · **long polling 20 s** · delay queue ≤ 15 min · batch 10 · **S3 pointer** for big payloads",
      "Scale on **backlog per instance** · alarm **ApproximateAgeOfOldestMessage**"
    ]},
    { h: "DLQ", items: [
      "Redrive policy: **maxReceiveCount** → DLQ (poison messages)",
      "**Same type** (FIFO → FIFO DLQ), same account / Region",
      "**DLQ retention > source** (enqueue timestamp kept)",
      "**DLQ redrive** (StartMessageMoveTask) after fix · alarm DLQ depth > 0"
    ]},
    { h: "SNS", items: [
      "Push to SQS, Lambda, HTTP/S, email, SMS, mobile, Firehose · standard / **FIFO topics** (archive / replay)",
      "**Filter policies** (attributes / body) · raw delivery · **subscription DLQ**",
      "SNS → SQS needs **queue policy allowing topic** + **KMS key permissions** if encrypted"
    ]},
    { h: "Kinesis", items: [
      "Shard: **1 MB/s or 1,000 rec/s in** · **2 MB/s out** shared or per consumer (**EFO**)",
      "**Order per partition key** · retention **24 h → 365 d** (replay) · on-demand vs provisioned",
      "Throttling / hot shard → better key, more shards / on-demand, backoff · lag = **IteratorAge**",
      "Lambda: **bisect batch**, **max retry attempts / record age**, **on-failure destination**, parallelization factor (≤ 10)",
      "KCL checkpoints in DynamoDB · **Firehose**: buffering, Lambda transform, **Parquet**, dynamic partitioning, **near real time, no replay**"
    ]},
    { h: "Step Functions", items: [
      "**Standard** (1 year, exactly-once, history) vs **Express** (5 min, high volume)",
      "States: Task, Choice, Parallel, Map / **Distributed Map**, Wait, Pass, Succeed, Fail",
      "**Retry** (backoff, jitter) · **Catch** (fallback) · timeouts / **heartbeats**",
      "**Request-response** · **.sync** (wait for job) · **.waitForTaskToken** (callback / approval) · SDK integrations",
      "**Saga** = Catch → compensating states · **redrive** from failed step"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Orders lost in spikes", "SQS buffer + scale on backlog"],
      ["Processed twice (3-min jobs)", "Visibility > processing time"],
      ["Lambda + SQS redelivery", "Visibility ≥ 6× timeout"],
      ["Poison message loops", "DLQ + maxReceiveCount"],
      ["Standard DLQ for FIFO", "Must be FIFO"],
      ["DLQ messages vanish", "DLQ retention longer"],
      ["Reprocess after fix", "DLQ redrive"],
      ["Empty receives cost", "Long polling 20 s"],
      ["Per-account order", "FIFO + MessageGroupId"],
      ["50 MB payload", "S3 + pointer"],
      ["3 services get each event", "SNS → 3 SQS"],
      ["Subscriber filter", "Filter policy"],
      ["SNS → SQS nothing arrives", "Queue policy + KMS key policy"],
      ["AWS / SaaS routing + replay", "EventBridge"],
      ["Multi-reader replay stream", "Kinesis Data Streams"],
      ["Hot shard throttling", "Better key + shards + backoff"],
      ["IteratorAge rising", "Consumer lag → scale consumer"],
      ["Poison Kinesis record", "Bisect + max retries + destination"],
      ["Logs to S3 Parquet", "Data Firehose"],
      ["Undo reservation on failure", "Step Functions saga"],
      ["Resume failed execution", "Redrive"],
      ["Batch fails for one message", "ReportBatchItemFailures"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d3", topic: "Caching",
  sections: [
    { h: "CloudFront core", items: [
      "Edge + regional caches · origins: **S3 (OAC)**, ALB / EC2 / custom, API GW, Lambda URLs, **VPC origins**",
      "**Behaviors** by path · **cache policy** (TTL min / default 24 h / max + **cache key**) · **origin request policy** (forward without cache key) · **response headers policy** (CORS, security)",
      "**Versioned file names > invalidation** (1,000 free paths / month) · invalidation for urgent same-URL fixes",
      "Hit ratio: **trim cache key**, **Origin Shield**, longer TTL, compression · metrics + **ACM cert in us-east-1**"
    ]},
    { h: "CloudFront resilience and security", items: [
      "**Origin groups**: primary / secondary on 5xx / 403 / 404 / connection errors · **GET / HEAD / OPTIONS only**",
      "`stale-if-error` / `stale-while-revalidate` · custom error pages · **error caching min TTL**",
      "**Continuous deployment**: staging distribution, % or header traffic → promote",
      "**OAC** (KMS ok, replaces OAI) · bucket policy `AWS:SourceArn` · website endpoint = custom origin",
      "**WAF**, Shield, **geo restriction**, **signed URLs / cookies**, field-level encryption · real-time logs → Kinesis"
    ]},
    { h: "Edge compute", table: [
      ["", "CloudFront Functions", "Lambda@Edge"],
      ["Events", "Viewer request / response", "+ origin request / response"],
      ["Power", "Sub-ms JS, **no network**", "Node / Python, **network calls**"],
      ["Use", "Rewrites, redirects, headers, cache-key normalisation", "Auth lookups, origin selection, response changes"],
      ["Cost", "Cheapest", "Higher · authored in us-east-1"]
    ]},
    { h: "ElastiCache", table: [
      ["", "Valkey / Redis", "Memcached"],
      ["Replication / HA", "**Replicas + Multi-AZ failover**", "None"],
      ["Persistence", "**Snapshots**", "None"],
      ["Scaling", "**Cluster mode** shards, replicas, auto scaling", "Add nodes, multi-threaded"],
      ["Cross-Region", "**Global Datastore**", "No"],
      ["Types", "Sorted sets, hashes, streams, pub/sub", "Key / value"]
    ]},
    { h: "Strategies and metrics", items: [
      "**Lazy loading** (miss penalty, stale until TTL) · **write-through** (fresh, write penalty, unused data) · **TTL** bounds staleness",
      "**Session store** instead of sticky sessions · stampede → **TTL jitter + request coalescing**",
      "Eviction: volatile-lru (default), allkeys-lru, allkeys-lfu, noeviction · **Serverless** for spiky load",
      "Metrics: **hit rate**, **Evictions** (memory pressure), **EngineCPUUtilization**, memory %, connections, ReplicationLag",
      "**DAX** (DynamoDB µs, strong reads bypass) · **API Gateway cache** (300 s default) · **RDS Proxy** = pooling only"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Slow global S3 content", "CloudFront"],
      ["Private S3 incl. KMS", "OAC"],
      ["Old JS after deploy", "Versioned file names"],
      ["Urgent fix same URL", "Invalidation"],
      ["Low hit ratio", "Trim cache key + origin request policy"],
      ["Origin overloaded by edges", "Origin Shield"],
      ["Serve from replica on failure", "Origin group"],
      ["POST not failing over", "GET / HEAD / OPTIONS only"],
      ["Cert not selectable", "ACM us-east-1"],
      ["Test config on 5%", "Continuous deployment"],
      ["Redirects / headers cheap", "CloudFront Functions"],
      ["External auth at edge", "Lambda@Edge"],
      ["UDP + static IPs", "Global Accelerator"],
      ["Repeated DB reads", "ElastiCache lazy + TTL"],
      ["Stale after writes", "Write-through + TTL"],
      ["Sessions lost on scale-in", "External session store"],
      ["HA cache + leaderboard", "Valkey / Redis Multi-AZ"],
      ["Writes / memory saturated", "Cluster mode shards"],
      ["High Evictions", "Memory pressure"],
      ["Cross-Region cache", "Global Datastore"],
      ["DynamoDB µs", "DAX"],
      ["Cache stampede", "TTL jitter + coalescing"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d3", topic: "FIS and Resilience Hub",
  sections: [
    { h: "Chaos engineering", items: [
      "**Steady state → hypothesis → inject fault → observe / stop → learn, fix, automate**",
      "**Limit blast radius**: non-prod first, tags, COUNT / PERCENT, short duration",
      "**Resilience Hub says** (RTO / RPO, recommendations) · **FIS proves** (real faults)"
    ]},
    { h: "FIS templates", items: [
      "**Actions** (parallel / sequence, `aws:fis:wait`) · **targets** (ARNs, **tags**, filters, ALL / **COUNT** / **PERCENT**)",
      "**Stop conditions** = CloudWatch alarms → stop + rollback · **IAM role trusts `fis.amazonaws.com`**",
      "Logs (CloudWatch / S3) · **experiment reports** · **multi-account** experiments (orchestrator + targets)",
      "**Safety lever** = stop all + block new · governance: tag targets + IAM / SCP on `fis:StartExperiment`",
      "Automate: **EventBridge Scheduler** / **CI/CD stage** · cost per action-minute"
    ]},
    { h: "Key FIS actions", table: [
      ["Test", "Action"],
      ["Instance loss", "`aws:ec2:stop / terminate / reboot-instances`"],
      ["Spot handling", "**`send-spot-instance-interruptions`**"],
      ["ASG can't launch in AZ", "**`asg-insufficient-instance-capacity-error`**"],
      ["CPU / memory / latency in instance", "**`aws:ssm:send-command`** AWSFIS-Run-* (**SSM Agent**)"],
      ["Containers", "ECS stop-task / stress · EKS pod-delete / stress / latency"],
      ["DB / cache failover", "**`aws:rds:failover-db-cluster`** · ElastiCache AZ power"],
      ["Storage / replication", "`aws:ebs:pause-volume-io` · S3 / DynamoDB replication pause"],
      ["Network", "**`aws:network:disrupt-connectivity`** · cross-Region route / TGW"],
      ["API throttling / errors", "**`aws:fis:inject-api-throttle-error`** (internal / unavailable)"],
      ["Scenarios", "**AZ Availability: Power Interruption** · **Cross-Region: Connectivity**"]
    ]},
    { h: "Resilience Hub", items: [
      "App from **CloudFormation, Terraform, Resource Groups, AppRegistry, EKS**",
      "**Resiliency policy**: RTO / RPO per **application, infrastructure, AZ, Region** + tier",
      "**Assessment** → estimated RTO / RPO, **met / breached**, **resiliency score**",
      "**Resiliency recommendations** (Multi-AZ, replicas, backups, ASG spread)",
      "**Operational recommendations**: **alarms**, **SOPs (SSM Automation)**, **FIS templates** → **export CloudFormation**",
      "**Scheduled assessments / drift** → SNS / EventBridge · **CI/CD gate** fails on breach"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Controlled, logged failure injection", "FIS"],
      ["Experiment didn't stop on impact", "Stop conditions"],
      ["Stop all experiments now", "Safety lever"],
      ["Realistic AZ loss", "AZ Power Interruption scenario"],
      ["Multi-Region failover test", "Cross-Region: Connectivity"],
      ["Spot interruption test", "send-spot-instance-interruptions"],
      ["Aurora failover test", "rds:failover-db-cluster"],
      ["SSM stress fails on instances", "SSM Agent missing"],
      ["Test SDK backoff", "inject-api-throttle-error"],
      ["Only opted-in resources", "Tag targets + IAM / SCP"],
      ["FIS role trust", "fis.amazonaws.com"],
      ["One of ten instances", "COUNT(1) / PERCENT"],
      ["Weekly / pipeline chaos", "EventBridge Scheduler / CI/CD stage"],
      ["Across accounts", "Multi-account experiment"],
      ["Meets RTO / RPO?", "Resilience Hub assessment"],
      ["Policy content", "RTO / RPO per disruption type"],
      ["Single-AZ DB breach", "Enable Multi-AZ"],
      ["Alarms + runbooks + tests", "Operational recommendations (CFN)"],
      ["Resilience regression", "Scheduled assessments + pipeline gate"],
      ["App sources", "CFN, Terraform, RG, AppRegistry, EKS"],
      ["Full DR readiness", "Resilience Hub + ARC readiness + FIS + Backup restore testing"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d3", topic: "Domain 3 Extras",
  sections: [
    { h: "Containers", items: [
      "**ECS tasks**: Service Auto Scaling target tracking (CPU, memory, **ALBRequestCountPerTarget**), step, scheduled, predictive",
      "**ECS EC2 capacity**: **capacity provider + managed scaling** (`CapacityProviderReservation`) + managed termination protection · tasks stuck PROVISIONING = no capacity",
      "Strategy **base + weight** · **Fargate Spot** = 2-min warning (SIGTERM, stopTimeout ≤ 120 s)",
      "**EKS**: **HPA = pods** · **Cluster Autoscaler** (node-group ASGs) / **Karpenter** (right-sized EC2, consolidation, Spot) **= nodes** · **KEDA** = queue-driven pods"
    ]},
    { h: "Lambda and API Gateway", table: [
      ["Item", "Remember"],
      ["Concurrency", "**req/s × duration** · **1,000** per Region default · +1,000 per 10 s per function"],
      ["**Reserved**", "Cap + guarantee · **free** · protects downstream · **0 = off switch**"],
      ["**Provisioned**", "**No cold starts** · **alias / version** · paid · Application Auto Scaling · spillover metric"],
      ["Throttles", "Sync **429** · async retried **6 h** → destination / DLQ · SQS ESM **maximum concurrency**"],
      ["DB connection storms", "Cap concurrency + **RDS Proxy**"],
      ["API Gateway", "**10,000 rps / 5,000 burst** · stage / method throttles · **usage plans + API keys** (per-client throttle + quota) · keys ≠ auth"]
    ]},
    { h: "Data tier", table: [
      ["Item", "Remember"],
      ["DynamoDB **on-demand**", "Spiky / unknown traffic, instant (2× previous peak)"],
      ["Provisioned + auto scaling", "Steady traffic, reacts in **minutes**"],
      ["**Hot key**", "Per partition **3,000 RCU / 1,000 WCU** → high-cardinality key, **write sharding**, DAX reads"],
      ["Base table throttled, spare capacity", "**GSI** write capacity"],
      ["**Aurora Replica auto scaling**", "Target tracking on reader CPU / connections, ≤ 15, reader endpoint"],
      ["**Aurora Serverless v2**", "ACUs scale in seconds, auto-pause, Multi-AZ, Global DB, mix with provisioned"],
      ["RDS", "Storage auto scaling · replicas manual (no replica auto scaling)"]
    ]},
    { h: "Recovery and limits", items: [
      "**EC2 recover**: `StatusCheckFailed_System` alarm + recover action (or simplified auto recovery) · keeps **ID, private IP, EIP, EBS** · same AZ · instance check → **reboot**",
      "**EFS replication** cross-Region, RPO ~minutes, destination **read-only until replication deleted**",
      "**Service Quotas** usage metrics + alarms · quota templates for new accounts · raise in DR Region",
      "**Cell-based architecture** + **shuffle sharding** = smaller blast radius"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["ECS tasks stuck PROVISIONING", "Capacity provider managed scaling"],
      ["Scale ECS on requests", "Target tracking ALBRequestCountPerTarget"],
      ["Baseline + cheap extra tasks", "Base FARGATE + weight FARGATE_SPOT"],
      ["EKS pods Pending", "Karpenter / Cluster Autoscaler"],
      ["EKS pods on queue length", "KEDA"],
      ["Lambda 429 at peak", "Concurrency quota increase"],
      ["Cold starts", "Provisioned concurrency (alias)"],
      ["Lambda overloads RDS", "Max concurrency + RDS Proxy"],
      ["Stop Lambda now", "Reserved concurrency 0"],
      ["Async throttled events", "Retried 6 h → DLQ"],
      ["Free vs paid API tiers", "Usage plans + API keys"],
      ["DynamoDB viral spikes", "On-demand"],
      ["One key throttled", "Write sharding / key design"],
      ["Table throttled, spare capacity", "GSI capacity"],
      ["Aurora readers busy at month-end", "Aurora Replica auto scaling"],
      ["Unpredictable relational load", "Aurora Serverless v2"],
      ["Single EC2 keep IP on hardware fail", "EC2 recover action"],
      ["EFS DR to another Region", "EFS replication, delete to fail over"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d4", topic: "CloudWatch Metrics",
  sections: [
    { h: "Basics and retention", items: [
      "Namespace (custom can't start `AWS/`) · metric · **dimensions ≤ 30** · **each unique combination = separate billed metric** · Regional",
      "Retention: **< 60 s → 3 h** · **1 min → 15 days** · **5 min → 63 days** · **1 h → 15 months** · metrics **can't be deleted**",
      "EC2 basic **5 min** (free) · detailed **1 min** (paid) · **no memory / disk** without the agent",
      "Statistics: Avg, Sum, Min, Max, SampleCount, **percentiles** (need raw values), trimmed mean"
    ]},
    { h: "Getting custom metrics", table: [
      ["Method", "Use"],
      ["**PutMetricData**", "Apps / scripts · statistic sets · timestamps −2 weeks / +2 h"],
      ["**CloudWatch agent**", "**Memory, disk**, procstat, StatsD / collectd → **CWAgent** · config in **Parameter Store**, deploy with **State Manager**"],
      ["**EMF**", "JSON logs → metrics, no API calls · **Lambda** / containers"],
      ["**Metric filters**", "Log patterns → metrics · **new events only**"],
      ["**High resolution**", "`StorageResolution=1` · custom only · 1 s data **3 h** · alarms **10 / 30 s**"]
    ]},
    { h: "Metric math, Insights, anomaly detection", items: [
      "**Metric math**: `100*m1/m2` error rate, `FILL`, `SUM(METRICS())`, `RATE`, `IF` · **alarm on expressions** (≤ 10 metrics)",
      "**SEARCH** = dynamic graphs (new instances) · **can't alarm on SEARCH** → **Metrics Insights** SQL query alarm (top-N, changing fleets)",
      "**Anomaly detection**: ML band with **seasonality**, width in **std devs** (default 2) · above / below / outside · **exclude time ranges** · works on metric math",
      "Noisy → wider band + **M-of-N** · missing data: missing / notBreaching / breaching / ignore · composite alarms"
    ]},
    { h: "Dashboards and cross-account", items: [
      "Dashboards **global, multi-Region** · widgets: line, number, gauge, text, **alarm status**, **Logs Insights**, custom",
      "**Variables** (one dashboard, many resources) · **as code**: `PutDashboard`, **`AWS::CloudWatch::Dashboard`** · **3 free**",
      "**Share**: emails (Cognito), **SSO**, public link - no IAM users",
      "**Cross-account observability (OAM)**: monitoring account **sink** + source **links** · metrics, logs, **traces**, App Signals · **StackSets** auto-deploy · **per Region**",
      "Legacy: cross-account cross-Region console (`CloudWatch-CrossAccountSharingRole`)",
      "**Metric streams** → **Data Firehose** → S3 / Datadog / Splunk · JSON / **OpenTelemetry** · filter namespaces · replaces polling GetMetricData"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Memory / disk on EC2", "CloudWatch agent"],
      ["Agent on 2,000 instances + new", "Parameter Store + State Manager"],
      ["Alarm within 10-20 s", "High-res metric + 10 s alarm"],
      ["1 s data from last week", "Gone after 3 h → metric stream to S3"],
      ["5-minute data retention", "63 days"],
      ["Lambda PutMetricData throttled", "EMF"],
      ["Bill jumped after new dimension", "High cardinality"],
      ["Metric filter missing old errors", "Not retroactive"],
      ["Error rate alarm, no new metric", "Metric math alarm"],
      ["Graph includes new instances", "SEARCH / Metrics Insights"],
      ["Alarm on changing fleet max", "Metrics Insights query alarm"],
      ["Daily / weekly pattern", "Anomaly detection"],
      ["Model learned a load test", "Exclude time range"],
      ["Noisy anomaly alarm", "Wider band + M-of-N"],
      ["Dashboard in every account, reviewed", "AWS::CloudWatch::Dashboard"],
      ["Two Regions on one dashboard", "Dashboards are global"],
      ["Viewers without AWS accounts", "Share via email / SSO"],
      ["Central monitoring, 200 accounts", "Cross-account observability (OAM)"],
      ["Works in one Region only", "OAM is Regional"],
      ["Metrics to Splunk / Datadog", "Metric streams"],
      ["One dashboard, pick the service", "Dashboard variables"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d4", topic: "CloudWatch Alarms",
  sections: [
    { h: "Types, states, evaluation", items: [
      "Types: **static**, **anomaly detection**, **metric math** (≤ 10 metrics), **Metrics Insights**, **composite**",
      "States **OK / ALARM / INSUFFICIENT_DATA** · actions on each (OK action = resolved)",
      "Period (10 / 30 s high-res or × 60 s) · **M out of N** datapoints stops flapping · p99 for latency",
      "Missing data: **missing** (default) · **notBreaching** = error-only metrics · **breaching** = heartbeats · **ignore** = keep state"
    ]},
    { h: "Actions", table: [
      ["Action", "Remember"],
      ["**SNS**", "Email, SMS, Lambda, SQS, HTTPS, chat (Q Developer) · encrypted topic → KMS policy allows **cloudwatch.amazonaws.com**"],
      ["**Lambda**", "Direct action · resource policy for `lambda.alarms.cloudwatch.amazonaws.com`"],
      ["**EC2 stop / terminate**", "Idle instances (cost) · per-instance metric"],
      ["**EC2 reboot**", "**StatusCheckFailed_Instance** (OS problem)"],
      ["**EC2 recover**", "**StatusCheckFailed_System** (host) · keeps **ID, private IP, EIP, EBS** · instance store lost"],
      ["**Auto Scaling**", "Step / simple policies · **don't edit target tracking alarms** · ASG instances → ASG replaces"],
      ["**OpsItem**", "OpsCenter work item, severity, runbooks"],
      ["**Incident Manager**", "Response plan: page, escalate, chat, runbook"],
      ["**EventBridge**", "Every state change → any target (**SSM Automation**, Step Functions)"]
    ]},
    { h: "Composite alarms", items: [
      "Rule: `ALARM(\"a\") AND (ALARM(\"b\") OR ALARM(\"c\"))` · OK(), INSUFFICIENT_DATA(), NOT, TRUE / FALSE · nesting",
      "**Children have no actions** → one meaningful page (alert fatigue)",
      "**Actions suppressor** alarm + wait / extension period → maintenance windows, parent outage",
      "Actions: **SNS, Lambda, SSM only** - **no EC2 / Auto Scaling**",
      "IaC: `AWS::CloudWatch::Alarm` · `AWS::CloudWatch::CompositeAlarm`"
    ]},
    { h: "Operations", items: [
      "**Regional** · **billing** (`EstimatedCharges`) and **Route 53 health check** alarms in **us-east-1**",
      "**set-alarm-state** = safe test · **disable-alarm-actions** = mute · history **30 days** → archive EventBridge events",
      "High-res and anomaly alarms cost more · recommended alarms per service",
      "Alarms drive **CodeDeploy**, **CloudFormation rollback triggers**, **AppConfig**, **ECS**, instance refresh rollbacks, **FIS stop conditions**, Route 53 alarm health checks"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Error-only metric, INSUFFICIENT_DATA", "notBreaching"],
      ["Heartbeat stopped, no alarm", "breaching"],
      ["Short spikes page on-call", "M out of N"],
      ["Host hardware failure, keep IP", "System check + recover"],
      ["OS kernel hang", "Instance check + reboot"],
      ["Stop idle instances", "EC2 stop action"],
      ["ASG instance unhealthy", "ASG ELB health check"],
      ["Deleted target tracking alarms", "Recreate the policy"],
      ["40 alerts for one outage", "Composite alarm"],
      ["Quiet during maintenance", "Actions suppressor"],
      ["Composite can't scale ASG", "SNS / Lambda / SSM only"],
      ["Multi-step remediation", "EventBridge → SSM Automation"],
      ["Page, escalate, chat, runbook", "Incident Manager"],
      ["Trackable work item", "OpsItem"],
      ["Encrypted SNS gets nothing", "KMS key policy for CloudWatch"],
      ["Billing alarm not found", "us-east-1 + billing alerts"],
      ["Route 53 health check alarm", "us-east-1"],
      ["Test actions safely", "set-alarm-state"],
      ["12 months of alarm history", "Archive EventBridge events"],
      ["Lambda action fails", "Lambda resource policy"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d4", topic: "CloudWatch Agent",
  sections: [
    { h: "What it is", items: [
      "**Unified agent** = metrics + logs (+ traces) · **EC2 and on-prem** · Linux, Windows, macOS · replaces **awslogs** (deprecated)",
      "Only way to get **memory, disk %, swap, processes, log files** · namespace **`CWAgent`**",
      "Collects: `mem_used_percent`, `disk used_percent`, cpu per core, **procstat** (`pid_count`), **StatsD (UDP 8125)** / collectd, **Windows Event Logs** + perf counters",
      "EKS: **CloudWatch Observability add-on** (DaemonSet) → Container Insights · Lambda → Lambda Insights, not the agent"
    ]},
    { h: "IAM and config", table: [
      ["Item", "Remember"],
      ["**CloudWatchAgentServerPolicy**", "Whole fleet · publish metrics / logs · read **`AmazonCloudWatch-*`** parameters"],
      ["**CloudWatchAgentAdminPolicy**", "Only the wizard instance (**ssm:PutParameter**)"],
      ["`AmazonSSMManagedInstanceCore`", "SSM install / configure"],
      ["**append / aggregation dimensions**", "**AutoScalingGroupName** → scale ASG on memory (custom metric target tracking)"],
      ["`resources`, interval", "Limit cores / disks / processes · 60 s default (1–10 s = high-res, cost)"],
      ["Logs", "`file_path`, `{instance_id}` streams, **`retention_in_days`** (default never), **`multi_line_start_pattern`**, regex `filters`, `windows_events`"],
      ["`run_as_user`", "Must read the log files"]
    ]},
    { h: "Fleet rollout", items: [
      "Wizard once → **Parameter Store** `AmazonCloudWatch-linux` (prefix required)",
      "**`AWS-ConfigureAWSPackage`** (install) + **`AmazonCloudWatch-ManageAgent`** (configure) via **State Manager by tag** → new instances covered",
      "Run Command = one-off · golden AMI via **Image Builder** + fetch at boot · multi-account via Quick Setup / StackSets",
      "`amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:NAME` · **append-config** layers team configs · **re-fetch after parameter changes**",
      "On-prem: **hybrid activation / Roles Anywhere / profile** + **`-m onPremise`** + Region"
    ]},
    { h: "Troubleshooting", items: [
      "**AccessDenied** → role missing ServerPolicy / no instance profile",
      "Config won't load → parameter not **`AmazonCloudWatch-*`**, wrong Region",
      "**Private subnet** → VPC endpoints **monitoring + logs** (+ ssm, ssmmessages, ec2messages) or NAT",
      "One file missing → **run_as_user** permissions · split stack traces → **multi-line pattern**",
      "Bill jumped → cardinality (per-core / disk / process), short interval, no retention / filters",
      "Agent log: `/opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log` · `-a status`"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Memory + disk + log files", "Unified CloudWatch agent"],
      ["Fleet IAM policy", "CloudWatchAgentServerPolicy"],
      ["Config parameter access denied", "Prefix AmazonCloudWatch-"],
      ["New tagged instances configured", "State Manager associations"],
      ["Updated parameter, no change", "Re-run ManageAgent / fetch-config"],
      ["Scale ASG on memory", "ASG aggregation dimension + custom metric"],
      ["Private subnet, no data", "VPC endpoints monitoring + logs"],
      ["AccessDenied in agent log", "Add ServerPolicy"],
      ["Is nginx running?", "procstat pid_count"],
      ["Windows Security logs", "windows_events"],
      ["Stack traces split", "multi_line_start_pattern"],
      ["Two teams' configs", "append-config"],
      ["On-prem servers", "Hybrid activation / Roles Anywhere + onPremise"],
      ["Bill jumped", "Limit resources + 60 s interval"],
      ["Logs grow forever", "retention_in_days"],
      ["One log file missing", "run_as_user permissions"],
      ["Memory not in AWS/EC2", "CWAgent namespace"],
      ["Legacy StatsD app", "Agent StatsD listener"],
      ["Golden AMI", "Agent in image + fetch config at boot"],
      ["EKS Container Insights", "CloudWatch Observability add-on"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d4", topic: "CloudWatch Logs",
  sections: [
    { h: "Basics and retention", items: [
      "Log group (settings) → streams → events (**256 KB**) · retention **never expire** by default, **1 day – 10 years**",
      "KMS per log group → key policy allows **`logs.<region>.amazonaws.com`** · **Standard** vs **Infrequent Access** (cheaper, no metric filters / Live Tail)",
      "Cost: **ingestion per GB**, storage, **Insights per GB scanned**",
      "Retention at scale: Config **`cw-loggroup-retention-period-check`** · **EventBridge CreateLogGroup → Lambda / SSM** · IaC `RetentionInDays`"
    ]},
    { h: "Metric filters and subscription filters", table: [
      ["Feature", "Remember"],
      ["**Metric filter**", "Pattern (`ERROR`, `{ $.status = 500 }`, `[ip, ..., status=5*]`) → metric → alarm · **not retroactive** · **default value 0** · ≤ 3 dimensions (cardinality)"],
      ["CloudTrail security alarms", "Trail → CloudWatch Logs → metric filters (root login, AccessDenied, SG / IAM changes)"],
      ["**Subscription filter**", "Real time → **Lambda / Kinesis / Firehose** (OpenSearch via console) · **max 2** per log group · **base64 + gzip**"],
      ["**Account-level policy**", "`SUBSCRIPTION_FILTER_POLICY` covers **all log groups** incl. new ones"],
      ["Lambda", "Custom, small volume · resource policy for logs"],
      ["Kinesis Data Streams", "Many consumers, replay, fan-out"],
      ["**Firehose**", "No-code delivery to **S3, OpenSearch, Splunk**, Redshift, HTTP"]
    ]},
    { h: "Insights, export, extras", items: [
      "**Logs Insights**: `fields | filter | stats count(*) by bin(5m) | sort | limit`, `parse`, `pattern` · many groups / accounts · **past data** · narrow time range to save cost",
      "**Live Tail** (real time) · **Contributor Insights** (top N) · **log anomaly detection** · **data protection** (mask PII, `logs:Unmask`)",
      "**Export task**: batch, **up to 12 h**, **one at a time**, **same Region**, bucket policy for logs principal, SSE-KMS ok → one-off archive",
      "Continuous / near real time to S3 → **subscription → Firehose**"
    ]},
    { h: "Cross-account aggregation", items: [
      "**Copy**: central **Firehose / Kinesis** + role + **CloudWatch Logs destination** (access policy for org `aws:PrincipalOrgID`) ← source subscription / **account policy** via **StackSets** · **destinations are Regional**",
      "→ central **S3** (Object Lock, lifecycle, Athena) or **Splunk / OpenSearch**",
      "**View without copy**: **OAM** cross-account observability (Insights, Live Tail, alarms on source logs)",
      "Newer: org **log centralization rules** · CloudTrail all accounts → **organization trail**"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Yesterday's errors, new filter empty", "Logs Insights"],
      ["Error alarm INSUFFICIENT_DATA", "Default value 0"],
      ["Storage cost keeps growing", "Retention + auto-fix new groups"],
      ["Root login / unauthorized API alarms", "CloudTrail → metric filter"],
      ["userId dimension bill", "High cardinality"],
      ["Continuous to S3, no code", "Subscription → Firehose"],
      ["Archive last quarter once", "Export task"],
      ["Export access denied", "Bucket policy for logs principal"],
      ["Logs to Splunk", "Firehose"],
      ["Third consumer", "Kinesis fan-out (max 2 filters)"],
      ["Lambda can't parse", "base64 + gzip"],
      ["All log groups incl. new", "Account-level subscription policy"],
      ["300 accounts → immutable S3", "Destination + Firehose + StackSets"],
      ["Direct Kinesis ARN cross-account fails", "Logs destination"],
      ["Other Region can't subscribe", "Destinations are Regional"],
      ["Query all accounts, no copy", "OAM"],
      ["Errors per service per 5 min", "stats count(*) by bin(5m)"],
      ["Insights too expensive", "Narrow time range / groups"],
      ["Mask card numbers", "Data protection + logs:Unmask"],
      ["KMS log group write fails", "Key policy for logs principal"],
      ["Top 10 IPs causing 5xx", "Contributor Insights"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d4", topic: "Synthetics, RUM and Insights",
  sections: [
    { h: "Which tool", table: [
      ["Question says", "Answer"],
      ["Proactive, no traffic, test journeys", "**Synthetics canary**"],
      ["Real users, Web Vitals, JS errors, geo", "**RUM**"],
      ["ECS task / EKS pod CPU, memory, restarts", "**Container Insights**"],
      ["Lambda memory, CPU, cold starts", "**Lambda Insights**"],
      ["APM, service map, SLOs, no code", "**Application Signals**"],
      ["Single request trace", "**X-Ray**"],
      ["ISP / city internet problems", "**Internet Monitor**"],
      ["PromQL / Grafana", "**Managed Prometheus + Managed Grafana**"]
    ]},
    { h: "Synthetics and RUM", items: [
      "Canaries = scripts on **Lambda** (Node.js Puppeteer / Playwright, Python Selenium) · **min 1 minute**, cron, run once",
      "Blueprints: **heartbeat**, **API**, **broken link**, **visual monitoring** (baseline), recorder, **workflow builder**",
      "`CloudWatchSynthetics` **SuccessPercent** → alarm → SNS / **CodeDeploy rollback** · artifacts (screenshots, HAR, logs) in **S3** · active X-Ray",
      "**VPC canary** → NAT or **VPC endpoints** (S3, CloudWatch, Logs) · creds in **Secrets Manager** · **runtime deprecation** · multi-Region",
      "**RUM**: JS snippet, **app monitor**, **Cognito identity pool** (`rum:PutRumEvents`) · LCP / INP / CLS, JS / HTTP errors, geo · **session sample rate** · **30 days** → CloudWatch Logs for longer · X-Ray link"
    ]},
    { h: "Container and Lambda Insights", items: [
      "**ECS**: cluster setting `containerInsights` = enabled / **enhanced** · **no agent**, Fargate ok · account default = **new clusters only**",
      "**EKS**: **CloudWatch Observability add-on** (agent DaemonSet + Fluent Bit) · node / pod / container, restarts · EKS Fargate via ADOT",
      "Namespaces `ECS/ContainerInsights`, `ContainerInsights` · Prometheus scraping",
      "**Lambda Insights**: **extension layer** + **`CloudWatchLambdaInsightsExecutionRolePolicy`** · memory used, CPU, **init duration** · `LambdaInsights` namespace · **no traces**"
    ]},
    { h: "Application Signals", items: [
      "Auto-instrumented **APM** with **ADOT** (Java, Python, .NET, Node.js) on EKS, ECS, EC2, Lambda · **no code changes**",
      "Per service / operation: **volume, availability, latency, faults (5xx), errors (4xx)** · **application map** of dependencies",
      "**SLOs**: attainment, **error budget**, **burn-rate alarms** · links to X-Ray traces, logs, canaries, RUM · replaces ServiceLens"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Checkout broken at night", "Canary every minute"],
      ["Real users by browser / country", "RUM"],
      ["VPC canary no artifacts", "NAT / VPC endpoints"],
      ["Canary login password", "Secrets Manager"],
      ["Layout broke with HTTP 200", "Visual monitoring"],
      ["Rollback if journey fails", "Canary alarm in CodeDeploy"],
      ["Canary every 10 s", "Min 1 minute"],
      ["Old canaries failing", "Runtime deprecated"],
      ["RUM no data", "Cognito identity pool"],
      ["RUM cost", "Session sample rate"],
      ["RUM 12 months", "CloudWatch Logs delivery"],
      ["Fargate task metrics", "Container Insights setting"],
      ["Old cluster no data after default", "Update existing cluster"],
      ["EKS pods + logs", "Observability add-on"],
      ["PromQL dashboards", "AMP + Grafana"],
      ["Lambda over-provisioned", "Lambda Insights"],
      ["Layer added, no data", "Execution role policy"],
      ["99.9% per operation + error budget", "Application Signals SLO"],
      ["Dependency map, no code", "Application Signals"],
      ["ISP problem", "Internet Monitor"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d4", topic: "X-Ray and ADOT",
  sections: [
    { h: "Concepts", items: [
      "**Trace** (header **`X-Amzn-Trace-Id`**) → **segments** (per service) → **subsegments** (AWS SDK, HTTP, SQL)",
      "**Annotations = indexed, searchable** (≤ 50) · **metadata = not indexed** · error 4xx · fault 5xx · throttle 429 · kept **30 days** · KMS optional",
      "Trace map · **filter expressions** (`service(\"x\") { fault = true }`, `annotation.tier = \"gold\"`, `responsetime > 3`)",
      "**Groups** → own map + CloudWatch metrics → alarms · **Insights** → anomalies → **EventBridge** · Transaction Search (100% spans) · **OAM** cross-account"
    ]},
    { h: "Instrumenting", table: [
      ["Service", "How"],
      ["**Lambda**", "**Active tracing** + **`AWSXRayDaemonWriteAccess`** · daemon built in"],
      ["**API Gateway**", "**Stage** X-Ray tracing"],
      ["EC2 / on-prem", "SDK / ADOT + **daemon** (or CloudWatch agent / ADOT collector) + role"],
      ["**ECS**", "Daemon / ADOT **sidecar** · task role · localhost:2000 (awsvpc)"],
      ["**EKS**", "DaemonSet or **ADOT / Observability add-on**"],
      ["**Beanstalk**", "**`XRayEnabled: true`** option"],
      ["Step Functions / SNS / SQS", "Enable tracing / propagate header"],
      ["**ALB**", "Only **adds the header**, no segments"]
    ]},
    { h: "Sampling and daemon", items: [
      "Default: **first request per second (reservoir 1) + 5%**",
      "**Centralized rules** (priority, reservoir, fixed rate, service, host, method, URL path, ARN) → **no redeploy** · e.g. 0% `/health`, 100% `POST /checkout`",
      "**First service decides**, downstream follows `Sampled` flag",
      "Daemon: **UDP 2000**, buffers / batches → `PutTraceSegments`, pulls sampling rules · **`AWS_XRAY_DAEMON_ADDRESS`** · needs **AWSXRayDaemonWriteAccess**",
      "No traces → IAM, daemon / UDP, active tracing off, not instrumented, sampling, **X-Ray VPC endpoint**"
    ]},
    { h: "ADOT (OpenTelemetry)", items: [
      "AWS-supported **OpenTelemetry**: **vendor-neutral** traces, metrics, logs · X-Ray SDK / daemon heading to **maintenance**",
      "**Auto-instrumentation agents** (Java, Python, .NET, Node.js) · **ADOT Collector** · **Lambda layer** · **OTLP**",
      "Exporters: **X-Ray**, **CloudWatch (EMF)**, **Managed Prometheus**, **third parties** → instrument once, many backends",
      "Deploy: **EKS add-on**, ECS sidecar, EC2 · scrapes Prometheus · powers **Application Signals**"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Which service adds latency", "X-Ray trace map"],
      ["Search by customer ID", "Annotations"],
      ["Lambda no traces", "Active tracing + write policy"],
      ["Daemon AccessDenied", "AWSXRayDaemonWriteAccess"],
      ["Daemon port", "UDP 2000"],
      ["ECS tracing", "Sidecar + task role"],
      ["Daemon at another address", "AWS_XRAY_DAEMON_ADDRESS"],
      ["Beanstalk tracing", "XRayEnabled"],
      ["API Gateway missing from map", "Stage tracing"],
      ["ALB not a node", "Only adds header"],
      ["Default sampling", "1/s + 5%"],
      ["Exclude /health, no redeploy", "Centralized sampling rules"],
      ["Downstream sampling", "Follows upstream"],
      ["Alarm on checkout faults only", "X-Ray group"],
      ["Auto anomaly alerts", "X-Ray Insights"],
      ["4xx / 5xx / 429", "Error / fault / throttle"],
      ["X-Ray + third party, no double code", "ADOT"],
      ["Java tracing, no code", "ADOT Java agent"],
      ["Traces + Prometheus on EKS", "ADOT Collector add-on"],
      ["Private subnet no traces", "X-Ray VPC endpoint"],
      ["Central trace view", "OAM"]
    ]}
  ]
});

window.CHEATSHEETS.push({
  domain: "d4", topic: "CloudTrail",
  sections: [
    { h: "History, trails, Lake", items: [
      "**Event history**: free, **90 days**, **management only**, per Region",
      "**Trail** → **S3** (gzip JSON ~5 min) + optional **CloudWatch Logs** (role) + **SNS per log file**",
      "**Multi-Region** (incl. new Regions) · **global events (IAM, STS, CloudFront) in us-east-1**",
      "**Organization trail** (management / delegated admin, trusted access) · all accounts incl. new · **members can't change it**",
      "**Bucket policy** for `cloudtrail.amazonaws.com` · **SSE-KMS**: key policy allows CloudTrail, readers need **kms:Decrypt**"
    ]},
    { h: "Event types", table: [
      ["Type", "Remember"],
      ["**Management**", "Control plane, read / write · **on** · **first copy free** · exclude **KMS** / RDS Data API noise"],
      ["**Data**", "**S3 objects**, **Lambda Invoke**, **DynamoDB items** … · **off**, per event · **advanced selectors** (ARN, eventName, readOnly)"],
      ["**Network activity**", "API calls via **VPC endpoints**, incl. **denied** by endpoint policy"],
      ["**Insights**", "Unusual **call rate / error rate** on write management events · baseline ~36 h · → EventBridge"]
    ]},
    { h: "Integrity and protection", items: [
      "**Log file validation**: hourly **SHA-256 + RSA** digests · **`aws cloudtrail validate-logs`** · **detects**, doesn't prevent",
      "Prevent: org trail · **Log Archive account** · **Object Lock / MFA Delete** · bucket policy deny delete · **SCP deny StopLogging / DeleteTrail / UpdateTrail / PutEventSelectors**",
      "Config rules: `cloudtrail-enabled`, **`multi-region-cloudtrail-enabled`**, **`cloud-trail-log-file-validation-enabled`**"
    ]},
    { h: "React and query", items: [
      "**CIS alarms**: trail → CloudWatch Logs → **metric filters** (root login, AccessDenied, IAM / SG / NACL / CloudTrail changes) → alarms",
      "**EventBridge** `AWS API Call via CloudTrail` + eventName → **Lambda / SSM** revert (e.g. SSH 0.0.0.0/0) · data events need the trail to log them",
      "CloudTrail = **who** · Config = **state / compliance**",
      "**Athena** on S3 (partition projection, cheap) vs **CloudTrail Lake** (managed SQL event data stores, **org**, **Config items**, **non-AWS events**, up to ~10 yrs, immutable, NL queries)"
    ]},
    { h: "Pick the answer", table: [
      ["The question says", "Answer"],
      ["Who terminated it 45 days ago", "Event history (90 days)"],
      ["Who downloaded S3 objects", "S3 data events"],
      ["All accounts, can't disable", "Organization trail"],
      ["Prove logs unaltered", "Log file validation + validate-logs"],
      ["Prevent log deletion", "Log archive acct + Object Lock + SCP"],
      ["Trail can't write to S3", "Bucket policy for CloudTrail"],
      ["SSE-KMS trail issues", "Key policy + kms:Decrypt"],
      ["Activity in other Regions missed", "Multi-Region trail"],
      ["IAM events location", "us-east-1 (global)"],
      ["Root login alarm", "Metric filter → alarm"],
      ["Revert SSH 0.0.0.0/0 in seconds", "EventBridge → Lambda / SSM"],
      ["API call spike, no threshold", "CloudTrail Insights"],
      ["Data event cost", "Advanced event selectors"],
      ["KMS Decrypt noise", "Exclude KMS events"],
      ["Second trail charges", "Only first copy free"],
      ["7 yrs SQL + Config items", "CloudTrail Lake"],
      ["On-prem / SaaS audit events", "Lake integrations"],
      ["SG rules last Tuesday", "AWS Config"],
      ["Calls via VPC endpoint", "Network activity events"],
      ["SNS for every call", "EventBridge (SNS is per file)"],
      ["Config checks CloudTrail", "multi-region + validation rules"]
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

// Domain 2 master sheet: placed first among the Domain 2 cheat sheets.
(function () {
  const sheet = {
  domain: "d2", topic: "Domain 2 Master Sheet",
  sections: [
    { h: "How to pick the answer", items: [
      "Domain 2 = **17%** · **2.1** IaC + reusable components · **2.2** multi-account / multi-Region automation · **2.3** automation at scale (SSM, Config, AppConfig, Service Catalog)",
      "**Prevent** = SCP / IAM / proactive Hooks · **detect** = Config rules · **fix** = SSM Automation remediation",
      "**Push to every account** = StackSets / Control Tower / CfCT · **self-service pull** = Service Catalog",
      "**All accounts incl. new ones** = service-managed StackSets auto-deploy, org conformance packs, org aggregator, RAM OU sharing, delegated admin auto-enable",
      "**Keep people out of the management account** = delegated administrator"
    ]},
    { h: "Services in one line", table: [
      ["Service", "Remember"],
      ["**CloudFormation**", "Params (SSM types), Mappings, Conditions, Outputs/Exports (same acct + Region), dynamic refs, service role"],
      ["**Change control**", "Change sets · drift · stack policy · termination protection · DeletionPolicy / UpdateReplacePolicy"],
      ["**Nested / cross-stack**", "Nested = together, > 500 resources · Exports = independent lifecycle · modules = same stack"],
      ["**Helper scripts**", "cfn-init · cfn-signal → CreationPolicy / WaitCondition · cfn-hup (15 min) · UpdatePolicy rolling / replacing"],
      ["**Extending**", "Custom resource (respond or 1 h hang) · macros (AUTO_EXPAND) · Registry · Hooks (proactive)"],
      ["**Rollback**", "ROLLBACK_COMPLETE → delete · UPDATE_ROLLBACK_FAILED → continue-update-rollback · triggers 5 alarms / 180 min"],
      ["**StackSets**", "Self-managed (roles, any account) vs service-managed (OUs, auto-deploy, no mgmt account, --call-as)"],
      ["**CDK**", "synth / diff / deploy · bootstrap + --trust · L1/L2/L3 · logical ID trap · CDK Pipelines self-mutation"],
      ["**SAM**", "Transform · build / package / deploy · sam local (Docker) · AutoPublishAlias + DeploymentPreference"],
      ["**Systems Manager**", "Run Command (now) · State Manager (always) · Patch Manager · Session Manager · Parameter Store · Automation"],
      ["**AppConfig**", "Flags without redeploy · validators before · strategies + bake · alarm rollback · agent :2772"],
      ["**Organizations**", "SCPs never grant, not mgmt account · aws:PrincipalOrgID · RCP · consolidated billing · delegated admin"],
      ["**Control Tower**", "Landing zone (Log Archive + Audit) · preventive / detective / proactive controls · Account Factory, AFT, CfCT"],
      ["**Service Catalog**", "Portfolio + product + launch constraint · template constraint · TagOptions · hub and spoke"],
      ["**Config**", "Regional recorder · managed / Lambda / Guard rules · SSM remediation · conformance packs · read-only aggregator"],
      ["**Tagging**", "aws:RequestTag requires · tag policy standardises (not required) · cost allocation tags in mgmt · ABAC"],
      ["**RAM**", "Share subnets / TGW / Resolver rules / prefix lists · org sharing to OU · VPC sharing same org"],
      ["**Extras**", "OpsWorks EOL → SSM State Manager · Scheduler / Lambda / Step Functions / SSM Automation · CFN Git sync · IaC generator"]
    ]},
    { h: "Keywords: CloudFormation", table: [
      ["The question says", "Answer"],
      ["Latest AMI, no template edits", "SSM public parameter type"],
      ["Secret in template", "Dynamic reference"],
      ["Independent stacks share VPC ID", "Export + ImportValue"],
      ["Reusable, > 500 resources", "Nested stacks"],
      ["Preview replacement", "Change set"],
      ["Manual changes", "Drift detection"],
      ["Protect DB from replacement", "Stack policy"],
      ["Keep data on delete / replace", "DeletionPolicy / UpdateReplacePolicy"],
      ["Wait until app installed", "CreationPolicy + cfn-signal"],
      ["Apply metadata changes", "cfn-hup"],
      ["Timed out waiting for signals", "cfn-signal not sent"],
      ["Call API during deploy", "Custom resource"],
      ["Custom resource hangs 1 h", "No response sent"],
      ["CAPABILITY_AUTO_EXPAND", "Macro / SAM"],
      ["Block bad resources before create", "Hooks"],
      ["ROLLBACK_COMPLETE", "Delete and recreate"],
      ["UPDATE_ROLLBACK_FAILED", "continue-update-rollback"],
      ["Roll back on alarm after deploy", "Rollback triggers"]
    ]},
    { h: "Keywords: StackSets, CDK, SAM", table: [
      ["The question says", "Answer"],
      ["Many accounts + Regions", "StackSets"],
      ["New OU accounts automatically", "Service-managed auto-deploy"],
      ["Outside org / mgmt account", "Self-managed StackSet"],
      ["Delegated admin not found", "--call-as DELEGATED_ADMIN"],
      ["Exclude one account", "AccountFilterType DIFFERENCE"],
      ["OperationInProgressException", "Managed execution"],
      ["IAM role fails 2nd Region", "Deploy IAM in one Region"],
      ["Programming language + tests", "CDK"],
      ["Bootstrap version not found", "cdk bootstrap"],
      ["CDK cross-account deploy fails", "--trust + crossAccountKeys"],
      ["Renamed construct replaced", "overrideLogicalId"],
      ["fromLookup fails", "Set env"],
      ["Pipeline updates itself", "CDK Pipelines"],
      ["Serverless + local test", "SAM"],
      ["Local API / SDK tests", "start-api :3000 / start-lambda :3001"],
      ["Native deps fail", "sam build --use-container"],
      ["Lambda canary", "AutoPublishAlias + DeploymentPreference"]
    ]},
    { h: "Keywords: SSM and AppConfig", table: [
      ["The question says", "Answer"],
      ["Instance not managed", "Agent + profile + endpoints"],
      ["No NAT", "ssm / ssmmessages / ec2messages endpoints"],
      ["No instance profiles", "DHMC"],
      ["On-prem", "Hybrid activation"],
      ["Run now, 10% at a time", "Run Command"],
      ["Always, incl. new instances", "State Manager"],
      ["Patch delays prod / dev", "Baselines + Patch Group + windows"],
      ["Report patches only", "Scan"],
      ["Software across accounts SQL", "Inventory + Data Sync + Athena"],
      ["No bastion, audit", "Session Manager + logging"],
      ["Laptop → private RDS", "Port forwarding remote host"],
      ["SecureString denied", "kms:Decrypt"],
      ["> 4 KB / expiry", "Advanced parameter"],
      ["Rotation", "Secrets Manager"],
      ["Runbook approval", "aws:approve"],
      ["RDP without 3389", "Fleet Manager"],
      ["Flags without redeploy", "AppConfig"],
      ["Validate config first", "JSON Schema / Lambda validator"],
      ["Config rollback on alarm", "Monitors + bake time"],
      ["Lambda reads config cheaply", "Extension :2772"]
    ]},
    { h: "Keywords: Organizations, Control Tower, Service Catalog", table: [
      ["The question says", "Answer"],
      ["Prevent in all accounts", "SCP deny"],
      ["Mgmt account not blocked", "SCPs don't apply"],
      ["Region lock breaks IAM", "NotAction global services"],
      ["Invited account role missing", "Create OrganizationAccountAccessRole"],
      ["Bucket for all org accounts", "aws:PrincipalOrgID"],
      ["Outside access despite bad policy", "RCP"],
      ["Keep RIs in one account", "Turn off RI / SP sharing"],
      ["Security admin not mgmt", "Delegated admin"],
      ["Best-practice landing zone", "Control Tower"],
      ["Block / report / before CFN", "Preventive / detective / proactive"],
      ["Enroll fails", "AWSControlTowerExecution / Config recorder"],
      ["Account moved, drift", "Update / re-enroll / repair"],
      ["Terraform vending", "AFT"],
      ["CFN + SCPs for new accounts", "CfCT"],
      ["After CT creates account", "CreateManagedAccount event"],
      ["Self-service, no service perms", "Service Catalog launch constraint"],
      ["Limit instance types", "Template constraint"],
      ["Shared portfolio role", "LocalRoleName"],
      ["Restart without EC2 perms", "Service actions"]
    ]},
    { h: "Keywords: Config, tagging, RAM", table: [
      ["The question says", "Answer"],
      ["Looked like / who changed", "Config timeline / CloudTrail"],
      ["Open SSH", "restricted-ssh"],
      ["External data check", "Custom Lambda rule"],
      ["No-Lambda check", "Guard rule"],
      ["Auto-fix", "Remediation + SSM Automation"],
      ["Remediation fails", "AutomationAssumeRole"],
      ["Alert only NON_COMPLIANT", "EventBridge filter"],
      ["Rule set in all accounts", "Org conformance pack"],
      ["Central view incl. new", "Org aggregator (read-only)"],
      ["Security Hub empty", "Enable Config"],
      ["Require tag", "SCP aws:RequestTag Null"],
      ["Standard case / values", "Tag policy"],
      ["Tags not in Cost Explorer", "Activate in mgmt account"],
      ["Team access at scale", "ABAC"],
      ["Run on app resources incl. new", "Tag-based resource group"],
      ["Launch into central VPC", "VPC sharing"],
      ["No invitations, new accounts", "RAM org sharing to OU"],
      ["Org-wide on-prem DNS", "Share Resolver rules"],
      ["Same CIDRs everywhere", "Shared prefix list"],
      ["Block external sharing", "SCP ram:RequestedAllowsExternalPrincipals"]
    ]},
    { h: "Keywords: extras", table: [
      ["The question says", "Answer"],
      ["New Chef / Ansible config mgmt", "SSM State Manager (OpsWorks EOL)"],
      ["OpsWorks event on join / leave", "Configure"],
      ["Scheduled API call, no code", "Scheduler universal target"],
      ["Job > 15 minutes", "Step Functions Standard"],
      ["Approval in workflow", ".waitForTaskToken / aws:approve"],
      ["Automation across accounts", "AssumeRole into each account"],
      ["SDK throttling / first page only", "Backoff + pagination"],
      ["Millions of S3 objects", "Distributed Map"],
      ["Stack on Git push, no pipeline", "CloudFormation Git sync"],
      ["ClickOps resources into IaC", "IaC generator + import / cdk migrate --from-scan"]
    ]},
    { h: "Numbers to remember", items: [
      "CFN **500** resources · template **1 MB** via S3 · **200** params / outputs / mappings",
      "CreationPolicy / WaitCondition **12 h** max · custom resource **1 h** wait · cfn-hup **15 min**",
      "Rollback triggers **5** alarms, **180** min · StackSets delegated admins **5**",
      "SCPs **5** per target, **5,120** chars · OU depth **5** · tags **50** (128 / 256)",
      "Config required-tags **6** keys · periodic 1 / 3 / 6 / 12 / 24 h",
      "Parameter Store **4 KB** / **8 KB** · Run Command console **2,500** chars",
      "Lambda **15 min** · Express **5 min** · Standard **1 year**",
      "AppConfig agent **:2772** · SAM local **:3000 / :3001** · RAM invitation **~7 days** · cost tags **24 h**"
    ]},
    { h: "Classic wrong answers", items: [
      "Tag policy requires tags ✗ (SCP aws:RequestTag) · Config rule prevents ✗ (SCP / Hooks) · aggregator remediates ✗",
      "SCP restricts mgmt account ✗ · SCP grants ✗ · service-managed StackSet to mgmt account ✗ · auto-deploy adds Regions ✗",
      "Parameter Store rotation ✗ · Run Command for future instances ✗ · baseline alone patches ✗ · edit predefined baseline ✗",
      "update-stack on ROLLBACK_COMPLETE ✗ · NoEcho encrypts ✗ · exports cross-Region ✗ · hotswap in prod ✗",
      "sam local enforces IAM ✗ · env vars for feature flags ✗ · CT detective auto-fixes ✗ · CT enables GuardDuty ✗",
      "Service Catalog pushes baselines ✗ · RAM for S3 / KMS ✗ · VPC sharing external ✗ · CreateAccount for CT automation ✗"
    ]}
  ]
  };
  const list = window.CHEATSHEETS;
  const i = list.findIndex(c => c.domain === "d2");
  if (i < 0) list.push(sheet); else list.splice(i, 0, sheet);
})();

// Domain 3 master sheet: placed first among the Domain 3 cheat sheets.
(function () {
  const sheet = {
  domain: "d3", topic: "Domain 3 Master Sheet",
  sections: [
    { h: "How to pick the answer", items: [
      "Domain 3 = **15%** · **3.1** high availability · **3.2** scalability · **3.3** automated recovery to meet RTO / RPO",
      "Read the **RTO / RPO** first → pick the **cheapest strategy that meets both**",
      "**HA** (Multi-AZ) ≠ **DR** (another Region) ≠ **backups** (corruption, deletion, ransomware) · **replication copies the damage**",
      "**Data plane over control plane**: ARC routing controls, pre-scaled capacity (static stability), Global Accelerator",
      "Least overhead = managed feature: target tracking, Aurora Global DB, DynamoDB global tables, AWS Backup, DRS, zonal autoshift"
    ]},
    { h: "DR strategies", table: [
      ["Strategy", "RPO / RTO", "DR Region"],
      ["**Backup & restore**", "Hours / hours · cheapest", "Backups + IaC"],
      ["**Pilot light**", "Minutes / tens of min", "Data live, compute off"],
      ["**Warm standby**", "Sec-min / minutes", "Small stack running → scale out"],
      ["**Active/active**", "~0 / ~0 · most expensive", "Full stacks serving"]
    ]},
    { h: "Services in one line", table: [
      ["Service", "Remember"],
      ["**Auto Scaling**", "Target tracking default · scheduled / predictive · lifecycle hooks (3600 s, complete-lifecycle-action) · warm pools · instance refresh + AutoRollback · ELB health check type"],
      ["**ELB**", "ALB L7 (routing, WAF, auth) · NLB L4 (static IP, source IP, PrivateLink) · GWLB appliances · deregistration 300 s · cross-zone ALB on / NLB off · 502 / 503 / 504"],
      ["**Route 53**", "Failover (primary health check) · weighted · latency · geolocation (default record) · geoproximity bias · alias at apex · alarm-based checks for private · low TTL"],
      ["**ARC / GA**", "Zonal shift / autoshift · routing controls (5 endpoints, safety rules) · readiness checks · Region switch · Global Accelerator seconds, no DNS cache"],
      ["**RDS / Aurora**", "Multi-AZ sync, not readable, auto 60–120 s · replicas async, manual promote · Aurora Global < 1 s, RTO < 1 min, switchover RPO 0, write forwarding"],
      ["**DynamoDB / S3**", "Global tables multi-active, last writer wins (MRSC strong) · PITR 35 d · CRR versioning both, new objects only (Batch Replication), RTC 15 min, MRAP"],
      ["**AWS Backup**", "Plans + tag assignment + vaults · copy cross-Region / cross-account (org + vault policy + shared CMK) · Vault Lock governance vs compliance (72 h) · air-gapped vault · Audit Manager · restore testing"],
      ["**DRS**", "Block-level replication of servers · RPO sec / RTO min · TCP 1500 · cheap staging · drill · PIT recovery · Failback Client · not for RDS / migration (MGN)"],
      ["**Decoupling**", "SQS buffer (visibility > processing, 6× Lambda timeout, DLQ maxReceiveCount) · FIFO per group · SNS fan-out · Kinesis order per key, replay, IteratorAge · Step Functions Retry / Catch / saga"],
      ["**Caching**", "CloudFront OAC, versioned files, origin groups (GET only), Origin Shield, ACM us-east-1 · ElastiCache Valkey / Redis HA vs Memcached · lazy vs write-through · DAX"],
      ["**FIS / Resilience Hub**", "Stop conditions (alarms) · safety lever · AZ Power Interruption / Cross-Region scenarios · Resilience Hub policy → assessment → recommendations · Hub assesses, FIS proves"],
      ["**Extras**", "ECS capacity providers + Service Auto Scaling · EKS HPA + Karpenter / KEDA · Lambda reserved (cap, 0 = off) vs provisioned (no cold starts) · API usage plans · DynamoDB on-demand, hot keys, GSI · Aurora replica auto scaling / Serverless v2 · EC2 recover action"]
    ]},
    { h: "Keywords: DR, scaling, ELB", table: [
      ["The question says", "Answer"],
      ["Lowest cost, hours", "Backup and restore"],
      ["Data live, no compute", "Pilot light"],
      ["Small prod copy running", "Warm standby"],
      ["Near-zero RTO / RPO", "Active/active"],
      ["Corruption replicated", "PITR + immutable backups"],
      ["DR launch hits limits", "Pre-raise quotas"],
      ["On-prem servers, RPO seconds", "AWS DRS"],
      ["Known peak", "Scheduled scaling"],
      ["Recurring pattern, scale ahead", "Predictive + target tracking"],
      ["Workers on queue", "Backlog per instance"],
      ["Script before traffic / logs before termination", "Lifecycle hooks"],
      ["Scale-out stuck 1 hour", "No complete-lifecycle-action"],
      ["Long boot, scale fast", "Warm pool"],
      ["ALB-unhealthy not replaced", "ASG ELB health check"],
      ["New AMI with rollback", "Instance refresh + alarms"],
      ["Static IP + path routing", "NLB → ALB / Global Accelerator"],
      ["Deploys slow 5 min", "Deregistration delay"],
      ["Sessions lost on scale-in", "External session store"]
    ]},
    { h: "Keywords: routing and data", table: [
      ["The question says", "Answer"],
      ["Active/passive Regions", "Failover routing + health check"],
      ["10% to new version", "Weighted"],
      ["Country must use one Region", "Geolocation + default"],
      ["Health check private resource", "CloudWatch alarm-based"],
      ["Checks always fail", "Allow checker IPs"],
      ["Failover in seconds, no DNS", "Global Accelerator"],
      ["Impaired AZ", "ARC zonal shift / autoshift"],
      ["Manual Region switch during outage", "ARC routing controls"],
      ["DR capacity parity", "ARC readiness checks"],
      ["AZ failure, same endpoint", "RDS Multi-AZ"],
      ["Cross-Region RDS, RPO seconds", "Cross-Region replica + promote"],
      ["Relational < 1 s, RTO < 1 min", "Aurora Global Database"],
      ["Planned move, no loss", "Aurora switchover"],
      ["Multi-Region read / write", "DynamoDB global tables"],
      ["Existing objects not replicated", "S3 Batch Replication"],
      ["Replication SLA 15 min", "S3 RTC"],
      ["KMS objects not replicating", "KMS replication + destination key"]
    ]},
    { h: "Keywords: backup, decoupling, caching, chaos", table: [
      ["The question says", "Answer"],
      ["New resources backed up", "Tag-based assignment"],
      ["Backups in another account", "Cross-account copy + vault policy"],
      ["EBS / RDS copy fails", "Share customer managed KMS key"],
      ["Even root can't delete", "Vault Lock compliance"],
      ["Prove backups restore", "Restore testing"],
      ["Test DR, replication continues", "DRS drill"],
      ["Message processed twice", "Raise visibility timeout"],
      ["Poison message", "DLQ + maxReceiveCount → redrive"],
      ["Order per customer", "SQS FIFO MessageGroupId"],
      ["Fan-out", "SNS → SQS"],
      ["Replay, many consumers", "Kinesis Data Streams"],
      ["Workflow with compensation", "Step Functions saga"],
      ["Old JS after deploy", "Versioned file names"],
      ["Backup origin on failure", "CloudFront origin group"],
      ["Repeated DB reads", "ElastiCache lazy + TTL"],
      ["µs DynamoDB reads", "DAX"],
      ["Stop experiment on impact", "FIS stop conditions"],
      ["Simulate AZ loss", "AZ Power Interruption"],
      ["Meets RTO / RPO?", "Resilience Hub assessment"]
    ]},
    { h: "Keywords: extras (containers, serverless, data)", table: [
      ["The question says", "Answer"],
      ["ECS tasks stuck PROVISIONING", "Capacity provider managed scaling"],
      ["EKS pods Pending", "Karpenter / Cluster Autoscaler"],
      ["Lambda 429 at peak", "Concurrency quota / reserved"],
      ["Cold starts", "Provisioned concurrency (alias)"],
      ["Lambda overloads RDS", "Max concurrency + RDS Proxy"],
      ["Per-customer API limits", "Usage plans + API keys"],
      ["DynamoDB viral spikes", "On-demand"],
      ["One key throttled", "Write sharding"],
      ["Table throttled, spare capacity", "GSI capacity"],
      ["Aurora readers busy", "Aurora Replica auto scaling"],
      ["Unpredictable relational load", "Aurora Serverless v2"],
      ["Single EC2 keep IP", "EC2 recover action"]
    ]},
    { h: "Numbers to remember", items: [
      "Hook heartbeat **3600 s** (≤ 48 h) · predictive **24 h** history · refresh min healthy **90%**, max **200%**",
      "ELB checks **30 s / 5 / 2** · deregistration **300 s** · ALB idle **60 s** · R53 healthy **> 18%**, multivalue **8**",
      "RDS Multi-AZ **60–120 s** · **15** replicas · Aurora **6 copies / 3 AZs**, Global **< 1 s** lag, RTO **< 1 min**",
      "PITR **35 d** · S3 RTC **15 min** · Backup cold storage **90 d** · Vault Lock cooling-off **72 h** · DRS TCP **1500**",
      "SQS visibility **30 s / 12 h**, retention **4 d / 14 d**, long poll **20 s**, FIFO **300 msg/s**, dedup **5 min**, Lambda **6×**",
      "Kinesis shard **1 MB/s / 1,000 rec in, 2 MB/s out**, retention **24 h → 365 d** · Step Functions **1 year / 5 min** · CloudFront TTL **24 h**",
      "Lambda **1,000** concurrency, async retry **6 h** · API Gateway **10,000 / 5,000** burst · DynamoDB partition **3,000 RCU / 1,000 WCU** · Fargate Spot **2 min**"
    ]},
    { h: "Classic wrong answers", items: [
      "Multi-AZ for Region DR ✗ · Multi-AZ standby serves reads ✗ · read replica auto-fails over ✗ · replication instead of backups ✗",
      "Health checks on private IPs ✗ (alarm-based) · CNAME at apex ✗ · simple routing with health checks ✗ · edit DNS in outage ✗ (ARC)",
      "ELB across Regions ✗ · EC2 termination protection stops scale-in ✗ · warm pool with Spot ✗ · sticky sessions for HA ✗",
      "CRR copies existing objects ✗ · version deletes replicate ✗ · governance lock stops root ✗ · share aws/ebs key ✗",
      "DRS for RDS / migration ✗ · SNS retains messages ✗ · Firehose replay ✗ · retention fixes duplicates ✗ · Lambda multi-hour ✗",
      "Origin group fails over POST ✗ · Memcached for HA ✗ · RDS Proxy caches ✗ · Resilience Hub injects faults ✗ · FIS without stop conditions ✗",
      "Raise ECS desired count with no capacity ✗ · HPA adds nodes ✗ · reserved concurrency removes cold starts ✗ · DynamoDB auto scaling for spikes ✗ · RDS replica auto scaling ✗ · recover action for OS hang ✗"
    ]}
  ]
  };
  const list = window.CHEATSHEETS;
  const i = list.findIndex(c => c.domain === "d3");
  if (i < 0) list.push(sheet); else list.splice(i, 0, sheet);
})();
