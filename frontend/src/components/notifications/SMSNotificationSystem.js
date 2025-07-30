import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FaSms,
  FaMobileAlt,
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
  FaHistory,
  FaChartBar,
  FaPhone,
  FaGlobe,
  FaSignal,
  FaExclamationCircle,
  FaMoneyBillWave,
  FaCalculator
} from 'react-icons/fa';

const SMSNotificationSystem = () => {
  const [smsCampaigns, setSmsCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [smsSettings, setSmsSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEvent, setFilterEvent] = useState('');

  const [campaignForm, setCampaignForm] = useState({
    campaign_name: '',
    template_id: '',
    event_id: '',
    recipient_type: 'all',
    recipient_list: [],
    guest_group_ids: [],
    schedule_type: 'immediate',
    scheduled_datetime: '',
    message_override: '',
    sender_id: '',
    priority: 'normal',
    delivery_receipt: true,
    campaign_description: '',
    cost_limit: '',
    tags: ''
  });

  const [settingsForm, setSettingsForm] = useState({
    provider: 'twilio',
    account_sid: '',
    auth_token: '',
    phone_number: '',
    webhook_url: '',
    default_sender_id: '',
    rate_limit: 10,
    cost_per_sms: 0.01,
    monthly_limit: 1000,
    country_code: '+1',
    enable_delivery_reports: true,
    enable_unicode: true
  });

  const recipientTypes = [
    { value: 'all', label: 'All Guests (with phone)' },
    { value: 'event', label: 'Event Guests' },
    { value: 'group', label: 'Guest Groups' },
    { value: 'custom', label: 'Custom Selection' },
    { value: 'rsvp_pending', label: 'RSVP Pending' },
    { value: 'rsvp_confirmed', label: 'RSVP Confirmed' },
    { value: 'rsvp_declined', label: 'RSVP Declined' },
    { value: 'no_email', label: 'Guests without Email' }
  ];

  const scheduleTypes = [
    { value: 'immediate', label: 'Send Immediately' },
    { value: 'scheduled', label: 'Schedule for Later' },
    { value: 'recurring', label: 'Recurring SMS' }
  ];

  const smsProviders = [
    { value: 'twilio', label: 'Twilio', icon: FaSms },
    { value: 'aws_sns', label: 'AWS SNS', icon: FaGlobe },
    { value: 'nexmo', label: 'Vonage (Nexmo)', icon: FaSignal },
    { value: 'textlocal', label: 'TextLocal', icon: FaMobileAlt }
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

  // SMS length limits
  const SMS_LIMITS = {
    single: 160,
    unicode: 70,
    multipart: 153
  };

  useEffect(() => {
    fetchData();
    fetchSmsSettings();
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
        fetch('/api/sms-campaigns', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/notification-templates?type=sms', {
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

      setSmsCampaigns(campaignsData);
      setTemplates(templatesData);
      setGuests(guestsData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load SMS notification data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSmsSettings = async () => {
    try {
      const response = await fetch('/api/sms-settings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSmsSettings(data);
        setSettingsForm(data);
      }
    } catch (error) {
      console.error('Error fetching SMS settings:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate SMS length
    const messageLength = getMessageLength(campaignForm.message_override || getTemplateContent());
    if (messageLength > SMS_LIMITS.single && !campaignForm.allow_multipart) {
      toast.error(`Message is too long (${messageLength} chars). Enable multipart SMS or reduce message length.`);
      return;
    }

    try {
      const url = editingCampaign 
        ? `/api/sms-campaigns/${editingCampaign.campaign_id}`
        : '/api/sms-campaigns';
      
      const method = editingCampaign ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...campaignForm,
          estimated_cost: calculateEstimatedCost()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save SMS campaign');
      }

      toast.success(`SMS campaign ${editingCampaign ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving SMS campaign:', error);
      toast.error('Failed to save SMS campaign');
    }
  };

  const sendSmsCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to send this SMS campaign? This action cannot be undone and will incur charges.')) return;

    try {
      const response = await fetch(`/api/sms-campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to send SMS campaign');
      }

      toast.success('SMS campaign sent successfully');
      fetchData();
    } catch (error) {
      console.error('Error sending SMS campaign:', error);
      toast.error('Failed to send SMS campaign');
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/sms-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settingsForm)
      });

      if (!response.ok) {
        throw new Error('Failed to save SMS settings');
      }

      toast.success('SMS settings saved successfully');
      setShowSettingsModal(false);
      fetchSmsSettings();
    } catch (error) {
      console.error('Error saving SMS settings:', error);
      toast.error('Failed to save SMS settings');
    }
  };

  const testSmsSettings = async () => {
    try {
      const response = await fetch('/api/sms-settings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          test_number: settingsForm.test_number,
          test_message: 'Test SMS from RSVP System'
        })
      });

      if (!response.ok) {
        throw new Error('SMS test failed');
      }

      toast.success('Test SMS sent successfully');
    } catch (error) {
      console.error('Error testing SMS:', error);
      toast.error('Failed to send test SMS');
    }
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
      message_override: '',
      sender_id: '',
      priority: 'normal',
      delivery_receipt: true,
      campaign_description: '',
      cost_limit: '',
      tags: ''
    });
    setEditingCampaign(null);
  };

  const openEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({ ...campaign });
    setShowModal(true);
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

  const getRecipientCount = () => {
    const guestsWithPhone = guests.filter(g => g.guest_phone);
    
    switch (campaignForm.recipient_type) {
      case 'all':
        return guestsWithPhone.length;
      case 'event':
        return guestsWithPhone.filter(g => g.event_id?.toString() === campaignForm.event_id).length;
      case 'custom':
        return campaignForm.recipient_list.length;
      case 'rsvp_pending':
        return guestsWithPhone.filter(g => !g.guest_rsvp_status || g.guest_rsvp_status === 'Pending').length;
      case 'rsvp_confirmed':
        return guestsWithPhone.filter(g => g.guest_rsvp_status === 'Confirmed').length;
      case 'rsvp_declined':
        return guestsWithPhone.filter(g => g.guest_rsvp_status === 'Declined').length;
      case 'no_email':
        return guestsWithPhone.filter(g => !g.guest_email).length;
      default:
        return 0;
    }
  };

  const getTemplateContent = () => {
    const template = templates.find(t => t.template_id?.toString() === campaignForm.template_id);
    return template ? template.content : '';
  };

  const getMessageLength = (message) => {
    if (!message) return 0;
    // Check for Unicode characters
    const hasUnicode = /[^\x00-\x7F]/.test(message);
    return message.length;
  };

  const calculateEstimatedCost = () => {
    const recipientCount = getRecipientCount();
    const messageLength = getMessageLength(campaignForm.message_override || getTemplateContent());
    const costPerSms = smsSettings.cost_per_sms || 0.01;
    
    let smsCount = 1;
    if (messageLength > SMS_LIMITS.single) {
      smsCount = Math.ceil(messageLength / SMS_LIMITS.multipart);
    }
    
    return (recipientCount * smsCount * costPerSms).toFixed(2);
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
      ['Campaign Name', 'Status', 'Recipients', 'Sent Date', 'Delivery Rate', 'Cost'].join(','),
      ...smsCampaigns.map(campaign => [
        campaign.campaign_name,
        campaign.status,
        campaign.total_recipients || 0,
        campaign.sent_datetime ? formatDateTime(campaign.sent_datetime) : 'Not sent',
        campaign.delivery_rate ? `${campaign.delivery_rate}%` : '0%',
        campaign.total_cost ? `$${campaign.total_cost}` : '$0.00'
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sms_campaigns_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredCampaigns = smsCampaigns.filter(campaign => {
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
          <p className="text-muted">Loading SMS notification system...</p>
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
              <FaSms className="me-2 text-primary" />
              SMS Notification System
            </h2>
            <p className="text-muted mb-0">Create and manage SMS campaigns</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={() => setShowSettingsModal(true)}
            >
              <FaEdit className="me-2" />
              Settings
            </button>
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
              Create SMS Campaign
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaPaperPlane className="text-primary mb-2" size={24} />
                <h4 className="text-primary mb-1">{smsCampaigns.filter(c => c.status === 'Sent').length}</h4>
                <small className="text-muted">Sent Campaigns</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaPhone className="text-success mb-2" size={24} />
                <h4 className="text-success mb-1">{guests.filter(g => g.guest_phone).length}</h4>
                <small className="text-muted">Valid Phone Numbers</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaClock className="text-warning mb-2" size={24} />
                <h4 className="text-warning mb-1">{smsCampaigns.filter(c => c.status === 'Scheduled').length}</h4>
                <small className="text-muted">Scheduled</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaMoneyBillWave className="text-info mb-2" size={24} />
                <h4 className="text-info mb-1">
                  ${smsCampaigns.reduce((sum, c) => sum + (parseFloat(c.total_cost) || 0), 0).toFixed(2)}
                </h4>
                <small className="text-muted">Total Spend</small>
              </div>
            </div>
          </div>
        </div>

        {/* SMS Provider Status */}
        {!smsSettings.provider && (
          <div className="alert alert-warning glass-effect mb-4">
            <FaExclamationCircle className="me-2" />
            <strong>SMS Provider Not Configured:</strong> Please configure your SMS provider settings to start sending SMS campaigns.
            <button 
              className="btn btn-sm btn-warning ms-3"
              onClick={() => setShowSettingsModal(true)}
            >
              Configure Now
            </button>
          </div>
        )}

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
                    placeholder="Search SMS campaigns..."
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
                <FaSms className="text-muted mb-3" size={48} />
                <h5 className="text-muted">No SMS campaigns found</h5>
                <p className="text-muted mb-3">Create your first SMS campaign to get started.</p>
                <button 
                  className="btn btn-primary glass-btn-primary"
                  onClick={() => { resetForm(); setShowModal(true); }}
                >
                  Create SMS Campaign
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
                      <th>Cost</th>
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
                                <small>Delivered: {campaign.delivery_rate || 0}%</small>
                              </div>
                              <div className="text-info">
                                <small>Failed: {campaign.failed_count || 0}</small>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <div className="fw-semibold text-success">
                            ${campaign.total_cost || '0.00'}
                          </div>
                          <small className="text-muted">
                            {campaign.estimated_cost && `Est: $${campaign.estimated_cost}`}
                          </small>
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
                                  onClick={() => sendSmsCampaign(campaign.campaign_id)}
                                  title="Send"
                                  disabled={!smsSettings.provider}
                                >
                                  <FaPaperPlane />
                                </button>
                              </>
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
                    <FaSms className="me-2" />
                    {editingCampaign ? 'Edit SMS Campaign' : 'Create SMS Campaign'}
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

                      {/* Template and Event */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">SMS Template *</label>
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
                          <FaPhone className="me-2 text-primary" />
                          {getRecipientCount()} recipients
                        </div>
                      </div>

                      {/* Message Override */}
                      <div className="col-12">
                        <label className="form-label fw-semibold">Message Override (Optional)</label>
                        <div className="row">
                          <div className="col-md-8">
                            <textarea
                              className="form-control glass-input"
                              rows="4"
                              value={campaignForm.message_override}
                              onChange={(e) => setCampaignForm({...campaignForm, message_override: e.target.value})}
                              placeholder="Leave empty to use template message"
                              style={{ fontFamily: 'monospace' }}
                            />
                          </div>
                          <div className="col-md-4">
                            <div className="card glass-effect h-100">
                              <div className="card-body">
                                <h6 className="card-title">Message Info</h6>
                                <div className="mb-2">
                                  <small className="text-muted">Length: </small>
                                  <span className={`fw-semibold ${getMessageLength(campaignForm.message_override || getTemplateContent()) > SMS_LIMITS.single ? 'text-warning' : 'text-success'}`}>
                                    {getMessageLength(campaignForm.message_override || getTemplateContent())} chars
                                  </span>
                                </div>
                                <div className="mb-2">
                                  <small className="text-muted">SMS Count: </small>
                                  <span className="fw-semibold">
                                    {Math.ceil(getMessageLength(campaignForm.message_override || getTemplateContent()) / SMS_LIMITS.single)}
                                  </span>
                                </div>
                                <div className="mb-2">
                                  <small className="text-muted">Est. Cost: </small>
                                  <span className="fw-semibold text-success">
                                    ${calculateEstimatedCost()}
                                  </span>
                                </div>
                                {getMessageLength(campaignForm.message_override || getTemplateContent()) > SMS_LIMITS.single && (
                                  <div className="alert alert-warning p-2">
                                    <small>Message will be sent as multiple SMS</small>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
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

                      {/* Cost Limit */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Cost Limit (Optional)</label>
                        <div className="input-group">
                          <span className="input-group-text glass-input">$</span>
                          <input
                            type="number"
                            className="form-control glass-input"
                            step="0.01"
                            value={campaignForm.cost_limit}
                            onChange={(e) => setCampaignForm({...campaignForm, cost_limit: e.target.value})}
                            placeholder="No limit"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div className="col-12">
                        <label className="form-label fw-semibold">Campaign Description</label>
                        <textarea
                          className="form-control glass-input"
                          rows="2"
                          value={campaignForm.campaign_description}
                          onChange={(e) => setCampaignForm({...campaignForm, campaign_description: e.target.value})}
                        />
                      </div>

                      {/* Options */}
                      <div className="col-md-6">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={campaignForm.delivery_receipt}
                            onChange={(e) => setCampaignForm({...campaignForm, delivery_receipt: e.target.checked})}
                          />
                          <label className="form-check-label">
                            Request Delivery Receipts
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
                    <div className="me-auto">
                      <small className="text-muted">
                        <FaCalculator className="me-1" />
                        Estimated Cost: <strong>${calculateEstimatedCost()}</strong>
                      </small>
                    </div>
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

        {/* SMS Settings Modal */}
        {showSettingsModal && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-backdrop fade show"></div>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content glass-modal">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FaEdit className="me-2" />
                    SMS Provider Settings
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowSettingsModal(false)}
                  ></button>
                </div>
                <form onSubmit={saveSettings}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">SMS Provider</label>
                        <select
                          className="form-select glass-input"
                          value={settingsForm.provider}
                          onChange={(e) => setSettingsForm({...settingsForm, provider: e.target.value})}
                        >
                          {smsProviders.map(provider => (
                            <option key={provider.value} value={provider.value}>{provider.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Default Country Code</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={settingsForm.country_code}
                          onChange={(e) => setSettingsForm({...settingsForm, country_code: e.target.value})}
                        />
                      </div>

                      {settingsForm.provider === 'twilio' && (
                        <>
                          <div className="col-md-6">
                            <label className="form-label fw-semibold">Account SID</label>
                            <input
                              type="text"
                              className="form-control glass-input"
                              value={settingsForm.account_sid}
                              onChange={(e) => setSettingsForm({...settingsForm, account_sid: e.target.value})}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-semibold">Auth Token</label>
                            <input
                              type="password"
                              className="form-control glass-input"
                              value={settingsForm.auth_token}
                              onChange={(e) => setSettingsForm({...settingsForm, auth_token: e.target.value})}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-semibold">Phone Number</label>
                            <input
                              type="text"
                              className="form-control glass-input"
                              value={settingsForm.phone_number}
                              onChange={(e) => setSettingsForm({...settingsForm, phone_number: e.target.value})}
                            />
                          </div>
                        </>
                      )}

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Rate Limit (SMS/min)</label>
                        <input
                          type="number"
                          className="form-control glass-input"
                          value={settingsForm.rate_limit}
                          onChange={(e) => setSettingsForm({...settingsForm, rate_limit: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Cost per SMS</label>
                        <div className="input-group">
                          <span className="input-group-text glass-input">$</span>
                          <input
                            type="number"
                            className="form-control glass-input"
                            step="0.001"
                            value={settingsForm.cost_per_sms}
                            onChange={(e) => setSettingsForm({...settingsForm, cost_per_sms: parseFloat(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Monthly SMS Limit</label>
                        <input
                          type="number"
                          className="form-control glass-input"
                          value={settingsForm.monthly_limit}
                          onChange={(e) => setSettingsForm({...settingsForm, monthly_limit: parseInt(e.target.value)})}
                        />
                      </div>

                      <div className="col-12">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={settingsForm.enable_delivery_reports}
                                onChange={(e) => setSettingsForm({...settingsForm, enable_delivery_reports: e.target.checked})}
                              />
                              <label className="form-check-label">
                                Enable Delivery Reports
                              </label>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={settingsForm.enable_unicode}
                                onChange={(e) => setSettingsForm({...settingsForm, enable_unicode: e.target.checked})}
                              />
                              <label className="form-check-label">
                                Enable Unicode Support
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Test SMS Section */}
                      <div className="col-12">
                        <hr />
                        <h6>Test SMS Configuration</h6>
                        <div className="row">
                          <div className="col-md-8">
                            <label className="form-label fw-semibold">Test Phone Number</label>
                            <input
                              type="tel"
                              className="form-control glass-input"
                              value={settingsForm.test_number}
                              onChange={(e) => setSettingsForm({...settingsForm, test_number: e.target.value})}
                              placeholder="+1234567890"
                            />
                          </div>
                          <div className="col-md-4 d-flex align-items-end">
                            <button
                              type="button"
                              className="btn btn-outline-info glass-btn w-100"
                              onClick={testSmsSettings}
                              disabled={!settingsForm.test_number}
                            >
                              <FaPaperPlane className="me-2" />
                              Send Test SMS
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary glass-btn"
                      onClick={() => setShowSettingsModal(false)}
                    >
                      <FaTimes className="me-2" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary glass-btn-primary"
                    >
                      <FaSave className="me-2" />
                      Save Settings
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SMSNotificationSystem;