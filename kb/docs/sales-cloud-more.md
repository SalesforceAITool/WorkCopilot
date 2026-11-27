# Sales Cloud: lifecycle, features and scenarios

60 questions. Levels: Fresher (0–2 yrs) 21 · Mid (3–6 yrs) 24 · Senior (7–10 yrs) 15

## Sales Cloud Lifecycle

### Walk me through the sales lifecycle in Salesforce.
*Fresher (0–2 yrs) · concept* · `salesx-001`

I'd sum it up as lead, opportunity, closed deal, then orders, contracts and renewals. That's the sales lifecycle in Salesforce. Take a laptop distributor. A buyer fills in a web form, so a Lead is created and the assignment rule gives it to a rep. The rep calls, updates Lead Status, and once budget and need are confirmed, converts the lead. That creates an Account, a Contact and an Opportunity. On the opportunity the rep adds products from a price book, adds contact roles, and moves through stages like Qualification and Proposal. They create a Quote, sync it, send the PDF, and when the customer signs, the deal goes to Closed Won. After that an Order and a Contract handle fulfilment, and before the contract ends a renewal opportunity starts the cycle again. When I onboard people onto a sales org, I make sure everyone knows which object owns each step, because that's where data issues show up.

- Lead capture, assignment, qualification, conversion
- Opportunity: stages, products from a price book, contact roles
- Quote and sync, then Closed Won
- Order and Contract for fulfilment, renewal opportunity at the end

<sub>Also asked as: Explain the Sales Cloud lifecycle end to end · what is the sales cycle in salesforce from lead to close · Sales Cloud life cycle kya hai, step by step batao · How does a deal flow through Sales Cloud from start to finish?</sub>

### Explain lead-to-cash in Salesforce.
*Mid (3–6 yrs) · concept* · `salesx-002`

Lead-to-cash is the whole revenue journey, from the first marketing touch until the money is collected, and I always frame it as a chain of handoffs. Salesforce covers most of it, usually with an ERP or billing system at the end. Picture an industrial pump maker. Marketing runs a trade-show Campaign, and badge scans become Leads that get routed to reps. Qualified leads convert into an Account, Contact and Opportunity. The rep adds products from the price book, creates a Quote, gets discount approval, and closes the deal. Closed Won creates an Order with order products, plus a Contract with a start date and term. The order goes to the ERP for shipping and invoicing, and payment status comes back to Salesforce. What I pin down first on any project is where each handoff happens and which system owns the data at each step, because that is where lead-to-cash usually breaks. I'd get the business and the ERP team to sign off on that ownership map before anyone builds.

- Campaign and Lead, then conversion to Account, Contact, Opportunity
- Products, price book, Quote, approvals, Closed Won
- Order and Contract, then ERP or billing for invoice and payment
- Be clear on which system owns which data at each handoff

<sub>Also asked as: What is the lead to cash process? · Walk me through L2C in Sales Cloud · lead 2 cash flow in salesforce with objects · How does a lead finally become revenue in Salesforce?</sub>

### What is the difference between lead-to-cash and quote-to-cash?
*Mid (3–6 yrs) · comparison* · `salesx-003`

Simply put, quote-to-cash is a slice of lead-to-cash. Lead-to-cash starts with marketing and lead capture; quote-to-cash starts when the rep is ready to price a deal. For a software company, lead-to-cash covers the webinar, the lead, qualification, the opportunity and everything after. Quote-to-cash covers configure, price, quote, approve, contract, order, invoice and revenue recognition. Plain Sales Cloud gives you quotes, orders and contracts, but not configuration rules or billing. For those, companies used Salesforce CPQ, which is now end-of-sale but still supported for existing customers, so new projects look at Revenue Cloud Advanced or hand billing to an ERP. When I scope a project I spell out which parts the standard objects handle and where another product or system takes over, so nobody gets surprised by a licence conversation halfway through.

- Lead-to-cash: marketing to payment
- Quote-to-cash: pricing to invoice and revenue recognition
- Standard Sales Cloud covers quotes, orders, contracts
- CPQ is end-of-sale; Revenue Cloud Advanced or ERP for billing

<sub>Also asked as: Lead to cash vs quote to cash · Is quote-to-cash part of lead-to-cash? · L2C versus Q2C in salesforce · Where does quote to cash start and end?</sub>

### What happens after an opportunity is Closed Won?
*Fresher (0–2 yrs) · concept* · `salesx-004`

Closed Won ends the sales part, but in most orgs it's really the start of fulfilment. Salesforce itself just sets probability to 100 percent and puts the deal in the Closed forecast category; everything else is process you design. Say a furniture supplier wins a deal for office chairs. A record-triggered flow creates an Order with the same products, a Contract for the one-year service agreement, and a handoff task for the delivery team. An integration sends the order to the ERP for invoicing. Many companies also lock the closed deal so reps can't change the amount, and create a renewal opportunity for next year. What I check in code review: the automation must fire only when the stage changes to Closed Won, not on every later edit of the closed record.

- Probability 100, forecast category Closed
- Typical automation: Order, Contract, handoff tasks, ERP sync
- Often lock closed deals and create a renewal
- Trigger only on the change to Closed Won

<sub>Also asked as: What do you do once a deal is won in Salesforce? · After closed won what is the next step · How does the handoff from sales to delivery work? · Closed won ke baad kya hota hai?</sub>

### What are Orders in Sales Cloud and how does order activation work?
*Fresher (0–2 yrs) · concept* · `salesx-005`

An Order records what the customer agreed to buy, and its Order Products are the line items with quantity and price. It needs an account and a start date, plus a price book before you add products, and usually links to the opportunity, quote or contract it came from. Orders must be enabled in Setup first. A new order starts as Draft, where you can add or change products. When it's confirmed, you set the status to Activated, and from then the products are locked; to take things away you use reduction orders if they are turned on. Example: a coffee machine wholesaler closes a deal for 20 machines. The order is created in Draft, operations checks stock, then activates it and the ERP picks it up for shipping. My rule on the team is to tie integrations to activation, not creation, so nothing reaches the ERP while the order can still change.

- Order needs account and start date; price book before adding products
- Draft: editable; Activated: products locked
- Reduction orders for removing items after activation
- Trigger ERP sync on activation

<sub>Also asked as: Explain Order and Order Products in Salesforce · What is the difference between a draft and an activated order? · how do orders work in sales cloud · Can you change products after an order is activated?</sub>

### What are Contracts in Sales Cloud and how do they relate to orders?
*Fresher (0–2 yrs) · concept* · `salesx-006`

A Contract is the agreement with an account: start date, term in months, status and the agreed terms. Salesforce works out the end date from the start date and term. Contracts move through statuses like Draft, In Approval Process and Activated, and you can put an approval process on them. An order can point to a contract, so one agreement can cover many orders. For example, a hospital signs a two-year supply contract with a medical equipment seller, and every monthly order for gloves and masks links to that contract. The Owner Expiration Notice field emails the contract owner ahead of the end date, which helps with renewals. Standard contracts don't handle pricing or billing schedules; that needs Revenue Cloud or an ERP. So when a client asks for pricing or billing on the contract, I'm upfront that it's a product decision, not just a few custom fields.

- Contract: account, start date, term, status
- End date calculated from start date and term
- Many orders can link to one contract
- Owner Expiration Notice helps renewals

<sub>Also asked as: Explain the Contract object in Salesforce · How are contracts and orders connected? · contract status draft activated in salesforce · What is Owner Expiration Notice on a contract?</sub>

### How do renewals fit into the Sales Cloud lifecycle?
*Senior (7–10 yrs) · concept* · `salesx-007`

My position is that renewals close the loop: when a contract nears its end, it should become pipeline again, not a reminder email. In standard Sales Cloud I model a renewal as its own opportunity with Type set to Renewal, linked to the account and the original contract. Take a SaaS company selling yearly licenses. The contract ends on 31 March, so ninety days before, a scheduled flow creates a renewal opportunity with the same products and a close date on the contract end. It shows in the forecast, Pipeline Inspection flags it if nothing moves, and reps work it like any deal. I keep renewals separate from new business, with Type or a record type, so leadership can report retention against growth. If the client needs auto-renewing subscriptions, co-terming or proration, Revenue Cloud fits better than custom automation. I'd make that call early, because moving renewal logic off custom automation later is a big rework.

- Renewal = separate opportunity, Type Renewal
- Created ahead of contract end by scheduled flow
- Separate renewal and new business in reports and forecast
- Subscriptions, co-terming, proration point to Revenue Cloud

<sub>Also asked as: How do you manage renewals in standard Sales Cloud? · renewal opportunity process salesforce · How should renewals show up in the forecast? · What is the best way to track contract renewals without CPQ?</sub>

### How do you qualify a lead in Salesforce before converting it?
*Fresher (0–2 yrs) · concept* · `salesx-008`

Qualification is the rep checking whether a lead is worth an opportunity, and in Salesforce you capture it with Lead Status and a few qualification fields. Many teams use BANT: budget, authority, need and timeline. Say a dental clinic asks about scheduling software. The rep calls, logs it as a task, and fills fields like Budget Confirmed, Decision Maker and Expected Timeline. Status moves from Open to Working to Qualified, and then the rep converts. If it turns out to be a student doing research, the rep marks it Unqualified with a reason instead. On my teams I put the qualification fields in as Path key fields so they are right in front of the rep, and report on unqualified reasons so marketing can improve targeting.

