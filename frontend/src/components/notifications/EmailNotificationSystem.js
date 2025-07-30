import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FaEnvelope,
  FaPaperPlane,
  FaUsers,
  FaUser,
  FaCalendarAlt,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaFileExport,
  FaEye,
  FaClone,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaSpinner,
  FaPlus,
  FaSave,
  FaTimes,
  FaUndo,
  FaRedo,
  FaImage,
  FaLink,
  FaCode,
  FaBold,
  FaItalic,
  FaUnderline,
  FaList,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaHistory,
  FaChartBar
} from 'react-icons/fa';

const EmailNotificationSystem = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [activeTab, setActiveTab] = useState('campaigns');

  const [campaignForm, setCampaignForm] = useState({
    campaign_name: '',
    template_id: '',
    event_id: '',
    recipient_type: 'all',
    recipient_list: [],
    guest_group_ids: [],
    schedule_type: 'immediate',
    scheduled_datetime: '',
    subject_override: '',
    sender_name: '',
    sender_email: '',
    reply_to: '',
    priority: 'normal',
    track_opens: true,
    track_clicks: true,
    campaign_description: '',
    tags: ''
  });

  const recipientTypes = [
    { value: 'all', label: 'All Guests' },
    { value: 'event', label: 'Event Guests' },
    { value: 'group', label: 'Guest Groups' },
    { value: 'custom', label: 'Custom Selection' },
    { value: 'rsvp_pending', label: 'RSVP Pending' },
    { value: 'rsvp_confirmed', label: 'RSVP Confirmed' },
    { value: 'rsvp_declined', label: 'RSVP Declined' }
  ];

  const scheduleTypes = [
    { value: 'immediate', label: 'Send Immediately' },
    { value: 'scheduled', label: 'Schedule for Later' },
    { value: 'recurring', label: 'Recurring Campaign' }
  ];

  const campaignStatuses = [
    'Draft', 'Scheduled', 'Sending', 'Sent', 'Paused', 'Cancelled', 'Failed'
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low Priority' },
    { value: 'normal', label: 'Normal Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [
        campaignsRes,
        templatesRes,
        guestsRes,
        eventsRes
      ] = await Promise.all([
        fetch('/api/email-campaigns', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/notification-templates?type=email', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/guests', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/events', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const campaignsData = campaignsRes.ok ? await campaignsRes.json() : [];
      const templatesData = templatesRes.ok ? await templatesRes.json() : [];
      const guestsData = guestsRes.ok ? await guestsRes.json() : [];
      const eventsData = eventsRes.ok ? await eventsRes.json() : [];

      setCampaigns(campaignsData);
      setTemplates(templatesData);
      setGuests(guestsData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load email notification data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingCampaign 
        ? `/api/email-campaigns/${editingCampaign.campaign_id}`
        : '/api/email-campaigns';
      
      const method = editingCampaign ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(campaignForm)
      });

      if (!response.ok) {
        throw new Error('Failed to save campaign');
      }

      toast.success(`Campaign ${editingCampaign ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    }
  };

  const sendCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to send this campaign? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/email-campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to send campaign');
      }

      toast.success('Campaign sent successfully');
      fetchData();
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Failed to send campaign');
    }
  };

  const pauseCampaign = async (campaignId) => {
    try {
      const response = await fetch(`/api/email-campaigns/${campaignId}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to pause campaign');
      }

      toast.success('Campaign paused successfully');
      fetchData();
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast.error('Failed to pause campaign');
    }
  };

  const deleteCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const response = await fetch(`/api/email-campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete campaign');
      }

      toast.success('Campaign deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  const duplicateCampaign = (campaign) => {
    setCampaignForm({
      ...campaign,
      campaign_name: `${campaign.campaign_name} (Copy)`,
      campaign_id: undefined,
      status: 'Draft',
      schedule_type: 'immediate',
      scheduled_datetime: ''
    });
    setEditingCampaign(null);
    setShowModal(true);
  };

  const resetForm = () => {
    setCampaignForm({
      campaign_name: '',
      template_id: '',
      event_id: '',
      recipient_type: 'all',
      recipient_list: [],
      guest_group_ids: [],
      schedule_type: 'immediate',
      scheduled_datetime: '',
      subject_override: '',
      sender_name: '',
      sender_email: '',
      reply_to: '',
      priority: 'normal',
      track_opens: true,
      track_clicks: true,
      campaign_description: '',
      tags: ''
    });
    setEditingCampaign(null);
  };

  const openEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({ ...campaign });
    setShowModal(true);
  };

  const previewCampaign = async (campaign) => {
    try {
      const response = await fetch(`/api/email-campaigns/${campaign.campaign_id}/preview`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const previewData = await response.json();
        setPreviewData(previewData);
        setShowPreviewModal(true);
      } else {
        toast.error('Failed to generate preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    }
  };

  const getRecipientCount = () => {
    switch (campaignForm.recipient_type) {
      case 'all':
        return guests.length;
      case 'event':
        return guests.filter(g => g.event_id?.toString() === campaignForm.event_id).length;
      case 'custom':
        return campaignForm.recipient_list.length;
      case 'rsvp_pending':
        return guests.filter(g => !g.guest_rsvp_status || g.guest_rsvp_status === 'Pending').length;
      case 'rsvp_confirmed':
        return guests.filter(g => g.guest_rsvp_status === 'Confirmed').length;
      case 'rsvp_declined':
        return guests.filter(g => g.guest_rsvp_status === 'Declined').length;
      default:
        return 0;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Sent': case 'Delivered': return 'bg-success';
      case 'Sending': case 'Scheduled': return 'bg-primary';
      case 'Draft': case 'Paused': return 'bg-warning';
      case 'Failed': case 'Cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-danger';
      case 'high': return 'bg-warning';
      case 'normal': return 'bg-primary';
      case 'low': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const exportCampaigns = () => {
    const csvContent = [
      ['Campaign Name', 'Status', 'Recipients', 'Sent Date', 'Open Rate', 'Click Rate'].join(','),
      ...campaigns.map(campaign => [
        campaign.campaign_name,
        campaign.status,
        campaign.total_recipients || 0,
        campaign.sent_datetime ? formatDateTime(campaign.sent_datetime) : 'Not sent',
        campaign.open_rate ? `${campaign.open_rate}%` : '0%',
        campaign.click_rate ? `${campaign.click_rate}%` : '0%'
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email_campaigns_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = 
      campaign.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.campaign_description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filterStatus || campaign.status === filterStatus;
    const matchesEvent = !filterEvent || campaign.event_id?.toString() === filterEvent;
    
    return matchesSearch && matchesStatus && matchesEvent;
  });

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading email notification system...</p>
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
              <FaEnvelope className="me-2 text-primary" />
              Email Notification System
            </h2>
            <p className="text-muted mb-0">Create and manage email campaigns</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={exportCampaigns}
            >
              <FaFileExport className="me-2" />
              Export
            </button>
            <button 
              className="btn btn-primary glass-btn-primary"
              onClick={() => { resetForm(); setShowModal(true); }}
            >
              <FaPlus className="me-2" />
              Create Campaign
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaPaperPlane className="text-primary mb-2" size={24} />
                <h4 className="text-primary mb-1">{campaigns.filter(c => c.status === 'Sent').length}</h4>
                <small className="text-muted">Sent Campaigns</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaClock className="text-warning mb-2" size={24} />
                <h4 className="text-warning mb-1">{campaigns.filter(c => c.status === 'Scheduled').length}</h4>
                <small className="text-muted">Scheduled</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaEdit className="text-info mb-2" size={24} />
                <h4 className="text-info mb-1">{campaigns.filter(c => c.status === 'Draft').length}</h4>
                <small className="text-muted">Drafts</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaUsers className="text-success mb-2" size={24} />
                <h4 className="text-success mb-1">
                  {campaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0)}
                </h4>
                <small className="text-muted">Total Recipients</small>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="input-group">
                  <span className="input-group-text glass-input">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select glass-input"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {campaignStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select glass-input"
                  value={filterEvent}
                  onChange={(e) => setFilterEvent(e.target.value)}
                >
                  <option value="">All Events</option>
                  {events.map(event => (
                    <option key={event.event_id} value={event.event_id}>
                      {event.event_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <button 
                  className="btn btn-outline-secondary glass-btn w-100"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('');
                    setFilterEvent('');
                  }}
                >
                  <FaTimes className="me-2" />
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="card glass-card">
          <div className="card-body">
            {filteredCampaigns.length === 0 ? (
              <div className="text-center py-5">
                <FaEnvelope className="text-muted mb-3" size={48} />
                <h5 className="text-muted">No email campaigns found</h5>
                <p className="text-muted mb-3">Create your first email campaign to get started.</p>
                <button 
                  className="btn btn-primary glass-btn-primary"
                  onClick={() => { resetForm(); setShowModal(true); }}
                >
                  Create Campaign
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Status</th>
                      <th>Recipients</th>
                      <th>Schedule</th>
                      <th>Performance</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map((campaign) => (
                      <tr key={campaign.campaign_id}>
                        <td>
                          <div className="fw-semibold">{campaign.campaign_name}</div>
                          <small className="text-muted">{campaign.campaign_description}</small>
                          <div className="mt-1">
                            <span className={`badge glass-badge ${getPriorityBadgeClass(campaign.priority)}`}>
                              {campaign.priority}
                            </span>
                            {campaign.event_name && (
                              <span className="badge bg-info glass-badge ms-1">
                                {campaign.event_name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge glass-badge ${getStatusBadgeClass(campaign.status)}`}>
                            {campaign.status}
                          </span>
                          {campaign.status === 'Sending' && (
                            <div className="mt-1">
                              <FaSpinner className="fa-spin text-primary" size={12} />
                              <small className="text-muted ms-1">Sending...</small>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="fw-semibold">{campaign.total_recipients || 0}</div>
                          <small className="text-muted">{campaign.recipient_type}</small>
                        </td>
                        <td>
                          {campaign.scheduled_datetime ? (
                            <div>
                              <div className="fw-semibold">{formatDateTime(campaign.scheduled_datetime)}</div>
                              <small className="text-muted">Scheduled</small>
                            </div>
                          ) : campaign.sent_datetime ? (
                            <div>
                              <div className="fw-semibold">{formatDateTime(campaign.sent_datetime)}</div>
                              <small className="text-muted">Sent</small>
                            </div>
                          ) : (
                            <span className="text-muted">Not scheduled</span>
                          )}
                        </td>
                        <td>
                          {campaign.status === 'Sent' ? (
                            <div>
                              <div className="text-success">
                                <small>Opens: {campaign.open_rate || 0}%</small>
                              </div>
                              <div className="text-info">
                                <small>Clicks: {campaign.click_rate || 0}%</small>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-outline-info glass-btn"
                              onClick={() => previewCampaign(campaign)}
                              title="Preview"
                            >
                              <FaEye />
                            </button>
                            {campaign.status === 'Draft' && (
                              <>
                                <button
                                  className="btn btn-sm btn-outline-primary glass-btn"
                                  onClick={() => openEditCampaign(campaign)}
                                  title="Edit"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-success glass-btn"
                                  onClick={() => sendCampaign(campaign.campaign_id)}
                                  title="Send"
                                >
                                  <FaPaperPlane />
                                </button>
                              </>
                            )}
                            {campaign.status === 'Sending' && (
                              <button
                                className="btn btn-sm btn-outline-warning glass-btn"
                                onClick={() => pauseCampaign(campaign.campaign_id)}
                                title="Pause"
                              >
                                <FaTimes />
                              </button>
                            )}
                            <button
                              className="btn btn-sm btn-outline-secondary glass-btn"
                              onClick={() => duplicateCampaign(campaign)}
                              title="Duplicate"
                            >
                              <FaClone />
                            </button>
                            {campaign.status === 'Draft' && (
                              <button
                                className="btn btn-sm btn-outline-danger glass-btn"
                                onClick={() => deleteCampaign(campaign.campaign_id)}
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Campaign Modal */}
        {showModal && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-backdrop fade show"></div>
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content glass-modal">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FaEnvelope className="me-2" />
                    {editingCampaign ? 'Edit Campaign' : 'Create Email Campaign'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="row g-3">
                      {/* Basic Information */}
                      <div className="col-md-8">
                        <label className="form-label fw-semibold">Campaign Name *</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={campaignForm.campaign_name}
                          onChange={(e) => setCampaignForm({...campaignForm, campaign_name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Priority</label>
                        <select
                          className="form-select glass-input"
                          value={campaignForm.priority}
                          onChange={(e) => setCampaignForm({...campaignForm, priority: e.target.value})}
                        >
                          {priorityLevels.map(priority => (
                            <option key={priority.value} value={priority.value}>{priority.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Template Selection */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Email Template *</label>
                        <select
                          className="form-select glass-input"
                          value={campaignForm.template_id}
                          onChange={(e) => setCampaignForm({...campaignForm, template_id: e.target.value})}
                          required
                        >
                          <option value="">Select Template</option>
                          {templates.map(template => (
                            <option key={template.template_id} value={template.template_id}>
                              {template.template_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Event (Optional)</label>
                        <select
                          className="form-select glass-input"
                          value={campaignForm.event_id}
                          onChange={(e) => setCampaignForm({...campaignForm, event_id: e.target.value})}
                        >
                          <option value="">All Events</option>
                          {events.map(event => (
                            <option key={event.event_id} value={event.event_id}>
                              {event.event_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Recipients */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Recipients *</label>
                        <select
                          className="form-select glass-input"
                          value={campaignForm.recipient_type}
                          onChange={(e) => setCampaignForm({...campaignForm, recipient_type: e.target.value})}
                          required
                        >
                          {recipientTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Estimated Recipients</label>
                        <div className="form-control glass-input bg-light">
                          <FaUsers className="me-2 text-primary" />
                          {getRecipientCount()} recipients
                        </div>
                      </div>

                      {/* Scheduling */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Schedule Type</label>
                        <select
                          className="form-select glass-input"
                          value={campaignForm.schedule_type}
                          onChange={(e) => setCampaignForm({...campaignForm, schedule_type: e.target.value})}
                        >
                          {scheduleTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      {campaignForm.schedule_type === 'scheduled' && (
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Schedule Date & Time</label>
                          <input
                            type="datetime-local"
                            className="form-control glass-input"
                            value={campaignForm.scheduled_datetime}
                            onChange={(e) => setCampaignForm({...campaignForm, scheduled_datetime: e.target.value})}
                          />
                        </div>
                      )}

                      {/* Email Settings */}
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Sender Name</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={campaignForm.sender_name}
                          onChange={(e) => setCampaignForm({...campaignForm, sender_name: e.target.value})}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Sender Email</label>
                        <input
                          type="email"
                          className="form-control glass-input"
                          value={campaignForm.sender_email}
                          onChange={(e) => setCampaignForm({...campaignForm, sender_email: e.target.value})}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Reply To</label>
                        <input
                          type="email"
                          className="form-control glass-input"
                          value={campaignForm.reply_to}
                          onChange={(e) => setCampaignForm({...campaignForm, reply_to: e.target.value})}
                        />
                      </div>

                      {/* Subject Override */}
                      <div className="col-12">
                        <label className="form-label fw-semibold">Subject Override (Optional)</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          placeholder="Leave empty to use template subject"
                          value={campaignForm.subject_override}
                          onChange={(e) => setCampaignForm({...campaignForm, subject_override: e.target.value})}
                        />
                      </div>

                      {/* Description */}
                      <div className="col-12">
                        <label className="form-label fw-semibold">Campaign Description</label>
                        <textarea
                          className="form-control glass-input"
                          rows="3"
                          value={campaignForm.campaign_description}
                          onChange={(e) => setCampaignForm({...campaignForm, campaign_description: e.target.value})}
                        />
                      </div>

                      {/* Tracking Options */}
                      <div className="col-md-6">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={campaignForm.track_opens}
                            onChange={(e) => setCampaignForm({...campaignForm, track_opens: e.target.checked})}
                          />
                          <label className="form-check-label">
                            Track Email Opens
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={campaignForm.track_clicks}
                            onChange={(e) => setCampaignForm({...campaignForm, track_clicks: e.target.checked})}
                          />
                          <label className="form-check-label">
                            Track Link Clicks
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary glass-btn"
                      onClick={() => setShowModal(false)}
                    >
                      <FaTimes className="me-2" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary glass-btn-primary"
                    >
                      <FaSave className="me-2" />
                      {editingCampaign ? 'Update' : 'Create'} Campaign
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && previewData && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-backdrop fade show"></div>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content glass-modal">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FaEye className="me-2" />
                    Campaign Preview
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowPreviewModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="card">
                    <div className="card-header">
                      <div className="row">
                        <div className="col-md-6">
                          <strong>From:</strong> {previewData.sender_name} &lt;{previewData.sender_email}&gt;
                        </div>
                        <div className="col-md-6">
                          <strong>To:</strong> Sample Recipient
                        </div>
                      </div>
                      <div className="mt-2">
                        <strong>Subject:</strong> {previewData.subject}
                      </div>
                    </div>
                    <div className="card-body">
                      <div 
                        className="border rounded p-3" 
                        style={{ backgroundColor: '#fff', minHeight: '300px' }}
                        dangerouslySetInnerHTML={{ __html: previewData.content }}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary glass-btn"
                    onClick={() => setShowPreviewModal(false)}
                  >
                    Close
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

export default EmailNotificationSystem;