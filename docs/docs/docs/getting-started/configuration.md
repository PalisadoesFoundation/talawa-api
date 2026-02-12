---
id: configuration
title: Configuration
slug: /configuration
sidebar_position: 2
---

This document provides instructions on how to set up and start a running instance of talawa-api on your local system. The instructions are written to be followed in sequence so make sure to go through each of them step by step without skipping any sections.

## Introduction

The correct configuration steps to take depends on whether you are:

1. an end user installing our software (Production Environments) or,
2. one of our open source contributors (Development Environments).

### Prerequisities

Make sure that you have correctly installed all the requried components beforehand. Use our [Installation Guide](./installation.md) for assistance.

### The `.env` Configuration File

You'll need to create a configuration file named `.env` in the repository's root directory.

This table defines the most important parameters in the file that will be required for the smooth operation of the app.

**NOTE:** A full list of parameters can be found in the [Configuration Variables Page](./environment-variables.md).

| **Variable**                           | **Use Case**                                                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `API_ADMINISTRATOR_USER_EMAIL_ADDRESS` | Email address of the administrator user.                                                                                      |
| `API_ADMINISTRATOR_USER_NAME`          | Username of the administrator user, used for admin login and identification.                                                  |
| `API_ADMINISTRATOR_USER_PASSWORD`      | Password for the administrator user, used for admin login security.                                                           |
| `API_BASE_URL`                         | Base URL for the API, used for constructing API endpoints and routing requests.                                               |
| `API_COMMUNITY_FACEBOOK_URL`           | URL to the community's Facebook page, used for linking and integrating social media presence.                                 |
| `API_COMMUNITY_GITHUB_URL`             | URL to the community's GitHub repository, used for linking and integrating code repository.                                   |
| `API_COMMUNITY_INSTAGRAM_URL`          | URL to the community's Instagram page, used for linking and integrating social media presence.                                |
| `API_COMMUNITY_LINKEDIN_URL`           | URL to the community's LinkedIn page, used for linking and integrating social media presence.                                 |
| `API_COMMUNITY_NAME`                   | Name of the community, used for branding and identification within the application.                                           |
| `API_COMMUNITY_REDDIT_URL`             | URL to the community's Reddit page, used for linking and integrating social media presence.                                   |
| `API_COMMUNITY_SLACK_URL`              | URL to the community's Slack workspace, used for linking and integrating communication channels.                              |
| `API_COMMUNITY_WEBSITE_URL`            | URL to the community's website, used for linking and integrating online presence.                                             |
| `API_COMMUNITY_X_URL`                  | URL to the community's X (formerly Twitter) page, used for linking and integrating social media presence.                     |
| `API_COMMUNITY_YOUTUBE_URL`            | URL to the community's YouTube channel, used for linking and integrating video content.                                       |
| `API_JWT_SECRET`                       | Secret key for JWT(JSON Web Token) generation and validation, used for securing API authentication and authorization.         |
| `API_MINIO_SECRET_KEY`                 | Secret key for MinIO, used for securing access to MinIO object storage. **NOTE:** Must match `MINIO_ROOT_PASSWORD`            |
| `API_POSTGRES_PASSWORD`                | Password for the PostgreSQL database, used for database authentication and security. **NOTE:** Must match `POSTGRES_PASSWORD` |
| `CADDY_TALAWA_API_DOMAIN_NAME`         | Domain name for the Talawa API, used for configuring and routing API traffic.                                                 |
| `CADDY_TALAWA_API_EMAIL`               | Email address for the Talawa API, used for SSL certificate registration and notifications.                                    |
| `MINIO_ROOT_PASSWORD`                  | Root password for MinIO, used for securing administrative access to MinIO object storage.                                     |
| `POSTGRES_PASSWORD`                    | Password for the PostgreSQL database (Docker Compose), used for database authentication and security.                         |
| `RECAPTCHA_SECRET_KEY` | Optional secret key for Google reCAPTCHA, used for server-side verification of reCAPTCHA responses to prevent automated abuse and bots. |
| `<PROVIDER>_CLIENT_ID` | OAuth Client ID for authentication providers (Google, GitHub), obtained from respective developer consoles. |
| `<PROVIDER>_CLIENT_SECRET` | OAuth Client Secret for authentication providers, used for server-side OAuth token exchange with providers. |
| `<PROVIDER>_REDIRECT_URI` | OAuth Redirect URI for authentication callback, must match the URI registered in provider settings. |
| `API_OAUTH_REQUEST_TIMEOUT_MS` | Request timeout in milliseconds for OAuth provider API calls, defaults to 10000ms (10 seconds) if not specified. |
| `API_EMAIL_PROVIDER` | Email provider configuration. Defaults to `mailpit` for development. Use `ses` or `smtp` for production. |

### Email Providers Overview

Talawa API supports three email providers:

| Provider | Use Case | Default? |
|----------|----------|----------|
| **Mailpit** | Local development and testing | ✅ Yes |
| **AWS SES** | Production deployments | No |
| **SMTP** | Production with external providers | No |

## Production Environment Setup

Follow the steps in this section if you are using Talawa-API as an end user.

If you want to install it as one of open source developers, then please go to the `Development Environment Setup` section

### Configuration Steps

Follow these steps to ensure the minimum configuration is applied:

#### Create the `.env` Configuration File

You'll need to create a configuration file named `.env` in the repository's root directory.

Copy the content of `./envFiles/.env.production` to the `.env` file.

```bash
cp ./envFiles/.env.production ./.env
```

#### Add a JWT Secret to .env

You will need to add a JWT secret to the `.env` file

1.  Open your web browser and go to [https://jwtsecrets.com](https://jwtsecrets.com).
2.  Select `64` from the slider.
3.  Click the **Generate** button.

Your new 64-character JWT secret will be displayed on the screen.

1. Copy this secret
2. Add it to the `API_JWT_SECRET` value in the `.env` file.

#### Update the API_ADMINISTRATOR_USER Credentials

You will need to update the `.env` file with the following information.

1. `API_ADMINISTRATOR_USER_NAME` is the name of the primary administrator person.
2. `API_ADMINISTRATOR_USER_EMAIL_ADDRESS` is the email address of the primary administrator. This will be required for logins.
3. `API_ADMINISTRATOR_USER_PASSWORD` is plain text and is used for logins.

#### Update the MINIO Credentials

You will need to update the `.env` file with the following information.

1. `MINIO_ROOT_PASSWORD` is a plain text password of your choosing.
1. `API_MINIO_SECRET_KEY` - **NOTE:** must match `MINIO_ROOT_PASSWORD`.

#### Update the PostgreSQL Credentials

You will need to update the `.env` file with the following information. The passwords are in plain text and must match.

1. `API_POSTGRES_PASSWORD` - **NOTE:** Must match `POSTGRES_PASSWORD`
2. `POSTGRES_PASSWORD`

#### Update the API_BASE_URL Value

You will need to update the `.env` file with the following information. This value uses the expected defaults.

```
http://127.0.0.1:4000
```

#### Update the CADDY Configuration

You will need to update the `.env` file with the following information. This value uses the expected defaults.

1. `CADDY_TALAWA_API_DOMAIN_NAME` can be set to `localhost`
2. `CADDY_TALAWA_API_EMAIL` can be set to a suitable email address

#### Configure Email Provider

For production environments, you must configure an email provider to send transactional emails (verification, password reset, etc.). The default `mailpit` provider only works for local development.

Choose one of the following options:

**Option 1: AWS SES (Recommended for Production)**

Update the `.env` file with:

```env
API_EMAIL_PROVIDER=ses
API_AWS_SES_REGION=your-region
API_AWS_ACCESS_KEY_ID=your-access-key
API_AWS_SECRET_ACCESS_KEY=your-secret-key
API_AWS_SES_FROM_EMAIL=verified@yourdomain.com
API_AWS_SES_FROM_NAME=Your Organization
```

Note: You must verify your domain or email address in AWS SES console before sending emails.

**Option 2: SMTP Provider**

For providers like Gmail, SendGrid, or Mailgun, update the `.env` file with:

```env
API_EMAIL_PROVIDER=smtp
API_SMTP_HOST=smtp.yourprovider.com
API_SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASSWORD=your-password
API_SMTP_FROM_EMAIL=sender@yourdomain.com
API_SMTP_FROM_NAME=Your Organization
```


#### Update the Social Media URLs

You will need to update the `.env` file with the following information.

```
API_COMMUNITY_FACEBOOK_URL
API_COMMUNITY_GITHUB_URL
API_COMMUNITY_INSTAGRAM_URL
API_COMMUNITY_LINKEDIN_URL
API_COMMUNITY_REDDIT_URL
API_COMMUNITY_SLACK_URL
API_COMMUNITY_WEBSITE_URL
API_COMMUNITY_X_URL
API_COMMUNITY_YOUTUBE_URL
```

#### Update the Name of the Parent Organization / Community

You will need to update the `.env` file with the following information.

```
API_COMMUNITY_NAME
```

#### Update the reCAPTCHA Configuration

You will need to update the `.env` file with the following information.

```
RECAPTCHA_SECRET_KEY
```

For development, testing, and CI environments, you may use Google’s **official reCAPTCHA test keys**, which always pass verification and are safe for automated testing tools like Cypress.

**Test Keys (Recommended for Development & CI):**

- **Site key**
```
6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
```

- **Secret key**
```
6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
```

Add the **secret key** to your `.env` file:

```env
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
```

#### Update the OAuth Configuration

Talawa API supports OAuth authentication with Google and GitHub providers. OAuth configuration is optional but enables users to sign in using their existing accounts.

You can configure OAuth providers in two ways:

1. **Using the Setup Script (Recommended)**: The setup script will prompt you to configure OAuth providers interactively
2. **Manual Configuration**: Update the `.env` file directly with OAuth provider information

**Option 1: Setup Script Configuration**

When you run the setup script (`npm run setup` or `pnpm tsx setup.ts`), you'll be prompted:
- Whether you want to set up OAuth providers
- Which providers to configure (Google, GitHub, or both)  
- Provider credentials for each selected provider
- OAuth request timeout settings

**Option 2: Manual Configuration**

You can also manually update the `.env` file with OAuth provider information if you want to enable OAuth authentication.

**For Google OAuth:**
1. Go to [Google Cloud Console](https://console.developers.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID credentials
3. Add your redirect URI to authorized redirect URIs
4. Update your `.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4000/auth/google/callback
```

**For GitHub OAuth:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set the Authorization callback URL
4. Update your `.env` file:

```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:4000/auth/github/callback
```

**OAuth Request Timeout (Optional):**
```env
API_OAUTH_REQUEST_TIMEOUT_MS=10000
```

**Note:** OAuth providers are automatically enabled only when all required credentials (Client ID, Client Secret, and Redirect URI) are provided. If any credential is missing, the provider will be disabled.

#### Update the Email Configuration

Talawa API requires email configuration for features like user registration verification and event invitations.

You will need to update the `.env` file with the following information.

1. `API_EMAIL_PROVIDER` - Set to `ses` (default)
2. `API_AWS_SES_REGION` - Your AWS SES region (e.g., `ap-south-1`)
3. `API_AWS_ACCESS_KEY_ID` - Your AWS IAM Access Key
4. `API_AWS_SECRET_ACCESS_KEY` - Your AWS IAM Secret Key
5. `API_AWS_SES_FROM_EMAIL` - The email address you have verified in SES
6. `API_AWS_SES_FROM_NAME` - (Optional) The name to display as the sender (default: "Talawa")

**Alternatively, for SMTP Provider:**

1. `API_EMAIL_PROVIDER` - Set to `smtp`
2. `API_SMTP_HOST` - SMTP server hostname (required)
3. `API_SMTP_PORT` - SMTP server port (required, e.g., 587 or 465)
4. `SMTP_USER` - SMTP username (optional)
5. `SMTP_PASSWORD` - SMTP password (optional)
6. `SMTP_SECURE` - `true` for SSL, `false` for TLS (required)
7. `API_SMTP_FROM_EMAIL` - Sender email address (required)
8. `API_SMTP_FROM_NAME` - Sender display name (optional)
9. `SMTP_NAME` - Client hostname for HELO/EHLO (optional)
10. `SMTP_LOCAL_ADDRESS` - Local interface IP to bind to (optional)

**Required IAM Permissions:**
Your AWS IAM user needs the following permissions:
- `ses:SendEmail`
- `ses:SendRawEmail`

### Troubleshooting

If you encounter issues with email delivery:

1.  **"Email not verified" Error**: AWS SES Sandbox mode requires verification of *both* the sender and recipient addresses. Verify the email addresses in the SES Console.
2.  **"Access Denied" Error**: Ensure your IAM user has `ses:SendEmail` and `ses:SendRawEmail` permissions. check that the access key and secret key are correct.
3.  **"Throttling" Error**: You may have exceeded your SES sending rate limits. Request a quota increase in the AWS Console.
4.  **Test Email Fails**: If the setup script test email fails, check the console output for the specific error message. Common causes include network firewalls blocking the SES endpoint.

After all the configuration steps are complete, you will be ready to start the production server.

Proceed to the [Operation Guide](./operation.md) to get the app started.

## Development Environment Setup

Follow the steps in this section if you are one of our open source software developer contributors.

If you want to install it for your organization, then please go to the `Production Environment Setup` section

### Configuration Steps

Most of these steps are specific to Linux. You will need to modify them accordingly for other operating systems

1.  Windows Only
    1. Make sure you clone the `talawa-api` repository to a `WSL` subdirectory.
    2. Run all the following commands from the repository root in that subdirectory.
2.  Create the `.env` file by copying the template from the `envFiles/` directory. **DO NOT EDIT EITHER FILE!**
    ```bash
    cp envFiles/.env.devcontainer .env
    ```

#### Email Testing in Development

The development environment automatically configures [Mailpit](https://github.com/axllent/mailpit) for email testing. All emails sent by the API are captured by Mailpit and can be viewed at:

- **Web Interface**: http://localhost:8025
- **SMTP Port**: 1025 (internal, used by API)

This allows you to test email functionality (verification emails, password resets, etc.) without sending real emails.

**Default Configuration:**

When using the default development setup, the following values are automatically configured:

```env
API_EMAIL_PROVIDER=mailpit
API_SMTP_HOST=mailpit
API_SMTP_PORT=1025
API_SMTP_FROM_EMAIL=test@talawa.local
API_SMTP_FROM_NAME=Talawa
```

**Mailpit Web Interface Features:**

- View all captured emails
- Inspect email headers and content (HTML/Text)
- Search and filter emails
- Download email attachments
- Clear all messages for testing

**Docker Compose Port Mapping:**

The following environment variables control how Mailpit is exposed on your host machine:

| Variable | Default | Description |
|----------|---------|-------------|
| `MAILPIT_MAPPED_HOST_IP` | `127.0.0.1` | Host IP for Mailpit ports |
| `MAILPIT_WEB_MAPPED_PORT` | `8025` | Web UI port on host |
| `MAILPIT_SMTP_MAPPED_PORT` | `1025` | SMTP port on host |

**Troubleshooting Mailpit:**

- **Can't access http://localhost:8025:**
  - Verify Mailpit container is running: `docker ps | grep mailpit`
  - Check that ports aren't already in use: `lsof -i :8025`
  - Review Docker Compose logs: `docker compose logs mailpit`

- **Emails not appearing in Mailpit:**
  - Verify `API_EMAIL_PROVIDER=mailpit` is set
  - Check the API logs for SMTP connection errors
  - Ensure the Mailpit container is on the same Docker network as the API

### Operating the Development Server

After all the configuration steps are complete, you will be ready to start the production server.

Proceed to the [Operation Guide](./operation.md) to get the app started.

## The Setup Script

To configure the `.env` file, run one of the following commands in your project’s root directory:

```bash
npm run setup
```

or

```bash
pnpm tsx setup.ts
```

The script will ask whether you're in CI mode (CI=true) or non-CI (CI=false) mode. Choose:

1. CI=false for local/development environments:
   - Uses configuration from `.env.devcontainer`
   - Includes complete interactive setup with all configuration options
   - Sets up CloudBeaver for database management
   - Configures all Minio and PostgreSQL extended options
   - Best for developers working on the application locally

2. CI=true for testing or continuous integration pipelines:
   - Uses configuration from `.env.ci`
   - Streamlined setup with minimal configuration
   - Excludes CloudBeaver-related settings
   - Contains only essential database and storage options
   - Best for automated testing environments or CI/CD pipelines

It will also ask whether you want to use recommended defaults. Answer "yes" to quickly accept safe defaults or "no" to provide custom inputs. Once the prompts finish, your .env file will be generated or updated.
