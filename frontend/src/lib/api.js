// API Configuration
const API_BASE_URL = "http://localhost:5000";

// Create an API object with all endpoints
const api = {
  baseUrl: API_BASE_URL,
  
  // Auth endpoints
  auth: {
    login: () => `${API_BASE_URL}/auth/login`,
    signup: () => `${API_BASE_URL}/auth/signup`,
    user: () => `${API_BASE_URL}/auth/user`,
    verifyEmail: () => `${API_BASE_URL}/auth/verify-email`,
    logout: () => `${API_BASE_URL}/auth/logout`
  },
  
  // Events endpoints
  events: {
    list: () => `${API_BASE_URL}/events`,
    detail: (id) => `${API_BASE_URL}/events/${id}`,
    subscribe: (id) => `${API_BASE_URL}/events/${id}/subscribe`
  },
  
  // Communications endpoints
  communications: {
    submit: () => `${API_BASE_URL}/communications/submit`,
    assignedToMe: () => `${API_BASE_URL}/communications/assigned-to-me`,
    content: (id) => `${API_BASE_URL}/communications/content/${id}`,
    modify: (id) => `${API_BASE_URL}/communications/modify/${id}`,
    setScore: (assignmentId) => `${API_BASE_URL}/communications/${assignmentId}/set-score`,
    track: (assignmentId) => `${API_BASE_URL}/communications/${assignmentId}/track`,
    download: (id) => `${API_BASE_URL}/communications/download/${id}`,
    my: () => `${API_BASE_URL}/communications/my`,
    reviewerNotifications: () => `${API_BASE_URL}/communications/reviewer/notifications`,
    userNotifications: () => `${API_BASE_URL}/communications/user/notifications`,
    markReviewerNotificationRead: (id) => `${API_BASE_URL}/communications/reviewer/notifications/${id}/read`,
    markUserNotificationRead: (id) => `${API_BASE_URL}/communications/user/notifications/${id}/read`,
    markAllReviewerNotificationsRead: () => `${API_BASE_URL}/communications/reviewer/notifications/mark-all-read`,
    markAllUserNotificationsRead: () => `${API_BASE_URL}/communications/user/notifications/mark-all-read`
  },
  
  // Payments endpoints
  payments: {
    paymee: () => `${API_BASE_URL}/payments/paymee`,
    webhook: () => `${API_BASE_URL}/payments/webhook`
  }
};

export default api;