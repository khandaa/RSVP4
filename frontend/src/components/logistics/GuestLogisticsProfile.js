import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaUser,
  FaPlane,
  FaTrain,
  FaCar,
  FaBus,
  FaShip,
  FaHotel,
  FaBed,
  FaRoute,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaArrowLeft,
  FaEdit,
  FaPlus,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaFileAlt,
  FaPrint,
  FaDownload,
  FaSync,
  FaEye,
  FaUserFriends,
  FaBuilding
} from 'react-icons/fa';

const GuestLogisticsProfile = () => {
  const { guestId } = useParams();
  const navigate = useNavigate();
  
  const [guest, setGuest] = useState(null);
  const [logisticsData, setLogisticsData] = useState({
    travel: [],
    accommodation: [],
    vehicles: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEvent, setSelectedEvent] = useState('');

  useEffect(() => {
    fetchGuestLogistics();
  }, [guestId, selectedEvent]);

  const fetchGuestLogistics = async () => {
    try {
      setIsLoading(true);
      
      const [
        guestRes,
        travelRes,
        accommodationRes,
        vehicleRes
      ] = await Promise.all([
        fetch(`/api/guests/${guestId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`/api/crud/travel-information?guest_id=${guestId}${selectedEvent ? `&event_id=${selectedEvent}` : ''}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`/api/crud/accommodation-assignments?guest_id=${guestId}${selectedEvent ? `&event_id=${selectedEvent}` : ''}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`/api/crud/vehicle-allocations?guest_id=${guestId}${selectedEvent ? `&event_id=${selectedEvent}` : ''}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (!guestRes.ok) {
        throw new Error('Guest not found');
      }

      const guestData = await guestRes.json();
      const travelData = travelRes.ok ? await travelRes.json() : [];
      const accommodationData = accommodationRes.ok ? await accommodationRes.json() : [];
      const vehicleData = vehicleRes.ok ? await vehicleRes.json() : [];

      setGuest(guestData);
      setLogisticsData({
        travel: travelData,
        accommodation: accommodationData,
        vehicles: vehicleData
      });

    } catch (error) {
      console.error('Error fetching guest logistics:', error);
      toast.error('Failed to load guest logistics profile');
      navigate('/guests');
    } finally {
      setIsLoading(false);
    }
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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Confirmed': case 'Completed': case 'Checked In': return 'bg-success';
      case 'Assigned': case 'Scheduled': return 'bg-primary';
      case 'Pending': case 'In Transit': return 'bg-warning';
      case 'Cancelled': case 'No Show': case 'Delayed': return 'bg-danger';
      default: return 'bg-secondary';
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const exportProfile = () => {
    const content = generateProfileReport();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${guest.guest_first_name}_${guest.guest_last_name}_logistics_profile.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateProfileReport = () => {
    let report = `GUEST LOGISTICS PROFILE\n`;
    report += `========================\n\n`;
    report += `Guest: ${guest.guest_first_name} ${guest.guest_last_name}\n`;
    report += `Email: ${guest.guest_email || 'Not provided'}\n`;
    report += `Phone: ${guest.guest_phone || 'Not provided'}\n`;
    report += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Travel Information
    report += `TRAVEL INFORMATION\n`;
    report += `------------------\n`;
    if (logisticsData.travel.length === 0) {
      report += `No travel information recorded.\n\n`;
    } else {
      logisticsData.travel.forEach((travel, index) => {
        report += `${index + 1}. ${travel.travel_mode} - ${travel.event_name}\n`;
        report += `   Status: ${travel.travel_status}\n`;
        if (travel.arrival_datetime) {
          report += `   Arrival: ${formatDateTime(travel.arrival_datetime)} at ${travel.arrival_location}\n`;
        }
        if (travel.departure_datetime) {
          report += `   Departure: ${formatDateTime(travel.departure_datetime)} from ${travel.departure_location}\n`;
        }
        if (travel.flight_train_number) {
          report += `   Flight/Train: ${travel.flight_train_number}\n`;
        }
        report += `\n`;
      });
    }

    // Accommodation Information
    report += `ACCOMMODATION INFORMATION\n`;
    report += `------------------------\n`;
    if (logisticsData.accommodation.length === 0) {
      report += `No accommodation assignments recorded.\n\n`;
    } else {
      logisticsData.accommodation.forEach((acc, index) => {
        report += `${index + 1}. ${acc.hotel_name} - ${acc.event_name}\n`;
        report += `   Room: ${acc.room_number || 'TBD'} (${acc.room_type})\n`;
        report += `   Check-in: ${formatDate(acc.check_in_date)}\n`;
        report += `   Check-out: ${formatDate(acc.check_out_date)}\n`;
        report += `   Status: ${acc.assignment_status}\n`;
        report += `\n`;
      });
    }

    // Vehicle Information
    report += `VEHICLE ALLOCATIONS\n`;
    report += `------------------\n`;
    if (logisticsData.vehicles.length === 0) {
      report += `No vehicle allocations recorded.\n\n`;
    } else {
      logisticsData.vehicles.forEach((vehicle, index) => {
        report += `${index + 1}. ${vehicle.vehicle_type} ${vehicle.vehicle_model} - ${vehicle.event_name}\n`;
        report += `   Pickup: ${formatDateTime(vehicle.pickup_datetime)} from ${vehicle.pickup_location}\n`;
        if (vehicle.dropoff_datetime) {
          report += `   Dropoff: ${formatDateTime(vehicle.dropoff_datetime)} at ${vehicle.dropoff_location}\n`;
        }
        report += `   Status: ${vehicle.allocation_status}\n`;
        report += `   Passengers: ${vehicle.number_of_passengers}\n`;
        report += `\n`;
      });
    }

    return report;
  };

  const printProfile = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Guest Logistics Profile - ${guest.guest_first_name} ${guest.guest_last_name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0d6efd; padding-bottom: 20px; }
            .section { margin-bottom: 30px; }
            .section h3 { color: #0d6efd; margin-bottom: 15px; }
            .item { margin-bottom: 15px; padding: 10px; border-left: 3px solid #0d6efd; background: #f8f9fa; }
            .status { padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .status-success { background: #d4edda; color: #155724; }
            .status-primary { background: #d1ecf1; color: #0c5460; }
            .status-warning { background: #fff3cd; color: #856404; }
            .status-danger { background: #f8d7da; color: #721c24; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Guest Logistics Profile</h1>
            <h2>${guest.guest_first_name} ${guest.guest_last_name}</h2>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="section">
            <h3>Guest Information</h3>
            <div class="item">
              <strong>Email:</strong> ${guest.guest_email || 'Not provided'}<br>
              <strong>Phone:</strong> ${guest.guest_phone || 'Not provided'}<br>
              <strong>Organization:</strong> ${guest.guest_organization || 'Not specified'}
            </div>
          </div>

          <div class="section">
            <h3>Travel Information (${logisticsData.travel.length})</h3>
            ${logisticsData.travel.length === 0 ? 
              '<div class="item">No travel information recorded.</div>' :
              logisticsData.travel.map(travel => `
                <div class="item">
                  <strong>${travel.travel_mode}</strong> - ${travel.event_name}
                  <span class="status status-${travel.travel_status === 'Confirmed' ? 'success' : travel.travel_status === 'Pending' ? 'warning' : 'primary'}">${travel.travel_status}</span><br>
                  ${travel.arrival_datetime ? `<strong>Arrival:</strong> ${formatDateTime(travel.arrival_datetime)} at ${travel.arrival_location}<br>` : ''}
                  ${travel.departure_datetime ? `<strong>Departure:</strong> ${formatDateTime(travel.departure_datetime)} from ${travel.departure_location}<br>` : ''}
                  ${travel.flight_train_number ? `<strong>Flight/Train:</strong> ${travel.flight_train_number}` : ''}
                </div>
              `).join('')
            }
          </div>

          <div class="section">
            <h3>Accommodation (${logisticsData.accommodation.length})</h3>
            ${logisticsData.accommodation.length === 0 ? 
              '<div class="item">No accommodation assignments recorded.</div>' :
              logisticsData.accommodation.map(acc => `
                <div class="item">
                  <strong>${acc.hotel_name}</strong> - ${acc.event_name}
                  <span class="status status-${acc.assignment_status === 'Confirmed' ? 'success' : acc.assignment_status === 'Assigned' ? 'primary' : 'warning'}">${acc.assignment_status}</span><br>
                  <strong>Room:</strong> ${acc.room_number || 'TBD'} (${acc.room_type})<br>
                  <strong>Check-in:</strong> ${formatDate(acc.check_in_date)}<br>
                  <strong>Check-out:</strong> ${formatDate(acc.check_out_date)}
                </div>
              `).join('')
            }
          </div>

          <div class="section">
            <h3>Vehicle Allocations (${logisticsData.vehicles.length})</h3>
            ${logisticsData.vehicles.length === 0 ? 
              '<div class="item">No vehicle allocations recorded.</div>' :
              logisticsData.vehicles.map(vehicle => `
                <div class="item">
                  <strong>${vehicle.vehicle_type} ${vehicle.vehicle_model}</strong> - ${vehicle.event_name}
                  <span class="status status-${vehicle.allocation_status === 'Confirmed' ? 'success' : vehicle.allocation_status === 'Assigned' ? 'primary' : 'warning'}">${vehicle.allocation_status}</span><br>
                  <strong>Pickup:</strong> ${formatDateTime(vehicle.pickup_datetime)} from ${vehicle.pickup_location}<br>
                  ${vehicle.dropoff_datetime ? `<strong>Dropoff:</strong> ${formatDateTime(vehicle.dropoff_datetime)} at ${vehicle.dropoff_location}<br>` : ''}
                  <strong>Passengers:</strong> ${vehicle.number_of_passengers}
                </div>
              `).join('')
            }
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getUpcomingSchedule = () => {
    const schedule = [];
    
    // Add travel items
    logisticsData.travel.forEach(travel => {
      if (travel.arrival_datetime) {
        schedule.push({
          type: 'arrival',
          datetime: travel.arrival_datetime,
          title: `${travel.travel_mode} Arrival`,
          location: travel.arrival_location,
          details: travel.flight_train_number,
          status: travel.travel_status,
          event: travel.event_name
        });
      }
      if (travel.departure_datetime) {
        schedule.push({
          type: 'departure',
          datetime: travel.departure_datetime,
          title: `${travel.travel_mode} Departure`,
          location: travel.departure_location,
          details: travel.flight_train_number,
          status: travel.travel_status,
          event: travel.event_name
        });
      }
    });

    // Add accommodation items
    logisticsData.accommodation.forEach(acc => {
      if (acc.check_in_date) {
        schedule.push({
          type: 'checkin',
          datetime: acc.check_in_date,
          title: 'Hotel Check-in',
          location: acc.hotel_name,
          details: `Room ${acc.room_number}`,
          status: acc.assignment_status,
          event: acc.event_name
        });
      }
      if (acc.check_out_date) {
        schedule.push({
          type: 'checkout',
          datetime: acc.check_out_date,
          title: 'Hotel Check-out',
          location: acc.hotel_name,
          details: `Room ${acc.room_number}`,
          status: acc.assignment_status,
          event: acc.event_name
        });
      }
    });

    // Add vehicle items
    logisticsData.vehicles.forEach(vehicle => {
      if (vehicle.pickup_datetime) {
        schedule.push({
          type: 'pickup',
          datetime: vehicle.pickup_datetime,
          title: 'Vehicle Pickup',
          location: vehicle.pickup_location,
          details: `${vehicle.vehicle_type} ${vehicle.vehicle_model}`,
          status: vehicle.allocation_status,
          event: vehicle.event_name
        });
      }
    });

    return schedule.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  };

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading guest logistics profile...</p>
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <h4 className="text-muted">Guest not found</h4>
          <button 
            className="btn btn-primary glass-btn-primary mt-3"
            onClick={() => navigate('/guests')}
          >
            Back to Guests
          </button>
        </div>
      </div>
    );
  }

  const upcomingSchedule = getUpcomingSchedule();

  return (
    <div className="glass-bg min-vh-100 p-4">
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <button 
              className="btn btn-outline-secondary glass-btn me-3"
              onClick={() => navigate('/guests')}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-dark fw-bold mb-0">
                <FaUser className="me-2 text-primary" />
                {guest.guest_first_name} {guest.guest_last_name}
              </h2>
              <p className="text-muted mb-0">Logistics Profile</p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={fetchGuestLogistics}
              title="Refresh"
            >
              <FaSync />
            </button>
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={printProfile}
            >
              <FaPrint className="me-2" />
              Print
            </button>
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={exportProfile}
            >
              <FaDownload className="me-2" />
              Export
            </button>
          </div>
        </div>

        {/* Guest Information Card */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-4">
              <div className="col-md-8">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="d-flex align-items-center">
                      <FaEnvelope className="text-muted me-2" />
                      <div>
                        <small className="text-muted">Email</small>
                        <div>{guest.guest_email || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex align-items-center">
                      <FaPhone className="text-muted me-2" />
                      <div>
                        <small className="text-muted">Phone</small>
                        <div>{guest.guest_phone || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex align-items-center">
                      <FaBuilding className="text-muted me-2" />
                      <div>
                        <small className="text-muted">Organization</small>
                        <div>{guest.guest_organization || 'Not specified'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex align-items-center">
                      <FaUserFriends className="text-muted me-2" />
                      <div>
                        <small className="text-muted">Guest Type</small>
                        <div>
                          <span className={`badge glass-badge ${guest.guest_type === 'VIP' ? 'bg-warning' : 'bg-secondary'}`}>
                            {guest.guest_type || 'Standard'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center">
                  <h5 className="text-muted mb-3">Logistics Summary</h5>
                  <div className="row g-2">
                    <div className="col-4">
                      <div className="text-primary fw-bold">{logisticsData.travel.length}</div>
                      <small className="text-muted">Travel</small>
                    </div>
                    <div className="col-4">
                      <div className="text-success fw-bold">{logisticsData.accommodation.length}</div>
                      <small className="text-muted">Stays</small>
                    </div>
                    <div className="col-4">
                      <div className="text-info fw-bold">{logisticsData.vehicles.length}</div>
                      <small className="text-muted">Rides</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="card glass-card mb-4">
          <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <FaInfoCircle className="me-2" />
                  Overview
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'travel' ? 'active' : ''}`}
                  onClick={() => setActiveTab('travel')}
                >
                  <FaPlane className="me-2" />
                  Travel ({logisticsData.travel.length})
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'accommodation' ? 'active' : ''}`}
                  onClick={() => setActiveTab('accommodation')}
                >
                  <FaHotel className="me-2" />
                  Accommodation ({logisticsData.accommodation.length})
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'vehicles' ? 'active' : ''}`}
                  onClick={() => setActiveTab('vehicles')}
                >
                  <FaCar className="me-2" />
                  Vehicles ({logisticsData.vehicles.length})
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'schedule' ? 'active' : ''}`}
                  onClick={() => setActiveTab('schedule')}
                >
                  <FaCalendarAlt className="me-2" />
                  Schedule
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card glass-card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <FaClock className="me-2 text-primary" />
                    Upcoming Schedule
                  </h5>
                </div>
                <div className="card-body">
                  {upcomingSchedule.length === 0 ? (
                    <div className="text-center py-4">
                      <FaCalendarAlt className="text-muted mb-3" size={48} />
                      <h5 className="text-muted">No upcoming activities</h5>
                      <p className="text-muted">No logistics activities scheduled for this guest.</p>
                    </div>
                  ) : (
                    <div className="timeline">
                      {upcomingSchedule.slice(0, 5).map((item, index) => (
                        <div key={index} className="timeline-item mb-3 p-3 border-start border-3 border-primary">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1 fw-semibold">{item.title}</h6>
                              <div className="text-primary fw-semibold">{formatDateTime(item.datetime)}</div>
                              <div className="text-muted">{item.location}</div>
                              {item.details && <small className="text-muted">{item.details}</small>}
                              <div className="mt-1">
                                <small className="text-muted">{item.event}</small>
                              </div>
                            </div>
                            <div className="text-end">
                              <span className={`badge glass-badge ${getStatusBadgeClass(item.status)}`}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card glass-card mb-4">
                <div className="card-header">
                  <h6 className="card-title mb-0">Quick Actions</h6>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-outline-primary glass-btn"
                      onClick={() => navigate(`/logistics/travel?guestId=${guestId}`)}
                    >
                      <FaPlane className="me-2" />
                      Add Travel
                    </button>
                    <button 
                      className="btn btn-outline-success glass-btn"
                      onClick={() => navigate(`/logistics/accommodation?guestId=${guestId}`)}
                    >
                      <FaHotel className="me-2" />
                      Assign Accommodation
                    </button>
                    <button 
                      className="btn btn-outline-info glass-btn"
                      onClick={() => navigate(`/logistics/vehicles?guestId=${guestId}`)}
                    >
                      <FaCar className="me-2" />
                      Allocate Vehicle
                    </button>
                  </div>
                </div>
              </div>

              <div className="card glass-card">
                <div className="card-header">
                  <h6 className="card-title mb-0">Logistics Stats</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3 text-center">
                    <div className="col-4">
                      <div className="border rounded p-2 glass-effect">
                        <div className="text-primary fw-bold">
                          {logisticsData.travel.filter(t => t.travel_status === 'Confirmed').length}
                        </div>
                        <small className="text-muted">Confirmed Travel</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="border rounded p-2 glass-effect">
                        <div className="text-success fw-bold">
                          {logisticsData.accommodation.filter(a => a.assignment_status === 'Confirmed').length}
                        </div>
                        <small className="text-muted">Confirmed Stay</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="border rounded p-2 glass-effect">
                        <div className="text-info fw-bold">
                          {logisticsData.vehicles.filter(v => v.allocation_status === 'Confirmed').length}
                        </div>
                        <small className="text-muted">Confirmed Rides</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'travel' && (
          <div className="card glass-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">
                <FaPlane className="me-2 text-primary" />
                Travel Information
              </h5>
              <button 
                className="btn btn-primary glass-btn-primary"
                onClick={() => navigate(`/logistics/travel?guestId=${guestId}`)}
              >
                <FaPlus className="me-2" />
                Add Travel
              </button>
            </div>
            <div className="card-body">
              {logisticsData.travel.length === 0 ? (
                <div className="text-center py-4">
                  <FaPlane className="text-muted mb-3" size={48} />
                  <h5 className="text-muted">No travel information</h5>
                  <p className="text-muted mb-3">No travel records found for this guest.</p>
                  <button 
                    className="btn btn-primary glass-btn-primary"
                    onClick={() => navigate(`/logistics/travel?guestId=${guestId}`)}
                  >
                    Add Travel Information
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Travel Mode</th>
                        <th>Flight/Train</th>
                        <th>Arrival</th>
                        <th>Departure</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logisticsData.travel.map((travel, index) => {
                        const TravelIcon = getTravelIcon(travel.travel_mode);
                        return (
                          <tr key={index}>
                            <td className="fw-semibold">{travel.event_name}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <TravelIcon className="me-2 text-primary" />
                                {travel.travel_mode}
                              </div>
                            </td>
                            <td>{travel.flight_train_number || '-'}</td>
                            <td>
                              {travel.arrival_datetime ? (
                                <div>
                                  <div>{formatDateTime(travel.arrival_datetime)}</div>
                                  <small className="text-muted">{travel.arrival_location}</small>
                                </div>
                              ) : (
                                <span className="text-muted">Not specified</span>
                              )}
                            </td>
                            <td>
                              {travel.departure_datetime ? (
                                <div>
                                  <div>{formatDateTime(travel.departure_datetime)}</div>
                                  <small className="text-muted">{travel.departure_location}</small>
                                </div>
                              ) : (
                                <span className="text-muted">Not specified</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge glass-badge ${getStatusBadgeClass(travel.travel_status)}`}>
                                {travel.travel_status}
                              </span>
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
        )}

        {activeTab === 'accommodation' && (
          <div className="card glass-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">
                <FaHotel className="me-2 text-primary" />
                Accommodation Assignments
              </h5>
              <button 
                className="btn btn-primary glass-btn-primary"
                onClick={() => navigate(`/logistics/accommodation?guestId=${guestId}`)}
              >
                <FaPlus className="me-2" />
                Assign Accommodation
              </button>
            </div>
            <div className="card-body">
              {logisticsData.accommodation.length === 0 ? (
                <div className="text-center py-4">
                  <FaHotel className="text-muted mb-3" size={48} />
                  <h5 className="text-muted">No accommodation assignments</h5>
                  <p className="text-muted mb-3">No accommodation records found for this guest.</p>
                  <button 
                    className="btn btn-primary glass-btn-primary"
                    onClick={() => navigate(`/logistics/accommodation?guestId=${guestId}`)}
                  >
                    Assign Accommodation
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Hotel</th>
                        <th>Room</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Nights</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logisticsData.accommodation.map((acc, index) => {
                        const nights = acc.check_in_date && acc.check_out_date ? 
                          Math.ceil((new Date(acc.check_out_date) - new Date(acc.check_in_date)) / (1000 * 60 * 60 * 24)) : 0;
                        return (
                          <tr key={index}>
                            <td className="fw-semibold">{acc.event_name}</td>
                            <td>
                              <div className="fw-semibold">{acc.hotel_name}</div>
                              <small className="text-muted">{acc.room_type}</small>
                            </td>
                            <td>{acc.room_number || 'TBD'}</td>
                            <td>{formatDate(acc.check_in_date)}</td>
                            <td>{formatDate(acc.check_out_date)}</td>
                            <td>
                              <span className="fw-semibold">{nights > 0 ? nights : '-'}</span>
                              {nights > 0 && <small className="text-muted"> nights</small>}
                            </td>
                            <td>
                              <span className={`badge glass-badge ${getStatusBadgeClass(acc.assignment_status)}`}>
                                {acc.assignment_status}
                              </span>
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
        )}

        {activeTab === 'vehicles' && (
          <div className="card glass-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">
                <FaCar className="me-2 text-primary" />
                Vehicle Allocations
              </h5>
              <button 
                className="btn btn-primary glass-btn-primary"
                onClick={() => navigate(`/logistics/vehicles?guestId=${guestId}`)}
              >
                <FaPlus className="me-2" />
                Allocate Vehicle
              </button>
            </div>
            <div className="card-body">
              {logisticsData.vehicles.length === 0 ? (
                <div className="text-center py-4">
                  <FaCar className="text-muted mb-3" size={48} />
                  <h5 className="text-muted">No vehicle allocations</h5>
                  <p className="text-muted mb-3">No vehicle records found for this guest.</p>
                  <button 
                    className="btn btn-primary glass-btn-primary"
                    onClick={() => navigate(`/logistics/vehicles?guestId=${guestId}`)}
                  >
                    Allocate Vehicle
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Vehicle</th>
                        <th>Pickup</th>
                        <th>Dropoff</th>
                        <th>Passengers</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logisticsData.vehicles.map((vehicle, index) => (
                        <tr key={index}>
                          <td className="fw-semibold">{vehicle.event_name}</td>
                          <td>
                            <div className="fw-semibold">
                              {vehicle.vehicle_type} {vehicle.vehicle_model}
                            </div>
                            <small className="text-muted">{vehicle.vehicle_registration}</small>
                          </td>
                          <td>
                            <div>{formatDateTime(vehicle.pickup_datetime)}</div>
                            <small className="text-muted">{vehicle.pickup_location}</small>
                          </td>
                          <td>
                            {vehicle.dropoff_datetime ? (
                              <div>
                                <div>{formatDateTime(vehicle.dropoff_datetime)}</div>
                                <small className="text-muted">{vehicle.dropoff_location}</small>
                              </div>
                            ) : (
                              <span className="text-muted">Not specified</span>
                            )}
                          </td>
                          <td>
                            <span className="fw-semibold">{vehicle.number_of_passengers}</span>
                          </td>
                          <td>
                            <span className={`badge glass-badge ${getStatusBadgeClass(vehicle.allocation_status)}`}>
                              {vehicle.allocation_status}
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

        {activeTab === 'schedule' && (
          <div className="card glass-card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <FaCalendarAlt className="me-2 text-primary" />
                Complete Schedule
              </h5>
            </div>
            <div className="card-body">
              {upcomingSchedule.length === 0 ? (
                <div className="text-center py-4">
                  <FaCalendarAlt className="text-muted mb-3" size={48} />
                  <h5 className="text-muted">No scheduled activities</h5>
                  <p className="text-muted">No logistics activities scheduled for this guest.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Activity</th>
                        <th>Location</th>
                        <th>Details</th>
                        <th>Event</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingSchedule.map((item, index) => (
                        <tr key={index}>
                          <td className="fw-semibold text-primary">
                            {formatDateTime(item.datetime)}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {item.type === 'arrival' && <FaPlane className="me-2 text-success" />}
                              {item.type === 'departure' && <FaPlane className="me-2 text-danger" />}
                              {item.type === 'checkin' && <FaBed className="me-2 text-primary" />}
                              {item.type === 'checkout' && <FaBed className="me-2 text-warning" />}
                              {item.type === 'pickup' && <FaCar className="me-2 text-info" />}
                              {item.title}
                            </div>
                          </td>
                          <td>{item.location}</td>
                          <td>{item.details || '-'}</td>
                          <td>{item.event}</td>
                          <td>
                            <span className={`badge glass-badge ${getStatusBadgeClass(item.status)}`}>
                              {item.status}
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
      </div>
    </div>
  );
};

export default GuestLogisticsProfile;