- Lead Status tracks progress: Open, Working, Qualified, Unqualified
- Qualification fields such as BANT
- Path key fields keep them visible
- Report on unqualified reasons

<sub>Also asked as: What is lead qualification? · How does a rep decide a lead is qualified? · BANT in salesforce lead process · qualified vs unqualified lead, how do you track it?</sub>

### Walk me through the life of an opportunity from creation to close.
*Fresher (0–2 yrs) · concept* · `salesx-009`

An opportunity is created from lead conversion or directly on an account, and it moves through the stages of its sales process until it's Closed Won or Closed Lost. Take a contractor selling solar panels. The deal starts at Prospecting with a rough amount and close date. In Qualification, the rep adds contact roles, like the facilities manager as decision maker. In Needs Analysis and Proposal they add products from the price book, so the amount becomes the sum of the line items, and they create a quote. In Negotiation there may be a discount approval. Finally it closes. Along the way each stage sets the probability and forecast category. Path guidance tells reps what's needed at each stage, and validation rules stop them skipping the important parts. When I review a sales process, I check that those rules match what managers actually inspect, otherwise reps just learn to work around them.

- Created by conversion or on an account
- Stages from the sales process drive probability and forecast category
- Contact roles, products, quote along the way
- Path guidance plus validation rules for discipline

<sub>Also asked as: Explain the opportunity lifecycle · How does an opportunity move from prospecting to closed won? · opportunity stages flow in salesforce with example · What happens at each opportunity stage?</sub>

### How would you design an end-to-end lead-to-cash process for a manufacturer that invoices from SAP?
*Senior (7–10 yrs) · design* · `salesx-010`

I'd keep Salesforce as the system for selling and SAP as the system for fulfilment and money, and design the handoffs carefully. First, master data: products and prices come from SAP into products and price book entries on a schedule, keyed by external Id, and customers sync with an SAP customer number on the account. Then the front end: leads from forms and events, assignment, qualification and conversion. Deals use opportunities with products and quotes with discount approvals. When the deal is Closed Won, a flow creates the Order, and activating it publishes a platform event or calls middleware that creates the sales order in SAP. SAP sends back the order number, delivery and invoice status. The decisions I'd get signed off before build: one owner per field, upserts by external Id so retries are safe, an error queue with retry, and a clear rule for what happens when SAP rejects an order. I'd also agree with the SAP team who watches that error queue, because an integration nobody owns is where these projects usually hurt.

- SAP masters products, prices, invoicing; Salesforce owns selling
- External Ids on product, account, order
- Order activation triggers integration via event or middleware
- Status flows back; idempotent upserts and error handling

<sub>Also asked as: Design lead to cash with Salesforce and an ERP · Salesforce plus SAP order to cash design · Which system owns what in a Salesforce ERP lead-to-cash flow? · how would you integrate closed won deals with SAP for invoicing</sub>

### Where do standard Sales Cloud quotes end and CPQ or Revenue Cloud begin?
*Senior (7–10 yrs) · comparison* · `salesx-011`

My line is: stay on standard Sales Cloud quotes while pricing is simple. They're fine when you pick products from a price book, apply a discount and generate a PDF. Once you need configuration rules, bundles, volume or tiered pricing, multi-year subscriptions or proration, standard quotes run out. Example: an office printer company selling single printers can live with standard quotes. If it starts selling printer plus toner subscription plus a service plan, where some options require others, that's a configure-price-quote problem. Salesforce CPQ handled that, but it's end-of-sale now: existing customers are still supported, and new implementations go to Revenue Cloud Advanced. Before recommending either, I'd check whether a couple of flows and validation rules on standard quotes would do, because those products add real cost and complexity. I put that trade-off to stakeholders in terms of licence cost and admin effort, not a feature list.

- Standard quotes: price book, discount, PDF, sync
- Bundles, rules, tiers, subscriptions need CPQ-type tools
- CPQ end-of-sale; successor Revenue Cloud Advanced
- Check if light automation is enough first

<sub>Also asked as: When do you need CPQ instead of standard quotes? · Standard quotes vs Salesforce CPQ vs Revenue Cloud · Is Salesforce CPQ still sold? · client asks for bundles and tiered pricing, standard quote enough?</sub>

### How does a quote turn into an order in standard Sales Cloud?
*Fresher (0–2 yrs) · concept* · `salesx-059`

In standard Sales Cloud the chain is Opportunity, then Quote with Quote Line Items, then Order with Order Products, and often a Contract. The rep creates one or more quotes from the opportunity, syncs the one the customer is considering, and sends the PDF. When the customer accepts, the quote status becomes Accepted and the deal is closed. Standard quotes have no built-in quote-to-order conversion, so the order is created by a flow or custom action that copies the quote lines into order products; the order needs an account and the same price book. Example: a kitchen equipment supplier quotes a restaurant two ovens and a fridge, the owner accepts, and an order with those three lines goes to the warehouse. Because that conversion is custom, I make sure it's documented and tested like any other integration point.

- Opportunity, Quote and lines, Order and products, Contract
- Sync the quote the customer is considering
- Accepted quote leads to Closed Won and an order
- Order needs an account and the same price book

<sub>Also asked as: Quote to order process without CPQ · How do you create an order from an accepted quote? · quote line items to order products · What happens after the customer accepts a quote?</sub>

## Sales Cloud

### What are the main features of Sales Cloud?
*Fresher (0–2 yrs) · concept* · `salesx-012`

Sales Cloud is Salesforce's CRM for running the sales process from first lead to closed deal. The main pieces are lead management with Web-to-Lead, assignment rules and conversion; accounts and contacts; opportunities with stages, sales processes and Path; products, price books and quotes; Collaborative Forecasts with quotas; Sales Territories (formerly Enterprise Territory Management); campaigns for marketing attribution; activities and email and calendar sync with Einstein Activity Capture; Sales Engagement cadences; reports and dashboards; and AI such as opportunity scoring, Pipeline Inspection insights and Agentforce for sales. For example, a car dealership group could capture website enquiries as leads, route them to the right showroom, track each deal as an opportunity and forecast monthly sales. With a stakeholder I'd name the features briefly, then tie two or three to their real business need, because that's what gets a roadmap agreed.

- Leads, accounts, contacts, opportunities
- Products, price books, quotes, forecasts, territories
- Campaigns, activities, Sales Engagement
- Reports, dashboards, AI and Agentforce

<sub>Also asked as: What are the key features of Salesforce Sales Cloud? · Tell me about Sales Cloud features · sales cloud mein kya kya features hote hain · What does Sales Cloud give a sales team out of the box?</sub>

### What is the difference between a Lead and an Opportunity?
*Fresher (0–2 yrs) · comparison* · `salesx-013`

A lead is someone who might buy but hasn't been qualified yet; an opportunity is a real, qualified deal with an amount, a close date and a stage. A lead is one standalone record holding both person and company details. An opportunity sits under an account and links to contacts through contact roles. Example: a gym owner downloads a brochure from a fitness equipment seller, and that's a lead. When the rep confirms the gym wants ten treadmills next quarter and has budget, they convert the lead, and the ten-treadmill opportunity is what goes into the pipeline and forecast. Leads never show up in the forecast. Some B2B teams skip leads for existing customers and create opportunities straight on the account. On a team I'd agree that rule once and write it down, so reps don't mix both approaches.

- Lead: unqualified, standalone, not in forecast
- Opportunity: qualified deal with amount, close date, stage
- Conversion turns one into the other
- Existing customers often skip the lead step

<sub>Also asked as: Lead vs opportunity in Salesforce · When does a lead become an opportunity? · difference between lead and opportunity with example · Why do we need both leads and opportunities?</sub>

### What is Expected Revenue on an opportunity?
*Fresher (0–2 yrs) · concept* · `salesx-014`

Expected Revenue is a read-only standard field that equals Amount times Probability. Probability comes from the stage by default, though reps can edit it. Say a solar installer has a 100,000 dollar opportunity in Proposal, and Proposal is mapped to 60 percent. Expected Revenue shows 60,000. Managers use it for a weighted view of the pipeline, so ten early-stage deals don't count as much as two in Negotiation. The catch is that it's only as honest as the probability. If every deal sits on default stage percentages, the weighted pipeline can look healthier than it is, which is why many teams rely more on forecast categories or opportunity scoring. When I set up forecasting, I review the stage probabilities with sales leadership instead of leaving the defaults.

- Expected Revenue = Amount x Probability
- Probability defaults from the stage
- Used for weighted pipeline
- Only as good as the probability values

<sub>Also asked as: How is expected revenue calculated? · amount times probability field in salesforce · What is weighted pipeline? · Expected revenue vs amount</sub>

### What is an account hierarchy and when would you use it?
*Fresher (0–2 yrs) · concept* · `salesx-015`

