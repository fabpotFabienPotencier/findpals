import axios from 'axios';
import { secureStorage } from '../utils/secureStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8023';
export const CDN_URL = import.meta.env.VITE_CDN_URL || '';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Send cookies for cross-subdomain auth
});

api.interceptors.request.use(async (config) => {
    const token = await secureStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            await secureStorage.removeItem('auth_token');
            if (window.location.hostname !== 'account.findpals.xyz') {
                window.location.href = 'https://account.findpals.xyz';
            }
        }
        return Promise.reject(error);
    }
);

// ── Auth ──────────────────────────────────────────────────

export const auth = {
    login: (username: string, password: string, twoFactorCode?: string, deviceId?: string) =>
        api.post('/auth/login', { username, password, twoFactorCode, deviceId }),
    register: (username: string, password: string, email: string, mode: string, consent: boolean) =>
        api.post('/auth/register', { username, password, email, mode, consent }),
    verifyEmail: (token: string) =>
        api.get('/auth/verify-email', { params: { token } }),
    resendVerification: () =>
        api.post('/auth/resend-verification'),
    forgotPassword: (email: string) =>
        api.post('/auth/forgot-password', { email }),
    resetPassword: (token: string, newPassword: string) =>
        api.post('/auth/reset-password', { token, newPassword }),
    setupTwoFactor: () =>
        api.post('/auth/2fa/setup'),
    getMe: () =>
        api.get('/auth/me'),
    sessions: () => api.get('/auth/sessions'),
    revokeSession: (sessionId: string) => api.post('/auth/sessions/revoke', { sessionId }),
};

// ── Users ─────────────────────────────────────────────────

export const users = {
    getMyProfile: () =>
        api.get('/users/me'),
    updateProfile: (data: { displayName?: string; bio?: string; avatarUrl?: string }) =>
        api.patch('/users/me', data),
    getProfile: (userId: string) =>
        api.get(`/users/${userId}`),
    search: (query: string, limit?: number) =>
        api.get('/users/search', { params: { q: query, limit } }),
    follow: (userId: string) =>
        api.post(`/users/${userId}/follow`),
    unfollow: (userId: string) =>
        api.delete(`/users/${userId}/follow`),
    getFollowers: (userId: string, page?: number) =>
        api.get(`/users/${userId}/followers`, { params: { page } }),
    getFollowing: (userId: string, page?: number) =>
        api.get(`/users/${userId}/following`, { params: { page } }),
    isFollowing: (userId: string) =>
        api.get(`/users/${userId}/is-following`),
};

// ── Feed ──────────────────────────────────────────────────

export const feed = {
    list: (page: number, limit: number) =>
        api.get('/feed', { params: { page, limit } }),
    getReels: (page: number = 1, limit: number = 10) =>
        api.get('/feed/reels', { params: { page, limit } }),
    getStories: () =>
        api.get('/feed/stories'),
    getUserPosts: (userId: string, page: number = 1, limit: number = 10) =>
        api.get(`/feed/user/${userId}`, { params: { page, limit } }),
    create: (authorId: string, content: string, type: 'post' | 'reel' | 'story' = 'post', mediaUrl?: string, isLocked: boolean = false, price: number = 0) =>
        api.post('/feed/post', { authorId, content, type, mediaUrl, isLocked, price }),
    deletePost: (postId: string) =>
        api.delete(`/feed/post/${postId}`),
    likePost: (postId: string) =>
        api.post(`/feed/post/${postId}/like`),
    unlikePost: (postId: string) =>
        api.delete(`/feed/post/${postId}/like`),
    isLiked: (postId: string) =>
        api.get(`/feed/post/${postId}/is-liked`),
    unlockPost: (postId: string) =>
        api.post(`/feed/post/${postId}/unlock`),
    comment: (postId: string, authorId: string, content: string) =>
        api.post('/feed/comment', { postId, authorId, content }),
    getComments: (postId: string) =>
        api.get(`/feed/post/${postId}/comments`),
};

// ── Live ──────────────────────────────────────────────────

export const live = {
    createRoom: (title: string, accessMode: string, price?: number, isRecordingRequested?: boolean) =>
        api.post('/live/rooms', { title, accessMode, price, isRecordingRequested }),
    tipRoom: (roomId: string, amount: number) =>
        api.post(`/live/rooms/${roomId}/tip`, { amount }),
    saveRecording: (roomId: string, recordingUrl: string) =>
        api.post(`/live/rooms/${roomId}/recording`, { recordingUrl }),
};

// ── Payments ──────────────────────────────────────────────

export const payments = {
    flutterwaveInitialize: (amount: number, currency: string, redirectUrl: string) =>
        api.post('/payments/flutterwave/initialize', { amount, currency, redirectUrl }),
    flutterwaveVerify: (txRef: string) =>
        api.get('/payments/flutterwave/verify', { params: { tx_ref: txRef } }),
    getTransactions: () =>
        api.get('/payments/transactions'),
    withdraw: (amount: number) =>
        api.post('/payments/withdraw', { amount }),
};

// ── Upload (Cloudflare R2) ────────────────────────────────

export const upload = {
    getPresignedUrl: (folder: string, filename: string, contentType: string) =>
        api.post('/upload/presign', { folder, filename, contentType }),

    /**
     * Upload a file directly to R2 using a presigned URL.
     * Returns the public CDN URL of the uploaded file.
     */
    uploadFile: async (file: File, folder: string = 'uploads'): Promise<string> => {
        // Step 1: Get presigned URL from backend
        const { data } = await api.post('/upload/presign', {
            folder,
            filename: file.name,
            contentType: file.type,
        });

        // Step 2: Upload directly to R2
        await fetch(data.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
        });

        // Step 3: Return the public URL
        return data.publicUrl;
    },
};

// ── Health ────────────────────────────────────────────────

export const health = {
    check: () => api.get('/health'),
};

// ── Notifications ─────────────────────────────────────────

export const notifications = {
    list: (page: number = 1, limit: number = 20) => api.get('/notifications', { params: { page, limit } }),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
    markAllAsRead: () => api.patch('/notifications/read-all'),
};

// ── Messaging ─────────────────────────────────────────────

export const messaging = {
    sendMessage: (chatId: string, content: string, type: 'text' | 'image' | 'video' | 'file' = 'text') =>
        api.post('/messaging/message', { chatId, content, type }),
};
