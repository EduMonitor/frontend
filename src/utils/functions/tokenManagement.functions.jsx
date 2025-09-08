import { fetchCsrfToken } from "../hooks/token/csrf.token";

// Move to a singleton class for better organization and to avoid React concurrent issues
class RefreshTokenManager {
    constructor() {
        this.cachedCsrfToken = null;
        this.csrfTokenExpiry = 0;
        this.refreshPromise = null;
        this.CSRF_TOKEN_CACHE_TIME = 5 * 60 * 1000; // 5 minutes
    }

    async getCachedCsrfToken() {
        const now = Date.now();
        
        if (this.cachedCsrfToken && now <= this.csrfTokenExpiry) {
            return this.cachedCsrfToken;
        }

        try {
            const token = await fetchCsrfToken();
            this.cachedCsrfToken = token;
            this.csrfTokenExpiry = now + this.CSRF_TOKEN_CACHE_TIME;
            return token;
        } catch (error) {
            console.error('Failed to fetch CSRF token:', error);
            this.clearCsrfToken();
            throw error;
        }
    }

    clearCsrfToken() {
        this.cachedCsrfToken = null;
        this.csrfTokenExpiry = 0;
    }

    clearRefreshPromise() {
        this.refreshPromise = null;
    }

    isRefreshing() {
        return this.refreshPromise !== null;
    }
}
export const tokenManager = new RefreshTokenManager()
