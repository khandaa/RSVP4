import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaEnvelope,
  FaSms,
  FaWhatsapp,
  FaUsers,
  FaEye,
  FaMousePointer,
  FaCheck,
  FaTimes,
  FaClock,
  FaCalendarAlt,
  FaFilter,
  FaDownload,
  FaRefresh,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner
} from 'react-icons/fa';

const NotificationAnalytics = () => {
  const [analytics, setAnalytics] = useState({});
  const [campaigns, setCampaigns] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30days');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [viewType, setViewType] = useState('overview');

  const timeRanges = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const channels = [
    { value: 'all', label: 'All Channels' },
    { value: 'email', label: 'Email', icon: FaEnvelope },
    { value: 'sms', label: 'SMS', icon: FaSms },
    { value: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp }
  ];

  const viewTypes = [
    { value: 'overview', label: 'Overview', icon: FaChartBar },
    { value: 'performance', label: 'Performance', icon: FaChartLine },
    { value: 'engagement', label: 'Engagement', icon: FaMousePointer },
    { value: 'delivery', label: 'Delivery Status', icon: FaCheck }
  ];

  useEffect(() => {
    fetchAnalytics();
    fetchCampaigns();
    fetchEvents();
  }, [selectedTimeRange, selectedChannel, selectedEvent, selectedCampaign]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        timeRange: selectedTimeRange,
        channel: selectedChannel,
        ...(selectedEvent && { eventId: selectedEvent }),
        ...(selectedCampaign && { campaignId: selectedCampaign })
      });

      const response = await fetch(`/api/notifications/analytics?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load notification analytics');
      // Set default analytics structure
      setAnalytics({
        overview: {
          totalSent: 0,
          totalDelivered: 0,
          totalOpened: 0,
          totalClicked: 0,
          deliveryRate: 0,
          openRate: 0,
          clickRate: 0,
          unsubscribeRate: 0
        },
        byChannel: {},
        byEvent: {},
        recentActivity: [],
        performanceTrends: [],
        topCampaigns: [],
        failureReasons: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/notification-campaigns', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const exportAnalytics = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Sent', analytics.overview?.totalSent || 0],
      ['Total Delivered', analytics.overview?.totalDelivered || 0],
      ['Total Opened', analytics.overview?.totalOpened || 0],
      ['Total Clicked', analytics.overview?.totalClicked || 0],
      ['Delivery Rate', `${analytics.overview?.deliveryRate || 0}%`],
      ['Open Rate', `${analytics.overview?.openRate || 0}%`],
      ['Click Rate', `${analytics.overview?.clickRate || 0}%`],
      ['Unsubscribe Rate', `${analytics.overview?.unsubscribeRate || 0}%`]
    ];

    const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-danger';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return <FaCheckCircle className="text-success" />;
      case 'failed': return <FaTimesCircle className="text-danger" />;
      case 'pending': return <FaClock className="text-warning" />;
      case 'processing': return <FaSpinner className="text-primary fa-spin" />;
      default: return <FaInfoCircle className="text-muted" />;
    }
  };

  const renderOverviewCards = () => (
    <div className="row g-4 mb-4">
      <div className="col-md-3">
        <div className="card glass-card h-100">
          <div className="card-body text-center">
            <FaEnvelope className="text-primary mb-2" size={24} />
            <h4 className="text-primary mb-1">{analytics.overview?.totalSent?.toLocaleString() || 0}</h4>
            <small className="text-muted">Total Sent</small>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card glass-card h-100">
          <div className="card-body text-center">
            <FaCheck className="text-success mb-2" size={24} />
            <h4 className="text-success mb-1">{analytics.overview?.totalDelivered?.toLocaleString() || 0}</h4>
            <small className="text-muted">Delivered</small>
            <div className={`fw-bold ${getPercentageColor(analytics.overview?.deliveryRate || 0)}`}>
              {analytics.overview?.deliveryRate || 0}%
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card glass-card h-100">
          <div className="card-body text-center">
            <FaEye className="text-info mb-2" size={24} />
            <h4 className="text-info mb-1">{analytics.overview?.totalOpened?.toLocaleString() || 0}</h4>
            <small className="text-muted">Opened</small>
            <div className={`fw-bold ${getPercentageColor(analytics.overview?.openRate || 0)}`}>
              {analytics.overview?.openRate || 0}%
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card glass-card h-100">
          <div className="card-body text-center">
            <FaMousePointer className="text-warning mb-2" size={24} />
            <h4 className="text-warning mb-1">{analytics.overview?.totalClicked?.toLocaleString() || 0}</h4>
            <small className="text-muted">Clicked</small>
            <div className={`fw-bold ${getPercentageColor(analytics.overview?.clickRate || 0)}`}>
              {analytics.overview?.clickRate || 0}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChannelPerformance = () => (
    <div className="card glass-card mb-4">
      <div className="card-header">
        <h5 className="card-title mb-0">
          <FaChartPie className="me-2" />
          Performance by Channel
        </h5>
      </div>
      <div className="card-body">
        <div className="row">
          {Object.entries(analytics.byChannel || {}).map(([channel, data]) => {
            const channelInfo = channels.find(c => c.value === channel);
            const Icon = channelInfo?.icon || FaEnvelope;
            return (
              <div key={channel} className="col-md-4 mb-3">
                <div className="border rounded p-3">
                  <div className="d-flex align-items-center mb-2">
                    <Icon className="me-2 text-primary" />
                    <h6 className="mb-0">{channelInfo?.label || channel}</h6>
                  </div>
                  <div className="row text-center">
                    <div className="col-6">
                      <small className="text-muted">Sent</small>
                      <div className="fw-bold">{data.sent?.toLocaleString() || 0}</div>
                    </div>
                    <div className="col-6">
                      <small className="text-muted">Delivered</small>
                      <div className="fw-bold text-success">{data.delivered?.toLocaleString() || 0}</div>
                    </div>
                  </div>
                  <div className="row text-center mt-2">
                    <div className="col-6">
                      <small className="text-muted">Open Rate</small>
                      <div className={`fw-bold ${getPercentageColor(data.openRate || 0)}`}>
                        {data.openRate || 0}%
                      </div>
                    </div>
                    <div className="col-6">
                      <small className="text-muted">Click Rate</small>
                      <div className={`fw-bold ${getPercentageColor(data.clickRate || 0)}`}>
                        {data.clickRate || 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderTopCampaigns = () => (
    <div className="card glass-card mb-4">
      <div className="card-header">
        <h5 className="card-title mb-0">
          <FaChartBar className="me-2" />
          Top Performing Campaigns
        </h5>
      </div>
      <div className="card-body">
        {analytics.topCampaigns?.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Channel</th>
                  <th>Sent</th>
                  <th>Delivered</th>
                  <th>Open Rate</th>
                  <th>Click Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topCampaigns.map((campaign, index) => (
                  <tr key={index}>
                    <td>
                      <div className="fw-semibold">{campaign.name}</div>
                      <small className="text-muted">{campaign.date}</small>
                    </td>
                    <td>
                      <span className={`badge bg-${campaign.channel === 'email' ? 'primary' : campaign.channel === 'sms' ? 'success' : 'info'}`}>
                        {campaign.channel}
                      </span>
                    </td>
                    <td>{campaign.sent?.toLocaleString() || 0}</td>
                    <td>{campaign.delivered?.toLocaleString() || 0}</td>
                    <td>
                      <span className={getPercentageColor(campaign.openRate || 0)}>
                        {campaign.openRate || 0}%
                      </span>
                    </td>
                    <td>
                      <span className={getPercentageColor(campaign.clickRate || 0)}>
                        {campaign.clickRate || 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-3">
            <FaChartBar className="text-muted mb-2" size={32} />
            <p className="text-muted">No campaign data available for the selected period</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderRecentActivity = () => (
    <div className="card glass-card mb-4">
      <div className="card-header">
        <h5 className="card-title mb-0">
          <FaClock className="me-2" />
          Recent Activity
        </h5>
      </div>
      <div className="card-body">
        {analytics.recentActivity?.length > 0 ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                <div className="me-3">
                  {getStatusIcon(activity.status)}
                </div>
                <div className="flex-grow-1">
                  <div className="fw-semibold">{activity.campaign_name}</div>
                  <small className="text-muted">
                    {activity.recipient_email} • {activity.channel}
                  </small>
                  <div className="text-muted small">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="text-end">
                  <span className={`badge ${
                    activity.status === 'delivered' ? 'bg-success' :
                    activity.status === 'failed' ? 'bg-danger' :
                    activity.status === 'pending' ? 'bg-warning' : 'bg-secondary'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3">
            <FaClock className="text-muted mb-2" size={32} />
            <p className="text-muted">No recent activity to display</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderFailureAnalysis = () => (
    <div className="card glass-card mb-4">
      <div className="card-header">
        <h5 className="card-title mb-0">
          <FaExclamationTriangle className="me-2" />
          Failure Analysis
        </h5>
      </div>
      <div className="card-body">
        {analytics.failureReasons?.length > 0 ? (
          <div className="row">
            {analytics.failureReasons.map((reason, index) => (
              <div key={index} className="col-md-6 mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span>{reason.reason}</span>
                  <div className="text-end">
                    <div className="fw-bold text-danger">{reason.count}</div>
                    <small className="text-muted">{reason.percentage}%</small>
                  </div>
                </div>
                <div className="progress mt-1" style={{ height: '4px' }}>
                  <div 
                    className="progress-bar bg-danger" 
                    style={{ width: `${reason.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3">
            <FaCheckCircle className="text-success mb-2" size={32} />
            <p className="text-muted">No failures recorded for the selected period</p>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading notification analytics...</p>
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
              <FaChartBar className="me-2 text-primary" />
              Notification Analytics
            </h2>
            <p className="text-muted mb-0">Track notification performance and engagement metrics</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={() => fetchAnalytics()}
            >
              <FaRefresh className="me-2" />
              Refresh
            </button>
            <button 
              className="btn btn-outline-primary glass-btn"
              onClick={exportAnalytics}
            >
              <FaDownload className="me-2" />
              Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label fw-semibold">Time Range</label>
                <select
                  className="form-select glass-input"
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                >
                  {timeRanges.map(range => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Channel</label>
                <select
                  className="form-select glass-input"
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                >
                  {channels.map(channel => (
                    <option key={channel.value} value={channel.value}>{channel.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Event</label>
                <select
                  className="form-select glass-input"
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                >
                  <option value="">All Events</option>
                  {events.map(event => (
                    <option key={event.event_id} value={event.event_id}>
                      {event.event_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Campaign</label>
                <select
                  className="form-select glass-input"
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                >
                  <option value="">All Campaigns</option>
                  {campaigns.map(campaign => (
                    <option key={campaign.campaign_id} value={campaign.campaign_id}>
                      {campaign.campaign_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* View Type Tabs */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="btn-group w-100" role="group">
              {viewTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    className={`btn ${viewType === type.value ? 'btn-primary' : 'btn-outline-primary'} glass-btn`}
                    onClick={() => setViewType(type.value)}
                  >
                    <Icon className="me-2" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        {renderOverviewCards()}

        {/* View-specific Content */}
        {viewType === 'overview' && (
          <>
            {renderChannelPerformance()}
            {renderTopCampaigns()}
          </>
        )}

        {viewType === 'performance' && (
          <>
            {renderTopCampaigns()}
            {renderChannelPerformance()}
          </>
        )}

        {viewType === 'engagement' && (
          <>
            {renderChannelPerformance()}
            {renderRecentActivity()}
          </>
        )}

        {viewType === 'delivery' && (
          <>
            {renderFailureAnalysis()}
            {renderRecentActivity()}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationAnalytics;