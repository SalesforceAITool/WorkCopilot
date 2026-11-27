# Admin, Security and Flow

90 questions. Levels: Fresher (0–2 yrs) 34 · Mid (3–6 yrs) 33 · Senior (7–10 yrs) 23

## Platform and Admin

### What is the difference between standard objects and custom objects?
*Fresher (0–2 yrs) · comparison* · `adm-001`

Standard objects come with Salesforce out of the box, like Account, Contact, Lead, Opportunity and Case. They already carry built-in behaviour, such as lead conversion or the opportunity sales path. Custom objects are the ones we create for data that's specific to the business, and their API names end with __c, like Project__c. Say a company does site inspections. There's no standard object for that, so I'd create Inspection__c. But if they just want to track their customers, I wouldn't build a Customer__c, I'd use Account. What I always do is check first whether a standard object fits, because it gives you standard features, reports and integrations for free. I only create a custom object when the data really is different, like inspections or enrollments.

- Standard: provided by Salesforce, built-in features and processes
- Custom: created by admins, API name ends in __c
- Both support custom fields, relationships, page layouts and automation
- Prefer standard objects when they fit the requirement

<sub>Also asked as: Standard object vs custom object in Salesforce · How do you identify a custom object by its API name? · what are standard and custom objects · When would you create a custom object instead of using a standard one?</sub>

### What is the difference between a lookup relationship and a master-detail relationship?
*Fresher (0–2 yrs) · comparison* · `adm-002`

Master-detail is tightly coupled, lookup is loosely coupled. In master-detail the parent field is required, the child has no owner of its own, and its sharing and security come from the parent. Delete the parent and the children are deleted too. You also get roll-up summary fields on the parent. A lookup is optional by default, the child keeps its own owner and sharing, and deleting the parent just clears the field, or you can block the delete. Take an invoice and its invoice lines. A line makes no sense without its invoice, so I'd use master-detail, and I could roll up the total amount onto the invoice. But a contact's 'referred by' partner would be a lookup, because the contact should survive if that partner is removed. That's my rule: master-detail when the child can't exist without the parent.

- Master-detail: required, cascade delete, sharing inherited, roll-up summary
- Lookup: optional, independent owner and sharing, no native roll-up
- An object can have at most two master-detail relationships
- Standard objects cannot be on the detail side of a master-detail

<sub>Also asked as: Lookup vs master-detail, explain · When would you use master detail instead of lookup? · what happens to child records when the parent is deleted in master detail · Difference between loosely coupled and tightly coupled relationships in Salesforce</sub>

### How do you create a many-to-many relationship in Salesforce?
*Fresher (0–2 yrs) · concept* · `adm-003`

You create a many-to-many relationship with a junction object, which is a custom object that has two master-detail relationships, one to each of the objects you want to connect. For example, Student and Course are linked through an Enrollment object: each Enrollment record points to one student and one course, so a student can have many courses and a course can have many students. The first master-detail field you create becomes the primary master, which controls the junction record's look and feel and some ownership behaviour. You can also build roll-up summaries on both parents from the junction.

- Junction object = custom object with two master-detail fields
- First master-detail created is the primary relationship
- Roll-up summaries possible on both masters
- Lookups can be used instead when you need independent ownership

<sub>Also asked as: What is a junction object? · How do you link students and courses where each can have many of the other? · Explain junction object with an example · many to many relationship salesforce how</sub>

### What are hierarchical, external lookup and indirect lookup relationships?
*Mid (3–6 yrs) · concept* · `adm-004`

These are three special relationship types. A hierarchical relationship exists only on the User object and links one user to another. The usual example is the Manager field, which approval processes use to find the approver chain. External lookup and indirect lookup are for external objects from Salesforce Connect. An external lookup links a child record, standard, custom or external, to a parent that is an external object, and it matches on the external object's External ID. An indirect lookup goes the other way. It links a child external object to a standard or custom parent in Salesforce, matching on a custom field on the parent that's marked unique and External ID. For example, say orders live in an ERP and show up as an external object. To hang those orders off Account, I'd put a unique External ID field like ERP_Customer_No on Account and use an indirect lookup.

- Hierarchical: User object only, e.g. Manager
- External lookup: parent is an external object, matched on External ID
- Indirect lookup: external child, Salesforce parent, matched on a unique External ID field
- Both external types come with Salesforce Connect

<sub>Also asked as: Explain hierarchical relationship in Salesforce · What is an external lookup relationship? · Difference between external lookup and indirect lookup · special relationship types in salesforce</sub>

### What is a roll-up summary field and what are its limitations?
*Fresher (0–2 yrs) · concept* · `adm-005`

A roll-up summary field sits on the parent and calculates a value from the related child records. It supports COUNT, SUM, MIN and MAX, and you can add filter criteria. For example, on Account I could sum only the Closed Won opportunity amounts to show total won business, and it recalculates by itself whenever an opportunity changes. The big limitation is where you can use it. It only works on the master side of a master-detail relationship, plus a few standard relationships like Account to Opportunity and Opportunity to Opportunity Product. You can't build it over a normal lookup. There's also a per-object limit on how many you can create, and some field types, like certain formula fields, can't be summarised. So if someone asks me for a roll-up over a lookup, I already know it needs a different approach.

- Functions: COUNT, SUM, MIN, MAX with optional filters
- Only on master-detail and a few standard relationships
- Not available on lookup relationships
- Recalculates automatically when children change

<sub>Also asked as: Explain roll-up summary fields · Can you create a roll-up summary on a lookup relationship? · What functions does roll up summary support · roll up summary field limitations</sub>

### The business needs a roll-up summary on a lookup relationship. How would you handle it?
*Senior (7–10 yrs) · scenario* · `adm-006`

First I'd check if the relationship can just be converted to master-detail, because then I get a native roll-up that I don't have to maintain. If the child needs its own owner or sharing, I keep the lookup and pick between a record-triggered flow, an Apex trigger, or a scheduled recalculation. For simple counts or sums at moderate volume, an after-save flow on the child that recalculates the parent with an aggregate is enough. For high volume or complex logic, I write a bulkified trigger that handles insert, update, delete and undelete. Reparenting is the case people forget. Say a ticket moves from Project A to Project B. Both projects need recalculating, the old one and the new one. I also watch for row-lock contention when lots of children update the same parent at once.

- Prefer converting to master-detail if ownership allows
- Flow for simple, low-volume roll-ups
- Apex trigger for scale: cover insert, update, delete, undelete and reparenting
- Watch for parent record locking and data skew

<sub>Also asked as: How do you do roll up on lookup relationship? · Roll-up summary is not available because the relationship is lookup, what are your options? · count child records on parent with lookup relationship · Alternatives to roll-up summary fields for lookups</sub>

### What is a formula field and what are its limitations?
*Fresher (0–2 yrs) · concept* · `adm-007`

A formula field is a read-only field that's calculated from other fields, functions and expressions every time the record is viewed or queried. It isn't physically stored like a normal field. It can return text, number, currency, percent, date, date-time or checkbox. It can also reach up to parent records with cross-object formulas. For example, on Contact I can show Account.Industry without copying the value. The limitations: it can't reference child records, so for that you need a roll-up. It's never directly editable, and there are size limits on the formula. The one that catches people in interviews is automation. Because it's calculated at runtime, a change in its value doesn't fire triggers or flows on its own. So if the account's industry changes, a flow watching the contact's formula field won't run.

- Read-only, calculated at runtime
- Cross-object formulas can reach parent records
- Cannot reference child records; use roll-ups for that
- Value changes do not fire triggers or flows by themselves

<sub>Also asked as: Explain formula fields in Salesforce · Can a formula field reference a parent object? · Are formula fields stored in the database? · what can't you do with a formula field</sub>

### Can you give some examples of validation rules you have written?
*Fresher (0–2 yrs) · code* · `adm-008`

A validation rule is a formula that returns true when the data is wrong. When it's true, the save is blocked and the user sees an error message, either at the top of the page or on a specific field. One I've written many times: require Amount when an opportunity moves to Closed Won. I use ISCHANGED on StageName and ISPICKVAL to check for Closed Won, plus ISBLANK on Amount, and I show the error on the Amount field. Others are blocking a close date in the past for new records, or enforcing a 10-digit phone format with REGEX. Two habits I follow. I write the error message in plain business language, like 'Please enter the deal amount before closing'. And I test with data loads too, not just UI edits, because validation rules fire for API updates, imports and automation as well.

- Formula must evaluate to TRUE to block the save
- Use ISPICKVAL for picklists, ISCHANGED/PRIORVALUE for changes
- Fires for UI, API, imports and automation
- Show the error on the relevant field where possible

```java
/* Amount required when moving to Closed Won */
AND(
  ISCHANGED(StageName),
  ISPICKVAL(StageName, "Closed Won"),
  ISBLANK(Amount)
)

/* Close date cannot be in the past on new records */
AND(ISNEW(), CloseDate < TODAY())

/* Phone must be exactly 10 digits when filled */
AND(NOT(ISBLANK(Phone)), NOT(REGEX(Phone, "[0-9]{10}")))
```

<sub>Also asked as: Write a validation rule example · How does a validation rule work? · validation rule to make a field required when stage is closed won · Give me a practical validation rule</sub>

### How would you bypass a validation rule for an integration user or a data migration?
*Mid (3–6 yrs) · scenario* · `adm-009`

I use a custom permission rather than hard-coding a profile name or a user Id. I create a custom permission, say Bypass Validation, assign it through a permission set to the integration user or the migration user, and add NOT($Permission.Bypass_Validation) as the first condition in each rule. Say we're migrating 100,000 old cases that don't have the fields our new rules require. I give the migration user that permission set, run the load, and the rules simply skip that user. Everyone else is still checked. It's clean because I can grant or remove the bypass without touching the rules, and it works the same in every sandbox. The same pattern works for bypassing flows and triggers too. Some teams use a hierarchy custom setting checkbox for one-off migrations, but the custom permission is easier to audit. And I always remove the permission once the load is done.

- Use a custom permission referenced as $Permission
- Assign through a permission set, not by profile name
- Same pattern can bypass flows and triggers
- Remove the bypass after the migration

```java
AND(
  NOT($Permission.Bypass_Validation),
  ISPICKVAL(StageName, "Closed Won"),
  ISBLANK(Amount)
)
```

<sub>Also asked as: Validation rules are blocking our data load, how do you skip them? · How do you make a validation rule not apply to certain users? · bypass validation rule for admin profile · Best way to disable validation for integration user</sub>

### What is the difference between record types and page layouts?
*Fresher (0–2 yrs) · comparison* · `adm-010`

Record types let you have different business processes and picklist values on the same object. Page layouts control how the record page looks. For example, a Case object might have Hardware and Software record types. Each one has its own Type picklist values and its own support process. Then the page layout decides which fields, sections, related lists and buttons show up, and which fields are required or read-only on screen. So the Hardware layout might show Serial Number, and the Software layout shows Version instead. The two connect through page layout assignment, where you pick a layout for each combination of profile and record type. One gotcha: users need the record type assigned to their profile or permission set, otherwise they can't create records of that type at all.

- Record type: picklist values, business process, layout assignment
- Page layout: fields, sections, related lists, buttons
- Layout assignment = profile x record type
- Users need the record type assigned to create those records

<sub>Also asked as: Record type vs page layout · Why do we need record types? · Can you have different picklist values for different users? · what does a record type control</sub>

### How are page layouts, Lightning record pages and Dynamic Forms different?
*Mid (3–6 yrs) · comparison* · `adm-011`

A page layout controls fields, related lists and buttons on a record in a fairly fixed way. A Lightning record page, built in Lightning App Builder, controls the whole page: which components appear, tabs, and component visibility rules. You can assign it by app, record type and profile. Dynamic Forms takes the fields out of the page layout and places them as individual fields and sections on the Lightning page, each with its own visibility rule. For example, I can show Discount Reason only when Discount is above a threshold, without a second layout. It works on custom objects and most standard objects, and it cuts down the number of page layouts you need. One caution I always mention: visibility rules are UI only. Hiding a field doesn't secure it. If the data must be protected, use field-level security.

- Page layout: fields, related lists, actions
- Lightning record page: components and visibility, assigned by app/record type/profile
- Dynamic Forms: field-level placement and conditional visibility
- Visibility is UI only; use FLS to secure data

<sub>Also asked as: What is Dynamic Forms and why use it? · Lightning record page vs page layout · How can you show a field only when another field has a value? · difference between page layout lightning page and dynamic forms</sub>

### What is a global value set and when do you use it?
*Fresher (0–2 yrs) · concept* · `adm-012`

A global value set is one shared list of picklist values that many picklist fields can use, on one object or many. Say Region appears on Account, Opportunity and a custom Project object. I define North, South, East and West once in a global value set. When the business adds a new region, I add it once and all three fields get it, so the data stays consistent. Fields based on a global value set are always restricted. That means users and integrations can't save a value that isn't on the list, which is good for data quality. Record types can still limit which of those values are available on each record type. If a picklist is only used in one place, a local value set is fine, and I still usually mark it restricted.

- One list of values reused by many picklist fields
- Changes apply to every field using it
- Global value set picklists are always restricted
- Record types can still limit which values each user sees

<sub>Also asked as: Global picklist vs local picklist · How do you share picklist values across multiple fields? · What is a restricted picklist? · global value set salesforce</sub>

### The business wants Sub-Category values to change based on the selected Category. How would you do it?
*Fresher (0–2 yrs) · scenario* · `adm-013`

I'd set up a field dependency, with Category as the controlling field and Sub-Category as the dependent picklist. In Setup, on the object's Fields and Relationships, I open Field Dependencies, choose the two fields, and in the matrix tick which Sub-Category values are valid for each Category. So if Category is Hardware, the user only sees Laptop, Printer and Monitor. If it's Software, they see Install, Licence and Bug. The rules on field types: the controlling field can be a standard or custom picklist or a checkbox. The dependent field must be a custom picklist or multi-select picklist. A multi-select picklist can't be a controlling field. And record types still filter values on top of the dependency, so when a value is missing I check both places.

- Controlling: picklist or checkbox
- Dependent: custom picklist or multi-select picklist
- Multi-select picklists cannot be controlling
- Record type value filtering still applies

<sub>Also asked as: What is a field dependency? · Controlling and dependent picklist explained · Can a checkbox be a controlling field? · how to filter picklist values based on another picklist</sub>

### What is the difference between a matching rule and a duplicate rule?
*Mid (3–6 yrs) · comparison* · `adm-014`

A matching rule defines how two records are compared to decide they're duplicates. A duplicate rule defines what happens when a match is found. The matching rule lists the fields and the method for each, exact or fuzzy. For example, fuzzy on company name plus exact on email domain, so 'Acme Corp' and 'Acme Corporation' with the same domain count as a match. The duplicate rule uses one or more matching rules and decides whether to allow the save with an alert, or block it, on create and on edit, and whether to report the duplicates. It can also compare across objects, like a new lead against existing contacts, and found duplicates can be tracked in duplicate record sets. Salesforce ships standard rules for accounts, contacts and leads, and you can build your own for custom objects.

- Matching rule: which fields and exact or fuzzy logic
- Duplicate rule: allow with alert, report, or block
- Can compare across objects, e.g. lead against contact
- Duplicates found can be tracked in duplicate record sets

<sub>Also asked as: How does duplicate management work in Salesforce? · Matching rule vs duplicate rule · How do you stop users creating duplicate accounts? · explain duplicate and matching rules</sub>

### Sales says duplicate leads keep coming in from web forms and imports. How would you stop that?
*Mid (3–6 yrs) · scenario* · `adm-015`

I'd handle prevention and clean-up separately. For prevention, I turn on a lead matching rule on email plus normalised company or phone, and a duplicate rule that alerts users in the UI. The catch is that Web-to-Lead and API inserts can't respond to an alert. So for those channels I either block or let them through and report them, depending on whether losing a lead is worse than a duplicate. Usually sales would rather have the duplicate. I also match leads against existing contacts so known customers get flagged. For imports, the Data Import Wizard can match on email to update instead of insert. So if marketing uploads 5,000 event leads and 800 already exist, those 800 get updated, not duplicated. For existing data, I run duplicate jobs or reports and merge in batches with the business.

- Matching rule on email plus normalised fields
- Duplicate rule: alert in UI, block or report for API/web
- Cross-object matching against contacts
- Import with match-on-email to update instead of insert
- Separate one-time clean-up and merge

<sub>Also asked as: How do you prevent duplicate leads? · Duplicate records are being created from Web-to-Lead, what will you do? · duplicate leads from imports how to fix · How would you clean up existing duplicates and prevent new ones?</sub>

### What is an approval process and what are its main components?
*Fresher (0–2 yrs) · concept* · `adm-016`

An approval process routes a record to one or more people for sign-off before it can move forward. A typical case is a discount above a limit. The main parts are: entry criteria, which decide which records can be submitted. Then approval steps, each with its own approver, like the submitter's manager, a specific user or a queue. Then actions at each stage: initial submission, final approval, final rejection and recall. Usual actions are field updates, email alerts and tasks. Say a rep submits a quote with 25 percent discount. It goes to their manager, the status becomes Pending, and on approval an email goes back to the rep. By default the record is locked when submitted, so only admins and the approver can edit it until it's done. You can also set delegated approvers and choose unanimous or first-response approval.

- Entry criteria and who can submit
- One or more steps, each with approvers
- Initial submission, approval, rejection and recall actions
- Record locking during approval
- Delegated approvers and unanimous or first-response options

<sub>Also asked as: Explain approval process in Salesforce · What happens to a record when it is submitted for approval? · What are initial submission actions? · approval process steps and actions</sub>

### Design a two-level approval where discounts above 20% need the manager, and above 40% also need a VP.
*Senior (7–10 yrs) · scenario* · `adm-017`

I'd create one approval process on Opportunity or Quote with entry criteria of discount above 20 percent. Step one goes to the submitter's manager using the Manager field on User. Step two has its own criteria, discount above 40 percent, and goes to a VP. I'd use a named user, a queue or a custom user lookup so the approver isn't hard-coded. So a 30 percent deal only needs the manager and is approved after step one. A 45 percent deal goes to the manager first, then the VP. Initial submission locks the record and sets status to Pending, final approval sets Approved, and rejection resets the discount or status. For newer builds I'd also look at Flow Approval Processes, built on Flow Orchestration, which handle more complex routing.

- Entry criteria at the lowest threshold
- Step 1: manager; Step 2: criteria-based VP step
- Avoid hard-coded approvers; use user fields or queues
- Status field updated by submission, approval and rejection actions
- Consider Flow Approval Processes for complex routing

<sub>Also asked as: How would you build a multi-step approval process? · Discount approval with different levels based on amount, how? · multi level approval manager then vp · Would you use a classic approval process or Flow approvals today?</sub>

### What is the difference between a queue and a public group?
*Fresher (0–2 yrs) · comparison* · `adm-018`

A queue can own records. A public group is just a collection of users used for access and sharing. Queues work for objects like Leads, Cases and supported custom objects. Records sit in the queue until a member takes ownership. For example, all new support cases from the website land in a Tier 1 Support queue, and whichever agent is free picks the next one. Queues are often the target of assignment rules. A public group can't own records. It's used in sharing rules, manual sharing, and list view and folder access. Say the finance team needs to see all closed opportunities. I'd make a Finance public group and share to it. A group can contain users, roles, roles with subordinates, and other groups. Queue members can also be users, roles or public groups.

- Queue: owns records, members pick work from it
- Public group: used for sharing and visibility, not ownership
- Groups can contain users, roles, roles and subordinates, other groups
- Queues are often the target of assignment rules

<sub>Also asked as: Queue vs public group · Can a public group own a record? · When do you use a queue? · what are public groups used for in salesforce</sub>

### What are report types, and when would you create a custom report type?
*Fresher (0–2 yrs) · concept* · `adm-019`

A report type is the template that says which objects and fields a report can use and how those objects are joined. Salesforce creates standard report types automatically for standard objects and for custom objects with reporting enabled. I create a custom report type when I need a specific combination. For example, Accounts with or without Cases, adding fields from lookups with the Add Fields Related via Lookup option, or a primary object with up to three related child levels. The with or without setting really matters. Say the business wants every account and its cases. If I pick 'with Cases', accounts that never raised a case disappear from the report, which is an inner join. If I pick 'with or without Cases', those accounts show too, which is an outer join. That one choice is behind a lot of 'my report is missing records' questions.

- Defines objects, relationships and available fields
- Standard report types are auto-generated
- Custom report type: primary object plus related objects
- With = inner join, with or without = outer join

<sub>Also asked as: Standard report type vs custom report type · Why can't I see a field in the report builder? · What does with or without related records mean in a report type? · custom report type salesforce explain</sub>

### What are the report formats, and when would you use a joined report?
*Mid (3–6 yrs) · concept* · `adm-020`

There are four report formats. Tabular is a simple list, good for exports. Summary groups rows and adds subtotals, and you need it for most dashboard charts. Matrix groups by rows and columns, like opportunity amount by owner and by quarter. A joined report shows several report blocks side by side. Each block can use a different report type, and they're linked by a common grouping field. Here's where I use joined. Say an account manager wants, for each of her accounts, the open opportunities and the open cases in one view. A single report type can't give both, because opportunities and cases are separate children of Account. So I build a joined report with an Opportunities block and a Cases block, both grouped by Account Name.

- Tabular: flat list
- Summary: row groupings with subtotals
- Matrix: row and column groupings
- Joined: multiple blocks, can use different report types, grouped by a common field

<sub>Also asked as: Tabular vs summary vs matrix vs joined report · What is a joined report? · how do you show data from two report types in one report · Explain report formats in Salesforce</sub>

### Each sales manager should see a dashboard with only their own team's numbers. How would you do it?
*Mid (3–6 yrs) · scenario* · `adm-021`

I'd use a dynamic dashboard. It runs as the logged-in viewer instead of a fixed running user, so each manager sees only the data their sharing access allows. With a private sharing model and a proper role hierarchy, a manager automatically sees their team's records. So if there are ten regional managers, I build one dashboard instead of ten. The North manager opens it and sees North numbers, the South manager sees South. The catch is that dynamic dashboards are limited in number per org depending on edition. So for a simpler need I might use one dashboard with a dashboard filter on role or owner, or report filters like My Team's records. Whichever way, I make sure the source report and dashboard folders are shared with the managers, otherwise they get an access error.

- Dynamic dashboard runs as the logged-in user
- Relies on sharing and the role hierarchy
- Limited number per org by edition
- Alternatives: dashboard filters or 'my team' report filters
- Share the report and dashboard folders

<sub>Also asked as: What is a dynamic dashboard? · How can one dashboard show different data to different users? · dashboard running user vs logged in user · Managers should see only their team data on dashboard, what is the solution?</sub>

### What are the different types of sandboxes?
*Fresher (0–2 yrs) · comparison* · `adm-022`

There are four sandbox types. A Developer sandbox copies only metadata, with a small data storage allowance, and can be refreshed daily. That suits individual development. Developer Pro is the same but with more storage, useful for bigger test data sets. A Partial Copy sandbox copies all metadata plus a sample of production data defined by a sandbox template, and you can refresh it every five days. That's good for QA and integration testing. A Full sandbox copies all metadata and all data, can be refreshed every 29 days, and is the right place for UAT, performance testing and staging. A quick example: if a tester needs a few thousand real-looking accounts with their opportunities, I'd use Partial Copy with a template. If business users need to test against the full production data set, that needs a Full sandbox.

- Developer: metadata only, refresh 1 day
- Developer Pro: metadata only, more storage, refresh 1 day
- Partial Copy: metadata plus sampled data via template, refresh 5 days
- Full: complete copy, refresh 29 days

<sub>Also asked as: Developer vs Developer Pro vs Partial Copy vs Full sandbox · Which sandbox copies production data? · sandbox refresh interval · Explain sandbox types in Salesforce</sub>

### You are setting up environments for a new project. Which sandbox would you use for what?
*Mid (3–6 yrs) · scenario* · `adm-023`

I'd give each developer, or each small feature team, a Developer sandbox, because they refresh daily and keep work isolated. Then a Developer Pro or Partial Copy sandbox as the integration and QA environment where everyone's changes come together, with a sandbox template to bring in realistic sample data. UAT and staging go into a Full sandbox, because business users need real data volumes and the final deployment should be rehearsed against a production-like copy. Performance and load testing also belong in Full. So on a typical project of four developers, that's four Developer sandboxes, one QA sandbox, and one Full sandbox for UAT. What holds it together is source control and a clear promotion path, dev to QA to UAT to production, so the environments don't drift apart.

- Developer sandboxes for individual build
- Partial Copy or Developer Pro for integration/QA
- Full sandbox for UAT, staging and performance tests
- Use version control and a clear promotion path

<sub>Also asked as: How do you plan sandboxes for development, QA and UAT? · Which sandbox for UAT and which for performance testing? · environment strategy salesforce project · What sandbox would you give developers?</sub>

### What are change sets, their limitations, and what would you use instead?
*Senior (7–10 yrs) · comparison* · `adm-024`

Change sets move metadata from one org to a related org, like sandbox to production. You build an outbound change set in the source and accept it as an inbound change set in the target, over an authorised deployment connection. The limitations are real. They only work between orgs connected to the same production. You can't delete components with them. There's no version control or rollback. You have to add dependencies by hand, and moving profile settings is awkward. For example, if I rename a field and remove an old one, a change set can't delete the old field, so someone does it manually in production. Best practice if you do use them: validate first, then quick deploy when tests pass. For anything beyond a small team, I'd use the Salesforce CLI with Git, through DevOps Center or a CI/CD pipeline, which gives history, review and repeatable deployments.

- Only between orgs tied to the same production
- No deletions, no version control, manual dependency selection
- Validate first, then quick deploy when tests pass
- Alternatives: Salesforce CLI, DevOps Center, CI/CD tools

<sub>Also asked as: Change sets vs Salesforce CLI deployment · What are the drawbacks of change sets? · How do you deploy metadata between orgs? · outbound and inbound change sets explained · Change sets vs DevOps Center</sub>

### Your change set deployment to production failed. How do you troubleshoot it?
*Mid (3–6 yrs) · scenario* · `adm-025`

I start with the Deployment Status page in the target org. It lists every component error and failing test. The most common cause is a missing dependency. For example, a flow references a new field, but the field wasn't added to the change set. So I use View/Add Dependencies, add it, and redeploy. Next are Apex test failures, or code coverage below 75 percent org-wide. Often that's because production data or validation rules differ from the sandbox. Say a test inserts an account without a phone, and production has a rule requiring phone. It passes in the sandbox and fails in production. I also check for components someone changed directly in production, and API version mismatches. My habit is to always validate the change set first, fix issues in the sandbox, and then quick deploy once validation passes.

- Read component and test errors on Deployment Status
- Add missing dependencies
- Fix failing tests and coverage (75% org-wide minimum)
- Watch for production-only changes and data differences
- Validate first, then quick deploy

<sub>Also asked as: Change set validation failed, what do you check? · Deployment failed due to code coverage, what now? · missing dependency error in change set · Why would an inbound change set fail in production?</sub>

### How does multi-currency work in Salesforce, and what should you consider before enabling it?
*Senior (7–10 yrs) · concept* · `adm-026`

Once you enable it, every record gets a CurrencyIsoCode field, each user has a personal currency, and amounts are converted to the corporate currency for reporting using exchange rates that admins maintain. Advanced Currency Management adds dated exchange rates. So an opportunity that closed in March uses the March rate, not today's rate. Before enabling, I make sure the business understands a few things. First, multi-currency can't be turned off once enabled. Second, integrations must send the currency code. If an ERP sends 10,000 without saying EUR or USD, the record just takes a default currency and the number could be wrong. Third, roll-ups, reports and Apex need to handle conversion. In SOQL, convertCurrency() returns values in the user's currency. And I always try it in a sandbox first.

- Cannot be disabled once enabled
- Corporate currency plus maintained exchange rates
- Advanced Currency Management adds dated rates
- Integrations and code must handle CurrencyIsoCode
- convertCurrency() in SOQL

<sub>Also asked as: Explain multi currency in Salesforce · What is advanced currency management? · Can you disable multi-currency after enabling? · dated exchange rates salesforce</sub>

### What are person accounts and what should you know before enabling them?
*Mid (3–6 yrs) · concept* · `adm-027`

Person accounts are for B2C businesses where the customer is an individual, not a company. A person account combines account and contact into one record, so you see fields from both on one page. Behind the scenes there's still an account and a contact linked together. Think of a bank selling to individual customers. There's no company, so having a separate account called 'Ravi Kumar' with a contact 'Ravi Kumar' makes no sense. Person accounts fix that. Before enabling, I make sure the business really needs it, because it can't be disabled once it's on. It needs at least one person account record type, and the Contact sharing setting must be Controlled by Parent. I also review existing code, reports and integrations, because queries may now return person accounts alongside business accounts, so code often needs to check IsPersonAccount.

- Account and contact merged into one record for individuals
- Cannot be disabled once enabled
- Requires person account record type and contact OWD Controlled by Parent
- Review code using IsPersonAccount and reports

<sub>Also asked as: Explain person accounts · B2C model in Salesforce, how is it handled? · Can you disable person accounts? · person account vs business account</sub>

### You need to load 200,000 contacts. Which tool would you use, Data Import Wizard or Data Loader?
*Fresher (0–2 yrs) · scenario* · `adm-028`

For 200,000 records I'd use Data Loader, because the Data Import Wizard handles up to 50,000 records at a time. Data Loader supports all standard and custom objects, and insert, update, upsert, delete, hard delete and export. It handles millions of records, can use the Bulk API, and can be scripted from the command line. The Import Wizard is browser-based and simpler. It supports accounts, contacts, leads, solutions, campaign members and custom objects, has no delete, and has built-in duplicate matching, so it suits smaller imports by business users. For this load, I'd upsert using an External ID field. Say each contact has a Legacy_Id from the old CRM, and each account does too. Then contacts link to the right accounts without me looking up Salesforce Ids. For a big load I'd also consider turning off heavy automation first.

- Import Wizard: up to 50,000 records, limited objects, no delete
- Data Loader: millions of records, all objects, all operations
- Use External IDs for upsert and relationships
- Consider Bulk API and turning off heavy automation for big loads

<sub>Also asked as: Data Import Wizard vs Data Loader · Which tool for bulk delete of records? · how many records can data import wizard handle · What tools do you use for data migration in Salesforce?</sub>

### What is the difference between custom metadata types and custom settings?
*Mid (3–6 yrs) · comparison* · `adm-029`

Both store configuration. The difference is that custom metadata type records are metadata, so they move with change sets, packages and source deployments. Custom setting records are data, so you load them separately in each org. Say I keep discount thresholds per region. With custom metadata, I deploy the rows with the code and every sandbox and production get them. With a list custom setting, the rows are data, so they don't go out with the deployment, and someone has to load them into each org separately. Custom metadata can also be used in flows, formulas and validation rules, and getInstance and getAll read it from cache without using SOQL. Custom settings come in list and hierarchy types. The hierarchy type is still useful because values can vary by org, profile and user, which is handy for a per-user trigger bypass. For most new configuration, I go with custom metadata.

- Custom metadata: deployable records, usable in flows and formulas
- Custom settings: data, list or hierarchy
- Hierarchy settings vary by org, profile and user
- Both cached; CMDT getInstance/getAll need no SOQL

```java
// Custom metadata: deployable configuration
Discount_Setting__mdt cfg = Discount_Setting__mdt.getInstance('Default');
Decimal maxPct = cfg?.Max_Discount__c;

// Hierarchy custom setting: value resolved for the current user
Automation_Config__c conf = Automation_Config__c.getInstance(UserInfo.getUserId());
Boolean bypass = conf != null && conf.Bypass_Triggers__c == true;
```

<sub>Also asked as: Custom metadata vs custom settings, when to use which? · Why are custom metadata records deployable? · hierarchy custom setting use case · Where would you store configuration values in Salesforce?</sub>

### What is Lightning App Builder and what can you build with it?
*Fresher (0–2 yrs) · concept* · `adm-030`

Lightning App Builder is the point-and-click tool for building Lightning pages: record pages, home pages and app pages. You drag standard, custom LWC or AppExchange components onto a template, set visibility rules, and activate the page as the org default, or for an app, a record type or a profile. A Lightning app is the container users switch between in the App Launcher. It defines the navigation items, branding, utility bar, and whether it uses standard or console navigation. Here's a practical example. For a support team I'd build a console app, because console navigation opens records in tabs and subtabs. An agent can have three cases open, each with its contact in a subtab, and switch between them without losing their place. For a sales team, standard navigation is usually enough.

- Builds record, home and app pages
- Drag-and-drop components with visibility rules
- Activation by org, app, record type and profile
- Lightning app: navigation, utility bar, standard or console

<sub>Also asked as: Explain Lightning App Builder · What is a Lightning app? · Standard navigation vs console navigation · How do you create a custom home page in Lightning?</sub>

### You need to convert an existing lookup relationship to master-detail. What do you check first?
*Senior (7–10 yrs) · scenario* · `adm-031`

It can be done, but every existing child record must already have a value in the lookup. So first I run a report or query for blanks and fix them. Say there are 40,000 Site Visit records under Project and 300 have no project. The conversion won't go through until those 300 are filled in or cleaned up. I also check the child doesn't already have two master-detail relationships. Then I explain the side effects to the business. The child loses its own owner, so its sharing becomes Controlled by Parent, and any sharing rules, queues or owner-based automation on the child stop making sense. Deleting a parent will now delete its children. So I check integrations, flows and reports that use the child's owner. And converting back to lookup later only works if no roll-up summary fields depend on it.

- All child records must have the parent populated
- Max two master-detail relationships per object
- Child sharing becomes Controlled by Parent; owner field goes away
- Cascade delete now applies
- Reverse needs no dependent roll-ups

<sub>Also asked as: Can you change a lookup to a master-detail? · Steps to convert lookup into master detail relationship · Why can't I convert my lookup field to master-detail? · What changes when a lookup becomes master-detail?</sub>

### You are asked to design the data model for a new business requirement. How do you approach it?
*Senior (7–10 yrs) · scenario* · `adm-032`

I start from the business process and the reports people need. Then I map entities to standard objects wherever they fit before adding custom ones. For each relationship, I pick lookup or master-detail based on ownership, sharing and delete behaviour, and I add junction objects for many-to-many. I plan record volumes early. Very large child counts under one parent, or one user owning huge numbers of records, cause data skew and locking. For example, I wouldn't park 200,000 unmatched contacts under one 'Unknown' account, and I wouldn't make one integration user own every record. I spread ownership and avoid giant catch-all parents. I also define External IDs for integration keys, keep picklists restricted, and decide what belongs in custom metadata as configuration. Finally I walk the business through a simple ERD before anyone builds anything.

- Start from process and reporting needs
- Reuse standard objects first
- Choose relationship type by ownership, sharing and delete behaviour
- Plan for volume and avoid ownership or parent skew
- External IDs for integration keys

<sub>Also asked as: Walk me through how you design objects and relationships · What do you consider when choosing between lookup and master-detail in a design? · data model design best practices salesforce · How do you avoid data skew in your data model?</sub>

## Security and Sharing

### Can you explain the Salesforce security model?
*Fresher (0–2 yrs) · concept* · `sec-001`

Salesforce security works in layers, and a user needs access at every layer to work with a value. At the org level, you control who can log in and from where, with login hours, IP ranges, MFA and password policies. At the object level, profiles and permission sets decide if a user can create, read, edit or delete records of an object. At the field level, field-level security controls which fields they can see or edit. At the record level, sharing decides which individual records they get, starting with org-wide defaults and then opened up with the role hierarchy, sharing rules, teams, manual sharing and Apex sharing. So say a rep can log in and has Read on Opportunity. She still won't see a colleague's deal if the OWD is Private and nothing shares it with her. And even on her own deal, she won't see Margin if FLS hides it.

- Org level: login access, MFA, IP and hours
- Object level: CRUD via profiles and permission sets
- Field level: FLS
- Record level: OWD, roles, sharing rules, teams, manual and Apex sharing

<sub>Also asked as: What are the layers of security in Salesforce? · Org level, object level, field level and record level security, explain · How is data access controlled in Salesforce? · salesforce security model overview</sub>

### What are org-wide defaults and what options do they have?
*Fresher (0–2 yrs) · concept* · `sec-002`

Org-wide defaults set the baseline access for each object, meaning what users can see on records they don't own. Private means only the owner and people above them in the role hierarchy can access the record. Public Read Only means everyone can view but only the owner can edit. Public Read/Write means everyone can view and edit. Detail objects and contacts can also be Controlled by Parent. There are separate internal and external defaults, so Experience Cloud users can be more restricted than employees, and the external default can't be more open than the internal one. For example, I might set Case to Public Read Only internally so all agents can look up any case, but Private externally so a customer portal user only sees their own cases. The rule is: set OWD to the most restrictive level, then open access with sharing.

- Private, Public Read Only, Public Read/Write, Controlled by Parent
- Separate internal and external defaults
- External default cannot be more open than internal
- Set the most restrictive baseline, then open up

<sub>Also asked as: Explain OWD in Salesforce · What does Private OWD mean? · What is Controlled by Parent? · internal vs external org wide defaults</sub>

### How does the role hierarchy affect record access?
*Fresher (0–2 yrs) · concept* · `sec-003`

The role hierarchy opens up access vertically. Users in a role can see, and generally edit, records owned by users in roles below them. So a sales manager sees the opportunities owned by her reps, even when the OWD is Private. If her rep Arjun owns a deal, she can open it without any sharing rule. This is controlled by the Grant Access Using Hierarchies setting. It's always on for standard objects and can only be turned off for custom objects. One thing I always say: the role hierarchy doesn't have to match the HR org chart. It should reflect who needs to see whose data. And keep the distinction clear. Roles are about which records you can access, while profiles are about what a user can do.

- Managers inherit access to subordinates' records
- Grant Access Using Hierarchies can be disabled only for custom objects
- Should reflect data visibility needs, not just the org chart
- Roles control records; profiles control permissions

<sub>Also asked as: What is the role hierarchy used for? · Does a manager see their subordinates' records? · What is Grant Access Using Hierarchies? · role hierarchy vs profile</sub>

### What is the difference between owner-based and criteria-based sharing rules?
*Fresher (0–2 yrs) · comparison* · `sec-004`

Sharing rules give extra access to groups of users beyond the org-wide default and role hierarchy. An owner-based rule shares records based on who owns them. For example, all opportunities owned by the East Sales role are shared read-only with the West Sales role. A criteria-based rule shares records based on field values. For example, all cases where Region equals APAC are shared with the APAC support group, no matter who owns them. The difference shows up when owners change. If an APAC case gets reassigned to someone in Europe, the criteria-based rule still shares it with APAC support, because it looks at the field. You can share with public groups, roles, roles and subordinates, or territories, and give read-only or read/write. And remember, sharing rules only widen access, never restrict it.

- Owner-based: by record owner's role or group
- Criteria-based: by field values on the record
- Targets: public groups, roles, roles and subordinates, territories
- Only grant access; cannot take it away

<sub>Also asked as: Explain sharing rules · Owner based vs criteria based sharing rule · Can sharing rules restrict access? · how do you share records with users in another role</sub>

### What is manual sharing and who can do it?
*Fresher (0–2 yrs) · concept* · `sec-005`

Manual sharing lets someone share one specific record with a user, group or role when the org-wide default is Private or Public Read Only. You do it from the Sharing button or Sharing action on the record. Who can do it: the record owner, users above the owner in the role hierarchy, and users with full access or admin permissions. Say a rep owns a big account and needs a pre-sales engineer to see it for a week. She can just share it with him manually. The gotcha is that manual shares are removed when the record owner changes. So if the account moves to another rep, the engineer loses access. That's why I use manual sharing for occasional, ad-hoc access, and for repeatable needs I use sharing rules, teams or Apex sharing.

- One record shared with users, groups or roles
- Available when OWD is Private or Public Read Only
- Owner, owner's managers and admins can share
- Removed when ownership changes

<sub>Also asked as: How do you share a single record with another user? · What happens to manual shares when the owner changes? · Sharing button in Salesforce · manual sharing limitations</sub>

### How do you share records using Apex managed sharing? Can you write an example?
*Mid (3–6 yrs) · code* · `sec-006`

Apex managed sharing means inserting rows into the object's share table from code. For a custom object Project__c, the share object is Project__Share, with ParentId for the record, UserOrGroupId for the user or group, AccessLevel as Read or Edit, and RowCause. I create an Apex sharing reason on the custom object, like Reviewer_Access, and use it as the row cause. Shares with a custom reason survive an owner change, unlike manual shares. Say each project has a Reviewer lookup. When a reviewer is set, my trigger gives that user Read on the project. I collect all the shares in a list and insert once with Database.insert and allOrNone false, because sharing with the owner or with a user who already has more access fails. When the reviewer changes, I delete the old shares with that row cause so the previous reviewer loses access.

- Share object: ParentId, UserOrGroupId, AccessLevel, RowCause
- Use an Apex sharing reason for a custom row cause
- Custom-reason shares survive owner changes
- Bulkify and use Database.insert with allOrNone false
- Remove stale shares when the driving field changes

```java
public without sharing class ProjectSharingService {
    // Called from the Project__c trigger handler (after insert / after update)
    public static void shareWithReviewers(List<Project__c> projects) {
        List<Project__Share> shares = new List<Project__Share>();
        for (Project__c p : projects) {
            if (p.Reviewer__c == null || p.Reviewer__c == p.OwnerId) continue;
            shares.add(new Project__Share(
                ParentId = p.Id,
                UserOrGroupId = p.Reviewer__c,
                AccessLevel = 'Edit',
                RowCause = Schema.Project__Share.RowCause.Reviewer_Access__c
            ));
        }
        Database.SaveResult[] results = Database.insert(shares, false);
        for (Database.SaveResult r : results) {
            if (!r.isSuccess()) {
                System.debug(LoggingLevel.WARN, r.getErrors()[0].getMessage());
            }
        }
    }

    public static void removeReviewerShares(Set<Id> projectIds) {
        delete [SELECT Id FROM Project__Share
                WHERE ParentId IN :projectIds
                AND RowCause = :Schema.Project__Share.RowCause.Reviewer_Access__c];
    }
}
```

<sub>Also asked as: Write Apex code to share a record with a user · What is a share object, like Project__Share? · apex managed sharing example code · How do you programmatically share a custom object record?</sub>

### What is a row cause in sharing, and how does it behave for standard versus custom objects?
*Senior (7–10 yrs) · concept* · `sec-007`

RowCause records why a share row exists. Values include Owner, Manual, Rule for sharing rules, Team, Territory, or a custom Apex sharing reason. On custom objects you can define Apex sharing reasons. Shares created with them are kept when the owner changes, and only code or admins with the right access can remove them. On standard objects like Account or Opportunity, you can't define custom sharing reasons. So Apex shares there use the Manual row cause, which means they're deleted when the owner changes, just like manual shares a user creates. Here's where it bites. Say my code shares opportunities with a finance user. A rep reassigns a deal to a colleague, and finance silently loses access. On standard objects, I either re-create those shares in the owner-change logic, or use teams or criteria-based sharing rules instead.

- RowCause values: Owner, Manual, Rule, Team, Territory, custom reasons
- Custom Apex sharing reasons only on custom objects
- Custom reasons survive owner change
- Standard-object Apex shares use Manual and are lost on owner change

<sub>Also asked as: Explain RowCause on share records · Can you create Apex sharing reasons on Account? · Why did my Apex shares disappear after owner change? · manual vs apex sharing reason row cause</sub>

### What are account teams and opportunity teams?
*Mid (3–6 yrs) · concept* · `sec-008`

Teams give a group of people working together access to a specific account or opportunity, with a defined role on it. An account team lists users like the account manager, technical consultant and support lead. For each member you set access to the account and to its related opportunities, cases and contacts. For example, the technical consultant might get Read/Write on the account but only Read on its opportunities. Opportunity teams, enabled through Team Selling, do the same for a deal, and they work with opportunity splits for revenue credit. So if two reps work a deal, they can split the credit 60/40. Users can set a default team that's added to their new records automatically. Teams create share records with a Team row cause, so they work fine with a Private sharing model.

- Account team: per-member access to account and related records
- Opportunity team requires Team Selling to be enabled
- Default teams can be added automatically
- Opportunity splits work with opportunity teams

<sub>Also asked as: Explain account team and opportunity team · How do team members get access to records? · What is team selling? · default account team salesforce</sub>

### How does territory management affect sharing?
*Senior (7–10 yrs) · concept* · `sec-009`

Sales Territories, formerly Enterprise Territory Management, gives record access based on territories instead of the role hierarchy. Accounts are assigned to territories manually or with assignment rules, users are assigned to territories, and each territory or model defines the access level its users get to those accounts and to related opportunities, cases and contacts. Users higher in the territory hierarchy inherit access to territories below them. Where it really helps is when one account needs several reps. Say a large customer in Mumbai is covered by a West India rep for geography and also by a separate rep for the cloud product line. A single role hierarchy can't express that, but with territories the account simply sits in both territories and both reps get access. Territories can also be used as targets in sharing rules.

- Access follows account-to-territory and user-to-territory assignment
- Access levels for accounts, opportunities, cases, contacts
- Territory hierarchy rolls access upwards
- Supports multiple reps per account across dimensions

<sub>Also asked as: How do Sales Territories give access to accounts? · Enterprise Territory Management sharing explained · Role hierarchy vs territory hierarchy · territory based access to opportunities</sub>

### What is the difference between profiles, permission sets and permission set groups?
*Fresher (0–2 yrs) · comparison* · `sec-010`

A profile is the base set of permissions and settings every user must have, and each user has exactly one. A permission set adds permissions on top of the profile, and a user can have many. So it's the flexible way to give extra access, like object permissions, field access or system permissions, to specific people. A permission set group bundles several permission sets into one unit that matches a job role. For example, a Sales Operations group might bundle three permission sets: one for opportunity access, one for reporting and one for price books. I assign one group instead of three sets. Permissions in Salesforce are additive. A permission set can grant access but not remove it. The one exception is a muting permission set inside a group, which can switch off permissions that group would otherwise give.

- Profile: one per user, baseline settings
- Permission set: many per user, extra access
- Permission set group: bundles sets by job role
- Access is additive; muting sets remove within a group

<sub>Also asked as: Profile vs permission set · Why use permission set groups? · Can a user have more than one profile? · profiles permission sets and permission set groups explained</sub>

### What is Salesforce's direction on profiles versus permission sets, and how would you design user access today?
*Mid (3–6 yrs) · concept* · `sec-011`

Salesforce recommends a permission-set-led model. They had announced retiring object and field permissions on profiles, but later stopped enforcing that date, and in 2026 the retirement was cancelled. So profiles still work. But the best practice hasn't changed. I keep profiles minimal, often based on the Minimum Access profile, holding things like default record types, page layout assignments, login hours, IP ranges and default apps. Object permissions, field-level security and system permissions go into small, focused permission sets, bundled into permission set groups per job role. User Access Policies can automate the assignments. For example, instead of a Sales Rep profile and a nearly identical Senior Sales Rep profile, I'd have one minimal profile, a Sales Rep group, and one extra permission set for the senior folks. That gives fewer profiles, clearer auditing and easier changes.

- Profile permission retirement was cancelled; permission sets are still the recommended model
- Minimal profiles for defaults, layouts, login settings
- Object, field and system permissions in permission sets
- Group sets by persona with permission set groups
- Automate assignments with User Access Policies

<sub>Also asked as: Is Salesforce retiring permissions on profiles? · Why should we move to permission sets? · permission set led security model · What should go on a profile now?</sub>

### A permission set group gives one team a permission they should not have. How do you remove it without breaking the group for others?
*Mid (3–6 yrs) · scenario* · `sec-012`

I'd use a muting permission set, but it only works inside a permission set group. A muting set removes permissions from the group it belongs to. So I'd create a separate group for that team, say Sales Ops Limited, with the same permission sets, and add a muting permission set that mutes Delete on Opportunity or whichever permission is the problem. Everyone else keeps the original group, untouched. The gotcha is that muting only affects permissions granted through that group. If the same permission comes from the user's profile or from another directly assigned permission set, they still have it. So if a user still can delete opportunities after this, I go looking for that other source. I verify the result on the group's summary of combined permissions.

- Muting permission sets exist only inside a permission set group
- Muting removes permissions granted by that group only
- Access from profiles or other sets is not muted
- Check the group's combined permissions summary

<sub>Also asked as: What is a muting permission set? · How do you take away a permission in a permission set group? · muting permission set use case · Can you restrict access with permission sets?</sub>

### What is field-level security?
*Fresher (0–2 yrs) · concept* · `sec-013`

Field-level security controls whether a user can see a field and whether they can edit it. It's set through profiles and permission sets. If FLS hides a field, it's hidden everywhere: record pages, list views, reports, search results and the API. That's different from making a field read-only or taking it off a page layout. That only changes that one screen, and the user can still get to the field through reports or the API. For example, if I just remove Salary from the Employee layout, a user can still build a report, add the Salary column and export it. So for anything sensitive, like salary or a credit score, I always secure it with FLS, and I treat page layouts as user experience only.

- Visible and read-only settings per field
- Set in profiles and permission sets
- Applies to UI, reports, search and API
- Page layouts only change the screen, not security

<sub>Also asked as: Explain FLS · How do you control who can see or edit a field? · Field level security vs page layout read only · where do you set field level security</sub>

### How would you hide a sensitive field from users of a particular profile?
*Fresher (0–2 yrs) · scenario* · `sec-014`

I'd remove access through field-level security, not just the page layout. If the field is currently granted on that profile, I uncheck Visible for it in the profile's field-level security. In a permission-set-led setup, I also make sure no permission set or group assigned to those users grants the field, and I give it only to the users who need it through a permission set. Say it's a Credit Score field and only the finance team should see it. I'd remove it from the profile, check that no other set gives it to sales, and create a Finance Credit permission set. Then I verify with the user access summary, or by logging in as a test user, that the field is gone from the record page, reports, list views and the API. Removing it from the layout alone would still leave it reachable in reports.

- Use FLS, not just the page layout
- Remove from the profile and any assigned permission sets
- Grant to required users through a permission set
- Verify with login-as or the user access summary

<sub>Also asked as: Hide a field from one profile, how? · A field should not be visible to support users, what will you do? · how to make a field invisible for some users · Remove field access for a profile</sub>

### What are restriction rules and scoping rules, and how are they different from sharing?
*Mid (3–6 yrs) · comparison* · `sec-015`

Sharing in Salesforce only adds access, so restriction rules exist to narrow it. A restriction rule filters which records a set of users can see on supported objects, even if sharing would give them more. For example, contractors only see tasks they own. They're supported on custom objects, contracts, events, tasks, quotes, time sheets and some external objects, with a small number of active rules per object. Users with View All or Modify All bypass them and still see everything. A scoping rule is different. It doesn't remove access. It only sets the default set of records users see in list views, reports and lookups. Say a rep has access to all accounts, but a scoping rule shows only her region's accounts by default. She can still switch the scope and see everything she has access to.

- Restriction rules reduce visible records for matched users
- Scoping rules change the default view only, not access
- Users with View All / Modify All bypass restriction rules
- Limited supported objects and active rules per object

<sub>Also asked as: Restriction rules vs scoping rules · How can you restrict access below the OWD? · Can restriction rules take away access granted by sharing rules? · what are scoping rules in salesforce</sub>

### Users should only see tasks related to their own region, even though tasks are broadly visible. How would you do it?
*Senior (7–10 yrs) · scenario* · `sec-016`

Tasks and events don't have regular sharing rules. They follow the related record or the owner. So this is a good fit for restriction rules. I'd add a Region field on Task, set by a flow from the related record or the owner, and a matching Region field on User. Then I create a restriction rule on Task, with user criteria for the affected users and record criteria where Region equals the user's region. So a rep with Region = South only sees tasks stamped South, even if sharing would show more. Restriction rules only support the equals operator and one level of dot notation, so I keep the criteria simple. That's why I stamp Region directly on the task. I make sure those users don't have View All on activities, and I test list views, search and reports, because results can differ.

- Restriction rules support tasks and events
- Stamp a Region field on the task to filter on
- Record criteria support only equals
- View All / Modify All bypasses the rule
- Test list views, search and reports

<sub>Also asked as: How do you restrict activity visibility by region? · Task sharing is controlled by parent, how do you limit it further? · Contractors should only see their own events, solution? · use case for restriction rules on tasks</sub>

### What is implicit sharing?
*Senior (7–10 yrs) · concept* · `sec-017`

Implicit sharing is built-in access that Salesforce grants automatically between accounts and their child records. You can't configure it or turn it off. Parent implicit sharing means if a user has access to a contact, opportunity or case, they get read-only access to its parent account. So a rep who owns an opportunity can always open the account, even if the account belongs to someone else and the OWD is Private. Child implicit sharing goes the other way. The account owner gets access to the account's child contacts, opportunities and cases, with the level defined in the owner's role settings. There's also implicit sharing for Experience Cloud users on their own account. And it only applies to accounts and these standard children, not to your custom objects.

- Parent implicit: access to child gives read on the parent account
- Child implicit: account owner gets access to child records
- Child access level comes from role settings
- Automatic, not configurable, account-related objects only

<sub>Also asked as: Explain parent implicit and child implicit sharing · Why can a user see an account when they only own its opportunity? · implicit sharing account contact opportunity case · built-in sharing behaviour in Salesforce</sub>

### What is the difference between View All and Modify All on an object versus View All Data and Modify All Data?
*Fresher (0–2 yrs) · comparison* · `sec-018`

View All and Modify All are object-level permissions. They let a user see, or see and edit, delete and transfer, every record of one object regardless of sharing. View All Data and Modify All Data are system permissions that do the same across every object in the org, which is basically admin-level access. Both kinds override sharing, so org-wide defaults, roles and sharing rules no longer limit those users. But neither overrides field-level security. For example, a data steward who cleans up accounts might get Modify All on Account only. She can fix any account, but she can't touch opportunities, and she still won't see a field that FLS hides from her. View All Data and Modify All Data I keep for admins and carefully reviewed integration users.

- Object level: View All / Modify All for one object
- System level: View All Data / Modify All Data for every object
- Both bypass sharing
- Neither bypasses field-level security

<sub>Also asked as: View All vs View All Data · What does Modify All permission do? · Does View All bypass field level security? · object level view all modify all explained</sub>

### Contractors should only log in during office hours and from the office network. How would you set that up?
*Fresher (0–2 yrs) · scenario* · `sec-019`

I'd set login hours and login IP ranges on the contractors' profile. Login hours define the days and times they can log in. If they're logged in when the window ends, the session is ended. Say the window is 9 to 6, Monday to Friday. A contractor working at 6:05 gets logged out. Login IP ranges on the profile block any login attempt from outside the allowed addresses, so from home they can't get in at all. This is different from Trusted IP Ranges under Network Access. Those apply org-wide and only skip the identity verification challenge for users on those networks. They don't block anyone. Since these are profile settings, I'd give contractors their own profile. And I'd check whether the restriction should apply to API access too.

- Profile login hours limit when users can log in
- Profile login IP ranges block logins from other addresses
- Trusted IP Ranges only skip identity verification
- Use a dedicated profile for contractors

<sub>Also asked as: What are login hours and login IP ranges? · How do you restrict login by IP address? · Trusted IP ranges vs login IP ranges · restrict user login time salesforce</sub>

### What is MFA in Salesforce and which verification methods are allowed?
*Fresher (0–2 yrs) · concept* · `sec-020`

Multi-factor authentication means users prove who they are with something they know, their password, plus something they have, like a phone app or a security key. Salesforce requires MFA for user interface logins to its products. Accepted methods are the Salesforce Authenticator app, third-party authenticator apps that generate time-based codes, physical security keys, and built-in authenticators like Touch ID or Windows Hello. Email, SMS and phone calls don't qualify as MFA methods. That's a common interview trap. A code sent by SMS might feel like a second factor, but it doesn't count. If users log in through single sign-on, MFA can be enforced at the identity provider instead. So if the company already uses Okta with MFA, that covers it. API logins for integrations are handled by the integration's own authentication, not MFA.

- Password plus a verification method
- Required for UI logins
- Authenticator apps, TOTP apps, security keys, built-in authenticators
- Email and SMS don't qualify
- With SSO, MFA can be enforced at the identity provider

<sub>Also asked as: Explain multi-factor authentication in Salesforce · Is MFA mandatory for Salesforce? · Does SMS count as MFA in Salesforce? · what verification methods can be used for MFA</sub>

### How does single sign-on with SAML work in Salesforce?
*Senior (7–10 yrs) · concept* · `sec-021`

With SAML single sign-on, a trusted identity provider, like Okta or Microsoft Entra ID, authenticates the user, and Salesforce is the service provider that accepts the result. In SP-initiated flow, the user goes to the My Domain login page, Salesforce redirects them to the identity provider, and after login the provider posts back a signed SAML assertion. Salesforce checks the signature with the provider's certificate and finds the user, usually by Federation ID. So if Priya's Federation ID in Salesforce is her company email, the assertion carries that email and she lands in her account. IdP-initiated flow starts from the provider's portal instead. Just-in-time provisioning can create or update users from assertion attributes. My Domain is required. And I always keep one non-SSO admin login for emergencies, in case the identity provider goes down.

- Identity provider authenticates; Salesforce is the service provider
- Signed SAML assertion verified with the IdP certificate
- User matched by Federation ID or username
- SP-initiated vs IdP-initiated
- JIT provisioning and My Domain

<sub>Also asked as: Explain SAML SSO basics · What is the identity provider and service provider? · SP-initiated vs IdP-initiated SSO · What is Federation ID used for? · How do you set up SSO with Okta or Azure AD?</sub>

### What is Salesforce Shield and what does it include?
*Senior (7–10 yrs) · concept* · `sec-022`

Shield is a paid add-on for organisations with strict security and compliance needs, so mostly regulated industries. Its main parts are Platform Encryption, Event Monitoring and Field Audit Trail. Platform Encryption encrypts sensitive data at rest, like fields, files and attachments, while keeping most platform features working, and it supports customer-controlled keys. Event Monitoring records detailed user activity, like logins, report exports, API calls and page views, so you can spot risky behaviour. Transaction security policies can block or alert on it in real time. Field Audit Trail extends field history tracking, with many more tracked fields per object and history kept far longer than standard field history. For example, a bank might need to prove years later who changed a customer's credit limit. Standard field history won't keep it that long, but Field Audit Trail will.

- Platform Encryption: data at rest, key management options
- Event Monitoring: detailed activity logs, transaction security policies
- Field Audit Trail: more tracked fields, long-term history retention
- Used for regulated industries and compliance

<sub>Also asked as: Explain Shield Platform Encryption, Event Monitoring and Field Audit Trail · What is Salesforce Shield used for? · Which tools help with compliance and auditing in Salesforce? · salesforce shield components</sub>

### What is the difference between Shield Platform Encryption and Classic Encryption, and between deterministic and probabilistic encryption?
*Senior (7–10 yrs) · comparison* · `sec-023`

Classic Encryption is the free option. It's a special Encrypted Text field type with masking, a limited length, and access controlled by the View Encrypted Data permission. Shield Platform Encryption encrypts existing standard and custom fields, files and attachments at rest without changing field types, and it has key management options. It has two schemes. Probabilistic is the default and the strongest, because the same value encrypts differently each time, but you can't filter or match on it. Deterministic gives the same ciphertext for the same value, so exact-match filtering, some reports and duplicate matching keep working, with slightly weaker protection. For example, if I encrypt Email and the business still wants duplicate rules on email, it has to be deterministic. Before encrypting anything, I check the impact on formulas, sorting, search and integrations.

- Classic: Encrypted Text field type, masking, View Encrypted Data
- Platform Encryption: existing fields, files, at rest
- Probabilistic: strongest, no filtering
- Deterministic: exact-match filtering possible
- Review impact on formulas, sorting and search

<sub>Also asked as: Classic encrypted field vs Platform Encryption · Can you filter on an encrypted field? · deterministic vs probabilistic encryption scheme · What are limitations of Platform Encryption?</sub>

### What is Event Monitoring and how have you seen it used?
*Senior (7–10 yrs) · concept* · `sec-024`

Event Monitoring captures detailed records of what users do in the org, like logins, report runs and exports, API calls, Apex executions, page views and file downloads. The data comes as event log files, typically hourly or daily, and some events can be streamed in near real time. The common uses are security, adoption and performance. For security, say a salesperson resigns and the business wants to know if they exported the customer list on their last week. The report export logs show that. For adoption, you can see which pages people actually use. And for performance, you can find slow pages or Apex. With real-time events you can build transaction security policies that block an action, require MFA, or notify admins, for example when someone exports more than a set number of records.

- Event log files for logins, exports, API, Apex, page views
- Real-time event monitoring for selected events
- Transaction security policies can block, require MFA or notify
- Used for security, adoption and performance analysis

<sub>Also asked as: How can you track who exported a report? · Explain event log files and transaction security · How do you detect suspicious user activity in Salesforce? · event monitoring use cases</sub>

### A user says they cannot see a record. How do you troubleshoot it?
*Mid (3–6 yrs) · scenario* · `sec-025`

I go through the layers in order. First, does the user have Read on the object through their profile or permission sets? Second, record access. I open the record's Sharing Hierarchy or Sharing button to see who has access and why. Then I check the org-wide default, the owner's place in the role hierarchy, sharing rules, teams, territories and manual shares. Third, I check restriction rules or scoping rules, and whether a list view or report filter is just hiding it. For example, a user once said she couldn't see a case, and it turned out her list view was filtered to My Open Cases and the case was closed. If it's a specific field, I check field-level security. Finally, I log in as the user to confirm, and fix the gap with the right sharing mechanism.

- Object permission via profile or permission sets
- Sharing: OWD, role, rules, teams, territories, manual
- Use the record's Sharing Hierarchy / access explanation
- Check restriction and scoping rules, filters, FLS
- Confirm with login-as

<sub>Also asked as: User can't access a record, what will you check? · Insufficient privileges error, how to debug? · How do you find out why a user doesn't see an opportunity? · record not visible to user troubleshooting steps</sub>

