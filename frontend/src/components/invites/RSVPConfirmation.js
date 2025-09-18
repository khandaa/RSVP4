import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { inviteAPI } from '../../services/api';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

const RSVPConfirmation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [eventName, setEventName] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // This endpoint needs to be created in the backend
        const response = await inviteAPI.verifyRsvpToken(token);
        if (response.data) {
          setIsValidToken(true);
          setGuestName(response.data.guest_name);
          setEventName(response.data.event_name);
        }
      } catch (error) {
        setIsValidToken(false);
        toast.error('Invalid or expired RSVP link.');
      } finally {
        setIsLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleRsvpResponse = async (status) => {
    try {
      // This endpoint needs to be created in the backend
      await inviteAPI.submitRsvpResponse(token, { status });
      toast.success(`Your RSVP has been recorded as ${status}.`);
      navigate('/rsvp/thank-you');
    } catch (error) {
      toast.error('Failed to submit your RSVP. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="text-center p-5"><FaSpinner className="fa-spin" size="3x" /></div>;
  }

  if (!isValidToken) {
    return <div className="alert alert-danger text-center">This RSVP link is invalid or has expired.</div>;
  }

  return (
    <div className="container text-center my-5">
      <h2>Hello, {guestName}!</h2>
      <p className="lead">You are invited to {eventName}.</p>
      <p>Please confirm your attendance:</p>
      <div className="d-grid gap-2 col-6 mx-auto">
        <button className="btn btn-success btn-lg" onClick={() => handleRsvpResponse('Confirmed')}>
          <FaCheckCircle /> Yes, I will attend
        </button>
        <button className="btn btn-danger btn-lg" onClick={() => handleRsvpResponse('Declined')}>
          <FaTimesCircle /> No, I cannot attend
        </button>
      </div>
    </div>
  );
};

export default RSVPConfirmation;
