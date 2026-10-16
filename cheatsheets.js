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
  }
];
