#!/usr/bin/env bash

# Create/renew Let's Encrypt certificates for rsvp.hiringtests.in using NGINX plugin
# - Installs certbot if needed
# - Verifies DNS resolution
# - Ensures ports 80/443 are open (ufw)
# - Tests nginx config and obtains/renews certs
# - Sets up automatic renewal via systemd timer (default for certbot)

set -euo pipefail

DOMAIN_DEFAULT="rsvp.hiringtests.in"
WWW_DOMAIN_DEFAULT="www.rsvp.hiringtests.in"
EMAIL_DEFAULT="alok@hiringtests.in"

DOMAIN="${1:-$DOMAIN_DEFAULT}"
WWW_DOMAIN="${2:-$WWW_DOMAIN_DEFAULT}"
EMAIL="${3:-$EMAIL_DEFAULT}"

if [ "${EUID}" -ne 0 ]; then
  echo "❌ Please run as root: sudo $0 [domain] [www-domain] [email]"
  exit 1
fi

cat <<INFO
🔐 SSL Certificate Setup (Let's Encrypt / Certbot)
=================================================
Domain:        ${DOMAIN}
WWW Domain:    ${WWW_DOMAIN}
Contact Email: ${EMAIL}
INFO

read -r -p "Proceed to install/renew certificates for these domains? (y/N): " ANSWER
if [[ ! "$ANSWER" =~ ^[Yy]$ ]]; then
  echo "❌ Aborted by user"
  exit 1
fi

# Ensure dependencies
apt update -y
apt install -y nginx certbot python3-certbot-nginx ufw

# Open firewall (if ufw is present)
if command -v ufw >/dev/null 2>&1; then
  echo "🔒 Configuring firewall rules for HTTP/HTTPS..."
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
fi

# Basic DNS check
echo "🔎 Checking DNS resolution for requested domains..."
DOMAINS_TO_REQUEST=()
if getent hosts "$DOMAIN" >/dev/null; then
  echo "✅ ${DOMAIN} resolves"
  DOMAINS_TO_REQUEST+=("$DOMAIN")
else
  echo "⚠️  ${DOMAIN} does not resolve. It will be skipped."
fi

if [ -n "$WWW_DOMAIN" ]; then
  if getent hosts "$WWW_DOMAIN" >/dev/null; then
    echo "✅ ${WWW_DOMAIN} resolves"
    DOMAINS_TO_REQUEST+=("$WWW_DOMAIN")
  else
    echo "⚠️  ${WWW_DOMAIN} does not resolve. It will be skipped."
  fi
fi

if [ ${#DOMAINS_TO_REQUEST[@]} -eq 0 ]; then
  echo "❌ No provided domains resolve via DNS. Please create DNS A/AAAA records and try again."
  exit 1
fi

# Ensure nginx is running
systemctl enable --now nginx

# Test nginx configuration
if ! nginx -t; then
  echo "❌ NGINX configuration has errors. Please fix and re-run."
  exit 1
fi

# Obtain/renew certificates using nginx plugin
# --redirect will create HTTP->HTTPS redirect server blocks
# If you prefer to skip redirect, remove --redirect

echo "📜 Requesting/renewing certificates via Certbot..."

# Build -d arguments dynamically
CERTBOT_ARGS=(--nginx -m "$EMAIL" --agree-tos --no-eff-email --redirect -n)
for d in "${DOMAINS_TO_REQUEST[@]}"; do
  CERTBOT_ARGS+=( -d "$d" )
done

certbot "${CERTBOT_ARGS[@]}"

# Post-check
PRIMARY_DOMAIN="${DOMAINS_TO_REQUEST[0]}"
if [ -d "/etc/letsencrypt/live/${PRIMARY_DOMAIN}" ]; then
  echo "✅ Certificates installed at /etc/letsencrypt/live/${PRIMARY_DOMAIN}"
  ls -l "/etc/letsencrypt/live/${PRIMARY_DOMAIN}" || true
else
  echo "⚠️  Certbot did not create the expected directory. Review certbot output above."
fi

# Reload nginx to apply
systemctl reload nginx

# Show certbot renewal status
systemctl status certbot.timer --no-pager -l || true

cat <<NEXT

✅ SSL setup complete for ${DOMAIN}

What was done:
- Opened firewall ports 80/443 (if ufw present)
- Ensured nginx is running and configuration is valid
- Obtained certificates with Certbot (NGINX plugin) for resolving domains:
  $(printf "\n  * %s" "${DOMAINS_TO_REQUEST[@]}")
- Enabled automatic renewal via systemd timer (certbot.timer)

Manual checks:
- Visit: https://${DOMAIN}
- Test renewal dry-run: certbot renew --dry-run

NEXT
