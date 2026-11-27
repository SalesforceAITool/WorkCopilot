# LWC, Aura and Visualforce

85 questions. Levels: Fresher (0–2 yrs) 30 · Mid (3–6 yrs) 34 · Senior (7–10 yrs) 21

## Lightning Web Components

### What is Lightning Web Components and why is it built on web standards?
*Fresher (0–2 yrs) · concept* · `lwc-001`

LWC is what I'd use for all new UI work. Lightning Web Components is Salesforce's modern UI framework, where you build components with standard HTML, modern JavaScript and CSS. Instead of a proprietary framework layer like Aura, LWC uses what the browser already gives us: custom elements, shadow DOM, ES modules, templates and events. Because the browser does most of the heavy lifting natively, components load and render faster, and the code looks like normal web development, so skills carry over. For example, a JavaScript developer who has never touched Salesforce can read an LWC class on day one, because it's just an ES module exporting a class. Salesforce only adds a thin layer on top for things like security, base Lightning components, Lightning Data Service and the wire service. And LWC and Aura can live on the same page, and an LWC can sit inside an Aura component, but not the other way round. That's also why hiring and onboarding are easier, since general web skills carry straight over.

- Built on web standards: custom elements, shadow DOM, ES modules
- Faster than Aura because the browser does most of the work
- Thin Salesforce layer: base components, LDS, wire service, security
- LWC can be nested inside Aura, not the other way round

<sub>Also asked as: What is LWC? · Explain Lightning Web Components in simple words · Why did Salesforce move from Aura to LWC? · what is l w c framework</sub>

### What files make up a Lightning Web Component bundle?
*Fresher (0–2 yrs) · concept* · `lwc-002`

Simply put, an LWC bundle is a folder named after the component, and normally it has an HTML template, a JavaScript file and a js-meta.xml configuration file. The JavaScript file is required, because it defines the class that extends LightningElement. The HTML file is needed for any component that renders UI, but a service-style module can skip it. The js-meta.xml holds the API version, whether the component is exposed, and its targets, like record page, app page, flow screen or Experience Builder, plus design properties. So for a component called accountCard, I'd have accountCard.js, accountCard.html and accountCard.js-meta.xml inside an accountCard folder. Optional files are a CSS file for scoped styles, an SVG icon for App Builder, and a __tests__ folder for Jest tests. On my teams, that __tests__ folder isn't optional for anything with real logic.

- componentName.js is required and extends LightningElement
- componentName.html for UI components
- componentName.js-meta.xml: apiVersion, isExposed, targets
- Optional: .css, .svg icon, __tests__ folder

<sub>Also asked as: What is inside an LWC folder? · Which files are mandatory in an LWC? · What is the js-meta.xml file used for? · lwc bundle structure</sub>

### Explain the LWC lifecycle hooks and the order in which they run.
*Fresher (0–2 yrs) · concept* · `lwc-003`

There are five hooks, and the order matters most when parents and children depend on each other. LWC gives us five lifecycle hooks: constructor, connectedCallback, renderedCallback, disconnectedCallback and errorCallback. The constructor runs when the component is created. I have to call super() first, and I don't touch child elements or public properties there. connectedCallback runs when the component is inserted into the DOM, so that's where I load data or subscribe to message channels. renderedCallback runs after every render. disconnectedCallback runs when the component is removed, so I clean up listeners and subscriptions there. errorCallback catches errors from child components. The flow is top-down for creation and bottom-up for rendering. So with a parent accountList and a child accountRow, it goes: parent constructor, parent connectedCallback, child constructor, child connectedCallback, child renderedCallback, and only then the parent renderedCallback.

- constructor: call super() first, no DOM or public property access
- connectedCallback: init, load data, subscribe
- renderedCallback: after every render, child before parent
- disconnectedCallback: cleanup; errorCallback: catches descendant errors

<sub>Also asked as: What are lifecycle hooks in LWC? · Order of constructor, connectedCallback and renderedCallback in parent and child · Tell me the life cycle of a lightning web component · what runs first connected callback or rendered callback</sub>

### What is the difference between connectedCallback and renderedCallback, and when would you use each?
*Mid (3–6 yrs) · code* · `lwc-004`

connectedCallback is for setup, renderedCallback is for DOM work, and I keep the second one rare. connectedCallback fires once each time the component is inserted into the DOM, before it renders. So I use it for initialization: reading public properties, calling Apex imperatively, or subscribing to Lightning Message Service. The template elements aren't available there yet. renderedCallback fires after every render, including re-renders caused by reactive changes, so the DOM is available. I use it rarely. A typical case is a third-party chart library that needs a real DOM node to draw into. I initialize it in renderedCallback, and I guard it with a flag like chartInitialized so it only runs once, not on every re-render. One more gotcha: connectedCallback can run more than once if the component is removed and re-inserted, so I don't assume it only ever fires one time. Any renderedCallback without a guard flag gets a question from me in code review.

- connectedCallback: before render, DOM not ready, good for data loading
- renderedCallback: after each render, DOM ready
- Guard renderedCallback with a flag to avoid repeated work

```java
import { LightningElement } from 'lwc';
export default class ChartHost extends LightningElement {
    initialized = false;
    connectedCallback() {
        this.loadData(); // safe: no DOM needed
    }
    renderedCallback() {
        if (this.initialized) return; // run once
        this.initialized = true;
        const canvas = this.template.querySelector('canvas');
        // init third-party chart on canvas here
    }
    loadData() { /* call Apex imperatively */ }
}
```

<sub>Also asked as: connectedCallback vs renderedCallback · Where should I make my Apex call, connected or rendered callback? · Can I access DOM elements in connectedCallback? · when to use rendered callback in lwc</sub>

### My component goes into an infinite rendering loop. What could cause that and how do you fix it?
*Mid (3–6 yrs) · troubleshooting* · `lwc-005`

Almost always, someone is updating a reactive property inside renderedCallback. Changing a field the template uses triggers another render, which calls renderedCallback again, and it loops. Say renderedCallback does this.columns = buildColumns(), and buildColumns returns a new array every time. Each render assigns a new value, which causes another render, forever. A similar loop happens when a getter used in the template changes state, or when a setter on an @api property dispatches an event that makes the parent push a new value back. To fix it, I move data changes out of renderedCallback into connectedCallback, wire handlers or event handlers. If I really need renderedCallback, I use a non-rendered flag so the logic runs only once, and I compare old and new values before assigning, so I never assign a value that hasn't actually changed. This is one pattern I specifically scan for when I review LWC changes.

- Never set template-bound fields unconditionally in renderedCallback
- Use a hasRendered flag or compare values before assigning
- Getters should be pure, no side effects

```java
renderedCallback() {
    if (this.hasRendered) return;
    this.hasRendered = true;
    // one-time DOM work only; do not set reactive fields here
}
```

<sub>Also asked as: Why does renderedCallback keep firing again and again? · LWC infinite loop in renderedCallback · Component keeps re-rendering, how to debug · maximum call stack in lwc rendered callback</sub>

### How does errorCallback work in LWC?
*Mid (3–6 yrs) · code* · `lwc-006`

I use errorCallback to build error boundaries, so one bad widget can't take down a page. It's a lifecycle hook that lets a parent act as an error boundary. It gets two arguments, the error and the component stack. It catches errors thrown in descendant components, in their lifecycle hooks, or in event handlers declared in their templates. It doesn't catch errors from the component itself. And it doesn't catch errors in asynchronous code, like a promise rejection from an Apex call, which I still handle with try/catch or .catch. What I usually do is wrap risky children in a small boundary component. Say a page has five child widgets and one of them throws in its connectedCallback. The boundary's errorCallback catches it, logs it, and shows a friendly "this section couldn't load" message, so one broken child doesn't blank out the whole page. I'd rather the team share one boundary component than each person writing their own.

- Signature: errorCallback(error, stack)
- Catches errors from descendants, not from itself
- Async errors still need try/catch or .catch

```java
import { LightningElement } from 'lwc';
export default class ErrorBoundary extends LightningElement {
    error;
    errorCallback(error, stack) {
        this.error = error.message;
        console.error(error, stack); // or log to a custom object via Apex
    }
}
// html: <template lwc:if={error}><p>{error}</p></template>
//       <template lwc:else><slot></slot></template>
```

<sub>Also asked as: What is an error boundary in Lightning Web Components? · How do I catch errors from child components in LWC? · Explain errorCallback with an example · error call back lwc</sub>

### What are the decorators in LWC and what does each one do?
*Fresher (0–2 yrs) · concept* · `lwc-007`

LWC has three decorators: @api, @track and @wire. @api makes a property or method public, so a parent component, App Builder or a flow can set it. It's reactive, so changes from the parent re-render the child. Common examples are recordId and objectApiName on record pages. @track makes the framework watch changes inside a plain object or array, not just reassignment. Since Spring '20, all class fields are reactive by default, so @track is only needed for deep mutation. @wire connects a property or function to a wire adapter, like an Apex method or getRecord. The framework provisions data and error to it automatically and re-fetches when a reactive parameter changes. So on a record page, I mark recordId with @api, wire getRecord with '$recordId', and the component loads the record by itself whenever that Id changes. In review, I also ask whether each @api property really needs to be public, because every one is a contract other components depend on.

- @api: public, set by parent or builder, reactive
- @track: deep observation of objects and arrays only
- @wire: declarative data from Apex or LDS adapters
- All fields are reactive on reassignment without any decorator

<sub>Also asked as: Explain @api, @track and @wire · What decorators are available in Lightning Web Components? · Difference between api track and wire decorator · at the rate api track wire</sub>

### Is @track still needed in LWC? Explain the reactivity rules.
*Mid (3–6 yrs) · code* · `lwc-008`

Mostly no, and on my teams we prefer reassignment over @track. All fields are reactive, so if I reassign a field that's used in the template, or in a getter the template uses, the component re-renders. What the framework doesn't see by default is a mutation inside an object or array, like pushing to an array or changing one property of an object. Say I have this.filters = { status: 'Open' } and then I do this.filters.status = 'Closed'. Without @track, the UI won't update. So I either decorate the field with @track, or, which I prefer, I assign a new copy with the spread operator: this.filters = { ...this.filters, status: 'Closed' }. Even @track doesn't watch Date, Set or Map internals, so for those I always reassign. And wired data is read-only, so I clone it before changing it.

- Reassignment of any field triggers re-render
- Mutation of object/array props needs @track or a new copy
- @track ignores Date, Set and Map internals
- Prefer immutable updates with spread

```java
contacts = [];
filters = { status: 'Open' };
addContact(c) {
    this.contacts = [...this.contacts, c];          // new array: re-renders
}
setStatus(s) {
    this.filters = { ...this.filters, status: s };  // new object: re-renders
}
```

<sub>Also asked as: When do I still need the track decorator? · How does reactivity work in Lightning Web Components? · Are all fields reactive in LWC? · do we need at track anymore</sub>

### I updated a property on wired data and got an error, or the UI did not refresh. Why?
*Mid (3–6 yrs) · troubleshooting* · `lwc-009`

That's the read-only rule on wired data, and the fix is to copy before you change. Data provisioned by @wire is frozen, so any attempt to change it, such as adding a computed field for a datatable, throws a read-only error. The fix is to make a shallow copy first and work on the copy. The second common reason the UI does not refresh is mutating an array or object in place, for example this.rows[0].Name = 'X', or this.rows.push(row). The framework only reacts to reassignment, so I build a new array with map or spread and assign it back. I also check that the field is actually referenced in the template or in a getter, because changes to unused fields never cause a re-render. These two mistakes are common enough that I cover them when new developers join the team.

- Wired data is read-only: clone before modifying
- In-place mutation does not re-render without @track
- Reassign with map/spread instead

```java
@wire(getContacts, { accountId: '$recordId' })
wired({ data, error }) {
    if (data) {
        this.rows = data.map(c => ({ ...c, url: '/' + c.Id })); // copy, then extend
    } else if (error) {
        this.error = error;
    }
}
```

<sub>Also asked as: Cannot assign to read only property in LWC wire data · Why can't I modify data returned from @wire? · UI not updating after I change an array element in LWC · proxy read only error lwc</sub>

### Can a child component change the value of an @api property passed from its parent?
*Fresher (0–2 yrs) · concept* · `lwc-010`

No, and that's a rule I hold the team to: a child should treat @api properties as owned by the parent. If the parent passes an object or array, it's read-only in the child, and trying to mutate it throws an error. Even for primitives, changing it in the child creates a mismatch, because the parent will overwrite it the next time it re-renders. The clean pattern is one-way data flow: data goes down through @api properties, and changes go up through custom events. Say a parent passes a quantity of 5 to a child quantity picker. When the user clicks plus, the child doesn't set quantity to 6 itself. It dispatches an event with 6, the parent updates its own field, and 6 flows back down. If the child only needs a local editable version, it copies the value into a private field.

- Data down via @api, changes up via events
- Objects passed from parent are read-only in child
- Copy into a private field for local edits

<sub>Also asked as: Should I modify a public property inside the child? · Is @api property read-only in child component? · Child wants to change data that parent passed down, what to do? · can child update api variable</sub>

### How do you call a method on a child component from the parent?
*Fresher (0–2 yrs) · code* · `lwc-011`

I'd expose the method with @api and call it through a reference. I decorate the method in the child with @api, which makes it public. Then in the parent I get a reference to the child element, using lwc:ref or this.template.querySelector, and call the method directly. This is useful for actions like reset, refresh or validate, where the parent tells the child to do something. For example, a search page has a Clear button. The child filter panel has an @api reset method, and the parent's click handler calls this.refs.filters.reset(). The gotcha is timing. I only call it after the child has rendered, so from an event handler or renderedCallback, not from the constructor or connectedCallback. Public methods can also return values or promises. I keep these for commands like reset or validate, and send data down through properties, so the parent-child contract stays easy to follow.

- @api on the child method makes it public
- Get the child with lwc:ref or template.querySelector
- Call only after render, e.g. in a click handler

```java
// child.js
import { LightningElement, api } from 'lwc';
export default class Child extends LightningElement {
    @api reset() { this.value = ''; }
}
// parent.html
<c-child lwc:ref="child"></c-child>
<lightning-button label="Reset" onclick={handleReset}></lightning-button>
// parent.js
handleReset() { this.refs.child.reset(); }
```

