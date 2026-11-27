# CPQ: quote-to-cash lifecycle, features and scenarios

70 questions. Levels: Fresher (0–2 yrs) 25 · Mid (3–6 yrs) 27 · Senior (7–10 yrs) 18

## CPQ Quote-to-Cash Lifecycle

### Walk me through the quote-to-cash process in Salesforce CPQ.
*Fresher (0–2 yrs) · concept* · `cpqx-001`

Quote-to-cash is the path from an opportunity to money collected, and each stage has its own object. Say a software company sells 100 licenses plus onboarding. The rep creates an opportunity, then a CPQ quote, and marks it primary. In the Quote Line Editor they configure the bundle, picking features and options while product rules block bad combinations. CPQ prices every line through the waterfall: list price, contracted or special price, discount schedules, the rep's additional discount, then partner and distributor discounts, with price rules adjusting values along the way. If the discount is too high, Advanced Approvals sends it to a manager. The rep generates the PDF from a quote template and the customer signs. The quote is ordered, which creates an Order with order products. The order is activated and contracted, creating a Contract with subscriptions and assets. From there the contract drives amendments, renewals and the hand-off to billing.

- Opportunity -> primary Quote -> configure -> price -> approve -> document
- Quote ordered -> Order and order products -> activate
- Contracted -> Contract, Subscriptions, Assets
- Contract drives amendments, renewals, billing

<sub>Also asked as: Explain quote to cash end to end in CPQ · what is the q2c flow in sales force cpq · Take me from opportunity to invoice in CPQ · What are the stages of quote-to-cash and which objects are used?</sub>

### What is a primary quote in CPQ and how does it relate to the opportunity?
*Fresher (0–2 yrs) · concept* · `cpqx-002`

The primary quote is the one quote on an opportunity that CPQ keeps in sync with the opportunity products and amount. Say a rep builds three options for a clinic: basic, standard and premium. Only one can be primary. When the rep marks standard as primary, CPQ copies its quote lines to opportunity products, so the amount and forecast reflect that version. If they switch to premium, CPQ replaces the opportunity products with the premium lines. Usually the first quote on an opportunity becomes primary on its own. The gotchas I mention: don't edit opportunity products by hand in a CPQ org, because the next sync overwrites them, and ordering or contracting from the opportunity uses the primary quote's lines.

- One primary quote per opportunity
- Primary quote lines sync to opportunity products
- Switching primary replaces the products
- Do not edit opportunity products directly

<sub>Also asked as: What does the Primary checkbox on a CPQ quote do? · how does a cpq quote sync with opportunity products · Can an opportunity have more than one CPQ quote? · Why did my opportunity amount change when I switched quotes?</sub>

### How do you create an order from a CPQ quote?
*Fresher (0–2 yrs) · concept* · `cpqx-003`

The simplest way is to check Ordered on the accepted quote. CPQ then creates one Order with an order product for every unordered quote line, linked back to the quote and quote line. If the rep only wants some lines, the Create Order button, with the Allow Multiple Orders setting on, lets them pick which lines go on the order. You can also split automatically: pick a quote line field in the Order By picklist, or check Order By Quote Line Group, and CPQ creates one order per value or group. For example, a machine builder ships equipment now and does installation next quarter, so ordering by product family gives two orders. The order starts as a draft; once it's checked and activated, it's ready for contracting and billing.

- Ordered checkbox: one order with all unordered lines
- Create Order button: choose lines manually
- Order By field or Order By Quote Line Group splits orders
- Activate the order before contracting/billing

<sub>Also asked as: What does the Ordered checkbox on a quote do? · how to generate orders in salesforce cpq · Can one CPQ quote create several orders? · Create Order button vs Ordered checkbox</sub>

### How is a contract created in CPQ, and what records come with it?
*Mid (3–6 yrs) · concept* · `cpqx-004`

You create the contract by checking Contracted, usually on the activated order, or on the opportunity in orgs that don't use order-based billing. CPQ creates a Contract on the account with the start date and term from the quote. For every subscription product it creates a Subscription record tied to the contract, and for one-time products like hardware it creates Assets, based on the product's asset conversion setting. For example, a security company selling 50 camera licenses and 50 cameras gets a subscription record for the 50 licenses on the contract and camera assets on the account. The order's contracting method decides whether you get a single contract or contracts split by subscription end date. I prefer contracting from the order when billing is involved, because amendments and renewals then follow the order path cleanly.

- Check Contracted on the order or opportunity
- Subscription products -> Subscription records on the contract
- Non-subscription products -> Assets
- Contracting method: single contract or by subscription end date

<sub>Also asked as: What happens when you check Contracted in CPQ? · contract from order vs contract from opportunity cpq · When does CPQ create subscriptions and assets? · What is the contracting method on an order?</sub>

### What is the difference between a subscription and an asset in CPQ?
*Fresher (0–2 yrs) · comparison* · `cpqx-005`

A subscription is something the customer pays for over a term, and an asset is something they own. In CPQ a product becomes a subscription product when its Subscription Pricing field is set, and after contracting CPQ creates an SBQQ__Subscription__c record linked to the contract. Products without subscription pricing become Asset records on the account, one per unit or one per line depending on the asset conversion setting. Take a printer company: ten printers become assets, and the three-year maintenance plan becomes a subscription. Subscriptions are what amendments and renewals work from in the contract-based model, while assets record the installed base. Both keep a link to the quote line, so you can trace any record back to the deal.

- Subscription Pricing set -> subscription product
- SBQQ__Subscription__c lives on the contract
- Assets live on the account; asset conversion controls count
- Subscriptions drive contract-based amend and renew

<sub>Also asked as: Subscription record vs asset record in Salesforce CPQ · when does cpq create an asset instead of a subscription · What is SBQQ Subscription object? · How does CPQ decide if a product is a subscription?</sub>

### What is co-termination in Salesforce CPQ?
*Mid (3–6 yrs) · concept* · `cpqx-006`

Co-termination means lining up end dates so subscriptions finish together and renew together. Inside one contract CPQ does this automatically on amendments. Say a contract runs January to December and the customer adds ten licenses in July: the new licenses run July to December and are prorated for that half year, so everything renews on the same day. Across contracts on one account, the account's Contract Co-Termination field, with Never, Prompt or Always, together with Co-Termination Event, decides whether a new add-on quote picks up an existing contract's end date: Prompt lets the rep choose the contract, Always uses the earliest end date. You can also renew several contracts into one renewal quote using a master contract. The business value is one renewal conversation and one invoice date instead of a dozen.

- Amendments co-term to the contract end date with proration
- Account field Contract Co-Termination: Never, Prompt or Always
- Master contract renews several contracts together
- Goal: one renewal date per customer

<sub>Also asked as: How does CPQ co-terminate subscriptions? · co term contracts in cpq meaning · Why do add-on licenses end on the contract end date? · What does the Contract Co-Termination setting do?</sub>

### What is the difference between the contract-based and asset-based renewal models in CPQ?
*Mid (3–6 yrs) · comparison* · `cpqx-007`

The renewal model decides what amendments and renewals start from. In the contract-based model, the usual default, the rep opens a contract and clicks Amend or Renew, and CPQ builds the quote from that contract's subscriptions. In the asset-based model, the rep works from what the account owns, using Amend Assets or Renew Assets from the account or opportunity, and picks the assets and subscriptions to change. Picture an IT reseller whose customer bought firewalls across five separate deals: asset-based lets the rep see and renew everything the customer has in one place. It's set in the Subscriptions and Renewals package settings. Most CPQ orgs stay contract-based, and it's worth knowing that Revenue Cloud Advanced is asset-based by design.

- Contract-based: Amend/Renew from the contract
- Asset-based: Amend Assets/Renew Assets from account or opportunity
- Set in Subscriptions and Renewals package settings
- RCA uses an asset-based lifecycle

<sub>Also asked as: Contract based vs asset based amendments in CPQ · renewal model setting cpq explained · When would you use Amend Assets instead of Amend on the contract? · What is asset-based ordering in CPQ?</sub>

### How does CPQ hand off to billing at the end of quote-to-cash?
*Mid (3–6 yrs) · concept* · `cpqx-008`

CPQ stops at the order and contract; invoicing happens in Salesforce Billing or an external ERP. With Salesforce Billing, a managed package that sits on top of CPQ, each product carries a billing rule, a revenue recognition rule and a tax rule. When the order is activated, the order products become billable and invoice runs create invoices on schedule. With an ERP, I usually trigger the integration on order activation, sending the order and order products through middleware or a platform event. For example, a SaaS company activates an order for annual licenses and the ERP raises the first invoice that day. One gotcha with Salesforce Billing: amendments and renewals need to come from contracted orders, so I contract from the order, not the opportunity. On the newer platform, Revenue Cloud Billing is the billing product.

- CPQ hands over at the activated order
- Salesforce Billing: billing, revenue recognition and tax rules on products
- ERP: integrate on order activation
- Contract from the order when billing is involved

<sub>Also asked as: What happens after the order in CPQ, who sends the invoice? · cpq and salesforce billing how they connect · How do you send CPQ orders to an ERP for invoicing? · Where does billing start in the CPQ flow?</sub>

### You need to trace one deal from the opportunity through quote, order, contract and subscriptions. How would you query that?
*Fresher (0–2 yrs) · code* · `cpqx-009`

I follow the lookups CPQ stamps at each stage. The opportunity has SBQQ__PrimaryQuote__c. Quote lines point to the quote through SBQQ__Quote__c. The order points back with SBQQ__Quote__c, the contract points to its order with SBQQ__Order__c, and subscriptions point to the contract with SBQQ__Contract__c. Say finance asks why a customer is billed for 120 licenses when the quote said 100: I run these queries in order and usually find an amendment added 20 more. Keep the queries filtered by Id and selective, because SBQQ objects get big in mature orgs.

- Opportunity.SBQQ__PrimaryQuote__c
- QuoteLine.SBQQ__Quote__c, Order.SBQQ__Quote__c
- Contract.SBQQ__Order__c, Subscription.SBQQ__Contract__c

```java
// 1. Opportunity and its primary quote
SELECT Id, Name, SBQQ__PrimaryQuote__c
FROM Opportunity WHERE Id = :oppId

// 2. Lines on that quote
SELECT SBQQ__Product__r.Name, SBQQ__Quantity__c, SBQQ__NetTotal__c
FROM SBQQ__QuoteLine__c WHERE SBQQ__Quote__c = :quoteId

// 3. Orders created from the quote
SELECT Id, OrderNumber, Status, SBQQ__Contracted__c
FROM Order WHERE SBQQ__Quote__c = :quoteId

// 4. Contract and its subscriptions
SELECT Id, ContractNumber, StartDate, EndDate
FROM Contract WHERE SBQQ__Order__c IN :orderIds

SELECT SBQQ__Product__r.Name, SBQQ__Quantity__c, SBQQ__Contract__c
FROM SBQQ__Subscription__c WHERE SBQQ__Contract__c IN :contractIds
```

