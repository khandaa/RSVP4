import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaArrowRight, 
  FaCalendarAlt, 
  FaList,
  FaPlus,
  FaEye,
  FaFilter,
  FaUsers,
  FaClock,
  FaUser
} from 'react-icons/fa';
import { eventAPI, clientAPI } from '../../services/api';

const EventCalendar = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, timeline
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [clientFilter, setClientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const statusOptions = ['Planned', 'In Progress', 'Completed', 'Cancelled', 'Postponed'];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, clientFilter, statusFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [eventsResponse, clientsResponse] = await Promise.all([
        eventAPI.getEvents(),
        clientAPI.getClients()
      ]);
      
      setEvents(eventsResponse.data);
      setClients(clientsResponse.data);
      setFilteredEvents(eventsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    if (clientFilter !== 'all') {
      filtered = filtered.filter(event => event.client_id === parseInt(clientFilter));
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.event_status === statusFilter);
    }

    setFilteredEvents(filtered);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Planned': return 'bg-primary';
      case 'In Progress': return 'bg-warning';
      case 'Completed': return 'bg-success';
      case 'Cancelled': return 'bg-danger';
      case 'Postponed': return 'bg-secondary';
      default: return 'bg-info';
    }
  };

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const getEventsForDate = (date) => {
    return filteredEvents.filter(event => {
      if (!event.event_start_date) return false;
      
      const eventStart = new Date(event.event_start_date);
      const eventEnd = event.event_end_date ? new Date(event.event_end_date) : eventStart;
      
      return date >= eventStart.setHours(0,0,0,0) && date <= eventEnd.setHours(23,59,59,999);
    });
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const today = new Date();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === today.toDateString();

      days.push(
        <div 
          key={day} 
          className={`calendar-day ${isToday ? 'today' : ''}`}
        >
          <div className="day-number">{day}</div>
          <div className="day-events">
            {dayEvents.slice(0, 3).map((event, index) => (
              <div 
                key={event.event_id}
                className={`event-item badge glass-badge ${getStatusBadgeClass(event.event_status)}`}
                onClick={() => setSelectedEvent(event)}
                style={{ cursor: 'pointer', fontSize: '10px', marginBottom: '2px' }}
              >
                {event.event_name.length > 15 
                  ? `${event.event_name.substring(0, 15)}...` 
                  : event.event_name
                }
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-muted" style={{ fontSize: '10px' }}>
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="calendar-grid">
        <div className="calendar-header">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
        </div>
        <div className="calendar-body">
          {days}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }

    return (
      <div className="week-view">
        <div className="week-header">
          {weekDays.map((date, index) => (
            <div key={index} className="week-day-header">
              <div className="day-name">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="day-number">
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>
        <div className="week-body">
          {weekDays.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            return (
              <div key={index} className="week-day-column">
                {dayEvents.map(event => (
                  <div 
                    key={event.event_id}
                    className={`week-event badge glass-badge ${getStatusBadgeClass(event.event_status)}`}
                    onClick={() => setSelectedEvent(event)}
                    style={{ cursor: 'pointer', marginBottom: '5px', display: 'block' }}
                  >
                    <div className="fw-semibold">{event.event_name}</div>
                    <small>{event.client_name}</small>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTimelineView = () => {
    const sortedEvents = [...filteredEvents]
      .filter(event => event.event_start_date)
      .sort((a, b) => new Date(a.event_start_date) - new Date(b.event_start_date));

    return (
      <div className="timeline-view">
        <div className="timeline-container">
          {sortedEvents.map((event, index) => {
            const startDate = new Date(event.event_start_date);
            const endDate = event.event_end_date ? new Date(event.event_end_date) : null;
            const duration = endDate ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1 : 1;

            return (
              <div key={event.event_id} className="timeline-item">
                <div className="timeline-date">
                  <div className="date-indicator">
                    {startDate.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  {duration > 1 && (
                    <div className="duration-indicator">
                      {duration} days
                    </div>
                  )}
                </div>
                <div className="timeline-content">
                  <div 
                    className="timeline-event-card card glass-card"
                    onClick={() => setSelectedEvent(event)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="card-title mb-0">{event.event_name}</h6>
                        <span className={`badge glass-badge ${getStatusBadgeClass(event.event_status)}`}>
                          {event.event_status}
                        </span>
                      </div>
                      <div className="d-flex align-items-center text-muted mb-2">
                        <FaUser className="me-1" size={12} />
                        <small>{event.client_name}</small>
                      </div>
                      {event.event_description && (
                        <p className="card-text small text-muted mb-2">
                          {event.event_description.substring(0, 100)}...
                        </p>
                      )}
                      <div className="d-flex align-items-center text-muted">
                        <FaClock className="me-1" size={12} />
                        <small>
                          {startDate.toLocaleDateString()}
                          {endDate && endDate.toDateString() !== startDate.toDateString() && 
                            ` - ${endDate.toLocaleDateString()}`
                          }
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {sortedEvents.length === 0 && (
          <div className="text-center py-5">
            <FaCalendarAlt className="text-muted mb-3" size={48} />
            <h5 className="text-muted">No events scheduled</h5>
            <p className="text-muted">Events with dates will appear in the timeline.</p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading calendar...</p>
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
            <h2 className="text-dark fw-bold mb-0">Event Calendar</h2>
            <p className="text-muted">Visual timeline of your events</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={() => navigate('/events')}
            >
              <FaList className="me-2" />
              List View
            </button>
            <button 
              className="btn btn-primary glass-btn-primary"
              onClick={() => navigate('/events/create')}
            >
              <FaPlus className="me-2" />
              Add Event
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-center">
              <div className="col-md-3">
                <div className="btn-group" role="group">
                  <button 
                    className={`btn glass-btn ${viewMode === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewMode('month')}
                  >
                    Month
                  </button>
                  <button 
                    className={`btn glass-btn ${viewMode === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewMode('week')}
                  >
                    Week
                  </button>
                  <button 
                    className={`btn glass-btn ${viewMode === 'timeline' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewMode('timeline')}
                  >
                    Timeline
                  </button>
                </div>
              </div>

              {viewMode !== 'timeline' && (
                <div className="col-md-4">
                  <div className="d-flex align-items-center">
                    <button 
                      className="btn btn-outline-secondary glass-btn me-2"
                      onClick={() => viewMode === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
                    >
                      <FaArrowLeft />
                    </button>
                    <h5 className="mb-0 mx-3">
                      {viewMode === 'month' 
                        ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                        : `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      }
                    </h5>
                    <button 
                      className="btn btn-outline-secondary glass-btn ms-2"
                      onClick={() => viewMode === 'month' ? navigateMonth(1) : navigateWeek(1)}
                    >
                      <FaArrowRight />
                    </button>
                  </div>
                </div>
              )}

              <div className="col-md-2">
                <select
                  className="form-select glass-input"
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                >
                  <option value="all">All Clients</option>
                  {clients.map(client => (
                    <option key={client.client_id} value={client.client_id}>
                      {client.client_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <select
                  className="form-select glass-input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-1">
                <div className="text-muted small">
                  {filteredEvents.length} events
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Views */}
        <div className="card glass-card">
          <div className="card-body p-0">
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'timeline' && renderTimelineView()}
          </div>
        </div>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-overlay" style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1040 
            }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content glass-modal">
                  <div className="modal-header">
                    <h5 className="modal-title">{selectedEvent.event_name}</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setSelectedEvent(null)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-12">
                        <div className="d-flex align-items-center mb-2">
                          <FaUser className="text-primary me-2" />
                          <strong>Client:</strong>
                          <span className="ms-2 badge bg-info glass-badge">
                            {selectedEvent.client_name}
                          </span>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="d-flex align-items-center mb-2">
                          <span className="me-2"><strong>Status:</strong></span>
                          <span className={`badge glass-badge ${getStatusBadgeClass(selectedEvent.event_status)}`}>
                            {selectedEvent.event_status}
                          </span>
                        </div>
                      </div>
                      {selectedEvent.event_start_date && (
                        <div className="col-12">
                          <div className="d-flex align-items-center mb-2">
                            <FaClock className="text-primary me-2" />
                            <strong>Date:</strong>
                            <span className="ms-2">
                              {new Date(selectedEvent.event_start_date).toLocaleDateString()}
                              {selectedEvent.event_end_date && 
                                selectedEvent.event_end_date !== selectedEvent.event_start_date &&
                                ` - ${new Date(selectedEvent.event_end_date).toLocaleDateString()}`
                              }
                            </span>
                          </div>
                        </div>
                      )}
                      {selectedEvent.event_description && (
                        <div className="col-12">
                          <strong>Description:</strong>
                          <p className="mt-1 text-muted">{selectedEvent.event_description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary glass-btn"
                      onClick={() => setSelectedEvent(null)}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary glass-btn-primary"
                      onClick={() => {
                        navigate(`/events/${selectedEvent.event_id}`);
                        setSelectedEvent(null);
                      }}
                    >
                      <FaEye className="me-2" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS for Calendar */}
      <style jsx>{`
        .calendar-grid {
          display: flex;
          flex-direction: column;
          height: 600px;
        }
        
        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: #e9ecef;
          border-radius: 10px 10px 0 0;
        }
        
        .day-header {
          padding: 10px;
          text-align: center;
          font-weight: bold;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(5px);
        }
        
        .calendar-body {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-template-rows: repeat(6, 1fr);
          gap: 1px;
          background: #e9ecef;
          flex: 1;
          border-radius: 0 0 10px 10px;
        }
        
        .calendar-day {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(5px);
          padding: 8px;
          display: flex;
          flex-direction: column;
          position: relative;
          min-height: 80px;
        }
        
        .calendar-day.today {
          background: rgba(13, 110, 253, 0.1);
          border: 2px solid #0d6efd;
        }
        
        .calendar-day.empty {
          background: rgba(248, 249, 250, 0.5);
        }
        
        .day-number {
          font-weight: bold;
          margin-bottom: 4px;
        }
        
        .day-events {
          flex: 1;
          overflow: hidden;
        }
        
        .event-item {
          display: block;
          width: 100%;
          text-align: left;
          border: none;
          padding: 2px 4px;
        }
        
        .week-view {
          display: flex;
          flex-direction: column;
          height: 600px;
        }
        
        .week-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: #e9ecef;
          border-radius: 10px 10px 0 0;
        }
        
        .week-day-header {
          padding: 15px;
          text-align: center;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(5px);
        }
        
        .week-body {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: #e9ecef;
          flex: 1;
          border-radius: 0 0 10px 10px;
        }
        
        .week-day-column {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(5px);
          padding: 10px;
          overflow-y: auto;
        }
        
        .week-event {
          display: block;
          width: 100%;
          text-align: left;
          padding: 8px;
          border: none;
        }
        
        .timeline-view {
          padding: 20px;
          max-height: 600px;
          overflow-y: auto;
        }
        
        .timeline-container {
          position: relative;
        }
        
        .timeline-item {
          display: flex;
          margin-bottom: 30px;
          position: relative;
        }
        
        .timeline-item:not(:last-child):before {
          content: '';
          position: absolute;
          left: 40px;
          top: 60px;
          bottom: -30px;
          width: 2px;
          background: #dee2e6;
        }
        
        .timeline-date {
          width: 80px;
          text-align: center;
          margin-right: 20px;
          position: relative;
        }
        
        .date-indicator {
          background: #0d6efd;
          color: white;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          position: relative;
          z-index: 1;
        }
        
        .duration-indicator {
          font-size: 10px;
          color: #6c757d;
          margin-top: 5px;
        }
        
        .timeline-content {
          flex: 1;
        }
        
        .timeline-event-card {
          transition: transform 0.2s;
        }
        
        .timeline-event-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default EventCalendar;