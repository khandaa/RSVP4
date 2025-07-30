import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FaHistory,
  FaEnvelope,
  FaSms,
  FaWhatsapp,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaUser,
  FaEye,
  FaDownload,
  FaRefresh,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSpinner,
  FaExclamationTriangle,
  FaInfoCircle,
  FaChevronDown,
  FaChevronRight,
  FaTimes,
  FaFileExport,
  FaChartBar
} from 'react-icons/fa';

const NotificationHistory = () => {
  const [notifications, setNotifications] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [events, setEvents] = useState([]);
  const [guests, setGuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showDetails, setShowDetails] = useState({});
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  const statuses = [
    { value: 'sent', label: 'Sent', icon: FaCheckCircle, color: 'success' },
    { value: 'delivered', label: 'Delivered', icon: FaCheckCircle, color: 'success' },
    { value: 'opened', label: 'Opened', icon: FaEye, color: 'info' },
    { value: 'clicked', label: 'Clicked', icon: FaEye, color: 'primary' },
    { value: 'failed', label: 'Failed', icon: FaTimesCircle, color: 'danger' },
    { value: 'pending', label: 'Pending', icon: FaClock, color: 'warning' },
    { value: 'processing', label: 'Processing', icon: FaSpinner, color: 'primary' },
    { value: 'bounced', label: 'Bounced', icon: FaExclamationTriangle, color: 'warning' },
    { value: 'unsubscribed', label: 'Unsubscribed', icon: FaTimes, color: 'secondary' }
  ];

  const channels = [
    { value: 'email', label: 'Email', icon: FaEnvelope, color: 'primary' },
    { value: 'sms', label: 'SMS', icon: FaSms, color: 'success' },
    { value: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, color: 'info' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [searchTerm, filterStatus, filterChannel, filterEvent, filterCampaign, dateRange]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [notificationsRes, campaignsRes, eventsRes, guestsRes] = await Promise.all([
        fetch('/api/notification-history', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/notification-campaigns', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/events', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/guests', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const notificationsData = notificationsRes.ok ? await notificationsRes.json() : [];
      const campaignsData = campaignsRes.ok ? await campaignsRes.json() : [];
      const eventsData = eventsRes.ok ? await eventsRes.json() : [];
      const guestsData = guestsRes.ok ? await guestsRes.json() : [];

      setNotifications(notificationsData);
      setCampaigns(campaignsData);
      setEvents(eventsData);
      setGuests(guestsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load notification history');
      // Set default empty arrays
      setNotifications([]);
      setCampaigns([]);
      setEvents([]);
      setGuests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotifications = () => {
    // This would typically filter the notifications based on current filters
    // For now, we'll use the existing notifications array
  };

  const getStatusInfo = (status) => {
    const statusInfo = statuses.find(s => s.value === status);
    return statusInfo || { value: status, label: status, icon: FaInfoCircle, color: 'secondary' };
  };

  const getChannelInfo = (channel) => {
    const channelInfo = channels.find(c => c.value === channel);
    return channelInfo || { value: channel, label: channel, icon: FaInfoCircle, color: 'secondary' };
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

  const toggleDetails = (notificationId) => {
    setShowDetails(prev => ({
      ...prev,
      [notificationId]: !prev[notificationId]
    }));
  };

  const viewDetails = (notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
  };

  const exportHistory = () => {
    const csvData = [
      ['Date', 'Campaign', 'Channel', 'Recipient', 'Subject', 'Status', 'Event']
    ];

    notifications.forEach(notification => {
      csvData.push([
        formatDateTime(notification.sent_datetime),
        notification.campaign_name || 'N/A',
        notification.channel,
        notification.recipient_email || notification.recipient_phone,
        notification.subject || 'N/A',
        notification.status,
        notification.event_name || 'N/A'
      ]);
    });

    const csvContent = csvData.map(row => 
      row.map(field => `"${(field || '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getDeliveryTimeline = (notification) => {
    const timeline = [];
    
    if (notification.sent_datetime) {
      timeline.push({
        status: 'sent',
        datetime: notification.sent_datetime,
        message: 'Notification sent'
      });
    }

    if (notification.delivered_datetime) {
      timeline.push({
        status: 'delivered',
        datetime: notification.delivered_datetime,
        message: 'Successfully delivered'
      });
    }

    if (notification.opened_datetime) {
      timeline.push({
        status: 'opened',
        datetime: notification.opened_datetime,
        message: 'Opened by recipient'
      });
    }

    if (notification.clicked_datetime) {
      timeline.push({
        status: 'clicked',
        datetime: notification.clicked_datetime,
        message: 'Link clicked'
      });
    }

    if (notification.failed_datetime) {
      timeline.push({
        status: 'failed',
        datetime: notification.failed_datetime,
        message: `Failed: ${notification.failure_reason || 'Unknown error'}`
      });
    }

    return timeline.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterChannel('');
    setFilterEvent('');
    setFilterCampaign('');
    setDateRange({ startDate: '', endDate: '' });
  };

  // Pagination logic
  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = notifications.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading notification history...</p>
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
              <FaHistory className="me-2 text-primary" />
              Notification History
            </h2>
            <p className="text-muted mb-0">Track all sent notifications and their delivery status</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={() => fetchData()}
            >
              <FaRefresh className="me-2" />
              Refresh
            </button>
            <button 
              className="btn btn-outline-primary glass-btn"
              onClick={exportHistory}
            >
              <FaFileExport className="me-2" />
              Export
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaHistory className="text-primary mb-2" size={24} />
                <h4 className="text-primary mb-1">{notifications.length.toLocaleString()}</h4>
                <small className="text-muted">Total Notifications</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaCheckCircle className="text-success mb-2" size={24} />
                <h4 className="text-success mb-1">
                  {notifications.filter(n => n.status === 'delivered').length.toLocaleString()}
                </h4>
                <small className="text-muted">Delivered</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaEye className="text-info mb-2" size={24} />
                <h4 className="text-info mb-1">
                  {notifications.filter(n => n.status === 'opened').length.toLocaleString()}
                </h4>
                <small className="text-muted">Opened</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaTimesCircle className="text-danger mb-2" size={24} />
                <h4 className="text-danger mb-1">
                  {notifications.filter(n => n.status === 'failed').length.toLocaleString()}
                </h4>
                <small className="text-muted">Failed</small>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <div className="input-group">
                  <span className="input-group-text glass-input">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-2">
                <select
                  className="form-select glass-input"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <select
                  className="form-select glass-input"
                  value={filterChannel}
                  onChange={(e) => setFilterChannel(e.target.value)}
                >
                  <option value="">All Channels</option>
                  {channels.map(channel => (
                    <option key={channel.value} value={channel.value}>{channel.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
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
                <select
                  className="form-select glass-input"
                  value={filterCampaign}
                  onChange={(e) => setFilterCampaign(e.target.value)}
                >
                  <option value="">All Campaigns</option>
                  {campaigns.map(campaign => (
                    <option key={campaign.campaign_id} value={campaign.campaign_id}>
                      {campaign.campaign_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-1">
                <button 
                  className="btn btn-outline-secondary glass-btn w-100"
                  onClick={clearFilters}
                  title="Clear Filters"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            <div className="row g-3 mt-2">
              <div className="col-md-3">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control glass-input"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control glass-input"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="card glass-card">
          <div className="card-body">
            {currentNotifications.length === 0 ? (
              <div className="text-center py-5">
                <FaHistory className="text-muted mb-3" size={48} />
                <h5 className="text-muted">No notifications found</h5>
                <p className="text-muted mb-0">No notifications match your current filters.</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Campaign / Recipient</th>
                        <th>Channel</th>
                        <th>Status</th>
                        <th>Sent Date</th>
                        <th>Last Update</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentNotifications.map((notification) => {
                        const statusInfo = getStatusInfo(notification.status);
                        const channelInfo = getChannelInfo(notification.channel);
                        const StatusIcon = statusInfo.icon;
                        const ChannelIcon = channelInfo.icon;
                        const isExpanded = showDetails[notification.notification_id];

                        return (
                          <React.Fragment key={notification.notification_id}>
                            <tr>
                              <td>
                                <button
                                  className="btn btn-sm btn-link text-muted p-0"
                                  onClick={() => toggleDetails(notification.notification_id)}
                                >
                                  {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                                </button>
                              </td>
                              <td>
                                <div className="fw-semibold">{notification.campaign_name || 'Direct Notification'}</div>
                                <small className="text-muted">
                                  <FaUser className="me-1" />
                                  {notification.recipient_email || notification.recipient_phone}
                                </small>
                                {notification.subject && (
                                  <div className="text-muted small mt-1">
                                    {notification.subject.length > 50 
                                      ? `${notification.subject.substring(0, 50)}...`
                                      : notification.subject
                                    }
                                  </div>
                                )}
                              </td>
                              <td>
                                <span className={`badge bg-${channelInfo.color} glass-badge`}>
                                  <ChannelIcon className="me-1" />
                                  {channelInfo.label}
                                </span>
                              </td>
                              <td>
                                <span className={`badge bg-${statusInfo.color} glass-badge`}>
                                  <StatusIcon className="me-1" />
                                  {statusInfo.label}
                                </span>
                              </td>
                              <td>
                                <div className="fw-semibold">{formatDateTime(notification.sent_datetime)}</div>
                              </td>
                              <td>
                                <div className="fw-semibold">
                                  {formatDateTime(
                                    notification.clicked_datetime ||
                                    notification.opened_datetime ||
                                    notification.delivered_datetime ||
                                    notification.failed_datetime ||
                                    notification.sent_datetime
                                  )}
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-info glass-btn"
                                  onClick={() => viewDetails(notification)}
                                  title="View Details"
                                >
                                  <FaEye />
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan="7">
                                  <div className="card glass-effect ms-4">
                                    <div className="card-body">
                                      <h6 className="card-title">Delivery Timeline</h6>
                                      <div className="timeline">
                                        {getDeliveryTimeline(notification).map((event, index) => {
                                          const eventStatusInfo = getStatusInfo(event.status);
                                          const EventIcon = eventStatusInfo.icon;
                                          return (
                                            <div key={index} className="timeline-item d-flex align-items-center mb-2">
                                              <div className={`text-${eventStatusInfo.color} me-3`}>
                                                <EventIcon />
                                              </div>
                                              <div className="flex-grow-1">
                                                <div className="fw-semibold">{event.message}</div>
                                                <small className="text-muted">{formatDateTime(event.datetime)}</small>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="text-muted">
                      Showing {startIndex + 1} to {Math.min(endIndex, notifications.length)} of {notifications.length} notifications
                    </div>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link glass-btn"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </button>
                        </li>
                        {[...Array(Math.min(5, totalPages))].map((_, index) => {
                          const pageNumber = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + index;
                          if (pageNumber <= totalPages) {
                            return (
                              <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                                <button 
                                  className="page-link glass-btn"
                                  onClick={() => setCurrentPage(pageNumber)}
                                >
                                  {pageNumber}
                                </button>
                              </li>
                            );
                          }
                          return null;
                        })}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button 
                            className="page-link glass-btn"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedNotification && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-backdrop fade show"></div>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content glass-modal">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FaInfoCircle className="me-2" />
                    Notification Details
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowDetailModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Campaign</label>
                      <div className="form-control glass-input bg-light">
                        {selectedNotification.campaign_name || 'Direct Notification'}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Channel</label>
                      <div className="form-control glass-input bg-light">
                        {getChannelInfo(selectedNotification.channel).label}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Recipient</label>
                      <div className="form-control glass-input bg-light">
                        {selectedNotification.recipient_email || selectedNotification.recipient_phone}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Status</label>
                      <div className="form-control glass-input bg-light">
                        {getStatusInfo(selectedNotification.status).label}
                      </div>
                    </div>
                    {selectedNotification.subject && (
                      <div className="col-12">
                        <label className="form-label fw-semibold">Subject</label>
                        <div className="form-control glass-input bg-light">
                          {selectedNotification.subject}
                        </div>
                      </div>
                    )}
                    {selectedNotification.content && (
                      <div className="col-12">
                        <label className="form-label fw-semibold">Content</label>
                        <div className="form-control glass-input bg-light" style={{ height: '120px', overflow: 'auto' }}>
                          {selectedNotification.content}
                        </div>
                      </div>
                    )}
                    <div className="col-12">
                      <label className="form-label fw-semibold">Delivery Timeline</label>
                      <div className="border rounded p-3">
                        {getDeliveryTimeline(selectedNotification).map((event, index) => {
                          const eventStatusInfo = getStatusInfo(event.status);
                          const EventIcon = eventStatusInfo.icon;
                          return (
                            <div key={index} className="d-flex align-items-center mb-2">
                              <div className={`text-${eventStatusInfo.color} me-3`}>
                                <EventIcon />
                              </div>
                              <div className="flex-grow-1">
                                <div className="fw-semibold">{event.message}</div>
                                <small className="text-muted">{formatDateTime(event.datetime)}</small>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary glass-btn"
                    onClick={() => setShowDetailModal(false)}
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

export default NotificationHistory;