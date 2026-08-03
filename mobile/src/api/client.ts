import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local IP Address of the computer running the Node.js backend
const BASE_URL = 'http://192.168.1.8:5000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to every request automatically
apiClient.interceptors.request.use(
  async (config) => {
    // Try SecureStore first (since we migrated), fallback to AsyncStorage if still there
    let token = await SecureStore.getItemAsync('userToken');
    if (!token) {
      token = await AsyncStorage.getItem('userToken');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
