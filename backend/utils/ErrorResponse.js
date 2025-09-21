class ErrorResponse extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
  
      
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ErrorResponse);
      }
    }
  }
  
  module.exports = ErrorResponse;