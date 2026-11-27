# Health Cloud: patient lifecycle, features and scenarios

54 questions. Levels: Fresher (0–2 yrs) 18 · Mid (3–6 yrs) 22 · Senior (7–10 yrs) 14

## Health Cloud Lifecycle

### Walk me through the patient journey in Health Cloud from start to finish.
*Mid (3–6 yrs) · concept* · `hcx-001`

I usually tell it as one patient's story. Say Maria is referred to a clinic for diabetes. The referral comes in as a Clinical Service Request, or she starts as a lead from a web form and gets converted. She becomes a person account, with her medical record number stored on the Identifier object, and we record her consent. Then we link her household and caregiver and set up her care team. The care manager runs an assessment, and the answers suggest problems and goals for a care plan built from a template. Appointments are booked through Intelligent Appointment Management. Her conditions, labs and medications flow in from the EHR into the FHIR-aligned clinical data model, usually through MuleSoft. The team monitors her on the timeline and through care gaps. When she's discharged after a hospital stay, the encounter update triggers follow-up tasks. Consent and privacy controls run across every stage.

- Intake: referral (ClinicalServiceRequest) or lead conversion
- Patient = person account + Identifier, consent, household, care team
- Assessment -> care plan from template (Integrated Care Management)
- Appointments, EHR clinical data, timeline and care gaps
- Discharge (ClinicalEncounter) -> follow-up; consent and security throughout

<sub>Also asked as: Explain the patient lifecycle in Health Cloud end to end. · What are the stages of patient care in Health Cloud and which objects are used at each? · Take me through how a patient moves through Health Cloud, from referral to follow-up. · patient journey health cloud walk through</sub>

### How do you onboard a new patient or member in Health Cloud?
*Fresher (0–2 yrs) · concept* · `hcx-002`

Onboarding means creating one clean patient record and putting the basics around it. Say a new patient calls a clinic to register. The intake user first searches for an existing record, because duplicates are the biggest headache later. If none exists, they create a person account with the patient record type, and store identifiers like the medical record number or member ID on the Identifier object, linked to the account. Next comes consent, like the privacy notice or consent to join a program, then household and caregiver relationships, and the care team. Many orgs wrap all of this in one guided OmniScript so the front desk can't skip a step. Person accounts are the recommended model because a patient is an individual, and a caregiver who later becomes a patient doesn't need remodeling.

- Search first to avoid duplicates
- Person account for the patient, Identifier for MRN or member ID
- Capture consent, household, caregiver and care team
- Often wrapped in a guided OmniScript

<sub>Also asked as: What happens when a new patient is registered in Health Cloud? · Explain patient intake and onboarding in Health Cloud. · How is a patient record created and set up in Health Cloud? · new patient registration health cloud</sub>

### How do you convert a lead into a patient in Health Cloud?
*Fresher (0–2 yrs) · concept* · `hcx-003`

Health Cloud lets you capture a prospective patient as a lead and convert it into a patient, and the result is always a person account. Say a clinic runs a weight-management campaign and people fill in a web form. They land as leads and an intake coordinator qualifies them. Health Cloud adds patient fields to the lead, like a medical record number, and the Individual Record Type Mapper decides which lead record types convert to patients. The coordinator uses the Convert to Patient action, which comes from the HealthCloudExtensions package, or you build your own process in Flow. Before converting, the process compares the source system ID and medical record number with existing accounts and flags a match as a duplicate instead of creating a second patient. The gotcha is field mapping: custom lead fields must be mapped to account or contact, or that data is lost at conversion.

- Result is always a person account
- Individual Record Type Mapper routes lead record types
- Convert to Patient (HealthCloudExtensions) or a custom Flow
- Duplicate check on source system ID and MRN
- Map custom lead fields before converting

<sub>Also asked as: What is lead to patient conversion in Health Cloud? · How does Convert to Patient work? · A prospective patient is a lead. How does it become a patient record? · lead conversion person account health cloud</sub>

### How do assessments work in Health Cloud?
*Mid (3–6 yrs) · concept* · `hcx-004`

Assessments are structured questionnaires, like a fall-risk or depression screening, built on Discovery Framework with OmniStudio. Say a care manager screens every new patient for fall risk. An admin creates assessment questions and question sets in the OmniStudio app, then clicks Build OmniScript, which generates a Discovery Framework OmniScript. Once activated, it can sit on the patient page or an Experience Cloud site. Answers are stored in Discovery Framework objects such as Assessment and AssessmentQuestionResponse, so they're reportable. The useful part for care management is that admins can map responses to recommendations, so a high-risk answer suggests a problem, goal or intervention when the care manager builds the care plan. That mapping uses the AsmtQstnRespRecommendation object with a decision table. I'd also mention that assessments are not the same as Salesforce Surveys; surveys suit simple feedback, assessments suit clinical screening.

- Built with Discovery Framework + OmniStudio (Build OmniScript)
- Objects: Assessment, AssessmentQuestion, AssessmentQuestionSet, AssessmentQuestionResponse
- Responses can drive care plan recommendations (AsmtQstnRespRecommendation + decision table)
- Different from Salesforce Surveys

<sub>Also asked as: What are Health Cloud assessments and how are they built? · Explain Discovery Framework assessments in Health Cloud. · How do you create a screening questionnaire for patients in Health Cloud? · assessments vs surveys in health cloud</sub>

### What is the PGI library in Health Cloud?
*Fresher (0–2 yrs) · concept* · `hcx-005`

The PGI library is the reusable catalog of Problems, Goals and Interventions that care plan templates are built from. Say a clinic manages heart failure patients. An admin creates a ProblemDefinition for heart failure, GoalDefinition records like 'weight stays within target', and action plan templates for interventions like weekly nurse calls. ProblemGoalDefinition links problems to goals, since one goal can serve many problems. A CarePlanTemplate then arranges these into a structure. When a care manager creates a plan for a real patient, the definitions turn into records on that patient: problems become HealthCondition records and goals become GoalAssignment records. The value is consistency. Every nurse uses the same wording and the same interventions, and reporting across patients works because everything points at the same definitions.

- ProblemDefinition, GoalDefinition, ProblemGoalDefinition junction
- Interventions come from action plan templates
- CarePlanTemplate arranges the PGI items
- Instantiated as HealthCondition and GoalAssignment on the patient

<sub>Also asked as: What does Problem Goal Intervention library mean? · What are ProblemDefinition and GoalDefinition used for? · How are care plan templates built in Integrated Care Management? · p g i library health cloud</sub>

### Walk me through the life of a care plan in Health Cloud, from creation to closure.
*Mid (3–6 yrs) · concept* · `hcx-006`

A care plan goes from template, to an active plan on the patient, to review and closure. Say a patient is diagnosed with COPD. The care manager opens the care plan FlexCard on the patient's person account and clicks New Care Plan, which runs an OmniScript. They pick the COPD template, and the assessment results suggest extra problems or goals, like quitting smoking. The plan is saved as a CarePlan record, goals become GoalAssignment records, and interventions from action plan templates become tasks for the team. Over the next weeks the team completes tasks, records outcomes and updates goal progress, while CRM Analytics dashboards show plan status and overdue tasks. When the goals are met or the patient leaves the program, the plan is closed with a reason and its history stays visible. One thing to watch: older orgs may still use the managed-package care plan, which was a Case.

- Create: New Care Plan on the FlexCard runs an OmniScript with a template
- CarePlan, GoalAssignment, interventions as tasks
- Track progress, outcomes, dashboards
- Close with a reason; legacy orgs use Case-based care plans

<sub>Also asked as: How is a care plan created, tracked and closed in Health Cloud? · What happens to a care plan after it is created? · Explain the care plan lifecycle in Integrated Care Management. · care plan life cycle health cloud</sub>

### What are care gaps in Health Cloud and how do they get closed?
*Mid (3–6 yrs) · concept* · `hcx-007`

A care gap is a recommended service a patient should have had but hasn't, like a diabetic patient with no eye exam in the last year. In Health Cloud the rule is defined as a ClinicalMeasure with its criteria. A care manager clicks New Care Gap on the care gap FlexCard, which runs an OmniScript that evaluates the measure against the patient's data, and if the measure isn't met, a CareGap record is created. Gaps can also be imported from a quality or analytics system, or entered manually. From the gap, the care manager can create a care plan or arrange the missing service. Once the eye exam happens and the data comes in, re-evaluating the measure closes the gap. Payers care a lot about this because closed gaps drive quality scores, so I'd also report on open gaps by provider or program.

- ClinicalMeasure + criteria define the rule
- CareGap created by evaluation, import or manual entry
- Care plans can be created from care gaps
- Re-evaluation after the service closes the gap

<sub>Also asked as: Explain care gaps and clinical measures in Health Cloud. · How does Health Cloud find missing preventive care? · What is a CareGap record? · care gap closure process</sub>

### What is the difference between a ClinicalEncounter and an appointment in Health Cloud?
*Mid (3–6 yrs) · comparison* · `hcx-008`

A ClinicalEncounter is the clinical record of a visit or stay that happened or is happening, while an appointment is the scheduling record for a planned time slot. Say a patient books a cardiology visit for Tuesday at 10. That booking is a ServiceAppointment when scheduling runs on Salesforce Scheduler or Field Service, or a slot in the EHR's schedule. On Tuesday the EHR records the actual visit, and it comes into Health Cloud as a ClinicalEncounter with a status like In Progress or Finished, start and end dates, the facility, and related diagnosis and provider records. Encounters also cover hospital stays, with an admission source and a discharge disposition. So I use appointments for access, booking and no-show reporting, and encounters for clinical history and follow-up logic like 'discharged yesterday'.

- Appointment = planned slot (ServiceAppointment or EHR schedule)
- ClinicalEncounter = actual visit or stay, FHIR Encounter aligned
- Encounter has Status, StartDate, EndDate, FacilityId, DischargeDispositionId
- Child objects: ClinicalEncounterDiagnosis, ClinicalEncounterProvider

<sub>Also asked as: Encounter vs appointment in Health Cloud, when is each used? · Is a visit stored as ClinicalEncounter or ServiceAppointment? · How do you model visits and hospital stays in Health Cloud? · clinical encounter versus service appointment</sub>

### How does consent management work in Health Cloud?
*Mid (3–6 yrs) · concept* · `hcx-009`

Health Cloud consent management tracks which document a patient agreed to, for which purpose, and how. Say a hospital runs a remote monitoring program that needs a signed data-sharing consent. An admin creates a Data Use Purpose for the program, an Authorization Form with its revision and effective dates, and Authorization Form Text that holds the actual document, one per language if needed. Authorization Form Data Use links the form to the purpose. When the patient signs on the portal or in person, an Authorization Form Consent record captures who gave consent, the method and the status. So months later anyone can see exactly which version she signed and when. Communication preferences, like opting out of marketing texts, sit separately in the standard ContactPointTypeConsent model, so I don't mix clinical consent with marketing opt-outs.

- DataUsePurpose, AuthorizationForm, AuthorizationFormText, AuthorizationFormDataUse
- AuthorizationFormConsent records each consent: giver, method, status
- Versioned text per language or region
- Communication opt-outs: ContactPointTypeConsent

<sub>Also asked as: Which objects store patient consent in Health Cloud? · How do you capture and track a signed consent form? · Explain Authorization Form and Data Use Purpose. · patient consent tracking health cloud</sub>

### Walk me through the member lifecycle for a health plan in Health Cloud.
*Senior (7–10 yrs) · concept* · `hcx-010`

For a payer, the lifecycle follows the member rather than a single visit. Say a health plan signs a new employer group. Group quoting and enrollment set up the purchaser's plan, and each person gets a MemberPlan linking them to the PurchaserPlan with their coverage. The member's person account then becomes the hub for service: contact center agents see the member 360 with benefits, coverage and claims data from the core claims system. When a doctor requests an MRI, Utilization Management handles the prior authorization as a Care Request. If the member has a chronic condition, they're enrolled in a care management program and get a care plan, and care gaps flag missed preventive care. Provider network management keeps the directory current and referrals in network. Appeals, grievances and renewals close the loop. I always confirm which of these the payer runs in Salesforce and which stay in their core admin platform.

- Enrollment: PurchaserPlan, MemberPlan, coverage benefits
- Member service: member 360, benefits and claims visibility
- Utilization Management: Care Request for prior authorization
- Care management programs, care plans, care gaps
- Provider network, appeals and grievances

<sub>Also asked as: How does a payer use Health Cloud across the member journey? · Explain the payer side lifecycle, from enrollment to care management. · What objects does a health insurer use for members in Health Cloud? · member journey payer health cloud</sub>

## Health Cloud

### Health Cloud is now called Agentforce Health. What does that change?
*Fresher (0–2 yrs) · concept* · `hcx-011`

It's mainly a rebrand: Salesforce now markets the product as Agentforce Health (formerly Health Cloud), in line with putting Agentforce across its industry clouds. Underneath it's the same platform: person account patients, the clinical data model, Integrated Care Management, Utilization Management, provider management and so on. Say a client's RFP asks for Agentforce Health experience: that's Health Cloud experience. What changed is the emphasis on AI agents that work on that data, like agents that verify benefits or help schedule appointments. The developer guide is now titled the Agentforce Health Developer Guide, but objects like HealthCondition and CarePlan keep their names, and many setup screens still say Health Cloud. Life Sciences Cloud got the same treatment and is now Agentforce Life Sciences. In an interview I mention both names, which shows I'm current without confusing anyone.

- Agentforce Health = Health Cloud, rebranded
- Same data model and features; object names unchanged
- Bigger focus on AI agents on top of health data
- Life Sciences Cloud is now Agentforce Life Sciences

<sub>Also asked as: What is Agentforce Health? · Is Health Cloud renamed? · Agentforce Health vs Health Cloud, are they different products? · agent force health formerly health cloud</sub>

### What is Agentforce for Health and what can its agents do?
*Mid (3–6 yrs) · concept* · `hcx-012`

Agentforce for Health is a library of prebuilt agent skills and actions for healthcare, built on Health Cloud and Life Sciences Cloud data, announced in early 2025. Examples: provider search and scheduling, where an agent matches a patient to an in-network provider and books a visit; care coordination, like pre-visit summaries and eligibility or prior authorization checks with payers through partner networks; benefits verification for pharmacy and equipment benefits; disease surveillance for public health, turning lab reports into cases; and home health help like note transcription. Say a patient messages a clinic at night asking for a dermatologist: an agent can find in-network options, offer slots, and hand off to a human if it gets clinical. When I talk about it, I stress guardrails: identity verification, grounding only on that patient's data, the Einstein Trust Layer, and checking that the BAA covers the AI services being used.

- Prebuilt healthcare agent skills and actions
- Provider search and scheduling, care coordination, benefits verification
- Public health disease surveillance, home health
- Guardrails: identity, grounding, Trust Layer, BAA coverage

<sub>Also asked as: What AI agent capabilities does Salesforce offer for healthcare? · Give examples of Agentforce use cases in Health Cloud. · How is Agentforce used by providers and payers? · agentforce for health skills and actions</sub>

### What is the difference between Health Cloud and Life Sciences Cloud?
*Fresher (0–2 yrs) · comparison* · `hcx-013`

Health Cloud is for providers and payers, while Life Sciences Cloud, now Agentforce Life Sciences, is for pharma, biotech and medtech companies. Say a hospital wants care plans for its heart patients: that's Health Cloud. A drug maker wants a patient support program for a specialty medicine, needs to recruit clinical trial participants, or manages reps' meetings with doctors: that's Life Sciences Cloud. Earlier, life sciences companies often used Health Cloud for patient programs, which is why you still see overlap in things like care programs. Salesforce then built Life Sciences Cloud as its own product, launched around 2024, with clinical trial and customer engagement features. In an interview I'd say the first question is who the customer is, provider, payer or manufacturer, because that decides the product and the licenses.

- Health Cloud (Agentforce Health): providers and payers
- Life Sciences Cloud (Agentforce Life Sciences): pharma, biotech, medtech
- Life sciences: patient services, clinical trials, HCP engagement
- Customer type decides the product

<sub>Also asked as: Health Cloud vs Life Sciences Cloud, who uses which? · When would a company choose Life Sciences Cloud instead of Health Cloud? · Is Life Sciences Cloud part of Health Cloud? · agentforce life sciences vs agentforce health</sub>

### What role does OmniStudio play in Health Cloud?
*Fresher (0–2 yrs) · concept* · `hcx-014`

OmniStudio is the toolkit Health Cloud uses for most of its guided screens and compact data views. FlexCards show patient information, OmniScripts run step-by-step processes, Integration Procedures fetch and combine data, and Data Mappers (formerly DataRaptors) read, transform and save records. Say a care manager clicks New Care Plan: that launches an OmniScript, and the care plan view itself is a FlexCard. Assessments are Discovery Framework OmniScripts, patient self-scheduling uses the Intelligent Appointment Management OmniScripts, and Utilization Management uses Integration Procedures and Data Mappers to pull member data from the EHR. So on a Health Cloud project I need to read and customize these, not just build Flows. My habit is to copy or version the shipped OmniScripts before changing them, so later upgrades don't wipe my work.

- FlexCards, OmniScripts, Integration Procedures, Data Mappers (formerly DataRaptors)
- Care plans, care gaps, assessments, scheduling all use OmniStudio
- Customize copies or new versions of shipped components

<sub>Also asked as: Why do Health Cloud projects need OmniStudio? · Where are FlexCards and OmniScripts used in Health Cloud? · Do I need to know OmniStudio for Health Cloud? · omni studio in health cloud</sub>

### What are CodeSet and CodeSetBundle in Health Cloud, and why are they needed?
*Mid (3–6 yrs) · concept* · `hcx-015`

CodeSet stores a single code from a coding system, and CodeSetBundle groups equivalent codes from different systems, so one clinical concept is referenced once. Say a patient has type 2 diabetes. The EHR might send an ICD-10 code, while the problem list uses SNOMED. Each code is a CodeSet record, and a CodeSetBundle groups them as the same concept. Clinical records point to the bundle; for example HealthCondition.ConditionCodeId is a required lookup to CodeSetBundle, and MedicationStatement uses MedicationCodeId the same way. The benefit is that queries and reports work on one concept regardless of which coding system the source used. The gotcha on projects is load order: code sets must be loaded before the clinical data, or inserts fail because the code lookup is required.

- CodeSet = one code (ICD-10, SNOMED, LOINC, RxNorm)
- CodeSetBundle = group of equivalent codes
- HealthCondition.ConditionCodeId -> CodeSetBundle (required)
- Load code sets before clinical data

<sub>Also asked as: How are medical codes like ICD-10 or SNOMED stored in Health Cloud? · Why does HealthCondition point to a CodeSetBundle? · Explain code sets in the clinical data model. · code set bundle health cloud</sub>

### What is the difference between the Health Cloud managed package and the standard Health Cloud objects?
*Mid (3–6 yrs) · comparison* · `hcx-016`

Health Cloud started as a managed package with custom objects in the HealthCloudGA namespace, and over time Salesforce moved most of the data model to standard platform objects. Say you join a project on an org set up several years ago: you may find the older EHR custom objects from the package, care plans built as Case records, and the older timeline. A newer org uses standard objects like HealthCondition, CareObservation and CarePlan, Integrated Care Management, and the Enhanced Timeline. Both can exist in the same org, since the package may still be installed for some features. For new work I build on the standard objects, because new features, FHIR mappings and Agentforce for Health target them. When an org is on the old model, I don't rip it out blindly; I plan a migration with data mapping and parallel testing.

- Old: HealthCloudGA custom objects, Case-based care plans
- New: standard FHIR-aligned objects, CarePlan, Enhanced Timeline
- Both can coexist in one org
- Build new work on standard objects; migrate deliberately

<sub>Also asked as: HealthCloudGA package objects vs standard objects, what changed? · Why do some Health Cloud orgs have custom EHR objects? · Old Health Cloud data model vs new data model. · managed package versus core objects health cloud</sub>

### How does Provider Search work behind the scenes in Health Cloud?
*Mid (3–6 yrs) · concept* · `hcx-017`

Provider Search doesn't query the provider records directly; a sync process copies provider data into a flattened search object, CareProviderSearchableField, and the search component queries that. Say a care coordinator needs an orthopedic surgeon near the patient. Behind that search, practitioners and facilities are HealthcareProvider records linked to contacts and accounts, and HealthcarePractitionerFacility links each practitioner to every facility where they work. The provider sync fills the searchable object: the Data Processing Engine version runs once a day, the legacy version every six hours, and you can trigger it manually. If a newly added doctor doesn't show up, I check the Provider Search Sync Logs for failures, and that required fields like names and addresses are filled. You can also add custom fields, like languages spoken, to make them searchable.

- Search runs on CareProviderSearchableField, filled by provider sync
- Source: HealthcareProvider + HealthcarePractitionerFacility
- DPE sync daily, legacy every six hours, manual trigger possible
- Troubleshoot with Provider Search Sync Logs

<sub>Also asked as: Why does a new doctor not show up in Provider Search? · What is CareProviderSearchableField? · How do you set up data for provider search? · provider search sync health cloud</sub>

### What do you consider before using Shield Platform Encryption on patient data?
*Senior (7–10 yrs) · concept* · `hcx-018`

Shield Platform Encryption protects PHI at rest, but every encrypted field has a cost, so I encrypt deliberately rather than everything. Say a clinic wants to encrypt date of birth, a national ID number and clinical notes. With probabilistic encryption you can't filter or sort on the field in SOQL, list views or reports, which breaks things like finding a patient by date of birth. Deterministic encryption allows exact-match filtering, so I use it for fields people search on. Encryption also limits some formulas, report features and matching rules, so I retest automation and integrations after enabling it. I check which standard Health Cloud fields support encryption and plan key management, like tenant secret rotation and Bring Your Own Key if required. And encryption isn't access control: a user with read access still sees the decrypted value, so sharing and field-level security still matter.

- Probabilistic: strongest, but no filtering or sorting
- Deterministic: allows exact-match filtering
- Retest formulas, reports, duplicate rules, integrations
- Key management: rotation, BYOK
- Encryption is not access control

<sub>Also asked as: Should we encrypt all PHI fields in Health Cloud? · Deterministic vs probabilistic encryption for patient data. · What breaks when you turn on Platform Encryption? · shield encryption health cloud trade offs</sub>

### What is the difference between field history tracking, Field Audit Trail and Event Monitoring for patient data?
*Mid (3–6 yrs) · comparison* · `hcx-019`

They answer different audit questions. Field history tracking records who changed a field and when, for a limited number of fields and a limited time. Field Audit Trail, part of Shield, extends change history to more fields and keeps it for years, which suits medical record retention rules. Event Monitoring records activity, like who viewed a record, ran or exported a report, called the API, or logged in. Say a patient complains that her allergy list was changed and that someone looked at her chart without reason. The allergy change shows in field history or Field Audit Trail; the chart view shows in Event Monitoring, for example in LightningUriEvent records. So for a HIPAA access audit, history tracking alone isn't enough, because reading a record isn't a change.

- Field history: up to 20 fields per object, about 18 months in the UI (24 via API)
- Field Audit Trail: up to 60 fields, retention up to 10 years
- Event Monitoring: views, reports, exports, API, logins
- Access audits need Event Monitoring

<sub>Also asked as: How do you audit changes vs views of patient records? · Field Audit Trail vs Event Monitoring, which one do I need for HIPAA? · Can field history show who looked at a patient record? · audit options for phi in salesforce</sub>

### Write Apex to create a patient as a person account and store the MRN in Health Cloud.
*Mid (3–6 yrs) · code* · `hcx-020`

I create the patient as an Account with a person account record type, and Salesforce turns it into a person account with its contact behind it. Say a registration portal sends new patients to Salesforce. I get the record type by developer name, never a hard-coded Id, set person fields like FirstName, LastName, PersonBirthdate and PersonEmail, and insert in bulk. Then I store the medical record number on the Identifier object with ParentRecordId pointing to the new account, because a patient can have several IDs from different systems. In a real build I'd check for an existing patient by MRN before inserting, and use user mode so the caller's permissions apply.

- Person account = Account with a person account record type
- Record type by developer name, no hard-coded Ids
- MRN goes on Identifier (ParentRecordId, IdValue)
- Bulk inserts, user mode, duplicate check first

```java
public with sharing class PatientOnboardingService {
    public class NewPatient {
        public String firstName; public String lastName;
        public Date birthDate; public String email; public String mrn;
    }

    public static List<Account> createPatients(List<NewPatient> inputs, String personRecordTypeDevName) {
        Id rtId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName()
            .get(personRecordTypeDevName).getRecordTypeId();
        List<Account> patients = new List<Account>();
        for (NewPatient p : inputs) {
            patients.add(new Account(RecordTypeId = rtId, FirstName = p.firstName,
                LastName = p.lastName, PersonBirthdate = p.birthDate, PersonEmail = p.email));
        }
        insert as user patients;

        List<Identifier> ids = new List<Identifier>();
        for (Integer i = 0; i < patients.size(); i++) {
            ids.add(new Identifier(ParentRecordId = patients[i].Id,
                IdValue = inputs[i].mrn,
                IdUsageType = 'Official'));   // confirm picklist API value; set IdTypeId if your org codes MRNs
        }
        insert as user ids;
        return patients;
    }
}
```

<sub>Also asked as: How do you insert a person account patient with Apex? · Create a Health Cloud patient and its medical record number in code. · Apex example for patient registration in Health Cloud. · insert person account apex identifier</sub>

### Write a query to get a patient's active conditions and allergies in Health Cloud.
*Fresher (0–2 yrs) · code* · `hcx-021`

I query HealthCondition and AllergyIntolerance by PatientId, which is the master-detail to the patient's account, and get the code name through the code lookup. Say a nurse opens a patient before a procedure and needs active problems and allergies on one card. For conditions I filter on ConditionStatus, and for allergies on Status. The code names come from CodeSetBundle through the ConditionCode and Code relationships. WITH USER_MODE makes sure the nurse's own field-level security and sharing apply, which matters for PHI. Picklist API values can differ from labels, so I check them in the org before hard-coding filters.

- Both objects link to the patient via PatientId (master-detail to Account)
- Code names via CodeSetBundle lookups
- WITH USER_MODE for PHI
- Verify picklist API values

```java
public with sharing class PatientSafetyController {
    @AuraEnabled(cacheable=true)
    public static Map<String, List<SObject>> getProblemsAndAllergies(Id patientId) {
        List<HealthCondition> conditions = [
            SELECT Id, ConditionCode.Name, ConditionStatus, DiagnosticStatus, OnsetStartDateTime
            FROM HealthCondition
            WHERE PatientId = :patientId AND ConditionStatus = 'Active'   // confirm API value
            WITH USER_MODE
            ORDER BY OnsetStartDateTime DESC
            LIMIT 100];
        List<AllergyIntolerance> allergies = [
            SELECT Id, Code.Name, Status, VerificationStatus, Severity, Category
            FROM AllergyIntolerance
            WHERE PatientId = :patientId AND Status = 'Active'
            WITH USER_MODE
            LIMIT 100];
        return new Map<String, List<SObject>>{
            'conditions' => conditions, 'allergies' => allergies };
    }
}
```

<sub>Also asked as: SOQL on HealthCondition and AllergyIntolerance for one patient. · How do you fetch problems and allergies for an LWC on the patient page? · Query active diagnoses and allergies by patient. · soql health condition allergy intolerance</sub>

### Write Apex to share a patient record with the assigned nurse in a Private sharing model.
*Senior (7–10 yrs) · code* · `hcx-022`

For a person account patient I share the Account, because the person's contact and master-detail clinical records like HealthCondition follow the account's access. Say each nurse should see the patients on her custom Assigned Nurse field. On a standard object like Account you can't create custom Apex sharing reasons, so I insert AccountShare rows, which get the Manual row cause, in bulk from the trigger handler. I give Read on the account and None on opportunities and cases unless the nurse needs them. The gotchas: manual shares are removed when the record owner changes, so I re-run the logic on owner change, and I delete the old share when the assigned nurse changes. Objects that aren't master-detail to the patient need their own sharing.

- Share the Account; master-detail children follow
- No custom Apex sharing reasons on standard objects: Manual row cause
- Manual shares drop on owner change: re-run logic
- Remove old shares when assignment changes

```java
// Runs in system context on purpose: the assigning user may not own the patient
public without sharing class PatientNurseSharing {
    public static void shareWithNurses(Map<Id, Id> nurseByPatient) {
        List<AccountShare> shares = new List<AccountShare>();
        for (Id patientId : nurseByPatient.keySet()) {
            shares.add(new AccountShare(
                AccountId = patientId,
                UserOrGroupId = nurseByPatient.get(patientId),
                AccountAccessLevel = 'Read',
                OpportunityAccessLevel = 'None',
                CaseAccessLevel = 'None'));
        }
        List<Database.SaveResult> results = Database.insert(shares, false);
        // log failures, e.g. inactive users, to an error object
    }
}
```

<sub>Also asked as: How do you share a person account with a user in Apex? · Apex sharing for Health Cloud patients, how? · Create AccountShare records for nurses assigned to patients. · apex managed sharing person account</sub>

### Write Apex to find who viewed a specific patient's record using Event Monitoring.
*Senior (7–10 yrs) · code* · `hcx-023`

With Shield or the Event Monitoring add-on, Real-Time Event Monitoring stores Lightning record views in LightningUriEvent, and I can query it. Say a privacy officer asks who opened a VIP patient's record in the last week. LightningUriEvent has EventDate, Username, RecordId and Operation, which is exactly what she needs, but its SOQL is restricted: you can filter only on EventDate and EventIdentifier, and ORDER BY only supports EventDate descending. So I filter by date in SOQL and match the RecordId in Apex. Event storage must be enabled for that event, and the user needs the View Real-Time Event Monitoring Data permission. This covers Lightning Experience views; API reads appear in ApiEvent and report runs in ReportEvent, so a full audit checks those too.

- LightningUriEvent: EventDate, Username, RecordId, Operation
- Filter only on EventDate or EventIdentifier; match RecordId in Apex
- Needs Shield or Event Monitoring + View Real-Time Event Monitoring Data
- Also check ApiEvent and ReportEvent

```java
public with sharing class PatientAccessAudit {
    public static List<LightningUriEvent> whoViewed(Id patientId, Datetime since) {
        List<LightningUriEvent> events = [
            SELECT EventDate, Username, RecordId, Operation, PageUrl
            FROM LightningUriEvent
            WHERE EventDate >= :since
            ORDER BY EventDate DESC
            LIMIT 10000];
        List<LightningUriEvent> views = new List<LightningUriEvent>();
        for (LightningUriEvent e : events) {
            if (e.RecordId == patientId) views.add(e);   // RecordId can't be filtered in SOQL
        }
        return views;
    }
}
```

<sub>Also asked as: How do you query LightningUriEvent for record views? · A privacy officer asks who opened a patient chart last week. How do you get it? · SOQL on real-time event monitoring for patient access audit. · lightning uri event query apex</sub>

### Write a scheduled Apex job that creates follow-up tasks for patients discharged yesterday.
*Mid (3–6 yrs) · code* · `hcx-024`

I find encounters that finished yesterday and create one follow-up task per patient for the patient's owner, usually the care coordinator. Say a hospital wants a call within 48 hours of every discharge. A scheduled job runs each morning, queries ClinicalEncounter for status Finished and an EndDate of yesterday, and inserts tasks due tomorrow. Before inserting, it checks for an open follow-up task so a rerun doesn't create duplicates. In a real build I'd also exclude dispositions like transfer to hospice using DischargeDispositionId, switch to Batch Apex if volumes are large, and if the EHR sends discharges in near real time, a record-triggered flow on the encounter is simpler than a nightly job.

- ClinicalEncounter: Status Finished + EndDate = YESTERDAY
- One task per patient, owned by the patient owner
- Skip patients with an open follow-up task
- Consider DischargeDispositionId exclusions and Batch Apex for volume

```java
public with sharing class DischargeFollowUpJob implements Schedulable {
    static final String SUBJECT = 'Post-discharge follow-up call';

    public void execute(SchedulableContext ctx) {
        Map<Id, Id> ownerByPatient = new Map<Id, Id>();
        for (ClinicalEncounter enc : [
                SELECT PatientId, Patient.OwnerId FROM ClinicalEncounter
                WHERE Status = 'Finished' AND EndDate = YESTERDAY]) {   // confirm API value
            ownerByPatient.put(enc.PatientId, enc.Patient.OwnerId);
        }
        for (Task t : [SELECT WhatId FROM Task
                       WHERE WhatId IN :ownerByPatient.keySet()
                       AND Subject = :SUBJECT AND IsClosed = false]) {
            ownerByPatient.remove(t.WhatId);
        }
        List<Task> tasks = new List<Task>();
        for (Id patientId : ownerByPatient.keySet()) {
            tasks.add(new Task(WhatId = patientId, OwnerId = ownerByPatient.get(patientId),
                Subject = SUBJECT, ActivityDate = Date.today().addDays(1), Priority = 'High'));
        }
        insert tasks;
    }
}
```

<sub>Also asked as: How do you query discharged encounters and create tasks in Apex? · Automate post-discharge follow-up calls with Apex. · Schedulable class on ClinicalEncounter example. · discharge follow up task apex</sub>

## Health Cloud Scenarios

### A clinic wants nurses to see only their own patients. How would you set it up?
*Fresher (0–2 yrs) · scenario* · `hcx-025`

I'd make patient records private and then open access only to the assigned nurse. Say a clinic has twelve nurses, each with a panel of patients. Step one, set the Account org-wide default to Private; person accounts already require Contact to be controlled by parent, so the contact side follows. Step two, define what 'own patient' means: the nurse owns the patient record, or there's an assigned nurse field or a care team membership. If the nurse is the owner, Private is enough. If not, automation shares the record with the nurse when she's assigned and removes it when she isn't. Step three, clinical records with a master-detail to the patient follow automatically, but any object with its own sharing needs the same treatment. Step four, make sure nurse permission sets don't have View All, and test by logging in as two different nurses.

- Account OWD Private
- Define ownership or assignment, share via automation
- Master-detail clinical records follow the patient
- No View All in nurse permission sets; test with login as

<sub>Also asked as: Nurses should not see patients assigned to other nurses. What do you do? · How do you restrict patient visibility to the assigned nurse? · Each nurse has a panel of patients and should only see those. How? · nurse sees only own patients health cloud</sub>

### A hospital sends referrals that must automatically create the patient and start a care plan. How would you design it?
*Mid (3–6 yrs) · scenario* · `hcx-026`

I'd break it into intake, patient matching, acceptance, then the care plan. Say a hospital refers a heart failure patient to a cardiology practice. First, intake: if the referral arrives over FHIR or HL7, MuleSoft maps it to a ClinicalServiceRequest; if it comes by fax, Intelligent Document Automation extracts it from a Received Document. Second, matching: search the Identifier for the MRN, then name plus date of birth; if there's no match, create a person account, and if the match is weak, send it to a review queue rather than guess. Third, an intake coordinator accepts the referral using the IsAccepted field on the Clinical Service Request. Fourth, a flow assigns a care manager and creates a task, and the care manager uses New Care Plan with the heart failure template. I keep that last step human because the plan needs clinical judgement, while everything before it is automated.

- Intake: FHIR/HL7 via MuleSoft or fax via Intelligent Document Automation
- Match on Identifier (MRN), then demographics; weak matches to review
- Accept referral (IsAccepted on ClinicalServiceRequest)
- Assign care manager; care plan from template

<sub>Also asked as: Referral from a hospital must create a patient and a care plan. Walk me through it. · How would you automate referral intake to care plan in Health Cloud? · Inbound referral should create the patient if new and kick off care management. Design it. · referral to patient and care plan automation</sub>

### You need to sync allergies from the EHR into Health Cloud. How would you do it?
*Mid (3–6 yrs) · scenario* · `hcx-027`

I'd sync them one way, with the EHR as the source of truth, into the standard AllergyIntolerance object. Say a clinic uses Epic and nurses want allergies in the patient 360. Step one, pull the FHIR AllergyIntolerance resource through MuleSoft, for example MuleSoft Direct for Health Cloud or the healthcare accelerator templates. Step two, map the fields: patient to PatientId by finding the account through its Identifier, code to the CodeSetBundle lookup, clinical status to Status, verification status to VerificationStatus, plus severity and category. Step three, use SourceSystemIdentifier as the matching key so repeated messages update the same record instead of duplicating it. Step four, when the EHR marks an allergy entered in error, update the status rather than delete, so the history is clear. Finally, make the object read-only for clinicians in Salesforce, log failures, and alert someone when patient matching fails.

- One-way sync, EHR is source of truth
- FHIR AllergyIntolerance -> AllergyIntolerance object via MuleSoft
- Map Status, VerificationStatus, code to CodeSetBundle
- Match on SourceSystemIdentifier; never hard delete
- Read-only in Salesforce, error logging

<sub>Also asked as: How would you bring allergy data from Epic into Salesforce? · Design an integration for AllergyIntolerance from the EHR. · The nurses want EHR allergies visible in the patient 360. Steps? · sync allergies ehr fhir health cloud</sub>

### Patients want to book appointments themselves from the clinic portal. How would you build it?
*Fresher (0–2 yrs) · scenario* · `hcx-028`

I'd use Intelligent Appointment Management's self-service scheduling on an Experience Cloud site. Say a family clinic wants patients to book checkups and flu shots online. Steps: add the self-service appointment capability to the site; it runs on OmniStudio, so OmniStudio must be set up there. Connect it to the back-end scheduling system, which could be Salesforce Scheduler or the EHR's schedule. Add filter fields like provider language or gender so patients find the right provider. Set up confirmation emails for booked and cancelled appointments, and place the self-scheduling and cancel components on the pages. Then customize the healthCloudIAM OmniScripts if the clinic wants extra steps, like a reason for the visit. On security, guest users must never see other patients' data, so I decide early whether booking needs a login or is open to guests.

- Intelligent Appointment Management self-service on Experience Cloud
- Requires OmniStudio; back end can be Scheduler or the EHR
- Filters, confirmation emails, cancel flow
- Customize healthCloudIAM OmniScripts; guard guest access

<sub>Also asked as: Patients book appointments from a portal. How do you set that up in Health Cloud? · How do you enable self-scheduling for patients? · Online appointment booking for patients on Experience Cloud, steps? · patient self scheduling portal health cloud</sub>

### Security wants an alert or a block when someone exports a large patient report or mass-extracts patient data. What would you do?
*Senior (7–10 yrs) · scenario* · `hcx-029`

I'd use Shield Event Monitoring with Transaction Security policies, which act on events in real time. Say a billing user tries to export a report with thousands of patient rows. Step one, turn on the relevant real-time events, mainly ReportEvent, ListViewEvent and ApiEvent. Step two, create a Transaction Security policy on ReportEvent with a condition on the number of rows and the objects the report touches, then pick the action: block it, require multi-factor authentication, or notify the security team. Step three, a similar policy on API events catches mass extraction through tools or integrations. The gotcha: page views in LightningUriEvent can't drive Transaction Security, so for 'someone opened a VIP chart' I query or stream those events and alert separately. I'd tune thresholds with the privacy officer and test in a sandbox, because a policy that's too strict blocks real work.

- Transaction Security policies on ReportEvent, ListViewEvent, ApiEvent
- Actions: block, MFA, notify
- LightningUriEvent cannot drive policies: query or stream it
- Tune thresholds with compliance, test first

<sub>Also asked as: How do you stop users from exporting patient data in bulk? · Use Transaction Security to protect PHI, how? · Compliance wants real-time alerts on data exfiltration in Health Cloud. · transaction security policy report export</sub>

### Design a prior authorization approval flow where simple requests are auto-approved, nurses review the rest, and only physicians can deny.
*Senior (7–10 yrs) · scenario* · `hcx-030`

I'd build a tiered review on the Care Request, with the rules kept outside code so the clinical team can change them. Say a provider requests an MRI for a member. Step one, the request lands as a Care Request with Care Request Items for the services and Care Diagnosis records, plus a case for SLA tracking. Step two, check eligibility against the member plan and coverage benefits; if the member isn't covered, route it to a specific queue. Step three, auto-approval rules, for example a decision table on service code, diagnosis and place of service; if every item matches, approve and notify the provider. Step four, everything else goes through Omni-Channel to a nurse reviewer queue, tracked on Care Request Reviewer records. Nurses can approve, but a likely denial escalates to a physician reviewer, because adverse decisions usually need one. Milestones warn before turnaround deadlines, and every decision is logged for appeals.

- Care Request + Care Request Items + Care Diagnosis + case for SLA
- Eligibility from member plan and coverage benefits
- Auto-approve via configurable rules (e.g. decision table)
- Nurse review, physician for denials, Care Request Reviewer
- Milestones for turnaround, audit for appeals

<sub>Also asked as: Prior authorization approval flow in Health Cloud, how would you build it? · How do you route prior auth requests to nurse and physician reviewers? · Auto-approve some authorization requests and escalate others. Design it. · utilization management review tiers</sub>

### Front desk staff should see patient demographics and appointments but not diagnoses or medications. How would you do it?
*Fresher (0–2 yrs) · scenario* · `hcx-031`

I'd control it with object and field permissions, not just page layouts. Say the front desk at a clinic checks people in and books visits. Their permission set gives access to the patient account fields they need, like name, address, phone and insurance, plus appointments, but no object access to clinical objects like HealthCondition, MedicationStatement, AllergyIntolerance and CareObservation. Sensitive fields on the account itself, like a behavioral health flag, get field-level security hidden for them. Then the patient page uses component visibility or Dynamic Forms so they don't see empty clinical sections. Hiding a component alone isn't security, because data can still show in reports, search or list views if permissions allow it. I test by logging in as a front desk user and trying to run a report on conditions to confirm nothing comes back.

- No object access to clinical objects for front desk
- Field-level security on sensitive account fields
- Component visibility for a clean page, not as security
- Test reports, search and list views as the user

<sub>Also asked as: Hide clinical data from non-clinical users in Health Cloud. · Receptionists must not see diagnoses. What do you configure? · How do you separate clinical and non-clinical access to a patient record? · front desk no access to clinical data</sub>

### Duplicate patients keep getting created from the EHR feed and the portal. How would you fix and prevent it?
*Mid (3–6 yrs) · scenario* · `hcx-032`

I'd fix the matching logic first, then clean up what's already there. Say a patient registers on the portal as Bob Smith and the EHR later sends Robert Smith with an MRN, and now there are two records. Prevention: the EHR integration matches on the Identifier holding the MRN and its issuing facility before anything else, and clinical records match on SourceSystemIdentifier. Portal registration looks for an existing person account by date of birth plus name or email and links to it instead of creating a new one. Duplicate and matching rules on person accounts catch manual entry. If the organization has an enterprise master patient index, that should be the single source of patient identity. Cleanup: run a duplicate report and merge person accounts after a clinical check, since merging moves related records to the surviving account. Then watch a weekly duplicate report so it doesn't creep back.

- Match on Identifier (MRN + issuing authority) first
- Portal registration links to existing patients
- Duplicate and matching rules for manual entry
- EMPI as identity source if available
- Merge carefully, monitor weekly

<sub>Also asked as: How do you handle duplicate patient records in Health Cloud? · Patient matching keeps failing and creating duplicates. What would you do? · Two records for the same patient, one from EHR and one from portal. Fix it. · duplicate person accounts health cloud</sub>

### A hospital wants a follow-up call within 48 hours after every discharge. How would you set it up?
*Fresher (0–2 yrs) · scenario* · `hcx-033`

