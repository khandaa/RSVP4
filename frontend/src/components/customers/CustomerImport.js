import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaUpload, 
  FaDownload, 
  FaFile, 
  FaFileExcel, 
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes
} from 'react-icons/fa';
import axios from 'axios';

const CustomerImport = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (file) => {
    const allowedTypes = [
      'text/csv', 
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.type) || file.name.endsWith('.csv')) {
      setSelectedFile(file);
      setUploadResults(null);
    } else {
      toast.error('Please select a CSV or Excel file');
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      'customer_name,customer_email,customer_phone,customer_address,customer_city,customer_status',
      'John Doe,john@example.com,1234567890,123 Main St,New York,Active',
      'Jane Smith,jane@example.com,0987654321,456 Oak Ave,Los Angeles,Active',
      'Bob Johnson,,5551234567,789 Pine Rd,Chicago,Inactive'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'customer_import_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Create a custom endpoint for bulk customer import
      const response = await axios.post('/api/customers/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadResults(response.data);
      
      if (response.data.errors && response.data.errors.length > 0) {
        toast.warning(`Import completed with ${response.data.errors.length} errors`);
      } else {
        toast.success(`Successfully imported ${response.data.successful} customers`);
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.response?.data?.error || 'Failed to import customers');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResults(null);
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="glass-bg min-vh-100 p-4">
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <button 
              className="btn btn-outline-secondary glass-btn me-3"
              onClick={() => navigate('/customers')}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-dark fw-bold mb-0">Import Customers</h2>
              <p className="text-muted mb-0">Bulk import customers from CSV or Excel file</p>
            </div>
          </div>
          <button 
            className="btn btn-outline-primary glass-btn"
            onClick={downloadTemplate}
          >
            <FaDownload className="me-2" />
            Download Template
          </button>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-6">
            {/* Upload Section */}
            <div className="card glass-card mb-4">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <FaUpload className="me-2 text-primary" />
                  File Upload
                </h5>
              </div>
              <div className="card-body">
                {!selectedFile ? (
                  <>
                    {/* Drag & Drop Area */}
                    <div 
                      className={`border-2 border-dashed rounded p-5 text-center glass-effect ${
                        dragActive ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <FaFileExcel className="text-primary mb-3" size={48} />
                      <h5 className="mb-3">Drag & Drop your file here</h5>
                      <p className="text-muted mb-3">or</p>
                      
                      <input
                        id="fileInput"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileInput}
                        className="d-none"
                      />
                      <label htmlFor="fileInput" className="btn btn-primary glass-btn-primary">
                        Choose File
                      </label>
                      
                      <div className="mt-3">
                        <small className="text-muted">
                          Supported formats: CSV, Excel (.xlsx, .xls)
                        </small>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Selected File */}
                    <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded glass-effect">
                      <div className="d-flex align-items-center">
                        <FaFile className="text-primary me-2" />
                        <div>
                          <div className="fw-semibold">{selectedFile.name}</div>
                          <small className="text-muted">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </small>
                        </div>
                      </div>
                      <button 
                        className="btn btn-sm btn-outline-danger glass-btn"
                        onClick={resetUpload}
                        disabled={isUploading}
                      >
                        <FaTimes />
                      </button>
                    </div>

                    {/* Upload Button */}
                    <div className="text-center mt-4">
                      <button 
                        className="btn btn-success glass-btn-success"
                        onClick={handleUpload}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Importing...
                          </>
                        ) : (
                          <>
                            <FaUpload className="me-2" />
                            Import Customers
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Template Information */}
            <div className="card glass-card mb-4">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <FaFile className="me-2 text-info" />
                  Template Format
                </h5>
              </div>
              <div className="card-body">
                <p className="mb-3">Your CSV/Excel file should include the following columns:</p>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Column</th>
                        <th>Required</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>customer_name</code></td>
                        <td><span className="badge bg-danger">Required</span></td>
                        <td>Full name of the customer</td>
                      </tr>
                      <tr>
                        <td><code>customer_email</code></td>
                        <td><span className="badge bg-secondary">Optional</span></td>
                        <td>Valid email address</td>
                      </tr>
                      <tr>
                        <td><code>customer_phone</code></td>
                        <td><span className="badge bg-secondary">Optional</span></td>
                        <td>Phone number (10+ digits)</td>
                      </tr>
                      <tr>
                        <td><code>customer_address</code></td>
                        <td><span className="badge bg-secondary">Optional</span></td>
                        <td>Full address</td>
                      </tr>
                      <tr>
                        <td><code>customer_city</code></td>
                        <td><span className="badge bg-secondary">Optional</span></td>
                        <td>City name</td>
                      </tr>
                      <tr>
                        <td><code>customer_status</code></td>
                        <td><span className="badge bg-secondary">Optional</span></td>
                        <td>Active or Inactive (defaults to Active)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Upload Results */}
            {uploadResults && (
              <div className="card glass-card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <FaCheckCircle className="me-2 text-success" />
                    Import Results
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <div className="text-center p-3 bg-success bg-opacity-10 rounded glass-effect">
                        <h4 className="text-success mb-1">{uploadResults.successful || 0}</h4>
                        <small className="text-muted">Successful</small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-center p-3 bg-danger bg-opacity-10 rounded glass-effect">
                        <h4 className="text-danger mb-1">{uploadResults.errors?.length || 0}</h4>
                        <small className="text-muted">Errors</small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-center p-3 bg-info bg-opacity-10 rounded glass-effect">
                        <h4 className="text-info mb-1">{uploadResults.total || 0}</h4>
                        <small className="text-muted">Total Processed</small>
                      </div>
                    </div>
                  </div>

                  {uploadResults.errors && uploadResults.errors.length > 0 && (
                    <div className="alert alert-warning">
                      <h6 className="alert-heading">
                        <FaExclamationTriangle className="me-2" />
                        Import Errors ({uploadResults.errors.length})
                      </h6>
                      <div className="mt-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {uploadResults.errors.map((error, index) => (
                          <div key={index} className="mb-2 p-2 bg-white rounded">
                            <strong>Row {error.row}:</strong> {error.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-center mt-4">
                    <div className="btn-group" role="group">
                      <button 
                        className="btn btn-outline-primary glass-btn"
                        onClick={resetUpload}
                      >
                        Import More
                      </button>
                      <button 
                        className="btn btn-primary glass-btn-primary"
                        onClick={() => navigate('/customers')}
                      >
                        View Customers
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerImport;