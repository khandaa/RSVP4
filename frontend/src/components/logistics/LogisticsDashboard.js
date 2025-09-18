import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { 
  FaPlane,
  FaTrain,
  FaCar,
  FaBus,
  FaShip,
  FaHotel,
  FaCalendarAlt,
  FaClock,
  FaChartBar,
  FaFileExport,
  FaSearch,
  // FaRefresh,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowRight,
  FaArrowDown,
  FaArrowUp,
  FaRoute,
  FaBed
} from 'react-icons/fa';

const LogisticsDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    travelArrivals: [],
    travelDepartures: [],
    accommodationCheckins: [],
    accommodationCheckouts: [],
    vehicleAllocations: [],
    upcomingSchedule: []
  });
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [activeView, setActiveView] = useState('overview');
  const [timeFilter, setTimeFilter] = useState('today');

  const fetchEvents = useCallback(async () => {
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
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get date range based on filter
      const dateRange = getDateRange();
      
      const [
        travelRes,
        accommodationRes,
        vehicleRes
      ] = await Promise.all([
        fetch(`/api/comprehensive-crud/guest-travel?start_date=${dateRange.start}&end_date=${dateRange.end}${selectedEvent ? `&event_id=${selectedEvent}` : ''}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`/api/comprehensive-crud/guest-accommodation?start_date=${dateRange.start}&end_date=${dateRange.end}${selectedEvent ? `&event_id=${selectedEvent}` : ''}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`/api/comprehensive-crud/guest-vehicle-allocation?start_date=${dateRange.start}&end_date=${dateRange.end}${selectedEvent ? `&event_id=${selectedEvent}` : ''}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const travelData = travelRes.ok ? await travelRes.json() : [];
      const accommodationData = accommodationRes.ok ? await accommodationRes.json() : [];
      const vehicleData = vehicleRes.ok ? await vehicleRes.json() : [];

      // Process data for dashboard
      const processedData = {
        travelArrivals: travelData.filter(t => t.arrival_datetime),
        travelDepartures: travelData.filter(t => t.departure_datetime),
        accommodationCheckins: accommodationData.filter(a => a.check_in_date),
        accommodationCheckouts: accommodationData.filter(a => a.check_out_date),
        vehicleAllocations: vehicleData.filter(v => v.pickup_datetime),
        upcomingSchedule: generateUpcomingSchedule(travelData, accommodationData, vehicleData)
      };

      setDashboardData(processedData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load logistics dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedEvent, timeFilter, generateUpcomingSchedule, getDateRange]);

  // Ensure callbacks are defined before using them
  useEffect(() => {
    fetchDashboardData();
    fetchEvents();
  }, [fetchDashboardData, fetchEvents]);

  const getDateRange = () => {
    const today = new Date();
    let start, end;

    switch (timeFilter) {
      case 'today':
        start = end = today.toISOString().split('T')[0];
        break;
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        start = end = tomorrow.toISOString().split('T')[0];
        break;
      case 'week':
        start = today.toISOString().split('T')[0];
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        end = weekEnd.toISOString().split('T')[0];
        break;
      case 'month':
        start = today.toISOString().split('T')[0];
        const monthEnd = new Date(today);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        end = monthEnd.toISOString().split('T')[0];
        break;
      case 'custom':
        start = end = selectedDate;
        break;
      default:
        start = end = today.toISOString().split('T')[0];
    }

    return { start, end };
  };

  const generateUpcomingSchedule = (travel, accommodation, vehicle) => {
    const schedule = [];
    
    // Add travel arrivals
    travel.filter(t => t.arrival_datetime).forEach(item => {
      schedule.push({
        type: 'arrival',
        time: item.arrival_datetime,
        guest: `${item.guest_first_name} ${item.guest_last_name}`,
        event: item.event_name,
        details: `${item.travel_mode} ${item.flight_train_number || ''} arriving at ${item.arrival_location}`,
        icon: getTravelIcon(item.travel_mode),
        status: item.travel_status,
        priority: getPriorityLevel(item.arrival_datetime)
      });
    });

    // Add travel departures
    travel.filter(t => t.departure_datetime).forEach(item => {
      schedule.push({
        type: 'departure',
        time: item.departure_datetime,
        guest: `${item.guest_first_name} ${item.guest_last_name}`,
        event: item.event_name,
        details: `${item.travel_mode} ${item.flight_train_number || ''} departing from ${item.departure_location}`,
        icon: getTravelIcon(item.travel_mode),
        status: item.travel_status,
        priority: getPriorityLevel(item.departure_datetime)
      });
    });

    // Add accommodation check-ins
    accommodation.filter(a => a.check_in_date).forEach(item => {
      schedule.push({
        type: 'checkin',
        time: item.check_in_date,
        guest: `${item.guest_first_name} ${item.guest_last_name}`,
        event: item.event_name,
        details: `Check-in to ${item.hotel_name} - Room ${item.room_number}`,
        icon: FaHotel,
        status: item.assignment_status,
        priority: getPriorityLevel(item.check_in_date)
      });
    });

    // Add accommodation check-outs
    accommodation.filter(a => a.check_out_date).forEach(item => {
      schedule.push({
        type: 'checkout',
        time: item.check_out_date,
        guest: `${item.guest_first_name} ${item.guest_last_name}`,
        event: item.event_name,
        details: `Check-out from ${item.hotel_name} - Room ${item.room_number}`,
        icon: FaHotel,
        status: item.assignment_status,
        priority: getPriorityLevel(item.check_out_date)
      });
    });

    // Add vehicle pickups
    vehicle.filter(v => v.pickup_datetime).forEach(item => {
      schedule.push({
        type: 'pickup',
        time: item.pickup_datetime,
        guest: `${item.guest_first_name} ${item.guest_last_name}`,
        event: item.event_name,
        details: `Pickup by ${item.vehicle_type} ${item.vehicle_model} from ${item.pickup_location}`,
        icon: FaCar,
        status: item.allocation_status,
        priority: getPriorityLevel(item.pickup_datetime)
      });
    });

    // Sort by time and return
    return schedule.sort((a, b) => new Date(a.time) - new Date(b.time));
  };

  const getTravelIcon = (mode) => {
    switch (mode) {
      case 'Flight': return FaPlane;
      case 'Train': return FaTrain;
      case 'Car': return FaCar;
      case 'Bus': return FaBus;
      case 'Ship': return FaShip;
      default: return FaCar;
    }
  };

  const getPriorityLevel = (datetime) => {
    const now = new Date();
    const itemTime = new Date(datetime);
    const diffHours = (itemTime - now) / (1000 * 60 * 60);

    if (diffHours < 2) return 'high';
    if (diffHours < 24) return 'medium';
    return 'low';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Confirmed': case 'Completed': case 'Checked In': return 'bg-success';
      case 'Assigned': case 'Scheduled': return 'bg-primary';
      case 'In Transit': case 'Pending': return 'bg-warning';
      case 'Cancelled': case 'No Show': case 'Delayed': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high': return 'bg-danger';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };


  const exportScheduleToCSV = () => {
    const headers = ['Time', 'Type', 'Guest', 'Event', 'Details', 'Status', 'Priority'];
    const csvContent = [
      headers.join(','),
      ...dashboardData.upcomingSchedule.map(item => [
        formatDateTime(item.time),
        item.type,
        item.guest,
        item.event,
        item.details,
        item.status,
        item.priority
      ].map(field => `"${field || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logistics_schedule_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'arrival': return <FaArrowDown className="text-success" />;
      case 'departure': return <FaArrowUp className="text-danger" />;
      case 'checkin': return <FaArrowRight className="text-primary" />;
      case 'checkout': return <FaArrowRight className="text-warning" />;
      case 'pickup': return <FaCar className="text-info" />;
      default: return <FaInfoCircle />;
    }
  };

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading logistics dashboard...</p>
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
              Logistics Dashboard
            </h2>
            <p className="text-muted mb-0">Real-time arrival, departure and accommodation schedules</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={fetchDashboardData}
              title="Refresh"
            >
              {/* <FaRefresh /> */}
              <FaSearch />
            </button>
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={exportScheduleToCSV}
            >
              <FaFileExport className="me-2" />
              Export Schedule
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-center">
              <div className="col-md-3">
                <label className="form-label fw-semibold">Time Filter</label>
                <select
                  className="form-select glass-input"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="week">Next 7 Days</option>
                  <option value="month">Next 30 Days</option>
                  <option value="custom">Custom Date</option>
                </select>
              </div>
              {timeFilter === 'custom' && (
                <div className="col-md-3">
                  <label className="form-label fw-semibold">Select Date</label>
                  <input
                    type="date"
                    className="form-control glass-input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              )}
              <div className="col-md-3">
                <label className="form-label fw-semibold">Event Filter</label>
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
                <label className="form-label fw-semibold">View</label>
                <select
                  className="form-select glass-input"
                  value={activeView}
                  onChange={(e) => setActiveView(e.target.value)}
                >
                  <option value="overview">Overview</option>
                  <option value="schedule">Detailed Schedule</option>
                  <option value="arrivals">Arrivals Only</option>
                  <option value="departures">Departures Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaPlane className="text-primary mb-2" size={24} />
                <h4 className="text-primary mb-1">{dashboardData.travelArrivals.length}</h4>
                <small className="text-muted">Arrivals</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaPlane className="text-danger mb-2" size={24} style={{ transform: 'rotate(45deg)' }} />
                <h4 className="text-danger mb-1">{dashboardData.travelDepartures.length}</h4>
                <small className="text-muted">Departures</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaHotel className="text-success mb-2" size={24} />
                <h4 className="text-success mb-1">
                  {dashboardData.accommodationCheckins.length + dashboardData.accommodationCheckouts.length}
                </h4>
                <small className="text-muted">Hotel Activities</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaCar className="text-info mb-2" size={24} />
                <h4 className="text-info mb-1">{dashboardData.vehicleAllocations.length}</h4>
                <small className="text-muted">Vehicle Pickups</small>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {activeView === 'overview' && (
          <div className="row g-4">
            {/* Priority Schedule */}
            <div className="col-lg-8">
              <div className="card glass-card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">
                    <FaClock className="me-2 text-primary" />
                    Priority Schedule
                  </h5>
                  <span className="badge bg-primary glass-badge">
                    {dashboardData.upcomingSchedule.filter(s => s.priority === 'high').length} High Priority
                  </span>
                </div>
                <div className="card-body">
                  {dashboardData.upcomingSchedule.length === 0 ? (
                    <div className="text-center py-4">
                      <FaClock className="text-muted mb-3" size={48} />
                      <h5 className="text-muted">No scheduled activities</h5>
                      <p className="text-muted">No logistics activities found for the selected time period.</p>
                    </div>
                  ) : (
                    <div className="timeline">
                      {dashboardData.upcomingSchedule.slice(0, 10).map((item, index) => {
                        return (
                          <div key={index} className="timeline-item mb-3 p-3 border-start border-3 border-primary">
                            <div className="d-flex align-items-start">
                              <div className="me-3">
                                {getTypeIcon(item.type)}
                              </div>
                              <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <div>
                                    <h6 className="mb-1 fw-semibold">{item.guest}</h6>
                                    <small className="text-muted">{item.event}</small>
                                  </div>
                                  <div className="text-end">
                                    <div className="text-primary fw-semibold">{formatDateTime(item.time)}</div>
                                    <div className="d-flex gap-1 mt-1">
                                      <span className={`badge glass-badge ${getStatusBadgeClass(item.status)}`}>
                                        {item.status}
                                      </span>
                                      <span className={`badge glass-badge ${getPriorityBadgeClass(item.priority)}`}>
                                        {item.priority}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <p className="mb-0 text-muted small">{item.details}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="col-lg-4">
              <div className="card glass-card mb-4">
                <div className="card-header">
                  <h6 className="card-title mb-0">Today's Summary</h6>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center">
                      <FaArrowDown className="text-success me-2" />
                      <span>Arrivals</span>
                    </div>
                    <span className="badge bg-success glass-badge">
                      {dashboardData.travelArrivals.filter(a => 
                        new Date(a.arrival_datetime).toDateString() === new Date().toDateString()
                      ).length}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center">
                      <FaArrowUp className="text-danger me-2" />
                      <span>Departures</span>
                    </div>
                    <span className="badge bg-danger glass-badge">
                      {dashboardData.travelDepartures.filter(d => 
                        new Date(d.departure_datetime).toDateString() === new Date().toDateString()
                      ).length}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center">
                      <FaBed className="text-primary me-2" />
                      <span>Check-ins</span>
                    </div>
                    <span className="badge bg-primary glass-badge">
                      {dashboardData.accommodationCheckins.filter(c => 
                        new Date(c.check_in_date).toDateString() === new Date().toDateString()
                      ).length}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <FaRoute className="text-info me-2" />
                      <span>Vehicle Pickups</span>
                    </div>
                    <span className="badge bg-info glass-badge">
                      {dashboardData.vehicleAllocations.filter(v => 
                        new Date(v.pickup_datetime).toDateString() === new Date().toDateString()
                      ).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Urgent Actions */}
              <div className="card glass-card">
                <div className="card-header">
                  <h6 className="card-title mb-0">
                    <FaExclamationTriangle className="me-2 text-warning" />
                    Urgent Actions
                  </h6>
                </div>
                <div className="card-body">
                  {dashboardData.upcomingSchedule.filter(s => s.priority === 'high').length === 0 ? (
                    <div className="text-center py-3">
                      <FaCheckCircle className="text-success mb-2" size={24} />
                      <p className="text-muted mb-0">No urgent actions required</p>
                    </div>
                  ) : (
                    dashboardData.upcomingSchedule
                      .filter(s => s.priority === 'high')
                      .slice(0, 5)
                      .map((item, index) => (
                        <div key={index} className="alert alert-warning glass-effect mb-2">
                          <div className="d-flex align-items-center">
                            {getTypeIcon(item.type)}
                            <div className="ms-2 flex-grow-1">
                              <div className="fw-semibold">{item.guest}</div>
                              <small>{formatDateTime(item.time)} - {item.type}</small>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Schedule View */}
        {activeView === 'schedule' && (
          <div className="card glass-card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <FaCalendarAlt className="me-2 text-primary" />
                Detailed Schedule
              </h5>
            </div>
            <div className="card-body">
              {dashboardData.upcomingSchedule.length === 0 ? (
                <div className="text-center py-4">
                  <FaCalendarAlt className="text-muted mb-3" size={48} />
                  <h5 className="text-muted">No scheduled activities</h5>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Guest</th>
                        <th>Event</th>
                        <th>Details</th>
                        <th>Status</th>
                        <th>Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.upcomingSchedule.map((item, index) => (
                        <tr key={index}>
                          <td className="fw-semibold text-primary">
                            {formatDateTime(item.time)}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {getTypeIcon(item.type)}
                              <span className="ms-2 text-capitalize">{item.type}</span>
                            </div>
                          </td>
                          <td className="fw-semibold">{item.guest}</td>
                          <td>{item.event}</td>
                          <td>
                            <div style={{ maxWidth: '300px' }}>
                              {item.details.length > 50 
                                ? `${item.details.substring(0, 50)}...`
                                : item.details
                              }
                            </div>
                          </td>
                          <td>
                            <span className={`badge glass-badge ${getStatusBadgeClass(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td>
                            <span className={`badge glass-badge ${getPriorityBadgeClass(item.priority)}`}>
                              {item.priority}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Arrivals Only View */}
        {activeView === 'arrivals' && (
          <div className="card glass-card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <FaArrowDown className="me-2 text-success" />
                Arrivals Schedule
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Guest</th>
                      <th>Event</th>
                      <th>Arrival Time</th>
                      <th>Travel Mode</th>
                      <th>Flight/Train</th>
                      <th>Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.travelArrivals.map((arrival, index) => {
                      const TravelIcon = getTravelIcon(arrival.travel_mode);
                      return (
                        <tr key={index}>
                          <td className="fw-semibold">
                            {arrival.guest_first_name} {arrival.guest_last_name}
                          </td>
                          <td>{arrival.event_name}</td>
                          <td className="text-primary fw-semibold">
                            {formatDateTime(arrival.arrival_datetime)}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <TravelIcon className="me-2" />
                              {arrival.travel_mode}
                            </div>
                          </td>
                          <td>{arrival.flight_train_number || '-'}</td>
                          <td>{arrival.arrival_location || '-'}</td>
                          <td>
                            <span className={`badge glass-badge ${getStatusBadgeClass(arrival.travel_status)}`}>
                              {arrival.travel_status}
                            </span>
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

        {/* Departures Only View */}
        {activeView === 'departures' && (
          <div className="card glass-card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <FaArrowUp className="me-2 text-danger" />
                Departures Schedule
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Guest</th>
                      <th>Event</th>
                      <th>Departure Time</th>
                      <th>Travel Mode</th>
                      <th>Flight/Train</th>
                      <th>Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.travelDepartures.map((departure, index) => {
                      const TravelIcon = getTravelIcon(departure.travel_mode);
                      return (
                        <tr key={index}>
                          <td className="fw-semibold">
                            {departure.guest_first_name} {departure.guest_last_name}
                          </td>
                          <td>{departure.event_name}</td>
                          <td className="text-danger fw-semibold">
                            {formatDateTime(departure.departure_datetime)}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <TravelIcon className="me-2" />
                              {departure.travel_mode}
                            </div>
                          </td>
                          <td>{departure.flight_train_number || '-'}</td>
                          <td>{departure.departure_location || '-'}</td>
                          <td>
                            <span className={`badge glass-badge ${getStatusBadgeClass(departure.travel_status)}`}>
                              {departure.travel_status}
                            </span>
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
      </div>
    </div>
  );
};

export default LogisticsDashboard;