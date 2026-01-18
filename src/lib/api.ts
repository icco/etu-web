// API Client for Etu Server

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled';
    subscriptionEnd: string | null;
  };
  token: string;
}

interface UserStats {
  totalNotes: number;
  totalTags: number;
  totalWords: number;
  firstNoteDate: string | null;
}

interface NoteWithTags {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

interface NotesListResponse {
  notes: NoteWithTags[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface TagWithCount {
  id: string;
  name: string;
  noteCount: number;
  createdAt: string;
}

interface APIKeyResponse {
  id: string;
  name: string;
  key?: string; // Only present on creation
  keyPrefix: string;
  createdAt: string;
  lastUsed?: string;
}

class APIClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on init
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('etu-token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data: APIResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data as T;
  }

  // Auth
  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('etu-token', token);
    } else {
      localStorage.removeItem('etu-token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  async register(email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  logout(): void {
    this.setToken(null);
  }

  async getMe(): Promise<{ user: AuthResponse['user']; stats: UserStats }> {
    return this.request('/auth/me');
  }

  // Notes
  async getNotes(params?: {
    search?: string;
    tags?: string[];
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<NotesListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.tags?.length) searchParams.set('tags', params.tags.join(','));
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return this.request(`/notes${query ? `?${query}` : ''}`);
  }

  async getNote(id: string): Promise<NoteWithTags> {
    return this.request(`/notes/${id}`);
  }

  async createNote(content: string, tags: string[]): Promise<NoteWithTags> {
    return this.request('/notes', {
      method: 'POST',
      body: JSON.stringify({ content, tags }),
    });
  }

  async updateNote(id: string, data: { content?: string; tags?: string[] }): Promise<NoteWithTags> {
    return this.request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id: string): Promise<void> {
    await this.request(`/notes/${id}`, { method: 'DELETE' });
  }

  // Tags
  async getTags(): Promise<TagWithCount[]> {
    return this.request('/tags');
  }

  async renameTag(id: string, name: string): Promise<void> {
    await this.request(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  }

  async deleteTag(id: string): Promise<void> {
    await this.request(`/tags/${id}`, { method: 'DELETE' });
  }

  async mergeTags(sourceId: string, targetId: string): Promise<void> {
    await this.request(`/tags/${sourceId}/merge`, {
      method: 'POST',
      body: JSON.stringify({ targetTagId: targetId }),
    });
  }

  // API Keys
  async getAPIKeys(): Promise<APIKeyResponse[]> {
    return this.request('/api-keys');
  }

  async createAPIKey(name: string): Promise<APIKeyResponse> {
    return this.request('/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async deleteAPIKey(id: string): Promise<void> {
    await this.request(`/api-keys/${id}`, { method: 'DELETE' });
  }

  // Stripe
  async createCheckout(): Promise<{ url: string }> {
    return this.request('/stripe/create-checkout', { method: 'POST' });
  }

  async createPortal(): Promise<{ url: string }> {
    return this.request('/stripe/create-portal', { method: 'POST' });
  }
}

export const api = new APIClient();
export type { NoteWithTags, TagWithCount, APIKeyResponse, UserStats, AuthResponse };