<sub>Also asked as: Write SOQL on SBQQ objects to follow a deal end to end · how do i find the subscriptions created from a quote · SOQL to get quote lines for the primary quote · Which lookup fields link quote, order and contract in CPQ?</sub>

### What is an evergreen subscription in CPQ?
*Fresher (0–2 yrs) · concept* · `cpqx-010`

An evergreen subscription has no end date; it keeps running until the customer cancels, so there's nothing to renew. After enabling Evergreen Subscriptions in package settings, you set the product's Subscription Type to Evergreen instead of Renewable or One-time. A good example is a month-to-month managed IT support plan: the customer starts in March and pays every month until they give notice. Because there's no end date, CPQ won't create renewal quotes for it, and you stop it with an amendment. The gotcha interviewers like: a single contract can't hold both evergreen and non-evergreen subscriptions, so if a quote mixes a fixed-term license with an evergreen plan, you need them on separate contracts.

- Subscription Type: Renewable, One-time, Evergreen
- No end date, no renewal; cancel via amendment
- Evergreen and term subscriptions cannot share a contract

<sub>Also asked as: Evergreen vs renewable subscription type · what does subscription type evergreen mean in cpq · How do you sell a subscription with no end date in CPQ? · Do evergreen subscriptions renew?</sub>

### What exactly gets created when you amend a contract and then order the amendment quote?
*Mid (3–6 yrs) · concept* · `cpqx-011`

An amendment changes the existing contract instead of creating a new one. When the rep clicks Amend, CPQ creates an amendment opportunity and an amendment quote that lists the current subscriptions with their quantities. The rep changes quantities or adds products, and CPQ prices only the change, prorated to the contract end date. When that quote is ordered, the order contains just the deltas: for example, plus 20 licenses, or minus 5 if they reduced. When the order is contracted, CPQ adds new subscription records for those deltas to the original contract, so the contract shows the full history. Say a school buys 200 seats and later adds 50: the contract ends up with a 200 line and a 50 line, and the renewal brings both through, merged into one 250 line if Combine Subscription Quantities is set on the contract.

- Amend -> amendment opportunity and quote of type Amendment
- Only deltas are priced, prorated to the end date
- Order holds deltas; contracting adds subscriptions to the same contract
- Renewal merges them if Combine Subscription Quantities is on

<sub>Also asked as: Does an amendment create a new contract in CPQ? · what happens to the original contract after an amendment · amendment opportunity and amendment quote in cpq · How do amendment orders work?</sub>

### Walk me through a renewal in CPQ, from the expiring contract to the new contract.
*Mid (3–6 yrs) · concept* · `cpqx-012`

A renewal turns an expiring contract into a new term through the same quote-to-cash steps. When Renewal Forecast is checked on the contract, CPQ creates a renewal opportunity so the pipeline shows the expected revenue early. When Renewal Quoted is checked, CPQ builds a renewal quote from the renewable subscriptions, priced by the renewal pricing method: same price, current list, or an uplift. For example, a marketing agency's 12-month license contract ends in June; in March the renewal quote appears with all 40 seats at a 5% uplift. The rep adjusts quantities, gets approvals if needed and sends the document. Once accepted, the quote is ordered and contracted, which creates a new contract for the next term. I usually automate both checkboxes with Flow so no renewal is forgotten.

- Renewal Forecast -> renewal opportunity
- Renewal Quoted -> renewal quote from subscriptions
- Pricing: Same, List or Uplift
- Order and contract -> new contract

<sub>Also asked as: Explain the renewal lifecycle in Salesforce CPQ · how does a contract renew in cpq step by step · What do Renewal Forecast and Renewal Quoted do in the lifecycle? · what happens after a renewal quote is accepted</sub>

## Salesforce CPQ

### What are the main features of Salesforce CPQ?
*Fresher (0–2 yrs) · concept* · `cpqx-013`

CPQ covers the full quoting job: configure, price, quote and then contract. On the configure side there are bundles with features and options, option constraints, product rules and guided selling, so reps can only build valid deals. On pricing there's the price waterfall, discount schedules, block and cost-plus pricing, contracted prices, partner discounts, price rules with summary variables and lookup tables, and the calculator plugin for custom logic. Then there's the Quote Line Editor, quote templates for branded PDFs, and Advanced Approvals. After the sale it handles orders, contracts, subscriptions with proration, MDQ, amendments and renewals. For example, a laptop seller can let reps build a valid laptop bundle, apply a 10% volume tier, route big discounts for approval and send a PDF in minutes.

- Configure: bundles, rules, guided selling
- Price: waterfall, schedules, price rules, QCP
- Quote: line editor, templates, approvals
- After sale: orders, contracts, amend, renew, MDQ

<sub>Also asked as: What can Salesforce CPQ do? · key capabilities of sales force cpq · Why would a company use CPQ instead of standard quotes? · Give me an overview of CPQ features</sub>

### What are the main objects in Salesforce CPQ?
*Fresher (0–2 yrs) · concept* · `cpqx-014`

CPQ objects carry the SBQQ namespace and fall into a few groups. Transactional: SBQQ__Quote__c, SBQQ__QuoteLine__c and SBQQ__QuoteLineGroup__c. Catalog and configuration: the standard Product2 and price book plus SBQQ__ProductFeature__c, SBQQ__ProductOption__c, SBQQ__OptionConstraint__c and SBQQ__ConfigurationAttribute__c. Rules: SBQQ__ProductRule__c with error conditions and actions, SBQQ__PriceRule__c with SBQQ__PriceCondition__c and SBQQ__PriceAction__c, and SBQQ__SummaryVariable__c. Pricing: SBQQ__DiscountSchedule__c with SBQQ__DiscountTier__c, and SBQQ__ContractedPrice__c. Documents: SBQQ__QuoteTemplate__c with template content and sections. After the sale: standard Order, Contract and Asset, plus SBQQ__Subscription__c. For example, a 3-year support line on a quote lives in SBQQ__QuoteLine__c and becomes an SBQQ__Subscription__c after contracting.

- Quote, Quote Line, Quote Line Group
- Feature, Option, Option Constraint, Configuration Attribute
- Product Rule, Price Rule/Condition/Action, Summary Variable
- Discount Schedule, Contracted Price, Subscription

<sub>Also asked as: Name the important SBQQ objects · cpq data model explained · What is the SBQQ namespace and what objects does it add? · Which CPQ objects store quotes, rules and subscriptions?</sub>

### What are configuration attributes in Salesforce CPQ?
*Fresher (0–2 yrs) · concept* · `cpqx-015`

A configuration attribute is a field that appears in the bundle configurator and applies a value across the options, instead of setting it on each option. Say a laptop bundle has a Color attribute: the rep picks Silver once at the top, and CPQ writes Silver to the laptop, the bag and the dock options. You create it on the bundle product, choose the Target Field, which must exist on the Product Option and, if you want it saved, on the Quote Line too. You can also link it to a feature, set it as required, and use it in product rules, for example a validation that blocks the 8 GB option when the attribute Usage equals Video Editing. It keeps the configurator simple for reps.

- Set once, applied to options via the Target Field
- Field must exist on Product Option (and Quote Line to persist)
- Can be required and tested in product rules

<sub>Also asked as: How do configuration attributes work in a bundle? · config attributes cpq example · How can one picklist in the configurator apply to all options? · What is the Target Field on a configuration attribute?</sub>

### What are partner and distributor discounts in CPQ?
*Fresher (0–2 yrs) · concept* · `cpqx-016`

Partner and distributor discounts are the last two steps of the price waterfall, used when you sell through a channel. After the customer price is set, the partner discount gives the partner price, and the distributor discount on top of that gives the net price, which is what syncs to the opportunity. Say a networking vendor sells a switch with a customer price of 1,000 through a reseller: a 15% partner discount makes the partner price 850, and a 5% distributor discount makes the net price 807.50. You can set them on the quote so they apply to all lines, or per line, by hand or automatically through a price rule or flow. Keeping them separate from the rep's additional discount makes margin reporting much clearer.

- Customer price -> partner discount -> partner price
- Partner price -> distributor discount -> net price
- Set on quote or line, manually or via automation

<sub>Also asked as: Where do partner discount and distributor discount sit in the price waterfall? · channel discount in salesforce cpq · How does CPQ handle reseller pricing? · What is partner price vs net price?</sub>

### What is guided selling in Salesforce CPQ and how do you set it up?
*Fresher (0–2 yrs) · concept* · `cpqx-017`

Guided selling asks the rep a few questions and then shows only matching products. You create a Quote Process record, then Process Inputs, each one a question like 'What hardware type?' with a picklist. Each input maps to a product field through a mirror field with the same API name, so if the rep answers Laptop, CPQ filters products whose Hardware Type is Laptop. Process Input Conditions show a question only when an earlier answer fits, so the OS question appears only after Laptop is picked. The quote process is linked to the quote, and Guided Only forces reps to add products only this way. For a new rep at a computer reseller, that means three questions instead of scrolling through 2,000 SKUs.

- Quote Process -> Process Inputs (questions)
- Mirror field with same API name on input and product
- Process Input Conditions for dependent questions
- Guided Only restricts adding products to guided flow

<sub>Also asked as: How does a quote process work in CPQ? · guided selling process input cpq setup · How can reps answer questions to find the right product? · What is the Guided Only checkbox?</sub>

### How do you customize the columns shown in the CPQ Quote Line Editor?
*Fresher (0–2 yrs) · concept* · `cpqx-018`

The columns come from field sets, so you change them in Object Manager, not on a page layout. The Line Editor field set on Quote Line controls the line table, and the Line Editor field set on Quote controls the header fields above it, like start date, term and partner discount. Fields that don't fit can go in the Standard Line Item Drawer field set, which opens under each line. For example, a manufacturer adds Warehouse and Lead Time to the drawer so the main table stays readable. If different teams need different columns, CPQ supports a special formula field on the quote called EditLinesFieldSetName that returns which quote line field set to use. Field-level security still applies, and for per-line editability the calculator plugin has isFieldEditable and isFieldVisible hooks.

- Line Editor field set on Quote Line = table columns
- Line Editor field set on Quote = header fields
- Standard Line Item Drawer for extra fields
- EditLinesFieldSetName formula picks field set per quote

