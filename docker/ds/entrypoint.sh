#!/bin/bash
set -e

DS_HOME="/opt/opendj"
SETUP_BIN="/opt/opendj/setup"
CONFIG_LDIF="/opt/opendj/config/config.ldif"

# ✅ Hardcoded — generated once via dskeymgr, never changes
DEPLOYMENT_ID="AQ0jYC9vvA3KlYb1rsOCreePDVyFkA5CBVN1bkVDYw2ZfLLJgeRuDA"
DEPLOYMENT_ID_PASSWORD="C0elentrata@121"

if [ ! -f "$CONFIG_LDIF" ]; then
    echo "First time setup: Initializing PingDS..."

    "$SETUP_BIN" \
        --deploymentId "$DEPLOYMENT_ID" \
        --deploymentIdPassword "$DEPLOYMENT_ID_PASSWORD" \
        --rootUserDN "uid=admin" \
        --rootUserPassword "password123" \
        --monitorUserPassword "password123" \
        --hostname ds \
        --ldapPort 1389 \
        --adminConnectorPort 4444 \
        --acceptLicense \
        --profile am-identity-store \
        --set am-identity-store/amIdentityStoreAdminPassword:password123 \
        --start

    echo "Setup complete."
else
    echo "DS already configured. Starting server..."
    "$DS_HOME/bin/start-ds" --nodetach &
    
    # Wait for DS to fully start
    sleep 15
    
    echo "Configuring password policies..."
    "$DS_HOME/bin/dsconfig" set-password-policy-prop \
        --hostname localhost --port 4444 \
        --bindDN "uid=admin" --bindPassword "$ROOT_USER_PASSWORD" \
        --trustAll --policy-name "Default Password Policy" \
        --set require-secure-authentication:false --no-prompt

    "$DS_HOME/bin/dsconfig" set-password-policy-prop \
        --hostname localhost --port 4444 \
        --bindDN "uid=admin" --bindPassword "$ROOT_USER_PASSWORD" \
        --trustAll --policy-name "Root Password Policy" \
        --set require-secure-authentication:false --no-prompt

    "$DS_HOME/bin/dsconfig" set-connection-handler-prop \
        --hostname localhost --port 4444 \
        --bindDN "uid=admin" --bindPassword "$ROOT_USER_PASSWORD" \
        --trustAll --handler-name "LDAP" \
        --set allow-start-tls:false --no-prompt

    echo "DS configuration complete."
    
    # Keep container running
    wait
fi