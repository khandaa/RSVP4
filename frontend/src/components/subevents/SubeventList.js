import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaArrowLeft,
  FaCalendarAlt,
  FaClipboardList
} from 'react-icons/fa';
import { eventAPI } from '../../services/api';

const SubeventList = () => {
  const [subevents, setSubevents] = useState([]);
  const [filteredSubevents, setFilteredSubevents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [parentEvent, setParentEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [venueFilter, setVenueFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subeventToDelete, setSubeventToDelete] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');

  // Subevent status options
  const statusOptions = ['Planned', 'In Progress', 'Completed', 'Cancelled', 'Postponed'];

  useEffect(() => {
    if (eventId) {
      fetchData();
    } else {
      fetchAllSubevents();
    }
  }, [eventId]);

  useEffect(() => {
    filterAndSortSubevents();
  }, [subevents, searchTerm, sortConfig, statusFilter, venueFilter, dateFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [subeventResponse, venuesResponse, eventResponse] = await Promise.all([
        eventAPI.getEventSchedule(eventId),
        fetch('/api/master-data/venues').then(res => res.json()),
        eventAPI.getEvent(eventId)
      ]);
      
      setSubevents(subeventResponse.data || []);
      setVenues(venuesResponse || []);
      setParentEvent(eventResponse.data);
    } catch (error) {
      console.error('Error fetching subevents:', error);
      toast.error('Failed to fetch subevents data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllSubevents = async () => {
    try {
      setIsLoading(true);
      const [subeventResponse, venuesResponse] = await Promise.all([
        fetch('/api/crud/event-schedule').then(res => res.json()),
        fetch('/api/master-data/venues').then(res => res.json())
      ]);
      
      setSubevents(subeventResponse || []);
      setVenues(venuesResponse || []);
    } catch (error) {
      console.error('Error fetching all subevents:', error);
      toast.error('Failed to fetch subevents data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortSubevents = () => {
    let filtered = [...subevents];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(subevent =>
        subevent.subevent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subevent.subevent_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subevent.venue_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subevent.room_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(subevent => subevent.subevent_status === statusFilter);
    }

    // Apply venue filter
    if (venueFilter !== 'all') {
      filtered = filtered.filter(subevent => subevent.venue_id === parseInt(venueFilter));
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(subevent => {
        if (!subevent.subevent_start_datetime) return dateFilter === 'no-date';
        
        const subeventDate = new Date(subevent.subevent_start_datetime);
        const subeventDateOnly = new Date(subeventDate.getFullYear(), subeventDate.getMonth(), subeventDate.getDate());
        
        switch (dateFilter) {
          case 'today':
            return subeventDateOnly.getTime() === today.getTime();
          case 'this-week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return subeventDateOnly >= weekStart && subeventDateOnly <= weekEnd;
          case 'upcoming':
            return subeventDateOnly >= today;
          case 'past':
            return subeventDateOnly < today;
          case 'no-date':
            return !subevent.subevent_start_datetime;
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
        if (sortConfig.key.includes('datetime')) {
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

    setFilteredSubevents(filtered);
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

  const handleDelete = (subevent) => {
    setSubeventToDelete(subevent);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await fetch(`/api/crud/event-schedule/${subeventToDelete.subevent_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success('Subevent deleted successfully');
      if (eventId) {
        fetchData();
      } else {
        fetchAllSubevents();
      }
      setShowDeleteModal(false);
      setSubeventToDelete(null);
    } catch (error) {
      console.error('Error deleting subevent:', error);
      toast.error('Failed to delete subevent');
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Subevent Name', 'Event', 'Status', 'Venue', 'Room', 'Start DateTime', 'End DateTime', 'Capacity'];
    const csvContent = [
      headers.join(','),
      ...filteredSubevents.map(subevent => [
        subevent.subevent_id,
        `"${subevent.subevent_name || ''}"`,
        `"${subevent.event_name || ''}"`,
        subevent.subevent_status || '',
        `"${subevent.venue_name || ''}"`,
        `"${subevent.room_name || ''}"`,
        subevent.subevent_start_datetime ? new Date(subevent.subevent_start_datetime).toLocaleString() : '',
        subevent.subevent_end_datetime ? new Date(subevent.subevent_end_datetime).toLocaleString() : '',
        subevent.capacity || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `subevents_${new Date().toISOString().split('T')[0]}.csv`);
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

  const formatDateTime = (datetime) => {
    if (!datetime) return 'Not set';
    return new Date(datetime).toLocaleString();
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
          <div className="d-flex align-items-center">
            {eventId && (
              <button 
                className="btn btn-outline-secondary glass-btn me-3"
                onClick={() => navigate(`/events/${eventId}`)}
              >
                <FaArrowLeft />
              </button>
            )}
            <div>
              <h2 className="text-dark fw-bold mb-0">
                {eventId ? `${parentEvent?.event_name} - Sub Events` : 'All Sub Events'}
              </h2>
              <p className="text-muted">
                {eventId ? 'Manage sub events for this event' : 'Manage all sub events across events'}
              </p>
            </div>
          </div>
          <div className="d-flex gap-2">
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
              onClick={() => navigate(`/subevents/create${eventId ? `?eventId=${eventId}` : ''}`)}
            >
              <FaPlus className="me-2" />
              Add Sub Event
            </button>
          </div>
        </div>

        {/* Event Info Card (if viewing subevents for specific event) */}
        {eventId && parentEvent && (
          <div className="card glass-card mb-4">
            <div className="card-body">
              <div className="row g-3 align-items-center">
                <div className="col-md-4">
                  <div className="d-flex align-items-center">
                    <FaCalendarAlt className="text-primary me-2" />
                    <div>
                      <div className="fw-semibold">{parentEvent.event_name}</div>
                      <small className="text-muted">Parent Event</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="d-flex align-items-center">
                    <span className={`badge glass-badge ${getStatusBadgeClass(parentEvent.event_status)}`}>
                      {parentEvent.event_status}
                    </span>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="d-flex align-items-center">
                    <FaClock className="text-muted me-1" size={12} />
                    <small>
                      {parentEvent.event_start_date 
                        ? new Date(parentEvent.event_start_date).toLocaleDateString()
                        : 'No date set'
                      }
                    </small>
                  </div>
                </div>
                <div className="col-md-2 text-end">
                  <span className="badge bg-info glass-badge">
                    {filteredSubevents.length} Sub Events
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    placeholder="Search sub events..."
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
              <div className="col-lg-2">
                <select
                  className="form-select glass-input"
                  value={venueFilter}
                  onChange={(e) => setVenueFilter(e.target.value)}
                >
                  <option value="all">All Venues</option>
                  {venues.map(venue => (
                    <option key={venue.venue_id} value={venue.venue_id}>
                      {venue.venue_name}
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
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                  <option value="no-date">No Date Set</option>
                </select>
              </div>
              <div className="col-lg-3">
                <div className="text-muted small d-flex align-items-center justify-content-end">
                  <FaClipboardList className="me-1" />
                  {filteredSubevents.length} of {subevents.length} sub events
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subevent Table */}
        <div className="table-container glass-table">
          <table className="table table-hover">
            <thead>
              <tr>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('subevent_id')}
                  style={{ cursor: 'pointer' }}
                >
                  ID {getSortIcon('subevent_id')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('subevent_name')}
                  style={{ cursor: 'pointer' }}
                >
                  Sub Event Name {getSortIcon('subevent_name')}
                </th>
                {!eventId && (
                  <th 
                    scope="col" 
                    className="sortable" 
                    onClick={() => handleSort('event_name')}
                    style={{ cursor: 'pointer' }}
                  >
                    Parent Event {getSortIcon('event_name')}
                  </th>
                )}
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('subevent_status')}
                  style={{ cursor: 'pointer' }}
                >
                  Status {getSortIcon('subevent_status')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('venue_name')}
                  style={{ cursor: 'pointer' }}
                >
                  Venue/Room {getSortIcon('venue_name')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('subevent_start_datetime')}
                  style={{ cursor: 'pointer' }}
                >
                  Start DateTime {getSortIcon('subevent_start_datetime')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('capacity')}
                  style={{ cursor: 'pointer' }}
                >
                  Capacity {getSortIcon('capacity')}
                </th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubevents.length === 0 ? (
                <tr>
                  <td colSpan={eventId ? "7" : "8"} className="text-center py-4">
                    <div className="text-muted">
                      {searchTerm || statusFilter !== 'all' || venueFilter !== 'all' || dateFilter !== 'all'
                        ? 'No sub events match your filters'
                        : 'No sub events found. Create your first sub event!'
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubevents.map((subevent) => (
                  <tr key={subevent.subevent_id}>
                    <td>#{subevent.subevent_id}</td>
                    <td className="fw-semibold">
                      <div className="d-flex align-items-center">
                        <FaClipboardList className="text-primary me-2" />
                        <div>
                          <div>{subevent.subevent_name}</div>
                          {subevent.subevent_description && (
                            <small className="text-muted">{subevent.subevent_description.substring(0, 50)}...</small>
                          )}
                        </div>
                      </div>
                    </td>
                    {!eventId && (
                      <td>
                        <span className="badge bg-info glass-badge">
                          {subevent.event_name}
                        </span>
                      </td>
                    )}
                    <td>
                      <span className={`badge glass-badge ${getStatusBadgeClass(subevent.subevent_status)}`}>
                        {subevent.subevent_status}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaMapMarkerAlt className="text-muted me-1" size={12} />
                        <div>
                          <div className="fw-semibold">{subevent.venue_name || 'TBD'}</div>
                          {subevent.room_name && (
                            <small className="text-muted">{subevent.room_name}</small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaClock className="text-muted me-1" size={12} />
                        <small>{formatDateTime(subevent.subevent_start_datetime)}</small>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaUsers className="text-muted me-1" size={12} />
                        <span className="badge bg-secondary glass-badge">
                          {subevent.capacity || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-info glass-btn"
                          onClick={() => navigate(`/subevents/${subevent.subevent_id}`)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary glass-btn"
                          onClick={() => navigate(`/subevents/${subevent.subevent_id}/edit`)}
                          title="Edit Subevent"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger glass-btn"
                          onClick={() => handleDelete(subevent)}
                          title="Delete Subevent"
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
                    <p>Are you sure you want to delete sub event <strong>{subeventToDelete?.subevent_name}</strong>?</p>
                    <div className="alert alert-warning">
                      <strong>Warning:</strong> This will also delete all related guest allocations and room assignments.
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
                      Delete Sub Event
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

export default SubeventList;