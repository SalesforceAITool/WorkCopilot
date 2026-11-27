# Apex, Governor Limits and Testing

85 questions. Levels: Fresher (0–2 yrs) 30 · Mid (3–6 yrs) 33 · Senior (7–10 yrs) 22

## Apex Fundamentals

### What is Apex and where does it run?
*Fresher (0–2 yrs) · concept* · `apex-001`

Apex is Salesforce's own programming language. It's strongly typed and object-oriented, the syntax looks a lot like Java, and it runs entirely on Salesforce servers. Because the platform is multitenant, every Apex transaction is controlled by governor limits, so one customer's code can't hog shared resources. Apex is compiled and stored as metadata, it has DML and SOQL built in, and code needs test coverage before it can be deployed to production. I reach for it when declarative tools handle the logic poorly: complex bulk processing, integrations with REST or SOAP callouts, custom controllers for LWC, batch and asynchronous jobs, and reusable services. For example, if an order has to be sent to an external system over REST and the response written back to the record, that's Apex work. My rule on the team is Flow first for simple automation, and Apex when I need control, performance or testability, and in design reviews I ask people to say which side of that line a requirement falls on.

- Strongly typed, object-oriented, Java-like syntax
- Runs on Salesforce servers in a multitenant model
- Governed by per-transaction limits
- Native SOQL, SOSL and DML
- Needs test coverage before production deploy

<sub>Also asked as: Can you explain what Apex is? · Tell me about the Apex programming language · what is apex in salesforce · Why do we need Apex when we have Flow?</sub>

### What data types are available in Apex?
*Fresher (0–2 yrs) · concept* · `apex-002`

Apex has primitives, sObjects, collections, enums, and user-defined or system classes. The primitives are Integer, which is 32-bit, Long, which is 64-bit, Double, Decimal, String, Boolean, Date, Datetime, Time, Id, Blob, and the generic Object. sObjects like Account or a custom object represent records, and the generic SObject type lets me write reusable code. The collections are List, Set and Map. For money I always use Decimal, because currency fields map to Decimal and it avoids floating-point rounding. Say I'm adding up Opportunity amounts for a discount calculation: with Decimal the totals come out exact, with no rounding surprises. The tricky one is nulls. Every uninitialized variable is null, even a Boolean. So if I declare Boolean isVip and never set it, using it can throw a NullPointerException. I either initialize my variables or null-check them. In code review, a Double on a money calculation is one of the first things I flag.

- Primitives: Integer, Long, Double, Decimal, String, Boolean, Date, Datetime, Time, Id, Blob
- Decimal for currency values
- sObject and generic SObject types
- Collections: List, Set, Map
- Uninitialized variables are null, even Boolean

<sub>Also asked as: Explain primitive data types in Apex · Which data type should I use for currency in Apex? · what are the different data types in apex · Integer vs Long vs Decimal in Apex</sub>

### What is the difference between List, Set and Map in Apex?
*Fresher (0–2 yrs) · comparison* · `apex-003`

All three are collections, but each solves a different problem. A List is ordered, indexed from zero, and allows duplicates, so I use it for query results and for bulk DML. A Set holds only unique values, so it's mainly for lookups and building filters. A Map stores key-value pairs with unique keys, and it's the backbone of bulkified code. Here's a typical case. In a Contact trigger, I collect the AccountIds from Trigger.new into a Set and use it in a WHERE Id IN clause. I pass that query straight into the Map constructor, which gives me a Map of Id to Account. Then inside the loop I just call get with the AccountId, with no extra query. One gotcha: String keys in Sets and Maps are case-sensitive, so 'ABC' and 'abc' count as two different keys. When I review trigger code, a query inside a loop where a Map should be is the first thing I look for.

- List: ordered, indexed, duplicates allowed
- Set: unique values, fast contains()
- Map: unique keys to values, used for lookups
- new Map<Id, Account>(query) builds an Id map
- String keys in Set/Map are case-sensitive

<sub>Also asked as: List vs Set vs Map, when do you use each? · Explain Apex collections · list set map difference in apex · Which collection allows duplicates in Apex?</sub>

### How do you group child records by parent using a Map in Apex?
*Fresher (0–2 yrs) · code* · `apex-004`

I use the Map of Id to List pattern. Say 200 Accounts come in and I need each one's Contacts. First I get the Accounts into a Map keyed by Id, using the Map constructor on a query. Then I run one query for the Contacts, filtered with that map's keySet. I loop through the Contacts, and for each one I check containsKey on a Map of Id to List of Contact. If there's no list for that AccountId yet, I put a new empty list, then I add the Contact to it. After that, inside any loop I can call get with the Account Id and get all its children, with no extra SOQL. The nice part is it stays at two queries whether 5 records come in or 200. That's exactly what bulkification means. I expect this pattern to be second nature on my teams, because it's the difference between code that passes a unit test and code that survives a data load.

- Map constructor on a query gives Id to record
- One query for children using keySet()
- containsKey check, then put an empty list
- Constant number of queries regardless of volume

```java
Map<Id, Account> accById = new Map<Id, Account>(
    [SELECT Id, Name FROM Account WHERE Industry = 'Banking']
);
Map<Id, List<Contact>> contactsByAcc = new Map<Id, List<Contact>>();
for (Contact c : [SELECT Id, LastName, AccountId FROM Contact
                  WHERE AccountId IN :accById.keySet()]) {
    if (!contactsByAcc.containsKey(c.AccountId)) {
        contactsByAcc.put(c.AccountId, new List<Contact>());
    }
    contactsByAcc.get(c.AccountId).add(c);
}
```

<sub>Also asked as: Write code to build a Map of AccountId to list of Contacts · Map<Id, List<Contact>> example · how to create map of account id and contacts · Show a common Map pattern used in triggers</sub>

### What is the difference between static and instance variables and methods in Apex?
*Fresher (0–2 yrs) · comparison* · `apex-005`

A static member belongs to the class itself, and an instance member belongs to each object I create with new. I call a static method straight on the class, like Utils.formatPhone, without creating an object, so I use static for stateless utility logic and service methods. Instance variables hold state for one particular object. The Apex-specific part is that a static variable only lives for one transaction. Everything in that transaction shares it, which is why it's used for recursion guards and caching query results. For example, if my Account trigger's logic ends up updating the same Accounts again, a static Set of already-processed Ids stops it from running twice. But that static is reset for the next transaction, and it's never shared between users. Also, a static method can't directly use instance variables. In reviews I watch for static state used carelessly, because it's an easy source of order-dependent bugs in tests.

- Static: belongs to the class, called without new
- Instance: one copy per object
- Static variables persist only for one transaction
- Used for recursion control and caching

<sub>Also asked as: Static vs instance in Apex · When would you use a static method? · what does static keyword mean in apex · Do static variables keep their value across transactions?</sub>

### How do constructors work in Apex?
*Fresher (0–2 yrs) · concept* · `apex-006`

A constructor is a special method with the same name as the class and no return type, and it runs when I create an object with new. If I don't write any constructor, Apex gives me a default no-argument one. But as soon as I write a constructor with parameters, that default no longer exists unless I add it myself. That one catches people out. Say I add InvoiceBuilder(Id accountId), and some older code still calls new InvoiceBuilder() with nothing. That call breaks until I add the no-argument constructor back. I can overload constructors with different parameter lists and chain them with this(...) as the first statement, so I don't duplicate initialization code. A child class calls the parent constructor with super(...). And I use a private constructor when I want to stop people instantiating a class, like a singleton or a pure utility class. So when someone adds a parameterized constructor to a shared class, I ask them to search for existing callers first.

- Same name as class, no return type
- Default no-arg constructor only if none is defined
- Overloading and this(...) chaining
- super(...) calls the parent constructor
- Private constructor for singleton or utility classes

<sub>Also asked as: What is a constructor in Apex? · Can you overload constructors in Apex? · explain default constructor apex · What is constructor chaining with this()?</sub>

### What is the difference between an interface and an abstract class in Apex?
*Fresher (0–2 yrs) · comparison* · `apex-007`

An interface is a pure contract. It only declares method signatures, with no implementation, and a class can implement many interfaces. An abstract class can have abstract methods that children must implement, plus normal methods with shared logic, member variables and constructors. But a class can extend only one class, and an abstract class can't be instantiated. I choose an interface when unrelated classes need the same capability. The platform's own Queueable, Schedulable, Database.Batchable and Comparable are good examples of that. I choose an abstract class when several related classes share common code. For example, I'd write a base trigger handler that holds the dispatch logic, and then an AccountTriggerHandler and a CaseTriggerHandler extend it and only fill in their own specific handler methods. The trade-off I explain to the team is flexibility versus shared code: interfaces keep things loosely coupled, while an abstract class cuts duplication but ties every child to one parent.

- Interface: signatures only, multiple allowed
- Abstract class: shared code plus abstract methods
- Single inheritance for classes
- Neither can be instantiated directly
- Platform examples: Queueable, Batchable, Comparable

<sub>Also asked as: Interface vs abstract class · When would you use an abstract class over an interface? · can an apex class implement multiple interfaces · difference between interface and abstract in apex</sub>

### Explain virtual, abstract and override keywords and how inheritance works in Apex.
*Mid (3–6 yrs) · concept* · `apex-008`

In Apex, classes and methods are final by default, which is different from Java. If I want another class to extend mine, I have to declare it virtual or abstract. A virtual method has a default implementation that a child may override. An abstract method has no body, so the child must implement it. In the child class I write extends ParentClass and mark the method with the override keyword, otherwise it won't compile. Inside the child I can call super.methodName() to reuse the parent logic, and protected members are visible to subclasses. For example, a virtual BaseNotifier class with a virtual send method, and an EmailNotifier that overrides send, calls super.send() for the shared part, then adds its own email logic. Apex supports only single inheritance of classes, but a class can extend one class and implement several interfaces at the same time. On my teams I keep inheritance shallow, usually one base class, because deep hierarchies get hard to debug and review.

- Classes and methods are final by default
- virtual: optional override; abstract: mandatory
- Child must use override keyword
- super calls the parent version
- Single class inheritance

<sub>Also asked as: How does inheritance work in Apex? · Why do I need the virtual keyword to extend a class? · what is the override keyword in apex · Are Apex classes final by default?</sub>

### How would you use polymorphism in Apex to avoid long if-else chains?
*Senior (7–10 yrs) · code* · `apex-009`

I'd go with an interface for the behaviour and one class per variation, then pick the class at runtime. For example, a DiscountStrategy interface with GoldDiscount and StandardDiscount implementations. The calling code only knows the interface, so adding a new tier means adding a new class, not editing a growing if-else block. To make it configurable I store the class name in custom metadata and use Type.forName to create the instance, then cast it to the interface. This is the strategy pattern plus a simple factory, and it is also easier to test because I can pass a fake implementation. I always handle the case where Type.forName returns null because the class name is wrong. The trade-off is more classes to navigate, so I only push this pattern when a chain has several branches that keep changing, not for a simple two-way check.

- Program to an interface, not a concrete class
- One class per variation (strategy pattern)
- Type.forName + newInstance for runtime selection
- Class names can live in custom metadata
- Null-check the Type returned by forName

```java
public interface DiscountStrategy {
    Decimal apply(Decimal amount);
}
public class GoldDiscount implements DiscountStrategy {
    public Decimal apply(Decimal amount) { return amount * 0.80; }
}
public class StandardDiscount implements DiscountStrategy {
    public Decimal apply(Decimal amount) { return amount * 0.95; }
}

// Factory: class name could come from a custom metadata record
Type t = Type.forName(tierConfig.Strategy_Class__c);
DiscountStrategy strategy = (t == null)
    ? new StandardDiscount()
    : (DiscountStrategy) t.newInstance();
Decimal finalPrice = strategy.apply(listPrice);
```

<sub>Also asked as: Give an example of polymorphism in Apex · How do you implement the strategy pattern in Apex? · Type.forName dynamic class instantiation example · how to make apex logic configurable without code changes</sub>

### What is the difference between with sharing, without sharing and inherited sharing?
*Fresher (0–2 yrs) · comparison* · `apex-010`

These keywords decide whether Apex respects record-level sharing for the running user. With sharing enforces the user's sharing rules, so queries only return records the user can see. Without sharing ignores record sharing and sees everything, and I only use that for deliberate system operations. Inherited sharing runs in the sharing mode of whatever class called it, and if it's the entry point, like an LWC controller, it runs as with sharing. Say a sales rep can only see their own Opportunities. A with sharing query gives them just theirs; a without sharing query gives them everyone's. If there's no keyword at all, it depends on the API version. From API version 67.0 the class runs with sharing. In older versions it follows the caller, and as an entry point it runs without sharing, except Aura controllers and @AuraEnabled methods called from LWC, which run with sharing. That's easy to get wrong, so on my teams every class declares a keyword, with sharing by default, and a missing keyword is a review comment.

- with sharing: respects the user's record access
- without sharing: ignores record sharing
- inherited sharing: follows the caller, with sharing at entry point
- No keyword: with sharing from API 67.0; older versions follow the caller
- Sharing keywords do not enforce CRUD or FLS

<sub>Also asked as: Explain sharing keywords in Apex · What happens if I don't declare any sharing keyword on a class? · with sharing vs without sharing · what is inherited sharing in apex</sub>

### A user complains that your LWC shows records they should not be able to see. How do you investigate and fix it?
*Mid (3–6 yrs) · scenario* · `apex-011`

I treat this as a security issue first, so I check the sharing declaration on the controller and on every helper class it calls. The usual cause is that the controller, or the service class running the query, is declared without sharing, so the query ignores the user's sharing rules. To confirm, I log in as that user and compare what the component returns with what a list view shows. Say the list view shows 40 accounts and the component shows 300. That gap is the sharing problem. The fix is to declare the controller with sharing and, better, run the queries in user mode with WITH USER_MODE, which also enforces object and field permissions. If a helper class genuinely needs elevated access, I keep it separate, mark it without sharing on purpose, and only expose the minimum fields. Then I add a System.runAs test for a restricted user so it can't regress. I'd also tell the stakeholder plainly what was exposed and to whom, because that's a data-access incident, not just a bug.

- Check the controller's sharing keyword first
- Reproduce by logging in as the user
- Use with sharing plus WITH USER_MODE
- Isolate intentional system-mode code
- Add a runAs test for a restricted user

<sub>Also asked as: Users are seeing other people's records in a Lightning component · LWC is exposing data beyond the user's access, what went wrong? · component shows records that the user doesn't have access to · How do you secure an Apex controller used by LWC?</sub>

### How does exception handling work in Apex?
*Fresher (0–2 yrs) · concept* · `apex-012`

Apex uses try, catch and finally, just like Java. I wrap risky code in try, catch specific exception types first and the generic Exception last, and use finally for cleanup that must always run. The common ones are DmlException, QueryException when a single-record query returns no rows, NullPointerException, ListException for a bad index, SObjectException when I read a field I didn't query, CalloutException and JSONException. Every exception gives me getMessage, getTypeName, getLineNumber and getStackTraceString for logging. For example, around a callout I'd catch CalloutException first to log the failed request, then generic Exception as the safety net. The key gotcha: System.LimitException can't be caught, so governor limits have to be avoided, not handled. For LWC I throw an AuraHandledException with a friendly message, and in triggers I use addError on the record. My standard for the team is no empty catch blocks: every catch either logs, rethrows or shows the user something useful.

