# Integration

75 questions. Levels: Fresher (0–2 yrs) 26 · Mid (3–6 yrs) 31 · Senior (7–10 yrs) 18

## Integration

### What is integration in Salesforce and what are the main types?
*Fresher (0–2 yrs) · concept* · `int-001`

Integration just means connecting Salesforce with other systems so data and processes stay in sync. I think of it in two directions. Outbound is when Salesforce calls an external system, using Apex callouts, outbound messages or events. Inbound is when an external system calls Salesforce, through the REST, SOAP, Bulk or Pub/Sub APIs, or a custom Apex REST service. Then by style there are three types. Data integration keeps records in sync, like customers matching between Salesforce and the ERP. Process integration is when a business process spans systems, like order to invoice: the order is closed in Salesforce, and the invoice gets raised in the finance system. And UI or virtualization integration is when we show external data inside Salesforce without copying it, for example showing ERP order history on the Account page with Salesforce Connect.

- Outbound: Salesforce calls out (Apex callout, outbound message, events)
- Inbound: external system calls Salesforce APIs or Apex REST/SOAP
- Types: data, process, and UI/virtualization integration

<sub>Also asked as: What do you mean by Salesforce integration? · Explain the different types of integration in Salesforce · how do you connect salesforce with other systems · What are inbound and outbound integrations?</sub>

### What is the difference between REST and SOAP?
*Fresher (0–2 yrs) · comparison* · `int-002`

REST is an architectural style. It uses standard HTTP methods like GET, POST, PATCH and DELETE on resources, and usually sends lightweight JSON, so it's simple and fast and works well for mobile and web apps. SOAP is a protocol with a strict XML envelope and a WSDL contract that defines every operation and data type. It's heavier but strongly typed, and some enterprise and legacy systems, like banks or older ERPs, still require it. In Salesforce, I consume SOAP by generating Apex classes from a WSDL, and I consume REST with HttpRequest. Say I'm connecting to a modern shipping API, that's REST, and I'll just send JSON. But if a bank's payment gateway only gives me a WSDL, I'll generate the classes and use SOAP. For new integrations I default to REST unless the other system only offers SOAP.

- REST: HTTP verbs, resources, JSON (or XML), lightweight
- SOAP: XML envelope, WSDL contract, strongly typed
- Salesforce consumes SOAP via WSDL2Apex, REST via HttpRequest
- Default to REST for new work

<sub>Also asked as: REST vs SOAP API, which one would you use? · Explain REST and SOAP web services · rest versus soap difference in salesforce · Why is REST preferred over SOAP nowadays?</sub>

### How do you make a REST callout from Apex?
*Fresher (0–2 yrs) · code* · `int-003`

I use three classes. HttpRequest holds the endpoint, method, headers, body and timeout. Http has the send method that actually makes the call. HttpResponse gives me the status code and body. For the endpoint I always use a Named Credential with the callout: prefix, so the URL and authentication aren't hard-coded and I don't need a Remote Site Setting. Say I'm fetching an exchange rate. I set the endpoint to callout:FX_API/rates?base=USD, method GET, and a timeout, because that API can be slow. After the call I check getStatusCode. If it's 200, I parse the JSON. If it's anything else, I throw a custom exception or log the error. The main thing is failures are never silent, otherwise you find out weeks later that rates haven't updated.

- HttpRequest = what to send; Http.send = sends it; HttpResponse = result
- Use callout:NamedCredential/path for endpoint and auth
- Always check getStatusCode() and handle errors
- Set a timeout explicitly when the API can be slow

```java
public with sharing class ErpClient {
    public class ErpException extends Exception {}

    public static HttpResponse getCustomer(String customerId) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:ERP_API/customers/' + EncodingUtil.urlEncode(customerId, 'UTF-8'));
        req.setMethod('GET');
        req.setHeader('Accept', 'application/json');
        req.setTimeout(20000); // ms, default is 10 s
        HttpResponse res = new Http().send(req);
        if (res.getStatusCode() != 200) {
            throw new ErpException('ERP error ' + res.getStatusCode() + ': ' + res.getBody());
        }
        return res;
    }
}
```

<sub>Also asked as: Write code for an HTTP callout in Apex · How do you call an external API from Salesforce? · explain HttpRequest Http and HttpResponse classes · Show me a GET callout using a named credential</sub>

### What are Remote Site Settings and when do you need them?
*Fresher (0–2 yrs) · concept* · `int-004`

Remote Site Settings is a whitelist of external URLs that Apex is allowed to call. If I make a callout to a URL that isn't registered there, I get an 'Unauthorized endpoint' error. I only need it when I put a raw URL in setEndpoint. If I use a Named Credential, the named credential itself authorizes the endpoint, so no Remote Site Setting is needed. That's one more reason I prefer named credentials. The URL and the authentication live in one place. For example, in the sandbox the named credential points to the vendor's test URL, and in production to the live URL. The Apex code is identical in both, and nobody has to edit code or add remote sites after a refresh.

- Whitelist of URLs Apex may call
- Missing entry gives 'Unauthorized endpoint' error
- Not required when the callout uses a Named Credential

<sub>Also asked as: Why do we need remote site settings for a callout? · What happens if you call an endpoint without a remote site setting? · remote site setting vs named credential · Do I need remote site settings if I use named credentials?</sub>

### What is a Named Credential and why should you use it?
*Fresher (0–2 yrs) · concept* · `int-005`

A Named Credential stores the endpoint URL of an external system together with how to authenticate to it. So in Apex I just write callout:My_Named_Credential/path, and Salesforce adds the authentication for me. The benefits: security, because secrets aren't in code or custom settings. Maintainability, because I can change the URL per environment without a deployment. And less code, because Salesforce can handle OAuth token refresh automatically. For example, if we call a payment API with OAuth, I don't write any code to get or refresh the token. When it expires, Salesforce gets a new one. Named credentials also work for External Services and Salesforce Connect, not just Apex. And in the current model, the authentication part lives in a separate External Credential.

- Endpoint + authentication in one reusable setup
- Apex uses 'callout:Name/path'
- No secrets in code; no Remote Site Setting needed
- Used by Apex, External Services and external data sources

<sub>Also asked as: Why use named credentials instead of hard-coding the URL and password? · Explain named credentials in Salesforce · what is the callout colon syntax · How do you store API credentials securely in Salesforce?</sub>

### What is the difference between a Named Credential and an External Credential in the current model?
*Mid (3–6 yrs) · concept* · `int-006`

In the current model, introduced in Winter '23, the work is split in two. The Named Credential holds the endpoint URL and callout options. The External Credential holds the authentication protocol, like OAuth 2.0, JWT, Basic, AWS Signature V4 or Custom, plus the principals. A principal is the identity used for the call. A named principal means one shared integration identity. A per-user principal means each user authenticates separately. Users only get access when a permission set or profile is mapped to that principal. That's a very common reason callouts fail right after setup. Everything looks configured, but the running user's permission set isn't mapped, so the callout has no credentials. One external credential can serve several named credentials. Legacy named credentials are deprecated, so I build new ones in this model.

- Named Credential = URL + callout options
- External Credential = auth protocol + principals
- Named principal (shared) vs per-user principal
- Grant principal access through a permission set
- Legacy named credentials are deprecated

<sub>Also asked as: Explain the new named credential and external credential setup · What is a principal in an external credential? · Why does my callout fail even though the named credential is configured? permission set? · legacy named credentials vs new named credentials</sub>

### How do you pass an API key to an external system securely?
*Mid (3–6 yrs) · code* · `int-007`

I don't keep API keys in code, custom labels or plain custom settings. I create an External Credential with the Custom authentication protocol, and add the key as an encrypted authentication parameter on the principal. Then I define a custom header, say X-API-Key, whose value is a $Credential formula referencing that parameter. The Named Credential points to the base URL and uses that external credential. Now the Apex just calls the named credential, and the header is added at runtime. Apex never sees or logs the key. So the key is encrypted, hidden from developers, and an admin can rotate it without a deployment. For example, if the vendor says the key leaked and issues a new one, the admin pastes it into the principal and we're done in five minutes.

- External Credential with Custom protocol
- Store key as an encrypted principal parameter
- Custom header uses a $Credential formula
- Apex never sees or logs the key

```java
// Setup (no code): External Credential 'Weather_Cred' (Custom protocol)
//   Principal parameter: apiKey = ******
//   Custom header: X-API-Key = {!$Credential.Weather_Cred.apiKey}
// Named Credential 'Weather_API' -> https://api.example.com, uses Weather_Cred

HttpRequest req = new HttpRequest();
req.setEndpoint('callout:Weather_API/v1/forecast?city=' + EncodingUtil.urlEncode(city, 'UTF-8'));
req.setMethod('GET');
HttpResponse res = new Http().send(req); // header added by the platform
```

<sub>Also asked as: How do I send an API key header without hard-coding it? · Where do you store API keys in Salesforce? · custom header in named credential with credential formula · Should I store the API key in a custom setting?</sub>

### How do you parse a JSON response in Apex?
*Fresher (0–2 yrs) · code* · `int-008`

When I know the structure, I create a wrapper class whose property names match the JSON keys, and call JSON.deserialize with that class type. It's type-safe and easy to read, and nested objects or arrays just become nested classes and lists. For example, if the response is an order with a customer object and a list of items, I'd have an Order class with a Customer property and a List of Item. One thing to know: unknown keys are ignored by JSON.deserialize. JSON.deserializeStrict throws an error if the JSON has fields that aren't in the class. So if the vendor adds a new field tomorrow, deserialize keeps working, deserializeStrict breaks. For the reverse, building a request body, I use JSON.serialize. And tools that generate Apex from sample JSON can speed up creating the wrapper.

- Wrapper class properties match JSON keys
- JSON.deserialize(body, MyClass.class)
- deserializeStrict fails on unknown fields
- JSON.serialize for request bodies

```java
public class CustomerDto {
    public String id;
    public String name;
    public Decimal creditLimit;
    public List<AddressDto> addresses;
}
public class AddressDto {
    public String city;
    public String country;
}

CustomerDto c = (CustomerDto) JSON.deserialize(res.getBody(), CustomerDto.class);
String firstCity = (c.addresses == null || c.addresses.isEmpty()) ? null : c.addresses[0].city;
```

<sub>Also asked as: How do you convert JSON into an Apex object? · Explain JSON.deserialize with a wrapper class · how to read json response from api in apex · What is a wrapper class for JSON parsing?</sub>

### When would you use JSON.deserializeUntyped, and how do you handle JSON keys that are Apex reserved words?
*Mid (3–6 yrs) · code* · `int-009`

I use JSON.deserializeUntyped when the structure is dynamic, or very large with only a few fields I need, or has keys I can't use as Apex property names. It returns Object, which I cast to Map<String, Object> for objects and List<Object> for arrays, then cast each value. For example, if a response has 80 fields and I only need status and id, I don't build a wrapper for all 80. For reserved words, like a key called currency or limit, one option is deserializeUntyped. Another is to replace the key in the raw string before deserializing into a wrapper, for example renaming currency to currency_x. For building JSON I use JSON.serialize, and passing true as the second argument suppresses null values.

- deserializeUntyped returns Map<String,Object> / List<Object>
- Good for dynamic or partially used payloads
- Reserved keys: untyped parsing or rename key before deserialize
- JSON.serialize(obj, true) drops nulls

```java
Map<String, Object> root = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
List<Object> items = (List<Object>) root.get('items');
for (Object o : items) {
    Map<String, Object> item = (Map<String, Object>) o;
    String sku = (String) item.get('sku');
    String curr = (String) item.get('currency');      // reserved word, fine here
    Object rawPrice = item.get('price');                // may be Integer or Decimal at runtime
    Decimal price = rawPrice == null ? null : Decimal.valueOf(String.valueOf(rawPrice));
}

// Alternative for a wrapper class:
String safeBody = res.getBody().replace('"currency":', '"currency_x":');
```

<sub>Also asked as: How do you parse dynamic JSON without a wrapper class? · JSON key is a reserved keyword like currency, how to deserialize? · deserialize untyped map string object example · How do you parse JSON when the structure keeps changing?</sub>

### What is OAuth 2.0 and how does it work at a high level?
*Fresher (0–2 yrs) · concept* · `int-010`

