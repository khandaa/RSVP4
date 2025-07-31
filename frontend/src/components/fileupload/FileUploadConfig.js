import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const FileUploadConfig = () => {
    const [config, setConfig] = useState({
        uiLabel: '',
        uploadLocation: '',
        allowMultiple: false,
        filePrefix: ''
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        api.get('/widget-config')
            .then(response => {
                setConfig(response.data);
            })
            .catch(error => {
                console.error('Error loading file upload configuration:', error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prevConfig => ({
            ...prevConfig,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        api.post('/widget-config', config).then(() => {
            alert('Configuration saved!');
        });
    };

    // Only render the form after data is loaded
    return (
        <div>
            <h2>File Upload Widget Configuration</h2>
            
            {isLoading ? (
                <div>Loading configuration...</div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>UI Label</label>
                        <input 
                            type="text" 
                            name="uiLabel" 
                            value={config.uiLabel || ''} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div>
                        <label>Upload Storage Location</label>
                        <input 
                            type="text" 
                            name="uploadLocation" 
                            value={config.uploadLocation || ''} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div>
                        <label>
                            <input 
                                type="checkbox" 
                                name="allowMultiple" 
                                checked={Boolean(config.allowMultiple)} 
                                onChange={handleChange} 
                            />
                            Allow Multiple Files
                        </label>
                    </div>
                    <div>
                        <label>File Name Prefix</label>
                        <input 
                            type="text" 
                            name="filePrefix" 
                            value={config.filePrefix || ''} 
                            onChange={handleChange} 
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        data-testid="save-config-button"
                        style={{ fontWeight: 'bold', padding: '0.6rem 1.2rem', marginTop: '1rem' }}
                    >
                        Save Configuration
                    </button>
                </form>
            )}
        </div>
    );
};

export default FileUploadConfig;
