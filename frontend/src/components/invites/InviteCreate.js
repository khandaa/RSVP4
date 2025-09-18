import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaSave,
  FaEye,
  FaArrowLeft,
  FaImage,
  FaVideo,
  FaTrash,
  FaPalette,
  FaFont,
  FaWhatsapp,
  FaUpload,
  FaPaperPlane
} from 'react-icons/fa';
import { inviteAPI, eventAPI, clientAPI } from '../../services/api';

const InviteCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [formData, setFormData] = useState({
    client_id: '',
    event_id: searchParams.get('eventId') || '',
    invite_name: '',
    invite_description: '',
    invite_title: '',
    invite_text: '',
    invite_images: [],
    invite_videos: [],
    background_color: '#ffffff',
    text_color: '#000000',
    font_family: 'Arial',
    template_style: {}
  });

  const [errors, setErrors] = useState({});
  const [previewPhone, setPreviewPhone] = useState('');

  useEffect(() => {
    fetchEvents();
    fetchClients();
  }, []);

  useEffect(() => {
    if (formData.event_id) {
      const selectedEvent = events.find(e => e.event_id === parseInt(formData.event_id));
      if (selectedEvent) {
        setFormData(prev => ({
          ...prev,
          client_id: selectedEvent.client_id
        }));
      }
    }
  }, [formData.event_id, events]);

  const fetchEvents = async () => {
    try {
      const response = await eventAPI.getEvents();
      setEvents(response.data || response);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientAPI.getClients();
      setClients(response.data || response);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to fetch clients');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingMedia(true);
    try {
      const formDataUpload = new FormData();
      files.forEach(file => {
        formDataUpload.append('media', file);
      });

      const response = await inviteAPI.uploadMedia(formDataUpload);
      const uploadedFiles = response.data.files || [];

      // Add uploaded files to the appropriate array
      setFormData(prev => ({
        ...prev,
        [type === 'image' ? 'invite_images' : 'invite_videos']: [
          ...prev[type === 'image' ? 'invite_images' : 'invite_videos'],
          ...uploadedFiles.map(file => file.url)
        ]
      }));

      toast.success(`${uploadedFiles.length} ${type}(s) uploaded successfully`);
    } catch (error) {
      console.error(`Error uploading ${type}s:`, error);
      toast.error(`Failed to upload ${type}s`);
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMedia = (index, type) => {
    setFormData(prev => ({
      ...prev,
      [type === 'image' ? 'invite_images' : 'invite_videos']: prev[type === 'image' ? 'invite_images' : 'invite_videos'].filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.client_id) newErrors.client_id = 'Client is required';
    if (!formData.event_id) newErrors.event_id = 'Event is required';
    if (!formData.invite_name.trim()) newErrors.invite_name = 'Invite name is required';
    if (!formData.invite_title.trim()) newErrors.invite_title = 'Invite title is required';
    if (!formData.invite_text.trim()) newErrors.invite_text = 'Invite text is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsLoading(true);
    try {
      const response = await inviteAPI.createInvite(formData);
      toast.success('Invite created successfully!');
      navigate(`/invites/${response.data.invite_id}/view`);
    } catch (error) {
      console.error('Error creating invite:', error);
      toast.error('Failed to create invite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPreview = async () => {
    if (!previewPhone.trim()) {
      toast.error('Please enter a phone number for preview');
      return;
    }

    if (!formData.invite_title.trim() || !formData.invite_text.trim()) {
      toast.error('Please fill in invite title and text');
      return;
    }

    setIsLoading(true);
    try {
      const inviteData = {
        title: formData.invite_title,
        text: formData.invite_text,
        images: formData.invite_images,
        videos: formData.invite_videos
      };

      await inviteAPI.sendPreview({
        phone_number: previewPhone,
        invite_data: inviteData
      });

      toast.success('Preview sent successfully!');
      setPreviewPhone('');
    } catch (error) {
      console.error('Error sending preview:', error);
      toast.error(error.response?.data?.error || 'Failed to send preview');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedEvent = events.find(e => e.event_id === parseInt(formData.event_id));

  return (
    <div className="glass-bg min-vh-100 p-4">
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <button
              className="btn btn-outline-secondary me-3"
              onClick={() => navigate('/invites')}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-dark fw-bold mb-0">Create New Invite</h2>
              <p className="text-muted mb-0">Design and create a WhatsApp invite for your event</p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-info glass-btn"
              onClick={() => setShowPreview(!showPreview)}
            >
              <FaEye className="me-2" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
        </div>

        <div className="row">
          {/* Form Section */}
          <div className={showPreview ? 'col-lg-8' : 'col-12'}>
            <form onSubmit={handleSubmit}>
              <div className="card glass-card mb-4">
                <div className="card-header">
                  <h5 className="card-title mb-0">Basic Information</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-medium">Event *</label>
                      <select
                        name="event_id"
                        className={`form-select glass-input ${errors.event_id ? 'is-invalid' : ''}`}
                        value={formData.event_id}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Event</option>
                        {events.map(event => (
                          <option key={event.event_id} value={event.event_id}>
                            {event.event_name} - {new Date(event.event_start_date).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                      {errors.event_id && <div className="invalid-feedback">{errors.event_id}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-medium">Invite Name *</label>
                      <input
                        type="text"
                        name="invite_name"
                        className={`form-control glass-input ${errors.invite_name ? 'is-invalid' : ''}`}
                        value={formData.invite_name}
                        onChange={handleInputChange}
                        placeholder="e.g., Wedding Ceremony Invite"
                      />
                      {errors.invite_name && <div className="invalid-feedback">{errors.invite_name}</div>}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Description</label>
                    <textarea
                      name="invite_description"
                      className="form-control glass-input"
                      rows="2"
                      value={formData.invite_description}
                      onChange={handleInputChange}
                      placeholder="Brief description of this invite"
                    />
                  </div>
                </div>
              </div>

              <div className="card glass-card mb-4">
                <div className="card-header">
                  <h5 className="card-title mb-0">Invite Content</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label fw-medium">Invite Title *</label>
                    <input
                      type="text"
                      name="invite_title"
                      className={`form-control glass-input ${errors.invite_title ? 'is-invalid' : ''}`}
                      value={formData.invite_title}
                      onChange={handleInputChange}
                      placeholder="e.g., You're Invited to Our Wedding!"
                    />
                    {errors.invite_title && <div className="invalid-feedback">{errors.invite_title}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Invite Message *</label>
                    <textarea
                      name="invite_text"
                      className={`form-control glass-input ${errors.invite_text ? 'is-invalid' : ''}`}
                      rows="6"
                      value={formData.invite_text}
                      onChange={handleInputChange}
                      placeholder="Write your invitation message here..."
                    />
                    {errors.invite_text && <div className="invalid-feedback">{errors.invite_text}</div>}
                    <small className="text-muted">This will be the main text message sent via WhatsApp</small>
                  </div>
                </div>
              </div>

              <div className="card glass-card mb-4">
                <div className="card-header">
                  <h5 className="card-title mb-0">Media Attachments</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-medium">
                        <FaImage className="me-2" />
                        Images
                      </label>
                      <input
                        type="file"
                        className="form-control glass-input"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'image')}
                        disabled={uploadingMedia}
                      />
                      {formData.invite_images.length > 0 && (
                        <div className="mt-2">
                          {formData.invite_images.map((image, index) => (
                            <div key={index} className="d-flex align-items-center justify-content-between border rounded p-2 mb-1">
                              <small className="text-truncate">{image.split('/').pop()}</small>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeMedia(index, 'image')}
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-medium">
                        <FaVideo className="me-2" />
                        Videos
                      </label>
                      <input
                        type="file"
                        className="form-control glass-input"
                        multiple
                        accept="video/*"
                        onChange={(e) => handleFileUpload(e, 'video')}
                        disabled={uploadingMedia}
                      />
                      {formData.invite_videos.length > 0 && (
                        <div className="mt-2">
                          {formData.invite_videos.map((video, index) => (
                            <div key={index} className="d-flex align-items-center justify-content-between border rounded p-2 mb-1">
                              <small className="text-truncate">{video.split('/').pop()}</small>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeMedia(index, 'video')}
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {uploadingMedia && (
                    <div className="text-center">
                      <div className="spinner-border spinner-border-sm text-primary me-2" />
                      Uploading media...
                    </div>
                  )}
                </div>
              </div>

              <div className="card glass-card mb-4">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <FaPalette className="me-2" />
                    Styling Options
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-medium">Background Color</label>
                      <input
                        type="color"
                        name="background_color"
                        className="form-control form-control-color"
                        value={formData.background_color}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-medium">Text Color</label>
                      <input
                        type="color"
                        name="text_color"
                        className="form-control form-control-color"
                        value={formData.text_color}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-medium">
                        <FaFont className="me-2" />
                        Font Family
                      </label>
                      <select
                        name="font_family"
                        className="form-select glass-input"
                        value={formData.font_family}
                        onChange={handleInputChange}
                      >
                        <option value="Arial">Arial</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Verdana">Verdana</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card glass-card mb-4">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <FaWhatsapp className="text-success me-2" />
                    Send Preview
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row align-items-end">
                    <div className="col-md-8 mb-2">
                      <label className="form-label fw-medium">Test Phone Number</label>
                      <input
                        type="tel"
                        className="form-control glass-input"
                        value={previewPhone}
                        onChange={(e) => setPreviewPhone(e.target.value)}
                        placeholder="+91 9876543210"
                      />
                      <small className="text-muted">Enter your WhatsApp number to receive a preview</small>
                    </div>
                    <div className="col-md-4 mb-2">
                      <button
                        type="button"
                        className="btn btn-success glass-btn-success w-100"
                        onClick={handleSendPreview}
                        disabled={isLoading || !previewPhone.trim()}
                      >
                        {isLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <FaPaperPlane className="me-2" />
                            Send Preview
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary glass-btn"
                  onClick={() => navigate('/invites')}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary glass-btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-2" />
                      Create Invite
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="col-lg-4">
              <div className="position-sticky" style={{ top: '20px' }}>
                <div className="card glass-card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">
                      <FaWhatsapp className="text-success me-2" />
                      WhatsApp Preview
                    </h5>
                  </div>
                  <div className="card-body">
                    <div
                      className="border rounded p-3"
                      style={{
                        backgroundColor: formData.background_color,
                        color: formData.text_color,
                        fontFamily: formData.font_family,
                        minHeight: '300px'
                      }}
                    >
                      {formData.invite_title && (
                        <h6 className="fw-bold mb-3" style={{ color: formData.text_color }}>
                          {formData.invite_title}
                        </h6>
                      )}

                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                        {formData.invite_text || 'Your invite message will appear here...'}
                      </div>

                      {formData.invite_images.length > 0 && (
                        <div className="mt-3">
                          <small className="text-muted d-block mb-2">Images will be attached:</small>
                          <div className="d-flex flex-wrap gap-1">
                            {formData.invite_images.map((_, index) => (
                              <div key={index} className="badge bg-info">
                                <FaImage className="me-1" />
                                Image {index + 1}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {formData.invite_videos.length > 0 && (
                        <div className="mt-2">
                          <small className="text-muted d-block mb-2">Videos will be attached:</small>
                          <div className="d-flex flex-wrap gap-1">
                            {formData.invite_videos.map((_, index) => (
                              <div key={index} className="badge bg-warning">
                                <FaVideo className="me-1" />
                                Video {index + 1}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedEvent && (
                      <div className="mt-3 p-2 bg-light rounded">
                        <small className="text-muted">
                          <strong>Event:</strong> {selectedEvent.event_name}<br />
                          <strong>Date:</strong> {new Date(selectedEvent.event_start_date).toLocaleDateString()}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteCreate;