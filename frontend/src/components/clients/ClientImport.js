import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  ProgressBar,
  Row,
  Col
} from 'react-bootstrap';
import { FaUpload, FaDownload, FaArrowLeft } from 'react-icons/fa';
import { clientAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const ClientImport = () => {
  const { hasPermission } = useAuth();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type (CSV or XLSX)
      const fileType = selectedFile.type;
      if (fileType !== 'text/csv' && 
          fileType !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && 
          !selectedFile.name.endsWith('.csv') && 
          !selectedFile.name.endsWith('.xlsx')) {
        toast.error('Please select a CSV or Excel file');
        e.target.value = null;
        return;
      }
      setFile(selectedFile);
      setUploadResult(null);
      setValidationErrors([]);
    }
  };
  
  const downloadTemplate = async () => {
    try {
      await clientAPI.downloadClientTemplate();
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setValidationErrors([]);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload with progress tracking
      const response = await clientAPI.uploadBulkClients(formData, {
        onUploadProgress: (progressEvent) => {
          const percentage = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentage);
        },
      });
      
      setUploadResult(response.data);
      
      if (response.data.success) {
        toast.success(`${response.data.imported} clients imported successfully!`);
      } else {
        toast.warning('Import completed with errors. Please review the details.');
        if (response.data.errors && response.data.errors.length > 0) {
          setValidationErrors(response.data.errors);
        }
      }
    } catch (error) {
      console.error('Error uploading clients:', error);
      
      if (error.response && error.response.data) {
        if (error.response.data.errors && error.response.data.errors.length > 0) {
          setValidationErrors(error.response.data.errors);
        } else {
          toast.error(error.response.data.message || 'Failed to import clients');
        }
      } else {
        toast.error('Failed to import clients');
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  if (!hasPermission(['clients_create'])) {
    return (
      <Container className="mt-4">
        <div className="alert alert-danger">
          You don't have permission to import clients.
        </div>
        <Button as={Link} to="/clients" variant="secondary">
          Back to Clients
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Bulk Import Clients</h2>
        <Button as={Link} to="/clients" variant="outline-secondary">
          <FaArrowLeft className="me-1" /> Back to Clients
        </Button>
      </div>
      
      <Card style={{
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '10px',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.17)'
      }}>
        <Card.Body>
          <Alert variant="info">
            <h5>Instructions:</h5>
            <ol className="mb-0">
              <li>Download the template file first</li>
              <li>Fill in the client data according to the template</li>
              <li>Upload the completed file</li>
              <li>Client name and customer_id are required fields</li>
              <li>If any errors occur during import, they will be displayed below</li>
            </ol>
          </Alert>
          
          <Button
            variant="outline-primary"
            className="mb-4"
            onClick={downloadTemplate}
          >
            <FaDownload className="me-2" /> Download Template
          </Button>
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Select CSV or Excel File</Form.Label>
              <Form.Control
                type="file"
                onChange={handleFileChange}
                accept=".csv,.xlsx"
                disabled={isUploading}
              />
              <Form.Text className="text-muted">
                Accepted formats: .csv, .xlsx
              </Form.Text>
            </Form.Group>
            
            <Button
              type="submit"
              variant="primary"
              disabled={!file || isUploading}
            >
              <FaUpload className="me-2" />
              {isUploading ? 'Uploading...' : 'Upload and Import'}
            </Button>
          </Form>
          
          {isUploading && (
            <div className="mt-4">
              <p>Uploading...</p>
              <ProgressBar animated now={uploadProgress} label={`${uploadProgress}%`} />
            </div>
          )}
          
          {uploadResult && (
            <Alert variant={uploadResult.success ? 'success' : 'warning'} className="mt-4">
              <h5>Import Result:</h5>
              <p>
                <strong>Total Processed:</strong> {uploadResult.total || 0}
              </p>
              <p>
                <strong>Successfully Imported:</strong> {uploadResult.imported || 0}
              </p>
              <p>
                <strong>Errors:</strong> {uploadResult.errors?.length || 0}
              </p>
            </Alert>
          )}
          
          {validationErrors.length > 0 && (
            <Card className="mt-4 border-danger">
              <Card.Header className="bg-danger text-white">
                <h5 className="mb-0">Validation Errors</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}><strong>Row</strong></Col>
                  <Col md={4}><strong>Field</strong></Col>
                  <Col md={4}><strong>Error</strong></Col>
                </Row>
                <hr />
                {validationErrors.map((error, index) => (
                  <Row key={index} className="mb-2">
                    <Col md={4}>Row {error.row || 'N/A'}</Col>
                    <Col md={4}>{error.field || 'N/A'}</Col>
                    <Col md={4}>{error.message}</Col>
                  </Row>
                ))}
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ClientImport;
