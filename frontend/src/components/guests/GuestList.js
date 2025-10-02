import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
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
  FaUpload,
  FaUsers,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaFilter,
  FaUserFriends,
  FaArrowLeft
} from 'react-icons/fa';

const GuestList = () => {
  const [guests, setGuests] = useState([]);
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [clients, setClients] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [travels, setTravels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [rsvpFilter, setRsvpFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [guestTypeFilter, setGuestTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const subeventId = searchParams.get('subeventId');

  // RSVP status options
  const rsvpStatusOptions = ['Pending', 'Confirmed', 'Declined', 'Tentative'];
  const guestTypeOptions = ['Individual', 'Family', 'Corporate', 'VIP', 'Media'];

  useEffect(() => {
    fetchData();
  }, [eventId, subeventId, eventFilter, fetchData]);

  useEffect(() => {
    filterAndSortGuests();
  }, [guests, searchTerm, sortConfig, rsvpFilter, eventFilter, customerFilter, clientFilter, guestTypeFilter]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      let guestsUrl = '/api/guests';
      
      // Filter by event or subevent if specified
      const params = new URLSearchParams();
      if (eventId) params.append('event_id', eventId);
      if (subeventId) params.append('subevent_id', subeventId);
      if (clientFilter !== 'all') params.append('client_id', clientFilter);
      if (params.toString()) {
        guestsUrl += `?${params.toString()}`;
      }

      const promises = [
        fetch(guestsUrl, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json()),
        fetch('/api/events', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json()),
        fetch('/api/customers', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json()),
        fetch('/api/clients', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json())
      ];

      if (eventFilter !== 'all') {
        promises.push(api.get(`/comprehensive-crud/guest-accommodation?event_id=${eventFilter}`).then(res => res.data).catch(() => []));
        promises.push(api.get(`/comprehensive-crud/guest-travel?event_id=${eventFilter}`).then(res => res.data).catch(() => []));
      } else {
        setAccommodations([]);
        setTravels([]);
      }

      const [guestsResponse, eventsResponse, customersResponse, clientsResponse, accommodationResponse, travelResponse] = await Promise.all(promises);
      
      setGuests(guestsResponse.data || guestsResponse || []);
      setEvents(eventsResponse.data || eventsResponse || []);
      setCustomers(customersResponse.data || customersResponse || []);
      setClients(clientsResponse.data || clientsResponse || []);
      if (accommodationResponse) setAccommodations(accommodationResponse || []);
      if (travelResponse) setTravels(travelResponse || []);
    } catch (error) {
      console.error('Error fetching guests data:', error);
      toast.error('Failed to fetch guests data');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, subeventId]);

  const filterAndSortGuests = useCallback(() => {
    let filtered = [...guests];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(guest =>
        `${guest.guest_first_name} ${guest.guest_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.guest_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.guest_phone?.includes(searchTerm) ||
        guest.guest_organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply RSVP filter
    if (rsvpFilter !== 'all') {
      filtered = filtered.filter(guest => guest.guest_rsvp_status === rsvpFilter);
    }

    // Apply event filter
    if (eventFilter !== 'all') {
      filtered = filtered.filter(guest => guest.event_id === parseInt(eventFilter));
    }

    // Apply customer filter
    if (customerFilter !== 'all') {
      filtered = filtered.filter(guest => guest.customer_id === parseInt(customerFilter));
    }

    // Apply client filter
    if (clientFilter !== 'all') {
      filtered = filtered.filter(guest => guest.client_id === parseInt(clientFilter));
    }

    // Apply guest type filter
    if (guestTypeFilter !== 'all') {
      filtered = filtered.filter(guest => guest.guest_type === guestTypeFilter);
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key] || '';
        let bValue = b[sortConfig.key] || '';
        
        // Handle name sorting
        if (sortConfig.key === 'guest_name') {
          aValue = `${a.guest_first_name} ${a.guest_last_name}`;
          bValue = `${b.guest_first_name} ${b.guest_last_name}`;
        }
        
        // Handle date sorting
        if (sortConfig.key.includes('date')) {
          aValue = aValue ? new Date(aValue) : new Date(0);
          bValue = bValue ? new Date(bValue) : new Date(0);
          return sortConfig.direction === 'asc' 
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
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

    setFilteredGuests(filtered);
  }, [guests, searchTerm, sortConfig, rsvpFilter, eventFilter, customerFilter, guestTypeFilter]);

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

  const handleDelete = (guest) => {
    setGuestToDelete(guest);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/guests/${guestToDelete.guest_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete guest');
      }

      toast.success('Guest deleted successfully');
      fetchData();
      setShowDeleteModal(false);
      setGuestToDelete(null);
    } catch (error) {
      console.error('Error deleting guest:', error);
      toast.error('Failed to delete guest');
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Organization', 'Customer', 'Event', 'RSVP Status', 'Guest Type', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...filteredGuests.map(guest => [
        guest.guest_id,
        `"${guest.guest_first_name} ${guest.guest_last_name}"`,
        `"${guest.guest_email || ''}"`,
        `"${guest.guest_phone || ''}"`,
        `"${guest.guest_organization || ''}"`,
        `"${guest.customer_name || ''}"`,
        `"${guest.event_name || ''}"`,
        guest.guest_rsvp_status || 'Pending',
        guest.guest_type || '',
        guest.created_at ? new Date(guest.created_at).toLocaleDateString() : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `guests_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getRSVPBadgeClass = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-success';
      case 'Declined': return 'bg-danger';
      case 'Tentative': return 'bg-warning';
      default: return 'bg-secondary';
    }
  };

  const getGuestTypeBadgeClass = (type) => {
    switch (type) {
      case 'VIP': return 'bg-warning';
      case 'Corporate': return 'bg-info';
      case 'Family': return 'bg-success';
      case 'Media': return 'bg-primary';
      default: return 'bg-secondary';
    }
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
            {(eventId || subeventId) && (
              <button 
                className="btn btn-outline-secondary glass-btn me-3"
                onClick={() => eventId 
                  ? navigate(`/events/${eventId}`)
                  : navigate(`/subevents/${subeventId}`)
                }
              >
                <FaArrowLeft />
              </button>
            )}
            <div>
              <h2 className="text-dark fw-bold mb-0">
                {eventId ? 'Event Guests' : subeventId ? 'Sub Event Guests' : 'Guest Management'}
              </h2>
              <p className="text-muted">
                {eventId ? 'Manage guests for this event' : 
                 subeventId ? 'Manage guests for this sub event' :
                 'Manage all guests across events'}
              </p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-success glass-btn"
              onClick={() => navigate(`/guests/import${eventId ? `?eventId=${eventId}` : ''}`)}
              title="Import Guests"
            >
              <FaUpload className="me-2" />
              Import
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
              onClick={() => navigate(`/guests/create${eventId ? `?eventId=${eventId}` : ''}`)}
              data-testid="add-guest-button"
              style={{ fontWeight: 'bold', padding: '0.6rem 1.2rem' }}
            >
              <FaPlus className="me-2" />
              Add Guest
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
                    placeholder="Search guests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-lg-2">
                <select
                  className="form-select glass-input"
                  value={rsvpFilter}
                  onChange={(e) => setRsvpFilter(e.target.value)}
                >
                  <option value="all">All RSVP Status</option>
                  {rsvpStatusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              {!eventId && (
                <div className="col-lg-2">
                  <select
                    className="form-select glass-input"
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                  >
                    <option value="all">All Events</option>
                    {events.map(event => (
                      <option key={event.event_id} value={event.event_id}>
                        {event.event_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="col-lg-2">
                <select
                  className="form-select glass-input"
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                >
                  <option value="all">All Customers</option>
                  {customers.map(customer => (
                    <option key={customer.customer_id} value={customer.customer_id}>
                      {customer.customer_name}
                    </option>
                  ))}
                </select>
              </div>
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
              <div className="col-lg-2">
                <select
                  className="form-select glass-input"
                  value={guestTypeFilter}
                  onChange={(e) => setGuestTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  {guestTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="col-lg-1">
                <div className="text-muted small d-flex align-items-center justify-content-end">
                  <FaUsers className="me-1" />
                  {filteredGuests.length} of {guests.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Guests Table */}
        <div className="table-container glass-table">
          <table className="table table-hover">
            <thead>
              <tr>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('event_name')}
                  style={{ cursor: 'pointer' }}
                >
                  Event {getSortIcon('event_name')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('guest_name')}
                  style={{ cursor: 'pointer' }}
                >
                  Guest Name {getSortIcon('guest_name')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('guest_email')}
                  style={{ cursor: 'pointer' }}
                >
                  Contact {getSortIcon('guest_email')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('guest_rsvp_status')}
                  style={{ cursor: 'pointer' }}
                >
                  RSVP Status {getSortIcon('guest_rsvp_status')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('guest_type')}
                  style={{ cursor: 'pointer' }}
                >
                  Type {getSortIcon('guest_type')}
                </th>
                <th scope="col">Additional Guests</th>
                <th scope="col">Special Requirements</th>
                {eventFilter !== 'all' && (
                  <>
                    <th>Travel Date</th>
                    <th>Accommodation</th>
                  </>
                )}
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    <div className="text-muted">
                      {searchTerm || rsvpFilter !== 'all' || eventFilter !== 'all' || customerFilter !== 'all' || guestTypeFilter !== 'all'
                        ? 'No guests match your filters'
                        : 'No guests found. Add your first guest!'
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => (
                  <tr key={guest.guest_id}>
                    <td>
                      {guest.event_name ? (
                        <span className="badge bg-primary glass-badge">
                          {guest.event_name}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="fw-semibold">
                      <div className="d-flex align-items-center">
                        <FaUsers className="text-primary me-2" />
                        <div>
                          <Link to={`/guests/${guest.guest_id}`}>{guest.guest_first_name} {guest.guest_last_name}</Link>
                          {guest.guest_designation && (
                            <small className="text-muted">{guest.guest_designation}</small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        {guest.guest_email && (
                          <div className="d-flex align-items-center mb-1">
                            <FaEnvelope className="text-muted me-1" size={12} />
                            <small>{guest.guest_email}</small>
                          </div>
                        )}
                        {guest.guest_phone && (
                          <div className="d-flex align-items-center">
                            <FaPhone className="text-muted me-1" size={12} />
                            <small>{guest.guest_phone}</small>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge glass-badge ${getRSVPBadgeClass(guest.guest_rsvp_status)}`}>
                        {guest.guest_rsvp_status || 'Pending'}
                      </span>
                    </td>
                    <td>
                      {guest.guest_type ? (
                        <span className={`badge glass-badge ${getGuestTypeBadgeClass(guest.guest_type)}`}>
                          {guest.guest_type}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>{guest.additional_guests || 0}</td>
                    <td>{guest.guest_special_requirements || '-'}</td>
                    {eventFilter !== 'all' && (
                      <>
                        <td>
                          {travels.find(t => t.guest_id === guest.guest_id)?.travel_datetime || '-'}
                        </td>
                        <td>
                          {accommodations.find(a => a.guest_id === guest.guest_id)?.hotel_name || '-'}
                          <br />
                          <small>{accommodations.find(a => a.guest_id === guest.guest_id)?.room_number || ''}</small>
                        </td>
                      </>
                    )}
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-info glass-btn"
                          onClick={() => navigate(`/guests/${guest.guest_id}`)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary glass-btn"
                          onClick={() => navigate(`/guests/${guest.guest_id}/edit`)}
                          title="Edit Guest"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger glass-btn"
                          onClick={() => handleDelete(guest)}
                          title="Delete Guest"
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
                    <p>Are you sure you want to delete guest <strong>{guestToDelete?.guest_first_name} {guestToDelete?.guest_last_name}</strong>?</p>
                    <div className="alert alert-warning">
                      <strong>Warning:</strong> This will also delete all related RSVP responses, subevent allocations, and other associated data.
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
                      Delete Guest
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

export default GuestList;