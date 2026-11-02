# Email notifications

Task and expense notifications are also emailed to the same household members
who receive the in-app notifications. Email delivery is optional and disabled
unless SMTP settings are configured.

Before starting the backend, set these environment variables in the shell:

```sh
export COHABIT_MAIL_ENABLED=true
export COHABIT_MAIL_HOST=smtp.gmail.com
export COHABIT_MAIL_PORT=587
export COHABIT_MAIL_USERNAME='your-smtp-username'
export COHABIT_MAIL_PASSWORD='your-smtp-password'
export COHABIT_MAIL_FROM='your-verified-sender@example.com'
export COHABIT_APP_URL='http://localhost:5173'
```

Then run the backend from this directory:

```sh
./mvnw spring-boot:run
```

The default SMTP settings use authentication and STARTTLS on port 587. Set
`COHABIT_MAIL_SMTP_AUTH` or `COHABIT_MAIL_STARTTLS` to `false` if the provider
requires different settings. Keep SMTP credentials out of source control.
Set `COHABIT_APP_URL` to the deployed frontend origin outside local development
so email buttons open the correct expense or task page.
