import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FaUsers,
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaUserCheck,
  FaUserTimes,
  FaUserClock,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaDownload,
  FaFilter,
  FaSearch,
  FaRefresh,
  FaEye,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaTimes,
  FaFileExport,
  FaPrint,
  FaExpand,
  FaCompress,
  FaUserFriends,
  FaPercentage,
  FaTrendUp,
  FaTrendDown
} from 'react-icons/fa';

const GuestRSVPReports = () => {
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [reportData, setReportData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRSVPStatus, setFilterRSVPStatus] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterGuestType, setFilterGuestType] = useState('');
  const [reportType, setReportType] = useState('summary');
  const [groupBy, setGroupBy] = useState('rsvp_status');
  const [showDetails, setShowDetails] = useState({});
  const [dateRange, setDateRange] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const rsvpStatuses = [
    { value: 'confirmed', label: 'Confirmed', color: 'success', icon: FaUserCheck },
    { value: 'declined', label: 'Declined', color: 'danger', icon: FaUserTimes },
    { value: 'pending', label: 'Pending', color: 'warning', icon: FaUserClock },
    { value: 'tentative', label: 'Tentative', color: 'info', icon: FaExclamationTriangle }
  ];

  const guestTypes = [
    { value: 'individual', label: 'Individual' },
    { value: 'family', label: 'Family' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'vip', label: 'VIP' },
    { value: 'media', label: 'Media' },
    { value: 'vendor', label: 'Vendor' }
  ];

  const reportTypes = [
    { value: 'summary', label: 'Summary Report', icon: FaChartBar },
    { value: 'detailed', label: 'Detailed Analysis', icon: FaChartLine },
    { value: 'trends', label: 'Trend Analysis', icon: FaChartPie },
    { value: 'demographics', label: 'Demographics', icon: FaUsers }
  ];

  const groupByOptions = [
    { value: 'rsvp_status', label: 'RSVP Status' },
    { value: 'event', label: 'Event' },
    { value: 'guest_type', label: 'Guest Type' },
    { value: 'date_added', label: 'Date Added' },
    { value: 'response_date', label: 'Response Date' }
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'custom', label: 'Custom Range' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    generateReport();
  }, [guests, events, filterRSVPStatus, filterEvent, filterGuestType, reportType, groupBy, dateRange, customDateRange]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [guestsRes, eventsRes] = await Promise.all([
        fetch('/api/guests', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/events', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const guestsData = guestsRes.ok ? await guestsRes.json() : [];
      const eventsData = eventsRes.ok ? await eventsRes.json() : [];

      setGuests(guestsData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load guest and RSVP data');
      setGuests([]);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = () => {
    let filteredGuests = guests;

    // Apply filters
    if (searchTerm) {
      filteredGuests = filteredGuests.filter(guest =>
        guest.guest_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.guest_last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.guest_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.guest_phone?.includes(searchTerm)
      );
    }

    if (filterRSVPStatus) {
      filteredGuests = filteredGuests.filter(guest => guest.guest_rsvp_status === filterRSVPStatus);
    }

    if (filterEvent) {
      filteredGuests = filteredGuests.filter(guest => guest.event_id?.toString() === filterEvent);
    }

    if (filterGuestType) {
      filteredGuests = filteredGuests.filter(guest => guest.guest_type === filterGuestType);
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      filteredGuests = applyDateRangeFilter(filteredGuests);
    }

    // Generate report data
    const reportData = generateReportData(filteredGuests);
    setReportData(reportData);
  };

  const applyDateRangeFilter = (guests) => {
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
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
      case 'custom':
        if (customDateRange.startDate && customDateRange.endDate) {
          startDate = new Date(customDateRange.startDate);
          endDate = new Date(customDateRange.endDate);
        }
        break;
    }

    if (startDate && endDate) {
      return guests.filter(guest => {
        const guestDate = new Date(guest.created_at || guest.rsvp_response_date);
        return guestDate >= startDate && guestDate < endDate;
      });
    }

    return guests;
  };

  const generateReportData = (filteredGuests) => {
    const data = {
      totalGuests: filteredGuests.length,
      guests: filteredGuests,
      summary: {},
      groupedData: {},
      trendData: {},
      demographics: {}
    };

    // Summary statistics
    data.summary = {
      byRSVPStatus: rsvpStatuses.reduce((acc, status) => {
        acc[status.value] = filteredGuests.filter(g => g.guest_rsvp_status === status.value).length;
        return acc;
      }, {}),
      byGuestType: guestTypes.reduce((acc, type) => {
        acc[type.value] = filteredGuests.filter(g => g.guest_type === type.value).length;
        return acc;
      }, {}),
      responseRate: filteredGuests.length > 0 ? 
        Math.round(
          (filteredGuests.filter(g => g.guest_rsvp_status && g.guest_rsvp_status !== 'pending').length / 
           filteredGuests.length) * 100
        ) : 0,
      confirmationRate: filteredGuests.length > 0 ?
        Math.round(
          (filteredGuests.filter(g => g.guest_rsvp_status === 'confirmed').length / 
           filteredGuests.length) * 100
        ) : 0,
      averageResponseTime: calculateAverageResponseTime(filteredGuests)
    };

    // Group data based on groupBy option
    data.groupedData = groupGuestData(filteredGuests, groupBy);

    // Trend analysis
    data.trendData = generateTrendData(filteredGuests);

    // Demographics analysis
    data.demographics = generateDemographics(filteredGuests);

    return data;
  };

  const groupGuestData = (guests, groupBy) => {
    const grouped = {};

    guests.forEach(guest => {
      let key;
      switch (groupBy) {
        case 'rsvp_status':
          key = guest.guest_rsvp_status || 'pending';
          break;
        case 'event':
          key = guest.event_name || 'Unknown Event';
          break;
        case 'guest_type':
          key = guest.guest_type || 'individual';
          break;
        case 'date_added':
          key = new Date(guest.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
          break;
        case 'response_date':
          key = guest.rsvp_response_date ? 
            new Date(guest.rsvp_response_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) :
            'No Response';
          break;
        default:
          key = 'Other';
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(guest);
    });

    return grouped;
  };

  const calculateAverageResponseTime = (guests) => {
    const respondedGuests = guests.filter(g => 
      g.guest_rsvp_status && 
      g.guest_rsvp_status !== 'pending' && 
      g.rsvp_response_date && 
      g.created_at
    );

    if (respondedGuests.length === 0) return 0;

    const totalHours = respondedGuests.reduce((sum, guest) => {
      const addedDate = new Date(guest.created_at);
      const responseDate = new Date(guest.rsvp_response_date);
      const hours = (responseDate - addedDate) / (1000 * 60 * 60);
      return sum + (hours > 0 ? hours : 0);
    }, 0);

    return Math.round(totalHours / respondedGuests.length);
  };

  const generateTrendData = (guests) => {
    // Generate weekly trend data for the last 8 weeks
    const trends = {};
    const now = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
      const weekKey = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const weekGuests = guests.filter(guest => {
        const guestDate = new Date(guest.created_at);
        return guestDate >= weekStart && guestDate < weekEnd;
      });

      trends[weekKey] = {
        total: weekGuests.length,
        confirmed: weekGuests.filter(g => g.guest_rsvp_status === 'confirmed').length,
        declined: weekGuests.filter(g => g.guest_rsvp_status === 'declined').length,
        pending: weekGuests.filter(g => g.guest_rsvp_status === 'pending').length
      };
    }

    return trends;
  };

  const generateDemographics = (guests) => {
    // Analyze guest demographics
    const demographics = {
      totalWithPhone: guests.filter(g => g.guest_phone).length,
      totalWithEmail: guests.filter(g => g.guest_email).length,
      eventDistribution: {},
      responsePatterns: {}
    };

    // Event distribution
    events.forEach(event => {
      const eventGuests = guests.filter(g => g.event_id === event.event_id);
      demographics.eventDistribution[event.event_name] = {
        total: eventGuests.length,
        confirmed: eventGuests.filter(g => g.guest_rsvp_status === 'confirmed').length,
        declined: eventGuests.filter(g => g.guest_rsvp_status === 'declined').length,
        pending: eventGuests.filter(g => g.guest_rsvp_status === 'pending').length
      };
    });

    return demographics;
  };

  const exportReport = (format = 'csv') => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (format === 'csv') {
      const csvData = [
        ['Name', 'Email', 'Phone', 'Event', 'RSVP Status', 'Guest Type', 'Added Date', 'Response Date']
      ];

      reportData.guests.forEach(guest => {
        csvData.push([
          `${guest.guest_first_name || ''} ${guest.guest_last_name || ''}`.trim(),
          guest.guest_email || '',
          guest.guest_phone || '',
          guest.event_name || '',
          guest.guest_rsvp_status || 'pending',
          guest.guest_type || 'individual',
          guest.created_at ? new Date(guest.created_at).toLocaleDateString() : '',
          guest.rsvp_response_date ? new Date(guest.rsvp_response_date).toLocaleDateString() : ''
        ]);
      });

      const csvContent = csvData.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `guest_rsvp_report_${timestamp}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (format === 'json') {
      const exportData = {
        generatedAt: new Date().toISOString(),
        reportType,
        filters: {
          rsvpStatus: filterRSVPStatus,
          event: filterEvent,
          guestType: filterGuestType,
          dateRange,
          searchTerm
        },
        data: reportData
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `guest_rsvp_report_${timestamp}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const toggleGuestDetails = (guestId) => {
    setShowDetails(prev => ({
      ...prev,
      [guestId]: !prev[guestId]
    }));
  };

  const getRSVPStatusBadgeClass = (status) => {
    const statusInfo = rsvpStatuses.find(s => s.value === status);
    return statusInfo ? `bg-${statusInfo.color}` : 'bg-secondary';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterRSVPStatus('');
    setFilterEvent('');
    setFilterGuestType('');
    setDateRange('all');
    setCustomDateRange({ startDate: '', endDate: '' });
  };

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading guest and RSVP reports...</p>
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
              <FaUsers className="me-2 text-primary" />
              Guest & RSVP Reports
            </h2>
            <p className="text-muted mb-0">Comprehensive analysis of guest responses and RSVP patterns</p>
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
                  <button className="dropdown-item" onClick={() => window.print()}>
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
                <label className="form-label fw-semibold">RSVP Status</label>
                <select
                  className="form-select glass-input"
                  value={filterRSVPStatus}
                  onChange={(e) => setFilterRSVPStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {rsvpStatuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Event</label>
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

              <div className="col-md-3">
                <label className="form-label fw-semibold">Guest Type</label>
                <select
                  className="form-select glass-input"
                  value={filterGuestType}
                  onChange={(e) => setFilterGuestType(e.target.value)}
                >
                  <option value="">All Types</option>
                  {guestTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Date Range</label>
                <select
                  className="form-select glass-input"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  {dateRanges.map(range => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Search Guests</label>
                <div className="input-group">
                  <span className="input-group-text glass-input">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder="Search guests..."
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

              {dateRange === 'custom' && (
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
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="row g-4 mb-4">
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaUsers className="text-primary mb-2" size={24} />
                <h4 className="text-primary mb-1">{reportData.totalGuests || 0}</h4>
                <small className="text-muted">Total Guests</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaUserCheck className="text-success mb-2" size={24} />
                <h4 className="text-success mb-1">{reportData.summary?.byRSVPStatus?.confirmed || 0}</h4>
                <small className="text-muted">Confirmed</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaUserTimes className="text-danger mb-2" size={24} />
                <h4 className="text-danger mb-1">{reportData.summary?.byRSVPStatus?.declined || 0}</h4>
                <small className="text-muted">Declined</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaUserClock className="text-warning mb-2" size={24} />
                <h4 className="text-warning mb-1">{reportData.summary?.byRSVPStatus?.pending || 0}</h4>
                <small className="text-muted">Pending</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaPercentage className="text-info mb-2" size={24} />
                <h4 className="text-info mb-1">{reportData.summary?.responseRate || 0}%</h4>
                <small className="text-muted">Response Rate</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaClock className="text-secondary mb-2" size={24} />
                <h4 className="text-secondary mb-1">{reportData.summary?.averageResponseTime || 0}h</h4>
                <small className="text-muted">Avg Response Time</small>
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
                Guests by {groupByOptions.find(g => g.value === groupBy)?.label}
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {Object.entries(reportData.groupedData || {}).map(([group, guests]) => (
                  <div key={group} className="col-md-4 mb-3">
                    <div className="card glass-effect">
                      <div className="card-body">
                        <h6 className="card-title">{group}</h6>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="h4 text-primary">{guests.length}</span>
                          <span className="text-muted">Guests</span>
                        </div>
                        <div className="mt-2">
                          <div className="d-flex justify-content-between">
                            <span className="small text-success">Confirmed: {guests.filter(g => g.guest_rsvp_status === 'confirmed').length}</span>
                            <span className="small text-danger">Declined: {guests.filter(g => g.guest_rsvp_status === 'declined').length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {reportType === 'trends' && (
          <div className="card glass-card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <FaChartLine className="me-2" />
                RSVP Trends (Last 8 Weeks)
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Week</th>
                      <th>Total</th>
                      <th>Confirmed</th>
                      <th>Declined</th>
                      <th>Pending</th>
                      <th>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(reportData.trendData || {}).map(([week, data], index, array) => {
                      const prevWeek = index > 0 ? array[index - 1][1] : data;
                      const trend = data.total > prevWeek.total ? 'up' : data.total < prevWeek.total ? 'down' : 'same';
                      
                      return (
                        <tr key={week}>
                          <td>{week}</td>
                          <td>{data.total}</td>
                          <td className="text-success">{data.confirmed}</td>
                          <td className="text-danger">{data.declined}</td>
                          <td className="text-warning">{data.pending}</td>
                          <td>
                            {trend === 'up' && <FaTrendUp className="text-success" />}
                            {trend === 'down' && <FaTrendDown className="text-danger" />}
                            {trend === 'same' && <FaTimes className="text-muted" />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Guest Table */}
        <div className="card glass-card">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <FaChartLine className="me-2" />
              Detailed Guest Report
            </h5>
          </div>
          <div className="card-body">
            {reportData.guests?.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Guest Name</th>
                      <th>Contact</th>
                      <th>Event</th>
                      <th>RSVP Status</th>
                      <th>Guest Type</th>
                      <th>Response Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.guests.map((guest) => (
                      <React.Fragment key={guest.guest_id}>
                        <tr>
                          <td>
                            <div className="fw-semibold">
                              {guest.guest_first_name} {guest.guest_last_name}
                            </div>
                            <small className="text-muted">ID: {guest.guest_id}</small>
                          </td>
                          <td>
                            <div>
                              {guest.guest_email && (
                                <div className="small">
                                  <FaEnvelope className="me-1" />
                                  {guest.guest_email}
                                </div>
                              )}
                              {guest.guest_phone && (
                                <div className="small">
                                  <FaPhone className="me-1" />
                                  {guest.guest_phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="fw-semibold">{guest.event_name || 'N/A'}</div>
                            <small className="text-muted">
                              {guest.event_date && new Date(guest.event_date).toLocaleDateString()}
                            </small>
                          </td>
                          <td>
                            <span className={`badge glass-badge ${getRSVPStatusBadgeClass(guest.guest_rsvp_status)}`}>
                              {guest.guest_rsvp_status || 'pending'}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-secondary glass-badge">
                              {guest.guest_type || 'individual'}
                            </span>
                          </td>
                          <td>
                            {guest.rsvp_response_date ? (
                              <div>
                                <div className="fw-semibold">
                                  {new Date(guest.rsvp_response_date).toLocaleDateString()}
                                </div>
                                <small className="text-muted">
                                  {new Date(guest.rsvp_response_date).toLocaleTimeString()}
                                </small>
                              </div>
                            ) : (
                              <span className="text-muted">No response</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-info glass-btn"
                              onClick={() => toggleGuestDetails(guest.guest_id)}
                            >
                              <FaEye />
                            </button>
                          </td>
                        </tr>
                        {showDetails[guest.guest_id] && (
                          <tr>
                            <td colSpan="7">
                              <div className="card glass-effect ms-3">
                                <div className="card-body">
                                  <div className="row g-3">
                                    <div className="col-md-6">
                                      <h6>Guest Details</h6>
                                      <p><strong>Added Date:</strong> {guest.created_at ? new Date(guest.created_at).toLocaleDateString() : 'N/A'}</p>
                                      <p><strong>Address:</strong> {guest.guest_address || 'N/A'}</p>
                                      <p><strong>Dietary Requirements:</strong> {guest.dietary_requirements || 'None'}</p>
                                    </div>
                                    <div className="col-md-6">
                                      <h6>RSVP Information</h6>
                                      <p><strong>Plus One:</strong> {guest.plus_one ? 'Yes' : 'No'}</p>
                                      <p><strong>Special Requests:</strong> {guest.special_requests || 'None'}</p>
                                      <p><strong>Response Method:</strong> {guest.response_method || 'N/A'}</p>
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
                <FaUsers className="text-muted mb-3" size={48} />
                <h5 className="text-muted">No guests found</h5>
                <p className="text-muted">No guests match your current filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestRSVPReports;