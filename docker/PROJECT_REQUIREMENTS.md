# Project Requirements & Design Specification: Lloyds CBO Login Demo

This document serves as the master requirements definition for the Commercial Banking Online (CBO) login application. Use this as a reference or a "backup prompt" to reconstruct the project architecture and logic.

## 1. High-Level Architecture
The application is a full-stack React SPA integrated with the **ForgeRock Identity Platform**.

- **Frontend**: React (Vite) + Tailwind CSS + Framer Motion.
- **Identity Backend**: ForgeRock Identity Platform (AM, IG, DS).
- **Security Pattern**: Identity-Aware Proxy (IAP) using ForgeRock Identity Gateway (IG).

---

## 2. Application Logic & User Experience

### A. System Readiness Check
Before the user sees the login page, the React app MUST verify the availability of the ForgeRock services.
- **Behavior**: Call a dedicated `isSystemOnline` check (pinging AM/IG).
- **State**: If offline, display a "System Temporarily Unavailable" screen with telephony support details (0808 202 1390).

### B. Subdomain-Based Authentication Flow
To mimic high-security banking environments, the app uses subdomain switching:
- **Primary Login**: Hosted on `cbonline.localhost` (or `cbonline.lloydsbank.com`).
- **MFA / 2FA Stage**: After local validation/login success, the user is redirected to `cbsecure.localhost` (or `cbsecure.lloydsbank.com`) for the secondary authentication factor.
- **Final Landing**: Upon full 2FA completion, the user returns to the primary dashboard.

### C. Session Management
- **Timeout**: Strictly enforced 10-minute session window.
- **Simulation**: A client-side `SessionTimer` component tracks this window.
- **Sync**: In production, the timer must sync with the OIDC token's `exp` claim.

---

## 3. ForgeRock Infrastructure Requirements (The Stack)

### A. Directory Services (DS)
The user repository must support the following custom and standard attributes:
- **Internal ID**: `_id` (Unique system identifier).
- **Username**: `userName` (Login handle).
- **Personal Details**: `givenName` (First) and `sn` (Surname).
- **Contact**: `mail` (Email address).
- **Audit**: `createTimestamp` and `modifyTimestamp`.
- **Status**: `inetUserStatus` (Active/Inactive).
- **Role**: `memberOf` (Mapping to `CORPORATE_USER` or `ADMIN`).

### B. Access Management (AM)
A dedicated realm named `commercial-banking` must be configured with:
1. **OAuth2 Client**: `WebMerchantApp`.
   - **Redirect URIs**: `http://localhost:3000/callback`.
   - **Scopes**: `openid`, `profile`, `email`.
2. **Journeys (Authentication Trees)**:
   - `Login`: Page Node (Username/Password) -> Data Store Decision.
   - `2FA`: Step-up logic requiring an OTP (simulated or real).

### C. Identity Gateway (IG)
IG acts as the "Identity-Aware Proxy" (IAP).
- **Logic**: It intercepts every request.
- **Routing**: 
  - If no session: Redirect to AM Login Journey.
  - If session exists: Proxy request to the React App.
- **Protocol Translation**: Translates complex security tokens into simple headers for the internal application.

---

## 4. API Gateway Integration (Secondary Layer)
While IG handles **Identity**, an additional API Gateway (e.g., **Apigee**) is required for:
- **Rate Limiting**: Throttling requests to protect the core ledger.
- **Quota Management**: Ensuring corporate clients stay within their monthly API call limits.
- **Payload Validation**: Strict schema checking for API requests before they reach backend services.

---

## 5. Local Development Setup (Quick Reference)

### A. Docker Stack
A `docker-compose.yml` must include:
- `am`: Access Management on port `8080`.
- `ds`: Directory Services (LDAP) for user storage.
- `ig`: Identity Gateway on port `8081`.

### B. Networking
Local hosts file modifications are required:
```text
127.0.0.1 cbonline.localhost
127.0.0.1 cbsecure.localhost
```

### C. AM UI Configuration (Realm Creation)
When creating the `commercial-banking` realm in AM:
- **Name**: `commercial-banking`.
- **DNS Aliases**: Add `cbonline.localhost` and `cbsecure.localhost` to the realm config.
- **Identity Store**: Link an LDAP store pointing to the `ds` container (Base DN: `dc=openam,dc=forgerock,dc=org`).
-------------------------------------------------------------------------------------------------------------------




#!/bin/bash

# Lloyds CBO Demo - Local Setup Script
# This script prepares the local environment for development.

echo "--- Lloyds CBO Login Demo: Setup ---"

# 1. Install Node Dependencies
echo "Step 1: Installing React dependencies..."
npm install

# 2. ForgeRock Infrastructure Setup
echo "Step 2: Preparing ForgeRock Infrastructure..."
echo "Ensure you have Docker and Docker-Compose installed."
echo "You should create a directory named 'forgerock-infra' (OUTSIDE this project folder)."
echo "Then copy the docker-compose.yml content from FORGEROCK_SETUP.md into it."

# 3. Hosts File Modification Instructions
echo ""
echo "--- EXTERNAL STEP REQUIRED ---"
echo "To enable subdomain switching (cbonline.localhost <-> cbsecure.localhost),"
echo "you MUST add the following lines to your system hosts file:"
echo ""
echo "127.0.0.1 cbonline.localhost"
echo "127.0.0.1 cbsecure.localhost"
echo ""
echo "On macOS/Linux: /etc/hosts"
echo "On Windows: C:\Windows\System32\drivers\etc\hosts"
echo ""

# 4. Start Development
echo "Step 3: Starting the application..."
echo "Once hosts are configured, run: npm run dev"
echo "The app will be available at: http://cbonline.localhost:3000"
