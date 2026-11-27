# Apex Triggers and Order of Execution

85 questions. Levels: Fresher (0–2 yrs) 30 · Mid (3–6 yrs) 34 · Senior (7–10 yrs) 21

## Apex Triggers

### What is an Apex trigger?
*Fresher (0–2 yrs) · concept* · `trg-001`

An Apex trigger is Apex code that runs automatically before or after records are inserted, updated, deleted or undeleted on an object. A trigger is defined on one object, lists the events it listens to, and receives the affected records through context variables like Trigger.new. For example, a trigger on Opportunity can listen for after update, and when a deal moves to Closed Won, it creates an onboarding Case for that account. We use triggers when declarative tools like Flow can't handle the logic cleanly, for example complex cross-object validation, heavy bulk processing with maps, or logic that needs tight control over errors and recursion. As a best practice, I keep the trigger itself very thin and put the real logic in a handler class.

- Runs automatically on DML: insert, update, delete, undelete
- Before or after the record is saved
- Records come in through context variables like Trigger.new
- Keep the trigger thin, logic in a handler class

```java
trigger AccountTrigger on Account (before insert, after update) {
    AccountTriggerHandler.run();
}
```

<sub>Also asked as: Can you explain what a trigger is in Salesforce? · what is a trigger in apex · Why do we use triggers in Salesforce? · Tell me about Apex triggers in simple words</sub>

### What are the different trigger events in Salesforce?
*Fresher (0–2 yrs) · concept* · `trg-002`

There are seven trigger events: before insert, before update, before delete, after insert, after update, after delete and after undelete. There's no before undelete. Before events are for validating or changing the records being saved, without any extra DML. After events are for when you need the record Id or you're working with other records, like creating children or updating a parent. For example, defaulting a Lead's Rating as it's saved is before insert. Creating a follow-up Task for a new Contact needs the Contact's Id, so that's after insert. One trigger can list several events, and I normally list all the events an object needs in a single trigger and route them to a handler.

- 7 events: before/after insert, update, delete, plus after undelete
- No before undelete event
- Before: change or validate same records; after: related records, Ids

```java
trigger OpportunityTrigger on Opportunity (
    before insert, before update, before delete,
    after insert, after update, after delete, after undelete
) {
    new OpportunityTriggerHandler().run();
}
```

<sub>Also asked as: How many trigger events are there? · List the events a trigger can run on · Is there a before undelete trigger? · what are trigger events before insert after insert etc</sub>

### What are trigger context variables?
*Fresher (0–2 yrs) · concept* · `trg-003`

Context variables tell the trigger what's happening and give it the records. Trigger.new is the list of new versions of the records, and Trigger.old is the list of old versions. Trigger.newMap and Trigger.oldMap hold the same records keyed by Id. Boolean flags like isInsert, isUpdate, isDelete, isUndelete, isBefore and isAfter tell you the event and timing. Trigger.operationType gives the event as a single enum value, Trigger.size gives the number of records in this invocation, and Trigger.isExecuting is true when the current code was called from a trigger. The combination I use most is in an update: I take a record from Trigger.new, look up the same Id in Trigger.oldMap, and compare them to see whether, say, the Stage actually changed.

- Trigger.new / Trigger.old: lists of records
- Trigger.newMap / Trigger.oldMap: maps keyed by Id
- isInsert, isUpdate, isDelete, isUndelete, isBefore, isAfter
- operationType, size, isExecuting

<sub>Also asked as: Explain Trigger.new, Trigger.old, newMap and oldMap · What context variables are available in a trigger? · what is trigger dot new and trigger dot old · What does Trigger.isExecuting mean?</sub>

### What is the difference between a before trigger and an after trigger?
*Fresher (0–2 yrs) · comparison* · `trg-004`

I use a before trigger when I want to validate or change the same records that are being saved, because I just set fields on Trigger.new and Salesforce saves them, with no extra DML. For example, filling in a default region on a new Account is a before insert job. I use an after trigger when I need the record Id or the saved values, or when I'm working on other records, like creating child records, updating a parent, or enqueuing a Queueable. In an after trigger, Trigger.new is read-only. So changing the same record there would need another update statement, which wastes limits and can cause recursion. That's why same-record changes belong in before.

- Before: same-record field updates and validation, no DML needed
- After: record Ids available, related records, async jobs
- Trigger.new is read-only in after triggers

<sub>Also asked as: Before vs after trigger, when do you use which? · When should I write a before trigger instead of an after trigger? · before trigger versus after trigger difference · Why can't I update Trigger.new in an after trigger?</sub>

### Which trigger context variables are available in which events?
*Mid (3–6 yrs) · concept* · `trg-005`

Trigger.new is available in insert, update and undelete triggers, and you can only modify it in before triggers. Trigger.old is available in update and delete triggers. Trigger.newMap is available in before update, after insert, after update and after undelete, but not in before insert, because new records don't have Ids yet. Trigger.oldMap is available in update and delete triggers. So in a delete trigger I work with Trigger.old or oldMap. For example, to stop someone deleting an Account that still has open Cases, my before delete logic loops over Trigger.old, because Trigger.new isn't available there. And in before insert, I only have Trigger.new as a list.

- Trigger.new: insert, update, undelete (editable only in before)
- Trigger.old and oldMap: update and delete
- Trigger.newMap: not in before insert (no Ids yet)
- Delete triggers: use Trigger.old

<sub>Also asked as: Is Trigger.newMap available in before insert? · Why is Trigger.new null in a delete trigger? · In which events can I use Trigger.oldMap? · when is trigger new map not available</sub>

### Why do you get a 'Record is read-only' error in an after trigger, and how do you fix it?
*Fresher (0–2 yrs) · code* · `trg-006`

That error appears when you try to change a field on a record in Trigger.new inside an after trigger. In after context the records are already saved, so Trigger.new is read-only. Say an after insert trigger on Case tries to set a Status on the same Case. That line throws the error. The fix is to move that field assignment into the before trigger, where you set the value directly and it's saved with no extra DML. If you really need the after context, for example because the value depends on the record Id, then build new sObject instances with just the Id and the changed field, and update those, with a guard so the update doesn't loop.

- After trigger records are read-only
- Move same-record changes to before trigger
- If after context is needed, update new instances by Id with a guard

```java
// Wrong: in after insert -> opp.NextStep = 'Qualify'; throws read-only error
trigger OpportunityTrigger on Opportunity (before insert) {
    OpportunityDefaults.apply(Trigger.new);
}

public with sharing class OpportunityDefaults {
    public static void apply(List<Opportunity> opps) {
        for (Opportunity opp : opps) {
            if (String.isBlank(opp.NextStep)) {
                opp.NextStep = 'Qualify';   // no DML needed in before context
            }
        }
    }
}
```

<sub>Also asked as: I'm getting FinalException record is read-only in my trigger · Can we update Trigger.new in after insert? · how to fix record is read only error apex trigger · Why can't I set a field on Trigger.new in after update?</sub>

### What is bulkification in triggers and why is it important?
*Fresher (0–2 yrs) · code* · `trg-007`

Bulkification means writing the trigger so it works correctly and efficiently when it receives up to 200 records at once, not just one. Data Loader, integrations and batch jobs send records in bulk, and governor limits apply to the whole transaction. So a query or DML per record quickly hits the 100 SOQL or 150 DML limit. For example, if someone loads 200 Contacts and my trigger queries the parent Account once per Contact, that's 200 queries, and the load fails. The pattern I follow is: loop once to collect Ids into a Set, run one query into a Map, loop again to apply the logic, collect the changes into a List, and do a single DML at the end.

- Trigger can receive up to 200 records per invocation
- Collect Ids in a Set, query once into a Map
- No SOQL or DML inside loops
- One DML on a list at the end

```java
trigger CaseTrigger on Case (before insert) {
    CaseTriggerHandler.setPriorityFromAccount(Trigger.new);
}

public with sharing class CaseTriggerHandler {
    public static void setPriorityFromAccount(List<Case> cases) {
        Set<Id> accountIds = new Set<Id>();
        for (Case c : cases) {
            if (c.AccountId != null) accountIds.add(c.AccountId);
        }
        if (accountIds.isEmpty()) return;

        Map<Id, Account> accounts = new Map<Id, Account>(
            [SELECT Id, Rating FROM Account WHERE Id IN :accountIds]
        );
        for (Case c : cases) {
            Account acc = accounts.get(c.AccountId);
            if (acc != null && acc.Rating == 'Hot') {
                c.Priority = 'High';
            }
        }
    }
}
```

<sub>Also asked as: How do you make a trigger bulk safe? · What does it mean to bulkify a trigger? · Why should a trigger handle 200 records at a time? · bulkify apex trigger example</sub>

### How do you avoid SOQL and DML inside a for loop in a trigger?
*Fresher (0–2 yrs) · code* · `trg-008`

I move every query and DML out of the loop. First I loop through the trigger records and collect the Ids I need into a Set. Then I run one query with WHERE Id IN :set, or a parent-to-child query, and store the results in a Map or list. Then I loop again, make the changes in memory, add the records to a List, and do one update at the end. In this example, when an account owner changes, all open opportunities move to the new owner with one query and one DML, no matter how many accounts are in the batch.

- Bad: query or update per record
- Good: collect Ids, one query, one DML
- Only process records whose field actually changed

```java
// BAD: for (Account a : Trigger.new) { List<Opportunity> o = [SELECT ...]; update o; }

trigger AccountTrigger on Account (after update) {
    AccountOwnerSync.moveOpenOpportunities(Trigger.new, Trigger.oldMap);
}

public with sharing class AccountOwnerSync {
    public static void moveOpenOpportunities(List<Account> accounts, Map<Id, Account> oldMap) {
        Map<Id, Id> newOwnerByAccount = new Map<Id, Id>();
        for (Account a : accounts) {
            if (a.OwnerId != oldMap.get(a.Id).OwnerId) {
                newOwnerByAccount.put(a.Id, a.OwnerId);
            }
        }
        if (newOwnerByAccount.isEmpty()) return;

        List<Opportunity> opps = [
            SELECT Id, AccountId FROM Opportunity
            WHERE AccountId IN :newOwnerByAccount.keySet() AND IsClosed = false
        ];
        for (Opportunity o : opps) {
            o.OwnerId = newOwnerByAccount.get(o.AccountId);
        }
        update opps;
    }
}
```

<sub>Also asked as: Show me a trigger with SOQL in a loop and fix it · How do you remove queries from inside loops? · my trigger has update inside for loop how to fix · Rewrite this trigger so it doesn't hit too many SOQL queries</sub>

### Why should you have only one trigger per object?
*Mid (3–6 yrs) · concept* · `trg-009`

Because if there are multiple triggers on the same object for the same event, Salesforce doesn't guarantee which one runs first, so the behaviour is unpredictable and hard to debug. Say one trigger sets an Account's region, and a second trigger assigns the owner based on that region. If the second one happens to run first, it reads a blank region and assigns the wrong owner. With one trigger per object, I control the order of logic explicitly inside the handler. I can apply a single recursion strategy and a single bypass switch, and every developer knows exactly where to look. The trigger just delegates to a handler class, and the logic is split into well-named methods or service classes that are easy to unit test.

- Order of multiple triggers on the same event isn't guaranteed
- Single entry point controls order explicitly
- One place for bypass and recursion logic
- Thin trigger, logic in handler and service classes

<sub>Also asked as: What is the one trigger per object pattern? · What happens if there are two triggers on the same object? · why one trigger per object best practice · Should I create a new trigger for every requirement?</sub>

### Can you write a trigger handler framework?
*Mid (3–6 yrs) · code* · `trg-010`

Sure. I keep the trigger to one line that calls the handler's run method. A base class does the routing with a switch on Trigger.operationType, checks a bypass list, and has an empty virtual method for each event. Each object handler extends the base class and only overrides the events it needs, calling service classes for the real logic. For example, my AccountTriggerHandler only overrides beforeInsert, to default the Rating, and afterUpdate, to move open opportunities when the owner changes. The other events just do nothing. This gives one trigger per object, a predictable order, one place for bypass logic, and handler methods I can unit test. Teams can also bypass a handler from code through a static bypass set, for example during a data fix.

- Trigger calls handler.run() only
- Base class routes events with switch on Trigger.operationType
- Object handler overrides only needed events
- Static bypass set to switch handlers off in code

```java
trigger AccountTrigger on Account (before insert, before update, before delete,
        after insert, after update, after delete, after undelete) {
    new AccountTriggerHandler().run();
}

public abstract class TriggerHandler {
    private static Set<String> bypassed = new Set<String>();
    public static void bypass(String name) { bypassed.add(name); }
    public static void clearBypass(String name) { bypassed.remove(name); }

    protected abstract String handlerName();

    public void run() {
        if (!Trigger.isExecuting || bypassed.contains(handlerName())) return;
        switch on Trigger.operationType {
            when BEFORE_INSERT  { beforeInsert(Trigger.new); }
            when BEFORE_UPDATE  { beforeUpdate(Trigger.new, Trigger.oldMap); }
            when BEFORE_DELETE  { beforeDelete(Trigger.old); }
            when AFTER_INSERT   { afterInsert(Trigger.new); }
            when AFTER_UPDATE   { afterUpdate(Trigger.new, Trigger.oldMap); }
            when AFTER_DELETE   { afterDelete(Trigger.old); }
            when AFTER_UNDELETE { afterUndelete(Trigger.new); }
        }
    }
    protected virtual void beforeInsert(List<SObject> newList) {}
    protected virtual void beforeUpdate(List<SObject> newList, Map<Id, SObject> oldMap) {}
    protected virtual void beforeDelete(List<SObject> oldList) {}
    protected virtual void afterInsert(List<SObject> newList) {}
    protected virtual void afterUpdate(List<SObject> newList, Map<Id, SObject> oldMap) {}
    protected virtual void afterDelete(List<SObject> oldList) {}
    protected virtual void afterUndelete(List<SObject> newList) {}
}

public with sharing class AccountTriggerHandler extends TriggerHandler {
    protected override String handlerName() { return 'AccountTriggerHandler'; }

    protected override void beforeInsert(List<SObject> newList) {
        for (Account a : (List<Account>) newList) {
            if (a.Rating == null) a.Rating = 'Warm';
        }
    }
    protected override void afterUpdate(List<SObject> newList, Map<Id, SObject> oldMap) {
        AccountOwnerSync.moveOpenOpportunities((List<Account>) newList, (Map<Id, Account>) oldMap);
    }
}
```

<sub>Also asked as: How do you structure a trigger with a handler class? · Show me your trigger framework · explain trigger handler pattern with code · What does a base trigger handler class look like?</sub>

### How do you use Trigger.operationType in a trigger?
*Mid (3–6 yrs) · code* · `trg-011`

Trigger.operationType returns a System.TriggerOperation enum, like BEFORE_INSERT or AFTER_UPDATE, which combines timing and event in one value. I use it with a switch on statement instead of nested if conditions on isBefore and isInsert. It reads cleanly, every event is routed in one place, and one when branch can cover several events. For example, if before insert and before update both need to default the same field, I write one when branch listing BEFORE_INSERT and BEFORE_UPDATE and call the method once. The values are BEFORE_INSERT, BEFORE_UPDATE, BEFORE_DELETE, AFTER_INSERT, AFTER_UPDATE, AFTER_DELETE and AFTER_UNDELETE.

- Returns System.TriggerOperation enum
- Use with switch on for clean routing
- One when branch can list several values