<sub>Also asked as: Which field set controls the quote line editor? · how to add a custom field to the qle · What is the line item drawer in CPQ? · Can different quotes show different QLE columns?</sub>

### In the Quote Line Editor, what is the difference between Calculate, Quick Save and Save?
*Fresher (0–2 yrs) · comparison* · `cpqx-019`

Calculate runs the pricing calculation so the rep can see the numbers, but it doesn't save anything. Quick Save calculates and saves the quote while keeping the rep in the editor. Save calculates, saves and closes the editor, taking the rep back to the quote record. A common support call: a rep changes the discount on a 30-line hardware quote, clicks Calculate, closes the tab, and wonders why the quote record still shows the old total. The answer is that nothing was saved. I tell reps to use Quick Save while they're iterating and Save when they're done, and on big quotes to wait until the calculation finishes before trusting the totals.

- Calculate: recalc only, no save
- Quick Save: recalc + save, stay in editor
- Save: recalc + save + exit

<sub>Also asked as: Does Calculate save the quote in CPQ? · quick save vs save qle · Why is my net amount not updated after I clicked Calculate? · What do the buttons on the line editor do?</sub>

### What are quote line groups in CPQ and when would you use them?
*Fresher (0–2 yrs) · concept* · `cpqx-020`

Quote line groups let the rep organise lines into sections, each with its own subtotal, and groups can carry their own start date, term and discount. A typical case is a hospital chain buying equipment for three sites: the rep creates groups for North, Central and South, puts the right lines in each, and the PDF shows each site with its own subtotal. Groups also help with ordering, because Order By Quote Line Group creates one order per group, so each site gets its own order. You add groups in the Quote Line Editor with Add Group, and the Groups tab in package settings covers options like solution groups and requiring a group name. The trade-off is that grouping makes big quotes heavier, so I use it when there's a real business reason.

- Sections with subtotals; own dates, term, discount
- Shows as sections on the quote document
- Order By Quote Line Group -> one order per group

<sub>Also asked as: How do you group lines on a CPQ quote? · quote line groups for different sites or phases · Can groups have their own subscription term? · What does the Add Group button do?</sub>

### What is percent-of-total pricing in CPQ?
*Fresher (0–2 yrs) · concept* · `cpqx-021`

Percent-of-total pricing makes one product's price a percentage of other lines, instead of a fixed price. The classic example is support: a premium support product priced at 20% of the hardware on the quote. If the rep adds 50,000 of servers, support becomes 10,000, and if they add more servers, support goes up automatically on the next calculation. You set the product's pricing method or subscription pricing to Percent Of Total and give it the percentage. Then you control which lines count toward the base, for example excluding services and other percent-of-total products, so support isn't charged on itself. It's cleaner than a price rule for this kind of rule and reps can't forget to update it.

- Price = % of other quote lines
- Common for support, warranty, maintenance
- Control which lines form the base

<sub>Also asked as: How do you price support as a percentage of hardware? · percent of total pricing method cpq · Warranty priced at 20 percent of the quote, how? · What is a percent of total product?</sub>

### Which CPQ package settings have you worked with, and what do they control?
*Mid (3–6 yrs) · concept* · `cpqx-022`

CPQ package settings are the global switches under Installed Packages, Configure, grouped into tabs like Documents, Groups, Line Editor, Plugins, Pricing and Calculation, Quote, Subscriptions and Renewals, Order and Additional Settings. The ones I touch most: Line Editor options such as multi-line delete and the large quote threshold and batch size; Plugins, where the calculator plugin and other plugins are registered; Subscriptions and Renewals, for renewal model, subscription term unit and prorate precision; and Order settings for how orders are created. Additional Settings has an option to disable CPQ triggers, which I only use during data loads. For example, when a client said their monthly add-ons were prorated oddly, the fix was the prorate precision setting, not a price rule. I always document changes, because they affect every quote.

- Tabs: Documents, Groups, Line Editor, Plugins, Pricing and Calculation, Quote, Subscriptions and Renewals, Order, Additional
- Plugins tab registers the QCP
- Renewal model and prorate precision in Subscriptions and Renewals
- Trigger disable only for data loads

<sub>Also asked as: Explain the tabs in CPQ installed package settings · important cpq package settings · Where do you register the quote calculator plugin? · What can you configure in Setup > Installed Packages > CPQ > Configure?</sub>

### Can price rules run inside the bundle configurator, and why would you want that?
*Mid (3–6 yrs) · concept* · `cpqx-023`

Yes. A price rule's evaluation scope can be set to the calculator or the configurator. Calculator rules run in the line editor when the quote calculates; configurator rules run on the configuration page, so option prices update while the rep is still picking. Say a bike shop's custom bike bundle gives the frame upgrade a lower price when the carbon wheels option is also selected: a configurator-scoped rule shows the rep the right option price before they click Save. Configurator rules can only see the bundle being configured, not the rest of the quote, and you choose the configurator event they fire on. I keep most logic in the calculator and use configurator scope only when the rep really needs live prices.

- Evaluation scope: Calculator or Configurator
- Configurator rules see only the current bundle
- A configurator evaluation event controls when it fires
- Use sparingly; most logic in the calculator

<sub>Also asked as: Price rule evaluation scope configurator vs calculator · show price changes while configuring a bundle · What is the Configurator Evaluation Event on a price rule? · price rule not updating option price in configuration page</sub>

### How do you read, calculate and save a CPQ quote from Apex using the CPQ API?
*Senior (7–10 yrs) · code* · `cpqx-024`

I use the CPQ API through SBQQ.ServiceRouter, because plain DML on quote lines skips CPQ's pricing logic. First you add the CPQ API model classes, like QuoteModel and QuoteLineModel, to the org. Then QuoteReader returns the quote as JSON, which I deserialize, change, and pass to QuoteCalculator. The calculator runs in the background and calls a callback class that implements SBQQ.CalculateCallback, and that callback saves with QuoteSaver. For example, when a partner portal changes quantity on a quote, my service reads the quote, sets quantity to 25, calculates and saves, so price rules and discount schedules apply as if the rep did it. The context property names quote and callbackClass must stay exactly as shown, and the API isn't meant for instant results.

- Add CPQ API model classes first
- Read: SBQQ.QuoteAPI.QuoteReader
- Calculate: ServiceRouter.load QuoteCalculator with a callback
- Save: SBQQ.QuoteAPI.QuoteSaver

```java
public with sharing class CpqQuoteService {
    public static QuoteModel read(Id quoteId) {
        String quoteJson = SBQQ.ServiceRouter.read('SBQQ.QuoteAPI.QuoteReader', quoteId);
        return (QuoteModel) JSON.deserialize(quoteJson, QuoteModel.class);
    }

    public static void calculateAndSave(QuoteModel quote) {
        CalcContext ctx = new CalcContext(quote, 'CpqSaveCallback');
        SBQQ.ServiceRouter.load('SBQQ.QuoteAPI.QuoteCalculator', null, JSON.serialize(ctx));
    }

    private class CalcContext {
        private QuoteModel quote;          // keep these exact names
        private String callbackClass;
        private CalcContext(QuoteModel quote, String callbackClass) {
            this.quote = quote;
            this.callbackClass = callbackClass;
        }
    }
}

global with sharing class CpqSaveCallback implements SBQQ.CalculateCallback {
    global void callback(String quoteJSON) {
        SBQQ.ServiceRouter.save('SBQQ.QuoteAPI.QuoteSaver', quoteJSON);
    }
}
```

<sub>Also asked as: Example of SBQQ.ServiceRouter in Apex · cpq api quote reader quote calculator quote saver · How do you recalculate a CPQ quote from code? · Why not just update quote lines with DML in CPQ?</sub>

### You are asked to migrate a company from a legacy quoting tool into Salesforce CPQ. How do you approach the data migration?
*Senior (7–10 yrs) · design* · `cpqx-025`

I treat it as two migrations: configuration and transactions. CPQ configuration, like products, options, rules and templates, is data, not metadata, so I move it with a data deployment tool and external Ids, loading parents first: products and price book entries, features, options, constraints, then rules with their conditions and actions. For transactions I load accounts and opportunities, then quotes and quote lines, then orders, contracts and subscriptions, with bundle parents before children so the required-by links resolve. Active contracts matter most, because renewals and amendments read them. Say a telecom has 3,000 live contracts: I'd migrate them with correct start and end dates, quantities and net prices, then test renewals on a sample. During loads I disable CPQ triggers, reactivate them afterwards, and reconcile totals against the legacy system.

- Config is data: use external Ids and parent-first order
- Transactions: quotes, lines (parents first), orders, contracts, subscriptions
- Disable CPQ triggers during loads, re-enable after
- Validate with renewal and amendment tests

<sub>Also asked as: CPQ data migration best practices · what order do you load cpq data in · How do you migrate active contracts and subscriptions into CPQ? · cpq config is data not metadata how do you deploy it</sub>

### When would you use MDQ, and when would you just add separate quote lines instead?
*Senior (7–10 yrs) · comparison* · `cpqx-026`

I use MDQ when the same product changes quantity or price over time inside one contract and the customer wants to see it year by year. Say a call-centre software deal ramps from 100 to 300 agents over three years: MDQ gives one line with Year 1, 2 and 3 columns, and each segment becomes its own subscription. If the change is a one-off, like adding a product halfway through, separate lines or an amendment are simpler. MDQ has real costs: more quote lines behind the scenes, price rules that must handle segments, templates that need segmented tables, and renewals that must be tested carefully. So I ask whether the ramp is standard for the business before turning it on.

- MDQ for ramps of the same product over time
- Each segment is its own line and subscription
- Cost: more lines, rules, templates, renewal behaviour
- One-off changes: separate lines or amendments

<sub>Also asked as: MDQ vs multiple lines with different dates · downsides of multi dimensional quoting · Is MDQ always the right answer for ramp deals? · segmented quote lines vs normal lines cpq</sub>

### How does product selection work in CPQ, and how can you control which products a rep sees?
*Mid (3–6 yrs) · concept* · `cpqx-027`

When the rep clicks Add Products, CPQ shows active products that have an active price book entry in the quote's price book and currency. On top of that you have several levers. Search filters and the search results columns are driven by product field sets, so you choose what reps can search on and see. Guided selling narrows the list through questions. Filter product rules can narrow dynamic searches and option lookups, like only showing EU-certified chargers for European accounts. And separate price books per region or channel control the catalog at a higher level. For a distributor with 5,000 SKUs, I usually combine a regional price book with a couple of search filters and a favourites list for common items.

- Base rule: active product + active entry in quote price book and currency
- Search filters and results via product field sets
- Guided selling and filter rules narrow results
- Price books per region or channel

<sub>Also asked as: What decides which products show in Add Products? · cpq product search filters · How do you limit the product catalog for certain reps? · filter rules in product selection</sub>

### Write a Quote Calculator Plugin onBeforeCalculate function that sets a default discount based on the customer tier.
*Senior (7–10 yrs) · code* · `cpqx-028`

onBeforeCalculate runs after formula fields are evaluated but before the calculation, so it's a good place to prepare line values. Say a parts distributor gives Gold customers 10% and Silver 5% unless the rep typed something else. I read the tier from the quote record, loop through the lines, skip bundled components, and set the additional discount only when it's empty, so a rep's manual value is respected. Every field I use must be listed in the Custom Script's quote and line field lists, otherwise it comes through undefined. The function returns a Promise. I keep plugin logic small and test it on a big quote, because it runs on every calculation.

- Runs before calculation, after formulas
- Respect rep input: only fill empty values
- List every field in the Custom Script field lists
- Return a Promise

```java
// Custom Script > Code. Add Customer_Tier__c to Quote Fields and
// SBQQ__Discount__c, SBQQ__Bundled__c to Quote Line Fields.
export function onBeforeCalculate(quoteModel, quoteLineModels, conn) {
  var tier = quoteModel.record['Customer_Tier__c'];
  var defaultDisc = tier === 'Gold' ? 10 : (tier === 'Silver' ? 5 : 0);

  quoteLineModels.forEach(function (line) {
    var rec = line.record;
    if (rec['SBQQ__Bundled__c']) { return; }          // skip bundled components
    if (rec['SBQQ__Discount__c'] == null && defaultDisc > 0) {
      rec['SBQQ__Discount__c'] = defaultDisc;         // only fill when empty
    }
  });
  return Promise.resolve();
}
```

<sub>Also asked as: QCP onBeforeCalculate example · javascript in cpq to default the discount before price rules · how to set quote line fields in the calculator plugin · Example of reading a quote field in QCP</sub>

### You need to write a test class for Apex that works with CPQ quotes. How do you keep the CPQ package from getting in the way?
*Mid (3–6 yrs) · code* · `cpqx-029`

I test my own logic and keep CPQ's package logic out of the data setup. In @TestSetup I wrap inserts of the quote and quote lines in SBQQ.TriggerControl.disable() and enable() inside try/finally, so CPQ's triggers don't fire calculations while I build data. I set the price and discount fields I need directly, rather than waiting for CPQ to calculate them, because tests shouldn't depend on the background calculator. Then I test my class with startTest and stopTest and assert on my fields. For example, a class that flags quotes with any line above 20% discount for VP approval gets one quote with a 25% line and one with 10%, and I assert only the first is flagged.

- Disable CPQ triggers during test data setup
- Set price fields directly; do not wait on CPQ calculation
- Test positive and negative cases

```java
@IsTest
private class QuoteApprovalFlagTest {
    @TestSetup
    static void setup() {
        SBQQ.TriggerControl.disable();
        try {
            Account acc = new Account(Name = 'Test Parts Co');
            insert acc;
            Product2 prod = new Product2(Name = 'Widget', IsActive = true);
            insert prod;
            SBQQ__Quote__c q = new SBQQ__Quote__c(SBQQ__Account__c = acc.Id);
            insert q;
            insert new SBQQ__QuoteLine__c(SBQQ__Quote__c = q.Id, SBQQ__Product__c = prod.Id,
                SBQQ__Quantity__c = 5, SBQQ__ListPrice__c = 100, SBQQ__Discount__c = 25);
        } finally {
            SBQQ.TriggerControl.enable();
        }
    }

    @IsTest
    static void flagsHighDiscount() {
        Id quoteId = [SELECT Id FROM SBQQ__Quote__c LIMIT 1].Id;
        Test.startTest();
        QuoteApprovalFlag.run(new Set<Id>{ quoteId });
        Test.stopTest();
        SBQQ__Quote__c q = [SELECT Needs_VP_Approval__c FROM SBQQ__Quote__c WHERE Id = :quoteId];
        Assert.isTrue(q.Needs_VP_Approval__c, 'Quote with 25% discount should need VP approval');
    }
}
```

<sub>Also asked as: test class for code on SBQQ quote lines · cpq triggers make my test class slow · How do you create CPQ test data? · Can I rely on CPQ calculation in Apex tests?</sub>

### How do Salesforce CPQ concepts map to Revenue Cloud Advanced?
*Mid (3–6 yrs) · comparison* · `cpqx-030`

Most CPQ ideas carry over, but they live in different places. CPQ's SBQQ quote and quote line become the standard Quote and Quote Line Item. Bundles, features and options become product structures in Product Catalog Management, with attributes and classifications. Product rules and option constraints map to configurator rules and Constraint Modeling Language. Price rules, discount schedules, summary variables and calculator plugin logic map to pricing procedures driven by context definitions. CPQ subscriptions on a contract become assets in an asset-based lifecycle, which amendments and renewals start from. For example, a CPQ volume discount schedule on a laptop becomes a tiered price adjustment in a pricing procedure. I tell interviewers my CPQ knowledge of the business problems transfers fully; the tooling is what's new.

- SBQQ Quote/Line -> standard Quote/Quote Line Item
- Bundles -> Product Catalog Management structures
- Product rules -> configurator rules / CML
- Price rules, schedules, QCP -> pricing procedures
- Subscriptions -> asset-based lifecycle

<sub>Also asked as: If I know CPQ, what is the equivalent in RCA? · cpq vs revenue cloud advanced terminology · What replaces price rules and product rules in Revenue Cloud? · mapping sbqq objects to revenue cloud objects</sub>

### What can native CPQ quote templates do, and where do they hit their limits?
*Mid (3–6 yrs) · concept* · `cpqx-068`

Native templates handle most branded quotes. A template is built from sections, and each section holds content: HTML for formatted text and merge fields, Line Items for the product table with configurable line columns, Quote Terms for terms and conditions, and Custom content, which is a Visualforce page whose output must be XSL-FO compatible. Sections and quote terms can print conditionally based on quote fields, so an EU section appears only on EU quotes, and line items can be grouped. The limits: the editor is basic, layout control is weaker than Word, images are referenced by URL, and complex tables, nested bundles or charts usually mean custom Visualforce that's hard to maintain. Very large quotes can also generate slowly. For example, a client wanting editable Word proposals with legal redlining needed a document generation tool alongside CPQ.

- Content types: HTML, Line Items, Quote Terms, Custom (Visualforce, XSL-FO)
- Conditional sections and terms
- Limits: basic editor, layout control, complex tables
- Heavy needs: custom content or a document tool

<sub>Also asked as: limitations of salesforce cpq quote templates · template sections conditional printing custom content · when do you need a third party document tool instead of cpq templates · custom visualforce content in a quote template</sub>

## CPQ Scenarios

### The business says any quote with a discount over 20% must be approved by the VP of Sales. How would you build it in CPQ?
*Mid (3–6 yrs) · scenario* · `cpqx-031`

I'd build it in Advanced Approvals. First I decide what '20%' means: usually the biggest total discount on any line, so I add a formula field on the quote line that combines additional discount and schedule discount into one percentage. Then I create an Approver record for the VP, or point to a user field so it follows org changes. I add an approval variable on the quote that takes the MAX of that line field, and an approval rule targeting the quote with a condition 'variable greater than 20'. I add Submit and Recall buttons, lock editing while the quote is pending, and stop document generation until it's approved. For example, a 25% discount on a server line goes to the VP, while 15% goes straight through. Without the Advanced Approvals package, a roll-up MAX on the quote plus a standard approval process also works.

- Define the discount measure first (formula on line)
- Approval variable: MAX of line discount
- Rule condition: variable > 20, approver = VP
- Lock the quote while pending

```java
Approval Variable: Max Line Discount
  Target Object: Quote Line   Aggregate Function: Max
  Aggregate Field: Total_Discount_Pct__c

Approval Rule: VP discount approval
  Target Object: Quote   Approver: VP of Sales
  Conditions Met: All
  Condition 1: Tested Variable = Max Line Discount
               Operator = greater than   Filter Value = 20
```

<sub>Also asked as: Discount above 20 percent needs VP approval in CPQ · set up advanced approvals for high discount · how to route cpq quotes to vp when discount is high · Approval rule based on max line discount</sub>

### Discounts between 10 and 20% need the sales manager, above 20% also the VP, and non-standard payment terms need Finance at the same time. How would you design the approvals?
*Senior (7–10 yrs) · scenario* · `cpqx-032`

I'd use Advanced Approvals with separate rules and step numbers. Rule one: discount over 10%, approver is the rep's manager from a user field, step 1. Rule two: discount over 20%, approver is the VP, step 2, so it only starts after the manager approves. Rule three: payment terms not equal to Net 30, approver is a Finance group, also at step 1, so Finance and the manager review in parallel. If the same manager-then-VP sequence repeats across rules, I put it in an approval chain and reuse it. For a quote with 25% off and Net 90 terms, the manager and Finance get emails together, then the VP. I'd also enable smart approvals on the rule conditions so a resubmission doesn't re-ask approvers whose condition didn't change, and test with Preview Approval.

- One rule per condition; step numbers set order
- Same step = parallel; dynamic approver from a field
- Approval chains for reusable sequences
- Smart approvals and Preview Approval

<sub>Also asked as: multi level approvals in cpq with parallel finance approval · serial and parallel approvals advanced approvals · How do approval steps and chains work for tiered discounts? · design approval matrix in salesforce cpq</sub>

### The price of a product must change by region and by quantity tier. How would you implement it without creating dozens of price rules?
*Mid (3–6 yrs) · scenario* · `cpqx-033`

I'd use one price rule with a lookup table. I create a custom object, say Regional Price, with Region, Product Code, Min Qty, Max Qty and Unit Price, and the pricing team maintains rows like 'EMEA, LAP-01, 1 to 49, 950' and 'EMEA, LAP-01, 50 to 199, 900'. Region needs to be on the quote, for example as a formula from the account. The price rule uses that object as its lookup object, with lookup queries matching region, product code and quantity between min and max, and a price action that writes the matched unit price to the line's special price On Calculate. New regions or tiers are just new rows, no admin change. If it were only quantity, a discount schedule would be simpler; the lookup table wins when there are two or more dimensions.

- Custom lookup object holds the price matrix
- Lookup queries: region, product, qty >= min and <= max
- Action writes Unit Price to the line
- Discount schedule if quantity is the only factor

```java
Lookup Object: Regional_Price__c
  Region__c | Product_Code__c | Min_Qty__c | Max_Qty__c | Unit_Price__c

Price Rule: Regional tier price
  Evaluation Event: On Calculate   Lookup Object: Regional_Price__c
  Lookup Query 1: Quote.Region__c          equals                Region__c
  Lookup Query 2: Line.SBQQ__ProductCode__c equals                Product_Code__c
  Lookup Query 3: Line.SBQQ__Quantity__c    greater or equals    Min_Qty__c
  Lookup Query 4: Line.SBQQ__Quantity__c    less or equals       Max_Qty__c
  Price Action:  Target Field SBQQ__SpecialPrice__c
                 Source Lookup Field Unit_Price__c
```

<sub>Also asked as: region and quantity based pricing in cpq · price matrix by country and volume · use a lookup table for region pricing in salesforce cpq · Different unit price for EMEA and APAC with volume breaks</sub>

### A customer six months into a 12-month contract wants to add 20 more licenses. What do you do in CPQ?
*Fresher (0–2 yrs) · scenario* · `cpqx-034`

This is an amendment, not a new quote. I open the customer's contract and click Amend. CPQ creates an amendment opportunity and quote showing the current 100 licenses. I change the quantity on that line to 120, or add a new line, and CPQ prices only the extra 20, prorated to the contract end date, so they pay for six months, not twelve. The existing licenses keep their original price. After approval and signature, I order the amendment quote; the order holds just the 20, and when it's contracted, CPQ adds those subscriptions to the same contract. At renewal, all 120 come through together. The key point for interviewers: never create a separate new contract for add-ons, or you lose co-termination and get two renewal dates.

- Amend from the contract
- Only the delta is priced, prorated to end date
- Order and contract add to the same contract
- Keeps one renewal date

<sub>Also asked as: customer wants to add licenses mid contract · how to upsell on an existing cpq contract · add users halfway through subscription term · Mid-term add-on licenses in Salesforce CPQ</sub>

### A renewal quote is showing the wrong prices. How do you troubleshoot it?
*Mid (3–6 yrs) · troubleshooting* · `cpqx-035`

I start with the renewal pricing method, because it decides the source of the price. Same keeps the previous price, List reprices from the current price book, and Uplift adds the renewal uplift rate. I check the Renewal Pricing Method on the account, and the uplift rate on the contract and subscriptions. Then I check the subscriptions themselves: if lines were combined because Combine Subscription Quantities is on, lines with different prices can merge into one price. Next I look at price rules or the calculator plugin, because they also run on renewal quotes and can overwrite the price unless they check the quote type. Finally I check contracted prices and discount schedules on the account. Say a gym chain expected last year's price plus 3% but got list price: usually the method was List on the account.

- Check Renewal Pricing Method on the account
- Uplift rate value
- Combined subscription lines with different prices
- Price rules/QCP running on renewal quotes

<sub>Also asked as: cpq renewal quote pricing incorrect · renewal price is list price but should be same as last year · uplift not applied on renewal quote · Why is my renewal quote price different from the contract?</sub>

### An integration creates CPQ quotes with around 500 lines, and the totals come out wrong or the calculation times out. What do you do?
*Senior (7–10 yrs) · scenario* · `cpqx-036`

First I check how the lines are being created. If the integration inserts SBQQ__QuoteLine__c records with plain DML, CPQ's pricing doesn't run properly, so totals are blank or stale. I'd switch it to the CPQ API: read the quote, add products, then call the calculator with a callback that saves the quote, so price rules and schedules apply. Since that calculation runs in the background, the integration must not read totals right away; I have it check back later or wait for a platform event raised after the save. For 500 lines I also review the Large Quote Threshold and Quote Batch Size settings, custom triggers and flows on quote lines, and the plugin, because they all multiply with line count. Where possible, bundles or MDQ reduce the number of lines. For example, an equipment rental site sending nightly quotes had to move from DML to the API.

- Avoid raw DML on quote lines; use the CPQ API
- Calculation is async: do not read totals immediately
- Tune large quote settings, triggers, flows, QCP
- Reduce line count with bundles or MDQ

<sub>Also asked as: quote lines inserted by integration not calculated · cpq large quote via api times out · how to recalculate a 500 line quote created by data load · Quote totals are zero after lines inserted through API</sub>

### Every server bundle must include a support product, and support must be priced at 18% of the bundle. How do you configure it?
*Mid (3–6 yrs) · scenario* · `cpqx-037`

Two pieces: make support mandatory inside the bundle, then price it as a percentage. In the server bundle I add a Support feature with a minimum option count of 1, and options for Standard and Premium Support, so the rep must pick one; if there's only one support product, I mark that option Required so it can't be removed. Then I set the support product to percent-of-total pricing at 18%, so its price is 18% of the lines in its base. I make sure the base only includes the server bundle's hardware, not services or other support lines. For example, a 40,000 server configuration gives 7,200 of support, and if the rep adds two more disks, support recalculates. I'd also add a quote-level validation if support sold outside the bundle must follow the same rule.

- Feature min option count 1, or Required option
- Support product priced Percent Of Total at 18%
- Control which lines form the base
- Optional validation rule at quote level

<sub>Also asked as: force support in a bundle cpq · required option with percent of total pricing · bundle must always have maintenance at a percentage · How do you stop reps removing support from a bundle?</sub>

### The quote PDF must show a different layout for each region. How would you handle it?
*Mid (3–6 yrs) · scenario* · `cpqx-038`

If the layouts are really different, I create one quote template per region and pick it automatically. Each template gets its own logo, sections, line columns and terms. Then a before-save flow sets the quote's template lookup based on the region, so when the rep clicks Preview Document, the right template is already chosen. If the differences are small, I keep one template and use conditions instead: template sections or quote terms that only print when a quote field matches, such as VAT wording only for EU quotes. For example, an industrial equipment vendor might show prices in EUR with VAT notes and a German address for Europe, and USD with sales tax wording for North America. I prefer fewer templates with conditions, because every extra template is another thing to maintain.

- Big differences: one template per region, set by flow
- Small differences: conditional sections and quote terms
- Fewer templates are easier to maintain

<sub>Also asked as: different quote template per country · quote document layout based on region cpq · How do you choose the quote template automatically? · EMEA and US quotes need different terms and logo</sub>

### A custom trigger on quote lines changes prices, and CPQ keeps overwriting the values or recalculating in a loop. How do you fix it?
*Senior (7–10 yrs) · scenario* · `cpqx-039`

The root problem is that the trigger is fighting the calculator. CPQ owns fields like list, regular, customer and net price, and it recalculates them on every calculate, so anything a trigger writes there gets overwritten, and trigger updates can make CPQ calculate again. My steps: move the price logic into a price rule or the calculator plugin, where it runs inside the calculation sequence. Keep triggers for non-price work, like stamping a margin band or syncing to another object, and only run when a relevant field actually changed. Use a static guard so the logic runs once per transaction. And check SBQQ.TriggerControl.isEnabled(), so the trigger stays quiet during data fixes where CPQ triggers are switched off. For example, a 'Gold customer extra 3%' trigger becomes a one-condition price rule.

- Do not write CPQ-calculated price fields from triggers
- Move price logic to price rules or QCP
- Changed-field checks and a static guard
- Respect SBQQ.TriggerControl.isEnabled()

```java
trigger QuoteLineTrigger on SBQQ__QuoteLine__c (before update) {
    if (!SBQQ.TriggerControl.isEnabled()) return;   // quiet during data fixes
    QuoteLineHandler.beforeUpdate(Trigger.new, Trigger.oldMap);
}

public with sharing class QuoteLineHandler {
    public static void beforeUpdate(List<SBQQ__QuoteLine__c> lines,
                                    Map<Id, SBQQ__QuoteLine__c> oldMap) {
        for (SBQQ__QuoteLine__c ql : lines) {
            SBQQ__QuoteLine__c old = oldMap.get(ql.Id);
            if (ql.SBQQ__NetTotal__c == old.SBQQ__NetTotal__c) continue;
            // non-price field only; pricing stays in price rules / QCP
            ql.Margin_Band__c = (ql.SBQQ__NetTotal__c != null && ql.SBQQ__NetTotal__c > 50000)
                ? 'Large' : 'Standard';
        }
    }
}
```

<sub>Also asked as: trigger on sbqq quote line conflicts with cpq calculation · cpq overwrites the field my trigger sets · quote keeps recalculating after my trigger update · Should I update CPQ price fields from a trigger?</sub>

### A rep says a product does not show up when they click Add Products. What do you check?
*Fresher (0–2 yrs) · troubleshooting* · `cpqx-040`

I walk the checklist in order. Is the product active? Does it have an active price book entry in the quote's price book, and in the quote's currency? That's the most common miss: someone adds a product in USD but the quote is in EUR. Is the quote using the price book I think it is? Then I check filters: a guided selling process, a filter product rule, or a search filter can hide it. I check whether the product is set up as a component only meant to be sold inside a bundle, and whether the rep has access to the product and price book. For example, a new SSD upgrade for a laptop seller didn't appear because the price book entry existed only in the standard price book, not in the regional one the quotes use.

- Product active + active entry in quote price book and currency
- Quote price book is the expected one
- Guided selling, filter rules, search filters
- Component-only products and user access

<sub>Also asked as: product missing from cpq product selection · cannot find product in add products cpq · Why is my new product not visible on the quote? · product not appearing in quote line editor search</sub>

### A product gets added to the quote with a zero or blank price. Why might that happen?
*Fresher (0–2 yrs) · troubleshooting* · `cpqx-041`

Usually the price is coming from a different place than expected. I check the price book entry for the quote's price book and currency first. If the product is an option inside a bundle, I check whether the option is marked Bundled, which makes its price zero because it's included in the parent, or whether there's an option-level unit price override. Then I check the pricing method: Cost needs a cost record, Block needs block price tiers, and Percent Of Total needs other lines to calculate from. Finally I look for a price rule that writes a zero, for example a rule built for promotions with conditions that are too broad. For example, a printer bundle showed a 0 toner cartridge because the option was marked Bundled, which was correct behaviour; the business just hadn't realised it.

- Price book entry in the right book and currency
- Bundled option = zero by design
- Pricing method needs cost, block tiers or base lines
- Price rule writing a zero

<sub>Also asked as: quote line list price is zero in cpq · price not populating on cpq quote line · why is the unit price empty after adding a product · cpq option price shows 0 in bundle</sub>

### In a bundle, an option should only appear when another option is selected. How do you do that?
*Fresher (0–2 yrs) · scenario* · `cpqx-042`

