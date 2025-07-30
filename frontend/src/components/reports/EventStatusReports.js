import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FaCalendarAlt,
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaDownload,
  FaFilter,
  FaSearch,
  FaRefresh,
  FaEye,
  FaEdit,
  FaMapMarkerAlt,
  FaDollarSign,
  FaPercentage,
  FaTimes,
  FaFileExport,
  FaPrint,
  FaExpand,
  FaCompress
} from 'react-icons/fa';

const EventStatusReports = () => {
  const [events, setEvents] = useState([]);
  const [reportData, setReportData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [reportType, setReportType] = useState('summary');
  const [groupBy, setGroupBy] = useState('status');
  const [showDetails, setShowDetails] = useState({});
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const eventStatuses = [
    { value: 'planning', label: 'Planning', color: 'primary', icon: FaClock },
    { value: 'active', label: 'Active', color: 'success', icon: FaCheckCircle },
    { value: 'completed', label: 'Completed', color: 'secondary', icon: FaCheckCircle },
    { value: 'cancelled', label: 'Cancelled', color: 'danger', icon: FaTimesCircle },
    { value: 'postponed', label: 'Postponed', color: 'warning', icon: FaExclamationTriangle }
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const reportTypes = [
    { value: 'summary', label: 'Summary Report', icon: FaChartBar },
    { value: 'detailed', label: 'Detailed Report', icon: FaChartLine },
    { value: 'performance', label: 'Performance Analysis', icon: FaChartPie },
    { value: 'financial', label: 'Financial Overview', icon: FaDollarSign }
  ];

  const groupByOptions = [
    { value: 'status', label: 'Event Status' },
    { value: 'date', label: 'Event Date' },
    { value: 'location', label: 'Location' },
    { value: 'client', label: 'Client' },
    { value: 'size', label: 'Event Size' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    generateReport();
  }, [events, filterStatus, filterDateRange, customDateRange, selectedEvents, reportType, groupBy]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [eventsRes] = await Promise.all([
        fetch('/api/events', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const eventsData = eventsRes.ok ? await eventsRes.json() : [];
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load event data');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = () => {
    let filteredEvents = events;

    // Apply filters
    if (searchTerm) {
      filteredEvents = filteredEvents.filter(event =>
        event.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.event_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus) {
      filteredEvents = filteredEvents.filter(event => event.event_status === filterStatus);
    }

    if (selectedEvents.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        selectedEvents.includes(event.event_id.toString())
      );
    }

    // Apply date range filter
    if (filterDateRange !== 'all') {
      const now = new Date();
      let startDate, endDate;

      switch (filterDateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
          endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          endDate = new Date(now.getFullYear(), quarter * 3 + 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear() + 1, 0, 1);
          break;
        case 'custom':
          if (customDateRange.startDate && customDateRange.endDate) {
            startDate = new Date(customDateRange.startDate);
            endDate = new Date(customDateRange.endDate);
          }
          break;
      }

      if (startDate && endDate) {
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.event_date);
          return eventDate >= startDate && eventDate < endDate;
        });
      }
    }

    // Generate report data based on report type and grouping
    const reportData = generateReportData(filteredEvents);
    setReportData(reportData);
  };

  const generateReportData = (filteredEvents) => {
    const data = {
      totalEvents: filteredEvents.length,
      events: filteredEvents,
      summary: {},
      groupedData: {},
      performanceMetrics: {},
      financialData: {}
    };

    // Summary statistics
    data.summary = {
      byStatus: eventStatuses.reduce((acc, status) => {
        acc[status.value] = filteredEvents.filter(e => e.event_status === status.value).length;
        return acc;
      }, {}),
      totalGuests: filteredEvents.reduce((sum, e) => sum + (e.total_guests || 0), 0),
      averageGuests: filteredEvents.length > 0 ? 
        Math.round(filteredEvents.reduce((sum, e) => sum + (e.total_guests || 0), 0) / filteredEvents.length) : 0,
      rsvpStats: {
        confirmed: filteredEvents.reduce((sum, e) => sum + (e.confirmed_guests || 0), 0),
        pending: filteredEvents.reduce((sum, e) => sum + (e.pending_guests || 0), 0),
        declined: filteredEvents.reduce((sum, e) => sum + (e.declined_guests || 0), 0)
      }
    };

    // Group data based on groupBy option
    data.groupedData = groupEventData(filteredEvents, groupBy);

    // Performance metrics
    data.performanceMetrics = {
      rsvpRate: data.summary.totalGuests > 0 ? 
        Math.round((data.summary.rsvpStats.confirmed / data.summary.totalGuests) * 100) : 0,
      completionRate: filteredEvents.length > 0 ?
        Math.round((data.summary.byStatus.completed / filteredEvents.length) * 100) : 0,
      averageDaysToComplete: calculateAverageDaysToComplete(filteredEvents)
    };

    // Financial data (if available)
    data.financialData = {
      totalBudget: filteredEvents.reduce((sum, e) => sum + (e.budget || 0), 0),
      totalSpent: filteredEvents.reduce((sum, e) => sum + (e.spent || 0), 0),
      averageCostPerGuest: data.summary.totalGuests > 0 ?
        Math.round(filteredEvents.reduce((sum, e) => sum + (e.spent || 0), 0) / data.summary.totalGuests) : 0
    };

    return data;
  };

  const groupEventData = (events, groupBy) => {
    const grouped = {};

    events.forEach(event => {
      let key;
      switch (groupBy) {
        case 'status':
          key = event.event_status || 'unknown';
          break;
        case 'date':
          key = new Date(event.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
          break;
        case 'location':
          key = event.venue_name || event.location || 'Unknown Location';
          break;
        case 'client':
          key = event.client_name || 'Unknown Client';
          break;
        case 'size':
          const guests = event.total_guests || 0;
          if (guests <= 50) key = 'Small (≤50)';
          else if (guests <= 200) key = 'Medium (51-200)';
          else if (guests <= 500) key = 'Large (201-500)';
          else key = 'Extra Large (500+)';
          break;
        default:
          key = 'Other';
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(event);
    });

    return grouped;
  };

  const calculateAverageDaysToComplete = (events) => {
    const completedEvents = events.filter(e => e.event_status === 'completed');
    if (completedEvents.length === 0) return 0;

    const totalDays = completedEvents.reduce((sum, event) => {
      const createdDate = new Date(event.created_at);
      const completedDate = new Date(event.event_date);
      const days = Math.ceil((completedDate - createdDate) / (1000 * 60 * 60 * 24));
      return sum + (days > 0 ? days : 0);
    }, 0);

    return Math.round(totalDays / completedEvents.length);
  };

  const exportReport = (format = 'csv') => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (format === 'csv') {
      const csvData = [
        ['Event Name', 'Status', 'Date', 'Location', 'Total Guests', 'Confirmed', 'Pending', 'Declined', 'RSVP Rate']
      ];

      reportData.events.forEach(event => {
        const rsvpRate = event.total_guests > 0 ? 
          Math.round((event.confirmed_guests / event.total_guests) * 100) : 0;
        
        csvData.push([
          event.event_name || '',
          event.event_status || '',
          event.event_date || '',
          event.venue_name || event.location || '',
          event.total_guests || 0,
          event.confirmed_guests || 0,
          event.pending_guests || 0,
          event.declined_guests || 0,
          `${rsvpRate}%`
        ]);
      });

      const csvContent = csvData.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event_status_report_${timestamp}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (format === 'json') {
      const exportData = {
        generatedAt: new Date().toISOString(),
        reportType,
        filters: {
          status: filterStatus,
          dateRange: filterDateRange,
          searchTerm,
          selectedEvents
        },
        data: reportData
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event_status_report_${timestamp}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const printReport = () => {
    window.print();
  };

  const toggleEventDetails = (eventId) => {
    setShowDetails(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const getStatusBadgeClass = (status) => {
    const statusInfo = eventStatuses.find(s => s.value === status);
    return statusInfo ? `bg-${statusInfo.color}` : 'bg-secondary';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterDateRange('all');
    setSelectedEvents([]);
    setCustomDateRange({ startDate: '', endDate: '' });
  };

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading event status reports...</p>
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
              <FaCalendarAlt className="me-2 text-primary" />
              Event Status Reports
            </h2>
            <p className="text-muted mb-0">Comprehensive analysis of event statuses and performance</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={() => fetchData()}
            >
              <FaRefresh className="me-2" />
              Refresh
            </button>
            <div className="dropdown">
              <button 
                className="btn btn-outline-primary glass-btn dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
              >
                <FaFileExport className="me-2" />
                Export
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button className="dropdown-item" onClick={() => exportReport('csv')}>
                    Export as CSV
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" onClick={() => exportReport('json')}>
                    Export as JSON
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item" onClick={printReport}>
                    <FaPrint className="me-2" />
                    Print Report
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Filters and Report Configuration */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label fw-semibold">Report Type</label>
                <select
                  className="form-select glass-input"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  {reportTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Group By</label>
                <select
                  className="form-select glass-input"
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                >
                  {groupByOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
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
              <div className="col-md-3">
                <label className="form-label fw-semibold">Event Status</label>
                <select
                  className="form-select glass-input"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {eventStatuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              {filterDateRange === 'custom' && (
                <>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Start Date</label>
                    <input
                      type="date"
                      className="form-control glass-input"
                      value={customDateRange.startDate}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">End Date</label>
                    <input
                      type="date"
                      className="form-control glass-input"
                      value={customDateRange.endDate}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <div className="col-md-4">
                <label className="form-label fw-semibold">Search Events</label>
                <div className="input-group">
                  <span className="input-group-text glass-input">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button 
                  className="btn btn-outline-secondary glass-btn w-100"
                  onClick={clearFilters}
                >
                  <FaTimes className="me-2" />
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="row g-4 mb-4">
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaCalendarAlt className="text-primary mb-2" size={24} />
                <h4 className="text-primary mb-1">{reportData.totalEvents || 0}</h4>
                <small className="text-muted">Total Events</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaUsers className="text-info mb-2" size={24} />
                <h4 className="text-info mb-1">{reportData.summary?.totalGuests || 0}</h4>
                <small className="text-muted">Total Guests</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaCheckCircle className="text-success mb-2" size={24} />
                <h4 className="text-success mb-1">{reportData.summary?.rsvpStats?.confirmed || 0}</h4>
                <small className="text-muted">Confirmed</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaClock className="text-warning mb-2" size={24} />
                <h4 className="text-warning mb-1">{reportData.summary?.rsvpStats?.pending || 0}</h4>
                <small className="text-muted">Pending</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaPercentage className="text-primary mb-2" size={24} />
                <h4 className="text-primary mb-1">{reportData.performanceMetrics?.rsvpRate || 0}%</h4>
                <small className="text-muted">RSVP Rate</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaCheckCircle className="text-success mb-2" size={24} />
                <h4 className="text-success mb-1">{reportData.performanceMetrics?.completionRate || 0}%</h4>
                <small className="text-muted">Completion Rate</small>
              </div>
            </div>
          </div>
        </div>

        {/* Report Content Based on Type */}
        {reportType === 'summary' && (
          <div className="card glass-card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <FaChartBar className="me-2" />
                Events by {groupByOptions.find(g => g.value === groupBy)?.label}
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {Object.entries(reportData.groupedData || {}).map(([group, events]) => (
                  <div key={group} className="col-md-4 mb-3">
                    <div className="card glass-effect">
                      <div className="card-body">
                        <h6 className="card-title">{group}</h6>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="h4 text-primary">{events.length}</span>
                          <span className="text-muted">Events</span>
                        </div>
                        <div className="mt-2">
                          <small className="text-muted">
                            {events.reduce((sum, e) => sum + (e.total_guests || 0), 0)} total guests
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Events Table */}
        <div className="card glass-card">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <FaChartLine className="me-2" />
              Detailed Event Report
            </h5>
          </div>
          <div className="card-body">
            {reportData.events?.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Location</th>
                      <th>Guests</th>
                      <th>RSVP Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.events.map((event) => (
                      <React.Fragment key={event.event_id}>
                        <tr>
                          <td>
                            <div className="fw-semibold">{event.event_name}</div>
                            {event.event_description && (
                              <small className="text-muted">{event.event_description.substring(0, 50)}...</small>
                            )}
                          </td>
                          <td>
                            <span className={`badge glass-badge ${getStatusBadgeClass(event.event_status)}`}>
                              {event.event_status}
                            </span>
                          </td>
                          <td>
                            <div className="fw-semibold">
                              {new Date(event.event_date).toLocaleDateString()}
                            </div>
                            <small className="text-muted">
                              {new Date(event.event_date).toLocaleTimeString()}
                            </small>
                          </td>
                          <td>
                            <div className="fw-semibold">{event.venue_name || 'TBD'}</div>
                            {event.location && (
                              <small className="text-muted">{event.location}</small>
                            )}
                          </td>
                          <td>
                            <div className="fw-semibold">{event.total_guests || 0}</div>
                            <small className="text-muted">Total</small>
                          </td>
                          <td>
                            <div className="d-flex flex-column">
                              <small className="text-success">✓ {event.confirmed_guests || 0}</small>
                              <small className="text-warning">⏳ {event.pending_guests || 0}</small>
                              <small className="text-danger">✗ {event.declined_guests || 0}</small>
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-info glass-btn"
                              onClick={() => toggleEventDetails(event.event_id)}
                            >
                              <FaEye />
                            </button>
                          </td>
                        </tr>
                        {showDetails[event.event_id] && (
                          <tr>
                            <td colSpan="7">
                              <div className="card glass-effect ms-3">
                                <div className="card-body">
                                  <div className="row g-3">
                                    <div className="col-md-6">
                                      <h6>Event Details</h6>
                                      <p><strong>Description:</strong> {event.event_description || 'N/A'}</p>
                                      <p><strong>Client:</strong> {event.client_name || 'N/A'}</p>
                                      <p><strong>Budget:</strong> ${event.budget || 0}</p>
                                    </div>
                                    <div className="col-md-6">
                                      <h6>Performance Metrics</h6>
                                      <p><strong>RSVP Rate:</strong> {
                                        event.total_guests > 0 ? 
                                        Math.round((event.confirmed_guests / event.total_guests) * 100) : 0
                                      }%</p>
                                      <p><strong>Response Rate:</strong> {
                                        event.total_guests > 0 ? 
                                        Math.round(((event.confirmed_guests + event.declined_guests) / event.total_guests) * 100) : 0
                                      }%</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <FaCalendarAlt className="text-muted mb-3" size={48} />
                <h5 className="text-muted">No events found</h5>
                <p className="text-muted">No events match your current filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventStatusReports;