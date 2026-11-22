import axios from 'axios';
import { Platform } from 'react-native';

// In Android emulator, 10.0.2.2 points to host machine localhost:8000.
// On physical devices, replace with your local WiFi IP (e.g., http://192.168.1.X:8000/api/v1).
const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api/v1',
  ios: 'http://localhost:8000/api/v1',
  default: 'http://localhost:8000/api/v1',
});

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