An account hierarchy links accounts as parent and child through the Parent Account field, so you can see a group company and its subsidiaries together. Example: a hotel chain has a head office account and a separate account for each hotel, because each hotel buys and is invoiced on its own. Setting head office as the parent lets the key account manager open View Account Hierarchy and see the whole group, and reports can group opportunities by parent. Two things to remember: the hierarchy doesn't share records by itself, so the parent's owner doesn't automatically see child accounts' deals; you need sharing, account teams or territories for that. And rolling amounts up several levels needs a flow or Apex, because roll-up summary fields don't work on lookups. I raise the sharing point early, because business users usually assume the hierarchy grants access.

- Parent Account lookup builds the hierarchy
- View Account Hierarchy shows the group
- No automatic sharing from parent to child
- Multi-level roll-ups need flow or Apex

<sub>Also asked as: What is Parent Account in Salesforce? · How do you link subsidiaries to a head office account? · view account hierarchy explained · Does the parent account owner see child account deals?</sub>

### Can a contact be related to more than one account?
*Fresher (0–2 yrs) · concept* · `salesx-016`

Yes, and it's the approach I push for over duplicate contacts. With the setting that lets users relate a contact to multiple accounts turned on, a contact keeps one primary account through the normal Account field, and you add other accounts through Account Contact Relationships. Example: an independent consultant works with three manufacturing clients. Her contact sits under her own consultancy, and she's related indirectly to the three manufacturers with a role like Advisor, so she appears in each one's Related Contacts list. You can add custom fields on the relationship, like her role there or start date. That's much better than creating three copies of her contact, which splits activity history and breaks email sync. The primary account still drives things like contact access through the account.

- One primary (direct) account per contact
- Extra accounts via Account Contact Relationship (indirect)
- Roles and custom fields on the relationship
- Avoids duplicate contacts

<sub>Also asked as: What is Account Contact Relationship? · contacts to multiple accounts salesforce · How do you handle a consultant who works with several customers? · Direct vs indirect contact relationship</sub>

### What is the difference between the role hierarchy and the territory hierarchy?
*Mid (3–6 yrs) · comparison* · `salesx-017`

The role hierarchy is about who reports to whom; the territory hierarchy is about how the market is split. A user has exactly one role, and access rolls up the role tree based on who owns the record. With Sales Territories (formerly Enterprise Territory Management), accounts are assigned to territories by rules on fields like country or industry, users can sit in several territories, and access comes from territory membership instead of ownership. Example: at a medical device company, a rep might cover both the North India hospitals territory and the national diagnostic labs territory. With roles alone she'd see only what she owns; with territories she sees every account in both, and so does the manager above in the territory tree. Most orgs use both, and that's what I'd recommend: roles for management and approvals, territories for account access and territory forecasts.

- Role: one per user, access follows ownership
- Territory: many per user, access follows assignment rules
- Accounts can sit in several territories
- Usually both are used together

<sub>Also asked as: Role hierarchy vs territory hierarchy · When would you use territories instead of roles? · Can a user be in more than one territory? · roles versus sales territories for access</sub>

### What is Pipeline Inspection?
*Fresher (0–2 yrs) · concept* · `salesx-018`

Pipeline Inspection is a pipeline view on the Opportunities tab that shows a team's deals with key metrics and what changed recently. A manager picks a period and team and sees totals by forecast category, plus changes like new deals, increased or decreased amounts, and deals moved in or out of the period. Changes to amount, close date, stage or forecast category in the past week are highlighted, and it shows things like days in stage and how many times the close date was pushed. With Einstein features on, it adds opportunity scores and deal insights. Example: a sales manager at a logistics company opens it on Monday and sees three Commit deals had their close dates pushed. Setup: enable it in opportunity settings, turn on historical trending for opportunities, and assign the Pipeline Inspection permission set. I put those setup steps on the go-live checklist so managers have it ready for their first weekly review.

- Metrics by forecast category for a period and team
- Weekly changes highlighted: amount, close date, stage, category
- Push count, days in stage, scores, insights
- Needs historical trending and a permission set

<sub>Also asked as: Explain Pipeline Inspection in Sales Cloud · pipeline inspection kya hai · How do managers see weekly pipeline changes? · What does the pipeline inspection view show?</sub>

### How does Einstein Opportunity Scoring work and what does the rep see?
*Mid (3–6 yrs) · concept* · `salesx-019`

Einstein Opportunity Scoring is a predictive model that learns from your org's past won and lost deals and scores each open opportunity on how likely it is to win. The rep sees the score on the record, in list views and in Pipeline Inspection, along with the main factors pushing it up or down, such as recent activity, deal age compared with similar won deals, or how often the close date moved. Example: a rep at an HR software company has two similar 50,000 dollar deals. One scores high because the customer replies quickly and a VP is a contact role; the other scores low because its close date slipped twice. That tells the rep where to spend the week. Two expectations I set with leadership: it needs enough closed history to be useful, and the score is for prioritising, not something to plug straight into the forecast.

- Model trained on your won and lost history
- Score plus top positive and negative factors
- Visible on record, list views, Pipeline Inspection
- Needs enough history; a guide, not the forecast

<sub>Also asked as: Explain opportunity scoring · What is an Einstein score on an opportunity? · how does einstein predict which deals will close · Should we put the opportunity score in the forecast?</sub>

### What is Einstein Activity Capture and what are its limitations?
*Mid (3–6 yrs) · concept* · `salesx-020`

Einstein Activity Capture connects reps' Gmail or Microsoft mailboxes and calendars to Salesforce and adds emails and meetings to the activity timeline of related leads, contacts, accounts and opportunities without manual logging. Example: a rep at an insurance broker emails a client and books a call; both appear on the client's account timeline automatically. The limitation I flag to the business first: unless the option to sync email as Salesforce activity is turned on, captured emails live outside the normal activity records, so they don't work well in standard reports, flows or triggers. Other points: it can't run alongside Lightning Sync, which is being retired, captured data has retention limits, and admins should set exclusions for sensitive addresses. For Microsoft orgs, the connection must use Microsoft Graph now that Microsoft is shutting off Exchange Web Services, so check that during setup. I'd get the reporting expectation agreed before rollout, because that gap is what causes complaints later.

- Auto-captures email and calendar to the timeline
- Without email-as-activity sync, weak for reports and automation
- Not alongside Lightning Sync; retention limits
- Exclusions for sensitive addresses; Microsoft Graph connection

<sub>Also asked as: Explain Einstein Activity Capture · EAC limitations for reporting · How do emails from Gmail or Outlook get into Salesforce automatically? · einstein activity capture vs logging emails manually</sub>

### What is the difference between Opportunity History and field history tracking?
*Mid (3–6 yrs) · comparison* · `salesx-021`

Opportunity History is tracked automatically for key deal fields like stage, amount, probability, close date and forecast category; field history tracking is something you switch on for a limited set of fields you choose. Example: a manager asks when a 40,000 dollar deal dropped to 25,000. The Opportunity History related list shows each amount change with the date and user. If the question is who changed a custom Delivery Region field, you need field history tracking on that field. For pipeline over time, neither is ideal; I'd use historical trend reporting or reporting snapshots. Also, standard field history isn't kept forever, so when there's an audit requirement some clients add Field Audit Trail from Shield or log changes into a custom object. So I ask about audit requirements at design time rather than after go-live.

- Opportunity History: automatic for stage, amount, close date and similar
- Field history: opt-in, limited number of fields
- Trend reporting or snapshots for pipeline over time
- Field Audit Trail for long retention

<sub>Also asked as: Opportunity History related list vs field history · How do you see who changed the amount on a deal? · Which opportunity fields are tracked automatically? · stage history vs field audit in salesforce</sub>

### How do reps see and manage their pipeline in Salesforce?
*Fresher (0–2 yrs) · concept* · `salesx-022`

Reps mostly work their pipeline from opportunity list views, the Kanban view and Pipeline Inspection, with reports and dashboards for the bigger picture. Kanban shows deals as cards grouped by stage, so a rep at a printing company can drag the school brochure deal from Proposal to Negotiation and see the total amount in each column. List views with inline edit are good for quickly fixing close dates. Pipeline Inspection shows weekly changes and scores. And a My Pipeline dashboard shows open amount by stage and close month. One thing I warn reps about: dragging a card in Kanban still runs validation rules, so if a stage needs a field filled in, the move fails and the rep sees the error.

- Kanban: cards by stage, drag to move
- List views with inline edit
- Pipeline Inspection and dashboards
- Validation rules still apply on drag

<sub>Also asked as: What is the Kanban view for opportunities? · How can a rep see all open deals by stage? · pipeline view for sales reps in lightning · Best way for reps to update many opportunities quickly?</sub>

## Sales Cloud Scenarios

### Sales reps say leads from the website are not reaching them. How would you troubleshoot it?
*Fresher (0–2 yrs) · troubleshooting* · `salesx-023`

I'd first find out whether the leads aren't being created at all, or are created but assigned to the wrong place. I submit a test on the website form myself. If no lead appears, I check the Web-to-Lead basics: is it still enabled, does the form post to the right org Id, have we hit the daily limit of 500, and is a validation rule, required field or duplicate rule blocking the insert. If the lead is created but owned by the wrong user, I look at the active lead assignment rule: does any entry match, do the criteria use values the form actually sends, like IN versus India, and is the entry order right. Unmatched leads go to the Default Lead Owner in Lead Settings, often an admin nobody watches. Afterwards I'd add a dashboard of unassigned web leads so this gets noticed early. And I'd make sure the Default Lead Owner is a queue someone actually owns.

- Submit a test form first
- Not created: Web-to-Lead enabled, org Id, 500 per day, validation or duplicate rules
- Wrong owner: assignment rule criteria and entry order
- Unmatched leads go to the Default Lead Owner

<sub>Also asked as: Web to lead leads are not getting assigned to reps · Website form submissions are not creating leads, what do you check? · leads from the website are going to the admin instead of sales · Why are web leads missing in Salesforce?</sub>

### A sales manager wants the forecast by region. How would you set that up?
*Senior (7–10 yrs) · design* · `salesx-024`

First I ask what region means for them, because the setup depends on whether region follows the people or the customers. If each rep belongs to one region, I use the role hierarchy as the forecast hierarchy: Head of Sales, then regional managers like North, South and West, then reps, and enable those managers as forecast managers. Each manager sees their region's rollup and the VP sees everything. If region follows the customer and reps cover more than one region, I use Sales Territories (formerly Enterprise Territory Management) and a territory-based forecast type, so each deal counts in the territory on the opportunity. I'd get the VP to confirm which of those is the source of truth before building, because changing it mid-year confuses how managers read their numbers. Then I load quotas per region and check that stages map correctly to forecast categories. Quick win while it's being built: an opportunity report grouped by the account's region, filtered to Commit and Best Case.

- Clarify: region by rep or by customer
- By rep: role-based forecast hierarchy with forecast managers
- By customer: territory-based forecast type
- Load quotas per region; report as a stopgap

<sub>Also asked as: How do you build a regional forecast in Collaborative Forecasts? · Forecast by territory instead of role · manager wants to see forecast for north south east west · Regional forecast with quotas, how?</sub>

### The client wants to stop reps from moving an opportunity to Closed Won unless it has a quote. How would you do it?
*Mid (3–6 yrs) · code* · `salesx-025`

I'd use a validation rule that checks for a synced quote, because the synced quote is the one that matches the opportunity's products. If a rep saves an opportunity as Closed Won and SyncedQuoteId is blank, they get a clear message. Example: a security camera installer wants every won deal backed by the quote the customer saw, so the rep creates the quote, syncs it, and then closes. I'd give sales ops a custom permission to bypass it for genuine exceptions. If they need the quote to be Accepted, not just present, I'd have a record-triggered flow on Quote tick a checkbox on the opportunity when the synced quote's status becomes Accepted, and validate on that checkbox instead. In review I also check the error message tells the rep exactly what to do, so they aren't raising tickets.

- Check SyncedQuoteId on Opportunity
- Fire on create and on stage change
- Custom permission for exceptions
- For Accepted status, flow sets a checkbox to validate on

```java
AND(
  OR(ISNEW(), ISCHANGED(StageName)),
  ISPICKVAL(StageName, "Closed Won"),
  ISBLANK(SyncedQuoteId),
  NOT($Permission.Bypass_Quote_Check)
)
/* Error: Create and sync a quote before closing this opportunity as won. */
```

<sub>Also asked as: Validation rule to require a quote before closed won · Rep should not close a deal without a synced quote · block closed won if there is no quote on the opportunity · How do you enforce quote before closing an opportunity?</sub>

### Two reps share a deal, but the second rep cannot edit the opportunity and gets no credit. What would you do?
*Mid (3–6 yrs) · scenario* · `salesx-026`

I'd give the second rep access through the opportunity team and credit through splits, and leave ownership alone. Example: a rep in Mumbai owns a deal with a pharma company, but a rep in Bengaluru handles the customer's plant there. With team selling on, the owner adds the Bengaluru rep to the opportunity team with a role like Co-Seller and Read/Write access, which fixes the editing problem straight away. For credit, I enable Opportunity Splits and set a revenue split, say 60-40, which has to total 100 percent. A forecast type based on revenue splits then shows each rep their share. If this happens on every deal for that customer, I'd use account teams or a default opportunity team so nobody has to remember. I'd agree the split rules with sales ops up front, because credit disputes are a people problem as much as a config one.

- Opportunity team member with Read/Write fixes access
- Revenue split for credit, totals 100 percent
- Split-based forecast type shows each share
- Account teams or default teams for repeat cases

<sub>Also asked as: Co-selling rep cannot edit the shared opportunity · How do two reps work one opportunity together? · second salesperson needs edit access and part of the revenue · Shared deal between two regions, access and credit</sub>

### You need to migrate 300,000 leads from an old CRM into Salesforce. How would you plan it?
*Senior (7–10 yrs) · scenario* · `salesx-027`

I treat it as clean, map, load, verify, with a full rehearsal in a sandbox. First I clean the source: remove junk, dedupe on email, and fix country and state values to match our picklists. Then I map fields and statuses, say old status Hot to Working, and owners by matching email or username to Salesforce users. I add a Legacy_Id__c external Id so reloads can upsert instead of creating duplicates. Before loading, I turn off assignment rules and use a bypass switch for flows and triggers, so the load doesn't send emails or reassign anyone. I use Data Loader with the Bulk API, since the Data Import Wizard stops at 50,000 records. If they want original created dates kept, I enable Set Audit Fields upon Record Creation. Afterwards I reconcile counts and have the business spot-check records. And I'd get a go or no-go sign-off from the business on the sandbox rehearsal before touching production.

- Clean and dedupe before loading
- Map fields, statuses, owners; external Id for upserts
- Bypass automation and assignment during load
- Data Loader Bulk API; keep audit dates if needed; reconcile

<sub>Also asked as: Lead data migration approach · How do you load a large volume of leads from another CRM? · migrating leads from hubspot or zoho into salesforce steps · What do you turn off before a big lead import?</sub>

### Reps keep creating duplicate accounts when they convert leads. How would you stop it?
*Mid (3–6 yrs) · scenario* · `salesx-028`

I'd fix this with matching and visibility, not just more training. The convert screen already lets reps pick an existing account, so the fix is making the match obvious and making duplicates harder. Example: a lead comes in from Acme Pvt Ltd while the account is Acme Private Limited, the rep doesn't notice, and creates a new one. I'd do three things. First, an Account matching rule using fuzzy company name plus website, and a duplicate rule that alerts or blocks on account creation; I'd confirm in a sandbox that it fires during conversion in their setup. Second, a flow or enrichment tool that finds the likely account and shows it on the lead before conversion, like 'Existing customer: Acme Private Limited'. Third, merge the duplicates that already exist. I'd also keep a weekly report of accounts created through conversion to catch misses.

- Account matching and duplicate rules
- Show the matched account on the lead before converting
- Merge existing duplicates
- Report on accounts created by conversion

<sub>Also asked as: Lead conversion is creating duplicate accounts · How do you make reps convert into the existing account? · duplicate account after lead convert · Existing customer lead converted into a new account again</sub>

### After conversion, the business wants the opportunity to get the right record type and some values that are not on the lead. How would you handle it?
*Mid (3–6 yrs) · scenario* · `salesx-029`

Lead field mapping only copies fields that exist on the lead, so anything else needs automation on the new opportunity. Example: an equipment rental company wants converted opportunities to use the New Business record type, the India price book and a name like Company - Rental - Month. The opportunity record type follows the converting user's default, so I'd set that default for the reps who convert. For the rest, I add a checkbox on Lead that defaults to true, map it to a From_Lead__c checkbox on Opportunity, and a before-save record-triggered flow on Opportunity checks it to set the name format and price book. Standard and custom values that do exist on the lead are mapped per object in Map Lead Fields, so I use that first and automation only for what mapping can't do. In review I'd check that flow only acts on create, so later edits don't rename the opportunity.

- Map Lead Fields first for values that exist on the lead
- Record type comes from the converting user default
- Mapped flag field identifies converted opportunities
- Before-save flow sets name, price book and defaults

<sub>Also asked as: Set opportunity fields during lead conversion that do not exist on the lead · How do you control the opportunity record type on lead convert? · default price book and name format for converted opportunities · lead conversion mapping is not enough, what next?</sub>

### Sales leadership wants to realign territories mid-year. How would you do it without breaking things?
*Senior (7–10 yrs) · scenario* · `salesx-030`

I'd build the new alignment in a separate territory model and switch at a quiet time, rather than editing the live one. In Sales Territories (formerly Enterprise Territory Management) only one model can be active, so I clone the active model to get a copy in Planning state. In the copy I change territories, assignment rules and user assignments; for example, a manufacturer splitting its West region into West Industrial and West Retail. I run the rules in Planning and use reports to compare old and new account assignments with sales ops and managers. Then, right after a month or quarter close, I archive the old model, activate the new one, and rerun opportunity territory assignment. I warn leadership that archiving deletes the old model's territory forecasts and quotas and clears territories on opportunities, so I export forecasts and assignments first. I'd also brief reps before the switch, since some will see accounts move overnight.

- Clone active model into Planning
- Change territories, rules, users; run rules and compare
- After a period close, archive the old model, then activate the new one
- Export forecasts first; rerun opportunity territory assignment

<sub>Also asked as: How do you do territory realignment in Sales Territories? · Change territory model safely · ETM realignment steps, planning model then activate · What happens to forecasts when you activate a new territory model?</sub>

### New leads sit untouched for hours. The business wants them reassigned if nobody acts within 2 hours. How would you build it?
*Mid (3–6 yrs) · scenario* · `salesx-031`

I'd use a record-triggered flow on Lead with a scheduled path, since escalation rules only exist for cases, not leads. The flow runs when a lead is created with Status New, and its scheduled path fires two hours after the created date. When it runs, a decision checks the lead is still New and still owned by the same rep; if so, it reassigns the lead to the round-robin queue and notifies the manager. Example: a car dealership gets a test-drive request at 10 am; if the rep hasn't touched the status by 12, it moves to the next available salesperson. The decision at run time matters because the lead may have changed since it was created. I'd also stamp a First Response Time field so management can see the SLA by rep. Before building, I'd agree with the business whether the two hours means business hours, because that changes the design.

- Escalation rules are only for cases
- Record-triggered flow with a scheduled path
- Re-check status and owner when the path runs
- Track first response time for reporting

<sub>Also asked as: Lead SLA, reassign if not contacted in time · Lead escalation if the rep does not respond · how to auto reassign leads after 2 hours · Can you use escalation rules on leads?</sub>

### Leads created by an integration are not being assigned by the assignment rules. How do you fix it?
*Mid (3–6 yrs) · code* · `salesx-032`

The fix is in the integration code, because assignment rules don't run automatically for Apex or SOAP API inserts; the caller has to ask for them. In the UI there's the Assign using active assignment rule checkbox, Web-to-Lead uses the active rule on its own, and the Data Import Wizard has an option for it. Data Loader takes the assignment rule Id in its settings. The standard REST API is the exception: it applies the active rule by default, and the Sforce-Auto-Assign header turns that off or names a rule. In Apex I set DMLOptions with useDefaultRule = true before the insert. Example: a marketing tool pushes leads through a custom Apex service and they all end up owned by the integration user. Adding the DML options sends every lead through the same routing as web leads. I'd also make it a review checklist item for any new lead integration, because this one is easy to miss in testing.

- Apex and SOAP API inserts must request assignment; REST applies it by default
- Data Loader: rule Id in settings; REST: Sforce-Auto-Assign header controls it
- Apex: Database.DMLOptions assignmentRuleHeader
- Same routing for every lead source

```java
public with sharing class LeadIntakeService {
    public static List<Database.SaveResult> createLeads(List<Lead> leads) {
        Database.DMLOptions dmo = new Database.DMLOptions();
        dmo.assignmentRuleHeader.useDefaultRule = true; // run the active lead assignment rule
        dmo.optAllOrNone = false;                       // keep good rows if some fail
        return Database.insert(leads, dmo);
    }
}
```

<sub>Also asked as: Assignment rules not firing for API created leads · How do you run lead assignment rules from Apex? · leads inserted by apex all owned by integration user · DMLOptions assignment rule header example</sub>

### Reps keep pushing close dates out every month. How would you deal with it in Salesforce?
*Mid (3–6 yrs) · scenario* · `salesx-033`

I'd make the pushing visible first, then add a little friction. Pipeline Inspection already shows a push count and highlights close date changes, so I'd get managers using it in weekly reviews. Then I'd add a Close Date Push Count field that a before-save flow increments whenever the close date moves into a later month, plus a Push Reason picklist and comment that a validation rule requires when the date moves out. Example: an industrial chemicals rep moves a big deal from September to October to November; each push now needs a reason like customer budget delay, and the manager sees the count on a dashboard. I wouldn't block pushes outright, because real delays happen and blocking just teaches reps to enter fake dates. I'd agree the push reasons with sales managers so they're the ones enforcing it, not the admin team.

- Pipeline Inspection shows push count and changes
- Flow increments a push counter
- Validation requires a reason when the date moves out
- Don't block pushes; make them visible

<sub>Also asked as: Opportunities keep slipping to next month · How do you track how many times a close date was pushed? · reps keep changing close date, manager is unhappy · Stop sandbagging close dates on opportunities</sub>

### Reps are skipping stages, jumping from Prospecting straight to Negotiation. How would you stop that?
*Mid (3–6 yrs) · code* · `salesx-034`

I'd use a validation rule that gives each stage a number and blocks a jump of more than one step forward. Moving backward is allowed, and Closed Lost is allowed from any stage, since a deal can die at any point. Example: at a construction supplies company, a rep tries to go from Prospecting straight to Negotiation and gets the message 'Please complete Qualification and Proposal first'. I'd add a custom permission so sales ops can bypass it during data fixes. Two things I check in review: keep the stage names in the formula in sync with the picklist, and if there are several sales processes with different stages, either add their stages or check the record type in the rule.

- Number each stage with CASE
- Compare with TEXT(PRIORVALUE(StageName))
- Allow backward moves and Closed Lost
- Bypass via custom permission

```java
AND(
  ISCHANGED(StageName),
  NOT(ISPICKVAL(StageName, "Closed Lost")),
  NOT($Permission.Skip_Stage_Rules),
  CASE(StageName,
    "Prospecting", 1, "Qualification", 2, "Proposal", 3,
    "Negotiation", 4, "Closed Won", 5, 0)
  -
  CASE(TEXT(PRIORVALUE(StageName)),
    "Prospecting", 1, "Qualification", 2, "Proposal", 3,
    "Negotiation", 4, "Closed Won", 5, 0)
  > 1
)
```

<sub>Also asked as: Validation rule to prevent skipping opportunity stages · Force reps to move one stage at a time · opportunity stage should go in sequence · How do you enforce stage order with PRIORVALUE?</sub>

### A rep says they cannot edit the Amount on an opportunity. Why?
*Fresher (0–2 yrs) · troubleshooting* · `salesx-035`

The most common reason is that the opportunity has products. Once it has opportunity line items, Amount becomes the sum of their total prices and is read-only. Example: a rep at a furniture company adds 50 chairs and 5 desks, the amount becomes 12,000, and when the customer asks for 11,000 the rep can't type it in. The right fix is to change the sales price or discount on the line items. If there are no products, I'd check field-level security on Amount for their profile and permission sets, whether the page layout makes it read-only, whether an approval process has locked the record, and whether a validation rule blocks the change. Logging in as the user is the quickest way to confirm. I'd also explain the products rule to the sales team, because it saves a lot of tickets.

- With products, Amount = sum of line items, read-only
- Change the line item price or discount instead
- Otherwise: field-level security, layout, approval lock, validation
- Log in as the user to confirm

<sub>Also asked as: Opportunity amount field is read only · Why is amount locked on my opportunity? · cannot change opportunity amount after adding products · Rep wants to type a different amount but the field is greyed out</sub>

### Prices go up next year. How do you update price books without disturbing open deals?
*Mid (3–6 yrs) · scenario* · `salesx-036`

I'd handle it with a new price book rather than editing the old one. Changing a list price on a price book entry doesn't touch products already on opportunities; they keep their sales price, so the real question is switching new deals over cleanly. For a medical supplies company raising prices on 1 January, I'd create a new price book, like 2027 Domestic, load the new entries with Data Loader using product external Ids, and activate it on the day. Then I make the old price book inactive so new deals can't choose it. Open opportunities stay on the old book unless sales wants to reprice them, and changing an opportunity's price book removes all its products, so I'd warn reps or do it with a script that re-adds the lines. I don't delete old entries; entries in use can't be removed anyway, and deactivating is enough. The decision on repricing open deals belongs to sales leadership, so I'd get that agreed before the date.

- Existing line items keep their sales price
- New price book loaded and activated on the date
- Deactivate, do not delete, old entries
- Changing an opportunity price book removes its products

<sub>Also asked as: Annual price increase in Salesforce price books · How do you handle new prices from January? · changing list price affects existing opportunities? · Price book versioning for a yearly price change</sub>

### The business wants branded quote PDFs with different terms for India and US customers. How would you do it?
*Fresher (0–2 yrs) · scenario* · `salesx-037`

I'd build two quote templates, one per region, and show reps which one to pick. In Setup under Quote Templates, I clone the standard template, add the logo image and a header with company details, set up the line item table with the fields they want, and add a text section for terms. The India template might show GST details and INR wording, and the US one different payment terms. Example: a rep at an electronics distributor creates a quote for a Pune customer, clicks Create PDF, picks the India template, and emails it from the quote. Standard templates don't have conditional sections, so if they need many variants or clauses that change with the deal, I'd look at a document generation tool rather than maintaining ten templates. I'd raise that option early, because template sprawl gets expensive to maintain.

- One quote template per region
- Logo, header, line item table, terms section
- Rep picks template on Create PDF and emails from the quote
- No conditional sections; use document generation for complex needs

<sub>Also asked as: How do you create quote templates? · Different quote PDF layout per region · add company logo and terms to the quote pdf · Quote template for GST details in India</sub>

### Marketing ran a trade show and wants to know how much revenue it produced. How would you set that up?
*Mid (3–6 yrs) · scenario* · `salesx-038`