- Catch specific exceptions before generic Exception
- Common: DmlException, QueryException, NullPointerException
- LimitException cannot be caught
- AuraHandledException for LWC errors
- addError to block a record in triggers

<sub>Also asked as: Explain try catch finally in Apex · What are common exceptions in Apex? · can we catch limit exception in apex · How do you handle errors in Apex code?</sub>

### How do you create and use a custom exception in Apex?
*Fresher (0–2 yrs) · code* · `apex-013`

I create a class that extends Exception, and its name has to end with the word Exception, otherwise it won't compile. I don't have to write constructors, because Apex automatically gives me ones that take no argument, a message, a cause exception, or both. Then I throw it with the throw keyword when a business rule is broken, and callers can catch that specific type separately from system errors. For example, if someone orders 10 units and only 4 are in stock, I throw new InsufficientStockException('Only 4 units left'). The UI can show that clear message, and in the logs those failures are easy to filter. If the caller needs more detail, I can also add my own properties, like an error code. I like the team to keep a small set of named exceptions per domain, so error handling stays consistent instead of everyone inventing their own.

- Extend Exception; name must end with Exception
- Built-in constructors: (), (msg), (cause), (msg, cause)
- Throw with throw new ...
- Catch the specific type separately

```java
public class InsufficientStockException extends Exception {}

public with sharing class OrderService {
    public static void reserve(Product2 product, Integer qty, Decimal available) {
        if (qty > available) {
            throw new InsufficientStockException(
                'Only ' + available + ' units left for ' + product.Name);
        }
        // reserve stock here
    }
}

// Caller
try {
    OrderService.reserve(prod, 10, stockLevel);
} catch (InsufficientStockException e) {
    throw new AuraHandledException(e.getMessage());
}
```

<sub>Also asked as: Write a custom exception class · What are the rules for naming a custom exception? · how to throw custom exception in apex · Why create custom exceptions?</sub>

### What is the difference between DML statements and Database class methods?
*Fresher (0–2 yrs) · comparison* · `apex-014`

A DML statement like insert accounts is all-or-nothing. If one record fails, the whole operation rolls back and a DmlException is thrown. The Database class methods, like Database.insert(records, false), let me set allOrNone to false, so the valid records are saved and the failed ones are reported. They return result objects, like SaveResult for insert and update, UpsertResult and DeleteResult, and I check isSuccess and getErrors for each record. For example, if I'm loading 1,000 contacts and 3 have a bad value, a plain insert saves none of them. Database.insert with false saves the other 997 and tells me which 3 failed. Database methods also accept DMLOptions, for example to run assignment rules or allow field truncation, and an AccessLevel for user mode. Both cost the same against governor limits. I use Database methods for data loads and integrations where partial success is acceptable. The real question I ask is whether the business can live with partial data. If they can't, it stays all-or-nothing.

- DML statements: all-or-none, throw DmlException
- Database methods: allOrNone flag
- Return SaveResult, UpsertResult, DeleteResult
- Support DMLOptions and AccessLevel
- Same governor limit cost

<sub>Also asked as: insert vs Database.insert · What does allOrNone false do? · dml statement versus database methods · When would you use Database.update instead of update?</sub>

### Write code to insert records with partial success and log the failures.
*Mid (3–6 yrs) · code* · `apex-015`

I call Database.insert with allOrNone set to false and loop through the SaveResult list. The results come back in the same order as the input list, so index i in the results matches index i in my records. That's how I tie each error back to the source record. Say an integration sends 500 contacts and two of them fail validation. Those two fail, the other 498 save. For each failure I read the status code, the message and the fields involved, and collect them into a log list or a custom log object. At the end I insert all the log records in one DML, or publish an error event. That way one bad row in an integration batch doesn't block the good rows, and support can see exactly what failed. The guardrail I set is that a partial-success call without error handling doesn't get past review, because silently dropped rows are worse than a visible failure.

- allOrNone = false allows partial success
- Results are in the same order as input
- Read getStatusCode, getMessage, getFields
- Log failures in bulk, not per record

```java
List<Database.SaveResult> results = Database.insert(contacts, false);
List<Integration_Log__c> logs = new List<Integration_Log__c>();
for (Integer i = 0; i < results.size(); i++) {
    Database.SaveResult sr = results[i];
    if (!sr.isSuccess()) {
        for (Database.Error err : sr.getErrors()) {
            logs.add(new Integration_Log__c(
                Record_Ref__c = contacts[i].Email,
                Message__c = err.getStatusCode() + ': ' + err.getMessage()
                             + ' ' + err.getFields()));
        }
    }
}
if (!logs.isEmpty()) {
    insert logs;
}
```

<sub>Also asked as: How do you process Database.SaveResult? · Partial insert in Apex with error handling · database dot insert all or none false example · How do you know which record failed in a bulk insert?</sub>

### How do savepoints and rollback work in Apex, and what are the gotchas?
*Senior (7–10 yrs) · concept* · `apex-016`

Database.setSavepoint marks a point in the transaction, and Database.rollback(sp) undoes every DML done after that point while the transaction carries on. I use it when I catch an exception and want to return gracefully without leaving half-created data. For example, I insert an Order, then its line items fail. I roll back to the savepoint so I'm not left with an empty Order. The gotchas matter here. Both setSavepoint and rollback count against the DML statement limit. Rollback doesn't reset static variables or the in-memory sObjects, so records inserted after the savepoint still carry their Ids, and inserting them again fails unless I clear the Id or clone them. If I roll back to an earlier savepoint, any later savepoints become invalid. And savepoints can't be shared across separate trigger invocations. In review I check that anyone using rollback also handles those stale Ids, because that's where the subtle bugs come from.

- Rollback undoes DML after the savepoint
- Both calls count as DML statements
- Static variables and in-memory Ids are not reset
- Rolling back to an earlier savepoint invalidates later ones
- Cannot cross trigger invocations

<sub>Also asked as: Explain Database.setSavepoint and Database.rollback · What are the limitations of savepoints? · transaction control in apex · Does rollback reset static variables?</sub>

### You need to create an Account, Contact and Opportunity together, and if any fails nothing should be saved. How do you do it?
*Senior (7–10 yrs) · scenario* · `apex-017`

I'd handle this with a savepoint and an explicit rollback. By default, if an exception isn't caught, the whole transaction rolls back anyway. The problem starts when I catch the exception to show a friendly message, because then the earlier DML would stay committed. Say the Account and Contact insert fine, but the Opportunity fails. If I've caught that error, I'm left with an Account and a Contact and no Opportunity. So I set a savepoint before the first insert and do the three inserts in order inside try. In catch, I call Database.rollback to that savepoint, then throw an AuraHandledException or return an error response. That gives me one atomic unit of work across objects. In a larger codebase I'd put this in a service method, or use a Unit of Work pattern that registers the records and commits them together, with the savepoint handled centrally. It's a bit more ceremony, but I'd rather standardise it once than have each developer hand-roll their own rollback logic.

- Uncaught exceptions already roll back everything
- Catching means you must roll back yourself
- Savepoint before first DML, rollback in catch
- Unit of Work pattern for larger codebases

```java
Savepoint sp = Database.setSavepoint();
try {
    Account acc = new Account(Name = req.companyName);
    insert acc;
    insert new Contact(LastName = req.lastName, AccountId = acc.Id);
    insert new Opportunity(Name = req.companyName + ' - New Deal', AccountId = acc.Id,
        StageName = 'Prospecting', CloseDate = Date.today().addDays(30));
} catch (DmlException e) {
    Database.rollback(sp);
    throw new AuraHandledException('Could not create records: ' + e.getDmlMessage(0));
}
```

<sub>Also asked as: How do you make multiple DML operations atomic? · All-or-nothing save across objects in Apex · rollback all records if one insert fails · Undo the account insert if the contact insert fails</sub>

### What is dynamic Apex and when would you use Schema describe?
*Mid (3–6 yrs) · concept* · `apex-018`

Dynamic Apex means writing code that works with objects and fields decided at runtime instead of hard-coded at compile time. It has three parts: Schema describe to read metadata, dynamic SOQL and SOSL with Database.query or Search.query, and dynamic DML using SObjectType.newSObject plus put and get on generic sObjects. A good example is a generic related-list LWC. You pass it an object name like Case or Invoice__c, and the same Apex builds the query and reads the fields for whichever object it gets. I also use it for field sets, checking field permissions, and reading picklist values. A performance tip: Schema.getGlobalDescribe is expensive, so I prefer direct tokens like Account.SObjectType, or Schema.describeSObjects for specific objects, and I cache describe results in static variables. I'm careful about where the team uses it, though, because the compiler won't catch a typo in a field name, so I keep dynamic code to genuinely generic components.

- Describe: object and field metadata at runtime
- Dynamic SOQL/SOSL with Database.query and Search.query
- Dynamic DML with newSObject, put and get
- Avoid getGlobalDescribe in loops; cache results

<sub>Also asked as: Explain dynamic Apex · What is Schema.getGlobalDescribe used for? · schema describe methods in apex · How do you get object and field information at runtime?</sub>

### Write Apex to read field details and active picklist values dynamically.
*Mid (3–6 yrs) · code* · `apex-019`

I use the fields map from the object's describe to loop through every field and read its label, type and permissions, which is handy when I'm building a dynamic form. For picklists, I call getDescribe on the field token, loop through getPicklistValues, and keep only the active entries. For example, if Lead Source still has an old value that an admin deactivated, the active check keeps it out of my dropdown. These describe calls respect the running user, so isAccessible and isUpdateable tell me what that user can actually do. If the object name comes in as a string, I use Schema.describeSObjects with that name instead of the global describe. In an LWC I usually prefer the UI API wire adapters for picklists, but in Apex this is the standard approach. I'd ask the team to keep this in one shared utility so describe logic isn't copied across classes.

- fields.getMap() returns all field tokens
- DescribeFieldResult gives label, type, permissions
- getPicklistValues + isActive filter
- Use describeSObjects when the name is a string

```java
Map<String, Schema.SObjectField> fieldMap = Schema.SObjectType.Account.fields.getMap();
for (String apiName : fieldMap.keySet()) {
    Schema.DescribeFieldResult dfr = fieldMap.get(apiName).getDescribe();
    if (dfr.isAccessible() && dfr.isUpdateable()) {
        System.debug(dfr.getLabel() + ' (' + dfr.getType() + ')');
    }
}

List<String> industries = new List<String>();
for (Schema.PicklistEntry pe : Account.Industry.getDescribe().getPicklistValues()) {
    if (pe.isActive()) {
        industries.add(pe.getValue());
    }
}
```

<sub>Also asked as: How do you get picklist values in Apex? · Get all fields of an object using describe · fetch picklist values apex code · How do you check if a field is updateable in Apex?</sub>

### How do you write dynamic SOQL safely and prevent SOQL injection?
*Senior (7–10 yrs) · code* · `apex-020`

SOQL injection happens when user input is concatenated into a query string, so someone can change the WHERE clause and read data they shouldn't. Say a search box glues whatever the user types straight into WHERE Name equals that text. If they type a quote followed by an OR condition, they've rewritten the filter and can pull back records they were never meant to see. My first choice is bind variables, which keep input as data, never as query text. With Database.queryWithBinds I pass a map of bind names to values plus an AccessLevel, so the query also runs in user mode. For parts that can't be bound, like field or object names, I validate them against the schema describe or an allow-list. String.escapeSingleQuotes is a fallback for string literals, but it doesn't protect field names or numeric input, so I don't rely on it alone. In code review, dynamic SOQL built from raw user input is a hard stop for me.

- Never concatenate raw user input
- Bind variables keep input as data
- queryWithBinds with a bind map and AccessLevel
- Allow-list field/object names via describe
- escapeSingleQuotes is only a fallback

```java
public with sharing class AccountSearch {
    public static List<Account> search(String nameFilter, String industry) {
        String soql = 'SELECT Id, Name, Industry FROM Account WHERE Name LIKE :namePattern';
        Map<String, Object> binds = new Map<String, Object>{
            'namePattern' => '%' + nameFilter + '%'
        };
        if (String.isNotBlank(industry)) {
            soql += ' AND Industry = :industry';
            binds.put('industry', industry);
        }
        soql += ' ORDER BY Name LIMIT 200';
        return Database.queryWithBinds(soql, binds, AccessLevel.USER_MODE);
    }
}
```

<sub>Also asked as: What is SOQL injection and how do you prevent it? · Database.query vs Database.queryWithBinds · safe dynamic soql example · Is String.escapeSingleQuotes enough?</sub>

### How do you use SOQL inside Apex, and what errors are common?
*Fresher (0–2 yrs) · concept* · `apex-021`

In Apex I write SOQL inside square brackets, and it returns a List of sObjects. I pass Apex values in with bind variables using a colon, like WHERE Id IN :accountIds. For parent fields I use dot notation, like Account.Name on Contact, and for children I use a subquery on the relationship name, like Contacts. The most common error is assigning a query directly to a single sObject. If nothing comes back, you get 'List has no rows for assignment', and if more than one row comes back, that errors too. For example, assigning a query on Account by name to one Account variable breaks the day there's no match, or two. So I query into a list and check isEmpty. Reading a field I didn't select throws an SObjectException. And aggregate queries return AggregateResult, which I read with get and an alias. In review, a query assigned straight to a single record with no handling is something I always flag.

- Inline SOQL in brackets returns a List
- Bind variables with colon
- Parent dot notation, child subqueries
- Query into a List to avoid no-rows errors
- Unqueried field access throws SObjectException

<sub>Also asked as: Explain inline SOQL in Apex · What is a bind variable in SOQL? · list has no rows for assignment to sobject error · How do you query parent and child records in Apex?</sub>

### What is a SOQL for loop and why would you use it?
*Mid (3–6 yrs) · concept* · `apex-022`

A SOQL for loop puts the query directly in the for statement, like for (Account a : [SELECT ...]). Behind the scenes, Salesforce fetches the records in chunks of 200 instead of loading the whole result into memory at once, so it greatly reduces heap usage on large queries. There's also a list form, for (List<Account> chunk : [SELECT ...]), which gives me 200 records at a time so I can do one DML per chunk. Say a query returns 10,000 contacts. With the list form that's 50 chunks of 200, so 50 DML statements, not one per record. But it doesn't bypass the 50,000 query-row limit, because every row still counts. I use it when a query may return thousands of records in one transaction, and I never put DML or another query inside the single-record form. It's one of the patterns I point the team to when a job starts hitting heap limits, before anyone reaches for Batch Apex.

- Query placed directly in the for statement
- Records fetched in chunks of 200
- Reduces heap usage
- List form allows DML per chunk
- Still counts toward 50,000 query rows

<sub>Also asked as: Difference between a normal for loop on a list and a SOQL for loop · How does SOQL for loop help with heap size? · soql for loop chunks of 200 · When should I use the list version of a SOQL for loop?</sub>

### What is a wrapper class and why do we use it?
*Fresher (0–2 yrs) · concept* · `apex-023`

