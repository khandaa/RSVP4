import React from 'react';

const GuestFields = ({ formData, handleInputChange, errors }) => {
  return (
    <div className="row g-4">
      <div className="col-md-6">
        <label className="form-label fw-semibold">Address</label>
        <input
          type="text"
          name="guest_address"
          className={`form-control glass-input ${errors.guest_address ? 'is-invalid' : ''}`}
          value={formData.guest_address}
          onChange={handleInputChange}
          placeholder="Enter address"
        />
        {errors.guest_address && (
          <div className="invalid-feedback">{errors.guest_address}</div>
        )}
      </div>

      <div className="col-md-6">
        <label className="form-label fw-semibold">City</label>
        <input
          type="text"
          name="guest_city"
          className={`form-control glass-input ${errors.guest_city ? 'is-invalid' : ''}`}
          value={formData.guest_city}
          onChange={handleInputChange}
          placeholder="Enter city"
        />
        {errors.guest_city && (
          <div className="invalid-feedback">{errors.guest_city}</div>
        )}
      </div>

      <div className="col-md-6">
        <label className="form-label fw-semibold">Country</label>
        <input
          type="text"
          name="guest_country"
          className={`form-control glass-input ${errors.guest_country ? 'is-invalid' : ''}`}
          value={formData.guest_country}
          onChange={handleInputChange}
          placeholder="Enter country"
        />
        {errors.guest_country && (
          <div className="invalid-feedback">{errors.guest_country}</div>
        )}
      </div>

      <div className="col-md-6">
        <label className="form-label fw-semibold">Dietary Preferences</label>
        <input
          type="text"
          name="guest_dietary_preferences"
          className={`form-control glass-input ${errors.guest_dietary_preferences ? 'is-invalid' : ''}`}
          value={formData.guest_dietary_preferences}
          onChange={handleInputChange}
          placeholder="e.g., Vegetarian, Gluten-Free"
        />
        {errors.guest_dietary_preferences && (
          <div className="invalid-feedback">{errors.guest_dietary_preferences}</div>
        )}
      </div>

      <div className="col-12">
        <label className="form-label fw-semibold">Special Requirements</label>
        <textarea
          name="guest_special_requirements"
          className={`form-control glass-input ${errors.guest_special_requirements ? 'is-invalid' : ''}`}
          rows="3"
          value={formData.guest_special_requirements}
          onChange={handleInputChange}
          placeholder="e.g., Wheelchair access, Allergies"
        />
        {errors.guest_special_requirements && (
          <div className="invalid-feedback">{errors.guest_special_requirements}</div>
        )}
      </div>

      <div className="col-12">
        <label className="form-label fw-semibold">Notes</label>
        <textarea
          name="guest_notes"
          className={`form-control glass-input ${errors.guest_notes ? 'is-invalid' : ''}`}
          rows="3"
          value={formData.guest_notes}
          onChange={handleInputChange}
          placeholder="Any additional notes about the guest"
        />
        {errors.guest_notes && (
          <div className="invalid-feedback">{errors.guest_notes}</div>
        )}
      </div>
    </div>
  );
};

export default GuestFields;
