# Agentforce: development, scenarios and newer features

70 questions. Levels: Fresher (0–2 yrs) 24 · Mid (3–6 yrs) 29 · Senior (7–10 yrs) 17

## Agentforce

### What is Agentforce 360?
*Fresher (0–2 yrs) · concept* · `agent-051`

Agentforce 360 is the name Salesforce gave to the newest version of the Agentforce platform at Dreamforce in October 2025. It's not one product, it's the whole stack for building, running and watching agents. That covers the new Agentforce Builder with Agent Script, the Atlas Reasoning Engine, Data 360 for grounding, the Trust Layer, channels like Agentforce Voice and Slack, and Agentforce Observability for monitoring. Say a laptop retailer wants help with returns. They build a returns agent in Agentforce Builder, ground it on the return policy, put it on website chat and the phone line, and then track deflection and quality scores in Observability. The point I'd make in an interview is that the big shift is control: hybrid reasoning lets you lock down fixed business steps and let the LLM handle the conversation around them.

- Announced at Dreamforce, October 2025
- Builder + Agent Script, Atlas, Data 360, Trust Layer, Voice, Slack, Observability
- Main shift: hybrid reasoning gives more deterministic control

<sub>Also asked as: What does Agentforce 360 mean? · What did Salesforce announce as Agentforce 360 at Dreamforce? · Is Agentforce 360 a separate product from Agentforce? · agent force 360 kya hai</sub>

### How is an Agentforce agent different from an Einstein Bot?
*Fresher (0–2 yrs) · comparison* · `agent-052`

An Einstein Bot follows dialogs I design step by step, while an Agentforce agent uses an LLM to understand the request and pick the right subagent and action on its own. Take a bike shop. With a bot, I build a menu, like Track Order or Return Item, with a dialog tree behind each button. If the customer types 'my bike came with a bent wheel, can I swap it?', the bot easily gets lost unless I predicted that exact path. An agent reads that sentence, routes it to the returns subagent, looks up the order with an action and explains the options in plain language. Bots are still predictable for very fixed flows. But with Agent Script I can now get that same predictability inside an agent where it matters, and Salesforce provides tooling to upgrade existing bots into agents.

- Bot: designed dialogs, menus, rule-based paths
- Agent: LLM reasoning picks subagent and actions
- Agent Script brings deterministic steps into agents
- Upgrade tooling exists for bot-to-agent

<sub>Also asked as: Agentforce vs Einstein Bots, what's the difference? · Why use Agentforce instead of a traditional chatbot? · Is Agentforce just a smarter chatbot? · difference between bot and agent in salesforce</sub>

### What is AgentExchange?
*Fresher (0–2 yrs) · concept* · `agent-053`

AgentExchange is Salesforce's marketplace for ready-made Agentforce building blocks, sitting alongside AppExchange. Partners list things like agent templates, actions, prompt templates and MCP servers you can install instead of building everything yourself. Example: an accounting firm wants its employee agent to create invoices in PayPal. Instead of writing callouts from scratch, I'd check AgentExchange for a PayPal MCP server or action package, read what it does, install it in a sandbox and test it with the agent. I treat anything from the marketplace like a managed package. I check the security review, which data it touches, which permissions the agent user needs for it, and whether it adds extra cost, before it goes anywhere near production.

- Marketplace for agent templates, actions, prompt templates, MCP servers
- Install and test in a sandbox first
- Review data access, permissions and cost like any package

<sub>Also asked as: Where can I find prebuilt Agentforce actions or templates from partners? · Is there a marketplace for Agentforce components? · AgentExchange vs AppExchange?</sub>

### What is MCP and how does Agentforce use it?
*Fresher (0–2 yrs) · concept* · `agent-055`

MCP, the Model Context Protocol, is an open standard that lets AI agents discover and call tools on other systems in one common way, so you don't hand-build a new integration for every tool. In Agentforce, an admin registers an MCP server in the org, reviews the tools it exposes and allows only the ones the agent should use. Those allowed tools then work like agent actions. Example: a consulting firm's employee agent needs to create invoices in a billing tool that offers an MCP server. I'd register the server with OAuth, allow just 'create invoice' and 'get invoice status', not 'delete customer', and test it in a sandbox. It also works the other way: Salesforce offers MCP servers so outside AI assistants can work with Salesforce data. The interview point is governance: allowlist tools, use proper auth and keep least privilege.

- Open standard for agents to discover and call tools
- Register server, allowlist specific tools, tools act like actions
- Salesforce also exposes MCP servers for outside assistants
- Governance: allowlisting, OAuth, least privilege

<sub>Also asked as: What is Model Context Protocol in Agentforce? · Can Agentforce connect to MCP servers? · How do MCP tools become agent actions? · M C P support in agentforce</sub>

### What is Agentforce Voice?
*Fresher (0–2 yrs) · concept* · `agent-057`

Agentforce Voice lets an Agentforce agent handle phone calls, listening and talking instead of chatting. It became generally available in October 2025. Picture a dental clinic. After hours, the agent picks up and the patient says 'I need to move my cleaning to next Tuesday'. The agent checks the schedule through an action and confirms the new slot out loud. Calls get live transcription, so a human can watch and take over, and it works with contact-center platforms like Amazon Connect, Genesys, Five9, NiCE and Vonage. What I'd tell an interviewer is that voice design is different from chat. Answers must be short, with no bullet lists or links. The agent should read numbers and dates back to confirm them. And there has to be an easy way to reach a human.

- GA October 2025
- Live transcription, human can monitor and take over
- Integrates with major contact-center platforms
- Voice design: short replies, confirm details, easy human path

<sub>Also asked as: Can Agentforce agents answer phone calls? · How does a voice agent work in Agentforce? · What should you consider when designing a voice agent?</sub>

### What is Agentforce Contact Center?
*Senior (7–10 yrs) · concept* · `agent-058`

Agentforce Contact Center is Salesforce's own CRM-native contact center, announced in March 2026, that brings voice, digital channels, AI agents and customer data into one system. The big difference from Service Cloud Voice is that telephony is built into the platform instead of relying on an outside telephony provider. Think of an internet provider. A customer calls about an outage. The Agentforce agent answers, checks the account and the outage status, and if the customer wants a technician, hands off to a human rep who sees the transcript and the case on the same screen. Salesforce says it will keep supporting integrations with existing contact-center vendors, so it's an option, not a forced move. In a client conversation I'd keep it high level and confirm availability and licensing for their region before proposing it.

- Announced March 2026
- Voice, digital, CRM data and AI agents in one system
- Telephony built into the platform
- Existing vendor integrations still supported

<sub>Also asked as: How is Agentforce Contact Center different from Service Cloud Voice? · Does Salesforce now have its own contact center product? · What did Salesforce launch for contact centers in 2026?</sub>

### What are Flex Credits in Agentforce?
*Fresher (0–2 yrs) · concept* · `agent-059`

Flex Credits are the consumption way to pay for Agentforce: you buy a pool of credits and each agent action uses some of them. When this model launched in May 2025, it was 500 dollars for 100,000 credits, and a standard action used 20 credits, so roughly ten cents per action. Example: if a returns agent usually runs three actions per conversation, look up the order, check the policy and create the return, that's about 60 credits per conversation. Usage shows up in Digital Wallet, where you can track consumption and budgets. There are also per-user options that suit heavy internal use, and a Flex Agreement that lets you move between models. Prices change, so I always confirm current rates with the account team. The design takeaway is simple: fewer, smarter actions directly lower the bill.

- Launch pricing: $500 per 100,000 credits, 20 credits per standard action
- Digital Wallet tracks usage
- Per-user options and Flex Agreement also exist
- Fewer actions = lower cost

<sub>Also asked as: How does Agentforce consumption pricing work? · How much does an Agentforce action cost? · What is Digital Wallet in Agentforce? · flex credit pricing explain</sub>

### How do Agentforce and Slackbot work together in Slack?
*Fresher (0–2 yrs) · concept* · `agent-060`

Slack is becoming the main place employees talk to agents. In January 2026 Salesforce made the reimagined Slackbot generally available as a personal AI agent inside Slack. It works from the conversations, files and Salesforce data the user already has access to, and it can summarize, draft briefs, schedule meetings and kick off workflows. Agentforce employee agents can be deployed into Slack too, and Slackbot is meant to coordinate with them. Example: a sales manager types 'what changed on the Acme renewal this week?' and gets a summary pulled from the deal channel and the opportunity, without opening Salesforce. The point I'd stress is permissions. Answers respect the user's existing access, so if a rep can't see an account in Salesforce, they shouldn't see it through Slack either.

- Reimagined Slackbot GA January 2026
- Works from permissioned Slack and Salesforce data
- Employee agents can be deployed in Slack
- Respects existing user access

<sub>Also asked as: What is the new Slackbot? · Can employees use Agentforce from Slack? · Is Slack the main interface for Agentforce agents?</sub>

### What industry-specific Agentforce agents are there, for example for financial services and healthcare?
*Mid (3–6 yrs) · concept* · `agent-078`

Salesforce ships prebuilt agent templates and actions for industries on top of the industry clouds, so you start from a working base instead of a blank agent. For financial services, built on Financial Services Cloud, there are agents like a Banking Service Agent for balance questions, transaction reviews, lost cards and rule-based fee reversals, advisor and banker agents that prep meetings and log follow-ups, an insurance service agent, and a digital loan officer. For healthcare, Agentforce for Health on Health Cloud includes skills like benefits verification and eligibility checks, prior authorization, appointment management, referral management and care gap outreach. Example: a regional bank could switch on the banking service agent, connect it to its card system, and add its own fee-reversal limits. The interview point: templates speed you up, but compliance rules, disclosures and audit trails still need careful setup.

- FSC: banking service, advisor/banker, insurance, loan officer agents
- Health Cloud: benefits verification, prior auth, appointments, referrals, care gaps
- Templates are a starting point; customize rules and compliance

<sub>Also asked as: Does Agentforce have prebuilt agents for banking or insurance? · What is Agentforce for Health? · Industry agents in Health Cloud and Financial Services Cloud</sub>

### What is Agentforce for Revenue, and how does the quoting agent work?
*Mid (3–6 yrs) · concept* · `agent-079`

Agentforce for Revenue brings agents into Revenue Cloud, Salesforce's quote-to-cash product, now sold as Agentforce Revenue Management. The best-known piece is the quoting agent: a rep types something like 'quote 25 licenses with a 10 percent discount' and the agent drafts the quote with the right products, pricing and terms. Example: a software reseller's rep is on the opportunity record, asks the agent for a quote for 50 seats plus onboarding, reviews the draft, adjusts one line and submits it for approval. Reps can work from Salesforce records or from Slack. Two things I'd add. The agent works within the rep's own permissions, so pricing and discount approvals still apply. And Salesforce CPQ is end-of-sale, still supported for existing customers, so new quoting-agent projects usually go with Revenue Cloud.

- Quoting agent drafts quotes from natural language
- Runs with the rep's permissions; approvals still apply
- Works from records and Slack
- Salesforce CPQ is end-of-sale; Revenue Cloud is the successor

<sub>Also asked as: Can Agentforce create quotes? · How does Agentforce work with Revenue Cloud? · Agentforce in quote-to-cash, explain</sub>

### What is a headless or autonomous agent in Agentforce?
*Fresher (0–2 yrs) · concept* · `agent-080`

A headless agent is one that runs without a chat window. Something else triggers it, like a record change, a schedule, a flow or an API call, and it does its reasoning and actions in the background. Example: a home-insurance company gets claim emails all day. When a new claim case is created, a flow calls an agent. The agent reads the description, checks the policy through an action, sets the claim type and priority, and drafts a first reply for the adjuster, all before any human opens the case. You build it the same way as a chat agent, with subagents and actions, but you call it from Flow, Apex or the Agent API. Because nobody is watching live, I'm extra careful with permissions, I log what it did, and I keep anything risky, like paying a claim, as a human approval step.

- Triggered by events, flows, Apex or API, not a person chatting
- Same building blocks as a chat agent
- Log actions; keep risky steps behind human approval

<sub>Also asked as: Can an agent run without a chat window? · What are ambient agents in Salesforce? · Agent that works in the background, how?</sub>

### What newer Prompt Builder features should a developer know about?
*Mid (3–6 yrs) · concept* · `agent-081`

The ones I'd mention are multimodal prompts, structured responses and batch processing. Multimodal means a template can take images and PDFs as input, not just text. Structured outputs let a template return JSON in a shape I define, and the platform guarantees it parses, which is great when Apex or an LWC needs to parse the output. Batch prompt processing runs up to a thousand prompts asynchronously, from a batch prompt action in Flow or from Apex using AI job run records. Example: a property-management firm gets photos of damage with each maintenance request. A multimodal template looks at the photo and the description and returns JSON with category, urgency and a short summary, which a flow writes into fields. Every night, a batch job does the same for any requests that came in by email. Templates can also combine several retrievers for grounding.

- Multimodal: images and PDFs as input
- Structured outputs: valid JSON in a defined shape
- Batch: up to 1,000 prompts async via Flow or Apex
- Templates can use several retrievers for grounding

<sub>Also asked as: What changed in Prompt Builder in Winter '26? · Can prompt templates read images or PDFs? · What is batch prompt processing? · Can a prompt template return JSON?</sub>

## Agentforce Development

### What is Agentforce Vibes?
*Fresher (0–2 yrs) · concept* · `agent-054`

Agentforce Vibes is Salesforce's AI coding assistant for developers. It's a plug-in for VS Code and VS Code-compatible IDEs like Cursor or Windsurf, and its built-in agent, Vibe Codey, works like a pair programmer that understands your org's schema and project. Say I need a trigger that blocks duplicate leads by email. I describe it in chat, Vibe Codey plans the change, writes the trigger and handler, generates a test class, runs code analysis and can help me deploy to a sandbox. It supports MCP, so it can use tools like the Salesforce DX MCP Server, and it has checkpoints so I can roll back a change I don't like. The gotcha I'd mention: AI-written code still goes through the same review, tests and pipeline as anything I write by hand. It speeds me up, but I still own the code.

- IDE plug-in for VS Code-compatible editors
- Vibe Codey: plan mode, code and test generation, code analysis, deploy help
- MCP support, checkpoints for rollback
- Same review and testing rules apply

<sub>Also asked as: What is vibe coding in Salesforce? · What is Vibe Codey? · Which AI coding assistant does Salesforce give developers now? · agent force vibes kya hai</sub>

### What is the Agent API?
*Fresher (0–2 yrs) · concept* · `agent-056`

The Agent API is a REST API that lets any outside app talk to an Agentforce agent: start a session, send messages, get replies, including streamed replies, and end the session. Say a travel company has its own React website and wants the service agent there without Salesforce's chat window. Their backend gets a token, starts a session against the agent, and passes each customer message to it. For setup, you need an External Client App with the client credentials flow and a run-as user, with scopes like api, chatbot_api and sfap_api. You call api.salesforce.com, and you use your My Domain URL, not the lightning domain. The agent must be active, and the default out-of-the-box Agentforce employee agent isn't supported. The trade-off: the external app now owns the UI, end-user authentication and how handoff to a human works.

- REST: start session, send message (sync or stream), end session
- External Client App with client credentials flow
- Scopes include api, chatbot_api, sfap_api
- App owns UI, auth and handoff

<sub>Also asked as: How can an external app talk to an Agentforce agent? · Can we call Agentforce from a non-Salesforce application? · What do you need to set up to use the Agent API? · agent api kaise use karte hain</sub>

### Which metadata types make up an Agentforce agent?
*Mid (3–6 yrs) · concept* · `agent-061`

An agent isn't one file, it's several metadata types linked together. Bot is the top-level container, and BotVersion holds each version, with only one active at a time. GenAiPlannerBundle is the reasoning part that turns the bot into an agent. GenAiPlugin represents a topic, now called a subagent, and GenAiFunction represents an action. Prompt templates are GenAiPromptTemplate. For agents written in Agent Script there's also AiAuthoringBundle, which holds the .agent file, and that's the source I actually edit. Example: for an order-support agent I keep the AiAuthoringBundle, the Apex classes and flows behind the actions, the prompt templates and the agent user's permission set in Git. The runtime pieces like Bot and GenAiPlannerBundle get generated when I publish. Test suites become AiEvaluationDefinition metadata, or AiTestingDefinition with the newer Agentforce Studio test runner.

- Bot / BotVersion: container and versions
- GenAiPlannerBundle: reasoning; GenAiPlugin: topic/subagent; GenAiFunction: action
- GenAiPromptTemplate: prompt templates
- AiAuthoringBundle: Agent Script source
- AiEvaluationDefinition or AiTestingDefinition: test suites

<sub>Also asked as: What is GenAiPlannerBundle, GenAiPlugin and GenAiFunction? · How is an agent stored as metadata? · What is an AiAuthoringBundle? · agent metadata types for deployment</sub>

### What is the difference between deploying and publishing an authoring bundle?
*Mid (3–6 yrs) · comparison* · `agent-062`

Deploying an authoring bundle only puts the Agent Script source into the org, while publishing compiles it and creates the real, runnable agent. When I run a normal deploy for an AiAuthoringBundle, the draft shows up in Agentforce Builder, so an admin can open it, tweak wording in Canvas view and preview it. But no Bot, BotVersion or planner bundle exists yet. When I run sf agent publish authoring-bundle, Salesforce compiles the script and creates those runtime pieces as a new version. Then I still run sf agent activate to make that version live. Example: I build a warranty agent locally, deploy it so the business analyst can review the wording in Builder, then publish and activate once we agree. Published versions are locked, so any new change always goes into the draft.

- Deploy: source only, visible as draft in Builder
- Publish: compiles and creates Bot, BotVersion, GenAiPlannerBundle
- Activate is a separate step
- Published versions are read-only

```bash
# stage the draft so admins can see it in Agentforce Builder
sf project deploy start --metadata AiAuthoringBundle:Warranty_Agent -o uat
# compile and create the runtime agent version
sf agent publish authoring-bundle --api-name Warranty_Agent -o uat
# make that version live
sf agent activate --api-name Warranty_Agent -o uat
```

<sub>Also asked as: Deploy vs publish in Agentforce DX? · Why doesn't my agent exist after I deployed the AiAuthoringBundle? · What does sf agent publish authoring-bundle do?</sub>

### What is Agentforce DX?
*Mid (3–6 yrs) · concept* · `agent-063`

Agentforce DX is the pro-code toolset for agents: Salesforce CLI commands under sf agent, plus VS Code support, so I can build, preview, test and deploy agents like any other source code. Here's how it looks for a returns agent. I generate an authoring bundle, write the Agent Script in VS Code, and preview it from the CLI with simulated actions before my Apex is even finished. Then I validate and publish it to a sandbox. I write a YAML test spec, create a test suite from it with sf agent test create, and run it with sf agent test run, which also works in CI. Because everything is files in Git, code review, branching and rollback work exactly like they do for Apex. That's what lets agents fit into a normal DevOps pipeline instead of being clicked together in production.

- sf agent CLI commands + VS Code support
- Generate, preview, validate, publish, activate
- Tests from YAML specs, runnable in CI
- Agents live in Git like other metadata

<sub>Also asked as: How do pro-code developers build agents? · Can you build Agentforce agents from VS Code and the CLI? · What are the sf agent commands used for?</sub>

### In Agent Script, what is the difference between a subagent's actions block and its reasoning actions?
*Mid (3–6 yrs) · code* · `agent-064`

The actions block defines what can be called, meaning the target Apex class, flow or prompt template plus its inputs and outputs. Reasoning actions are the tools the LLM is actually allowed to pick during reasoning. A reasoning action wraps a defined action and adds the wiring: which inputs come from variables, which ones the LLM fills from the conversation using three dots, which outputs to save with set, and when the tool is available. Example: a warranty subagent defines check_warranty pointing to an Apex class. Under reasoning actions I expose it as lookup_warranty, let the LLM fill the serial number from the chat, and save the expiry date into a variable for later turns. So defining an action doesn't mean the LLM can use it; exposing it does. I can also call a defined action myself, deterministically, with run inside the instructions.

- actions: definition with target, inputs, outputs
- reasoning.actions: tools the LLM can choose
- with x=... lets the LLM fill a value
- set saves outputs; run calls deterministically

```java
subagent warranty:
    description: "Checks warranty coverage for a product serial number"
    actions:
        check_warranty:
            description: "Returns warranty status for one serial number"
            inputs:
                serial_number: string
                    description: "Product serial number from the device label"
                    is_required: True
            outputs:
                expiry_date: string
                    description: "Date the warranty ends"
            target: "apex://WarrantyCheckAction"
    reasoning:
        instructions: ->
            | Ask for the serial number if you don't have it, then check the warranty.
        actions:
            lookup_warranty: @actions.check_warranty
                with serial_number=...
                set @variables.warranty_expiry = @outputs.expiry_date
```

<sub>Also asked as: How do you define an action versus expose it to the LLM in Agent Script? · What does 'with param=...' mean in Agent Script? · How do you save an action's output into a variable in Agent Script?</sub>

### What is the Models API?
*Fresher (0–2 yrs) · concept* · `agent-065`

The Models API lets developers call an LLM directly from Apex or REST, through the Trust Layer, without building an agent or a prompt template. It can generate text, handle chat-style conversations and create embeddings, using Salesforce-managed models from providers like OpenAI, Anthropic and Google, or models configured in the org. Example: a manufacturer wants a button on Case that turns a technician's rough notes into a clean customer update. I could call the Models API from an Apex controller with the notes and show the result in an LWC. But if business users want to own and tweak the wording, or I need record merge fields, a prompt template is the better choice. The Models API is for when the developer needs full control. It counts as a callout and is billed as usage, so I never call it inside a loop.

