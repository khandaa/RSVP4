import React, { useState, useEffect, useRef } from 'react';
import { FaUsers, FaPlus, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { guestGroupAPI } from '../../services/api';

const GuestGroupTypeahead = ({
  value,
  onChange,
  clientId,
  eventId,
  disabled = false,
  placeholder = "Type to search or create new group...",
  className = "",
  error = ""
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allGuestGroups, setAllGuestGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  const inputRef = useRef(null);
  const suggestionRefs = useRef([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  // Load all guest groups
  useEffect(() => {
    const fetchGuestGroups = async () => {
      try {
        setIsLoading(true);
        const response = await guestGroupAPI.getGuestGroups();
        const groups = response.data || response || [];
        setAllGuestGroups(groups.filter(g => g && g.group_name));
      } catch (error) {
        console.error('Error fetching guest groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuestGroups();
  }, []);

  // Update input value when external value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || '');
    }
  }, [value]);

  // Filter suggestions based on input
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([]);
      return;
    }

    const filtered = allGuestGroups.filter(group =>
      group.group_name.toLowerCase().includes(inputValue.toLowerCase())
    );

    setSuggestions(filtered);
  }, [inputValue, allGuestGroups]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowSuggestions(true);
    setActiveSuggestion(-1);

    // Call onChange with the input value
    onChange(newValue);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.group_name);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    onChange(suggestion.group_name);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestion(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestion(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
          handleSuggestionClick(suggestions[activeSuggestion]);
        } else if (inputValue.trim() && suggestions.length === 0) {
          // Show create modal if no suggestions match
          handleCreateNew();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestion(-1);
        break;
    }
  };

  const handleCreateNew = () => {
    if (!inputValue.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    // Check if group already exists
    const existingGroup = allGuestGroups.find(
      group => group && group.group_name && group.group_name.toLowerCase() === inputValue.toLowerCase()
    );

    if (existingGroup) {
      handleSuggestionClick(existingGroup);
      return;
    }

    setNewGroupName(inputValue);
    setShowCreateModal(true);
    setShowSuggestions(false);
  };

  const confirmCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Group name cannot be empty');
      return;
    }

    if (!clientId && !eventId) {
      toast.error('Client or Event information is required to create a group');
      return;
    }

    try {
      setCreatingGroup(true);

      // Prepare group data
      const groupData = {
        group_name: newGroupName.trim(),
        group_description: `Guest group created for: ${newGroupName}`,
        client_id: clientId,
        event_id: eventId
      };

      const response = await guestGroupAPI.createGuestGroup(groupData);
      const newGroup = response.data || response;

      // Add to local state
      setAllGuestGroups(prev => [...prev, newGroup]);

      // Set as selected value
      setInputValue(newGroup.group_name);
      onChange(newGroup.group_name);

      setShowCreateModal(false);
      setNewGroupName('');

      toast.success(`Guest group "${newGroup.group_name}" created successfully!`);

    } catch (error) {
      console.error('Error creating guest group:', error);
      toast.error(error.response?.data?.message || 'Failed to create guest group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const cancelCreateGroup = () => {
    setShowCreateModal(false);
    setNewGroupName('');
    inputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setActiveSuggestion(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll active suggestion into view
  useEffect(() => {
    if (activeSuggestion >= 0 && suggestionRefs.current[activeSuggestion]) {
      suggestionRefs.current[activeSuggestion].scrollIntoView({
        block: 'nearest'
      });
    }
  }, [activeSuggestion]);

  const showCreateButton = inputValue.trim() &&
    suggestions.length === 0 &&
    !allGuestGroups.some(group =>
      group && group.group_name && group.group_name.toLowerCase() === inputValue.toLowerCase()
    );

  return (
    <div className="position-relative" ref={inputRef}>
      <div className="input-group">
        <span className="input-group-text glass-input-addon">
          <FaUsers className="text-primary" />
        </span>
        <input
          type="text"
          className={`form-control glass-input ${error ? 'is-invalid' : ''} ${className}`}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.trim()) setShowSuggestions(true);
          }}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
        />
        {showCreateButton && (
          <button
            type="button"
            className="btn btn-outline-success"
            onClick={handleCreateNew}
            disabled={disabled}
            title={`Create new group "${inputValue}"`}
          >
            <FaPlus />
          </button>
        )}
      </div>

      {error && <div className="invalid-feedback d-block">{error}</div>}

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <div
          className="position-absolute w-100 mt-1 shadow-sm border rounded glass-card"
          style={{ zIndex: 1050, maxHeight: '200px', overflowY: 'auto' }}
        >
          {isLoading ? (
            <div className="p-3 text-center">
              <div className="spinner-border spinner-border-sm text-primary me-2" />
              Loading groups...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="list-group list-group-flush">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.guest_group_id}
                  ref={el => suggestionRefs.current[index] = el}
                  type="button"
                  className={`list-group-item list-group-item-action border-0 glass-list-item ${
                    index === activeSuggestion ? 'active' : ''
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="d-flex align-items-center">
                    <FaUsers className="me-2 text-muted" size={12} />
                    <div className="flex-grow-1">
                      <div className="fw-medium">{suggestion.group_name}</div>
                      {suggestion.group_description && (
                        <small className="text-muted">
                          {suggestion.group_description.length > 50
                            ? `${suggestion.group_description.substring(0, 50)}...`
                            : suggestion.group_description
                          }
                        </small>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          {showCreateButton && (
            <div className="border-top p-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-success w-100"
                onClick={handleCreateNew}
              >
                <FaPlus className="me-2" />
                Create "{inputValue}"
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-modal">
              <div className="modal-header">
                <h5 className="modal-title">
                  <FaUsers className="me-2 text-primary" />
                  Create New Guest Group
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={cancelCreateGroup}
                />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-medium">Group Name</label>
                  <input
                    type="text"
                    className="form-control glass-input"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter group name"
                    autoFocus
                  />
                </div>
                <div className="alert alert-info">
                  <FaUsers className="me-2" />
                  <strong>Creating:</strong> "{newGroupName}"
                  <br />
                  <small>This group will be available for all future guests.</small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary glass-btn"
                  onClick={cancelCreateGroup}
                  disabled={creatingGroup}
                >
                  <FaTimes className="me-2" />
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success glass-btn-success"
                  onClick={confirmCreateGroup}
                  disabled={creatingGroup || !newGroupName.trim()}
                >
                  {creatingGroup ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaCheck className="me-2" />
                      Create Group
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestGroupTypeahead;