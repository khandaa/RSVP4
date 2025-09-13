import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaPlane, 
  FaTrain,
  FaCar,
  FaBus,
  FaShip,
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
  FaSave,
  FaTimes
} from 'react-icons/fa';

const TravelManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const guestId = searchParams.get('guestId');

  const [travelRecords, setTravelRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [travelModeFilter, setTravelModeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEventFilter, setSelectedEventFilter] = useState(eventId || 'all');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    guest_id: guestId || '',
    event_id: eventId || '',
    travel_mode: 'Flight',
    departure_location: '',
    arrival_location: '',
    departure_datetime: '',
    arrival_datetime: '',
    travel_reference: '',
    carrier_name: '',
    seat_preference: '',
    special_requirements: '',
    travel_status: 'Booked',
    booking_reference: '',
    cost: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  const travelModes = [
    { value: 'Flight', icon: FaPlane, label: 'Flight' },
    { value: 'Train', icon: FaTrain, label: 'Train' },
    { value: 'Car', icon: FaCar, label: 'Car' },
    { value: 'Bus', icon: FaBus, label: 'Bus' },
    { value: 'Ship', icon: FaShip, label: 'Ship/Ferry' }
  ];

  const statusOptions = ['Booked', 'Confirmed', 'In Transit', 'Arrived', 'Cancelled', 'Delayed'];

  useEffect(() => {
    fetchData();
  }, [eventId, guestId, fetchData]);

  useEffect(() => {
    filterAndSortRecords();
  }, [travelRecords, searchTerm, sortConfig, travelModeFilter, statusFilter, selectedEventFilter, filterAndSortRecords]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      let travelUrl = '/api/crud/guest-travel-info';
      
      const params = new URLSearchParams();
      if (eventId) params.append('event_id', eventId);
      if (guestId) params.append('guest_id', guestId);
      if (params.toString()) travelUrl += `?${params.toString()}`;

      const [travelResponse, guestsResponse, eventsResponse] = await Promise.all([
        fetch(travelUrl, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json()),
        fetch('/api/guests', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json()),
        fetch('/api/events', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json())
      ]);
      
      setTravelRecords(travelResponse || []);
      setGuests(guestsResponse.data || guestsResponse || []);
      setEvents(eventsResponse.data || eventsResponse || []);
    } catch (error) {
      console.error('Error fetching travel data:', error);
      toast.error('Failed to fetch travel data');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, guestId]);

  const filterAndSortRecords = useCallback(() => {
    let filtered = [...travelRecords];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.departure_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.arrival_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.carrier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.travel_reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (travelModeFilter !== 'all') {
      filtered = filtered.filter(record => record.travel_mode === travelModeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.travel_status === statusFilter);
    }

    if (selectedEventFilter !== 'all') {
      filtered = filtered.filter(record => record.event_id === parseInt(selectedEventFilter));
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

    setFilteredRecords(filtered);
  }, [travelRecords, searchTerm, sortConfig, travelModeFilter, statusFilter, selectedEventFilter]);

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

  const resetForm = () => {
    setFormData({
      guest_id: guestId || '',
      event_id: eventId || '',
      travel_mode: 'Flight',
      departure_location: '',
      arrival_location: '',
      departure_datetime: '',
      arrival_datetime: '',
      travel_reference: '',
      carrier_name: '',
      seat_preference: '',
      special_requirements: '',
      travel_status: 'Booked',
      booking_reference: '',
      cost: '',
      notes: ''
    });
    setErrors({});
  };

  const handleCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      guest_id: record.guest_id?.toString() || '',
      event_id: record.event_id?.toString() || '',
      travel_mode: record.travel_mode || 'Flight',
      departure_location: record.departure_location || '',
      arrival_location: record.arrival_location || '',
      departure_datetime: record.departure_datetime ? 
        new Date(record.departure_datetime).toISOString().slice(0, 16) : '',
      arrival_datetime: record.arrival_datetime ? 
        new Date(record.arrival_datetime).toISOString().slice(0, 16) : '',
      travel_reference: record.travel_reference || '',
      carrier_name: record.carrier_name || '',
      seat_preference: record.seat_preference || '',
      special_requirements: record.special_requirements || '',
      travel_status: record.travel_status || 'Booked',
      booking_reference: record.booking_reference || '',
      cost: record.cost?.toString() || '',
      notes: record.notes || ''
    });
    setErrors({});
    setShowEditModal(true);
  };

  const handleDelete = (record) => {
    setSelectedRecord(record);
    setShowDeleteModal(true);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.guest_id) {
      newErrors.guest_id = 'Guest is required';
    }

    if (!formData.event_id) {
      newErrors.event_id = 'Event is required';
    }

    if (!formData.departure_location.trim()) {
      newErrors.departure_location = 'Departure location is required';
    }

    if (!formData.arrival_location.trim()) {
      newErrors.arrival_location = 'Arrival location is required';
    }

    // Date validation
    if (formData.departure_datetime && formData.arrival_datetime) {
      const departureDate = new Date(formData.departure_datetime);
      const arrivalDate = new Date(formData.arrival_datetime);
      
      if (arrivalDate <= departureDate) {
        newErrors.arrival_datetime = 'Arrival time must be after departure time';
      }
    }

    // Cost validation
    if (formData.cost && (isNaN(formData.cost) || parseFloat(formData.cost) < 0)) {
      newErrors.cost = 'Cost must be a valid positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (isEdit = false) => {
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        guest_id: parseInt(formData.guest_id),
        event_id: parseInt(formData.event_id),
        cost: formData.cost ? parseFloat(formData.cost) : null
      };

      const url = isEdit 
        ? `/api/crud/guest-travel-info/${selectedRecord.travel_id}`
        : '/api/crud/guest-travel-info';
      
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEdit ? 'update' : 'create'} travel record`);
      }

      toast.success(`Travel record ${isEdit ? 'updated' : 'created'} successfully`);
      fetchData();
      setShowCreateModal(false);
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} travel record:`, error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} travel record`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/crud/guest-travel-info/${selectedRecord.travel_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete travel record');
      }

      toast.success('Travel record deleted successfully');
      fetchData();
      setShowDeleteModal(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error('Error deleting travel record:', error);
      toast.error('Failed to delete travel record');
    }
  };

  const exportToCSV = () => {
    const headers = ['Guest', 'Event', 'Travel Mode', 'From', 'To', 'Departure', 'Arrival', 'Carrier', 'Reference', 'Status', 'Cost'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => [
        `"${record.guest_name || ''}"`,
        `"${record.event_name || ''}"`,
        record.travel_mode || '',
        `"${record.departure_location || ''}"`,
        `"${record.arrival_location || ''}"`,
        record.departure_datetime ? new Date(record.departure_datetime).toLocaleString() : '',
        record.arrival_datetime ? new Date(record.arrival_datetime).toLocaleString() : '',
        `"${record.carrier_name || ''}"`,
        `"${record.travel_reference || ''}"`,
        record.travel_status || '',
        record.cost || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `travel_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getTravelModeIcon = (mode) => {
    const modeData = travelModes.find(m => m.value === mode);
    if (!modeData) return FaPlane;
    return modeData.icon;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-success';
      case 'In Transit': return 'bg-warning';
      case 'Arrived': return 'bg-success';
      case 'Cancelled': return 'bg-danger';
      case 'Delayed': return 'bg-warning';
      default: return 'bg-primary';
    }
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return '-';
    return new Date(datetime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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
            {(eventId || guestId) && (
              <button 
                className="btn btn-outline-secondary glass-btn me-3"
                onClick={() => eventId 
                  ? navigate(`/events/${eventId}`)
                  : navigate(`/guests/${guestId}`)
                }
              >
                <FaArrowLeft />
              </button>
            )}
            <div>
              <h2 className="text-dark fw-bold mb-0">Travel Management</h2>
              <p className="text-muted">
                {eventId ? 'Manage travel for event guests' : 
                 guestId ? 'Manage travel for guest' :
                 'Manage guest travel information'}
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
              onClick={handleCreate}
            >
              <FaPlus className="me-2" />
              Add Travel Info
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
                    placeholder="Search travel records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-lg-2">
                <select
                  className="form-select glass-input"
                  value={travelModeFilter}
                  onChange={(e) => setTravelModeFilter(e.target.value)}
                >
                  <option value="all">All Travel Modes</option>
                  {travelModes.map(mode => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
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
              {!eventId && (
                <div className="col-lg-2">
                  <select
                    className="form-select glass-input"
                    value={selectedEventFilter}
                    onChange={(e) => setSelectedEventFilter(e.target.value)}
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
              <div className="col-lg-3 text-end">
                <div className="text-muted small d-flex align-items-center justify-content-end">
                  <FaPlane className="me-1" />
                  {filteredRecords.length} of {travelRecords.length} records
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Travel Records Table */}
        <div className="table-container glass-table">
          <table className="table table-hover">
            <thead>
              <tr>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('travel_id')}
                  style={{ cursor: 'pointer' }}
                >
                  ID {getSortIcon('travel_id')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('guest_name')}
                  style={{ cursor: 'pointer' }}
                >
                  Guest {getSortIcon('guest_name')}
                </th>
                {!eventId && (
                  <th 
                    scope="col" 
                    className="sortable" 
                    onClick={() => handleSort('event_name')}
                    style={{ cursor: 'pointer' }}
                  >
                    Event {getSortIcon('event_name')}
                  </th>
                )}
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('travel_mode')}
                  style={{ cursor: 'pointer' }}
                >
                  Mode {getSortIcon('travel_mode')}
                </th>
                <th scope="col">Route</th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('departure_datetime')}
                  style={{ cursor: 'pointer' }}
                >
                  Departure {getSortIcon('departure_datetime')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('arrival_datetime')}
                  style={{ cursor: 'pointer' }}
                >
                  Arrival {getSortIcon('arrival_datetime')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('travel_status')}
                  style={{ cursor: 'pointer' }}
                >
                  Status {getSortIcon('travel_status')}
                </th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={eventId ? "8" : "9"} className="text-center py-4">
                    <div className="text-muted">
                      {searchTerm || travelModeFilter !== 'all' || statusFilter !== 'all' || selectedEventFilter !== 'all'
                        ? 'No travel records match your filters'
                        : 'No travel records found. Add travel information for guests!'
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const TravelIcon = getTravelModeIcon(record.travel_mode);
                  return (
                    <tr key={record.travel_id}>
                      <td>#{record.travel_id}</td>
                      <td className="fw-semibold">
                        <div className="d-flex align-items-center">
                          <FaUsers className="text-primary me-2" />
                          <div>
                            <div>{record.guest_name}</div>
                            {record.travel_reference && (
                              <small className="text-muted">Ref: {record.travel_reference}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      {!eventId && (
                        <td>
                          <span className="badge bg-info glass-badge">
                            {record.event_name}
                          </span>
                        </td>
                      )}
                      <td>
                        <div className="d-flex align-items-center">
                          <TravelIcon className="text-primary me-2" />
                          <div>
                            <div>{record.travel_mode}</div>
                            {record.carrier_name && (
                              <small className="text-muted">{record.carrier_name}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaMapMarkerAlt className="text-muted me-1" size={12} />
                          <div>
                            <div className="fw-semibold">{record.departure_location}</div>
                            <small className="text-muted">to {record.arrival_location}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaClock className="text-muted me-1" size={12} />
                          <small>{formatDateTime(record.departure_datetime)}</small>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaClock className="text-muted me-1" size={12} />
                          <small>{formatDateTime(record.arrival_datetime)}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`badge glass-badge ${getStatusBadgeClass(record.travel_status)}`}>
                          {record.travel_status}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-outline-info glass-btn"
                            onClick={() => navigate(`/logistics/travel/${record.travel_id}`)}
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary glass-btn"
                            onClick={() => handleEdit(record)}
                            title="Edit Travel Info"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger glass-btn"
                            onClick={() => handleDelete(record)}
                            title="Delete Travel Info"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <TravelFormModal
            show={showCreateModal}
            onHide={() => setShowCreateModal(false)}
            title="Add Travel Information"
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            guests={guests}
            events={events}
            travelModes={travelModes}
            statusOptions={statusOptions}
            onSubmit={() => handleSubmit(false)}
            isSubmitting={isSubmitting}
            eventId={eventId}
            guestId={guestId}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <TravelFormModal
            show={showEditModal}
            onHide={() => setShowEditModal(false)}
            title="Edit Travel Information"
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            guests={guests}
            events={events}
            travelModes={travelModes}
            statusOptions={statusOptions}
            onSubmit={() => handleSubmit(true)}
            isSubmitting={isSubmitting}
            eventId={eventId}
            guestId={guestId}
          />
        )}

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
                    <p>Are you sure you want to delete the travel record for <strong>{selectedRecord?.guest_name}</strong>?</p>
                    <div className="alert alert-warning">
                      <strong>Travel Details:</strong>
                      <ul className="mb-0 mt-2">
                        <li>Mode: {selectedRecord?.travel_mode}</li>
                        <li>Route: {selectedRecord?.departure_location} → {selectedRecord?.arrival_location}</li>
                        <li>Reference: {selectedRecord?.travel_reference || 'None'}</li>
                      </ul>
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
                      Delete Travel Record
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

// Travel Form Modal Component
const TravelFormModal = ({ 
  show, 
  onHide, 
  title, 
  formData, 
  setFormData, 
  errors, 
  guests, 
  events, 
  travelModes, 
  statusOptions, 
  onSubmit, 
  isSubmitting, 
  eventId, 
  guestId 
}) => {
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
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
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content glass-modal">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onHide}></button>
            </div>
            <div className="modal-body">
              <form>
                <div className="row g-3">
                  {/* Guest Selection */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Guest *</label>
                    <select
                      className={`form-select glass-input ${errors.guest_id ? 'is-invalid' : ''}`}
                      value={formData.guest_id}
                      onChange={(e) => handleInputChange('guest_id', e.target.value)}
                      disabled={guestId}
                    >
                      <option value="">Select guest</option>
                      {guests.map(guest => (
                        <option key={guest.guest_id} value={guest.guest_id}>
                          {guest.guest_first_name} {guest.guest_last_name}
                        </option>
                      ))}
                    </select>
                    {errors.guest_id && <div className="invalid-feedback">{errors.guest_id}</div>}
                  </div>

                  {/* Event Selection */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Event *</label>
                    <select
                      className={`form-select glass-input ${errors.event_id ? 'is-invalid' : ''}`}
                      value={formData.event_id}
                      onChange={(e) => handleInputChange('event_id', e.target.value)}
                      disabled={eventId}
                    >
                      <option value="">Select event</option>
                      {events.map(event => (
                        <option key={event.event_id} value={event.event_id}>
                          {event.event_name}
                        </option>
                      ))}
                    </select>
                    {errors.event_id && <div className="invalid-feedback">{errors.event_id}</div>}
                  </div>

                  {/* Travel Mode */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Travel Mode</label>
                    <select
                      className="form-select glass-input"
                      value={formData.travel_mode}
                      onChange={(e) => handleInputChange('travel_mode', e.target.value)}
                    >
                      {travelModes.map(mode => (
                        <option key={mode.value} value={mode.value}>{mode.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Status</label>
                    <select
                      className="form-select glass-input"
                      value={formData.travel_status}
                      onChange={(e) => handleInputChange('travel_status', e.target.value)}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  {/* Departure Location */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Departure Location *</label>
                    <input
                      type="text"
                      className={`form-control glass-input ${errors.departure_location ? 'is-invalid' : ''}`}
                      placeholder="Enter departure location"
                      value={formData.departure_location}
                      onChange={(e) => handleInputChange('departure_location', e.target.value)}
                    />
                    {errors.departure_location && <div className="invalid-feedback">{errors.departure_location}</div>}
                  </div>

                  {/* Arrival Location */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Arrival Location *</label>
                    <input
                      type="text"
                      className={`form-control glass-input ${errors.arrival_location ? 'is-invalid' : ''}`}
                      placeholder="Enter arrival location"
                      value={formData.arrival_location}
                      onChange={(e) => handleInputChange('arrival_location', e.target.value)}
                    />
                    {errors.arrival_location && <div className="invalid-feedback">{errors.arrival_location}</div>}
                  </div>

                  {/* Departure DateTime */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Departure Date & Time</label>
                    <input
                      type="datetime-local"
                      className={`form-control glass-input ${errors.departure_datetime ? 'is-invalid' : ''}`}
                      value={formData.departure_datetime}
                      onChange={(e) => handleInputChange('departure_datetime', e.target.value)}
                    />
                    {errors.departure_datetime && <div className="invalid-feedback">{errors.departure_datetime}</div>}
                  </div>

                  {/* Arrival DateTime */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Arrival Date & Time</label>
                    <input
                      type="datetime-local"
                      className={`form-control glass-input ${errors.arrival_datetime ? 'is-invalid' : ''}`}
                      value={formData.arrival_datetime}
                      onChange={(e) => handleInputChange('arrival_datetime', e.target.value)}
                      min={formData.departure_datetime || undefined}
                    />
                    {errors.arrival_datetime && <div className="invalid-feedback">{errors.arrival_datetime}</div>}
                  </div>

                  {/* Carrier Name */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Carrier/Airline</label>
                    <input
                      type="text"
                      className="form-control glass-input"
                      placeholder="Enter carrier name"
                      value={formData.carrier_name}
                      onChange={(e) => handleInputChange('carrier_name', e.target.value)}
                    />
                  </div>

                  {/* Travel Reference */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Flight/Train Number</label>
                    <input
                      type="text"
                      className="form-control glass-input"
                      placeholder="Enter reference number"
                      value={formData.travel_reference}
                      onChange={(e) => handleInputChange('travel_reference', e.target.value)}
                    />
                  </div>

                  {/* Booking Reference */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Booking Reference</label>
                    <input
                      type="text"
                      className="form-control glass-input"
                      placeholder="Enter booking reference"
                      value={formData.booking_reference}
                      onChange={(e) => handleInputChange('booking_reference', e.target.value)}
                    />
                  </div>

                  {/* Cost */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      className={`form-control glass-input ${errors.cost ? 'is-invalid' : ''}`}
                      placeholder="Enter cost"
                      value={formData.cost}
                      onChange={(e) => handleInputChange('cost', e.target.value)}
                    />
                    {errors.cost && <div className="invalid-feedback">{errors.cost}</div>}
                  </div>

                  {/* Seat Preference */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Seat Preference</label>
                    <input
                      type="text"
                      className="form-control glass-input"
                      placeholder="e.g., Window, Aisle, Front"
                      value={formData.seat_preference}
                      onChange={(e) => handleInputChange('seat_preference', e.target.value)}
                    />
                  </div>

                  {/* Special Requirements */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Special Requirements</label>
                    <textarea
                      className="form-control glass-input"
                      rows="2"
                      placeholder="e.g., Wheelchair assistance, Meal preference"
                      value={formData.special_requirements}
                      onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                    />
                  </div>

                  {/* Notes */}
                  <div className="col-12">
                    <label className="form-label fw-semibold">Notes</label>
                    <textarea
                      className="form-control glass-input"
                      rows="3"
                      placeholder="Additional notes or comments"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary glass-btn"
                onClick={onHide}
                disabled={isSubmitting}
              >
                <FaTimes className="me-2" />
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary glass-btn-primary"
                onClick={onSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="me-2" />
                    Save Travel Info
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelManagement;