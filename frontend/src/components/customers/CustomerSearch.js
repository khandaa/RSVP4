import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaEye, FaEdit, FaTimes, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import axios from 'axios';
import { debounce } from 'lodash';

const CustomerSearch = ({ onSelect, placeholder = "Search customers...", showActions = true }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const navigate = useNavigate();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term) => {
      if (!term.trim()) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await axios.get('/api/customers');
        const filtered = response.data.filter(customer =>
          customer.customer_name?.toLowerCase().includes(term.toLowerCase()) ||
          customer.customer_email?.toLowerCase().includes(term.toLowerCase()) ||
          customer.customer_phone?.includes(term) ||
          customer.customer_city?.toLowerCase().includes(term.toLowerCase())
        );
        
        setSearchResults(filtered.slice(0, 10)); // Limit to 10 results
        setShowResults(true);
      } catch (error) {
        console.error('Error searching customers:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
    setSelectedIndex(-1);
  }, [searchTerm, debouncedSearch]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectCustomer(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleSelectCustomer = (customer) => {
    if (onSelect) {
      onSelect(customer);
      setSearchTerm(customer.customer_name);
    }
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.customer-search-container')) {
      setShowResults(false);
      setSelectedIndex(-1);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="customer-search-container position-relative">
      <div className="input-group">
        <span className="input-group-text glass-input">
          <FaSearch className={`${isSearching ? 'text-primary' : 'text-muted'}`} />
          {isSearching && (
            <div className="spinner-border spinner-border-sm ms-2" role="status">
              <span className="visually-hidden">Searching...</span>
            </div>
          )}
        </span>
        <input
          type="text"
          className="form-control glass-input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          autoComplete="off"
        />
        {searchTerm && (
          <button
            className="btn btn-outline-secondary glass-btn"
            type="button"
            onClick={clearSearch}
          >
            <FaTimes />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div 
          className="position-absolute w-100 mt-1 bg-white shadow-lg rounded glass-effect"
          style={{ zIndex: 1050, maxHeight: '400px', overflowY: 'auto' }}
        >
          {searchResults.length === 0 ? (
            <div className="p-3 text-center text-muted">
              {isSearching ? 'Searching...' : 'No customers found'}
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {searchResults.map((customer, index) => (
                <div
                  key={customer.customer_id}
                  className={`list-group-item list-group-item-action glass-effect border-0 ${
                    index === selectedIndex ? 'active' : ''
                  }`}
                  onClick={() => handleSelectCustomer(customer)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center mb-1">
                        <FaUser className="text-primary me-2 flex-shrink-0" />
                        <h6 className="mb-0 fw-semibold">{customer.customer_name}</h6>
                        <span className={`badge ms-2 ${
                          customer.customer_status === 'Active' 
                            ? 'bg-success' 
                            : 'bg-secondary'
                        }`}>
                          {customer.customer_status}
                        </span>
                      </div>
                      
                      <div className="small text-muted">
                        {customer.customer_email && (
                          <div className="d-flex align-items-center mb-1">
                            <FaEnvelope className="me-1" size={10} />
                            <span>{customer.customer_email}</span>
                          </div>
                        )}
                        
                        <div className="d-flex align-items-center gap-3">
                          {customer.customer_phone && (
                            <div className="d-flex align-items-center">
                              <FaPhone className="me-1" size={10} />
                              <span>{customer.customer_phone}</span>
                            </div>
                          )}
                          {customer.customer_city && (
                            <div className="d-flex align-items-center">
                              <FaMapMarkerAlt className="me-1" size={10} />
                              <span>{customer.customer_city}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {showActions && (
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-info glass-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customers/${customer.customer_id}`);
                          }}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary glass-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customers/${customer.customer_id}/edit`);
                          }}
                          title="Edit Customer"
                        >
                          <FaEdit />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {searchResults.length === 10 && (
            <div className="p-2 text-center border-top">
              <small className="text-muted">
                Showing first 10 results. 
                <button 
                  className="btn btn-link btn-sm p-0 ms-1"
                  onClick={() => navigate('/customers', { state: { searchTerm } })}
                >
                  View all results
                </button>
              </small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;