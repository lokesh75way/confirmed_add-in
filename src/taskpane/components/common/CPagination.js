import React from "react";
import PropTypes from "prop-types";

/**
 * Generic pagination component that can be used across the application
 */
const CPagination = ({
  currentPage,
  resultsPerPage,
  totalResults,
  handleNext,
  handlePrev,
}) => {
  // Calculate the actual starting item number (1-based index for display)
  const startItem = totalResults > 0 ? currentPage * resultsPerPage + 1 : 0;
  
  // Calculate the ending item number
  const endItem = Math.min((currentPage + 1) * resultsPerPage, totalResults);
  
  // Determine if next/prev buttons should be disabled
  const isPrevDisabled = currentPage === 0;
  const isNextDisabled = endItem >= totalResults;

  // Style for the buttons using the primary color
  const buttonStyle = {
    backgroundColor: 'var(--primary)',
    color: 'white',
    border: 'none',
    boxShadow: 'none'
  };

  // Style for disabled buttons
  const disabledStyle = {
    ...buttonStyle,
    opacity: 0.6,
    cursor: 'not-allowed'
  };

  return (
    <div className="d-flex align-items-center">
      <button
        className="btn"
        onClick={handlePrev}
        disabled={isPrevDisabled}
        style={isPrevDisabled ? disabledStyle : buttonStyle}
      >
        &lt;
      </button>
      <div className="pagination-text mx-3">
        {totalResults > 0 ? `${startItem} - ${endItem} of ${totalResults}` : "0 - 0 of 0"}
      </div>
      <button
        className="btn"
        onClick={handleNext}
        disabled={isNextDisabled}
        style={isNextDisabled ? disabledStyle : buttonStyle}
      >
        &gt;
      </button>
    </div>
  );
};

CPagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  resultsPerPage: PropTypes.number.isRequired,
  totalResults: PropTypes.number.isRequired,
  handleNext: PropTypes.func.isRequired,
  handlePrev: PropTypes.func.isRequired,
};

export default CPagination;