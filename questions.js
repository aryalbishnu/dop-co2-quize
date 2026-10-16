// DOP-C02 quiz question bank.
// To add questions: append objects to QUESTIONS below.
//   domain : must match a domain id in DOMAINS
//   topic  : must match a topic name listed under that domain
//   answer : array of correct option indexes (0-based). More than one = multiple-response question.
//   options: each has t (text) and why (why it is right / wrong)
//   tip    : one-line exam takeaway shown after answering

window.DOMAINS = [
  { id: "d1", name: "Domain 1: SDLC Automation", weight: 22,
    topics: ["CodeCommit", "CodeBuild", "CodeArtifact", "ECR", "CodePipeline", "CodeConnections", "CodeGuru", "CI/CD Concepts"] },
  { id: "d2", name: "Domain 2: Configuration Management & IaC", weight: 17, topics: [] },
  { id: "d3", name: "Domain 3: Resilient Cloud Solutions", weight: 15, topics: [] },
  { id: "d4", name: "Domain 4: Monitoring & Logging", weight: 15, topics: [] },
  { id: "d5", name: "Domain 5: Incident & Event Response", weight: 14, topics: [] },
  { id: "d6", name: "Domain 6: Security & Compliance", weight: 17, topics: [] }
];

window.QUESTIONS = [
  // ───────────────────────────── CodeCommit ─────────────────────────────
  {
    id: "cc-01", domain: "d1", topic: "CodeCommit",
    q: "A company uses IAM Identity Center (SSO) for all developer access. Developers have no IAM users. The security team forbids long-term credentials. Developers must clone and push to AWS CodeCommit repositories from their laptops. What should the DevOps engineer recommend?",
    options: [
      { t: "Generate HTTPS Git credentials for each developer in IAM.",
        why: "HTTPS Git credentials belong to an IAM user and are long-term static credentials. The developers have no IAM users, and long-term credentials are forbidden." },
      { t: "Have developers upload SSH public keys to IAM and clone over SSH.",
        why: "SSH keys are also attached to an IAM user. Federated SSO users don't have one." },
      { t: "Configure an AWS CLI SSO profile and clone using git-remote-codecommit (codecommit:: URLs).",
        why: "Correct. git-remote-codecommit uses the temporary credentials from the CLI profile (SSO or an assumed role), so no long-term credentials are needed." },
      { t: "Attach a repository policy that allows the SSO permission set role to access the repository.",
        why: "CodeCommit does not support resource-based (repository) policies. All access is controlled with IAM identity policies." }
    ],
    answer: [2],
    tip: "Federated, SSO, or cross-account users → git-remote-codecommit (or the CLI credential helper) with temporary credentials."
  },
  {
    id: "cc-02", domain: "d1", topic: "CodeCommit",
    q: "Junior developers must be able to push to any feature branch in a CodeCommit repository but must NOT be able to push directly to, merge into, or delete the main branch. Senior developers keep full access. Which solution meets these requirements?",
    options: [
      { t: "Attach an IAM policy to the junior developers' group that denies codecommit:GitPush, codecommit:DeleteBranch, codecommit:PutFile and codecommit:Merge* when codecommit:References equals refs/heads/main.",
        why: "Correct. The codecommit:References condition key limits the Deny to the main branch, so pushes to feature branches still work." },
      { t: "Add a resource-based policy to the repository that denies the junior group write access to main.",
        why: "CodeCommit repositories cannot have resource-based policies." },
      { t: "Create an approval rule template that requires two approvals for pull requests into main.",
        why: "Approval rules only control pull request merges. They do not stop someone pushing directly to main with git push." },
      { t: "Apply an SCP that denies codecommit:GitPush in the account.",
        why: "This blocks every push to every branch for everyone in the account, including seniors and feature branches." }
    ],
    answer: [0],
    tip: "Branch-level protection in CodeCommit = IAM Deny with the codecommit:References condition key."
  },
  {
    id: "cc-03", domain: "d1", topic: "CodeCommit",
    q: "A company has 25 CodeCommit repositories. For every repository, any pull request that targets the main branch must be approved by at least two members of the SeniorEngineers IAM role before it can be merged. New repositories are created regularly. Which approach has the LEAST operational overhead?",
    options: [
      { t: "Ask each pull request author to add an approval rule to the pull request when they open it.",
        why: "This is manual and easy to forget. Nothing enforces that the rule is added." },
      { t: "Create an approval rule template that requires 2 approvals from the SeniorEngineers approval pool for the main branch, and associate it with the repositories.",
        why: "Correct. An approval rule template is reusable. Once associated with a repository, it is automatically applied to every new pull request targeting the listed branches." },
      { t: "Write a Lambda function triggered by EventBridge that counts approvals and reverts merges without two approvals.",
        why: "Custom code that reacts after the merge has already happened. It works, but it is much more overhead and is not preventive." },
      { t: "Deny codecommit:MergePullRequestByFastForward to all users except SeniorEngineers.",
        why: "This limits who can merge but does not require two approvals." }
    ],
    answer: [1],
    tip: "\"Require N approvers across many repositories\" → approval rule templates."
  },
  {
    id: "cc-04", domain: "d1", topic: "CodeCommit",
    q: "Whenever a pull request is created or updated in a CodeCommit repository, the team wants unit tests to run automatically in CodeBuild, and the result to be posted as a comment on the pull request. What should the DevOps engineer configure?",
    options: [
      { t: "A CodeCommit repository trigger for 'All repository events' that starts the CodeBuild project.",
        why: "Triggers only fire on repository changes (push, create or delete a branch or tag). They do not fire on pull request events, and they can only target SNS or Lambda, not CodeBuild." },
      { t: "An Amazon EventBridge rule matching CodeCommit pullRequestCreated and pullRequestSourceBranchUpdated events that starts CodeBuild, plus a Lambda function on the build-state event that calls PostCommentForPullRequest.",
        why: "Correct. EventBridge receives all CodeCommit events, including pull request events, and can target CodeBuild directly. This is the AWS reference pattern for pull request validation." },
      { t: "A CodePipeline pipeline with the CodeCommit source action set to poll every minute.",
        why: "A pipeline source tracks a single branch, not pull requests. Polling is also the legacy change-detection method." },
      { t: "A CodeCommit notification rule that sends pull request events to an Amazon SNS email subscription.",
        why: "Notification rules are for telling people what happened. An email subscription runs no tests." }
    ],
    answer: [1],
    tip: "Pull request automation → EventBridge. Triggers can't see pull request events."
  },
  {
    id: "cc-05", domain: "d1", topic: "CodeCommit",
    q: "A team wants a Slack channel to receive a message whenever someone comments on, approves, or merges a pull request in their CodeCommit repository. The solution should require no custom code. What should the DevOps engineer do?",
    options: [
      { t: "Create a CodeCommit trigger that invokes a Lambda function that posts to a Slack webhook.",
        why: "This needs custom code, and triggers cannot see pull request comments, approvals, or merges." },
      { t: "Create a notification rule on the repository for pull request events, targeting a Slack channel configured in AWS Chatbot (Amazon Q Developer in chat applications).",
        why: "Correct. Notification rules natively cover pull request comments, approvals, and merges, and deliver to Slack through Chatbot without any code." },
      { t: "Create a CloudTrail trail with a CloudWatch Logs metric filter on MergePullRequest and an alarm that posts to Slack.",
        why: "Complex, misses comments and approvals, and CloudWatch alarms can't post to Slack directly." },
      { t: "Create an EventBridge rule that invokes a Lambda function that formats and sends Slack messages.",
        why: "It works, but it needs custom Lambda code. The requirement is no custom code." }
    ],
    answer: [1],
    tip: "Telling people (Slack, Teams, email) about repository activity → notification rules with Chatbot."
  },
  {
    id: "cc-06", domain: "d1", topic: "CodeCommit",
    q: "A CodeCommit repository lives in Account A. Developers who sign in to Account B need read and write access to it. The company wants to avoid creating IAM users in Account A. What is the MOST secure solution?",
    options: [
      { t: "Share the repository with Account B using AWS Resource Access Manager (RAM).",
        why: "CodeCommit repositories cannot be shared through AWS RAM." },
      { t: "Add a repository policy that allows the Account B principal.",
        why: "CodeCommit has no resource-based repository policies." },
      { t: "Create an IAM role in Account A that trusts Account B and has CodeCommit permissions on the repository. Allow the developers in Account B to sts:AssumeRole into it, and have them clone with git-remote-codecommit using that role profile.",
        why: "Correct. Cross-account access to CodeCommit always works by assuming a role. Developers get temporary credentials and no IAM users are created in Account A." },
      { t: "Create IAM users in Account A for each developer and give them HTTPS Git credentials.",
        why: "This goes against the requirement and creates long-term credentials that must be managed. It is less secure." }
    ],
    answer: [2],
    tip: "CodeCommit cross-account = a role in the repository's account plus AssumeRole. No repository policies, no RAM."
  },
  {
    id: "cc-07", domain: "d1", topic: "CodeCommit",
    multi: true,
    q: "A CodePipeline pipeline in a central Tools account must use a CodeCommit repository in a Dev account as its source. The pipeline's artifacts are stored in an S3 bucket in the Tools account. Which TWO actions are required? (Choose TWO.)",
    options: [
      { t: "Encrypt the artifact bucket with a customer-managed KMS key whose key policy allows the Dev account role to use it.",
        why: "Correct. The AWS-managed aws/s3 key cannot be shared across accounts, so cross-account pipelines need a customer-managed key." },
      { t: "Create an IAM role in the Dev account that the pipeline can assume, with CodeCommit read permissions and permission to write to the artifact bucket and use the KMS key.",
        why: "Correct. The pipeline assumes this role to pull the source from the Dev account and upload it as an artifact." },
      { t: "Turn on CodeCommit cross-account replication to copy the repository into the Tools account.",
        why: "CodeCommit has no built-in replication feature." },
      { t: "Keep the default AWS-managed aws/s3 key on the artifact bucket.",
        why: "The default key's policy can't be changed to allow another account, so the Dev role can't decrypt the artifacts." },
      { t: "Create a CodeCommit trigger in the Dev account that sends to an SNS topic in the Tools account.",
        why: "Not needed. Change detection is done with EventBridge (an event bus rule across accounts), and SNS doesn't start pipelines." }
    ],
    answer: [0, 1],
    tip: "Cross-account pipeline = a customer-managed KMS key + a cross-account role + a bucket policy."
  },
  {
    id: "cc-08", domain: "d1", topic: "CodeCommit",
    q: "The release branch of a CodeCommit repository was deleted yesterday. The security team needs to know which IAM principal deleted it and when. Where should the DevOps engineer look?",
    options: [
      { t: "AWS CloudTrail event history, filtering for the DeleteBranch event (or a GitPush that deletes the reference) on the repository.",
        why: "Correct. CloudTrail records CodeCommit API calls and Git operations, including who made them, from where, and when." },
      { t: "CloudWatch metrics for the repository.",
        why: "CodeCommit doesn't publish per-user actions as CloudWatch metrics. Metrics can't identify a principal." },
      { t: "The repository's notification rule history.",
        why: "Notification rules don't keep an audit history, and one may not have existed for branch events." },
      { t: "Run git reflog on the CodeCommit server.",
        why: "You cannot access CodeCommit's servers, and reflog doesn't record IAM identities." }
    ],
    answer: [0],
    tip: "\"Who did what\" questions → CloudTrail."
  },
  {
    id: "cc-09", domain: "d1", topic: "CodeCommit",
    q: "For disaster recovery, a company needs every push to a CodeCommit repository in us-east-1 to be copied automatically to a repository in us-west-2. What should the DevOps engineer implement?",
    options: [
      { t: "Turn on the CodeCommit cross-Region replication setting on the repository.",
        why: "No such setting exists. CodeCommit has no native replication." },
      { t: "Add the repository to an AWS Backup plan with a cross-Region copy rule.",
        why: "AWS Backup does not support CodeCommit repositories." },
      { t: "Create an EventBridge rule for referenceUpdated and referenceCreated events that starts a CodeBuild project running git clone --mirror and git push --mirror to the us-west-2 repository.",
        why: "Correct. This is the AWS-documented pattern: an event-driven mirror push keeps the second Region in sync on every change." },
      { t: "Use S3 Cross-Region Replication on the bucket that stores the CodeCommit repository.",
        why: "CodeCommit's storage is managed by AWS and is not visible to you as an S3 bucket." }
    ],
    answer: [2],
    tip: "Repository replication = EventBridge → CodeBuild or Lambda running git push --mirror."
  },
  {
    id: "cc-10", domain: "d1", topic: "CodeCommit",
    q: "A pipeline with a CodeCommit source starts several minutes after each push because it was created long ago with periodic checks. The team wants the pipeline to start within seconds of a push to main, using the AWS-recommended method. What should be done?",
    options: [
      { t: "Set PollForSourceChanges to true and lower the polling interval.",
        why: "Polling is the legacy method, and the interval can't be tuned to seconds." },
      { t: "Set PollForSourceChanges to false and create an EventBridge rule for CodeCommit referenceUpdated events on main that targets the pipeline.",
        why: "Correct. Event-based change detection through EventBridge is the recommended default and starts the pipeline almost immediately." },
      { t: "Create a CodeCommit trigger that invokes a Lambda function, which calls StartPipelineExecution.",
        why: "It works, but it adds custom code to maintain. EventBridge does this natively." },
      { t: "Create a CloudWatch alarm on the repository's commit count metric that starts the pipeline.",
        why: "CodeCommit has no such metric, and alarms can't start pipelines directly." }
    ],
    answer: [1],
    tip: "CodeCommit → CodePipeline change detection = EventBridge rule (not polling)."
  },

  // ───────────────────────────── CodeBuild ─────────────────────────────
  {
    id: "cb-01", domain: "d1", topic: "CodeBuild",
    q: "A CodeBuild project defines the database password as a PLAINTEXT environment variable. Auditors found that the password is visible in the CodeBuild console. The password must also be rotated automatically every 30 days. What should the DevOps engineer do?",
    options: [
      { t: "Store the password in AWS Secrets Manager with rotation enabled, reference it in the buildspec env secrets-manager section, and grant secretsmanager:GetSecretValue to the CodeBuild service role.",
        why: "Correct. Secrets Manager supports automatic rotation, CodeBuild resolves the value at build time, and the value is masked in logs." },
      { t: "Store the password as a Parameter Store String parameter and reference it in the env parameter-store section.",
        why: "A String parameter is not encrypted, and Parameter Store has no built-in automatic rotation." },
      { t: "Base64-encode the password in the buildspec file.",
        why: "Base64 is encoding, not encryption. The secret would also end up in source control." },
      { t: "Encrypt the CodeBuild artifact bucket with a customer-managed KMS key.",
        why: "This protects artifacts, not environment variables shown in the console. It also does nothing for rotation." }
    ],
    answer: [0],
    tip: "Secrets in builds → secrets-manager or parameter-store (SecureString) in env. \"Automatic rotation\" → Secrets Manager."
  },
  {
    id: "cb-02", domain: "d1", topic: "CodeBuild",
    q: "A CodeBuild project builds a Docker image and pushes it to Amazon ECR. The build fails in the build phase with the error: \"Cannot connect to the Docker daemon at unix:///var/run/docker.sock\". What is the fix?",
    options: [
      { t: "Attach the AmazonEC2ContainerRegistryPowerUser policy to the service role.",
        why: "Missing ECR permissions cause AccessDenied or authorization errors on push or login, not a Docker daemon connection error." },
      { t: "Turn on privileged mode in the CodeBuild project's environment settings.",
        why: "Correct. Building Docker images inside CodeBuild requires privileged mode so the Docker daemon can run." },
      { t: "Add docker to the runtime-versions section of the install phase.",
        why: "Docker is not chosen through runtime-versions. Without privileged mode the daemon still can't start." },
      { t: "Change the compute type to BUILD_GENERAL1_LARGE.",
        why: "More CPU and memory doesn't give access to the Docker daemon." }
    ],
    answer: [1],
    tip: "docker build in CodeBuild = privileged mode. The local Docker layer cache needs it too."
  },
  {
    id: "cb-03", domain: "d1", topic: "CodeBuild",
    q: "In a buildspec, unit tests run in the build phase and docker push runs in the post_build phase. The team noticed that images are pushed to ECR even when the unit tests fail. What is the SIMPLEST fix?",
    options: [
      { t: "Set on-failure: CONTINUE in the build phase.",
        why: "This makes things worse: the build carries on as if nothing failed." },
      { t: "In post_build, run docker push only if CODEBUILD_BUILD_SUCCEEDING equals 1.",
        why: "Correct. post_build still runs when build fails. CODEBUILD_BUILD_SUCCEEDING is 0 after a failure, so checking it stops the push." },
      { t: "Move docker push into the install phase.",
        why: "install runs before the tests, so the image doesn't exist yet and would be pushed untested." },
      { t: "Put docker push in a finally block of the build phase.",
        why: "finally runs even when the commands before it fail. That is exactly the behaviour to avoid." }
    ],
    answer: [1],
    tip: "post_build runs even after build fails. Use CODEBUILD_BUILD_SUCCEEDING."
  },
  {
    id: "cb-04", domain: "d1", topic: "CodeBuild",
    q: "A CodeBuild project was given a VPC configuration (private subnets and a security group) so integration tests can reach a private Amazon RDS instance. The tests can now reach RDS, but npm install times out downloading from registry.npmjs.org. The private subnets route only to local VPC targets. What should the DevOps engineer do?",
    options: [
      { t: "Move the build into public subnets that have a route to an internet gateway.",
        why: "CodeBuild's network interface never gets a public IP, so it can't use an internet gateway even in a public subnet." },
      { t: "Add a NAT gateway in a public subnet and a 0.0.0.0/0 route to it in the private subnets' route table.",
        why: "Correct. A VPC-enabled build reaches the internet only through NAT from a private subnet. (Another option: use CodeArtifact with VPC endpoints.)" },
      { t: "Add an inbound rule for port 443 to the build's security group.",
        why: "Security groups are stateful, and npm traffic is outbound. The real problem is that there's no route to the internet." },
      { t: "Assign an Elastic IP address to the CodeBuild project.",
        why: "You can't attach Elastic IPs to CodeBuild build environments." }
    ],
    answer: [1],
    tip: "CodeBuild in a VPC needs internet → private subnet + NAT gateway, or VPC endpoints. A public subnet never works."
  },
  {
    id: "cb-05", domain: "d1", topic: "CodeBuild",
    q: "A CodeBuild project builds a large Docker image dozens of times per hour. Most image layers rarely change, but every build rebuilds them from scratch. Which change will MOST reduce build time?",
    options: [
      { t: "Turn on local caching with the Docker layer cache mode (with privileged mode on).",
        why: "Correct. The local Docker layer cache reuses unchanged layers on the build host. It works best for builds that run often." },
      { t: "Turn on an Amazon S3 cache for /var/lib/docker.",
        why: "S3 cache is for file paths such as dependencies. Docker's layer storage can't be cached that way." },
      { t: "Convert the project to a batch build with a build-matrix.",
        why: "Batch builds run variations in parallel. They don't reuse layers between builds." },
      { t: "Increase the build timeout to 8 hours.",
        why: "A longer timeout doesn't make a build faster." }
    ],
    answer: [0],
    tip: "Slow Docker builds that run often → LOCAL_DOCKER_LAYER_CACHE (or --cache-from an ECR image)."
  },
  {
    id: "cb-06", domain: "d1", topic: "CodeBuild",
    q: "A Java project in CodeBuild runs only twice a day. Each build spends 6 minutes downloading the same Maven dependencies. The team wants a reliable speed-up on every build. Which caching option should be used?",
    options: [
      { t: "Local custom cache for the ~/.m2 directory.",
        why: "Local cache is best-effort and stays on the build host only for a short time. With two builds a day, it will usually be gone." },
      { t: "Amazon S3 cache with ~/.m2/**/* listed under cache paths.",
        why: "Correct. The S3 cache lasts and is shared across build hosts, so it is restored for every build no matter how rarely builds run." },
      { t: "Local source cache.",
        why: "The source cache only speeds up Git checkout, not dependency downloads." },
      { t: "Move the build into a VPC with an S3 gateway endpoint.",
        why: "This changes the network path, not whether dependencies are cached." }
    ],
    answer: [1],
    tip: "Builds that run rarely → S3 cache. Builds that run often → local cache."
  },
  {
    id: "cb-07", domain: "d1", topic: "CodeBuild",
    q: "In CodePipeline, a CodeBuild action builds a Docker image tagged with the short commit ID. A later deploy action in the same pipeline needs that exact tag. What is the MOST efficient way to pass it?",
    options: [
      { t: "Write the tag to an SSM parameter in the build and read the parameter in the deploy stage.",
        why: "It works, but it adds an extra resource and permissions, and two pipeline runs at once could overwrite each other's value." },
      { t: "Declare IMAGE_TAG under env exported-variables in the buildspec, give the build action a namespace, and reference #{BuildVariables.IMAGE_TAG} in the deploy action.",
        why: "Correct. exported-variables plus CodePipeline variable namespaces pass values between actions natively and safely for each run." },
      { t: "Set IMAGE_TAG as an environment variable in the CodeBuild project settings.",
        why: "Project variables are fixed values defined before the build. They can't hold a value calculated during the build." },
      { t: "Print the tag to CloudWatch Logs and parse it with a Lambda function in the deploy stage.",
        why: "Fragile and complicated, with custom code." }
    ],
    answer: [1],
    tip: "Pass build output values to later actions → exported-variables + namespace."
  },
  {
    id: "cb-08", domain: "d1", topic: "CodeBuild",
    q: "A repository is hosted on GitHub. CodeBuild should run only when a pull request is opened or updated against branches matching feature/*, and should NOT run when only files under docs/ change. How should the build be started?",
    options: [
      { t: "An EventBridge rule that matches GitHub pull request events.",
        why: "GitHub doesn't send events to EventBridge natively without extra setup. CodeBuild webhooks are the built-in integration." },
      { t: "A CodeBuild webhook with filter groups: EVENT = PULL_REQUEST_CREATED, PULL_REQUEST_UPDATED; BASE_REF = ^refs/heads/feature/.*; and an excluded FILE_PATH = ^docs/.*",
        why: "Correct. Webhook filter groups can filter on event type, branch reference, and file path." },
      { t: "A scheduled build every 5 minutes that checks for open pull requests.",
        why: "Wasteful, delayed, and needs custom logic." },
      { t: "A CodeCommit trigger that mirrors the GitHub repository.",
        why: "CodeCommit triggers apply to CodeCommit repositories, not GitHub." }
    ],
    answer: [1],
    tip: "GitHub, Bitbucket, or GitLab → CodeBuild webhook filter groups. CodeCommit → EventBridge."
  },
  {
    id: "cb-09", domain: "d1", topic: "CodeBuild",
    q: "Developers want to see test pass/fail trends and code coverage across builds in the CodeBuild console. Tests produce JUnit XML, and coverage is produced by JaCoCo. What should the DevOps engineer configure?",
    options: [
      { t: "Add a reports section to the buildspec that defines a test report group (JUNITXML) and a code coverage report group (JACOCO_XML).",
        why: "Correct. CodeBuild report groups read these formats natively and show trends in the console. The service role needs codebuild:CreateReport and the related permissions." },
      { t: "Send the build logs to CloudWatch Logs and use Logs Insights queries.",
        why: "Parsing test results out of logs is fragile and doesn't give native trends." },
      { t: "Upload the XML files to S3 and query them with Amazon Athena.",
        why: "It's possible, but it's custom work. Report groups do this for you." },
      { t: "Turn on Amazon CodeGuru Profiler for the project.",
        why: "CodeGuru Profiler measures runtime performance, not test results or coverage." }
    ],
    answer: [0],
    tip: "Test and coverage trends in CodeBuild → report groups (JUnit, Cucumber, TestNG, TRX, JaCoCo, Cobertura, LCOV…)."
  },
  {
    id: "cb-10", domain: "d1", topic: "CodeBuild",
    multi: true,
    q: "A buildspec reads /app/prod/api-key under env parameter-store. The parameter is a SecureString encrypted with a customer-managed KMS key. The build fails with AccessDeniedException. Which TWO permissions must the CodeBuild service role have? (Choose TWO.)",
    options: [
      { t: "ssm:GetParameters on the parameter.",
        why: "Correct. CodeBuild calls GetParameters to resolve parameter-store variables." },
      { t: "kms:Decrypt on the customer-managed key. (The key policy must also allow the role.)",
        why: "Correct. SecureString values encrypted with a customer-managed key need kms:Decrypt for that key." },
      { t: "secretsmanager:GetSecretValue",
        why: "That's for secrets-manager variables, not Parameter Store." },
      { t: "ssm:PutParameter",
        why: "That's for writing a parameter. Reading doesn't need it." },
      { t: "kms:Encrypt on the key.",
        why: "Reading a SecureString only needs Decrypt." }
    ],
    answer: [0, 1],
    tip: "Parameter Store in CodeBuild: ssm:GetParameters, plus kms:Decrypt when a customer-managed key is used."
  },
  {
    id: "cb-11", domain: "d1", topic: "CodeBuild",
    q: "APP_ENV is set to 'dev' in the buildspec env variables. The CodeBuild project's environment sets APP_ENV to 'staging'. The CodePipeline CodeBuild action sets APP_ENV to 'prod' in its EnvironmentVariables configuration. What value does the build see?",
    options: [
      { t: "dev", why: "Buildspec values have the LOWEST priority." },
      { t: "staging", why: "Project-level values override the buildspec but are themselves overridden by values passed when the build starts." },
      { t: "prod", why: "Correct. Values passed when the build is started (start-build overrides or the CodePipeline action) have the highest priority." },
      { t: "The build fails because the variable is defined more than once.", why: "Defining it in several places is allowed. The priority order decides which wins." }
    ],
    answer: [2],
    tip: "Priority: build start / pipeline action > project > buildspec."
  },

  // ───────────────────────────── CodeArtifact ─────────────────────────────
  {
    id: "ca-01", domain: "d1", topic: "CodeArtifact",
    q: "A company runs a self-managed Nexus server on EC2 to host internal npm packages and cache packages from the public npm registry. The server often runs out of disk and needs patching. The company wants a managed solution with the LEAST operational overhead. What should the DevOps engineer recommend?",
    options: [
      { t: "Host the npm packages in an S3 bucket set up as a static website registry.",
        why: "S3 isn't an npm registry. You would have to build the registry API, authentication, and proxying yourself." },
      { t: "Use AWS CodeArtifact: a repository with an external connection to public:npmjs, used as the upstream of a team repository where internal packages are published.",
        why: "Correct. CodeArtifact is fully managed, stores internal packages, and proxies and caches public npm packages through an external connection." },
      { t: "Store the packages as OCI artifacts in Amazon ECR.",
        why: "ECR is a container registry. npm clients can't use it as a registry." },
      { t: "Commit node_modules into a CodeCommit repository.",
        why: "This is an anti-pattern. It makes the repository huge and doesn't cache or proxy the public registry." }
    ],
    answer: [1],
    tip: "Replace Nexus or Artifactory → CodeArtifact (external connection + upstreams)."
  },
  {
    id: "ca-02", domain: "d1", topic: "CodeArtifact",
    q: "Developers need ONE CodeArtifact repository endpoint that serves internal packages plus public packages from both npmjs and PyPI. How should the repositories be set up?",
    options: [
      { t: "Add external connections to both public:npmjs and public:pypi on the team repository.",
        why: "A repository can have only ONE external connection." },
      { t: "Create npm-store (external connection public:npmjs) and pypi-store (external connection public:pypi), and add both as upstream repositories of the team repository.",
        why: "Correct. Each store repository holds one external connection. The team repository reaches both through its upstreams, so there is one endpoint for everything." },
      { t: "Create two domains, one for npm and one for PyPI.",
        why: "Separate domains mean separate endpoints and lose the benefit of storing packages once per domain. Upstreams can't link repositories in different domains." },
      { t: "Use the team repository for internal packages and point clients directly at the public registries for everything else.",
        why: "That defeats the purpose of caching and control. Builds would break if a public registry goes down." }
    ],
    answer: [1],
    tip: "One external connection per repository → use \"store\" repositories as upstreams."
  },
  {
    id: "ca-03", domain: "d1", topic: "CodeArtifact",
    q: "A company publishes an internal Python package called mycorp-auth to CodeArtifact. Its repository has an upstream with an external connection to PyPI. The security team is worried that an attacker could publish mycorp-auth version 99.0 on public PyPI and builds would pull it (dependency confusion). Which CodeArtifact feature prevents this?",
    options: [
      { t: "Package origin controls, with upstream set to BLOCK for mycorp-auth (the default for packages first published directly).",
        why: "Correct. Origin controls stop new versions of that package name from coming in through upstreams, so only internally published versions are used." },
      { t: "Remove the external connection to PyPI.",
        why: "This would block ALL public packages and break every build that needs them." },
      { t: "A repository policy that denies codeartifact:ReadFromRepository for public packages.",
        why: "Repository policies control which principals have access, not where a package came from." },
      { t: "Pin exact versions in requirements.txt.",
        why: "It helps, but nothing enforces it on the server side. One loose version range anywhere brings the risk back." }
    ],
    answer: [0],
    tip: "Dependency confusion / same-name malicious package → package origin controls."
  },
  {
    id: "ca-04", domain: "d1", topic: "CodeArtifact",
    q: "CodeBuild projects run in private subnets with NO internet access, and company policy forbids NAT gateways. The builds must install public PyPI packages. Which solution meets the requirements?",
    options: [
      { t: "Add a NAT gateway only during build hours.",
        why: "Company policy forbids NAT gateways." },
      { t: "Use a CodeArtifact repository with a PyPI external connection, and create interface VPC endpoints for codeartifact.api and codeartifact.repositories plus an S3 gateway endpoint.",
        why: "Correct. CodeArtifact fetches public packages for you. The VPC endpoints let builds reach CodeArtifact privately, and package files are served from S3." },
      { t: "Create only a codeartifact.api interface endpoint.",
        why: "The api endpoint handles API calls and tokens. pip traffic needs codeartifact.repositories, and package files need the S3 gateway endpoint." },
      { t: "Create an S3 gateway endpoint and mirror PyPI into a bucket.",
        why: "Mirroring PyPI is a huge custom job, and pip can't use a plain S3 bucket as an index." }
    ],
    answer: [1],
    tip: "Private VPC + CodeArtifact = api + repositories interface endpoints + S3 gateway endpoint."
  },
  {
    id: "ca-05", domain: "d1", topic: "CodeArtifact",
    q: "A CodeBuild service role has codeartifact:GetAuthorizationToken, codeartifact:GetRepositoryEndpoint and codeartifact:ReadFromRepository. The build fails when running 'aws codeartifact login' with: \"not authorized to perform: sts:GetServiceBearerToken\". What is the fix?",
    options: [
      { t: "Add sts:GetServiceBearerToken to the service role (with condition sts:AWSServiceName = codeartifact.amazonaws.com).",
        why: "Correct. Getting a CodeArtifact token needs BOTH codeartifact:GetAuthorizationToken and sts:GetServiceBearerToken." },
      { t: "Add sts:AssumeRole to the service role.",
        why: "This isn't about assuming a role. The error names exactly the missing action." },
      { t: "Add a domain policy that allows codeartifact:ReadFromRepository.",
        why: "ReadFromRepository belongs in a repository policy, and the problem is getting the token, not reading." },
      { t: "Turn on privileged mode in the CodeBuild project.",
        why: "Privileged mode is for running Docker and has nothing to do with IAM permissions." }
    ],
    answer: [0],
    tip: "Token = codeartifact:GetAuthorizationToken + sts:GetServiceBearerToken."
  },
  {
    id: "ca-06", domain: "d1", topic: "CodeArtifact",
    q: "An existing CodeArtifact domain uses the AWS-managed aws/codeartifact key. A new compliance rule requires all package storage to be encrypted with a customer-managed KMS key. What should the DevOps engineer do?",
    options: [
      { t: "Run update-domain to change the domain's KMS key.",
        why: "A domain's encryption key is set when the domain is created and cannot be changed." },
      { t: "Create a new domain encrypted with the customer-managed key, recreate the repositories, and migrate or re-fetch the packages.",
        why: "Correct. Since the key can't be changed, a new domain is the only way." },
      { t: "Use KMS ReEncrypt on the domain's assets.",
        why: "You don't have direct access to the domain's stored files to re-encrypt them." },
      { t: "Turn on S3 default encryption with the customer-managed key on the CodeArtifact asset bucket.",
        why: "The asset storage is managed by AWS. You can't change its bucket settings." }
    ],
    answer: [1],
    tip: "A CodeArtifact domain's KMS key is fixed at creation → new domain + migrate."
  },
  {
    id: "ca-07", domain: "d1", topic: "CodeArtifact",
    q: "A CodeArtifact domain and repository are in a central Tools account. CodeBuild projects in a separate Dev account need to download packages from it. Which combination of configurations is required?",
    options: [
      { t: "Share the domain with the Dev account using AWS RAM.",
        why: "CodeArtifact cross-account access works through resource policies, not RAM." },
      { t: "Only an IAM policy on the Dev CodeBuild role with codeartifact:* permissions.",
        why: "The Dev account's IAM policy alone isn't enough. The Tools account's resource policies must also allow the Dev principal." },
      { t: "A domain policy in Tools allowing GetAuthorizationToken, a repository policy in Tools allowing ReadFromRepository for the Dev role, and an IAM policy on the Dev role with those actions plus sts:GetServiceBearerToken.",
        why: "Correct. Cross-account access needs both sides to allow it: the domain and repository resource policies in Tools, and IAM in Dev. If the domain uses a customer-managed key, its key policy must allow Dev too." },
      { t: "Copy all packages into a new domain in the Dev account every night.",
        why: "Duplicated work and storage, and the copies go stale." }
    ],
    answer: [2],
    tip: "CodeArtifact cross-account = domain policy + repository policy + IAM in the calling account."
  },
  {
    id: "ca-08", domain: "d1", topic: "CodeArtifact",
    q: "A developer tries 'aws codeartifact login --tool maven ...' to set up a Maven build against CodeArtifact, and the command fails. How should Maven be configured?",
    options: [
      { t: "CodeArtifact doesn't support Maven, so use S3 as a Maven repository.",
        why: "CodeArtifact fully supports Maven and Gradle." },
      { t: "Get a token with get-authorization-token, store it in CODEARTIFACT_AUTH_TOKEN, and reference it in settings.xml as the password with username 'aws'. Use the URL from get-repository-endpoint --format maven in pom.xml.",
        why: "Correct. The login command only supports npm, pip, and twine. Maven and Gradle are configured by hand with the token." },
      { t: "Use 'aws codeartifact login --tool twine' and point Maven at ~/.pypirc.",
        why: "twine is the Python upload tool. Maven doesn't read .pypirc." },
      { t: "Use an IAM access key as the Maven password.",
        why: "CodeArtifact repositories accept the CodeArtifact authorization token, not raw IAM keys, and long-term keys are bad practice." }
    ],
    answer: [1],
    tip: "`codeartifact login` → npm, pip, twine only. Maven and Gradle → token in settings.xml (username 'aws')."
  },
  {
    id: "ca-09", domain: "d1", topic: "CodeArtifact",
    q: "A pipeline publishes each new library version to a dev repository in CodeArtifact. After integration tests pass, the exact same version must be made available in the release repository that production builds use, without rebuilding it. What is the BEST approach?",
    options: [
      { t: "Rebuild the package from source and publish it to the release repository.",
        why: "Rebuilding can produce a different file. The requirement is to promote the exact tested version." },
      { t: "Add the dev repository as an upstream of the release repository.",
        why: "This would make every dev version, including untested ones, available to production builds." },
      { t: "Add a pipeline step that runs 'aws codeartifact copy-package-versions' from the dev repository to the release repository.",
        why: "Correct. copy-package-versions promotes the exact tested files between repositories in the same domain." },
      { t: "Download the package and upload it to an S3 bucket used by production.",
        why: "Production builds resolve packages from CodeArtifact, not S3. This is custom work outside the package manager." }
    ],
    answer: [2],
    tip: "Promote a tested package between repositories → copy-package-versions."
  },
  {
    id: "ca-10", domain: "d1", topic: "CodeArtifact",
    q: "Whenever a new version of the shared library mycorp-common is published to CodeArtifact, the pipelines of the services that depend on it must start automatically. What should the DevOps engineer implement?",
    options: [
      { t: "A CodeArtifact repository trigger that starts the pipelines.",
        why: "CodeArtifact has no repository triggers like CodeCommit does." },
      { t: "An EventBridge rule matching the CodeArtifact 'Package Version State Change' event for mycorp-common, targeting the service pipelines.",
        why: "Correct. CodeArtifact sends package version events to EventBridge, which can start CodePipeline directly." },
      { t: "A Lambda function scheduled every 5 minutes that compares the latest version and starts the pipelines.",
        why: "Polling adds delay and custom code to maintain." },
      { t: "A CloudTrail trail with a metric filter on PublishPackageVersion and an alarm that starts the pipelines.",
        why: "Complicated and slow, and alarms can't start pipelines directly." }
    ],
    answer: [1],
    tip: "Reacting to package publishes → EventBridge (Package Version State Change)."
  },
  {
    id: "ca-11", domain: "d1", topic: "CodeArtifact",
    q: "A popular public npm package that the company's builds depend on was suddenly unpublished from registry.npmjs.org. Builds that install through CodeArtifact (team-repo → upstream npm-store → public:npmjs) keep working. Why?",
    options: [
      { t: "CodeArtifact mirrors the entire npm registry every night.",
        why: "CodeArtifact fetches packages only when they are requested. It does not mirror whole registries." },
      { t: "Versions fetched through upstreams are kept in CodeArtifact (in npm-store and team-repo), so they stay available after removal from the public site.",
        why: "Correct. Once a version has been requested through CodeArtifact, it is stored in the repositories along the chain and doesn't depend on the public registry any more." },
      { t: "npm caches packages on the CodeBuild host permanently.",
        why: "Every CodeBuild build starts in a fresh environment. A local npm cache doesn't survive between builds." },
      { t: "The external connection automatically switches to a backup registry.",
        why: "No such failover exists." }
    ],
    answer: [1],
    tip: "Upstreams keep fetched versions → protection against public outages or packages being removed."
  },

  // ───────────────────── More CodeCommit ─────────────────────
  {
    id: "cc-11", domain: "d1", topic: "CodeCommit",
    q: "A DevOps engineer used the AWS CLI to create a CodeCommit trigger that should invoke a Lambda function on every push. Pushes succeed, but the function is never invoked and CloudWatch Logs shows nothing. What is the MOST likely cause?",
    options: [
      { t: "The Lambda function's resource-based policy does not allow codecommit.amazonaws.com to invoke it.",
        why: "Correct. The console adds this permission for you, but with the CLI you must run lambda add-permission so CodeCommit can call the function." },
      { t: "The developers' IAM policy is missing lambda:InvokeFunction.",
        why: "CodeCommit invokes the function, not the developer, so the developer's permissions don't matter." },
      { t: "Triggers can only target SNS topics.",
        why: "Triggers support both SNS and Lambda targets." },
      { t: "CloudTrail must be enabled for triggers to fire.",
        why: "Triggers don't depend on CloudTrail." }
    ],
    answer: [0],
    tip: "Trigger → Lambda needs a Lambda resource policy for codecommit.amazonaws.com. Notification → SNS needs a topic policy for codestar-notifications.amazonaws.com."
  },
  {
    id: "cc-12", domain: "d1", topic: "CodeCommit",
    q: "A notification rule on a CodeCommit repository targets an existing SNS topic that has a custom access policy. Pull requests are being created, but no notifications arrive. What should the DevOps engineer fix?",
    options: [
      { t: "Add sns:Publish to the developers' IAM policies.",
        why: "Developers don't publish the notifications. The notification service does." },
      { t: "Update the SNS topic access policy to allow the service principal codestar-notifications.amazonaws.com to sns:Publish (and, if the topic uses a customer-managed KMS key, allow it in the key policy).",
        why: "Correct. Notification rules publish as codestar-notifications.amazonaws.com, which must be allowed on the topic." },
      { t: "Replace the notification rule with a CodeCommit trigger.",
        why: "Triggers don't support pull request events at all." },
      { t: "Turn on CloudTrail data events for CodeCommit.",
        why: "Notification rules don't depend on CloudTrail." }
    ],
    answer: [1],
    tip: "Notifications silently missing → check the SNS topic policy (and KMS key policy) for codestar-notifications."
  },
  {
    id: "cc-13", domain: "d1", topic: "CodeCommit",
    q: "A company is moving a GitHub repository to CodeCommit. All branches, tags, and the complete commit history must be kept. What is the correct approach?",
    options: [
      { t: "Download the repository as a ZIP from GitHub and upload the files through the CodeCommit console.",
        why: "A ZIP has no Git history, branches, or tags, and the console has file-size limits." },
      { t: "Use the CodeCommit 'Import from GitHub' button in the console.",
        why: "CodeCommit has no such import feature." },
      { t: "Run git clone --mirror from GitHub, then git push --mirror (or --all and --tags) to the new CodeCommit repository URL.",
        why: "Correct. A mirror clone copies all references (branches, tags) and the full history." },
      { t: "Create a CodeConnections connection to GitHub so CodeCommit stays in sync.",
        why: "CodeConnections lets services such as CodePipeline read from GitHub. It doesn't copy repositories into CodeCommit." }
    ],
    answer: [2],
    tip: "Migrating with full history → git clone --mirror + git push --mirror."
  },
  {
    id: "cc-14", domain: "d1", topic: "CodeCommit",
    q: "Developers need to create repositories, push code, create branches, and open and merge pull requests, but must NOT be able to delete any repository. Which AWS managed policy fits BEST?",
    options: [
      { t: "AWSCodeCommitFullAccess", why: "Includes codecommit:DeleteRepository, which is too much." },
      { t: "AWSCodeCommitPowerUser", why: "Correct. Full use of CodeCommit except deleting repositories." },
      { t: "AWSCodeCommitReadOnly", why: "Can't push, create branches, or merge." },
      { t: "PowerUserAccess", why: "Gives broad access across nearly all AWS services, far more than needed, and includes repository deletion." }
    ],
    answer: [1],
    tip: "PowerUser = everything except DeleteRepository."
  },
  {
    id: "cc-15", domain: "d1", topic: "CodeCommit",
    q: "A new compliance rule says that all NEW CodeCommit repositories must be encrypted at rest with a customer-managed KMS key controlled by the security team. What should the DevOps engineer do?",
    options: [
      { t: "Nothing. CodeCommit's default key is already customer-managed.",
        why: "The default aws/codecommit key is AWS-managed, not customer-managed." },
      { t: "Create the repositories with the customer-managed key specified (for example create-repository --kms-key-id), and make sure the key policy allows CodeCommit to use it for the users and roles accessing the repositories.",
        why: "Correct. CodeCommit lets you choose a customer-managed KMS key for a repository's encryption at rest." },
      { t: "Turn on S3 default encryption on the bucket behind CodeCommit.",
        why: "CodeCommit storage isn't an S3 bucket you can configure." },
      { t: "Require developers to encrypt files with git-crypt before pushing.",
        why: "Client-side encryption is a different control and is hard to enforce. It doesn't meet the encryption-at-rest requirement as asked." }
    ],
    answer: [1],
    tip: "CodeCommit encryption at rest is always on. You can choose a customer-managed key per repository."
  },

  // ───────────────────── More CodeBuild ─────────────────────
  {
    id: "cb-12", domain: "d1", topic: "CodeBuild",
    q: "A CodeBuild project must use a custom build environment image stored in a PRIVATE Docker Hub repository. The project fails at PROVISIONING because the image can't be pulled. What should the DevOps engineer do?",
    options: [
      { t: "Add docker login to the pre_build phase.",
        why: "The build image is pulled during PROVISIONING, before any buildspec phase runs, so logging in there is too late." },
      { t: "Store the Docker Hub credentials in Secrets Manager, set the secret as the project's registry credential, and allow the service role to read the secret.",
        why: "Correct. A registry credential lets CodeBuild sign in to the private registry when it pulls the environment image." },
      { t: "Put the Docker Hub password in a PLAINTEXT environment variable.",
        why: "Insecure, and environment variables aren't used to pull the environment image." },
      { t: "Turn on privileged mode.",
        why: "Privileged mode lets the build run Docker. It doesn't sign in to registries." }
    ],
    answer: [1],
    tip: "Private environment image (not ECR) → registry credential stored in Secrets Manager."
  },
  {
    id: "cb-13", domain: "d1", topic: "CodeBuild",
    q: "An integration test suite in CodeBuild takes about 90 minutes. Builds keep ending with status TIMED_OUT at around 60 minutes. What is the fix?",
    options: [
      { t: "Raise the queued timeout to 8 hours.",
        why: "The queued timeout is how long a build may WAIT before starting. It doesn't limit how long it runs." },
      { t: "Raise the project's build timeout (default 60 minutes, maximum 8 hours) to about 120 minutes.",
        why: "Correct. The build timeout limits run time. The default of 60 minutes is what is stopping these builds." },
      { t: "Switch to the Lambda compute type.",
        why: "Lambda compute has a much SHORTER maximum run time (15 minutes) and can't run 90-minute builds." },
      { t: "Split the buildspec into more phases.",
        why: "The timeout covers the whole build, no matter how many phases it has." }
    ],
    answer: [1],
    tip: "Build timeout: default 60 minutes, maximum 8 hours. Queued timeout is a different setting."
  },
  {
    id: "cb-14", domain: "d1", topic: "CodeBuild",
    q: "A library must be tested against Python 3.10, 3.11, and 3.12 IN PARALLEL every time code changes, with one overall result. Which approach has the LEAST overhead?",
    options: [
      { t: "Create three CodeBuild projects and three pipelines.",
        why: "It works, but it means a lot to maintain, and there's no single combined result." },
      { t: "Install all three runtimes in one build and run the tests one after another.",
        why: "Sequential, so slower, and a fiddly install phase." },
      { t: "Use a CodeBuild batch build with a build-matrix that varies the Python version.",
        why: "Correct. A build-matrix starts parallel builds from one buildspec and reports one batch result." },
      { t: "Use the Lambda compute type to run the tests faster.",
        why: "Lambda compute doesn't run versions in parallel, and it has limits on runtimes and duration." }
    ],
    answer: [2],
    tip: "Parallel runs over versions or OS → batch build-matrix. Parallel independent builds → build-list. Builds that depend on each other → build-graph."
  },
  {
    id: "cb-15", domain: "d1", topic: "CodeBuild",
    q: "A build fails only in CodeBuild, never on developer laptops. An engineer wants to pause the build at a certain point and get an interactive shell inside the running build environment to investigate. What should be used?",
    options: [
      { t: "SSH into the build host using the project's key pair.",
        why: "CodeBuild hosts are managed by AWS. There's no SSH access or key pair." },
      { t: "Turn on Session Manager access for the build and add codebuild-breakpoint in the buildspec where it should pause.",
        why: "Correct. CodeBuild supports Session Manager sessions into a running build, and codebuild-breakpoint pauses it." },
      { t: "Use EC2 Instance Connect from the console.",
        why: "Build environments aren't EC2 instances in your account." },
      { t: "Turn on detailed CloudWatch metrics.",
        why: "Metrics don't give you a shell." }
    ],
    answer: [1],
    tip: "Interactive debugging of a running build → Session Manager + codebuild-breakpoint (or the local CodeBuild agent)."
  },
  {
    id: "cb-16", domain: "d1", topic: "CodeBuild",
    q: "A monorepo contains two services, each needing a different build process. The team wants two CodeBuild projects that use the same repository. How should each project get its own build instructions?",
    options: [
      { t: "It isn't possible. CodeBuild supports only one buildspec.yml per repository.",
        why: "Each project can point to a different buildspec file or define one inline." },
      { t: "Set a buildspec override in each project (for example buildspecs/service-a.yml and buildspecs/service-b.yml).",
        why: "Correct. The buildspec location can be set per project, or inline in the project or pipeline action." },
      { t: "Split the monorepo into two repositories.",
        why: "Not required. That is a big restructure for no reason." },
      { t: "Use one buildspec.yml with an environment variable that decides which service to build.",
        why: "Possible, but it makes one buildspec complicated. Separate files are cleaner and are the expected answer." }
    ],
    answer: [1],
    tip: "Several projects, one repository → buildspec override (path or inline)."
  },
  {
    id: "cb-17", domain: "d1", topic: "CodeBuild",
    q: "When any build of the 'payments' CodeBuild project FAILS, a Lambda function must run within seconds and receive the build ID and project name to open a ticket. What should the DevOps engineer configure?",
    options: [
      { t: "A CloudWatch alarm on the FailedBuilds metric that invokes the Lambda function.",
        why: "Metric alarms have a delay, don't carry the build ID, and can't invoke Lambda directly as an alarm action." },
      { t: "An EventBridge rule on 'CodeBuild Build State Change' with build-status FAILED and project-name payments, targeting the Lambda function.",
        why: "Correct. The event arrives almost immediately and contains the build ID, project name, and more." },
      { t: "A Lambda function scheduled every minute that calls ListBuildsForProject.",
        why: "Polling with custom code is the wrong answer when an event-driven option exists." },
      { t: "Parse the CloudWatch Logs output for the word ERROR.",
        why: "Fragile, and it doesn't reliably mean the build failed." }
    ],
    answer: [1],
    tip: "React to a build result → EventBridge 'CodeBuild Build State Change'."
  },

  // ───────────────────── More CodeArtifact ─────────────────────
  {
    id: "ca-12", domain: "d1", topic: "CodeArtifact",
    q: "Developers ran 'aws codeartifact login --tool npm' yesterday morning. Today, npm install fails with 401 Unauthorized, although nothing has changed in IAM or the repository. What is the cause?",
    options: [
      { t: "The repository policy was reset overnight.",
        why: "Repository policies don't reset by themselves." },
      { t: "The CodeArtifact authorization token expired. Tokens last 12 hours at most, so login must be run again (for example from a script).",
        why: "Correct. Tokens last 12 hours by default and at most, so a login from yesterday has expired." },
      { t: "The external connection to npmjs was removed automatically.",
        why: "External connections are never removed automatically." },
      { t: "The domain's KMS key was rotated.",
        why: "Key rotation is transparent and doesn't cause 401 errors." }
    ],
    answer: [1],
    tip: "CodeArtifact token = 15 minutes to 12 hours (default 12). 401 the next day → log in again."
  },
  {
    id: "ca-13", domain: "d1", topic: "CodeArtifact",
    q: "A team wants npm to fetch ONLY packages in the @mycorp scope from CodeArtifact, and everything else straight from the public npm registry. How should npm be configured?",
    options: [
      { t: "aws codeartifact login --tool npm ... --namespace mycorp",
        why: "Correct. --namespace sets a scoped registry in .npmrc, so only @mycorp/* resolves through CodeArtifact." },
      { t: "Add npmjs as an upstream of the team repository.",
        why: "That routes everything through CodeArtifact, which is the opposite of what was asked." },
      { t: "Set package origin controls to BLOCK for public packages.",
        why: "Origin controls govern where package versions can come from inside CodeArtifact, not client routing." },
      { t: "Create a separate domain named mycorp.",
        why: "The domain name doesn't control npm's scope routing." }
    ],
    answer: [0],
    tip: "Scope-only routing for npm → login --namespace."
  },
  {
    id: "ca-14", domain: "d1", topic: "CodeArtifact",
    q: "15 repositories in the same CodeArtifact domain each contain the same 2 GB package version. Finance is worried that storage is billed 15 times. What is true?",
    options: [
      { t: "Storage is billed 15 times. Delete the duplicates.",
        why: "CodeArtifact stores identical files only once per domain." },
      { t: "Storage is billed once, because files are stored once per domain no matter how many repositories contain them.",
        why: "Correct. This is a key benefit of using a single domain across many repositories." },
      { t: "Move each repository to its own domain to reduce cost.",
        why: "That's the opposite of what helps: separate domains each store their own copy." },
      { t: "Add an S3 lifecycle policy to the CodeArtifact storage.",
        why: "You can't configure CodeArtifact's underlying storage." }
    ],
    answer: [1],
    tip: "Domain = files stored once. Prefer one domain per organization."
  },
  {
    id: "ca-15", domain: "d1", topic: "CodeArtifact",
    q: "Version 2.3.1 of an internal package was published with a serious bug. Builds must no longer be able to download it, but the version must be kept for audit, and it may be restored later. What should the DevOps engineer do?",
    options: [
      { t: "Publish a new 2.3.1 over the old one.",
        why: "Published package versions can't be overwritten in CodeArtifact." },
      { t: "Change the version's status to Archived with update-package-versions-status.",
        why: "Correct. Archived versions can't be downloaded but are kept, and their status can be changed back later." },
      { t: "Dispose of the package version.",
        why: "Disposed removes the files permanently, so the audit requirement fails and it can't be restored." },
      { t: "Delete the repository.",
        why: "Far too destructive. It removes every package." }
    ],
    answer: [1],
    tip: "Status: Published → Unlisted (hidden from listing) → Archived (no downloads, kept) → Disposed (files removed)."
  },
  {
    id: "ca-16", domain: "d1", topic: "CodeArtifact",
    multi: true,
    q: "A CodeBuild project can already get CodeArtifact tokens. It must now PUBLISH npm packages to the team repository. Which TWO additional permissions does the service role need? (Choose TWO.)",
    options: [
      { t: "codeartifact:PublishPackageVersion", why: "Correct. Needed to upload the package version." },
      { t: "codeartifact:PutPackageMetadata", why: "Correct. Needed to write package metadata, which npm publish does." },
      { t: "codeartifact:CreateRepository", why: "The repository already exists. Publishing doesn't create repositories." },
      { t: "codeartifact:CopyPackageVersions", why: "That's for promoting versions between repositories, not publishing." },
      { t: "s3:PutObject on the CodeArtifact asset bucket", why: "You never write to CodeArtifact storage directly. The service handles it." }
    ],
    answer: [0, 1],
    tip: "Publish = PublishPackageVersion + PutPackageMetadata (plus the token permissions)."
  },
  {
    id: "ca-17", domain: "d1", topic: "CodeArtifact",
    q: "A team builds a compiled ZIP that isn't an npm, PyPI, Maven, or NuGet package. They want it versioned and stored alongside their other packages in CodeArtifact, with the same access controls. What should they use?",
    options: [
      { t: "It's not possible. Use S3 instead.",
        why: "CodeArtifact supports generic packages for exactly this case." },
      { t: "CodeArtifact generic packages (publish-package-version with format generic).",
        why: "Correct. Generic packages store any file with a namespace, name, and version, under the same domain and repository policies." },
      { t: "Wrap the ZIP inside a fake Maven JAR.",
        why: "A hack. Generic packages exist for this." },
      { t: "Push it to ECR as a container image.",
        why: "ECR is for container images and OCI artifacts, not the same package controls as CodeArtifact." }
    ],
    answer: [1],
    tip: "Any file type → CodeArtifact generic packages."
  },

  // ───────────────────────────── ECR ─────────────────────────────
  {
    id: "ecr-01", domain: "d1", topic: "ECR",
    q: "Every CI build pushes a new image to an ECR repository, and storage costs keep growing. Untagged images should be removed after 7 days, and only the 20 newest images tagged prod-* should be kept. What is the solution with the LEAST operational overhead?",
    options: [
      { t: "A Lambda function on an EventBridge schedule that lists images and calls BatchDeleteImage.",
        why: "It works, but it is custom code to maintain. ECR has this built in." },
      { t: "An ECR lifecycle policy with one rule expiring untagged images sinceImagePushed 7 days, and one rule expiring tagged prod-* images with imageCountMoreThan 20.",
        why: "Correct. Lifecycle policies expire images automatically by age or count, with no code." },
      { t: "An S3 lifecycle rule on the bucket that stores the ECR images.",
        why: "ECR's storage is managed by AWS. You can't see or configure its S3 buckets." },
      { t: "Turn on tag immutability so old images are replaced.",
        why: "Tag immutability prevents tags being overwritten. It never deletes anything." }
    ],
    answer: [1],
    tip: "Old images piling up → ECR lifecycle policy (sinceImagePushed / imageCountMoreThan)."
  },
  {
    id: "ecr-02", domain: "d1", topic: "ECR",
    q: "A DevOps engineer writes an ECR lifecycle policy with three rules. Rule priority 1 uses tagStatus 'any' with imageCountMoreThan 50. Rules 2 and 3 target specific tag patterns. ECR rejects the policy. What must be changed?",
    options: [
      { t: "The tagStatus 'any' rule must have the HIGHEST rulePriority number, so that it is evaluated last.",
        why: "Correct. A rule with tagStatus any must come last (the highest number). Lower numbers are evaluated first." },
      { t: "Lifecycle policies may contain only one rule.",
        why: "A policy can have many rules, each with a unique priority." },
      { t: "tagStatus 'any' is not supported. Use 'tagged' and 'untagged' instead.",
        why: "'any' is valid. It just has to be the last rule." },
      { t: "rulePriority must start at 0.",
        why: "Priorities are positive integers. 1 is a normal first value." }
    ],
    answer: [0],
    tip: "Lower rulePriority is evaluated first. A tagStatus 'any' rule must have the highest number. Each image matches at most one rule."
  },
  {
    id: "ecr-03", domain: "d1", topic: "ECR",
    q: "Before applying a new lifecycle policy to a production ECR repository, the team wants to see exactly which images it WOULD delete, without deleting anything. What should they use?",
    options: [
      { t: "Apply the policy and restore deleted images from the ECR recycle bin.",
        why: "ECR has no recycle bin. Expired images are gone." },
      { t: "Lifecycle policy preview (StartLifecyclePolicyPreview / the console 'preview' option).",
        why: "Correct. A preview is a dry run that lists the images the rules would expire." },
      { t: "Turn on CloudTrail and apply the policy to a copy of the repository.",
        why: "Possible but slow and indirect. A built-in preview exists." },
      { t: "Set countNumber to 0 for the first run.",
        why: "That would delete images, not preview them." }
    ],
    answer: [1],
    tip: "Test a lifecycle policy safely → lifecycle policy preview."
  },
  {
    id: "ecr-04", domain: "d1", topic: "ECR",
    q: "An auditor requires that once an image is released as v1.4.2, nobody can push a different image under the same tag. Rollbacks must always deploy exactly the image that was tested. What should the DevOps engineer configure?",
    options: [
      { t: "Turn on tag immutability (IMMUTABLE) on the repository.",
        why: "Correct. With immutable tags, any push that reuses an existing tag fails." },
      { t: "A repository policy that denies ecr:PutImage to everyone.",
        why: "That would block ALL pushes, including new versions." },
      { t: "A lifecycle policy that keeps images forever.",
        why: "Lifecycle policies decide deletions, not overwrites." },
      { t: "Enable enhanced scanning.",
        why: "Scanning finds vulnerabilities. It doesn't protect tags." }
    ],
    answer: [0],
    tip: "\"Tags must not be overwritten\" → tag immutability. (Deploying by digest is the strongest guarantee.)"
  },
  {
    id: "ecr-05", domain: "d1", topic: "ECR",
    q: "A security team needs ECR images scanned for vulnerabilities in both OS packages AND application libraries (npm, pip, Maven). Images already in the registry must be re-evaluated automatically when new CVEs are published. Which option meets these requirements?",
    options: [
      { t: "Basic scanning with scan on push.",
        why: "Basic scanning covers OS packages only and scans only on push or manually. It doesn't re-scan when new CVEs appear." },
      { t: "Enhanced scanning with Amazon Inspector, using continuous scanning.",
        why: "Correct. Enhanced scanning covers OS and language packages and re-scans continuously as new CVEs are published." },
      { t: "Run a manual basic scan of every image each night with a scheduled Lambda function.",
        why: "Still OS-only, custom code, and manual scans are limited to once per 24 hours per image." },
      { t: "Amazon GuardDuty runtime monitoring.",
        why: "GuardDuty detects threats at runtime. It doesn't scan image contents for CVEs." }
    ],
    answer: [1],
    tip: "Language packages + continuous re-scan → enhanced scanning (Inspector). OS only, free → basic."
  },
  {
    id: "ecr-06", domain: "d1", topic: "ECR",
    q: "A startup wants the LOWEST-cost way to check its ECR images for operating system vulnerabilities whenever a new image is pushed. Application library scanning is not required. What should it use?",
    options: [
      { t: "Enhanced scanning with continuous scanning.",
        why: "It works, but it is paid (Inspector pricing) and does more than is needed." },
      { t: "Basic scanning configured with scan on push.",
        why: "Correct. Basic scanning is free and scans OS packages when images are pushed." },
      { t: "A third-party scanner on an EC2 instance.",
        why: "It costs money and needs operational work." },
      { t: "AWS Config managed rules.",
        why: "Config checks resource settings, not image vulnerabilities." }
    ],
    answer: [1],
    tip: "Basic = free, OS only, on push or manual."
  },
  {
    id: "ecr-07", domain: "d1", topic: "ECR",
    q: "A pipeline builds an image, pushes it to ECR (scan on push is on), then deploys to ECS. The pipeline must NOT deploy any image that has CRITICAL vulnerabilities. What should the DevOps engineer add?",
    options: [
      { t: "A CodeBuild action after the push that runs 'aws ecr wait image-scan-complete', then reads 'aws ecr describe-image-scan-findings' and fails the build if the CRITICAL count is above zero.",
        why: "Correct. The pipeline stops before the deploy stage when the scan finds critical issues. This is the common exam pattern for a security gate." },
      { t: "A lifecycle policy that expires images with critical findings.",
        why: "Lifecycle rules select images by tag, age, or count, not by scan findings." },
      { t: "Turn on tag immutability.",
        why: "This doesn't evaluate vulnerabilities." },
      { t: "A manual approval action, and ask approvers to check the console.",
        why: "Manual, slow, and error-prone. An automated gate is expected." }
    ],
    answer: [0],
    tip: "Security gate in CI/CD → wait for the scan + check findings in CodeBuild → fail the stage."
  },
  {
    id: "ecr-08", domain: "d1", topic: "ECR",
    q: "Enhanced scanning is turned on for all repositories. The security team wants an email within minutes whenever a CRITICAL vulnerability is found in any image. What should be configured?",
    options: [
      { t: "An EventBridge rule for Amazon Inspector 'Inspector2 Finding' events with severity CRITICAL (ECR resource type), targeting an SNS topic.",
        why: "Correct. With enhanced scanning, findings come from Inspector (source aws.inspector2), and EventBridge can route them to SNS." },
      { t: "An EventBridge rule for the 'ECR Image Scan' event.",
        why: "That event is for BASIC scanning. Enhanced scanning results are sent as Inspector events." },
      { t: "A CloudWatch alarm on the ECR RepositoryPullCount metric.",
        why: "Unrelated to vulnerabilities." },
      { t: "An AWS Trusted Advisor check.",
        why: "Trusted Advisor doesn't report image CVEs." }
    ],
    answer: [0],
    tip: "Basic → 'ECR Image Scan' event (aws.ecr). Enhanced → 'Inspector2 Finding' event (aws.inspector2)."
  },
  {
    id: "ecr-09", domain: "d1", topic: "ECR",
    q: "Workloads run in us-east-1 and, for disaster recovery, in eu-west-1. Images are pushed only to us-east-1. The eu-west-1 workloads must be able to pull images from their own Region, even if us-east-1 is down. What is the SIMPLEST solution?",
    options: [
      { t: "Add a step to the pipeline that pulls each image and pushes it to eu-west-1.",
        why: "It works, but it's custom pipeline work that ECR does natively." },
      { t: "Configure an ECR replication rule in the us-east-1 registry with eu-west-1 as the destination.",
        why: "Correct. Registry-level cross-Region replication copies every newly pushed image automatically." },
      { t: "Use S3 Cross-Region Replication on the ECR storage bucket.",
        why: "You can't access ECR's underlying storage." },
      { t: "Back up the repositories with AWS Backup and restore them in eu-west-1 during a disaster.",
        why: "AWS Backup doesn't protect ECR repositories, and restoring during a disaster is slow." }
    ],
    answer: [1],
    tip: "Images in another Region for DR or latency → ECR cross-Region replication (registry setting)."
  },
  {
    id: "ecr-10", domain: "d1", topic: "ECR",
    q: "Cross-Region replication to us-west-2 was configured yesterday. Images pushed today appear in us-west-2, but images pushed LAST WEEK do not. What explains this?",
    options: [
      { t: "Replication only copies images pushed after the replication configuration was created. Existing images must be pushed again.",
        why: "Correct. ECR replication isn't retroactive." },
      { t: "Replication only works for images tagged latest.",
        why: "No such limit. Repository filters work on repository names, not tags." },
      { t: "The lifecycle policy in us-west-2 deleted them.",
        why: "They never arrived, and lifecycle policies aren't copied by replication anyway." },
      { t: "Replication runs once a week.",
        why: "Replication happens shortly after each push." }
    ],
    answer: [0],
    tip: "Replication isn't retroactive, and deletions aren't replicated."
  },
  {
    id: "ecr-11", domain: "d1", topic: "ECR",
    multi: true,
    q: "Images pushed to ECR in a Build account (111122223333) must be copied automatically to ECR in a separate Prod account (444455556666) in the same Region. Which TWO steps are required? (Choose TWO.)",
    options: [
      { t: "In the Build account, create a replication rule whose destination is account 444455556666 and the Region.",
        why: "Correct. Replication is configured in the SOURCE registry, with the destination account and Region." },
      { t: "In the Prod account, add a registry permissions policy that allows account 111122223333 to perform ecr:CreateRepository and ecr:ReplicateImage.",
        why: "Correct. The destination registry must allow the source account to create repositories and replicate images." },
      { t: "Share the repositories with the Prod account using AWS RAM.",
        why: "ECR doesn't use RAM for this." },
      { t: "Add a repository policy in the Build account that allows Prod to pull.",
        why: "That's for cross-account PULL, not replication." },
      { t: "Create a CodePipeline in the Prod account that polls the Build account's repositories.",
        why: "Unnecessary. ECR replication is native." }
    ],
    answer: [0, 1],
    tip: "Cross-account replication = replication rule (source) + registry permissions policy (destination)."
  },
  {
    id: "ecr-12", domain: "d1", topic: "ECR",
    q: "ECS Fargate tasks in Account B must pull an image from an ECR repository in Account A, in the same Region. No copies of the image should be made. Which configuration is required?",
    options: [
      { t: "A repository policy in Account A that allows Account B's task execution role the pull actions, plus IAM permissions on that execution role (ecr:GetAuthorizationToken and the pull actions).",
        why: "Correct. Cross-account pull needs the resource policy in A AND the IAM permissions in B. Add KMS key access if a customer-managed key is used." },
      { t: "Only an IAM policy on Account B's execution role.",
        why: "Without the repository policy in Account A, the request is denied." },
      { t: "Cross-account replication from A to B.",
        why: "That makes copies, which the requirement rules out." },
      { t: "Grant the pull permissions to the ECS TASK role.",
        why: "Fargate uses the task EXECUTION role to pull images. The task role is for the application's own AWS calls." }
    ],
    answer: [0],
    tip: "Cross-account pull = repository policy (owner) + execution role IAM (consumer). The execution role pulls, not the task role."
  },
  {
    id: "ecr-13", domain: "d1", topic: "ECR",
    q: "ECS Fargate tasks run in private subnets with no NAT gateway and fail with CannotPullContainerError. The company does not allow internet access. What should the DevOps engineer create?",
    options: [
      { t: "Interface VPC endpoints for ecr.api and ecr.dkr, an S3 gateway endpoint, and a CloudWatch Logs interface endpoint if the tasks use awslogs.",
        why: "Correct. ECR needs both interface endpoints, and image layers are downloaded from S3." },
      { t: "Only an ecr.dkr interface endpoint.",
        why: "Without ecr.api (the login token) and S3 (the image layers), pulls still fail." },
      { t: "Turn on 'Assign public IP' on the tasks.",
        why: "This needs an internet route and goes against the no-internet policy." },
      { t: "A NAT gateway.",
        why: "It works technically, but it breaks the no-internet requirement." }
    ],
    answer: [0],
    tip: "ECR privately = ecr.api + ecr.dkr + S3 gateway (+ logs)."
  },
  {
    id: "ecr-14", domain: "d1", topic: "ECR",
    q: "CodeBuild builds often fail with 'toomanyrequests: You have reached your pull rate limit' when pulling base images from Docker Hub. The team wants a managed fix that also lets builds in private subnets get these images. What should they do?",
    options: [
      { t: "Create an ECR pull-through cache rule for Docker Hub (with Docker Hub credentials in Secrets Manager) and change the FROM lines to the ECR cache path.",
        why: "Correct. The first pull fetches from Docker Hub, and later pulls come from your private ECR. That avoids rate limits and works through the ECR VPC endpoints." },
      { t: "Use a larger CodeBuild compute type.",
        why: "Rate limits apply per account or IP, not per CPU." },
      { t: "Turn on the CodeBuild local Docker layer cache.",
        why: "It may reduce some pulls, but it's best-effort and doesn't solve rate limits reliably." },
      { t: "A cron job that docker-pulls and re-pushes every base image to ECR.",
        why: "Custom work to maintain, which the pull-through cache replaces." }
    ],
    answer: [0],
    tip: "Docker Hub rate limits or upstream images in private subnets → ECR pull-through cache."
  },
  {
    id: "ecr-15", domain: "d1", topic: "ECR",
    q: "An ECR repository was created with the default AES-256 encryption. A new rule requires all images to be encrypted with a customer-managed KMS key. What should the DevOps engineer do?",
    options: [
      { t: "Update the repository's encryption configuration to the customer-managed key.",
        why: "A repository's encryption setting is fixed at creation and can't be changed." },
      { t: "Create a new repository encrypted with the customer-managed key, push (or replicate) the images into it, and point the deployments at it.",
        why: "Correct. A new repository is the only way to change the encryption key." },
      { t: "Re-encrypt the image layers with KMS ReEncrypt.",
        why: "You can't access the layers' storage directly." },
      { t: "Turn on tag immutability so ECR re-encrypts the images.",
        why: "Unrelated to encryption." }
    ],
    answer: [1],
    tip: "ECR encryption (like a CodeArtifact domain key) is set at creation → new repository + migrate."
  },
  {
    id: "ecr-16", domain: "d1", topic: "ECR",
    q: "Images are replicated from a Build account into a DR account. Security requires that every repository created in the DR account by replication uses the DR account's KMS key, has tag immutability on, and gets the standard lifecycle policy, without manual steps. What should be used?",
    options: [
      { t: "Lifecycle and immutability settings are copied automatically from the source repositories.",
        why: "Replication doesn't copy lifecycle policies, repository policies, or tag immutability." },
      { t: "An ECR repository creation template in the DR account that matches the replicated repository prefix and defines the KMS key, tag immutability, and lifecycle policy.",
        why: "Correct. Creation templates apply settings to repositories that ECR creates automatically through replication or pull-through cache." },
      { t: "An EventBridge rule plus a Lambda function that fixes each new repository after it is created.",
        why: "It works but needs custom code, and the encryption setting can't be changed after the repository is created." },
      { t: "An AWS Config rule with automatic remediation.",
        why: "Config can't change a repository's encryption after creation. It's reactive and more work." }
    ],
    answer: [1],
    tip: "Settings for automatically created repositories (replication or pull-through cache) → repository creation templates."
  },
  {
    id: "ecr-17", domain: "d1", topic: "ECR",
    q: "A CodeBuild project in Account B must use a custom build environment image stored in an ECR repository in Account A. The project fails at PROVISIONING because it can't pull the image. What must be added in Account A?",
    options: [
      { t: "A repository policy that allows the CodeBuild service principal (codebuild.amazonaws.com) the pull actions, optionally limited with aws:SourceAccount / aws:SourceArn conditions for Account B's project.",
        why: "Correct. The CodeBuild service itself pulls the environment image, so the repository policy in the image's account must allow the CodeBuild service principal." },
      { t: "Nothing. An IAM policy on Account B's CodeBuild service role is enough.",
        why: "Across accounts, the repository owner must also allow access through the repository policy." },
      { t: "Make the repository public.",
        why: "Private ECR repositories can't be made public. That would be ECR Public, and it's insecure for internal images." },
      { t: "Replicate the repository to Account B.",
        why: "It works, but it creates copies. The minimal fix is the repository policy." }
    ],
    answer: [0],
    tip: "Cross-account custom CodeBuild image → repository policy allowing codebuild.amazonaws.com."
  },
  {
    id: "ecr-18", domain: "d1", topic: "ECR",
    q: "Pods on a new Amazon EKS managed node group fail with ImagePullBackOff when pulling images from ECR in the same account. The VPC has a NAT gateway. What is the MOST likely fix?",
    options: [
      { t: "Attach the AmazonEC2ContainerRegistryReadOnly policy to the node group's IAM role.",
        why: "Correct. On EKS EC2 nodes, the kubelet pulls images using the node IAM role." },
      { t: "Add ECR permissions to an ECS task execution role.",
        why: "Task execution roles belong to ECS, not EKS." },
      { t: "Run docker login on every node with a cron job.",
        why: "Manual and fragile. The node role provides credentials automatically." },
      { t: "Turn on tag immutability.",
        why: "Unrelated to pull permissions." }
    ],
    answer: [0],
    tip: "Who pulls: ECS → task execution role · EKS nodes → node IAM role · CodeBuild or Lambda → the service principal."
  },
  {
    id: "ecr-19", domain: "d1", topic: "ECR",
    q: "Security policy says images with CRITICAL vulnerabilities must NEVER be stored in ECR, not even briefly. Which approach meets this requirement?",
    options: [
      { t: "In the CodeBuild stage, generate an SBOM with the Amazon Inspector SBOM generator, scan it with the Inspector ScanSbom API (or use the CodePipeline InspectorScan action), and fail the build before docker push if critical findings exist.",
        why: "Correct. Scanning BEFORE pushing stops vulnerable images from ever reaching the registry." },
      { t: "Turn on basic scan on push and delete images with critical findings.",
        why: "The image is stored first and scanned afterwards, which breaks the 'never stored' rule." },
      { t: "Turn on enhanced continuous scanning.",
        why: "Still scans after the push." },
      { t: "Use a lifecycle policy to expire vulnerable images.",
        why: "Lifecycle rules can't select images by vulnerability, and the image would already be stored." }
    ],
    answer: [0],
    tip: "\"Never stored\" → scan in the build before push (Inspector SBOM generator / ScanSbom / InspectorScan action)."
  },
  {
    id: "ecr-20", domain: "d1", topic: "ECR",
    q: "A company with 60 AWS accounts in AWS Organizations wants ECR enhanced scanning turned on in every account, with all findings visible to the security team in one account. What should be done?",
    options: [
      { t: "Designate the security account as the Amazon Inspector delegated administrator, and turn on ECR scanning for all member accounts from there.",
        why: "Correct. The Inspector delegated administrator manages scanning and collects findings across the whole Organization." },
      { t: "Sign in to each account and turn on enhanced scanning by hand.",
        why: "Operational overhead, and findings stay scattered across accounts." },
      { t: "Replicate all images to the security account and scan them there.",
        why: "Copies everything and misses images that aren't replicated." },
      { t: "Use an SCP that requires scanning.",
        why: "SCPs restrict permissions. They can't turn on or configure services." }
    ],
    answer: [0],
    tip: "Organization-wide Inspector → delegated administrator."
  },
  {
    id: "ecr-21", domain: "d1", topic: "ECR",
    q: "Enhanced scanning reports a MEDIUM vulnerability in a base image library. The security team has reviewed it and accepted the risk. They want it hidden from the active findings view and from alerts, without turning off scanning. What should they use?",
    options: [
      { t: "An Amazon Inspector suppression rule that matches that vulnerability (and resource).",
        why: "Correct. Suppression rules mark matching findings as Suppressed, so they're hidden from active views and alerts while scanning continues." },
      { t: "Switch the repository back to basic scanning.",
        why: "This loses language-package coverage for every image." },
      { t: "Delete the image.",
        why: "The image is still needed. Deleting it doesn't record an accepted risk." },
      { t: "Disable the EventBridge rule for all findings.",
        why: "This would silence every alert, including new critical ones." }
    ],
    answer: [0],
    tip: "Accepted-risk findings → Inspector suppression rules."
  },
  {
    id: "ecr-22", domain: "d1", topic: "ECR",
    q: "An image used by a running ECS service disappeared from its ECR repository. New tasks now fail to start. The team must find out whether a lifecycle policy or a person deleted it. Where should they look?",
    options: [
      { t: "AWS CloudTrail: lifecycle policy deletions appear as PolicyExecutionEvent, and manual or scripted deletions appear as BatchDeleteImage with the caller's identity.",
        why: "Correct. CloudTrail records both, so you can tell automation from people." },
      { t: "The ECS service event log.",
        why: "It shows the pull failure, not who deleted the image." },
      { t: "CloudWatch Container Insights.",
        why: "Performance metrics. It has no audit trail of image deletions." },
      { t: "The repository's scan findings.",
        why: "Scan findings say nothing about deletions." }
    ],
    answer: [0],
    tip: "Image deleted? CloudTrail: PolicyExecutionEvent = lifecycle, BatchDeleteImage = person or script. Protect release tags from count rules."
  },
  {
    id: "ecr-23", domain: "d1", topic: "ECR",
    q: "Self-hosted build servers on EC2 run docker login to ECR once at boot. After about 12 hours, every docker push fails with an authorization error. What is the BEST long-term fix?",
    options: [
      { t: "Install and configure the Amazon ECR Docker credential helper so Docker gets fresh ECR credentials from the instance role automatically.",
        why: "Correct. ECR login tokens last 12 hours. The credential helper removes the need for docker login altogether." },
      { t: "Raise the ECR token lifetime to 7 days.",
        why: "The 12-hour token lifetime can't be changed." },
      { t: "Store a long-term ECR password in Secrets Manager.",
        why: "ECR doesn't use long-term passwords. Authentication comes from IAM." },
      { t: "Make the repository public.",
        why: "Insecure, and private repositories can't simply be made public." }
    ],
    answer: [0],
    tip: "ECR token = 12 hours. Long-running hosts → ECR credential helper."
  },
  {
    id: "ecr-24", domain: "d1", topic: "ECR",
    q: "A lifecycle policy rule must expire images tagged with EITHER the prefix 'dev-' OR the prefix 'test-' when there are more than 10 of them. The engineer wrote one rule with tagPrefixList [\"dev-\", \"test-\"], but nothing is ever expired. Why, and what is the fix?",
    options: [
      { t: "When a rule lists several prefixes, an image must match ALL of them. Create two separate rules, one for dev- and one for test-.",
        why: "Correct. Several entries in one rule mean AND, not OR. Separate rules give the OR behaviour." },
      { t: "Lifecycle policies only support tagStatus untagged.",
        why: "Tagged rules with prefixes and patterns are supported." },
      { t: "tagPrefixList requires wildcards such as dev-*.",
        why: "Prefix lists match the start of a tag without wildcards. Wildcards are for tagPatternList." },
      { t: "Lifecycle policies take 30 days to start working.",
        why: "Expiry happens within about 24 hours of an image meeting the rule." }
    ],
    answer: [0],
    tip: "Several prefixes or patterns in one rule = the image must match all of them. Use separate rules for OR."
  },

  // ───────────────────────────── CodePipeline ─────────────────────────────
  {
    id: "cp-01", domain: "d1", topic: "CodePipeline",
    q: "A pipeline in a Tools account deploys a CloudFormation stack into a Prod account using a cross-account role. The deploy action fails with a KMS AccessDenied error when reading the input artifact. The artifact bucket uses the default encryption key. What should the DevOps engineer do?",
    options: [
      { t: "Re-encrypt the artifact bucket with a customer-managed KMS key whose key policy allows the Prod account's role, and allow that role in the bucket policy.",
        why: "Correct. The AWS-managed aws/s3 key's policy can't be changed to allow another account. Cross-account pipelines need a customer-managed key shared with the target account." },
      { t: "Give the Prod role the AmazonS3FullAccess managed policy.",
        why: "S3 permissions don't help. The failure is on KMS decryption, and the default key can't be shared." },
      { t: "Turn off encryption on the artifact bucket.",
        why: "Artifacts are always encrypted, and turning encryption off would break security requirements anyway." },
      { t: "Copy the artifacts into the Prod account with S3 replication.",
        why: "Unnecessary and complicated. CodePipeline reads artifacts from its own artifact store." }
    ],
    answer: [0],
    tip: "Cross-account pipeline + KMS error → customer-managed key + key policy + bucket policy."
  },
  {
    id: "cp-02", domain: "d1", topic: "CodePipeline",
    q: "A pipeline has manual approval actions for both the Test and Prod stages. Developers may approve Test, but ONLY the ReleaseManagers group may approve Prod. How should this be enforced?",
    options: [
      { t: "Give the ReleaseManagers group codepipeline:PutApprovalResult on the ARN of the Prod approval action only (pipeline/stage/action), and give developers that permission only on the Test approval action.",
        why: "Correct. PutApprovalResult can be limited to a specific approval action's ARN." },
      { t: "Send the Prod approval SNS notification only to ReleaseManagers.",
        why: "Notifications control who is told, not who is allowed to approve. Anyone with the permission could still approve." },
      { t: "Add a resource policy to the pipeline that names the approvers.",
        why: "CodePipeline uses IAM identity policies for this, not pipeline resource policies." },
      { t: "Use a Lambda function to reject any approval not made by a release manager.",
        why: "Custom and reactive. IAM already controls this natively." }
    ],
    answer: [0],
    tip: "Who can approve = IAM codepipeline:PutApprovalResult on that action's ARN."
  },
  {
    id: "cp-03", domain: "d1", topic: "CodePipeline",
    q: "A release was waiting at a manual approval action while the approvers were on holiday. When they came back 8 days later, the execution showed as Failed at the approval stage. What happened?",
    options: [
      { t: "Manual approval actions time out after 7 days without a response, which fails the action.",
        why: "Correct. An approval left unanswered for 7 days fails, and you must start a new execution or retry the stage." },
      { t: "A newer execution superseded it.",
        why: "A superseded execution shows as Superseded, not Failed." },
      { t: "The SNS topic was deleted.",
        why: "The SNS topic only sends notifications. Its absence doesn't fail the approval." },
      { t: "Approval actions fail if they aren't approved within 24 hours.",
        why: "The timeout is 7 days, not 24 hours." }
    ],
    answer: [0],
    tip: "Manual approval timeout = 7 days → the action fails."
  },
  {
    id: "cp-04", domain: "d1", topic: "CodePipeline",
    q: "Before any infrastructure change is applied to production, a senior engineer must review exactly which resources CloudFormation will add, modify, or replace. How should the pipeline be designed?",
    options: [
      { t: "A CloudFormation action with CHANGE_SET_REPLACE, then a manual approval action (with a link to the change set), then a CloudFormation action with CHANGE_SET_EXECUTE.",
        why: "Correct. The change set shows the exact planned changes. Approval happens before it is run." },
      { t: "A CloudFormation action in CREATE_UPDATE mode followed by a manual approval.",
        why: "CREATE_UPDATE applies the change immediately, so the review would come too late." },
      { t: "Turn on drift detection on the stack.",
        why: "Drift detection compares the stack with its actual resources. It doesn't preview new template changes." },
      { t: "Use REPLACE_ON_FAILURE mode.",
        why: "That deletes and recreates failed stacks. It provides no review." }
    ],
    answer: [0],
    tip: "Review before applying → CHANGE_SET_REPLACE → approval → CHANGE_SET_EXECUTE."
  },
  {
    id: "cp-05", domain: "d1", topic: "CodePipeline",
    q: "A CloudFormation deploy action deploys an AWS SAM template and fails with: \"Requires capabilities: [CAPABILITY_AUTO_EXPAND]\". What is the fix?",
    options: [
      { t: "Add CAPABILITY_AUTO_EXPAND (with CAPABILITY_IAM) to the action's Capabilities setting.",
        why: "Correct. SAM templates use the Serverless transform, a kind of macro, which requires CAPABILITY_AUTO_EXPAND." },
      { t: "Give the pipeline service role iam:* permissions.",
        why: "The error is about an acknowledgment (capability) that is missing, not about IAM permissions." },
      { t: "Change ActionMode to REPLACE_ON_FAILURE.",
        why: "The action mode doesn't change which capabilities are required." },
      { t: "Remove the Transform line from the template.",
        why: "Then it is no longer a SAM template and won't deploy as intended." }
    ],
    answer: [0],
    tip: "SAM or macros → CAPABILITY_AUTO_EXPAND. IAM resources → CAPABILITY_IAM / CAPABILITY_NAMED_IAM."
  },
  {
    id: "cp-06", domain: "d1", topic: "CodePipeline",
    q: "A GitHub monorepo contains several services. The payments pipeline (a CodeConnections source) currently runs on every push to main, even when only other services change. It should run only when files under services/payments/ change. What is the solution with the LEAST effort?",
    options: [
      { t: "Use a V2 pipeline with a push trigger on main and a file path include filter of services/payments/**.",
        why: "Correct. V2 triggers support filtering by branch and file path natively." },
      { t: "Add a first CodeBuild step that checks git diff and stops the pipeline when payments didn't change.",
        why: "It works, but the pipeline still starts and costs money, and it's custom logic." },
      { t: "Split the monorepo into one repository per service.",
        why: "A big restructure that isn't needed." },
      { t: "Turn on polling with a 1-minute interval.",
        why: "Polling can't filter on file paths, and it's legacy." }
    ],
    answer: [0],
    tip: "Monorepo folder filter → V2 trigger with file paths."
  },
  {
    id: "cp-07", domain: "d1", topic: "CodePipeline",
    q: "A team wants the production release pipeline to start ONLY when a Git tag matching v* (for example v2.3.0) is pushed to the GitHub repository, not on ordinary commits. What should be configured?",
    options: [
      { t: "A V2 pipeline trigger on the CodeConnections source with a Git tags include filter of v*.",
        why: "Correct. V2 triggers can start pipelines on tag pushes that match patterns." },
      { t: "A V1 pipeline with a branch named v*.",
        why: "V1 tracks one branch and has no tag triggers." },
      { t: "An EventBridge rule on CodeCommit referenceCreated events.",
        why: "The source is GitHub, not CodeCommit." },
      { t: "A manual approval before every deploy.",
        why: "Adds human steps, and the pipeline still starts on every commit." }
    ],
    answer: [0],
    tip: "Release on a tag → V2 Git tag trigger."
  },
  {
    id: "cp-08", domain: "d1", topic: "CodePipeline",
    q: "Audit rules require that EVERY commit merged to main is deployed to production in order, with no commit skipped. Currently, when several commits arrive quickly, some executions show as 'Superseded'. What should be changed?",
    options: [
      { t: "Switch the pipeline to type V2 with the QUEUED execution mode.",
        why: "Correct. QUEUED processes executions one by one in order, without superseding any." },
      { t: "Use the PARALLEL execution mode.",
        why: "PARALLEL runs executions at the same time, so the deployment order isn't guaranteed." },
      { t: "Keep SUPERSEDED and slow down merges.",
        why: "Not a reliable control." },
      { t: "Add a manual approval to each stage.",
        why: "Executions waiting at a stage can still be superseded in SUPERSEDED mode." }
    ],
    answer: [0],
    tip: "SUPERSEDED (default) = latest wins · QUEUED = every one, in order · PARALLEL = at the same time."
  },
  {
    id: "cp-09", domain: "d1", topic: "CodePipeline",
    q: "A pipeline validates feature branches. Developers on different branches push at the same time and don't want to wait for each other's runs or have runs replaced. Which execution mode fits BEST?",
    options: [
      { t: "SUPERSEDED", why: "Newer executions would replace waiting ones, so developers would lose validation runs." },
      { t: "QUEUED", why: "Runs one at a time, so developers wait for each other." },
      { t: "PARALLEL (V2)", why: "Correct. Each execution runs on its own, at the same time as the others." },
      { t: "Disable stage transitions", why: "That stops progress. It doesn't make runs concurrent." }
    ],
    answer: [2],
    tip: "Independent concurrent runs (feature branches, PR checks) → PARALLEL."
  },
  {
    id: "cp-10", domain: "d1", topic: "CodePipeline",
    q: "After the Prod deploy stage succeeds, the team wants the pipeline to AUTOMATICALLY roll that stage back to the last successful release if a CloudWatch 5xx-errors alarm goes into ALARM shortly afterwards. The deploy uses CloudFormation. What should they use?",
    options: [
      { t: "A V2 stage condition (on success) with a CloudWatchAlarm rule and a ROLLBACK result on the Prod stage.",
        why: "Correct. V2 conditions can check alarms after a stage and roll it back to the last successful execution's source revisions." },
      { t: "A Lambda function triggered by the alarm that redeploys an older template version.",
        why: "Custom code. V2 provides this natively." },
      { t: "Disable the transition into Prod when the alarm goes off.",
        why: "That stops future runs. It doesn't roll back what is already deployed." },
      { t: "A manual approval after Prod.",
        why: "Manual, and it doesn't roll anything back automatically." }
    ],
    answer: [0],
    tip: "Automatic rollback in the pipeline → V2 conditions (CloudWatchAlarm) + ROLLBACK. CodeDeploy also has its own alarm-based rollback."
  },
  {
    id: "cp-11", domain: "d1", topic: "CodePipeline",
    q: "A Lambda function used as a pipeline Invoke action finishes its work in about 3 seconds, but the action stays 'In progress' until it times out and fails. What is the MOST likely cause?",
    options: [
      { t: "The function doesn't call codepipeline:PutJobSuccessResult (or PutJobFailureResult) with the job ID.",
        why: "Correct. CodePipeline waits for the function to report the job result. Without it, the action times out. The function's role also needs those permissions." },
      { t: "The Lambda function's timeout is too short.",
        why: "The function finishes successfully. The problem is that it never reports back." },
      { t: "Invoke actions only support Step Functions.",
        why: "Lambda is a supported Invoke provider." },
      { t: "The artifact bucket isn't encrypted.",
        why: "Unrelated to how a job result is reported." }
    ],
    answer: [0],
    tip: "Lambda invoke action → must call PutJobSuccessResult / PutJobFailureResult."
  },
  {
    id: "cp-12", domain: "d1", topic: "CodePipeline",
    q: "A pipeline uses the standard Amazon ECS deploy action (a rolling update) after a CodeBuild stage that builds and pushes the image. The deploy action fails, saying a required file is missing from the input artifact. What should CodeBuild produce?",
    options: [
      { t: "imagedefinitions.json containing the container name and the new imageUri.",
        why: "Correct. The ECS rolling deploy action reads imagedefinitions.json to update the service's task definition." },
      { t: "appspec.yaml, taskdef.json and imageDetail.json.",
        why: "Those are for the CodeDeployToECS BLUE/GREEN action, not the standard ECS action." },
      { t: "buildspec.yml.",
        why: "The buildspec is used by CodeBuild, not by the deploy action." },
      { t: "A Dockerfile.",
        why: "The image is already built. The deploy action needs the image reference." }
    ],
    answer: [0],
    tip: "ECS rolling → imagedefinitions.json · ECS blue/green (CodeDeploy) → imageDetail.json + appspec.yaml + taskdef.json."
  },
  {
    id: "cp-13", domain: "d1", topic: "CodePipeline",
    multi: true,
    q: "A pipeline in us-east-1 must also deploy to eu-west-1 using a CloudFormation action configured for that Region. Artifacts must be encrypted with customer-managed KMS keys. Which TWO configurations are required? (Choose TWO.)",
    options: [
      { t: "Define artifactStores with an S3 artifact bucket for EACH Region the pipeline uses.",
        why: "Correct. Cross-Region actions need an artifact store in their Region. CodePipeline copies the artifacts there." },
      { t: "Use a KMS key in each Region for that Region's artifact bucket (or a multi-Region key).",
        why: "Correct. KMS keys are regional, so each Region's store needs a key it can use." },
      { t: "Add a separate source action in eu-west-1.",
        why: "Source actions must be in the pipeline's own Region. Artifacts are copied automatically." },
      { t: "Set up S3 Cross-Region Replication between the artifact buckets.",
        why: "CodePipeline copies artifacts itself. Replication isn't needed." },
      { t: "Create a second pipeline in eu-west-1.",
        why: "Not required. One pipeline can have cross-Region actions." }
    ],
    answer: [0, 1],
    tip: "Cross-Region = one artifact bucket + key per Region (artifactStores). Source stays in the pipeline's Region."
  },
  {
    id: "cp-14", domain: "d1", topic: "CodePipeline",
    q: "A pipeline that runs dozens of times a day has an artifact bucket that has grown to several terabytes over a year. Nobody needs artifacts older than 30 days. What should the DevOps engineer do?",
    options: [
      { t: "Add an S3 lifecycle rule to the artifact bucket that expires objects after 30 days.",
        why: "Correct. CodePipeline never deletes old artifacts. A lifecycle rule handles it automatically." },
      { t: "Turn on the pipeline's artifact retention setting.",
        why: "CodePipeline has no such setting." },
      { t: "Delete and recreate the pipeline each month.",
        why: "Disruptive, and it doesn't clean the bucket." },
      { t: "Switch the pipeline to type V2.",
        why: "Pipeline type doesn't affect artifact cleanup." }
    ],
    answer: [0],
    tip: "Artifact bucket growing → S3 lifecycle rule."
  },
  {
    id: "cp-15", domain: "d1", topic: "CodePipeline",
    q: "A CodeBuild action runs 'git describe --tags' to calculate the version number, but it fails with 'not a git repository'. The source action is CodeCommit with default settings. What should be changed?",
    options: [
      { t: "Set the source action's output artifact format to CODEBUILD_CLONE_REF (full clone), and give the CodeBuild service role codecommit:GitPull.",
        why: "Correct. The default CODE_ZIP has no .git folder. A full clone gives history and tags." },
      { t: "Add git to the install phase.",
        why: "Git being installed doesn't help: the source has no .git metadata." },
      { t: "Turn on the local source cache.",
        why: "The cache doesn't change the artifact format that the pipeline delivers." },
      { t: "Use S3 as the source.",
        why: "An S3 source has no Git history either." }
    ],
    answer: [0],
    tip: "Build needs Git history or tags → CODEBUILD_CLONE_REF + GitPull / UseConnection on the CodeBuild role."
  },
  {
    id: "cp-16", domain: "d1", topic: "CodePipeline",
    q: "Operators sometimes start a pipeline by hand and need to choose whether it deploys to 'staging' or 'perf'. The default should be 'staging'. Later actions must use the chosen value. What is the BEST approach?",
    options: [
      { t: "A V2 pipeline-level variable TargetEnv with default 'staging', overridden when the execution is started and used as #{variables.TargetEnv} in actions.",
        why: "Correct. Pipeline variables are made for values chosen at start time." },
      { t: "Two copies of the pipeline, one per environment.",
        why: "Duplicated pipelines to maintain." },
      { t: "Edit the pipeline definition before every run.",
        why: "Manual and error-prone, and it changes the pipeline for everyone." },
      { t: "Ask operators to write the value into Parameter Store first.",
        why: "Extra step, and two runs at the same time could clash." }
    ],
    answer: [0],
    tip: "Values chosen at start → V2 pipeline-level variables #{variables.X}."
  },
  {
    id: "cp-17", domain: "d1", topic: "CodePipeline",
    q: "During a two-week holiday change freeze, changes must continue to flow through Build and Test, but NOTHING may be deployed to the Prod stage. The block must be easy to remove afterwards. What should the DevOps engineer do?",
    options: [
      { t: "Disable the inbound transition into the Prod stage, then enable it after the freeze.",
        why: "Correct. A disabled transition holds executions before Prod while earlier stages keep running. (A V2 DeploymentWindow condition is another option.)" },
      { t: "Delete the Prod stage and add it back later.",
        why: "Risky and error-prone, and the configuration could be lost." },
      { t: "Remove the pipeline role's permissions.",
        why: "This breaks every stage, not just Prod." },
      { t: "Turn off the source trigger.",
        why: "This also stops Build and Test." }
    ],
    answer: [0],
    tip: "Hold changes before one stage → disable the transition (or a V2 DeploymentWindow rule)."
  },
  {
    id: "cp-18", domain: "d1", topic: "CodePipeline",
    q: "The manual approval message should show approvers the commit ID and commit message of the change being released. How can this be done without custom code?",
    options: [
      { t: "Give the source action a namespace (for example SourceVariables) and use #{SourceVariables.CommitId} and #{SourceVariables.CommitMessage} in the approval action's CustomData.",
        why: "Correct. Source actions output variables that later actions can reference." },
      { t: "A Lambda function that reads the commit and edits the SNS message.",
        why: "Custom code isn't needed. Variables do this natively." },
      { t: "Turn on CloudTrail and give approvers access to it.",
        why: "Unhelpful for approvers, and not inside the approval message." },
      { t: "Write the commit message into imagedefinitions.json.",
        why: "That file is for ECS deployments, not approvals." }
    ],
    answer: [0],
    tip: "Pass values between actions → namespaces + #{Namespace.Variable}."
  },
  {
    id: "cp-19", domain: "d1", topic: "CodePipeline",
    q: "A pipeline in the Tools account must create CloudFormation stacks in the Prod account. Which setup follows AWS best practice?",
    options: [
      { t: "In Prod: a cross-account role that trusts Tools (set as the action's roleArn) and a CloudFormation deployment role (passed as RoleArn in the action configuration). In Tools: the pipeline role can sts:AssumeRole the cross-account role. Plus a customer-managed KMS key and bucket policy that allow Prod.",
        why: "Correct. This is the standard cross-account CloudFormation pipeline pattern." },
      { t: "Create an IAM user in Prod and store its access keys in the pipeline's environment variables.",
        why: "Long-term credentials. Bad practice and not supported this way." },
      { t: "Share the pipeline with the Prod account through AWS RAM.",
        why: "Pipelines aren't shared with RAM." },
      { t: "Run the pipeline in Prod and let it pull the source from Tools.",
        why: "Possible, but it means a separate pipeline per account and loses central control. It doesn't answer the question asked." }
    ],
    answer: [0],
    tip: "Cross-account CloudFormation = action roleArn (cross-account role) + RoleArn (deployment role) + AssumeRole + PassRole + customer-managed key."
  },
  {
    id: "cp-20", domain: "d1", topic: "CodePipeline",
    q: "A pipeline uses an S3 object (app.zip) as its source. Uploading a new app.zip doesn't start the pipeline, and the source action fails when started by hand. What is MOST likely missing?",
    options: [
      { t: "Versioning on the source bucket (required for an S3 source), and EventBridge (or CloudTrail) change detection for the object.",
        why: "Correct. S3 source actions need a versioned bucket, and event-based detection starts the pipeline." },
      { t: "Public read access on the bucket.",
        why: "Never needed, and insecure. The pipeline uses its IAM role." },
      { t: "S3 Transfer Acceleration.",
        why: "Unrelated to how the pipeline notices changes." },
      { t: "A CodeCommit repository to mirror the bucket.",
        why: "Not needed. S3 is a supported source." }
    ],
    answer: [0],
    tip: "S3 source → bucket versioning + EventBridge / CloudTrail detection."
  },

  // ───────────────────────────── CodeConnections ─────────────────────────────
  {
    id: "con-01", domain: "d1", topic: "CodeConnections",
    q: "A company's pipelines use the GitHub (version 1) source action with a personal access token stored in the pipeline configuration. The security team wants no long-lived GitHub tokens stored in AWS. What should the DevOps engineer do?",
    options: [
      { t: "Create an AWS CodeConnections connection to GitHub (installing the AWS Connector GitHub App) and switch the source actions to the CodeStarSourceConnection provider.",
        why: "Correct. Connections use the provider's app installation instead of stored tokens. GitHub version 1 is deprecated." },
      { t: "Move the personal access token into Secrets Manager and rotate it monthly.",
        why: "Better than plain text, but it's still a long-lived token, and GitHub version 1 is deprecated." },
      { t: "Mirror every GitHub repository into CodeCommit with a scheduled job.",
        why: "Extra moving parts, and the mirror job still needs GitHub credentials." },
      { t: "Use an S3 source and upload the code by hand.",
        why: "Manual and loses automatic change detection." }
    ],
    answer: [0],
    tip: "GitHub, Bitbucket or GitLab source without stored tokens → CodeConnections."
  },
  {
    id: "con-02", domain: "d1", topic: "CodeConnections",
    q: "A CloudFormation stack creates an AWS::CodeStarConnections::Connection for GitHub and a pipeline that uses it. The stack deploys successfully, but the pipeline's source stage fails. The connection status is PENDING. What must be done?",
    options: [
      { t: "Open the connection in the console, choose 'Update pending connection', and complete the authorization with GitHub.",
        why: "Correct. Connections created by CloudFormation or the CLI start as PENDING and need a one-time handshake in the console." },
      { t: "Add DependsOn from the pipeline to the connection.",
        why: "The connection already exists. It just isn't authorized, and the resource order doesn't change that." },
      { t: "Redeploy the stack with a newer template version.",
        why: "It will still be PENDING. CloudFormation can't do the provider authorization." },
      { t: "Grant the pipeline role codestar-connections:*.",
        why: "Permissions don't help while the connection itself is PENDING." }
    ],
    answer: [0],
    tip: "Connection created by IaC or the CLI = PENDING → finish the handshake in the console (it can't be automated)."
  },
  {
    id: "con-03", domain: "d1", topic: "CodeConnections",
    q: "A company runs GitHub Enterprise Server on EC2 in a private subnet with no internet access. CodePipeline must use repositories from this server as a source. What is required?",
    options: [
      { t: "Create a CodeConnections HOST for GitHub Enterprise Server with a VPC configuration (VPC, subnets, security groups, and the TLS certificate if it's self-signed), then create a connection that uses the host.",
        why: "Correct. Hosts let connections reach self-managed servers privately, through network interfaces in your VPC." },
      { t: "Create a normal GitHub connection. It works with any GitHub server.",
        why: "A normal GitHub connection targets github.com. Self-managed servers need a host." },
      { t: "Give the server a public IP address and open it to 0.0.0.0/0.",
        why: "Insecure, and it breaks the private-network requirement." },
      { t: "GitHub Enterprise Server isn't supported, so mirror it to CodeCommit.",
        why: "It IS supported, through a host." }
    ],
    answer: [0],
    tip: "Self-managed GitHub Enterprise Server or GitLab → host (with a VPC configuration for private networks)."
  },
  {
    id: "con-04", domain: "d1", topic: "CodeConnections",
    q: "A team's code is in Azure DevOps Repos. They want CodePipeline to deploy each new commit on main automatically. What is the BEST approach?",
    options: [
      { t: "Create a CodeConnections connection of type Azure DevOps.",
        why: "Azure DevOps isn't a supported CodeConnections provider." },
      { t: "Have an Azure DevOps pipeline zip the code and upload it to a versioned S3 bucket that is the CodePipeline S3 source (or mirror the code to CodeCommit).",
        why: "Correct. For unsupported providers, hand the code to a supported source: S3 (or CodeCommit)." },
      { t: "Use the GitHub version 1 action with an Azure DevOps token.",
        why: "That action only works with GitHub, and it's deprecated." },
      { t: "Create a CodeConnections host pointing at dev.azure.com.",
        why: "Hosts are only for GitHub Enterprise Server and GitLab self-managed." }
    ],
    answer: [1],
    tip: "Supported providers: GitHub, GitHub Enterprise Server, Bitbucket Cloud, GitLab (cloud and self-managed). Anything else → S3 or CodeCommit."
  },
  {
    id: "con-05", domain: "d1", topic: "CodeConnections",
    q: "A pipeline's GitHub source action (through a connection) uses OutputArtifactFormat CODEBUILD_CLONE_REF. The source stage succeeds, but the CodeBuild action fails with an access denied error when cloning. What should be fixed?",
    options: [
      { t: "Add codestar-connections:UseConnection (and codeconnections:UseConnection) for the connection to the CodeBuild service role.",
        why: "Correct. With CODEBUILD_CLONE_REF, CodeBuild clones the repository itself through the connection, so its role needs UseConnection." },
      { t: "Add UseConnection to the developer's IAM user.",
        why: "The developer isn't the one cloning. The CodeBuild role is." },
      { t: "Switch the connection to PENDING and authorize it again.",
        why: "The connection already works, because the source stage succeeded." },
      { t: "Turn on privileged mode.",
        why: "Privileged mode is for Docker, not Git access." }
    ],
    answer: [0],
    tip: "CODEBUILD_CLONE_REF → CodeBuild role needs UseConnection."
  },
  {
    id: "con-06", domain: "d1", topic: "CodeConnections",
    q: "One CodeConnections connection is installed for the whole GitHub organization. The payments team's pipeline role must ONLY be able to access the my-org/payments repository through it. How should this be enforced?",
    options: [
      { t: "Allow UseConnection on the connection with the condition codestar-connections:FullRepositoryId = my-org/payments.",
        why: "Correct. The FullRepositoryId condition key limits which repositories a role can reach through a connection." },
      { t: "Create a separate GitHub organization for the payments team.",
        why: "A big change on the GitHub side when IAM can do this." },
      { t: "Set BranchName to main in the source action.",
        why: "That chooses the branch to build. It doesn't stop the role from using other repositories." },
      { t: "Use a repository policy on the GitHub repository.",
        why: "AWS can't enforce GitHub-side policies. Access through the connection is controlled by IAM." }
    ],
    answer: [0],
    tip: "Limit a role to specific repositories → condition key codestar-connections:FullRepositoryId."
  },
  {
    id: "con-07", domain: "d1", topic: "CodeConnections",
    q: "A developer with permission to create pipelines gets AccessDenied when creating a pipeline whose source action references an existing connection. The pipeline role already has UseConnection. Which permission does the DEVELOPER need?",
    options: [
      { t: "codestar-connections:PassConnection (and the codeconnections: equivalent) on the connection.",
        why: "Correct. Attaching a connection to a pipeline needs PassConnection, similar to iam:PassRole for roles." },
      { t: "codestar-connections:CreateConnection",
        why: "The connection already exists. They're attaching it, not creating it." },
      { t: "codestar-connections:DeleteConnection",
        why: "Unrelated to creating pipelines." },
      { t: "sts:AssumeRole on the connection.",
        why: "Connections aren't roles and can't be assumed." }
    ],
    answer: [0],
    tip: "UseConnection = a service using it · PassConnection = a person or tool attaching it to a resource."
  },
  {
    id: "con-08", domain: "d1", topic: "CodeConnections",
    q: "An IAM policy allows codestar-connections:UseConnection on arn:aws:codestar-connections:...:connection/*. A NEW connection created recently has an ARN starting with arn:aws:codeconnections:, and the pipeline using it fails with an authorization error. What is the fix?",
    options: [
      { t: "Also allow codeconnections:UseConnection on the arn:aws:codeconnections:...:connection/* resource, because the service was renamed and new connections use the new prefix.",
        why: "Correct. After the rename from CodeStar Connections to CodeConnections, policies should cover both prefixes and ARN formats." },
      { t: "Delete the new connection and recreate it with the old name.",
        why: "You can't choose the old ARN format. New connections use the new one." },
      { t: "Add AdministratorAccess to the pipeline role.",
        why: "Too much permission. Just add the correct actions and ARN." },
      { t: "Authorize the connection again in the console.",
        why: "The connection is fine. The IAM policy simply doesn't match its ARN." }
    ],
    answer: [0],
    tip: "Renamed service → include both codestar-connections: and codeconnections: in policies."
  },
  {
    id: "con-09", domain: "d1", topic: "CodeConnections",
    q: "When creating a CodePipeline source action with a working GitHub connection, the repository my-org/new-service does not appear in the repository list, although other repositories do. What is the MOST likely cause?",
    options: [
      { t: "The AWS Connector GitHub App was installed for 'selected repositories' only, and new-service isn't one of them. Add it to the app installation on GitHub.",
        why: "Correct. A connection can only see the repositories that the app installation was granted." },
      { t: "Connections can see at most 10 repositories.",
        why: "No such limit." },
      { t: "The repository must be public.",
        why: "Private repositories are supported." },
      { t: "The pipeline must be type V2.",
        why: "The pipeline type doesn't affect which repositories are visible." }
    ],
    answer: [0],
    tip: "Repository missing → add it to the provider app installation (selected repositories)."
  },
  {
    id: "con-10", domain: "d1", topic: "CodeConnections",
    q: "A pipeline in a new Workloads account must use GitHub. A working connection already exists in the central Tools account. What should be done?",
    options: [
      { t: "Create (and authorize) a connection in the Workloads account in the pipeline's Region. A pipeline must use a connection in its own account and Region.",
        why: "Correct. Connections belong to one account and Region. The same GitHub app installation can back several connections." },
      { t: "Reference the Tools account's connection ARN in the Workloads pipeline.",
        why: "A pipeline can't use a connection from another account." },
      { t: "Share the connection through AWS RAM.",
        why: "Not the supported pattern. Create a local connection." },
      { t: "Copy the GitHub token from the Tools connection.",
        why: "Connections don't expose tokens." }
    ],
    answer: [0],
    tip: "Connections are per account and Region."
  },
  {
    id: "con-11", domain: "d1", topic: "CodeConnections",
    q: "A team wants every GitHub pull request built and tested, with the result shown as a status check on the pull request. They don't need a full pipeline. What is the SIMPLEST solution?",
    options: [
      { t: "A CodeBuild project with the GitHub source (through a connection) and a webhook with filter groups for PULL_REQUEST_CREATED and PULL_REQUEST_UPDATED.",
        why: "Correct. CodeBuild webhooks start builds on pull request events and report the build status back to GitHub." },
      { t: "A V1 pipeline polling GitHub.",
        why: "V1 can't filter pull requests, and polling is legacy." },
      { t: "An EventBridge rule on GitHub events.",
        why: "GitHub doesn't send events to EventBridge natively." },
      { t: "CloudFormation Git sync.",
        why: "Git sync deploys stacks. It doesn't run pull request tests." }
    ],
    answer: [0],
    tip: "Pull request checks without a pipeline → CodeBuild webhook (filter groups) + status reported back."
  },
  {
    id: "con-12", domain: "d1", topic: "CodeConnections",
    q: "A team's GitHub Actions workflows need to run integration tests against an RDS database in a private VPC and use IAM roles instead of stored AWS keys. They want to keep GitHub Actions as their CI tool. What should they use?",
    options: [
      { t: "CodeBuild-hosted GitHub Actions runners: a CodeBuild project with a webhook for WORKFLOW_JOB_QUEUED events, running in the VPC with a service role.",
        why: "Correct. CodeBuild runs the GitHub Actions jobs on AWS compute, inside the VPC, with an IAM role." },
      { t: "Store an IAM user's access keys as GitHub secrets.",
        why: "Long-lived keys, and GitHub's hosted runners still can't reach the private VPC." },
      { t: "Move all workflows to CodePipeline.",
        why: "Unnecessary. They want to keep GitHub Actions." },
      { t: "Make the RDS database publicly accessible.",
        why: "Insecure." }
    ],
    answer: [0],
    tip: "GitHub Actions jobs needing VPC access or IAM roles → CodeBuild-hosted GitHub Actions runners."
  },
  {
    id: "con-13", domain: "d1", topic: "CodeConnections",
    q: "A small team stores a simple CloudFormation template (an S3 bucket and an SNS topic) in GitHub. They want the stack updated automatically whenever the template or its parameters change on main, with no pipeline to maintain. What should they use?",
    options: [
      { t: "CloudFormation Git sync, using a connection, a repository link, and a deployment file listing the template path and parameters.",
        why: "Correct. Git sync keeps a stack in sync with a Git branch, with no pipeline." },
      { t: "A CodeBuild project on a cron schedule that runs aws cloudformation deploy.",
        why: "Polling and custom work. Git sync is built in." },
      { t: "CloudFormation StackSets.",
        why: "StackSets deploy to many accounts and Regions. They don't sync from Git." },
      { t: "Drift detection.",
        why: "Drift detection compares the stack with its resources. It doesn't deploy changes from Git." }
    ],
    answer: [0],
    tip: "Stack deployed straight from Git without a pipeline → CloudFormation Git sync."
  },
  {
    id: "con-14", domain: "d1", topic: "CodeConnections",
    multi: true,
    q: "A GitHub source pipeline (through a connection) stopped starting on pushes to main. The connection status is AVAILABLE. Which TWO causes are MOST likely? (Choose TWO.)",
    options: [
      { t: "The source action's DetectChanges setting was changed to false.",
        why: "Correct. With DetectChanges false, the pipeline only starts manually or through the API." },
      { t: "A V2 trigger filter (branch or file path) no longer matches the changes being pushed.",
        why: "Correct. V2 triggers only start the pipeline when a push matches their filters." },
      { t: "The artifact bucket has versioning turned off.",
        why: "Versioning matters for S3 SOURCE buckets, not for the artifact store of a GitHub source." },
      { t: "The connection must be re-authorized every 30 days.",
        why: "Connections don't expire on a schedule." },
      { t: "CodeConnections only supports manual starts.",
        why: "Connections support automatic change detection through the app's webhooks." }
    ],
    answer: [0, 1],
    tip: "Connection pipeline not starting → check DetectChanges, V2 trigger filters, and that the connection is AVAILABLE."
  },

  // ───────────────────────────── CodeGuru ─────────────────────────────
  {
    id: "cg-01", domain: "d1", topic: "CodeGuru",
    q: "A team develops Java microservices in CodeCommit. Senior developers spend hours reviewing pull requests for problems such as unclosed database connections, missing pagination when calling AWS APIs, and thread-safety bugs. The team wants automated review comments on every pull request with the LEAST operational overhead. What should the DevOps engineer do?",
    options: [
      { t: "Associate the repository with Amazon CodeGuru Reviewer so that every pull request gets an incremental review with comments.",
        why: "Correct. Reviewer finds resource leaks, AWS API misuse such as pagination, and concurrency problems, and comments directly on pull requests." },
      { t: "Turn on Amazon CodeGuru Profiler for the services.",
        why: "Profiler analyses RUNNING applications for performance. It doesn't review pull requests." },
      { t: "Run Amazon Inspector on the repository.",
        why: "Inspector focuses on known vulnerabilities (CVEs) in packages, images, and code. It doesn't comment on pull requests about leaks or concurrency." },
      { t: "Add a CodeBuild step that runs a linter and posts the output to Slack.",
        why: "Possible, but it's custom work, and simple linters miss AWS-specific and concurrency issues." }
    ],
    answer: [0],
    tip: "Automated pull request review for Java or Python → CodeGuru Reviewer (associate the repository)."
  },
  {
    id: "cg-02", domain: "d1", topic: "CodeGuru",
    q: "A security audit found AWS access keys and a database password committed in a Python repository on GitHub. The company wants such secrets detected automatically in future pull requests, and the existing secrets stored securely with rotation. Which combination meets these requirements?",
    options: [
      { t: "CodeGuru Reviewer on the repository to detect hard-coded secrets in pull requests, and move the secrets into AWS Secrets Manager with rotation.",
        why: "Correct. Reviewer's secrets detector flags hard-coded credentials and recommends Secrets Manager, which stores and rotates secrets." },
      { t: "CodeGuru Profiler plus Parameter Store String parameters.",
        why: "Profiler doesn't scan code for secrets, and String parameters aren't encrypted or rotated." },
      { t: "Amazon Macie on the GitHub repository.",
        why: "Macie scans S3 data, not GitHub repositories." },
      { t: "Encrypt the repository with a customer-managed KMS key.",
        why: "Encrypting the storage doesn't detect or remove secrets written into the code." }
    ],
    answer: [0],
    tip: "Secrets in code → CodeGuru Reviewer detects them → Secrets Manager stores and rotates them."
  },
  {
    id: "cg-03", domain: "d1", topic: "CodeGuru",
    q: "A company builds Java applications in a CodePipeline pipeline whose build stage is CodeBuild. Repositories are in a Git server that CodeGuru Reviewer can't associate with directly. The team wants a CodeGuru Reviewer code AND security review on every build. What should the CodeBuild stage do?",
    options: [
      { t: "Upload the source code and the compiled build artifacts (.jar / .class) to an S3 bucket whose name starts with codeguru-reviewer-, then start a repository analysis through the CodeGuru Reviewer API/CLI.",
        why: "Correct. The S3-based CI/CD integration is how Reviewer is used from CodeBuild or other CI tools. Java security analysis needs the build artifacts." },
      { t: "Upload only the source code to any S3 bucket.",
        why: "The bucket name must start with codeguru-reviewer-, and Java security findings need the build artifacts." },
      { t: "Install the CodeGuru Profiler agent in the build.",
        why: "Profiler measures running code, not code in a build." },
      { t: "It's not possible. CodeGuru Reviewer only works with associated repositories.",
        why: "Reviewer supports CI/CD runs through S3 and the API, and through a GitHub Action." }
    ],
    answer: [0],
    tip: "Reviewer from CI/CD → S3 bucket codeguru-reviewer-* + API. Java security needs build artifacts."
  },
  {
    id: "cg-04", domain: "d1", topic: "CodeGuru",
    q: "A team just associated a large, 5-year-old Python repository with CodeGuru Reviewer. Pull requests now get reviews, but management wants a baseline of ALL existing issues in the main branch, not only in new changes. What should the team do?",
    options: [
      { t: "Run a full repository analysis on the main branch.",
        why: "Correct. A full repository analysis scans the whole branch. Incremental reviews only cover the code changed in each pull request." },
      { t: "Open a pull request that touches every file.",
        why: "A hack that creates noise. Full repository analysis exists for this." },
      { t: "Turn on CodeGuru Profiler in production.",
        why: "Profiler doesn't list code issues across the repository." },
      { t: "Disassociate and associate the repository again.",
        why: "Associating again doesn't scan existing code." }
    ],
    answer: [0],
    tip: "Pull request = incremental review (changed code only). Baseline of all existing code = full repository analysis."
  },
  {
    id: "cg-05", domain: "d1", topic: "CodeGuru",
    q: "A Java service on Amazon ECS has CPU usage that has doubled over six months, and compute costs are rising. CloudWatch shows high CPU, but not WHICH code causes it. The team wants to find the most expensive methods in production with minimal overhead. What should they use?",
    options: [
      { t: "Amazon CodeGuru Profiler: add the Java agent to the service, send data to a profiling group, and analyse the CPU flame graph and recommendations.",
        why: "Correct. Profiler samples running code with low overhead and shows exactly which methods use the most CPU, often with an estimated cost saving." },
      { t: "CodeGuru Reviewer on the repository.",
        why: "Reviewer analyses code without running it. It can't measure real CPU use in production." },
      { t: "AWS X-Ray tracing.",
        why: "X-Ray shows latency between services and segments, not CPU use by individual methods inside one service." },
      { t: "CloudWatch Container Insights.",
        why: "It shows container-level CPU and memory, not which methods use them." }
    ],
    answer: [0],
    tip: "Which code uses the CPU in a running app → CodeGuru Profiler (flame graph)."
  },
  {
    id: "cg-06", domain: "d1", topic: "CodeGuru",
    q: "A Python AWS Lambda function has become slow, and its duration (and cost) has increased. The team wants to see which lines of code take the most time, with the LEAST setup effort. What should they do?",
    options: [
      { t: "Turn on 'Code profiling' (CodeGuru Profiler) in the Lambda function's configuration and review the profiling group's flame graphs.",
        why: "Correct. The Lambda setting adds the Profiler agent layer and environment variables for you, for Java and Python functions." },
      { t: "Increase the function's memory size.",
        why: "This might speed it up, but it doesn't show which code is slow, and it can increase cost." },
      { t: "Turn on CodeGuru Reviewer for the function.",
        why: "Reviewer works on repositories and pull requests, not on running Lambda functions." },
      { t: "Add print statements with timestamps around every line.",
        why: "Manual, noisy, and needs code changes." }
    ],
    answer: [0],
    tip: "Slow Java or Python Lambda code → turn on Code profiling (CodeGuru Profiler)."
  },
  {
    id: "cg-07", domain: "d1", topic: "CodeGuru",
    q: "Users report that an order API is slow. Each request passes through an API Gateway, three Lambda functions, and two ECS services. The team must first find WHICH service is causing the delay. Which service should they use first?",
    options: [
      { t: "AWS X-Ray (distributed tracing) to see how long each service takes for a request.",
        why: "Correct. X-Ray follows a request across services and shows where time is spent. Profiler can then go deeper inside the slow service." },
      { t: "CodeGuru Profiler on all six components first.",
        why: "Profiler shows hot spots INSIDE one application. It doesn't show the end-to-end request path across services." },
      { t: "CodeGuru Reviewer on all repositories.",
        why: "Static code review doesn't measure live latency." },
      { t: "Amazon Inspector.",
        why: "Inspector finds vulnerabilities, not latency." }
    ],
    answer: [0],
    tip: "Slow request across services → X-Ray first. Slow code inside one service → Profiler."
  },
  {
    id: "cg-08", domain: "d1", topic: "CodeGuru",
    q: "A CodeGuru Profiler profiling group stays empty. The Java agent is installed on EC2 instances and the application logs show the agent starting, but no profiles appear. What is the MOST likely cause?",
    options: [
      { t: "The instance role lacks Profiler agent permissions (for example AmazonCodeGuruProfilerAgentAccess: ConfigureAgent and PostAgentProfile) for that profiling group.",
        why: "Correct. The agent must be allowed to call the Profiler API for its profiling group to submit data." },
      { t: "CodeGuru Profiler doesn't support EC2.",
        why: "EC2 is supported, as are ECS, EKS, Fargate, Lambda, and on-premises servers." },
      { t: "The repository isn't associated with CodeGuru Reviewer.",
        why: "Reviewer association has nothing to do with Profiler." },
      { t: "The application must be written in Go.",
        why: "Profiler supports JVM languages and Python. Go isn't supported." }
    ],
    answer: [0],
    tip: "Empty profiling group → check the agent's IAM permissions (AmazonCodeGuruProfilerAgentAccess) and network access to the Profiler API."
  },
  {
    id: "cg-09", domain: "d1", topic: "CodeGuru",
    q: "CodeGuru Profiler shows that a Java service spends most of its time WAITING on database calls and locks, while CPU usage is low. Which Profiler view best shows where this waiting time is spent?",
    options: [
      { t: "The latency (wall-clock time) view.",
        why: "Correct. Latency or wall-clock profiling includes time spent waiting on I/O, network, and locks, not just CPU." },
      { t: "The CPU usage flame graph.",
        why: "It shows CPU time only, so waiting time won't stand out there." },
      { t: "The heap summary.",
        why: "The heap summary shows memory use by object type." },
      { t: "CodeGuru Reviewer recommendations.",
        why: "Reviewer is static analysis and doesn't measure runtime waiting." }
    ],
    answer: [0],
    tip: "CPU flame graph = CPU time · Latency view = all time, including waiting · Heap summary = memory."
  },
  {
    id: "cg-10", domain: "d1", topic: "CodeGuru",
    q: "Operations wants to be alerted automatically if, after a deployment, a particular method in a profiled Java application suddenly starts using much more CPU than usual. What should they configure?",
    options: [
      { t: "CodeGuru Profiler anomaly detection notifications for the profiling group (for example to an SNS topic).",
        why: "Correct. Profiler learns normal behaviour and can notify you when a method's CPU or latency behaves unusually." },
      { t: "A CodeGuru Reviewer full repository analysis after each deploy.",
        why: "Static analysis doesn't detect runtime CPU anomalies." },
      { t: "An AWS Config rule.",
        why: "Config checks resource settings, not application performance." },
      { t: "Amazon Inspector continuous scanning.",
        why: "Inspector finds vulnerabilities, not CPU anomalies." }
    ],
    answer: [0],
    tip: "Unusual method performance → Profiler anomaly detection + notifications."
  },
  {
    id: "cg-11", domain: "d1", topic: "CodeGuru",
    multi: true,
    q: "A company wants (1) known CVEs in its Python dependencies and container images found automatically, and (2) unusual operational behaviour, such as a sudden increase in errors and latency across its Lambda functions and DynamoDB tables, detected with ML-based insights. Which TWO services should it use? (Choose TWO.)",
    options: [
      { t: "Amazon Inspector for dependency and container image vulnerabilities.",
        why: "Correct. Inspector scans packages, ECR images, and Lambda code for known CVEs." },
      { t: "Amazon DevOps Guru for ML-based operational anomaly detection across resources.",
        why: "Correct. DevOps Guru analyses metrics, events, and logs to find operational anomalies and suggest fixes." },
      { t: "CodeGuru Profiler for CVE detection.",
        why: "Profiler measures code performance. It doesn't detect CVEs." },
      { t: "CodeGuru Reviewer for runtime error spikes.",
        why: "Reviewer is static code review and can't see runtime behaviour." },
      { t: "AWS X-Ray for dependency vulnerabilities.",
        why: "X-Ray traces requests. It doesn't scan dependencies." }
    ],
    answer: [0, 1],
    tip: "CVEs → Inspector · operational anomalies → DevOps Guru · code review → CodeGuru Reviewer · code performance → CodeGuru Profiler."
  },
  {
    id: "cg-12", domain: "d1", topic: "CodeGuru",
    q: "A company has services in Java, Python, Node.js, and Go, and wants automated pull request code reviews for ALL of them. A DevOps engineer suggests CodeGuru Reviewer. What should the engineer know?",
    options: [
      { t: "CodeGuru Reviewer supports only Java and Python, so the Node.js and Go services need another tool (for example Amazon Q Developer code reviews or a third-party analyser).",
        why: "Correct. CodeGuru Reviewer covers Java and Python only. Pick a tool that covers the other languages." },
      { t: "CodeGuru Reviewer supports every language that runs on AWS.",
        why: "It doesn't. Language support is limited to Java and Python." },
      { t: "Use CodeGuru Profiler for the Node.js and Go services instead.",
        why: "Profiler isn't a code reviewer, and it supports JVM languages and Python only." },
      { t: "Convert the Node.js and Go services to Java.",
        why: "Unrealistic just to use a review tool." }
    ],
    answer: [0],
    tip: "CodeGuru languages: Reviewer = Java + Python · Profiler = JVM (Java, Kotlin, Scala) + Python."
  },

  // ───────────────────── Gap review additions ─────────────────────
  {
    id: "cc-16", domain: "d1", topic: "CodeCommit",
    q: "A financial company requires that developers can push to and pull from CodeCommit ONLY from the corporate network (CIDR 203.0.113.0/24) or through the company VPC's CodeCommit interface endpoint. Access from home networks must be blocked, even with valid credentials. What should the DevOps engineer implement?",
    options: [
      { t: "An IAM policy (or SCP) that denies codecommit:* unless aws:SourceIp is in 203.0.113.0/24 or aws:SourceVpce matches the company's CodeCommit VPC endpoint.",
        why: "Correct. IAM global condition keys can limit API and Git access by source IP or VPC endpoint. An SCP enforces it across the whole account." },
      { t: "A security group on the CodeCommit repository that allows only the corporate CIDR.",
        why: "CodeCommit is a managed regional service. Repositories don't have security groups." },
      { t: "A repository policy that restricts source IPs.",
        why: "CodeCommit has no repository (resource-based) policies." },
      { t: "Require approval rule templates on every repository.",
        why: "Approvals control pull request merges, not where Git traffic comes from." }
    ],
    answer: [0],
    tip: "Network-based restriction → IAM / SCP Deny with aws:SourceIp or aws:SourceVpce."
  },
  {
    id: "cc-17", domain: "d1", topic: "CodeCommit",
    q: "A data science team commits 300 MB machine learning model files to a CodeCommit repository on every training run. Clones have become very slow, and some uploads through the console fail. What is the BEST practice?",
    options: [
      { t: "Store the model files in Amazon S3 (versioned) and keep only code and a reference (S3 key or version) in the repository.",
        why: "Correct. Git repositories are for source code. Large binaries belong in S3, and the console and API have small file-size limits (about 6 MB)." },
      { t: "Increase the CodeCommit repository size quota.",
        why: "The repository size isn't the problem. Big binaries in Git history slow down every clone, forever." },
      { t: "Split the repository into one repository per model.",
        why: "Still large binaries in Git, just spread around." },
      { t: "Turn on CodeCommit compression.",
        why: "No such setting exists." }
    ],
    answer: [0],
    tip: "Large binaries → S3 (or Git LFS), not the Git repository."
  },
  {
    id: "cb-18", domain: "d1", topic: "CodeBuild",
    q: "During integration tests, CodeBuild must call a partner's API that only accepts requests from allow-listed, FIXED public IP addresses. CodeBuild builds currently run without a VPC configuration. What should the DevOps engineer do?",
    options: [
      { t: "Configure the project to run in private subnets of a VPC whose outbound traffic goes through a NAT gateway with an Elastic IP, and give the partner that Elastic IP.",
        why: "Correct. Builds in a VPC reach the internet through the NAT gateway, so all traffic leaves from its fixed Elastic IP." },
      { t: "Attach an Elastic IP directly to the CodeBuild project.",
        why: "You can't attach Elastic IPs to CodeBuild build environments." },
      { t: "Allow-list the CodeBuild service IP ranges for the whole Region.",
        why: "Those ranges are large, shared with other customers, and change over time. That's insecure and fragile." },
      { t: "Run the build in a public subnet.",
        why: "CodeBuild network interfaces never get public IPs, so a public subnet doesn't work." }
    ],
    answer: [0],
    tip: "Fixed outbound IP for builds → VPC + private subnet + NAT gateway with an Elastic IP."
  },
  {
    id: "cb-19", domain: "d1", topic: "CodeBuild",
    q: "A team runs hundreds of short builds every day. Each build spends 60-90 seconds in the PROVISIONING phase before any commands run, which slows feedback. They want builds to start almost immediately. What should they use?",
    options: [
      { t: "A CodeBuild reserved capacity fleet, so build machines are already running and ready.",
        why: "Correct. Reserved capacity keeps dedicated machines running, which removes most of the provisioning time. You pay for the fleet while it runs." },
      { t: "A larger compute type.",
        why: "More CPU speeds up commands, not provisioning." },
      { t: "An S3 cache.",
        why: "Caching speeds up dependency downloads, not environment provisioning." },
      { t: "A longer queued timeout.",
        why: "That only allows longer waiting. It doesn't reduce provisioning time." }
    ],
    answer: [0],
    tip: "Slow provisioning or always-warm machines → reserved capacity fleet (or Lambda compute for small, fast builds)."
  },
  {
    id: "cb-20", domain: "d1", topic: "CodeBuild",
    q: "Compliance requires that all build output artifacts that CodeBuild writes to S3 are encrypted with a customer-managed KMS key controlled by the security team. What should the DevOps engineer configure?",
    options: [
      { t: "Set the customer-managed KMS key as the CodeBuild project's encryption key, and make sure the service role and key policy allow CodeBuild to use the key.",
        why: "Correct. The project encryption key is used to encrypt build output artifacts." },
      { t: "Turn on privileged mode.",
        why: "Unrelated to encryption." },
      { t: "Encrypt the buildspec.yml file.",
        why: "The buildspec contains instructions. It doesn't control how artifacts are encrypted." },
      { t: "Store the artifacts in CloudWatch Logs.",
        why: "Logs aren't artifacts, and this doesn't meet the requirement." }
    ],
    answer: [0],
    tip: "Build artifacts with a customer-managed key → the project's encryption key (+ key policy + role permissions)."
  },
  {
    id: "ca-18", domain: "d1", topic: "CodeArtifact",
    q: "A central CodeArtifact domain must be readable by EVERY account in the company's AWS Organization, including accounts created in the future, with no policy update each time a new account is added. How should the domain and repository policies be written?",
    options: [
      { t: "Allow the required CodeArtifact actions for Principal \"*\" with the condition aws:PrincipalOrgID equal to the organization ID.",
        why: "Correct. The aws:PrincipalOrgID condition allows every principal in the Organization, including future accounts, and nobody outside it." },
      { t: "List every account ID in the policies and update them for each new account.",
        why: "It works, but it means manual updates for every new account." },
      { t: "Share the domain through AWS RAM.",
        why: "CodeArtifact cross-account access uses resource policies, not RAM." },
      { t: "Allow Principal \"*\" with no condition.",
        why: "That would allow ANY AWS account. Insecure." }
    ],
    answer: [0],
    tip: "Whole Organization, including future accounts → resource policy with aws:PrincipalOrgID."
  },
  {
    id: "ecr-25", domain: "d1", topic: "ECR",
    q: "Security requires that only container images built and signed by the company's CI pipeline can run on its Amazon EKS clusters. Unsigned or tampered images must be rejected at deploy time. What should the DevOps engineer implement?",
    options: [
      { t: "Sign images in the pipeline with AWS Signer and the Notation client (signatures stored in ECR), and verify signatures in EKS with an admission controller (for example Kyverno or Ratify) that rejects unsigned images.",
        why: "Correct. Signer signs the images, and an admission controller checks the signature before a pod is allowed to run." },
      { t: "Turn on tag immutability.",
        why: "This stops tags from being overwritten, but it doesn't prove who built the image or that it wasn't changed." },
      { t: "Turn on enhanced scanning.",
        why: "Scanning finds vulnerabilities. It doesn't check where an image came from." },
      { t: "Use a lifecycle policy to remove untagged images.",
        why: "Unrelated to signing." }
    ],
    answer: [0],
    tip: "Only trusted images may run → AWS Signer + Notation + an admission controller that verifies signatures."
  },
  {
    id: "cp-21", domain: "d1", topic: "CodePipeline",
    q: "A platform team publishes base images to ECR. Whenever a new image tagged 'release' is pushed to the payments-api repository, a pipeline must deploy it to ECS with blue/green (CodeDeployToECS). No source code repository is involved. How should the pipeline start?",
    options: [
      { t: "Use an Amazon ECR source action for the repository with the image tag 'release'. It starts on the push event and outputs imageDetail.json for the CodeDeployToECS action.",
        why: "Correct. The ECR source action is started by EventBridge when the chosen tag is pushed, and its output artifact contains imageDetail.json." },
      { t: "Use an S3 source and copy the image into S3 after each push.",
        why: "An unneeded workaround. ECR is a supported source." },
      { t: "Poll ECR every minute with a scheduled Lambda function.",
        why: "Polling and custom code. Not needed." },
      { t: "Use a CodeCommit source and commit the image digest by hand.",
        why: "A manual step that defeats automation." }
    ],
    answer: [0],
    tip: "Start a pipeline on an image push → ECR source action (outputs imageDetail.json)."
  },
  {
    id: "cp-22", domain: "d1", topic: "CodePipeline",
    q: "A security baseline (CloudTrail, Config rules, IAM roles) is defined in one CloudFormation template. A pipeline must deploy it to ALL accounts in two Organizational Units across three Regions, including accounts added later. What should the deploy stage use?",
    options: [
      { t: "The CloudFormation StackSets deploy actions (CloudFormationStackSet / CloudFormationStackInstances) with service-managed permissions targeting the OUs, and automatic deployment turned on.",
        why: "Correct. StackSets deploy one template to many accounts and Regions. Service-managed StackSets with automatic deployment also cover new accounts added to the OUs." },
      { t: "One CloudFormation deploy action per account and Region.",
        why: "Dozens of actions to maintain, and new accounts are missed." },
      { t: "A CodeBuild script that loops over the accounts and runs aws cloudformation deploy.",
        why: "Custom code. StackSets is the native solution." },
      { t: "CloudFormation Git sync in each account.",
        why: "Git sync works one stack at a time, with a connection in every account. Too much overhead." }
    ],
    answer: [0],
    tip: "One template → many accounts and Regions (OUs, new accounts automatically) → StackSets action, service-managed."
  },
  {
    id: "cp-23", domain: "d1", topic: "CodePipeline",
    q: "Approvers often miss that a production release is waiting at a manual approval step. The team wants a message in their Slack channel every time an approval is needed, with no custom code. What should be configured?",
    options: [
      { t: "A notification rule on the pipeline for the 'Manual approval needed' event, targeting a Slack channel through AWS Chatbot (Amazon Q Developer in chat applications).",
        why: "Correct. Notification rules support approval events and send them to Slack without code." },
      { t: "A Lambda function that polls GetPipelineState every minute and posts to Slack.",
        why: "Custom polling code. Not needed." },
      { t: "A CloudWatch alarm on pipeline duration.",
        why: "It doesn't indicate that an approval is waiting, and it can't post to Slack directly." },
      { t: "Raise the approval timeout to 30 days.",
        why: "The timeout is fixed at 7 days, and a longer timeout doesn't tell anyone." }
    ],
    answer: [0],
    tip: "Approval needed → Slack, no code → notification rule + Chatbot."
  },
  {
    id: "cp-24", domain: "d1", topic: "CodePipeline",
    q: "A pipeline in the Tools account uses a CodeCommit repository in the Dev account as its source, through a cross-account role. The pipeline works when started manually, but does NOT start automatically when developers push to main. What is missing?",
    options: [
      { t: "An EventBridge rule in the Dev account that forwards CodeCommit referenceUpdated events to the Tools account's event bus (the bus policy must allow Dev), and a rule in Tools that starts the pipeline.",
        why: "Correct. CodeCommit events are sent in the Dev account, so they must be forwarded to the Tools account to start the pipeline there." },
      { t: "Set PollForSourceChanges to true. That is the recommended way.",
        why: "Polling is legacy. The event-based design is expected." },
      { t: "A CodeCommit trigger in Dev that targets the pipeline.",
        why: "Triggers can only target SNS or Lambda, not pipelines." },
      { t: "Grant the developers codepipeline:StartPipelineExecution.",
        why: "Pipelines shouldn't depend on people starting them by hand." }
    ],
    answer: [0],
    tip: "Cross-account CodeCommit source → EventBridge rule in the source account → Tools event bus → pipeline."
  },
  {
    id: "cp-25", domain: "d1", topic: "CodePipeline",
    q: "The same CloudFormation template is deployed by one pipeline to Test and Prod stages. Each environment needs different parameter values and tags, and Prod must also apply a stack policy that protects the database from replacement. What is the cleanest approach?",
    options: [
      { t: "Keep one template, and add a TemplateConfiguration file per environment (for example test.json and prod.json with Parameters, Tags and StackPolicy) referenced by each stage's CloudFormation action.",
        why: "Correct. TemplateConfiguration files hold environment-specific parameters, tags, and the stack policy, without copying the template." },
      { t: "Keep two copies of the template, one per environment.",
        why: "Copies drift apart over time and double the maintenance." },
      { t: "Hard-code the Prod values in the template and override them manually for Test.",
        why: "Manual and error-prone." },
      { t: "Use pipeline variables for the stack policy.",
        why: "Stack policies are set in the TemplateConfiguration file, not through a variable." }
    ],
    answer: [0],
    tip: "One template, per-environment parameters, tags and stack policy → TemplateConfiguration files."
  },
  {
    id: "cp-26", domain: "d1", topic: "CodePipeline",
    q: "Before a production deployment, a manual approval currently requires an engineer to check that a change ticket is in 'Approved' state in the company's ticketing system. The company wants this check automated, while keeping the approval step for audit. What should the DevOps engineer do?",
    options: [
      { t: "Have a Lambda function (triggered by the approval notification through SNS) check the ticket, get the approval token from GetPipelineState, and call PutApprovalResult with Approved or Rejected.",
        why: "Correct. Approvals can be answered by code through PutApprovalResult with the token, and the result is still recorded." },
      { t: "Remove the approval action and trust the deployment.",
        why: "This loses both the check and the audit step." },
      { t: "Raise the approval timeout so engineers have more time.",
        why: "The timeout is fixed at 7 days, and the check is still manual." },
      { t: "Use a CodeBuild action that always succeeds.",
        why: "It doesn't check the ticket." }
    ],
    answer: [0],
    tip: "Automated approval → Lambda: GetPipelineState (token) → PutApprovalResult."
  },
  {
    id: "cp-27", domain: "d1", topic: "CodePipeline",
    q: "A team defines its pipeline with AWS CDK Pipelines. When they add a new stage in code and push, they want the pipeline to UPDATE ITSELF first and then run the new stage, without anyone running cdk deploy by hand. Which feature provides this?",
    options: [
      { t: "The CDK Pipelines self-mutation (UpdatePipeline) stage, which redeploys the pipeline's own stack when its definition changes.",
        why: "Correct. CDK Pipelines include a self-mutation step that updates the pipeline before running the rest of the stages." },
      { t: "CloudFormation drift detection.",
        why: "It detects drift. It doesn't update pipelines." },
      { t: "A V2 PARALLEL execution mode.",
        why: "The execution mode is about how runs overlap, not self-updates." },
      { t: "CodeConnections DetectChanges.",
        why: "This starts runs when source changes. It doesn't change the pipeline structure." }
    ],
    answer: [0],
    tip: "Pipeline that updates its own definition → CDK Pipelines self-mutation."
  },
  {
    id: "cp-28", domain: "d1", topic: "CodePipeline",
    q: "A company wants a container CI/CD pipeline with the LEAST operational overhead: code in GitHub (no stored tokens), build the image, block deployment if the image has CRITICAL vulnerabilities, then deploy to ECS with blue/green and automatic rollback on alarms. Which design meets ALL requirements?",
    options: [
      { t: "CodeConnections source → CodeBuild (build, push to ECR with scan on push, wait for scan and fail on CRITICAL, write imageDetail.json, appspec.yaml and taskdef.json) → CodeDeployToECS blue/green with CloudWatch alarms and automatic rollback.",
        why: "Correct. Every part is a managed service: a tokenless source, a security gate in the build, and blue/green with alarm-based rollback in CodeDeploy." },
      { t: "GitHub version 1 source with a personal access token → CodeBuild → ECS rolling deploy action.",
        why: "Uses a stored token (deprecated), has no vulnerability gate, and does a rolling update instead of blue/green." },
      { t: "Jenkins on EC2 → docker push → a manual ECS update.",
        why: "Self-managed servers and manual steps, which is high overhead." },
      { t: "CodeConnections source → CodeBuild → ECS rolling deploy action with imagedefinitions.json.",
        why: "No vulnerability gate, and a rolling update instead of blue/green with automatic rollback." }
    ],
    answer: [0],
    tip: "Real exam questions combine services: tokenless source + security gate + correct deploy action + automatic rollback."
  },
  {
    id: "cp-29", domain: "d1", topic: "CodePipeline",
    multi: true,
    q: "A company is designing a central multi-account delivery setup: one Tools account runs all pipelines, and they deploy CloudFormation stacks to Dev, Test and Prod accounts. Which TWO configurations are required? (Choose TWO.)",
    options: [
      { t: "A customer-managed KMS key for the artifact store whose key policy allows the target accounts' roles, plus an artifact bucket policy that allows those roles.",
        why: "Correct. The target accounts must be able to read and decrypt the artifacts." },
      { t: "In each target account, a role that trusts the Tools account (used as the action roleArn), plus a CloudFormation deployment role passed in the action configuration.",
        why: "Correct. The pipeline assumes the cross-account role, which passes the deployment role to CloudFormation." },
      { t: "A separate pipeline in every target account that copies artifacts from Tools.",
        why: "This defeats the purpose of a central pipeline." },
      { t: "IAM users with access keys in each target account, stored in the pipeline.",
        why: "Long-lived credentials. Bad practice." },
      { t: "The default aws/s3 key on the artifact bucket.",
        why: "It can't be shared across accounts." }
    ],
    answer: [0, 1],
    tip: "Central Tools pipeline → customer-managed KMS key + bucket policy + cross-account role + deployment role."
  },
  {
    id: "cp-30", domain: "d1", topic: "CodePipeline",
    q: "A bad commit has started a pipeline execution, and its CloudFormation deploy to Prod is currently in progress. The team wants to stop this execution immediately WITHOUT waiting for the running action to finish, then fix forward. What should they do?",
    options: [
      { t: "Stop the execution with the 'Stop and abandon' option.",
        why: "Correct. 'Stop and abandon' stops the execution immediately without waiting for in-progress actions. ('Stop and wait' lets them finish first.)" },
      { t: "Stop the execution with the 'Stop and wait' option.",
        why: "This waits for the running action to finish, which is the opposite of what they want." },
      { t: "Disable the transition into Prod.",
        why: "Too late. The execution is already in Prod." },
      { t: "Delete the pipeline.",
        why: "Destructive, and running actions might not stop cleanly." }
    ],
    answer: [0],
    tip: "Stop now → 'Stop and abandon'. Let running actions finish → 'Stop and wait'. (A CloudFormation update may still need its own rollback.)"
  },

  // ───────────────────────────── CI/CD Concepts ─────────────────────────────
  {
    id: "ci-01", domain: "d1", topic: "CI/CD Concepts",
    q: "A company's pipeline builds, tests, and deploys each change to staging automatically. Because of regulations, a release manager must approve each production deployment. Every change that reaches the approval step is fully tested and ready to release. Which practice is the company using?",
    options: [
      { t: "Continuous delivery.",
        why: "Correct. Every change is kept ready to release, and a human approves the production deployment." },
      { t: "Continuous deployment.",
        why: "Continuous deployment has NO manual step. Changes go to production automatically." },
      { t: "Continuous integration only.",
        why: "CI covers building and testing merged changes. This pipeline also deploys to staging and prepares releases." },
      { t: "Waterfall delivery.",
        why: "Waterfall uses big, infrequent phases, not automated per-change pipelines." }
    ],
    answer: [0],
    tip: "Manual approval before production = continuous delivery. Fully automatic = continuous deployment."
  },
  {
    id: "ci-02", domain: "d1", topic: "CI/CD Concepts",
    q: "A team practices trunk-based development and deploys main to production several times a day. A large new feature will take three weeks to finish, but its code must be merged to main daily without users seeing it. Later, the feature must be turned on for 10% of users first. What should the team use?",
    options: [
      { t: "Feature flags in AWS AppConfig: deploy the code switched off, then turn the flag on with a gradual rollout strategy.",
        why: "Correct. Feature flags separate deploying from releasing. AppConfig supports gradual rollout and automatic rollback on alarms." },
      { t: "A long-lived feature branch merged after three weeks.",
        why: "This goes against trunk-based development and leads to a big, risky merge." },
      { t: "A separate production account just for the feature.",
        why: "Heavy, and it doesn't control which users see the feature." },
      { t: "Disable the pipeline for three weeks.",
        why: "This blocks every other change." }
    ],
    answer: [0],
    tip: "Ship code that is switched off and release it gradually → feature flags (AWS AppConfig)."
  },
  {
    id: "ci-03", domain: "d1", topic: "CI/CD Concepts",
    q: "A developer testing a script in the shared AWS account accidentally deleted a production DynamoDB table. Dev, test, and production resources all live in that one account. Leadership wants to prevent this kind of mistake while keeping automated deployments. What is the BEST long-term design?",
    options: [
      { t: "Separate AWS accounts for Dev, Test and Prod (AWS Organizations), with a central Tools account whose pipeline deploys to each through cross-account roles.",
        why: "Correct. Account boundaries isolate environments and limit the blast radius. Only the pipeline's roles can change Prod." },
      { t: "Tag production resources and ask developers to be careful.",
        why: "Tags alone don't stop mistakes." },
      { t: "Turn on CloudTrail.",
        why: "CloudTrail records what happened. It doesn't prevent it." },
      { t: "Give all developers read-only access to everything, including Dev.",
        why: "This stops developers from working in Dev too." }
    ],
    answer: [0],
    tip: "Isolate environments and limit the blast radius → multi-account (Dev / Test / Prod) + a central pipeline account."
  },
  {
    id: "ci-04", domain: "d1", topic: "CI/CD Concepts",
    q: "A pipeline builds a Java application in the Test stage and runs integration tests. The Prod stage then runs the BUILD again before deploying. Last week, production failed because the Prod build picked up a newer version of a library that had never been tested. What should the DevOps engineer change?",
    options: [
      { t: "Build the artifact once, store it with an immutable version (or image digest), and promote that exact artifact through Test and Prod. Keep environment settings outside the artifact.",
        why: "Correct. 'Build once, deploy many' guarantees that production runs exactly what was tested." },
      { t: "Pin library versions only in the Prod build.",
        why: "Prod would still be built separately from what was tested." },
      { t: "Add more tests to the Prod build.",
        why: "Tests in Prod don't fix the rebuilt-artifact problem, and they come too late." },
      { t: "Use a larger CodeBuild compute type for Prod.",
        why: "Unrelated to which dependencies are used." }
    ],
    answer: [0],
    tip: "Never rebuild for production → build once, promote the same artifact or image digest."
  },
  {
    id: "ci-05", domain: "d1", topic: "CI/CD Concepts",
    q: "In a CodeBuild buildspec, the build phase runs: 'pytest | tee test-output.log'. Several tests fail, but the phase and the build report SUCCEEDED. What is the cause, and what is the fix?",
    options: [
      { t: "The exit code of a pipe is the exit code of the LAST command (tee), which succeeds. Use 'set -o pipefail' (or don't pipe), so pytest's non-zero exit code fails the phase.",
        why: "Correct. CodeBuild decides pass or fail from exit codes, and the pipe hides pytest's failure." },
      { t: "CodeBuild ignores test failures unless report groups are configured.",
        why: "Report groups only show results. Exit codes decide whether the phase passes." },
      { t: "on-failure must be set to CONTINUE.",
        why: "That makes the build carry on after failures, which is the opposite of what's needed." },
      { t: "pytest doesn't return exit codes.",
        why: "pytest returns non-zero when tests fail." }
    ],
    answer: [0],
    tip: "Builds pass or fail on exit codes. Watch for 'or true' fallbacks and pipes → set -o pipefail."
  },
  {
    id: "ci-06", domain: "d1", topic: "CI/CD Concepts",
    q: "After each deployment, a CodeBuild test action runs a smoke test: 'curl https://staging.example.com/health'. Yesterday the health endpoint returned HTTP 500, but the test action still SUCCEEDED and the pipeline promoted the release. How should the smoke test be fixed?",
    options: [
      { t: "Use 'curl --fail' (or check the status code and exit non-zero), so HTTP errors give a non-zero exit code and fail the action.",
        why: "Correct. Plain curl exits 0 when it gets ANY HTTP response. --fail makes it exit non-zero for HTTP errors." },
      { t: "Increase the CodeBuild timeout.",
        why: "The request finished. It just wasn't treated as a failure." },
      { t: "Run the smoke test in post_build.",
        why: "The phase doesn't matter. Exit codes do." },
      { t: "Turn on CodeBuild report groups.",
        why: "Reports show results but don't change the exit-code behaviour." }
    ],
    answer: [0],
    tip: "Health checks in scripts must exit non-zero on failure (curl --fail)."
  },
  {
    id: "ci-07", domain: "d1", topic: "CI/CD Concepts",
    q: "Before each major release, a pipeline stage must simulate 50,000 concurrent users from several AWS Regions against the staging environment, using existing JMeter scripts, and report response times. The team wants the LEAST infrastructure to manage. What should they use?",
    options: [
      { t: "Distributed Load Testing on AWS (it runs the JMeter / Taurus tests on Fargate in several Regions), started from a pipeline stage through its API.",
        why: "Correct. It's an AWS Solution made for large, multi-Region load tests, with little infrastructure to manage." },
      { t: "Run JMeter on a single large EC2 instance.",
        why: "One machine can't realistically create 50,000 users from several Regions, and you have to manage it." },
      { t: "Run the load test against production.",
        why: "Risky, and the requirement is staging." },
      { t: "CloudWatch Synthetics canaries with high frequency.",
        why: "Canaries check user journeys on a schedule. They're not a large-scale load generator." }
    ],
    answer: [0],
    tip: "Large or multi-Region load tests → Distributed Load Testing on AWS (in staging)."
  },
  {
    id: "ci-08", domain: "d1", topic: "CI/CD Concepts",
    q: "A company releases a mobile banking app. Each build must be tested automatically on dozens of real Android and iOS devices before it can be released, as part of CodePipeline. What should the DevOps engineer add?",
    options: [
      { t: "An AWS Device Farm test action in the pipeline.",
        why: "Correct. Device Farm runs automated tests on real mobile devices (and desktop browsers), and it is a built-in CodePipeline test provider." },
      { t: "Emulators in CodeBuild only.",
        why: "Emulators aren't real devices, and the requirement says real devices." },
      { t: "CloudWatch Synthetics.",
        why: "Synthetics tests web endpoints and journeys, not native mobile apps on devices." },
      { t: "CodeGuru Profiler.",
        why: "It profiles server-side JVM and Python code, not mobile apps." }
    ],
    answer: [0],
    tip: "Real mobile devices or browsers → AWS Device Farm."
  },
  {
    id: "ci-09", domain: "d1", topic: "CI/CD Concepts",
    q: "After every production deployment, the team wants the checkout journey (log in, add to cart, pay) tested every minute, like a real user. If it starts failing, the deployment should be rolled back automatically. What should they implement?",
    options: [
      { t: "A CloudWatch Synthetics canary for the checkout journey, a CloudWatch alarm on canary failures, and that alarm linked to CodeDeploy automatic rollback (or a CodePipeline V2 rollback condition).",
        why: "Correct. Canaries act like a user on a schedule, and the alarm drives an automatic rollback." },
      { t: "Unit tests in CodeBuild.",
        why: "Unit tests run before deployment and don't test the live journey." },
      { t: "A manual check by QA after each deploy.",
        why: "Not continuous and not automatic." },
      { t: "CloudTrail logging.",
        why: "CloudTrail records API calls, not user journeys." }
    ],
    answer: [0],
    tip: "Continuous user-journey checks in prod → Synthetics canary + alarm → automatic rollback."
  },
  {
    id: "ci-10", domain: "d1", topic: "CI/CD Concepts",
    q: "A DevOps engineer is designing the test stages of a new pipeline. Which order gives developers the FASTEST feedback while still catching problems before production?",
    options: [
      { t: "Build: unit tests + static analysis → Test environment: integration tests → Staging: acceptance, load and security tests → Prod: smoke tests + Synthetics canaries.",
        why: "Correct. Fast, cheap tests come first. Slow, expensive tests run later on production-like environments, and production gets smoke and continuous checks." },
      { t: "Load tests first, then unit tests.",
        why: "Slow tests first delay feedback, and load testing unfinished code wastes time." },
      { t: "All tests only in production.",
        why: "Problems would reach users." },
      { t: "Only unit tests. Integration tests aren't needed with microservices.",
        why: "Integration problems would only show up in production." }
    ],
    answer: [0],
    tip: "Fast tests first (unit, static) → integration → acceptance / load / security in staging → smoke + canaries in prod."
  },
  {
    id: "ci-11", domain: "d1", topic: "CI/CD Concepts",
    q: "A pipeline's test stage must run three test suites in parallel, retry the flaky UI suite up to two times, wait for an external system to finish processing, and fail the stage if any suite still fails. What is the BEST way to orchestrate this inside CodePipeline?",
    options: [
      { t: "An AWS Step Functions invoke action that runs a state machine with parallel branches, retries, and waits.",
        why: "Correct. Step Functions is made for complex workflows with parallel steps, retries, waits, and error handling, and CodePipeline can call it directly." },
      { t: "One long shell script in a single CodeBuild action.",
        why: "Possible, but fragile and hard to observe compared with Step Functions." },
      { t: "Three manual approval actions.",
        why: "Approvals are human steps, not test orchestration." },
      { t: "A Lambda invoke action that runs for 2 hours.",
        why: "Lambda has a 15-minute limit, and long orchestration belongs in Step Functions." }
    ],
    answer: [0],
    tip: "Complex test orchestration in a pipeline → Step Functions invoke action."
  },
  {
    id: "ci-12", domain: "d1", topic: "CI/CD Concepts",
    q: "A team wants to verify that its application keeps working when an Availability Zone's instances fail or when the database has extra latency, before every major release reaches production. What should they add to the staging stage?",
    options: [
      { t: "An AWS Fault Injection Service (FIS) experiment, started from the pipeline (for example from CodeBuild or Step Functions), with stop conditions on CloudWatch alarms.",
        why: "Correct. FIS runs controlled chaos experiments, and stop conditions end the experiment when an alarm goes off." },
      { t: "Delete instances by hand during testing.",
        why: "Manual and not repeatable." },
      { t: "CodeGuru Reviewer.",
        why: "Static code review doesn't test resilience." },
      { t: "More unit tests.",
        why: "Unit tests can't simulate infrastructure failures." }
    ],
    answer: [0],
    tip: "Resilience or chaos testing → AWS FIS (with alarm stop conditions)."
  },
  {
    id: "ci-13", domain: "d1", topic: "CI/CD Concepts",
    q: "Auditors require that every release artifact deployed to production is kept for 7 years and can NEVER be deleted or overwritten during that time, not even by administrators or the root user. Artifacts are stored in S3. What should the DevOps engineer configure?",
    options: [
      { t: "Turn on S3 Versioning and S3 Object Lock in COMPLIANCE mode with a 7-year retention period on the release bucket.",
        why: "Correct. In compliance mode, nobody, including the root user, can delete or overwrite a locked object version before its retention date." },
      { t: "S3 Object Lock in GOVERNANCE mode.",
        why: "Users with special permissions can override governance mode, so it doesn't meet 'never, not even administrators'." },
      { t: "A bucket policy that denies s3:DeleteObject.",
        why: "Administrators could change the policy." },
      { t: "An S3 lifecycle rule that keeps objects for 7 years.",
        why: "Lifecycle rules manage transitions and expiry. They don't prevent deletion." }
    ],
    answer: [0],
    tip: "Undeletable for N years, even by root → Object Lock compliance mode (needs versioning)."
  },
  {
    id: "ci-14", domain: "d1", topic: "CI/CD Concepts",
    q: "An S3 bucket stores build artifacts with versioning turned on. Each build overwrites the same keys, and storage cost keeps rising because of thousands of old versions. Only the last 30 days of old versions are needed. What should be done?",
    options: [
      { t: "Add an S3 lifecycle rule that expires NONCURRENT object versions 30 days after they become noncurrent (and cleans up expired delete markers).",
        why: "Correct. Noncurrent-version expiry removes old versions automatically while keeping the current one." },
      { t: "Turn off versioning.",
        why: "Existing versions stay, and you lose rollback and the S3 pipeline source." },
      { t: "A Lambda function that deletes old versions every night.",
        why: "Custom code. Lifecycle rules do this natively." },
      { t: "S3 Object Lock.",
        why: "Object Lock keeps versions. That's the opposite of what's needed." }
    ],
    answer: [0],
    tip: "Old object versions costing money → lifecycle rule: expire noncurrent versions."
  },
  {
    id: "ci-15", domain: "d1", topic: "CI/CD Concepts",
    q: "Security requires that AWS Lambda functions in production can ONLY be deployed with code packages built and signed by the official CI pipeline. Any unsigned or modified package must be rejected at deployment time. What should the DevOps engineer implement?",
    options: [
      { t: "Create an AWS Signer signing profile, sign the packages in the pipeline, and attach a Lambda code signing configuration that allows only that profile, with the untrusted-artifact policy set to Enforce.",
        why: "Correct. Lambda code signing checks signatures when code is deployed and rejects unsigned or invalid packages in Enforce mode." },
      { t: "Store packages in a private S3 bucket.",
        why: "This limits access, but it doesn't verify integrity or where the package came from." },
      { t: "Turn on CodeGuru Reviewer.",
        why: "It reviews source code. It doesn't sign or verify packages." },
      { t: "Set the code signing policy to Warn.",
        why: "Warn only logs. Unsigned code would still be deployed." }
    ],
    answer: [0],
    tip: "Only signed Lambda code → AWS Signer + code signing configuration (Enforce)."
  },
  {
    id: "ci-16", domain: "d1", topic: "CI/CD Concepts",
    q: "A team uses GitHub Actions to deploy to AWS. Currently an IAM user's access keys are stored as GitHub secrets. Security wants NO long-term AWS credentials outside AWS. What should the DevOps engineer do?",
    options: [
      { t: "Create an IAM OIDC identity provider for token.actions.githubusercontent.com and an IAM role that trusts it (AssumeRoleWithWebIdentity). The workflow uses aws-actions/configure-aws-credentials to get temporary credentials.",
        why: "Correct. GitHub's OIDC token is exchanged for short-lived AWS credentials, so no access keys are stored." },
      { t: "Rotate the IAM user's access keys every 7 days.",
        why: "They're still long-term keys stored in GitHub." },
      { t: "Store the keys in AWS Secrets Manager and read them from GitHub.",
        why: "GitHub would still need credentials to read Secrets Manager. That doesn't solve the problem." },
      { t: "Use the AWS account root user's keys.",
        why: "Never. Very insecure." }
    ],
    answer: [0],
    tip: "GitHub Actions (or GitLab, Bitbucket) → AWS without keys → IAM OIDC provider + role."
  },
  {
    id: "ci-17", domain: "d1", topic: "CI/CD Concepts",
    q: "An IAM role for GitHub Actions OIDC has a trust policy that checks only that the audience (aud) is sts.amazonaws.com. A security review says this is dangerous. Why, and what is the fix?",
    options: [
      { t: "Without a condition on token.actions.githubusercontent.com:sub, ANY GitHub repository could assume the role. Add a sub condition such as repo:my-org/payments:ref:refs/heads/main.",
        why: "Correct. The sub claim identifies the repository and branch (or environment). Restricting it makes sure only your workflow can assume the role." },
      { t: "The role needs a permissions boundary instead.",
        why: "A boundary limits what the role can do, not WHO can assume it." },
      { t: "The aud value should be github.com.",
        why: "For the official AWS action, the audience is sts.amazonaws.com." },
      { t: "OIDC roles can't be used for production.",
        why: "OIDC roles are the recommended way to use them." }
    ],
    answer: [0],
    tip: "OIDC trust policies must restrict the sub claim (repository + branch or environment), not just aud."
  },
  {
    id: "ci-18", domain: "d1", topic: "CI/CD Concepts",
    q: "A company's Jenkins server on EC2 runs out of capacity at peak times, and build queues grow to hours. The team wants to keep Jenkins as the orchestrator but stop managing more build agents. What should they do?",
    options: [
      { t: "Use the AWS CodeBuild plugin for Jenkins so that Jenkins jobs run their builds on CodeBuild, which scales on demand.",
        why: "Correct. Jenkins stays in charge, CodeBuild provides scalable managed build capacity, and you pay per minute." },
      { t: "Move the Jenkins server to a bigger instance type.",
        why: "One bigger machine still has a limit and must be managed." },
      { t: "Replace Jenkins with manual builds at night.",
        why: "Slower and manual." },
      { t: "Store Jenkins credentials in Secrets Manager.",
        why: "Good practice, but it doesn't add capacity." }
    ],
    answer: [0],
    tip: "Jenkins capacity problems → CodeBuild plugin for Jenkins (or a CodePipeline Jenkins action)."
  },
  {
    id: "ci-19", domain: "d1", topic: "CI/CD Concepts",
    q: "A Jenkins server in an on-premises data center needs to push images to ECR and deploy CloudFormation stacks. The company forbids long-term IAM access keys and already runs its own certificate authority. What should the DevOps engineer use?",
    options: [
      { t: "IAM Roles Anywhere: register the company CA as a trust anchor, create a profile and role, and have Jenkins use its X.509 certificate to get temporary credentials.",
        why: "Correct. Roles Anywhere gives workloads outside AWS temporary credentials using certificates, with no access keys." },
      { t: "Create an IAM user and rotate its keys monthly.",
        why: "These are still long-term keys." },
      { t: "An EC2 instance profile on the on-premises server.",
        why: "Instance profiles only work on EC2 instances." },
      { t: "GitHub OIDC.",
        why: "That's for GitHub Actions workflows, not an on-premises Jenkins server." }
    ],
    answer: [0],
    tip: "On-premises servers → AWS without keys → IAM Roles Anywhere (X.509 certificates). EC2 → instance profile."
  }
];
