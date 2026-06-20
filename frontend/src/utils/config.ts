export const getAPI_URL = (): string => {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return 'http://localhost:5000/api';
};

export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return '';
  }
  return 'http://localhost:5000';
};