- Direct LLM access from Apex or REST via the Trust Layer
- Text generation, chat, embeddings
- Prompt templates are better for admin-owned wording
- Callout rules and usage billing apply

<sub>Also asked as: How can a developer call an LLM directly from Apex? · Models API vs prompt template, when to use which? · Can I generate text from Apex without building an agent?</sub>

### Show how you would call the Models API from Apex.
*Mid (3–6 yrs) · code* · `agent-066`

I build a createGenerations request, set the model's API name and the prompt, call it, and read the generated text from the success response. Example: a service manager wants a polite one-paragraph rewrite of a technician's notes. My method takes the notes, builds the prompt and returns the text to an LWC. A few things I'd mention. The call follows Apex callout rules, so for example it can't run after uncommitted DML in the same transaction. I catch the specific response exception and return a friendly message instead of a stack trace. And I keep the model API name in custom metadata so it can change without a deploy. If the business wants to edit the wording themselves, I'd move this into a prompt template instead.

- createGenerations_Request with modelName and prompt
- Read Code200.generation.generatedText
- Catch createGenerations_ResponseException
- Callout rules apply; keep model name configurable

```java
public with sharing class NotesRewriter {
    @AuraEnabled
    public static String rewrite(String notes, String modelName) {
        aiplatform.ModelsAPI.createGenerations_Request req =
            new aiplatform.ModelsAPI.createGenerations_Request();
        req.modelName = modelName; // e.g. 'sfdc_ai__DefaultOpenAIGPT4OmniMini', stored in custom metadata
        aiplatform.ModelsAPI_GenerationRequest body = new aiplatform.ModelsAPI_GenerationRequest();
        body.prompt = 'Rewrite these technician notes as a short, polite customer update: ' + notes;
        req.body = body;
        try {
            aiplatform.ModelsAPI.createGenerations_Response res =
                new aiplatform.ModelsAPI().createGenerations(req);
            return res.Code200.generation.generatedText;
        } catch (aiplatform.ModelsAPI.createGenerations_ResponseException e) {
            throw new AuraHandledException('Could not generate the update right now.');
        }
    }
}
```

<sub>Also asked as: Write Apex to generate text with the Models API. · How do you use aiplatform.ModelsAPI createGenerations? · Apex code to call an LLM in Salesforce</sub>

### How do you invoke an Agentforce agent from Apex or Flow?
*Mid (3–6 yrs) · code* · `agent-067`

In Flow, I add an Action element and pick the agent from the AI Agent Action category. In Apex, I use the generateAiAgentResponse invocable action with the agent's API name. Example: when a high-priority case comes in for a laptop manufacturer, a flow sends the case details to a triage agent, which classifies it and suggests the right queue, with no chat window at all. For multi-turn use, the first call returns a session Id, and I pass it on later calls so the agent keeps context. Things worth saying: flows have timeouts, so I always add a fault path. Employee agents run with the running user's permissions. And every call consumes credits, so I only call an agent where real reasoning is needed, not for something a simple formula or assignment could do.

- Flow: Action element, AI Agent Action category
- Apex: Invocable.Action.createCustomAction('generateAiAgentResponse', agentApiName)
- Pass sessionId to continue a conversation
- Fault paths, permissions, credit cost

```java
public with sharing class AgentCaller {
    public static String ask(String agentApiName, String message, String sessionId) {
        Invocable.Action action = Invocable.Action.createCustomAction(
            'generateAiAgentResponse', agentApiName);
        action.setInvocationParameter('userMessage', message);
        if (String.isNotBlank(sessionId)) {
            action.setInvocationParameter('sessionId', sessionId); // keep context across turns
        }
        Invocable.Action.Result result = action.invoke()[0];
        return (String) result.getOutputParameters().get('agentResponse');
    }
}
```

<sub>Also asked as: Can we call an agent from a flow? · How do you call Agentforce from Apex code? · What is the generateAiAgentResponse action? · trigger an agent without chat</sub>

### How do you run a prompt template from Apex?
*Mid (3–6 yrs) · code* · `agent-068`

I call ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate, pass the template's inputs as wrapped values, and read the text from the generations list. Example: a clinic wants staff to click a button and get a friendly appointment reminder drafted for a patient. The admin owns the wording in a Flex template in Prompt Builder; my Apex just supplies the record and returns the draft. Input keys use the Input: prefix plus the template's input name, and a record input is a map with the record id. Good habits: I keep the template name in custom metadata, I handle errors per record, and for hundreds of records I'd use batch prompt processing rather than calling the template one record at a time, because every call is an LLM request.

- ConnectApi.EinsteinPromptTemplateGenerationsInput with inputParams
- Keys like 'Input:Patient'; record inputs as map with id
- Read output.generations[0].text
- Use batch prompt processing for volume

```java
public with sharing class ReminderDrafter {
    @AuraEnabled
    public static String draft(Id contactId, String templateApiName) {
        ConnectApi.WrappedValue patient = new ConnectApi.WrappedValue();
        patient.value = new Map<String, String>{ 'id' => contactId };

        ConnectApi.EinsteinPromptTemplateGenerationsInput input =
            new ConnectApi.EinsteinPromptTemplateGenerationsInput();
        input.isPreview = false;
        input.inputParams = new Map<String, ConnectApi.WrappedValue>{ 'Input:Patient' => patient };
        input.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
        input.additionalConfig.applicationName = 'PromptTemplateGenerationsInvocable';

        ConnectApi.EinsteinPromptTemplateGenerationsRepresentation out =
            ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(templateApiName, input);
        return out.generations.isEmpty() ? null : out.generations[0].text;
    }
}
```

<sub>Also asked as: Write Apex to call a Prompt Builder template. · How do you use ConnectApi.EinsteinLLM generateMessagesForPromptTemplate? · Invoke a flex prompt template from Apex code</sub>

### How do you preview an Agent Script agent from the CLI, and what is the difference between simulated and live actions?
*Fresher (0–2 yrs) · code* · `agent-069`

I start a session with sf agent preview start and the authoring bundle name, send messages with sf agent preview send, and close it with sf agent preview end. When starting, I choose simulated or live actions. Simulated means the LLM pretends the actions ran, so I can test routing and the conversation before the Apex or flow even exists. Live actually runs them against the org's data. Example: on day one of a returns agent, my Apex isn't written yet, so I preview with simulated actions to check that 'I want to send back my headphones' goes to the returns subagent. Later, in a sandbox with test data, I switch to live actions to check real outputs. The end command also gives me trace files that show which subagent and actions were chosen and why.

- start / send / end with --authoring-bundle
- --simulate-actions: fake action results
- --use-live-actions: real execution, use a sandbox
- Traces show routing and action choices

```bash
sf agent preview start --authoring-bundle Returns_Agent --simulate-actions -o dev --json
# returns a sessionId
sf agent preview send --session-id <ID> --authoring-bundle Returns_Agent \
    --utterance "I want to send back my headphones" -o dev --json
sf agent preview end --session-id <ID> --authoring-bundle Returns_Agent -o dev --json
# result includes tracesPath with per-turn trace files
```

<sub>Also asked as: How do you test an agent locally with sf agent preview? · What does --simulate-actions do? · Can I test my agent before the Apex action is built?</sub>

### Walk me through the sf agent commands to create, publish and activate an agent from source.
*Mid (3–6 yrs) · code* · `agent-070`

The flow is generate, edit, validate, publish, activate. sf agent generate authoring-bundle creates a folder with the .agent file and its meta XML. I write the script, deploy the bundle, and run sf agent validate authoring-bundle to catch syntax and reference errors early. sf agent publish authoring-bundle compiles it and creates the Bot, BotVersion and planner bundle, and sf agent activate makes that version live. Example: for an IT help-desk agent I keep this in a Git branch. A pull request runs validation, and only after review do we publish to the UAT sandbox and activate. To pull things back, the Agent pseudo type retrieves the runtime pieces, and AiAuthoringBundle retrieves the source. One gotcha: a successful publish doesn't mean users see the change; activation is a separate step.

- generate authoring-bundle, then edit the .agent file
- validate catches errors before publish
- publish creates the runtime version; activate makes it live
- Retrieve: Agent:<name> for runtime, AiAuthoringBundle:<name> for source

```bash
sf agent generate authoring-bundle --name "IT Help Desk" --api-name IT_Help_Desk --no-spec
# edit force-app/main/default/aiAuthoringBundles/IT_Help_Desk/IT_Help_Desk.agent
sf project deploy start --metadata AiAuthoringBundle:IT_Help_Desk -o uat
sf agent validate authoring-bundle --api-name IT_Help_Desk -o uat
sf agent publish authoring-bundle --api-name IT_Help_Desk -o uat
sf agent activate --api-name IT_Help_Desk -o uat

# retrieve runtime metadata vs source
sf project retrieve start --metadata Agent:IT_Help_Desk -o uat
sf project retrieve start --metadata AiAuthoringBundle:IT_Help_Desk -o uat
```

<sub>Also asked as: How do you create an Agent Script agent using the Salesforce CLI? · What is the CLI flow for Agentforce DX from scratch? · How do you retrieve an agent's metadata?</sub>

### How do you write an agent test spec and run it from the CLI?
*Mid (3–6 yrs) · code* · `agent-071`

A test spec is a YAML file listing utterances and what I expect for each: the subagent it should route to, the actions it should call, and a plain-English expected outcome that an LLM judge scores. sf agent test create turns it into a test suite in the org, stored as AiEvaluationDefinition by default, or AiTestingDefinition with --test-runner agentforce-studio, and sf agent test run executes it. Example for a pet-store order agent: 'where's my dog food order?' should go to order_status and call lookup_order, and 'tell me a joke about cats' should be politely declined. Things to know: the spec still uses the word topic for subagents. Expected actions are a flat list of action API names. And tests run against the activated agent and can run real actions, so I run them in a sandbox.

- Fields: name, subjectType AGENT, subjectName, testCases
- Per case: utterance, expectedTopic, expectedActions, expectedOutcome
- expectedActions lists action API names
- Run in a sandbox against the active version

```java
# tests/OrderAgent-tests.yaml
name: "Order Agent Regression"
subjectType: AGENT
subjectName: Order_Agent
testCases:
  - utterance: "Where's my dog food order?"
    expectedTopic: order_status
    expectedActions:
      - lookup_order
    expectedOutcome: "Agent asks for or uses the order number and gives the delivery status"
  - utterance: "Tell me a joke about cats"
    expectedOutcome: "Agent politely declines and offers help with orders"

# sf agent test create --spec tests/OrderAgent-tests.yaml --api-name Order_Agent_Regression -o uat
# sf agent test run --api-name Order_Agent_Regression --wait 10 --result-format json -o uat
```

<sub>Also asked as: What does an Agentforce test spec YAML look like? · How do you use sf agent test create and sf agent test run? · How do you batch test an agent with expected topics and actions?</sub>

### How would you add agent tests to a CI/CD pipeline?
*Senior (7–10 yrs) · code* · `agent-072`

I run agent tests as a gate after the Apex tests, using the CLI so the pipeline gets results it understands. The steps: log in to a test sandbox, deploy the metadata, publish and activate the agent version, create or overwrite the test suite from the YAML spec, then run it with JUnit output and fail the build if the pass rate drops below an agreed bar. Example: a pull request changes the returns subagent. The pipeline runs a regression suite of about fifty utterances, and if 'cancel my order' suddenly routes to returns instead of cancellations, the PR is blocked. Because LLM wording varies, I rely on routing, action and outcome checks rather than exact text, and I set a threshold instead of demanding 100 percent. Tests can run real actions and use credits, so they never point at production.

- Deploy, publish, activate, then test in a sandbox
- --force-overwrite to refresh the suite; --result-format junit
- Gate on a pass-rate threshold
- Never run against production

```bash
# GitHub Actions step (after auth + deploy + publish + activate)
- name: Run agent regression suite
  run: |
    sf agent test create --spec tests/Returns_Agent-tests.yaml \
      --api-name Returns_Agent_CI --force-overwrite -o ci-sandbox --json
    sf agent test run --api-name Returns_Agent_CI --wait 15 \
      --result-format junit --output-dir test-results -o ci-sandbox
```

<sub>Also asked as: Can you run Agentforce tests in GitHub Actions? · How do you stop a bad agent change from reaching production? · Agent regression testing in DevOps, how?</sub>

### Show how an external app would start a conversation with an agent through the Agent API.
*Senior (7–10 yrs) · code* · `agent-073`

First the app gets an access token from the org's My Domain token endpoint, using the External Client App's key and secret with the client credentials flow. Then it posts to the sessions endpoint on api.salesforce.com with the agent's Id, a unique external session key and the My Domain URL. The response gives a session Id. Each customer message is posted to that session with an increasing sequence Id, or to the stream endpoint if the app wants the reply to appear as it's typed. When the user leaves, the app deletes the session. Example: a car-rental company's backend starts a session when the user taps Help and ends it when they close the screen. Gotchas: use the My Domain URL, keep the secret on the server, never in the mobile app, and decide with bypassUser whether the agent runs as its own agent user or the token's user.

- Token: client credentials on My Domain /services/oauth2/token
- POST /einstein/ai-agent/v1/agents/{agentId}/sessions
- POST /sessions/{id}/messages (or /messages/stream)
- DELETE /sessions/{id} to end

```java
# 1. token
curl -X POST "https://$MY_DOMAIN/services/oauth2/token" \
  -d "grant_type=client_credentials&client_id=$KEY&client_secret=$SECRET"
# 2. start session
curl -X POST "https://api.salesforce.com/einstein/ai-agent/v1/agents/$AGENT_ID/sessions" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"externalSessionKey":"'"$(uuidgen)"'",
       "instanceConfig":{"endpoint":"https://'"$MY_DOMAIN"'"},
       "streamingCapabilities":{"chunkTypes":["Text"]},
       "bypassUser":true}'
# 3. send a message
curl -X POST "https://api.salesforce.com/einstein/ai-agent/v1/sessions/$SESSION_ID/messages" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"message":{"sequenceId":1,"type":"Text","text":"I need to extend my rental"}}'
```

<sub>Also asked as: Write the Agent API calls to start a session and send a message. · What are the Agent API endpoints? · How does a mobile backend chat with Agentforce over REST?</sub>

### How do you choose a different LLM for a specific subagent in Agent Script?
*Mid (3–6 yrs) · code* · `agent-074`

I add a model_config block, either at the agent level as the default or inside one subagent to override it, pointing to a model's API name. Example: a telecom service agent gets thousands of simple 'what are your store hours' questions and a handful of complex billing disputes. I keep a small, fast model as the default for the FAQ subagent and give the billing_dispute subagent a stronger model, because it has to reason over several invoices. In service-agent templates the router uses Salesforce's classifier model for fast routing. Trade-offs: bigger models are slower and can cost more, so I only upgrade a subagent when tests show the small model gets it wrong. And I rerun my whole test suite after any model change, because behavior can shift even when the instructions didn't change.

- model_config at agent level = default
- model_config inside a subagent = override
- Use bigger models only where tests justify it
- Retest after any model change

```java
model_config:
    model: "model://sfdc_ai__DefaultBedrockAnthropicClaude45Haiku"   # agent-wide default

subagent billing_dispute:
    description: "Investigates disputed charges across several invoices"
    model_config:
        model: "model://<stronger_model_api_name>"   # override for this subagent only
    reasoning:
        instructions: ->
            | Compare the disputed invoice with the last three invoices and explain the difference.
```

<sub>Also asked as: Can each subagent use a different model? · What is model_config in Agent Script? · How do you balance cost and quality across subagents?</sub>

### How do you set up handoff to a human in Agent Script so the agent doesn't escalate too early?
*Mid (3–6 yrs) · code* · `agent-075`

I declare where escalations go once, in a connection messaging block that points to an Omni-Channel flow, and then I gate the escalate tool with available when, so the LLM can only use it when my conditions are true. Example for a furniture store: the customer can always ask for a person, which sets a user_requested_human flag. Otherwise the agent counts failed attempts, and only after two misses does escalation become available. Before handing over, the agent saves a one-line issue summary in a variable, so the human rep doesn't have to ask everything again. Without the gate, agents tend to bail out to a human on the first slightly hard question, which kills deflection. And without the connection block, the escalate action has nowhere to send the conversation.

- connection messaging: Omni-Channel flow route + escalation message
- @utils.escalate is the handoff tool
- available when gates it on clear conditions
- Save an issue summary for the human

```java
connection messaging:
    escalation_message: "I'm connecting you with a member of our team."
    outbound_route_type: "OmniChannelFlow"
    outbound_route_name: "Support_Queue_Flow"

subagent general_support:
    description: "Answers questions and hands off to a human when needed"
    reasoning:
        actions:
            note_human_request: @utils.setVariables
                description: "Set to True when the customer asks to speak to a person"
                with user_requested_human = ...
            escalate_to_human: @utils.escalate
                description: "Hand the conversation to a human agent"
                available when @variables.user_requested_human == True or @variables.failed_attempts > 1
```

<sub>Also asked as: What is @utils.escalate in Agent Script? · How do you configure escalation routing in Agent Script? · The agent transfers to a human too quickly, how do you control that?</sub>

### Write an Apex action an agent can use to create a return request, with labels and descriptions the agent can understand.
*Senior (7–10 yrs) · code* · `agent-076`

The key is an invocable method that's bulk-safe, runs in user mode, and has a clear label and description on the method and on every input and output, because the LLM reads those to decide when to call it and what to pass. Example for an electronics store: the action takes an order number, a reason and the verified contact, checks the order really belongs to that contact, and creates a return case. It returns a case number and a plain-language message the agent can repeat to the customer. If the order isn't found, it says so politely instead of throwing an error. I also make the description say when to use it, like 'only after the customer confirms', and I enforce business rules like the return window inside Apex, not only in the agent's instructions.

- Label + description on method and every variable
- with sharing, WITH USER_MODE, insert as user
- Bulkified: one query, one DML
- Return friendly messages instead of exceptions

```java
public with sharing class CreateReturnRequest {
    public class Request {
        @InvocableVariable(required=true label='Order Number'
            description='Customer-facing order number, for example 00012345')
        public String orderNumber;
        @InvocableVariable(required=true label='Return Reason'
            description='Short reason in the customer words, such as damaged or wrong size')
        public String reason;
        @InvocableVariable(required=true label='Verified Contact Id'
            description='Id of the contact who passed identity verification')
        public Id contactId;
    }
    public class Result {
        @InvocableVariable(label='Message' description='Outcome to tell the customer')
        public String message;
    }

    @InvocableMethod(label='Create Return Request'
        description='Creates a return case for an order owned by the verified contact. Use only after the customer confirms they want to return it.')
    public static List<Result> create(List<Request> requests) {
        Set<String> nums = new Set<String>();
        for (Request r : requests) nums.add(r.orderNumber);
        Map<String, Order> orders = new Map<String, Order>();
        for (Order o : [SELECT Id, OrderNumber, BillToContactId FROM Order
                        WHERE OrderNumber IN :nums WITH USER_MODE]) {
            orders.put(o.OrderNumber, o);
        }
        List<Result> results = new List<Result>();
        List<Case> cases = new List<Case>();
        for (Request r : requests) {
            Order o = orders.get(r.orderNumber);
            Result res = new Result();
            if (o == null || o.BillToContactId != r.contactId) {
                res.message = 'I could not find that order on your account.';
            } else {
                cases.add(new Case(ContactId = r.contactId, Description = r.reason,
                    Subject = 'Return request for order ' + o.OrderNumber));
                res.message = 'Your return request for order ' + o.OrderNumber + ' has been created.';
            }
            results.add(res);
        }
        if (!cases.isEmpty()) insert as user cases;
        return results;
    }
}
```

<sub>Also asked as: How do you write an invocable method for Agentforce with good descriptions? · Build a return-request action for a service agent in Apex. · What makes an Apex agent action well designed?</sub>

### What does the start_agent block do in Agent Script?
*Fresher (0–2 yrs) · concept* · `agent-082`

start_agent is the entry point, basically the front desk. Every new message comes here first, and its job is usually to look at what the user said and transition to the right subagent. Each possible route is a transition tool with a description, and the LLM picks the one that fits best. Example for a gym: 'I want to freeze my membership' goes to the membership subagent, 'what time does the pool open' goes to the facilities FAQ subagent. If nothing fits, I can route to a general subagent that politely says what the agent can help with. The tip I give: route descriptions matter more than anything else here. They should be specific and not overlap, because two vague descriptions like 'help with account' and 'help with membership' will confuse routing.

- Entry point that runs first for each message
- Uses @utils.transition tools to reach subagents
- Route descriptions drive the choice
- Avoid overlapping descriptions

```java
start_agent agent_router:
    description: "Route members to the right area"
    reasoning:
        instructions: |
            Select the tool that best matches the member's message.
        actions:
            go_membership: @utils.transition to @subagent.membership
                description: "Freeze, cancel, upgrade or renew a membership"
            go_facilities: @utils.transition to @subagent.facilities_faq
                description: "Opening hours, classes, pool and equipment questions"
```

<sub>Also asked as: How does routing work in Agent Script? · What is the router in a new Agentforce Builder agent? · How does the agent decide which subagent to go to?</sub>

## Agentforce Scenarios

### A client says the agent must never offer a refund unless the order is delivered and less than 30 days old. How do you enforce that?
*Mid (3–6 yrs) · scenario* · `agent-077`

I don't trust instructions alone for a rule like that. I put the rule in code and make the agent's refund tool unavailable until the code says yes. Step one, an eligibility action in Apex or Flow checks status is Delivered and the delivery date is within 30 days, and returns true or false. Step two, I save that result into a variable. Step three, in Agent Script the refund tool has available when refund_eligible is true and the customer is verified, so the LLM literally can't see it otherwise. Step four, the refund Apex checks the rule again on the server, in case anything calls it another way. For a shoe store, 'my sneakers came 45 days ago, refund please' gets a polite explanation and an exchange or human option, never a refund promise. Then I add test cases for day 29, day 31 and undelivered orders.

- Business rule lives in Apex/Flow, not in prose instructions
- Store eligibility in a variable
- Gate the refund tool with available when
- Re-check on the server and add boundary tests

```java
reasoning:
    actions:
        check_eligibility: @actions.get_refund_eligibility
            with order_number=...
            set @variables.refund_eligible = @outputs.eligible
        issue_refund: @actions.create_refund
            available when @variables.refund_eligible == True and @variables.is_verified == True
            with order_number=@variables.order_number
```

<sub>Also asked as: How do you make sure the agent follows a strict business rule every time? · Instructions alone aren't stopping the agent from offering refunds, what do you do? · How do you make refund eligibility deterministic in Agentforce?</sub>

### A small garden-supply store wants an agent on its website to answer customer FAQs. What are your first steps?
*Fresher (0–2 yrs) · scenario* · `agent-083`

I'd start with the content, not the agent. An FAQ agent is only as good as what it's grounded on. First, I collect their real FAQs, shipping and return policies, and plant-care guides, and get them into Knowledge articles or files. Second, I create a data library from that content so the agent can search it. Third, I create a service agent from the template, keep a general FAQ subagent that answers only from that library, and write a clear scope, like 'only answer questions about our products, orders and policies'. Fourth, I check the agent user's permissions. Fifth, I test with twenty or thirty real customer questions, like 'can I return a dead rose bush?', and fix gaps in the content. Finally, I deploy it to Messaging for In-App and Web with a handoff to their support queue for anything it can't answer.

- Content first: knowledge or files
- Data library for grounding
- Service agent template + clear scope
- Test with real questions, then deploy with handoff

<sub>Also asked as: How would you build a simple FAQ agent for a client? · A client wants an agent to answer common questions on their site, where do you start? · First Agentforce project is an FAQ bot, walk me through it</sub>

### Your manager asks you to build an HR employee agent that answers leave-balance and policy questions. How would you approach it?
*Fresher (0–2 yrs) · scenario* · `agent-084`

I'd build an employee agent with two subagents, one for leave balance and one for policy questions, and test it in a sandbox first. For leave balance, I create a flow or Apex action that reads the employee's leave records and returns days remaining. Since employee agents run as the logged-in user, the action only sees that person's own records if sharing is set up right, which is exactly what we want. For policy questions, I load the employee handbook PDF into a data library and tell the subagent to answer only from it and to say 'please check with HR' when it isn't sure. Example: an employee asks 'how many vacation days do I have left, and can I carry them over?' The agent calls the balance action, then answers the carry-over part from the handbook. I'd deploy it in Slack or Lightning, wherever employees already work.

- Employee agent runs as the logged-in user
- Action for personal data, data library for policies
- Answer only from the handbook; fall back to HR
- Deploy where employees already work

<sub>Also asked as: Build an employee agent for HR, walk me through it. · How would you create an internal agent for employees? · Agent for PTO balance and HR policies, how?</sub>

### Walk me through the Agentforce implementation lifecycle from start to finish.
*Mid (3–6 yrs) · scenario* · `agent-085`

I think of it as plan, build, test, deploy, monitor, and then loop back. Let me use an order-support agent for a laptop retailer. Plan: pick a narrow use case like 'where is my order' and returns, agree on success metrics like deflection and CSAT, check the data is clean, and list what the agent must never do. Build: in a sandbox, create the agent, subagents for order status and returns, Apex or Flow actions, a data library for policies, and a least-privilege agent user. Test: preview conversations, then a batch test suite with routing, action and outcome checks, plus some prompt-injection attempts. Deploy: source in Git, publish and activate through the pipeline, connect the channel and Omni-Channel handoff. Monitor: watch session traces, escalations and quality scores in Observability, turn failures into new test cases, and ship small improvements.

- Plan: narrow use case, metrics, data, guardrails
- Build: subagents, actions, data library, agent user
- Test: preview + batch suite + adversarial cases
- Deploy: Git, publish, activate, channel
- Monitor: Observability, then iterate

<sub>Also asked as: What are the phases of an Agentforce project? · How do you plan, build, test, deploy and monitor an agent? · Explain the agent development lifecycle · agentforce project lifecycle steps</sub>

### How would you take an agent from a pilot to a full rollout across the business?
*Senior (7–10 yrs) · scenario* · `agent-086`

I'd scale in stages, with clear numbers that must be hit before each step. Say a furniture retailer piloted a delivery-status agent on web chat. Stage one, the pilot: one channel, one or two intents, and a quick, easy path to a human. I agree on exit criteria up front, like deflection rate, escalation rate, CSAT and zero serious incidents. Stage two, widen traffic: more customers or regions, still the same intents, with the support team watching session traces every day. Stage three, add intents one at a time, returns, then assembly booking, each with its own test suite and a new version. Stage four, add channels like voice or the mobile app. Alongside that, I set up governance: who approves changes, how fast we can roll back, and training for human reps so handoffs feel smooth. Rollout fails more often from change management than from the technology.

- Exit criteria agreed before each stage
- Widen traffic, then add intents, then channels
- Each new intent gets tests and a new version
- Governance, rollback plan, rep training

<sub>Also asked as: The pilot went well, how do you scale the agent? · How do you roll out Agentforce in phases? · What does a production rollout plan for an agent look like?</sub>

### A laptop seller wants an agent that handles order status, returns and warranty questions. How would you design it?
*Mid (3–6 yrs) · scenario* · `agent-087`

I'd design three subagents, each with a small set of actions, plus verification in front and a human path behind. First, a verification step: before any order details, the customer confirms email and order number, and I store is_verified in a variable. Then order_status, with a lookup action that returns status and delivery date. Then returns, with an eligibility check and a create-return action, gated so it's only available after eligibility passes. Then warranty, with a serial-number lookup and, if covered, an action that books a repair pickup. Example: 'my laptop screen flickers, it's six months old' goes to warranty, the agent asks for the serial number, confirms coverage and offers a pickup slot. Damaged-on-arrival or angry customers go straight to a human. I keep each subagent's description distinct so routing stays clean.

- Verify identity first, store in a variable
- Three focused subagents with small action sets
- Gate risky actions behind eligibility
- Clear human escalation path

<sub>Also asked as: Design a service agent for an electronics company. · Which subagents and actions would you create for a returns agent? · How do you break a support agent into subagents?</sub>

### The client asks how they will measure the ROI of their Agentforce investment. What do you tell them?
*Senior (7–10 yrs) · scenario* · `agent-088`

I'd say: measure a baseline before launch, then compare the same numbers after, and put cost next to value. For a service agent at a telecom company, the value side is deflection or containment rate, resolution rate, escalation rate, CSAT for agent conversations, and handle time for human reps after handoff, because good summaries should make them faster. The cost side is credits consumed per conversation from Digital Wallet, plus build and maintenance effort. So if a human-handled chat costs a certain amount and an agent-resolved one costs far less, multiply the difference by resolved volume. For employee agents, like a sales agent drafting follow-ups, I'd measure time saved per task and adoption. Observability gives sessions, deflected sessions, latency and quality scores. The honest part: I also track bad outcomes, like wrong answers and repeat contacts, so ROI isn't just inflated deflection.

- Baseline before launch
- Value: deflection, resolution, CSAT, rep handle time
- Cost: credits per conversation + build effort
- Track quality issues and repeat contacts too

<sub>Also asked as: How do you measure Agentforce success? · What KPIs would you track for an agent? · How do you prove the agent is worth the cost?</sub>

### A client wants their agent to use a third-party tool that offers an MCP server. What steps would you take?
*Mid (3–6 yrs) · scenario* · `agent-089`

I'd treat it like any integration, with security first. Say a marketing agency wants its agent to create invoices in its billing tool. First, I check how the server authenticates. I want OAuth with a scoped service account, not a shared admin key. Second, I register the MCP server in the org, which can be done in Setup or with the sf agent mcp commands. Third, I review every tool the server exposes and allow only what's needed, like create_invoice and get_invoice_status, and leave out anything destructive. Fourth, I add those tools to the right subagent and make sure their descriptions are clear enough for the LLM. Fifth, I test in a sandbox against the vendor's test account, including failure cases like an invalid customer. Finally, I watch latency and credit usage after go-live, since each tool call is an extra action.

- Check auth: scoped OAuth
- Register the server, allowlist only needed tools
- Clear descriptions, attach to the right subagent
- Test failures in a sandbox; watch latency and cost

<sub>Also asked as: How do you connect an agent to an MCP server? · Walk me through adding MCP tools to Agentforce. · Client's vendor has an MCP server, how do we use it in our agent?</sub>

### A client's mobile team wants the service agent inside their own app and custom website, not a Salesforce page. Which option would you pick?
*Mid (3–6 yrs) · scenario* · `agent-090`

It depends on how much they want to build themselves. My usual order of preference is Messaging for In-App and Web, then the Agentforce Mobile SDK, then the Agent API. Messaging for In-App and Web, the Enhanced Chat SDKs, gives them a chat UI on web and in apps with Omni-Channel and human handoff already built in. That's my default for customer service. The Agentforce Mobile SDK is for adding Agentforce into native iOS and Android apps. The Agent API is for when they want a fully custom UI, and then their backend owns sessions, authentication and any handoff logic. Example: a food-delivery company wanted a branded help screen. If they need humans to take over chats, Enhanced Chat saves months. If it's a fully automated assistant inside the app, the Agent API gives them total control.

- Enhanced Chat (Messaging for In-App and Web): handoff built in
- Agentforce Mobile SDK: native iOS/Android
- Agent API: full custom UI, app owns handoff
- Choose based on human handoff needs

<sub>Also asked as: How do you put Agentforce in a mobile app? · Agent API vs Enhanced Chat vs Mobile SDK, which one? · Client wants their own chat UI with Agentforce behind it</sub>

### The client says their agent is consuming far more Flex Credits than expected. How would you bring the cost down?
*Senior (7–10 yrs) · scenario* · `agent-091`

First I find out where the credits go, then I cut wasted actions. Since you pay per action, the question is how many actions each conversation runs and whether they're all needed. I'd pull session traces and look at actions per conversation. Common waste I'd look for: the agent looks up the same order three times because the result isn't saved in a variable; a prompt-template action is used for something a formula could do; tools are visible when they shouldn't be, so the LLM tries them; or long FAQ chats call search again and again. Example: a retailer's agent averages seven actions for 'where's my order'. After saving the lookup in a variable, gating tools with available when, and using deterministic logic for simple steps, it drops to two or three. I'd also set budgets and alerts in Digital Wallet, and for heavy internal use, check whether per-user licensing is cheaper.

- Measure actions per conversation from traces
- Save results in variables, avoid repeat lookups
- Gate tools; use deterministic logic for simple steps
- Digital Wallet budgets; compare licensing models

<sub>Also asked as: Agentforce costs are too high, what can you optimize? · How do you reduce credit consumption of an agent? · Agent is using too many actions per conversation, how to fix?</sub>

### Your agent tests pass on one run and fail on the next in the pipeline. How do you deal with that?
*Senior (7–10 yrs) · troubleshooting* · `agent-092`

Some variation is normal with LLMs, so I make the tests check behavior rather than exact wording, and then fix the real ambiguity in the agent. First, I look at which assertions flip. If routing flips between two subagents for the same utterance, that's usually overlapping subagent descriptions, so I sharpen them. If action checks flip, I check whether the action description says clearly when to use it. If outcome checks flip, I rewrite expectedOutcome to describe behavior, like 'asks for the order number', not specific sentences. Second, I check the data. With live actions in a shared sandbox, someone may have changed the test order. I use dedicated test records. Example: 'I want my money back' sometimes went to returns and sometimes to billing. Clarifying that billing handles charges, not refunds, fixed it. Finally, I gate on a pass-rate threshold instead of 100 percent.

- Check which assertion type flips
- Overlapping descriptions cause routing flips
- Write outcomes as behavior, not exact text
- Stable test data; pass-rate threshold

<sub>Also asked as: Agent tests are flaky, why? · Same test spec gives different results each time, what do you do? · How do you make LLM-based tests reliable?</sub>

### The client says the agent doesn't show up in the chat on their website. What would you check?
*Fresher (0–2 yrs) · scenario* · `agent-093`

I'd walk the path from the website back to the agent, step by step. First, is the agent activated, and is the right version active? Second, is the Messaging for In-App and Web channel set up and its embedded deployment published after the last change? Third, does the Omni-Channel flow on that channel actually route to the agent, not straight to a human queue? Fourth, is the code snippet on the site the current one, and is the site's domain allowed in the deployment settings? Fifth, does the agent user have the permissions and license it needs? Example: a bakery's chat button appeared, but every chat went to a staff queue at night with nobody there. The Omni-Channel flow still pointed to the old queue. Updating the route to the agent and republishing fixed it. I always test from an incognito browser like a real customer.

- Agent activated, right version
- Channel deployment published
- Omni-Channel flow routes to the agent
- Snippet and allowed domains; agent user permissions

<sub>Also asked as: Agent is not responding on the website, what do you check? · Customers see the chat button but no agent answers, why? · Deployed the agent but it isn't live on the site</sub>

### A client has fifteen Einstein Bots and wants to move to Agentforce. How would you plan the migration?
*Senior (7–10 yrs) · scenario* · `agent-094`

I'd inventory first, migrate in waves, and run old and new side by side before switching traffic. Step one, list every bot, its dialogs, volumes and channels, and sort the dialogs into three groups: strict step-by-step flows, like identity checks, which become deterministic Agent Script logic; FAQ dialogs, which become knowledge grounding; and dead dialogs nobody uses, which we drop. Step two, use Salesforce's upgrade tooling to generate a starting agent, then clean it up, because a straight conversion often copies old menus that an agent doesn't need. Step three, build test suites from real bot transcripts. Step four, switch one bot's channel at a time through its Omni-Channel flow, keeping the bot ready to switch back. Example: an insurer's claims bot keeps its strict policy-number check as deterministic steps, while its twenty FAQ dialogs collapse into one grounded FAQ subagent.

- Inventory bots and sort dialogs
- Strict flows -> deterministic logic; FAQs -> grounding
- Use upgrade tooling, then clean up
- Migrate one channel at a time with fallback

<sub>Also asked as: How do you migrate Einstein Bots to Agentforce agents? · Bot to agent upgrade plan? · Should we convert all our bots to agents at once?</sub>

### A clinic wants a patient-facing agent that books and reschedules appointments. What would you consider?
*Mid (3–6 yrs) · scenario* · `agent-095`

I'd start from the Health Cloud appointment-management capabilities, and spend most of my design time on identity, privacy and safety. Steps: the patient is verified before anything else, like date of birth plus a one-time code, and the result is stored in a variable that gates every scheduling action. The actions find open slots and book or move the appointment, and they return only what's needed, never the full medical record. One catch: Salesforce turned off Trust Layer data masking for Agentforce agents, so I rely on zero data retention with the LLM providers and keep sensitive data out of prompts and action outputs. The agent must never give medical advice, so any symptom talk like 'my chest hurts' triggers a clear message to call emergency services or the nurse line, and a handoff. Example: 'move my Thursday check-up to next week, mornings only' gets three morning options and a confirmation. I'd involve the clinic's compliance team early.

- Verify the patient before any action
- Return minimal data from actions
- No medical advice; urgent symptoms escalate immediately
- Involve compliance early

<sub>Also asked as: How would you build a healthcare appointment agent? · Agentforce for a clinic, what are the risks? · Patient scheduling agent on Health Cloud, how?</sub>

### A bank wants an agent that handles lost cards and fee reversal requests. How would you build it safely?
*Mid (3–6 yrs) · scenario* · `agent-096`

I'd start from the Financial Services Cloud banking service agent template and lock down the money-related rules in code. For lost cards: verify the customer strongly, then an action blocks the card immediately and offers a replacement. Blocking is safe to do right away, so the agent doesn't wait. For fee reversals: an Apex action checks the bank's rules, like amount under a set limit, no reversal in the last twelve months, account in good standing. If they pass, it reverses and logs it. If not, it creates a case for a human, and the agent explains politely. The refund tool is gated with available when on that eligibility result. Example: a customer says 'you charged me an overdraft fee by mistake'. It's their first in a year and small, so it's reversed in the chat. I'd also make sure required disclosures are shown and every action is logged for audit.

- Start from the FSC banking service template
- Strong verification before account actions
- Reversal rules in Apex; gated tool
- Disclosures and audit logging

<sub>Also asked as: Agentforce for banking, how to handle fee reversals? · Design a banking service agent with compliance in mind. · How do you stop an agent from reversing every fee?</sub>

### Sales reps want to create quotes just by typing what they need. The client is still on Salesforce CPQ. What would you recommend?
*Mid (3–6 yrs) · scenario* · `agent-097`

I'd be upfront that the out-of-the-box quoting agent is built for Revenue Cloud, and Salesforce CPQ is end-of-sale, though still supported for existing customers. So there are two paths. Path one, the long-term one: plan a move to Revenue Cloud Advanced, where the quoting agent drafts quotes from requests like '25 licenses with 10 percent off' and works from records or Slack. This makes sense if they're already unhappy with CPQ performance or rules. Path two, a bridge: build a custom employee agent action in Apex that creates a CPQ quote and lines through the CPQ quote API, with approvals still enforced by CPQ. Example: a medical-device distributor with a big renewal cycle next quarter might take the bridge now and migrate after renewals. Either way, discounts above a rep's limit still go through approval, not the agent.

- Out-of-the-box quoting agent targets Revenue Cloud
- Salesforce CPQ: end-of-sale, still supported
- Bridge: custom action on CPQ APIs
- Approvals still enforced

<sub>Also asked as: Can Agentforce create quotes on Salesforce CPQ? · Client wants a quoting agent but uses legacy CPQ, what's the path? · Quote with natural language in Salesforce, how?</sub>

### A utility company wants a voice agent for its phone line. What would you do differently from a chat agent?
*Senior (7–10 yrs) · scenario* · `agent-098`

Mostly I design for listening, not reading. Everything the agent says has to work out loud. First, short replies, one or two sentences, with no lists, links or tables. Second, confirm anything important by reading it back, like 'that's account ending 4 4 7 2, right?' Third, keep each subagent's job simple, because people on the phone interrupt and change their minds. Fourth, in Agent Script, add a modality voice block for the voice, speaking speed and pronunciation, and set a specific default locale in the language block. Fifth, set clear triggers for a human, like 'gas leak', which should immediately route to an emergency line, not an agent. Example: 'my power's out on Elm Street' gets 'I see an outage in your area, crews expect to restore it by 6 PM. Want a text when it's back?' And I test on real phone calls, because CLI tests only check the text.

- Short spoken replies, no visual formatting
- Read back numbers and dates
- Modality voice block and a specific default locale
- Safety keywords route immediately; test on real calls

<sub>Also asked as: How do you design an Agentforce Voice agent? · Voice agent vs chat agent design differences? · What should you test for a phone agent?</sub>

### The agent keeps asking the customer for their order number again after moving to a different subagent. How do you fix it?
*Fresher (0–2 yrs) · scenario* · `agent-099`

I store the order number in a variable as soon as I have it, instead of hoping the LLM remembers it from the chat history. In Agent Script, I declare a mutable variable like order_number. When the order lookup runs, I save the output with set, or I use a setVariables utility to capture it from what the customer typed. Every other subagent then reads that variable. I can even skip asking: if the variable is filled, the instructions say 'use the order number you already have'. Example: a customer at an online bookstore asks 'where's order 7781?', then says 'actually, I want to return one book from it'. The returns subagent sees order_number is already 7781 and goes straight to 'which book?'. Variables are reliable state; LLM memory is not.

- Declare a mutable variable
- Fill it with set from action outputs or setVariables
- Other subagents read it
- Variables are reliable; LLM memory isn't

<sub>Also asked as: How do you make an agent remember information across subagents? · Agent forgets details the customer already gave, why? · How do variables help keep context in Agent Script?</sub>

### Customers complain the agent's answers are too long and rambling. What would you change?
*Fresher (0–2 yrs) · scenario* · `agent-100`

I'd fix it in three places: the instructions, the data the agent gets, and the channel. First, instructions. I add clear rules at the system level, like 'answer in two or three short sentences, ask one question at a time, no repeated apologies'. Second, the data. Often the agent rambles because an action returns too much, like the whole order record with twenty fields, and the LLM tries to use all of it. I trim action outputs to what the customer needs. Third, the channel. Voice needs even shorter replies than chat. Example: a pizza chain's agent answered 'is my order coming?' with a paragraph about the menu and promotions. After trimming the output to status and ETA and adding the length rule, the answer became 'Your order left the store 5 minutes ago and should arrive around 7:40.' I then add a test with an expected outcome like 'replies briefly'.

- Length and tone rules in system instructions
- Trim action outputs to essentials
- Shorter still for voice
- Add a test for brevity

<sub>Also asked as: The agent gives very long responses, how to make them shorter? · How do you control the length and tone of agent replies? · Agent answers are too wordy, what do you fix?</sub>

### Your agent calls the same action again and again in one conversation. How do you troubleshoot it?
*Mid (3–6 yrs) · troubleshooting* · `agent-101`

Usually the agent doesn't realize the job is done, so I check what the action returns and whether that result is saved. First, I open the session trace and look at each call. Did the action return an error that looked like success, or an empty result? Then the LLM tries again. I make the action return a clear message either way, like 'no order found for that number'. Second, I check that outputs are saved into variables with set, so the agent has the answer in its state. Third, I hide the tool once it's done, for example available when order_status is empty. Fourth, if a step must happen exactly once, I call it deterministically with run instead of leaving it to the LLM. Example: a shipping agent looked up tracking four times because the action returned a raw JSON blob. Returning a simple 'In transit, arriving Friday' fixed it.

- Check traces for errors or empty results
- Return clear messages for every outcome
- Save outputs to variables
- Hide finished tools; use run for one-time steps

<sub>Also asked as: The agent is stuck in a loop calling an action, why? · Agent repeats the same lookup multiple times, how to fix? · How do you stop repeated tool calls in Agentforce?</sub>

### A client's product and pricing data lives in Snowflake, not Salesforce. How would you ground the agent on it?
*Senior (7–10 yrs) · scenario* · `agent-102`

I'd pick based on how fresh the data must be and how big it is. There are two main options, Data 360 or a live action. Option one, Data 360 with zero copy: Data 360 can read Snowflake tables without copying them, so I map the data in Data 360 and the agent uses it for grounding and retrieval. That works well for large catalogs and historical data. Option two, a live action: an Apex or MuleSoft action calls the client's API in real time. I'd use that for data that changes by the minute, like stock levels. Example: an industrial-parts distributor keeps 200,000 parts and price lists in Snowflake. Product specs and list prices come through Data 360 grounding, but 'how many are in stock in Dallas?' goes to a live inventory action. Either way, I check who's allowed to see what, especially customer-specific pricing, and I keep agent permissions tight.

- Data 360 zero copy for large, slower-changing data
- Live Apex/MuleSoft action for real-time values
- Mix both by data type
- Respect data access rules, like customer pricing

<sub>Also asked as: How do you use external data warehouse data in Agentforce? · Agent needs data from Snowflake or Databricks, how? · Ground an agent on data outside Salesforce</sub>

### A client needs the agent to support English and Spanish customers. How would you set that up?
*Fresher (0–2 yrs) · scenario* · `agent-103`

I'd configure the languages on the agent, make sure the grounding content exists in both languages, and test each language separately. In Agent Script there's a language block where I set the default locale and additional locales, and I add a system instruction like 'reply in the language the customer uses'. Then the content: if the return policy only exists in English, Spanish answers may be translated loosely, so I'd add Spanish Knowledge articles for the important policies. Action outputs can stay in English, since the LLM can phrase the reply in Spanish, but fixed messages like the welcome and escalation messages need both versions. Example: a home-goods store in Texas gets '¿Dónde está mi pedido?' and the agent replies in Spanish with the delivery date. I'd write test cases in both languages, and route Spanish handoffs to bilingual reps.

- Language block: default and additional locales
- Instruction to reply in the customer's language
- Translate key knowledge and fixed messages
- Test both languages; route handoffs to bilingual reps

<sub>Also asked as: How do you build a multilingual agent? · Can Agentforce reply in the customer's language? · Agent answered a Spanish customer in English, how to fix?</sub>

### An admin edits the agent in Agentforce Builder while a developer works on it in VS Code. How do you stop them overwriting each other?
*Senior (7–10 yrs) · scenario* · `agent-104`

I make Git the source of truth and agree on a simple handoff rhythm, because Builder and VS Code end up editing the same draft authoring bundle in the org. Here's how I run it. The developer works on the AiAuthoringBundle locally and deploys it to a shared sandbox so the admin can see the draft in Builder. If the admin tweaks wording in Canvas view, the developer retrieves the AiAuthoringBundle before making more changes, commits it, and only then continues. Published versions are locked, so nobody should edit a version-suffixed bundle expecting it to stick. Example: an admin at a travel company rewrote the cancellation instructions in Builder on Monday, and on Tuesday the developer deployed an older local file, wiping it out. After that, we added a rule: retrieve before you deploy, and one person owns the draft at a time, tracked on the story. Pipelines deploy only from Git.

- Git is the source of truth
- Retrieve the bundle before deploying
- One owner of the draft at a time
- Published, version-suffixed bundles are read-only

<sub>Also asked as: How do pro-code and low-code teams collaborate on one agent? · Who owns the agent source of truth, the org or Git? · Changes made in Builder got lost after a deployment, why?</sub>

### The product owner wants a small change to the agent's wording in production today. How do you handle it, and how would you roll back?
*Fresher (0–2 yrs) · scenario* · `agent-105`

Even for a small change, I make it as a new version and keep the current one ready to come back. Steps: I make the wording change in the sandbox draft, run a quick preview and the core regression tests, then commit and publish it as a new version. In production, I activate the new version. Only one version can be active, so the old one is still there, just inactive. If something goes wrong, I reactivate the previous version, which takes a minute, and then fix the issue calmly. Example: a cinema chain wants the agent to mention a new refund rule for cancelled shows. I update the instruction, test that 'my show was cancelled, can I get my money back?' gives the new answer, and activate. If customers start getting confused answers, I switch back while we look into it. Never edit live without a way back.

- Every change is a new version
- Quick preview + core tests even for small edits
- Activate new; old version stays for rollback
- Reactivate the previous version to roll back

<sub>Also asked as: How do you make a quick change to a live agent? · How do you roll back an agent version? · Agent change went wrong in production, what do you do?</sub>

### Write me a bad action description and a good one, and explain the difference.
*Fresher (0–2 yrs) · scenario* · `agent-106`

A bad description is short and vague, like 'Gets order data'. The LLM doesn't know when to use it, what to pass, or how it differs from other order actions. A good one says what it does, when to use it, and what it needs: 'Returns the delivery status and expected delivery date for one order. Use when the customer asks where their order is or when it will arrive. Requires the order number, which is 8 digits and starts with 00.' And each input gets its own description with an example of the format. Example from a sporting-goods store: with the vague version, the agent used it for returns questions too. With the clear version, it picked the right action every time, and when the customer gave a tracking number instead of an order number, it asked for the right one. Descriptions are basically instructions to the LLM, so I write them like I'm explaining to a new teammate.

- Say what it does, when to use it, what it needs
- Describe each input with a format example
- Make it distinct from similar actions
- Descriptions are instructions to the LLM

<sub>Also asked as: What does a good agent action description look like? · How should you describe action inputs for an agent? · Give an example of a well-written action instruction</sub>

### The client wants the agent to show a list of recent orders as a nice card, not plain text. How would you do it?
*Mid (3–6 yrs) · scenario* · `agent-107`

I'd return structured data from the action and map it to a custom Lightning type with an LWC, so the chat shows a proper card instead of text. Steps: the Apex action returns a list of order objects with number, date, status and total, not a formatted string. Then I define a custom Lightning type for that output and point it to an LWC that renders the card, with each order on its own row and maybe a 'Track' button. In the supported channels, the agent then shows that component when the action returns orders. Example: a cosmetics brand's customer asks 'show my recent orders' and sees three neat order tiles with status badges, instead of a long paragraph. Two gotchas: check which channels support custom rendering, and keep a text fallback, because voice or some channels will still need plain words.

- Action returns structured data, not formatted text
- Custom Lightning type maps output to an LWC
- Check channel support
- Keep a plain-text fallback

<sub>Also asked as: Can an agent show rich UI like cards or tables? · How do you use a custom LWC in an agent response? · What are Lightning types in Agentforce?</sub>

### A client wants every new support case to be read and triaged by an agent automatically, with no chat. How would you build it?
*Mid (3–6 yrs) · scenario* · `agent-108`

I'd use a record-triggered flow on Case that calls the agent through an AI Agent Action, on an asynchronous path so saving the case never waits for the LLM. Steps: build an employee-style triage agent with one subagent whose actions classify the case, find similar solved cases and draft a first reply. In the flow, on create, pass the subject and description to the agent, get back the category, priority and draft, and write them into fields. Then normal assignment rules route the case. The agent user or running user only needs read access to cases and knowledge plus edit on those fields. Example: a printer manufacturer gets 'paper jam error E04 after firmware update'. Within seconds the case is tagged Hardware - Firmware, priority Medium, with a draft reply linking the fix article. I add a fault path, log failures, and have humans spot-check a sample each week.

- Record-triggered flow, async path, AI Agent Action
- Agent returns category, priority, draft
- Write to fields; normal routing continues
- Fault path, logging, human spot-checks

<sub>Also asked as: How do you trigger an agent when a record is created? · Build an automated case triage agent without a chat window. · Use Agentforce in a record-triggered flow, how?</sub>

### A sales director wants an AI summary of 5,000 open opportunities every night. Would you use an agent?
*Mid (3–6 yrs) · scenario* · `agent-109`

No, I wouldn't use a conversational agent for that. It's a bulk job with no conversation, so I'd use a prompt template with batch prompt processing. Steps: create a Flex or Record Summary style template that takes an opportunity and returns a short summary, maybe as JSON with risk level and next step. Then run it through batch prompt processing, which handles up to a thousand prompts per batch asynchronously, from Flow or Apex. So for 5,000 opportunities, a scheduled job splits them into batches and writes results into a summary field. Example: a construction-equipment company's director opens the dashboard every morning and sees 'Stalled, no activity in 21 days, customer asked for revised pricing'. Two things I'd flag: cost, since that's thousands of LLM calls every night, so maybe only summarize opportunities that changed; and timing, so jobs finish before people log in.

- Bulk, no conversation: prompt template, not agent
- Batch prompt processing: up to 1,000 per batch, async
- Schedule and split into batches
- Only process changed records to save cost

<sub>Also asked as: How do you run LLM summaries on thousands of records? · Agent vs batch prompts for bulk summaries? · Nightly AI summaries for all opportunities, how?</sub>

### An insurer wants the agent to collect claim details step by step, like a form. How would you design that conversation?
*Mid (3–6 yrs) · scenario* · `agent-110`

I'd treat each required detail as a variable, have the instructions ask only for what's still missing, and only allow the submit action when everything is filled and confirmed. Steps: declare variables like policy_number, incident_date, damage_type and description. In the reasoning instructions, use conditions, so if policy_number is empty, the prompt says 'ask for the policy number', and so on, one question at a time. A setVariables utility captures each answer, and a validation action checks the policy number is real. The submit_claim tool is gated with available when all fields are filled and the customer has confirmed the summary. Example: 'a tree fell on my garage last night' fills damage_type and incident_date in one go, so the agent only asks for the policy number and photos. Deterministic gating means no half-filled claims get created.

- One variable per required detail
- Conditional instructions ask only for missing items
- Validate key fields with an action
- Gate submit on all fields + confirmation

<sub>Also asked as: How do you do slot filling in Agent Script? · Agent needs to gather several details before submitting, how? · Make sure the agent collects all required info before an action</sub>

### A client asks whether they should build a custom agent or use a prebuilt one. How do you decide?
*Senior (7–10 yrs) · scenario* · `agent-111`

I start from prebuilt wherever the process is standard, and build custom only where the process is what makes the client different. Prebuilt options include the service agent template, sales agents like SDR and Sales Coach, industry templates in Financial Services and Health Cloud, and partner components on AgentExchange. They're faster to launch and Salesforce keeps improving them. Custom makes sense when the logic is unique, like a manufacturer's warranty rules, or when data lives in their own systems. In practice it's usually a mix. Example: a property-management company uses the standard service agent for general questions and knowledge answers, then adds a custom subagent with Apex actions for its own maintenance-request rules and vendor dispatch. My questions to decide: how close is the template to their real process, how much customization is needed, who maintains it later, and what does each option cost in credits and effort.

- Prebuilt for standard processes
- Custom for differentiating logic or external data
- Usually a mix: template + custom subagents
- Decide on fit, customization, maintenance, cost

<sub>Also asked as: Prebuilt agent templates vs custom agent, how do you choose? · When would you use a standard Agentforce agent instead of building your own? · Build vs buy for Agentforce</sub>

### The client wants a kill switch: if the agent misbehaves, they must be able to turn it or one action off quickly. How would you set that up?
*Senior (7–10 yrs) · scenario* · `agent-112`

I'd give them two levels: turn off the whole agent, and turn off a single risky action, both without a code deployment. Whole agent: deactivate it in Builder or with sf agent deactivate, and design the Omni-Channel flow so that if the agent isn't available, chats go straight to the human queue. I'd document this as a runbook. Single action: the action checks a custom metadata or custom setting flag, like Refunds_Enabled, and returns 'I can't do that right now, let me connect you with a person' when it's off. In Agent Script I can also save that flag into a variable at the start and use available when, so the tool disappears entirely. Removing the Apex class from the agent user's permission set is another fast lever. Example: a travel company notices wrong rebooking fees. Ops flips the rebooking flag off in seconds, rebookings go to humans, and everything else keeps working.

- Whole agent: deactivate, fallback route to humans
- Single action: config flag checked in the action
- Also available when on the flag, or remove permissions
- Write a runbook and test it

<sub>Also asked as: How do you quickly disable an agent in production? · How can you turn off just one agent action without a deployment? · Emergency stop for Agentforce, how?</sub>

### When the agent hands a chat to a human, the rep has to ask the customer everything again. How do you fix that?
*Mid (3–6 yrs) · scenario* · `agent-113`

I make the agent capture a short summary and the key facts before handing off, and I make sure the rep sees them on screen. Steps: during the chat, the agent saves important details into variables, like order number, issue type and what's been tried. Right before escalation, it fills an issue_summary variable, or an action writes the summary onto the case or messaging session. The escalation goes through the Omni-Channel flow, so the rep gets the same messaging session with the full transcript. I add the summary field to the rep's console layout so it's the first thing they see. Example: 'customer's coffee machine leaks, order 55120, already tried resealing the tank, wants a replacement' appears at the top of the rep's screen, so the rep opens with 'I can send you a replacement today' instead of 'how can I help?'. I'd measure handle time after handoff to prove it works.

- Save key facts in variables during the chat
- Write a summary before escalating
- Same session and transcript via Omni-Channel
- Show the summary on the rep's layout

<sub>Also asked as: How do you pass context from the agent to a human rep? · Escalation loses the conversation details, what do you do? · Make agent-to-human handoff smooth</sub>

### An online retailer expects ten times the normal chat volume on Black Friday. How do you prepare the agent?
*Senior (7–10 yrs) · scenario* · `agent-114`

I'd prepare four things: cost, the human backup, the agent's own efficiency, and monitoring. Cost: estimate conversations times actions per conversation, check the Flex Credits balance in Digital Wallet, and agree on a budget and alerts with the client. Human backup: escalations scale too, so the support manager plans rep capacity, and the Omni-Channel flow has a fallback message and queue if waits get long. Efficiency: trim actions, save lookups in variables, and add the obvious peak questions, like 'when does the sale end?' and 'is my discount applied?', to knowledge ahead of time. Monitoring: set health alerts for error rate, latency and escalation spikes, and have someone watching on the day. Example: for a shoe retailer, we'd also freeze agent changes a week before, run the full regression suite, and keep the previous version ready to reactivate.

- Forecast credits; set budgets and alerts
- Plan human capacity and fallback routing
- Trim actions; pre-load peak FAQs
- Health alerts, change freeze, rollback ready

<sub>Also asked as: How do you plan for peak load on an Agentforce agent? · What do you check before a big sales event for the agent? · Scaling Agentforce for high traffic</sub>

### The client wants the agent to greet logged-in customers by name. How would you do it?
*Fresher (0–2 yrs) · scenario* · `agent-115`

It works when the customer is already logged in on the site or app, so the channel can pass their identity to the agent. Steps: the website uses authenticated Messaging for In-App and Web, so the messaging session is linked to a verified user. In the agent, a linked variable picks up context from the messaging session, and at the start of the conversation an action looks up the contact and stores their first name in a variable. The welcome instruction then says 'greet the customer by first name if you have it'. Example: a pet-supplies shop's customer opens chat and sees 'Hi Priya, are you asking about your order from Tuesday?'. For guests who aren't logged in, I don't guess from what they type; the agent stays generic and asks to verify before showing anything personal. Typing a name isn't proof of identity.

- Needs an authenticated channel
- Linked variables carry session context
- Lookup action stores name in a variable
- Guests stay generic until verified

<sub>Also asked as: How does the agent know who the customer is? · Personalize agent greeting with the customer's name, how? · How do you pass customer identity into an agent?</sub>

### The team can't agree between two versions of the agent's instructions. How would you compare them fairly?
*Senior (7–10 yrs) · scenario* · `agent-116`

I'd run both versions against the same test suite in a sandbox, compare the numbers, and only then try the winner on real traffic. Steps: version A and version B are separate committed versions. I build a test suite of real utterances taken from production session traces, including the hard and weird ones, with routing, action and outcome checks. I run the suite against A, then activate B and run it again, a few times each because LLM results vary. I compare pass rates, which cases each one fails, and response length. Since only one version can be active in an org at a time, for a production check I'd run the winner for a week and compare Observability metrics, like escalation rate and quality scores, against the week before. Example: for a hotel chain, version B cut wrong routing between 'cancel booking' and 'change booking'. The decision is based on data, not opinions.

- Same test suite for both versions
- Use real utterances from traces
- Run several times; compare pass rates and failures
- Confirm in production with before/after metrics

<sub>Also asked as: How do you A/B test agent instructions? · Compare two agent versions objectively, how? · Which instructions are better, how do you prove it?</sub>

### After a release, the agent's routing accuracy dropped. How would you find and fix the cause?
*Senior (7–10 yrs) · troubleshooting* · `agent-117`

First I protect customers, then I find what changed. If the drop is serious, I reactivate the previous version right away. Then I compare the two versions. In Git I diff the Agent Script: changed subagent or route descriptions, a new subagent overlapping an old one, edited system instructions, or a model change. I also check things outside the script, like an action that was renamed or a permission removed from the agent user. Next I take failing conversations from session traces, see which subagent was chosen and why, and add them as test cases. I fix the cause, run the full suite on both versions to confirm, then release again. Example: an airline added a 'baggage fees' subagent described as 'questions about bags', which stole lost-baggage questions from the claims subagent. Making the descriptions specific fixed it, and those utterances now live in the regression suite.

- Roll back first if impact is serious
- Diff the Agent Script and check outside dependencies
- Use traces to see why routing changed
- Turn failures into permanent test cases

<sub>Also asked as: Agent got worse after deployment, what do you do? · Regression in agent routing after a change, how to debug? · New agent version sends questions to the wrong subagent</sub>

### Your team wants to use AI to write Apex and agent code faster. How would you set it up responsibly?
*Mid (3–6 yrs) · scenario* · `agent-118`

I'd roll out Agentforce Vibes with the same guardrails we use for any code, plus a few AI-specific ones. Steps: developers use Vibes in their IDE, connected to a developer sandbox or scratch org, never production. We set up agentic rules with our coding standards, like bulkify everything, use user mode queries, and no hard-coded Ids, so generated code follows them. Every change still goes through a pull request with human review, Code Analyzer scans and real test coverage, not just tests the AI wrote to pass. Deployments go only through the pipeline or DevOps Center. Example: a developer asks Vibe Codey for a batch class to clean up old leads. It writes the class and tests in minutes; the reviewer notices it deletes without checking ownership rules and asks for a change. The time saved is real, but the developer is still accountable for what ships.

- Sandbox or scratch org only
- Agentic rules encode coding standards
- PR review, Code Analyzer, meaningful tests
- Deploy only through the pipeline

<sub>Also asked as: How do you use Agentforce Vibes in a team? · How do you govern AI-generated code in Salesforce? · Is it safe to let AI write our Apex?</sub>

### A business user asks you to explain in simple terms how the agent decides what to do with a message. What do you say?
*Fresher (0–2 yrs) · scenario* · `agent-119`

I'd say the agent works like a smart receptionist with a set of approved tools. Step one, the message arrives and the router reads it and picks the right area, a subagent, based on the descriptions we wrote. Step two, inside that subagent, the agent reads its instructions and sees which tools, meaning actions, it's allowed to use right now. Step three, it picks a tool, fills in the details from the conversation, and the tool runs with the agent's permissions, like looking up an order. Step four, it writes a reply using what the tool returned, and the Trust Layer checks things like toxicity along the way. Example: 'can I change the delivery address for my sofa?' goes to the delivery subagent, the agent calls the address-change action with the order number, and replies 'Done, it'll go to the new address on Friday.' If no tool fits, it says what it can help with or hands over to a person.

- Router picks a subagent from descriptions
- Subagent instructions + allowed actions
- Action runs with the agent's permissions
- Reply is built from the result; Trust Layer checks

<sub>Also asked as: Explain how Agentforce reasoning works to a non-technical person. · What happens step by step when a customer sends a message to the agent? · How does the agent choose an action?</sub>

### A customer asks the agent something it has no data for, like when an out-of-stock item will be back. What should happen?
*Fresher (0–2 yrs) · scenario* · `agent-120`

The agent should say honestly that it doesn't have that information and offer a useful next step, never invent an answer. I do three things. First, instructions: 'if the tools or knowledge don't contain the answer, say you don't have it; never guess dates, prices or policies'. Second, actions that return a clear 'no data' message, like 'no restock date available', so the agent knows the difference between unknown and empty. Third, a next step, like an action to sign the customer up for a back-in-stock email, or a handoff. Example: at a furniture store, 'when is the green velvet sofa back?' gets 'I don't have a restock date yet. I can email you as soon as it's back, would you like that?' Then I add this to the test suite with an expected outcome like 'does not invent a date and offers a notification'.

- Never guess dates, prices or policies
- Actions return clear 'no data' results
- Offer a next step or handoff
- Test that it doesn't invent answers

<sub>Also asked as: How do you stop the agent from guessing when it doesn't know? · Agent made up a restock date, how do you prevent it? · What should an agent say when it has no answer?</sub>
