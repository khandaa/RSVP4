import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FaUpload, 
  FaDownload, 
  FaEnvelope, 
  FaSms, 
  FaWhatsapp, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaQuestionCircle, 
  FaFilter, 
  FaSort, 
  FaSearch,
  FaSync,
  FaFileExport,
  FaUsers,
  FaUserCheck,
  FaEdit,
  FaTrash
} from 'react-icons/fa';
import axios from 'axios';
import * as XLSX from 'xlsx';

const RSVPBulkManagement = () => {
  const [rsvps, setRsvps] = useState([]);
  const [filteredRsvps, setFilteredRsvps] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedRsvps, setSelectedRsvps] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [importErrors, setImportErrors] = useState([]);
  const [importPreview, setImportPreview] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchRsvps();
    }
  }, [selectedEvent]);

  useEffect(() => {
    applyFilters();
  }, [rsvps, searchTerm, filterStatus]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/events');
      setEvents(response.data);
      if (response.data.length > 0) {
        setSelectedEvent(response.data[0].event_id);
      }
    } catch (error) {
      toast.error('Failed to fetch events');
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRsvps = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/rsvp/event/${selectedEvent}`);
      setRsvps(response.data);
      setFilteredRsvps(response.data);
      setSelectedRsvps([]);
    } catch (error) {
      toast.error('Failed to fetch RSVPs');
      console.error('Error fetching RSVPs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...rsvps];

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(rsvp => 
        rsvp.guest_first_name?.toLowerCase().includes(term) || 
        rsvp.guest_last_name?.toLowerCase().includes(term) || 
        rsvp.guest_email?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (filterStatus) {
      filtered = filtered.filter(rsvp => rsvp.rsvp_status === filterStatus);
    }

    setFilteredRsvps(filtered);
  };

  const handleSelectAll = () => {
    if (selectedRsvps.length === filteredRsvps.length) {
      setSelectedRsvps([]);
    } else {
      setSelectedRsvps(filteredRsvps.map(rsvp => rsvp.rsvp_id));
    }
  };

  const handleSelectRsvp = (rsvpId) => {
    if (selectedRsvps.includes(rsvpId)) {
      setSelectedRsvps(selectedRsvps.filter(id => id !== rsvpId));
    } else {
      setSelectedRsvps([...selectedRsvps, rsvpId]);
    }
  };

  const handleBulkAction = async () => {
    if (!selectedRsvps.length) {
      toast.warn('No RSVPs selected');
      return;
    }

    try {
      setIsLoading(true);
      
      switch (bulkAction) {
        case 'update_status':
          await axios.post('/api/rsvp/bulk/update-status', {
            rsvp_ids: selectedRsvps,
            status: filterStatus || 'Confirmed'
          });
          toast.success(`Updated ${selectedRsvps.length} RSVPs`);
          break;
          
        case 'send_reminders':
          await axios.post('/api/rsvp/bulk/send-reminders', {
            rsvp_ids: selectedRsvps
          });
          toast.success(`Sent reminders to ${selectedRsvps.length} guests`);
          break;
          
        case 'delete':
          await axios.post('/api/rsvp/bulk/delete', {
            rsvp_ids: selectedRsvps
          });
          toast.success(`Deleted ${selectedRsvps.length} RSVPs`);
          break;
          
        default:
          toast.error('Invalid action');
      }
      
      fetchRsvps();
      setShowBulkUpdateModal(false);
      setSelectedRsvps([]);
      
    } catch (error) {
      toast.error('Bulk action failed');
      console.error('Error performing bulk action:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImportFile(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Validate the data
          const errors = [];
          const validRows = [];
          
          jsonData.forEach((row, index) => {
            if (!row.guest_id && !row.guest_email) {
              errors.push(`Row ${index + 2}: Missing guest identification (ID or email)`);
            } else if (!row.rsvp_status || !['Confirmed', 'Declined', 'Tentative', 'Pending'].includes(row.rsvp_status)) {
              errors.push(`Row ${index + 2}: Invalid RSVP status`);
            } else {
              validRows.push(row);
            }
          });
          
          setImportErrors(errors);
          setImportPreview(validRows.slice(0, 5)); // Show first 5 rows as preview
          
        } catch (error) {
          toast.error('Failed to parse the import file');
          console.error('Import file parsing error:', error);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleImport = async () => {
    if (!importFile || importErrors.length > 0) {
      toast.error('Please fix import errors before proceeding');
      return;
    }
    
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('event_id', selectedEvent);
      
      const response = await axios.post('/api/rsvp/bulk/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success(`Successfully imported ${response.data.imported} RSVPs`);
      setShowImportModal(false);
      setImportFile(null);
      setImportErrors([]);
      setImportPreview([]);
      fetchRsvps();
      
    } catch (error) {
      toast.error('RSVP import failed');
      console.error('Error importing RSVPs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportTemplate = () => {
    // Create template with headers
    const template = [
      {
        guest_id: '',
        guest_email: '',
        rsvp_status: 'Confirmed', // Default value
        dietary_requirements: '',
        special_requirements: '',
        plus_one_count: '0',
        comments: ''
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'RSVP Template');
    XLSX.writeFile(workbook, 'rsvp_bulk_import_template.xlsx');
    
    toast.success('Template downloaded successfully');
  };

  const handleExportRsvps = () => {
    const dataToExport = filteredRsvps.map(rsvp => ({
      guest_id: rsvp.guest_id,
      guest_name: `${rsvp.guest_first_name} ${rsvp.guest_last_name}`,
      guest_email: rsvp.guest_email,
      rsvp_status: rsvp.rsvp_status,
      dietary_requirements: rsvp.dietary_requirements,
      special_requirements: rsvp.special_requirements,
      plus_one_count: rsvp.plus_one_count,
      response_date: rsvp.response_date
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'RSVPs');
    
    const eventName = events.find(e => e.event_id === selectedEvent)?.event_name || 'event';
    const fileName = `rsvp_export_${eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
    
    toast.success('RSVPs exported successfully');
  };

  return (
    <div className="container-fluid px-4 py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <FaUsers className="me-2" /> Bulk RSVP Management
        </h2>
        <div className="d-flex">
          <button 
            className="btn btn-primary me-2" 
            onClick={() => setShowImportModal(true)}
          >
            <FaUpload className="me-1" /> Import RSVPs
          </button>
          <button 
            className="btn btn-outline-primary me-2" 
            onClick={handleExportTemplate}
          >
            <FaDownload className="me-1" /> Export Template
          </button>
          <button 
            className="btn btn-success" 
            onClick={handleExportRsvps}
            disabled={filteredRsvps.length === 0}
          >
            <FaFileExport className="me-1" /> Export RSVPs
          </button>
        </div>
      </div>

      <div className="card glass-card mb-4">
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-3">
              <label className="form-label">Select Event</label>
              <select 
                className="form-select"
                value={selectedEvent}
                onChange={e => setSelectedEvent(e.target.value)}
                disabled={isLoading}
              >
                {events.map(event => (
                  <option key={event.event_id} value={event.event_id}>
                    {event.event_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-md-3">
              <label className="form-label">Search</label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search guests..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="col-md-3">
              <label className="form-label">Filter by Status</label>
              <select
                className="form-select"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Declined">Declined</option>
                <option value="Tentative">Tentative</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            
            <div className="col-md-3">
              <label className="form-label">Bulk Actions</label>
              <div className="d-flex">
                <select
                  className="form-select me-2"
                  value={bulkAction}
                  onChange={e => setBulkAction(e.target.value)}
                  disabled={selectedRsvps.length === 0}
                >
                  <option value="">Select Action</option>
                  <option value="update_status">Update Status</option>
                  <option value="send_reminders">Send Reminders</option>
                  <option value="delete">Delete RSVPs</option>
                </select>
                <button
                  className="btn btn-primary"
                  disabled={!bulkAction || selectedRsvps.length === 0}
                  onClick={() => setShowBulkUpdateModal(true)}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* RSVP Table */}
          {isLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading RSVPs...</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={
                            filteredRsvps.length > 0 && 
                            selectedRsvps.length === filteredRsvps.length
                          }
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th>Guest Name</th>
                      <th>Email</th>
                      <th>RSVP Status</th>
                      <th>Response Date</th>
                      <th>+1s</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRsvps.length > 0 ? (
                      filteredRsvps.map(rsvp => (
                        <tr key={rsvp.rsvp_id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedRsvps.includes(rsvp.rsvp_id)}
                              onChange={() => handleSelectRsvp(rsvp.rsvp_id)}
                            />
                          </td>
                          <td>{`${rsvp.guest_first_name} ${rsvp.guest_last_name}`}</td>
                          <td>{rsvp.guest_email}</td>
                          <td>
                            <span className={`badge ${
                              rsvp.rsvp_status === 'Confirmed' ? 'bg-success' :
                              rsvp.rsvp_status === 'Declined' ? 'bg-danger' :
                              rsvp.rsvp_status === 'Tentative' ? 'bg-warning' :
                              'bg-secondary'
                            }`}>
                              {rsvp.rsvp_status}
                            </span>
                          </td>
                          <td>
                            {rsvp.response_date ? new Date(rsvp.response_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td>{rsvp.plus_one_count || 0}</td>
                          <td>
                            <div className="btn-group">
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => {
                                  // View/Edit individual RSVP
                                  // We would navigate to the individual RSVP view
                                }}
                              >
                                <FaEdit />
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => {
                                  // Delete individual RSVP
                                  handleSelectRsvp(rsvp.rsvp_id);
                                  setBulkAction('delete');
                                  setShowBulkUpdateModal(true);
                                }}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          {selectedEvent ? 'No RSVPs found for this event' : 'Please select an event'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredRsvps.length > 0 && (
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{selectedRsvps.length}</strong> of <strong>{filteredRsvps.length}</strong> RSVPs selected
                  </div>
                  <div>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={fetchRsvps}
                    >
                      <FaSync className="me-1" /> Refresh
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Import RSVPs</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowImportModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Upload Excel/CSV File</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                  />
                  <div className="form-text">
                    Download the template first to ensure correct format
                  </div>
                </div>

                {importErrors.length > 0 && (
                  <div className="alert alert-danger">
                    <strong>Import Errors:</strong>
                    <ul className="mb-0">
                      {importErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {importPreview.length > 0 && (
                  <div className="mt-3">
                    <h6>Data Preview:</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            {Object.keys(importPreview[0]).map(key => (
                              <th key={key}>{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.map((row, i) => (
                            <tr key={i}>
                              {Object.values(row).map((value, j) => (
                                <td key={j}>{value}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {importPreview.length < 5 && (
                      <div className="form-text">
                        Showing all {importPreview.length} records
                      </div>
                    )}
                    {importPreview.length === 5 && (
                      <div className="form-text">
                        Showing first 5 records. Full import will process all records.
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleImport}
                  disabled={!importFile || importErrors.length > 0 || isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Importing...
                    </>
                  ) : 'Import RSVPs'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      {showBulkUpdateModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {bulkAction === 'update_status' ? 'Update RSVP Status' :
                   bulkAction === 'send_reminders' ? 'Send RSVP Reminders' :
                   bulkAction === 'delete' ? 'Delete RSVPs' :
                   'Bulk Action'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowBulkUpdateModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  {bulkAction === 'update_status' && `Update ${selectedRsvps.length} RSVPs to status:`}
                  {bulkAction === 'send_reminders' && `Send reminders to ${selectedRsvps.length} guests?`}
                  {bulkAction === 'delete' && `Are you sure you want to delete ${selectedRsvps.length} RSVPs? This cannot be undone.`}
                </p>

                {bulkAction === 'update_status' && (
                  <select
                    className="form-select"
                    value={filterStatus || 'Confirmed'}
                    onChange={e => setFilterStatus(e.target.value)}
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Declined">Declined</option>
                    <option value="Tentative">Tentative</option>
                    <option value="Pending">Pending</option>
                  </select>
                )}

                {bulkAction === 'send_reminders' && (
                  <div className="d-flex justify-content-around mb-3">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="emailReminder" defaultChecked />
                      <label className="form-check-label" htmlFor="emailReminder">
                        <FaEnvelope className="me-1" /> Email
                      </label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="smsReminder" />
                      <label className="form-check-label" htmlFor="smsReminder">
                        <FaSms className="me-1" /> SMS
                      </label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="whatsappReminder" />
                      <label className="form-check-label" htmlFor="whatsappReminder">
                        <FaWhatsapp className="me-1" /> WhatsApp
                      </label>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBulkUpdateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${bulkAction === 'delete' ? 'btn-danger' : 'btn-primary'}`}
                  onClick={handleBulkAction}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : bulkAction === 'update_status' ? 'Update Status' :
                     bulkAction === 'send_reminders' ? 'Send Reminders' :
                     bulkAction === 'delete' ? 'Delete' :
                     'Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Background overlay for modals */}
      {(showImportModal || showBulkUpdateModal) && (
        <div className="modal-backdrop show"></div>
      )}
    </div>
  );
};

export default RSVPBulkManagement;
