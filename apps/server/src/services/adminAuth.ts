import crypto from "node:crypto";
import axios from "axios";
import type { PermissionPayload } from "../types.js";

export class AdminAuthorizationService {
  constructor(private readonly baseUrl: string, private readonly token: string) {}

  async createSession(userToken: string): Promise<PermissionPayload> {
    if (!this.baseUrl) {
      return {
        sessionId: crypto.randomUUID(),
        allowedChatIds: [],
        allowedChannelIds: [],
        allowedGroupIds: []
      };
    }

    const res = await axios.post(
      `${this.baseUrl}/desktop/session/permissions`,
      { userToken },
      {
        timeout: 3000,
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json"
        }
      }
    );

    const data = res.data as Partial<PermissionPayload>;
    return {
      sessionId: data.sessionId ?? crypto.randomUUID(),
      allowedChatIds: data.allowedChatIds ?? [],
      allowedChannelIds: data.allowedChannelIds ?? [],
      allowedGroupIds: data.allowedGroupIds ?? []
    };
  }
}
