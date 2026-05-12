#!/bin/bash
set -e

DEPLOYMENT_ID="fr-deployment"
DEPLOYMENT_PASSWORD="Password@123"

# FIX: DS 7.5 creates 'config' directly under the home folder, not inside 'data'
if [ ! -d "/opt/ds/config" ]; then
  echo "Setting up DS for the first time..."

  /opt/ds/setup \
    --deploymentId "${DEPLOYMENT_ID}" \
    --deploymentIdPassword "${DEPLOYMENT_PASSWORD}" \
    --rootUserDN "cn=Directory Manager" \
    --rootUserPassword "password" \
    --monitorUserPassword "password" \
    --hostname ds \
    --ldapPort 1389 \
    --adminConnectorPort 4444 \
    --acceptLicense
else
  echo "Configuration found in /opt/ds/config. Skipping setup."
fi

echo "Starting DS..."
exec /opt/ds/bin/start-ds
