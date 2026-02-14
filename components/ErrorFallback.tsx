import React, { useState } from "react";
import { AlertCircle, X } from "react-icons/fi";
import "./ErrorFallback.css";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleRestart = () => {
    window.location.reload();
  };

  const formatErrorDetails = (): string => {
    let details = `Error: ${error.message}\n\n`;
    if (error.stack) {
      details += `Stack Trace:\n${error.stack}`;
    }
    return details;
  };

  return (
    <div className="error-fallback-container">
      {import.meta.env.DEV && (
        <button
          onClick={() => setIsModalVisible(true)}
          className="error-fallback-top-button"
          title="View error details"
        >
          <AlertCircle size={20} />
        </button>
      )}

      <div className="error-fallback-content">
        <h1 className="error-fallback-title">Something went wrong</h1>
        <p className="error-fallback-message">
          Please reload the app to continue.
        </p>
        <button
          onClick={handleRestart}
          className="error-fallback-button"
        >
          Try Again
        </button>
      </div>

      {import.meta.env.DEV && isModalVisible && (
        <div className="error-fallback-modal-overlay">
          <div className="error-fallback-modal">
            <div className="error-fallback-modal-header">
              <h2 className="error-fallback-modal-title">Error Details</h2>
              <button
                onClick={() => setIsModalVisible(false)}
                className="error-fallback-close-button"
                title="Close error details"
              >
                <X size={24} />
              </button>
            </div>
            <div className="error-fallback-modal-content">
              <pre className="error-fallback-error-text">{formatErrorDetails()}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