```java
trigger OpportunityTrigger on Opportunity (before insert, before update, after update) {
    switch on Trigger.operationType {
        when BEFORE_INSERT, BEFORE_UPDATE {
            OpportunityTriggerHandler.validateCloseDate(Trigger.new);
        }
        when AFTER_UPDATE {
            OpportunityTriggerHandler.createWonTasks(Trigger.new, Trigger.oldMap);
        }
    }
}

public with sharing class OpportunityTriggerHandler {
    public static void validateCloseDate(List<Opportunity> opps) {
        for (Opportunity o : opps) {
            if (!o.IsClosed && o.CloseDate != null && o.CloseDate < Date.today()) {
                o.CloseDate.addError('Close date cannot be in the past for an open opportunity.');
            }
        }
    }
    public static void createWonTasks(List<Opportunity> opps, Map<Id, Opportunity> oldMap) {
        List<Task> tasks = new List<Task>();
        for (Opportunity o : opps) {
            if (o.StageName == 'Closed Won' && oldMap.get(o.Id).StageName != 'Closed Won') {
                tasks.add(new Task(WhatId = o.Id, OwnerId = o.OwnerId,
                    Subject = 'Kick-off call', ActivityDate = Date.today().addDays(2)));
            }
        }
        insert tasks;
    }
}
```

<sub>Also asked as: What is System.TriggerOperation? · Use switch on in a trigger instead of if else · how does trigger operation type switch work · What values does Trigger.operationType return?</sub>

### How do you prevent recursion in a trigger?
*Mid (3–6 yrs) · code* · `trg-012`

I use a static Set of Ids in the handler to remember which records have already been processed in this transaction. Static variables live for the whole transaction, so when my after update logic does a DML that fires the same trigger again, the records already in the set are skipped. For example, an after update on Account updates a field on those same Accounts. That update fires the trigger again, but those Ids are already in the set, so the logic doesn't run twice. I prefer this over a static Boolean, because a Boolean blocks every later chunk of 200 records and any legitimate second update. I also check that the relevant field actually changed using oldMap, which on its own stops most recursion.

- Static Set<Id> of processed records, not a static Boolean
- Statics live for the whole transaction
- Also check real field changes with oldMap
- Boolean guard skips later 200-record chunks

```java
trigger OpportunityTrigger on Opportunity (after update) {
    OpportunityStageHandler.afterUpdate(Trigger.new, Trigger.oldMap);
}

public with sharing class OpportunityStageHandler {
    private static Set<Id> processedIds = new Set<Id>();

    public static void afterUpdate(List<Opportunity> newList, Map<Id, Opportunity> oldMap) {
        List<Opportunity> toProcess = new List<Opportunity>();
        for (Opportunity opp : newList) {
            if (processedIds.contains(opp.Id)) continue;
            if (opp.StageName != oldMap.get(opp.Id).StageName) {
                processedIds.add(opp.Id);
                toProcess.add(opp);
            }
        }
        if (toProcess.isEmpty()) return;

        List<Opportunity> updates = new List<Opportunity>();
        for (Opportunity opp : toProcess) {
            updates.add(new Opportunity(Id = opp.Id, Stage_Changed_On__c = Date.today()));
        }
        update updates; // re-fires the trigger, but these Ids are skipped
    }
}
```

<sub>Also asked as: How do you stop a trigger from firing again and again? · What is the best way to handle recursive triggers? · trigger recursion static set of ids · My trigger is calling itself, how do I stop it?</sub>

### Your recursion check uses a static Boolean, and when 1,000 records are inserted in one Apex DML only the first 200 get processed. Why?
*Senior (7–10 yrs) · scenario* · `trg-013`

Because a static Boolean is shared across the whole transaction, and a single DML of 1,000 records fires the trigger in chunks of 200 within that same transaction. The first chunk sets the flag to true, so the next four chunks see it and skip the logic. The same thing happens when another automation legitimately updates the record again in the same transaction. The fix is to track processed record Ids in a static Set, so each record is handled once but new records are still processed, and to only run logic when the relevant fields changed.

- Trigger runs per 200-record chunk in the same transaction
- Boolean set by chunk 1 blocks chunks 2 onwards
- Use static Set<Id> plus field-change checks

<sub>Also asked as: Why is a static boolean a bad way to stop recursion? · Trigger logic only ran for the first 200 records, what is wrong? · static boolean run once trigger problem · Records after the first chunk were skipped by my trigger</sub>

### How do you decide between a trigger and a record-triggered flow?
*Mid (3–6 yrs) · comparison* · `trg-014`

My default is Flow for simple same-record updates and straightforward automation, because admins can maintain it, and before-save flows are very fast for field updates. For example, setting a Case's priority from its type is a perfect before-save flow. I choose a trigger when the logic is complex or needs heavy bulk processing with maps, precise error handling, reusable Apex services, async callouts, or events Flow doesn't support, like undelete. I also follow a per-object rule. Mixing many flows and triggers on one object makes the order of execution hard to reason about, so a team should agree which tool owns which object.

- Flow: simple, admin-maintainable, before-save is fast
- Trigger: complex logic, large volumes, fine error control
- Record-triggered flows have no undelete event
- Agree a per-object standard to avoid mixing

<sub>Also asked as: Flow vs trigger, which one would you use? · When would you choose Apex trigger over Flow? · trigger or flow how to decide · Should all automation move to Flow?</sub>

### How do you use addError in a trigger?
*Fresher (0–2 yrs) · code* · `trg-015`

addError stops the record from being saved and shows a message to the user. If I call it on the record, the message appears at the top of the page. If I call it on a field, like contact.Email.addError, it shows next to that field. For example, if the business wants only work email addresses on Contacts and someone enters a personal one, I put the error right on the Email field so the user sees exactly what to fix. In an all-or-none DML the whole operation fails, while with partial success only the records with errors fail. I mostly call it in before triggers for validation, and I keep it bulk-safe by checking all records in one loop, without querying per record.

- record.addError: message at top of page
- record.Field.addError: message next to the field
- Use in before triggers for validation
- All-or-none DML fails all; partial success fails only bad records

```java
trigger ContactTrigger on Contact (before insert, before update) {
    ContactValidator.requireEmailOrPhone(Trigger.new);
}

public with sharing class ContactValidator {
    public static void requireEmailOrPhone(List<Contact> contacts) {
        for (Contact c : contacts) {
            if (String.isBlank(c.Email) && String.isBlank(c.Phone)) {
                c.addError('Please enter an email or a phone number.');
            } else if (c.Email != null && !c.Email.contains('@')) {
                c.Email.addError('Enter a valid email address.');
            }
        }
    }
}
```

<sub>Also asked as: How do you show a validation error from a trigger? · What is the difference between record addError and field addError? · how to stop a record from saving in trigger · Throw a custom error message on a field from Apex</sub>

### Can you use addError in an after trigger, and what happens?
*Mid (3–6 yrs) · concept* · `trg-016`

Yes. addError works on Trigger.new records in after insert and after update, and on Trigger.old in delete triggers. The record is saved but not yet committed, so calling addError makes that record's save fail. In an all-or-none operation the whole transaction rolls back, including any DML the trigger already did. With partial success, Salesforce rolls back and retries the save with only the good records. I use it in after triggers when the check depends on data that only exists after save. For example, if the rule counts records with a SOQL query and that count has to include the records being saved right now, the check has to run after save, because only then can the query see them. But for simple checks I prefer before triggers, because failing early avoids wasted work.

- Works on Trigger.new in after insert/update and Trigger.old in delete
- Record isn't committed yet, so it rolls back
- Partial success: Salesforce retries with the good records
- Prefer before triggers for simple validation

<sub>Also asked as: Does addError work in after insert? · Can I block a save from an after trigger? · adderror after trigger rollback · What happens to DML done in a trigger when addError is called?</sub>

### Write a trigger that handles undelete, and explain when it fires.
*Mid (3–6 yrs) · code* · `trg-017`

After undelete fires when records are restored from the Recycle Bin, either from the UI or with Database.undelete in Apex. There is only an after undelete event, and Trigger.new and Trigger.newMap hold the restored records, while Trigger.old is not available. A common use is recalculating a custom roll-up on the parent, because the restored child should count again. Here, when contacts are restored, I recount the contacts on their accounts with one aggregate query and one update.

- Only after undelete exists
- Trigger.new and newMap hold restored records
- Typical use: recalculate custom roll-ups

```java
trigger ContactTrigger on Contact (after undelete) {
    ContactUndeleteHandler.afterUndelete(Trigger.new);
}

public with sharing class ContactUndeleteHandler {
    public static void afterUndelete(List<Contact> restored) {
        Set<Id> accountIds = new Set<Id>();
        for (Contact c : restored) {
            if (c.AccountId != null) accountIds.add(c.AccountId);
        }
        if (accountIds.isEmpty()) return;

        Map<Id, Account> updates = new Map<Id, Account>();
        for (Id accId : accountIds) {
            updates.put(accId, new Account(Id = accId, Contact_Count__c = 0));
        }
        for (AggregateResult ar : [
            SELECT AccountId accId, COUNT(Id) total
            FROM Contact WHERE AccountId IN :accountIds GROUP BY AccountId
        ]) {
            updates.get((Id) ar.get('accId')).Contact_Count__c = (Integer) ar.get('total');
        }
        update updates.values();
    }
}
```

<sub>Also asked as: When does an after undelete trigger run? · How do you handle records restored from the recycle bin in a trigger? · trigger after undelete example · Is Trigger.old available in undelete?</sub>

### How do you disable or bypass a trigger without deploying code?
*Senior (7–10 yrs) · code* · `trg-018`

I give every trigger a kill switch. A custom metadata type, say Trigger_Setting__mdt, holds one record per object with an Is_Active__c checkbox, so an admin can switch an object's trigger logic off org-wide during a migration, and because it's metadata it can be deployed and is the same across environments. On top of that, a custom permission like Bypass_Triggers, given through a permission set to an integration or migration user, lets just that user skip the logic. The trigger checks both first, using getInstance and FeatureManagement.checkPermission, and getInstance doesn't use a SOQL query.

- Custom metadata switch per object for org-wide disable
- Custom permission via permission set for per-user bypass
- FeatureManagement.checkPermission + Trigger_Setting__mdt.getInstance
- No deployment needed to flip either switch

```java
trigger AccountTrigger on Account (before insert, before update, after insert, after update) {
    if (TriggerControl.isDisabled('Account')) return;
    AccountTriggerHandler.run();
}

public with sharing class TriggerControl {
    public static Boolean isDisabled(String objectName) {
        if (FeatureManagement.checkPermission('Bypass_Triggers')) return true;
        Trigger_Setting__mdt setting = Trigger_Setting__mdt.getInstance(objectName);
        return setting != null && !setting.Is_Active__c;
    }
}

public with sharing class AccountTriggerHandler {
    public static void run() {
        switch on Trigger.operationType {
            when BEFORE_INSERT, BEFORE_UPDATE {
                for (Account a : (List<Account>) Trigger.new) {
                    if (a.Name != null) a.Name = a.Name.trim();
                }
            }
            when else { }
        }
    }
}
```

<sub>Also asked as: How do you switch off triggers during a data migration? · Trigger bypass using custom metadata or custom permission · how to bypass trigger for integration user · Can admins turn off a trigger in production without a deployment?</sub>

### Can you write triggers on both standard and custom objects? Are there objects that don't support triggers?
*Mid (3–6 yrs) · concept* · `trg-019`

Yes. Triggers work on custom objects and on most standard objects like Account, Contact, Opportunity, Case and Lead. They also work on some standard child objects, such as OpportunityLineItem, CaseComment and ContentVersion. A few standard objects don't support triggers, so I check the object reference before I plan the design. You can also write triggers on platform events and Change Data Capture change events, but those only support after insert. The syntax is the same; you just use the API name. For example, a trigger on Invoice__c for a custom object, or on Order_Event__e for a platform event. For Change Data Capture, the name ends in ChangeEvent, like AccountChangeEvent.

- Custom objects and most standard objects support triggers
- Some standard objects don't, check the object reference
- Platform event and CDC triggers: after insert only
- Use API names: __c, __e, ChangeEvent

<sub>Also asked as: Can I write a trigger on a standard object like Account? · Which objects support Apex triggers? · trigger on custom object vs standard object · Can you write a trigger on a platform event?</sub>

### If an Apex DML inserts 1,000 records, how many times does the trigger fire, and how do limits apply?
*Mid (3–6 yrs) · scenario* · `trg-020`

The trigger fires five times, once for each chunk of 200 records, and all five runs are in the same transaction. That means governor limits are shared, so if each run uses 30 queries, the fourth chunk will break the 100 SOQL limit. Static variables also carry over between chunks. With Data Loader it's different: each batch it sends, 200 records by default, is a separate API call and transaction, so limits apply per batch. This is why I keep the number of queries per trigger run constant and small, regardless of record count.

- Trigger runs per chunk of 200 records
- All chunks share one transaction and its limits
- Static variables persist across chunks
- Each Data Loader batch is its own transaction

<sub>Also asked as: What is the trigger batch size? · Does a trigger process records in chunks of 200? · 1000 records inserted how many times trigger executes · Are governor limits reset between trigger chunks?</sub>

### Can you make a callout directly from a trigger?
*Fresher (0–2 yrs) · concept* · `trg-021`

No. A synchronous callout isn't allowed from a trigger, because the trigger runs while the database transaction is open, and Salesforce won't hold it open while waiting on an external system. You get the error 'Callout from triggers are currently not supported'. The solution is to hand the work to asynchronous Apex: a future method marked callout=true, or preferably a Queueable that implements Database.AllowsCallouts. Say every new Account has to be sent to an ERP. The trigger collects the new Account Ids and enqueues one Queueable for the whole batch, not one per record, and that job makes the callout. The async job starts only after the transaction commits, so the external system only hears about data that was really saved.

- Synchronous callouts are blocked in triggers
- Use @future(callout=true) or Queueable with Database.AllowsCallouts
- Async job runs after commit
- Enqueue once per trigger run, not per record

<sub>Also asked as: Why can't I call an external API from a trigger? · How do I make an HTTP callout from a trigger? · callout from triggers are currently not supported error · trigger callout future method or queueable</sub>

### How do you write a test class for a trigger?
*Mid (3–6 yrs) · code* · `trg-022`

I test the trigger through DML, because that's what fires it. I create my own test data with @TestSetup, never relying on org data, and I use 200 records to prove the trigger is bulk-safe. I put the DML between Test.startTest and Test.stopTest, so I get fresh limits and any async work finishes. Then I query the results and assert the actual outcome with the Assert class. For example, if the trigger defaults a Region on Accounts, I insert 200 Accounts, query them back, and assert all 200 got the right Region. I also cover negative paths, like asserting that addError blocks a bad record, and every event the trigger handles, not just insert.

- Fire the trigger with DML on test data
- Use 200 records to prove bulk safety
- Test.startTest / stopTest, then assert results
- Cover negative paths and all handled events

```java
@IsTest
private class OpportunityTriggerTest {
    @TestSetup
    static void setup() {
        Account acc = new Account(Name = 'Test Account');
        insert acc;
        List<Opportunity> opps = new List<Opportunity>();
        for (Integer i = 0; i < 200; i++) {
            opps.add(new Opportunity(Name = 'Opp ' + i, AccountId = acc.Id,
                StageName = 'Prospecting', CloseDate = Date.today().addDays(30)));
        }
        insert opps;
    }

    @IsTest
    static void createsTaskWhenClosedWon() {
        List<Opportunity> opps = [SELECT Id FROM Opportunity];
        for (Opportunity o : opps) o.StageName = 'Closed Won';

        Test.startTest();
        update opps;
        Test.stopTest();

        Assert.areEqual(200, [SELECT COUNT() FROM Task WHERE WhatId IN :opps],
            'Each won opportunity should get one task');
    }
}
```

<sub>Also asked as: How do you test an Apex trigger? · Write a bulk test for a trigger · test class for trigger with 200 records · How do you get code coverage for a trigger?</sub>

### What happens to triggers when records are merged?
*Senior (7–10 yrs) · concept* · `trg-023`