I'd make the event a Campaign, make the attendees campaign members, tie the resulting opportunities to it, and report on that. Before the show I create the Campaign with Budgeted Cost and member statuses like Registered, Visited Booth and Meeting Booked. Afterwards marketing imports badge scans with the Data Import Wizard straight into the campaign, matching on email so known people aren't duplicated. When reps convert those leads, the campaign becomes the opportunity's Primary Campaign Source, and if several campaigns touched a deal, Customizable Campaign Influence spreads the credit. The campaign's Actual Cost and Value Won Opportunities fields, plus a campaign ROI report, answer the question. Example: a tractor maker spends 20,000 on an agri expo and can see the won deals sourced from it. I'd agree the member statuses with marketing before the event, because changing them after the import is messy.

- Campaign with costs and member statuses
- Import attendees into the campaign, match on email
- Primary Campaign Source on conversion; influence for multi-touch
- Actual Cost vs Value Won Opportunities for ROI

<sub>Also asked as: How do you measure campaign ROI for an event? · Track leads and revenue from a trade show · event leads import into campaign and report on won deals · Which report shows revenue generated by a campaign?</sub>

### Sales leadership wants a mandatory loss reason when a deal is Closed Lost. How would you do it?
*Fresher (0–2 yrs) · code* · `salesx-039`

I'd add a Loss Reason picklist on Opportunity and a validation rule that requires it when the stage is Closed Lost. Example: a software company keeps losing deals and nobody knows why. Now when a rep moves a deal to Closed Lost, they must pick Price, Competitor, No Budget, No Decision or Timing, and if it's Competitor, which competitor. I'd also add Loss Reason as a key field on the Path so the rep fills it while closing. Then a report of lost deals grouped by reason and quarter goes on the sales dashboard. Using a picklist instead of free text is the part I insist on, because you can't report on a text box where everyone writes something different.

- Picklist, not free text
- Validation rule on Closed Lost
- Path key field to make it easy
- Report lost deals by reason

```java
AND(
  ISPICKVAL(StageName, "Closed Lost"),
  ISBLANK(TEXT(Loss_Reason__c))
)
/* Error on field Loss_Reason__c: Pick a loss reason before closing this deal as lost. */
```

<sub>Also asked as: Require a reason when the opportunity is lost · Validation rule for closed lost reason · how to track why deals are lost · Make loss reason required only for closed lost</sub>

### Reps want a scored list of their best leads, but you do not have Einstein. How would you build lead scoring?
*Mid (3–6 yrs) · design* · `salesx-040`

I'd build a simple points model in a before-save flow, with weights agreed by sales and marketing. For an HR software company, points might be: company size over 200 gives 20, a title with HR or People gives 15, lead source Demo Request gives 25, a target country gives 10, and a webinar attendance adds a few more. A number field Lead_Score__c holds the total, and a formula shows Hot, Warm or Cold. Reps get a list view sorted by score. I'd choose a flow over one giant formula because weights are easier to change and it can use related data like campaign membership. Later, Einstein Lead Scoring can learn from real conversions, or Marketing Cloud Account Engagement (formerly Pardot) can add engagement scoring. Whatever we build, I'd review the weights with sales and marketing every quarter.

- Agree points and weights with sales and marketing
- Before-save flow calculates Lead_Score__c
- Formula band: Hot, Warm, Cold; list view sorted by score
- Move to Einstein or Account Engagement scoring later

<sub>Also asked as: Custom lead scoring without Einstein Lead Scoring · How do you prioritise leads with a formula or flow? · lead score field hot warm cold design · Simple points-based lead scoring in Salesforce</sub>

### An SDR team qualifies leads and hands them to account executives. How would you set up the handoff?
*Senior (7–10 yrs) · design* · `salesx-041`

I'd make the handoff a clear status change with routing, and keep a record of who sourced the deal. The SDR works the lead through statuses like Working, then Sales Accepted once a discovery call is booked. That change fires a flow that assigns the lead to the right AE, by territory or round robin, and creates a task with the call notes. The AE converts after the meeting, so the AE owns the opportunity, and an SDR lookup on the lead is mapped to an SDR Sourced field on the opportunity. Example: at a cybersecurity firm, an SDR books a meeting with a bank's IT head; the AE gets it with context, and the SDR still gets credit through that field or an overlay split. Reports then show meetings booked and pipeline sourced per SDR. I'd get SDR and AE managers to agree what Sales Accepted means, because a fuzzy definition is what usually breaks the handoff.

- Status like Sales Accepted marks the handoff
- Flow routes to the AE and creates a context task
- AE converts and owns the opportunity
- Mapped SDR field or overlay split for credit

<sub>Also asked as: SDR to AE lead handoff process · How do inside sales pass leads to closers? · track which SDR sourced the opportunity · Who should convert the lead, SDR or AE?</sub>

### A rep cannot see an account that should be in their territory. What do you check?
*Mid (3–6 yrs) · troubleshooting* · `salesx-042`

I go down the chain: model, account assignment, user assignment, access level. First, is the territory model active, not still in Planning. Second, is the account actually assigned to the territory: I check the account's assigned territories, and for rule-based assignment, whether the criteria match the account's current values and whether rules have run since the account changed. Third, is the rep added as a user on that territory. Fourth, what access the territory grants: access levels for accounts, opportunities and cases are set per territory, so Read account access won't let them edit. Example: a pharma rep moved to the Gujarat territory, but rules weren't re-run after an account's district was corrected, so it still sat in the Rajasthan territory. Running the rules for that account fixed it. I'd also make re-running rules part of the routine whenever ops corrects account data in bulk.

- Is the model Active?
- Is the account assigned, and have rules run since it changed?
- Is the user a member of the territory?
- Check territory access levels for account, opportunity, case

<sub>Also asked as: Territory member cannot access account · Sales territories access not working · account not showing for territory user · ETM user cannot see accounts assigned to territory</sub>

### Leadership wants a Closed Won opportunity to automatically create an order with the same products. How would you build it?
*Senior (7–10 yrs) · code* · `salesx-043`

I'd use an after-save record-triggered flow or Apex on Opportunity that fires only when the stage changes to Closed Won. It creates an Order with the account, the opportunity's price book, an effective date and status Draft, then copies each opportunity product into an Order Product with the same price book entry, quantity and unit price. Example: a packaging supplier closes a deal for three box sizes, and operations immediately sees a Draft order with those three lines to check before activation. Things I'd check in code review: bulk-safe logic, because a data load could close 200 deals at once; a check so reopening and re-closing a deal doesn't create a second order; and if there's a synced quote, copying from the quote lines so negotiated prices win.

- Fire only on change to Closed Won
- Order: account, price book, effective date, Draft
- Order products copy price book entry, quantity, unit price
- Bulk-safe, no duplicate orders

```java
public with sharing class OrderFromOpportunity {
    // Call from an after-update handler with Ids that just moved to Closed Won
    public static void createOrders(Set<Id> oppIds) {
        List<Opportunity> opps = [
            SELECT Id, AccountId, Pricebook2Id, CloseDate,
                (SELECT PricebookEntryId, Quantity, UnitPrice FROM OpportunityLineItems)
            FROM Opportunity
            WHERE Id IN :oppIds
            AND Id NOT IN (SELECT OpportunityId FROM Order WHERE OpportunityId IN :oppIds)];
        Map<Id, Order> orderByOpp = new Map<Id, Order>();
        for (Opportunity o : opps) {
            orderByOpp.put(o.Id, new Order(AccountId = o.AccountId, OpportunityId = o.Id,
                Pricebook2Id = o.Pricebook2Id, EffectiveDate = o.CloseDate, Status = 'Draft'));
        }
        insert orderByOpp.values();
        List<OrderItem> items = new List<OrderItem>();
        for (Opportunity o : opps) {
            for (OpportunityLineItem li : o.OpportunityLineItems) {
                items.add(new OrderItem(OrderId = orderByOpp.get(o.Id).Id,
                    PricebookEntryId = li.PricebookEntryId,
                    Quantity = li.Quantity, UnitPrice = li.UnitPrice));
            }
        }
        insert items;
    }
}
```

<sub>Also asked as: Create order and order products from opportunity on closed won · Copy opportunity line items to order items · auto order creation when deal is won apex · Flow vs Apex to create an order from an opportunity</sub>

### Einstein Activity Capture is on, but managers say activity reports show almost nothing. What would you check?
*Senior (7–10 yrs) · troubleshooting* · `salesx-044`

That usually means captured emails aren't being stored as normal activities, so standard activity reports can't see them. With Einstein Activity Capture, unless the setting to sync email as Salesforce activity is on, emails show on the timeline but live outside the records that reports and flows use. So I check that setting first, remembering that synced emails use data storage. Next I check event sync: events syncing from Outlook or Google into Salesforce become Event records and should report. Then I check who is actually connected, because a rep whose mailbox connection failed captures nothing, and I review the exclusion list. Example: a sales director at a logistics firm sees five calls logged in a week for a team of ten; after turning on email-as-activity sync and reconnecting three mailboxes, the dashboard matched reality. On a rollout I'd agree the storage trade-off with the business before turning email sync on.

- Check the sync email as Salesforce activity setting
- Synced events become Event records
- Check each rep connection status
- Review exclusions in the configuration

<sub>Also asked as: Emails captured by EAC not showing in activity reports · Why are captured emails missing from reports? · activity dashboard empty even though EAC is enabled · EAC emails visible on timeline but not in reports</sub>

### Reps can see each other's opportunities, but the client wants each rep to see only their own. How do you set it up?
*Mid (3–6 yrs) · scenario* · `salesx-045`

