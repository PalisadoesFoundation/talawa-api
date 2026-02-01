---
id: email-configuration
title: Email Configuration
slug: /installation/email-configuration
sidebar_position: 4
---

This document provides comprehensive instructions on configuring email functionality in Talawa API, including development testing with Mailpit and production deployment with AWS SES or SMTP providers.

## Overview

Talawa API supports three email providers:

| Provider | Use Case | Default? |
|----------|----------|----------|
| **Mailpit** | Local development and testing | ✅ Yes |
| **AWS SES** | Production deployments | No |
| **SMTP** | Production with external providers | No |

## Development Setup (Mailpit)

Mailpit is automatically configured as the default email provider when you run the setup script or use the development container setup. This allows you to test email functionality without sending real emails.

### Default Configuration

When using the default development setup, the following values are automatically configured:

```env
API_EMAIL_PROVIDER=mailpit
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_FROM_EMAIL=test@talawa.local
SMTP_FROM_NAME=Talawa
```

### Accessing the Mailpit Web Interface

Mailpit provides a web interface to view all captured emails:

1. **URL**: http://localhost:8025
2. **Features**:
   - View all captured emails
   - Inspect email headers and content (HTML/Text)
   - Search and filter emails
   - Download email attachments
   - Clear all messages for testing

### Docker Compose Port Mapping

The following environment variables control how Mailpit is exposed on your host machine (configured automatically in development):

| Variable | Default | Description |
|----------|---------|-------------|
| `MAILPIT_MAPPED_HOST_IP` | `127.0.0.1` | Host IP for Mailpit ports |
| `MAILPIT_WEB_MAPPED_PORT` | `8025` | Web UI port on host |
| `MAILPIT_SMTP_MAPPED_PORT` | `1025` | SMTP port on host |

These are used by Docker Compose and are already set in the default `.env.devcontainer` file.

## Production Setup

For production environments, you should configure either AWS SES or an SMTP provider.

### Option 1: AWS SES (Recommended)

AWS Simple Email Service is the recommended choice for production due to its reliability and scalability.

#### Required Configuration

```env
API_EMAIL_PROVIDER=ses
AWS_SES_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_SES_FROM_EMAIL=verified-sender@yourdomain.com
AWS_SES_FROM_NAME=Your Organization Name
```

#### Setup Steps

1. **Create an AWS account** if you don't have one
2. **Verify your domain or email address** in AWS SES:
   - Go to AWS SES Console → Identity Management
   - Add and verify your domain or email address
3. **Create SMTP credentials** or use AWS Access Keys
4. **Request production access** (SES starts in sandbox mode which only allows sending to verified addresses)

#### Testing SES Configuration

You can test your SES configuration during the setup process:

```bash
pnpm run setup
# When prompted, choose to manually configure email
# Select SES provider and enter your credentials
# Choose to send a test email to verify everything works
```

### Option 2: SMTP Provider

You can use any SMTP-compatible email service (Gmail, SendGrid, Mailgun, etc.).

#### Required Configuration

```env
API_EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SECURE=false
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Your Organization Name
```

#### Common SMTP Providers

**Gmail:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```
- Use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.com
SMTP_PASSWORD=your-mailgun-password
```

## Testing Email Functionality

### Using Mailpit in Tests

Talawa API includes test helpers for verifying email functionality when using Mailpit:

```typescript
import { 
  getMailpitMessages, 
  findMessageByRecipient, 
  getMailpitMessageDetails,
  clearMailpitMessages,
  waitForEmail 
} from "./helpers/mailpitHelpers";

// Example: Test that a welcome email was sent
async function testWelcomeEmail() {
  // Clear any existing messages
  await clearMailpitMessages();
  
  // Trigger an action that sends an email
  await signUpUser("newuser@example.com");
  
  // Wait for and retrieve the email
  const email = await waitForEmail("newuser@example.com");
  
  // Verify email properties
  expect(email.Subject).toContain("Verify Your Email");
  expect(email.From.Address).toBe("test@talawa.local");
  
  // Get full email details including HTML/Text body
  const details = await getMailpitMessageDetails(email.ID);
  expect(details.HTML).toContain("Welcome to talawa");
  expect(details.Text).toContain("Welcome to talawa");
}
```

### Available Test Helpers

| Helper Function | Description |
|-----------------|-------------|
| `getMailpitMessages()` | Get all captured emails from Mailpit |
| `getMailpitMessageDetails(id)` | Get detailed information about a specific email including body content |
| `clearMailpitMessages()` | Delete all messages from Mailpit (useful for test cleanup) |
| `findMessageByRecipient(messages, email)` | Find an email by recipient address |
| `findMessagesBySubject(messages, text)` | Find emails containing text in the subject |
| `waitForEmail(email, timeoutMs)` | Poll Mailpit until an email arrives (useful for async testing) |
| `isMailpitRunning()` | Check if Mailpit is available |
| `getMailpitInfo()` | Get Mailpit server information |
| `markMessageAsRead(id)` | Mark a message as read |
| `deleteMessage(id)` | Delete a specific message |

### Manual Testing via API

You can also test emails manually using the GraphQL API:

```graphql
mutation SignUp {
  signUp(
    input: {
      emailAddress: "test@example.com"
      name: "Test User"
      password: "password123"
      selectedOrganization: "org-id-here"
    }
  ) {
    user {
      id
      emailAddress
    }
  }
}
```

Then check the Mailpit web interface at http://localhost:8025 to see the captured verification email.

## Switching Between Providers

### Development to Production

When moving from development to production:

1. Update `.env` file or environment variables
2. Change `API_EMAIL_PROVIDER` from `mailpit` to `ses` or `smtp`
3. Add the required provider-specific configuration
4. Restart the server

### Using Setup Script

The easiest way to switch providers is using the interactive setup script:

```bash
pnpm run setup
```

When prompted about email configuration:
1. Answer "Yes" to manually configure email
2. Select your preferred provider (SES or SMTP)
3. Enter the required credentials
4. Optionally send a test email to verify the configuration

## Troubleshooting

### Mailpit Issues

**Can't access http://localhost:8025:**
- Verify Mailpit container is running: `docker ps | grep mailpit`
- Check that ports aren't already in use: `lsof -i :8025`
- Review Docker Compose logs: `docker compose logs mailpit`

**Emails not appearing in Mailpit:**
- Verify `API_EMAIL_PROVIDER=mailpit` is set
- Check the API logs for SMTP connection errors
- Ensure the Mailpit container is on the same Docker network as the API

### AWS SES Issues

**"Email address not verified" error:**
- AWS SES starts in sandbox mode
- You must verify sender AND recipient email addresses in the SES console
- Or request production access to remove sandbox restrictions

**Authentication errors:**
- Verify your AWS credentials are correct
- Ensure the IAM user has `ses:SendEmail` permission
- Check that you're using the correct AWS region

### SMTP Issues

**Connection timeouts:**
- Verify the SMTP host and port are correct
- Check firewall settings
- Some providers require specific IP whitelisting

**Authentication failures:**
- For Gmail: Use an App Password, not your regular password
- For SendGrid: The username is literally the string "apikey"
- Check if your provider requires specific authentication methods

## Security Considerations

1. **Never commit email credentials to git** - Always use `.env` files or secret management
2. **Use App Passwords** for Gmail and other providers that support them
3. **Rotate credentials regularly** - Especially AWS access keys
4. **Enable 2FA** on your email provider accounts
5. **Use TLS/SSL** - Always set `SMTP_SECURE=true` when using port 465
6. **Verify sender addresses** - Ensure all sender emails are authorized by your provider

## Additional Resources

- [Mailpit Documentation](https://github.com/axllent/mailpit)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Nodemailer SMTP Documentation](https://nodemailer.com/smtp/)
- [Environment Variables Reference](./environment-variables.md)