OAuth 2.0 is an authorization framework. It lets an application access an API on behalf of a user, or on its own behalf, without sharing the user's password with that application. The client app is registered with the authorization server. In Salesforce that's through an External Client App or Connected App, and it gets a client Id and secret, or a certificate. Through one of the OAuth flows, it gets an access token, a short-lived key sent in the Authorization Bearer header on every API call. A refresh token, when issued, lets the app get a new access token without the user logging in again. Scopes limit what the token can do. A simple example: a mobile app logs a rep in once, gets a token with just the api and refresh_token scopes, and keeps working for weeks using the refresh token, without ever seeing her password.

- Access without sharing passwords
- Access token: short-lived, sent as Bearer header
- Refresh token: gets new access tokens
- Scopes limit what the app can do

<sub>Also asked as: Explain OAuth in simple words · What is an access token and a refresh token? · how does oauth authentication work with salesforce · Why use OAuth instead of username and password?</sub>

### Which OAuth flows does Salesforce support and when do you use each?
*Mid (3–6 yrs) · comparison* · `int-011`

I pick the flow based on who the user is and where the client runs. Web server, or authorization code with PKCE, is for apps where a real user logs in through a browser and the app can keep a secret on its server. JWT bearer is for server-to-server integration with no user interaction, signed with a certificate, acting as a pre-authorized user. Client credentials is also server-to-server, using client Id and secret with a configured run-as user. Device flow is for devices with limited input, like a TV or a CLI. User-agent was used by browser and mobile apps, but code flow with PKCE is the better choice today. Refresh token flow renews access. So, a nightly ERP sync would be JWT bearer, and a customer-facing web portal would be auth code with PKCE. I avoid username-password flow, because it's being phased out.

- Web server (auth code + PKCE): interactive users
- JWT bearer: server-to-server with certificate
- Client credentials: server-to-server with run-as user
- Device: limited-input devices; refresh token: renew access
- Avoid username-password flow

<sub>Also asked as: Explain the OAuth flows: web server, JWT, client credentials, device · Which OAuth flow would you use for server to server integration? · difference between jwt bearer flow and client credentials flow · What OAuth flow should a mobile app use?</sub>

### How does the OAuth 2.0 JWT bearer flow work with Salesforce?
*Mid (3–6 yrs) · concept* · `int-012`

The JWT bearer flow is for server-to-server integration where nobody can log in interactively. First I generate a certificate and private key, upload the certificate to the External Client App, enable JWT, and pre-authorize the integration user through admin-approved users with a permission set or profile. The external system builds a JWT. iss is the consumer key, sub is the Salesforce username, aud is the login URL, like login.salesforce.com or test.salesforce.com, and exp is short. It signs that with its private key and posts it to the token endpoint. Salesforce checks the signature with the certificate and returns an access token. No refresh token is issued, the client just creates a new JWT when needed. A common mistake: pointing a sandbox integration at login.salesforce.com in aud, when it should be test.salesforce.com.

- Certificate uploaded to the app; private key stays with client
- Claims: iss = consumer key, sub = username, aud = login URL, exp
- User must be pre-authorized (admin-approved)
- No refresh token; sign a new JWT each time

<sub>Also asked as: Explain JWT bearer token flow step by step · How do you set up server to server integration using a certificate? · what goes in the JWT claims for salesforce · JWT flow without user login how does it work</sub>

### What is the OAuth client credentials flow and what is the run-as user?
*Mid (3–6 yrs) · concept* · `int-013`

The client credentials flow lets a backend system get an access token using only the consumer key and secret, with no user login. But every Salesforce API call needs a user context. So I configure a run-as user on the External Client App, and all calls run with that user's permissions. I make it a dedicated integration user with least privilege, ideally on the Salesforce Integration license, with only the permission sets it needs. For example, if a warehouse system only updates stock levels, the run-as user only gets edit on the product inventory fields, nothing else. Compared with JWT bearer, it's simpler because there's no certificate. But the secret must be stored and rotated carefully. JWT is stronger when the client can manage a private key.

- Consumer key + secret only, no user interaction
- Run-as user defines permissions
- Use a dedicated least-privilege integration user
- Simpler than JWT, but secret must be protected

<sub>Also asked as: When would you use client credentials flow in Salesforce? · client credentials vs jwt bearer which is better · What user does the client credentials flow run as? · How do you integrate without a user context?</sub>

### What is the difference between Connected Apps and External Client Apps?
*Mid (3–6 yrs) · comparison* · `int-014`

Both register an external application to Salesforce for OAuth access, but External Client Apps are now the recommended option. As of Spring '26, creating new connected apps is restricted by default, and you have to contact Salesforce Support if you really need one. Existing connected apps keep working. External Client Apps split developer settings, like OAuth flows, scopes and callback URL, from admin policies, like permitted users, IP relaxation and session policies. They're closed by default, so nothing exists in an org until it's installed. They can be local or packaged with second-generation packaging. They don't support the username-password flow, which is another push toward secure flows. So if a team today asks me to set up a new integration that logs in with username and password, I'd tell them to use an ECA with JWT or client credentials instead. Also note the SOAP API login() is being retired too.

- New connected app creation restricted since Spring '26
- ECA: settings (developer) vs policies (admin) separated
- Closed by default; local or 2GP packaged
- No username-password flow on ECAs
- Existing connected apps still work; SOAP API login() is also being retired

<sub>Also asked as: Should I create a connected app or an external client app? · Why can't I create a new connected app in my org? · What changed with connected apps in Spring 26? · external client app vs connected app</sub>

### How do you expose an Apex class as a REST web service?
*Fresher (0–2 yrs) · code* · `int-015`

I annotate a global class with @RestResource and a urlMapping, and add global static methods annotated with @HttpGet, @HttpPost, @HttpPut, @HttpPatch or @HttpDelete. The external system calls /services/apexrest/ followed by my mapping, with an OAuth access token. For example, with urlMapping '/orders/*', a GET to /services/apexrest/orders/12345 hits my @HttpGet method. I read the request from RestContext.request, like the URI or parameters, and set status codes on RestContext.response. I use with sharing and user-mode queries so the integration user's permissions are respected. And I only build custom Apex REST when the standard REST API can't do the job. A typical reason is multi-object logic in one call, like creating an account, contact and opportunity together and applying business rules.

- @RestResource(urlMapping='/path/*') on a global class
- Global static methods with @HttpGet/@HttpPost etc.
- Endpoint: /services/apexrest/<mapping>
- Use RestContext for request and response

```java
@RestResource(urlMapping='/accounts/*')
global with sharing class AccountApi {
    @HttpGet
    global static Account getAccount() {
        String accId = RestContext.request.requestURI.substringAfterLast('/');
        List<Account> accs = [SELECT Id, Name, Phone, Industry
                              FROM Account WHERE Id = :accId WITH USER_MODE LIMIT 1];
        if (accs.isEmpty()) {
            RestContext.response.statusCode = 404;
            return null;
        }
        return accs[0];
    }
}
// GET /services/apexrest/accounts/001xx000003DGb2AAG
```

<sub>Also asked as: Write an Apex REST service with HttpGet · What is @RestResource and urlMapping? · how do external systems call my custom apex rest api · What is the endpoint URL for an Apex REST class?</sub>

### How do you write an Apex REST POST method that reads a JSON body and returns proper status codes?
*Mid (3–6 yrs) · code* · `int-016`

For full control I make the @HttpPost method return void. I read RestContext.request.requestBody as a Blob, convert it to a string, and deserialize it into a wrapper class. Then I do the DML and write the JSON response body and status code myself: 201 for created, 400 for validation problems, 500 for unexpected errors. Say the caller posts a new order but leaves out the customer number. Instead of a raw Salesforce exception, they get a 400 with a body like code MISSING_FIELD and a clear message. Returning a consistent error structure makes life much easier for the calling team, because they can handle every error the same way. I also set the Content-Type header, and keep business logic in a separate service class so it can be reused and unit tested.

- Read RestContext.request.requestBody.toString()
- Deserialize into a wrapper class
- Set statusCode and responseBody yourself
- Consistent JSON error format

```java
@RestResource(urlMapping='/leads')
global with sharing class LeadApi {
    public class LeadInput { public String lastName; public String company; public String email; }

    @HttpPost
    global static void createLead() {
        RestResponse res = RestContext.response;
        res.addHeader('Content-Type', 'application/json');
        try {
            LeadInput input = (LeadInput) JSON.deserialize(
                RestContext.request.requestBody.toString(), LeadInput.class);
            Lead l = new Lead(LastName = input.lastName, Company = input.company, Email = input.email);
            insert as user l;
            res.statusCode = 201;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{ 'id' => l.Id }));
        } catch (JSONException e) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{ 'error' => 'Invalid JSON: ' + e.getMessage() }));
        } catch (DmlException e) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{ 'error' => e.getDmlMessage(0) }));
        } catch (Exception e) {
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{ 'error' => e.getMessage() }));
        }
    }
}
```

<sub>Also asked as: HttpPost example in Apex REST with error handling · How to read request body in apex rest service · return 201 or 400 from apex rest · RestContext request requestBody example</sub>

### How do you expose an Apex method as a SOAP web service?
*Mid (3–6 yrs) · code* · `int-017`

I create a global class and mark the methods as webservice static. Any inner class used in the response has its fields marked with the webservice keyword so they appear in the WSDL. From the Apex class page in Setup, I generate the WSDL and share it with the other team. To authenticate, they also use the Enterprise or Partner WSDL, or an OAuth token, and pass the session in the SOAP header. The endpoint is /services/Soap/class/ followed by the class name. So for a class called InvoiceService, it's /services/Soap/class/InvoiceService. I only build this when the consumer insists on SOAP, like an older ERP that can only generate SOAP clients. Otherwise Apex REST is simpler for everyone.

- Global class, webservice static methods
- Inner class fields marked webservice
- Generate WSDL from the class in Setup
- Endpoint: /services/Soap/class/ClassName

```java
global with sharing class AccountSoapService {
    global class AccountResult {
        webservice Id accountId;
        webservice Boolean success;
        webservice String message;
    }

    webservice static AccountResult createAccount(String name, String phone) {
        AccountResult r = new AccountResult();
        try {
            Account a = new Account(Name = name, Phone = phone);
            insert a;
            r.accountId = a.Id;
            r.success = true;
        } catch (DmlException e) {
            r.success = false;
            r.message = e.getDmlMessage(0);
        }
        return r;
    }
}
```

<sub>Also asked as: What is the webservice keyword in Apex? · Create a custom SOAP service in Salesforce · how does external system get wsdl for my apex class · Apex SOAP web service example</sub>

### How do you consume an external SOAP service in Salesforce?
*Fresher (0–2 yrs) · concept* · `int-018`

I use Generate from WSDL on the Apex Classes page, which is WSDL2Apex. It creates a stub class with a port type and request and response element classes. So in my code, I create the port and call the operation like a normal method. For example, if the WSDL has a getCreditScore operation, I just call port.getCreditScore with the customer Id. I set the endpoint, ideally to a named credential, plus timeout and headers on the stub. The import doesn't support every WSDL feature. Some imports, complex schema constructs or multiple bindings can fail. When that happens I either simplify the WSDL, or build the XML manually with HttpRequest and the Dom or XmlStreamWriter classes. For tests I use the WebServiceMock interface.

- Setup > Apex Classes > Generate from WSDL
- Call the generated port method like Apex
- Unsupported WSDL features may need manual XML
- Test with WebServiceMock

<sub>Also asked as: What is WSDL2Apex? · How do you generate Apex from a WSDL? · calling a soap api from apex · What if the WSDL import fails in Salesforce?</sub>

### What APIs does Salesforce provide and when do you use each one?
*Fresher (0–2 yrs) · concept* · `int-019`

The REST API is my default for record CRUD and queries from web and mobile apps. The SOAP API does the same with a WSDL contract for systems that need it. Bulk API 2.0 is for large data loads or extracts, roughly anything beyond a few thousand records, processed asynchronously. Composite resources group several REST calls into one round trip. For events I use the Pub/Sub API, or the older Streaming API, to subscribe to platform events and Change Data Capture. Metadata API deploys and retrieves configuration, Tooling API works with developer artifacts like Apex classes and debug logs, and the GraphQL API lets a client fetch exactly the fields it needs across related objects in one request. For example, a nightly load of 500,000 product prices goes through Bulk API 2.0, while a mobile app updating one visit uses REST.

- REST/SOAP: record CRUD and queries
- Bulk API 2.0: large async loads and extracts
- Composite: many operations in one call
- Pub/Sub & Streaming: events and CDC
- Metadata/Tooling: config & dev tools; GraphQL: precise queries

<sub>Also asked as: Name the Salesforce APIs and their use cases · Which API should I use for loading millions of records? · REST API vs Bulk API vs SOAP API vs Streaming API · what is metadata api tooling api graphql api in salesforce</sub>

### How does Bulk API 2.0 work and how is it different from Bulk API 1.0?
*Mid (3–6 yrs) · code* · `int-020`

Bulk API 2.0 is a REST-based, asynchronous API for loading or extracting large volumes. For ingest, I create a job with the object, operation and external Id field, upload the CSV data, mark the job UploadComplete, then poll until it's complete and download the successful, failed and unprocessed results. The big difference from 1.0 is that 2.0 manages batching for me. I don't create or size batches myself, and query jobs handle chunking automatically. But 2.0 only supports CSV, while 1.0 also supports XML and JSON and lets me choose serial or parallel mode. Say I upsert 300,000 contacts and 1,200 fail. I always process the failedResults file, fix those rows and reload them. I use Bulk API when volumes are big enough that REST would waste API calls.

- Create job > upload CSV > UploadComplete > poll > get results
- 2.0 handles batching and chunking automatically
- 2.0 is CSV only; 1.0 supports manual batches and serial mode
- Always process failedResults

```java
POST /services/data/v66.0/jobs/ingest
{ "object": "Account", "operation": "upsert",
  "externalIdFieldName": "ERP_Id__c", "contentType": "CSV", "lineEnding": "LF" }

PUT   /services/data/v66.0/jobs/ingest/{jobId}/batches      (Content-Type: text/csv)
PATCH /services/data/v66.0/jobs/ingest/{jobId}              { "state": "UploadComplete" }
GET   /services/data/v66.0/jobs/ingest/{jobId}              -> poll until "JobComplete"
GET   /services/data/v66.0/jobs/ingest/{jobId}/failedResults
```

<sub>Also asked as: Explain the steps of a Bulk API 2.0 ingest job · bulk api 1 vs bulk api 2 · How do you upsert a large CSV using Bulk API? · When do you use Bulk API instead of REST API?</sub>

### What is the Composite API and how do you create related records in one call?
*Mid (3–6 yrs) · code* · `int-021`

The Composite resource lets a client send up to 25 subrequests in one call. Later subrequests can reference results from earlier ones with the @{referenceId.field} syntax. Say a website signs up a new customer. In one call I create the Account with referenceId newAcc, then create a Contact with AccountId set to @{newAcc.id}. With allOrNone set to true, if the contact fails, the account rolls back too, so I don't end up with an orphan account. The whole call counts as one API request against limits. Related options: Composite Batch for independent subrequests, sObject Tree for nested record trees, and sObject Collections for up to 200 records of one type in one call. For very large related sets, Composite Graph is the next step.

- Up to 25 subrequests in one call
- @{refId.id} passes values between subrequests
- allOrNone for transactional behavior
- sObject Collections: up to 200 records per call

```java
POST /services/data/v66.0/composite
{
  "allOrNone": true,
  "compositeRequest": [
    { "method": "POST", "url": "/services/data/v66.0/sobjects/Account",
      "referenceId": "newAcc", "body": { "Name": "Acme Ltd" } },
    { "method": "POST", "url": "/services/data/v66.0/sobjects/Contact",
      "referenceId": "newCon",
      "body": { "LastName": "Rao", "AccountId": "@{newAcc.id}" } }
  ]
}
```

<sub>Also asked as: Explain composite request with referenceId · How can I create an account and contact in a single API call? · composite vs batch vs sobject tree vs collections · How do you reduce the number of API calls from an external system?</sub>

### What is the difference between the Streaming API and the Pub/Sub API?
*Mid (3–6 yrs) · comparison* · `int-022`

Both let external clients receive events from Salesforce, but the technology is different. The Streaming API is based on CometD long polling over HTTP. It supports PushTopic events, generic events, platform events and Change Data Capture. PushTopic and generic events are legacy and aren't being enhanced. The Pub/Sub API is the newer interface, built on gRPC and HTTP/2 with Avro-encoded payloads. A client can both publish and subscribe through one API. It uses a pull model with flow control, so the client asks for as many events as it can handle, and it's more efficient for high volumes. For example, if a data warehouse needs to consume thousands of change events an hour, with Pub/Sub it can ask for 100 at a time and not get flooded. For new external subscribers, I use the Pub/Sub API.

- Streaming API: CometD, PushTopic/generic are legacy
- Pub/Sub API: gRPC, HTTP/2, Avro
- Pub/Sub can publish and subscribe
- Client-controlled flow, better for high volume

<sub>Also asked as: PushTopic vs platform events vs Pub/Sub API · Should I use CometD or Pub/Sub API to subscribe to events? · what is the pub sub api in salesforce · How do external systems listen to Salesforce events?</sub>

### How do subscribers avoid missing events when using platform events or Change Data Capture with the Pub/Sub API?
*Senior (7–10 yrs) · concept* · `int-023`

Every event has a replay Id, and high-volume platform events and change events are retained for 72 hours. My subscriber stores the replay Id of the last event it processed successfully. If it restarts, it subscribes with that replay Id and gets everything after it, instead of only new events or everything in the window. For example, if the subscriber crashes at 2 a.m. and comes back at 6, it resumes from its saved replay Id and catches up on those four hours. But if it's down longer than the 72-hour window, those events are gone. So I need a fallback, like a reconciliation job or querying changed records. With the Pub/Sub API, managed subscriptions, still in beta, can let Salesforce track the committed replay position for me. And because replays can deliver an event again, processing must be idempotent.

- Persist last processed replay Id
- Retention: 72 hours for high-volume events and CDC
- Resubscribe from stored replay Id after downtime
- Have a reconciliation fallback; make handlers idempotent

<sub>Also asked as: What is a replay Id and how do you use it? · What happens to events if my subscriber is down? · event retention period for platform events · How do you resume from where you left off after a subscriber crash?</sub>

### What is the Salesforce GraphQL API and when would you use it?
*Mid (3–6 yrs) · concept* · `int-024`

The GraphQL API lets a client ask for exactly the fields it needs, including related objects, in one request. So it avoids over-fetching and multiple REST round trips. It's built on the UI API, which means it respects field-level security and sharing. In LWC I use the lightning/uiGraphQLApi wire adapter, and external apps call the graphql endpoint under the REST data path. Mutations to create, update and delete records are generally available from API version 66.0, after being in beta. Say a mobile screen needs an account's name, its five latest opportunities, and each opportunity's owner name. With REST that's several calls. With GraphQL it's one query that returns just those fields. I'd use it for UI-driven or mobile scenarios like that, and stay with REST or Bulk for heavy data movement.

- Request exactly the fields needed, nested
- Respects FLS and sharing (UI API based)
- LWC: lightning/uiGraphQLApi
- Mutations GA from API v66.0

<sub>Also asked as: Explain GraphQL in Salesforce · GraphQL vs REST API in Salesforce · Can you do mutations with Salesforce GraphQL? · how to use graphql in lwc</sub>

### What are Platform Events and when would you use them?
*Fresher (0–2 yrs) · concept* · `int-025`

Platform Events are custom event messages, defined like an object with the __e suffix, and used for event-driven integration. A publisher fires an event and doesn't know or care who listens. Subscribers react to it. So systems are loosely coupled. I can publish from Apex, Flow or an external system through the API. I can subscribe with an Apex trigger, a platform event-triggered Flow, LWC using empApi, or externally through the Pub/Sub API. For example, when an order is ready, Salesforce publishes Order_Ready__e. The ERP picks it up and starts fulfilment, and a flow in Salesforce emails the customer. Neither one knows about the other. Other uses are receiving IoT signals or decoupling a heavy process. One thing to remember: events can't be queried or updated like records. They're fire-and-forget messages.

- Object with __e suffix, publish/subscribe model
- Publish: Apex, Flow, APIs
- Subscribe: Apex trigger, Flow, LWC empApi, Pub/Sub API
- Loose coupling between systems

<sub>Also asked as: Explain platform events in Salesforce · What is an event-driven architecture in Salesforce? · platform event use case example · How do you publish and subscribe to platform events?</sub>

### How do you publish a platform event from Apex and subscribe to it with a trigger?
*Fresher (0–2 yrs) · code* · `int-026`

I create event instances, set their custom fields, and call EventBus.publish with a list. It returns a SaveResult for each event, so I can check for publish errors. On the subscriber side, I write an after insert trigger on the event object. That's the only supported trigger event. The trigger runs asynchronously as the Automated Process user by default, and I can configure a different running user and batch size. Say I publish 500 Payment_Received__e events after a bank file is processed. The subscriber trigger gets them in batches, so it must be bulkified like any trigger, one query and one update for the whole batch. And because events can be redelivered, the subscriber logic should be idempotent. For example, I check whether the payment is already marked as received before adding it again.

- EventBus.publish(list) returns SaveResults
- Subscriber: trigger on Event__e (after insert)
- Runs as Automated Process user by default
- Bulkify the subscriber trigger

```java
List<Order_Shipped__e> events = new List<Order_Shipped__e>();
for (Order o : shippedOrders) {
    events.add(new Order_Shipped__e(Order_Number__c = o.OrderNumber, Status__c = o.Status));
}
for (Database.SaveResult sr : EventBus.publish(events)) {
    if (!sr.isSuccess()) {
        for (Database.Error err : sr.getErrors()) {
            System.debug(LoggingLevel.ERROR, 'Publish failed: ' + err.getMessage());
        }
    }
}

trigger OrderShippedTrigger on Order_Shipped__e (after insert) {
    Set<String> orderNumbers = new Set<String>();
    for (Order_Shipped__e evt : Trigger.new) {
        orderNumbers.add(evt.Order_Number__c);
    }
    OrderShippingService.notifyCustomers(orderNumbers);
}
```

<sub>Also asked as: Write code to publish a platform event · EventBus.publish example · platform event trigger example in apex · How do I check if a platform event was published successfully?</sub>

### What is Change Data Capture and how is it different from Platform Events?
*Mid (3–6 yrs) · concept* · `int-027`

Change Data Capture publishes change events automatically whenever records of selected objects are created, updated, deleted or undeleted. I just enable the objects in Setup, under Change Data Capture, and subscribers listen on channels like AccountChangeEvent. Each event has a ChangeEventHeader with the change type, changed fields, record Ids, commit user and transaction key. On update, only the changed fields are populated. Platform Events are custom. I define the fields and decide when to publish, with code or Flow. So CDC is best for keeping an external copy of data in sync. Say a data warehouse needs every account change. CDC sends it, and if only the phone changed, the event carries just the phone. Platform events are best for business-level messages, like 'invoice approved', that aren't just a field change.

- CDC: automatic events for record changes
- Enable objects in Setup > Change Data Capture
- ChangeEventHeader: changeType, changedFields, recordIds
- Platform events: custom schema, explicit publishing

<sub>Also asked as: Explain CDC in Salesforce · change data capture vs platform events which one to use · How can an external system get notified when a record changes? · what is ChangeEventHeader</sub>

### How do you handle failures inside a platform event trigger, including retries?
*Senior (7–10 yrs) · code* · `int-028`

For transient errors like record locks, I throw EventBus.RetryableException. Salesforce then re-runs the trigger with the same batch of events. I check the retries count on the trigger context, so after a few attempts I stop and log the failure instead. Retries are limited, so after the last attempt the events need to be handled another way. For example, if a batch of 2,000 events hits a lock on the first try, a retry usually works. But if the problem is bad data, retrying five times won't help, so I log it. For large batches I can call setResumeCheckpoint with the replay Id of the last processed event. Then if the trigger fails at event 1,500, processing resumes after the checkpoint, not from the start. And because callouts aren't allowed directly in the trigger, I enqueue a Queueable for any outbound call.

- Throw EventBus.RetryableException for transient errors
- Check TriggerContext retries and stop to log
- setResumeCheckpoint for partial progress
- Enqueue Queueable for callouts

```java
trigger ErpSyncEventTrigger on Erp_Sync__e (after insert) {
    EventBus.TriggerContext ctx = EventBus.TriggerContext.currentContext();
    Set<Id> accountIds = new Set<Id>();
    for (Erp_Sync__e evt : Trigger.new) {
        accountIds.add((Id) evt.Account_Id__c);
    }
    try {
        AccountSyncService.markPending(accountIds);           // DML that may hit locks
        System.enqueueJob(new AccountErpSyncJob(accountIds)); // callout happens here
    } catch (DmlException e) {
        if (ctx.retries < 4) {
            throw new EventBus.RetryableException('Retrying: ' + e.getMessage());
        }
        IntegrationLogger.logFailure('Erp_Sync__e', accountIds, e);
    }
}
```

<sub>Also asked as: What is EventBus.RetryableException? · How do you retry a failed platform event trigger? · setResumeCheckpoint example · platform event subscriber keeps failing what do you do</sub>

### What is an Outbound Message and what are its limitations?
*Fresher (0–2 yrs) · concept* · `int-029`

An Outbound Message is a no-code way to send a SOAP XML message with selected field values of a record to an external endpoint. The receiver must send back an acknowledgement. If it doesn't, Salesforce keeps retrying, with increasing intervals, for up to 24 hours. Since Workflow Rules reached end of support at the end of 2025, I trigger outbound messages from a record-triggered Flow. The limitations: it's SOAP only, it includes fields from one object only, the receiver must implement the WSDL Salesforce generates, and messages can arrive more than once or out of order. So the receiver must be idempotent. For example, if the same order message arrives twice, the ERP should update the order, not create a second one. For anything more complex, like fields from the account and its order lines, I use an Apex callout or platform events.

- No-code SOAP message with one object's fields
- Retries for up to 24 hours until acknowledged
- Send from record-triggered Flow (Workflow is end of support)
- Possible duplicates; receiver must be idempotent

<sub>Also asked as: Explain outbound messaging in Salesforce · How do outbound messages handle retries? · can a flow send an outbound message · outbound message vs apex callout</sub>

### What are the standard Salesforce integration patterns?
*Mid (3–6 yrs) · concept* · `int-030`

Salesforce describes a few core patterns. Remote Process Invocation, Request and Reply: Salesforce calls a system and waits for the answer, like a credit check. Remote Process Invocation, Fire and Forget: Salesforce sends a message and carries on, using platform events, outbound messages or an async callout. Batch Data Synchronization: bulk loads or extracts on a schedule, usually through middleware and Bulk API. Remote Call-In: an external system creates or updates Salesforce data through the APIs. UI Update Based on Data Changes: the UI refreshes when data changes, using streaming events. Data Virtualization: show external data without storing it, using Salesforce Connect. I choose by timing, volume and who starts it. For example, a nightly product catalogue load is batch sync, while an ERP pushing order status back into Salesforce is remote call-in.

- Request-reply and fire-and-forget (Salesforce initiates)
- Batch data synchronization
- Remote call-in (external initiates)
- UI update on data changes; data virtualization

<sub>Also asked as: Name the integration patterns and explain them · Explain request reply fire and forget batch data sync remote call in · integration patterns salesforce architect · Which integration pattern would you use for real-time sync?</sub>

### When do you choose request-reply versus fire-and-forget?
*Fresher (0–2 yrs) · comparison* · `int-031`

I use request-reply when the user or process needs the answer right now to continue. Like validating an address, checking credit before saving an order, or getting a live price. The external system has to be fast and reliable, because the user is waiting and callout timeouts apply. I use fire-and-forget when Salesforce only needs to notify another system and doesn't need the result straight away, like sending a new order to the ERP. That's done with platform events, outbound messages, or an asynchronous callout. It's more resilient, because a slow or down target doesn't block users. Say the ERP is down for an hour. With fire-and-forget, reps keep closing orders and they flow through later. With request-reply they'd all be stuck. If a result is needed later, the target can call back into Salesforce.

- Request-reply: answer needed now; user waits
- Fire-and-forget: notify and continue
- Async is more resilient to slow targets
- Callback to Salesforce if a later result is needed

<sub>Also asked as: synchronous vs asynchronous integration in salesforce · Should the callout wait for a response or not? · When is a synchronous callout acceptable? · fire and forget pattern example</sub>

### How would you design a remote call-in integration where an external system writes data into Salesforce?
*Mid (3–6 yrs) · design* · `int-032`

First I decide which API fits. Standard REST or sObject Collections for small real-time writes, Composite for related records, Bulk API 2.0 for large volumes, or a custom Apex REST service if I need business logic or a special contract. For authentication, I register an External Client App with JWT bearer or client credentials, and a dedicated integration user with least-privilege permission sets. I give each object an External Id field so the caller can upsert, and retries don't create duplicates. For example, if the ERP sends invoice INV-1001, times out, and sends it again, the upsert on ERP_Invoice_Id just updates the same record. I also think about the triggers and flows that will fire on incoming data, API limit consumption, error responses the caller can act on, and monitoring through login history and API usage.

- Pick the right API by volume and complexity
- OAuth via External Client App + integration user
- Upsert on external Id for idempotency
- Watch automation, limits and error responses

<sub>Also asked as: external system needs to create records in salesforce how · remote call-in pattern best practices · How do you let a third party push data into Salesforce? · Inbound integration design considerations</sub>

### How do you update a Lightning page in real time when data changes from an integration?
*Mid (3–6 yrs) · code* · `int-033`

This is the UI update based on data changes pattern. The integration or a trigger publishes a platform event, or I use Change Data Capture, and the LWC subscribes with the lightning/empApi module. In the callback, I check whether the event is for the record on screen. If it is, I update the component, or call refreshApex or the record notify function, so the page shows the new data. Say an agent has a case open, and the courier system updates the delivery status. Without this, she'd have to refresh the page. With it, the status changes on her screen within seconds. I unsubscribe in disconnectedCallback to avoid leaks. External web apps can do the same thing through the Pub/Sub API.

- Publish platform event or use CDC
- LWC subscribes via lightning/empApi
- Filter by recordId, then refresh data
- Unsubscribe in disconnectedCallback

```java
import { LightningElement, api } from 'lwc';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';

export default class ShipmentStatus extends LightningElement {
    @api recordId;
    status;
    subscription;

    connectedCallback() {
        subscribe('/event/Shipment_Update__e', -1, (message) => {
            const payload = message.data.payload;
            if (payload.Record_Id__c === this.recordId) {
                this.status = payload.Status__c;
            }
        }).then((sub) => { this.subscription = sub; });
        onError((error) => console.error('empApi error', JSON.stringify(error)));
    }

    disconnectedCallback() {
        if (this.subscription) {
            unsubscribe(this.subscription, () => {});
        }
    }
}
```

<sub>Also asked as: UI update based on data changes pattern · How do I refresh an LWC when a platform event arrives? · lightning empApi subscribe example · Show live status from an external system in Salesforce UI</sub>

### What is Salesforce Connect and how do External Objects work?
*Fresher (0–2 yrs) · concept* · `int-034`

Salesforce Connect lets me show and work with data that lives in another system, without copying it into Salesforce. I define an External Data Source, using an OData 2.0 or 4.0 adapter, the cross-org adapter for another Salesforce org, or a custom adapter written with the Apex Connector Framework. Then I sync to create External Objects, with the __x suffix. When a user opens a record or related list, Salesforce queries the external system in real time. For example, ten years of invoices can stay in the ERP, and reps still see them as a related list on the Account. External objects can relate to standard objects through external and indirect lookups. The limitations compared with custom objects: no standard triggers, limited reporting and automation, and performance that depends on the external system. If the ERP is slow, that related list is slow.

- Data stays in the source system, read on demand
- Adapters: OData 2.0/4.0, cross-org, custom Apex
- External objects end in __x
- External and indirect lookups for relationships
- Fewer features than custom objects

<sub>Also asked as: Explain data virtualization in Salesforce · external objects vs custom objects · How can I show SAP or database data in Salesforce without importing it? · what is the odata adapter in salesforce connect</sub>

### When would you use middleware like MuleSoft instead of point-to-point integration?
*Senior (7–10 yrs) · design* · `int-035`

Point-to-point is fine when there are one or two systems, low volume and simple mapping, like Salesforce calling a single payment API. Middleware like MuleSoft makes sense when many systems need the same data, when transformations and orchestration are complex, or when I need reliable queuing, retries, guaranteed delivery and central monitoring. It decouples systems. Say customer data goes from Salesforce to the ERP, the billing system and the data warehouse. If the ERP is replaced, only the middleware mapping changes, not three separate integrations in Salesforce. MuleSoft's API-led approach adds reusable system, process and experience APIs. It also protects Salesforce limits by handling bulk processing and throttling outside the platform. The trade-off is licensing cost and one more platform to run.

- Point-to-point: few systems, simple logic
- Middleware: many systems, complex transforms, orchestration
- Queuing, retries, monitoring in one place
- API-led: system, process, experience layers
- Cost and operational overhead

<sub>Also asked as: Why do we need an ESB or MuleSoft? · point to point vs middleware integration · When is direct Apex callout enough and when do you need MuleSoft? · What does an integration platform give you?</sub>

### What are the callout limits and timeouts in Apex?
*Fresher (0–2 yrs) · concept* · `int-036`

One Apex transaction can make up to 100 callouts. The default timeout for each callout is 10 seconds. I can set it with setTimeout anywhere from 1 millisecond up to 120 seconds. The cumulative timeout across all callouts in a transaction is also capped at 120 seconds. So if I make three calls that each take 50 seconds, the third one will fail, even though each call is under the per-callout max. Also, I can't make a callout after DML or other pending work in the same transaction, and callouts from triggers must be asynchronous. In Developer Edition orgs there's also a limit on concurrent callouts to external endpoints. For slow APIs I move the work to Queueable or Batch, and from the UI I can use a Continuation.

- 100 callouts per transaction
- Default timeout 10 s, max 120 s per callout
- 120 s cumulative per transaction
- No callouts after uncommitted DML

<sub>Also asked as: How many callouts can I make in one transaction? · What is the default and maximum callout timeout? · callout governor limits salesforce · Why is my callout timing out after 10 seconds?</sub>

### You get the error 'You have uncommitted work pending. Please commit or rollback before calling out'. How do you fix it?
*Fresher (0–2 yrs) · troubleshooting* · `int-037`

Salesforce doesn't allow a callout after DML in the same transaction, because the database transaction would stay open while waiting on an external system. The simplest fix is to reorder: make the callout first, then do the DML with the response. For example, call the tax API, get the tax amount, then insert the order with it. If the DML has to happen first, I move the callout into a separate transaction. That's a Queueable with Database.AllowsCallouts, a future method with callout=true, or a platform event whose subscriber enqueues the callout. In test classes, I do the setup DML before Test.startTest and the callout after it. And the same rule applies to pending async jobs and emails queued earlier in the transaction, not just DML.

- Cause: DML before callout in same transaction
- Fix 1: callout first, then DML
- Fix 2: move callout to Queueable/future
- In tests: DML before Test.startTest()

<sub>Also asked as: callout after DML error how to resolve · uncommitted work pending error · Why can't I make a callout after inserting a record? · how to do a callout after dml in apex</sub>

### How do you make a callout from a trigger?
*Fresher (0–2 yrs) · code* · `int-038`

A trigger can't make a synchronous callout, because it runs inside the database transaction. So I collect the record Ids in the trigger and hand them to an asynchronous method. Either a future method with callout=true, or, my preference, a Queueable that implements Database.AllowsCallouts, because it accepts complex types, can be monitored, and can chain or use a finalizer. I pass Ids rather than sObjects to a future method, and re-query inside the async method so I send the latest committed data. I also bulkify. Say a data load inserts 200 accounts. I enqueue one job with all 200 Ids, not 200 separate jobs, one per record.

- No sync callouts in triggers
- future(callout=true) or Queueable + Database.AllowsCallouts
- Pass Ids, re-query in async context
- One job per batch of records

```java
trigger AccountTrigger on Account (after insert) {
    ErpCallouts.sendAccounts(Trigger.newMap.keySet());
}

public with sharing class ErpCallouts {
    @future(callout=true)
    public static void sendAccounts(Set<Id> accountIds) {
        List<Account> accs = [SELECT Id, Name, Phone, BillingCountry FROM Account WHERE Id IN :accountIds];
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:ERP_API/customers/bulk');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(accs));
        HttpResponse res = new Http().send(req);
        if (res.getStatusCode() >= 300) {
            IntegrationLogger.logHttpFailure('ERP customers', res);
        }
    }
}
```

<sub>Also asked as: Can you make a callout directly from a trigger? · Callout from trigger is not allowed, what is the workaround? · future method callout true example · trigger to call external api on insert</sub>

### Can you make a callout after rolling back DML to a savepoint?
*Senior (7–10 yrs) · code* · `int-039`

On recent API versions, yes, but only with a specific sequence. If I roll back all uncommitted DML to a savepoint and then explicitly call Database.releaseSavepoint, the transaction has no pending work, and the callout is allowed. If savepoints are still active, the callout fails with an error saying all active savepoints must be released. Before API version 60.0, any callout after creating a savepoint throws an exception, full stop. Where this helps is a dry-run pattern. Say I need to know what a quote total would be after all the pricing automation runs. I insert the quote lines temporarily, read the calculated total, roll back to the savepoint, release it, and then call the external tax API with that total. One gotcha: after releasing, I can't roll back to that savepoint anymore.

- Roll back all DML, then Database.releaseSavepoint()
- Active savepoints block callouts
- Before API 60.0: not allowed at all
- Cannot roll back to a released savepoint

```java
Savepoint sp = Database.setSavepoint();
insert draftQuote;                       // temporary, used to run calculations
Decimal total = [SELECT Total__c FROM Quote__c WHERE Id = :draftQuote.Id].Total__c;
Database.rollback(sp);                   // undo every uncommitted DML
Database.releaseSavepoint(sp);           // required before the callout

HttpRequest req = new HttpRequest();
req.setEndpoint('callout:Pricing_API/quotes/validate');
req.setMethod('POST');
req.setBody(JSON.serialize(new Map<String, Object>{ 'total' => total }));
HttpResponse res = new Http().send(req);
```

<sub>Also asked as: Database.releaseSavepoint callout · All active savepoints must be released before making callouts error · savepoint and callout in the same transaction · dry run DML then call external system</sub>

### How do you handle errors and logging in integrations?
*Mid (3–6 yrs) · design* · `int-040`

I classify errors first. Transient ones, like timeouts, 429 or 5xx, can be retried. Permanent ones, like a 400 validation error or bad data, need a person or a data fix. Retrying a 400 ten times just gives you ten failures. Every callout is wrapped in try-catch with status code checks, and failures go to a custom Integration Log object with the endpoint, a payload reference, status, error and the related record Id. If the transaction might roll back, I publish a logging platform event set to Publish Immediately, so the log survives. Otherwise the rollback wipes out the very log that explains it. I never log secrets or full sensitive payloads. On top, a dashboard or alert shows failures, and a retry mechanism or a reprocess button handles the transient ones.

- Transient vs permanent errors
- Custom log object with context
- Publish Immediately log events survive rollback
- No secrets in logs; alerts + retry

<sub>Also asked as: What is your error handling strategy for callouts? · how do you log integration failures in salesforce · How do you make sure failed callouts are not lost? · Logging that survives a rollback</sub>

### What is idempotency and how do you make an integration idempotent?
*Senior (7–10 yrs) · concept* · `int-041`

An operation is idempotent if doing it twice gives the same result as doing it once. It matters because retries, redelivered events and outbound message retries all cause duplicates. Inbound, I use upsert on an External Id, so a repeated message updates the same record instead of creating a new one. Outbound, I send a unique key, like the Salesforce record Id plus a version, or an idempotency key header if the target supports it, so the receiver can ignore duplicates. For events, I store processed message or replay Ids and skip ones I've already seen. And I prefer absolute values over incremental ones. For example, 'set status to Shipped' is safe to apply twice. 'Add one to quantity' isn't, because if the message comes twice, quantity goes up by two.

- Same request twice = same result
- Inbound: upsert on external Id
- Outbound: idempotency key / unique message Id
- Track processed event Ids; avoid incremental updates

<sub>Also asked as: Explain idempotent APIs · How do you prevent duplicate records when a message is retried? · idempotency key in rest api · the same order came twice from the external system what do you do</sub>

### How do you monitor API usage and limits in Salesforce?
*Mid (3–6 yrs) · concept* · `int-042`

The daily API request limit is a rolling 24-hour allocation based on edition and licenses. To monitor it, I use the REST limits resource, which returns current usage for many org limits, and the Sforce-Limit-Info header that comes back on REST responses. In Setup, System Overview and Company Information show usage, and API Usage Notifications can email admins when a threshold is crossed, say 80 percent. To find who's using the calls, I check the API usage report by user or app, and Event Monitoring logs, then look at login history for the integration users. For example, if usage suddenly doubles, the report usually shows one integration user making most of the calls, often a new sync job polling too often. In Apex, the OrgLimits class gives the same data.

- Rolling 24-hour daily API request limit
- /limits REST resource and Sforce-Limit-Info header
- API Usage Notifications in Setup
- Event Monitoring and usage reports to find consumers

<sub>Also asked as: How do I check how many API calls are left? · We are hitting the daily API limit, how do you find out who is using it? · sforce limit info header · API usage monitoring tools in salesforce</sub>

### How can you check org limits like daily API requests from Apex?
*Mid (3–6 yrs) · code* · `int-043`

I use the OrgLimits class. OrgLimits.getMap returns a map keyed by limit name, like DailyApiRequests, and each OrgLimit gives getValue for what's used and getLimit for the maximum. What I usually do is run this in a scheduled job every hour. Say the org allows 100,000 calls a day and usage crosses 80,000. The job sends a notification, publishes an alert event, or pauses non-critical jobs so the important integrations keep working. This is the same data as the REST limits resource, so the middleware team can monitor it from outside too, and we're both looking at the same numbers.

- OrgLimits.getMap() keyed by limit name
- getValue() = used, getLimit() = max
- Schedule it and alert above a threshold

```java
public with sharing class ApiUsageMonitor implements Schedulable {
    public void execute(SchedulableContext sc) {
        System.OrgLimit api = OrgLimits.getMap().get('DailyApiRequests');
        Integer used = api.getValue();
        Integer max = api.getLimit();
        if (max > 0 && (used * 100) / max >= 80) {
            EventBus.publish(new Integration_Alert__e(
                Message__c = 'Daily API usage at ' + used + ' of ' + max));
        }
    }
}
```

<sub>Also asked as: OrgLimits class example · How to alert when API usage is above 80 percent · get remaining api calls in apex · apex code to read org limits</sub>

### How do certificates and mutual TLS work for Salesforce integrations?
*Senior (7–10 yrs) · concept* · `int-044`

For outbound mutual TLS, the external server wants Salesforce to present a client certificate. I create or import a certificate in Certificate and Key Management, share the public certificate with the other team, and reference it on the Named Credential, or with setClientCertificateName on HttpRequest. For inbound mutual TLS, the client must present a certificate when calling Salesforce. I upload the client's CA-signed certificate as a mutual authentication certificate, give the integration user the Enforce SSL/TLS Mutual Authentication permission, and the client connects on port 8443. Certificates are also used to sign JWTs. The thing I always stress is expiry. Say a certificate was set up two years ago and expires on a Sunday. On Monday every call fails, and nobody remembers who set it up. So I track expiry dates and set reminders well ahead.

- Outbound: client cert on Named Credential or setClientCertificateName
- Inbound: upload CA cert, permission, port 8443
- Certificates also sign JWT assertions
- Monitor expiry dates

<sub>Also asked as: What is two-way SSL in Salesforce? · How do you send a client certificate in an Apex callout? · inbound mutual TLS salesforce port 8443 · Certificate and Key Management uses</sub>

### How would you integrate two Salesforce orgs?
*Mid (3–6 yrs) · design* · `int-045`

There are a few options. Salesforce to Salesforce is an older native feature that shares records through connections, but it's limited and I wouldn't start new work on it. The Salesforce Connect cross-org adapter shows the other org's data as external objects in real time, without copying it. For true syncing, I use the REST or Bulk API from one org to the other through a Named Credential with OAuth, together with platform events or Change Data Capture to send the changes. For many orgs or complex mappings, middleware like MuleSoft, or Data 360 for unified customer data, is cleaner. The key decisions are which org owns each object and how to handle conflicts. For example, after an acquisition, the parent company's org might own Accounts, while the acquired company's org keeps owning its own service cases.

- Salesforce to Salesforce: legacy, limited
- Cross-org adapter: real-time virtualization
- REST/Bulk + Named Credential + CDC for sync
- MuleSoft or Data 360 for many orgs
- Define system of record per object

<sub>Also asked as: What is Salesforce to Salesforce? · multi-org integration options · How do you sync data between two Salesforce orgs? · cross org adapter vs salesforce to salesforce</sub>

### What is Heroku Connect and when would you use it?
*Fresher (0–2 yrs) · concept* · `int-046`

Heroku Connect is a Heroku add-on that syncs Salesforce objects with tables in a Heroku Postgres database, either one-way into Postgres or both ways. I configure mappings for objects and fields, and it handles the API calls, polling and conflict handling for me. Developers then build high-traffic customer-facing apps on Heroku using plain SQL, without worrying about Salesforce API limits on every page view. For example, a public product catalogue site with thousands of visitors an hour reads from Postgres, not from Salesforce directly. I'd use it when a public app or a high-volume service needs fast access to Salesforce data. But it still uses Salesforce API calls during sync, and write-back isn't instant, so it's not for strict real-time transactions.

- Syncs Salesforce objects with Heroku Postgres
- Read-only or read-write mappings
- Apps use SQL instead of Salesforce APIs
- Sync uses API calls; near real time, not instant

<sub>Also asked as: Explain Heroku Connect · How do you sync Salesforce data to Postgres? · heroku connect vs api integration · When would you put an app on Heroku with Salesforce data?</sub>

### What is an External ID and why is it important in integrations?
*Fresher (0–2 yrs) · concept* · `int-047`

An External ID is a custom field marked as External ID, usually also unique, that stores the record's identifier from another system, like the ERP customer number. It's indexed, so lookups are fast. Its main value is upsert. The external system sends records with its own Id, and Salesforce updates the match or inserts a new one, without knowing Salesforce Ids. I can also set relationships by External ID. For example, the ERP sends a contact with Account ERP number C-1001, and Salesforce links it to the right account without the ERP ever knowing the account's Salesforce Id. This makes integrations idempotent. If the same customer message is sent twice because of a retry, the second one just updates the existing record instead of creating a duplicate.

- Stores the source system's identifier
- Indexed; usually marked Unique
- Enables upsert and relationship by external Id
- Prevents duplicates on retries

<sub>Also asked as: Why do we use external Id fields? · how does upsert work with external id · What is the benefit of external id in data loading? · external id vs salesforce id</sub>

### A callout that works in sandbox fails in production with a 401 or Unauthorized endpoint error. How do you troubleshoot it?
*Mid (3–6 yrs) · troubleshooting* · `int-048`

I start with configuration that doesn't deploy cleanly. 'Unauthorized endpoint' means the URL isn't covered by a Remote Site Setting, or the code isn't using the named credential. For a 401, I check that the Named Credential and External Credential in production point to the production endpoint and have production secrets, because credential values aren't migrated. This is the classic case. The deployment moved the named credential, but the secret is still empty, or it still holds the sandbox key. So someone has to re-enter it in production. Then I confirm the running user has principal access through the permission set, and for OAuth, that the principal has actually authenticated. I check certificate names and expiry, IP allowlisting on the external side, and then the debug log and the raw response body for the exact error.

- 'Unauthorized endpoint' = remote site / named credential issue
- Secrets don't deploy; re-enter in production
- Check permission set access to the principal
- Check certs, IP allowlist, response body

<sub>Also asked as: Callout works in sandbox but fails in prod · getting 401 unauthorized from external api · unauthorized endpoint please check setup remote site · named credential not working after deployment</sub>

### How do you secure inbound API access to Salesforce?
*Senior (7–10 yrs) · design* · `int-049`

I give each integration its own dedicated user, ideally on the Salesforce Integration user license, which is API only, with the API Only User permission so nobody can log in through the UI with it. Access comes from narrow permission sets with only the objects and fields it needs, and sharing that matches its purpose. Authentication goes through an External Client App using JWT bearer or client credentials, never shared passwords. I use tight OAuth scopes, admin-approved users, IP restrictions where possible, and sensible session or refresh token policies. For example, if the marketing tool only reads leads and campaigns, its user can't even see opportunities, so a leaked token can't expose deal data. I monitor login history and Event Monitoring, and rotate secrets and certificates on a schedule.

- One dedicated integration user per integration
- API-only, least-privilege permission sets
- External Client App + JWT or client credentials
- Narrow scopes, IP restrictions, monitoring

<sub>Also asked as: Best practices for the integration user · How do you lock down an external system's access to Salesforce? · integration user license and API only user · What permissions should an integration user have?</sub>