I'd set the Opportunity org-wide default to Private and then open access back up on purpose. With Private, a rep sees only the opportunities they own, plus anything the role hierarchy, teams, territories or sharing rules give them. Example: at a real estate developer, reps compete for the same buyers and shouldn't see each other's deals, but managers need their team's, and they get that through the role hierarchy. If reps still see others' deals after the change, I look for what's granting it: sharing rules, territory access levels, View All on Opportunity in a permission set, or account access, since an account owner can get access to opportunities on their account depending on the account sharing settings. Checking Sharing on one record shows exactly why someone has access. I'd test with a few real users in a sandbox before switching the default, because a change like that can surprise people.

- Opportunity OWD Private
- Managers see team deals via role hierarchy
- Look for sharing rules, territories, View All, account-based access
- Use the record Sharing view to explain access

<sub>Also asked as: Make opportunities private to the owner · Reps should not see other reps' deals · opportunity OWD private but reps still see records · How do managers see team deals when opportunities are private?</sub>

### Marketing gives you a CSV of 5,000 webinar attendees to load as leads and add to a campaign. How would you do it?
*Fresher (0–2 yrs) · scenario* · `salesx-046`

I'd use the Data Import Wizard, because it can create leads, match existing ones and add everyone to a campaign in one go. First I clean the file: fix email formats, standardise country names to match our picklist, and remove junk rows. I create the Campaign, say October Product Webinar, with statuses like Registered and Attended. In the wizard I pick Leads, match on email so people already in Salesforce are updated instead of duplicated, choose the campaign and member status, and decide whether to run the assignment rule so leads go to reps. Example: of 5,000 rows, a chunk match existing leads and the rest are new. One gap: the lead import matches leads, not contacts, so existing customers can come in as new leads; I'd check the file against contacts first. For a recurring load like this, I'd write the steps down so marketing ops can run it themselves.

- Clean the file first
- Data Import Wizard: match on email, add to campaign, member status
- Optionally run assignment rules
- Check against existing contacts too

<sub>Also asked as: Import leads into a campaign from a spreadsheet · Data Import Wizard for webinar leads · how to add imported leads to campaign members · Load event attendees without creating duplicates</sub>

### Your company is merging with another and both have Sales Cloud orgs. How would you plan consolidating the sales data?
*Senior (7–10 yrs) · design* · `salesx-047`

I'd start with decisions, not data: which org survives, whose sales process and stages win, and how roles and territories will look after the merger. Then I map the objects: users, accounts, contacts, leads, opportunities with products, price books, campaigns, activities and files. Example: a paint company buys a smaller coatings firm, and both sell to the same hardware dealers. Duplicate accounts across the two orgs are the biggest problem, so I match on tax Id, website or another shared identifier, agree survivor rules field by field, and keep the old org's record Id in a Legacy_Id__c field. Opportunity stages need a mapping table. Load order matters: users, accounts, contacts, opportunities, line items, then activities. I'd rehearse fully in a sandbox, freeze changes during cutover, and reconcile counts and pipeline totals before go-live. The biggest risk is the decisions, not the scripts, so I'd get those signed off by leadership from both sides first.

- Decide surviving org and target sales process first
- Cross-org account matching and survivor rules
- Legacy Id external fields; stage mapping table
- Load order, sandbox rehearsal, cutover freeze, reconciliation

<sub>Also asked as: Org merge strategy for two Salesforce orgs · How do you migrate accounts and opportunities from an acquired company's org? · merging two sales clouds after an acquisition · Deduplicating accounts across two orgs</sub>

### The lead assignment rule has grown to 300 entries and nobody can maintain it. How would you redesign it?
*Senior (7–10 yrs) · design* · `salesx-048`

I'd move the routing logic out of the rule entries into data the business can maintain, and keep the assignment rule very thin. The usual cause is one entry for every combination of country, product and segment. First I agree the real routing keys with sales ops, say region, company size and product line. Then I put the matrix in custom metadata or a custom object, one row per combination with the target queue, and a before-save flow or Apex handler looks up the row and sets the owner or a routing field. Existing customers go to the account owner or territory first. For an electronics manufacturer that might shrink 300 entries into a small table ops can edit. I'd add a fallback queue, tests for each key, and a report of leads that hit the fallback. The win is ownership: sales ops changes routing without a deployment, and we review the table, not 300 entries.

- Agree a few real routing keys
- Routing matrix in custom metadata or a custom object
- Flow or Apex reads the matrix and sets owner
- Fallback queue, tests, monitoring report

<sub>Also asked as: Lead assignment rules are too big to manage · Better alternative to hundreds of assignment rule entries · metadata driven lead routing design · How do you let sales ops change lead routing without an admin?</sub>

### Inside sales wants every new inbound lead to get a call within an hour and three emails over a week. How would you set it up?
*Mid (3–6 yrs) · scenario* · `salesx-049`

I'd use Sales Engagement with a cadence and add new leads to it automatically. The cadence steps might be: call now, email on day 1, call on day 2, email on day 3, then a final email on day 7, with branches if the call connects or the lead replies. Reps work from their Work Queue, which shows who to contact next and which template or call script to use. To add leads automatically, a record-triggered flow on new inbound leads uses the Assign Target to Cadence action, after assignment has set the owner. Example: a clinic software company gets a demo request at 3 pm, and the rep sees it at the top of the queue with a call script. Exit matters too: when the lead converts or is disqualified, remove it from the cadence so nobody emails a new customer. I'd agree the steps with the inside sales manager and review how the cadence is performing after the first few weeks.

- Cadence with call and email steps and branches
- Reps work from the Work Queue
- Flow action Assign Target to Cadence
- Remove targets on conversion or disqualification

<sub>Also asked as: Sales Engagement cadence for inbound leads · How do you automatically add leads to a cadence? · follow up sequence for new leads in salesforce · Cadence with call and email steps for SDRs</sub>

### Sales managers want their reps to practise negotiation before big meetings. How would you use Agentforce for this?
*Senior (7–10 yrs) · scenario* · `salesx-050`

I'd look at Agentforce Sales Coach, which lets a rep role-play with an AI buyer using the deal's context and then get feedback. The rep opens a big opportunity in Negotiation, starts a role-play, and the agent plays the customer pushing back on price or terms. Afterwards it gives feedback based on best practice for that stage, using the CRM data on the deal. Example: a rep at an industrial automation company practises handling 'your competitor is cheaper' the day before the meeting. For setup it needs Agentforce, Einstein generative AI and Data 360, and it's configured in Agentforce Builder, where you can adjust the subagents and prompt templates to the company's sales method. I'd pilot with one team, review feedback quality with managers, and push for good opportunity data, because the coaching is only as good as the record. I'd also be clear with managers that it supports their coaching, it doesn't replace it.

- Role-play with an AI buyer, then stage-based feedback
- Uses opportunity context from CRM
- Needs Agentforce, Einstein generative AI, Data 360
- Pilot one team; data quality matters

<sub>Also asked as: What is Agentforce Sales Coach and how would you roll it out? · AI role play for sales reps in Salesforce · reps want to rehearse a pitch with AI · Setup needed for Agentforce Sales Coach</sub>

### The client wants to sell product bundles but does not have CPQ. What would you do?
*Senior (7–10 yrs) · design* · `salesx-051`

My first move is to find out how complex the bundles really are, because standard Sales Cloud has no bundle concept. If a bundle is a fixed package, like a Starter Kit with a camera, tripod and bag at one price, I'd make it a single product and let the ERP break it into parts. If reps need to see the components on the deal, I'd add a custom Bundle Component object linking a parent product to its child products, and a flow that adds the child line items at zero price when the parent is added. Example: a solar company's Home Pack automatically adds panel, inverter and installation lines. Once they need options, rules like 'battery requires inverter X', or bundle-level discounting, that's real configuration, and I'd recommend Revenue Cloud Advanced, since Salesforce CPQ is end-of-sale for new customers. I'd show the client where the custom approach stops scaling, so the licence decision is theirs and an informed one.

- Fixed bundle: one product, ERP explodes it
- Visible components: custom junction object plus flow
- Options and rules need a configurator
- Revenue Cloud Advanced for new implementations

<sub>Also asked as: Product bundles in standard Sales Cloud · How do you model kits without CPQ? · parent child products on opportunity without cpq · When do bundles mean you need Revenue Cloud?</sub>

### How would you design Sales Cloud for a manufacturer that sells through dealers and also directly to key accounts?
*Senior (7–10 yrs) · design* · `salesx-052`

I'd separate the two motions with record types and sales processes, but keep one account model so we see the whole customer. Direct key-account deals get an opportunity record type with longer stages like Discovery, Technical Evaluation, Proposal and Negotiation. Dealer business gets a simpler process, maybe deal registration by dealers through Experience Cloud, with the dealer recorded as the partner on the opportunity. Price books split by channel: one for dealers, one for direct. Sharing: opportunities Private, dealers see only their own registered deals, key-account managers get access through account teams. Territories split the market by region and channel. Forecasts use territory or split-based forecast types so dealer managers and key-account managers each see their numbers. Example: a tractor maker sees dealer pipeline by state and key-account pipeline by customer group. Before build, I'd get channel and direct sales leaders in one room to agree the shared account model, since that's the decision everything else rests on.

- Record types and sales processes per channel
- Deal registration via Experience Cloud for dealers
- Channel price books; private sharing; account teams
- Territories and fitting forecast types

<sub>Also asked as: Design for direct and indirect sales channels · Dealer sales and key account sales in one org · channel sales and direct sales opportunity design · How do you separate partner deals from direct deals?</sub>

### Sales ops wants every opportunity past Qualification to have a Decision Maker contact role. How would you enforce it?
*Senior (7–10 yrs) · code* · `salesx-053`

A validation rule can't see related contact roles, so I'd enforce it in a before-update trigger handler, or a flow, when the stage moves past Qualification. The handler collects opportunities whose stage just changed into a later stage, runs one query on OpportunityContactRole for those Ids with Role Decision Maker, and adds an error to any without one. Example: a rep at an ERP software company tries to move a deal to Proposal and sees 'Add the Decision Maker contact role first'. I'd make it easy to comply by putting Contact Roles high on the page and adding Path guidance. A gap I'd call out in review: if someone deletes the contact role later, the opportunity isn't re-checked until the next stage change, so I'd keep a report of open deals missing a decision maker as a backstop.

- Validation rules cannot see related contact roles
- Before-update check with one bulk query
- addError on the opportunity
- Report as a backstop for later deletions

```java
// Called from the Opportunity before update trigger
public with sharing class ContactRoleCheck {
    static final Set<String> LATER = new Set<String>{'Proposal', 'Negotiation', 'Closed Won'};
    public static void run(List<Opportunity> newList, Map<Id, Opportunity> oldMap) {
        Set<Id> toCheck = new Set<Id>();
        for (Opportunity o : newList) {
            if (o.StageName != oldMap.get(o.Id).StageName && LATER.contains(o.StageName)) toCheck.add(o.Id);
        }
        if (toCheck.isEmpty()) return;
        Set<Id> hasDm = new Set<Id>();
        for (OpportunityContactRole r : [SELECT OpportunityId FROM OpportunityContactRole
                WHERE OpportunityId IN :toCheck AND Role = 'Decision Maker']) {
            hasDm.add(r.OpportunityId);
        }
        for (Opportunity o : newList) {
            if (toCheck.contains(o.Id) && !hasDm.contains(o.Id)) {
                o.addError('Add the Decision Maker contact role before moving past Qualification.');
            }
        }
    }
}
```

<sub>Also asked as: Require a contact role before moving the stage · Validation on opportunity contact roles · cannot use validation rule for contact roles, what then? · Block stage change if no decision maker is added</sub>

### Users get an error that opportunity splits must total 100 percent. What is going on?
*Mid (3–6 yrs) · troubleshooting* · `salesx-054`

Revenue split types have to add up to exactly 100 percent across the people on the deal, so the error means the split rows were changed without being rebalanced. Example: a deal is split 50-50 between two reps; the manager edits it to 60 for one rep but leaves the other at 50, and the save fails at 110. The fix is to edit the splits together so they total 100. If it happens during data loads or integrations, the job has to update all split rows for that opportunity together rather than one at a time. And if the person being added is a supporting role like a solutions engineer, they should go on an overlay split, which doesn't have to total 100, instead of taking a share of the revenue split. On my teams, any integration touching splits gets a test that rebalances a deal end to end.

- Revenue splits must total exactly 100 percent
- Edit all split rows together
- Loads must update all rows of an opportunity together
- Supporting roles belong on overlay splits

<sub>Also asked as: Revenue split percentage error on opportunity · Why must opportunity splits add up to 100? · split total not 100 percent error when saving · Data load of opportunity splits failing</sub>

### Leads with no activity for 90 days should go back to marketing for nurturing. How would you automate it?
*Mid (3–6 yrs) · scenario* · `salesx-055`

I'd use a scheduled-triggered flow that runs every night and picks up open leads with no recent activity. The criteria would be Status Open or Working, and either Last Activity Date older than 90 days, or no activity at all and Created Date older than 90 days. For each one, the flow sets Status to Recycled, moves the owner to a Marketing Nurture queue, adds the lead to a nurture campaign as a campaign member, and notifies the previous owner. Example: a B2B furniture company finds 2,000 leads sitting with reps who never followed up; after a month, marketing is nurturing them again. The risk I'd plan for: Last Activity Date only moves with tasks and events, so if reps email through Einstein Activity Capture without email syncing as activity, active leads can look stale. I'd check that before switching it on.

- Nightly scheduled-triggered flow
- Criteria on Status and Last Activity Date
- Set Recycled, move to nurture queue, add to campaign
- Make sure captured emails count as activity

<sub>Also asked as: Recycle stale leads to a nurture queue · Auto close or recycle old leads with no follow up · scheduled flow for inactive leads · Lead recycling process in Salesforce</sub>

### Sales ops wants to know how long deals stay in each stage. How would you report it?
*Mid (3–6 yrs) · scenario* · `salesx-056`

I'd first ask how precise they need it, because that decides the build. Out of the box, opportunity reports have a Stage Duration column for days in the current stage, and the Opportunity History report shows each stage change with dates, so you can see how long a deal sat in Proposal before Negotiation. Pipeline Inspection also shows days in stage for open deals. For averages per stage across closed deals, I'd capture it properly: a before-save flow stamps the date each stage is entered into fields like Proposal_Entered__c, and formulas work out the days between them. Example: a cloud hosting company finds deals spend about six weeks in a legal review stage, so they bring legal in earlier. Date stamps make dashboards easy and still work when a stage is skipped, because the missing date just stays blank.

- Stage Duration for days in the current stage
- Opportunity History report for each change
- Date-stamp fields for averages per stage
- Pipeline Inspection shows days in stage

<sub>Also asked as: Report on time spent in each opportunity stage · Stage duration reporting in Salesforce · how many days do deals sit in proposal · Average days per stage for closed deals</sub>

### A manager wants a dashboard showing each rep's win rate and activities. How would you build it?
*Fresher (0–2 yrs) · scenario* · `salesx-057`

I'd build two reports and put them on one dashboard. For win rate, an opportunity report filtered to deals closed this quarter, grouped by owner, with a summary formula dividing won deals by closed deals using the standard Won and Closed fields. For activities, an activities report grouped by assigned user and type, showing calls, emails and meetings this week. On the dashboard I'd use a bar chart for win rate by rep and a stacked bar for activity types, and either make it a dynamic dashboard or add a filter so each manager sees their own team. Example: a sales head at an insurance agency sees one rep with lots of calls but a low win rate, which points to coaching on qualification rather than effort. I'd agree the win rate definition with the manager first, so nobody argues about the number later.

- Win rate = WON:SUM / CLOSED:SUM summary formula
- Activities report grouped by user and type
- Dynamic dashboard or filter per manager
- Read the two together for coaching

<sub>Also asked as: Win rate report by sales rep · How do you calculate win rate in a Salesforce report? · sales activity dashboard for my team · Dashboard for calls, meetings and deals won per rep</sub>

### A rep converted a lead into the wrong account. Can you undo it?
*Mid (3–6 yrs) · troubleshooting* · `salesx-058`

There's no standard unconvert, so I fix the records the conversion produced rather than trying to reverse it. The converted lead stays read-only with its converted account pointing to the wrong place, and that's fine. Say a rep converted a lead from Sharma Textiles Surat into Sharma Textiles Delhi. I'd change the Account on the contact and on the opportunity to the right account, and re-link any activities whose Related To is the wrong account. If the conversion created a brand-new duplicate account, I merge it into the right one instead. Then I check things that may now be off, like contact roles, opportunity territory and the account owner's pipeline. To prevent repeats, I add duplicate rules on Account and show the matching account on the lead before conversion. I'd also have the rep walk me through what happened, because it often shows a gap in the conversion screen setup.

- No standard unconvert
- Re-parent contact and opportunity; re-link activities
- Merge if a duplicate account was created
- Prevent with duplicate rules and visible matches

<sub>Also asked as: How do you unconvert a lead? · Lead converted to wrong account, how to fix · can we reverse lead conversion in salesforce · Wrong account selected during lead convert</sub>

### A rep says the Convert button is missing on leads. What would you check?
*Fresher (0–2 yrs) · troubleshooting* · `salesx-060`

I'd check permissions first, then the page. To convert, a user needs the Convert Leads permission, plus create access on Account and Contact, and on Opportunity if they create one. Then I look at the page: the Convert action has to be in the Lightning actions section of the page layout assigned to that user's profile and the lead's record type, or on the Lightning record page if it's set up there. If the lead is already converted, there's nothing to convert, so I check that too. Example: a new inside sales rep at a travel company can't see Convert; their permission set gave lead edit but not Convert Leads, and adding it fixed the issue. The quickest check is comparing with a rep who can see the button, or logging in as the user. Then I'd fix the permission set for the whole role, not just that one user.

- Convert Leads permission plus create on Account, Contact, Opportunity
- Convert action on the assigned layout or Lightning page
- Already-converted leads show no Convert
- Compare with a working user or log in as them

<sub>Also asked as: Lead convert button not visible · Why can't a user convert leads? · convert option missing in lightning lead page · Which permission is needed to convert a lead?</sub>
