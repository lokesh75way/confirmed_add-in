import { useSWRConfig } from "swr"; 

function UpdateLocalStorageService() {
    const { cache } = useSWRConfig();

    const local_storage_key = "app-cache";
    const appCache = JSON.stringify(Array.from(cache.entries()));
    localStorage.setItem(local_storage_key, appCache);
}
export default UpdateLocalStorageService;
