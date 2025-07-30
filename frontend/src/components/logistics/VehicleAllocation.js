import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FaCar,
  FaBus,
  FaPlane,
  FaTrain,
  FaShip,
  FaMotorcycle,
  FaBicycle,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaUsers,
  FaRoute,
  FaFileExport,
  FaUser,
  FaClock,
  FaSave,
  FaTimes,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaGasPump,
  FaWrench,
  FaIdCard
} from 'react-icons/fa';

const VehicleAllocation = () => {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleAllocations, setVehicleAllocations] = useState([]);
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editingAllocation, setEditingAllocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterVehicleType, setFilterVehicleType] = useState('');
  const [activeTab, setActiveTab] = useState('vehicles');

  const [vehicleForm, setVehicleForm] = useState({
    vehicle_type: '',
    vehicle_model: '',
    vehicle_registration: '',
    vehicle_capacity: 4,
    driver_name: '',
    driver_phone: '',
    driver_license: '',
    vehicle_color: '',
    fuel_type: 'Petrol',
    insurance_expiry: '',
    last_service_date: '',
    daily_rate: '',
    availability_status: 'Available',
    features: '',
    notes: ''
  });

  const [allocationForm, setAllocationForm] = useState({
    guest_id: '',
    event_id: '',
    vehicle_id: '',
    pickup_location: '',
    dropoff_location: '',
    pickup_datetime: '',
    dropoff_datetime: '',
    number_of_passengers: 1,
    allocation_status: 'Assigned',
    special_instructions: '',
    estimated_cost: '',
    notes: ''
  });

  const vehicleTypes = [
    { value: 'Car', icon: FaCar, label: 'Car' },
    { value: 'Bus', icon: FaBus, label: 'Bus' },
    { value: 'Van', icon: FaCar, label: 'Van' },
    { value: 'SUV', icon: FaCar, label: 'SUV' },
    { value: 'Limousine', icon: FaCar, label: 'Limousine' },
    { value: 'Motorcycle', icon: FaMotorcycle, label: 'Motorcycle' },
    { value: 'Bicycle', icon: FaBicycle, label: 'Bicycle' }
  ];

  const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'];
  
  const availabilityStatuses = ['Available', 'In Use', 'Maintenance', 'Out of Service'];
  
  const allocationStatuses = [
    'Assigned', 'Confirmed', 'In Transit', 'Completed', 'Cancelled', 'No Show'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [
        vehiclesRes,
        allocationsRes,
        guestsRes,
        eventsRes
      ] = await Promise.all([
        fetch('/api/crud/vehicles', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/crud/vehicle-allocations', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/guests', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/events', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const vehiclesData = vehiclesRes.ok ? await vehiclesRes.json() : [];
      const allocationsData = allocationsRes.ok ? await allocationsRes.json() : [];
      const guestsData = guestsRes.ok ? await guestsRes.json() : [];
      const eventsData = eventsRes.ok ? await eventsRes.json() : [];

      setVehicles(vehiclesData);
      setVehicleAllocations(allocationsData);
      setGuests(guestsData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load vehicle data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingVehicle 
        ? `/api/crud/vehicles/${editingVehicle.vehicle_id}`
        : '/api/crud/vehicles';
      
      const method = editingVehicle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(vehicleForm)
      });

      if (!response.ok) {
        throw new Error('Failed to save vehicle');
      }

      toast.success(`Vehicle ${editingVehicle ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      resetVehicleForm();
      fetchData();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error('Failed to save vehicle');
    }
  };

  const handleAllocationSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingAllocation 
        ? `/api/crud/vehicle-allocations/${editingAllocation.allocation_id}`
        : '/api/crud/vehicle-allocations';
      
      const method = editingAllocation ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(allocationForm)
      });

      if (!response.ok) {
        throw new Error('Failed to save allocation');
      }

      toast.success(`Allocation ${editingAllocation ? 'updated' : 'created'} successfully`);
      setShowAllocationModal(false);
      resetAllocationForm();
      fetchData();
    } catch (error) {
      console.error('Error saving allocation:', error);
      toast.error('Failed to save allocation');
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      const response = await fetch(`/api/crud/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete vehicle');
      }

      toast.success('Vehicle deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to delete vehicle');
    }
  };

  const handleDeleteAllocation = async (allocationId) => {
    if (!window.confirm('Are you sure you want to delete this allocation?')) return;

    try {
      const response = await fetch(`/api/crud/vehicle-allocations/${allocationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete allocation');
      }

      toast.success('Allocation deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting allocation:', error);
      toast.error('Failed to delete allocation');
    }
  };

  const resetVehicleForm = () => {
    setVehicleForm({
      vehicle_type: '',
      vehicle_model: '',
      vehicle_registration: '',
      vehicle_capacity: 4,
      driver_name: '',
      driver_phone: '',
      driver_license: '',
      vehicle_color: '',
      fuel_type: 'Petrol',
      insurance_expiry: '',
      last_service_date: '',
      daily_rate: '',
      availability_status: 'Available',
      features: '',
      notes: ''
    });
    setEditingVehicle(null);
  };

  const resetAllocationForm = () => {
    setAllocationForm({
      guest_id: '',
      event_id: '',
      vehicle_id: '',
      pickup_location: '',
      dropoff_location: '',
      pickup_datetime: '',
      dropoff_datetime: '',
      number_of_passengers: 1,
      allocation_status: 'Assigned',
      special_instructions: '',
      estimated_cost: '',
      notes: ''
    });
    setEditingAllocation(null);
  };

  const openEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({ ...vehicle });
    setShowModal(true);
  };

  const openEditAllocation = (allocation) => {
    setEditingAllocation(allocation);
    const formData = { ...allocation };
    // Format datetime fields for input
    if (formData.pickup_datetime) {
      formData.pickup_datetime = new Date(formData.pickup_datetime).toISOString().slice(0, 16);
    }
    if (formData.dropoff_datetime) {
      formData.dropoff_datetime = new Date(formData.dropoff_datetime).toISOString().slice(0, 16);
    }
    setAllocationForm(formData);
    setShowAllocationModal(true);
  };

  const exportToCSV = () => {
    const data = activeTab === 'vehicles' ? vehicles : vehicleAllocations;
    const headers = activeTab === 'vehicles' 
      ? ['Type', 'Model', 'Registration', 'Capacity', 'Driver', 'Status', 'Rate']
      : ['Guest', 'Event', 'Vehicle', 'Pickup', 'Dropoff', 'Status', 'Cost'];
    
    const csvContent = [
      headers.join(','),
      ...data.map(item => {
        if (activeTab === 'vehicles') {
          return [
            item.vehicle_type,
            item.vehicle_model,
            item.vehicle_registration,
            item.vehicle_capacity,
            item.driver_name,
            item.availability_status,
            item.daily_rate
          ].map(field => `"${field || ''}"`).join(',');
        } else {
          return [
            `${item.guest_first_name || ''} ${item.guest_last_name || ''}`,
            item.event_name || '',
            `${item.vehicle_type || ''} ${item.vehicle_model || ''}`,
            item.pickup_location || '',
            item.dropoff_location || '',
            item.allocation_status || '',
            item.estimated_cost || ''
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
      case 'Available': case 'Confirmed': case 'Completed': return 'bg-success';
      case 'Assigned': case 'In Transit': return 'bg-primary';
      case 'In Use': return 'bg-warning';
      case 'Maintenance': case 'Cancelled': case 'No Show': return 'bg-danger';
      case 'Out of Service': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  const getVehicleIcon = (type) => {
    const vehicleType = vehicleTypes.find(vt => vt.value === type);
    return vehicleType ? vehicleType.icon : FaCar;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.vehicle_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.vehicle_registration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.driver_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterVehicleType || vehicle.vehicle_type === filterVehicleType;
    const matchesStatus = !filterStatus || vehicle.availability_status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredAllocations = vehicleAllocations.filter(allocation => {
    const matchesSearch = 
      allocation.guest_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.guest_last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.vehicle_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.dropoff_location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filterStatus || allocation.allocation_status === filterStatus;
    const matchesEvent = !filterEvent || allocation.event_id?.toString() === filterEvent;
    
    return matchesSearch && matchesStatus && matchesEvent;
  });

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading vehicle data...</p>
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
              <FaCar className="me-2 text-primary" />
              Vehicle Allocation
            </h2>
            <p className="text-muted mb-0">Manage vehicles and guest transportation assignments</p>
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
                if (activeTab === 'vehicles') {
                  resetVehicleForm();
                  setShowModal(true);
                } else {
                  resetAllocationForm();
                  setShowAllocationModal(true);
                }
              }}
            >
              <FaPlus className="me-2" />
              {activeTab === 'vehicles' ? 'Add Vehicle' : 'Allocate Vehicle'}
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="card glass-card mb-4">
          <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'vehicles' ? 'active' : ''}`}
                  onClick={() => setActiveTab('vehicles')}
                >
                  <FaCar className="me-2" />
                  Vehicles ({vehicles.length})
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'allocations' ? 'active' : ''}`}
                  onClick={() => setActiveTab('allocations')}
                >
                  <FaRoute className="me-2" />
                  Allocations ({vehicleAllocations.length})
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
              
              {activeTab === 'vehicles' ? (
                <>
                  <div className="col-md-3">
                    <select
                      className="form-select glass-input"
                      value={filterVehicleType}
                      onChange={(e) => setFilterVehicleType(e.target.value)}
                    >
                      <option value="">All Vehicle Types</option>
                      {vehicleTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select glass-input"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      {availabilityStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-md-3">
                    <select
                      className="form-select glass-input"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      {allocationStatuses.map(status => (
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
        {activeTab === 'vehicles' ? (
          <div className="card glass-card">
            <div className="card-body">
              {filteredVehicles.length === 0 ? (
                <div className="text-center py-5">
                  <FaCar className="text-muted mb-3" size={48} />
                  <h5 className="text-muted">No vehicles found</h5>
                  <p className="text-muted mb-3">Add vehicles to manage transportation.</p>
                  <button 
                    className="btn btn-primary glass-btn-primary"
                    onClick={() => { resetVehicleForm(); setShowModal(true); }}
                  >
                    Add First Vehicle
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Vehicle</th>
                        <th>Driver</th>
                        <th>Capacity</th>
                        <th>Features</th>
                        <th>Status</th>
                        <th>Rate</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVehicles.map((vehicle) => {
                        const VehicleIcon = getVehicleIcon(vehicle.vehicle_type);
                        return (
                          <tr key={vehicle.vehicle_id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <VehicleIcon className="text-primary me-2" size={20} />
                                <div>
                                  <div className="fw-semibold">{vehicle.vehicle_model}</div>
                                  <small className="text-muted">
                                    {vehicle.vehicle_registration} • {vehicle.vehicle_type}
                                  </small>
                                  {vehicle.vehicle_color && (
                                    <div>
                                      <small className="text-muted">{vehicle.vehicle_color}</small>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              {vehicle.driver_name ? (
                                <div>
                                  <div className="fw-semibold">{vehicle.driver_name}</div>
                                  <small className="text-muted">{vehicle.driver_phone}</small>
                                  {vehicle.driver_license && (
                                    <div>
                                      <FaIdCard className="me-1 text-muted" size={12} />
                                      <small className="text-muted">{vehicle.driver_license}</small>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted">No driver assigned</span>
                              )}
                            </td>
                            <td>
                              <div className="fw-semibold">
                                <FaUsers className="me-1" />
                                {vehicle.vehicle_capacity}
                              </div>
                              <small className="text-muted">
                                <FaGasPump className="me-1" />
                                {vehicle.fuel_type}
                              </small>
                            </td>
                            <td>
                              {vehicle.features ? (
                                <small className="text-muted">
                                  {vehicle.features.length > 30 
                                    ? `${vehicle.features.substring(0, 30)}...`
                                    : vehicle.features
                                  }
                                </small>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge glass-badge ${getStatusBadgeClass(vehicle.availability_status)}`}>
                                {vehicle.availability_status}
                              </span>
                              {vehicle.last_service_date && (
                                <div>
                                  <FaWrench className="me-1 text-muted" size={12} />
                                  <small className="text-muted">
                                    Last service: {new Date(vehicle.last_service_date).toLocaleDateString()}
                                  </small>
                                </div>
                              )}
                            </td>
                            <td>
                              {vehicle.daily_rate ? (
                                <span className="fw-semibold text-success">
                                  ${vehicle.daily_rate}/day
                                </span>
                              ) : (
                                <span className="text-muted">Not specified</span>
                              )}
                            </td>
                            <td>
                              <div className="btn-group" role="group">
                                <button
                                  className="btn btn-sm btn-outline-primary glass-btn"
                                  onClick={() => openEditVehicle(vehicle)}
                                  title="Edit"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger glass-btn"
                                  onClick={() => handleDeleteVehicle(vehicle.vehicle_id)}
                                  title="Delete"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card glass-card">
            <div className="card-body">
              {filteredAllocations.length === 0 ? (
                <div className="text-center py-5">
                  <FaRoute className="text-muted mb-3" size={48} />
                  <h5 className="text-muted">No allocations found</h5>
                  <p className="text-muted mb-3">Allocate vehicles to guests for transportation.</p>
                  <button 
                    className="btn btn-primary glass-btn-primary"
                    onClick={() => { resetAllocationForm(); setShowAllocationModal(true); }}
                  >
                    Create First Allocation
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Guest</th>
                        <th>Event</th>
                        <th>Vehicle</th>
                        <th>Route</th>
                        <th>Schedule</th>
                        <th>Status</th>
                        <th>Cost</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAllocations.map((allocation) => (
                        <tr key={allocation.allocation_id}>
                          <td>
                            <div className="fw-semibold">
                              <FaUser className="me-1" />
                              {allocation.guest_first_name} {allocation.guest_last_name}
                            </div>
                            <small className="text-muted">
                              {allocation.number_of_passengers} passenger{allocation.number_of_passengers > 1 ? 's' : ''}
                            </small>
                          </td>
                          <td>
                            <div className="fw-semibold">{allocation.event_name}</div>
                          </td>
                          <td>
                            <div className="fw-semibold">
                              {allocation.vehicle_type} {allocation.vehicle_model}
                            </div>
                            <small className="text-muted">{allocation.vehicle_registration}</small>
                            {allocation.driver_name && (
                              <div>
                                <small className="text-muted">Driver: {allocation.driver_name}</small>
                              </div>
                            )}
                          </td>
                          <td>
                            <div>
                              <FaMapMarkerAlt className="me-1 text-success" size={12} />
                              <small className="text-success">
                                {allocation.pickup_location || 'Not specified'}
                              </small>
                            </div>
                            <div>
                              <FaMapMarkerAlt className="me-1 text-danger" size={12} />
                              <small className="text-danger">
                                {allocation.dropoff_location || 'Not specified'}
                              </small>
                            </div>
                          </td>
                          <td>
                            <div>
                              <FaClock className="me-1 text-muted" size={12} />
                              <small>
                                {allocation.pickup_datetime ? 
                                  formatDateTime(allocation.pickup_datetime) : 'TBD'
                                }
                              </small>
                            </div>
                            {allocation.dropoff_datetime && (
                              <div>
                                <small className="text-muted">
                                  to {formatDateTime(allocation.dropoff_datetime)}
                                </small>
                              </div>
                            )}
                          </td>
                          <td>
                            <span className={`badge glass-badge ${getStatusBadgeClass(allocation.allocation_status)}`}>
                              {allocation.allocation_status}
                            </span>
                          </td>
                          <td>
                            {allocation.estimated_cost ? (
                              <span className="fw-semibold text-success">
                                ${allocation.estimated_cost}
                              </span>
                            ) : (
                              <span className="text-muted">TBD</span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-outline-primary glass-btn"
                                onClick={() => openEditAllocation(allocation)}
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger glass-btn"
                                onClick={() => handleDeleteAllocation(allocation.allocation_id)}
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

        {/* Vehicle Modal */}
        {showModal && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-backdrop fade show"></div>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content glass-modal">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FaCar className="me-2" />
                    {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleVehicleSubmit}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Vehicle Type *</label>
                        <select
                          className="form-select glass-input"
                          value={vehicleForm.vehicle_type}
                          onChange={(e) => setVehicleForm({...vehicleForm, vehicle_type: e.target.value})}
                          required
                        >
                          <option value="">Select Vehicle Type</option>
                          {vehicleTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Model *</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={vehicleForm.vehicle_model}
                          onChange={(e) => setVehicleForm({...vehicleForm, vehicle_model: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Registration Number</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={vehicleForm.vehicle_registration}
                          onChange={(e) => setVehicleForm({...vehicleForm, vehicle_registration: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Color</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={vehicleForm.vehicle_color}
                          onChange={(e) => setVehicleForm({...vehicleForm, vehicle_color: e.target.value})}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Capacity</label>
                        <input
                          type="number"
                          className="form-control glass-input"
                          min="1"
                          value={vehicleForm.vehicle_capacity}
                          onChange={(e) => setVehicleForm({...vehicleForm, vehicle_capacity: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Fuel Type</label>
                        <select
                          className="form-select glass-input"
                          value={vehicleForm.fuel_type}
                          onChange={(e) => setVehicleForm({...vehicleForm, fuel_type: e.target.value})}
                        >
                          {fuelTypes.map(fuel => (
                            <option key={fuel} value={fuel}>{fuel}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Status</label>
                        <select
                          className="form-select glass-input"
                          value={vehicleForm.availability_status}
                          onChange={(e) => setVehicleForm({...vehicleForm, availability_status: e.target.value})}
                        >
                          {availabilityStatuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Driver Name</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={vehicleForm.driver_name}
                          onChange={(e) => setVehicleForm({...vehicleForm, driver_name: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Driver Phone</label>
                        <input
                          type="tel"
                          className="form-control glass-input"
                          value={vehicleForm.driver_phone}
                          onChange={(e) => setVehicleForm({...vehicleForm, driver_phone: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Driver License</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={vehicleForm.driver_license}
                          onChange={(e) => setVehicleForm({...vehicleForm, driver_license: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Daily Rate</label>
                        <input
                          type="number"
                          className="form-control glass-input"
                          step="0.01"
                          value={vehicleForm.daily_rate}
                          onChange={(e) => setVehicleForm({...vehicleForm, daily_rate: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Insurance Expiry</label>
                        <input
                          type="date"
                          className="form-control glass-input"
                          value={vehicleForm.insurance_expiry}
                          onChange={(e) => setVehicleForm({...vehicleForm, insurance_expiry: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Last Service Date</label>
                        <input
                          type="date"
                          className="form-control glass-input"
                          value={vehicleForm.last_service_date}
                          onChange={(e) => setVehicleForm({...vehicleForm, last_service_date: e.target.value})}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Features</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          placeholder="e.g., AC, WiFi, GPS, Sound System"
                          value={vehicleForm.features}
                          onChange={(e) => setVehicleForm({...vehicleForm, features: e.target.value})}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Notes</label>
                        <textarea
                          className="form-control glass-input"
                          rows="3"
                          value={vehicleForm.notes}
                          onChange={(e) => setVehicleForm({...vehicleForm, notes: e.target.value})}
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
                      {editingVehicle ? 'Update' : 'Save'} Vehicle
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Allocation Modal */}
        {showAllocationModal && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-backdrop fade show"></div>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content glass-modal">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FaRoute className="me-2" />
                    {editingAllocation ? 'Edit Allocation' : 'Allocate Vehicle to Guest'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAllocationModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleAllocationSubmit}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Guest *</label>
                        <select
                          className="form-select glass-input"
                          value={allocationForm.guest_id}
                          onChange={(e) => setAllocationForm({...allocationForm, guest_id: e.target.value})}
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
                          value={allocationForm.event_id}
                          onChange={(e) => setAllocationForm({...allocationForm, event_id: e.target.value})}
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
                        <label className="form-label fw-semibold">Vehicle *</label>
                        <select
                          className="form-select glass-input"
                          value={allocationForm.vehicle_id}
                          onChange={(e) => setAllocationForm({...allocationForm, vehicle_id: e.target.value})}
                          required
                        >
                          <option value="">Select Vehicle</option>
                          {vehicles.filter(v => v.availability_status === 'Available').map(vehicle => (
                            <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                              {vehicle.vehicle_type} {vehicle.vehicle_model} ({vehicle.vehicle_registration})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Number of Passengers</label>
                        <input
                          type="number"
                          className="form-control glass-input"
                          min="1"
                          value={allocationForm.number_of_passengers}
                          onChange={(e) => setAllocationForm({...allocationForm, number_of_passengers: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Pickup Location</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={allocationForm.pickup_location}
                          onChange={(e) => setAllocationForm({...allocationForm, pickup_location: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Dropoff Location</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={allocationForm.dropoff_location}
                          onChange={(e) => setAllocationForm({...allocationForm, dropoff_location: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Pickup Date & Time</label>
                        <input
                          type="datetime-local"
                          className="form-control glass-input"
                          value={allocationForm.pickup_datetime}
                          onChange={(e) => setAllocationForm({...allocationForm, pickup_datetime: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Dropoff Date & Time</label>
                        <input
                          type="datetime-local"
                          className="form-control glass-input"
                          value={allocationForm.dropoff_datetime}
                          onChange={(e) => setAllocationForm({...allocationForm, dropoff_datetime: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Status</label>
                        <select
                          className="form-select glass-input"
                          value={allocationForm.allocation_status}
                          onChange={(e) => setAllocationForm({...allocationForm, allocation_status: e.target.value})}
                        >
                          {allocationStatuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Estimated Cost</label>
                        <input
                          type="number"
                          className="form-control glass-input"
                          step="0.01"
                          value={allocationForm.estimated_cost}
                          onChange={(e) => setAllocationForm({...allocationForm, estimated_cost: e.target.value})}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Special Instructions</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          placeholder="e.g., Child seat required, Wheelchair accessible"
                          value={allocationForm.special_instructions}
                          onChange={(e) => setAllocationForm({...allocationForm, special_instructions: e.target.value})}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Notes</label>
                        <textarea
                          className="form-control glass-input"
                          rows="3"
                          value={allocationForm.notes}
                          onChange={(e) => setAllocationForm({...allocationForm, notes: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary glass-btn"
                      onClick={() => setShowAllocationModal(false)}
                    >
                      <FaTimes className="me-2" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary glass-btn-primary"
                    >
                      <FaSave className="me-2" />
                      {editingAllocation ? 'Update' : 'Create'} Allocation
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

export default VehicleAllocation;