### What is External Services in Salesforce?
*Fresher (0–2 yrs) · concept* · `int-050`

External Services lets me register an external REST API by importing its OpenAPI specification and linking a Named Credential for the endpoint and authentication. Salesforce then generates invocable actions for each operation, and Apex types for the request and response. So admins can call the API straight from Flow, and developers from Apex, without writing HTTP code. Say we have an address validation API with an OpenAPI spec. I import it, and an admin can drop a 'validateAddress' action into a screen flow and use the result, no developer needed. It's great for simple request-reply calls like address validation or a credit check. For complex error handling, very large payloads or unusual auth, a custom Apex callout is still more flexible.

- Import OpenAPI spec + Named Credential
- Generates Flow actions and Apex types
- No HTTP code for simple calls
- Use Apex for complex scenarios

<sub>Also asked as: How do you call an API from Flow without code? · Explain External Services and OpenAPI · register an API schema in salesforce · no code callout from flow</sub>

### How do you make a callout from a Queueable and handle paginated responses?
*Mid (3–6 yrs) · code* · `int-051`

I implement Queueable and Database.AllowsCallouts. Each execution fetches one page, upserts the records on an External Id with partial success allowed, and if the response has a next page token, it enqueues a new instance of itself with that token. That keeps each page inside its own set of governor limits, like heap, CPU and the callout timeout. Say the API returns 500 products per page and there are 20 pages. That's 20 chained jobs, each handling 500 records with fresh limits, instead of one job trying to hold 10,000 in memory. In tests I skip chaining, since chained jobs can't run in test context. For very large imports, I'd rather use middleware with the Bulk API, but this works well for moderate volumes.

- Queueable + Database.AllowsCallouts
- One page per execution, chain the next
- Upsert on external Id, partial success
- Avoid chaining in tests

```java
public class ProductImportJob implements Queueable, Database.AllowsCallouts {
    private String pageToken;
    public ProductImportJob(String pageToken) { this.pageToken = pageToken; }

    public void execute(QueueableContext ctx) {
        String url = 'callout:PIM_API/products?pageSize=200'
            + (String.isBlank(pageToken) ? '' : '&pageToken=' + EncodingUtil.urlEncode(pageToken, 'UTF-8'));
        HttpRequest req = new HttpRequest();
        req.setEndpoint(url);
        req.setMethod('GET');
        HttpResponse res = new Http().send(req);

        ProductPage page = (ProductPage) JSON.deserialize(res.getBody(), ProductPage.class);
        List<Product2> products = new List<Product2>();
        for (ProductDto p : page.items) {
            products.add(new Product2(PIM_Id__c = p.id, Name = p.name, IsActive = true));
        }
        Database.upsert(products, Product2.PIM_Id__c, false);

        if (String.isNotBlank(page.nextPageToken) && !Test.isRunningTest()) {
            System.enqueueJob(new ProductImportJob(page.nextPageToken));
        }
    }
    public class ProductPage { public List<ProductDto> items; public String nextPageToken; }
    public class ProductDto { public String id; public String name; }
}
```

<sub>Also asked as: Queueable with Database.AllowsCallouts example · How to import data from an API that returns pages · chaining queueable jobs for pagination · API returns next page token how to handle in apex</sub>

### How do you handle very large API responses or payloads without hitting heap limits?
*Senior (7–10 yrs) · design* · `int-052`

First, I avoid pulling huge payloads in one call. I ask the API for pagination, filters like 'modified since last sync', or only the fields I need. Then I process page by page in async Apex, where the heap limit is 12 MB instead of 6 MB, using a chained Queueable or a Batch. When parsing, I deserialize into lean wrapper classes with only the properties I need, or use JSONParser to stream through tokens without building the full object tree. And I release references to the raw body once it's parsed, so I'm not holding the string and the objects at the same time. For example, if a customer response has 200 fields and I need six, my wrapper has six. For truly large volumes, the right answer is usually that the other system or middleware pushes data in through Bulk API 2.0 instead.

- Paginate and filter at the source
- Async context: 12 MB heap
- Lean wrappers or streaming JSONParser
- Large volumes: Bulk API 2.0 via middleware

<sub>Also asked as: heap size exceeded when parsing big JSON response · API returns 10 MB of data, how do you process it in Apex? · processing large callout responses · how to avoid heap limit in integration</sub>

## Integration Scenarios

### You need to sync Accounts to an ERP in real time whenever they are updated. How would you build it?
*Mid (3–6 yrs) · code* · `int-053`

I'd use an after update trigger that calls a handler. The handler collects only accounts where the synced fields actually changed, so unrelated edits don't cause callouts. For example, if the ERP only cares about name, address and tax number, a rep editing the account description shouldn't send anything. The handler enqueues one Queueable per trigger chunk that implements Database.AllowsCallouts, not one per record. The Queueable re-queries the accounts, sends them in one bulk request through a Named Credential, and writes a sync status back. Because the status fields aren't in the changed-field check, that update doesn't trigger another callout, so there's no recursion. I'd also attach a finalizer for retries, and store the ERP Id that comes back.

- After update trigger, only on relevant field changes
- One Queueable per chunk, not per record
- Bulk payload through Named Credential
- Write back sync status without recursion

```java
trigger AccountTrigger on Account (after update) {
    AccountErpSyncHandler.afterUpdate(Trigger.new, Trigger.oldMap);
}

public with sharing class AccountErpSyncHandler {
    public static void afterUpdate(List<Account> newList, Map<Id, Account> oldMap) {
        Set<Id> ids = new Set<Id>();
        for (Account a : newList) {
            Account o = oldMap.get(a.Id);
            if (a.Name != o.Name || a.Phone != o.Phone || a.BillingCity != o.BillingCity) {
                ids.add(a.Id);
            }
        }
        if (!ids.isEmpty()) System.enqueueJob(new AccountErpSyncJob(ids));
    }
}

public class AccountErpSyncJob implements Queueable, Database.AllowsCallouts {
    private Set<Id> accountIds;
    public AccountErpSyncJob(Set<Id> accountIds) { this.accountIds = accountIds; }
    public void execute(QueueableContext ctx) {
        List<Account> accs = [SELECT Id, Name, Phone, BillingCity, ERP_Id__c FROM Account WHERE Id IN :accountIds];
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:ERP_API/customers/batch');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(accs));
        HttpResponse res = new Http().send(req);
        String status = res.getStatusCode() == 200 ? 'Synced' : 'Failed';
        for (Account a : accs) a.ERP_Sync_Status__c = status;
        update accs;
    }
}
```

<sub>Also asked as: Write a trigger that sends updated accounts to an external system · real-time account sync to ERP using queueable · How do you call an external API when a record is updated? · trigger plus queueable callout example</sub>

### What could go wrong with a trigger-to-Queueable real-time sync at scale, and how would you design around it?
*Senior (7–10 yrs) · design* · `int-054`

The risks show up during bulk updates. A large load runs the trigger in chunks of 200, so one transaction can try to enqueue many jobs and hit the limit of 50 Queueables per transaction. And enqueuing from a batch or another Queueable is even more limited. Many parallel jobs can also flood the ERP, causing rate limiting, ordering problems and duplicate updates. Picture a data fix that updates 100,000 accounts. That would mean hundreds of jobs hammering the ERP at once. To design around it, I'd mark records as pending and let a scheduled or chained job drain them in controlled batches. Or I'd publish platform events or use Change Data Capture and let middleware handle throttling and ordering. I'd add a bypass switch for data migrations, and make the ERP side idempotent.

- Bulk loads can exceed enqueue limits
- Parallel jobs flood the target; ordering issues
- Pending flag + controlled drain job
- CDC/events + middleware for throttling
- Bypass switch for migrations

<sub>Also asked as: Problems with queueable callouts during data loads · What happens when someone mass updates 50,000 accounts and each fires a callout? · too many queueable jobs added to the queue error · How do you make real-time sync scale?</sub>

### An external system needs to send orders with line items into Salesforce. How would you build the Apex REST endpoint?
*Mid (3–6 yrs) · code* · `int-055`

I'd build an @HttpPost Apex REST service that deserializes the payload into wrapper classes, then upserts the order on its external order Id and links the account by the account's ERP external Id, so no Salesforce Ids are needed. Line items are upserted on a composite external Id, order number plus line number, so resending the same order updates instead of duplicating. I use a savepoint so the order and lines succeed or fail together, and return a clear status code with the Salesforce Id or the error.

- Upsert parent on external order Id
- Relate account by its external Id
- Lines keyed by orderId-lineNo
- Savepoint for all-or-nothing; clear responses

```java
@RestResource(urlMapping='/orders/*')
global with sharing class OrderIntakeApi {
    public class LinePayload { public Integer lineNo; public String sku; public Decimal qty; }
    public class OrderPayload { public String orderId; public String customerErpId; public List<LinePayload> lines; }

    @HttpPost
    global static void receiveOrder() {
        RestResponse res = RestContext.response;
        res.addHeader('Content-Type', 'application/json');
        Savepoint sp = Database.setSavepoint();
        try {
            OrderPayload p = (OrderPayload) JSON.deserialize(
                RestContext.request.requestBody.toString(), OrderPayload.class);
            Sales_Order__c ord = new Sales_Order__c(
                External_Order_Id__c = p.orderId,
                Account__r = new Account(ERP_Id__c = p.customerErpId));
            upsert ord Sales_Order__c.External_Order_Id__c;

            List<Sales_Order_Line__c> lines = new List<Sales_Order_Line__c>();
            for (LinePayload l : p.lines) {
                lines.add(new Sales_Order_Line__c(
                    External_Line_Id__c = p.orderId + '-' + l.lineNo,
                    Sales_Order__c = ord.Id, SKU__c = l.sku, Quantity__c = l.qty));
            }
            upsert lines Sales_Order_Line__c.External_Line_Id__c;

            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{ 'salesforceId' => ord.Id }));
        } catch (Exception e) {
            Database.rollback(sp);
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{ 'error' => e.getMessage() }));
        }
    }
}
```

<sub>Also asked as: Receive orders from an external system using upsert on external Id · Apex REST service to create order and order lines · How do you avoid duplicate orders when the external system retries? · inbound order integration code</sub>

### Would you use a custom Apex REST service or standard APIs to receive orders from an external system?
*Senior (7–10 yrs) · design* · `int-056`

I start with standard APIs, because Salesforce maintains them, they need no code, and they respect security automatically. sObject Collections or Composite Graph with upsert on External Ids handles an order with its lines as an all-or-nothing unit very well. I build a custom Apex REST service when the caller's contract can't change and needs mapping, when there's business logic or validation that must run before saving, when several unrelated objects must be handled in one call, or when I want to hide the internal data model. For example, if an old e-commerce platform sends one fixed JSON format and the vendor won't change it, a custom endpoint can map it. If MuleSoft sits in between, it usually does the mapping and calls the standard APIs, so custom Apex isn't needed. Either way, I upsert on External Ids.

- Default: standard APIs (collections, composite graph)
- Custom Apex REST: fixed contract, logic, hide data model
- Middleware can do mapping instead
- Either way: upsert on external Ids

<sub>Also asked as: custom apex rest vs composite api for inbound data · When should I build a custom endpoint instead of using standard REST API? · design inbound order integration · Is Apex REST better than sObject collections?</sub>

### How would you design a nightly sync of one million records from an external system into Salesforce?
*Senior (7–10 yrs) · design* · `int-057`

I'd use the batch data synchronization pattern, with middleware or an ETL tool calling Bulk API 2.0. First, send only deltas using a last-modified watermark instead of the full million every night. Usually only a few thousand records actually change in a day, so that's a big saving. Load with upsert on an External Id, so reruns are safe. Load parents before children, and sort children by parent to reduce record lock contention. For example, load accounts first, then contacts sorted by account, so two batches aren't fighting over the same account. For heavy automation, I'd use a bypass setting for the integration user, or move logic into async processing, so triggers and flows don't slow the load. Afterwards, the middleware reads failed results, retries transient failures and reports the rest. I'd schedule it outside business hours and monitor API and Bulk usage.

- Bulk API 2.0 via middleware/ETL
- Delta loads with a watermark
- Upsert on external Id; parents before children
- Bypass or defer heavy automation
- Process failed results; monitor limits

<sub>Also asked as: Nightly bulk sync of 1M records design · How do you load millions of records every night? · large data volume integration design · bulk data synchronization pattern example</sub>

