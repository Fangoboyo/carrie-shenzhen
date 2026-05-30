import PocketBase from 'pocketbase';

// Determine the pocketbase url. In development, we can point to localhost:8090.
const url = 'http://localhost:8090';
export const pb = new PocketBase(url);
