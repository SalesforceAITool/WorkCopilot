# Sales Cloud and Service Cloud

85 questions. Levels: Fresher (0–2 yrs) 29 · Mid (3–6 yrs) 35 · Senior (7–10 yrs) 21

## Sales Cloud

### What is a Lead in Salesforce and how does the lead process work?
*Fresher (0–2 yrs) · concept* · `sales-001`

A Lead is a person or company that has shown interest but isn't qualified yet as a real sales opportunity. The lead process is just the set of Lead Status picklist values it moves through, like Open, Contacted, Working, Qualified and Unqualified. Say a laptop seller gets a web form from an office manager asking about fifty laptops. That comes in as a lead, an assignment rule routes it to a rep or a queue, and the rep calls and moves it to Contacted, then Working. Once budget and timing check out, it's Qualified, and the rep converts it into an Account, a Contact and, if there's a real deal, an Opportunity. Leads can also come in from imports, campaigns or integrations. One thing to remember: if business units qualify leads differently, you can have separate lead processes and attach each one through a record type. Before building any of it, I get sales and marketing to agree in writing what Qualified actually means, because that definition drives every conversion and pipeline report after it.

- Lead = unqualified prospect, separate object from Contact
- Lead process = set of Lead Status values, tied to record types
- At least one status must be marked Converted
- End of the lifecycle is conversion or disqualification

<sub>Also asked as: Explain the lead lifecycle in Sales Cloud · What is a lead and what is a lead process? · how do leads work in salesforce · What are lead statuses used for?</sub>

### What happens when you convert a lead?
*Fresher (0–2 yrs) · concept* · `sales-002`

Conversion is a one-way step, so I treat it carefully. When I convert a lead, Salesforce creates an Account, a Contact and, optionally, an Opportunity from the lead data. Say a rep converts a lead for Priya from a small accounting firm. If that firm already exists as an account, I'd link the lead to it instead of creating a new one, and the same for an existing contact. That's how you avoid duplicates. The lead itself isn't deleted. It's marked IsConverted true, becomes read-only for normal users, and keeps the new record Ids in ConvertedAccountId, ConvertedContactId and ConvertedOpportunityId. Priya's campaign memberships and open activities move over to her contact. The gotcha is fields: standard fields map automatically, but custom fields only carry over if you map them in the lead field mapping setup. On my teams, any new custom Lead field has to come with a mapping decision in the same story, otherwise data quietly gets lost at conversion.

- Creates Account, Contact and optional Opportunity
- Can merge into existing Account or Contact
- Lead stays in the system, flagged IsConverted, read-only
- Custom fields need Map Lead Fields setup

<sub>Also asked as: Explain lead conversion in Salesforce · Which records get created on lead conversion? · what happens to the lead after you convert it · Lead convert kya karta hai, which objects are created?</sub>

### A custom field on Lead is not carrying over to the Contact after conversion. Why, and how do you fix it?
*Mid (3–6 yrs) · scenario* · `sales-003`

Almost always this is a missing field mapping. Standard lead fields map on their own, but a custom field only carries over if you map it. I'd go to the Lead object's Fields and Relationships, open Map Lead Fields, and map it to a matching custom field on Account, Contact or Opportunity. Say the lead has a custom Preferred Laptop Model text field, 100 characters long. The contact field has to be a compatible type, like text to text, or picklist to picklist or text, and at least as long, so 100 or more. Each lead field can map to only one target field, so you can't send that one field to both the contact and the opportunity. If the mapping is already there, I check field-level security on the target field, and then whether a trigger or flow on the contact is overwriting the value right after conversion. To stop it recurring, I add Map Lead Fields to the definition of done for any new Lead field, and I check it in review.

- Map Lead Fields is under Lead object setup
- Target must be a compatible data type and length
- One lead field maps to one target field
- Also check FLS and automation overwriting the value

<sub>Also asked as: How does lead field mapping work for custom fields? · Custom lead field data lost after converting lead · Where do you map lead fields to account contact opportunity? · lead custom field not copying on convert</sub>

### What are lead assignment rules?
*Fresher (0–2 yrs) · concept* · `sales-004`

Lead assignment rules set the owner of a lead automatically, either a user or a queue, based on criteria like country, industry or lead source. Only one lead assignment rule can be active at a time, but it can have many entries, and Salesforce checks them in order and stops at the first match. For example, entry one says country is India, send to the India queue. Entry two says industry is Education, send to Ravi. A lead from a school in India hits entry one first, so it goes to the India queue, not to Ravi. That's why the order matters, and it's the first thing I review when someone asks for a new entry: where it sits can silently change who gets every other lead. The rules fire for web-to-lead, imports with the option ticked, API inserts that pass the assignment rule header, and manual creates when the user checks the assign-using-active-rule box. If nothing matches, the lead goes to the default lead owner set in Lead Settings.

- One active rule, many ordered entries, first match wins
- Owner can be a user or a queue
- Default lead owner catches leads with no match
- In Apex use Database.DMLOptions assignmentRuleHeader

<sub>Also asked as: How do you auto assign leads to reps or queues? · Explain assignment rules for leads · how many lead assignment rules can be active · How does Salesforce decide who owns a new lead?</sub>

### What is Web-to-Lead and what are its limitations?
*Fresher (0–2 yrs) · concept* · `sales-005`

Web-to-Lead generates an HTML form from Setup that posts straight into Salesforce and creates a lead. You pick the fields, Salesforce gives you the HTML, and the web team puts it on the site. You can turn on reCAPTCHA to cut spam, and assignment and auto-response rules can fire on those leads. The big limit is a daily cap of 500 leads. Say a laptop seller runs a sale banner and gets 800 enquiries in one day. The extra 300 aren't created as leads that day; they're held, and the default creator gets an email with them. There's also no built-in duplicate prevention on the form, so the same person submitting twice gives you two leads, and validation and file upload support are limited. For that kind of volume or a richer form, I'd push the team away from Web-to-Lead and use an integration through the API, or a Flow-based form on an Experience Cloud site. I'd also check the expected peak volume with marketing up front, because the 500 cap usually surfaces on the busiest campaign day.

- Generates HTML form that posts to Salesforce
- Daily limit of 500 web-to-lead submissions
- Enable reCAPTCHA to fight spam
- Assignment and auto-response rules can fire

<sub>Also asked as: How do you capture leads from a website form? · Explain web to lead · web to lead daily limit · How does a website form create leads in Salesforce?</sub>

### How do you convert leads in Apex using Database.convertLead?
*Mid (3–6 yrs) · code* · `sales-006`

My standard here is always bulk conversion. I build a list of Database.LeadConvert objects, one per lead, and pass the whole list to Database.convertLead in a single call so it stays bulkified. For each one I set the lead Id and a converted status. That status has to be a Lead Status value marked as converted, so I query LeadStatus where IsConverted is true instead of hard-coding it. To merge into existing records I call setAccountId or setContactId, I use setDoNotCreateOpportunity when there's no deal yet, and setOwnerId to change the owner. Say a nightly job converts 200 qualified leads and three of them fail a validation rule on Contact. I use the allOrNone false version and loop through the LeadConvertResult list to log those three errors. That matters because validation rules on Account, Contact or Opportunity can fail individual conversions. In code review I specifically look for a hard-coded converted status or convertLead inside a loop; both get sent back.

- One LeadConvert per lead, one convertLead call for the list
- Converted status comes from LeadStatus where IsConverted = true
- setAccountId / setContactId to avoid duplicates
- Check LeadConvertResult for per-record errors

```java
public with sharing class LeadConversionService {
    public static List<Database.LeadConvertResult> convert(List<Lead> leads) {
        LeadStatus convertedStatus = [
            SELECT MasterLabel FROM LeadStatus WHERE IsConverted = true LIMIT 1
        ];
        List<Database.LeadConvert> requests = new List<Database.LeadConvert>();
        for (Lead l : leads) {
            Database.LeadConvert lc = new Database.LeadConvert();
            lc.setLeadId(l.Id);
            lc.setConvertedStatus(convertedStatus.MasterLabel);
            lc.setDoNotCreateOpportunity(l.Rating != 'Hot');
            requests.add(lc);
        }
        List<Database.LeadConvertResult> results = Database.convertLead(requests, false);
        for (Database.LeadConvertResult r : results) {
            if (!r.isSuccess()) {
                System.debug(LoggingLevel.ERROR, r.getLeadId() + ': ' + r.getErrors()[0].getMessage());
            }
        }
        return results;
    }
}
```

<sub>Also asked as: Write Apex code to convert a lead · convert lead programmatically · What is the LeadConvert class used for? · How do you bulk convert leads with Apex without creating an opportunity?</sub>

### Users are getting an error when they try to convert a lead. How would you troubleshoot it?
*Mid (3–6 yrs) · scenario* · `sales-007`

I start from the target objects, because most lead conversion errors actually come from there. First I read the error and see whether it's about the Account, Contact or Opportunity. The usual causes are a validation rule or required field on one of those that the lead data doesn't satisfy, a trigger or flow on the new records throwing an exception, or a duplicate rule blocking the new account or contact. For example, if the message says Region is required on Opportunity, the lead probably has no region, so the new opportunity can't save. I also check that the user has create permission on all three objects, that the Convert Leads permission is enabled, and that the lead process has a converted status. Sometimes the fix is a bypass for validation rules during conversion, using the IsConverted context or a lead conversion-specific check. I'd be careful with that bypass though: it has to be narrow and documented, so we're not weakening data quality just to make the error go away.

- Errors usually come from Account, Contact or Opportunity rules
- Check required fields, validation rules, triggers, duplicate rules
- User needs Convert Leads permission and create access
- Lead process must have a converted status

<sub>Also asked as: Lead conversion failing, what do you check? · Why does lead convert throw a validation error? · lead convert button giving error · Common reasons lead conversion fails</sub>

### What is the difference between a Business Account and a Person Account?
*Fresher (0–2 yrs) · comparison* · `sales-008`

A Business Account is a company, and the people who work there are separate Contacts linked to it. That's the classic B2B model. A Person Account is an individual customer, like in retail banking or insurance, and it combines account and contact into one record, so personal fields like birthdate show right on the account page. For example, a laptop seller that sells to companies uses business accounts, but if it also sells direct to students, each student could be a person account. Under the hood a Person Account still has a hidden contact record, and IsPersonAccount and PersonContactId tell you which is which. Person Accounts have to be enabled and need a person account record type. The big gotcha is that once enabled, they can't be turned off, so I always treat it as a design decision, not a quick setting. I'd want the business model confirmed, test it in a sandbox, and check how it affects integrations and reports before anyone enables it in production.

- Business Account = company with related Contacts (B2B)
- Person Account = individual, account and contact combined (B2C)
- Has a hidden contact; check IsPersonAccount
- Enabling Person Accounts cannot be reversed

<sub>Also asked as: When would you use Person Accounts? · Explain person accounts in Salesforce · B2B vs B2C account model · person account versus account and contact</sub>

### What are opportunity stages, and how do they relate to probability and forecast category?
*Fresher (0–2 yrs) · concept* · `sales-009`

Opportunity Stage shows where a deal is in the sales cycle, like Prospecting, Qualification, Proposal, Negotiation, Closed Won and Closed Lost. Each stage value is set up with a default probability, a forecast category such as Pipeline, Best Case, Commit, Closed or Omitted, and a type of open, closed won or closed lost. When a rep changes the stage, probability and forecast category default from that setup, though users with edit access can override them. Say a rep moves a laptop deal to Negotiation, and Negotiation is set up as Commit. The deal now shows in the manager's Commit number. If the rep overrides it back to Best Case, the forecast follows the override. That's the key point: forecasts and pipeline reports read the forecast category, so getting the stage setup right is what keeps forecasting accurate. That's why I'd agree the stage-to-category mapping with sales leadership rather than letting admins pick defaults.

- Stage values set default probability and forecast category
- Forecast categories: Pipeline, Best Case, Commit, Closed, Omitted
- Each stage is Open, Closed/Won or Closed/Lost
- Forecasts read forecast category, not stage

<sub>Also asked as: Explain opportunity stage, probability and forecast category · How does stage drive forecast category? · what is opportunity stage name · What happens to probability when I change the stage?</sub>

### What is a Sales Process and how is it connected to record types?
*Fresher (0–2 yrs) · concept* · `sales-010`

A Sales Process is a subset of the Opportunity Stage picklist values that one team uses. You create the sales process, pick which stages it includes, and assign it to an opportunity record type. Users get that record type through their profile or permission set, so they only see their own stages. For example, a laptop seller's renewals team might only need Prospecting, Negotiation, Closed Won and Closed Lost, while the new-business team uses the full list. That's two sales processes on two record types, and each rep sees just their stages. It's the same idea as lead processes for leads and support processes for cases. On top of that I usually add a Path with key fields and guidance per stage, so reps know what to fill in before moving forward. I try to keep the number of sales processes small, since each extra one adds record types, reports and automation the team has to maintain.

- Sales process = subset of StageName values
- Assigned through opportunity record types
- Record types assigned via profile or permission set
- Path adds guidance and key fields per stage

<sub>Also asked as: How do you show different stages to different teams? · Explain sales process in Salesforce · sales process vs record type · Can two sales teams have different opportunity stages?</sub>

### Explain Products, Price Books and Price Book Entries.
*Fresher (0–2 yrs) · concept* · `sales-011`

Product2 is the item you sell. A Price Book, Pricebook2, is a list of prices, and PricebookEntry is the junction that says this product costs this much in this price book, and in multi-currency orgs, in this currency. Say a laptop seller has a 14-inch business laptop. It has a standard price in the Standard Price Book, and there's a custom Partner price book with a lower price for distributors. Every org has one Standard Price Book, and a product needs a standard price before you can add it to any custom price book. An opportunity is tied to one price book, so a partner deal using the Partner book only lets the rep pick from active entries in that book. Adding the laptop creates an OpportunityLineItem record. Custom price books are used for things like regional, partner or volume pricing. I keep the price book count deliberate, because every new book is another set of entries someone has to keep current.

- Product2 = item, Pricebook2 = price list, PricebookEntry = price of a product in a book
- Standard price required before custom price book entry
- One price book per opportunity
- Adding products creates OpportunityLineItem records

<sub>Also asked as: What is a price book entry? · How do products and price books work together? · standard price book vs custom price book · What is the relationship between Product2 and Pricebook2?</sub>

### A rep says they cannot find a product when adding products to an opportunity. What would you check?
*Mid (3–6 yrs) · scenario* · `sales-012`

This is nearly always data setup, not a bug, so I'd go step by step. First, is the product itself active, and does it have an active price book entry in the price book the opportunity is using? The opportunity can only show products from its own price book. Second, in a multi-currency org, the entry has to exist in the opportunity's currency. Third, the price book must be active, and the user needs sharing access to it, since price books have their own sharing. And if the product was just created, it needs a standard price before it can be added to a custom price book. For example, a rep on a EUR deal using the Partner price book can't find a new docking station. Often it turns out the dock was only priced in USD, or only in the Standard Price Book, so it simply doesn't show up for that deal. Once I find it, I'd give product ops a short checklist for new products so the team isn't fixing the same thing every launch.

- Product active and price book entry active
- Entry must be in the opportunity's price book
- Entry must match the opportunity currency
- User needs access to the price book

<sub>Also asked as: Product not showing in Add Products on opportunity · Why can't users see a product in the price book? · add products button not listing my product · product missing when adding opportunity line items</sub>

### What are product schedules on opportunity products?
*Mid (3–6 yrs) · concept* · `sales-013`

Product schedules let you spread an opportunity product's quantity or revenue across dates instead of booking it all on the close date. A quantity schedule spreads the units, and a revenue schedule spreads the amount. For example, a company orders 100 laptops but wants 25 delivered each quarter, so that's a quantity schedule over four quarters. If the same customer pays for a support contract monthly over twelve months, that's a revenue schedule. You enable schedules in Setup, then turn them on per product, and you can set a default schedule on the product or let reps establish it on the line item. They're stored as OpportunityLineItemSchedule records. I'd only turn schedules on after finance confirms they'll actually use them, because it's extra data for reps to maintain. It's useful when finance wants to see when revenue actually lands, and collaborative forecasts can use a schedule date based forecast type.

- Quantity schedule spreads units, revenue schedule spreads amount
- Enable in Setup, then per product
- Stored as OpportunityLineItemSchedule
- Can drive schedule-date based forecasts

<sub>Also asked as: Explain quantity and revenue schedules · How do you spread revenue over months on an opportunity? · what is a revenue schedule in salesforce · How do you handle a deal that bills monthly over a year?</sub>

### What are Quotes in Sales Cloud and what does quote syncing do?
*Fresher (0–2 yrs) · concept* · `sales-014`

Quotes let reps present prices, discounts and products to a customer from an opportunity. One opportunity can have many quotes, but only one can be synced with it at a time. When a quote is synced, its line items and the opportunity products stay in sync both ways. Say a rep sends a school two options: Quote A with 40 laptops, and Quote B with 40 laptops plus bags. The school picks B, so the rep syncs Quote B, and now the opportunity products match it. Change a quantity on either side and the other one follows. Quote templates control the PDF layout, with sections for line items, terms and branding, and the rep can save the PDF to the quote or email it directly. If the company needs complex pricing rules, bundles and approvals, that's usually where Revenue Cloud comes in instead of standard quotes. That's the call I'd make with stakeholders early: standard quotes are cheap to run, so I only recommend moving up when the pricing really needs it.

- Many quotes per opportunity, only one synced
- Sync keeps quote lines and opportunity products aligned
- Quote templates define the PDF layout
- Complex pricing goes to Revenue Cloud

<sub>Also asked as: Explain quotes and quote templates · How do you generate a quote PDF from an opportunity? · what is quote sync · Can an opportunity have multiple quotes?</sub>

### How does Collaborative Forecasting work?
*Mid (3–6 yrs) · concept* · `sales-015`

In short, Collaborative Forecasts rolls up opportunity data by forecast category and time period through a forecast hierarchy. A forecast type defines what you forecast: the source object, like opportunities, opportunity splits, product families or territories, the measure, like revenue or quantity, and the date used, like close date. The hierarchy is usually the role hierarchy, or the territory hierarchy if you forecast by territory, and you enable users as forecast managers so their numbers roll up. You choose monthly or quarterly periods and whether rollups are cumulative, so Commit includes Closed, and so on. For example, if a rep has 50,000 closed and 30,000 in Commit this quarter, a cumulative Commit shows 80,000. Her manager sees that roll up with the rest of the team, can adjust it, and can compare it against quotas. The decision I'd settle with sales leadership first is cumulative or not, because changing it later confuses everyone reading the numbers.

- Forecast type = object + measure + date
- Rolls up through role or territory hierarchy
- Forecast managers must be enabled per user
- Monthly or quarterly periods, cumulative rollups optional

<sub>Also asked as: Explain forecast types, categories and forecast hierarchy · How do forecasts roll up in Salesforce? · collaborative forecasts setup steps · What is a forecast type?</sub>

### What are forecast adjustments and quotas?
*Mid (3–6 yrs) · concept* · `sales-016`

Adjustments let people change the forecast number without touching the opportunities underneath. A manager adjustment lets a forecast manager override a subordinate's rollup or their own, and an owner adjustment lets a rep adjust their own forecast. Both have to be enabled. For example, a rep's Commit rolls up to 80,000, but her manager thinks that's too optimistic because one big laptop order looks likely to slip, so he adjusts it to 60,000. The original 80,000 is still kept, so you can compare both, and no opportunity was edited. Quotas are the target amounts per user and period, stored as ForecastingQuota records, and you usually load them with Data Loader or the API. Once quotas are in, the forecast page shows attainment, so managers can see who's on track. I'd own the quota load as a scheduled, checked process each period, since a wrong quota file undermines trust in the whole forecast.

- Manager and owner adjustments must be enabled
- Adjustments do not change opportunity data
- Unadjusted and adjusted values both visible
- Quotas stored in ForecastingQuota, loaded via Data Loader or API

<sub>Also asked as: Can a manager change a rep's forecast number? · Explain manager adjustments and owner adjustments · how are quotas loaded in salesforce forecasts · difference between adjusted and unadjusted forecast</sub>

### Explain Enterprise Territory Management and its main components.
*Senior (7–10 yrs) · concept* · `sales-017`

Enterprise Territory Management lets you organize accounts and users by sales territory, separate from the role hierarchy, and grant access based on that. The top level is a Territory Model, which can be in planning, active or archived state. Only one model can be active at a time, so you can build and preview next year's model before switching. Inside the model you have Territory Types with a priority, the Territories themselves in a hierarchy, and account assignment rules that place accounts by criteria like billing state or industry. For example, a laptop seller might have North and South territories, with a rule that puts every account with billing state Karnataka into South. Users are assigned to territories with a role, and each territory defines the access users get to accounts, opportunities, cases and contacts. Opportunities can be assigned to territories through a filter-based Apex class. The planning state is what I lean on as a lead: we build and preview the new model with sales ops before activation, so nobody loses access to their accounts on day one.

- Model states: planning, active, archived; one active at a time
- Territory types, territories, assignment rules
- Objects: Territory2Model, Territory2, UserTerritory2Association, ObjectTerritory2Association
- Sharing is driven by territory access levels

<sub>Also asked as: What is ETM in Salesforce? · How does territory management work? · territory model, territory type and territory hierarchy explained · Why use territories instead of role hierarchy for sharing?</sub>

### An account belongs to two territories. How do you decide which territory an opportunity should belong to?
*Senior (7–10 yrs) · scenario* · `sales-018`

This is a business decision first and code second. An account can sit in several territories, but an opportunity has only one Territory2Id, so you need a rule to pick one. Salesforce supports filter-based opportunity territory assignment, where you write an Apex class implementing the TerritoryMgmt.OpportunityTerritory2AssignmentFilter interface. Salesforce's default sample picks the account's territory with the highest territory type priority, and if there's a tie it leaves it blank. Say a hospital group sits in both an Enterprise territory and a Healthcare territory. I'd agree the business rule first, for example product line decides, so server deals go to Enterprise and laptop deals go to Healthcare. Then I implement that in the filter class, register it in Territory Settings, and run it on new opportunities and as a bulk job when the model changes. Reps can still change it manually if their access allows. I'd also get the rule signed off by sales ops, because it decides who gets credit for the deal.

- Opportunity has one territory; account can have many
- Implement TerritoryMgmt.OpportunityTerritory2AssignmentFilter
- Default sample uses territory type priority
- Agree the business rule before coding

<sub>Also asked as: How does opportunity territory assignment work in ETM? · Opportunity territory assignment filter Apex · account in multiple territories which one does the opportunity get · How do you auto assign territory to opportunities?</sub>

### What are Campaigns and Campaign Members?
*Fresher (0–2 yrs) · concept* · `sales-019`

A Campaign is a marketing effort, like a webinar, trade show or email blast, and it tracks budget, expected and actual cost, and results. Campaign Members link leads or contacts to it, and each member has a status like Sent or Responded. You can customize those statuses per campaign and mark which ones count as responded. For example, a laptop seller runs a webinar with statuses Invited, Registered and Attended, and only Attended is flagged as responded. Campaigns can sit in a hierarchy, so a parent Back to School program rolls up results from the webinar, the email blast and the trade show under it. Opportunities can have a Primary Campaign Source, and campaign reports show how many leads, responses, opportunities and won amount each campaign generated. I'd set a team standard for member statuses and the hierarchy early, otherwise every marketer invents their own and the reports stop comparing.

- Campaign = marketing initiative with budget and results
- CampaignMember links a Lead or Contact
- Member statuses are custom per campaign, with a Responded flag
- Campaign hierarchy rolls up stats

<sub>Also asked as: How do campaigns work in Sales Cloud? · What is a campaign member status? · explain campaign hierarchy · How do you track which leads came from an event?</sub>

### What is Campaign Influence?
*Senior (7–10 yrs) · concept* · `sales-020`

Campaign Influence shows every campaign that contributed to an opportunity, not just the single primary campaign source. With Customizable Campaign Influence, Salesforce can automatically associate campaigns to an opportunity when contacts with opportunity contact roles were members of those campaigns, within a time frame you set. Each association gets a revenue share based on an attribution model. For example, on a laptop deal, the IT head and the finance contact are both contact roles. The IT head attended a webinar and the finance contact was in an email campaign, both inside the window, so both campaigns get linked to the opportunity. The default model gives the credit to the primary campaign source, and you can add custom models, while Account Engagement, formerly Pardot, adds multi-touch models like first touch, last touch and even distribution, where those two campaigns would split the credit equally. Marketing uses this to answer how much pipeline each campaign really influenced. The trade-off I'd explain to marketing is that the time frame and model choice change the numbers a lot, so we agree them once and don't tweak them every quarter.

