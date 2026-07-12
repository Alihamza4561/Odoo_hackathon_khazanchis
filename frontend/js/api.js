/* ============================================================
   AssetFlow — api.js
   Thin fetch wrapper around the Flask backend. Every page script
   should call AssetFlowAPI.* rather than fetch() directly, so the
   base URL / auth headers only live in one place.

   NOTE: until the backend is wired up, pages fall back to the
   mock arrays defined inline in each page's <script> — swap those
   render(MOCK_X) calls for render(await AssetFlowAPI.listX()) once
   the endpoints below are live.
   ============================================================ */
(function () {
  const API_BASE = '/api';

  async function request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!res.ok) {
      let message = res.statusText;
      try {
        const body = await res.json();
        message = body.message || message;
      } catch (_) { /* no json body */ }
      throw new Error(message);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  const qs = (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
    const s = new URLSearchParams(clean).toString();
    return s ? `?${s}` : '';
  };

  window.AssetFlowAPI = {
    // ---- auth ----
    login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    signup: (data) => request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me'),

    // ---- org setup ----
    listDepartments: () => request('/departments'),
    createDepartment: (data) => request('/departments', { method: 'POST', body: JSON.stringify(data) }),
    listCategories: () => request('/categories'),
    createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
    listEmployees: (params) => request(`/employees${qs(params)}`),
    promoteEmployee: (id, role) => request(`/employees/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),

    // ---- assets (Screen 4) ----
    listAssets: (params) => request(`/assets${qs(params)}`),
    getAsset: (id) => request(`/assets/${id}`),
    registerAsset: (data) => request('/assets', { method: 'POST', body: JSON.stringify(data) }),
    updateAssetStatus: (id, status) => request(`/assets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    getAssetHistory: (id) => request(`/assets/${id}/history`),

    // ---- allocation & transfer (Screen 5) ----
    listAllocations: (params) => request(`/allocations${qs(params)}`),
    allocateAsset: (data) => request('/allocations', { method: 'POST', body: JSON.stringify(data) }),
    requestTransfer: (allocationId, data) => request(`/allocations/${allocationId}/transfer`, { method: 'POST', body: JSON.stringify(data) }),
    approveTransfer: (transferId) => request(`/transfers/${transferId}/approve`, { method: 'POST' }),
    rejectTransfer: (transferId) => request(`/transfers/${transferId}/reject`, { method: 'POST' }),
    returnAsset: (allocationId, data) => request(`/allocations/${allocationId}/return`, { method: 'POST', body: JSON.stringify(data) }),

    // ---- resource booking ----
    listBookings: (params) => request(`/bookings${qs(params)}`),
    createBooking: (data) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
    cancelBooking: (id) => request(`/bookings/${id}/cancel`, { method: 'POST' }),

    // ---- maintenance ----
    listMaintenanceRequests: (params) => request(`/maintenance${qs(params)}`),
    raiseMaintenanceRequest: (data) => request('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
    approveMaintenanceRequest: (id) => request(`/maintenance/${id}/approve`, { method: 'POST' }),

    // ---- audits ----
    listAuditCycles: () => request('/audits'),
    createAuditCycle: (data) => request('/audits', { method: 'POST', body: JSON.stringify(data) }),

    // ---- notifications ----
    listNotifications: () => request('/notifications'),
  };
})();