I'd trigger a follow-up task from the encounter that marks the discharge. Say a patient goes home after pneumonia on Monday. The EHR sends the discharge, and the ClinicalEncounter in Health Cloud updates to Finished with an end date and a discharge disposition. A record-triggered flow on ClinicalEncounter fires when the status changes to Finished, checks the disposition to skip cases like death or transfer to another hospital, and creates a task for the patient's care coordinator due within two days. If the task is still open after a day, an escalation alerts the team lead. The call itself can follow a short OmniScript covering medications, symptoms and whether a follow-up visit is booked. Finally, a report shows the percentage of discharges called within 48 hours, which is what the hospital will measure.

- ClinicalEncounter status Finished + EndDate from the EHR
- Record-triggered flow creates a coordinator task
- Use DischargeDispositionId to skip exclusions
- Escalate, script the call, report on 48-hour rate

<sub>Also asked as: Discharge follow-up: how do you make sure every patient gets a call? · Automate post-discharge outreach in Health Cloud. · What happens in Health Cloud when a patient is discharged? · transition of care follow up call</sub>

### Patients send blood pressure readings from home devices. The care coordinator must be alerted when a reading is too high. How would you build it?
*Mid (3–6 yrs) · scenario* · `hcx-034`

I'd store readings as CareObservation records and alert only on out-of-range values, without flooding the coordinator. Say a hypertension program has hundreds of patients each sending two readings a day. Step one, the device platform sends data through an integration; for large volumes I might keep raw readings in Data 360 and bring only abnormal or summary readings into core Health Cloud. Step two, thresholds: a program default, plus a patient-specific target from the care plan goal. Step three, evaluate asynchronously, in the integration layer or an async path of a record-triggered flow, so loading isn't slowed down. Step four, for a high reading, create one task or custom notification for the coordinator, but only if there's no open alert for that patient already. Step five, show the trend on the timeline or a FlexCard chart so the coordinator sees context, not one number.

- Readings as CareObservation; Data 360 for raw high volume
- Default and patient-specific thresholds
- Evaluate asynchronously
- One open alert per patient, no alert storms
- Show trends for context

<sub>Also asked as: Remote patient monitoring alerts in Health Cloud, how? · Alert the care team when a vital sign is out of range. · How do you handle device readings and thresholds in Health Cloud? · rpm blood pressure alert care observation</sub>

### A health plan wants to find diabetic members who missed their annual eye exam and get them scheduled. How would you do it?
*Mid (3–6 yrs) · scenario* · `hcx-035`

That's a care gap use case. Say a payer has thousands of members with diabetes. Step one, define a ClinicalMeasure: members with an active diabetes condition and no eye exam in the last twelve months. Step two, find the gaps: for an individual member, a care manager evaluates the measure from the care gap FlexCard; for the whole population, gaps are usually calculated in the payer's quality or analytics system and imported as CareGap records. Step three, outreach: a list view or segment of members with open gaps feeds calls, texts, or an agent that offers in-network eye doctors and open slots. Step four, when the claim or encounter for the exam arrives, re-evaluating the measure closes the gap. Reporting on open versus closed gaps by provider group shows whether the campaign worked.

- ClinicalMeasure defines the rule
- Evaluate per member, or import population gaps as CareGap
- Outreach from open gaps
- Re-evaluate to close; report by provider group

<sub>Also asked as: How would you run a care gap closure campaign in Health Cloud? · Find members missing preventive screenings and reach out. · Payer wants to close quality gaps for diabetic members. Steps? · care gap outreach payer diabetes</sub>

### A care coordinator wants a depression screening questionnaire at onboarding, with a score she can see. How would you set it up?
*Fresher (0–2 yrs) · scenario* · `hcx-036`

I'd build it as a Health Cloud assessment with Discovery Framework. Say a primary care clinic screens every new patient with a nine-question depression form. Steps: create the assessment questions with their answer options in the OmniStudio app, group them in a question set, and click Build OmniScript to generate the assessment. In the OmniScript I add a calculation step that totals the score and shows the result. Then I activate it and put it on the patient page with the assessments component, and on the portal if patients should fill it in before the visit. Responses are saved in Discovery Framework objects, so scores are reportable. For a high score, I map the responses to a care plan recommendation, so a depression problem and goal are suggested. I'd also confirm with the clinic that they're allowed to use the standard questionnaire's wording.

- Questions + question set in OmniStudio, then Build OmniScript
- Calculation step for the score
- Place on patient page and portal
- Map high scores to care plan recommendations

<sub>Also asked as: Build a PHQ-9 style screening in Health Cloud. · How do you create a scored questionnaire for patients? · Care team wants a screening form with an automatic score. What do you build? · depression screening assessment health cloud</sub>

### A patient withdraws consent to share her data with a program partner. What happens in Health Cloud?
*Senior (7–10 yrs) · scenario* · `hcx-037`

I treat withdrawal as a recorded event plus enforced behavior, not just a checkbox. Say a patient in a remote monitoring program tells the nurse she no longer wants her data shared with the partner analytics company. Step one, record it: update her Authorization Form Consent for that form, or add a new consent record showing the withdrawal and date, so the history stays intact. Step two, enforce it: integrations and Data 360 activations that send data for that Data Use Purpose check consent status before sending, and stop. Step three, program status: end the enrollment if the program depends on that consent. Step four, communications: if she also opts out of messages, update ContactPointTypeConsent so outreach tools stop. Step five, notify partners who already received data, as the agreement requires. Then I test that a withdrawn consent actually blocks the data feed.

- Record withdrawal on Authorization Form Consent, keep history
- Integrations and activations check consent before sending
- End dependent program enrollment
- Update ContactPointTypeConsent for communications
- Prove it with a test

<sub>Also asked as: How do you handle consent revocation in Health Cloud? · Patient revokes consent. What must change in the system? · How do you enforce a withdrawn consent across integrations? · consent withdrawal health cloud</sub>

### A patient's daughter is her caregiver and needs portal access to her mother's care plan and appointments. How would you handle it?
*Mid (3–6 yrs) · scenario* · `hcx-038`

I'd model the daughter as her own person account, link her as caregiver, get the mother's authorization, and then grant access explicitly. Say an elderly patient with dementia relies on her daughter. Steps: create the daughter as a person account and link the two with a contact-to-contact relationship using a caregiver role, so it shows in the relationship map. Record the mother's, or her legal representative's, authorization through consent management. Give the daughter an Experience Cloud user. Then access: sharing sets work on the user's own account, so they don't cover a proxy. High-volume Customer Community users also can't receive manual or Apex shares, so I'd use a license that supports sharing, like Customer Community Plus, plus automation that shares the mother's records while the authorization is active and removes them when it ends. On the portal I show only patient-friendly fields.

- Caregiver as person account + contact-to-contact relationship
- Capture authorization via consent management
- Sharing sets cover own account only
- Customer Community Plus + automated sharing tied to authorization

<sub>Also asked as: Caregiver or proxy access to a patient portal, how? · How do you let a family member see a patient record on Experience Cloud? · Daughter needs to manage her mother's appointments online. Design it. · proxy access caregiver portal health cloud</sub>

### A home health agency wants to schedule nurse visits to patients' homes based on skills and location. How would you implement it?
*Mid (3–6 yrs) · scenario* · `hcx-039`

I'd use Health Cloud Home Health, which is built on Field Service. Say a patient leaves hospital needing wound care three times a week for a month. Step one, the order comes in as a ClinicalServiceRequest. Step two, a CareServiceVisitPlan links that request to a maintenance plan that generates the series of visits, and each visit is a ServiceAppointment linked through CareServiceVisit. Step three, scheduling: nurses are service resources with skills like wound care, in service territories, and scheduling finds the nearest qualified nurse. Patient preferences, like a preferred nurse or time of day, go in AccountServicePreference and PartySchedulePreference. If nobody is assigned, schedule broadcasts can offer the visit to resources in the territory. Step four, nurses document the visit and medications in the Field Service mobile app. I'd confirm Field Service licenses early, since it's a hard dependency.

- Built on Field Service data model
- ClinicalServiceRequest -> CareServiceVisitPlan -> ServiceAppointments via CareServiceVisit
- Skills, territories, patient preferences
- Schedule broadcasts; mobile documentation

<sub>Also asked as: Home health scheduling in Health Cloud, how does it work? · How do you plan recurring home visits for a patient? · Use Field Service with Health Cloud for home care. Walk me through it. · home health visits field service health cloud</sub>

### A care coordinator wants every new diabetes patient to start from a standard care plan. How do you set that up?
*Fresher (0–2 yrs) · scenario* · `hcx-040`

I'd build a diabetes care plan template from the PGI library and let coordinators apply it. Say a clinic wants every diabetic patient to have the same baseline plan. Steps: enable Integrated Care Management, check field-level security since many of its fields are off by default, and add the care plan FlexCard to the patient page. Create a ProblemDefinition for type 2 diabetes, goal definitions like 'HbA1c below target' and 'checks feet daily', and action plan templates for interventions such as a dietitian referral and a monthly nurse call. Link goals to the problem, then build a CarePlanTemplate that arranges them. When a new diabetic patient comes in, the coordinator clicks New Care Plan, picks the template and adjusts it for that person, and the interventions become tasks for the team. The payoff is consistency and easy reporting across all diabetes plans.

- Enable ICM, fix field-level security, add FlexCard
- ProblemDefinition, GoalDefinition, action plan templates
- CarePlanTemplate arranges them
- Coordinator applies and adjusts per patient

<sub>Also asked as: How do you create a care plan template in Health Cloud? · Standardize care plans for one condition, steps? · Set up a diabetes care plan template with goals and tasks. · care plan template setup</sub>

### An older Health Cloud org uses the managed-package EHR objects. The client wants to move to the clinical data model. How would you plan it?
*Senior (7–10 yrs) · scenario* · `hcx-041`

I'd run it as a data migration with a parallel period, not a big-bang switch. Say a clinic has years of conditions and medications in the older EHR custom objects from the package. Step one, inventory: which objects and fields are used, and which flows, Apex, reports, timeline settings and integrations touch them. Step two, mapping: old condition records to HealthCondition, medications to MedicationStatement, and so on, with codes loaded into CodeSet and CodeSetBundle first, since the new objects need code lookups. Step three, change the integration to write to the new objects, and migrate history with the Bulk API, keeping the source ID in SourceSystemIdentifier. Step four, rebuild pages, Enhanced Timeline definitions, reports and sharing. Step five, run both in parallel, reconcile counts per patient, then retire the old objects. Clinician sign-off on sample patients is my go-live gate.

- Inventory every dependency first
- Map to standard objects; load code sets first
- Bulk API with SourceSystemIdentifier
- Rebuild pages, timeline, reports, sharing
- Parallel run, reconcile, clinician sign-off

<sub>Also asked as: Migrate from HealthCloudGA EHR objects to standard clinical objects, how? · How do you move legacy Health Cloud clinical data to the FHIR-aligned model? · Plan a data model migration in Health Cloud. · ehr objects to clinical data model migration</sub>

### A member calls the health plan asking whether her MRI is covered. How does the agent answer it in Health Cloud?
*Fresher (0–2 yrs) · scenario* · `hcx-042`

The agent opens the member's record and checks her coverage before anything else. Say Maria calls the payer's contact center about a knee MRI her doctor ordered. The agent verifies her identity, then looks at her MemberPlan to confirm the plan is active and which purchaser plan she's on. Under it, CoverageBenefit and CoverageBenefitItem records show what's covered, like advanced imaging, and the cost sharing, like copay or deductible. If the payer requires prior authorization for MRIs, the agent can see whether a Care Request already exists and its status, or explain that her doctor needs to submit one. The call is logged as a case. A good improvement is an OmniScript or an Agentforce benefits action that summarizes all of this, so the agent isn't clicking through related lists while Maria waits.

- Verify identity, then MemberPlan
- CoverageBenefit and CoverageBenefitItem show coverage and cost sharing
- Check for an existing Care Request (prior auth)
- Log a case; summarize with OmniScript or an agent action

<sub>Also asked as: Benefits verification for a member call, which records does the agent check? · How does a payer contact center check coverage in Health Cloud? · Member asks if a service needs prior authorization. What does the agent look at? · member benefits coverage check health cloud</sub>

### A health system has three hospitals in one org. Staff should see only their hospital's patients, but shared specialists see all. How would you design sharing?
*Senior (7–10 yrs) · scenario* · `hcx-043`

I'd use a Private model with sharing rules based on the patient's hospital, plus a group for the cross-hospital specialists. Say hospitals North, South and East share one org. Step one, give each patient a primary facility value, set by the integration from EHR registration. Step two, create public groups per hospital and criteria-based sharing rules on Account: facility North shares with the North group, and so on. Step three, the specialists' group gets access to all three. Step four, a patient treated at two hospitals needs access from both, so for those I'd keep a facility-relationship record per hospital and create shares through Apex. Step five, master-detail clinical records follow the account; others need their own rules. I'd load test it, because sharing recalculation over millions of patients takes time, and get compliance to confirm the specialists' broad access is justified.

- Private OWD + facility field
- Criteria-based sharing rules to per-hospital groups
- Specialists group shared across all
- Multi-facility patients via Apex shares
- Plan for recalculation time; compliance sign-off

<sub>Also asked as: Multi-hospital data segregation in one Health Cloud org, how? · How do you separate patient access by facility? · Design sharing for several facilities with some cross-facility users. · sharing by facility health cloud</sub>

### A care coordinator needs to refer a patient to an in-network cardiologist nearby who speaks Spanish. How would that work?
*Fresher (0–2 yrs) · scenario* · `hcx-044`

She'd use Provider Search to find the specialist and then create the referral from there. Say a Spanish-speaking patient needs a cardiology consult. In Provider Search, the coordinator filters on specialty, distance from the patient's address and network. Language isn't there by default, so an admin adds a languages field to the searchable provider object and maps it in the provider sync. The results show practitioners and their facilities. She picks one, and the Create Referral flow captures the patient, the referring provider, the specialist and the facility, which creates the referral as a Clinical Service Request. The specialist's office then schedules the visit, and the referral status is tracked until it's complete. If a cardiologist who joined last week doesn't appear, the first thing I check is the provider sync log.

- Provider Search filters: specialty, distance, network
- Custom searchable fields (e.g. language) mapped in provider sync
- Create Referral flow -> Clinical Service Request
- Missing providers: check sync logs

<sub>Also asked as: Find a specialist and create a referral in Health Cloud, how? · How do you add language as a filter in Provider Search? · Provider search and referral for a patient, walk me through it. · provider search referral spanish speaking doctor</sub>

### A clinic wants an Agentforce agent on its patient portal that can reschedule appointments. How would you design it safely?
*Senior (7–10 yrs) · scenario* · `hcx-045`

I'd keep the agent narrow, grounded and verified. Say patients ask 'Can I move my Thursday appointment?' late at night. Step one, authentication: the agent runs for logged-in portal users, or verifies identity before it touches any patient data. Step two, in Agentforce Builder, create one scheduling topic, now often called a subagent, with clear instructions: only reschedule or cancel, never give medical advice, hand off anything clinical. Step three, actions: reuse the same flows or Apex the scheduling process already uses to list the patient's upcoming appointments, find open slots and rebook, so business rules live in one place. Step four, guardrails: the Einstein Trust Layer, actions that read only the current patient's records, and confirming the BAA covers the AI services. Step five, escalation to a human through Omni-Channel. I test with many sample conversations, including risky ones like 'I have chest pain'.

- Authenticate or verify identity first
- One narrow topic (subagent) with strict instructions
- Reuse existing scheduling flows/Apex as actions
- Trust Layer, record-scoped actions, BAA check
- Human handoff; test edge cases

<sub>Also asked as: Design an AI agent for patient scheduling in Health Cloud. · How do you build an Agentforce agent that handles PHI safely? · Patients should reschedule through a chatbot. What guardrails do you add? · agentforce patient portal appointment agent</sub>

### Developers need realistic test data, but a full sandbox would copy real patient data. What would you do?
*Senior (7–10 yrs) · scenario* · `hcx-046`

Real PHI shouldn't sit in sandboxes where developers and vendors work, so I'd mask it or use synthetic data. Say a health system refreshes a full sandbox for user testing. Step one, run Data Mask & Seed (formerly Data Mask) right after the refresh to mask or replace names, birth dates, identifiers and clinical free text before anyone else gets access. Step two, developer sandboxes copy no production data anyway, so I seed them with synthetic patients that have realistic conditions and codes, for example generated with a tool like Synthea and loaded through the same integration. Step three, during the refresh window, lock down access, set email deliverability to system email only so no patient gets a test message, and point integrations to test endpoints, not the real EHR. Step four, document all of this, because auditors will ask how PHI is protected outside production.

- Mask full/partial copies immediately (Data Mask & Seed)
- Synthetic patients for developer sandboxes
- Lock access, email deliverability, integration endpoints
- Document for compliance

<sub>Also asked as: How do you handle PHI in sandboxes? · Sandbox refresh for a Health Cloud org with patient data, what precautions? · How do you give developers test data without exposing PHI? · data masking sandbox health cloud</sub>

### A portal patient reports she can see another patient's appointment. What do you do?
*Senior (7–10 yrs) · scenario* · `hcx-047`

I treat it as a possible privacy breach first and a bug second. Say a patient emails the clinic a screenshot of someone else's upcoming visit. Step one, contain: involve the privacy officer, and if the cause isn't obvious, disable the affected component or page right away. Step two, find the cause, usually one of a few: a sharing set mapping the wrong field, like a household account instead of the patient's own account; external org-wide defaults set to Public Read; a guest user with record access; or Apex behind an LWC running without sharing or without user mode. Step three, fix it and test with two test patient users side by side. Step four, use Event Monitoring data to see who viewed what during the exposure window, because compliance needs that to decide whether breach notification is required. Step five, add a regression test so it can't come back.

