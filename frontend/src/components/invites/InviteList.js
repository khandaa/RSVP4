import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaPlus,
  FaEdit,
  FaEye,
  FaTrash,
  FaPaperPlane,
  FaChartLine,
  FaWhatsapp,
  FaCalendar,
  FaClock,
  FaUsers,
  FaFilter
} from 'react-icons/fa';
import { inviteAPI, eventAPI } from '../../services/api';

const InviteList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [invites, setInvites] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(searchParams.get('eventId') || '');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ show: false, invite: null });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchInvites(selectedEventId);
    } else {
      setInvites([]);
      setIsLoading(false);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const response = await eventAPI.getEvents();
      setEvents(response.data || response);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
    }
  };

  const fetchInvites = async (eventId) => {
    try {
      setIsLoading(true);
      const response = await inviteAPI.getInvitesByEvent(eventId);
      setInvites(response.data || response);
    } catch (error) {
      console.error('Error fetching invites:', error);
      toast.error('Failed to fetch invites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventChange = (eventId) => {
    setSelectedEventId(eventId);
    if (eventId) {
      setSearchParams({ eventId });
    } else {
      setSearchParams({});
    }
  };

  const handleCreateInvite = () => {
    if (!selectedEventId) {
      toast.error('Please select an event first');
      return;
    }
    navigate(`/invites/create?eventId=${selectedEventId}`);
  };

  const handleEditInvite = (invite) => {
    navigate(`/invites/${invite.invite_id}/edit`);
  };

  const handleViewInvite = (invite) => {
    navigate(`/invites/${invite.invite_id}/view`);
  };

  const handleSendInvite = (invite) => {
    if (!invite.invite_version_id) {
      toast.error('No active version found for this invite');
      return;
    }
    navigate(`/invites/${invite.invite_version_id}/send`);
  };

  const handleViewAnalytics = (invite) => {
    if (!invite.invite_version_id) {
      toast.error('No active version found for this invite');
      return;
    }
    navigate(`/invites/${invite.invite_version_id}/analytics`);
  };

  const handleDeleteInvite = async () => {
    try {
      await inviteAPI.deleteInvite(deleteModal.invite.invite_id);
      toast.success('Invite deleted successfully');
      setDeleteModal({ show: false, invite: null });
      if (selectedEventId) {
        fetchInvites(selectedEventId);
      }
    } catch (error) {
      console.error('Error deleting invite:', error);
      toast.error('Failed to delete invite');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Draft': 'bg-secondary',
      'Active': 'bg-success',
      'Sent': 'bg-primary',
      'Completed': 'bg-info'
    };
    return badges[status] || 'bg-light text-dark';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedEvent = events.find(e => e.event_id === parseInt(selectedEventId));

  if (isLoading && selectedEventId) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-bg min-vh-100 p-4">
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="text-dark fw-bold mb-0">
              <FaWhatsapp className="text-success me-2" />
              WhatsApp Invites
            </h2>
            <p className="text-muted">Create and send personalized invites to your guests</p>
          </div>
          <button
            className="btn btn-success glass-btn-success"
            onClick={handleCreateInvite}
            disabled={!selectedEventId}
          >
            <FaPlus className="me-2" />
            Create Invite
          </button>
        </div>

        {/* Event Filter */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text glass-input-addon">
                    <FaFilter />
                  </span>
                  <select
                    className="form-select glass-input"
                    value={selectedEventId}
                    onChange={(e) => handleEventChange(e.target.value)}
                  >
                    <option value="">Select an event to view invites</option>
                    {events.map(event => (
                      <option key={event.event_id} value={event.event_id}>
                        {event.event_name} - {new Date(event.event_start_date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-6 text-end">
                {selectedEvent && (
                  <div className="d-flex align-items-center justify-content-end">
                    <FaCalendar className="text-primary me-2" />
                    <span className="fw-medium">{selectedEvent.event_name}</span>
                    <span className="text-muted ms-2">
                      ({new Date(selectedEvent.event_start_date).toLocaleDateString()})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {!selectedEventId ? (
          <div className="text-center py-5">
            <FaWhatsapp size={64} className="text-muted mb-3" />
            <h4 className="text-muted">Select an event to view invites</h4>
            <p className="text-muted">Choose an event from the dropdown above to manage invites</p>
          </div>
        ) : invites.length === 0 ? (
          <div className="text-center py-5">
            <FaPaperPlane size={64} className="text-muted mb-3" />
            <h4 className="text-muted">No invites found</h4>
            <p className="text-muted">Create your first invite to get started</p>
            <button
              className="btn btn-success glass-btn-success"
              onClick={handleCreateInvite}
            >
              <FaPlus className="me-2" />
              Create First Invite
            </button>
          </div>
        ) : (
          <div className="row">
            {invites.map(invite => (
              <div key={invite.invite_id} className="col-lg-4 col-md-6 mb-4">
                <div className="card glass-card h-100">
                  <div className="card-header bg-transparent border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="card-title mb-0 fw-bold">
                        {invite.invite_name}
                      </h5>
                      <span className={`badge glass-badge ${getStatusBadge(invite.invite_status)}`}>
                        {invite.invite_status}
                      </span>
                    </div>
                  </div>

                  <div className="card-body">
                    {invite.invite_title && (
                      <h6 className="text-primary mb-2">{invite.invite_title}</h6>
                    )}

                    {invite.invite_description && (
                      <p className="text-muted small mb-3">
                        {invite.invite_description.length > 100
                          ? `${invite.invite_description.substring(0, 100)}...`
                          : invite.invite_description
                        }
                      </p>
                    )}

                    <div className="d-flex align-items-center text-muted small mb-2">
                      <FaClock className="me-2" />
                      Created {formatDate(invite.created_at)}
                    </div>

                    {invite.created_by_name && (
                      <div className="d-flex align-items-center text-muted small mb-2">
                        <FaUsers className="me-2" />
                        By {invite.created_by_name}
                      </div>
                    )}

                    {invite.version_number && (
                      <div className="d-flex align-items-center text-muted small mb-3">
                        <span className="badge bg-light text-dark">
                          Version {invite.version_number}
                        </span>
                        {invite.total_sent > 0 && (
                          <span className="badge bg-info ms-2">
                            {invite.total_sent} sent
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="card-footer bg-transparent border-top">
                    <div className="btn-group w-100" role="group">
                      <button
                        className="btn btn-sm btn-outline-primary glass-btn"
                        onClick={() => handleViewInvite(invite)}
                        title="View Invite"
                      >
                        <FaEye />
                      </button>

                      <button
                        className="btn btn-sm btn-outline-secondary glass-btn"
                        onClick={() => handleEditInvite(invite)}
                        title="Edit Invite"
                      >
                        <FaEdit />
                      </button>

                      {invite.invite_version_id && (
                        <>
                          <button
                            className="btn btn-sm btn-outline-success glass-btn"
                            onClick={() => handleSendInvite(invite)}
                            title="Send Invite"
                          >
                            <FaPaperPlane />
                          </button>

                          <button
                            className="btn btn-sm btn-outline-info glass-btn"
                            onClick={() => handleViewAnalytics(invite)}
                            title="View Analytics"
                          >
                            <FaChartLine />
                          </button>
                        </>
                      )}

                      <button
                        className="btn btn-sm btn-outline-danger glass-btn"
                        onClick={() => setDeleteModal({ show: true, invite })}
                        title="Delete Invite"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.show && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content glass-modal">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm Delete</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setDeleteModal({ show: false, invite: null })}
                  />
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete the invite <strong>"{deleteModal.invite?.invite_name}"</strong>?</p>
                  <div className="alert alert-warning">
                    <small>This action cannot be undone. All versions and analytics data will be permanently deleted.</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary glass-btn"
                    onClick={() => setDeleteModal({ show: false, invite: null })}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger glass-btn-danger"
                    onClick={handleDeleteInvite}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteList;