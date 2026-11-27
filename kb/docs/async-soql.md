# Asynchronous Apex, Batch and SOQL

85 questions. Levels: Fresher (0–2 yrs) 30 · Mid (3–6 yrs) 34 · Senior (7–10 yrs) 21

## Asynchronous Apex

### What is asynchronous Apex and why do we use it?
*Fresher (0–2 yrs) · concept* · `async-001`

Async Apex is how I keep slow work out of the user's save. It's code that runs later, in its own separate transaction, when the platform has resources free, so the user doesn't sit there waiting. I reach for it for three reasons. One, long-running work like processing big data volumes. Two, callouts, because they can't run in the same context as DML or straight from a trigger. Three, higher governor limits: async gets 200 SOQL queries, 12 MB heap and 60 seconds of CPU. Say a user saves an Opportunity and we need to send it to an ERP system. Instead of making them wait on that call, I hand it to an async job and the save finishes right away. There are four types: future methods, Queueable Apex, Batch Apex and Scheduled Apex. Platform Events are also often used to decouple work asynchronously. When I explain it to a business user, I put it simply: the save is instant, and the heavy lifting finishes a few seconds later.

- Runs in its own transaction, user does not wait
- Higher limits: 200 SOQL, 12 MB heap, 60 s CPU
- Types: future, Queueable, Batch, Schedulable
- Common uses: callouts, large data, mixed DML fixes

<sub>Also asked as: What do you mean by async Apex? · Why would you run Apex in the background? · What are the different types of asynchronous Apex? · explain a sink apex in salesforce</sub>

### What is a future method and what are its rules?
*Fresher (0–2 yrs) · code* · `async-002`

Future methods are fine for small fire-and-forget work, but I treat them as the simplest tool, not the default. A future method is a static method marked @future that Salesforce runs asynchronously in its own transaction. The rules: it must be static and return void, and parameters can only be primitives, arrays or collections of primitives. So I pass record Ids, not sObjects, and re-query inside. For example, if a trigger needs to update the rating on 20 Accounts in the background, I pass the Set of 20 Account Ids, and the future method queries them fresh and updates them. A few more limits. You can't call a future method from another future method or from Batch Apex. There's no job Id returned, so you can't monitor or chain it, and the execution order isn't guaranteed. You can call up to 50 future methods per transaction. And if it makes a callout, I add callout=true. Because there's no job Id or chaining, on my teams new async code usually goes to a Queueable instead.

- static void, primitives only (pass Ids)
- Cannot be called from future or batch
- No job Id, no chaining, order not guaranteed
- 50 future calls per transaction

```java
public class AccountService {
    @future
    public static void updateRatings(Set<Id> accountIds) {
        List<Account> accs = [SELECT Id, AnnualRevenue FROM Account WHERE Id IN :accountIds];
        for (Account a : accs) {
            a.Rating = (a.AnnualRevenue != null && a.AnnualRevenue > 1000000) ? 'Hot' : 'Warm';
        }
        update accs;
    }
}
```

<sub>Also asked as: How do you write an @future method? · What are the limitations of future methods? · Explain the future annotation in Apex · rules for at future method</sub>

### You need to call an external API whenever a record is created. Can you do the callout from the trigger?
*Fresher (0–2 yrs) · scenario* · `async-003`

No, you can't make a synchronous callout from a trigger. The trigger runs inside the database transaction, and Salesforce won't let that transaction sit and wait on an external system. So I move the callout to async code. The classic way is a future method with callout=true that takes the record Ids, re-queries them and makes the HTTP request. These days I prefer a Queueable that implements Database.AllowsCallouts, because I can pass more data, get a job Id, and chain or retry. Say a data load inserts 50 Accounts and each one has to go to a billing system. In code review, the thing I check first is that the trigger enqueues once for all 50 records together, not 50 separate jobs. One enqueue, one set of Ids, for the whole trigger batch.

- Synchronous callouts are not allowed in triggers
- Use @future(callout=true) or Queueable with Database.AllowsCallouts
- Enqueue once per trigger batch, not per record

```java
public class OrderSync {
    @future(callout=true)
    public static void send(Set<Id> orderIds) {
        List<Order> orders = [SELECT Id, OrderNumber FROM Order WHERE Id IN :orderIds];
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:ERP_API/orders');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(orders));
        HttpResponse res = new Http().send(req);
    }
}
// In the trigger handler (after insert):
// OrderSync.send(Trigger.newMap.keySet());
```

<sub>Also asked as: How do you make a callout from a trigger? · Can we do a callout directly from a trigger? · Write a future method with callout equals true · Callout from trigger gives an error, how do you fix it? · how to call external API when record is created</sub>

### What is Queueable Apex?
*Fresher (0–2 yrs) · code* · `async-004`

Queueable is my default for new async work. It's a class that implements the Queueable interface and its execute method, and I start it with System.enqueueJob. I think of it as a future method with more power. It can hold complex member variables like sObjects or wrapper classes. enqueueJob returns a job Id that I can track in AsyncApexJob. And I can chain another job from execute. For example, I can pass a list of Opportunity records straight into the Queueable's constructor, enqueue it, and keep the job Id so I can check its status later. You can't do any of that with a future method. It also supports callouts with Database.AllowsCallouts, and Transaction Finalizers for failure handling. The limit to remember: up to 50 enqueueJob calls in a synchronous transaction, but only one from inside an executing Queueable. That's the limit I plan around when someone designs a chain.

- Implements Queueable, method execute(QueueableContext)
- Accepts complex types, returns a job Id
- Supports chaining, callouts and finalizers
- 50 enqueueJob per sync transaction, 1 from an async one

```java
public class ContactCleanup implements Queueable {
    private List<Contact> contacts;
    public ContactCleanup(List<Contact> contacts) { this.contacts = contacts; }
    public void execute(QueueableContext ctx) {
        for (Contact c : contacts) {
            c.Email = c.Email == null ? null : c.Email.toLowerCase();
        }
        update contacts;
    }
}
// Id jobId = System.enqueueJob(new ContactCleanup(contactList));
```

<sub>Also asked as: Explain the Queueable interface · How do you write a queueable class? · What is System.enqueueJob? · what is q able apex</sub>

### How do you chain Queueable jobs?
*Mid (3–6 yrs) · code* · `async-005`

I chain only when step two genuinely depends on step one. To chain, I call System.enqueueJob for the next job at the end of the current job's execute method. Each running Queueable can add only one child job, so the chain is a straight line, one job after another. That's useful when step two depends on step one. For example, job one creates the invoices, and only when it's done does it enqueue job two, which emails them out. In production there's no limit on chain depth, but in Developer and Trial orgs it's capped at five jobs, including the parent. A stop condition is non-negotiable in review, so the chain doesn't run forever. And in test context I guard the chaining with Test.isRunningTest or a flag, because older docs say chaining inside a test throws an error, and current docs only support it with an appropriate stack depth.

- Enqueue the next job inside execute
- Only one child job per executing Queueable
- No depth limit in production; 5 in Developer/Trial orgs
- Always add a stop condition

```java
public class StepOneJob implements Queueable {
    public void execute(QueueableContext ctx) {
        // step one work here
        if (!Test.isRunningTest()) {
            System.enqueueJob(new StepTwoJob());
        }
    }
}
```

<sub>Also asked as: Can a queueable call another queueable? · How to run jobs one after another in Apex? · Explain queueable chaining with an example · how many jobs can I chain from queueable</sub>

### What is a Transaction Finalizer in Queueable Apex?
*Mid (3–6 yrs) · code* · `async-006`

I'd attach a finalizer to any Queueable that matters to the business, because it's the only reliable way to catch a hard failure. A Transaction Finalizer is a class that implements System.Finalizer, and it runs after a Queueable job finishes, whether the job succeeded or failed with an unhandled exception, even an uncatchable one like a limit exception. I attach it inside execute with System.attachFinalizer. In the finalizer's execute, I check FinalizerContext.getResult, which is SUCCESS or UNHANDLED_EXCEPTION, and getException gives me the error. Say a Queueable syncing orders blows the CPU limit. Normally that failure just disappears. With a finalizer, I can log it to a custom object, notify someone, or re-enqueue the job as a retry. A few limits to remember: only one finalizer per job, it can enqueue one async job, and a failed job can be re-enqueued by its finalizer up to five times in a row. So the retry logic needs a cap, which I make sure is there before it ships.

- Implements System.Finalizer, attached with System.attachFinalizer
- Runs on success and on unhandled failure
- Use for logging, alerts and retries
- One finalizer per job; re-enqueue up to 5 consecutive times

```java
public class SyncJob implements Queueable, Database.AllowsCallouts {
    public void execute(QueueableContext ctx) {
        System.attachFinalizer(new SyncFinalizer());
        // callout and DML work here
    }
}
public class SyncFinalizer implements Finalizer {
    public void execute(FinalizerContext ctx) {
        if (ctx.getResult() == ParentJobResult.UNHANDLED_EXCEPTION) {
            insert new Error_Log__c(
                Job_Id__c = ctx.getAsyncApexJobId(),
                Message__c = ctx.getException().getMessage());
        }
    }
}
```

<sub>Also asked as: How do you handle failures in a queueable job? · Explain System.Finalizer interface · How do you retry a failed queueable? · what is attach finalizer</sub>

### How do you delay a Queueable job or set AsyncOptions?
*Senior (7–10 yrs) · code* · `async-007`

For rate-limited integrations, I'd use a delayed enqueue rather than hammering the API. System.enqueueJob has an overload that takes a delay in minutes, from zero to ten, so the job won't start before that delay. That's handy for retry with back-off, or when an external system is rate-limiting you. Say an API sends back a "too many requests" error. I can re-enqueue the job with a five-minute delay instead of hitting it again right away. There's also an AsyncOptions class where I can set MinimumQueueableDelayInMinutes, MaximumQueueableStackDepth to cap how deep a chain can go, and a DuplicateSignature so the same job isn't queued twice. Inside the job, the AsyncInfo class tells me the current stack depth. One gotcha: the delay is ignored in test context, so my tests don't rely on it. I set the delay and stack-depth values as team standards per integration, so nobody hard-codes their own.

- enqueueJob(job, delayMinutes) with 0 to 10 minutes
- AsyncOptions: delay, max stack depth, duplicate signature
- AsyncInfo.getCurrentQueueableStackDepth()
- Delay is ignored in tests

```java
// Simple delay
System.enqueueJob(new RetrySyncJob(recordIds), 5);

// With AsyncOptions
AsyncOptions opts = new AsyncOptions();
opts.MaximumQueueableStackDepth = 10;
opts.MinimumQueueableDelayInMinutes = 2;
System.enqueueJob(new RetrySyncJob(recordIds), opts);
```

<sub>Also asked as: Can I schedule a queueable to run after a few minutes? · What is AsyncOptions in Apex? · How to add a delay to System.enqueueJob? · set max stack depth for queueable</sub>

### How do you prevent the same Queueable job from being enqueued twice?
*Senior (7–10 yrs) · code* · `async-008`

My answer is a duplicate signature, not home-made checks. I attach a duplicate signature to the Queueable through AsyncOptions. I build it with QueueableDuplicateSignature.Builder, adding values like the record Id and the job name, and pass the options to System.enqueueJob. If a job with the same signature is already waiting in the queue, the next enqueue throws a DuplicateMessageException, which I catch and ignore. For example, say three quick updates hit the same Account and each one tries to queue a sync job. With a signature built from that Account Id, only the first gets queued and the other two are skipped. One catch: the signature is removed once a job starts running, so it doesn't block a duplicate of a job that's already running. This cuts down lock contention and race conditions. Before this feature, people checked AsyncApexJob or used a static flag, which is less reliable. When I see those older patterns in review, I ask whether a signature would do the job more cleanly.

- Use AsyncOptions.DuplicateSignature
- Build with QueueableDuplicateSignature.Builder
- Duplicate enqueue throws DuplicateMessageException
- Reduces race conditions and lock contention

```java
AsyncOptions opts = new AsyncOptions();
opts.DuplicateSignature = QueueableDuplicateSignature.Builder()
    .addId(accountId)
    .addString('AccountSyncJob')
    .build();
try {
    System.enqueueJob(new AccountSyncJob(accountId), opts);
} catch (DuplicateMessageException e) {
    // same job already queued, safe to ignore
}
```

<sub>Also asked as: How to avoid duplicate queueable jobs for the same record? · What is QueueableDuplicateSignature? · Two triggers are queuing the same job, how do you dedupe?</sub>

### What is Batch Apex and what are its methods?
*Fresher (0–2 yrs) · code* · `async-009`

When the volume is too big for one transaction, I go to Batch Apex. It's for processing large numbers of records, even millions, by splitting them into chunks. The class implements Database.Batchable with three methods. Start runs once and returns the records to process, as a QueryLocator or an Iterable. Execute runs once per chunk, 200 records by default, and each chunk is its own transaction with fresh governor limits. Finish runs once at the end, and I use it to send a summary email or chain the next job. For example, if I need to update 50,000 Contact records, start returns the query, execute runs 250 times with 200 records each, and finish emails me the result. I kick it off with Database.executeBatch, which returns the job Id. On my teams, every batch also has to be safe to re-run, because that's what saves you when a chunk fails at 2 AM.

- start: collect records (QueryLocator or Iterable)
- execute: process each chunk, default 200
- finish: post-processing, emails, chaining
- Each chunk gets fresh governor limits

```java
public class AccountRatingBatch implements Database.Batchable<sObject> {
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator('SELECT Id, AnnualRevenue FROM Account');
    }
    public void execute(Database.BatchableContext bc, List<Account> scope) {
        for (Account a : scope) {
            a.Rating = (a.AnnualRevenue != null && a.AnnualRevenue > 1000000) ? 'Hot' : 'Cold';
        }
        update scope;
    }
    public void finish(Database.BatchableContext bc) {
        System.debug('Batch finished: ' + bc.getJobId());
    }
}
// Id jobId = Database.executeBatch(new AccountRatingBatch(), 200);
```

<sub>Also asked as: Explain the Database.Batchable interface · What are start, execute and finish in batch? · How does batch apex work? · bach apex methods</sub>

### What is Database.Stateful in Batch Apex?
*Mid (3–6 yrs) · code* · `async-010`

I use Database.Stateful only when I genuinely need totals or Ids across chunks. By default Batch Apex is stateless. Each execute call gets a fresh copy of the class, so instance variables reset between chunks. If I implement Database.Stateful, instance variables keep their values across all execute calls and are still there in finish. Say I'm updating 10,000 records and want to email a summary like "9,950 succeeded, 50 failed." Without Stateful, my counters go back to zero every chunk. With it, they keep adding up, and finish can send the totals. The trade-off is that the state is serialized after every chunk, which adds time and counts toward heap. So I keep it small, like counts and Ids, not full record lists. And static variables are never kept across chunks. If I see a full record list held in a Stateful batch during review, that's a heap risk I'd ask to change.

- Stateless by default: instance variables reset per chunk
- Stateful keeps instance variables across execute and finish
- Serialization cost; keep state small
- Static variables are not preserved

```java
public class OppTotalBatch implements Database.Batchable<sObject>, Database.Stateful {
    private Decimal total = 0;
    private Integer processed = 0;
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator('SELECT Amount FROM Opportunity WHERE IsWon = true');
    }
    public void execute(Database.BatchableContext bc, List<Opportunity> scope) {
        for (Opportunity o : scope) {
            total += (o.Amount == null ? 0 : o.Amount);
            processed++;
        }
    }
    public void finish(Database.BatchableContext bc) {
        System.debug(processed + ' opportunities, total ' + total);
    }
}
```

<sub>Also asked as: How do you maintain state across batch chunks? · Why are my batch variables resetting in every execute? · When should you use Database.Stateful? · data base stateful interface</sub>

### What is the difference between QueryLocator and Iterable in Batch Apex?
*Mid (3–6 yrs) · comparison* · `async-011`

My default is QueryLocator, and the team needs a reason to pick anything else. It's based on a single SOQL query and lets the batch process up to 50 million records, because the 50,000 query-row limit doesn't apply in start. An Iterable is for when the records don't come from one simple query, like combining data from several objects, a list built in code, or results from a callout. The catch is that with an Iterable, normal governor limits apply in start, so any SOQL there is still capped at 50,000 rows. So if I need to clean up 2 million old Task records, that's a QueryLocator. If I'm building a custom list by merging two queries with a callout response, that's an Iterable. Large volume on one object, QueryLocator. Custom logic, Iterable.

- QueryLocator: one SOQL query, up to 50 million records
- Iterable: custom source, normal limits apply in start
- Iterable SOQL still capped at 50,000 rows
- Default to QueryLocator for large data

<sub>Also asked as: When would you return an Iterable from start? · QueryLocator vs Iterable in batch start method · How many records can a batch process with QueryLocator? · query locator versus iterable</sub>

### What is the batch size in Batch Apex and how do you change it?
*Fresher (0–2 yrs) · code* · `async-012`

I treat batch size as a tuning decision, not a constant. The default scope is 200 records per execute, and I can pass a second parameter to Database.executeBatch to change it, from 1 up to 2,000 with a QueryLocator. Larger chunks mean fewer transactions and faster overall runs, but each chunk has more work, so it can hit CPU, heap or DML limits. I reduce the scope when each record triggers heavy logic, when I make a callout per record, or when I see row-lock errors. For example, a batch doing one callout per record might use a scope of 50 or even 1, while a simple field update can use 2,000. I'd rather the scope sit in custom metadata, so we can tune it in production without a deployment.

- Default 200, maximum 2,000 for QueryLocator
- Second argument of Database.executeBatch
- Smaller scope for heavy logic, callouts, lock errors
- Larger scope for simple, fast updates

```java
// Default scope of 200
Database.executeBatch(new AccountRatingBatch());

// Smaller scope for callout-heavy work
Id jobId = Database.executeBatch(new ExternalSyncBatch(), 50);
```

<sub>Also asked as: What is the default scope size for batch? · Maximum batch size in Salesforce? · How do you pass scope to Database.executeBatch? · why would I reduce batch size</sub>

### What happens if one chunk of a batch job fails?
*Mid (3–6 yrs) · concept* · `async-013`

The short answer is only that chunk rolls back. Batch Apex isn't all-or-nothing across the whole job. Each execute call is its own transaction. So if one chunk throws an unhandled exception, only that chunk's changes roll back. Chunks that already finished stay committed, and the rest keep running. The failed chunk shows up in NumberOfErrors on AsyncApexJob. Say I run a batch over 1,000 records in chunks of 200, and chunk three fails. Chunks one and two are saved, chunks four and five still run, and only those 200 records in chunk three roll back. Inside a chunk, though, if I use plain update with the default all-or-none behaviour, one bad record fails the whole chunk. That's why I usually use Database.update with allOrNone false, log the failed rows, and make the job re-runnable so a second run only picks up unfinished records. That re-run plan is what I explain to stakeholders up front, so a partial failure isn't a surprise.

- Each chunk is a separate transaction
- Only the failing chunk rolls back
- NumberOfErrors on AsyncApexJob shows failed chunks
- Use partial success and make the job re-runnable

<sub>Also asked as: If execute throws an exception, do other chunks roll back? · Does batch apex roll back all records on error? · Is batch apex all or nothing?</sub>

### How do you monitor a batch or async job?
*Fresher (0–2 yrs) · code* · `async-014`

My rule is that nobody should have to go looking for a failed job; it should tell us. I monitor async jobs in two ways. In Setup, there's the Apex Jobs page, which shows status, total batches, batches processed and failures, and the Apex Flex Queue page for jobs waiting to run. In code, I query the AsyncApexJob object using the job Id that executeBatch or enqueueJob returned. The key fields are Status, like Queued, Processing, Completed, Failed or Aborted, plus JobItemsProcessed, TotalJobItems, NumberOfErrors, and ExtendedStatus for the first error. For example, in a batch's finish method I often query its own AsyncApexJob record and send an email saying something like "48 of 50 batches processed, 2 errors," with the first error taken from ExtendedStatus. That way nobody has to go and check Setup.

- Setup: Apex Jobs and Apex Flex Queue pages
- Query AsyncApexJob by job Id
- Status, JobItemsProcessed, TotalJobItems, NumberOfErrors
- ExtendedStatus shows the first error

```java
AsyncApexJob job = [
    SELECT Id, Status, JobItemsProcessed, TotalJobItems,
           NumberOfErrors, ExtendedStatus, CreatedBy.Email
    FROM AsyncApexJob
    WHERE Id = :jobId
];
```

<sub>Also asked as: How do I check the status of a batch job? · What is AsyncApexJob? · Where can I see running batch jobs? · query async apex job status</sub>

### What is the Apex Flex Queue?
*Fresher (0–2 yrs) · concept* · `async-015`

The Flex Queue is the overflow line for batch jobs. Only five batch jobs can be actively queued or processing at the same time. The Apex Flex Queue lets you submit more than that. Extra batch jobs go into the flex queue with a status of Holding, and it can hold up to 100 jobs. As slots free up, Salesforce moves jobs from the flex queue into the active queue, in order. Say I submit eight batch jobs at once. Five go active, and the other three sit in the flex queue as Holding until a slot opens. Admins can reorder or cancel holding jobs from the Apex Flex Queue page in Setup. In Apex, the FlexQueue class has methods to move a job to the front or behind another job. And if the flex queue is full, executeBatch throws an exception. So when several teams share an org, I keep an eye on how many nightly batches we're all submitting at once.

- 5 concurrent active batch jobs
- Flex queue holds up to 100 jobs in Holding status
- Reorder in Setup or with the FlexQueue class
- Full queue causes executeBatch to fail

<sub>Also asked as: What happens when I submit more than five batch jobs? · Explain holding status in batch jobs · How many batch jobs can run at the same time? · flex queue in salesforce</sub>

### How do you abort a running batch or scheduled job?
*Fresher (0–2 yrs) · code* · `async-016`

To stop a job, I use System.abortJob and pass the job Id. For a batch or Queueable, the Id comes from AsyncApexJob. For a scheduled job, I pass the CronTrigger Id, which System.schedule returns. Admins can also click Abort on the Apex Jobs page, or Delete on the Scheduled Jobs page in Setup. One thing to know: aborting a batch stops further chunks, but chunks that already committed are not rolled back. So if a batch is halfway through, the first half stays updated. The other gotcha shows up at deployment. Say I need to change a class that runs on a nightly schedule. Salesforce blocks changes to classes with pending scheduled jobs, unless deployment with active jobs is allowed. So I usually abort the scheduled job first, deploy, and then schedule it again. That abort and reschedule step goes into our release checklist, so it isn't left to memory.

- System.abortJob(jobId)
- Batch/Queueable: AsyncApexJob Id; scheduled: CronTrigger Id
- Committed chunks are not rolled back
- Abort scheduled jobs before changing their class

```java
// Abort all scheduled jobs with a given name
for (CronTrigger ct : [SELECT Id FROM CronTrigger
                      WHERE CronJobDetail.Name = 'Nightly Account Batch']) {
    System.abortJob(ct.Id);
}
```

<sub>Also asked as: How to stop a batch job in Salesforce? · How do you delete a scheduled apex job? · What is System.abortJob? · cancel running apex job</sub>

### What is Scheduled Apex and how do you write it?
*Fresher (0–2 yrs) · code* · `async-017`

I keep Scheduled Apex as a thin trigger for the real work. Scheduled Apex lets a class run at a specific time or on a recurring schedule. The class implements the Schedulable interface, with one method, execute, that takes a SchedulableContext. I can schedule it two ways. From Setup, using Schedule Apex, which allows weekly runs on chosen days or monthly runs at a preferred start time. Or in code, with System.schedule and a cron expression, for more control. Best practice, and my standard on the team, is to keep the scheduled class thin. For example, my nightly cleanup class does nothing in execute except call Database.executeBatch on the real cleanup batch. All the logic lives in the batch or Queueable. And remember the limit: an org can have up to 100 scheduled Apex jobs at one time.

- Implements Schedulable, execute(SchedulableContext)
- Schedule from Setup or System.schedule with cron
- Keep it thin; start a batch or Queueable
- Up to 100 scheduled Apex jobs per org

```java
public class NightlyCleanupScheduler implements Schedulable {
    public void execute(SchedulableContext sc) {
        Database.executeBatch(new OldCaseCleanupBatch(), 200);
    }
}
```

<sub>Also asked as: Explain the Schedulable interface · How do you schedule Apex to run daily? · Write a schedulable class · how to schedule apex class</sub>

### Explain cron expressions in System.schedule.
*Fresher (0–2 yrs) · code* · `async-018`

Cron is what gives System.schedule its precision. System.schedule takes three arguments: a unique job name, a cron expression, and an instance of the Schedulable class. It returns the CronTrigger Id. A Salesforce cron expression has six or seven fields in this order: seconds, minutes, hours, day of month, month, day of week, and an optional year. A question mark means no specific value and is used in either day of month or day of week. So zero zero two star star question mark means 2 AM every day, and zero zero nine question mark star MON-FRI means 9 AM on weekdays. Seconds and minutes must be fixed values, so cron cannot run more often than once an hour. In review, I ask for the cron string to have a plain-English comment next to it, because these are easy to misread.

- Seconds Minutes Hours Day-of-month Month Day-of-week [Year]
- '?' used in day-of-month or day-of-week
- System.schedule returns the CronTrigger Id
- For more frequent runs, schedule several jobs

```java
// Every day at 2:00 AM
String cronDaily = '0 0 2 * * ?';
System.schedule('Nightly Cleanup', cronDaily, new NightlyCleanupScheduler());

// Weekdays at 9:30 AM
System.schedule('Weekday Report', '0 30 9 ? * MON-FRI', new ReportScheduler());
```

<sub>Also asked as: How do you write a cron expression for Salesforce? · Schedule a job at 2 AM every day using cron · What are the fields in a Salesforce cron expression? · chron expression apex</sub>

### Can you make a callout from Scheduled Apex?
*Mid (3–6 yrs) · troubleshooting* · `async-019`

Not directly, so I design around it. Synchronous callouts aren't supported from the execute method of a Schedulable class. The standard fix is to have the scheduled class start something that does support callouts. That's a Batch class that implements Database.AllowsCallouts, a Queueable that implements Database.AllowsCallouts, or a future method with callout=true. For example, for a nightly sync of Accounts to an external system, I schedule a batch with callouts, so I get chunking and retry handling. For one small request, like pulling a single file of rates every morning, a Queueable started from the scheduler is enough. The trade-off I weigh is volume: batch for many records, Queueable for one quick call.

- No synchronous callouts in Schedulable.execute
- Start a Queueable or Batch with Database.AllowsCallouts
- Or call a future method with callout=true

<sub>Also asked as: Callout from schedulable class throws an error, why? · How to call an API on a schedule? · Synchronous callouts from scheduled apex</sub>

### What are Platform Events?
*Fresher (0–2 yrs) · concept* · `async-020`

I use Platform Events when I want systems to talk without depending on each other. They're Salesforce's publish-subscribe messaging. I define an event like an object, with the __e suffix and custom fields. Publishers send event messages and subscribers react to them, and neither side knows about the other. Publishers can be Apex, Flow, or external systems through the API. Subscribers can be Apex triggers, Flows, LWC using the empApi module, or external systems through the Pub/Sub API or CometD. Say an order gets marked as shipped. I publish an Order_Shipped__e event, a Flow picks it up and emails the customer, and a warehouse system picks up the same event through the Pub/Sub API. The publisher doesn't care who's listening. I use them to decouple systems, to integrate with external apps in near real time, and to log errors that must survive a rollback.

- Publish/subscribe, object with __e suffix
- Publish from Apex, Flow or API
- Subscribe with triggers, Flow, LWC empApi, Pub/Sub API
- Decouples publishers and subscribers

<sub>Also asked as: Explain platform events in Salesforce · What is event-driven architecture in Salesforce? · Why use platform events instead of a direct callout? · plat form events use case</sub>

### How do you publish a Platform Event from Apex?
*Fresher (0–2 yrs) · code* · `async-021`

Publishing is simple, but the team has to understand what success really means. I create instances of the event object, set the fields, and call EventBus.publish with a single event or a list. It returns Database.SaveResult objects, so I loop through them and check isSuccess and getErrors. The gotcha: a successful result means the publish request was queued, not that subscribers have processed it, because delivery is asynchronous. And publishing inside a loop is something I flag in every review; we publish a list in one call. For example, if 100 Orders ship in one transaction, I build a list of 100 events and call EventBus.publish once. Whether the events go out immediately or only after the transaction commits depends on the Publish Behavior setting on the event definition.

- EventBus.publish(list) returns SaveResults
- Success means queued, delivery is async
- Publish in bulk, not in a loop
- Publish Behavior setting controls timing

```java
List<Order_Shipped__e> events = new List<Order_Shipped__e>();
for (Order o : shippedOrders) {
    events.add(new Order_Shipped__e(Order_Id__c = o.Id, Status__c = 'Shipped'));
}
List<Database.SaveResult> results = EventBus.publish(events);
for (Database.SaveResult sr : results) {
    if (!sr.isSuccess()) {
        for (Database.Error err : sr.getErrors()) {
            System.debug('Publish failed: ' + err.getMessage());
        }
    }
}
```

<sub>Also asked as: Write code to publish a platform event · What is EventBus.publish? · How do you know if a platform event was published successfully?</sub>

### How do you subscribe to a Platform Event with an Apex trigger?
*Mid (3–6 yrs) · code* · `async-022`

I subscribe with an after insert trigger on the event object, because after insert is the only event supported. The trigger runs asynchronously in its own transaction, by default as the Automated Process user. It gets events in batches of up to 2,000, not 200 like normal triggers, so the code has to be fully bulkified. A query inside a loop over 2,000 events will fail fast. Because the running user is Automated Process, records it creates are owned by that user, unless I configure a different running user. That surprises people, for example when new Cases from the trigger show up owned by Automated Process. Debug logs also need a trace flag on that user. Both the batch size and the running user can be changed with PlatformEventSubscriberConfig. I make sure that running user is decided up front, because ownership and sharing issues are hard to fix after go-live.

- Only after insert is supported
- Batches of up to 2,000 events
- Runs as Automated Process user by default
- Configure via PlatformEventSubscriberConfig

```java
trigger OrderShippedTrigger on Order_Shipped__e (after insert) {
    List<Task> tasks = new List<Task>();
    for (Order_Shipped__e evt : Trigger.new) {
        tasks.add(new Task(
            WhatId = evt.Order_Id__c,
            Subject = 'Follow up on shipped order'));
    }
    insert tasks;
}
```

<sub>Also asked as: Write a trigger on a platform event · What events does a platform event trigger support? · Which user runs the platform event trigger? · platform event subscriber in apex</sub>

### What is the difference between Publish Immediately and Publish After Commit?
*Mid (3–6 yrs) · comparison* · `async-023`

My rule is After Commit for business events and Immediately for error logs. This is a setting on the platform event definition. With Publish After Commit, the event is published only if the transaction commits successfully, so if the transaction rolls back, the event is never sent, and setSavepoint and rollback apply to it. That is what I want for business events like Order Shipped, so subscribers never act on data that does not exist. With Publish Immediately, the event goes out as soon as publish is called, regardless of the transaction outcome, and it cannot be rolled back. That is perfect for error logging: I publish a log event in a catch block, and it survives even when the main transaction fails. Getting this choice wrong is a quiet bug, so I check the setting on every new event in review.

- After Commit: only sent if the transaction commits
- Immediately: sent right away, cannot be rolled back
- Business events: After Commit
- Error logging: Immediately

<sub>Also asked as: Platform event publish behavior options · Can a published platform event be rolled back? · How do you log errors with platform events even if the transaction fails?</sub>

### What is the Replay ID and how long are Platform Events retained?
*Senior (7–10 yrs) · concept* · `async-024`

Replay is what makes event integrations recoverable, so I plan for it from day one. Every event message gets a Replay ID, a sequence value that lets a subscriber resume from a point in the event stream. High-volume platform events, which is the default for new events, are stored on the event bus for 72 hours. Say an external system on the Pub/Sub API goes down overnight for maintenance. When it comes back, it reconnects with the last Replay ID it processed and gets everything it missed, as long as it's within those 72 hours. It can also replay from the earliest stored event. One gotcha: Replay IDs aren't guaranteed to be contiguous, so I never treat them as a gap-free counter. Legacy standard-volume events have shorter retention, and Salesforce has announced their retirement, so I always use high-volume events. I also tell the integration team plainly that 72 hours is their recovery window, so their outage plan fits inside it.

- Replay ID marks position in the event stream
- High-volume events retained for 72 hours
- Subscribers resume from last processed Replay ID
- Replay IDs are not contiguous

<sub>Also asked as: How can a subscriber get missed events? · Explain replay id in platform events · What is the retention for high volume platform events? · how to replay events in salesforce</sub>

### How do you handle errors and retries in a Platform Event trigger?
*Senior (7–10 yrs) · code* · `async-025`

I'd use two tools together, and I expect both in any event trigger my team ships. First, setResumeCheckpoint. As I process each event, I call EventBus.TriggerContext.currentContext().setResumeCheckpoint with that event's ReplayId. If the trigger then hits a limit or exception, the next invocation resumes after the last checkpoint, so already-processed events aren't repeated. Say the trigger gets 500 events and fails on number 301. With checkpoints, the next run starts at 301, not back at 1. Second, if the failure is temporary, like a locked record, I can throw EventBus.RetryableException. Salesforce then re-fires the trigger with the same batch of events after a delay, for a limited number of retries. I combine both with logging, so events that keep failing are captured and not silently lost.

- setResumeCheckpoint(replayId) to resume after the last good event
- Throw EventBus.RetryableException for transient failures
- Retries are limited, so log permanent failures

```java
trigger PaymentEventTrigger on Payment__e (after insert) {
    EventBus.TriggerContext ctx = EventBus.TriggerContext.currentContext();
    List<Payment_Log__c> logs = new List<Payment_Log__c>();
    Integer count = 0;
    for (Payment__e evt : Trigger.new) {
        if (++count > 500) { break; } // remaining events are redelivered
        logs.add(new Payment_Log__c(Reference__c = evt.Reference__c));
        ctx.setResumeCheckpoint(evt.ReplayId);
    }
    insert logs;
}
```

<sub>Also asked as: My platform event trigger failed halfway, how do I resume? · What is EventBus.RetryableException? · Explain setResumeCheckpoint in platform event triggers</sub>

### What is Change Data Capture?
*Mid (3–6 yrs) · code* · `async-026`

When an external system needs to mirror Salesforce data, CDC is my first choice, because nobody has to write publishing code. Change Data Capture publishes change events automatically whenever records of a selected object are created, updated, deleted or undeleted. I just enable the object on the Change Data Capture setup page, and Salesforce publishes events like AccountChangeEvent, with no code on the publishing side. Each event has a ChangeEventHeader with the change type, the record Ids, and the list of changed fields, so subscribers get only what changed. For example, if a rep updates just the Phone on an Account, the event says UPDATE, gives that Account Id, and lists Phone as the changed field. External systems subscribe through the Pub/Sub API to keep their copy in sync. Inside Salesforce, I can also write an after insert Apex trigger on the change event for async processing. Events are retained for three days, which is the recovery window I build the subscriber's catch-up plan around.

- Enable per object in Setup, no publish code
- Events like AccountChangeEvent
- ChangeEventHeader: changeType, recordIds, changedFields
- Used to sync external systems in near real time

```java
trigger AccountChangeTrigger on AccountChangeEvent (after insert) {
    Set<String> updatedIds = new Set<String>();
    for (AccountChangeEvent evt : Trigger.new) {
        EventBus.ChangeEventHeader header = evt.ChangeEventHeader;
        if (header.changeType == 'UPDATE' && header.changedFields.contains('Rating')) {
            updatedIds.addAll(header.recordIds);
        }
    }
    // process updatedIds asynchronously here
}
```

<sub>Also asked as: Explain CDC in Salesforce · How do external systems get notified when records change? · Write a trigger on a change event · change data capture use case</sub>

### What is the difference between Platform Events and Change Data Capture?
*Senior (7–10 yrs) · comparison* · `async-027`

I decide this by asking one question: are we replicating data, or announcing a business event? Both run on the same event bus, but they solve different needs. Change Data Capture is about data changes. Salesforce publishes events automatically for every create, update, delete and undelete on the objects I enable, with the changed fields included, and I can't add custom fields to the event. It's ideal for keeping an external database or data warehouse in sync. Platform Events are custom business events that I define and publish myself, like Order Shipped or Payment Failed, with whatever fields I need, and I control exactly when they fire. Say a data warehouse needs a copy of every Account change. That's CDC, with no code. But if a billing system needs to know a payment failed, along with the reason, I'd publish a Payment Failed platform event. Replicating data, CDC. Business processes and integration messages, Platform Events.

- CDC: automatic, record-change events, fixed schema
- Platform Events: custom schema, published by me
- CDC for data sync, Platform Events for business events

<sub>Also asked as: When to use CDC vs platform events? · Platform event vs change event · Should I use CDC or a custom platform event for integration?</sub>

### When would you use future, Queueable, Batch or Scheduled Apex?
*Fresher (0–2 yrs) · comparison* · `async-028`

I pick based on volume, complexity and timing, and I'd like the whole team using the same decision rule so the codebase stays consistent. A future method is fine for a quick, simple task, like one callout from a trigger, with only primitive parameters. Queueable is my default for most async work. It takes complex data, returns a job Id, supports chaining and finalizers, and is good up to a few thousand records. Batch Apex is for large volumes, tens of thousands to millions of records, because it chunks the work and each chunk gets fresh limits. Scheduled Apex is about timing, running something at a set time, and usually it just kicks off a batch or Queueable. Platform Events fit when I want to decouple publishers from subscribers. So, for example, recalculating a field on 2 million Contacts every Sunday night would be a scheduled class that starts a batch.

- Future: simple, primitives, fire and forget
- Queueable: default choice, chaining, job Id
- Batch: large volumes with chunking
- Schedulable: time-based, starts other jobs

<sub>Also asked as: How do you choose the right asynchronous option? · Which async apex should I use for my requirement? · Compare all the async apex types · difference between future queueable batch and schedulable</sub>

### You get a MIXED_DML_OPERATION error. How do you fix it?
*Mid (3–6 yrs) · scenario* · `async-029`

I fix it by splitting the setup and non-setup work into separate transactions. Mixed DML happens when one transaction does DML on a setup object, like User, Group, GroupMember or PermissionSetAssignment, and also on a non-setup object like Account or a custom object. Salesforce blocks this because setup changes can affect sharing. The fix is to split the work into separate transactions: I do one part synchronously and move the other into an async job, usually a Queueable or a future method. For example, after creating a Contact, I assign a permission set in a Queueable. In test classes, I wrap the setup DML inside System.runAs, which puts it in a separate context. When I review user-provisioning code, this is one of the first things I look for.

- Setup object DML plus non-setup DML in one transaction
- Move one part to Queueable or @future
- In tests, use System.runAs for setup DML

```java
public class AssignPermSetJob implements Queueable {
    private Set<Id> userIds;
    private Id permSetId;
    public AssignPermSetJob(Set<Id> userIds, Id permSetId) {
        this.userIds = userIds;
        this.permSetId = permSetId;
    }
    public void execute(QueueableContext ctx) {
        List<PermissionSetAssignment> psas = new List<PermissionSetAssignment>();
        for (Id uid : userIds) {
            psas.add(new PermissionSetAssignment(AssigneeId = uid, PermissionSetId = permSetId));
        }
        insert psas;
    }
}
```

<sub>Also asked as: How do you fix mixed DML error? · Insert user and account in the same transaction error · What causes mixed DML operation exception? · mixed dml in test class</sub>

### How are governor limits different for asynchronous Apex?
*Fresher (0–2 yrs) · concept* · `async-030`

Async gives you more headroom, but it's not a fix for bad code. Async transactions get higher limits on the ones people hit most. SOQL queries go from 100 to 200, heap from 6 MB to 12 MB, and maximum CPU time from 10 seconds to 60. Many other limits stay the same, though: 150 DML statements, 10,000 DML rows, 50,000 query rows and 100 callouts per transaction. In Batch Apex, each execute call is its own transaction, so these limits reset every chunk, and that's why batch can handle millions of records overall. Say a synchronous process needs about 150 queries and fails on the 100 limit. Moving it to a Queueable gives it room up to 200. But if the real cause is a query inside a loop, it will just fail again with more data. So async helps, but it doesn't remove the need for bulkified code. If someone proposes going async just to dodge a limit, I ask them to show me the query count first.

- SOQL: 100 sync, 200 async
- Heap: 6 MB sync, 12 MB async
- CPU: 10 s sync, 60 s async
- DML, query rows and callout limits stay the same

<sub>Also asked as: What limits increase in async apex? · Async vs sync governor limits · Why does my code work in batch but fail in a trigger?</sub>

### How do you test asynchronous Apex?
*Fresher (0–2 yrs) · code* · `async-031`

The key is Test.startTest and Test.stopTest, and I expect every async class to have a test that asserts the actual outcome, not just coverage. Any async work queued between them, whether future, Queueable, Batch or Scheduled, runs synchronously when Test.stopTest is called. So my pattern is: set up data, call startTest, enqueue the job or do the DML that fires it, call stopTest, and then query and assert. For example, if inserting an Account kicks off a Queueable that sets its Rating, I insert the Account between startTest and stopTest, and right after stopTest I query it and assert the Rating is set. For batch tests, only one execute runs, so I create no more test records than the scope size. Queueable chaining is restricted in tests, so I guard the chaining code. For callouts, I call Test.setMock with an HttpCalloutMock right after startTest, before the code that calls out.

- Async code runs at Test.stopTest()
- Assert after stopTest
- Batch tests: records within one scope
- Mock callouts with Test.setMock

```java
@IsTest
private class ContactCleanupTest {
    @IsTest
    static void lowercasesEmails() {
        Account acc = new Account(Name = 'Test');
        insert acc;
        List<Contact> cons = new List<Contact>{
            new Contact(LastName = 'A', Email = 'A@TEST.COM', AccountId = acc.Id)
        };
        insert cons;
        Test.startTest();
        System.enqueueJob(new ContactCleanup(cons));
        Test.stopTest();
        Contact c = [SELECT Email FROM Contact WHERE Id = :cons[0].Id];
        Assert.areEqual('a@test.com', c.Email);
    }
}
```

<sub>Also asked as: How do you write a test class for queueable? · Why do we use Test.startTest and Test.stopTest for async? · How to test a future method? · test class for async apex</sub>

### A trigger calls a future method per record and fails on data loads. What is wrong and how do you fix it?
*Senior (7–10 yrs) · scenario* · `async-032`

The trigger enqueues one async job per record, and that's the bug. A data load sends records in chunks of 200, so the trigger tries to make 200 future calls, and the limit is 50 per transaction, giving the Too many future calls error. The fix is to collect all relevant Ids in the trigger and make one async call for the whole batch. I would also switch to a Queueable that takes the full Id set, and if the work per record is heavy, the Queueable can process a slice and chain the rest. I would also check whether the code is already running in async context with System.isFuture or System.isBatch to avoid illegal nested calls. To stop it coming back, I'd make a 200-record bulk test a standard for every trigger, because that catches this before any data load does.

- One async call per trigger batch, not per record
- Future limit: 50 per transaction
- Queueable with an Id set, chain if large
- Guard with System.isFuture() / System.isBatch()

```java
public class AccountTriggerHandler {
    public static void afterUpdate(Map<Id, Account> newMap, Map<Id, Account> oldMap) {
        Set<Id> changed = new Set<Id>();
        for (Account a : newMap.values()) {
            if (a.BillingCity != oldMap.get(a.Id).BillingCity) { changed.add(a.Id); }
        }
        if (!changed.isEmpty() && !System.isBatch() && !System.isFuture()) {
            System.enqueueJob(new AddressSyncJob(changed));
        }
    }
}
```

<sub>Also asked as: Too many future calls 51 error during data load · Future method in a loop in a trigger · Bulk upload fails because of async calls in trigger · how to bulkify async calls from trigger</sub>

### How do you capture unhandled errors from Batch Apex?
*Senior (7–10 yrs) · code* · `async-033`

I'd make every important batch implement Database.RaisesPlatformEvents; it's one of my team standards. Then Salesforce publishes a BatchApexErrorEvent whenever execute or another batch method throws an unhandled exception, including limit exceptions I can't catch in code. The event carries the job Id, the exception type, the message, the stack trace, and the scope of record Ids that failed. I write an after insert trigger on BatchApexErrorEvent to log these into a custom error object or notify the team. Say a nightly batch hits a CPU limit on one chunk of 200 Opportunities. The trigger logs the error along with those 200 Ids, and I can retry just those records instead of re-running the whole job. That's much better than only checking NumberOfErrors after the job, which tells you a chunk failed but not which records were in it.

- Implement Database.RaisesPlatformEvents
- BatchApexErrorEvent fires on unhandled exceptions
- Event includes JobScope with failed record Ids
- Trigger on the event to log or retry

```java
public class InvoiceBatch implements Database.Batchable<sObject>, Database.RaisesPlatformEvents {
    // start, execute, finish ...
}

trigger BatchErrorTrigger on BatchApexErrorEvent (after insert) {
    List<Error_Log__c> logs = new List<Error_Log__c>();
    for (BatchApexErrorEvent evt : Trigger.new) {
        logs.add(new Error_Log__c(
            Job_Id__c = evt.AsyncApexJobId,
            Message__c = evt.Message,
            Record_Ids__c = evt.JobScope));
    }
    insert logs;
}
```

<sub>Also asked as: What is BatchApexErrorEvent? · What is Database.RaisesPlatformEvents? · How to get notified when a batch chunk fails with a limit exception?</sub>

### What async jobs can you start from inside a batch job?
*Mid (3–6 yrs) · troubleshooting* · `async-034`

This is a context question, and the restrictions matter. You can't call a future method from Batch Apex, it throws an exception. From the execute method, you can enqueue one Queueable job per execute, since it's an async context. To start another batch, the right place is the finish method, and that's how batch chaining is normally done. Scheduling with System.schedule is also possible. Here's where it bites people: say a shared service class uses @future, and it's called from a trigger and also from a batch. From the trigger it works, but when the batch calls it, it throws. So to keep code safe in any context, I check System.isBatch, System.isFuture and System.isQueueable before deciding which async option to call. For shared service classes, that context check is something I look for in review.

- No @future calls from batch
- One System.enqueueJob per execute
- Start the next batch from finish
- Check System.isBatch() / isFuture() / isQueueable()

<sub>Also asked as: Can I call a future method from batch apex? · Can I call a queueable from batch execute? · Can batch apex call another batch? · async from async restrictions</sub>

### How would you design async processing for a high-volume integration in Salesforce?
*Senior (7–10 yrs) · design* · `async-035`

I'd design it by separating capture from processing. Triggers stay thin. They only detect changes and either publish a platform event or write a lightweight staging record. The processing then happens in bulk, through a platform event trigger, a Queueable that handles a slice and chains the rest, or a scheduled batch for big backlogs. Say we're sending order updates to an ERP. The Order trigger just writes a staging row with status Pending. A Queueable picks up a slice of Pending rows, sends them, marks them Sent, and chains the next slice. I keep jobs idempotent and re-runnable, and that status field means a record is never processed twice. For failures, I add finalizers or BatchApexErrorEvent. I watch the org-wide daily async execution limit and the five concurrent batch slots, and I don't launch batches from triggers. Monitoring through AsyncApexJob and an error log object completes the design. The trade-off I'd explain to stakeholders is a little latency, a few seconds to minutes, in exchange for a sync that recovers on its own.

- Thin triggers: capture only
- Bulk processing via events, Queueable chains or batch
- Idempotent jobs with status tracking
- Watch daily async limit and batch concurrency
- Centralized error logging and monitoring

<sub>Also asked as: Design an async architecture for thousands of updates per hour · How do you avoid hitting async limits at scale? · Best practices for asynchronous design in a large org</sub>

## Batch Scenarios

### You need to update a field on 5 million records. How would you do it?
*Mid (3–6 yrs) · scenario* · `async-036`

I'd use Batch Apex with a QueryLocator for millions of records, because it can process up to 50 million records and each chunk gets fresh limits. I keep the query selective, filtering only records that still need the change. So if I'm filling a new Region field on 5 million Accounts, the query only picks Accounts where Region isn't set yet. If the job stops halfway, I just run it again and it picks up the rest. In execute, I do the logic in memory and one DML, using Database.update with allOrNone false, so one bad row doesn't fail the chunk. I'd run it in a full sandbox first, pick a scope size based on how heavy the triggers are, and think about bypassing non-essential automation with a custom setting. And for a pure data change with no logic, Data Loader with Bulk API is also an option. Before any run like this, I agree a run window and a rollback plan with the business.

- Batch Apex with QueryLocator
- Filter only records still needing the change
- Partial success DML and error logging
- Test in full sandbox, tune scope size

```java
public class BackfillRegionBatch implements Database.Batchable<sObject> {
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator(
            'SELECT Id, BillingCountry FROM Account WHERE Region__c = null');
    }
    public void execute(Database.BatchableContext bc, List<Account> scope) {
        for (Account a : scope) {
            a.Region__c = (a.BillingCountry == 'India') ? 'APAC' : 'Other';
        }
        Database.update(scope, false);
    }
    public void finish(Database.BatchableContext bc) {}
}
// Database.executeBatch(new BackfillRegionBatch(), 2000);
```

<sub>Also asked as: Write a batch to update millions of records · How to mass update millions of accounts in Apex? · Best way to backfill a new field on a large object · update 5 million records salesforce</sub>

### How do you write a batch that makes callouts to an external system?
*Mid (3–6 yrs) · scenario* · `async-037`

I'd size this around the callout limits first. The batch class has to implement Database.AllowsCallouts as well as Database.Batchable, otherwise callouts throw an error. Callout limits apply per execute, so each chunk can make up to 100 callouts, and the total callout time is limited too. That's why I set a small scope that matches how many callouts each record needs, or I send one bulk request per chunk if the API supports it. For example, if each record needs two callouts, the default scope of 200 would need 400 calls, so I'd drop the scope to something like 40. I use a Named Credential for the endpoint and authentication. And callouts have to happen before any DML in the same execute, so I collect all the responses first and then update the records with their sync status at the end. Callout-before-DML is a mistake I specifically check for in review.

- Implement Database.AllowsCallouts
- Up to 100 callouts per execute
- Small scope or one bulk request per chunk
- Callouts before DML; use Named Credentials

```java
public class ErpSyncBatch implements Database.Batchable<sObject>, Database.AllowsCallouts {
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator(
            'SELECT Id, Name, AccountNumber FROM Account WHERE Sync_Status__c = \'Pending\'');
    }
    public void execute(Database.BatchableContext bc, List<Account> scope) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:ERP_API/accounts');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(scope));
        HttpResponse res = new Http().send(req);
        String status = (res.getStatusCode() == 200) ? 'Synced' : 'Failed';
        for (Account a : scope) { a.Sync_Status__c = status; }
        Database.update(scope, false);
    }
    public void finish(Database.BatchableContext bc) {}
}
// Database.executeBatch(new ErpSyncBatch(), 100);
```

<sub>Also asked as: Batch apex with callouts example · What is Database.AllowsCallouts? · Sync records to an external API nightly using batch · callout limit in batch execute</sub>

### Write a batch that sums totals across all records and emails the summary at the end.
*Mid (3–6 yrs) · scenario* · `async-038`

I'd make it Stateful and keep the state tiny. I implement Database.Stateful so my counters and totals survive across execute calls. In execute, I add up the values and count successes and failures from the Database.SaveResult list. In finish, I query AsyncApexJob for the job's status and error count, then build a Messaging.SingleEmailMessage with the totals and send it to the user who started the job. For example, the email might say: total Amount processed, 4,800 records saved, 12 failed, job status Completed. I keep the stateful variables small, just numbers and maybe a capped list of error messages, because state is serialized after every chunk. And email limits apply, so one summary email in finish is the right pattern, never an email per chunk. I also agree with the business who actually needs that summary, so it doesn't end up as noise in someone's inbox.

- Database.Stateful for totals and counters
- Count results from Database.SaveResult
- Query AsyncApexJob and send one email in finish
- Keep stateful data small

```java
public class RevenueSummaryBatch implements Database.Batchable<sObject>, Database.Stateful {
    private Decimal totalAmount = 0;
    private Integer failures = 0;
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator(
            'SELECT Id, Amount FROM Opportunity WHERE CloseDate = THIS_YEAR AND IsWon = true');
    }
    public void execute(Database.BatchableContext bc, List<Opportunity> scope) {
        for (Opportunity o : scope) {
            totalAmount += (o.Amount == null ? 0 : o.Amount);
            o.Included_In_Summary__c = true;
        }
        for (Database.SaveResult sr : Database.update(scope, false)) {
            if (!sr.isSuccess()) { failures++; }
        }
    }
    public void finish(Database.BatchableContext bc) {
        AsyncApexJob job = [SELECT Status, NumberOfErrors, CreatedBy.Email
                            FROM AsyncApexJob WHERE Id = :bc.getJobId()];
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        mail.setToAddresses(new List<String>{ job.CreatedBy.Email });
        mail.setSubject('Revenue summary: ' + job.Status);
        mail.setPlainTextBody('Total won amount: ' + totalAmount + '\nFailed records: ' + failures);
        Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    }
}
```

<sub>Also asked as: Stateful batch example with email in finish · How do you send an email after batch completes? · Count success and failure in batch and send report · batch summary email</sub>

### How do you schedule a batch job to run every night?
*Fresher (0–2 yrs) · scenario* · `async-039`

I'd use a thin scheduler that starts the batch. I write a small Schedulable class whose execute method just calls Database.executeBatch with my batch class and scope size. Then I schedule it, either from Setup with the Schedule Apex button, choosing frequency and preferred start time, or from Anonymous Apex with System.schedule and a cron expression like zero zero one star star question mark for 1 AM daily. I give the job a clear name so it is easy to find in Scheduled Jobs. I keep the scheduler thin because a class with a pending scheduled job is locked for changes, and thin wrappers rarely need to change. I also keep a team list of scheduled jobs and their owners, so nothing runs nightly without someone responsible for it.

- Schedulable wrapper calls Database.executeBatch
- Schedule from Setup or with System.schedule
- Cron '0 0 1 * * ?' = 1 AM daily
- Keep the scheduler thin

```java
public class NightlyBatchScheduler implements Schedulable {
    public void execute(SchedulableContext sc) {
        Database.executeBatch(new BackfillRegionBatch(), 500);
    }
}
// Run once in Anonymous Apex:
// System.schedule('Nightly Region Backfill', '0 0 1 * * ?', new NightlyBatchScheduler());
```

<sub>Also asked as: Schedule batch apex daily at midnight · How to run a batch automatically every day? · Schedulable class that calls a batch · nightly batch job salesforce</sub>

### Your batch job fails for some records but you want the rest to succeed. What do you do?
*Mid (3–6 yrs) · scenario* · `async-040`

I'd go to partial success. I switch from the update statement to Database.update with the second parameter false, which allows partial success. Good records commit, and for each failed record I get a SaveResult with the error. The results come back in the same order as the input list, so I use the index to match each failure to its record Id, then store those in an error log object or a Stateful list to report in finish. I also add a status field on the record, like Processing Status, so a re-run only picks up the failed ones. This way one bad record, for example failing a validation rule, never blocks the other 199 in the chunk. The thing I ask in review is where those failures end up, because an error nobody reads is the same as no error handling.

- Database.update(records, false) for partial success
- SaveResults are in the same order as input
- Log failures with record Id and message
- Status field makes re-runs pick up failures

```java
public void execute(Database.BatchableContext bc, List<Contact> scope) {
    for (Contact c : scope) { c.Status__c = 'Verified'; }
    List<Database.SaveResult> results = Database.update(scope, false);
    List<Error_Log__c> logs = new List<Error_Log__c>();
    for (Integer i = 0; i < results.size(); i++) {
        if (!results[i].isSuccess()) {
            logs.add(new Error_Log__c(
                Record_Id__c = scope[i].Id,
                Message__c = results[i].getErrors()[0].getMessage()));
        }
    }
    if (!logs.isEmpty()) { insert logs; }
}
```

<sub>Also asked as: Partial success in batch apex · How to handle failed records in a batch? · Database.update with allOrNone false in batch · log errors for failed records in batch</sub>

### How do you chain one batch job after another?
*Mid (3–6 yrs) · scenario* · `async-041`

I chain from finish, because that's the only point where I know the first job is done. I start the second batch from the finish method of the first one. Finish only runs after all chunks are complete, so that guarantees the order. If the second job depends on success, I query AsyncApexJob in finish and only chain if there were no errors, or I pass a flag. For example, batch one recalculates Account totals, and batch two builds summary records from those totals. In batch one's finish, I check that NumberOfErrors is zero, and then I call Database.executeBatch on batch two. For longer pipelines, I sometimes pass a parameter into a generic batch so it knows which step to run next. If the second step is small, I can enqueue a Queueable from finish instead. And I avoid starting batches from triggers, because that can flood the queue.

- Call Database.executeBatch in finish
- Check AsyncApexJob errors before chaining
- Use a Queueable for small follow-up work
- Never launch batches from triggers

```java
public void finish(Database.BatchableContext bc) {
    AsyncApexJob job = [SELECT NumberOfErrors FROM AsyncApexJob WHERE Id = :bc.getJobId()];
    if (job.NumberOfErrors == 0) {
        Database.executeBatch(new ContactRollupBatch(), 200);
    }
}
```

<sub>Also asked as: Run batch B after batch A finishes · Batch chaining in Salesforce · Where do you call the next batch from? · sequential batch jobs</sub>

### Write a batch to delete records older than two years.
*Fresher (0–2 yrs) · scenario* · `async-042`

I'd do this with a scheduled batch. I write a batch whose start query picks records with CreatedDate older than the cutoff, using a date literal like LAST_N_YEARS or a computed Date variable. In execute, I call Database.delete with allOrNone false, so locked or protected records don't fail the whole chunk. Here's the gotcha: deleted records go to the Recycle Bin. They don't count toward storage, but they still sit in the database and slow down queries until they're purged. So I call Database.emptyRecycleBin on the same chunk. Say we're clearing out old Task records. Before deleting anything, I get the retention policy signed off by the business, and if needed I archive the data to an external store or a Big Object first. Then I schedule the batch to run monthly.

- Start query filters by CreatedDate cutoff
- Database.delete(scope, false)
- Database.emptyRecycleBin to purge immediately
- Confirm retention and archive first

```java
public class PurgeOldLogsBatch implements Database.Batchable<sObject> {
    public Database.QueryLocator start(Database.BatchableContext bc) {
        Date cutoff = Date.today().addYears(-2);
        return Database.getQueryLocator(
            [SELECT Id FROM Integration_Log__c WHERE CreatedDate < :cutoff]);
    }
    public void execute(Database.BatchableContext bc, List<Integration_Log__c> scope) {
        Database.delete(scope, false);
        Database.emptyRecycleBin(scope);
    }
    public void finish(Database.BatchableContext bc) {}
}
```

<sub>Also asked as: How do you purge old records with batch apex? · Batch to delete old cases or logs · Clean up old data automatically every month · mass delete records using apex</sub>

### You need to process 50,000+ records. Would you use Batch or Queueable?
*Mid (3–6 yrs) · comparison* · `async-043`

For 50,000 records or more, I'd go with Batch Apex, and that's the line I give the team. A single Queueable is one transaction, so it can retrieve at most 50,000 rows and process 10,000 DML rows, and everything shares one set of CPU and heap limits. Batch Apex splits the work into chunks, each with fresh limits. A QueryLocator can feed it up to 50 million records, and it's restartable and easy to monitor per chunk. For example, updating 80,000 Cases in one Queueable would hit the 10,000 DML row limit long before it finished. In a batch, that's 400 chunks of 200, each one well within limits. Queueable can be chained to process slices, but then I have to manage the cursor and the chain myself. So Queueable for smaller, more dynamic work, and Batch for large, query-driven volumes.

- Queueable is one transaction: 50,000 rows, 10,000 DML rows
- Batch chunks with fresh limits, up to 50 million records
- Chained Queueables possible but manual
- Batch for large volume, Queueable for smaller jobs

<sub>Also asked as: Batch apex vs queueable for large data · Can queueable process 100k records? · Why not use queueable for millions of records? · when should I pick batch over queueable</sub>

### A batch job that used to finish in an hour now takes all night. How do you troubleshoot it?
*Senior (7–10 yrs) · scenario* · `async-044`

I'd find out where the time goes before changing anything. First I check the Apex Jobs page and AsyncApexJob to see whether it's slow in start or in execute, and whether other batches are queuing ahead of it. A slow start usually means a non-selective query on a growing object. So I check the query plan and add a filter on an indexed field, or request a custom index. A slow execute usually comes from triggers, flows and rollups firing on every DML. So I review the automation on that object and look at debug logs for CPU hotspots. For example, someone may have added a new record-triggered flow on that object, and now it runs for every record in every chunk. I also check for row-lock retries caused by data skew, and tune the scope size. Finally, I filter out records that are already processed, so the job only works on the delta. Going forward, I'd want new automation on high-volume objects reviewed against the batches that touch them, because this kind of slowdown usually comes from an unrelated change.

- Find whether start or execute is slow
- Check query selectivity with the query plan
- Review triggers and flows fired by the DML
- Look for lock contention and data skew
- Process only the delta

<sub>Also asked as: Batch job running very slow, what do you check? · How to improve batch apex performance? · Batch job stuck in processing for hours · slow batch apex</sub>

### How do you write a test class for a batch job?
*Mid (3–6 yrs) · code* · `async-045`

I test a batch by running the whole lifecycle once and asserting the data. I create test data in a TestSetup method or in the test itself, then call Database.executeBatch between Test.startTest and Test.stopTest. When stopTest runs, the batch executes synchronously: start, one execute, and finish. Only one execute is allowed in a test, so I make sure start returns no more records than the scope size, for example 200 records with the default scope. Say my batch marks old Leads as Inactive. I insert 200 old Leads, run the batch between startTest and stopTest, then query them after stopTest and assert every one is Inactive. If the batch makes callouts, I set an HttpCalloutMock first. And I keep assertions focused on the data the batch actually changed. A batch test with no asserts doesn't pass my review, whatever the coverage says.

- executeBatch between startTest and stopTest
- Only one execute runs in tests
- Keep test records within scope size
- Assert after stopTest; mock callouts

```java
@IsTest
private class BackfillRegionBatchTest {
    @TestSetup
    static void setup() {
        List<Account> accs = new List<Account>();
        for (Integer i = 0; i < 200; i++) {
            accs.add(new Account(Name = 'Acc ' + i, BillingCountry = 'India'));
        }
        insert accs;
    }
    @IsTest
    static void setsRegion() {
        Test.startTest();
        Database.executeBatch(new BackfillRegionBatch(), 200);
        Test.stopTest();
        Assert.areEqual(200, [SELECT COUNT() FROM Account WHERE Region__c = 'APAC']);
    }
}
```

<sub>Also asked as: Test class for batch apex example · How many records should I insert to test a batch? · Why does my batch test only run one execute?</sub>

### Your batch fails with UNABLE_TO_LOCK_ROW errors. How do you fix it?
*Senior (7–10 yrs) · scenario* · `async-046`

I'd start by finding which parent records the chunks are fighting over. Row locks in batch usually happen when parallel chunks, or other processes, update records that share the same parent. For example, updating Contacts or Opportunities locks the parent Account, and if many children of one Account are spread across chunks, those chunks compete for the same lock. My fixes are: order the start query by the parent Id so children of the same parent land in the same chunk, reduce the scope size, avoid running the batch at the same time as integrations or data loads, and check for data skew where one parent has thousands of children. I also make the batch re-runnable so failed chunks can simply be picked up again. If skew is the root cause, I raise it as a data model issue with the business, because no amount of tuning fixes one Account with thousands of children.

- Parallel updates on children lock the shared parent
- ORDER BY parent Id to group children per chunk
- Reduce scope; avoid overlapping jobs
- Check for account or lookup skew

```java
public Database.QueryLocator start(Database.BatchableContext bc) {
    return Database.getQueryLocator(
        'SELECT Id, AccountId, Status__c FROM Contact ' +
        'WHERE Status__c = \'Pending\' ORDER BY AccountId');
}
```

<sub>Also asked as: Batch apex record lock errors · Row lock contention in batch updating child records · Unable to lock row while batch is running · batch updating contacts locks accounts</sub>

### You need a batch that processes data from several objects, not one query. How would you build it?
*Senior (7–10 yrs) · scenario* · `async-047`

I'd return an Iterable from start, because the records don't come from a single query. The simplest version returns a List, because List implements Iterable. For example, I might run one query on Accounts and another on a custom object, combine the results into a list of wrapper objects or Ids, and return that list. The batch class then implements Database.Batchable with that type instead of sObject. The important catch: for an Iterable, normal limits apply in start, so the total rows I query there are capped at 50,000. If the volume is bigger than that, I'd rather run separate QueryLocator batches per object and chain them from finish. That 50,000 cap is the first thing I ask about when someone proposes an Iterable batch.

- Return an Iterable from start
- Batchable<T> can use non-sObject types
- Normal limits apply in start (50,000 rows)
- For larger volumes, chain QueryLocator batches

```java
public class MultiObjectBatch implements Database.Batchable<Id> {
    public Iterable<Id> start(Database.BatchableContext bc) {
        List<Id> ids = new List<Id>();
        for (Lead l : [SELECT Id FROM Lead WHERE Needs_Review__c = true]) { ids.add(l.Id); }
        for (Contact c : [SELECT Id FROM Contact WHERE Needs_Review__c = true]) { ids.add(c.Id); }
        return ids;
    }
    public void execute(Database.BatchableContext bc, List<Id> scope) {
        // process mixed Lead and Contact Ids, e.g. create review tasks
    }
    public void finish(Database.BatchableContext bc) {}
}
```

<sub>Also asked as: Batch apex with Iterable example · Custom iterator in batch start method · Batch over a list built in Apex · process records from multiple objects in batch</sub>

### How do you make sure a scheduled batch does not start if the previous run is still running?
*Senior (7–10 yrs) · scenario* · `async-048`

I'd guard it in two places, the scheduler and the data. In the scheduler's execute method, before calling executeBatch, I query AsyncApexJob for my batch class with a status of Holding, Queued, Preparing or Processing. If one exists, I skip this run, or log it, instead of starting a second copy. I filter by ApexClass.Name and JobType BatchApex. Why it matters: say the hourly sync batch normally takes 20 minutes, but one day it takes 90. Without this check, the next run starts while the first one is still going, and two copies of the same batch can process the same records twice and cause lock errors. As an extra safety net, the batch itself only picks records with a Pending status and marks them Processed. So even an accidental double run doesn't repeat work.

- Query AsyncApexJob for active runs of the class
- Skip or log if one is active
- Status field makes the job idempotent

```java
public class SafeNightlyScheduler implements Schedulable {
    public void execute(SchedulableContext sc) {
        Integer running = [
            SELECT COUNT() FROM AsyncApexJob
            WHERE JobType = 'BatchApex'
            AND ApexClass.Name = 'ErpSyncBatch'
            AND Status IN ('Holding', 'Queued', 'Preparing', 'Processing')];
        if (running == 0) {
            Database.executeBatch(new ErpSyncBatch(), 100);
        }
    }
}
```

<sub>Also asked as: Prevent overlapping batch runs · Check if a batch is already running before starting · Two instances of the same batch running at once · avoid duplicate batch execution</sub>

### Your stateful batch fails with a heap size error near the end. What is going on?
*Senior (7–10 yrs) · scenario* · `async-049`

That's almost always state growing chunk after chunk. With Database.Stateful, instance variables are carried between chunks and serialized every time. So if I keep adding records to a list or map, the state keeps growing, and eventually it goes past the 12 MB async heap, usually late in the job. That's why it fails near the end and not at the start. Say I'm saving every processed Account into a stateful list so I can report on them in finish. It's fine at chunk 10, but by chunk 400 that list is huge. The fix is to keep only what's really needed, like counters, totals or a capped number of error messages, not whole sObjects. If I need detailed results, I write them to a custom log object inside execute instead of holding them in memory. And if the totals can be worked out later with an aggregate query, removing Stateful entirely also speeds the job up. In review, any Stateful batch that collects sObjects gets a question from me.

- Stateful variables grow and are serialized each chunk
- Async heap limit is 12 MB
- Keep counters, not record lists
- Write details to a log object in execute

<sub>Also asked as: Heap limit in stateful batch · Database.Stateful too much data · Batch with stateful map runs out of memory · apex heap size too large batch</sub>

### A user needs to start a batch job from a button on a Lightning page and see its progress. How would you build it?
*Mid (3–6 yrs) · scenario* · `async-050`

I'd build it as start-and-poll. I create an AuraEnabled Apex method that calls Database.executeBatch and returns the job Id. The LWC calls it imperatively when the user clicks the button. To show progress, a second AuraEnabled method queries AsyncApexJob by that Id and returns the status, JobItemsProcessed and TotalJobItems. The component polls it every few seconds until the status is Completed, Failed or Aborted. So the user sees something like "12 of 40 batches done" and a progress bar filling up. I also check permissions in the Apex method, for example with a custom permission, because starting a heavy batch shouldn't be available to everyone. And I can block a second run if one is already active. I'd also agree a sensible polling interval with the team, so a page left open all day isn't calling Apex nonstop.

- AuraEnabled method returns the job Id
- Poll AsyncApexJob for progress
- Protect with a custom permission
- Block duplicate runs

```java
public with sharing class BatchLauncher {
    @AuraEnabled
    public static Id startSync() {
        if (!FeatureManagement.checkPermission('Run_ERP_Sync')) {
            throw new AuraHandledException('You are not allowed to run this job.');
        }
        return Database.executeBatch(new ErpSyncBatch(), 100);
    }
    @AuraEnabled
    public static AsyncApexJob getStatus(Id jobId) {
        return [SELECT Status, JobItemsProcessed, TotalJobItems, NumberOfErrors
                FROM AsyncApexJob WHERE Id = :jobId];
    }
}
```

<sub>Also asked as: How do you start a batch job from a button in an LWC? · Run batch apex from lightning web component · Call Database.executeBatch from a controller · Show batch progress in LWC · user clicks button to start batch</sub>

## SOQL and Data

### What is the difference between SOQL and SOSL?
*Fresher (0–2 yrs) · comparison* · `soql-001`

I use SOQL when I know where the data lives, and SOSL when I'm searching for text. SOQL queries one object at a time, plus its related objects, with precise filters, like a SQL SELECT. I use it when I know which object the data is in, for example all open Opportunities for an Account. SOSL is a text search across multiple objects at once using the search index, like a global search. I use it when I have a search term and do not know which object or field it is in, for example searching a name across Accounts, Contacts and Leads. SOQL returns a list of records; SOSL returns a list of lists, one per object. SOSL has a limit of 20 searches per transaction and returns at most 2,000 results. In review, the thing I watch for is SOSL being used where a filtered SOQL would be more precise.

- SOQL: one object and related objects, exact filters
- SOSL: text search across many objects
- SOQL returns List<sObject>, SOSL returns List<List<sObject>>
- 20 SOSL per transaction, max 2,000 results

```java
// SOQL
List<Contact> cons = [SELECT Id, Name FROM Contact WHERE AccountId = :accId];

// SOSL
List<List<SObject>> found = [FIND :searchTerm IN NAME FIELDS
    RETURNING Account(Id, Name), Contact(Id, Name), Lead(Id, Name)];
List<Account> accs = (List<Account>) found[0];
```

<sub>Also asked as: SOQL vs SOSL, when to use which? · When would you use SOSL instead of SOQL? · Explain sosl with an example · difference between so ql and sosl</sub>

### How do you write a parent-to-child relationship query?
*Fresher (0–2 yrs) · code* · `soql-002`

I'd use a subquery, so I get parents and children in one go. A parent-to-child query uses a nested SELECT inside the field list. Inside it, I use the child relationship name, which is plural, like Contacts for standard objects, or the name ending in __r for custom ones, like Invoices__r. Each parent record then comes back with a list of its children that I can loop over. For example, SELECT Name, (SELECT LastName FROM Contacts) FROM Account gives me each Account with its Contacts attached. That saves queries, because I get parents and children in one SOQL instead of querying in a loop. If you're not sure of the child relationship name, it's shown on the lookup field definition. And the subquery can have its own WHERE, ORDER BY and LIMIT. Querying children in a loop is something I always flag in code review.

- Nested SELECT using the child relationship name
- Standard: plural name like Contacts; custom: __r
- One query instead of queries in a loop
- Subquery supports WHERE, ORDER BY, LIMIT

```java
List<Account> accs = [
    SELECT Id, Name,
        (SELECT Id, LastName, Email FROM Contacts WHERE Email != null ORDER BY LastName),
        (SELECT Id, Amount__c FROM Invoices__r)
    FROM Account
    WHERE Industry = 'Banking'
];
for (Account a : accs) {
    for (Contact c : a.Contacts) {
        System.debug(a.Name + ' - ' + c.LastName);
    }
}
```

<sub>Also asked as: Query accounts with their contacts in one SOQL · What is a subquery in SOQL? · How to get child records using inner query? · parent to child soql</sub>

### How do you query parent fields from a child record?
*Fresher (0–2 yrs) · code* · `soql-003`

I use dot notation from the child to reach the parent's fields. with the relationship name to reach the parent's fields. For a standard lookup like Contact to Account, it's Account.Name. For a custom lookup, I replace __c with __r, so Project__c becomes Project__r.Name. I can go up to five levels, like Contact.Account.Owner.Name. So if I'm showing a list of Contacts with their company name and the account owner's name, that's one query with no extra lookups. The gotcha is when the lookup is empty. Then the parent reference is null, so in Apex I check for null before reading its fields. Otherwise a Contact with no Account will throw a null pointer exception. That missing null check is one of the most common bugs I catch in review.

- Dot notation: Account.Name
- Custom lookups: __c becomes __r
- Up to five levels upward
- Null-check the parent in Apex

```java
List<Contact> cons = [
    SELECT Id, LastName, Account.Name, Account.Owner.Name, Project__r.Name
    FROM Contact
    WHERE Account.Industry = 'Retail'
];
for (Contact c : cons) {
    String accName = (c.Account != null) ? c.Account.Name : 'No account';
}
```

<sub>Also asked as: Child to parent relationship query · What is dot notation in SOQL? · Get account name from contact query · how many levels can you go up in soql</sub>

### How do you write an aggregate query in SOQL?
*Fresher (0–2 yrs) · code* · `soql-004`

When I need totals, I let the database do the maths instead of looping in Apex. Aggregate queries use functions like COUNT, SUM, AVG, MIN and MAX, usually with GROUP BY. In Apex they return a list of AggregateResult, and I read the values with get, using the field name for grouped fields and an alias for the calculated values. For example, I can sum Opportunity Amount by StageName in one query instead of looping over thousands of records. One thing to remember: aggregate functions other than COUNT still count each aggregated row toward the 50,000 query rows limit. So on large objects I still keep the WHERE clause tight, and I remind the team that an aggregate isn't free.

- COUNT, SUM, AVG, MIN, MAX with GROUP BY
- Returns List<AggregateResult>
- Use aliases and ar.get('alias')
- Aggregated rows still count toward query row limits

```java
List<AggregateResult> results = [
    SELECT StageName, COUNT(Id) total, SUM(Amount) amount
    FROM Opportunity
    WHERE CloseDate = THIS_YEAR
    GROUP BY StageName
];
for (AggregateResult ar : results) {
    String stage = (String) ar.get('StageName');
    Integer cnt = (Integer) ar.get('total');
    Decimal amt = (Decimal) ar.get('amount');
}
```

<sub>Also asked as: SOQL GROUP BY example · What is AggregateResult in Apex? · Count records per account using SOQL · sum of opportunity amount by stage</sub>

### What is the HAVING clause and how is it different from WHERE?
*Mid (3–6 yrs) · code* · `soql-005`

Simply put, WHERE filters individual rows before they are grouped, while HAVING filters the groups after aggregation. So if I want accounts that have more than five contacts, I group contacts by AccountId and use HAVING COUNT(Id) greater than 5. I cannot put an aggregate function in a WHERE clause, that is exactly what HAVING is for. I can still use WHERE in the same query to narrow the rows first, which also helps performance. HAVING can only be used together with GROUP BY. My guidance to the team is to filter as much as possible in WHERE first, and keep HAVING for conditions on the totals.

- WHERE filters rows before grouping
- HAVING filters groups after aggregation
- Aggregate functions are not allowed in WHERE
- HAVING requires GROUP BY

```java
List<AggregateResult> bigAccounts = [
    SELECT AccountId, COUNT(Id) contactCount
    FROM Contact
    WHERE AccountId != null
    GROUP BY AccountId
    HAVING COUNT(Id) > 5
];
```

<sub>Also asked as: SOQL HAVING example · Find accounts with more than 5 contacts · WHERE vs HAVING in SOQL · filter on count in soql</sub>

### How do you prevent SOQL injection in dynamic SOQL?
*Mid (3–6 yrs) · code* · `soql-006`

My rule is simple: user input never goes into a query string unbound. SOQL injection happens when user input is glued straight into a dynamic query string, so a crafted value can change the query logic and expose data. Say a search box builds the WHERE clause by adding whatever the user typed inside quotes. If they type a quote followed by an OR condition, they can pull back records they shouldn't see. The best defence is bind variables. In Database.query I reference a local variable with a colon, and the value is treated as data, never as query syntax. Where I can't bind, like a field name or sort direction, I check against an allowlist, for example confirming the field exists in the object's describe. String.escapeSingleQuotes is a fallback for string values. And I run the query in user mode so it respects the user's access. Any string concatenation in dynamic SOQL gets flagged in review, and I'd have a static code scan check for it too.

- Never concatenate raw user input
- Use bind variables in Database.query
- Allowlist field names and sort order
- escapeSingleQuotes as a fallback

```java
public static List<Account> search(String nameInput, String sortField) {
    Set<String> allowedSort = new Set<String>{ 'Name', 'CreatedDate' };
    if (!allowedSort.contains(sortField)) { sortField = 'Name'; }
    String nameFilter = '%' + nameInput + '%';
    String q = 'SELECT Id, Name FROM Account WHERE Name LIKE :nameFilter ' +
               'ORDER BY ' + sortField + ' LIMIT 50';
    return Database.query(q, AccessLevel.USER_MODE);
}
```

<sub>Also asked as: What is SOQL injection? · How to use String.escapeSingleQuotes? · Safe way to build a dynamic query from user input · dynamic soql security</sub>

### What is Database.queryWithBinds?
*Mid (3–6 yrs) · code* · `soql-007`

It's my preferred way to run dynamic SOQL in a shared selector layer. Database.queryWithBinds runs a dynamic SOQL string where the bind values come from a Map of String to Object, instead of local variables. That's useful when the query is built in one method and run in another, like in a query builder or selector class, because normal bind variables have to be in scope where Database.query is called. The map keys match the names after the colon in the query. For example, the query says WHERE Industry = :industry, and I pass a map with the key "industry" set to "Banking". The third parameter is an AccessLevel, and I usually pass USER_MODE. It keeps the safety of bind variables, so it's a clean way to avoid injection.

- Binds supplied as Map<String, Object>
- Keys match the :names in the query
- Useful in selector or query builder classes
- Third parameter is AccessLevel

```java
String q = 'SELECT Id, Name FROM Account WHERE Industry = :industry AND AnnualRevenue > :minRevenue';
Map<String, Object> binds = new Map<String, Object>{
    'industry' => 'Banking',
    'minRevenue' => 1000000
};
List<Account> accs = Database.queryWithBinds(q, binds, AccessLevel.USER_MODE);
```

<sub>Also asked as: How do you pass bind variables as a map in dynamic SOQL? · Dynamic SOQL with a bind map · Bind variables that are not in local scope</sub>

### How do you use bind variables in SOQL?
*Fresher (0–2 yrs) · code* · `soql-008`

Bind variables are the default on my teams for any value in a query. A bind variable lets me use an Apex variable inside a SOQL query by putting a colon before its name. It works in static SOQL in square brackets and in dynamic SOQL with Database.query, as long as the variable is in scope. The most common use is binding a Set or List of Ids with IN, which is the core of bulkified code. Say a trigger fires on 200 Opportunities. I loop once to collect their AccountIds into a Set, then run one query, WHERE Id IN :accountIds, outside the loop. One query instead of 200. Bind variables are also safe from injection, because the value is never treated as query syntax. And I can bind expressions too, like a method call or Date math.

- Prefix the Apex variable with a colon
- IN :idSet is the core of bulkification
- Safe from SOQL injection
- Works in static and dynamic SOQL

```java
Set<Id> accountIds = new Set<Id>();
for (Contact c : Trigger.new) {
    if (c.AccountId != null) { accountIds.add(c.AccountId); }
}
Date since = Date.today().addDays(-30);
List<Account> accs = [
    SELECT Id, Name FROM Account
    WHERE Id IN :accountIds AND CreatedDate >= :since
];
```

<sub>Also asked as: What is a colon variable in SOQL? · Use an Apex variable inside a SOQL query · Query records where Id is in a set · bind variable soql example</sub>

### What is a selective query and which fields are indexed?
*Mid (3–6 yrs) · concept* · `soql-009`

Selectivity is what keeps queries working as data grows. A selective query is one where the WHERE clause filters on an indexed field and narrows the results enough that Salesforce can use the index instead of scanning the whole table. Fields indexed by default include Id, Name, OwnerId, CreatedDate, SystemModstamp, RecordTypeId, lookup and master-detail fields, and fields marked External Id or Unique. For other fields, Salesforce Support can create a custom index. Selectivity matters most on large objects. In triggers, a non-selective query on an object with more than about 200,000 records can throw a non-selective query error. For example, a trigger filtering Cases on an unindexed custom text field might work fine in a small sandbox, then fail in production once there are a million Cases. Filters like not equals, leading wildcards, or comparing with null often stop the index from being used. That's why I ask for trigger queries to be checked against production-sized data, not just a small sandbox.

- Filter on an indexed field that narrows results
- Default indexes: Id, Name, OwnerId, CreatedDate, SystemModstamp, RecordTypeId, lookups, External Id, Unique
- Custom indexes via Salesforce Support
- Avoid !=, leading %, null filters on big objects

<sub>Also asked as: What makes a SOQL query selective? · Which fields are indexed by default in Salesforce? · How do indexes work in Salesforce? · non selective query error</sub>

### What are the selectivity thresholds for standard and custom indexes?
*Senior (7–10 yrs) · concept* · `soql-010`

These numbers decide whether your index helps at all. The query optimizer only uses an index if the filter returns a small enough share of the object's records. For a standard index, the threshold is 30 percent of the first million records and 15 percent of records beyond that, up to a maximum of one million. For a custom index, it's 10 percent of the first million and 5 percent beyond that, up to 333,333 records. So say an object has 500,000 records. A filter on a standard indexed field has to return under 150,000 rows, and on a custom indexed field under 50,000. If it's expected to return more, the optimizer does a full table scan. With AND conditions, the combined filter can be selective even if each field alone isn't. With OR, every condition has to be indexed and selective. And records in the Recycle Bin count too. When a stakeholder asks why a filter is slow, this is the threshold I walk them through.

- Standard index: 30% of first 1M, 15% after, max 1M
- Custom index: 10% of first 1M, 5% after, max 333,333
- Above threshold means full table scan
- OR needs every condition indexed

<sub>Also asked as: When does the optimizer use an index in Salesforce? · Selectivity threshold percentages · How does the query optimizer decide between index and table scan?</sub>

### What is the Query Plan tool and how do you use it?
*Mid (3–6 yrs) · concept* · `soql-011`

The Query Plan tool is my first stop for any slow query. It lives in the Developer Console and shows how Salesforce would run a SOQL query. To turn it on, I go to Help, Preferences, and switch on Enable Query Plan. Then a Query Plan button shows up in the Query Editor. It lists the possible plans with the leading operation type, like Index, TableScan or Sharing, the fields used, the estimated cardinality, and a relative cost. A cost below 1 means the plan is selective. Say a list view on Cases is slow. I paste its query in, click Query Plan, and see that the best plan is a TableScan with a cost above 1. That tells me to rewrite the filter to use indexed fields, add a more selective condition, or ask Support for a custom index. I'd like the team to run it on new queries against large objects before they reach review.

- Enable in Developer Console preferences
- Shows leading operation: Index, TableScan, Sharing
- Cost below 1 means selective
- Use it to tune slow or non-selective queries

<sub>Also asked as: How do you check if a query is using an index? · Explain the developer console query plan · What does query plan cost mean? · query plan tool salesforce</sub>

### What are skinny tables?
*Senior (7–10 yrs) · concept* · `soql-012`

Skinny tables are a late-stage option, not a first fix. A skinny table is a special table that Salesforce Support creates for a large object, holding a subset of the fields people use most. Normally Salesforce joins standard and custom field storage behind the scenes. A skinny table avoids those joins, and it leaves out soft-deleted rows, so reports, list views and queries on those fields run faster. It's kept in sync automatically. Say an Opportunity object has 20 million records and the pipeline report always uses the same eight fields. A skinny table with those eight fields is exactly the use case. The limitations: it's enabled only through Support, it can't include fields from other objects, and if you need new fields in it, you contact Support again. I only look at it after indexing and query tuning, for objects with millions of records where reporting is slow.

- Created by Salesforce Support for large objects
- Subset of fields, avoids internal joins
- Excludes soft-deleted rows; auto-synced
- No fields from other objects; changes need Support

<sub>Also asked as: Explain skinny tables in Salesforce · How to speed up reports on a huge object? · When should you request a skinny table?</sub>

### How do you handle large data volumes in Salesforce?
*Senior (7–10 yrs) · design* · `soql-013`

I handle large data volumes in layers, and I plan for them before go-live rather than after. First, data model and queries: selective filters on indexed fields, custom indexes from Support, and skinny tables for heavy reporting objects. Second, store less: archive old data to an external store or Big Objects, and purge logs on a schedule. Third, avoid data skew, so keep the number of children per parent and records per owner reasonable. Fourth, loading: use Bulk API, defer sharing calculations during big loads, and temporarily turn off non-essential automation. Fifth, sharing: a simpler role hierarchy and public read where possible keep the sharing tables smaller. For example, if the Case object holds years of closed Cases that nobody opens anymore, I'd archive the old ones to a Big Object and keep only recent ones live. Finally, I monitor with the query plan and test with realistic volumes in a full sandbox. The archive rules need business sign-off, so I bring that conversation in early.

- Selective queries, custom indexes, skinny tables
- Archive with Big Objects or external storage
- Avoid account, ownership and lookup skew
- Bulk API and deferred sharing for loads
- Test with realistic volumes

<sub>Also asked as: What are LDV best practices? · Org has hundreds of millions of records, how to keep it fast? · Large data volume strategy · ldv considerations salesforce</sub>

### What is data skew and what are its types?
*Senior (7–10 yrs) · concept* · `soql-014`

