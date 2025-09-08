// errorUtils.js
export const ErrorHandler = (error, env) => {
    if (env !== 'production') {
      if (error.response && error.response.data.message) {
        console.error('Error Message:', error.response.data.message);
      }
      console.error('Error Details:', error);
    }
  
    // Standardized error response
    const errorMessage = error.response && error.response.data.message
      ? error.response.data.message
      : 'An error occurred. Please try again later.';
  
    return errorMessage;
  };
  