A merge doesn't have its own trigger event; it fires delete and update events instead. The losing records fire before delete and after delete, and the winning record fires before update and after update. In the after delete trigger, the losing records in Trigger.old have MasterRecordId set to the winner's Id, so I check that field to tell a merge apart from a normal delete. Say two duplicate Accounts are merged. The duplicate shows up in after delete with MasterRecordId pointing at the survivor, so my code knows it's a merge, not someone really deleting a customer. Child records that get reparented to the winner during the merge don't fire their own triggers. That matters for custom roll-ups, so I recalculate for the master record myself.

- No merge event: delete for losers, update for winner
- MasterRecordId set on deleted losers in after delete
- Reparented children don't fire triggers
- Recalculate custom roll-ups for the winner

```java
// In the after delete handler
for (Account lost : (List<Account>) Trigger.old) {
    if (lost.MasterRecordId != null) {
        mergedIntoIds.add(lost.MasterRecordId); // recalc roll-ups for these
    }
}
```

<sub>Also asked as: Is there a merge trigger event? · How do you detect a merge in a delete trigger? · merge account trigger masterrecordid · Which triggers fire on a lead or contact merge?</sub>

### Your trigger fails with MIXED_DML_OPERATION. Why does it happen and how do you fix it?
*Senior (7–10 yrs) · scenario* · `trg-024`

MIXED_DML_OPERATION means the transaction did DML on a setup object, like User, Group, GroupMember or PermissionSetAssignment, and on a non-setup object like Account, in the same transaction. Salesforce blocks it because setup changes affect sharing and access calculations. A common case is a User trigger that fires when someone is deactivated and tries to reassign that person's Accounts in the same transaction. In a trigger, the fix is to move one side into a separate transaction, usually a Queueable or future method for the non-setup DML. In tests, I wrap the setup DML in System.runAs. Not every User update triggers it; it mostly appears when fields like role, profile, username or active status change.

- Setup (User, Group, PermissionSetAssignment) + non-setup DML in one transaction
- Fix: move one side to Queueable or future
- Tests: use System.runAs around setup DML
- Common trigger: user deactivation or role change

<sub>Also asked as: What is mixed DML error in Salesforce? · I update User and Account in the same trigger and get an error · mixed dml operation setup and non setup object · How do you avoid mixed DML in a test class?</sub>

### Are there operations that don't fire triggers?
*Senior (7–10 yrs) · concept* · `trg-025`

Yes, some system and mass operations skip triggers. Examples are cascading deletes of child records when a master record is deleted, child records reparented as part of a merge, mass campaign status changes, mass division transfers, mass address updates, renaming or replacing picklist values, changing a custom field's data type, and managing price books. So if my design depends on a trigger, I check whether one of these paths can bypass it. For example, say I keep a custom count of Contacts on Account using a Contact trigger. When two Accounts are merged, the Contacts moved to the winner don't fire that trigger, so the count goes stale. That's why I plan a recalculation, like a scheduled batch that reconciles the values.

- Cascade deletes of children don't fire child triggers
- Merge reparenting, mass updates, picklist renames skip triggers
- Plan a reconciliation batch for critical roll-ups

<sub>Also asked as: Which operations skip Apex triggers? · Does a cascade delete fire triggers on child records? · when do triggers not execute in salesforce · My trigger didn't run when records were deleted with the parent, why?</sub>

### How do triggers behave with partial-success DML like Database.insert with allOrNone set to false?
*Senior (7–10 yrs) · concept* · `trg-026`

When some records fail, Salesforce rolls back that attempt and retries the save with only the records that succeeded, so the trigger fires again for them in the same transaction. Because it's the same transaction, static variables are not reset. That's a real trap. Say I update 100 records with allOrNone false and 5 fail. My trigger runs for all 100 and a recursion guard stores their Ids. The attempt is rolled back, the retry runs for the 95 good ones, and the guard says they're already done, so it skips them. The DML from the first attempt was rolled back, so the logic silently never happens. I keep guards tied to real field changes where possible, and I make sure counters and side effects can't be doubled or lost on a retry.

- Failed attempt is rolled back, good records are retried
- Trigger fires again in the same transaction
- Static variables are NOT reset between attempts
- Id-based guards can wrongly skip the retry

<sub>Also asked as: Do triggers fire again when some records fail? · Database insert false trigger runs twice · What happens to static variables when Salesforce retries a partial save? · allornone false trigger retry behaviour</sub>

### How would you design the trigger architecture for a large org with several teams working on the same objects?
*Senior (7–10 yrs) · design* · `trg-027`

I'd standardise on one trigger per object and a shared handler framework, so everyone plugs into the same entry point. Handlers stay thin and call service classes split by business domain. I'd use custom metadata to register and order handler classes, so a team adds logic without editing another team's code. For example, the sales team and the service team both need logic on Account. Each writes its own handler class and adds a metadata record with its run order, and nobody touches the other team's file. The framework provides one recursion approach, per-object and per-user bypass through custom metadata and custom permissions, and consistent error logging. I'd also agree when to use Flow versus Apex per object, require bulk tests with 200 records, and push heavy or callout work to Queueables.

- One trigger per object, shared framework
- Custom metadata registers and orders handlers per team
- Common bypass, recursion and logging
- Per-object Flow vs Apex standard, bulk tests mandatory

```java
public interface ITriggerHandler { void handle(); }

// Dispatcher: handlers registered in Trigger_Handler__mdt (Object__c, Class_Name__c, Order__c, Active__c)
public with sharing class TriggerDispatcher {
    public static void run(String objectName) {
        List<Trigger_Handler__mdt> rows = [
            SELECT Class_Name__c FROM Trigger_Handler__mdt
            WHERE Object__c = :objectName AND Active__c = true ORDER BY Order__c
        ];
        for (Trigger_Handler__mdt row : rows) {
            ITriggerHandler h = (ITriggerHandler) Type.forName(row.Class_Name__c).newInstance();
            h.handle();
        }
    }
}
```

<sub>Also asked as: How do you organise triggers when many teams touch Account? · Design a scalable trigger framework for an enterprise org · metadata driven trigger framework · How do you stop teams overwriting each other's trigger logic?</sub>

### What is the scope of a static variable in a trigger?
*Fresher (0–2 yrs) · concept* · `trg-028`

A static variable lives for the whole transaction, not just one trigger call. So if the same trigger runs several times in one transaction, because of 200-record chunks, a re-save from other automation, or a DML that fires it again, the static value is still there. That's why we use static variables for recursion guards and to cache query results within a transaction. For example, if my handler loads a map of region settings into a static variable during the first chunk, the next four chunks of a 1,000-record Apex insert reuse it instead of querying again. When the transaction ends, the value is gone and the next transaction starts fresh. Static variables are never shared between different users or different transactions.

- Lives for one transaction
- Persists across trigger chunks and re-fires
- Used for recursion guards and caching
- Not shared across transactions or users

<sub>Also asked as: How long does a static variable live in Apex? · Are static variables shared between transactions? · static variable lifetime trigger context · Why do we use static variables in trigger handlers?</sub>

### How do you write a trigger on a platform event?
*Senior (7–10 yrs) · code* · `trg-029`

A platform event trigger only supports after insert, because publishing an event is like inserting it. It runs asynchronously in its own transaction, and by default as the Automated Process user rather than the publisher, so I set owner fields explicitly if they matter. It can receive large batches, so I keep it bulk-safe. For resilience, I can use EventBus.TriggerContext setResumeCheckpoint, or throw EventBus.RetryableException, so events are retried instead of lost. For example, in my trigger on Order_Event__e, each event becomes an order log record. I build all the log records in one list and insert them once, however many events arrive in the batch.

- Only after insert
- Runs async, by default as Automated Process user
- Bulk-safe: batches can be large
- setResumeCheckpoint / RetryableException for resilience

```java
trigger OrderEventTrigger on Order_Event__e (after insert) {
    OrderEventHandler.handle(Trigger.new);
}

public without sharing class OrderEventHandler {
    public static void handle(List<Order_Event__e> events) {
        List<Order_Log__c> logs = new List<Order_Log__c>();
        for (Order_Event__e evt : events) {
            logs.add(new Order_Log__c(
                Order_Number__c = evt.Order_Number__c,
                Status__c = evt.Status__c
            ));
        }
        insert logs;
    }
}
```

<sub>Also asked as: Write a platform event subscriber trigger · Which events does a platform event trigger support? · platform event trigger after insert example · Which user does a platform event trigger run as?</sub>

### What are the best practices for writing Apex triggers?
*Fresher (0–2 yrs) · concept* · `trg-030`

The main ones: one trigger per object, with a thin trigger that calls a handler class. Bulkify everything, with no SOQL or DML inside loops, using Sets and Maps. Use before triggers for same-record updates and validation, and after triggers for related records. Only process records whose relevant fields changed, by comparing with oldMap. For example, if my logic reacts to an Opportunity's Stage, I skip records where someone only edited the Description. Prevent recursion with a static Set of Ids, not a Boolean. Never hard-code Ids. Move callouts and heavy work to Queueables. Add a bypass switch, and write bulk tests with 200 records.

- One thin trigger per object + handler
- Bulkify: no SOQL/DML in loops
- Before for same record, after for related records
- Check field changes, Id-based recursion guard, no hard-coded Ids
- Async for callouts, bypass switch, bulk tests

<sub>Also asked as: Tell me trigger best practices · What rules do you follow when writing a trigger? · apex trigger best practices list · How do you write a good trigger?</sub>

### How do you handle errors when your trigger updates related records?
*Mid (3–6 yrs) · code* · `trg-031`

I use Database.update with allOrNone set to false, then loop through the SaveResults. The results come back in the same order as the list I passed in, so for each failure I can find the related record and map it back to the record that triggered it. Then I either call addError on that triggering record, so the user sees a clear message instead of a generic exception, or I log it to a custom error object if the main save should still succeed. For example, an Account update pushes a change down to its Contacts. If one Contact fails, I trace it back to its Account and block just that Account with a clear message, while the other Accounts in the batch save normally.

- Database.update(list, false) returns SaveResults
- Results are in the same order as the input list
- Map failure back to triggering record and addError
- Or log to a custom object if the main save should continue

```java
trigger AccountTrigger on Account (after update) {
    AccountContactSync.syncPhone(Trigger.new, Trigger.oldMap);
}

public with sharing class AccountContactSync {
    public static void syncPhone(List<Account> accounts, Map<Id, Account> oldMap) {
        Map<Id, Account> changed = new Map<Id, Account>();
        for (Account a : accounts) {
            if (a.Phone != oldMap.get(a.Id).Phone) changed.put(a.Id, a);
        }
        if (changed.isEmpty()) return;

        List<Contact> contacts = [
            SELECT Id, AccountId FROM Contact WHERE AccountId IN :changed.keySet()
        ];
        for (Contact c : contacts) {
            c.Account_Phone__c = changed.get(c.AccountId).Phone;
        }
        List<Database.SaveResult> results = Database.update(contacts, false);
        for (Integer i = 0; i < results.size(); i++) {
            if (!results[i].isSuccess()) {
                changed.get(contacts[i].AccountId).addError(
                    'Could not update a related contact: ' + results[i].getErrors()[0].getMessage());
            }
        }
    }
}
```

<sub>Also asked as: How do you show a friendly error when a related update fails in a trigger? · Database update with allOrNone false inside a trigger · trigger error handling save result adderror · What if one child record fails to update in my trigger?</sub>

## Order of Execution

### Explain the order of execution in Salesforce when a record is saved.
*Fresher (0–2 yrs) · concept* · `trg-032`

When a record is saved, Salesforce loads the record and runs system validation, then runs before-save record-triggered flows, then before triggers. Next it re-runs system validation and custom validation rules, then duplicate rules. The record is saved to the database but not committed, and after triggers run. Then come assignment rules, auto-response rules, any remaining workflow rules, escalation rules, processes, and after-save record-triggered flows. After that, entitlement rules, roll-up summary updates on the parent and grandparent, and criteria-based sharing. Finally everything commits, and post-commit work runs, like sending emails and starting queued async jobs. Here's why it matters. If my before trigger sets a Case field and a validation rule checks that field, the rule sees my value, because validation runs after before triggers. But an email from that save only goes out once everything commits.

- System validation -> before-save flows -> before triggers
- Validation rules -> duplicate rules -> save (not committed) -> after triggers
- Assignment, auto-response, workflow, escalation, after-save flows
- Entitlements, roll-ups, sharing -> commit -> post-commit (email, async)

<sub>Also asked as: What is the order of execution? · What happens step by step when I click Save on a record? · order of execution triggers validation rules flows · Walk me through the save order in Salesforce · salesforce order of execution in short</sub>

### Which runs first, a before-save flow or a before trigger?
*Fresher (0–2 yrs) · concept* · `trg-033`

The before-save record-triggered flow runs first, then the before trigger. So if both set the same field, the trigger's value wins because it runs later. On the after side, after triggers run before after-save flows. Say a before-save flow sets an Opportunity's discount to 5 percent and a before trigger sets it to 10. The record saves with 10, and the admin looking at the flow can't work out why. That's exactly the kind of thing you run into when debugging an unexpected value. In practice, I avoid having a flow and a trigger update the same field on the same object, because whoever maintains it next will struggle to work out which one is in control.

- Before-save flow -> before trigger
- After trigger -> after-save flow
- Last writer wins on the same field
- Don't let two automations own one field

<sub>Also asked as: Does a before-save flow run before the Apex trigger? · flow vs trigger which executes first · If a flow and a trigger update the same field, which value wins? · Do after triggers run before after-save flows?</sub>

### If a before trigger sets a field, will validation rules see the new value?
*Mid (3–6 yrs) · scenario* · `trg-034`

Yes. Custom validation rules run after before triggers, so they evaluate the values the trigger set. That means a before trigger can fill in or correct a field so the record passes validation. For example, if a rule requires a Region on Lead and my trigger fills in Region from the country, the rule sees the filled value and the save goes through. It also means a trigger can accidentally cause a validation error the user doesn't understand. Some system checks, like layout-level required fields on a standard UI save, run before the trigger, so a trigger can't help with those. When a validation fails after my change, I check the debug log to see what the trigger set just before the validation step.

- Validation rules run after before triggers
- Trigger can correct data to pass validation
- Layout-required checks from the UI run before the trigger
- Use debug logs to see the values at validation time

<sub>Also asked as: Do validation rules run before or after triggers? · Can a before trigger fix data so the validation rule passes? · validation rule fires after before trigger · Why does my validation rule fail because of a value my trigger set?</sub>

### Where do duplicate rules run in the order of execution?
*Fresher (0–2 yrs) · concept* · `trg-035`

Duplicate rules run after before triggers and custom validation rules, but before the record is saved to the database. If a duplicate rule with a block action finds a match, the save stops there, so after triggers, workflow and after-save flows never run for that record. If the rule allows the save with an alert, the save continues normally. This also means a before trigger can clean data before duplicate matching happens. For example, someone pastes in an email with extra spaces around it. My before trigger trims and standardises it first, so the duplicate rule compares the clean value against existing contacts.

- After before triggers and validation rules
- Before the record is written to the database
- Block action stops the save: no after triggers
- Before trigger can normalise data before matching

<sub>Also asked as: Do duplicate rules run before triggers? · If a duplicate rule blocks a record, do after triggers still run? · duplicate rule order of execution · When are duplicate rules evaluated on save?</sub>

### Your update trigger runs twice for the same record in one transaction, and the org still has a workflow rule with a field update. Why?
*Senior (7–10 yrs) · scenario* · `trg-036`

A workflow field update re-saves the record, and Salesforce runs the before update and after update triggers one more time. Custom validation rules, duplicate rules and flows don't re-run for that pass. An important detail is that Trigger.old in the second run still holds the values from before the original update, not from the first run. Since workflow rules are past end of support, the clean fix is to move that field update into a before-save flow or the before trigger, and make the trigger safe to run twice by checking real changes.

- Workflow field update re-runs before and after update triggers once
- Validation rules, duplicate rules and flows don't re-run
- Trigger.old keeps the values from before the original update
- Migrate workflow field updates to before-save flow or trigger

<sub>Also asked as: Does a workflow field update fire triggers again? · Why does Trigger.old show the original value on the second trigger run? · workflow field update trigger fires twice · Trigger executed again after workflow rule</sub>

### Why does the Account trigger fire when you only update an Opportunity?
*Mid (3–6 yrs) · scenario* · `trg-037`

Usually because of roll-up summary fields. Account can have roll-up summaries on Opportunity, so after the Opportunity saves, Salesforce recalculates the roll-up on the parent Account, and the parent goes through its own save procedure, which runs Account triggers and other automation. If that changes the Account and the grandparent has a roll-up, it happens again one level up. Cross-object workflow field updates have the same effect. So the parent trigger should only act when its own relevant fields actually change.

- Roll-up recalculation saves the parent record
- Parent triggers and automation run
- Can cascade to the grandparent
- Parent trigger should check real field changes

<sub>Also asked as: Child record update fires parent trigger, why? · Roll-up summary causing parent trigger to run · opportunity update account trigger executing · Does a roll-up summary recalculation run the parent's automation?</sub>

### You enqueue a Queueable from a trigger and the transaction fails later in the save. Does the job still run?
*Senior (7–10 yrs) · scenario* · `trg-038`

No. Async jobs like Queueables and future methods only start after the transaction commits, which is the last step in the order of execution. If anything later in the save fails, like an after-save flow error or an exception during the parent roll-up update, the whole transaction rolls back and the enqueued job is discarded. The same applies to emails sent from Apex. Say my trigger enqueues a job to send a new Order to the warehouse system, and then an after-save flow throws an error. The Order isn't saved, and the warehouse never hears about it. That's actually the benefit: an external system only hears about committed data. If I need something to happen even when the save fails, like error logging, I'd publish a platform event configured to publish immediately.

- Async jobs and emails run post-commit
- Rollback discards enqueued jobs and emails
- Integrations only see committed data
- Publish-immediately platform events survive rollback

<sub>Also asked as: Are async jobs started before or after commit? · If the transaction rolls back is the future method still called? · post commit logic order of execution emails queueable · Will an email sent from a trigger go out if the save fails?</sub>

### A field your trigger sets keeps ending up with a different value after save. How would you debug it?
*Mid (3–6 yrs) · scenario* · `trg-039`

I'd think through the order of execution, because something running after my trigger is probably overwriting it. The candidates are an after-save flow, a legacy workflow field update or process, an assignment rule if it's the owner field, another trigger on the same object, or a parent roll-up re-save. For example, my before trigger sets a Lead's status to Working, but an old after-save flow quietly resets it to Open. I'd set a debug log with Apex and Workflow at fine levels, reproduce the save, and follow the log to see which automation last touched the field. Then I'd consolidate so only one automation owns that field.

- Something later in the save order is overwriting it
- Check after-save flows, workflow, assignment rules, other triggers
- Debug log with Apex and Workflow at fine levels
- Make one automation own the field

<sub>Also asked as: Something is overwriting the value my trigger set · Trigger value not saved, how to find which automation changed it · field updated by trigger gets overwritten by flow · How do you debug conflicting automation on one field?</sub>

### If there are two triggers on the same object, which one runs first?
*Fresher (0–2 yrs) · concept* · `trg-040`

Salesforce doesn't guarantee the order. If two triggers exist for the same object and event, either can run first, and the order can change. Say an org has a ContactTrigger and an older ContactEmailTrigger, both on before insert. Sometimes the email cleanup runs first, sometimes second, and you get results you can't reliably reproduce. That's the main reason for the one-trigger-per-object pattern. A single trigger calls a handler, and inside the handler I call methods in exactly the order I want. If I find multiple triggers on an object in an existing org, I plan to merge them into one trigger and handler, with tests in place first so behaviour doesn't change.

- Order is not guaranteed
- Use one trigger per object
- Control order inside the handler

<sub>Also asked as: Can we control the order of triggers on one object? · Multiple triggers same event execution order · two before insert triggers on account which runs first · Is trigger execution order guaranteed?</sub>

### How do you control the order of multiple record-triggered flows on the same object?
*Mid (3–6 yrs) · concept* · `trg-041`

Record-triggered flows have a Trigger Order setting in their start configuration. It's a number from 1 to 2,000, and flows on the same object and timing run from the lowest number up. Flows with no value run after those numbered 1 to 1,000 and before those numbered 1,001 to 2,000. For example, if one after-save flow creates a record that a second after-save flow depends on, I give the first one 10 and the second one 20. It only orders flows within the same timing, so an after-save flow can never be moved ahead of before-save flows or Apex triggers. I set an explicit order whenever two flows depend on each other, and I don't rely on any default ordering for flows without a value. Many teams also limit the number of flows per object to keep this simple.

- Trigger Order setting: 1 to 2,000, lowest runs first
- Only orders flows within the same timing
- Can't move flows ahead of Apex triggers
- Set it explicitly when flows depend on each other

<sub>Also asked as: Can I set the order of flows on one object? · What is trigger order in a record-triggered flow? · flow trigger order setting · Which runs first if I have three after-save flows on Account?</sub>

### What is a recursive save and what changes in the order of execution during it?
*Senior (7–10 yrs) · concept* · `trg-042`

A recursive save is when the same record is saved again within the same transaction, for example when an after trigger or an automation updates the record that's currently being saved. Say an after update trigger on Opportunity updates a field on that same Opportunity. That second save is the recursive save. During it, Salesforce skips the later post-save steps for that inner save, such as assignment rules, auto-response rules, workflow and escalation rules, entitlement rules and roll-up recalculation. Triggers do run again, though, which is why recursion guards and change checks matter. The real lesson is to avoid re-updating the same record from an after context when a before context can do it.

- Same record saved again in the same transaction
- Later post-save steps are skipped for the inner save
- Triggers still re-run
- Prefer before-context updates to avoid it

<sub>Also asked as: What happens when the same record is saved twice in one transaction? · Which steps are skipped during a recursive save? · recursive save order of execution · Do assignment rules run again on a recursive save?</sub>

### You set the Case owner in a before insert trigger, but it gets changed after save. Why?
*Mid (3–6 yrs) · scenario* · `trg-043`

Most likely a case assignment rule is overriding it. Assignment rules run after triggers in the order of execution, so if the case is created with assignment rules applied, for example from Web-to-Case, Email-to-Case, the UI checkbox, or Apex with DMLOptions, the rule reassigns the owner after my trigger set it. To fix it, I'd move the routing logic into the assignment rule itself, stop applying the rule for those cases, or decide which one is the single owner of routing. Omni-Channel routing can also change ownership later, so I check that too.

- Assignment rules run after triggers
- Applied by Web-to-Case, Email-to-Case, UI checkbox or DMLOptions
- Pick one owner for routing logic
- Omni-Channel can also reassign

<sub>Also asked as: Case assignment rule overrides trigger owner · Owner set in trigger is not saved on Web-to-Case · why is my trigger owner assignment overwritten · Do assignment rules run after triggers?</sub>

### Why is it better to update the same record in a before trigger instead of an after trigger?
*Fresher (0–2 yrs) · concept* · `trg-044`

Because in a before trigger the record hasn't been saved yet. I just set the field on Trigger.new and it's included in the same save, with no extra DML, no extra query, and no risk of re-firing the trigger. In an after trigger the record is already saved and read-only. Changing it needs another update statement, which uses DML limits, runs the save process again for that record, and can cause recursion. For example, setting a flag on 200 Opportunities in before update costs nothing extra. Doing it in after update means a second update of all 200, and another full trip through their save process. The same reasoning is why before-save flows are much faster than after-save flows for same-record updates.

- Before: set field directly, saved in the same operation
- After: needs extra DML and re-runs the save
- Same logic applies to before-save vs after-save flows

<sub>Also asked as: Why use before trigger for field updates? · Is it bad to update the same record in after trigger? · before trigger no dml needed same record · Why are before-save flows faster than after-save flows?</sub>

## Trigger Scenarios

### Write a trigger to count the number of contacts on an account without using a roll-up summary field.
*Mid (3–6 yrs) · code* · `trg-045`

Contact to Account is a lookup, so I can't use a standard roll-up summary; I maintain a Contact_Count__c field with a trigger. The key is handling every event that changes the count: insert, delete, undelete, and update when AccountId changes, where both the old and new account need recalculating. I collect all affected account Ids and recount with one aggregate query, instead of adding or subtracting, so the value self-corrects. Accounts that end up with no contacts are reset to zero.

- Handle insert, update (reparent), delete, undelete
- On reparent, recalc both old and new parent
- Recount with aggregate query, don't increment
- Default affected parents to 0

```java
trigger ContactTrigger on Contact (after insert, after update, after delete, after undelete) {
    switch on Trigger.operationType {
        when AFTER_INSERT, AFTER_UNDELETE { ContactRollupHandler.fromList(Trigger.new); }
        when AFTER_DELETE { ContactRollupHandler.fromList(Trigger.old); }
        when AFTER_UPDATE { ContactRollupHandler.fromUpdate(Trigger.new, Trigger.oldMap); }
    }
}

public without sharing class ContactRollupHandler {
    public static void fromList(List<Contact> contacts) {
        Set<Id> accountIds = new Set<Id>();
        for (Contact c : contacts) accountIds.add(c.AccountId);
        recalculate(accountIds);
    }

    public static void fromUpdate(List<Contact> newList, Map<Id, Contact> oldMap) {
        Set<Id> accountIds = new Set<Id>();
        for (Contact c : newList) {
            Id oldAccountId = oldMap.get(c.Id).AccountId;
            if (c.AccountId != oldAccountId) {
                accountIds.add(c.AccountId);
                accountIds.add(oldAccountId);
            }
        }
        recalculate(accountIds);
    }

    private static void recalculate(Set<Id> accountIds) {
        accountIds.remove(null);
        if (accountIds.isEmpty()) return;
        Map<Id, Account> updates = new Map<Id, Account>();
        for (Id accId : accountIds) {
            updates.put(accId, new Account(Id = accId, Contact_Count__c = 0));
        }
        for (AggregateResult ar : [
            SELECT AccountId accId, COUNT(Id) total
            FROM Contact WHERE AccountId IN :accountIds GROUP BY AccountId
        ]) {
            updates.get((Id) ar.get('accId')).Contact_Count__c = (Integer) ar.get('total');
        }
        update updates.values();
    }
}
```

<sub>Also asked as: How do you roll up contact count to Account with a trigger? · Custom roll-up on a lookup relationship using Apex · trigger to update number of contacts on account including delete and undelete · What if a contact is moved to another account, how does your roll-up handle it? · count child records on parent lookup trigger</sub>

### Write a trigger to roll up the total amount of child Invoice records onto Account, where Invoice has a lookup to Account.
*Mid (3–6 yrs) · code* · `trg-046`

It's the same pattern as a count roll-up, but with SUM, and I also watch the amount field. I recalculate when an invoice is inserted, deleted or undeleted, when its Amount changes, or when it moves to a different account. I collect the affected parent Ids, run one aggregate SUM query grouped by account, default every affected parent to zero, and update them in one DML. I prefer recalculating from an aggregate over incrementing, because it self-corrects and doesn't drift if a previous transaction failed.

- Recalc on insert, delete, undelete, amount change, reparent
- One aggregate SUM grouped by parent
- Default affected parents to 0
- Recalculate rather than increment to avoid drift

```java
trigger InvoiceTrigger on Invoice__c (after insert, after update, after delete, after undelete) {
    InvoiceRollupHandler.run();
}

public without sharing class InvoiceRollupHandler {
    public static void run() {
        Set<Id> accountIds = new Set<Id>();
        if (Trigger.isInsert || Trigger.isUndelete) {
            for (Invoice__c inv : (List<Invoice__c>) Trigger.new) accountIds.add(inv.Account__c);
        } else if (Trigger.isDelete) {
            for (Invoice__c inv : (List<Invoice__c>) Trigger.old) accountIds.add(inv.Account__c);
        } else if (Trigger.isUpdate) {
            Map<Id, Invoice__c> oldMap = (Map<Id, Invoice__c>) Trigger.oldMap;
            for (Invoice__c inv : (List<Invoice__c>) Trigger.new) {
                Invoice__c old = oldMap.get(inv.Id);
                if (inv.Amount__c != old.Amount__c || inv.Account__c != old.Account__c) {
                    accountIds.add(inv.Account__c);
                    accountIds.add(old.Account__c);
                }
            }
        }
        accountIds.remove(null);
        if (accountIds.isEmpty()) return;

        Map<Id, Account> updates = new Map<Id, Account>();
        for (Id accId : accountIds) updates.put(accId, new Account(Id = accId, Total_Invoiced__c = 0));
        for (AggregateResult ar : [
            SELECT Account__c accId, SUM(Amount__c) total
            FROM Invoice__c WHERE Account__c IN :accountIds GROUP BY Account__c
        ]) {
            Decimal total = (Decimal) ar.get('total');
            updates.get((Id) ar.get('accId')).Total_Invoiced__c = total == null ? 0 : total;
        }
        update updates.values();
    }
}
```

<sub>Also asked as: Sum of child amount on parent with a lookup relationship · How do you build a sum roll-up with Apex? · trigger to calculate total invoice amount on account · Roll-up sum without roll-up summary field</sub>

### Write a trigger to prevent duplicate contacts with the same email address.
*Mid (3–6 yrs) · code* · `trg-047`

I check two sources of duplicates: records already in the database, and records inside the same batch, because an import file can contain the same email twice. In before insert and before update, I collect the new or changed emails, lowercased, query existing contacts with those emails, and add a field error to any match that isn't the same record. I run the check without sharing so private records are found too. Standard duplicate rules are the first choice; I use a trigger when the rule must be strict for every channel.

- Check the database and the current batch
- Only check new or changed emails
- Run without sharing so all records are visible
- Consider standard duplicate rules first

```java
trigger ContactTrigger on Contact (before insert, before update) {
    ContactDuplicateHandler.preventDuplicateEmails(Trigger.new, Trigger.oldMap);
}

public without sharing class ContactDuplicateHandler {
    public static void preventDuplicateEmails(List<Contact> newList, Map<Id, Contact> oldMap) {
        Map<String, Contact> byEmail = new Map<String, Contact>();
        for (Contact c : newList) {
            if (String.isBlank(c.Email)) continue;
            if (oldMap != null && c.Email == oldMap.get(c.Id).Email) continue;
            String key = c.Email.toLowerCase();
            if (byEmail.containsKey(key)) {
                c.Email.addError('This email appears more than once in this batch.');
            } else {
                byEmail.put(key, c);
            }
        }
        if (byEmail.isEmpty()) return;

        for (Contact existing : [SELECT Id, Email FROM Contact WHERE Email IN :byEmail.keySet()]) {
            Contact incoming = byEmail.get(existing.Email.toLowerCase());
            if (incoming != null && incoming.Id != existing.Id) {
                incoming.Email.addError('A contact with this email already exists.');
            }
        }
    }
}
```

<sub>Also asked as: How do you stop duplicate records using a trigger? · Prevent inserting a contact if the email already exists · duplicate check trigger including same batch · What if the Data Loader file itself has the same email twice?</sub>

### Write a trigger to prevent deletion of an account that has open opportunities.
*Fresher (0–2 yrs) · code* · `trg-048`

I use a before delete trigger on Account, because I want to stop the delete before it happens. In a delete trigger the records are in Trigger.old. I collect the account Ids, run one query that finds which of them have at least one opportunity where IsClosed is false, and call addError on those accounts. The error message is shown to the user and the delete is cancelled for those records. The query uses a semi-join, so it's a single SOQL query no matter how many accounts are deleted.

