# CPQ, Revenue Cloud and OmniStudio

85 questions. Levels: Fresher (0–2 yrs) 28 · Mid (3–6 yrs) 35 · Senior (7–10 yrs) 22

## Salesforce CPQ

### What is Salesforce CPQ and what is its current status?
*Fresher (0–2 yrs) · concept* · `cpq-001`

Salesforce CPQ stands for Configure, Price, Quote. It started as the Steelbrick product, and it's a managed package with the SBQQ namespace. Say a rep at a packaging manufacturer is working an opportunity for custom printed boxes. In CPQ they pick a bundle, configure the options, the pricing and discounts get applied, and they generate the quote document straight from the opportunity. On status, the key point is that CPQ is end of sale, not end of life. New customers can't buy it, but existing customers keep support, can renew and add users, and still get critical fixes. They just won't get major new features. The strategic successor is Revenue Cloud Advanced, part of Salesforce Revenue Cloud. It's also been branded Agentforce Revenue Management, and it started out as Revenue Lifecycle Management. So I'd say CPQ skills are still very relevant because so many orgs run it, but new implementations are increasingly going to Revenue Cloud Advanced.

- Managed package, namespace SBQQ (from the Steelbrick acquisition)
- End of sale, not end of life: existing customers stay supported
- Maintenance mode: no major new feature development
- Successor: Revenue Cloud Advanced (Revenue Cloud, also branded Agentforce Revenue Management)

<sub>Also asked as: Is Salesforce CPQ being retired? · Is CPQ end of life or end of sale? · what is sales force c p q and is it still supported · What replaced Salesforce CPQ?</sub>

### What is a product bundle in Salesforce CPQ, and what are features and options?
*Fresher (0–2 yrs) · concept* · `cpq-002`

A bundle is a parent product that groups other products so the rep configures them together. Say we sell a 'Retail Packaging Service' bundle. The parent product has its Configuration Type set to Required or Allowed, and that's what makes the configurator open. Inside it, Product Features are the categories, like Box Type, Printing and Kitting. A feature controls the layout and the minimum and maximum number of options the rep can pick, so I might say pick exactly one box type. Product Options are the links from the bundle to the actual child products, like a 'Two-colour print' product. Each option holds settings such as default quantity, whether it's selected by default, whether it's required, or whether it's bundled at zero price. The way I remember it: bundle product on top, features grouping the options, and options pointing at the real products.

- Bundle = parent product with Configuration Type Required or Allowed
- Feature = grouping/category with min and max option counts
- Option = junction from bundle to a child product with quantity and selection settings

<sub>Also asked as: Explain bundles, features and options in CPQ · How do you set up a bundle product in CPQ? · what is product feature versus product option in cpq · How is a CPQ bundle structured?</sub>

### On a CPQ product option, what is the difference between Selected, Required and Bundled, and what does Option Type do?
*Fresher (0–2 yrs) · concept* · `cpq-003`

Selected means the option is ticked by default but the rep can remove it. Required means it's selected and can't be removed, so that's how you make an option mandatory. Bundled means it's included in the parent's price, so the line shows a zero price and the quantity is normally locked. Option Type is about quantity. With Component, the option quantity is multiplied by the bundle quantity. With Accessory and Related Product, the quantity stays independent of the parent. For example, say a packaging bundle includes one pallet wrap per unit as a Component. If the rep quotes two bundles, they get two pallet wraps automatically. But if artwork setup is an Accessory with quantity one, it stays at one whether they quote two bundles or ten. Getting these settings right up front saves you a lot of product rules later.

- Selected = default on, removable
- Required = always on, cannot be removed
- Bundled = price included in parent, shows as zero
- Component quantity multiplies with bundle quantity; Accessory does not

<sub>Also asked as: Required vs Selected vs Bundled checkbox on product option · What do Component, Accessory and Related Product option types mean? · how do you make an option mandatory in a cpq bundle · Why does a bundled option show zero price?</sub>

### What are option constraints in CPQ and when would you use them instead of product rules?
*Mid (3–6 yrs) · concept* · `cpq-004`

Option constraints are the simple, no-rule way to control which options can be picked together inside one bundle. You create an Option Constraint record that links a constrained option to a constraining option, and you pick a type. Dependent means the constrained option can only be selected after the constraining option is selected. Exclusive means the two can't be selected together. Take a packaging bundle. Foil stamping might be dependent on premium printing, so the rep can't pick foil until premium print is chosen. Single-wall box and double-wall box would be exclusive, because you'd only ever pick one. The catch is that constraints only work inside the same bundle configuration. If I need logic across bundles, conditions on quote-level values, or products added automatically, I move to product rules.

- Dependent: option B requires option A
- Exclusive: options A and B cannot be selected together
- Only within the same bundle; use product rules for anything wider

<sub>Also asked as: Explain dependent and exclusive option constraints · How do you stop two options being selected together in a bundle? · option constraint vs product rule cpq · What is an exclusive constraint in Salesforce CPQ?</sub>

### What are the types of product rules in Salesforce CPQ?
*Fresher (0–2 yrs) · concept* · `cpq-005`

There are four product rule types. Validation rules block the user with an error until the configuration or quote is fixed. Alert rules show a warning but let them carry on. Selection rules automatically add, remove, show, hide, enable or disable options or products. Filter rules dynamically filter the product list used in option search. In a packaging setup I'd use them like this: a validation rule that stops a pallet shipping bundle being saved without at least one wrapping option, an alert that warns the rep about a rush lead time, a selection rule that auto-adds corner protectors, and a filter rule that only shows lids that fit the chosen box size. Each rule also has a scope, Product for the configurator or Quote for the line editor, an evaluation event like Load, Edit, Save or Always, error conditions that decide when it fires, and actions where needed.

- Validation = hard stop; Alert = warning only
- Selection = add/remove/show/hide/enable/disable
- Filter = dynamic product search filter
- Scope: Product (configurator) or Quote; events: Load, Edit, Save, Always

<sub>Also asked as: Explain validation, alert, selection and filter product rules · What product rule types are there in CPQ? · difference between validation rule and alert rule in cpq · What is a selection rule in CPQ?</sub>

### What is the difference between a product rule and a price rule in CPQ?
*Fresher (0–2 yrs) · comparison* · `cpq-006`

Product rules control what's selected or allowed, and price rules control the numbers. A product rule validates, alerts, auto-selects or filters products and options, so it's about the configuration being correct. A price rule changes field values on the quote line or the quote during calculation, like setting a discount, a special price or a custom field. I usually tell them apart from how the requirement is worded. If a packaging client says 'the shrink-wrap service must include pallets' or 'can't be sold with the eco box', that's a product rule. If they say 'the discount should be 5% when they order kitting with printing', that's a price rule. Both use conditions, both can use summary variables and lookup tables, and both have an evaluation order.

- Product rule = configuration (what can be sold together)
- Price rule = values (prices, discounts, fields) during calculation
- Both support summary variables, lookup tables and evaluation order

<sub>Also asked as: Product rule vs price rule · When do you use a price rule instead of a product rule? · price rules versus product rules in salesforce cpq · Which CPQ rule changes the price and which controls configuration?</sub>

### What are the components of a price rule in CPQ?
*Mid (3–6 yrs) · concept* · `cpq-007`

A price rule has three parts. First, Price Conditions decide when it fires. Each one compares a tested field, variable or formula against a value, and Conditions Met can be All, Any or Custom logic. Second, Price Actions decide what happens. Each writes a value into a target field on the quote line or quote, and that value can come from a static value, a field, a formula, a summary variable or a lookup table. Third, the rule settings: the Calculator Evaluation Event, which is On Initialization, Before Calculate, On Calculate or After Calculate, plus the Evaluation Order, the target object, and the Evaluation Scope, which is either the calculator or the configurator. For example, a rule might check that the product family is Packaging Services and quantity is at least 10,000, then write a discount into the line. One tip: I keep each rule to a single evaluation event for performance.

- Conditions: tested field/variable/formula, Conditions Met All/Any/Custom
- Actions: target field, value from static, field, formula, variable or lookup
- Evaluation event, evaluation order, scope (calculator or configurator)

<sub>Also asked as: Explain price conditions and price actions · How do you build a price rule in Salesforce CPQ? · what is price condition and price action · What does evaluation scope mean on a price rule?</sub>

### Can you explain the CPQ quote calculation sequence and where price rules run?
*Senior (7–10 yrs) · concept* · `cpq-008`

CPQ runs a fixed sequence every time it calculates. First it loads data from related records like products and costs. Then it runs On Initialization price rules and evaluates formula fields on lines, the quote and groups. Next come Before Calculate rules, then quantity calculation, like bundle component quantities, then On Calculate rules. After that CPQ applies its built-in pricing, like block prices, discount schedules and the price waterfall. Then After Calculate rules run, formula fields are re-evaluated, and finally group and quote totals are calculated. Inside one event, rules run by Evaluation Order and actions by their Order field, and CPQ tests all the conditions in an event before running any actions. Here's why it matters. Say a packaging quote has a rule that needs the volume discount result. On Calculate is too early, because discount schedules haven't applied yet, so I'd put it After Calculate. If there's a Quote Calculator Plugin, its hooks run at defined points around these stages.

- Initialization rules -> formulas -> Before Calculate -> quantities -> On Calculate
- Then built-in pricing (block, discount schedules) -> After Calculate -> formulas -> totals
- Priority: event, then rule evaluation order, then action order
- All conditions in an event are tested before any action runs

<sub>Also asked as: What is the order of calculation in Salesforce CPQ? · When does On Initialization vs On Calculate vs After Calculate run? · explain cpq calculation sequence evaluation events · In what order does CPQ evaluate formula fields and price rules?</sub>

### What are lookup tables in CPQ price rules and why use them?
*Mid (3–6 yrs) · concept* · `cpq-009`

A lookup table lets a price rule pull values from a custom object instead of hard-coding them across lots of rules. Say a packaging manufacturer gives different discounts by region, product family and order size. I'd create a custom object, like a regional discount matrix, with fields such as Region, Product Family, Minimum Quantity and Discount. On the price rule I set the Lookup Object, then add Lookup Queries that match quote or line fields to the lookup fields, using operators like equals or less than. The price action then uses a source lookup field to write the matched value into the target field. So a West region quote for 20,000 corrugated boxes finds its row and gets that row's discount. The big win is maintenance. When the business changes a rate, they update a row in the table instead of asking an admin to create a new rule for every combination.

- Custom object holds the matrix of values
- Lookup Queries match quote/line fields to table fields
- Price action writes from the matched row's field
- Business maintains data rows instead of rules

<sub>Also asked as: How does a lookup object work with price rules? · What is a lookup query in CPQ? · how to avoid creating hundreds of price rules in cpq · Explain price rule with lookup table</sub>

### What is a summary variable in Salesforce CPQ?
*Mid (3–6 yrs) · concept* · `cpq-010`

A summary variable aggregates values across quote lines so a rule can decide something at the quote level. You pick the target object, usually Quote Line, an aggregate function like Sum, Average, Min, Max or Count, the field to aggregate, and filters like Product Family equals Hardware. Then a price condition, a product rule error condition or a price action can use it. For example, a packaging company might sum the quantity of every line where the product family is Corrugated Boxes. Once that total crosses a threshold, a price rule gives an extra discount. Or a validation rule could require a quality inspection service when the total gets high enough. You can also combine two variables with a composite operator, like a boxes total minus a services total.

- Aggregates: Sum, Average, Min, Max, Count with filters
- Usable in price conditions, price actions and product rule conditions
- Composite operators combine variables

<sub>Also asked as: How do summary variables work in CPQ? · How can a rule check the total quantity across all quote lines? · summary variable cpq example · What aggregate functions can summary variables use?</sub>

### Explain the CPQ pricing waterfall.
*Fresher (0–2 yrs) · concept* · `cpq-011`

The price waterfall is the order CPQ goes through from the starting price to the final price on a quote line. It starts with Original Price from the price book, then List Price. Special Price applies things like contracted prices, option pricing or price rule overrides. Prorated Price adjusts subscription products for the quote's term. Regular Price applies volume discounts like discount schedules. Customer Price applies the rep's additional discount. Partner Price applies the partner discount, and Net Price applies the distributor discount. Then Net Price times quantity gives the Net Total. So say a sales manager asks why a packaging customer's carton price is so far below list. I walk down the waterfall with them: a contracted price set the Special Price, the volume tier set the Regular Price, and the rep's own discount sits in Customer Price. That's how I explain where every number came from.

- Original -> List -> Special -> Prorated -> Regular
- Regular -> Customer (additional discount) -> Partner -> Net
- Net Total = Net Price x Quantity

<sub>Also asked as: What is list price, special price, regular price, customer price, partner price and net price? · How does CPQ go from list price to net price? · explain price waterfall in salesforce cpq · In what order are discounts applied in CPQ?</sub>

### What is a discount schedule in CPQ, and what is the difference between slab and range?
*Fresher (0–2 yrs) · comparison* · `cpq-012`

A discount schedule gives volume or term-based discounts through tiers, and the type decides how the tiers apply. Say we quote pallet-packing services with two tiers: 0% up to 100 units and 10% above that. With Range, the whole quantity gets the discount of the tier it lands in, so if the customer orders 150, all 150 units get 10%. With Slab, each portion gets its own tier's rate, so the first 100 get 0% and the next 50 get 10%, and you end up with a blended price. Range is easier to explain to a customer. Slab avoids the cliff where ordering just one more unit suddenly drops the total. I'd also mention that schedules can be attached to the product, to a contracted price, or be term-based for subscriptions.

- Range: entire quantity gets the matching tier's discount
- Slab: each quantity band gets its own tier rate
- Tier lower bound is inclusive, upper bound exclusive
- Can be product-level, contracted-price-level or term-based

<sub>Also asked as: Slab vs range discount schedule · How do volume discounts work in Salesforce CPQ? · what is slab pricing in cpq · Explain discount tiers in a CPQ discount schedule</sub>

### What is block pricing in Salesforce CPQ?
*Fresher (0–2 yrs) · concept* · `cpq-013`

Block pricing charges a flat price for a quantity range instead of a per-unit price. You set the product's pricing method to Block and create Block Price records with a lower bound, upper bound and price. Say a packaging firm sells a monthly kitting service in bands: one fixed amount for 1 to 10 pallets and another for 11 to 25. If the customer needs 7 pallets, the line total is the 1-to-10 block price, not unit price times 7. If you add a custom OverageRate field to the Block Price object, the highest block can also charge a per-unit rate for quantities above it, so anything past 25 pallets is billed per unit. It suits packaged offerings like user packs or storage tiers, where the customer buys a band rather than an exact count.

- Pricing Method = Block, with Block Price records
- Line total = block price, not unit price x quantity
- Custom OverageRate field charges per unit above the last block

<sub>Also asked as: How does block pricing work? · When would you use block pricing instead of per-unit pricing? · block price cpq example · How do you charge a flat price for a range of quantity in CPQ?</sub>

### What is cost-plus markup pricing in CPQ?
*Mid (3–6 yrs) · concept* · `cpq-014`

Cost-plus markup prices a product from its cost instead of a fixed list price. I set the product's pricing method to Cost and create a Cost record with the unit cost. On the quote line, CPQ applies a markup, either a percentage or an amount, so the price is cost plus markup. Reps can adjust the markup if it's editable, or you can lock it. A good example is a packaging manufacturer reselling stretch film. The film cost moves every quarter, so instead of chasing a list price they store the cost and add a markup on top. It's common for services, resale items or hardware, where cost changes often and margin matters more than a list price. You can still layer discounts on top, and I'd pair it with approvals, for example requiring approval when the markup drops below an agreed level.

- Pricing Method = Cost, with a Cost record
- Price = cost + markup (percent or amount)
- Pair with approvals on low markup or margin

<sub>Also asked as: How do you price a product from its cost in CPQ? · Explain the Cost pricing method · cost plus pricing salesforce cpq markup · How does markup work on a CPQ quote line?</sub>

### What are contracted prices in Salesforce CPQ?
*Mid (3–6 yrs) · concept* · `cpq-015`

Contracted prices are account-specific prices that override the normal price at the Special Price stage of the waterfall. A Contracted Price record sits on the account. It points to a product, or to a filter on product fields, and holds either a fixed price or a discount, with optional start and end dates and even its own discount schedule. You can create them by hand, or have them generated automatically when a contract is created, if the quote line or product is set to generate a contracted price. For example, say a food brand negotiates a fixed price for printed cartons for the year. Once that's a contracted price on their account, every new quote for that carton picks up the negotiated rate automatically. That's how we honour negotiated rates without building a separate price book for every customer.

- Lives on the account; product-based or filter-based
- Fixed price or discount, with effective dates
- Can be auto-generated on contracting
- Applied at Special Price stage

<sub>Also asked as: How do you give one customer a special negotiated price? · What is a Contracted Price record? · account specific pricing in cpq · How are contracted prices generated from a contract?</sub>

### What is the Quote Line Editor in CPQ?
*Fresher (0–2 yrs) · concept* · `cpq-016`

The Quote Line Editor, or QLE, is the main CPQ screen. It's where reps add products, configure bundles, change quantities and discounts, group lines and calculate the quote. It runs CPQ's pricing engine, so when you click Calculate or Save, price rules, discount schedules and the waterfall get applied. So a rep quoting a packaging job adds the box bundle, sets the quantity, enters their discount, hits Calculate and sees the tiered price straight away. Admins control the visible columns through the line editor field set on the quote line object. They can add custom buttons and actions, enable line groups and segments, and control editability with field-level security or the Quote Calculator Plugin's visibility and editability hooks. One practical point: most CPQ performance complaints show up in the QLE, so keeping those field sets lean really helps.

- Main UI for adding, configuring and pricing lines
- Columns controlled by the line editor field set
- Calculate/Save runs the pricing engine
- Lean field sets help performance

<sub>Also asked as: What is QLE in Salesforce CPQ? · How do you control which columns appear in the quote line editor? · explain the cpq line editor · Where do reps add products to a CPQ quote?</sub>

### What is the Quote Calculator Plugin in CPQ, and can you show an example?
*Senior (7–10 yrs) · code* · `cpq-017`

The Quote Calculator Plugin, or QCP, is JavaScript that hooks into CPQ's calculation when declarative price rules aren't enough. You store the code on a Custom Script record, list the quote and line fields it uses, and register it in CPQ package settings under Plugins. It exports functions like onInit, onBeforeCalculate, onBeforePriceRules, onAfterPriceRules and onAfterCalculate. They receive the quote model and line models and return a Promise. There are also isFieldVisible and isFieldEditable hooks for the line editor. Say a packaging quote needs a value worked out by looking at every line. In one of those hooks I'd loop the lines and read and write fields by API name on line.record. The gotcha is that it runs both in the browser and in CPQ's server-side calculator, so it can't touch the DOM. And I only use the conn object when a query is really needed.

- Stored on a Custom Script record, registered in package settings
- Hooks: onInit, onBeforeCalculate, onBeforePriceRules, onAfterPriceRules, onAfterCalculate
- Return a Promise; access fields by API name on .record
- List every field used in the script's quote/line field lists

```java
// Custom Script > Code. Add every field used to Quote Fields / Quote Line Fields.
export function onInit(quoteLineModels) {
  return Promise.resolve();
}

export function onAfterCalculate(quoteModel, quoteLineModels, conn) {
  var belowCost = false;
  quoteLineModels.forEach(function (line) {
    var net = line.record['SBQQ__NetPrice__c'] || 0;
    var cost = line.record['SBQQ__UnitCost__c'] || 0;
    line.record['Margin_Percent__c'] = net ? ((net - cost) / net) * 100 : 0;
    if (net && net < cost) { belowCost = true; }
  });
  quoteModel.record['Below_Cost__c'] = belowCost;
  return Promise.resolve();
}

// Line editor hook: lock discount on bundled lines, otherwise default behaviour
export function isFieldEditable(fieldName, line) {
  if (fieldName === 'SBQQ__Discount__c' && line.SBQQ__Bundled__c) {
    return false;
  }
  return null;
}
```

<sub>Also asked as: What is QCP in Salesforce CPQ? · Write a QCP that calculates margin on quote lines · how do you write javascript for the cpq calculator · What methods does the quote calculator plugin support?</sub>

### When would you use the Quote Calculator Plugin instead of price rules?
*Senior (7–10 yrs) · comparison* · `cpq-018`

I default to price rules, and only reach for QCP when the logic really can't be expressed declaratively. Price rules are admin-maintainable, visible in setup and easier to audit. QCP fits when I need loops across lines with complex math, logic that depends on other lines in ways summary variables can't handle, data from a query, or control over field visibility and editability in the line editor. For example, if a packaging manufacturer wants a tooling charge that depends on the exact mix of box sizes across all the lines, that's probably QCP territory. The trade-offs are real though. Admins can't easily read it, there's no built-in test framework like Apex has, only one plugin is active per org, and a bug can break every quote calculation. So I keep it small, version-control it, test with representative quotes, and document which logic lives where.

- Default: declarative price rules
- QCP: complex cross-line math, queries, field visibility/editability
- Risks: one plugin per org, harder to maintain, can break all calculations

<sub>Also asked as: QCP vs price rules, which is better? · Why not put all pricing logic in the QCP? · when is javascript plugin needed in cpq · What are the downsides of the quote calculator plugin?</sub>

### How do quote templates and document generation work in CPQ?
*Fresher (0–2 yrs) · concept* · `cpq-019`

A quote template defines the PDF or Word document CPQ generates from a quote. It's built from Template Content records, which can be HTML, Quote Terms, Line Items, or Custom using a Visualforce page, and you arrange those into Template Sections. Line Columns control which line fields print. A section can also be conditional through a Conditional Print Field. So for a packaging company, the warehousing services terms section only prints when there's a warehousing service on the quote. The rep clicks Preview or Generate Document, and CPQ creates a Quote Document record with the file. That can be emailed or sent for e-signature through integrations like DocuSign. And Additional Documents let you append static PDFs, like a box specification datasheet, at the end.

- Template -> Sections -> Content (HTML, Quote Terms, Line Items, Custom)
- Line Columns choose printed fields
- Conditional Print Field for optional sections
- Output saved as a Quote Document

<sub>Also asked as: How do you generate a quote PDF in Salesforce CPQ? · What are template sections and template content? · how to show a section only if certain products are on the quote · Explain CPQ quote template setup</sub>

### What is CPQ Advanced Approvals and how is it different from standard approval processes?
*Mid (3–6 yrs) · comparison* · `cpq-020`

Advanced Approvals is a separate managed package, with the sbaa namespace, that adds richer approval logic for CPQ quotes. You build Approval Rules with Approval Conditions, assign approvers, and organise the rules into Approval Chains for sequential or parallel paths. Approvers can be dynamic, like the rep's manager taken from a field. Two features I'd call out. Smart approvals: after a resubmission, only the approvals affected by the change are requested again. And approval variables, which aggregate line data like the maximum discount. Say a packaging quote needs finance and the plant manager to approve. If the rep only changes something that triggered the plant manager's rule, finance isn't asked again. Standard approval processes also work, but they're linear, need separate processes for different scenarios, and re-request every approval when the quote is resubmitted.

- Separate package: rules, conditions, approvers, chains, variables
- Parallel and sequential approvals, dynamic approvers
- Smart approvals avoid unnecessary re-approval

<sub>Also asked as: Advanced Approvals vs standard approvals · What are approval chains and smart approvals? · why use sbaa advanced approvals for cpq quotes · How do you set up approvals for discounts in CPQ?</sub>

### How do amendments work in Salesforce CPQ?
*Mid (3–6 yrs) · concept* · `cpq-021`

An amendment changes an active contract mid-term. Say a customer has a 12-month contract for pallet storage, and six months in they want 20 more pallet spaces. From the contract you click Amend, and CPQ creates an amendment opportunity and quote with the existing subscriptions at their current quantities. The rep can increase or decrease quantities or add new products. Existing lines keep their original price, and only the change is charged. New and changed lines are prorated to co-terminate with the contract end date, so those 20 extra spaces are priced for the remaining six months. When the amendment is contracted, CPQ creates new subscription records for the delta instead of overwriting the old ones, which keeps a clear history.

- Started from the Contract's Amend action
- Existing lines keep original pricing; only deltas are charged
- Changes co-terminate with the contract end date
- Delta subscriptions created, history preserved

<sub>Also asked as: What happens when you amend a contract in CPQ? · How do you add licenses mid-term in CPQ? · explain cpq amendment co termination · Why can't I change the price of existing lines on an amendment quote?</sub>

### How do renewals work in CPQ and what is the Renewal Pricing Method?
*Mid (3–6 yrs) · concept* · `cpq-022`

Renewals continue a contract for another term. When the contract's Renewal Forecast checkbox is set, CPQ creates a renewal opportunity, and setting Renewal Quoted creates a renewal quote with the subscriptions that are due. Pricing depends on the Renewal Pricing Method on the account. Same keeps the previous price, List reprices from the current price book, and Uplift applies a percentage increase from the Renewal Uplift field. For example, if a packaging customer's warehousing contract renews with Uplift and a Renewal Uplift of 5%, the renewal quote comes in 5% higher automatically. You can also choose contract-based or asset-based renewal models, and use co-termination so several contracts renew together. In practice I automate setting Renewal Forecast when a contract is activated, so the pipeline always shows upcoming renewals.

- Renewal Forecast -> renewal opportunity; Renewal Quoted -> renewal quote
- Renewal Pricing Method: Same, List or Uplift
- Contract-based or asset-based renewal models

<sub>Also asked as: Explain renewal forecast and renewal quoted · How does CPQ price a renewal quote? · renewal pricing method same list uplift · How do you automate renewal opportunities in CPQ?</sub>

### How do subscriptions and proration work in Salesforce CPQ?
*Mid (3–6 yrs) · concept* · `cpq-023`

A subscription product in CPQ has Subscription Pricing set to Fixed Price or Percent of Total, a default subscription term, and a subscription type like renewable, one-time or evergreen. On the quote, CPQ compares the line's effective term with the product's default term to get a prorate multiplier. Say a packaging customer buys a managed warehousing service with a 12-month default term, but the quote runs for 18 months. The multiplier is 1.5, so they pay one and a half times the 12-month price. Package settings control the term unit and how partial periods are prorated, for example monthly, daily or a combination. When the quote is contracted, CPQ creates Subscription records on the contract, and those drive amendments and renewals. Percent of Total products, like support charged as a percentage of hardware, calculate from the lines they cover.

- Subscription Pricing: Fixed Price or Percent of Total
- Prorate multiplier = effective term / default term
- Proration precision set in package settings
- Contracting creates Subscription records

<sub>Also asked as: What is the prorate multiplier? · How does CPQ calculate price for an 18 month subscription? · subscription pricing fixed price vs percent of total · Explain subscription term and proration in CPQ</sub>

### What are twin fields in Salesforce CPQ?
*Fresher (0–2 yrs) · concept* · `cpq-024`

Twin fields are CPQ's way of copying custom field values between related objects without code. If a custom field with the same API name and a compatible data type exists on two objects in CPQ's flow, CPQ copies the value automatically. Say a packaging manufacturer has a Print Colours custom field on Product. If I create the same field on Quote Line, the value comes across when the product is added. The same field on Opportunity Product picks it up when the quote syncs, and it can carry on down to Order Product and Subscription. That saves writing flows for simple mappings. The catches: names must match exactly, the target field must be editable by the user, and each pair maps at a specific moment. So I always test the exact path the data needs to take.

- Same API name and compatible type = automatic copy
- Product -> Quote Line -> Opportunity Product / Order Product -> Subscription
- Target field must be editable; test each hop

<sub>Also asked as: How does CPQ copy custom field values between objects? · What is twin field mapping? · how to pass a custom field from quote line to opportunity product · Do I need a flow to copy fields from quote line to order product?</sub>

### What is multi-dimensional quoting (MDQ) in CPQ?
*Senior (7–10 yrs) · concept* · `cpq-025`

Multi-dimensional quoting, or MDQ, lets one subscription line be split into time segments, like Year 1, Year 2 and Year 3, each with its own quantity, price or discount. You set it up by adding a Price Dimension to the product, with a type like Year, Quarter, Month, One-time or Custom. In the line editor the segments show up as columns. So if a packaging customer wants a three-year kitting contract that ramps up as their new product line grows, the rep enters a lower quantity for Year 1, higher ones after that, and gives a bigger first-year discount. Behind the scenes each segment is its own quote line tied to the dimension, and downstream each becomes its own subscription. It does add complexity, so before turning it on I check the impact on templates, price rules, renewals and reporting.

- Add a Price Dimension to the product to make it MDQ
- Segments (year, quarter, month, custom) shown as columns
- Each segment is its own line and later its own subscription
- Check templates, rules, renewals, reporting

<sub>Also asked as: Explain MDQ and price dimensions · How do you quote different prices per year in CPQ? · what are segmented quote lines in cpq · How do ramp deals work in Salesforce CPQ?</sub>

### Your custom trigger on CPQ quote lines keeps hitting CPU time and SOQL limits when a quote is saved. How do you fix it?
*Senior (7–10 yrs) · scenario* · `cpq-026`

CPQ updates quote lines several times during one calculate and save, so a custom trigger on quote lines can run repeatedly and burn limits. First I check whether the logic belongs in a price rule or the calculator plugin, since those run inside the calculation. If a trigger is needed, I bulkify it, use a static set so each record is processed once per transaction, only act when relevant fields actually changed, and push heavy work into a Queueable. For bulk data fixes from Apex or a batch, I wrap the DML with SBQQ.TriggerControl.disable() and enable() so CPQ's own triggers don't recalculate on every chunk, and then recalculate the affected quotes afterwards in a controlled way.

- Move logic to price rules or QCP where possible
- Bulkify, guard against re-entry, check changed fields only
- Offload heavy work to Queueable
- SBQQ.TriggerControl.disable()/enable() for bulk updates

```java
public with sharing class QuoteLineTriggerHandler {
    private static Set<Id> processed = new Set<Id>();

    public static void afterUpdate(List<SBQQ__QuoteLine__c> newLines,
                                   Map<Id, SBQQ__QuoteLine__c> oldMap) {
        Set<Id> quoteIds = new Set<Id>();
        for (SBQQ__QuoteLine__c ql : newLines) {
            if (processed.contains(ql.Id)) continue;
            if (ql.SBQQ__NetTotal__c != oldMap.get(ql.Id).SBQQ__NetTotal__c) {
                quoteIds.add(ql.SBQQ__Quote__c);
                processed.add(ql.Id);
            }
        }
        if (!quoteIds.isEmpty()) {
            System.enqueueJob(new QuoteRollupJob(quoteIds));
        }
    }
}

// Bulk data fix: stop CPQ triggers recalculating on every update
SBQQ.TriggerControl.disable();
try {
    update linesToFix;
} finally {
    SBQQ.TriggerControl.enable();
}
```

<sub>Also asked as: CPQ quote line trigger causing too many SOQL queries · How do you handle governor limits with CPQ triggers? · what is sbqq trigger control · Quote save fails with apex cpu time limit exceeded in CPQ</sub>

### What is large quote mode in CPQ and how is it different from the normal calculation?
*Senior (7–10 yrs) · concept* · `cpq-027`

CPQ doesn't have one single switch called large quote mode. It's a set of package settings for big quotes. The main one is the Large Quote Threshold. Quotes with more lines than that value are treated as large, so the line editor sends only the essential quote lines and quote-scoped product rules are skipped, which helps avoid governor limit errors. Quote Batch Size controls how many lines are processed per batch on load and save. Enable Large Quote Experience changes the line editor layout so reps can move around big quotes more easily. Separately, CPQ can run calculations asynchronously through its calculation service, so reps may see totals update after a delay and have to wait before trusting them. Say a packaging manufacturer quotes its full range of SKUs to a retail chain. I'd tune those settings, but still keep field sets lean, price rules on a single event, and the QCP efficient.

- Large Quote Threshold: above it, only essential lines sent and quote-scope product rules skipped
- Quote Batch Size: lines per batch on load and save
- Enable Large Quote Experience: easier QLE layout for big quotes
- Still tune rules, field sets and QCP

<sub>Also asked as: What does the large quote threshold do? · Why does CPQ calculate some quotes asynchronously? · legacy vs large quote mode cpq · How do you handle quotes with hundreds of lines in CPQ?</sub>

### You need a bundle where some items are always included and the rep must pick exactly one support plan. How would you configure it?
*Mid (3–6 yrs) · scenario* · `cpq-028`

I'd do it mostly with configuration, not rules. The bundle product gets Configuration Type Required so the configurator always opens. For items that must always be there, like the base license, I create product options marked Required and Selected, and Bundled if their price is included in the parent. For the support plan I create a feature called Support with Min Option Count 1 and Max Option Count 1, and put Standard, Premium and Enterprise under it as options, so the configurator forces exactly one choice. If one option should only be allowed with another, I add an option constraint, and only if the logic depends on quote values would I add a validation product rule.

- Configuration Type = Required on the bundle
- Required + Selected (+ Bundled) for always-included items
- Feature with min = max = 1 for 'pick exactly one'
- Constraints or validation rules only when needed

<sub>Also asked as: How to make mandatory options in a CPQ bundle · Force the user to choose exactly one option in a feature · bundle with required options and one support level · How do you set min and max options on a CPQ feature?</sub>

### The business wants a 10% discount automatically when the quantity is above 50 units. How would you implement it in CPQ?
*Fresher (0–2 yrs) · scenario* · `cpq-029`

My first choice is a discount schedule, because it's built for exactly this. I'd create a Range discount schedule with two tiers, 0% for 1 to 50 units and 10% from 51 upwards, keeping in mind that the tier upper bound is exclusive, and attach it to the product. CPQ then applies it automatically at the Regular Price stage of the waterfall. If it must apply across many products, depend on other criteria like region, or use the total quantity across lines, I'd use a price rule instead: a condition on quantity greater than 50, or on a summary variable, and an action that sets Additional Discount to 10, evaluated On Calculate.

- Preferred: Range discount schedule on the product
- Alternative: price rule setting Additional Discount (%)
- Use a summary variable for quantity across lines
- Agree whether reps can add further discount

<sub>Also asked as: Automatic volume discount over 50 units · Give 10 percent off if quantity greater than 50 · discount schedule or price rule for quantity discount · How to apply a quantity based discount in CPQ</sub>

### The business wants every renewal to increase automatically by 5% over last year's price. How do you set that up in CPQ?
*Mid (3–6 yrs) · scenario* · `cpq-030`

CPQ supports this out of the box. On the account, I set Renewal Pricing Method to Uplift, and I set Renewal Uplift (%) to 5 on the contract. When the renewal quote is generated, CPQ starts from the previous customer price and applies the 5% increase instead of repricing from the list. If the uplift should differ by product, it can also be set on individual subscriptions, and the subscription value takes precedence over the contract. I'd test with a multi-year contract, check how it interacts with MDQ segments and discounts, and confirm the renewal opportunity amount matches what finance expects.

- Renewal Pricing Method = Uplift on the account
- Renewal Uplift (%) on the contract, or per subscription (wins over contract)
- Test with multi-year and MDQ contracts

<sub>Also asked as: Renewal uplift of 5 percent · How to apply price increase on renewal quotes in CPQ · configure renewal uplift salesforce cpq · Annual price escalation on renewals</sub>

### A price rule you built isn't firing on the quote. How do you troubleshoot it?
*Mid (3–6 yrs) · scenario* · `cpq-031`

I go through a checklist. First, is the rule active, and is the evaluation scope right, calculator versus configurator? Second, the evaluation event. If it runs On Initialization but depends on values calculated later, it won't see them. Third, the conditions: All versus Any, picklist values spelled exactly, and matching data types. Fourth, evaluation order and later stages, because another rule or a discount schedule may be overwriting my target field. Fifth, the target field has to be on the right object, editable, and not a formula. For lookup rules I check the lookup queries really match a row. A typical example: a packaging discount rule tests for 'Corrugated' but the picklist value is actually 'Corrugated Boxes', so it never fires. If the checklist doesn't find it, I simplify by removing conditions one at a time and recalculating in the line editor.