- Contain first, involve privacy officer
- Check sharing sets, external OWD, guest access, Apex without sharing
- Fix and test with two patient users
- Event Monitoring for breach assessment; regression test

<sub>Also asked as: A patient sees someone else's data on the Experience Cloud site. How do you respond? · Data leak on the patient portal, how would you troubleshoot it? · What usually causes portal users to see other users' records? · patient portal privacy breach troubleshooting</sub>

### A payer wants to onboard new providers into its network with credentialing checks. How would you design it in Health Cloud?
*Senior (7–10 yrs) · scenario* · `hcx-048`

I'd use Provider Relationship and Network Management, with onboarding as a guided application and credentialing as a tracked review. Say a new orthopedic group wants to join a health plan's network. Step one, the group applies through a provider portal using an OmniScript that captures practitioners, NPIs, specialties, licenses, board certifications and locations. Step two, that creates or updates the provider data model: HealthcareProvider, HealthcareProviderNpi, HealthcareProviderSpecialty, BoardCertification, and HealthcarePractitionerFacility for each location. Step three, credentialing checks run through integrations with primary sources, like license boards and sanction lists, with tasks for anything that needs manual review. Step four, a credentialing committee approves, and contracting follows. Step five, once active, the provider appears in Provider Search and the directory. I'd also schedule recredentialing reminders and track how long each application takes.

- Guided application on a provider portal (OmniScript)
- Provider data model: HealthcareProvider, NPI, specialty, certification, facility links
- Primary source verification via integration + manual tasks
- Committee approval, contracting, directory, recredentialing

<sub>Also asked as: Provider onboarding and credentialing in Health Cloud, how? · Design provider network management for a health plan. · How do you handle provider applications and recredentialing? · provider credentialing health cloud</sub>

### A care manager wants to know as soon as one of her patients is admitted through the emergency department. How would you build it?
*Mid (3–6 yrs) · scenario* · `hcx-049`

I'd use the hospital's admission feed to create or update an encounter, and notify the care team from that. Say a care manager follows a few hundred high-risk patients across a region. Step one, the hospital or a health information exchange sends admit notifications, often HL7 v2 ADT messages or FHIR Encounter updates. MuleSoft translates them and upserts a ClinicalEncounter for the right patient, matched through the Identifier. Step two, a record-triggered flow on ClinicalEncounter checks that the admission source is the emergency department and the patient has an active care plan, then sends a custom notification and creates a task for her. Step three, it skips repeat messages for the same encounter, so she isn't spammed. Step four, she calls the hospital or the patient, and the outreach is recorded. I'd measure time from admission to notification, because the whole value is speed.

- ADT or FHIR Encounter via MuleSoft -> ClinicalEncounter
- Match patient through Identifier
- Flow checks AdmissionSource + active care plan, notifies
- De-duplicate messages; measure speed

<sub>Also asked as: ADT notifications into Health Cloud, how do you alert the care team? · Notify care managers when a patient goes to the ER. · How would you use HL7 ADT messages in Health Cloud? · er admission alert care manager</sub>

### Nurses want to review a patient's medication list at discharge and mark each medication as reviewed. How would you build it?
*Mid (3–6 yrs) · scenario* · `hcx-050`

I'd show the EHR's medication list in Health Cloud and record the review separately, without changing the EHR's data. Say a nurse is preparing a heart failure patient to go home. Medications come from the EHR as MedicationStatement records with a Status like Active, Stopped or On-hold, plus start and end dates. A FlexCard or LWC lists the active ones for that patient. For the review, I store who reviewed what and when on a Salesforce-owned record, like a custom review object or a task, because the next sync would overwrite fields edited on the synced records. If the nurse finds a real change, like a medication that should be stopped, that goes back to the EHR, which stays the source of truth. A report then shows discharges without a completed medication review.

- MedicationStatement from the EHR (Status, StartDateTime, EndDateTime)
- Review stored on a Salesforce-owned record
- Don't edit synced fields; changes go back to the EHR
- Report on missing reviews

<sub>Also asked as: Medication reconciliation in Health Cloud, how? · How do you show EHR medications and track a nurse review? · Build a med review step at discharge. · medication statement review health cloud</sub>

### A health system wants one patient profile combining EHR data, claims and wearable data to target outreach. How would you approach it?
*Senior (7–10 yrs) · scenario* · `hcx-051`

I'd use Data 360 for Health to unify the data, and keep core Health Cloud for the daily care work. Say a health system wants patients with rising blood pressure who haven't had a visit in a year. Step one, ingest: bulk EHR data, claims files and device data land in Data 360 as data streams and get mapped to its healthcare data model objects. Step two, identity resolution: match rules on MRN, member ID, name, date of birth and email build one unified profile per person. Step three, calculated insights: last visit date, average blood pressure, open care gaps. Step four, segments and activation: build the segment and send it to the care team's call list or an outreach journey, respecting consent. Step five, surface key insights on the patient page so care managers see the full picture without copying millions of rows into core. I'd check the BAA covers each piece and limit who can build segments on PHI.

- Data streams for EHR, claims, devices
- Identity resolution into a unified profile
- Calculated insights and segments
- Activate with consent; surface insights on the patient page
- BAA coverage, limit segment builders

<sub>Also asked as: How would you use Data 360 with Health Cloud? · Unify patient data from many sources for segmentation. · Build a unified patient profile for population outreach. · data 360 for health unified profile</sub>

### A care coordinator wants to record that a patient has no transport to appointments and do something about it. How would you set it up?
*Fresher (0–2 yrs) · scenario* · `hcx-052`

I'd capture it as a social determinant of health and turn it into an action on the care plan. Say a diabetic patient keeps missing visits because she has no car. Health Cloud has objects for this: CareDeterminantType holds the standard list, grouped into domains like transportation, food and housing, and the care barrier objects record that this specific patient has the barrier. In practice the coordinator finds it through an assessment question like 'Do you have reliable transport to appointments?', and the answer records a transportation barrier. The care plan then gets an intervention, like arranging a ride service or moving some visits to telehealth. The care plan FlexCard shows social determinants next to clinical problems, so the whole team sees them. Reporting across patients shows how many have transport barriers, which helps the clinic justify a ride program.

- CareDeterminantType: standard determinants by domain
- Care barrier objects record the patient-specific barrier
- Found via assessment; addressed by interventions
- Visible on the care plan FlexCard; reportable

<sub>Also asked as: How are social determinants of health captured in Health Cloud? · Track SDOH barriers like housing or food insecurity. · Patient keeps missing visits because of transport. How does Health Cloud help? · sdoh care barrier health cloud</sub>

### A clinic gets hundreds of faxed referrals a week and staff retype them. How would you automate it?
*Fresher (0–2 yrs) · scenario* · `hcx-053`

I'd use Intelligent Document Automation to turn faxes into referrals, with a person checking the result. Say a specialty clinic receives referral faxes from family doctors. Inbound faxes and emails land as Received Document records. I create two queues, one for new documents and one for processed ones. A record-triggered flow puts new documents in the first queue. A second flow, triggered when the document's OCR status shows the text is extracted, moves it to the processed queue and calls the Process Received Document action, on a Run Asynchronously path so a failure doesn't break the save. That action reads the patient details and the requested service and creates a Clinical Service Request. Intake staff then review it, fix anything misread, and accept the referral using the IsAccepted field. The typing goes away, but the human check stays.

- Received Document holds the inbound fax and extracted text
- Queues + record-triggered flows on OcrStatus
- Process Received Document action creates a Clinical Service Request
- Run asynchronously; human review and IsAccepted

<sub>Also asked as: Automate fax referral intake in Health Cloud. · What is Intelligent Document Automation used for? · How do you turn incoming documents into referrals? · fax referral ocr health cloud</sub>

### A nurse care coordinator leaves the organization. What do you do with her patients and her work?
*Fresher (0–2 yrs) · scenario* · `hcx-054`

I'd freeze her user, move her work to the right people, then deactivate. Say a coordinator managing about 150 patients leaves on Friday. Step one, freeze the user so she can't log in, without breaking ownership yet. Step two, reassign the patient records she owns, her care plans and her open tasks to the replacement coordinator or the team lead, using mass transfer or Data Loader. Step three, update care teams so she's removed and the new coordinator is added, because colleagues and portal patients look at the care team to know who to contact. Step four, check sharing: manual shares are dropped when the owner changes, so any access that depended on ownership must be recreated, and shares granted to her should be removed. Step five, check flows, queues and assignment rules that mention her, then deactivate. A report on open tasks by owner confirms nothing was left behind.

- Freeze first, deactivate last
- Transfer patients, care plans, open tasks
- Update care team membership
- Recreate sharing lost on owner change; fix automation references

<sub>Also asked as: A care team member resigns. How do you reassign patients and tasks? · Steps to offboard a clinical user in Health Cloud. · How do you hand over a coordinator's caseload? · user leaves reassign patients health cloud</sub>