Data skew is a design risk I look for early. It's when too many records are tied to one parent or one owner, roughly more than 10,000. There are three types. Account data skew is one Account with a huge number of child records, like Contacts or Opportunities. Updating children locks the parent, so you get record lock errors, and sharing recalculation gets slow. A classic case is a catch-all Account, something like "Unassigned", with 50,000 Contacts parked on it. Ownership skew is when one user owns a very large number of records of an object, often an integration user. Changing that user's role or the sharing model triggers heavy sharing recalculation. Lookup skew is when a very large number of records look up to the same record, which causes lock contention on inserts and updates. The fix in each case is to spread the children or ownership across more parents or users. I'd rather catch it in the data model review than in a production lock error.

- Roughly more than 10,000 records on one parent or owner
- Account skew: lock errors, slow sharing
- Ownership skew: sharing recalculation pain
- Lookup skew: lock contention on one lookup target

<sub>Also asked as: Explain account data skew · What is ownership skew and lookup skew? · Why are too many child records under one parent a problem? · data skew in salesforce</sub>

### An integration user owns two million records and changing its role takes hours. How do you fix it?
*Senior (7–10 yrs) · scenario* · `soql-015`

This is ownership skew, and I'd fix the design, not just the timing. When a user who owns millions of records moves in the role hierarchy, Salesforce has to recalculate sharing for all of them, and that's why it takes hours. If the integration user really has to own the records, I put it in a role at the top of the hierarchy, or give it no role at all, so its records don't roll up to a lot of managers. And I never change that user's role during business hours. Better still, I spread ownership across real users or queues based on business rules. For example, records coming in through the integration get assigned by territory or region, instead of all staying with the integration user. Also, if the object's sharing is Public Read/Write, most of the sharing cost goes away, so I check whether a private model is really needed. That's a trade-off I'd take to the business, because opening up sharing is a security decision, not just a performance one.

- Ownership skew drives heavy sharing recalculation
- Keep the owner with no role or a top-level isolated role
- Distribute ownership across users or queues
- Review whether a private sharing model is needed

<sub>Also asked as: Ownership skew problem with integration user · Sharing recalculation is very slow for one user · One user owns too many records, best practice · integration user owns all records</sub>

### What does FOR UPDATE do in SOQL?
*Mid (3–6 yrs) · code* · `soql-016`

I use FOR UPDATE when two users could change the same value at once. Adding FOR UPDATE to a SOQL query locks the returned records for the rest of the transaction. No other transaction can update them until mine commits or rolls back. Others wait, and if the lock isn't released within about ten seconds, they get an UNABLE_TO_LOCK_ROW error. I use it for things like counters, invoice number generation or inventory. Say two users place orders at the same moment for the last 5 units of a product. Without a lock, both read 5, both subtract, and the stock ends up wrong. With FOR UPDATE, the second one waits until the first finishes, then reads the real value. One rule: you can't use ORDER BY with FOR UPDATE. And I keep locked transactions short and only lock the records I really need. In review, I check that nothing slow or heavy runs while the lock is held.

- Locks returned rows until the transaction ends
- Prevents lost updates in race conditions
- Other transactions wait, then may get UNABLE_TO_LOCK_ROW
- Cannot combine with ORDER BY

```java
Inventory__c inv = [
    SELECT Id, Quantity__c FROM Inventory__c
    WHERE Product__c = :productId
    LIMIT 1
    FOR UPDATE
];
inv.Quantity__c -= orderedQty;
update inv;
```

<sub>Also asked as: How do you lock records in Apex? · Explain record locking with SOQL · Prevent two users updating the same record at the same time · for update keyword soql</sub>

### Users get UNABLE_TO_LOCK_ROW errors during a data load. How do you troubleshoot it?
*Senior (7–10 yrs) · scenario* · `soql-017`

I'd treat it as a load-design problem first, not a code problem. UNABLE_TO_LOCK_ROW means a transaction waited too long for a record that another one had locked. During loads, the usual cause is parallel batches updating children of the same parent, because inserting or updating a child locks its parent, or a rollup summary updating the same parent. Say I'm loading Opportunities and a few big Accounts have thousands each. If those rows are spread across parallel batches, they all fight over the same Account. So my steps are: sort the load file by the parent Id so one parent's children land in the same batch, switch the Bulk API job to serial mode if needed, reduce batch size, and check for data skew. I also look for triggers or flows that update one common record, like a single settings record, and I schedule loads outside integration and batch windows. In code, a short retry can help for transient locks. I make the sorted-by-parent rule part of the team's load checklist, so it doesn't depend on who runs the load.

- Parallel batches lock the same parent
- Sort by parent Id; use serial mode or smaller batches
- Check rollups, triggers and data skew
- Avoid overlapping jobs; retry transient failures

<sub>Also asked as: Unable to lock row error, what causes it? · Record currently unavailable error in Salesforce · How to fix lock errors when loading child records? · unable to lock row fix</sub>

### What is the query rows limit and how do you avoid 'Too many query rows: 50001'?
*Fresher (0–2 yrs) · concept* · `soql-018`

The fix is to fetch less, or move the work to batch. In one transaction, all SOQL queries together can retrieve at most 50,000 records, sync or async. Go over that and you get Too many query rows 50001. To avoid it, I tighten filters so I only fetch what I need, use LIMIT where it makes sense, and use aggregate queries like COUNT instead of fetching rows just to count them. For example, if a page only needs to show how many open Cases an Account has, I run a COUNT query instead of pulling back every Case record. If I really do need to process more than 50,000 records, I move the work into Batch Apex with a QueryLocator, which can handle up to 50 million. I also check that a query in a trigger isn't accidentally pulling a whole table, which is exactly the kind of thing I look for in review.

- 50,000 rows total per transaction
- Tighter filters and LIMIT
- Use COUNT() instead of fetching rows to count
- Batch Apex for larger volumes

<sub>Also asked as: Too many query rows 50001 error fix · How many records can SOQL return in Apex? · Query rows governor limit · fifty thousand rows limit</sub>

### How do you fix 'Too many SOQL queries: 101'?
*Fresher (0–2 yrs) · troubleshooting* · `soql-019`

Nine times out of ten it's a query inside a loop, and bulkifying fixes it. This error means the transaction ran more than 100 SOQL queries in synchronous context. Almost always it is a query inside a loop, for example querying the Account for every Contact in a trigger, which fails as soon as 101 records come in. The fix is to bulkify: collect the Ids in a Set first, run one query outside the loop with IN, store the results in a Map by Id, and then look up from the map inside the loop. I also check for recursion, where a trigger fires again and repeats queries, and for multiple automations on the same object adding queries. That last one is why I push for one trigger per object, so the team can see every query that fires.

- Usually a SOQL query inside a loop
- Collect Ids, query once with IN, use a Map
- Check trigger recursion and other automation
- Limit is 100 sync, 200 async

```java
// Bulkified: one query for all records
Set<Id> accIds = new Set<Id>();
for (Contact c : Trigger.new) { accIds.add(c.AccountId); }
Map<Id, Account> accMap = new Map<Id, Account>(
    [SELECT Id, Industry FROM Account WHERE Id IN :accIds]);
for (Contact c : Trigger.new) {
    Account a = accMap.get(c.AccountId);
    if (a != null && a.Industry == 'Banking') { c.Segment__c = 'Finance'; }
}
```

<sub>Also asked as: SOQL inside a for loop problem · System.LimitException too many SOQL queries · How to bulkify a query in a trigger? · 101 soql error</sub>

### What is the difference between Database.getQueryLocator and Database.query?
*Mid (3–6 yrs) · comparison* · `soql-020`

The difference is a loaded list versus a cursor. Database.query runs a dynamic SOQL string right away and returns a list of records, so it's bound by the normal 50,000 query rows limit. Database.getQueryLocator returns a QueryLocator, which is a cursor-like object over the result set, not a loaded list. In Batch Apex start, returning a QueryLocator lets the batch go through up to 50 million records, because records are fetched chunk by chunk. So if a batch has to process 3 million Contacts, start returns Database.getQueryLocator with the query. If I tried to load them with Database.query, it would fail at 50,001 rows. QueryLocators are also used with StandardSetController for pagination in Visualforce. So in normal code I use Database.query or static SOQL, and in batch start I use getQueryLocator.

- Database.query: returns a list now, 50,000 row limit
- getQueryLocator: cursor over results
- Batch start: up to 50 million records
- Also used with StandardSetController

<sub>Also asked as: When to use getQueryLocator vs a normal query? · Why does batch use a QueryLocator? · Database.query vs Database.getQueryLocator</sub>

### What are semi-joins and anti-joins in SOQL?
*Mid (3–6 yrs) · code* · `soql-021`

Semi-joins and anti-joins let me filter on related records without writing loops. A semi-join is a WHERE condition with IN and a subquery, used to return records that have related records matching some criteria, for example Accounts that have at least one closed won Opportunity. An anti-join uses NOT IN with a subquery to return records that do not have such related records, for example Accounts with no Contacts. The subquery must select a single Id or lookup field, and there are restrictions, like not using them inside OR conditions and a limited number per query. They are efficient because the filtering happens in the database, not in Apex loops. When I see code querying children and checking for empty lists, I suggest one of these instead.

- Semi-join: WHERE Id IN (subquery)
- Anti-join: WHERE Id NOT IN (subquery)
- Subquery selects one Id or lookup field
- Filtering happens in the database

```java
// Semi-join: accounts with a closed won opportunity
List<Account> buyers = [
    SELECT Id, Name FROM Account
    WHERE Id IN (SELECT AccountId FROM Opportunity WHERE StageName = 'Closed Won')
];

// Anti-join: accounts with no contacts
List<Account> noContacts = [
    SELECT Id, Name FROM Account
    WHERE Id NOT IN (SELECT AccountId FROM Contact WHERE AccountId != null)
];
```

<sub>Also asked as: SOQL IN with a subquery · Find accounts that have closed won opportunities in one query · What is NOT IN subquery in SOQL? · semi join anti join soql</sub>

### How do you query polymorphic fields using TYPEOF?
*Senior (7–10 yrs) · code* · `soql-022`

TYPEOF is the clean way to handle polymorphic fields in one query. A polymorphic field can point to records of different object types. Examples are WhatId and WhoId on Task and Event, or OwnerId, which can be a User or a Queue. TYPEOF lets me pick which fields to return depending on the actual type of the related record, with a WHEN branch per object and an optional ELSE. Say I'm building an activity timeline from Tasks. If the Task's What is an Account, I want its Phone. If it's an Opportunity, I want Amount and StageName. TYPEOF What WHEN Account THEN Phone WHEN Opportunity THEN Amount, StageName END gets both in one query. In Apex, I then check the type with instanceof before casting. Without TYPEOF, I can only get the common Name fields, or I filter on What.Type.

- Polymorphic: WhatId, WhoId, OwnerId
- TYPEOF ... WHEN ... THEN ... ELSE ... END
- Check with instanceof before casting
- Filter by What.Type as an alternative

```java
List<Task> tasks = [
    SELECT Id, Subject,
        TYPEOF What
            WHEN Account THEN Name, Industry
            WHEN Opportunity THEN Name, StageName, Amount
            ELSE Name
        END
    FROM Task
    WHERE CreatedDate = LAST_N_DAYS:7
];
for (Task t : tasks) {
    if (t.What instanceof Opportunity) {
        Opportunity o = (Opportunity) t.What;
        System.debug(o.StageName);
    }
}
```

<sub>Also asked as: What is a polymorphic relationship in Salesforce? · Query WhatId fields on Task with TYPEOF · How to get different fields based on the related object type? · type of soql</sub>

### What is the difference between WITH SECURITY_ENFORCED and WITH USER_MODE?
*Mid (3–6 yrs) · comparison* · `soql-023`

I'd go with WITH USER_MODE. Both make a SOQL query respect the running user's permissions, because Apex runs in system mode by default. WITH SECURITY_ENFORCED checks object and field access only for fields in the SELECT and FROM clauses. It throws an exception on the first inaccessible field, and it has gaps, like not supporting traversal of polymorphic fields. WITH USER_MODE is newer, and it's what Salesforce now recommends. It enforces object permissions, field-level security and sharing rules, checks fields in WHERE and ORDER BY too, and can report all inaccessible fields at once. For example, if a user can't see a Salary field and the query only uses it in the WHERE clause, SECURITY_ENFORCED won't check it, but USER_MODE will. WITH USER_MODE is the standard I set for new code, and older SECURITY_ENFORCED queries get moved over when we touch them. And you can't combine both clauses in one query.

- Apex runs in system mode by default
- SECURITY_ENFORCED: SELECT/FROM only, fails on first field
- USER_MODE: CRUD, FLS and sharing, all clauses
- Salesforce recommends USER_MODE

```java
// Recommended
List<Account> accs = [
    SELECT Id, Name, AnnualRevenue FROM Account
    WHERE Industry = 'Banking'
    WITH USER_MODE
];

// Older approach
List<Account> older = [
    SELECT Id, Name FROM Account WITH SECURITY_ENFORCED
];
```

<sub>Also asked as: How do you enforce field level security in SOQL? · Which is better, security enforced or user mode? · Explain USER_MODE in SOQL · FLS in apex queries</sub>

### How do you enforce security on DML and dynamic queries?
*Mid (3–6 yrs) · code* · `soql-024`

My default is user mode everywhere a user's data is involved. For DML, the Database methods accept an AccessLevel parameter. So Database.insert with AccessLevel.USER_MODE checks the user's object and field permissions and sharing before saving. The same works for Database.query and Database.queryWithBinds. For inline DML there's the as user keyword, like insert as user. Sometimes I'd rather quietly drop the fields a user can't see than throw an error. For example, say an LWC lists Contacts, and some users don't have access to a sensitive custom field. Before returning the data, I run Security.stripInaccessible, which gives me copies of the records without the inaccessible fields, so the component still loads for everyone. And classes should be declared with sharing, so record-level sharing applies. A class without an explicit sharing keyword doesn't get through my review.

- Database methods take AccessLevel.USER_MODE
- Inline DML: insert as user
- Security.stripInaccessible removes inaccessible fields
- Use with sharing for record access

```java
// DML in user mode
Database.insert(newContacts, true, AccessLevel.USER_MODE);

// Inline syntax
update as user accountsToUpdate;

// Strip fields the user cannot read
SObjectAccessDecision decision = Security.stripInaccessible(
    AccessType.READABLE, [SELECT Id, Name, AnnualRevenue FROM Account LIMIT 50]);
List<Account> safeAccounts = (List<Account>) decision.getRecords();
```

<sub>Also asked as: What is AccessLevel.USER_MODE? · How to use Security.stripInaccessible? · Insert records in user mode in Apex · enforce crud and fls on dml</sub>

### What is the Bulk API and when do you use it?
*Mid (3–6 yrs) · concept* · `soql-025`

Bulk API is my choice once volume goes past a few thousand records. It's built for loading or extracting large numbers of records asynchronously. Instead of sending records one request at a time, you submit a job with CSV data, and Salesforce processes it in batches in the background. Bulk API 2.0 is the simpler version. You create a job, upload the data, and Salesforce handles the batching for you. I use it for anything beyond a few thousand records, like migrations or nightly loads, and Data Loader can use it with a setting. Say a nightly job pushes 300,000 price updates from an ERP. That's one Bulk API job, not 300,000 separate calls. With Bulk API 1.0, you can choose serial mode instead of parallel to avoid record lock errors, at the cost of speed. For small, real-time updates, REST or the Composite API is a better fit. Agreeing that split with the integration team early saves a lot of rework.

- Asynchronous, job-based, CSV data
- Bulk API 2.0 handles batching automatically
- Use for migrations and large loads
- Serial mode in Bulk API 1.0 reduces lock errors

<sub>Also asked as: Bulk API vs REST API for data loads · What is Bulk API 2.0? · How to load millions of records into Salesforce? · serial vs parallel mode bulk api</sub>

### What is the difference between Data Loader and Data Import Wizard?
*Fresher (0–2 yrs) · comparison* · `soql-026`

It comes down to who's loading and how much. The Data Import Wizard is a browser-based tool in Setup for simple imports of up to 50,000 records at a time. It supports Accounts, Contacts, Leads, Solutions, Campaign Members and custom objects. It has built-in duplicate matching, but it only does insert and update. Data Loader is a client application that handles all objects and up to millions of records. It supports insert, update, upsert, delete, hard delete and export, can use the Bulk API, and can run from the command line for scheduled jobs. For example, if a marketing manager wants to upload 3,000 Leads from an event spreadsheet, I point them to the Wizard. If I need to delete 400,000 old records, or export data every night, that's Data Loader.

- Wizard: browser, up to 50,000 records, limited objects
- Wizard: insert/update with duplicate matching
- Data Loader: all objects, millions of records
- Data Loader: upsert, delete, export, CLI automation

<sub>Also asked as: When to use data loader vs import wizard? · Which tool to import 100,000 records? · Can Data Import Wizard delete records? · data loader versus data import wizard</sub>

### What is an External ID and how does upsert work?
*Fresher (0–2 yrs) · code* · `soql-027`

Every integrated object on my teams gets an External ID, because it's what makes upsert safe. An External ID is a custom field marked as an external identifier, holding the record's Id from another system, like an ERP. It's indexed automatically. Upsert uses a key field to decide, per record, whether to insert or update. If a record with that External ID value exists, it's updated. If not, a new one is created. If more than one matches, that record fails. Say the ERP sends customer C-1001 every night. The first night it gets created in Salesforce. Every night after that, the same record just gets updated, with no duplicates, and I never need to know its Salesforce Id. That's what makes integrations and repeat loads safe. In Apex I use Database.upsert with the field token, and in Data Loader I pick the External ID field as the match key.

- Custom field holding the other system's key
- Indexed automatically
- Upsert: match then update, else insert
- Multiple matches cause an error

```java
List<Account> fromErp = new List<Account>{
    new Account(Name = 'Acme', ERP_Id__c = 'ERP-1001'),
    new Account(Name = 'Globex', ERP_Id__c = 'ERP-1002')
};
List<Database.UpsertResult> results = Database.upsert(fromErp, Account.ERP_Id__c, false);
for (Database.UpsertResult r : results) {
    System.debug(r.isCreated() ? 'Inserted ' + r.getId() : 'Updated ' + r.getId());
}
```

<sub>Also asked as: Explain upsert in Salesforce · Why do we use external Id fields? · How to avoid duplicates when loading data from another system? · upsert using external id apex</sub>

### You receive Contacts from an ERP that only know the parent's ERP Id. How do you link them to Accounts?
*Mid (3–6 yrs) · scenario* · `soql-028`

I'd link them through the External ID, so I do not need to query Account Ids first. In Apex, I can set the relationship field with an Account instance that only has the External ID populated, and Salesforce resolves the parent during DML. So contact.Account is set to new Account with ERP_Id__c equal to the value from the ERP. In Data Loader I map the column to the Account relationship using its External ID field, and in a Bulk API CSV the header is Account dot ERP_Id__c. This saves a query, keeps the integration simple, and fails clearly if the parent does not exist. I make sure those failures land in an error log the integration team actually checks.

- Set the relationship with a parent reference holding only the External ID
- Salesforce resolves the parent during DML
- Data Loader: map to the relationship using the External ID
- No extra query for parent Ids

```java
List<Contact> cons = new List<Contact>();
for (ErpContact ec : erpContacts) {
    Contact c = new Contact(
        LastName = ec.lastName,
        ERP_Contact_Id__c = ec.contactId);
    c.Account = new Account(ERP_Id__c = ec.accountErpId);
    cons.add(c);
}
Database.upsert(cons, Contact.ERP_Contact_Id__c, false);
```

<sub>Also asked as: Relate child to parent using external id · Set lookup using external Id instead of Salesforce Id · Load contacts with account external id in data loader · parent reference by external id apex</sub>

### What is a SOQL for loop and when should you use it?
*Fresher (0–2 yrs) · code* · `soql-029`

I use a SOQL for loop when a query can return a lot of rows and heap is the worry. It runs the query right inside the for statement, and Salesforce fetches the records in batches of 200 behind the scenes, instead of loading everything into memory at once. That keeps heap usage low when a query returns a lot of records. I can go one record at a time, or use the list form to get 200 records per iteration. The list form is better when I'm doing DML, because I can update each chunk. Say a query returns 20,000 Contacts. A normal list holds all 20,000 in heap. With the list form of the for loop, I hold 200 at a time and update each group. It doesn't raise the 50,000 query rows limit, though, it only helps with heap. And I still never put a query or DML inside the inner per-record loop.

- Fetches records in chunks of 200
- Reduces heap usage
- List form gives 200 records per iteration
- Does not raise the 50,000 row limit

```java
for (List<Contact> chunk : [SELECT Id, Email FROM Contact WHERE Email != null]) {
    for (Contact c : chunk) {
        c.Email = c.Email.toLowerCase();
    }
    update chunk;
}
```

<sub>Also asked as: How to avoid heap size errors when querying many records? · SOQL for loop vs normal list query · Iterate over large query results in Apex · for loop on soql query</sub>

### A trigger query fails with 'Non-selective query against large object type'. How do you fix it?
*Mid (3–6 yrs) · scenario* · `soql-030`

I'd fix the filter so it can use an index. This error is thrown in triggers when a query on an object with a large number of records, roughly over 200,000, can't use an index and would need a full table scan. It often works in sandbox and fails in production, just because of the data size. To fix it, I add a filter on an indexed field, like an Id set, a lookup, CreatedDate, or an External ID field, and make sure that filter is selective. I remove patterns that block indexes, like not equals, leading wildcards, or null checks on custom fields. For example, a trigger that queries Cases where a custom Region field is not null will scan the table. Filtering by the AccountIds from the trigger records instead uses the lookup index. If the business filter has to be on a custom field, I ask Salesforce Support for a custom index, and I check the result with the Query Plan tool. Because it only shows up at production volume, I ask the team to think about selectivity whenever a trigger query touches a big object.

- Triggered by table scans on large objects in triggers
- Filter on indexed fields with selective values
- Avoid !=, leading %, null on custom fields
- Request a custom index; verify with Query Plan

<sub>Also asked as: Non selective query error in trigger · System.QueryException non-selective query · Query works in sandbox but fails in production with large data · how to make my query selective</sub>

### What are date literals in SOQL?
*Fresher (0–2 yrs) · code* · `soql-031`

I prefer date literals over date maths in Apex wherever they fit. They're keywords for relative date ranges, so I don't have to calculate dates in Apex. Common ones are TODAY, YESTERDAY, THIS_WEEK, LAST_MONTH, THIS_QUARTER, THIS_YEAR, LAST_N_DAYS with a number, and NEXT_N_DAYS. For example, WHERE CloseDate = NEXT_N_DAYS:30 gives me Opportunities closing in the next 30 days, and the same query keeps working tomorrow without any change. They're evaluated in the running user's time zone. For datetime fields like CreatedDate, the literal covers the full day range, so CreatedDate = TODAY catches everything from midnight to midnight. There are also date functions like CALENDAR_YEAR or CALENDAR_MONTH that I use with GROUP BY for reports, for example counting records per month. The time zone point is the one I remind people about, because it explains a lot of "missing record" complaints.

- TODAY, LAST_MONTH, THIS_QUARTER, LAST_N_DAYS:n
- Evaluated in the user's time zone
- Date functions like CALENDAR_MONTH with GROUP BY

```java
List<Case> recent = [SELECT Id FROM Case WHERE CreatedDate = LAST_N_DAYS:30];
List<Opportunity> closingSoon = [SELECT Id FROM Opportunity WHERE CloseDate = NEXT_N_DAYS:14];
List<AggregateResult> perMonth = [
    SELECT CALENDAR_MONTH(CreatedDate) mon, COUNT(Id) cnt
    FROM Lead WHERE CreatedDate = THIS_YEAR
    GROUP BY CALENDAR_MONTH(CreatedDate)
];
```

<sub>Also asked as: SOQL query for records created this month · How to filter by last 30 days in SOQL? · What is LAST_N_DAYS in SOQL? · date functions in soql</sub>

### You need a list of Accounts that have no open Cases. How would you query it?
*Mid (3–6 yrs) · scenario* · `soql-032`

I'd use an anti-join, which filters in the database instead of looping in Apex. The query selects Accounts where Id is NOT IN a subquery of AccountId from Case where IsClosed is false. That returns only Accounts that have no open Cases, in one query. The alternative of querying all Accounts with a Cases subquery and checking for empty lists in Apex uses many more query rows and heap. If the Account table is very large, I also add a selective filter, like a record type or an owner, so the outer query stays efficient. In review, this is a pattern I steer people towards whenever I see empty-list checks on subquery results.

- Anti-join: Id NOT IN (subquery)
- Filtering happens in the database
- Avoids looping and extra query rows
- Add a selective outer filter on large objects

```java
List<Account> noOpenCases = [
    SELECT Id, Name
    FROM Account
    WHERE Type = 'Customer'
    AND Id NOT IN (SELECT AccountId FROM Case WHERE IsClosed = false AND AccountId != null)
];
```

<sub>Also asked as: Find parent records with no child records matching a condition · Accounts without open cases SOQL · Query records not related to another object · anti join example scenario</sub>

### How do you query deleted or archived records with ALL ROWS?
*Fresher (0–2 yrs) · code* · `soql-033`

ALL ROWS is how I reach records in the Recycle Bin, because by default SOQL doesn't return them. In Apex, adding ALL ROWS at the end of the query includes deleted records, and I can filter with IsDeleted equals true to get only those. It also returns archived Activities. Say a user deletes 30 Contacts by mistake. I can query them with ALL ROWS and IsDeleted = true, then run the undelete DML statement on that list to bring them back. It's also handy for auditing. A couple of rules: ALL ROWS can't be combined with FOR UPDATE, and through the API the equivalent is the queryAll operation. And once records are purged from the Recycle Bin, you can't get them back this way. So when someone reports an accidental delete, I tell them to raise it fast, before the bin is emptied.

- ALL ROWS includes Recycle Bin and archived activities
- Filter with IsDeleted = true
- Use with undelete to restore
- Not allowed with FOR UPDATE

```java
List<Account> deletedAccs = [
    SELECT Id, Name FROM Account
    WHERE IsDeleted = true AND LastModifiedDate = LAST_N_DAYS:7
    ALL ROWS
];
undelete deletedAccs;
```

<sub>Also asked as: How to get records from the recycle bin in SOQL? · What is ALL ROWS in Apex? · Query IsDeleted records · undelete records using apex</sub>

### How do you paginate SOQL results?
*Mid (3–6 yrs) · code* · `soql-034`

For small lists, OFFSET is fine, but for anything large I'd go with keyset pagination. The simple way is LIMIT with OFFSET. LIMIT sets the page size, OFFSET skips the earlier rows, and ORDER BY keeps the order stable. The catch is that OFFSET maxes out at 2,000 rows, so it doesn't work for deep pages, and large offsets get slower. For bigger data sets I use keyset pagination. I remember the last record's sort value and Id, and the next page's query filters for values greater than that. Say I show 50 Accounts per page, sorted by Name. Page 41 needs an OFFSET of 2,000, which is the maximum, so page 42 breaks. With keyset, I just ask for Accounts that sort after the last one I showed, which works at any depth and uses the index. For a total count to show page numbers, I run a separate COUNT query.

- LIMIT plus OFFSET with ORDER BY
- OFFSET maximum is 2,000
- Keyset pagination for large data
- Separate COUNT() for totals

```java
// Simple paging
List<Account> page = [
    SELECT Id, Name FROM Account ORDER BY Name, Id LIMIT :pageSize OFFSET :offsetRows
];

// Keyset paging for deep pages
List<Account> nextPage = [
    SELECT Id, Name FROM Account
    WHERE Id > :lastSeenId
    ORDER BY Id
    LIMIT :pageSize
];
```

<sub>Also asked as: What is OFFSET in SOQL? · How to implement pagination in an LWC data table? · LIMIT and OFFSET in SOQL · server side pagination salesforce</sub>

### You need to migrate ten million records from a legacy system into Salesforce. How would you plan it?
*Senior (7–10 yrs) · scenario* · `soql-035`

I'd plan it in phases, and I'd agree the cutover and rollback plan with the business before any data moves. First, mapping and cleansing. I map legacy fields to Salesforce, deduplicate, and add an External ID field on each object for the legacy key. Second, load order. Users and reference data first, then parents like Accounts, then children like Contacts and Opportunities, linking them through External IDs with upsert. So a Contact row just carries its legacy account key, and upsert finds the right Account. Third, performance. Use Bulk API 2.0 through Data Loader or an ETL tool, temporarily disable or bypass non-essential triggers, flows and validation rules, defer sharing calculations, and sort children by parent to avoid lock errors. Fourth, testing. I do a full-size run in a full sandbox first. Then, after the production load, I reconcile record counts and check sample data, so I know ten million in the source really landed as ten million in Salesforce. I want that reconciliation signed off by the data owners, not just by the team that ran the load.

- Cleanse data and add External IDs
- Load parents before children, upsert by External ID
- Bulk API, bypass automation, defer sharing
- Sort by parent to reduce lock errors
- Rehearse in full sandbox, reconcile after

<sub>Also asked as: Plan a large data migration to Salesforce · Data migration strategy for millions of records · Steps for migrating data with relationships · how to load 10 million records</sub>