- Many campaigns can influence one opportunity
- Auto-association via contact roles and campaign membership
- Attribution models split revenue credit
- Account Engagement adds first/last/even touch models

<sub>Also asked as: How do you attribute revenue to multiple campaigns? · Explain customizable campaign influence · primary campaign source vs campaign influence · Which campaigns influenced this opportunity?</sub>

### What is the difference between Account Teams and Opportunity Teams?
*Fresher (0–2 yrs) · comparison* · `sales-021`

Both let you add users to a record with a role and an access level, but at different levels. An Account Team is the group that works an account over time, and you can give them read or edit access to the account and its related opportunities, cases and contacts. An Opportunity Team is specific to one deal. For example, for a big hospital customer, the account manager, a support rep and a technical lead sit on the account team year after year. When a large laptop refresh deal comes up, the rep adds a sales engineer and an executive sponsor to that one opportunity's team. Opportunity teams are also required if you want opportunity splits. Users can set a default opportunity team that gets added automatically to their new opportunities. Both kinds of team grant sharing on top of the org-wide defaults. So when I review a request to add teams, I look at it as a sharing change too, not just a UI feature.

- Account team: long-term coverage of an account
- Opportunity team: per deal, enables splits
- Each member has a role and access level
- Default teams can auto-add members

<sub>Also asked as: Explain account teams vs opportunity teams · What is team selling in Salesforce? · how do you give extra users access to one account · What is a default opportunity team?</sub>

### Two reps worked on the same deal and both need credit in the forecast. How would you handle it?
*Senior (7–10 yrs) · scenario* · `sales-022`

I'd go with Opportunity Splits here, which need team selling enabled. Splits divide credit for an opportunity among opportunity team members by percentage. Revenue splits must total exactly 100 percent, so they're for when two reps truly share the deal. Overlay splits can add up to any percentage, and they're for supporting roles, like a sales engineer who gets credit without reducing the main rep's number. For example, on a 100,000 deal, Anil and Meera each get a 50 percent revenue split, so 50,000 each. The sales engineer gets a 20 percent overlay split, and Anil and Meera still keep their full 50,000. You can also create custom split types on other currency fields. Then I set up a forecast type based on opportunity splits, so each rep's share shows up in their forecast instead of the full amount going to the owner. Before building, I'd confirm the split rules with sales ops and finance, since splits often feed commissions and nobody wants surprises on payday.

- Requires team selling and opportunity splits enabled
- Revenue splits must total 100 percent
- Overlay splits can exceed 100 percent
- Use a split-based forecast type

<sub>Also asked as: How do opportunity splits work? · Give revenue credit to multiple users on one opportunity · revenue split vs overlay split · sales engineer needs credit for deals they support</sub>

### What are Contact Roles on an opportunity?
*Fresher (0–2 yrs) · concept* · `sales-023`

Opportunity Contact Roles link contacts to an opportunity and describe the part each person plays, like Decision Maker, Economic Buyer, Evaluator or Influencer. One contact can be marked as primary. It's a junction object, OpportunityContactRole, so a contact can be on many opportunities and an opportunity can have many contacts, and they don't have to belong to the same account. For example, on a laptop deal with a school, the principal is the Decision Maker, the bursar is the Economic Buyer, and an outside IT consultant from a different account is an Evaluator. It matters beyond tracking, because Customizable Campaign Influence uses contact roles to connect campaigns to opportunities. Many companies also add a validation or flow requiring at least one contact role before a deal moves to a later stage.

- Junction object OpportunityContactRole
- Role values describe buying influence
- One primary contact role per opportunity
- Used by campaign influence

<sub>Also asked as: Explain opportunity contact roles · How do you track who is the decision maker on a deal? · what is primary contact role · Why do contact roles matter for campaign influence?</sub>

### What is the difference between a Task and an Event, and what are WhoId and WhatId?
*Fresher (0–2 yrs) · comparison* · `sales-024`

Tasks and Events are both activities. A Task is a to-do with a due date and status, like a call to make or an email to send, and logged calls are tasks too. An Event is a calendar item with a start and end time, like a meeting. Both use two polymorphic lookups. WhoId points to a person, which is a Lead or Contact, and WhatId points to a thing, like an Account, Opportunity, Case or a custom object that allows activities. For example, a demo meeting with Sameer about a laptop deal has Sameer's contact as the WhoId and the opportunity as the WhatId. The gotcha: if WhoId is a lead, WhatId must be empty. And with Shared Activities enabled, one activity can be related to multiple contacts through TaskRelation and EventRelation.

- Task = to-do with due date, Event = time-based meeting
- WhoId = Lead or Contact, WhatId = other record
- Lead on WhoId means WhatId must be blank
- Shared Activities allows multiple contacts

<sub>Also asked as: Explain activities in Salesforce · task vs event · what is who id and what id on activities · How are activities related to records?</sub>

### What is Sales Engagement and what are cadences?
*Mid (3–6 yrs) · concept* · `sales-025`

Sales Engagement, formerly High Velocity Sales, is the Sales Cloud feature for inside sales and SDR teams to run structured outreach. The core is a cadence, which is a sequence of steps like a call, an email, a LinkedIn touch or wait a few days, with branching based on outcomes, like whether a call connected or an email got a reply. For example, step one is a call. If it connects, the lead goes to a follow-up email step. If not, the cadence waits two days and sends an intro email instead. Leads, contacts or person accounts are added as cadence targets, and reps work from a work queue that tells them exactly who to contact next and with which email template or call script. Managers can then report on which cadences and steps perform best.

- Formerly High Velocity Sales
- Cadence = ordered, branching outreach steps
- Reps work from a prioritized work queue
- Targets can be leads, contacts or person accounts

<sub>Also asked as: Explain Salesforce Sales Engagement · What was High Velocity Sales? · how do sales cadences work · What is the work queue for inside sales reps?</sub>

### What AI features does Salesforce offer for sales teams today?
*Mid (3–6 yrs) · concept* · `sales-026`

There are two layers. The predictive layer has Einstein Lead Scoring and Opportunity Scoring, which score records based on historical conversion and win patterns, plus Einstein Activity Capture, which syncs emails and calendar events from Gmail or Outlook. On top of that is the agent layer, where Einstein Copilot has become Agentforce, with agents built for sales. Agentforce SDR can work inbound leads on its own, answering questions, nurturing and booking meetings for reps. Agentforce Sales Coach lets a rep role-play a pitch or negotiation against the deal's context and get feedback. For example, before a pricing call, a rep can practise handling a your-laptops-cost-too-much objection with Sales Coach. Generative features like drafting sales emails and summarizing records are also available. All of it relies on clean CRM data and the Einstein Trust Layer for data protection.

- Predictive: lead scoring, opportunity scoring
- Einstein Activity Capture syncs email and calendar
- Agentforce SDR nurtures leads and books meetings
- Agentforce Sales Coach for role-play practice

<sub>Also asked as: Explain Einstein and Agentforce features in Sales Cloud · What is Agentforce SDR? · einstein lead scoring and opportunity scoring · How can AI help sales reps in Salesforce?</sub>

### Walk me through the core Sales Cloud data model.
*Mid (3–6 yrs) · concept* · `sales-027`

At the center is Account, with Contacts related to it and Opportunities that look up to it. Contacts connect to opportunities through OpportunityContactRole, and to multiple accounts through AccountContactRelation if Contacts to Multiple Accounts is on. Lead is separate and converts into account, contact and opportunity. For pricing, Product2 and Pricebook2 are joined by PricebookEntry, and the opportunity's products are OpportunityLineItem records pointing to a PricebookEntry. Quote and QuoteLineItem hang off the opportunity. Campaign links to leads and contacts through CampaignMember. Activities, Task and Event, use WhoId and WhatId, and teams use AccountTeamMember and OpportunityTeamMember. To walk it with an example: a school's IT head fills a form, so she's a Lead. After conversion the school is the Account, she's the Contact, and the laptop deal is the Opportunity. Adding 40 laptops creates an OpportunityLineItem pointing to the laptop's PricebookEntry, and the quote she gets is a Quote with QuoteLineItems.

- Account to Contact and Opportunity
- OpportunityContactRole, CampaignMember, PricebookEntry are junctions
- OpportunityLineItem references PricebookEntry
- Quote and QuoteLineItem under Opportunity

<sub>Also asked as: What are the key objects in Sales Cloud and how are they related? · Explain the relationship between account, contact, opportunity and products · sales cloud ERD · Which junction objects exist in Sales Cloud?</sub>

### How would you design a lead routing process for a global sales team?
*Senior (7–10 yrs) · scenario* · `sales-028`

I start by agreeing the routing keys with sales ops, usually region, segment by company size, and product interest, plus any named-account rules. Then I clean and enrich the data on entry: normalize the country and state picklists, and run duplicate rules so existing customers go to their account owner. Next, the lead assignment rule sends leads to regional queues based on those keys. Inside each queue, a record-triggered flow or Omni-Channel does round robin or capacity-based distribution to available reps. Then I add an SLA, for example a scheduled path that alerts the manager or reassigns if a lead is untouched after a set time. Say a mid-size company in Germany asks about laptops. It lands in the Europe mid-market queue, goes round robin to the next available rep, and if nobody touches it within the SLA, the manager gets alerted. Finally I build a dashboard for speed-to-lead and conversion by source and rep.

- Agree routing keys: region, segment, product, named accounts
- Normalize data and dedupe before assignment
- Assignment rules to queues, then round robin or Omni-Channel
- SLA with reassignment and speed-to-lead reporting

<sub>Also asked as: Design lead assignment for multiple regions and product lines · How would you route inbound leads to the right rep fairly? · round robin lead assignment design · Leads should go to the right territory and be followed up quickly, how?</sub>

### How do you prevent users from closing an opportunity as Won if it has no products?
*Mid (3–6 yrs) · scenario* · `sales-029`

The simplest answer is a validation rule on Opportunity using HasOpportunityLineItem, a checkbox Salesforce sets automatically when the opportunity has products. The rule fires when the stage is Closed Won and HasOpportunityLineItem is false, and shows a clear error telling the rep to add products first. So if a rep tries to close a laptop deal as Won with no products on it, the save is blocked with a message like: add at least one product before closing this deal. If the business needs something more specific, say at least one product from the Laptops family, I'd add a roll-up summary field counting those line items and check that count in the rule instead. I'd also make sure integrations or data loads that close deals are either compliant or have a controlled bypass.

- Use HasOpportunityLineItem in a validation rule
- Roll-up summary count for more specific checks
- Clear error message for the rep
- Plan a bypass for integrations if needed

```java
AND(
  ISPICKVAL(StageName, "Closed Won"),
  NOT(HasOpportunityLineItem)
)
```

<sub>Also asked as: Stop Closed Won without opportunity line items · Validation rule to require products before closing · opportunity should not be closed won without product · How do you enforce that every won deal has products?</sub>

### Your company sells in USD, EUR and INR. How would you set up Sales Cloud for multi-currency deals?
*Senior (7–10 yrs) · scenario* · `sales-030`

I'd enable multi-currency, which adds a CurrencyIsoCode field to records, set the corporate currency, say USD, and add EUR and INR as active currencies with conversion rates. Each user has a personal currency and each opportunity has its own currency, and reports convert amounts to the user's or corporate currency. Price book entries must exist per currency, because an opportunity can only use entries in its own currency. So if a laptop only has a USD entry, a rep on an INR deal won't see it. If finance needs historical accuracy, I'd enable Advanced Currency Management for dated exchange rates. Those apply to opportunities, opportunity products, schedules and related reports, but not to most other objects, or to roll-up summary fields in the same way. The key point is that multi-currency can't be disabled once enabled, so I test it in a sandbox first.

- Enable multi-currency, set corporate and active currencies
- Price book entry needed per currency
- Advanced Currency Management adds dated rates for opportunities
- Cannot be turned off once enabled

<sub>Also asked as: How does multi-currency work in Salesforce? · What is advanced currency management? · dated exchange rates for opportunities · Deals in different currencies but reports in USD, how?</sub>