A wrapper class is a custom Apex class that bundles data from different sources into one object, so I can work with it or send it to the UI. The classic example is a table where each row needs a record plus a selected checkbox. So the wrapper holds, say, an Opportunity and a Boolean isSelected, and the user ticks the rows they want to process. I also use wrappers to combine fields from multiple objects, add calculated values, or represent JSON from an external API. For LWC, every property I want on the client must be annotated with @AuraEnabled, and the method returns a list of wrappers. Wrappers keep the UI simple, because the component receives exactly the shape it needs. When I review LWC controllers, I prefer a clear wrapper over a raw sObject with extra values bolted on, because the contract between Apex and the component stays obvious.

- Custom class combining records and extra fields
- Classic use: checkbox + record row
- Combine multiple objects or calculated values
- @AuraEnabled on properties for LWC
- Also used to model JSON

<sub>Also asked as: Explain wrapper class with an example · Why use a wrapper class in LWC? · what is wrapper class in salesforce apex · How do you show a checkbox with records in a table?</sub>

### Write a wrapper class for an LWC table and sort it with Comparable.
*Mid (3–6 yrs) · code* · `apex-024`

I create an inner class with @AuraEnabled properties so LWC can read them, and a constructor that maps an Opportunity into the row shape, including a derived flag. Here that's isLarge, for amounts over 100,000. To sort the rows, I implement the Comparable interface and its compareTo method, returning a negative number, zero or a positive number. Then calling sort on the list uses my logic. I sort by amount descending and treat a null amount as zero, so an Opportunity with no amount still sorts cleanly, as zero. Newer API versions also have a Comparator interface, which lets me pass different sort orders to the sort method without changing the wrapper class. The controller uses with sharing and a user-mode query. I keep the sort logic inside the wrapper so it can be unit-tested on its own, and that's what I look for in review.

- @AuraEnabled properties for LWC
- Constructor maps sObject to row
- Comparable.compareTo controls sort()
- Handle nulls in comparison
- Comparator allows multiple sort orders

```java
public with sharing class OppTableController {
    public class OppRow implements Comparable {
        @AuraEnabled public Id recordId;
        @AuraEnabled public String name;
        @AuraEnabled public Decimal amount;
        @AuraEnabled public Boolean isLarge;
        public OppRow(Opportunity o) {
            recordId = o.Id;
            name = o.Name;
            amount = o.Amount == null ? 0 : o.Amount;
            isLarge = amount > 100000;
        }
        public Integer compareTo(Object other) {
            Decimal otherAmt = ((OppRow) other).amount;
            if (amount == otherAmt) return 0;
            return amount > otherAmt ? -1 : 1; // descending
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<OppRow> getRows(Id accountId) {
        List<OppRow> rows = new List<OppRow>();
        for (Opportunity o : [SELECT Id, Name, Amount FROM Opportunity
                              WHERE AccountId = :accountId WITH USER_MODE]) {
            rows.add(new OppRow(o));
        }
        rows.sort();
        return rows;
    }
}
```

<sub>Also asked as: How do you sort a list of wrapper objects? · Comparable interface example in Apex · wrapper class with aura enabled properties · How do I sort custom objects by a field in Apex?</sub>

### How do you serialize and deserialize JSON in Apex?
*Fresher (0–2 yrs) · code* · `apex-025`

I create Apex classes that mirror the JSON structure, then call JSON.deserialize with the JSON string and the class type, and cast the result. Property names must match the JSON keys, and extra keys in the JSON are ignored by default. Say an API returns a customer with name, email and a dozen other fields. If my class only has name and email, I get those two and the rest is skipped. To go the other way, I call JSON.serialize on any object or list, or serializePretty for readable output in logs. Serialize also has an option to suppress null values, which is handy for clean API payloads. For very large or streaming responses there's JSONParser, and JSONGenerator if I need to build JSON piece by piece. Typed classes are my default, and the team standard, because they give compile-time safety and anyone reading the code can see the payload shape.

- Model the JSON with Apex classes
- JSON.deserialize(json, Type) then cast
- JSON.serialize / serializePretty
- Option to suppress nulls when serializing
- JSONParser and JSONGenerator for advanced cases

```java
public class OrderDto {
    public String orderNumber;
    public Decimal total;
    public List<LineDto> lines;
}
public class LineDto {
    public String sku;
    public Integer qty;
}

String body = '{"orderNumber":"SO-1001","total":250.50,"lines":[{"sku":"A1","qty":2}]}';
OrderDto dto = (OrderDto) JSON.deserialize(body, OrderDto.class);
System.debug(dto.lines[0].sku);           // A1

String payload = JSON.serialize(dto, true); // true = suppress null fields
```

<sub>Also asked as: JSON.serialize and JSON.deserialize example · How do you convert a JSON response into an Apex object? · parse json in apex · Convert Apex object to JSON string</sub>

### An API returns JSON with dynamic keys and a field named like an Apex reserved word. How do you parse it?
*Mid (3–6 yrs) · scenario* · `apex-026`

I'd go with JSON.deserializeUntyped whenever the keys aren't fixed, or a key is a reserved word like limit or class that I can't use as a property name. It returns an Object that I cast to Map<String, Object>, and nested arrays come back as List<Object>, so I navigate the structure by key and cast each value. For example, if the response has a key called limit, I just read it with get('limit') on the map, no Apex property needed. Numbers can come back as Integer or Decimal, so I convert through String.valueOf to be safe. Another option for a reserved word is to replace the key in the raw string before typed deserialization, but that's fragile. If most of the payload is stable, I mix both: typed classes for the stable part and untyped maps for the dynamic part. I'd also ask the API owner for a sample payload and a documented contract, because untyped parsing breaks quietly when the shape changes.

- deserializeUntyped returns Map<String, Object>
- Arrays come back as List<Object>
- Cast values carefully; numbers may be Integer or Decimal
- Useful for reserved words and dynamic keys

```java
Map<String, Object> root = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
String status = (String) root.get('status');
Map<String, Object> paging = (Map<String, Object>) root.get('paging');
Integer pageLimit = Integer.valueOf(String.valueOf(paging.get('limit'))); // 'limit' is reserved in Apex

for (Object o : (List<Object>) root.get('items')) {
    Map<String, Object> item = (Map<String, Object>) o;
    Decimal amount = Decimal.valueOf(String.valueOf(item.get('amount')));
}
```

<sub>Also asked as: How do you parse JSON when the structure is not fixed? · JSON key is a reserved keyword in Apex, how to handle? · json deserialize untyped example · What if the JSON keys change per response?</sub>

### What is the difference between custom settings and custom metadata types?
*Fresher (0–2 yrs) · comparison* · `apex-027`

Both store configuration, but the big difference is this. Custom metadata records are metadata, so they deploy with change sets, packages or the Metadata API along with the code. Custom setting records are data, so they must be loaded separately in each org. Custom settings come in list and hierarchy types. Hierarchy settings can hold different values at org, profile and user level, which is perfect for something like a trigger bypass. For example, I can switch a bypass flag on only for the integration user, and everyone else keeps it off. Custom metadata supports relationships, for example to other metadata or to object and field definitions, and its getAll and getInstance methods don't use SOQL queries. One more difference: Apex can update custom settings with normal DML, but custom metadata needs the Metadata API from Apex. The question I ask the team is simple: should this value move with a deployment, or be changed per org at runtime?

- Custom metadata records deploy as metadata
- Custom setting records are data per org
- Hierarchy settings vary by org, profile, user
- CMT getAll/getInstance avoid SOQL
- CMT not editable with normal DML

<sub>Also asked as: Custom settings vs custom metadata · When do you use hierarchy custom settings? · custom metadata type vs custom setting which is better · Can custom metadata records be deployed?</sub>

### You need configuration for an integration endpoint, feature toggles and a trigger bypass for data migration. Where would you store each?
*Senior (7–10 yrs) · scenario* · `apex-028`

I'd split it by purpose. The endpoint and authentication go in a Named Credential with an External Credential, never in custom metadata or code, so secrets are managed securely and the URL can differ per environment. Feature toggles and business mapping rules go in custom metadata because they should be version-controlled and deployed with the code, and reading them costs no SOQL. The trigger bypass goes in a hierarchy custom setting, because I can switch it on just for the migration user or profile without a deployment and switch it off afterwards. My trigger handler checks that setting first. This keeps secrets, deployable config and runtime switches cleanly separated. I write that split into our team guidelines so nobody has to guess, and an endpoint URL or token in code is an automatic rejection in review.

- Endpoints and auth: Named Credentials
- Feature flags and mappings: custom metadata
- Per-user trigger bypass: hierarchy custom setting
- Trigger handler checks bypass first

<sub>Also asked as: How do you design configuration in a Salesforce org? · Where should I store API endpoints and credentials? · custom metadata or custom setting for feature flags · How do you bypass triggers during a data load?</sub>

### How do you read custom metadata records in Apex without using SOQL?
*Mid (3–6 yrs) · code* · `apex-029`

Every custom metadata type has static methods. getAll returns a map of all records keyed by DeveloperName, and getInstance returns one record by DeveloperName or Id. These don't consume SOQL queries, so they're ideal inside triggers that run in bulk. I usually wrap them in a small utility class so the rest of the code just asks a question like isOn. For example, my trigger calls FeatureFlags.isOn('Auto_Assign_Cases'), and inside, that's just a getInstance call returning a checkbox value. Because the platform caches the records, these reads are fast. SOQL against custom metadata is still possible when I need filtering or relationship fields. And in tests I can inject fake records into a test-visible variable, so the test doesn't depend on whatever's configured in the org. I make that wrapper the team standard, so nobody scatters raw getInstance calls with hard-coded names across the codebase.

- getAll(): map keyed by DeveloperName
- getInstance(): single record
- No SOQL consumed
- Wrap in a small utility class
- SOQL still available for filtering

```java
public with sharing class FeatureFlags {
    @TestVisible
    private static Map<String, Feature_Flag__mdt> flags = Feature_Flag__mdt.getAll();

    public static Boolean isOn(String flagName) {
        Feature_Flag__mdt flag = flags.get(flagName);
        return flag != null && flag.Is_Active__c;
    }
}

// Usage in a trigger handler
if (FeatureFlags.isOn('Auto_Assign_Cases')) {
    CaseAssignmentService.assign(Trigger.new);
}
```

<sub>Also asked as: Custom metadata getInstance example · Write a feature flag utility in Apex · get all custom metadata records apex · Does querying custom metadata count against SOQL limits?</sub>

### What are the Apex best practices you always follow?
*Fresher (0–2 yrs) · concept* · `apex-030`

My non-negotiable is bulkification. Every trigger and method should handle 200 or more records, with no SOQL or DML inside loops, using Sets and Maps instead. For example, if a data load updates 200 Accounts and the trigger queries Contacts inside the loop, that's 200 queries for one save. One query outside the loop fixes it. I keep one trigger per object with the logic in a handler class. I avoid hard-coded Ids by using custom metadata, custom labels, or querying by DeveloperName. I enforce security with with sharing and user-mode queries. I handle exceptions properly and never swallow them silently. I query only the fields I need, use selective filters, and move heavy work to asynchronous Apex. For tests, I create my own test data, write meaningful asserts, and test bulk, positive and negative cases, not just the coverage number. These are also the items on my team's code review checklist, so they're standards, not just personal habits.

- Bulkify: no SOQL/DML in loops
- One trigger per object, logic in handler
- No hard-coded Ids
- Enforce sharing, CRUD and FLS
- Meaningful tests with bulk and negative cases

<sub>Also asked as: Tell me some Apex coding best practices · How do you write good quality Apex code? · apex best practices interview question · What should you avoid when writing Apex?</sub>

### How do you enforce CRUD and field-level security in Apex?
*Mid (3–6 yrs) · concept* · `apex-031`

By default Apex runs in system mode, which ignores the user's object and field permissions, so I enforce them explicitly. My first choice is user mode: WITH USER_MODE on SOQL, AccessLevel.USER_MODE on Database methods, or insert as user and update as user on DML statements. User mode enforces CRUD, FLS and sharing together. Say a support agent has no access to a Salary field. In system mode my query would happily return it to their screen. In user mode, that field is checked against their permissions. When I'd rather quietly remove the fields they can't access instead of failing, I use Security.stripInaccessible, which returns cleaned records and tells me which fields were removed. In older code you'll see describe checks like isAccessible or isUpdateable, or WITH SECURITY_ENFORCED, but Salesforce now recommends user mode. And remember, with sharing alone only handles record access, not CRUD or FLS. For new code on my teams, user mode is the default, and system mode needs a written reason.

- Apex runs in system mode by default
- WITH USER_MODE and AccessLevel.USER_MODE
- insert as user / update as user
- Security.stripInaccessible to remove fields
- with sharing does not cover CRUD/FLS

<sub>Also asked as: Does Apex respect field level security? · How do you check object and field permissions in Apex? · crud and fls enforcement apex · What is user mode in Apex?</sub>

### What is the difference between WITH USER_MODE and WITH SECURITY_ENFORCED?
*Mid (3–6 yrs) · comparison* · `apex-032`

I'd standardise on USER_MODE. Both make a SOQL query respect the user's permissions, but USER_MODE is broader, and it's what Salesforce now recommends. WITH SECURITY_ENFORCED checks object and field read access only for fields in the SELECT and FROM clauses. It doesn't enforce sharing, and it throws on the first inaccessible field. WITH USER_MODE enforces sharing as well as CRUD and FLS, and it checks fields used anywhere in the query, including WHERE and ORDER BY. For example, if a user can't see Annual Revenue and I only use it in the WHERE clause, SECURITY_ENFORCED doesn't check it, but USER_MODE does. USER_MODE also handles more cases like polymorphic fields, and its QueryException can list all the inaccessible fields through getInaccessibleFields. And user mode is available for DML and Database methods too, so I get one consistent approach for reads and writes. When we touch older classes, I have the team migrate SECURITY_ENFORCED to USER_MODE as part of that change, rather than as a separate big-bang project.

- SECURITY_ENFORCED: SELECT/FROM fields only, no sharing
- USER_MODE: sharing + CRUD + FLS
- USER_MODE checks WHERE and ORDER BY fields too
- getInaccessibleFields lists all failures
- USER_MODE also works for DML

<sub>Also asked as: with user mode versus with security enforced · Why does Salesforce recommend USER_MODE? · Does WITH SECURITY_ENFORCED check sharing? · user mode vs security enforced in soql</sub>

### How do you use Security.stripInaccessible?
*Mid (3–6 yrs) · code* · `apex-033`

Security.stripInaccessible takes an access type, like READABLE, CREATABLE, UPDATABLE or UPSERTABLE, and a list of records, and returns an SObjectAccessDecision. Calling getRecords gives me copies of the records with the inaccessible fields removed, and getRemovedFields tells me which fields were stripped for each object. I use it when I want graceful degradation instead of an exception. For example, an LWC edit form sends back five fields, but the user is only allowed to edit four of them. With UPDATABLE, the fifth field is stripped and the other four save. The gotcha is to always use the returned records for the DML, or for returning to the client, never the original list. It handles relationship fields and subqueries as well. That original-list mistake is exactly what I check for in review.

- AccessType: READABLE, CREATABLE, UPDATABLE, UPSERTABLE
- getRecords() returns sanitized copies
- getRemovedFields() for logging
- Use the returned list, not the original

```java
@AuraEnabled
public static void saveContacts(List<Contact> contacts) {
    SObjectAccessDecision decision =
        Security.stripInaccessible(AccessType.UPDATABLE, contacts);
    if (!decision.getRemovedFields().isEmpty()) {
        System.debug(LoggingLevel.WARN, 'Removed: ' + decision.getRemovedFields());
    }
    update decision.getRecords();
}

// For reads
List<Contact> safe = (List<Contact>) Security.stripInaccessible(
    AccessType.READABLE, [SELECT Id, Name, Phone, Salary__c FROM Contact LIMIT 50]
).getRecords();
```

<sub>Also asked as: Write code using stripInaccessible · How do you remove fields a user can't access before DML? · strip inaccessible fields apex example · What does SObjectAccessDecision return?</sub>

### A security review or code scan flags CRUD/FLS and sharing violations across many Apex controllers. How do you remediate?
*Senior (7–10 yrs) · scenario* · `apex-034`

I'd treat this as a prioritised remediation, not a big-bang rewrite, so I start by triaging. I list every entry point exposed to users, meaning @AuraEnabled methods, REST resources, Visualforce controllers and invocable methods, because those matter most. Say the scan flags 60 classes and 15 of them are LWC controllers. Those 15 get fixed first. For each one I make the sharing explicit, with sharing or inherited sharing, and keep any genuine system-mode helper small and documented. Then I convert queries to WITH USER_MODE and DML to user mode, or use stripInaccessible where partial data is acceptable. I avoid returning raw sObjects with extra fields. I run Salesforce Code Analyzer in the CI pipeline so new violations fail the build, and I add runAs tests with a limited permission set user to prove access is enforced. False positives get documented, not ignored. For stakeholders, I'd report progress as user-facing entry points fixed versus remaining, which is clearer than a raw violation count.

- Prioritize user-facing entry points
- Explicit sharing keyword on every class
- User-mode queries and DML, or stripInaccessible
- Code Analyzer in CI to block regressions
- runAs tests with a restricted user

<sub>Also asked as: How would you fix security scanner findings in Apex? · AppExchange security review failed on FLS, what now? · code analyzer flagged crud violations in apex · How do you make an existing codebase secure for user access?</sub>

### How do you structure Apex code in a large org with many developers?
*Senior (7–10 yrs) · design* · `apex-035`

I'd go with a layered approach, inspired by Apex Enterprise Patterns. Triggers stay thin: one trigger per object that calls a handler through a small framework with bypass support. Business logic lives in service classes that are bulk-safe and reusable from triggers, LWC, batch or APIs. Queries live in selector classes, so field lists and security are consistent and easy to mock. Domain classes hold object-specific validation and defaults. For DML across objects I use a Unit of Work, so commits happen once and in the right order. Configuration goes in custom metadata. For example, a discount calculation is written once in an OpportunityService, and the trigger, an LWC button and a nightly batch all call that same method. This makes code testable with mocks, reduces merge conflicts and keeps governor limit usage predictable. The trade-off is more classes and some ceremony, so I scale it to the org. A small team may only need triggers, services and selectors, and I'd agree that up front rather than enforce every layer by habit.

- Thin triggers with a handler framework
- Service layer for business logic
- Selector layer for queries
- Domain layer for object rules
- Unit of Work for DML ordering

<sub>Also asked as: What architecture do you follow for Apex? · Explain service layer, selector layer and domain layer · apex enterprise patterns fflib · How do you organize triggers and business logic at scale?</sub>

### Does a class declared with sharing enforce field-level security?
*Senior (7–10 yrs) · concept* · `apex-036`

No, and that's a common misunderstanding. With sharing only enforces record-level access: sharing rules, role hierarchy, org-wide defaults and manual shares. It doesn't enforce object permissions or field-level security. Apex runs in system mode for CRUD and FLS by default. So a with sharing class can still read a salary field the user can't see on the page layout, or update an object the user has no edit permission on. Picture an HR component. The manager only sees their own team's records, which is sharing doing its job, but the salary column still shows up because nothing checked field-level security. To enforce those, I need user mode on queries and DML, or Security.stripInaccessible, or explicit describe checks. So a secure controller needs both: an explicit sharing keyword and user-mode data access. That's why my review checklist has sharing and CRUD/FLS as two separate items, because one doesn't imply the other.

- with sharing = record access only
- CRUD and FLS ignored in system mode
- Use user mode or stripInaccessible for CRUD/FLS
- Secure code needs both layers

<sub>Also asked as: Is with sharing enough for security? · What is system mode vs user mode in Apex? · with sharing enforce fls or not · Does Apex respect profile permissions automatically?</sub>

### Your trigger works for 200 records but skips logic for records beyond the first 200 in a single insert. What is wrong?
*Senior (7–10 yrs) · scenario* · `apex-037`

This is the classic static Boolean recursion guard bug. When Apex inserts more than 200 records in one DML, the trigger fires once per chunk of 200, but all in the same transaction, so static variables are shared. If the handler sets a static hasRun flag to true on the first chunk, every later chunk sees it and skips. The fix is to track processed record Ids in a static Set and only skip records already handled, or better, design the logic so it is safe to run again by checking whether the relevant field actually changed against Trigger.oldMap. I then add a test that inserts more than 200 records to prove it. For exactly this reason, a plain static Boolean guard isn't allowed in our trigger framework.

- Triggers run in chunks of 200 within one transaction
- Static variables are shared across chunks
- Static Boolean flag skips later chunks
- Use a static Set<Id> or compare old vs new values
- Test with more than 200 records

```java
public class AccountTriggerHandler {
    @TestVisible private static Set<Id> processedIds = new Set<Id>();

    public static void afterUpdate(List<Account> newList, Map<Id, Account> oldMap) {
        List<Account> toProcess = new List<Account>();
        for (Account a : newList) {
            if (!processedIds.contains(a.Id) && a.Rating != oldMap.get(a.Id).Rating) {
                toProcess.add(a);
                processedIds.add(a.Id);
            }
        }
        if (!toProcess.isEmpty()) {
            AccountService.syncRating(toProcess);
        }
    }
}
```

<sub>Also asked as: Static Boolean recursion flag is skipping records · Why does my trigger only process the first chunk? · recursion guard bug with more than 200 records · Trigger logic not running for second batch of records</sub>

### Is string comparison in Apex case-sensitive?
*Fresher (0–2 yrs) · concept* · `apex-038`

It depends on how I compare. The == operator on Strings is case-insensitive in Apex, so 'Hot' == 'hot' is true. The equals method is case-sensitive, and equalsIgnoreCase is the explicit case-insensitive version. Collections are different again. Set<String> contains and Map<String, ...> keys are case-sensitive, so a lookup with different casing returns false or null. That's a common source of bugs when keys come from user input or an external system. Say I build a map of country codes with 'IN' as the key, and the integration sends 'in'. The get comes back null and my lookup fails, even though the value looks the same to a person. So my habit is to normalize keys, for example with toLowerCase, both when I put them into a Map or Set and when I read them back. It's a small thing, but I call it out when reviewing integration code, because the bug only shows up with real data.

- == on Strings is case-insensitive
- equals() is case-sensitive
- equalsIgnoreCase() for explicit intent
- Set and Map String keys are case-sensitive
- Normalize keys with toLowerCase

<sub>Also asked as: Difference between == and equals for Strings in Apex · Are Map keys case-sensitive in Apex? · string equals vs double equals apex · Why does my Set contains check fail for different case?</sub>

### How would you design an error logging framework in Apex that survives transaction rollback?
*Senior (7–10 yrs) · design* · `apex-039`

I'd build it on platform events. If I insert a log record and then the transaction fails, the log is rolled back with everything else. So I publish a platform event for each error, with the event's publish behaviour set to publish immediately. Those events are published even if the transaction later rolls back. A platform event trigger or flow subscribes and inserts the log records in a separate transaction. For example, if an order save fails halfway and the whole thing rolls back, the error log is still there the next morning, because it came through the event. My Logger class collects entries in memory during the transaction and publishes them in bulk. It captures class, method, message, stack trace, user and a correlation Id, and respects a log-level setting in custom metadata. I also add a scheduled purge so the log object doesn't grow forever. I'd also make that Logger the one approved way to log on the team, so we don't end up with three half-finished logging approaches.

- Normal log inserts roll back with the transaction
- Platform event with publish immediately survives rollback
- Subscriber inserts logs in a separate transaction
- Buffer and publish in bulk
- Configurable log level and retention purge

<sub>Also asked as: How do you log errors if the transaction rolls back? · Design an Apex logging framework · platform event for error logging apex · Why are my error log records not saved after an exception?</sub>

## Governor Limits

### What are governor limits and why does Salesforce enforce them?
*Fresher (0–2 yrs) · concept* · `apex-040`

Governor limits are runtime limits Salesforce enforces on every Apex transaction, like how many SOQL queries, DML statements, CPU time or heap memory one transaction can use. They exist because Salesforce is multitenant. Many customers share the same servers and database, so the platform makes sure one org's inefficient code can't slow everyone else down. Think of an apartment building sharing one water tank: every flat gets a fair quota. When a limit is exceeded, Salesforce throws a System.LimitException, which can't be caught, and the whole transaction is rolled back. So if my trigger hits a limit partway through a 200-record load, none of the 200 records are saved. That's why I design for limits from the start: bulkify the code, write efficient queries, and move heavy work to asynchronous processing. When a stakeholder asks why we can't just process everything in one click, this is the explanation I give.

- Per-transaction runtime limits
- Protect shared multitenant resources
- LimitException cannot be caught
- The whole transaction rolls back
- Design for limits up front

<sub>Also asked as: Explain governor limits · Why do governor limits exist? · what is governor limit in salesforce · What happens when you exceed a governor limit?</sub>

### What are the most important governor limits you should know?
*Fresher (0–2 yrs) · concept* · `apex-041`

The ones I keep in mind: 100 SOQL queries in a synchronous transaction and 200 in asynchronous. 150 DML statements. 50,000 rows retrieved by SOQL, and 10,000 rows processed by DML. CPU time of 10 seconds synchronous and 60 seconds asynchronous. Heap size of 6 MB synchronous and 12 MB asynchronous. 100 callouts per transaction, and 50 future method calls per transaction. With System.enqueueJob, you can add 50 Queueable jobs in a synchronous transaction, but only one from an executing Queueable. For Batch Apex, the default scope is 200 and the maximum is 2,000. Five batch jobs can be active at once, and the flex queue holds up to 100 more. To make it real: if a trigger runs one query per record, a 200-record data load blows through the 100-query limit about halfway in. I expect everyone on the team to know these roughly by heart, because design decisions depend on them.

- SOQL: 100 sync / 200 async
- DML statements: 150; DML rows: 10,000
- Query rows: 50,000
- CPU: 10 s sync / 60 s async; Heap: 6 MB / 12 MB
- Callouts 100; future 50; enqueueJob 50 (1 from a Queueable)

<sub>Also asked as: List common governor limits with numbers · How many SOQL queries can you run in a transaction? · governor limits list soql dml cpu heap · What is the DML limit in Salesforce?</sub>

### How do you avoid hitting governor limits in Apex?
*Fresher (0–2 yrs) · concept* · `apex-042`

The core technique is bulkification. Never put SOQL or DML inside a loop. Collect Ids into Sets, query once into Maps, and do one DML per object on a List. For example, instead of updating each Contact inside the loop, I add them to a List and run one update at the end, so 200 records cost one DML statement, not 200. I query only the fields and rows I need, with selective, indexed filters, and use SOQL for loops for large result sets. I avoid recursion with proper guards, keep one trigger per object, and watch for flows on the same object, because they share the same limits. Heavy or long work goes to Queueable, Batch or future methods, which also get higher limits. I cache repeated lookups in static variables within the transaction, and during development I use the Limits class to see how close I am. On my teams, a test with 200 records is the proof I ask for.

- No SOQL/DML in loops; use Sets and Maps
- Selective queries, only needed fields
- Recursion guards and one trigger per object
- Move heavy work to async
- Cache lookups; monitor with Limits class

<sub>Also asked as: What techniques prevent governor limit errors? · How do you write limit-safe code? · how to avoid governor limits in salesforce · Tips to stay within governor limits</sub>

### Show how you would bulkify a trigger that has a SOQL query inside a loop.
*Mid (3–6 yrs) · code* · `apex-043`

The broken version runs a query for each record in Trigger.new, so 101 records means a too many SOQL queries error. To fix it, I loop once to collect the parent Ids into a Set, run a single query with WHERE Id IN that Set and load the results into a Map, then loop again and read each parent from the Map. That turns N queries into one, no matter whether 1 or 200 records come in. Because this is a before trigger, I just set the field on the record and need no DML at all. In a real project the logic would sit in a handler class rather than the trigger body. In review I reject a trigger that queries inside a loop even if its test passes, because a single-record test hides the problem.

- Collect Ids in a Set first
- One query into a Map
- Second loop reads from the Map
- Before trigger: modify fields without DML
- Move logic to a handler in real code

```java
// Bad: one query per record
// for (Opportunity o : Trigger.new) {
//     Account a = [SELECT Rating FROM Account WHERE Id = :o.AccountId];
// }

trigger OpportunityTrigger on Opportunity (before insert, before update) {
    Set<Id> accIds = new Set<Id>();
    for (Opportunity o : Trigger.new) {
        if (o.AccountId != null) accIds.add(o.AccountId);
    }
    Map<Id, Account> accs = new Map<Id, Account>(
        [SELECT Id, Rating FROM Account WHERE Id IN :accIds]);
    for (Opportunity o : Trigger.new) {
        Account a = accs.get(o.AccountId);
        if (a != null && a.Rating == 'Hot') {
            o.Priority__c = 'High';
        }
    }
}
```

<sub>Also asked as: Fix this trigger that queries inside a for loop · Write a bulkified trigger example · soql inside for loop fix · How do you rewrite non-bulkified trigger code?</sub>

### What is the Limits class and how do you use it?
*Mid (3–6 yrs) · code* · `apex-044`

The Limits class tells me how much of each governor limit the current transaction has used and what the maximum is. The methods come in pairs, like getQueries and getLimitQueries, getDmlStatements and getLimitDmlStatements, plus getCpuTime, getHeapSize, getQueryRows and getCallouts. I use it in two ways. During development I log the values at key points to find which part of the code consumes the most. In production code that processes variable volumes, I check the remaining headroom. For example, inside a loop I compare getQueries with getLimitQueries, and if I'm getting close, I hand the rest of the records to a Queueable instead of failing. That matters because a LimitException itself can't be caught. I use that headroom check selectively, though. Sprinkled everywhere it makes code hard to follow, so it belongs in the few paths where volume really varies.

- Paired methods: getX and getLimitX
- Debug which code consumes limits
- Check headroom and defer to async
- Proactive because LimitException cannot be caught

```java
System.debug('SOQL: ' + Limits.getQueries() + '/' + Limits.getLimitQueries());
System.debug('DML: ' + Limits.getDmlStatements() + '/' + Limits.getLimitDmlStatements());
System.debug('CPU ms: ' + Limits.getCpuTime() + '/' + Limits.getLimitCpuTime());
System.debug('Heap: ' + Limits.getHeapSize() + '/' + Limits.getLimitHeapSize());

// Defer remaining work before hitting the wall
if (Limits.getCpuTime() > Limits.getLimitCpuTime() * 0.8) {
    System.enqueueJob(new RemainingWorkJob(pendingIds));
    return;
}
```

<sub>Also asked as: How do you check how many SOQL queries have been used? · Limits.getQueries example · limits class methods apex · How can code check governor limit usage at runtime?</sub>

### What is a mixed DML error?
*Fresher (0–2 yrs) · concept* · `apex-045`

A mixed DML error happens when one transaction does DML on a setup object and on a non-setup object. Setup objects affect access, like User, UserRole, Group, GroupMember, PermissionSetAssignment and queue configuration. Non-setup objects are normal business records like Account, Contact or custom objects. Salesforce blocks mixing them because sharing recalculation for setup changes has to be handled separately. A typical case: an onboarding process updates an Account and, in the same transaction, inserts a PermissionSetAssignment for a user. That throws the error. The fix is to split the work into separate transactions, usually by moving the setup object DML into a future method or a Queueable. In test classes, I wrap the setup DML inside System.runAs, which gives it its own context and avoids the error. I warn new developers about it early, because it usually appears when someone adds user provisioning to an existing process.

- Setup objects: User, Role, Group, PermissionSetAssignment
- Non-setup: business records
- Cannot mix both in one transaction
- Fix: future or Queueable for setup DML
- In tests: use System.runAs

<sub>Also asked as: Explain MIXED_DML_OPERATION · What are setup and non-setup objects? · mixed dml operation error salesforce · Why can't I insert a User and an Account in the same transaction?</sub>

### When a Contact is created you must also assign a permission set to a related user. You get MIXED_DML_OPERATION. How do you fix it?
*Mid (3–6 yrs) · scenario* · `apex-046`

This needs two transactions. The Contact insert is non-setup DML and PermissionSetAssignment is setup DML, so they cannot happen in the same transaction. So I'd move the permission set assignment into a Queueable that runs in its own transaction. The trigger handler collects the user Ids in bulk, queries the permission set by its API name rather than a hard-coded Id, and enqueues one job with all of them. Queueable is better than future here because I can pass collections, get a job Id and add a Finalizer for failure handling. In the test I wrap the setup records in System.runAs and use startTest and stopTest so the job runs. I'd also confirm with the business that a short delay before the user gets access is acceptable, since that's the trade-off.

- Contact is non-setup, PermissionSetAssignment is setup
- Move setup DML to a Queueable
- Bulk-collect user Ids; query permission set by Name
- Test with runAs and startTest/stopTest

```java
public class PermissionAssignerJob implements Queueable {
    private Set<Id> userIds;
    public PermissionAssignerJob(Set<Id> userIds) { this.userIds = userIds; }

    public void execute(QueueableContext ctx) {
        PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'Partner_Access' LIMIT 1];
        List<PermissionSetAssignment> psas = new List<PermissionSetAssignment>();
        for (Id uid : userIds) {
            psas.add(new PermissionSetAssignment(AssigneeId = uid, PermissionSetId = ps.Id));
        }
        Database.insert(psas, false); // skip users who already have it
    }
}
// In the Contact after-insert handler:
// if (!userIds.isEmpty()) System.enqueueJob(new PermissionAssignerJob(userIds));
```

<sub>Also asked as: Mixed DML when assigning permission set from a trigger · Create a User from a Contact trigger without mixed DML · how to fix mixed dml error in trigger · Permission set assignment fails after inserting a record</sub>

### You get 'Too many SOQL queries: 101'. How do you troubleshoot and fix it?
*Mid (3–6 yrs) · scenario* · `apex-047`

First I reproduce it and open the debug log. I look at the cumulative limit usage section and the SOQL_EXECUTE lines to see which class and line runs the queries over and over. The usual causes are a query inside a loop, including one hidden inside a helper method that's called per record; trigger recursion, where an update re-fires the trigger; or several triggers and record-triggered flows on the same object all adding queries in one transaction. For example, a getAccountTier helper can look harmless, but if it runs a query and gets called once per Opportunity, a 200-record update means 200 queries. The fix is to bulkify: collect Ids, query once into a Map, cache reference data in static variables, and add a recursion guard. Then I write a test with 200 records to confirm it stays well under the limit. If it keeps recurring on one object, I treat it as a design problem, too much automation on one save, and review that object with the team.

- Use debug log limit usage and SOQL_EXECUTE lines
- Look for queries in loops or in helpers called per record
- Check recursion and other automation on the object
- Bulkify, cache, and guard recursion
- Prove with a 200-record test

<sub>Also asked as: How do you debug System.LimitException too many SOQL queries · Too many soql queries 101 error fix · what causes too many soql queries · My trigger throws 101 SOQL error, what do I check?</sub>

### Code works fine when a user edits one record in the UI but fails with governor limit errors during a data load or integration. Why, and how do you fix it?
*Senior (7–10 yrs) · scenario* · `apex-048`

A UI save processes one record, but a data load or integration sends up to 200 records per trigger execution, so any per-record query, DML or callout multiplies. Say my trigger does one query per record. In the UI that's one query, no problem. In a 200-record load it's 200 queries, and the save fails. Loads expose non-bulkified code, a flow with Get Records or Update Records elements inside a loop, or a chain where an after-update trigger updates related records that fire their own triggers and flows, all sharing one set of limits. So I review the full order of execution for that object, not just my trigger, and bulkify every piece. I make the logic skip unchanged records, add a bypass setting for large migrations, and move very heavy work to a Queueable or Batch. And my tests always insert 200 or more records. I also ask for a realistic data-volume test before go-live, because single-record UAT simply won't find this.

- UI = 1 record; loads = up to 200 per chunk
- Per-record logic multiplies
- Flows and cascades share the same limits
- Review the full order of execution
- Skip unchanged records, add bypass, move to async

<sub>Also asked as: Works for single record but fails in bulk · Integration fails with too many SOQL but UI works · data loader causing governor limit errors · Why does bulk API load hit limits but UI save does not?</sub>

### A transaction fails with 'Apex CPU time limit exceeded'. How do you handle it?
*Mid (3–6 yrs) · scenario* · `apex-049`

CPU time counts the time spent executing Apex and declarative automation like flows in the transaction. It doesn't count time waiting for the database to run a query or for a callout response. The limit is 10 seconds synchronous and 60 asynchronous. Common causes are nested loops over large lists, describe calls or heavy string and JSON processing inside loops, too many automations firing on the same save, and recursion. For example, matching 2,000 Contacts against 2,000 Accounts with a loop inside a loop is four million comparisons. Put the Accounts in a Map and it's 2,000 lookups. I find the hotspot with debug logs and Limits.getCpuTime checkpoints. Then I optimize the algorithm, skip records that didn't change, consolidate automation, and move non-urgent work to asynchronous Apex, which gets the higher limit. I'd also challenge whether every automation on that save is still needed, because removing one is often cheaper than optimising it.

- 10 s sync / 60 s async
- Counts Apex and automation, not database or callout wait time
- Replace nested loops with Maps
- Find hotspots with logs and getCpuTime
- Move non-urgent work to async

<sub>Also asked as: How do you fix CPU timeout in Apex? · Apex CPU time limit exceeded error · what counts toward cpu time in salesforce · My trigger is hitting the 10 second CPU limit</sub>

### An object has triggers, several flows and managed package automation, and saves randomly hit the CPU limit. How do you find the culprit?
*Senior (7–10 yrs) · scenario* · `apex-050`

I'd measure before changing anything. I capture a debug log of a failing save with Apex profiling set to a fine level and analyze it with a tool like the Apex Log Analyzer extension in VS Code, which shows a timeline of how much time each trigger, flow and package method takes. I compare a slow save against a fast one, because random failures usually come from data variations, like an account with thousands of children or an expensive branch. I also map the order of execution to spot cascades where one update re-fires another object's automation. To confirm, I temporarily bypass components with a custom setting in a sandbox and remeasure. Then I fix the worst offender first, and raise managed package issues with the vendor. I'd share that timeline with stakeholders too, because it turns 'the system is slow' into a specific list of what we fix first.

- Debug log with profiling + Apex Log Analyzer
- Compare slow vs fast saves for data patterns
- Map the order of execution for cascades
- Bypass components one by one in a sandbox
- Fix the biggest consumer first

<sub>Also asked as: How do you profile CPU usage across triggers and flows? · Intermittent CPU limit errors on save · find which automation is using the most cpu · Apex log analyzer for performance</sub>

### Your code throws 'Apex heap size too large'. What do you do?
*Mid (3–6 yrs) · scenario* · `apex-051`

Heap is the memory my transaction holds: 6 MB synchronous and 12 MB asynchronous. The error usually comes from loading large query results into a List, selecting fields I don't need, especially long text and rich text, holding file or attachment bodies as Blobs or Base64 strings, or building big JSON payloads. A classic one is code that pulls every file on a record, bodies included, into one list so it can send them somewhere. A few large PDFs and you're over. To fix it, I use a SOQL for loop so records are processed in chunks, select only the fields I need, clear or null out collections when I'm done with them, and avoid keeping everything in a static variable. For large volumes I move to Batch Apex, where each execute gets its own heap, and I monitor with Limits.getHeapSize. In review, I flag any query that pulls body or long-text fields without a clear need.

- 6 MB sync / 12 MB async
- Causes: large lists, wide queries, file bodies, big JSON
- SOQL for loops and fewer fields
- Clear collections when finished
- Batch Apex for large volumes

<sub>Also asked as: How do you reduce heap size in Apex? · Heap size limit exceeded fix · what is heap size in salesforce apex · Processing large files causes heap error</sub>

### You get 'Too many query rows: 50001'. How do you resolve it?
*Mid (3–6 yrs) · scenario* · `apex-052`

The 50,000 limit is cumulative across all SOQL queries in the transaction, not per query. So three queries that each return 20,000 rows will fail, even though none of them is over 50,000 on its own. First I find which queries return the most rows. Often it's an unfiltered query, or a rollup on a parent with huge numbers of children. Then I make the queries selective with indexed filters, fetch only what the logic truly needs, add a LIMIT where it makes sense, and avoid re-querying the same data. If the business really needs to touch more than 50,000 records, that work doesn't belong in a synchronous transaction. I move it to Batch Apex with a QueryLocator, which can process up to 50 million records, with each execute having its own limits. If a synchronous process genuinely seems to need that much data, I push back on the requirement, because usually the design should change, not just the query.

- Limit is cumulative across all queries
- Find and filter the biggest queries
- Selective, indexed filters and LIMIT
- Batch Apex QueryLocator for large volumes

<sub>Also asked as: Query returns more than 50,000 rows · How do you process more than 50k records in Apex? · too many query rows 50001 error · Trigger fails because a rollup query returns too many rows</sub>

### How do governor limits differ between synchronous and asynchronous Apex?
*Mid (3–6 yrs) · comparison* · `apex-053`

Asynchronous Apex, meaning future, Queueable, Batch and Scheduled jobs, gets higher limits on a few key resources: 200 SOQL queries instead of 100, 60 seconds of CPU instead of 10, and 12 MB of heap instead of 6 MB. Many limits stay the same, like 150 DML statements, 50,000 query rows, 10,000 DML rows and 100 callouts. In Batch Apex, each execute call is its own transaction with a fresh set of limits, which is why batch is the right tool for large data volumes. For example, if a manager clicks a button to recalculate commission for one rep, I keep it synchronous so they see the answer right away. Recalculating for every rep at month end goes to batch. The trade-off is that async work doesn't run immediately, so I only move work there when the user doesn't need the result instantly. That's usually a conversation with the business about how fresh the result really needs to be.

- Async: 200 SOQL, 60 s CPU, 12 MB heap
- Same: 150 DML, 50,000 rows, 10,000 DML rows, 100 callouts
- Each batch execute has fresh limits
- Trade-off: no immediate result

<sub>Also asked as: Which limits are higher in async Apex? · Sync vs async governor limits · why move logic to queueable for limits · Does batch apex get fresh limits per execute?</sub>

### What causes 'Too many DML statements: 151' and 'Too many DML rows: 10001'?
*Fresher (0–2 yrs) · concept* · `apex-054`

The 151 error means the transaction ran more than 150 DML statements, almost always because an insert, update or delete is sitting inside a loop. Database class methods count the same, and so do savepoint and rollback calls. The fix is to add records to a List inside the loop and do a single DML after it, ideally one per object. The 10,001 rows error is different. It means more than 10,000 records were processed by DML in one transaction, even if it was just a few statements. For example, one update on a list of 12,000 records is a single statement, but it still fails. That's a volume problem, not a coding style problem, so I move that work to Batch Apex, where each execute gets its own 10,000-row allowance. In review, DML inside a loop is an automatic change request from me.

- 151: more than 150 DML statements, usually DML in a loop
- Collect records and do one DML per object
- Savepoints and rollbacks also count
- 10,001: more than 10,000 DML rows
- Use Batch Apex for high volume

<sub>Also asked as: How do you fix too many DML statements error · What is the DML rows limit? · dml inside for loop error · too many dml rows 10001</sub>

### You need to process around two million records every night. How do you design it within governor limits?
*Senior (7–10 yrs) · design* · `apex-055`

I'd use Batch Apex with a QueryLocator in start, since it can return up to 50 million records, and schedule it with a Schedulable class. The start query must be selective on indexed fields so it doesn't time out. Each execute gets fresh limits, so I keep the logic bulkified inside it. Then I tune the scope size. The default of 200 is fine for simple updates, and for two million records that works out to about 10,000 chunks. If each record needs complex logic or callouts, I go smaller. I use Database methods with allOrNone false and log the failures, Database.Stateful only for small counters, and the finish method for a summary email or to chain the next job. I also keep in mind that only five batch jobs run concurrently. I'd also agree the failure process with the business up front: who gets the summary, what counts as a partial failure, and how we rerun just the failed records.

- Batch Apex with QueryLocator (up to 50M records)
- Selective indexed start query
- Tune scope size to the per-record cost
- Partial success with logging; Stateful for counters
- Schedule it; mind the 5 concurrent batch limit

<sub>Also asked as: Design a nightly job for millions of records · How would you process large data volumes in Apex? · batch apex design for large data · How do you choose batch size for a large job?</sub>

### Which limits are per transaction and which are org-wide, and how do you monitor org-wide limits?
*Senior (7–10 yrs) · concept* · `apex-056`

Most Apex limits, like SOQL, DML, CPU and heap, reset with every transaction. Others are shared across the whole org over time. One is the daily limit on asynchronous Apex executions, which is 250,000 or 200 times the number of user licenses, whichever is greater. So an org with 2,000 licenses gets 400,000 a day, while a small org gets the 250,000 floor. Others are the 24-hour API request allocation, a cap on concurrent long-running requests, 100 scheduled Apex jobs at a time, and platform event and storage allocations. I monitor them in Setup on the System Overview and Company Information pages, through the REST limits resource, or in Apex with the OrgLimits class. For integrations, I alert before API usage gets close to the allocation. On integration-heavy orgs I'd make those alerts someone's named responsibility, because an API allocation running out at month end is a business outage, not just a developer issue.

- Transaction limits reset every transaction
- Daily async Apex executions: 250,000 or 200 per license
- API requests per 24 hours
- 100 scheduled Apex jobs at once
- Monitor via System Overview, REST limits, OrgLimits

