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
