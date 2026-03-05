/**
 * API Service for SIDAPEK
 * Handles communication with either local Express backend or Google Apps Script
 */

const IS_GAS = (import.meta as any).env.VITE_USE_GAS === 'true';
const GAS_URL = (import.meta as any).env.VITE_GAS_URL || '';

async function request(action: string, data?: any, token?: string) {
  if (IS_GAS) {
    if (!GAS_URL) {
      console.error('GAS_URL is not defined in environment variables');
      return { status: 'error', message: 'Konfigurasi Google Apps Script belum lengkap.' };
    }

    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // GAS requires this for POST from browser
        },
        body: JSON.stringify({ action, data, token })
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error: any) {
      console.error('GAS Request Error:', error);
      return { status: 'error', message: 'Gagal terhubung ke Google Sheets: ' + error.message };
    }
  } else {
    // Local Express API
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = token;

    let url = `/api/${action.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    
    // Mapping some actions to specific local routes if they differ
    const routeMap: Record<string, string> = {
      'getStats': '/api/stats',
      'getResidents': '/api/residents',
      'saveResident': '/api/residents',
      'deleteResident': `/api/residents/${data?.nik}`,
      'getUsers': '/api/users',
      'saveUser': '/api/users',
      'deleteUser': `/api/users/${data?.username}`,
      'getLogs': '/api/logs',
      'updateProfile': '/api/update-profile',
      'changePassword': '/api/change-password',
      'importResidents': '/api/residents/import',
      'getVillageInfo': '/api/village-info',
      'updateVillageInfo': '/api/village-info',
      'login': '/api/login',
      'getResidentHistory': `/api/residents/history/${data?.nik}`
    };

    url = routeMap[action] || url;
    
    // Handle DELETE methods
    const method = action.startsWith('delete') ? 'DELETE' : (action.startsWith('get') ? 'GET' : 'POST');
    
    try {
      const options: any = { method, headers };
      if (method !== 'GET') options.body = JSON.stringify(data);

      const response = await fetch(url, options);
      return await response.json();
    } catch (error: any) {
      console.error('Local API Error:', error);
      return { status: 'error', message: 'Gagal terhubung ke server: ' + error.message };
    }
  }
}

export const apiService = {
  login: (data: any) => request('login', data),
  getStats: (token: string) => request('getStats', null, token),
  getResidents: (token: string) => request('getResidents', null, token),
  saveResident: (data: any, token: string) => request('saveResident', data, token),
  deleteResident: (nik: string, token: string) => request('deleteResident', { nik }, token),
  getUsers: (token: string) => request('getUsers', null, token),
  saveUser: (data: any, token: string) => request('saveUser', data, token),
  deleteUser: (username: string, token: string) => request('deleteUser', { username }, token),
  getLogs: (token: string) => request('getLogs', null, token),
  updateProfile: (data: any, token: string) => request('updateProfile', data, token),
  changePassword: (data: any, token: string) => request('changePassword', data, token),
  importResidents: (data: any, token: string) => request('importResidents', data, token),
  getVillageInfo: (token: string) => request('getVillageInfo', null, token),
  updateVillageInfo: (data: any, token: string) => request('updateVillageInfo', data, token),
  getResidentHistory: (nik: string, token: string) => request('getResidentHistory', { nik }, token),
};
