---
id: email-service-guide
title: Email Service Guide
slug: /developer-resources/email-service-guide
sidebar_position: 90
---

This document explains the email service architecture in Talawa API, how to use it, and how to extend it with new providers.

## Overview

The Talawa API email service is built using the **Strategy Pattern**, allowing support for multiple email providers (AWS SES, SMTP, etc.) without code duplication. The system includes an asynchronous queue for reliable email delivery and automatic retry logic for failed emails.

## Architecture

### High-Level Structure

```
src/services/email/
├── types.ts                      # Core interfaces and types
├── providers/
│   ├── SESProvider.ts            #AWS SES implementation
│   └── SMTPProvider.ts           # SMTP implementation
├── EmailProviderFactory.ts      # Provider selection logic
├── EmailQueueProcessor.ts       # Queue processing and retry logic
└── emailServiceInstance.ts      # Service initialization
```

### Component Responsibilities

**types.ts**
- Defines `IEmailProvider` interface (contract for all providers)
- Defines `EmailJob` type (email data structure)
- Defines `EmailResult` type (sending result structure)
- Contains shared types used across the email system

**EmailProviderFactory**
- Reads `API_EMAIL_PROVIDER` environment variable
- Instantiates the appropriate provider
- Validates provider configuration

**EmailQueueProcessor**
- Fetches pending emails from database
- Sends emails in batches using the configured provider
- Handles failures with exponential backoff retry
- Updates email status in database

**emailServiceInstance**
- Manages singleton instances
- Initializes background queue processor
- Provides clean shutdown mechanism

## Strategy Pattern Implementation

### The IEmailProvider Interface

All email providers must implement this interface:

```typescript
export interface IEmailProvider {
  /**
   * Send a single email
   * @param job - Email job containing recipient, subject, body, etc.
   * @returns Promise with send result (success status, messageId, error)
   */
  sendEmail(job: EmailJob): Promise<EmailResult>;

  /**
   * Send multiple emails (bulk operation)
   * @param jobs - Array of email jobs
   * @returns Promise with array of send results
   */
  sendBulkEmails(jobs: EmailJob[]): Promise<EmailResult[]>;
}
```

### Email Job Structure

```typescript
export interface EmailJob {
  id: string;           // Unique identifier for tracking
  email: string;        // Recipient email address
  subject: string;      // Email subject line
  htmlBody: string;     // HTML email content
  textBody?: string;    // Plain text fallback (optional)
  userId: string | null; // Associated user ID (for audit trail)
}
```

### Email Result Structure

```typescript
export interface EmailResult {
  id: string;           // Job ID from EmailJob
  success: boolean;     // Whether email was sent successfully
  messageId?: string;   // Provider's message ID (for tracking)
  error?: string;       // Error message if failed
}
```

##Email Providers

The Talawa API supports multiple email providers through the Strategy Pattern. You can choose between AWS SES (managed cloud service) or SMTP (standard protocol) based on your deployment needs.

### Provider Selection

Set the provider via environment variable:

```bash
API_EMAIL_PROVIDER=ses   # Use AWS SES (default)
# or
API_EMAIL_PROVIDER=smtp  # Use SMTP
```

---

## AWS SES Provider

### Configuration

The SES provider requires the following environment variables:

```bash
# Email Provider Selection
API_EMAIL_PROVIDER=ses

# AWS Configuration
API_AWS_SES_REGION=us-east-1          # Required: AWS region
API_AWS_ACCESS_KEY_ID=AKIA...         # Optional: if not using IAM roles
API_AWS_SECRET_ACCESS_KEY=...         # Optional: if not using IAM roles

# Email Settings
API_AWS_SES_FROM_EMAIL=noreply@talawa.io  # Required: sender email
API_AWS_SES_FROM_NAME=Talawa              # Optional: sender name
```

### SES Provider Features

**Lazy Initialization**
- AWS credentials and SES client are initialized on first email send
- Validates configuration before attempting to send
- Provides clear error messages for missing configuration

**Rate Limiting**
- Includes 100ms delay between emails to avoid SES throttling
- Prevents hitting AWS SES sending rate limits

**Error Handling**
- Catches and converts AWS SDK errors to EmailResult format
- Handles both Error objects and non-Error exceptions
- Returns descriptive error messages for debugging

**Configuration Validation**
```typescript
// Validates before sending
if (!this.config.region) {
  throw new Error('API_AWS_SES_REGION is required');
}

if (!this.config.fromEmail) {
  throw new Error('API_AWS_SES_FROM_EMAIL is required');
}
```

---

## SMTP Provider

The SMTP provider offers a vendor-neutral solution that works with any SMTP server, including:
- Self-hosted servers (Postfix, Sendmail)
- Popular email services (Gmail, Outlook, Yahoo)
- Web hosting providers (GoDaddy, Bluehost, etc.)

### Configuration

```bash
# Email Provider Selection
API_EMAIL_PROVIDER=smtp

# SMTP Server Settings
API_SMTP_HOST=smtp.gmail.com          # Required: SMTP server hostname  
API_SMTP_PORT=587                     # Required: SMTP port (587 for TLS, 465 for SSL)
API_SMTP_SECURE=false                 # Required: true for SSL (port 465), false for TLS (port 587)

# Authentication (optional if server doesn't require auth)
API_SMTP_USER=your-email@gmail.com    # SMTP username
API_SMTP_PASSWORD=your-app-password   # SMTP password

# Email Settings
API_SMTP_FROM_EMAIL=noreply@talawa.io # Required: sender email
API_SMTP_FROM_NAME=Talawa             # Optional: sender name (default: "Talawa")
```

### SMTP Provider Features

**Lazy Initialization**
- SMTP transporter is initialized on first email send
- Validates configuration before attempting to connect
- Provides clear error messages for connection failures

**Rate Limiting**
- Includes 100ms delay between emails to avoid throttling
- Prevents overwhelming SMTP servers

**TLS/SSL Support**
- Configurable security mode via `API_SMTP_SECURE`
- STARTTLS support for port 587
- Direct SSL/TLS for port 465

**Flexible Authentication**
- Supports username/password authentication
- Works without authentication if server allows

**Error Handling**
- Catches and converts Nodemailer errors to EmailResult format
- Returns descriptive error messages for debugging
- Handles connection timeouts and authentication failures

### Common SMTP Configurations

**Gmail**
```bash
API_SMTP_HOST=smtp.gmail.com
API_SMTP_PORT=587
API_SMTP_SECURE=false
API_SMTP_USER=your-email@gmail.com
API_SMTP_PASSWORD=your-app-password  # Use App Password, not regular password
API_SMTP_FROM_EMAIL=your-email@gmail.com
```

> **Note**: Gmail requires an "App Password" if 2FA is enabled. Generate one at: https://myaccount.google.com/apppasswords

**Outlook/Office 365**
```bash
API_SMTP_HOST=smtp-mail.outlook.com
API_SMTP_PORT=587
API_SMTP_SECURE=false
API_SMTP_USER=your-email@outlook.com
API_SMTP_PASSWORD=your-password
API_SMTP_FROM_EMAIL=your-email@outlook.com
```

**GoDaddy**
```bash
API_SMTP_HOST=smtp.secureserver.net
API_SMTP_PORT=465
API_SMTP_SECURE=true
API_SMTP_USER=your-email@yourdomain.com
API_SMTP_PASSWORD=your-password
API_SMTP_FROM_EMAIL=your-email@yourdomain.com
```

**Self-Hosted Postfix**
```bash
API_SMTP_HOST=mail.yourdomain.com
API_SMTP_PORT=587
API_SMTP_SECURE=false
# Authentication may not be required for local server
# API_SMTP_USER and API_SMTP_PASSWORD can be omitted
API_SMTP_FROM_EMAIL=noreply@yourdomain.com
```

### SMTP Security Best Practices

1. **Use TLS/STARTTLS**: Always use port 587 with `API_SMTP_SECURE=false` (STARTTLS) or port 465 with `API_SMTP_SECURE=true` (direct SSL)
2. **Never use port 25**: Port 25 is often blocked by ISPs and lacks encryption
3. **Use App Passwords**: For Gmail and other providers with 2FA, use app-specific passwords
4. **Secure Credentials**: Store SMTP credentials in environment variables, never in code
5. **Test Configuration**: Use the setup script (`npm run setup`) to verify SMTP settings

---

## Provider Comparison

| Feature | AWS SES | SMTP |
|---------|---------|------|
| **Setup Complexity** | Medium (requires AWS account) | Low (works with any provider) |
| **Cost** | Pay per email sent | Depends on hosting provider |
| **Vendor Lock-in** | AWS-specific | Vendor-neutral |
| **Reliability** | Very high (AWS infrastructure) | Depends on SMTP server |
| **Sending Limits** | High (50 emails/second default) | Varies by provider |
| **Authentication** | AWS credentials or IAM roles | Username/password |
| **Best For** | Production deployments, high volume | Development, self-hosted, flexible deployments |

## Email Queue System

### Database Schema

Emails are stored in the `email_notifications` table:

```typescript
{
  id: string;              // UUID
  userId: string | null;   // User this email is for
  email: string;           // Recipient address
  subject: string;         // Email subject
  htmlBody: string;        // HTML content
  textBody: string | null; // Plain text content
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;      // Number of send attempts
  maxRetries: number;      // Maximum retry attempts (default: 3)
  sesMessageId: string | null; // SES tracking ID
  error: string | null;    // Last error message
  sentAt: Date | null;     // When successfully sent
  createdAt: Date;         // When queued
  updatedAt: Date;         // Last modification
}
```

### Queue Processing

The queue processor runs as a background task:

```typescript
// Initialization (happens on server startup)
await emailQueueInstance.initializeEmailQueue();

// Processing cycle
1. Fetch pending emails (status = 'pending')
2. Send in batches using configured provider
3. Update status based on results:
   - Success: status='sent', store messageId, set sentAt
   - Failure: increment retryCount, store error
   - Max retries: status='failed'
4. Wait for next cycle (configurable interval)
```

### Retry Logic

**Exponential Backoff Strategy**

```typescript
// Retry delays
Attempt 1: Immediate
Attempt 2: After 5 minutes
Attempt 3: After 15 minutes
Max Retries: 3 (default, configurable per email)
```

**Retry Example**

```typescript
// Email fails on first attempt
retryCount: 0 -> 1
nextRetryAt: current time + 5 minutes

// Processor picks it up again after 5 minutes
retryCount: 1 -> 2
nextRetryAt: current time + 15 minutes

// Fails again after 15 minutes
retryCount: 2 -> 3
status: 'pending' -> 'failed' (max retries reached)
```

## How to Use the Email Service

### Sending a Single Email

```typescript
import { emailService } from '~/src/services/email/emailServiceInstance';

// Create email job
const emailJob: EmailJob = {
  id: generateUUID(),
  email: 'user@example.com',
  subject: 'Welcome to Talawa',
  htmlBody: '<h1>Welcome!</h1><p>Thanks for joining.</p>',
  textBody: 'Welcome! Thanks for joining.',
  userId: user.id,
};

// Send immediately (not queued)
const result = await emailService.sendEmail(emailJob);

if (result.success) {
  console.log(`Email sent: ${result.messageId}`);
} else {
  console.error(`Email failed: ${result.error}`);
}
```

### Queuing Emails for Background Processing

```typescript
import { drizzleClient } from '~/src/fastifyPlugins/drizzleClient';
import { emailNotificationsTable } from '~/src/db/schema/emailNotifications.drizzle';

// Insert email into queue
await drizzleClient.insert(emailNotificationsTable).values({
  id: generateUUID(),
  userId: user.id,
  email: 'user@example.com',
  subject: 'Password Reset',
  htmlBody: resetEmailHtml,
  textBody: resetEmailText,
  status: 'pending',
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Background processor will send it automatically
```

### Sending Bulk Emails

```typescript
import { emailService } from '~/src/services/email/emailServiceInstance';

const emailJobs: EmailJob[] = users.map(user => ({
  id: generateUUID(),
  email: user.email,
  subject: 'Event Reminder',
  htmlBody: generateEventEmailHtml(user, event),
  userId: user.id,
}));

// Send all emails
const results = await emailService.sendBulkEmails(emailJobs);

// Check results
const successful = results.filter(r => r.success).length;
const failed = results.filter(r => !r.success).length;
console.log(`Sent: ${successful}, Failed: ${failed}`);
```

## Adding a New Email Provider

To add support for a new provider (e.g., SMTP, SendGrid, Mailgun):

### Step 1: Create Provider Implementation

Create a new file `src/services/email/providers/YourProvider.ts`:

```typescript
import type { IEmailProvider, EmailJob, EmailResult } from '../types';

export interface YourProviderConfig {
  // Provider-specific configuration
  apiKey: string;
  apiUrl?: string;
}

export class YourProvider implements IEmailProvider {
  private config: YourProviderConfig;

  constructor(config: YourProviderConfig) {
    this.config = config;
  }

  async sendEmail(job: EmailJob): Promise<EmailResult> {
    try {
      // Validate configuration
      if (!this.config.apiKey) {
        throw new Error('API_KEY is required for YourProvider');
      }

      // Send using provider's API
      const response = await yourProviderSdk.send({
        to: job.email,
        subject: job.subject,
        html: job.htmlBody,
        text: job.textBody,
      });

      return {
        id: job.id,
        success: true,
        messageId: response.messageId,
      };
    } catch (error) {
      return {
        id: job.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async sendBulkEmails(jobs: EmailJob[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    
    for (const job of jobs) {
      results.push(await this.sendEmail(job));
    }
    
    return results;
  }
}
```

### Step 2: Update Factory

Update `src/services/email/EmailProviderFactory.ts`:

```typescript
import { YourProvider } from './providers/YourProvider';

export const EmailProviderFactory = {
  create(config: EmailEnvConfig): IEmailProvider {
    switch (config.emailProvider) {
      case 'ses':
        return new SESProvider({
          region: config.awsSesRegion,
          // ... SES config
        });

      case 'yourprovider':
        return new YourProvider({
          apiKey: config.yourProviderApiKey,
          // ... Your provider config
        });

      default:
        throw new Error(`Unsupported email provider: ${config.emailProvider}`);
    }
  },
};
```

### Step 3: Update Environment Schema

Update `src/envConfigSchema.ts`:

```typescript
API_EMAIL_PROVIDER: z
  .enum(['ses', 'smtp', 'yourprovider'])
  .default('ses')
  .optional(),

// Add provider-specific config
YOUR_PROVIDER_API_KEY: z.string().optional(),
```

### Step 4: Add Tests

Create `test/services/email/YourProvider.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { YourProvider } from '~/src/services/email/providers/YourProvider';

describe('YourProvider', () => {
  it('should send email successfully', async () => {
    const provider = new YourProvider({ apiKey: 'test-key' });
    
    const job = {
      id: '1',
      email: 'test@example.com',
      subject: 'Test',
      htmlBody: '<p>Test</p>',
      userId: 'user1',
    };

    const result = await provider.sendEmail(job);
    
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    const provider = new YourProvider({ apiKey: '' });
    
    const job = {
      id: '1',
      email: 'test@example.com',
      subject: 'Test',
      htmlBody: '<p>Test</p>',
      userId: 'user1',
    };

    const result = await provider.sendEmail(job);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### Step 5: Update Documentation

Update this file and the configuration documentation with your new provider's settings.

## Configuration Reference

### Environment Variables

**Required for Any Provider**
```bash
API_EMAIL_PROVIDER=ses              # Provider to use ('ses' or 'smtp')
API_ENABLE_EMAIL_QUEUE=true         # Enable background queue
```

**AWS SES Provider**
```bash
API_AWS_SES_REGION=us-east-1            # AWS region
API_AWS_SES_FROM_EMAIL=noreply@talawa.io # Sender email (required)
API_AWS_SES_FROM_NAME=Talawa            # Sender name (optional)

# Optional: if not using IAM roles
API_AWS_ACCESS_KEY_ID=AKIA...
API_AWS_SECRET_ACCESS_KEY=...
```

**SMTP Provider**
```bash
API_SMTP_HOST=smtp.example.com          # SMTP server hostname (required)
API_SMTP_PORT=587                       # SMTP port (required)
API_SMTP_SECURE=false                   # Use SSL/TLS (required)
API_SMTP_USER=user@example.com          # SMTP username (optional)
API_SMTP_PASSWORD=password              # SMTP password (optional)
API_SMTP_FROM_EMAIL=noreply@talawa.io   # Sender email (required)
API_SMTP_FROM_NAME=Talawa               # Sender name (optional)
API_SMTP_NAME=client.hostname.com       # Client hostname for HELO/EHLO (optional)
API_SMTP_LOCAL_ADDRESS=192.168.1.10     # Local bind IP address (optional)
```

**Queue Processing**
```bash
EMAIL_QUEUE_INTERVAL=60000          # Processing interval in ms (default: 60s)
EMAIL_MAX_RETRIES=3                 # Max retry attempts per email
```

### Configuration Validation

The system validates configuration on startup:

```typescript
// In EmailProviderFactory
if (!config.awsSesRegion) {
  throw new Error('API_AWS_SES_REGION is required when using SES provider');
}

// Provider-specific validation in each provider's constructor
```

## Troubleshooting

### Email Not Sending

**Check queue status:**
```typescript
// Query pending emails
const pending = await drizzleClient.query.emailNotificationsTable.findMany({
  where: eq(emailNotificationsTable.status, 'pending'),
});

console.log(`Pending emails: ${pending.length}`);
```

**Check queue processor:**
```typescript
// Verify queue is running
const isRunning = emailQueueInstance.isQueueRunning();
console.log(`Queue running: ${isRunning}`);
```

**Check failed emails:**
```typescript
// Query failed emails
const failed = await drizzleClient.query.emailNotificationsTable.findMany({
  where: eq(emailNotificationsTable.status, 'failed'),
  orderBy: desc(emailNotificationsTable.updatedAt),
  limit: 10,
});

// Review error messages
failed.forEach(email => {
  console.log(`Email ${email.id}: ${email.error}`);
});
```

### AWS SES Issues

**Verify SES region:**
```bash
# Check if region is accessible
aws ses get-send-quota --region us-east-1
```

**Verify from email:**
```bash
# List verified email identities
aws ses list-verified-email-addresses --region us-east-1
```

**Check SES limits:**
```bash
# View sending quota
aws ses get-send-quota --region us-east-1
```

**Common SES errors:**

1. **"Email address not verified"**
   - Verify the sender email in AWS SES console
   - See: https://docs.aws.amazon.com/ses/latest/dg/verify-email-addresses.html

2. **"Daily sending quota exceeded"**
   - Check your SES sending limits
   - Request limit increase if needed

3. **"Message rejected: Email address is not verified"**
   - In sandbox mode, verify both sender and recipient
   - Request production access for SES

### SMTP Issues

**Connection refused:**

1. **Check firewall settings:**
   - Ensure outbound connections to SMTP port are allowed
   - Common ports: 587 (TLS), 465 (SSL)

2. **Verify SMTP host and port:**
   ```bash
   # Test SMTP connection
   telnet smtp.example.com 587
   # or
   openssl s_client -connect smtp.example.com:465 -crlf
   ```

3. **Check SMTP server status:**
   - Verify your email provider's status page
   - Some providers block SMTP by default (requires enabling)

**Authentication failed:**

1. **Verify credentials:**
   - Double-check API_SMTP_USER and API_SMTP_PASSWORD
   - For Gmail, use App Password (not regular password)
   - For Office 365, ensure account allows SMTP access

2. **Check authentication requirements:**
   ```typescript
   // Some servers don't require auth
   // Omit API_SMTP_USER and API_SMTP_PASSWORD if not needed
   ```

**SSL/TLS errors:**

1. **Use correct API_SMTP_SECURE setting:**
   - Port 587: `API_SMTP_SECURE=false` (uses STARTTLS)
   - Port 465: `API_SMTP_SECURE=true` (direct SSL/TLS)
   - Never use port 25 (unencrypted)

2. **Certificate issues:**
   - Ensure system time is correct
   - Update system CA certificates

**Common SMTP Provider Issues:**

**Gmail:**
- Enable "Less secure app access" (if not using App Password)
- Generate App Password: https://myaccount.google.com/apppasswords
- Check for "suspicious activity" blocks in Gmail account

**Outlook/Office 365:**
- Enable SMTP AUTH in  Exchange admin center
- Check if account requires multi-factor authentication
- Verify account isn't suspended or limited

**GoDaddy:**
- Ensure email hosting is active
- Use workspace email credentials (not cPanel login) 
- Check if SMTP relay is enabled for your plan

**Self-Hosted:**
- Verify Postfix/Sendmail is running: `sudo systemctl status postfix`
- Check mail logs: `sudo tail -f /var/log/mail.log`
- Ensure DNS records (SPF, DKIM, DMARC) are configured

### Queue Processor Issues

**Queue not processing:**

1. Check if queue is enabled:
   ```bash
   API_ENABLE_EMAIL_QUEUE=true
   ```

2. Check server logs for initialization errors:
   ```
   "Email queue processor initialized"
   ```

3. Verify database connectivity:
   ```typescript
   // Test database connection
   await drizzleClient.select().from(emailNotificationsTable).limit(1);
   ```

**Emails stuck in pending:**

1. Check retry count:
   ```sql
   SELECT id, retryCount, error FROM email_notifications WHERE status = 'pending';
   ```

2. Reset retry count if needed:
   ```typescript
   await drizzleClient
     .update(emailNotificationsTable)
     .set({ retryCount: 0, updatedAt: new Date() })
     .where(eq(emailNotificationsTable.id, emailId));
   ```

## Best Practices

### 1. Always Queue Non-Critical Emails

Queue emails that don't need immediate delivery:

```typescript
// GOOD - Queue welcome emails
await insertIntoQueue({
  email: user.email,
  subject: 'Welcome to Talawa',
  htmlBody: welcomeEmail,
});