I'd use a selection product rule with a Show or Hide action, or an option constraint, depending on what exactly is needed. Say a laptop bundle has an Extended Battery option that only makes sense with the Travel Kit. For 'can't pick this unless that is picked', an option constraint of type Dependency is simplest: the Travel Kit is the constraining option and the Extended Battery is constrained, so it stays disabled until the kit is selected. If the business wants it completely hidden until then, I build a selection rule with scope Product: the error condition tests that the Travel Kit option is not selected, and the action hides the Extended Battery option. Constraints are lighter and easier for admins; rules are more flexible.

- Option constraint (Dependency) disables until selected
- Selection rule with Show/Hide actions hides it
- Constraints are simpler; rules more flexible

<sub>Also asked as: show option only if another option chosen cpq · hide product option based on selection · dependent options in a cpq bundle · option constraint vs selection rule for hiding</sub>

### When a rep picks the "Video Editing" usage on a laptop bundle, it must have at least 32 GB RAM. How would you enforce it?
*Mid (3–6 yrs) · scenario* · `cpqx-043`

I'd add a configuration attribute and a validation product rule. On the laptop bundle I create a Usage configuration attribute, so the rep picks Office, Gaming or Video Editing at the top of the configurator. Then I create a product rule of type Validation, scope Product, evaluated on save or edit, with error conditions: Usage equals Video Editing, and the 32 GB option is not selected. The message says 'Video Editing laptops need 32 GB RAM, please select it.' The rep can't save until it's fixed. If the business preferred to just pick it for the rep, I'd use a selection rule that adds the 32 GB option instead. Validation is right when you want the rep to make the choice consciously, for example because it changes the price noticeably.

- Configuration attribute captures the usage
- Validation rule, scope Product, blocks save
- Selection rule alternative auto-adds the option

<sub>Also asked as: validation rule in cpq configurator based on attribute · product rule to block wrong configuration · enforce minimum ram option for a usage type · How do you stop invalid bundle combinations?</sub>

### Sales wants a warning when quote margin drops below 25%, but reps should still be able to save. What would you use?
*Fresher (0–2 yrs) · scenario* · `cpqx-044`

An Alert product rule. An alert shows a message in the line editor but lets the rep continue, while a Validation rule blocks the save. I'd first make margin available: a summary variable for the total cost and one for the net total, or a quote-level margin field. Then the alert rule, scope Quote, has an error condition like 'margin percent less than 25' and a message such as 'Margin is below 25%, this quote will need Finance approval.' For example, a rep at a furniture distributor discounts a desk order to 22% margin, sees the warning, and decides whether to continue. I usually pair the alert with an approval rule on the same threshold, so the warning tells reps what will happen.

- Alert = warn and continue; Validation = block
- Margin from summary variables or quote field
- Pair with an approval rule on the same threshold

<sub>Also asked as: warning message without blocking in cpq · alert product rule example · show a popup in the line editor for low margin · difference between alert and validation rule in cpq</sub>

### Reps must not sell below a floor price for each product, but managers can approve exceptions. How do you implement it?
*Mid (3–6 yrs) · scenario* · `cpqx-045`

I'd store the floor on the product and compare it to the net price, using approvals rather than a hard block. First a Floor Price field on Product, copied to the quote line through a twin field so it's available at calculation. Then a formula on the quote line that flags 'Below Floor' when net unit price is under the floor. An approval variable counts lines below floor, and an approval rule sends any quote with a count above zero to the sales manager. For a hard stop on certain products, I'd add a validation product rule with a summary variable counting below-floor lines, with no approval route. For example, a 100 unit cable deal at 3.10 against a 3.50 floor goes to the manager instead of being blocked outright, which keeps deals moving.

- Floor Price on product, twin field to quote line
- Formula flag on the line
- Approval rule for exceptions; validation for hard stops

<sub>Also asked as: minimum price per product in cpq · stop discounting below floor price · floor price validation salesforce cpq · enforce minimum net price with approval override</sub>

### A customer buys the same product in several orders through the year and wants volume discounts based on their total purchases. How would you set it up?
*Mid (3–6 yrs) · scenario* · `cpqx-046`

I'd use a discount schedule with Cross Orders turned on. Normally a discount schedule only looks at the quantity on the current quote. With Cross Orders, CPQ also counts the account's existing asset quantities for that product, so the tier is based on the running total. Say a hospital group buys 300 infusion pumps in Q1 and 300 more in Q3, and the tiers are 0 to 499 at 0% and 500 plus at 8%: the Q3 quote lands in the 8% tier because the total is 600. If the business wants different products to share one count, like several pump models, Cross Products pools their quantities on the quote. Cross Orders counts every asset on the account, even old ones, so I'd confirm finance is happy with that, and test it with real historical data.

- Discount schedule with Cross Orders counts the account's assets
- Cross Products pools related products on the quote
- Confirm the counting window with finance

<sub>Also asked as: volume discount across multiple orders cpq · discount schedule cross orders · cumulative volume pricing in salesforce cpq · discount based on what the customer already bought</sub>

### Quotes for reseller accounts must get a 15% partner discount automatically. How would you do it?
*Fresher (0–2 yrs) · scenario* · `cpqx-047`

I'd store the partner's standard discount on the account and default it onto the quote. A Partner Discount field on the reseller account holds 15. A before-save flow on quote creation copies it into the quote's Partner Discount field, and CPQ applies it to every line at the partner price step of the waterfall. That keeps it separate from the rep's own additional discount, so reports show exactly how much went to the channel. If the discount depends on product family, for example 15% on hardware but 5% on services, I'd use a price rule On Calculate that sets the line-level partner discount by family instead. For example, a 10,000 customer price on a router becomes an 8,500 partner price automatically, and any additional discount the rep adds comes off the customer price before the partner step.

- Discount stored on the reseller account
- Flow defaults quote Partner Discount
- Price rule for product-family-specific discounts
- Keeps channel discount separate in reporting

<sub>Also asked as: auto apply partner discount for resellers cpq · set partner discount based on account type · channel partner pricing automation in salesforce cpq · how do you default the partner discount on a quote</sub>

### A customer has three contracts ending in March, June and October and wants one renewal date. How do you handle it?
*Senior (7–10 yrs) · scenario* · `cpqx-048`

I'd consolidate at the next renewal, using co-termination. The usual approach: pick a target date, say end of March next year, and when the March contract comes up, renew it as the master contract and bring the June and October contracts into the same renewal quote, so their lines start the day after each one ends and run to the common date. The account's co-termination fields, like Contract Co-Termination and Combine Co-Termed Contracts, control whether the rep is prompted and whether matching products merge into one line. Lines from the June and October contracts are prorated for their shorter terms. I'd confirm the plan with finance, because the first combined invoice looks unusual, and check whether the customer wants groups per original contract on the document. After that cycle, the customer has one contract and one renewal date.

- Choose a target co-term date
- Renew with a master contract and include others
- Account co-termination fields: Prompt or Always, combine or group
- Proration for shorter terms; agree with finance

<sub>Also asked as: combine multiple contracts into one renewal cpq · co-terminate contracts with different end dates · customer wants a single renewal for all contracts · master contract renewal salesforce cpq</sub>

### A customer wants to upgrade from the Standard plan to Premium halfway through their contract. How do you do that in CPQ?
*Senior (7–10 yrs) · scenario* · `cpqx-049`

I'd handle it as an amendment that swaps the products. From the contract, I click Amend and get the current lines, say 50 Standard seats. I set the Standard quantity to zero and add 50 Premium seats. CPQ creates a negative delta for the remaining Standard term, which becomes a credit, and a prorated charge for Premium from the amendment start date to the contract end. The net is the difference for the rest of the term. Once ordered and contracted, the contract shows Standard ending and Premium starting on the amendment date, and the renewal will only include Premium. I'd check with the business whether they give full credit for unused time, because some companies want a partial credit or no credit, which needs a price rule or manual adjustment.

- Amend, set old product quantity to 0, add new product
- Negative delta credits remaining term
- New product prorated to contract end
- Confirm credit policy with the business

<sub>Also asked as: swap product mid contract cpq · upgrade subscription in salesforce cpq amendment · replace one subscription with another during term · How to downgrade or upgrade a plan in CPQ?</sub>

### A customer wants to cancel their subscription before the contract ends. How would you process that in CPQ?
*Mid (3–6 yrs) · scenario* · `cpqx-050`

In contract-based CPQ, the standard way to cancel is an amendment. I amend the contract and set the quantities of the cancelled lines to zero, with the amendment start date as the cancellation date. CPQ calculates negative amounts for the unused term, and the order created from it carries those reductions to billing. If the contract says there's an early termination fee, I add a one-time fee product to the same amendment quote. Then I uncheck renewal forecasting or update the renewal opportunity so the pipeline doesn't show revenue that won't come. For example, a coworking company cancelling 10 of 30 desk licenses in month eight gets a reduction for four months, plus a fee if the contract requires it. Policy on refunds belongs to finance, so I check before activating the order.

- Amend and set quantities to zero
- Cancellation date = amendment start date
- Add a fee product if contract requires
- Clean up the renewal opportunity

<sub>Also asked as: early termination cpq contract · cancel subscription mid term salesforce cpq · reduce quantity to zero amendment · How do you handle a cancellation with a fee?</sub>

### On renewal, hardware maintenance must go to the current list price while software licenses get a 5% uplift. How would you configure that?
*Senior (7–10 yrs) · scenario* · `cpqx-051`

The renewal pricing method is set on the account, not per product, so I'd pick one as the base and handle the other with a price rule. I'd set the method to Uplift with a 5% rate for the software licenses. Then a price rule On Calculate with conditions 'quote type equals Renewal' and 'product family equals Hardware Maintenance', which resets those lines to the current list price from the price book, for example by writing the list price into the special price. For example, a data-centre client renewing 200 licenses and 40 maintenance plans would see licenses at last year's price plus 5% and maintenance at today's list. I'd test it on a renewal and an amendment to make sure the rule only fires on renewals, and document it, because someone will ask why the setting says Uplift.

- Pricing method is account level, not per product
- Base: Uplift 5%
- Price rule for Renewal + product family resets to list
- Test renewals vs amendments

<sub>Also asked as: different renewal pricing by product cpq · mixed renewal pricing method · uplift for some products list for others renewal · price rule only on renewal quotes</sub>

### The business wants renewal opportunities created automatically 120 days before a contract ends, and renewal quotes 90 days before. How do you set that up?
*Mid (3–6 yrs) · scenario* · `cpqx-052`

I'd drive CPQ's two renewal checkboxes from a scheduled flow. Renewal Forecast on the contract creates the renewal opportunity, and Renewal Quoted creates the renewal quote. A daily scheduled flow finds activated contracts where the end date is 120 days away and Renewal Forecast is false, and sets it to true. A second path finds contracts 90 days out with Renewal Quoted false and sets that. For example, a facilities company with 2,000 maintenance contracts gets renewal opportunities for every contract ending in August by mid-April, and quotes by May. Some teams prefer setting Renewal Forecast right when the contract is created, so the full future pipeline is visible. I keep batch sizes small, because renewal quote creation is heavy, and I monitor failures.

- Renewal Forecast -> opportunity; Renewal Quoted -> quote
- Scheduled flow on contract end date
- Option: set forecast at contract creation
- Watch volume and failures

<sub>Also asked as: automate renewal forecast and renewal quoted · scheduled flow for cpq renewals · auto create renewal quote before contract end date · How do you make sure renewals are never missed?</sub>

### Quotes must expire 30 days after they are created, and expired quotes should not be sent. How would you set it up?
*Fresher (0–2 yrs) · scenario* · `cpqx-053`

I'd default the expiration date and then stop actions on expired quotes. CPQ quotes have an Expiration Date field; I'd set the Default Quote Validity (Days) package setting to 30, which stamps created date plus 30, or use a before-save flow if it varies. Then a scheduled flow runs daily and sets open quotes past their expiration date to an Expired status value I add to the picklist. To stop sending, I add a validation rule or hide the Generate Document button when the status is Expired, and the quote template can show the expiry date clearly. For example, a solar installer's quote created on 1 March shows 'valid until 31 March', and on 1 April the rep has to clone it and reprice, which picks up any new list prices.

- Default Expiration Date = created + 30 days
- Scheduled flow sets status to Expired
- Block document generation for expired quotes
- Clone and reprice to refresh

<sub>Also asked as: quote expiration date default cpq · stop sending expired quotes · quote validity 30 days salesforce cpq · auto expire quotes</sub>

### Reps in each country should only see the products sold in that country. How would you design it?
*Mid (3–6 yrs) · scenario* · `cpqx-054`

The cleanest option is a price book per country or region, because CPQ only shows products with an active entry in the quote's price book. The quote gets the right price book from the opportunity, which I default by account country, with a validation that stops reps switching to the wrong one. That also gives local prices and currency for free. If the catalog differences are small and the company wants one price book, I'd use a filter product rule or guided selling with a Country input, and a field on the product that lists where it's sold. For example, a kitchen appliance maker hides 110-volt models from UK reps. I avoid sharing rules on products for this, because they're harder to maintain and don't help pricing.

- Price book per region controls the catalog
- Default price book from account country
- Alternative: filter rule or guided selling on a country field
- Avoid product sharing for this

<sub>Also asked as: region specific product catalog cpq · limit products by country on quote · different products for different markets salesforce cpq · filter product search by region</sub>

### Leadership has decided to give every customer 5 extra licenses for the rest of their term, across 300 active contracts. How would you automate the amendments?
*Senior (7–10 yrs) · scenario* · `cpqx-055`

I'd use the CPQ Contract Amender API in a batch job with a scope of one contract per execution, because each amendment builds a full quote and recalculates. In execute, the amender returns the amendment quote as JSON; I deserialize it, add 5 to the quantity of the license lines, and send it to the calculator with a callback that saves it. Then the normal ordering and contracting runs, either automatically or after a review. Before running all 300, I test with a handful, check the prorated amounts and the delta lines, and agree with finance whether the extra licenses are free, in which case I zero the price on the delta through a price rule triggered by a flag on the quote. I also log every contract's result so failures can be rerun.

- ContractAmender API: SBQQ.ContractManipulationAPI.ContractAmender
- Batch with scope 1; calculate with callback
- Pilot on a few contracts first
- Log results; agree pricing with finance

```java
public with sharing class BulkAmendBatch implements Database.Batchable<SObject> {
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator(
            [SELECT Id FROM Contract WHERE Status = 'Activated' AND Bulk_Amend__c = true]);
    }
    public void execute(Database.BatchableContext bc, List<Contract> scope) {
        String quoteJson = SBQQ.ServiceRouter.load(
            'SBQQ.ContractManipulationAPI.ContractAmender', scope[0].Id, null);
        QuoteModel quote = (QuoteModel) JSON.deserialize(quoteJson, QuoteModel.class);
        for (QuoteLineModel line : quote.lineItems) {
            if (line.record.SBQQ__ProductFamily__c == 'Licenses') {
                line.record.SBQQ__Quantity__c += 5;
            }
        }
        CpqQuoteService.calculateAndSave(quote);   // calculator + save callback
    }
    public void finish(Database.BatchableContext bc) {}
}
// Database.executeBatch(new BulkAmendBatch(), 1);
```

<sub>Also asked as: bulk amend contracts in cpq · contract amender api batch · mass amendment salesforce cpq apex · How to amend many contracts at once?</sub>

### If the hardware total on a quote is over 100,000, services should get a 5% discount. How would you build it?
*Mid (3–6 yrs) · scenario* · `cpqx-056`

This needs a summary variable plus a price rule, because one line's price depends on other lines. The summary variable sums list total on quote lines where product family is Hardware. The price rule runs On Calculate with two conditions, all must match: the summary variable is at least 100,000, and the line's product family is Services. The action sets the services line's additional discount to 5. For example, a 120,000 server order with 15,000 of installation gives 750 off installation, and if the rep drops a server and hardware falls to 95,000, the discount disappears on the next calculate. I sum list total rather than net total to avoid a loop where the discount changes the total that triggers it, and I tell reps the field is controlled by the rule, since manual edits get overwritten.

- Summary variable: SUM of hardware list total
- Price rule: variable >= 100000 AND family = Services
- Action: set discount to 5
- Use list total to avoid circular logic

```java
Summary Variable: Hardware List Total
  Target Object: Quote Line   Function: Sum
  Aggregate Field: SBQQ__ListTotal__c
  Filter: SBQQ__ProductFamily__c equals Hardware

Price Rule: Services discount on big hardware deals
  Evaluation Event: On Calculate   Conditions Met: All
  Condition 1: Tested Variable Hardware List Total >= 100000
  Condition 2: Quote Line SBQQ__ProductFamily__c equals Services
  Price Action: Target Field SBQQ__Discount__c   Value 5
```

<sub>Also asked as: price rule using summary variable example · discount services when hardware total is high · cross line pricing rule in cpq · summary variable and price rule together</sub>

### Your manager wants a list of primary quotes where any line has more than 20% additional discount and the quote is not yet approved. Write the SOQL.
*Fresher (0–2 yrs) · code* · `cpqx-057`

I query from the quote line, since that's where the discount lives, and filter on the parent quote through the relationship. SBQQ__Discount__c is the rep's additional discount percent, so the first query lists the offending lines with their quote and product. The second groups by quote to give one row per quote with its highest discount, which is better for a dashboard or a follow-up email. For example, a sales director at a medical devices company can see that quote Q-1042 has a 32% line on the imaging bundle. One caution I'd mention: additional discount doesn't include discount schedule or partner discounts, so if the business means total discount, I'd query a formula field that combines them.

- Query quote lines, filter on SBQQ__Quote__r fields
- GROUP BY quote for one row per quote
- SBQQ__Discount__c is only the additional discount

```java
SELECT SBQQ__Quote__r.Name, SBQQ__Quote__r.SBQQ__Status__c,
       SBQQ__Product__r.Name, SBQQ__Discount__c, SBQQ__NetTotal__c
FROM SBQQ__QuoteLine__c
WHERE SBQQ__Discount__c > 20
  AND SBQQ__Quote__r.SBQQ__Primary__c = true
  AND SBQQ__Quote__r.SBQQ__Status__c != 'Approved'
ORDER BY SBQQ__Discount__c DESC
LIMIT 200

SELECT SBQQ__Quote__c, MAX(SBQQ__Discount__c) maxDiscount
FROM SBQQ__QuoteLine__c
WHERE SBQQ__Discount__c > 20 AND SBQQ__Quote__r.SBQQ__Primary__c = true
GROUP BY SBQQ__Quote__c
```

<sub>Also asked as: soql for high discount quote lines cpq · query sbqq quote lines with discount over 20 · find quotes pending approval with big discounts · aggregate max discount per quote soql</sub>

### A rep says the opportunity amount does not match the quote. What do you check?
*Fresher (0–2 yrs) · troubleshooting* · `cpqx-058`

First I check that the quote is actually the primary quote, because only the primary one syncs. Then I check whether the quote was saved after the last change; a rep who only clicked Calculate hasn't saved anything. On big quotes the calculation and sync can finish a little later, so I refresh after a moment. Next I look for someone editing opportunity products directly, or a flow or trigger on opportunity products that changes prices after the sync. I also compare currencies and price books between the quote and opportunity. Finally I check for errors in debug logs, such as a validation rule on Opportunity Product blocking the sync. For example, at a training company a new validation rule requiring a 'Delivery Date' on opportunity products silently stopped quote lines from syncing.

- Is it the primary quote, and was it saved?
- Large quotes may sync after a delay
- Manual edits or automation on opportunity products
- Validation rules blocking sync

<sub>Also asked as: cpq quote not syncing to opportunity · opportunity products different from quote lines · opportunity amount wrong after quote change · primary quote sync not working</sub>

### A validation product rule fires as soon as the rep opens the quote, before they have done anything, and reps are annoyed. How do you fix it?
*Mid (3–6 yrs) · troubleshooting* · `cpqx-059`

That's an evaluation event problem. Product rules have an evaluation event of Load, Edit, Save or Always, and a rule on Load or Always runs when the editor opens, even on a half-built quote. For a check like 'quotes with hardware must include support', Save is usually right: the rep builds the quote freely and gets the message only when saving. I also check the conditions, because sometimes the rule is right to fire but the condition is too broad, like testing a field that's blank on new quotes. And I check the scope: Quote-scope rules run in the line editor, Product-scope ones in the configurator. For example, a medical supplies company had a minimum-order validation on Always, so reps saw an error before adding the first product. Moving it to Save fixed it.

- Evaluation events: Load, Edit, Save, Always
- Save is usually right for completeness checks
- Tighten conditions that match blank values
- Scope: Quote vs Product

<sub>Also asked as: cpq product rule firing on load · evaluation event for product rules · validation message appears too early in qle · When does a product rule run in CPQ?</sub>

### A customer negotiated a special price on a product, and it must apply automatically on all their future quotes. How would you do it?
*Mid (3–6 yrs) · scenario* · `cpqx-060`

I'd use contracted prices, ideally generated from the deal itself. When the deal closes, the Generate Contracted Price field on the relevant lines is set to Price, so when the quote is contracted, CPQ creates a Contracted Price record on the account with that net price. Every future quote for that account and product starts from it at the special price stage. If they negotiated a volume curve instead of one price, the Discount Schedule option keeps their schedule instead. For one-off cases, an admin can also add a contracted price on the account by hand, with start and end dates. For example, a construction firm negotiates 42 per safety helmet: after contracting, every new helmet quote shows 42. Watch out for duplicate contracted prices for the same product, because you can't control which one wins.