### How would you send a large number of records from Salesforce to an external system every night?
*Mid (3–6 yrs) · code* · `int-058`

If Salesforce has to push the data, I'd use Batch Apex that implements Database.AllowsCallouts, scheduled at night. The start method selects records flagged as pending sync. Each execute sends its scope in one bulk request, and I set the scope size so the payload and the callout count stay within limits. Say 50,000 orders are pending and the target accepts 200 per request. A scope of 200 gives one callout per execute. I mark records synced or failed in each execute, and use Database.Stateful to count failures, so the finish method can send a summary like '49,880 sent, 120 failed'. If the target can pull instead, a middleware job using a Bulk API 2.0 query is often better for very large volumes.

- Batchable + Database.AllowsCallouts
- Query only records pending sync
- One bulk request per execute; tune scope size
- Stateful counters and summary in finish

```java
public class NightlyErpExportBatch implements Database.Batchable<SObject>, Database.AllowsCallouts, Database.Stateful {
    private Integer failed = 0;

    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator(
            [SELECT Id, Name, ERP_Id__c FROM Account WHERE ERP_Sync_Status__c = 'Pending']);
    }

    public void execute(Database.BatchableContext bc, List<Account> scope) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:ERP_API/customers/batch');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setTimeout(60000);
        req.setBody(JSON.serialize(scope));
        HttpResponse res = new Http().send(req);
        String status = res.getStatusCode() == 200 ? 'Synced' : 'Failed';
        if (status == 'Failed') failed += scope.size();
        for (Account a : scope) a.ERP_Sync_Status__c = status;
        update scope;
    }

    public void finish(Database.BatchableContext bc) {
        IntegrationLogger.logSummary('Nightly ERP export', failed);
    }
}
// Database.executeBatch(new NightlyErpExportBatch(), 100);
```

<sub>Also asked as: Batch Apex with callouts example · Database.AllowsCallouts in batch class · nightly outbound sync using batch apex · Can batch apex make callouts?</sub>

### The external system is sometimes down. How do you retry failed callouts automatically?
*Senior (7–10 yrs) · code* · `int-059`

I make the callout in a Queueable and attach a Transaction Finalizer with System.attachFinalizer. If the callout throws, say on a timeout, or a 5xx that I convert into an exception, the finalizer still runs and sees UNHANDLED_EXCEPTION. It then re-enqueues the job with an attempt counter and a delay, using System.enqueueJob with a delay in minutes for backoff. For example, first retry after 1 minute, then 5, then 10. A finalizer can enqueue one job, and a failing Queueable can be re-enqueued by its finalizer up to five times in a row. So after my maximum attempts, I write a failure log and alert someone, instead of retrying forever.

- System.attachFinalizer in Queueable execute
- Finalizer runs even after unhandled exceptions
- Re-enqueue with delay for backoff
- Max five consecutive re-enqueues; then log and alert

```java
public class ErpSyncJob implements Queueable, Database.AllowsCallouts {
    private Set<Id> recordIds;
    private Integer attempt;
    public ErpSyncJob(Set<Id> recordIds, Integer attempt) { this.recordIds = recordIds; this.attempt = attempt; }
    public void execute(QueueableContext ctx) {
        System.attachFinalizer(new ErpSyncFinalizer(recordIds, attempt));
        ErpClient.pushAccounts(recordIds); // throws ErpException on timeout or 5xx
    }
}

public class ErpSyncFinalizer implements Finalizer {
    private Set<Id> recordIds;
    private Integer attempt;
    public ErpSyncFinalizer(Set<Id> recordIds, Integer attempt) { this.recordIds = recordIds; this.attempt = attempt; }
    public void execute(FinalizerContext ctx) {
        if (ctx.getResult() != ParentJobResult.UNHANDLED_EXCEPTION) return;
        if (attempt < 3) {
            Integer delayMinutes = Math.pow(2, attempt).intValue();   // 1, 2, 4 minutes
            System.enqueueJob(new ErpSyncJob(recordIds, attempt + 1), delayMinutes);
        } else {
            insert new Integration_Log__c(Status__c = 'Failed',
                Message__c = ctx.getException().getMessage(),
                Record_Ids__c = String.join(new List<Id>(recordIds), ','));
        }
    }
}
```

<sub>Also asked as: Retry callouts using queueable and transaction finalizer · What is a transaction finalizer and how do you use it for retries? · external API is down how do you handle it in apex · exponential backoff retry in salesforce</sub>

### How would you design a resilient outbound integration if the target system can be down for hours?
*Senior (7–10 yrs) · design* · `int-060`

Short retries aren't enough for long outages, so I make every outbound change durable. When a record changes, I write it to a sync queue, either a custom staging object or a status field, or I publish a platform event that a subscriber turns into a queue record. A scheduled job picks up pending items, calls out with retries and backoff, and marks them sent, failed-retryable or failed-permanent. After a maximum number of attempts, items go to a dead-letter state with an alert and a reprocess button. Say the ERP is down for six hours overnight. All the changes just pile up in the queue, and when it comes back they go out. Because items are replayed after the outage, I process them in order per record and keep the target idempotent. With middleware, its persistent queues handle much of this.

- Persist outbound changes in a queue/staging object
- Scheduled processor with backoff retries
- Dead-letter state + alert + reprocess
- Ordering per record and idempotent target

<sub>Also asked as: Design for guaranteed delivery when the external system has outages · external system down for a long time, how do you avoid losing data? · dead letter queue in salesforce · retry with platform events and logs</sub>

### How would you secure a callout to an external API that requires a JWT?
*Mid (3–6 yrs) · code* · `int-061`

My first choice is declarative. An External Credential using OAuth 2.0 with the JWT bearer flow, or the JWT protocol, with the signing certificate from Certificate and Key Management, and a Named Credential on top. Then the Apex just calls the named credential, and Salesforce mints and refreshes the tokens. If I need custom claims or the setup doesn't fit, I can do it in code. Auth.JWT builds the claims, Auth.JWS signs it with the certificate, and Auth.JWTBearerTokenExchange swaps it for an access token. That last one needs the token URL allowed as a remote site. I'd cache the token in Platform Cache until it expires. Say the token lasts an hour and we make 500 calls in that hour. That's one token exchange instead of 500. And I never hard-code keys.

- Prefer External Credential with JWT bearer
- Signing cert in Certificate and Key Management
- Code option: Auth.JWT, Auth.JWS, JWTBearerTokenExchange
- Cache tokens; never hard-code keys

```java
Auth.JWT jwt = new Auth.JWT();
jwt.setIss('partner-client-id');
jwt.setSub('integration@partner.example');
jwt.setAud('https://auth.partner.example/oauth/token');

Auth.JWS jws = new Auth.JWS(jwt, 'Partner_Signing_Cert'); // cert in Certificate and Key Management
Auth.JWTBearerTokenExchange exchange =
    new Auth.JWTBearerTokenExchange('https://auth.partner.example/oauth/token', jws);
String accessToken = exchange.getAccessToken();

HttpRequest req = new HttpRequest();
req.setEndpoint('callout:Partner_API/orders');   // named credential with no auth, URL only
req.setMethod('GET');
req.setHeader('Authorization', 'Bearer ' + accessToken);
HttpResponse res = new Http().send(req);
```

<sub>Also asked as: Secure a callout using JWT bearer token · Auth.JWT and Auth.JWS example · How do you sign a JWT in Apex? · external credential with JWT bearer flow</sub>

### How would you design an integration between Salesforce and SAP?
*Senior (7–10 yrs) · design* · `int-062`

I'd start by defining the system of record per object: typically SAP owns materials, pricing, credit and invoices, Salesforce owns leads, opportunities and service, and customers need a clear ownership rule. Then I'd pick the pattern per flow: order submission as fire-and-forget through middleware, credit or stock checks as request-reply, and master data as nightly or near-real-time sync. Middleware like MuleSoft or SAP Integration Suite usually sits in between, because SAP speaks IDocs, BAPIs, RFCs and OData and mapping is complex. For showing SAP data without copying, I'd expose OData services and use Salesforce Connect. SAP numbers become external Ids in Salesforce, and I'd plan error queues and reconciliation reports.

- System of record per object
- Pattern per flow: async orders, sync checks, batch master data
- Middleware for IDoc/BAPI/OData mapping
- Salesforce Connect over SAP OData for virtualization
- SAP keys as external Ids; reconciliation

<sub>Also asked as: Salesforce SAP integration approach · How do you sync customers, orders and invoices with SAP? · integrate salesforce with sap erp design · Which tools would you use to connect SAP and Salesforce?</sub>

### How do you write a test class for an Apex callout?
*Fresher (0–2 yrs) · code* · `int-063`

Test methods can't make real callouts. So I implement the HttpCalloutMock interface, whose respond method returns a fake HttpResponse with the status code and body I want. In the test I call Test.setMock with the mock, call the code under test, and assert on the results. For example, for a weather service, one mock returns 200 with a temperature in the JSON, and I assert the record got that temperature. A second mock returns 500, and I assert that an error log was created and nothing was overwritten. That way the error handling is covered too, not just the happy path. For fixed responses, I can also use StaticResourceCalloutMock with a JSON file stored as a static resource.

- Implement HttpCalloutMock.respond
- Test.setMock(HttpCalloutMock.class, mock)
- Test success and failure status codes
- StaticResourceCalloutMock for file-based responses

```java
@IsTest
private class ErpClientTest {
    private class ErpMock implements HttpCalloutMock {
        private Integer status;
        ErpMock(Integer status) { this.status = status; }
        public HttpResponse respond(HttpRequest req) {
            Assert.areEqual('GET', req.getMethod());
            HttpResponse res = new HttpResponse();
            res.setStatusCode(status);
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"id":"C-100","name":"Acme"}');
            return res;
        }
    }

    @IsTest
    static void returnsCustomerOnSuccess() {
        Test.setMock(HttpCalloutMock.class, new ErpMock(200));
        Test.startTest();
        HttpResponse res = ErpClient.getCustomer('C-100');
        Test.stopTest();
        Assert.areEqual(200, res.getStatusCode());
    }

    @IsTest
    static void throwsOnServerError() {
        Test.setMock(HttpCalloutMock.class, new ErpMock(500));
        try {
            ErpClient.getCustomer('C-100');
            Assert.fail('Expected ErpException');
        } catch (ErpClient.ErpException e) {
            Assert.isTrue(e.getMessage().contains('500'));
        }
    }
}
```

<sub>Also asked as: Test HTTP callout using HttpCalloutMock · Why do callouts fail in test classes? · Test.setMock example · how to mock api response in apex test</sub>

### How do you test an Apex REST service?
*Fresher (0–2 yrs) · code* · `int-064`

I don't need an HTTP call; I build a RestRequest with the URI, method and JSON body, assign it and a new RestResponse to RestContext, and then call the static method directly. Afterwards I assert on the response status code and body, and query the database to confirm the records. For an upsert endpoint I call it twice with the same payload to prove it's idempotent and doesn't create duplicates. I also add a negative test with a bad payload to cover the error branch.

- Build RestRequest and RestResponse manually
- Assign to RestContext, call method directly
- Assert status code and database state
- Call twice to prove idempotency

```java
@IsTest
private class OrderIntakeApiTest {
    @IsTest
    static void upsertsOrderIdempotently() {
        insert new Account(Name = 'Acme', ERP_Id__c = 'C-1');

        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/orders/';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf(
            '{"orderId":"SO-1","customerErpId":"C-1","lines":[{"lineNo":1,"sku":"A1","qty":2}]}');
        RestContext.request = req;
        RestContext.response = new RestResponse();

        Test.startTest();
        OrderIntakeApi.receiveOrder();
        OrderIntakeApi.receiveOrder(); // same payload again
        Test.stopTest();

        Assert.areEqual(200, RestContext.response.statusCode);
        Assert.areEqual(1, [SELECT COUNT() FROM Sales_Order__c WHERE External_Order_Id__c = 'SO-1']);
        Assert.areEqual(1, [SELECT COUNT() FROM Sales_Order_Line__c]);
    }
}
```

<sub>Also asked as: Write a test class for @RestResource · How do you set RestContext in a test? · test apex rest post method · unit test for inbound api</sub>

### How do you test a SOAP callout generated from a WSDL?
*Mid (3–6 yrs) · code* · `int-065`