<sub>Also asked as: What are the org-level limits in Salesforce? · Daily async Apex execution limit · how many scheduled jobs can you have · How do you check API usage and org limits?</sub>

### A callout fails with 'You have uncommitted work pending. Please commit or rollback before calling out'. How do you fix it?
*Mid (3–6 yrs) · scenario* · `apex-057`

Salesforce does not allow a callout after DML in the same transaction, because it cannot hold a database transaction open while waiting on an external system. I'd pick one of three fixes, in this order. If possible I reorder the code so all callouts happen first and the DML happens after. If the DML must come first, for example a trigger that saves a record and then syncs it, I move the callout into a Queueable that implements Database.AllowsCallouts, or a future method with callout set to true, so it runs in a new transaction. For decoupled designs I publish a platform event and let the subscriber make the call. I also remember the callout limits: 100 per transaction and 120 seconds total time. In review I look at where callouts sit relative to DML, because this error often only appears once someone adds a new automation to the object.

- No callout after DML in the same transaction
- Do callouts first, then DML
- Or move the callout to a Queueable/future
- Platform event for decoupling
- 100 callouts, 120 s total timeout

<sub>Also asked as: Callout after DML error · uncommitted work pending error in Apex · can I make a callout after insert in the same transaction · How do you do DML and a callout together?</sub>

### Since you can't catch a LimitException, how do you make long-running Apex fail gracefully?
*Senior (7–10 yrs) · scenario* · `apex-058`

Right, a LimitException can't be caught, so my strategy is prevention and recovery. For prevention, inside loops that process variable volume, I check headroom with the Limits class. When I get close, I stop and enqueue a Queueable with the remaining records. Say I'm working through 5,000 records and I'm getting near the CPU limit at record 3,000. The last 2,000 go to a new job instead of the whole thing crashing. For recovery, I attach a Transaction Finalizer to Queueable jobs. The finalizer runs after the job finishes, even if it failed on an uncaught limit exception, and it can check the result, log the error and re-enqueue the job a limited number of times. For batch jobs, I make execute idempotent so a failed chunk can be retried, and I monitor AsyncApexJob for failures. I'd also agree a retry limit and an alert path with the support team, so a stuck job gets noticed rather than silently retried.

- LimitException is not catchable
- Check headroom and hand off to a Queueable
- Transaction Finalizer runs even after limit failure
- Retry with a cap; make work idempotent
- Monitor AsyncApexJob

```java
public class SyncJob implements Queueable, Database.AllowsCallouts {
    public void execute(QueueableContext ctx) {
        System.attachFinalizer(new SyncJobFinalizer());
        // bulk work here
    }
}
public class SyncJobFinalizer implements Finalizer {
    public void execute(FinalizerContext ctx) {
        if (ctx.getResult() == ParentJobResult.UNHANDLED_EXCEPTION) {
            System.debug(LoggingLevel.ERROR, ctx.getException().getMessage());
            // log and optionally re-enqueue with a retry counter
        }
    }
}
```

<sub>Also asked as: Can you catch System.LimitException? · How to handle governor limit failures gracefully · transaction finalizer queueable example · What happens to my Queueable if it hits a limit?</sub>

## Apex Testing

### Why do we write test classes, and what is the 75 percent code coverage rule?
*Fresher (0–2 yrs) · concept* · `apex-059`

Test classes prove the code works, and they protect it from breaking when someone changes it later. They're also mandatory. To deploy Apex to production, all tests must pass, org-wide coverage must be at least 75 percent, and every trigger needs some coverage. Test classes themselves aren't counted in the coverage calculation. If I deploy with specified tests, each class and trigger in the package must reach 75 percent on its own. So if the org is at 90 percent but the one class I'm deploying is at 60, that deployment still fails. But coverage is just the minimum. A test that runs every line and asserts nothing can hit 100 percent and prove nothing. So I aim for meaningful tests with real asserts that cover bulk, positive, negative and permission scenarios. On my teams, coverage is the floor, and the asserts are what I actually review.

- Required for production deployment
- 75% org-wide; every trigger needs coverage
- Test code not counted in coverage
- RunSpecifiedTests: 75% per class/trigger in the package
- Asserts matter more than the number

<sub>Also asked as: What is the minimum code coverage for deployment? · Explain code coverage in Salesforce · 75 percent code coverage rule · Do test classes count toward code coverage?</sub>

### How do you write a basic test class in Apex?
*Fresher (0–2 yrs) · concept* · `apex-060`

I annotate the class with @isTest and usually make it private, since nothing else calls it. Each test method is static, returns void, takes no parameters, and is annotated with @isTest. The older testMethod keyword is deprecated. Inside a method I follow arrange, act, assert. For example, to test a discount rule, I create an Account and an Opportunity, call my discount method between Test.startTest and Test.stopTest, then query the Opportunity back and check the discount with an Assert method. That test data is never committed to the database; it's rolled back automatically. By default, tests can't see existing org data either, which keeps them independent. And classes annotated with @isTest don't count against the org's Apex code size limit. Arrange, act, assert is the structure I ask everyone on the team to follow, so any test reads the same way.

- @isTest on class and methods
- Methods are static void with no parameters
- Arrange, act, assert
- Data is rolled back automatically
- No org data visible by default

<sub>Also asked as: What is the @isTest annotation? · Structure of an Apex test class · at is test annotation · Is the testMethod keyword still used?</sub>

### What is @testSetup and how does it work?
*Fresher (0–2 yrs) · concept* · `apex-061`

A method annotated with @testSetup runs once before the test methods in that class and creates common test data. Each test method then sees a fresh copy of that data, because any changes a test method makes are rolled back before the next one runs. Say five test methods all need an Account with three Contacts. I create them once in testSetup instead of five times. And if the first test deletes a Contact, the second test still sees all three. Test methods get the records by querying them, since static variables set in the setup method aren't carried over. A class can have only one testSetup method, and it can't be used in a class annotated with seeAllData true. Also, if setup throws an error, every test in the class fails. I steer the team towards testSetup plus a data factory, so setup stays in one predictable place.

- Runs once per class before test methods
- Each test gets a clean copy of the data
- Query records in tests; statics are not kept
- One per class; not with seeAllData=true

<sub>Also asked as: Explain the testSetup annotation · How is testSetup different from creating data in each method? · test setup method apex · Do changes in one test method affect another when using testSetup?</sub>

### What do Test.startTest and Test.stopTest do?
*Fresher (0–2 yrs) · concept* · `apex-062`

Test.startTest and Test.stopTest mark the part of the test that exercises the code under test. Code between them gets a fresh set of governor limits, separate from the limits used to create test data, so setup doesn't distort the results. The second key behaviour is asynchronous code. Any future method, Queueable, Batch or Scheduled job started after startTest runs synchronously when stopTest is called, so I can assert on its results right after. For example, if my trigger enqueues a Queueable that updates the Account, I do the insert inside startTest and stopTest, and right after stopTest the Account is already updated. Each test method can call startTest only once. So my pattern is data creation before startTest, the method call inside, and asserts after stopTest. It's the first thing I check when someone tells me an async test randomly doesn't see its results.

- Fresh governor limits between them
- Async jobs complete at stopTest
- Only once per test method
- Setup before, act inside, assert after

<sub>Also asked as: Why use startTest and stopTest? · How do I make an async job finish in a test? · test dot start test stop test · Does startTest reset governor limits?</sub>

### What is System.runAs and what does it enforce?
*Fresher (0–2 yrs) · concept* · `apex-063`

System.runAs runs a block of test code as a specific user, so I can test behaviour for different profiles, roles or permission sets. It enforces the user's record sharing, so a with sharing class will only return records that user can see. On its own it doesn't enforce the user's object and field permissions. But if the code uses user mode or stripInaccessible, those checks run against the runAs user. For example, I create a sales rep user, run my controller as them, and assert they get only the Opportunities they're allowed to see, not a colleague's. I also use runAs to avoid mixed DML errors when creating users and business records in the same test. And it can only be used inside test methods. For any controller that exposes data, I expect at least one runAs test with a restricted user before I approve it.

- Runs a block as another user
- Enforces record sharing
- Not CRUD/FLS by itself; user-mode code will check them
- Also avoids mixed DML in tests
- Test methods only

<sub>Also asked as: How do you test code as a different user? · Does runAs enforce field level security? · system dot run as in test class · When would you use runAs?</sub>

### What is seeAllData and why should you avoid it?
*Fresher (0–2 yrs) · concept* · `apex-064`

By default, since API version 24.0, test methods can't see existing data in the org, which keeps tests isolated and repeatable. Setting @isTest(seeAllData=true) lets tests read real org data, but I avoid it. Tests then depend on records that may differ, or not exist, in another sandbox or in production, so deployments fail unpredictably. For example, a test that expects an Account called Test Customer to already exist passes in my sandbox, then fails in production because nobody ever created it there. Some setup data is visible anyway without seeAllData, like users, profiles, record types and organization details. For the standard price book I use Test.getStandardPricebookId instead of seeAllData. The few remaining cases are rare legacy objects that can't be created in tests. On my teams, seeAllData needs a written justification in the pull request.

- Default false since API 24.0
- seeAllData=true creates environment dependence
- Users, profiles, record types visible anyway
- Test.getStandardPricebookId for pricebooks

<sub>Also asked as: Explain @isTest(seeAllData=true) · Can test classes see org data? · see all data true disadvantages · How do you get the standard price book in a test?</sub>

### Write a test data factory class.
*Mid (3–6 yrs) · code* · `apex-065`

A test data factory is a public @isTest class with static methods that build valid records for tests. That way every test class doesn't repeat the same setup, and a new required field only needs one fix. Say an admin makes Industry required on Account. Without a factory, every test class that inserts an Account breaks. With one, I add Industry in the factory and they all pass again. I usually give the methods a count and a doInsert flag, so a test can tweak fields before inserting. The factory fills required fields and sensible defaults, and builds users with a unique username, because usernames are unique across all Salesforce orgs. Since it's annotated with @isTest, it doesn't count toward code size, and it can only be called from tests. I make the factory the single standard for test data on a project, and new test classes that build records by hand get sent back in review.

- Public @isTest class with static builders
- count and doInsert parameters for flexibility
- One place to fix new required fields
- Unique usernames for test users

```java
@isTest
public class TestDataFactory {
    public static List<Account> createAccounts(Integer count, Boolean doInsert) {
        List<Account> accs = new List<Account>();
        for (Integer i = 0; i < count; i++) {
            accs.add(new Account(Name = 'Test Account ' + i, Industry = 'Banking'));
        }
        if (doInsert) insert accs;
        return accs;
    }

    public static List<Contact> createContacts(List<Account> accs, Integer perAccount) {
        List<Contact> cons = new List<Contact>();
        for (Account a : accs) {
            for (Integer i = 0; i < perAccount; i++) {
                cons.add(new Contact(LastName = 'Contact ' + i, AccountId = a.Id));
            }
        }
        insert cons;
        return cons;
    }

    public static User buildUser(String profileName) {
        Profile p = [SELECT Id FROM Profile WHERE Name = :profileName LIMIT 1];
        String uniq = String.valueOf(Math.abs(Crypto.getRandomInteger()));
        return new User(Alias = 'tu' + uniq.left(4), LastName = 'Tester',
            Email = 'tu' + uniq + '@example.com', Username = 'tu' + uniq + '@example.com.test',
            ProfileId = p.Id, TimeZoneSidKey = 'Asia/Kolkata', LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8', LanguageLocaleKey = 'en_US');
    }
}
```

<sub>Also asked as: What is a TestDataFactory and why use it? · How do you create reusable test data? · test data factory example apex · How do you create a test user in Apex?</sub>

### Write a test class for a trigger, including bulk and negative cases.
*Mid (3–6 yrs) · code* · `apex-066`

For a trigger I insist on three things: the positive path, the negative path where the logic should not apply, and bulk, by inserting 200 records in one DML to prove it is bulkified. This example tests the trigger that sets Priority to High on opportunities under Hot accounts. Common data goes in @testSetup, the DML is wrapped in startTest and stopTest, and I assert on records queried back from the database, not on the in-memory list, because before-trigger changes are only visible after a re-query. Each assert has a message so a failure explains itself. For update triggers I also test the case where the relevant field changes and where it does not. That trio is my minimum bar before a trigger change gets approved.

- Positive, negative and bulk (200) cases
- Common data in @testSetup
- Re-query records before asserting
- Assert messages explain failures

```java
@isTest
private class OpportunityTriggerTest {
    @testSetup
    static void setup() {
        insert new List<Account>{
            new Account(Name = 'Hot Co', Rating = 'Hot'),
            new Account(Name = 'Cold Co', Rating = 'Cold')
        };
    }

    @isTest
    static void setsHighPriorityInBulk() {
        Account hot = [SELECT Id FROM Account WHERE Name = 'Hot Co'];
        List<Opportunity> opps = new List<Opportunity>();
        for (Integer i = 0; i < 200; i++) {
            opps.add(new Opportunity(Name = 'Opp ' + i, AccountId = hot.Id,
                StageName = 'Prospecting', CloseDate = Date.today().addDays(10)));
        }
        Test.startTest();
        insert opps;
        Test.stopTest();
        Assert.areEqual(200, [SELECT COUNT() FROM Opportunity WHERE Priority__c = 'High'],
            'All opportunities on a Hot account should be High priority');
    }

    @isTest
    static void leavesPriorityBlankForColdAccount() {
        Account cold = [SELECT Id FROM Account WHERE Name = 'Cold Co'];
        Opportunity o = new Opportunity(Name = 'Cold Opp', AccountId = cold.Id,
            StageName = 'Prospecting', CloseDate = Date.today().addDays(10));
        Test.startTest();
        insert o;
        Test.stopTest();
        Assert.isNull([SELECT Priority__c FROM Opportunity WHERE Id = :o.Id].Priority__c,
            'Priority should not be set for a Cold account');
    }
}
```

<sub>Also asked as: How do you test an Apex trigger? · Test class for before insert trigger · trigger test class with 200 records · What scenarios should a trigger test cover?</sub>

### How do you test that code throws an exception or that a validation rule blocks a record?
*Mid (3–6 yrs) · code* · `apex-067`

I call the code inside a try block and put Assert.fail right after the call, so the test fails if no exception happens. In the catch block I catch the specific exception type and assert on the message. Assert.fail throws an AssertException, which my specific catch doesn't swallow, so the test still fails correctly. For validation rules or addError in triggers, I prefer Database.insert with allOrNone false. Then I assert that isSuccess is false and check the status code or message, which avoids a try-catch entirely. For example, if a validation rule blocks Opportunities with a negative Amount, I insert one with minus 100 and assert the save failed with my rule's message. That proves the business rule is enforced, which coverage alone never shows. On my teams, every validation rule or addError the business cares about gets a negative test like this.

- try + Assert.fail after the call
- Catch the specific exception, assert message
- Database methods with allOrNone false for validation rules
- Check status code or message

```java
@isTest
static void throwsWhenStockIsLow() {
    Product2 p = new Product2(Name = 'Widget');
    insert p;
    Test.startTest();
    try {
        OrderService.reserve(p, 10, 2);
        Assert.fail('Expected InsufficientStockException');
    } catch (InsufficientStockException e) {
        Assert.isTrue(e.getMessage().contains('Only 2 units'), e.getMessage());
    }
    Test.stopTest();
}

@isTest
static void validationRuleBlocksContactWithoutEmail() {
    Database.SaveResult sr = Database.insert(new Contact(LastName = 'NoEmail'), false);
    Assert.isFalse(sr.isSuccess(), 'Insert should fail validation');
    Assert.areEqual(StatusCode.FIELD_CUSTOM_VALIDATION_EXCEPTION,
        sr.getErrors()[0].getStatusCode());
}
```

<sub>Also asked as: Testing negative scenarios in Apex · Assert that an exception was thrown · how to test addError in trigger · test class for validation rule error</sub>

### How do you test an HTTP callout using HttpCalloutMock?
*Mid (3–6 yrs) · code* · `apex-068`

Tests can't make real callouts, so I implement the HttpCalloutMock interface. Its respond method receives the HttpRequest and returns a fake HttpResponse with the status code, headers and body I choose. In the test I register it with Test.setMock before calling the code, and the platform routes every callout to my mock. I make the mock configurable, for example by passing in the status code, so I can test both success and error handling. Say my code calls a shipping API. One test gives the mock a 200 with a tracking number, another gives it a 500, and I check my error handling kicks in. Inside respond I can also assert on the request, like the method or endpoint, to check that my code builds it correctly. For SOAP callouts the equivalent is the WebServiceMock interface. I ask for at least one failure-path mock per integration, because the error handling is what runs in production at the worst moment.

- Implement HttpCalloutMock.respond
- Register with Test.setMock(HttpCalloutMock.class, mock)
- Configurable status to test success and failure
- Assert on the request inside respond
- WebServiceMock for SOAP

```java
@isTest
public class WeatherCalloutMock implements HttpCalloutMock {
    private Integer status;
    public WeatherCalloutMock(Integer status) { this.status = status; }

    public HttpResponse respond(HttpRequest req) {
        Assert.areEqual('GET', req.getMethod());
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setStatusCode(status);
        res.setBody(status == 200 ? '{"tempC":31}' : '{"error":"unavailable"}');
        return res;
    }
}

@isTest
private class WeatherServiceTest {
    @isTest
    static void returnsTemperatureOnSuccess() {
        Test.setMock(HttpCalloutMock.class, new WeatherCalloutMock(200));
        Test.startTest();
        Integer temp = WeatherService.getTemperature('Pune');
        Test.stopTest();
        Assert.areEqual(31, temp);
    }

    @isTest
    static void returnsNullOnServerError() {
        Test.setMock(HttpCalloutMock.class, new WeatherCalloutMock(500));
        Test.startTest();
        Integer temp = WeatherService.getTemperature('Pune');
        Test.stopTest();
        Assert.isNull(temp, 'Service should handle a 500 gracefully');
    }
}
```

<sub>Also asked as: Write a mock class for a REST callout · Callouts are not allowed in tests, what do you do? · http callout mock example · How does Test.setMock work?</sub>

### When would you use StaticResourceCalloutMock or MultiStaticResourceCalloutMock?
*Mid (3–6 yrs) · code* · `apex-069`

StaticResourceCalloutMock is a built-in mock that returns the body of a static resource. So I can store a realistic, large sample JSON response as a file instead of writing it inside the test. I set the resource name, status code and headers, then pass it to Test.setMock. For example, I take a full sample response from the vendor's API docs, save it as a static resource, and the test uses it exactly as is. When the code under test calls several different endpoints in one transaction, I use MultiStaticResourceCalloutMock and map each endpoint URL to its own static resource. These are quick and keep tests readable, but they always return the same response. So for dynamic behaviour, or for asserting on the request, I write a custom HttpCalloutMock instead. My rule of thumb for the team: static resources for realistic payloads, custom mocks when the logic depends on what was sent.

- StaticResourceCalloutMock: body from a static resource
- Set resource, status and headers
- MultiStaticResourceCalloutMock: endpoint to resource map
- Custom HttpCalloutMock for dynamic responses

```java
@isTest
static void parsesAccountsFromSampleResponse() {
    StaticResourceCalloutMock mock = new StaticResourceCalloutMock();
    mock.setStaticResource('ErpAccountsResponse');
    mock.setStatusCode(200);
    mock.setHeader('Content-Type', 'application/json');
    Test.setMock(HttpCalloutMock.class, mock);

    Test.startTest();
    List<Account> result = ErpSyncService.fetchAccounts();
    Test.stopTest();
    Assert.isFalse(result.isEmpty(), 'Accounts should be parsed from the sample');
}

// Several endpoints in one test
// MultiStaticResourceCalloutMock multi = new MultiStaticResourceCalloutMock();
// multi.setStaticResource('https://erp.example.com/accounts', 'ErpAccountsResponse');
// multi.setStaticResource('https://erp.example.com/orders', 'ErpOrdersResponse');
// multi.setStatusCode(200);
// Test.setMock(HttpCalloutMock.class, multi);
```

<sub>Also asked as: Mock a callout with a static resource · How do you test code that calls multiple endpoints? · static resource callout mock example · Store sample JSON response for tests</sub>

### How do you test a future method?
*Mid (3–6 yrs) · code* · `apex-070`

A future method runs asynchronously, so in a test it wouldn't finish before my asserts unless I wrap the call in Test.startTest and Test.stopTest. When stopTest runs, all queued asynchronous work, including future calls, executes synchronously. Then I query the database and assert the result. I create the data before startTest. If the future method makes a callout, I also set an HttpCalloutMock before calling it. The same pattern works when the future is called indirectly, for example from a trigger, as long as the DML that fires the trigger happens between startTest and stopTest. Say an Account trigger calls a future method that updates a related record. I insert the Account inside startTest and stopTest, and after stopTest I query that related record and assert on it. I'd steer new code towards Queueable over future anyway, but the testing pattern is the same.

- Wrap the call in startTest/stopTest
- Future runs at stopTest
- Query and assert after stopTest
- Set a mock if the future makes callouts

```java
public class ScoreService {
    @future
    public static void recalcScores(Set<Id> accountIds) {
        List<Account> accs = [SELECT Id, NumberOfEmployees FROM Account WHERE Id IN :accountIds];
        for (Account a : accs) {
            a.Rating = (a.NumberOfEmployees != null && a.NumberOfEmployees > 500) ? 'Hot' : 'Warm';
        }
        update accs;
    }
}

@isTest
private class ScoreServiceTest {
    @isTest
    static void futureSetsRating() {
        Account a = new Account(Name = 'Big Co', NumberOfEmployees = 1000);
        insert a;
        Test.startTest();
        ScoreService.recalcScores(new Set<Id>{ a.Id });
        Test.stopTest(); // future executes here
        Assert.areEqual('Hot', [SELECT Rating FROM Account WHERE Id = :a.Id].Rating);
    }
}
```

<sub>Also asked as: Test class for @future method · Future method is not executing in my test · how to test asynchronous future method · Why do I need stopTest for a future call?</sub>

### How do you test a Queueable class, especially one that chains another job?
*Senior (7–10 yrs) · code* · `apex-071`

I enqueue the job between Test.startTest and Test.stopTest. At stopTest it runs synchronously, so I can assert on the data, and on the AsyncApexJob status using the returned job Id. The catch is chaining. Older documentation said chaining Queueable jobs in an Apex test throws an error, and the current docs only support testing chains with an appropriate stack depth. So I still guard the chain. The simplest guard is checking Test.isRunningTest before enqueueing the next job, but a cleaner design is to make the chaining decision a separate, testable method, or inject a flag. Say job A processes invoices and then enqueues job B to send emails. I test A on its own, test B by enqueueing it directly with the right input, and test the chaining logic itself as plain unit logic. When I review chained jobs, I also check that the chain has a clear stopping condition, because an unbounded chain is a bigger risk than a missing test.

- Enqueue inside startTest/stopTest
- Assert data and AsyncApexJob status
- Chaining in tests is restricted
- Guard the chain; test each link separately

```java
public class CleanupJob implements Queueable {
    @TestVisible private static Boolean allowChaining = !Test.isRunningTest();
    private List<Id> ids;
    public CleanupJob(List<Id> ids) { this.ids = ids; }

    public void execute(QueueableContext ctx) {
        List<Id> now = new List<Id>();
        List<Id> rest = new List<Id>();
        for (Integer i = 0; i < ids.size(); i++) {
            if (i < 100) now.add(ids[i]); else rest.add(ids[i]);
        }
        delete [SELECT Id FROM Task WHERE Id IN :now];
        if (!rest.isEmpty() && allowChaining) {
            System.enqueueJob(new CleanupJob(rest));
        }
    }
}

@isTest
private class CleanupJobTest {
    @isTest
    static void deletesFirstChunk() {
        List<Task> tasks = new List<Task>();
        for (Integer i = 0; i < 150; i++) tasks.add(new Task(Subject = 'Old ' + i));
        insert tasks;
        List<Id> ids = new List<Id>(new Map<Id, Task>(tasks).keySet());
        Test.startTest();
        Id jobId = System.enqueueJob(new CleanupJob(ids));
        Test.stopTest();
        Assert.areEqual(50, [SELECT COUNT() FROM Task]);
        Assert.areEqual('Completed', [SELECT Status FROM AsyncApexJob WHERE Id = :jobId].Status);
    }
}
```

<sub>Also asked as: Test class for Queueable Apex · Chaining queueable in test class gives error · how to test queueable chaining · Check AsyncApexJob status in a test</sub>

### How do you test a Batch Apex class?
*Mid (3–6 yrs) · code* · `apex-072`

I create test data, call Database.executeBatch between Test.startTest and Test.stopTest, and at stopTest the start, execute and finish methods all run synchronously. Then I query and assert. The important rule is that a test can only run one execute chunk, so the number of test records must fit in a single scope. With the default scope, that means 200 or fewer records. So 150 test records is fine, but 250 is not. If I need to test the logic on more data, I test the execute method's helper directly. I also cover the finish method's behaviour, like a summary email or a chained job, and the error handling, using some records that are set up to fail. In review I check the test data count against the scope size, because that's a common reason batch tests fail for no obvious reason.

- executeBatch inside startTest/stopTest
- start, execute and finish run at stopTest
- Only one execute chunk in a test; keep records within scope
- Test finish and failure paths

```java
public class ContactCleanupBatch implements Database.Batchable<SObject> {
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator(
            [SELECT Id FROM Contact WHERE Email = null AND Is_Active__c = true]);
    }
    public void execute(Database.BatchableContext bc, List<Contact> scope) {
        for (Contact c : scope) c.Is_Active__c = false;
        update scope;
    }
    public void finish(Database.BatchableContext bc) {}
}

@isTest
private class ContactCleanupBatchTest {
    @isTest
    static void deactivatesContactsWithoutEmail() {
        List<Contact> cons = new List<Contact>();
        for (Integer i = 0; i < 200; i++) {
            cons.add(new Contact(LastName = 'C' + i, Is_Active__c = true));
        }
        insert cons;
        Test.startTest();
        Database.executeBatch(new ContactCleanupBatch(), 200);
        Test.stopTest();
        Assert.areEqual(0, [SELECT COUNT() FROM Contact WHERE Is_Active__c = true]);
    }
}
```

<sub>Also asked as: Test class for batch apex · Why does my batch test process only 200 records? · how to test database.executebatch · Batch apex test with startTest and stopTest</sub>

### How do you test a Schedulable class?
*Mid (3–6 yrs) · code* · `apex-073`

I call System.schedule with a job name, a CRON expression and an instance of my class, inside Test.startTest and Test.stopTest. It returns the CronTrigger Id, so I query CronTrigger and assert that the expression and next fire time were stored correctly. The scheduled job runs as part of stopTest. A scheduler usually just launches a batch or a Queueable, so I keep it very thin. For example, my nightly cleanup scheduler only has one line that calls executeBatch on the cleanup batch. The real business logic is tested in the batch's own test class, so the scheduler test only proves the scheduling and wiring work. I also make sure the job name is unique, or the schedule call fails. Thin schedulers are a team standard for me, because logic buried in a scheduler is hard to rerun manually when something goes wrong.

- System.schedule inside startTest/stopTest
- Query CronTrigger by the returned Id
- Keep the scheduler thin
- Test business logic in the batch test
- Job names must be unique

```java
public class NightlyCleanupScheduler implements Schedulable {
    public void execute(SchedulableContext sc) {
        Database.executeBatch(new ContactCleanupBatch(), 200);
    }
}

@isTest
private class NightlyCleanupSchedulerTest {
    @isTest
    static void schedulesNightlyJob() {
        String cron = '0 0 2 * * ?'; // 2 AM daily
        Test.startTest();
        Id jobId = System.schedule('Nightly cleanup test', cron, new NightlyCleanupScheduler());
        Test.stopTest();
        CronTrigger ct = [SELECT CronExpression, NextFireTime FROM CronTrigger WHERE Id = :jobId];
        Assert.areEqual(cron, ct.CronExpression);
        Assert.isNotNull(ct.NextFireTime);
    }
}
```

<sub>Also asked as: Test class for scheduled Apex · How to test System.schedule · schedulable apex test class example · Verify a CRON expression in a test</sub>

### What is the Assert class and how is it different from System.assertEquals?
*Fresher (0–2 yrs) · comparison* · `apex-074`

The Assert class is the newer, more readable way to write assertions in Apex tests. It has Assert.areEqual and areNotEqual, isTrue and isFalse, isNull and isNotNull, isInstanceOfType, and Assert.fail to fail a test on purpose. The older System.assert, assertEquals and assertNotEquals still work, but the Assert names make the intent clearer, and it adds checks like type checks and an explicit fail. For example, Assert.areEqual with expected 'High', the actual priority, and the message 'Hot accounts should get High priority' tells you exactly what broke when it fails. Either way, I always pass a message as the last argument. A test without assertions only produces coverage and proves nothing, so every test method should verify the expected outcome. Messages on asserts are something I ask for in every review.

- Assert.areEqual, isTrue, isNull, isInstanceOfType, fail
- System.assert methods still supported
- Assert class is clearer and richer
- Always add a failure message
- No asserts = coverage only

```java
Assert.areEqual(200, results.size(), 'All 200 records should be processed');
Assert.isTrue(acc.Rating == 'Hot', 'Rating should be Hot');
Assert.isNotNull(acc.Id, 'Account should be inserted');
Assert.isInstanceOfType(ex, DmlException.class, 'Expected a DmlException');
// Older style, still valid:
System.assertEquals(200, results.size(), 'All 200 records should be processed');
```

<sub>Also asked as: Assert.areEqual vs System.assertEquals · What assert methods are available in Apex? · new assert class in apex · Why should test methods have asserts?</sub>

### How do you mock dependencies in Apex tests using the Stub API?
*Senior (7–10 yrs) · code* · `apex-075`

