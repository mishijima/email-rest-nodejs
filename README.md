# Email REST API

## Description
This application acts as an abstraction between 2 email providers.
It supports a failover from one provider to the other by doing a simple health check on the providers.

This application uses MailGun and SendGrid as its providers, please refer to for more information on their APIs

* https://sendgrid.com/docs/API_Reference/Web_API_v3/index.html
* https://documentation.mailgun.com/en/latest/user_manual.html#sending-via-api

## Tech stack
* NodeJS 8.9.x
* Some libraries defined in package.json



## Todo
* Send a notification to someone if it failed to connect to both providers
* Integration and unit test
* Limit the number of requests the client can make
* 'Model' isn't implemented yet
* Connection to a database
* Add failed job into a queue table
* Add successful job into a history table
* Scheduler to go through the list of items in the 'queue' table



## Architecture

### Layers
* Controller - Handles the request, processes it and returns a response
* Model - Holds the entity models
* Routes - Handles the route mappings

### Configuration properties
* settings.js - define default or production envinronment. e.g To run it in production mode
```text
NODE_ENV=production node server.js
```


## Process flow
1. Client sends a request to /api/emails
2. emailRoute accepts the requests and calls emailCtrl#sendEmail()
3. emailCtrl#save() does the following
    * Validates the inputs and will return response error if it doesn't pass the validation
    * Executes health check on the primary provider and if it fails it'll try the secondary provider. When both fails it return 'Your email has been added to the queue'. Refer to TODO for the email queue table
    * Constructs the request body according to the selected provider
    * Does a fetch to an email provider
    * It will return 'email has been sent' or 'added to the queue' based on the response status code from the provider. Refer to emailController#constructResponseObj



## Setup

### Mail providers
* Create an account with SendGrid and MailGun
* Take notes on the api url and key
* Update the settings.js - default can be for local/dev else production
    * Update http-api.url and http-api.key on mailgun and sendgrid properties
    * You can leave http-api.from empty because it's not being used at the moment

### Install npm modules
```text
npm install
```

## How to run it from the command line

Once you have finished with the setup, you can execute the following command to run it.


```text
// Production mode
NODE_ENV=production node server.js

// Default mode
node server.js
```

Once started you should see the following lines and can start using it
```text
Server started on: 7000
```



## Endpoints
#### Sending an email
A 'POST' request is used to send an email to one or more recipients. 'to', 'cc' and 'bcc' are optionals but at least one has to be set.

Request structure

* "from" - The sender in String - Mandatory
* "to" - An array of recipients in String - Optionals - Max 10 recipients
* "cc" - An array of recipients in String - Optionals- Max 10 recipients
* "bcc" - An array of recipients in String - Optionals - Max 10 recipients
* "subject" - The email subject - Mandatory
* "text" - The email body - Mandatory

Request example

```text
POST /api/emails HTTP/1.1
Content-Type: application/json;charset=UTF-8
Host: localhost
Content-Length: <xyz>

{
  "from": "whoami@example.org",
  "to": [
    "john@example.org"
  ],
  "cc": [
	"peter@example.org"
  ],
  "subject": "hello",
  "text": "this is my message from totoro email api"
}
```

Response example
```text
HTTP/1.1 201 Created
Content-Type: application/json;charset=UTF-8
Content-Length: <xyz>

{
	"message": "Your email has been sent",
	"timestamp": 1511240884934
}
```
