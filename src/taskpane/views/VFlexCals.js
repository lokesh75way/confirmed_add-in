import React, { useEffect, useState } from "react";
import { useFlexCalPaginationData } from "../hooks/FlexCalPaginationHook";
// Replace the direct contacts import with the combined one
import { useCombinedContacts } from "../hooks/useCombinedContacts";
import CFlexCalCard from "../components/flexCals/CFlexCalCard";
import CLoading from "../components/common/CLoading";
import CPagination from "../components/common/CPagination";
import PropTypes from "prop-types";
import { Form } from "react-bootstrap";
/**
 * FlexCal tab Component which displays a list of flexcals from @CFlexCalCard
 * @param {*} props
 */

const RESULTS_PER_PAGE = 10;

const VFlexCals = ({ accessToken, userName, sfAccessToken, isSalesforceConnected }) => {
  //States for pagination
  const [totalRecords, setTotalRecords] = useState(0);

  const [flexCalParams, setFlexCalParams] = useState({
    nameFilter: '',
    PageNumber: 0,
    ResultsPerPage: RESULTS_PER_PAGE,
  });

  // Replace the existing contacts hook with our combined contacts hook
  // Now includes isSalesforceConnected
  const { contacts, loading: contactsLoading } = useCombinedContacts({
    accessToken,
    userName,
    isSalesforceConnected, // Pass the connection status
  });
  
  const [currContacts, setCurrContacts] = useState();
  const [searchText, setSearchText] = useState('');


  const flexCals = useFlexCalPaginationData({
    initialData: undefined,
    userName: userName,
    accessToken: accessToken,
    nameFilter: flexCalParams.nameFilter,
    pageNumber: flexCalParams.PageNumber,
    pageSize: flexCalParams.ResultsPerPage,
    setTotalRecords,
  });

  useEffect(() => {
    setCurrContacts(contacts);
  }, [contacts, flexCals]);


  const getFlexCalCardData = (flexCal) => {
    const flexCalCardData = { flexCal: flexCal, contacts: currContacts };
    return flexCalCardData;
  };

  const Search = (event) => {
    setSearchText(event.target.value);
    setFlexCalParams({
      ...flexCalParams,
      nameFilter: event.target.value,
      PageNumber: 0,
    });
  };

  const handleNext = () => {
    setFlexCalParams({
      ...flexCalParams,
      PageNumber: flexCalParams?.PageNumber + 1,
    });
  };

  const handlePrev = () => {
    setFlexCalParams({
      ...flexCalParams,
      PageNumber: flexCalParams?.PageNumber - 1,
    });
  };


  return (
    <div className="card-container">
      <div className="meeting-status-search-bar">
        <Form.Group className="meeting-status-form-name w-100">
          <Form.Control
            className="mb-1 w-100"
            size="sm"
            type="text"
            name="searchmeeting"
            placeholder="Search FlexCals"
            value={searchText}
            autoComplete="off"
            onChange={(event) => Search(event)}
          />
        </Form.Group>
      </div>
      {flexCals === undefined || flexCals === null || contactsLoading ? (<CLoading className='fade-in'></CLoading>) :
        (
          <>
            {flexCals.length === 0 ? (<p className='header-margin'>No FlexCals Found</p>) :
              (<>
                {flexCals.map((each, idx) => (
                  <div key={idx} className={idx === 0 ? 'header-margin' : ''}>
                    <CFlexCalCard flexCalCardData={getFlexCalCardData(each)} />
                  </div>
                ))} 
              </>)}
          </>
        )}
      <div className="load-more">
        <CPagination
          currentPage={flexCalParams?.PageNumber}
          resultsPerPage={flexCalParams?.ResultsPerPage}
          totalResults={totalRecords}
          handleNext={handleNext}
          handlePrev={handlePrev}
        ></CPagination>
      </div>
    </div>

  );
};

// Update PropTypes to include sfAccessToken
VFlexCals.propTypes = {
  userName: PropTypes.string.isRequired,
  accessToken: PropTypes.string.isRequired,
  sfAccessToken: PropTypes.object,
  isSalesforceConnected: PropTypes.bool,
};

export default VFlexCals;
