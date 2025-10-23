import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // nova porta do backend
});

export default api;