- Generate Contracted Price: Price or Discount Schedule
- Created on the account when the quote is contracted
- Manual contracted prices with dates also possible
- Avoid duplicates for the same product

<sub>Also asked as: account specific pricing that carries forward cpq · generate contracted price from quote · negotiated price for one customer in salesforce cpq · How do contracted prices get created automatically?</sub>

### The business wants a custom field from the quote line, like Delivery Date, to show in the line items table of the quote PDF. How do you add it?
*Fresher (0–2 yrs) · scenario* · `cpqx-061`

I add a line column to the template's line items section. On the quote template, the line items content is built from Line Column records, each pointing to a quote line field with a heading, width and alignment. So I create a new Line Column for Delivery Date, set the display order so it sits after Quantity, and preview the document. If it should only show on some quotes, line columns can use a conditional field so they hide when not needed. For example, a furniture supplier wants Delivery Date next to each desk and chair so the customer can plan the office move. I also check the field is populated before generation, and if it comes from the product, I'd use a twin field so it lands on the quote line.

- Line Column records drive the line items table
- Set field, heading, width and order
- Optional conditional display
- Make sure the field is populated

<sub>Also asked as: add column to cpq quote template line items · show custom quote line field on quote document · line columns in quote template · How do I change the table in the CPQ PDF?</sub>

### You created a custom field on quote line and order product with the same name, but the value is not copying to the order. What do you check?
*Mid (3–6 yrs) · troubleshooting* · `cpqx-062`

I check the twin field rules one by one. The API names must match exactly, including the __c part, and the data types must be the same. The field on the target object has to be writable by the user running the process, so field-level security doesn't block it. Formula fields can't be targets. Then I check timing: twin fields copy at a specific moment, like quote line to order product when the order is created, so if the value is set on the quote line after ordering, it won't flow. Finally I check automation on the order product that might clear it. For example, a logistics company's Pickup Location field didn't reach orders because it was read-only for the integration user who created the orders.

- Exact API name and same data type
- Target must be editable and not a formula
- Copied at a specific moment (e.g. order creation)
- Automation overwriting it

<sub>Also asked as: twin field not working cpq · quote line field not mapping to order product · custom field value missing on subscription · Why are twin fields not syncing?</sub>

### A new prospect wants to buy Salesforce CPQ for their quoting project. What do you tell them?
*Senior (7–10 yrs) · design* · `cpqx-063`

I'd tell them that Salesforce CPQ is end of sale, so new customers can't buy it, and the product to evaluate is Revenue Cloud Advanced. Existing CPQ customers keep support and can renew, but new features go into Revenue Cloud Advanced. For a new project that's actually good news: it's native to the platform on standard objects like Quote and Order, it uses an asset-based lifecycle, pricing procedures and a newer configurator, and it connects to fulfillment and billing. I'd then run a normal discovery: products and bundles, pricing complexity, approvals, documents, amendments, renewals and billing needs. For example, a SaaS company that sells usage-based add-ons would get more from RCA's usage features than from CPQ. I'd make sure they get a partner with RCA delivery experience, not only CPQ.

- CPQ is end of sale: not available to new customers
- Evaluate Revenue Cloud Advanced instead
- Run discovery on catalog, pricing, lifecycle, billing
- Choose a partner with RCA experience

<sub>Also asked as: Can a new customer still buy Salesforce CPQ? · should a new implementation use cpq or revenue cloud advanced · customer asking for steelbrick cpq today · is cpq available for new customers</sub>

### A company wants to put new business on Revenue Cloud Advanced while existing CPQ contracts keep running until renewal. How would you design that transition?
*Senior (7–10 yrs) · design* · `cpqx-064`

I'd design a bridge period with clear rules about which system owns which deal. New logos and new products go to Revenue Cloud Advanced. Existing CPQ contracts stay in CPQ for amendments until their renewal, and at renewal the customer's active subscriptions are converted into RCA assets, so the renewal happens in RCA. The hard parts are the edges: reps need one clear entry point so they don't quote the same customer in both, reporting needs a combined view of bookings and ARR, and billing must handle both sources. For example, a software vendor with 4,000 contracts would move roughly a twelfth each month as renewals come up. I'd pilot with one region first, freeze major CPQ changes, and track conversion quality on every migrated asset.

- New business on RCA; existing contracts migrate at renewal
- Convert subscriptions to RCA assets
- One entry point, combined reporting, billing for both
- Pilot one region; freeze big CPQ changes

<sub>Also asked as: bridge approach cpq to rca · run cpq and revenue cloud side by side · move customers to RCA at renewal · phased migration from salesforce cpq</sub>

### As the CPQ lead, how would you model a ramped three-year deal with MDQ, and what tends to break when those MDQ lines are amended later?
*Senior (7–10 yrs) · scenario* · `cpqx-065`

I'd model the ramp as one MDQ product with a Year price dimension, so a 3-year deal shows 100, 200 and 300 seats with their own prices, and each segment becomes its own subscription. The breakage shows up later. On an amendment in month 18, segments that already ended are hidden, Year 2 is prorated from the amendment date, and Year 3 changes separately, so reps often change the wrong column. Price rules have to work per segment, templates need the segmented table, and renewals of segmented lines must be tested. As lead, I'd first confirm ramps are a standard offer, not a one-off, because one-offs are simpler as separate lines. Then I'd build a regression pack: new ramp, mid-term amendment, add a year, renew, and run it after every rule change.

- One MDQ product, Year dimension, one subscription per segment
- Amendments: ended segments hidden, current segment prorated
- Rules, templates and renewals must handle segments
- Lead: justify MDQ, keep a regression pack of ramp scenarios

<sub>Also asked as: MDQ amendment issues in salesforce cpq · what happens when you amend a segmented quote line · ramp deal year 1 year 2 year 3 and then customer amends · risks of mdq with amendments and renewals</sub>

### A customer amends mid-term after the list price has gone up and expects to keep their original discount. How do you handle co-terming, proration and pricing?
*Senior (7–10 yrs) · scenario* · `cpqx-066`

First I separate existing products from new ones. When the customer adds quantity to a product they already have, CPQ prices the extra units off the original subscription, so the old price and discount carry over, prorated from the amendment date to the contract end. New products on the amendment get today's price book price, so a list increase hits those. If the contract promises the original discount on new items, I'd give the account contracted prices, or a price rule that runs only when quote type is Amendment and applies the agreed discount. The real risk is the opposite: a general price rule or plugin that reprices every line on amendment quotes and quietly removes the original discount. As lead, I'd check every rule for a quote-type guard, add an amendment-after-price-change case to the regression pack, and confirm the policy with finance.

- Existing lines keep original pricing; delta prorated to end date
- New products use the current price book
- Contracted prices or Amendment-only price rule to honour discounts
- Guard rules by quote type; regression test it

<sub>Also asked as: keep original price on amendment after price increase · amendment pricing uses new list price cpq · customer wants same discount on add-on licenses · co-term and proration on cpq amendment with price change</sub>

### As the CPQ lead, an 800-line quote takes minutes to calculate. How do you run the fix and prove it worked?
*Senior (7–10 yrs) · scenario* · `cpqx-067`

I treat it like a performance project with a baseline. I pick three real large quotes, copy them into a full sandbox, and record load, calculate and save times plus the debug log hotspots. Then I change one thing at a time and re-measure. First the cheap wins: trim the line editor field set, remove heavy cross-object formula fields on quote line, give each price rule one evaluation event, merge similar rules into a lookup-table rule, and deactivate dead ones. Next the plugin: no queries in loops, skip work when nothing relevant changed. Then triggers and flows on quote line. Last, the large quote settings, threshold, batch size and the large quote experience, and I train reps that background calculation means totals update after a moment. I share a before-and-after table, with illustrative numbers like 4 minutes down to 50 seconds, and keep those quotes as a performance regression test.

- Baseline on real quotes in a full sandbox
- One change at a time, re-measure
- Field sets, formulas, rules, QCP, triggers, then large quote settings
- Publish before/after; keep as regression test

<sub>Also asked as: speed up very large cpq quote · measure cpq calculation time before and after · large quote mode and async calculation strategy · 800 line quote performance plan</sub>

### How do you move CPQ configuration, like products, rules and templates, from a sandbox to production safely?
*Senior (7–10 yrs) · scenario* · `cpqx-069`

The key point is that CPQ configuration is data, not metadata, so change sets alone won't move it. I deploy in two layers. First metadata: custom fields, field sets, page layouts, flows and Apex, through the normal pipeline. Then data: products, options, features, constraints, product and price rules with their conditions and actions, summary variables, lookup tables, templates and the plugin's Custom Script record. I use a data deployment tool that understands CPQ relationships, with external IDs on every config object so records upsert instead of duplicating and parent-child links resolve. As the lead, I also keep a regression pack of test quotes, like a basic bundle, a big discount needing approval, an amendment and a renewal, and compare their totals before and after each release. That pack catches most broken rules before reps do.

- Config is data: metadata first, then config data
- Data deployment tool + external IDs on config objects
- Plugin code lives on the Custom Script record
- Regression pack of test quotes before/after

<sub>Also asked as: deploy cpq config between orgs · cpq configuration is data not metadata deployment · how to migrate price rules to production · release management for salesforce cpq</sub>

### You inherit a messy CPQ org as the new lead. What do you do in the first 60 days?
*Senior (7–10 yrs) · design* · `cpqx-070`

I split it into understand, protect, then improve. Weeks one to three: inventory everything, meaning active products, bundles, product and price rules, summary variables, lookup tables, plugin code, templates, approvals, triggers and flows on CPQ objects, and talk to reps, deal desk and finance about their pain points. Weeks three to five: build a regression baseline, roughly twenty real quotes covering new, amendment and renewal, with expected totals, so I can change things without fear. Weeks five to eight: consolidate the safe wins, like dead rules, duplicate rules that become one lookup-table rule, unused fields in field sets, and set up a proper release process with external IDs. Throughout, I coach the team on why CPQ config is data and how to test it. For example, finding forty price rules that only five quotes ever trigger is common.

- Inventory config and listen to users
- Regression baseline of real quotes
- Consolidate rules, remove dead config, fix release process
- Coach the team on testing and data-as-config

<sub>Also asked as: first 60 days plan cpq lead · how do you clean up a cpq org with technical debt · taking over a badly built salesforce cpq implementation · cpq org health check approach</sub>
