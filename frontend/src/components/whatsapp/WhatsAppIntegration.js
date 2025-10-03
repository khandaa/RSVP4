import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { inviteAPI } from '../../services/api';

const WhatsAppIntegration = ({ guestId }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);

    try {
      // This is a placeholder for the actual API call
      // You will need to implement the backend for this
      await inviteAPI.sendWhatsAppMessage(guestId, message);
      toast.success('WhatsApp message sent successfully');
      setMessage('');
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      toast.error('Failed to send WhatsApp message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="card glass-card">
      <div className="card-body">
        <h5 className="card-title">Send WhatsApp Message</h5>
        <div className="mb-3">
          <label className="form-label">Message</label>
          <textarea
            className="form-control"
            rows="3"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message here"
          />
        </div>
        <button
          className="btn btn-success"
          onClick={handleSendMessage}
          disabled={isSending}
        >
          {isSending ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </div>
  );
};

export default WhatsAppIntegration;