<sub>Also asked as: Parent to child method call in LWC · How to expose a public method in LWC? · How do I invoke a child function from parent component? · call child component function from parent lwc</sub>

### How does the wire service work in LWC? Give an example.
*Fresher (0–2 yrs) · code* · `lwc-012`

The wire service is my default for reading data. It's a reactive, declarative way to get data. I decorate a property or function with @wire and give it an adapter, like an Apex method marked cacheable=true or an LDS adapter like getRecord, plus a config object. When a parameter is prefixed with a dollar sign, like '$recordId', it becomes reactive, so when that value changes, the wire calls the adapter again. The framework provisions an object with data and error. For example, I wire a getContacts Apex method with accountId set to '$recordId'. On an Account page it loads that Account's Contacts, and if the recordId changes, it reloads by itself. Wiring to a property is simplest. Wiring to a function lets me process the result, like cloning it or handling errors. And wire runs when the component loads, it doesn't wait for a user action.

- Adapter + config; '$param' makes it reactive
- Provisions { data, error }
- Wire to a property or a function
- Apex must be @AuraEnabled(cacheable=true)

```java
import { LightningElement, api, wire } from 'lwc';
import getContacts from '@salesforce/apex/ContactController.getContacts';
export default class AccountContacts extends LightningElement {
    @api recordId;
    @wire(getContacts, { accountId: '$recordId' })
    contacts; // contacts.data / contacts.error
}
```

<sub>Also asked as: Explain @wire with an Apex method · What is wire adapter? · How does wire get data reactively? · how to use wire with record id</sub>

### When do you use @wire versus calling Apex imperatively?
*Mid (3–6 yrs) · comparison* · `lwc-013`

My rule of thumb is wire for reads, imperative for actions. I use @wire for reading data that should load automatically and stay reactive to parameters, like records related to the current recordId. It's declarative, uses the client cache, and needs the Apex method to be cacheable=true, which means no DML. I use imperative calls when I need control over timing, like on a button click, when the method does DML or isn't cacheable, when I need to chain calls in order, or when I want to call it conditionally. For example, showing an Account's open Cases is a wire. A "Close all Cases" button that updates them is an imperative call. Imperative calls return a promise, so I use async/await with try/catch. One trade-off: refreshApex only works with wired results, so with imperative calls I simply call the method again.

- Wire: automatic, reactive, cached, read-only
- Imperative: on demand, DML allowed, ordering control
- Imperative returns a promise; refreshApex only for wire

<sub>Also asked as: Wire vs imperative Apex call · Difference between wire method and imperative method in LWC · Why would you call Apex imperatively? · wire or imperative which is better</sub>

### What does @AuraEnabled(cacheable=true) do and what are its restrictions?
*Senior (7–10 yrs) · concept* · `lwc-014`

I mark a method cacheable when it's a pure read, but I plan the refresh story at the same time. cacheable=true tells the framework the method is a read-only query, so its response can be stored in the Lightning client cache and reused for identical calls with the same parameters. It's required for @wire, and it helps performance because repeat calls can be served from the cache. The restriction is that the method can't do DML. If it tries, it throws an error. The flip side of caching is stale data. Say a component wires a cacheable getOpenTasks method, and then the user completes a task through another Apex call. The wired list still shows the old task, because the cached result isn't updated automatically. So I call refreshApex on the wired result, or notifyRecordUpdateAvailable for record data cached by LDS. Cacheable methods can still be called imperatively, too.

- Required for @wire
- No DML allowed inside
- Responses cached on the client per parameters
- Use refreshApex to bust stale wired data

<sub>Also asked as: Why does wire need cacheable true? · Can a cacheable method do DML? · Explain client-side caching of Apex in LWC · cacheable equals true meaning</sub>

### How do you call an Apex method imperatively with parameters from LWC?
*Fresher (0–2 yrs) · code* · `lwc-015`

It's a simple import-and-call. I import the method from @salesforce/apex and call it like a function, passing one object whose keys match the Apex parameter names exactly. Say the Apex method is getCases(Id accountId, String status). In JavaScript I call getCases({ accountId: this.recordId, status: 'Open' }). If I write accId instead of accountId, Apex won't get that value. It returns a promise, so I use async and await with try/catch, show a spinner while it runs, and turn the spinner off in finally. The Apex method must be static, public or global, and annotated with @AuraEnabled. Parameters can be primitives, lists, maps, sObjects, or a custom wrapper class whose fields are marked @AuraEnabled. Mismatched parameter names are a quiet bug, so I check them in review.

- Keys in the JS object must match Apex parameter names
- Returns a promise: async/await with try/catch
- Apex: static, @AuraEnabled; wrapper fields need @AuraEnabled

```java
// Apex
public with sharing class CaseController {
    @AuraEnabled
    public static Id createCase(String subject, Id accountId) {
        Case c = new Case(Subject = subject, AccountId = accountId);
        insert as user c;
        return c.Id;
    }
}
// JS
import createCase from '@salesforce/apex/CaseController.createCase';
async handleSave() {
    this.isLoading = true;
    try {
        const caseId = await createCase({ subject: this.subject, accountId: this.recordId });
    } catch (e) {
        this.error = e.body?.message;
    } finally {
        this.isLoading = false;
    }
}
```

<sub>Also asked as: Pass parameters from LWC to Apex · Imperative Apex call example with async await · How do I send values to an Apex method from JavaScript? · call apex on button click lwc</sub>

### What is refreshApex and how do you use it correctly?
*Mid (3–6 yrs) · code* · `lwc-016`

refreshApex is how I fix stale wired data after a change. It re-runs a wired Apex call and bypasses the client cache, so the component shows fresh data after a change. The important detail is that I have to pass the exact provisioned value the wire gave me, not the data I copied from it. When I wire to a function, I store the whole response object in a field, say this.wiredContacts, and later call refreshApex(this.wiredContacts). For example, after a user saves a new Contact in a modal, I call refreshApex on that stored value and the list updates. It returns a promise. A common mistake, and one I look for in review, is calling refreshApex on imperatively fetched data, which does nothing. For imperative calls I just call the method again. And if other components show the same record through LDS, I also call notifyRecordUpdateAvailable.

- Pass the original wired value, not a copy of data
- Store the response when wiring to a function
- Does not work for imperative calls
- Returns a promise

```java
wiredResult;
@wire(getContacts, { accountId: '$recordId' })
wiredContacts(result) {
    this.wiredResult = result;            // keep the provisioned value
    if (result.data) this.rows = result.data;
}
async handleSaved() {
    await refreshApex(this.wiredResult);
}
// import { refreshApex } from '@salesforce/apex';
```

<sub>Also asked as: How do I refresh wired Apex data after an update? · refreshApex not working, what am I doing wrong? · How to refresh data in LWC after DML · refresh apex example</sub>

### What is Lightning Data Service and why should you use it?
*Fresher (0–2 yrs) · concept* · `lwc-017`

I'd use LDS before writing any Apex for single-record work. Lightning Data Service is the shared data layer for Lightning components. It lets me create, read, update and delete records without writing Apex, using base components like lightning-record-form or the uiRecordApi wire adapters and functions. The big advantages: it respects CRUD, field-level security and sharing automatically, it caches records on the client, and it keeps every component on the page in sync. Say a record page has my custom component and a standard component, both showing the same Account. If my component updates the Phone through LDS, the standard one refreshes too, with no extra code. I prefer LDS for single-record operations, and I use Apex when I need complex queries, many records, aggregations, or business logic that has to run on the server. Less Apex also means less code to test and maintain, which is a trade-off I'm happy to make.

- No Apex needed for single-record CRUD
- Respects CRUD, FLS and sharing
- Shared client cache keeps components in sync
- Use Apex for complex queries or bulk logic

<sub>Also asked as: What is LDS in LWC? · Benefits of Lightning Data Service · Why use LDS instead of Apex? · lightning data service explained</sub>

### What is the difference between lightning-record-form, lightning-record-edit-form and lightning-record-view-form?
*Fresher (0–2 yrs) · comparison* · `lwc-018`

I pick the simplest one that meets the requirement. All three use Lightning Data Service, so no Apex is needed. lightning-record-form is the quickest. You give it an object, a record Id, and fields or a layout type, and it builds a view or edit form with modes view, edit and readonly. But customization is limited. lightning-record-edit-form gives me control over the layout, because I place each lightning-input-field myself, I can add custom buttons, and I can intercept the submit to change values or validate before saving. lightning-record-view-form is the read-only version, where I place lightning-output-field components. For example, a quick Contact edit panel with standard fields is a record-form. But if the business wants a custom two-column layout, a custom button, and a status set before saving, that's record-edit-form.

- record-form: fastest, view/edit/readonly modes, limited control
- record-edit-form: custom layout with lightning-input-field, onsubmit hook
- record-view-form: custom read-only layout with lightning-output-field

<sub>Also asked as: record form vs record edit form vs record view form · Which LDS form component should I use? · When would you choose lightning-record-edit-form over lightning-record-form? · difference between three record form components</sub>

### How do you set or change field values before saving in lightning-record-edit-form?
*Mid (3–6 yrs) · code* · `lwc-019`

I'd intercept the submit. I handle the onsubmit event and call event.preventDefault() to stop the default save. Then I read event.detail.fields, add or change values, and call submit on the form with the updated fields. This is useful for values the user shouldn't type, like a parent Id or a status, or for running custom validation first. Say a component creates a Case from an Account page. The user fills in Subject and Description, and in onsubmit I add the AccountId from the page and set Status to New, then submit. After a successful save, the onsuccess event gives me the record Id, and onerror gives me the error. The form also shows errors through lightning-messages. If the rule must always hold, I also back it with a validation rule or server logic, because client-side defaults alone can be bypassed.

- onsubmit + preventDefault, edit fields, then form.submit(fields)
- onsuccess returns event.detail.id
- Add lightning-messages to show errors

```html
<lightning-record-edit-form object-api-name="Contact" onsubmit={handleSubmit} onsuccess={handleSuccess}>
    <lightning-messages></lightning-messages>
    <lightning-input-field field-name="LastName"></lightning-input-field>
    <lightning-input-field field-name="Email"></lightning-input-field>
    <lightning-button type="submit" label="Save"></lightning-button>
</lightning-record-edit-form>

handleSubmit(event) {
    event.preventDefault();
    const fields = event.detail.fields;
    fields.AccountId = this.recordId;
    this.template.querySelector('lightning-record-edit-form').submit(fields);
}
handleSuccess(event) { this.newId = event.detail.id; }
```

<sub>Also asked as: Modify fields on submit in record edit form · How to add a hidden default value in lightning-record-edit-form? · Intercept save in record edit form · onsubmit prevent default record edit form</sub>

### How do you read a record's fields in LWC without Apex?
*Fresher (0–2 yrs) · code* · `lwc-020`

No Apex needed. I use the getRecord wire adapter from lightning/uiRecordApi, with the recordId and the fields I need. I import the fields from @salesforce/schema, which gives compile-time references. So if someone tries to delete a field, Salesforce knows the component depends on it. Then I use getFieldValue to read values safely, and getFieldDisplayValue for formatted values like currency or picklist labels. For example, on an Opportunity page, getFieldValue on Amount gives me the raw number for calculations, while getFieldDisplayValue gives me the formatted currency the user expects to see. Because it's LDS, it respects field-level security, it's cached, and it updates automatically when the record is edited elsewhere on the page. I also insist on schema imports over field-name strings, because that dependency tracking protects us when an admin tries to delete a field.

- Import fields from @salesforce/schema for referential integrity
- getFieldValue / getFieldDisplayValue
- Reactive to '$recordId' and auto-updates on edit

```java
import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import NAME from '@salesforce/schema/Account.Name';
import INDUSTRY from '@salesforce/schema/Account.Industry';
export default class AccountHeader extends LightningElement {
    @api recordId;
    @wire(getRecord, { recordId: '$recordId', fields: [NAME, INDUSTRY] })
    account;
    get name() { return getFieldValue(this.account.data, NAME); }
}
```

<sub>Also asked as: getRecord example in LWC · How to use getFieldValue? · Fetch the current record name without writing Apex · uiRecordApi getRecord</sub>

### How do you update a record from LWC without writing Apex?
*Mid (3–6 yrs) · code* · `lwc-021`

For a single record, I'd use the updateRecord function from lightning/uiRecordApi. I build a recordInput object with a fields map that includes the Id and the fields to change, using imported schema fields for the keys, and call updateRecord, which returns a promise. Say a button marks a Case as Escalated. The fields map has the Case Id and Status set to Escalated, and that's it, no Apex. Because it goes through Lightning Data Service, it respects security and validation rules, and every component showing that record through LDS refreshes automatically. I show a success toast when it's done, and I read the error body to show validation messages. For many records at once, I use one Apex call instead, so it's one DML statement rather than many separate requests.

- recordInput = { fields: { Id, ...changes } }
- Returns a promise; errors include validation messages
- LDS cache updates all components showing the record
- Use Apex for bulk updates

```java
import { updateRecord } from 'lightning/uiRecordApi';
import ID from '@salesforce/schema/Opportunity.Id';
import STAGE from '@salesforce/schema/Opportunity.StageName';

async markWon() {
    const fields = { [ID.fieldApiName]: this.recordId, [STAGE.fieldApiName]: 'Closed Won' };
    try {
        await updateRecord({ fields });
        // show success toast
    } catch (e) {
        this.error = e.body?.message;
    }
}
```

<sub>Also asked as: updateRecord example in LWC · Save a field change using uiRecordApi · Update record through LDS from JavaScript · update record without apex lwc</sub>

### You update a record through Apex, but the standard record page and LDS components still show old values. How do you fix it?
*Senior (7–10 yrs) · code* · `lwc-022`

I'd tell LDS the record changed. LDS doesn't know about changes made in Apex, so its cache stays stale. After the Apex call succeeds, I call notifyRecordUpdateAvailable from lightning/uiRecordApi with the list of changed record Ids. LDS then re-fetches those records, and every wired getRecord and standard component using them updates. For example, a button calls Apex to recalculate a discount on an Opportunity. Right after it returns, I call notifyRecordUpdateAvailable with that Opportunity Id, and the standard record details show the new value without a page reload. It replaced the older getRecordNotifyChange. If my own component got its data from a wired Apex method, I also call refreshApex on that wired result, because notifyRecordUpdateAvailable only refreshes LDS record data, not custom Apex results. Any component that saves through Apex needs this step, so it's on my review checklist.

- notifyRecordUpdateAvailable([{ recordId }]) after Apex DML
- Replaces getRecordNotifyChange
- Still call refreshApex for wired Apex results

```java
import { notifyRecordUpdateAvailable } from 'lightning/uiRecordApi';
import closeCases from '@salesforce/apex/CaseService.closeCases';

async handleClose() {
    await closeCases({ caseIds: this.selectedIds });
    await notifyRecordUpdateAvailable(this.selectedIds.map(id => ({ recordId: id })));
    await refreshApex(this.wiredCases);
}
```

<sub>Also asked as: Record page not refreshing after Apex update · How do I tell LDS that a record changed on the server? · What is notifyRecordUpdateAvailable? · getRecordNotifyChange replacement</sub>

### What are the ways components can communicate with each other in LWC?
*Fresher (0–2 yrs) · concept* · `lwc-023`

I choose the mechanism based on how the components are related. Parent to child, I pass data through @api properties or call @api methods on the child. Child to parent, the child dispatches a custom event and the parent listens with an on-handler in its template. For components that aren't in the same hierarchy, like two separate components on a Lightning page, I use Lightning Message Service with a message channel, which also works across LWC, Aura and Visualforce. For example, a list component in the left column and a details component in the right column: when a user clicks a row, the list publishes the record Id on a channel and the details component picks it up. Older projects used a pub-sub module, but LMS is the supported approach now. And for record data, LDS keeps components in sync automatically. Picking the simplest option that fits keeps the codebase easy for the next developer to follow.

- Parent to child: @api properties and methods
- Child to parent: CustomEvent
- Unrelated: Lightning Message Service
- LDS keeps record data in sync across components

<sub>Also asked as: How do LWC components talk to each other? · Component communication options in Lightning Web Components · Parent to child, child to parent and unrelated components communication · how to pass data between components lwc</sub>

### How do you send data from a child component to its parent?
*Fresher (0–2 yrs) · code* · `lwc-024`

I'd use a custom event. The child creates a CustomEvent and dispatches it, putting the data in the detail property. The event name should be lowercase, with no 'on' prefix and no spaces, for example 'select'. In the parent template I add an attribute named on plus the event name, like onselect, pointing to a handler, and the handler reads event.detail. I keep detail to primitives or a fresh copy of data, so the parent cannot accidentally mutate the child's internal state. By default the event does not bubble, which is what I want for direct child-to-parent communication. Event naming is one of the conventions I agree with the team up front, so handlers are predictable across components.

- new CustomEvent('select', { detail })
- Parent listens with onselect={handler}
- Lowercase event name, no 'on' prefix
- Read event.detail in the handler

```java
// child.js
handleClick() {
    this.dispatchEvent(new CustomEvent('select', { detail: { id: this.contactId } }));
}
// parent.html
<c-contact-tile contact-id={c.Id} onselect={handleSelect}></c-contact-tile>
// parent.js
handleSelect(event) {
    this.selectedId = event.detail.id;
}
```

<sub>Also asked as: Child to parent communication example · How to fire a custom event in LWC? · How does the parent handle an event from child? · dispatch event from child lwc</sub>

### What do bubbles and composed mean on a custom event?
*Senior (7–10 yrs) · concept* · `lwc-025`

My default is both false, and anything wider needs a reason. These two flags control how far an event travels. bubbles: true lets the event move up through the DOM tree from the element that fired it. composed: true lets it cross shadow DOM boundaries, so it can escape the component's shadow root and reach ancestors in other components. With both false, the default, only the direct parent that declared the handler on the child element hears it, and that's the cleanest option. With bubbles true and composed false, it bubbles only inside the parent's template. Both true makes the event part of the component's public API to every ancestor, so I use it sparingly, because any component up the tree can start depending on it. For example, if a row inside a table needs the page to know about a click, I usually have the table catch it and re-dispatch its own event, instead of letting the row's event travel all the way up. In review, a composed event is something I always ask about, because it quietly widens the component's API.

- Default (false/false): only the direct owner hears it
- bubbles: travels up the DOM
- composed: crosses shadow boundaries
- Prefer re-dispatching over bubbles+composed

<sub>Also asked as: Explain bubbles true composed true in LWC · Why is my event not reaching the grandparent? · Event propagation across shadow DOM · bubbles and composed flags</sub>

### What is Lightning Message Service and how do you use it?
*Mid (3–6 yrs) · code* · `lwc-026`

Lightning Message Service is my answer for components that aren't related in the DOM. It lets them exchange messages, across LWC, Aura and Visualforce on the same Lightning page, including components in the utility bar. I create a message channel as metadata, a LightningMessageChannel file, with the fields it carries. A publisher imports the channel and MessageContext and calls publish with a payload. A subscriber calls subscribe in connectedCallback and unsubscribe in disconnectedCallback. Say an app page has a filter component on the left and a chart component on the right, with no parent-child link. When the user picks a region, the filter publishes it, and the chart reloads for that region. One gotcha: by default, subscribers only get messages in the active area. Passing APPLICATION_SCOPE makes them receive messages from anywhere in the app. I also keep a short list of the org's message channels and what each carries, so teams reuse them instead of creating near-duplicates.

- Message channel: messageChannels/Name.messageChannel-meta.xml
- publish(context, channel, payload)
- subscribe in connectedCallback, unsubscribe on disconnect
- APPLICATION_SCOPE to receive across the whole app

```html
<!-- messageChannels/RecordSelected.messageChannel-meta.xml -->
<LightningMessageChannel xmlns="http://soap.sforce.com/2006/04/metadata">
    <masterLabel>RecordSelected</masterLabel>
    <isExposed>true</isExposed>
    <lightningMessageFields><fieldName>recordId</fieldName></lightningMessageFields>
</LightningMessageChannel>

// publisher.js
import { publish, MessageContext } from 'lightning/messageService';
import CHANNEL from '@salesforce/messageChannel/RecordSelected__c';
@wire(MessageContext) messageContext;
handleSelect(e) { publish(this.messageContext, CHANNEL, { recordId: e.detail.id }); }
```

<sub>Also asked as: Explain LMS with an example · How to communicate between components on different parts of a page? · What is a message channel? · lightning message service publish subscribe</sub>

### What is the difference between Lightning Message Service and the pub-sub module?
*Mid (3–6 yrs) · comparison* · `lwc-027`

I'd use LMS. The pub-sub module was a small JavaScript utility from the sample recipes, not a platform feature. It only works between LWCs in the same page context, it relies on the page reference to scope events, and it doesn't work with Aura or Visualforce. Lightning Message Service is the supported platform feature. Channels are metadata you can deploy and package, it works across LWC, Aura and Visualforce, and it has proper scoping options. Say an org still has an old Visualforce page on a Lightning page, and it needs to know when an LWC filter changes. Pub-sub can't do that, LMS can. So for any new work I use LMS, and when I find pub-sub in an older org, I plan to migrate it as part of normal refactoring, which is easier to get approved than a separate clean-up project.

- pubsub: custom JS utility, same page, LWC only
- LMS: platform feature, metadata channels
- LMS works across LWC, Aura and Visualforce

<sub>Also asked as: LMS vs pubsub in LWC · Why should I replace pubsub with LMS? · Is pubsub still recommended? · pub sub versus message service</sub>

### What are slots in LWC and how do you use named slots?
*Fresher (0–2 yrs) · code* · `lwc-028`

Slots are how I build reusable containers. A slot is a placeholder in a child component's template where the parent can inject its own markup. That makes components reusable as containers, like a card or modal shell where the parent decides what goes inside. An unnamed slot receives any content without a slot attribute, and named slots receive content with a matching slot attribute, like slot equals footer. Say I build one modal component for the whole app. One page puts a form in the default slot and Save and Cancel buttons in the footer slot. Another page puts a simple confirmation message in it. Same modal, different content. The injected content belongs to the parent, so the parent's CSS styles it and the parent handles its events. The child can listen to the slotchange event to know when slotted content changes. A shared modal or card shell like this is the kind of component I'd want the team to build once and reuse.

- <slot></slot> default, <slot name='footer'></slot> named
- Parent passes content with slot='footer'
- Slotted content is owned and styled by the parent

```html
<!-- c-panel.html -->
<template>
    <div class="header"><slot name="title"></slot></div>
    <div class="body"><slot></slot></div>
    <div class="footer"><slot name="footer"></slot></div>
</template>

<!-- parent.html -->
<c-panel>
    <h2 slot="title">Open Cases</h2>
    <p>Body content goes to the default slot.</p>
    <lightning-button slot="footer" label="Close"></lightning-button>
</c-panel>
```

<sub>Also asked as: Explain slot in Lightning Web Components · How to pass markup from parent into a child component? · Default slot vs named slot · what is slot tag lwc</sub>

### How does conditional rendering work in LWC templates?
*Fresher (0–2 yrs) · code* · `lwc-029`

I use lwc:if, lwc:elseif and lwc:else, the directives on template tags. They replaced the older if:true and if:false directives, which still work but aren't recommended anymore. The directive takes a property or getter, not an expression. So I can't check something like "count greater than zero" in the template. I write a getter called hasRecords in JavaScript and use lwc:if={hasRecords}. A false branch isn't just hidden, it isn't created at all, so its child components aren't constructed. That helps performance too, because heavy sections only load when they're needed, like a big related-records table that only appears after the user clicks Show More. The branches must be siblings, in that order. For new code, I ask the team to use lwc:if rather than the old directives.

- lwc:if / lwc:elseif / lwc:else replace if:true / if:false
- Only properties or getters, no expressions
- Unrendered branches are not created at all

```html
<template lwc:if={isLoading}>
    <lightning-spinner alternative-text="Loading"></lightning-spinner>
</template>
<template lwc:elseif={hasError}>
    <p class="slds-text-color_error">{errorMessage}</p>
</template>
<template lwc:else>
    <c-contact-list contacts={contacts}></c-contact-list>
</template>

get hasError() { return !!this.errorMessage; }
```

<sub>Also asked as: lwc:if vs if:true · How to show and hide sections in LWC? · Can I write an expression in lwc:if? · lwc if else if else example</sub>

### How do you loop over a list in LWC? What is the difference between for:each and iterator?
*Fresher (0–2 yrs) · code* · `lwc-030`

I'd use for:each with for:item for normal loops, and the iterator directive when I need to know the position. Iterator gives me value, index, first and last. That's handy for separators or special styling on the first or last row, like a divider under every row except the last one. In both cases, every top-level element inside the loop needs a unique key attribute, ideally the record Id, so the engine can update only the rows that change. I avoid using the array index as the key. Say I delete the second Contact in a list of five. With index keys, the rows shift and the wrong elements get re-used. With the Contact Id as the key, only that one row is removed. Index-as-key is a small thing I still flag in review, because the bugs it causes are confusing.

- for:each + for:item (+ for:index)
- iterator:it gives it.value, it.index, it.first, it.last
- key is required: use a stable Id, not the index

```html
<template for:each={contacts} for:item="c">
    <li key={c.Id}>{c.Name}</li>
</template>

<template iterator:it={contacts}>
    <li key={it.value.Id} class={it.value.cssClass}>
        {it.value.Name}
        <template lwc:if={it.last}><span> (last)</span></template>
    </li>
</template>
```

<sub>Also asked as: for each vs iterator in LWC · Why do I need a key in for:each? · How to know first and last item in an LWC loop? · render list in lwc template</sub>

### How does shadow DOM affect styling in LWC, and how do you style base components?
*Mid (3–6 yrs) · concept* · `lwc-031`

Styling hooks are the supported answer, and I don't let the team target internal SLDS classes. Every LWC has its own shadow tree, so its CSS is scoped. Styles in a component only apply to its own template, and a parent's styles don't leak into the child. That's why a parent can't style the inside of a child, or of a base component like lightning-button. Targeting internal SLDS classes is unsupported, because they can change, which is why it's off-limits for us. Say the design wants a lightning-button with a brand-colored background. Writing CSS against the button's inner SLDS classes isn't the way, and it can break after a release. The supported way is styling hooks, which are CSS custom properties that base components expose, and they do pass through the shadow boundary. Inside my own components, I use :host to style the component's outer element. And if a design really needs global styling, light DOM is an option for my own components.

- CSS is scoped to the component's shadow tree
- Parent styles don't reach into children
- Use styling hooks (CSS custom properties) for base components
- :host styles the component itself

```java
/* myComponent.css */
:host {
    display: block;
    --slds-c-button-brand-color-background: #0b5cab;
}
```

<sub>Also asked as: Why can't my parent CSS style the child component? · How to override the style of a lightning-button? · What are styling hooks in LWC? · css not applying in lwc child</sub>

### What is light DOM in LWC and when would you use it?
*Senior (7–10 yrs) · concept* · `lwc-032`

I treat light DOM as an exception. By default an LWC renders inside a shadow tree, which isolates its markup and CSS. Light DOM renders the component's markup directly into the parent's DOM instead. I enable it by setting static renderMode = 'light' in the class and lwc:render-mode='light' on the template. It helps when global styles or a theme need to reach inside the component, when third-party libraries need normal DOM access, or for better SEO and accessibility tooling in Experience Cloud sites. For example, on an Experience Cloud site with a site-wide theme, a light DOM header component can pick up the site's fonts and colors directly. The trade-off is no encapsulation. Other code can reach in and restyle the markup, and I use this.querySelector instead of this.template.querySelector. So shadow DOM stays my default, and I use light DOM only for the components that need it. When someone wants it, I ask them to explain the reason in the pull request.

- static renderMode = 'light' plus lwc:render-mode='light'
- Useful for global theming, third-party libs, Experience Cloud
- No style or DOM encapsulation
- Query with this.querySelector

<sub>Also asked as: Shadow DOM vs light DOM in Lightning Web Components · How do I render an LWC without shadow DOM? · When is light DOM a good idea? · lwc render mode light</sub>

### How do you navigate to a record page or another page from LWC?
*Fresher (0–2 yrs) · code* · `lwc-033`

I'd use NavigationMixin, never hard-coded URLs. I extend my class with NavigationMixin from lightning/navigation and call this[NavigationMixin.Navigate] with a page reference. The page reference has a type, like standard__recordPage, standard__objectPage, standard__navItemPage for a tab, or standard__webPage for an external URL, plus attributes like recordId, objectApiName and actionName. Say after creating a Case, I want to take the user straight to it. I navigate with type standard__recordPage, the new Case's recordId, objectApiName Case and actionName view. Using page references instead of hard-coded URLs means the same code works in Lightning Experience, the mobile app and Experience Cloud. If I need a link for an anchor tag, I use NavigationMixin.GenerateUrl, which returns a promise with the URL.

- Extend NavigationMixin(LightningElement)
- Page reference types: recordPage, objectPage, navItemPage, webPage
- GenerateUrl for href values
- No hard-coded URLs

```java
import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
export default class GoToRecord extends NavigationMixin(LightningElement) {
    @api recordId;
    openRecord() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: this.recordId, objectApiName: 'Account', actionName: 'view' }
        });
    }
}
```

<sub>Also asked as: NavigationMixin example · How to redirect to a record detail page in LWC? · Open a new record form from LWC · navigate to list view lightning web component</sub>

### How do you show a toast message in LWC?
*Fresher (0–2 yrs) · code* · `lwc-034`

For new work I lean towards lightning/toast, but both are worth knowing. The classic way is to import ShowToastEvent from lightning/platformShowToastEvent and dispatch it with a title, message, variant and mode. Variants are success, error, warning and info. Modes are dismissible, which is the default, pester and sticky. For example, after a normal save I'd show a success toast in the default mode, but for a failed sync the user must not miss, I'd use the error variant in sticky mode so they have to close it. Salesforce now also offers the lightning/toast module, where I call Toast.show with a label and message, and the docs recommend it. It also supports links in the text. One thing to remember: ShowToastEvent isn't supported in some places, like LWR sites in Experience Cloud, so there I use lightning/toast or a custom notification. A shared toast helper keeps messages consistent across the team's components.

- ShowToastEvent: title, message, variant, mode
- Variants: success, error, warning, info
- Modes: dismissible (default), pester, sticky
- lightning/toast is the newer recommended module

```java
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

showSuccess() {
    this.dispatchEvent(new ShowToastEvent({
        title: 'Saved',
        message: 'Contact was updated.',
        variant: 'success'
    }));
}
```

<sub>Also asked as: ShowToastEvent example · How to display a success message in Lightning Web Components? · What are the toast variants and modes? · platform show toast event lwc</sub>

### How do you build a modal in LWC?
*Mid (3–6 yrs) · code* · `lwc-035`

I'd use LightningModal rather than building one by hand. I create a component that extends LightningModal from lightning/modal, instead of LightningElement. Its template uses lightning-modal-header, lightning-modal-body and lightning-modal-footer, so focus handling, the close button and accessibility come built in. To show it, I import the component and call its static open method with size, description and any @api properties, and it returns a promise. Inside the modal, I call this.close(value), and that value is what the promise resolves to. If the user clicks the X, it resolves to undefined. Say I open an "Add note" modal. If the user saves, I close it with the note text and the parent gets that text. If they click X, the parent gets undefined and does nothing. For simple yes or no questions, lightning/confirm and lightning/alert are even quicker. Hand-built modals usually miss focus handling, which is an accessibility issue I'd rather we avoid entirely.

- Extend LightningModal, use modal header/body/footer
- MyModal.open({ size, description, ...props }) returns a promise
- this.close(result) resolves the promise
- lightning/confirm and lightning/alert for simple dialogs

```java
// editModal.js
import { api } from 'lwc';
import LightningModal from 'lightning/modal';
export default class EditModal extends LightningModal {
    @api heading;
    handleSave() { this.close('saved'); }
}
// editModal.html
<template>
  <lightning-modal-header label={heading}></lightning-modal-header>
  <lightning-modal-body>...</lightning-modal-body>
  <lightning-modal-footer>
    <lightning-button label="Save" onclick={handleSave}></lightning-button>
  </lightning-modal-footer>
</template>
// caller.js
const result = await EditModal.open({ size: 'small', description: 'Edit contact', heading: 'Edit' });
```

<sub>Also asked as: LightningModal example · How to open a popup in Lightning Web Components? · How do I return a value from a modal? · lightning modal component</sub>

### How do you enable inline editing in lightning-datatable and save the changes?
*Mid (3–6 yrs) · code* · `lwc-036`

I'd use the datatable's built-in draft values. I mark the columns as editable: true, set key-field to Id, bind draft-values, and handle onsave. When the user clicks Save, event.detail.draftValues has only the changed cells, each with the Id because of key-field. Say a user edits the Phone on three Contacts in a list of 50. draftValues gives me just those three rows, each with its Id and new Phone. For a few rows I can save through LDS with updateRecord, but for many rows I send all drafts to one Apex method, so it's a single DML. After saving, I clear the draft values, show a toast, and call refreshApex so the table shows server values. If a save fails, I can show row-level errors with the errors attribute. I ask the team to always handle partial failures, because users need to know which rows didn't save.

- Columns: editable: true; key-field='Id'
- onsave gives event.detail.draftValues
- Save in one Apex call for bulk, then clear drafts
- refreshApex to reload

```html
<lightning-datatable key-field="Id" data={rows} columns={columns}
    draft-values={draftValues} onsave={handleSave}></lightning-datatable>

columns = [
  { label: 'Name', fieldName: 'Name', editable: true },
  { label: 'Phone', fieldName: 'Phone', type: 'phone', editable: true }
];
async handleSave(event) {
    try {
        await saveContacts({ contacts: event.detail.draftValues });
        this.draftValues = [];
        await refreshApex(this.wiredResult);
    } catch (e) {
        this.error = e.body?.message;
    }
}
```

<sub>Also asked as: Inline edit in lightning datatable · How do I save draft values from a datatable? · Datatable onsave example · editable columns lightning-datatable</sub>

### How do you implement infinite loading in lightning-datatable?
*Mid (3–6 yrs) · code* · `lwc-037`

I'd combine the datatable's infinite loading with keyset paging in Apex. I set enable-infinite-loading on the datatable and handle the onloadmore event, which fires when the user scrolls near the bottom. In the handler I set event.target.isLoading to true, call Apex imperatively for the next batch, append the results as a new array, and set isLoading back to false. For paging on the server I prefer keyset paging, filtering by Id or a sort field greater than the last loaded value, because OFFSET is capped at 2,000 rows. Say I load 50 Accounts at a time. Each loadmore asks Apex for the next 50 after the last Id I have. When Apex returns fewer than 50, I know I've reached the end and turn infinite loading off. One gotcha: the table needs a fixed-height container, or scrolling won't work.

- enable-infinite-loading + onloadmore
- event.target.isLoading while fetching
- Keyset paging beats OFFSET (max 2,000)
- Wrap table in a fixed-height div

```html
<div style="height: 400px">
  <lightning-datatable key-field="Id" data={rows} columns={columns}
      enable-infinite-loading={hasMore} onloadmore={loadMore}></lightning-datatable>
</div>

async loadMore(event) {
    event.target.isLoading = true;
    const lastId = this.rows.length ? this.rows[this.rows.length - 1].Id : null;
    const batch = await getCases({ lastId, pageSize: 50 });
    this.rows = [...this.rows, ...batch];
    this.hasMore = batch.length === 50;
    event.target.isLoading = false;
}
```

<sub>Also asked as: Lazy loading rows in datatable · Load more records on scroll in LWC · enable-infinite-loading example · datatable onloadmore</sub>

### What is lwc:ref and how is it different from template.querySelector?
*Mid (3–6 yrs) · code* · `lwc-038`

I prefer lwc:ref wherever it's supported. Both give me a reference to an element in my template. With querySelector, I search the component's shadow tree using a CSS selector, like this.template.querySelector('lightning-input'). With lwc:ref, I tag an element, like lwc:ref equals emailInput, and then read this.refs.emailInput directly. That's cleaner, faster, and doesn't break if I change CSS classes. For example, if a form has three lightning-input fields, querySelector('lightning-input') just returns the first one, but this.refs.emailInput always gets the email field. Either way, the elements only exist after rendering, so I use them in event handlers or renderedCallback. lwc:ref isn't supported inside for:each or iterator loops, so for repeated elements I still use querySelectorAll, often with a data attribute.

- lwc:ref='name' then this.refs.name
- template.querySelector uses CSS selectors
- Both work only after render
- lwc:ref not allowed inside loops

```html
<lightning-input lwc:ref="email" label="Email" type="email"></lightning-input>
<lightning-button label="Check" onclick={check}></lightning-button>

check() {
    const input = this.refs.email;
    input.reportValidity();
    const all = this.template.querySelectorAll('lightning-input');
}
```

<sub>Also asked as: How to get a reference to an element in LWC? · lwc:ref vs querySelector · this.refs in Lightning Web Components · access dom element lwc</sub>

### How do you handle errors from Apex in LWC and show a meaningful message?
*Mid (3–6 yrs) · code* · `lwc-039`

I'd handle it on both sides. On the Apex side, I catch exceptions and throw an AuraHandledException with a message that's safe for users. Otherwise the client may only get a generic internal error. On the client, imperative calls go in try/catch, and wired results are checked for the error property. The error shape varies. Apex errors usually have body.message, while LDS errors can have body as an array, or contain output.errors and fieldErrors. So if I only read error.body.message everywhere, an LDS save that fails a validation rule may show just a generic message, and the real field-level error gets lost. That's why I use a small reduceErrors helper that flattens all these shapes into readable strings, then show them in a toast or inline. And I log the technical details on the server, not in the UI. I'd keep one shared reduceErrors utility for the whole team, rather than every component parsing errors its own way.

- Throw AuraHandledException with a user-safe message
- try/catch for imperative, check .error for wire
- Normalize error shapes with a reduceErrors helper
- Log details server-side

```java
// Apex
@AuraEnabled
public static void closeCase(Id caseId) {
    try {
        update as user new Case(Id = caseId, Status = 'Closed');
    } catch (DmlException e) {
        throw new AuraHandledException('Could not close the case: ' + e.getDmlMessage(0));
    }
}
// JS helper
export function reduceErrors(errors) {
    return (Array.isArray(errors) ? errors : [errors])
        .map(e => e?.body?.message || e?.message || 'Unknown error');
}
```

<sub>Also asked as: Error handling in Lightning Web Components · Why does my LWC show 'internal server error' instead of my message? · What is AuraHandledException? · how to show apex error message in lwc</sub>

### How do you improve the performance of Lightning Web Components?
*Senior (7–10 yrs) · concept* · `lwc-040`

I'd measure first, and then start with data, because most slowness is server calls. I prefer LDS and cacheable wired Apex, so repeated calls hit the client cache. I select only the fields I need, and I combine several small Apex calls into one. For example, if a component makes four Apex calls on load for Account details, Contacts, Cases and counts, I'd merge them into one call that returns a wrapper. For big lists, I paginate or use infinite loading instead of loading thousands of rows. On the client, I debounce search inputs, use lwc:if so heavy child components aren't created until needed, load third-party libraries once, and keep getters and renderedCallback cheap, since they run on every render. I use stable keys in loops. And I check with browser dev tools and Apex logs rather than guess. Before a big release, I ask the team to test pages with realistic data volumes, not five sample records.

- Fewer, leaner server calls; cacheable and LDS
- Paginate large data sets
- Debounce inputs; lazy-render with lwc:if
- Keep getters and renderedCallback cheap
- Measure before optimizing

<sub>Also asked as: LWC performance best practices · My Lightning page with custom components is slow, what would you optimize? · How to make LWC load faster? · performance tuning lwc</sub>

### What is the difference between Lightning Locker and Lightning Web Security?
*Senior (7–10 yrs) · comparison* · `lwc-041`

LWS is the direction I'd take for any org that can switch. Both are security layers that isolate components from different namespaces, so one package can't attack another. Lightning Locker does it by wrapping global objects like window, document and DOM elements in secure proxy versions. That blocks access to other namespaces' DOM, but it also breaks a lot of third-party libraries and adds overhead. Lightning Web Security takes a newer approach. Each namespace runs in its own JavaScript sandbox, and risky APIs are modified through distortions instead of wrapped. That gives better performance, better compatibility with libraries, and lets components import modules from other namespaces. For example, if a third-party charting library keeps failing under Locker, switching the org to LWS is one of the first things I'd look at. It's turned on in Session Settings with one setting for both Lightning web components and Aura components, and new orgs have it on by default. In an older org, I'd test the switch in a sandbox first, because it affects every component at once.

- Locker: secure wrappers around globals, strict namespace isolation
- LWS: per-namespace sandboxes with API distortions
- LWS: faster, more library friendly, cross-namespace imports
- Enabled in Session Settings; default in new orgs

<sub>Also asked as: Locker Service vs LWS · What is Lightning Web Security? · Why did Salesforce introduce LWS? · locker vs lightning web security</sub>

### How do you write a Jest test for a Lightning Web Component?
*Mid (3–6 yrs) · code* · `lwc-042`

I'd test the behaviour the user sees. I use the sfdx-lwc-jest package, put tests in a __tests__ folder, and run them locally, because Jest tests don't run in the org. In each test, I create the component with createElement from lwc, set public properties, and append it to document.body. Apex imports are mocked with jest.mock using the virtual option. After changing state or resolving promises, I wait for the DOM to update with a resolved promise, then query the shadow root and assert. For example, to test a counter component, I create it, click its plus button, await a resolved promise, then check that the displayed number went from 0 to 1. In afterEach, I remove the elements from the body and clear mocks, so tests don't affect each other. On my teams, Jest tests run in the pipeline, so a broken component fails the build, not the user.

- Tests run locally with sfdx-lwc-jest, not in the org
- createElement + document.body.appendChild
- jest.mock Apex with { virtual: true }
- Await promise resolution before asserting; clean up in afterEach

```java
import { createElement } from 'lwc';
import CaseCreator from 'c/caseCreator';
import createCase from '@salesforce/apex/CaseController.createCase';
jest.mock('@salesforce/apex/CaseController.createCase', () => ({ default: jest.fn() }), { virtual: true });

describe('c-case-creator', () => {
    afterEach(() => { document.body.innerHTML = ''; jest.clearAllMocks(); });
    it('calls Apex on save', async () => {
        createCase.mockResolvedValue('500000000000001');
        const el = createElement('c-case-creator', { is: CaseCreator });
        document.body.appendChild(el);
        el.shadowRoot.querySelector('lightning-button').click();
        await Promise.resolve();
        expect(createCase).toHaveBeenCalled();
    });
});
```

