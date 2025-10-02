import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { 
  FaHotel,
  FaBed,
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaFileExport,
  FaUser,
  FaClock,
  FaSave,
  FaTimes,
  FaInfoCircle,
} from 'react-icons/fa';

const AccommodationManagement = () => {
  const [accommodations, setAccommodations] = useState([]);
  const [accommodationAssignments, setAccommodationAssignments] = useState([]);
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingAccommodation, setEditingAccommodation] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [activeTab, setActiveTab] = useState('accommodations');

  const [accommodationForm, setAccommodationForm] = useState({
    hotel_name: '',
    hotel_address: '',
    hotel_phone: '',
    hotel_email: '',
    room_type: '',
    room_capacity: 1,
    total_rooms: 1,
    available_rooms: 1,
    room_rate: '',
    amenities: '',
    check_in_time: '15:00',
    check_out_time: '11:00',
    hotel_rating: 3,
    distance_from_venue: '',
    notes: ''
  });

  const [assignmentForm, setAssignmentForm] = useState({
    guest_id: '',
    event_id: '',
    accommodation_id: '',
    room_number: '',
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 1,
    special_requirements: '',
    assignment_status: 'Assigned',
    notes: ''
  });

  const roomTypes = [
    'Single', 'Double', 'Twin', 'Triple', 'Suite', 'Deluxe', 'Executive', 'Presidential'
  ];

  const assignmentStatuses = [
    'Assigned', 'Confirmed', 'Checked In', 'Checked Out', 'Cancelled', 'No Show'
  ];

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        accommodationsRes,
        assignmentsRes,
        guestsRes,
        eventsRes
      ] = await Promise.all([
        // Get guest accommodations data
        fetch('/api/comprehensive-crud/guest-accommodation', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        // Get accommodation assignments data (using same endpoint for now)
        fetch('/api/comprehensive-crud/guest-accommodation', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/guests', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/events', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const accommodationsData = accommodationsRes.ok ? await accommodationsRes.json() : [];
      const assignmentsData = assignmentsRes.ok ? await assignmentsRes.json() : [];
      const guestsData = guestsRes.ok ? await guestsRes.json() : [];
      const eventsData = eventsRes.ok ? await eventsRes.json() : [];

      setAccommodations(accommodationsData);
      setAccommodationAssignments(assignmentsData);
      setGuests(guestsData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load accommodation data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAccommodationSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting accommodation form:', accommodationForm);
    
    try {
      const url = editingAccommodation 
        // Accommodations endpoint not available
        ? `/api/comprehensive-crud/guest-accommodation/${editingAccommodation.accommodation_id}`
        : '/api/comprehensive-crud/guest-accommodation';
      
      const method = editingAccommodation ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          guest_id: accommodationForm.guest_id,
          event_id: accommodationForm.event_id,
          venue_id: accommodationForm.venue_id,
          room_id: accommodationForm.room_id,
          check_in_date: accommodationForm.check_in_date,
          check_out_date: accommodationForm.check_out_date,
          accommodation_type: accommodationForm.room_type,
          accommodation_details: accommodationForm.notes,
          allocation_status: 'Assigned',
          allocation_notes: accommodationForm.notes,
          allocation_type: 'planned'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save accommodation');
      }

      toast.success(`Accommodation ${editingAccommodation ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      resetAccommodationForm();
      fetchData();
    } catch (error) {
      console.error('Error saving accommodation:', error);
      toast.error('Failed to save accommodation');
    }
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingAssignment 
        ? `/api/comprehensive-crud/guest-accommodation/${editingAssignment.guest_accommodation_id}`
        : '/api/comprehensive-crud/guest-accommodation';
      
      const method = editingAssignment ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(assignmentForm)
      });

      if (!response.ok) {
        throw new Error('Failed to save assignment');
      }

      toast.success(`Assignment ${editingAssignment ? 'updated' : 'created'} successfully`);
      setShowAssignmentModal(false);
      resetAssignmentForm();
      fetchData();
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast.error('Failed to save assignment');
    }
  };

  const handleDeleteAccommodation = async (accommodationId) => {
    if (!window.confirm('Are you sure you want to delete this accommodation?')) return;

    try {
      // Accommodations endpoint not available
      const response = await fetch(`/api/comprehensive-crud/guest-accommodation/${accommodationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete accommodation');
      }

      toast.success('Accommodation deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting accommodation:', error);
      toast.error('Failed to delete accommodation');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const response = await fetch(`/api/comprehensive-crud/guest-accommodation/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete assignment');
      }

      toast.success('Assignment deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    }
  };

  const resetAccommodationForm = () => {
    setAccommodationForm({
      hotel_name: '',
      hotel_address: '',
      hotel_phone: '',
      hotel_email: '',
      room_type: '',
      room_capacity: 1,
      total_rooms: 1,
      available_rooms: 1,
      room_rate: '',
      amenities: '',
      check_in_time: '15:00',
      check_out_time: '11:00',
      hotel_rating: 3,
      distance_from_venue: '',
      notes: ''
    });
    setEditingAccommodation(null);
  };

  const resetAssignmentForm = () => {
    setAssignmentForm({
      guest_id: '',
      event_id: '',
      accommodation_id: '',
      room_number: '',
      check_in_date: '',
      check_out_date: '',
      number_of_guests: 1,
      special_requirements: '',
      assignment_status: 'Assigned',
      notes: ''
    });
    setEditingAssignment(null);
  };

  const openEditAccommodation = (accommodation) => {
    setEditingAccommodation(accommodation);
    setAccommodationForm({ ...accommodation });
    setShowModal(true);
  };

  const openEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setAssignmentForm({ ...assignment });
    setShowAssignmentModal(true);
  };

  const exportToCSV = () => {
    const data = activeTab === 'accommodations' ? accommodations : accommodationAssignments;
    const headers = activeTab === 'accommodations' 
      ? ['Hotel Name', 'Address', 'Room Type', 'Capacity', 'Available Rooms', 'Rate', 'Rating']
      : ['Guest', 'Event', 'Hotel', 'Room Number', 'Check In', 'Check Out', 'Status'];
    
    const csvContent = [
      headers.join(','),
      ...data.map(item => {
        if (activeTab === 'accommodations') {
          return [
            item.hotel_name,
            item.hotel_address,
            item.room_type,
            item.room_capacity,
            item.available_rooms,
            item.room_rate,
            item.hotel_rating
          ].map(field => `"${field || ''}"`).join(',');
        } else {
          return [
            `${item.guest_first_name || ''} ${item.guest_last_name || ''}`,
            item.event_name || '',
            item.hotel_name || '',
            item.room_number || '',
            item.check_in_date || '',
            item.check_out_date || '',
            item.assignment_status || ''
          ].map(field => `"${field}"`).join(',');
        }
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Confirmed': case 'Checked In': return 'bg-success';
      case 'Assigned': return 'bg-primary';
      case 'Checked Out': return 'bg-info';
      case 'Cancelled': case 'No Show': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getRatingStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const filteredAccommodations = accommodations.filter(accommodation =>
    accommodation.hotel_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    accommodation.hotel_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    accommodation.room_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAssignments = accommodationAssignments.filter(assignment => {
    const matchesSearch = 
      assignment.guest_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.guest_last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.hotel_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.room_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filterStatus || assignment.assignment_status === filterStatus;
    const matchesEvent = !filterEvent || assignment.event_id?.toString() === filterEvent;
    
    return matchesSearch && matchesStatus && matchesEvent;
  });

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading accommodation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-bg min-vh-100 p-4">
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="text-dark fw-bold mb-0">
              <FaHotel className="me-2 text-primary" />
              Accommodation Management
            </h2>
            <p className="text-muted mb-0">Manage hotels and guest accommodation assignments</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={exportToCSV}
            >
              <FaFileExport className="me-2" />
              Export CSV
            </button>
            <button 
              className="btn btn-primary glass-btn-primary"
              onClick={() => {
                if (activeTab === 'accommodations') {
                  resetAccommodationForm();
                  setShowModal(true);
                } else {
                  resetAssignmentForm();
                  setShowAssignmentModal(true);
                }
              }}
            >
              <FaPlus className="me-2" />
              {activeTab === 'accommodations' ? 'Add Accommodation' : 'Assign Guest'}
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="card glass-card mb-4">
          <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'accommodations' ? 'active' : ''}`}
                  onClick={() => setActiveTab('accommodations')}
                >
                  <FaHotel className="me-2" />
                  Accommodations ({accommodations.length})
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'assignments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('assignments')}
                >
                  <FaBed className="me-2" />
                  Assignments ({accommodationAssignments.length})
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Filters */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="input-group">
                  <span className="input-group-text glass-input">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {activeTab === 'assignments' && (
                <>
                  <div className="col-md-3">
                    <select
                      className="form-select glass-input"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      {assignmentStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
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
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'accommodations' ? (
          <div className="card glass-card">
            <div className="card-body">
              {filteredAccommodations.length === 0 ? (
                <div className="text-center py-5">
                  <FaHotel className="text-muted mb-3" size={48} />
                  <h5 className="text-muted">No accommodations found</h5>
                  <p className="text-muted mb-3">Add accommodations to manage guest stays.</p>
                  <button 
                    className="btn btn-primary glass-btn-primary"
                    onClick={() => { resetAccommodationForm(); setShowModal(true); }}
                  >
                    Add First Accommodation
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Hotel Details</th>
                        <th>Room Info</th>
                        <th>Capacity</th>
                        <th>Rate</th>
                        <th>Rating</th>
                        <th>Contact</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccommodations.map((accommodation) => (
                        <tr key={accommodation.accommodation_id}>
                          <td>
                            <div className="fw-semibold">{accommodation.hotel_name}</div>
                            <small className="text-muted">
                              <FaMapMarkerAlt className="me-1" />
                              {accommodation.hotel_address}
                            </small>
                            {accommodation.distance_from_venue && (
                              <div>
                                <small className="text-info">
                                  {accommodation.distance_from_venue} from venue
                                </small>
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="fw-semibold">{accommodation.room_type}</div>
                            <small className="text-muted">
                              Check-in: {accommodation.check_in_time}<br/>
                              Check-out: {accommodation.check_out_time}
                            </small>
                          </td>
                          <td>
                            <div className="fw-semibold">
                              <FaUsers className="me-1" />
                              {accommodation.room_capacity} per room
                            </div>
                            <small className="text-muted">
                              {accommodation.available_rooms}/{accommodation.total_rooms} available
                            </small>
                          </td>
                          <td>
                            {accommodation.room_rate ? (
                              <span className="fw-semibold text-success">
                                ${accommodation.room_rate}
                              </span>
                            ) : (
                              <span className="text-muted">Not specified</span>
                            )}
                          </td>
                          <td>
                            <div className="text-warning">
                              {getRatingStars(accommodation.hotel_rating || 3)}
                            </div>
                          </td>
                          <td>
                            {accommodation.hotel_phone && (
                              <div>
                                <FaPhoneAlt className="me-1 text-muted" />
                                <small>{accommodation.hotel_phone}</small>
                              </div>
                            )}
                            {accommodation.hotel_email && (
                              <div>
                                <FaEnvelope className="me-1 text-muted" />
                                <small>{accommodation.hotel_email}</small>
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-outline-primary glass-btn"
                                onClick={() => openEditAccommodation(accommodation)}
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger glass-btn"
                                onClick={() => handleDeleteAccommodation(accommodation.accommodation_id)}
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card glass-card">
            <div className="card-body">
              {filteredAssignments.length === 0 ? (
                <div className="text-center py-5">
                  <FaBed className="text-muted mb-3" size={48} />
                  <h5 className="text-muted">No assignments found</h5>
                  <p className="text-muted mb-3">Assign guests to accommodations.</p>
                  <button 
                    className="btn btn-primary glass-btn-primary"
                    onClick={() => { resetAssignmentForm(); setShowAssignmentModal(true); }}
                  >
                    Create First Assignment
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Guest</th>
                        <th>Event</th>
                        <th>Accommodation</th>
                        <th>Room</th>
                        <th>Dates</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssignments.map((assignment) => (
                        <tr key={assignment.assignment_id}>
                          <td>
                            <div className="fw-semibold">
                              <FaUser className="me-1" />
                              {assignment.guest_first_name} {assignment.guest_last_name}
                            </div>
                            {assignment.guest_email && (
                              <small className="text-muted">{assignment.guest_email}</small>
                            )}
                          </td>
                          <td>
                            <div className="fw-semibold">{assignment.event_name}</div>
                          </td>
                          <td>
                            <div className="fw-semibold">{assignment.hotel_name}</div>
                            <small className="text-muted">{assignment.room_type}</small>
                          </td>
                          <td>
                            <div className="fw-semibold">
                              Room {assignment.room_number}
                            </div>
                            <small className="text-muted">
                              {assignment.number_of_guests} guest(s)
                            </small>
                          </td>
                          <td>
                            <div>
                              <FaClock className="me-1 text-muted" />
                              <small>
                                {assignment.check_in_date ? 
                                  new Date(assignment.check_in_date).toLocaleDateString() : 'TBD'
                                }
                              </small>
                            </div>
                            <div>
                              <small className="text-muted">
                                to {assignment.check_out_date ? 
                                  new Date(assignment.check_out_date).toLocaleDateString() : 'TBD'
                                }
                              </small>
                            </div>
                          </td>
                          <td>
                            <span className={`badge glass-badge ${getStatusBadgeClass(assignment.assignment_status)}`}>
                              {assignment.assignment_status}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-outline-primary glass-btn"
                                onClick={() => openEditAssignment(assignment)}
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger glass-btn"
                                onClick={() => handleDeleteAssignment(assignment.assignment_id)}
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
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

        {/* Accommodation Modal */}
        {showModal && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-backdrop fade show"></div>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content glass-modal">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FaHotel className="me-2" />
                    {editingAccommodation ? 'Edit Accommodation' : 'Add Accommodation'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleAccommodationSubmit}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Hotel Name *</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={accommodationForm.hotel_name}
                          onChange={(e) => setAccommodationForm({...accommodationForm, hotel_name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Room Type *</label>
                        <select
                          className="form-select glass-input"
                          value={accommodationForm.room_type}
                          onChange={(e) => setAccommodationForm({...accommodationForm, room_type: e.target.value})}
                          required
                        >
                          <option value="">Select Room Type</option>
                          {roomTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Address</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={accommodationForm.hotel_address}
                          onChange={(e) => setAccommodationForm({...accommodationForm, hotel_address: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Phone</label>
                        <input
                          type="tel"
                          className="form-control glass-input"
                          value={accommodationForm.hotel_phone}
                          onChange={(e) => setAccommodationForm({...accommodationForm, hotel_phone: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Email</label>
                        <input
                          type="email"
                          className="form-control glass-input"
                          value={accommodationForm.hotel_email}
                          onChange={(e) => setAccommodationForm({...accommodationForm, hotel_email: e.target.value})}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Room Capacity</label>
                        <input
                          type="number"
                          className="form-control glass-input"
                          min="1"
                          value={accommodationForm.room_capacity}
                          onChange={(e) => setAccommodationForm({...accommodationForm, room_capacity: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Total Rooms</label>
                        <input
                          type="number"
                          className="form-control glass-input"
                          min="1"
                          value={accommodationForm.total_rooms}
                          onChange={(e) => setAccommodationForm({...accommodationForm, total_rooms: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Available Rooms</label>
                        <input
                          type="number"
                          className="form-control glass-input"
                          min="0"
                          value={accommodationForm.available_rooms}
                          onChange={(e) => setAccommodationForm({...accommodationForm, available_rooms: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Room Rate</label>
                        <input
                          type="number"
                          className="form-control glass-input"
                          step="0.01"
                          value={accommodationForm.room_rate}
                          onChange={(e) => setAccommodationForm({...accommodationForm, room_rate: e.target.value})}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Hotel Rating</label>
                        <select
                          className="form-select glass-input"
                          value={accommodationForm.hotel_rating}
                          onChange={(e) => setAccommodationForm({...accommodationForm, hotel_rating: parseInt(e.target.value)})}
                        >
                          <option value="1">1 Star</option>
                          <option value="2">2 Stars</option>
                          <option value="3">3 Stars</option>
                          <option value="4">4 Stars</option>
                          <option value="5">5 Stars</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Distance from Venue</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          placeholder="e.g., 2.5 km"
                          value={accommodationForm.distance_from_venue}
                          onChange={(e) => setAccommodationForm({...accommodationForm, distance_from_venue: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Check-in Time</label>
                        <input
                          type="time"
                          className="form-control glass-input"
                          value={accommodationForm.check_in_time}
                          onChange={(e) => setAccommodationForm({...accommodationForm, check_in_time: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Check-out Time</label>
                        <input
                          type="time"
                          className="form-control glass-input"
                          value={accommodationForm.check_out_time}
                          onChange={(e) => setAccommodationForm({...accommodationForm, check_out_time: e.target.value})}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Amenities</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          placeholder="WiFi, Pool, Gym, Spa, etc."
                          value={accommodationForm.amenities}
                          onChange={(e) => setAccommodationForm({...accommodationForm, amenities: e.target.value})}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Notes</label>
                        <textarea
                          className="form-control glass-input"
                          rows="3"
                          value={accommodationForm.notes}
                          onChange={(e) => setAccommodationForm({...accommodationForm, notes: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary glass-btn"
                      onClick={() => setShowModal(false)}
                    >
                      <FaTimes className="me-2" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary glass-btn-primary"
                    >
                      <FaSave className="me-2" />
                      {editingAccommodation ? 'Update' : 'Save'} Accommodation
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Modal */}
        {showAssignmentModal && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-backdrop fade show"></div>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content glass-modal">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FaBed className="me-2" />
                    {editingAssignment ? 'Edit Assignment' : 'Assign Guest to Accommodation'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAssignmentModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleAssignmentSubmit}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Guest *</label>
                        <select
                          className="form-select glass-input"
                          value={assignmentForm.guest_id}
                          onChange={(e) => setAssignmentForm({...assignmentForm, guest_id: e.target.value})}
                          required
                        >
                          <option value="">Select Guest</option>
                          {guests.map(guest => (
                            <option key={guest.guest_id} value={guest.guest_id}>
                              {guest.guest_first_name} {guest.guest_last_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Event *</label>
                        <select
                          className="form-select glass-input"
                          value={assignmentForm.event_id}
                          onChange={(e) => setAssignmentForm({...assignmentForm, event_id: e.target.value})}
                          required
                        >
                          <option value="">Select Event</option>
                          {events.map(event => (
                            <option key={event.event_id} value={event.event_id}>
                              {event.event_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Accommodation *</label>
                        <select
                          className="form-select glass-input"
                          value={assignmentForm.accommodation_id}
                          onChange={(e) => setAssignmentForm({...assignmentForm, accommodation_id: e.target.value})}
                          required
                        >
                          <option value="">Select Accommodation</option>
                          {accommodations.map(accommodation => (
                            <option key={accommodation.accommodation_id} value={accommodation.accommodation_id}>
                              {accommodation.hotel_name} - {accommodation.room_type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Room Number</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={assignmentForm.room_number}
                          onChange={(e) => setAssignmentForm({...assignmentForm, room_number: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Check-in Date</label>
                        <input
                          type="date"
                          className="form-control glass-input"
                          value={assignmentForm.check_in_date}
                          onChange={(e) => setAssignmentForm({...assignmentForm, check_in_date: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Check-out Date</label>
                        <input
                          type="date"
                          className="form-control glass-input"
                          value={assignmentForm.check_out_date}
                          onChange={(e) => setAssignmentForm({...assignmentForm, check_out_date: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Number of Guests</label>
                        <input
                          type="number"
                          className="form-control glass-input"
                          min="1"
                          value={assignmentForm.number_of_guests}
                          onChange={(e) => setAssignmentForm({...assignmentForm, number_of_guests: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Status</label>
                        <select
                          className="form-select glass-input"
                          value={assignmentForm.assignment_status}
                          onChange={(e) => setAssignmentForm({...assignmentForm, assignment_status: e.target.value})}
                        >
                          {assignmentStatuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Special Requirements</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          placeholder="e.g., Ground floor, Accessible room"
                          value={assignmentForm.special_requirements}
                          onChange={(e) => setAssignmentForm({...assignmentForm, special_requirements: e.target.value})}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Notes</label>
                        <textarea
                          className="form-control glass-input"
                          rows="3"
                          value={assignmentForm.notes}
                          onChange={(e) => setAssignmentForm({...assignmentForm, notes: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary glass-btn"
                      onClick={() => setShowAssignmentModal(false)}
                    >
                      <FaTimes className="me-2" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary glass-btn-primary"
                    >
                      <FaSave className="me-2" />
                      {editingAssignment ? 'Update' : 'Create'} Assignment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccommodationManagement;