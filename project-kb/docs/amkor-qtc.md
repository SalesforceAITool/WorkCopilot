# Amkor QTC — project Q&A

Written from the project's code only (classes, triggers, LWCs, flows, tests). Read before an interview; the copilot shows these first for project and CPQ questions.

272 questions. Levels: Fresher (0–2 yrs) 81 · Mid (3–6 yrs) 125 · Senior (7–10 yrs) 66

## QTC project — Overview and triggers

### Can you explain your current project?
*Fresher (0–2 yrs) · concept* · `qtc-ov-001`

My current project is QTC, which means quote-to-cash, for Amkor, and I'm a lead on it. It is built on Salesforce CPQ, so quotes and quote lines are the CPQ objects SBQQ__Quote__c and SBQQ__QuoteLine__c, and on top of that we have custom pricing objects with the AMT prefix. The flow is roughly: Account, then Opportunity, then a CPQ quote with quote lines. Each quote line carries test details in Configurations__c and Insertions__c, and from those we create price records, AMT_Price_Record__c, which go through approval and a lifecycle. Approved prices are grouped into price agreements, AMT_Price_Agreement__c, under price agreement groups with their customers, and then they are loaded to SAP. Pricing issues, AMT_Pricing_Issue__c, link to price records. The codebase has 19 triggers, around 120 non-test Apex classes, about 55 LWCs and over 120 flows. When I explain it to someone new, I tell them to follow the money: quote line to price record to agreement to SAP, because almost every story touches that chain.

- Quote-to-cash for Amkor on Salesforce CPQ (SBQQ)
- Custom AMT pricing objects: price records, price agreements, pricing issues
- Prices are loaded to SAP; inbound REST classes receive data back
- 19 triggers, ~120 non-test Apex classes, ~55 LWCs, 120+ flows

<sub>Also asked as: Tell me about your project · What is the QTC project you work on? · Explain your Salesforce CPQ project · walk me through your project architecture</sub>

### What was your role in the QTC project?
*Fresher (0–2 yrs) · concept* · `qtc-ov-002`

I'm a lead on the QTC org, and the work covers the whole custom layer: Apex trigger handlers on objects like quote line and price record, LWCs used on the pricing screens, record-triggered and screen flows, batch and scheduled Apex for things like loading prices to SAP, and the inbound REST classes. Most stories touch the pricing side, so a typical task means understanding how a quote line turns into price records and how a status change moves through price record, quote line and opportunity. We follow a fixed process for every change: retrieve the component from the org first, write a design, get it reviewed, then build, run a check-only deploy and real tests, and leave the commit to be reviewed. I hold that process firmly, because it is a team codebase, and a lot of the job is reading existing handlers carefully before changing anything. In review, my first question is always which part of that status chain the change can affect.

- Apex trigger handlers, LWCs, flows, batch/scheduled Apex, REST classes
- Mostly pricing: quote line to price record to agreement
- Retrieve, design, review, build, check-only deploy, test

<sub>Also asked as: What did you do in this project? · What were your responsibilities? · What kind of work did you handle as a developer there?</sub>

### What are the main modules in the QTC project and how do they connect?
*Fresher (0–2 yrs) · concept* · `qtc-ov-003`

I'd split it into six areas, and that's also how I walk new people through it. First, accounts and access: every account gets a public group, and team members are synced into it for sharing. Second, opportunity and CPQ quoting: opportunities, SBQQ quotes and quote lines. Third, test and package details: Configurations__c, Insertions__c, AMT_Test_Services__c and package-specific attribute objects hanging off the quote line. Fourth, pricing: AMT_Price_Record__c with its approval status and lifecycle stage, plus snapshots, metal base prices and price precisions. Fifth, price agreements: agreement, agreement group and agreement customer, with gold billing method change and M&A handling. Sixth, integration: batch classes that load prices to SAP through a named credential, and REST classes for inbound data. Pricing issues, AMT_Pricing_Issue__c, link into price records through AMT_Pricing_Issue_Link__c. Pricing and integration are where I plan for the most risk, since a mistake there ends up in SAP.

- Accounts/access, Opportunity + CPQ quote
- Configurations/Insertions under quote line
- Price records, agreements, pricing issues
- SAP load batch + inbound REST

<sub>Also asked as: What modules does your project have? · Give me a high level view of the system · How is your org organized functionally?</sub>

### What are the main custom objects in your project and how are they related?
*Mid (3–6 yrs) · concept* · `qtc-ov-004`

The centre of our data model is the CPQ quote line, SBQQ__QuoteLine__c, with a lookup to the opportunity (AMT_Opportunity__c). Configurations__c and Insertions__c point to the quote line. AMT_Price_Record__c is the priced variant: it looks up to the quote line, to a configuration or insertion, to the customer account, and to a price agreement group and price agreement. AMT_Price_Agreement_Group__c has a type such as Regular, Gold Billing Method Change or M&A. AMT_Price_Agreement_Customer__c is the junction between an agreement group and a child account, with a state of Added or Removed. AMT_Price_Agreement__c is a versioned agreement inside a group. Pricing issues link to price records through the junction AMT_Pricing_Issue_Link__c. We also have AMT_Price_Record_Snapshot__c for history and AMT_Error_Log__c for logging. When I review a change, I check which of these lookups it relies on, because the price record has so many parents that a missing lookup quietly breaks agreements or reporting.

- Quote line -> Configurations/Insertions -> Price records
- PAG + PAC (junction to account) + versioned PA
- Pricing Issue <-> Price Record via Pricing Issue Link
- Snapshot and Error Log objects

<sub>Also asked as: Explain your data model · What objects did you work with? · How are price records related to quote lines and agreements?</sub>

### How does a quote line turn into price records in your project?
*Mid (3–6 yrs) · scenario* · `qtc-ov-005`

In QTC it happens in the quote line after-update trigger, in AMT_QuoteLineTriggerHandler.createPriceVariants. When the quote line status changes, the handler checks the quote type and status, for example Configuration Only moving to With Test Services 1, certain Insertion Only cases, or a Special Turnkey line moving to With BU Pricing. For the lines that qualify, it queries their Configurations__c and Insertions__c in bulk, looks up the multi-site factor from AMT_Multi_Site_Factor_Reference__c, and builds one AMT_Price_Record__c per configuration or per linked insertion (for a linked insertion, one per linked configuration) through a private createPR method, with status Open or Approved. After inserting them it sets Is_Recall_Action__c on the source configurations and insertions, and publishes a Refresh_Price_Records__e platform event so the LWCs on the page refresh. Because this is the point where prices are born, any change to those status conditions gets a test for each quote type before I approve it.

- Entry point: QuoteLineTrigger after update -> createPriceVariants
- Driven by QuoteLine_Status__c and AMT_Quote_Types__c
- One price record per configuration / linked insertion
- Sets Is_Recall_Action__c, publishes Refresh_Price_Records__e

<sub>Also asked as: Explain the flow from quote line to price record · When are price records created? · How did you customize CPQ quote lines to create pricing?</sub>

### How does a price record status change roll up to the quote line and the opportunity?
*Mid (3–6 yrs) · scenario* · `qtc-ov-006`

We do it as a two-step roll up in triggers. When a price record is inserted or its AMT_Variant_Status__c or Sales_Judged__c changes, AMT_PriceRecordTriggerHandler.processQuoteLineFieldUpdates collects the quote line Ids and calls recalculateQuoteLineStatus. That method runs one aggregate query grouped by quote line, status and sales judged. If every price record on the line is in an allowed status, the line becomes Price Complete when any record is Approved, otherwise it takes the closed status in a fixed order: Closed Won, Lost, No Bid, Cancel. Custom labels decide whether the assembly or test status field is set, based on the service. Then, when the quote line status changes, AMT_QuoteLineTriggerHandler.updateOppStatus looks at all lines on the opportunity and sets StageName to Quote, Closed Won, Closed Lost, Closed No Bid or Closed Cancel. When I explain this to the business, I keep it simple: the opportunity only closes once every price under it is decided, and that fixed order is the tie-breaker.

- Price record trigger -> recalculateQuoteLineStatus (aggregate query)
- Approved present -> Price Complete; else closed status order
- Quote line trigger -> updateOppStatus sets Opportunity StageName

<sub>Also asked as: How is quote line status calculated? · What updates the opportunity stage in your project? · Explain the status roll up logic</sub>

### How are triggers structured in your project?
*Fresher (0–2 yrs) · concept* · `qtc-ov-007`

We follow one trigger per object and keep logic in handler classes, and that's a rule I enforce in review. There are 19 triggers, each on a different object, including two platform event triggers. Most trigger bodies are thin: they check a kill switch first, then branch on Trigger.isBefore, isAfter, isInsert, isUpdate and isDelete, and call handler methods with Trigger.new and Trigger.oldMap. The handlers come in two styles. Some use a singleton, like AMT_AccountTriggerHandler, AMT_QuoteHandler and AMT_PricingIssueTriggerHandler, which have a private constructor and getInstance. Others are plain static methods, like AMT_QuoteLineTriggerHandler and AMT_PriceRecordTriggerHandler. There is no shared base handler class; the common pieces are the kill switch class AMT_TriggerMechanismHandler, static recursion flags in AMT_HelperClass, and ExceptionHandler for logging. I don't push a big refactor to a base class just for neatness, but new triggers should follow the same thin-body pattern so the codebase stays predictable.

- One trigger per object, logic in handlers
- Kill switch checked first in most triggers
- Singleton handlers and static handlers both exist
- Shared: AMT_TriggerMechanismHandler, AMT_HelperClass, ExceptionHandler

<sub>Also asked as: Explain your trigger framework · Do you follow one trigger per object? · What trigger pattern do you use?</sub>

### How can you switch off a trigger in your project without a deployment?
*Fresher (0–2 yrs) · code* · `qtc-ov-008`

We use a custom metadata type called Trigger_Control__mdt. Each trigger has a record whose DeveloperName is the trigger name and a checkbox Is_Disabled__c. The first line of most triggers calls AMT_TriggerMechanismHandler.disableTrigger with its own name, and if it returns true the trigger does nothing. So an admin can turn a trigger off, for example during a data load, by changing a metadata record instead of deploying code. Custom metadata queries generally do not count against the SOQL limit, so the check is cheap. One thing to be careful about: the query assigns straight to a single record, so if a trigger has no matching metadata record, it throws a no-rows exception. That's why my checklist for any new trigger includes deploying its Trigger_Control__mdt record in the same package.

- Trigger_Control__mdt, DeveloperName = trigger name, Is_Disabled__c
- Checked at the top of the trigger
- Config change, not a deploy
- Missing record -> query exception

```java
// AMT_TriggerMechanismHandler.cls
public class AMT_TriggerMechanismHandler {
    public static boolean disableTrigger(string triggerName){
        Trigger_Control__mdt tc = [select Is_Disabled__c from Trigger_Control__mdt where DeveloperName=:triggerName];

        return tc.Is_Disabled__c;
    }
}
// QuoteLineTrigger.trigger
//    if(!AMT_TriggerMechanismHandler.disableTrigger('QuoteLineTrigger')){
```

<sub>Also asked as: How do you bypass triggers? · Do you have a trigger kill switch? · How do you disable a trigger in production?</sub>

### Apart from the trigger kill switch, what other bypass controls exist in your code?
*Mid (3–6 yrs) · concept* · `qtc-ov-009`

There are several layers, and I make sure the team knows all of them before a data load. Inside handlers, AMT_Run_Trigger_Setting__mdt works like a feature flag per area: the quote line handler checks the Run_QuoteLine_Trigger record, the price record handler checks Run_ExtensionObject_Trigger, and the agreement customer remove batch checks Run_PAC_Trigger, each through AMT_Active__c. The price record trigger also has a batch skip: when System.isBatch is true it finds the running batch class name and returns early if that name is in the custom label SkipPriceRecordTrigger_BatchJobs, although it still rounds prices first. For the CPQ package itself we call SBQQ.TriggerControl.disable and enable around an internal quote line update. The metal base price helper uses a hierarchy custom setting, AMT_Validation_Control__c, to turn a role check on or off, plus a record-level AMT_Bypass_Validation__c checkbox. The risk with this many switches is someone leaving one off, so after any load I have us confirm each bypass is back to normal.

- AMT_Run_Trigger_Setting__mdt per area (AMT_Active__c)
- Label SkipPriceRecordTrigger_BatchJobs for batch jobs
- SBQQ.TriggerControl for CPQ package triggers
- AMT_Validation_Control__c custom setting

<sub>Also asked as: What other ways do you have to skip trigger logic? · How do you skip logic for a batch job? · Do you have feature flags in Apex?</sub>

### How do you prevent trigger recursion in your project?
*Fresher (0–2 yrs) · code* · `qtc-ov-010`

We use static Boolean flags, because static variables live for the whole transaction. AMT_HelperClass holds firstRun for price records and firstRunPAC for price agreement customers. In the price record trigger the update logic only runs while firstRun is true, and the after-update block sets it to false, so when our own code updates price records again in the same transaction, that logic is skipped. The comment on that line says it was added for a 101 SOQL error. The account team member handler has its own flags, runOnce and isReInsertedATM, so the team members it re-inserts are not processed again. The price agreement customer trigger does the same with firstRunPAC in both after insert and after update. It works, but it is a blunt tool, so in review I check whether a change depends on logic that the flag could skip.

- Static Booleans in AMT_HelperClass: firstRun, firstRunPAC
- Set to false after first after-update pass
- ATM handler: runOnce, isReInsertedATM

```java
// AMT_HelperClass.cls
//AMT_HelperClass- Class holds the boolean variables that controls the trigger recursion on PA,PAC
public class AMT_HelperClass {
     public static boolean firstRun = true;
     public static boolean firstRunPAC = true;
     public static boolean reRunSnapshot = false;
     public static boolean restrictRevalidate = false;

}
```

<sub>Also asked as: How do you stop a trigger from running twice? · What is your recursion control? · How do you avoid infinite loops in triggers?</sub>

### What is the risk of the static Boolean recursion flags used in your triggers?
*Senior (7–10 yrs) · troubleshooting* · `qtc-ov-011`

The flag stops recursion, but it also stops legitimate work. In AMT_PriceRecordTrigger, AMT_HelperClass.firstRun is set to false in the first after-update pass and never reset. Salesforce runs triggers in chunks of 200, so if one DML updates more than 200 price records, the second chunk sees firstRun as false and skips all the update logic, like CPU price calculation, PDL validation and snapshots. The same is true for any later price record update in the same transaction, for example from a flow. firstRunPAC on the agreement customer trigger has the same shape. It's high on my fix list because it fails silently on pricing data. The fix I'd go with is to track a static Set of record Ids already processed, or compare old and new values, so each record is handled once instead of the whole transaction being switched off. I'd start with the price record trigger and add a test that updates more than 200 records.

- Flag flips once per transaction, never reset
- Chunks after the first 200 skip the logic
- Better: static Set<Id> of processed records or field-change checks

<sub>Also asked as: Is a static boolean a good way to stop recursion? · Any problems with firstRun style flags? · Why can a run once flag skip records?</sub>

### Walk me through the price record trigger.
*Mid (3–6 yrs) · concept* · `qtc-ov-012`

AMT_PriceRecordTrigger runs on AMT_Price_Record__c for before insert, before update, after insert, after update and before delete. Before insert, AMT_PriceRecordTriggerHandler assigns currency and opportunity from the quote line, sets the price agreement group from the customer, calculates CPU price, runs the PDL rule book through AMT_PDLRuleBookProcessor, rounds prices and copies PDL codes from the pricing issue. After insert, it creates pricing issue links and recalculates the quote line status. Before update, guarded by firstRun, it recalculates CPU and BU price, stamps previous stages for expire and activate, marks records Amended when selected customers change, runs PDL validation, clears revision fields when Activated in SAP, and rounds prices. After update it creates snapshots, recalculates the quote line, and re-evaluates ABM and billing flags. Before delete it finds affected pricing issues and re-evaluates them in a future method. This is the busiest trigger we have, so any change to it gets my closest review.

- 5 events: before/after insert, before/after update, before delete
- Before: currency, CPU/BU price, PDL, rounding, stages
- After: pricing issue links, quote line roll up, snapshots, ABM/billing
- Delete: @future re-evaluation of pricing issues

<sub>Also asked as: What does AMT_PriceRecordTrigger do? · Explain the price record trigger events · What logic runs when a price record is saved?</sub>

### Walk me through the quote line trigger.
*Mid (3–6 yrs) · concept* · `qtc-ov-013`

QuoteLineTrigger runs on SBQQ__QuoteLine__c for before insert, before update, after insert and after update, and all logic is in AMT_QuoteLineTriggerHandler. Before insert, it finds the package-specific attribute object name from the AMT_Package_Group_Service__mdt metadata and stores it on the line, sets AMT_Quote_Types__c from the service group, like Configuration Only, Insertion Only or Individual, and inherits application, lead frame, plant and device from the opportunity's pricing issue, with an error if the divisions do not match. Before update, it stamps the price complete date and clears the device name when the price level becomes PDL. After insert, it creates the package specific record dynamically using the stored object name. After update, it creates price records, syncs status across the lines of a single price turnkey bundle, and updates the opportunity stage. Because it sits on a CPQ managed object, I always ask in review how a change behaves alongside the package's own triggers.

- Before insert: package object name, quote type, pricing issue inheritance
- Before update: price complete date, PDL device clear
- After insert: dynamic package-specific record
- After update: price variants, bundle status sync, opportunity stage

<sub>Also asked as: What does QuoteLineTrigger do? · How did you extend the CPQ quote line with a trigger? · Explain the SBQQ quote line trigger logic</sub>

### How is Salesforce CPQ extended in your project?
*Mid (3–6 yrs) · design* · `qtc-ov-014`

In QTC our approach is to treat the CPQ objects as the base and keep most of the business logic custom. The quote line, SBQQ__QuoteLine__c, carries many custom AMT fields such as statuses, package group, service and quote type, and the real prices are not stored on the line itself but on AMT_Price_Record__c records under it. We use the CPQ bundle field SBQQ__RequiredBy__c to find the parent line, so for single price turnkey bundles a status change on a child is pushed to the parent and its other children. When we update quote lines from our own code, we wrap it with SBQQ.TriggerControl.disable and enable, so the package triggers do not fire for that internal update. On the quote, SBQQ__Quote__c, our trigger creates SBQQ__Quote__Share records for the account's public group. The trade-off is that we get the flexibility Amkor's pricing needs, but we own more code, so I watch CPQ package upgrades closely.

- Custom AMT fields on SBQQ__QuoteLine__c
- Prices live on AMT_Price_Record__c, not the line
- SBQQ__RequiredBy__c for bundle parent/child
- SBQQ.TriggerControl around internal updates; quote sharing

<sub>Also asked as: How did you customize CPQ? · What customizations did you do on SBQQ objects? · Did you use CPQ price rules or custom code?</sub>

### Why do you call SBQQ.TriggerControl.disable in your quote line handler?
*Senior (7–10 yrs) · code* · `qtc-ov-015`

SBQQ.TriggerControl is the CPQ package's API to pause its own triggers for the current transaction. In AMT_QuoteLineTriggerHandler.updateRelatedQuoteLineStatus, when a single price turnkey child line reaches an allowed status like Price Complete or a closed status, we copy that status to the parent line and to its non-turnkey children. That is an internal sync, so the code disables the CPQ triggers, updates the lines, and enables them again. The same pattern is in RecalculateQuoteLineStatusBatch and AMT_AssignQuoteLineHelper. The gap I'd fix first is that the enable call is not in a finally block, so if the update throws, CPQ triggers stay disabled for the rest of that transaction. A try/finally would make it safe, and it's a small change across three places, so the risk-to-effort ratio is very good. Going forward, I'd make try/finally around TriggerControl a code review rule.

- Pauses CPQ package triggers for the transaction
- Used for internal bundle status sync
- Improvement: re-enable in finally

```java
// AMT_QuoteLineTriggerHandler.cls
    if (!quoteLinesToUpdate.isEmpty()) {
        SBQQ.TriggerControl.disable();
        update quoteLinesToUpdate;
         SBQQ.TriggerControl.enable();
    }
```

<sub>Also asked as: What is SBQQ.TriggerControl used for? · How do you stop CPQ package triggers during an update? · How do you avoid CPQ recalculation on internal updates?</sub>

### How is record sharing designed in your project?
*Senior (7–10 yrs) · design* · `qtc-ov-016`

Sharing is built around one public group per account. On account insert, AMT_AccountTriggerHandler creates a group named Account_<AccountId>_Internal using generatePublicGroupName. Then several triggers share their records to that group with Apex managed sharing: AMT_QuoteHandler creates SBQQ__Quote__Share, AMT_PricingIssueTriggerHandler creates AMT_Pricing_Issue__Share, the agreement customer handler adds or deletes AMT_Price_Agreement_Group__Share when the customer state is Added or Removed, and the metal base price helper creates AMT_Metal_Base_Price__Share. Group membership is driven by account team members with PA_PI_Access__c, and the GroupMember work is done in a Queueable, AMT_ManageGroupMemberQueueableClass, which keeps that setup object DML in its own transaction. So adding a person to the account team with PA_PI_Access__c gives them access to all related pricing records. I like this design because it's easy to explain to the client: access follows the account team. The thing I check in review is that any new pricing object follows the same group pattern.

- Public group per account: Account_<Id>_Internal
- __Share rows for Quote, Pricing Issue, PAG, Metal Base Price
- Team member PA_PI_Access__c -> group membership via Queueable

<sub>Also asked as: How do you share records with the account team? · Explain your sharing model · How did you implement Apex managed sharing?</sub>

### What does the account trigger do in your project?
*Fresher (0–2 yrs) · concept* · `qtc-ov-017`

AMT_AccountTrigger runs on before delete, after insert and after update. After insert, it creates the account's public group and, for prospect accounts, adds the owner to that group through a Queueable. After update, it handles a change of AMT_Gold_Billing_Method__c: one method processes agreement customers that are under a Gold Billing Method Change agreement group, and another copies the new billing method to the related agreement groups and agreements. Before delete, handleBeforeDelete allows deletion only for Prospect accounts in Draft status, and only when the user's AMT_Business_Role__c is Sales Rep or SalesOps; otherwise it adds an error. It gets the record type Id with getRecordTypeInfosByDeveloperName instead of a hard-coded Id, which is the standard I expect across the team.

- After insert: public group + owner (Queueable)
- After update: gold billing method change
- Before delete: only Draft prospects by Sales Rep/SalesOps

<sub>Also asked as: Explain AMT_AccountTrigger · What logic runs on account save? · What happens when an account is created?</sub>

### What does the account team member trigger do?
*Mid (3–6 yrs) · concept* · `qtc-ov-018`

AMT_AccountTeamMemberTrigger runs before delete, after insert and after update. Its handler is without sharing and a singleton. When a member has PA_PI_Access__c and is not yet synced, or loses that access, the handler queues AMT_ManageGroupMemberQueueableClass to add or remove them from the account's public group, and it checks the Queueable limit before enqueueing. Before delete, it removes the user's group membership. There is also updateAccountManagerAsAccountOwner from story QTC-754: when a member with role Account Manager is inserted, the account owner is changed to that user, and the handler then re-creates the account's team members with their access levels. It sets isReInsertedATM so those re-inserted rows do not run the group logic again, and the trigger body is wrapped in try/catch with ExceptionHandler.log. Since this handler controls who sees pricing, I treat changes here as access changes and have them tested with real user profiles, not just as admin.

- Group membership sync via Queueable
- Account Manager role becomes account owner (QTC-754)
- isReInsertedATM / runOnce prevent reprocessing

<sub>Also asked as: Explain AMT_AccountTeamMemberTrigger · How do you make the account manager the owner? · What happens when you add someone to the account team?</sub>

### What does the opportunity trigger do in your project?
*Fresher (0–2 yrs) · concept* · `qtc-ov-019`

AMT_OpportunityTrigger only runs before insert and calls two methods. preventOpportunityCreation blocks users who are not on the account team from creating an opportunity on that account. System admins, checked by a profile name stored in a custom label, and users with business role SalesOps skip the check, and the owner of a Prospect account is also allowed. For everyone else it queries AccountTeamMember for the accounts in bulk and adds an error if the current user is not a member. setCloneSource handles cloning: if opp.isClone() is true, it stores getCloneSourceId() in Clone_From_Opportunity__c and resets StageName to Discovery. It's a small trigger, but the bulk query is the pattern I want everywhere.

- Before insert only
- Must be on account team (admins, SalesOps, prospect owner exempt)
- Clone: stores source Id, stage Discovery

<sub>Also asked as: Explain AMT_OpportunityTrigger · How do you restrict who can create opportunities? · What validation runs on opportunity insert?</sub>

### What does the price agreement trigger handle?
*Mid (3–6 yrs) · concept* · `qtc-ov-020`

AMT_PriceAgreementTrigger runs on AMT_Price_Agreement__c for before and after insert and update. Before insert, restrictPAInsertUnderGoldBilling throws an error if customers of the group are currently in a Gold Billing Method Change group. After insert, updatePAonPAG stores the new agreement on its group as the current one. Before update, priceAgreementNameDupcheck blocks a rename if another agreement in the org already has that name, but it allows a newer version to keep the same name as the previous version in the same group, and updateActivatedDate stamps AMT_Activated_Time__c when status becomes Active. After update, nonSAPgoldBillingChangeCheck handles a gold billing change between Market and Special when the agreement moves to Submitted for Loading, through AMT_GoldBillingChangeHelper. The gold billing rules are where I plan testing most carefully, because they block or change agreements that are on their way to SAP.

- Before insert: block under gold billing change
- After insert: set current PA on PAG
- Before update: duplicate name check across versions, activated time
- After update: Market/Special gold billing change

<sub>Also asked as: Explain AMT_PriceAgreementTrigger · How do you validate price agreement names? · What logic runs on price agreement update?</sub>

### What does the price agreement customer trigger do?
*Mid (3–6 yrs) · concept* · `qtc-ov-021`

AMT_Price_Agreement_Customer__c links a child account to a price agreement group, with a state of Added or Removed. Before insert, the trigger validates gold billing: if the group is a Gold Billing Method Change group, the customer must already be in an active Regular agreement, and it stamps Regular_Price_Agreement_Customer__c. Before update, it stops removing a customer while a gold base change is in progress. After insert and update, guarded by AMT_HelperClass.firstRunPAC, it copies billing method, metal type and currency onto the group (and billing method onto the agreement), adds or deletes the group share for the account's public group, and on update recalculates AMT_Is_Private__c on the group. Removing a child customer is asynchronous: a record-triggered flow publishes Remove_Child_Event__e, and that event's trigger starts AMT_PriceAgreementCustomer_Remove_Batch. I like that split, because the heavy removal work doesn't sit in the user's save, and that's the pattern I'd point the team to for similar cases.

- Gold billing validations before insert/update
- After: PAG billing/currency, sharing, private flag
- Remove child: flow -> platform event -> batch

<sub>Also asked as: Explain AMT_PriceAgreementCustomer trigger · How do you add or remove customers from a price agreement? · What is the PAC trigger for?</sub>

### How are platform events used in your project?
*Mid (3–6 yrs) · design* · `qtc-ov-022`

We use three, each for a clear reason. Refresh_Price_Records__e is a UI refresh signal: Apex like createPriceVariants and several flows publish it, and LWCs such as amt_RelatedPriceRecords subscribe through lightning/empApi on /event/Refresh_Price_Records__e and reload their data. Remove_Child_Event__e is published by a record-triggered flow on the agreement customer, and AMT_Remove_Child_Event_Trigger collects the PAC Ids and starts AMT_PriceAgreementCustomer_Remove_Batch, so the heavy price record work runs in its own batch. M_A_Event__e is published by an after-save flow on Account, and the AMT_MandAProcessor trigger moves price records to the new group for mergers and acquisitions. Both event triggers have the same Trigger_Control__mdt kill switch as the object triggers. My guideline for the team is to reach for an event when work should be decoupled from the user's save, not as a default, because events are harder to trace when something goes wrong.

- Refresh_Price_Records__e -> LWCs via empApi
- Remove_Child_Event__e -> remove batch
- M_A_Event__e -> M&A processing
- Event triggers use the same kill switch

<sub>Also asked as: Do you use platform events? · How do LWCs refresh after Apex changes? · Explain event driven parts of your project</sub>

### Explain the M&A platform event trigger and what you would change in it.
*Senior (7–10 yrs) · design* · `qtc-ov-023`

AMT_MandAProcessor is an after insert trigger on M_A_Event__e. It collects AMT_Child_Account_Id__c from the events, uses AMT_AccountParentChangeController to find agreement customers in M&A type groups and decide which groups to update and which customers to mark Removed, then starts AMT_UpdatePROnMandABatch with scope 2000 to repoint price records to the new group and its Submitted for Loading agreement, and finally updates the groups. I'd fix the data risk first: the batch execute uses newPAG[0] for every price record, so if one event batch covers several groups, every record goes to the first group. That can put prices under the wrong customer group, so it comes before anything cosmetic. I'd map records to their own target group. Second, the logic sits in the trigger body instead of a handler, which breaks our own handler pattern and makes it harder to test, so I'd move it to a handler in the same story while the area is open.

- Event trigger -> controller -> batch (scope 2000)
- Logic in trigger body, not a handler
- Batch uses newPAG[0] for all records

<sub>Also asked as: What does AMT_MandAProcessor do? · How do you handle account parent change for agreements? · Review the M&A trigger design</sub>

### What do the pricing issue and pricing issue link triggers do?
*Mid (3–6 yrs) · concept* · `qtc-ov-024`

AMT_PricingIssueTrigger runs after insert and after update. After insert it shares the pricing issue with the account's public group. After update, if the resolution path or approval status changes, it calls AMT_UpdateABMNBilling.evaluateAndSetABMBilling to recalculate whether the issue goes into the ABM report and the billing report, and when an issue is Closed it recalculates AMT_Not_Loaded_PIs__c on linked price records. AMT_PricingIssueLinkTrigger is on the junction AMT_Pricing_Issue_Link__c. On insert it increases the price record's not-loaded count and sets AMT_Is_Loaded_to_SAP__c to false, before delete it decreases the count, and on insert and delete it re-evaluates the ABM and billing flags. Price record trigger changes also feed into the same evaluation. Because three triggers feed one evaluation, I ask the team to test ABM and billing changes from each entry point, not just the one the story mentions.

- PI: sharing, ABM/billing re-evaluation, not-loaded count on close
- PIL: counter up/down, Is_Loaded_to_SAP__c false
- Shared logic: AMT_UpdateABMNBilling

<sub>Also asked as: Explain AMT_PricingIssueTrigger · How are pricing issues linked to price records? · What is ABM and billing evaluation in your project?</sub>

### What do the configuration and insertion triggers do?
*Fresher (0–2 yrs) · concept* · `qtc-ov-025`

Both keep price records in step with the test details on the quote line. AMT_ConfigurationTrigger, on Configurations__c, calls AMT_ConfigurationTriggerHandler.updateOnPriceRecord after update, which copies equipment fields like tester and handler model, owner, temperature and multi-site factor onto the related price record. AMT_InsertionTrigger, on Insertions__c, converts the good and reject test codes to upper case before insert and update, clears AMT_Linking_Configuration__c when the number of sites in parallel changes, and after update copies insertion values onto the related price records through updateOnPriceRecord. The configuration trigger declares before insert but has no logic for it. That's harmless, but in review I'd ask for unused events to be removed so the trigger says only what it does.

- Configuration after update -> sync to price record
- Insertion before: uppercase codes, clear linking on site change
- Insertion after update -> sync to price records

<sub>Also asked as: Explain AMT_ConfigurationTrigger and AMT_InsertionTrigger · How do test details sync to price records? · What happens when a configuration is edited?</sub>

### How do you stop users from adding or deleting files on a price record at certain statuses?
*Fresher (0–2 yrs) · concept* · `qtc-ov-026`

We use two triggers. ContentVersionTrigger runs before insert. It checks FirstPublishLocationId, and if the file is being added to an AMT_Price_Record__c, it looks up the quote line status and adds an error when the status is in a restricted list. ContentDocumentTrigger runs before delete. It finds the ContentDocumentLink rows, picks the ones linked to price records, and throws an exception if the quote line status is restricted. The restricted statuses come from the custom label Restrict_Attachment_Statuses, so the list can change without code. The one fix I'd queue is that the delete check finds price records by the Id prefix a1t, which is org specific; using getSObjectType like the insert handler does would be safer. It's a small, low-effort change, and hard-coded prefixes are something I flag in every review.

- ContentVersion before insert: FirstPublishLocationId
- ContentDocument before delete: ContentDocumentLink
- Statuses in label Restrict_Attachment_Statuses
- Improve: avoid hard-coded Id prefix

<sub>Also asked as: Explain ContentVersionTrigger and ContentDocumentTrigger · How do you restrict attachments in Salesforce? · How to block file upload based on status?</sub>

### What do the metal base price and price precision triggers do?
*Fresher (0–2 yrs) · concept* · `qtc-ov-027`

amt_MBP_Trigger is on AMT_Metal_Base_Price__c. Before insert and update it sets currency and blocks duplicates by building a key from metal, base type, currency for Market, and group for Transactional or Special, and comparing it with Active and Draft records. It also checks the user's business role against custom labels for which base types they may create, when the AMT_Validation_Control__c setting is on. After update, when a record goes from Submitted to Active, it sets the previous record Inactive with an expiration date one day before. After insert it shares the record with the public groups of the group's customers. PricePrecisionTrigger on Price_Precisions__c blocks a second precision record for the same group, service and service group. Those precision records are what roundPrices uses on price records. These look like small reference-data triggers, but they directly change final prices, so I give them the same test standard as the price record trigger.

- MBP: duplicate key check, role check, expire previous, sharing
- Price precision: one per PAG + service + service group
- Precision drives rounding on price records

<sub>Also asked as: Explain amt_MBP_Trigger · How do you prevent duplicate metal base prices? · What is PricePrecisionTrigger?</sub>

### How is price history or snapshot captured in your project?
*Mid (3–6 yrs) · concept* · `qtc-ov-028`

In the price record after-update trigger, AMT_PriceRecordSnapshotClass.handleSnapshotLogic compares old and new values for the fields in the Snapshots_Fieldset field set. If any changed, it creates an AMT_Price_Record_Snapshot__c by copying every field that exists on both objects using describe, with the old values, and it names it Snapshot-<price record name>-v<counter>. The field set means business can change which fields trigger a snapshot without code. Then AMT_PriceRecordSnapshotTrigger, before insert on the snapshot, increases AMT_Snapshot_Counter__c on the parent price records. The bug I'd prioritise is that the hasfieldChanged flag in the class is declared before the loop and never reset, so once one record in a batch changes, every following record also gets a snapshot. It's a one-line fix with a bulk test, and it matters because people rely on snapshots as the audit trail of price changes.

- Field set Snapshots_Fieldset decides what triggers a snapshot
- Copies matching fields via describe
- Counter on price record
- Bug: hasfieldChanged not reset per record

<sub>Also asked as: How do you track price changes? · What is the price record snapshot? · How do you audit price record updates?</sub>

### How do you handle bulkification in your trigger handlers?
*Fresher (0–2 yrs) · concept* · `qtc-ov-029`

Our handlers follow the usual pattern: loop once to collect Ids into Sets, run one query with IN, put results in a Map, loop again to apply logic, and do one DML at the end. For example, createPricingIssueLink collects quote line Ids, queries the lines and existing links once, and inserts all new AMT_Pricing_Issue_Link__c rows in one statement. recalculateQuoteLineStatus uses a single aggregate query grouped by quote line and status instead of counting records line by line. Changed-only checks against Trigger.oldMap keep the work small, and recalculateQuoteLineStatus only returns lines whose values really changed. RULES.md for the repo also says every new trigger method must work for a 200 record batch and that Ids do not exist in before insert. In code review, a query or DML inside a loop is an automatic change request from me.

- Collect Ids -> one IN query -> Map -> one DML
- Aggregate queries for counts
- Only process changed records
- Ids not available in before insert

<sub>Also asked as: How do you make triggers bulk safe? · How do you avoid SOQL in loops? · How do you handle 200 records in a trigger?</sub>

### How is error handling done in your triggers and what are its weaknesses?
*Senior (7–10 yrs) · design* · `qtc-ov-030`

We have an ExceptionHandler class, without sharing, that writes an AMT_Error_Log__c record with the exception type, message, stack trace and source class, and an overload that logs failed SaveResults. Triggers like the price record update block, the quote line after block and the account team member trigger wrap their calls in try/catch and call ExceptionHandler.log. The weaknesses are visible in the code. Some handlers swallow errors with only System.debug, like createPriceVariants and updateOppStatus, so a failure is silent to the user. Some, like handlePriceRecordDelete, log and then rethrow; the rethrow rolls back the whole transaction, including the log insert, so that log is lost. My first priority would be the silent catches, because a user never knows their prices weren't created. Then I'd publish logs through a platform event set to publish immediately, so they survive a rollback, and make that the team standard.

- ExceptionHandler -> AMT_Error_Log__c
- Some catches only System.debug (silent)
- Log then rethrow -> log rolled back
- Improve: publish-immediately platform event for logs

<sub>Also asked as: How do you log errors in Apex? · What is your exception handling framework? · What happens when a trigger fails in your project?</sub>

### A user says the price on a price record is wrong. How would you debug it in this project?
*Senior (7–10 yrs) · scenario* · `qtc-ov-031`

I'd follow the real code path, and that's how I coach the team to debug too. First, check the kill switches: the Trigger_Control__mdt record for AMT_PriceRecordTrigger and the Run_ExtensionObject_Trigger setting, because if either is off no calculation runs. Then look at updateCpuPrice in AMT_PriceRecordTriggerHandler: CPU price is hourly price divided by 3600, the hourly price comes from the configuration's price record, and BU price uses test time and index time with a different formula per service group: multi-site factor for Singulated Test, sites in parallel for SLT, and gross die per wafer plus changeover time for Probe Insertion. Next, roundPrices applies Price_Precisions__c for the agreement group, so a wrong precision record changes the value. I'd also check the before-save record-triggered flow on price records, and the snapshot records to see when the value changed. Finally, a debug log and AMT_Error_Log__c, since several catches log or swallow errors. Before touching code, I'd confirm with the user whether the input or the formula is wrong.

- Check Trigger_Control__mdt and Run_ExtensionObject_Trigger
- updateCpuPrice formulas by service group
- roundPrices + Price_Precisions__c
- Before-save flow, snapshots, debug log, AMT_Error_Log__c

<sub>Also asked as: Price to customer is wrong, how do you troubleshoot? · BU price is not calculating correctly, where do you look? · How would you debug a wrong CPQ quote line price in your project?</sub>

### A quote line was submitted but no price records were created. How would you investigate?
*Mid (3–6 yrs) · troubleshooting* · `qtc-ov-032`

createPriceVariants only runs on the after update of the quote line and only when QuoteLine_Status__c actually changed, so first I'd confirm the status change happened in that save. Then check the conditions: for example Configuration Only needs With Test Services 1, Insertion Only depends on AMT_Is_Auto_Approval__c and the single price turnkey flag, and Special Turnkey needs With BU Pricing and not escalated. Next, check the Run_QuoteLine_Trigger metadata record and Trigger_Control__mdt for QuoteLineTrigger. Insertions that have a linking configuration are skipped when Is_Recall_Action__c is already true, and that linked configuration name must exist. The method catches exceptions with only System.debug, so I'd reproduce it with a debug log to see the actual error. Once it's found, I'd also raise that silent catch as its own fix, because the next person will hit the same blind spot.

- Runs only when QuoteLine_Status__c changes
- Status/quote type conditions
- Run_QuoteLine_Trigger and kill switch
- Is_Recall_Action__c skip; errors only in debug log

<sub>Also asked as: Price records are missing after submitting a quote line · Why would createPriceVariants not create records? · Price variants not generated, how to debug?</sub>

### You need to run a bulk batch update on price records without firing all the trigger logic. How would you do it here?
*Senior (7–10 yrs) · scenario* · `qtc-ov-033`

We already have a mechanism for it in QTC. In AMT_PriceRecordTrigger, when System.isBatch is true, the trigger reads the running batch class name and returns early if it is listed in the custom label SkipPriceRecordTrigger_BatchJobs, so I'd add the batch class name to that label. Note that before update it still runs roundPrices before returning, so precision is still applied. For a one-off load I could also set Is_Disabled__c on the Trigger_Control__mdt record, but that switches it off for all users, so I'd only do it in a window and with approval. One weakness: the trigger finds the batch with a query on AsyncApexJob where status is Processing with LIMIT 1, which can return a different running batch, not necessarily the current one. A static flag set by the batch would be more reliable, and I'd make that the fix before we rely on the label for anything important.

- Add batch class to label SkipPriceRecordTrigger_BatchJobs
- roundPrices still runs
- Trigger_Control__mdt is org-wide
- AsyncApexJob LIMIT 1 may pick another batch

<sub>Also asked as: How do you skip triggers for a data fix batch? · Bypass price record trigger for a batch job · Data load is slow because of triggers, what do you do?</sub>

### What is your development process in this project?
*Fresher (0–2 yrs) · concept* · `qtc-ov-034`

Our repo has a RULES.md that is binding for every change, and I hold everyone to it, including myself. The order is fixed: retrieve, design, review, build, test, review. First we retrieve the components we will touch from the connected dev org into a scratch project and diff them against the repo, because the local folder is not treated as the source of truth. Then we write a design, and it gets reviewed from four angles: confirm, refute, implementation against existing code, and blast radius. All four must agree before the build is approved. After building, we run a check-only deploy and real Apex tests, then test from three angles: the requirement, edge cases, and regression. Code Analyzer runs only on the changed lines. Only then is the change committed, adding the changed files one by one, never with git add dot. The design review step is the one I protect most, because it's where we catch side effects in the pricing triggers cheaply.

- Retrieve and diff before edit
- Design reviewed: confirm, refute, implementation, blast radius
- Check-only deploy + real tests
- Requirement, edge, regression testing; then commit only the change

<sub>Also asked as: How do you work on a user story? · What steps do you follow before deploying? · Explain your team's development workflow</sub>

### How do you deploy and validate changes in this project?
*Fresher (0–2 yrs) · concept* · `qtc-ov-035`

All development goes to one dev sandbox, and we always pass the org alias explicitly. Read-only commands and check-only deploys there are pre-approved, but any real deploy or data change needs confirmation, and UAT is read-only for us. For metadata we validate with a dry run, a check-only deploy, of exactly the files in the change, and show the real output. For Apex we run the relevant test classes and report the actual pass or fail. Branches are always created from release, one story per branch, and we never touch release, UAT or main branches. When handing over, we list which files are the change and which files in git status are not, and files are added one by one, never with git add dot. As a guardrail, I don't accept 'it deployed' in a handover without the real output attached.

- Explicit org alias; real deploys need confirmation
- Check-only deploy of exactly the changed files
- Branch from release, one story per branch
- Explicit file split, no git add .

<sub>Also asked as: How do you do check-only deployments? · What are your deployment rules? · How do you avoid shipping extra files?</sub>

### How do you test triggers and handlers in this project?
*Mid (3–6 yrs) · concept* · `qtc-ov-036`

We have a TestDataFactory class with builders for accounts, team members, opportunities, agreement groups, customers, agreements, quotes and quote lines; a handful of test classes use it, and most others build their records inline, usually in @testSetup, so tests create their own data. The rules say to assert on behaviour, not just coverage, cover every branch with valid and invalid input, and include a bulk case of at least 20 records. For validations that use addError, like the duplicate checks, we use Database.insert with allOrNone false and check each SaveResult, because an all-or-none insert only reports the first error. Tests must not rely on org data. There is also a known trap written down: a SeeAllData test that returns early when data is missing passes silently, so we assert the data exists instead. In review I read the asserts before the code, and I'd steer new tests toward TestDataFactory so the setup stays consistent.

- TestDataFactory in some classes, inline data in most; @testSetup
- Assert behaviour; bulk >= 20 records
- Database.insert(list,false) for addError
- No reliance on org data

<sub>Also asked as: How do you write test classes for triggers? · What is your test strategy? · How do you test addError validations?</sub>

### What was the biggest challenge in this project?
*Mid (3–6 yrs) · scenario* · `qtc-ov-037`

The biggest challenge is how much logic runs on the price record save. AMT_PriceRecordTrigger calls nine handler methods in before update alone, added over time by different developers, and there are also before-save record-triggered flows on the same object. So a single field change can recalculate prices, change the lifecycle stage, create snapshots, update the quote line and then the opportunity. Governor limits are a real concern: the code has a comment that the firstRun flag was added for a 101 SOQL error. To work safely in that, I trace the exact path a record takes before changing anything, retrieve the current version from the org, and check the blast radius, meaning every flow, trigger and batch that touches the same fields. I ask the same of everyone on the team, and when I explain a delay to stakeholders, this coupling is usually the honest reason.

- Many handler methods + before-save flows on price record
- One save cascades to quote line and opportunity
- Comment shows a 101 SOQL error was hit
- Approach: trace path, retrieve, check blast radius

<sub>Also asked as: What was the most difficult part? · Tell me about a challenging problem you faced · What made this codebase hard to work with?</sub>

### If you could improve the trigger layer in this project, what would you change?
*Senior (7–10 yrs) · design* · `qtc-ov-038`

I'd keep the one-trigger-per-object rule and tighten a few things I can point to, in risk order. First, the kill switch query throws if a trigger has no metadata record, so it should default to enabled. Second, I'd replace the static run-once Booleans with processed-Id sets, because those can silently skip pricing logic. Third, two triggers, AMT_PricingIssueLinkTrigger and PricePrecisionTrigger, do not check Trigger_Control__mdt, so they cannot be switched off like the others; that's low effort. Fourth, AMT_PricingIssueLinkTrigger has an isUpdate branch that never runs because after update is not in its event list, so we should either add the event or delete the dead code. Then the structural items: some triggers have logic in the body, like AMT_MandAProcessor and AMT_PriceRecordSnapshotTrigger, instead of a handler, and I'd introduce one small base handler so the singleton and static styles become one pattern. Each of these would be its own story with tests.

- Two triggers skip the kill switch
- Kill switch fails on missing record
- Logic in trigger bodies
- Dead isUpdate branch
- Processed-Id sets; one base handler

<sub>Also asked as: What technical debt do you see in your triggers? · How would you refactor your trigger framework? · What are the weaknesses of your current trigger design?</sub>

### Have you seen any bulkification or governor limit issues in the existing code?
*Senior (7–10 yrs) · troubleshooting* · `qtc-ov-039`

Yes, a few that are visible in the code. In handlePACPriceAgreementShare, for every customer whose state is Removed, the code queries and deletes the share records inside the loop, so a large update could hit the SOQL or DML limit. In createPriceVariants, the AMT_Test_Services__c query for all qualifying quote lines has LIMIT 1, so in a bulk update only one line gets lead ball count data. In AMT_ConfigurationTriggerHandler and AMT_InsertionTriggerHandler, the price record map is keyed by quote line, so if one line has several price records only the last one is kept and synced. I'd rank the two data issues first, the LIMIT 1 and the map key, because they give wrong data without any error, and the loop query second, since it fails loudly. When we touch one of these areas, I raise it as a finding with the file and line, and fix it as a separate story.

- SOQL + DML in loop for Removed PAC shares
- Test services query LIMIT 1 across all lines
- Map keyed by quote line loses records
- Raise as separate stories

<sub>Also asked as: Did you find SOQL or DML inside loops? · What bulk issues exist in your project code? · Any code that would fail with 200 records?</sub>

### Your project has both Apex triggers and record-triggered flows on the same objects. How do they work together?
*Senior (7–10 yrs) · concept* · `qtc-ov-040`

About 72 of our flows are record-triggered (66 before- or after-save, 6 before-delete), and some run on the same objects as our triggers. For example, Quote_Line_Trigger_Before_Create is a before-save flow on SBQQ__QuoteLine__c, and Price_Record_Record_Trigger_Before_Insert_Before_Update is a before-save flow on AMT_Price_Record__c. In the order of execution, before-save flows run before the Apex before triggers, and after-save flows run after the Apex after triggers. So a field set by a before-save flow is already visible to our before-update handler, but a field our trigger sets is not seen by that flow in the same save. When I debug or design, I list all automation on the object, flows and triggers together, because a change in one can silently change the input of the other. On the team, I'd want new field logic to go in one place per object, and the design doc has to say which.

- 72 record-triggered flows (66 save, 6 delete)
- Before-save flows run before before triggers
- After-save flows run after after triggers
- Always review flows + triggers together

<sub>Also asked as: How do flows and triggers interact on one object? · What is the order of execution between before-save flows and triggers? · Why use both flows and Apex triggers?</sub>

## QTC project — CPQ quotes and quote lines

### How did you extend Salesforce CPQ in your QTC project?
*Mid (3–6 yrs) · concept* · `qtc-cpq-001`

In our QTC project for Amkor, we use CPQ for the base objects, SBQQ__Quote__c and SBQQ__QuoteLine__c, and keep most of the business logic custom. The quote line carries many AMT fields such as AMT_Service__c, AMT_Package_Group__c, AMT_Assembly_Status__c and AMT_Test_Status__c. Around each quote line we have child objects: Configurations__c and Insertions__c for test services, plus the package attribute record and wire, die and substrate descriptions. QuoteLineTrigger with AMT_QuoteLineTriggerHandler sets the quote type, creates the package attribute record, and when the line moves to certain statuses it creates AMT_Price_Record__c price variants. Screen flows handle submit, assign and recall, and where we update quote lines only for status, we switch off CPQ's own package triggers with SBQQ.TriggerControl. The trade-off I keep in mind is that CPQ's pricing engine isn't doing the heavy lifting here, our code is, so our own tests and reviews carry more of the risk.

- Custom AMT_ fields on SBQQ__QuoteLine__c drive the process
- Child objects: Configurations__c, Insertions__c, wire/die/substrate
- Pricing lives on AMT_Price_Record__c, created from the quote line
- Screen flows for submit/assign/recall; SBQQ.TriggerControl around status updates

<sub>Also asked as: How did you customize CPQ quote lines? · What customizations did you do on the SBQQ objects? · Tell me about the CPQ work in your project · how was cpq extended in your org</sub>

### Which CPQ (SBQQ) objects and fields does your QTC project actually use?
*Fresher (0–2 yrs) · concept* · `qtc-cpq-002`

SBQQ is the namespace of the Salesforce CPQ managed package, so every CPQ object and field starts with SBQQ__. In our QTC project the main ones are SBQQ__Quote__c and SBQQ__QuoteLine__c, plus SBQQ__Product__c on the line. On the quote we set SBQQ__Account__c, SBQQ__Opportunity2__c, SBQQ__Primary__c, SBQQ__Status__c and the price book fields. On the line we use SBQQ__Quote__c, SBQQ__Product__c, SBQQ__RequiredBy__c for bundle parent and child lines, SBQQ__Bundle__c and SBQQ__Bundled__c in a single-price validation flow, and SBQQ__ListPrice__c, which a flow updates for single price turnkey lines. We also call the package Apex API SBQQ.TriggerControl. Salesforce CPQ is end-of-sale now, still supported for existing customers like this org, and the successor is Revenue Cloud Advanced. Because our footprint on SBQQ is fairly small and the logic is mostly in AMT objects, I'd tell the client a future move would mostly be about our custom layer, not CPQ configuration.

- SBQQ = CPQ managed package namespace
- Core: SBQQ__Quote__c, SBQQ__QuoteLine__c, SBQQ__Product__c
- SBQQ__RequiredBy__c links child lines to the bundle parent
- Custom logic mostly in AMT_ fields, not CPQ price rules

<sub>Also asked as: What standard CPQ objects did you work with? · Which SBQQ fields do you use on the quote line? · What is the SBQQ prefix and where do you see it in your org?</sub>

### How is the quote line trigger structured in your project?
*Mid (3–6 yrs) · code* · `qtc-cpq-003`

We keep it to one trigger, QuoteLineTrigger on SBQQ__QuoteLine__c, for before insert, before update, after insert and after update, and it only calls static methods on AMT_QuoteLineTriggerHandler. Before insert it finds the package attribute object for the line, sets AMT_Quote_Types__c, and inherits pricing issue details from the opportunity. Before update it stamps the price complete date and clears the customer device name when the price level becomes PDL. After insert it creates the package attribute record. After update it creates price variants, syncs status across single price turnkey bundle lines, and recalculates the opportunity stage. The whole thing sits behind a Custom Metadata switch, and the after block is wrapped in a try-catch that logs to AMT_Error_Log__c through ExceptionHandler. In review, I check that new logic goes into the handler under the right event, not into the trigger body.

- One trigger per object, logic in AMT_QuoteLineTriggerHandler
- Field defaults in before context, related records in after context
- Trigger_Control__mdt switch on top
- After block logs errors via ExceptionHandler.log

```java
// QuoteLineTrigger.trigger
trigger QuoteLineTrigger on SBQQ__QuoteLine__c (before insert,before Update,after insert, after update) {
    if(!AMT_TriggerMechanismHandler.disableTrigger('QuoteLineTrigger')){
        if(Trigger.isBefore){
            If(trigger.isInsert){
                AMT_QuoteLineTriggerHandler.updatePkgSpecificAttributeObject(Trigger.New);
                AMT_QuoteLineTriggerHandler.updateQuoteType(Trigger.New); //Thrinath-846
                AMT_QuoteLineTriggerHandler.inheritPricingIssueDetailsToQuoteLine(Trigger.New);
            }else  if(trigger.isUpdate){
                AMT_QuoteLineTriggerHandler.updatePriceCompleteDate(Trigger.new, Trigger.oldMap);
                AMT_QuoteLineTriggerHandler.clearDeviceNameOnPDL(Trigger.new, Trigger.oldMap);
            }
        }
```

<sub>Also asked as: Walk me through QuoteLineTrigger · What runs in before and after context on SBQQ__QuoteLine__c? · How did you write the trigger on CPQ quote lines?</sub>

### How do you bypass or switch off triggers in the QTC project?
*Mid (3–6 yrs) · code* · `qtc-cpq-004`

We use Custom Metadata. Almost every trigger, like QuoteLineTrigger, AMT_Quote, AMT_ConfigurationTrigger and AMT_InsertionTrigger, first calls AMT_TriggerMechanismHandler.disableTrigger with its own name. That method reads Trigger_Control__mdt by DeveloperName and returns Is_Disabled__c, so an admin can switch a trigger off in Setup without a deploy. Inside the quote line handler there is a second, finer switch: updateOppStatus and createPriceVariants read AMT_Run_Trigger_Setting__mdt record Run_QuoteLine_Trigger and only run when AMT_Active__c is true. The fix I'd put on the list is that disableTrigger assigns a SOQL result straight to a single record, so if the metadata row is missing it throws, and getInstance() would be safer and consistent with the other switch. It's low effort, and it removes a deployment trap where a new trigger fails just because its metadata record wasn't included.

- Trigger_Control__mdt.Is_Disabled__c per trigger name
- AMT_Run_Trigger_Setting__mdt Run_QuoteLine_Trigger for specific methods
- No deploy needed to switch off
- Improve: missing metadata row would throw

```java
// AMT_TriggerMechanismHandler.cls
public class AMT_TriggerMechanismHandler {
    public static boolean disableTrigger(string triggerName){
        Trigger_Control__mdt tc = [select Is_Disabled__c from Trigger_Control__mdt where DeveloperName=:triggerName];
        
        return tc.Is_Disabled__c;
    }
}
```

<sub>Also asked as: How do you disable a trigger without a deployment? · Do you have a trigger bypass framework? · What is Trigger_Control__mdt used for? · how do you turn off the quote line trigger for data loads</sub>

### Where and why do you use SBQQ.TriggerControl in the QTC project?
*Senior (7–10 yrs) · code* · `qtc-cpq-005`

SBQQ.TriggerControl is the CPQ package API that switches CPQ's own managed-package triggers off and on for the current transaction. We use it wherever we update quote lines just to move status. In AMT_QuoteLineTriggerHandler.updateRelatedQuoteLineStatus we disable it, update the bundle lines, and enable it again. RecalculateQuoteLineStatusBatch does the same but inside try-finally, so CPQ triggers are always re-enabled even if the DML throws. The submit and assign screen flows call an invocable, AMT_AssignQuoteLineHelper.controlQLTrigger, with 'true' before the update and 'false' after. One important point: it only affects CPQ's package triggers, our own QuoteLineTrigger still runs. I'd add the same try-finally to the trigger handler, because there an exception between disable and enable would leave it off. The batch already shows the right pattern, so I'd make it the team standard.

- Disables CPQ package triggers only, not custom triggers
- Used in handler, batch and flows (via AMT_AssignQuoteLineHelper)
- Batch uses try/finally to always re-enable
- Improve: handler lacks try/finally

```java
// RecalculateQuoteLineStatusBatch.cls
            try {
                SBQQ.TriggerControl.disable();

                saveResults = Database.update(
                    quoteLinesToUpdate,
                    false
                );
            } finally {
                SBQQ.TriggerControl.enable();
            }
```

<sub>Also asked as: How do you stop CPQ triggers from firing when you update quote lines? · Have you used SBQQ.TriggerControl.disable? · How do you avoid CPQ recalculation on a simple field update? · how did you bypass cpq package triggers</sub>

### Our custom quote line trigger seems to fire during CPQ calculation. How would you handle that in this project?
*Senior (7–10 yrs) · troubleshooting* · `qtc-cpq-006`

First I'd remember that SBQQ.TriggerControl only switches off CPQ's package triggers, so our QuoteLineTrigger will still run on every save CPQ does after a calculation. In our handler most after-update logic is guarded by a field change: createPriceVariants only acts when QuoteLine_Status__c changes to specific values, updateOppStatus only when the status changes, and updatePriceCompleteDate only when the assembly or test status changes. So a CPQ save that only touches prices mostly passes through. I'd take a debug log of the user's action and check which handler methods actually did DML. If we need to stop our logic completely, Trigger_Control__mdt can disable QuoteLineTrigger, and AMT_Run_Trigger_Setting__mdt Run_QuoteLine_Trigger turns off the price variant and opportunity logic. For our own status updates we wrap DML with SBQQ.TriggerControl so CPQ doesn't react. Going forward, my rule for new quote line logic is that it must be guarded by a real field change, so CPQ's saves stay cheap.

- TriggerControl does not stop custom triggers
- Handler logic is guarded by old vs new status comparisons
- Use a debug log to see which methods did DML
- Metadata switches exist for a full stop

<sub>Also asked as: Trigger running when CPQ recalculates the quote, what do you do? · How do you stop your trigger logic running on CPQ's own saves? · Quote line trigger and CPQ calculation are clashing, how do you debug?</sub>

### What does the AMT_Quote trigger on SBQQ__Quote__c do?
*Fresher (0–2 yrs) · code* · `qtc-cpq-007`

AMT_Quote is an after insert trigger on SBQQ__Quote__c and it does sharing. It calls AMT_QuoteHandler, which is a singleton, and its createQuoteShare method. For every new quote with SBQQ__Account__c filled, it builds the public group name for that account using AMT_AccountTriggerHandler.generatePublicGroupName, queries those groups in one SOQL, and inserts SBQQ__Quote__Share records with Edit access for the group. The account trigger creates a public group per account, and the account team member trigger adds members with PA_PI_Access__c to it, so anyone in the account's group gets edit access to its quotes. It is bulk safe: one query for groups and one insert for all share records. It's a good example I point people to, because it reuses the group-name method instead of rebuilding the name string.

- After insert on SBQQ__Quote__c
- Shares the quote with the account's public group, Edit access
- Group per account created by the account trigger
- One SOQL and one DML for the whole batch

```java
// AMT_QuoteHandler.cls
        for(String accountQuoteId : accountIdQuoteIdSet){
            accId = accountQuoteId.split(QTC_Constants.UNDERSCORE)[0];
            if(accountIdgroupIdMap.containsKey(accId)){
                lstQuoteShareRecords.add(new SBQQ__Quote__Share(
                    AccessLevel = QTC_Constants.ACCESS_EDIT,
                    ParentId = accountQuoteId.split(QTC_Constants.UNDERSCORE)[1],
                    UserOrGroupId = accountIdgroupIdMap.get(accId)
                ));
            }
        }
```

<sub>Also asked as: Do you have a trigger on the CPQ quote object? · How are CPQ quotes shared with the account team? · How did you handle quote sharing in your project?</sub>

### How is the CPQ quote created in your QTC project?
*Fresher (0–2 yrs) · concept* · `qtc-cpq-008`

Users don't create the quote by hand in QTC. A record-triggered flow on Opportunity, Create Quote and Update Opportunity, runs after save. If the opportunity has no AMT_Quote__c and no existing SBQQ__Quote__c, and it's in stages like Discovery, Value Proposition, BU/Factory/Sales Alignment or Quote and is not a clone, the flow creates an SBQQ__Quote__c. It sets SBQQ__Account__c, SBQQ__Opportunity2__c, the price book, SBQQ__Primary__c true, SBQQ__Status__c Draft and SBQQ__Type__c Quote, plus private account and sales region fields. Then it writes the quote back to the opportunity's AMT_Quote__c and sets Pricebook2Id and SBQQ__QuotePricebookId__c. Quote lines are then added under that one primary quote. One primary quote per opportunity keeps things simple for users, and any change to that flow's entry conditions is something I'd test against clones specifically.

- Opportunity after-save flow creates the quote
- One primary Draft quote per opportunity
- Opportunity gets AMT_Quote__c and price book fields
- Clones are skipped

<sub>Also asked as: Who creates the SBQQ quote, the user or automation? · How does an opportunity get its CPQ quote? · Is the primary quote created automatically?</sub>

### What are the quote line statuses in your project and how does a line move through them?
*Fresher (0–2 yrs) · concept* · `qtc-cpq-009`

A quote line starts in Draft. When the sales user submits it, it goes into a pricing queue. Assembly lines go to With Pricing or With BU Pricing. Test lines go to With Test TPM, With Test Services 1, With Pricing, With Test Services 2 and With BU Pricing. Once the price records are approved, the line becomes Price Complete. After the customer decides, it is closed as Closed Won, Closed Lost, Closed No Bid or Closed Cancel. A user can also recall a line from a pricing status back to Draft. In the code, Price Complete and the closed statuses are mostly set by rolling up the statuses of the line's price records, and the closed statuses also roll up to the opportunity stage. When I explain it to stakeholders, I say users move the line into pricing, and the price records decide when it's done.

- Draft -> pricing queues -> Price Complete -> Closed
- Assembly: With Pricing / With BU Pricing
- Test: With Test TPM / Test Services 1 / With Pricing / Test Services 2
- Recall returns the line to Draft

<sub>Also asked as: Explain the quote line lifecycle · What is the life cycle of a quote line in QTC? · Which status values does a quote line go through? · quote line status flow draft to price complete</sub>

### Why do quote lines have both AMT_Assembly_Status__c and AMT_Test_Status__c?
*Fresher (0–2 yrs) · concept* · `qtc-cpq-010`

Because a quote line is either an assembly type service or a test type service, and each has its own status track. The code decides which field to write from AMT_Service__c. In RecalculateQuoteLineStatusBatch and AMT_PriceRecordTriggerHandler, if the service is in the custom label AMT_QuoteLine_Assembly it writes AMT_Assembly_Status__c, and if it's in AMT_QuoteLine_Test it writes AMT_Test_Status__c. The submit flow does the same using the labels AMT_Assembly_Services and AMT_Test_Services. QuoteLine_Status__c is what the code and flows read as the overall status. In our Apex, nothing assigns QuoteLine_Status__c directly, only the two service-specific fields; I'd confirm how it's derived on its field definition before relying on that. One thing I'd flag to the team is that two sets of labels exist for the same split, so a new service must be added to both.

- Separate status tracks for assembly and test
- Custom labels map service to the right field
- QuoteLine_Status__c is read as the overall status
- Apex writes only the service-specific fields

<sub>Also asked as: What is the difference between assembly status and test status? · How do you know which status field to update? · What is QuoteLine_Status__c?</sub>

### Walk me through what happens when a user submits a quote line.
*Mid (3–6 yrs) · scenario* · `qtc-cpq-011`

Submit is the AMT_Submit Quote Line screen flow. It first runs checks: business type and customer project name must be filled, a test line must have a quote type, Insertion Only needs insertions, Configuration Only needs configurations, and singulated, SLT and probe insertions need number of sites in parallel. It also checks MSF values and calls the invocable AMT_CheckMandatoryFieldsOnPkgAttribute for package attribute rules; if that returns a message, the flow shows an error screen. Then, based on AMT_Queue__c, service and Draft status, it assigns the new status, like With Pricing or With Test TPM, and stamps AMT_Submitted_Date__c. For assembly it also sets AMT_Price_Record_creation__c. It disables CPQ triggers through AMT_AssignQuoteLineHelper, updates the line, enables them again, and ends on a screen with amtRefreshQLSubmit, which reloads the quote line page. I like that validation happens before any update, because a failed submit leaves nothing half-done.

- Validation decisions + Apex mandatory check
- Status chosen from AMT_Queue__c and service
- CPQ triggers disabled around the update
- Refresh LWC reloads the record page

<sub>Also asked as: How does the submit quote line flow work end to end? · What does the Submit Quote Line button do? · How does a quote line go from Draft to the pricing team?</sub>

### What does AMT_CheckMandatoryFieldsOnPkgAttribute check before submit?
*Mid (3–6 yrs) · concept* · `qtc-cpq-012`

It's an invocable method the submit flows call, and it returns one error string; empty means OK. For Post Test lines it needs a price level and at least one price record, and a Grouped Post Test line needs a grouped price record. For Test, Probe and End of Line lines, Configuration Only needs a configuration, and Insertion Only needs insertions, and if only some insertions are linked to a configuration it asks to link all of them, except Strip Test, Film Frame Test and Burn-In. If the wire, die or substrate flags are on, the matching description records must exist, and every die must be linked to a wire. Finally it reads AMT_Package_Group_Service__mdt to find the field sets for the line's package attribute object, collects required fields, queries that record dynamically, and errors if any are blank. Keeping these rules in one invocable means both submit flows stay consistent.

- Invocable returns an error message list
- Checks child records: configs, insertions, wire/die/substrate
- Required fields come from field sets via AMT_Package_Group_Service__mdt
- Only processes the first record in the list

<sub>Also asked as: What validations run before a quote line is submitted? · How do you validate package attributes before submission? · What is the mandatory field check invocable?</sub>

### How do you submit many quote lines at once?
*Mid (3–6 yrs) · concept* · `qtc-cpq-013`

We have a separate screen flow, AMT_Submit_QL_Bundle. It loops over all the quote lines, AllQL, and runs similar checks to the single submit: business type, quote type for test lines, insertion count for Insertion Only, adders, and the AMT_CheckMandatoryFieldsOnPkgAttribute call. It has an extra check for single price turnkey: when the opportunity type is Single Price Turnkey, a line only goes ahead if AMT_Single_Price_Submit__c is true, otherwise it shows an error that the line will not be submitted. Another flow, AMT_Update Quote Line Single Price Turnkey, sets that flag on the other lines of the opportunity. Then it assigns the queue status per line, With Pricing, With BU Pricing, With Test TPM and so on, disables CPQ triggers through AMT_AssignQuoteLineHelper, updates the lines, enables them, and creates a Refresh_Price_Records__e platform event so the open price record screens refresh. Since the checks are duplicated from the single submit, I make sure any rule change lands in both flows.

- Loops all quote lines and reuses submit checks
- Single price turnkey lines need AMT_Single_Price_Submit__c
- CPQ triggers disabled around the update
- Publishes Refresh_Price_Records__e

<sub>Also asked as: Is there a bulk submit for quote lines? · How does AMT_Submit_QL_Bundle work? · How do you submit all lines of a bundle together?</sub>

### How are quote lines assigned to pricing users?
*Mid (3–6 yrs) · concept* · `qtc-cpq-014`

It's the Assign Quote Line Queue screen flow. It works from a single record or from selected list view records. It checks the user has the with_Pricing_Permission custom permission, then shows lookups for each assignee field: AMT_With_Pricing_Assignee__c, AMT_With_BU_Pricing_Assignee__c, the business unit ones like AMT_FC_BGA_Assignee__c and AMT_FC_CSP_Assignee__c, and the test ones like AMT_With_Test_TPM_assignee__c. For With BU Pricing it checks the line's AMT_Business_Unit__c, that the BU assignee is empty, and that the current user has the matching flag, like AMT_FC_BGA_pricing__c. It collects the lines, disables CPQ triggers through AMT_AssignQuoteLineHelper, updates them, enables triggers, and ends on amt_RefreshAssignQLScreen, which redirects to the record or the recent list view. Using a custom permission instead of a profile check is the approach I'd want for any new gated action.

- Custom permission gate
- Business unit decides which assignee field is used
- Bulk update of a quote line collection
- Refresh LWC redirects after save

<sub>Also asked as: How does the Assign Quote Line Queue flow work? · How do you assign a quote line to a pricing analyst? · Who decides the assignee for BU pricing?</sub>

### What do the amtRefreshQLSubmit and amt_RefreshAssignQLScreen components do?
*Fresher (0–2 yrs) · code* · `qtc-cpq-015`

They are tiny LWCs placed on the last screen of our flows so the user sees fresh data after the update. amtRefreshQLSubmit is used in the submit flow and the With Pricing to With BU Pricing flow; in connectedCallback it calls window.location.replace to the quote line's record page. amt_RefreshAssignQLScreen is used in the assign flow; it shows a spinner, waits one second, and redirects to the record page, or to the quote line Recent list view when there is no recordId, which happens when it was launched from a list. A full page reload makes sure the record page and related lists show the new status and assignee. It's a simple, pragmatic choice; the trade-off is a full reload, which I accept here because stale status on a pricing screen causes more confusion than a second of waiting.

- Flow screen components that reload the page
- Record page if recordId, else Recent list view
- Used because the status and assignees change server side

```java
// amt_RefreshAssignQLScreen.js
       connectedCallback() {
        setTimeout(() => {
            if (this.recordId) {
                window.location.replace(`/lightning/r/SBQQ__QuoteLine__c/${this.recordId}/view`);
            } else {
                window.location.replace('/lightning/o/SBQQ__QuoteLine__c/list?filterName=Recent');
            }
        }, 1000);
    }
```

<sub>Also asked as: Why do you have a refresh LWC in the flow? · How do you refresh the record page after a screen flow? · How do you reload the quote line after submit?</sub>

### How does recall work on a quote line?
*Mid (3–6 yrs) · concept* · `qtc-cpq-016`

Recall is the AMT_Recall Button on Quote Line screen flow. It checks the current status: With Pricing or With BU Pricing for assembly services, With Test TPM or With Test Services 1 for test services. It moves the line back to Draft and clears the assignee fields, like AMT_With_Pricing_Assignee__c and the business unit and test assignees. It also finds the price records that should go and marks them with AMT_Delete_PR__c, then deletes them; the flow description says 'Design Change - Update Delete PR field on PR'. For Special Turnkey opportunities it has an extra branch that loops related quote lines and updates their assembly and test status as well. There's a related flow for Test TPM, AMT QuoteLine With Test TPM Status Update, which also flags and deletes price records. Since recall deletes price records, I treat any change here as high risk and want the test to prove only the intended records go.

- Back to Draft from pricing statuses
- Clears assignee fields
- Flags AMT_Delete_PR__c then deletes price records
- Special Turnkey handles bundle lines

<sub>Also asked as: How do you pull back a submitted quote line? · What does the Recall button on quote line do? · What happens to price records when a quote line is recalled?</sub>

### How does the quote line know which package attribute object to use?
*Mid (3–6 yrs) · concept* · `qtc-cpq-017`

It's metadata driven in QTC. In before insert, updatePkgSpecificAttributeObject reads all AMT_Package_Group_Service__mdt records and finds the one that matches the line. For services like Test, Probe, Other, Backgrind and Reflow it matches on AMT_Service_Group__c against the line's package group, and the metadata can hold several groups separated by semicolons. For other services, like assembly, it matches the service group and then the package family against AMT_QuoteLine_Package_Family__c. The matched record's AMT_Object_Name__c is stored on AMT_Package_detail_object_info__c. Cloned lines are skipped. So adding a new package family is mostly a metadata change, and the same metadata also drives which field sets and sections show on the page and which fields are mandatory. That's a design I'd defend to the client, because new package families don't need a code release, but I still have the metadata change reviewed like code.

- AMT_Package_Group_Service__mdt maps group/family to an object
- Stored on AMT_Package_detail_object_info__c in before insert
- Semicolon lists in metadata for multiple groups/families
- Clones skipped

<sub>Also asked as: What is AMT_Package_detail_object_info__c? · How did you make package details configurable? · How do you decide which detail object a quote line gets?</sub>

### How do you create the package-specific attribute record for a quote line?
*Mid (3–6 yrs) · code* · `qtc-cpq-018`

In after insert, createPackageSpecificRecords takes the object API name that before insert stored on AMT_Package_detail_object_info__c. For each non-cloned line it gets the SObjectType from Schema.getGlobalDescribe, calls newSObject, puts the quote line Id into AMT_Quote_Line__c, and collects it in a List of sObject. Then it does one insert for all of them, even if they are different objects. That's how one trigger can create the right detail record, like an FCBGA detail, for any package family without hard-coding object types. Cloned lines are skipped because the clone process copies the attribute records separately. The one rule I hold for this pattern is that every new package object must have an AMT_Quote_Line__c field, or the dynamic put fails at runtime.

- Schema.getGlobalDescribe().get(name).newSObject()
- Generic put('AMT_Quote_Line__c', Id)
- One insert for mixed sObject types
- Clones handled by AMT_CloneOppAndRelatedRecords

```java
// AMT_QuoteLineTriggerHandler.cls
            for(SBQQ__QuoteLine__c quoteLineRec : quotesList){
                if(quoteLineRec.AMT_Package_detail_object_info__c!= null && quoteLineRec.AMT_Package_detail_object_info__c!='' && quoteLineRec.AMT_Clone_Quote_Line__c==false){
                    Schema.SObjectType targetType = Schema.getGlobalDescribe().get(quoteLineRec.AMT_Package_detail_object_info__c);
                    SObject newRecord = targetType.newSObject();
                    newRecord.put('AMT_Quote_Line__c', quoteLineRec.Id);
                    pkgSpecificAttRecords.add(newRecord);
                }
            }
            if(! pkgSpecificAttRecords.isEmpty()){
                insert pkgSpecificAttRecords;
            }
```

<sub>Also asked as: How do you insert a record when the object name is only known at runtime? · How is the package detail record created after quote line insert? · Dynamic sObject creation in your project</sub>

### What are quote types on a quote line and how are they set?
*Fresher (0–2 yrs) · code* · `qtc-cpq-019`

AMT_Quote_Types__c tells us what kind of test quote it is. updateQuoteType in before insert sets it from the package group: Singulated Test, Probe and SLT Configuration lines get Configuration Only, the matching Insertion groups get Insertion Only, and Post Test gets Individual. A before-save flow, Quote Line: Trigger Before Create, also sets Configuration Only and Insertion Only, and it adds Film Frame Test, Burn-In and Strip Test as Insertion Only. The quote type matters later: submit checks that Configuration Only has configurations and Insertion Only has insertions, and createPriceVariants uses it to decide when to create price records. Since both Apex and a flow set the same field, I'd ask the team to keep the mapping in one place over time.

- Configuration Only / Insertion Only / Individual
- Set from AMT_Package_Group__c
- Both a before-save flow and Apex set it
- Drives submit validation and price record creation

```java
// AMT_QuoteLineTriggerHandler.cls
    public static void updateQuoteType(List<SBQQ__QuoteLine__c> qLineNew){
        for(SBQQ__QuoteLine__c qt:qLineNew){
            if(qt.AMT_Package_Group__c == 'Singulated Test Configuration' || qt.AMT_Package_Group__c == 'Probe Configuration' || qt.AMT_Package_Group__c == 'SLT Configuration'){
                qt.AMT_Quote_Types__c = 'Configuration Only';
            }
            if(qt.AMT_Package_Group__c == 'Singulated Test Insertion' || qt.AMT_Package_Group__c == 'Probe Insertion' || qt.AMT_Package_Group__c == 'SLT Insertion'){
                qt.AMT_Quote_Types__c = 'Insertion Only';
            }
            if(qt.AMT_Package_Group__c == 'Post Test'){
                qt.AMT_Quote_Types__c = 'Individual';
            }
        }
    }
```

<sub>Also asked as: What is AMT_Quote_Types__c? · What is Configuration Only versus Insertion Only? · How does the quote type get populated?</sub>

### What are Configurations__c and Insertions__c in your project?
*Fresher (0–2 yrs) · concept* · `qtc-cpq-020`

Both are child records of a test quote line, linked through AMT_Quote_Line__c. A configuration describes the test equipment setup: tester, handler and prober model and owner, equipment values, test temperature, number of sites in parallel and how the multi-site efficiency factor applies. An insertion describes a test step: test time and index time, per touchdown values, operation code and description, good and reject test codes, wafer size, gross die per wafer and burn-in time. An insertion can link to one or more configurations by name in AMT_Linking_Configuration__c. Strip Test, Film Frame Test and Burn-In insertions don't need a linked configuration. Both feed the price records created for the line. Linking by name is the part I'd watch, because renaming a configuration can quietly break the link.

- Configuration = equipment setup
- Insertion = test step and timings
- Insertion links to configurations by name
- Both copy values onto price records

<sub>Also asked as: What is a configuration and an insertion on a quote line? · Explain the configuration and insertion attributes · How is test equipment captured on a CPQ quote line?</sub>

### How are price records created from a quote line in createPriceVariants?
*Senior (7–10 yrs) · concept* · `qtc-cpq-021`

createPriceVariants runs in after update and only acts on lines whose QuoteLine_Status__c just changed. A line qualifies when it moves to With Test Services 1 for Configuration Only or Insertion Only lines, to With Test TPM for auto-approval Insertion Only lines that aren't single price turnkey, or to With BU Pricing for Special Turnkey lines that aren't escalated. For those lines it bulk-queries the configurations and insertions, the multi-site factor reference, the accounts and test services. Each configuration gets a price record with quote type Configuration, Approved for Blended configs and Open otherwise. Each insertion gets one price record per linked configuration, and an insertion with no linked configuration, like Strip Test, Film Frame Test or Burn-In, gets one price record without a configuration. Then it inserts them, sets Is_Recall_Action__c on the sources, and publishes Refresh_Price_Records__e. When someone changes these entry conditions, I expect a test per qualifying transition, because this is where duplicates or missing prices start.

- Triggered by specific status transitions
- One PR per configuration; one per insertion-config link
- Blended configs start Approved, others Open
- Bulk queries, then insert, then recall flag

<sub>Also asked as: When do price variants get created? · How does the quote line trigger create AMT_Price_Record__c? · Explain the price variant creation logic</sub>

### What does the createPR method copy onto a price record?
*Mid (3–6 yrs) · concept* · `qtc-cpq-022`

createPR builds one AMT_Price_Record__c in memory. From the quote line it takes AMT_Quote_Line__c, plant from AMT_Plant_Test__c, price level, forecasted volume, CPU flag and the customer from the account map. From the insertion it copies operation code and description, test and index times, good and reject test codes, wafer size, burn-in time, equipment values and temperature, and for Strip Test it uses units per touchdown as sites. From the configuration it copies tester, handler and prober models and owners, equipment, and the MSF. It stamps AMT_Quote_Type__c and, for insertions, takes AMT_Hourly_Price__c from the linked configuration's price record. For insertions with no link outside Strip Test, Burn-In and Film Frame Test, equipment fields are set to 'All'. When a new field is added to configurations or insertions, my review question is whether createPR and the update handlers both need to copy it.

- Quote line: plant, price level, volume, customer
- Insertion: timings, codes, wafer and burn-in data
- Configuration: equipment and MSF
- Hourly price comes from the configuration's price record

<sub>Also asked as: How do quote line values reach the price record? · What fields does a price record get from the configuration and insertion? · Explain createPR in the quote line handler</sub>

### How is the multi-site efficiency factor (MSF) calculated for price records?
*Mid (3–6 yrs) · code* · `qtc-cpq-023`

The configuration has AMT_MSF_Application__c with three options. Apply MSF looks up AMT_Multi_Site_Factor_Reference__c by the number of sites in parallel and uses its AMT_MSF__c; if there's no reference row it falls back to the number of sites. Special MSF Case uses the configuration's AMT_Special_MSF__c. Do Not Apply MSF uses the number of sites itself. The result goes into AMT_Multi_Site_Efficiency_Factor_MSF__c on the price record. The reference table is queried in bulk for all site counts in the batch, not per record, and kept in a map. The same logic is repeated in AMT_ConfigurationTriggerHandler when a configuration is edited later, and the submit flow blocks Special MSF Case if the special value is blank. Because the logic lives in two places, I'd move it into one shared method so the two can't drift apart.

- Apply / Special / Do Not Apply
- Reference table AMT_Multi_Site_Factor_Reference__c
- Queried in bulk into a map
- Duplicated in configuration trigger handler

```java
// AMT_QuoteLineTriggerHandler.cls (createPR)
            if (configRec.AMT_MSF_Application__c == 'Apply MSF' && configRec.AMT_Number_of_Sites_in_Parallel__c != null) {
                Integer noofSitesinParallel=Integer.valueOf(configRec.AMT_Number_of_Sites_in_Parallel__c);
                msfValue =
                    (siteToMSFMap.containsKey(noofSitesinParallel) &&
                    siteToMSFMap.get(noofSitesinParallel) != null)
                        ? siteToMSFMap.get(noofSitesinParallel)
                        : (configRec.AMT_Number_of_Sites_in_Parallel__c != null
                        ? configRec.AMT_Number_of_Sites_in_Parallel__c
                        : null);
            }
            if (configRec.AMT_MSF_Application__c == 'Special MSF Case' && configRec.AMT_Special_MSF__c != null ) {
                msfValue = configRec.AMT_Special_MSF__c; 
            }
```

<sub>Also asked as: What is MSF and how do you set it? · How does AMT_MSF_Application__c work? · Where does the multi site factor value come from?</sub>

### Users reported duplicate price records for one quote line. How was that handled?
*Mid (3–6 yrs) · troubleshooting* · `qtc-cpq-024`

In our code there's a method setRecallFlag, and its comment ties it to defect 1152, multiple price records created for a quote line. After createPriceVariants builds price records, it collects the source configurations and insertions and sets Is_Recall_Action__c to true on them in bulk. When creating insertion price records it skips insertions where Is_Recall_Action__c is already true. There's also a comment that an older condition was commented out because duplicate price records were getting created. If I saw duplicates again, I'd check whether the status went through a qualifying transition twice, for example recall and resubmit, whether the insertion's recall flag was set, and I'd note the configuration branch doesn't check the flag, since that check is commented out. That gap is what I'd raise with the team first, because it's the most likely source of a repeat.

- setRecallFlag marks sources after PR creation
- Insertion PRs skipped when Is_Recall_Action__c is true
- Configuration branch check is commented out
- Check status transitions in the debug log

<sub>Also asked as: How do you stop price records being created twice? · What is Is_Recall_Action__c for? · Multiple price records got created for the same quote line, what do you check?</sub>

### What do AMT_ConfigurationTrigger and AMT_InsertionTrigger do?
*Mid (3–6 yrs) · concept* · `qtc-cpq-025`

Both keep the price records in sync after edits. AMT_ConfigurationTrigger, after update, calls AMT_ConfigurationTriggerHandler.updateOnPriceRecord, which queries price records for those quote lines and configurations and copies changed values: test temperature, tester, handler and prober models and owners, equipment values, number of sites and a recalculated MSF. AMT_InsertionTrigger does the same for insertion fields like test and index times, test codes, wafer size and burn-in time. The insertion trigger also has before logic: UpdateSmalltoCapital uppercases the good and reject test codes on insert or when they change, and clearLinkedConfigOnSiteChange clears AMT_Linking_Configuration__c when the number of sites in parallel changes, so the user has to link again.

- After update sync to AMT_Price_Record__c
- Insertion: test codes uppercased in before trigger
- Changing sites clears the linked configuration
- Both behind Trigger_Control__mdt

<sub>Also asked as: What happens when a configuration or insertion is edited after price records exist? · How do you keep price records in sync with configurations? · Explain the insertion trigger logic</sub>

### How does linking an insertion to a configuration affect pricing?
*Senior (7–10 yrs) · concept* · `qtc-cpq-026`

AMT_Linking_Configuration__c on the insertion holds one or more configuration names separated by semicolons. In createPriceVariants we split it, query those configurations by Name, and query their price records with quote type Configuration or Blended. For each insertion and each linked configuration we create an insertion price record, and createPR copies the configuration price record's AMT_Price_to_Customer__c into AMT_Hourly_Price__c, along with the configuration's equipment and MSF. So the configuration price is the hourly rate the insertion is priced on. The submit check rejects a mix of linked and unlinked insertions, except for Strip Test, Film Frame Test and Burn-In. One thing I'd point out: linking by Name, not Id, depends on configuration names being unique.

- Semicolon list of configuration names
- One insertion PR per linked configuration
- Hourly price = configuration PR's AMT_Price_to_Customer__c
- Name-based link relies on unique names

<sub>Also asked as: What is AMT_Linking_Configuration__c? · How is the hourly price on insertion price records calculated? · How do insertions get their hourly rate?</sub>

### How do prices flow onto quote lines in your CPQ implementation?
*Mid (3–6 yrs) · concept* · `qtc-cpq-027`

In our project the real pricing lives on AMT_Price_Record__c, not on CPQ's price waterfall. Each quote line has price records, or price variants, created from its configurations, insertions or plant and volume values, and the pricing team works and approves them there. The quote line mostly carries status and attributes. The one place I've seen a CPQ price field written is the flow Update Price to Customer for Single Price Turnkey QL: when a single price turnkey price record becomes Approved with a turnkey price, it copies the record's AMT_BU_Price__c into SBQQ__ListPrice__c on the quote line. In the code I have, I don't see a Quote Calculator Plugin or price rule metadata, so I wouldn't claim how those are configured in the org.

- Pricing on AMT_Price_Record__c
- Quote line holds status and attributes
- Single price turnkey flow sets SBQQ__ListPrice__c
- No QCP/price rules visible in the repo

<sub>Also asked as: Do you use CPQ price rules or a QCP for pricing? · Where is the actual price stored in your project? · How does the list price on the quote line get set? · how is pricing done in your cpq project</sub>

### A user says the quote line price is wrong. How would you debug it in this project?
*Senior (7–10 yrs) · troubleshooting* · `qtc-cpq-028`

First I'd find which price record the number comes from, because pricing lives on AMT_Price_Record__c. For a single price turnkey line, SBQQ__ListPrice__c is set by the flow from the approved record's AMT_BU_Price__c, so I'd check that record and whether it was cloned. For test lines I'd trace the inputs: the configuration values, the MSF option and the AMT_Multi_Site_Factor_Reference__c row, and for insertions the hourly price copied from the linked configuration's price record. If a configuration or insertion was edited later, the sync handlers should have updated the price record. Both handlers map price records by quote line, so with several configurations on one line only one record gets compared, which can leave a stale value. Then I'd check price record triggers like updateCpuPrice and roundPrices with a debug log.

- Start at the price record, not the quote line
- Check inputs: configuration, MSF, linked hourly price
- Sync handlers map one PR per quote line
- Debug log on price record trigger

<sub>Also asked as: The price on a quote line looks incorrect, what do you check? · How do you troubleshoot a wrong CPQ quote line price? · price mismatch on quote line how to debug</sub>

### No price records were created after a test quote line was submitted. How do you debug it?
*Mid (3–6 yrs) · troubleshooting* · `qtc-cpq-029`

I'd check the conditions in createPriceVariants step by step. AMT_Run_Trigger_Setting__mdt Run_QuoteLine_Trigger must be active and Trigger_Control__mdt must not disable QuoteLineTrigger. Then the status transition must qualify: Configuration Only and Insertion Only lines create records on the move to With Test Services 1, auto-approval Insertion Only lines on With Test TPM, and Special Turnkey lines on With BU Pricing when not escalated. Then the line needs configurations or insertions, and insertion price records are skipped if Is_Recall_Action__c is already true. Also, the method catches every exception and only writes System.debug, so a failure is silent. I'd take a debug log of the submit and look for 'An exception occurred'. Assembly lines are different: their price records come from the after-save flow when AMT_Price_Record_creation__c is true.

- Check metadata switches
- Check the exact status transition and quote type
- Check child records and recall flags
- Exceptions are swallowed: use a debug log

<sub>Also asked as: Price variants missing after submit, what do you check? · Why would createPriceVariants not create anything? · Submitted line has no price records</sub>

### How are price records created for assembly quote lines?
*Mid (3–6 yrs) · concept* · `qtc-cpq-030`

For assembly, the submit flow sets AMT_Price_Record_creation__c to true along with With Pricing or With BU Pricing. A record-triggered after-save flow, Quote Lines Update trigger flow, sees that flag. It splits the quote line's plant and forecasted volume values on semicolons, loops plants and, inside that, volumes, so it builds one price record per plant and volume combination. Each record gets the quote line, customer, sales region, private account flag, price level, device name and the sum of gold factors from the AMT_Wire__c records. For Other or Unlisted service, it sets the lifecycle stage to Not Eligible for Activation. Then it creates the records, resets the flag, and publishes Refresh_Price_Records__e. The same flow also stamps the price complete date and emails owners on Price Complete.

- Flag AMT_Price_Record_creation__c set by submit
- Plant x volume nested loops
- Gold factor summed from wire records
- Flag reset afterwards

<sub>Also asked as: Where do assembly price records come from? · What does the quote line after-save flow do? · How do plants and volumes create multiple price records?</sub>

### How does the quote line status get updated from its price records?
*Senior (7–10 yrs) · concept* · `qtc-cpq-031`

It's a roll-up done in Apex. When a price record's AMT_Variant_Status__c or Sales_Judged__c changes, AMT_PriceRecordTriggerHandler.processQuoteLineFieldUpdates collects the quote lines and calls recalculateQuoteLineStatus. That runs an aggregate query grouped by quote line, status and sales judged. Only when every price record is in Approved or a closed status does it set a final status: Price Complete if any is Approved, otherwise Closed Won, then Closed Lost, Closed No Bid, Closed Cancel in that priority. It writes AMT_Assembly_Status__c or AMT_Test_Status__c using the AMT_QuoteLine_Assembly and AMT_QuoteLine_Test labels, sets AMT_Donot_Recall__c once anything is Approved, and sets Sales_Judged__c. It only returns lines that actually changed, so it doesn't update records needlessly.

- Triggered from price record trigger
- Aggregate query, then all-or-nothing rule
- Approved wins, then Won, Lost, No Bid, Cancel
- Only changed lines updated

<sub>Also asked as: When does a quote line become Price Complete? · How do price record statuses roll up to the quote line? · Explain recalculateQuoteLineStatus</sub>

### What does RecalculateQuoteLineStatusBatch do and how is it scheduled?
*Senior (7–10 yrs) · design* · `qtc-cpq-032`

It's a safety net that applies the same price-record roll-up to every quote line with a service. It implements Batchable, Schedulable and Stateful. The scheduled execute doesn't run it directly; it starts RecalculatePriceRecordStatusBatch first, and that batch's finish starts this one, passing its CSV report and summary. In execute it builds the roll-up per line, decides the final status, and updates only changed lines with Database.update allOrNone false, inside SBQQ.TriggerControl disable and a finally that re-enables it. Stateful counters and CSV rows track processed, updated and failed lines, capped at 75,000 detail rows. In finish it combines both reports and, if there was data, starts AMT_RecalculateABMNBillingBatch with scope 200.

- Scheduler -> price record batch -> quote line batch -> billing batch
- Database.Stateful for counters and CSV
- Partial success DML with save result logging
- CPQ triggers disabled with try/finally

<sub>Also asked as: Do you have a batch that fixes quote line statuses? · How do you chain batches in your project? · Explain the nightly status recalculation</sub>

### How does the opportunity stage get updated from quote line statuses?
*Mid (3–6 yrs) · concept* · `qtc-cpq-033`

updateOppStatus runs in after update of the quote line. For lines whose QuoteLine_Status__c changed, it queries the opportunities with their child quote lines through the Quote_Lines__r relationship in one SOQL. If any line is still Draft, in a pricing queue or Price Complete, the opportunity stays at Quote. Otherwise Closed Won wins if any line is won, then Closed Lost, then Closed No Bid, and if everything is cancelled it becomes Closed Cancel with the reason 'All quote lines are closed'. There's also a flow, Update Opportunity Status on Quote Line Creation, that updates the stage when a line is created. The method is guarded by AMT_Run_Trigger_Setting__mdt.

- Opportunity stage derived from all its quote lines
- One SOQL with child subquery
- Open lines keep it at Quote
- Closed priority: Won, Lost, No Bid, Cancel

<sub>Also asked as: How do quote line statuses roll up to the opportunity? · What does updateOppStatus do? · When does the opportunity become Closed Won?</sub>

### How do you keep statuses in sync across single price turnkey bundle lines?
*Senior (7–10 yrs) · code* · `qtc-cpq-034`

For single price turnkey, the customer gets one price for the bundle, so the lines should move together. In after update, updateRelatedQuoteLineStatus looks for lines on Special Turnkey opportunities with AMT_Single_Price_Turnkey__c true, a SBQQ__RequiredBy__c parent, and an assembly or test status that changed to Price Complete or a closed status. It maps parent Id to that status, then queries the parent lines and their non-turnkey child lines in one SOQL, sets both status fields to the new value, and updates only the ones that changed. The update is wrapped in SBQQ.TriggerControl disable and enable so CPQ doesn't process it. Our own trigger runs again on that update, but it does not loop: the parent has no SBQQ__RequiredBy__c and the children it touches are not single price turnkey, so they fail the entry check.

- Driven by SBQQ__RequiredBy__c parent link
- Only Price Complete and closed statuses propagate
- One query for parents and children
- CPQ triggers disabled around the update

```java
// AMT_QuoteLineTriggerHandler.cls (updateRelatedQuoteLineStatus)
        List<SBQQ__QuoteLine__c> quoteLinesToProcess = [
            SELECT Id,Name,
                   SBQQ__RequiredBy__c,
                   AMT_Single_Price_Turnkey__c,
                   AMT_Assembly_Status__c,
                   AMT_Test_Status__c
            FROM SBQQ__QuoteLine__c
            WHERE Id IN :parentQuoteLineIds
               OR (
                    SBQQ__RequiredBy__c IN :parentQuoteLineIds
                    AND AMT_Single_Price_Turnkey__c = false
               )
        ];
```

<sub>Also asked as: How do child quote lines follow the parent's status? · How do you use SBQQ__RequiredBy__c in your code? · What does updateRelatedQuoteLineStatus do?</sub>

### What simple field automation runs in the quote line before update trigger?
*Fresher (0–2 yrs) · concept* · `qtc-cpq-035`

Two small methods. updatePriceCompleteDate sets AMT_Date_When_Price_Complete__c to today when AMT_Assembly_Status__c changes to Price Complete. Its else branch also stamps today when AMT_Test_Status__c moves away from Price Complete, which looks odd, and I'd confirm that with the business before changing it. clearDeviceNameOnPDL clears AMT_Customer_Device_Name__c when AMT_Price_level__c changes to PDL, since PDL pricing isn't per device. Both run in before update, so they just change Trigger.new with no extra DML. Separately, a before-save flow stamps AMT_Last_Status_Change_Date__c, and the after-save flow fills the price complete date if it's still blank.

- Before update edits Trigger.new, no DML
- Price complete date stamped on status change
- Device name cleared for PDL price level
- Test status branch looks inverted; confirm first

<sub>Also asked as: How is the price complete date stamped? · What does clearDeviceNameOnPDL do? · What happens in before update on quote line?</sub>

### How does a new quote line inherit details from the pricing issue?
*Mid (3–6 yrs) · concept* · `qtc-cpq-036`

In before insert, inheritPricingIssueDetailsToQuoteLine looks at the opportunity's AMT_Pricing_Issue__c. It only applies to the first lines on an opportunity: it counts existing non-cloned lines with an aggregate query and skips opportunities that already have lines. Then it compares the pricing issue's division with the line's AMT_Division_Code__c. If they match, or either is blank, it sets AMT_Linked_Pricing_Issue__c, application code, lead frame, plant and customer device name; Post Test skips the device name, and some service groups skip the attributes. Plant values are filtered with picklist validFor bits so only plants valid for the package family are kept. If divisions don't match and no other line on that opportunity matched, it blocks the line with addError.

- Only for the first lines on an opportunity
- Division match check with addError
- Plant filtered by dependent picklist validFor
- Cloned lines skipped

<sub>Also asked as: What is inheritPricingIssueDetailsToQuoteLine? · How do quote lines get application, lead frame and plant from the opportunity? · Where does the division mismatch error on quote line come from?</sub>

### What validations exist on quote lines in your project?
*Fresher (0–2 yrs) · concept* · `qtc-cpq-037`

We validate in a few layers. In Apex, the before insert trigger uses addError when the quote line division doesn't match the pricing issue division. Most submit-time validation is in the submit screen flows: mandatory fields like business type and customer project name, quote type for test lines, insertions or configurations present, number of sites on insertions, and MSF values. They also call the invocable AMT_CheckMandatoryFieldsOnPkgAttribute, which checks required package attribute fields from field sets, price records for Post Test, and wire, die and substrate records. On the bulk upload, AMT_ProductDataContoller validates required fields and picklist values from the Excel sheet. There's also a single price validation flow on quote lines for turnkey opportunities.

- Trigger: addError for division mismatch
- Submit flows: mandatory and child record checks
- Invocable for metadata-driven required fields
- Upload validation for Excel data

<sub>Also asked as: How do you validate quote line data? · Where are quote line validations implemented? · Do you use addError on quote lines?</sub>

### How do you handle bulk data and governor limits in the quote line trigger?
*Mid (3–6 yrs) · concept* · `qtc-cpq-038`

Most of the handler follows the usual pattern: collect Ids in sets first, run one query per object, keep results in maps, and do one DML per list. For example createPriceVariants queries configurations, insertions, accounts, the MSF reference and configuration price records once, then builds all price records and inserts them together. updateOppStatus pulls opportunities with child lines in one query. updatePkgSpecificAttributeObject uses AMT_Package_Group_Service__mdt.getAll(), which isn't a SOQL. Before-trigger methods just modify Trigger.new without DML. Status-only updates check old versus new values, so lines that didn't change aren't touched. The batch uses Database.update with partial success and logs each failure.

- Sets and maps, queries outside loops
- One DML per list
- getAll() for custom metadata
- Change detection before DML

<sub>Also asked as: Is your quote line trigger bulkified? · How do you avoid SOQL in loops in the CPQ trigger? · How does the handler behave with 200 quote lines?</sub>

### What would you improve in the quote line trigger code?
*Senior (7–10 yrs) · design* · `qtc-cpq-039`

A few things I can point to in the code. In updateOppStatus, the status sets are declared outside the loop, so with several opportunities in one batch, one opportunity's open line can push others to Quote, and the final if-else updates only one list. In createPriceVariants, the AMT_Test_Services__c query has LIMIT 1 for the whole batch, so lead ball count only maps for one line. Several methods catch Exception and only System.debug it, so failures are silent; I'd log through ExceptionHandler like the rest of the trigger. updateRelatedQuoteLineStatus needs a try-finally around SBQQ.TriggerControl. The configuration and insertion sync handlers key price records by quote line, so with more than one record per line some edits are missed, and a missing match can throw a null pointer. And status strings are hard-coded instead of constants.

- Bulk bug: shared sets and else-if DML in updateOppStatus
- LIMIT 1 on test services across the batch
- Swallowed exceptions
- Map keyed by quote line in sync handlers

<sub>Also asked as: What technical debt do you see in the CPQ trigger handler? · If you could refactor the quote line handler, what would you change? · Any bulk issues in your quote line code?</sub>

### How is error handling done in the quote line code?
*Fresher (0–2 yrs) · concept* · `qtc-cpq-040`

We have a common class, ExceptionHandler, with a log method. It creates an AMT_Error_Log__c record with the exception type and message, stack trace, error type Apex and the source class name, and optionally a message Id, object Id and interface type for integrations. It has an overload that takes a list of Database.SaveResult and logs the failed rows. In QuoteLineTrigger the whole after block is in a try-catch that calls ExceptionHandler.log with 'QuoteLineTrigger', and inheritPricingIssueDetailsToQuoteLine and the status batch also use it. Some older methods in the handler only catch and System.debug, which I'd change to use the logger so admins can see the failure.

- ExceptionHandler.log inserts AMT_Error_Log__c
- Stores message, stack trace and source
- SaveResult overload for partial DML
- Some methods still only System.debug

<sub>Also asked as: How do you log errors in your Apex? · What is AMT_Error_Log__c? · How do you track exceptions from triggers?</sub>

### What is Refresh_Price_Records__e used for?
*Fresher (0–2 yrs) · concept* · `qtc-cpq-041`

Refresh_Price_Records__e is a platform event we publish whenever price records or quote line pricing changes on the server, so the open screens refresh. createPriceVariants publishes it after creating price records, AMT_AssignQuoteLineHelper publishes it when the flows toggle CPQ triggers, and the bundle submit flow and the quote line after-save flow create it too. On the UI side, amt_InsertionAttributes subscribes to /event/Refresh_Price_Records__e with lightning/empApi in connectedCallback and calls refreshApex when an event arrives, and other components like the related price records component use it as well. It's a simple way to push a refresh to the page without the user reloading.

- Published from Apex and flows
- LWC subscribes via lightning/empApi
- Triggers a refresh of the component's data

<sub>Also asked as: How do your LWCs refresh when price records change? · Why do you publish a platform event from the trigger? · How do you refresh a component after server-side updates?</sub>

### A Test TPM user can't see the New button on the Configurations list of a quote line. How would you check it?
*Mid (3–6 yrs) · scenario* · `qtc-cpq-042`

I'd read the visibility rules in amt_ConfigurationAttributes, because the button is controlled in JavaScript, not by a page layout. The component gets the quote line through AMT_FieldSet_Helper.getPackageGroupName and the user's profile and AMT_Business_Role__c through getRecord. The New button shows for the System Admin business role, or, for roles other than Test TPM, when the role is in the custom label AMT_Business_Role_Sales_Rep or the profile is System Administrator and the line is Draft. For a Test TPM user the only branch left needs the line in With Test TPM, the user to be the AMT_With_Test_TPM_assignee__c, and the label AMT_Business_Role_Sales_Rep to contain the role, since it uses a string includes check. So I'd check the line status, the assignee field and that label. amt_InsertionAttributes follows the same rules.

- Visibility is coded in the LWC
- Inputs: business role, profile, status, Test TPM assignee
- Custom label AMT_Business_Role_Sales_Rep is a substring check
- Insertion component has the same rules

<sub>Also asked as: New button missing on configuration related list, why? · How does amt_ConfigurationAttributes decide who can add records? · User cannot create insertions or configurations on a quote line</sub>

### How do you clone a quote line with all its related records?
*Mid (3–6 yrs) · concept* · `qtc-cpq-043`

The opportunity clone flow creates the new quote lines with AMT_Clone_Quote_Line__c true and AMT_Quote_Line_Cloned_Parent__c pointing at the original. Then it calls the invocable AMT_CloneOppAndRelatedRecords, which hands the new line Ids to a future method. That method maps old line Id to new line Id, then for each child object, the package attribute object, wire, die, substrate, insertions and configurations, it builds a dynamic SOQL with all fields from describe, clones each record without Id and points AMT_Quote_Line__c to the new line. That's why the trigger skips clone lines when creating package records and inheriting pricing issue data. One thing I'd improve: the package attribute part runs a query and insert per quote line.

- Flow + invocable + @future
- Old-to-new quote line Id map
- Describe-based dynamic SOQL to copy all fields
- Trigger skips cloned lines

<sub>Also asked as: How is the opportunity clone handled for quote lines? · How do configurations and insertions get copied on clone? · What does AMT_CloneOppAndRelatedRecords do?</sub>

### How do users bulk upload package details for a quote line?
*Mid (3–6 yrs) · concept* · `qtc-cpq-044`

The packageDetailsUpload LWC loads the SheetJS library from the Templatexlsx static resource, accepts only .xlsx files, reads the workbook in the browser and converts sheets to JSON. It gets the expected headers from RFQI_Headers__mdt through AMT_ProductDataContoller.getHeaderDetails. Then the controller validates the data: required fields from field sets are present and picklist fields only have allowed values. On save, createQuoteLines updates quote line fields like price type, device name, volume, plant and target price, and requires volume when the price type is High Volume Manufacturing. It deletes the line's existing die, substrate and wire records and upserts the new records built from the sheet, including the package detail record.

- SheetJS in the browser, .xlsx only
- Headers from RFQI_Headers__mdt
- Required and picklist validation in Apex
- Updates quote line and replaces child records

<sub>Also asked as: How does the Excel upload on quote line work? · What does packageDetailsUpload do? · How do you validate an uploaded template?</sub>

### How are the quote line trigger and handler tested?
*Fresher (0–2 yrs) · concept* · `qtc-cpq-045`

AMT_QuoteLineTriggerHandler_Test has a testSetup method that builds the data chain: parent and child accounts with record types from describe, contacts, an opportunity, an SBQQ__Quote__c, products, and quote lines with service and package group. Test methods run as a specific test user with System.runAs, wrap the action in Test.startTest and stopTest, and update statuses to hit branches like Closed Won, price complete date, quote types for every package group, and package attribute creation. A TestDataFactory class also exists. Honestly, the gap is that many tests wrap DML in try-catch and have few asserts, so they give coverage more than proof. I'd add asserts on the status, the created price records and the opportunity stage.

- @testSetup builds account to quote line chain
- System.runAs and Test.startTest/stopTest
- Branch coverage for quote types and statuses
- Gap: try/catch and few asserts

<sub>Also asked as: How did you write test classes for CPQ quote lines? · What does AMT_QuoteLineTriggerHandler_Test cover? · How do you create CPQ test data?</sub>

### You have both flows and Apex on the quote line. How do they interact in the order of execution?
*Senior (7–10 yrs) · concept* · `qtc-cpq-046`

On save, Salesforce runs before-save record-triggered flows before the Apex before triggers, then after triggers, and then after-save flows. On our quote line, Quote Line: Trigger Before Create runs first: it sets the gold base price from the account, the last status change date, clears the linked pricing issue on clones, and sets the quote type for configuration and insertion groups. Then QuoteLineTrigger's before insert runs updateQuoteType, so for the groups both handle, the Apex value is the final one. Film Frame Test, Burn-In and Strip Test are only set by the flow. After save, the Quote Lines Update trigger flow creates assembly price records. When I change one, I check the other, because the same rule lives in two places.

- Before-save flow -> before trigger -> after trigger -> after-save flow
- Quote type set in both; Apex runs later
- Some groups only in the flow
- Duplicate rules are a maintenance risk

<sub>Also asked as: Before-save flow and before trigger on the same object, which runs first? · Why are there flows and triggers on SBQQ__QuoteLine__c? · How do you avoid conflicts between flows and triggers on quote line?</sub>

### How does CPQ quote data connect to price records and price agreements?
*Mid (3–6 yrs) · concept* · `qtc-cpq-047`

The chain is Opportunity, then the primary SBQQ__Quote__c, then SBQQ__QuoteLine__c, and each line has many AMT_Price_Record__c records through AMT_Quote_Line__c. Price records hold the actual prices and their own variant status and lifecycle stage, and their statuses roll back up to the quote line and from there to the opportunity stage. A price record also has an AMT_Price_Agreement__c lookup. When prices are loaded to SAP, AMT_LoadPRToSAP checks the record's lifecycle stage and starts AMT_LoadPricesToSAPInChunk_Batch for the price agreement. Price agreements group customers through price agreement groups and customers. So CPQ captures the request, and price records and agreements carry the commercial result to SAP.

- Opportunity -> Quote -> Quote Line -> Price Records
- Price record statuses roll up to quote line
- Price record links to AMT_Price_Agreement__c
- SAP load runs per price agreement

<sub>Also asked as: What is the data model from quote to price agreement? · How do quote lines relate to price records and SAP? · How does a CPQ quote line end up in SAP pricing?</sub>

### Price records are approved but the quote line is still not Price Complete. Why could that be?
*Mid (3–6 yrs) · troubleshooting* · `qtc-cpq-048`

In our code the roll-up in recalculateQuoteLineStatus is all or nothing. It counts all price records on the line, and only when every one is Approved or a closed status does it set Price Complete. So the first thing I'd check is whether any record on that line is still Open, for example an insertion or configuration variant that was created Open. Then I'd check AMT_Service__c is listed in the AMT_QuoteLine_Assembly or AMT_QuoteLine_Test label, otherwise no status field is written. I'd also check how the approval was saved: in the price record trigger, the update branch only runs when AMT_HelperClass.firstRun is true, and when the update runs from a batch named in SkipPriceRecordTrigger_BatchJobs, the trigger returns early. RecalculateQuoteLineStatusBatch, which is Schedulable, reapplies the same rule to all lines, so a missed roll-up gets corrected when it runs.

- All price records must be Approved or closed
- Service must be in the assembly/test labels
- firstRun flag and batch skip label can skip the roll-up
- Recalculation batch reapplies the rule

<sub>Also asked as: Quote line status not updating after price record approval · Why is the quote line stuck in With Test Services 1? · Status roll-up from price record to quote line is not working</sub>

## QTC project — Price records, agreements and pricing issues

### What is a Price Record in your QTC project?
*Fresher (0–2 yrs) · concept* · `qtc-pr-001`

In our QTC project a Price Record, AMT_Price_Record__c, is a custom object that sits under the CPQ quote line and holds the actual price we load to SAP. It looks up to SBQQ__QuoteLine__c through AMT_Quote_Line__c, and also to the Price Agreement, the Price Agreement Group, the customer account through AMT_Customer_Name__c and, for test, a Configuration. The key price fields are AMT_BU_Price__c, the business unit price, and AMT_Price_to_Customer__c, the final price. It has two separate status fields: AMT_Variant_Status__c for the sales side, like Open, Approved, Closed Won, Closed Lost, Closed No Bid and Closed Cancel, and AMT_Lifecycle_Stage__c for the SAP side, like Ready for Activation, Activated in SAP, Revised or Expired. Most of the pricing logic runs from AMT_PriceRecordTrigger and AMT_PriceRecordTriggerHandler.

- Child of the CPQ quote line via AMT_Quote_Line__c
- AMT_BU_Price__c vs AMT_Price_to_Customer__c
- AMT_Variant_Status__c = sales status, AMT_Lifecycle_Stage__c = SAP lifecycle

<sub>Also asked as: What is AMT_Price_Record__c? · Explain the price record object in your CPQ project · How did you store prices below the quote line?</sub>

### What are Price Agreements, Price Agreement Groups and Price Agreement Customers in your project?
*Fresher (0–2 yrs) · concept* · `qtc-pr-002`

The Price Agreement Group, AMT_Price_Agreement_Group__c, is the container for one parent customer, stored in AMT_Parent_Customer__c, and it has a type: Regular, M&A or Gold Billing Method Change. Under it, AMT_Price_Agreement_Customer__c records, which we call PACs, add the child accounts, with AMT_State__c as Added or Removed. The Price Agreement, AMT_Price_Agreement__c, is the versioned header that goes to SAP. It has AMT_Version__c, AMT_Revision_Number__c and Status__c, which moves through values like Draft, Submitted for Approval, Submitted for Loading, Active, Inactive and Error. Price records point to both the agreement and the group. When a new agreement is inserted, AMT_PriceAgreementTriggerHandler.updatePAonPAG stamps it on the group's AMT_Price_Agreement__c field, so the group always points at its latest agreement.

- PAG = one parent customer, typed Regular / M&A / Gold Billing Method Change
- PAC = child account with AMT_State__c Added/Removed
- PA = versioned header with Status__c; PAG points to latest PA

<sub>Also asked as: Explain AMT_Price_Agreement__c and AMT_Price_Agreement_Group__c · How is a price agreement structured? · What is a PAG and PAC?</sub>

### What is a Pricing Issue and how does it relate to price records?
*Fresher (0–2 yrs) · concept* · `qtc-pr-003`

A Pricing Issue, AMT_Pricing_Issue__c, is a record that comes in from SAP through our Apex REST service QTC_PricingIssueRestClass at the /pricingIssue URL. It is identified by AMT_piNumber__c and carries things like division, plant, PDL number, lead frame, application code, customer and resolution path. Detail rows are saved in AMT_Pricing_Issue_Detail__c with record types. It is linked to price records through a junction object, AMT_Pricing_Issue_Link__c. Each link changes the counter AMT_Not_Loaded_PIs__c on the price record, and the pricing issue itself gets ABM and Billing report flags based on the linked price records. Links are created automatically when a price record is inserted on a quote line that has AMT_Linked_Pricing_Issue__c, or manually from the aMT_LinkPriceIssueModal component.

- Inbound from SAP via @RestResource '/pricingIssue'
- Junction AMT_Pricing_Issue_Link__c between PI and PR
- PR tracks AMT_Not_Loaded_PIs__c

<sub>Also asked as: What is AMT_Pricing_Issue__c? · Explain pricing issue links · How do pricing issues come into Salesforce?</sub>

### What is PDL in your pricing module?
*Fresher (0–2 yrs) · concept* · `qtc-pr-004`

PDL is the package, dimension and lead count code combination that identifies a package in SAP. On the price record it is stored in three fields: AMT_P_in_PDL__c, AMT_D_In_PDL__c and AMT_L_In_PDL__c. The valid combinations live in AMT_PDL_Master__c, which SAP keeps in sync by calling our REST class QTC_PDLMasterRestClass at /pdlMaster. When a price record gets approved, AMT_PDLRuleBookProcessor works out the codes from rule book data and checks the combination against active PDL master rows, setting AMT_Exists_in_PDL_Master__c to true or false. Then AMT_PriceRecordPDLValidation checks that the PDL codes and other SAP fields are filled before the price can be marked Ready for Activation.

- Three fields: AMT_P_in_PDL__c, AMT_D_In_PDL__c, AMT_L_In_PDL__c
- Master data in AMT_PDL_Master__c from SAP
- Rule book derives codes; validation gates activation

<sub>Also asked as: What does PDL mean on the price record? · Explain package dimension lead codes · What is the PDL master?</sub>

### Explain the lifecycle stages of a price record and how it moves between them.
*Mid (3–6 yrs) · concept* · `qtc-pr-005`

The lifecycle stage tracks the SAP side. After approval, PDL validation sets Not Ready for Activation when SAP fields are missing or Ready for Activation when they are complete; approval itself sets Not Eligible for Activation for cases like configuration-only lines or plant E1. When AMT_LoadPricesToSAPInChunk_Batch sends the agreement to SAP, records go to Activate, and the SAP response batch QTC_PricingUploadResponse_Batch moves Activate to Activated in SAP, and Ready for Expiration to Expired. A failed response sets Load Error. After that, a price change, like test time, configuration or gold base, moves Activated in SAP to Revised. A change to the selected customers moves it to Amended through updateAmended. The trigger also stamps AMT_Previous_Stage__c and AMT_Activate_Previous_Stage__c, so AMT_RecallPriceRecord_Batch can move Activate records back to their previous stage.

- Not Eligible / Not Ready / Ready for Activation after approval
- Activate → Activated in SAP or Load Error from SAP response
- Revised (price change), Amended (customer change), Ready for Expiration → Expired

<sub>Also asked as: What are the AMT_Lifecycle_Stage__c values? · How does a price go from approved to active in SAP? · Price record status flow in your project</sub>

### How is the price record trigger structured?
*Mid (3–6 yrs) · design* · `qtc-pr-006`

We have one trigger, AMT_PriceRecordTrigger, on AMT_Price_Record__c for before insert, after insert, before update, after update and before delete, and it only calls static methods on AMT_PriceRecordTriggerHandler and a few helpers. First it checks AMT_TriggerMechanismHandler.disableTrigger, which reads Trigger_Control__mdt, so we can switch it off without a deployment. Before insert sets currency and opportunity from the quote line, the price agreement group, CPU price, PDL rule book codes, rounding and PDL inherited from the pricing issue. After insert creates pricing issue links and rolls status up to the quote line. Before update handles CPU and BU price, expiry stages, Amended, PDL rule book, PDL validation, revision field reset and rounding. After update creates snapshots, rolls up the quote line status and re-checks ABM billing. Update logic is guarded by the static AMT_HelperClass.firstRun.

- One trigger, logic in AMT_PriceRecordTriggerHandler
- Kill switch via Trigger_Control__mdt
- AMT_HelperClass.firstRun recursion guard on update

<sub>Also asked as: Walk me through AMT_PriceRecordTrigger · How do you organise trigger logic for price records? · What runs in before and after update on price records?</sub>

### How can you switch off a pricing trigger without a deployment?
*Fresher (0–2 yrs) · code* · `qtc-pr-007`

Most pricing triggers, for example AMT_PriceRecordTrigger, AMT_PriceAgreementTrigger and amt_MBP_Trigger, start with a call to AMT_TriggerMechanismHandler.disableTrigger with its own name. That method reads a Trigger_Control__mdt record whose DeveloperName matches the trigger, and if Is_Disabled__c is checked, the trigger body is skipped. Because it is custom metadata, an admin can flip it in setup, for example during a data load. Several handler methods also check a second switch, AMT_Run_Trigger_Setting__mdt with the record Run_ExtensionObject_Trigger, through AMT_Active__c. One thing to note is that AMT_PricingIssueLinkTrigger and PricePrecisionTrigger do not call the kill switch.

- Trigger_Control__mdt.Is_Disabled__c per trigger name
- AMT_Run_Trigger_Setting__mdt for handler-level switches
- Not every trigger uses it

```java
// AMT_TriggerMechanismHandler.cls
public class AMT_TriggerMechanismHandler {
    public static boolean disableTrigger(string triggerName){
        Trigger_Control__mdt tc = [select Is_Disabled__c from Trigger_Control__mdt where DeveloperName=:triggerName];

        return tc.Is_Disabled__c;
    }
}
```

<sub>Also asked as: How do you bypass triggers in your org? · What is Trigger_Control__mdt used for? · trigger kill switch custom metadata</sub>

### How does price record approval work?
*Mid (3–6 yrs) · concept* · `qtc-pr-008`

Approval runs from the amt_ApprovePriceRecords component, which calls AMT_PriceRecordController.approvePriceRecords. The Approve button itself is enabled by enableApprove, based on the quote line status, With Pricing or With BU Pricing, and the user's AMT_Business_Role__c checked against custom labels. In Apex, if a grouped price record is selected, every other price record on that quote line must also be selected. For insertion-only test lines it checks that the linked configuration's quote line is Price Complete. Then it sets AMT_Variant_Status__c to Approved, sets AMT_Approved_Date__c, and copies AMT_BU_Price__c into AMT_Price_to_Customer__c. Some records go straight to Not Eligible for Activation, like configuration-only quote types, plant E1, Characterization or Design service groups, and non-grouped records on a grouped line. It also stamps the Regular price agreement group, and DML errors are returned per record name.

- UI gating via enableApprove + business role labels
- Grouped and linked-configuration checks
- Approved + PTC = BU price; some cases Not Eligible for Activation

```java
// AMT_PriceRecordController.cls
pr.AMT_Variant_Status__c = QTC_Constants.APPROVED;
pr.AMT_Approved_Date__c = system.today();
if(pr.AMT_BU_Price__c != null){
    pr.AMT_Price_to_Customer__c = pr.AMT_BU_Price__c;
}
```

<sub>Also asked as: What happens when you click Approve on price records? · Explain approvePriceRecords · How did you build the price approval logic?</sub>

### How do users close price records as won, lost or cancelled?
*Fresher (0–2 yrs) · scenario* · `qtc-pr-009`

We use the amt_ClosePriceRecords LWC. If all selected records are Open, the only option is Closed No Bid, and that is for pricing users. If they are Approved or already closed, the options are Closed Won, Closed Lost and Closed Cancel, and that is for sales reps. Mixing Open with other statuses shows an error asking to deselect the Open records. Each status has its own list of closure reasons in the component. On submit it calls AMT_PriceRecordController.closePriceRecords, which sets AMT_Variant_Status__c, AMT_Closure_Reason__c, AMT_Closure_Comment__c and Sales_Judged__c. That update then fires the trigger, which rolls the status up to the quote line's assembly or test status.

- Open → Closed No Bid (pricing user)
- Approved/closed → Won/Lost/Cancel (sales rep)
- closePriceRecords sets status, reason, comment, Sales_Judged__c

<sub>Also asked as: How does Closed Won or Closed Lost work on prices? · Explain the close price records component · How do you capture closure reason?</sub>

### How does the price record status roll up to the CPQ quote line?
*Mid (3–6 yrs) · concept* · `qtc-pr-010`

In processQuoteLineFieldUpdates, when a price record's variant status or Sales_Judged__c changes, we collect the quote line Ids and call recalculateQuoteLineStatus. That method runs one aggregate query on AMT_Price_Record__c grouped by quote line, status and Sales_Judged__c. If every price on the line is in the considered set, Approved or one of the closed statuses, the final status is Price Complete when any are Approved; otherwise Closed Won, then Closed Lost, then No Bid, then Cancel, in that priority. The value goes to AMT_Assembly_Status__c or AMT_Test_Status__c depending on whether the service is in the AMT_QuoteLine_Assembly or AMT_QuoteLine_Test label. It also sets AMT_Donot_Recall__c when anything is Approved, and only updates quote lines that actually changed.

- Single aggregate SOQL grouped by quote line
- Priority: Price Complete > Won > Lost > No Bid > Cancel
- Writes only changed quote lines

<sub>Also asked as: How is quote line status calculated from prices? · Explain recalculateQuoteLineStatus · How do you update SBQQ__QuoteLine__c from a child object?</sub>

### What does PDL validation do before a price can be activated?
*Mid (3–6 yrs) · code* · `qtc-pr-011`

AMT_PriceRecordPDLValidation runs in before update through the handler's PDLValidation method, for records on a quote line that are Not Ready or Ready for Activation, with variant status Approved, Closed Won or Closed Cancel. For test and probe it first copies values from the Insertion and Configuration records, like operation code, tester model and number of sites. Then reqFieldsValidation checks required fields by service: for assembly with a PDL, Target or Core price level it needs division, plant, application code, the three PDL codes, lead frame and price to customer. Adders, fast track and insertion lines have their own lists. Missing fields are joined into AMT_SAP_Error_Message__c and the stage becomes Not Ready for Activation; otherwise it becomes Ready for Activation. The same check is exposed as an invocable method for the AMT_MarkReadyForActivation flow.

- Runs in before update, no extra DML
- Service-specific required field lists
- Errors go to AMT_SAP_Error_Message__c; stage Not Ready / Ready

```java
// AMT_PriceRecordPDLValidation.cls
public static String getErrorMessage(String Fieldname){
    if(errorMessage == null || errorMessage == '' )
        errorMessage = Fieldname+' is Empty';
    else
        errorMessage = errorMessage +' ,'+ Fieldname +' is Empty';

    return errorMessage;
}
```

<sub>Also asked as: Explain AMT_PriceRecordPDLValidation · How do you validate price records before sending to SAP? · How is the SAP error message built?</sub>

### How are PDL codes derived using the rule book?
*Mid (3–6 yrs) · concept* · `qtc-pr-012`

AMT_PDLRuleBookProcessor.processPDLInPriceRecords runs in before insert and before update when a price record becomes Approved, and only for quote lines where Is_Pricing_Issue_Exist__c is false. It is metadata driven. AMT_PDL_Rule_Book_Field_Mapping__mdt says, per package family, which quote line field to compare with which rule book field, whether it is a range, and which price record field to fill. The class then builds dynamic SOQL on AMT_Package_Rule_Book_Data__c, AMT_Dimension_Rule_Book_Data__c or AMT_LeadCount_Rule_Book_Data__c to find the matching code. After filling the codes, validatePDL checks the package, dimension and lead combination against active AMT_PDL_Master__c rows. If it matches, it copies the codes into the system code fields and sets AMT_Exists_in_PDL_Master__c to true. For probe insertion, the service group is used in place of the package family.

- Field mapping in AMT_PDL_Rule_Book_Field_Mapping__mdt
- Dynamic SOQL on three rule book objects
- validatePDL against active PDL master

<sub>Also asked as: Explain AMT_PDLRuleBookProcessor · How do you populate package code, dimension code and lead count code? · metadata driven rule book in your project</sub>

### How does a price record inherit PDL from a pricing issue?
*Fresher (0–2 yrs) · code* · `qtc-pr-013`

In before insert, inheritPDLFromPricingIssue looks at non-historic price records whose quote line has AMT_Linked_Pricing_Issue__c set. It skips some service groups listed in QTC_Constants.SERVICE_GROUPS_NO_PI_INHERIT, except Post Test. It reads the pricing issue's AMT_pdlNumber__c and splits it with three small helpers: the package code is the text before the first space, the dimension code is substring(3, 5), the fourth and fifth characters, after trimming and collapsing double spaces, and the lead count is the last four characters. Those go into AMT_P_in_PDL__c, AMT_D_In_PDL__c and AMT_L_In_PDL__c. The quote lines are read in one query using a map, so it works for bulk inserts.

- Only when quote line has a linked pricing issue
- String parsing helpers for P, D and L
- One SOQL for all quote lines

```java
// AMT_PriceRecordTriggerHandler.cls
public static String pdlPackageCode(String pdl){
    Integer sp = pdl.indexOf(' ');
    if (sp <= 0) return '';
    return pdl.substring(0, sp).trim();
}

public static String pdlLeadCountCode(String pdl){
    String t = pdl.trim();
    if (t.length() <= 4) return t;
    return t.substring(t.length() - 4);
}
```

<sub>Also asked as: How do you split the PDL number into codes? · inheritPDLFromPricingIssue explained · How do you parse a PDL string in Apex?</sub>

### How does the PDL master integration with SAP work?
*Mid (3–6 yrs) · concept* · `qtc-pr-014`

SAP calls our Apex REST class QTC_PDLMasterRestClass, mapped to /pdlMaster, with an HTTP POST. We deserialize the body strictly into QTC_PDLMasterWrapper, which has a message with messageID and a list of PDLMaster rows. If messageID is missing we return 400. Otherwise we query existing AMT_PDL_Master__c rows by AMT_concatPDL__c, update only the fields that are not blank, map status A to Active and I to Inactive, create new rows for new keys, and do one upsert. Every call writes an AMT_Interface_Log__c with the request and response payload, cut to fit the field size. On an exception we return a 500 response and also insert an AMT_Error_Log__c with the message and stack trace, trimmed to 255 characters.

- @RestResource '/pdlMaster' with @HttpPost
- Upsert keyed on AMT_concatPDL__c, A/I → Active/Inactive
- AMT_Interface_Log__c always, AMT_Error_Log__c on error

<sub>Also asked as: Explain QTC_PDLMasterRestClass · How does SAP send PDL master data to Salesforce? · inbound REST API for master data in your project</sub>

### How does price record snapshot history work?
*Fresher (0–2 yrs) · concept* · `qtc-pr-015`

When a price record is updated, the after update trigger calls AMT_PriceRecordSnapshotClass.handleSnapshotLogic. It reads the field set Snapshots_Fieldset on AMT_Price_Record__c, and if any of those fields changed, it creates an AMT_Price_Record_Snapshot__c. The snapshot copies the old values of every field that exists with the same API name on both objects, using describe maps, so new fields only need to be added on both objects. System fields are skipped. The name is Snapshot, then the record name, then v plus the counter, and the price to customer is stored rounded to 5 decimals. A before insert trigger on the snapshot, AMT_PriceRecordSnapshotTrigger, then increases AMT_Snapshot_Counter__c on the parent price record.

- Driven by field set Snapshots_Fieldset
- Copies old values by matching API names
- Counter AMT_Snapshot_Counter__c maintained by snapshot trigger

<sub>Also asked as: What is AMT_Price_Record_Snapshot__c? · How do you keep price history? · Explain the snapshot functionality</sub>

### How is price precision or decimal rounding handled?
*Fresher (0–2 yrs) · concept* · `qtc-pr-016`

Precision is configured per price agreement group in the Price_Precisions__c object, with AMT_Service_Group__c, AMT_Service__c and AMT_Decimal_Places__c. If no rule matches, we use 5 decimal places. In the price record trigger, roundPrices runs on insert, and on update only when AMT_BU_Price__c or AMT_Price_to_Customer__c changed. It loads the rules for the record's price agreement group, looks for a service group rule first, then a service rule, and rounds with setScale and HALF_UP. Rules with service group All or All_Test_ServiceGroup are treated as service-level rules. A separate trigger, PricePrecisionTrigger, stops duplicates: the key is group plus service plus service group, and a duplicate gets an addError with the existing record name.

- Price_Precisions__c per PAG; default 5 decimals
- Service group rule first, then service rule, HALF_UP
- PricePrecisionTrigger blocks duplicate rules

<sub>Also asked as: How many decimals do your prices have? · Explain Price_Precisions__c · How do you round prices per customer?</sub>

### Show how you pick the decimal places for a price record.
*Mid (3–6 yrs) · code* · `qtc-pr-017`

The trigger first collects all price agreement group Ids and calls AMT_PricePrecisionHelper.loadPrecisionsForTrigger once. That returns a map keyed by group Id plus service group, or group Id plus service for the All-type rules. Then for each record getPrecisionScale builds both keys and checks the service group key first, then the service key, and falls back to 5. Because it is one query and then map lookups, it is bulk safe. The result is passed to applyPrecision, which does setScale with RoundingMode.HALF_UP. If none of the records in the batch has a price agreement group, processPrecision returns early and nothing is rounded; in a mixed batch, a record without a group falls back to 5.

- One SOQL, map keyed by PAG + group/service
- Service group beats service; default 5
- No PAG in the whole batch = no rounding; mixed batch falls back to 5

```java
// AMT_PricePrecisionHelper.cls
String keyServiceGroup =
    rec.AMT_Price_Agreement_Group__c + String.valueOf(rec.AMT_Service_Group__c);

String keyService =
    rec.AMT_Price_Agreement_Group__c + String.valueOf(rec.AMT_Service__c);

if(rec.AMT_Service_Group__c != null && precisions.containsKey(keyServiceGroup)){
    return precisions.get(keyServiceGroup).AMT_Decimal_Places__c?.intValue() ?? 5;
}

if(rec.AMT_Service__c != null && precisions.containsKey(keyService)){
    return precisions.get(keyService).AMT_Decimal_Places__c?.intValue() ?? 5;
}

return 5;
```

<sub>Also asked as: getPrecisionScale code · How do you look up precision rules in a trigger without SOQL in a loop? · Write the precision lookup logic</sub>

### What does the price precision batch do?
*Mid (3–6 yrs) · concept* · `qtc-pr-018`

When someone changes the precision rules, existing prices need re-rounding, so we have AMT_PriceRecordPrecisionBatch. It is started from the Run_Price_Precisions screen flow through an invocable method called Run Price Precision Batch, with batch size 1000. The constructor reads the price agreement's group and loads its rules. Start queries all price records in that group. Execute rounds price to customer, and BU price too, only when the rounded value is different. If the record was Activated in SAP it moves to Revised so the new price gets loaded again. During the update it sets AMT_PriceRecordTriggerHandler.skipTrigger to true so the trigger's own rounding does not run again, and it flags AMT_Is_Batch_Processing__c on the agreement. The finish method emails the running user using a success or failure template.

- Started from Run_Price_Precisions flow (invocable)
- Changed prices: Activated in SAP → Revised
- skipTrigger static flag + AMT_Is_Batch_Processing__c on PA

```java
// AMT_PriceRecordPrecisionBatch.cls
if(!toUpdate.isEmpty()){
    if(!pAIdset.isEmpty())
        updatePriceAgreement(pAIdset,true);

    AMT_PriceRecordTriggerHandler.skipTrigger = true;
    update toUpdate;
    AMT_PriceRecordTriggerHandler.skipTrigger = false;
    if(!pAIdset.isEmpty())
        updatePriceAgreement(pAIdset,false);
}
```

<sub>Also asked as: Explain AMT_PriceRecordPrecisionBatch · How do you re-round existing prices after changing precision? · How is the precision batch started?</sub>

### A user says the price shows the wrong number of decimals. How would you debug it in this project?
*Senior (7–10 yrs) · troubleshooting* · `qtc-pr-019`

First I would check the record has AMT_Price_Agreement_Group__c filled, because the trigger only rounds when a group is present. Then I would check the Price_Precisions__c rows for that group and whether the service group or service value matches; if nothing matches it falls back to 5. Next, rounding only runs when BU price or price to customer actually changes, so older records keep their old decimals until the precision batch runs from the Run_Price_Precisions flow. I would also check the field names: the trigger reads AMT_Service_Group__c but the batch reads AMT_ServiceGroup__c, so I would confirm both hold the same value. Other paths round on their own, for example CPU and BU calculations and pass-through use 5 decimals, and gold revision does not round, so the trigger's roundPrices is what applies the rule on update. Finally I would compare snapshots for the record to see which update changed the value.

- Check PAG on the record and matching Price_Precisions__c
- Rounding only on change; run the precision batch for old data
- Trigger vs batch read different service group fields

<sub>Also asked as: precision rounding issue on price record · Price to customer has too many decimal places, what do you check? · Rounding is not applied to a price, how do you troubleshoot?</sub>

### How do you create a new price agreement version?
*Mid (3–6 yrs) · concept* · `qtc-pr-020`

From the price agreement group, the amt_Create_Price_Agreement component calls getWrapperClassList. If the latest agreement is not Active or Inactive, it returns An In progress PA exists and blocks the new draft. Otherwise it proposes the next version. On save, checkPriceAgreementName checks the name for duplicates. With no existing agreement it creates version 1 with revision 100; if the name stays the same it keeps the revision, and if the name changes the revision goes back to 100. CreatePriceAgreement makes a Draft, fills Customers__c from the added customers and copies currency, sales org and gold fields, and links AMT_Previous_Price_Agreement_Number__c. Then it starts AMT_UpdatePriceAgreement_PR_Batch with size 2000. That batch locks the new agreement with Approval.lock and moves price records in stages like Activated in SAP, Amended, Revised and Not Ready from the old agreement to the new one, then unlocks it in finish.

- Blocked if latest PA is in progress
- Draft with version+1; revision 100 on new name
- AMT_UpdatePriceAgreement_PR_Batch moves PRs, with Approval.lock

<sub>Also asked as: How does versioning of price agreements work? · Explain amt_Create_Price_Agreement and checkPriceAgreementName · What happens to price records when a new PA version is created?</sub>

### What happens when a price agreement is submitted for approval?
*Mid (3–6 yrs) · concept* · `qtc-pr-021`

The screen flow AMT_Price_Agreement_Submit_for_Approval calls the invocable AMT_PriceAgreementController.getPApriceRelatedRecords. It fails if the agreement has no price in Ready for Activation, Ready for Expiration or Revised. Next it checks duplicates on AMT_Primary_Key__c, both among the new prices and against prices already Activated in SAP on the same agreement, and lists them as source price, then duplicates. If there are none, duringSubmission works out the revision number and refreshes Customers__c and the header fields. currentPrecMetalCheck fills the group's precious metal type if blank, and metalBaseCheck makes sure a gold base is assigned. If that all passes, the flow updates Status__c to Submitted for Approval, with the description of change and the sales sent date.

- Needs at least one Ready for Activation/Expiration or Revised PR
- Duplicate check on AMT_Primary_Key__c
- Revision number, customers, metal base checks, then status update

<sub>Also asked as: Explain the PA submit process · What checks run before a price agreement goes to approval? · AMT_Price_Agreement_Submit_for_Approval flow</sub>

### How is the revision number decided when a price agreement is submitted?
*Senior (7–10 yrs) · concept* · `qtc-pr-022`

Version goes up for every new draft, and revision shows whether the content really changed. In duringSubmission, version 1 just gets its Customers__c and header fields refreshed. For later versions it reads the two latest agreements in the group. If their revisions already differ, it only refreshes fields. If they are equal, it checks three things: if the added customer list changed, revision goes up by one; else if the name changed, revision is set to 100; else if any price on this agreement is Ready For Expiration or Revised, using one aggregate count, revision goes up by one. If nothing changed, it copies the previous revision, sales deal, promotion and sales deal date. Currency, sales org and gold fields always come from the customer accounts. One thing I would improve is that the DML exception in that update is caught and only logged with debug.

- Version = every draft; revision = real change
- Customer change or Revised/Expiring PRs → +1; name change → 100
- No change → copy previous revision and sales deal

<sub>Also asked as: Explain duringSubmission revision logic · When does the PA revision increase? · Version vs revision on price agreements</sub>

### How do you revise a price in this project?
*Mid (3–6 yrs) · scenario* · `qtc-pr-023`

A price that is already Activated in SAP becomes Revised in a few code paths, and then it goes out on the next agreement version. First, in updateCpuPrice, changing test time or index time on an insertion price recalculates BU price and moves Activated in SAP or Amended to Revised. Second, relinking a different configuration stores the old price in AMT_Old_Unit_Price__c, sets AMT_Revision_Type__c to Configuration Change and the revision date. Third, a pass-through price change adjusts price to customer by the difference. Fourth, a gold base revision batch recalculates the price with the gold factor. Fifth, the precision batch can move it to Revised when rounding changes the value. Then the user creates a new agreement version and submits it, because submission needs Revised or Ready prices. When SAP confirms and the stage is Activated in SAP again, resetRevisionFields clears revision date, revision type, revised by, old gold base and old price.

- Test/index time, configuration change, pass-through, gold, precision
- Old price kept in AMT_Old_Unit_Price__c
- resetRevisionFields clears revision data after activation

<sub>Also asked as: What triggers a price revision? · How does a price change after it is active in SAP? · Explain the Revised stage</sub>

### How does the gold or metal base price revision work?
*Senior (7–10 yrs) · code* · `qtc-pr-024`

It starts from the AMT_MBP_Initiate_Revision flow on a metal base price record. For non-market types, amt_initiateRevisionController creates new active AMT_Precious_Metal__c rows for every added customer in the active group, sets the old ones Inactive with yesterday's expiry, and stamps AMT_Last_Revision_Date__c on the group. Market types use amt_priceRevisionMarketController in the same way for a list of groups. Then the flow calls AMT_PriceRecordController.processPriceRecords, which runs AMT_UpdateRevisionPRBatch with size 200. The batch picks prices in those groups with a gold factor above zero, adjusts price to customer by the change in metal base price multiplied by AMT_Gold_Factor_wire__c and divided by 1000, keeps the old values, and moves Activated in SAP to Revised. Finish updates a draft agreement's gold base, clears the batch flag and sends notifications.

- Flow → initiate revision controllers → AMT_Precious_Metal__c
- Batch formula with AMT_Gold_Factor_wire__c / 1000
- Old price and old gold base kept; Activated in SAP → Revised

```java
// AMT_UpdateRevisionPRBatch.cls
decimal calculatedPTC= pr.AMT_Price_to_Customer__c + ((metalbprice-pr.AMT_Gold_Revised_Price__c)*pr.AMT_Gold_Factor_wire__c/1000);

if(pr.AMT_Price_to_Customer__c!=calculatedPTC) {
 pr.AMT_Old_Unit_Price__c = pr.AMT_Price_to_Customer__c;
 pr.AMT_Price_to_Customer__c = calculatedPTC;
 if(pr.AMT_Lifecycle_Stage__c == QTC_Constants.ACTIVATED_IN_SAP){
    pr.AMT_Lifecycle_Stage__c = QTC_Constants.REVISED;
    pr.PA_Published_date__c = Date.Today();
}
}

pr.AMT_Old_Gold_Base_Price__c = pr.AMT_Gold_Revised_Price__c;
pr.AMT_Gold_Revised_Price__c = metalbprice;
```

<sub>Also asked as: Explain AMT_UpdateRevisionPRBatch · How do you reprice when gold base price changes? · Initiate revision for metal base price</sub>

### What does the metal base price trigger do?
*Mid (3–6 yrs) · concept* · `qtc-pr-025`

amt_MBP_Trigger on AMT_Metal_Base_Price__c calls amt_MBP_TriggerHelper. In before insert, updateCurrency copies currency from the price agreement group for Transactional and Special types, and checkDuplicate builds a key from metal, type, currency for Market, and group for Transactional or Special, and compares it with Active and Draft records. The same method checks the user's AMT_Business_Role__c against custom labels when AMT_Validation_Control__c is on: pricing users create Market, sales users create Special or Transactional. Updates that only change Batch_Processing__c skip these checks. In after update, when a record goes from Submitted to Active, updateOldMBP sets the previous metal base price to Inactive with expiry one day before the new effective date. In after insert, updateMetalBaseSharing shares the record with each added customer's account public group. One thing I'd improve: checkDuplicate returns as soon as it sees one Inactive record, which skips the rest of the list.

- Duplicate key by metal/type/currency/PAG
- Role check via labels + AMT_Validation_Control__c
- Inactivate previous MBP; Apex sharing to account groups

<sub>Also asked as: Explain amt_MBP_Trigger · How do you validate AMT_Metal_Base_Price__c? · How are metal base prices shared?</sub>

### How does the price agreement customer trigger handle adding and removing customers on an agreement?
*Mid (3–6 yrs) · concept* · `qtc-pr-026`

AMT_PriceAgreementCustomer on AMT_Price_Agreement_Customer__c does validation in before events and sharing plus roll-ups in after events. Before insert, validatePAForGoldBillingMethod makes sure a customer added to a Gold Billing Method Change group already sits in an active Regular group, and links Regular_Price_Agreement_Customer__c; otherwise it throws PAG-GBM-VALIDATION-ERROR. Before update stops removing a Regular customer while a gold base change is in progress. After insert and update, handlePACPriceAgreementShare inserts AMT_Price_Agreement_Group__Share for the account's public group when the state is Added and deletes it when Removed. amt_PriceAgreemCustTriggerHelper.updatePAGBilling pushes billing method, precious metal type and currency to the group, and, on update, updateIsPrivateFlag sets AMT_Is_Private__c using an aggregate count. It uses AMT_HelperClass.firstRunPAC as a recursion guard.

- Gold Billing Method Change validations
- Apex managed sharing on AMT_Price_Agreement_Group__Share
- Recursion guard firstRunPAC

<sub>Also asked as: Explain AMT_PriceAgreementCustomer trigger · How do you share price agreement groups with accounts? · What validations run on PAC records?</sub>

### How is removing a customer from a price agreement group handled end to end?
*Senior (7–10 yrs) · design* · `qtc-pr-027`

When a PAC's AMT_State__c changes to Removed, the record-triggered flow AMT_Remove_Child_Event publishes a Remove_Child_Event__e platform event. The trigger AMT_Remove_Child_Event_Trigger collects the PAC Ids and starts AMT_PriceAgreementCustomer_Remove_Batch, so the heavy price record work runs asynchronously. The batch finds price records in a group where AMT_Customer_Name__c is the removed account, or AMT_Selected_Customers__c contains its account number. If the price belongs to another customer, it just removes the account number from the list. If it belongs to the removed customer, it unlinks the group and agreement, unless the reason is Gold Billing Method Change, and clones the price for the remaining customers with Is_Cloned__c. The clone gets a new customer and quote line through getUpdateClonedPRAccountQL. Finish calls AMT_GoldBillingChangeHelper.handlePRsForGoldBillingMchange. One weakness is that save results and exceptions are only written to debug logs.

- Flow → platform event → trigger → batch
- Strip account from AMT_Selected_Customers__c, or unlink and clone
- Gold Billing Method Change keeps the PAG link

```java
// AMT_Remove_Child_Event_Trigger.trigger
List<ID> pacRecordIds = new List<ID>();
for (Remove_Child_Event__e childEvent : Trigger.New) {
    pacRecordIds.add(childEvent.PAC_Record_ID__c);
}
AMT_PriceAgreementCustomer_Remove_Batch removeChildBatch = new AMT_PriceAgreementCustomer_Remove_Batch(pacRecordIds);
Database.executeBatch(removeChildBatch);
```

<sub>Also asked as: Explain the Remove Child Customer process · Why did you use a platform event for removing customers? · AMT_PriceAgreementCustomer_Remove_Batch explained</sub>

### A user says the price agreement shows the wrong customer. How would you debug it?
*Senior (7–10 yrs) · troubleshooting* · `qtc-pr-028`

First I would look at the PAC records of the group, because Customers__c is built by allCustomerList from the AMT_Child_Customer_Number__c of PACs in state Added, and it is only refreshed when a draft is created and when it is submitted. So if a customer was added or removed after submit, the header is out of date until the next submit. Second, the header currency, sales org and gold fields come from a PAC query with limit 1, no ORDER BY and no state filter, so with several customers it can pick a removed or different one. That is a real gap I would fix. Third, on the price side I would compare AMT_Customer_Name__c, AMT_Selected_Customers__c and AMT_Previous_Selected_Customers__c, check whether the Remove batch ran by looking at the async job, and check if the record went to Amended. In approvePriceRecords one group Id is applied to all selected records, so mixed customers are worth checking too.

- Customers__c refreshed only at create and submit
- Header fields from LIMIT 1 PAC without ORDER BY or state filter
- Check selected customers, Remove batch run, Amended stage

<sub>Also asked as: price agreement shows wrong customer · Customers on the PA are not correct, what do you check? · Wrong currency or customer on price agreement header</sub>

### How are price records linked to customers and price agreement groups?
*Mid (3–6 yrs) · concept* · `qtc-pr-029`

The main customer is AMT_Customer_Name__c, an Account lookup. In before insert, updateParentAccount finds the PAC whose child account is that customer in a Regular group and sets AMT_Price_Agreement_Group__c. Approval also sets the Regular group. A price can apply to more than one account, so AMT_Selected_Customers__c holds a comma-separated list of account numbers. The amt_singlePRUpdate component edits it through amt_fieldSetHandler.updatePriceRecord, which also saves the earlier list in AMT_Previous_Selected_Customers__c. In before update, updateAmended moves an Activated in SAP price to Amended and clears AMT_Is_Loaded_to_SAP__c when the selected customers change. If the user puts the list back to what it was, comparing sorted lists, it goes back to Activated in SAP.

- AMT_Customer_Name__c + PAC lookup sets the PAG
- AMT_Selected_Customers__c = comma-separated account numbers
- Customer change on active price → Amended; revert restores

```java
// AMT_PriceRecordTriggerHandler.cls
if(oldMap != null && PR.AMT_Lifecycle_Stage__c == 'Activated in SAP'  && PR.AMT_Previous_Selected_Customers__c != null &&
  PR.AMT_Selected_Customers__c != oldMap.get(PR.id).AMT_Selected_Customers__c){
    PR.AMT_Lifecycle_Stage__c = 'Amended';
    PR.AMT_Is_Loaded_to_SAP__c = false;
  }
```

<sub>Also asked as: How does a price record know its customer? · What is AMT_Selected_Customers__c? · When does a price record become Amended?</sub>

### How do users link a price record to a pricing issue?
*Fresher (0–2 yrs) · concept* · `qtc-pr-030`

We use the aMT_LinkPriceIssueModal component. It calls AMT_PricingIssueController.getPriceIssueRecords, which shows pricing issues that are not Closed, for the quote's opportunity account and the added customers of the group, with an optional search on number, division, plant or PDL. When the user links, linkPriceRecordsToPricingIssues blocks expired prices and prices in approval or waiting for SAP. Then it matches fields: the division code must fit the service, for example 02 for assembly and 01 for test, plus the plant and the PDL split into three parts. Assembly-type services also need application code and lead frame to match. Matching pairs are inserted as AMT_Pricing_Issue_Link__c, and the message lists any records that did not match or were not eligible.

- PI list filtered by account and not Closed
- Division, plant, PDL (+ application and lead frame for assembly)
- Blocks expired, in-approval or waiting-for-SAP prices

<sub>Also asked as: Explain the Link Price Issue modal · How do you match price records with pricing issues? · What checks run before creating a pricing issue link?</sub>

### What does the pricing issue link trigger do?
*Fresher (0–2 yrs) · code* · `qtc-pr-031`

AMT_PricingIssueLinkTrigger calls AMT_PricingIssueLinkTriggerHandler. After insert, updatePriceRecords adds one to AMT_Not_Loaded_PIs__c on the price record, sets AMT_Historic_Path__c to Standard and sets AMT_Is_Loaded_to_SAP__c to false so it gets sent again. Before delete, it subtracts one, never going below zero. It also calls AMT_UpdateABMNBilling to re-check the ABM and Billing flags on the pricing issue after insert and after delete. When a pricing issue is closed, AMT_PricingIssueTriggerHandler.recalculateNotLoadedPIsOnClose recounts the open linked issues for each price record, so the counter is corrected with an absolute count instead of plus or minus.

- +1 / -1 on AMT_Not_Loaded_PIs__c
- Resets AMT_Is_Loaded_to_SAP__c
- Absolute recount when a PI is closed

```java
// AMT_PricingIssueLinkTriggerHandler.cls
if(isDelete) {
    pr.AMT_Not_Loaded_PIs__c = (pr.AMT_Not_Loaded_PIs__c == null || pr.AMT_Not_Loaded_PIs__c == 0) ? 0 : pr.AMT_Not_Loaded_PIs__c - 1;
    if(pr.AMT_Not_Loaded_PIs__c > 0){
    pr.AMT_Is_Loaded_to_SAP__c = false;
    }
} else {
    pr.AMT_Not_Loaded_PIs__c = (pr.AMT_Not_Loaded_PIs__c == null) ? 1 : pr.AMT_Not_Loaded_PIs__c + 1;
    pr.AMT_Historic_Path__c = QTC_Constants.STANDARD;
    pr.AMT_Is_Loaded_to_SAP__c = false;
}
```

<sub>Also asked as: Explain AMT_PricingIssueLinkTrigger · How do you maintain the not loaded PI count? · What happens when a pricing issue link is deleted?</sub>

### How are the ABM and Billing report flags on pricing issues calculated?
*Senior (7–10 yrs) · concept* · `qtc-pr-032`

AMT_UpdateABMNBilling decides AMT_Include_in_ABM_Report__c and AMT_Include_in_Billing_Report__c on a pricing issue from its resolution path and its linked price records. For Free Of Charge or PO Validation, both flags are true only when AMT_Approval_Status__c is Approved. For Adhoc or Monthly, both are true only if every linked price is Approved or Closed Won and in Not Eligible for Activation. For Standard or Missing test code only, ABM is true when every linked price is Approved or Closed Won and none is in Not Eligible, Not Ready or Ready for Activation, and Billing stays false. It re-runs from link insert and delete, from pricing issue changes to resolution path or approval status, and from price stage or status changes. On price record delete, the links are read before the cascade delete and the check runs in a future method. AMT_RecalculateABMNBillingBatch recalculates all issues, clears approval status where not needed, and emails a CSV summary.

- Three scenarios by resolution path
- Re-evaluated from PIL, PI and PR triggers
- Full recalculation batch with CSV email

<sub>Also asked as: Explain AMT_UpdateABMNBilling · What is AMT_RecalculateABMNBillingBatch? · How do you decide if a pricing issue is included in billing?</sub>

### How do historic prices work on a price record?
*Mid (3–6 yrs) · concept* · `qtc-pr-033`

Historic prices let one price also be loaded into older agreement versions whose sales deal covers the pricing issue date. In amt_addHistoricPrices, createHistoricPricesFromPR finds links to In Progress pricing issues, takes the oldest pricing date, and keeps agreements in the group with a different sales deal whose sales deal dates pass the filterValidAgreements check against that date. The user picks agreements and prices, and submitAddHistoricPrices saves them in AMT_Aged_PRs__c in the format price record, agreement, price, separated by semicolons. It also sets AMT_Multi_Price__c and AMT_Historic_Path__c to Custom, and UNDO clears it. clonePR creates the copies with AMT_Is_Historic_Price__c true, Is_Cloned__c true and stage Ready For Expiration. In the automatic path, if gold bases differ, the price is adjusted by the gold factor.

- Eligible PAs by sales deal dates vs PI oldest pricing date
- Selections stored in AMT_Aged_PRs__c
- Clones are historic, Ready For Expiration

```java
// AMT_PriceAgreementController.cls
AMT_Price_Record__c clone = pr.clone();
clone.AMT_Clone_From__c = pr.Id;
clone.AMT_Lifecycle_Stage__c = QTC_Constants.READY_FOR_EXPIRATION;
clone.PA_Published_date__c = DateTime.now();
clone.Is_Cloned__c = true;
clone.AMT_Is_Loaded_to_SAP__c = false;
clone.AMT_Not_Loaded_PIs__c = 0;
clone.AMT_Previous_Selected_Customers__c = null;
clone.AMT_Is_Historic_Price__c = true;
```

<sub>Also asked as: Explain amt_addHistoricPrices · What are aged price records? · How do you create historic price records for older price agreements?</sub>

### How does the PA error automation recover failed SAP price loads?
*Senior (7–10 yrs) · design* · `qtc-pr-034`

PAErrorHourlyReportEmailJob is a schedulable class. It first aborts old monitor jobs, then calls PAError_Automation.run(true). That looks at agreements in Error or with chunk status Request Failed or Response Failed and handles up to five groups per run. For each group it fixes stages by rule. For example, on an active agreement a Load Error with no message or with Error Price Uploading in IDoc, or a Revised price, goes back to Ready for Activation. A Load Error with Existing in the message is treated as already loaded, so it becomes Activated in SAP and Closed Won, and an Activate price whose load did not complete goes back to its previous stage. It resets the chunk status and builds a text report. Then PAError_PerPRBatchSubmitCoordinator, a queueable, submits AMT_LoadPricesToSAPInChunk_Batch per agreement and price pair, at most five each time, and chains itself for the rest. PAError_BatchMonitorSched polls the jobs, up to 30 checks and five attempts, and emails the result. The hourly job also emails a CSV error report and starts RecalculatePriceRecordStatusBatch.

- Hourly schedulable → PAError_Automation.run(true)
- Rule-based stage repair, up to 5 groups per run
- Queueable chaining, max 5 executeBatch per hop, monitor polling

```java
// PAError_PerPRBatchSubmitCoordinator.cls
while (i < total && submitted < maxBatchSubmissionsPerTxn) {
    String paStr = paIdsFlat[i];
    String prStr = prIdsFlat[i];

    Id paId = tryCastId(paStr);
    Id prId = tryCastId(prStr);
    if (paId == null || prId == null) {
        hopLog += 'WARN: Skipping invalid pair at index ' + i +
                  ' (pa=' + String.valueOf(paStr) + ', pr=' + String.valueOf(prStr) + ')\n';
        i++; continue;
    }
```

<sub>Also asked as: Explain PAError_Automation · How do you auto-fix load errors on price agreements? · How do you schedule many batch jobs safely?</sub>

### What do the price record and quote line status recalculation batches do?
*Mid (3–6 yrs) · concept* · `qtc-pr-035`

RecalculatePriceRecordStatusBatch fixes variant status in bulk. Approved or Open prices in Activated in SAP, Revised or Amended become Closed Won. Approved non-historic prices older than six months, still in Not Eligible, Not Ready or Ready for Activation, or Expired, outside service groups like adders and Post Test, and not from an NBO lead source, become Closed Cancel with reason Other and a comment from a custom label. It uses Database.update with allOrNone false, counts success and failure, and keeps CSV detail rows up to MAX_DETAIL_ROWS of 75000. Its scheduled entry point is RecalculateQuoteLineStatusBatch.execute, and the price batch hands its CSV to the quote line batch in finish. The quote line batch reapplies the same roll-up rules to quote lines. It turns off CPQ triggers with SBQQ.TriggerControl.disable around the update and always re-enables them.

- Closed Won for loaded prices; Closed Cancel for stale ones
- Partial-success DML with CSV reporting
- Quote line batch disables CPQ triggers during update

<sub>Also asked as: Explain RecalculatePriceRecordStatusBatch · How do you auto-close old price records? · RecalculateQuoteLineStatusBatch explained</sub>

### How is the SAP pricing upload response processed?
*Mid (3–6 yrs) · concept* · `qtc-pr-036`

SAP posts the load result to QTC_PricingUploadResponseRest at /pricingUploadResponse. We do not process it in the request. We deserialize it, write an interface log, return 200, and schedule QTC_PricingUploadResponse_Scheduler to run about ten seconds later. The scheduler aborts its own job. If any of the agreements still has AMT_Is_Batch_Processing__c true, it schedules itself again. Otherwise processJSONResponse updates each agreement: success fills sales deal and promotion details, a real end date makes it Inactive, and failures set Error with the SAP message. Failed prices become Load Error, and the previous agreement is set Inactive with an expiry date. Then QTC_PricingUploadResponse_Batch moves Activate to Activated in SAP and Ready for Expiration to Expired, and moves prices to the newer agreement version when they are not locked.

- Fast 200 response, processing deferred to a scheduler
- Waits while PA is batch-processing
- Batch finalises Activated in SAP / Expired stages

<sub>Also asked as: Explain QTC_PricingUploadResponseRest · What happens when SAP replies to a price load? · Why do you schedule processing of the inbound response?</sub>

### How did you build bulk update of price records?
*Mid (3–6 yrs) · concept* · `qtc-pr-037`

The bulk screen is amt_ManagePricingRecord_Bulk, backed by the Apex class amt_ManagePricingRecords. getQuoteLineServiceName reads the service of the selected prices, and getProfileFieldSetData picks field sets from the custom metadata AMT_Price_Records_FieldSet_Profile__mdt by service and single price turnkey, then returns field label, API name, type and required flag. The LWC renders those fields, and on save it sends key-value pairs as JSON to updateMultipleRecords. That method builds one AMT_Price_Record__c per selected Id with put, converts values with Decimal.valueOf except the cost model text fields, and does one update. DML errors come back as an AuraHandledException. Whether the bulk button is shown is decided by AMT_PriceRecordController.disableBulk, using quote line status and business role.

- Fields come from AMT_Price_Records_FieldSet_Profile__mdt
- Dynamic sObject put + single update
- Visibility via disableBulk

<sub>Also asked as: Explain amt_ManagePricingRecord_Bulk · How do you edit many price records at once? · metadata driven field sets in LWC</sub>

### How were legacy prices migrated into price records?
*Fresher (0–2 yrs) · concept* · `qtc-pr-038`

We used a batch class, AMT_createDMPriceRecords, which takes a price agreement Id and reads Staging_Object__c rows for it. Each row has a sheet name like Assembly, Test or Lot Adders, plus PDL, plant, price level, device, customer and price. To make it safe to re-run, each price record gets AMT_Data_migration_key__c built from quote, sheet name and row number. Before inserting, we query existing keys and skip rows already loaded. Prices are rounded to 5 decimals, a one-digit division is padded with a zero, and descriptions for AMT_Price_Agreement_Section__c are escaped with escapeHtml4. Price records and sections are inserted in one statement each per batch chunk.

- Source: Staging_Object__c per PA
- Idempotent via AMT_Data_migration_key__c
- Price setScale(5); sections escaped

```java
// AMT_createDMPriceRecords.cls
for(AMT_Price_Record__c pr : [select id, AMT_Data_migration_key__c from AMT_Price_Record__c where AMT_Data_migration_key__c IN: SO_DM_keyList]){
    PR_DM_keyList.add(pr.AMT_Data_migration_key__c);
}

for(Staging_Object__c so: scope){
    string DM_key = so.quote__c+so.sheet_Name__c+so.Row_Number__c;
    if(PR_DM_keyList.contains(DM_key)){
        continue;
    }
```

<sub>Also asked as: Explain AMT_createDMPriceRecords · How did you do data migration for price agreements? · How do you avoid duplicate records in a data migration batch?</sub>

### How are CPU price and BU price calculated for test insertion quotes?
*Mid (3–6 yrs) · code* · `qtc-pr-039`

In updateCpuPrice, the hourly price is the price to customer of the Configuration or Blended type price record on the same configuration. CPU price is hourly price divided by 3600, rounded to 5 decimals HALF_UP. For Probe Insertion with CPU flag Yes, CPU price is set to zero. BU price depends on the service group. Singulated Test Insertion uses test time plus index time, times CPU price divided by the MSF factor, and the factor comes from the configuration's MSF setting. SLT Insertion divides by number of sites in parallel. Probe Insertion uses test plus index time times gross die per wafer over sites, plus wafer changeover time, times CPU price. This runs on insert when Approved, and on update when status becomes Approved, test or index time changes, or the configuration changes. Price to customer then follows BU price unless the user changed it, and a time change on an active price moves it to Revised.

- CPU price = hourly / 3600, 5 decimals
- Different BU formulas for Singulated, SLT and Probe insertion
- Time change on Activated in SAP → Revised

```java
// AMT_PriceRecordTriggerHandler.cls
if(priceRecNew.AMT_Hourly_Price__c!=null){
 decimal calcCpuPrice=priceRecNew.AMT_Hourly_Price__c/3600;
 calculatedCpuPrice=calcCpuPrice.setScale(5, RoundingMode.HALF_UP);
}
Decimal sltBuPriceRound = (sltTestTime + sltIndexTime) * (calculatedCpuPrice / priceRecNew.AMT_Number_of_Sites_in_Parallel__c);
priceRecNew.AMT_BU_Price__c = sltBuPriceRound.setScale(5, RoundingMode.HALF_UP);
```

<sub>Also asked as: Explain updateCpuPrice · How is BU price derived from test time and index time? · insertion pricing calculation in your project</sub>

### A user says the price to customer on a price record is wrong. How would you debug it?
*Senior (7–10 yrs) · troubleshooting* · `qtc-pr-040`

First I would list who can write AMT_Price_to_Customer__c. Approval copies BU price into it. updateCpuPrice recalculates BU price and price to customer for insertion lines. A pass-through change adds the difference. The gold revision batch adjusts it by the gold factor. Rounding comes from Price_Precisions__c. Historic clones and the SAP response batch can also set it. Then I would open the record's AMT_Price_Record_Snapshot__c history, which keeps old values with a version counter, and check AMT_Old_Unit_Price__c, AMT_Revision_Type__c and AMT_Revision_Date__c to see if a revision ran. For insertion prices I would check the configuration's hourly price, test time, index time, sites and MSF. Many handler methods catch exceptions and log them to AMT_Error_Log__c through ExceptionHandler instead of failing the save, so I would query that object for the time of the change. Last, I would reproduce it in DevQTCTest with a debug log.

- List all writers of AMT_Price_to_Customer__c
- Use snapshots and revision fields as history
- Check AMT_Error_Log__c because errors are swallowed

<sub>Also asked as: The quote price is wrong, how do you troubleshoot it in your CPQ project? · Price to customer changed unexpectedly · How would you find which process changed a price?</sub>

### A batch updated price records but the quote line status and snapshots did not change. Why could that happen?
*Senior (7–10 yrs) · troubleshooting* · `qtc-pr-041`

There are three guards in AMT_PriceRecordTrigger that can explain it. First, when System.isBatch is true, the trigger reads a batch class name and compares it with the custom label SkipPriceRecordTrigger_BatchJobs. If it is in the list, the trigger only rounds prices in before update and then returns, so no snapshots or roll-ups happen. Second, update logic runs only while AMT_HelperClass.firstRun is true, and after update sets it to false. So a second update of price records in the same transaction skips the whole update path. Third, AMT_PriceRecordTriggerHandler.skipTrigger turns off rounding, which the precision batch uses. I'd also point out one risk: the batch check queries any AsyncApexJob that is Processing with LIMIT 1, not the current job, so with several batches running it can read the wrong class name. Having the batch set a static flag or pass its own job Id would be safer.

- Label SkipPriceRecordTrigger_BatchJobs short-circuits the trigger
- Static firstRun stops a second update in one transaction
- Batch name lookup uses LIMIT 1 on any processing job

```java
// AMT_PriceRecordTrigger.trigger
if (System.isBatch()) {
    Id batchJobId = [SELECT ApexClassId FROM AsyncApexJob WHERE JobType = 'BatchApex' AND Status = 'Processing' LIMIT 1].Id;
    AsyncApexJob batchJob = [SELECT ApexClass.Name FROM AsyncApexJob WHERE Id = :batchJobId];
    String batchJobName = batchJob.ApexClass.Name;
    List<String> skipTriggerForthisBatches=System.Label.SkipPriceRecordTrigger_BatchJobs.split(';');
    if(Trigger.isBefore &&Trigger.isUpdate){
        AMT_PriceRecordTriggerHandler.roundPrices(Trigger.new, Trigger.oldMap);
    }
     if(skipTriggerForthisBatches.contains(batchJobName)){
        return;
    }
}
```

<sub>Also asked as: Price record trigger did not run during batch · Why is trigger logic skipped in some transactions? · Explain SkipPriceRecordTrigger_BatchJobs</sub>

### How do you handle and log errors in the pricing code?
*Fresher (0–2 yrs) · concept* · `qtc-pr-042`

We have a shared class, ExceptionHandler, with a log method that takes the exception and the source class and inserts an AMT_Error_Log__c with the type, message, stack trace and source. There is also an overload that logs failed Database.SaveResult rows. Most pricing handler methods, like updateCpuPrice, assignCurrency and roundPrices callers, wrap their logic in try-catch and call ExceptionHandler.log, so the save goes through and the error is recorded. Integrations log more. QTC_PDLMasterRestClass and QTC_PricingIssueRestClass write an AMT_Interface_Log__c with request and response payload on every call, plus an AMT_Error_Log__c with message ID on failure. User-facing controllers like approvePriceRecords turn DML errors into an AuraHandledException listing record names.

- ExceptionHandler.log → AMT_Error_Log__c
- AMT_Interface_Log__c for every inbound REST call
- AuraHandledException with per-record messages for LWCs

```java
// ExceptionHandler.cls
AMT_Error_Log__c errorLog = new AMT_Error_Log__c();

errorLog.AMT_errorDescription__c =  e.getTypeName()+':'+e.getMessage();
errorLog.AMT_errorStackTrace__c = e.getStackTraceString();
errorLog.AMT_errorType__c = 'Apex';
errorLog.AMT_errorSource__c = sourceClass;

errorLog.AMT_messageId__c = messageId;
errorLog.AMT_objectId__c = objectId;
errorLog.AMT_interfaceType__c = interfaceType;

insert errorLog;
```

<sub>Also asked as: What is ExceptionHandler in your project? · How do you log integration errors? · Where do you look when a pricing process fails silently?</sub>

### How is the pricing code tested?
*Fresher (0–2 yrs) · concept* · `qtc-pr-043`

Each class has its own test class, for example AMT_PriceRecordTriggerHandler_Test, AMT_PriceRecordPrecisionBatchTest, QTC_PDLMasterRestClassTest and PAError_Automation_Test. The trigger handler test uses @testSetup to create accounts, a test user, account team members and related records, then runs each scenario between Test.startTest and Test.stopTest with asserts, for example that currency and opportunity are copied from the quote line, and that the right number of pricing issue links are created. REST tests build a RestRequest body and set RestContext.request and response before calling the POST method. PAError_Automation has @TestVisible switches like DISABLE_ASYNC_IN_TESTS and DISABLE_DML_IN_TESTS, and LAST_REPORT for asserts. Some older tests mainly check that the response is not null, so stronger asserts would help. Our repo rules also ask for check-only deploys and real test runs before saying a change is done.

- Per-class tests with @testSetup and startTest/stopTest
- RestContext setup for REST classes
- @TestVisible switches for async and DML

<sub>Also asked as: How do you write test classes for these triggers and batches? · How do you test REST services in Apex? · Explain your testing approach for pricing</sub>

### How do you handle bulk data and governor limits in the pricing layer?
*Senior (7–10 yrs) · design* · `qtc-pr-044`

The handlers follow the usual pattern: collect Ids in sets, run one query with IN, and work from maps. For example, recalculateQuoteLineStatus uses one aggregate query for all quote lines, and precision rules are loaded with one query per trigger run. Most field changes are made in before triggers, so there is no extra DML. Heavy work is moved to batches with set scope sizes: 2000 for moving prices to a new agreement, 1000 for precision, 200 for gold revision and 100 for status recalculation. Several use Database.update with allOrNone false for partial success, and the error coordinator submits at most five batches per queueable hop and chains the rest. There are some weak spots I can point to: handlePACPriceAgreementShare runs a query and a delete inside a loop for removed customers, checkPriceAgreementName queries every agreement in the org to check names, and checkDuplicate on metal base price queries all active and draft records without a filter.

- Sets + IN queries + maps, logic in before triggers
- Batches with tuned scope sizes and partial DML
- Known hotspots: SOQL/DML in loop, unfiltered queries

<sub>Also asked as: How is the price record trigger bulkified? · Governor limits in your pricing batches · Where are the bulkification risks in this code?</sub>

### What would you improve in the pricing code?
*Senior (7–10 yrs) · design* · `qtc-pr-045`

A few things are visible in the code. In AMT_PriceRecordSnapshotClass the hasfieldChanged flag is declared outside the loop and never reset, so after one changed record, every later record in the batch gets a snapshot. It also compares AMT_Price_Agreement__r.AMT_Version__c, which is not loaded in trigger context. The snapshot trigger sets a blank counter to 1 and then adds 1, so the first value is 2. Several places swallow errors with only System.debug, like runPDLValidtion, AMT_UpdatePriceAgreement_PR_Batch and the remove-customer batch, so I would log them through ExceptionHandler. QTC_PricingIssueRestClass removes the text null from the whole JSON body, which would also change real values that contain that word. The LWCs compare exact Apex result strings and reload the page, and PAError_BatchMonitorSched has a hard-coded fallback email address. I would move those to labels or constants.

- Snapshot flag not reset; relationship field in trigger; counter starts at 2
- Silent catches → use ExceptionHandler
- String-matched results, replaceAll('null',''), hard-coded email

<sub>Also asked as: What technical debt do you see in this module? · If you had time, what would you refactor? · Any bugs you found in the price record code?</sub>

## QTC project — Integration, batch and async

### How does your QTC project integrate with SAP?
*Fresher (0–2 yrs) · concept* · `qtc-int-001`

In our QTC project the SAP integration goes both ways, and it's asynchronous by design. Outbound, we send approved prices to SAP from a batch class, AMT_LoadPricesToSAPInChunk_Batch, which POSTs JSON to the named credential PricingUploadApi. Inbound, SAP calls our Apex REST services: /pricingUploadResponse for the result of a price load, /customerMaster and /customerHierarcy for customer data, /pdlMaster for package master data, and /pricingIssue for pricing issues. Every call, in or out, is written to AMT_Interface_Log__c, and failures go to AMT_Error_Log__c. The price load is asynchronous on both sides: we send the data, SAP accepts it, and later SAP posts the result back to our response API. When I explain this to the business, the key point is that "accepted by SAP" and "active in SAP" are two different moments, and our statuses show both.

- Outbound: AMT_LoadPricesToSAPInChunk_Batch -> callout:PricingUploadApi
- Inbound: five @RestResource classes (QTC_* RestClass)
- Logging: AMT_Interface_Log__c and AMT_Error_Log__c
- Price load result comes back asynchronously via /pricingUploadResponse

<sub>Also asked as: What integrations did you have in your CPQ project? · Explain the SAP integration in your project · How does Salesforce talk to SAP in your project? · is your quote to cash project integrated with SAP</sub>

### Walk me through how prices are sent to SAP end to end in your project.
*Mid (3–6 yrs) · concept* · `qtc-int-002`

The flow has three stages: pick, send, and confirm. It starts when a Price Agreement is in status 'Submitted for Loading'. QTC_LoadPricesToSAPScheduler starts AMT_LoadPricesToSAPInChunk_Batch with scope 2000. In start(), the batch picks agreements whose SAP load date is today or earlier and that are not already being processed. It sets AMT_Is_Batch_Processing__c = TRUE and chunk status 'Request In Progress', then queries the price records ordered by agreement. In execute(), each record is validated and mapped into QTC_PricingUploadRequestWrapper, in sections like assyTarget, testPdl or lotCodeAdder depending on service and price level. The record moves to stage 'Activate' and the request is POSTed to SAP. SAP answers 200 or 202 to say it accepted the message. Later SAP posts the real result to /pricingUploadResponse. Then QTC_PricingUploadResponse_Batch moves the records to 'Activated in SAP' and makes the agreement 'Active'. When someone on the team changes this flow, the first thing I check is that the lock and the stage changes still pair up, because that's what keeps two runs from sending the same prices.

- Trigger: QTC_LoadPricesToSAPScheduler (also flows / LWC for single PRs)
- Build: QTC_PricingUploadRequestWrapper via AMT_LoadPricesToSAPInChunk_Helper
- Send: callout:PricingUploadApi, 200/202 = accepted
- Finish: SAP response API -> QTC_PricingUploadResponse_Batch

<sub>Also asked as: How does the price upload to SAP work? · Explain the SAP pricing upload flow step by step · What happens after a price agreement is submitted for loading? · how do activated prices reach SAP</sub>

### How does the chunking work when you send price records to SAP?
*Senior (7–10 yrs) · design* · `qtc-int-003`

We chunk by agreement first and by size second. The batch queries price records ordered by AMT_Price_Agreement__c. In execute it starts a new request whenever the agreement changes, or when the record count reaches maxPRLimit. maxPRLimit comes from the custom label QTC_Pricing_Upload_Batch_Limit. All chunks of one agreement share the same messageID, which is kept in a stateful map. Each message carries totalRecords, totalMessages, messageSequence and count, so SAP can put the pieces back together. The batch also tracks how many records it has processed per agreement. While that number is lower than the total, the chunkStatus sent is 'Request In Progress'. On the last chunk it sends 'Completed' and releases the AMT_Is_Batch_Processing__c lock. The trade-off is clear: smaller chunks are safer on payload size, but more messages mean more callouts per transaction, so the label is the knob we tune with SAP rather than a code change.

- Records ordered by agreement; new message on PA change or limit
- Same messageID per agreement across chunks (stateful map)
- totalMessages = ceil(totalRecords / maxPRLimit)
- chunkStatus: Request In Progress -> Completed

```java
// AMT_LoadPricesToSAPInChunk_Batch.cls
if(totalRecords <= this.maxPRLimit) {
    totalMessages = 1;
} else {
    totalMessages = (totalRecords / this.maxPRLimit);
    if(Math.mod(totalRecords, this.maxPRLimit) > 0) {
        totalMessages++;
    }
}
```

<sub>Also asked as: Why is it called LoadPricesToSAPInChunk? · How do you split a big price agreement into multiple SAP messages? · How does SAP know all chunks of an agreement have arrived? · explain message sequence and total messages in your SAP payload</sub>

### Why does your SAP load batch implement Database.Stateful and Database.AllowsCallouts?
*Fresher (0–2 yrs) · concept* · `qtc-int-004`

Both are required, and each one solves a different problem. AllowsCallouts is needed because execute() makes an HTTP callout to SAP. Without it, the platform blocks callouts from a batch. Stateful is needed because one agreement's records can be split across several execute calls. The batch keeps maps between chunks: the messageID per agreement, the message sequence, the total and processed record counts, the agreements that already failed, and the multi-price records that need a historical follow-up in finish(). Without Stateful, those maps would reset on every chunk. Then the sequence numbers and the 'Completed' chunk status would be wrong. In review I keep an eye on what goes into those stateful maps, because everything there is serialized between chunks and adds to heap.

- AllowsCallouts: needed for http.send in execute
- Stateful: keeps per-agreement counters/messageID across chunks
- failedPriceAgreementIds also carried across chunks

<sub>Also asked as: What interfaces does AMT_LoadPricesToSAPInChunk_Batch implement? · Why stateful in the pricing batch? · Can you make callouts from batch apex, how did you do it? · why allows callouts in batch</sub>

### What statuses does a Price Agreement go through during the SAP load?
*Fresher (0–2 yrs) · concept* · `qtc-int-005`

We track it on two fields, one for the business and one for the transfer, and I always explain them separately. On AMT_Price_Agreement__c, Status__c is the business status: 'Submitted for Loading' to start. It becomes 'Connectivity Failure' when SAP returns a non-200/202 code, 'Error' for validation or SAP master-quote errors, 'Active' after a successful response, and 'Inactive' when SAP sends a real sales-deal end date. AMT_Chunk_Status__c tracks the technical transfer. 'Pending' or 'Request Failed' can be picked up again. While sending, it is 'Request In Progress'. After the last chunk it is 'Completed'. Then SAP's response sets it to whatever chunkStatus SAP sends, like 'Success' or 'Response Failed'. A third field, AMT_Is_Batch_Processing__c, works as a lock so two jobs don't process the same agreement. For support, that split matters: a business user looks at Status__c, while whoever is on support looks at the chunk status and the lock.

- Status__c: Submitted for Loading / Connectivity Failure / Error / Active / Inactive
- AMT_Chunk_Status__c: Pending, Request In Progress, Completed, Request Failed, Success, Response Failed
- AMT_Is_Batch_Processing__c = lock flag
- Values come from QTC_Constants

<sub>Also asked as: Explain Status__c and AMT_Chunk_Status__c on the price agreement · What is chunk status in your project? · How do you know if a price agreement is loaded in SAP? · what does connectivity failure status mean</sub>

### How does a price record's lifecycle stage change when it is loaded to SAP?
*Mid (3–6 yrs) · concept* · `qtc-int-006`

The stage tells you exactly where a price is in the SAP round trip. Records in 'Ready For Activation' or 'Amended' are eligible to send. So are 'Revised' and 'Activated in SAP' for non-delta agreements. When the batch adds a record to a request, it saves the current stage in AMT_Activate_Previous_Stage__c and sets the stage to 'Activate'. That means it was sent and we are waiting for SAP. When SAP's response comes back with success, QTC_PricingUploadResponse_Batch moves 'Activate' to 'Activated in SAP'. It also moves 'Ready For Expiration' records and the previous price record to 'Expired'. If our own validation fails, or SAP returns the record with an error, the stage becomes 'Load Error' and the message goes into AMT_SAP_Error_Message__c. Saving the previous stage is the part I'd defend hardest in a design review, because it's what makes a clean recall possible.

- Eligible: Ready For Activation, Amended (+ Revised / Activated in SAP)
- Sent: Activate (previous stage saved for recall)
- Success: Activated in SAP; old ones Expired
- Failure: Load Error + AMT_SAP_Error_Message__c

<sub>Also asked as: What lifecycle stages does AMT_Price_Record__c have around SAP? · What is the Activate stage in your price records? · When does a price record become Activated in SAP? · what is load error stage</sub>

### SAP load failed for some records — what happens in your project?
*Senior (7–10 yrs) · scenario* · `qtc-int-007`

It depends on where it failed, so the first question I ask is: our side or SAP's side? If our own checks fail first, like field length from AMT_Pricing_Upload_Field_Length__mdt, an SID longer than 11 digits, or an operation code that is too long, the record is set to 'Load Error' with the reason. The agreement gets chunk status 'Request Failed' and usually Status 'Error'. The status stays as it is only if the record is already flagged AMT_Is_Loaded_to_SAP__c. An AMT_Error_Log__c is created, and that agreement is not sent at all. Because failedPriceAgreementIds is stateful, one bad record blocks its whole agreement. If SAP accepts the message but rejects lines, SAP posts them back to /pricingUploadResponse. Every record named in the response becomes 'Load Error' with 'Err SAP_MQ' plus SAP's message. If SAP's overall chunkStatus is 'Success', the other records still move to 'Activated in SAP'. To fix it, the user corrects the record and loads it again. The hourly PAError job also lists these in its email.

- Salesforce-side validation -> PR Load Error, PA Error, whole PA not sent
- SAP-side rejection -> listed PRs set to Load Error via response API
- Error text in AMT_SAP_Error_Message__c; logs in AMT_Error_Log__c
- Reported by PAErrorHourlyReportEmailJob

<sub>Also asked as: Some price records failed to load into SAP, how is it handled? · What if SAP rejects a few lines of a price agreement? · How do you handle partial failures in the SAP integration? · few records failed in sap load what will you do</sub>

### The SAP callout times out or returns an error — what happens and how is it retried?
*Mid (3–6 yrs) · scenario* · `qtc-int-008`

We handle it on two paths, and both end in an automatic retry with a cap. If SAP returns a status other than 200 or 202, the agreement gets Status 'Connectivity Failure', chunk status 'Request Failed', and AMT_Retry_Count__c goes up by one. The next scheduled run of AMT_LoadPricesToSAPInChunk_Batch picks it up again, but only while the retry count is below the custom label AMT_Pricing_Upload_Retry_Count. If the callout itself throws an exception, like no response, we log an interface record with code 404 and 'No response from SAP.' The chunk is marked 'Request Failed' without changing the business status. Since the start query also accepts chunk status 'Request Failed', it gets picked up on a later run. Separately, the PAError monitor can resubmit single price records whose jobs failed, up to 5 attempts. The cap is the guardrail I care about: when SAP is down for hours, I want the retries to stop and a person to look, not a loop of failing callouts.

- Non-200/202: Connectivity Failure + retry count +1
- Retry limit: label AMT_Pricing_Upload_Retry_Count
- Exception: interface log 404, chunk Request Failed
- PAError_BatchMonitorSched reprocess guard: attempts >= 5 skipped

```java
// AMT_LoadPricesToSAPInChunk_Batch.cls (start)
where (Status__c =: QTC_Constants.SUBMITTED_FOR_LOADING OR (Status__c =: QTC_Constants.CONNECTIVITY_FAILURE AND AMT_Retry_Count__c <: retryCount))
AND AMT_Chunk_Status__c IN: validPAStatus AND AMT_SAP_LoadDate__c <= TODAY AND AMT_Is_Batch_Processing__c = FALSE AND
AMT_Price_Agreement_Group__r.AMT_Type__c =: QTC_Constants.REGULAR LIMIT : maxPALimit];
```

<sub>Also asked as: How does retry work if the SAP callout fails? · Do you retry failed SAP callouts? · What happens on a timeout or 500 from SAP? · How is AMT_Retry_Count__c used? · retry mechanism in your integration</sub>

### How would you handle 100k prices going to SAP in your project?
*Senior (7–10 yrs) · scenario* · `qtc-int-009`

I wouldn't redesign it; I'd tune it and watch three limits. The current design already handles volume in a few ways. The batch uses a QueryLocator, so it isn't limited by the 50,000-row SOQL limit in start. The scheduler runs it with scope 2000. Records per SAP message are capped by the label QTC_Pricing_Upload_Batch_Limit, and agreements per run by QTC_PricingUpload_PA_Limit, so we tune by config, not code. For 100k I would check three things. First, callouts per execute: each scope of 2000 can create several messages, and there's a 100-callout limit and a 120-second total callout time per transaction. Our timeout is already 120 seconds per call, so I'd lower the scope if SAP is slow. Second, heap: the whole JSON request is built in memory, so the message limit must keep the payload small. Third, monitoring: AMT_Interface_Log__c and the per-PR coordinator show which chunk failed, so we can retry only that. I'd also agree the load window with the SAP team first, since their side has to absorb the volume too.

- QueryLocator + scope 2000; per-message cap via label
- Watch: 100 callouts / 120 s cumulative callout time per transaction
- Watch heap (request built in memory, also saved as file)
- Tune labels and scope, not code

<sub>Also asked as: What if a price agreement has a very large number of price records? · How does your design scale for high volume price loads? · How do you stay within governor limits when sending lots of prices? · one lakh prices to sap how will you handle</sub>

### Which named credentials or endpoints does your QTC project use for callouts?
*Fresher (0–2 yrs) · concept* · `qtc-int-010`

For SAP, we use one named credential, PricingUploadApi, for the price upload. The code only says request.setEndpoint('callout:PricingUploadApi'), so the URL and authentication live in Setup, not in Apex. That's the only 'callout:' reference in the classes. Document generation is different. AMT_NewdocumentGenerationbatchcallouts and AMT_NewdocumentGenerationbulkbatch read the URL from the custom setting Form_Stack_End_Point__c, field PA_Publication_End_Point__c. My standard is that every endpoint goes through a named credential, so moving that one over is on my list: the URL and credentials get managed the same way and the remote site isn't configured separately. The named credential metadata itself isn't in this repo, so its auth type is something I'd confirm in Setup rather than state from the code.

- SAP: callout:PricingUploadApi
- Doc generation: Form_Stack_End_Point__c.PA_Publication_End_Point__c
- Improve: move doc endpoint to a named credential

<sub>Also asked as: Do you use named credentials? · Where is the SAP endpoint stored? · How do you avoid hard-coding endpoint URLs? · what named credential is used for sap</sub>

### Show me how the callout to SAP is written in your project.
*Mid (3–6 yrs) · code* · `qtc-int-011`

We keep the callout in one static method so every caller sends to SAP the same way. It's sendRequestToSAP, on AMT_LoadPricesToSAPInChunk_Batch. AMT_LoadInactivePA_Batch reuses it too. It sets the chunkStatus on the wrapper, serializes it to JSON, and POSTs it to the named credential with a JSON content type and a 120-second timeout. The caller decides what to do with the response. 200 or 202 means accepted, and the records are marked 'Activate'. Anything else marks the agreement 'Connectivity Failure'. The caller also writes an AMT_Interface_Log__c with the payload and status code. The full request JSON is saved as a ContentVersion file attached to that log, so we can see exactly what was sent. That file is what settles most "did we send it or not" conversations with the SAP team, so I don't let anyone drop it to save storage.

- Static, reused by AMT_LoadInactivePA_Batch
- callout:PricingUploadApi, POST, JSON, 120000 ms timeout
- Caller handles 200/202 vs failure and logs

```java
// AMT_LoadPricesToSAPInChunk_Batch.cls
public static HttpResponse sendRequestToSAP(QTC_PricingUploadRequestWrapper pricingRequest, String chunkStatus) {
    pricingRequest.message.chunkStatus = chunkStatus;
    String requestBodyData = JSON.serializePretty(pricingRequest);
    Http http = new Http();
    HttpRequest request = new HttpRequest();
    request.setEndpoint('callout:PricingUploadApi');
    request.setMethod('POST');
    request.setHeader('Content-Type', 'application/json;charset=UTF-8');
    request.setBody(requestBodyData);
    request.setTimeout(120000);
    HttpResponse response = http.send(request);
    return response;
}
```

<sub>Also asked as: Write the HTTP callout you use for SAP · How do you build the HttpRequest for the price upload? · What does sendRequestToSAP do? · show callout code</sub>

### How does the inbound pricingUploadResponse REST API work?
*Mid (3–6 yrs) · concept* · `qtc-int-012`

Our response API just receives, logs and hands off; it does no record processing inline. QTC_PricingUploadResponseRest is mapped to /pricingUploadResponse with one @HttpPost method. It reads the body and uses JSON.deserializeStrict into QTC_PricingUploadResponseWrapper. The body has a message with messageID, messageTime, processType, chunkStatus, a masterQuoteRev list for the agreement, and the same line sections we sent, like assyTarget and testPdl, each with status and message. It returns a ResponseClass with messageID, messageTime, processType and a result block with code, description and message. Success is 200. Any exception returns result code 500. That is in the body; the code doesn't set the HTTP status itself. It logs the request in AMT_Interface_Log__c and schedules QTC_PricingUploadResponse_Scheduler to run about 10 seconds later with the payload. The HTTP-status point is one I'd raise with SAP's middleware team, since their retry logic may only look at the real status code.

- @RestResource(urlMapping='/pricingUploadResponse'), @HttpPost
- deserializeStrict -> unknown fields fail the call
- Returns ResponseClass with result code 200/500
- Actual processing deferred to QTC_PricingUploadResponse_Scheduler

```java
// QTC_PricingUploadResponseRest.cls
@RestResource(urlMapping='/pricingUploadResponse')
global class QTC_PricingUploadResponseRest {
    @HttpPost
    global static QTC_PricingUploadResponseWrapper.ResponseClass proccessPricingUploadInbound() {
```

<sub>Also asked as: How does SAP send back the result of the price load? · What does QTC_PricingUploadResponseRest accept and return? · Explain your Apex REST service for the SAP response · pricing upload response api</sub>

### Why does your response API schedule a job instead of processing SAP's response immediately?
*Senior (7–10 yrs) · design* · `qtc-int-013`

The main reason is to avoid racing with the outbound batch, and it also keeps the REST call short for SAP. The REST method logs the payload and schedules QTC_PricingUploadResponse_Scheduler about 10 seconds out. When it runs, the scheduler first aborts its own trigger with System.abortJob. Then it checks whether any agreement in the response still has AMT_Is_Batch_Processing__c = TRUE. If one does, it reschedules itself for another 10 seconds. Only when the agreements are free does it call processJSONResponse and start the follow-up batches. The design comment isn't in the code, so the reasoning is my reading of it. The risk I'd plan for: every response creates a scheduled job, and Salesforce allows only 100 scheduled Apex jobs at a time. A Queueable or a platform event could do the same deferral without using up scheduled-job slots, and that's the change I'd put forward if response volume grows.

- Defers work; waits while AMT_Is_Batch_Processing__c is TRUE
- Self-aborting one-off schedule, re-schedules if busy
- Risk: 100 scheduled Apex jobs limit under many responses
- Alternative: Queueable or platform event

<sub>Also asked as: Why QTC_PricingUploadResponse_Scheduler instead of updating records in the REST call? · How do you avoid the SAP response clashing with the outbound batch? · Why System.schedule inside a REST service? · race condition between batch and response api</sub>

### What happens after SAP reports success for a price agreement?
*Mid (3–6 yrs) · concept* · `qtc-int-014`

Two things run in order: we update the agreement header, then a batch finishes the price records. processJSONResponse runs first. For each masterQuoteRev with status 'SUC', it copies the sales deal and promotion dates from SAP onto the agreement. If SAP sends a real sales-deal end date, not 99991231, the agreement becomes 'Inactive'. If the chunk was a success and there's a previous agreement, that one is set Inactive, with an expiration date of the day before the new effective date if it had none. Then the scheduler runs QTC_PricingUploadResponse_Batch. Its start() locks the agreements with AMT_Is_Batch_Processing__c. execute() moves 'Activate' to 'Activated in SAP', sets variant status 'Closed Won', expires 'Ready For Expiration' records and the previous price records, and re-points records to the newer agreement if one exists. It uses Approval.isLocked to skip clearing fields on locked records. finish() sets the agreement 'Active', clears the error, and releases the lock.

- processJSONResponse: sales deal / promotion dates, previous PA Inactive
- Batch: Activate -> Activated in SAP; Ready For Expiration -> Expired
- Approval.isLocked check before clearing approval fields
- finish: PA Active, lock released

<sub>Also asked as: What does QTC_PricingUploadResponse_Batch do? · How do prices become Activated in SAP? · How is the old agreement expired when a new one loads? · post processing after sap success</sub>

### What inbound REST APIs does your QTC project expose, and what does each one do?
*Fresher (0–2 yrs) · concept* · `qtc-int-015`

We expose five @RestResource classes, all POST, and they all follow one pattern on purpose. /pricingUploadResponse (QTC_PricingUploadResponseRest) receives SAP's result for a price load. /customerMaster (QTC_CustomerMasterRestClass) and /customerHierarcy (QTC_CustomerHierarchyRestClass) receive customer data and parent-child links. They only stage it into AMT_Account_Interface__c, and a batch creates the accounts later. /pdlMaster (QTC_PDLMasterRestClass) upserts AMT_PDL_Master__c, matching on AMT_concatPDL__c. It maps status 'A' and 'I' to Active and Inactive and only overwrites fields that have a value. /pricingIssue (QTC_PricingIssueRestClass) creates or updates AMT_Pricing_Issue__c and its detail records. The shared pattern: deserializeStrict into a wrapper, check required fields, return a code with description and message, and write an AMT_Interface_Log__c. When a new endpoint is added, I expect it to follow that same shape, so support can debug any of them the same way.

- pricingUploadResponse, customerMaster, customerHierarcy, pdlMaster, pricingIssue
- Same pattern: wrapper + deserializeStrict + ResponseClass + interface log
- Customer data staged in AMT_Account_Interface__c

<sub>Also asked as: List the Apex REST services in your project · Which systems call into your Salesforce org? · What is the PDL master API? · inbound integrations in your project</sub>

### How does the Pricing Issue REST API work?
*Mid (3–6 yrs) · concept* · `qtc-int-016`

SAP posts to /pricingIssue, and we upsert the issue header and its detail rows in one go. The class requires messageID and piNumber. It looks up AMT_Pricing_Issue__c by AMT_piNumber__c. If the record exists, it updates only the header fields that came with a value. If not, it creates one, and the customer number has to match an Account by AccountNumber, otherwise it returns 400. Then it builds AMT_Pricing_Issue_Detail__c rows using record types listTab, errors, workFlow, bomComponent and routing. listTab rows are matched on AMT_identifier__c, so they update instead of duplicating. SAP dates like 20250312 are converted to MM/dd/yyyy text, and times like 101500 to 10:15:00. Everything is saved with one upsert of the detail list. One quirk is a real data risk: before deserializing, it does replaceAll('null',''). That also strips the letters 'null' inside real values, so I'd prioritise changing it to handle nulls in the wrapper instead.

- Header matched on AMT_piNumber__c (update or insert)
- Details by record type; listTab matched on AMT_identifier__c
- Missing customer on create -> 400 response
- Improve: replaceAll('null','') is risky

<sub>Also asked as: Explain QTC_PricingIssueRestClass · How do pricing issues come from SAP into Salesforce? · How do you upsert pricing issue details from SAP? · pricing issue integration</sub>

### How do customer accounts from SAP get created in Salesforce?
*Mid (3–6 yrs) · concept* · `qtc-int-017`

We use a two-step, staging-table design, and I'd keep it, because it decouples SAP's timing from our account logic. The REST classes for /customerMaster and /customerHierarcy only insert an AMT_Account_Interface__c row with AMT_processed__c = 'No'. QTC_CustomerAccountsScheduler then runs QTC_CustomerAccountsBatch, with the scope size taken from the label QTC_CustomerRecordsPerBatch. The batch reads unprocessed rows. Parent and child rows are limited to a time window from the label QTC_CustomerRecordProcessingHours. AMT_hierarchy__c '01' means parent and '02' means child. Rows with no hierarchy code are hierarchy links that set ParentId. SAP codes are translated using AMT_SAP_Code_Description__c. It upserts parents, then children, with Database.upsert(list, false). Failures become AMT_Error_Log__c rows through processErrors. A child whose parent doesn't exist yet is still created, but with status 'Staged'. Partner roles become account team members.

- REST -> AMT_Account_Interface__c (processed = 'No')
- Batch: parents ('01') then children ('02'), partial-success upsert
- Child without parent -> 'Staged' + error log
- Scope and time window from custom labels

<sub>Also asked as: Explain QTC_CustomerAccountsBatch · How does the customer master integration work? · How do you build the parent-child account hierarchy from SAP? · customer staging table batch</sub>

### How do external systems authenticate when they call your Apex REST services?
*Fresher (0–2 yrs) · concept* · `qtc-int-018`

Authentication happens at the platform level, not in our classes. They are standard Apex REST under /services/apexrest/, for example /services/apexrest/pricingUploadResponse. Apex REST needs an authenticated Salesforce session, so the caller has to get an OAuth access token for an integration user and send it as a Bearer token. Most of the classes are declared 'with sharing', so the integration user's access applies. The response API is the exception, since it's declared without a sharing keyword. The connected app or external client app and the integration user setup are not in this repo, so I'd confirm their names in the org rather than quote them from code. The guardrail I hold to is a dedicated integration user with only the permissions these endpoints need, and I'd make the sharing keyword explicit on the response API so nobody has to guess.

- Auth handled by the platform (OAuth token), not in Apex
- Most REST classes are 'with sharing'
- Connected app config not in repo — not verified

<sub>Also asked as: How does SAP get access to your REST API? · Is your REST endpoint secured? · What auth do you use for inbound integration? · oauth for inbound sap calls</sub>

### How do you log and monitor integration calls in your project?
*Fresher (0–2 yrs) · concept* · `qtc-int-019`

We log every integration message, and the rule on the team is: if it crossed the boundary, it's in the log. We have two custom objects. AMT_Interface_Log__c stores every inbound and outbound message: messageId, messageDate, processType, interface type and name, status code and message, the related Apex class, and the request and response payloads, cut to 131,072 characters. For the SAP price upload, the full request JSON is also saved as a ContentVersion file attached to the interface log, titled 'Request for <messageId>;<time>.json'. Errors go to AMT_Error_Log__c with error type, description, source class, stack trace and the related object Id. There is also a reusable ExceptionHandler.log() that writes an error log from any exception or from a list of Database.SaveResult, and it never throws. So to debug, I search the interface log by messageID and read the error log.

- AMT_Interface_Log__c: request/response payload, status, messageId
- Full SAP request JSON saved as a file on the log
- AMT_Error_Log__c + ExceptionHandler utility
- Search by messageID to trace a load

<sub>Also asked as: Where can I see what was sent to SAP? · How do you debug a failed integration call? · What is AMT_Interface_Log__c? · integration logging framework</sub>

### How do you clean up old integration logs?
*Fresher (0–2 yrs) · design* · `qtc-int-020`

We purge them with one generic batch, and retention is config, not code. QTC_DeleteLogsScheduler starts AMT_DeleteLogs_Batch three times, once each for AMT_Interface_Log__c, AMT_Account_Interface__c and AMT_Error_Log__c, with scope 2000. The batch takes the object name in its constructor and builds a dynamic query for records with CreatedDate older than LAST_N_MONTHS, where the number of months comes from the label CreatedDateLastMonths. It deletes with Database.delete(ids, false), so one locked record doesn't stop the rest, and it counts successes in a stateful variable. The gap I'd close first: failures are only written to System.debug, so a failed purge is invisible. I'd write those to AMT_Error_Log__c, or at least check the job result. It's low effort, and storage creeping up unnoticed is the kind of problem that only shows up when it's already urgent.

- One generic batch, object name passed in
- Retention via label CreatedDateLastMonths
- Partial delete with allOrNone = false
- Improve: failures only in debug logs

<sub>Also asked as: Do your log tables grow forever? · Explain AMT_DeleteLogs_Batch · How do you purge interface logs? · log retention in salesforce</sub>

### Explain the PA error automation and monitoring you have for SAP loads.
*Senior (7–10 yrs) · design* · `qtc-int-021`

We have a self-healing loop: find the errors, resubmit what can be fixed, watch the jobs, and email what's left. PAErrorHourlyReportEmailJob is a Schedulable. First it aborts any pending PAError_BatchMonitorSched jobs. Then it runs PAError_Automation.run(true). That looks at agreements in 'Error', 'Request Failed' or 'Response Failed' and at price records in 'Load Error', works on up to 5 agreement groups at a time, updates the records and agreements it decides need fixing, and collects the (agreement, price record) pairs to resend. It hands those to PAError_PerPRBatchSubmitCoordinator, a Queueable. The coordinator starts up to 5 AMT_LoadPricesToSAPInChunk_Batch jobs per transaction and chains itself for the rest. Then PAError_BatchMonitorSched checks AsyncApexJob about once a minute, up to 30 checks. A job with zero items, zero processed, or any errors is resubmitted, up to 5 attempts. The hourly job emails a CSV of the remaining errors to the address in the label AMT_PAErrorHourlyReportEmail, and the monitor emails a run summary when it finishes.

- Report job -> PAError_Automation -> Queueable coordinator -> monitor schedule
- ≤5 batch submissions per transaction, chained
- Polls AsyncApexJob, reprocesses failed PRs (max 5 attempts)
- Email + CSV of errors

```java
// PAError_BatchMonitorSched.cls
// Reprocess rules: items == 0 OR processed == 0 OR errors >= 1
if (ti == 0 || jp == 0 || ne >= 1) {
    PAError_PerPRBatchSubmitCoordinator.SubmittedJobInfo next =
        new PAError_PerPRBatchSubmitCoordinator.SubmittedJobInfo(null, info.paId, info.prId, false);
    next.attempts = attempts + 1; // increment for next pass
    toReprocess.add(next);
}
```

<sub>Also asked as: What is PAErrorHourlyReportEmailJob? · How do you auto-recover failed price agreement loads? · Do you have any self-healing or alerting for the SAP integration? · batch monitor scheduler explain</sub>

### Why does PAError_PerPRBatchSubmitCoordinator submit only 5 batches per transaction?
*Senior (7–10 yrs) · concept* · `qtc-int-022`

Five lines up with the platform's limit on active batch jobs, so we pace submissions instead of flooding the queue. The coordinator has a flat list of (agreement, price record) pairs. Each one needs its own run of AMT_LoadPricesToSAPInChunk_Batch for that single record. The code sets maxBatchSubmissionsPerTxn = 5, submits up to five Database.executeBatch calls, and then enqueues itself again with the next start index. Along the way it carries the run Id, the combined log and an attempts ledger. That matches the platform rule that only 5 batch jobs can be actively running at once, with up to 100 waiting in the Apex flex queue. So spreading submissions over chained Queueables avoids flooding the flex queue in one go. When all pairs are submitted, it schedules PAError_BatchMonitorSched to watch the jobs. The only explanation in the code is a note in PAError_Automation, 'Up to 5 Database.executeBatch calls per transaction', so the exact reason is my reading. Either way, it leaves room in the flex queue for the regular scheduled loads.

- Chained Queueable with startIndex
- 5 submissions per hop; run Id + ledger carried forward
- Then schedules the monitor

<sub>Also asked as: Why use a Queueable to start batch jobs? · How do you start many batch jobs without hitting limits? · What is maxBatchSubmissionsPerTxn? · chaining queueable to run batches</sub>

### What scheduled jobs does your QTC project have?
*Fresher (0–2 yrs) · concept* · `qtc-int-023`

The main one is QTC_LoadPricesToSAPScheduler. Each run starts four batches: AMT_PricingUploadHistoricalPRs_Batch, QTC_PricingUploadResponse_Batch, AMT_LoadPricesToSAPInChunk_Batch with scope 2000, and AMT_LoadInactivePA_Batch with scope 5. Others: QTC_CustomerAccountsScheduler for customer staging, QTC_DeleteLogsScheduler for log cleanup, PAErrorHourlyReportEmailJob for the error report and auto-reprocess, and AMT_RecalculateABMNBillingBatch, which is both a batch and a Schedulable. AMT_SendProspectAccountReviewNotifcation is also Schedulable. A few are one-off self-scheduling jobs: QTC_PricingUploadResponse_Scheduler, PAError_BatchMonitorSched and AMT_AddAccountManager_Scheduler. They schedule themselves seconds or minutes ahead. The first and third abort their own trigger when they run; PAError_BatchMonitorSched uses a cron with a fixed date and year, so it fires once. The cron times for the recurring jobs are set in the org, not in the repo, so I'd confirm them in Scheduled Jobs. I'd like those schedules written down alongside the code, so a deployment or refresh never loses one.

- QTC_LoadPricesToSAPScheduler starts 4 batches
- Customer, log cleanup, PA error report schedulers
- Self-scheduling one-off jobs: abortJob or a dated cron
- Cron times not in repo

<sub>Also asked as: List the Schedulable classes in your project · Which batches run on a schedule? · What does QTC_LoadPricesToSAPScheduler run? · scheduled apex in your project</sub>

### How do you schedule a one-time job a few seconds in the future from Apex?
*Mid (3–6 yrs) · code* · `qtc-int-024`

We build a cron for "now plus a few seconds" and make the job abort itself, so it runs once. In QTC_PricingUploadResponseRest.callScheduler we build a cron expression from now plus 10 seconds, using seconds, minutes and hours with every day, month and weekday. Then we call System.schedule with a unique job name that includes the interface log Id. Because that cron would repeat every day, the first thing QTC_PricingUploadResponse_Scheduler.execute does is System.abortJob(sc.getTriggerId()), which makes it a one-time job. AMT_AddAccountManager_Scheduler uses the same pattern to wait while AMT_ManageGroupMemberQueueableClass is still running. PAError_BatchMonitorSched includes the day, month and year in its cron, so it is specific to one date. For new code, my guidance to the team is to reach for System.enqueueJob with a delay, or a Queueable, instead of a scheduled job, because it doesn't use the scheduled-job slots and there's no abort step to forget.

- Cron built from now + 10 s; unique job name
- abortJob(getTriggerId()) on first run = one-off
- Same pattern in AMT_AddAccountManager_Scheduler

```java
// QTC_PricingUploadResponseRest.cls
public static void callScheduler(QTC_PricingUploadResponseWrapper responseData, Id interfaceId) {
    DateTime nextRunTime = System.now().addSeconds(10);
    String nextFireTime = nextRunTime.second() + ' ' + nextRunTime.minute() + ' ' + nextRunTime.hour() + ' * * ?';
    System.schedule(QTC_PricingUploadResponse_Scheduler.jobName + ' InterfaceLogId ' + interfaceId, nextFireTime, new QTC_PricingUploadResponse_Scheduler(responseData, interfaceId));
}
```

<sub>Also asked as: How does callScheduler work in your response API? · How do you run a job once using System.schedule? · Why do you call System.abortJob inside execute? · one time schedule apex</sub>

### A user wants to send just one price record to SAP — how does that work in your project?
*Mid (3–6 yrs) · scenario* · `qtc-int-025`

We support it through a guided screen on the price record, with an approval gate when the price changes. On the record there's the loadtoSAPProcessFlow LWC. First it calls LoadtoSAPProcessflowController.getandValidatePriceRecordDetails. That checks for agreements in error, finds the active and latest agreement for the group, and checks for duplicates. It returns isError or isWarning for the screen. Then it shows the eligible agreements with prices from getValidAgreementswithPrices. On submit it calls submitAddHistoricPrices with the selected agreements and prices as JSON. LoadtoSAPProcessSubmissionFlow stores them in AMT_Aged_PRs__c as 'PRId-PAId-price' entries. If the price to customer didn't change, it creates the historic records and calls sendPricesToSAP. That starts AMT_LoadPricesToSAPInChunk_Batch for that one agreement and record, or the historical batch in the multi-price case. If the price changed, it sets AMT_Need_Approval__c and returns 'submitted for approval'. After approval, the flow AMT_Load_to_SAP_on_Approval calls AMT_LoadPRToSAPOnApproval to send it.

- LWC -> LoadtoSAPProcessflowController -> LoadtoSAPProcessSubmissionFlow
- Unchanged price: batch(paId, prId) right away
- Changed price: approval first, then AMT_LoadPRToSAPOnApproval
- Returns 'SUCCESS:' / 'ERROR:' strings parsed by the LWC

<sub>Also asked as: How does a user load a single price record to SAP from the UI? · Explain the loadtoSAPProcessFlow LWC · How does Load to SAP button work on a price record? · What happens when a user clicks Load PR to SAP? · single price record sap load</sub>

### What are historical price records and how are they sent to SAP?
*Mid (3–6 yrs) · concept* · `qtc-int-026`

Historical price records are how we send one price against older agreements too. That's the multi-price case, AMT_Multi_Price__c. The older targets are stored in AMT_Aged_PRs__c as semicolon-separated 'PRId-PAId-price' entries. When the batch sees such records in finish(), it flags those older inactive agreements with AMT_Is_Historical_PRs_Available__c = TRUE and starts AMT_LoadPricesToSAPInChunk_Batch(true). In historical mode the batch only picks 'Ready For Expiration' records with AMT_Sent_to_SAP__c = FALSE, and on success it sets AMT_Sent_to_SAP__c = TRUE instead of moving them to Activate. After SAP confirms, AMT_PricingUploadHistoricalPRs_Batch moves those records to 'Expired' and resets the flags, like AMT_Aged_PRs__c and AMT_Need_Approval__c, on the original record they were cloned from. Because one batch class runs in two modes, any change to it needs testing in both, and that's something I call out explicitly in review.

- AMT_Aged_PRs__c format: PRId-PAId-price; ...
- Historical mode: Ready For Expiration + AMT_Sent_to_SAP__c
- AMT_PricingUploadHistoricalPRs_Batch expires them after success

<sub>Also asked as: What is AMT_Aged_PRs__c? · What does the historical mode of the SAP batch do? · Explain AMT_PricingUploadHistoricalPRs_Batch · multi price historic prices sap</sub>

### A price agreement got stuck after sending to SAP — how do you roll it back?
*Fresher (0–2 yrs) · scenario* · `qtc-int-027`

We have a dedicated recall path, so nobody has to fix stages by hand with data loads. The screen flow AMT_RecallPriceAgreement calls the invocable method 'Recall Price Records', which is recallPriceRecord in AMT_LoadPricesToSAPInChunk_Helper. That starts AMT_RecallPriceRecord_Batch for the agreement. In start(), it locks the agreement with Approval.lock and queries its records in stage 'Activate'. In execute(), it sets each record back to the stage saved in AMT_Activate_Previous_Stage__c and clears that field. In finish(), it unlocks the agreement and sets AMT_Is_Batch_Processing__c back to false, so the scheduler can pick it up again. That's why the load batch saves the previous stage before moving a record to Activate. I'd still check the interface log before recalling, to be sure SAP really didn't process the message.

- Flow AMT_RecallPriceAgreement -> invocable recallPriceRecord
- Batch reverts Activate -> AMT_Activate_Previous_Stage__c
- Approval.lock / unlock around it; lock flag released

<sub>Also asked as: How do you recall a price agreement load? · What is AMT_RecallPriceRecord_Batch? · Price records are stuck in Activate stage, what can the user do? · recall price records flow</sub>

### How do you validate field lengths before sending data to SAP?
*Mid (3–6 yrs) · code* · `qtc-int-028`

We check field lengths in Salesforce before the callout, because a rejection we catch ourselves is cheaper than one SAP sends back. We use the custom metadata type AMT_Pricing_Upload_Field_Length__mdt. Each record is named after the SAP field, like unitPrice or salesOrg. It holds the allowed length, the decimal length, and a flag AMT_fieldValidationCheck__c to turn the check on or off. checkFieldLength compares the value. For decimals it checks the integer and decimal digits separately using precision() and scale(). checkPriceAgreeFieldValidation and checkPriceRecordFieldValidation build one combined error string. If it isn't blank, the record goes to 'Load Error' and the agreement is not sent. Since getAll() on custom metadata doesn't use a SOQL query, calling it per field is safe, though I'd still load it once into a static map. And because the rules are metadata, when SAP changes a field length it's a config change, not a deployment.

- Custom metadata keyed by SAP field name
- Integer vs decimal digits checked for decimal fields
- Errors stop the PA before any callout

```java
// AMT_LoadPricesToSAPInChunk_Batch.cls
if(decimalField) {
    totalLength = decimal.valueof(fieldValue).precision();
    decimalLength = decimal.valueof(fieldValue).scale();
    integerLength = totalLength - decimalLength;
    if(integerLength > Integer.valueOf(pricingUpload.get(fieldName).AMT_Field_Length__c) || decimalLength > Integer.valueOf(pricingUpload.get(fieldName).AMT_Decimal_Length__c)) {
        returnError = error + ' Decimal Length: ' + decimalLength + ' Allowed length: ' + pricingUpload.get(fieldName).AMT_Decimal_Length__c + '\n';
    }
} else if(fieldValue.length() > pricingUpload.get(fieldName).AMT_Field_Length__c) {
    returnError = error + '\n';
}
```

<sub>Also asked as: How do you prevent SAP rejecting values that are too long? · What is AMT_Pricing_Upload_Field_Length__mdt? · Do you use custom metadata for validation? · pre validation before callout</sub>

### How does document generation for a price agreement work in your project?
*Fresher (0–2 yrs) · concept* · `qtc-int-029`

It's a batch-driven callout to an external publication service, and the user just gets the file later. It starts from the Visualforce controller AMT_PublicationBatchController, which uses a standard controller on the agreement. initBatchProcess() sets AMT_Issue_Date__c and runs submission logic for Draft agreements. Then it counts the price records. If the count is at or below the limit in custom setting Form_Stack_End_Point__c.Publication_recordslimit__c (11,500 if blank), it runs AMT_NewdocumentGenerationbatchcallouts. Otherwise it runs the multi-part AMT_NewdocumentGenerationbulkbatch. Each execute() turns the price records into maps with getPopulatedFieldsAsMap and POSTs them to the publication endpoint with a session id and '_session_append'. finish() sends the header data, like name, revision, gold base price, sections and customer attribute configuration, with 'merge' true. The user sees 'Please check the Files Section after few minutes'. That message sets the right expectation for users, which saves a lot of support tickets.

- VF controller -> one of two callout batches
- Lines sent in chunks, header + merge in finish
- Endpoint from Form_Stack_End_Point__c custom setting
- User can exclude stages (Ready For Expiration / Expired)

<sub>Also asked as: How do you generate the price agreement PDF or document? · Explain AMT_NewdocumentGenerationbatchcallouts · How is the price agreement published? · document generation callout batch</sub>

### How does document generation handle very large price agreements?
*Senior (7–10 yrs) · design* · `qtc-int-030`

For big agreements we split the document into numbered parts, using keyset paging across chained batches. Each run queries at most maxchunklimit records ordered by Id. The first run starts from the beginning, and later runs use 'Id > :lastprocessedId'. execute() remembers the last Id it sent. finish() sends the header for that part with Versioncounter and a runIdentifier like '-<run>-Part-', so the generated files are numbered parts. It then counts the records left after lastprocessedId. If there are any, it starts a new bulk batch with a new session id, Versioncounter + 1, and the same lifecycle-stage filter. This keeps each document part to a fixed size and avoids OFFSET limits. There's one gap I'd fix: the remaining-count query doesn't apply the selected lifecycle-stage filter, so it may start one extra empty part. It's low risk and low effort, so it's a good item for a newer developer, with a test that asserts the part count.

- LIMIT maxchunklimit ORDER BY Id + Id > lastprocessedId
- finish() chains next part with Versioncounter + 1
- Improve: count query ignores stage filter; no response check on callouts

```java
// AMT_NewdocumentGenerationbulkbatch.cls (finish)
if(total > 0){
    System.debug('Nextbatch');
    String newSessionId =  'session1-'+ Datetime.now().gettime();
    Database.executeBatch(new AMT_NewdocumentGenerationbulkbatch(newSessionId,lastprocessedId,paRecId, Versioncounter+1, runIdentifier, isMultiPart,selectedLifecycleStages) , 2000);
}
```

<sub>Also asked as: How does AMT_NewdocumentGenerationbulkbatch split the document? · How do you page through records across chained batches? · What is lastprocessedId in your doc generation batch? · multi part document generation</sub>

### How does the bulk CSV upload for price records work?
*Fresher (0–2 yrs) · concept* · `qtc-int-031`

We built it as a two-step, record-driven tool: validate the file first, then run the batch. It's built around a Custom_Data_Import__c record, which says the object, the batch class name and the action. Step one: on that record, the excelParserforBulkUpload LWC uses lightning-file-upload. Apex getCsvContent reads the ContentVersion and returns the headers, the first row and the row count. The LWC checks every header against the object's custom fields from getObjectFields, and requires an Id or Name column. A template of API names and labels can also be downloaded. saveExcelFile sets the status to 'File Uploaded' and stores the file Id. Step two: the batchExecutor LWC calls BatchExecutor.runBatchByName. That starts ExcelbulkIterableBatch and saves the job Id with status 'Batch - In Progress'. Finally the batch writes success and error CSV files to the record and sets the status to Completed or Failed with a summary. That record gives the business an audit trail of every bulk change.

- Custom_Data_Import__c drives object, batch class, action
- LWC validates headers before any processing
- BatchExecutor starts ExcelbulkIterableBatch
- Results as CSV files + Status__c / Result__c

<sub>Also asked as: Explain the Custom_Data_Import__c bulk upload · How do users mass update price records from a file? · What does excelParserforBulkUpload do? · bulk upload pipeline in your project</sub>

### Why did you use an Iterable batch for the CSV upload instead of a QueryLocator?
*Mid (3–6 yrs) · code* · `qtc-int-032`

The data isn't in an object yet, it's in a CSV file, so there's nothing to query, and an Iterable is the right fit. ExcelbulkIterableBatch implements Database.Batchable<Map<String, Object>>. In the constructor it loads the latest ContentVersion for the file. start() returns new ExcelRowIterable(csvBlob). ExcelRowIterable's iterator normalizes line breaks, removes a BOM, lowercases the headers, and returns one row at a time as a map from header to value. It handles quoted values and doubled quotes. The platform then hands rows to execute in scope-sized lists, 200 from BatchExecutor. The limit I plan around: the whole file is read into memory as a string, so very large files can hit the heap limit. For those I'd split the file or stage the rows first, and I'd tell users the safe file size up front rather than let them find it by failing.

- Batchable<Map<String,Object>> + custom Iterable
- Parser handles quotes, BOM, line endings
- Heap is the constraint for large files

```java
// ExcelbulkIterableBatch.cls
public Iterable<Map<String, Object>> start(
    Database.BatchableContext batchContext
) {
    batchStartTime = System.now();

    return new ExcelRowIterable(csvBlob);
}
```

<sub>Also asked as: What is ExcelRowIterable? · How do you process a CSV file row by row in batch Apex? · Database.Batchable with a custom iterator example · iterable batch apex csv</sub>

### What operations does ExcelbulkIterableBatch support and how does it report results?
*Mid (3–6 yrs) · concept* · `qtc-int-033`

It supports two actions and always reports per row, so a partial failure never hides. The actions come from Custom_Data_Import__c.Action__c: 'Update' and 'Clone and Update with New Value'. Rows are matched to AMT_Price_Record__c by Id or Name. Validation only allows changes when the agreement is Draft, except that Update is allowed on Expired records. For Update, the first pass maps the non-price fields. If the file has an AMT_Price_to_Customer__c column, a second pass updates the price in a separate DML. Clone inserts new records. DML uses Database.update or insert with allOrNone false, and every failure becomes a row in an error CSV with Id, Name and Message. Successes go to a success CSV. Files are written whenever 20,000 rows build up, and again in finish, and linked to the import record. finish() reads AsyncApexJob and sets Status__c to Completed or Failed, with a summary in Result__c.

- Actions: Update / Clone and Update with New Value
- Draft-only rule (Expired allowed for Update)
- Partial-success DML, error + success CSV files (20,000 rows each)
- Final status from batch flags + AsyncApexJob

<sub>Also asked as: How do you show success and error results of a bulk upload? · What is Clone and Update with New Value? · How do you handle row-level errors in the upload batch? · error csv file after batch</sub>

### A user says their bulk upload shows Failed, or ran with the wrong batch size — how would you debug it?
*Mid (3–6 yrs) · troubleshooting* · `qtc-int-034`

I'd debug it from the record outward. Start on the Custom_Data_Import__c record. Result__c has the summary from buildFinalResultSummary: totals, error percentage, file counts and, for a fatal error, the phase and stack trace. Then I'd open the 'Bulk Upload Errors' CSV files on the record for the row-level reasons, like 'Price Record not found' or the Draft-only message. Next I'd check the AsyncApexJob using Batch_Job_Id__c for platform errors. On batch size, there's a real gap in the code. The batchExecutor LWC lets a 'System Admin' business role pick 1 to 2000 and passes batchSize. But BatchExecutor.runBatchByName ignores it and always calls Database.executeBatch(batch, 200). The fix is a one-line change to use the parameter, with the same range check on the server. I'd also be honest with the user: the size they picked was never applied, so if they saw a difference, it wasn't from that setting.

- Result__c summary + error CSV files on the import record
- AsyncApexJob via Batch_Job_Id__c
- Bug: BatchExecutor hard-codes scope 200, ignores batchSize

<sub>Also asked as: Bulk upload status is Failed, where do you look? · The batch size entered in batchExecutor is not used, why? · How do you troubleshoot ExcelbulkIterableBatch? · csv upload failed what to check</sub>

### How does the Excel upload into the staging object work for data migration?
*Fresher (0–2 yrs) · concept* · `qtc-int-035`

We load the Excel in the browser and land it in a staging object, then separate batches do the mapping. The lwcCSVUploader LWC loads the SheetJS library from the static resource xlsx, reads the .xlsx in the browser, and builds a map of sheet name to rows, skipping the header row. It sends that JSON to lwcCSVUploaderController.saveExcelFile, which starts ExcelUploadBatch. The batch reads Mapping_Object__c, which says, per sheet, which column index goes to which field. It creates Staging_Object__c records with Sheet_Name__c, Quote__c and row_number__c, inserting in buffers of 5,000. Other batches then work on the staging rows for that quote: AMT_StagingMapping maps service and package family using Data_Migration_Master_Mapping__c, AMT_DuplicateSAPKeyBatch checks duplicate keys, and AMT_createDMPriceRecords creates the price records. The risk I'd fix first: ExcelUploadBatch uses a dummy one-row Account query, so all rows go through a single execute. More than 10,000 rows would hit the DML-row limit, and insert errors are only debug-logged.

- Client-side SheetJS parsing, JSON to Apex
- Mapping_Object__c drives column -> field
- Staging_Object__c then processed by DM batches
- Improve: single execute, swallowed errors

<sub>Also asked as: What does lwcCSVUploader do? · Explain ExcelUploadBatch and Staging_Object__c · How do you load an xlsx file in LWC? · data migration from excel in your project</sub>

### What data migration batches does your project have and what do they do?
*Senior (7–10 yrs) · concept* · `qtc-int-036`

We have three main ones, and they're built to be safely re-run, which matters a lot in migration. AMT_TransferMasterQuoteData reads staging rows from AMT_DM_Master_Quote_Rev__c. It creates Price Agreement Groups keyed by AMT_Data_Migration_Key__c from PAGKey__c, then Price Agreements keyed by quote, revision and parent customer number, with sales deal, promotion and gold base price. It skips keys that already exist, so it can be run again. AMT_TransferMasterQuoteDataExpired, described in its header as inserting expired master quote records, creates the agreements as 'Inactive'. AMT_shareDMRecords goes through every AMT_Price_Agreement_Group__c, finds the child accounts from AMT_Price_Agreement_Customer__c, and inserts AMT_Price_Agreement_Group__Share rows with Read access for the group named 'Account_<AccountId>_Internal'. The risk I'd address before the next large load: inside execute these batches query every PAG, agreement and Group without a filter, just to check keys. On a big org that can hit the 50,000-row SOQL limit. I'd filter those queries by the keys in the current scope.

- Staging -> PAG/PA with data-migration keys (re-runnable)
- Apex managed sharing on AMT_Price_Agreement_Group__Share
- Improve: unfiltered SOQL inside execute

<sub>Also asked as: Explain AMT_TransferMasterQuoteData · How did you migrate legacy price agreements? · What does AMT_shareDMRecords do? · data migration batch classes</sub>

### What do the ContentDocument and ContentVersion triggers do in your project?
*Fresher (0–2 yrs) · concept* · `qtc-int-037`

They stop users adding or deleting files on a price record when its quote line is in a restricted status. The statuses come from the label Restrict_Attachment_Statuses, so they're config. ContentVersionTrigger runs before insert. The handler collects FirstPublishLocationId values that are AMT_Price_Record__c, queries AMT_Quote_Line__r.QuoteLine_Status__c, and calls addError with 'You cannot add or delete files at the current status.' ContentDocumentTrigger runs before delete. It looks up the ContentDocumentLinks and throws a custom exception if the linked price record's quote line is restricted. Both triggers can be switched off through AMT_TriggerMechanismHandler.disableTrigger. One thing I'd fix: the delete handler finds price records with a hard-coded Id prefix, 'a1t'. That prefix can differ between orgs, so I'd compare getSObjectType() like the version handler does. Hard-coded Ids and prefixes are something I flag in every code review.

- Before insert (ContentVersion) / before delete (ContentDocument)
- Statuses from label Restrict_Attachment_Statuses
- Bypass via AMT_TriggerMechanismHandler
- Improve: hard-coded 'a1t' prefix

<sub>Also asked as: How do you block file uploads on a price record? · Explain ContentVersionTriggerHandler · How do you prevent deleting files after a quote is closed? · trigger on contentdocument</sub>

### How do you test callouts and REST services in your project?
*Mid (3–6 yrs) · concept* · `qtc-int-038`

We use mocks for outbound and a built RestRequest for inbound. For outbound callouts we use HttpCalloutMock. AMT_LoadPricesToSAPInChunk_Batch_Test has an inner MockHttpResponseGenerator that returns status 200 with a small JSON body. The test calls Test.setMock(HttpCalloutMock.class, ...) and runs the batch between Test.startTest and Test.stopTest. The inactive-agreement and document-generation tests do the same. For inbound REST, QTC_PricingUploadResponseRestTest builds a RestRequest with requestURI '/services/apexrest/pricingUploadResponse/' and a JSON body, sets RestContext.request and response, and calls the method directly. Some classes also have test switches: the doc-generation finish() skips http.send when Test.isRunningTest(), and PAError_Automation has DISABLE_ASYNC_IN_TESTS, DISABLE_EMAILS_IN_TESTS and DISABLE_DML_IN_TESTS. A shared TestDataFactory exists, but only a few newer tests use it; most build their own data. Moving new tests onto that factory is a standard I'd set, so test data stays consistent.

- HttpCalloutMock returning 200
- RestContext.request with JSON body for inbound
- Test switches in PAError_Automation
- Improve: no non-200 mocks found

```java
// AMT_LoadPricesToSAPInChunk_Batch_Test.cls
public class MockHttpResponseGenerator implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setBody('{"status":"success"}');
        res.setStatusCode(200);
        return res;
    }
}
```

<sub>Also asked as: How do you write test classes for HTTP callouts? · How did you mock SAP in tests? · How do you test an Apex REST class? · httpcalloutmock in your project</sub>

### What would you improve in the testing of your integration classes?
*Senior (7–10 yrs) · design* · `qtc-int-039`

My priority is the failure paths, because that's where integration bugs actually hurt. Three things, all visible in the test classes. First, every callout mock I found returns 200. None returns 500 or throws, so the 'Connectivity Failure' branch, the retry-count increment and the 'No response from SAP' path aren't really checked. I'd add a failing mock and assert the Status__c, AMT_Retry_Count__c and AMT_Interface_Log__c rows. Second, in several AMT_LoadPricesToSAPInChunk_Batch_Test methods the assert runs before Test.stopTest(). The batch hasn't run yet at that point, so the test checks the starting data, and the messages say 'should be updated to Activate' while asserting a different stage. I'd move the asserts after stopTest and check for 'Activate'. Third, AMT_NewdocumentGenerationbatchcallouts and the bulk batch skip http.send in finish() when Test.isRunningTest(). So the header callout is never covered, and test logic lives in production code. Using the mock there would be cleaner.

- Add non-200 / exception mocks
- Assert after Test.stopTest()
- Assert real outcomes: stage, status, logs

<sub>Also asked as: Are your integration tests good enough? · What gaps do you see in your callout tests? · How would you strengthen the SAP batch tests? · test improvements</sub>

### What would you improve in the integration and batch code of your QTC project?
*Senior (7–10 yrs) · design* · `qtc-int-040`

From reading the code, not from running it, I'd order the fixes by risk. First, a data-integrity bug: in AMT_LoadPricesToSAPInChunk_Batch, when master-quote validation fails it does 'continue' without resetting pricingRequest. So the next records of that agreement could be added to the previous agreement's request. If it's the first agreement in the chunk, 'if(pricingRequest == null) return;' exits before the DML and logs are saved. I'd reset the request and skip records of failed agreements. Second, there are hard-coded values: a fallback email address in the PAError classes, and 'Closed Won' and 'Competitive price' in QTC_PricingUploadResponse_Batch. Those belong in labels or metadata. Third, the attempts comment says 0..2 but the guard is 5. Fourth, configsBatch checks the handler model against the tester picklist set. Fifth, excelParserforBulkUpload calls an undefined handleError and MESSAGES. Last, the doc-generation callouts never check the response, so I'd add logging there. The first one I'd fix this sprint; the rest are cheap and can ride along.

- pricingRequest not reset after PA validation failure
- Hard-coded email / picklist values
- Comment vs code mismatch (attempts 0..2 vs 5)
- configsBatch handler/tester set mix-up; LWC undefined handler
- Doc-gen callouts unchecked/unlogged

<sub>Also asked as: What technical debt do you see in your integration layer? · If you had time, what would you refactor in the SAP batch? · Any bugs or risks you noticed in your async code? · improvements in your project integrations</sub>

## QTC project — LWC and UI

### What Lightning components did you build or work with in your QTC project?
*Fresher (0–2 yrs) · concept* · `qtc-ui-001`

In our QTC project most of the UI is Lightning Web Components with AMT names, and Aura is only used for small wrappers. The main groups are: field-set driven tables like amt_FieldSetComponent and amt_fieldsettable; the Die, Wire and Substrate screens like aMT_DieDescriptionComp, aMT_WireDescriptionComp and aMT_DWS_DetailPage; popups that create price records for adders and charges, like amt_AddBackgrindPopup, amt_AddReflowPopup, amt_AddPostTest and the display* components; an approval history component, amt_ApprovalWorkItems; and an admin tool, amtPartnerGroupManager, for account group access. Around them we have reusable pieces: amt_GenericModal, amt_pagination with amt_paginator, searchableCombobox and amt_pickListInput.

- Field-set tables: amt_FieldSetComponent, amt_fieldsettable
- DWS screens: aMT_DieDescriptionComp, aMT_WireDescriptionComp, aMT_DWS_DetailPage
- Popups: backgrind, reflow, post test, lot / fast track / SID / process adder
- Reusable: amt_GenericModal, amt_pagination, searchableCombobox, amt_pickListInput

<sub>Also asked as: What LWCs are there in the Amkor QTC project? · Tell me about the UI side of your CPQ project · Which custom components sit on the quote line and price agreement screens? · Did you use LWC or Aura in your CPQ project?</sub>

### How does the amt_FieldSetComponent work in your project?
*Mid (3–6 yrs) · concept* · `qtc-ui-002`

amt_FieldSetComponent is our generic related-list table for the quote line. The parent passes the child object API name, a field set name, the lookup field to filter on, and the quote line Id as @api properties. It calls AMT_FieldSet_Helper.getFieldsAndRecords imperatively, which returns the field set members and the records as JSON. The component turns each field set member into a lightning-datatable column, and can make the first column a link to the record. For Insertions__c it adds a Link button column that opens the AMT_Linking_Configurations flow in a modal, and that button is enabled only for the right role and quote line status. It also has a View All button that navigates to the standard related list.

- Inputs: sfdcObjectApiName, fieldSetName, criteriaFieldAPIName, quoteLineRecordId
- Columns come from the field set, so admins change columns without code
- Link button on Insertions__c launches the AMT_Linking_Configurations flow
- Reused by Die, Wire, Insertion, Configuration and package attribute components

<sub>Also asked as: Explain your field set driven related list component · How did you build a dynamic related list in LWC? · How do the Die, Wire and Insertion tables get their columns? · field set component LWC how it works</sub>

### How does the Apex behind your field set table build its query?
*Mid (3–6 yrs) · code* · `qtc-ui-003`

AMT_FieldSet_Helper.getFieldsAndRecords takes the object name and field set name from the LWC. It describes the object, reads the field set members, and adds each fieldPath to a SELECT string, then adds Id and a WHERE on the lookup field, with a LIMIT read from the custom label AMT_RelatedListFieldSetRecordLimit. It runs Database.query and returns a map with FIELD_LIST and RECORD_LIST, both serialized to JSON, so the LWC can build columns and rows from one call. One special case from QTC-828: for Strip Test, Film Frame Test and Burn-In it skips AMT_Linking_Configuration__c so that column never shows. The method is @AuraEnabled with cacheable=false, so the component always gets fresh data.

- Describe -> fieldSets.getMap() -> getFields()
- Row limit comes from a custom label, not hard-coded
- Returns FIELD_LIST and RECORD_LIST as JSON strings
- cacheable=false so data is always fresh

```java
// AMT_FieldSet_Helper.cls
Integer recordLimit=integer.valueof(system.label.AMT_RelatedListFieldSetRecordLimit);
...
List<Schema.FieldSetMember> lstFSMember = sObj.getSObjectType().getDescribe().fieldSets.getMap().get(fieldSetAPIName).getFields();
...
String query = 'SELECT ';
for(Schema.FieldSetMember f : lstFSMember) {
    ...
        query += f.getFieldPath() + ', ';
}
query += 'Id FROM ' + strObjectApiName ;
...
List<SObject> lstRecords = Database.query(query);
returnMap.put('FIELD_LIST', JSON.serialize(lstFSMember1));
returnMap.put('RECORD_LIST', JSON.serialize(lstRecords));
```

<sub>Also asked as: Show me how you query fields from a field set in Apex · How did you write dynamic SOQL from a field set? · What does AMT_FieldSet_Helper.getFieldsAndRecords do? · How do you get field set members in Apex for an LWC?</sub>

### Why did you use field sets to drive the UI instead of hard-coding columns?
*Fresher (0–2 yrs) · concept* · `qtc-ui-004`

Field sets let us change which columns or form fields appear without touching the LWC code. In our QTC project the same component shows Die, Wire, Insertion and Configuration data just by passing a different object and field set name. On the price agreement screen, amt_fieldsettable even uses the service name as the field set name, like Assembly, Bump, Probe or Test, so each service gets its own column layout. For the Die, Wire and Substrate detail page, the field set name itself comes from the custom metadata AMT_DWS_Attribute_Mapping__mdt, mapped by object and package family. So one component serves many layouts, and an admin adds or removes a field in the field set.

- One component, many layouts
- Field set name chosen at runtime (service name or custom metadata)
- Column changes become configuration, not code
- Field order in the field set = column order

<sub>Also asked as: What is the benefit of field sets in LWC? · Why field set based tables? · How do admins change table columns without a deployment in your project? · Field sets vs hard-coded columns</sub>

### A user says they can't see a field in one of your QTC tables. How would you debug it?
*Mid (3–6 yrs) · troubleshooting* · `qtc-ui-005`

First I'd find which field set the table uses, because our tables are built from field sets. For the Die card, aMT_DieDescriptionComp picks Die_Columns_Link when the quote line has both AMT_Wire__c and AMT_Die__c, otherwise Die_Columns, so the field may be in only one of them. Second, some columns are hidden on purpose: AMT_FieldSet_Helper drops AMT_Linking_Configuration__c for Strip Test, Film Frame Test and Burn-In. On the price agreement table, Customer info columns are relabelled from AMT_Customer_Attributes_Configuration__c, and columns that come back as 'NA' are removed, so a missing or inactive configuration hides that column. Field-level security is less likely, because these Apex queries run in system mode and return the value anyway, which is something I'd tighten.

- Check which field set name the component passed
- Check hard-coded exclusions (QTC-828 linking column)
- Customer info columns need an active attribute configuration
- Row limit label can hide rows, not columns

<sub>Also asked as: A column is missing in the price record table, what do you check? · User cannot see a field in the field set datatable · Why would a field not show in your dynamic LWC table? · Column missing from Die description related list</sub>

### What does amt_fieldsettable do on the price agreement screen?
*Mid (3–6 yrs) · concept* · `qtc-ui-006`

amt_fieldsettable is the big price record table on a price agreement or price agreement group. Its parent, amt_manage_price_records, passes the selected service as the field set name on AMT_Price_Record__c. In connectedCallback it turns that service into a criteria list, for example AMT_Service__c = Probe, or Other plus AMT_ServiceGroup__c = Lot Charges, and sends it as JSON to amt_fieldSetHandler.getFieldsAndRecords. Apex builds the columns from the field set, adds the filters, and returns the records. The table then hands columns and rows to the child amt_pagination component. The same component also has action buttons, like remove, expire, undo, revise, bundle and update customer info, which call other amt_fieldSetHandler methods on the selected rows.

- Field set name = service (spaces replaced with _)
- Criteria list sent as JSON to amt_fieldSetHandler
- Rows shown through amt_pagination
- Buttons shown or hidden by profile, business role and PA status

<sub>Also asked as: Explain the manage price records table component · How is the price record list on a price agreement built? · What is amt_fieldsettable used for? · How do you show price records per service in one component?</sub>

### How do your price record tables show customer-specific column labels?
*Senior (7–10 yrs) · design* · `qtc-ui-007`

The price record field sets contain generic fields whose label contains 'Customer info'. In amt_fieldSetHandler.getFieldsAndRecords, if any of those are in the field set, Apex builds a map of every AMT_Price_Record__c picklist value on the configuration object, defaulting to 'NA'. Then it reads active AMT_Customer_Attributes_Configuration__c rows for the agreement's parent customer and for the service, 'All' and, for Test or Probe, 'Post Test', and fills in the real labels. The map goes back as CUSTOMER_ATTRIBUTE. In the LWC each column label is swapped using that map, and columns still labelled 'NA' are spliced out. So each parent customer sees its own attribute names, and unused generic columns disappear.

- Generic 'Customer info' fields, relabelled per parent customer
- Service label first, Post Test label appended with ' / ', All only fills gaps
- Unconfigured columns ('NA') removed in the LWC
- The splice assumes NA columns come after the labelled ones

```java
// amt_fieldsettable.js
element.label = customerAttributeMap[element.label] ? customerAttributeMap[element.label] : element.label;
if(element.label == 'NA') {
    countOfExtraCustomerAttribute++;
} else {
    indexOfExtraCustomerAttribute++;
}
...
item.splice(indexOfExtraCustomerAttribute, countOfExtraCustomerAttribute);
```

<sub>Also asked as: How did you make datatable column labels dynamic per customer? · What are customer info columns in your QTC project? · How does AMT_Customer_Attributes_Configuration__c affect the UI? · Dynamic column headers in LWC from configuration</sub>

### How does pagination work in your QTC tables?
*Mid (3–6 yrs) · concept* · `qtc-ui-008`

It is client-side pagination with two components. amt_pagination is the table wrapper: it gets all rows and columns through @api setters, slices the current page, adds a serial number column, and renders a lightning-datatable with sorting and infinite loading. amt_paginator is the footer with first, previous, next, last, a page picker and a page-size picker whose options come from the custom label AMT_Pagination_Records_Count. When the user changes page, the paginator fires a paginationchange event with pageNumber and pageSize, and amt_pagination re-slices the data. The parent amt_fieldsettable passes records-per-page 100 and, after loading, sets the data through querySelector and calls the @api method setRecordsToDisplay.

- amt_pagination = data + datatable, amt_paginator = controls
- Child-to-parent: paginationchange CustomEvent
- Parent-to-child: @api setters and @api methods
- Page sizes configurable through a custom label

```java
// amt_paginator.js
    reloadData(newPageNumber) {
        let operationType = this.getOprationType(newPageNumber);
        this.pageNumber = newPageNumber;
        const customEvent = new CustomEvent('paginationchange', {
            detail: { pageSize: this.pageSize, pageNumber: this.pageNumber, operationType }
        });
        this.dispatchEvent(customEvent);
    }
```

<sub>Also asked as: Explain amt_pagination and amt_paginator · Did you build a reusable pagination component in LWC? · Client-side or server-side pagination in your project? · How does the paginator talk to the table?</sub>

### Users selected rows on page 1, moved to page 2 and lost their selection. How was that handled?
*Senior (7–10 yrs) · scenario* · `qtc-ui-009`

lightning-datatable only knows about the rows it is showing, so selection is lost when you swap the data. In amt_pagination, under issue 12175, handleRowSelection keeps a running Set of selected Ids and a Map called _selectedById with the full row data. On every selection event it adds the newly selected Ids, and removes only the Ids that are on the current page but no longer selected, so selections on other pages stay. When the page changes, reapplySelectionForCurrentPage filters the saved Ids down to the ones on the new page and binds them to selected-rows. When the parent calls the @api fetchSelectedRecords, it fires getselectedrecs and getselectedrecsdata events so the parent gets the ids and the rows.

- Keep selection state outside the datatable
- Only remove ids that belong to the visible page
- Re-apply selected-rows after every page change
- Parent pulls selection with an @api method + events

```java
// amt_pagination.js
reapplySelectionForCurrentPage() {
    const visibleRows = this.displayedData || this.recordsToDisplay || this.records || [];
    const idsOnThisPage = new Set(visibleRows.map(r => r.Id));
    const selectedIds = new Set(this.selectedRows || []);
    this.selectedOnThisPage = Array.from(selectedIds).filter(id => idsOnThisPage.has(id));
}
```

<sub>Also asked as: How do you keep row selection across pages in lightning-datatable? · Selected records disappear when I change page, how to fix? · Multi-page selection in LWC datatable · What was the fix for issue 12175?</sub>

### Sorting by the price record number was wrong in your table. What was the cause and fix?
*Mid (3–6 yrs) · troubleshooting* · `qtc-ui-010`

There were two causes. The first column is a URL column whose fieldName is fieldURL, the record link, so sorting used the link instead of the PR number shown on screen. And the PR number is an auto number, which is text, so it sorted character by character, giving 1, 10, 2. The fix under QTC-1620 in amt_pagination.handleSort maps fieldURL back to the real field passed in urlField, and when that field is Name it strips non-digits and compares the values as integers. After sorting it rebuilds the first page, resets the serial numbers, and tells amt_paginator to go to page one.

- Sort on the displayed field, not the URL
- Auto number is text, compare as number
- Reset to page 1 after a sort

```java
// amt_pagination.js
const sortField = (sortedBy === 'fieldURL' && this.urlField) ? this.urlField : sortedBy;
const cloneData = [...this.records];
cloneData.sort((a, b) => {
    let aVal = a[sortField] ? a[sortField] : '';
    let bVal = b[sortField] ? b[sortField] : '';
    if (sortedBy === 'fieldURL' && this.urlField === 'Name') {
        aVal = parseInt(String(aVal).replace(/\D/g, ''), 10) || 0;
        bVal = parseInt(String(bVal).replace(/\D/g, ''), 10) || 0;
    }
```

<sub>Also asked as: Why does sorting on a URL column not work in lightning-datatable? · Sorting PR number gives 1, 10, 2 order, how to fix? · How did you fix the sort in amt_pagination? · Auto number field sorting issue in LWC</sub>

### The price record table is slow when an agreement has many rows. How would you approach it in this project?
*Senior (7–10 yrs) · troubleshooting* · `qtc-ui-011`

I'd start from the data path. amt_fieldSetHandler.getFieldsAndRecords has no LIMIT on the main price agreement query, so every price record for the agreement comes back in one call, and paging is only done in the browser by amt_pagination. In the main branch it also runs a field describe inside the filter loop, while the Link PR branch already describes once outside the loop. On the client, getPriceData and amt_pagination do JSON.stringify inside console.log on the full result and columns, which is costly on big lists. So my fixes would be: move the describe out of the loop, remove the heavy logging, and for very large agreements add server-side paging with LIMIT and a cursor, instead of loading everything.

- No LIMIT on the main query, all rows sent to the browser
- Describe inside a loop in one branch
- JSON.stringify logging of full data
- Server-side paging for big agreements

<sub>Also asked as: Component is slow with many records, what would you do? · How do you improve LWC datatable performance with large data? · Your price agreement screen takes long to load, why? · Performance tuning of the field set table</sub>

### When do you use @wire and when do you call Apex imperatively in your QTC components?
*Mid (3–6 yrs) · comparison* · `qtc-ui-012`

We use @wire for reads that depend on a reactive value and can be cached. For example, the Die and Wire cards wire getRecord for the user's profile and AMT_Business_Role__c, and wire AMT_FieldSet_Helper.getPackageGroupName with '$recordId', which is cacheable=true. The popups wire getObjectInfo and getPicklistValues for picklists, and cacheable Apex like getPackageDimensionCodeOptions. We call Apex imperatively for anything that changes data, like createPriceRecordBackgrind or updatePriceRecords, and for reads that must always be fresh, like getFieldsAndRecords, which is cacheable=false. Our RULES.md says the same: wire for reactive reads, imperative for actions and paging, and any Apex read by @wire must be cacheable=true.

- @wire: LDS getRecord, getObjectInfo, getPicklistValues, cacheable Apex
- Imperative: DML methods and always-fresh reads
- Wired Apex must be cacheable=true
- Cacheable methods can still be called imperatively

<sub>Also asked as: Wire vs imperative Apex in your project? · How do your LWCs call Apex? · Which Apex methods are cacheable in your project and why? · cacheable true vs false examples from your project</sub>

### You used refreshApex and cacheable Apex in these components. What pitfalls did you see?
*Senior (7–10 yrs) · troubleshooting* · `qtc-ui-013`

refreshApex only works on the value provisioned by a @wire. In amt_FieldSetComponent, refreshChildData calls refreshApex on wiredDataRecords, but that variable holds data from an imperative call, so it does nothing. It still works in practice because the parent also sets the reload setter, which calls fetchDataRecords again. amt_fieldsettable has the same pattern with priceRecordsData. The other pitfall is stale cache: getPackageGroupName is cacheable=true and drives the New button, so after a status change the component can show the old state until the cache refreshes. My fix would be to call the imperative method again instead of refreshApex, or to wire it properly and keep the full wired result for refreshApex.

- refreshApex needs the wired result object
- Imperative results: just call the method again
- Cacheable reads can be stale after DML
- Keep the whole wired response, not only data

```java
// amt_FieldSetComponent.js
    @api refreshChildData(){
        refreshApex(this.wiredDataRecords);
    }
...
        getFieldsAndRecords({ strObjectApiName: this.sfdcObjectApiName,
...
        .then(data=>{
            this.wiredDataRecords = data;
```

<sub>Also asked as: Why doesn't refreshApex refresh my imperative call? · Stale data from a cacheable Apex method, how to handle? · refreshApex not working in LWC · Problems with cacheable=true in your project</sub>

### How do parent and child components communicate in your QTC LWCs?
*Fresher (0–2 yrs) · concept* · `qtc-ui-014`

We use the standard LWC patterns. Parent to child, we pass @api properties in the template, like the object name and field set name into amt_FieldSetComponent, and we call @api methods on the child through this.template.querySelector, like setRecordsToDisplay on amt_pagination or fetchDataRecords on the field set table. Child to parent, the child fires a CustomEvent. For example, amt_FieldSetComponent fires senddiedetails with the selected Die Ids, which aMT_DieDescriptionComp uses for the Link Wires flow; amt_pickListInput fires notify with the field name and value; and the popups fire close so the parent can hide the modal.

- Down: @api properties and @api methods
- Up: CustomEvent with a detail payload
- Events: senddiedetails, notify, paginationchange, getselectedrecs, close
- Across the page: Refresh_Price_Records__e platform event

<sub>Also asked as: Parent to child and child to parent communication in your project · How does the Die card get selected rows from the table? · Examples of custom events in your components · How do you call a child method from the parent in LWC?</sub>

### How do your components refresh when a price record is created somewhere else on the page?
*Senior (7–10 yrs) · design* · `qtc-ui-015`

We use a platform event, Refresh_Price_Records__e. After Apex inserts a price record, for example in AMT_AddReflowBackgrindController, amt_DisplayLotCharges or AMT_DisplayPostTestPopUp, it publishes the event, and flows can publish it too through the invocable AMT_Refresh_Platform_Event. Components like amt_FieldSetComponent, amt_RelatedPriceRecords, amt_InsertionAttributes and aMT_PackageGroupRecordPage subscribe through lightning/empApi and reload their data when it arrives. This lets components that are not parent and child stay in sync. The trade-offs are that the event has no record Id in it, so every open subscriber reloads, and amt_FieldSetComponent never unsubscribes. I'd add a quote line Id to the event and unsubscribe in disconnectedCallback.

- Apex publishes, empApi subscribes
- Works across unrelated components and flows
- Event carries no record Id, so everyone reloads
- Unsubscribe in disconnectedCallback

```java
// AMT_AddReflowBackgrindController.cls
        insert priceRecord;
        Refresh_Price_Records__e refreshRecord = new Refresh_Price_Records__e();
        EventBus.publish(refreshRecord);
// amt_FieldSetComponent.js
        subscribe(this.channelName, -1, callbackFunction).then(response => {
        });
```

<sub>Also asked as: How do unrelated LWCs on a record page talk to each other in your project? · Why did you use a platform event to refresh components? · Refresh_Price_Records__e how does it work? · empApi usage in your project</sub>

### What do the Die Description and Wire components do on the quote line?
*Mid (3–6 yrs) · concept* · `qtc-ui-016`

aMT_DieDescriptionComp and aMT_WireDescriptionComp are cards on the quote line that list AMT_Die_Description__c and AMT_Wire__c records. They wire getPackageGroupName to read the quote line's package group, family, service and status, then call AMT_PackageSpecificAttribute.getRelatedRecords to count records for the card title. The table itself is amt_FieldSetComponent, filtered on AMT_Quote_Line__c. The New button opens aMT_RecordCreateForm, and its visibility depends on business role and status. On the Die card, if the quote line has wires, a Link Wires button appears: the user selects Die rows, the child sends the Ids up with the senddiedetails event, and the card runs the AMT_Link_Wire_To_Die_Records flow in a modal and shows a success toast when it finishes.

- Card title shows record count
- Table = amt_FieldSetComponent with a Die or Wire field set
- New button gated by role + Draft status
- Link Wires runs the AMT_Link_Wire_To_Die_Records flow

<sub>Also asked as: Explain aMT_DieDescriptionComp · How are Die and Wire records shown on a quote line? · What is the Link Wires button? · Die and wire linking in your QTC project</sub>

### A sales rep says the New button is missing on the Die Description card. What would you check?
*Fresher (0–2 yrs) · troubleshooting* · `qtc-ui-017`

The button is controlled in the component JavaScript, so I'd check the inputs to that check. In aMT_DieDescriptionComp, showNewButton is true when the user's AMT_Business_Role__c is in the custom label AMT_Business_Role_Sales_Rep and the quote line status is Draft, or when the profile is System Administrator. There is also a QTC-781 case: a Test TPM user on a Draft Assembly quote line created by a Test TPM. So I'd confirm the user's business role, the label value, and the QuoteLine_Status__c. Since getPackageGroupName is cacheable, I'd also hard refresh to rule out a stale cached status. The wire handlers have empty error branches, so I'd check the browser console and network for a silent Apex error.

- Business role must match the Sales Rep label
- Quote line must be Draft (or user is System Administrator)
- QTC-781 Test TPM exception
- Errors in the wire are swallowed silently

<sub>Also asked as: New button not visible on the Wire card · Why can't a user create a Die record from the quote line? · Button hidden for some users in your LWC, how to debug? · User can't see New button on DWS related list</sub>

### How does the aMT_DWS_DetailPage component decide which fields to show and who can edit?
*Mid (3–6 yrs) · concept* · `qtc-ui-018`

aMT_DWS_DetailPage sits on the Die, Wire or Substrate record and uses @api recordId and objectApiName. On load it chains imperative calls to AMT_DWS_Handler: the user's business role, the parent quote line Id, then the quote line's package family, group, status and assignees. Then getDWSMetadata looks up AMT_DWS_Attribute_Mapping__mdt by object and package family or group to get the field set name, and returns its fields. The LWC splits them into two columns of lightning-input-field inside a lightning-record-edit-form. Edit access is decided in getRelatedPackageFamilyRecords from status and role, for example Draft for Sales Rep, With Pricing for the assigned Pricing Team Member, or With BU Pricing for the BU team, otherwise read only.

- Custom metadata picks the field set per package family
- lightning-record-edit-form does the save, no custom DML
- Edit mode by status + business role + assignee
- Operation code handled by a searchable combobox

```java
// aMT_DWS_DetailPage.js
                  var fields = event.detail.fields;
                  fields.AMT_Operation_Code__c = this.opCodeText;
                  fields.AMT_Operation_Description__c = this.opCode;
                  this.template.querySelector('lightning-record-edit-form').submit(fields);
```

<sub>Also asked as: Explain your metadata driven record detail page · How did you build a dynamic edit form for Die, Wire and Substrate? · What is AMT_DWS_Attribute_Mapping__mdt used for? · Dynamic lightning-record-edit-form from custom metadata</sub>

### How do you control who can edit or click buttons in your QTC components, and is that secure?
*Senior (7–10 yrs) · design* · `qtc-ui-019`

Most checks are in the component JavaScript. The components read the user's Profile and AMT_Business_Role__c, through getRecord or AMT_DWS_Handler.getUserInformation, and the quote line status and assignees, then switch flags like showNewButton, showButtons or editfields. Some role names come from custom labels like AMT_Business_Role_Sales_Rep and AMT_Sys_Admin_Profile, but many are string literals like 'Test TPM' or 'Pricing Supervisor'. This is good for user experience, but it is not security, because the Apex methods behind the buttons are @AuraEnabled and some classes, like AMT_AddReflowBackgrindController, are without sharing. So the real protection has to be on the server: sharing, validation rules, or checks in Apex. I'd also move the role names to custom permissions so the rules are not spread across components.

- UI flags from role + status + assignee
- Hiding a button is UX, not security
- Enforce on the server: sharing, validation, Apex checks
- Custom permissions instead of string role names

<sub>Also asked as: How is role-based access handled in your LWCs? · Is hiding a button in LWC enough for security? · How did you implement status based edit permissions in the UI? · Business role checks in JavaScript, any risk?</sub>

### What do the Add Backgrind and Add Reflow popups do?
*Fresher (0–2 yrs) · concept* · `qtc-ui-020`

They are small modal forms that create a backgrind or reflow price record on a quote line. Both use amt_GenericModal for the layout. The Plant picklist comes from getPicklistValues on AMT_Price_Record__c. Dimension codes come from AMT_AddReflowBackgrindController.getPackageDimensionCodeOptions, which filters AMT_PDL_Master__c using codes listed in a custom label for backgrind or reflow. For backgrind the package code is fixed to WX, and when the user picks a thickness, getLeadCountCode reads the lead count code from the custom metadata AMT_Backgrind_Thickness__mdt, unless they choose Other. The reflow popup lets the user pick package code WA or WL. On save it calls create or update in Apex and shows a toast.

- Plant from picklist, dimension from AMT_PDL_Master__c
- Lead count from AMT_Backgrind_Thickness__mdt
- Same popup handles create and edit (editLotPR flag)
- Toast on success or error

<sub>Also asked as: Explain amt_AddBackgrindPopup · How does the reflow popup create a price record? · What is the backgrind thickness lead count logic? · Popups for adding price records on a quote line</sub>

### The Edit button for backgrind or reflow price records sometimes doesn't close properly. What did you find in the code?
*Mid (3–6 yrs) · troubleshooting* · `qtc-ui-021`

Looking at aMT_Edit_Bachgrind_Reflow_Button, there are a few wiring mistakes. The parent listens for onclose, but the popups fire closebackgrind and closereflow, so the parent handler never runs and openModal in the parent stays true. The popup hides itself by setting its own @api openModal, which is not a good pattern because the parent owns that value. handleReflowCloseModal sets isModalOpen, a property that isn't used, instead of openModal. And the backgrind tag passes record-id={quotelineId} while the property is quoteLineId, so that value is undefined. It works because updateBackgrindPREditFieldsData reads the quote line from the record data. The fix is to match event names, let the parent own openModal, and fix the property name.

- Event name must match the on<event> handler
- Don't mutate @api properties in the child
- Watch for camelCase typos in template bindings
- setTimeout used to wait for child render

```html
<!-- aMT_Edit_Bachgrind_Reflow_Button.html -->
        <c-amt_-add-backgrind-popup open-modal={openModal} record-id ={quotelineId} onclose={handleBackgrindCloseModal}>
        </c-amt_-add-backgrind-popup>
// amt_AddBackgrindPopup.js
    handleCloseModal() {
        this.openModal = false;
        this.dispatchEvent(new CustomEvent('closebackgrind'));
    }
```

<sub>Also asked as: Modal close event not reaching the parent, why? · Bugs in aMT_Edit_Bachgrind_Reflow_Button · Child event name doesn't match parent handler in LWC · Popup closes but parent state is wrong</sub>

### How does aMT_displayChargesAndAdders decide which popup to open?
*Mid (3–6 yrs) · design* · `qtc-ui-022`

aMT_displayChargesAndAdders is a router. It wires amt_DisplayLotCharges.getQuotelineDetails with the quote line Id to get the service and package group. When the parent calls its @api method handleAddAddersCharges, it compares the package group with custom labels like AMT_Fast_Track_Charges, AMT_Lot_Charges, AMT_Process_Adder and AMT_SID_Adder, and the service with AMT_Service_Name, and turns on one lwc:if flag. That renders the right child: fast track, lot charges, process adder, SID charges, or post test for the Test service. In edit mode it waits one second with setTimeout, then sets editLotPR and lotPRData on the child and calls its updatePREditFieldsData method. One thing I'd fix: the backgrind branch queries c-amt_-add-backgrind-popup, which isn't in this template.

- Package group compared with custom labels
- lwc:if renders one child popup
- Edit mode: push record data into the child via @api
- setTimeout(1000) to wait for render is fragile

<sub>Also asked as: Explain your adders and charges container component · How do you show a different form based on package group? · Dynamic child component selection in LWC · What does handleAddAddersCharges do?</sub>

### What are the lot charges, fast track, SID and process adder components in your project?
*Fresher (0–2 yrs) · concept* · `qtc-ui-023`

They are modal forms that create or edit AMT_Price_Record__c records for extra charges on a quote line. aMT_displayLotCharges handles lot charges, including Small Lot rules where the user must pick either a package family code or a package code. amt_displayFastTrackCharges handles fast track charges and fills cycle and date from AMT_SAP_Code_Description__c based on business type and lot code. amt_DisplaySIDCharges handles SID adders with a material code list. amt_DisplayProcessAdder handles process adders with an operation code and a dependent condition code. amt_AddPostTest creates post test price records, copies plant, volume, device name and price level from the quote line, and supports grouped post test records. Each one validates in JavaScript, calls Apex, and shows a toast.

- All create AMT_Price_Record__c for one quote line
- Code lists from AMT_PDL_Master__c and AMT_SAP_Code_Description__c
- Same component for create and edit (editLotPR)
- Post test supports grouped price records

<sub>Also asked as: Explain the display charges components · What is a fast track charge or SID adder screen? · How do users add adders to a quote line? · What does amt_AddPostTest do?</sub>

### How did you build the dependent Package, Dimension and Lead Count picklists?
*Mid (3–6 yrs) · code* · `qtc-ui-024`

The options come from the AMT_PDL_Master__c object, not from field dependencies. The package code list comes from a cacheable method, getOptions_packgCode. When the user picks a package code, the LWC imperatively calls getOptionsPckgDimensionCode, which queries AMT_PDL_Master__c for that package code and builds labels like XxY (code), de-duplicated with a map. When they pick a dimension, getOptionsDensity returns lead counts for that package and dimension. On save, validationDimension checks that the package, dimension and lead combination exists in AMT_PDL_Master__c, and returns QTC_Constants.INVALID_PDL if not, which is shown as an error toast. The options are shown in our searchableCombobox so users can type to filter long lists.

- Options from AMT_PDL_Master__c records
- Map used to remove duplicates
- Server-side combination check before save
- searchableCombobox for long lists

```java
// amt_DisplayLotCharges.cls
        for(AMT_PDL_Master__c obj : [Select AMT_dimension__c, AMT_dimensionX__c, AMT_dimensionY__c from AMT_PDL_Master__c where AMT_packageCode__c = :packageCode]){
            
            if(!packageDimensionCodeMap.containsKey(obj.AMT_dimension__c)){
                packageDimensionCodeMap.put(obj.AMT_dimension__c, String.valueOf(obj.AMT_dimensionX__c) + 'X' + String.valueOf(obj.AMT_dimensionY__c) + ' (' + String.valueOf(obj.AMT_dimension__c) + ')');
            }
        }
```

<sub>Also asked as: Cascading picklists in LWC from a custom object · How do dimension codes depend on package code in your forms? · Dependent dropdowns from Apex in LWC · PDL picklists in your project</sub>

### How do you handle errors and show messages to users in your QTC components?
*Mid (3–6 yrs) · concept* · `qtc-ui-025`

We use two patterns. In newer code, Apex throws AuraHandledException with a clear message, for example AMT_AddReflowBackgrindController's update methods, AMT_DWS_Handler.getDWSRecord, and AMT_ApprovalWorkItemController.getWorkItems, which wraps unexpected errors as 'Unable to load approval work items.' The LWC catches it and reads error.body.message; amt_ApprovalWorkItems has a reduceError helper and amtPartnerGroupManager has extractError. In older popups like amt_DisplayLotCharges.createPriceRecord, Apex catches the exception and returns the message as a String, and the LWC shows it in a ShowToastEvent. For user input we validate in JavaScript first and show error toasts like 'Please Fill all mandatory fields' before calling Apex. lightning-record-edit-form errors are shown through its onerror handler.

- AuraHandledException + error.body.message
- reduceError / extractError helpers
- Older code returns error text as a String
- Client-side validation before calling Apex

<sub>Also asked as: Error handling in your LWCs · How do you show toast messages from LWC? · AuraHandledException usage in your project · How does Apex send errors back to the component?</sub>

### A user saw a green success toast but the record was not created. How could that happen in your code?
*Mid (3–6 yrs) · troubleshooting* · `qtc-ui-026`

In some popups the Apex method catches every exception and returns the message as a normal String. For example amt_DisplayLotCharges.createPriceRecord returns QTC_Constants.SUCCESS_MESSAGE on success but e.getMessage() on failure. The LWC treats any returned value as success, so it shows a success toast with the error text, closes the modal, and reloads the page. Another issue is in the catch blocks, where the raw error object is passed as the toast message, so users can see [object Object]. The fix is to throw AuraHandledException from Apex so the promise rejects, and in the catch read error.body.message, like the reduceError helper in amt_ApprovalWorkItems.

- Returning error text from Apex hides failures
- Throw AuraHandledException so .catch runs
- Never pass the raw error object as message
- Use a shared reduceError helper

```java
// amt_DisplayLotCharges.cls
            insert objprice;
            message = QTC_Constants.SUCCESS_MESSAGE;
            ...
        catch(Exception e){
            message = e.getMessage();
        }
        return message;
// aMT_displayLotCharges.js
        .then((result) => { 
            this.showLabel = result;                   
            this.dispatchEvent(new ShowToastEvent({
                title:'Success',
```

<sub>Also asked as: Success toast shown even when save failed · Toast shows [object Object], how do you fix it? · Why is returning error strings from Apex a bad idea? · Wrong toast variant on Apex error</sub>

### How did you build a reusable modal component in your project?
*Fresher (0–2 yrs) · code* · `qtc-ui-027`

amt_GenericModal is a small reusable modal built with SLDS markup and three named slots: headercontent, bodycontent and footercontent. It also takes an @api modalClass, so the parent can choose the size, like slds-modal_small. The parent shows it with if:true and puts its own content into the slots, as amt_AddBackgrindPopup and amt_AddReflowPopup do with their header, form fields and Save and Cancel buttons. This keeps the modal markup in one place. Today I'd also consider the LightningModal base component, which handles focus and accessibility for you.

- Named slots for header, body, footer
- @api modalClass controls size
- Parent controls visibility with if:true
- LightningModal is a newer alternative

```html
<!-- amt_GenericModal.html -->
    <section role="dialog" tabindex="-1" class={modalClass} aria-labelledby="modal-heading" aria-modal="true" style="overflow: visible;">
        <div class="slds-modal__container" style="overflow: visible;">
            <div class="slds-modal__header" style="font-size: large;">
                <slot name="headercontent">Default content</slot>
            </div>
            <div class="slds-modal__content slds-p-around_medium custom-modal-height" id="modal-content">
                <slot name="bodycontent">Default content</slot>
            </div>
            <div class="slds-modal__footer">
                <slot name="footercontent">Default content</slot>
            </div>
```

<sub>Also asked as: Explain amt_GenericModal · How do you create a modal with slots in LWC? · Reusable popup component using named slots · How do the backgrind and reflow popups get their layout?</sub>

### What is the searchableCombobox component and why did you need it?
*Fresher (0–2 yrs) · concept* · `qtc-ui-028`

searchableCombobox is a custom type-ahead dropdown built with SLDS combobox markup, because lightning-combobox doesn't let users type to filter. It takes @api label, options and value. As the user types, a getter filters the options whose label contains the text, and it supports keyboard navigation with arrow keys, Enter, Escape, Home and End. When a value is picked it fires a change event with the value. We use it in many places, like the backgrind and reflow popups, the charge popups, the DWS detail page for operation code, and the price record table, for long code lists like dimension codes. One thing I noticed is that isInvalid always returns false, so its required flag doesn't actually show an error; the parents validate instead.

- Type to filter long option lists
- Keyboard navigation support
- Fires a change event with detail.value
- Required validation is disabled inside it

<sub>Also asked as: Why not use lightning-combobox for long lists? · How does your type-ahead dropdown work? · Explain searchableCombobox in your project · Searchable picklist in LWC</sub>

### How does amt_pickListInput load picklist values without Apex?
*Fresher (0–2 yrs) · code* · `qtc-ui-029`

amt_pickListInput uses two Lightning Data Service wire adapters. First it wires getObjectInfo with the object API name to get the field's label and the default record type Id. Those values are stored in reactive properties, and that triggers the second wire, getPicklistValues, which returns the values. It adds a --None-- option and renders a lightning-combobox. When the user picks a value it fires a notify event with the value and field name, and it has an @api handleReset method to clear it. amt_fieldsettable uses it for the picklist filters in its filter bar, and no Apex is needed.

- getObjectInfo gives defaultRecordTypeId
- '$' reactive params chain the second wire
- notify event carries value + fieldName
- No Apex call needed

```java
// amt_pickListInput.js
    @wire(getObjectInfo, { objectApiName: '$objectApiName' })
    objectInfo(result) {
        if (result.data) {
...
                this.recordTypeId = result.data.defaultRecordTypeId;
...
    @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: '$objfiedAPIName' })
    picklistValues({ error, data }) {
```

<sub>Also asked as: How do you get picklist values in LWC? · getPicklistValues example from your project · Chained wire adapters in LWC · Reusable picklist filter component</sub>

### Where are Aura components still used in your QTC project?
*Fresher (0–2 yrs) · concept* · `qtc-ui-030`

Aura is used only for small wrapper jobs. Some Aura components are flow local actions, using lightning:availableForFlowActions with an invoke method: AMTReloadPage reloads the page, toastEventPA shows a warning toast about the effective date, and amt_navigateRecord navigates to a record in view or edit mode. Others are quick action and page wrappers: amt_add_price_cmp, amt_manage_price_cmp and amt_Link_Price_Records_cmp fire force:navigateToComponent to open amt_price_record_cmp with a function value like addPR, managePR or LinkPR, and that Aura component hosts the LWC amt_manage_price_records. Today I'd look at LWC quick actions or lightning:navigation with a component page reference instead of force:navigateToComponent.

- Flow local actions: AMTReloadPage, toastEventPA, amt_navigateRecord
- Quick action wrappers that open amt_price_record_cmp
- amt_price_record_cmp hosts the LWC amt_manage_price_records
- Business UI itself is in LWC

<sub>Also asked as: Do you still use Aura? Why? · What Aura components are in your project? · Flow local actions in your project · How do quick actions open your LWC?</sub>

### Where are your QTC components placed, and how do they get the record Id?
*Fresher (0–2 yrs) · concept* · `qtc-ui-031`

Most of our components are made for record pages and take @api recordId, which Lightning fills in automatically. For the Die and Wire cards, recordId is the quote line. aMT_DWS_DetailPage also takes @api objectApiName and sits on the Die, Wire or Substrate record, then finds its quote line through Apex. The edit buttons for backgrind, reflow and post test sit on the AMT_Price_Record__c record and wire getRecord with '$recordId'. amt_ApprovalWorkItems takes the record under approval. amtPartnerGroupManager has no recordId; it is a standalone admin screen. Some components are not placed directly at all, but are children, or are used inside flows, like amt_Spinner_Component. The repo doesn't have the meta XML or flexipage files, so I can't name the exact pages from it.

- @api recordId auto-filled on record pages
- objectApiName lets one component work on several objects
- Children get ids from parents
- Placement metadata not in this repo

<sub>Also asked as: Record page placement of your LWCs · How does your component know which record it is on? · Which page are these components on? · recordId in LWC from a record page</sub>

### What does the amt_ApprovalWorkItems component show?
*Mid (3–6 yrs) · concept* · `qtc-ui-032`

amt_ApprovalWorkItems shows the approval history for the record it's placed on. It calls AMT_ApprovalWorkItemController.getWorkItems, which queries ApprovalWorkItem rows where RelatedRecordId is the record, newest first. For recalled items it takes the reviewer and date from the Recall row in ApprovalSubmissionDetail. It also parses a custom field, AMT_Aged_PRs__c, stored as prefix-priceAgreementId-priceToCustomer separated by semicolons, and loads those price agreements so each row can expand to show the aged price records. Status labels come from the picklist describe. On the LWC side, it waits three seconds before loading, uses registerRefreshHandler from lightning/refresh to reload on a standard refresh, keeps expanded rows open after a reload, and cleans up in disconnectedCallback.

- Reads ApprovalWorkItem and ApprovalSubmissionDetail
- Parses AMT_Aged_PRs__c into price agreement Ids
- lightning/refresh handler for page refresh
- Errors via AuraHandledException + reduceError

```java
// amt_ApprovalWorkItems.js
    renderedCallback() {
        if (!this.refreshHandlerId) {
            this.refreshHandlerId = registerRefreshHandler(
                this,
                this.handleRefresh
            );
        }
    }
```

<sub>Also asked as: Explain your approval history component · How do you show approval work items in LWC? · What is AMT_ApprovalWorkItemController used for? · ApprovalWorkItem custom UI in your project</sub>

### How are your QTC UI components and their Apex controllers tested?
*Senior (7–10 yrs) · concept* · `qtc-ui-033`

In this repo the testing is in Apex; there are no Jest tests. Each controller has a test class, like amt_fieldSetHandler_Test, AMT_PartnerGroupControllerTest and AMT_ApprovalWorkItemController_Test, with their own test data, and amt_fieldSetHandler_Test and AMT_PartnerGroupControllerTest use System.runAs for role-based paths. The approval test is a good example: ApprovalWorkItem can't be created with DML, so the test builds one in memory with JSON.deserialize and a fake Id from the key prefix, and calls the @TestVisible buildViews method directly, then uses Assert methods. But some older UI test classes, like amt_DisplayLotCharges_Test and AMT_AddReflowBackgrindController_Test, have no assertions, so they give coverage but don't prove behaviour. I'd add asserts there and add Jest tests for the JavaScript logic, like selection across pages.

- No Jest tests in the repo
- Own test data; System.runAs for roles
- JSON.deserialize to fake non-DML objects
- Some tests have coverage but no assertions

```java
// AMT_ApprovalWorkItemController_Test.cls
        return (ApprovalWorkItem) JSON.deserialize(
            JSON.serialize(payload),
            ApprovalWorkItem.class
        );
```

<sub>Also asked as: Do you have Jest tests for your LWCs? · How did you test AMT_ApprovalWorkItemController? · How do you test Apex used by LWC? · How do you test a class that uses objects you can't insert?</sub>

### What does the amtPartnerGroupManager component do?
*Mid (3–6 yrs) · concept* · `qtc-ui-034`

amtPartnerGroupManager is an admin screen for a user's account access. You search a user by name or by SAP partner number, and searchUser decides which by checking if the text is all digits. Analyze then loads, in parallel, the expected group actions from the partner number, every account the user can access with the reason, all accounts, and a summary of region groups. It shows them in a tree-style table with expand and collapse and its own paging of 12 rows. From there the admin can add or remove the user from account groups named Account_<Id>_Internal, grant or remove region groups, add team access for accounts with no partner, or sync group and account team. Each action calls AMT_PartnerGroupController, which returns a short summary, for example the added and removed counts, and the screen re-analyzes to show the new state.

- Search by name or SAP partner number
- Shows access reason per account
- Add/remove group membership, region groups, team members
- Sync between public groups and account teams

<sub>Also asked as: Explain your partner group access tool · How do admins manage account access for a user in your project? · What is AMT_PartnerGroupController? · Account group and team sync screen</sub>

### How did you design AMT_PartnerGroupController for safety and partial failures?
*Senior (7–10 yrs) · design* · `qtc-ui-035`

The controller is with sharing, but GroupMember changes go through a small without sharing class, AMT_WithoutSharingUtility, which calls Database.insert and Database.delete with allOrNone false. performDml counts successes, collects each error, and returns a summary string, so one bad row doesn't roll back the rest. Before inserting it checks existing memberships to avoid duplicates. Region groups are found by DeveloperName ending in RegionalUser or Test, so a new region needs no deploy, and a Test group only counts if its RegionalUser partner exists. Queries have limits like ACCOUNT_LIMIT 10000, and getAllAccounts uses WITH SECURITY_ENFORCED. In the LWC, Analyze uses Promise.allSettled, so one failed call still lets the others show.

- Elevate only the DML that needs it
- allOrNone=false + error summary
- Configuration by naming convention for regions
- Promise.allSettled for independent loads

```java
// AMT_PartnerGroupController.cls
        AMT_WithoutSharingUtility dmlHelper = new AMT_WithoutSharingUtility();
        if (!toInsert.isEmpty()) {
            for (Database.SaveResult sr : dmlHelper.groupMemberInsertAction(toInsert)) {
                if (sr.isSuccess()) { added++; }
                else { for (Database.Error e : sr.getErrors()) errors.add('Add: ' + e.getMessage()); }
            }
        }
```

<sub>Also asked as: How do you handle partial DML failures from an LWC action? · with sharing vs without sharing in your partner group tool · Why use Promise.allSettled in your component? · Design decisions in the partner group controller</sub>

### What does AMT_ProductDataContoller do for the package detail screens?
*Mid (3–6 yrs) · concept* · `qtc-ui-036`

AMT_ProductDataContoller is the Apex behind the package detail upload LWCs, templateUpload and packageDetailsUpload. validateProductDataBulk takes the parsed sheet data per variant. For each section it reads AMT_Package_Group_Service__mdt by section name and quote line package family to find the target object and field set. It then checks each value: picklist values must be allowed values, data types must match, and fields marked required in the field set must be present. A wrong Package Family gives 'Mismatch in template'. The Bypass_RFQI_Validation custom label can switch these checks off. createQuoteLines then writes the values to the quote line and related detail records with AMT_Quote_Line__c set, converting dates in both dash and slash formats.

- Custom metadata maps section + package family to object + field set
- Picklist, data type and required checks
- Custom label to bypass validation
- Returns errors per variant for the LWC to show

<sub>Also asked as: How do you validate uploaded package data against field sets? · Explain validateProductDataBulk · Metadata driven validation in Apex for an LWC · How is template data mapped to Salesforce fields in your project?</sub>

### Are there any security risks in how your UI controllers build queries?
*Senior (7–10 yrs) · troubleshooting* · `qtc-ui-037`

Yes, a few. AMT_FieldSet_Helper, AMT_DWS_Handler.getquoteLineID and the filter code in amt_fieldSetHandler.getFieldsAndRecords concatenate values from the LWC straight into dynamic SOQL. On the price record table, the filter bar sends field names and values, and Apex adds them as LIKE or equals conditions. So a value with an apostrophe breaks the query, and in theory someone could inject SOQL. AMT_FieldSet_Helper and amt_fieldSetHandler also have no sharing keyword, and none of these queries use user mode, so field-level security isn't checked. My fix would be to use bind variables, or Database.queryWithBinds, check field names against the describe map, and run in user mode. RULES.md warns that queryWithBinds with AccessLevel.USER_MODE can't be combined with WITH USER_MODE in the same query.

- Values concatenated into dynamic SOQL
- Apostrophes break filters
- Use binds + whitelist field names via describe
- Run queries in user mode

```java
// amt_fieldSetHandler.cls
                                criteriadetails = criteriadetails + ' AND ' + m.fieldName + ' like\'' + '%'+m.fieldValue+'%' +'\'';
```

<sub>Also asked as: SOQL injection risk in your dynamic queries? · Filter breaks when the value has an apostrophe, why? · How would you secure dynamic SOQL called from LWC? · String.escapeSingleQuotes in your project</sub>

### If you had time, what would you improve in the QTC LWC code?
*Senior (7–10 yrs) · design* · `qtc-ui-038`

A few things I can point to in the code. First, timing hacks: many components use setTimeout of one second to wait for a child to render, and reload the whole page with window.location.reload after saving; we even have amt_ReloadPage and amt_refreshWindow components that only reload the page. I'd pass data as @api properties and refresh with Lightning Data Service or lightning/refresh. Second, error handling: some Apex returns error text as a normal string, so failures can show as success. Third, there are leftovers like heavy console.log calls and a single '=' in amt_fieldsettable, if (this.firstColumnAsLink = 'yes' ...), which always makes the first column a link. Fourth, security: escape or bind dynamic SOQL, and move permission checks to the server. And finally, add Jest tests for the JavaScript logic.

- Replace setTimeout and page reloads
- Throw AuraHandledException instead of returning error strings
- Clean up logging and assignment-in-if bugs
- Bind variables, server-side permissions, Jest tests

```java
// amt_fieldsettable.js
                fieldlist.map(element => {
                    if (this.firstColumnAsLink = 'yes' && firstEntry) {
```

<sub>Also asked as: What technical debt did you see in your components? · How would you refactor your LWCs? · What are the weak points of your project's UI code? · One thing you'd change in the QTC front end</sub>

## QTC project — Flows, automation and testing

### How many flows do you have in your QTC project and what types are they?
*Fresher (0–2 yrs) · concept* · `qtc-fl-001`

In our QTC project the repo has 128 flows. About 72 are record-triggered: 31 before-save, 35 after-save and 6 before-delete, and around 60 of those are active. About 50 are screen flows that users run from buttons or from LWCs, 2 are scheduled flows, 3 are autolaunched subflows called by other flows, and 1 is a Flow Approval Process. Most record-triggered flows sit on SBQQ__QuoteLine__c (16) and AMT_Price_Record__c (12), then Account, AMT_Price_Agreement__c and Opportunity. We have no platform-event-triggered flows; flows only publish events. A few versions are Draft or Obsolete, so I always check the active version first.

- 128 flows: ~72 record-triggered, ~50 screen, 2 scheduled, 3 subflows, 1 approval workflow
- Most on SBQQ__QuoteLine__c and AMT_Price_Record__c
- No platform-event-triggered flows; flows publish events
- Some Draft/Obsolete versions exist

<sub>Also asked as: What kind of flows are there in your project? · Give me an overview of the flows in your org · how much automation is built with flow in your project · Which objects have the most flows?</sub>

### In your project, how do you decide whether logic goes in a flow or in an Apex trigger?
*Mid (3–6 yrs) · design* · `qtc-fl-002`

Looking at how the QTC code is split, simple same-record field defaults and stamps live in before-save flows, for example Quote_Line_Trigger_Before_Create stamps AMT_Gold_Base_Price__c and AMT_Last_Status_Change_Date__c. User-driven steps are screen flows, like AMT_Submit_Quote_Line and AMT_Recall_Button_on_Quote_Line. Emails and notifications are also mostly flows. Heavy, bulk or multi-object logic is in Apex handlers: creating price variants from configurations, PDL rules in AMT_PDLRuleBookProcessor, SAP integration and sharing. When a screen flow needs something Flow cannot do, it calls an invocable class, such as AMT_AssignQuoteLineHelper or AMT_CheckMandatoryFieldsOnPkgAttribute. The weak spot is that some logic exists in both, which I watch for when debugging.

- Before-save flows: simple field defaults on the same record
- Screen flows: button-driven user actions
- Apex: bulk, multi-object, integration, sharing, complex rules
- Invocable Apex bridges flows to Apex

<sub>Also asked as: Flow vs trigger, how was that decided in your project? · Which logic lives in flows and which in Apex in your org? · when do you use record triggered flow instead of apex trigger · How did you split automation between Flow and Apex in your CPQ project?</sub>

### Explain the order of execution when a quote line is saved in your project, with flows and triggers together.
*Senior (7–10 yrs) · concept* · `qtc-fl-003`

On a quote line insert, the before-save flows run first, then QuoteLineTrigger's before insert, then the after insert trigger, and the after-save flows run after that. That matters here because we have overlap. Quote_Line_Trigger_Before_Create sets AMT_Quote_Types__c to Configuration Only or Insertion Only based on AMT_Package_Group__c, and then AMT_QuoteLineTriggerHandler.updateQuoteType sets the same field again from the same package groups, and also sets Individual for Post Test. Because the Apex runs later, its value wins where both apply. On the after side, the trigger runs createPackageSpecificRecords on insert, or createPriceVariants on update, and Quote_Lines_Update_trigger_flow runs after it. CPQ's own package triggers also run on these saves unless SBQQ.TriggerControl is disabled.

- Before-save flows, then before triggers, then after triggers, then after-save flows
- AMT_Quote_Types__c is set by both the flow and updateQuoteType; Apex runs later
- After-save flows see values the triggers wrote
- CPQ package triggers also run unless paused

<sub>Also asked as: What runs first on SBQQ__QuoteLine__c, the flow or the trigger? · How do before-save flows and QuoteLineTrigger interact? · order of execution flows and triggers in your project · If a flow and a trigger both set the same quote line field, which one wins?</sub>

### What does the Quote_Lines_Update_trigger_flow do?
*Mid (3–6 yrs) · concept* · `qtc-fl-004`

It is an after-save flow on SBQQ__QuoteLine__c for create and update, and it does three jobs. First, if AMT_Add_Notes__c changed, it appends a timestamped entry with the user's first name to the notes history. Second, if AMT_Price_Record_creation__c is true, it splits AMT_Plant__c and AMT_Forecasted_Volume_K_week__c on semicolons, sums the gold factor from the line's AMT_Wire__c records, and creates one AMT_Price_Record__c per plant and volume pair. Other service with Unlisted package group gets the stage Not Eligible for Activation. Then it resets the flag to false and publishes Refresh_Price_Records__e. Third, when the status changes to Price Complete, it stamps AMT_Date_When_Price_Complete__c if blank and emails the account creator and the quote line creator.

- Notes history from AMT_Add_Notes__c
- Creates price records per plant x volume when AMT_Price_Record_creation__c is true
- Resets the flag and publishes Refresh_Price_Records__e
- Price Complete: stamps date and sends emails

```html
<!-- Quote_Lines_Update_trigger_flow.flow-meta.xml -->
        <filters>
            <field>AMT_Price_Record_creation__c</field>
            <operator>EqualTo</operator>
            <value>
                <booleanValue>true</booleanValue>
            </value>
        </filters>
        <inputAssignments>
            <field>AMT_Price_Record_creation__c</field>
            <value>
                <booleanValue>false</booleanValue>
            </value>
        </inputAssignments>
```

<sub>Also asked as: Explain the main after-save flow on the quote line · How does a flow create price records from a quote line in your project? · what happens when a quote line becomes Price Complete · Which flow splits plants and volumes into price records?</sub>

### Walk me through what happens when a user clicks Submit on a quote line.
*Mid (3–6 yrs) · scenario* · `qtc-fl-005`

Submit is the AMT_Submit_Quote_Line screen flow. It loads the quote line and calls the invocable AMT_CheckMandatoryFieldsOnPkgAttribute, which returns error text if mandatory package fields are missing, for example a price level or a missing price record for Post Test. It also counts the line's Configurations__c, Insertions__c and AMT_Price_Record__c records and checks multi-site factor and number of sites, showing error screens when something fails. If all is fine, it sets the next status: AMT_Assembly_Status__c to With Pricing or With BU Pricing, or AMT_Test_Status__c to With Test TPM, With Test Services 1 or 2, plus AMT_Submitted_Date__c. For assembly it also sets AMT_Price_Record_creation__c. Then it disables CPQ triggers, updates the line, re-enables them and shows the success screen.

- Mandatory field check through invocable Apex
- Counts configurations, insertions and price records; MSF checks
- Sets status and submitted date
- Sets AMT_Price_Record_creation__c for the after-save flow
- Wraps the update in Disable/Enable CPQ Trigger actions

<sub>Also asked as: How does the Submit Quote Line flow work? · Explain AMT_Submit_Quote_Line end to end · what checks run before a quote line is submitted · How is a quote line moved to With Pricing in your project?</sub>

### Why do your screen flows call a Disable CPQ Trigger action before updating quote lines?
*Senior (7–10 yrs) · code* · `qtc-fl-006`

Flow cannot call SBQQ.TriggerControl directly, so we wrap it in an invocable method, AMT_AssignQuoteLineHelper.controlQLTrigger. Screen flows like AMT_Submit_Quote_Line and AMT_Assign_Quote_Line_Queue call it with True, update the quote lines, then call it with False. That pauses the CPQ package's own triggers, so they do not run on that update; our own QuoteLineTrigger and record-triggered flows still run. The method also publishes Refresh_Price_Records__e so the price record LWC reloads. One thing I'd improve: if the update fails, the flow's fault path goes to an error screen and skips the Enable call. RecalculateQuoteLineStatusBatch does this better with a try/finally.

- Invocable wrapper around SBQQ.TriggerControl
- Disable, update, enable pattern in screen flows
- Only CPQ package triggers are paused, not ours
- Fault path skips enable; batch uses try/finally

```java
// AMT_AssignQuoteLineHelper.cls
    @InvocableMethod
    public static void controlQLTrigger(List<String> disableText){
        if(disableText.size()>0){
            if(disableText[0] == QTC_Constants.TRUE_STRING){
                SBQQ.TriggerControl.disable();
            }
            else{
                SBQQ.TriggerControl.enable();
            }
            //To update price records table on lwc - Madha
            Refresh_Price_Records__e refreshRecord = new Refresh_Price_Records__e();
            EventBus.publish(refreshRecord);
        }  
    }
```

<sub>Also asked as: How do you pause CPQ triggers from a flow? · What is AMT_AssignQuoteLineHelper used for? · can you call SBQQ.TriggerControl from flow · How do you stop the CPQ package recalculating when a flow updates quote lines?</sub>

### What does the Assign Quote Line Queue flow do?
*Mid (3–6 yrs) · concept* · `qtc-fl-007`

AMT_Assign_Quote_Line_Queue is a screen flow that takes the selected quote line Ids, so it works for one or many lines. It reads the current user and each line's business unit and status, then fills the matching assignee lookup. For example AMT_With_Pricing_Assignee__c, AMT_FC_BGA_Assignee__c, AMT_FC_CSP_Assignee__c, AMT_Memory_Memes_Sensors_Assignee__c and AMT_With_BU_Pricing_Assignee__c for pricing, or AMT_With_Test_TPM_assignee__c and the test service assignees for test lines. In one path the user picks people on the screen, in another the current user is assigned. It collects the lines into one collection, disables CPQ triggers, does a single update, enables them again and shows a refresh screen.

- Screen flow over selected quote line Ids
- Picks the assignee field by business unit and status
- Collects lines and updates once
- Disables and re-enables CPQ triggers around the update

<sub>Also asked as: How are quote lines assigned to pricing users? · Explain AMT_Assign_Quote_Line_Queue · how does assign to me work for quote lines · Which flow fills the assignee fields on a quote line?</sub>

### Which before-save flows run on the quote line and what do they set?
*Fresher (0–2 yrs) · concept* · `qtc-fl-008`

There are a few small before-save flows on SBQQ__QuoteLine__c. Quote_Line_Trigger_Before_Create copies the gold base price from the opportunity's account, stamps the last status change date, sets AMT_Quote_Types__c from the package group, and clears AMT_Linked_Pricing_Issue__c on cloned lines. Quote_Line_Trigger_Before_Update stamps the status change date on update. AMT_Update_Lifecycle_for_Test_TPM_Users, for Test, Probe or End of Line lines created by a Test TPM user, sets the test status to With Test TPM and makes that user the assignee. AMT_Update_Quote_Line_Single_Price sets AMT_Single_Price_Submit__c for Single Price Turnkey opportunities. Populating_Data_from_PI_to_QL copies pricing issue details. They are cheap because they change the same record without extra DML.

- Gold base price and status-change date stamps
- Quote type from package group; clears linked PI on clones
- Test TPM users get With Test TPM and are assigned
- Single price submit flag; PI details copied

<sub>Also asked as: What field defaults are done by flow on SBQQ__QuoteLine__c? · Explain the before-save quote line flows · what happens when a quote line is created in your project · How is the Test TPM status set on new quote lines?</sub>

### A quote line did not get the pricing issue details from the opportunity. How would you debug it?
*Senior (7–10 yrs) · troubleshooting* · `qtc-fl-009`

Two pieces of automation do this on insert, so I check both. First the before-save flow Populating_Data_from_PI_to_QL: it only runs when Is_Pricing_Issue_Exist__c is true and the line is not a clone, and it copies application, target device and lead frame from the opportunity's AMT_Pricing_Issue__c. Then QuoteLineTrigger runs inheritPricingIssueDetailsToQuoteLine, which only inherits when the opportunity has no non-cloned lines yet, skips some service groups, filters plant values, and checks division. If the divisions differ and no other line on that opportunity matched, it blocks the save with the division mismatch message. Its catch logs to AMT_Error_Log__c through ExceptionHandler, so I check that object and a debug log.

- Flow: Is_Pricing_Issue_Exist__c true and not a clone
- Apex: only first lines on the opportunity, division check, excluded service groups
- Mismatch adds an error unless a sibling line matched
- Exceptions land in AMT_Error_Log__c

<sub>Also asked as: Why was the application code or device not copied to the quote line? · Pricing issue inheritance on quote line is not working · quote line division does not match pricing issue error · How is pricing issue data copied to new quote lines?</sub>

### How do you keep the services on the opportunity in sync with its quote lines?
*Mid (3–6 yrs) · concept* · `qtc-fl-010`

We use an after-save flow called AMT_Opportunity_Multi_Service_Indicator on SBQQ__QuoteLine__c. Its entry formula is ISNEW() or a change in AMT_Service__c, so it does not run on every edit. It gets all quote lines for the same AMT_Opportunity__c, loops through them and builds a unique list of services such as Assembly, Bump, Probe, Test, Reflow and Backgrind, with a count. It also sets yes or no flags for each service, then updates the opportunity once. The description says the indicator should be dynamically linked to quote lines so the opportunity always shows the latest services. Because it re-reads all lines every time, the result is a full recalculation, not an increment.

- After-save flow, entry: ISNEW() or AMT_Service__c changed
- Reads all lines on the opportunity and builds unique services
- One update to the opportunity
- Full recalculation each time

<sub>Also asked as: What is the multi service indicator flow? · How do you roll up quote line data to the opportunity with flow? · Explain AMT_Opportunity_Multi_Service_Indicator · rollup from quote line to opportunity without apex</sub>

### How is the CPQ quote created for an opportunity in your project?
*Fresher (0–2 yrs) · concept* · `qtc-fl-011`

A record-triggered after-save flow, AMT_Create_Quote_and_Update_Opportunity, does it. When an opportunity is saved, it checks whether AMT_Quote__c is empty and whether a quote already exists for that opportunity. If not, and the opportunity is not a clone, it creates an SBQQ__Quote__c with the account, SBQQ__Primary__c true, status Draft, type Quote, the price book, region and private flag. Then it writes the quote back to AMT_Quote__c and sets the price book fields on the opportunity. If a quote exists but is not linked, it links it. The reverse direction is also a flow: AMT_Update_Opportunity_Status_on_Quote_Line_Creation moves the opportunity stage to Quote when the first quote line is created.

- After-save flow on Opportunity creates the primary CPQ quote
- Skips cloned opportunities; links an existing quote if found
- Writes AMT_Quote__c and price book back
- Quote line creation moves the stage to Quote

<sub>Also asked as: Who creates the SBQQ__Quote__c record? · Is the quote created automatically from the opportunity? · Explain AMT_Create_Quote_and_Update_Opportunity · how do opportunity stage and quote relate in your project</sub>

### A user tries to set an opportunity to Closed Won manually and gets an error. What is happening?
*Mid (3–6 yrs) · scenario* · `qtc-fl-012`

That is AMT_Restrict_Manual_Update_for_Closed_Stage, a before-save flow on Opportunity. It runs when StageName changes to a value containing Closed, except Closed Cancel. It gets the child quote lines through AMT_Opportunity__c and counts how many are Closed Won, Closed Lost, Closed No Bid and Closed Cancel. If not all lines are closed, it goes to an error element. If they are, it compares the chosen stage with the line counts, for example Closed Lost or Closed No Bid combinations, and routes to the matching error element. So closing is driven by closing the quote lines, which the AMT_Closed_QuoteLine_Status_Updation screen flow does. One thing I noticed: the Closed Won rule uses AND on StageName equals Closed Won and StageName equals Closed Cancel, which can never both be true, so I'd verify and fix that branch.

- Before-save flow on Opportunity when stage moves to Closed
- Counts child quote line closed statuses
- Blocks if not all lines are closed or the stage doesn't match the lines
- Close lines first with the closure screen flow

<sub>Also asked as: Why can't users close an opportunity directly? · How is the opportunity stage controlled by quote lines? · Explain AMT_Restrict_Manual_Update_for_Closed_Stage · opportunity closed stage validation in your project</sub>

### What do the before-save flows on the price record do?
*Mid (3–6 yrs) · concept* · `qtc-fl-013`

AMT_Price_Record__c has several before-save flows. Price_record_Currency_Update, the only flow with an explicit trigger order of 1, runs on create for non-cloned records and copies fields like customer, device, lead frame, package family and price level from the quote line, with separate branches for Other service and for Reflow and Backgrind, and skips Bundled quote types. Package_detail_data_mapping copies body size and lead or ball count from the package detail object. Price_Record_Record_Trigger_Before_Insert_Update handles status rules, for example E1 plant approved records go to Not Eligible for Activation. Price_Record_Record_Trigger_Before_Insert_Before_Update tracks the previous approved price and the PA number. Update_Bundle_PR_Price_to_Customer sets AMT_Price_to_Customer__c on approval for turnkey cases.

- Copy from quote line on create (trigger order 1)
- Package detail mapping
- Lifecycle and status rules, e.g. E1 plant
- Previous approved price and PA tracking
- Turnkey price to customer on approval

<sub>Also asked as: Explain the AMT_Price_Record__c record-triggered flows · How are price record fields copied from the quote line? · which flows run when a price record is created · What does Price_record_Currency_Update do?</sub>

### How does package detail data reach the price record?
*Mid (3–6 yrs) · concept* · `qtc-fl-014`

Package_detail_data_mapping is a before-save flow on AMT_Price_Record__c. It only runs when AMT_Package_Detail_Updated__c is true and the record is not a clone. It reads the quote line's AMT_Package_detail_object_info__c, which holds the API name of the package detail object, for example AMT_FCBGA_Detail__c, AMT_FCCSP_Detail__c, AMT_Memory__c, AMT_MEMS_Sensor__c, AMT_Test_Services__c or AMT_Wafer_Service__c. A decision picks the branch, a Get Records reads that object by AMT_Quote_Line__c, and an assignment copies body size X, Y, Z, lead or ball count, and wafer size where relevant. It also clears the AMT_Package_Detail_Updated__c flag, so the flag works like a one-time trigger.

- Entry: AMT_Package_Detail_Updated__c true, not cloned
- Branch by AMT_Package_detail_object_info__c
- Reads the package object by AMT_Quote_Line__c
- Copies sizes and counts, clears the flag

<sub>Also asked as: What is Package_detail_data_mapping? · How do you map package-specific objects to the price record? · where do body size and ball count on price record come from · Explain the biggest flow on the price record</sub>

### How is the previous price record expired when a new one replaces it?
*Mid (3–6 yrs) · concept* · `qtc-fl-015`

An after-save flow, AMT_Update_Previous_PR_To_Expired, handles it. It runs on update of AMT_Price_Record__c when AMT_Previous_Price_Record__c is filled and has just changed. It checks the previous record's lifecycle stage. If the previous one is Activated in SAP or Revised, it sets it to Ready For Expiration. Otherwise it sets it straight to Expired. Both paths also stamp PA_Published_date__c. Related to this, the before-save flow Price_Record_Record_Trigger_Before_Insert_Before_Update keeps Previous_Approved_Price_to_Customer__c when the variant status goes from Open to Approved, and moves stages to Revised in certain Activated in SAP cases.

- After-save flow when AMT_Previous_Price_Record__c changes
- Activated in SAP or Revised: Ready For Expiration
- Otherwise: Expired
- Previous approved price kept by a before-save flow

<sub>Also asked as: Explain AMT_Update_Previous_PR_To_Expired · how do price revisions work in your flows · What happens to the old price record after a revision? · price record lifecycle automation in flow</sub>

### How is the historic price record approval built?
*Senior (7–10 yrs) · design* · `qtc-fl-016`

It uses a Flow Approval Process, the ApprovalWorkflow flow type, called Historic_PR_Approval. The start is an after-save flow, AMT_Historic_PR_Approval_Start, on AMT_Price_Record__c when AMT_Need_Approval__c becomes true and AMT_Aged_PRs__c is filled, and it calls the requestApproval action. Stage one is an approval step assigned to the AMT_With_Pricing group, and it uses our custom screen flow Approvals_Workflow_Historic_PR_Evaluate_Approval_Requests. There the approver approves or rejects, and on approve it calls AMT_LoadPRToSAPOnApproval to create the historic records and send prices to SAP, with checks for price agreements in error. Stage two is a background step that sends the decision email. A recall stage runs AMT_Reset_Load_to_SAP. A before-save flow on ApprovalWorkItem copies AMT_Aged_PRs__c onto the work item.

- ApprovalWorkflow flow type with orchestrated stages
- Started by an after-save flow via requestApproval
- Approval step assigned to AMT_With_Pricing group, custom screen flow
- Approve calls Apex to load to SAP; background email; recall resets

<sub>Also asked as: Do you use the new Flow approval process in your project? · Explain Historic_PR_Approval · approval orchestration with flow in your org · How are aged price records approved and loaded to SAP?</sub>

### Which other approval-related flows do you have?
*Mid (3–6 yrs) · concept* · `qtc-fl-017`

Besides the historic price approval, there are several. For metal base price, the AMT_Submit_MBP_Approval screen flow sets AMT_Status__c to Submitted, and an after-save flow, AMT_Submit_MBP_Approval_Helper, uses the Submit for Approval action with the AMT_Metal_Base_Price_Approval process. AMT_Price_Agreement_Submit_for_Approval is a screen flow that calls AMT_PriceAgreementController and updates the agreement status. Price_Record_Recall_Approval_Request finds the pending ApprovalSubmission and uses the recallApprovalSubmission action. Special_Customer_Approval moves related price records to approved. On pricing issues, Pricing_Issue_Status_Updation sets the approval status when the resolution path changes, and Pricing_Issue_Trigger_After_Update emails the submitter when approved or rejected.

- MBP: screen flow sets Submitted, after-save flow submits to approval process
- PA submit screen flow calls Apex controller
- Recall via ApprovalSubmission + recallApprovalSubmission
- Pricing issue approval status and emails

<sub>Also asked as: How are approvals submitted from flows in your project? · Explain metal base price approval · how do you recall an approval request in flow · approval flows for price agreement and pricing issue</sub>

### Do you have scheduled flows in your project? What do they do?
*Fresher (0–2 yrs) · concept* · `qtc-fl-018`

Yes, two, and both are daily reminder flows. AMT_Send_Reminder_For_Under_Review_Accounts runs daily on Accounts where AMT_Status__c is Under Review. For each account it compares AMT_Send_Email_Notification__c with a default number of days from the custom label AMT_Send_Notification_Under_Review_Default_Days, and if they match it sends the AMT_Account_Reminder_Notification email alert. AMT_Lead_Reminder_Notification runs daily on Leads with Status In Progress and AMT_CountDays__c of 30 or more, and sends the AMT_Lead_Reminder_Notification alert only if AMT_Assign_To__c is filled and that user is active. Keeping the number of days in a label means it can be changed without editing the flow.

- Two daily scheduled flows: Account Under Review and Lead reminders
- Filters in the start element limit the records
- Default days in a custom label
- Email alerts as the action

<sub>Also asked as: Tell me about scheduled flows you have worked with · Which flows run on a schedule in your org? · schedule triggered flow example from your project · How are reminder emails sent in your project?</sub>

### Do you use platform-event-triggered flows, or how do flows work with events in your project?
*Mid (3–6 yrs) · concept* · `qtc-fl-019`

We have no platform-event-triggered flows. Instead, flows publish events and Apex subscribes. AMT_M_A_Event_Create_Flow, on Account update when ParentId changes, uses the Run Asynchronously path to create an M_A_Event__e, and the AMT_MandAProcessor trigger handles it. AMT_Remove_Child_Event, on agreement customer update when AMT_State__c becomes Removed and Is_Triggered_from_PE__c is false, also uses the async path to publish Remove_Child_Event__e, which starts a batch. Flows like Quote_Lines_Update_trigger_flow, Update_QL_fields_on_PR and AMT_Submit_QL_Bundle create Refresh_Price_Records__e records, and LWCs like amt_RelatedPriceRecords listen with lightning/empApi to reload. The async path runs after the save is committed.

- No platform-event-triggered flows
- Flows publish M_A_Event__e, Remove_Child_Event__e, Refresh_Price_Records__e
- Apex triggers and LWC empApi subscribe
- Run Asynchronously path used for the event publish

<sub>Also asked as: How do flows publish platform events in your org? · What is the run asynchronously path used for? · flows and platform events in your project · Why does the account flow publish an M&A event?</sub>

### How do you stop users from deleting records in your project?
*Fresher (0–2 yrs) · concept* · `qtc-fl-020`

We use before-delete record-triggered flows that end in an error element. AMT_Quote_Line_Delete_Message_for_Users runs on SBQQ__QuoteLine__c when the user's AMT_Business_Role__c is a BU, pricing or Test Services role, and stops the delete. AMT_Delete_Price_Record stops a price record delete unless AMT_Delete_PR__c is true or the user's role is System Admin or SalesOps. AMT_Contact_Deletion_Restriction blocks contact deletes when the account's status is anything other than Active or Draft, such as Under Review, and AMT_PI_Unlinked checks the price record stage before a pricing issue link is removed. The recall flow AMT_Recall_Button_on_Quote_Line first sets AMT_Delete_PR__c to true on the price records and then deletes them, so the system's own delete passes the check.

- Before-delete flows with error elements
- Checks user's AMT_Business_Role__c
- AMT_Delete_PR__c flag lets system deletes through
- Recall flow sets the flag, then deletes

<sub>Also asked as: Have you used before-delete flows? · How is quote line or price record deletion restricted? · before delete record triggered flow example · Why can't a user delete a price record in your org?</sub>

### What happens in your org when an account is made inactive?
*Mid (3–6 yrs) · concept* · `qtc-fl-021`

The after-save flow Amt_Status_inactive handles it, on Account update when AMT_Status__c changes to Inactive. For a Customer record type, it finds the AMT_Price_Agreement_Customer__c records for that child account that are not yet Removed and sets AMT_State__c to Removed, which in turn fires the AMT_Remove_Child_Event flow. Otherwise it finds the active AMT_Price_Agreement_Group__c records where the account is AMT_Parent_Customer__c, sets AMT_Status__c to Inactive, and sets their active price agreements to Inactive. It collects records in loops and updates each collection once. Other Account flows handle currency, the denied party check with active or rejection emails, the prospect parent, and allowed regions.

- After-save flow when AMT_Status__c becomes Inactive
- Customer: agreement customers set to Removed
- Parent: deactivates agreement groups and their agreements
- Updates collections once, outside loops

<sub>Also asked as: Explain the Account Status Inactive flow · How does account status cascade to price agreements? · what flows run on account in your project · account deactivation automation</sub>

### Which screen flows are launched from LWCs or used for documents in your project?
*Mid (3–6 yrs) · concept* · `qtc-fl-022`

Several LWCs embed screen flows with the lightning-flow tag. amt_RelatedPriceRecords runs AMT_Escalate_Button_on_Price_Record, amt_FieldSetComponent runs AMT_Linking_Configurations, amt_fieldsettable runs AMT_LinkingConfiguration_Bulk, and aMT_DieDescriptionComp runs AMT_Link_Wire_To_Die_Records. They pass input variables and listen to onstatuschange to refresh when the flow finishes. Some screen flows also end with an AMTReloadPage or amt_navigateRecord component action. For documents, six flows, like RFQI_Opportunity_Publication and Price_Agreement_Group_Publication, call the webm__WebmergeGenerator action from a managed document generation package. Many screen flow versions were saved only to change Finish to Close or recolour messages, as their descriptions say.

- lightning-flow inside LWCs with input variables
- onstatuschange to refresh after finish
- Local actions to reload or navigate
- Document generation via webm__WebmergeGenerator action

<sub>Also asked as: Do you embed flows in Lightning web components? · How do you start a flow from an LWC? · lightning-flow component usage in your project · How are RFQI or price agreement documents generated?</sub>

### How are flows involved in the SAP integration?
*Mid (3–6 yrs) · concept* · `qtc-fl-023`

Flows are the user entry points and the notification layer; the actual SAP calls are in Apex. AMT_LoadPR_TO_SAP is a screen flow that checks for duplicate price records with the same AMT_Primary_Key__c on the agreement, checks for agreements in Error and moves the record to the active agreement, then calls the invocable AMT_LoadPRToSAP. AMT_Price_Agreement_Sent_to_SAP sets the agreement to Submitted for Loading with the submission date, SAP load date and current user. PA_Error_Notification runs when an agreement's status changes to Error or Connectivity Failure and sends the Notify_Admin custom notification to members of the Notification_Admin group. On the inbound side, AMT_Pricing_Issue_Status_Update_to_Closed closes a pricing issue when AMT_piStatus__c comes back from SAP as CLS.

- Screen flows start loads; invocable Apex does callouts
- Duplicate and error-agreement checks in AMT_LoadPR_TO_SAP
- Custom notification on Error / Connectivity Failure
- SAP CLS status closes pricing issue

<sub>Also asked as: Which flows send prices to SAP? · Explain the Load PR to SAP flow · how do users know when a price agreement fails in SAP · SAP status updates handled by flow</sub>

### How would you debug a flow issue in this org?
*Senior (7–10 yrs) · troubleshooting* · `qtc-fl-024`

First I list all automation on the object, flows and the trigger together, because many fields here are touched by both. I check which flow version is active, since some are Draft or Obsolete, and check the start conditions and entry formula against the actual record values. Then I reproduce it with a debug log, with Workflow and Apex levels raised, so I see flow elements and trigger methods in order. For screen flows, many fault paths show $Flow.FaultMessage on an error screen, which gives the real error. For Apex, ExceptionHandler writes to AMT_Error_Log__c. I also remember Trigger_Control__mdt only switches off Apex triggers, not flows. Our rules say I only call it a root cause once I have the log or record that proves it.

- List flows and triggers on the object together
- Check active version and entry criteria
- Debug log with flow and Apex events
- Fault screens show $Flow.FaultMessage; Apex errors in AMT_Error_Log__c
- Evidence before root cause

<sub>Also asked as: A record-triggered flow is not working, what do you check? · Steps to troubleshoot a flow error in your project · how do you find which automation changed a field · flow fault debugging approach</sub>

### Price records were created twice for one quote line. How would you investigate in this project?
*Senior (7–10 yrs) · scenario* · `qtc-fl-025`

There are two creation paths, so I'd check which one fired. The Submit screen flow sets AMT_Price_Record_creation__c, and Quote_Lines_Update_trigger_flow creates records per plant and volume, then resets the flag to false. Separately, AMT_QuoteLineTriggerHandler.createPriceVariants creates records from configurations and insertions when the status changes. The code has comments about this: one condition was commented out because duplicate price records were being created, and setRecallFlag was added for a defect called Multiple PRs created for Quote Line, which marks Is_Recall_Action__c on the source records. So I'd check the debug log for both, check that the flag really reset, check Is_Recall_Action__c, and see whether the line was saved twice in one transaction.

- Flow path: AMT_Price_Record_creation__c flag
- Apex path: createPriceVariants on status change
- Code comments mention past duplicate defects
- Check flag reset and Is_Recall_Action__c

<sub>Also asked as: Duplicate price records after submitting a quote line · Why would a quote line create multiple price records? · how do you prevent duplicate record creation between flow and trigger · Multiple PRs created for quote line, how to debug</sub>

### What would you improve in the flows of this project?
*Senior (7–10 yrs) · design* · `qtc-fl-026`

A few things I can point to. Some logic is duplicated: AMT_Quote_Types__c and pricing issue inheritance are set by both a before-save flow and the quote line trigger, so I'd keep one owner. Only Price_record_Currency_Update sets a trigger order, while quote line and price record each have several active before-save flows, so I'd set explicit orders. The Disable CPQ Trigger pattern skips the Enable step on the fault path. AMT_Escalate_Button_on_Price_Record finds supervisors by first and last name text like BGA and Supervisor, which our no-hardcoding rule would move to metadata or a group. The Closed Won branch in AMT_Restrict_Manual_Update_for_Closed_Stage has contradictory AND conditions. I'd also clean out Draft and Obsolete versions and rename Copy_1_of elements, and add fault paths to more record-triggered flows.

- Remove flow/Apex duplication
- Set explicit trigger order
- Re-enable CPQ triggers on fault path
- Replace name-based user lookups
- Clean old versions, rename elements, add fault paths

<sub>Also asked as: What are the weaknesses in your flow design? · If you could refactor your flows what would you change? · flow technical debt in your org · what problems do you see in the existing automation</sub>

### If you switch off a trigger with your custom metadata kill switch, do the flows still run?
*Mid (3–6 yrs) · concept* · `qtc-fl-027`

No. Our kill switch is AMT_TriggerMechanismHandler.disableTrigger, which reads Is_Disabled__c on a Trigger_Control__mdt record named after the trigger, and every trigger checks it first. Flows don't read that metadata, so a disabled trigger still leaves all record-triggered flows running. The price record trigger also has a label, SkipPriceRecordTrigger_BatchJobs, to skip logic for named batch jobs, but again only in Apex. So for a bulk load I would plan for the flows separately: check their entry conditions, and if needed deactivate them for the window or add a bypass condition. The CPQ package triggers are separate again and are paused with SBQQ.TriggerControl.

- Trigger_Control__mdt affects Apex triggers only
- Flows keep running
- SkipPriceRecordTrigger_BatchJobs label is Apex only
- Plan flow bypass separately; CPQ via SBQQ.TriggerControl

```java
// AMT_TriggerMechanismHandler.cls
public class AMT_TriggerMechanismHandler {
    public static boolean disableTrigger(string triggerName){
        Trigger_Control__mdt tc = [select Is_Disabled__c from Trigger_Control__mdt where DeveloperName=:triggerName];
        
        return tc.Is_Disabled__c;
    }
}
```

<sub>Also asked as: Does Trigger_Control__mdt stop flows too? · How do you bypass flows during a data load? · trigger bypass and flow bypass in your project · How do you disable automation for a bulk update?</sub>

### How do you write test classes in your QTC project?
*Fresher (0–2 yrs) · concept* · `qtc-fl-028`

We have about 110 test classes. A typical one, like AMT_QuoteLineTriggerHandler_Test, has a @testSetup method that builds the chain: accounts with Customer and Customer Parent record types, an opportunity, an SBQQ__Quote__c, products and quote lines. It creates a System Administrator user with AMT_Business_Role__c set, because some flows check that role, and runs the test inside System.runAs. Each test method queries its data, does the DML between Test.startTest and Test.stopTest, and checks results. Record type Ids come from describe, not hardcoded Ids. Most classes build data inline, and a few newer ones use TestDataFactory. Only one test class uses SeeAllData.

- ~110 test classes, @testSetup for shared data
- System.runAs with a user that has AMT_Business_Role__c
- DML between Test.startTest and Test.stopTest
- Record types from describe
- Mostly inline data; TestDataFactory in newer tests

<sub>Also asked as: What does a typical test class look like in your project? · Explain your Apex testing approach · how do you structure unit tests in your org · How many test classes do you have?</sub>

### What does your TestDataFactory provide?
*Mid (3–6 yrs) · code* · `qtc-fl-029`

TestDataFactory is an @IsTest class with builders for the main objects: accounts by record type name, users, account team members, opportunities, contacts, price agreement groups, agreement customers, agreements, an SBQQ__Quote__c, a Product2, quote lines, price records, pricing issues, details and links. Most builders take a count and a doInsert flag, so I can build in memory, change fields and insert myself. There are also wrappers like createPriceRecordWithRelatedRecords that build the whole chain from accounts to a price record and return a TestDataWrapper. getRecordTypeId throws a clear TestDataFactoryException if the record type name is wrong. Right now only a handful of tests use it, like the SAP load and recalculation batch tests.

- Builders for accounts through price records and pricing issues
- count + doInsert parameters
- createPriceRecordWithRelatedRecords builds the full chain
- Clear exception on bad record type

```java
// TestDataFactory.cls
        for (Integer i = 0; i < countRecords; i++) {
            quoteLines.add(new SBQQ__QuoteLine__c(
                SBQQ__Quote__c = quoteRecord.Id,
                SBQQ__Product__c = productRecord.Id,
                AMT_Package_Group__c = 'Flip Chip BGA',
                AMT_Business_Unit__c = 'FC BGA',
                AMT_Wire__c = true,
                AMT_Service__c = 'Assembly',
                AMT_Assembly_Status__c = 'Draft',
                AMT_Package_detail_object_info__c = 'AMT_FCBGA_Detail__c',
                AMT_Opportunity__c = opp.Id
            ));
        }
```

<sub>Also asked as: Do you have a test data factory in your project? · How do you create test data for CPQ objects? · show me how you build quote lines for tests · test utility class in your org</sub>

### How do you test code that depends on Salesforce CPQ?
*Mid (3–6 yrs) · concept* · `qtc-fl-030`

In our tests we insert the CPQ records directly: an SBQQ__Quote__c with SBQQ__Opportunity2__c, SBQQ__Account__c, type Quote and status Draft, a Product2, and SBQQ__QuoteLine__c records with SBQQ__Quote__c and SBQQ__Product__c plus our AMT fields. Where a price book is needed we use Test.getStandardPricebookId. The test setup doesn't call SBQQ.TriggerControl, so the CPQ package triggers aren't paused for that DML, and our QuoteLineTrigger and quote line flows run on the test DML too. That makes them closer to integration tests. It also means a test can fail because of a flow or package rule, so when a test breaks I check the flows on that object too, not only the handler.

- Insert SBQQ__Quote__c, Product2 and SBQQ__QuoteLine__c directly
- Test.getStandardPricebookId for price book entries
- No SBQQ.TriggerControl in test setup; our trigger and flows run on test DML
- Failures can come from flows or CPQ, not only the handler

<sub>Also asked as: How do you handle SBQQ objects in test classes? · Do you disable CPQ triggers in your tests? · testing CPQ quote lines in Apex · How do you create SBQQ__Quote__c and SBQQ__QuoteLine__c in a test?</sub>

### How do you mock callouts in your tests?
*Mid (3–6 yrs) · code* · `qtc-fl-031`

For HTTP callouts we use HttpCalloutMock. About six test classes have a small inner class, usually MockHttpResponseGenerator, that returns a JSON body and status 200, for example AMT_LoadPricesToSAPInChunk_Batch_Test and AMT_NewdocumentGenerationcalloutsTest. In the test we call Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator()) before starting the batch or method, and Salesforce routes every callout to that class. Then we query the price records and assert the lifecycle stage. One catch: in that class several asserts run before Test.stopTest, but the batch only runs at Test.stopTest, so asserts belong after it. The current mocks only return success, so one thing I'd add is a mock for a failed response to test the error path.

- Inner class implementing HttpCalloutMock
- Test.setMock before the callout code runs
- Assert after Test.stopTest for batches (some existing asserts are before it)
- Add failure-response mocks for error paths

```java
// AMT_LoadPricesToSAPInChunk_Batch_Test.cls
    public class MockHttpResponseGenerator implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"status":"success"}');
            res.setStatusCode(200);
            return res;
        }
    }
```

<sub>Also asked as: How do you test the SAP callout code? · HttpCalloutMock example from your project · How do you test a batch that makes callouts? · mocking http responses in apex tests</sub>

### How do you test validation errors added with addError in a trigger?
*Mid (3–6 yrs) · code* · `qtc-fl-032`

I insert with Database.insert(records, false) and check each SaveResult, because an all-or-none insert only reports the first error. A good example is the division tests in AMT_QuoteLineTriggerHandler_Test. A helper, insertAllowingPartial, inserts the lines with allOrNone false, and firstError returns the message. One test checks a single mismatching line is blocked and that the message names both divisions in the right order using the same QTC_Constants message. Another inserts three lines across two opportunities and asserts the matching line saves, the sibling on the same opportunity saves quietly, and the line on the other opportunity fails. It also queries the saved lines to assert what was inherited. That is the behaviour-based testing our RULES.md asks for.

- Database.insert(list, false) + SaveResult per record
- Assert the exact message from QTC_Constants
- Mix of passing and failing records in one insert
- Query back to assert field values

```java
// AMT_QuoteLineTriggerHandler_Test.cls
    private static List<Database.SaveResult> insertAllowingPartial(List<SBQQ__QuoteLine__c> lines){
        return Database.insert(lines, false);
    }

    private static String firstError(Database.SaveResult result){
        return result.isSuccess() ? '' : result.getErrors()[0].getMessage();
    }
```

<sub>Also asked as: How do you test that a trigger blocks a save? · Testing partial success in Apex · Database.insert allOrNone false in test example · How did you test the division mismatch rule?</sub>

### What weaknesses do you see in the existing test classes?
*Senior (7–10 yrs) · troubleshooting* · `qtc-fl-033`

Honestly, quite a few older tests are coverage-driven. Roughly half the test files have no assert at all; for example AMT_TriggerMechanismHandlerTest just calls disableTrigger. Many tests wrap DML in try and catch with only System.debug, so a failure still passes. In AMT_LoadPricesToSAPInChunk_Batch_Test some asserts run before Test.stopTest, so they check the data before the batch has run. Bulk tests are rare; most loops create three to ten records, while our rules ask for at least 20. The newer tests are much better, like the division tests with SaveResult checks. When I touch a class, I add real asserts and a bulk case for the code I change, without rewriting untouched tests.

- Many tests have no asserts
- try/catch with System.debug hides failures
- Asserts before Test.stopTest miss async work
- Few bulk tests; rules ask for 20+ records
- Improve tests for code you touch

<sub>Also asked as: Are your tests good quality? · What would you improve in your test coverage approach? · tests that only give coverage without asserts · common problems in legacy apex tests</sub>

### How do you test flows in this project?
*Mid (3–6 yrs) · concept* · `qtc-fl-034`

Record-triggered flows run automatically whenever a test does DML, so Apex tests on quote lines and price records also exercise those flows. For example, the division match test asserts AMT_Customer_Device_Name__c, which both the before-save flow Populating_Data_from_PI_to_QL and the trigger set, so it covers them together. We don't have tests that start flows with Flow.Interview. Screen flows are tested through the real entry point, the button or the LWC, in the dev sandbox. Our RULES.md says nothing is done until it is validated: a check-only deploy for metadata, real test runs for Apex, and then three separate test passes for requirement, edge cases and regression, with real output, not opinions.

- Record-triggered flows run inside Apex test DML
- Assertions can cover flow + trigger together
- Screen flows tested via the real button or LWC
- Check-only deploy + three tester passes per RULES.md

<sub>Also asked as: Do you write tests for record-triggered flows? · How is flow logic covered in Apex tests? · testing screen flows · how do you validate a flow change before deploy</sub>

### How do you test platform events, batches and scheduled jobs here?
*Mid (3–6 yrs) · concept* · `qtc-fl-035`

The key is Test.stopTest. In AMT_Remove_Child_Event_TriggerTest we insert an agreement customer, build a Remove_Child_Event__e with PAC_Record_ID__c, call EventBus.publish inside the test block, and the event trigger and its batch run when Test.stopTest is called. For batches, like RecalculateQuoteLineStatusBatchTest, we call Database.executeBatch between startTest and stopTest and then query and assert the status, for example Closed No Bid or Closed Lost. For the scheduler, the same test class calls System.schedule and asserts the job Id is not null. Async work only finishes at stopTest, so all asserts have to come after it.

- Publish events inside startTest/stopTest
- Batch runs at Test.stopTest; assert after
- Scheduler tests assert the job Id
- All async asserts after stopTest

```java
// AMT_Remove_Child_Event_TriggerTest.cls
        List<Remove_Child_Event__e> pfEventList = new List<Remove_Child_Event__e>();
        Remove_Child_Event__e pfEvent = new Remove_Child_Event__e();                
		pfEvent.PAC_Record_ID__c = pac1.Id;
        pfEventList.add(pfEvent);
        Database.SaveResult[] results = EventBus.publish(pfEventList);

        
        Test.stopTest();
```

<sub>Also asked as: How do you test async Apex in your project? · Testing a platform event trigger · how do you test a batch class · Testing schedulers in your org</sub>

### What are the testing and deployment rules in your team?
*Fresher (0–2 yrs) · concept* · `qtc-fl-036`

Our RULES.md is binding for the repo. For testing it says: at least 75 percent coverage, but assert on behaviour, not lines; cover every branch with valid and invalid input; include a bulk case of 20 or more records; create data in the test, never rely on org data; and use Database.insert with allOrNone false to check addError cases. For delivery, metadata gets a check-only deploy against the dev sandbox, Apex gets real test runs, and then three independent test passes for requirement, edge cases and regression, which must all come back clean. There is also a written trap: a SeeAllData test that returns early when data is missing passes silently, so assert the data exists. We never write to UAT without explicit approval.

- 75%+ coverage with behaviour asserts
- All branches, valid/invalid, bulk 20+
- No org data; partial-success inserts for addError
- Check-only deploy + real test runs + three tester passes
- SeeAllData early-return trap

<sub>Also asked as: What is your definition of done for a change? · How do you make sure a change is tested before it goes to UAT? · testing standards in your project · What does RULES.md say about tests?</sub>

## QTC project — Agentforce ideas

### How would you use Agentforce in your QTC project?
*Fresher (0–2 yrs) · concept* · `qtc-agf-001`

We haven't rolled out Agentforce in QTC yet, but I have a clear idea of where it fits. The best first use is an employee agent for the pricing team. Pricing users work across SBQQ__QuoteLine__c, AMT_Price_Record__c and AMT_Price_Agreement__c, and a lot of their time goes into questions like: what stage is this price record in, why is it Not Ready for Activation, does it have duplicates on the agreement, why did the SAP load fail. The answers are already in our data, like AMT_Lifecycle_Stage__c, AMT_Variant_Status__c and AMT_SAP_Error_Message__c, and some checks already exist as invocable Apex, like the PDL validation and the duplicate check. So I'd start with read-only lookups and explanations, then add a few carefully wrapped actions with confirmation, and keep approvals with people.

- Not built yet: this is a proposal
- Employee agent for pricing users first
- Ground answers in price records, agreements and quote lines
- Reuse existing invocable Apex as actions; approvals stay human

<sub>Also asked as: Is there any AI or Agentforce use case in your current project? · Where does Agentforce fit in a CPQ quote to cash implementation? · how can agent force help in your quote to cash project · If you added an AI agent to your CPQ project, what would it do?</sub>

### Have you worked on Agentforce?
*Fresher (0–2 yrs) · concept* · `qtc-agf-002`

I'll be honest: we haven't implemented Agentforce in my current QTC project, so I don't have a production agent to talk about. What I do have is the Salesforce AI Specialist certification, so I know how agents are built: subagents, which used to be called topics, actions from Flow, invocable Apex and prompt templates, the Einstein Trust Layer, and testing in the Testing Center. And I've thought through how I'd apply it to our project. For example, we already have invocable methods like AMT_PriceRecordPDLValidation.validatePR and amt_fieldSetHandler.validateDuplicatesScopedToPriceRecord, which are natural candidates for agent actions, and I know which parts of our code I'd fix or wrap before letting an agent call them. So I can explain a design in detail, but I won't claim a rollout I haven't done.

- Honest: no Agentforce rollout in QTC yet
- Salesforce AI Specialist certified
- Can describe a concrete design grounded in the real code
- Knows the risks to fix before exposing actions

<sub>Also asked as: Do you have hands-on Agentforce experience? · Have you implemented Agentforce in a real project? · have you used agent force or einstein in production · What is your experience with Salesforce AI?</sub>

### How would you design an employee agent for the pricing analysts in your project?
*Mid (3–6 yrs) · design* · `qtc-agf-003`

If I built it, I'd make it an employee agent, so it runs as the logged-in pricing user and respects our existing sharing, which is built on the Account_<Id>_Internal public groups. I'd split it into a few small subagents. One for price lookup: find price records by number, or by quote line or agreement, and explain their variant status and lifecycle stage. One for agreement checks: run the duplicate check through amt_fieldSetHandler.validateDuplicatesScopedToPriceRecord and explain the result. One for SAP load questions: read AMT_Error_Log__c and AMT_Interface_Log__c for an agreement. And maybe one for drafting, using prompt templates to summarize a pricing issue or draft an agreement email. Write actions like marking a record ready for activation or recalling an agreement would come later, behind a confirmation step. The agent would never approve prices.

- Employee agent: runs as the user, existing sharing applies
- Subagents: price lookup, agreement checks, SAP load triage, drafting
- Read-only first; write actions later with confirmation
- No approvals by the agent

<sub>Also asked as: Design an Agentforce agent for your pricing team. · What subagents and actions would a pricing assistant agent have? · how would you structure an agent for price records and price agreements · Walk me through an internal agent for quote to cash users.</sub>

### Which existing invocable methods in your project would you expose as agent actions?
*Mid (3–6 yrs) · design* · `qtc-agf-004`

We have about fifteen invocable methods, and I'd sort them by risk. The safest is amt_fieldSetHandler.validateDuplicatesScopedToPriceRecord, because it only queries and returns hasDuplicates and a message. Next is AMT_PriceRecordPDLValidation.validatePR, which the AMT_MarkReadyForActivation flow calls; it does update the price record's stage and SAP error message, so it needs confirmation. Then higher risk: AMT_LoadPricesToSAPInChunk_Helper.recallPriceRecord, which starts AMT_RecallPriceRecord_Batch, and AMT_PriceAgreementController.getPApriceRelatedRecords, the submit check, which also runs duringSubmission. And some I would never expose: AMT_AssignQuoteLineHelper.controlQLTrigger, because it switches CPQ triggers on and off, AMT_LoadPRToSAP and AMT_LoadPRToSAPOnApproval, which send prices to SAP, and the revision ones like amt_initiateRevisionController.

- Read-only: validateDuplicatesScopedToPriceRecord
- Writes with confirmation: validatePR
- High risk: recallPriceRecord, getPApriceRelatedRecords
- Never: controlQLTrigger, SAP load methods, revisions

<sub>Also asked as: Which of your @InvocableMethod classes could become Agentforce actions? · What Apex in your project is ready to be used by an agent? · which invocable apex would you reuse for agentforce · How would you reuse existing Flow actions for an agent?</sub>

### What labels and descriptions would you give your QTC actions so the agent picks them correctly?
*Mid (3–6 yrs) · concept* · `qtc-agf-005`

The agent only knows an action by its name and descriptions, so our current labels are not good enough. For example, the PDL validation method is labelled AMT_PriceRecordPDLValidation and the submit check is labelled AMT_PriceAgreementController, which means nothing to a model. I'd create agent-facing wrappers or action names in business language. Something like 'Check Price Record Duplicates: read-only, checks whether a price record has duplicates on a price agreement and returns the duplicate record names.' Or 'Mark Price Record Ready for Activation: validates the SAP fields on one approved price record; if fields are missing it sets Not Ready for Activation and returns the missing fields. Only run after the user confirms.' Inputs too: 'Price record number, like the Name shown on the record.' I'd keep descriptions from overlapping so the agent doesn't confuse lookup with validation.

- Current labels are class names, not business language
- Say what it does, when to use it, and what it returns
- Mark read-only vs write clearly
- Describe input format; avoid overlapping actions

<sub>Also asked as: How do you write action descriptions for Agentforce? · Your invocable labels are technical names. Is that a problem for an agent? · how should i name agent actions so the reasoning engine understands · What instructions would you write for a pricing agent's actions?</sub>

### A pricing analyst asks the agent why a quote line is not Price Complete. How would the agent answer it?
*Mid (3–6 yrs) · scenario* · `qtc-agf-006`

In the design I have in mind, the agent would answer from data, not guess. It would call a read-only action that takes the quote line and returns its AMT_Assembly_Status__c or AMT_Test_Status__c plus each related AMT_Price_Record__c with AMT_Variant_Status__c, AMT_Lifecycle_Stage__c and AMT_SAP_Error_Message__c. Then it explains in plain words, for example, two price records are approved but one is still waiting. I'd base the instructions on what our code really does: the quote line status is rolled up from its price records, and there are known cases like grouped records or insertion-only test lines that depend on the linked configuration's quote line. If the data doesn't explain it, the agent should say it can't tell and suggest who to ask, rather than invent a reason.

- Read-only action returns quote line and price record statuses
- Explain using variant status, lifecycle stage, SAP error message
- Instructions reflect real rollup rules from the code
- Say 'I can't tell' instead of guessing

<sub>Also asked as: How would an agent explain a quote line's price status? · User asks the agent why the price is still pending on a quote line, what happens? · agent explain why quote line status not updated · How would you ground the agent's answer about a quote line price?</sub>

### How would you ground the agent's answers in your QTC data?
*Fresher (0–2 yrs) · concept* · `qtc-agf-007`

For QTC, most answers live in our own custom objects, so I'd ground with actions that query them, not with documents. The core objects are AMT_Price_Record__c, AMT_Price_Agreement__c, AMT_Price_Agreement_Group__c, SBQQ__QuoteLine__c and AMT_Pricing_Issue__c, plus the logs AMT_Error_Log__c and AMT_Interface_Log__c for SAP questions. Each action would return only the few fields the answer needs, like lifecycle stage, variant status, agreement status and the SAP error message. For prompt templates I'd use merge fields from the record. I don't see a need for Data 360 or a knowledge library in the first phase, because there are no pricing documents in the repo to index. Since it's an employee agent and queries run in user mode, users only see records they already have access to.

- Ground with record queries, not documents
- Objects: price record, agreement, group, quote line, pricing issue, logs
- Return only the fields needed
- User mode queries keep existing access

<sub>Also asked as: What data would your agent use to answer pricing questions? · How does an agent get price record data in your project? · grounding agentforce with salesforce records in cpq project · Would you use Data 360 or just Salesforce records for the agent?</sub>

### What guardrails would you put on an agent that works with prices and approvals?
*Senior (7–10 yrs) · design* · `qtc-agf-008`

My first rule is that approvals stay human. Price record approval runs through amt_ApprovePriceRecords and approvePriceRecords, with the Approve button enabled only for the right business role and status by enableApprove, and agreement approval goes through the submit flow and approvers. The agent would never approve, and it would not change AMT_Price_to_Customer__c or any price field. Second, only a small allow-list of actions, starting read-only. Third, any write, like PDL validation or a recall, needs the agent to show what will happen and get an explicit yes; I'd put that as a fixed step in Agent Script rather than relying on prose instructions. Fourth, actions don't trust the model: the Apex checks the record's stage and the user's access itself. Fifth, no action that sends to SAP or disables triggers. And finally the Trust Layer for zero data retention and audit, plus testing and session review after launch.

- Agent never approves and never edits price fields
- Small allow-list; read-only first
- Writes need confirmation as a deterministic step
- Validation in Apex; no SAP sends, no trigger switches

<sub>Also asked as: How would you stop the agent from changing prices on its own? · What should the agent never be allowed to do in your QTC project? · guardrails for agentforce in a pricing process · How do you keep humans in control of approvals with an agent?</sub>

### How would you handle permissions for an agent in your project?
*Mid (3–6 yrs) · concept* · `qtc-agf-009`

For the pricing assistant I'd use an employee agent, which runs as the logged-in user, so our existing sharing model applies, including the Account_<Id>_Internal groups. Users still need a permission set that grants the new wrapper Apex classes. If we later built an autonomous agent with its own agent user, I'd give it a least-privilege permission set: read on the pricing objects and logs, and access only to the action classes. One thing I'd watch in our code is that some existing paths bypass sharing. The AMT_RecallPriceAgreement flow runs in SystemModeWithoutSharing, AMT_RecallPriceRecord_Batch is without sharing, and ExceptionHandler is without sharing. So the wrapper itself must be with sharing and check the record with a user mode query before calling the old code.

- Employee agent runs as the user
- Permission set for the wrapper classes
- Agent user, if any: least privilege
- Existing system-mode paths mean the wrapper checks access first

<sub>Also asked as: What access would the agent user get? · Employee agent or agent user, how do permissions work in your design? · permission set for agentforce agent user · How do you make sure the agent respects sharing on price records?</sub>

### How does the Einstein Trust Layer help if you use Agentforce on pricing data?
*Fresher (0–2 yrs) · concept* · `qtc-agf-010`

Customer prices and agreement terms are sensitive, so the Trust Layer matters. Every agent and prompt template request goes through it. It grounds the prompt only with data the user is allowed to see, adds prompt defense, and can mask sensitive values in prompt templates; Salesforce turned masking off for agents and relies on zero data retention and access controls there. Salesforce's model providers work under zero data retention, so prompts aren't stored or used for training, and there's an audit trail. In QTC I'd still limit what goes into the prompt: actions return only the fields the answer needs, like stage, status and error message, not full price lists. For prompt templates I'd agree with the security team which fields to mask, while keeping things like price record numbers readable so answers stay useful. The Trust Layer doesn't replace permissions, though. Access control in the actions is still the real protection.

- Secure grounding, prompt defense, audit; masking for prompt templates, not agents
- Zero data retention with model providers
- Send only the fields needed
- Permissions in actions remain the real control

<sub>Also asked as: Is it safe to send customer prices to an LLM? · What is the Trust Layer and why does it matter for your project? · einstein trust layer data masking for pricing · How would you protect sensitive pricing data with Agentforce?</sub>

### How would you build an agent to help triage SAP load errors in your project?
*Mid (3–6 yrs) · design* · `qtc-agf-011`

We already log everything I'd need. AMT_LoadPricesToSAPInChunk_Batch writes AMT_Interface_Log__c with the message ID, status code, status message and payloads, and writes AMT_Error_Log__c with AMT_objectId__c set to the agreement or price record Id for our own validation failures, like field length. It also stamps AMT_MessageID__c, AMT_Chunk_Status__c and AMT_SAP_Error_Message__c on the price agreement. So I'd give a support subagent a read-only action: for one price agreement, return its status, chunk status, SAP error message, recent error logs for it, and the interface log matching its message ID. A prompt template could turn that into a short explanation: what failed, which records, and the usual fix, like correcting the field and loading again. The agent would not resend; our PAError automation already handles retries.

- Logs already exist: AMT_Interface_Log__c, AMT_Error_Log__c
- Agreement carries AMT_MessageID__c, chunk status, SAP error
- Read-only triage action plus summary prompt
- No resend; PAError automation handles retries

<sub>Also asked as: Can Agentforce help with integration errors? · Design an agent that explains why a price agreement failed to load to SAP. · agent for error log triage salesforce sap · How would you use your error log and interface log objects with an agent?</sub>

### A price agreement shows Error after the SAP load. How would your agent help the user?
*Senior (7–10 yrs) · scenario* · `qtc-agf-012`

In my design, the agent would first call the read-only triage action for that agreement and read the facts. If AMT_Error_Log__c has entries from AMT_LoadPricesToSAPInChunk_Batch, the error came from our own checks before the callout, like a field over the max length, and the agent names the record and the field. If the interface log for the agreement's AMT_MessageID__c shows a failed status code or 'No response from SAP', it's a connection problem. If price records are in Load Error with SAP's message, SAP rejected them. Then it tells the user the next step: fix the field and load again, or wait for the hourly PAError job. It would refuse to resend or roll back itself; those stay with the user and support team. If the logs don't explain it, it says so and suggests raising it with support.

- Read logs first, then classify where it failed
- Salesforce-side validation vs callout failure vs SAP rejection
- Gives the next step; doesn't resend or roll back
- Admits when logs don't explain it

<sub>Also asked as: User asks the agent why their price agreement failed in SAP. · Price agreement stuck in Request Failed, how would the agent respond? · agent scenario sap load error price agreement · What would the triage agent say and what would it refuse to do?</sub>

### Which prompt templates would you build for your QTC project?
*Fresher (0–2 yrs) · concept* · `qtc-agf-013`

I'd start with prompt templates even before a full agent, because they're lower risk. One is a pricing issue summary on AMT_Pricing_Issue__c. The record comes from SAP through QTC_PricingIssueRestClass and has many coded fields, like AMT_piNumber__c, AMT_division__c, AMT_plant__c, AMT_pdlNumber__c, AMT_rootCause__c and AMT_Root_Cause_Description__c. A Record Summary or Flex template could turn those into a few readable lines. Another is a price agreement email draft for sales, grounded on the agreement's status, revision number, effective date, currency and customers. A third is the SAP load error explanation for support. All of them only generate text; the user reviews and sends it. If I write grounding Apex, it uses user mode queries.

- Pricing issue summary from SAP-coded fields
- Price agreement email draft for sales
- SAP load error explanation
- Text only; user reviews and sends

<sub>Also asked as: Where would Prompt Builder help in your project? · Give examples of prompt templates for a CPQ pricing process. · prompt builder use cases quote to cash · Would you use prompt templates without a full agent?</sub>

### How would you build a prompt template that drafts a price agreement email?
*Mid (3–6 yrs) · design* · `qtc-agf-014`

I'd use a Flex template with the price agreement as input, so it can be used from a button, a flow or as an agent action. A Sales Email template is meant for a contact or lead, so Flex is the more natural fit here. I'd ground it with merge fields we really have on AMT_Price_Agreement__c: Name, AMT_Price_Agreement_Number__c, Status__c, AMT_Revision_Number__c, AMT_Effective_Date__c, AMT_Currency__c and Customers__c. If it needs a list of price changes, I'd add a small grounding Apex class that returns only a short, formatted summary in user mode, because an agreement can have many price records. Instructions: professional tone, no prices not in the data, no promises on dates. The output is always a draft the sales user edits and sends. I'd preview it on a few real agreements in a sandbox.

- Flex template, input = price agreement
- Merge fields from AMT_Price_Agreement__c
- Grounding Apex for a short price summary
- Draft only; preview on real records in a sandbox

<sub>Also asked as: Draft a price agreement email with Prompt Builder. · Which template type would you use for a customer price email? · prompt template sales email price agreement · How do you ground an email draft with price agreement data?</sub>

### What risks do you see in your existing invocable methods before exposing them as agent actions?
*Senior (7–10 yrs) · troubleshooting* · `qtc-agf-015`

Several, all visible in the code. First, most only process the first input. validatePR queries with LIMIT 1, recallPriceRecord uses priceAgreementIdList[0], AMT_LoadPRToSAP reads inputList[0], and AMT_CheckMandatoryFieldsOnPkgAttribute takes quoteLineRecList[0]. That was fine for a screen flow with one record, but an action should handle every request. Second, side effects hide behind check-like names: getPApriceRelatedRecords runs duringSubmission and the metal checks when there are no duplicates. Third, AMT_PriceRecordPDLValidation keeps errorMessage in a static variable and doesn't declare a sharing keyword. Fourth, the recall path runs without sharing. Fifth, labels like 'AMT_PriceAgreementController' mean nothing to a model. So I'd write new with sharing wrappers that loop per request, check access and stage, and return a clear message.

- Many methods only read the first input
- Side effects inside 'check' methods
- Static state, missing sharing keyword, system-mode recall
- Fix with thin with sharing wrappers

<sub>Also asked as: Is your current invocable Apex safe for an agent to call? · What would you fix in your code before using it with Agentforce? · risks of reusing flow invocable methods in agentforce · Are your invocable methods bulk safe?</sub>

### How do the trigger bypass flags in your code affect what you'd let an agent do?
*Senior (7–10 yrs) · concept* · `qtc-agf-016`

It's one of the main reasons I'd keep the action list tight. AMT_AssignQuoteLineHelper.controlQLTrigger is an invocable that calls SBQQ.TriggerControl.disable or enable based on a text input. Screen flows use it in a disable, update, enable pattern, and the fault path can skip the enable. If an agent could call it, it could leave CPQ triggers off for the rest of a transaction. So it would never be an action. We also have Trigger_Control__mdt per trigger, AMT_Run_Trigger_Setting__mdt per area, the SkipPriceRecordTrigger_BatchJobs label for batches, and static flags like AMT_PriceAgreementController.isPASubmit. An agent action must run through the normal trigger path so snapshots, rollups and validations happen, and must never change those settings.

- controlQLTrigger is never exposed
- Bypass layers: Trigger_Control__mdt, AMT_Run_Trigger_Setting__mdt, batch skip label
- Static flags can change behaviour inside one transaction
- Agent writes go through normal triggers

<sub>Also asked as: Would you expose your Disable CPQ Trigger action to an agent? · Your project has trigger kill switches. Is that a risk with Agentforce? · agent calling sbqq trigger control disable · What happens if an agent action runs while triggers are switched off?</sub>

### Can you use your existing screen flows directly as agent actions?
*Fresher (0–2 yrs) · concept* · `qtc-agf-017`

Not directly. An agent action needs an autolaunched flow without screens, or invocable Apex. Most of our flows that call Apex are screen flows: AMT_Submit_Quote_Line, AMT_MarkReadyForActivation, AMT_RecallPriceAgreement, AMT_Price_Agreement_Submit_for_Approval and AMT_Price_Record_Duplicate_Check_wrt_PA all have screens. So I'd call the invocable Apex behind them through a wrapper, or build a small autolaunched flow that repeats only the non-screen steps. For example, AMT_RecallPriceAgreement updates the agreement to Draft with chunk status Pending before it calls recallPriceRecord, so an agent version must do the same steps in the same order. AMT_Load_to_SAP_on_Approval is autolaunched, but it's part of the approval process and sends to SAP, so I wouldn't expose it.

- Actions need autolaunched flows or invocable Apex
- Most QTC flows that call Apex are screen flows
- Wrap the Apex or build an autolaunched copy of the steps
- Keep the same steps and order as the screen flow

<sub>Also asked as: Can an agent run a screen flow? · Your submit and recall logic is in screen flows. How would an agent use it? · screen flow vs autolaunched flow for agentforce actions · Which flows in your project could become agent actions?</sub>

### How would you test an agent for your QTC project?
*Fresher (0–2 yrs) · concept* · `qtc-agf-018`

I'd test at two levels. First, Apex unit tests for every wrapper action, like any other class: test data, call the invocable with a list of requests, assert the outputs, including not-found, wrong stage and more than one request. I'd run them with System.runAs as a pricing user so access problems show up early. Second, agent tests in the Testing Center, or the Tests tab in Agentforce Studio for the new builder. Each case is an utterance plus the expected subagent, action and outcome, like 'does PR-123 have duplicates on its agreement' should call the duplicate check. I'd include tricky ones, like 'approve this price', which the agent must refuse. I'd run them in a sandbox, because tests can run real actions and change data, and rerun them after every change.

- Apex tests for each wrapper, incl. runAs
- Testing Center: utterance, expected subagent, action, outcome
- Include refusal cases like approval requests
- Sandbox only; rerun as regression

<sub>Also asked as: How do you test Agentforce actions and conversations? · What is your testing approach for an AI agent in a pricing process? · testing center agentforce test cases · How would you make sure the agent picks the right action?</sub>

### What rollout plan would you follow for Agentforce in your project?
*Senior (7–10 yrs) · design* · `qtc-agf-019`

I'd go in small phases. Phase one: prompt templates only, like the pricing issue summary, because they just generate text. Phase two: an employee agent with read-only actions, price status lookup, duplicate check and SAP load triage, piloted with a few pricing users in a sandbox, then production. Phase three: one or two write actions, like Mark Ready for Activation, behind confirmation, after the wrapper fixes. Recall and submit only if users really need them. In every phase I'd follow our team's process: design first, independent reviews, check-only deploys and real test runs before anything goes in. After launch I'd turn on session tracing, review sessions, and fix descriptions or instructions. I'd also check licensing and credits with the account team first, since every action has a cost.

- Templates, then read-only agent, then guarded writes
- Pilot with a few pricing users
- Team process: reviews, check-only deploy, real tests
- Monitor sessions; confirm licensing and cost

<sub>Also asked as: How would you introduce Agentforce in an existing CPQ org step by step? · Phased plan for an AI agent in quote to cash. · agentforce rollout plan for pricing team · How would you go live with an agent safely?</sub>

### Show how you would wrap your existing duplicate check as an agent action.
*Mid (3–6 yrs) · code* · `qtc-agf-020`

This would be a new class; nothing like it is in the repo yet. It calls the real amt_fieldSetHandler.validateDuplicatesScopedToPriceRecord, which is read-only and takes a DuplicateCheckByPRRequest with priceAgreementId and priceRecordName. The existing method only looks at the first request, so the wrapper loops and calls it once per request, which is fine because an agent sends one at a time. It has its own Request class with agent-friendly input descriptions and returns the message from the existing FlowOutputWrapper, which already lists the duplicate pairs. The important part is the label and descriptions, written for the agent, and with sharing on the wrapper. I'd add an Apex test and grant the class in the pricing permission set.

- New wrapper; real method reused unchanged
- Loops per request because the original reads only [0]
- Business-language label and description
- with sharing; add test and permission set access

```java
// NEW wrapper (not in the repo) around amt_fieldSetHandler.validateDuplicatesScopedToPriceRecord
public with sharing class AMT_Agent_CheckPRDuplicates {
    public class Request {
        @InvocableVariable(label='Price Agreement Id' description='Id of the price agreement to check' required=true)
        public Id priceAgreementId;
        @InvocableVariable(label='Price Record Number' description='Name of the price record, as shown on the record' required=true)
        public String priceRecordName;
    }
    @InvocableMethod(label='Check Price Record Duplicates'
        description='Read-only. Checks if a price record has duplicates on a price agreement and returns the duplicate price record names.')
    public static List<String> run(List<Request> requests) {
        List<String> results = new List<String>();
        for (Request r : requests) {
            amt_fieldSetHandler.DuplicateCheckByPRRequest req = new amt_fieldSetHandler.DuplicateCheckByPRRequest();
            req.priceAgreementId = r.priceAgreementId;
            req.priceRecordName = r.priceRecordName;
            results.add(amt_fieldSetHandler.validateDuplicatesScopedToPriceRecord(
                new List<amt_fieldSetHandler.DuplicateCheckByPRRequest>{ req })[0].message);
        }
        return results;
    }
}
```

<sub>Also asked as: Write an Apex agent action that reuses validateDuplicatesScopedToPriceRecord. · How would you turn a flow invocable into an Agentforce action? · agent action wrapper for price record duplicate check · Code an invocable wrapper around existing Apex for an agent.</sub>

### Write a read-only agent action that explains a price record's status.
*Mid (3–6 yrs) · code* · `qtc-agf-021`

This is a new action I'd add. It takes the price record number the user types, runs one user mode query for all requests, and returns a short summary built from fields we really use: AMT_Variant_Status__c for approval, AMT_Lifecycle_Stage__c for the SAP side, AMT_SAP_Error_Message__c for missing fields or SAP errors, and the agreement name and status. If the record isn't found or the user can't see it, it returns a clear message instead of throwing, so the agent can explain that. It makes no changes. The agent's instructions would then explain the stage in plain words, for example Not Ready for Activation means the PDL validation found missing SAP fields.

- One user mode query for all requests
- Returns variant status, lifecycle stage, SAP error, agreement
- Friendly not-found message
- No DML

```java
// NEW read-only action (not in the repo)
public with sharing class AMT_Agent_GetPriceRecordStatus {
    @InvocableMethod(label='Get Price Record Status' description='Read-only. Takes price record numbers and returns approval status, SAP lifecycle stage, SAP error message and agreement.')
    public static List<String> run(List<String> priceRecordNames) {
        Map<String, AMT_Price_Record__c> byName = new Map<String, AMT_Price_Record__c>();
        for (AMT_Price_Record__c pr : [SELECT Name, AMT_Variant_Status__c, AMT_Lifecycle_Stage__c, AMT_SAP_Error_Message__c,
                AMT_Price_Agreement__r.Name, AMT_Price_Agreement__r.Status__c FROM AMT_Price_Record__c
                WHERE Name IN :priceRecordNames WITH USER_MODE]) { byName.put(pr.Name, pr); }
        List<String> out = new List<String>();
        for (String n : priceRecordNames) {
            AMT_Price_Record__c pr = byName.get(n);
            out.add(pr == null ? 'No price record ' + n + ' found, or you do not have access to it.'
                : n + ': variant status ' + pr.AMT_Variant_Status__c + ', lifecycle stage ' + pr.AMT_Lifecycle_Stage__c
                  + ', agreement ' + pr.AMT_Price_Agreement__r?.Name + ' (' + pr.AMT_Price_Agreement__r?.Status__c + ')'
                  + ', SAP error: ' + pr.AMT_SAP_Error_Message__c);
        }
        return out;
    }
}
```

<sub>Also asked as: Code an Agentforce action that looks up a price record by number. · How would the agent read lifecycle stage and SAP error from a price record? · apex agent action price record status user mode · Show a bulk safe invocable for an agent lookup.</sub>

### How would you expose your PDL validation as a safe agent action?
*Senior (7–10 yrs) · code* · `qtc-agf-022`

The real method is AMT_PriceRecordPDLValidation.validatePR, used by the AMT_MarkReadyForActivation screen flow. It takes a list of price record Ids but only queries the first, runs reqFieldsValidation, then updates the record to Ready or Not Ready for Activation and writes AMT_SAP_Error_Message__c. So it changes data. My new wrapper would be with sharing, take one Id per request, and first check in user mode that the user can see the record and that its variant status is Approved. The trigger path also validates Closed Won and Closed Cancel records, but I'd start with the narrowest case. Then it calls validatePR and returns its message. The confirmation itself sits in the agent: a fixed step that shows the record and asks yes before running. Because validatePR does SOQL and DML per call, I'd keep it to one record per conversation turn.

- Real method writes stage and SAP error message
- Wrapper: with sharing, user mode pre-check
- Confirmation as a fixed agent step
- One record per call; SOQL + DML per call

```java
// NEW wrapper (not in the repo) around AMT_PriceRecordPDLValidation.validatePR
public with sharing class AMT_Agent_MarkReadyForActivation {
    @InvocableMethod(label='Mark Price Record Ready for Activation'
        description='Changes data. Validates SAP fields on one approved price record and sets Ready or Not Ready for Activation. Run only after the user confirms.')
    public static List<String> run(List<Id> priceRecordIds) {
        List<String> out = new List<String>();
        for (Id prId : priceRecordIds) {
            List<AMT_Price_Record__c> pr = [SELECT Id, AMT_Variant_Status__c FROM AMT_Price_Record__c WHERE Id = :prId WITH USER_MODE];
            if (pr.isEmpty() || pr[0].AMT_Variant_Status__c != QTC_Constants.APPROVED) { out.add('Record not found or not Approved.'); continue; }
            out.add(AMT_PriceRecordPDLValidation.validatePR(new List<Id>{ prId })[0].message);
        }
        return out;
    }
}
```

<sub>Also asked as: Wrap AMT_PriceRecordPDLValidation.validatePR for Agentforce. · Write an agent action that marks a price record ready for activation. · agent action that updates records safely with confirmation · How do you reuse a write invocable method in an agent?</sub>

### Write the read-only action your SAP triage agent would use.
*Mid (3–6 yrs) · code* · `qtc-agf-023`

This is a new action. It reads the agreement fields the SAP batch stamps, Status__c, AMT_Chunk_Status__c, AMT_SAP_Error_Message__c and AMT_MessageID__c, then the latest AMT_Error_Log__c rows whose AMT_objectId__c is the agreement Id, which is how AMT_LoadPricesToSAPInChunk_Batch logs agreement-level validation failures, and the AMT_Interface_Log__c with the same message ID, for the status code and status message. To keep the example short it handles one agreement, which is how the agent would call it. Price-record-level errors are logged with the price record Id, so a full version would include those too. It returns text that a prompt template or the agent can explain.

- Reads agreement status, chunk status, SAP error, message ID
- Error logs by AMT_objectId__c
- Interface log by AMT_messageId__c
- Read-only; one agreement per call

```java
// NEW read-only triage action (not in the repo)
public with sharing class AMT_Agent_SAPLoadTriage {
    @InvocableMethod(label='Get SAP Load Errors for Price Agreement' description='Read-only. Returns SAP load status, error logs and interface log result for one price agreement.')
    public static List<String> run(List<Id> priceAgreementIds) {
        List<AMT_Price_Agreement__c> pas = [SELECT Id, Name, Status__c, AMT_Chunk_Status__c, AMT_SAP_Error_Message__c, AMT_MessageID__c
                                            FROM AMT_Price_Agreement__c WHERE Id = :priceAgreementIds[0] WITH USER_MODE];
        if (pas.isEmpty()) return new List<String>{ 'Price agreement not found, or you do not have access to it.' };
        AMT_Price_Agreement__c pa = pas[0];
        String txt = pa.Name + ' status ' + pa.Status__c + ', chunk ' + pa.AMT_Chunk_Status__c + ', SAP error: ' + pa.AMT_SAP_Error_Message__c;
        for (AMT_Error_Log__c e : [SELECT AMT_errorDescription__c FROM AMT_Error_Log__c WHERE AMT_objectId__c = :pa.Id
                                   WITH USER_MODE ORDER BY CreatedDate DESC LIMIT 5]) { txt += '\nError log: ' + e.AMT_errorDescription__c; }
        if (pa.AMT_MessageID__c != null) {
            for (AMT_Interface_Log__c i : [SELECT AMT_statusCode__c, AMT_statusMessage__c FROM AMT_Interface_Log__c
                    WHERE AMT_messageId__c = :pa.AMT_MessageID__c WITH USER_MODE ORDER BY CreatedDate DESC LIMIT 1]) {
                txt += '\nSAP call: ' + i.AMT_statusCode__c + ' ' + i.AMT_statusMessage__c;
            }
        }
        return new List<String>{ txt };
    }
}
```

<sub>Also asked as: Code an agent action that reads AMT_Error_Log__c and AMT_Interface_Log__c. · How would the agent fetch integration errors for a price agreement? · apex action error log interface log by message id · Show the Apex behind an integration triage agent.</sub>

### In your project, when would you use an agent instead of your existing flows and LWCs?
*Fresher (0–2 yrs) · comparison* · `qtc-agf-024`

I wouldn't replace what already works. Fixed processes like submitting a quote line, approving price records or loading to SAP stay as they are, in the AMT_Submit_Quote_Line flow, the amt_ApprovePriceRecords component and the SAP batch, because they need exact, repeatable rules. A prompt template fits one-step text jobs, like summarizing a pricing issue from a button. An agent makes sense where users ask open questions across many records, like why is this quote line still not Price Complete, or why did this agreement fail in SAP, where today they open several records and logs to find out. So the agent sits on top of our existing processes to explain and guide, and only calls a few of them as actions.

- Fixed processes stay in Flow, LWC and Apex
- Prompt template for one-step text
- Agent for open questions across records
- Agent explains and guides; few actions

<sub>Also asked as: Agent vs Flow vs prompt template in your QTC project. · Why not just add another screen flow instead of an agent? · when to use agentforce versus flow in cpq · Would Agentforce replace your submit and approval screens?</sub>

### A manager asks if the agent can submit or recall a price agreement for users. What would you say?
*Senior (7–10 yrs) · scenario* · `qtc-agf-025`

I'd say it's possible, but not as a first step, and only with guardrails. Submit starts with AMT_PriceAgreementController.getPApriceRelatedRecords, which is not just a check: when there are no duplicates it runs duringSubmission, which works out the revision and refreshes the customers, plus the metal base checks. The screen flow then sets Status__c to Submitted for Approval. Recall goes through AMT_RecallPriceAgreement, which sets the agreement to Draft and runs AMT_RecallPriceRecord_Batch without sharing. So an agent version would need a with sharing wrapper that repeats the flow steps in order, checks the user's access and the agreement status, shows a summary and gets an explicit yes. Even then, the agent only starts the process; the approval itself stays with the human approvers.

- Submit check has side effects (duringSubmission)
- Recall sets Draft and runs a without-sharing batch
- Wrapper must repeat flow steps, check access, confirm
- Agent can start, never approve

<sub>Also asked as: Should the agent be allowed to submit a price agreement for approval? · Can the agent recall a price agreement from SAP? · agent submit for approval or recall action risk · Would you let Agentforce start approvals in your project?</sub>