- before delete, records in Trigger.old
- One semi-join query for accounts with open opportunities
- addError on Trigger.old record cancels the delete

```java
trigger AccountTrigger on Account (before delete) {
    AccountDeleteGuard.blockIfOpenOpportunities(Trigger.old);
}

public with sharing class AccountDeleteGuard {
    public static void blockIfOpenOpportunities(List<Account> accounts) {
        Map<Id, Account> byId = new Map<Id, Account>(accounts);
        for (Account blocked : [
            SELECT Id FROM Account
            WHERE Id IN :byId.keySet()
              AND Id IN (SELECT AccountId FROM Opportunity WHERE IsClosed = false)
        ]) {
            byId.get(blocked.Id).addError(
                'You cannot delete an account that has open opportunities.');
        }
    }
}
```

<sub>Also asked as: Stop users deleting accounts with open deals · before delete trigger example on Account · prevent delete account if opportunity is not closed · How do you block a delete in a trigger?</sub>

### Write a trigger that updates all related contacts' mailing address when the account's billing address changes.
*Mid (3–6 yrs) · code* · `trg-049`

I use an after update trigger on Account, because I'm updating other records. First I check which accounts actually had a billing address field change, comparing Trigger.new with oldMap, so a simple name edit doesn't touch thousands of contacts. Then I query the contacts of those accounts in one query, copy the billing fields to the mailing fields, and do one update. If an account can have a very large number of contacts, I'd move the update into a Queueable or batch to stay within the DML row limit.

- after update on Account
- Only accounts whose address changed
- One query, one update
- Large child volumes: move to Queueable or batch

```java
trigger AccountTrigger on Account (after update) {
    AccountAddressSync.syncContacts(Trigger.new, Trigger.oldMap);
}

public with sharing class AccountAddressSync {
    public static void syncContacts(List<Account> accounts, Map<Id, Account> oldMap) {
        Map<Id, Account> changed = new Map<Id, Account>();
        for (Account a : accounts) {
            Account old = oldMap.get(a.Id);
            if (a.BillingStreet != old.BillingStreet || a.BillingCity != old.BillingCity
                    || a.BillingState != old.BillingState || a.BillingPostalCode != old.BillingPostalCode
                    || a.BillingCountry != old.BillingCountry) {
                changed.put(a.Id, a);
            }
        }
        if (changed.isEmpty()) return;

        List<Contact> contacts = [SELECT Id, AccountId FROM Contact WHERE AccountId IN :changed.keySet()];
        for (Contact c : contacts) {
            Account a = changed.get(c.AccountId);
            c.MailingStreet = a.BillingStreet;
            c.MailingCity = a.BillingCity;
            c.MailingState = a.BillingState;
            c.MailingPostalCode = a.BillingPostalCode;
            c.MailingCountry = a.BillingCountry;
        }
        update contacts;
    }
}
```

<sub>Also asked as: Sync account address to contacts with a trigger · When billing address changes on Account, update contacts · trigger to copy account address to child contacts · How do you detect an address change in a trigger?</sub>

### Write a trigger to create a follow-up task when an opportunity is Closed Won.
*Fresher (0–2 yrs) · code* · `trg-050`

I use after insert and after update, because I need the opportunity Id for the task's WhatId. The important part is creating the task only when the stage changes to Closed Won, not on every later edit, so in update I compare with the old stage, and on insert there is no oldMap. I build all tasks in a list, assign them to the opportunity owner with a due date, and insert once.

- after insert + after update (Id needed for WhatId)
- Only when stage changes to Closed Won
- oldMap is null on insert
- Insert all tasks in one DML

```java
trigger OpportunityTrigger on Opportunity (after insert, after update) {
    OpportunityWonHandler.createFollowUps(Trigger.new, Trigger.oldMap);
}

public with sharing class OpportunityWonHandler {
    public static void createFollowUps(List<Opportunity> opps, Map<Id, Opportunity> oldMap) {
        List<Task> tasks = new List<Task>();
        for (Opportunity o : opps) {
            Boolean wasWon = oldMap != null && oldMap.get(o.Id).StageName == 'Closed Won';
            if (o.StageName == 'Closed Won' && !wasWon) {
                tasks.add(new Task(
                    WhatId = o.Id,
                    OwnerId = o.OwnerId,
                    Subject = 'Schedule onboarding call',
                    ActivityDate = Date.today().addDays(2),
                    Priority = 'High'
                ));
            }
        }
        if (!tasks.isEmpty()) insert tasks;
    }
}
```

<sub>Also asked as: Create a task automatically when a deal is won · trigger on opportunity closed won create task · How do you make sure the task is created only once? · After insert after update trigger create activity</sub>

### Write a trigger that populates a field on a contact from its parent account.
*Fresher (0–2 yrs) · code* · `trg-051`

I use a before insert and before update trigger on Contact, so I can set the field directly without DML. I collect the AccountIds, query those accounts once into a Map, and copy the value. On update I only do it when the AccountId changed. If the value just needs to be displayed, a cross-object formula field is better, because it's always current with no code. I'd use a trigger when the value must be stored, for example as a snapshot, or because it's used in filters and indexing where formulas fall short.

- before insert/update, set the field directly
- Query parents once into a Map
- On update, only when AccountId changes
- Formula field is better if it's display-only

```java
trigger ContactTrigger on Contact (before insert, before update) {
    ContactParentCopy.copyIndustry(Trigger.new, Trigger.oldMap);
}

public with sharing class ContactParentCopy {
    public static void copyIndustry(List<Contact> contacts, Map<Id, Contact> oldMap) {
        List<Contact> toSet = new List<Contact>();
        Set<Id> accountIds = new Set<Id>();
        for (Contact c : contacts) {
            Boolean accountChanged = oldMap == null || c.AccountId != oldMap.get(c.Id).AccountId;
            if (c.AccountId != null && accountChanged) {
                toSet.add(c);
                accountIds.add(c.AccountId);
            }
        }
        if (toSet.isEmpty()) return;

        Map<Id, Account> accounts = new Map<Id, Account>(
            [SELECT Id, Industry FROM Account WHERE Id IN :accountIds]
        );
        for (Contact c : toSet) {
            c.Account_Industry__c = accounts.get(c.AccountId)?.Industry;
        }
    }
}
```

<sub>Also asked as: Copy a value from Account to Contact on insert · Populate child field from parent in a trigger · trigger to copy account industry to contact · Why not just use a formula field for this?</sub>

### Users should not be able to edit an opportunity once it's closed, except a few managers. How would you implement it?
*Mid (3–6 yrs) · scenario* · `trg-052`

I'd block updates in a before update trigger when the old version of the opportunity was already closed, and allow it only for users with a custom permission like Edit_Closed_Opportunities, assigned through a permission set. Checking the old value matters, because the update that closes the deal must still go through. A validation rule using PRIORVALUE and the $Permission variable can do the same declaratively, and I'd pick that if the org prefers config. Record types with read-only layouts alone aren't enough, because the API can still edit.

- Check oldMap: was it already closed?
- Custom permission for the allowed managers
- Validation rule with PRIORVALUE and $Permission is an alternative
- Layouts alone don't stop API edits

```java
trigger OpportunityTrigger on Opportunity (before update) {
    ClosedOpportunityLock.enforce(Trigger.new, Trigger.oldMap);
}

public with sharing class ClosedOpportunityLock {
    public static void enforce(List<Opportunity> opps, Map<Id, Opportunity> oldMap) {
        if (FeatureManagement.checkPermission('Edit_Closed_Opportunities')) return;
        for (Opportunity o : opps) {
            if (oldMap.get(o.Id).IsClosed) {
                o.addError('Closed opportunities can only be edited by sales managers.');
            }
        }
    }
}
```

<sub>Also asked as: Restrict editing of records based on stage · Lock closed opportunities from editing · trigger to prevent update when stage is closed won · How do you allow only certain users to bypass a restriction?</sub>

### When a contact is created, set it as the account's primary contact if the account doesn't have one yet. Write the trigger.
*Mid (3–6 yrs) · code* · `trg-053`

I use an after insert trigger on Contact, because I need the new contact's Id. I collect the AccountIds, query only the accounts where Primary_Contact__c is still blank, and for each of those assign the first new contact from the batch. If several contacts for the same account arrive together, the Map ensures only the first one becomes primary. Then I do one update on the accounts. Running it without sharing makes sure the update works even if the user can't edit the parent account directly, if that's the business rule.

- after insert: contact Id needed
- Only accounts with blank primary contact
- First contact in the batch wins per account
- One update on accounts

```java
trigger ContactTrigger on Contact (after insert) {
    PrimaryContactSetter.assign(Trigger.new);
}

public without sharing class PrimaryContactSetter {
    public static void assign(List<Contact> contacts) {
        Set<Id> accountIds = new Set<Id>();
        for (Contact c : contacts) {
            if (c.AccountId != null) accountIds.add(c.AccountId);
        }
        if (accountIds.isEmpty()) return;

        Map<Id, Account> needsPrimary = new Map<Id, Account>([
            SELECT Id FROM Account WHERE Id IN :accountIds AND Primary_Contact__c = null
        ]);
        Map<Id, Account> updates = new Map<Id, Account>();
        for (Contact c : contacts) {
            if (needsPrimary.containsKey(c.AccountId) && !updates.containsKey(c.AccountId)) {
                updates.put(c.AccountId, new Account(Id = c.AccountId, Primary_Contact__c = c.Id));
            }
        }
        if (!updates.isEmpty()) update updates.values();
    }
}
```

<sub>Also asked as: Set primary contact on Account when first contact is inserted · Update parent lookup when child is created · trigger to populate account primary contact · What if two contacts for the same account are inserted together?</sub>

### Write a trigger to keep a count of open cases on each account.
*Mid (3–6 yrs) · code* · `trg-054`

Case to Account is a lookup, so I keep an Open_Case_Count__c field with a trigger on Case. The count changes on insert, delete and undelete, and on update when the Status changes, since that can open or close the case, or when the case moves to another account. I gather all affected account Ids, then recount open cases with one aggregate query where IsClosed is false, set zero for accounts with none, and update once. Because the query runs in the after trigger, it sees the newly saved status.

- Recalc on insert, delete, undelete
- On update: status change or account change
- Aggregate COUNT where IsClosed = false
- After trigger sees the saved values

```java
trigger CaseTrigger on Case (after insert, after update, after delete, after undelete) {
    CaseCountHandler.run();
}

public without sharing class CaseCountHandler {
    public static void run() {
        Set<Id> accountIds = new Set<Id>();
        if (Trigger.isUpdate) {
            Map<Id, Case> oldMap = (Map<Id, Case>) Trigger.oldMap;
            for (Case c : (List<Case>) Trigger.new) {
                Case old = oldMap.get(c.Id);
                if (c.Status != old.Status || c.AccountId != old.AccountId) {
                    accountIds.add(c.AccountId);
                    accountIds.add(old.AccountId);
                }
            }
        } else {
            List<Case> cases = Trigger.isDelete ? (List<Case>) Trigger.old : (List<Case>) Trigger.new;
            for (Case c : cases) accountIds.add(c.AccountId);
        }
        accountIds.remove(null);
        if (accountIds.isEmpty()) return;

        Map<Id, Account> updates = new Map<Id, Account>();
        for (Id accId : accountIds) updates.put(accId, new Account(Id = accId, Open_Case_Count__c = 0));
        for (AggregateResult ar : [
            SELECT AccountId accId, COUNT(Id) total FROM Case
            WHERE AccountId IN :accountIds AND IsClosed = false GROUP BY AccountId
        ]) {
            updates.get((Id) ar.get('accId')).Open_Case_Count__c = (Integer) ar.get('total');
        }
        update updates.values();
    }
}
```

<sub>Also asked as: Count of cases on Account using trigger · Roll up open case count to account · trigger to update number of open cases when case is closed · How do you handle status changes in a case roll-up?</sub>

### When a project record is created with a number of phases, the system should automatically create that many phase child records. How would you do it?
*Fresher (0–2 yrs) · scenario* · `trg-055`

I'd use an after insert trigger on the project, because the children need the parent's Id. For each project I read the number of phases, loop that many times to build Phase__c records with the lookup set, collect everything into one list, and insert once. I'd cap the number with a validation rule or in code, so a typo like 5,000 doesn't blow the DML row limit. If phase names or durations come from a template, I'd store that template in custom metadata rather than hard-coding it.

- after insert: need parent Id
- Build all children in one list, single insert
- Cap the count to protect the DML row limit
- Templates in custom metadata

```java
trigger ProjectTrigger on Project__c (after insert) {
    ProjectPhaseBuilder.createPhases(Trigger.new);
}

public with sharing class ProjectPhaseBuilder {
    private static final Integer MAX_PHASES = 20;

    public static void createPhases(List<Project__c> projects) {
        List<Phase__c> phases = new List<Phase__c>();
        for (Project__c p : projects) {
            Integer count = p.Number_of_Phases__c == null ? 0 : p.Number_of_Phases__c.intValue();
            for (Integer i = 1; i <= Math.min(count, MAX_PHASES); i++) {
                phases.add(new Phase__c(Project__c = p.Id, Name = 'Phase ' + i, Sequence__c = i));
            }
        }
        if (!phases.isEmpty()) insert phases;
    }
}
```

<sub>Also asked as: Auto-create child records based on a number field · Create N child records when parent is inserted · trigger to create related records after insert · How do you avoid creating too many child records?</sub>

### Write a trigger to make sure each account has only one primary contact.
*Senior (7–10 yrs) · code* · `trg-056`

I validate in a before insert and before update trigger on Contact. First I check the batch itself: if two incoming contacts for the same account are both primary, the second gets an error. Then I query existing primary contacts for those accounts, excluding records that are in this batch because their new values are already in memory, and if one exists, the incoming primary gets an error. The alternative design is to automatically uncheck the old primary in an after trigger; I'd confirm with the business which behaviour they want.

- Check within the batch first
- Then query existing primaries, excluding batch records
- Field-level addError on Is_Primary__c
- Alternative: auto-uncheck the previous primary

```java
trigger ContactTrigger on Contact (before insert, before update) {
    PrimaryContactValidator.validate(Trigger.new);
}

public without sharing class PrimaryContactValidator {
    public static void validate(List<Contact> contacts) {
        Set<Id> batchIds = new Set<Id>();
        Map<Id, Contact> primaryByAccount = new Map<Id, Contact>();
        for (Contact c : contacts) {
            if (c.Id != null) batchIds.add(c.Id);
            if (!c.Is_Primary__c || c.AccountId == null) continue;
            if (primaryByAccount.containsKey(c.AccountId)) {
                c.Is_Primary__c.addError('Only one primary contact is allowed per account.');
            } else {
                primaryByAccount.put(c.AccountId, c);
            }
        }
        if (primaryByAccount.isEmpty()) return;

        for (Contact existing : [
            SELECT Id, AccountId FROM Contact
            WHERE AccountId IN :primaryByAccount.keySet()
              AND Is_Primary__c = true AND Id NOT IN :batchIds
        ]) {
            primaryByAccount.get(existing.AccountId).Is_Primary__c.addError(
                'This account already has a primary contact.');
        }
    }
}
```

<sub>Also asked as: Only one contact per account can be marked primary · Validate a single primary child record per parent · trigger to allow only one primary contact checkbox per account · How do you handle duplicates inside the same batch and in the database?</sub>

### How would you prevent users from changing the owner of an account, except for specific users?
*Fresher (0–2 yrs) · scenario* · `trg-057`

In a before update trigger, I compare OwnerId with the old value from oldMap, and if it changed and the user doesn't have a custom permission like Change_Account_Owner, I add an error on the OwnerId field. Ownership transfers fire update triggers, so this covers the Change Owner button, list views and the API. A validation rule with ISCHANGED on OwnerId and $Permission does the same declaratively, which I'd prefer if there's no other Apex on the object. The permission check keeps it flexible without hard-coding profile names.

- Compare OwnerId with oldMap in before update
- Allow users with a custom permission
- Covers UI, list views and API
- Validation rule with ISCHANGED is the declarative option

```java
trigger AccountTrigger on Account (before update) {
    AccountOwnerGuard.preventOwnerChange(Trigger.new, Trigger.oldMap);
}

public with sharing class AccountOwnerGuard {
    public static void preventOwnerChange(List<Account> accounts, Map<Id, Account> oldMap) {
        if (FeatureManagement.checkPermission('Change_Account_Owner')) return;
        for (Account a : accounts) {
            if (a.OwnerId != oldMap.get(a.Id).OwnerId) {
                a.OwnerId.addError('You are not allowed to change the account owner.');
            }
        }
    }
}
```

<sub>Also asked as: Stop owner change on Account using trigger · Prevent record owner change · trigger to restrict ownership transfer · Validation rule or trigger to block owner change?</sub>

### How would you keep a field in sync between two objects in both directions without causing recursion?
*Senior (7–10 yrs) · code* · `trg-058`

Each object gets an after update trigger that pushes the changed value to the other, and two things stop the loop. Say an Account's phone number has to stay in sync with a phone field on a related custom object. First, each side only updates records whose value is actually different, so when the change echoes back, there's nothing to do. Second, a static flag marks that a sync DML is in progress. I set it just before the DML and reset it in a finally block, so the other trigger skips the echo. This flag is different from a 'run once' Boolean, because it's only true during the sync DML, so later updates still sync.

- Only update when the value actually differs
- Static in-progress flag around the sync DML only
- Reset the flag in finally
- Not the same as a run-once Boolean

```java
public class SyncGuard {
    public static Boolean inProgress = false;
    public static void updateWithoutEcho(List<SObject> records) {
        if (records.isEmpty()) return;
        inProgress = true;
        try { update records; } finally { inProgress = false; }
    }
}

trigger AccountTrigger on Account (after update) {
    if (!SyncGuard.inProgress) TierSyncHandler.accountToProfile(Trigger.new, Trigger.oldMap);
}

trigger CustomerProfileTrigger on Customer_Profile__c (after update) {
    if (!SyncGuard.inProgress) TierSyncHandler.profileToAccount(Trigger.new, Trigger.oldMap);
}

public without sharing class TierSyncHandler {
    public static void accountToProfile(List<Account> accounts, Map<Id, Account> oldMap) {
        Map<Id, String> tierByAccount = new Map<Id, String>();
        for (Account a : accounts) {
            if (a.Tier__c != oldMap.get(a.Id).Tier__c) tierByAccount.put(a.Id, a.Tier__c);
        }
        if (tierByAccount.isEmpty()) return;
        List<Customer_Profile__c> changed = new List<Customer_Profile__c>();
        for (Customer_Profile__c p : [SELECT Id, Account__c, Tier__c FROM Customer_Profile__c
                                      WHERE Account__c IN :tierByAccount.keySet()]) {
            String tier = tierByAccount.get(p.Account__c);
            if (p.Tier__c != tier) { p.Tier__c = tier; changed.add(p); }
        }
        SyncGuard.updateWithoutEcho(changed);
    }

    public static void profileToAccount(List<Customer_Profile__c> profiles, Map<Id, Customer_Profile__c> oldMap) {
        Map<Id, Account> changed = new Map<Id, Account>();
        for (Customer_Profile__c p : profiles) {
            if (p.Account__c != null && p.Tier__c != oldMap.get(p.Id).Tier__c) {
                changed.put(p.Account__c, new Account(Id = p.Account__c, Tier__c = p.Tier__c));
            }
        }
        SyncGuard.updateWithoutEcho(changed.values());
    }
}
```

<sub>Also asked as: Two-way sync between Account and a custom object · Bidirectional field sync triggers · trigger sync two objects recursion · Object A updates object B and B updates A, how do you stop the loop?</sub>

### Give an example of trigger recursion and explain how you would fix it.
*Mid (3–6 yrs) · scenario* · `trg-059`

A classic case: an after update trigger on Account updates the related contacts, and a trigger on Contact updates a summary field back on the Account. That Account update fires the Account trigger again, which updates the contacts again, until you hit 'maximum trigger depth exceeded' or a governor limit. My fixes, in order: first, only act when the relevant field actually changed, by comparing with oldMap, since the second pass usually has no real change. Second, track processed Ids in a static Set. Third, question the design: a formula or before trigger may avoid the round trip.

- Account -> Contact -> Account loop
- Ends in maximum trigger depth or limit errors
- Fix 1: field-change checks with oldMap
- Fix 2: static Set<Id>; Fix 3: rethink the design

```java
for (Account a : newList) {
    if (a.Rating == oldMap.get(a.Id).Rating) continue; // no real change, stop the loop
    changedIds.add(a.Id);
}
```

<sub>Also asked as: What is a recursive trigger, give a real example · Maximum trigger depth exceeded, what causes it? · explain trigger recursion with account and contact · How did you solve a recursion issue in a trigger?</sub>

### Write a trigger that sends a Closed Won opportunity to an external ERP system.
*Mid (3–6 yrs) · code* · `trg-060`

Callouts can't run synchronously in a trigger, so the trigger collects the Ids of opportunities that just moved to Closed Won and enqueues one Queueable for the whole batch, not one per record, because there's a limit on jobs enqueued per transaction. The Queueable implements Database.AllowsCallouts, re-queries the records, and posts them through a Named Credential, so no endpoint or secret is in code. It runs after commit, so the ERP only receives committed data. Failures go to a log object for retry.

- Collect Ids, enqueue one Queueable per trigger run
- Queueable implements Database.AllowsCallouts
- Named Credential for endpoint and auth
- Runs after commit; log failures

```java
trigger OpportunityTrigger on Opportunity (after update) {
    OpportunityErpHandler.afterUpdate(Trigger.new, Trigger.oldMap);
}

public with sharing class OpportunityErpHandler {
    public static void afterUpdate(List<Opportunity> opps, Map<Id, Opportunity> oldMap) {
        Set<Id> wonIds = new Set<Id>();
        for (Opportunity o : opps) {
            if (o.StageName == 'Closed Won' && oldMap.get(o.Id).StageName != 'Closed Won') {
                wonIds.add(o.Id);
            }
        }
        if (!wonIds.isEmpty()) System.enqueueJob(new ErpSyncJob(wonIds));
    }
}

public class ErpSyncJob implements Queueable, Database.AllowsCallouts {
    private Set<Id> oppIds;
    public ErpSyncJob(Set<Id> oppIds) { this.oppIds = oppIds; }

    public void execute(QueueableContext ctx) {
        List<Opportunity> opps = [SELECT Id, Name, Amount, CloseDate, AccountId
                                  FROM Opportunity WHERE Id IN :oppIds];
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:ERP_System/orders');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(opps));
        HttpResponse res = new Http().send(req);
        if (res.getStatusCode() >= 300) {
            insert new Integration_Log__c(Status__c = 'Failed', Message__c = res.getBody().left(1000));
        }
    }
}
```

<sub>Also asked as: Trigger calling a Queueable for a callout · How do you integrate a trigger with an external API? · callout from trigger using queueable apex example · Send data to another system when a record changes</sub>

### You need to load 50,000 records and your trigger must run on them. How do you make sure it doesn't fail?
*Senior (7–10 yrs) · scenario* · `trg-061`

First, the trigger must be fully bulkified: no SOQL or DML in loops, maps keyed by Id, and only processing records whose relevant fields changed. It also helps to know how the load really runs. Each Data Loader batch is its own transaction, so 50,000 records sent in batches of 200 means about 250 separate transactions, each with its own limits. Inside Apex, though, the trigger runs per 200-record chunk with shared limits. I'd test with 200 and more records, check CPU time and query counts in a debug log, and move heavy related-record work into a Queueable. For a one-time migration, I might bypass non-essential logic using the custom permission for the migration user, then run a batch job afterwards to backfill the derived values.

- Fully bulkified, change-driven logic
- Each loader batch is its own transaction
- Test with 200+ records, watch CPU and SOQL
- Bypass for migration user, backfill with batch

<sub>Also asked as: How do you make a trigger handle large data loads? · Trigger failing during bulk data load, what do you do? · handle 200 plus records in trigger data loader · Preparing triggers for a data migration</sub>

### How do you detect if a specific field changed in a trigger?
*Fresher (0–2 yrs) · code* · `trg-062`

In an update trigger I compare the new record from Trigger.new with the old one from Trigger.oldMap, using the record Id. If the values differ, the field changed. There's no built-in ISCHANGED function in Apex, so I often write a small helper that takes the field token, which keeps the code clean when I'm checking several fields. On insert there's no old value, so I treat a non-blank value as a change if the business rule needs that. For example, when a Lead's Rating goes from Warm to Hot, my trigger sees that the old and new values differ, stamps the date, and stores Warm as the previous value.

- Compare Trigger.new with Trigger.oldMap.get(Id)
- No ISCHANGED in Apex: write a helper
- On insert there is no old value
- Use SObjectField tokens for reusable checks

```java
trigger LeadTrigger on Lead (before update) {
    LeadRatingTracker.track(Trigger.new, Trigger.oldMap);
}

public with sharing class LeadRatingTracker {
    public static Boolean hasChanged(SObject newRec, SObject oldRec, Schema.SObjectField field) {
        return newRec.get(field) != oldRec.get(field);
    }

    public static void track(List<Lead> leads, Map<Id, Lead> oldMap) {
        for (Lead l : leads) {
            Lead old = oldMap.get(l.Id);
            if (hasChanged(l, old, Lead.Rating)) {
                l.Previous_Rating__c = old.Rating;
                l.Rating_Changed_On__c = System.now();
            }
        }
    }
}
```

<sub>Also asked as: How do you compare old and new values in a trigger? · Field change detection using Trigger.oldMap · trigger only when field value changes · Is there an ISCHANGED in Apex?</sub>

### Write a trigger to standardise data before it's saved, like formatting names and emails on a lead.
*Fresher (0–2 yrs) · code* · `trg-063`

This is a perfect fit for a before insert and before update trigger, because I'm only changing the records being saved, so no DML or query is needed. I trim spaces, set names to proper case, and lowercase the email. Doing this before save also helps duplicate rules match correctly, since they run after before triggers. For very simple rules a before-save flow can do the same, but if there's already a trigger on Lead, I keep it in the handler so all Lead logic is in one place.

- before insert/update: no DML needed
- Trim, proper case, lowercase email
- Helps duplicate rules, which run after before triggers

```java
trigger LeadTrigger on Lead (before insert, before update) {
    LeadFormatter.format(Trigger.new);
}

public with sharing class LeadFormatter {
    public static void format(List<Lead> leads) {
        for (Lead l : leads) {
            l.FirstName = properCase(l.FirstName);
            l.LastName = properCase(l.LastName);
            if (l.Email != null) l.Email = l.Email.trim().toLowerCase();
        }
    }

    private static String properCase(String value) {
        if (String.isBlank(value)) return value;
        return value.trim().toLowerCase().capitalize();
    }
}
```

<sub>Also asked as: Clean up data in a before insert trigger · Capitalize first name and lowercase email in trigger · trigger to format fields before saving · Data normalisation using before trigger</sub>

### Write a trigger that shares a project record with its project manager using Apex managed sharing.
*Senior (7–10 yrs) · code* · `trg-064`

When the object's org-wide default is Private or Public Read Only, I can grant access in code by inserting share records into the object's Share table, like Project__Share. I use a custom Apex sharing reason, so the shares survive owner changes and are clearly mine. In after insert and after update, I create a share for the new manager and delete the share for the old manager when the lookup changes. I insert with allOrNone false, because sharing to the record owner fails and shouldn't block the save.

- Insert into Object__Share with a custom RowCause
- Needs OWD Private or Public Read Only
- Delete old shares when the manager changes
- Partial success insert; handler without sharing

```java
trigger ProjectTrigger on Project__c (after insert, after update) {
    ProjectSharingHandler.syncManagerShares(Trigger.new, (Map<Id, Project__c>) Trigger.oldMap);
}

public without sharing class ProjectSharingHandler {
    public static void syncManagerShares(List<Project__c> projects, Map<Id, Project__c> oldMap) {
        List<Project__Share> toInsert = new List<Project__Share>();
        Set<Id> changedIds = new Set<Id>();
        Set<Id> oldManagerIds = new Set<Id>();
        for (Project__c p : projects) {
            Id oldManager = oldMap == null ? null : oldMap.get(p.Id).Project_Manager__c;
            if (p.Project_Manager__c == oldManager) continue;
            if (oldManager != null) { changedIds.add(p.Id); oldManagerIds.add(oldManager); }
            if (p.Project_Manager__c != null) {
                toInsert.add(new Project__Share(
                    ParentId = p.Id,
                    UserOrGroupId = p.Project_Manager__c,
                    AccessLevel = 'Edit',
                    RowCause = Schema.Project__Share.RowCause.Project_Manager__c));
            }
        }
        if (!changedIds.isEmpty()) {
            delete [SELECT Id FROM Project__Share
                    WHERE ParentId IN :changedIds AND UserOrGroupId IN :oldManagerIds
                      AND RowCause = :Schema.Project__Share.RowCause.Project_Manager__c];
        }
        if (!toInsert.isEmpty()) Database.insert(toInsert, false);
    }
}
```

<sub>Also asked as: Apex sharing from a trigger · Share record with user in lookup field via trigger · create share records project__share apex · How do you remove old shares when the lookup changes?</sub>

### Whenever an opportunity is created, update a 'Last Opportunity Date' field on its account. How would you write it?
*Fresher (0–2 yrs) · scenario* · `trg-065`

I use an after insert trigger on Opportunity, since I'm updating a different record. I loop through the new opportunities and put an Account with just the Id and the date into a Map keyed by AccountId. The Map automatically de-duplicates, so if 50 opportunities in the batch belong to one account, that account is updated once, which also avoids the 'duplicate id in list' error. Then I update the map values in one DML. Building new Account instances means I don't need to query the accounts at all.

- after insert on the child
- Map keyed by AccountId de-duplicates parents
- Avoids duplicate Id in list error
- No query needed: new Account(Id = ...)

```java
trigger OpportunityTrigger on Opportunity (after insert) {
    AccountOpportunityStamp.stamp(Trigger.new);
}

public without sharing class AccountOpportunityStamp {
    public static void stamp(List<Opportunity> opps) {
        Map<Id, Account> updates = new Map<Id, Account>();
        for (Opportunity o : opps) {
            if (o.AccountId != null) {
                updates.put(o.AccountId, new Account(Id = o.AccountId, Last_Opportunity_Date__c = Date.today()));
            }
        }
        if (!updates.isEmpty()) update updates.values();
    }
}
```

<sub>Also asked as: Update parent field when child is inserted · Stamp a date on Account when a new Opportunity is added · trigger to update account when opportunity created · How do you avoid updating the same account twice in one batch?</sub>

### Write a trigger that closes all child cases when the parent case is closed.
*Mid (3–6 yrs) · code* · `trg-066`

I use an after update trigger on Case and only look at cases whose Status just changed to Closed. I collect their Ids, query open child cases where ParentId is in that set, set their Status to Closed, and update them in one DML. That update fires the same trigger for the children, which naturally closes grandchildren too, but each level only processes records whose status actually changed, so it ends cleanly. For very deep hierarchies I'd keep the trigger depth limit in mind.

- after update, only status changed to Closed
- Query open children by ParentId once
- Children re-fire the trigger: handles grandchildren
- Change check stops the cascade

```java
trigger CaseTrigger on Case (after update) {
    ChildCaseCloser.closeChildren(Trigger.new, Trigger.oldMap);
}

public with sharing class ChildCaseCloser {
    public static void closeChildren(List<Case> cases, Map<Id, Case> oldMap) {
        Set<Id> closedParentIds = new Set<Id>();
        for (Case c : cases) {
            if (c.Status == 'Closed' && oldMap.get(c.Id).Status != 'Closed') {
                closedParentIds.add(c.Id);
            }
        }
        if (closedParentIds.isEmpty()) return;

        List<Case> children = [SELECT Id FROM Case
                               WHERE ParentId IN :closedParentIds AND IsClosed = false];
        for (Case child : children) {
            child.Status = 'Closed';
        }
        update children;
    }
}
```

<sub>Also asked as: Close related child cases automatically · Parent case closed, update child cases using trigger · trigger on case parentid close children · Cascade a status change to child records</sub>

### An account should not have more than five contacts. How would you enforce it?
*Mid (3–6 yrs) · scenario* · `trg-067`

I'd enforce it in a before insert and before update trigger on Contact, the update part covering contacts moved to a different account. I query the current contact count per account with one aggregate query, then loop through the incoming contacts, add each one to the running count for its account, and add an error on any contact that pushes the count over five. Counting the batch and the database together is the key, because ten contacts for one account could arrive in a single import.

- before insert and before update (reparent)
- Aggregate count of existing contacts
- Add batch records to the running count
- Limit value can live in custom metadata

```java
trigger ContactTrigger on Contact (before insert, before update) {
    ContactLimitValidator.validate(Trigger.new, Trigger.oldMap);
}

public without sharing class ContactLimitValidator {
    private static final Integer MAX_CONTACTS = 5;

    public static void validate(List<Contact> contacts, Map<Id, Contact> oldMap) {
        List<Contact> incoming = new List<Contact>();
        Set<Id> accountIds = new Set<Id>();
        for (Contact c : contacts) {
            Boolean newToAccount = oldMap == null || c.AccountId != oldMap.get(c.Id).AccountId;
            if (c.AccountId != null && newToAccount) {
                incoming.add(c);
                accountIds.add(c.AccountId);
            }
        }
        if (incoming.isEmpty()) return;

        Map<Id, Integer> countByAccount = new Map<Id, Integer>();
        for (AggregateResult ar : [SELECT AccountId accId, COUNT(Id) total FROM Contact
                                   WHERE AccountId IN :accountIds GROUP BY AccountId]) {
            countByAccount.put((Id) ar.get('accId'), (Integer) ar.get('total'));
        }
        for (Contact c : incoming) {
            Integer current = countByAccount.containsKey(c.AccountId) ? countByAccount.get(c.AccountId) : 0;
            if (current >= MAX_CONTACTS) {
                c.addError('An account can have at most ' + MAX_CONTACTS + ' contacts.');
            } else {
                countByAccount.put(c.AccountId, current + 1);
            }
        }
    }
}
```

<sub>Also asked as: Limit the number of child records per parent · Trigger to restrict max contacts on account · prevent more than 5 contacts per account · How do you count records in the batch and in the database together?</sub>

### When an opportunity is Closed Won, create a Project record and copy the opportunity products to project line items. Write the trigger.
*Mid (3–6 yrs) · code* · `trg-068`

In an after update trigger I pick opportunities that just moved to Closed Won and don't already have a project, so re-saving doesn't create duplicates. I insert the projects first, building a Map from opportunity Id to the new project, because after insert the projects have Ids. Then I query the opportunity line items for those opportunities in one query and create Project_Item__c records linked to the right project, and insert them in a second DML. Two DMLs total regardless of batch size.

- Only newly won opportunities without a project
- Insert parents first, map opp Id to project
- One query for line items, one insert for children
- Constant number of SOQL and DML

```java
trigger OpportunityTrigger on Opportunity (after update) {
    ProjectFromOpportunity.create(Trigger.new, Trigger.oldMap);
}

public with sharing class ProjectFromOpportunity {
    public static void create(List<Opportunity> opps, Map<Id, Opportunity> oldMap) {
        Set<Id> wonIds = new Set<Id>();
        for (Opportunity o : opps) {
            if (o.StageName == 'Closed Won' && oldMap.get(o.Id).StageName != 'Closed Won') wonIds.add(o.Id);
        }
        if (wonIds.isEmpty()) return;
        for (Project__c existing : [SELECT Opportunity__c FROM Project__c WHERE Opportunity__c IN :wonIds]) {
            wonIds.remove(existing.Opportunity__c);
        }
        if (wonIds.isEmpty()) return;

        Map<Id, Project__c> projectByOpp = new Map<Id, Project__c>();
        for (Opportunity o : opps) {
            if (wonIds.contains(o.Id)) {
                projectByOpp.put(o.Id, new Project__c(Name = o.Name, Opportunity__c = o.Id, Account__c = o.AccountId));
            }
        }
        insert projectByOpp.values();

        List<Project_Item__c> items = new List<Project_Item__c>();
        for (OpportunityLineItem oli : [SELECT OpportunityId, Product2Id, Quantity, UnitPrice
                                        FROM OpportunityLineItem WHERE OpportunityId IN :wonIds]) {
            items.add(new Project_Item__c(
                Project__c = projectByOpp.get(oli.OpportunityId).Id,
                Product__c = oli.Product2Id,
                Quantity__c = oli.Quantity,
                Unit_Price__c = oli.UnitPrice));
        }
        if (!items.isEmpty()) insert items;
    }
}
```

<sub>Also asked as: Copy opportunity line items to a custom object · Create parent and child records from a trigger · trigger closed won create project with products · How do you link newly inserted parents to their children in one transaction?</sub>

### When an account is deleted, delete its related custom child records that use a lookup relationship. Write the trigger.
*Fresher (0–2 yrs) · code* · `trg-069`

With a master-detail relationship Salesforce deletes children automatically, but with a lookup it normally just clears the field. So I use a before delete trigger on Account, collect the account Ids from Trigger.old, query the child Invoice__c records, and delete them in one DML. I do it in before delete because by after delete the lookup on the children may already be cleared, so the query would find nothing. If the account delete fails, the whole transaction rolls back and the children come back too.

- Lookup children aren't deleted automatically
- Use before delete: lookup may be cleared by after delete
- One query, one delete
- Rollback restores children if the parent delete fails

```java
trigger AccountTrigger on Account (before delete) {
    AccountChildCleanup.deleteInvoices(Trigger.oldMap.keySet());
}

public with sharing class AccountChildCleanup {
    public static void deleteInvoices(Set<Id> accountIds) {
        List<Invoice__c> invoices = [SELECT Id FROM Invoice__c WHERE Account__c IN :accountIds];
        if (!invoices.isEmpty()) delete invoices;
    }
}
```

<sub>Also asked as: Cascade delete for lookup relationship using trigger · Delete child records when parent is deleted · trigger before delete delete related records · Why use before delete and not after delete here?</sub>

### When a high-priority case is created, the case owner must get an email. Would you do it in a trigger, and how?
*Mid (3–6 yrs) · scenario* · `trg-070`

My first choice is a record-triggered flow with an email alert, because it's simple and admin-friendly. If it must be in Apex, I use an after insert trigger, build one SingleEmailMessage per case, only for owners that are users since a queue can't be a target object, set saveAsActivity to false, and send them all in one Messaging.sendEmail call to respect the limit on sendEmail calls per transaction. The emails go out only after the transaction commits, so a failed save sends nothing.

- Flow email alert is the simpler option
- Build all messages, one sendEmail call
- Skip queue owners; setSaveAsActivity(false) for users
- Emails are sent after commit

```java
trigger CaseTrigger on Case (after insert) {
    CaseAlertHandler.notifyOwners(Trigger.new);
}

public with sharing class CaseAlertHandler {
    public static void notifyOwners(List<Case> cases) {
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
        for (Case c : cases) {
            if (c.Priority == 'High' && c.OwnerId.getSObjectType() == User.SObjectType) {
                Messaging.SingleEmailMessage m = new Messaging.SingleEmailMessage();
                m.setTargetObjectId(c.OwnerId);
                m.setSaveAsActivity(false);
                m.setSubject('High priority case ' + c.CaseNumber);
                m.setPlainTextBody('A high priority case was assigned to you: ' + c.Subject);
                emails.add(m);
            }
        }
        if (!emails.isEmpty()) Messaging.sendEmail(emails);
    }
}
```

<sub>Also asked as: Send email from Apex trigger · How do you send emails in bulk from a trigger? · trigger send email notification Messaging.SingleEmailMessage · Email alert vs Apex email for notifications</sub>

### Sales reps should not be able to close an opportunity as won if it has no products. How would you enforce it?
*Fresher (0–2 yrs) · scenario* · `trg-071`

Opportunity has a read-only checkbox, HasOpportunityLineItem, which is true when it has at least one product, so I don't even need a query. In a before update trigger, if the stage is changing to Closed Won and HasOpportunityLineItem is false, I add an error on the StageName field. Because the field is on the record itself, a validation rule can do this too, which I'd prefer if no trigger exists on Opportunity. I'd include before insert as well if reps can create already-won opportunities.

- HasOpportunityLineItem: no query needed
- Check only when the stage changes to Closed Won
- A validation rule can do the same
- Add before insert if needed

```java
trigger OpportunityTrigger on Opportunity (before update) {
    OpportunityProductCheck.requireProducts(Trigger.new, Trigger.oldMap);
}

public with sharing class OpportunityProductCheck {
    public static void requireProducts(List<Opportunity> opps, Map<Id, Opportunity> oldMap) {
        for (Opportunity o : opps) {
            Boolean closingWon = o.StageName == 'Closed Won' && oldMap.get(o.Id).StageName != 'Closed Won';
            if (closingWon && !o.HasOpportunityLineItem) {
                o.StageName.addError('Add at least one product before closing this opportunity as won.');
            }
        }
    }
}
```

<sub>Also asked as: Prevent Closed Won without opportunity line items · Validate that opportunity has products before closing · trigger hasopportunitylineitem closed won · Can a validation rule check if products exist?</sub>

### You need to set Account Rating to Hot when Annual Revenue is above a threshold. Would you use a trigger or a flow?
*Fresher (0–2 yrs) · scenario* · `trg-072`

I'd use a before-save record-triggered flow. It's a same-record field update with a simple condition, which is exactly what before-save flows are fast and good at, and an admin can change it later without a deployment. I'd keep the threshold in custom metadata or a custom label, not hard-coded. I'd only put it in Apex if Account already has a trigger handler and the team's standard is to keep all Account logic in code, so automation isn't split across tools on one object.

- Same-record, simple condition: before-save flow
- Admin-maintainable, no deployment for changes
- Threshold in custom metadata or label
- Apex only if the object's standard is code

<sub>Also asked as: Is this a trigger use case or a flow use case? · Simple field update on same record, trigger or flow? · set rating based on annual revenue · When is a trigger overkill?</sub>

### Write a trigger that creates an audit record whenever important opportunity fields change.
*Mid (3–6 yrs) · code* · `trg-073`

Standard field history tracking covers most needs, so I'd only build this when we need more fields than it allows, custom retention, or reporting logic. In an after update trigger, I keep a list of the fields to track as SObjectField tokens, loop through each record and each field, and when old and new values differ I add an Opportunity_Audit__c record with the field name, old value and new value. Everything is inserted in one DML. The tracked field list could also come from custom metadata.

- Consider standard field history tracking first
- after update, compare old and new per field
- Field list as SObjectField tokens or custom metadata
- One insert for all audit rows

```java
trigger OpportunityTrigger on Opportunity (after update) {
    OpportunityAuditLogger.log(Trigger.new, Trigger.oldMap);
}

public without sharing class OpportunityAuditLogger {
    private static final List<Schema.SObjectField> TRACKED = new List<Schema.SObjectField>{
        Opportunity.StageName, Opportunity.Amount, Opportunity.CloseDate, Opportunity.OwnerId
    };

    public static void log(List<Opportunity> opps, Map<Id, Opportunity> oldMap) {
        List<Opportunity_Audit__c> audits = new List<Opportunity_Audit__c>();
        for (Opportunity o : opps) {
            Opportunity old = oldMap.get(o.Id);
            for (Schema.SObjectField f : TRACKED) {
                if (o.get(f) != old.get(f)) {
                    audits.add(new Opportunity_Audit__c(
                        Opportunity__c = o.Id,
                        Field__c = String.valueOf(f),
                        Old_Value__c = String.valueOf(old.get(f)),
                        New_Value__c = String.valueOf(o.get(f))));
                }
            }
        }
        if (!audits.isEmpty()) insert audits;
    }
}
```

<sub>Also asked as: Track field changes in a custom audit object · Custom field history tracking using trigger · trigger to log old and new values · When would you build custom history instead of field history tracking?</sub>

### Write a trigger that records the date and previous stage whenever an opportunity's stage changes.
*Fresher (0–2 yrs) · code* · `trg-074`

Because I'm only updating the opportunity being saved, I use a before insert and before update trigger, with no DML. On insert I stamp today's date for the starting stage. On update I compare StageName with the old value from oldMap, and if it changed I copy the old stage into Previous_Stage__c and set Stage_Changed_Date__c to today. This gives reps and reports a quick way to see how long a deal has sat in its current stage.

- before insert/update, no DML
- Compare with oldMap to detect the change
- Store old value before it's lost

```java
trigger OpportunityTrigger on Opportunity (before insert, before update) {
    OpportunityStageStamp.stamp(Trigger.new, Trigger.oldMap);
}

public with sharing class OpportunityStageStamp {
    public static void stamp(List<Opportunity> opps, Map<Id, Opportunity> oldMap) {
        for (Opportunity o : opps) {
            if (oldMap == null) {
                o.Stage_Changed_Date__c = Date.today();
                continue;
            }
            Opportunity old = oldMap.get(o.Id);
            if (o.StageName != old.StageName) {
                o.Previous_Stage__c = old.StageName;
                o.Stage_Changed_Date__c = Date.today();
            }
        }
    }
}
```

<sub>Also asked as: Stamp a date when stage changes · Track previous value of a picklist in trigger · trigger to capture stage change date · How do you store the old value of a field?</sub>

### When a user is deactivated, reassign their open accounts to their manager. Write the trigger.
*Senior (7–10 yrs) · code* · `trg-075`

I'd use an after update trigger on User, detect users whose IsActive changed from true to false, and hand their Ids to a Queueable. Updating Account in the same transaction as a User deactivation causes a mixed DML error, because User is a setup object, so the async job gives it a separate transaction. The Queueable reads each user's ManagerId and moves their accounts to the manager, skipping users without one. If one user could own a very large number of records, I'd use Batch Apex instead.

- after update on User: IsActive true to false
- Queueable avoids mixed DML
- Reassign to ManagerId, log users without a manager
- Batch Apex for very large volumes

```java
trigger UserTrigger on User (after update) {
    UserDeactivationHandler.afterUpdate(Trigger.new, Trigger.oldMap);
}

public with sharing class UserDeactivationHandler {
    public static void afterUpdate(List<User> users, Map<Id, User> oldMap) {
        Set<Id> deactivated = new Set<Id>();
        for (User u : users) {
            if (!u.IsActive && oldMap.get(u.Id).IsActive) deactivated.add(u.Id);
        }
        if (!deactivated.isEmpty()) System.enqueueJob(new ReassignAccountsJob(deactivated));
    }
}

public without sharing class ReassignAccountsJob implements Queueable {
    private Set<Id> userIds;
    public ReassignAccountsJob(Set<Id> userIds) { this.userIds = userIds; }

    public void execute(QueueableContext ctx) {
        Map<Id, User> users = new Map<Id, User>([SELECT Id, ManagerId FROM User WHERE Id IN :userIds]);
        List<Account> accounts = [SELECT Id, OwnerId FROM Account WHERE OwnerId IN :userIds];
        List<Account> updates = new List<Account>();
        for (Account a : accounts) {
            Id managerId = users.get(a.OwnerId).ManagerId;
            if (managerId != null) {
                a.OwnerId = managerId;
                updates.add(a);
            }
        }
        update updates;
    }
}
```