For WSDL2Apex classes, I implement the WebServiceMock interface. Its doInvoke method receives the request object and a response map. I build the generated response element class, set its fields, and put it into the map under the key response_x. In the test I call Test.setMock with WebServiceMock.class, then call the generated port method, or my service class that uses it, and assert on the result. For example, if the stub has getCreditScore, my mock builds the generated response element with score 750, and I assert my service returns 750. A common mistake is trying HttpCalloutMock here. It doesn't work, because the generated stub uses WebServiceCallout.invoke, not Http.send.

- Implement WebServiceMock.doInvoke
- Put generated response element in map as 'response_x'
- Test.setMock(WebServiceMock.class, mock)
- HttpCalloutMock is for HTTP, not WSDL2Apex

```java
@IsTest
private class TaxServiceTest {
    private class TaxServiceMock implements WebServiceMock {
        public void doInvoke(Object stub, Object request, Map<String, Object> response,
                String endpoint, String soapAction, String requestName,
                String responseNS, String responseName, String responseType) {
            // TaxService classes are generated by WSDL2Apex
            TaxService.calculateTaxResponse_element res = new TaxService.calculateTaxResponse_element();
            res.taxAmount = 18.0;
            response.put('response_x', res);
        }
    }

    @IsTest
    static void returnsTaxAmount() {
        Test.setMock(WebServiceMock.class, new TaxServiceMock());
        TaxService.TaxPort port = new TaxService.TaxPort();
        Test.startTest();
        Decimal tax = port.calculateTax(100);
        Test.stopTest();
        Assert.areEqual(18.0, tax);
    }
}
```

<sub>Also asked as: WebServiceMock example · test class for wsdl2apex generated class · How do you mock a SOAP response in Apex? · doInvoke method in webservicemock</sub>

### How do you test a Queueable that makes a callout after a trigger inserts or updates records?
*Mid (3–6 yrs) · code* · `int-066`

I insert the test data before Test.startTest, so that DML belongs to the setup. Then I set the HttpCalloutMock, call Test.startTest, do the update that fires the trigger, and call Test.stopTest. stopTest forces the enqueued Queueable to run synchronously, including its mocked callout. After stopTest, I query the records and assert the sync status was written. For example, I insert an account in setup, then inside start and stop I change its billing city, and after stopTest I check the Sync Status field says Synced. Keeping the DML before startTest avoids the uncommitted work pending error in tests. And setting the mock is required, otherwise the callout throws.

- Setup DML before Test.startTest()
- Set mock, then start/stop test around the action
- stopTest runs queued async jobs
- Assert the written-back results

```java
@IsTest
private class AccountErpSyncTest {
    private class OkMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody('{"status":"ok"}');
            return res;
        }
    }

    @IsTest
    static void syncsChangedAccounts() {
        Account acc = new Account(Name = 'Acme', Phone = '111');
        insert acc;                                     // setup DML first

        Test.setMock(HttpCalloutMock.class, new OkMock());
        Test.startTest();
        acc.Phone = '222';
        update acc;                                     // trigger enqueues the job
        Test.stopTest();                                // job + callout run here

        Assert.areEqual('Synced', [SELECT ERP_Sync_Status__c FROM Account WHERE Id = :acc.Id].ERP_Sync_Status__c);
    }
}
```

<sub>Also asked as: Test class for trigger plus queueable callout · uncommitted work pending in test class · how does Test.stopTest run queueable jobs · testing async callouts in apex</sub>

### Sales users need to see live invoice data from the ERP on the Account page, but you don't want to store it in Salesforce. What do you do?
*Mid (3–6 yrs) · scenario* · `int-067`

This is the data virtualization pattern. If the ERP or middleware can expose invoices as an OData service, I'd use Salesforce Connect to create an Invoice external object. I relate it to Account with an indirect lookup on the account's ERP number, so invoices show up as a related list on the account without any code. So a rep opens the account and sees last month's invoices straight from the ERP, and nothing is stored in Salesforce. If OData isn't available, I'd build an LWC that calls an Apex method making a callout through a Named Credential, cached for a short time. I'd set expectations first, though. External data can't drive normal triggers, reporting on it is limited, and the page depends on the ERP being available and fast.

- Salesforce Connect + external object
- Indirect lookup on account ERP number
- Alternative: LWC + Apex callout with caching
- Set expectations on reporting and availability

<sub>Also asked as: Show ERP invoices in Salesforce without importing them · display external data on a record page in real time · We don't want to copy invoice data into Salesforce, options? · data virtualization scenario</sub>

### An external system calls Salesforce once per record and you are running out of daily API calls. How do you fix it?
*Senior (7–10 yrs) · scenario* · `int-068`

First I find the consumer, using API usage reports, Event Monitoring and login history by integration user. Then I cut down the calls. I switch single-record calls to sObject Collections, which handle up to 200 records per call, or Composite for related operations. That alone can turn 10,000 calls into 50. I move large volumes to Bulk API 2.0. And I replace polling with Change Data Capture or platform events through the Pub/Sub API, so the system only hears about real changes instead of asking every minute. I'd also have them cache reference data and query only changed records. If volume is still legitimately high, buying more API capacity is an option, but only after fixing the design. And I'd set API usage notifications to catch it early next time.

- Identify consumer via usage reports and Event Monitoring
- Batch calls: sObject Collections / Composite
- Bulk API 2.0 for volume
- Replace polling with CDC/events
- Notifications; buy capacity only if needed

<sub>Also asked as: We keep hitting the API request limit, what do you do? · external system makes too many api calls · reduce API consumption from integration · REQUEST_LIMIT_EXCEEDED error from integration</sub>

### An integration suddenly starts failing with INVALID_SESSION_ID. What do you check?
*Fresher (0–2 yrs) · scenario* · `int-069`

INVALID_SESSION_ID means the access token is no longer valid. Common reasons: it expired after the session timeout, an admin revoked it or the session was logged out, or the token belongs to another org or My Domain. For example, someone refreshes the sandbox and the integration is still holding a token from before the refresh. I'd check that the client handles a 401 by getting a new token, through the refresh token flow, or for JWT and client credentials just by requesting a new token, and then retrying once. I'd also check the app's session and refresh token policies, whether the integration user is frozen or deactivated, and login history for failed attempts.

- Token expired, revoked, or wrong org
- Client must refresh/request a new token and retry
- Check app session and refresh token policies
- Check user status and login history

<sub>Also asked as: invalid session id error in integration · access token expired error · integration works for a while then fails with 401 · session expired invalid in api call</sub>

### A user clicks a button to check a customer's credit score from an external service before saving an opportunity. How would you build it?
*Fresher (0–2 yrs) · scenario* · `int-070`

This is request-reply, because the user needs the answer to carry on. I'd build an LWC button that calls an @AuraEnabled Apex method. The method makes the callout through a Named Credential with a sensible timeout and returns a simple result object, like score and status. In the component I show a spinner, then either the score or a friendly error if the service is slow or down, and only then let the user save. So the rep clicks Check Credit, waits a couple of seconds, sees 720 - Approved, and saves. If the service is often slow, I'd use a Continuation. A no-code alternative is External Services called from a screen flow. I'd log failures, and avoid storing sensitive data I don't need.

- Request-reply: LWC calls @AuraEnabled Apex
- Named Credential + sensible timeout
- Spinner and friendly error handling
- Continuation or External Services as options

<sub>Also asked as: Real-time credit check from Salesforce · request reply integration example · call external API from LWC button and show result · synchronous callout from lightning component</sub>

### Data from two systems keeps overwriting each other in a bidirectional sync. How would you solve it?
*Senior (7–10 yrs) · scenario* · `int-071`

First I define ownership. Ideally each field has one system of record. So Salesforce owns some fields and the ERP owns others, and each side only sends what it owns. For example, Salesforce owns the account's phone and the ERP owns the credit limit. To stop echo loops, I skip outbound sync when the change was made by the integration user, or compare a last-synced hash or timestamp so unchanged data isn't sent back. Otherwise the ERP updates a record, Salesforce sees a change and sends it back, the ERP sees a change, and it keeps bouncing. Where both sides can edit the same field, I pick a rule like last-writer-wins using a reliable modified timestamp, or send conflicts to a review queue. I also make sure updates are idempotent and ordered per record.

- Field-level system of record
- Ignore changes made by the integration user
- Compare hash or timestamp to skip echoes
- Explicit conflict rule or review queue

<sub>Also asked as: bidirectional sync conflict resolution · integration loop where updates bounce back and forth · How do you prevent infinite update loops between Salesforce and an ERP? · two systems updating the same field</sub>

### The business wants the ERP to know immediately when an Opportunity is Closed Won, without writing Apex. How would you do it?
*Mid (3–6 yrs) · scenario* · `int-072`

There are good declarative options. If the ERP or middleware can subscribe to events, I'd have a record-triggered Flow publish a platform event, like Deal_Won__e, when the stage changes to Closed Won, carrying the fields the ERP needs, like amount, account number and products. The middleware subscribes through the Pub/Sub API. If the ERP exposes a REST API with an OpenAPI spec, I could register it with External Services and call it from an asynchronous path in the record-triggered flow. For a simple SOAP receiver, the flow can send an Outbound Message, which retries for up to 24 hours. Workflow Rules and Process Builder are end of support, so Flow is the tool. All three options mean an admin can maintain it without Apex.

- Flow publishes a platform event
- External Services action on async path
- Outbound Message from Flow for SOAP receivers
- Use Flow, not Workflow/Process Builder

<sub>Also asked as: no code integration when opportunity is closed won · Send data to an external system from Flow · declarative integration options in salesforce · notify erp on closed won using flow</sub>

### You need to connect Salesforce to a new third-party REST API. What steps would you follow?
*Fresher (0–2 yrs) · scenario* · `int-073`

I start by understanding the API documentation: endpoints, authentication method, request and response formats, rate limits and error codes. I test it in Postman first, so I know exactly what a good and a bad response look like before writing code. Then I set up an External Credential for the auth and a Named Credential for the base URL, with permission set access for the users who'll trigger it. I write a small Apex service class with wrapper classes for the JSON, proper status code handling and logging, called asynchronously if it starts from a trigger. Say it's a shipping rates API. In Postman I'd see it returns 429 after a burst of calls, so I'd handle that in the code. Finally, I write tests with HttpCalloutMock, set separate endpoints for sandbox and production, and document the integration.

- Study docs and test in Postman
- External + Named Credential, permission set
- Apex service with wrappers, errors, logging
- Mock tests; separate sandbox and prod endpoints

<sub>Also asked as: Walk me through setting up a new API integration · steps to integrate salesforce with an external rest api · How do you start a new integration project? · first time api integration checklist</sub>

### An external system sends the same order event multiple times and sometimes out of order. How do you handle it in Salesforce?
*Senior (7–10 yrs) · scenario* · `int-074`

For duplicates, I upsert on the external order Id and store the message Id, so a repeated message either does nothing or produces the same result. For ordering, I ask the source to include a version number or a source timestamp on each message and store the last applied value on the record. When a message arrives, I only apply it if its version is newer than the stored one; older messages are logged and skipped. Status transitions can also be validated, so a shipped order can't go back to pending. If ordering is critical across many messages, middleware with ordered queues per key is a better place to enforce it.

- Upsert on external Id + store message Id
- Version or source timestamp per message
- Apply only if newer than stored version
- Validate state transitions; middleware for strict ordering

<sub>Also asked as: duplicate and out of order messages from integration · How do you make sure an older update doesn't overwrite a newer one? · message ordering in event driven integration · same webhook received twice</sub>

### How would you design logging and monitoring for all integrations in an org?
*Senior (7–10 yrs) · design* · `int-075`

I'd create one reusable logging service that every integration uses. It writes to an Integration Log object with integration name, direction, endpoint, status, duration, correlation Id, related record and error details. Payloads are trimmed and sensitive data is masked. Logging goes through a platform event with Publish Immediately, so it survives rollbacks. I'd pass a correlation Id in a header so we can trace one transaction across Salesforce and middleware. For example, when a customer says their order never reached the warehouse, support searches that one correlation Id and sees Salesforce sent it, MuleSoft received it, and the warehouse API returned an error. On top, I'd build dashboards and alerts for error rates and stuck items, monitor API usage and certificate expiry, and set a retention policy to purge old logs.

- Shared logging service + log object
- Log via Publish Immediately platform event
- Correlation Id across systems
- Dashboards, alerts, cert and API monitoring
- Mask data; purge old logs

<sub>Also asked as: Integration monitoring framework design · how do you know when an integration fails in production · central error logging for integrations · integration observability in salesforce</sub>
