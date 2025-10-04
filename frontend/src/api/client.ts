import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3001/api', // Your backend URL
  withCredentials: true, // Important for sending cookies
});