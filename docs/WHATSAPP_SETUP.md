# WhatsApp Business API Setup Guide

This guide explains how to set up WhatsApp Business API for sending invites in the RSVP4 system.

## Prerequisites

1. A Meta Business Account
2. WhatsApp Business Account
3. Access to Meta Business Platform
4. Phone number for WhatsApp Business (must be different from your personal WhatsApp)

## Setup Steps

### 1. Create Meta Business Account

1. Go to [Meta Business](https://business.facebook.com/)
2. Create a new business account or use existing
3. Verify your business information

### 2. Set up WhatsApp Business API

1. Go to [Meta Developers](https://developers.facebook.com/)
2. Create a new app and select "Business" type
3. Add WhatsApp product to your app
4. Complete the setup wizard

### 3. Get API Credentials

From your WhatsApp Business API dashboard, collect:

1. **Phone Number ID**: Found in the WhatsApp API setup page
2. **Access Token**: Temporary token (24hrs) or Permanent token
3. **Webhook Verify Token**: Create a secure random string

### 4. Configure Environment Variables

Add the following to your `.env` file:

```env
# WhatsApp Business API Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token_here
```

### 5. Set up Webhook (Optional but Recommended)

1. In your WhatsApp API configuration, set the webhook URL to:
   ```
   https://yourdomain.com/api/invites/webhook
   ```

2. Set the verify token to match `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

3. Subscribe to these webhook events:
   - `messages` (for replies)
   - `message_deliveries` (for delivery status)
   - `message_reads` (for read receipts)

### 6. Test Configuration

1. Start your application
2. Go to the Invites section
3. Create a test invite
4. Send a preview to your own WhatsApp number
5. Verify you receive the message

## Important Notes

### Production Setup

For production use, you need to:

1. **Verify your business**: Complete Meta's business verification process
2. **Get approved**: Submit your use case for approval
3. **Messaging limits**: Start with limited messaging capacity, request increases as needed
4. **Template messages**: For broadcast messages, you need approved message templates

### Message Types

- **Text messages**: Can be sent anytime within 24-hour window
- **Template messages**: Required for messages outside 24-hour window
- **Media messages**: Images, videos, documents are supported

### Rate Limits

WhatsApp has rate limits based on your phone number's messaging tier:
- **Tier 1**: 1,000 messages in 24 hours
- **Tier 2**: 10,000 messages in 24 hours
- **Tier 3**: 100,000 messages in 24 hours

### Costs

- WhatsApp Business API has per-message pricing
- Costs vary by country and message type
- Check current pricing on Meta's website

## Common Issues

### 1. Invalid Phone Number Format

**Problem**: Messages fail with invalid phone number error

**Solution**: Ensure phone numbers include country code without '+' or spaces:
- ✅ Correct: `919876543210`
- ❌ Wrong: `+91 98765 43210`

### 2. Authentication Failed

**Problem**: API calls return authentication error

**Solution**:
- Check access token is valid
- Ensure token has required permissions
- Generate new token if expired

### 3. Webhook Verification Failed

**Problem**: Webhook setup fails verification

**Solution**:
- Ensure webhook URL is accessible
- Verify token matches exactly
- Check server logs for errors

### 4. Messages Not Delivered

**Problem**: Messages show as sent but not delivered

**Solution**:
- Check recipient's WhatsApp number is active
- Ensure recipient hasn't blocked business number
- Check WhatsApp server status

## Development vs Production

### Development
- Use test phone numbers
- Limited to 5 recipients
- No business verification required
- Lower rate limits

### Production
- Requires business verification
- No recipient limits (subject to rate limits)
- Need approved message templates
- Higher rate limits available

## Support Resources

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Meta Business Help Center](https://www.facebook.com/business/help)
- [WhatsApp Business API Changelog](https://developers.facebook.com/docs/whatsapp/changelog)

## Security Best Practices

1. **Protect Access Tokens**: Never commit tokens to version control
2. **Use HTTPS**: Always use secure connections for webhook
3. **Validate Webhooks**: Verify webhook signatures
4. **Rate Limiting**: Implement proper rate limiting
5. **Monitor Usage**: Track API usage and costs

## Sample Configuration File

Create a file named `.env.example` with:

```env
# WhatsApp Business API Configuration
# Get these from Meta Business Manager -> WhatsApp -> API Setup
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token_here
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token_here
```

Replace the placeholder values with your actual credentials.