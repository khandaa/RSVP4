import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { eventAPI, guestAPI, inviteAPI } from '../../services/api';
import { FaEnvelope, FaEye, FaPaperPlane, FaSpinner } from 'react-icons/fa';

const SendInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [guests, setGuests] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await eventAPI.getEvents();
        if (response.data) {
          setEvents(response.data);
        }
      } catch (error) {
        toast.error('Failed to fetch events.');
      }
    };
    fetchEvents();
  }, []);

  const fetchGuests = useCallback(async (eventId) => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      const response = await guestAPI.getGuests({ event_id: eventId });
      if (response.data) {
        setGuests(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch guests for the selected event.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const eventId = searchParams.get('event_id');
    if (eventId) {
      setSelectedEvent(eventId);
      fetchGuests(eventId);
    }
  }, [searchParams, fetchGuests]);

  const handleEventChange = (e) => {
    const eventId = e.target.value;
    setSelectedEvent(eventId);
    fetchGuests(eventId);
  };

  const handleGuestSelection = (guestId) => {
    setSelectedGuests(prev => 
      prev.includes(guestId) 
        ? prev.filter(id => id !== guestId) 
        : [...prev, guestId]
    );
  };

  const handleSelectAllGuests = () => {
    if (selectedGuests.length === guests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(guests.map(g => g.guest_id));
    }
  };

  const handleSendInvites = async () => {
    if (!selectedEvent || selectedGuests.length === 0 || !subject || !message) {
      toast.warn('Please select an event, at least one guest, and provide a subject and message.');
      return;
    }

    setIsSending(true);
    try {
      // 1. Create an invite template
      const inviteResponse = await inviteAPI.createInvite({ 
        event_id: selectedEvent, 
        subject,
        body: message
      });
      const inviteId = inviteResponse.data.invite_id;

      // 2. Send the invites to the selected guests
      await inviteAPI.sendInvites(inviteId, selectedGuests);

      toast.success(`Invites sent to ${selectedGuests.length} guests.`);
      setSelectedGuests([]);
    } catch (error) {
      toast.error('Failed to send invites.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <h2 className="mb-4">Send Invites</h2>
      <div className="card glass-card">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="eventSelect" className="form-label">Event</label>
                <select id="eventSelect" className="form-select" value={selectedEvent} onChange={handleEventChange}>
                  <option value="">-- Select an Event --</option>
                  {events.map(event => (
                    <option key={event.event_id} value={event.event_id}>{event.event_name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="subject" className="form-label">Subject</label>
                <input type="text" id="subject" className="form-control" value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div className="mb-3">
                <label htmlFor="message" className="form-label">Message</label>
                <textarea id="message" className="form-control" rows="10" value={message} onChange={e => setMessage(e.target.value)}></textarea>
              </div>
            </div>
            <div className="col-md-6">
              <h5>Guests</h5>
              {isLoading ? (
                <div className="text-center"><FaSpinner className="fa-spin" /> Loading guests...</div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th><input type="checkbox" onChange={handleSelectAllGuests} checked={selectedGuests.length === guests.length && guests.length > 0} /></th>
                        <th>Name</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guests.map(guest => (
                        <tr key={guest.guest_id}>
                          <td><input type="checkbox" checked={selectedGuests.includes(guest.guest_id)} onChange={() => handleGuestSelection(guest.guest_id)} /></td>
                          <td>{guest.guest_first_name} {guest.guest_last_name}</td>
                          <td>{guest.guest_email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div className="text-end mt-4">
            <button className="btn btn-primary" onClick={handleSendInvites} disabled={isSending}>
              {isSending ? <><FaSpinner className="fa-spin" /> Sending...</> : <><FaPaperPlane /> Send Invites</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendInvite;
