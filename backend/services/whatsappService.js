const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  }

  // Send a text message with optional media
  async sendMessage(to, message, mediaUrl = null, mediaType = 'image') {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

      let messageData = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: 'text',
        text: {
          body: message
        }
      };

      // If media URL is provided, send as media message
      if (mediaUrl) {
        messageData = {
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(to),
          type: mediaType,
          [mediaType]: {
            link: mediaUrl,
            caption: message
          }
        };
      }

      const response = await axios.post(url, messageData, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        status: 'sent',
        response: response.data
      };
    } catch (error) {
      console.error('WhatsApp send error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        status: 'failed'
      };
    }
  }

  // Send template message (for business accounts)
  async sendTemplate(to, templateName, components = []) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

      const messageData = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: 'en_US'
          },
          components: components
        }
      };

      const response = await axios.post(url, messageData, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        status: 'sent',
        response: response.data
      };
    } catch (error) {
      console.error('WhatsApp template error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        status: 'failed'
      };
    }
  }

  // Send invite with media (images/videos)
  async sendInvite(to, inviteData) {
    try {
      const { text, images, videos, title } = inviteData;

      // Send text message first
      let textMessage = title ? `*${title}*\n\n${text}` : text;
      let result = await this.sendMessage(to, textMessage);

      const results = [result];

      // Send images if any
      if (images && images.length > 0) {
        for (const imageUrl of images) {
          const imageResult = await this.sendMessage(to, '', imageUrl, 'image');
          results.push(imageResult);
          // Add small delay between messages
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Send videos if any
      if (videos && videos.length > 0) {
        for (const videoUrl of videos) {
          const videoResult = await this.sendMessage(to, '', videoUrl, 'video');
          results.push(videoResult);
          // Add small delay between messages
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Return combined result
      const allSuccessful = results.every(r => r.success);
      return {
        success: allSuccessful,
        results: results,
        status: allSuccessful ? 'sent' : 'partial_failure'
      };

    } catch (error) {
      console.error('WhatsApp invite error:', error);
      return {
        success: false,
        error: error.message,
        status: 'failed'
      };
    }
  }

  // Format phone number to WhatsApp format (remove + and spaces)
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;

    // Remove all non-numeric characters except +
    let formatted = phoneNumber.replace(/[^\d+]/g, '');

    // Remove + if present
    if (formatted.startsWith('+')) {
      formatted = formatted.substring(1);
    }

    // Add country code if not present (assuming India +91)
    if (formatted.length === 10) {
      formatted = '91' + formatted;
    }

    return formatted;
  }

  // Verify webhook (for WhatsApp webhook setup)
  verifyWebhook(mode, token, challenge) {
    if (mode === 'subscribe' && token === this.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }

  // Process incoming webhook messages
  processWebhook(body) {
    try {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (value?.messages) {
        // Process incoming messages
        return {
          type: 'message',
          messages: value.messages,
          contacts: value.contacts
        };
      }

      if (value?.statuses) {
        // Process message status updates
        return {
          type: 'status',
          statuses: value.statuses
        };
      }

      return null;
    } catch (error) {
      console.error('WhatsApp webhook processing error:', error);
      return null;
    }
  }

  // Check service configuration
  isConfigured() {
    return !!(this.phoneNumberId && this.accessToken);
  }
}

module.exports = new WhatsAppService();