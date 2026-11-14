/**
 * PlaceFlow / Meridian — Account Area API Layer.
 * Validates all network responses at the edge with Zod schemas.
 * Throws ApiError('BadResponse') on validation failure.
 */

import { client } from '../core/api/client';
import { parseEdge, z } from '../core/api/parseEdge';

export interface AccountSession {
  session_id: string;
  ip?: string;
  user_agent?: string;
  created_at: string;
  last_active_at?: string;
  is_current?: boolean;
}

export const SessionSchema = z.object({
  session_id: z.string(),
  ip: z.string().optional(),
  user_agent: z.string().optional(),
  created_at: z.string().default(''),
  last_active_at: z.string().optional(),
  is_current: z.boolean().optional(),
});

export const ProfileResponseSchema = z.object({
  person: z.object({
    person_id: z.string().default(''),
    display_name: z.string().default(''),
    preferred_name: z.string().optional(),
    avatar_url: z.string().nullable().optional(),
    headline: z.string().optional(),
    phone: z.string().optional(),
    timezone: z.string().optional(),
    locale: z.string().optional(),
    notification_prefs: z.record(z.string(), z.any()).optional(),
  }).passthrough().default({ person_id: '', display_name: '' }),
  affiliations: z.array(z.object({
    affiliation_id: z.string().default(''),
    type: z.string().default(''),
    status: z.string().default(''),
    record_id: z.string().default(''),
    verified_at: z.string().nullable().optional(),
  }).passthrough()).default([]),
  official_record: z.record(z.string(), z.any()).default({}),
  career_extension: z.record(z.string(), z.any()).optional(),
  completeness: z.object({
    score: z.number().default(0),
    next_missing: z.string().default(''),
  }).optional(),
}).passthrough();

export const NotificationSchema = z.object({
  notification_id: z.string(),
  kind: z.string().default('INFO'),
  title: z.string().default(''),
  body: z.string().default(''),
  link: z.string().nullable().optional(),
  created_at: z.string().default(''),
  read_at: z.string().nullable().optional(),
});

export const ConsentSchema = z.object({
  consent_id: z.string(),
  purpose: z.string().default(''),
  status: z.string().default('ACTIVE'),
  valid_until: z.string().optional(),
  granted_at: z.string().optional(),
  withdrawn_at: z.string().optional(),
});

export const accountApi = {
  getProfile: async (): Promise<z.infer<typeof ProfileResponseSchema>> => {
    const raw = await client.get<unknown>('/account/profile/');
    return parseEdge(ProfileResponseSchema, raw);
  },

  updateProfile: async (data: { preferred_name?: string; headline?: string; phone?: string; timezone?: string; summary?: string; skills?: string[]; links?: string[] }): Promise<z.infer<typeof ProfileResponseSchema>> => {
    const raw = await client.patch<unknown>('/account/profile/', data);
    return parseEdge(ProfileResponseSchema, raw);
  },

  uploadAvatar: async (formData: FormData): Promise<{ status: string; avatar_url: string }> => {
    const raw = await client.post<unknown>('/account/avatar/', formData);
    return parseEdge(z.object({
      status: z.string().default('SUCCESS'),
      avatar_url: z.string().default(''),
    }), raw);
  },

  getSessions: async (): Promise<AccountSession[]> => {
    const raw = await client.get<unknown>('/account/sessions/');
    const parsed = parseEdge(z.object({
      sessions: z.array(SessionSchema).default([]),
    }), raw);
    return parsed.sessions;
  },

  revokeSession: async (sessionId: string): Promise<{ success: boolean; message: string }> => {
    const raw = await client.delete<unknown>(`/account/sessions/${sessionId}/`);
    return parseEdge(z.object({
      success: z.boolean().default(true),
      message: z.string().default(''),
    }), raw);
  },

  revokeOtherSessions: async (): Promise<{ success: boolean; revoked_count: number }> => {
    const raw = await client.post<unknown>('/account/sessions/revoke-others/');
    return parseEdge(z.object({
      success: z.boolean().default(true),
      revoked_count: z.number().default(0),
    }), raw);
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const raw = await client.post<unknown>('/account/password/change/', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return parseEdge(z.object({
      success: z.boolean().default(true),
      message: z.string().default(''),
    }), raw);
  },

  getNotifications: async (): Promise<z.infer<typeof NotificationSchema>[]> => {
    const raw = await client.get<unknown>('/account/notifications/');
    const parsed = parseEdge(z.object({
      notifications: z.array(NotificationSchema).default([]),
    }), raw);
    return parsed.notifications;
  },

  markNotificationRead: async (notificationId: string): Promise<{ success: boolean }> => {
    const raw = await client.post<unknown>(`/account/notifications/${notificationId}/read/`);
    return parseEdge(z.object({ success: z.boolean().default(true) }), raw);
  },

  getConsents: async (): Promise<z.infer<typeof ConsentSchema>[]> => {
    const raw = await client.get<unknown>('/account/consents/');
    const parsed = parseEdge(z.object({
      consents: z.array(ConsentSchema).default([]),
    }), raw);
    return parsed.consents;
  },

  grantConsent: async (purpose: string): Promise<{ consent_id: string; status: string }> => {
    const raw = await client.post<unknown>('/account/consents/', { purpose });
    return parseEdge(z.object({ consent_id: z.string(), status: z.string() }), raw);
  },

  withdrawConsent: async (purpose: string): Promise<{ success: boolean; message: string }> => {
    const raw = await client.post<unknown>('/account/consents/withdraw/', { purpose });
    return parseEdge(z.object({ success: z.boolean().default(true), message: z.string().default('') }), raw);
  },
};