### Two business units sell differently and need different opportunity stages. How would you set that up?
*Mid (3–6 yrs) · scenario* · `sales-031`

I'd create two sales processes, each with only the stage values that business unit uses, and attach each one to its own opportunity record type. Then I assign record types through permission sets or profiles, so a hardware rep gets the hardware record type by default. Say a laptop seller has a hardware team that ships devices and a services team that sells repair contracts. Hardware might need a Demo stage, services might need a Site Survey stage, and each rep only sees their own. Each record type gets its own page layout or Lightning record page and its own Path with key fields and guidance. The thing I'm careful about is that every stage still maps to a sensible probability and forecast category, so the combined forecast still works. If needed I also add different lead processes and validation rules scoped by record type, and reports can be filtered by record type to compare the two units.

- Two sales processes, two record types
- Assign record types via permission sets
- Separate layouts and Path per unit
- Keep forecast categories consistent

<sub>Also asked as: Sales process for two business units · Different stages for hardware and services teams · how do you give two teams different opportunity layouts and stages · One org, two sales teams with different processes</sub>

### Web-to-Lead is creating lots of duplicate leads. How would you fix it?
*Senior (7–10 yrs) · scenario* · `sales-032`

I'd set up matching rules and duplicate rules on Lead, matching on email, or on name plus company, and include a rule that checks existing Contacts too. A customer filling the form again shouldn't become a brand-new lead. Say someone who already bought ten laptops fills the enquiry form again for more. Web-to-Lead doesn't show the visitor any alert, so I set the duplicate rule action to allow and report. Then a flow handles it: it links the new lead to the existing record, updates it, or routes it to the current owner, so the person's existing rep gets the enquiry. For high-volume forms I'd move to an API or Flow-based intake that does an upsert or match before creating anything. And a periodic merge job or tool cleans up the duplicates that already exist.

- Matching rules on email, name plus company
- Duplicate rule also checks Contacts
- Allow and report for web leads, then automate handling
- Move to API or flow intake with matching for scale

<sub>Also asked as: How do you stop duplicate leads in Salesforce? · Duplicate rules and matching rules for leads · same person submitting form multiple times creating duplicates · existing contacts coming in again as new leads</sub>

### When an opportunity is Closed Won, the business wants a renewal opportunity created automatically. How would you build it?
*Mid (3–6 yrs) · scenario* · `sales-033`

I'd build an after-save record-triggered flow on Opportunity, with the entry condition that the stage changed to Closed Won and the type is new business or subscription. The flow creates a new opportunity on the same account with type Renewal, the same owner, a stage like Prospecting, and a close date one year after the original close date or the contract end date. Say a company buys a one-year laptop support plan that closes on 15 March. The flow creates a Renewal opportunity closing 15 March next year. If products need to carry over, the flow gets the original OpportunityLineItems and creates copies on the new opportunity, using the same price book. The gotcha is duplicates: if the deal is reopened and closed again, you'd get a second renewal, so I store a lookup to the original opportunity and check it. And I test it with bulk data loads.

- After-save record-triggered flow on stage change to Closed Won
- Close date based on contract end or plus one year
- Copy line items with the same price book
- Lookup to source opportunity prevents duplicates

<sub>Also asked as: Auto create renewal opportunity on closed won · Create a follow-up opportunity one year later · flow to clone opportunity when won · Automate renewals in Sales Cloud</sub>

### A sales manager says an opportunity is missing from the forecast. How would you troubleshoot it?
*Senior (7–10 yrs) · troubleshooting* · `sales-034`

I'd check a few things in order. First, the close date has to fall in the forecast period being viewed, and the forecast category can't be Omitted. Second, the opportunity owner must be enabled for forecasting and sit under that manager in the forecast hierarchy, which is separate from just being in the role hierarchy. Third, the forecast type: if it's based on splits or product families, the deal only shows up if splits or products exist. For example, a manager is looking at a product-family forecast and a rep's 40,000 laptop deal is missing. Often the deal simply has no products added yet, so there's nothing to roll up. In multi-currency orgs, the amount shows converted, which can look like a mismatch. I also confirm the manager has access, and if territories are used, that the opportunity has a territory in the active model.

- Close date in period, category not Omitted
- Owner enabled and placed in forecast hierarchy
- Forecast type may need splits or products
- Territory forecasts need opportunity territory

<sub>Also asked as: Opportunity not showing in collaborative forecast · Why is my deal not in the forecast rollup? · forecast amount does not match pipeline report · rep's opportunity missing from manager forecast</sub>

### How do you stop reps from converting a lead until key qualification fields are filled in?
*Mid (3–6 yrs) · scenario* · `sales-035`

I'd use a validation rule on Lead that checks IsConverted. When a lead is being converted, IsConverted becomes true in that save, so a rule like IsConverted is true and Budget or Timeline is blank blocks the conversion with a clear message. Say a rep tries to convert a lead for a fifty-laptop order without entering a budget. They'd get a message like: enter Budget and Timeline before converting. The gotcha is that lead validation rules only run during conversion if Require Validation for Converted Leads is enabled in Lead Settings, so I make sure that's on. For a better experience, I also show those fields on the Path for the Qualified stage, so the rep knows what's needed before clicking Convert.

- Validation rule using IsConverted
- Enable Require Validation for Converted Leads
- Show required fields on the lead Path
- Clear error message

```java
AND(
  IsConverted,
  OR(
    ISBLANK(Budget__c),
    ISBLANK(TEXT(Timeline__c))
  )
)
```

<sub>Also asked as: Validation rule on lead conversion · Make fields required only when converting a lead · prevent lead convert unless budget and timeline are filled · How do you enforce BANT before conversion?</sub>

### Write a SOQL query to get open opportunities with their products and contact roles.
*Mid (3–6 yrs) · code* · `sales-036`

I use parent-to-child subqueries with the child relationship names, OpportunityLineItems and OpportunityContactRoles. From the line item I can go up to the product through PricebookEntry, or directly through Product2, and from the contact role up to the contact's name. I filter on IsClosed false to get open deals, and I use a bind variable for the account or owner instead of hard-coding Ids. For example, if a sales manager wants every open deal for one hospital account, with the laptops on each deal and who the decision makers are, that's one query. Then in Apex I loop through each opportunity and its children without any extra queries, which keeps me within governor limits.

- Child relationships: OpportunityLineItems, OpportunityContactRoles
- Use IsClosed = false for open deals
- Bind variables, no hard-coded Ids
- One query, loop children in memory

```java
List<Opportunity> opps = [
    SELECT Id, Name, StageName, Amount, CloseDate,
        (SELECT Id, Quantity, UnitPrice, TotalPrice, Product2.Name, Product2.Family
         FROM OpportunityLineItems),
        (SELECT Id, Role, IsPrimary, Contact.Name
         FROM OpportunityContactRoles)
    FROM Opportunity
    WHERE IsClosed = false AND AccountId IN :accountIds
];
for (Opportunity o : opps) {
    for (OpportunityLineItem oli : o.OpportunityLineItems) {
        System.debug(o.Name + ' -> ' + oli.Product2.Name);
    }
}
```

<sub>Also asked as: Query opportunity line items with the opportunity · SOQL parent child query on opportunity · get opportunities and opportunity products in one query · How do you query OpportunityLineItems and OpportunityContactRoles together?</sub>

### A sales rep left the company. How do you reassign their accounts, opportunities and leads?
*Mid (3–6 yrs) · scenario* · `sales-037`

First I'd freeze the user so they can't log in while we plan. Deactivating can be blocked if they're used in places like default lead owner or an approval process. Then I use Mass Transfer Records, or the Transfer Account option, to move accounts to the new owner, choosing whether to also move open opportunities, cases and the rep's open activities. Leads can go to the new rep or back to a queue. For large volumes I use Data Loader: export, change the owner, update. Say Rohit leaves with 300 accounts and 2,000 leads. I'd transfer his accounts with their open deals to Neha, send the leads back to the regional queue, and then check account and opportunity teams, territories, assignment rules, queues, and any flows or reports that still reference Rohit. Only after that cleanup do I deactivate him.

- Freeze first, deactivate after cleanup
- Mass Transfer or Transfer Account with related records
- Data Loader for large volumes
- Update teams, territories, rules and automation references

<sub>Also asked as: Transfer records when a user leaves · Mass transfer accounts to another rep · what to do with records of a deactivated sales user · How do you move all open deals to a new owner?</sub>

### What is a queue, and why would you assign leads to a queue instead of a user?
*Fresher (0–2 yrs) · concept* · `sales-038`

A queue is a holding place that can own records, like leads or cases, and it has a set of members who can pick records from it. Assigning leads to a queue makes sense when you don't want to decide the exact rep upfront. For example, all inbound leads for the APAC region go to an APAC queue, and whichever rep is free accepts the lead and becomes the owner. So if three reps cover APAC and one is on leave, nothing sits stuck in that person's name. Members see the queue as a list view, and you can set a queue email to notify them. Queues also work with Omni-Channel, which can push records from a queue to available reps automatically, instead of reps picking them manually.

- Queues can own records like leads and cases
- Members accept records and become owner
- Queue list view and notification email
- Omni-Channel can route from queues

<sub>Also asked as: Lead queues explained · how do queues work for leads · When do you use a queue as lead owner? · Can a queue own a record?</sub>

### The business has different prices for distributors, direct customers and different regions. How would you design the price books?
*Senior (7–10 yrs) · scenario* · `sales-039`

I'd keep one product catalog and model the price differences with custom price books, one per channel and region combination that really has a different list price, rather than duplicating products. Each price book has entries for the products it sells, in each currency it supports. For example, a laptop seller might have Distributor India, Direct India and Direct Europe, and the same laptop product sits in all three at different prices. Then I control which price book a rep can use with price book sharing, and I default it automatically, like a flow that sets Pricebook2Id on the opportunity based on the account's channel and region field. Discounts on top of list price go through an approval process. If the pricing becomes rule-heavy, with tiers, bundles or contract pricing, I'd move to Revenue Cloud instead of exploding the number of price books.

- One catalog, custom price books per real pricing segment
- Entries per currency
- Price book sharing plus automatic defaulting
- Complex rules point to Revenue Cloud

<sub>Also asked as: Price book strategy for regional and partner pricing · How many price books should we create? · design pricing in sales cloud for channels · Different price lists for different customer types</sub>

### Any discount above 20 percent on an opportunity must be approved by the sales manager. How would you implement this?
*Mid (3–6 yrs) · scenario* · `sales-040`

I'd add a discount field, or calculate the overall discount from line items with a roll-up, and create an approval process on Opportunity with entry criteria that the discount is greater than 20 percent. The approver is the submitter's manager, using the manager field on the user. While it's pending, the record is locked. On approval I set an approved flag and status, and on rejection I reset it. Say a rep offers a school 25 percent off 40 laptops. They submit it, it goes to their manager, and the deal is locked until she decides. To make sure reps can't skip it, I add a validation rule that blocks moving to Closed Won or syncing a quote when the discount is above 20 percent and not approved. I'd also consider the newer Flow Approvals if the org has standardized on Flow orchestration.

- Approval process with discount entry criteria
- Approver = submitter's manager
- Record locked while pending
- Validation rule prevents bypass

<sub>Also asked as: Discount approval process on opportunity · How to require manager approval for big discounts · approval process when discount is more than 20 percent · Lock the opportunity until the discount is approved</sub>

### What is the difference between Sales Cloud and Service Cloud?
*Fresher (0–2 yrs) · comparison* · `sales-041`

Sales Cloud is about winning business: leads, opportunities, products, price books, quotes, forecasts, territories and campaigns. Service Cloud is about supporting customers after the sale: cases, entitlements and milestones, Knowledge, Omni-Channel routing, the service console, chat and messaging channels, voice and service agents. Both share the core objects like accounts and contacts. Basic cases exist in Sales Cloud editions too, but advanced service features like entitlement management, Omni-Channel and Knowledge need Service Cloud licensing. Think of a laptop seller: the sales team uses Sales Cloud to close a 200-laptop deal, and when one of those laptops won't boot, the support desk handles that case in Service Cloud. Many companies use both, so a sales rep can see open cases on an account before a renewal call.

- Sales Cloud: lead to cash pipeline and forecasting
- Service Cloud: cases, SLAs, knowledge, routing, channels
- Shared core objects: Account, Contact
- Advanced service features need Service Cloud licenses

