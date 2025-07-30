import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FaMapMarkerAlt,
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaPlane,
  FaBed,
  FaCar,
  FaRoute,
  FaCalendarAlt,
  FaUsers,
  FaDollarSign,
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
  FaTimes,
  FaFileExport,
  FaPrint,
  FaExpand,
  FaCompress,
  FaUserFriends,
  FaPercentage,
  FaTrendUp,
  FaTrendDown,
  FaInfoCircle,
  FaBuilding,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';

const LogisticsReports = () => {
  const [logisticsData, setLogisticsData] = useState([]);
  const [events, setEvents] = useState([]);
  const [guests, setGuests] = useState([]);
  const [reportData, setReportData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [reportType, setReportType] = useState('summary');
  const [groupBy, setGroupBy] = useState('type');
  const [showDetails, setShowDetails] = useState({});
  const [dateRange, setDateRange] = useState('all');

  const logisticsTypes = [
    { value: 'accommodation', label: 'Accommodation', color: 'primary', icon: FaBed },
    { value: 'transportation', label: 'Transportation', color: 'success', icon: FaCar },
    { value: 'travel', label: 'Travel', color: 'info', icon: FaPlane },
    { value: 'parking', label: 'Parking', color: 'warning', icon: FaMapMarkerAlt }
  ];

  const logisticsStatuses = [
    { value: 'booked', label: 'Booked', color: 'success', icon: FaCheckCircle },
    { value: 'pending', label: 'Pending', color: 'warning', icon: FaClock },
    { value: 'confirmed', label: 'Confirmed', color: 'primary', icon: FaCheckCircle },
    { value: 'cancelled', label: 'Cancelled', color: 'danger', icon: FaTimesCircle },
    { value: 'in_progress', label: 'In Progress', color: 'info', icon: FaClock }
  ];

  const reportTypes = [
    { value: 'summary', label: 'Summary Report', icon: FaChartBar },
    { value: 'detailed', label: 'Detailed Analysis', icon: FaChartLine },
    { value: 'cost', label: 'Cost Analysis', icon: FaDollarSign },
    { value: 'utilization', label: 'Utilization Report', icon: FaChartPie }
  ];

  const groupByOptions = [
    { value: 'type', label: 'Logistics Type' },
    { value: 'event', label: 'Event' },
    { value: 'status', label: 'Status' },
    { value: 'date', label: 'Date' },
    { value: 'provider', label: 'Provider' }
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'upcoming', label: 'Upcoming Events' },
    { value: 'current', label: 'Current Events' },
    { value: 'past', label: 'Past Events' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    generateReport();
  }, [logisticsData, events, guests, filterEvent, filterType, filterStatus, reportType, groupBy, dateRange]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [logisticsRes, eventsRes, guestsRes] = await Promise.all([
        fetch('/api/logistics', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/events', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/guests', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const logisticsData = logisticsRes.ok ? await logisticsRes.json() : [];
      const eventsData = eventsRes.ok ? await eventsRes.json() : [];
      const guestsData = guestsRes.ok ? await guestsRes.json() : [];

      setLogisticsData(logisticsData);
      setEvents(eventsData);
      setGuests(guestsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load logistics data');
      setLogisticsData([]);
      setEvents([]);
      setGuests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = () => {
    let filteredData = logisticsData;

    // Apply filters
    if (searchTerm) {
      filteredData = filteredData.filter(item =>
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.provider_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterEvent) {
      filteredData = filteredData.filter(item => item.event_id?.toString() === filterEvent);
    }

    if (filterType) {
      filteredData = filteredData.filter(item => item.logistics_type === filterType);
    }

    if (filterStatus) {
      filteredData = filteredData.filter(item => item.status === filterStatus);
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      filteredData = applyDateRangeFilter(filteredData);
    }

    // Generate report data
    const reportData = generateReportData(filteredData);
    setReportData(reportData);
  };

  const applyDateRangeFilter = (data) => {
    const now = new Date();
    
    return data.filter(item => {
      const event = events.find(e => e.event_id === item.event_id);
      if (!event || !event.event_date) return false;
      
      const eventDate = new Date(event.event_date);
      
      switch (dateRange) {
        case 'upcoming':
          return eventDate > now;
        case 'current':
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          return eventDate >= now && eventDate <= weekFromNow;
        case 'past':
          return eventDate < now;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          return eventDate >= monthStart && eventDate < monthEnd;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
          const quarterEnd = new Date(now.getFullYear(), quarter * 3 + 3, 1);
          return eventDate >= quarterStart && eventDate < quarterEnd;
        default:
          return true;
      }
    });
  };

  const generateReportData = (filteredData) => {
    const data = {
      totalItems: filteredData.length,
      items: filteredData,
      summary: {},
      groupedData: {},
      costAnalysis: {},
      utilizationData: {}
    };

    // Summary statistics
    data.summary = {
      byType: logisticsTypes.reduce((acc, type) => {
        acc[type.value] = filteredData.filter(item => item.logistics_type === type.value).length;
        return acc;
      }, {}),
      byStatus: logisticsStatuses.reduce((acc, status) => {
        acc[status.value] = filteredData.filter(item => item.status === status.value).length;
        return acc;
      }, {}),
      totalCost: filteredData.reduce((sum, item) => sum + (item.cost || 0), 0),
      averageCost: filteredData.length > 0 ? 
        Math.round(filteredData.reduce((sum, item) => sum + (item.cost || 0), 0) / filteredData.length) : 0,
      completionRate: filteredData.length > 0 ?
        Math.round((filteredData.filter(item => item.status === 'confirmed' || item.status === 'booked').length / filteredData.length) * 100) : 0
    };

    // Group data based on groupBy option
    data.groupedData = groupLogisticsData(filteredData, groupBy);

    // Cost analysis
    data.costAnalysis = generateCostAnalysis(filteredData);

    // Utilization data
    data.utilizationData = generateUtilizationData(filteredData);

    return data;
  };

  const groupLogisticsData = (data, groupBy) => {
    const grouped = {};

    data.forEach(item => {
      let key;
      switch (groupBy) {
        case 'type':
          key = item.logistics_type || 'unknown';
          break;
        case 'event':
          const event = events.find(e => e.event_id === item.event_id);
          key = event?.event_name || 'Unknown Event';
          break;
        case 'status':
          key = item.status || 'unknown';
          break;
        case 'date':
          const event2 = events.find(e => e.event_id === item.event_id);
          key = event2?.event_date ? 
            new Date(event2.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) :
            'No Date';
          break;
        case 'provider':
          key = item.provider_name || 'Unknown Provider';
          break;
        default:
          key = 'Other';
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    return grouped;
  };

  const generateCostAnalysis = (data) => {
    const analysis = {
      totalCost: data.reduce((sum, item) => sum + (item.cost || 0), 0),
      costByType: {},
      costByEvent: {},
      averageCostPerGuest: 0
    };

    // Cost by type
    logisticsTypes.forEach(type => {
      const typeItems = data.filter(item => item.logistics_type === type.value);
      analysis.costByType[type.value] = typeItems.reduce((sum, item) => sum + (item.cost || 0), 0);
    });

    // Cost by event
    events.forEach(event => {
      const eventItems = data.filter(item => item.event_id === event.event_id);
      analysis.costByEvent[event.event_name] = eventItems.reduce((sum, item) => sum + (item.cost || 0), 0);
    });

    // Average cost per guest
    const totalGuests = guests.length;
    analysis.averageCostPerGuest = totalGuests > 0 ? Math.round(analysis.totalCost / totalGuests) : 0;

    return analysis;
  };

  const generateUtilizationData = (data) => {
    const utilization = {
      accommodationUtilization: 0,
      transportationUtilization: 0,
      capacityAnalysis: {},
      efficiency: {}
    };

    // Calculate utilization rates
    const accommodations = data.filter(item => item.logistics_type === 'accommodation');
    const transportations = data.filter(item => item.logistics_type === 'transportation');

    utilization.accommodationUtilization = accommodations.length > 0 ?
      Math.round((accommodations.filter(item => item.status === 'booked').length / accommodations.length) * 100) : 0;

    utilization.transportationUtilization = transportations.length > 0 ?
      Math.round((transportations.filter(item => item.status === 'booked').length / transportations.length) * 100) : 0;

    return utilization;
  };

  const exportReport = (format = 'csv') => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (format === 'csv') {
      const csvData = [
        ['Type', 'Description', 'Event', 'Status', 'Provider', 'Cost', 'Capacity', 'Location', 'Date']
      ];

      reportData.items.forEach(item => {
        const event = events.find(e => e.event_id === item.event_id);
        csvData.push([
          item.logistics_type || '',
          item.description || '',
          event?.event_name || '',
          item.status || '',
          item.provider_name || '',
          item.cost || 0,
          item.capacity || 0,
          item.location || '',
          event?.event_date ? new Date(event.event_date).toLocaleDateString() : ''
        ]);
      });

      const csvContent = csvData.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logistics_report_${timestamp}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (format === 'json') {
      const exportData = {
        generatedAt: new Date().toISOString(),
        reportType,
        filters: {
          event: filterEvent,
          type: filterType,
          status: filterStatus,
          dateRange,
          searchTerm
        },
        data: reportData
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logistics_report_${timestamp}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const toggleItemDetails = (itemId) => {
    setShowDetails(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const getStatusBadgeClass = (status) => {
    const statusInfo = logisticsStatuses.find(s => s.value === status);
    return statusInfo ? `bg-${statusInfo.color}` : 'bg-secondary';
  };

  const getTypeBadgeClass = (type) => {
    const typeInfo = logisticsTypes.find(t => t.value === type);
    return typeInfo ? `bg-${typeInfo.color}` : 'bg-secondary';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterEvent('');
    setFilterType('');
    setFilterStatus('');
    setDateRange('all');
  };

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading logistics reports...</p>
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
              <FaMapMarkerAlt className="me-2 text-primary" />
              Logistics Requirements Reports
            </h2>
            <p className="text-muted mb-0">Comprehensive analysis of accommodation, transportation, and travel logistics</p>
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
                <label className="form-label fw-semibold">Logistics Type</label>
                <select
                  className="form-select glass-input"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">All Types</option>
                  {logisticsTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Status</label>
                <select
                  className="form-select glass-input"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {logisticsStatuses.map(status => (
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
                <label className="form-label fw-semibold">Search</label>
                <div className="input-group">
                  <span className="input-group-text glass-input">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder="Search logistics..."
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
                <FaMapMarkerAlt className="text-primary mb-2" size={24} />
                <h4 className="text-primary mb-1">{reportData.totalItems || 0}</h4>
                <small className="text-muted">Total Items</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaBed className="text-info mb-2" size={24} />
                <h4 className="text-info mb-1">{reportData.summary?.byType?.accommodation || 0}</h4>
                <small className="text-muted">Accommodations</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaCar className="text-success mb-2" size={24} />
                <h4 className="text-success mb-1">{reportData.summary?.byType?.transportation || 0}</h4>
                <small className="text-muted">Transportation</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaDollarSign className="text-warning mb-2" size={24} />
                <h4 className="text-warning mb-1">${(reportData.summary?.totalCost || 0).toLocaleString()}</h4>
                <small className="text-muted">Total Cost</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaCheckCircle className="text-success mb-2" size={24} />
                <h4 className="text-success mb-1">{reportData.summary?.completionRate || 0}%</h4>
                <small className="text-muted">Completion Rate</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaPercentage className="text-primary mb-2" size={24} />
                <h4 className="text-primary mb-1">${reportData.summary?.averageCost || 0}</h4>
                <small className="text-muted">Avg Cost</small>
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
                Logistics by {groupByOptions.find(g => g.value === groupBy)?.label}
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {Object.entries(reportData.groupedData || {}).map(([group, items]) => (
                  <div key={group} className="col-md-4 mb-3">
                    <div className="card glass-effect">
                      <div className="card-body">
                        <h6 className="card-title">{group}</h6>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="h4 text-primary">{items.length}</span>
                          <span className="text-muted">Items</span>
                        </div>
                        <div className="mt-2">
                          <div className="d-flex justify-content-between">
                            <span className="small text-success">
                              Confirmed: {items.filter(i => i.status === 'confirmed' || i.status === 'booked').length}
                            </span>
                            <span className="small text-warning">
                              Pending: {items.filter(i => i.status === 'pending').length}
                            </span>
                          </div>
                          <div className="mt-1">
                            <span className="small text-muted">
                              Total Cost: ${items.reduce((sum, i) => sum + (i.cost || 0), 0).toLocaleString()}
                            </span>
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

        {reportType === 'cost' && (
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <div className="card glass-card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <FaDollarSign className="me-2" />
                    Cost by Type
                  </h5>
                </div>
                <div className="card-body">
                  {Object.entries(reportData.costAnalysis?.costByType || {}).map(([type, cost]) => {
                    const typeInfo = logisticsTypes.find(t => t.value === type);
                    const Icon = typeInfo?.icon || FaInfoCircle;
                    return (
                      <div key={type} className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center">
                          <Icon className={`me-2 text-${typeInfo?.color || 'secondary'}`} />
                          <span>{typeInfo?.label || type}</span>
                        </div>
                        <span className="fw-bold">${cost.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card glass-card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <FaChartPie className="me-2" />
                    Utilization Rates
                  </h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <span>Accommodation Utilization</span>
                      <span className="fw-bold">{reportData.utilizationData?.accommodationUtilization || 0}%</span>
                    </div>
                    <div className="progress mt-1">
                      <div 
                        className="progress-bar bg-info" 
                        style={{ width: `${reportData.utilizationData?.accommodationUtilization || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <span>Transportation Utilization</span>
                      <span className="fw-bold">{reportData.utilizationData?.transportationUtilization || 0}%</span>
                    </div>
                    <div className="progress mt-1">
                      <div 
                        className="progress-bar bg-success" 
                        style={{ width: `${reportData.utilizationData?.transportationUtilization || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Logistics Table */}
        <div className="card glass-card">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <FaChartLine className="me-2" />
              Detailed Logistics Report
            </h5>
          </div>
          <div className="card-body">
            {reportData.items?.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Event</th>
                      <th>Status</th>
                      <th>Provider</th>
                      <th>Cost</th>
                      <th>Capacity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.items.map((item) => {
                      const event = events.find(e => e.event_id === item.event_id);
                      const typeInfo = logisticsTypes.find(t => t.value === item.logistics_type);
                      const TypeIcon = typeInfo?.icon || FaInfoCircle;
                      
                      return (
                        <React.Fragment key={item.logistics_id}>
                          <tr>
                            <td>
                              <span className={`badge glass-badge ${getTypeBadgeClass(item.logistics_type)}`}>
                                <TypeIcon className="me-1" />
                                {typeInfo?.label || item.logistics_type}
                              </span>
                            </td>
                            <td>
                              <div className="fw-semibold">{item.description}</div>
                              {item.location && (
                                <small className="text-muted">
                                  <FaMapMarkerAlt className="me-1" />
                                  {item.location}
                                </small>
                              )}
                            </td>
                            <td>
                              <div className="fw-semibold">{event?.event_name || 'N/A'}</div>
                              {event?.event_date && (
                                <small className="text-muted">
                                  {new Date(event.event_date).toLocaleDateString()}
                                </small>
                              )}
                            </td>
                            <td>
                              <span className={`badge glass-badge ${getStatusBadgeClass(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                            <td>
                              <div className="fw-semibold">{item.provider_name || 'N/A'}</div>
                              {item.provider_contact && (
                                <small className="text-muted">{item.provider_contact}</small>
                              )}
                            </td>
                            <td>
                              <div className="fw-semibold">${(item.cost || 0).toLocaleString()}</div>
                            </td>
                            <td>
                              <div className="fw-semibold">{item.capacity || 'N/A'}</div>
                              {item.capacity && item.allocated && (
                                <small className="text-muted">
                                  {item.allocated} allocated
                                </small>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-info glass-btn"
                                onClick={() => toggleItemDetails(item.logistics_id)}
                              >
                                <FaEye />
                              </button>
                            </td>
                          </tr>
                          {showDetails[item.logistics_id] && (
                            <tr>
                              <td colSpan="8">
                                <div className="card glass-effect ms-3">
                                  <div className="card-body">
                                    <div className="row g-3">
                                      <div className="col-md-6">
                                        <h6>Details</h6>
                                        <p><strong>Booking Reference:</strong> {item.booking_reference || 'N/A'}</p>
                                        <p><strong>Check-in:</strong> {item.check_in_date ? new Date(item.check_in_date).toLocaleDateString() : 'N/A'}</p>
                                        <p><strong>Check-out:</strong> {item.check_out_date ? new Date(item.check_out_date).toLocaleDateString() : 'N/A'}</p>
                                        <p><strong>Special Requirements:</strong> {item.special_requirements || 'None'}</p>
                                      </div>
                                      <div className="col-md-6">
                                        <h6>Provider Information</h6>
                                        <p><strong>Provider:</strong> {item.provider_name || 'N/A'}</p>
                                        <p><strong>Contact:</strong> {item.provider_contact || 'N/A'}</p>
                                        <p><strong>Address:</strong> {item.provider_address || 'N/A'}</p>
                                        <p><strong>Notes:</strong> {item.notes || 'None'}</p>
                                      </div>
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
            ) : (
              <div className="text-center py-5">
                <FaMapMarkerAlt className="text-muted mb-3" size={48} />
                <h5 className="text-muted">No logistics data found</h5>
                <p className="text-muted">No logistics items match your current filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsReports;