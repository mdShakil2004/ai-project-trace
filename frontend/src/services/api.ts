import type { Architecture, Change, ChangedFile, Evidence, Investigation, InvestigationSummary, OverviewMetrics, QuestionAnswer, Repository, Risk, Verification, AnalysisEvent } from '@/types';

const API_BASE = (import.meta.env.VITE_TRACE_API_BASE as string | undefined) ?? `${window.location.origin}/api/v1`;

function websocketBase() {
  const url = new URL(API_BASE, window.location.origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = url.pathname.replace(/\/api\/v1\/?$/, '');
  return url.toString().replace(/\/$/, '');
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error?.message ?? `Request failed [${res.status}]`);
  return (payload?.data ?? payload) as T;
}

export type AuthUser = { id: string; email: string | null; githubId: string | null; login: string | null; name: string | null; avatarUrl: string | null };
export type TraceSettings = { analysisDepth: 'fast' | 'standard' | 'deep'; riskThreshold: number; notifyHighRisk: boolean; apiKeyMasked: string };
export type GitHubConnection = { connected: boolean; account: string | null; repositoryCount: number; manageUrl: string };
export type TraceNotification = { id: string; type: string; title: string; message: string; investigation_id: string | null; read_at: string | null; created_at: string };
type InvestigationStart = { id: string; status: string; realtimeToken?: string };

export const api = {
  getCurrentUser: () => request<{ user: AuthUser }>('/auth/me'),
  signupWithEmail: (email: string, password: string) => request<{ user: AuthUser }>('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, confirmPassword: password }) }),
  loginWithEmail: (email: string, password: string) => request<{ user: AuthUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  loginWithGitHub: () => { window.location.assign(`${API_BASE}/auth/github`); },
  getOverviewMetrics: () => request<OverviewMetrics>('/overview'),
  listInvestigations: () => request<InvestigationSummary[]>('/investigations'),
  listRepositories: () => request<Repository[]>('/repositories'),
  getRepository: (id: string) => request<Repository>(`/repositories/${id}`),
  getInvestigation: (id: string) => request<Investigation>(`/investigations/${id}`),
  getInvestigationSummary: (id: string) => request<InvestigationSummary>(`/investigations/${id}`),
  getChanges: (id: string) => request<Change[]>(`/investigations/${id}/changes`),
  getArchitecture: (id: string) => request<Architecture>(`/investigations/${id}/architecture`),
  getRisks: (id: string) => request<Risk[]>(`/investigations/${id}/risks`),
  getVerification: (id: string) => request<Verification>(`/investigations/${id}/verification`),
  getEvidence: (id: string) => request<Evidence[]>(`/investigations/${id}/evidence`),
  getChangedFiles: (id: string) => request<ChangedFile[]>(`/investigations/${id}/files`),
  getEvents: (id: string) => request<AnalysisEvent[]>(`/investigations/${id}/events`),
  subscribeInvestigation: (id: string, realtimeToken: string, handlers: { onEvents: (events: AnalysisEvent[]) => void; onComplete: () => void; onError: (message: string) => void }) => {
    const socket = new WebSocket(`${websocketBase()}/ws/investigations/${encodeURIComponent(id)}?token=${encodeURIComponent(realtimeToken)}`);
    let closedByCaller = false;
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string);
        if (payload.type === 'snapshot') handlers.onEvents(payload.events || []);
        else if (payload.type === 'stage') api.getEvents(id).then(handlers.onEvents).catch(() => undefined);
        else if (payload.type === 'completed') handlers.onComplete();
        else if (payload.type === 'failed') handlers.onError(payload.message || 'Analysis failed.');
        else if (payload.type === 'error') handlers.onError(payload.message || 'Realtime progress is unavailable.');
      } catch {
        handlers.onError('Received an invalid realtime event.');
      }
    };
    socket.onerror = () => {
      if (!closedByCaller) handlers.onError('Realtime connection unavailable.');
    };
    return () => {
      closedByCaller = true;
      socket.close();
    };
  },
  analyzePullRequest: async (url: string) => {
    const result = await request<InvestigationStart>('/investigations', { method: 'POST', body: JSON.stringify({ pull_request_url: url }) });
    return { investigationId: result.id, status: result.status, realtimeToken: result.realtimeToken };
  },
  askInvestigationQuestion: (id: string, question: string) => request<QuestionAnswer>(`/investigations/${id}/questions`, { method: 'POST', body: JSON.stringify({ question }) }),
  getSettings: () => request<TraceSettings>('/settings'),
  updateSettings: (settings: Pick<TraceSettings, 'analysisDepth' | 'riskThreshold' | 'notifyHighRisk'>) => request<TraceSettings>('/settings', { method: 'PUT', body: JSON.stringify(settings) }),
  rotateApiKey: () => request<{ key: string; masked: string }>('/settings/api-key/rotate', { method: 'POST' }),
  getGitHubConnection: () => request<GitHubConnection>('/github/connection'),
  addRepository: (url: string) => request<Repository>('/repositories', { method: 'POST', body: JSON.stringify({ url }) }),
  listNotifications: () => request<TraceNotification[]>('/notifications'),
  markNotificationRead: (id: string) => request<{ id: string; read_at: string }>(`/notifications/${id}/read`, { method: 'PATCH' }),
};
