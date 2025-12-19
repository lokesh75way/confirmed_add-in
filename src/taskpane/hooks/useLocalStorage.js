// From response: https://stackoverflow.com/questions/71451780/how-to-make-page-re-render-after-localstorage-change
import { useCallback, useEffect, useState } from "react";

const useLocalStorage = (key) => {
  const [storedValue, setStoredValue] = useState(
    // Use the function method for setting initial value to prevent unnecessary reads
    // Parse and then use initialValue in case the value stored in localStorage is "null" or "undefined"
    () => JSON.parse(localStorage.getItem(key))
  );
  useEffect(() => {
    // storage events occur when another tab is modifying localStorage.
    // Use it to keep two tabs in sync
    function fromStorage(ev) {
      // The key needs to match, otherwise we're using the wrong event.
      if (ev.key === key) {
        // Instead of grabbing the value again, the event has it!
        setStoredValue(JSON.parse(ev.newValue));
      }
    }
    window.addEventListener("storage", fromStorage);
    return () => {
      window.removeEventListener("storage", fromStorage);
    };
    // Effect is dependent on the key
  }, [key]);
  /**
   * Custom setValue to mimic useState's, but include the localStorage setting
   */
  const setValue = useCallback(
    (value) => {
      // Use the storedValue's function setting to get the previous value, so that this callback can be tied to just the key.
      // To keep this callback referentially stable as long as the key isn't changed! Could also put the key in a ref, instead.
      setStoredValue((prevValue) => {
        // if the value is a function, run it against the previous value.
        const newValue = typeof value === "function" ? value(prevValue) : value;
        // Store the newValue
          localStorage.setItem(key, JSON.stringify(newValue));
        return newValue;
      });
    },
    [key]
  );
  return [storedValue, setValue];
}

export default useLocalStorage;
