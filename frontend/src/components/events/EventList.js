import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaSearch, 
  FaSort, 
  FaSortUp, 
  FaSortDown, 
  FaDownload,
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { eventAPI, clientAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['Admin', 'admin', 'full_access']);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Event status options
  const statusOptions = ['Planned', 'In Progress', 'Completed', 'Cancelled', 'Postponed'];

  useEffect(() => {
    fetchData();
    
    // If coming from client detail, filter by client
    if (location.state?.clientId) {
      setClientFilter(location.state.clientId.toString());
    }
  }, []);

  useEffect(() => {
    filterAndSortEvents();
  }, [events, searchTerm, sortConfig, statusFilter, clientFilter, typeFilter, dateFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Handle events and clients with axios interceptors
      const eventsResponse = await eventAPI.getEvents();
      const clientsResponse = await clientAPI.getClients();
      
      // Handle event types with explicit headers
      const eventTypesResponse = await fetch('/api/master-data/event-types', {
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      }).then(res => {
        if (!res.ok) {
          throw new Error(`Event types fetch failed: ${res.status}`);
        }
        return res.json();
      });
      
      setEvents(eventsResponse.data || []);
      setClients(clientsResponse.data || []);
      
      // Ensure eventTypes is always an array
      if (Array.isArray(eventTypesResponse)) {
        setEventTypes(eventTypesResponse);
      } else if (eventTypesResponse && Array.isArray(eventTypesResponse.data)) {
        setEventTypes(eventTypesResponse.data);
      } else {
        // If there's no event type data, create fallback data
        console.error('Event types response is not an array:', eventTypesResponse);
        const fallbackEventTypes = [
          { event_type_id: 1, event_type_name: 'Conference' },
          { event_type_id: 2, event_type_name: 'Wedding' },
          { event_type_id: 3, event_type_name: 'Corporate' },
          { event_type_id: 4, event_type_name: 'Social Gathering' },
          { event_type_id: 5, event_type_name: 'Workshop' },
          { event_type_id: 6, event_type_name: 'Seminar' }
        ];
        setEventTypes(fallbackEventTypes);
        toast.info('Using default event types due to data retrieval issues', {
          position: toast.POSITION.BOTTOM_RIGHT,
          autoClose: 3000
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch events data');
      // Set default values in case of error
      setEvents([]);
      setClients([]);
      // Ensure eventTypes is always an array even when API calls fail
      setEventTypes([
        { event_type_id: 1, event_type_name: 'Conference' },
        { event_type_id: 2, event_type_name: 'Wedding' },
        { event_type_id: 3, event_type_name: 'Corporate' },
        { event_type_id: 4, event_type_name: 'Social Gathering' },
        { event_type_id: 5, event_type_name: 'Workshop' },
        { event_type_id: 6, event_type_name: 'Seminar' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortEvents = () => {
    let filtered = [...events];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.event_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.event_type_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.event_status === statusFilter);
    }

    // Apply client filter
    if (clientFilter !== 'all') {
      filtered = filtered.filter(event => event.client_id === parseInt(clientFilter));
    }

    // Apply event type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(event => event.event_type_id === parseInt(typeFilter));
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(event => {
        if (!event.event_start_date) return dateFilter === 'no-date';
        
        const eventDate = new Date(event.event_start_date);
        const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        
        switch (dateFilter) {
          case 'today':
            return eventDateOnly.getTime() === today.getTime();
          case 'this-week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return eventDateOnly >= weekStart && eventDateOnly <= weekEnd;
          case 'this-month':
            return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
          case 'upcoming':
            return eventDateOnly >= today;
          case 'past':
            return eventDateOnly < today;
          case 'no-date':
            return !event.event_start_date;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        // Handle date sorting
        if (sortConfig.key.includes('date')) {
          const aDate = aValue ? new Date(aValue) : new Date(0);
          const bDate = bValue ? new Date(bValue) : new Date(0);
          return sortConfig.direction === 'asc' 
            ? aDate.getTime() - bDate.getTime()
            : bDate.getTime() - aDate.getTime();
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredEvents(filtered);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName) => {
    if (sortConfig.key === columnName) {
      return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
    }
    return <FaSort />;
  };

  const handleDelete = (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await eventAPI.deleteEvent(eventToDelete.event_id);
      toast.success('Event deleted successfully');
      fetchData();
      setShowDeleteModal(false);
      setEventToDelete(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Event Name', 'Client', 'Status', 'Type', 'Start Date', 'End Date', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...filteredEvents.map(event => [
        event.event_id,
        `"${event.event_name || ''}"`,
        `"${event.client_name || ''}"`,
        event.event_status || '',
        `"${event.event_type_name || ''}"`,
        event.event_start_date ? new Date(event.event_start_date).toLocaleDateString() : '',
        event.event_end_date ? new Date(event.event_end_date).toLocaleDateString() : '',
        new Date(event.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `events_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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

  const formatDateRange = (startDate, endDate) => {
    if (!startDate) return 'No date set';
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    if (end && start.toDateString() !== end.toDateString()) {
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
    return start.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
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
            <h2 className="text-dark fw-bold mb-0">Event Management</h2>
            <p className="text-muted">Manage your events and track their progress</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-info glass-btn"
              onClick={() => navigate('/events/calendar')}
              title="Calendar View"
            >
              <FaCalendarAlt className="me-2" />
              Calendar
            </button>
            <button 
              className="btn btn-outline-primary glass-btn"
              onClick={exportToCSV}
              title="Export to CSV"
            >
              <FaDownload className="me-2" />
              Export
            </button>
            <button 
              className="btn btn-primary glass-btn-primary"
              onClick={() => navigate('/events/create')}
              data-testid="add-event-button"
              style={{ fontWeight: 'bold', padding: '0.6rem 1.2rem' }}
            >
              <FaPlus className="me-2" />
              Add Event
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-lg-3">
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
              <div className="col-lg-2">
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
              {isAdmin && (
                <div className="col-lg-2">
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
              )}
              <div className="col-lg-2">
                <select
                  className="form-select glass-input"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  {eventTypes.map(type => (
                    <option key={type.event_type_id} value={type.event_type_id}>
                      {type.event_type_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-lg-2">
                <select
                  className="form-select glass-input"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past Events</option>
                  <option value="no-date">No Date Set</option>
                </select>
              </div>
              <div className="col-lg-1">
                <div className="text-muted small">
                  {filteredEvents.length} of {events.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Event Table */}
        <div className="table-container glass-table">
          <table className="table table-hover">
            <thead>
              <tr>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('event_id')}
                  style={{ cursor: 'pointer' }}
                >
                  ID {getSortIcon('event_id')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('event_name')}
                  style={{ cursor: 'pointer' }}
                >
                  Event Name {getSortIcon('event_name')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('client_name')}
                  style={{ cursor: 'pointer' }}
                >
                  Client {getSortIcon('client_name')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('event_status')}
                  style={{ cursor: 'pointer' }}
                >
                  Status {getSortIcon('event_status')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('event_type_name')}
                  style={{ cursor: 'pointer' }}
                >
                  Type {getSortIcon('event_type_name')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('event_start_date')}
                  style={{ cursor: 'pointer' }}
                >
                  Date Range {getSortIcon('event_start_date')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('created_at')}
                  style={{ cursor: 'pointer' }}
                >
                  Created {getSortIcon('created_at')}
                </th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <div className="text-muted">
                      {searchTerm || statusFilter !== 'all' || clientFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all'
                        ? 'No events match your filters'
                        : 'No events found. Create your first event!'
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event.event_id}>
                    <td>#{event.event_id}</td>
                    <td className="fw-semibold">
                      <div className="d-flex align-items-center">
                        <FaCalendarAlt className="text-primary me-2" />
                        <div>
                          <div>{event.event_name}</div>
                          {event.event_description && (
                            <small className="text-muted">{event.event_description.substring(0, 50)}...</small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-info glass-badge">
                        {event.client_name}
                      </span>
                    </td>
                    <td>
                      <span className={`badge glass-badge ${getStatusBadgeClass(event.event_status)}`}>
                        {event.event_status}
                      </span>
                    </td>
                    <td>
                      {event.event_type_name ? (
                        <span className="badge bg-secondary glass-badge">
                          {event.event_type_name}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaClock className="text-muted me-1" size={12} />
                        <small>{formatDateRange(event.event_start_date, event.event_end_date)}</small>
                      </div>
                    </td>
                    <td>{new Date(event.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-info glass-btn"
                          onClick={() => navigate(`/events/${event.event_id}`)}
                          title="View Details"
                          data-testid="view-event-button"
                        >
                          <FaEye /> View
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary glass-btn"
                          onClick={() => navigate(`/events/${event.event_id}/edit`)}
                          title="Edit Event"
                          data-testid="edit-event-button"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger glass-btn"
                          onClick={() => handleDelete(event)}
                          title="Delete Event"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
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
                    <h5 className="modal-title">Confirm Delete</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowDeleteModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <p>Are you sure you want to delete event <strong>{eventToDelete?.event_name}</strong>?</p>
                    <div className="alert alert-warning">
                      <strong>Warning:</strong> This will also delete all related subevents, guests, and other associated data.
                    </div>
                    <div className="alert alert-danger">
                      <small>This action cannot be undone.</small>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary glass-btn"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger glass-btn-danger"
                      onClick={confirmDelete}
                    >
                      Delete Event
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;