// GOOD - Send critical emails immediately
const result = await emailService.sendEmail({
  email: user.email,
  subject: 'Password Reset Code',
  htmlBody: resetCode,
});
```

### 2. Always Provide Plain Text Alternative

```typescript
// GOOD - Provide both HTML and plain text
{
  htmlBody: '<h1>Welcome</h1><p>Thanks for joining!</p>',
  textBody: 'Welcome\n\nThanks for joining!',
}

// BAD - HTML only
{
  htmlBody: '<h1>Welcome</h1><p>Thanks for joining!</p>',
  // textBody missing - email clients may mark as spam
}
```

### 3. Use Descriptive Subjects

```typescript
// GOOD
subject: 'Your Talawa Password Reset Link'

// BAD - Too generic
subject: 'Reset Password'
```

### 4. Handle Send Failures Gracefully

```typescript
const result = await emailService.sendEmail(job);

if (!result.success) {
  // Log for debugging
  logger.error('Email send failed', {
    emailId: job.id,
    error: result.error,
  });
  
  // Don't fail the entire operation
  // Return appropriate error to user
  return {
    success: true,
    message: 'Account created. If you don\'t receive the email, check spam folder.',
  };
}
```

### 5. Respect User Preferences

```typescript
// Check if user wants email notifications
const user = await getUserById(userId);

if (user.emailNotificationsEnabled) {
  await queueEmail({ email: user.email, ... });
}
```

### 6. Rate Limit Bulk Operations

```typescript
// GOOD - Batch emails to avoid overwhelming the queue
const batches = chunk(users, 100); // Process 100 at a time

for (const batch of batches) {
  const jobs = batch.map(user => createEmailJob(user));
  await emailService.sendBulkEmails(jobs);
  
  // Optional: delay between batches
  await sleep(1000);
}

