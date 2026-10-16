// DOP-C02 quiz question bank.
// To add questions: append objects to QUESTIONS below.
//   domain : must match a domain id in DOMAINS
//   topic  : must match a topic name listed under that domain
//   answer : array of correct option indexes (0-based). More than one = multiple-response question.
//   options: each has t (text) and why (why it is right / wrong)
//   tip    : one-line exam takeaway shown after answering

window.DOMAINS = [
  { id: "d1", name: "Domain 1: SDLC Automation", weight: 22,
    topics: ["CodeCommit", "CodeBuild", "CodeArtifact"] },
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
  }
];