### Sales reps in India need read access to opportunities owned by the US team. How would you give it?
*Mid (3–6 yrs) · scenario* · `sec-026`

The two teams sit in different branches of the role hierarchy, so I'd create a sharing rule. If ownership defines the region, an owner-based rule on Opportunity shares records owned by US Sales and subordinates with India Sales and subordinates, read-only. If region is a field on the record, a criteria-based rule on Region equals US is more precise, because it still works when a record's owner changes teams. Say a US deal gets reassigned to a rep who sits under the Canada role. The owner-based rule would stop sharing it, but the criteria-based one still does. For a cleaner design, I share with public groups instead of roles directly, so membership can change without editing the rules. I give Read Only, not Read/Write, and I keep the OWD Private so only this access is added.

- Owner-based rule when region follows the owner's role
- Criteria-based rule when region is a field
- Grant Read Only, not Read/Write
- Prefer public groups as sharing targets
- Keep OWD restrictive

<sub>Also asked as: Give read access to records in another region · How do you share records across roles that are not in the same branch? · Users in one region need to view another region's accounts · cross region access sharing rule</sub>

### A user can view a record but cannot edit it. What do you check?
*Mid (3–6 yrs) · scenario* · `sec-027`

I check four things. First, the object permission. The user needs Edit on the object, not just Read. Second, record access. Sharing might only give Read, for example a read-only sharing rule, or a Public Read Only OWD while they're not the owner. Third, whether the record is locked, usually by a pending approval process, or made read-only by validation or record-type-specific logic. The approval one is very common. Say a rep submits a discount for approval and then tries to fix a typo. The record is locked until the approver acts. Fourth, for a single field, field-level security may mark it read-only, or the page layout may show it as read-only. And if the Edit button is missing entirely, I check the page layout or the Lightning page actions.

- Object permission Edit
- Record-level access level Read vs Read/Write
- Record locked by approval process
- Field-level security or layout marking the field read-only
- Edit action missing from layout or Lightning page

<sub>Also asked as: User has read access but edit is failing, why? · Edit button missing on record, troubleshooting · Why is a record read-only for a user? · user cannot edit a field even though they can see it</sub>

### How would you design the sharing model for a large organisation with regional sales and support teams?
*Senior (7–10 yrs) · scenario* · `sec-028`

I start with the most restrictive org-wide defaults the business can accept, usually Private for accounts, opportunities and cases, and Controlled by Parent for detail objects. I design a role hierarchy based on data visibility, not the HR chart, and keep it fairly shallow. Cross-team access goes through criteria-based sharing rules targeted at public groups, account or opportunity teams for collaboration, and territories if one account needs coverage on several dimensions. Apex sharing is a last resort, only when declarative tools can't do it. For scale, I avoid ownership skew, so one user doesn't own huge numbers of records. Say a reorg moves 300 reps to new roles. That triggers a lot of sharing recalculation, so I plan it outside business hours and use deferred sharing calculation for big changes like that.

- Restrictive OWD baseline
- Role hierarchy for visibility, kept shallow
- Criteria-based rules to public groups; teams; territories
- Apex sharing only when declarative cannot do it
- Avoid ownership skew; defer sharing calculations for big changes

<sub>Also asked as: Walk me through designing a sharing model · What are best practices for a scalable sharing model? · How do you avoid sharing recalculation issues with large data volumes? · sharing architecture design salesforce</sub>

### How do you enforce sharing, CRUD and field-level security in Apex?
*Mid (3–6 yrs) · code* · `sec-029`

Apex runs in system mode by default, so I enforce security explicitly. The sharing keywords control record access. with sharing respects the user's sharing, without sharing ignores it, and inherited sharing takes the caller's mode, which I use for reusable classes. But sharing keywords don't check object or field permissions. For those I use WITH USER_MODE on SOQL, or AccessLevel.USER_MODE on Database DML methods, which enforce sharing, CRUD and field-level security together. Security.stripInaccessible removes fields the user can't access instead of throwing an error. Here's a real case. Say an LWC shows account details and the controller queries AnnualRevenue. If the user doesn't have FLS on that field, a user-mode query throws an error, while stripInaccessible just drops the field and the page still loads. In LWC controllers, I default to with sharing and user mode.

- with / without / inherited sharing control record access only
- WITH USER_MODE enforces CRUD, FLS and sharing in SOQL
- Database methods accept AccessLevel.USER_MODE
- stripInaccessible removes inaccessible fields

```java
public with sharing class OpportunitySelector {
    public static List<Opportunity> getOpen(Id accountId) {
        return [SELECT Id, Name, Amount, StageName
                FROM Opportunity
                WHERE AccountId = :accountId AND IsClosed = false
                WITH USER_MODE];
    }

    public static void saveForUser(List<Opportunity> opps) {
        SObjectAccessDecision decision =
            Security.stripInaccessible(AccessType.UPDATABLE, opps);
        Database.update(decision.getRecords(), true, AccessLevel.USER_MODE);
    }
}
```

<sub>Also asked as: with sharing vs without sharing vs inherited sharing · What is WITH USER_MODE? · How do you use Security.stripInaccessible? · Apex runs in system mode, how do you respect user permissions?</sub>

### An integration needs access to only a few objects. How would you set up the integration user's security?
*Mid (3–6 yrs) · scenario* · `sec-030`

I follow least privilege. I create a dedicated integration user, not a named employee's account, ideally with the Salesforce Integration user license and the Minimum Access - API Only Integrations profile. Then I grant only the object and field permissions it needs through a permission set. For example, if an ERP only updates orders, it gets Read and Edit on Order and a few Account fields, not View All Data or Modify All Data. I restrict where it can log in from if the source IPs are fixed, and use OAuth instead of stored passwords. I only add a custom permission to bypass validation if it's truly needed. And every integration gets its own user. So if the ERP and the marketing tool each have their own user, I can trace exactly who changed what, and I can revoke one without breaking the other.

- Dedicated API-only user per integration
- Minimal profile plus a focused permission set
- Avoid View All Data / Modify All Data
- OAuth, IP restrictions where possible
- Separate users make auditing and revoking easy

<sub>Also asked as: How do you secure an integration user? · What profile should an integration user have? · Salesforce Integration user license, explain · least privilege for API user</sub>

## Flow and Automation

### What are the different types of flows in Salesforce?
*Fresher (0–2 yrs) · concept* · `flow-001`

The main flow types are screen flows, record-triggered flows, schedule-triggered flows, platform event-triggered flows, autolaunched flows and orchestrations. A screen flow has screens and guides a user through a process, like a case intake wizard. A record-triggered flow runs when a record is created, updated or deleted, like setting a default value when a lead comes in. A schedule-triggered flow runs at a set time and frequency, optionally for a batch of records, like checking overdue invoices every morning. A platform event-triggered flow runs when a platform event message arrives. An autolaunched flow has no trigger and is started from Apex, a REST call, a button, or another flow as a subflow. And orchestrations coordinate multi-step, multi-user processes, like onboarding that passes through HR, IT and the manager.

- Screen flow: user interaction
- Record-triggered: create, update, delete
- Schedule-triggered and platform event-triggered
- Autolaunched (no trigger): called from Apex, API or other flows
- Orchestration: multi-stage, multi-user processes

<sub>Also asked as: Explain flow types · Screen flow vs record-triggered flow vs scheduled flow · What kinds of flows can you build in Flow Builder? · types of flow in salesforce</sub>

### What is the difference between a before-save and an after-save record-triggered flow?
*Fresher (0–2 yrs) · comparison* · `flow-002`

A before-save flow, labelled Fast Field Updates, runs before the record is saved. So it can change fields on the triggering record by assigning values to $Record, with no extra DML. That makes it the fastest option for same-record updates. For example, when a case comes in with Priority High, set the SLA Due field. An after-save flow, labelled Actions and Related Records, runs after the record is saved. The record now has an Id, so you can create or update other records, send emails, call Apex actions, post to Chatter, and use scheduled paths and the asynchronous path. For example, when the case is created, also create a follow-up task for the account owner. That needs after-save, because before-save can't create or update other records. My rule is simple: same-record field updates go before-save, everything else goes after-save.

- Before-save: update $Record fields, no DML, very fast
- After-save: related records, emails, actions, subflows
- Scheduled and async paths only in after-save
- Before-save cannot create or update other records

<sub>Also asked as: Fast field updates vs actions and related records · When do you use a before-save flow? · before save vs after save flow · Why is a before-save flow faster?</sub>

### What are $Record and $Record__Prior in a record-triggered flow?
*Fresher (0–2 yrs) · concept* · `flow-003`

$Record holds the triggering record with its current values. It's the same idea as Trigger.new for one record. In a before-save flow, you update the record by assigning values to $Record fields. $Record__Prior holds the values before the update, like Trigger.oldMap. So I compare the two to detect changes. For example, a Decision that checks $Record.StageName does not equal $Record__Prior.StageName tells me the stage just moved, say from Proposal to Negotiation, and not that someone only edited the description. One gotcha: $Record__Prior is only populated for updates. On a new record it's empty, so don't rely on it in a create path. In entry condition formulas you can also use ISCHANGED, ISNEW and PRIORVALUE to do the same checks.

- $Record: current triggering record
- $Record__Prior: values before the update
- Prior is empty on create
- Compare the two, or use ISCHANGED / PRIORVALUE in formulas

<sub>Also asked as: How do you get the old value of a field in a flow? · Explain $Record global variable · record prior value in flow · How do you check if a field changed in flow?</sub>

### How do entry conditions work in a record-triggered flow, and how do you stop it running on every edit?
*Mid (3–6 yrs) · concept* · `flow-004`

Entry conditions decide whether the flow runs at all. Checking them upfront is much cheaper than letting the flow start and then exit through a Decision. You can use field conditions or a formula. The key option for updates is when to run. Either every time a record is updated and meets the conditions, or only when a record is updated to meet the condition requirements. The second one runs once, when the record goes from not meeting to meeting the criteria. That stops repeated firing and recursion. Say the condition is Status equals Closed. With the first option, every later edit on a closed case, even fixing a typo, runs the flow again. With the second, it runs only at the moment the case becomes Closed. In formula conditions, I use ISCHANGED or PRIORVALUE for the same effect.

- Filter in entry conditions, not in a first Decision
- Field conditions or formula
- 'Only when updated to meet' runs on the transition only
- ISCHANGED / PRIORVALUE in entry formulas

<sub>Also asked as: What does 'Only when a record is updated to meet the condition requirements' do? · How do you prevent a flow from running on every update? · entry criteria in record triggered flow · Flow keeps firing every time the record is saved, how do you fix it?</sub>

### What are scheduled paths and the run asynchronously path in a record-triggered flow?
*Mid (3–6 yrs) · concept* · `flow-005`

Both are only available in after-save record-triggered flows. A scheduled path runs actions at a time relative to an event, like one hour after creation, or seven days before a date field like Contract End Date. It replaces time-based workflow actions. The run asynchronously path runs as soon as possible after the original transaction commits, in its own transaction with its own governor limits. I use the async path for callouts, through the HTTP Callout action, External Services or Apex actions, and for heavier processing that shouldn't slow down the user's save. For example, when an order is created, the user's save finishes straight away, and the async path then sends it to the ERP. The gotcha: neither path can roll back the original save if it fails. So if the ERP call fails, the order still exists, and I add fault handling for that.

- After-save only
- Scheduled path: time offset from trigger or date field
- Async path: runs after commit, separate transaction and limits
- Use async path for callouts and non-urgent work
- Failures don't roll back the original save

<sub>Also asked as: What is the Run Asynchronously path? · How do you run part of a flow later? · scheduled path vs async path · Can a record-triggered flow do a callout?</sub>

### What is the difference between a schedule-triggered flow and a scheduled path?
*Fresher (0–2 yrs) · comparison* · `flow-006`

A schedule-triggered flow runs on a fixed calendar schedule, once, daily or weekly at a set time. It can run for every record that matches an object and filter, a bit like a simple batch job. A scheduled path is part of a record-triggered flow, and it runs relative to something that happened to a specific record, like three days after a case was created. So, if I need to check all open opportunities every morning at 7 and flag the ones with a past close date, I use a schedule-triggered flow. If I need to follow up on each record a certain time after it changed, or before a date on it, like emailing the customer three days after their case was created, I use a scheduled path.

- Schedule-triggered: fixed time, runs for a filtered set of records
- Scheduled path: relative to a record event or date field
- Scheduled flows behave like a simple batch
- Scheduled paths live inside record-triggered flows

<sub>Also asked as: Scheduled flow vs scheduled path · How do you run a flow every night? · When would you use a schedule-triggered flow? · daily batch job using flow</sub>

