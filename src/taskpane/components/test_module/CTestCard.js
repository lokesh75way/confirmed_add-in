import React from "react";
import PropTypes from "prop-types";

const CTestCard = ({ item }) => {
  return (
    <div>
      <hr />
      <div>
        <h1>This is a TestCard, id is: {item.id}</h1>
        <p>content: {item.content}</p>
      </div>
    </div>
  );
};

CTestCard.propTypes = {
  item: PropTypes.any,
};

export default CTestCard;
