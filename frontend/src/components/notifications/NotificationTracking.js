import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { 
  FaEnvelope, 
  FaSms, 
  FaWhatsapp,
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaDownload,
  FaCheck, 
  FaTimes, 
  FaClock,
  FaCalendarAlt,
  FaChartBar,
  FaSpinner,
  FaUserFriends,
  FaInfoCircle,
  FaRefresh
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

const NotificationTracking = () => {
  // State management
  const [trackingData, setTrackingData] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Fetch notification tracking data
  useEffect(() => {
    fetchTrackingData();
    fetchEvents();
    fetchCampaigns();
  }, [selectedCampaign, selectedEvent, selectedChannel, dateRange]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/events', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get('/api/notification-campaigns', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCampaigns(response.data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load notification campaigns');
    }
  };

  const fetchTrackingData = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedCampaign) params.append('campaign_id', selectedCampaign);
      if (selectedEvent) params.append('event_id', selectedEvent);
      if (selectedChannel) params.append('channel', selectedChannel);
      params.append('start_date', dateRange.startDate);
      params.append('end_date', dateRange.endDate);
      
      const response = await axios.get(`/api/notification-tracking?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setTrackingData(response.data);
    } catch (error) {
      console.error('Error fetching notification tracking data:', error);
      toast.error('Failed to load notification tracking data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter data based on search term
  const filteredData = trackingData.filter(item => 
    item.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.message_content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Handle notification detail view
  const handleViewDetail = (notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
  };

  // Export tracking data to CSV
  const handleExport = () => {
    try {
      const headers = [
        'Notification ID', 
        'Guest', 
        'Channel', 
        'Recipient', 
        'Subject/Title', 
        'Sent Time', 
        'Delivery Status',
        'Open Status', 
        'Open Time', 
        'Click Status', 
        'Click Time'
      ];

      // Generate CSV content
      const csvContent = [
        headers.join(','),
        ...filteredData.map(item => [
          item.notification_id,
          item.guest_name || 'N/A',
          item.channel || 'N/A',
          item.recipient || 'N/A',
          item.subject ? `"${item.subject.replace(/"/g, '""')}"` : 'N/A',
          item.sent_time || 'N/A',
          item.delivery_status || 'N/A',
          item.is_opened ? 'Opened' : 'Not Opened',
          item.opened_time || 'N/A',
          item.is_clicked ? 'Clicked' : 'Not Clicked',
          item.clicked_time || 'N/A'
        ].join(','))
      ].join('\n');

      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `notification_tracking_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export tracking data');
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel?.toLowerCase()) {
      case 'email': return <FaEnvelope className="text-primary" />;
      case 'sms': return <FaSms className="text-success" />;
      case 'whatsapp': return <FaWhatsapp className="text-success" />;
      default: return <FaEnvelope className="text-secondary" />;
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return <FaClock className="text-warning" />;
    
    switch (status.toLowerCase()) {
      case 'delivered': return <FaCheck className="text-success" />;
      case 'failed': return <FaTimes className="text-danger" />;
      case 'pending': return <FaClock className="text-warning" />;
      default: return <FaInfoCircle className="text-secondary" />;
    }
  };

  return (
    <div className="glass-bg min-vh-100 p-4">
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-0">Notification Tracking</h2>
            <p className="text-muted mb-0">
              Monitor delivery and engagement of your notifications
            </p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={fetchTrackingData}
              title="Refresh data"
            >
              <FaRefresh />
            </button>
            <button 
              className="btn btn-primary glass-btn"
              onClick={handleExport}
              disabled={filteredData.length === 0}
            >
              <FaDownload className="me-2" />
              Export Data
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Search</label>
                <div className="input-group">
                  <span className="input-group-text glass-input-addon">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder="Search by guest, recipient or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-2">
                <label className="form-label">Event</label>
                <select
                  className="form-select glass-input"
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                >
                  <option value="">All Events</option>
                  {events.map((event) => (
                    <option key={event.event_id} value={event.event_id}>
                      {event.event_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <label className="form-label">Campaign</label>
                <select
                  className="form-select glass-input"
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                >
                  <option value="">All Campaigns</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.campaign_id} value={campaign.campaign_id}>
                      {campaign.campaign_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <label className="form-label">Channel</label>
                <select
                  className="form-select glass-input"
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                >
                  <option value="">All Channels</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div className="col-md-2">
                <label className="form-label">Date Range</label>
                <div className="d-flex gap-1">
                  <input
                    type="date"
                    className="form-control glass-input"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  />
                  <span className="align-self-center">-</span>
                  <input
                    type="date"
                    className="form-control glass-input"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle bg-primary-subtle p-3 me-3">
                  <FaEnvelope size={24} className="text-primary" />
                </div>
                <div>
                  <h6 className="mb-0">Total Sent</h6>
                  <h3 className="mb-0">{trackingData.length}</h3>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle bg-success-subtle p-3 me-3">
                  <FaCheck size={24} className="text-success" />
                </div>
                <div>
                  <h6 className="mb-0">Delivered</h6>
                  <h3 className="mb-0">
                    {trackingData.filter(item => 
                      item.delivery_status?.toLowerCase() === 'delivered'
                    ).length}
                  </h3>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle bg-info-subtle p-3 me-3">
                  <FaEye size={24} className="text-info" />
                </div>
                <div>
                  <h6 className="mb-0">Opened</h6>
                  <h3 className="mb-0">
                    {trackingData.filter(item => item.is_opened).length}
                    <small className="text-muted ms-2" style={{ fontSize: '1rem' }}>
                      {trackingData.length > 0 
                        ? `(${Math.round((trackingData.filter(item => item.is_opened).length / trackingData.length) * 100)}%)`
                        : '(0%)'
                      }
                    </small>
                  </h3>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle bg-warning-subtle p-3 me-3">
                  <FaUserFriends size={24} className="text-warning" />
                </div>
                <div>
                  <h6 className="mb-0">Engagement Rate</h6>
                  <h3 className="mb-0">
                    {trackingData.length > 0 
                      ? `${Math.round((trackingData.filter(item => item.is_clicked).length / trackingData.length) * 100)}%`
                      : '0%'
                    }
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Data Table */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted">Loading tracking data...</p>
              </div>
            ) : filteredData.length > 0 ? (
              <>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Guest</th>
                        <th>Channel</th>
                        <th>Recipient</th>
                        <th>Subject</th>
                        <th>Sent</th>
                        <th>Delivery</th>
                        <th>Opened</th>
                        <th>Clicked</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((notification) => (
                        <tr key={notification.notification_id}>
                          <td>{notification.guest_name || 'N/A'}</td>
                          <td>{getChannelIcon(notification.channel)} {notification.channel}</td>
                          <td>{notification.recipient}</td>
                          <td className="text-truncate" style={{maxWidth: '200px'}}>
                            {notification.subject || 'No Subject'}
                          </td>
                          <td>{notification.sent_time ? formatDistanceToNow(new Date(notification.sent_time), { addSuffix: true }) : 'N/A'}</td>
                          <td>
                            {getStatusIcon(notification.delivery_status)} {notification.delivery_status}
                          </td>
                          <td>
                            {notification.is_opened ? (
                              <span className="badge bg-success">Opened</span>
                            ) : (
                              <span className="badge bg-secondary">Not Opened</span>
                            )}
                          </td>
                          <td>
                            {notification.is_clicked ? (
                              <span className="badge bg-primary">Clicked</span>
                            ) : (
                              <span className="badge bg-secondary">Not Clicked</span>
                            )}
                          </td>
                          <td>
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleViewDetail(notification)}
                            >
                              <FaEye /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav className="d-flex justify-content-center mt-4">
                    <ul className="pagination">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </button>
                      </li>
                      
                      {[...Array(totalPages).keys()].map(number => (
                        <li 
                          key={number + 1} 
                          className={`page-item ${currentPage === number + 1 ? 'active' : ''}`}
                        >
                          <button 
                            className="page-link" 
                            onClick={() => setCurrentPage(number + 1)}
                          >
                            {number + 1}
                          </button>
                        </li>
                      ))}
                      
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                )}
              </>
            ) : (
              <div className="text-center py-5">
                <FaInfoCircle size={40} className="text-muted mb-3" />
                <p className="mb-0">No notification tracking data found.</p>
                <p className="text-muted">
                  Try changing your filters or send new notifications to start tracking.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Detail Modal */}
      {showDetailModal && selectedNotification && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content glass-card">
              <div className="modal-header">
                <h5 className="modal-title">Notification Details</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowDetailModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <h6 className="text-muted mb-1">Channel</h6>
                    <p className="mb-3">
                      {getChannelIcon(selectedNotification.channel)} {selectedNotification.channel || 'N/A'}
                    </p>
                    
                    <h6 className="text-muted mb-1">Recipient</h6>
                    <p className="mb-3">{selectedNotification.recipient || 'N/A'}</p>
                    
                    <h6 className="text-muted mb-1">Subject</h6>
                    <p className="mb-3">{selectedNotification.subject || 'No Subject'}</p>
                  </div>
                  
                  <div className="col-md-6">
                    <h6 className="text-muted mb-1">Guest</h6>
                    <p className="mb-3">{selectedNotification.guest_name || 'N/A'}</p>
                    
                    <h6 className="text-muted mb-1">Sent Time</h6>
                    <p className="mb-3">
                      {selectedNotification.sent_time 
                        ? new Date(selectedNotification.sent_time).toLocaleString() 
                        : 'N/A'
                      }
                    </p>
                    
                    <h6 className="text-muted mb-1">Campaign</h6>
                    <p className="mb-3">{selectedNotification.campaign_name || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-12">
                    <h6 className="text-muted mb-1">Content Preview</h6>
                    <div className="border p-3 rounded bg-light">
                      <div dangerouslySetInnerHTML={{ 
                        __html: selectedNotification.message_content || 'No content available' 
                      }} />
                    </div>
                  </div>
                </div>
                
                <hr />
                
                <div className="row">
                  <div className="col-md-4 text-center">
                    <h6>Delivery Status</h6>
                    <div className={`d-inline-block rounded-circle p-3 ${
                      selectedNotification.delivery_status?.toLowerCase() === 'delivered' 
                        ? 'bg-success-subtle' 
                        : selectedNotification.delivery_status?.toLowerCase() === 'failed'
                        ? 'bg-danger-subtle'
                        : 'bg-warning-subtle'
                    }`}>
                      {getStatusIcon(selectedNotification.delivery_status)}
                    </div>
                    <p className="mt-2">{selectedNotification.delivery_status || 'Unknown'}</p>
                  </div>
                  
                  <div className="col-md-4 text-center">
                    <h6>Open Status</h6>
                    <div className={`d-inline-block rounded-circle p-3 ${
                      selectedNotification.is_opened 
                        ? 'bg-success-subtle' 
                        : 'bg-secondary-subtle'
                    }`}>
                      {selectedNotification.is_opened 
                        ? <FaEye className="text-success" /> 
                        : <FaTimes className="text-secondary" />
                      }
                    </div>
                    <p className="mt-2">
                      {selectedNotification.is_opened 
                        ? `Opened ${selectedNotification.opened_time 
                            ? formatDistanceToNow(new Date(selectedNotification.opened_time), { addSuffix: true })
                            : ''}`
                        : 'Not Opened'
                      }
                    </p>
                  </div>
                  
                  <div className="col-md-4 text-center">
                    <h6>Click Status</h6>
                    <div className={`d-inline-block rounded-circle p-3 ${
                      selectedNotification.is_clicked 
                        ? 'bg-primary-subtle' 
                        : 'bg-secondary-subtle'
                    }`}>
                      {selectedNotification.is_clicked 
                        ? <FaCheck className="text-primary" /> 
                        : <FaTimes className="text-secondary" />
                      }
                    </div>
                    <p className="mt-2">
                      {selectedNotification.is_clicked 
                        ? `Clicked ${selectedNotification.clicked_time 
                            ? formatDistanceToNow(new Date(selectedNotification.clicked_time), { addSuffix: true })
                            : ''}`
                        : 'No Clicks'
                      }
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
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
  );
};

export default NotificationTracking;
