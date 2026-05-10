# Local ForgeRock & Development Setup Guide

This guide explains how to set up the **Lloyds CBO Login** application on your local machine and integrate it with a local **ForgeRock Access Management (AM)** instance.

## 1. Local Application Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)

### Installation
1. Download the project ZIP or clone the repository.
2. Open your terminal in the project root.
3. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
To start the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

---

## 2. ForgeRock AM Setup (Local)

To have a real backend, you need a ForgeRock instance. You can use ForgeRock Identity Platform (FIP) with Docker for a quick local setup.

### 2.1 Docker Installation (Recommended)

The easiest way to run the full stack is using the community or evaluator Docker images.

1. **Create a `docker-compose.yml`** in a new directory:
   ```yaml
   version: '3.8'
   services:
     # Directory Services (The Data Store)
     ds:
       image: gcr.io/forgerock-io/ds-idrepo:7.1.0
       ports:
         - "389:389"
         - "4444:4444"
       environment:
         - DS_ROOT_PASSWORD=password
         - DS_INSTANCE_NAME=ds1

     # Access Management (The Login Hub)
     am:
       image: gcr.io/forgerock-io/am:7.1.0
       ports:
         - "8080:8080"
       environment:
         - AM_HOME=/home/forgerock/openam
         - FIP_REALM=root
       depends_on:
         - ds

     # Identity Gateway (The Security Proxy)
     ig:
       image: gcr.io/forgerock-io/ig:7.1.0
       ports:
         - "8081:8080"
       environment:
         - AM_URL=http://am:8080/openam
       depends_on:
         - am
   ```

2. **Run the stack**:
   ```bash
   docker-compose up -d
   ```

3. **Configure AM**:
   - Access: `http://localhost:8080/openam/configurator`
   - Create a default configuration.
   - Use the UI to create the `WebMerchantApp` client (see Section 2.2).

### 2.2 Detailed Configuration Steps

#### A. Creating a New Realm
1. **Log in**: Access the AM console at `http://localhost:8080/openam/console` using `amadmin`.
2. **Navigate to Realms**: Click on **Realms** in the left-hand navigation menu.
3. **Add Realm**: Click the **Add Realm** button (or **+** icon).
4. **Fill the Form** (as per the UI):
   - **Name**: `commercial-banking` (The display name for the realm).
   - **Active**: Ensure the toggle is switched **ON** (Green).
   - **Parent**: This will show `/` by default.
   - **Realm Aliases**: `commercial-banking` (This is used in the URL path, e.g., `/openam/realms/root/realms/commercial-banking`).
   - **DNS Aliases**: Add `cbonline.localhost` and `cbsecure.localhost` here. 
     *   *Note: This allows AM to automatically map requests from these domains directly to this specific realm.*
   - **Use Client-Side Sessions**: Leave this **OFF** (Grey) for standard server-side sessions unless your architecture specifically requires stateless client-side tokens.
5. Click **Create**.
6. **Select Realm**: Once created, click on the realm name in the list to continue with Identities and Application settings.

#### B. Creating a User (Identity)
1. Inside the `commercial-banking` realm, click on **Identities** in the left sidebar.
2. Click **Add Identity**.
3. **Username**: (e.g., `john_doe`)
4. **Password**: (e.g., `Password123!`)
5. **Attributes**: After creating the basic identity, click on its name to edit additional attributes:
   - **Given Name**: `John`
   - **Surname**: `Doe`
   - **Email Address**: `john.doe@example.com`
   - **Status**: Ensure it is set to `Active`.
   - **Roles**: Under the "Group/Role" tab, assign a role like `CORPORATE_USER`.

#### C. Creating the OAuth2 Client
1. Navigate to **Applications** -> **OAuth 2.0** -> **Clients**.
2. Click **Add Client**.
3. **Client ID**: `WebMerchantApp`
4. **Client Secret**: (Set a strong secret, e.g., `merchant-secret-key-2026`)
5. **Core Settings**:
   - **Redirect URIs**: `http://localhost:3000/callback`
   - **Scopes**: Add `openid`, `profile`, and `email`.
   - **Grant Types**: Ensure `Authorization Code` and `Refresh Token` are enabled.
