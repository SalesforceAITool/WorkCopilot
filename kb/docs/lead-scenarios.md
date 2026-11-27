# Lead roles: leadership, governance and behavioural

55 questions. Levels: Fresher (0–2 yrs) 0 · Mid (3–6 yrs) 4 · Senior (7–10 yrs) 51

## Technical Leadership

### As a technical lead, how do you run code reviews for your team?
*Senior (7–10 yrs) · scenario* · `lead-001`

I run code review as a process, not just a checklist. Every change goes through a pull request with a short template: what it does, the story number, how it was tested, and any deployment steps. The pipeline runs first, so static analysis, Apex tests and a validation deploy catch the mechanical stuff before a human looks. Then a peer reviews, and I review anything touching shared objects, integrations or security. I look for, in order: does it work for 200 records, is it secure, is it in the right layer, and will someone understand it in a year. Say a developer adds a second trigger on Opportunity. CI won't catch that, but the review should, and I'd point them to the handler pattern. I also agree a turnaround time, say same day, so PRs don't rot. And I keep comments about the code, with a reason, never about the person.

- PR template plus CI gates before human review
- Peer review for all, lead review for shared or risky areas
- Priorities: bulk safety, security, design, readability
- Agreed turnaround so reviews don't block delivery

<sub>Also asked as: What does your code review process look like as a lead? · How do you make sure code reviews actually improve quality and don't slow the team down? · Walk me through your pull request process for a Salesforce team · how do you do code reviews as a team lead</sub>

### You're setting up a new Salesforce team. How do you define coding standards and pick a trigger framework?
*Senior (7–10 yrs) · design* · `lead-002`

I keep the standards short, written down and enforced by tools wherever possible. The guide covers naming, one trigger per object with a handler, bulk patterns, how we enforce sharing and field security, error logging, test data factories, and when to use Flow versus Apex. For the trigger framework, I pick something the team can understand in an afternoon, with a bypass switch in custom metadata, rather than the most powerful framework on paper. If the team is new to enterprise patterns, a simple handler base class beats full fflib. Then I make it real: a template repo, a sample object fully wired up, PMD rules in the pipeline, and a PR checklist that points to the guide. For example, when a developer starts on Case automation, they copy the Account example and get the structure right from day one. I review the guide with the team every few months, because standards nobody agrees with get ignored.

- Short written guide, enforced by tooling where possible
- Choose a framework the team can understand, with a bypass switch
- Template repo and worked example beat a long document
- Revisit standards with the team regularly

<sub>Also asked as: How would you set coding standards for a development team? · Which trigger framework would you standardise on as a lead, and how do you roll it out? · How do you get a whole team to follow the same patterns? · what standards do you put in place on day one for a new team</sub>

### A junior developer's pull requests keep getting rejected and they seem demotivated. How do you mentor them?
*Senior (7–10 yrs) · scenario* · `lead-003`

I'd first find out why, then change how we work together, not just push harder. I'd have a one-to-one and look at their last few PRs with them. Usually it's a pattern, like not understanding bulkification, or unclear acceptance criteria. Then I'd pair with them on the next story: they drive, I ask questions like 'what happens if 200 records come in here?' so they find the issue themselves. I'd give them a slightly smaller, well-defined story to get a clean win, and ask a peer to do a quick early review before the formal PR, so feedback arrives sooner and feels less public. Say they keep missing field-level security. I'd show the user-mode query pattern once, add it to our examples, and expect it from then on. I'd also tell them what they're doing well. Most juniors improve fast once feedback is earlier, kinder and more specific.

- Find the pattern behind the rejections first
- Pair with them driving, ask questions instead of giving answers
- Smaller well-defined stories for early wins
- Earlier informal reviews, and name what they do well

<sub>Also asked as: How do you grow a junior developer into an independent developer? · A fresher on your team is struggling. What would you do? · How do you mentor juniors without just fixing their code for them? · what is your approach to mentoring junior salesforce developers</sub>

### A stakeholder asks you for an estimate for a new feature right there in the meeting. How do you respond?
*Senior (7–10 yrs) · scenario* · `lead-004`

I give a rough range with clear assumptions, and promise a firmer number after I've talked to the team. I don't commit the team to a number on my own. Say the sales director asks for automatic territory assignment on new leads. I'd say something like 'if the rules live in Salesforce and there's no integration, this is roughly a one to two sprint item. If the territory data comes from another system, it's bigger. Let me break it down with the team and come back by Thursday.' Then I split it into pieces with the developers, estimate each, and add the things people forget: tests, review, UAT fixes, deployment and data. If one part is a real unknown, I propose a short spike before committing. When I send the estimate, I write down the assumptions, so if scope moves later, everyone understands why the number changes. An honest range beats a confident wrong number.

- Rough range plus assumptions, firm number later
- Estimate with the people who will build it
- Add testing, review, UAT and deployment effort
- Spike the unknowns, write assumptions down

<sub>Also asked as: How do you estimate a feature when the business wants a number immediately? · How do you avoid committing your team to an estimate that's wrong? · Someone asks 'how long will this take' on a call. What do you say? · how do you give estimates as a tech lead</sub>

### Tell me about a production incident you led. How did you handle it?
*Senior (7–10 yrs) · scenario* · `lead-005`

I'd walk through it as situation, my role, the steps and what changed afterwards. The steps are what matter. First, I take the lead role clearly: one person coordinating, one or two investigating, one handling communication, so people aren't all debugging the same thing. Second, I confirm impact, who is affected and how badly, and send a first update to stakeholders with the time of the next one. Third, we look at what changed: a deployment, a data load, a config change, a release. Fourth, we restore service with the fastest safe option, like deactivating a Flow or flipping a bypass, not a rushed code fix. For example, if quotes stopped saving after last night's release, I'd switch off the new automation first and fix properly through the hotfix path. Finally, a blameless review: root cause, why we missed it, and actions like a new test or monitor, with owners and dates.

- Assign roles: coordinator, investigators, communicator
- Confirm impact and set a regular update cadence
- Check recent changes, restore service before perfect fix
- Blameless review with owned actions

<sub>Also asked as: Walk me through how you lead the team during a P1 incident · Describe a time production went down and you were in charge of fixing it · How do you coordinate people and communication during a major outage? · what do you do as lead when there's a sev one in production</sub>

### How would you set up release management and branching for a team of about ten Salesforce developers?
*Senior (7–10 yrs) · design* · `lead-006`

I'd make everything go through source control and one pipeline, with a predictable release rhythm. Each developer works in their own sandbox or scratch org, on short-lived feature branches off main. PRs need a review and a passing validation. Merged work flows to an integration org, then QA, then UAT, then production, promoted by the pipeline, never by change sets or direct edits. I'd set a release calendar, for example every two weeks, with a cut-off date, a UAT window and a named release manager for each release, rotating if possible. Hotfixes come off main and get merged back. I'd also keep a simple release note per release and a rollback plan for anything risky. Say two developers both change the Opportunity page layout. Short branches and daily merges surface that conflict in a day, not at release time. The model matters less than the discipline: small changes, merged often, one way into production.

- One pipeline, no direct changes in higher orgs
- Short-lived feature branches, PR review and validation
- Fixed release calendar with cut-off and release manager
- Hotfix path and rollback plan

<sub>Also asked as: Ten developers are working in the same org. How do you manage releases? · As a lead, how do you plan your release process and environments? · What release cadence and branching model would you recommend for a mid-size Salesforce team? · how do you stop ten devs from stepping on each other during releases</sub>

### A stakeholder insists on a solution you think is wrong. How do you push back?
*Senior (7–10 yrs) · scenario* · `lead-007`

I push back on the solution, not the goal, and I bring options instead of a flat no. First I make sure I understand the real need behind the request. Say the sales VP wants a custom field on every object to flag 'VIP customer' and automation copying it everywhere. The real need is probably 'reps should see VIP status wherever they are.' Then I explain the cost in business terms: more automation to maintain, slower saves, data getting out of sync. And I offer alternatives with trade-offs, like one field on Account surfaced through formula fields or a component on related records. If they still want their version, I write down the risk, get the decision owner to accept it, and deliver it well. It's their call on business priorities, my job is to make the trade-off clear. What I won't do is quietly agree and then build something different.

- Understand the goal behind the request
- Explain cost and risk in business terms
- Offer two or three options with trade-offs
- If overruled, record the risk and commit

<sub>Also asked as: How do you say no to a business stakeholder? · The business wants something that will hurt the org long term. What do you do? · How do you handle a product owner who won't accept your technical advice? · tell me how you push back on stakeholders</sub>

### A director wants a change in production by Friday, which means skipping testing. What do you do?
*Senior (7–10 yrs) · scenario* · `lead-008`

I don't simply refuse. I look for a way to hit the date safely, and if there isn't one, I make the risk visible and let the right person decide. First I ask what has to be live by Friday and why. Often a smaller slice is enough. Say they need a new discount field and approval for a sales event. Maybe the field and a simple validation go Friday, and the full approval process follows next week. Second, I compress testing rather than skip it: focused tests on the changed area, a quick smoke test in a full sandbox, and a rollback plan ready. Third, if they still want everything untested, I put the risk in writing, what could break and who would be affected, and get the decision owner to approve it. Most leaders pick the safe slice once they see the risk clearly. The goal is to be the person who finds a way, not the person who blocks.

- Find out what must really be live and why
- Offer a smaller safe slice for the date
- Compress testing, never skip it, have rollback ready
- If overruled, document the risk and the decision owner

<sub>Also asked as: The business wants you to deploy without proper testing. How do you handle it? · How do you handle pressure to cut corners on a release? · Someone senior asks you to deploy straight to production. What do you say? · what if a manager forces a release that isn't tested</sub>

### How do you prioritise technical debt against new features as a lead?
*Senior (7–10 yrs) · scenario* · `lead-009`

I make debt visible, translate it into business risk, and agree a standing share of each sprint for it. First I keep a debt log in the same backlog as features, not a separate spreadsheet nobody reads. Each item gets a simple score: how likely it is to cause a problem, how bad that would be, and how much it slows us down. Then I explain the top items in business language. Not 'we have three triggers on Opportunity', but 'every change to opportunities takes longer and breaks more often, and that's why last month's pricing change needed two hotfixes'. I agree with the product owner on a fixed share of capacity for debt, and I attach debt fixes to features when they touch the same area. For example, when we're already changing Opportunity for a new stage, that's the time to consolidate its triggers. Anything that's a security or data-loss risk goes to the top regardless.

- Debt lives in the same backlog, scored by risk and drag
- Explain it in business impact, not technical terms
- Agree a standing capacity share with the product owner
- Bundle debt fixes with features in the same area

<sub>Also asked as: How do you convince the business to spend time on technical debt? · The product owner only wants features. How do you get debt into the backlog? · How do you decide which tech debt to fix first? · how do you balance tech debt and new feature work</sub>

### How do you decide between building a custom solution and buying an AppExchange app?
*Senior (7–10 yrs) · comparison* · `lead-010`

I compare total cost and fit over a few years, not just the build estimate. Buying makes sense when the problem is common and not what makes the business different: document generation, e-signature, data backup, CPQ-style quoting add-ons. A vendor maintains it, keeps up with Salesforce releases and has already solved the edge cases. Building makes sense when the process is unique and a real advantage, or when apps would need so much customisation that you're fighting them. Say the team wants to build PDF generation for invoices. I'd ask: how many templates, how often do they change, who maintains it when the developer leaves? Usually a package wins. My checklist covers licence cost per user over time, security review and data residency, how it affects limits and upgrades, vendor health and support, exit plan, and the internal effort to build and maintain. I write the decision down with the reasons so we can revisit it later.

- Buy for common, non-differentiating needs
- Build when the process is unique or apps need heavy customisation
- Compare multi-year total cost including maintenance
- Check security, limits, vendor health and exit plan

<sub>Also asked as: Build versus buy on Salesforce: how do you make the call? · When would you recommend an AppExchange package instead of custom development? · The team wants to build a document generation tool. Would you build or buy? · build vs buy decision as a salesforce lead</sub>

### What is a design authority and how would you run one for a Salesforce programme?
*Senior (7–10 yrs) · design* · `lead-011`

A design authority is a small group that reviews and approves significant technical decisions, so different teams don't make conflicting choices in a shared org. I'd keep it lightweight. Members are usually the lead architect, tech leads from each team, someone from security, and the platform owner. The key is a clear rule for what needs review: new integrations, changes to shared objects like Account or Case, new packages, data model changes, and anything affecting security or limits. Smaller changes just follow standards and code review. Teams bring a one-page proposal with the options considered, and we decide in a regular weekly slot, with a fast path for urgent items. Say the service team wants a new trigger on Account that the sales team also uses. That goes to the design authority, and we might decide to add it to the existing handler instead. Every decision gets recorded, so people can see why things are the way they are.

- Small group: architect, team leads, security, platform owner
- Clear criteria for what needs review
- One-page proposals with options, weekly slot plus fast path
- Record decisions so the reasoning is visible

<sub>Also asked as: How would you set up an architecture review board? · What changes should go through design review and which shouldn't? · How do you stop teams making conflicting design decisions in the same org? · what is design authority in salesforce projects</sub>

### You join as the first technical lead in an org with no governance. What do you put in place in your first 90 days?
*Senior (7–10 yrs) · scenario* · `lead-012`

I'd learn first, fix the riskiest things next, and only then add process. In the first few weeks I'd listen: talk to admins, developers and business owners, and run an org health check covering security, limits, test coverage, automation per object and recent incidents. Then quick wins that reduce risk: get all metadata into source control, stop direct production changes except an agreed emergency path, and set up a basic pipeline with validation deploys. After that, I'd add light standards: a coding guide, a trigger pattern, a definition of done and a simple intake process so requests are prioritised in one place. Around the end, I'd share a roadmap for the bigger items, like debt clean-up or a CoE. Say I find admins editing Flows directly in production. I wouldn't ban it on day one. I'd show them the sandbox-to-pipeline path, make it easy, and then switch off the old way. Governance that people resent gets bypassed.

- Listen and run an org health check first
- Quick wins: source control, no direct prod changes, basic pipeline
- Then light standards and one intake process
- Bring people along so they don't bypass governance

<sub>Also asked as: The org has no standards, no source control and admins change production directly. Where do you start? · How would you introduce governance to a messy Salesforce org? · What would your first three months look like as a new Salesforce lead? · first 90 days plan as salesforce technical lead</sub>

### A business unit asks for its own separate Salesforce org. How do you handle the request?
*Senior (7–10 yrs) · scenario* · `lead-013`

I treat it as a real option, but I first find out what problem they're trying to solve, because a new org is often an expensive fix for a process problem. Usually the complaint is 'our changes wait weeks behind other teams' or 'your automation slows our users down.' Those can often be fixed inside one org: their own release train, permission-based separation, record types, and better governance. Then I'd assess honestly. Do they share customers or products with the rest of the business? Do they need shared reporting? Are there legal or data residency rules that force separation? Say a newly acquired business sells to completely different customers under different regulations. That's a good case for its own org. If they share customers, splitting creates integration work, duplicate records and a harder single customer view. I'd present both options with cost, timeline and trade-offs, and let leadership decide with the facts in front of them.

- Find the underlying problem first
- Many complaints can be solved within one org
- Real drivers: no shared customers, legal or residency rules
- Present costed options and let leadership decide

<sub>Also asked as: A division says the shared org is too slow for them and wants its own org. What do you do? · How would you advise leadership on single org versus multi-org? · One team wants independence from the main org's release process. Is a new org the answer? · should a business unit get its own salesforce org</sub>

### Halfway through the sprint you realise the team won't deliver what it committed. What do you do?
*Senior (7–10 yrs) · scenario* · `lead-014`

I raise it early, cut scope deliberately and protect the most important item, rather than hoping the last days fix it. First I find out why: an unknown in an integration, a blocked environment, a story bigger than estimated, or people pulled into production support. Then I talk to the product owner straight away, not on the last day, and we agree what matters most for the sprint goal. Say we committed to a new case routing feature plus three smaller changes, and the routing work hit an issue with the omni-channel setup. I'd move people onto the routing problem, drop or defer one of the smaller items, and tell stakeholders what will and won't land. I don't ask people to work weekends as the default plan. In the retrospective, we look at the cause, maybe stories need a spike first or we need to reserve capacity for support, so it doesn't repeat.

- Raise it early, not at sprint review
- Understand the cause before reacting
- Agree priorities with the product owner and cut scope
- Fix the cause in the retrospective

<sub>Also asked as: Your sprint is failing. How do you handle it? · What do you do when the team is clearly going to miss the sprint goal? · How do you recover a sprint that's going badly? · the sprint is off track, what steps do you take as lead</sub>

### A new developer joins your team mid-project. How do you onboard them?
*Mid (3–6 yrs) · scenario* · `lead-015`

I aim to get them shipping a small real change in their first week, with the right context around it. Before they start, I make sure access is ready: sandbox, repo, pipeline, ticket tool and any VPN. On day one, they get a short walkthrough of the business process, the data model diagram and our standards guide. Then I give them a 'starter story', something small and real, like adding a field with a validation rule and a test, and a buddy from the team to pair with. That way they go through the whole path: branch, build, PR, review, deploy. In the first couple of weeks, they join refinement and a code review or two, so they learn how we think. Say they're joining an FSL project. I'd have them shadow a service appointment flow end to end in a sandbox before touching the scheduling code. I also ask them what was confusing, and fix our docs from their feedback.

- Access ready before day one
- Context: business process, data model, standards
- Small real starter story plus a buddy
- Use their feedback to improve onboarding docs

<sub>Also asked as: How do you get a new team member productive quickly? · What does your onboarding plan for a Salesforce developer look like? · Someone new joins next week. What do you prepare? · how do you onboard new devs onto a salesforce project</sub>

### How do you make security reviews part of your team's delivery process?
*Senior (7–10 yrs) · design* · `lead-016`

I build security into each step, so it isn't a single review at the end. At design time, any new integration, external user access or sensitive data gets a quick security check: who can see this data, how we authenticate, and what we log. In code, our standards require sharing keywords on every class, user-mode queries or stripInaccessible for field security, and no dynamic SOQL from user input without binding. Code Analyzer runs in the pipeline and flags issues before review. In review, I look at permission sets and sharing changes as carefully as the code, because over-granting access is a common mistake. Say a developer builds an Experience Cloud page for customers to see invoices. I'd check that guest and customer users can only see their own records, test it while logged in as one, and confirm the Apex runs with sharing. Before major releases, we also run the Health Check and review who has admin-like permissions.

- Security check at design time for integrations and external access
- Standards for sharing, CRUD and FLS, enforced in CI
- Review permission and sharing changes as carefully as code
- Test as the real user, especially external users

<sub>Also asked as: As a lead, how do you make sure your team's code is secure? · How do you run security reviews for Apex, LWC and configuration? · Who checks security on your team and when? · how do you handle security in the development lifecycle</sub>

### How do you govern performance and large data volumes across a team, not just in your own code?
*Senior (7–10 yrs) · design* · `lead-017`

I set a few clear rules, test with realistic data, and watch the numbers after release. The rules: queries on big objects must use selective filters, no new automation on high-volume objects without a design review, bulk tests with 200 records as standard, and async processing for heavy work. I make sure we have a full or partial sandbox with production-like volumes, because something that works with fifty test records can time out with millions. Before go-live, we test the critical paths at volume. After go-live, I watch slow transactions, limit usage, and failed async jobs. Say the team adds a roll-up on Account and some accounts have hundreds of thousands of child records. That's a data skew and locking risk, so I'd ask for a scheduled or async approach instead of a real-time roll-up. I also keep an eye on data growth and push for an archiving plan before storage becomes an emergency.

- Clear rules: selective queries, design review for high-volume objects
- Test at realistic volume in a full sandbox
- Monitor slow transactions and limits after release
- Plan archiving before storage becomes a crisis

<sub>Also asked as: As a lead, how do you stop performance problems before they reach production? · Your org has millions of records. What rules do you give the team? · How do you handle LDV governance on a project? · how do you make sure the team writes scalable code for large data</sub>

### How do you lead a team split between onshore and offshore locations?
*Senior (7–10 yrs) · scenario* · `lead-018`

I treat it as one team with a clear handover, not 'us and them'. First, the overlap window: we agree a fixed daily overlap for stand-up, questions and handover, and protect it. Second, stories must be clear enough to build without a live conversation: acceptance criteria, sample data, and the edge cases written down. If a story isn't ready, it doesn't go offshore. Third, written handovers at the end of each day: what's done, what's blocked and what questions are open, so nobody loses a day waiting. Fourth, ownership: offshore developers own features end to end, including demos to the business, not just tickets. Say the onshore business analyst clarifies a pricing rule after the offshore team has logged off. They update the story and post a short note, so the developer starts the next morning with the answer. I also make sure people from both sides get credit and visibility in reviews and demos.

- Fixed daily overlap window
- Stories ready to build without a live conversation
- Written end-of-day handovers
- Offshore owns features end to end, with visibility

<sub>Also asked as: How do you work with offshore developers in a different time zone? · What makes onshore-offshore Salesforce delivery work well? · Half your team is in India and half in the US. How do you manage it? · how do you handle onsite offshore coordination</sub>

### What documentation do you insist on for a Salesforce project, and how do you keep it up to date?
*Mid (3–6 yrs) · scenario* · `lead-019`

I keep documentation small and close to the work, because big documents go stale the week after go-live. The must-haves are: a data model diagram for the main objects, an integration list showing what talks to what and how it authenticates, an automation inventory per object, architecture decision records, and a runbook for support covering common errors, scheduled jobs and who to call. Field and class descriptions go in Salesforce itself, so they're visible where people work. To keep it current, documentation is part of the definition of done: a story that adds an integration isn't done until the integration list is updated, and reviewers check it. Say a new developer has to fix a failing nightly sync. The runbook tells them which scheduled job runs it, where errors are logged and how to rerun it, which saves hours. I'd rather have five pages people trust than fifty nobody reads.

- Data model, integrations, automation inventory, ADRs, runbook
- Descriptions inside Salesforce where people work
- Docs updates are part of definition of done
- Short and trusted beats long and stale

<sub>Also asked as: How do you handle documentation as a lead? · Nobody on the team writes documentation. What do you do? · What should be documented in a Salesforce org? · how do you keep salesforce documentation current</sub>

### How do you make and record architecture decisions? Have you used ADRs?
*Senior (7–10 yrs) · design* · `lead-020`

I make decisions by comparing options against what the business needs, and I record each important one in a short architecture decision record. An ADR is a one-page note: the context, the options we considered, the decision, and the consequences, good and bad. It lives in the repo next to the code, so it's versioned and easy to find. My process: state the problem and the constraints, like volume, licences, skills and timeline; list two or three real options; compare them on cost, risk, maintainability and fit with our standards; and get input from the people affected before deciding. Say we need to sync orders from an ERP. Options might be a nightly batch, platform events, or middleware. If we pick middleware, the ADR records why, and that we accepted the extra licence cost. A year later, when someone asks 'why don't we just call the ERP directly?', the answer is already written down.

- ADR: context, options, decision, consequences
- Store ADRs in the repo with the code
- Compare two or three real options on cost, risk, fit
- Record accepted trade-offs, not just the winner

<sub>Also asked as: What is an architecture decision record and why use it? · How does your team decide between two technical approaches? · How do you make sure people later understand why a design was chosen? · what is ADR in software architecture</sub>

### Two senior developers on your team disagree strongly about a design. How do you resolve it?
*Senior (7–10 yrs) · scenario* · `lead-021`

I move the argument from opinions to criteria, and then I make a decision so the team isn't stuck. First I ask each of them to explain the other person's approach back, which often shows they agree on more than they think. Then we agree on what matters for this feature: performance, who will maintain it, time to deliver, and how well it fits our standards. Say one wants a record-triggered Flow and the other wants Apex for an order validation. If admins will maintain it and the logic is simple, Flow wins. If it needs complex bulk logic and callouts, Apex wins. If it's still close, I pick one, explain why, and record it, and sometimes the less-preferred option gets a short time-boxed spike. I make sure both feel heard, and I thank the person whose idea wasn't chosen publicly. Leaving it unresolved is worse than either option.

- Have each person restate the other's view
- Agree decision criteria for this feature
- Decide, explain and record it
- Respect both people; don't leave it hanging

<sub>Also asked as: How do you handle technical conflict within your team? · Your developers are arguing about Flow versus Apex for a feature. What do you do? · How do you settle a design debate without upsetting anyone? · two devs disagree on approach, how do you decide</sub>

### As a technical lead, how much do you still code, and how do you balance it with leading?
*Senior (7–10 yrs) · concept* · `lead-022`

I stay hands-on, but I pick work that doesn't block the team if I get pulled into meetings. My first job is making the team effective: reviews, unblocking people, design decisions, and working with the product owner. If I take the hardest critical-path story myself and then spend half the day in meetings, the whole sprint suffers. So I usually take things like proofs of concept, framework or pipeline improvements, spikes on risky unknowns, or pairing on a tough problem. Say we're about to start an integration with a payment provider. I might build the first callout and error handling pattern myself, then hand the full feature to a developer who follows that pattern. I protect a few hours of focus time each week for this. Staying close to the code keeps my reviews and estimates realistic, and the team respects a lead who still understands the details.

- Team effectiveness comes first
- Avoid owning critical-path stories
- Take spikes, patterns, frameworks, pairing
- Hands-on work keeps reviews and estimates realistic

<sub>Also asked as: Do tech leads still write code? · How do you split your time between hands-on work and team leadership? · What does a typical day look like for you as a lead? · how hands on are you as a lead</sub>

### A developer on your team is consistently underperforming. How do you handle it?
*Senior (7–10 yrs) · scenario* · `lead-023`

I deal with it early, privately and with specifics, and I look for the cause before judging. First I check my own side: are their stories clear, do they have the right access, are they being pulled into support work? Then I have a one-to-one with concrete examples, not 'your work is poor' but 'the last two stories came back from QA for missing bulk handling, and the estimate slipped twice without warning'. I ask what's going on, because sometimes it's personal or a skill gap they're embarrassed about. Together we agree a short plan: maybe pairing, smaller stories, a daily check-in for a few weeks, and clear expectations of what good looks like. Say the gap is testing. I'd pair them with our strongest tester and review their next test class together. If things don't improve after a fair chance, I involve their manager or HR with the documented facts. Most people improve when expectations are clear and support is real.

- Check whether the setup is the problem first
- Private, specific feedback with examples
- Agreed short improvement plan with support
- Escalate with documented facts only after a fair chance

<sub>Also asked as: One team member keeps missing deadlines and producing poor code. What do you do? · How do you deal with a low performer on your team? · How do you give tough feedback to a developer who isn't delivering? · team member not performing, how do you handle as lead</sub>

### What is your definition of done for a Salesforce user story?
*Mid (3–6 yrs) · concept* · `lead-024`

A story is done when it's working in a test environment, reviewed, tested and deployable without anyone needing to remember manual steps. My checklist is usually: acceptance criteria met and demoed to the product owner; code and config in source control and merged through a reviewed PR; Apex tests with real assertions, including a bulk case; no new static analysis violations; permissions handled through permission sets, not profiles; any manual deployment steps written down or, better, scripted; and documentation updated if it adds an integration or changes the data model. Say a developer adds a new field and a Flow for warranty expiry. If the field isn't in a permission set, users won't see it in UAT, so it isn't done. Having this agreed upfront helps under deadline pressure too, because the conversation becomes 'which story do we drop', not 'which quality step do we skip'.

- Acceptance criteria met and demoed
- Reviewed PR, tests with assertions, clean static analysis
- Permissions and deployment steps handled
- Under pressure, drop scope rather than quality

<sub>Also asked as: When do you consider a story actually done? · What checklist must a story pass before it's closed? · How do you keep quality up under deadline pressure? · definition of done for salesforce development</sub>

### Admins keep making changes directly in production and breaking your deployments. How do you fix that?
*Senior (7–10 yrs) · scenario* · `lead-025`

I fix it with a path that's easier than the shortcut, plus visibility, rather than just taking permissions away. First I'd understand why admins work in production. Usually the pipeline feels slow for small changes like a picklist value or a report. So I'd create a fast lane for low-risk config: admin works in a sandbox, a quick review, and it goes out in the next daily or weekly small release. Second, I'd agree which changes are allowed in production, like reports, dashboards and list views, and which never are, like fields, Flows and permission sets. Third, I'd add drift detection: compare production with the main branch regularly and flag differences. Say an admin adds a picklist value in production and the next deployment removes it. Drift detection catches it before the deploy, and we pull it back into source control. Only after the fast lane exists would I tighten the permissions on who can modify metadata in production.

- Understand why people bypass the process
- Create a fast lane for low-risk config
- Agree what may and may not change in production
- Detect drift, then tighten permissions

<sub>Also asked as: Production keeps drifting from source control because people edit it directly. What do you do? · How do you stop configuration changes being made straight in prod? · Your deployment overwrote an admin's change in production. How do you prevent it happening again? · how do you control changes made directly in production</sub>

## CPQ Leadership

### Walk me through how you would lead a Salesforce CPQ implementation from start to finish.
*Senior (7–10 yrs) · scenario* · `lead-026`

I run it in five phases, and the biggest risk is usually data and pricing logic, not configuration. Discovery: workshops with sales, pricing, finance and order management to understand products, pricing, discounting, approvals, contracts and renewals, and collect real quotes. Design: the product catalog and bundles, the pricing approach, approval matrix, quote templates, and how quotes flow to orders and billing, plus a list of what's standard and what's custom, with reasons. Build: config and code in parallel, with pricing tested against real quotes from the business every sprint. UAT: business users quote real deals and compare totals with the old process, line by line. Cutover: load products and price books, migrate active contracts and subscriptions so renewals work, train reps, and plan hypercare. Say a manufacturer sells machines with service plans. I'd use a set of their recent real quotes as the regression pack from design through go-live. Note Salesforce CPQ is end-of-sale for new customers, so new implementations would normally look at Revenue Cloud Advanced instead.

- Discovery, design, build, UAT, cutover
- Real historical quotes as the test pack throughout
- Contracts and subscriptions migration is the riskiest part
- CPQ is end-of-sale; new customers usually go to Revenue Cloud Advanced

<sub>Also asked as: How do you run a CPQ project end to end, from discovery to go-live? · What are the phases of a CPQ implementation and what happens in each? · As CPQ lead, how would you plan the implementation? · cpq implementation lifecycle discovery design build uat cutover</sub>

### How do you run CPQ discovery workshops, and what questions do you ask?
*Senior (7–10 yrs) · scenario* · `lead-027`

I run separate, focused sessions by area, and I always work from real examples rather than abstract rules. The people I need are sales reps, sales ops, pricing, finance, legal for terms, and whoever handles orders and billing. I ask for a handful of real recent quotes, including a messy one, and walk through how each was built. My questions cover: how products are structured and which combinations aren't allowed; how list prices are set and how often they change; what discounts exist and who can approve what; whether pricing depends on customer, region, volume or contract; how quotes become orders and invoices; and how amendments, renewals and co-terming work today. Say a software seller tells me 'we give partners 20 percent off'. I'd ask: off which products, stacking with volume discounts or not, and who overrides it. The exceptions are where the real requirements hide. I end each session by playing back what I heard, so the business confirms it.

- Separate sessions by area with the right people
- Work from real quotes, including messy ones
- Cover catalog, pricing, discounts, approvals, orders, renewals
- Dig into exceptions and play back what you heard

<sub>Also asked as: What do you cover in a CPQ requirements workshop? · How do you gather pricing and quoting requirements from the business? · Who should be in a CPQ discovery session? · cpq discovery questions to ask the client</sub>

### When would you use standard CPQ pricing, and when is a custom pricing object justified?
*Senior (7–10 yrs) · comparison* · `lead-028`

I start with standard CPQ, meaning price books, discount schedules, contracted prices and price rules with lookup tables, and go custom only when standard can't meet a clear requirement. Custom is justified when the pricing data is large and changes often, like a price matrix by region, customer tier and product attribute that a pricing team updates every week. Or when prices are mastered in an ERP and synced in, or when pricing needs its own effective dates and approval workflow. Say a manufacturer prices each part by plant, material grade and quantity band. A custom pricing object that the pricing team maintains, with price rules or the calculator plugin reading it, can be far easier to manage than hundreds of price rules. The trade-off is that you own more logic. To keep it healthy, I'd still write the result into standard quote line price fields so discounts, approvals and reporting work normally, document it well, and plan for it in any Revenue Cloud migration.

- Default to price books, discount schedules, price rules, lookup tables
- Custom when data is large, volatile, ERP-mastered or needs its own workflow
- Feed results into standard price fields so the rest still works
- Trade-off: more owned logic and migration effort

<sub>Also asked as: Why would a project store prices on a custom object instead of using CPQ price rules? · Standard CPQ pricing versus a custom pricing model: how do you decide? · Our project prices on a custom object. Was that a good design choice? · when is custom pricing justified in salesforce cpq</sub>

### An architect challenges your design because pricing is on a custom object instead of standard CPQ. How do you defend it?
*Senior (7–10 yrs) · scenario* · `lead-029`

I'd explain the requirement that drove it, show the options we compared, and be open about the risks and how we manage them. For example: 'Prices depend on several attributes and change weekly, the pricing team owns them, and they need to load and approve changes without a deployment. Price rules alone would have meant a very large number of rules and admin changes for every update. So we keep prices in a custom object the pricing team maintains, and CPQ reads it during calculation.' Then the risks. Performance: we query it efficiently and keep the calculation light. Transparency: the result lands in standard price fields, so the waterfall, discounts and approvals still behave as reps expect. Maintainability: it's documented and covered by tests with real quote examples. Future migration: it maps fairly cleanly to pricing data in Revenue Cloud Advanced. If the architect raises a fair point, like missing audit history on price changes, I'd agree and add it.

- Lead with the requirement and the options compared
- Name the risks: performance, transparency, maintenance, migration
- Show the mitigation for each
- Accept fair points and improve the design

<sub>Also asked as: How would you justify a custom pricing approach to a reviewer? · What are the risks of custom pricing in CPQ and how do you reduce them? · Someone says your custom pricing model is technical debt. How do you respond? · defend custom pricing object design in cpq interview</sub>

### How would you plan and lead a migration from Salesforce CPQ to Revenue Cloud Advanced?
*Senior (7–10 yrs) · design* · `lead-030`

I'd plan it as a re-implementation in phases, because Revenue Cloud Advanced, part of Agentforce Revenue Management, uses a different data model and engines. Phase one, assessment: inventory everything in CPQ, including bundles, product and price rules, calculator plugin code, templates, approvals, integrations and reports, and decide what to keep, simplify or drop. Many orgs carry years of rules nobody uses. Phase two, design: map catalog, attributes, selling models, pricing procedures and configuration rules, and decide how active contracts and subscriptions become assets. Phase three, a pilot: one product line or region on Revenue Cloud Advanced while the rest stays on CPQ, with clear rules about which system owns which deals. Phase four, roll out the rest, often moving existing customers at renewal rather than all at once. Say a software company has a simple self-serve product and a complex enterprise bundle. I'd pilot with the simple product to prove the pipeline, integrations and billing before tackling the hard one. CPQ is still supported, so there's no need to rush.

- Re-implementation, not an upgrade
- Assess and simplify before mapping
- Pilot one product line, define system ownership during coexistence
- Move existing customers at renewal where possible

<sub>Also asked as: What would your CPQ to Revenue Cloud migration roadmap look like? · How do you phase a move from CPQ to Revenue Cloud Advanced without disrupting sales? · Leadership wants to move off CPQ. How do you plan it? · cpq to rca migration plan as a lead</sub>

### How do you govern who can change price rules, product rules and discounts in a CPQ org?
*Senior (7–10 yrs) · design* · `lead-031`

I separate who decides pricing from who configures it, and I make every CPQ change go through a sandbox and a test before production. The pricing or deal desk team owns the business decision: list prices, discount levels, approval thresholds. A small group of trained CPQ admins makes the actual configuration changes. Nobody else gets edit rights on price rules, product rules, discount schedules or lookup data in production. For changes, there's a simple request form that says what's changing, why, and who approved it. The admin builds it in a sandbox, runs a set of regression quotes, and the business signs off before release. Say sales leadership wants partner discounts raised for a quarter. The deal desk approves it, the admin updates the discount schedule in a sandbox, tests a few partner and direct quotes to make sure nothing else moved, then deploys. I also turn on field history on key pricing objects, so we can always see who changed what.

- Business owns pricing decisions, trained admins configure
- Restrict edit rights on CPQ rule objects in production
- Request, sandbox build, regression quotes, sign-off
- Audit trail on pricing data

<sub>Also asked as: What CPQ governance would you put in place? · Sales ops keeps editing price rules in production. How do you control it? · Who should own pricing changes in CPQ? · cpq change control and governance</sub>

### CPQ configuration is stored as data, not metadata. How do you move it safely between sandboxes and production?
*Senior (7–10 yrs) · scenario* · `lead-032`

I treat CPQ configuration like code, even though it's records: built in a sandbox, versioned, deployed with a repeatable tool, and tested after deploy. Price rules, conditions, actions, product rules, options, discount schedules and lookup tables are all records, so change sets and normal metadata deploys don't move them. The key is stable external Id fields on every CPQ object, so records match across orgs instead of relying on Salesforce Ids that differ per org. Then I use a data deployment tool, either a dedicated CPQ-aware DevOps tool or a scripted data load, that moves parent and child records in the right order. Say a new bundle needs a feature, three options and a price rule with two conditions. All those records go together in one release package, keyed by external Id. After deploying, we run a short set of regression quotes in production or staging to confirm totals match the sandbox. I also keep exports of the configuration in source control, so we can see differences and roll back.

- CPQ config is records, so metadata deploys don't move it
- External Ids on every CPQ object to match across orgs
- Data deployment tool that respects parent-child order
- Regression quotes after deploy, exports kept for rollback

<sub>Also asked as: How do you deploy CPQ price rules and product rules between orgs? · Change sets don't move CPQ records. What's your release approach? · How do you do change control for CPQ data? · cpq data deployment between environments</sub>

### How would you split work on a CPQ team between configuration specialists and developers?
*Senior (7–10 yrs) · design* · `lead-033`

Configuration specialists own the catalog and rules, developers own anything CPQ can't do declaratively, and both share one test pack. The config side covers products, bundles, features, options, product rules, price rules, discount schedules, quote templates and Advanced Approvals. The developer side covers the calculator plugin when pricing needs logic rules can't express, integrations to ERP or billing, custom Lightning components around the quote, and triggers that must work alongside CPQ's own automation. I keep a simple rule: try config first, and if a developer is needed, the reason is written in the story. Say a rep needs a price that depends on the customer's past year of purchases from the ERP. A config person sets up the price rule structure, and a developer builds the integration that brings the history in. Both test against the same set of real quotes. I also make sure developers understand CPQ's calculation sequence, because code that fights it causes the hardest bugs.

- Config: catalog, rules, discounts, templates, approvals
- Code: calculator plugin, integrations, custom UI, triggers
- Config first, written reason for code
- Shared real-quote test pack; developers must know the calc sequence

<sub>Also asked as: On a CPQ project, what should be config and what should be code? · How do you structure a CPQ delivery team? · When do you bring a developer into CPQ work? · cpq team roles config vs code</sub>

### How do you plan UAT and cutover for a CPQ go-live?
*Senior (7–10 yrs) · scenario* · `lead-034`

For UAT, I have the business quote real deals and compare the results line by line with how they were priced before. I ask sales ops and the deal desk for a set of recent quotes covering the common cases and the tricky ones: big bundles, partner discounts, multi-year deals and amendments. Testers rebuild them in CPQ, and any difference is either a bug or a conscious change the business agrees to. For cutover, I write a step-by-step runbook with owners and timings: freeze quoting in the old process, load products and price books, load CPQ configuration by external Id, migrate open quotes if needed, and migrate active contracts and subscriptions so future amendments and renewals work. Then smoke test with real users, switch on access, and run hypercare with daily check-ins. Say a renewal is due a week after go-live. I'd test that exact renewal in a staging org with migrated data before cutover, because renewals are where migrated subscriptions usually go wrong.

- UAT by rebuilding real past quotes and comparing totals
- Cover tricky cases: bundles, partners, multi-year, amendments
- Runbook with owners and timings, quoting freeze
- Test renewals on migrated subscriptions before go-live

<sub>Also asked as: What does your CPQ cutover plan look like? · How do you make sure pricing is right before CPQ goes live? · What has to be migrated on CPQ go-live weekend? · cpq uat and go live checklist</sub>

### Sales keeps asking for new pricing exceptions and special discounts. How do you keep CPQ from becoming unmanageable?
*Senior (7–10 yrs) · scenario* · `lead-035`

I separate one-off deal exceptions from real pricing policy, and only policy becomes configuration. A one-off exception should be a manual discount on the quote, inside an approval process, not a new price rule. If the same kind of exception keeps coming up, that's a signal to create a proper policy with the deal desk, like a defined partner tier or a volume band, and configure it once. Say three reps in a month ask for a special price for education customers. Instead of three rules, we agree an education discount policy and build one rule or discount schedule. I also review the rule set regularly: rules that haven't fired in months, rules that overlap, rules with hard-coded dates that have passed. Each rule should have an owner and a description of why it exists. Fewer, clearer rules also make quotes calculate faster and make a future move to Revenue Cloud Advanced much easier.

- One-off exceptions go through approvals, not new rules
- Repeated exceptions become a defined policy
- Regular review of unused, overlapping or expired rules
- Every rule has an owner and a reason

<sub>Also asked as: Every big deal needs a special pricing rule. How do you handle it? · How do you stop CPQ rules from growing out of control? · The number of price rules keeps increasing. What would you do as CPQ lead? · how to manage too many cpq pricing exceptions</sub>

## Agentforce Leadership

### How do you pick the first Agentforce use cases for a company?
*Senior (7–10 yrs) · scenario* · `lead-036`

I pick a first use case that's high volume, low risk, has clean data and a clear way to measure success. I'd start by collecting a broad list from service, sales and internal teams, then score each idea on volume, value, data readiness, risk if the agent gets it wrong, and how easy it is to hand off to a human. Say a laptop seller lists order status, return requests, warranty claims and pricing negotiations. Order status is a good first pick: it's asked constantly, the data is in Salesforce or an order system, and a wrong answer is easy to correct. Pricing negotiation is a poor first pick: high risk and hard to measure. I'd also make sure there's a business owner who cares about the result and a baseline we can measure against before launch. A small, clear win builds trust and funding for the harder use cases later.

- Score ideas on volume, value, data readiness and risk
- Start high volume, low risk, measurable
- Need a business owner and a baseline
- A clear early win funds harder use cases

<sub>Also asked as: Where should a company start with Agentforce? · How do you prioritise which agent to build first? · The business has a long wish list of AI ideas. How do you choose? · how do you select the first agentforce use case</sub>

### Leadership is sceptical about Agentforce. How would you build the business case and prove it with a pilot?
*Senior (7–10 yrs) · scenario* · `lead-037`

I keep the business case honest and small, and design the pilot so the result is hard to argue with. First, a baseline before launch: how many contacts of this type we get, how long humans take, what they cost, and current customer satisfaction. Second, a narrow pilot: one use case, one channel, maybe a share of traffic, with the rest handled as usual so we can compare. Third, success criteria agreed with leadership upfront, like resolution rate, escalation quality, satisfaction and cost per conversation including Flex Credits. Say a clinic pilots appointment rescheduling on its website chat. After a few weeks, we compare agent-handled conversations with human-handled ones on the same measures, and also count failures, like wrong slots or repeat contacts. I present cost, value and risks together, including what went wrong and what we fixed. Leaders trust a pilot that reports problems more than one that only shows good news.

- Measure a baseline before launch
- Narrow pilot with a comparison group
- Success criteria agreed upfront, including cost
- Report failures as well as wins

<sub>Also asked as: How do you prove ROI on the first agent before scaling? · The CFO wants proof the agent is worth it. What would you do? · How would you design an Agentforce pilot so the results are convincing? · how do you get executive buy in for agentforce</sub>

### How would you build an Agentforce roadmap for the next year?
*Senior (7–10 yrs) · design* · `lead-038`

I build it in waves, where each wave adds a bit more risk or autonomy only after the previous one is proven. Wave one is usually information and simple actions: answering FAQs from knowledge, order or case status, with handoff to humans. Wave two adds actions that change data but are reversible and well-controlled, like rescheduling an appointment or creating a return request. Wave three is higher-value work, like employee agents for sales or service reps, or background agents that triage cases with no chat. Alongside the use cases, the roadmap includes the foundations: knowledge clean-up, data access, often through Data 360 for grounding, testing, monitoring and the governance process. Say a utility company starts with outage status questions. Next would be meter-reading submissions, then billing disputes once confidence is high. I'd review the roadmap every quarter, because the platform changes fast and real usage often shows a better next use case than the original plan.

- Waves: information, reversible actions, higher-value or autonomous
- Each wave proven before the next
- Foundations: knowledge, data, testing, monitoring, governance
- Review quarterly based on real usage

<sub>Also asked as: What would an agent roadmap look like after the first pilot? · How do you plan which agents to build after the first one? · How do you sequence Agentforce use cases over time? · agentforce adoption roadmap for a company</sub>

### How would you set up governance or a Center of Excellence for AI agents?
*Senior (7–10 yrs) · design* · `lead-039`

I'd extend the existing Salesforce governance rather than create a separate empire, and add the parts that are specific to AI. The group usually includes a business sponsor, the platform owner, an Agentforce lead or architect, security and compliance, and representatives of the teams using agents. It owns a few things: an intake and scoring process for new use cases, standards for instructions, action descriptions and guardrails, rules on what data agents can access, a required testing and approval step before anything goes live, and monitoring after launch. Changes to instructions count as real changes, so they go through a sandbox, tests and sign-off, not quick edits in production. Say the HR team wants an employee agent for leave policy questions. They'd submit it through intake, the CoE checks data access and risk, and the build follows the shared testing standard. The CoE also shares reusable actions and lessons, so the second agent is faster than the first.

- Extend existing governance, add AI-specific parts
- Intake and scoring for new use cases
- Standards for instructions, actions, guardrails and data access
- Instruction changes go through testing and sign-off

<sub>Also asked as: Who should approve a new agent or a change to an agent? · What does an Agentforce CoE look like? · How do you stop every team building its own agents with no control? · agentforce governance framework</sub>

### Service reps are worried the agent will replace them and aren't using it. How do you drive adoption?
*Senior (7–10 yrs) · scenario* · `lead-040`

I involve the reps in shaping the agent and show them how it makes their day better, rather than announcing it at them. First, be honest with leadership's support about the purpose, for example taking repetitive questions so reps handle the complex and interesting cases. Second, bring a few respected reps into the build as champions: they review answers, suggest instructions and test edge cases. People trust what their colleagues helped build. Third, focus on the handoff experience, because that's where reps feel the agent most. If the agent passes a clean summary and the customer's details, reps see the benefit immediately. Say a support centre launches an agent for order questions. Champions demo it in team meetings, reps get a simple way to flag bad answers, and we show them the fixes we made from their feedback. I'd track adoption and feedback, not just usage, and keep training short and practical.

- Be honest about the purpose with leadership backing
- Rep champions involved in building and testing
- Make the handoff to humans clearly better
- Easy feedback loop, visibly acted on

<sub>Also asked as: How do you handle change management for an Agentforce rollout? · Users don't trust the AI agent. What would you do? · How do you get employees to actually use an employee agent? · agentforce user adoption and change management</sub>

### Legal and compliance must sign off before your agent goes live. How do you get there?
*Senior (7–10 yrs) · scenario* · `lead-041`

I bring legal and compliance in at design time, not at the end, and give them evidence instead of promises. Early on, I'd agree with them what the agent may and may not do, what data it can see, how customers are told they're talking to an AI, and when it must hand off to a human. Then I'd document the controls: the agent user's limited permissions, identity checks before sharing personal data, deterministic rules for sensitive actions, Einstein Trust Layer features like data masking, and audit logging of conversations. For evidence, I'd share test results, including attempts to make it misbehave, like prompt injection or asking for another customer's data. Say a bank's agent handles card freeze requests. Compliance would want proof that the agent always verifies identity first and never reverses fees without the rules being met. I'd also agree a plan for incidents and a way to switch the agent or a single action off quickly.

- Involve legal and compliance at design time
- Agree scope, data access, disclosure and handoff rules
- Show controls and test evidence, including adversarial tests
- Incident plan and kill switch

<sub>Also asked as: How do you handle risk and compliance approval for an AI agent? · What does compliance need to see before launching a customer-facing agent? · The risk team is blocking the agent launch. What do you do? · agentforce compliance sign off process</sub>

### How do you measure whether an agent is successful after launch and report it to leadership?
*Senior (7–10 yrs) · design* · `lead-042`

I use a balanced scorecard, because one number like deflection on its own can look great while customers are unhappy. I group it into four areas. Outcomes: resolution or containment rate, meaning conversations finished without a human, and whether the customer came back with the same issue soon after. Quality: answer accuracy from regular reviews of sampled conversations, escalation reasons, and satisfaction scores for agent conversations. Cost: credits consumed per conversation compared with the cost of human handling. Operations: latency, action error rates and test results after each change. Say a retailer's agent shows high containment, but repeat contacts for returns are rising. That tells me the agent is closing conversations without really solving them, so we look at those transcripts. For leadership, I report a short monthly view: trend against the baseline, what we changed, problems found, and the next improvement. I don't quote big savings until the data supports them.

- Balanced scorecard, not a single metric
- Outcomes, quality, cost and operations
- Watch repeat contacts to catch false containment
- Monthly trend versus baseline, with problems included

<sub>Also asked as: Which KPIs would you track for an Agentforce service agent? · How do you know the agent is actually helping customers? · What would you put on an agent performance scorecard? · measuring agentforce success containment deflection csat</sub>

### Your team are experienced Salesforce developers but new to Agentforce. How do you build their skills?
*Senior (7–10 yrs) · scenario* · `lead-043`

I build skills by doing a small real project together, backed by a few focused learning steps, rather than only sending people to courses. First, the basics everyone needs: how the reasoning engine picks subagents and actions, why action descriptions and instructions matter so much, grounding, and the Trust Layer. Trailhead and an internal session cover that. Second, a hands-on internal build, for example an employee agent that answers questions from our own project documentation, where everyone writes at least one action and one test. Third, roles: developers build Apex and Flow actions and tests, admins or business analysts own instructions and knowledge, someone owns testing and monitoring, and an architect owns data access and security. Say a developer is used to deterministic code. The biggest shift is accepting that the same input can give slightly different outputs, so we test with many variations and review transcripts. I'd also run short sessions to share what worked and what didn't after each sprint.

- Learn by building a small real agent together
- Core concepts: reasoning, descriptions, grounding, trust
- Clear roles across developers, admins, testers, architect
- Mindset shift to testing non-deterministic behaviour

<sub>Also asked as: How would you upskill a Salesforce team for Agentforce projects? · What skills does an Agentforce delivery team need? · How do you structure an Agentforce team and train it? · building agentforce skills in a dev team</sub>

### When would you advise a client NOT to use an AI agent?
*Senior (7–10 yrs) · scenario* · `lead-044`

I'd advise against an agent when the process is fixed and predictable, when a mistake is very costly, or when the data isn't ready. If every case follows the same steps, a Flow, a screen form or a simple automation is cheaper, faster and fully predictable. Say a company wants an agent so employees can submit expense claims. If the claim is always the same fields and rules, a well-designed form does it better than a conversation. I'd also push back where wrong answers carry serious legal, financial or safety risk with no human check, like giving medical advice or approving large credit decisions. And if the knowledge base is outdated or the data is spread across systems with no access, the agent will give confident wrong answers, so we fix the data first. Low-volume processes may not justify the build and credit costs either. Saying no to the wrong use case protects trust in the right ones.

- Fixed, predictable processes suit Flow or forms
- High-risk decisions need human control
- Poor or inaccessible data must be fixed first
- Low volume may not justify cost

<sub>Also asked as: Is Agentforce always the right answer? · When is a Flow or a simple form better than an agent? · A client wants an agent for everything. When would you push back? · when should you not use agentforce</sub>

### A business leader wants the agent live for all customers next week, but testing shows it isn't ready. What do you do?
*Senior (7–10 yrs) · scenario* · `lead-045`

I'd show the evidence, offer a safer launch option that still gives them a date, and let them make an informed decision. First I'd share the test results in plain terms: which kinds of questions it handles well and where it fails. For example, 'it answers order status correctly almost every time, but it confuses return and warranty rules.' Then I'd suggest a staged launch: go live next week with only the parts that pass, like order status, and route returns and warranty to humans for now. Or launch to a limited audience, like logged-in customers or one region, with close monitoring and the kill switch ready. Meanwhile, we fix the failing area and add those cases to the test set. Say the leader has announced the launch publicly. A narrower launch on that date still lets them keep the promise without risking a bad customer experience. If they still want everything live, I document the risk and who accepted it.

- Share test results in plain language
- Launch only what passes, route the rest to humans
- Limited audience with monitoring and kill switch
- Document the risk if overruled

<sub>Also asked as: How do you handle pressure to launch an agent too early? · The agent still gives wrong answers sometimes but the business wants to go live. What would you say? · How do you negotiate a safer Agentforce launch? · agent not ready but business wants to launch</sub>

### How do you manage changes to an agent's instructions and actions once it's in production?
*Senior (7–10 yrs) · design* · `lead-046`

I treat any change to instructions, subagent descriptions or actions as a real release, because a small wording change can shift how the agent behaves across many conversations. The process: the change is made in a sandbox, tracked in source control, and run against our regression test set in Testing Center before it goes anywhere. The test set includes normal questions, edge cases and attempts to misuse the agent, and it grows every time we find a problem in production. A business owner reviews results and signs off, then it's deployed and activated through the pipeline, with the previous version ready to reactivate if needed. Say marketing wants the agent to mention a new promotion. That sounds harmless, but it might make the agent push the promotion in unrelated conversations. The tests would catch that before customers see it. After release, we watch the key measures closely for a few days. Small, frequent, tested changes are safer than big rewrites.

- Instruction changes are releases, not quick edits
- Sandbox, source control, regression tests before deploy
- Test set grows from production issues
- Business sign-off, monitored rollout, quick rollback

<sub>Also asked as: What change control do you need for a live AI agent? · Someone wants to tweak the agent's prompt in production. What's your process? · How do you release agent changes safely as a lead? · agentforce release governance after go live</sub>

## Behavioural (Lead)

### Tell me about a time you disagreed with an architect.
*Senior (7–10 yrs) · scenario* · `lead-047`

I'd answer in four parts: the disagreement, how I raised it, how it was decided, and what I learned. The interviewer wants to see that I disagree with evidence, respect the decision process, and don't hold grudges. A story with this shape works: the architect proposed a synchronous callout from a trigger to an external system, and I was worried about timeouts and record locks under load. Rather than arguing in a meeting, I asked for a short session, explained the risk, and brought evidence, like a quick proof of concept showing the failure under bulk updates, plus an alternative using a queueable with retry. Then the ending: either they agreed and we changed it, or they kept their design for a good reason I hadn't known, and I committed fully. I close with the lesson, for example that bringing an alternative and data turns a disagreement into a joint decision. I'd fit my own real example into this shape.

- Structure: disagreement, how raised, decision, lesson
- Raise it privately with evidence and an alternative
- Respect the decision and commit either way
- Use your own real story in this shape

<sub>Also asked as: Describe a situation where you challenged a senior person's technical decision · Have you ever disagreed with your solution architect? What happened? · Tell me about a technical disagreement with someone more senior · time you disagreed with architect behavioural question</sub>

### Tell me about a time you missed a deadline.
*Senior (7–10 yrs) · scenario* · `lead-048`

I'd own it, show that I raised it early, explain what I did to limit the impact, and what I changed afterwards. The structure: what the deadline was and why it mattered, when and why I realised it would slip, how I told stakeholders and what options I gave them, and the lesson. A story with this shape works well: an integration with an external system turned out to need an authentication method nobody had flagged, and getting access from the other team took longer than planned. As soon as I knew, I told the product owner, explained the cause, and offered options: release the rest of the feature on time with the integration behind a switch, or move the whole date. We agreed a new date, and I kept them updated until it landed. The lesson I'd give is something concrete, like now confirming integration access and credentials during refinement, before committing to a date. I'd use my own real example here.

- Own it, no blaming
- Show you flagged it early with options
- Explain how you limited impact
- End with a concrete process change

<sub>Also asked as: Describe a time your team didn't deliver on time. What did you do? · Have you ever missed a project deadline? · Tell me about a delivery that slipped and how you handled it · missed deadline interview question for lead</sub>

### What was your biggest technical mistake, and what did you learn?
*Senior (7–10 yrs) · scenario* · `lead-049`

I'd pick a real mistake with real impact, but one I caught, fixed and learned from, and I'd spend most of the time on the fix and the lesson. The structure: what I did, what went wrong, how I found out, what I did immediately, and what I changed so it can't happen again. A story with this shape works: I deployed a change that included a validation rule which blocked an integration user from updating records, so overnight syncs started failing. I spotted it from error logs in the morning, told the stakeholders, deactivated the rule to restore the sync, then fixed it properly by excluding the integration user with a custom permission. The lesson: we added integration user scenarios to our test checklist and started reviewing failed sync logs after every release. Interviewers want to hear ownership and a system fix, not a tiny mistake dressed up. I'd use my own real example in this structure.

- Pick a real mistake with real impact
- Own it clearly, no blaming others
- Focus on the immediate fix and the lasting change
- Use your own true story in this shape

<sub>Also asked as: Tell me about a time you broke something in production · Describe a technical decision you got wrong · What's a mistake you made as a developer or lead? · biggest mistake in your career interview question</sub>

### Tell me about a time you influenced a decision without having authority.
*Senior (7–10 yrs) · scenario* · `lead-050`

I'd show that I understood what the other side cared about, and used evidence and a low-risk first step to win them over. The structure: the decision, why I couldn't just decide it, what the other side cared about, how I made the case, and the result. A story with this shape works: another team owned an integration that sent duplicate records into our org, and they didn't see it as their problem. I collected a few real examples showing the duplicates and how much clean-up time our users spent, then framed it in terms they cared about, such as failed loads in their own logs. I proposed a small change on their side, like sending an external Id so we could upsert, and offered to help test it. Once they saw it was small and helped them too, they agreed. The lesson is that people move faster when the change is small and clearly helps them. I'd plug in my own real example.

- Understand what the other side cares about
- Bring real examples and evidence
- Propose a small, low-risk first step
- Show how it helps them too

<sub>Also asked as: How have you convinced people who don't report to you? · Describe a time you got another team to change their approach · Give an example of leading without a formal title · influence without authority example</sub>

### Tell me about a time you had to deliver bad news to a stakeholder.
*Senior (7–10 yrs) · scenario* · `lead-051`

I'd show that I delivered it early, directly and with a plan, not buried in a status report. The structure: what the bad news was, how quickly I raised it, how I framed it, the options I offered, and how the relationship held up. A story with this shape works: during testing we found that a requested feature, like real-time sync with an external system, couldn't meet the response time they expected without a bigger middleware change. I set up a short call instead of sending an email, stated the problem in the first minute, explained why in plain language, and gave two or three options with cost and timing, for example near-real-time sync now and true real-time in a later phase. I told them what I recommended and why. Ending: they picked an option, and they trusted my updates more afterwards because I'd been straight with them. The lesson is that surprises damage trust far more than bad news itself. I'd use my own real story here.

- Raise it early, in a conversation not a buried email
- State the news in the first minute
- Give options with cost and timing, plus a recommendation
- Surprises hurt trust more than bad news

<sub>Also asked as: How do you tell a client their project is going to be late or over budget? · Describe a difficult conversation with a business stakeholder · Have you ever had to tell a manager something they didn't want to hear? · giving bad news to stakeholders example</sub>

### Tell me about a time you gave difficult feedback to a team member.
*Senior (7–10 yrs) · scenario* · `lead-052`

I'd show that I gave it privately, specifically and soon, and that I helped the person improve afterwards. The structure: the situation, why it needed addressing, how I prepared, what I actually said, how they reacted, and what changed. A story with this shape works: a capable developer kept merging changes without waiting for review, which caused a couple of broken builds and frustrated others. I asked for a one-to-one, described the specific instances and their effect on the team, without labels like 'careless', and then asked for their side. It turned out they felt reviews were too slow and were blocking them. We agreed they'd follow the review process, and I'd fix the slow-review problem by setting a same-day review expectation. Ending: the behaviour stopped, and the team's review speed improved for everyone. The lesson is that difficult feedback often uncovers a process problem too. I'd fit my own real example into this shape.

- Private, specific and soon
- Describe behaviour and impact, not personality
- Ask for their side; there may be a real cause
- Agree actions on both sides

<sub>Also asked as: Describe how you handled a hard conversation with someone on your team · Have you had to tell a colleague their work wasn't good enough? · Give an example of giving constructive feedback as a lead · difficult feedback example behavioural</sub>

### Tell me about a time you turned around a struggling project or team.
*Senior (7–10 yrs) · scenario* · `lead-053`

I'd show a clear sequence: understand, stabilise, then improve, with steps rather than heroics. The structure: what state the project was in, what I found when I dug in, the first few changes I made, how I brought stakeholders along, and the outcome. A story with this shape works: a project was missing sprint goals, UAT kept failing and the business had lost confidence. I spent the first days talking to the team and the product owner, and found the main causes, for example vague stories, no shared test data and frequent environment conflicts. I made a few focused changes: a definition of ready so stories were clear before the sprint, a basic pipeline so environments stayed in sync, and a reset of the plan with the business, with a smaller, realistic scope. I sent short weekly updates so trust came back. Ending: delivery became predictable. The lesson is that struggling projects usually need fewer, clearer priorities, not more effort. I'd use my own real story here.

- Understand, stabilise, improve
- Find root causes by talking to the team
- A few focused process changes and a re-planned scope
- Rebuild trust with regular honest updates

<sub>Also asked as: Have you ever taken over a project that was failing? · Describe a time you rescued a project that was off track · What did you do when you joined a team that was behind schedule? · turning around a failing salesforce project example</sub>

### Tell me about a time you had to make a technical decision with incomplete information.
*Senior (7–10 yrs) · scenario* · `lead-054`

I'd show that I separated what I knew from what I didn't, made the decision reversible where I could, and set a point to review it. The structure: the decision and why it couldn't wait, what was unknown, how I reduced the risk, what I chose, and how it turned out. A story with this shape works: we had to choose how to integrate with a partner system before their API documentation was final. Waiting would have blocked the sprint. I picked an approach that kept our side flexible, like putting the callout behind an interface with a mock implementation, so we could build and test our logic now and plug in the real API later. I told the team and stakeholders what assumptions we were making and agreed when we'd revisit them. Ending: when the final API arrived, only the adapter needed changing. The lesson is that a reversible decision made on time usually beats a perfect decision made too late. I'd use my own real example.

- Separate known from unknown
- Prefer reversible decisions; isolate the risky part
- State assumptions and set a review point
- On time and reversible beats perfect and late

<sub>Also asked as: Describe a decision you made under uncertainty · How do you decide when you don't have all the facts? · Give an example of a call you made without enough time to research it fully · making decisions with incomplete information example</sub>

### Why do you think you're ready for a lead role?
*Mid (3–6 yrs) · scenario* · `lead-055`

I'd answer with the lead behaviours I'm already doing, backed by short real examples, rather than claiming a title. The structure: say what I believe a lead does, give two or three examples of me doing those things, and say what I'm still growing in. For a Salesforce technical lead, I'd say the job is making the team effective: good technical decisions, reviews that teach, clear communication with the business, and protecting quality under pressure. Then the examples, from my own work, for instance reviewing others' code and setting up patterns the team reused, mentoring or training newer developers, leading a technical discussion with business stakeholders, or handling a production issue calmly. Say I'm the person colleagues already come to when a deployment fails. That's leadership without the title. I'd finish honestly with one area I'm developing, like running architecture reviews across several teams, and how I'm working on it. Self-awareness is part of being ready.

- Define what a lead does
- Two or three real examples of already doing it
- Name one honest growth area and how you're working on it
- Show leadership without the title

<sub>Also asked as: What makes you a good fit for a technical lead position? · You've been a developer. Why move into a lead role now? · What leadership experience do you have? · why should we hire you as a salesforce lead</sub>