### What is a screen flow and where can you use it?
*Fresher (0–2 yrs) · concept* · `flow-007`

A screen flow is a flow with screens that guides a user through steps. It collects input, shows information, and then creates or updates records. Typical uses are guided case intake, onboarding wizards or a quote request form. You can launch it from a Lightning record, home or app page using the Flow component, from a quick action or button on a record, from the utility bar, from an Experience Cloud site, or from an LWC using the lightning-flow component. Say I put a 'Log Complaint' screen flow as a quick action on Account. If I create an input variable named recordId, the flow gets the account's Id automatically, so the agent doesn't have to pick the account again. Also remember a screen flow runs in user context by default.

- Guides users through screens
- Launch from Lightning pages, actions, utility bar, Experience Cloud, LWC
- recordId input variable for record context
- Runs in user context by default

<sub>Also asked as: Explain screen flows · How do you launch a screen flow from a record page? · Where can you embed a flow? · screen flow use cases</sub>

### What are subflows and why would you use them?
*Mid (3–6 yrs) · concept* · `flow-008`

A subflow is a flow called from another flow using the Subflow element. It lets me build reusable logic once and call it from many places. For example, I'd build one autolaunched flow that creates the standard set of onboarding tasks. Then a screen flow, a record-triggered flow and an orchestration can all call it. If HR later adds a new task, I change one flow, not three. Values go in through variables marked available for input, and results come back through variables marked available for output. Subflows keep large flows readable and easier to test. Record-triggered flows can call autolaunched subflows. One thing to remember: it all still runs in the same transaction and shares governor limits, so splitting into subflows doesn't give you extra limits.

- Subflow element calls another flow
- Input and output variables carry data
- Reusable, smaller, easier to maintain
- Same transaction and shared limits

<sub>Also asked as: How do you call one flow from another? · Explain subflow element · reusable flow logic · How do you pass values into a subflow?</sub>

### How do you call Apex from a flow? Write an invocable method.
*Mid (3–6 yrs) · code* · `flow-009`

I use the @InvocableMethod annotation on a public or global static method, and it shows up in Flow Builder as an Apex action. You can have only one invocable method per class. The method takes a List as input and returns a List, because Flow bulkifies calls. So if 200 records trigger the flow, Salesforce calls the method once with all 200 inputs, and the output list must match the input list in size and order. Say the method calculates a credit score for each account Id passed in. Inside, I write it like trigger code: one query for all 200 accounts, one DML for the whole list, and results added in the same order the Ids came in. The label, description and category attributes make it easy to find in Flow Builder. It's also callable from Agentforce and the REST API.

- Public or global static, one per class
- Input and output are Lists
- Output order matches input order
- Bulkified: one call for many interviews
- Also callable from Agentforce and the REST API

```java
public with sharing class AccountRiskScore {
    @InvocableMethod(label='Calculate Risk Score'
                     description='Scores accounts by open case count'
                     category='Account')
    public static List<Integer> calculate(List<Id> accountIds) {
        Map<Id, Integer> openCases = new Map<Id, Integer>();
        for (AggregateResult ar : [
                SELECT AccountId acc, COUNT(Id) total
                FROM Case
                WHERE AccountId IN :accountIds AND IsClosed = false
                GROUP BY AccountId]) {
            openCases.put((Id) ar.get('acc'), (Integer) ar.get('total'));
        }
        List<Integer> scores = new List<Integer>();
        for (Id accId : accountIds) {
            Integer n = openCases.containsKey(accId) ? openCases.get(accId) : 0;
            scores.add(n > 5 ? 3 : (n > 2 ? 2 : 1));
        }
        return scores;
    }
}
```

<sub>Also asked as: What is @InvocableMethod? · Write Apex that a flow can call · invocable method rules and example · How do you return values from Apex to Flow?</sub>

### How do you pass multiple inputs and outputs between Flow and Apex?
*Senior (7–10 yrs) · code* · `flow-010`

I use request and response wrapper classes whose public fields are marked @InvocableVariable. The invocable method takes a List of the request class and returns a List of the response class, one response per request, in the same order. That lets a flow pass several values and get several back. For example, the flow sends a record Id, an owner and a number of days, and gets back the new record Id and an error message. Setting the required and label attributes on the variables makes it nicer in Flow Builder. Inside, I use Database methods with partial success, so one bad row doesn't fail the whole batch. And instead of throwing, I return the error text. Then the flow can check it with a Decision, say 'if error message is blank, continue, otherwise email the admin', instead of hitting an unhandled fault.

- Wrapper classes with @InvocableVariable fields
- List<Request> in, List<Result> out, same order
- required and label attributes improve Flow Builder
- Return errors as data so the flow can branch
- Partial-success DML for bulk safety

```java
public with sharing class CreateFollowUpTask {
    public class Request {
        @InvocableVariable(required=true label='Related Record Id') public Id recordId;
        @InvocableVariable(required=true label='Owner Id') public Id ownerId;
        @InvocableVariable(label='Days From Today') public Integer days;
    }
    public class Result {
        @InvocableVariable public Id taskId;
        @InvocableVariable public String errorMessage;
    }

    @InvocableMethod(label='Create Follow-up Task' category='Activities')
    public static List<Result> run(List<Request> requests) {
        List<Task> tasks = new List<Task>();
        for (Request r : requests) {
            Integer d = r.days == null ? 3 : r.days;
            tasks.add(new Task(WhatId = r.recordId, OwnerId = r.ownerId,
                Subject = 'Follow up', ActivityDate = Date.today().addDays(d)));
        }
        List<Result> results = new List<Result>();
        for (Database.SaveResult sr : Database.insert(tasks, false)) {
            Result res = new Result();
            if (sr.isSuccess()) { res.taskId = sr.getId(); }
            else { res.errorMessage = sr.getErrors()[0].getMessage(); }
            results.add(res);
        }
        return results;
    }
}
```

<sub>Also asked as: What is @InvocableVariable? · Invocable method with wrapper class · How do you return an error message from Apex to a flow? · invocable request and response classes</sub>

### What is a fault path in a flow, and how do you handle errors?
*Fresher (0–2 yrs) · concept* · `flow-011`

A fault path is an alternate connector from an element that can fail, like Create, Update or Delete Records, Get Records, or an action. It only runs when that element throws an error. Without one, the user sees a generic unhandled fault message and the admin or flow owner gets an error email. On the fault path, I usually capture $Flow.FaultMessage, log it to a custom error log object or send a notification, and in screen flows show the user a friendly message. For example, if Create Records fails because a validation rule blocks it, the user sees 'We couldn't save this request, please check the phone number' instead of a scary error. In record-triggered flows, I can use the Custom Error element to show a clear message and stop the save. I add fault paths to every data and action element.

- Fault connector runs only when the element fails
- Unhandled faults show a generic error and email the admin
- $Flow.FaultMessage holds the error text
- Log errors, notify, and show friendly messages

<sub>Also asked as: How do you handle errors in Flow? · What happens when a flow fails without a fault connector? · What is $Flow.FaultMessage? · flow error handling best practice</sub>

### You want a record-triggered flow to block a save and show the user a message. How do you do it?
*Mid (3–6 yrs) · scenario* · `flow-012`

I use the Custom Error element, which is available in both before-save and after-save record-triggered flows. When the flow reaches it, the save is rolled back and the user sees my message, either at the top of the record or under a specific field, just like a validation rule. I reach for it when the check needs logic a validation rule can't easily do, like looking at related records with Get Records. For example, blocking a case from being closed while it still has open child tasks. The flow gets the open tasks, and if it finds any, the Custom Error says 'Please complete the open tasks before closing this case'. For simple field checks on the same record, I still prefer a validation rule, because it's simpler and needs no extra queries.

- Custom Error element in record-triggered flows
- Rolls back the save and shows the message on the page or a field
- Good for checks needing related-record data
- Validation rules remain best for simple same-record checks

<sub>Also asked as: Can a flow show an error like a validation rule? · What is the Custom Error element in flow? · How do you prevent saving a record from a flow? · validation rule vs flow custom error</sub>

### Your flow works when you edit one record but fails during a data load of thousands of records. What would you check?
*Mid (3–6 yrs) · scenario* · `flow-013`

The usual cause is a data element inside a loop. Salesforce automatically groups the same element across all flow interviews in a batch, so one Get Records or Update Records at the top level is bulkified. But if Get Records, Create Records or Update Records sits inside a Loop, it runs once per iteration and quickly hits the SOQL or DML limits. Say a load of 200 accounts comes in, and for each account the flow loops through its contacts and updates them one by one. That's hundreds of DML statements in one transaction, and it fails. I fix it by querying once before the loop, building a collection with Assignment elements inside the loop, and doing one Create or Update after the loop. I also tighten entry conditions, and for very large volumes I move the logic to Apex or an asynchronous path. And I always test with Data Loader-sized batches.

- No Get, Create, Update or Delete inside loops
- Use Assignment to build collections, then one DML after the loop
- Top-level elements are bulkified across interviews
- Tight entry conditions reduce work
- Test with Data Loader-sized batches

<sub>Also asked as: How do you bulkify a flow? · Flow failing on bulk updates with too many DML statements · Why should you avoid DML inside a loop in Flow? · flow bulkification best practices</sub>

### How do governor limits apply to flows?
*Senior (7–10 yrs) · concept* · `flow-014`

Flows run inside the same transaction as everything else triggered by that save. So they share the standard per-transaction limits with Apex triggers and other automation: 100 SOQL queries and 150 DML statements in a synchronous transaction, 50,000 rows queried, 10,000 DML rows, and the CPU time limit. The old limit of 2,000 executed elements per flow interview was removed in the Spring '23 release, so the real constraints now are those transaction limits and CPU time. Each Get Records counts as a query, and each data element as a DML statement. So if an opportunity save fires a trigger that uses 60 queries and a flow that uses 45, together they break the 100 limit, even though each looks fine alone. Scheduled and asynchronous paths start new transactions with fresh limits, which is a handy way to split work.

- Shared per-transaction limits with Apex
- SOQL 100 / DML 150 synchronous
- 2,000 executed elements limit removed in Spring '23
- Async and scheduled paths get their own limits
- CPU time is often the real bottleneck

<sub>Also asked as: Do flows have their own governor limits? · Flow and Apex share limits in the same transaction? · What happened to the 2000 element limit in Flow? · flow limits salesforce</sub>

### How do you decide between Flow and an Apex trigger?
*Senior (7–10 yrs) · comparison* · `flow-015`

I pick Flow when admins can understand the logic and the volume is moderate. That covers same-record updates in before-save flows, creating related records, notifications and guided screens. I pick Apex when the logic is complex, with nested conditions, maps or heavy calculations, when the object sees high-volume data loads, or when I need precise error handling and unit tests, complex callouts or recursion control. I also avoid mixing too many tools on one object. I keep one trigger per object through a handler, and a small, well-ordered set of flows. Often the best answer is both. For example, a record-triggered flow on Opportunity handles the simple field updates and notifications, and calls an invocable Apex method for the heavy commission calculation. The admin keeps the flow, and the developer owns the tested Apex.

- Flow: simple to moderate logic, admin-maintainable
- Apex: complex logic, high volume, precise error handling, tests
- Before-save flows are excellent for same-record updates
- Combine with invocable Apex for heavy steps
- Keep automation per object consistent and ordered

<sub>Also asked as: Flow vs Apex trigger, which one do you choose? · When is Apex better than Flow? · clicks vs code decision · Should all automation be in flows now?</sub>

### Where do record-triggered flows fit in the order of execution?
*Senior (7–10 yrs) · concept* · `flow-016`

Before-save record-triggered flows run early, after system validation and before Apex before triggers. That's why they're so efficient for same-record field updates. Then come before triggers, custom validation rules, duplicate rules, the save without commit, and after triggers. After that come assignment rules, auto-response rules, workflow rules and escalation rules, then after-save record-triggered flows, then entitlement rules. Roll-up summary recalculation and criteria-based sharing evaluation follow, and the transaction commits. Post-commit work, like sending emails and running async paths, happens after commit. Here's why it matters. Say a before-save flow sets Priority to High, and a before trigger on the same object sets it to Medium. The trigger runs later, so the record saves as Medium, and people blame the flow. Knowing the order explains it.

- Before-save flows run before Apex before triggers
- Validation rules run after before triggers
- After-save flows run after after triggers and assignment rules
- Async paths and emails run after commit

<sub>Also asked as: Do before-save flows run before or after Apex before triggers? · Order of execution with flows and triggers · When does an after-save flow run compared to after triggers? · salesforce save order flows</sub>

### Your org still has Workflow Rules and Process Builders. How would you migrate them to Flow?
*Mid (3–6 yrs) · scenario* · `flow-017`

Workflow Rules and Process Builder reached end of support on December 31, 2025. They get no bug fixes or support now, so they should be moved to Flow. I start with an inventory per object. Then I use the Migrate to Flow tool in Setup, which converts a selected workflow rule or process into a record-triggered flow. The new flow is saved inactive, so I review it, test it in a sandbox, and then activate it and deactivate the old automation together. If both stay active, the same update or email fires twice. Some features can't be converted automatically, and those I rebuild by hand. I also use the chance to consolidate. For example, five old field-update rules on Case can usually become one before-save flow.

- End of support Dec 31, 2025
- Inventory automation per object first
- Migrate to Flow converts to inactive record-triggered flows
- Test, then activate the flow and deactivate the old rule together
- Consolidate and use before-save for field updates

<sub>Also asked as: How do you use the Migrate to Flow tool? · Workflow rules and process builder are retired, what now? · migrate process builder to flow steps · What happened to Workflow Rules and Process Builder?</sub>

### You're leading a large migration from Process Builder to Flow. What's your strategy?
*Senior (7–10 yrs) · scenario* · `flow-018`

I start with a full inventory of processes, workflow rules and triggers per object, including what each does and whether it's still needed, because many are obsolete. Then I design the target per object: same-record updates in one before-save flow, and related-record actions in a few after-save flows split by business purpose, with explicit trigger order. For example, on Opportunity I might end up with one before-save flow, plus after-save flows for 'Closed Won onboarding' and 'Partner notifications'. Process Builder logic that relied on recursion or immediate re-evaluation needs extra care, because flows behave differently there. I migrate object by object in a sandbox, using the Migrate to Flow tool where it helps. I write regression test scripts and Apex tests, and deploy with the old automation deactivated in the same release, with a rollback plan ready.

- Inventory and retire unused automation
- Design per object: before-save plus purpose-based after-save flows
- Set trigger order explicitly
- Watch recursion and re-evaluation differences
- Migrate object by object with regression tests and rollback

<sub>Also asked as: How would you plan a migration of hundreds of processes to flows? · Risks when migrating process builder to flow · one flow per object or many flows? · How do you test automation migration?</sub>

### How do you debug a flow?
*Fresher (0–2 yrs) · troubleshooting* · `flow-019`

I start with the Debug button in Flow Builder. It runs the flow and shows each element's path, the decisions taken and the variable values. For record-triggered flows I can pick a test record, choose create or update, and optionally roll back the changes. So if a flow should set a discount but doesn't, I debug it against that exact opportunity and usually see the Decision went down the wrong branch. If it failed in real use, I read the flow error email, which shows the failing element and the error. I also check debug logs with the workflow category at a fine level. Flow Tests let me save repeatable test cases for record-triggered flows. For scheduled paths, I check paused and waiting interviews, and the Failed Flow Interviews list helps find issues.

- Debug button with test record and rollback option
- Flow error emails show the failing element
- Debug logs with workflow logging
- Flow Tests for repeatable checks
- Check paused, waiting and failed interviews

<sub>Also asked as: How do you troubleshoot a flow that isn't working? · Flow debug options · Where can you see flow errors? · How do you test a record-triggered flow?</sub>

### How would you automatically assign new cases to the right team?
*Fresher (0–2 yrs) · scenario* · `flow-020`

For straightforward routing I use case assignment rules. They assign a new case to a user or queue based on criteria like Origin, Product or Region, with rule entries checked in order. They run automatically for web-to-case and email-to-case, and from the UI when the assignment checkbox is used. For example, Product equals Payments goes to the Payments queue, and anything else falls to General Support. If routing needs more logic, like checking the account's support tier or the agent's workload, I use an after-save record-triggered flow that sets the case owner to the right queue. I often read the mapping from custom metadata, so the business can change it without editing the flow. And for skills or capacity-based routing, Omni-Channel is the better tool.

- Assignment rules for criteria-based routing to queues
- Record-triggered flow for complex logic
- Store routing mappings in custom metadata
- Omni-Channel for capacity and skills-based routing

<sub>Also asked as: Auto assign cases to queues, how? · Case assignment rules vs flow · Assign cases based on product or region · route cases to correct support team</sub>

### How would you send a reminder 30 days before a contract expires?
*Mid (3–6 yrs) · scenario* · `flow-021`

I'd use a record-triggered flow on Contract with a scheduled path set to 30 days before the End Date field. The entry condition checks that the contract is activated and has an end date. The scheduled path sends an email alert or creates a task for the account owner. Before acting, the path rechecks that the contract hasn't been renewed or cancelled, because the record may change in the meantime. Say a contract ends on 31 December. On 1 December the account owner gets the reminder, unless it was renewed in November. An alternative is a daily schedule-triggered flow that finds contracts whose end date is exactly 30 days from today. That's easier to reason about when dates change often. It also covers existing contracts that never get edited, which a record-triggered flow would never pick up.

- Scheduled path: 30 days before EndDate
- Entry conditions on status and end date
- Recheck status before sending
- Alternative: daily scheduled flow filtering on end date
- Scheduled flow also covers records that are never edited

<sub>Also asked as: Contract expiry reminder with flow · Send email X days before a date field · time based reminder in flow · notify account owner before contract end date</sub>

### Build a multi-step screen flow that validates user input. How would you design it?
*Mid (3–6 yrs) · scenario* · `flow-022`

I break the process into a few screens, each with one purpose. For example: customer details, product selection, then review and submit. On each input component I use the built-in required setting, plus the Validate Input formula with an error message, like checking an email format or that a date is in the future. So the user can't move to the next screen until it's valid. For checks against data, like a duplicate account, I use a Get Records and a Decision between screens. If someone types a company name that already exists, I loop back to the first screen with a message saying so. Reactive components and conditional visibility keep the screens simple. The last screen shows a review of everything entered, and then Create Records runs, with a fault path in case the save fails.

- One purpose per screen
- Required and Validate Input formulas on components
- Get Records + Decision for data checks between screens
- Conditional visibility and reactive components
- Review screen, then DML with a fault path

<sub>Also asked as: How do you validate input in a screen flow? · Multi-screen flow with back and next and validation · screen flow input validation formula · reactive screen components in flow</sub>

### When an opportunity is Closed Won, create an onboarding project and tasks. How would you build it?
*Mid (3–6 yrs) · scenario* · `flow-023`

I'd build an after-save record-triggered flow on Opportunity, set to run when a record is updated. Entry conditions: Stage equals Closed Won, with the option to run only when the record is updated to meet the conditions, so it fires once. The flow creates the Onboarding Project linked to the opportunity and the account. Then it creates the standard tasks, ideally from a task template stored in custom metadata. Say the template has five tasks, like kickoff call and data setup. I build all five in a collection and insert them with one Create Records. I add a fault path that logs errors and notifies an admin. And to be safe, I check that no project already exists for that opportunity. Otherwise, if a rep reopens the deal and closes it again, the customer gets a second project.

- After-save flow, run once when Stage becomes Closed Won
- Create project, then tasks in one collection insert
- Task templates in custom metadata
- Guard against duplicates
- Fault path with logging

<sub>Also asked as: Create related records when opportunity is closed won · Flow to create child records automatically · after save flow create records example · How do you avoid creating duplicates when the flow re-runs?</sub>

### When an account's billing address changes, all its contacts' mailing addresses should update. How would you do it in Flow?
*Mid (3–6 yrs) · scenario* · `flow-024`

I'd use an after-save record-triggered flow on Account that runs only when the billing address fields change, using ISCHANGED in the entry formula. Then a single Update Records element with 'Specify conditions to identify records': object Contact, filter AccountId equals $Record.Id, and set the mailing fields from $Record. That updates all matching contacts in one DML with no Loop. Because Flow bulkifies it, it also works for bulk account updates. So if an account with 25 contacts moves office, all 25 contacts get the new address in one go. The catch is accounts with very many contacts. If an account has thousands, I'd move this to the asynchronous path or Apex, to avoid row locks and CPU limits in the user's transaction.

- After-save on Account, only when address fields change
- One Update Records with filter, no loop
- Bulkified across interviews
- Use async path or Apex for very large child counts

<sub>Also asked as: Update child records when the parent changes · Flow to update related contacts · update records without loop flow · cascade parent field change to children</sub>

### Users get 'Too many SOQL queries: 101' when saving a record that has flows and triggers. How do you troubleshoot?
*Senior (7–10 yrs) · scenario* · `flow-025`

That error means the whole transaction, flows, triggers and other automation together, used more than 100 queries. I reproduce it with a debug log and look at the limit usage and the sequence of flow elements and trigger executions to see what repeats. The common causes are Get Records inside a loop, a trigger or flow updating records that fire other automation, and recursion where an update re-triggers the same flow or trigger. For example, an Opportunity flow updates the Account, an Account trigger then updates all its opportunities, and that fires the Opportunity flow again. I fix it by moving queries out of loops, tightening entry conditions so flows only run when relevant fields change, adding recursion guards in Apex, and moving non-urgent work to the async path or a Queueable.

- Limit is per transaction across all automation
- Debug log shows limit usage and execution sequence
- Causes: queries in loops, cascading updates, recursion
- Fix: tighter entry criteria, no queries in loops, async for non-urgent work

<sub>Also asked as: System.LimitException too many SOQL queries from flow · Flow and trigger combined hitting limits · How do you find which automation is using all the queries? · fix SOQL 101 error caused by flow</sub>

### What is a platform event-triggered flow and when would you use it?
*Mid (3–6 yrs) · concept* · `flow-026`

A platform event-triggered flow starts when a message for a specific platform event is published, for example an Order_Shipped__e event sent by an external system or by Apex. It runs in its own transaction, separate from the publisher. By default it runs as the Automated Process user, which matters for record ownership and audit fields. It has no screens. I use it for event-driven, decoupled automation. Say the ERP publishes Order_Shipped__e with an order number and tracking Id. The flow reads those from $Record, updates the order to Shipped, and notifies the account owner. The ERP doesn't need to know anything about our flows. Another use is logging errors through an event, so the log survives a rollback. And because it runs as Automated Process, the Last Modified By shows that user, not a real person.

- Starts on a published platform event message
- Separate transaction from the publisher
- Runs as the Automated Process user by default
- Good for integrations and decoupled processing
- Event fields available in $Record

<sub>Also asked as: How can a flow subscribe to a platform event? · Platform event flow use case · event driven automation in salesforce · Which user does a platform event flow run as?</sub>

### What is Flow Orchestration and when would you use it?
*Senior (7–10 yrs) · concept* · `flow-027`

Flow Orchestration coordinates a long-running business process that involves several people and systems. It's organised into stages that run in sequence, with steps inside each stage. Interactive steps assign a screen flow to a user, group or queue, who sees it as a work item. Background steps run autolaunched flows without user input. Each stage and step has entry and exit conditions, so steps can run in parallel and the process waits until conditions are met. Take employee onboarding. In stage one, HR fills in details and IT sets up a laptop in parallel. Stage two, the manager assigns a buddy, but only after both of those are done, maybe three days later. That's exactly what orchestration handles. Flow Approval Processes, Salesforce's newer approval option, are also built on orchestration.

- Stages run in sequence; steps can run in parallel
- Interactive steps assign screen flows as work items
- Background steps run autolaunched flows
- Good for long-running, multi-team processes
- Flow approvals are built on orchestration

<sub>Also asked as: Explain orchestration in Flow Builder · Stages and steps in flow orchestration · How do you build a multi-user approval in Flow? · flow orchestration vs regular flow</sub>

### A record-triggered flow must send data to an external system when a record is created. How would you build it?
*Senior (7–10 yrs) · scenario* · `flow-028`

A callout can't run in the same transaction after DML has happened. That's why a direct callout from the triggering transaction gives an 'uncommitted work pending' error. So I use the run asynchronously path of an after-save flow, which runs after the record commits, in its own transaction. In that path I call the external API with the HTTP Callout action or an External Services action, using a named credential for authentication. If the payload or response needs complex handling, I use an invocable Apex method marked callout=true instead. Say a new customer account must be sent to the billing system. If billing is down, the fault path logs the failure and sets a Sync Status field to Failed. Then a scheduled flow picks up the failed records and retries them later.

- Use the asynchronous path, not the synchronous part
- HTTP Callout action, External Services or invocable Apex with callout=true
- Named credentials for authentication
- Fault path, sync status field and retry

<sub>Also asked as: Can you make a callout from a record-triggered flow? · You have uncommitted work pending error in flow · Flow integration with external API · HTTP callout from flow on record create</sub>
