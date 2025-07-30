import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FaChartBar,
  FaUsers,
  FaCalendarAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCog,
  FaPlus,
  FaTimes,
  FaExpand,
  FaCompress,
  FaRefresh,
  FaDownload,
  FaEdit,
  FaTrash,
  FaEye,
  FaUserFriends,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaGripVertical,
  FaFilter,
  FaSearch
} from 'react-icons/fa';

const OverviewDashboard = () => {
  const [dashboardData, setDashboardData] = useState({});
  const [widgets, setWidgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [availableWidgets, setAvailableWidgets] = useState([]);
  const [expandedWidget, setExpandedWidget] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filterDateRange, setFilterDateRange] = useState('30days');
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [events, setEvents] = useState([]);

  // Default widget configuration
  const defaultWidgets = [
    { id: 'overview-stats', type: 'stats', title: 'Overview Statistics', size: 'large', position: 0 },
    { id: 'event-status', type: 'event-status', title: 'Event Status Summary', size: 'medium', position: 1 },
    { id: 'guest-rsvp', type: 'guest-rsvp', title: 'Guest RSVP Status', size: 'medium', position: 2 },
    { id: 'recent-activity', type: 'activity', title: 'Recent Activity', size: 'medium', position: 3 },
    { id: 'communication-stats', type: 'communication', title: 'Communication Performance', size: 'medium', position: 4 },
    { id: 'logistics-summary', type: 'logistics', title: 'Logistics Summary', size: 'medium', position: 5 }
  ];

  const widgetTypes = [
    { id: 'stats', name: 'Overview Statistics', description: 'Key performance metrics' },
    { id: 'event-status', name: 'Event Status', description: 'Current event statuses' },
    { id: 'guest-rsvp', name: 'RSVP Status', description: 'Guest response tracking' },
    { id: 'activity', name: 'Recent Activity', description: 'Latest system activity' },
    { id: 'communication', name: 'Communication Stats', description: 'Notification performance' },
    { id: 'logistics', name: 'Logistics Summary', description: 'Travel and accommodation' },
    { id: 'calendar', name: 'Event Calendar', description: 'Upcoming events timeline' },
    { id: 'performance', name: 'Performance Metrics', description: 'System performance data' }
  ];

  const dateRanges = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' }
  ];

  useEffect(() => {
    loadDashboardConfig();
    fetchEvents();
    fetchDashboardData();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000);
    
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [filterDateRange, selectedEvents]);

  const loadDashboardConfig = () => {
    try {
      const savedConfig = localStorage.getItem('dashboard_config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        setWidgets(config.widgets || defaultWidgets);
      } else {
        setWidgets(defaultWidgets);
      }
    } catch (error) {
      console.error('Error loading dashboard config:', error);
      setWidgets(defaultWidgets);
    }
  };

  const saveDashboardConfig = (newWidgets) => {
    try {
      const config = {
        widgets: newWidgets,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem('dashboard_config', JSON.stringify(config));
    } catch (error) {
      console.error('Error saving dashboard config:', error);
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

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        dateRange: filterDateRange,
        ...(selectedEvents.length > 0 && { eventIds: selectedEvents.join(',') })
      });

      const response = await fetch(`/api/dashboard/overview?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setLastUpdated(new Date());
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      // Set default empty data structure
      setDashboardData({
        overview: {
          totalEvents: 0,
          totalGuests: 0,
          totalRSVPs: 0,
          pendingRSVPs: 0,
          confirmedRSVPs: 0,
          declinedRSVPs: 0
        },
        eventStats: [],
        guestStats: {},
        recentActivity: [],
        communicationStats: {},
        logisticsStats: {}
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addWidget = (widgetType) => {
    const newWidget = {
      id: `${widgetType.id}-${Date.now()}`,
      type: widgetType.id,
      title: widgetType.name,
      size: 'medium',
      position: widgets.length
    };
    
    const newWidgets = [...widgets, newWidget];
    setWidgets(newWidgets);
    saveDashboardConfig(newWidgets);
    setAvailableWidgets(availableWidgets.filter(w => w.id !== widgetType.id));
  };

  const removeWidget = (widgetId) => {
    const newWidgets = widgets.filter(w => w.id !== widgetId);
    setWidgets(newWidgets);
    saveDashboardConfig(newWidgets);
  };

  const updateWidgetSize = (widgetId, newSize) => {
    const newWidgets = widgets.map(w => 
      w.id === widgetId ? { ...w, size: newSize } : w
    );
    setWidgets(newWidgets);
    saveDashboardConfig(newWidgets);
  };

  const moveWidget = (widgetId, direction) => {
    const currentIndex = widgets.findIndex(w => w.id === widgetId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === widgets.length - 1)
    ) {
      return;
    }

    const newWidgets = [...widgets];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    [newWidgets[currentIndex], newWidgets[targetIndex]] = 
    [newWidgets[targetIndex], newWidgets[currentIndex]];
    
    setWidgets(newWidgets);
    saveDashboardConfig(newWidgets);
  };

  const resetToDefault = () => {
    setWidgets(defaultWidgets);
    saveDashboardConfig(defaultWidgets);
    toast.success('Dashboard reset to default configuration');
  };

  const exportDashboard = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      dateRange: filterDateRange,
      selectedEvents,
      data: dashboardData
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getWidgetSizeClass = (size) => {
    switch (size) {
      case 'small': return 'col-md-4';
      case 'large': return 'col-12';
      case 'medium':
      default: return 'col-md-6';
    }
  };

  const renderOverviewStats = () => (
    <div className="row g-3">
      <div className="col-md-3">
        <div className="card glass-card h-100">
          <div className="card-body text-center">
            <FaCalendarAlt className="text-primary mb-2" size={24} />
            <h4 className="text-primary mb-1">{dashboardData.overview?.totalEvents || 0}</h4>
            <small className="text-muted">Active Events</small>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card glass-card h-100">
          <div className="card-body text-center">
            <FaUsers className="text-info mb-2" size={24} />
            <h4 className="text-info mb-1">{dashboardData.overview?.totalGuests || 0}</h4>
            <small className="text-muted">Total Guests</small>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card glass-card h-100">
          <div className="card-body text-center">
            <FaCheckCircle className="text-success mb-2" size={24} />
            <h4 className="text-success mb-1">{dashboardData.overview?.confirmedRSVPs || 0}</h4>
            <small className="text-muted">Confirmed RSVPs</small>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card glass-card h-100">
          <div className="card-body text-center">
            <FaClock className="text-warning mb-2" size={24} />
            <h4 className="text-warning mb-1">{dashboardData.overview?.pendingRSVPs || 0}</h4>
            <small className="text-muted">Pending RSVPs</small>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEventStatus = () => (
    <div className="table-responsive">
      <table className="table table-sm">
        <thead>
          <tr>
            <th>Event</th>
            <th>Status</th>
            <th>Guests</th>
            <th>RSVPs</th>
          </tr>
        </thead>
        <tbody>
          {(dashboardData.eventStats || []).slice(0, 5).map((event, index) => (
            <tr key={index}>
              <td>
                <div className="fw-semibold">{event.event_name}</div>
                <small className="text-muted">{event.event_date}</small>
              </td>
              <td>
                <span className={`badge ${
                  event.status === 'active' ? 'bg-success' :
                  event.status === 'upcoming' ? 'bg-primary' :
                  event.status === 'completed' ? 'bg-secondary' : 'bg-warning'
                }`}>
                  {event.status}
                </span>
              </td>
              <td>{event.total_guests || 0}</td>
              <td>
                <div className="progress" style={{ height: '6px' }}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{ width: `${event.rsvp_rate || 0}%` }}
                  ></div>
                </div>
                <small className="text-muted">{event.rsvp_rate || 0}%</small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderGuestRSVP = () => {
    const rsvpData = dashboardData.guestStats || {};
    const total = rsvpData.confirmed + rsvpData.declined + rsvpData.pending || 1;
    
    return (
      <div>
        <div className="row g-3 mb-3">
          <div className="col-4 text-center">
            <div className="text-success fw-bold h5">{rsvpData.confirmed || 0}</div>
            <small className="text-muted">Confirmed</small>
          </div>
          <div className="col-4 text-center">
            <div className="text-danger fw-bold h5">{rsvpData.declined || 0}</div>
            <small className="text-muted">Declined</small>
          </div>
          <div className="col-4 text-center">
            <div className="text-warning fw-bold h5">{rsvpData.pending || 0}</div>
            <small className="text-muted">Pending</small>
          </div>
        </div>
        <div className="progress mb-2" style={{ height: '20px' }}>
          <div 
            className="progress-bar bg-success" 
            style={{ width: `${((rsvpData.confirmed || 0) / total) * 100}%` }}
          ></div>
          <div 
            className="progress-bar bg-danger" 
            style={{ width: `${((rsvpData.declined || 0) / total) * 100}%` }}
          ></div>
          <div 
            className="progress-bar bg-warning" 
            style={{ width: `${((rsvpData.pending || 0) / total) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const renderRecentActivity = () => (
    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
      {(dashboardData.recentActivity || []).slice(0, 10).map((activity, index) => (
        <div key={index} className="d-flex align-items-center mb-3 pb-2 border-bottom">
          <div className="me-3">
            {activity.type === 'rsvp' && <FaCheckCircle className="text-success" />}
            {activity.type === 'guest_added' && <FaUsers className="text-info" />}
            {activity.type === 'event_created' && <FaCalendarAlt className="text-primary" />}
            {activity.type === 'notification_sent' && <FaEnvelope className="text-warning" />}
          </div>
          <div className="flex-grow-1">
            <div className="fw-semibold small">{activity.description}</div>
            <small className="text-muted">{activity.timestamp}</small>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCommunicationStats = () => {
    const commStats = dashboardData.communicationStats || {};
    
    return (
      <div className="row g-3">
        <div className="col-6">
          <div className="text-center">
            <FaEnvelope className="text-primary mb-1" size={20} />
            <div className="fw-bold">{commStats.emailsSent || 0}</div>
            <small className="text-muted">Emails Sent</small>
          </div>
        </div>
        <div className="col-6">
          <div className="text-center">
            <FaEye className="text-info mb-1" size={20} />
            <div className="fw-bold">{commStats.openRate || 0}%</div>
            <small className="text-muted">Open Rate</small>
          </div>
        </div>
        <div className="col-6">
          <div className="text-center">
            <div className="fw-bold text-success">{commStats.smsSent || 0}</div>
            <small className="text-muted">SMS Sent</small>
          </div>
        </div>
        <div className="col-6">
          <div className="text-center">
            <div className="fw-bold text-warning">{commStats.whatsappSent || 0}</div>
            <small className="text-muted">WhatsApp Sent</small>
          </div>
        </div>
      </div>
    );
  };

  const renderLogisticsSummary = () => {
    const logStats = dashboardData.logisticsStats || {};
    
    return (
      <div className="row g-3">
        <div className="col-6">
          <div className="text-center">
            <FaMapMarkerAlt className="text-primary mb-1" size={20} />
            <div className="fw-bold">{logStats.accommodationsBooked || 0}</div>
            <small className="text-muted">Accommodations</small>
          </div>
        </div>
        <div className="col-6">
          <div className="text-center">
            <div className="fw-bold text-info">{logStats.vehiclesAllocated || 0}</div>
            <small className="text-muted">Vehicles</small>
          </div>
        </div>
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <span className="small">Travel Arrangements</span>
            <span className="fw-bold">{logStats.travelArrangements || 0}</span>
          </div>
          <div className="progress mt-1" style={{ height: '4px' }}>
            <div 
              className="progress-bar bg-success" 
              style={{ width: `${logStats.completionRate || 0}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  const renderWidget = (widget) => {
    const isExpanded = expandedWidget === widget.id;
    
    return (
      <div key={widget.id} className={`${getWidgetSizeClass(widget.size)} mb-4`}>
        <div className={`card glass-card h-100 ${isExpanded ? 'position-fixed top-0 start-0 w-100 h-100' : ''}`} 
             style={isExpanded ? { zIndex: 1050 } : {}}>
          <div className="card-header d-flex justify-content-between align-items-center">
            <h6 className="card-title mb-0">{widget.title}</h6>
            <div className="d-flex gap-1">
              {isCustomizing && (
                <>
                  <button 
                    className="btn btn-sm btn-outline-secondary glass-btn"
                    onClick={() => moveWidget(widget.id, 'up')}
                    title="Move Up"
                  >
                    <FaArrowUp size={12} />
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-secondary glass-btn"
                    onClick={() => moveWidget(widget.id, 'down')}
                    title="Move Down"
                  >
                    <FaArrowDown size={12} />
                  </button>
                  <select
                    className="form-select form-select-sm glass-input"
                    style={{ width: 'auto' }}
                    value={widget.size}
                    onChange={(e) => updateWidgetSize(widget.id, e.target.value)}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                  <button 
                    className="btn btn-sm btn-outline-danger glass-btn"
                    onClick={() => removeWidget(widget.id)}
                    title="Remove Widget"
                  >
                    <FaTrash size={12} />
                  </button>
                </>
              )}
              <button 
                className="btn btn-sm btn-outline-info glass-btn"
                onClick={() => setExpandedWidget(isExpanded ? null : widget.id)}
                title={isExpanded ? "Minimize" : "Expand"}
              >
                {isExpanded ? <FaCompress size={12} /> : <FaExpand size={12} />}
              </button>
            </div>
          </div>
          <div className="card-body">
            {widget.type === 'stats' && renderOverviewStats()}
            {widget.type === 'event-status' && renderEventStatus()}
            {widget.type === 'guest-rsvp' && renderGuestRSVP()}
            {widget.type === 'activity' && renderRecentActivity()}
            {widget.type === 'communication' && renderCommunicationStats()}
            {widget.type === 'logistics' && renderLogisticsSummary()}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && widgets.length === 0) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading dashboard...</p>
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
              Dashboard Overview
            </h2>
            <p className="text-muted mb-0">
              Comprehensive view of your RSVP event management system
              {lastUpdated && (
                <span className="ms-2">
                  • Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={() => fetchDashboardData()}
              disabled={isLoading}
            >
              <FaRefresh className={`me-2 ${isLoading ? 'fa-spin' : ''}`} />
              Refresh
            </button>
            <button 
              className="btn btn-outline-info glass-btn"
              onClick={() => setIsCustomizing(!isCustomizing)}
            >
              <FaCog className="me-2" />
              {isCustomizing ? 'Done' : 'Customize'}
            </button>
            <button 
              className="btn btn-outline-primary glass-btn"
              onClick={exportDashboard}
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
                <label className="form-label fw-semibold">Date Range</label>
                <select
                  className="form-select glass-input"
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value)}
                >
                  {dateRanges.map(range => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Filter by Events</label>
                <select
                  className="form-select glass-input"
                  multiple
                  value={selectedEvents}
                  onChange={(e) => setSelectedEvents(Array.from(e.target.selectedOptions, option => option.value))}
                >
                  {events.map(event => (
                    <option key={event.event_id} value={event.event_id}>
                      {event.event_name}
                    </option>
                  ))}
                </select>
                <small className="text-muted">Hold Ctrl/Cmd to select multiple events</small>
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <button 
                  className="btn btn-outline-secondary glass-btn w-100"
                  onClick={() => {
                    setFilterDateRange('30days');
                    setSelectedEvents([]);
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customization Panel */}
        {isCustomizing && (
          <div className="card glass-card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">Customize Dashboard</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-8">
                  <h6>Available Widgets</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {widgetTypes.filter(type => !widgets.some(w => w.type === type.id)).map(type => (
                      <button
                        key={type.id}
                        className="btn btn-outline-primary glass-btn"
                        onClick={() => addWidget(type)}
                      >
                        <FaPlus className="me-2" />
                        {type.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-md-4">
                  <h6>Actions</h6>
                  <div className="d-flex flex-column gap-2">
                    <button 
                      className="btn btn-outline-warning glass-btn"
                      onClick={resetToDefault}
                    >
                      Reset to Default
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Widgets Grid */}
        <div className="row">
          {widgets
            .sort((a, b) => a.position - b.position)
            .map(widget => renderWidget(widget))}
        </div>

        {widgets.length === 0 && (
          <div className="text-center py-5">
            <FaChartBar className="text-muted mb-3" size={48} />
            <h5 className="text-muted">No widgets configured</h5>
            <p className="text-muted mb-3">Click "Customize" to add widgets to your dashboard</p>
            <button 
              className="btn btn-primary glass-btn-primary"
              onClick={() => setIsCustomizing(true)}
            >
              <FaCog className="me-2" />
              Customize Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewDashboard;