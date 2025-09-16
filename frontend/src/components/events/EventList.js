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
  const { hasRole, currentUser } = useAuth();
  const isAdmin = hasRole(['Admin', 'admin', 'full_access']);
  const isCustomerAdmin = hasRole(['Customer Admin']);
  
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

  // Auto-filter for Customer Admin users
  useEffect(() => {
    if (isCustomerAdmin && currentUser && clients.length > 0) {
      // Find clients associated with the current user's customer
      const userClients = clients.filter(client => 
        client.customer_email === currentUser.email
      );
      
      if (userClients.length > 0) {
        // Set client filter to show only events from user's clients
        const clientIds = userClients.map(client => client.client_id);
        // Since we can only filter by one client at a time, we'll modify the filtering logic
        // to handle multiple client IDs for Customer Admin users
        setClientFilter('customer_admin_filter');
      }
    }
  }, [isCustomerAdmin, currentUser, clients]);

  useEffect(() => {
    filterAndSortEvents();
  }, [events, searchTerm, sortConfig, statusFilter, clientFilter, typeFilter, dateFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch events, clients, and event types in parallel
      const [eventsResponse, clientsResponse, eventTypesResponse] = await Promise.allSettled([
        eventAPI.getEvents(),
        clientAPI.getClients(),
        // Use the masterDataAPI for event types
        fetch('/api/master-data/event-types', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          }
        }).then(async res => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `Event types fetch failed: ${res.status}`);
          }
          return res.json();
        })
      ]);

      // Process events response
      const eventsResult = eventsResponse.status === 'fulfilled' ? 
        eventsResponse.value : { success: false, error: eventsResponse.reason };
      
      if (eventsResult.success) {
        setEvents(Array.isArray(eventsResult.data) ? eventsResult.data : []);
      } else {
        console.error('Error fetching events:', eventsResult.error);
        setEvents([]);
        if (!eventsResult.error?.includes('No events found')) {
          toast.error(eventsResult.error || 'Failed to load events', {
            position: toast.POSITION.BOTTOM_RIGHT,
            autoClose: 5000
          });
        }
      }
      
      // Process clients response
      const clientsResult = clientsResponse.status === 'fulfilled' ? 
        clientsResponse.value : { success: false, error: clientsResponse.reason };
      
      if (clientsResult.success) {
        setClients(Array.isArray(clientsResult.data) ? clientsResult.data : []);
      } else {
        console.error('Error fetching clients:', clientsResult.error);
        setClients([]);
        toast.error('Failed to load clients. Some features may be limited.', {
          position: toast.POSITION.BOTTOM_RIGHT,
          autoClose: 5000
        });
      }
      
      // Process event types response
      if (eventTypesResponse.status === 'fulfilled') {
        try {
          const eventTypesData = eventTypesResponse.value;
          if (Array.isArray(eventTypesData)) {
            setEventTypes(eventTypesData);
          } else if (eventTypesData && Array.isArray(eventTypesData.data)) {
            setEventTypes(eventTypesData.data);
          } else {
            console.warn('Unexpected event types format, using fallback');
            setEventTypes(getFallbackEventTypes());
          }
        } catch (parseError) {
          console.error('Error parsing event types:', parseError);
          setEventTypes(getFallbackEventTypes());
        }
      } else {
        console.error('Failed to fetch event types:', eventTypesResponse.reason);
        setEventTypes(getFallbackEventTypes());
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
      
      // Set fallback event types if we don't have any
      if (eventTypes.length === 0) {
        setEventTypes(getFallbackEventTypes());
        toast.info('Using default event types due to data retrieval issues', {
          position: toast.POSITION.BOTTOM_RIGHT,
          autoClose: 5000
        });
      }
      
      if (events.length === 0) {
        const errorMessage = error.response?.data?.error || 'Failed to load events. Please try refreshing the page.';
        toast.error(errorMessage, {
          position: toast.POSITION.BOTTOM_RIGHT,
          autoClose: 5000
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortEvents = () => {
    try {
      // Start with a fresh copy of events
      let filtered = Array.isArray(events) ? [...events] : [];

      // Apply search filter if search term exists
      if (searchTerm && searchTerm.trim() !== '') {
        const searchTermLower = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(event => {
          // Safely check each field for the search term
          const eventName = String(event.event_name || '').toLowerCase();
          const eventDesc = String(event.event_description || '').toLowerCase();
          const clientName = String(event.client_name || '').toLowerCase();
          const eventType = String(event.event_type_name || '').toLowerCase();
          
          return (
            eventName.includes(searchTermLower) ||
            eventDesc.includes(searchTermLower) ||
            clientName.includes(searchTermLower) ||
            eventType.includes(searchTermLower)
          );
        });
      }

      // Apply status filter
      if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(event => event.event_status === statusFilter);
      }

      // Apply client filter with customer admin check
      if (clientFilter && clientFilter !== 'all') {
        if (clientFilter === 'customer_admin_filter' && isCustomerAdmin && currentUser) {
          // For customer admins, only show events from their clients
          const userClients = Array.isArray(clients) ? 
            clients.filter(client => 
              client && client.customer_email === currentUser.email
            ) : [];
          
          if (userClients.length > 0) {
            const userClientIds = userClients
              .map(client => client?.client_id)
              .filter(id => id !== undefined);
            
            filtered = filtered.filter(event => 
              event && event.client_id && userClientIds.includes(event.client_id)
            );
          } else {
            filtered = []; // No clients found for this customer admin
          }
        } else if (clientFilter !== 'customer_admin_filter') {
          // Regular client filter by ID
          const clientId = parseInt(clientFilter, 10);
          if (!isNaN(clientId)) {
            filtered = filtered.filter(event => event && event.client_id === clientId);
          }
        }
      }

      // Apply event type filter
      if (typeFilter && typeFilter !== 'all') {
        const typeId = parseInt(typeFilter, 10);
        if (!isNaN(typeId)) {
          filtered = filtered.filter(event => event && event.event_type_id === typeId);
        }
      }

    // Apply date filter with enhanced error handling
    if (dateFilter && dateFilter !== 'all') {
      try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        filtered = filtered.filter(event => {
          // Handle events without a start date
          if (!event?.event_start_date) {
            return dateFilter === 'no-date';
          }
          
          try {
            const eventDate = new Date(event.event_start_date);
            // Handle invalid dates
            if (isNaN(eventDate.getTime())) {
              return dateFilter === 'no-date';
            }
            
            const eventDateOnly = new Date(
              eventDate.getFullYear(), 
              eventDate.getMonth(), 
              eventDate.getDate()
            );
            
            switch (dateFilter) {
              case 'today':
                return eventDateOnly.getTime() === today.getTime();
                
              case 'this-week': {
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                weekEnd.setHours(23, 59, 59, 999); // End of day
                return eventDateOnly >= weekStart && eventDateOnly <= weekEnd;
              }
                
              case 'this-month':
                return eventDate.getMonth() === today.getMonth() && 
                       eventDate.getFullYear() === today.getFullYear();
                       
              case 'next-30-days': {
                const next30Days = new Date(today);
                next30Days.setDate(today.getDate() + 30);
                next30Days.setHours(23, 59, 59, 999);
                return eventDateOnly >= today && eventDateOnly <= next30Days;
              }
                
              case 'upcoming':
                return eventDateOnly >= today;
                
              case 'past':
                return eventDateOnly < today;
                
              case 'no-date':
                return !event.event_start_date;
                
              default:
                return true;
            }
          } catch (dateError) {
            console.error('Error processing event date:', dateError, event);
            return dateFilter === 'no-date';
          }
        });
      } catch (filterError) {
        console.error('Error applying date filter:', filterError);
        // Don't filter if there's an error with the date filter
      }
    }

    // Apply sorting with enhanced type handling
    if (sortConfig?.key) {
      filtered.sort((a, b) => {
        try {
          let aValue = a[sortConfig.key];
          let bValue = b[sortConfig.key];
          
          // Handle undefined/null values
          if (aValue === undefined || aValue === null) aValue = '';
          if (bValue === undefined || bValue === null) bValue = '';
          
          // Convert to string for comparison if not already
          if (typeof aValue !== 'string') aValue = String(aValue);
          if (typeof bValue !== 'string') bValue = String(bValue);
          
          // Handle date sorting
          if (sortConfig.key.includes('date') || sortConfig.key.includes('time')) {
            try {
              const aDate = aValue ? new Date(aValue) : new Date(0);
              const bDate = bValue ? new Date(bValue) : new Date(0);
              
              // If either date is invalid, push to bottom
              if (isNaN(aDate.getTime()) && isNaN(bDate.getTime())) return 0;
              if (isNaN(aDate.getTime())) return 1;
              if (isNaN(bDate.getTime())) return -1;
              
              return sortConfig.direction === 'asc' 
                ? aDate.getTime() - bDate.getTime()
                : bDate.getTime() - aDate.getTime();
            } catch (dateError) {
              console.error('Error sorting dates:', dateError);
              return 0; // Don't change order if there's an error
            }
          }
          
          // Numeric comparison for numeric strings or numbers
          if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
            const numA = Number(aValue);
            const numB = Number(bValue);
            return sortConfig.direction === 'asc' 
              ? numA - numB 
              : numB - numA;
          }
          
          // String comparison (case insensitive)
          const aStr = aValue.toLowerCase();
          const bStr = bValue.toLowerCase();
          
          if (aStr < bStr) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aStr > bStr) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
          
        } catch (sortError) {
          console.error('Error during sorting:', sortError);
          return 0; // Maintain original order on error
        }
      });
    }

    setFilteredEvents(filtered);
  } catch (error) {
    console.error('Error filtering and sorting events:', error);
    setFilteredEvents([]);
  }
};

  const handleSort = (key) => {
    try {
      // Validate the key is a non-empty string
      if (typeof key !== 'string' || key.trim() === '') {
        console.warn('Invalid sort key provided');
        return;
      }
      
      // Determine sort direction
      let direction = 'asc';
      if (sortConfig.key === key) {
        // Toggle direction if clicking the same column
        direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
      }
      
      // Update sort configuration with additional metadata
      setSortConfig({ 
        key, 
        direction,
        // Add type hint for special handling in the sort function
        isDate: key.includes('date') || key.includes('time') || key === 'created_at',
        isNumeric: key.includes('id') || key.includes('count') || key.includes('total')
      });
      
    } catch (error) {
      console.error('Error in handleSort:', error);
      // Reset to default sort on error
      setSortConfig({ key: null, direction: 'asc' });
      
      // Show error toast to user
      toast.error('An error occurred while sorting. Please try again.', {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000
      });
    }
  };

  const getSortIcon = (columnName) => {
    if (sortConfig.key === columnName) {
      return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
    }
    return <FaSort />;
  };

  const handleDelete = (event) => {
    if (!event || !event.event_id) {
      console.error('Invalid event data for deletion');
      toast.error('Invalid event data. Cannot delete.', {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000
      });
      return;
    }
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete?.event_id) {
      console.error('No event selected for deletion');
      setShowDeleteModal(false);
      return;
    }

    const toastId = toast.loading('Deleting event...', {
      position: toast.POSITION.BOTTOM_RIGHT
    });
    
    try {
      const result = await eventAPI.deleteEvent(eventToDelete.event_id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete event');
      }
      
      toast.update(toastId, {
        render: 'Event deleted successfully',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
      
      // Refresh the events list
      await fetchData();
      
    } catch (error) {
      console.error('Error deleting event:', error);
      
      toast.update(toastId, {
        render: error.message || 'Failed to delete event. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 5000
      });
    } finally {
      setShowDeleteModal(false);
      setEventToDelete(null);
    }
  };

  const exportToCSV = () => {
    try {
      // Validate we have data to export
      if (!Array.isArray(filteredEvents) || filteredEvents.length === 0) {
        toast.error('No events available to export', {
          position: toast.POSITION.BOTTOM_RIGHT,
          autoClose: 3000
        });
        return;
      }

      // Define CSV columns with their headers and data accessors
      const columns = [
        { header: 'ID', accessor: 'event_id' },
        { header: 'Event Name', accessor: 'event_name' },
        { header: 'Client', accessor: 'client_name' },
        { header: 'Status', accessor: 'event_status' },
        { header: 'Type', accessor: 'event_type_name' },
        { 
          header: 'Start Date', 
          accessor: 'event_start_date',
          formatter: (date) => date ? new Date(date).toLocaleString() : ''
        },
        { 
          header: 'End Date', 
          accessor: 'event_end_date',
          formatter: (date) => date ? new Date(date).toLocaleString() : ''
        },
        { 
          header: 'Created At', 
          accessor: 'created_at',
          formatter: (date) => date ? new Date(date).toLocaleString() : ''
        }
      ];

      // Escape CSV values (handles quotes and commas)
      const escapeCsvValue = (value) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape double quotes by doubling them
        const escaped = stringValue.replace(/"/g, '""');
        // Wrap in quotes if contains comma, newline, or double quote
        if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
          return `"${escaped}"`;
        }
        return escaped;
      };

      // Generate CSV content
      const headerRow = columns.map(col => escapeCsvValue(col.header)).join(',');
      const dataRows = filteredEvents.map(event => {
        return columns.map(col => {
          const value = event[col.accessor];
          const formattedValue = col.formatter ? col.formatter(value) : value;
          return escapeCsvValue(formattedValue);
        }).join(',');
      });

      const csvContent = [headerRow, ...dataRows].join('\n');

      // Create and trigger download with BOM for Excel compatibility
      const blob = new Blob(['\ufeff' + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('hidden', '');
      link.setAttribute('href', url);
      link.setAttribute('download', `events_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      // Show success message
      toast.success(`Exported ${filteredEvents.length} events successfully`, {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000
      });
      
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Failed to export events. Please try again.', {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 5000
      });
    }
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
                  {isCustomerAdmin 
                    ? `Total ${filteredEvents.length} events`
                    : `${filteredEvents.length} of ${events.length}`
                  }
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
                          <div>
                            <a 
                              href={`/events/${event.event_id}`}
                              className="text-decoration-none text-primary fw-semibold"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(`/events/${event.event_id}`);
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              {event.event_name}
                            </a>
                          </div>
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

// Helper function to get fallback event types
const getFallbackEventTypes = () => [
  { event_type_id: 1, event_type_name: 'Conference' },
  { event_type_id: 2, event_type_name: 'Wedding' },
  { event_type_id: 3, event_type_name: 'Corporate' },
  { event_type_id: 4, event_type_name: 'Social Gathering' },
  { event_type_id: 5, event_type_name: 'Workshop' },
  { event_type_id: 6, event_type_name: 'Seminar' }
];

export default EventList;