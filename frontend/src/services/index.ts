import api from './api';

// Auth
export const authService = {
  login:    (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then(r => r.data.data),
  users:    () => api.get('/auth/users').then(r => r.data.data),
  signup:   (data: object) =>
    api.post('/auth/signup', data).then(r => r.data.data),
  register: (data: object) =>
    api.post('/auth/register', data).then(r => r.data.data),
  me:       () => api.get('/auth/me').then(r => r.data.data),
};

// Companies
export const companyService = {
  list:     ()    => api.get('/companies').then(r => r.data.data),
  get:      (id: number) => api.get(`/companies/${id}`).then(r => r.data.data),
  register: (data: object) => api.post('/companies', data).then(r => r.data.data),
};

// Plants
export const plantService = {
  list:     (params?: object) => api.get('/plants', { params }).then(r => r.data.data),
  get:      (id: number)      => api.get(`/plants/${id}`).then(r => r.data.data),
  create:   (data: object)    => api.post('/plants', data).then(r => r.data.data),
  verify:   (id: number, data: object) =>
    api.put(`/plants/${id}/verify`, data).then(r => r.data.data),
  auditLog: (id: number) =>
    api.get(`/plants/${id}/audit-log`).then(r => r.data.data),
};

// Production Logs
export const logService = {
  list:   (params?: object) => api.get('/production-logs', { params }).then(r => r.data.data),
  get:    (id: number)      => api.get(`/production-logs/${id}`).then(r => r.data.data),
  create: (data: object)    => api.post('/production-logs', data).then(r => r.data.data),
  verify: (id: number, data: object) =>
    api.put(`/production-logs/${id}/verify`, data).then(r => r.data.data),
};

// Carbon Credits
export const creditService = {
  list:      (params?: object) => api.get('/credits', { params }).then(r => r.data.data),
  get:       (id: number)      => api.get(`/credits/${id}`).then(r => r.data.data),
  byCompany: (id: number)      => api.get(`/credits/company/${id}`).then(r => r.data.data),
  summary:   ()                => api.get('/credits/summary').then(r => r.data.data),
};

// Wallet
export const walletService = {
  get:     (company_id: number) => api.get(`/wallet/${company_id}`).then(r => r.data.data),
  history: (company_id: number) => api.get(`/wallet/${company_id}/history`).then(r => r.data.data),
};

// Listings
export const listingService = {
  listActive:  ()           => api.get('/listings').then(r => r.data.data),
  listAll:     (params?: object) => api.get('/listings/all', { params }).then(r => r.data.data),
  listCursor:  ()           => api.get('/listings/cursor').then(r => r.data.data),
  get:         (id: number) => api.get(`/listings/${id}`).then(r => r.data.data),
  create:      (data: object) => api.post('/listings', data).then(r => r.data.data),
  cancel:      (id: number)   => api.delete(`/listings/${id}`).then(r => r.data.data),
};

// Transactions
export const transactionService = {
  list:    (params?: object) => api.get('/transactions', { params }).then(r => r.data.data),
  get:     (id: number)      => api.get(`/transactions/${id}`).then(r => r.data.data),
  execute: (data: object)    => api.post('/transactions', data).then(r => r.data.data),
};

// Compliance
export const complianceService = {
  list:        (params?: object)  => api.get('/compliance-reports', { params }).then(r => r.data.data),
  get:         (id: number)       => api.get(`/compliance-reports/${id}`).then(r => r.data.data),
  generate:    (data: object)     => api.post('/compliance-reports', data).then(r => r.data.data),
  audit:       (id: number, data: object) =>
    api.put(`/compliance-reports/${id}/audit`, data).then(r => r.data.data),
  summary:     ()                 => api.get('/compliance-reports/summary').then(r => r.data.data),
  periodic:    (authority_id: number) =>
    api.get(`/compliance-reports/periodic/${authority_id}`).then(r => r.data.data),
  authorities: ()                 => api.get('/compliance-reports/authorities').then(r => r.data.data),
};

// Analytics
export const analyticsService = {
  publicSummary: ()    => api.get('/analytics/public-summary').then(r => r.data.data),
  dashboard:     ()    => api.get('/analytics/dashboard').then(r => r.data.data),
  topBuyers:     ()    => api.get('/analytics/top-buyers').then(r => r.data.data),
  creditSummary: ()    => api.get('/analytics/credit-summary').then(r => r.data.data),
  volume:        ()    => api.get('/analytics/marketplace-volume').then(r => r.data.data),
  performance:   ()    => api.get('/analytics/company-performance').then(r => r.data.data),
  reports:       ()    => api.get('/analytics/reports').then(r => r.data.data),
};
