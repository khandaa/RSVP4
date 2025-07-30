import React, { useState } from 'react';
import { 
  FaChartBar, 
  FaChartLine, 
  FaChartPie, 
  FaDownload, 
  FaExpand, 
  FaCompress,
  FaInfoCircle,
  FaCog
} from 'react-icons/fa';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

/**
 * Reusable Data Visualization Component for all types of charts and graphs
 */
const DataVisualization = ({ 
  type = 'bar',
  title = 'Data Visualization',
  description = '',
  data = {},
  options = {},
  height = 300,
  exportable = true,
  customizable = true,
  fullscreenEnabled = true,
  loading = false
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartType, setChartType] = useState(type);
  const [showOptions, setShowOptions] = useState(false);
  const [chartOptions, setChartOptions] = useState(options);
  const [customHeight, setCustomHeight] = useState(height);

  // Color presets for consistent styling
  const colorPresets = {
    primary: [
      'rgba(59, 130, 246, 0.7)',
      'rgba(16, 185, 129, 0.7)',
      'rgba(249, 115, 22, 0.7)',
      'rgba(236, 72, 153, 0.7)',
      'rgba(139, 92, 246, 0.7)',
      'rgba(14, 165, 233, 0.7)',
      'rgba(168, 85, 247, 0.7)',
      'rgba(239, 68, 68, 0.7)',
      'rgba(234, 179, 8, 0.7)'
    ],
    pastel: [
      'rgba(182, 214, 244, 0.7)',
      'rgba(159, 223, 187, 0.7)',
      'rgba(250, 192, 148, 0.7)',
      'rgba(244, 178, 211, 0.7)',
      'rgba(199, 176, 244, 0.7)',
      'rgba(165, 213, 238, 0.7)',
      'rgba(214, 188, 246, 0.7)',
      'rgba(244, 176, 176, 0.7)',
      'rgba(244, 226, 162, 0.7)'
    ],
    borders: [
      'rgba(59, 130, 246, 1)',
      'rgba(16, 185, 129, 1)',
      'rgba(249, 115, 22, 1)',
      'rgba(236, 72, 153, 1)',
      'rgba(139, 92, 246, 1)',
      'rgba(14, 165, 233, 1)',
      'rgba(168, 85, 247, 1)',
      'rgba(239, 68, 68, 1)',
      'rgba(234, 179, 8, 1)'
    ]
  };

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: title ? true : false,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        padding: 10,
        cornerRadius: 4
      }
    }
  };

  // Apply default options with custom overrides
  const mergedOptions = {
    ...defaultOptions,
    ...chartOptions
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleTypeChange = (newType) => {
    setChartType(newType);
  };

  const handleExport = () => {
    if (!data || !data.labels || !data.datasets) {
      console.error('Invalid data for export');
      return;
    }

    try {
      // Convert chart data to spreadsheet format
      const exportData = [['']]; // First cell empty for headers
      
      // Add categories as first row headers
      exportData[0] = exportData[0].concat(data.labels);
      
      // Add each dataset as a row
      data.datasets.forEach((dataset) => {
        const row = [dataset.label || 'Unnamed Dataset'];
        row.push(...dataset.data);
        exportData.push(row);
      });

      // Create workbook and add worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Chart Data');

      // Generate filename based on chart title
      const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_chart_data.xlsx`;
      
      // Export to Excel file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting chart data:', error);
    }
  };

  // Function to convert chart to PNG image
  const handleExportImage = () => {
    try {
      // Get canvas element
      const canvas = document.getElementById('chart-canvas');
      if (!canvas) return;
      
      // Convert to data URL and trigger download
      const link = document.createElement('a');
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_chart.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error exporting chart as image:', error);
    }
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="d-flex justify-content-center align-items-center h-100">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    if (!data || !data.datasets || data.datasets.length === 0) {
      return (
        <div className="d-flex flex-column justify-content-center align-items-center h-100">
          <FaInfoCircle size={30} className="text-muted mb-3" />
          <p className="text-muted">No data available for visualization</p>
        </div>
      );
    }

    // Auto-apply colors if not provided
    const enhancedData = {
      ...data,
      datasets: data.datasets.map((dataset, index) => {
        // Only apply colors if not already specified
        if (!dataset.backgroundColor) {
          return {
            ...dataset,
            backgroundColor: chartType === 'line' 
              ? colorPresets.primary[index % colorPresets.primary.length].replace('0.7', '0.2')
              : colorPresets.primary[index % colorPresets.primary.length],
            borderColor: colorPresets.borders[index % colorPresets.borders.length],
            borderWidth: 1
          };
        }
        return dataset;
      })
    };

    // Define ID for canvas for export functionality
    const props = {
      options: mergedOptions,
      data: enhancedData,
      id: 'chart-canvas'
    };

    switch (chartType) {
      case 'line':
        return <Line {...props} />;
      case 'pie':
        return <Pie {...props} />;
      case 'doughnut':
        return <Doughnut {...props} />;
      case 'bar':
      default:
        return <Bar {...props} />;
    }
  };

  return (
    <div className={`card glass-card mb-4 ${isFullscreen ? 'position-fixed top-0 start-0 w-100 h-100 bg-white z-index-1050' : ''}`}
      style={{ height: isFullscreen ? '100vh' : 'auto' }}>
      <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
        <div>
          <h5 className="card-title mb-0">{title}</h5>
          {description && <small className="text-muted">{description}</small>}
        </div>
        <div className="btn-group">
          {customizable && (
            <button 
              className="btn btn-sm btn-outline-secondary" 
              onClick={() => setShowOptions(!showOptions)}
              title="Customize Chart"
            >
              <FaCog />
            </button>
          )}
          {exportable && (
            <button 
              className="btn btn-sm btn-outline-secondary" 
              onClick={handleExport}
              title="Export Data to Excel"
            >
              <FaDownload />
            </button>
          )}
          {exportable && (
            <button 
              className="btn btn-sm btn-outline-secondary" 
              onClick={handleExportImage}
              title="Export as Image"
            >
              <FaChartBar />
            </button>
          )}
          {fullscreenEnabled && (
            <button 
              className="btn btn-sm btn-outline-secondary" 
              onClick={handleToggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </button>
          )}
        </div>
      </div>
      
      {showOptions && (
        <div className="card-body border-bottom pb-3">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Chart Type</label>
              <div className="btn-group w-100">
                <button 
                  className={`btn btn-sm ${chartType === 'bar' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleTypeChange('bar')}
                >
                  <FaChartBar className="me-1" /> Bar
                </button>
                <button 
                  className={`btn btn-sm ${chartType === 'line' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleTypeChange('line')}
                >
                  <FaChartLine className="me-1" /> Line
                </button>
                <button 
                  className={`btn btn-sm ${chartType === 'pie' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleTypeChange('pie')}
                >
                  <FaChartPie className="me-1" /> Pie
                </button>
                <button 
                  className={`btn btn-sm ${chartType === 'doughnut' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleTypeChange('doughnut')}
                >
                  <FaChartPie className="me-1" /> Doughnut
                </button>
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Chart Height (px)</label>
              <input 
                type="range" 
                className="form-range"
                min="200"
                max="800"
                step="50"
                value={customHeight}
                onChange={(e) => setCustomHeight(parseInt(e.target.value))}
              />
              <div className="text-muted small text-center">{customHeight}px</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="card-body" style={{ height: isFullscreen ? 'calc(100vh - 100px)' : `${customHeight}px` }}>
        {renderChart()}
      </div>
    </div>
  );
};

export default DataVisualization;
