import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { 
  FaFileAlt,
  FaDownload,
  FaCalendarAlt,
  FaChartBar,
  FaChartPie,
  FaTable,
  FaPlane,
  FaTrain,
  FaCar,
  FaBus,
  FaHotel,
  FaFileExport,
  FaPrint,
  FaSpinner,
  FaInfoCircle,
} from 'react-icons/fa';

const LogisticsReports = () => {
  const [reports, setReports] = useState({
    travelSummary: {},
    accommodationSummary: {},
    vehicleSummary: {},
    eventWiseBreakdown: [],
    detailedData: []
  });
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState('overview');


  useEffect(() => {
    fetchEvents();
    generateReports();
  }, [generateReports, fetchEvents]);

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

  const generateReports = useCallback(async () => {
    if (!dateRange.start || !dateRange.end) return;

    try {
      setIsLoading(true);
      
      const [
        travelRes,
        accommodationRes,
        vehicleRes
      ] = await Promise.all([
        fetch(`/api/crud/travel-information?start_date=${dateRange.start}&end_date=${dateRange.end}${selectedEvent ? `&event_id=${selectedEvent}` : ''}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`/api/crud/accommodation-assignments?start_date=${dateRange.start}&end_date=${dateRange.end}${selectedEvent ? `&event_id=${selectedEvent}` : ''}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`/api/crud/vehicle-allocations?start_date=${dateRange.start}&end_date=${dateRange.end}${selectedEvent ? `&event_id=${selectedEvent}` : ''}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const travelData = travelRes.ok ? await travelRes.json() : [];
      const accommodationData = accommodationRes.ok ? await accommodationRes.json() : [];
      const vehicleData = vehicleRes.ok ? await vehicleRes.json() : [];

      // Generate comprehensive reports
      const reportData = {
        travelSummary: generateTravelSummary(travelData),
        accommodationSummary: generateAccommodationSummary(accommodationData),
        vehicleSummary: generateVehicleSummary(vehicleData),
        eventWiseBreakdown: generateEventWiseBreakdown(travelData, accommodationData, vehicleData),
        detailedData: {
          travel: travelData,
          accommodation: accommodationData,
          vehicle: vehicleData
        }
      };

      setReports(reportData);
    } catch (error) {
      console.error('Error generating reports:', error);
      toast.error('Failed to generate logistics reports');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.start, dateRange.end, selectedEvent]);

  const generateTravelSummary = (data) => {
    const summary = {
      total: data.length,
      byMode: {},
      byStatus: {},
      arrivals: data.filter(t => t.arrival_datetime).length,
      departures: data.filter(t => t.departure_datetime).length,
      costs: {
        total: data.reduce((sum, t) => sum + (parseFloat(t.cost) || 0), 0),
        average: 0
      }
    };

    // Group by travel mode
    data.forEach(item => {
      summary.byMode[item.travel_mode] = (summary.byMode[item.travel_mode] || 0) + 1;
      summary.byStatus[item.travel_status] = (summary.byStatus[item.travel_status] || 0) + 1;
    });

    summary.costs.average = summary.total > 0 ? summary.costs.total / summary.total : 0;

    return summary;
  };

  const generateAccommodationSummary = (data) => {
    const summary = {
      total: data.length,
      byHotel: {},
      byStatus: {},
      totalNights: 0,
      costs: {
        total: data.reduce((sum, a) => sum + (parseFloat(a.estimated_cost) || 0), 0),
        average: 0
      }
    };

    data.forEach(item => {
      summary.byHotel[item.hotel_name] = (summary.byHotel[item.hotel_name] || 0) + 1;
      summary.byStatus[item.assignment_status] = (summary.byStatus[item.assignment_status] || 0) + 1;
      
      // Calculate nights
      if (item.check_in_date && item.check_out_date) {
        const checkIn = new Date(item.check_in_date);
        const checkOut = new Date(item.check_out_date);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        summary.totalNights += nights > 0 ? nights : 0;
      }
    });

    summary.costs.average = summary.total > 0 ? summary.costs.total / summary.total : 0;
    summary.averageNights = summary.total > 0 ? summary.totalNights / summary.total : 0;

    return summary;
  };

  const generateVehicleSummary = (data) => {
    const summary = {
      total: data.length,
      byType: {},
      byStatus: {},
      totalPassengers: data.reduce((sum, v) => sum + (v.number_of_passengers || 0), 0),
      costs: {
        total: data.reduce((sum, v) => sum + (parseFloat(v.estimated_cost) || 0), 0),
        average: 0
      }
    };

    data.forEach(item => {
      summary.byType[item.vehicle_type] = (summary.byType[item.vehicle_type] || 0) + 1;
      summary.byStatus[item.allocation_status] = (summary.byStatus[item.allocation_status] || 0) + 1;
    });

    summary.costs.average = summary.total > 0 ? summary.costs.total / summary.total : 0;
    summary.averagePassengers = summary.total > 0 ? summary.totalPassengers / summary.total : 0;

    return summary;
  };

  const generateEventWiseBreakdown = (travel, accommodation, vehicle) => {
    const eventMap = {};

    // Process travel data
    travel.forEach(item => {
      if (!eventMap[item.event_id]) {
        eventMap[item.event_id] = {
          event_name: item.event_name,
          travel: { count: 0, cost: 0 },
          accommodation: { count: 0, cost: 0 },
          vehicle: { count: 0, cost: 0 },
          total_cost: 0
        };
      }
      eventMap[item.event_id].travel.count++;
      eventMap[item.event_id].travel.cost += parseFloat(item.cost) || 0;
    });

    // Process accommodation data
    accommodation.forEach(item => {
      if (!eventMap[item.event_id]) {
        eventMap[item.event_id] = {
          event_name: item.event_name,
          travel: { count: 0, cost: 0 },
          accommodation: { count: 0, cost: 0 },
          vehicle: { count: 0, cost: 0 },
          total_cost: 0
        };
      }
      eventMap[item.event_id].accommodation.count++;
      eventMap[item.event_id].accommodation.cost += parseFloat(item.estimated_cost) || 0;
    });

    // Process vehicle data
    vehicle.forEach(item => {
      if (!eventMap[item.event_id]) {
        eventMap[item.event_id] = {
          event_name: item.event_name,
          travel: { count: 0, cost: 0 },
          accommodation: { count: 0, cost: 0 },
          vehicle: { count: 0, cost: 0 },
          total_cost: 0
        };
      }
      eventMap[item.event_id].vehicle.count++;
      eventMap[item.event_id].vehicle.cost += parseFloat(item.estimated_cost) || 0;
    });

    // Calculate total costs
    Object.values(eventMap).forEach(event => {
      event.total_cost = event.travel.cost + event.accommodation.cost + event.vehicle.cost;
    });

    return Object.values(eventMap);
  };

  const exportReport = (format = 'csv') => {
    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'csv') {
      content = generateCSVReport();
      filename = `logistics_report_${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else if (format === 'json') {
      content = JSON.stringify(reports, null, 2);
      filename = `logistics_report_${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSVReport = () => {
    let csv = '';

    // Executive Summary
    csv += 'LOGISTICS EXECUTIVE SUMMARY\n';
    csv += `Report Period:,${dateRange.start} to ${dateRange.end}\n`;
    csv += `Generated:,${new Date().toLocaleString()}\n\n`;

    // Travel Summary
    csv += 'TRAVEL SUMMARY\n';
    csv += `Total Travel Records:,${reports.travelSummary.total}\n`;
    csv += `Total Arrivals:,${reports.travelSummary.arrivals}\n`;
    csv += `Total Departures:,${reports.travelSummary.departures}\n`;
    csv += `Total Travel Cost:,$${reports.travelSummary.costs?.total?.toFixed(2) || 0}\n`;
    csv += `Average Cost per Trip:,$${reports.travelSummary.costs?.average?.toFixed(2) || 0}\n\n`;

    // Travel by Mode
    csv += 'Travel by Mode\n';
    csv += 'Mode,Count\n';
    Object.entries(reports.travelSummary.byMode || {}).forEach(([mode, count]) => {
      csv += `${mode},${count}\n`;
    });
    csv += '\n';

    // Accommodation Summary
    csv += 'ACCOMMODATION SUMMARY\n';
    csv += `Total Assignments:,${reports.accommodationSummary.total}\n`;
    csv += `Total Nights:,${reports.accommodationSummary.totalNights}\n`;
    csv += `Average Nights per Guest:,${reports.accommodationSummary.averageNights?.toFixed(1) || 0}\n`;
    csv += `Total Accommodation Cost:,$${reports.accommodationSummary.costs?.total?.toFixed(2) || 0}\n`;
    csv += `Average Cost per Assignment:,$${reports.accommodationSummary.costs?.average?.toFixed(2) || 0}\n\n`;

    // Vehicle Summary
    csv += 'VEHICLE SUMMARY\n';
    csv += `Total Allocations:,${reports.vehicleSummary.total}\n`;
    csv += `Total Passengers:,${reports.vehicleSummary.totalPassengers}\n`;
    csv += `Average Passengers per Trip:,${reports.vehicleSummary.averagePassengers?.toFixed(1) || 0}\n`;
    csv += `Total Vehicle Cost:,$${reports.vehicleSummary.costs?.total?.toFixed(2) || 0}\n`;
    csv += `Average Cost per Trip:,$${reports.vehicleSummary.costs?.average?.toFixed(2) || 0}\n\n`;

    // Event-wise Breakdown
    csv += 'EVENT-WISE BREAKDOWN\n';
    csv += 'Event,Travel Count,Travel Cost,Accommodation Count,Accommodation Cost,Vehicle Count,Vehicle Cost,Total Cost\n';
    reports.eventWiseBreakdown.forEach(event => {
      csv += `${event.event_name},${event.travel.count},$${event.travel.cost.toFixed(2)},${event.accommodation.count},$${event.accommodation.cost.toFixed(2)},${event.vehicle.count},$${event.vehicle.cost.toFixed(2)},$${event.total_cost.toFixed(2)}\n`;
    });

    return csv;
  };

  const printReport = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Logistics Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 30px; }
            .section h3 { color: #0d6efd; border-bottom: 2px solid #0d6efd; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; }
            .summary-stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-item { text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #0d6efd; }
            .stat-label { font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Logistics Report</h1>
            <p>Period: ${dateRange.start} to ${dateRange.end}</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="section">
            <h3>Executive Summary</h3>
            <div class="summary-stats">
              <div class="stat-item">
                <div class="stat-value">${reports.travelSummary.total}</div>
                <div class="stat-label">Travel Records</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${reports.accommodationSummary.total}</div>
                <div class="stat-label">Accommodation</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${reports.vehicleSummary.total}</div>
                <div class="stat-label">Vehicle Trips</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">$${((reports.travelSummary.costs?.total || 0) + (reports.accommodationSummary.costs?.total || 0) + (reports.vehicleSummary.costs?.total || 0)).toFixed(2)}</div>
                <div class="stat-label">Total Cost</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Event-wise Breakdown</h3>
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Travel</th>
                  <th>Accommodation</th>
                  <th>Vehicle</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                ${reports.eventWiseBreakdown.map(event => `
                  <tr>
                    <td>${event.event_name}</td>
                    <td>${event.travel.count} ($${event.travel.cost.toFixed(2)})</td>
                    <td>${event.accommodation.count} ($${event.accommodation.cost.toFixed(2)})</td>
                    <td>${event.vehicle.count} ($${event.vehicle.cost.toFixed(2)})</td>
                    <td>$${event.total_cost.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <FaSpinner className="fa-spin text-primary mb-3" size={48} />
          <p className="text-muted">Generating logistics reports...</p>
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
              <FaFileAlt className="me-2 text-primary" />
              Logistics Reports
            </h2>
            <p className="text-muted mb-0">Comprehensive logistics analytics and reporting</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={printReport}
            >
              <FaPrint className="me-2" />
              Print
            </button>
            <div className="btn-group">
              <button 
                className="btn btn-outline-success glass-btn"
                onClick={() => exportReport('csv')}
              >
                <FaFileExport className="me-2" />
                Export CSV
              </button>
              <button 
                className="btn btn-outline-info glass-btn"
                onClick={() => exportReport('json')}
              >
                <FaDownload className="me-2" />
                Export JSON
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label fw-semibold">Start Date</label>
                <input
                  type="date"
                  className="form-control glass-input"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">End Date</label>
                <input
                  type="date"
                  className="form-control glass-input"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                />
              </div>
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
                <button 
                  className="btn btn-primary glass-btn-primary w-100"
                  onClick={generateReports}
                  disabled={isLoading}
                >
                  {isLoading ? <FaSpinner className="fa-spin me-2" /> : <FaChartBar className="me-2" />}
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaPlane className="text-primary mb-2" size={24} />
                <h4 className="text-primary mb-1">{reports.travelSummary.total}</h4>
                <small className="text-muted">Travel Records</small>
                <div className="mt-2">
                  <div className="text-success small">
                    ↑ {reports.travelSummary.arrivals} Arrivals
                  </div>
                  <div className="text-danger small">
                    ↓ {reports.travelSummary.departures} Departures
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaHotel className="text-success mb-2" size={24} />
                <h4 className="text-success mb-1">{reports.accommodationSummary.total}</h4>
                <small className="text-muted">Accommodation</small>
                <div className="mt-2">
                  <div className="text-info small">
                    {reports.accommodationSummary.totalNights} Total Nights
                  </div>
                  <div className="text-muted small">
                    Avg: {reports.accommodationSummary.averageNights?.toFixed(1)} nights
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaCar className="text-info mb-2" size={24} />
                <h4 className="text-info mb-1">{reports.vehicleSummary.total}</h4>
                <small className="text-muted">Vehicle Trips</small>
                <div className="mt-2">
                  <div className="text-success small">
                    {reports.vehicleSummary.totalPassengers} Passengers
                  </div>
                  <div className="text-muted small">
                    Avg: {reports.vehicleSummary.averagePassengers?.toFixed(1)} per trip
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaChartBar className="text-warning mb-2" size={24} />
                <h4 className="text-warning mb-1">
                  ${((reports.travelSummary.costs?.total || 0) + 
                     (reports.accommodationSummary.costs?.total || 0) + 
                     (reports.vehicleSummary.costs?.total || 0)).toFixed(0)}
                </h4>
                <small className="text-muted">Total Cost</small>
                <div className="mt-2">
                  <div className="text-primary small">
                    Travel: ${reports.travelSummary.costs?.total?.toFixed(0) || 0}
                  </div>
                  <div className="text-success small">
                    Stay: ${reports.accommodationSummary.costs?.total?.toFixed(0) || 0}
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
                  <FaChartBar className="me-2" />
                  Overview
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'travel' ? 'active' : ''}`}
                  onClick={() => setActiveTab('travel')}
                >
                  <FaPlane className="me-2" />
                  Travel Analysis
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'accommodation' ? 'active' : ''}`}
                  onClick={() => setActiveTab('accommodation')}
                >
                  <FaHotel className="me-2" />
                  Accommodation
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'vehicle' ? 'active' : ''}`}
                  onClick={() => setActiveTab('vehicle')}
                >
                  <FaCar className="me-2" />
                  Vehicles
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'events' ? 'active' : ''}`}
                  onClick={() => setActiveTab('events')}
                >
                  <FaCalendarAlt className="me-2" />
                  Event Breakdown
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card glass-card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <FaChartPie className="me-2 text-primary" />
                    Travel Mode Distribution
                  </h5>
                </div>
                <div className="card-body">
                  {Object.keys(reports.travelSummary.byMode || {}).length === 0 ? (
                    <div className="text-center py-4">
                      <FaInfoCircle className="text-muted mb-2" size={24} />
                      <p className="text-muted">No travel data available</p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {Object.entries(reports.travelSummary.byMode || {}).map(([mode, count]) => (
                        <div key={mode} className="col-6">
                          <div className="d-flex justify-content-between align-items-center p-2 border rounded glass-effect">
                            <div className="d-flex align-items-center">
                              {mode === 'Flight' && <FaPlane className="me-2 text-primary" />}
                              {mode === 'Train' && <FaTrain className="me-2 text-success" />}
                              {mode === 'Car' && <FaCar className="me-2 text-info" />}
                              {mode === 'Bus' && <FaBus className="me-2 text-warning" />}
                              <span>{mode}</span>
                            </div>
                            <span className="badge bg-primary glass-badge">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card glass-card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <FaChartBar className="me-2 text-primary" />
                    Status Overview
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <h6 className="text-muted">Travel Status</h6>
                      {Object.entries(reports.travelSummary.byStatus || {}).map(([status, count]) => (
                        <div key={status} className="d-flex justify-content-between align-items-center mb-2">
                          <span>{status}</span>
                          <span className={`badge glass-badge ${getStatusBadgeClass(status)}`}>
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'travel' && (
          <div className="card glass-card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <FaPlane className="me-2 text-primary" />
                Travel Analysis
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-4 mb-4">
                <div className="col-md-4">
                  <div className="text-center p-3 border rounded glass-effect">
                    <h4 className="text-primary">${reports.travelSummary.costs?.total?.toFixed(2) || 0}</h4>
                    <small className="text-muted">Total Travel Cost</small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center p-3 border rounded glass-effect">
                    <h4 className="text-success">${reports.travelSummary.costs?.average?.toFixed(2) || 0}</h4>
                    <small className="text-muted">Average per Trip</small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center p-3 border rounded glass-effect">
                    <h4 className="text-info">{reports.travelSummary.total}</h4>
                    <small className="text-muted">Total Trips</small>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Travel Mode</th>
                      <th>Count</th>
                      <th>Percentage</th>
                      <th>Status Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(reports.travelSummary.byMode || {}).map(([mode, count]) => (
                      <tr key={mode}>
                        <td>
                          <div className="d-flex align-items-center">
                            {mode === 'Flight' && <FaPlane className="me-2 text-primary" />}
                            {mode === 'Train' && <FaTrain className="me-2 text-success" />}
                            {mode === 'Car' && <FaCar className="me-2 text-info" />}
                            {mode === 'Bus' && <FaBus className="me-2 text-warning" />}
                            {mode}
                          </div>
                        </td>
                        <td className="fw-semibold">{count}</td>
                        <td>
                          {reports.travelSummary.total > 0 ? 
                            ((count / reports.travelSummary.total) * 100).toFixed(1) : 0
                          }%
                        </td>
                        <td>
                          <div className="progress" style={{ height: '20px' }}>
                            <div 
                              className="progress-bar bg-success" 
                              style={{ width: `${(count / reports.travelSummary.total) * 100}%` }}
                            >
                              {count}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'accommodation' && (
          <div className="card glass-card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <FaHotel className="me-2 text-primary" />
                Accommodation Analysis
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-4 mb-4">
                <div className="col-md-3">
                  <div className="text-center p-3 border rounded glass-effect">
                    <h4 className="text-primary">{reports.accommodationSummary.total}</h4>
                    <small className="text-muted">Total Assignments</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 border rounded glass-effect">
                    <h4 className="text-success">{reports.accommodationSummary.totalNights}</h4>
                    <small className="text-muted">Total Nights</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 border rounded glass-effect">
                    <h4 className="text-info">{reports.accommodationSummary.averageNights?.toFixed(1) || 0}</h4>
                    <small className="text-muted">Avg Nights/Guest</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 border rounded glass-effect">
                    <h4 className="text-warning">${reports.accommodationSummary.costs?.total?.toFixed(2) || 0}</h4>
                    <small className="text-muted">Total Cost</small>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Hotel</th>
                      <th>Assignments</th>
                      <th>Percentage</th>
                      <th>Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(reports.accommodationSummary.byHotel || {}).map(([hotel, count]) => (
                      <tr key={hotel}>
                        <td className="fw-semibold">{hotel}</td>
                        <td>{count}</td>
                        <td>
                          {reports.accommodationSummary.total > 0 ? 
                            ((count / reports.accommodationSummary.total) * 100).toFixed(1) : 0
                          }%
                        </td>
                        <td>
                          <div className="progress" style={{ height: '20px' }}>
                            <div 
                              className="progress-bar bg-info" 
                              style={{ width: `${(count / reports.accommodationSummary.total) * 100}%` }}
                            >
                              {count}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vehicle' && (
          <div className="card glass-card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <FaCar className="me-2 text-primary" />
                Vehicle Analysis
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-4 mb-4">
                <div className="col-md-4">
                  <div className="text-center p-3 border rounded glass-effect">
                    <h4 className="text-primary">{reports.vehicleSummary.total}</h4>
                    <small className="text-muted">Total Allocations</small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center p-3 border rounded glass-effect">
                    <h4 className="text-success">{reports.vehicleSummary.totalPassengers}</h4>
                    <small className="text-muted">Total Passengers</small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center p-3 border rounded glass-effect">
                    <h4 className="text-info">${reports.vehicleSummary.costs?.total?.toFixed(2) || 0}</h4>
                    <small className="text-muted">Total Cost</small>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Vehicle Type</th>
                      <th>Allocations</th>
                      <th>Percentage</th>
                      <th>Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(reports.vehicleSummary.byType || {}).map(([type, count]) => (
                      <tr key={type}>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaCar className="me-2 text-primary" />
                            {type}
                          </div>
                        </td>
                        <td className="fw-semibold">{count}</td>
                        <td>
                          {reports.vehicleSummary.total > 0 ? 
                            ((count / reports.vehicleSummary.total) * 100).toFixed(1) : 0
                          }%
                        </td>
                        <td>
                          <div className="progress" style={{ height: '20px' }}>
                            <div 
                              className="progress-bar bg-warning" 
                              style={{ width: `${(count / reports.vehicleSummary.total) * 100}%` }}
                            >
                              {count}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="card glass-card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <FaCalendarAlt className="me-2 text-primary" />
                Event-wise Breakdown
              </h5>
            </div>
            <div className="card-body">
              {reports.eventWiseBreakdown.length === 0 ? (
                <div className="text-center py-4">
                  <FaInfoCircle className="text-muted mb-3" size={48} />
                  <h5 className="text-muted">No event data available</h5>
                  <p className="text-muted">No logistics data found for the selected period.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Travel</th>
                        <th>Accommodation</th>
                        <th>Vehicle</th>
                        <th>Total Cost</th>
                        <th>Distribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.eventWiseBreakdown.map((event, index) => (
                        <tr key={index}>
                          <td className="fw-semibold">{event.event_name}</td>
                          <td>
                            <div>{event.travel.count} trips</div>
                            <small className="text-muted">${event.travel.cost.toFixed(2)}</small>
                          </td>
                          <td>
                            <div>{event.accommodation.count} assignments</div>
                            <small className="text-muted">${event.accommodation.cost.toFixed(2)}</small>
                          </td>
                          <td>
                            <div>{event.vehicle.count} allocations</div>
                            <small className="text-muted">${event.vehicle.cost.toFixed(2)}</small>
                          </td>
                          <td className="fw-semibold text-success">
                            ${event.total_cost.toFixed(2)}
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <div 
                                className="bg-primary" 
                                style={{ 
                                  width: `${event.total_cost > 0 ? (event.travel.cost / event.total_cost) * 100 : 0}%`, 
                                  height: '20px',
                                  minWidth: '2px'
                                }}
                                title={`Travel: ${((event.travel.cost / event.total_cost) * 100).toFixed(1)}%`}
                              ></div>
                              <div 
                                className="bg-success" 
                                style={{ 
                                  width: `${event.total_cost > 0 ? (event.accommodation.cost / event.total_cost) * 100 : 0}%`, 
                                  height: '20px',
                                  minWidth: '2px'
                                }}
                                title={`Accommodation: ${((event.accommodation.cost / event.total_cost) * 100).toFixed(1)}%`}
                              ></div>
                              <div 
                                className="bg-warning" 
                                style={{ 
                                  width: `${event.total_cost > 0 ? (event.vehicle.cost / event.total_cost) * 100 : 0}%`, 
                                  height: '20px',
                                  minWidth: '2px'
                                }}
                                title={`Vehicle: ${((event.vehicle.cost / event.total_cost) * 100).toFixed(1)}%`}
                              ></div>
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
      </div>
    </div>
  );
};

export default LogisticsReports;