<sub>Also asked as: Trigger on User to reassign records · Reassign ownership when user becomes inactive · user trigger mixed dml reassign accounts · How do you avoid mixed DML when updating records from a User trigger?</sub>

### Write a trigger that assigns new leads to a queue based on their state, without hard-coding Ids.
*Mid (3–6 yrs) · code* · `trg-076`

I keep the state-to-queue mapping in custom metadata, Lead_Routing__mdt with State__c and Queue_Name__c, so admins can change it without code. In before insert, I load the mapping with getAll, query the queues by DeveloperName in one query to get their Ids, and set OwnerId on each lead. Using DeveloperName instead of an Id keeps it working in every sandbox. One caution: if the lead is saved with lead assignment rules applied, those run after the trigger and can override this owner.

- Mapping in custom metadata, no hard-coded Ids
- Query Group by DeveloperName, Type = Queue
- Set OwnerId in before insert
- Assignment rules run later and can override

```java
trigger LeadTrigger on Lead (before insert) {
    LeadRouter.assignQueues(Trigger.new);
}

public with sharing class LeadRouter {
    public static void assignQueues(List<Lead> leads) {
        Map<String, String> queueByState = new Map<String, String>();
        for (Lead_Routing__mdt r : Lead_Routing__mdt.getAll().values()) {
            queueByState.put(r.State__c.toUpperCase(), r.Queue_Name__c);
        }
        Map<String, Id> queueIdByName = new Map<String, Id>();
        for (Group g : [SELECT Id, DeveloperName FROM Group
                        WHERE Type = 'Queue' AND DeveloperName IN :queueByState.values()]) {
            queueIdByName.put(g.DeveloperName, g.Id);
        }
        for (Lead l : leads) {
            if (l.State == null) continue;
            Id queueId = queueIdByName.get(queueByState.get(l.State.toUpperCase()));
            if (queueId != null) l.OwnerId = queueId;
        }
    }
}
```

<sub>Also asked as: Lead routing in a before insert trigger · Assign owner based on a mapping in custom metadata · trigger set owner to queue by state · How do you avoid hard-coded queue Ids in a trigger?</sub>

### Your trigger works when you edit one record but fails with 'Too many SOQL queries: 101' during a Data Loader import. What's wrong?
*Mid (3–6 yrs) · scenario* · `trg-077`

Almost certainly there's a query inside a loop, either directly in the trigger or hidden in a helper method called per record. With one record it runs once, but with 200 it runs 200 times and breaks the 100 query limit. I'd check the debug log to see which line repeats, then refactor: collect Ids in a Set, query once into a Map, and process in memory. I'd also check for other triggers or flows on related objects firing in the same transaction, because their queries count too. Then I'd add a 200-record test to prevent regressions.

- SOQL inside a loop, maybe hidden in a helper
- Find the repeating query in the debug log
- Refactor: Set of Ids, one query, Map
- Related automation shares the same limits

<sub>Also asked as: Trigger fails in bulk but works for single record · System.LimitException too many SOQL queries 101 in trigger · trigger not bulkified data loader error · How do you fix a trigger that breaks on mass update?</sub>

### A bulk update fails with 'Apex CPU time limit exceeded' in your trigger. How do you troubleshoot and fix it?
*Senior (7–10 yrs) · scenario* · `trg-078`

The CPU limit is 10 seconds synchronous, and it counts all Apex and declarative automation in the transaction, but not time spent in the database. I'd take a debug log, look at where the time goes, and put Limits.getCpuTime around the suspect sections. Common causes are nested loops over large lists, logic running for records that didn't change, repeated describe calls or JSON work, and several flows and triggers doing overlapping work on the same object. For example, if a trigger loops over 200 Opportunities and, for each one, loops over every line item in the batch to find its children, I replace that inner loop with a Map lookup and most of that work disappears. If the work is still heavy, I'd move the non-urgent part into a Queueable, which gets a 60 second CPU limit.

- 10 s sync / 60 s async CPU limit
- Profile with debug logs and Limits.getCpuTime
- Replace nested loops with Maps, skip unchanged records
- Remove overlapping automation, move heavy work async

<sub>Also asked as: CPU time limit exceeded in trigger, how to fix? · How do you optimise a slow trigger? · apex cpu time limit exceeded bulk update · Trigger performance tuning approach</sub>

### Only certain users should be allowed to delete closed cases. How would you implement it?
*Fresher (0–2 yrs) · scenario* · `trg-079`

If nobody should delete cases at all, removing the delete permission from profiles and permission sets is the right answer, no code needed. Here the rule is conditional, so I'd use a before delete trigger on Case: if the case is closed and the user doesn't have a custom permission like Delete_Closed_Cases, I call addError on the record in Trigger.old. The custom permission is assigned through a permission set, so admins control who gets it without changing code.

- Unconditional rule: just remove the delete permission
- Conditional rule: before delete trigger
- Check FeatureManagement.checkPermission
- addError on Trigger.old record

```java
trigger CaseTrigger on Case (before delete) {
    CaseDeleteGuard.check(Trigger.old);
}

public with sharing class CaseDeleteGuard {
    public static void check(List<Case> cases) {
        if (FeatureManagement.checkPermission('Delete_Closed_Cases')) return;
        for (Case c : cases) {
            if (c.IsClosed) c.addError('You do not have permission to delete closed cases.');
        }
    }
}
```

<sub>Also asked as: Prevent deletion unless user has a permission · Restrict delete based on record status · trigger before delete custom permission · Why not just remove the delete permission from the profile?</sub>

### When an account is restored from the Recycle Bin, how would you also restore the custom child records your trigger deleted?
*Senior (7–10 yrs) · code* · `trg-080`

In an after undelete trigger on Account, I query the child Invoice__c records that point to the restored accounts and are deleted, using IsDeleted = true with ALL ROWS, since a normal query skips deleted records. Then I call Database.undelete on them. This works because my before delete trigger deleted the children while their lookup was still populated. It only works while records are still in the Recycle Bin, which keeps them for 15 days. With master-detail, Salesforce restores the children automatically.

- after undelete on parent
- SOQL with IsDeleted = true and ALL ROWS
- Database.undelete on the children
- Only while still in the Recycle Bin

```java
trigger AccountTrigger on Account (after undelete) {
    AccountChildRestore.restoreInvoices(Trigger.newMap.keySet());
}

public with sharing class AccountChildRestore {
    public static void restoreInvoices(Set<Id> accountIds) {
        List<Invoice__c> deleted = [
            SELECT Id FROM Invoice__c
            WHERE Account__c IN :accountIds AND IsDeleted = true
            ALL ROWS
        ];
        if (!deleted.isEmpty()) Database.undelete(deleted, false);
    }
}
```

<sub>Also asked as: Undelete child records along with parent · Restore lookup children on account undelete · query deleted records all rows undelete · How do you find records in the recycle bin with SOQL?</sub>

### Once a contact is linked to an account, users should not be able to move it to another account. How would you do it?
*Fresher (0–2 yrs) · scenario* · `trg-081`

In a before update trigger on Contact, I compare AccountId with the old value. If the old value was not blank and it changed, I add an error on the AccountId field, unless the user has a custom permission that allows reparenting, for data fixes. Setting the first account on a private contact is still allowed because the old value was blank. A validation rule using ISCHANGED and PRIORVALUE could do the same if there's no Apex on Contact.

- Compare AccountId with oldMap
- Allow first assignment when old value is blank
- Custom permission for data fixes
- Validation rule is the declarative alternative

```java
trigger ContactTrigger on Contact (before update) {
    ContactReparentGuard.check(Trigger.new, Trigger.oldMap);
}

public with sharing class ContactReparentGuard {
    public static void check(List<Contact> contacts, Map<Id, Contact> oldMap) {
        if (FeatureManagement.checkPermission('Reparent_Contacts')) return;
        for (Contact c : contacts) {
            Id oldAccountId = oldMap.get(c.Id).AccountId;
            if (oldAccountId != null && c.AccountId != oldAccountId) {
                c.AccountId.addError('A contact cannot be moved to a different account.');
            }
        }
    }
}
```

<sub>Also asked as: Prevent reparenting a child record · Block change of AccountId on contact · trigger to stop contact account change · Lock the parent lookup after creation</sub>

### When an opportunity is created, add the account's primary contact as the primary contact role. Write the trigger.
*Mid (3–6 yrs) · code* · `trg-082`

In an after insert trigger on Opportunity, I collect the AccountIds and query those accounts' Primary_Contact__c in one query. I also check existing OpportunityContactRole records for the new opportunities, because lead conversion can already create a contact role and I don't want duplicates. For each opportunity without one, I create an OpportunityContactRole with IsPrimary set to true and a role, then insert them all in one DML.

- after insert: opportunity Id needed
- Query accounts' primary contact once
- Skip opportunities that already have contact roles
- Insert all roles in one DML

```java
trigger OpportunityTrigger on Opportunity (after insert) {
    OpportunityContactRoleHandler.addPrimaryRole(Trigger.new);
}

public with sharing class OpportunityContactRoleHandler {
    public static void addPrimaryRole(List<Opportunity> opps) {
        Set<Id> accountIds = new Set<Id>();
        Set<Id> oppIds = new Set<Id>();
        for (Opportunity o : opps) {
            if (o.AccountId != null) { accountIds.add(o.AccountId); oppIds.add(o.Id); }
        }
        if (oppIds.isEmpty()) return;

        Map<Id, Account> accounts = new Map<Id, Account>(
            [SELECT Id, Primary_Contact__c FROM Account WHERE Id IN :accountIds]);
        for (OpportunityContactRole existing : [SELECT OpportunityId FROM OpportunityContactRole
                                                WHERE OpportunityId IN :oppIds]) {
            oppIds.remove(existing.OpportunityId);
        }
        List<OpportunityContactRole> roles = new List<OpportunityContactRole>();
        for (Opportunity o : opps) {
            Account acc = accounts.get(o.AccountId);
            if (oppIds.contains(o.Id) && acc != null && acc.Primary_Contact__c != null) {
                roles.add(new OpportunityContactRole(OpportunityId = o.Id,
                    ContactId = acc.Primary_Contact__c, Role = 'Decision Maker', IsPrimary = true));
            }
        }
        if (!roles.isEmpty()) insert roles;
    }
}
```

<sub>Also asked as: Create OpportunityContactRole automatically · Trigger to add contact role on opportunity insert · opportunity contact role from account primary contact · How do you avoid duplicate contact roles from lead conversion?</sub>

### You join a project where Account has four triggers, two Process Builder processes and several flows, and nobody can explain the behaviour. How would you clean it up?
*Senior (7–10 yrs) · scenario* · `trg-083`

First I'd inventory everything on Account: triggers, flows, processes, workflow rules, validation rules, and map them onto the order of execution, using debug logs on real saves to confirm what actually fires. Before changing anything, I'd write tests that capture current behaviour. Then I'd consolidate the four triggers into one trigger with a handler, ordering logic explicitly. Process Builder reached end of support at the end of 2025, so I'd migrate those processes into flows or the handler. I'd deploy in small steps with a bypass switch ready.

- Inventory and map onto the order of execution
- Characterisation tests before refactoring
- Merge triggers into one trigger + handler
- Migrate Process Builder to Flow or Apex; deploy incrementally

<sub>Also asked as: How would you refactor messy automation on one object? · Consolidate multiple triggers into one · legacy org cleanup triggers process builder flows · Migrating old automation to a trigger framework</sub>

### Write a trigger that prevents overlapping bookings for the same resource.
*Senior (7–10 yrs) · code* · `trg-084`

Two bookings overlap when one starts before the other ends and ends after the other starts. Say Room A is booked from 10 to 11. A new booking from 10:30 to 12 starts before 11 and ends after 10, so it overlaps. One from 11 to 12 doesn't. In before insert and before update, I collect the resource Ids and the earliest start and latest end in the batch. Then I run one query for existing bookings on those resources within that window, excluding records in the batch. I group them by resource together with the batch records, compare each incoming booking against the others for the same resource, and add an error on conflicts. This catches conflicts both in the database and inside the same import.

- Overlap: A.start < B.end AND A.end > B.start
- One query bounded by min start and max end
- Compare against DB records and the same batch
- Exclude batch records from the query

```java
trigger BookingTrigger on Booking__c (before insert, before update) {
    BookingOverlapValidator.validate(Trigger.new);
}

public without sharing class BookingOverlapValidator {
    public static void validate(List<Booking__c> bookings) {
        Set<Id> resourceIds = new Set<Id>();
        Set<Id> batchIds = new Set<Id>();
        Datetime minStart, maxEnd;
        for (Booking__c b : bookings) {
            if (b.Id != null) batchIds.add(b.Id);
            if (b.Resource__c == null || b.Start__c == null || b.End__c == null) continue;
            resourceIds.add(b.Resource__c);
            if (minStart == null || b.Start__c < minStart) minStart = b.Start__c;
            if (maxEnd == null || b.End__c > maxEnd) maxEnd = b.End__c;
        }
        if (resourceIds.isEmpty()) return;

        Map<Id, List<Booking__c>> byResource = new Map<Id, List<Booking__c>>();
        for (Booking__c b : [SELECT Id, Resource__c, Start__c, End__c FROM Booking__c
                             WHERE Resource__c IN :resourceIds AND Start__c < :maxEnd
                               AND End__c > :minStart AND Id NOT IN :batchIds]) {
            addTo(byResource, b);
        }
        for (Booking__c b : bookings) {
            if (b.Resource__c == null || b.Start__c == null || b.End__c == null) continue;
            for (Booking__c other : byResource.containsKey(b.Resource__c)
                    ? byResource.get(b.Resource__c) : new List<Booking__c>()) {
                if (b.Start__c < other.End__c && b.End__c > other.Start__c) {
                    b.addError('This resource is already booked for an overlapping time.');
                    break;
                }
            }
            addTo(byResource, b); // later batch records are checked against this one
        }
    }

    private static void addTo(Map<Id, List<Booking__c>> m, Booking__c b) {
        if (!m.containsKey(b.Resource__c)) m.put(b.Resource__c, new List<Booking__c>());
        m.get(b.Resource__c).add(b);
    }
}
```

<sub>Also asked as: Prevent double booking with a trigger · Date range overlap validation in Apex · trigger to check overlapping start and end dates · How do you validate time slot conflicts in bulk?</sub>

### Two users add contacts to the same account at the same time and your custom contact count ends up wrong. Why, and how do you fix it?
*Senior (7–10 yrs) · scenario* · `trg-085`

If the trigger increments the parent, like reading the current count and adding one, two transactions can read the same starting value and one increment is lost. The fix is to recalculate with an aggregate query on every change, so the result reflects actual data, and, where accuracy is critical, to lock the parent rows with SELECT FOR UPDATE before recounting, so concurrent transactions wait instead of overwriting each other. Locking can cause UNABLE_TO_LOCK_ROW errors under heavy load, so for very busy parents I'd add a scheduled batch that reconciles the counts.

- Increment logic loses updates under concurrency
- Recalculate with an aggregate query
- SELECT ... FOR UPDATE to lock parent rows
- Reconciliation batch for high-contention parents

```java
// Lock the parents, then recount
List<Account> locked = [SELECT Id FROM Account WHERE Id IN :accountIds FOR UPDATE];
// ... aggregate COUNT(Id) GROUP BY AccountId and update the locked accounts
```

<sub>Also asked as: Roll-up count is incorrect under concurrent updates · Race condition in a trigger roll-up · unable to lock row trigger roll up · How do you make a custom roll-up reliable?</sub>
