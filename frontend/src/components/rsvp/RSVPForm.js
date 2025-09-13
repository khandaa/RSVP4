import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaCalendarAlt,
  FaUser,
  FaEnvelope,
  FaClock,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaQuestionCircle,
  FaInfoCircle,
  FaUserFriends,
  FaClipboardList,
  FaHeart,
  FaSave
} from 'react-icons/fa';

const RSVPForm = () => {
  const { token } = useParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [subeventData, setSubeventData] = useState([]);
  const [guestData, setGuestData] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [rsvpData, setRsvpData] = useState({
    main_rsvp_status: '',
    dietary_requirements: '',
    special_requirements: '',
    plus_one_count: 0,
    plus_one_details: '',
    guest_notes: '',
    subevents: {}
  });

  const rsvpOptions = [
    { value: 'Confirmed', label: 'Yes, I will attend', icon: FaCheckCircle, color: 'success' },
    { value: 'Declined', label: 'No, I cannot attend', icon: FaTimesCircle, color: 'danger' },
    { value: 'Tentative', label: 'Maybe, I am not sure yet', icon: FaQuestionCircle, color: 'warning' }
  ];

  useEffect(() => {
    if (token) {
      validateTokenAndLoadData();
    }
  }, [token, validateTokenAndLoadData]);

  const validateTokenAndLoadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate token and get guest/event data
      const response = await fetch(`/api/rsvp/validate/${token}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid or expired RSVP link');
      }

      const data = await response.json();
      setTokenData(data.token);
      setEventData(data.event);
      setGuestData(data.guest);
      setSubeventData(data.subevents || []);

      // Check if already responded
      if (data.existing_response) {
        setRsvpData({
          ...rsvpData,
          main_rsvp_status: data.existing_response.rsvp_status,
          dietary_requirements: data.existing_response.dietary_requirements || '',
          special_requirements: data.existing_response.special_requirements || '',
          plus_one_count: data.existing_response.plus_one_count || 0,
          plus_one_details: data.existing_response.plus_one_details || '',
          guest_notes: data.existing_response.guest_notes || '',
          subevents: data.existing_response.subevents || {}
        });
      }

      // Initialize subevent responses
      const subeventResponses = {};
      data.subevents?.forEach(subevent => {
        subeventResponses[subevent.subevent_id] = 
          data.existing_response?.subevents?.[subevent.subevent_id] || 'Pending';
      });
      
      setRsvpData(prev => ({
        ...prev,
        subevents: subeventResponses
      }));

    } catch (error) {
      console.error('Error validating RSVP token:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, rsvpData]);

  const handleInputChange = (field, value) => {
    setRsvpData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubeventResponse = (subeventId, response) => {
    setRsvpData(prev => ({
      ...prev,
      subevents: {
        ...prev.subevents,
        [subeventId]: response
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rsvpData.main_rsvp_status) {
      toast.error('Please select your attendance status');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        token,
        rsvp_status: rsvpData.main_rsvp_status,
        dietary_requirements: rsvpData.dietary_requirements,
        special_requirements: rsvpData.special_requirements,
        plus_one_count: parseInt(rsvpData.plus_one_count) || 0,
        plus_one_details: rsvpData.plus_one_details,
        guest_notes: rsvpData.guest_notes,
        subevent_responses: rsvpData.subevents
      };

      const response = await fetch('/api/rsvp/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit RSVP');
      }

      setIsSubmitted(true);
      toast.success('RSVP submitted successfully!');
      
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      toast.error(error.message || 'Failed to submit RSVP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading your invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card glass-card text-center">
                <div className="card-body p-5">
                  <FaTimesCircle className="text-danger mb-3" size={48} />
                  <h4 className="text-danger mb-3">Invalid RSVP Link</h4>
                  <p className="text-muted mb-4">{error}</p>
                  <div className="text-muted small">
                    If you believe this is an error, please contact the event organizer.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card glass-card text-center">
                <div className="card-body p-5">
                  <FaCheckCircle className="text-success mb-3" size={48} />
                  <h4 className="text-success mb-3">RSVP Submitted!</h4>
                  <p className="text-muted mb-4">
                    Thank you for your response. We have received your RSVP for {eventData?.event_name}.
                  </p>
                  <div className="mb-4">
                    <strong>Your Response: </strong>
                    <span className={`badge glass-badge ms-2 ${
                      rsvpData.main_rsvp_status === 'Confirmed' ? 'bg-success' :
                      rsvpData.main_rsvp_status === 'Declined' ? 'bg-danger' : 'bg-warning'
                    }`}>
                      {rsvpOptions.find(opt => opt.value === rsvpData.main_rsvp_status)?.label}
                    </span>
                  </div>
                  {rsvpData.main_rsvp_status === 'Confirmed' && (
                    <div className="alert alert-success glass-effect">
                      <FaHeart className="me-2" />
                      We look forward to seeing you at the event!
                    </div>
                  )}
                  <div className="text-muted small">
                    You will receive a confirmation email shortly. If you need to make changes, 
                    please contact the event organizer.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-bg min-vh-100 py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-6">
            {/* Event Header */}
            <div className="card glass-card mb-4">
              <div className="card-body text-center p-4">
                <FaCalendarAlt className="text-primary mb-3" size={32} />
                <h2 className="text-dark fw-bold mb-2">{eventData?.event_name}</h2>
                <p className="text-muted mb-3">You're invited!</p>
                
                <div className="row g-3 text-start">
                  <div className="col-md-6">
                    <div className="d-flex align-items-center">
                      <FaClock className="text-primary me-2" />
                      <div>
                        <div className="fw-semibold">{formatDate(eventData?.event_start_date)}</div>
                        {eventData?.event_start_date && (
                          <small className="text-muted">{formatTime(eventData.event_start_date)}</small>
                        )}
                      </div>
                    </div>
                  </div>
                  {eventData?.venue_name && (
                    <div className="col-md-6">
                      <div className="d-flex align-items-center">
                        <FaMapMarkerAlt className="text-primary me-2" />
                        <div>
                          <div className="fw-semibold">{eventData.venue_name}</div>
                          {eventData.venue_address && (
                            <small className="text-muted">{eventData.venue_address}</small>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Guest Information */}
            <div className="card glass-card mb-4">
              <div className="card-body">
                <h5 className="card-title mb-3">
                  <FaUser className="me-2 text-primary" />
                  Guest Information
                </h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="d-flex align-items-center">
                      <FaUser className="text-muted me-2" />
                      <span>{guestData?.guest_first_name} {guestData?.guest_last_name}</span>
                    </div>
                  </div>
                  {guestData?.guest_email && (
                    <div className="col-md-6">
                      <div className="d-flex align-items-center">
                        <FaEnvelope className="text-muted me-2" />
                        <span>{guestData.guest_email}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RSVP Form */}
            <form onSubmit={handleSubmit}>
              {/* Main RSVP Response */}
              <div className="card glass-card mb-4">
                <div className="card-body">
                  <h5 className="card-title mb-4">
                    <FaClipboardList className="me-2 text-primary" />
                    Will you attend this event?
                  </h5>
                  
                  <div className="row g-3">
                    {rsvpOptions.map(option => {
                      const IconComponent = option.icon;
                      return (
                        <div key={option.value} className="col-md-4">
                          <div 
                            className={`rsvp-option card h-100 ${rsvpData.main_rsvp_status === option.value ? 'selected' : ''}`}
                            onClick={() => handleInputChange('main_rsvp_status', option.value)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="card-body text-center p-3">
                              <IconComponent 
                                className={`mb-2 text-${option.color}`} 
                                size={24} 
                              />
                              <div className="fw-semibold">{option.label}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Subevent Responses */}
              {subeventData.length > 0 && (
                <div className="card glass-card mb-4">
                  <div className="card-body">
                    <h5 className="card-title mb-4">
                      <FaClipboardList className="me-2 text-primary" />
                      Sub Events
                    </h5>
                    <p className="text-muted mb-4">
                      Please let us know which specific sessions or activities you plan to attend:
                    </p>
                    
                    {subeventData.map(subevent => (
                      <div key={subevent.subevent_id} className="mb-4 p-3 border rounded glass-effect">
                        <div className="row g-3 align-items-center">
                          <div className="col-md-8">
                            <h6 className="fw-semibold mb-1">{subevent.subevent_name}</h6>
                            {subevent.subevent_description && (
                              <p className="text-muted small mb-2">{subevent.subevent_description}</p>
                            )}
                            <div className="d-flex gap-3 text-muted small">
                              {subevent.subevent_start_datetime && (
                                <div>
                                  <FaClock className="me-1" />
                                  {formatDate(subevent.subevent_start_datetime)} at {formatTime(subevent.subevent_start_datetime)}
                                </div>
                              )}
                              {subevent.venue_name && (
                                <div>
                                  <FaMapMarkerAlt className="me-1" />
                                  {subevent.venue_name}
                                  {subevent.room_name && ` - ${subevent.room_name}`}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="col-md-4">
                            <select
                              className="form-select glass-input"
                              value={rsvpData.subevents[subevent.subevent_id] || 'Pending'}
                              onChange={(e) => handleSubeventResponse(subevent.subevent_id, e.target.value)}
                            >
                              <option value="Pending">Please select</option>
                              <option value="Confirmed">Will attend</option>
                              <option value="Declined">Will not attend</option>
                              <option value="Tentative">Maybe</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {rsvpData.main_rsvp_status === 'Confirmed' && (
                <div className="card glass-card mb-4">
                  <div className="card-body">
                    <h5 className="card-title mb-4">
                      <FaInfoCircle className="me-2 text-primary" />
                      Additional Information
                    </h5>
                    
                    <div className="row g-3">
                      {/* Plus One */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <FaUserFriends className="me-2 text-primary" />
                          Number of additional guests
                        </label>
                        <select
                          className="form-select glass-input"
                          value={rsvpData.plus_one_count}
                          onChange={(e) => handleInputChange('plus_one_count', e.target.value)}
                        >
                          <option value="0">Just me</option>
                          <option value="1">+1 guest</option>
                          <option value="2">+2 guests</option>
                          <option value="3">+3 guests</option>
                          <option value="4">+4 guests</option>
                        </select>
                      </div>

                      {/* Plus One Details */}
                      {parseInt(rsvpData.plus_one_count) > 0 && (
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            Guest names
                          </label>
                          <input
                            type="text"
                            className="form-control glass-input"
                            placeholder="Names of additional guests"
                            value={rsvpData.plus_one_details}
                            onChange={(e) => handleInputChange('plus_one_details', e.target.value)}
                          />
                        </div>
                      )}

                      {/* Dietary Requirements */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Dietary requirements
                        </label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          placeholder="e.g., Vegetarian, Vegan, Allergies"
                          value={rsvpData.dietary_requirements}
                          onChange={(e) => handleInputChange('dietary_requirements', e.target.value)}
                        />
                      </div>

                      {/* Special Requirements */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Special requirements
                        </label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          placeholder="e.g., Wheelchair access, Interpreter"
                          value={rsvpData.special_requirements}
                          onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                        />
                      </div>

                      {/* Additional Notes */}
                      <div className="col-12">
                        <label className="form-label fw-semibold">
                          Additional notes or questions
                        </label>
                        <textarea
                          className="form-control glass-input"
                          rows="3"
                          placeholder="Any additional information you'd like to share..."
                          value={rsvpData.guest_notes}
                          onChange={(e) => handleInputChange('guest_notes', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="card glass-card">
                <div className="card-body text-center">
                  <button
                    type="submit"
                    className="btn btn-primary glass-btn-primary btn-lg px-5"
                    disabled={isSubmitting || !rsvpData.main_rsvp_status}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />
                        Submit RSVP
                      </>
                    )}
                  </button>
                  
                  <div className="text-muted small mt-3">
                    Your response will be saved and a confirmation will be sent to your email.
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        .rsvp-option {
          transition: all 0.3s ease;
          border: 2px solid transparent;
          cursor: pointer;
        }
        
        .rsvp-option:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .rsvp-option.selected {
          border-color: #0d6efd;
          background: rgba(13, 110, 253, 0.1);
        }
        
        .glass-bg {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
      `}</style>
    </div>
  );
};

export default RSVPForm;