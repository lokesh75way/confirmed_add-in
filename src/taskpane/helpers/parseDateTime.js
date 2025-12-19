const parseDateTime = (datetime) => {
  const date = new Date(datetime);
  return date.toLocaleString(); // This will use the client's timezone and locale
};

export default parseDateTime;
