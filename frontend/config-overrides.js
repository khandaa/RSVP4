const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = function override(config, env) {
  // Filter out source map warnings from react-datepicker
  config.ignoreWarnings = [
    // Ignore warnings about missing source maps in react-datepicker
    function ignoreSourceMapLoaderWarnings(warning) {
      return (
        warning.module &&
        warning.module.resource &&
        warning.module.resource.includes('react-datepicker')
      );
    }
  ];

  if (env === 'production') {
    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: 'report.html',
        openAnalyzer: false,
      })
    );
  }

  return config;
};