<sub>Also asked as: Sales Cloud vs Service Cloud · Which features come with Service Cloud but not Sales Cloud? · explain sales cloud and service cloud in simple words · What does each cloud focus on?</sub>

### What is Path, and how does it help sales reps?
*Fresher (0–2 yrs) · concept* · `sales-042`

Path is the chevron bar at the top of a Lightning record page that shows each stage or status of a record, like opportunity stage or lead status. For each step you can configure key fields, which the rep can fill right from the path, and guidance for success, which is short text, links or tips on what to do at that stage. For example, on the Proposal stage of a laptop deal, the key fields could be Budget and Decision Date, with guidance like: confirm delivery dates before sending the quote. You can create a path per record type, so different sales processes get different guidance, and you can turn on confetti when a deal reaches Closed Won. It's a simple way to make the sales process visible and push data quality without forcing everything through validation rules.

- Visual stages at the top of the record page
- Key fields and guidance per step
- One path per object and record type
- Works for any picklist, including custom objects

<sub>Also asked as: Explain Sales Path in Lightning · How do you show guidance for each opportunity stage? · what is path in salesforce lightning · key fields and guidance for success</sub>

### Sales leadership wants better pipeline visibility and fewer surprises at quarter end. What would you put in place?
*Senior (7–10 yrs) · design* · `sales-043`

I'd start with data discipline: clear stage definitions with exit criteria on the Path, required fields at key stages, and a stage-to-forecast-category mapping everyone agrees on. Then Collaborative Forecasts with the right forecast type and quotas loaded, so managers see Commit and Best Case against target and can adjust. Pipeline Inspection shows changes, like deals that moved close dates, changed amounts or changed stages this week, and that's where slipping deals show up. For example, if a big laptop deal has pushed its close date three weeks in a row, the manager sees it on Monday instead of on the last day of the quarter. Opportunity scoring can flag risky deals. Finally I add historical trend reporting for pipeline coverage and win rate, plus a weekly review cadence. The tooling only works if stage definitions are enforced, so that part comes first.

- Enforced stage definitions and exit criteria
- Collaborative Forecasts with quotas
- Pipeline Inspection for changes and slippage
- Opportunity scoring and trend reporting

<sub>Also asked as: How do you improve forecast accuracy in Sales Cloud? · Design pipeline management for sales leaders · pipeline inspection and deal health · Managers can't see which deals are slipping, what would you build?</sub>

## Service Cloud

### What is a Case in Service Cloud and what is a support process?
*Fresher (0–2 yrs) · concept* · `svc-001`

A Case is a customer issue, question or request, and it's the core record in Service Cloud. Agents can create cases, or they come in automatically through channels like email, web forms, chat, messaging or phone. Each case has fields like Status, Priority, Origin, Type and Reason, and links to a Contact and Account. A support process is the set of Case Status values a team uses, like a sales process for opportunities, and you assign it through case record types. At least one status is marked as closed. Say a customer emails a laptop seller's support desk because their screen flickers. That becomes a case with Origin Email, it moves through statuses like New, Working and Waiting on Customer, and when it's fixed the agent closes it. Then you can report on resolution time and first contact resolution.

- Case = customer issue linked to contact and account
- Origin shows the channel it came from
- Support process = subset of status values per record type
- Closed statuses drive IsClosed and reporting

<sub>Also asked as: Explain the case lifecycle · What are case status and case origin? · what is support process in salesforce · How do cases get created and closed?</sub>

### What are case assignment rules?
*Fresher (0–2 yrs) · concept* · `svc-002`

Case assignment rules set the case owner automatically to a user or a queue, based on criteria like product, priority, origin or customer region. Only one case assignment rule can be active, and its entries are evaluated in order until the first match. For example, at a laptop seller's support desk, entry one sends high-priority cases from business customers to the Premium queue, and entry two sends everything about batteries to the Hardware queue. The rules fire for email-to-case, web-to-case and other channels, and for manual creation when the assignment checkbox is used. If no entry matches, the case goes to the default case owner in Support Settings. In most modern setups the rule sends the case to a queue, and then Omni-Channel pushes it to an available agent.

- One active rule, ordered entries, first match wins
- Owner can be user or queue
- Default case owner when nothing matches
- Often combined with Omni-Channel queue routing

<sub>Also asked as: How do you auto assign cases to queues? · Explain case assignment rules · how many active case assignment rules · How does a new case get the right owner?</sub>

### What are escalation rules and how do they work?
*Fresher (0–2 yrs) · concept* · `svc-003`

Escalation rules automatically escalate cases that aren't handled within a set time. Only one escalation rule can be active, with ordered entries that define which cases qualify, like high-priority cases from premium customers. Each entry has escalation actions based on age, like reassign to a senior queue, notify a manager, or both. Say a business customer logs a high-priority case at 4 pm about laptops that won't boot. If the rule says escalate after four hours and respects business hours, and support closes at 6 pm, it won't escalate overnight; the clock picks up the next morning. Age can be measured from case creation or last modification. When it fires, the case's IsEscalated flag is set. For proper contractual SLAs I prefer entitlements and milestones, and I use escalation rules for simpler internal escalation.

- One active escalation rule, ordered entries
- Actions by age: reassign and/or notify
- Can respect business hours
- Sets IsEscalated on the case

<sub>Also asked as: Explain case escalation rules · How do you escalate a case that is not resolved in time? · escalation rule age over hours · What happens when a case is escalated?</sub>

### What are auto-response rules?
*Fresher (0–2 yrs) · concept* · `svc-004`

Auto-response rules send an automatic email to the customer when a case or lead is created through web-to-case, email-to-case or web-to-lead, usually to confirm the request was received and share the case number. Only one auto-response rule can be active per object, and like assignment rules, its entries are evaluated in order. The first matching entry decides which email template is sent and from which address. So at a laptop seller's support desk, premium customers could get a reply from the priority support address saying someone will call within the hour, while everyone else gets the standard acknowledgement. They don't fire for cases created manually by agents, so if an agent logs a phone call as a case, no auto-response goes out. For anything more complex, like conditional follow-ups later, I'd use a flow.

- Fires on web-to-case, email-to-case and web-to-lead
- One active rule per object, first match sends
- Each entry picks a template and sender
- Not for manually created cases

<sub>Also asked as: How do you send an automatic acknowledgement email when a case is created? · Explain auto response rules · auto response rule vs workflow email · Send a thank you email for web to case</sub>

### What is the difference between Email-to-Case and On-Demand Email-to-Case?
*Fresher (0–2 yrs) · comparison* · `svc-005`

Both turn customer emails into cases. On-Demand Email-to-Case is the standard approach today. You set up routing addresses in Salesforce, and the support mailbox forwards emails to a Salesforce-generated service address, so nothing is installed and Salesforce's own email services process the mail. The older Email-to-Case option uses a Java-based agent installed behind your firewall that polls your mail server and sends emails in through the API. That's useful when security rules don't allow forwarding mail outside, or when attachments are very large. For example, a laptop seller forwards support@ to the Salesforce address, and for that routing address sets origin Email, priority Medium and the Tier 1 queue as defaults. When the customer replies to the agent's email, the reply threads back to the same case.

- On-Demand: forward to a Salesforce address, no install
- Agent-based: local Java agent polls mail server
- Routing addresses set defaults like origin and priority
- Replies thread back to the existing case

<sub>Also asked as: Explain email to case options · On demand email to case vs email to case agent · how does email to case work · Do I need to install anything for email-to-case?</sub>

### What is Web-to-Case?
*Fresher (0–2 yrs) · concept* · `svc-006`

Web-to-Case generates an HTML form that you put on your website, and each submission creates a case in Salesforce. You choose the fields, set a default origin like Web, and can enable reCAPTCHA to cut spam. Assignment rules and auto-response rules can run on these cases, and Salesforce tries to link the case to an existing contact by matching the email address. For example, a laptop owner fills a Report a Problem form on the seller's site. Because her email matches an existing contact, the case lands on her record with her laptop purchase history right there for the agent. There's a daily limit on web-to-case submissions, so for very high-volume or authenticated scenarios I'd rather have customers log cases from an Experience Cloud help center or through an API integration.

- HTML form creates cases
- Assignment and auto-response rules can run
- Matches existing contact by email
- Help center or API for high volume

<sub>Also asked as: How do customers submit cases from a website form? · Explain web to case · web to case limit per day · create case from a contact us form</sub>

### What are Case Teams?
*Mid (3–6 yrs) · concept* · `svc-007`

Case Teams let you add several people to one case with defined roles and access, so a case owner, a technical specialist and an account manager can all work on it. First you define case team roles, each with an access level like read only or read write, and whether the role is visible in the customer portal. Then users add members to a case manually, or you set up predefined case teams that get added automatically, for example through assignment rules or a flow. Members can also be contacts, which is useful for portal users. Say a business customer's whole laptop fleet is failing to update. The support agent owns the case, but a hardware engineer and the account manager join as team members with read write. Unlike a queue, the team doesn't own the case, it just shares it.

- Case team roles define access level
- Predefined teams can be auto-added
- Members can be users or contacts
- Team shares the case; owner stays the same

<sub>Also asked as: How do multiple agents collaborate on one case? · Explain case team roles and predefined case teams · give other users access to a case they do not own · case teams vs queues</sub>

### Explain Entitlements, Entitlement Processes and Milestones.
*Mid (3–6 yrs) · concept* · `svc-008`

An Entitlement defines what support a customer gets, like 24/7 phone support or a four-hour response, and it's usually linked to an account, asset or service contract. An Entitlement Process is the timeline of steps for cases under that entitlement, and each step is a Milestone, like First Response or Resolution, with a target time and optional business hours. Milestones have actions: warning actions before the deadline, violation actions when it's missed, and success actions when it's met, like email alerts, field updates or tasks. Say a business customer has a four-hour response entitlement on their laptops. A case comes in, the First Response milestone starts. At three hours a warning emails the team lead, and if four hours pass, the violation action fires. Cases show a milestone tracker, and each one is stored as a CaseMilestone record you can report on.

- Entitlement = what support the customer gets
- Entitlement process = ordered milestones for cases
- Milestone actions: success, warning, violation
- CaseMilestone records track target and completion

<sub>Also asked as: How does entitlement management work? · What is a milestone in Service Cloud? · entitlement process explained · How do you track response time SLAs in Salesforce?</sub>

### What are Service Contracts and Contract Line Items?
*Mid (3–6 yrs) · concept* · `svc-009`

A Service Contract is the support agreement with a customer, like a one-year gold support plan, with start and end dates, terms and pricing. Contract Line Items are the specific products or assets covered under that contract. Entitlements can be attached to the service contract or to individual line items, so you know exactly what level of support each covered product gets. For example, a company buys a gold plan covering 50 laptops and 5 docking stations. The laptops get next-day replacement and the docks get standard support, each through their own entitlement on the line item. Entitlement templates on products let you create entitlements automatically when the product is added to a contract. So the hierarchy is roughly service contract, then line items for products or assets, then entitlements that drive milestones on cases.

- Service contract = support agreement with dates
- Contract line items = covered products or assets
- Entitlements link to contract or line items
- Entitlement templates on products auto-create entitlements

<sub>Also asked as: Explain service contracts in Service Cloud · service contract vs entitlement · how do contract line items relate to assets · What is an entitlement template?</sub>

### What is Omni-Channel and what are its main components?
*Mid (3–6 yrs) · concept* · `svc-010`

Omni-Channel is Salesforce's routing engine. It pushes work items, like cases, chats, messaging sessions, leads or custom objects, to the right available agent, instead of agents picking from queues. The main pieces are service channels, which define which object is routed; routing configurations, which set priority, the routing model like least active or most available, and how much capacity each item uses; queues or skills that hold the work; presence statuses like Available for Cases; and presence configurations, which set agent capacity and behavior like auto-accept. For example, at a laptop seller's support desk, a new case lands in the Hardware queue and Omni-Channel offers it to the least busy hardware agent who's online. Agents use the Omni-Channel widget in the console to go online and accept work, and supervisors watch it all in the Omni Supervisor app.

- Service channel = which object is routed
- Routing configuration = priority, model, capacity per item
- Presence status and presence configuration for agents
- Omni Supervisor for real-time monitoring

<sub>Also asked as: Explain Omni-Channel routing · What are service channels and routing configurations? · how does omni channel push work to agents · Omni-Channel setup steps</sub>

### What is the difference between queue-based routing and skills-based routing in Omni-Channel?
*Senior (7–10 yrs) · comparison* · `svc-011`

In queue-based routing, work goes into a queue linked to a routing configuration, and Omni-Channel pushes it to any available member of that queue. It's simple and works well when teams are clearly split. In skills-based routing, each work item gets required skills, sometimes with skill levels, and Omni-Channel finds an available agent who has them, regardless of queue. Skills are attached to agents as service resources. For example, a laptop seller gets a chat from a customer in Spain about a gaming model. Queue routing just sends it to whoever is free in the Chat queue. Skills routing needs Spanish plus Gaming Laptops, so it goes to the one agent who has both. The recommended setup today is Omni-Channel Flow, where a flow decides the routing, to a queue, to an agent directly or by skills, and can add fallback logic if nobody with the skill is available.

- Queue-based: any available queue member
- Skills-based: match required skills and levels
- Agents are service resources with skills
- Omni-Channel Flow handles routing logic and fallbacks

<sub>Also asked as: Queues vs skills based routing · When would you use skills-based routing? · what is omni channel flow · attribute based routing vs queue routing</sub>

### What are presence statuses, presence configurations and agent capacity in Omni-Channel?
*Mid (3–6 yrs) · concept* · `svc-012`

A presence status tells Omni-Channel whether an agent can receive work and from which channels, for example Available for Cases and Chat, or Busy, which is offline for routing. A presence configuration is assigned to users or profiles and sets their total capacity and options like auto-accept, allowing decline and decline reasons. Each routing configuration says how much capacity one work item uses. So if an agent has capacity 10, a case uses 2 and a chat uses 5, she could be working one chat and two cases, which is 9. Another chat would need 5, so Omni-Channel won't send her one until something frees up. By default, capacity frees when the tab is closed. With status-based capacity, it's released based on the work item's status instead, like when a case moves to Waiting on Customer.

- Presence status = online for which channels
- Presence configuration = capacity and accept/decline behavior
- Routing configuration sets units per item
- Tab-based vs status-based capacity

<sub>Also asked as: How does Omni-Channel capacity work? · Explain units of capacity · presence configuration auto accept · Why does an agent stop getting new work?</sub>

### What is the Service Console, and why do agents use it?
*Fresher (0–2 yrs) · concept* · `svc-013`

The Service Console is a Lightning app with console navigation, built for agents who handle a lot of cases quickly. Instead of moving page to page, records open as workspace tabs, and related records like the contact or account open as subtabs inside that workspace, so the agent keeps context for each customer. For example, a support agent at a laptop seller has three customers going at once. Each one is its own workspace tab, with the case, the contact and the laptop asset as subtabs, so nothing gets mixed up. It also has split view to see a list and a record together, a utility bar at the bottom for tools like Omni-Channel, macros, history and softphone, and keyboard shortcuts. You can also create your own Lightning console apps for other teams and choose which utilities and tabs each app includes.

- Console navigation: workspace tabs and subtabs
- Utility bar: Omni-Channel, macros, history, phone
- Split view for list plus record
- Custom Lightning console apps for other teams

<sub>Also asked as: Explain Lightning console apps · What are workspace tabs and subtabs? · standard navigation vs console navigation · Why is the console better for support agents?</sub>

### What is Salesforce Knowledge and what is the article lifecycle?
*Fresher (0–2 yrs) · concept* · `svc-014`

Salesforce Knowledge is the knowledge base where you store articles like FAQs, how-tos and troubleshooting guides, so agents and customers can find answers. In Lightning Knowledge, articles are records of the Knowledge object, and different article types are modeled with record types. The lifecycle is Draft, then Published, then Archived. To change a published article, you create a new draft version, edit it and publish it, so the version history is kept. Say a laptop seller has a published article on fixing a battery that won't charge, and a new firmware fix comes out. The author creates a new draft version, adds the firmware step, and publishes, and the old version stays in history. Articles can go to the internal app, customer and partner Experience Cloud sites and public knowledge bases. Agents search and attach articles to cases from the console, which also shows which articles solve issues.

- Lightning Knowledge uses record types for article types
- Lifecycle: Draft, Published, Archived
- New versions keep history
- Channels control where articles appear

<sub>Also asked as: Explain Lightning Knowledge · How do knowledge articles get published? · draft published archived article versions · How do agents attach articles to cases?</sub>

### What are data categories in Knowledge?
*Mid (3–6 yrs) · concept* · `svc-015`

Data categories are hierarchical labels for classifying knowledge articles. For example, a category group called Products with a category for each product line, and another group called Region. Articles are tagged with one or more categories, which helps people filter and search. More importantly, data category visibility controls access. You grant category visibility to roles, permission sets or profiles, so a user only sees articles in categories they have access to. Combine that with channels, which control the audience, like internal or customer. So a laptop seller can show customers only the public troubleshooting articles for the laptop lines they own, while agents also see the internal articles, like the warranty override steps.

- Category groups with hierarchical categories
- Articles tagged with categories for filtering
- Category visibility via roles, permission sets, profiles
- Works together with article channels

<sub>Also asked as: How do you control which articles users can see? · Explain data category groups and visibility · knowledge article visibility by category · categorize articles by product and region</sub>

### What is the difference between Macros and Quick Text?
*Fresher (0–2 yrs) · comparison* · `svc-016`

Quick Text is a reusable snippet of text, like a greeting or a standard troubleshooting reply, that agents insert into emails, chats or case comments, and it can include merge fields like the contact's name. Macros go further and automate a sequence of console actions with one click from the macros utility. For example, at a laptop seller's support desk, a Battery Reset macro could open the email publisher, insert the battery reset quick text with the customer's name filled in, change the case status to Waiting on Customer, and send. Some macros can be run in bulk on many cases from a list view. The gotcha is that macros doing irreversible actions, like sending an email, are flagged, so agents know they can't undo them.

- Quick Text = reusable text with merge fields
- Macro = automated sequence of console actions
- Bulk macros run on multiple records
- Irreversible macros are flagged

<sub>Also asked as: Macros vs quick text in the service console · How do agents save time on repetitive tasks? · what is a bulk macro · canned responses in salesforce</sub>

### What is Case Feed?
*Fresher (0–2 yrs) · concept* · `svc-017`

Case Feed shows the full history of a case as one timeline: emails, case comments, calls, status changes and Chatter posts, all in one place. Agents use the publisher at the top to send an email, log a call, add an internal note or change the status without leaving the case. In Lightning you build it with the feed and publisher components on the case record page, and you can filter the feed to see only emails or only internal notes. Where it really helps is handover. Say a laptop repair case has been bounced between three agents over a week and now it's escalated to Amit. He opens it, filters to internal notes, and in a minute he knows what's been tried, without reading every email.

- Timeline of emails, comments, calls, changes
- Publisher actions to email, log call, post note
- Feed filters by interaction type
- Configured on the Lightning record page

<sub>Also asked as: Explain the case feed view · How do agents see all interactions on a case? · case feed publisher actions · where are emails and comments shown on a case</sub>

### What chat and messaging channels does Service Cloud support today?
*Mid (3–6 yrs) · concept* · `svc-018`

The current web and mobile chat channel is Enhanced Chat, formerly called Messaging for In-App and Web. It replaced legacy Chat, which was originally Live Agent and was retired in February 2026. Enhanced Chat is asynchronous, so customers can leave and come back to the same conversation, and it supports rich content and file sharing. For example, a customer starts a chat about a cracked laptop screen at lunch, goes back to work, and replies with a photo an hour later in the same conversation. Alongside it there are enhanced messaging channels like WhatsApp, SMS, Facebook Messenger and Apple Messages for Business, and all of them create Messaging Session records routed through Omni-Channel. You set it up with a messaging channel, an embedded service deployment on the website, and an Omni-Channel flow that routes conversations to agents, or to an Agentforce service agent first.

- Enhanced Chat (formerly Messaging for In-App and Web)
- Legacy Chat (Live Agent) retired February 2026
- Enhanced WhatsApp, SMS, Messenger, Apple Messages
- MessagingSession records routed by Omni-Channel

<sub>Also asked as: Is legacy chat retired? · What is Enhanced Chat? · messaging for in app and web · Live Agent replacement in Salesforce · How do customers chat with agents from the website?</sub>

### What is the difference between Open CTI and Service Cloud Voice?
*Mid (3–6 yrs) · comparison* · `svc-019`

Open CTI is a JavaScript API that lets third-party telephony vendors build a softphone inside Salesforce. Agents can make and receive calls, get screen pops of the matching contact or case, and log calls, while the phone system itself stays with the vendor. Service Cloud Voice is Salesforce's natively integrated voice channel, where telephony, including Amazon Connect or supported partner telephony providers, ties directly into the console and Omni-Channel. So calls are routed like any other work, you get real-time transcription, and supervisors see voice next to chat and cases. AI features can also use the transcript, for example for summaries. Say a laptop seller already has a phone system it likes; Open CTI keeps that and adds a softphone. If they want calls, chats and cases routed in one place with transcripts, Voice is the better fit. Open CTI is more flexible for existing phone systems, while Voice gives a more unified experience.

- Open CTI: API for vendor softphones in Salesforce
- Service Cloud Voice: native voice channel
- Voice works with Amazon Connect or partner telephony
- Voice adds Omni-Channel routing and transcripts

<sub>Also asked as: Explain CTI integration in Salesforce · How do phone calls work in Service Cloud? · service cloud voice amazon connect · softphone in salesforce console</sub>

### How does case merge work?
*Fresher (0–2 yrs) · concept* · `svc-020`

Case merge lets an agent combine duplicate cases, for example when a customer emails twice about the same problem. In Lightning you can merge up to three cases at a time. You pick a master case, choose which field values to keep, and Salesforce moves related items like emails, comments, attachments and activities to the master. The duplicates are merged away, so only the master stays. Say a customer emails about a laptop that won't charge, then emails again from his phone an hour later, so there are two cases. The agent merges them into the first one, and both emails now sit on one case. Merge has to be enabled in Support Settings, and the user needs the right permissions, including delete on cases. In Apex you can also use the merge statement, which helps for automated duplicate handling.

- Up to three cases merged at a time
- Choose master and field values
- Related records move to the master
- Only the master stays; needs delete permission

<sub>Also asked as: How do you merge duplicate cases? · case merge in lightning · what happens to related records when cases are merged · merge two cases from the same customer</sub>

### How would you design SLAs in Service Cloud for customers with Gold, Silver and Bronze support plans?
*Senior (7–10 yrs) · design* · `svc-021`

I'd model each plan as an entitlement process with milestones, like First Response and Resolution, with tighter targets for Gold. Each process uses the right business hours, maybe 24/7 for Gold and local working hours for Bronze, and milestone criteria can vary the targets by case priority. Customers get an Entitlement record linked to their account or service contract, and a flow or trigger stamps the right entitlement on each new case, so the right process starts automatically. For example, a Gold customer's laptop case logged on Saturday night starts its First Response clock straight away, while a Bronze case waits for Monday morning business hours. Milestones get warning actions to alert the owner and team lead before a breach, and violation actions to escalate. They complete automatically when the agent sends the first response or closes the case. Then I build CaseMilestone reports for compliance by tier.

- One entitlement process per tier
- Business hours and priority-based targets
- Auto-stamp entitlement on case creation
- Warning and violation actions, auto-complete milestones

<sub>Also asked as: SLA design using entitlements · Different response times for different support tiers · how would you build tiered support SLAs · Gold customers need one hour response, silver four hours, design it</sub>

### The support head wants to track and report on SLA breaches. How would you do it?
*Senior (7–10 yrs) · scenario* · `svc-022`

If entitlements are in place, every case milestone is a CaseMilestone record with a target date, completion date and an IsViolated flag. So I build a report type on cases with milestones and report violated versus met by milestone type, team, priority and support tier. I'd add violation actions on the milestone, like a field update that stamps SLA Breached on the case with the time, and an alert to the team lead, so breaches also show on the case and in list views. For example, the support head could open a dashboard on Monday and see that the Hardware queue hit 92 percent of First Response targets last week, but only 70 percent for Gold customers. For trends, I'd use compliance percentage per week and per queue, and maybe a reporting snapshot to keep history. If entitlements aren't used, I'd stamp first response and resolution times through flow and compare them to targets.

- CaseMilestone has IsViolated, TargetDate, CompletionDate
- Violation actions stamp and alert
- Dashboard compliance by team, tier, milestone
- Reporting snapshots for history

<sub>Also asked as: Report on milestone violations · How do you know which cases missed their SLA? · sla breach dashboard service cloud · Track response time compliance</sub>

### What is an Agentforce Service Agent?
*Mid (3–6 yrs) · concept* · `svc-023`

An Agentforce Service Agent is an autonomous AI agent that talks to customers on channels like Enhanced Chat, messaging and voice, and can actually resolve issues, not just follow a scripted bot tree like the older Einstein Bots. You configure it in Agentforce Builder with topics, which are increasingly called subagents, and actions like flows, Apex or prompt templates. It reasons through the Atlas Reasoning Engine, grounded in Knowledge articles and CRM data, and guardrails and instructions define what it may do. For example, a laptop owner asks on chat whether her repair is done. The agent runs a flow to look up the repair case and tells her the status. If she then asks to talk to a person, it hands the conversation to a human through Omni-Channel with a summary, so she doesn't repeat herself. For internal agents there are also Agentforce features like service replies and work summaries.

- Customer-facing autonomous agent on digital channels
- Topics (subagents) plus actions: flow, Apex, prompts
- Grounded in Knowledge and CRM data
- Hands off to humans via Omni-Channel

<sub>Also asked as: How does Agentforce work in Service Cloud? · Agentforce vs Einstein Bots · AI agent for customer support salesforce · Can Agentforce resolve cases without a human?</sub>

### VIP customers should always be routed to senior agents. How would you implement that?
*Mid (3–6 yrs) · scenario* · `svc-024`

First I need a reliable VIP flag, for example a field on Account set from the support tier or entitlement. When a case is created, a flow or the assignment rule checks that flag and sets the case priority to High. For routing I'd use Omni-Channel in one of two ways. Either send VIP cases to a dedicated Senior Agents queue whose routing configuration has a higher routing priority, or, with skills-based routing in Omni-Channel Flow, add a VIP skill that only senior agents have. Say a big hospital customer that buys hundreds of laptops raises a case; it should jump ahead of everyone and go to a senior agent. I'd add a fallback, so if no senior agent is free within a few minutes, the case opens up to other skilled agents rather than waiting. Finally a dashboard tracks VIP wait time and SLA compliance.

- VIP flag on Account drives case priority
- Dedicated queue with higher routing priority
- Or VIP skill via Omni-Channel Flow
- Fallback if no senior agent available

<sub>Also asked as: Route premium customers to a senior support team · Priority routing for VIP accounts · how to give vip cases to experienced agents first · VIP case routing omni channel</sub>

### Cases waiting on the customer should auto-close after 7 days without a response. How would you build it?
*Mid (3–6 yrs) · scenario* · `svc-025`

I'd use a status like Waiting on Customer and stamp a date field, say Awaiting Since, whenever the case moves into that status. Then the simplest no-code option is a record-triggered flow with a scheduled path that runs 7 days after Awaiting Since. It rechecks that the status is still Waiting on Customer, closes the case with a reason like No Response, and can send a final email. For very high volumes, I'd use a scheduled batch Apex job instead. The key part is the reset. Say an agent asks a customer for their laptop's serial number on the 1st. If the customer replies on the 5th, automation on EmailMessage moves the case back to an open status, so on the 8th the scheduled path's conditions no longer match and the case stays open.

- Stamp date when status becomes Waiting on Customer
- Scheduled path 7 days later rechecks and closes
- Batch Apex for very high volumes
- Inbound email resets the status

<sub>Also asked as: Auto close cases after 7 days of no reply · close stale cases automatically · Case pending customer response for a week, close it · Scheduled flow to close cases</sub>

### Write a batch Apex job that closes cases with no customer response for 7 days.
*Mid (3–6 yrs) · code* · `svc-026`

I'd make one class implement both Database.Batchable and Schedulable. The start method returns a query locator for cases in Waiting on Customer status where the Awaiting Since date is older than 7 days, using a date variable rather than a hard-coded date. Execute updates the status in bulk with partial success allowed, so one bad record doesn't fail the whole chunk, and I log the failures. For example, if one night there are 1,200 stale cases and five of them fail a validation rule, the other cases in those chunks still close and I can see the five in the log. The scheduler method just calls Database.executeBatch, and I schedule it nightly with System.schedule and a cron expression. I also write a test class that inserts cases with an old stamp date, runs the batch between Test.startTest and Test.stopTest, and asserts they're closed.

- Batchable plus Schedulable in one class
- Query by status and stamped date
- Partial-success update with error logging
- Schedule nightly with System.schedule

```java
public with sharing class AutoCloseStaleCasesBatch implements Database.Batchable<SObject>, Schedulable {
    public Database.QueryLocator start(Database.BatchableContext bc) {
        Datetime cutoff = System.now().addDays(-7);
        return Database.getQueryLocator([
            SELECT Id, Status FROM Case
            WHERE Status = 'Waiting on Customer'
            AND Awaiting_Since__c < :cutoff
        ]);
    }
    public void execute(Database.BatchableContext bc, List<Case> scope) {
        for (Case c : scope) {
            c.Status = 'Closed';
        }
        for (Database.SaveResult sr : Database.update(scope, false)) {
            if (!sr.isSuccess()) {
                System.debug(LoggingLevel.ERROR, sr.getErrors()[0].getMessage());
            }
        }
    }
    public void finish(Database.BatchableContext bc) {}
    public void execute(SchedulableContext sc) {
        Database.executeBatch(new AutoCloseStaleCasesBatch(), 200);
    }
}
// System.schedule('Auto-close stale cases', '0 0 2 * * ?', new AutoCloseStaleCasesBatch());
```

<sub>Also asked as: Batch class to auto close stale cases · Schedulable batch to close cases · apex code to close cases after seven days · How would you schedule a nightly case cleanup job?</sub>

### Customers send the same email to multiple support addresses, creating duplicate cases. How do you handle it?
*Senior (7–10 yrs) · scenario* · `svc-027`

First I look at why it happens. Usually the customer sends to, or copies, two routing addresses, or forwarding rules on the mail server duplicate the message. Where I can, I fix the source, like consolidating addresses or making sure each mailbox forwards only once. For example, a laptop owner emails both support@ and warranty@ about the same broken hinge, and you get two cases. In Salesforce, I can detect duplicates when the case or EmailMessage is created, comparing the sender address, subject and the email's Message-ID header against recent cases. Then I either close the new case as a duplicate linked to the original, or merge it into the original using Apex merge. I also make sure Lightning threading is enabled, so customer replies attach to the existing case instead of creating new ones.

- Fix the mailbox or forwarding setup first
- Detect by Message-ID, sender and subject
- Close as duplicate or merge into original
- Enable Lightning threading for replies

<sub>Also asked as: Duplicate cases from email-to-case · same email creating two cases · customer cc's two support mailboxes and we get duplicate cases · How do you prevent duplicate cases from emails?</sub>

### Customer replies to case emails are creating new cases instead of attaching to the existing case. Why?
*Senior (7–10 yrs) · scenario* · `svc-028`

This is an email threading problem. Salesforce matches a reply to its case using threading information. The older approach relied on a ref ID in the subject or body, which customers or mail clients often stripped out. The newer Lightning threading uses email headers like Message-ID and In-Reply-To, plus a threading token. So I'd check that Lightning threading is enabled in Email-to-Case settings, and that outbound emails are sent from Salesforce, so those headers are set. For example, if agents at a laptop seller reply to customers from their own Outlook instead of from the case, those headers never get set, and every customer reply opens a new case. Other causes are customers starting a fresh email instead of replying, or a mail gateway rewriting headers. For brand-new emails from the same customer, a flow or Apex can still try to match by contact and subject.

- Legacy ref ID threading was fragile
- Lightning threading uses headers plus token
- Outbound emails must come from Salesforce
- Gateways rewriting headers can break it

<sub>Also asked as: Email threading not working in email-to-case · replies creating new case · What is Lightning threading for email-to-case? · ref id threading vs lightning threading</sub>

### The First Response milestone should complete automatically when the agent sends the first email. How would you do it?
*Mid (3–6 yrs) · scenario* · `svc-029`

Milestones don't complete themselves. You have to set CompletionDate on the CaseMilestone record. I'd add automation on EmailMessage, after insert, for outgoing emails whose parent is a case. It finds the open CaseMilestone for that case with milestone type First Response and sets CompletionDate to now. For example, a laptop case comes in at 10 am with a two-hour first response target, and the agent emails the customer at 10:40. The automation stamps 10:40 on the milestone, so it's marked met. This can be a record-triggered flow on EmailMessage, or a small Apex service called from a trigger, bulkified across many emails. Similarly, the Resolution milestone is completed when the case is closed. With auto-complete in place, success actions fire and reports show the milestone as met.

- Set CaseMilestone.CompletionDate
- Trigger on outgoing EmailMessage with case parent
- Filter by MilestoneType name
- Resolution milestone completes on close

<sub>Also asked as: Auto complete milestone on first email · How do you mark a case milestone as completed? · milestone not completing automatically · complete first response milestone with flow</sub>

### Write Apex to complete a case milestone when an agent sends an email.
*Mid (3–6 yrs) · code* · `svc-030`

I'd write an after insert trigger on EmailMessage that collects the parent case Ids of outgoing emails, meaning Incoming is false and the ParentId is a case, and then calls a service method. The service queries CaseMilestone records for those cases where the milestone type name matches and IsCompleted is false, sets CompletionDate to now, and updates them in one DML. Everything's bulkified with sets and a single query. So if a macro sends replies on 150 cases at once, it's still one query and one update, not 150 of each. I pass the milestone name in, ideally from custom metadata, instead of hard-coding it across classes, so if the business renames First Response to Initial Reply, nobody has to touch the code.

- Trigger on EmailMessage after insert
- Filter outgoing emails with case parents
- One query on CaseMilestone, one update
- Milestone name configurable

```java
trigger EmailMessageTrigger on EmailMessage (after insert) {
    Set<Id> caseIds = new Set<Id>();
    for (EmailMessage em : Trigger.new) {
        if (!em.Incoming && em.ParentId != null
            && em.ParentId.getSObjectType() == Case.SObjectType) {
            caseIds.add(em.ParentId);
        }
    }
    if (!caseIds.isEmpty()) {
        MilestoneService.complete(caseIds, 'First Response');
    }
}

public with sharing class MilestoneService {
    public static void complete(Set<Id> caseIds, String milestoneName) {
        List<CaseMilestone> open = [
            SELECT Id FROM CaseMilestone
            WHERE CaseId IN :caseIds
            AND MilestoneType.Name = :milestoneName
            AND IsCompleted = false
        ];
        for (CaseMilestone cm : open) {
            cm.CompletionDate = System.now();
        }
        update open;
    }
}
```

<sub>Also asked as: Apex code for completing CaseMilestone · EmailMessage trigger to close milestone · update CompletionDate on CaseMilestone in apex · milestone utils class apex</sub>

### Chats and cases come in after business hours when no agents are online. How would you handle routing?
*Senior (7–10 yrs) · scenario* · `svc-031`

I'd treat real-time and asynchronous channels separately. For Enhanced Chat or messaging, the Omni-Channel flow checks business hours and agent availability. After hours it can route to an Agentforce service agent first to resolve simple issues, and if a human is needed, it collects details and creates a case instead of keeping the customer waiting. Because messaging is asynchronous, the conversation can also stay open and be picked up when agents come online. For example, someone messages a laptop seller at 11 pm asking about a refund. The service agent answers what it can, logs a case with the details, and an agent picks it up at 9 am. Email and web cases simply queue and get routed when agents go available, and entitlement business hours stop SLA clocks overnight. For daytime overflow, I route to a secondary queue or skill fallback after a timeout.

- Check business hours in Omni-Channel flow
- Agentforce service agent handles first, then create case
- Async messaging resumes when agents return
- Business hours on entitlements pause SLA

<sub>Also asked as: After hours support routing · What happens when no agent is available in Omni-Channel? · overflow routing when queue is full · Handle customers outside support hours</sub>

### When a customer replies to a closed case, the business wants it reopened instead of creating a new case. How would you do it?
*Mid (3–6 yrs) · scenario* · `svc-032`

By default an inbound email on a closed case gets attached to it, but the case stays closed, so nobody notices. I'd build a record-triggered flow on EmailMessage, after insert, where Incoming is true and the parent case is closed. The flow checks how long ago it was closed. If it's within a window, say 14 days, it reopens the case by setting status to Reopened and notifies the owner or routes it back to the queue. If it's older, it creates a new case linked to the old one as parent, so reporting on reopened cases stays clean. For example, a customer replies five days after a laptop fan repair saying the noise is back, so that case reopens. If she writes two months later, it's a new case with the old one as parent. I also make sure the reopen doesn't reset entitlements incorrectly.

- Flow on incoming EmailMessage
- Reopen within a time window
- Older replies create a linked new case
- Notify owner or re-route

<sub>Also asked as: Reopen case on customer email reply · Closed case receives email, what happens? · auto reopen closed case · Customer replies after case is closed</sub>

### The account manager should be notified whenever a high priority case is created for their account. How would you do it?
*Fresher (0–2 yrs) · scenario* · `svc-033`

I'd build a record-triggered flow on Case that runs after the record is created or updated, when Priority equals High, with the option to run only when the condition first becomes true, so it doesn't fire every time someone edits the case. The flow gets the account owner through the AccountId and sends a notification: an email alert using a template, a custom notification in Salesforce and mobile, or a Slack message if the company uses Slack. I include the case number, subject and a link. For example, when a hospital customer logs a High case saying twenty laptops won't connect to Wi-Fi, their account manager gets a ping on her phone with the case link before the customer calls her. Workflow rules and Process Builder are no longer supported, so Flow is the right tool for this.

- Record-triggered flow, after save
- Run only when condition is first met
- Email alert or custom notification to account owner
- Flow replaces workflow rules and Process Builder

<sub>Also asked as: Notify account owner on high priority case · Send email alert to account owner when case is created · high priority case notification flow · Alert sales rep about customer issues</sub>

### You need a Tier 1 and Tier 2 support model. How would you design case handling and escalation?
*Senior (7–10 yrs) · scenario* · `svc-034`

All new cases route to Tier 1 through Omni-Channel. Tier 1 resolves what they can using Knowledge and macros. When they can't, they use a quick action like Escalate to Tier 2, which captures the reason and the troubleshooting done, changes the owner to a Tier 2 queue or skill, and sets a flag. Tier 2 can be routed by skills like product area. For example, a Tier 1 agent tries the standard reset steps for a laptop that won't boot, hits Escalate, notes what she tried, and the case goes to the Tier 2 hardware specialists. I keep the original agent informed through case teams or follow, and keep the customer-facing SLA on the entitlement, so the milestone clock continues across tiers. Escalation rules or milestone warning actions catch cases that sit too long. Reporting tracks escalation rate, Tier 1 resolution rate and time in each tier, using case history or stamped dates.

- Tier 1 default routing via Omni-Channel
- Escalate quick action captures reason and re-routes
- Tier 2 skills-based routing
- SLA continues; report escalation rate and tier time

<sub>Also asked as: Design multi-tier support in Service Cloud · L1 L2 support escalation design · How should Tier 1 agents escalate to specialists? · Tiered support process in salesforce</sub>

### Agents complain they waste time clicking around to find customer information. How would you improve their console?
*Mid (3–6 yrs) · scenario* · `svc-035`

I'd sit with agents first and watch their actual steps, then redesign the case record page in the console. A highlights panel and compact layout show key fields like entitlement, priority and VIP status at a glance. Related list quick links or dynamic related lists show the account's open cases, assets and orders, and contact and account details can sit in a side component instead of opening subtabs. The utility bar gets macros, Knowledge, history and Omni-Channel. Dynamic forms hide fields that don't apply, and I add quick actions for common tasks. For example, at a laptop seller, if agents keep opening the asset just to check warranty end date, I put that on the case highlights panel. If data lives in other systems, like an order system, I'd surface it with Salesforce Connect or an LWC calling an integration, rather than making agents switch apps.

- Observe agents first
- Highlights panel, dynamic forms, related lists
- Utility bar: macros, Knowledge, Omni-Channel
- Surface external data with Connect or LWC

<sub>Also asked as: Improve agent productivity in the service console · Give agents a 360 view of the customer · console design for support agents · Agents need all customer info on one screen</sub>

### Customers on the help portal should see only public articles for the products they own, while agents see internal articles too. How do you set this up?
*Senior (7–10 yrs) · scenario* · `svc-036`

I'd combine channels, data categories, and record type or field-level controls. Each article has channel settings. Internal-only articles are published only to the internal app, while customer-facing ones are also published to the customer channel used by the Experience Cloud site. For product-based visibility, I tag articles with categories in a Products category group and grant category visibility to portal users, for example through permission sets assigned based on the products the customer owns. Internal agents get all categories. Say a customer owns only the business laptop line. She sees public troubleshooting articles for that line, but not gaming laptop articles and not the internal repair procedures. Sensitive internal fields on an otherwise public article can be hidden with field-level security on the portal profile. Then I test as a portal user to confirm search only shows what it should.

- Channels separate internal and customer articles
- Data categories by product with visibility
- Permission sets per product grant category access
- Field-level security hides internal notes

<sub>Also asked as: Knowledge visibility for portal users · Show knowledge articles in Experience Cloud by product · restrict articles to certain customers · internal vs external knowledge articles</sub>

### Agents are online in Omni-Channel but cases are not being routed to them. What would you check?
*Senior (7–10 yrs) · troubleshooting* · `svc-037`

I'd check the chain end to end. First, is the agent's presence status linked to the right service channel, like Cases, and are they really in that status? Second, is the queue linked to a routing configuration and the case service channel, and is the agent a member of that queue? With skills-based routing, does the agent's service resource have the required skills? Third, capacity: the agent may already be full based on their presence configuration and the units each item uses, or status-based capacity isn't releasing. For example, an agent shows Available, but she's on a status that only covers Chat, so cases never reach her. I also check that the case is actually owned by the queue, that a PendingServiceRouting record exists, and look at Omni Supervisor for items waiting.

- Presence status mapped to service channel
- Queue has routing configuration, agent is a member
- Skills match for skills-based routing
- Capacity full or not released

<sub>Also asked as: Omni-Channel not pushing work · cases stuck in queue omni channel · agent available but not receiving cases · Why is Omni-Channel routing not working?</sub>

### How would you merge duplicate cases using Apex?
*Mid (3–6 yrs) · code* · `svc-038`

The Apex merge statement supports leads, contacts, cases and accounts. You pass a master record and up to two duplicate records or Ids per merge call, and Salesforce moves related records to the master and deletes the duplicates. Because merge is a DML statement, I keep it out of loops where I can and watch the DML limit when merging many groups, often running it in a batch or Queueable. For example, if a cleanup finds 400 groups of duplicate laptop-support cases, that's 400 merge calls, so I'd run it in a batch. I use Database.merge so I can inspect MergeResult for errors. The gotcha: only the master's field values survive, so before merging I copy any values I want to keep, like a serial number that's only on a duplicate, onto the master.

- Merge supports Lead, Contact, Case, Account
- Master plus up to two duplicates per call
- Each merge counts as DML; batch large jobs
- Check Database.MergeResult

```java
public with sharing class CaseMergeService {
    public static void mergeInto(Case master, List<Id> duplicateIds) {
        // up to two duplicates per merge call
        // a list of Ids returns a list of MergeResults
        for (Database.MergeResult result : Database.merge(master, duplicateIds, false)) {
            if (!result.isSuccess()) {
                for (Database.Error err : result.getErrors()) {
                    System.debug(LoggingLevel.ERROR, err.getMessage());
                }
            }
        }
    }
}
```

<sub>Also asked as: Apex merge statement for cases · Database.merge example with Case · programmatically merge duplicate cases · Which objects support merge in Apex?</sub>

### Your org still uses old chat and bots. How would you plan the move to Enhanced Chat and Agentforce?
*Senior (7–10 yrs) · scenario* · `svc-039`

Legacy Chat was retired in February 2026, so any org still on it needs to move to Enhanced Chat, formerly Messaging for In-App and Web. I'd start with an inventory: chat buttons, deployments, routing, pre-chat forms, bots, quick text, and any reports or automation on LiveChatTranscript. Then I build the new messaging channel and embedded service deployment, recreate pre-chat as parameters, and route with Omni-Channel flow. Reports and automation move from LiveChatTranscript to MessagingSession. For bots, Einstein Bot dialogs don't convert one to one into an Agentforce agent, so I redesign them as topics and actions grounded in Knowledge. For example, an old bot with a fixed Track My Repair menu becomes a topic with a flow action that looks up the repair. I pilot on one site or region, train agents on the async experience, then roll out.

- Inventory buttons, deployments, routing, bots, reports
- Rebuild with messaging channel and embedded deployment
- LiveChatTranscript automation moves to MessagingSession
- Bots get redesigned as Agentforce topics and actions

<sub>Also asked as: Migrate legacy chat to Enhanced Chat · Live agent migration plan · move from Einstein Bots to Agentforce · How do you migrate chat transcripts routing to messaging?</sub>

### A case comes in by email from a contact who is not in Salesforce. What happens, and how would you handle it?
*Mid (3–6 yrs) · scenario* · `svc-040`

Email-to-Case tries to match the sender's email address to an existing contact. If it finds exactly one, it sets ContactId, and the account comes from that contact. If there's no match, or more than one, the case is created without a contact, and the email is stored in the Web Email field. Say someone new at a customer company emails support about a laptop. There's no contact for her, so the case just has her address in Web Email. To handle it, I'd add a flow or Apex on case creation: if ContactId is blank, look for a contact by email, and if none exists, create a contact under a placeholder or matched-by-domain account, or flag the case for the agent to link manually. Matching by email domain to an account can help in B2B, but I'd confirm that rule with the business first.

- Matches unique contact by email
- No match: case with Web Email, no contact
- Flow or Apex to match or create contact
- Domain-to-account matching needs business agreement

<sub>Also asked as: Email to case from unknown sender · How does email-to-case link contact and account? · case without contact from new email address · auto create contact from email-to-case</sub>

### Agents keep forgetting to fill in the Resolution field when closing cases. How would you fix it?
*Fresher (0–2 yrs) · scenario* · `svc-041`

I'd add a validation rule on Case that fires when the case is closed, using IsClosed or the status, and the Resolution field is blank, with a clear message like: please enter the resolution before closing. To make it easier, I'd add a Close Case quick action whose layout shows Status, Resolution and Root Cause together, and a dynamic form that shows those fields only when the status is a closed value. So when an agent fixes a laptop's charging issue and clicks Close Case, she sees exactly the three fields she needs, fills in the resolution, and she's done. I'd also check bulk macros or automation that close cases, so they either fill the field or are handled deliberately, otherwise the new rule would start failing them.

- Validation rule on IsClosed and blank resolution
- Close Case quick action with the right fields
- Dynamic forms for conditional visibility
- Check automations and macros that close cases

```java
AND(
  IsClosed,
  ISBLANK(Resolution__c)
)
```

<sub>Also asked as: Make a field required only when case is closed · Validation rule on case close · require resolution notes before closing case · force agents to enter root cause on closed cases</sub>

### Support volume is growing fast. How would you design case deflection and self-service?
*Senior (7–10 yrs) · design* · `svc-042`

I'd first analyze case data by type and reason to find the high-volume, repeatable issues, like password resets or order status. For those, I make sure there are good Knowledge articles published to the customer channel, and build an Experience Cloud help center where search and article suggestions show up before the contact us form, so customers see answers while typing. Then I put an Agentforce service agent on Enhanced Chat and the help center, with actions that actually complete tasks, like checking order status through a flow or integration, and a clean handoff to humans. For example, if a laptop seller finds a big share of cases are where's my order, the agent can answer those directly from the order data. I measure deflection with article views, agent containment rate and case volume per customer, and feed unresolved questions back into new articles.

- Analyze case reasons for top repeatable issues
- Knowledge plus Experience Cloud help center
- Agentforce service agent with real actions
- Measure containment and deflection, close the loop

<sub>Also asked as: How do you reduce case volume in Service Cloud? · Self service strategy with Experience Cloud and Agentforce · case deflection design · Customers should solve simple issues themselves, how?</sub>