6. **Authentication**: Set the **Token Endpoint Authentication Method** to `None` if you are using Public Client (PKCE), otherwise `client_secret_post`.

#### D. Creating the Authentication Tree (Journey)
1. Navigate to **Authentication** -> **Trees** (or **Journeys**).
2. Click **Create Tree**.
3. **Tree Name**: `Login`
4. **Build the Tree**:
   - Drag a **Page Node** onto the canvas.
   - Inside the Page Node, add a **Username Collector** and a **Password Collector**.
   - Connect the Page Node to a **Data Store Decision** node.
   - Connect the 'True' output of the Decision node to **Success** and 'False' to **Failure**.
5. Click **Save**.

### 3. Identity Gateway (IG) Configuration
IG acts as the "Identity-Aware Proxy". You configure it using a JSON file (usually `config.json`) that defines:
- **Routes**: Which URLs to protect.
- **Filters**: The `OAuth2ClientFilter` to handle the handshake with AM.
- **Handlers**: Where to send the request after authentication (your React App).

---

## 4. Multi-Subdomain Simulation
To simulate `cbonline` and `cbsecure` subdomains on localhost, edit your `/etc/hosts` file:
```text
127.0.0.1 cbonline.localhost
127.0.0.1 cbsecure.localhost
```
Then access the app via `http://cbonline.localhost:3000`.

---

## 5. Distributed Scalability & IG Role

### Scalability
The architecture is designed for high-scale enterprise environments:
- **Stateless Components**: ForgeRock AM and IG are stateless. You can scale them horizontally in a Kubernetes cluster.
- **Identity-Aware Proxy**: IG acts as a Policy Enforcement Point (PEP). It sits in front of your applications, ensuring every request has a valid session/token from AM.
- **JWT-Based Identity**: Using OpenID Connect (OIDC) tokens allows distributed services to verify identity locally without hitting the database for every request.

### Identity Gateway (IG) vs API Gateway
- **IG**: Focuses on **Identity**. It handles session management, step-up authentication (2FA), and protocol translation (e.g., SAML to OIDC).
- **API Gateway**: Focuses on **Traffic Management**. It handles rate limiting, quotas, and API orchestration.
- In Lloyds-scale environments, IG often sits *in front* of or *alongside* an API Gateway to handle the security handshake.

### 6. The "10-Minute Session"
The 10-minute timeout is configured in two places:
1. **ForgeRock AM**: Session timeout (Max Session Time) for the user's SSO session.
2. **React App**: The `SessionTimer.tsx` component simulates the client-side enforcement of this window. In production, this timer should be synchronized with the `exp` claim of the OIDC Access Token.

---

## 7. Operational Modes

### Development Mode (Current)
In development, the application tries to reach ForgeRock at launch. If it fails, it displays the **"System Temporarily Unavailable"** screen. This ensures the app is aware of its dependency on the Identity Platform.

### Production Mode (Identity-Aware Proxy)
In a full production deployment at Lloyds:
1. **Entry Point**: The user hits `cbonline.lloydsbank.com`.
2. **Identity Gateway (IG)**: Intercepts the request.
3. **Session Check**: IG checks for a ForgeRock SSO cookie.
4. **Conditional Routing**:
   - **No Session**: IG redirects the browser to the ForgeRock AM Login URL (the customized React page).
   - **Active Session**: IG allows the request through to the protected backend.

### API Gateway Integration
While IG handles **Who you are**, a secondary API Gateway (like Apigee) is often used for:
- **Rate Limiting**: Preventing any one user from overloading the system.
- **Quota Management**: Limiting how many requests a corporate customer can make per month.
- **Payload Validation**: Ensuring API requests match the expected schema before they reach the main banking ledger.
