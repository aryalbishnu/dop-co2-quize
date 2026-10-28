// DOP-C02 quiz question bank.
// To add questions: append objects to QUESTIONS below.
//   domain : must match a domain id in DOMAINS
//   topic  : must match a topic name listed under that domain
//   answer : array of correct option indexes (0-based). More than one = multiple-response question.
//   options: each has t (text) and why (why it is right / wrong)
//   tip    : one-line exam takeaway shown after answering

window.DOMAINS = [
  { id: "d1", name: "Domain 1: SDLC Automation", weight: 22,
    topics: ["CodeCommit", "CodeBuild", "CodeArtifact", "ECR", "CodePipeline", "CodeConnections", "CodeGuru", "CI/CD Concepts", "CodeDeploy", "Deployment Patterns", "Elastic Beanstalk", "Lambda Versions and Aliases", "ECS and Fargate"] },
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
  }
];
