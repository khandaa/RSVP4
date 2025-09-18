import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaArrowLeft,
  FaUsers,
  FaWhatsapp,
  FaPaperPlane,
  FaCheck,
  FaTimes,
  FaPhone,
  FaEnvelope,
  FaUser,
  FaFilter,
  FaSearch
} from 'react-icons/fa';
import { inviteAPI, guestAPI } from '../../services/api';

const InviteSend = () => {
  const { versionId } = useParams();
  const navigate = useNavigate();

  const [inviteVersion, setInviteVersion] = useState(null);
  const [guests, setGuests] = useState([]);
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendResults, setSendResults] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchInviteVersion();
  }, [versionId]);

  useEffect(() => {
    if (inviteVersion) {
      fetchGuests();
    }
  }, [inviteVersion]);

  useEffect(() => {
    filterGuests();
  }, [guests, searchTerm, statusFilter]);

  const fetchInviteVersion = async () => {
    try {
      const response = await inviteAPI.getInviteVersions(versionId.split('-')[0]); // Extract invite ID from version ID
      const versions = response.data || response;
      const version = versions.find(v => v.invite_version_id === parseInt(versionId));

      if (version) {
        setInviteVersion(version);
      } else {
        toast.error('Invite version not found');
        navigate('/invites');
      }
    } catch (error) {
      console.error('Error fetching invite version:', error);
      toast.error('Failed to fetch invite details');
      navigate('/invites');
    }
  };

  const fetchGuests = async () => {
    try {
      setIsLoading(true);
      // Assuming we need to get the event ID from the invite version
      // For now, we'll get all guests - this should be filtered by event
      const response = await guestAPI.getGuests();
      const guestList = response.data || response;

      // Filter guests with phone numbers only
      const guestsWithPhone = guestList.filter(guest => guest.guest_phone);
      setGuests(guestsWithPhone);
    } catch (error) {
      console.error('Error fetching guests:', error);
      toast.error('Failed to fetch guests');
    } finally {
      setIsLoading(false);
    }
  };

  const filterGuests = () => {
    let filtered = [...guests];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(guest =>
        `${guest.guest_first_name} ${guest.guest_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.guest_phone?.includes(searchTerm) ||
        guest.guest_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(guest => guest.guest_status === statusFilter);
    }

    setFilteredGuests(filtered);
  };

  const handleGuestSelection = (guest) => {
    setSelectedGuests(prev => {
      const isSelected = prev.find(g => g.guest_id === guest.guest_id);
      if (isSelected) {
        return prev.filter(g => g.guest_id !== guest.guest_id);
      } else {
        return [...prev, guest];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedGuests.length === filteredGuests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests([...filteredGuests]);
    }
  };

  const handleSendInvites = async () => {
    if (selectedGuests.length === 0) {
      toast.error('Please select at least one guest');
      return;
    }

    setShowConfirmModal(false);
    setIsSending(true);

    try {
      const guestIds = selectedGuests.map(g => g.guest_id);
      const response = await inviteAPI.sendInvites(versionId, guestIds);

      setSendResults(response.data || response);
      toast.success(`Invites sent to ${response.data?.sentCount || 0} guests successfully!`);

      // Optionally navigate to analytics page
      setTimeout(() => {
        navigate(`/invites/${versionId}/analytics`);
      }, 3000);

    } catch (error) {
      console.error('Error sending invites:', error);
      toast.error('Failed to send invites');
    } finally {
      setIsSending(false);
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Format phone number for display
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  };

  if (isLoading || !inviteVersion) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (sendResults) {
    return (
      <div className="glass-bg min-vh-100 p-4">
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card glass-card">
                <div className="card-header text-center">
                  <FaWhatsapp size={48} className="text-success mb-3" />
                  <h3 className="text-success mb-0">Invites Sent Successfully!</h3>
                </div>
                <div className="card-body text-center">
                  <div className="row mb-4">
                    <div className="col-md-4">
                      <div className="card bg-success text-white">
                        <div className="card-body">
                          <h4 className="card-title">{sendResults.sentCount}</h4>
                          <p className="card-text">Successfully Sent</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card bg-danger text-white">
                        <div className="card-body">
                          <h4 className="card-title">{sendResults.failedCount}</h4>
                          <p className="card-text">Failed</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card bg-info text-white">
                        <div className="card-body">
                          <h4 className="card-title">{sendResults.totalGuests}</h4>
                          <p className="card-text">Total Guests</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-center gap-3">
                    <button
                      className="btn btn-primary glass-btn-primary"
                      onClick={() => navigate(`/invites/${versionId}/analytics`)}
                    >
                      View Analytics
                    </button>
                    <button
                      className="btn btn-outline-secondary glass-btn"
                      onClick={() => navigate('/invites')}
                    >
                      Back to Invites
                    </button>
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
              <h2 className="text-dark fw-bold mb-0">
                <FaWhatsapp className="text-success me-2" />
                Send Invite
              </h2>
              <p className="text-muted mb-0">Select guests to send the invite via WhatsApp</p>
            </div>
          </div>
          <button
            className="btn btn-success glass-btn-success"
            onClick={() => setShowConfirmModal(true)}
            disabled={selectedGuests.length === 0 || isSending}
          >
            {isSending ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Sending...
              </>
            ) : (
              <>
                <FaPaperPlane className="me-2" />
                Send to {selectedGuests.length} Guest{selectedGuests.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>

        {/* Invite Preview */}
        <div className="card glass-card mb-4">
          <div className="card-header">
            <h5 className="card-title mb-0">Invite Preview</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-8">
                <h6 className="text-primary mb-2">{inviteVersion.invite_title}</h6>
                <div style={{ whiteSpace: 'pre-wrap' }} className="mb-3">
                  {inviteVersion.invite_text}
                </div>
                <div className="d-flex gap-2">
                  {JSON.parse(inviteVersion.invite_images || '[]').length > 0 && (
                    <span className="badge bg-info">
                      {JSON.parse(inviteVersion.invite_images || '[]').length} Image(s)
                    </span>
                  )}
                  {JSON.parse(inviteVersion.invite_videos || '[]').length > 0 && (
                    <span className="badge bg-warning">
                      {JSON.parse(inviteVersion.invite_videos || '[]').length} Video(s)
                    </span>
                  )}
                </div>
              </div>
              <div className="col-md-4">
                <div className="bg-light rounded p-3">
                  <small className="text-muted">
                    <strong>Version:</strong> {inviteVersion.version_number}<br />
                    <strong>Created:</strong> {new Date(inviteVersion.created_at).toLocaleDateString()}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Selection */}
        <div className="card glass-card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">
                <FaUsers className="me-2" />
                Select Guests ({selectedGuests.length} of {filteredGuests.length} selected)
              </h5>
              <button
                className="btn btn-sm btn-outline-primary glass-btn"
                onClick={handleSelectAll}
              >
                {selectedGuests.length === filteredGuests.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
          <div className="card-body">
            {/* Filters */}
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text glass-input-addon">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder="Search guests by name, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="input-group">
                  <span className="input-group-text glass-input-addon">
                    <FaFilter />
                  </span>
                  <select
                    className="form-select glass-input"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="col-md-3 text-end">
                <span className="text-muted small">
                  Showing {filteredGuests.length} of {guests.length} guests
                </span>
              </div>
            </div>

            {/* Guest List */}
            {filteredGuests.length === 0 ? (
              <div className="text-center py-4">
                <FaUsers size={48} className="text-muted mb-3" />
                <h5 className="text-muted">No guests found</h5>
                <p className="text-muted">
                  {guests.length === 0
                    ? 'No guests with phone numbers available'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th width="50">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedGuests.length === filteredGuests.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th>Guest</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGuests.map(guest => (
                      <tr key={guest.guest_id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedGuests.find(g => g.guest_id === guest.guest_id) !== undefined}
                            onChange={() => handleGuestSelection(guest)}
                          />
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaUser className="text-primary me-2" />
                            <div>
                              <div className="fw-medium">
                                {guest.guest_first_name} {guest.guest_last_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaPhone className="text-success me-2" size={12} />
                            {formatPhoneNumber(guest.guest_phone)}
                          </div>
                        </td>
                        <td>
                          {guest.guest_email ? (
                            <div className="d-flex align-items-center">
                              <FaEnvelope className="text-info me-2" size={12} />
                              {guest.guest_email}
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${guest.guest_status === 'Active' ? 'bg-success' : 'bg-warning'}`}>
                            {guest.guest_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content glass-modal">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm Send Invites</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowConfirmModal(false)}
                  />
                </div>
                <div className="modal-body">
                  <div className="d-flex align-items-center mb-3">
                    <FaWhatsapp size={32} className="text-success me-3" />
                    <div>
                      <h6 className="mb-0">Send WhatsApp Invites</h6>
                      <small className="text-muted">This will send invites to {selectedGuests.length} selected guests</small>
                    </div>
                  </div>

                  <div className="alert alert-info">
                    <ul className="mb-0 ps-3">
                      <li>Invites will be sent via WhatsApp Business API</li>
                      <li>Each guest will receive the invite text and media attachments</li>
                      <li>Delivery status will be tracked and updated in real-time</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>

                  <div className="bg-light rounded p-3">
                    <h6 className="mb-2">Selected Guests ({selectedGuests.length})</h6>
                    <div className="max-height-200 overflow-auto">
                      {selectedGuests.slice(0, 10).map(guest => (
                        <div key={guest.guest_id} className="d-flex justify-content-between align-items-center py-1">
                          <span>{guest.guest_first_name} {guest.guest_last_name}</span>
                          <small className="text-muted">{formatPhoneNumber(guest.guest_phone)}</small>
                        </div>
                      ))}
                      {selectedGuests.length > 10 && (
                        <div className="text-muted text-center">
                          ... and {selectedGuests.length - 10} more guests
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary glass-btn"
                    onClick={() => setShowConfirmModal(false)}
                  >
                    <FaTimes className="me-2" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-success glass-btn-success"
                    onClick={handleSendInvites}
                  >
                    <FaCheck className="me-2" />
                    Send Invites
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

export default InviteSend;