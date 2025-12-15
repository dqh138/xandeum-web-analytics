import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchPNodes = async () => {
  const response = await api.get('/pnodes');
  return response.data;
};

export const fetchSystemStatus = async () => {
  const response = await api.get('/pnodes/system-status');
  return response.data;
};

export const fetchNetworkInfo = async () => {
  const response = await api.get('/network/info');
  return response.data;
};

export const fetchNodeDetails = async (nodeId: string) => {
  const response = await api.get(`/pnodes/${nodeId}`);
  return response.data;
};


export const fetchNodeHistory = async (nodeId: string) => {
  const response = await api.get(`/pnodes/${nodeId}/history`);
  return response.data;
};

export const fetchEvents = async (limit = 100) => {
  const response = await api.get(`/pnodes/events?limit=${limit}`);
  return response.data;
};

export const fetchProviders = async () => {
  const response = await api.get('/pnodes/providers');
  return response.data;
};

export const fetchNetworkHistory = async (limit = 24) => {
  const response = await api.get(`/pnodes/stats/history?limit=${limit}`);
  return response.data;
};