- Active? Correct scope and evaluation event?
- Conditions: All/Any, exact picklist values, data types
- Something later overwriting the target field?
- Target field editable, not a formula; lookup returns a match

<sub>Also asked as: Why is my CPQ price rule not working? · Price action not updating the field · price rule not triggering in quote line editor · Debug a CPQ price rule that does nothing</sub>

### Reps complain that the Quote Line Editor takes over a minute to calculate quotes with 400 or more lines. What would you do?
*Senior (7–10 yrs) · scenario* · `cpq-032`

I'd first measure where the time goes, using browser developer tools and debug logs, and count the active price rules, product rules, summary variables and QCP hooks. Typical fixes: give each price rule a single evaluation event, deactivate or merge redundant rules, and replace many similar rules with one lookup-table rule. I trim the line editor field set and remove unneeded formula fields on quote lines, especially cross-object ones. In the QCP I avoid queries inside loops and skip work when nothing relevant changed. I review custom triggers and flows on quote lines. If quotes are still large, I tune the Large Quote Threshold and Quote Batch Size package settings, and consider grouping or MDQ to reduce line counts.

- Measure first: rules, variables, QCP, triggers
- One evaluation event per rule; lookup tables over many rules
- Lean field sets and fewer formula fields
- Tune Large Quote Threshold and Quote Batch Size

<sub>Also asked as: CPQ quote is very slow to calculate · How to improve CPQ performance · quote line editor timeout large quotes · Optimise price rules and QCP for performance</sub>

### If a quote has hardware products, it must also include a support product, otherwise the rep can't save. How would you build that?
*Mid (3–6 yrs) · scenario* · `cpq-033`

This is a validation product rule at quote scope. I'd create two summary variables: one counting quote lines where Product Family is Hardware, and one counting lines where Product Family is Support. Then I'd create a product rule of type Validation, scope Quote, evaluation event Save, with error conditions hardware count greater than zero and support count equal to zero, and Conditions Met set to All. The message tells the rep exactly what to add. If the business prefers auto-adding support instead of blocking, I'd make it a selection rule with an Add action. I'd also test with bundles, because bundle options are quote lines too.

- Two summary variables: hardware count and support count
- Validation rule, Quote scope, evaluation on Save
- Selection rule with Add if auto-adding is preferred

<sub>Also asked as: Block saving a quote without support · Quote level validation rule in CPQ using summary variables · require a product when another product family exists · How to force reps to add support with hardware</sub>

### When a rep selects a particular product, another product should be added automatically. How do you do it in CPQ?
*Fresher (0–2 yrs) · scenario* · `cpq-034`

If both are inside the same bundle, the simplest way is a selection product rule with Product scope. The error condition checks that the triggering option is selected, and the product action is Add, pointing at the product to include, for example adding a mounting kit when a wall display is chosen. An evaluation event of Always or Edit makes it react as the rep configures. If the products aren't in a bundle, I can use a Quote-scope selection rule, or redesign them as a bundle with the extra item as a required option. The same rule type also supports Remove, Hide and Disable actions for incompatible choices.

- Selection rule with Add action
- Product scope for bundles, Quote scope otherwise
- Or model as a required option in a bundle

<sub>Also asked as: Auto add a product when another is selected · How does a selection rule add products? · automatically include accessory in cpq bundle · Add a mounting kit whenever a display is selected</sub>

### A customer wants a three-year subscription with 100 users in year one, 150 in year two and 200 in year three, with a bigger discount in year one. How would you quote it in CPQ?
*Senior (7–10 yrs) · scenario* · `cpq-035`

That's a classic multi-dimensional quoting use case. I'd add a yearly price dimension to the subscription product to make it MDQ, and set the quote's subscription term to 36 months. In the line editor the product then shows Year 1, Year 2 and Year 3 columns, where the rep enters 100, 150 and 200 users and a different discount for each segment. Each segment becomes its own line and later its own subscription, so billing and renewals follow the ramp. Without MDQ, the alternative is separate lines with staggered start and end dates, but that's harder for reps and reporting, so MDQ is cleaner when ramp deals are common.

- MDQ with a yearly price dimension
- Per-segment quantity and discount
- Segments flow to separate subscriptions
- Fallback: staggered-date lines

<sub>Also asked as: Ramp deal with increasing users each year · Different quantity and discount per year in one quote · how to do a multi year ramp in salesforce cpq · Quote a three year deal with yearly segments</sub>

## Revenue Cloud

### What is Revenue Cloud Advanced?
*Fresher (0–2 yrs) · concept* · `rev-001`

Revenue Cloud Advanced, or RCA, is Salesforce's next-generation quote-to-cash product and the successor to Salesforce CPQ. It's part of Salesforce Revenue Cloud, which started out as Revenue Lifecycle Management, or RLM, and has also been branded Agentforce Revenue Management. The big difference from CPQ is that it isn't a managed package. It's built natively on the platform using standard objects like Quote, Order and Asset. It covers the lifecycle end to end: Product Catalog Management, Salesforce Pricing, Product Configurator, quotes and orders through Transaction Management, fulfillment with Dynamic Revenue Orchestrator, contracts, and with Revenue Cloud Billing, invoicing and payments. So for a packaging manufacturer, one platform takes a deal from the catalog, to a priced quote, to an order, to fulfillment, to the invoice. It's also API-first, so the same pricing and configuration can serve the Salesforce UI, a portal or an AI agent.

- Successor to Salesforce CPQ
- Part of Revenue Cloud (formerly Revenue Lifecycle Management; also branded Agentforce Revenue Management)
- Native, standard objects, no managed package
- Catalog, pricing, configurator, quotes/orders, DRO, contracts, billing

<sub>Also asked as: What is Salesforce Revenue Cloud? · What is Agentforce Revenue Management? · what is r c a in salesforce · What replaced CPQ in Salesforce?</sub>

### What are the main differences between Salesforce CPQ and Revenue Cloud Advanced?
*Mid (3–6 yrs) · comparison* · `rev-002`

The biggest difference is architecture. CPQ is a managed package with its own SBQQ objects, while RCA is native and uses standard objects like Quote, Quote Line Item, Order and Asset. For configuration, CPQ uses product rules and option constraints. RCA uses Product Catalog Management with attributes and classifications, plus a Product Configurator that supports Constraint Modeling Language. For pricing, CPQ uses price rules, the waterfall and the calculator plugin, while RCA uses pricing procedures driven by context definitions. CPQ amends and renews through contracts and subscriptions, and RCA is asset-based. So if a packaging customer adds more pallet storage mid-year, in CPQ you amend the contract, and in RCA you amend the asset. RCA also adds Dynamic Revenue Orchestrator for fulfillment, native billing and an API-first design, and that's where new innovation lands.

- Managed package (SBQQ) vs native standard objects
- Product rules vs configurator rules and CML
- Price rules/QCP vs pricing procedures
- Contract/subscription-based vs asset-based lifecycle
- Quote Line Editor vs Transaction Line Editor

<sub>Also asked as: CPQ vs Revenue Cloud Advanced · How is RCA different from Steelbrick CPQ? · cpq versus rca architecture differences · Why is Revenue Cloud Advanced better than CPQ?</sub>

### What is Product Catalog Management in Revenue Cloud?
*Fresher (0–2 yrs) · concept* · `rev-003`

Product Catalog Management, or PCM, is where you model what you sell in Revenue Cloud Advanced. Instead of creating a separate product for every variation, you define attributes and group them into product classifications that act as templates, so products inherit consistent attributes. Say a packaging manufacturer sells custom boxes. Rather than a SKU for every size, board grade and print colour, I'd make those attributes on one custom box product that uses a box classification. Products are linked to product selling models that say whether they're one-time, evergreen or term-defined. You build bundles through product relationships and component groups, organise products into catalogs and categories for browsing, and use qualification rules to decide which products a customer is eligible for. And because it's built on standard objects and exposed through APIs, the same catalog serves reps, portals and agents.

- Attributes and product classifications reduce SKU explosion
- Product selling models define how products are sold over time
- Bundles, catalogs, categories, qualification rules

<sub>Also asked as: What is PCM in Revenue Cloud Advanced? · How are products modelled in Revenue Cloud? · what are attributes and product classifications · Explain product catalog in agentforce revenue management</sub>

### What is a product selling model in Revenue Cloud Advanced?
*Mid (3–6 yrs) · concept* · `rev-004`

A product selling model defines how a product is sold over time. There are three types. One Time is for things like hardware or setup fees. Term Defined is for subscriptions with a fixed term, like 12 months. Evergreen is for subscriptions that keep going until cancelled. A product can have more than one selling model option. So a packaging company could sell box tooling as One Time, and offer its managed kitting service either as a 12-month Term Defined plan or as Evergreen. Price book entries are created per product and selling model combination, so each of those options gets its own price. This replaces a lot of the CPQ subscription fields like subscription type and term, and it drives how quotes, assets, amendments and billing behave downstream.

- Types: One Time, Term Defined, Evergreen
- Products can have several selling model options
- Price book entries are per product + selling model

<sub>Also asked as: Explain one time, evergreen and term defined selling models · How are subscriptions defined in Revenue Cloud? · what is product selling model option · How do you sell the same product monthly and annually in RCA?</sub>

### What is a pricing procedure in Revenue Cloud Advanced?
*Mid (3–6 yrs) · concept* · `rev-005`

Salesforce Pricing is the pricing engine in Revenue Cloud Advanced, and a pricing procedure is the ordered recipe it follows to calculate prices. Each step is called a pricing element. It reads input from the context definition, calculates something, and passes its output to the next element. For a packaging quote, a typical procedure gets the carton list price from the price book, applies the volume discount from a price adjustment schedule, adds any attribute-based adjustment like extra print colours, takes off the rep's manual discount, and then totals it. The data behind it lives in decision tables, which are refreshed by running Sync Pricing Data after changes. So if you change a price and skip the sync, the procedure still works off the old data. You can also simulate a procedure and see the price waterfall step by step. It replaces CPQ price rules and much of what we used the calculator plugin for.

- Ordered pricing elements, each feeding the next
- Reads/writes through the context definition
- Decision tables refreshed by Sync Pricing Data
- Simulation shows a step-by-step price waterfall

<sub>Also asked as: How does Salesforce Pricing work? · Explain pricing procedures and pricing elements · what replaces price rules in revenue cloud · What is Sync Pricing Data?</sub>

### What is a context definition in Revenue Cloud and why does it matter?
*Senior (7–10 yrs) · concept* · `rev-006`

A context definition is a data contract. It tells Revenue Cloud services what data they work on, without hard-coding object queries. It defines nodes and attributes, like a sales transaction and its line items, and maps them to real objects and fields such as Quote, Quote Line Item, Order and Order Item. Pricing procedures, configurator rules and Dynamic Revenue Orchestrator all read and write through these contexts, for example the standard SalesTransactionContext for quotes and orders. Here's a practical case. Say a packaging business adds a custom delivery region field and wants it to affect the price. I extend the standard context definition, add the attribute, map it to that field, and then the pricing procedure can use it. Skip that mapping and pricing has no way to see the field.

- Abstract data model mapped to real objects and fields
- Used by pricing, configurator and DRO
- Standard contexts such as SalesTransactionContext
- Extend it to bring custom fields into pricing

<sub>Also asked as: Explain SalesTransactionContext · How does pricing know which fields to read in Revenue Cloud? · what is context service in rlm · How do you make a custom field affect pricing in RCA?</sub>

### What is the Product Configurator and Constraint Modeling Language in Revenue Cloud?
*Senior (7–10 yrs) · concept* · `rev-007`

Product Configurator is the RCA engine that lets reps configure bundles and attributes, and it enforces which combinations are valid. For simpler needs you use standard configuration rules, like require or exclude a component. For complex products there's Constraint Modeling Language, or CML. It's a domain-specific language where you describe the product as a model with types, attributes, relationships and constraints. A constraint engine then solves the model, so it can auto-select values, prevent invalid combinations and surface conflicts, instead of running rules one by one in a fixed order like CPQ product rules. Think of a packaging line where box size, board strength, pallet type and stacking height all depend on each other. That's where combinations explode and CML is worth it. It needs a modelling mindset though, so I keep simple logic in standard rules.

- Configurator enforces valid bundles and attributes
- Simple rules for basic require/exclude logic
- CML: declarative constraint models solved by an engine
- Use CML for highly combinatorial products

<sub>Also asked as: What is CML in Revenue Cloud Advanced? · How are configuration rules done in RCA? · constraint modeling language salesforce · What replaces product rules in Revenue Cloud?</sub>

### How do quotes and orders work in Revenue Cloud Advanced?
*Fresher (0–2 yrs) · concept* · `rev-008`

In RCA, quotes and orders are handled by Transaction Management, which used to be called Quote and Order Capture. The rep creates a quote on the standard Quote object from an opportunity or account, adds products through the Transaction Line Editor, configures them, and the pricing procedure prices every line. The quote can go through approvals and document generation, and then gets converted into an order. Because quotes and orders share the same sales-transaction model, that conversion is clean. So say a packaging customer signs a quote for printed cartons plus a kitting service. When the order is activated, it can start fulfillment through Dynamic Revenue Orchestrator and it creates assets. Those assets are the basis for later amendments, renewals and billing. The same steps are available as APIs for headless or partner channels.

- Transaction Management (formerly Quote and Order Capture)
- Standard Quote and Order objects, Transaction Line Editor
- Activated orders drive fulfillment, assets and billing
- API-first for headless channels

<sub>Also asked as: What is Transaction Management in Revenue Cloud? · What is the Transaction Line Editor? · quote and order capture revenue cloud · How does a quote become an order in RCA?</sub>

### How do amendments, renewals and cancellations work in Revenue Cloud Advanced compared with CPQ?
*Mid (3–6 yrs) · comparison* · `rev-009`

RCA is asset-based. When an order is fulfilled, the products become assets with a timeline of state periods that record quantity, price and dates over time. To change something mid-term you start an amendment from the asset. A new quote or order captures just the change, prorated for the remaining period, and the asset timeline is updated. Renewals and cancellations work the same way, from the assets. For example, if a packaging customer goes from 50 to 80 pallet spaces in month seven, the asset shows 50 for the first period and 80 from then on. In CPQ, the same processes start from the contract and create subscription records. So the way I put it: CPQ is contract and subscription centric, RCA is asset centric, and that gives a clearer single view of what the customer owns right now.

- Orders create assets with state periods over time
- Amend, renew, cancel from the asset
- CPQ: contract and subscription records instead

<sub>Also asked as: What does asset-based ordering mean in Revenue Cloud? · Asset based vs contract based amendments · how to amend a subscription in rca · What are asset state periods?</sub>

### What is Dynamic Revenue Orchestrator in Revenue Cloud?
*Mid (3–6 yrs) · concept* · `rev-010`

Dynamic Revenue Orchestrator, or DRO, manages fulfillment after an order is placed, and it works in two stages. Decomposition converts the commercial products the customer bought into the technical products fulfillment teams care about, based on decomposition rules. Orchestration then builds a plan of steps with dependencies, like procure equipment, dispatch, install and activate. Say a packaging manufacturer sells an automated packing line bundle. Decomposition might split it into the machine, the installation and the operator training, and orchestration puts those in the right order. Step types include manual tasks for people, callouts to external systems, auto tasks that run a flow, milestones to track checkpoints, and pauses that wait for something to finish. Once an order is submitted, DRO decomposes it and generates the orchestration plan automatically, and simple orders can skip decomposition. It replaces custom order-processing code and gives operations a visible plan per order.

- Decomposition: commercial -> technical products
- Orchestration plan with dependent steps
- Steps: manual task, callout, auto task (flow), milestone, pause

<sub>Also asked as: What is DRO? · How is order fulfillment handled in Revenue Cloud Advanced? · explain decomposition and orchestration in dro · What fulfillment step types does DRO support?</sub>

### How does Revenue Cloud handle contracts?
*Fresher (0–2 yrs) · concept* · `rev-011`

Revenue Cloud covers the contract stage through Salesforce Contracts, often described as contract lifecycle management. After a quote is accepted, you create a contract from it and generate the contract document from templates that pull in quote and account data. Legal language stays standard because you use approved clauses. Teams can collaborate and negotiate on the document, and then send it for e-signature. Once it's signed, the contract is activated and its terms flow into orders, assets and billing. For example, say a packaging customer accepts a two-year supply quote. The contract is generated with the agreed prices and the approved clauses, legal negotiates one change, the customer e-signs, and the activated terms carry straight through to the order and the invoices. The real benefit is that commercial terms and the legal document stay connected in one platform, instead of living in a separate tool someone has to update by hand.

- Contract created from the accepted quote
- Template-based document generation with standard clauses
- Negotiation, e-signature, activation
- Terms flow into orders, assets and billing

<sub>Also asked as: Contract lifecycle management in Revenue Cloud · What is Salesforce Contracts? · how are contract documents generated in revenue cloud · Where do contracts fit in quote to cash?</sub>

### What does Revenue Cloud Billing do?
*Fresher (0–2 yrs) · concept* · `rev-012`

Revenue Cloud Billing handles everything after the order: turning what was sold into invoices and collecting the money. When an order is activated, billing schedules are created from the order lines, based on billing settings like frequency and whether you bill in advance or in arrears. Invoice batch runs pick up what's due, daily, weekly or monthly, and generate invoices that can be posted, rendered as PDFs and emailed. Say a packaging customer has a monthly warehousing fee billed in advance plus a one-time tooling charge. Activating the order creates the schedules, and each run invoices whatever has fallen due. Billing also handles payments and refunds, credit memos when orders are reduced, write-offs, collections, and usage-based or milestone billing. Operations teams monitor runs and errors in the Billing Operations Console. And because it's native, finance and sales work from the same customer data.

- Billing schedules from activated order lines
- Invoice batch runs, PDF invoices, email
- Payments, refunds, credit memos, collections
- Billing Operations Console for monitoring

<sub>Also asked as: How does billing work in Revenue Cloud Advanced? · What are billing schedules and invoice runs? · revenue cloud billing invoices payments credit memos · How are invoices generated from orders in Revenue Cloud?</sub>

### How does usage-based selling work in Revenue Cloud Advanced?
*Mid (3–6 yrs) · concept* · `rev-013`

Usage-based selling is for products charged by consumption, like API calls, storage or minutes. In Revenue Cloud Advanced, Usage Management defines the usage resources a product consumes, the allowances or grants included with a purchase, how usage is summarised, and when overages apply. Rate Management defines the rates, like a price per thousand API calls, possibly tiered, and rates the usage records. Billing then invoices the rated usage, usually in arrears alongside the recurring fee. So one product can have a fixed monthly fee, an included allowance and a per-unit overage. In a packaging business, picture a fulfilment service where the customer pays a monthly fee that includes a set number of packed orders, then pays per order above that. In practice, getting reliable, timely usage data into Salesforce is the hardest part, so I plan that integration early.

- Usage Management: resources, grants/allowances, summaries, overages
- Rate Management: rates and rating of usage
- Billing invoices rated usage, usually in arrears

<sub>Also asked as: How do you sell consumption based products in Revenue Cloud? · What are Usage Management and Rate Management? · pay as you go pricing salesforce revenue cloud · How are overages billed in RCA?</sub>

### What would you consider when migrating a customer from Salesforce CPQ to Revenue Cloud Advanced?
*Senior (7–10 yrs) · design* · `rev-014`

First, it's a re-implementation, not an upgrade, because the data model and engines are different. I'd start with an assessment: inventory products, bundles, product rules, price rules, calculator plugin code, templates, approvals, integrations and reports, and decide what to redesign rather than copy. Then map concepts: products and options into the catalog with attributes and selling models, product rules into configuration rules or CML, price rules and plugin logic into pricing procedures, and CPQ subscriptions into assets. Migrating active contracts and subscriptions needs the most care because they drive amendments and renewals. I'd consider phasing, such as new business on RCA while existing contracts move at renewal, and plan billing, integrations, testing and training.

- Re-implementation, not an in-place upgrade
- Assess and simplify before mapping
- Map rules -> configurator/CML, price rules/QCP -> pricing procedures
- Active subscriptions -> assets is the riskiest data move
- Phased rollout, e.g. new business first

<sub>Also asked as: How do you plan a CPQ to RCA migration? · Is there an upgrade path from CPQ to Revenue Cloud Advanced? · cpq to revenue cloud migration considerations · What are the risks of moving from CPQ to RCA?</sub>

### In Revenue Cloud Advanced, the business wants tiered volume discounts on a product. How would you set it up?
*Mid (3–6 yrs) · scenario* · `rev-015`

I'd use a price adjustment schedule rather than custom logic. I create the schedule with tiers, for example no discount from 1 to 49 units, 5% from 50 to 99 and 10% from 100 upwards, and associate it with the product and price book. Then I make sure the active pricing procedure includes the volume discount element in the right place, after the list price and before manual discounts, so the order of discounts is what the business expects. After saving I run Sync Pricing Data so the decision tables pick up the change, and I simulate the pricing procedure to check the waterfall before testing on a real quote.

- Price adjustment schedule with tiers
- Volume discount element in the pricing procedure
- Run Sync Pricing Data, then simulate

<sub>Also asked as: Volume discount in Revenue Cloud Advanced · What is a price adjustment schedule? · how to give quantity discounts in rca · Configure tier pricing in Salesforce Pricing</sub>

### A laptop's price should change based on attributes like RAM and storage that the rep selects. How would you model that in Revenue Cloud Advanced?
*Mid (3–6 yrs) · scenario* · `rev-016`

Instead of creating a product for every combination, I'd model it with attributes. In Product Catalog Management I create attributes for RAM and Storage with picklist values, add them to a product classification, and assign it to the laptop product. For pricing I set up attribute-based price adjustments, for example a fixed increase for the larger RAM and another for the larger drive, and make sure the pricing procedure includes the attribute adjustment element. If certain combinations are invalid, like the top storage only with the top RAM, I add a configuration rule or a CML constraint. Then I sync pricing data and test the full flow from configuration to quote.

- Attributes + product classification instead of many SKUs
- Attribute-based price adjustments in the pricing procedure
- Configuration rules or CML for invalid combinations

<sub>Also asked as: Attribute based pricing in Revenue Cloud · Price changes when user selects a different option attribute · how to avoid creating a product for every variation in rca · Configure attribute pricing for a configurable product</sub>

### After an order is activated, equipment must be ordered from an external vendor, then a technician installs it, then the service is activated. How would you implement this in Revenue Cloud?
*Senior (7–10 yrs) · scenario* · `rev-017`

I'd use Dynamic Revenue Orchestrator. First, decomposition rules turn the commercial product the customer bought into technical products like Equipment, Installation and Service Activation. Then I define the orchestration with steps and dependencies: a callout step that sends the purchase request to the vendor's system, a pause or milestone that waits for the vendor's confirmation, a manual task assigned to the installation team, and an auto task that runs a flow to activate the service and update the asset. When the order is activated and submitted, DRO decomposes it and builds the plan. I'd also plan error handling and retries for the callout step so operations can see and fix failures.

- Decompose into Equipment, Installation, Activation
- Callout -> wait (pause/milestone) -> manual task -> auto task
- Submitting the order starts decomposition and orchestration
- Plan retries and visibility for failures

<sub>Also asked as: Order fulfillment with external vendor and installation steps · How to orchestrate post-order steps in Revenue Cloud Advanced · dro orchestration plan with callout and manual task · Design fulfillment for hardware plus installation in RCA</sub>

### You need to sell an API product: a monthly fee that includes 100,000 calls, then a per-call overage. How would you design it in Revenue Cloud?
*Senior (7–10 yrs) · scenario* · `rev-018`

I'd split it into a recurring part and a usage part. The product gets an evergreen or term-defined selling model with the monthly fee in the price book. In Usage Management I define a usage resource, API Calls, link it to the product, and set a grant of 100,000 calls per month as the included allowance. In Rate Management I define the overage rate, per call or per thousand, possibly tiered. The usage records come from the API platform through an integration, are summarised per billing period, and anything above the grant is rated as overage. Billing then invoices the fee in advance and the overage in arrears. I'd agree with finance whether unused allowance rolls over or expires.

