# Salesforce Q&A bank

1342 questions with answers in simple spoken English — 432 fresher (0–2 yrs), 520 mid (3–6 yrs), 390 senior (7–10 yrs).
The copilot searches this bank instantly when a question is heard, shows the closest answer, and gives it to Claude as a reference.

| Area | Questions | Scenario | With code |
|---|---|---|---|
| [Apex, Governor Limits and Testing](docs/apex-core.md) | 85 | 21 | 32 |
| [Apex Triggers and Order of Execution](docs/triggers.md) | 85 | 25 | 52 |
| [Asynchronous Apex, Batch and SOQL](docs/async-soql.md) | 85 | 22 | 55 |
| [LWC, Aura and Visualforce](docs/lwc-ui.md) | 85 | 15 | 55 |
| [Admin, Security and Flow](docs/admin-security-flow.md) | 90 | 31 | 7 |
| [Integration](docs/integration.md) | 75 | 8 | 25 |
| [Sales Cloud and Service Cloud](docs/sales-service.md) | 85 | 30 | 8 |
| [Sales Cloud: lifecycle, features and scenarios](docs/sales-cloud-more.md) | 60 | 17 | 6 |
| [Service Cloud: case lifecycle, features and scenarios](docs/service-cloud-more.md) | 61 | 21 | 7 |
| [Experience Cloud, Health Cloud and Field Service](docs/experience-health-fsl.md) | 85 | 26 | 6 |
| [Experience Cloud: site lifecycle, features and scenarios](docs/experience-cloud-more.md) | 52 | 19 | 7 |
| [Health Cloud: patient lifecycle, features and scenarios](docs/health-cloud-more.md) | 54 | 30 | 5 |
| [CPQ, Revenue Cloud and OmniStudio](docs/cpq-revenue-omnistudio.md) | 85 | 26 | 4 |
| [CPQ: quote-to-cash lifecycle, features and scenarios](docs/cpq-more.md) | 70 | 29 | 10 |
| [Data 360 and Agentforce](docs/data360-agentforce.md) | 85 | 10 | 6 |
| [Agentforce: development, scenarios and newer features](docs/agentforce-more.md) | 70 | 36 | 15 |
| [Architecture and DevOps](docs/architecture-devops.md) | 75 | 14 | 20 |
| [Lead roles: leadership, governance and behavioural](docs/lead-scenarios.md) | 55 | 38 | 0 |

Edit or add questions in `src/*.json` (format: `src/_example.json`), check them with `node tools/validate.js src/*.json`, then run `node tools/build.js`.
Answers were written fresh and fact-checked against Salesforce documentation (October 2026). Salesforce changes quickly: re-check limits and product names before relying on them.
