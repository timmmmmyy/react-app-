const API_BASE_URL = process.env.REACT_APP_API_URL;

class ApiService {
  // Generic fetch method with authentication
  async fetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('ascends_auth_token');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email, password, confirmPassword) {
    return this.fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, confirmPassword }),
    });
  }

  async getProfile() {
    return this.fetch('/api/auth/profile');
  }

  async startTrial() {
    return this.fetch('/api/auth/start-trial', {
      method: 'POST',
    });
  }

  // Subscription endpoints
  async getSubscriptionStatus() {
    return this.fetch('/api/stripe/subscription-status');
  }

  async createCheckoutSession(planId, priceId, customerEmail = null, customerName = null) {
    return this.fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        planId,
        priceId,
        customerEmail,
        customerName
      }),
    });
  }

  // Health check
  async healthCheck() {
    return this.fetch('/health');
  }
}

const apiService = new ApiService();
export default apiService; 