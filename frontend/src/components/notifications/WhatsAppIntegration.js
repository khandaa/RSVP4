import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FaWhatsapp,
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
  FaCalculator,
  FaImage,
  FaFileAlt,
  FaLink,
  FaDownload,
  FaUpload,
  FaQrcode,
  FaKey
} from 'react-icons/fa';

const WhatsAppIntegration = () => {
  const [whatsappCampaigns, setWhatsappCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [whatsappSettings, setWhatsappSettings] = useState({});
  const [businessProfile, setBusinessProfile] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
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
    media_url: '',
    media_type: 'none',
    priority: 'normal',
    campaign_description: '',
    cost_limit: '',
    tags: ''
  });

  const [settingsForm, setSettingsForm] = useState({
    business_account_id: '',
    access_token: '',
    phone_number_id: '',
    webhook_verify_token: '',
    webhook_url: '',
    business_name: '',
    business_description: '',
    business_website: '',
    rate_limit: 50,
    cost_per_message: 0.005,
    monthly_limit: 1000,
    enable_delivery_reports: true,
    auto_approve_templates: false
  });

  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'MARKETING',
    language: 'en_US',
    header_type: 'TEXT',
    header_text: '',
    body_text: '',
    footer_text: '',
    buttons: [],
    variables: []
  });

  const recipientTypes = [
    { value: 'all', label: 'All Guests (with WhatsApp)' },
    { value: 'event', label: 'Event Guests' },
    { value: 'group', label: 'Guest Groups' },
    { value: 'custom', label: 'Custom Selection' },
    { value: 'rsvp_pending', label: 'RSVP Pending' },
    { value: 'rsvp_confirmed', label: 'RSVP Confirmed' },
    { value: 'rsvp_declined', label: 'RSVP Declined' },
    { value: 'vip_guests', label: 'VIP Guests Only' }
  ];

  const scheduleTypes = [
    { value: 'immediate', label: 'Send Immediately' },
    { value: 'scheduled', label: 'Schedule for Later' },
    { value: 'recurring', label: 'Recurring Messages' }
  ];

  const mediaTypes = [
    { value: 'none', label: 'Text Only' },
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
    { value: 'audio', label: 'Audio' },
    { value: 'document', label: 'Document' }
  ];

  const templateCategories = [
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'UTILITY', label: 'Utility' },
    { value: 'AUTHENTICATION', label: 'Authentication' }
  ];

  const headerTypes = [
    { value: 'TEXT', label: 'Text' },
    { value: 'MEDIA', label: 'Media' },
    { value: 'LOCATION', label: 'Location' }
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

  // WhatsApp limits
  const WHATSAPP_LIMITS = {
    text: 4096,
    template_name: 512,
    daily_limit: 1000
  };

  useEffect(() => {
    fetchData();
    fetchWhatsAppSettings();
    fetchBusinessProfile();
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
        fetch('/api/whatsapp-campaigns', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/notification-templates?type=whatsapp', {
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

      setWhatsappCampaigns(campaignsData);
      setTemplates(templatesData);
      setGuests(guestsData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load WhatsApp data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWhatsAppSettings = async () => {
    try {
      const response = await fetch('/api/whatsapp-settings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setWhatsappSettings(data);
        setSettingsForm(data);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp settings:', error);
    }
  };

  const fetchBusinessProfile = async () => {
    try {
      const response = await fetch('/api/whatsapp-business-profile', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBusinessProfile(data);
      }
    } catch (error) {
      console.error('Error fetching business profile:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check guest limit for WhatsApp Business API
    const recipientCount = getRecipientCount();
    if (recipientCount > 1000) {
      toast.error('WhatsApp Business API is limited to 1000 recipients per campaign.');
      return;
    }

    try {
      const url = editingCampaign 
        ? `/api/whatsapp-campaigns/${editingCampaign.campaign_id}`
        : '/api/whatsapp-campaigns';
      
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
        throw new Error('Failed to save WhatsApp campaign');
      }

      toast.success(`WhatsApp campaign ${editingCampaign ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving WhatsApp campaign:', error);
      toast.error('Failed to save WhatsApp campaign');
    }
  };

  const sendWhatsAppCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to send this WhatsApp campaign? This action cannot be undone and will incur charges.')) return;

    try {
      const response = await fetch(`/api/whatsapp-campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to send WhatsApp campaign');
      }

      toast.success('WhatsApp campaign sent successfully');
      fetchData();
    } catch (error) {
      console.error('Error sending WhatsApp campaign:', error);
      toast.error('Failed to send WhatsApp campaign');
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/whatsapp-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settingsForm)
      });

      if (!response.ok) {
        throw new Error('Failed to save WhatsApp settings');
      }

      toast.success('WhatsApp settings saved successfully');
      setShowSettingsModal(false);
      fetchWhatsAppSettings();
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error);
      toast.error('Failed to save WhatsApp settings');
    }
  };

  const submitTemplate = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/whatsapp-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(templateForm)
      });

      if (!response.ok) {
        throw new Error('Failed to submit template');
      }

      toast.success('WhatsApp template submitted for approval');
      setShowTemplateModal(false);
      resetTemplateForm();
    } catch (error) {
      console.error('Error submitting template:', error);
      toast.error('Failed to submit template');
    }
  };

  const testWhatsAppConnection = async () => {
    try {
      const response = await fetch('/api/whatsapp-settings/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('WhatsApp connection test failed');
      }

      const result = await response.json();
      toast.success(`Connection test successful! Business verified: ${result.verified}`);
    } catch (error) {
      console.error('Error testing WhatsApp connection:', error);
      toast.error('Failed to test WhatsApp connection');
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
      media_url: '',
      media_type: 'none',
      priority: 'normal',
      campaign_description: '',
      cost_limit: '',
      tags: ''
    });
    setEditingCampaign(null);
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      category: 'MARKETING',
      language: 'en_US',
      header_type: 'TEXT',
      header_text: '',
      body_text: '',
      footer_text: '',
      buttons: [],
      variables: []
    });
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
    // Only count guests with phone numbers (WhatsApp requires phone)
    const guestsWithPhone = guests.filter(g => g.guest_phone);
    
    switch (campaignForm.recipient_type) {
      case 'all':
        return Math.min(guestsWithPhone.length, 1000); // WhatsApp limit
      case 'event':
        return Math.min(guestsWithPhone.filter(g => g.event_id?.toString() === campaignForm.event_id).length, 1000);
      case 'custom':
        return Math.min(campaignForm.recipient_list.length, 1000);
      case 'rsvp_pending':
        return Math.min(guestsWithPhone.filter(g => !g.guest_rsvp_status || g.guest_rsvp_status === 'Pending').length, 1000);
      case 'rsvp_confirmed':
        return Math.min(guestsWithPhone.filter(g => g.guest_rsvp_status === 'Confirmed').length, 1000);
      case 'rsvp_declined':
        return Math.min(guestsWithPhone.filter(g => g.guest_rsvp_status === 'Declined').length, 1000);
      case 'vip_guests':
        return Math.min(guestsWithPhone.filter(g => g.guest_type === 'VIP').length, 1000);
      default:
        return 0;
    }
  };

  const calculateEstimatedCost = () => {
    const recipientCount = getRecipientCount();
    const costPerMessage = whatsappSettings.cost_per_message || 0.005;
    return (recipientCount * costPerMessage).toFixed(3);
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
      ...whatsappCampaigns.map(campaign => [
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
    a.download = `whatsapp_campaigns_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredCampaigns = whatsappCampaigns.filter(campaign => {
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
          <p className="text-muted">Loading WhatsApp integration...</p>
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
              <FaWhatsapp className="me-2 text-success" />
              WhatsApp Integration
            </h2>
            <p className="text-muted mb-0">WhatsApp Business API campaigns (Limited to 1000 guests)</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={() => setShowTemplateModal(true)}
            >
              <FaPlus className="me-2" />
              Template
            </button>
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
              className="btn btn-success glass-btn-primary"
              onClick={() => { resetForm(); setShowModal(true); }}
            >
              <FaPlus className="me-2" />
              Create Campaign
            </button>
          </div>
        </div>

        {/* Business Profile Card */}
        {businessProfile.verified && (
          <div className="card glass-card mb-4">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <div className="d-flex align-items-center">
                    <FaCheckCircle className="text-success me-3" size={24} />
                    <div>
                      <h5 className="mb-1">{businessProfile.display_name || 'WhatsApp Business'}</h5>
                      <p className="text-muted mb-0">
                        Verified Business Account • Phone: {businessProfile.phone_number}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 text-end">
                  <div className="small text-muted">
                    <div>Status: <span className="text-success">Connected</span></div>
                    <div>Quality Rating: <span className="text-success">{businessProfile.quality_rating || 'GREEN'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp API Status */}
        {!whatsappSettings.business_account_id && (
          <div className="alert alert-warning glass-effect mb-4">
            <FaExclamationCircle className="me-2" />
            <strong>WhatsApp Business API Not Configured:</strong> Please configure your WhatsApp Business API settings to start sending campaigns.
            <button 
              className="btn btn-sm btn-warning ms-3"
              onClick={() => setShowSettingsModal(true)}
            >
              Configure Now
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaPaperPlane className="text-success mb-2" size={24} />
                <h4 className="text-success mb-1">{whatsappCampaigns.filter(c => c.status === 'Sent').length}</h4>
                <small className="text-muted">Sent Campaigns</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaPhone className="text-primary mb-2" size={24} />
                <h4 className="text-primary mb-1">{Math.min(guests.filter(g => g.guest_phone).length, 1000)}</h4>
                <small className="text-muted">Available Recipients</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaClock className="text-warning mb-2" size={24} />
                <h4 className="text-warning mb-1">{whatsappCampaigns.filter(c => c.status === 'Scheduled').length}</h4>
                <small className="text-muted">Scheduled</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaMoneyBillWave className="text-info mb-2" size={24} />
                <h4 className="text-info mb-1">
                  ${whatsappCampaigns.reduce((sum, c) => sum + (parseFloat(c.total_cost) || 0), 0).toFixed(3)}
                </h4>
                <small className="text-muted">Total Spend</small>
              </div>
            </div>
          </div>
        </div>

        {/* 1000 Guest Limit Warning */}
        <div className="alert alert-info glass-effect mb-4">
          <FaUsers className="me-2" />
          <strong>WhatsApp Business API Limit:</strong> This system is designed for events with up to 1000 guests. 
          For larger events, campaigns will be automatically limited to the first 1000 eligible recipients.
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
                    placeholder="Search WhatsApp campaigns..."
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
                <FaWhatsapp className="text-muted mb-3" size={48} />
                <h5 className="text-muted">No WhatsApp campaigns found</h5>
                <p className="text-muted mb-3">Create your first WhatsApp campaign to get started.</p>
                <button 
                  className="btn btn-success glass-btn-primary"
                  onClick={() => { resetForm(); setShowModal(true); }}
                >
                  Create WhatsApp Campaign
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
                            {campaign.media_type !== 'none' && (
                              <span className="badge bg-secondary glass-badge ms-1">
                                {campaign.media_type}
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
                              <FaSpinner className="fa-spin text-success" size={12} />
                              <small className="text-muted ms-1">Sending...</small>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="fw-semibold">{campaign.total_recipients || 0}</div>
                          <small className="text-muted">{campaign.recipient_type}</small>
                          {(campaign.total_recipients || 0) >= 1000 && (
                            <div>
                              <small className="text-warning">Max limit reached</small>
                            </div>
                          )}
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
                              <div className="text-primary">
                                <small>Read: {campaign.read_rate || 0}%</small>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <div className="fw-semibold text-success">
                            ${campaign.total_cost || '0.000'}
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
                                  onClick={() => sendWhatsAppCampaign(campaign.campaign_id)}
                                  title="Send"
                                  disabled={!whatsappSettings.business_account_id}
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
                    <FaWhatsapp className="me-2 text-success" />
                    {editingCampaign ? 'Edit WhatsApp Campaign' : 'Create WhatsApp Campaign'}
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
                        <label className="form-label fw-semibold">WhatsApp Template *</label>
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
                          <FaWhatsapp className="me-2 text-success" />
                          {getRecipientCount()} recipients
                          {getRecipientCount() >= 1000 && (
                            <span className="text-warning ms-2">(Max limit)</span>
                          )}
                        </div>
                      </div>

                      {/* Media */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Media Type</label>
                        <select
                          className="form-select glass-input"
                          value={campaignForm.media_type}
                          onChange={(e) => setCampaignForm({...campaignForm, media_type: e.target.value})}
                        >
                          {mediaTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      {campaignForm.media_type !== 'none' && (
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Media URL</label>
                          <input
                            type="url"
                            className="form-control glass-input"
                            value={campaignForm.media_url}
                            onChange={(e) => setCampaignForm({...campaignForm, media_url: e.target.value})}
                            placeholder="https://example.com/media.jpg"
                          />
                        </div>
                      )}

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
                              maxLength={WHATSAPP_LIMITS.text}
                            />
                          </div>
                          <div className="col-md-4">
                            <div className="card glass-effect h-100">
                              <div className="card-body">
                                <h6 className="card-title">Message Info</h6>
                                <div className="mb-2">
                                  <small className="text-muted">Length: </small>
                                  <span className="fw-semibold">
                                    {(campaignForm.message_override || '').length}/{WHATSAPP_LIMITS.text}
                                  </span>
                                </div>
                                <div className="mb-2">
                                  <small className="text-muted">Recipients: </small>
                                  <span className="fw-semibold">{getRecipientCount()}</span>
                                </div>
                                <div className="mb-2">
                                  <small className="text-muted">Est. Cost: </small>
                                  <span className="fw-semibold text-success">
                                    ${calculateEstimatedCost()}
                                  </span>
                                </div>
                                {getRecipientCount() >= 1000 && (
                                  <div className="alert alert-warning p-2">
                                    <small>Limited to 1000 recipients</small>
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
                      className="btn btn-success glass-btn-primary"
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

        {/* WhatsApp Settings Modal */}
        {showSettingsModal && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-backdrop fade show"></div>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content glass-modal">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FaEdit className="me-2" />
                    WhatsApp Business API Settings
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowSettingsModal(false)}
                  ></button>
                </div>
                <form onSubmit={saveSettings}>
                  <div className="modal-body">
                    <div className="alert alert-info">
                      <FaWhatsapp className="me-2" />
                      <strong>WhatsApp Business API Configuration</strong><br />
                      You need a verified WhatsApp Business API account to use this feature.
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Business Account ID *</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={settingsForm.business_account_id}
                          onChange={(e) => setSettingsForm({...settingsForm, business_account_id: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Phone Number ID *</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={settingsForm.phone_number_id}
                          onChange={(e) => setSettingsForm({...settingsForm, phone_number_id: e.target.value})}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold">Access Token *</label>
                        <input
                          type="password"
                          className="form-control glass-input"
                          value={settingsForm.access_token}
                          onChange={(e) => setSettingsForm({...settingsForm, access_token: e.target.value})}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Webhook Verify Token</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={settingsForm.webhook_verify_token}
                          onChange={(e) => setSettingsForm({...settingsForm, webhook_verify_token: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Webhook URL</label>
                        <input
                          type="url"
                          className="form-control glass-input"
                          value={settingsForm.webhook_url}
                          onChange={(e) => setSettingsForm({...settingsForm, webhook_url: e.target.value})}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Rate Limit (msg/min)</label>
                        <input
                          type="number"
                          className="form-control glass-input"
                          value={settingsForm.rate_limit}
                          onChange={(e) => setSettingsForm({...settingsForm, rate_limit: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Cost per Message</label>
                        <div className="input-group">
                          <span className="input-group-text glass-input">$</span>
                          <input
                            type="number"
                            className="form-control glass-input"
                            step="0.001"
                            value={settingsForm.cost_per_message}
                            onChange={(e) => setSettingsForm({...settingsForm, cost_per_message: parseFloat(e.target.value)})}
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Monthly Message Limit</label>
                        <input
                          type="number"
                          className="form-control glass-input"
                          value={settingsForm.monthly_limit}
                          onChange={(e) => setSettingsForm({...settingsForm, monthly_limit: parseInt(e.target.value)})}
                        />
                      </div>

                      <div className="col-12">
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

                      {/* Test Connection */}
                      <div className="col-12">
                        <hr />
                        <div className="d-flex justify-content-between align-items-center">
                          <h6>Test Connection</h6>
                          <button
                            type="button"
                            className="btn btn-outline-success glass-btn"
                            onClick={testWhatsAppConnection}
                          >
                            <FaCheckCircle className="me-2" />
                            Test Connection
                          </button>
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
                      className="btn btn-success glass-btn-primary"
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

        {/* Template Creation Modal */}
        {showTemplateModal && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-backdrop fade show"></div>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content glass-modal">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FaPlus className="me-2" />
                    Create WhatsApp Template
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowTemplateModal(false)}
                  ></button>
                </div>
                <form onSubmit={submitTemplate}>
                  <div className="modal-body">
                    <div className="alert alert-info">
                      <FaWhatsapp className="me-2" />
                      Templates must be approved by WhatsApp before use. This process can take 24-48 hours.
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Template Name *</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={templateForm.name}
                          onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                          required
                          maxLength={WHATSAPP_LIMITS.template_name}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">Category *</label>
                        <select
                          className="form-select glass-input"
                          value={templateForm.category}
                          onChange={(e) => setTemplateForm({...templateForm, category: e.target.value})}
                          required
                        >
                          {templateCategories.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">Language</label>
                        <select
                          className="form-select glass-input"
                          value={templateForm.language}
                          onChange={(e) => setTemplateForm({...templateForm, language: e.target.value})}
                        >
                          <option value="en_US">English (US)</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Header Type</label>
                        <select
                          className="form-select glass-input"
                          value={templateForm.header_type}
                          onChange={(e) => setTemplateForm({...templateForm, header_type: e.target.value})}
                        >
                          {headerTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      {templateForm.header_type === 'TEXT' && (
                        <div className="col-md-8">
                          <label className="form-label fw-semibold">Header Text</label>
                          <input
                            type="text"
                            className="form-control glass-input"
                            value={templateForm.header_text}
                            onChange={(e) => setTemplateForm({...templateForm, header_text: e.target.value})}
                          />
                        </div>
                      )}

                      <div className="col-12">
                        <label className="form-label fw-semibold">Body Text *</label>
                        <textarea
                          className="form-control glass-input"
                          rows="4"
                          value={templateForm.body_text}
                          onChange={(e) => setTemplateForm({...templateForm, body_text: e.target.value})}
                          required
                          maxLength={WHATSAPP_LIMITS.text}
                        />
                        <small className="text-muted">
                          Use {{1}}, {{2}}, etc. for variables. Current length: {templateForm.body_text.length}/{WHATSAPP_LIMITS.text}
                        </small>
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold">Footer Text (Optional)</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={templateForm.footer_text}
                          onChange={(e) => setTemplateForm({...templateForm, footer_text: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary glass-btn"
                      onClick={() => setShowTemplateModal(false)}
                    >
                      <FaTimes className="me-2" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success glass-btn-primary"
                    >
                      <FaSave className="me-2" />
                      Submit for Approval
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

export default WhatsAppIntegration;