// BAD - Queue 10,000 emails at once
await Promise.all(users.map(user => queueEmail(user)));
```

### 7. Test Email Templates

```typescript
// Create helper for testing email templates
export function previewEmail(template: string, data: any): string {
  const html = renderTemplate(template, data);
  
  // Save to file for browser preview
  fs.writeFileSync('/tmp/email-preview.html', html);
  
  return html;
}
```

### 8. Monitor Email Metrics

```typescript
// Track email delivery metrics
const metrics = {
  sent: await countByStatus('sent'),
  failed: await countByStatus('failed'),
  pending: await countByStatus('pending'),
  retrying: await countRetrying(),
};

logger.info('Email metrics', metrics);
```

## Testing

### Unit Testing Email Providers

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('SESProvider', () => {
  it('should send email successfully', async () => {
    // Mock AWS SDK
    const mockSend = vi.fn().mockResolvedValue({ MessageId: 'msg-123' });
    vi.mocked(SESClient).prototype.send = mockSend;

    const provider = new SESProvider({ region: 'us-east-1', ... });
    const result = await provider.sendEmail(testJob);

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg-123');
  });
});
```

### Integration Testing Queue

```typescript
describe('Email Queue Integration', () => {
  it('should process queued emails', async () => {
    // Insert test email
    await drizzleClient.insert(emailNotificationsTable).values({
      id: 'test-1',
      email: 'test@example.com',
      subject: 'Test',
      htmlBody: '<p>Test</p>',
      status: 'pending',
    });

    // Process queue
    await emailQueueProcessor.processPendingEmails();

    // Verify sent
    const email = await getEmailById('test-1');
    expect(email.status).toBe('sent');
    expect(email.sesMessageId).toBeDefined();
  });
});
```

### Testing Email Templates

```typescript
describe('Email Templates', () => {
  it('should render welcome email correctly', () => {
    const html = renderWelcomeEmail({
      firstName: 'John',
      organizationName: 'Test Org',
    });

    expect(html).toContain('Welcome, John!');
    expect(html).toContain('Test Org');
    expect(html).toMatch(/<html/);
  });
});
```

## Future Improvements

### Planned Features

1. **Additional Email Providers**
   - SendGrid integration
   - Mailgun integration
   - Resend integration

2. **Email Templates System**
   - Template engine integration (Handlebars/Mustache)
   - Reusable email components
   - Multi-language support

3. **Email Analytics**
   - Open tracking
   - Click tracking
   - Bounce handling
   - Delivery reports

4. **Enhanced Queue Management**
   - Priority queues
   - Scheduled send times
   - Batch processing optimization
   - Dead letter queue for permanently failed emails

5. **Email Attachments**
   - Support for file attachments
   - Inline images
   - Size limits and validation

---

## Summary

The Talawa API email service provides a flexible, reliable system for sending emails using a provider-agnostic architecture. With support for both AWS SES and SMTP, you can choose the solution that best fits your deployment needs. The queue-based processing with automatic retries ensures reliable delivery, while the Strategy Pattern makes it easy to add new providers in the future.

4. **Advanced Queue Features**
   - Priority queue (send important emails first)
   - Scheduled sends (send at specific time)
   - Batch optimization

### Performance Optimizations

**Batch Processing Improvement**
```typescript
// Current: Sequential sending
for (const job of jobs) {
  results.push(await sendEmail(job));
}

// Future: Parallel batch sending (AWS SES supports batch API)
const sesResults = await sesClient.sendBulkTemplatedEmail({
  Destinations: jobs.map(j => ({ Destination: { ToAddresses: [j.email] } })),
});
```

## Related Documentation

- [Error Handling Guide](./error-handling.md)
- [Authentication Guide](./authentication-authorization.md)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Strategy Pattern (Design Patterns)](https://refactoring.guru/design-patterns/strategy)

## Summary

The Talawa API email service provides:

1. **Flexibility:** Easy to add new email providers via Strategy Pattern
2. **Reliability:** Automatic retry with exponential backoff
3. **Scalability:** Asynchronous queue for background processing
4. **Maintainability:** Clear separation of concerns and comprehensive tests
5. **Observability:** Database-backed queue with status tracking

When working with emails:
- Use the queue for non-critical emails
- Always provide plain text alternatives
- Handle failures gracefully
- Test email templates thoroughly
- Monitor queue health and metrics

For questions or issues, refer to the troubleshooting section or consult the test files for working examples.