- Recurring fee via selling model and price book
- Usage resource + grant for the allowance
- Rate Management for overage rates
- Fee billed in advance, overage in arrears

<sub>Also asked as: Subscription with included usage and overage · Design usage based pricing with allowance in Revenue Cloud Advanced · how to bill api calls overage in rca · Monthly fee plus consumption charges</sub>

### A client on Salesforce CPQ asks whether they must move to Revenue Cloud Advanced right away. What would you advise?
*Senior (7–10 yrs) · scenario* · `rev-019`

I'd say there's no emergency, but there is a clear direction. CPQ is end of sale, not end of life: they keep support and can renew, but new features go into Revenue Cloud Advanced, so CPQ will gradually fall behind. My advice is to plan rather than panic. Assess the current CPQ setup and its technical debt, and identify what RCA would actually improve for them, such as asset-based lifecycle, native billing, usage pricing or agent-driven quoting. If their CPQ is stable and simple, they can stay and time the move around a natural event like a redesign or contract renewal. If they're about to invest heavily in new CPQ customisation, I'd steer that investment toward RCA.

- End of sale, not end of life: no forced deadline announced
- Innovation is in RCA
- Assess value and technical debt first
- Avoid big new CPQ investments

<sub>Also asked as: Should we migrate off CPQ now? · Is CPQ going away, do we need to move? · customer asking about cpq end of sale what to do · When is the right time to move from CPQ to RCA?</sub>

### You updated a price book entry and a price adjustment in Revenue Cloud Advanced, but new quotes still show the old price. What do you check?
*Mid (3–6 yrs) · scenario* · `rev-020`

My first check is Sync Pricing Data. Salesforce Pricing reads from decision tables rather than directly from price book records, so changes to price books or adjustment schedules don't take effect until pricing data is synced. Next I confirm which pricing procedure and pricing recipe are set as defaults in the revenue settings, and whether the quote actually uses that procedure. Then I check effective dates on the price book entry and adjustment, that the entry exists for the right product selling model and currency, and that the quote is on the right price book. Finally I simulate the pricing procedure with the same inputs to see which step produces the old value.

- Run Sync Pricing Data after pricing changes
- Confirm default pricing procedure and recipe
- Check dates, selling model, currency, price book
- Simulate the procedure to find the step

<sub>Also asked as: Revenue Cloud quote showing old price · Price change not reflected in RCA quotes · why is sync pricing data needed · Pricing procedure returns stale price</sub>

## OmniStudio

### What is OmniStudio?
*Fresher (0–2 yrs) · concept* · `omni-001`

OmniStudio is a suite of low-code tools for building guided, industry-style digital experiences on Salesforce. It came from Salesforce's acquisition of Vlocity and was first used in the Industry Clouds like Communications, Insurance and Health. It has four main building blocks. FlexCards show contextual information and actions. OmniScripts are guided multi-step processes. Integration Procedures do server-side orchestration in a single call. And Data Mappers, formerly DataRaptors, read, transform and write data. Business rules can be handled with Decision Matrices and Expression Sets. To picture them together: an insurance agent sees a FlexCard with the customer's policies, clicks File a Claim, which launches an OmniScript, and behind the scenes an Integration Procedure uses Data Mappers to pull and save the data. Salesforce now styles the name as Omnistudio, and it runs either on the standard runtime built into the core platform or on the original managed package.

- From the Vlocity acquisition, built for Industry Clouds
- FlexCards, OmniScripts, Integration Procedures, Data Mappers
- Decision Matrices and Expression Sets for rules
- Standard runtime or managed package

<sub>Also asked as: Explain Salesforce OmniStudio and its components · What came from the Vlocity acquisition? · what is omni studio in salesforce · What are the main OmniStudio tools?</sub>

### What is a FlexCard in OmniStudio?
*Fresher (0–2 yrs) · concept* · `omni-002`

A FlexCard is a configurable UI card that shows the key information about a record at a glance and gives users one-click actions. You build it in the FlexCard designer. First you choose a data source, like a Data Mapper, Integration Procedure, Apex or SOQL, and then you lay out the fields and elements. Cards can have multiple states with conditions. For example, on a service console an account card can switch to a red layout when the account has overdue invoices, with a button right there to launch a payment plan OmniScript. Actions can launch an OmniScript, navigate to a record or URL, fire events, or open a flyout with a child card. When activated, FlexCards run as Lightning Web Components, so you can place them on Lightning pages, consoles and Experience Cloud sites.

- Contextual summary plus actions
- Data sources: Data Mapper, IP, Apex, SOQL and more
- States with conditions; child cards and flyouts
- Runs as LWC on Lightning and Experience Cloud pages

<sub>Also asked as: Explain FlexCards · What can you do with a FlexCard? · what is flex card in salesforce · How do FlexCards show a 360 view of a customer?</sub>

### What is an OmniScript?
*Fresher (0–2 yrs) · concept* · `omni-003`

An OmniScript is a guided, step-by-step process you build declaratively. Think of a wizard for onboarding a customer, filing a claim or creating a quote. You drag elements onto a canvas: Steps that act as pages, inputs like text, radio, select and date, display elements, and actions such as Data Mapper, Integration Procedure, Remote Action, HTTP and Navigate actions. Everything the user enters is held in a single data JSON that flows through the script, and you can add conditional views, formulas and validation. Say it's a claim journey. Step one captures the incident date, step two only shows vehicle questions if the claim type is Auto, and the last step calls an Integration Procedure to save it. OmniScripts are versioned, can embed other OmniScripts, and run as Lightning Web Components. Compared with a Screen Flow, I'd say they're better suited to complex, branded, customer-facing journeys.

- Guided multi-step UI process
- Steps, inputs, display and action elements
- Single data JSON holds all state
- Versioned, reusable, runs as LWC

<sub>Also asked as: Explain OmniScripts in OmniStudio · When would you use an OmniScript instead of a Screen Flow? · what is omni script used for · How do you build a guided process in OmniStudio?</sub>

### What is an Integration Procedure in OmniStudio?
*Fresher (0–2 yrs) · concept* · `omni-004`

An Integration Procedure is a server-side, declarative process that runs several actions in a single server call and returns one combined response. Inside it you chain elements like Data Mapper Extract and Load actions, HTTP actions for REST callouts, Remote Actions for Apex, Set Values, conditional blocks, loop blocks, try-catch blocks and a response action. For example, a portal page might need the account details, the open orders and a credit check from an external system. Instead of the OmniScript or a FlexCard making three separate calls from the browser, one IP does all of it on the server and sends back a single JSON. That's why it's much faster. IPs can be called from OmniScripts, FlexCards, Apex and REST, and they support caching and versioning. I think of them as the back-end orchestration layer of OmniStudio.

- Server-side, multiple actions, one round trip
- Data Mapper, HTTP, Remote, Set Values, blocks, Response
- Callable from OmniScripts, FlexCards, Apex, REST
- Supports caching and versioning

<sub>Also asked as: Explain Integration Procedures · What is an IP in OmniStudio? · what does integration procedure do in omni studio · Why use an Integration Procedure instead of multiple Data Mapper calls?</sub>

### What are Data Mappers (formerly DataRaptors) and what types are there?
*Fresher (0–2 yrs) · concept* · `omni-005`

Data Mappers, formerly called DataRaptors, are the OmniStudio tools for reading, transforming and writing Salesforce data without code. The new name is the one used in the standard designers. There are four types. Extract reads data from one or more objects, with filters, and maps the output into whatever JSON shape you design. Turbo Extract is a faster, simpler read from a single object, optionally with parent fields, but without formulas or custom output mapping. Transform reshapes data in memory, like renaming keys, flattening lists or converting formats, with no database access. Load writes data, inserting, updating or upserting one or more related objects in one call. In a typical claim journey I'd use a Turbo Extract to prefill the policy, a Transform to reshape an external response, and a Load to save the claim. OmniScripts, FlexCards and Integration Procedures all use them.

- Same tool, new name: Data Mapper (formerly DataRaptor)
- Extract: multi-object read with mapping
- Turbo Extract: fast single-object read
- Transform: in-memory reshape; Load: write

<sub>Also asked as: What is a DataRaptor in OmniStudio? · Explain Extract, Turbo Extract, Transform and Load · data raptor types · What is the difference between a DataRaptor and a Data Mapper?</sub>

### What is the difference between an Extract and a Turbo Extract Data Mapper?
*Mid (3–6 yrs) · comparison* · `omni-006`

Both read data, but they trade flexibility for speed. An Extract can query multiple objects, follow relationships, apply formulas and map the output into any JSON shape, so it's ideal when the consumer needs a specific structure. A Turbo Extract reads from a single object, can include parent fields through relationship notation, and returns the fields without custom output mapping or formulas, which makes it faster and quicker to build. For example, a FlexCard showing a contact's name, email and account name is a Turbo Extract job. But if an OmniScript needs the account, its open cases and a calculated total in one nested structure, that's a regular Extract. My rule: Turbo Extract by default for simple reads in FlexCards and OmniScripts, and a regular Extract, or an Extract plus a Transform inside an Integration Procedure, when I need several objects, calculated values or a reshaped response.

- Extract: multi-object, formulas, custom output mapping
- Turbo Extract: single object (+ parent fields), no formulas or mapping
- Default to Turbo for simple reads

<sub>Also asked as: Turbo Extract vs Extract · When should I use Turbo Extract? · dataraptor turbo extract limitations · Which Data Mapper is faster for reading data?</sub>

### When would you use a Transform Data Mapper?
*Mid (3–6 yrs) · concept* · `omni-007`

A Transform Data Mapper reshapes data that's already in memory; it never queries or writes to the database. I use it when the shape coming from one system doesn't match what the next one expects, for example converting an external API response into the structure an OmniScript or a Load expects, renaming nodes, flattening nested lists, merging values, applying formulas or defaults, or converting between JSON and XML. In an Integration Procedure a very common pattern is HTTP action, then Transform, then Load. Because it's declarative and has a preview tab, it's easier to maintain than writing Apex just to map fields.

- In-memory only: no SOQL or DML
- Rename, flatten, merge, default, format conversion
- Common pattern: HTTP -> Transform -> Load

<sub>Also asked as: What is a DataRaptor Transform used for? · How do you reshape an API response in OmniStudio? · transform data mapper example · Convert JSON structure between steps in an Integration Procedure</sub>

### How does a Load Data Mapper save related records, like an account and its contacts?
*Mid (3–6 yrs) · concept* · `omni-008`

A Load Data Mapper writes data, and one Load can save several related objects in a single call. On the Objects tab you list them in order, for example Account first and Contact second, and link Contact to Account so the new Account Id flows into the contact's AccountId automatically. On the Fields tab you map JSON paths from the input to object fields, and a list node in the JSON creates multiple child records. For updates you set an upsert key, like a record Id or an external Id, so existing records are matched instead of duplicated. I check the object order and required fields, and test in the Preview tab before wiring it into an OmniScript.

- Objects listed in dependency order
- Link child lookups to parent objects
- Lists in JSON create multiple child records
- Upsert keys prevent duplicates

<sub>Also asked as: How to insert parent and child records with a DataRaptor Load · What is an upsert key in a Load Data Mapper? · dataraptor load multiple objects linking · How do you avoid duplicates with a Load Data Mapper?</sub>

### What are Decision Matrices and Expression Sets in OmniStudio?
*Mid (3–6 yrs) · concept* · `omni-009`

Both are part of the Business Rules Engine, and both keep business rules out of code. A Decision Matrix is a lookup table. You define input and output columns, load rows, often from a spreadsheet, and the matrix returns the outputs for a matching combination. For example, an insurer could look up a rate by age band and region. An Expression Set is a sequence of steps that can call decision matrices, calculate, apply conditions and branch, and it returns results like an eligibility flag or a calculated discount. So the Expression Set might take that rate from the matrix, check a condition, and work out the final figure. Both are versioned with effective dates, so business users can update rules without a deployment. OmniScripts and Integration Procedures call them through actions, and they replace the older calculation procedures and calculation matrices.

- Decision Matrix = lookup table of inputs to outputs
- Expression Set = multi-step calculation and logic
- Versioned with effective dates
- Replace calculation procedures/matrices

<sub>Also asked as: Explain the Business Rules Engine · Decision Matrix vs Expression Set · what replaced calculation procedures and calculation matrices · How do you store business rules outside code in OmniStudio?</sub>

### When would you use an Integration Procedure instead of Apex?
*Mid (3–6 yrs) · comparison* · `omni-010`

I start with an Integration Procedure when the job is orchestration: fetch data, call a REST API, transform it and save it, with modest logic. IPs are declarative, versioned, quick to change, support caching, and admins can read them. I choose Apex when the logic is complex or computational, needs heavy loops or recursion, needs precise transaction control and error handling, processes large data volumes, or needs strong unit testing. Often the answer is both. Say an onboarding journey has to fetch the customer, call a credit API and save the result, but also run a complicated scoring calculation. The IP handles the fetch, the callout and the save, and calls an Apex class through a Remote Action just for the scoring. One thing people miss: an IP still runs under Apex governor limits in the same transaction, so it's not a way around limits.

- IP: declarative orchestration, caching, versioning
- Apex: complex logic, volume, transaction control, testing
- Combine via Remote Action
- IPs still count against governor limits

<sub>Also asked as: Integration Procedure vs Apex · Should this logic be in an IP or an Apex class? · low code vs code in omnistudio · Do Integration Procedures avoid governor limits?</sub>

### How does caching work in Integration Procedures?
*Senior (7–10 yrs) · concept* · `omni-011`

Integration Procedures can store results in Salesforce Platform Cache, so repeat calls skip the expensive work. There are two levels. You can cache the whole IP response in the procedure's configuration, choosing session cache for user-specific data or org cache for data shared by everyone, with a time to live in minutes. Or you wrap specific steps in a Cache Block, so only that part is cached and the other steps still run fresh. For example, if an IP calls an external product catalogue that rarely changes and then reads the user's own cart, I'd put a Cache Block around just the catalogue HTTP call. Cached entries depend on the inputs, so different inputs get different entries. You need a platform cache partition with capacity allocated, and I never put user-specific or sensitive data in org cache. I pick TTLs based on how stale the data can safely be.

- Uses Platform Cache: session or org
- Whole-IP response caching or a Cache Block around steps
- TTL in minutes; entries vary by input
- Needs allocated cache partition; no sensitive data in org cache

<sub>Also asked as: What is a Cache Block in an Integration Procedure? · Session cache vs org cache in OmniStudio · how to cache external api responses in omnistudio · Does OmniStudio use platform cache?</sub>

### How do you call Apex from an OmniScript or Integration Procedure?
*Mid (3–6 yrs) · code* · `omni-012`

You use a Remote Action element. It calls an Apex class and method by name, passes data from the data JSON as input, and merges the output back. On the standard runtime the class implements the Callable interface, so it receives an action name and an args map containing the input, output and options maps. In older managed-package orgs you'll see the namespaced VlocityOpenInterface2 interface instead, where the invokeMethod method takes the method name and the same input, output and options maps. Say an OmniScript needs a delivery date worked out by some tricky logic. The Remote Action passes the postcode and order size, my class reads them from input, puts the date into output, and the script picks it up. Inside, I keep the logic bulk-safe, run queries in user mode, and return clean keys the OmniScript can use. I usually call it from an Integration Procedure, so it's combined with other steps in one server trip.

- Remote Action element: class name + method name
- Callable: call(action, args) with input/output/options
- Managed package: VlocityOpenInterface2.invokeMethod
- Enforce sharing and user mode

```java
global with sharing class AccountRiskService implements System.Callable {

    global Object call(String action, Map<String, Object> args) {
        Map<String, Object> input = (Map<String, Object>) args.get('input');
        Map<String, Object> output = (Map<String, Object>) args.get('output');
        Map<String, Object> options = (Map<String, Object>) args.get('options');
        switch on action {
            when 'getRiskScore' {
                return getRiskScore(input, output, options);
            }
            when else {
                throw new IllegalArgumentException('Unsupported action: ' + action);
            }
        }
    }

    private Boolean getRiskScore(Map<String, Object> input,
                                 Map<String, Object> output,
                                 Map<String, Object> options) {
        Id accountId = (Id) input.get('AccountId');
        Integer openCases = [
            SELECT COUNT() FROM Case
            WHERE AccountId = :accountId AND IsClosed = false
            WITH USER_MODE
        ];
        output.put('openCaseCount', openCases);
        output.put('riskLevel', openCases > 5 ? 'High' : 'Low');
        return true;
    }
}
```

<sub>Also asked as: What is a Remote Action in OmniStudio? · Write an Apex class for an OmniScript Remote Action · omnistudio callable interface apex example · What is VlocityOpenInterface2?</sub>

### What types of elements can you use in an OmniScript?
*Fresher (0–2 yrs) · concept* · `omni-013`

OmniScript elements fall into a few groups. Group elements organise the screen: a Step is a page, a Block groups fields, an Edit Block lets users add and edit a list of records, and there are Radio Group and Type Ahead Block. Input elements capture data, like Text, Email, Date, Number, Checkbox, Radio, Select and Multi-select. Display elements show content, like Text Block and Line Break. Function elements include Formula, Aggregate and Messaging. Any element can be shown or hidden with conditional view. Action elements do the work: Data Mapper actions, Integration Procedure Action, Remote Action, HTTP Action, Set Values, Set Errors, Navigate Action and DocuSign. So in a simple address change journey, I'd have a Step with a Block of Text inputs, a Formula to build the full address, an Integration Procedure Action to save it, and a Navigate Action at the end. And when standard elements aren't enough, you can embed a custom Lightning Web Component.

- Group: Step, Block, Edit Block, Radio Group, Type Ahead Block
- Inputs, display and functional elements
- Actions: Data Mapper, IP, Remote, HTTP, Set Values, Navigate
- Custom LWC element for special UI

<sub>Also asked as: List the OmniScript element types · What action elements are available in OmniScript? · omniscript step block edit block elements · What is the difference between a Step and a Block?</sub>

### What is the data JSON in an OmniScript and how do merge fields work?
*Mid (3–6 yrs) · code* · `omni-014`

The data JSON is the single JSON object that holds everything in an OmniScript: parameters passed in, like ContextId, data returned from actions, and values the user enters. Each step creates a node named after the step, and each element writes its value under it, so the structure mirrors the script. To use a value elsewhere, I reference it with merge field syntax: percent signs around the path, with colons for nesting, like %CustomerInfo:FirstName% or %ContextId%. Actions send part or all of this JSON as input and merge responses back in. Keeping it small with the send and response JSON path settings helps performance, and in preview I can watch it change live.

- One JSON holds params, action results and user input
- Step name = node; element name = key
- Merge fields: %Step:Element%
- Trim with Send/Response JSON Path

```java
{
  "ContextId": "<record Id passed from the page>",
  "CustomerInfo": {
    "FirstName": "Asha",
    "Email": "asha@example.com",
    "Address": { "City": "Pune", "PostalCode": "411001" }
  },
  "SelectProducts": {
    "Plan": "Gold",
    "Quantity": 5
  }
}
// Text Block:  Hello %CustomerInfo:FirstName%, you chose %SelectProducts:Plan%.
```

<sub>Also asked as: How does OmniScript store data between steps? · Explain merge field syntax with percent signs · omniscript data json structure · How do I reference a value from a previous step in OmniScript?</sub>

### How do you debug OmniStudio components?
*Fresher (0–2 yrs) · troubleshooting* · `omni-015`

Each designer has a preview mode, and that's where I start. In an OmniScript preview I watch the data JSON panel and use the action debugger to see the exact request and response for every action. For an Integration Procedure, the preview lets me pass test input and see each step's output and the debug log, which quickly shows which step returned empty or failed. Data Mappers have their own preview where I enter a record Id or input JSON and check the result. FlexCards can be previewed with a test record. If Apex is involved I use debug logs, and for runtime issues on a page, the browser console. Most bugs turn out to be a wrong JSON path or missing input.

- OmniScript preview: data JSON + action debugger
- IP preview: per-step output and debug log
- Data Mapper and FlexCard previews with test input
- Common cause: wrong JSON path or missing input

<sub>Also asked as: How do you troubleshoot an OmniScript? · Where can I see the request and response of an Integration Procedure? · omniscript action debugger preview · My Data Mapper returns nothing, how do I debug it?</sub>

### How do you deploy OmniStudio components between orgs?
*Mid (3–6 yrs) · concept* · `omni-016`

It depends on the runtime. On the standard runtime, OmniStudio components are standard metadata, like OmniScript, OmniIntegrationProcedure, OmniDataTransform for Data Mappers and OmniUiCard for FlexCards. So once OmniStudio metadata support is enabled in settings, I deploy them with Salesforce CLI or a DevOps tool, in the same pipeline as Apex and LWC. On the managed package runtime, components are stored as records, so they move as DataPacks, using the Omnistudio Build Tool, formerly Vlocity Build Tool, from the command line, or the IDX Workbench desktop app. Either way I deploy dependencies first. For example, if a claim OmniScript calls an Integration Procedure that uses two Data Mappers, the Data Mappers go first, then the IP, then the OmniScript. After deployment I confirm the right versions are active.

- Standard runtime: metadata types + Salesforce CLI
- Managed package: DataPacks via Omnistudio Build Tool or IDX Workbench
- Deploy dependencies first; verify active versions

<sub>Also asked as: What are DataPacks? · How do you move OmniScripts from sandbox to production? · idx workbench vs sf cli for omnistudio · Can OmniStudio components be deployed with metadata API?</sub>

### What are the performance best practices for OmniStudio?
*Senior (7–10 yrs) · design* · `omni-017`

My main rule is fewer server trips and smaller payloads. Instead of an OmniScript calling three Data Mappers and an Apex class separately, I combine them into one Integration Procedure. I use Turbo Extract where possible, only return fields the UI needs, and trim the data JSON with response paths or transforms. I cache stable data in IPs with session or org cache. For actions the user doesn't need to wait on, I use non-blocking or fire-and-forget invoke modes. I avoid loading everything on the first step and fetch data when a step needs it. For heavy processing, I use the chainable or queueable settings in IPs to stay within limits. And on the managed package, I convert Angular OmniScripts to LWC.

- Combine calls into one IP
- Turbo Extract, minimal fields, trimmed JSON
- Cache stable data; non-blocking invoke modes
- Chainable/queueable settings for heavy work

<sub>Also asked as: How do you make OmniScripts and FlexCards faster? · OmniStudio performance tips · how to reduce server calls in omnistudio · Best practices for Integration Procedures at scale</sub>

### What is the difference between the OmniStudio managed package and the standard runtime?
*Senior (7–10 yrs) · comparison* · `omni-018`

The original OmniStudio came as a managed package from Vlocity. It uses namespaces like vlocity_ins or vlocity_cme, components are stored as records, and you deploy through DataPacks. The standard runtime runs OmniStudio natively on the core platform, with standard designers and the standard object model, so components are real metadata deployed with Salesforce CLI. Salesforce positions the standard runtime as faster, both in the designer and at runtime, and it gives access to newer features like Integration Procedure actions for Agentforce and better support for LWR sites in Experience Cloud. So if a team wants an Agentforce agent to reuse an existing Integration Procedure, that's a strong reason to be on the standard runtime. To move across, Salesforce provides the Omnistudio Migration Assistant, a Salesforce CLI plugin, to assess and convert components.

- Managed package: namespaced, record-based, DataPacks
- Standard runtime: native metadata, standard designers, SF CLI
- Newer features land on the standard runtime
- Migration Assistant (CLI plugin) assesses and converts

<sub>Also asked as: OmniStudio on core vs Vlocity managed package · What are standard designers in OmniStudio? · should we move omnistudio from managed package to standard · What does Omnistudio Hybrid mean?</sub>

### How do FlexCard data sources, states and actions work together?
*Fresher (0–2 yrs) · concept* · `omni-019`

The data source decides where the card's data comes from, like a Data Mapper, an Integration Procedure, Apex, SOQL, a REST call or streaming. It usually takes the recordId as input, and if it returns a list, the card repeats for each record. States are alternative layouts with conditions, and the card shows the state whose conditions match. Actions are buttons or menu items that launch an OmniScript, navigate to a record, call an Integration Procedure, update data or publish events. Here's how they fit together. Say a card on the account shows each of its contracts. The data source returns a list, so you get one card per contract. An Active state shows normally, an Overdue state shows a warning, and a Renew action launches an OmniScript. Child cards can be embedded for related lists, and session variables pass values between the parent card and its children.

- Data source with recordId input; lists repeat the card
- States = conditional layouts
- Actions: OmniScript, navigate, IP, events
- Child cards and session variables

<sub>Also asked as: What are FlexCard states? · What data sources can a FlexCard use? · flexcard child card and session variables · How do you show a different layout on a FlexCard based on data?</sub>

### The business needs a component inside an OmniScript that standard elements can't provide, like a custom product picker. How would you build it?
*Senior (7–10 yrs) · scenario* · `omni-020`

I'd build a custom Lightning Web Component and add it with the Custom Lightning Web Component element. So the component can read and write OmniScript data, it extends the OmniScript base mixin that OmniStudio provides, which gives it access to the data JSON, methods like omniUpdateDataJson to write values back, and methods to move between steps. I pass configuration through element properties, keep the component focused on UI, and let an Integration Procedure handle server logic. On the managed package the import path uses the package namespace, so I check that before any move to the standard runtime. I also make it accessible and responsive, because these often run on customer-facing Experience Cloud sites.

- Custom Lightning Web Component element
- Extend the OmniScript base mixin
- omniUpdateDataJson to write back to the data JSON
- Watch namespace imports when migrating

<sub>Also asked as: Embed a custom LWC in an OmniScript · What is the OmniScript base mixin? · how does a custom lwc update omniscript data json · Custom Lightning Web Component element in OmniScript</sub>

### How would you design a multi-step OmniScript that lets an agent create a quote for a customer?
*Mid (3–6 yrs) · scenario* · `omni-021`

I'd design it as four steps. Step one, Customer: the script is launched from the account with ContextId, and a Turbo Extract or IP prefills customer details. Step two, Products: a type-ahead or selectable items list fed by an IP that returns eligible products and prices, possibly using a Decision Matrix for eligibility. Step three, Review: an IP or Expression Set calculates totals and discounts, with Set Errors if the discount is above the allowed limit. Step four, Confirm: an IP creates the quote and quote lines through a Load Data Mapper, or calls the quoting API, returns the quote Id, and a Navigate action opens it. Each server interaction is one IP call.

- Customer -> Products -> Review -> Confirm
- Prefill from ContextId; eligibility via Decision Matrix
- Set Errors for discount limits
- IP + Load to create quote; Navigate to it

<sub>Also asked as: Build a quoting wizard with OmniScript · Multi step quote OmniScript design · omniscript to select products and create quote · How to structure an OmniScript for quote creation</sub>

### You need an account summary card on the account page with key details and actions like Create Case and Update Address. How would you build it?
*Fresher (0–2 yrs) · scenario* · `omni-022`

I'd build a FlexCard. For the data source I'd use an Integration Procedure, or a simple Turbo Extract if it's one object, that takes the recordId and returns account name, tier, open case count and last order date. On the canvas I lay those out as fields, with a state condition that highlights the card when there are open escalations. Then I add actions: one launches a Create Case OmniScript in a modal with the account Id passed in, and another launches an Update Address OmniScript. After an OmniScript finishes, I make sure the card reloads so it shows the latest values. Finally I activate it and add it to the account Lightning record page.

- Data source: IP or Turbo Extract with recordId
- Fields plus a highlight state
- Actions launch OmniScripts with the account Id
- Reload after completion; activate and place on page

<sub>Also asked as: Build an account summary FlexCard with actions · FlexCard that launches an OmniScript · show account details and buttons on a flex card · How to add a Create Case action on a FlexCard</sub>

### You need to show data from a slow, rate-limited external API in an OmniScript. How would you design it?
*Senior (7–10 yrs) · scenario* · `omni-023`

I'd put the callout inside an Integration Procedure instead of calling from the browser. The IP takes the inputs, uses an HTTP Action with a named credential for authentication, then a Transform maps the response to clean keys, and a Response Action returns only what the OmniScript needs. Because the API is slow and rate-limited, I wrap the HTTP step in a Cache Block or enable IP response caching: org cache for shared data like exchange rates, session cache for customer-specific data, with a sensible TTL. I add a try-catch block and a friendly fallback message for failures, and the OmniScript calls the IP once with a single action. Callouts also need to happen before any DML in the same transaction.

- IP with HTTP Action + named credential
- Transform and Response Action to shape output
- Cache Block or IP caching with suitable TTL
- Try-catch and fallback message

<sub>Also asked as: Call an external REST API from OmniStudio with caching · Integration Procedure HTTP action with cache · how to avoid hitting api rate limits from omniscript · Show exchange rates from an external service in OmniScript</sub>

### An OmniScript takes several seconds to load each step and users are complaining. How would you troubleshoot and fix it?
*Senior (7–10 yrs) · scenario* · `omni-024`

I'd open the OmniScript in preview with the browser network tab and the action debugger to see how many server calls each step makes and how long each one takes. Common causes are several separate Data Mapper or Remote actions on one step, large payloads because the whole data JSON is sent with every action, slow external callouts, and heavy Extracts returning fields nobody uses. The fixes are to combine calls into one Integration Procedure, use Turbo Extract, send and return only the nodes needed with the JSON path settings, cache stable data, and use non-blocking invoke modes where the user doesn't need to wait. If it's an Angular OmniScript, converting it to LWC helps too. Then I retest with realistic data.

- Measure calls per step with network tab and action debugger
- Combine actions into one IP
- Trim payloads; Turbo Extract; caching
- Non-blocking modes; Angular -> LWC

<sub>Also asked as: OmniScript is slow · How to speed up a slow OmniScript · omniscript performance issue each step loading · Users complain OmniScript steps take too long</sub>

### Discount eligibility depends on customer tier, region and contract length, and the business changes the rules every quarter. How would you implement it in OmniStudio?
*Mid (3–6 yrs) · scenario* · `omni-025`

I'd keep the rules in the Business Rules Engine instead of code. A Decision Matrix holds the combinations: inputs Tier, Region and Contract Length band, output Discount Percent, maintained by the business from a spreadsheet. If the logic is more than a lookup, for example the discount is capped based on deal size, an Expression Set calls the matrix and applies the extra calculation. The OmniScript or Integration Procedure calls the Expression Set with the customer's values and uses the result. Each quarter the business creates a new version with an effective date, so changes go live without a deployment, and the previous version remains available for audit.

- Decision Matrix for the lookup combinations
- Expression Set for extra calculation
- New version with effective date each quarter
- No deployment needed for rule changes

<sub>Also asked as: Business-maintained eligibility rules in OmniStudio · Use a decision matrix for discount rules · rules change every quarter without deployment · Expression set calling a decision matrix example</sub>

### How do you prefill an OmniScript with data from the record it's launched from?
*Fresher (0–2 yrs) · scenario* · `omni-026`

When an OmniScript is launched from a record page or a FlexCard action, it receives the record Id as ContextId in the data JSON. I add a Data Mapper Extract action or an Integration Procedure action before or on the first step, passing ContextId as the input, for example AccountId equals %ContextId%. The Extract's output paths are named to match the OmniScript structure, like CustomerInfo:FirstName, so the values land in the right fields automatically. If the names don't match, I fix it in the Data Mapper's output mapping rather than adding extra Set Values. Then I test in preview with a real record Id and check the data JSON.

- ContextId carries the launching record Id
- Extract or IP action at the start
- Output paths match step:element names
- Test in preview with a real record Id

<sub>Also asked as: Prepopulate OmniScript fields from the record · How does ContextId work in OmniScript? · omniscript prefill using dataraptor extract · Load account data into OmniScript on start</sub>

### At the end of an OmniScript you need to create an account, its primary contact and an opportunity together. How would you do it?
*Mid (3–6 yrs) · scenario* · `omni-027`

I'd create one Load Data Mapper, called from an Integration Procedure, so all three are saved in one server call. In the Load I list Account first, then Contact and Opportunity, and link both children to the account so the new Account Id flows into their AccountId fields automatically. I map the OmniScript JSON paths to each field and use upsert keys if the script can also edit existing records. If there's validation or a duplicate check, I do it in the IP before the Load, return any errors to the OmniScript, and show them with Set Errors. Finally the IP returns the new account Id, and a Navigate action takes the user to the record.

- One Load Data Mapper with linked objects
- Called from an IP; validation before the Load
- Return errors to the script; Navigate at the end

<sub>Also asked as: Save multiple related records from OmniScript · Insert account contact and opportunity with one Data Mapper · omniscript submit create parent and child records · Best way to save OmniScript data to several objects</sub>

### An Integration Procedure saves a record and then calls an external system, and it fails with an 'uncommitted work pending' error. What's wrong and how do you fix it?
*Senior (7–10 yrs) · scenario* · `omni-028`

That's the standard Apex rule showing up inside OmniStudio: an Integration Procedure runs in one transaction, and you can't make a callout after DML in the same transaction. Here the Load step runs before the HTTP action, so the callout fails. The simplest fix is to reorder: make the callout first, then save the record with its result. If the order really must stay, I move the callout into a separate transaction, for example with the IP's queueable or chainable options, or with Queueable Apex or a platform event fired after the save. I also wrap the callout in a try-catch block, return a clear failure response, and log the error so support can retry.

- Root cause: callout after DML in one transaction
- Fix: callout first, then DML
- Or split into a separate async transaction
- Try-catch, clear failure response, logging

<sub>Also asked as: You have uncommitted work pending error in Integration Procedure · Callout after DML in OmniStudio · integration procedure http action fails after data mapper load · How to handle errors and callouts in an Integration Procedure</sub>

### Your org uses the OmniStudio managed package and leadership wants to move to the standard runtime. How would you approach it?
*Senior (7–10 yrs) · scenario* · `omni-029`

I'd run it as a project with an assessment first. Salesforce provides a migration assistant as a Salesforce CLI plugin, with an Assess mode that produces a readiness report and a Migrate mode that converts components to the standard data model. I'd rerun Assess until it's clean. Typical manual work: converting Angular OmniScripts to LWC, renaming components whose names clash once underscores and special characters are removed, renaming reserved keys like request or response in IPs, moving calculation procedures and matrices to the Business Rules Engine, and redeploying custom LWCs that import from the package namespace. Industry-specific Vlocity objects aren't converted automatically, so they need separate planning. Then I switch deployments to Salesforce CLI and regression-test every journey.

- Migration assistant: Assess, then Migrate
- Angular -> LWC, naming clashes, reserved keys
- Calculation procedures -> Business Rules Engine
- Industry objects need separate planning; switch to SF CLI

<sub>Also asked as: Migrate OmniStudio from Vlocity package to standard runtime · What is the Omnistudio migration assistant? · omnistudio migration tool assess and migrate · What breaks when moving OmniStudio to the standard data model?</sub>

### A FlexCard launches an OmniScript to update data, but after the user finishes, the card still shows old values. How do you fix it?
*Mid (3–6 yrs) · scenario* · `omni-030`

The card isn't reloading its data source after the OmniScript completes. First I make sure the OmniScript is launched from a FlexCard action with the record Id passed as ContextId. Then I make the card refresh when it's done: a common approach is to have the OmniScript publish an event at the end and give the FlexCard an event listener that reloads the card, or to navigate back to the record so the page reloads. I'd also check caching, because if the card's Integration Procedure caches responses, the card can reload and still get stale data, so I'd shorten the TTL or skip caching for that call.

- Card must reload its data source after the update
- OmniScript publishes an event; FlexCard listener reloads
- Or navigate back to refresh the page
- Check IP caching for stale data

<sub>Also asked as: FlexCard not refreshing after OmniScript · Reload FlexCard data after an action · flexcard shows stale data after update · How to refresh a FlexCard from an OmniScript</sub>
