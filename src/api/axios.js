import axios from 'axios';

const API_BASE = 'http://localhost:8000/api'
axios.defaults.baseURL = API_BASE;

export default axios;