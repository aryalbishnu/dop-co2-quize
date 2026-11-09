// DOP-C02 quiz question bank.
// To add questions: append objects to QUESTIONS below.
//   domain : must match a domain id in DOMAINS
//   topic  : must match a topic name listed under that domain
//   answer : array of correct option indexes (0-based). More than one = multiple-response question.
//   options: each has t (text) and why (why it is right / wrong)
//   tip    : one-line exam takeaway shown after answering

window.DOMAINS = [
  { id: "d1", name: "Domain 1: SDLC Automation", weight: 22,
    topics: ["CodeCommit", "CodeBuild", "CodeArtifact", "ECR", "CodePipeline", "CodeConnections", "CodeGuru", "CI/CD Concepts", "CodeDeploy", "Deployment Patterns", "Elastic Beanstalk", "Lambda Versions and Aliases", "ECS and Fargate", "EKS for CI/CD", "Testing in Pipelines", "EC2 Image Builder"] },
  { id: "d2", name: "Domain 2: Configuration Management & IaC", weight: 17,
    topics: ["CloudFormation Core", "CloudFormation Change Control", "Nested and Cross-Stack", "Helper Scripts and Policies", "Extending CloudFormation", "Rollback and Troubleshooting","StackSets","AWS CDK","AWS SAM","Systems Manager","AppConfig","AWS Organizations","Control Tower"] },
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
  },

  // ───────────────────────────── CodeDeploy ─────────────────────────────
  {
    id: "cd-01", domain: "d1", topic: "CodeDeploy",
    q: "A company runs 300 EC2 instances across several Auto Scaling groups and wants to use CodeDeploy. The CodeDeploy agent must be installed on every instance, including new ones, and kept up to date automatically with the LEAST operational overhead. What should the DevOps engineer do?",
    options: [
      { t: "Use an AWS Systems Manager State Manager association that installs the AWSCodeDeployAgent package and keeps it updated on a schedule, targeting the instances by tag.",
        why: "Correct. Systems Manager installs the agent and keeps it updated across the whole fleet automatically, including new instances that match the target tags." },
      { t: "SSH into each instance and install the agent manually.",
        why: "Manual work that doesn't scale and doesn't cover new instances." },
      { t: "Bake the agent into the AMI and never update it.",
        why: "This works for new instances, but the agent goes out of date." },
      { t: "The agent isn't needed for EC2 deployments.",
        why: "EC2 and on-premises deployments require the agent. Only Lambda and ECS deployments don't." }
    ],
    answer: [0],
    tip: "Install and update the CodeDeploy agent at scale → Systems Manager (State Manager + AWSCodeDeployAgent)."
  },
  {
    id: "cd-02", domain: "d1", topic: "CodeDeploy",
    q: "EC2 instances in private subnets with no NAT gateway are targets of a CodeDeploy deployment group. Deployments stay 'Pending' and eventually time out. The agent is running and the instance profile has S3 read access. What should the DevOps engineer add?",
    options: [
      { t: "Interface VPC endpoints for CodeDeploy (codedeploy and codedeploy-commands-secure) and an S3 gateway endpoint for downloading the revision.",
        why: "Correct. The agent has to reach CodeDeploy over HTTPS and download the bundle from S3. Endpoints provide both without internet access." },
      { t: "An inbound security group rule for port 443 from CodeDeploy.",
        why: "The agent connects OUT to CodeDeploy. No inbound rule is needed." },
      { t: "Elastic IPs on the instances.",
        why: "The instances are in private subnets with no internet route, so public IPs don't help." },
      { t: "Switch the deployment to blue/green.",
        why: "The agent still can't reach CodeDeploy." }
    ],
    answer: [0],
    tip: "Agent in private subnets → CodeDeploy VPC endpoints + S3 gateway endpoint (or a NAT gateway). Outbound 443 only."
  },
  {
    id: "cd-03", domain: "d1", topic: "CodeDeploy",
    q: "A deployment to EC2 fails at the DownloadBundle step with an access denied error. The revision is stored in an S3 bucket encrypted with a customer-managed KMS key. What is the MOST likely fix?",
    options: [
      { t: "Give the EC2 instance profile s3:GetObject on the revision bucket and kms:Decrypt on the key (and allow the role in the key policy).",
        why: "Correct. The agent downloads the bundle using the INSTANCE's role, so it needs S3 read access and KMS decrypt." },
      { t: "Add S3 permissions to the CodeDeploy service role only.",
        why: "The service role doesn't download the bundle. The agent does, using the instance profile." },
      { t: "Make the bucket public.",
        why: "Insecure and unnecessary." },
      { t: "Increase the hook timeout.",
        why: "This is a permissions problem, not a timeout." }
    ],
    answer: [0],
    tip: "DownloadBundle access denied → instance profile needs S3 GetObject (+ kms:Decrypt)."
  },
  {
    id: "cd-04", domain: "d1", topic: "CodeDeploy",
    q: "A team's deployment fails with 'The CodeDeploy agent did not find an AppSpec file within the unpacked revision directory'. The ZIP contains a folder named myapp/ with appspec.yml, scripts/ and src/ inside it. What is wrong?",
    options: [
      { t: "appspec.yml must be at the ROOT of the revision bundle. Zip the contents of myapp/ rather than the folder itself.",
        why: "Correct. CodeDeploy looks for appspec.yml in the top level of the revision." },
      { t: "The file must be named appspec.json.",
        why: "For EC2, the file name is appspec.yml." },
      { t: "Revisions must be .tar files.",
        why: ".zip, .tar and .tgz are all supported." },
      { t: "The agent version is too old.",
        why: "The error clearly says where the file is missing." }
    ],
    answer: [0],
    tip: "AppSpec not found → appspec.yml must be at the root of the bundle."
  },
  {
    id: "cd-05", domain: "d1", topic: "CodeDeploy",
    q: "In an in-place EC2 deployment, the team needs a step that runs AFTER the application has started and FAILS the deployment if the app's /health endpoint doesn't return HTTP 200. Which lifecycle hook should run this check?",
    options: [
      { t: "ValidateService, with a script such as 'curl --fail http://localhost/health' that exits non-zero when the check fails.",
        why: "Correct. ValidateService is the last scriptable step and is meant for checking the deployment. A non-zero exit fails it." },
      { t: "BeforeInstall.",
        why: "This runs before the new files are installed and before the app starts." },
      { t: "DownloadBundle.",
        why: "You can't add scripts to DownloadBundle." },
      { t: "ApplicationStop.",
        why: "This runs at the start, to stop the OLD version." }
    ],
    answer: [0],
    tip: "Order: ApplicationStop → BeforeInstall → AfterInstall → ApplicationStart → ValidateService (check here, exit non-zero to fail)."
  },
  {
    id: "cd-06", domain: "d1", topic: "CodeDeploy",
    q: "A bad revision broke the stop_server.sh script. The team fixed the script in a NEW revision, but every new deployment still fails at the ApplicationStop step on all instances. What should the DevOps engineer do?",
    options: [
      { t: "Redeploy the fixed revision with the --ignore-application-stop-failures option (console: don't fail the deployment if ApplicationStop fails).",
        why: "Correct. ApplicationStop runs the PREVIOUS revision's script, which is still broken. Ignoring that one failure lets the fixed revision install." },
      { t: "Raise the ApplicationStop timeout.",
        why: "The script fails, it doesn't just run slowly." },
      { t: "Delete the deployment group.",
        why: "This loses the configuration, and the instances still hold the broken revision's information." },
      { t: "Rename the script in the new revision.",
        why: "The new revision isn't used at ApplicationStop. The previous revision is." }
    ],
    answer: [0],
    tip: "ApplicationStop uses the previous revision's script → --ignore-application-stop-failures."
  },
  {
    id: "cd-07", domain: "d1", topic: "CodeDeploy",
    q: "A deployment fails at the Install step because files already exist in /var/www/html. Those files were placed there by a manual setup, not by a previous CodeDeploy deployment. The new revision's files should replace them. What should be changed?",
    options: [
      { t: "Set file_exists_behavior to OVERWRITE in appspec.yml (or on the deployment).",
        why: "Correct. The default, DISALLOW, fails when a file exists that the previous deployment didn't create. OVERWRITE replaces it." },
      { t: "Set file_exists_behavior to RETAIN.",
        why: "RETAIN keeps the OLD files, but the requirement is to replace them." },
      { t: "Add a permissions section.",
        why: "Permissions set owner and mode. They don't resolve file conflicts." },
      { t: "Use the AllAtOnce configuration.",
        why: "The deployment speed doesn't affect file conflicts." }
    ],
    answer: [0],
    tip: "file_exists_behavior: DISALLOW (default, fails) · OVERWRITE (replace) · RETAIN (keep existing)."
  },
  {
    id: "cd-08", domain: "d1", topic: "CodeDeploy",
    q: "An e-commerce site runs on EC2 instances in an Auto Scaling group behind an ALB. Deployments must cause NO loss of serving capacity, and the team must be able to switch back to the previous version within seconds if problems appear. Which CodeDeploy setup fits BEST?",
    options: [
      { t: "A blue/green deployment that copies the Auto Scaling group, moves traffic through the ALB, and keeps the original instances for a while before terminating them.",
        why: "Correct. A full new fleet takes traffic, and the original fleet stays available for a fast rollback." },
      { t: "In-place with AllAtOnce.",
        why: "Every instance updates at the same time, which risks downtime and gives no quick switch back." },
      { t: "In-place with OneAtATime.",
        why: "It reduces capacity during the deployment, and rollback means a slow redeployment." },
      { t: "Blue/green on on-premises servers.",
        why: "Not supported. These are EC2 instances anyway." }
    ],
    answer: [0],
    tip: "No capacity loss + fast rollback on EC2 → blue/green (copy the Auto Scaling group + load balancer, keep the original fleet for a while)."
  },
  {
    id: "cd-09", domain: "d1", topic: "CodeDeploy",
    q: "A company deploys to 40 EC2 instances. During any deployment, at least 75% of the instances must stay healthy and serving traffic. Which deployment configuration should be used?",
    options: [
      { t: "A custom deployment configuration with minimum healthy hosts of type FLEET_PERCENT and value 75.",
        why: "Correct. Minimum healthy hosts controls how many instances must stay healthy. CodeDeploy then updates the rest in batches." },
      { t: "CodeDeployDefault.HalfAtATime.",
        why: "Only 50% stay healthy, which is below the requirement." },
      { t: "CodeDeployDefault.AllAtOnce.",
        why: "Every instance updates at the same time." },
      { t: "CodeDeployDefault.LambdaLinear10PercentEvery1Minute.",
        why: "That configuration is for Lambda, not EC2." }
    ],
    answer: [0],
    tip: "\"Keep X% healthy\" → custom configuration with minimum healthy hosts (FLEET_PERCENT or HOST_COUNT)."
  },
  {
    id: "cd-10", domain: "d1", topic: "CodeDeploy",
    q: "A service runs on EC2 instances spread across three Availability Zones. A bad release once broke every AZ before monitoring noticed. The team wants each release deployed one AZ at a time, with a waiting period to watch metrics before moving to the next AZ. What should they use?",
    options: [
      { t: "A zonal deployment configuration, with a monitoring duration after each Availability Zone (and an extra wait after the first one), plus CloudWatch alarms for automatic rollback.",
        why: "Correct. Zonal configurations deploy AZ by AZ with waits in between, so a bad release only reaches one AZ." },
      { t: "CodeDeployDefault.OneAtATime.",
        why: "This goes instance by instance, without regard to AZs and without a monitoring wait." },
      { t: "Three separate deployment groups started at the same time.",
        why: "Running them together gives no isolation between AZs." },
      { t: "Blue/green with immediate traffic rerouting.",
        why: "All traffic moves at once. There's no AZ-by-AZ protection." }
    ],
    answer: [0],
    tip: "Contain a bad release to one AZ → zonal deployment configuration (with monitoring waits) + alarms."
  },
  {
    id: "cd-11", domain: "d1", topic: "CodeDeploy",
    q: "An Auto Scaling group is part of a CodeDeploy deployment group. During busy periods, new instances launched by scale-out start serving traffic running an OLD version that is missing the latest changes. What explains this, and what is the best practice?",
    options: [
      { t: "Instances launched while a deployment is in progress can receive the previous revision. CodeDeploy starts a follow-up deployment for them; best practice is to pause scaling during deployments (or rely on the follow-up).",
        why: "Correct. CodeDeploy's lifecycle hook gives new instances the last SUCCESSFUL revision. During a deployment, that may still be the old one." },
      { t: "Auto Scaling groups can't be used with CodeDeploy.",
        why: "They're supported through a lifecycle hook that CodeDeploy adds." },
      { t: "The CodeDeploy agent must be removed from the AMI.",
        why: "The agent is needed for new instances to receive the revision." },
      { t: "Use the AllAtOnce configuration.",
        why: "This doesn't change what new instances receive while a deployment is running." }
    ],
    answer: [0],
    tip: "New Auto Scaling instances get the last successful revision. Scale-out during a deployment → follow-up deployment, or pause scaling."
  },
  {
    id: "cd-12", domain: "d1", topic: "CodeDeploy",
    q: "A company wants to deploy new Lambda function versions by sending 10% of traffic to the new version, waiting 10 minutes, and then sending ALL remaining traffic if no alarms go off. It uses AWS SAM. What should the template contain?",
    options: [
      { t: "AutoPublishAlias on the function and a DeploymentPreference of Type Canary10Percent10Minutes with the CloudWatch alarms listed under Alarms.",
        why: "Correct. SAM creates the CodeDeploy setup, shifts the alias traffic as a canary, and rolls back if an alarm goes off." },
      { t: "DeploymentPreference Type Linear10PercentEvery10Minutes.",
        why: "Linear adds 10% every 10 minutes, so it takes 100 minutes to finish, not 10% followed by everything else." },
      { t: "DeploymentPreference Type AllAtOnce.",
        why: "It sends all traffic at once, with no canary." },
      { t: "A Route 53 weighted record between two function URLs.",
        why: "Custom and manual, with no automatic rollback." }
    ],
    answer: [0],
    tip: "Canary = X% then all the rest · Linear = another X% every N minutes. SAM: AutoPublishAlias + DeploymentPreference."
  },
  {
    id: "cd-13", domain: "d1", topic: "CodeDeploy",
    q: "A Lambda deployment uses a BeforeAllowTraffic hook function to run integration tests against the new version. The tests pass in about 30 seconds, but every deployment fails roughly an hour later at the BeforeAllowTraffic step. What is the cause?",
    options: [
      { t: "The hook function never calls codedeploy:PutLifecycleEventHookExecutionStatus with Succeeded, so CodeDeploy waits until the hook times out.",
        why: "Correct. Hook functions must report their result back to CodeDeploy. The hook function's role also needs this permission." },
      { t: "Lambda hooks only run for ECS deployments.",
        why: "Lambda deployments support BeforeAllowTraffic and AfterAllowTraffic hooks." },
      { t: "The function's memory is too low.",
        why: "The tests finish quickly. The missing piece is reporting the result." },
      { t: "BeforeAllowTraffic must be a shell script.",
        why: "For Lambda and ECS deployments, hooks are Lambda functions, not scripts." }
    ],
    answer: [0],
    tip: "Lambda or ECS hook functions → must call PutLifecycleEventHookExecutionStatus (otherwise they fail after about 1 hour)."
  },
  {
    id: "cd-14", domain: "d1", topic: "CodeDeploy",
    q: "A team is moving an Amazon ECS Fargate service to CodeDeploy blue/green deployments. Which set of resources is REQUIRED?",
    options: [
      { t: "An ECS service with the CODE_DEPLOY deployment controller, an ALB or NLB with two target groups, and a production listener (plus an optional test listener).",
        why: "Correct. CodeDeploy moves traffic between the two target groups through the listeners." },
      { t: "An ECS service with the default ECS deployment controller and one target group.",
        why: "That's the ECS rolling update, not CodeDeploy blue/green." },
      { t: "The CodeDeploy agent installed in each container.",
        why: "ECS deployments don't use the agent." },
      { t: "Route 53 weighted records for the two task sets.",
        why: "CodeDeploy uses load balancer listeners and target groups, not DNS." }
    ],
    answer: [0],
    tip: "ECS blue/green = CODE_DEPLOY controller + 2 target groups + production listener (+ test listener)."
  },
  {
    id: "cd-15", domain: "d1", topic: "CodeDeploy",
    q: "During an ECS blue/green deployment, the QA team must run automated API tests against the NEW tasks on port 8080 BEFORE any production traffic reaches them. If the tests fail, the deployment must stop and roll back. How should this be configured?",
    options: [
      { t: "Add a test listener (port 8080) to the deployment group and an AfterAllowTestTraffic hook Lambda function that runs the tests and reports Failed if they fail. Turn on automatic rollback.",
        why: "Correct. AfterAllowTestTraffic runs when the test listener points at the new task set but before production traffic moves." },
      { t: "Use an AfterAllowTraffic hook.",
        why: "This runs AFTER production traffic has moved, which is too late." },
      { t: "Use a ValidateService script.",
        why: "ValidateService is for EC2 and on-premises. ECS hooks are Lambda functions." },
      { t: "Use ECSAllAtOnce with no hooks.",
        why: "Nothing would be tested before production traffic." }
    ],
    answer: [0],
    tip: "ECS order: … AfterInstall → AllowTestTraffic → AfterAllowTestTraffic (test here) → BeforeAllowTraffic → AllowTraffic → AfterAllowTraffic."
  },
  {
    id: "cd-16", domain: "d1", topic: "CodeDeploy",
    q: "A Lambda deployment uses LambdaLinear10PercentEvery1Minute. The team wants the deployment to STOP and traffic to return to the old version automatically if the new version's error rate rises during the rollout. What should be configured on the deployment group?",
    options: [
      { t: "A CloudWatch alarm on the function alias's Errors metric attached to the deployment group, with 'Roll back when alarm thresholds are met' turned on.",
        why: "Correct. An alarm in ALARM stops the deployment, and alarm-based rollback moves the alias back to the original version." },
      { t: "Only 'Roll back when a deployment fails'.",
        why: "Without an alarm, rising errors don't fail the deployment, so nothing triggers a rollback." },
      { t: "An SNS trigger for deployment failures.",
        why: "This only sends notifications. It doesn't stop or roll back anything." },
      { t: "Use AllAtOnce so errors appear sooner.",
        why: "This removes the gradual safety net." }
    ],
    answer: [0],
    tip: "Gradual rollout + automatic rollback on errors → CloudWatch alarm on the deployment group + roll back when alarm thresholds are met."
  },
  {
    id: "cd-17", domain: "d1", topic: "CodeDeploy",
    q: "An in-place EC2 deployment of revision v5 fails. Automatic rollback is turned on, and v4 was the last successful revision. What does CodeDeploy actually do?",
    options: [
      { t: "It creates a NEW deployment (with a new deployment ID) that redeploys revision v4 to the instances, running the lifecycle hooks again.",
        why: "Correct. On EC2 and on-premises, a rollback is a new deployment of the last known good revision." },
      { t: "It restores a snapshot of each instance from before the deployment.",
        why: "CodeDeploy doesn't take or restore snapshots." },
      { t: "It instantly switches the alias back to v4.",
        why: "That's how Lambda rollbacks work, not EC2 in-place ones." },
      { t: "It does nothing. Rollback only works with blue/green.",
        why: "Automatic rollback works with in-place deployments too." }
    ],
    answer: [0],
    tip: "EC2 rollback = a new deployment of the last good revision · Lambda / ECS / blue-green = move traffic back."
  },
  {
    id: "cd-18", domain: "d1", topic: "CodeDeploy",
    q: "A critical security fix must be deployed immediately. A CloudWatch alarm attached to the deployment group is currently in ALARM because of the very bug being fixed, so every deployment is stopped as soon as it starts. What should the DevOps engineer do?",
    options: [
      { t: "Start the deployment with the 'ignore alarm configuration' option for this deployment, then go back to normal alarm checks.",
        why: "Correct. Ignoring the alarm configuration lets an emergency fix go out while the alarm is firing, without changing the deployment group permanently." },
      { t: "Delete the CloudWatch alarm.",
        why: "This permanently removes protection." },
      { t: "Switch to AllAtOnce.",
        why: "The alarm would still stop the deployment." },
      { t: "Wait for the alarm to clear by itself.",
        why: "It won't clear until the fix is deployed." }
    ],
    answer: [0],
    tip: "Deploy while an alarm is firing → ignore alarm configuration (for that deployment only)."
  },
  {
    id: "cd-19", domain: "d1", topic: "CodeDeploy",
    q: "An ECS blue/green deployment fails right away when it starts. The deployment error says CodeDeploy isn't authorized to perform iam:PassRole. The service uses a task execution role and a task role. What is the fix?",
    options: [
      { t: "Add iam:PassRole for the task execution role and task role to the CodeDeploy service role (the AWSCodeDeployRoleForECS policy doesn't cover passing your own task roles).",
        why: "Correct. CodeDeploy creates the new task set with your task definition, so it must be allowed to pass the roles that the task definition uses." },
      { t: "Add iam:PassRole to the developers' IAM users.",
        why: "CodeDeploy's service role creates the task set, not the developers." },
      { t: "Install the CodeDeploy agent in the containers.",
        why: "ECS deployments don't use the agent." },
      { t: "Switch the service to the ECS deployment controller.",
        why: "That removes CodeDeploy blue/green altogether." }
    ],
    answer: [0],
    tip: "ECS blue/green service role → AWSCodeDeployRoleForECS + iam:PassRole on the task roles."
  },
  {
    id: "cd-20", domain: "d1", topic: "CodeDeploy",
    q: "An Auto Scaling group used by a CodeDeploy deployment group keeps launching new instances that are terminated a few minutes later. The ALB health checks are fine for existing instances. Scaling activity shows the lifecycle hook was abandoned. What is the MOST likely cause?",
    options: [
      { t: "The deployment that CodeDeploy runs on each new instance through the lifecycle hook is failing (for example a broken script in the last revision), so the instance is never marked ready and is replaced.",
        why: "Correct. CodeDeploy's lifecycle hook only lets an instance go InService after its deployment succeeds. If that deployment fails, the instance is replaced. Check that instance's deployment in CodeDeploy." },
      { t: "The ALB is in the wrong VPC.",
        why: "Existing instances are healthy, so the ALB setup works." },
      { t: "The Auto Scaling group has too many instances.",
        why: "Unrelated to the abandoned lifecycle hook." },
      { t: "CloudTrail is turned off.",
        why: "CloudTrail doesn't affect instance launches." }
    ],
    answer: [0],
    tip: "New instances in a loop of launch and terminate + lifecycle hook abandoned → the CodeDeploy deployment on new instances is failing."
  },
  {
    id: "cd-21", domain: "d1", topic: "CodeDeploy",
    multi: true,
    q: "A deployment group uses OneAtATime across 4 EC2 instances. Which TWO statements about this configuration are true? (Choose TWO.)",
    options: [
      { t: "Instances are updated one at a time, so the deployment is the slowest of the built-in options but has the smallest effect at any moment.",
        why: "Correct. Only one instance is out of service at a time." },
      { t: "The deployment still counts as successful if only the LAST instance fails.",
        why: "Correct. OneAtATime succeeds if every instance succeeds, except that a failure on the last instance is allowed." },
      { t: "The deployment succeeds if at least one instance succeeds.",
        why: "That's the rule for AllAtOnce." },
      { t: "Half of the instances are updated at the same time.",
        why: "That's HalfAtATime." },
      { t: "OneAtATime can be used for Lambda deployments.",
        why: "Lambda uses canary, linear, or all-at-once traffic-shifting configurations." }
    ],
    answer: [0, 1],
    tip: "Success rules: AllAtOnce = at least 1 instance · HalfAtATime = at least half · OneAtATime = all except the last may fail."
  },
  {
    id: "cd-22", domain: "d1", topic: "CodeDeploy",
    q: "An operations team wants a message in Slack and a ticket created automatically whenever a CodeDeploy deployment FAILS or is ROLLED BACK in any deployment group. Which solution needs the LEAST custom work for both?",
    options: [
      { t: "An EventBridge rule on 'CodeDeploy Deployment State-change Notification' with state FAILURE that targets a Lambda function to create the ticket, and a notification rule to Slack through Chatbot.",
        why: "Correct. EventBridge gives an event-driven hook for the ticket automation, and notification rules send to Slack without code." },
      { t: "Poll ListDeployments every minute with a cron job.",
        why: "Polling and custom code." },
      { t: "Read the agent logs on every instance.",
        why: "Lambda and ECS deployments have no agent, and this is manual." },
      { t: "CloudTrail log file validation.",
        why: "That checks log integrity. It doesn't send alerts." }
    ],
    answer: [0],
    tip: "React to deployment results → EventBridge (automation) + notification rules / SNS triggers (people)."
  },

  // ───────────────────────────── Deployment Patterns ─────────────────────────────
  {
    id: "dp-01", domain: "d1", topic: "Deployment Patterns",
    q: "A production web app runs on Elastic Beanstalk with 8 instances. Deployments must cause NO downtime and must NOT reduce serving capacity at any point, at the LOWEST additional cost. Which deployment policy should be used?",
    options: [
      { t: "Rolling with additional batch.",
        why: "Correct. An extra batch is launched first, so full capacity is kept, and you only pay for one extra batch during the deployment." },
      { t: "Rolling.",
        why: "Capacity drops by one batch while each batch updates." },
      { t: "Immutable.",
        why: "Keeps full capacity, but briefly doubles the whole fleet, which costs more than one extra batch." },
      { t: "All at once.",
        why: "Causes downtime." }
    ],
    answer: [0],
    tip: "Beanstalk: full capacity at the lowest extra cost → rolling with additional batch."
  },
  {
    id: "dp-02", domain: "d1", topic: "Deployment Patterns",
    q: "A team's Elastic Beanstalk rolling deployments sometimes fail halfway, leaving some instances on the new version and others on the old one, and recovery takes a long manual redeployment. The team wants a failed deployment to NEVER affect the running instances, and to recover simply by discarding the new ones. Which policy should they use?",
    options: [
      { t: "Immutable.",
        why: "Correct. A full new set of instances is launched in a temporary Auto Scaling group. If they fail health checks, they're terminated and the original instances are never touched." },
      { t: "Rolling with additional batch.",
        why: "Existing instances are still updated in place, so a failure can still leave mixed versions." },
      { t: "All at once.",
        why: "Updates every running instance and causes downtime." },
      { t: "Rolling with a smaller batch size.",
        why: "Still changes existing instances in place." }
    ],
    answer: [0],
    tip: "Failed deployment must not touch existing servers → immutable (rollback = terminate the new instances)."
  },
  {
    id: "dp-03", domain: "d1", topic: "Deployment Patterns",
    q: "On Elastic Beanstalk, the product team wants 15% of real user traffic sent to a new version for 20 minutes. If health stays good, all traffic should move to it; if not, traffic should go back automatically. What should the DevOps engineer configure?",
    options: [
      { t: "The Traffic splitting deployment policy with a 15% traffic split and a 20-minute evaluation time.",
        why: "Correct. Traffic splitting is Beanstalk's built-in canary: new instances get a share of traffic for the evaluation time, then everything moves or rolls back." },
      { t: "Rolling with a batch size of 15%.",
        why: "This updates 15% of the instances, not 15% of the traffic, and it doesn't evaluate the new version before going on." },
      { t: "Immutable.",
        why: "Immutable doesn't send a chosen share of traffic for an evaluation period." },
      { t: "Clone the environment and swap URLs after 20 minutes.",
        why: "A URL swap moves ALL traffic at once. That's blue/green, not a 15% split." }
    ],
    answer: [0],
    tip: "Beanstalk canary (X% of traffic for Y minutes) → traffic splitting."
  },
  {
    id: "dp-04", domain: "d1", topic: "Deployment Patterns",
    q: "A company wants a blue/green deployment for an Elastic Beanstalk application: test the new version in a full separate environment, then switch all users to it, with the option to switch back quickly. How should this be done?",
    options: [
      { t: "Clone the environment (or create a new one), deploy the new version to it and test it, then use 'Swap environment URLs' to exchange the CNAMEs.",
        why: "Correct. Beanstalk blue/green works by swapping environment URLs (or with Route 53). Swapping back is the rollback." },
      { t: "Select 'Blue/green' as the deployment policy.",
        why: "Blue/green isn't a Beanstalk deployment policy." },
      { t: "Use the Rolling policy with a 100% batch size.",
        why: "This updates the same environment in place." },
      { t: "Delete the old environment first, then create the new one.",
        why: "Causes downtime and leaves no way to roll back." }
    ],
    answer: [0],
    tip: "Beanstalk blue/green = separate environment + Swap environment URLs (CNAME swap)."
  },
  {
    id: "dp-05", domain: "d1", topic: "Deployment Patterns",
    q: "After a blue/green switch on Elastic Beanstalk, the team terminated the old (blue) environment. Shortly afterwards, the application lost all its data, because the RDS database had been created as part of the blue environment. How should future environments be designed?",
    options: [
      { t: "Create the RDS database separately from Elastic Beanstalk, and pass its connection details to both environments (for example through environment properties or Secrets Manager).",
        why: "Correct. A database created inside a Beanstalk environment shares that environment's lifecycle. A separate database survives environment swaps and terminations." },
      { t: "Take an RDS snapshot before every swap and keep the database in the environment.",
        why: "This lets you restore, but the database is still deleted with the environment, which causes downtime and data loss risk." },
      { t: "Use the Immutable policy instead.",
        why: "Unrelated. The problem is where the database lives." },
      { t: "Never terminate old environments.",
        why: "Costly, and it doesn't fix the design." }
    ],
    answer: [0],
    tip: "Blue/green with Beanstalk → keep RDS outside the environments."
  },
  {
    id: "dp-06", domain: "d1", topic: "Deployment Patterns",
    q: "A company switches traffic from blue to green by changing a Route 53 record. Even 30 minutes after the switch, some users still reach the blue environment, and a rollback also takes a long time to take effect. The company wants an INSTANT switch in both directions. What should it change?",
    options: [
      { t: "Put both environments behind one Application Load Balancer and switch the listener between target groups (or change weighted target group weights).",
        why: "Correct. ALB listener and target group changes take effect immediately, without DNS caching." },
      { t: "Raise the Route 53 record TTL.",
        why: "A higher TTL makes clients cache longer, which is slower." },
      { t: "Use Route 53 failover routing.",
        why: "Still DNS-based, so the same caching problem." },
      { t: "Ask users to clear their DNS cache.",
        why: "Not practical." }
    ],
    answer: [0],
    tip: "DNS switches are slowed by TTL caching. Instant blue/green → ALB target groups (weighted)."
  },
  {
    id: "dp-07", domain: "d1", topic: "Deployment Patterns",
    q: "Users complain that they are logged out every time the team does a blue/green deployment. Sessions are currently stored in memory on each EC2 instance. What should the DevOps engineer change?",
    options: [
      { t: "Store sessions outside the instances, in a shared store such as Amazon ElastiCache or DynamoDB, so both environments can read them.",
        why: "Correct. Externalized sessions survive any switch between environments or instances." },
      { t: "Turn on ALB sticky sessions.",
        why: "Stickiness keeps a user on one instance, but the green instances still don't have the session." },
      { t: "Increase the ALB deregistration delay.",
        why: "This only lets in-flight requests finish. It doesn't move sessions." },
      { t: "Use rolling deployments instead.",
        why: "Users would still lose sessions when their instance is updated." }
    ],
    answer: [0],
    tip: "Users logged out after deployments → keep sessions outside the servers (ElastiCache / DynamoDB)."
  },
  {
    id: "dp-08", domain: "d1", topic: "Deployment Patterns",
    q: "During a blue/green release, the new version needs a database column renamed from 'phone' to 'mobile_phone'. Both environments share the same database, and the team must be able to roll back to blue at any time. What is the SAFEST approach?",
    options: [
      { t: "Use expand and contract: add the new column while keeping the old one, deploy code that works with both, migrate the data, and remove the old column in a later release.",
        why: "Correct. Backward-compatible schema changes let blue and green both work with the shared database, so rolling back stays safe." },
      { t: "Rename the column in the same release as the code change.",
        why: "Blue would break immediately, and rolling back would fail." },
      { t: "Give each environment its own copy of the database.",
        why: "The data would split, and syncing it is complex." },
      { t: "Stop the application during the rename.",
        why: "Causes downtime, which defeats the purpose of blue/green." }
    ],
    answer: [0],
    tip: "Shared database in blue/green → backward-compatible (expand and contract) schema changes."
  },
  {
    id: "dp-09", domain: "d1", topic: "Deployment Patterns",
    q: "A company releases a new Lambda version. It wants 10% of traffic on the new version for 15 minutes; if CloudWatch alarms stay OK, ALL remaining traffic should then move at once, otherwise traffic must go back automatically. Which approach fits?",
    options: [
      { t: "CodeDeploy with a canary configuration (CodeDeployDefault.LambdaCanary10Percent15Minutes), with the alarms on the deployment group and rollback on alarm.",
        why: "Correct. Canary means one small step, a wait, then everything, and CodeDeploy rolls back on alarms." },
      { t: "LambdaLinear10PercentEvery1Minute.",
        why: "Linear adds 10% each minute, not 10% for 15 minutes followed by the rest." },
      { t: "LambdaAllAtOnce.",
        why: "No test period with a small share of traffic." },
      { t: "Point Route 53 weighted records at two function URLs.",
        why: "Manual, and it has no automatic alarm-based rollback." }
    ],
    answer: [0],
    tip: "Canary = X%, wait, then the rest · Linear = +X% every N minutes."
  },
  {
    id: "dp-10", domain: "d1", topic: "Deployment Patterns",
    q: "A risk-averse team wants traffic to a new ECS service version to increase GRADUALLY in equal steps, 10% more every 3 minutes, checking alarms at each step and rolling back if one goes off. Which option should they choose?",
    options: [
      { t: "CodeDeploy ECS blue/green with CodeDeployDefault.ECSLinear10PercentEvery3Minutes and CloudWatch alarms with rollback.",
        why: "Correct. Linear moves traffic in equal steps, and alarms can stop and roll back the deployment at any step." },
      { t: "ECSCanary10Percent15Minutes.",
        why: "Canary moves 10%, waits, then the rest. That's not equal steps." },
      { t: "ECSAllAtOnce.",
        why: "Not gradual." },
      { t: "An ECS rolling update with minimumHealthyPercent 90.",
        why: "This replaces tasks, but it doesn't shift traffic in controlled steps with alarm checks at each one." }
    ],
    answer: [0],
    tip: "Equal traffic steps over time → linear (ECSLinear… / LambdaLinear…)."
  },
  {
    id: "dp-11", domain: "d1", topic: "Deployment Patterns",
    q: "A team wants to send 5% of a Lambda function's traffic to a new version for a quick manual check, WITHOUT setting up CodeDeploy. What is the simplest way?",
    options: [
      { t: "Publish the new version and set the alias's weighted routing (routing configuration) so 95% goes to the current version and 5% to the new one.",
        why: "Correct. Lambda aliases can split traffic between two versions by weight. Change the weights by hand to finish or roll back." },
      { t: "Create a second function and use an ALB with weighted target groups.",
        why: "Possible, but much more setup." },
      { t: "Set reserved concurrency to 5% on the new version.",
        why: "Concurrency limits how many requests run at once. It doesn't split traffic." },
      { t: "Use $LATEST for 5% of calls.",
        why: "$LATEST can't be given a percentage of traffic like this." }
    ],
    answer: [0],
    tip: "Manual Lambda canary → alias weighted routing between two versions."
  },
  {
    id: "dp-12", domain: "d1", topic: "Deployment Patterns",
    q: "An API Gateway REST API's 'prod' stage serves all users. The team wants 10% of production requests to use a new deployment, compare its error rates, and then make it the main version. What should they use?",
    options: [
      { t: "An API Gateway canary release on the prod stage with 10% canary traffic, then promote the canary when it looks healthy.",
        why: "Correct. Stage canary settings send a percentage of requests to the new deployment, and promoting it makes it the stage's main deployment." },
      { t: "Create a separate 'prod2' stage and tell 10% of users to use it.",
        why: "Manual, and users would need different URLs." },
      { t: "Throttle the prod stage to 10%.",
        why: "Throttling limits request rates. It doesn't route requests to a new version." },
      { t: "Use CloudFront continuous deployment for the API.",
        why: "API Gateway has a built-in stage canary, which is the simplest option here." }
    ],
    answer: [0],
    tip: "REST API canary → API Gateway stage canary release, then promote."
  },
  {
    id: "dp-13", domain: "d1", topic: "Deployment Patterns",
    q: "A company changes several cache behaviours and headers on a busy CloudFront distribution. It wants to test the new configuration with 5% of real viewers (or only requests with a test header) before applying it to everyone. What should it use?",
    options: [
      { t: "CloudFront continuous deployment: a staging distribution with the new configuration and a weight-based (5%) or header-based traffic policy, then promote it.",
        why: "Correct. Continuous deployment sends part of the traffic to a staging distribution and lets you promote it when it's ready." },
      { t: "Edit the production distribution directly and watch the logs.",
        why: "Every viewer is affected at once." },
      { t: "Route 53 weighted records between two distributions.",
        why: "This works, but DNS caching and two separate distributions make it harder. Continuous deployment is built for this." },
      { t: "Lambda@Edge randomly rewriting requests.",
        why: "Custom code. Not needed." }
    ],
    answer: [0],
    tip: "Canary for CloudFront configuration → CloudFront continuous deployment (staging distribution)."
  },
  {
    id: "dp-14", domain: "d1", topic: "Deployment Patterns",
    q: "During an ECS rolling update, a bad image makes every new task crash on start-up. The deployment keeps trying to start tasks for a long time, and the service never stabilizes. The team wants ECS to detect this and roll back to the last working deployment automatically. What should they turn on?",
    options: [
      { t: "The ECS deployment circuit breaker with rollback turned on.",
        why: "Correct. The circuit breaker notices when tasks keep failing to reach steady state, fails the deployment, and rolls back to the last completed deployment." },
      { t: "Raise minimumHealthyPercent to 100.",
        why: "This keeps old tasks running, but it doesn't detect the failure or roll back." },
      { t: "Turn on Container Insights.",
        why: "It gives visibility only. No rollback." },
      { t: "Switch to the Fargate Spot capacity provider.",
        why: "Unrelated to deployment failures." }
    ],
    answer: [0],
    tip: "ECS rolling update keeps failing → deployment circuit breaker + rollback (or CloudWatch alarm rollback)."
  },
  {
    id: "dp-15", domain: "d1", topic: "Deployment Patterns",
    q: "An Auto Scaling group of 20 instances must move to a new AMI. Instances must be replaced gradually, at least 90% must stay healthy, the rollout should pause at 50% for checks, and it should roll back automatically if a CloudWatch alarm goes off. What should the DevOps engineer use?",
    options: [
      { t: "Update the launch template and start an Auto Scaling instance refresh with MinHealthyPercentage 90, a checkpoint at 50%, and automatic rollback with alarms.",
        why: "Correct. Instance refresh is the native rolling replacement for Auto Scaling groups, with checkpoints and rollback." },
      { t: "Terminate all instances so Auto Scaling launches new ones.",
        why: "Causes downtime." },
      { t: "Change the AMI in the launch template and wait for normal scaling to replace instances.",
        why: "Old instances may run indefinitely. Nothing controls the rollout." },
      { t: "Create a new Auto Scaling group by hand and move traffic yourself.",
        why: "Possible, but more manual than instance refresh." }
    ],
    answer: [0],
    tip: "Roll a new AMI through an Auto Scaling group → instance refresh (MinHealthyPercentage, checkpoints, automatic rollback)."
  },
  {
    id: "dp-16", domain: "d1", topic: "Deployment Patterns",
    q: "A CloudFormation stack manages an Auto Scaling group. When the launch template changes, the team wants CloudFormation to create an ENTIRELY NEW Auto Scaling group, keep the old one until the new one succeeds, and remove the old one only then (an immutable update). Which UpdatePolicy should they use?",
    options: [
      { t: "AutoScalingReplacingUpdate with WillReplace: true (usually with a CreationPolicy and cfn-signal for the new instances).",
        why: "Correct. A replacing update creates a new group and keeps the old one if the new one fails, so the update is immutable." },
      { t: "AutoScalingRollingUpdate with MaxBatchSize 1.",
        why: "This replaces instances inside the SAME group in batches. That's rolling, not immutable." },
      { t: "AutoScalingScheduledAction.",
        why: "This controls scheduled actions during updates. It doesn't make updates immutable." },
      { t: "DeletionPolicy: Retain.",
        why: "This controls what happens when the stack is deleted, not how updates work." }
    ],
    answer: [0],
    tip: "CloudFormation: AutoScalingRollingUpdate = rolling · AutoScalingReplacingUpdate (WillReplace) = immutable."
  },
  {
    id: "dp-17", domain: "d1", topic: "Deployment Patterns",
    q: "A financial trading app must NEVER serve two different versions to users at the same time, because the versions calculate prices differently. Deployments must have no downtime and allow a fast rollback. Which pattern should be used?",
    options: [
      { t: "Blue/green, switching ALL traffic from blue to green at once (for example by switching the ALB listener), keeping blue for rollback.",
        why: "Correct. Users only ever see one version, there's no downtime, and switching back is instant." },
      { t: "Rolling.",
        why: "Old and new versions serve users at the same time during the rollout." },
      { t: "Canary.",
        why: "Canary deliberately sends part of the traffic to the new version while the rest uses the old one." },
      { t: "All at once.",
        why: "Causes downtime." }
    ],
    answer: [0],
    tip: "No mixed versions + no downtime + fast rollback → blue/green with an all-at-once switch."
  },
  {
    id: "dp-18", domain: "d1", topic: "Deployment Patterns",
    q: "A development environment on Elastic Beanstalk is redeployed dozens of times a day. Brief downtime is acceptable, and the team wants deployments to be as FAST and CHEAP as possible. Which policy should they use?",
    options: [
      { t: "All at once.",
        why: "Correct. It's the fastest, adds no extra instances, and its downtime is acceptable in dev." },
      { t: "Immutable.",
        why: "Slowest and most expensive (a duplicate fleet)." },
      { t: "Traffic splitting.",
        why: "Needs new instances and an evaluation period, so it's slow." },
      { t: "Blue/green with URL swaps.",
        why: "Needs a second environment, which is slow and costs more." }
    ],
    answer: [0],
    tip: "Dev or test, downtime OK, fastest and cheapest → all at once."
  },
  {
    id: "dp-19", domain: "d1", topic: "Deployment Patterns",
    q: "A team deploys new code to production every day, but it wants to turn a big new feature on for 5% of users, then 25%, then everyone, with automatic rollback of the CONFIGURATION if error alarms go off, and without redeploying code. What should it use?",
    options: [
      { t: "AWS AppConfig feature flags with a linear or exponential deployment strategy, a bake time, and CloudWatch alarms for automatic rollback.",
        why: "Correct. Feature flags separate releasing from deploying, and AppConfig rolls out the flag change gradually with alarm-based rollback." },
      { t: "A new CodeDeploy deployment for every percentage step.",
        why: "This redeploys code, which the team wants to avoid." },
      { t: "Store the flag in an environment variable and redeploy.",
        why: "Requires a redeploy, with no gradual rollout and no automatic rollback." },
      { t: "Use CloudWatch Evidently.",
        why: "Evidently has been retired. AppConfig is the current answer." }
    ],
    answer: [0],
    tip: "Gradual feature release without redeploying → AppConfig feature flags + deployment strategy + alarms."
  },
  {
    id: "dp-20", domain: "d1", topic: "Deployment Patterns",
    q: "A company wants every deployment to replace servers instead of changing them, so that no server ever drifts from its known configuration and every instance can be recreated exactly. Which approach follows this IMMUTABLE infrastructure principle?",
    options: [
      { t: "Bake each release into a new AMI (for example with EC2 Image Builder) and roll it out by replacing instances (instance refresh, immutable, or blue/green deployments).",
        why: "Correct. New, versioned images replace old servers, so there's no drift and everything can be repeated." },
      { t: "SSH into the servers and apply updates by hand.",
        why: "This changes servers in place, which causes drift." },
      { t: "Use the in-place AllAtOnce configuration on long-lived instances.",
        why: "In-place deployments change existing servers." },
      { t: "Run yum update with a nightly cron job on every server.",
        why: "Changes servers in place, so they drift apart over time." }
    ],
    answer: [0],
    tip: "Immutable infrastructure = new AMIs or images + replace servers (instance refresh, immutable, blue/green). Mutable = in-place changes."
  },
  {
    id: "dp-21", domain: "d1", topic: "Deployment Patterns",
    multi: true,
    q: "Which TWO of these deployment patterns keep 100% of serving capacity throughout the deployment? (Choose TWO.)",
    options: [
      { t: "Elastic Beanstalk Rolling with additional batch.",
        why: "Correct. An extra batch is added before any instances are taken out of service." },
      { t: "Elastic Beanstalk Immutable.",
        why: "Correct. A full new fleet is launched alongside the existing one." },
      { t: "Elastic Beanstalk Rolling.",
        why: "Capacity drops by one batch while it updates." },
      { t: "Elastic Beanstalk All at once.",
        why: "Every instance updates at once, so capacity drops to zero." },
      { t: "CodeDeploy in-place with HalfAtATime.",
        why: "Half the instances are out of service at a time." }
    ],
    answer: [0, 1],
    tip: "Full capacity: rolling with additional batch, immutable, traffic splitting, blue/green. Reduced: rolling, in-place batches. Zero: all at once."
  },
  {
    id: "dp-22", domain: "d1", topic: "Deployment Patterns",
    q: "During a blue/green switch on an ALB, some users' long-running uploads to the old (blue) instances are cut off as soon as traffic moves to green. What should the DevOps engineer adjust?",
    options: [
      { t: "Increase the target group's deregistration delay (connection draining) so in-flight requests to blue instances can finish before they're removed.",
        why: "Correct. The deregistration delay keeps existing connections open while new requests go to the new targets." },
      { t: "Turn on cross-zone load balancing.",
        why: "This changes how traffic spreads across AZs, not how connections end." },
      { t: "Lower the health check interval.",
        why: "This affects how quickly unhealthy targets are detected, not draining." },
      { t: "Switch to Route 53 weighted records.",
        why: "DNS doesn't drain connections, and it adds caching delays." }
    ],
    answer: [0],
    tip: "In-flight requests cut during a switch → ALB deregistration delay (connection draining)."
  },

  // ───────────────────────────── Elastic Beanstalk ─────────────────────────────
  {
    id: "eb-01", domain: "d1", topic: "Elastic Beanstalk",
    q: "A company runs a Python app on Elastic Beanstalk with 10 instances behind an ALB. Before each release reaches everyone, the team wants 10% of real production traffic to go to the new version for 15 minutes, and Beanstalk must automatically return all traffic to the old version if the new instances become unhealthy. What should they configure?",
    options: [
      { t: "Set the deployment policy to TrafficSplitting with NewVersionPercent 10 and EvaluationTime 15.",
        why: "Correct. Traffic splitting launches a new set of instances, uses the ALB to send the chosen percentage for the evaluation time, and rolls back automatically if health drops." },
      { t: "Set the deployment policy to Rolling with a batch size of 10%.",
        why: "Rolling updates existing instances batch by batch with no evaluation period and no automatic rollback." },
      { t: "Set the deployment policy to Immutable.",
        why: "Immutable checks health on new instances but does not send a set percentage of live traffic for a fixed time." },
      { t: "Create a second environment and use Swap environment URLs.",
        why: "A URL swap moves all traffic at once through DNS. It is not a percentage-based canary with automatic rollback." }
    ],
    answer: [0],
    tip: "Beanstalk canary with automatic rollback → TrafficSplitting (NewVersionPercent + EvaluationTime, needs ALB)."
  },
  {
    id: "eb-02", domain: "d1", topic: "Elastic Beanstalk",
    q: "A Django app on a load-balanced Elastic Beanstalk environment runs database schema migrations during deployment. With 6 instances, the migration runs 6 times at once and sometimes corrupts the schema. How should the DevOps engineer make the migration run only once per deployment?",
    options: [
      { t: "Run the migration in .ebextensions container_commands with leader_only: true.",
        why: "Correct. leader_only runs the command on a single instance during the deployment, which is the standard pattern for migrations." },
      { t: "Run the migration in .ebextensions commands.",
        why: "commands run on every instance, and before the application is extracted, so the migration code isn't even in place yet." },
      { t: "Put the migration in cron.yaml.",
        why: "cron.yaml schedules periodic tasks in worker environments. It isn't tied to deployments." },
      { t: "Switch the deployment policy to All at once.",
        why: "All instances would still run the migration, and the change adds downtime." }
    ],
    answer: [0],
    tip: "Run something once per deployment → container_commands + leader_only: true."
  },
  {
    id: "eb-03", domain: "d1", topic: "Elastic Beanstalk",
    q: "An Elastic Beanstalk environment was created with a Classic Load Balancer. The team now needs an Application Load Balancer for path-based routing, with no downtime for users. What is the correct approach?",
    options: [
      { t: "Create a new environment with an ALB, deploy the same version, test it, then swap environment URLs.",
        why: "Correct. The load balancer type can't be changed after an environment is created, so blue/green with a CNAME swap is the zero-downtime way." },
      { t: "Change the load balancer type in the environment's configuration and apply it.",
        why: "Beanstalk doesn't allow changing the load balancer type of an existing environment." },
      { t: "Add an ALB in .ebextensions Resources and register the instances.",
        why: "This creates an unmanaged extra load balancer that Beanstalk doesn't use for health, scaling or deployments." },
      { t: "Rebuild the environment.",
        why: "Rebuilding recreates the same configuration, still with the Classic Load Balancer, and causes downtime." }
    ],
    answer: [0],
    tip: "Load balancer type change (or platform branch change) → new environment + swap URLs."
  },
  {
    id: "eb-04", domain: "d1", topic: "Elastic Beanstalk",
    q: "A web environment generates large PDF reports. Requests take up to 4 minutes and often time out at the load balancer, and users see errors. The team wants the web tier to stay responsive. What should they do?",
    options: [
      { t: "Create an Elastic Beanstalk worker environment. The web tier sends a message to SQS, and the worker's daemon posts it to the app that builds the report.",
        why: "Correct. Worker environments are made for long-running background tasks. The web tier returns at once, and the sqsd daemon delivers each job to the worker app." },
      { t: "Raise the ALB idle timeout to 10 minutes.",
        why: "Requests still hold web instances for minutes, so the web tier stays slow and doesn't scale well." },
      { t: "Raise the deployment command Timeout.",
        why: "That setting controls how long deployments may take, not request handling." },
      { t: "Use larger instance types for the web environment.",
        why: "This may shorten processing a little, but long synchronous requests still block the web tier." }
    ],
    answer: [0],
    tip: "Long-running work in a web app → SQS + Beanstalk worker environment."
  },
  {
    id: "eb-05", domain: "d1", topic: "Elastic Beanstalk",
    q: "In an Elastic Beanstalk worker environment, a video-encoding job takes about 8 minutes. The team sees the same video encoded two or three times. Logs show the app returns HTTP 200 after each job. What is the MOST likely cause?",
    options: [
      { t: "The SQS visibility timeout is shorter than the job duration, so the message becomes visible again and another instance picks it up.",
        why: "Correct. If processing takes longer than VisibilityTimeout, the message reappears before it is deleted. Set VisibilityTimeout (and InactivityTimeout) above the longest job time." },
      { t: "The queue is a FIFO queue.",
        why: "FIFO queues reduce duplicates. They don't cause them." },
      { t: "The dead-letter queue is not configured.",
        why: "A DLQ catches messages that fail too often. It doesn't stop duplicates caused by a short visibility timeout." },
      { t: "cron.yaml is missing.",
        why: "cron.yaml is only for scheduled tasks." }
    ],
    answer: [0],
    tip: "Worker job processed twice → VisibilityTimeout shorter than the job."
  },
  {
    id: "eb-06", domain: "d1", topic: "Elastic Beanstalk",
    q: "A nightly clean-up job was set up with a Linux cron entry through .ebextensions on a web environment with 5 instances. The job now runs 5 times every night. The team wants it to run exactly once a night, managed by Elastic Beanstalk. What should they do?",
    options: [
      { t: "Move the job to a worker environment and define it in cron.yaml.",
        why: "Correct. Periodic tasks in cron.yaml use leader election (with a DynamoDB table), so only one instance queues each task and it runs once." },
      { t: "Add leader_only: true to the cron file in .ebextensions files.",
        why: "leader_only only applies to container_commands during deployment. After scaling or replacement, a different instance may run the job, or none may." },
      { t: "Reduce the web environment to one instance.",
        why: "This removes high availability and capacity just to fix scheduling." },
      { t: "Use the Rolling with additional batch deployment policy.",
        why: "Deployment policies don't affect how scheduled jobs run." }
    ],
    answer: [0],
    tip: "Scheduled task once across many instances → worker environment + cron.yaml (leader election)."
  },
  {
    id: "eb-07", domain: "d1", topic: "Elastic Beanstalk",
    q: "A developer added an option in .ebextensions to change the instance type from t3.small to t3.large and deployed. The environment still uses t3.small. Earlier, an engineer had set the instance type in the Elastic Beanstalk console. Why didn't the change apply?",
    options: [
      { t: "Settings applied directly to the environment (console, CLI, API) override .ebextensions settings.",
        why: "Correct. The order is: direct settings, then saved configurations, then .ebextensions, then defaults. Remove the direct setting so the config file wins." },
      { t: "The .ebextensions file is processed after the default settings.",
        why: "Defaults are the lowest priority, so they wouldn't block the change." },
      { t: "Instance types can only be changed with a new environment.",
        why: "Instance types can be changed in place. Beanstalk applies it with a rolling update." },
      { t: ".ebextensions only supports JSON.",
        why: ".ebextensions supports YAML and JSON." }
    ],
    answer: [0],
    tip: "Settings priority: direct (console/CLI/API) > saved config > .ebextensions > defaults."
  },
  {
    id: "eb-08", domain: "d1", topic: "Elastic Beanstalk",
    q: "A company terminated an old Elastic Beanstalk environment to replace it, and its production RDS database was deleted with it. What should the team do for future environments to keep the database independent of the environment lifecycle?",
    options: [
      { t: "Create the RDS database outside Elastic Beanstalk and give its endpoint to the app through environment properties or Secrets Manager.",
        why: "Correct. A database created outside the environment survives termination and can be shared between blue and green environments." },
      { t: "Create the RDS database in .ebextensions Resources.",
        why: "Resources in .ebextensions are part of the environment's stack, so they are deleted with the environment too." },
      { t: "Enable Multi-AZ on the environment's RDS database.",
        why: "Multi-AZ helps availability, but the database is still deleted with the environment." },
      { t: "Turn on managed platform updates.",
        why: "Managed updates change the platform version. They don't affect the database lifecycle." }
    ],
    answer: [0],
    tip: "Production database → outside Beanstalk (also required for blue/green swaps)."
  },
  {
    id: "eb-09", domain: "d1", topic: "Elastic Beanstalk",
    q: "A team's deployments to Elastic Beanstalk start failing with an error that the application version limit has been reached. What is the BEST long-term fix?",
    options: [
      { t: "Configure an application version lifecycle policy to keep a set number of versions, or delete versions older than a set age.",
        why: "Correct. The account limit is 1,000 application versions. A lifecycle policy deletes old ones automatically, never versions in use." },
      { t: "Request a service quota increase for environments.",
        why: "The issue is application versions, not environments, and a lifecycle policy is the intended fix." },
      { t: "Delete the S3 bucket that Elastic Beanstalk uses.",
        why: "This would break the environments and the versions that are still needed." },
      { t: "Create a new Elastic Beanstalk application for each release.",
        why: "This is messy and doesn't stop versions from piling up." }
    ],
    answer: [0],
    tip: "Application version limit (1,000) → application version lifecycle policy (by count or age)."
  },
  {
    id: "eb-10", domain: "d1", topic: "Elastic Beanstalk",
    q: "A team uses blue/green on Elastic Beanstalk. After swapping environment URLs, some users still reach the old (blue) environment for several minutes. The team plans to terminate blue right after the swap to save money. What should they know?",
    options: [
      { t: "Swap URLs changes DNS CNAME records, so cached DNS entries keep sending some users to blue. Keep blue running until DNS caches expire.",
        why: "Correct. The swap is a DNS change, not instant. Terminating blue too early causes errors for users with cached records, and it also removes the quick rollback option." },
      { t: "The swap failed and must be repeated.",
        why: "Some users reaching blue after a swap is expected DNS caching behavior." },
      { t: "The environments must be in different Regions.",
        why: "Swap URLs needs both environments in the same application and Region." },
      { t: "Use the Immutable policy instead, because it switches DNS faster.",
        why: "Immutable doesn't use DNS at all, and it isn't a separate environment like blue/green." }
    ],
    answer: [0],
    tip: "Swap URLs = DNS swap → keep blue up until TTLs expire; swap back to roll back."
  },
  {
    id: "eb-11", domain: "d1", topic: "Elastic Beanstalk",
    q: "A company must move an Elastic Beanstalk environment from the Amazon Linux 2 platform branch to Amazon Linux 2023, with minimal risk and a fast rollback. What should they do?",
    options: [
      { t: "Create a new environment on the AL2023 platform branch, deploy and test the app, then swap environment URLs.",
        why: "Correct. Major platform branch changes are done with blue/green. Rollback is a swap back to the AL2 environment." },
      { t: "Enable managed platform updates for major versions.",
        why: "Managed platform updates only apply minor and patch updates within the same branch." },
      { t: "Change the platform version with a Rolling deployment.",
        why: "This changes instances in place with mixed platforms and no fast rollback, and branch changes aren't supported this way." },
      { t: "Use .ebextensions to install the new OS packages.",
        why: "You can't change the operating system through .ebextensions." }
    ],
    answer: [0],
    tip: "Major platform branch upgrade → blue/green (new environment + swap URLs)."
  },
  {
    id: "eb-12", domain: "d1", topic: "Elastic Beanstalk", multi: true,
    q: "A company wants Elastic Beanstalk to apply OS and runtime patches automatically every week, with no downtime and no manual work. What is needed? (Choose TWO.)",
    options: [
      { t: "Turn on managed platform updates with a weekly maintenance window.",
        why: "Correct. Beanstalk applies minor and patch updates in the maintenance window." },
      { t: "Turn on enhanced health reporting.",
        why: "Correct. Managed platform updates use immutable deployments, which need enhanced health." },
      { t: "Set the deployment policy to All at once.",
        why: "Managed updates always use an immutable deployment. All at once would cause downtime anyway." },
      { t: "Create a Lambda function to call UpdateEnvironment every week.",
        why: "Unnecessary custom work. Managed platform updates already do this." },
      { t: "Store the platform version in cron.yaml.",
        why: "cron.yaml is for worker periodic tasks, not platform updates." }
    ],
    answer: [0, 1],
    tip: "Managed platform updates = weekly window + enhanced health (uses immutable)."
  },
  {
    id: "eb-13", domain: "d1", topic: "Elastic Beanstalk",
    q: "A team changes the instance type of a production Elastic Beanstalk environment. They want the instances replaced batch by batch, and the next batch should only start after the new instances pass health checks. Which setting applies?",
    options: [
      { t: "aws:autoscaling:updatepolicy:rollingupdate with RollingUpdateType set to Health.",
        why: "Correct. Instance type is a configuration change, so it uses rolling updates. Health-based rolling waits for new instances to be healthy before continuing." },
      { t: "aws:elasticbeanstalk:command with DeploymentPolicy set to Rolling.",
        why: "Deployment policies apply to new application versions, not configuration changes that replace instances." },
      { t: "aws:autoscaling:updatepolicy:rollingupdate with RollingUpdateType set to Time.",
        why: "Time-based rolling waits a fixed PauseTime, not for health checks." },
      { t: "aws:elasticbeanstalk:trafficsplitting with NewVersionPercent set to 100.",
        why: "Traffic splitting is a deployment policy for application versions." }
    ],
    answer: [0],
    tip: "Config change replacing instances → rolling updates (Time / Health / Immutable), not DeploymentPolicy."
  },
  {
    id: "eb-14", domain: "d1", topic: "Elastic Beanstalk",
    q: "An Elastic Beanstalk worker environment's SQS queue builds up thousands of messages during busy hours, while the instances' CPU stays low because jobs mostly wait on external APIs. How should the team scale the worker environment?",
    options: [
      { t: "Scale the Auto Scaling group on the SQS ApproximateNumberOfMessagesVisible metric.",
        why: "Correct. Queue depth shows how much work is waiting. Add a CloudWatch alarm and scaling policy on it, for example through .ebextensions or the scaling trigger settings." },
      { t: "Keep scaling on CPU but lower the threshold to 10%.",
        why: "CPU doesn't reflect the backlog for I/O-bound jobs, so scaling stays unreliable." },
      { t: "Add a load balancer to the worker environment.",
        why: "Worker environments don't use a load balancer. Work arrives through SQS." },
      { t: "Increase the RetentionPeriod.",
        why: "This keeps messages longer but doesn't process them faster." }
    ],
    answer: [0],
    tip: "Scale workers on queue depth (ApproximateNumberOfMessagesVisible), not CPU."
  },
  {
    id: "eb-15", domain: "d1", topic: "Elastic Beanstalk",
    q: "In a worker environment, some messages contain bad data. The worker app returns HTTP 500 for them, and they're retried endlessly, wasting capacity. What should the team do?",
    options: [
      { t: "Configure a dead-letter queue with a maximum receive count (MaxRetries), so failing messages are moved aside after a few attempts.",
        why: "Correct. After the set number of retries, the message goes to the DLQ for investigation instead of looping forever." },
      { t: "Return HTTP 200 for every message.",
        why: "The message would be deleted and the failure lost with no record." },
      { t: "Increase the VisibilityTimeout to 12 hours.",
        why: "This only slows the retries. It doesn't stop them." },
      { t: "Switch to a FIFO queue.",
        why: "FIFO keeps order. A failing message at the head could even block the messages behind it." }
    ],
    answer: [0],
    tip: "Poison messages in a worker → DLQ / MaxRetries."
  },
  {
    id: "eb-16", domain: "d1", topic: "Elastic Beanstalk",
    q: "A deployment to an Elastic Beanstalk environment fails after about 10 minutes because the app's startup script downloads large ML models. Logs show the commands didn't finish before the deployment timed out. What should the engineer change FIRST?",
    options: [
      { t: "Raise the Timeout option in aws:elasticbeanstalk:command.",
        why: "Correct. The default command timeout is 600 seconds (10 minutes). Raising it lets long deployments finish. Baking the models into a custom AMI is a good longer-term improvement." },
      { t: "Raise the ALB idle timeout.",
        why: "The ALB timeout affects client requests, not deployment commands." },
      { t: "Set IgnoreHealthCheck to true.",
        why: "The problem is the timeout, not health checks, and ignoring health is risky." },
      { t: "Change the deployment policy to All at once.",
        why: "Commands still take as long, so the same timeout is hit, plus there's downtime." }
    ],
    answer: [0],
    tip: "Deployment fails at ~10 minutes → raise command Timeout (default 600 s); custom AMI to speed up."
  },
  {
    id: "eb-17", domain: "d1", topic: "Elastic Beanstalk",
    q: "An administrator increased the Auto Scaling group's maximum size directly in the EC2 console for an Elastic Beanstalk environment. A few days later, a configuration update changed it back and the environment shows warnings. What is the correct practice?",
    options: [
      { t: "Make changes through Elastic Beanstalk configuration options (console, EB CLI, API or .ebextensions), not directly on the underlying resources.",
        why: "Correct. Beanstalk manages its resources through a CloudFormation stack. Direct changes cause drift and get overwritten." },
      { t: "Turn on termination protection for the Auto Scaling group.",
        why: "This doesn't stop Beanstalk from overwriting settings." },
      { t: "Edit the Beanstalk CloudFormation stack template directly.",
        why: "The stack is managed by Beanstalk, so direct edits also drift and are overwritten." },
      { t: "Detach the Auto Scaling group from the environment.",
        why: "This breaks Beanstalk's management of scaling and deployments." }
    ],
    answer: [0],
    tip: "Change Beanstalk resources only through Beanstalk options, never directly (drift)."
  },
  {
    id: "eb-18", domain: "d1", topic: "Elastic Beanstalk",
    q: "A CodePipeline pipeline builds a Node.js app with CodeBuild and deploys it with the Elastic Beanstalk deploy action. The .ebextensions settings in the repository are ignored after deployment. The build artifact is a zip containing a folder 'app/' with all the files inside it. What is the problem?",
    options: [
      { t: "The .ebextensions folder must be at the root of the source bundle, not inside a top-level folder.",
        why: "Correct. Beanstalk only reads .ebextensions at the bundle root. Configure the buildspec artifacts (for example base-directory: app) so files land at the root." },
      { t: "The Elastic Beanstalk deploy action doesn't support .ebextensions.",
        why: "It does. The deploy action uploads the artifact as a normal application version." },
      { t: "The .ebextensions files must end in .yaml.",
        why: "They must end in .config, and the content can be YAML or JSON." },
      { t: "CodeBuild must deploy with eb deploy instead.",
        why: "The deploy action works fine. The bundle structure is the problem." }
    ],
    answer: [0],
    tip: ".ebextensions ignored → must be at the bundle root, files must end in .config, valid YAML/JSON."
  },
  {
    id: "eb-19", domain: "d1", topic: "Elastic Beanstalk",
    q: "A Beanstalk app needs a database password. Security requires that it is never stored in source control or in plain text in the environment configuration, and that it can be rotated. What is the BEST approach?",
    options: [
      { t: "Store the password in AWS Secrets Manager and reference it as an environment secret (or read it at runtime using the instance profile).",
        why: "Correct. The secret stays in Secrets Manager, with rotation, and the instance profile only needs permission to read that secret." },
      { t: "Put the password in .ebextensions option_settings as an environment property.",
        why: "This stores it in source control in plain text." },
      { t: "Hard-code the password in the application and use an encrypted S3 bucket for the bundle.",
        why: "The password is still in the code and can't be rotated without a new deployment." },
      { t: "Put the password in env.yaml.",
        why: "env.yaml is part of the bundle, so the password is still in source control." }
    ],
    answer: [0],
    tip: "Secrets for Beanstalk → Secrets Manager / Parameter Store references + instance profile permissions."
  },
  {
    id: "eb-20", domain: "d1", topic: "Elastic Beanstalk",
    q: "A team wants to shift traffic from a blue Elastic Beanstalk environment to a green one gradually over a day (10%, then 50%, then 100%), keeping both environments running separately with their own instances. What should they use?",
    options: [
      { t: "Route 53 weighted records pointing to the two environments' URLs, changing the weights over time.",
        why: "Correct. Swap URLs moves all traffic at once. Weighted DNS records allow a gradual shift between two separate environments." },
      { t: "Swap environment URLs three times.",
        why: "Each swap moves all traffic, not a percentage." },
      { t: "Traffic splitting policy with an EvaluationTime of 24 hours.",
        why: "Traffic splitting works within one environment using a temporary ASG, not between two separate environments." },
      { t: "Rolling deployment with a 10% batch size.",
        why: "Rolling updates instances in place within one environment." }
    ],
    answer: [0],
    tip: "Gradual shift between two Beanstalk environments → Route 53 weighted records."
  },
  {
    id: "eb-21", domain: "d1", topic: "Elastic Beanstalk",
    q: "A team needs to install an OS package, write a config file, and add a DynamoDB table used only by this environment, all defined in the application's repository. Where should this be defined?",
    options: [
      { t: "In an .ebextensions .config file, using packages, files and Resources.",
        why: "Correct. .ebextensions handles packages, files and extra CloudFormation resources together, and it is versioned with the code. Remember the table is deleted when the environment is terminated." },
      { t: "In the Procfile.",
        why: "The Procfile only defines the processes that start the app." },
      { t: "In cron.yaml.",
        why: "cron.yaml only defines periodic tasks for worker environments." },
      { t: "In a saved configuration.",
        why: "Saved configurations hold option settings, not packages, files or extra resources." }
    ],
    answer: [0],
    tip: ".ebextensions: option_settings, packages, files, commands, container_commands, Resources."
  },
  {
    id: "eb-22", domain: "d1", topic: "Elastic Beanstalk",
    q: "A development environment for a small team runs on one instance. It must be cheap, and the team wants deployments that don't take the app down if the new version fails to start. Which setup meets this?",
    options: [
      { t: "A single-instance environment with the Immutable deployment policy.",
        why: "Correct. Single-instance environments support All at once and Immutable. Immutable launches the new instance first, so a failed start doesn't affect the running instance." },
      { t: "A single-instance environment with Rolling with additional batch.",
        why: "Rolling policies need a load-balanced environment with multiple instances." },
      { t: "A single-instance environment with Traffic splitting.",
        why: "Traffic splitting needs an ALB, which single-instance environments don't have." },
      { t: "A load-balanced environment with 4 instances and All at once.",
        why: "More expensive, and All at once takes the app down if the new version fails." }
    ],
    answer: [0],
    tip: "Single-instance environment → only All at once or Immutable."
  },

  // ───────────────────────────── Lambda Versions and Aliases ─────────────────────────────
  {
    id: "lam-01", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "A company deploys a serverless app with AWS SAM. Each release must first send 10% of traffic to the new Lambda code for 10 minutes, then the rest. If the function's error alarm fires during the deployment, traffic must return to the previous code automatically. Which solution needs the LEAST custom code?",
    options: [
      { t: "Set AutoPublishAlias on the function and add DeploymentPreference with Type Canary10Percent10Minutes and the error alarm in Alarms.",
        why: "Correct. SAM publishes a new version, and CodeDeploy shifts the alias 10% for 10 minutes, watching the alarm and rolling back automatically." },
      { t: "Write a Lambda function on an EventBridge schedule that updates the alias weights and checks the alarm.",
        why: "This works but is custom code that you must build, test and maintain. SAM and CodeDeploy do it for you." },
      { t: "Set DeploymentPreference with Type Linear10PercentEvery10Minutes.",
        why: "Linear moves 10% every 10 minutes (100 minutes in total), which is not 10% then the rest." },
      { t: "Publish a new version and point the unqualified function ARN at it with a 10% weight.",
        why: "Weights are set on an alias, not on the unqualified ARN, and there would be no automatic rollback." }
    ],
    answer: [0],
    tip: "SAM gradual Lambda deploy + auto rollback → AutoPublishAlias + DeploymentPreference (Type + Alarms)."
  },
  {
    id: "lam-02", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "A team changed an environment variable on a Lambda function in the console, but production, which invokes the function through the prod alias pointing to version 12, still uses the old value. Why?",
    options: [
      { t: "Published versions are immutable. The change only affected $LATEST, so the team must publish a new version and point the prod alias to it.",
        why: "Correct. A version freezes code and configuration, including environment variables." },
      { t: "Environment variables take up to an hour to propagate.",
        why: "Changes apply to $LATEST right away. The alias simply points to an older, unchanged version." },
      { t: "Aliases cache environment variables until provisioned concurrency is reset.",
        why: "Aliases don't cache anything. They only point to a version." },
      { t: "The function must be redeployed with reserved concurrency set to zero first.",
        why: "Reserved concurrency doesn't affect configuration values." }
    ],
    answer: [0],
    tip: "Versions freeze code + config (env vars too) → publish a new version and repoint the alias."
  },
  {
    id: "lam-03", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "A SAM deployment with a PreTraffic hook stays in progress for about an hour and then rolls back. The hook function's logs show the tests passed. What is the MOST likely cause?",
    options: [
      { t: "The hook didn't call PutLifecycleEventHookExecutionStatus to report Succeeded to CodeDeploy.",
        why: "Correct. CodeDeploy waits for the hook to report a status. Without it, the hook times out after 1 hour and the deployment fails." },
      { t: "The canary period was set too long.",
        why: "Canary periods are at most 30 minutes, and the deployment would continue afterwards." },
      { t: "PreTraffic hooks only work with Linear deployment types.",
        why: "Hooks work with every deployment type, including AllAtOnce." },
      { t: "The alias had provisioned concurrency.",
        why: "Provisioned concurrency doesn't block hooks." }
    ],
    answer: [0],
    tip: "Hook passed but deployment times out (~1 h) → hook must call PutLifecycleEventHookExecutionStatus."
  },
  {
    id: "lam-04", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "A SAM template defines a PreTraffic hook function named orders-pre-traffic-test. Deployments fail because CodeDeploy gets an AccessDenied error when invoking the hook. SAM uses its default CodeDeploy service role. What is the simplest fix?",
    options: [
      { t: "Rename the hook function so its name starts with CodeDeployHook_.",
        why: "Correct. The default AWSCodeDeployRoleForLambda policy only allows invoking functions whose names start with CodeDeployHook_." },
      { t: "Give the hook function's execution role lambda:InvokeFunction.",
        why: "That lets the hook invoke the target function, but the error is CodeDeploy invoking the hook." },
      { t: "Move the hook to a PostTraffic hook.",
        why: "PostTraffic hooks are invoked the same way and would fail the same way." },
      { t: "Turn on AutoPublishAlias for the hook function.",
        why: "Hook functions don't need versions or aliases, and this doesn't change the permission." }
    ],
    answer: [0],
    tip: "Default CodeDeploy Lambda role can only invoke hooks named CodeDeployHook_* (or use a custom Role)."
  },
  {
    id: "lam-05", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "An API Gateway REST API uses a stage variable lambdaAlias in its integration URI so the prod stage calls the prod alias. After the change, the prod stage returns 500 errors and the logs show 'Invalid permissions on Lambda function'. What should be done?",
    options: [
      { t: "Add a resource-based permission allowing API Gateway to invoke the function with the qualifier prod (the alias ARN).",
        why: "Correct. Lambda permissions are per qualifier. A permission on the unqualified function doesn't cover the prod alias." },
      { t: "Add lambda:InvokeFunction to the API Gateway CloudWatch logging role.",
        why: "The logging role is only for writing logs. Invocation permission comes from the function's resource policy." },
      { t: "Point the alias at $LATEST.",
        why: "This runs untested code in production and doesn't fix the missing permission." },
      { t: "Redeploy the API to the prod stage.",
        why: "Redeploying doesn't add the missing Lambda permission." }
    ],
    answer: [0],
    tip: "API Gateway + alias → add-permission with --qualifier for EACH alias."
  },
  {
    id: "lam-06", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "An engineer tries to configure the prod alias with 90% to version 5 and 10% to $LATEST so new code can be tested on live traffic. The API returns an error. Why?",
    options: [
      { t: "Weighted aliases can only route between two published versions. $LATEST isn't allowed.",
        why: "Correct. Publish the new code as a version (for example 6) and give that version the 10% weight." },
      { t: "The weight must be at least 50%.",
        why: "Weights can be anywhere from 0.0 to 1.0." },
      { t: "Weighted routing needs provisioned concurrency.",
        why: "Provisioned concurrency is optional." },
      { t: "Aliases can't have routing configuration if they have a function URL.",
        why: "Function URLs and weighted routing can be used together." }
    ],
    answer: [0],
    tip: "Weighted alias: two PUBLISHED versions only (no $LATEST), same role, same DLQ config."
  },
  {
    id: "lam-07", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "An SQS queue triggers a Lambda function through an event source mapping that uses the function's unqualified ARN. A developer saved experimental code in the console, and production orders immediately started failing. How should the team prevent this?",
    options: [
      { t: "Point the event source mapping at a prod alias that references a tested, published version.",
        why: "Correct. The unqualified ARN invokes $LATEST, so any saved change goes straight to production. An alias pins production to a known version." },
      { t: "Turn on reserved concurrency for the function.",
        why: "Reserved concurrency limits scale. It doesn't control which code runs." },
      { t: "Increase the SQS visibility timeout.",
        why: "This only affects retries, not which version runs." },
      { t: "Enable SnapStart on $LATEST.",
        why: "SnapStart is for startup speed, and only applies to published versions anyway." }
    ],
    answer: [0],
    tip: "Unqualified ARN = $LATEST → production triggers should use an alias ARN."
  },
  {
    id: "lam-08", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "A production Lambda function must never have cold starts during business hours, and releases are done by moving the live alias to new versions. Where should provisioned concurrency be configured?",
    options: [
      { t: "On the live alias, with Application Auto Scaling scheduled actions for business hours.",
        why: "Correct. Provisioned concurrency is set on a version or alias. On the alias it follows each release, and scheduled scaling keeps costs down outside business hours." },
      { t: "On $LATEST.",
        why: "Provisioned concurrency can't be set on $LATEST." },
      { t: "As reserved concurrency on the function.",
        why: "Reserved concurrency caps and reserves capacity but doesn't keep instances warm." },
      { t: "On each new version by hand after every deployment.",
        why: "This is manual and error-prone. Setting it on the alias follows the alias automatically." }
    ],
    answer: [0],
    tip: "Provisioned concurrency → alias or version (never $LATEST); scale it with Application Auto Scaling."
  },
  {
    id: "lam-09", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "A bad Lambda release is in production behind the prod alias, which now points to version 9. The previous good version is 8. What is the FASTEST way to roll back?",
    options: [
      { t: "Update the prod alias to point to version 8.",
        why: "Correct. Callers use the alias, so repointing it rolls back in seconds without a build or redeployment." },
      { t: "Redeploy the previous commit through the CI/CD pipeline.",
        why: "This works but takes much longer than repointing the alias." },
      { t: "Delete version 9.",
        why: "A version that an alias points to can't be deleted, and deleting doesn't move traffic." },
      { t: "Edit $LATEST back to the old code.",
        why: "The prod alias doesn't use $LATEST, so this changes nothing for production." }
    ],
    answer: [0],
    tip: "Fastest Lambda rollback → update-alias to the previous version."
  },
  {
    id: "lam-10", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "A team uses plain CloudFormation with an AWS::Lambda::Version resource and an alias. After updating the function code and the stack, the alias still points to the old version and no new version was published. What is the BEST fix?",
    options: [
      { t: "Use AWS SAM with AutoPublishAlias, which publishes a new version whenever the code changes.",
        why: "Correct. CloudFormation only creates a new AWS::Lambda::Version when its logical ID changes. SAM's AutoPublishAlias handles this automatically." },
      { t: "Delete the stack and create it again for each release.",
        why: "This causes downtime and loses the alias history." },
      { t: "Point the alias at $LATEST.",
        why: "This removes the stable, tested version that production should use." },
      { t: "Add a DependsOn from the version to the function.",
        why: "DependsOn sets ordering only. It doesn't make CloudFormation publish a new version." }
    ],
    answer: [0],
    tip: "AWS::Lambda::Version doesn't republish on code change → SAM AutoPublishAlias (or new logical ID)."
  },
  {
    id: "lam-11", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "A company manages Lambda functions with plain CloudFormation (not SAM) and wants alias updates to be done by CodeDeploy as a canary deployment with pre-traffic tests. What should they add to the AWS::Lambda::Alias resource?",
    options: [
      { t: "An UpdatePolicy with CodeDeployLambdaAliasUpdate, naming the CodeDeploy application, deployment group and the BeforeAllowTraffic hook.",
        why: "Correct. This UpdatePolicy makes CloudFormation hand alias updates to CodeDeploy, which shifts traffic using the deployment group's configuration." },
      { t: "An UpdatePolicy with AutoScalingRollingUpdate.",
        why: "That update policy is for Auto Scaling groups." },
      { t: "A RoutingConfig with a weight of 0.1.",
        why: "This sets a fixed manual weight. CodeDeploy wouldn't manage the shift, alarms or hooks." },
      { t: "A DeletionPolicy of Retain.",
        why: "DeletionPolicy controls what happens on deletion, not how updates are deployed." }
    ],
    answer: [0],
    tip: "CloudFormation without SAM → Alias UpdatePolicy: CodeDeployLambdaAliasUpdate."
  },
  {
    id: "lam-12", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "During a canary deployment, CodeDeploy rolled back a new Lambda version even though it had no errors. The alarm used only the FunctionName dimension, and the old version was throwing occasional errors from a known issue. How should the alarm be improved?",
    options: [
      { t: "Scope the alarm to the new version using the ExecutedVersion (or Resource) dimension.",
        why: "Correct. A function-wide alarm mixes errors from both versions. Scoping it shows only the new version's health." },
      { t: "Remove the alarm from DeploymentPreference.",
        why: "This removes automatic rollback completely." },
      { t: "Raise the alarm threshold to a very high value.",
        why: "This would also hide real errors from a bad new version." },
      { t: "Switch to AllAtOnce.",
        why: "This removes the gradual safety check rather than fixing the alarm." }
    ],
    answer: [0],
    tip: "Deployment alarms → scope with ExecutedVersion so only the new version's errors count."
  },
  {
    id: "lam-13", domain: "d1", topic: "Lambda Versions and Aliases", multi: true,
    q: "A team wants to manually send 5% of traffic on the live alias to version 14 while version 13 keeps the rest. Which requirements must be met? (Choose TWO.)",
    options: [
      { t: "Versions 13 and 14 must use the same execution role.",
        why: "Correct. Weighted routing requires both versions to have the same execution role." },
      { t: "Versions 13 and 14 must have the same dead-letter queue configuration (or none).",
        why: "Correct. Both versions must match on DLQ settings." },
      { t: "Both versions must have provisioned concurrency.",
        why: "Provisioned concurrency is optional." },
      { t: "Version 14 must be $LATEST.",
        why: "$LATEST can't be used in weighted routing." },
      { t: "The function must be in a VPC.",
        why: "VPC configuration isn't related to weighted routing." }
    ],
    answer: [0, 1],
    tip: "Weighted alias rules: published versions, same execution role, same DLQ config, max two versions."
  },
  {
    id: "lam-14", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "While a weighted alias sends 20% of traffic to a new version, users report that the same request sometimes returns the new response format and sometimes the old one, which breaks the mobile app. What explains this, and what is the better approach?",
    options: [
      { t: "Alias routing is random per invocation, not sticky per user. Make the versions backward-compatible, or use a feature flag or blue/green switch for incompatible changes.",
        why: "Correct. Each invocation picks a version by weight, so a single user can hit both versions." },
      { t: "The alias needs session affinity turned on.",
        why: "Lambda aliases have no session affinity setting." },
      { t: "The weights must add up to 120%.",
        why: "Weights always add up to 100%." },
      { t: "API Gateway caching is mixing the responses.",
        why: "Caching could cause stale responses, but here the mix comes from per-request routing." }
    ],
    answer: [0],
    tip: "Weighted alias = random per request (not sticky) → only for backward-compatible changes."
  },
  {
    id: "lam-15", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "A company's Lambda deployments suddenly fail with an error that the code storage limit has been exceeded. The pipeline publishes a new version on every commit and never removes old versions. What should the team do?",
    options: [
      { t: "Add a cleanup step that deletes old versions not referenced by any alias, keeping the last few.",
        why: "Correct. Every published version counts toward the Regional code storage quota (75 GB by default)." },
      { t: "Stop publishing versions and deploy straight to $LATEST.",
        why: "This removes safe deployments and rollback." },
      { t: "Increase the function's memory.",
        why: "Memory doesn't affect code storage." },
      { t: "Move the code to Lambda layers.",
        why: "Layer versions also count toward the code storage quota." }
    ],
    answer: [0],
    tip: "Code storage limit → delete old unused versions (all versions count toward 75 GB)."
  },
  {
    id: "lam-16", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "A team using SAM wants a new Lambda version to be tested by invoking it directly with sample events BEFORE any production traffic reaches it, and the deployment must stop if the test fails. What should they configure?",
    options: [
      { t: "A PreTraffic hook in DeploymentPreference that invokes the new version and reports Succeeded or Failed.",
        why: "Correct. The PreTraffic hook (BeforeAllowTraffic) runs before any traffic shift. A Failed status stops and rolls back the deployment." },
      { t: "A PostTraffic hook.",
        why: "PostTraffic runs after all traffic has shifted, which is too late for this requirement." },
      { t: "A CloudWatch alarm on Errors.",
        why: "Alarms watch real traffic during the shift. They don't test before traffic arrives." },
      { t: "A canary deployment type with 1% traffic.",
        why: "Even 1% is real production traffic." }
    ],
    answer: [0],
    tip: "Test before any traffic → PreTraffic hook (BeforeAllowTraffic); after full shift → PostTraffic."
  },
  {
    id: "lam-17", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "A team deploys Lambda functions with CodePipeline and CodeDeploy directly (no SAM). Which lifecycle hooks can be used in the Lambda appspec file?",
    options: [
      { t: "BeforeAllowTraffic and AfterAllowTraffic.",
        why: "Correct. Lambda deployments have only these two hooks." },
      { t: "BeforeInstall, AfterInstall and ValidateService.",
        why: "These are EC2 and on-premises hooks." },
      { t: "BeforeAllowTraffic, AfterAllowTraffic, BeforeInstall and AfterInstall.",
        why: "BeforeInstall and AfterInstall are only for EC2/on-premises and ECS." },
      { t: "PreBuild and PostBuild.",
        why: "These are CodeBuild buildspec phases." }
    ],
    answer: [0],
    tip: "Lambda appspec: Name, Alias, CurrentVersion, TargetVersion + hooks BeforeAllowTraffic / AfterAllowTraffic."
  },
  {
    id: "lam-18", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "A Lambda function must shift traffic to new versions slowly, in equal steps, so problems appear while most users are still on the old version. The full rollout should take about 30 minutes. Which DeploymentPreference Type fits?",
    options: [
      { t: "Linear10PercentEvery3Minutes.",
        why: "Correct. Ten equal 10% steps, three minutes apart, take about 30 minutes." },
      { t: "Canary10Percent30Minutes.",
        why: "Canary is only two steps: 10% for 30 minutes, then 90% at once, not equal steps." },
      { t: "Linear10PercentEvery10Minutes.",
        why: "Equal steps, but the rollout takes about 100 minutes." },
      { t: "AllAtOnce.",
        why: "Shifts everything immediately." }
    ],
    answer: [0],
    tip: "Linear = equal steps (10% × N min); Canary = two steps (10% then 100%)."
  },
  {
    id: "lam-19", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "A company keeps one Lambda function and uses dev, test and prod aliases. The API Gateway API has dev, test and prod stages. How can each stage call the matching alias without separate integrations?",
    options: [
      { t: "Use a stage variable in the integration URI (for example ${stageVariables.lambdaAlias}) and grant invoke permission for each alias.",
        why: "Correct. Each stage sets lambdaAlias to its alias name, and each alias needs its own permission for API Gateway." },
      { t: "Use the unqualified ARN in all stages.",
        why: "Every stage would call $LATEST." },
      { t: "Create one weighted alias that splits traffic between stages.",
        why: "Weights split random traffic, not by stage." },
      { t: "Use Lambda layers named after each stage.",
        why: "Layers share code and libraries. They don't route requests." }
    ],
    answer: [0],
    tip: "API Gateway stages → Lambda aliases via stage variables + per-alias permissions."
  },
  {
    id: "lam-20", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "A SAM DeploymentPreference with alarms rolled back a canary deployment. What happens to the CloudFormation stack update?",
    options: [
      { t: "The alias returns to the previous version and the stack update fails and rolls back.",
        why: "Correct. CloudFormation waits for the CodeDeploy deployment. A rollback in CodeDeploy fails the stack update, which then rolls back." },
      { t: "The stack update succeeds, with the alias left at the canary weights.",
        why: "CodeDeploy restores the alias to 100% on the old version, and the stack update is marked failed." },
      { t: "The new version is deleted and the stack is deleted.",
        why: "The stack is rolled back, not deleted." },
      { t: "CloudFormation ignores CodeDeploy results.",
        why: "With CodeDeployLambdaAliasUpdate, CloudFormation waits for the deployment result." }
    ],
    answer: [0],
    tip: "CodeDeploy rollback in SAM → alias back to old version + CloudFormation stack update fails/rolls back."
  },
  {
    id: "lam-21", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "A pipeline publishes a Lambda version with PublishVersion. The team worries that another engineer might change $LATEST between the build check and the publish, so an untested change could be published. How can they guard against this?",
    options: [
      { t: "Pass the expected CodeSha256 to PublishVersion so it only publishes if the code matches.",
        why: "Correct. If $LATEST changed in between, the hash won't match and PublishVersion fails instead of publishing unexpected code." },
      { t: "Call PublishVersion twice.",
        why: "If nothing changed, the second call returns the same version. It doesn't check the code." },
      { t: "Set reserved concurrency to zero during the publish.",
        why: "This stops invocations, not code changes." },
      { t: "Use a weighted alias.",
        why: "Routing doesn't protect what gets published." }
    ],
    answer: [0],
    tip: "PublishVersion with CodeSha256 → only publish the code you tested."
  },
  {
    id: "lam-22", domain: "d1", topic: "Lambda Versions and Aliases",
    q: "A Java Lambda function has long cold starts. The team enables SnapStart but sees no improvement when invoking the function through its unqualified ARN. Why?",
    options: [
      { t: "SnapStart only applies to published versions, so the function must be invoked through a version or an alias.",
        why: "Correct. The snapshot is created when a version is published. $LATEST (the unqualified ARN) doesn't use it." },
      { t: "SnapStart needs provisioned concurrency.",
        why: "SnapStart and provisioned concurrency are separate options." },
      { t: "SnapStart only works with Python.",
        why: "SnapStart supports Java, and also Python and .NET." },
      { t: "SnapStart only works with weighted aliases.",
        why: "Any published version or alias works." }
    ],
    answer: [0],
    tip: "SnapStart and provisioned concurrency work on published versions / aliases, not $LATEST."
  },

  // ───────────────────────────── ECS and Fargate ─────────────────────────────
  {
    id: "ecs-01", domain: "d1", topic: "ECS and Fargate",
    q: "An ECS service on Fargate uses rolling updates. A recent release had a bad image tag, and ECS kept launching failing tasks for hours until an engineer noticed. The team wants failed deployments to be detected and the previous working version restored automatically, with the LEAST effort. What should they do?",
    options: [
      { t: "Enable the deployment circuit breaker with rollback on the service.",
        why: "Correct. The circuit breaker detects tasks that fail to start or fail health checks, marks the deployment FAILED, and rolls back to the last COMPLETED deployment." },
      { t: "Switch the service to the CODE_DEPLOY deployment controller.",
        why: "Possible, but it needs a new service, two target groups and CodeDeploy setup. Much more effort than turning on the circuit breaker." },
      { t: "Create an EventBridge rule on task stopped events that calls a Lambda function to update the service back.",
        why: "Custom code that the built-in circuit breaker already replaces." },
      { t: "Set minimumHealthyPercent to 0.",
        why: "This allows downtime and doesn't detect or roll back failures." }
    ],
    answer: [0],
    tip: "Rolling ECS deployment + automatic rollback on failed tasks → deployment circuit breaker (enable + rollback)."
  },
  {
    id: "ecs-02", domain: "d1", topic: "ECS and Fargate",
    q: "A new release of an ECS service passes all ALB health checks, but the application returns many HTTP 500 errors to users. The rolling deployment with the circuit breaker completed without rolling back. How can the team make the deployment roll back automatically in this situation?",
    options: [
      { t: "Add CloudWatch alarms (for example ALB 5XX count) to the service's deploymentConfiguration alarms with rollback enabled.",
        why: "Correct. The circuit breaker only sees tasks failing to start or failing health checks. Alarm-based rollback catches healthy tasks that serve bad results." },
      { t: "Lower the circuit breaker threshold.",
        why: "The threshold can't be set, and the tasks weren't failing anyway." },
      { t: "Increase healthCheckGracePeriodSeconds.",
        why: "This makes health checks more lenient, the opposite of what's needed." },
      { t: "Use a container health check instead of the ALB health check.",
        why: "If the health endpoint returns OK, a container health check passes too." }
    ],
    answer: [0],
    tip: "Healthy-but-bad code in a rolling deploy → deploymentConfiguration alarms with rollback."
  },
  {
    id: "ecs-03", domain: "d1", topic: "ECS and Fargate",
    q: "A containerized app on Fargate gets AccessDenied errors when it calls DynamoDB. The task starts, pulls its image from ECR and writes logs to CloudWatch without problems. What should be fixed?",
    options: [
      { t: "Add the DynamoDB permissions to the task role (taskRoleArn).",
        why: "Correct. The task role provides credentials to the application code inside the containers." },
      { t: "Add the DynamoDB permissions to the task execution role.",
        why: "The execution role is used by ECS/Fargate to pull images, send logs and fetch secrets, not by your code." },
      { t: "Add the permissions to the ECS service-linked role.",
        why: "The service-linked role lets ECS manage resources such as ENIs and load balancer registration." },
      { t: "Add a DynamoDB VPC endpoint only.",
        why: "Network access doesn't fix an AccessDenied permission error." }
    ],
    answer: [0],
    tip: "App's own AWS calls → task role. Pull image / logs / secrets at start → execution role."
  },
  {
    id: "ecs-04", domain: "d1", topic: "ECS and Fargate",
    q: "Fargate tasks in private subnets with no NAT gateway fail to start with CannotPullContainerError for an image in the same account's ECR. The execution role uses the AmazonECSTaskExecutionRolePolicy managed policy. What should be done? (Choose TWO.)",
    multi: true,
    options: [
      { t: "Create interface VPC endpoints for ecr.api and ecr.dkr.",
        why: "Correct. Tasks need private access to the ECR API and the Docker registry endpoint." },
      { t: "Create an S3 gateway endpoint.",
        why: "Correct. ECR stores image layers in S3, so tasks also need a route to S3." },
      { t: "Add ecr:* to the task role.",
        why: "Image pulls use the execution role, which already has the permissions." },
      { t: "Turn on ECR tag immutability.",
        why: "Tag immutability prevents overwriting tags. It doesn't affect network access." },
      { t: "Use the bridge network mode.",
        why: "Fargate only supports awsvpc." }
    ],
    answer: [0, 1],
    tip: "Private Fargate + no NAT → VPC endpoints ecr.api, ecr.dkr, S3 gateway (+ logs, ssm/secretsmanager)."
  },
  {
    id: "ecs-05", domain: "d1", topic: "ECS and Fargate",
    q: "An ECS service reads a database password from Secrets Manager through the secrets section of its task definition. The secret was rotated, but the running tasks still use the old password. What is the simplest way to make the service use the new value?",
    options: [
      { t: "Force a new deployment of the service so new tasks start and read the current secret.",
        why: "Correct. ECS injects secrets only when a task starts. New tasks get the rotated value." },
      { t: "Wait. ECS refreshes injected secrets every 15 minutes.",
        why: "ECS never refreshes injected secrets in running tasks." },
      { t: "Register a new task definition revision with the same settings and leave the service unchanged.",
        why: "A new revision does nothing until the service is updated to use it." },
      { t: "Restart the ECS agent.",
        why: "There's no agent to restart on Fargate, and it wouldn't change environment variables." }
    ],
    answer: [0],
    tip: "Secrets are read at task start only → force a new deployment after rotation (or read at runtime)."
  },
  {
    id: "ecs-06", domain: "d1", topic: "ECS and Fargate",
    q: "An ECS service with a desired count of 1 has minimumHealthyPercent 100 and maximumPercent 100. A new task definition was set on the service, but the deployment never starts replacing the task. Why?",
    options: [
      { t: "ECS can't stop the old task (minimum 100%) and can't add a new one (maximum 100%), so it can't make progress.",
        why: "Correct. Raise maximumPercent (for example 200) to start the new task first, or lower minimumHealthyPercent to allow the old one to stop." },
      { t: "The circuit breaker blocked the deployment.",
        why: "The circuit breaker reacts to failing tasks. Here no new task is even launched." },
      { t: "Services with one task can't be updated.",
        why: "They can, if the percentages allow it." },
      { t: "Fargate only allows maximumPercent of 100.",
        why: "Fargate supports up to 200%." }
    ],
    answer: [0],
    tip: "min 100 / max 100 → deployment can't proceed; one limit must give."
  },
  {
    id: "ecs-07", domain: "d1", topic: "ECS and Fargate",
    q: "An ECS service on EC2 has 10 tasks and no spare cluster capacity. The team can accept reduced capacity during deployments but can't add instances. Which deployment settings allow rolling deployments?",
    options: [
      { t: "minimumHealthyPercent 50 and maximumPercent 100.",
        why: "Correct. ECS stops up to 5 old tasks first and starts new ones in their place, never running more than 10 tasks." },
      { t: "minimumHealthyPercent 100 and maximumPercent 200.",
        why: "This needs room for up to 20 tasks, which the cluster doesn't have." },
      { t: "minimumHealthyPercent 100 and maximumPercent 100.",
        why: "The deployment can't make progress." },
      { t: "minimumHealthyPercent 0 and maximumPercent 200.",
        why: "Allows all tasks to stop at once, and still needs extra room." }
    ],
    answer: [0],
    tip: "No spare capacity → lower minimumHealthyPercent (e.g. 50) with maximumPercent 100."
  },
  {
    id: "ecs-08", domain: "d1", topic: "ECS and Fargate",
    q: "A Java service behind an ALB takes about 3 minutes to start. During every deployment, new tasks are stopped and replaced repeatedly, and the deployment takes far too long. The ALB health check is correct once the app is up. What should be changed?",
    options: [
      { t: "Set the service's healthCheckGracePeriodSeconds longer than the start-up time, for example 240 seconds.",
        why: "Correct. During the grace period ECS ignores ELB health check failures, so slow-starting tasks aren't killed." },
      { t: "Increase the ALB deregistration delay.",
        why: "This affects how long old targets drain, not how new tasks are judged." },
      { t: "Disable the ALB health check.",
        why: "Then broken tasks would receive traffic." },
      { t: "Raise maximumPercent to 300.",
        why: "maximumPercent can't go above 200, and it doesn't fix tasks being killed." }
    ],
    answer: [0],
    tip: "Slow-starting tasks killed during deploys → healthCheckGracePeriodSeconds."
  },
  {
    id: "ecs-09", domain: "d1", topic: "ECS and Fargate",
    q: "A company wants to deploy a new version of an ECS service, run integration tests against it on a separate port BEFORE any production traffic reaches it, then shift 10% of production traffic for 5 minutes before the rest. Which solution meets this?",
    options: [
      { t: "Use the CODE_DEPLOY deployment controller with two target groups, a test listener, an AfterAllowTestTraffic hook, and the ECSCanary10Percent5Minutes configuration.",
        why: "Correct. The test listener sends test traffic to the green task set, the hook runs tests, then CodeDeploy shifts 10% for 5 minutes, then 100%." },
      { t: "Use rolling updates with minimumHealthyPercent 90.",
        why: "Rolling updates don't test before traffic or shift a set percentage for a set time." },
      { t: "Use rolling updates with the circuit breaker.",
        why: "The circuit breaker detects failures but doesn't give a test listener or canary." },
      { t: "Create a second service and use Route 53 weighted records.",
        why: "Possible but manual, with DNS caching and no hooks or automatic rollback." }
    ],
    answer: [0],
    tip: "Test listener + tests before traffic + canary → CodeDeploy ECS blue/green (AfterAllowTestTraffic)."
  },
  {
    id: "ecs-10", domain: "d1", topic: "ECS and Fargate",
    q: "In a CodeDeploy blue/green deployment for ECS, at which lifecycle hook should integration tests run against the new version through the test listener?",
    options: [
      { t: "AfterAllowTestTraffic.",
        why: "Correct. At this point the test listener routes to the replacement (green) task set, but production traffic hasn't moved." },
      { t: "BeforeInstall.",
        why: "The green task set doesn't exist yet." },
      { t: "AfterAllowTraffic.",
        why: "Production traffic has already shifted, which is too late for pre-release tests." },
      { t: "ValidateService.",
        why: "ValidateService is an EC2/on-premises hook, not an ECS hook." }
    ],
    answer: [0],
    tip: "ECS hooks: BeforeInstall, AfterInstall, AfterAllowTestTraffic, BeforeAllowTraffic, AfterAllowTraffic."
  },
  {
    id: "ecs-11", domain: "d1", topic: "ECS and Fargate",
    q: "A team uses CodeDeploy blue/green for an ECS service behind a Network Load Balancer. They try to use the ECSCanary10Percent5Minutes deployment configuration, but it isn't accepted. Why?",
    options: [
      { t: "With an NLB, only CodeDeployDefault.ECSAllAtOnce is supported.",
        why: "Correct. Canary and linear traffic shifting for ECS need an Application Load Balancer." },
      { t: "Canary configurations need a test listener.",
        why: "A test listener is optional and not the cause." },
      { t: "Canary configurations only work with the EC2 launch type.",
        why: "They work with Fargate and EC2 behind an ALB." },
      { t: "The circuit breaker must be enabled first.",
        why: "The circuit breaker doesn't apply to CodeDeploy deployments." }
    ],
    answer: [0],
    tip: "ECS blue/green with NLB → AllAtOnce only; canary/linear need ALB."
  },
  {
    id: "ecs-12", domain: "d1", topic: "ECS and Fargate",
    q: "After an ECS blue/green deployment completed, a serious bug is found 30 minutes later. The team wants to switch back instantly. What should they have configured?",
    options: [
      { t: "A longer termination wait time for the original task set in the deployment group (for example 60 minutes or more).",
        why: "Correct. While the blue task set is still running, rollback simply reroutes the listener back to it. The wait can be up to 2,880 minutes." },
      { t: "A shorter ALB deregistration delay.",
        why: "This only affects draining connections." },
      { t: "The deployment circuit breaker.",
        why: "Not available with the CODE_DEPLOY controller, and it reacts to failing tasks, not later bugs." },
      { t: "A larger desired count.",
        why: "Doesn't keep the old version running." }
    ],
    answer: [0],
    tip: "Keep blue around for instant rollback → termination wait time (up to 2 days)."
  },
  {
    id: "ecs-13", domain: "d1", topic: "ECS and Fargate",
    q: "A CodePipeline uses CodeBuild to build a Docker image and the standard Amazon ECS deploy action (rolling update). The deploy action fails with an error that it can't find the image definitions. What must the build produce?",
    options: [
      { t: "An imagedefinitions.json artifact listing each container name and its imageUri.",
        why: "Correct. The ECS (rolling) deploy action reads imagedefinitions.json, swaps the images into a new task definition revision and updates the service." },
      { t: "An imageDetail.json artifact.",
        why: "imageDetail.json is used by the Amazon ECS (Blue/Green) action." },
      { t: "An appspec.yaml file.",
        why: "appspec.yaml is for CodeDeploy blue/green deployments." },
      { t: "A buildspec.yml in the artifact.",
        why: "The buildspec defines the build. It isn't read by the deploy action." }
    ],
    answer: [0],
    tip: "ECS rolling deploy action → imagedefinitions.json (container name must match)."
  },
  {
    id: "ecs-14", domain: "d1", topic: "ECS and Fargate",
    q: "A team is switching their pipeline to the Amazon ECS (Blue/Green) deploy action (CodeDeployToECS). Which input files does this action need?",
    options: [
      { t: "taskdef.json and appspec.yaml, plus imageDetail.json for the image when it comes from the build or ECR source.",
        why: "Correct. The action fills the image placeholder in taskdef.json, registers it, and puts the task definition into the appspec's TASK_DEFINITION placeholder." },
      { t: "Only imagedefinitions.json.",
        why: "That's the input for the standard (rolling) ECS deploy action." },
      { t: "A CloudFormation template.",
        why: "This action doesn't use CloudFormation." },
      { t: "An env.yaml manifest.",
        why: "env.yaml is an Elastic Beanstalk file." }
    ],
    answer: [0],
    tip: "ECS blue/green action → taskdef.json + appspec.yaml (+ imageDetail.json)."
  },
  {
    id: "ecs-15", domain: "d1", topic: "ECS and Fargate",
    q: "A team pushes new images using the same tag ':prod' to ECR. After each push, the running ECS service doesn't change. How should they deploy the new image, and what is the better long-term practice?",
    options: [
      { t: "Run update-service with --force-new-deployment now; long term, use a unique tag per build (such as the commit SHA) with a new task definition revision and turn on ECR tag immutability.",
        why: "Correct. A forced deployment starts new tasks that resolve the current image. Unique tags make each release traceable and easy to roll back." },
      { t: "Restart the ECS cluster.",
        why: "There's no cluster restart, and it wouldn't be a controlled deployment." },
      { t: "Deregister the current task definition revision.",
        why: "Deregistering doesn't replace running tasks." },
      { t: "Increase the desired count by one.",
        why: "Only a new task might get the new image, leaving mixed versions." }
    ],
    answer: [0],
    tip: "Same tag, new image → --force-new-deployment; better: unique tags + immutable tags."
  },
  {
    id: "ecs-16", domain: "d1", topic: "ECS and Fargate",
    q: "An ECS service uses the CODE_DEPLOY deployment controller. An engineer tries to update the service's task definition with aws ecs update-service and gets an error. What is the correct way to release a new task definition?",
    options: [
      { t: "Create a CodeDeploy deployment (for example through CodePipeline's ECS Blue/Green action) with an appspec pointing to the new task definition.",
        why: "Correct. With CODE_DEPLOY, task definition, load balancer and network changes go through CodeDeploy deployments." },
      { t: "Change the deployment controller to ECS temporarily.",
        why: "The deployment controller can't be changed after the service is created." },
      { t: "Delete and recreate the service for each release.",
        why: "This causes downtime and isn't needed." },
      { t: "Use update-service with --force-new-deployment.",
        why: "This doesn't change the task definition for a CODE_DEPLOY service." }
    ],
    answer: [0],
    tip: "CODE_DEPLOY service → new versions only via CodeDeploy; controller fixed at creation."
  },
  {
    id: "ecs-17", domain: "d1", topic: "ECS and Fargate",
    q: "A Fargate task stops shortly after starting. The stopped reason shows OutOfMemoryError, and the container exited with code 137. What is the MOST likely cause and fix?",
    options: [
      { t: "The container went over its hard memory limit. Increase the container memory (and task memory) or fix the memory usage.",
        why: "Correct. Exit code 137 means the process was killed, here for exceeding its memory limit." },
      { t: "The execution role can't pull the image.",
        why: "That gives CannotPullContainerError, and the container would never start." },
      { t: "The health check grace period is too short.",
        why: "Health check failures stop tasks with a health check reason, not OutOfMemoryError." },
      { t: "The task needs the bridge network mode.",
        why: "Fargate only supports awsvpc, and networking doesn't cause memory errors." }
    ],
    answer: [0],
    tip: "Exit 137 / OutOfMemoryError → container hit its hard memory limit."
  },
  {
    id: "ecs-18", domain: "d1", topic: "ECS and Fargate",
    q: "Fargate tasks fail to start with ResourceInitializationError: unable to pull secrets. The task definition references an SSM parameter encrypted with a customer managed KMS key. The tasks run in a subnet with a NAT gateway. What is the MOST likely fix?",
    options: [
      { t: "Give the task execution role ssm:GetParameters and kms:Decrypt for that key.",
        why: "Correct. ECS fetches secrets at startup using the execution role, which needs permission to read the parameter and decrypt it." },
      { t: "Give the task role ssm:GetParameters.",
        why: "The task role is for the app's own calls. Secrets in the task definition are fetched with the execution role." },
      { t: "Add an S3 gateway endpoint.",
        why: "The subnet already has a NAT gateway, and S3 isn't used for SSM parameters." },
      { t: "Change the parameter to a plain environment variable.",
        why: "This exposes the secret in the task definition." }
    ],
    answer: [0],
    tip: "ResourceInitializationError fetching secrets → execution role (ssm/secretsmanager + kms:Decrypt) or network route."
  },
  {
    id: "ecs-19", domain: "d1", topic: "ECS and Fargate",
    q: "A company runs a batch-processing ECS service that can tolerate interruptions and wants to cut compute costs as much as possible, while always keeping at least 2 tasks on regular capacity. What should they configure?",
    options: [
      { t: "A capacity provider strategy with FARGATE base 2 and the remaining weight on FARGATE_SPOT.",
        why: "Correct. The base guarantees 2 tasks on regular Fargate, and the rest run on Fargate Spot at a large discount." },
      { t: "Run all tasks on FARGATE_SPOT.",
        why: "Cheapest, but nothing guarantees 2 tasks stay running when Spot capacity is reclaimed." },
      { t: "Use the EC2 launch type with On-Demand instances only.",
        why: "This costs more and adds instance management." },
      { t: "Reduce the task memory to the minimum.",
        why: "This may break the app and doesn't use Spot savings." }
    ],
    answer: [0],
    tip: "Cheap but some guaranteed capacity → capacity provider strategy: FARGATE base + FARGATE_SPOT weight."
  },
  {
    id: "ecs-20", domain: "d1", topic: "ECS and Fargate",
    q: "The operations team wants to be notified in Slack whenever an ECS rolling deployment fails or is rolled back by the circuit breaker. What is the BEST approach?",
    options: [
      { t: "Create an EventBridge rule for ECS Deployment State Change events with SERVICE_DEPLOYMENT_FAILED and send them to SNS or Amazon Q Developer in chat applications (Slack).",
        why: "Correct. ECS emits deployment state change events that EventBridge can route to notifications." },
      { t: "Poll describe-services every minute with a cron job.",
        why: "Works, but it's custom polling when events already exist." },
      { t: "Enable Container Insights.",
        why: "Container Insights gives metrics and dashboards, not deployment failure notifications." },
      { t: "Turn on ECS Exec.",
        why: "ECS Exec is for shell access to containers." }
    ],
    answer: [0],
    tip: "React to ECS deployment failures → EventBridge ECS Deployment State Change (SERVICE_DEPLOYMENT_FAILED)."
  },
  {
    id: "ecs-21", domain: "d1", topic: "ECS and Fargate",
    q: "Fargate tasks behind an ALB register to the target group but stay unhealthy. The health check path is correct and the app works when tested inside the task. The target group uses target type 'ip'. What is the MOST likely cause?",
    options: [
      { t: "The tasks' security group doesn't allow inbound traffic on the container port from the ALB's security group.",
        why: "Correct. With awsvpc, each task has its own security group, which must allow the ALB to reach the container port." },
      { t: "The target type must be 'instance' for Fargate.",
        why: "Fargate (awsvpc) needs target type 'ip'." },
      { t: "The tasks need privileged mode.",
        why: "Privileged mode isn't allowed on Fargate and isn't related." },
      { t: "The ALB needs a test listener.",
        why: "Test listeners are only for CodeDeploy blue/green testing." }
    ],
    answer: [0],
    tip: "Fargate targets unhealthy → task security group must allow the ALB SG; target type ip."
  },
  {
    id: "ecs-22", domain: "d1", topic: "ECS and Fargate",
    q: "An engineer needs to open a shell in a running Fargate container to troubleshoot a production issue, without SSH or opening ports, and the sessions must be audited. What should they use?",
    options: [
      { t: "ECS Exec (aws ecs execute-command) with enableExecuteCommand on the service, SSM permissions in the task role, and session logging to CloudWatch Logs or S3.",
        why: "Correct. ECS Exec uses Systems Manager Session Manager, needs no open ports, and can log every session." },
      { t: "SSH to the Fargate host.",
        why: "Fargate hosts aren't accessible." },
      { t: "Add port 22 to the task security group and run an SSH server in the container.",
        why: "Opens a port, adds an SSH server, and has no central auditing." },
      { t: "Use CloudWatch Logs Insights.",
        why: "Useful for reading logs, but it doesn't give a shell." }
    ],
    answer: [0],
    tip: "Shell into Fargate containers → ECS Exec (SSM; task role permissions; logged sessions)."
  },

  // ───────────────────────────── EKS for CI/CD ─────────────────────────────
  {
    id: "eks-01", domain: "d1", topic: "EKS for CI/CD",
    q: "A CodeBuild project deploys to an Amazon EKS cluster. aws eks update-kubeconfig succeeds, but kubectl apply fails with 'error: You must be logged in to the server (Unauthorized)'. What should the DevOps engineer do?",
    options: [
      { t: "Create an EKS access entry for the CodeBuild service role and associate an access policy (for example AmazonEKSEditPolicy scoped to the target namespace).",
        why: "Correct. IAM lets the role describe the cluster, but Kubernetes still needs the role mapped to permissions inside the cluster. Access entries do that through the EKS API." },
      { t: "Add eks:* to the CodeBuild service role.",
        why: "IAM permissions alone don't grant Kubernetes RBAC permissions inside the cluster." },
      { t: "Turn on privileged mode in the CodeBuild project.",
        why: "Privileged mode is for running Docker builds, not cluster authentication." },
      { t: "Use the node instance role in CodeBuild.",
        why: "The node role isn't meant for deployments and still wouldn't be the right RBAC mapping." }
    ],
    answer: [0],
    tip: "kubectl Unauthorized → map the IAM role into the cluster (access entry or aws-auth)."
  },
  {
    id: "eks-02", domain: "d1", topic: "EKS for CI/CD",
    q: "A company wants to use AWS CodeDeploy canary deployments for microservices running on Amazon EKS, with automatic rollback based on CloudWatch metrics. What should the DevOps engineer recommend?",
    options: [
      { t: "CodeDeploy doesn't support EKS. Use a progressive delivery controller such as Argo Rollouts or Flagger, which runs canary steps with metric analysis and automatic rollback.",
        why: "Correct. CodeDeploy supports EC2/on-premises, Lambda and ECS only. Argo Rollouts and Flagger provide canary analysis on Kubernetes." },
      { t: "Create a CodeDeploy deployment group with the EKS compute platform.",
        why: "There is no EKS compute platform in CodeDeploy." },
      { t: "Use the CodeDeploy agent on the worker nodes.",
        why: "This would deploy files to EC2 instances, not Kubernetes workloads." },
      { t: "Use ECS blue/green deployment configurations.",
        why: "Those apply to ECS services, not EKS." }
    ],
    answer: [0],
    tip: "CodeDeploy: EC2/on-prem, Lambda, ECS — NOT EKS. Canary on EKS → Argo Rollouts / Flagger."
  },
  {
    id: "eks-03", domain: "d1", topic: "EKS for CI/CD",
    q: "Pods in the 'billing' namespace need read and write access to one DynamoDB table. Other pods on the same nodes must not have this access. What is the MOST secure solution?",
    options: [
      { t: "Use EKS Pod Identity (or IRSA) to link an IAM role with the table permissions to the billing service account.",
        why: "Correct. Only pods using that service account get the role's credentials, which is least privilege." },
      { t: "Add the DynamoDB permissions to the node instance role.",
        why: "Every pod on those nodes would get the permissions." },
      { t: "Store an IAM user's access keys in a Kubernetes Secret.",
        why: "Long-term keys are risky and Kubernetes Secrets are only base64 encoded." },
      { t: "Put the billing pods on Fargate and use the pod execution role.",
        why: "The pod execution role is for pulling images and logging, not application permissions." }
    ],
    answer: [0],
    tip: "Per-pod AWS permissions → EKS Pod Identity or IRSA (service account), never the node role."
  },
  {
    id: "eks-04", domain: "d1", topic: "EKS for CI/CD",
    q: "Users see HTTP 502 errors for several seconds during every rolling update of a Kubernetes Deployment on EKS. The new pods take about 20 seconds to warm up. What should be added?",
    options: [
      { t: "A readinessProbe on the container, with maxUnavailable set to 0.",
        why: "Correct. The readiness probe keeps traffic away from pods until they're ready, and maxUnavailable 0 keeps full capacity during the rollout." },
      { t: "A livenessProbe with a short initial delay.",
        why: "A liveness probe restarts containers. A short delay could even kill warming pods." },
      { t: "The Recreate deployment strategy.",
        why: "Recreate stops all pods first, which causes downtime." },
      { t: "A HorizontalPodAutoscaler.",
        why: "The HPA scales on load. It doesn't stop traffic going to unready pods." }
    ],
    answer: [0],
    tip: "Errors during rolling updates → readinessProbe (+ maxUnavailable: 0)."
  },
  {
    id: "eks-05", domain: "d1", topic: "EKS for CI/CD",
    q: "A pipeline deploys with Helm. If the new release's pods don't become ready, the pipeline step must fail and the previous release must be restored automatically. Which command meets this?",
    options: [
      { t: "helm upgrade --install --atomic --wait --timeout 5m",
        why: "Correct. --wait waits for resources to be ready and --atomic rolls back automatically if the upgrade fails, returning an error to the pipeline." },
      { t: "helm upgrade --install",
        why: "Returns as soon as the manifests are submitted, without waiting or rolling back." },
      { t: "helm install --dry-run",
        why: "A dry run doesn't deploy anything." },
      { t: "kubectl apply -f chart/",
        why: "Doesn't wait for readiness or roll back automatically." }
    ],
    answer: [0],
    tip: "Helm auto rollback on failure → --atomic --wait (with --timeout)."
  },
  {
    id: "eks-06", domain: "d1", topic: "EKS for CI/CD",
    q: "A pipeline runs kubectl apply and reports success, but the new pods are crash-looping in production. The team wants the pipeline step to fail when the Deployment doesn't become healthy. What should be added to the buildspec?",
    options: [
      { t: "kubectl rollout status deployment/web --timeout=300s after the apply.",
        why: "Correct. rollout status waits for the rollout and exits non-zero if it doesn't finish in time, failing the build." },
      { t: "kubectl get pods.",
        why: "Lists pods but always exits successfully." },
      { t: "Set CodeBuild timeout to 8 hours.",
        why: "A longer timeout doesn't check deployment health." },
      { t: "kubectl rollout undo before every deployment.",
        why: "This rolls back the previous change, which makes no sense before deploying." }
    ],
    answer: [0],
    tip: "Make the pipeline fail on bad rollout → kubectl rollout status --timeout."
  },
  {
    id: "eks-07", domain: "d1", topic: "EKS for CI/CD",
    q: "A bad image was deployed to a Kubernetes Deployment on EKS. What is the FASTEST way to return to the previous version?",
    options: [
      { t: "kubectl rollout undo deployment/web",
        why: "Correct. Kubernetes keeps the previous ReplicaSet, so undo scales it back up and the bad one down." },
      { t: "Delete the Deployment and create it again.",
        why: "Causes downtime and loses the rollout history." },
      { t: "Rebuild the previous commit in the pipeline.",
        why: "Works, but is much slower than rollout undo." },
      { t: "Scale the node group to zero.",
        why: "Stops everything." }
    ],
    answer: [0],
    tip: "Kubernetes rollback → kubectl rollout undo (helm rollback for Helm releases)."
  },
  {
    id: "eks-08", domain: "d1", topic: "EKS for CI/CD",
    q: "An EKS cluster's API endpoint is private only. A CodeBuild deployment step times out when running kubectl. What is the correct fix?",
    options: [
      { t: "Configure the CodeBuild project to run in the cluster's VPC, with subnets and security groups that can reach the API endpoint.",
        why: "Correct. A private endpoint is only reachable from inside the VPC (or connected networks)." },
      { t: "Add eks:DescribeCluster to the role.",
        why: "That's needed for update-kubeconfig, but the problem is network reachability." },
      { t: "Add an access entry for the CodeBuild role.",
        why: "Authorization doesn't help if CodeBuild can't reach the endpoint at all." },
      { t: "Turn on control plane audit logging.",
        why: "Logging doesn't affect connectivity." }
    ],
    answer: [0],
    tip: "Private EKS endpoint → CodeBuild in the VPC."
  },
  {
    id: "eks-09", domain: "d1", topic: "EKS for CI/CD",
    q: "A company wants deployments to EKS where the CI pipeline never holds cluster credentials, every change is in Git, and manual changes made with kubectl are automatically reverted. Which approach fits?",
    options: [
      { t: "GitOps with Argo CD or Flux running in the cluster and watching the Git repository.",
        why: "Correct. The in-cluster controller pulls changes from Git, so the pipeline only updates Git, and drift is corrected automatically." },
      { t: "CodeBuild running kubectl apply with cluster admin access.",
        why: "The pipeline holds cluster credentials and manual drift isn't reverted." },
      { t: "CodeDeploy blue/green for EKS.",
        why: "CodeDeploy doesn't support EKS." },
      { t: "AWS Config rules for Kubernetes objects.",
        why: "AWS Config doesn't track or revert Kubernetes objects inside the cluster." }
    ],
    answer: [0],
    tip: "No cluster creds in CI + drift self-heals → GitOps (Argo CD / Flux)."
  },
  {
    id: "eks-10", domain: "d1", topic: "EKS for CI/CD",
    q: "The security team wants to know which user deleted a Kubernetes Deployment in an EKS cluster last week. Where can this be found?",
    options: [
      { t: "In the EKS control plane audit logs in CloudWatch Logs, if audit logging was turned on.",
        why: "Correct. Kubernetes API actions such as deleting a Deployment are recorded in the audit log, which is off by default." },
      { t: "In AWS CloudTrail.",
        why: "CloudTrail records EKS API calls (like CreateCluster), not Kubernetes API calls inside the cluster." },
      { t: "In VPC Flow Logs.",
        why: "Flow logs show network traffic, not who did what." },
      { t: "In Container Insights.",
        why: "Container Insights shows metrics and container logs, not API audit events." }
    ],
    answer: [0],
    tip: "Who did what inside Kubernetes → control plane audit logs (enable them!)."
  },
  {
    id: "eks-11", domain: "d1", topic: "EKS for CI/CD",
    q: "A team needs an EKS data plane with no nodes to manage for a set of stateless web pods. They also run a log-collector DaemonSet on every node. What should they know about Fargate profiles?",
    options: [
      { t: "Fargate runs pods without nodes to manage, but DaemonSets aren't supported, so logging must use a sidecar or Fargate's built-in Fluent Bit log router.",
        why: "Correct. Each Fargate pod runs in its own micro-VM, so there are no nodes for DaemonSets. Privileged pods and EBS volumes also aren't supported." },
      { t: "Fargate supports DaemonSets as long as they are privileged.",
        why: "Privileged pods aren't allowed on Fargate either." },
      { t: "Fargate profiles only select pods by instance type.",
        why: "Fargate profiles select pods by namespace and labels." },
      { t: "Fargate requires managed node groups to run the pods.",
        why: "Fargate pods don't need any node group." }
    ],
    answer: [0],
    tip: "EKS Fargate: no DaemonSets, no privileged pods, no EBS; profiles match namespace + labels."
  },
  {
    id: "eks-12", domain: "d1", topic: "EKS for CI/CD",
    q: "An EKS cluster runs Kubernetes 1.29 and must move to 1.31. The workloads are business-critical and the team wants the LOWEST risk with a fast way back. What should they do?",
    options: [
      { t: "Create a new cluster on 1.31, deploy the workloads, test, then shift traffic gradually with Route 53 weighted records.",
        why: "Correct. Blue/green clusters avoid in-place risk and allow switching back by changing DNS weights." },
      { t: "Upgrade the control plane from 1.29 directly to 1.31.",
        why: "EKS control planes can only be upgraded one minor version at a time." },
      { t: "Upgrade the worker nodes to 1.31 first, then the control plane.",
        why: "Nodes can't be newer than the control plane. The control plane is upgraded first." },
      { t: "Delete and recreate the existing cluster on 1.31.",
        why: "Causes a full outage." }
    ],
    answer: [0],
    tip: "EKS upgrades: one minor at a time (control plane → add-ons → nodes), or blue/green clusters + Route 53."
  },
  {
    id: "eks-13", domain: "d1", topic: "EKS for CI/CD",
    q: "A CodeBuild deploy step fails at 'aws eks update-kubeconfig' with an AccessDenied error. What IAM permission is missing from the CodeBuild service role?",
    options: [
      { t: "eks:DescribeCluster",
        why: "Correct. update-kubeconfig calls DescribeCluster to get the cluster endpoint and certificate." },
      { t: "eks:CreateCluster",
        why: "Not needed to deploy to an existing cluster." },
      { t: "ecr:GetAuthorizationToken",
        why: "That's for logging in to ECR, not getting the kubeconfig." },
      { t: "sts:AssumeRoleWithWebIdentity",
        why: "That's used by IRSA in pods, not by update-kubeconfig." }
    ],
    answer: [0],
    tip: "update-kubeconfig AccessDenied → eks:DescribeCluster on the IAM role."
  },
  {
    id: "eks-14", domain: "d1", topic: "EKS for CI/CD",
    q: "A company stores database passwords in Kubernetes Secrets on EKS. An auditor says this isn't secure enough. What should the DevOps engineer do? (Choose TWO.)",
    multi: true,
    options: [
      { t: "Turn on KMS envelope encryption for Kubernetes Secrets in the cluster.",
        why: "Correct. Secrets are then encrypted in etcd with a KMS key you control." },
      { t: "Store the passwords in AWS Secrets Manager and mount them with the Secrets Store CSI driver.",
        why: "Correct. Secrets stay in Secrets Manager with rotation and auditing, and pods read them through the CSI driver using their IAM role." },
      { t: "Base64 encode the passwords twice.",
        why: "Encoding isn't encryption." },
      { t: "Put the passwords in a ConfigMap instead.",
        why: "ConfigMaps are even less protected." },
      { t: "Store the passwords in the container image.",
        why: "Anyone who can pull the image can read them." }
    ],
    answer: [0, 1],
    tip: "K8s Secrets are base64 only → KMS envelope encryption and/or Secrets Manager + CSI driver."
  },
  {
    id: "eks-15", domain: "d1", topic: "EKS for CI/CD",
    q: "A team wants to send 10% of traffic to a new version of a service on EKS, with an ALB in front created by the AWS Load Balancer Controller, and increase it manually after checks. What is the simplest way?",
    options: [
      { t: "Run the new version as a separate Service and use ALB Ingress weighted target group annotations (for example 90/10).",
        why: "Correct. The AWS Load Balancer Controller supports weighted forwarding between Services on one ALB listener rule." },
      { t: "Use CodeDeploy ECSCanary10Percent5Minutes.",
        why: "That configuration is for ECS, and CodeDeploy doesn't support EKS." },
      { t: "Set maxSurge to 10%.",
        why: "This controls rolling update pace, not a steady traffic split." },
      { t: "Use a Lambda weighted alias.",
        why: "Lambda aliases don't route traffic to Kubernetes pods." }
    ],
    answer: [0],
    tip: "Weighted traffic on EKS behind ALB → Ingress weighted target groups (or Argo Rollouts)."
  },
  {
    id: "eks-16", domain: "d1", topic: "EKS for CI/CD",
    q: "A team adds a new IAM role for their deployment pipeline by editing the aws-auth ConfigMap. A YAML mistake locks every user and the pipeline out of the cluster. How can they avoid this risk going forward?",
    options: [
      { t: "Use EKS access entries and access policies, managed through the EKS API or infrastructure as code, instead of editing aws-auth.",
        why: "Correct. Access entries are managed outside the cluster, so a bad edit can't lock out cluster access through a broken ConfigMap." },
      { t: "Give every user the node instance role.",
        why: "This removes individual identities and least privilege." },
      { t: "Turn off RBAC.",
        why: "RBAC can't be disabled on EKS and that would be insecure." },
      { t: "Use IRSA for the pipeline role.",
        why: "IRSA gives pods AWS permissions; it doesn't grant external roles access to the cluster." }
    ],
    answer: [0],
    tip: "Cluster access management → access entries (recommended) instead of the aws-auth ConfigMap."
  },
  {
    id: "eks-17", domain: "d1", topic: "EKS for CI/CD",
    q: "A company wants Kubernetes canary releases on EKS where each step (10%, 25%, 50%) is promoted only if Prometheus error-rate queries stay healthy, and it rolls back automatically otherwise. What should they use?",
    options: [
      { t: "Argo Rollouts (or Flagger) with canary steps and an analysis template based on the Prometheus queries.",
        why: "Correct. These controllers automate progressive delivery with metric analysis and automatic rollback on Kubernetes." },
      { t: "A standard Deployment with maxSurge 10%.",
        why: "A rolling update has no metric analysis or fixed traffic steps." },
      { t: "CodeDeploy linear deployment configuration.",
        why: "CodeDeploy doesn't support EKS." },
      { t: "HorizontalPodAutoscaler with a custom metric.",
        why: "HPA scales pods; it doesn't manage release steps." }
    ],
    answer: [0],
    tip: "Metric-driven canary on Kubernetes → Argo Rollouts / Flagger."
  },
  {
    id: "eks-18", domain: "d1", topic: "EKS for CI/CD",
    q: "Pods on EC2 managed nodes fail with ImagePullBackOff for an image in the same account's private ECR repository. The image and tag exist. What is the MOST likely cause?",
    options: [
      { t: "The node IAM role is missing the AmazonEC2ContainerRegistryReadOnly permissions.",
        why: "Correct. On EC2 nodes, the kubelet pulls images using the node role." },
      { t: "The pod's service account has no IRSA role.",
        why: "Image pulls on EC2 nodes don't use the pod's service account role." },
      { t: "The CodeBuild role lacks ecr:PutImage.",
        why: "The image was already pushed. This is about pulling on the nodes." },
      { t: "The cluster needs a Fargate profile.",
        why: "Not related to image pull permissions on EC2 nodes." }
    ],
    answer: [0],
    tip: "ImagePullBackOff from private ECR on EC2 nodes → node role ECR read; on Fargate → pod execution role."
  },
  {
    id: "eks-19", domain: "d1", topic: "EKS for CI/CD",
    q: "A team wants the deployment pipeline's IAM role to deploy only into the 'shop' namespace of a shared EKS cluster. What is the least-privilege setup?",
    options: [
      { t: "An access entry for the role with AmazonEKSEditPolicy and an access scope of type namespace limited to 'shop'.",
        why: "Correct. Access policies can be scoped to specific namespaces." },
      { t: "An access entry with AmazonEKSClusterAdminPolicy at cluster scope.",
        why: "Gives full control of the whole cluster." },
      { t: "An IAM policy with eks:* limited to the cluster ARN.",
        why: "IAM doesn't control Kubernetes RBAC inside the cluster." },
      { t: "A separate cluster per pipeline.",
        why: "Costly and unnecessary for namespace isolation." }
    ],
    answer: [0],
    tip: "Pipeline access to one namespace → access entry + access policy with namespace scope."
  },
  {
    id: "eks-20", domain: "d1", topic: "EKS for CI/CD",
    q: "A team wants to deploy Helm charts to an EKS cluster from CodePipeline with as little custom build scripting as possible. What is the simplest current option?",
    options: [
      { t: "Use the CodePipeline Amazon EKS deploy action, which can deploy Helm charts or kubectl manifests to the cluster.",
        why: "Correct. The EKS action handles deployment without writing kubectl or Helm commands in a buildspec (it still needs cluster access for the pipeline role)." },
      { t: "Use the CodePipeline Amazon ECS deploy action.",
        why: "That deploys ECS services, not EKS." },
      { t: "Use a CodeDeploy deploy action with an EKS deployment group.",
        why: "CodeDeploy doesn't support EKS." },
      { t: "Use the CloudFormation deploy action with the Helm chart.",
        why: "CloudFormation doesn't deploy Helm charts on its own." }
    ],
    answer: [0],
    tip: "CodePipeline → EKS: the Amazon EKS deploy action (Helm or manifests) or CodeBuild with kubectl/helm."
  },
  {
    id: "eks-21", domain: "d1", topic: "EKS for CI/CD",
    q: "Pods on EKS keep restarting every few minutes. Events show the liveness probe failing during heavy load, although the app eventually responds. What is the likely fix?",
    options: [
      { t: "Make the livenessProbe less strict (longer timeoutSeconds, initialDelaySeconds or failureThreshold), and keep readiness checks separate.",
        why: "Correct. Too-strict liveness probes kill containers that are slow but working, causing restart loops." },
      { t: "Remove the readinessProbe.",
        why: "Readiness controls traffic, not restarts. Removing it causes errors during deployments." },
      { t: "Switch to the Recreate strategy.",
        why: "This affects deployments, not restarts from probes." },
      { t: "Turn on control plane audit logs.",
        why: "Helps auditing, not probe failures." }
    ],
    answer: [0],
    tip: "Restart loops → liveness probe too strict (or OOMKilled). Readiness = traffic; liveness = restart."
  },
  {
    id: "eks-22", domain: "d1", topic: "EKS for CI/CD",
    q: "The AWS Load Balancer Controller on EKS must create ALBs and target groups. How should it get AWS permissions?",
    options: [
      { t: "Through IRSA or EKS Pod Identity on the controller's service account, with the controller's IAM policy.",
        why: "Correct. The controller runs as pods, so it gets scoped AWS credentials through its service account." },
      { t: "Through the CodeBuild service role.",
        why: "The controller runs continuously in the cluster, not in the pipeline." },
      { t: "Through access entries.",
        why: "Access entries grant access to the Kubernetes API, not AWS API permissions to pods." },
      { t: "Through long-term access keys in a ConfigMap.",
        why: "Insecure, and ConfigMaps aren't for credentials." }
    ],
    answer: [0],
    tip: "In-cluster controllers needing AWS APIs → IRSA / Pod Identity. Access entries = into the cluster."
  },

  // ───────────────────────────── Testing in Pipelines ─────────────────────────────
  {
    id: "tp-01", domain: "d1", topic: "Testing in Pipelines",
    q: "A team publishes JaCoCo code coverage reports from CodeBuild. Management requires that builds FAIL when line coverage drops below 80%. Builds currently pass even with 60% coverage. What should the team do?",
    options: [
      { t: "Configure the test tool to enforce the threshold (for example a JaCoCo check rule) so it exits with a non-zero code below 80%.",
        why: "Correct. CodeBuild coverage reports only display coverage. The build fails only if a command returns a non-zero exit code." },
      { t: "Set a minimum coverage value on the CodeBuild report group.",
        why: "Report groups don't fail builds based on coverage." },
      { t: "Add a manual approval action after the build.",
        why: "This adds human review but doesn't enforce the rule automatically." },
      { t: "Change the report format to Cobertura.",
        why: "The format doesn't change whether the build fails." }
    ],
    answer: [0],
    tip: "Coverage gate → make the test tool exit non-zero (pytest --cov-fail-under, JaCoCo check); reports only display."
  },
  {
    id: "tp-02", domain: "d1", topic: "Testing in Pipelines",
    q: "Unit tests run in CodeBuild and some fail, yet the build succeeds and the pipeline deploys. The buildspec command is 'pytest tests/ || true'. What is the problem?",
    options: [
      { t: "'|| true' makes the command always return exit code 0, so CodeBuild never sees the failure. Remove it.",
        why: "Correct. CodeBuild decides pass or fail from the exit code. Swallowing it hides failed tests." },
      { t: "Test reports must be configured for CodeBuild to detect failures.",
        why: "Reports display results; the exit code decides success." },
      { t: "on-failure must be set to CONTINUE.",
        why: "CONTINUE makes the build keep going after failures, the opposite of what's needed." },
      { t: "pytest doesn't return exit codes.",
        why: "pytest returns a non-zero code when tests fail." }
    ],
    answer: [0],
    tip: "Tests failed but build passed → exit code swallowed (|| true, later command) or on-failure: CONTINUE."
  },
  {
    id: "tp-03", domain: "d1", topic: "Testing in Pipelines",
    q: "Auditors require 12 months of unit test results for every build. The team uses CodeBuild test reports. What should they do?",
    options: [
      { t: "Export the raw report files to an S3 bucket (with lifecycle rules) in addition to the report group.",
        why: "Correct. CodeBuild report groups keep test results for 30 days, so long-term retention needs S3." },
      { t: "Increase the report group retention to 12 months.",
        why: "Report group data retention is fixed at 30 days." },
      { t: "Store the results in CloudWatch metrics.",
        why: "Metrics give counts, not the detailed results auditors need, and have their own retention." },
      { t: "Keep the CodeBuild build logs only.",
        why: "Build logs aren't a structured test report and may be deleted by log retention settings." }
    ],
    answer: [0],
    tip: "CodeBuild report groups keep 30 days → export raw reports to S3 for long retention."
  },
  {
    id: "tp-04", domain: "d1", topic: "Testing in Pipelines",
    q: "A pipeline deploys a SAM application to a test environment with a CloudFormation action. The next action must run integration tests against the newly created API URL. What is the simplest way to give the test action the URL?",
    options: [
      { t: "Set a namespace on the CloudFormation action and pass #{Namespace.ApiUrl} (the stack output) as an environment variable to the CodeBuild test action.",
        why: "Correct. CodePipeline output variables expose stack outputs to later actions without extra code." },
      { t: "Hard-code the API URL in the buildspec.",
        why: "The URL changes when the stack is recreated, so tests would break." },
      { t: "Store the URL in the source repository after each deployment.",
        why: "Committing during a pipeline run is complicated and creates loops." },
      { t: "Use a manual approval where a tester types the URL.",
        why: "Manual steps slow the pipeline and aren't needed." }
    ],
    answer: [0],
    tip: "Pass deploy outputs to tests → CodePipeline output variables (namespace + #{Namespace.Output})."
  },
  {
    id: "tp-05", domain: "d1", topic: "Testing in Pipelines",
    q: "A test stage has three CodeBuild actions with the same runOrder: unit tests, SAST and IaC scanning. The IaC scan fails while the other two succeed. What happens?",
    options: [
      { t: "The stage fails and the pipeline doesn't continue to the next stage.",
        why: "Correct. Parallel actions run together, but the stage fails if any action fails. With V2 you can configure retry or rollback on failure." },
      { t: "The stage succeeds because two of three actions passed.",
        why: "There is no majority vote. Every action must succeed." },
      { t: "The other two actions are stopped immediately and their results lost.",
        why: "Running actions finish; their results are kept." },
      { t: "The pipeline skips the failed action automatically.",
        why: "Failed actions aren't skipped." }
    ],
    answer: [0],
    tip: "Parallel actions: any one fails → the stage fails."
  },
  {
    id: "tp-06", domain: "d1", topic: "Testing in Pipelines",
    q: "A CodePipeline Lambda invoke action calls a function that checks an API after deployment. The function finishes in seconds, but the action always fails after a long timeout. What is wrong?",
    options: [
      { t: "The function doesn't call PutJobSuccessResult or PutJobFailureResult to report the result to CodePipeline.",
        why: "Correct. CodePipeline waits for the job result. Without it, the action times out and fails." },
      { t: "Lambda functions can't be used in pipelines.",
        why: "The Lambda invoke action is a standard pipeline action." },
      { t: "The function needs more memory.",
        why: "The function already finishes quickly." },
      { t: "The action must be in the Build category.",
        why: "Lambda invoke actions are in the Invoke category; the category isn't the problem." }
    ],
    answer: [0],
    tip: "Lambda invoke action must call PutJobSuccessResult / PutJobFailureResult."
  },
  {
    id: "tp-07", domain: "d1", topic: "Testing in Pipelines",
    q: "A company wants each pull request to run integration tests against real AWS resources, without branches interfering with each other, and without paying for idle test environments. What should they do?",
    options: [
      { t: "Create an ephemeral stack per run (for example named with the build number), run the tests against it, then delete the stack.",
        why: "Correct. Each run gets an isolated, clean environment that exists only while tests run." },
      { t: "Share one long-lived test environment across all branches.",
        why: "Branches would overwrite each other's deployments and data." },
      { t: "Run the integration tests against production.",
        why: "Unsafe. Tests could change or expose real data." },
      { t: "Only run unit tests with mocks.",
        why: "Mocks don't prove the components work with real AWS resources." }
    ],
    answer: [0],
    tip: "Isolated integration tests per run → ephemeral stacks created and deleted by the pipeline."
  },
  {
    id: "tp-08", domain: "d1", topic: "Testing in Pipelines",
    q: "Where should a pipeline run load tests that simulate peak traffic for a new release, and how should the result gate the pipeline?",
    options: [
      { t: "In a production-like staging environment, using a tool such as k6 or JMeter (or Distributed Load Testing on AWS) with thresholds that make the step fail when latency or error limits are exceeded.",
        why: "Correct. Staging matches production without affecting customers, and threshold failures return a non-zero result that fails the action." },
      { t: "Against production on every commit.",
        why: "Risky and expensive; real users would be affected." },
      { t: "In the build stage on the CodeBuild container, against a mock.",
        why: "A mock doesn't show real scaling, latency or quota limits." },
      { t: "Only after release, by watching CloudWatch.",
        why: "Problems would be found by customers first." }
    ],
    answer: [0],
    tip: "Load tests → production-like staging, thresholds that fail the step, watch metrics and quotas."
  },
  {
    id: "tp-09", domain: "d1", topic: "Testing in Pipelines",
    q: "ECR basic scanning reports no vulnerabilities for an image, but a security review finds a known critical CVE in a Node.js package inside it. How should the team detect this automatically?",
    options: [
      { t: "Turn on ECR enhanced scanning (Amazon Inspector), which scans OS and programming language packages and re-scans continuously.",
        why: "Correct. Basic scanning only checks OS packages. Enhanced scanning covers language packages such as npm and pip." },
      { t: "Run basic scanning more often.",
        why: "Basic scanning still won't look at language packages." },
      { t: "Turn on tag immutability.",
        why: "Tag immutability prevents tag overwrites, not vulnerabilities." },
      { t: "Use GuardDuty.",
        why: "GuardDuty detects threats at runtime, not package vulnerabilities in images." }
    ],
    answer: [0],
    tip: "Language package CVEs in images → ECR enhanced scanning (Inspector); basic = OS only."
  },
  {
    id: "tp-10", domain: "d1", topic: "Testing in Pipelines",
    q: "A pipeline must stop before deployment if a newly built container image has any CRITICAL vulnerabilities. Which approach works?",
    options: [
      { t: "After pushing to ECR, have CodeBuild wait for the scan, read describe-image-scan-findings, and exit non-zero if the CRITICAL count is above zero.",
        why: "Correct. The failing command fails the action, which stops the pipeline before the deploy stage. Inspector CI/CD scanning before push also works." },
      { t: "Enable scanning and review the findings weekly.",
        why: "Images would be deployed before anyone looks." },
      { t: "Add a CloudFormation Guard Hook.",
        why: "Guard Hooks check CloudFormation resource configuration, not image vulnerabilities." },
      { t: "Turn on ECR replication.",
        why: "Replication copies images; it doesn't gate releases." }
    ],
    answer: [0],
    tip: "Gate on image CVEs → read scan findings in the pipeline and fail on CRITICAL."
  },
  {
    id: "tp-11", domain: "d1", topic: "Testing in Pipelines",
    q: "The security team wants every S3 bucket defined in CloudFormation templates to have encryption and block public access, checked automatically in the pipeline before deployment. Which tool should be used?",
    options: [
      { t: "AWS CloudFormation Guard (cfn-guard) with policy-as-code rules, run in CodeBuild.",
        why: "Correct. cfn-guard checks templates against your own rules and fails the build on violations. Guard Hooks can also enforce rules at deploy time." },
      { t: "cfn-lint.",
        why: "cfn-lint checks syntax and AWS best practices, not your organisation's custom policies." },
      { t: "Amazon Inspector.",
        why: "Inspector scans for software vulnerabilities, not template settings." },
      { t: "CloudFormation drift detection.",
        why: "Drift detection compares deployed resources to the template after deployment." }
    ],
    answer: [0],
    tip: "Custom template policies in the pipeline → cfn-guard (or Guard Hooks); cfn-lint = syntax/best practice."
  },
  {
    id: "tp-12", domain: "d1", topic: "Testing in Pipelines",
    q: "Developers accidentally committed AWS access keys several times. The company wants to stop secrets from ever reaching the repository, and also catch any that slip through. What should they do? (Choose TWO.)",
    multi: true,
    options: [
      { t: "Install git-secrets (or a similar tool) as a pre-commit hook on developer machines.",
        why: "Correct. A pre-commit hook blocks the commit before the secret leaves the developer's machine." },
      { t: "Add a secrets-scanning step (for example trufflehog) in the build stage that fails the pipeline when secrets are found.",
        why: "Correct. A pipeline check catches anything that bypassed local hooks." },
      { t: "Run load tests in staging.",
        why: "Load tests don't look for secrets." },
      { t: "Turn on ECR enhanced scanning.",
        why: "This scans container images for CVEs, not source code for secrets." },
      { t: "Encrypt the repository with KMS.",
        why: "Encryption at rest doesn't stop keys being committed and read by anyone with repository access." }
    ],
    answer: [0, 1],
    tip: "Secrets in code → pre-commit hooks (git-secrets) + pipeline secrets scan."
  },
  {
    id: "tp-13", domain: "d1", topic: "Testing in Pipelines",
    q: "Before production traffic moves to a new ECS version, the team wants automated integration tests to run against it on a separate port. What should they use?",
    options: [
      { t: "CodeDeploy ECS blue/green with a test listener and an AfterAllowTestTraffic Lambda hook that runs the tests.",
        why: "Correct. The test listener routes to the new task set, and the hook can fail the deployment before production traffic shifts." },
      { t: "A rolling update with the circuit breaker.",
        why: "The circuit breaker detects failing tasks; it doesn't provide a test port or test hook." },
      { t: "A CloudWatch Synthetics canary on the production URL.",
        why: "Production traffic would already reach the new version." },
      { t: "AWS FIS.",
        why: "FIS injects failures; it doesn't run pre-release tests." }
    ],
    answer: [0],
    tip: "Test new ECS version before production traffic → test listener + AfterAllowTestTraffic."
  },
  {
    id: "tp-14", domain: "d1", topic: "Testing in Pipelines",
    q: "A team runs chaos experiments with AWS FIS in staging. If the application's 5XX error rate goes above 5% during an experiment, the experiment must stop immediately. How?",
    options: [
      { t: "Configure a stop condition on the FIS experiment template using a CloudWatch alarm on the 5XX rate.",
        why: "Correct. FIS stops the experiment automatically when a stop-condition alarm goes into ALARM." },
      { t: "Set a short experiment duration.",
        why: "The experiment would still run until the duration ends, even if errors spike." },
      { t: "Use an SNS subscription to email the team.",
        why: "Notification alone doesn't stop the experiment." },
      { t: "Run the experiment from a manual approval action.",
        why: "Approval only controls when it starts." }
    ],
    answer: [0],
    tip: "FIS safety → stop conditions = CloudWatch alarms."
  },
  {
    id: "tp-15", domain: "d1", topic: "Testing in Pipelines",
    q: "A CodePipeline V2 pipeline must not promote a release to the production stage while a CloudWatch alarm on the staging environment is in ALARM. What should be configured?",
    options: [
      { t: "A beforeEntry condition on the production stage with a CloudWatch alarm rule.",
        why: "Correct. V2 stage conditions can check alarms and block the stage from starting." },
      { t: "A manual approval action.",
        why: "Depends on a human noticing the alarm." },
      { t: "An S3 Object Lock on the artifact bucket.",
        why: "Object Lock protects artifacts from deletion; it doesn't check alarms." },
      { t: "A CodeBuild report group.",
        why: "Report groups show test results; they don't gate stages on alarms." }
    ],
    answer: [0],
    tip: "Gate stage entry on alarms → CodePipeline V2 beforeEntry condition with CloudWatch alarm rule."
  },
  {
    id: "tp-16", domain: "d1", topic: "Testing in Pipelines",
    q: "After every production deployment, a team wants a scripted check of the login and checkout flows every 5 minutes, and an alarm that can trigger an automatic rollback if the checks fail. What should they use?",
    options: [
      { t: "CloudWatch Synthetics canaries with an alarm on success percentage, linked to the deployment's rollback alarms.",
        why: "Correct. Canaries run scripted browser or API checks on a schedule and their alarms can drive CodeDeploy, ECS or pipeline rollback." },
      { t: "AWS Device Farm.",
        why: "Device Farm runs tests on real devices and browsers in the pipeline, not continuous production monitoring." },
      { t: "Unit tests in CodeBuild.",
        why: "Unit tests don't check the live production site." },
      { t: "VPC Flow Logs.",
        why: "Flow logs show network traffic, not whether user flows work." }
    ],
    answer: [0],
    tip: "Continuous scripted checks in production → CloudWatch Synthetics canaries + alarms."
  },
  {
    id: "tp-17", domain: "d1", topic: "Testing in Pipelines",
    q: "A test suite takes 50 minutes in one CodeBuild build, slowing every merge. The tests are independent of each other. How can the team speed this up with the LEAST change to the tests?",
    options: [
      { t: "Use CodeBuild batch builds with parallel test execution to split the tests across several builds.",
        why: "Correct. Splitting independent tests across parallel builds reduces wall-clock time without rewriting tests." },
      { t: "Increase the build timeout.",
        why: "This lets builds run longer but doesn't make them faster." },
      { t: "Move all tests to the production stage.",
        why: "Tests would run too late, after risky changes ship." },
      { t: "Delete the slowest tests.",
        why: "Removes test coverage." }
    ],
    answer: [0],
    tip: "Slow independent tests → CodeBuild batch builds / parallel test splitting (+ caching)."
  },
  {
    id: "tp-18", domain: "d1", topic: "Testing in Pipelines",
    q: "Integration tests in CodeBuild need a database password. The current buildspec stores it as a plain environment variable. What is the BEST way to provide it?",
    options: [
      { t: "Store the password in Secrets Manager and reference it in the buildspec env section with secrets-manager.",
        why: "Correct. CodeBuild fetches the secret at runtime using its role, and the value is masked in logs." },
      { t: "Encrypt the buildspec file with KMS.",
        why: "The buildspec is still in source control and the value is still in it." },
      { t: "Hard-code the password in the test code.",
        why: "Puts the secret in the repository." },
      { t: "Pass the password through a pipeline variable typed at run time.",
        why: "Manual and visible in execution history." }
    ],
    answer: [0],
    tip: "Test secrets → buildspec env secrets-manager / parameter-store."
  },
  {
    id: "tp-19", domain: "d1", topic: "Testing in Pipelines",
    q: "A company wants to check a running web application in staging for vulnerabilities such as XSS and SQL injection as part of the pipeline. Which type of testing is this, and how?",
    options: [
      { t: "DAST: run a scanner such as OWASP ZAP in CodeBuild against the staging URL and fail on high-risk findings.",
        why: "Correct. Dynamic testing attacks the running application to find runtime vulnerabilities." },
      { t: "SAST in the build stage.",
        why: "SAST inspects source code, not the running application." },
      { t: "SCA with dependency scanning.",
        why: "SCA finds vulnerable libraries, not application-level injection flaws in the running app." },
      { t: "Unit tests with mocks.",
        why: "Mocks don't exercise the real running app." }
    ],
    answer: [0],
    tip: "SAST = code; SCA = dependencies; DAST = running app in staging (OWASP ZAP)."
  },
  {
    id: "tp-20", domain: "d1", topic: "Testing in Pipelines",
    q: "A team wants to order pipeline checks so problems are found as early and cheaply as possible. Which order is BEST?",
    options: [
      { t: "Build stage: unit tests, lint, SAST, SCA and IaC scans in parallel; then integration tests in a test environment; then load and DAST in staging; then a gradual production release with alarms.",
        why: "Correct. Fast, cheap checks run first (fail fast), slower tests later in production-like environments." },
      { t: "Load tests first, then unit tests.",
        why: "Load tests are slow and expensive; running them before cheap tests wastes time on broken builds." },
      { t: "Deploy to production first, then run all tests.",
        why: "Customers would find the bugs." },
      { t: "Run everything in one sequential action.",
        why: "Slow and hard to see which check failed." }
    ],
    answer: [0],
    tip: "Shift left, fail fast: cheap checks early and in parallel; expensive tests later."
  },
  {
    id: "tp-21", domain: "d1", topic: "Testing in Pipelines",
    q: "A mobile app team wants automated UI tests on many real Android and iOS devices as a stage in CodePipeline. Which service fits?",
    options: [
      { t: "AWS Device Farm, using its CodePipeline test action.",
        why: "Correct. Device Farm runs tests on real devices and desktop browsers and integrates as a pipeline test action." },
      { t: "CloudWatch Synthetics.",
        why: "Synthetics checks web endpoints and pages, not native mobile apps on devices." },
      { t: "AWS FIS.",
        why: "FIS injects infrastructure faults." },
      { t: "Amazon Inspector.",
        why: "Inspector scans for vulnerabilities." }
    ],
    answer: [0],
    tip: "Real devices / browsers in a pipeline → AWS Device Farm test action."
  },
  {
    id: "tp-22", domain: "d1", topic: "Testing in Pipelines",
    q: "Integration tests in the test account need realistic data, but company policy forbids customer personal data outside production. What should the team do?",
    options: [
      { t: "Use masked or synthetic data, for example a restored snapshot that has been anonymised, in a separate test account.",
        why: "Correct. Separate accounts plus masked or synthetic data give realistic tests without exposing real personal data." },
      { t: "Point the tests at the production database read replica.",
        why: "Still uses real customer data and risks production." },
      { t: "Copy the production database unchanged to test.",
        why: "Breaks the policy." },
      { t: "Skip integration tests.",
        why: "Loses important test coverage." }
    ],
    answer: [0],
    tip: "Test data → separate accounts + masked / synthetic data, never real PII."
  },

  // ───────────────────────────── EC2 Image Builder ─────────────────────────────
  {
    id: "ib-01", domain: "d1", topic: "EC2 Image Builder",
    q: "A company wants every EC2 fleet to launch from a hardened, fully patched AMI that is rebuilt and tested automatically, with the LEAST operational overhead. What should the DevOps engineer use?",
    options: [
      { t: "An EC2 Image Builder pipeline with the update-linux component, hardening components, image tests and a schedule.",
        why: "Correct. Image Builder is a managed service that builds, tests, scans and distributes AMIs on a schedule, with no build servers to maintain." },
      { t: "Packer running on a self-managed Jenkins server.",
        why: "Works, but you maintain Jenkins, Packer templates and scripts yourself." },
      { t: "Launch an instance monthly, patch it manually and create an image.",
        why: "Manual, slow and not repeatable." },
      { t: "Install patches with user data on every instance at boot.",
        why: "Slows every launch and leads to inconsistent instances." }
    ],
    answer: [0],
    tip: "Golden AMI, least overhead → EC2 Image Builder pipeline."
  },
  {
    id: "ib-02", domain: "d1", topic: "EC2 Image Builder",
    q: "An Image Builder pipeline fails shortly after the build instance launches. No component logs appear. The instance runs in a private subnet without a NAT gateway, and its instance profile has only S3 read permissions. What should be fixed? (Choose TWO.)",
    multi: true,
    options: [
      { t: "Add AmazonSSMManagedInstanceCore and EC2InstanceProfileForImageBuilder to the instance profile role.",
        why: "Correct. Image Builder runs components through Systems Manager, so the instance must be able to register with SSM." },
      { t: "Give the subnet a route to SSM and S3, using a NAT gateway or VPC endpoints (ssm, ssmmessages, ec2messages, S3 gateway).",
        why: "Correct. Without network access to the SSM endpoints and S3, the instance can't receive commands or download components." },
      { t: "Open inbound port 22 in the security group.",
        why: "Image Builder doesn't use SSH." },
      { t: "Add a key pair to the infrastructure configuration.",
        why: "A key pair isn't needed because Systems Manager is used." },
      { t: "Increase the instance type.",
        why: "Size doesn't fix missing permissions or network routes." }
    ],
    answer: [0, 1],
    tip: "Build fails early, no logs → instance profile (SSM core + EC2InstanceProfileForImageBuilder) and route to SSM/S3."
  },
  {
    id: "ib-03", domain: "d1", topic: "EC2 Image Builder",
    q: "Image builds keep failing in a custom component, and by the time engineers look, the build instance has been terminated. How can they investigate the failed instance directly?",
    options: [
      { t: "Set terminateInstanceOnFailure to false in the infrastructure configuration, then connect with Session Manager after a failure.",
        why: "Correct. The failed build instance stays running for troubleshooting. Remember to terminate it afterwards." },
      { t: "Turn on termination protection on the parent AMI.",
        why: "AMIs don't have termination protection, and it wouldn't affect build instances." },
      { t: "Increase the pipeline timeout.",
        why: "The instance would still be terminated after the failure." },
      { t: "Enable enhanced metadata collection.",
        why: "This collects package inventory, not keeping failed instances." }
    ],
    answer: [0],
    tip: "Keep failed build instance → terminateInstanceOnFailure: false (+ CloudWatch/S3 logs)."
  },
  {
    id: "ib-04", domain: "d1", topic: "EC2 Image Builder",
    q: "A component must verify that the nginx service starts correctly when an instance boots from the new AMI. In which phase should this check be written?",
    options: [
      { t: "The test phase, which runs on a new instance launched from the new AMI.",
        why: "Correct. Only the test phase proves the image works from a fresh boot." },
      { t: "The validate phase.",
        why: "validate runs on the build instance before the AMI is created, so it doesn't prove boot behaviour." },
      { t: "The build phase.",
        why: "build installs and configures software; it isn't a fresh boot from the image." },
      { t: "The distribution configuration.",
        why: "Distribution copies and shares the image; it doesn't run tests." }
    ],
    answer: [0],
    tip: "validate = build instance (before AMI); test = new instance from new AMI."
  },
  {
    id: "ib-05", domain: "d1", topic: "EC2 Image Builder",
    q: "An Image Builder pipeline runs every Sunday and creates a new AMI even when nothing has changed, wasting money and creating many identical images. The team wants a new image only when the parent image or a component has a newer version. What should they configure?",
    options: [
      { t: "Set the schedule start condition to EXPRESSION_MATCH_AND_DEPENDENCY_UPDATES_AVAILABLE.",
        why: "Correct. The pipeline then builds on schedule only when dependencies (parent image or components) have updates." },
      { t: "Set the start condition to EXPRESSION_MATCH_ONLY.",
        why: "This builds on every scheduled run, which is the current behaviour." },
      { t: "Delete the schedule and run manually.",
        why: "Removes automation and someone must remember to check for updates." },
      { t: "Use an image lifecycle policy.",
        why: "Lifecycle policies clean up old images; they don't decide when to build." }
    ],
    answer: [0],
    tip: "Build only when something changed → EXPRESSION_MATCH_AND_DEPENDENCY_UPDATES_AVAILABLE."
  },
  {
    id: "ib-06", domain: "d1", topic: "EC2 Image Builder",
    q: "A recipe uses a hard-coded Amazon Linux 2023 AMI ID as its parent, so images are built on an outdated base. How should the recipe always use the newest Amazon Linux 2023 image?",
    options: [
      { t: "Use the AWS-managed Amazon Linux 2023 parent image with a version filter of x.x.x (or the public SSM parameter for the latest AMI).",
        why: "Correct. The pipeline resolves the newest parent image at each build." },
      { t: "Edit the recipe's parent AMI ID by hand every month.",
        why: "Manual and error-prone. Recipes are immutable, so each edit means a new recipe version anyway." },
      { t: "Run yum update in user data.",
        why: "Patches instances at boot instead of baking a current base." },
      { t: "Copy the latest AMI into the account weekly with a Lambda function.",
        why: "Unnecessary custom work." }
    ],
    answer: [0],
    tip: "Latest base image → AWS-managed parent with x.x.x, or /aws/service/ami-amazon-linux-latest SSM parameter."
  },
  {
    id: "ib-07", domain: "d1", topic: "EC2 Image Builder",
    q: "Many CloudFormation stacks hard-code AMI IDs, and teams forget to update them after new golden AMIs are built. What is the BEST way for stacks to always use the latest approved AMI?",
    options: [
      { t: "Have Image Builder distribution write the new AMI ID to an SSM parameter, and use a parameter of type AWS::SSM::Parameter::Value<AWS::EC2::Image::Id> in the templates.",
        why: "Correct. Templates resolve the current AMI ID from Parameter Store at deploy time, with no template edits." },
      { t: "Email the new AMI ID to all teams.",
        why: "Manual and easy to miss." },
      { t: "Store the AMI ID in the AMI name.",
        why: "Templates still need the ID." },
      { t: "Use the Mappings section with the AMI IDs.",
        why: "Mappings are static and must be edited for every new AMI." }
    ],
    answer: [0],
    tip: "Latest AMI in CloudFormation → SSM parameter (written by distribution) + AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>."
  },
  {
    id: "ib-08", domain: "d1", topic: "EC2 Image Builder",
    q: "When a new golden AMI is ready, the instances in a production Auto Scaling group must be replaced automatically, a few at a time, with rollback if CloudWatch alarms fire. Which solution meets this?",
    options: [
      { t: "An EventBridge rule on the Image Builder image state change (AVAILABLE) invokes a Lambda function that updates the launch template and starts an Auto Scaling instance refresh with a minimum healthy percentage and alarm-based rollback.",
        why: "Correct. Event-driven automation plus instance refresh gives a gradual, safe replacement." },
      { t: "Terminate all instances so the ASG launches new ones.",
        why: "Causes an outage." },
      { t: "Use Patch Manager to patch the running instances.",
        why: "That patches in place instead of using the new image." },
      { t: "Reboot the instances.",
        why: "Rebooting doesn't change the AMI." }
    ],
    answer: [0],
    tip: "New AMI rollout → EventBridge AVAILABLE → update launch template → ASG instance refresh."
  },
  {
    id: "ib-09", domain: "d1", topic: "EC2 Image Builder",
    q: "A golden AMI encrypted with a KMS key is shared from the shared-services account to a workload account. Launches in the workload account's Auto Scaling group fail. What is the MOST likely fix?",
    options: [
      { t: "Encrypt the AMI with a customer managed KMS key whose key policy allows the workload account and its Auto Scaling service-linked role to use the key.",
        why: "Correct. Encrypted shared AMIs need key access in the target account. AWS-managed default keys can't be shared." },
      { t: "Make the AMI public.",
        why: "Insecure, and encrypted AMIs can't be public anyway." },
      { t: "Add launch permission for the workload account only.",
        why: "Launch permission is needed but not enough without access to the KMS key." },
      { t: "Disable encryption on the AMI.",
        why: "Breaks security requirements." }
    ],
    answer: [0],
    tip: "Cross-account encrypted AMI → customer managed KMS key + key policy for target account and ASG service-linked role."
  },
  {
    id: "ib-10", domain: "d1", topic: "EC2 Image Builder",
    q: "An organization needs each new golden AMI copied to three Regions and made available to all accounts in its Production OU. What is the simplest approach?",
    options: [
      { t: "Configure the Image Builder distribution configuration with the three Regions and launch permissions for the Production OU.",
        why: "Correct. Distribution handles multi-Region copies and sharing with accounts, organizations or OUs." },
      { t: "Run a Lambda function that copies and shares each AMI after every build.",
        why: "Custom code for something distribution already does." },
      { t: "Build a separate pipeline in every Region and account.",
        why: "Duplicates work and risks different images." },
      { t: "Use S3 Cross-Region Replication.",
        why: "AMIs aren't copied with S3 replication." }
    ],
    answer: [0],
    tip: "Multi-Region + multi-account AMIs → distribution configuration (Regions, accounts/OUs)."
  },
  {
    id: "ib-11", domain: "d1", topic: "EC2 Image Builder",
    q: "After a year of weekly builds, the account has hundreds of old AMIs and EBS snapshots. The team wants to keep the last 5 images, deprecate older ones, and delete them after 60 days, except images tagged release=prod. What should they use?",
    options: [
      { t: "An EC2 Image Builder image lifecycle policy with count and age rules and an exclusion rule for the tag.",
        why: "Correct. Lifecycle policies deprecate, disable and delete AMIs and their snapshots automatically." },
      { t: "Amazon Data Lifecycle Manager for EBS volumes.",
        why: "DLM automates snapshots and AMIs that its own policies create from instances. For images built by Image Builder, lifecycle policies are the built-in way to apply these rules." },
      { t: "An S3 lifecycle rule.",
        why: "AMIs aren't S3 objects you manage." },
      { t: "Delete images manually each quarter.",
        why: "Manual and error-prone." }
    ],
    answer: [0],
    tip: "Old images/snapshots piling up → Image Builder lifecycle policies (count/age/tags, exclusions)."
  },
  {
    id: "ib-12", domain: "d1", topic: "EC2 Image Builder",
    q: "A security team must review each new image's Inspector findings and approve it before it is distributed to other accounts. How can this be done inside Image Builder?",
    options: [
      { t: "Use an Image Builder workflow with a WaitForAction step that pauses the build until an approval signal resumes it.",
        why: "Correct. WaitForAction pauses the workflow until a Lambda function or person sends the resume signal." },
      { t: "Set terminateInstanceOnFailure to false.",
        why: "This only keeps failed build instances." },
      { t: "Add a validate phase that sleeps for a day.",
        why: "Sleeping isn't approval and wastes instance time." },
      { t: "Turn on enhanced metadata collection.",
        why: "Collects inventory; doesn't pause for approval." }
    ],
    answer: [0],
    tip: "Approval gate inside Image Builder → workflow WaitForAction (or CodePipeline manual approval outside)."
  },
  {
    id: "ib-13", domain: "d1", topic: "EC2 Image Builder",
    q: "A bug is found in version 1.2.0 of a custom Image Builder component. An engineer wants to edit 1.2.0 in place. What is the correct approach?",
    options: [
      { t: "Create component version 1.2.1 with the fix, create a new recipe version that uses it, and update the pipeline.",
        why: "Correct. Components and recipes are immutable; changes require new versions." },
      { t: "Edit the component document in the console and save.",
        why: "Existing component versions can't be edited." },
      { t: "Delete 1.2.0 and create 1.2.0 again.",
        why: "Version reuse is confusing for traceability and recipes still reference the old one." },
      { t: "Override the component with user data.",
        why: "Doesn't fix the component and makes builds inconsistent." }
    ],
    answer: [0],
    tip: "Components and recipes are immutable → new semantic version + new recipe version."
  },
  {
    id: "ib-14", domain: "d1", topic: "EC2 Image Builder",
    q: "A company wants to automatically know which golden AMIs contain critical vulnerabilities, both at build time and when new CVEs are published later. What should they enable?",
    options: [
      { t: "Image scanning with Amazon Inspector in the Image Builder pipeline, plus Inspector continuous scanning of running EC2 instances.",
        why: "Correct. Image Builder shows Inspector findings per image, and Inspector keeps scanning instances as new CVEs appear, so you know when to rebuild." },
      { t: "AWS Config approved-amis-by-id only.",
        why: "This checks which AMIs instances use, not vulnerabilities." },
      { t: "GuardDuty.",
        why: "GuardDuty detects threats, not package vulnerabilities." },
      { t: "CloudTrail.",
        why: "CloudTrail records API activity." }
    ],
    answer: [0],
    tip: "Image vulnerabilities → Inspector scanning in Image Builder + continuous instance scanning."
  },
  {
    id: "ib-15", domain: "d1", topic: "EC2 Image Builder",
    q: "A company must make sure all EC2 instances in its accounts run only approved golden AMIs, and wants non-compliant instances reported. What should they use?",
    options: [
      { t: "AWS Config rules such as approved-amis-by-tag (or approved-amis-by-id).",
        why: "Correct. Config evaluates instances against approved AMIs and reports non-compliance; remediation can be automated." },
      { t: "An Image Builder lifecycle policy.",
        why: "Lifecycle policies manage images, not instance compliance." },
      { t: "Systems Manager Patch Manager.",
        why: "Patches instances; doesn't check their AMI source." },
      { t: "EC2 Image Builder distribution.",
        why: "Distributes images; doesn't audit instances." }
    ],
    answer: [0],
    tip: "Enforce/report approved AMIs → AWS Config approved-amis-by-tag / by-id."
  },
  {
    id: "ib-16", domain: "d1", topic: "EC2 Image Builder",
    q: "A team wants Image Builder to set the new AMI as the default version of an existing launch template used by an Auto Scaling group in another account, without writing code. What should they configure?",
    options: [
      { t: "A launch template configuration in the Image Builder distribution configuration, targeting the launch template in that account and setting the new version as default.",
        why: "Correct. Distribution can update launch templates in the same or other accounts." },
      { t: "Edit the launch template manually after each build.",
        why: "Manual work the distribution configuration can do." },
      { t: "Use an Image Builder component that calls the EC2 API.",
        why: "Components run on the build instance and aren't meant for distribution." },
      { t: "Use AWS Config remediation.",
        why: "Config isn't designed to update launch templates on new images." }
    ],
    answer: [0],
    tip: "Distribution can update launch templates (default version) and SSM parameters automatically."
  },
  {
    id: "ib-17", domain: "d1", topic: "EC2 Image Builder",
    q: "An application release requires a new AMI. The team's CodePipeline should start an Image Builder build after the build stage and continue only when the image is available. What is a suitable design?",
    options: [
      { t: "A pipeline action (CodeBuild or Lambda) calls StartImagePipelineExecution, and the next steps react to the EventBridge image state change (AVAILABLE) or poll GetImage before deploying.",
        why: "Correct. Image Builder is started through its API, and its state change events (or status checks) signal when the image is ready." },
      { t: "Use the CodeDeploy agent to build the AMI.",
        why: "CodeDeploy deploys applications; it doesn't build AMIs." },
      { t: "Use a CloudFormation drift check.",
        why: "Drift detection isn't related to image builds." },
      { t: "Image Builder can only run on a schedule.",
        why: "It can also run manually or through the API." }
    ],
    answer: [0],
    tip: "Trigger builds via StartImagePipelineExecution; react to EventBridge Image State Change."
  },
  {
    id: "ib-18", domain: "d1", topic: "EC2 Image Builder",
    q: "A company runs some long-lived EC2 instances that can't be replaced easily, and Auto Scaling fleets that follow immutable infrastructure. How should patching be handled for each?",
    options: [
      { t: "Use Systems Manager Patch Manager for the long-lived instances, and Image Builder golden AMIs with instance refresh for the Auto Scaling fleets.",
        why: "Correct. Patch Manager patches in place; immutable fleets get new patched images and replace instances." },
      { t: "Use Patch Manager for everything.",
        why: "Patching ASG instances in place leads to drift; new instances would still launch from the old AMI." },
      { t: "Use Image Builder for everything, including instances that can't be replaced.",
        why: "A new image doesn't help an instance that can't be replaced." },
      { t: "Disable patching for long-lived instances.",
        why: "Insecure." }
    ],
    answer: [0],
    tip: "Patch Manager = in place; Image Builder + replacement = immutable."
  },
  {
    id: "ib-19", domain: "d1", topic: "EC2 Image Builder",
    q: "A team stores a database password in a file during the Image Builder build so the application can start faster. A security review flags this. What is the correct practice?",
    options: [
      { t: "Don't bake secrets into AMIs; have the application fetch the password at runtime from Secrets Manager or Parameter Store using the instance role.",
        why: "Correct. Anyone who can launch or copy the AMI could read baked-in secrets, and rotation would need new images." },
      { t: "Encrypt the AMI with KMS and keep the password in it.",
        why: "Anyone allowed to launch the AMI can still read the file." },
      { t: "Delete the file in the validate phase.",
        why: "If the file is created in build, deleting it later is error-prone and the secret may remain in logs or snapshots." },
      { t: "Store the password in the recipe description.",
        why: "Exposes it in the console and API." }
    ],
    answer: [0],
    tip: "Never bake secrets → fetch at runtime (Secrets Manager / Parameter Store)."
  },
  {
    id: "ib-20", domain: "d1", topic: "EC2 Image Builder",
    q: "A team wants to use the same Image Builder components to produce a hardened Docker base image and push it to Amazon ECR in two Regions. Is this possible, and how?",
    options: [
      { t: "Yes. Create a container recipe with the parent Docker image, components and a Dockerfile template, and a distribution configuration targeting ECR repositories in both Regions.",
        why: "Correct. Image Builder builds container images as well as AMIs." },
      { t: "No. Image Builder only builds AMIs.",
        why: "It supports container recipes too." },
      { t: "Yes, but only by exporting an AMI to S3 and importing it into ECR.",
        why: "Not how container images are built." },
      { t: "Only with Packer.",
        why: "Image Builder handles it natively." }
    ],
    answer: [0],
    tip: "Image Builder container recipe → hardened Docker images to ECR (multi-Region)."
  },
  {
    id: "ib-21", domain: "d1", topic: "EC2 Image Builder",
    q: "A security policy forbids Image Builder build instances from reaching the internet. The build installs OS updates and application packages. How can builds still work?",
    options: [
      { t: "Run builds in private subnets with VPC endpoints for SSM, ssmmessages, ec2messages and S3, and use internal package mirrors or CodeArtifact for packages.",
        why: "Correct. Image Builder needs SSM and S3 access, and packages can come from private repositories without internet access." },
      { t: "Give the build instances public IPs.",
        why: "Breaks the policy." },
      { t: "Open inbound SSH from the corporate network.",
        why: "Inbound access isn't the issue; outbound access to services is." },
      { t: "Image Builder needs internet access in all cases.",
        why: "Endpoints and private repositories remove that need." }
    ],
    answer: [0],
    tip: "No internet for builds → VPC endpoints (SSM ×3, S3) + internal repos (CodeArtifact / mirrors)."
  },
  {
    id: "ib-22", domain: "d1", topic: "EC2 Image Builder",
    q: "A team wants the AMI built and its ID available to other resources during the same CloudFormation stack creation. Which resource should they use?",
    options: [
      { t: "AWS::ImageBuilder::Image, then reference Fn::GetAtt Image.ImageId in the launch template.",
        why: "Correct. The Image resource builds an image during stack operations and exposes the AMI ID as an attribute." },
      { t: "AWS::ImageBuilder::ImagePipeline only.",
        why: "A pipeline resource defines the pipeline but doesn't produce an image during stack creation by itself." },
      { t: "AWS::EC2::Image.",
        why: "There is no such CloudFormation resource for building AMIs." },
      { t: "AWS::SSM::Document.",
        why: "Defines SSM documents, not images." }
    ],
    answer: [0],
    tip: "Build an AMI inside a CloudFormation stack → AWS::ImageBuilder::Image (GetAtt ImageId)."
  },

  // ───────────────────────────── Domain 2: CloudFormation Core ─────────────────────────────
  {
    id: "cfn-01", domain: "d2", topic: "CloudFormation Core",
    q: "A CloudFormation template launches EC2 instances in many Regions using a Mappings section of AMI IDs per Region. The AMIs quickly become outdated. The team wants every stack create and update to use the newest Amazon Linux 2023 AMI without editing the template. What should they do?",
    options: [
      { t: "Use a parameter of type AWS::SSM::Parameter::Value<AWS::EC2::Image::Id> with the public parameter /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 as the default.",
        why: "Correct. CloudFormation reads the SSM parameter at every create and update, so the newest AMI is used in every Region with no template change." },
      { t: "Add a Lambda-backed custom resource that searches for the newest AMI.",
        why: "Works, but it's custom code. The SSM parameter type is built in." },
      { t: "Update the Mappings section every month.",
        why: "Manual and error-prone." },
      { t: "Use Fn::GetAZs to choose the AMI.",
        why: "GetAZs returns Availability Zones, not AMIs." }
    ],
    answer: [0],
    tip: "Latest AMI without editing templates → SSM parameter type AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>."
  },
  {
    id: "cfn-02", domain: "d2", topic: "CloudFormation Core",
    q: "A template has an optional KeyName parameter that defaults to an empty string. When it's empty, the EC2 instance must be created with no key pair at all. How should the KeyName property be written?",
    options: [
      { t: "Create a condition HasKey (KeyName not equal to \"\") and set KeyName: !If [HasKey, !Ref KeyName, !Ref \"AWS::NoValue\"].",
        why: "Correct. AWS::NoValue removes the property completely when the condition is false." },
      { t: "Set KeyName: !Ref KeyName and leave it empty.",
        why: "An empty string is an invalid key name, so the stack fails." },
      { t: "Put the condition inside the Mappings section.",
        why: "Mappings hold literal values only and can't contain conditions." },
      { t: "Use DependsOn to skip the property.",
        why: "DependsOn controls order, not properties." }
    ],
    answer: [0],
    tip: "Optional property → Fn::If with AWS::NoValue."
  },
  {
    id: "cfn-03", domain: "d2", topic: "CloudFormation Core",
    q: "A network stack in us-east-1 exports its VPC ID. A new application stack in eu-west-1 uses Fn::ImportValue to read it, but the stack fails. What is the reason and a valid alternative?",
    options: [
      { t: "Exports can only be imported in the same account and Region. Store the value in SSM Parameter Store in eu-west-1 (or pass it as a parameter, or use a custom resource) instead.",
        why: "Correct. Cross-stack references are Region-scoped, so another mechanism is needed across Regions." },
      { t: "The export name must include the Region.",
        why: "The name isn't the problem; imports never work across Regions." },
      { t: "The importing stack needs CAPABILITY_AUTO_EXPAND.",
        why: "Capabilities don't enable cross-Region imports." },
      { t: "Use Fn::GetAtt on the network stack.",
        why: "GetAtt works on resources in the same template (or nested stack outputs), not other stacks in other Regions." }
    ],
    answer: [0],
    tip: "ImportValue = same account + same Region only."
  },
  {
    id: "cfn-04", domain: "d2", topic: "CloudFormation Core",
    q: "A team tries to update a network stack to rename one of its exports. The update fails with 'Export ... cannot be updated as it is in use by app-stack'. What must they do?",
    options: [
      { t: "Update the importing stacks to stop using the export first, then change the export.",
        why: "Correct. An export can't be changed or deleted while another stack imports it." },
      { t: "Add a DeletionPolicy of Retain to the export.",
        why: "DeletionPolicy applies to resources, not exports." },
      { t: "Use the --force flag on update-stack.",
        why: "There is no force option to bypass this rule." },
      { t: "Delete the network stack and recreate it.",
        why: "The stack can't be deleted either while its exports are imported." }
    ],
    answer: [0],
    tip: "Exports in use are locked → remove imports first."
  },
  {
    id: "cfn-05", domain: "d2", topic: "CloudFormation Core",
    q: "A template takes a database password as a String parameter with NoEcho: true. A security review finds the password in plain text in the console. The template outputs a connection string built with the password. What is the BEST fix?",
    options: [
      { t: "Store the password in Secrets Manager, reference it with {{resolve:secretsmanager:...}} in the DB properties, and remove it from Outputs.",
        why: "Correct. NoEcho only masks describe calls; Outputs show the value. Dynamic references keep the secret out of the template, parameters and outputs." },
      { t: "Add NoEcho to the output.",
        why: "Outputs don't support NoEcho." },
      { t: "Encrypt the template file with KMS.",
        why: "The value is still shown by the stack." },
      { t: "Move the password into Mappings.",
        why: "Mappings are plain text in the template." }
    ],
    answer: [0],
    tip: "NoEcho masks describe calls only → use Secrets Manager dynamic references; never output secrets."
  },
  {
    id: "cfn-06", domain: "d2", topic: "CloudFormation Core",
    q: "A developer writes Mappings with a value of !Ref InstanceTypeParam so the mapping follows a parameter. The template fails validation. Why?",
    options: [
      { t: "Mapping values must be literal values; intrinsic functions and parameter references aren't allowed inside Mappings.",
        why: "Correct. Only the lookup keys passed to FindInMap can come from Ref." },
      { t: "Mappings must have three levels.",
        why: "Mappings have exactly two levels of keys." },
      { t: "Ref must be written as Fn::Ref.",
        why: "The long form is Ref; either way it isn't allowed in Mappings." },
      { t: "Mappings need the AWS::LanguageExtensions transform for Ref.",
        why: "The transform adds DefaultValue to FindInMap, not Ref inside mapping values." }
    ],
    answer: [0],
    tip: "Mappings = literals only; FindInMap keys can use Ref."
  },
  {
    id: "cfn-07", domain: "d2", topic: "CloudFormation Core",
    q: "A template must create a CloudWatch alarm only when a resource named PrimaryDb has been created successfully. The engineer writes a condition using !GetAtt PrimaryDb.Endpoint.Address. The template fails. Why, and what is the right approach?",
    options: [
      { t: "Conditions can't reference resources. Base the condition on a parameter (for example CreateDb) used by both the database and the alarm.",
        why: "Correct. Conditions are evaluated before resources exist and can use only parameters, mappings, pseudo parameters and other conditions." },
      { t: "Use Fn::Sub instead of GetAtt in the condition.",
        why: "Any reference to a resource is invalid in conditions." },
      { t: "Add DependsOn to the condition.",
        why: "Conditions don't support DependsOn." },
      { t: "Move the condition into Outputs.",
        why: "Outputs can use conditions but still can't define them from resources." }
    ],
    answer: [0],
    tip: "Conditions: parameters, mappings, pseudo parameters, other conditions — never resources."
  },
  {
    id: "cfn-08", domain: "d2", topic: "CloudFormation Core",
    q: "A template's UserData uses !Sub and includes the bash line 'echo $HOME'. After deployment, the script didn't write the expected value because CloudFormation treated it as a variable. How should the line be written?",
    options: [
      { t: "echo ${!HOME}",
        why: "Correct. ${!Name} tells Fn::Sub to write a literal ${Name} instead of substituting it." },
      { t: "echo \\$HOME",
        why: "Backslash escaping isn't how Fn::Sub escapes variables." },
      { t: "Use Fn::Join instead of Base64.",
        why: "Base64 is still needed for UserData; the issue is Sub escaping." },
      { t: "Put HOME in Mappings.",
        why: "HOME is a shell variable on the instance, not a template value." }
    ],
    answer: [0],
    tip: "Literal ${VAR} inside Fn::Sub → ${!VAR}."
  },
  {
    id: "cfn-09", domain: "d2", topic: "CloudFormation Core",
    q: "A company deploys the same template in commercial, China and GovCloud Regions. Resources fail in China because IAM policies contain 'arn:aws:s3:::'. How should ARNs be written?",
    options: [
      { t: "Use !Sub \"arn:${AWS::Partition}:s3:::${Bucket}/*\".",
        why: "Correct. AWS::Partition returns aws, aws-cn or aws-us-gov, making ARNs portable." },
      { t: "Use a separate template per partition.",
        why: "Duplicates work; pseudo parameters solve it." },
      { t: "Use AWS::Region in the ARN prefix.",
        why: "The Region isn't the partition." },
      { t: "Use AWS::URLSuffix in the ARN.",
        why: "URLSuffix is for service URLs (amazonaws.com), not ARN partitions." }
    ],
    answer: [0],
    tip: "Portable ARNs → ${AWS::Partition} (plus AccountId, Region)."
  },
  {
    id: "cfn-10", domain: "d2", topic: "CloudFormation Core",
    q: "A template must reject a stack creation when Environment is prod and InstanceType is not m5.large or larger, BEFORE any resource is created. What should be used?",
    options: [
      { t: "A Rules section with a RuleCondition for prod and an Assertion on InstanceType.",
        why: "Correct. Rules validate parameter combinations before CloudFormation creates or changes anything." },
      { t: "AllowedValues on InstanceType.",
        why: "AllowedValues can't depend on another parameter's value." },
      { t: "A Condition that skips the instance in prod.",
        why: "This silently skips the resource instead of rejecting the request." },
      { t: "A Lambda function in the stack that fails.",
        why: "It would run after other resources start creating." }
    ],
    answer: [0],
    tip: "Validate parameter combinations up front → Rules section with assertions."
  },
  {
    id: "cfn-11", domain: "d2", topic: "CloudFormation Core",
    q: "An engineer needs the ARN of an S3 bucket created in the same template for an IAM policy. They write !Ref LogBucket and the policy is invalid. Why?",
    options: [
      { t: "Ref on an S3 bucket returns the bucket name; use !GetAtt LogBucket.Arn (or build it with !Sub).",
        why: "Correct. Ref returns the physical ID for most resources; GetAtt returns attributes such as the ARN." },
      { t: "Ref only works on parameters.",
        why: "Ref works on both parameters and resources." },
      { t: "The bucket needs an explicit DependsOn.",
        why: "Ref already creates an implicit dependency; the issue is the returned value." },
      { t: "Use Fn::ImportValue LogBucket.",
        why: "ImportValue reads exports from other stacks." }
    ],
    answer: [0],
    tip: "Ref = physical ID (bucket name); GetAtt = attributes (Arn, DNSName...)."
  },
  {
    id: "cfn-12", domain: "d2", topic: "CloudFormation Core",
    q: "A pipeline runs aws cloudformation validate-template successfully, but deployment fails with 'Encountered unsupported property InstanceTyp'. How can the team catch such errors before deployment?",
    options: [
      { t: "Run cfn-lint in the pipeline, which checks resource properties and values against the CloudFormation specification.",
        why: "Correct. validate-template only checks syntax; cfn-lint catches invalid property names and values." },
      { t: "Run validate-template twice.",
        why: "It still only checks syntax." },
      { t: "Use cfn-guard only.",
        why: "cfn-guard checks your policy rules, not every property name." },
      { t: "Enable termination protection.",
        why: "Unrelated to validation." }
    ],
    answer: [0],
    tip: "validate-template = syntax only → cfn-lint for properties; cfn-guard for policies."
  },
  {
    id: "cfn-13", domain: "d2", topic: "CloudFormation Core",
    q: "A template is 90 KB. Running create-stack with --template-body fails with a size error. What is the correct approach?",
    options: [
      { t: "Upload the template to S3 and use --template-url (up to 1 MB), or use aws cloudformation package and deploy with an S3 bucket.",
        why: "Correct. Templates passed directly are limited to 51,200 bytes; from S3 the limit is 1 MB." },
      { t: "Compress the template with gzip.",
        why: "CloudFormation doesn't accept compressed template bodies." },
      { t: "Split it into Mappings.",
        why: "Mappings are part of the same template size." },
      { t: "Request a service quota increase.",
        why: "Using S3 is the intended method." }
    ],
    answer: [0],
    tip: "Template size: 51,200 bytes direct, 1 MB via S3."
  },
  {
    id: "cfn-14", domain: "d2", topic: "CloudFormation Core",
    q: "A stack defines an S3 bucket with BucketName: company-app-logs. A later change to a property requiring replacement fails, and the team also can't deploy the same template to a second environment in the same Region. What is the cause and best practice?",
    options: [
      { t: "The fixed custom name prevents CloudFormation from creating the replacement or a second copy. Let CloudFormation generate names, or include ${AWS::StackName} / ${AWS::Region} in names.",
        why: "Correct. Resource names must be unique, so a fixed name blocks replacement updates and reuse of the template." },
      { t: "S3 buckets can't be updated by CloudFormation.",
        why: "They can; the custom name is the problem." },
      { t: "The stack needs CAPABILITY_NAMED_IAM.",
        why: "That capability is for IAM resources with custom names." },
      { t: "Add a DependsOn to the bucket.",
        why: "Ordering doesn't fix name conflicts." }
    ],
    answer: [0],
    tip: "Custom names block replacement and duplicates → generated names or include stack name/Region."
  },
  {
    id: "cfn-15", domain: "d2", topic: "CloudFormation Core",
    q: "Creating a stack fails with 'Requires capabilities: [CAPABILITY_NAMED_IAM]'. The template creates an IAM role with a RoleName property. What should be done?",
    options: [
      { t: "Acknowledge the capability by passing --capabilities CAPABILITY_NAMED_IAM (or remove the custom RoleName and use CAPABILITY_IAM).",
        why: "Correct. IAM resources need explicit acknowledgment; custom names need the NAMED variant." },
      { t: "Pass CAPABILITY_AUTO_EXPAND.",
        why: "That's for macros and nested transforms." },
      { t: "Give the stack a service role with AdministratorAccess.",
        why: "Permissions don't replace the capability acknowledgment." },
      { t: "Remove the IAM role from the template.",
        why: "Unnecessary; acknowledging the capability fixes it." }
    ],
    answer: [0],
    tip: "IAM → CAPABILITY_IAM; named IAM → CAPABILITY_NAMED_IAM; macros → CAPABILITY_AUTO_EXPAND."
  },
  {
    id: "cfn-16", domain: "d2", topic: "CloudFormation Core",
    q: "A template must create a read replica only in production stacks in us-east-1. Which approach is correct?",
    options: [
      { t: "Define a condition with !And [!Equals [!Ref Environment, prod], !Equals [!Ref \"AWS::Region\", us-east-1]] and set Condition on the replica resource (and any outputs that reference it).",
        why: "Correct. Conditions combine parameters and pseudo parameters, and resources or outputs with a false condition aren't created." },
      { t: "Use Fn::If in the Type property of the resource.",
        why: "Fn::If can't choose whether a resource exists; use the Condition attribute." },
      { t: "Use a Mappings lookup that returns true or false for the Type.",
        why: "Mappings can't decide whether resources are created." },
      { t: "Delete the replica manually in other Regions.",
        why: "Manual and causes drift." }
    ],
    answer: [0],
    tip: "Create a resource only sometimes → Condition attribute (And/Or/Equals with params + pseudo params)."
  },
  {
    id: "cfn-17", domain: "d2", topic: "CloudFormation Core",
    q: "An RDS master password must come from Secrets Manager and must never appear in the template, parameters or stack events. Which property value meets this?",
    options: [
      { t: "MasterUserPassword: '{{resolve:secretsmanager:prod/db:SecretString:password}}'",
        why: "Correct. The dynamic reference is resolved at deploy time and the value isn't shown." },
      { t: "MasterUserPassword: !Ref DbPassword with NoEcho.",
        why: "Someone must type the password, and it can leak through outputs or metadata." },
      { t: "MasterUserPassword: !FindInMap [Secrets, prod, password]",
        why: "Mappings store the password in plain text." },
      { t: "MasterUserPassword: '{{resolve:ssm:/prod/db/password}}' with a String parameter.",
        why: "A plain String parameter isn't encrypted." }
    ],
    answer: [0],
    tip: "Secrets in templates → {{resolve:secretsmanager:...}} (or RDS ManageMasterUserPassword)."
  },
  {
    id: "cfn-18", domain: "d2", topic: "CloudFormation Core",
    q: "A template is deployed in several Regions. Subnets are created with AvailabilityZone: us-east-1a and fail in other Regions. What is the portable approach?",
    options: [
      { t: "AvailabilityZone: !Select [0, !GetAZs \"\"]",
        why: "Correct. GetAZs returns the AZs of the current Region and Select picks one." },
      { t: "AvailabilityZone: !Ref AWS::Region",
        why: "A Region isn't an Availability Zone." },
      { t: "Hard-code a map of AZ names for every Region.",
        why: "Works but is more effort and can go stale." },
      { t: "Leave AvailabilityZone empty for all subnets.",
        why: "Subnets may end up in the same AZ, hurting availability." }
    ],
    answer: [0],
    tip: "Portable AZs → !Select [i, !GetAZs \"\"]."
  },
  {
    id: "cfn-19", domain: "d2", topic: "CloudFormation Core",
    q: "A team stores a database endpoint in SSM Parameter Store and wants templates to read it at deploy time. Which TWO approaches work? (Choose TWO.)",
    multi: true,
    options: [
      { t: "A parameter of type AWS::SSM::Parameter::Value<String> whose default is the parameter name.",
        why: "Correct. CloudFormation resolves the parameter value at create and update time." },
      { t: "A dynamic reference {{resolve:ssm:/app/db/endpoint}} inline in the property.",
        why: "Correct. Dynamic references read Parameter Store values inline." },
      { t: "Fn::ImportValue /app/db/endpoint",
        why: "ImportValue reads CloudFormation exports, not SSM parameters." },
      { t: "Fn::FindInMap [SSM, app, endpoint]",
        why: "Mappings are static literals in the template." },
      { t: "Fn::GetAtt SSM.Endpoint",
        why: "GetAtt reads attributes of resources in the template." }
    ],
    answer: [0, 1],
    tip: "Read Parameter Store → SSM parameter types or {{resolve:ssm:...}}."
  },
  {
    id: "cfn-20", domain: "d2", topic: "CloudFormation Core",
    q: "A template sets UserData with the YAML '!Base64 !Sub \"...\"' on one line and fails to parse. What is the fix?",
    options: [
      { t: "Use the long form outside, for example 'Fn::Base64: !Sub |' followed by the script.",
        why: "Correct. Some short forms can't be nested directly; mixing long and short forms solves it." },
      { t: "Remove Base64 because UserData doesn't need encoding.",
        why: "EC2 UserData in CloudFormation must be Base64 encoded." },
      { t: "Replace Sub with Join.",
        why: "The nesting problem remains if written the same way." },
      { t: "Store UserData in Mappings.",
        why: "Mappings can't hold functions, and UserData still needs encoding." }
    ],
    answer: [0],
    tip: "!Base64 !Sub on one line fails → Fn::Base64: !Sub |."
  },
  {
    id: "cfn-21", domain: "d2", topic: "CloudFormation Core",
    q: "A stack update changes Environment from prod to dev. A condition IsProd guards an RDS read replica resource. What happens to the replica, and how could data be protected?",
    options: [
      { t: "The condition becomes false so CloudFormation deletes the replica; set a DeletionPolicy (Retain or Snapshot) on database resources to protect data.",
        why: "Correct. Resources whose condition becomes false are deleted on update." },
      { t: "Nothing happens; conditions only apply at stack creation.",
        why: "Conditions are evaluated on every create and update." },
      { t: "The update fails automatically.",
        why: "It succeeds and removes the resource." },
      { t: "The replica is stopped but kept.",
        why: "It's deleted, not stopped." }
    ],
    answer: [0],
    tip: "Condition turns false on update → resource deleted; protect data with DeletionPolicy."
  },
  {
    id: "cfn-22", domain: "d2", topic: "CloudFormation Core",
    q: "A team wants a parameter for the VPC where resources are created, and CloudFormation should reject IDs that don't exist in the account before creating anything. Which parameter type should they use?",
    options: [
      { t: "AWS::EC2::VPC::Id",
        why: "Correct. AWS-specific parameter types are validated against existing resources and show a dropdown in the console." },
      { t: "String with AllowedPattern ^vpc-",
        why: "Checks the format only, not whether the VPC exists." },
      { t: "CommaDelimitedList",
        why: "A list type without existence validation." },
      { t: "AWS::SSM::Parameter::Value<String>",
        why: "Reads a Parameter Store value; doesn't validate VPC existence." }
    ],
    answer: [0],
    tip: "Validate real resource IDs → AWS-specific parameter types (AWS::EC2::VPC::Id, Subnet::Id...)."
  },

  // ───────────────────────────── Domain 2: CloudFormation Change Control ─────────────────────────────
  {
    id: "cfc-01", domain: "d2", topic: "CloudFormation Change Control",
    q: "Before applying a template update to a production stack, a DevOps engineer must know whether the RDS instance will be replaced. What should they do?",
    options: [
      { t: "Create a change set and check the RDS resource's Replacement field (True, False or Conditional).",
        why: "Correct. Change sets preview each resource's action and whether it will be replaced, without changing anything." },
      { t: "Run drift detection on the stack.",
        why: "Drift detection compares real resources with the current template; it doesn't preview a new template." },
      { t: "Run validate-template on the new template.",
        why: "validate-template checks syntax only." },
      { t: "Apply the update with termination protection enabled.",
        why: "Termination protection only blocks stack deletion." }
    ],
    answer: [0],
    tip: "Preview an update / will it replace? → change set (Replacement: True)."
  },
  {
    id: "cfc-02", domain: "d2", topic: "CloudFormation Change Control",
    q: "A company wants developers to propose CloudFormation changes, while only the platform lead can apply them to production, with a review in the delivery pipeline. Which CodePipeline design meets this?",
    options: [
      { t: "A CloudFormation action with CHANGE_SET_REPLACE, then a manual approval action, then a CloudFormation action with CHANGE_SET_EXECUTE.",
        why: "Correct. The change set is created for review, approved by a person, then executed." },
      { t: "A single CloudFormation action with CREATE_UPDATE.",
        why: "Applies changes directly with no review step." },
      { t: "A CloudFormation action with REPLACE_ON_FAILURE.",
        why: "This recreates failed stacks; it isn't a review process." },
      { t: "Give developers ExecuteChangeSet permissions and ask them to wait.",
        why: "Doesn't enforce the control." }
    ],
    answer: [0],
    tip: "Reviewed CloudFormation deploys → CHANGE_SET_REPLACE → manual approval → CHANGE_SET_EXECUTE."
  },
  {
    id: "cfc-03", domain: "d2", topic: "CloudFormation Change Control",
    q: "Developers should be able to create and view change sets for production stacks, but not apply them. Only the release team may apply changes. How should IAM be configured?",
    options: [
      { t: "Allow developers cloudformation:CreateChangeSet and DescribeChangeSet; allow only the release team cloudformation:ExecuteChangeSet.",
        why: "Correct. Separating create and execute permissions gives separation of duties." },
      { t: "Allow developers UpdateStack but deny DeleteStack.",
        why: "UpdateStack lets them apply changes directly." },
      { t: "Use a stack policy with Principal set to the developers' role.",
        why: "Stack policy Principal must be '*'; it can't target users." },
      { t: "Enable termination protection.",
        why: "Only blocks stack deletion." }
    ],
    answer: [0],
    tip: "Propose vs apply → IAM CreateChangeSet vs ExecuteChangeSet."
  },
  {
    id: "cfc-04", domain: "d2", topic: "CloudFormation Change Control",
    q: "A change set showed no problems, but executing it failed because an IAM permission was missing. A manager asks how this is possible. What is the correct explanation?",
    options: [
      { t: "Change sets show the intended changes only; permissions, quotas, name conflicts and invalid values are only checked during execution.",
        why: "Correct. A change set isn't a guarantee of success." },
      { t: "The change set expired after one hour.",
        why: "Change sets don't expire like that; this wasn't the cause." },
      { t: "Change sets always run with administrator permissions.",
        why: "They don't execute anything until you run them." },
      { t: "Drift detection was disabled.",
        why: "Drift detection isn't required for change sets." }
    ],
    answer: [0],
    tip: "Change set = intent only, not a success guarantee."
  },
  {
    id: "cfc-05", domain: "d2", topic: "CloudFormation Change Control",
    q: "An engineer opened port 22 to 0.0.0.0/0 on a security group managed by CloudFormation, using the EC2 console. How can the team find this, and what does CloudFormation do about it?",
    options: [
      { t: "Run drift detection; the security group shows MODIFIED with expected and actual values. The team must revert the change or update the template, because drift detection doesn't fix it.",
        why: "Correct. Drift detection finds out-of-band changes but only reports them." },
      { t: "CloudFormation reverts the change automatically within minutes.",
        why: "CloudFormation doesn't automatically revert out-of-band changes." },
      { t: "The stack policy blocks console changes.",
        why: "Stack policies only apply to CloudFormation stack updates." },
      { t: "Termination protection reports the change.",
        why: "Termination protection only blocks stack deletion." }
    ],
    answer: [0],
    tip: "Out-of-band change → drift detection (MODIFIED); it reports, you fix."
  },
  {
    id: "cfc-06", domain: "d2", topic: "CloudFormation Change Control",
    q: "A company wants every CloudFormation stack checked regularly for drift, with drifted stacks reported as non-compliant and the security team notified, with minimal custom code. What should they use?",
    options: [
      { t: "The AWS Config managed rule cloudformation-stack-drift-detection-check with SNS notifications or remediation.",
        why: "Correct. Config runs the drift check and marks drifted stacks NON_COMPLIANT." },
      { t: "Manually run drift detection every Monday.",
        why: "Manual and easy to forget." },
      { t: "A stack policy on every stack.",
        why: "Stack policies don't detect drift." },
      { t: "CloudTrail Insights.",
        why: "Insights detects unusual API call volumes, not template drift." }
    ],
    answer: [0],
    tip: "Continuous drift monitoring → Config rule cloudformation-stack-drift-detection-check."
  },
  {
    id: "cfc-07", domain: "d2", topic: "CloudFormation Change Control",
    q: "After running drift detection, several resources show NOT_CHECKED. What is the most likely reason?",
    options: [
      { t: "Those resource types don't support drift detection.",
        why: "Correct. Not every resource type supports drift detection." },
      { t: "The resources were deleted outside CloudFormation.",
        why: "Deleted resources show DELETED." },
      { t: "The resources are in sync.",
        why: "In-sync resources show IN_SYNC." },
      { t: "The stack has termination protection.",
        why: "Termination protection doesn't affect drift detection." }
    ],
    answer: [0],
    tip: "Drift statuses: IN_SYNC, MODIFIED, DELETED, NOT_CHECKED (unsupported type)."
  },
  {
    id: "cfc-08", domain: "d2", topic: "CloudFormation Change Control",
    q: "A team adds a stack policy containing a single statement that denies Update:Replace on the production database. After that, every stack update fails, even for unrelated resources. Why?",
    options: [
      { t: "Once a stack policy exists, all resources are denied by default; the policy also needs an Allow Update:* statement on '*'.",
        why: "Correct. Stack policies are default deny, so everything must be explicitly allowed first." },
      { t: "Stack policies can only contain Allow statements.",
        why: "Deny statements are allowed and take precedence." },
      { t: "The database must also have termination protection.",
        why: "Resources don't have termination protection; stacks do." },
      { t: "Stack policies block all updates for 24 hours after being applied.",
        why: "There's no such delay." }
    ],
    answer: [0],
    tip: "Stack policy = default deny once set → start with Allow Update:* on *."
  },
  {
    id: "cfc-09", domain: "d2", topic: "CloudFormation Change Control",
    q: "A stack policy denies Update:Replace on a cache cluster. During a planned maintenance window, the team must apply one update that replaces it, without permanently changing the protection. What should they do?",
    options: [
      { t: "Run the update with --stack-policy-during-update-body containing a temporary policy that allows the replacement.",
        why: "Correct. The temporary policy applies only to that update; the original policy remains afterwards." },
      { t: "Delete the stack policy, update, then add it again.",
        why: "Stack policies can't be deleted, only replaced, and this risks forgetting to restore it." },
      { t: "Disable termination protection.",
        why: "Unrelated to stack policies." },
      { t: "Use DeletionPolicy: Retain.",
        why: "Doesn't override the stack policy." }
    ],
    answer: [0],
    tip: "One-time override → --stack-policy-during-update-body."
  },
  {
    id: "cfc-10", domain: "d2", topic: "CloudFormation Change Control",
    q: "Which statement about CloudFormation stack policies is TRUE?",
    options: [
      { t: "They control which update actions (Modify, Replace, Delete) CloudFormation may perform on resources during stack updates; Principal must be '*'.",
        why: "Correct. Stack policies apply only to stack updates and can't target specific users." },
      { t: "They prevent anyone from deleting the stack.",
        why: "That's termination protection." },
      { t: "They block changes made directly in service consoles.",
        why: "Only CloudFormation updates are covered; use IAM for console changes." },
      { t: "They can be removed with delete-stack-policy.",
        why: "There's no delete; you replace the policy." }
    ],
    answer: [0],
    tip: "Stack policy: updates only, Principal '*', replace not delete, IAM controls who."
  },
  {
    id: "cfc-11", domain: "d2", topic: "CloudFormation Change Control",
    q: "A junior engineer accidentally deleted a production CloudFormation stack. The company wants to prevent this from happening again, including stopping people from simply turning the protection off. What should they do? (Choose TWO.)",
    multi: true,
    options: [
      { t: "Enable termination protection on production stacks.",
        why: "Correct. DeleteStack fails while termination protection is enabled." },
      { t: "Deny cloudformation:DeleteStack and cloudformation:UpdateTerminationProtection for most users with IAM or an SCP.",
        why: "Correct. This stops people deleting stacks or disabling the protection." },
      { t: "Add a stack policy denying Update:Delete on all resources.",
        why: "Stack policies don't apply to stack deletion." },
      { t: "Run drift detection daily.",
        why: "Drift detection doesn't prevent deletions." },
      { t: "Set UpdateReplacePolicy: Retain on all resources.",
        why: "Applies to replacements during updates, not stack deletion." }
    ],
    answer: [0, 1],
    tip: "Prevent stack deletion → termination protection + IAM/SCP deny DeleteStack & UpdateTerminationProtection."
  },
  {
    id: "cfc-12", domain: "d2", topic: "CloudFormation Change Control",
    q: "An application stack uses nested stacks. The team tries to enable termination protection directly on one nested stack and gets an error. What should they do?",
    options: [
      { t: "Enable termination protection on the root stack; nested stacks inherit it.",
        why: "Correct. Termination protection for nested stacks is controlled by the root stack." },
      { t: "Convert the nested stack into an export.",
        why: "Unrelated." },
      { t: "Add a stack policy to the nested stack instead.",
        why: "Stack policies don't block deletion." },
      { t: "Set DeletionPolicy on the AWS::CloudFormation::Stack resource only.",
        why: "Retains the child stack on removal, but isn't termination protection." }
    ],
    answer: [0],
    tip: "Nested stacks → termination protection set on the root stack."
  },
  {
    id: "cfc-13", domain: "d2", topic: "CloudFormation Change Control",
    q: "A template update changes a property on an RDS DB instance that requires replacement. The instance has DeletionPolicy: Snapshot but nothing else. After the update, the old database is gone without a snapshot. Why?",
    options: [
      { t: "Replacement during an update is governed by UpdateReplacePolicy, not DeletionPolicy; it should also be set to Snapshot (or Retain).",
        why: "Correct. DeletionPolicy applies when a resource is removed or the stack deleted; UpdateReplacePolicy handles the old resource on replacement." },
      { t: "Snapshot isn't supported for RDS.",
        why: "RDS supports Snapshot." },
      { t: "The stack needed termination protection.",
        why: "Termination protection doesn't affect replacement." },
      { t: "Drift detection deleted the snapshot.",
        why: "Drift detection never deletes anything." }
    ],
    answer: [0],
    tip: "Removed → DeletionPolicy; replaced → UpdateReplacePolicy. Use both on stateful resources."
  },
  {
    id: "cfc-14", domain: "d2", topic: "CloudFormation Change Control",
    q: "A team wants a final backup taken automatically when a stack containing an EBS volume, an RDS cluster and a DynamoDB table is deleted. Which configuration is valid?",
    options: [
      { t: "DeletionPolicy: Snapshot on the EBS volume and RDS cluster; DeletionPolicy: Retain (plus backups or PITR) on the DynamoDB table.",
        why: "Correct. Snapshot is supported for EBS and RDS, but not for DynamoDB tables." },
      { t: "DeletionPolicy: Snapshot on all three.",
        why: "DynamoDB tables don't support the Snapshot policy." },
      { t: "Termination protection on the stack only.",
        why: "Prevents deletion entirely rather than taking backups." },
      { t: "UpdateReplacePolicy: Snapshot on all three.",
        why: "That applies to replacement, not stack deletion, and still not to DynamoDB." }
    ],
    answer: [0],
    tip: "Snapshot policy: EBS, RDS/Aurora, Redshift, ElastiCache, Neptune, DocDB — not S3/DynamoDB."
  },
  {
    id: "cfc-15", domain: "d2", topic: "CloudFormation Change Control",
    q: "Deleting a stack fails with DELETE_FAILED on an S3 bucket resource. What is the most likely cause?",
    options: [
      { t: "The bucket still contains objects; CloudFormation can't delete non-empty buckets.",
        why: "Correct. Empty the bucket, retain it, or use a custom resource that empties it on delete." },
      { t: "The bucket has DeletionPolicy: Retain.",
        why: "Retain would keep the bucket and the stack deletion would succeed." },
      { t: "Termination protection is enabled.",
        why: "Then the whole delete would be blocked at the start, not fail on the bucket." },
      { t: "Drift detection is running.",
        why: "Drift detection doesn't block deletion." }
    ],
    answer: [0],
    tip: "Stack DELETE_FAILED on S3 → bucket not empty."
  },
  {
    id: "cfc-16", domain: "d2", topic: "CloudFormation Change Control",
    q: "A team sets DeletionPolicy: Retain on all resources. When stack creation fails and rolls back, the partly created resources remain as orphans and cost money. Which setting keeps resources on normal deletion but cleans up after failed creations?",
    options: [
      { t: "DeletionPolicy: RetainExceptOnCreate",
        why: "Correct. Resources are retained on deletion, except those created by a stack creation that rolled back." },
      { t: "UpdateReplacePolicy: Delete",
        why: "Applies to replacement, not failed creation." },
      { t: "DeletionPolicy: Snapshot",
        why: "Takes snapshots instead of retaining, and still leaves snapshots behind." },
      { t: "Termination protection",
        why: "Blocks stack deletion; doesn't clean up resources." }
    ],
    answer: [0],
    tip: "Retain, but not after failed create → RetainExceptOnCreate."
  },
  {
    id: "cfc-17", domain: "d2", topic: "CloudFormation Change Control",
    q: "A manually created S3 bucket with important data must be brought under CloudFormation management without recreating it. What is the correct process?",
    options: [
      { t: "Add the bucket to a template with a DeletionPolicy, then create and execute a change set of type IMPORT using the bucket name as the identifier.",
        why: "Correct. Resource import adopts existing resources, and imported resources must have a DeletionPolicy." },
      { t: "Add the bucket to the template and run a normal update.",
        why: "CloudFormation would try to create a new bucket and fail on the existing name." },
      { t: "Run drift detection to adopt the bucket.",
        why: "Drift detection only compares managed resources." },
      { t: "Export the bucket name from another stack.",
        why: "Exports share values; they don't adopt resources." }
    ],
    answer: [0],
    tip: "Adopt existing resources → IMPORT change set (DeletionPolicy required)."
  },
  {
    id: "cfc-18", domain: "d2", topic: "CloudFormation Change Control",
    q: "A database resource must be moved from an old stack to a new stack without deleting it. Which approach works?",
    options: [
      { t: "Set DeletionPolicy: Retain in the old stack, remove the resource from that template (it's kept), then import it into the new stack (or use stack refactoring).",
        why: "Correct. Retain keeps the resource when it leaves the old stack, and import adopts it in the new one." },
      { t: "Copy the resource definition to the new stack and delete it from the old stack.",
        why: "The old stack would delete the database, and the new one would create another." },
      { t: "Use ImportValue in the new stack.",
        why: "ImportValue shares values, not resource ownership." },
      { t: "Set UpdateReplacePolicy: Retain and update both stacks.",
        why: "That applies to replacement, not moving between stacks." }
    ],
    answer: [0],
    tip: "Move a resource between stacks → Retain + remove + import (or stack refactoring)."
  },
  {
    id: "cfc-19", domain: "d2", topic: "CloudFormation Change Control",
    q: "Developers deploy CloudFormation stacks, but the security team doesn't want them to have broad permissions to create IAM roles, VPCs and databases directly. What is the recommended approach?",
    options: [
      { t: "Use a CloudFormation service role with the needed permissions; give developers CloudFormation permissions plus iam:PassRole for that role only.",
        why: "Correct. CloudFormation uses the service role for resource operations, so developers don't need direct permissions." },
      { t: "Give developers AdministratorAccess but enable termination protection.",
        why: "Too broad; termination protection is unrelated." },
      { t: "Use a stack policy with the developers as Principal.",
        why: "Stack policy Principal must be '*'." },
      { t: "Let developers run drift detection only.",
        why: "Doesn't allow deployments." }
    ],
    answer: [0],
    tip: "Least privilege deploys → CloudFormation service role + iam:PassRole (+ condition key cloudformation:RoleArn)."
  },
  {
    id: "cfc-20", domain: "d2", topic: "CloudFormation Change Control",
    q: "A stack contains a VPC, several nested stacks and an RDS database. The team wants to preview not only that nested stacks will change, but which resources inside them will change. What should they use?",
    options: [
      { t: "Create the change set with --include-nested-stacks.",
        why: "Correct. Nested change sets show the resource-level changes inside child stacks." },
      { t: "Run drift detection on the nested stacks.",
        why: "Drift compares current resources with the current template, not a proposed update." },
      { t: "Use validate-template on each nested template.",
        why: "Syntax only." },
      { t: "Enable termination protection on the root stack.",
        why: "Unrelated to previews." }
    ],
    answer: [0],
    tip: "Preview inside nested stacks → change set with --include-nested-stacks."
  },
  {
    id: "cfc-21", domain: "d2", topic: "CloudFormation Change Control",
    q: "A team wants multiple protection layers for a production Aurora cluster managed by CloudFormation: stop accidental updates that replace it, keep data if the stack is deleted, and stop deletion through the RDS API. Which combination fits?",
    options: [
      { t: "A stack policy denying Update:Replace and Update:Delete on the cluster, DeletionPolicy and UpdateReplacePolicy set to Snapshot, and the cluster's DeletionProtection property set to true.",
        why: "Correct. Each layer covers a different risk: updates, stack removal/replacement, and direct API deletion." },
      { t: "Termination protection only.",
        why: "Only blocks stack deletion." },
      { t: "Drift detection only.",
        why: "Detects changes but prevents nothing." },
      { t: "DeletionPolicy: Retain only.",
        why: "Doesn't cover replacement during updates or direct deletion." }
    ],
    answer: [0],
    tip: "Layers: stack policy (updates) + Deletion/UpdateReplacePolicy (data) + service DeletionProtection (API)."
  },
  {
    id: "cfc-22", domain: "d2", topic: "CloudFormation Change Control",
    q: "A pipeline uses 'aws cloudformation deploy'. The team wants the pipeline to create the change set but not apply it, so it can be reviewed first. What should they add?",
    options: [
      { t: "The --no-execute-changeset flag.",
        why: "Correct. deploy then creates the change set and stops, leaving it for review and later execution." },
      { t: "The --disable-rollback flag.",
        why: "That changes failure behaviour, not whether the change set is executed." },
      { t: "The --capabilities CAPABILITY_IAM flag.",
        why: "Acknowledges IAM resources; doesn't stop execution." },
      { t: "Termination protection.",
        why: "Unrelated to change sets." }
    ],
    answer: [0],
    tip: "deploy creates a change set; --no-execute-changeset = preview only."
  },

  // ───────────────────────────── Domain 2: Nested and Cross-Stack ─────────────────────────────
  {
    id: "ncs-01", domain: "d2", topic: "Nested and Cross-Stack",
    q: "A central network team manages a VPC that 15 application teams use. Each team deploys its own stack on its own schedule and must reference the VPC and subnet IDs. The network stack changes rarely. Which approach fits BEST?",
    options: [
      { t: "Export the VPC and subnet IDs from the network stack and use Fn::ImportValue in each application stack.",
        why: "Correct. Cross-stack references suit shared resources with their own lifecycle and owner, used by independently deployed stacks." },
      { t: "Make the network template a nested stack inside every application's root stack.",
        why: "Each application would create its own VPC, and the network team would lose control of one shared VPC." },
      { t: "Copy the VPC resources into every application template.",
        why: "Creates many VPCs and duplicated code." },
      { t: "Hard-code the VPC ID in each template.",
        why: "Fragile and breaks when the VPC changes." }
    ],
    answer: [0],
    tip: "Shared resource, separate lifecycle, many consumers → cross-stack exports (or SSM)."
  },
  {
    id: "ncs-02", domain: "d2", topic: "Nested and Cross-Stack",
    q: "A company has an approved template for an ALB, target group, listeners and alarms. Every application template must include this exact setup, deployed together with the application. What is the BEST way to reuse it?",
    options: [
      { t: "Use it as a nested stack (AWS::CloudFormation::Stack) in each application's root template, or package it as a CloudFormation module.",
        why: "Correct. Nested stacks (or modules) reuse a template as a component, so each app gets its own copy deployed with it." },
      { t: "Deploy one ALB stack and export its ARN to all applications.",
        why: "That shares one ALB instance; the requirement is a standard setup per application." },
      { t: "Store the template in Parameter Store.",
        why: "Parameter Store holds values, not deployable components." },
      { t: "Use Fn::ImportValue to import the template.",
        why: "ImportValue reads exported values, not templates." }
    ],
    answer: [0],
    tip: "Reuse a template as a component → nested stack (or module)."
  },
  {
    id: "ncs-03", domain: "d2", topic: "Nested and Cross-Stack",
    q: "An application's single template has grown to 750 resources and can't be deployed. The application must still be deployed and rolled back as one unit. What should the team do?",
    options: [
      { t: "Split it into a root stack with nested child stacks; each child has its own 500-resource limit.",
        why: "Correct. Nested stacks scale past the per-stack limit while keeping one deployment unit." },
      { t: "Request an increase to 1,000 resources per stack.",
        why: "Restructuring into nested stacks is the intended approach." },
      { t: "Split it into independent stacks with exports.",
        why: "Possible, but they would no longer deploy and roll back as one unit." },
      { t: "Move resources into Mappings.",
        why: "Mappings can't contain resources." }
    ],
    answer: [0],
    tip: "More than 500 resources, one unit → nested stacks."
  },
  {
    id: "ncs-04", domain: "d2", topic: "Nested and Cross-Stack",
    q: "In a root stack, child stack Database needs the VPC ID created by child stack Network. What is the correct way to pass it?",
    options: [
      { t: "In the root template, set the Database stack's VpcId parameter to !GetAtt Network.Outputs.VpcId.",
        why: "Correct. The parent reads a child output with GetAtt and passes it as a parameter to the sibling, which also orders creation." },
      { t: "Export VpcId from Network and use ImportValue in Database.",
        why: "Works but adds unnecessary exports and export locks inside one unit." },
      { t: "Use !Ref Network.VpcId in the Database template.",
        why: "A child template can't reference resources in another child." },
      { t: "Use DependsOn only.",
        why: "DependsOn controls order but doesn't pass values." }
    ],
    answer: [0],
    tip: "Sibling to sibling → parent passes !GetAtt ChildA.Outputs.X as a parameter to ChildB."
  },
  {
    id: "ncs-05", domain: "d2", topic: "Nested and Cross-Stack",
    q: "A root template references child templates with local paths in TemplateURL (for example network.yaml). Deployment with create-stack fails. What should be done?",
    options: [
      { t: "Run aws cloudformation package to upload the child templates to S3 and rewrite TemplateURL, then deploy the packaged template.",
        why: "Correct. TemplateURL must be an S3 URL; package handles uploading and rewriting." },
      { t: "Zip the templates and upload them as one file.",
        why: "CloudFormation doesn't accept zipped template sets." },
      { t: "Use Fn::ImportValue for the child templates.",
        why: "ImportValue reads exports, not templates." },
      { t: "Put the child templates in Mappings.",
        why: "Mappings hold literal values." }
    ],
    answer: [0],
    tip: "Nested TemplateURL must be S3 → aws cloudformation package."
  },
  {
    id: "ncs-06", domain: "d2", topic: "Nested and Cross-Stack",
    q: "A stack in eu-west-1 needs the VPC ID exported by a stack in us-east-1. The engineer uses Fn::ImportValue and the stack fails. What is a valid solution?",
    options: [
      { t: "Store the value in SSM Parameter Store in eu-west-1 (written by a pipeline, StackSets or a custom resource) and read it with an SSM parameter type or dynamic reference.",
        why: "Correct. Exports are same account and same Region only." },
      { t: "Add the Region to the export name.",
        why: "Naming doesn't make exports work across Regions." },
      { t: "Make the eu-west-1 stack a nested stack of the us-east-1 stack.",
        why: "Nested stacks are created in the root's Region." },
      { t: "Enable cross-Region replication on the export.",
        why: "There is no such feature for exports." }
    ],
    answer: [0],
    tip: "Cross-Region / cross-account values → SSM Parameter Store, StackSets, custom resource."
  },
  {
    id: "ncs-07", domain: "d2", topic: "Nested and Cross-Stack",
    q: "The network team must replace the shared VPC. Updating the network stack fails: 'Export network-prod-VpcId cannot be updated as it is in use by app-a, app-b'. What is the correct process?",
    options: [
      { t: "Update app-a and app-b to stop importing (or switch to a new export or value) first, then update the network stack.",
        why: "Correct. Exports in use are locked until every importing stack removes the import." },
      { t: "Delete the network stack and recreate it.",
        why: "The stack can't be deleted while its exports are imported." },
      { t: "Add DeletionPolicy: Retain to the export.",
        why: "DeletionPolicy applies to resources, not exports." },
      { t: "Use termination protection on the app stacks.",
        why: "Unrelated to export locks." }
    ],
    answer: [0],
    tip: "Export in use is locked → change consumers first."
  },
  {
    id: "ncs-08", domain: "d2", topic: "Nested and Cross-Stack",
    q: "A new application stack fails with 'No export named network-prod-VpcId found'. What are the MOST likely causes? (Choose TWO.)",
    multi: true,
    options: [
      { t: "The network stack hasn't been deployed yet (or failed) in this account and Region.",
        why: "Correct. The producer must exist before consumers." },
      { t: "The export name differs (for example a different stack name prefix) or it's in a different Region.",
        why: "Correct. Names must match exactly, and imports are Region-scoped." },
      { t: "The application stack has termination protection.",
        why: "Unrelated." },
      { t: "The application stack lacks CAPABILITY_IAM.",
        why: "That error is about IAM resources, not exports." },
      { t: "Exports only work with nested stacks.",
        why: "Exports are for independent stacks." }
    ],
    answer: [0, 1],
    tip: "No export found → producer not deployed / wrong name / wrong Region."
  },
  {
    id: "ncs-09", domain: "d2", topic: "Nested and Cross-Stack",
    q: "Before changing an export, an engineer needs to know every stack that uses it. Which command helps?",
    options: [
      { t: "aws cloudformation list-imports --export-name network-prod-VpcId",
        why: "Correct. list-imports lists the stacks importing an export." },
      { t: "aws cloudformation detect-stack-drift",
        why: "Drift detection compares resources with templates." },
      { t: "aws cloudformation describe-change-set",
        why: "Shows proposed changes, not importers." },
      { t: "aws cloudformation validate-template",
        why: "Syntax check only." }
    ],
    answer: [0],
    tip: "Who uses an export → list-imports."
  },
  {
    id: "ncs-10", domain: "d2", topic: "Nested and Cross-Stack",
    q: "A root stack update fails with 'Embedded stack arn:...-Database-ABC was not successfully updated'. Where should the engineer look for the actual error?",
    options: [
      { t: "In the events of the nested Database stack itself.",
        why: "Correct. The root shows only a summary; the real error is in the child stack's events." },
      { t: "In the root stack's outputs.",
        why: "Outputs don't contain error details." },
      { t: "In AWS Config.",
        why: "Config records configuration, not stack operation errors." },
      { t: "In the S3 bucket holding the template.",
        why: "The bucket only stores templates." }
    ],
    answer: [0],
    tip: "Embedded stack failed → read the nested stack's own events."
  },
  {
    id: "ncs-11", domain: "d2", topic: "Nested and Cross-Stack",
    q: "Three teams want to deploy their own parts of an application (frontend, API, data) independently, on different schedules. A proposal puts all three as nested stacks under one root stack. What is the problem?",
    options: [
      { t: "Nested stacks are deployed and rolled back together through the root, so teams can't deploy independently; use separate stacks with exports or SSM parameters.",
        why: "Correct. Nested stacks are one unit; independent lifecycles need separate stacks." },
      { t: "Nested stacks can't contain Lambda functions.",
        why: "They can contain any resources." },
      { t: "Nested stacks can't have outputs.",
        why: "Children have outputs read with GetAtt." },
      { t: "There is no problem.",
        why: "The design conflicts with independent deployments." }
    ],
    answer: [0],
    tip: "Independent team deployments → separate stacks, not nested."
  },
  {
    id: "ncs-12", domain: "d2", topic: "Nested and Cross-Stack",
    q: "During a root stack update, the App child stack fails. What happens to the Network and Database child stacks that were updated successfully in the same operation?",
    options: [
      { t: "The whole root update rolls back, including the successfully updated children.",
        why: "Correct. Nested stacks are one unit; a failure rolls back the entire tree." },
      { t: "Only the App stack rolls back.",
        why: "The rollback covers the whole root operation." },
      { t: "Network and Database are deleted.",
        why: "They're rolled back to their previous state, not deleted." },
      { t: "The update is paused until someone approves.",
        why: "CloudFormation rolls back automatically by default." }
    ],
    answer: [0],
    tip: "Nested = whole-tree rollback."
  },
  {
    id: "ncs-13", domain: "d2", topic: "Nested and Cross-Stack",
    q: "A team wants to reduce the coupling between a frequently updated shared configuration stack and dozens of consumer stacks. Export locks keep blocking updates. Which alternative removes the lock, and what is the trade-off?",
    options: [
      { t: "Write the values to SSM Parameter Store and have consumers read them with SSM parameter types or dynamic references; there's no lock, but nothing prevents breaking consumers, and they get new values only on their next update.",
        why: "Correct. SSM decouples stacks but gives up the protection exports provide." },
      { t: "Use nested stacks for all consumers.",
        why: "Would force all consumers into one deployment unit." },
      { t: "Use longer export names.",
        why: "Names don't affect locking." },
      { t: "Disable export locking in account settings.",
        why: "No such setting exists." }
    ],
    answer: [0],
    tip: "No export locks → SSM Parameter Store (trade-off: no protection, update on next deploy)."
  },
  {
    id: "ncs-14", domain: "d2", topic: "Nested and Cross-Stack",
    q: "Two teams each deploy a stack with an Output export named 'VpcId' in the same account and Region. The second deployment fails. Why, and what's the fix?",
    options: [
      { t: "Export names must be unique per account and Region; prefix them with the stack name, for example !Sub \"${AWS::StackName}-VpcId\".",
        why: "Correct. Unique export names avoid collisions." },
      { t: "Only one stack per Region can have outputs.",
        why: "Any number of stacks can have outputs." },
      { t: "Exports need CAPABILITY_NAMED_IAM.",
        why: "Capabilities aren't related to exports." },
      { t: "The second stack must import the first export.",
        why: "Doesn't solve the duplicate name." }
    ],
    answer: [0],
    tip: "Export names unique per account+Region → ${AWS::StackName}-Name."
  },
  {
    id: "ncs-15", domain: "d2", topic: "Nested and Cross-Stack",
    q: "A root stack contains a nested stack built from a SAM AWS::Serverless::Application and another nested template using a macro. Deployment fails on capabilities. What must be acknowledged?",
    options: [
      { t: "CAPABILITY_AUTO_EXPAND (plus CAPABILITY_IAM or CAPABILITY_NAMED_IAM if IAM resources are created).",
        why: "Correct. Macros, transforms and serverless applications require auto-expand acknowledgment." },
      { t: "Only CAPABILITY_IAM.",
        why: "Not enough for macros and nested serverless applications." },
      { t: "No capabilities; nested stacks don't need them.",
        why: "Capabilities are required for these resources." },
      { t: "A stack policy allowing Update:*.",
        why: "Stack policies aren't capabilities." }
    ],
    answer: [0],
    tip: "Macros / SAM nested apps → CAPABILITY_AUTO_EXPAND."
  },
  {
    id: "ncs-16", domain: "d2", topic: "Nested and Cross-Stack",
    q: "A nested child stack is stuck in UPDATE_ROLLBACK_FAILED because one of its resources was deleted outside CloudFormation. How should the team recover?",
    options: [
      { t: "Run continue-update-rollback on the root stack with --resources-to-skip ChildStackLogicalId.ResourceLogicalId.",
        why: "Correct. Recovery is done from the root, skipping the resources that can't be rolled back." },
      { t: "Delete the child stack directly.",
        why: "Nested stacks should be managed through the root." },
      { t: "Run drift detection.",
        why: "Detects but doesn't recover the rollback." },
      { t: "Update the child stack directly with a new template.",
        why: "Updates must go through the root, and a stack in this state can't be updated." }
    ],
    answer: [0],
    tip: "Nested UPDATE_ROLLBACK_FAILED → continue-update-rollback on root with --resources-to-skip Child.Res."
  },
  {
    id: "ncs-17", domain: "d2", topic: "Nested and Cross-Stack",
    q: "A company deploys layered stacks: network, security (KMS keys, roles), data (RDS) and several app stacks. In which order should they be deployed and deleted when using exports?",
    options: [
      { t: "Deploy bottom to top (network, security, data, apps); delete top to bottom (apps first, network last).",
        why: "Correct. Producers must exist before consumers, and consumers must stop importing before producers are deleted." },
      { t: "Deploy apps first, then the network.",
        why: "Imports would fail with no export found." },
      { t: "Delete the network first.",
        why: "Blocked while exports are imported." },
      { t: "Order doesn't matter with exports.",
        why: "Exports create strict dependencies." }
    ],
    answer: [0],
    tip: "Layered exports: deploy bottom-up, delete top-down."
  },
  {
    id: "ncs-18", domain: "d2", topic: "Nested and Cross-Stack",
    q: "A child template expects a list of subnet IDs. The parent passes !GetAtt Network.Outputs.PrivateSubnetIds, which the Network child built with !Join. How should the receiving child declare the parameter?",
    options: [
      { t: "As List<AWS::EC2::Subnet::Id> (or CommaDelimitedList), because nested stack parameters arrive as comma-delimited strings.",
        why: "Correct. Lists are passed as strings and converted by the list parameter type." },
      { t: "As Number.",
        why: "Subnet IDs aren't numbers." },
      { t: "As a JSON object.",
        why: "Parameters don't accept objects." },
      { t: "Lists can't be passed to nested stacks.",
        why: "They can, as comma-delimited strings." }
    ],
    answer: [0],
    tip: "Lists between stacks = comma-delimited strings (Join / Split, list parameter types)."
  },
  {
    id: "ncs-19", domain: "d2", topic: "Nested and Cross-Stack",
    q: "A team wants the database and the application tier separated so that a failed application deployment never rolls back or redeploys the database. Which design is BEST?",
    options: [
      { t: "Put the database in its own stack (with DeletionPolicy protection) and have the app stack import its endpoint (or read it from SSM).",
        why: "Correct. Separate stacks give separate lifecycles and blast radius." },
      { t: "Put both as nested stacks under one root.",
        why: "A failed app update would roll back the whole tree, including the database stack." },
      { t: "Put both in one template with DependsOn.",
        why: "Still one stack and one rollback." },
      { t: "Use a stack policy on the app stack.",
        why: "Doesn't separate lifecycles." }
    ],
    answer: [0],
    tip: "Different lifecycle / blast radius → separate stacks (cross-stack or SSM)."
  },
  {
    id: "ncs-20", domain: "d2", topic: "Nested and Cross-Stack",
    q: "A team using AWS CDK moved a bucket from one stack to another. Deployment fails because the producing stack can't remove an export that the consumer still imports. What causes this, and what is a common fix?",
    options: [
      { t: "CDK automatically creates Export/ImportValue pairs for cross-stack references; deploy in two steps (remove the use from the consumer first) or share the value through SSM Parameter Store.",
        why: "Correct. CDK cross-stack references are CloudFormation exports and inherit the export lock." },
      { t: "CDK can't share resources between stacks.",
        why: "It can, through generated exports." },
      { t: "The bucket needs termination protection.",
        why: "Unrelated." },
      { t: "CDK always uses nested stacks.",
        why: "Only NestedStack constructs create nested stacks." }
    ],
    answer: [0],
    tip: "CDK cross-stack refs = exports → export lock; two-step deploy or SSM."
  },
  {
    id: "ncs-21", domain: "d2", topic: "Nested and Cross-Stack",
    q: "A team wants to preview which resources inside child stacks will change before updating a root stack with several nested stacks. What should they use?",
    options: [
      { t: "A change set on the root stack created with --include-nested-stacks.",
        why: "Correct. Nested change sets show resource-level changes in each child." },
      { t: "Drift detection on the root.",
        why: "Drift compares current resources with the current template." },
      { t: "list-imports.",
        why: "Lists stacks importing an export." },
      { t: "Termination protection.",
        why: "Unrelated to previews." }
    ],
    answer: [0],
    tip: "Preview nested changes → change set with --include-nested-stacks."
  },
  {
    id: "ncs-22", domain: "d2", topic: "Nested and Cross-Stack",
    q: "Which statement correctly compares nested stacks and cross-stack references?",
    options: [
      { t: "Nested stacks reuse a template as components deployed together as one unit; cross-stack references share values from separately managed stacks in the same account and Region.",
        why: "Correct. That's the core distinction tested on the exam." },
      { t: "Nested stacks work across Regions; exports don't.",
        why: "Neither works across Regions." },
      { t: "Cross-stack references roll back all importing stacks when the exporter fails.",
        why: "Stacks with imports are independent operations." },
      { t: "Nested stacks need exports to pass values to the parent.",
        why: "The parent uses GetAtt on child outputs." }
    ],
    answer: [0],
    tip: "Nested = template reuse, one unit. Cross-stack = shared values, separate lifecycles, same Region."
  },

  // ───────────────────────────── Domain 2: Helper Scripts and Policies ─────────────────────────────
  {
    id: "hsp-01", domain: "d2", topic: "Helper Scripts and Policies",
    q: "A CloudFormation stack creates an EC2 instance that installs an application with a UserData script. The stack shows CREATE_COMPLETE even when the installation fails, and the release pipeline continues with a broken server. What should be done?",
    options: [
      { t: "Add a CreationPolicy with a ResourceSignal to the instance and call cfn-signal -e $? after cfn-init and a health check in UserData.",
        why: "Correct. The resource stays in progress until a success signal arrives; a failure signal or timeout fails the stack." },
      { t: "Add DependsOn to the instance.",
        why: "DependsOn controls creation order, not whether software works." },
      { t: "Increase the instance size.",
        why: "Doesn't report installation status to CloudFormation." },
      { t: "Enable termination protection.",
        why: "Only blocks stack deletion." }
    ],
    answer: [0],
    tip: "Stack complete before app works → CreationPolicy + cfn-signal."
  },
  {
    id: "hsp-02", domain: "d2", topic: "Helper Scripts and Policies",
    q: "An engineer changed only the AWS::CloudFormation::Init metadata (a new config file content) and updated the stack. The update succeeded, but the running instances still have the old file. What is missing?",
    options: [
      { t: "cfn-hup running on the instances with a post.update hook that reruns cfn-init when the metadata changes.",
        why: "Correct. cfn-init runs at boot; cfn-hup detects metadata changes and reapplies them in place." },
      { t: "A new UserData script.",
        why: "UserData runs only at first boot." },
      { t: "A WaitCondition.",
        why: "Wait conditions pause stack creation; they don't apply metadata changes." },
      { t: "An UpdatePolicy on the instance.",
        why: "UpdatePolicy applies to ASGs and some other resources, and doesn't rerun cfn-init." }
    ],
    answer: [0],
    tip: "Metadata change not applied → cfn-hup (hooks.d post.update → cfn-init)."
  },
  {
    id: "hsp-03", domain: "d2", topic: "Helper Scripts and Policies",
    q: "A team edits the UserData script of an EC2 instance in a template and updates the stack, expecting the new script to configure the running instance. What actually happens?",
    options: [
      { t: "The instance is stopped and started to apply the new UserData, but UserData scripts normally run only at first boot, so the new script doesn't run.",
        why: "Correct. Use cfn-init metadata with cfn-hup, or replace the instance, to apply new configuration." },
      { t: "The new script runs immediately without interruption.",
        why: "UserData isn't re-executed on running instances." },
      { t: "CloudFormation replaces the instance every time UserData changes.",
        why: "UserData changes cause some interruption (stop/start), not replacement." },
      { t: "The update fails.",
        why: "The update succeeds; the script just doesn't rerun." }
    ],
    answer: [0],
    tip: "UserData = first boot only. In-place config changes → cfn-init + cfn-hup."
  },
  {
    id: "hsp-04", domain: "d2", topic: "Helper Scripts and Policies",
    q: "An AWS::CloudFormation::Init config lists commands first and packages last in the template. In what order does cfn-init actually process them?",
    options: [
      { t: "packages, groups, users, sources, files, commands, services — regardless of the order written.",
        why: "Correct. cfn-init uses a fixed key order; commands run alphabetically by name." },
      { t: "In the order written in the template.",
        why: "The written order of keys is ignored." },
      { t: "Alphabetically by key name.",
        why: "Only commands are sorted alphabetically (by command name)." },
      { t: "services first, then everything else.",
        why: "services is processed last." }
    ],
    answer: [0],
    tip: "cfn-init order: packages → groups → users → sources → files → commands → services."
  },
  {
    id: "hsp-05", domain: "d2", topic: "Helper Scripts and Policies",
    q: "With cfn-init, how can Apache be restarted automatically whenever its configuration file /etc/httpd/conf.d/app.conf is changed by cfn-init?",
    options: [
      { t: "In services → sysvinit → httpd, set enabled and ensureRunning and list the file under files.",
        why: "Correct. cfn-init restarts a service when listed files, sources, packages or commands change." },
      { t: "Add a command that restarts httpd every 5 minutes.",
        why: "Wasteful and unreliable." },
      { t: "Use a WaitCondition on the file.",
        why: "Wait conditions don't watch files." },
      { t: "Put the restart in UserData.",
        why: "UserData runs only at first boot." }
    ],
    answer: [0],
    tip: "Restart on config change → services: sysvinit: httpd: files: [config]."
  },
  {
    id: "hsp-06", domain: "d2", topic: "Helper Scripts and Policies",
    q: "cfn-init must download an application archive from a private S3 bucket during bootstrap. What is the recommended configuration?",
    options: [
      { t: "Use AWS::CloudFormation::Authentication metadata of type S3 with the instance profile role (roleName), and reference the object in sources or files.",
        why: "Correct. cfn-init uses the instance role's credentials to fetch private S3 objects." },
      { t: "Make the bucket public.",
        why: "Insecure." },
      { t: "Embed access keys in the UserData.",
        why: "Long-term keys in UserData are insecure." },
      { t: "Use a WaitConditionHandle URL.",
        why: "That's for signals, not downloads." }
    ],
    answer: [0],
    tip: "Private S3 for cfn-init → AWS::CloudFormation::Authentication (S3, roleName)."
  },
  {
    id: "hsp-07", domain: "d2", topic: "Helper Scripts and Policies",
    q: "An Auto Scaling group has a CreationPolicy requiring 3 signals. Its launch template holds the cfn-init metadata. Stack creation always times out even though the application starts correctly. UserData runs 'cfn-signal -e $? --resource WebLaunchTemplate ...'. What is wrong?",
    options: [
      { t: "cfn-signal must target the resource with the CreationPolicy — the ASG (for example --resource WebServerGroup).",
        why: "Correct. cfn-init reads metadata from the launch template, but signals go to the ASG." },
      { t: "cfn-init must target the ASG instead of the launch template.",
        why: "The metadata lives on the launch template, so cfn-init targets it." },
      { t: "The CreationPolicy timeout must be 24 hours.",
        why: "The maximum is 12 hours, and the problem isn't the timeout." },
      { t: "Launch templates can't hold metadata.",
        why: "They can and commonly do." }
    ],
    answer: [0],
    tip: "ASG: cfn-init --resource LaunchTemplate; cfn-signal --resource ASG."
  },
  {
    id: "hsp-08", domain: "d2", topic: "Helper Scripts and Policies",
    q: "Instances in private subnets without a NAT gateway always cause the stack to time out waiting for cfn-signal. The bootstrap logic works when tested in a public subnet. What should be added? (Choose TWO.)",
    multi: true,
    options: [
      { t: "An interface VPC endpoint for AWS CloudFormation in the VPC.",
        why: "Correct. Helper scripts must reach the CloudFormation endpoint to read metadata and send signals." },
      { t: "An S3 gateway endpoint (for downloads and wait condition presigned URLs).",
        why: "Correct. cfn-init sources/files and wait condition signals use S3." },
      { t: "An Elastic IP on each instance.",
        why: "Private subnets have no internet gateway route, so an EIP doesn't help." },
      { t: "A longer CreationPolicy timeout.",
        why: "The signal can never arrive without a network path." },
      { t: "Termination protection.",
        why: "Unrelated." }
    ],
    answer: [0, 1],
    tip: "Private subnets + helper scripts → CloudFormation VPC endpoint (+ S3 endpoint) or NAT."
  },
  {
    id: "hsp-09", domain: "d2", topic: "Helper Scripts and Policies",
    q: "A stack creating Ubuntu instances fails waiting for signals. The cloud-init log shows 'cfn-init: command not found'. What is the fix?",
    options: [
      { t: "Install the aws-cfn-bootstrap helper scripts in UserData before calling cfn-init and cfn-signal.",
        why: "Correct. The helper scripts are preinstalled only on Amazon Linux." },
      { t: "Switch to a WaitCondition.",
        why: "cfn-signal is still needed and still missing." },
      { t: "Add CAPABILITY_IAM.",
        why: "Unrelated to missing scripts." },
      { t: "Use a larger instance.",
        why: "Size doesn't install packages." }
    ],
    answer: [0],
    tip: "Non-Amazon Linux → install aws-cfn-bootstrap first."
  },
  {
    id: "hsp-10", domain: "d2", topic: "Helper Scripts and Policies",
    q: "A stack must pause until an on-premises system confirms that a firewall rule has been opened, and then continue creating the remaining resources. What should be used?",
    options: [
      { t: "An AWS::CloudFormation::WaitCondition with a WaitConditionHandle; the on-premises system sends an HTTP PUT to the handle's presigned URL.",
        why: "Correct. Wait condition handles let external systems signal the stack." },
      { t: "A CreationPolicy on an EC2 instance.",
        why: "Meant for signals from the resource itself; the external system isn't a stack resource." },
      { t: "A stack policy.",
        why: "Stack policies restrict updates." },
      { t: "An UpdatePolicy.",
        why: "Controls updates of ASGs, not external confirmation." }
    ],
    answer: [0],
    tip: "External / on-prem confirmation → WaitCondition + handle (presigned URL)."
  },
  {
    id: "hsp-11", domain: "d2", topic: "Helper Scripts and Policies",
    q: "An instance generates a build ID during bootstrap, and the stack must expose it as an output. How can this be done?",
    options: [
      { t: "Send it with cfn-signal -d to a WaitCondition handle and output !GetAtt WaitCondition.Data.",
        why: "Correct. WaitCondition Data returns the data sent with signals." },
      { t: "Use !GetAtt Instance.UserData.",
        why: "UserData isn't returned with runtime values." },
      { t: "Use Fn::ImportValue.",
        why: "Imports exports from other stacks." },
      { t: "Use CreationPolicy Data.",
        why: "CreationPolicy signals don't return data to outputs." }
    ],
    answer: [0],
    tip: "Instance → stack data → WaitCondition + cfn-signal -d + GetAtt .Data."
  },
  {
    id: "hsp-12", domain: "d2", topic: "Helper Scripts and Policies",
    q: "What is the maximum timeout you can set for a CreationPolicy ResourceSignal?",
    options: [
      { t: "12 hours (PT12H).",
        why: "Correct. Timeouts use ISO 8601 durations up to 12 hours (WaitCondition up to 43200 seconds)." },
      { t: "1 hour.",
        why: "Longer timeouts are allowed." },
      { t: "24 hours.",
        why: "The maximum is 12 hours." },
      { t: "7 days.",
        why: "Far above the limit." }
    ],
    answer: [0],
    tip: "CreationPolicy / WaitCondition timeout max 12 hours."
  },
  {
    id: "hsp-13", domain: "d2", topic: "Helper Scripts and Policies",
    q: "A team changes the AMI in the launch template used by an Auto Scaling group and updates the stack. The update succeeds, but all existing instances still run the old AMI. Why?",
    options: [
      { t: "The ASG has no UpdatePolicy, so changing the launch template only affects instances launched later.",
        why: "Correct. Add AutoScalingRollingUpdate or AutoScalingReplacingUpdate (or run an instance refresh)." },
      { t: "Launch templates can't change the AMI.",
        why: "They can, through new versions." },
      { t: "The stack needs termination protection.",
        why: "Unrelated." },
      { t: "cfn-hup must be installed.",
        why: "cfn-hup applies metadata, not AMI changes." }
    ],
    answer: [0],
    tip: "Launch template change, old instances remain → add an ASG UpdatePolicy."
  },
  {
    id: "hsp-14", domain: "d2", topic: "Helper Scripts and Policies",
    q: "A production ASG has 6 instances. Updates must replace 2 instances at a time, keep at least 4 in service, and move to the next batch only after the new instances report healthy via cfn-signal. Which configuration fits?",
    options: [
      { t: "AutoScalingRollingUpdate with MaxBatchSize 2, MinInstancesInService 4, WaitOnResourceSignals true and a PauseTime long enough for signals.",
        why: "Correct. These properties control batch size, capacity floor and signal waiting." },
      { t: "AutoScalingReplacingUpdate with WillReplace true.",
        why: "Creates a whole new ASG instead of batches." },
      { t: "AutoScalingScheduledAction.",
        why: "Only affects group size properties during updates." },
      { t: "A CreationPolicy only.",
        why: "Applies at creation (or replacement), not rolling batches." }
    ],
    answer: [0],
    tip: "Batches + capacity floor + signals → AutoScalingRollingUpdate (MaxBatchSize, MinInstancesInService, WaitOnResourceSignals)."
  },
  {
    id: "hsp-15", domain: "d2", topic: "Helper Scripts and Policies",
    q: "A company wants ASG updates where existing instances are never touched until the new instances are proven healthy, and a failed update rolls back as fast as possible. Which configuration should be used?",
    options: [
      { t: "AutoScalingReplacingUpdate with WillReplace: true, plus a CreationPolicy with resource signals.",
        why: "Correct. A new ASG is created and judged by signals; on failure it's deleted and the old ASG keeps serving." },
      { t: "AutoScalingRollingUpdate with MaxBatchSize 1.",
        why: "Still replaces existing instances, and rollback is another rolling update." },
      { t: "No UpdatePolicy.",
        why: "Existing instances wouldn't be updated at all." },
      { t: "A stack policy denying Update:Replace.",
        why: "Blocks the update rather than making it safe." }
    ],
    answer: [0],
    tip: "Immutable ASG updates, fastest rollback → AutoScalingReplacingUpdate (WillReplace) + CreationPolicy."
  },
  {
    id: "hsp-16", domain: "d2", topic: "Helper Scripts and Policies",
    q: "During a rolling update of an ASG, Auto Scaling health checks replaced instances and a scale-in event terminated new instances, causing the update to fail. What should be configured?",
    options: [
      { t: "SuspendProcesses in AutoScalingRollingUpdate (for example HealthCheck, ReplaceUnhealthy, AZRebalance, AlarmNotification, ScheduledActions).",
        why: "Correct. Suspending these processes stops the ASG from interfering during the update." },
      { t: "A longer PauseTime only.",
        why: "Doesn't stop the ASG processes from acting." },
      { t: "DeletionPolicy: Retain on the ASG.",
        why: "Unrelated to rolling updates." },
      { t: "MinSuccessfulInstancesPercent 0.",
        why: "Hides failures rather than preventing interference." }
    ],
    answer: [0],
    tip: "ASG processes interfere with rolling update → SuspendProcesses."
  },
  {
    id: "hsp-17", domain: "d2", topic: "Helper Scripts and Policies",
    q: "Scheduled actions raise an ASG's desired capacity to 12 during business hours. Each stack update during the day resets it to the template's DesiredCapacity of 3. How can this be prevented?",
    options: [
      { t: "Add UpdatePolicy AutoScalingScheduledAction with IgnoreUnmodifiedGroupSizeProperties: true (and avoid hard-coding DesiredCapacity).",
        why: "Correct. Unchanged size properties are no longer reset during updates." },
      { t: "Add a stack policy denying Update:Modify on the ASG.",
        why: "Would block all ASG updates." },
      { t: "Use AutoScalingReplacingUpdate.",
        why: "Doesn't address size property resets." },
      { t: "Use cfn-hup.",
        why: "cfn-hup applies instance metadata, not ASG size." }
    ],
    answer: [0],
    tip: "Updates reset scheduled capacity → IgnoreUnmodifiedGroupSizeProperties: true."
  },
  {
    id: "hsp-18", domain: "d2", topic: "Helper Scripts and Policies",
    q: "An ASG resource defines both AutoScalingReplacingUpdate (WillReplace: true) and AutoScalingRollingUpdate. What happens during an update that changes the launch template?",
    options: [
      { t: "The replacing update applies: a new ASG is created; WillReplace takes precedence.",
        why: "Correct. When both are set and WillReplace is true, the replacing policy wins." },
      { t: "The rolling update applies because it is listed first.",
        why: "Order in the template doesn't matter." },
      { t: "The update fails because both are defined.",
        why: "Both can be defined." },
      { t: "Both run one after the other.",
        why: "Only one policy applies." }
    ],
    answer: [0],
    tip: "Both policies set → WillReplace wins."
  },
  {
    id: "hsp-19", domain: "d2", topic: "Helper Scripts and Policies",
    q: "A stack keeps failing because an instance doesn't signal, and the rollback deletes the instance before the team can inspect it. How can they troubleshoot?",
    options: [
      { t: "Create the stack with rollback disabled (--disable-rollback or --on-failure DO_NOTHING / preserve successfully provisioned resources), then inspect /var/log/cfn-init.log and cloud-init logs on the instance.",
        why: "Correct. Keeping the failed resources lets you read the logs, then clean up afterwards." },
      { t: "Increase the timeout to 12 hours and wait.",
        why: "Doesn't reveal the cause if no signal is ever sent." },
      { t: "Run drift detection.",
        why: "Drift doesn't explain bootstrap failures." },
      { t: "Enable termination protection.",
        why: "Doesn't stop resource rollback during creation." }
    ],
    answer: [0],
    tip: "Debug failed bootstrap → disable rollback, read cfn-init / cloud-init logs."
  },
  {
    id: "hsp-20", domain: "d2", topic: "Helper Scripts and Policies",
    q: "Which signal should an instance send to make sure CloudFormation only marks it successful when the application really works?",
    options: [
      { t: "Run cfn-init, then a health check such as curl -f http://localhost/health, and call cfn-signal -e $? with the health check's exit code.",
        why: "Correct. The signal then reflects the application's real state, not just that packages installed." },
      { t: "Call cfn-signal --success true at the start of UserData.",
        why: "Reports success before anything is installed." },
      { t: "Call cfn-signal only if the instance boots.",
        why: "Booting doesn't mean the app works." },
      { t: "Don't signal; rely on the timeout.",
        why: "The timeout causes failure, not success." }
    ],
    answer: [0],
    tip: "Signal after a real health check (cfn-signal -e $?)."
  },
  {
    id: "hsp-21", domain: "d2", topic: "Helper Scripts and Policies",
    q: "A template uses a WaitCondition to wait for an instance during creation. After a later stack update that changes the instance, the team expects the stack to wait for a new signal, but it doesn't. Why, and how can they make it wait again?",
    options: [
      { t: "Wait conditions don't wait again on updates; create a new WaitConditionHandle (and condition) by changing its logical ID, or use a CreationPolicy-based design.",
        why: "Correct. A new handle produces a new URL and a new wait." },
      { t: "Wait conditions only work with ASGs.",
        why: "They work with any resources." },
      { t: "The timeout expired.",
        why: "The wait condition was already complete; it isn't re-evaluated." },
      { t: "cfn-hup must send the signal.",
        why: "cfn-hup doesn't make the wait condition wait again." }
    ],
    answer: [0],
    tip: "WaitCondition doesn't re-wait on update → new handle (new logical ID)."
  },
  {
    id: "hsp-22", domain: "d2", topic: "Helper Scripts and Policies",
    q: "A team wants instance configuration to be defined declaratively in the template (packages, files, services), applied at boot, and kept in sync later, with the stack knowing whether boot succeeded. Which combination fits?",
    options: [
      { t: "AWS::CloudFormation::Init metadata applied by cfn-init, cfn-signal with a CreationPolicy, and cfn-hup for later metadata changes.",
        why: "Correct. That's the standard helper-script pattern for declarative EC2 configuration." },
      { t: "A long UserData bash script only.",
        why: "Imperative, runs once, and doesn't report success." },
      { t: "Mappings with package names.",
        why: "Mappings don't configure instances." },
      { t: "Nested stacks for each package.",
        why: "Nested stacks create resources, not instance configuration." }
    ],
    answer: [0],
    tip: "Declarative EC2 config: Init metadata + cfn-init + cfn-signal/CreationPolicy + cfn-hup."
  },

  // ───────────────────────────── Domain 2: Extending CloudFormation ─────────────────────────────
  {
    id: "ext-01", domain: "d2", topic: "Extending CloudFormation",
    q: "A stack contains an S3 bucket that always has objects in it. Deleting the stack fails with DELETE_FAILED on the bucket. The team wants the stack to delete cleanly, including the bucket, with no manual steps. What should they add?",
    options: [
      { t: "A Lambda-backed custom resource that empties the bucket when it receives a Delete request, then responds SUCCESS.",
        why: "Correct. CloudFormation can't delete non-empty buckets; a custom resource can empty it during stack deletion." },
      { t: "DeletionPolicy: Retain on the bucket.",
        why: "The stack deletes, but the bucket and its data remain, which isn't the requirement." },
      { t: "A Hook that deletes objects.",
        why: "Hooks validate configurations; they don't perform cleanup actions." },
      { t: "Termination protection.",
        why: "Blocks deletion entirely." }
    ],
    answer: [0],
    tip: "Empty bucket on stack delete → custom resource (Delete handler)."
  },
  {
    id: "ext-02", domain: "d2", topic: "Extending CloudFormation",
    q: "A custom resource's Lambda function throws an exception and exits without sending a response. What happens to the stack, and how should the code be fixed?",
    options: [
      { t: "The stack waits for a response until the custom resource timeout (1 hour by default, or ServiceTimeout) and then fails; the code should send SUCCESS or FAILED in a try/except/finally for every request type.",
        why: "Correct. CloudFormation only knows the result from the response PUT to the ResponseURL." },
      { t: "The stack fails immediately when Lambda reports an error.",
        why: "CloudFormation doesn't see Lambda invocation errors; it waits for the response." },
      { t: "CloudFormation retries the function every minute until it succeeds.",
        why: "It doesn't keep retrying; it waits until the timeout." },
      { t: "The resource is marked successful by default.",
        why: "No response means it eventually fails." }
    ],
    answer: [0],
    tip: "Custom resource must ALWAYS respond (default wait 1 h; set ServiceTimeout)."
  },
  {
    id: "ext-03", domain: "d2", topic: "Extending CloudFormation",
    q: "A stack is stuck in DELETE_IN_PROGRESS on a custom resource for nearly an hour. The function's Delete branch calls an API that returns 'not found' because the resource was already removed, and the code raises an error without responding. What should the developer change?",
    options: [
      { t: "Treat 'not found' as success in the Delete handler and always send a response; optionally set ServiceTimeout to fail faster.",
        why: "Correct. Delete handlers must succeed (or respond FAILED) so stack deletion and rollbacks don't hang." },
      { t: "Add DeletionPolicy: Snapshot to the custom resource.",
        why: "Snapshot isn't supported for custom resources and doesn't fix the response." },
      { t: "Disable termination protection.",
        why: "The stack is already deleting." },
      { t: "Increase the Lambda memory.",
        why: "Not related to missing responses." }
    ],
    answer: [0],
    tip: "Delete handler: idempotent, 'already gone' = SUCCESS, always respond."
  },
  {
    id: "ext-04", domain: "d2", topic: "Extending CloudFormation",
    q: "A Lambda-backed custom resource runs in private subnets without a NAT gateway. Its code finishes successfully, but the stack always waits until the timeout. Why?",
    options: [
      { t: "The function can't reach the presigned S3 ResponseURL to send its response; add an S3 gateway endpoint or NAT.",
        why: "Correct. The response is an HTTPS PUT to S3, which needs a network path." },
      { t: "Custom resources can't run in a VPC.",
        why: "They can, with the right network access." },
      { t: "The ServiceToken must be an SNS topic.",
        why: "Lambda ServiceTokens work fine." },
      { t: "The stack needs CAPABILITY_AUTO_EXPAND.",
        why: "That capability is for macros." }
    ],
    answer: [0],
    tip: "VPC custom resource hangs → no route to S3 ResponseURL (S3 endpoint / NAT)."
  },
  {
    id: "ext-05", domain: "d2", topic: "Extending CloudFormation",
    q: "A team improved the code of the Lambda function behind a custom resource and updated the stack, but the custom resource didn't run again. How can they make CloudFormation send an Update request?",
    options: [
      { t: "Change one of the custom resource's properties, for example a Version or timestamp property.",
        why: "Correct. Update requests are sent only when the custom resource's own properties change." },
      { t: "Delete the Lambda function and redeploy.",
        why: "Changing the function doesn't change the custom resource's properties." },
      { t: "Run drift detection.",
        why: "Drift detection doesn't trigger custom resources." },
      { t: "Add DependsOn to the function.",
        why: "Ordering doesn't trigger updates." }
    ],
    answer: [0],
    tip: "Force custom resource rerun → change a property (Version)."
  },
  {
    id: "ext-06", domain: "d2", topic: "Extending CloudFormation",
    q: "After every stack update, a custom resource's external object is unexpectedly deleted. The handler returns context.log_stream_name as the PhysicalResourceId. What is the cause?",
    options: [
      { t: "A new PhysicalResourceId on Update makes CloudFormation treat it as a replacement and send a Delete for the old ID during cleanup; return a stable ID.",
        why: "Correct. Changing the physical ID signals replacement." },
      { t: "Custom resources always delete on update.",
        why: "Only when the physical ID changes." },
      { t: "The stack has DeletionPolicy: Delete.",
        why: "DeletionPolicy applies on removal, not this behaviour." },
      { t: "The Lambda timeout is too short.",
        why: "The issue is the changing ID." }
    ],
    answer: [0],
    tip: "Stable PhysicalResourceId — a new one = replacement = Delete of old."
  },
  {
    id: "ext-07", domain: "d2", topic: "Extending CloudFormation",
    q: "A custom resource looks up a value from an API and must make it available to other resources in the template. How should it do this?",
    options: [
      { t: "Return the value in the response Data and reference it with !GetAtt CustomResource.KeyName.",
        why: "Correct. Data keys become attributes of the custom resource." },
      { t: "Write it into the template file in S3.",
        why: "The running stack doesn't re-read the template." },
      { t: "Use Fn::ImportValue on the Lambda function.",
        why: "Lambda functions don't create exports." },
      { t: "Return it as the Reason field.",
        why: "Reason is a text message, not an attribute." }
    ],
    answer: [0],
    tip: "Custom resource outputs → response Data → GetAtt (NoEcho to mask)."
  },
  {
    id: "ext-08", domain: "d2", topic: "Extending CloudFormation",
    q: "A developer packages a custom resource Lambda as a zip in S3 and imports the cfnresponse module, but the function fails with 'No module named cfnresponse'. Why?",
    options: [
      { t: "cfnresponse is only provided automatically for inline ZipFile code; packaged code must include its own helper (for example crhelper or a copy of the module).",
        why: "Correct. Packaged deployments don't get the module automatically." },
      { t: "cfnresponse only works with Node.js.",
        why: "It's available for Python and Node.js inline code." },
      { t: "The function needs CAPABILITY_IAM.",
        why: "Capabilities don't add modules." },
      { t: "Custom resources must use SNS.",
        why: "Lambda is the common choice." }
    ],
    answer: [0],
    tip: "cfnresponse = inline ZipFile only."
  },
  {
    id: "ext-09", domain: "d2", topic: "Extending CloudFormation",
    q: "A template must create 20 nearly identical SQS queues from a list parameter, without writing a custom Lambda. What is the simplest option?",
    options: [
      { t: "Use the AWS::LanguageExtensions transform with Fn::ForEach.",
        why: "Correct. LanguageExtensions provides loops in templates with no custom code." },
      { t: "Write a custom macro in Lambda.",
        why: "Works, but needs custom code when ForEach exists." },
      { t: "Use Mappings to create resources.",
        why: "Mappings can't create resources." },
      { t: "Use a custom resource that creates the queues.",
        why: "The queues wouldn't be normal stack resources." }
    ],
    answer: [0],
    tip: "Loops in templates → AWS::LanguageExtensions Fn::ForEach."
  },
  {
    id: "ext-10", domain: "d2", topic: "Extending CloudFormation",
    q: "Several templates must include the same block of standard alarm resources stored centrally in S3, so a change to the block is picked up by every template on its next update. Which feature fits?",
    options: [
      { t: "The AWS::Include transform with Fn::Transform pointing to the S3 snippet.",
        why: "Correct. AWS::Include inserts a template snippet from S3 at processing time." },
      { t: "Fn::ImportValue",
        why: "Imports values, not template blocks." },
      { t: "A Hook.",
        why: "Hooks validate, they don't insert resources." },
      { t: "Mappings.",
        why: "Literal lookup tables only." }
    ],
    answer: [0],
    tip: "Shared snippet from S3 → AWS::Include."
  },
  {
    id: "ext-11", domain: "d2", topic: "Extending CloudFormation",
    q: "Deploying a template that uses AWS::Serverless and a custom macro fails with 'Requires capabilities: [CAPABILITY_AUTO_EXPAND]'. What does this mean?",
    options: [
      { t: "Templates with macros or transforms change before processing, so you must acknowledge CAPABILITY_AUTO_EXPAND to deploy them.",
        why: "Correct. Auto-expand acknowledges that the processed template may differ from what you submitted." },
      { t: "The stack creates IAM roles.",
        why: "That would need CAPABILITY_IAM." },
      { t: "The macro isn't registered.",
        why: "That gives a different error about the missing macro." },
      { t: "Nested stacks aren't allowed with SAM.",
        why: "They are allowed." }
    ],
    answer: [0],
    tip: "Macros / transforms / SAM → CAPABILITY_AUTO_EXPAND."
  },
  {
    id: "ext-12", domain: "d2", topic: "Extending CloudFormation",
    q: "A central team created a custom macro AddStandardTags in its tooling account in us-east-1. Application stacks in other accounts and in eu-west-1 fail because the macro can't be found. What is the fix?",
    options: [
      { t: "Deploy the macro (Lambda + AWS::CloudFormation::Macro) into each account and Region that uses it, for example with StackSets.",
        why: "Correct. Macros must exist in the same account and Region as the stacks using them." },
      { t: "Share the macro with AWS RAM.",
        why: "Macros aren't shared through RAM." },
      { t: "Reference the macro by full ARN.",
        why: "Macros are referenced by name in the local account and Region." },
      { t: "Add CAPABILITY_AUTO_EXPAND.",
        why: "Needed, but doesn't make a remote macro available." }
    ],
    answer: [0],
    tip: "Macros are per account + Region → roll out with StackSets."
  },
  {
    id: "ext-13", domain: "d2", topic: "Extending CloudFormation",
    q: "A platform team wants every team to create S3 buckets with the company's encryption, logging and public access settings by declaring a single resource, without creating extra stacks, and with versioned updates. What should they build?",
    options: [
      { t: "A CloudFormation module (for example MyCo::S3::SecureBucket::MODULE) registered in the Registry.",
        why: "Correct. Modules package resources as one versioned type and are merged into the stack." },
      { t: "A nested stack for each bucket.",
        why: "Creates extra stacks." },
      { t: "A custom resource that calls CreateBucket.",
        why: "The bucket wouldn't be a normal managed resource with drift support." },
      { t: "A Hook that creates the bucket.",
        why: "Hooks validate; they don't create resources." }
    ],
    answer: [0],
    tip: "Reusable versioned resource bundle, no extra stacks → module."
  },
  {
    id: "ext-14", domain: "d2", topic: "Extending CloudFormation",
    q: "A template uses a module with logical ID LogsBucket, and inside the module the bucket's logical ID is Bucket. How does another resource in the same template reference the bucket ARN?",
    options: [
      { t: "!GetAtt LogsBucketBucket.Arn",
        why: "Correct. Module resource IDs are prefixed with the module's logical ID." },
      { t: "!GetAtt LogsBucket.Outputs.Arn",
        why: "That's nested stack syntax." },
      { t: "!ImportValue LogsBucket-Arn",
        why: "Modules don't create exports." },
      { t: "!Ref Bucket",
        why: "The plain name isn't used after the module is expanded." }
    ],
    answer: [0],
    tip: "Module internals → <ModuleLogicalId><ResourceLogicalId>."
  },
  {
    id: "ext-15", domain: "d2", topic: "Extending CloudFormation",
    q: "An application template has 650 resources. A team suggests moving groups of resources into CloudFormation modules to get under the 500-resource limit. Will this work?",
    options: [
      { t: "No. Module resources are merged into the same stack and still count toward its limit; use nested stacks instead.",
        why: "Correct. Only nested stacks give each part its own resource limit." },
      { t: "Yes, modules don't count toward the limit.",
        why: "They count once expanded." },
      { t: "Yes, if the modules are public.",
        why: "Visibility doesn't affect the limit." },
      { t: "Yes, with CAPABILITY_AUTO_EXPAND.",
        why: "Capabilities don't change resource limits." }
    ],
    answer: [0],
    tip: "Modules don't beat 500 resources → nested stacks."
  },
  {
    id: "ext-16", domain: "d2", topic: "Extending CloudFormation",
    q: "Security requires that no CloudFormation stack in any account can create a security group allowing SSH from 0.0.0.0/0. Teams deploy with different pipelines and sometimes from the console. The check must happen before the resource is created. What should be used?",
    options: [
      { t: "A CloudFormation Hook (Guard or Lambda) targeting AWS::EC2::SecurityGroup with FailureMode FAIL, activated in all accounts and Regions.",
        why: "Correct. Hooks run inside CloudFormation for every stack before provisioning, regardless of who deploys." },
      { t: "cfn-guard in one central pipeline.",
        why: "Deployments outside that pipeline wouldn't be checked." },
      { t: "An AWS Config rule.",
        why: "Config detects after the resource exists." },
      { t: "A stack policy on each stack.",
        why: "Stack policies control update actions, not property values." }
    ],
    answer: [0],
    tip: "Block bad resources in every stack before creation → CloudFormation Hooks."
  },
  {
    id: "ext-17", domain: "d2", topic: "Extending CloudFormation",
    q: "A team is introducing a new Hook rule and is worried it might block legitimate production deployments. What is the safest rollout approach?",
    options: [
      { t: "Activate the Hook with FailureMode set to WARN, review the warnings in stack events, then switch to FAIL.",
        why: "Correct. WARN reports violations without blocking." },
      { t: "Activate with FAIL in production only.",
        why: "Risky without testing." },
      { t: "Use TargetStacks NONE permanently.",
        why: "The Hook would never run." },
      { t: "Delete the Hook if a deployment fails.",
        why: "Reactive, not safe." }
    ],
    answer: [0],
    tip: "Roll out Hooks with FailureMode WARN first."
  },
  {
    id: "ext-18", domain: "d2", topic: "Extending CloudFormation",
    q: "Which statement correctly describes the difference between CloudFormation Hooks and AWS Config rules? (Choose TWO.)",
    multi: true,
    options: [
      { t: "Hooks are proactive: they evaluate resources before CloudFormation provisions them and can block the operation.",
        why: "Correct. Hooks run in the provisioning path." },
      { t: "Config rules are detective: they evaluate resources after they exist and can trigger remediation.",
        why: "Correct. Config checks deployed resources." },
      { t: "Config rules block CloudFormation stack creation.",
        why: "Config doesn't block creation." },
      { t: "Hooks evaluate resources created outside CloudFormation in the console.",
        why: "Hooks only apply to CloudFormation (and Cloud Control API) operations." },
      { t: "Hooks and Config rules are the same feature.",
        why: "They work at different times." }
    ],
    answer: [0, 1],
    tip: "Hooks = proactive (before), Config = detective (after), SCP = preventive (API)."
  },
  {
    id: "ext-19", domain: "d2", topic: "Extending CloudFormation",
    q: "A company wants to manage MongoDB Atlas clusters and Datadog monitors in its CloudFormation templates. What is the simplest approach?",
    options: [
      { t: "Activate the public third-party extensions from the CloudFormation Registry in each account and Region, with their execution roles and API keys (for example in Secrets Manager).",
        why: "Correct. Public third-party resource types can be used like native types after activation." },
      { t: "Write a custom resource for each SaaS API.",
        why: "More work than using existing published types." },
      { t: "Use a macro to call the SaaS APIs.",
        why: "Macros transform templates; they don't manage external resources." },
      { t: "This isn't possible in CloudFormation.",
        why: "The Registry supports third-party resource types." }
    ],
    answer: [0],
    tip: "Third-party SaaS in templates → activate public Registry extensions."
  },
  {
    id: "ext-20", domain: "d2", topic: "Extending CloudFormation",
    q: "A team's custom resource manages an internal firewall product used by hundreds of stacks. They need drift detection, resource import and a proper schema. What should they build instead?",
    options: [
      { t: "A private resource type with the CloudFormation CLI (schema plus create, read, update, delete, list handlers) registered in the Registry.",
        why: "Correct. Registry resource types are first-class and support drift detection and import." },
      { t: "A bigger custom resource Lambda.",
        why: "Custom resources don't support drift detection or import." },
      { t: "A module.",
        why: "Modules bundle existing types; they can't call a new API." },
      { t: "A Hook.",
        why: "Hooks validate, they don't manage resources." }
    ],
    answer: [0],
    tip: "Widely reused integration with drift/import → private registry resource type."
  },
  {
    id: "ext-21", domain: "d2", topic: "Extending CloudFormation",
    q: "A stack in us-east-1 needs a value stored in an SSM parameter in ap-southeast-1 during deployment. Which approach works?",
    options: [
      { t: "A Lambda-backed custom resource that reads the parameter from ap-southeast-1 and returns it in Data.",
        why: "Correct. Custom resources can call any API in any Region; dynamic references and SSM parameter types are Region-local." },
      { t: "{{resolve:ssm:/name}} with the Region in the name.",
        why: "Dynamic references read the stack's own Region." },
      { t: "Fn::ImportValue.",
        why: "Exports are same-Region only." },
      { t: "A module.",
        why: "Modules can't read cross-Region values." }
    ],
    answer: [0],
    tip: "Cross-Region / cross-account lookups during deploy → custom resource."
  },
  {
    id: "ext-22", domain: "d2", topic: "Extending CloudFormation",
    q: "A company must roll out an approved private resource type and a Guard Hook to all accounts in its AWS Organization and all used Regions, and keep new accounts covered automatically. What is the BEST approach?",
    options: [
      { t: "Use service-managed StackSets with automatic deployment, deploying templates that register / activate the extensions (for example ResourceVersion, TypeActivation, Hook resources).",
        why: "Correct. Extensions are per account and Region; StackSets roll them out and cover new accounts." },
      { t: "Register them once in the management account.",
        why: "Registration is per account and Region." },
      { t: "Share them with AWS RAM.",
        why: "Registry extensions aren't distributed with RAM." },
      { t: "Ask every team to register them manually.",
        why: "Manual and error-prone." }
    ],
    answer: [0],
    tip: "Extensions are per account+Region → StackSets (service-managed, auto deploy)."
  },

  // ───────────────────────────── Domain 2: Rollback and Troubleshooting ─────────────────────────────
  {
    id: "rbt-01", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "A new stack failed during creation and is now in ROLLBACK_COMPLETE. The engineer fixed the template and tried update-stack, but the request was rejected. What should they do?",
    options: [
      { t: "Delete the stack and create it again with the fixed template.",
        why: "Correct. A stack in ROLLBACK_COMPLETE after a failed create can't be updated; it must be deleted and recreated." },
      { t: "Run continue-update-rollback.",
        why: "That's for UPDATE_ROLLBACK_FAILED." },
      { t: "Run drift detection, then update.",
        why: "Drift detection doesn't change the stack status." },
      { t: "Use cancel-update-stack.",
        why: "There's no update in progress." }
    ],
    answer: [0],
    tip: "ROLLBACK_COMPLETE after create → delete and recreate."
  },
  {
    id: "rbt-02", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "A stack update failed and the stack is now in UPDATE_ROLLBACK_COMPLETE. What does this mean?",
    options: [
      { t: "The update was rolled back successfully; the stack is in its previous working state and can be updated again after fixing the template.",
        why: "Correct. UPDATE_ROLLBACK_COMPLETE is a stable, healthy state." },
      { t: "The stack is broken and must be deleted.",
        why: "It's usable and updatable." },
      { t: "The stack is stuck and needs continue-update-rollback.",
        why: "That's UPDATE_ROLLBACK_FAILED." },
      { t: "All resources were deleted.",
        why: "Resources were restored to the previous configuration." }
    ],
    answer: [0],
    tip: "UPDATE_ROLLBACK_COMPLETE = back to last good state, update again."
  },
  {
    id: "rbt-03", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "During a stack update, a resource failed. While rolling back, CloudFormation couldn't restore a security group because an engineer had deleted it manually. The stack is in UPDATE_ROLLBACK_FAILED. What is the correct way to recover?",
    options: [
      { t: "Fix the cause if possible, then run continue-update-rollback; if the resource can't be restored, use --resources-to-skip for that logical ID and reconcile it later.",
        why: "Correct. continue-update-rollback retries the rollback, and skipping marks unrecoverable resources as rolled back." },
      { t: "Run update-stack with the old template.",
        why: "Updates aren't allowed in UPDATE_ROLLBACK_FAILED." },
      { t: "Delete and recreate the stack immediately.",
        why: "Possible as a last resort, but it destroys working resources; recovery should be tried first." },
      { t: "Run drift detection to fix the stack.",
        why: "Drift detection only reports differences." }
    ],
    answer: [0],
    tip: "UPDATE_ROLLBACK_FAILED → continue-update-rollback (+ --resources-to-skip)."
  },
  {
    id: "rbt-04", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "An engineer used continue-update-rollback with --resources-to-skip for a database resource. What should they be aware of afterwards?",
    options: [
      { t: "The skipped resource was only marked as rolled back, so its real configuration may not match the template; it must be checked and reconciled manually or by a later update.",
        why: "Correct. Skipping doesn't change the resource; CloudFormation just records it as rolled back." },
      { t: "The skipped resource was deleted.",
        why: "Skipping doesn't delete it." },
      { t: "The skipped resource was restored automatically.",
        why: "It was left as it was." },
      { t: "The stack can never be updated again.",
        why: "Once rollback completes, the stack can be updated." }
    ],
    answer: [0],
    tip: "--resources-to-skip = marked rolled back, not fixed → reconcile."
  },
  {
    id: "rbt-05", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "A root stack with nested stacks is in UPDATE_ROLLBACK_FAILED because a resource ServiceSg inside the nested stack AppStack can't be rolled back. How should the engineer skip it?",
    options: [
      { t: "Run continue-update-rollback on the root stack with --resources-to-skip AppStack.ServiceSg.",
        why: "Correct. Nested stack resources are skipped from the root using NestedStackLogicalId.ResourceLogicalId." },
      { t: "Run continue-update-rollback on the nested stack directly.",
        why: "Recovery is done from the root stack." },
      { t: "Delete the nested stack.",
        why: "Breaks the root stack's state." },
      { t: "Use --resources-to-skip ServiceSg on the root.",
        why: "Needs the nested stack prefix." }
    ],
    answer: [0],
    tip: "Nested skip → root stack, Child.Resource format."
  },
  {
    id: "rbt-06", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "After a CloudFormation update deploys a new Lambda version and API settings, the team wants the stack to roll back automatically if the API 5XX error alarm fires within 20 minutes of the deployment finishing. What should they configure?",
    options: [
      { t: "A rollback configuration with the 5XX CloudWatch alarm as a rollback trigger and MonitoringTimeInMinutes set to 20.",
        why: "Correct. CloudFormation watches the alarm during the update and the monitoring period, and rolls back if it fires." },
      { t: "A stack policy denying updates when errors happen.",
        why: "Stack policies don't watch alarms." },
      { t: "Termination protection.",
        why: "Only blocks stack deletion." },
      { t: "Drift detection every 20 minutes.",
        why: "Drift doesn't measure errors or roll back." }
    ],
    answer: [0],
    tip: "Roll back stack on alarm after deploy → rollback triggers + MonitoringTimeInMinutes."
  },
  {
    id: "rbt-07", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "A team wants to use 8 different CloudWatch alarms as CloudFormation rollback triggers, but the configuration is rejected. What should they do?",
    options: [
      { t: "Combine the alarms into a CloudWatch composite alarm (or a few composites) and use it as a trigger; up to 5 triggers are allowed.",
        why: "Correct. Rollback triggers accept up to 5 alarms, including composite alarms." },
      { t: "Use metrics directly instead of alarms.",
        why: "Triggers must be alarms." },
      { t: "Split the stack into 8 stacks.",
        why: "Unnecessary." },
      { t: "Request a quota increase to 10 triggers.",
        why: "Composite alarms are the intended approach." }
    ],
    answer: [0],
    tip: "Max 5 rollback triggers → composite alarm."
  },
  {
    id: "rbt-08", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "What is the maximum MonitoringTimeInMinutes for CloudFormation rollback triggers, and what does a value of 0 mean?",
    options: [
      { t: "180 minutes; 0 means alarms are monitored only while resources are being deployed, with no extra period afterwards.",
        why: "Correct." },
      { t: "60 minutes; 0 disables triggers.",
        why: "The maximum is 180, and 0 still monitors during deployment." },
      { t: "24 hours; 0 means monitor forever.",
        why: "Incorrect limits." },
      { t: "30 minutes; 0 uses the default of 30.",
        why: "Incorrect." }
    ],
    answer: [0],
    tip: "Rollback triggers: ≤5 alarms, monitoring 0–180 min."
  },
  {
    id: "rbt-09", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "Developers waste time because every failed stack creation deletes all the resources, so they can't inspect what went wrong and must wait for recreation. What should they use in development?",
    options: [
      { t: "Create stacks with --disable-rollback (or --on-failure DO_NOTHING / Preserve successfully provisioned resources), inspect the failed resources, then fix and retry or update.",
        why: "Correct. Successful resources are kept and the failure can be investigated and resumed." },
      { t: "Enable termination protection.",
        why: "Doesn't affect rollback during creation." },
      { t: "Use DeletionPolicy: Retain on everything permanently.",
        why: "Creates orphaned resources and doesn't let the stack resume." },
      { t: "Use a stack policy.",
        why: "Stack policies apply to updates." }
    ],
    answer: [0],
    tip: "Keep resources on failure → disable rollback / DO_NOTHING / preserve resources."
  },
  {
    id: "rbt-10", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "A CI pipeline creates temporary test stacks. When creation fails, the team wants the whole stack removed immediately rather than left in ROLLBACK_COMPLETE. Which option should be used?",
    options: [
      { t: "create-stack --on-failure DELETE",
        why: "Correct. The stack is deleted entirely when creation fails." },
      { t: "--on-failure DO_NOTHING",
        why: "Keeps resources." },
      { t: "--disable-rollback",
        why: "Keeps resources and the stack." },
      { t: "cancel-update-stack",
        why: "For in-progress updates." }
    ],
    answer: [0],
    tip: "Remove stack on failed create → --on-failure DELETE."
  },
  {
    id: "rbt-11", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "A CodePipeline CloudFormation deploy action keeps failing because a previous run left the stack in ROLLBACK_COMPLETE. How can the pipeline recover automatically next time?",
    options: [
      { t: "Use the CloudFormation action mode REPLACE_ON_FAILURE, which deletes a failed stack and creates it again.",
        why: "Correct. This mode handles stacks in failed states." },
      { t: "Use CREATE_UPDATE.",
        why: "Can't update a ROLLBACK_COMPLETE stack." },
      { t: "Use CHANGE_SET_EXECUTE.",
        why: "Change sets can't be executed on such a stack either." },
      { t: "Add a manual approval.",
        why: "Doesn't fix the stack state." }
    ],
    answer: [0],
    tip: "Pipeline + ROLLBACK_COMPLETE → REPLACE_ON_FAILURE."
  },
  {
    id: "rbt-12", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "A stack update is clearly going wrong and is still in UPDATE_IN_PROGRESS. How can the engineer stop it and return to the previous state?",
    options: [
      { t: "Run aws cloudformation cancel-update-stack, which cancels the update and rolls back.",
        why: "Correct. Cancel is available while the update is in progress." },
      { t: "Delete the stack.",
        why: "Destroys everything." },
      { t: "Run continue-update-rollback.",
        why: "Only for UPDATE_ROLLBACK_FAILED." },
      { t: "Disable termination protection.",
        why: "Unrelated." }
    ],
    answer: [0],
    tip: "Stop an in-progress update → cancel-update-stack."
  },
  {
    id: "rbt-13", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "A failed stack operation shows dozens of failure events, most saying 'Resource creation cancelled'. Where is the root cause most likely shown?",
    options: [
      { t: "In the first (oldest) *_FAILED event of the operation, and its status reason; for nested stacks, in the child stack's events.",
        why: "Correct. Later failures are usually cancellations triggered by the first failure." },
      { t: "In the last event.",
        why: "Usually a rollback event." },
      { t: "In the stack outputs.",
        why: "Outputs don't contain errors." },
      { t: "In the template's Description.",
        why: "Unrelated." }
    ],
    answer: [0],
    tip: "Root cause = first FAILED event (child stack for nested)."
  },
  {
    id: "rbt-14", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "A stack update fails with an AccessDenied error on an API call. The deployment uses a CloudFormation service role. How can the team find exactly which call and role were denied?",
    options: [
      { t: "Check AWS CloudTrail for the failed API call, its error code and the role that made it, then fix the service role (or iam:PassRole) permissions.",
        why: "Correct. CloudTrail records the exact denied API call and principal." },
      { t: "Run drift detection.",
        why: "Drift doesn't show permission errors." },
      { t: "Check CloudWatch metrics for the stack.",
        why: "Stacks don't emit such metrics." },
      { t: "Delete the service role so CloudFormation uses the user's permissions.",
        why: "Breaking the role can cause UPDATE_ROLLBACK_FAILED." }
    ],
    answer: [0],
    tip: "AccessDenied in stack events → CloudTrail + service role / PassRole."
  },
  {
    id: "rbt-15", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "Deleting a stack ends in DELETE_FAILED because a security group is still used by ENIs created by a Lambda function outside the stack, and the team needs the stack gone now. What can they do? (Choose TWO.)",
    multi: true,
    options: [
      { t: "Remove the dependency (for example detach or delete the outside resources using the SG) and retry the delete.",
        why: "Correct. Once the SG is no longer in use, deletion succeeds." },
      { t: "Retry the delete with --retain-resources for the security group, then clean it up later.",
        why: "Correct. The stack is deleted and the SG is left for manual cleanup." },
      { t: "Run continue-update-rollback.",
        why: "Only for UPDATE_ROLLBACK_FAILED." },
      { t: "Enable termination protection.",
        why: "Would block deletion." },
      { t: "Run cancel-update-stack.",
        why: "No update is in progress." }
    ],
    answer: [0, 1],
    tip: "DELETE_FAILED → remove dependency and retry, or --retain-resources."
  },
  {
    id: "rbt-16", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "A stack has been in CREATE_IN_PROGRESS for nearly an hour on a single resource. Which causes should be checked FIRST? ",
    options: [
      { t: "A CreationPolicy or wait condition waiting for a signal, a custom resource that never responded, or a resource waiting to stabilize (for example an ECS service).",
        why: "Correct. These are the usual causes of long waits; check cfn-init/cloud-init logs, Lambda logs and ECS events." },
      { t: "The template is too large.",
        why: "Size problems fail at validation." },
      { t: "Termination protection is enabled.",
        why: "Doesn't slow creation." },
      { t: "The stack has too many outputs.",
        why: "Outputs don't cause waits." }
    ],
    answer: [0],
    tip: "Long IN_PROGRESS → signals, custom resource responses, stabilization."
  },
  {
    id: "rbt-17", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "A stack creation fails with 'company-app-logs already exists'. What is the most likely cause?",
    options: [
      { t: "A resource with a fixed custom name (BucketName) collides with an existing bucket, possibly retained from an earlier stack; remove the custom name, change it, or import the existing resource.",
        why: "Correct. Custom names must be unique." },
      { t: "The stack lacks CAPABILITY_IAM.",
        why: "That gives a capabilities error." },
      { t: "The export name is duplicated.",
        why: "The error refers to a bucket." },
      { t: "Drift detection is running.",
        why: "Unrelated." }
    ],
    answer: [0],
    tip: "AlreadyExists → custom name conflict (often a retained resource)."
  },
  {
    id: "rbt-18", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "Rollbacks of failed creations keep leaving orphaned S3 buckets because the buckets have DeletionPolicy: Retain. The team wants retained buckets on normal deletes, but cleanup after failed creations. What should they use?",
    options: [
      { t: "DeletionPolicy: RetainExceptOnCreate (or the --retain-except-on-create stack option).",
        why: "Correct. Newly created resources are deleted on rollback of a failed create." },
      { t: "DeletionPolicy: Delete.",
        why: "Would delete buckets on normal stack deletion too." },
      { t: "UpdateReplacePolicy: Retain.",
        why: "Applies to replacement, not failed creation." },
      { t: "Termination protection.",
        why: "Unrelated." }
    ],
    answer: [0],
    tip: "No orphans after failed creates → RetainExceptOnCreate."
  },
  {
    id: "rbt-19", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "The operations team wants to be alerted automatically whenever any CloudFormation stack in the account enters UPDATE_ROLLBACK_FAILED or DELETE_FAILED. What is the BEST solution?",
    options: [
      { t: "An Amazon EventBridge rule on CloudFormation Stack Status Change events for those statuses, targeting an SNS topic.",
        why: "Correct. CloudFormation emits stack status change events to EventBridge." },
      { t: "Poll describe-stacks every minute with a script.",
        why: "Custom polling instead of events." },
      { t: "Enable drift detection.",
        why: "Doesn't report stack status changes." },
      { t: "Use rollback triggers.",
        why: "Triggers cause rollbacks; they don't send notifications about stuck stacks." }
    ],
    answer: [0],
    tip: "Alert on stack statuses → EventBridge Stack Status Change → SNS."
  },
  {
    id: "rbt-20", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "A stack update failed with rollback disabled and is now in UPDATE_FAILED. The team decides they don't want to fix forward. What should they do to return to the previous state?",
    options: [
      { t: "Run aws cloudformation rollback-stack (or choose Roll back in the console).",
        why: "Correct. A stack with preserved resources can be rolled back manually." },
      { t: "Run continue-update-rollback.",
        why: "That's for UPDATE_ROLLBACK_FAILED." },
      { t: "Delete and recreate the stack.",
        why: "Unnecessary and destructive." },
      { t: "Run cancel-update-stack.",
        why: "The update is no longer in progress." }
    ],
    answer: [0],
    tip: "Preserved failed update → retry, update, or rollback-stack."
  },
  {
    id: "rbt-21", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "Which practices reduce the chance of stacks ending in UPDATE_ROLLBACK_FAILED?",
    options: [
      { t: "Preventing manual changes to stack resources (IAM/SCP) with drift detection, keeping the CloudFormation service role stable and sufficient, and making custom resources always respond.",
        why: "Correct. Outside changes, missing permissions and silent custom resources are the main causes of failed rollbacks." },
      { t: "Using more outputs.",
        why: "Unrelated." },
      { t: "Disabling change sets.",
        why: "Change sets help prevent surprises." },
      { t: "Deleting the service role after each deployment.",
        why: "Causes permission failures during rollback." }
    ],
    answer: [0],
    tip: "Avoid stuck rollbacks: no drift, stable service role, responsive custom resources."
  },
  {
    id: "rbt-22", domain: "d2", topic: "Rollback and Troubleshooting",
    q: "A stack creation failed and then the rollback failed too, leaving the stack in ROLLBACK_FAILED. What should the engineer do?",
    options: [
      { t: "Delete the stack (retaining resources that can't be deleted, if necessary) and clean up or fix those resources manually before recreating.",
        why: "Correct. ROLLBACK_FAILED after a create can only be resolved by deleting the stack." },
      { t: "Run continue-update-rollback.",
        why: "That's for failed update rollbacks." },
      { t: "Update the stack with a fixed template.",
        why: "Updates aren't possible from this state." },
      { t: "Run rollback-stack.",
        why: "The rollback already failed; deletion is the path forward." }
    ],
    answer: [0],
    tip: "ROLLBACK_FAILED (create) → delete stack (retain stuck resources), clean up."
  },
  // ───────────────────────────── Domain 2: StackSets ─────────────────────────────
  {
    id: "sts-01", domain: "d2", topic: "StackSets",
    q: "A company uses AWS Organizations with 150 accounts. The security team must deploy an AWS Config recorder and a set of Config rules to every account in the Workloads OU, in three Regions. New accounts are created in the OU every week and must receive the same configuration with no manual steps. What is the MOST operationally efficient solution?",
    options: [
      { t: "Create a CloudFormation StackSet with service-managed permissions targeting the Workloads OU in the three Regions, with automatic deployment enabled.",
        why: "Correct. Service-managed StackSets target OUs and, with auto-deployment, create stack instances whenever an account joins the OU." },
      { t: "Create a self-managed StackSet and add each new account ID with create-stack-instances.",
        why: "Self-managed doesn't support automatic deployment; every new account needs manual role setup and instance creation." },
      { t: "Use a CodePipeline pipeline with one CloudFormation deploy action per account and Region.",
        why: "Hundreds of actions to maintain, and new accounts need pipeline edits." },
      { t: "Share the template with AWS Service Catalog and ask account owners to launch it.",
        why: "Service Catalog is self-service; it depends on people launching the product, so it isn't automatic." }
    ],
    answer: [0],
    tip: "Every new account in an OU, automatically = service-managed StackSet + auto-deployment."
  },
  {
    id: "sts-02", domain: "d2", topic: "StackSets",
    q: "A company must deploy a standard IAM audit role to 12 AWS accounts. Four of the accounts belong to a partner and are NOT part of the company's AWS Organization. The deployment must be managed centrally with CloudFormation. Which approach works?",
    options: [
      { t: "Use a StackSet with self-managed permissions: create AWSCloudFormationStackSetAdministrationRole in the admin account and AWSCloudFormationStackSetExecutionRole in each target account, trusting the admin account.",
        why: "Correct. Self-managed permissions work with any account ID, including accounts outside the organization." },
      { t: "Use a service-managed StackSet targeting the root of the organization.",
        why: "Service-managed StackSets can only target accounts inside the organization." },
      { t: "Use a service-managed StackSet with AccountFilterType UNION to add the partner account IDs.",
        why: "UNION still only applies to accounts in the organization." },
      { t: "Enable trusted access and register the partner accounts as delegated administrators.",
        why: "Delegated administrators must be member accounts of the organization, and this doesn't deploy anything to them." }
    ],
    answer: [0],
    tip: "Accounts outside the org = self-managed StackSet."
  },
  {
    id: "sts-03", domain: "d2", topic: "StackSets",
    q: "A service-managed StackSet targets the organization root with automatic deployment. The security team notices the baseline stack exists in every member account but NOT in the management account. They need the same resources in the management account. What should they do?",
    options: [
      { t: "Deploy the template to the management account with a self-managed StackSet or a regular stack, because service-managed StackSets never deploy to the management account.",
        why: "Correct. Service-managed StackSets skip the management account even when the root is targeted." },
      { t: "Add the management account ID with AccountFilterType UNION.",
        why: "Service-managed StackSets still won't create an instance in the management account." },
      { t: "Disable and re-enable trusted access with AWS Organizations.",
        why: "Trusted access isn't the issue; the management account is excluded by design." },
      { t: "Move the management account into a targeted OU.",
        why: "The management account always sits at the root and can't be moved into an OU." }
    ],
    answer: [0],
    tip: "Service-managed StackSets never deploy to the management account."
  },
  {
    id: "sts-04", domain: "d2", topic: "StackSets",
    q: "Following best practice, a company wants its platform team to manage organization-wide StackSets without signing in to the management account. What should the company do?",
    options: [
      { t: "Register the platform team's member account as a delegated administrator for CloudFormation StackSets and create service-managed StackSets from it.",
        why: "Correct. A delegated administrator can create and manage service-managed StackSets, keeping people out of the management account." },
      { t: "Create an IAM user in the management account for the platform team.",
        why: "That's still day-to-day use of the management account, which is what they want to avoid." },
      { t: "Use self-managed StackSets from the platform account with execution roles everywhere.",
        why: "It works, but loses OU targeting and automatic deployment and needs manual role setup in every account." },
      { t: "Share the StackSet with the platform account using AWS RAM.",
        why: "StackSets aren't shared through AWS RAM." }
    ],
    answer: [0],
    tip: "Avoid the management account = delegated administrator."
  },
  {
    id: "sts-05", domain: "d2", topic: "StackSets",
    q: "An engineer in a member account that is registered as a delegated administrator for StackSets runs aws cloudformation describe-stack-set for a service-managed StackSet they created, and receives StackSetNotFoundException. What is the MOST likely cause?",
    options: [
      { t: "The command is missing the --call-as DELEGATED_ADMIN parameter.",
        why: "Correct. The default is SELF; delegated admins must pass --call-as DELEGATED_ADMIN for service-managed StackSets." },
      { t: "Trusted access with AWS Organizations is disabled.",
        why: "The StackSet was created successfully, so trusted access is working." },
      { t: "The StackSet is in a different account.",
        why: "Possible in general, but the engineer created it from this account; the classic cause is the missing --call-as." },
      { t: "The engineer needs CAPABILITY_NAMED_IAM.",
        why: "Capabilities apply to templates with IAM resources, not to describe calls." }
    ],
    answer: [0],
    tip: "Delegated admin calls need --call-as DELEGATED_ADMIN."
  },
  {
    id: "sts-06", domain: "d2", topic: "StackSets",
    q: "A self-managed StackSet works for existing accounts. A newly added target account fails immediately and the stack instance shows an error that the account should have 'AWSCloudFormationStackSetExecutionRole'. What should the engineer do?",
    options: [
      { t: "Create AWSCloudFormationStackSetExecutionRole in the new account with a trust policy for the administrator account, then retry the stack instance.",
        why: "Correct. Self-managed StackSets need the execution role in every target account." },
      { t: "Enable automatic deployment on the StackSet.",
        why: "Auto-deployment is only for service-managed StackSets and doesn't create the roles." },
      { t: "Add the new account to the administration role's trust policy.",
        why: "The administration role trusts the CloudFormation service; the new account needs the execution role." },
      { t: "Increase the failure tolerance of the operation.",
        why: "That lets the operation continue past failures but doesn't fix the missing role." }
    ],
    answer: [0],
    tip: "Self-managed: execution role in every target, trusting the admin account."
  },
  {
    id: "sts-07", domain: "d2", topic: "StackSets",
    q: "A company uses self-managed StackSets. Some StackSets only deploy CloudWatch alarms, others deploy networking. Security wants each StackSet to have only the permissions it needs, and only specific teams to be able to deploy networking StackSets. What should they do?",
    options: [
      { t: "Create custom administration and execution roles per StackSet type and specify them with --administration-role-arn and --execution-role-name; restrict iam:PassRole on the networking administration role to the networking team.",
        why: "Correct. Self-managed StackSets support custom role names per StackSet for least privilege." },
      { t: "Use service-managed StackSets with one execution role per StackSet.",
        why: "Service-managed StackSets use the managed service-linked roles; you can't scope them per StackSet." },
      { t: "Give AWSCloudFormationStackSetExecutionRole AdministratorAccess and rely on CloudTrail.",
        why: "That's the opposite of least privilege." },
      { t: "Use stack policies in each target account.",
        why: "Stack policies protect resources from updates; they don't scope deployment permissions per StackSet." }
    ],
    answer: [0],
    tip: "Least privilege per StackSet = custom admin/execution roles (self-managed)."
  },
  {
    id: "sts-08", domain: "d2", topic: "StackSets",
    q: "A service-managed StackSet with automatic deployment targets the Prod OU. An account is moved from the Prod OU to the Suspended OU, which isn't targeted. The team needs the logging resources created by the StackSet to stay in that account. What should be configured?",
    options: [
      { t: "Set RetainStacksOnAccountRemoval to true in the StackSet's auto-deployment settings.",
        why: "Correct. With true, the stack stays in the account (no longer managed) when the account leaves the targeted OUs." },
      { t: "Set DeletionPolicy: Retain on the StackSet.",
        why: "DeletionPolicy is a resource attribute in a template, not a StackSet setting for account removal." },
      { t: "Disable automatic deployment before moving the account.",
        why: "That stops future auto-deployments for every account; it isn't the setting that controls retention." },
      { t: "Enable termination protection on the StackSet.",
        why: "Termination protection is set on stacks; it doesn't control what auto-deployment does when accounts leave." }
    ],
    answer: [0],
    tip: "Keep stacks when accounts leave the OU = RetainStacksOnAccountRemoval=true."
  },
  {
    id: "sts-09", domain: "d2", topic: "StackSets",
    q: "A service-managed StackSet with automatic deployment deploys a baseline to us-east-1 and eu-west-1 for all accounts in an OU. The company now also needs the baseline in ap-southeast-2. What must the engineer do?",
    options: [
      { t: "Run create-stack-instances for the targeted OUs with the ap-southeast-2 Region.",
        why: "Correct. Auto-deployment only reacts to accounts joining or leaving OUs; new Regions must be added explicitly." },
      { t: "Nothing; automatic deployment adds new Regions automatically.",
        why: "It doesn't. It deploys only to the Regions already on the StackSet." },
      { t: "Create a new StackSet in ap-southeast-2 as the home Region.",
        why: "Unnecessary; one StackSet can deploy to any number of Regions." },
      { t: "Update the template with a Region condition.",
        why: "The template doesn't decide where instances are created." }
    ],
    answer: [0],
    tip: "New Region = create-stack-instances; auto-deployment won't do it."
  },
  {
    id: "sts-10", domain: "d2", topic: "StackSets",
    q: "A StackSet must deploy to every account in the Workloads OU except one sandbox account used for experiments. New accounts in the OU should still be included. What is the correct configuration?",
    options: [
      { t: "Use service-managed DeploymentTargets with the Workloads OU, the sandbox account ID, and AccountFilterType DIFFERENCE.",
        why: "Correct. DIFFERENCE deploys to all accounts in the OU except the listed accounts." },
      { t: "Use AccountFilterType INTERSECTION with the sandbox account ID.",
        why: "INTERSECTION would deploy ONLY to the sandbox account." },
      { t: "Use AccountFilterType UNION with the sandbox account ID.",
        why: "UNION adds accounts; it doesn't exclude them." },
      { t: "Use a self-managed StackSet listing all account IDs except the sandbox.",
        why: "New accounts wouldn't be included automatically." }
    ],
    answer: [0],
    tip: "Exclude accounts from an OU = AccountFilterType DIFFERENCE."
  },
  {
    id: "sts-11", domain: "d2", topic: "StackSets",
    q: "A team updates a StackSet that has 300 stack instances across 5 Regions. They want the update to go to one Region at a time, starting with us-west-2 as a test Region, and the whole rollout must stop as soon as any single account fails. Which operation preferences meet these requirements?",
    options: [
      { t: "RegionConcurrencyType SEQUENTIAL, RegionOrder starting with us-west-2, FailureToleranceCount 0.",
        why: "Correct. Sequential Regions in the given order, and tolerance 0 stops at the first failure." },
      { t: "RegionConcurrencyType PARALLEL, FailureToleranceCount 0.",
        why: "Parallel deploys all Regions at once, so there's no test Region first." },
      { t: "RegionConcurrencyType SEQUENTIAL, FailureTolerancePercentage 10.",
        why: "This allows several failures before stopping." },
      { t: "MaxConcurrentPercentage 100 with SOFT_FAILURE_TOLERANCE.",
        why: "This maximises speed and tolerates failures, the opposite of what's asked." }
    ],
    answer: [0],
    tip: "One Region at a time + test Region first + stop on first failure = SEQUENTIAL, RegionOrder, tolerance 0."
  },
  {
    id: "sts-12", domain: "d2", topic: "StackSets",
    q: "A StackSet deploys a low-risk tagging Lambda to 800 accounts. The current update takes many hours because concurrency keeps dropping after a few account-level failures. The team accepts up to 5% failures and wants the rollout as fast as possible. What should they change?",
    options: [
      { t: "Raise MaxConcurrentPercentage, set FailureTolerancePercentage to 5, and set ConcurrencyMode to SOFT_FAILURE_TOLERANCE.",
        why: "Correct. Soft failure tolerance keeps concurrency at the configured level even when failures occur." },
      { t: "Keep STRICT_FAILURE_TOLERANCE and set FailureToleranceCount to 0.",
        why: "This makes the rollout slower and stops it at the first failure." },
      { t: "Set RegionConcurrencyType SEQUENTIAL.",
        why: "Sequential Regions slow the rollout down." },
      { t: "Split the StackSet into 800 separate stacks.",
        why: "Much more work, and loses central management." }
    ],
    answer: [0],
    tip: "Fast rollout despite some failures = higher concurrency + SOFT_FAILURE_TOLERANCE."
  },
  {
    id: "sts-13", domain: "d2", topic: "StackSets",
    q: "With STRICT_FAILURE_TOLERANCE, an engineer sets FailureToleranceCount to 2 and MaxConcurrentCount to 10, but the operation deploys to only 3 accounts at a time per Region. Why?",
    options: [
      { t: "In strict mode, the maximum concurrency is limited to the failure tolerance plus one.",
        why: "Correct. With tolerance 2, concurrency can be at most 3 in strict mode." },
      { t: "StackSets can't deploy to more than 3 accounts at a time.",
        why: "There's no such fixed limit; concurrency can be much higher." },
      { t: "RegionConcurrencyType is PARALLEL.",
        why: "Region concurrency doesn't limit accounts per Region." },
      { t: "Managed execution is disabled.",
        why: "Managed execution controls whether multiple operations run concurrently, not accounts per operation." }
    ],
    answer: [0],
    tip: "Strict mode: max concurrent is at most failure tolerance + 1."
  },
  {
    id: "sts-14", domain: "d2", topic: "StackSets",
    q: "A CI/CD pipeline updates several StackSets. Frequently, a pipeline run fails with OperationInProgressException because another StackSet operation is still running. The team wants CloudFormation to handle this automatically. What should they do?",
    options: [
      { t: "Enable managed execution (ManagedExecution Active=true) on the StackSets.",
        why: "Correct. Managed execution runs non-conflicting operations concurrently and queues conflicting ones." },
      { t: "Increase FailureToleranceCount.",
        why: "Failure tolerance is about failed stack instances, not concurrent operations." },
      { t: "Add a retry loop with sleep to the pipeline.",
        why: "This works around the problem; managed execution is the built-in solution." },
      { t: "Switch to RegionConcurrencyType PARALLEL.",
        why: "This speeds up one operation but doesn't let a second operation start." }
    ],
    answer: [0],
    tip: "OperationInProgressException on StackSets = managed execution."
  },
  {
    id: "sts-15", domain: "d2", topic: "StackSets",
    q: "A StackSet creates an IAM role named 'org-audit-role' and is deployed to us-east-1 and eu-west-1 in each account. Instances in us-east-1 succeed, but every eu-west-1 instance fails with 'org-audit-role already exists'. What should the engineer do? (Choose TWO.)",
    multi: true,
    options: [
      { t: "Deploy the IAM role StackSet to only one Region, because IAM is a global service.",
        why: "Correct. Global resources with fixed names should be created in a single Region." },
      { t: "Move Regional resources into a separate StackSet that deploys to all required Regions.",
        why: "Correct. Split global and Regional resources so each StackSet targets the right Regions." },
      { t: "Increase FailureToleranceCount so eu-west-1 is ignored.",
        why: "That hides the failure; the instances stay failed." },
      { t: "Enable automatic deployment.",
        why: "Auto-deployment doesn't change how global resources behave." },
      { t: "Use RegionConcurrencyType PARALLEL.",
        why: "The name conflict happens regardless of Region concurrency." }
    ],
    answer: [0, 1],
    tip: "Global IAM resources in a multi-Region StackSet = name conflict; deploy IAM in one Region."
  },
  {
    id: "sts-16", domain: "d2", topic: "StackSets",
    q: "Most accounts receiving a networking StackSet should use the default VPC CIDR parameter, but three accounts need different CIDR ranges. How should the engineer handle this with minimal effort?",
    options: [
      { t: "Use parameter overrides for those stack instances with update-stack-instances --parameter-overrides.",
        why: "Correct. Parameter overrides set different values for specific accounts and Regions within one StackSet." },
      { t: "Create a separate StackSet for each of the three accounts.",
        why: "Works, but more StackSets to maintain; overrides are built for this." },
      { t: "Add a Mappings section keyed by account ID and redeploy.",
        why: "Possible, but it hardcodes account IDs in the template; overrides are the StackSet feature for this." },
      { t: "Edit the stacks directly in the three accounts.",
        why: "Manual changes cause drift and are overwritten by the next StackSet update." }
    ],
    answer: [0],
    tip: "Different parameter values per account/Region = parameter overrides."
  },
  {
    id: "sts-17", domain: "d2", topic: "StackSets",
    q: "An engineer tries to delete an old StackSet with delete-stack-set and the request fails. What must be done first?",
    options: [
      { t: "Delete all stack instances from the StackSet (with or without --retain-stacks), then delete the StackSet.",
        why: "Correct. A StackSet can only be deleted when it has no stack instances." },
      { t: "Disable termination protection on the StackSet.",
        why: "This isn't why delete-stack-set fails; the StackSet still has instances." },
      { t: "Disable trusted access with AWS Organizations.",
        why: "That would break service-managed StackSets, not help delete one." },
      { t: "Delete the stacks directly in each target account.",
        why: "This leaves orphaned instances in the StackSet; use delete-stack-instances." }
    ],
    answer: [0],
    tip: "Delete StackSet = delete instances first."
  },
  {
    id: "sts-18", domain: "d2", topic: "StackSets",
    q: "A company wants to stop managing a set of logging stacks through a StackSet but must keep the deployed resources in all target accounts. What should the engineer do?",
    options: [
      { t: "Run delete-stack-instances with --retain-stacks, then delete the StackSet.",
        why: "Correct. --retain-stacks removes the instances from the StackSet while keeping the stacks and their resources." },
      { t: "Run delete-stack-instances with --no-retain-stacks.",
        why: "That deletes the stacks and their resources." },
      { t: "Set DeletionPolicy: Retain on every resource, then delete-stack-set.",
        why: "delete-stack-set still fails while instances exist, and this is more work." },
      { t: "Disable automatic deployment.",
        why: "This doesn't detach existing instances." }
    ],
    answer: [0],
    tip: "Stop managing but keep resources = delete-stack-instances --retain-stacks."
  },
  {
    id: "sts-19", domain: "d2", topic: "StackSets",
    q: "A StackSet update was stopped by failure tolerance. In the console, some stack instances now show the status OUTDATED. What does this mean and what should the engineer do?",
    options: [
      { t: "The last operation failed or was not applied for those instances; fix the root cause and re-run the update for those accounts and Regions.",
        why: "Correct. OUTDATED means the instance doesn't match the latest StackSet configuration." },
      { t: "The instances were deleted and must be recreated in a new StackSet.",
        why: "OUTDATED instances still exist; they just aren't up to date." },
      { t: "The instances drifted and need drift detection.",
        why: "Drift is a separate status (DRIFTED); OUTDATED is about failed or skipped operations." },
      { t: "The accounts were suspended.",
        why: "Suspended accounts show SKIPPED_SUSPENDED_ACCOUNT." }
    ],
    answer: [0],
    tip: "OUTDATED = last operation failed or not applied; fix and re-run."
  },
  {
    id: "sts-20", domain: "d2", topic: "StackSets",
    q: "A security baseline is deployed through a service-managed StackSet. Auditors found that administrators in some member accounts modified the baseline security group rules. The company wants to detect such changes and prevent them in the future. What should they do? (Choose the BEST combination.)",
    options: [
      { t: "Run drift detection on the StackSet to find changed resources, and apply an SCP that denies changes to the baseline resources except by the StackSets execution role.",
        why: "Correct. StackSet drift detection finds the changes; an SCP prevents member-account admins from making them." },
      { t: "Enable termination protection on the StackSet.",
        why: "Termination protection prevents stack deletion, not resource changes." },
      { t: "Set FailureToleranceCount to 0.",
        why: "Rollout setting; has nothing to do with manual changes." },
      { t: "Re-run the StackSet update every hour.",
        why: "It may overwrite some drift but doesn't detect or prevent it reliably." }
    ],
    answer: [0],
    tip: "Detect = StackSet drift detection; prevent = SCP."
  },
  {
    id: "sts-21", domain: "d2", topic: "StackSets",
    q: "A company wants developers in each account to choose and launch pre-approved infrastructure patterns (for example a standard RDS database) when they need them, with governance controls. Which service fits BEST?",
    options: [
      { t: "AWS Service Catalog with portfolios shared across the organization.",
        why: "Correct. Service Catalog is for self-service launching of approved products by end users." },
      { t: "A service-managed StackSet with automatic deployment.",
        why: "StackSets push the same resources to every account centrally; developers don't choose when to launch." },
      { t: "Self-managed StackSets per developer.",
        why: "Not self-service, and lots of manual work." },
      { t: "Service control policies.",
        why: "SCPs restrict actions; they don't provision infrastructure." }
    ],
    answer: [0],
    tip: "Push the same baseline to all = StackSets; users choose and launch = Service Catalog."
  },
  {
    id: "sts-22", domain: "d2", topic: "StackSets",
    q: "A company wants StackSet changes to go through code review and a pipeline. The StackSet definition, its target OUs and its auto-deployment settings should be version-controlled and deployed from the delegated administrator account. Which approach meets these requirements?",
    options: [
      { t: "Define the StackSet with the AWS::CloudFormation::StackSet resource in a template and deploy it from a CodePipeline pipeline in the delegated administrator account (or use the CloudFormationStackSet pipeline action).",
        why: "Correct. StackSets can be managed as code, and CodePipeline has StackSet actions for create, update and instances." },
      { t: "Create the StackSet in the console and export a screenshot for review.",
        why: "Not version-controlled or automated." },
      { t: "Use a self-managed StackSet run from a developer laptop.",
        why: "No review or pipeline, and it loses OU targeting and auto-deployment." },
      { t: "Store the template in S3 and enable S3 versioning.",
        why: "Versioning the template alone doesn't manage targets and settings or deploy them." }
    ],
    answer: [0],
    tip: "StackSets as code = AWS::CloudFormation::StackSet or the CodePipeline StackSet actions."
  },
  // ───────────────────────────── Domain 2: AWS CDK ─────────────────────────────
  {
    id: "cdk-01", domain: "d2", topic: "AWS CDK",
    q: "A development team wants to define AWS infrastructure in TypeScript, the language they already use for their application. They want to use loops, classes and reusable components, and write unit tests for the infrastructure code with their existing test framework. The infrastructure must still be deployed through AWS CloudFormation. Which solution meets these requirements?",
    options: [
      { t: "Use the AWS CDK to define the infrastructure and synthesize CloudFormation templates; test with the CDK assertions module.",
        why: "Correct. CDK lets you use a programming language and synthesizes CloudFormation, and the assertions module supports unit tests." },
      { t: "Write CloudFormation YAML templates and use the AWS::LanguageExtensions transform for loops.",
        why: "Gives loops, but not classes, reusable components or unit tests in TypeScript." },
      { t: "Use AWS SAM templates.",
        why: "SAM is YAML shorthand for serverless resources, not a programming language." },
      { t: "Use the AWS SDK for JavaScript to call the service APIs directly from a script.",
        why: "This bypasses CloudFormation, so there's no stack, rollback or drift detection." }
    ],
    answer: [0],
    tip: "Familiar language + reusable constructs + unit tests + CloudFormation = CDK."
  },
  {
    id: "cdk-02", domain: "d2", topic: "AWS CDK",
    q: "An engineer runs cdk deploy for the first time in a new AWS account and Region. The deployment fails with an error that SSM parameter /cdk-bootstrap/hnb659fds/version was not found and that the stack uses assets. What should the engineer do?",
    options: [
      { t: "Run cdk bootstrap for that account and Region, then deploy again.",
        why: "Correct. The account/Region isn't bootstrapped; cdk bootstrap creates the CDKToolkit stack (S3 bucket, ECR repo, roles, version parameter)." },
      { t: "Create the SSM parameter manually with the value 1.",
        why: "That fakes the version without creating the bucket, repository and roles." },
      { t: "Run cdk synth before cdk deploy.",
        why: "cdk deploy already synthesizes; synth doesn't create the bootstrap resources." },
      { t: "Add --require-approval never.",
        why: "Approval settings don't fix missing bootstrap resources." }
    ],
    answer: [0],
    tip: "Bootstrap version not found / assets error = cdk bootstrap that account + Region."
  },
  {
    id: "cdk-03", domain: "d2", topic: "AWS CDK",
    q: "A CDK Pipelines pipeline runs in tooling account 999999999999 and must deploy application stacks to the production account 333333333333. The prod deployment fails because the pipeline cannot assume the deployment roles in the production account. What should be done? (Choose TWO.)",
    multi: true,
    options: [
      { t: "Bootstrap the production account with cdk bootstrap --trust 999999999999 --cloudformation-execution-policies <policy>.",
        why: "Correct. --trust lets the pipeline account assume the deploy and publishing roles in the target account." },
      { t: "Set crossAccountKeys: true on the CodePipeline construct so artifacts are encrypted with a KMS key the target account can use.",
        why: "Correct. Cross-account deployments need KMS-encrypted artifacts." },
      { t: "Create an IAM user in the production account and store its keys in the pipeline.",
        why: "Long-term keys are insecure, and CDK uses the bootstrap roles instead." },
      { t: "Enable trusted access for CloudFormation StackSets.",
        why: "That's for StackSets, not CDK Pipelines." },
      { t: "Run cdk deploy --hotswap from the pipeline.",
        why: "Hotswap bypasses CloudFormation and is for development only." }
    ],
    answer: [0, 1],
    tip: "Cross-account CDK = target bootstrapped with --trust + crossAccountKeys: true."
  },
  {
    id: "cdk-04", domain: "d2", topic: "AWS CDK",
    q: "A team wants to see, before deploying, whether a CDK code change will replace any resources or broaden IAM permissions compared with what is currently deployed. Which command should they run?",
    options: [
      { t: "cdk diff",
        why: "Correct. cdk diff compares the synthesized template with the deployed stack and highlights replacements and IAM / security group changes." },
      { t: "cdk synth",
        why: "Synth only produces templates; it doesn't compare with the deployed stack." },
      { t: "cdk ls",
        why: "Lists stacks only." },
      { t: "cdk doctor",
        why: "Checks the local CDK environment, not stack changes." }
    ],
    answer: [0],
    tip: "What will change vs deployed (replacements, IAM) = cdk diff."
  },
  {
    id: "cdk-05", domain: "d2", topic: "AWS CDK",
    q: "During a refactor, a developer renamed the construct ID of a DynamoDB table from 'OrdersTable' to 'Orders'. cdk diff now shows the table will be destroyed and a new table created. The table holds production data. What is the BEST way to refactor without replacing the table?",
    options: [
      { t: "Keep the original construct ID, or call overrideLogicalId on the underlying CfnTable to keep the original logical ID.",
        why: "Correct. The logical ID comes from the construct path; keeping it stable avoids replacement." },
      { t: "Deploy with --require-approval never.",
        why: "This only skips the prompt; the table is still replaced." },
      { t: "Set RemovalPolicy.RETAIN and deploy.",
        why: "The old table would be retained but orphaned, and a new empty table created; the app would point at the new one." },
      { t: "Use cdk deploy --hotswap.",
        why: "Hotswap doesn't apply to DynamoDB tables and is for development only." }
    ],
    answer: [0],
    tip: "Renamed construct id → new logical ID → replacement; keep the id or overrideLogicalId."
  },
  {
    id: "cdk-06", domain: "d2", topic: "AWS CDK",
    q: "An L2 construct in aws-cdk-lib does not yet expose a property that was recently added to the underlying CloudFormation resource. The team needs to set this property now without waiting for a CDK release. What should they do?",
    options: [
      { t: "Use an escape hatch: get the L1 resource with node.defaultChild and use addPropertyOverride to set the property.",
        why: "Correct. Escape hatches give access to the underlying CloudFormation resource, and raw overrides work even if the L1 class lacks the property." },
      { t: "Rewrite the whole stack in CloudFormation YAML.",
        why: "Unnecessary; escape hatches solve this inside CDK." },
      { t: "Create a custom resource to set the property after deployment.",
        why: "More complex and it fights CloudFormation's management of the resource." },
      { t: "Use an L3 construct instead.",
        why: "L3 patterns are built on L2s and won't expose the new property either." }
    ],
    answer: [0],
    tip: "Missing property = escape hatch (node.defaultChild / addPropertyOverride)."
  },
  {
    id: "cdk-07", domain: "d2", topic: "AWS CDK",
    q: "Which statement correctly describes AWS CDK construct levels?",
    options: [
      { t: "L1 constructs map one-to-one to CloudFormation resources (Cfn prefix); L2 constructs add defaults and helper methods; L3 constructs are patterns that combine several resources.",
        why: "Correct. For example CfnBucket (L1), Bucket with grantRead (L2), ApplicationLoadBalancedFargateService (L3)." },
      { t: "L1 constructs are the highest-level patterns and L3 constructs are raw CloudFormation resources.",
        why: "Reversed: L1 is the lowest level." },
      { t: "L2 constructs are only available in TypeScript.",
        why: "All construct levels are available in every supported language." },
      { t: "L3 constructs deploy without CloudFormation.",
        why: "All constructs synthesize to CloudFormation." }
    ],
    answer: [0],
    tip: "L1 = Cfn* raw · L2 = curated · L3 = patterns."
  },
  {
    id: "cdk-08", domain: "d2", topic: "AWS CDK",
    q: "A team wants a complete Fargate service behind an Application Load Balancer, with a cluster, task definition, service, load balancer, listener and security groups, using as little code as possible. Which CDK construct type should they use?",
    options: [
      { t: "An L3 pattern such as ecs_patterns.ApplicationLoadBalancedFargateService.",
        why: "Correct. L3 patterns wire several resources together for common architectures." },
      { t: "Only L1 Cfn* constructs.",
        why: "Possible, but it requires the most code and no defaults." },
      { t: "A custom resource backed by Lambda.",
        why: "Unnecessary; native constructs exist." },
      { t: "A CloudFormation macro.",
        why: "Macros transform templates; CDK patterns already provide this." }
    ],
    answer: [0],
    tip: "Whole architecture in a few lines = L3 pattern."
  },
  {
    id: "cdk-09", domain: "d2", topic: "AWS CDK",
    q: "A stack uses ec2.Vpc.fromLookup() to find an existing VPC. cdk synth fails with an error that the context provider cannot be used because the stack is environment-agnostic. What should the developer do?",
    options: [
      { t: "Specify env with an explicit account and Region on the stack.",
        why: "Correct. Lookups need a concrete environment to query." },
      { t: "Run cdk bootstrap.",
        why: "Bootstrapping doesn't make a stack environment-aware." },
      { t: "Replace fromLookup with a CfnParameter.",
        why: "Possible workaround, but it doesn't fix the cause; CDK prefers synth-time values." },
      { t: "Delete cdk.context.json.",
        why: "The cache isn't the problem; the stack has no environment." }
    ],
    answer: [0],
    tip: "Lookups (fromLookup) need an explicit env (account + Region)."
  },
  {
    id: "cdk-10", domain: "d2", topic: "AWS CDK",
    q: "A CDK app uses Vpc.fromLookup and an AMI lookup. Templates synthesized in the CI pipeline sometimes differ from those synthesized on developer laptops, and the pipeline's build role needs extra permissions for lookups. What should the team do?",
    options: [
      { t: "Commit cdk.context.json to source control so lookup results are cached and synthesis is deterministic.",
        why: "Correct. Cached context makes synth repeatable and avoids live lookups in the pipeline." },
      { t: "Add cdk.context.json to .gitignore.",
        why: "That causes the inconsistency described." },
      { t: "Run cdk context --clear in every pipeline run.",
        why: "That forces fresh lookups, making synth less predictable." },
      { t: "Use environment-agnostic stacks.",
        why: "Then lookups don't work at all." }
    ],
    answer: [0],
    tip: "Deterministic synth = commit cdk.context.json."
  },
  {
    id: "cdk-11", domain: "d2", topic: "AWS CDK",
    q: "After running cdk destroy on a development stack, the team finds the S3 bucket created by the stack still exists. They want development buckets, including their objects, to be removed automatically on destroy. What should they configure?",
    options: [
      { t: "removalPolicy: RemovalPolicy.DESTROY and autoDeleteObjects: true on the bucket.",
        why: "Correct. Stateful resources default to RETAIN; autoDeleteObjects adds a custom resource that empties the bucket so it can be deleted." },
      { t: "Enable termination protection on the stack.",
        why: "That prevents stack deletion; it doesn't delete buckets." },
      { t: "Use RemovalPolicy.SNAPSHOT.",
        why: "SNAPSHOT is for resources like RDS and EBS." },
      { t: "Run cdk destroy --force.",
        why: "--force skips the confirmation prompt; it doesn't change the retain policy." }
    ],
    answer: [0],
    tip: "Bucket remains after destroy = default RETAIN; dev: DESTROY + autoDeleteObjects."
  },
  {
    id: "cdk-12", domain: "d2", topic: "AWS CDK",
    q: "A company needs every S3 bucket defined in any CDK app to have encryption and versioning enabled. Violations should be caught before deployment, during synthesis, across all constructs including those from shared libraries. What should they implement?",
    options: [
      { t: "An Aspect (for example cdk-nag or a custom aspect) applied to the app that adds error annotations for non-compliant buckets.",
        why: "Correct. Aspects visit every construct in the tree, and errors fail synth." },
      { t: "An AWS Config rule.",
        why: "Config is detective and evaluates resources after deployment." },
      { t: "A code review checklist.",
        why: "Manual and unreliable." },
      { t: "A stack policy.",
        why: "Stack policies protect resources from updates; they don't validate configuration." }
    ],
    answer: [0],
    tip: "Enforce rules across all constructs at synth = Aspects / cdk-nag."
  },
  {
    id: "cdk-13", domain: "d2", topic: "AWS CDK",
    q: "A CDK app needs a database password. A developer hardcoded the password as a string in the stack code. What is the MOST secure way to fix this?",
    options: [
      { t: "Store the password in AWS Secrets Manager and reference it with SecretValue.secretsManager(), which becomes a CloudFormation dynamic reference.",
        why: "Correct. The secret isn't stored in code or in the synthesized template in plain text." },
      { t: "Move the password into cdk.json context.",
        why: "Still in source control and in the template." },
      { t: "Pass the password as a CfnParameter with a default value.",
        why: "The default value is visible in the template." },
      { t: "Base64-encode the password in the code.",
        why: "Encoding isn't encryption." }
    ],
    answer: [0],
    tip: "Secrets in CDK = SecretValue.secretsManager (dynamic reference)."
  },
  {
    id: "cdk-14", domain: "d2", topic: "AWS CDK",
    q: "A team's CI job runs cdk deploy, but it hangs and times out, waiting for confirmation of IAM security changes. The team reviews IAM changes in pull requests using cdk diff output. What should they change in the CI job?",
    options: [
      { t: "Run cdk deploy --require-approval never.",
        why: "Correct. The default 'broadening' prompts on IAM/SG broadening; 'never' disables the interactive prompt for CI." },
      { t: "Run cdk deploy --hotswap.",
        why: "Hotswap bypasses CloudFormation and is for development only." },
      { t: "Run cdk synth instead of deploy.",
        why: "Synth doesn't deploy." },
      { t: "Remove all IAM resources from the app.",
        why: "Not practical and doesn't address the prompt." }
    ],
    answer: [0],
    tip: "CI hangs on approval = --require-approval never (default broadening)."
  },
  {
    id: "cdk-15", domain: "d2", topic: "AWS CDK",
    q: "Developers want to iterate quickly on a Lambda function's code in their personal development stack. A full CloudFormation deployment takes several minutes for each change. Which option gives the fastest feedback, and where is it appropriate?",
    options: [
      { t: "cdk watch or cdk deploy --hotswap, only in development environments, because they update resources directly and bypass CloudFormation.",
        why: "Correct. Hotswap is fast but causes drift, so it's not for production." },
      { t: "cdk deploy --hotswap in all environments, including production.",
        why: "Hotswap skips change sets and rollback, and causes drift in production." },
      { t: "cdk synth --fast.",
        why: "There's no such option, and synth doesn't deploy." },
      { t: "cdk diff --deploy.",
        why: "Not a real option." }
    ],
    answer: [0],
    tip: "Fast dev iteration = cdk watch / --hotswap (dev only)."
  },
  {
    id: "cdk-16", domain: "d2", topic: "AWS CDK",
    q: "A team builds a pipeline with CDK Pipelines. Later, they add a new deployment stage for a staging account in the pipeline code and push the change to the repository. What happens?",
    options: [
      { t: "The UpdatePipeline (self-mutation) stage deploys the updated pipeline stack, then the pipeline restarts with the new stage.",
        why: "Correct. CDK Pipelines are self-mutating; only the first deployment of the pipeline stack is manual." },
      { t: "Nothing; someone must run cdk deploy PipelineStack manually again.",
        why: "Only the first deployment is manual." },
      { t: "The pipeline fails because its structure changed.",
        why: "Self-mutation handles structural changes." },
      { t: "The new stage deploys only after the pipeline is deleted and recreated.",
        why: "No recreation is needed." }
    ],
    answer: [0],
    tip: "CDK Pipelines self-mutation: pipeline code changes update the pipeline itself."
  },
  {
    id: "cdk-17", domain: "d2", topic: "AWS CDK",
    q: "In a CDK Pipelines pipeline, what is the correct order of the stages created by default?",
    options: [
      { t: "Source → Build (synth) → UpdatePipeline → Assets → application stages",
        why: "Correct. Synth produces cdk.out, the pipeline updates itself, assets are published, then stages deploy." },
      { t: "Source → Assets → Build → application stages → UpdatePipeline",
        why: "Assets need the synth output, and the pipeline updates itself before deploying." },
      { t: "Build → Source → application stages",
        why: "Source always comes first." },
      { t: "Source → application stages → Build → Assets",
        why: "Stages can't deploy before synth and asset publishing." }
    ],
    answer: [0],
    tip: "Source → Synth → UpdatePipeline → Assets → Stages."
  },
  {
    id: "cdk-18", domain: "d2", topic: "AWS CDK",
    q: "A CDK Pipelines pipeline must deploy the same application stage to us-east-1, eu-west-1 and ap-southeast-1 at the same time after the staging stage succeeds, and require a manual approval before production. How should the pipeline be defined?",
    options: [
      { t: "Use pipeline.addWave() containing the three Regional stages, with a ManualApprovalStep as a pre step.",
        why: "Correct. Waves deploy stages in parallel, and pre steps run before the stages." },
      { t: "Call addStage() three times.",
        why: "Separate addStage() calls run one after another." },
      { t: "Create three separate pipelines.",
        why: "More to maintain and harder to coordinate approvals." },
      { t: "Use a StackSet inside the pipeline.",
        why: "Possible for org-wide baselines, but waves are the CDK Pipelines feature for parallel stages." }
    ],
    answer: [0],
    tip: "Parallel stages in CDK Pipelines = addWave(); approval = ManualApprovalStep in pre."
  },
  {
    id: "cdk-19", domain: "d2", topic: "AWS CDK",
    q: "After a stage deploys an API in a CDK Pipelines pipeline, the team wants to run integration tests against the deployed API URL before the pipeline continues. How should they do this?",
    options: [
      { t: "Add a ShellStep (or CodeBuildStep) as a post step of the stage and use envFromCfnOutputs to pass the API URL output to the test.",
        why: "Correct. Post steps run after the stage deploys, and envFromCfnOutputs exposes stack outputs as environment variables." },
      { t: "Run the tests in the synth step.",
        why: "The API isn't deployed yet at synth time." },
      { t: "Hardcode the API URL in the test script.",
        why: "Fragile; the URL changes between environments." },
      { t: "Use a CloudFormation rollback trigger.",
        why: "Rollback triggers watch alarms, they don't run test scripts." }
    ],
    answer: [0],
    tip: "Tests after deploy = post ShellStep + envFromCfnOutputs."
  },
  {
    id: "cdk-20", domain: "d2", topic: "AWS CDK",
    q: "A team wants unit tests that confirm a CDK stack creates an S3 bucket with versioning enabled and exactly one Lambda function, and that fail when someone unintentionally changes the template. Which approach is BEST?",
    options: [
      { t: "Use the aws-cdk-lib/assertions module (Template.fromStack, hasResourceProperties, resourceCountIs) plus snapshot tests.",
        why: "Correct. Fine-grained assertions check specific properties, and snapshots catch unexpected changes." },
      { t: "Deploy to production and check the console.",
        why: "Manual and too late." },
      { t: "Run cdk diff against production in every test.",
        why: "Diff shows differences but isn't a unit test." },
      { t: "Use AWS Config rules.",
        why: "Config evaluates deployed resources, not code." }
    ],
    answer: [0],
    tip: "CDK unit tests = assertions module + snapshot tests."
  },
  {
    id: "cdk-21", domain: "d2", topic: "AWS CDK",
    q: "Stack A in a CDK app passes its bucket to Stack B, which reads from it. Later, the team removes the code in Stack B that uses the bucket, and the deployment of Stack A fails because an export is still in use. What should they do?",
    options: [
      { t: "Keep the export temporarily in Stack A with this.exportValue(), deploy Stack B without the reference, then remove the export in a second deployment.",
        why: "Correct. This two-step approach avoids the 'deadly embrace' between automatically created exports and imports." },
      { t: "Delete Stack B and recreate it.",
        why: "Disruptive and unnecessary." },
      { t: "Use cdk deploy --force.",
        why: "This doesn't bypass CloudFormation's export-in-use check." },
      { t: "Manually delete the export in the CloudFormation console.",
        why: "You can't delete an export that's still imported." }
    ],
    answer: [0],
    tip: "Export in use when removing a cross-stack reference = exportValue + two-step deploy."
  },
  {
    id: "cdk-22", domain: "d2", topic: "AWS CDK",
    q: "A company has many existing CloudFormation templates and wants to move to CDK. They also have an S3 bucket created manually that must now be managed by a CDK stack without being recreated. Which tools should they use? (Choose the BEST match.)",
    options: [
      { t: "cdk migrate to generate CDK code from the existing templates or stacks, and cdk import to bring the manually created bucket under the stack's management.",
        why: "Correct. cdk migrate converts templates into a CDK app, and cdk import uses CloudFormation resource import." },
      { t: "Bucket.fromBucketName for the bucket, which makes CDK manage it.",
        why: "fromBucketName only references the bucket; it isn't managed by the stack." },
      { t: "cdk synth --import.",
        why: "Not a real option." },
      { t: "Delete the bucket and let CDK recreate it.",
        why: "The data would be lost." }
    ],
    answer: [0],
    tip: "Convert CFN → CDK = cdk migrate; manage existing resource = cdk import (fromXxx only references)."
  },
  // ───────────────────────────── Domain 2: AWS SAM ─────────────────────────────
  {
    id: "sam-01", domain: "d2", topic: "AWS SAM",
    q: "A team is building a serverless application with Lambda functions, an API Gateway API and a DynamoDB table. They want concise infrastructure as code, the ability to test functions and API routes on their laptops before deploying, and deployments through AWS CloudFormation. Which approach meets these requirements with the LEAST effort?",
    options: [
      { t: "Use AWS SAM templates and the SAM CLI (sam local for testing, sam deploy for CloudFormation deployments).",
        why: "Correct. SAM provides short serverless resource types, local testing with sam local, and deploys through CloudFormation." },
      { t: "Write plain CloudFormation templates and test by deploying to a dev account each time.",
        why: "Longer templates and no local testing." },
      { t: "Use the AWS CLI to create the functions and API directly.",
        why: "No infrastructure as code or CloudFormation." },
      { t: "Use AWS Elastic Beanstalk.",
        why: "Beanstalk runs applications on EC2 or containers, not Lambda-based serverless apps." }
    ],
    answer: [0],
    tip: "Serverless + short IaC + local testing + CloudFormation = SAM."
  },
  {
    id: "sam-02", domain: "d2", topic: "AWS SAM",
    q: "An engineer deploys a template containing AWS::Serverless::Function resources through the CloudFormation console, and the stack creation fails because CloudFormation doesn't recognise the resource type. What is MOST likely missing from the template?",
    options: [
      { t: "Transform: AWS::Serverless-2016-10-31",
        why: "Correct. The SAM transform tells CloudFormation to expand AWS::Serverless::* resources into standard resources." },
      { t: "A Globals section.",
        why: "Globals are optional." },
      { t: "AWSTemplateFormatVersion.",
        why: "Optional, and not what makes SAM types work." },
      { t: "A Metadata section.",
        why: "Metadata isn't required for SAM resources." }
    ],
    answer: [0],
    tip: "SAM template = Transform: AWS::Serverless-2016-10-31 (required)."
  },
  {
    id: "sam-03", domain: "d2", topic: "AWS SAM",
    q: "A CodePipeline pipeline deploys a SAM template with a CloudFormation deploy action. The action fails with 'Requires capabilities : [CAPABILITY_AUTO_EXPAND]'. What should the engineer do?",
    options: [
      { t: "Add CAPABILITY_AUTO_EXPAND (and CAPABILITY_IAM for the generated roles) to the action's capabilities.",
        why: "Correct. Templates with transforms or nested applications need CAPABILITY_AUTO_EXPAND." },
      { t: "Remove the Transform line.",
        why: "Then the SAM resources can't be processed." },
      { t: "Grant the pipeline role cloudformation:* permissions.",
        why: "This is a capability acknowledgement, not a permission problem." },
      { t: "Switch to sam sync.",
        why: "sam sync is for development, not pipeline deployments." }
    ],
    answer: [0],
    tip: "CAPABILITY_AUTO_EXPAND error = add it (+ CAPABILITY_IAM)."
  },
  {
    id: "sam-04", domain: "d2", topic: "AWS SAM",
    q: "A pipeline's CloudFormation action deploys template.yaml directly from the source repository. The SAM function uses CodeUri: src/handler/. The deployment fails because CloudFormation can't find the code. What should be added to the pipeline?",
    options: [
      { t: "A CodeBuild step that runs sam build and sam package (or aws cloudformation package) to upload the code to S3 and produce a packaged template, then deploy the packaged template.",
        why: "Correct. Packaging uploads local artifacts to S3 and rewrites CodeUri to S3 URIs that CloudFormation can use." },
      { t: "Change CodeUri to an absolute local path.",
        why: "CloudFormation can't read any local file system path." },
      { t: "Zip the repository and attach it to the CloudFormation action.",
        why: "CloudFormation still needs S3 URIs in the template." },
      { t: "Use InlineCode for all functions.",
        why: "Inline code is limited in size and doesn't support dependencies." }
    ],
    answer: [0],
    tip: "Local CodeUri → package first (sam package / aws cloudformation package)."
  },
  {
    id: "sam-05", domain: "d2", topic: "AWS SAM",
    q: "Developers build a Python SAM application on macOS. The function depends on a library with compiled C extensions. After deployment, the function fails with an 'invalid ELF header' import error. What should they change?",
    options: [
      { t: "Run sam build --use-container so dependencies are built in a Lambda-compatible Amazon Linux container.",
        why: "Correct. Native dependencies must be compiled for the Lambda runtime environment." },
      { t: "Increase the function memory.",
        why: "Memory doesn't fix binary incompatibility." },
      { t: "Use sam sync instead of sam deploy.",
        why: "sam sync uploads the same incompatible build." },
      { t: "Switch the function architecture to x86_64.",
        why: "The binary was built for macOS, not Linux, so changing architecture doesn't help." }
    ],
    answer: [0],
    tip: "Native deps fail in Lambda = sam build --use-container."
  },
  {
    id: "sam-06", domain: "d2", topic: "AWS SAM",
    q: "A developer wants to test API routes defined in a SAM template locally with curl, iterating on the Lambda code without redeploying. Which command should they use?",
    options: [
      { t: "sam local start-api",
        why: "Correct. It starts a local API Gateway emulator (default port 3000) that routes requests to the functions." },
      { t: "sam local start-lambda",
        why: "That emulates the Lambda Invoke API, not HTTP routes." },
      { t: "sam deploy --guided",
        why: "That deploys to AWS." },
      { t: "sam logs --tail",
        why: "That reads CloudWatch Logs from deployed functions." }
    ],
    answer: [0],
    tip: "Local HTTP API routes = sam local start-api (port 3000)."
  },
  {
    id: "sam-07", domain: "d2", topic: "AWS SAM",
    q: "A team has automated integration tests that use the AWS SDK to invoke Lambda functions. They want to run these tests against local versions of the functions defined in their SAM template, without deploying. What should they do?",
    options: [
      { t: "Run sam local start-lambda and configure the SDK client endpoint to http://127.0.0.1:3001.",
        why: "Correct. start-lambda emulates the Lambda Invoke endpoint for SDK and CLI calls." },
      { t: "Run sam local start-api and call the functions through HTTP.",
        why: "The tests use the Lambda Invoke API, not HTTP routes." },
      { t: "Run sam local invoke for each test manually.",
        why: "Not suitable for automated SDK-based tests." },
      { t: "Use sam remote invoke.",
        why: "That invokes deployed functions in AWS." }
    ],
    answer: [0],
    tip: "SDK / automated tests against local functions = sam local start-lambda (port 3001)."
  },
  {
    id: "sam-08", domain: "d2", topic: "AWS SAM",
    q: "A developer needs to test a Lambda function that processes S3 object-created events, using sam local invoke. What is the FASTEST way to get a realistic event payload?",
    options: [
      { t: "Run sam local generate-event s3 put and pass the output to sam local invoke -e.",
        why: "Correct. generate-event creates sample payloads for many event sources." },
      { t: "Deploy the function and copy an event from CloudWatch Logs.",
        why: "Slow and requires deployment." },
      { t: "Write the JSON event by hand from the documentation.",
        why: "Possible but slower and error-prone." },
      { t: "Use sam local start-api.",
        why: "That's for API Gateway requests, not S3 events." }
    ],
    answer: [0],
    tip: "Sample event payloads = sam local generate-event."
  },
  {
    id: "sam-09", domain: "d2", topic: "AWS SAM",
    q: "A function works when run with sam local invoke on a developer's laptop, but after deployment it fails with AccessDeniedException when writing to a DynamoDB table. What is the MOST likely cause?",
    options: [
      { t: "sam local runs with the developer's own credentials; the deployed function's IAM role doesn't have permission. Add a policy such as DynamoDBCrudPolicy to the function's Policies.",
        why: "Correct. Local testing doesn't enforce the function's execution role." },
      { t: "The table doesn't exist locally.",
        why: "Local runs call the real table, so the table isn't the issue." },
      { t: "Docker blocked the network call.",
        why: "The local call succeeded, so Docker isn't the problem." },
      { t: "The function needs more memory.",
        why: "AccessDenied is a permissions error." }
    ],
    answer: [0],
    tip: "Works locally, AccessDenied in AWS = local uses your credentials; fix function Policies."
  },
  {
    id: "sam-10", domain: "d2", topic: "AWS SAM",
    q: "A developer runs sam local invoke on a new laptop and receives an error that running AWS SAM projects locally requires Docker. What should they do?",
    options: [
      { t: "Install and start Docker (or a compatible container runtime).",
        why: "Correct. sam local runs functions inside containers that emulate the Lambda runtime." },
      { t: "Run sam build --use-container first.",
        why: "That also requires Docker." },
      { t: "Configure AWS credentials.",
        why: "Credentials don't replace the container runtime." },
      { t: "Deploy the function first.",
        why: "Local testing is meant to avoid deploying." }
    ],
    answer: [0],
    tip: "sam local needs Docker."
  },
  {
    id: "sam-11", domain: "d2", topic: "AWS SAM",
    q: "A company wants new versions of a Lambda function deployed with SAM to receive 10% of traffic for 10 minutes before the rest, and to roll back automatically if a CloudWatch error alarm goes into ALARM. Which template configuration achieves this with the LEAST effort?",
    options: [
      { t: "Set AutoPublishAlias: live and DeploymentPreference with Type: Canary10Percent10Minutes and Alarms listing the error alarm.",
        why: "Correct. SAM creates the version, alias and CodeDeploy resources, and alarms trigger automatic rollback." },
      { t: "Manually define AWS::CodeDeploy::Application and DeploymentGroup resources and a separate CodeDeploy pipeline action.",
        why: "Works, but much more effort than DeploymentPreference." },
      { t: "Use weighted Route 53 records between two functions.",
        why: "Lambda traffic shifting is done with aliases, not DNS." },
      { t: "Use sam sync with a 10% option.",
        why: "sam sync has no traffic shifting." }
    ],
    answer: [0],
    tip: "Lambda canary in SAM = AutoPublishAlias + DeploymentPreference + Alarms."
  },
  {
    id: "sam-12", domain: "d2", topic: "AWS SAM",
    q: "An engineer adds DeploymentPreference: { Type: Linear10PercentEvery1Minute } to a SAM function, but the deployment doesn't shift traffic gradually. What is MOST likely missing?",
    options: [
      { t: "AutoPublishAlias on the function.",
        why: "Correct. DeploymentPreference needs an alias, which AutoPublishAlias creates and updates." },
      { t: "A Globals section.",
        why: "Globals are optional." },
      { t: "An API Gateway event.",
        why: "Traffic shifting doesn't depend on the event source." },
      { t: "CAPABILITY_NAMED_IAM.",
        why: "Capabilities affect whether the stack deploys, not the traffic shifting." }
    ],
    answer: [0],
    tip: "DeploymentPreference requires AutoPublishAlias."
  },
  {
    id: "sam-13", domain: "d2", topic: "AWS SAM",
    q: "A SAM function uses DeploymentPreference with a PreTraffic hook function. Every deployment waits for a long time and then fails, even though the hook's tests pass. What is the MOST likely cause?",
    options: [
      { t: "The hook function doesn't call codedeploy:PutLifecycleEventHookExecutionStatus to report Succeeded.",
        why: "Correct. CodeDeploy waits for the hook to report its status and fails the deployment when it times out." },
      { t: "PreTraffic hooks aren't supported for Lambda.",
        why: "They are supported." },
      { t: "The alarm list is empty.",
        why: "Alarms are optional." },
      { t: "The function uses arm64.",
        why: "Architecture doesn't affect hooks." }
    ],
    answer: [0],
    tip: "Hooks must call PutLifecycleEventHookExecutionStatus."
  },
  {
    id: "sam-14", domain: "d2", topic: "AWS SAM",
    q: "A SAM template has 25 Lambda functions that all use the same runtime, timeout, memory size, tracing setting and environment variable for the table name. The team wants to remove the repetition. What should they use?",
    options: [
      { t: "The Globals section with a Function block.",
        why: "Correct. Globals define shared properties for all functions; individual functions can override them." },
      { t: "A nested stack per function.",
        why: "Adds complexity without removing the repetition." },
      { t: "CloudFormation Mappings.",
        why: "Mappings provide lookup values, but each function would still repeat the properties." },
      { t: "A Lambda layer.",
        why: "Layers share code and libraries, not configuration properties." }
    ],
    answer: [0],
    tip: "Repeated function properties = Globals."
  },
  {
    id: "sam-15", domain: "d2", topic: "AWS SAM",
    q: "A SAM function reads from one S3 bucket and writes to one DynamoDB table. The security team wants least-privilege permissions without developers writing IAM policy JSON. Which options meet this requirement? (Choose TWO.)",
    multi: true,
    options: [
      { t: "Use SAM policy templates such as S3ReadPolicy and DynamoDBCrudPolicy in the function's Policies, scoped to the bucket and table.",
        why: "Correct. Policy templates generate scoped IAM statements." },
      { t: "Use AWS::Serverless::Connector resources between the function and the bucket and table.",
        why: "Correct. Connectors generate the required permissions between resources." },
      { t: "Attach AdministratorAccess to the function role.",
        why: "Not least privilege." },
      { t: "Attach AmazonS3FullAccess and AmazonDynamoDBFullAccess.",
        why: "Too broad." },
      { t: "Give the function no role and use the developer's credentials.",
        why: "Every Lambda function needs an execution role." }
    ],
    answer: [0, 1],
    tip: "Least privilege without IAM JSON = SAM policy templates / Connectors."
  },
  {
    id: "sam-16", domain: "d2", topic: "AWS SAM",
    q: "A SAM function has an S3 event that references a bucket created in a different CloudFormation stack. sam deploy fails with an error about the event source. What is the cause?",
    options: [
      { t: "The SAM S3 event type requires the bucket to be defined in the same template.",
        why: "Correct. For buckets in other stacks, configure the notification separately (for example with EventBridge or a custom resource)." },
      { t: "S3 can't trigger Lambda functions.",
        why: "It can." },
      { t: "The function needs a VPC configuration.",
        why: "Unrelated to S3 events." },
      { t: "The bucket must have versioning enabled.",
        why: "Not required for event notifications." }
    ],
    answer: [0],
    tip: "SAM S3 event = bucket in the same template."
  },
  {
    id: "sam-17", domain: "d2", topic: "AWS SAM",
    q: "A team deploys the same SAM application to dev and prod with different stack names, parameter values and change set confirmation settings. They want repeatable deployments from the command line without typing the options each time. What should they use?",
    options: [
      { t: "samconfig.toml with separate [default] and [prod] environments, deploying prod with sam deploy --config-env prod.",
        why: "Correct. samconfig.toml stores per-environment deploy settings." },
      { t: "Two copies of template.yaml.",
        why: "Duplicates the template and causes drift between environments." },
      { t: "Environment variables in Globals.",
        why: "Those configure the functions, not the deployment options." },
      { t: "A shell script with hardcoded secrets.",
        why: "Insecure and harder to maintain." }
    ],
    answer: [0],
    tip: "Per-environment deploy settings = samconfig.toml + --config-env."
  },
  {
    id: "sam-18", domain: "d2", topic: "AWS SAM",
    q: "A CodeBuild job runs sam deploy on every commit. When a commit doesn't change the infrastructure or code, the job fails because the change set contains no changes. How should the team fix this?",
    options: [
      { t: "Add --no-fail-on-empty-changeset to the sam deploy command.",
        why: "Correct. The command then succeeds when there's nothing to deploy." },
      { t: "Add --no-execute-changeset.",
        why: "That stops all deployments from executing." },
      { t: "Use sam sync in CI.",
        why: "sam sync is for development." },
      { t: "Delete and recreate the stack every time.",
        why: "Disruptive and unnecessary." }
    ],
    answer: [0],
    tip: "CI fails on empty change set = --no-fail-on-empty-changeset."
  },
  {
    id: "sam-19", domain: "d2", topic: "AWS SAM",
    q: "Developers find that every code change to their development SAM stack takes several minutes to deploy through CloudFormation. They want code changes to appear in their dev environment within seconds while they work. What should they use, and where?",
    options: [
      { t: "sam sync --watch, only in development environments, because it updates code directly and bypasses CloudFormation for code changes.",
        why: "Correct. SAM Accelerate gives fast feedback but causes drift, so it isn't for production." },
      { t: "sam sync --watch in production as well.",
        why: "Bypassing CloudFormation in production causes drift and skips change sets." },
      { t: "sam deploy --no-confirm-changeset.",
        why: "Still a full CloudFormation deployment." },
      { t: "sam local start-api against production.",
        why: "start-api runs locally; it doesn't update deployed resources." }
    ],
    answer: [0],
    tip: "Fast dev iteration = sam sync --watch (dev only)."
  },
  {
    id: "sam-20", domain: "d2", topic: "AWS SAM",
    q: "A team wants a CI/CD pipeline for their SAM application with separate dev and prod stages, each with its own IAM roles and artifact buckets, with the LEAST setup effort. What should they do?",
    options: [
      { t: "Run sam pipeline init --bootstrap to generate the pipeline configuration and create per-stage roles, artifact buckets and ECR repositories.",
        why: "Correct. SAM pipelines generate CI/CD config (CodePipeline, GitHub Actions, GitLab, Jenkins, Bitbucket) and bootstrap the resources for each stage." },
      { t: "Build the pipeline manually in the CodePipeline console.",
        why: "Works, but more effort." },
      { t: "Use sam sync from a cron job.",
        why: "Not a pipeline, and sam sync is for development." },
      { t: "Use CDK Pipelines without CDK code.",
        why: "CDK Pipelines needs a CDK app." }
    ],
    answer: [0],
    tip: "Ready-made multi-stage SAM pipeline = sam pipeline init --bootstrap."
  },
  {
    id: "sam-21", domain: "d2", topic: "AWS SAM",
    q: "A SAM application needs a DynamoDB table with a partition key, a sort key and a global secondary index. A developer tried AWS::Serverless::SimpleTable but can't configure the sort key. What should they do?",
    options: [
      { t: "Use an AWS::DynamoDB::Table resource in the same SAM template.",
        why: "Correct. SimpleTable supports only a single primary key; SAM templates can include any CloudFormation resource." },
      { t: "Create two SimpleTables.",
        why: "That doesn't create a composite key or GSI." },
      { t: "Use a Lambda layer.",
        why: "Layers are for code." },
      { t: "Create the table manually in the console.",
        why: "Not infrastructure as code." }
    ],
    answer: [0],
    tip: "Sort key / GSI = AWS::DynamoDB::Table instead of SimpleTable."
  },
  {
    id: "sam-22", domain: "d2", topic: "AWS SAM",
    q: "A central platform team built a reusable serverless authentication application. Other teams in the organization should be able to include it in their own SAM templates at a pinned version. What is the BEST approach?",
    options: [
      { t: "Publish it to the AWS Serverless Application Repository, share it with the organization, and reference it with AWS::Serverless::Application using ApplicationId and SemanticVersion.",
        why: "Correct. SAR apps are deployed as nested stacks at a specific version (requires CAPABILITY_AUTO_EXPAND)." },
      { t: "Email the template to each team.",
        why: "No versioning or central management." },
      { t: "Copy the code into every repository.",
        why: "Duplicates code and makes updates hard." },
      { t: "Use a StackSet to deploy the auth app into every account.",
        why: "That pushes it everywhere; the teams want to include it in their own apps." }
    ],
    answer: [0],
    tip: "Reusable serverless app across teams = SAR + AWS::Serverless::Application."
  },
  // ───────────────────────────── Domain 2: Systems Manager ─────────────────────────────
  {
    id: "ssm-01", domain: "d2", topic: "Systems Manager",
    q: "A company launched EC2 instances from the latest Amazon Linux 2023 AMI in private subnets that have no NAT gateway and no internet access. The instances have an instance profile with the AmazonSSMManagedInstanceCore policy, but they don't appear as managed nodes in Fleet Manager. What should a DevOps engineer do?",
    options: [
      { t: "Create VPC interface endpoints for ssm, ssmmessages and ec2messages in the VPC (with private DNS enabled).",
        why: "Correct. The agent and permissions are in place; the instances need a network path to the Systems Manager endpoints." },
      { t: "Open inbound port 22 in the security group.",
        why: "Systems Manager uses outbound HTTPS from the agent; no inbound ports are needed." },
      { t: "Install the SSM Agent.",
        why: "It's pre-installed on Amazon Linux 2023." },
      { t: "Attach an Elastic IP address to each instance.",
        why: "A public IP doesn't help in a subnet without an internet gateway route, and VPC endpoints are the private solution." }
    ],
    answer: [0],
    tip: "Managed node = agent + AmazonSSMManagedInstanceCore + route to ssm / ssmmessages / ec2messages."
  },
  {
    id: "ssm-02", domain: "d2", topic: "Systems Manager",
    q: "A security team wants every EC2 instance in an account to be manageable by Systems Manager without having to attach an instance profile to each instance. What should they configure?",
    options: [
      { t: "Default Host Management Configuration (DHMC) for the account and Region.",
        why: "Correct. DHMC gives EC2 instances Systems Manager permissions automatically (requires IMDSv2)." },
      { t: "A service control policy allowing ssm:*.",
        why: "SCPs only restrict permissions; they don't grant them to instances." },
      { t: "A hybrid activation.",
        why: "Hybrid activations are for on-premises and other non-EC2 servers." },
      { t: "An IAM user with access keys stored on each instance.",
        why: "Insecure long-term credentials." }
    ],
    answer: [0],
    tip: "SSM for all EC2 without instance profiles = DHMC."
  },
  {
    id: "ssm-03", domain: "d2", topic: "Systems Manager",
    q: "A company wants to manage 300 on-premises Linux servers with Systems Manager, including running commands and patching, in the same way as its EC2 instances. What must be done?",
    options: [
      { t: "Create a hybrid activation, install the SSM Agent on each server and register it with the activation code and ID.",
        why: "Correct. Registered on-premises servers become managed nodes with mi- IDs." },
      { t: "Install the CloudWatch agent on each server.",
        why: "The CloudWatch agent collects metrics and logs; it doesn't make servers managed nodes." },
      { t: "Create an instance profile for each server.",
        why: "Instance profiles apply only to EC2." },
      { t: "Use AWS Application Migration Service first.",
        why: "Migration isn't required to manage the servers." }
    ],
    answer: [0],
    tip: "On-prem servers in SSM = hybrid activation (mi- IDs)."
  },
  {
    id: "ssm-04", domain: "d2", topic: "Systems Manager",
    q: "An operations team must restart the application service on 800 EC2 instances tagged Role=web. To limit impact, only 10% of the instances should be processed at a time, and the operation must stop if more than 5% of the instances fail. SSH is not allowed, and the full command output must be retained. What should they do?",
    options: [
      { t: "Use Systems Manager Run Command with AWS-RunShellScript targeting tag Role=web, max concurrency 10%, max errors 5%, and output to an S3 bucket or CloudWatch Logs.",
        why: "Correct. Run Command supports tag targets, rate control and full output to S3 or CloudWatch Logs." },
      { t: "Use a State Manager association that runs every 30 minutes.",
        why: "State Manager is for ongoing desired state, not a one-time restart." },
      { t: "Write a script that connects to each instance with SSH.",
        why: "SSH isn't allowed." },
      { t: "Use EC2 user data.",
        why: "User data runs at launch, not on demand." }
    ],
    answer: [0],
    tip: "One-time command at scale + rate control = Run Command (concurrency + error threshold)."
  },
  {
    id: "ssm-05", domain: "d2", topic: "Systems Manager",
    q: "An engineer runs a Run Command document that produces a lot of output, but the console shows only part of it. The team needs the complete output for troubleshooting. What should the engineer do?",
    options: [
      { t: "Configure the command to send output to an S3 bucket and/or CloudWatch Logs.",
        why: "Correct. The console shows only the first 2,500 characters; S3 and CloudWatch Logs keep the full output." },
      { t: "Increase the command execution timeout.",
        why: "The timeout doesn't change how much output the console shows." },
      { t: "Use Session Manager instead.",
        why: "Possible manually, but it doesn't scale and doesn't fix Run Command output." },
      { t: "Increase the instance size.",
        why: "Unrelated to output length." }
    ],
    answer: [0],
    tip: "Run Command console output truncated → send to S3 / CloudWatch Logs."
  },
  {
    id: "ssm-06", domain: "d2", topic: "Systems Manager",
    q: "A company requires the CloudWatch agent to be installed and configured on all EC2 instances tagged Env=prod, including instances that Auto Scaling launches in the future. If someone removes the agent, it must be reinstalled automatically. What is the MOST operationally efficient solution?",
    options: [
      { t: "Create a Systems Manager State Manager association that installs and configures the agent on instances tagged Env=prod on a schedule.",
        why: "Correct. Associations apply to new matching instances and reapply on the schedule, correcting drift." },
      { t: "Run the installation once with Run Command.",
        why: "Doesn't cover future instances or fix later drift." },
      { t: "Add the installation to a one-time maintenance window task.",
        why: "Runs only in the window and doesn't continuously enforce state." },
      { t: "Ask developers to install the agent manually.",
        why: "Not automated." }
    ],
    answer: [0],
    tip: "Ensure always + new instances = State Manager association."
  },
  {
    id: "ssm-07", domain: "d2", topic: "Systems Manager",
    q: "A company patches Amazon Linux instances with Patch Manager. Security patches must be approved 7 days after release in development and 14 days after release in production. Development instances are patched on Saturday nights and production on Sunday nights. Which solution meets these requirements?",
    options: [
      { t: "Create two custom patch baselines (7-day and 14-day auto-approval), tag instances with Patch Group dev or prod, register each patch group with its baseline, and create two maintenance windows that run AWS-RunPatchBaseline with Operation Install.",
        why: "Correct. Baselines define what is approved, patch groups map nodes to baselines, and maintenance windows define when." },
      { t: "Edit the AWS predefined baseline to use 7 and 14 days.",
        why: "Predefined baselines can't be edited, and one baseline can't have two delays for different groups." },
      { t: "Create one baseline and register it with both patch groups.",
        why: "One baseline can't have different approval delays." },
      { t: "Use a State Manager association that runs yum update every week.",
        why: "No approval delays or compliance reporting." }
    ],
    answer: [0],
    tip: "Different approval delays = custom baselines + Patch Group tags + maintenance windows."
  },
  {
    id: "ssm-08", domain: "d2", topic: "Systems Manager",
    q: "A team created a custom patch baseline and registered the patch group prod with it. A week later, no instances have been patched. What is missing?",
    options: [
      { t: "A task that runs AWS-RunPatchBaseline with Operation Install (for example in a maintenance window, a State Manager association or a patch policy).",
        why: "Correct. A baseline only defines rules; something must run AWS-RunPatchBaseline on the nodes." },
      { t: "The baseline must be set as the default baseline.",
        why: "Patch groups already map nodes to the baseline." },
      { t: "The instances must be rebooted.",
        why: "Rebooting doesn't install patches." },
      { t: "AWS Config must be enabled.",
        why: "Config reports compliance; it doesn't patch." }
    ],
    answer: [0],
    tip: "A baseline alone patches nothing; run AWS-RunPatchBaseline (Install)."
  },
  {
    id: "ssm-09", domain: "d2", topic: "Systems Manager",
    q: "Compliance auditors want a daily report of missing patches on all production instances. Patches must NOT be installed outside the approved Sunday maintenance window. What should the engineer configure for the daily job?",
    options: [
      { t: "A State Manager association that runs AWS-RunPatchBaseline daily with Operation Scan.",
        why: "Correct. Scan reports patch compliance without installing anything." },
      { t: "AWS-RunPatchBaseline daily with Operation Install and RebootOption NoReboot.",
        why: "That still installs patches outside the window." },
      { t: "Run yum check-update with Run Command and email the output.",
        why: "No compliance reporting, and more manual." },
      { t: "Amazon Inspector only.",
        why: "Inspector finds vulnerabilities, but the requirement is Patch Manager compliance against the approved baseline." }
    ],
    answer: [0],
    tip: "Report without installing = Operation Scan."
  },
  {
    id: "ssm-10", domain: "d2", topic: "Systems Manager",
    q: "A company with 40 AWS accounts in AWS Organizations wants one central way to patch EC2 instances in all accounts and Regions with consistent baselines and schedules, with minimal per-account setup. What should they use?",
    options: [
      { t: "A Systems Manager patch policy created with Quick Setup, targeting the organization's OUs and Regions.",
        why: "Correct. Patch policies centrally define baselines and schedules across accounts and Regions." },
      { t: "Create maintenance windows manually in each account and Region.",
        why: "Works, but a lot of per-account effort." },
      { t: "Use AWS Config conformance packs.",
        why: "Conformance packs evaluate compliance; they don't install patches." },
      { t: "Use a Lambda function in each account that runs yum update.",
        why: "Custom, with no baselines or compliance reporting." }
    ],
    answer: [0],
    tip: "Org-wide patching = patch policies (Quick Setup)."
  },
  {
    id: "ssm-11", domain: "d2", topic: "Systems Manager",
    q: "A company wants to know which versions of OpenSSL are installed on every EC2 instance across 25 accounts and several Regions, and to query this data with SQL. What is the MOST efficient solution?",
    options: [
      { t: "Enable Systems Manager Inventory with AWS-GatherSoftwareInventory, configure Resource Data Sync to a central S3 bucket, and query it with Amazon Athena.",
        why: "Correct. Inventory collects application data, and Resource Data Sync aggregates it in S3 for Athena." },
      { t: "Run a Run Command script every day and email the results.",
        why: "Manual and hard to query." },
      { t: "Use CloudTrail Lake.",
        why: "CloudTrail records API calls, not installed software." },
      { t: "Log in to each instance with Session Manager.",
        why: "Doesn't scale." }
    ],
    answer: [0],
    tip: "Software across accounts + SQL = Inventory + Resource Data Sync + Athena."
  },
  {
    id: "ssm-12", domain: "d2", topic: "Systems Manager",
    q: "A company wants to remove its bastion hosts and close port 22 on all instances. Administrators still need interactive shell access, and the security team requires a record of every command typed, encrypted at rest. What should the company do?",
    options: [
      { t: "Use Systems Manager Session Manager with session logging to S3 and/or CloudWatch Logs, encrypted with a KMS key, and control access with IAM.",
        why: "Correct. Session Manager needs no inbound ports or SSH keys and can log session data with KMS encryption." },
      { t: "Use EC2 Instance Connect.",
        why: "Instance Connect still uses SSH on port 22 (or an EIC Endpoint) and doesn't log every command." },
      { t: "Keep the bastion host and enable VPC Flow Logs.",
        why: "Flow Logs show network traffic, not commands, and the bastion stays." },
      { t: "Use SSH over Session Manager with AWS-StartSSHSession.",
        why: "Session logging can't capture commands inside an SSH tunnel." }
    ],
    answer: [0],
    tip: "No bastion / port 22 + audit commands = Session Manager + logging (S3 / CW) + KMS."
  },
  {
    id: "ssm-13", domain: "d2", topic: "Systems Manager",
    q: "Developers must be able to start Session Manager sessions only on instances tagged Env=dev, never on production instances. How should this be enforced?",
    options: [
      { t: "Use an IAM policy that allows ssm:StartSession on instances only when the resource tag Env equals dev.",
        why: "Correct. IAM tag conditions control which instances users can start sessions on." },
      { t: "Use security groups to block production.",
        why: "Session Manager doesn't use inbound security group rules." },
      { t: "Remove the SSM Agent from production instances.",
        why: "This would break management of production." },
      { t: "Disable session logging for production.",
        why: "Logging doesn't control access." }
    ],
    answer: [0],
    tip: "Restrict sessions to tagged instances = IAM ssm:StartSession with tag conditions."
  },
  {
    id: "ssm-14", domain: "d2", topic: "Systems Manager",
    q: "A developer needs to connect a database client on their laptop to an Amazon RDS instance in a private subnet. There's no public endpoint, no VPN and no bastion SSH access, but there is a managed EC2 instance in the same VPC. What should they use?",
    options: [
      { t: "Session Manager port forwarding with the AWS-StartPortForwardingSessionToRemoteHost document through the managed instance.",
        why: "Correct. It forwards a local port through the instance to the remote RDS host and port." },
      { t: "Make the RDS instance publicly accessible.",
        why: "Insecure and against the requirement." },
      { t: "Use AWS-RunShellScript to run SQL queries.",
        why: "Not interactive client access." },
      { t: "Use Fleet Manager file browsing.",
        why: "File browsing doesn't provide database connectivity." }
    ],
    answer: [0],
    tip: "Laptop → private RDS = port forwarding to remote host."
  },
  {
    id: "ssm-15", domain: "d2", topic: "Systems Manager",
    q: "An application reads a SecureString parameter encrypted with a customer managed KMS key. The application role has ssm:GetParameter permission, but the call fails with AccessDeniedException. What is the MOST likely cause?",
    options: [
      { t: "The role lacks kms:Decrypt permission on the customer managed key (in the IAM policy and/or key policy).",
        why: "Correct. Decrypting a SecureString needs KMS decrypt permission on the key." },
      { t: "SecureString parameters can't use customer managed keys.",
        why: "They can." },
      { t: "The parameter must be in the Advanced tier.",
        why: "SecureString works in the Standard tier." },
      { t: "Parameter Store must be enabled per Region.",
        why: "No such setting." }
    ],
    answer: [0],
    tip: "SecureString AccessDenied = missing kms:Decrypt."
  },
  {
    id: "ssm-16", domain: "d2", topic: "Systems Manager",
    q: "A team needs to store a configuration value of 6 KB in Parameter Store and receive a notification if the parameter hasn't been updated for 90 days. What should they do?",
    options: [
      { t: "Create the parameter in the Advanced tier and attach a NoChangeNotification parameter policy (notifications delivered through EventBridge).",
        why: "Correct. Advanced parameters support up to 8 KB and parameter policies." },
      { t: "Use the Standard tier with a parameter policy.",
        why: "Standard is limited to 4 KB and doesn't support policies." },
      { t: "Split the value into two Standard parameters and use a cron Lambda.",
        why: "More complex than the built-in feature." },
      { t: "Store it as a StringList.",
        why: "The type doesn't change size limits or add policies." }
    ],
    answer: [0],
    tip: "Over 4 KB / expiry / no-change notification = Advanced tier + parameter policies."
  },
  {
    id: "ssm-17", domain: "d2", topic: "Systems Manager",
    q: "A CloudFormation template launches EC2 instances and must always use the latest Amazon Linux 2023 AMI in whatever Region it's deployed to, without updating the template. What should the template use?",
    options: [
      { t: "A parameter of type AWS::SSM::Parameter::Value<AWS::EC2::Image::Id> with the default value /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64.",
        why: "Correct. The public SSM parameter always resolves to the latest AMI in the Region." },
      { t: "A Mappings section with AMI IDs per Region.",
        why: "Mappings have to be updated manually for every new AMI." },
      { t: "A custom resource that calls DescribeImages.",
        why: "Works, but unnecessary complexity." },
      { t: "Hardcode the AMI ID.",
        why: "It becomes outdated and differs per Region." }
    ],
    answer: [0],
    tip: "Latest AMI = public SSM parameter via AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>."
  },
  {
    id: "ssm-18", domain: "d2", topic: "Systems Manager",
    q: "A company stores an Amazon RDS database password and requires it to be rotated automatically every 30 days, with the application always retrieving the current value. Which service should store the password?",
    options: [
      { t: "AWS Secrets Manager with automatic rotation enabled.",
        why: "Correct. Secrets Manager has built-in rotation for RDS." },
      { t: "Parameter Store SecureString in the Standard tier.",
        why: "No built-in rotation." },
      { t: "Parameter Store Advanced tier with an Expiration policy.",
        why: "Expiration deletes or notifies; it doesn't rotate the password in the database." },
      { t: "An encrypted S3 object.",
        why: "No rotation or database integration." }
    ],
    answer: [0],
    tip: "Automatic rotation = Secrets Manager."
  },
  {
    id: "ssm-19", domain: "d2", topic: "Systems Manager",
    q: "A company uses an AWS Config rule to detect security groups that allow SSH from 0.0.0.0/0. The security team wants these rules removed automatically within minutes of detection, with least-privilege permissions. What should the DevOps engineer do?",
    options: [
      { t: "Configure automatic remediation on the Config rule with an SSM Automation runbook (for example AWS-DisablePublicAccessForSecurityGroup) and an AutomationAssumeRole that has only the required EC2 permissions.",
        why: "Correct. Config remediation runs SSM Automation runbooks with a scoped service role." },
      { t: "Run Command on every instance to update iptables.",
        why: "Security groups are AWS resources, not instance firewall rules." },
      { t: "Ask the security team to review the Config dashboard daily.",
        why: "Manual and not within minutes." },
      { t: "Use Patch Manager.",
        why: "Patch Manager installs OS patches." }
    ],
    answer: [0],
    tip: "Auto-fix Config non-compliance = Config remediation + SSM Automation runbook."
  },
  {
    id: "ssm-20", domain: "d2", topic: "Systems Manager",
    q: "A team needs an operational runbook that stops an EC2 instance, creates an AMI and restarts the instance, but only after a manager approves the action through an email notification. What should they create?",
    options: [
      { t: "A custom Systems Manager Automation runbook with an aws:approve step (SNS notification), followed by aws:changeInstanceState and aws:createImage steps.",
        why: "Correct. Automation supports manual approval steps and resource actions in one runbook." },
      { t: "A Run Command document with an approval parameter.",
        why: "Command documents run on instances and have no approval step." },
      { t: "A State Manager association.",
        why: "Associations enforce state on a schedule, without approvals." },
      { t: "A Distributor package.",
        why: "Distributor installs software." }
    ],
    answer: [0],
    tip: "Multi-step ops + human approval = Automation runbook with aws:approve."
  },
  {
    id: "ssm-21", domain: "d2", topic: "Systems Manager",
    q: "A company built a custom monitoring agent for both Windows and Linux. It must be installed on all existing instances and automatically on every new instance, and the team wants to manage agent versions centrally. Which solution meets these requirements?",
    options: [
      { t: "Package the agent with Systems Manager Distributor and create a State Manager association that installs the package (AWS-ConfigureAWSPackage) on the target instances.",
        why: "Correct. Distributor provides versioned multi-platform packages, and State Manager keeps them installed, including on new instances." },
      { t: "Bake the agent into AMIs only.",
        why: "Doesn't update existing instances and makes version changes slow." },
      { t: "Use Run Command once.",
        why: "Doesn't cover new instances." },
      { t: "Store the installer in Parameter Store.",
        why: "Parameter Store isn't for software packages." }
    ],
    answer: [0],
    tip: "Custom agent, versions, all current + future instances = Distributor + State Manager."
  },
  {
    id: "ssm-22", domain: "d2", topic: "Systems Manager",
    q: "Windows administrators need graphical Remote Desktop access to Windows instances in private subnets. The security team prohibits opening port 3389 and running bastion hosts. Which TWO Systems Manager capabilities can provide this? (Choose TWO.)",
    multi: true,
    options: [
      { t: "Fleet Manager Remote Desktop, which connects through Session Manager in the browser.",
        why: "Correct. Browser-based RDP with no inbound port." },
      { t: "Session Manager port forwarding (AWS-StartPortForwardingSession) of the instance's RDP port to a local port, then a local RDP client.",
        why: "Correct. Traffic goes through Session Manager, so port 3389 doesn't need to be open inbound." },
      { t: "Open port 3389 to the administrators' IP addresses.",
        why: "Prohibited by the security team." },
      { t: "Patch Manager.",
        why: "Patching doesn't provide remote access." },
      { t: "Parameter Store.",
        why: "Stores configuration values only." }
    ],
    answer: [0, 1],
    tip: "RDP without 3389 = Fleet Manager Remote Desktop / Session Manager port forwarding."
  },
  // ───────────────────────────── Domain 2: AppConfig ─────────────────────────────
  {
    id: "acf-01", domain: "d2", topic: "AppConfig",
    q: "A company runs a microservice on Lambda. Product managers want to turn a new checkout feature on and off quickly, without the development team redeploying the function each time. Changes must roll out gradually and roll back automatically if errors increase. What should a DevOps engineer implement?",
    options: [
      { t: "Store the feature as an AWS AppConfig feature flag, deploy changes with a gradual deployment strategy, configure CloudWatch alarms as environment monitors, and read the flag with the AppConfig Lambda extension.",
        why: "Correct. AppConfig separates config from code, with gradual rollout, alarm-based rollback and efficient retrieval." },
      { t: "Use a Lambda environment variable and update it when needed.",
        why: "Changing environment variables updates the function configuration, with no gradual rollout or automatic rollback." },
      { t: "Store the flag in a DynamoDB table and read it on every invocation.",
        why: "Works for toggling but has no validation, gradual rollout or automatic rollback." },
      { t: "Create a new Lambda version for each flag change and shift traffic with CodeDeploy.",
        why: "That's a code deployment; the requirement is to avoid redeploying." }
    ],
    answer: [0],
    tip: "Toggle features without redeploying + gradual + rollback = AppConfig feature flags."
  },
  {
    id: "acf-02", domain: "d2", topic: "AppConfig",
    q: "A team wants to create an AppConfig configuration profile of type Feature flags. Which configuration source must they use?",
    options: [
      { t: "The AWS AppConfig hosted configuration store.",
        why: "Correct. Feature flag profiles are stored in the hosted configuration store." },
      { t: "An Amazon S3 object.",
        why: "S3 can be used for freeform profiles, not feature flag profiles." },
      { t: "An SSM Parameter Store parameter.",
        why: "Supported for freeform profiles only." },
      { t: "An AWS Secrets Manager secret.",
        why: "Supported for freeform profiles only." }
    ],
    answer: [0],
    tip: "Feature flags = hosted configuration store."
  },
  {
    id: "acf-03", domain: "d2", topic: "AppConfig",
    q: "An application's JSON configuration in AppConfig must always contain a logLevel field limited to DEBUG, INFO, WARN or ERROR, and a timeoutMs integer between 100 and 10000. Invalid configuration must never reach the application. What should the engineer configure?",
    options: [
      { t: "A JSON Schema validator on the configuration profile.",
        why: "Correct. JSON Schema validates structure, types, enums and ranges before the deployment starts." },
      { t: "A CloudWatch alarm on the environment.",
        why: "Alarms detect impact during or after deployment; they don't validate content beforehand." },
      { t: "A bake time on the deployment strategy.",
        why: "Bake time is monitoring after rollout, not validation." },
      { t: "An S3 bucket policy.",
        why: "Unrelated to config content validation." }
    ],
    answer: [0],
    tip: "Structure / type / enum checks = JSON Schema validator (before deploy)."
  },
  {
    id: "acf-04", domain: "d2", topic: "AppConfig",
    q: "Before a pricing configuration is deployed, the team must verify that every product ID in it exists in a DynamoDB table and that discounts never exceed the product margin. Which AppConfig feature should they use?",
    options: [
      { t: "An AWS Lambda validator on the configuration profile that checks the business rules and throws an error to reject invalid configuration.",
        why: "Correct. Lambda validators perform semantic checks, such as lookups and business rules." },
      { t: "A JSON Schema validator.",
        why: "JSON Schema can't look up DynamoDB or compare values with external data." },
      { t: "A deployment strategy with exponential growth.",
        why: "Strategies control rollout speed, not content correctness." },
      { t: "An AppConfig extension on ON_DEPLOYMENT_COMPLETE.",
        why: "That runs after deployment, too late to block invalid configuration." }
    ],
    answer: [0],
    tip: "Business-logic validation = Lambda validator."
  },
  {
    id: "acf-05", domain: "d2", topic: "AppConfig",
    q: "An engineer added a Lambda validator to an AppConfig configuration profile. When starting a deployment, it fails with an error that AppConfig couldn't invoke the function. What should the engineer do?",
    options: [
      { t: "Add a resource-based policy to the Lambda function that allows appconfig.amazonaws.com to invoke it.",
        why: "Correct. AppConfig needs permission to invoke the validator function." },
      { t: "Give the application's IAM role lambda:InvokeFunction.",
        why: "The application doesn't invoke the validator; AppConfig does." },
      { t: "Increase the Lambda timeout to 15 minutes.",
        why: "The error is about permission, not timeout." },
      { t: "Move the configuration to S3.",
        why: "The source doesn't affect validator permissions." }
    ],
    answer: [0],
    tip: "Lambda validator invoke error = resource policy for appconfig.amazonaws.com."
  },
  {
    id: "acf-06", domain: "d2", topic: "AppConfig",
    q: "When do AppConfig validators run, and what happens if validation fails?",
    options: [
      { t: "They run when the deployment starts (and when a hosted version is created); if validation fails, the deployment doesn't start.",
        why: "Correct. Validators prevent invalid configuration from ever reaching targets." },
      { t: "They run after the deployment completes and trigger a rollback if validation fails.",
        why: "Rollback is triggered by alarms, not validators." },
      { t: "They run on each client poll.",
        why: "Clients don't run validators." },
      { t: "They run only during the bake time.",
        why: "Bake time is for alarm monitoring." }
    ],
    answer: [0],
    tip: "Validators = before deployment; failure = no deployment."
  },
  {
    id: "acf-07", domain: "d2", topic: "AppConfig",
    q: "A company wants configuration changes in production to roll out gradually and to be rolled back automatically if the application's 5XX error rate increases, either during the rollout or for 15 minutes after the change reaches all targets. Which configuration meets these requirements?",
    options: [
      { t: "Add a CloudWatch 5XX alarm as a monitor on the production environment (with an IAM role that can read alarms), and use a deployment strategy with gradual growth and a 15-minute final bake time.",
        why: "Correct. Monitors trigger rollback during deployment and during the final bake time." },
      { t: "Use a JSON Schema validator and AllAtOnce.",
        why: "Validators check content, not error rates, and there's no monitoring configured." },
      { t: "Use an EventBridge rule that deletes the configuration profile.",
        why: "Not a rollback mechanism." },
      { t: "Set the poll interval to 15 minutes.",
        why: "The poll interval controls how often clients check for config, not rollback." }
    ],
    answer: [0],
    tip: "Automatic rollback = environment alarm monitors + bake time."
  },
  {
    id: "acf-08", domain: "d2", topic: "AppConfig",
    q: "An AppConfig environment has a CloudWatch alarm configured as a monitor, but when the alarm fired during a deployment, nothing was rolled back. What is the MOST likely cause?",
    options: [
      { t: "The monitor isn't configured with an IAM role that allows AppConfig to read the alarm (cloudwatch:DescribeAlarms).",
        why: "Correct. AppConfig needs a role to evaluate the alarm state." },
      { t: "Rollback only works with Lambda validators.",
        why: "Validators aren't involved in rollback." },
      { t: "Feature flag profiles can't be rolled back.",
        why: "All configuration types can roll back." },
      { t: "Alarms must be in the us-east-1 Region.",
        why: "Alarms are used in the environment's Region." }
    ],
    answer: [0],
    tip: "Monitor alarms need an IAM role with cloudwatch:DescribeAlarms."
  },
  {
    id: "acf-09", domain: "d2", topic: "AppConfig",
    q: "Which predefined AppConfig deployment strategy does AWS recommend for production deployments, using exponential growth starting with 10% of targets?",
    options: [
      { t: "AppConfig.Canary10Percent20Minutes",
        why: "Correct. Exponential growth over 20 minutes followed by a bake time." },
      { t: "AppConfig.Linear50PercentEvery30Seconds",
        why: "Intended for testing and demos." },
      { t: "AppConfig.AllAtOnce",
        why: "Deploys to all targets immediately." },
      { t: "CodeDeployDefault.LambdaCanary10Percent5Minutes",
        why: "That's a CodeDeploy configuration, not an AppConfig strategy." }
    ],
    answer: [0],
    tip: "AppConfig production canary = Canary10Percent20Minutes."
  },
  {
    id: "acf-10", domain: "d2", topic: "AppConfig",
    q: "A team is testing AppConfig in a development environment and wants configuration changes to reach all targets in about a minute while still using a step-wise rollout. Which predefined strategy fits?",
    options: [
      { t: "AppConfig.Linear50PercentEvery30Seconds",
        why: "Correct. Two steps over about one minute, intended for testing." },
      { t: "AppConfig.Linear20PercentEvery6Minutes",
        why: "Takes 30 minutes plus a long bake." },
      { t: "AppConfig.Canary10Percent20Minutes",
        why: "Takes 20 minutes plus bake." },
      { t: "A custom strategy with a 24-hour duration.",
        why: "Far too slow." }
    ],
    answer: [0],
    tip: "Testing strategy = Linear50PercentEvery30Seconds."
  },
  {
    id: "acf-11", domain: "d2", topic: "AppConfig",
    q: "In an AppConfig deployment strategy, what does the final bake time control?",
    options: [
      { t: "How long AppConfig keeps monitoring the environment's alarms after the configuration reaches 100% of targets, rolling back if an alarm fires.",
        why: "Correct. Bake time extends the monitoring window after full rollout." },
      { t: "How long clients cache the configuration.",
        why: "Caching is controlled by clients and the agent poll interval." },
      { t: "How long validators run.",
        why: "Validators run before the deployment starts." },
      { t: "The delay before the first deployment step.",
        why: "Not what bake time means." }
    ],
    answer: [0],
    tip: "Final bake time = monitoring after 100%."
  },
  {
    id: "acf-12", domain: "d2", topic: "AppConfig",
    q: "A bad configuration change is halfway through a slow linear deployment, and the on-call engineer sees errors increasing before the alarm threshold is reached. What should they do to revert immediately?",
    options: [
      { t: "Call StopDeployment for the in-progress deployment, which rolls the targets back to the previous version.",
        why: "Correct. StopDeployment stops the rollout and rolls back." },
      { t: "Delete the configuration profile.",
        why: "Destructive, and it doesn't cleanly roll back clients." },
      { t: "Start a second deployment with the previous version.",
        why: "Only one deployment can be active per environment, so this is rejected while the first is running." },
      { t: "Increase the growth factor.",
        why: "That pushes the bad config to more targets faster." }
    ],
    answer: [0],
    tip: "Stop a bad deployment now = StopDeployment (rolls back)."
  },
  {
    id: "acf-13", domain: "d2", topic: "AppConfig",
    q: "A CI job tries to start a second AppConfig deployment to the production environment while another deployment to the same environment is still baking. What happens?",
    options: [
      { t: "The request is rejected because only one deployment can be active per environment at a time.",
        why: "Correct. Wait for the current deployment to complete or stop it first." },
      { t: "Both deployments run in parallel.",
        why: "Not allowed in the same environment." },
      { t: "The second deployment is merged into the first.",
        why: "Deployments aren't merged." },
      { t: "The first deployment is automatically rolled back.",
        why: "Starting another deployment doesn't roll back the current one." }
    ],
    answer: [0],
    tip: "One active deployment per environment."
  },
  {
    id: "acf-14", domain: "d2", topic: "AppConfig",
    q: "A high-traffic Lambda function calls the AppConfig Data API on every invocation to read its configuration. The team sees added latency and rising AppConfig costs. What should they do?",
    options: [
      { t: "Add the AWS AppConfig Lambda extension and read the configuration from http://localhost:2772, letting the extension cache and poll in the background.",
        why: "Correct. The extension caches config locally and reduces API calls and latency." },
      { t: "Increase the function's memory.",
        why: "Doesn't reduce API calls or cost." },
      { t: "Move the configuration into the deployment package.",
        why: "Then changes need a code deployment." },
      { t: "Use the deprecated GetConfiguration API.",
        why: "Deprecated, and it doesn't solve the problem." }
    ],
    answer: [0],
    tip: "Lambda + AppConfig efficiently = AppConfig Lambda extension (localhost:2772)."
  },
  {
    id: "acf-15", domain: "d2", topic: "AppConfig",
    q: "Microservices running on Amazon EKS need to read AppConfig feature flags with low latency and minimal code changes. What is the recommended approach?",
    options: [
      { t: "Run the AWS AppConfig Agent as a sidecar container in each pod and read configuration from its localhost endpoint.",
        why: "Correct. The agent handles sessions, polling and caching for containers." },
      { t: "Mount the configuration from a ConfigMap and update it manually.",
        why: "No validation, gradual rollout or rollback." },
      { t: "Call GetLatestConfiguration from every request handler.",
        why: "Higher latency and cost than the cached agent." },
      { t: "Use Parameter Store GetParameter on every request.",
        why: "No AppConfig rollout features, and frequent calls can throttle." }
    ],
    answer: [0],
    tip: "ECS / EKS + AppConfig = AppConfig Agent sidecar."
  },
  {
    id: "acf-16", domain: "d2", topic: "AppConfig",
    q: "A developer is writing a custom client for AppConfig without the agent. Which API calls should the client use to retrieve configuration?",
    options: [
      { t: "StartConfigurationSession once, then GetLatestConfiguration repeatedly, always using the NextPollConfigurationToken from the previous response.",
        why: "Correct. This is the AppConfig Data API flow." },
      { t: "GetConfiguration on every request.",
        why: "Deprecated." },
      { t: "GetParameter from SSM.",
        why: "That's Parameter Store." },
      { t: "ListDeployments, then download from S3.",
        why: "Not how clients retrieve configuration." }
    ],
    answer: [0],
    tip: "AppConfig Data API = StartConfigurationSession + GetLatestConfiguration."
  },
  {
    id: "acf-17", domain: "d2", topic: "AppConfig",
    q: "A client calls GetLatestConfiguration and receives a successful response with an empty configuration body. What does this mean?",
    options: [
      { t: "The configuration hasn't changed since the last call; the client should keep using its cached copy and poll again later with the new token.",
        why: "Correct. An empty body indicates no new version." },
      { t: "The configuration was deleted.",
        why: "An empty response doesn't mean deletion." },
      { t: "Validation failed.",
        why: "Validation happens at deployment time." },
      { t: "The session expired and the client must stop polling.",
        why: "An expired token returns an error, not an empty success." }
    ],
    answer: [0],
    tip: "Empty GetLatestConfiguration = no change; keep the cache."
  },
  {
    id: "acf-18", domain: "d2", topic: "AppConfig",
    q: "A product team wants customers in the 'beta' tier to see variant B of a recommendation widget, while all other customers see variant A, without separate deployments for each group. Which AppConfig feature should they use?",
    options: [
      { t: "Multi-variant feature flags with targeting rules evaluated against context (such as tier) sent by the client through the AppConfig Agent.",
        why: "Correct. Multi-variant flags return different values based on request context." },
      { t: "Two environments, beta and prod.",
        why: "Environments group deployment targets (hosts), not individual customers." },
      { t: "A deployment strategy with a 10% growth factor.",
        why: "Growth factor is a percentage of polling targets, not of specific customers." },
      { t: "A JSON Schema validator.",
        why: "Validators check content; they don't target users." }
    ],
    answer: [0],
    tip: "Per-user / per-segment variants = multi-variant flags + context."
  },
  {
    id: "acf-19", domain: "d2", topic: "AppConfig",
    q: "The operations team wants a message in their Slack channel (through SNS) whenever an AppConfig deployment is rolled back. What is the simplest solution?",
    options: [
      { t: "Associate the AWS-authored AppConfig notification extension for SNS (or EventBridge) with the application, which publishes deployment events such as rollbacks.",
        why: "Correct. AppConfig extensions send lifecycle events like ON_DEPLOYMENT_ROLLED_BACK." },
      { t: "Poll ListDeployments every minute with a Lambda function.",
        why: "Works, but more custom code than the built-in extension." },
      { t: "Create a CloudTrail trail and read it manually.",
        why: "Not a notification mechanism." },
      { t: "Add a Lambda validator that posts to Slack.",
        why: "Validators run before deployment, not on rollback." }
    ],
    answer: [0],
    tip: "Notify on deployment events = AppConfig extension (SNS / EventBridge / SQS)."
  },
  {
    id: "acf-20", domain: "d2", topic: "AppConfig",
    q: "During a year-end change freeze, no AppConfig deployments may start unless an approved change ticket ID is provided. What should the engineer implement?",
    options: [
      { t: "A custom AppConfig extension with a Lambda action on PRE_START_DEPLOYMENT that checks the freeze calendar and ticket and blocks the deployment if needed.",
        why: "Correct. PRE_START_DEPLOYMENT extensions can stop a deployment before it begins." },
      { t: "An ON_DEPLOYMENT_COMPLETE extension.",
        why: "Too late; the configuration is already deployed." },
      { t: "A longer bake time.",
        why: "Bake time doesn't prevent deployments from starting." },
      { t: "A JSON Schema validator requiring a ticket field.",
        why: "Partial at best; it adds a field to the config rather than enforcing a freeze calendar." }
    ],
    answer: [0],
    tip: "Block deploys before they start = PRE_START_DEPLOYMENT extension."
  },
  {
    id: "acf-21", domain: "d2", topic: "AppConfig",
    q: "A company currently stores its application settings in Parameter Store and wants to keep them there, but add validation, gradual rollout and automatic rollback when settings change. What should it do?",
    options: [
      { t: "Create an AppConfig freeform configuration profile that uses the Parameter Store parameter as its source, with validators, an environment with alarm monitors and a deployment strategy.",
        why: "Correct. AppConfig can use Parameter Store as a source and add safe deployment features." },
      { t: "Enable Parameter Store advanced tier policies.",
        why: "Policies give expiration and notifications, not gradual rollout or rollback." },
      { t: "Turn on Parameter Store higher throughput.",
        why: "Throughput doesn't add deployment safety." },
      { t: "Move the settings to Secrets Manager with rotation.",
        why: "Rotation isn't gradual rollout or validation." }
    ],
    answer: [0],
    tip: "Keep Parameter Store, add safety = AppConfig profile with Parameter Store source."
  },
  {
    id: "acf-22", domain: "d2", topic: "AppConfig",
    q: "A team has used Amazon CloudWatch Evidently for feature flags and is planning new feature-flag work. Which statement reflects AWS guidance? (Choose TWO.)",
    multi: true,
    options: [
      { t: "Use AWS AppConfig feature flags for new feature-flag work, because CloudWatch Evidently is being retired.",
        why: "Correct. AWS recommends moving feature flags to AppConfig." },
      { t: "Use AppConfig multi-variant flags with targeting rules for segment-based variations.",
        why: "Correct. Multi-variant flags cover variant targeting by context." },
      { t: "Store feature flags in Lambda environment variables.",
        why: "Changing them requires a function update and has no rollout safety." },
      { t: "Use Parameter Store StringList parameters as flags with automatic rollback.",
        why: "Parameter Store has no automatic rollback." },
      { t: "Use CodeDeploy canary deployments to toggle flags.",
        why: "CodeDeploy deploys code versions, not feature flags." }
    ],
    answer: [0, 1],
    tip: "Evidently retiring → AppConfig feature flags (incl. multi-variant)."
  },
  // ───────────────────────────── Domain 2: AWS Organizations ─────────────────────────────
  {
    id: "org-01", domain: "d2", topic: "AWS Organizations",
    q: "A company uses AWS Organizations with all features enabled. The security team must ensure that no IAM user or role in any member account, including administrators and the root user, can stop CloudTrail logging, delete GuardDuty detectors or leave the organization. What is the MOST effective solution?",
    options: [
      { t: "Create an SCP that denies cloudtrail:StopLogging, cloudtrail:DeleteTrail, guardduty:DeleteDetector and organizations:LeaveOrganization, and attach it to the root (or the top-level OUs).",
        why: "Correct. SCPs set the maximum permissions for all principals in member accounts, including administrators and the root user." },
      { t: "Add an explicit deny to the IAM policies of every administrator in each account.",
        why: "Local admins could remove it, and it doesn't cover the root user or new roles." },
      { t: "Enable AWS Config rules to detect the actions.",
        why: "Config is detective; it doesn't prevent the actions." },
      { t: "Attach the SCP to the management account.",
        why: "SCPs don't apply to the management account, and the requirement is for member accounts." }
    ],
    answer: [0],
    tip: "Prevent actions in all member accounts (incl. admins / root) = SCP deny."
  },
  {
    id: "org-02", domain: "d2", topic: "AWS Organizations",
    q: "An SCP attached to the root denies s3:DeleteBucket. An administrator in the management account successfully deletes a bucket. Why?",
    options: [
      { t: "SCPs don't affect users or roles in the management account.",
        why: "Correct. The management account isn't restricted by SCPs, which is why it should hold no workloads and minimal users." },
      { t: "The administrator used the root user.",
        why: "Even IAM principals in the management account aren't restricted by SCPs." },
      { t: "SCPs take 24 hours to apply.",
        why: "SCPs take effect quickly." },
      { t: "The bucket had a bucket policy allowing deletion.",
        why: "A resource policy can't override an SCP deny in a member account; here the SCP simply doesn't apply." }
    ],
    answer: [0],
    tip: "SCPs never apply to the management account."
  },
  {
    id: "org-03", domain: "d2", topic: "AWS Organizations",
    q: "A developer in a member account has an IAM policy allowing ec2:* but receives AccessDenied when launching instances. The error mentions an explicit deny in a service control policy. Which statement explains how SCPs are evaluated?",
    options: [
      { t: "An explicit deny in any SCP attached to the root, any parent OU or the account blocks the action, and an action must be allowed by SCPs at every level of the path.",
        why: "Correct. Effective permissions are the intersection of SCPs at every level and IAM permissions." },
      { t: "Only the SCP attached directly to the account is evaluated.",
        why: "SCPs at the root and every parent OU are also evaluated." },
      { t: "IAM allow statements override SCP denies.",
        why: "An explicit deny always wins." },
      { t: "SCPs only apply to the root user.",
        why: "They apply to all IAM principals in member accounts." }
    ],
    answer: [0],
    tip: "SCPs: explicit deny anywhere wins; allow needed at every level."
  },
  {
    id: "org-04", domain: "d2", topic: "AWS Organizations",
    q: "A team attaches an SCP to an OU that allows only S3 and CloudWatch actions, then detaches the FullAWSAccess policy from that OU. Later they move an account into a child OU that has FullAWSAccess attached. Users in the account can still use only S3 and CloudWatch. Why?",
    options: [
      { t: "An action must be allowed by SCPs at every level of the path; the parent OU allows only S3 and CloudWatch, which limits all accounts below it.",
        why: "Correct. With the allow-list strategy, each level's allows intersect." },
      { t: "The child OU's FullAWSAccess overrides the parent.",
        why: "Lower levels can't add permissions removed above them." },
      { t: "The account needs to be re-invited.",
        why: "Moving accounts applies policies immediately." },
      { t: "SCPs are cached for 7 days.",
        why: "Not true." }
    ],
    answer: [0],
    tip: "Allow-list: allow required at every level; parent limits children."
  },
  {
    id: "org-05", domain: "d2", topic: "AWS Organizations",
    q: "A company must restrict all workloads to us-east-1 and eu-west-1 using an SCP. After applying a simple Deny on all actions outside those Regions, users report that IAM, CloudFront and Route 53 operations fail, and the central deployment role can't manage global resources. How should the SCP be written?",
    options: [
      { t: "Deny with NotAction listing global services (iam, sts, organizations, cloudfront, route53, support, etc.), a condition on aws:RequestedRegion not in the allowed list, and an ArnNotLike aws:PrincipalARN exception for the deployment role.",
        why: "Correct. Global services must be exempted, and the admin role can be excluded by principal ARN." },
      { t: "Allow only the two Regions with a tag policy.",
        why: "Tag policies don't control Regions." },
      { t: "Use AWS Config to delete resources in other Regions.",
        why: "Detective and reactive, not preventive." },
      { t: "Attach the Region SCP to the management account only.",
        why: "SCPs don't apply to the management account." }
    ],
    answer: [0],
    tip: "Region SCP = NotAction for global services + aws:RequestedRegion + principal exception."
  },
  {
    id: "org-06", domain: "d2", topic: "AWS Organizations",
    q: "A company has used AWS Organizations with only consolidated billing for years and has 30 invited accounts. The security team now wants to use SCPs. What must happen first?",
    options: [
      { t: "Enable all features in the organization; every invited member account must approve the change.",
        why: "Correct. SCPs need all features, and invited accounts must accept the request." },
      { t: "Create a new organization and move accounts manually.",
        why: "Not required; you can enable all features in place." },
      { t: "Enable trusted access for IAM.",
        why: "Trusted access doesn't enable SCPs." },
      { t: "Nothing; SCPs work with consolidated billing only.",
        why: "Billing-only organizations can't use policies." }
    ],
    answer: [0],
    tip: "SCPs require all features; invited members must approve."
  },
  {
    id: "org-07", domain: "d2", topic: "AWS Organizations",
    q: "An administrator wants to manage an existing AWS account that was invited into the organization by switching roles from the management account, as they do for accounts created through Organizations. Role switching fails. What is the cause?",
    options: [
      { t: "OrganizationAccountAccessRole is created automatically only for accounts created through Organizations; for invited accounts, the role must be created manually with a trust policy for the management account.",
        why: "Correct. Invited accounts don't get the role by default." },
      { t: "Invited accounts can't be managed from the management account.",
        why: "They can, once a suitable role exists." },
      { t: "An SCP blocks sts:AssumeRole.",
        why: "Possible in theory, but the classic cause is the missing role." },
      { t: "Trusted access must be enabled for IAM.",
        why: "Not required for role switching." }
    ],
    answer: [0],
    tip: "Invited accounts lack OrganizationAccountAccessRole; create it."
  },
  {
    id: "org-08", domain: "d2", topic: "AWS Organizations",
    q: "Finance requires every EC2 instance in workload accounts to have a CostCenter tag with a value of 100, 200 or 300. Instances launched without the tag must be blocked, and values must be standardised. Which combination meets these requirements? (Choose TWO.)",
    multi: true,
    options: [
      { t: "An SCP that denies ec2:RunInstances when aws:RequestTag/CostCenter is null.",
        why: "Correct. The SCP makes the tag mandatory at launch." },
      { t: "A tag policy that defines CostCenter with allowed values 100, 200, 300 and enforcement for EC2 instances.",
        why: "Correct. Tag policies standardise and enforce allowed values." },
      { t: "A tag policy alone, because it requires the tag to be present.",
        why: "Tag policies don't make tags mandatory." },
      { t: "An AI services opt-out policy.",
        why: "Unrelated." },
      { t: "A backup policy.",
        why: "Backup policies define AWS Backup plans." }
    ],
    answer: [0, 1],
    tip: "Mandatory tag = SCP aws:RequestTag; standard values = tag policy."
  },
  {
    id: "org-09", domain: "d2", topic: "AWS Organizations",
    q: "A central S3 bucket holds build artifacts that every account in the organization must be able to read, including accounts created in the future. The team doesn't want to maintain a list of account IDs. How should the bucket policy be written?",
    options: [
      { t: "Allow s3:GetObject for Principal * with a condition StringEquals aws:PrincipalOrgID set to the organization ID.",
        why: "Correct. aws:PrincipalOrgID matches any principal in the organization, including new accounts." },
      { t: "List every account ID as a principal and update it monthly.",
        why: "High maintenance, and new accounts are missed." },
      { t: "Make the bucket public.",
        why: "Insecure." },
      { t: "Attach an SCP allowing s3:GetObject on the bucket.",
        why: "SCPs don't grant access." }
    ],
    answer: [0],
    tip: "All org accounts, no ID list = aws:PrincipalOrgID."
  },
  {
    id: "org-10", domain: "d2", topic: "AWS Organizations",
    q: "The security team wants to ensure that S3 buckets and KMS keys in member accounts can never be accessed by principals outside the organization, even if a developer writes an overly permissive bucket or key policy. What should they use?",
    options: [
      { t: "A resource control policy (RCP) that denies access when aws:PrincipalOrgID doesn't match the organization (excluding AWS service principals as needed).",
        why: "Correct. RCPs set maximum permissions on resources for any caller - a data perimeter." },
      { t: "An SCP denying s3:* for external principals.",
        why: "SCPs apply to principals in your member accounts, not to external callers." },
      { t: "A tag policy.",
        why: "Tag policies don't control access." },
      { t: "IAM Access Analyzer only.",
        why: "It finds external access but doesn't prevent it." }
    ],
    answer: [0],
    tip: "Block outside-org access to resources = RCP (data perimeter)."
  },
  {
    id: "org-11", domain: "d2", topic: "AWS Organizations",
    q: "A company wants to enforce that EC2 instances and AMIs in all accounts follow a baseline (for example, no public AMI sharing and IMDSv2 by default), and the setting must remain enforced even when AWS adds new APIs. What should it use?",
    options: [
      { t: "An AWS Organizations declarative policy for EC2.",
        why: "Correct. Declarative policies enforce service configuration baselines independently of individual API calls." },
      { t: "An SCP denying specific API calls.",
        why: "SCPs work per API action; new APIs might not be covered." },
      { t: "AWS Config rules with remediation.",
        why: "Detective, and reacts after the change." },
      { t: "A backup policy.",
        why: "Unrelated." }
    ],
    answer: [0],
    tip: "EC2 baseline surviving new APIs = declarative policy."
  },
  {
    id: "org-12", domain: "d2", topic: "AWS Organizations",
    q: "A company with 15 accounts runs steady EC2 workloads in several of them. Finance wants to reduce compute cost with the least operational effort and receive one bill. What should they do?",
    options: [
      { t: "Use consolidated billing in AWS Organizations and purchase Savings Plans (or RIs) centrally; the discounts apply to matching usage across accounts.",
        why: "Correct. RI and Savings Plans benefits are shared across accounts in the organization by default." },
      { t: "Buy Savings Plans separately in each account and pay each bill.",
        why: "More effort and less discount sharing." },
      { t: "Use the free tier in every account.",
        why: "The organization gets only one free tier." },
      { t: "Move all workloads into the management account.",
        why: "Against best practice." }
    ],
    answer: [0],
    tip: "Shared discounts + one bill = consolidated billing + central Savings Plans / RIs."
  },
  {
    id: "org-13", domain: "d2", topic: "AWS Organizations",
    q: "A business unit purchased Reserved Instances in its own account and doesn't want other accounts in the organization to consume its RI discounts. What should be done?",
    options: [
      { t: "In the management account's billing preferences, turn off RI and Savings Plans discount sharing for that account.",
        why: "Correct. Sharing can be disabled per account." },
      { t: "Remove the account from the organization.",
        why: "Unnecessary." },
      { t: "Attach an SCP that denies ec2:RunInstances in other accounts.",
        why: "Blocks workloads instead of controlling billing." },
      { t: "Move the RIs to a different Region.",
        why: "Doesn't control sharing." }
    ],
    answer: [0],
    tip: "Keep RIs for one account = turn off RI / SP sharing for it."
  },
  {
    id: "org-14", domain: "d2", topic: "AWS Organizations",
    q: "Finance needs to see costs per application team across all accounts and charge them back monthly. Teams tag resources with Team. What should the DevOps engineer configure?",
    options: [
      { t: "Activate Team as a cost allocation tag in the management account, define Cost Categories as needed, and use Cost Explorer / Cost and Usage Report (Data Exports) for the chargeback.",
        why: "Correct. Cost allocation tags are activated in the management (payer) account." },
      { t: "Activate the tag in each member account separately.",
        why: "Cost allocation tags are activated in the management account." },
      { t: "Use an SCP to report costs.",
        why: "SCPs control permissions, not reporting." },
      { t: "Enable AWS Config aggregators.",
        why: "Config tracks configuration, not costs." }
    ],
    answer: [0],
    tip: "Chargeback = cost allocation tags (management account) + Cost Categories + CUR."
  },
  {
    id: "org-15", domain: "d2", topic: "AWS Organizations",
    q: "A company wants GuardDuty and Security Hub enabled in every account, including new accounts, with findings centrally managed. Following best practice, the security team should not work in the management account. What should they do?",
    options: [
      { t: "From the management account, register the Security Tooling account as the delegated administrator for GuardDuty and Security Hub, then enable auto-enable for new organization accounts from that account.",
        why: "Correct. Delegated administrators run org-wide security services without using the management account." },
      { t: "Manage GuardDuty from the management account.",
        why: "Works, but against best practice." },
      { t: "Enable GuardDuty manually in each account.",
        why: "Doesn't scale and misses new accounts." },
      { t: "Use an SCP to enable GuardDuty.",
        why: "SCPs can't enable services." }
    ],
    answer: [0],
    tip: "Org-wide security without the management account = delegated admin + auto-enable."
  },
  {
    id: "org-16", domain: "d2", topic: "AWS Organizations",
    q: "The platform team wants to create, update and attach SCPs and tag policies from a member 'governance' account instead of signing in to the management account. What should be configured?",
    options: [
      { t: "A resource-based delegation policy in AWS Organizations (put-resource-policy) that delegates policy management to the governance account.",
        why: "Correct. Organizations supports delegated administration of policies through a resource-based policy." },
      { t: "Register the governance account as delegated admin for GuardDuty.",
        why: "That delegates GuardDuty, not Organizations policies." },
      { t: "Give the governance account an IAM user in the management account.",
        why: "Still uses the management account." },
      { t: "Use StackSets to deploy SCPs.",
        why: "SCPs are Organizations policies; this doesn't remove the need for delegation." }
    ],
    answer: [0],
    tip: "Manage SCPs from a member account = Organizations delegation policy."
  },
  {
    id: "org-17", domain: "d2", topic: "AWS Organizations",
    q: "Auditors require a single CloudTrail trail that captures API activity from all current and future accounts and that member account administrators can't stop or delete. What should the DevOps engineer configure?",
    options: [
      { t: "An organization trail created in the management account (or by a delegated admin), logging to a central S3 bucket in the Log Archive account.",
        why: "Correct. Organization trails cover all accounts, and member accounts can't modify them." },
      { t: "A trail in each account created by a StackSet.",
        why: "Local admins could change them unless protected; an org trail is simpler." },
      { t: "Enable CloudTrail Insights only.",
        why: "Insights detects unusual activity; it doesn't create the org-wide trail." },
      { t: "Use VPC Flow Logs.",
        why: "Network traffic, not API activity." }
    ],
    answer: [0],
    tip: "All accounts, members can't disable = organization trail."
  },
  {
    id: "org-18", domain: "d2", topic: "AWS Organizations",
    q: "A company wants to automatically run a baseline workflow (create IAM roles, enable logging, notify the team) whenever a new account is created in its organization. What is a correct event-driven approach?",
    options: [
      { t: "Create an Amazon EventBridge rule in us-east-1 that matches the Organizations CreateAccountResult event (from CloudTrail) and invokes a Lambda function or Step Functions workflow.",
        why: "Correct. Organizations events are delivered in us-east-1 and can trigger automation (StackSets auto-deployment or Control Tower are alternatives)." },
      { t: "Poll ListAccounts every hour from every Region.",
        why: "Polling is less efficient, and Organizations is a global service in us-east-1." },
      { t: "Create EventBridge rules in each member account.",
        why: "The events are in the management account in us-east-1." },
      { t: "Use an SCP to trigger the workflow.",
        why: "SCPs don't trigger actions." }
    ],
    answer: [0],
    tip: "React to new accounts = EventBridge (us-east-1) on CreateAccountResult."
  },
  {
    id: "org-19", domain: "d2", topic: "AWS Organizations",
    q: "The network team wants to share VPC subnets from the Network account with all accounts in the Workloads OU without each account accepting an invitation. What should they use?",
    options: [
      { t: "AWS Resource Access Manager with sharing with AWS Organizations enabled, sharing the subnets with the Workloads OU.",
        why: "Correct. With Organizations sharing enabled, RAM shares to OUs without invitations." },
      { t: "VPC peering from every account.",
        why: "Peering connects VPCs; it doesn't share subnets." },
      { t: "An SCP allowing ec2:CreateSubnet.",
        why: "SCPs don't share resources." },
      { t: "CloudFormation StackSets to create identical subnets.",
        why: "That creates separate subnets instead of sharing." }
    ],
    answer: [0],
    tip: "Share subnets / TGW with an OU, no invites = RAM + Organizations sharing."
  },
  {
    id: "org-20", domain: "d2", topic: "AWS Organizations",
    q: "A security team wants to remove root user passwords and access keys from all member accounts, while still being able to perform the few tasks that require root (such as unlocking a misconfigured S3 bucket policy). What should they use?",
    options: [
      { t: "Centralized root access management in AWS Organizations, with privileged root sessions via sts:AssumeRoot from the management account or a delegated admin.",
        why: "Correct. This removes member root credentials and allows short-lived root-only tasks." },
      { t: "An SCP denying all root user actions with no exceptions.",
        why: "Then root-only recovery tasks can't be performed." },
      { t: "Share the root passwords in Secrets Manager.",
        why: "Credentials still exist." },
      { t: "Delete the member accounts.",
        why: "Not reasonable." }
    ],
    answer: [0],
    tip: "No member root credentials + occasional root tasks = centralized root access."
  },
  {
    id: "org-21", domain: "d2", topic: "AWS Organizations",
    q: "Platform engineers deploy baseline IAM roles named platform-* in every account through a pipeline role. Local account administrators sometimes modify or delete these roles. How can the company prevent this while still allowing the pipeline to manage them?",
    options: [
      { t: "An SCP that denies iam:DeleteRole, iam:PutRolePolicy, iam:AttachRolePolicy and iam:UpdateAssumeRolePolicy on arn:aws:iam::*:role/platform-* unless aws:PrincipalARN matches the pipeline role (ArnNotLike condition).",
        why: "Correct. The SCP protects the roles from everyone except the pipeline role." },
      { t: "A permissions boundary on the platform roles.",
        why: "Boundaries limit what the roles can do, not who can modify them." },
      { t: "A tag policy on the roles.",
        why: "Tag policies don't prevent IAM changes." },
      { t: "AWS Config rule to detect role changes.",
        why: "Detective only." }
    ],
    answer: [0],
    tip: "Protect baseline resources from local admins = SCP deny + principal exception."
  },
  {
    id: "org-22", domain: "d2", topic: "AWS Organizations",
    q: "Following AWS multi-account best practices, where should a company test new SCPs before applying them to production OUs, and where should centralized logs be stored?",
    options: [
      { t: "Test SCPs in a dedicated Policy Staging OU (or sandbox accounts) and store logs in a Log Archive account in the Security OU.",
        why: "Correct. This matches the AWS recommended OU structure." },
      { t: "Test SCPs directly on the root and store logs in the management account.",
        why: "Risky for every account, and the management account should hold no workloads or data." },
      { t: "Test SCPs on the management account.",
        why: "SCPs don't apply there, so testing would show nothing." },
      { t: "Store logs in each workload account.",
        why: "Logs should be centralized and protected from workload admins." }
    ],
    answer: [0],
    tip: "Test SCPs in Policy Staging OU; logs in Log Archive (Security OU)."
  },
  // ───────────────────────────── Domain 2: Control Tower ─────────────────────────────
  {
    id: "ctw-01", domain: "d2", topic: "Control Tower",
    q: "A company is starting its AWS journey and needs a multi-account environment that follows AWS best practices: centralized logging, an audit account for the security team, SSO, preventive and detective guardrails, and a way to vend new accounts. The team wants to do this as quickly as possible with minimal custom code. What should they use?",
    options: [
      { t: "Set up an AWS Control Tower landing zone.",
        why: "Correct. Control Tower automates the multi-account baseline: Log Archive and Audit accounts, org CloudTrail, Config, Identity Center, controls and Account Factory." },
      { t: "Create AWS Organizations manually and write StackSets for every baseline item.",
        why: "Possible, but much more custom work than Control Tower." },
      { t: "Use a single account with IAM roles per team.",
        why: "Doesn't meet the multi-account requirement." },
      { t: "Use AWS Service Catalog only.",
        why: "Service Catalog provides products but not the landing zone, logging and controls." }
    ],
    answer: [0],
    tip: "Quick best-practice multi-account setup = Control Tower landing zone."
  },
  {
    id: "ctw-02", domain: "d2", topic: "Control Tower",
    q: "After setting up a Control Tower landing zone, where are the organization's CloudTrail logs and AWS Config logs stored, and which account is intended for the security team's cross-account access and notifications?",
    options: [
      { t: "Logs are stored in S3 buckets in the Log Archive account; the Audit account provides security team roles, aggregated SNS notifications and the Config aggregator.",
        why: "Correct. These are the two shared accounts in the Security OU." },
      { t: "Logs are stored in the management account; the Audit account stores backups.",
        why: "Logs go to the Log Archive account, and the management account should hold no workloads or data." },
      { t: "Logs are stored in each member account; the Log Archive account runs GuardDuty.",
        why: "Logs are centralized, and security tooling belongs in the Audit account." },
      { t: "Logs are stored in the Audit account; the Log Archive account holds SSO users.",
        why: "Reversed roles." }
    ],
    answer: [0],
    tip: "Log Archive = logs; Audit = security team, SNS, aggregator."
  },
  {
    id: "ctw-03", domain: "d2", topic: "Control Tower",
    q: "A company set up Control Tower with us-east-1 as the home Region. It now wants eu-west-1 as the home Region. What is true?",
    options: [
      { t: "The home Region can't be changed after setup; eu-west-1 can be added as a governed Region instead.",
        why: "Correct. The home Region is fixed at setup; additional governed Regions can be added." },
      { t: "Change the home Region in the landing zone settings.",
        why: "Not supported." },
      { t: "Update the landing zone manifest with the new home Region.",
        why: "The home Region can't be changed through updates." },
      { t: "Re-register all OUs in eu-west-1.",
        why: "Doesn't change the home Region." }
    ],
    answer: [0],
    tip: "Home Region is fixed; add governed Regions."
  },
  {
    id: "ctw-04", domain: "d2", topic: "Control Tower",
    q: "A company governed by Control Tower must ensure that no resources are created in Regions other than its two governed Regions, except for global services. What is the simplest solution?",
    options: [
      { t: "Enable the Control Tower Region deny control (landing zone setting or per OU).",
        why: "Correct. It denies API calls in ungoverned Regions while exempting global services." },
      { t: "Write a detective Config rule for each Region.",
        why: "Detective only, and Config wouldn't run in ungoverned Regions." },
      { t: "Remove the Regions from the account settings manually in each account.",
        why: "Default Regions can't be disabled, and this doesn't scale." },
      { t: "Use a tag policy.",
        why: "Tag policies don't control Regions." }
    ],
    answer: [0],
    tip: "Block ungoverned Regions = Region deny control."
  },
  {
    id: "ctw-05", domain: "d2", topic: "Control Tower",
    q: "A security team wants three things in Control Tower-governed accounts: block changes to CloudTrail, report S3 buckets that already allow public read, and stop CloudFormation stacks that would create unencrypted S3 buckets before the buckets exist. Which control behaviours match these needs, in order?",
    options: [
      { t: "Preventive, detective, proactive.",
        why: "Correct. Preventive controls use SCPs, detective controls use Config rules, proactive controls use CloudFormation Hooks." },
      { t: "Detective, preventive, proactive.",
        why: "Blocking changes is preventive; reporting existing buckets is detective." },
      { t: "Proactive, detective, preventive.",
        why: "Proactive applies to CloudFormation provisioning checks." },
      { t: "Preventive for all three.",
        why: "SCPs can't report existing non-compliance or inspect CloudFormation templates." }
    ],
    answer: [0],
    tip: "Block = preventive (SCP); report = detective (Config); before CFN creates = proactive (Hooks)."
  },
  {
    id: "ctw-06", domain: "d2", topic: "Control Tower",
    q: "How are Control Tower proactive controls implemented?",
    options: [
      { t: "As AWS CloudFormation Hooks that evaluate resources before CloudFormation provisions them.",
        why: "Correct. Non-compliant resources make the stack operation fail (or warn)." },
      { t: "As service control policies.",
        why: "SCPs implement preventive controls." },
      { t: "As AWS Config rules.",
        why: "Config rules implement detective controls." },
      { t: "As GuardDuty findings.",
        why: "GuardDuty is threat detection, not a control type." }
    ],
    answer: [0],
    tip: "Proactive controls = CloudFormation Hooks."
  },
  {
    id: "ctw-07", domain: "d2", topic: "Control Tower",
    q: "An administrator tries to disable a Control Tower control that prevents changes to the log archive bucket policy, but the option isn't available. Why?",
    options: [
      { t: "It's a mandatory control, which is always enabled on registered OUs and can't be disabled.",
        why: "Correct. Mandatory controls protect the landing zone itself." },
      { t: "Controls can only be disabled from the Audit account.",
        why: "Controls are managed from the management account." },
      { t: "The control must first be detached from the management account.",
        why: "Controls aren't attached to the management account." },
      { t: "Disabling requires AWS Support.",
        why: "Mandatory controls can't be disabled at all." }
    ],
    answer: [0],
    tip: "Mandatory controls can't be disabled."
  },
  {
    id: "ctw-08", domain: "d2", topic: "Control Tower",
    q: "A detective control in Control Tower reports several non-compliant EBS volumes that aren't encrypted. The security team expected Control Tower to fix them automatically. What should the DevOps engineer do?",
    options: [
      { t: "Explain that detective controls only report non-compliance, and add AWS Config remediation (for example with SSM Automation) or an EventBridge-driven Lambda to fix resources.",
        why: "Correct. Detective controls don't remediate by themselves." },
      { t: "Change the control to mandatory.",
        why: "Guidance level doesn't add remediation." },
      { t: "Re-register the OU.",
        why: "Re-registering doesn't fix resources." },
      { t: "Enable the Region deny control.",
        why: "Unrelated to encryption." }
    ],
    answer: [0],
    tip: "Detective controls only report; add remediation."
  },
  {
    id: "ctw-09", domain: "d2", topic: "Control Tower",
    q: "A company wants to bring 40 existing accounts that are already in an OU named Legacy under Control Tower governance with the least effort. What should it do?",
    options: [
      { t: "Register the Legacy OU in Control Tower, which applies the baseline and mandatory controls to all accounts in it (after a precheck).",
        why: "Correct. Registering an OU extends governance to all its accounts." },
      { t: "Close the accounts and recreate them with Account Factory.",
        why: "Disruptive and unnecessary." },
      { t: "Deploy StackSets to the OU manually.",
        why: "Doesn't make them governed by Control Tower." },
      { t: "Move the accounts into the Security OU.",
        why: "The Security OU is for Log Archive and Audit." }
    ],
    answer: [0],
    tip: "Existing OU under CT = register OU."
  },
  {
    id: "ctw-10", domain: "d2", topic: "Control Tower",
    q: "Enrolling an existing account into Control Tower fails. The account was invited into the organization last year and has an AWS Config recorder that the application team set up. What are the MOST likely causes? (Choose TWO.)",
    multi: true,
    options: [
      { t: "The account doesn't have the AWSControlTowerExecution role trusted by the management account.",
        why: "Correct. Enrollment requires this role in the account." },
      { t: "The existing AWS Config recorder / delivery channel conflicts with the one Control Tower needs to create.",
        why: "Correct. Existing Config resources must be removed or handled before enrollment." },
      { t: "The account isn't in the home Region.",
        why: "Accounts aren't in a Region." },
      { t: "The account has too many IAM users.",
        why: "Not an enrollment prerequisite." },
      { t: "GuardDuty isn't enabled.",
        why: "Control Tower doesn't require GuardDuty." }
    ],
    answer: [0, 1],
    tip: "Enroll fails = missing AWSControlTowerExecution / existing Config recorder (or blocking SCPs)."
  },
  {
    id: "ctw-11", domain: "d2", topic: "Control Tower",
    q: "AWS released a new Control Tower landing zone version. After the administrator updates the landing zone, what should be done so that existing accounts receive the updated baseline?",
    options: [
      { t: "Re-register the OUs (or update the enrolled accounts) so the new baseline is applied.",
        why: "Correct. Updating the landing zone doesn't automatically update every account's baseline." },
      { t: "Nothing; all accounts are updated instantly.",
        why: "OUs and accounts need re-registration / update." },
      { t: "Delete and recreate the landing zone.",
        why: "Not required." },
      { t: "Move all accounts to the root.",
        why: "That causes drift." }
    ],
    answer: [0],
    tip: "After landing zone update = re-register OUs / update accounts."
  },
  {
    id: "ctw-12", domain: "d2", topic: "Control Tower",
    q: "An engineer moved an enrolled account to a different OU directly in the AWS Organizations console. Control Tower now reports drift. What is the correct way to resolve and prevent this?",
    options: [
      { t: "Move the account back (or into a registered OU) and update / re-enroll it through Account Factory; make future OU and account changes through Control Tower.",
        why: "Correct. Changes made outside Control Tower cause drift, which is fixed by updating, re-enrolling or repairing." },
      { t: "Ignore the drift; it resolves itself.",
        why: "Drift remains until fixed." },
      { t: "Delete the landing zone and set it up again.",
        why: "Excessive." },
      { t: "Disable the mandatory controls.",
        why: "Mandatory controls can't be disabled, and this doesn't address drift." }
    ],
    answer: [0],
    tip: "Drift from Organizations changes = fix via CT (update / re-enroll / repair)."
  },
  {
    id: "ctw-13", domain: "d2", topic: "Control Tower",
    q: "Someone edited one of the aws-guardrails-* SCPs created by Control Tower, and the dashboard shows SCP drift. What should the administrator do?",
    options: [
      { t: "Re-register the affected OU (or re-enable the control / repair the landing zone) so Control Tower restores its managed SCP, and avoid editing Control Tower-managed resources.",
        why: "Correct. Control Tower restores its managed configuration." },
      { t: "Edit the SCP back manually and leave the drift.",
        why: "Control Tower still needs to reconcile its resources." },
      { t: "Attach a new SCP that duplicates the old one.",
        why: "Doesn't fix the drifted managed SCP." },
      { t: "Disable SCPs in the organization.",
        why: "Breaks all preventive controls." }
    ],
    answer: [0],
    tip: "Edited CT SCP = drift; re-register / repair; don't edit CT resources."
  },
  {
    id: "ctw-14", domain: "d2", topic: "Control Tower",
    q: "A company governed by Control Tower wants business units to request new AWS accounts themselves, with every account automatically placed in the right OU with the standard baseline. Account creation must also be automatable from an internal portal through an API. What should they use?",
    options: [
      { t: "Control Tower Account Factory, which is a Service Catalog product; grant business users access in Service Catalog and use the ProvisionProduct API from the portal.",
        why: "Correct. Account Factory provides governed account vending with self-service and API automation." },
      { t: "Organizations CreateAccount API directly from the portal.",
        why: "Accounts wouldn't be enrolled with the Control Tower baseline automatically." },
      { t: "CloudFormation StackSets.",
        why: "StackSets deploy stacks into existing accounts; they don't create accounts." },
      { t: "AWS RAM.",
        why: "RAM shares resources." }
    ],
    answer: [0],
    tip: "Self-service governed accounts + API = Account Factory (Service Catalog ProvisionProduct)."
  },
  {
    id: "ctw-15", domain: "d2", topic: "Control Tower",
    q: "Every account created through Control Tower Account Factory must get a VPC with a specific CIDR range and two private subnets, and no default VPC. What is the simplest way to achieve this?",
    options: [
      { t: "Configure the Account Factory network configuration (VPC creation, CIDR, subnets, Regions).",
        why: "Correct. Account Factory has built-in VPC settings for new accounts." },
      { t: "Ask account owners to create the VPC manually.",
        why: "Not automated." },
      { t: "Use an SCP to create the VPC.",
        why: "SCPs can't create resources." },
      { t: "Use AWS Config to create the VPC.",
        why: "Config evaluates resources; it doesn't provision them." }
    ],
    answer: [0],
    tip: "Standard VPC in new accounts = Account Factory network configuration."
  },
  {
    id: "ctw-16", domain: "d2", topic: "Control Tower",
    q: "A platform team manages all infrastructure with Terraform and Git. They want to request new Control Tower accounts by committing code, and automatically apply Terraform customizations to all accounts and to specific accounts. What should they deploy?",
    options: [
      { t: "Account Factory for Terraform (AFT) in a dedicated AFT management account, using the account request, global customizations and account customizations repositories.",
        why: "Correct. AFT provides Terraform GitOps account vending and customizations on top of Control Tower." },
      { t: "Customizations for Control Tower (CfCT).",
        why: "CfCT uses CloudFormation and SCPs, not Terraform." },
      { t: "Service Catalog portfolios with CloudFormation products.",
        why: "Not Terraform GitOps vending." },
      { t: "CloudFormation StackSets with auto-deployment.",
        why: "Doesn't create accounts or use Terraform." }
    ],
    answer: [0],
    tip: "Terraform GitOps account vending = AFT."
  },
  {
    id: "ctw-17", domain: "d2", topic: "Control Tower",
    q: "A team using AFT changed its global customizations and needs to re-apply them to all existing accounts without creating new accounts. How should they do this?",
    options: [
      { t: "Run the aft-invoke-customizations Step Functions state machine, targeting all accounts (or selected OUs / accounts).",
        why: "Correct. This re-runs customizations on existing accounts." },
      { t: "Delete and recreate the accounts.",
        why: "Destructive." },
      { t: "Re-register the OUs in Control Tower.",
        why: "Re-registers the Control Tower baseline, not AFT Terraform customizations." },
      { t: "Update the landing zone.",
        why: "Unrelated to AFT customizations." }
    ],
    answer: [0],
    tip: "Re-apply AFT customizations = aft-invoke-customizations."
  },
  {
    id: "ctw-18", domain: "d2", topic: "Control Tower",
    q: "A company uses CloudFormation for baseline resources and wants these templates, plus several custom SCPs, managed as code in a repository and automatically deployed to target OUs. Every new account created by Account Factory must receive them without manual steps. What should they use?",
    options: [
      { t: "Customizations for AWS Control Tower (CfCT), with a manifest.yaml defining StackSet and SCP resources and their target OUs; CfCT runs on the CreateManagedAccount lifecycle event.",
        why: "Correct. CfCT deploys CloudFormation (via StackSets) and SCPs through a pipeline and automatically for new accounts." },
      { t: "AFT.",
        why: "AFT is Terraform-based." },
      { t: "AWS Config conformance packs.",
        why: "Conformance packs evaluate compliance; they don't deploy baseline resources and SCPs." },
      { t: "Manually run StackSets after each account is created.",
        why: "Not automated." }
    ],
    answer: [0],
    tip: "CloudFormation + SCPs as code, auto for new accounts = CfCT."
  },
  {
    id: "ctw-19", domain: "d2", topic: "Control Tower",
    q: "A small team wants the simplest way to apply a standard CloudFormation template (for example a budget and an IAM role) to accounts when they're created or updated through the Account Factory console, without building a pipeline. What should they use?",
    options: [
      { t: "Account Factory Customization (AFC) blueprints - Service Catalog products in a hub account selected when provisioning or updating accounts.",
        why: "Correct. AFC is the built-in, console-driven customization option." },
      { t: "AFT.",
        why: "AFT requires a dedicated account, Terraform and Git pipelines." },
      { t: "CfCT.",
        why: "CfCT needs a pipeline and manifest." },
      { t: "Landing Zone Accelerator.",
        why: "Designed for larger, config-driven environments." }
    ],
    answer: [0],
    tip: "Simplest console customization = AFC blueprints."
  },
  {
    id: "ctw-20", domain: "d2", topic: "Control Tower",
    q: "After Control Tower finishes creating and enrolling a new account, the company wants to automatically register the account in its CMDB and create a budget. Which event should trigger the automation?",
    options: [
      { t: "The Control Tower CreateManagedAccount lifecycle event, through an EventBridge rule in the management account's home Region.",
        why: "Correct. This event fires after the account is fully provisioned and enrolled." },
      { t: "The Organizations CreateAccount event.",
        why: "It fires before the Control Tower baseline is in place." },
      { t: "A CloudWatch alarm on account count.",
        why: "Not event-driven and imprecise." },
      { t: "The EnableGuardrail event.",
        why: "That's for controls." }
    ],
    answer: [0],
    tip: "After CT account creation = CreateManagedAccount lifecycle event."
  },
  {
    id: "ctw-21", domain: "d2", topic: "Control Tower",
    q: "The security team assumed Control Tower would enable Amazon GuardDuty in all accounts, but GuardDuty isn't enabled. What should the DevOps engineer do?",
    options: [
      { t: "Designate the Audit account as the GuardDuty delegated administrator and enable auto-enable for all organization accounts.",
        why: "Correct. Control Tower doesn't enable GuardDuty; the Audit account is the recommended delegated admin." },
      { t: "Enable a mandatory control for GuardDuty.",
        why: "There isn't one that enables GuardDuty." },
      { t: "Re-register all OUs.",
        why: "Doesn't enable GuardDuty." },
      { t: "Enable GuardDuty only in the management account.",
        why: "Doesn't cover member accounts." }
    ],
    answer: [0],
    tip: "CT doesn't enable GuardDuty; Audit account as delegated admin + auto-enable."
  },
  {
    id: "ctw-22", domain: "d2", topic: "Control Tower",
    q: "A company wants to enable a specific Control Tower control on several OUs as part of its infrastructure-as-code pipeline instead of clicking in the console. Which approach supports this?",
    options: [
      { t: "Use the Control Tower EnableControl API (control ARN + target OU ARN) or the CloudFormation resource AWS::ControlTower::EnabledControl.",
        why: "Correct. Controls can be managed programmatically and as IaC." },
      { t: "Create an SCP with the same name in Organizations.",
        why: "Not a Control Tower-managed control, and it may cause drift." },
      { t: "Use AWS Config conformance packs.",
        why: "Not Control Tower controls." },
      { t: "It's not possible; controls are console-only.",
        why: "APIs and CloudFormation support exist." }
    ],
    answer: [0],
    tip: "Controls as code = EnableControl API / AWS::ControlTower::EnabledControl."
  }
];