<sub>Also asked as: LWC unit testing with Jest · How to test an LWC that calls Apex? · sfdx-lwc-jest example · jest test for lwc component</sub>

### How do you mock a wire adapter in a Jest test?
*Senior (7–10 yrs) · code* · `lwc-043`

I'd mock the adapter and emit data. For wired Apex, I mock the import with createApexTestWireAdapter from sfdx-lwc-jest, which turns it into a test wire adapter. In the test, I create the component, then call emit with mock data, usually loaded from a JSON file in a data folder, or call error to simulate a failure. LDS adapters like getRecord are already provided as test adapters by sfdx-lwc-jest, so I import getRecord and call emit on it directly. After emitting, I wait for a microtask so the component re-renders, then assert on the DOM. Say a component lists Contacts. I write three tests: emit a JSON file with three Contacts and check three rows show, emit an empty list and check the empty message, and call error and check the error panel. No org needed for any of it. Those three cases, data, empty and error, are the minimum I expect for any wired component.

- createApexTestWireAdapter for wired Apex
- adapter.emit(mock) and adapter.error()
- LDS adapters like getRecord support emit out of the box
- Await a promise before asserting

```java
import { createElement } from 'lwc';
import ContactList from 'c/contactList';
import getContacts from '@salesforce/apex/ContactController.getContacts';

jest.mock('@salesforce/apex/ContactController.getContacts', () => {
    const { createApexTestWireAdapter } = require('@salesforce/sfdx-lwc-jest');
    return { default: createApexTestWireAdapter(jest.fn()) };
}, { virtual: true });

it('renders contacts', async () => {
    const el = createElement('c-contact-list', { is: ContactList });
    document.body.appendChild(el);
    getContacts.emit([{ Id: '003000000000001', Name: 'Asha' }]);
    await Promise.resolve();
    expect(el.shadowRoot.querySelectorAll('li').length).toBe(1);
});
```

<sub>Also asked as: Testing @wire in LWC with Jest · How to emit mock data to a wired Apex method? · createApexTestWireAdapter example · mock getRecord in jest</sub>

### What are targets in js-meta.xml and how do you expose an LWC to App Builder, Experience Builder or a quick action?
*Fresher (0–2 yrs) · code* · `lwc-044`

It's all controlled in js-meta.xml. I set isExposed to true and add targets that say where the component can be used. Common targets are lightning__RecordPage, lightning__AppPage and lightning__HomePage for Lightning App Builder, lightning__UtilityBar, lightning__Tab, lightning__FlowScreen for flow screens, lightning__RecordAction for quick actions, and lightningCommunity__Page and lightningCommunity__Default for Experience Builder. So if I want one component on the Account page and also in a flow, I add both lightning__RecordPage and lightning__FlowScreen. If a component doesn't show up in App Builder, the usual reasons are isExposed set to false, a missing target, or an objects restriction in targetConfig that doesn't include that object. For example, if targetConfig lists only Account, you won't see it while editing the Contact record page. That's usually the first thing I check when an admin tells me a component is missing.

- isExposed must be true
- Record/App/Home page, UtilityBar, Tab targets
- lightning__FlowScreen, lightning__RecordAction
- lightningCommunity__Page / __Default for Experience Builder

```html
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>62.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__RecordPage</target>
        <target>lightning__AppPage</target>
        <target>lightning__FlowScreen</target>
        <target>lightningCommunity__Page</target>
        <target>lightningCommunity__Default</target>
    </targets>
</LightningComponentBundle>
```

<sub>Also asked as: How to make an LWC available on a Lightning page? · What does isExposed do? · List of LWC targets · lwc not showing in app builder</sub>

### How do you let an admin configure your LWC from Lightning App Builder?
*Mid (3–6 yrs) · code* · `lwc-045`

I add a targetConfig for the target in js-meta.xml and declare property elements with a name, type, label and default. Each property name has to match an @api property in the JavaScript, and App Builder then shows an input for it. Types include String, Integer and Boolean, and for strings I can offer a picklist with the datasource attribute. I can also restrict a record page component to certain objects with the objects element. This makes one component reusable. Say I build a related records list. On one page an admin sets the title to "Key Contacts" and the number of rows to 5. On another page they set a different title and 10 rows. Same component, no code change, and the admin does it all from App Builder.

- targetConfig + property in js-meta.xml
- Property name must match an @api field
- datasource for picklist options
- objects element limits record pages

```html
<targetConfigs>
    <targetConfig targets="lightning__RecordPage">
        <property name="title" type="String" label="Card title" default="Contacts"/>
        <property name="rowLimit" type="Integer" label="Rows to show" default="10"/>
        <objects><object>Account</object></objects>
    </targetConfig>
</targetConfigs>
// js: @api title; @api rowLimit;
```

<sub>Also asked as: Design attributes in LWC · How to add properties to an LWC in App Builder? · targetConfig property example · configurable lwc for admins</sub>

### How do you use an LWC inside a Flow screen and pass values in and out?
*Senior (7–10 yrs) · code* · `lwc-046`

I add lightning__FlowScreen as a target and declare properties in targetConfig, using role inputOnly or outputOnly when the direction should be fixed. Each property maps to an @api field. To send a value back to the flow, I dispatch FlowAttributeChangeEvent from lightning/flowSupport with the property name and value, because the flow doesn't watch internal changes. Say my component lets the user pick a delivery slot. When they pick one, I fire FlowAttributeChangeEvent with selectedSlot, and the flow variable gets the value. For validation, I expose an @api validate method that returns isValid and an errorMessage, and the flow calls it when the user clicks Next. So if no slot is picked, it returns false with a message like "Please pick a slot." I can also move the flow forward with FlowNavigationNextEvent, checking availableActions first.

- Target lightning__FlowScreen; property roles inputOnly/outputOnly
- FlowAttributeChangeEvent to update flow variables
- @api validate() returns { isValid, errorMessage }
- FlowNavigationNextEvent to advance

```java
import { LightningElement, api } from 'lwc';
import { FlowAttributeChangeEvent, FlowNavigationNextEvent } from 'lightning/flowSupport';
export default class PickContact extends LightningElement {
    @api selectedContactId;
    @api availableActions = [];
    handleSelect(e) {
        this.dispatchEvent(new FlowAttributeChangeEvent('selectedContactId', e.detail.id));
        if (this.availableActions.includes('NEXT')) this.dispatchEvent(new FlowNavigationNextEvent());
    }
    @api validate() {
        return this.selectedContactId ? { isValid: true }
            : { isValid: false, errorMessage: 'Please select a contact.' };
    }
}
```

<sub>Also asked as: LWC in screen flow example · FlowAttributeChangeEvent usage · How to validate an LWC in a flow screen? · pass output variable from lwc to flow</sub>

### How do you build an LWC quick action? What is the difference between a screen action and a headless action?
*Mid (3–6 yrs) · code* · `lwc-047`

I add the lightning__RecordAction target and set actionType in targetConfig. A ScreenAction opens a modal that renders my component, and I close it by dispatching CloseActionScreenEvent from lightning/actions. A headless action, actionType Action, has no UI. The component exposes an @api invoke method that runs when the button is clicked. For example, a "Mark as Urgent" button on a Case can be headless: invoke updates the field and shows a toast, with no modal at all. But a "Log a Visit" button where the user types notes would be a screen action. In both cases recordId is passed in automatically. After saving, I usually notify LDS so the record page shows the new values.

- Target lightning__RecordAction; actionType ScreenAction or Action
- Screen action closes with CloseActionScreenEvent
- Headless action implements @api invoke()
- recordId is provided automatically

```html
<targets><target>lightning__RecordAction</target></targets>
<targetConfigs>
  <targetConfig targets="lightning__RecordAction">
    <actionType>Action</actionType>
  </targetConfig>
</targetConfigs>

// js
import { LightningElement, api } from 'lwc';
import markUrgent from '@salesforce/apex/CaseService.markUrgent';
export default class MarkUrgent extends LightningElement {
    @api recordId;
    @api async invoke() {
        await markUrgent({ caseId: this.recordId });
    }
}
```

<sub>Also asked as: LWC as a quick action · Headless quick action in LWC · How to close a quick action from LWC? · lightning record action lwc</sub>

### How do you debug a Lightning Web Component?
*Fresher (0–2 yrs) · troubleshooting* · `lwc-048`

First I enable Debug Mode for my user in Setup, so the framework serves unminified JavaScript with clearer error messages. I only use it while debugging, because it slows pages down. Then I use Chrome DevTools: the Sources panel to set breakpoints or a debugger statement, the console for errors, and the Network tab to see server requests and responses. One thing that confuses people is that reactive data shows up as proxies in the console. So if I console.log a list of records, I see a Proxy instead of the actual values. I either log JSON.parse(JSON.stringify(value)), or enable custom formatters in DevTools. For server-side problems, I check Apex debug logs. And I run ESLint with the LWC rules to catch common mistakes early.

- Enable Debug Mode for the user
- Chrome DevTools breakpoints, console, network
- Unwrap proxies with JSON.stringify or custom formatters
- Apex debug logs for server errors

<sub>Also asked as: Debugging techniques for LWC · How to find why my LWC is not working? · How to see proxy values in console? · debug mode lightning components</sub>

### What are dynamic components in LWC and when would you use them?
*Senior (7–10 yrs) · code* · `lwc-049`

Dynamic components let me decide at runtime which component to render, instead of hard-coding the tag. I use the lwc:component element with lwc:is bound to a constructor, and I load that constructor with a dynamic import, which returns a promise. The requirements are that Lightning Web Security is enabled and the js-meta.xml declares the lightning__dynamicComponent capability. It suits configuration-driven UIs. Say a record page should show a different detail panel per record type, like one panel for billing Cases and another for technical Cases. I check the record type, import the matching component, and render it with lwc:is. It's also good for lazy-loading a heavy component only when it's needed. The trade-off is that the import can't be fully analyzed at build time, so I keep the set of possible components small and known.

- <lwc:component lwc:is={ctor}>
- import('c/name') returns a constructor promise
- Needs LWS and lightning__dynamicComponent capability
- Good for config-driven or lazy-loaded UI

```html
<lwc:component lwc:is={panelCtor}></lwc:component>

async connectedCallback() {
    const { default: ctor } = this.isPartner
        ? await import('c/partnerPanel')
        : await import('c/customerPanel');
    this.panelCtor = ctor;
}
<!-- js-meta.xml -->
<capabilities><capability>lightning__dynamicComponent</capability></capabilities>
```

<sub>Also asked as: lwc:component lwc:is example · How to load a component at runtime in LWC? · Dynamic import of a Lightning Web Component · render component based on configuration lwc</sub>

### How do you make sure an LWC respects security, like CRUD, field-level security and sharing?
*Senior (7–10 yrs) · concept* · `lwc-050`

LDS-based components and base components enforce CRUD, FLS and sharing automatically, so that's my first choice. Apex is different, because it runs in system mode by default. So in classes called from LWC, I declare with sharing, run queries WITH USER_MODE and DML as user, or use Security.stripInaccessible when I need to remove fields gracefully. Users also need access to the Apex class through a profile or permission set. On the client, I never trust input, because anyone can call an AuraEnabled method directly. For example, hiding a Delete button for some users isn't security on its own. Someone could still call that Apex method from the browser, so the server validates everything. I avoid inserting raw HTML with lwc:dom manual and innerHTML to prevent XSS, and I never put secrets in JavaScript.

- LDS enforces CRUD/FLS/sharing for you
- Apex: with sharing, WITH USER_MODE, DML as user
- Grant Apex class access via permission sets
- Validate on server; avoid innerHTML with user data

<sub>Also asked as: Security best practices for LWC with Apex · Does Apex called from LWC enforce FLS? · How to prevent users seeing fields they shouldn't in LWC? · with sharing user mode lwc apex</sub>

### How can an LWC ask the standard record page to refresh its data?
*Senior (7–10 yrs) · concept* · `lwc-051`

There are two levels. If I changed a record through Apex, I call notifyRecordUpdateAvailable with the record Ids, so LDS refetches them and every component bound to that record, including standard ones, updates. For a broader refresh, Salesforce provides the RefreshView API in the lightning/refresh module, which is the LWC counterpart to force:refreshView in Aura. My component dispatches a RefreshEvent, it bubbles up to the nearest refresh container, and components that registered refresh handlers reload their data. Say a quick action recalculates an Opportunity through Apex. notifyRecordUpdateAvailable takes care of the Opportunity's own fields, and a RefreshEvent lets the other components that registered for refresh reload too. What I avoid is a full page reload with window.location, because it loses state and feels slow.

- notifyRecordUpdateAvailable for specific records
- RefreshEvent from lightning/refresh, like force:refreshView
- Containers and handlers register to take part
- Avoid window.location.reload

```java
import { RefreshEvent } from 'lightning/refresh';
async handleSave() {
    await saveDetails({ recordId: this.recordId, values: this.values });
    this.dispatchEvent(new RefreshEvent());
}
```

<sub>Also asked as: What is RefreshEvent in LWC? · force:refreshView equivalent in LWC · Refresh the whole record page after my component saves · lightning refresh module</sub>

### Which @salesforce scoped modules have you used in LWC?
*Fresher (0–2 yrs) · code* · `lwc-052`

Scoped modules let me import platform data at compile time. The ones I use most are @salesforce/apex for Apex methods, @salesforce/schema for object and field references, @salesforce/user/Id for the current user's Id, and @salesforce/label for custom labels so text can be translated. Then @salesforce/customPermission and @salesforce/userPermission to show or hide features based on permissions, @salesforce/resourceUrl for static resources, @salesforce/messageChannel for LMS, and @salesforce/client/formFactor to adapt layouts for phone or desktop. For example, I import a custom permission like Approve_Discounts and only show the Approve button when the user has it. The button text comes from a custom label, so it can be translated without touching the code. Importing these instead of hard-coding values keeps components translatable and protected by referential integrity.

- @salesforce/user/Id, label, customPermission
- @salesforce/schema for fields
- @salesforce/resourceUrl, messageChannel
- @salesforce/client/formFactor

```java
import USER_ID from '@salesforce/user/Id';
import SAVE_LABEL from '@salesforce/label/c.Save_Button';
import canApprove from '@salesforce/customPermission/Approve_Discounts';
import FORM_FACTOR from '@salesforce/client/formFactor';

export default class Approvals extends LightningElement {
    label = { save: SAVE_LABEL };
    get showApprove() { return canApprove; }
    get isPhone() { return FORM_FACTOR === 'Small'; }
}
```

<sub>Also asked as: How do I get the current user Id in LWC? · How to use custom labels in Lightning Web Components? · Check a custom permission in LWC · salesforce import modules lwc</sub>

## LWC Scenarios

### You need a search box that searches Accounts as the user types without calling Apex on every keystroke. How would you build it?
*Mid (3–6 yrs) · scenario* · `lwc-053`

I would debounce the input. On each change I clear the previous timer and start a new one of about 300 milliseconds, and only when the user stops typing do I set the search key. The search key is a reactive parameter of a wired cacheable Apex method, so setting it triggers the call, and repeated searches come from cache. I skip the search for fewer than two characters. In Apex I bind the term in a LIKE filter, which avoids SOQL injection, enforce user mode, and limit the rows. The template shows a spinner, results, or a no-results message.

- Debounce with clearTimeout/setTimeout
- Reactive '$searchKey' on a cacheable wire
- Bind variables in SOQL, WITH USER_MODE, LIMIT
- Minimum length before searching

```java
// Apex
public with sharing class AccountSearchController {
    @AuraEnabled(cacheable=true)
    public static List<Account> search(String term) {
        if (String.isBlank(term)) return new List<Account>();
        String key = '%' + term + '%';
        return [SELECT Id, Name, Industry FROM Account WHERE Name LIKE :key WITH USER_MODE ORDER BY Name LIMIT 20];
    }
}
// accountSearch.js
import { LightningElement, wire } from 'lwc';
import search from '@salesforce/apex/AccountSearchController.search';
export default class AccountSearch extends LightningElement {
    searchKey = '';
    timer;
    @wire(search, { term: '$searchKey' }) accounts;
    handleChange(event) {
        const value = event.target.value;
        clearTimeout(this.timer);
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.timer = setTimeout(() => {
            this.searchKey = value.length >= 2 ? value : '';
        }, 300);
    }
}
```

<sub>Also asked as: Build an account search component with debounce · How do you debounce input in LWC? · Search as you type calling Apex in Lightning Web Components · type ahead search lwc</sub>

### Show a list of Contacts in a datatable with row actions to view, edit and delete. How would you implement it?
*Mid (3–6 yrs) · scenario* · `lwc-054`

I add a column of type action with rowActions in typeAttributes, and handle the onrowaction event, which gives me the action name and the full row. For view and edit I use NavigationMixin to the record page with actionName view or edit. For delete I ask for confirmation with lightning/confirm, call deleteRecord from uiRecordApi, show a toast, and call refreshApex so the row disappears. The data comes from a wired cacheable Apex method, and I store the wired result so I can refresh it.

- Column type 'action' with typeAttributes.rowActions
- onrowaction: event.detail.action.name and event.detail.row
- Confirm, deleteRecord, toast, refreshApex

```java
const ACTIONS = [ { label: 'View', name: 'view' }, { label: 'Edit', name: 'edit' }, { label: 'Delete', name: 'delete' } ];
columns = [
    { label: 'Name', fieldName: 'Name' },
    { label: 'Email', fieldName: 'Email', type: 'email' },
    { type: 'action', typeAttributes: { rowActions: ACTIONS } }
];
async handleRowAction(event) {
    const { action, row } = event.detail;
    if (action.name === 'delete') {
        const ok = await LightningConfirm.open({ message: 'Delete ' + row.Name + '?', label: 'Confirm' });
        if (!ok) return;
        await deleteRecord(row.Id);
        await refreshApex(this.wiredResult);
    } else {
        this[NavigationMixin.Navigate]({ type: 'standard__recordPage',
            attributes: { recordId: row.Id, actionName: action.name } });
    }
}
// <lightning-datatable key-field="Id" data={rows} columns={columns} onrowaction={handleRowAction}>
```

<sub>Also asked as: Datatable with row actions example · How to handle onrowaction in lightning-datatable? · Add an action menu on each row of a datatable · row level actions lwc datatable</sub>

### Give an example of parent and child components passing data both ways.
*Fresher (0–2 yrs) · scenario* · `lwc-055`

A typical example is a list and a tile. The parent loads contacts and loops over them, passing each contact into a child tile through an @api property. When the user clicks a tile, the child dispatches a custom event called select with the contact Id in detail. The parent listens with onselect, stores the selected Id, and that value can flow back down to every tile through another @api property, so the selected tile highlights itself. This keeps data ownership in the parent and the child stays reusable.

- Data down: @api contact
- Events up: CustomEvent('select')
- Parent owns state; children stay reusable

```html
<!-- parent.html -->
<template for:each={contacts} for:item="c">
    <c-contact-tile key={c.Id} contact={c} selected-id={selectedId} onselect={handleSelect}></c-contact-tile>
</template>
// parent.js
handleSelect(e) { this.selectedId = e.detail; }

// contactTile.js
@api contact;
@api selectedId;
get tileClass() { return this.contact.Id === this.selectedId ? 'tile selected' : 'tile'; }
handleClick() { this.dispatchEvent(new CustomEvent('select', { detail: this.contact.Id })); }
```

<sub>Also asked as: Parent child communication example in LWC · Parent sends a list to child, child tells parent which one was clicked · Explain two-way communication between parent and child · parent to child and child to parent example</sub>

### After a user saves data through an Apex call, the list in your component still shows old values. How do you refresh it?
*Mid (3–6 yrs) · scenario* · `lwc-056`

The list is coming from a cached wired Apex method, so after an imperative save the cache is stale. I keep a reference to the wired result and, once the save promise resolves, call refreshApex on it, which re-queries the server and updates the list. If the change also affects records shown by LDS or standard components, I call notifyRecordUpdateAvailable with those record Ids. If the list itself was loaded imperatively, I simply call the load method again. I also show a toast and handle errors in a catch block.

- Store the wired result; call refreshApex after save
- notifyRecordUpdateAvailable for LDS and standard components
- Re-call imperative loaders

```java
wiredOpps;
@wire(getOpenOpps, { accountId: '$recordId' })
wired(result) { this.wiredOpps = result; }

async handleSave() {
    try {
        await saveOpportunity({ opp: this.draft });
        await refreshApex(this.wiredOpps);
        this.dispatchEvent(new ShowToastEvent({ title: 'Saved', variant: 'success' }));
    } catch (e) {
        this.error = e.body?.message;
    }
}
```

<sub>Also asked as: Refreshing data after DML in LWC · Data is stale after insert, how to reload? · How to refresh wired list after imperative save? · list not updating after save lwc</sub>

### You need to show the Contacts of the current Account on its record page. How would you build it?
*Fresher (0–2 yrs) · scenario* · `lwc-057`

I place the component on the Account record page and declare @api recordId, which the page fills in automatically. Then I wire a cacheable Apex method with accountId set to '$recordId', so it runs as soon as the Id is available. The Apex method uses with sharing and user mode and returns only the fields I need. In the template I show the records in a datatable or list, with an empty-state message. Another option without Apex is getRelatedListRecords from lightning/uiRelatedListApi, which reads a related list through LDS.

- @api recordId is set by the record page
- Wire Apex with '$recordId'
- Secure, lean SOQL
- Alternative: getRelatedListRecords

```java
// Apex
public with sharing class ContactController {
    @AuraEnabled(cacheable=true)
    public static List<Contact> getContacts(Id accountId) {
        return [SELECT Id, Name, Title, Email FROM Contact WHERE AccountId = :accountId WITH USER_MODE ORDER BY Name LIMIT 200];
    }
}
// js
@api recordId;
@wire(getContacts, { accountId: '$recordId' }) contacts;
// html
<template lwc:if={contacts.data}>
  <lightning-datatable key-field="Id" data={contacts.data} columns={columns} hide-checkbox-column></lightning-datatable>
</template>
```

<sub>Also asked as: Show related records of current record in LWC · How to get the recordId on a record page? · Display child records on account page with LWC · related list lwc using record id</sub>

### You need dependent picklists in a custom LWC form, where State depends on Country. How would you implement it?
*Mid (3–6 yrs) · scenario* · `lwc-058`

I use the uiObjectInfoApi wire adapters. getObjectInfo gives me the default record type Id, and getPicklistValues gives me the values for each field for that record type. For the dependent field, the response includes controllerValues, which maps each controlling value to an index. Every dependent value has a validFor array listing the controlling indexes it's valid for. So say controllerValues says India is index 2. When the user picks India, I keep only the State values whose validFor includes 2, like Maharashtra or Karnataka, and drop the rest. This respects record type picklist settings and needs no Apex. If a record type is used, I pass its Id instead of the default.

- getObjectInfo for defaultRecordTypeId
- getPicklistValues per field
- Filter with controllerValues[selected] in validFor
- No Apex; respects record type values

```java
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import ACCOUNT from '@salesforce/schema/Account';
import STATE from '@salesforce/schema/Account.State__c';

@wire(getObjectInfo, { objectApiName: ACCOUNT }) info;
@wire(getPicklistValues, { recordTypeId: '$info.data.defaultRecordTypeId', fieldApiName: STATE })
statePicklist;

get stateOptions() {
    const data = this.statePicklist.data;
    if (!data || !this.country) return [];
    const idx = data.controllerValues[this.country];
    return data.values.filter(v => v.validFor.includes(idx));
}
handleCountry(e) { this.country = e.detail.value; this.state = null; }
```

<sub>Also asked as: Dependent picklist in LWC with getPicklistValues · How to filter dependent picklist values in Lightning Web Components? · controllerValues and validFor explained · dependent picklist lwc without apex</sub>

### Two components sit in different regions of a Lightning page. When a user selects an account in one, the other must show its details. How do you connect them?
*Senior (7–10 yrs) · scenario* · `lwc-059`

Since they have no parent-child relationship, I use Lightning Message Service. I create a message channel with a recordId field. The list component wires MessageContext and publishes the selected Id. The details component subscribes in connectedCallback, saves the Id in a field when a message arrives, and that field feeds a reactive getRecord wire or lightning-record-view-form, so it re-renders automatically. I unsubscribe in disconnectedCallback. If the publisher lives in the utility bar or another tab, I subscribe with APPLICATION_SCOPE.

- Message channel with a recordId field
- Publisher: publish(context, channel, payload)
- Subscriber: subscribe in connectedCallback, unsubscribe on disconnect
- Feed the Id into a reactive wire

```java
import { LightningElement, wire } from 'lwc';
import { subscribe, unsubscribe, MessageContext } from 'lightning/messageService';
import CHANNEL from '@salesforce/messageChannel/RecordSelected__c';

export default class AccountDetails extends LightningElement {
    @wire(MessageContext) messageContext;
    subscription;
    recordId;
    connectedCallback() {
        if (!this.subscription) {
            this.subscription = subscribe(this.messageContext, CHANNEL, (msg) => {
                this.recordId = msg.recordId;
            });
        }
    }
    disconnectedCallback() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }
}
// html: <lightning-record-view-form record-id={recordId} object-api-name="Account">...
```

<sub>Also asked as: Pass data between unrelated components using LMS · Communication between sibling components on a Lightning page · How to send a selected record Id to another component? · lms example sender and receiver</sub>

### Users want to upload files to a Case from a custom component. How would you do it?
*Fresher (0–2 yrs) · scenario* · `lwc-060`

I use the lightning-file-upload base component and set record-id to the Case Id, so uploaded files are linked to the record as Salesforce Files automatically, with no Apex. I set accept to the allowed extensions and multiple if needed. The onuploadfinished event gives me event.detail.files, with the name and document Id of each file, so I show a toast and refresh any file list I display. If I need extra processing after upload, like setting a file category, I pass the document Ids to an Apex method.

- lightning-file-upload with record-id links files to the record
- accept and multiple attributes
- onuploadfinished: event.detail.files
- Apex only for post-processing

```html
<lightning-file-upload label="Attach files" name="caseFiles" record-id={recordId}
    accept={acceptedFormats} multiple onuploadfinished={handleUploadFinished}>
</lightning-file-upload>

acceptedFormats = ['.pdf', '.png', '.jpg'];
handleUploadFinished(event) {
    const files = event.detail.files;
    this.dispatchEvent(new ShowToastEvent({
        title: files.length + ' file(s) uploaded', variant: 'success'
    }));
}
```

<sub>Also asked as: File upload to a record in LWC · lightning-file-upload example · How to attach files to a record from LWC? · upload document to record lightning web component</sub>

### How would you implement pagination in an LWC showing a large list of records?
*Mid (3–6 yrs) · scenario* · `lwc-061`

I do server-side pagination, so I never load everything. The component keeps pageNumber and pageSize as reactive fields and wires a cacheable Apex method that returns one page plus the total count. Next and Previous change pageNumber, which re-runs the wire, and getters disable the buttons on the first and last page. Say there are 1,000 Cases and a page size of 25. Apex returns 25 records and a total of 1,000, so I know there are 40 pages, and on page 40 the Next button is disabled. In Apex I use LIMIT and OFFSET, which is simple, but OFFSET is capped at 2,000 rows. So for bigger data sets I switch to keyset paging, filtering by the last record's sort value, or to infinite loading.

- Reactive pageNumber/pageSize on a cacheable wire
- Return records plus total count
- OFFSET max 2,000: use keyset paging for large sets
- Getters disable Next/Previous

```java
// Apex
public with sharing class CasePager {
    public class Page {
        @AuraEnabled public List<Case> records;
        @AuraEnabled public Integer total;
    }
    @AuraEnabled(cacheable=true)
    public static Page getPage(Integer pageSize, Integer pageNumber) {
        Page p = new Page();
        Integer offsetRows = (pageNumber - 1) * pageSize;
        p.total = [SELECT COUNT() FROM Case WITH USER_MODE];
        p.records = [SELECT Id, CaseNumber, Subject FROM Case WITH USER_MODE ORDER BY CreatedDate DESC LIMIT :pageSize OFFSET :offsetRows];
        return p;
    }
}
// js
pageNumber = 1; pageSize = 20;
@wire(getPage, { pageSize: '$pageSize', pageNumber: '$pageNumber' }) page;
get isLast() { return this.page.data && this.pageNumber * this.pageSize >= this.page.data.total; }
next() { this.pageNumber++; }
prev() { this.pageNumber--; }
```

<sub>Also asked as: Pagination in Lightning Web Components · Next and previous buttons with Apex · Server-side pagination using OFFSET in LWC · paging records lwc datatable</sub>

### Your LWC works for admins but regular users see no data or an error. How do you troubleshoot it?
*Senior (7–10 yrs) · troubleshooting* · `lwc-062`

I check access layer by layer. First, does the user's profile or permission set grant access to the Apex class? Without it, the call fails outright. Next, record visibility. If the class is with sharing, the user may simply not see those records, which is often correct. Then object and field permissions, especially if I query WITH USER_MODE, which throws when a field isn't readable. For example, if the query includes a custom Margin field that only admins can read, user mode throws for everyone else, and the component shows an error. To find the real cause, I log in as the user, check the browser console and network response for the actual error, and capture a debug log for that user. I also confirm the component is on the right Lightning page activation for their app and profile.

- Apex class access via permission set
- Sharing: record visibility differs per user
- CRUD/FLS errors under user mode
- Login As, browser console, user debug log
- Page activation per app/profile

<sub>Also asked as: Component works for me but not for other users · LWC shows nothing for standard users · You don't have access to the Apex class error · lwc data not visible for some profiles</sub>

### Your wired Apex method never runs when the component is placed on an App page, but it works on a record page. Why?
*Mid (3–6 yrs) · troubleshooting* · `lwc-063`

A wire with a reactive parameter does not call the adapter while that parameter is undefined. On a record page the framework sets recordId, but on an App page or Home page there is no record context, so '$recordId' stays undefined and the wire waits forever. The fix depends on the design: restrict the component to record pages through its targets, let the admin pass an Id as a design property, or get the Id from somewhere else like Lightning Message Service or CurrentPageReference state. Other common causes are a typo in the dollar parameter name, or the Apex method missing cacheable=true.

- Wire waits while a reactive param is undefined
- recordId only exists on record pages
- Check '$param' spelling and cacheable=true
- Provide Id via design property, LMS or page state

<sub>Also asked as: Wire not firing in LWC · recordId is undefined on app page · Why does my @wire not call Apex? · wire method not getting called</sub>

### How would you show a loading spinner and handle errors while your component fetches data?
*Fresher (0–2 yrs) · scenario* · `lwc-064`

I keep a few clear states: loading, error, empty and data. Before an imperative call, I set isLoading to true, and in a finally block I set it back to false, so the spinner always goes away, even when the call fails. In the catch, I store a readable error message. For a wired call, the state is loading until either data or error is provisioned. In the template, I use lwc:if and lwc:elseif to show exactly one of these: the spinner, the error, an empty message, or the data. So if an Account has no Contacts, the user sees "No contacts found" instead of a blank box, and if the call fails, they see the reason instead of a spinner that never stops.

- Set isLoading before, reset in finally
- Store a readable error in catch
- Template shows one state at a time with lwc:if

```java
async connectedCallback() {
    this.isLoading = true;
    try {
        this.orders = await getOrders({ accountId: this.recordId });
    } catch (e) {
        this.error = e.body?.message || 'Something went wrong';
    } finally {
        this.isLoading = false;
    }
}
get isEmpty() { return !this.isLoading && !this.error && this.orders?.length === 0; }
```

<sub>Also asked as: Show spinner during Apex call in LWC · Loading state in Lightning Web Components · How to display an error message when the call fails? · spinner lwc example</sub>

### The business wants to see and work with tens of thousands of records in one LWC. How would you design it?
*Senior (7–10 yrs) · design* · `lwc-065`

I would push back on loading everything into the browser, because a single transaction can only retrieve 50,000 rows and large payloads make the page slow. Instead I design around server-side filtering and paging: users filter first, then I load in batches with infinite loading or pagination using keyset paging. I select only the columns needed, and I show counts or summaries using aggregate queries rather than raw rows. For bulk actions on all matching records, the component sends the filter criteria to Apex and a Batch Apex or Queueable job processes them asynchronously, and the UI shows progress. If they mainly need analysis, I suggest a report or dashboard instead.

- Filter first, then page or infinite-load in batches
- Keyset paging, lean field lists
- Aggregates for summaries
- Bulk actions via async Apex with progress
- Reports may fit better

<sub>Also asked as: Showing a very large data set in a datatable · Datatable is slow with thousands of rows · Design an LWC for big data volume · how to handle 50000 records in lwc</sub>

### Users edit a field in the standard record detail, but your custom component on the same page keeps showing the old value. How do you fix it?
*Senior (7–10 yrs) · scenario* · `lwc-066`

This happens when the component reads the record through Apex, because Apex results are cached separately and do not know the record changed. The best fix is to read record fields through Lightning Data Service, using getRecord or lightning-record-view-form, since LDS shares one cache with the standard components and updates automatically when the record is saved. If I really need Apex, for example for a calculated query, I wire getRecord on the fields that matter, and when its data changes I call refreshApex on my Apex wire. That way any edit on the page triggers a refresh.

- Apex results don't see record edits
- Prefer getRecord / record-view-form: shared LDS cache
- Or watch getRecord and call refreshApex on change

```java
@wire(getRecord, { recordId: '$recordId', fields: [STATUS_FIELD] })
recordChanged({ data }) {
    if (data && this.wiredSummary) {
        refreshApex(this.wiredSummary);  // re-run the Apex wire when the record changes
    }
}
```

<sub>Also asked as: Custom LWC not updating when the record is edited · Keep LWC in sync with the standard record detail · Component shows stale field after inline edit on record page · lwc not refreshing on record update</sub>

### You need one component that works on a Lightning record page and also in an Experience Cloud site. What do you consider?
*Senior (7–10 yrs) · design* · `lwc-067`

I add both sets of targets: the record page target, and lightningCommunity__Page plus lightningCommunity__Default, and expose the properties each one needs. Then I check context differences. External and guest users have different licenses, sharing and object access, so the Apex must be secure, with sharing and user mode. For guest users I'm extra careful, because they're unauthenticated. Say the component shows open Cases. Internally, an agent sees the Cases their sharing allows, but on the site, a customer user should only see what their own access allows, and the same Apex has to respect both. Navigation should use page references, not hard-coded URLs, since site URLs differ. Some modules behave differently in LWR sites. For example, ShowToastEvent isn't supported there, so I use lightning/toast. I also check styling against the site theme and test on mobile.

- Targets for both record page and Experience Builder
- Different licenses, sharing and guest access
- Page references, not hard-coded URLs
- Check module support in LWR sites, e.g. toasts
- Test styling with site theme

<sub>Also asked as: Reusing an LWC in Experience Cloud and internal org · LWC for both Lightning Experience and community site · What changes when an LWC runs in Experience Cloud? · lwc in experience site and lightning page</sub>

### Build a screen quick action that updates the record, closes itself and refreshes the record page.
*Senior (7–10 yrs) · scenario* · `lwc-068`

I expose the component with the lightning__RecordAction target and actionType ScreenAction. On Save I call Apex or updateRecord. If I used Apex, I call notifyRecordUpdateAvailable so the record page and related LDS components show the new values. Then I dispatch CloseActionScreenEvent to close the modal and show a success toast. On error I keep the modal open and display the message, so the user doesn't lose their input. The Cancel button just dispatches CloseActionScreenEvent.

- actionType ScreenAction
- Save via Apex, then notifyRecordUpdateAvailable
- CloseActionScreenEvent closes the modal
- Keep modal open on error

```java
import { LightningElement, api } from 'lwc';
import { CloseActionScreenEvent } from 'lightning/actions';
import { notifyRecordUpdateAvailable } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import escalate from '@salesforce/apex/CaseService.escalate';

export default class EscalateCase extends LightningElement {
    @api recordId;
    reason;
    async handleSave() {
        try {
            await escalate({ caseId: this.recordId, reason: this.reason });
            await notifyRecordUpdateAvailable([{ recordId: this.recordId }]);
            this.dispatchEvent(new ShowToastEvent({ title: 'Escalated', variant: 'success' }));
            this.dispatchEvent(new CloseActionScreenEvent());
        } catch (e) {
            this.error = e.body?.message;
        }
    }
    handleCancel() { this.dispatchEvent(new CloseActionScreenEvent()); }
}
```

<sub>Also asked as: Close quick action and refresh record page in LWC · CloseActionScreenEvent with save · How do I refresh the record after a quick action saves? · quick action lwc save and close</sub>

### Write a component that asks for confirmation and deletes the current record, then goes back to the list view.
*Mid (3–6 yrs) · scenario* · `lwc-069`

I use LightningConfirm from lightning/confirm to ask the question, which returns true or false. If confirmed, I call deleteRecord from lightning/uiRecordApi with the record Id, which goes through LDS and respects permissions. On success I show a toast and navigate to the object's list view with NavigationMixin, since the record page no longer exists. If deletion fails, for example because of a validation rule or a related record, I show the error message.

- LightningConfirm.open returns a boolean
- deleteRecord(recordId) via LDS
- Navigate to standard__objectPage list after delete

```java
import LightningConfirm from 'lightning/confirm';
import { deleteRecord } from 'lightning/uiRecordApi';

async handleDelete() {
    const ok = await LightningConfirm.open({ message: 'Delete this record?', variant: 'header', label: 'Confirm delete' });
    if (!ok) return;
    try {
        await deleteRecord(this.recordId);
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: { objectApiName: this.objectApiName, actionName: 'list' }
        });
    } catch (e) {
        this.error = e.body?.message;
    }
}
```

<sub>Also asked as: Delete record from LWC with confirmation · deleteRecord uiRecordApi example · Confirm dialog before delete in Lightning Web Components · delete and navigate to object home lwc</sub>

### How do you validate all inputs in a custom LWC form before saving?
*Mid (3–6 yrs) · code* · `lwc-070`

I set validation attributes on the base inputs, like required, pattern, min or type email, so each input knows its own rules. On Save I collect all inputs with querySelectorAll and reduce over them, calling reportValidity on each, which shows the error under the field and returns whether it is valid. Only if all are valid do I call Apex. For rules across fields, like end date after start date, I call setCustomValidity on the relevant input and then reportValidity. I still validate on the server too, because the client can be bypassed.

- Use required, pattern, min/max on base inputs
- reportValidity shows messages and returns a boolean
- setCustomValidity for cross-field rules
- Always validate again on the server

```java
handleSave() {
    const inputs = [...this.template.querySelectorAll('lightning-input, lightning-combobox')];
    const end = this.refs.endDate;
    end.setCustomValidity(this.endDate < this.startDate ? 'End date must be after start date' : '');
    const allValid = inputs.reduce((ok, input) => input.reportValidity() && ok, true);
    if (allValid) {
        this.save();
    }
}
```

<sub>Also asked as: Form validation in Lightning Web Components · reportValidity and checkValidity example · How to check required fields in LWC before submit? · validate lightning-input fields</sub>

### You need to show a Chart.js chart in an LWC. How do you load and use a third-party library?
*Senior (7–10 yrs) · scenario* · `lwc-071`

I upload the library as a static resource, import its URL from @salesforce/resourceUrl, and load it with loadScript from lightning/platformResourceLoader, which returns a promise and only loads the file once per page. Because the library needs a real canvas element, I load it in renderedCallback with a guard flag, then build the chart on the canvas I get through lwc:ref or querySelector. If the library manipulates DOM itself, I give it a container with lwc:dom manual. I check the library works under Lightning Web Security, and I destroy the chart in disconnectedCallback.

- Static resource + loadScript/loadStyle
- Load once in renderedCallback with a guard
- Use lwc:dom='manual' for library-managed DOM
- Check LWS compatibility; clean up on disconnect

```java
import { LightningElement } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import CHARTJS from '@salesforce/resourceUrl/chartjs';

export default class SalesChart extends LightningElement {
    loaded = false;
    chart;
    async renderedCallback() {
        if (this.loaded) return;
        this.loaded = true;
        await loadScript(this, CHARTJS);
        const ctx = this.refs.canvas.getContext('2d');
        this.chart = new window.Chart(ctx, { type: 'bar', data: this.chartData });
    }
    disconnectedCallback() { this.chart?.destroy(); }
}
// html: <canvas lwc:ref="canvas"></canvas>
```

<sub>Also asked as: Use a third-party JavaScript library in LWC · loadScript from static resource example · How to include Chart.js in Lightning Web Components? · platformResourceLoader lwc</sub>

### From a Contact-related component on an Account page, open the New Contact form with the Account prefilled. How?
*Fresher (0–2 yrs) · scenario* · `lwc-072`

I use NavigationMixin with a standard__objectPage page reference, objectApiName Contact and actionName new. To prefill fields, I build an object of field API names and values, like AccountId set to the current recordId, encode it with encodeDefaultFieldValues from lightning/pageReferenceUtils, and pass it as defaultFieldValues in the state. Salesforce opens the standard new record modal with those values, so validation rules, layouts and record types still apply.

- standard__objectPage with actionName 'new'
- encodeDefaultFieldValues from lightning/pageReferenceUtils
- Pass in state.defaultFieldValues
- Standard form keeps layouts and validation

```java
import { NavigationMixin } from 'lightning/navigation';
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';

newContact() {
    const defaults = encodeDefaultFieldValues({ AccountId: this.recordId, LeadSource: 'Partner' });
    this[NavigationMixin.Navigate]({
        type: 'standard__objectPage',
        attributes: { objectApiName: 'Contact', actionName: 'new' },
        state: { defaultFieldValues: defaults }
    });
}
```

<sub>Also asked as: Navigate to new record page with default values · encodeDefaultFieldValues example · Prefill fields when creating a record from LWC · open new record form with account id lwc</sub>

## Aura and Visualforce

### What is the difference between Aura components and Lightning Web Components?
*Fresher (0–2 yrs) · comparison* · `lwc-073`

Aura is Salesforce's older, proprietary component framework. A bundle has markup, a controller, a helper, a renderer, and events defined in its own syntax. LWC is built on modern web standards, so the browser handles things like custom elements and shadow DOM natively. That makes it lighter and faster, and the code is standard JavaScript classes and modules. LWC also has better tooling, Jest unit testing, and a cleaner event model based on DOM events. For example, a simple counter in Aura means a component markup file, a controller and often a helper. In LWC it's an HTML template and one JavaScript class, plus the meta file. Both can live on the same page and share Lightning Data Service. An LWC can be placed inside an Aura component, but an Aura component can't be placed inside an LWC. For new work, Salesforce recommends LWC.

- Aura: proprietary syntax, controller/helper/renderer
- LWC: web standards, faster, standard JS
- LWC can be nested in Aura, not the reverse
- Both share LDS and coexist on a page

<sub>Also asked as: Aura vs LWC · Why is LWC faster than Aura? · Compare Aura framework and Lightning Web Components · difference between aura and lwc</sub>

### Can you use an LWC inside an Aura component, and an Aura component inside an LWC?
*Fresher (0–2 yrs) · concept* · `lwc-074`

Yes, one way only. An LWC can be used inside an Aura component, and in Aura markup I reference it with the c colon camelCase name, pass values as attributes, and handle its custom events with on-handlers. An Aura component cannot be used inside an LWC, because LWC only understands web components. That is why, when migrating, we usually start with leaf components and build upward, and sometimes keep a thin Aura wrapper around an LWC when we need a capability that is only available to Aura. Both kinds of components can still communicate through Lightning Message Service and share data through LDS.

- LWC inside Aura: yes
- Aura inside LWC: no
- Aura passes attributes and listens to LWC events
- Migrate bottom-up, leaf components first

<sub>Also asked as: Nest LWC in Aura · Can LWC contain Aura components? · How do Aura and LWC work together? · lwc inside aura wrapper</sub>

### When would you still use Aura instead of LWC today?
*Senior (7–10 yrs) · concept* · `lwc-075`

For new development I choose LWC by default, and Aura only when a specific feature has no LWC equivalent yet. Salesforce has been closing these gaps over the years, for example modals, console workspace tab APIs, URL-addressable components and page refresh now have LWC modules. Areas where teams have traditionally kept Aura include custom Lightning page templates for App Builder and some older integration points, like Flow local actions or the original Lightning Out beta, which needed an Aura app; Lightning Out 2.0 now runs LWCs directly. In those cases I keep the Aura part as a thin wrapper and put the real logic in an LWC inside it, so moving fully later is easy. I always confirm against current docs before deciding.

- Default to LWC for new work
- Gaps keep closing: modal, workspace API, URL addressable, refresh
- Keep Aura as a thin wrapper when truly needed
- Verify against current documentation

<sub>Also asked as: Is Aura still needed? · What can Aura do that LWC cannot? · Should we build anything new in Aura? · use cases for aura components now</sub>

### What is the difference between component events and application events in Aura?
*Mid (3–6 yrs) · comparison* · `lwc-076`

A component event is fired by a component and handled by components in its containment hierarchy, usually the parent, so it's like a child-to-parent notification. It's registered with aura:registerEvent and fired with component.getEvent, and it goes through capture and bubble phases. An application event is a broadcast. Any component with a handler for it receives it, no matter where it is on the page, and it's fired with $A.get('e.c:EventName'). Application events also have a default phase. For example, a row telling its own table "I was selected" is a component event. A message like "the selected region changed, everyone refresh" would traditionally be an application event. But because broadcasts are hard to trace and can cause performance issues, the guidance is to use component events where possible, and Lightning Message Service for cross-component communication.

- Component event: hierarchy-based, capture and bubble
- Application event: broadcast to all handlers, plus default phase
- Prefer component events; LMS for unrelated components

<sub>Also asked as: Aura component event vs application event · When to use application events? · How do Aura events propagate? · aura events types</sub>

### How does an LWC send data to an enclosing Aura component?
*Mid (3–6 yrs) · code* · `lwc-077`

The LWC dispatches a normal CustomEvent with the data in detail. In the Aura markup, I add an attribute with on plus the event name on the LWC tag, pointing to a controller action. In the Aura controller, I read each property of detail with event.getParam and the property name. Say the LWC fires a select event with detail containing contactId. In Aura, the tag has onselect pointing to c.handleSelect, and in that handler, event.getParam('contactId') gives me the Id. Going the other way, Aura passes data to the LWC through its public @api properties as attributes, and it can call @api methods by getting the component with aura:id and component.find.

- LWC: dispatchEvent(new CustomEvent('name', { detail }))
- Aura markup: onname="{!c.handler}"
- Aura controller: event.getParam('property')
- Aura to LWC via attributes and @api methods

```java
// LWC: filterPanel.js
this.dispatchEvent(new CustomEvent('filterchange', { detail: { status: this.status } }));

<!-- Aura wrapper markup -->
<c:filterPanel onfilterchange="{!c.handleFilterChange}" />

// Aura controller
handleFilterChange : function(component, event, helper) {
    var status = event.getParam('status');
    component.set('v.status', status);
}
```

<sub>Also asked as: LWC event handled in Aura · Communicate from LWC to Aura parent · How to read event detail in Aura from LWC? · aura wrapper listen to lwc event</sub>

### How do you call an Apex method from an Aura component?
*Fresher (0–2 yrs) · code* · `lwc-078`

I get the action with component.get('c.methodName'), set parameters with setParams using names that match the Apex parameters, and register a callback with setCallback. Inside the callback, I check response.getState(). On SUCCESS, I read getReturnValue and set it on an attribute. On ERROR, I read getError. Then I queue it with $A.enqueueAction, because Aura batches server calls. For example, to load Contacts, I get c.getContacts, set accountId with setParams, and in the callback I set the result on a contacts attribute. If I forget the enqueueAction line, the call is never sent. The Apex method must be static and @AuraEnabled, and the same method can be reused from LWC, which helps during migration.

- component.get('c.method'), setParams, setCallback
- Check getState(): SUCCESS / ERROR
- $A.enqueueAction to send
- Apex must be static @AuraEnabled

```java
({
    loadContacts : function(component) {
        var action = component.get('c.getContacts');
        action.setParams({ accountId: component.get('v.recordId') });
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === 'SUCCESS') {
                component.set('v.contacts', response.getReturnValue());
            } else if (state === 'ERROR') {
                console.error(response.getError());
            }
        });
        $A.enqueueAction(action);
    }
})
```

<sub>Also asked as: Aura server-side controller call · $A.enqueueAction example · How to get data from Apex in Aura? · aura apex call set callback</sub>

### What is the difference between a standard controller, a custom controller and a controller extension in Visualforce?
*Fresher (0–2 yrs) · comparison* · `lwc-079`

A standard controller is provided by Salesforce for an object, like standardController equals Account. It gives me the record plus actions like save, edit and delete without code, and it respects the user's permissions. A custom controller is an Apex class that completely replaces the standard one. I write all the logic myself, and it runs in system mode, so I have to handle sharing and security. An extension is an Apex class that adds to or overrides a standard or custom controller. Its constructor receives the controller, so I keep the standard save behavior and only add what's missing. For example, an Account page that needs the normal save plus a list of the Account's open Cases is a standard controller with one extension. A page can have several extensions, and if methods clash, the leftmost one wins.

- Standard: built-in actions, respects permissions
- Custom: full Apex control, system mode
- Extension: adds or overrides, constructor takes the controller
- Multiple extensions, leftmost wins

<sub>Also asked as: Visualforce controller types · Standard controller vs custom controller vs extension · When do you use an extension in Visualforce? · vf page controllers explained</sub>

### Write a simple Visualforce controller extension for the Account standard controller.
*Mid (3–6 yrs) · code* · `lwc-080`

The extension's constructor takes ApexPages.StandardController, and from it I get the current record with getRecord or the Id with getId. I can then add properties and action methods the page calls, while the page still has the standard save and cancel actions. Here the extension loads open cases for the account and adds a custom action that returns a PageReference to redirect. I declare the class with sharing so it respects record access, and query with user mode for field security.

- Constructor(ApexPages.StandardController ctrl)
- ctrl.getId() / ctrl.getRecord()
- Action methods return PageReference
- with sharing + user mode for security

```java
public with sharing class AccountCasesExt {
    private final Id accountId;
    public List<Case> openCases { get; private set; }

    public AccountCasesExt(ApexPages.StandardController ctrl) {
        accountId = ctrl.getId();
        openCases = [SELECT Id, CaseNumber, Subject FROM Case
                     WHERE AccountId = :accountId AND IsClosed = false WITH USER_MODE];
    }
    public PageReference goToNewCase() {
        PageReference pr = Page.NewCase;
        pr.getParameters().put('accId', accountId);
        return pr;
    }
}
// <apex:page standardController="Account" extensions="AccountCasesExt">
```

<sub>Also asked as: Visualforce extension example · How do you get the record in a controller extension? · ApexPages.StandardController constructor example · vf extension code</sub>

### What is view state in Visualforce and how do you fix a 'maximum view state size exceeded' error?
*Mid (3–6 yrs) · troubleshooting* · `lwc-081`

View state is the encrypted, hidden data Visualforce sends with a page that has an apex:form. It holds the controller's non-transient state, so it survives postbacks. The limit is 170 KB, and big lists, wrapper objects or blobs go past it quickly. Say a controller keeps a list of 2,000 wrapper rows with checkboxes. All of that travels with every postback, and you can easily hit the limit. To reduce it, I mark variables that can be rebuilt as transient so they aren't stored, query only the fields I need, avoid keeping large collections in controller state, paginate with StandardSetController, and use only one apex:form where possible. For read-heavy pages, JavaScript remoting avoids view state entirely. The View State tab in the development mode footer shows what's using the space.

- View state holds controller state between postbacks
- Limit 170 KB
- transient variables are not saved
- Paginate, fewer fields, remoting to avoid it

<sub>Also asked as: Visualforce view state limit · How to reduce view state? · What is the transient keyword used for? · view state too large error vf</sub>

### What is JavaScript remoting in Visualforce and how do you use it?
*Mid (3–6 yrs) · code* · `lwc-082`

JavaScript remoting lets JavaScript in a Visualforce page call a static Apex method annotated with @RemoteAction directly, and get the result asynchronously. It doesn't send or rebuild view state, so it's fast and good for responsive, JavaScript-heavy pages. But I have to update the page myself in the callback. I call it with Visualforce.remoting.Manager.invokeAction, passing the remote action reference, parameters, and a callback that checks event.status. For example, a type-ahead search box on a Visualforce page can call a searchAccounts remote action when the user pauses typing, and the callback draws the results list. I keep the escape option on to protect against script injection. And since the method runs in system mode, I enforce security in Apex.

- @RemoteAction static method
- No view state: fast, but manual DOM updates
- Visualforce.remoting.Manager.invokeAction
- Check event.status; keep escape: true

```java
public with sharing class AccountRemoter {
    @RemoteAction
    public static List<Account> findAccounts(String term) {
        String key = '%' + term + '%';
        return [SELECT Id, Name FROM Account WHERE Name LIKE :key WITH USER_MODE LIMIT 20];
    }
}
<script>
Visualforce.remoting.Manager.invokeAction(
    '{!$RemoteAction.AccountRemoter.findAccounts}', searchTerm,
    function(result, event) {
        if (event.status) { renderRows(result); } else { console.error(event.message); }
    },
    { escape: true }
);
</script>
```

<sub>Also asked as: @RemoteAction example · Visualforce remoting vs actionFunction · How to call Apex from JavaScript in Visualforce? · vf remoting invokeAction</sub>

### What is the difference between actionFunction, actionSupport and JavaScript remoting in Visualforce?
*Mid (3–6 yrs) · comparison* · `lwc-083`

actionSupport attaches AJAX behavior to an event on another component, like onchange on an input. It calls a controller action and rerenders part of the page. actionFunction defines a JavaScript function that calls a controller action, so I can trigger it from my own scripts, and it also supports rerender. Both submit the form and view state, run in the controller's context, and Visualforce handles the partial page refresh for me. JavaScript remoting calls a static @RemoteAction method without view state, which is faster and lighter. But the method has no access to controller instance state, and I update the page in JavaScript myself. For example, if picking a Country should refresh a State list, actionSupport on onchange is simplest. If my own script needs to call the controller after some custom logic, that's actionFunction. And for a fast search with no form state, remoting.

- actionSupport: AJAX on a component event + rerender
- actionFunction: callable JS function + rerender
- Both carry view state
- Remoting: static method, no view state, manual UI update

<sub>Also asked as: apex:actionFunction vs apex:actionSupport · When do you use remoting instead of actionFunction? · AJAX options in Visualforce · action function action support difference</sub>

### How would you approach migrating a set of Aura components to LWC?
*Senior (7–10 yrs) · design* · `lwc-084`

I start with an inventory: which components exist, where they are used, how complex they are and what Aura-only features they rely on. Then I migrate bottom-up, beginning with leaf components, because an LWC can sit inside an Aura parent but not the reverse, so the app keeps working during the migration. I map concepts as I go: attributes to @api properties or fields, aura:if and aura:iteration to lwc:if and for:each, component events to custom events, application events to Lightning Message Service, $A.enqueueAction to wire or imperative Apex, and force events like showToast and navigateToSObject to their LWC modules. I reuse existing Apex, add Jest tests, and release in small batches with regression testing rather than a big-bang rewrite.

- Inventory and prioritize
- Bottom-up: leaf components first
- Map attributes, directives, events, server calls
- Reuse Apex, add Jest tests, ship incrementally

<sub>Also asked as: Aura to LWC migration strategy · Steps to convert Aura components into LWC · How do you plan a migration from Aura to Lightning Web Components? · aura migration best practices</sub>

### A business still uses several Visualforce pages. How would you modernize them, and can you use LWC inside Visualforce?
*Senior (7–10 yrs) · design* · `lwc-085`

I first decide per page whether it needs to change at all. Pages used for PDF generation with renderAs pdf or certain email templates are still a good fit for Visualforce. Interactive pages I usually rebuild as LWCs on Lightning pages, reusing the Apex logic where it is clean and moving business rules out of controllers. If a page must stay in Visualforce for a while, I can embed an LWC in it with Lightning Out, using an Aura dependency app and $Lightning.use and createComponent, which lets me modernize piece by piece. For running LWCs on external, non-Salesforce sites, Lightning Out 2.0 is the newer generally available option. Lightning Message Service can also connect Visualforce and LWC on the same Lightning page during the transition.

- Keep VF where it fits, e.g. PDF rendering
- Rebuild interactive pages as LWC on Lightning pages
- Lightning Out to embed LWC in VF during transition
- Lightning Out 2.0 for external sites; LMS bridges VF and LWC

<sub>Also asked as: Migrating Visualforce to LWC · Use LWC in a Visualforce page · Lightning Out in Visualforce · should we rewrite visualforce pages</sub>