The Stub API lets me create a fake version of a class at runtime. I implement System.StubProvider, whose handleMethodCall method receives the method name and arguments and returns whatever I want, then call Test.createStub with the class type and my provider. For it to be useful, the code under test must accept the dependency, for example through its constructor, so I can pass the stub instead of the real selector. Say my service gets overdue invoices from an InvoiceSelector. Instead of inserting invoices, the stub just returns three in-memory ones. No DML, no SOQL, so the test runs fast, and I can simulate cases that are hard to set up. The limitations: it can't stub static methods, private methods or system classes, and it only works in test context. The trade-off is extra design work up front, so I use stubs where they speed up the suite and keep a few real-DML tests for the full flow.

- Implement System.StubProvider.handleMethodCall
- Test.createStub(Type, provider)
- Requires dependency injection in the code
- No DML/SOQL: fast, isolated tests
- Cannot stub static or private methods

```java
public virtual class AccountSelector {
    public virtual List<Account> getHotAccounts() {
        return [SELECT Id, Name FROM Account WHERE Rating = 'Hot' WITH USER_MODE];
    }
}
public with sharing class AccountService {
    private AccountSelector selector;
    public AccountService(AccountSelector selector) { this.selector = selector; }
    public Integer countHot() { return selector.getHotAccounts().size(); }
}

@isTest
private class AccountServiceTest {
    private class SelectorStub implements System.StubProvider {
        public Object handleMethodCall(Object stubbedObject, String methodName, Type returnType,
                List<Type> paramTypes, List<String> paramNames, List<Object> args) {
            if (methodName == 'getHotAccounts') {
                return new List<Account>{ new Account(Name = 'A'), new Account(Name = 'B') };
            }
            return null;
        }
    }

    @isTest
    static void countsHotAccountsWithoutDml() {
        AccountSelector stub = (AccountSelector) Test.createStub(
            AccountSelector.class, new SelectorStub());
        Assert.areEqual(2, new AccountService(stub).countHot());
    }
}
```

<sub>Also asked as: Explain StubProvider and Test.createStub · Mocking in Apex without DML · apex stub api example · How do you unit test a service without querying the database?</sub>

### How do you design Apex code so that it is easy to test?
*Senior (7–10 yrs) · design* · `apex-076`

I'd design for testability from day one rather than retrofit it. I separate concerns so each piece can be tested alone. Triggers only delegate to handlers, business logic sits in services, and queries sit in selector classes. Dependencies like selectors, callout clients or the current date are passed in through constructors or exposed as @TestVisible variables, so a test can swap in a stub or a fixed value. For example, if renewal logic depends on today's date, I pass the date in, so the test can say 'pretend it's 31 March' and check the result. I program to interfaces for things like external services, so I can provide a fake. That lets most tests be fast unit tests using the Stub API or a mocking library like ApexMocks, while a smaller set of integration tests do real DML to prove the full flow, including triggers and validation rules. I explain that balance to the team as a pyramid: lots of fast unit tests, fewer slow end-to-end ones.

- Separate trigger, service and selector layers
- Inject dependencies via constructor or @TestVisible
- Interfaces for external services
- Many fast unit tests, fewer integration tests
- Stub API or ApexMocks for mocking

<sub>Also asked as: What makes Apex code testable? · Dependency injection in Apex · how to write testable apex code · Unit tests vs integration tests in Salesforce</sub>

### Your production deployment fails because code coverage is 74 percent. What do you do?
*Mid (3–6 yrs) · scenario* · `apex-077`

I'd fix it with real tests, not filler. First I find where the coverage is missing. I run all tests in a sandbox that matches production and check the coverage per class in the Developer Console, Setup, or the Salesforce CLI with code coverage output, sorting by uncovered lines. Usually a few big classes or old unused code pull it down. For example, one large class sitting at 30 percent can be the whole reason the org is at 74. I write proper tests for the uncovered branches, especially error handling and else paths, using a data factory and real asserts. I also delete dead code, because removing unused classes raises the percentage honestly. If I deploy with specified tests, I remember that each class and trigger in the package must reach 75 percent individually. And I avoid tests that only exist to touch lines. Then I'd add a coverage check to the pipeline, so we find out at pull request time, not on deployment day.

- Find low-coverage classes via Developer Console or CLI
- Test uncovered branches with real asserts
- Remove dead code
- RunSpecifiedTests needs 75% per component
- No assert-free coverage tests

<sub>Also asked as: Deployment failed due to insufficient code coverage · How do you increase code coverage quickly but properly? · code coverage below 75 deployment error · Which classes are pulling the coverage down?</sub>

### Tests pass in the sandbox but fail during production deployment. What could be wrong?
*Senior (7–10 yrs) · scenario* · `apex-078`

Almost always, the tests depend on the environment. Typical causes are seeAllData, or queries that expect existing records; hard-coded Ids, or record type and profile names that differ in production; validation rules, required fields, duplicate rules or flows that exist in production but not in the sandbox, so my test data no longer saves; custom settings or metadata values that differ; and date-dependent logic. For example, production has a validation rule requiring Phone on Account and the sandbox doesn't. Every test that inserts an Account without a phone passes in the sandbox and fails in production. The fix is making tests self-contained. Create all data through a factory, look up record types by DeveloperName, avoid seeAllData, and set required configuration inside the test. I validate the deployment first and run all local tests in a recently refreshed full or partial copy sandbox. I'd also keep sandboxes refreshed on a regular cadence, because configuration drift between sandbox and production is usually the root cause.

- Dependence on existing data or seeAllData
- Hard-coded Ids or names
- Extra validation rules or flows in prod
- Different custom settings/metadata; date logic
- Self-contained tests; validate before deploy

<sub>Also asked as: Test classes fail only in production · Why do my tests behave differently in prod? · test failing in production deployment but passing in sandbox · How do you make tests environment independent?</sub>

### Your test fails with MIXED_DML_OPERATION when you create a User and an Account. How do you fix the test?
*Mid (3–6 yrs) · scenario* · `apex-079`

In tests the fix is System.runAs. I insert the User, or other setup records like a group member or permission set assignment, inside a runAs block. The runAs block starts a separate context, so the setup DML and the business DML no longer collide. A common pattern is to run as the current user, by creating a User sObject with UserInfo.getUserId, just to get that separate context. Then I create the Account and test data outside the block, or inside another runAs block for the new user if I want to test their access. This only applies to tests; in production code I use async processing instead. I keep a small helper for this in the test data factory, so nobody on the team has to rediscover the pattern.

- Wrap setup DML in System.runAs
- runAs with the current user just for the context
- Business data outside or in another runAs
- Production code uses async instead

```java
@isTest
static void repSeesOwnAccount() {
    User rep = TestDataFactory.buildUser('Standard User');
    System.runAs(new User(Id = UserInfo.getUserId())) {
        insert rep;
        PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'Sales_Rep_Access'];
        insert new PermissionSetAssignment(AssigneeId = rep.Id, PermissionSetId = ps.Id);
    }
    System.runAs(rep) {
        insert new Account(Name = 'Rep Account');
        Assert.areEqual(1, [SELECT COUNT() FROM Account]);
    }
}
```

<sub>Also asked as: Mixed DML error in test class · How to insert user and account in the same test method · runAs to avoid mixed dml in test · Setup object and non-setup object in test class error</sub>

### Your callout test fails with 'You have uncommitted work pending'. How do you fix the test?
*Mid (3–6 yrs) · scenario* · `apex-080`

In a test, creating records and then calling code that makes a callout looks like DML followed by a callout in one transaction, which is not allowed. The fix is to do all the test data DML before Test.startTest, then call Test.startTest, set the mock with Test.setMock, and call the callout code before stopTest; the docs say startTest must come before setMock in this case. The platform treats the part inside startTest and stopTest separately, so the callout is allowed. If the code itself does DML and then a callout, that is a real bug, not just a test problem, and the code should be refactored to call out first or move the callout to a Queueable. When a test hits this, I ask the developer to check whether the production path has the same problem, because it often does.

- DML first, before Test.startTest
- startTest first, then setMock, then the callout
- If the production code does DML then callout, fix the code

```java
@isTest
static void syncsAccountToErp() {
    Account acc = new Account(Name = 'Sync Me');
    insert acc;                                     // DML before startTest

    Test.startTest();                               // startTest before setMock
    Test.setMock(HttpCalloutMock.class, new ErpCalloutMock(200));
    ErpSyncService.pushAccount(acc.Id);            // callout happens here
    Test.stopTest();

    Assert.isNotNull([SELECT ERP_Id__c FROM Account WHERE Id = :acc.Id].ERP_Id__c);
}
```

<sub>Also asked as: Callout test fails after inserting test data · uncommitted work pending in test class · DML before mock callout in test · How to insert test data and test a callout in the same method</sub>

### Your Apex test suite is slow and has random failures in CI. How do you stabilize it?
*Senior (7–10 yrs) · scenario* · `apex-081`

Random failures usually come from parallel test runs touching the same rows, which shows up as UNABLE_TO_LOCK_ROW, often on shared records like custom settings or the standard price book. Or they come from tests that depend on dates, record order or existing data. For example, a test that queries with LIMIT 1 and no ORDER BY, and expects a particular record back, can pass one run and fail the next. So I make every test create its own data, avoid seeAllData, never rely on query order without ORDER BY, and use fixed dates where logic is date-sensitive. For speed I use @testSetup, reduce data volumes to what each test needs, and replace database-heavy unit tests with stubs. If a few tests genuinely conflict, I isolate them or disable parallel testing for that suite. In CI I run targeted tests per change and the full local suite nightly. I'd also track flaky tests as real defects with an owner, because a suite people don't trust stops protecting anything.

- Lock errors from parallel tests on shared rows
- Self-contained data; no reliance on order or dates
- @testSetup and smaller data volumes
- Stubs instead of DML for unit tests
- Targeted tests per change, full suite nightly

<sub>Also asked as: Flaky Apex tests in the pipeline · UNABLE_TO_LOCK_ROW in test runs · how to speed up apex test execution · Tests fail randomly when run in parallel</sub>

### How do you test Apex logic that depends on custom metadata records?
*Senior (7–10 yrs) · scenario* · `apex-082`

I can't insert custom metadata records with DML in a test. Tests can read the deployed records without seeAllData, but relying on them is fragile, because an admin can change the values and break the tests. So I design the code to read metadata through one place, for example a @TestVisible static variable or a small selector, and in the test I inject in-memory records. A reliable way to build them with field values is JSON.deserialize into the metadata type. For example, say a discount rule record gives Gold customers 10 percent. My test injects its own Gold rule at 10 percent, so if an admin changes the real one to 12, the test still passes. That way the test controls exactly which configuration exists, covers each branch, and keeps passing whatever is configured in the org. I'd make that injection point a standard in our selector layer, so every metadata-driven feature is testable the same way.

- No DML on custom metadata in tests
- Deployed records are visible but fragile to depend on
- Read metadata through one injectable place
- Build in-memory records with JSON.deserialize

```java
// In the class under test
@TestVisible
private static Map<String, Feature_Flag__mdt> flags = Feature_Flag__mdt.getAll();

// In the test
@isTest
static void skipsAssignmentWhenFlagOff() {
    List<Feature_Flag__mdt> fake = (List<Feature_Flag__mdt>) JSON.deserialize(
        '[{"DeveloperName":"Auto_Assign_Cases","Is_Active__c":false}]',
        List<Feature_Flag__mdt>.class);
    FeatureFlags.flags = new Map<String, Feature_Flag__mdt>{ 'Auto_Assign_Cases' => fake[0] };
    Assert.isFalse(FeatureFlags.isOn('Auto_Assign_Cases'));
}
```

<sub>Also asked as: Can you insert custom metadata in a test class? · Mock custom metadata in Apex tests · custom metadata type in test class · My test depends on a specific mdt record</sub>

### What are the best practices for writing Apex test classes?
*Fresher (0–2 yrs) · concept* · `apex-083`

I create all my own test data, ideally through a test data factory, and avoid seeAllData so tests run the same in every org. I use @testSetup for shared data and wrap the code under test in Test.startTest and Test.stopTest. I test positive, negative and bulk scenarios, with at least 200 records for triggers, and use System.runAs to test different users and permissions. Every test has meaningful asserts with messages, not just coverage. I mock callouts with HttpCalloutMock, never hard-code Ids, and keep each test method focused on one behaviour with a descriptive name. For example, a method called discountNotAppliedForInactiveAccount tells you what broke before you even open the code. Finally, I aim well above 75 percent, but I care more about covering the important logic paths. These are also the points I check when I review someone's test class.

- Own data via a factory; no seeAllData
- @testSetup and startTest/stopTest
- Positive, negative, bulk and user-based tests
- Meaningful asserts with messages
- Mock callouts; no hard-coded Ids

<sub>Also asked as: How do you write good test classes? · Test class best practices in Salesforce · what should a good apex test cover · Common mistakes in test classes</sub>

### How do you test that sharing rules are respected by your Apex code?
*Mid (3–6 yrs) · code* · `apex-084`

I create a user with a limited profile, create records owned by someone else, then call my code inside System.runAs for that user and assert they only get records they should see. Because runAs enforces record sharing, this proves that my class is declared with sharing and that the queries do not leak data. It depends on the org-wide default for the object being private, so I note that in the test. I also add the positive case, where the user owns a record or has it shared, and assert it is returned. If the code uses user mode, the same test also checks object and field permissions. For anything that returns customer or financial data, I treat a sharing test like this as required, not optional.

- Create a limited user and records owned by another user
- Call the code inside System.runAs
- Assert the user sees only allowed records
- Add the positive case too

```java
@isTest
static void repCannotSeeOthersAccounts() {
    // Assumes Account org-wide default is Private
    User rep = TestDataFactory.buildUser('Standard User');
    System.runAs(new User(Id = UserInfo.getUserId())) {
        insert rep;
    }
    insert new Account(Name = 'Admin Owned');      // owned by the running admin

    System.runAs(rep) {
        insert new Account(Name = 'Rep Owned');
        List<Account> visible = AccountQueryService.getMyVisibleAccounts(); // with sharing
        Assert.areEqual(1, visible.size(), 'Rep should only see their own account');
        Assert.areEqual('Rep Owned', visible[0].Name);
    }
}
```

<sub>Also asked as: Test with sharing in a test class · Verify a user cannot see another user's records · runas test for record visibility · How do you test org-wide defaults in Apex tests?</sub>

### Is using Test.isRunningTest in production code a good practice?
*Senior (7–10 yrs) · concept* · `apex-085`

No, I'd avoid it. In general it's a code smell, because the code then behaves differently in tests than in production, so the test isn't really verifying the real path. Say a method checks Test.isRunningTest and skips a step when it's true. The test passes, but that step was never exercised. I accept it only in narrow cases where the platform gives no other option, for example avoiding Queueable chaining, which tests have historically not allowed, or skipping something that can't run in test context. Even then, I prefer to wrap it in a @TestVisible flag or setting so the test controls it explicitly. The better alternatives are dependency injection, the Stub API, HttpCalloutMock for callouts, and @TestVisible variables to override configuration. Those keep the production logic identical in both contexts. In review, a new Test.isRunningTest check gets questioned every time.

- Usually a smell: tests skip the real path
- Acceptable narrowly, e.g. Queueable chaining
- Prefer a @TestVisible flag the test controls
- Use DI, Stub API and mocks instead

<sub>Also asked as: When is Test.isRunningTest acceptable? · Why is Test.isRunningTest considered a code smell? · test is running test in apex class · Alternatives to Test.isRunningTest</sub>
