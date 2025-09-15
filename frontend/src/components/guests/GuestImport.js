import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaUpload, 
  FaTimes, 
  FaDownload,
  FaFileExcel,
  FaFileCsv,
  FaUsers,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCalendarAlt
} from 'react-icons/fa';

const GuestImport = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const { currentUser, hasRole } = useAuth();
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [uploadResults, setUploadResults] = useState(null);
  const [events, setEvents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(eventId || '');
  const [selectedCustomer, setSelectedCustomer] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoadingData(true);
      const [eventsResponse, customersResponse] = await Promise.all([
        fetch('/api/events', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json()),
        fetch('/api/customers', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json())
      ]);
      
      setEvents(eventsResponse.data || eventsResponse || []);
      setCustomers(customersResponse.data || customersResponse || []);
      
      // Auto-select customer for Customer Admin or Client Admin users
      if (currentUser && (hasRole('Customer Admin') || hasRole('Client Admin'))) {
        // Find customer by matching current user's email
        const userCustomer = (customersResponse.data || customersResponse || []).find(
          customer => customer.customer_email === currentUser.email
        );
        
        if (userCustomer) {
          setSelectedCustomer(userCustomer.customer_id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load form data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setUploadResults(null);
      } else {
        toast.error('Please select a valid CSV or Excel file');
        e.target.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'guest_first_name*',
      'guest_last_name*',
      'guest_email',
      'guest_phone',
      'guest_type',
      'guest_rsvp_status',
      'guest_address',
      'guest_city',
      'guest_state',
      'guest_country',
      'guest_dietary_preferences',
      'guest_special_requirements',
      'guest_notes'
    ];

    const sampleData = [
      [
        'John',
        'Doe',
        'john.doe@example.com',
        '+1234567890',
        'Corporate',
        'Pending',
        '123 Main Street',
        'New York',
        'NY',
        'USA',
        'Vegetarian',
        'Wheelchair accessible seating',
        'VIP guest'
      ],
      [
        'Jane',
        'Smith',
        'jane.smith@example.com',
        '+1987654321',
        'VIP',
        'Confirmed',
        '456 Oak Avenue',
        'Los Angeles',
        'CA',
        'USA',
        'No restrictions',
        '',
        'Media contact'
      ]
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'guest_import_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!selectedEvent) {
      toast.error('Please select an event');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('event_id', selectedEvent);
      if (selectedCustomer) {
        formData.append('customer_id', selectedCustomer);
      }

      const response = await fetch('/api/guests/bulk-import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setUploadResults(result);
      
      if (result.errors && result.errors.length > 0) {
        toast.warning(`Import completed with ${result.errors.length} errors. Check the results below.`);
      } else {
        toast.success(`Successfully imported ${result.imported} guests`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to import guests. Please check your file format and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (eventId) {
      navigate(`/guests?eventId=${eventId}`);
    } else {
      navigate('/guests');
    }
  };

  if (isLoadingData) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading import form...</p>
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
            <button 
              className="btn btn-outline-secondary glass-btn me-3"
              onClick={handleCancel}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-dark fw-bold mb-0">Import Guests</h2>
              <p className="text-muted">
                {eventId ? 'Import guests for the selected event' : 'Bulk import guests from CSV/Excel file'}
              </p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button 
              type="button"
              className="btn btn-outline-secondary glass-btn"
              onClick={handleCancel}
              disabled={isUploading}
            >
              <FaTimes className="me-2" />
              Cancel
            </button>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-6">
            {/* Import Form */}
            <div className="card glass-card mb-4">
              <div className="card-body p-4">
                <h5 className="card-title mb-4">
                  <FaUpload className="me-2 text-primary" />
                  Upload Guest Data
                </h5>

                {/* Event Selection */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    <FaCalendarAlt className="me-2 text-primary" />
                    Target Event *
                  </label>
                  <select
                    className="form-select glass-input"
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    disabled={isUploading || eventId}
                  >
                    <option value="">Select an event</option>
                    {events.map(event => (
                      <option key={event.event_id} value={event.event_id}>
                        {event.event_name} ({event.client_name})
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    All imported guests will be associated with this event
                  </div>
                </div>

                {/* Customer Selection - Hidden for Customer Admin and Client Admin */}
                {!(hasRole('Customer Admin') || hasRole('Client Admin')) && (
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      Default Customer (Optional)
                    </label>
                    <select
                      className="form-select glass-input"
                      value={selectedCustomer}
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                      disabled={isUploading}
                    >
                      <option value="">No default customer</option>
                      {customers.map(customer => (
                        <option key={customer.customer_id} value={customer.customer_id}>
                          {customer.customer_name}
                        </option>
                      ))}
                    </select>
                    <div className="form-text">
                      This customer will be assigned to guests without a specified customer
                    </div>
                  </div>
                )}
                
                {/* Customer Display for Customer Admin and Client Admin */}
                {(hasRole('Customer Admin') || hasRole('Client Admin')) && selectedCustomer && (
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      Default Customer
                    </label>
                    <div className="form-control glass-input bg-light" style={{ backgroundColor: '#f8f9fa' }}>
                      {customers.find(c => c.customer_id.toString() === selectedCustomer)?.customer_name || 'Loading...'}
                    </div>
                    <div className="form-text">
                      Customer is automatically selected based on your account. All imported guests will be assigned to this customer.
                    </div>
                  </div>
                )}

                {/* File Upload */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Select File *
                  </label>
                  <input
                    type="file"
                    className="form-control glass-input"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                  <div className="form-text">
                    Supported formats: CSV, Excel (.xlsx, .xls)
                  </div>
                </div>

                {/* Selected File Info */}
                {selectedFile && (
                  <div className="alert alert-info glass-effect mb-4">
                    <div className="d-flex align-items-center">
                      {selectedFile.name.endsWith('.csv') ? (
                        <FaFileCsv className="text-success me-2" size={20} />
                      ) : (
                        <FaFileExcel className="text-success me-2" size={20} />
                      )}
                      <div>
                        <div className="fw-semibold">{selectedFile.name}</div>
                        <small className="text-muted">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </small>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <div className="d-grid">
                  <button
                    className="btn btn-primary glass-btn-primary"
                    onClick={handleUpload}
                    disabled={isUploading || !selectedFile || !selectedEvent}
                  >
                    {isUploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Importing...
                      </>
                    ) : (
                      <>
                        <FaUpload className="me-2" />
                        Import Guests
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Template Download */}
            <div className="card glass-card mb-4">
              <div className="card-body p-4">
                <h5 className="card-title mb-3">
                  <FaDownload className="me-2 text-primary" />
                  Download Template
                </h5>
                <p className="text-muted mb-3">
                  Download the CSV template with sample data to ensure your file is properly formatted.
                </p>
                <button
                  className="btn btn-outline-primary glass-btn"
                  onClick={downloadTemplate}
                  disabled={isUploading}
                >
                  <FaDownload className="me-2" />
                  Download CSV Template
                </button>
              </div>
            </div>

            {/* Format Guidelines */}
            <div className="card glass-card mb-4">
              <div className="card-body p-4">
                <h5 className="card-title mb-3">
                  <FaInfoCircle className="me-2 text-primary" />
                  Import Guidelines
                </h5>
                <div className="row g-3">
                  <div className="col-12">
                    <h6 className="text-success">Required Fields</h6>
                    <ul className="mb-3">
                      <li><code>guest_first_name</code> - Guest first name</li>
                      <li><code>guest_last_name</code> - Guest last name</li>
                    </ul>
                  </div>
                  <div className="col-12">
                    <h6 className="text-info">Optional Fields</h6>
                    <ul className="mb-3">
                      <li><code>guest_email</code> - Email address</li>
                      <li><code>guest_phone</code> - Phone number</li>
                      <li><code>guest_type</code> - Individual, Family, Corporate, VIP, Media</li>
                      <li><code>guest_rsvp_status</code> - Pending, Confirmed, Declined, Tentative</li>
                      <li><code>guest_address</code> - Full address</li>
                      <li><code>guest_city</code> - City</li>
                      <li><code>guest_state</code> - State/Province</li>
                      <li><code>guest_country</code> - Country</li>
                      <li><code>guest_dietary_preferences</code> - Dietary restrictions</li>
                      <li><code>guest_special_requirements</code> - Special accommodations</li>
                      <li><code>guest_notes</code> - Internal notes</li>
                    </ul>
                  </div>
                  <div className="col-12">
                    <h6 className="text-warning">Important Notes</h6>
                    <ul className="mb-0">
                      <li>First row should contain column headers</li>
                      <li>Required fields marked with * must have values</li>
                      <li>Invalid email formats will be flagged</li>
                      <li>Duplicate guests (same name + email) will be skipped</li>
                      <li>Maximum file size: 10MB</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Results */}
        {uploadResults && (
          <div className="row justify-content-center mt-4">
            <div className="col-lg-8 col-xl-6">
              <div className="card glass-card">
                <div className="card-body p-4">
                  <h5 className="card-title mb-4">
                    {uploadResults.errors && uploadResults.errors.length > 0 ? (
                      <FaExclamationTriangle className="me-2 text-warning" />
                    ) : (
                      <FaCheckCircle className="me-2 text-success" />
                    )}
                    Import Results
                  </h5>

                  {/* Summary */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                        <div className="h4 text-success mb-1">{uploadResults.imported || 0}</div>
                        <small className="text-success">Successfully Imported</small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                        <div className="h4 text-warning mb-1">{uploadResults.skipped || 0}</div>
                        <small className="text-warning">Skipped (Duplicates)</small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-center p-3 bg-danger bg-opacity-10 rounded">
                        <div className="h4 text-danger mb-1">
                          {uploadResults.errors ? uploadResults.errors.length : 0}
                        </div>
                        <small className="text-danger">Errors</small>
                      </div>
                    </div>
                  </div>

                  {/* Errors */}
                  {uploadResults.errors && uploadResults.errors.length > 0 && (
                    <div className="mb-4">
                      <h6 className="text-danger mb-3">Import Errors</h6>
                      <div className="bg-danger bg-opacity-10 rounded p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {uploadResults.errors.map((error, index) => (
                          <div key={index} className="mb-2">
                            <strong>Row {error.row}:</strong> {error.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-primary glass-btn-primary"
                      onClick={() => {
                        if (eventId) {
                          navigate(`/guests?eventId=${eventId}`);
                        } else {
                          navigate('/guests');
                        }
                      }}
                    >
                      <FaUsers className="me-2" />
                      View Imported Guests
                    </button>
                    <button
                      className="btn btn-outline-secondary glass-btn"
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadResults(null);
                        document.querySelector('input[type="file"]').value = '';
                      }}
                    >
                      Import More
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

export default GuestImport;