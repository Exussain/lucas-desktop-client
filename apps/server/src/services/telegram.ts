import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import type { PermissionPayload, TelegramConversation } from "../types.js";

export class TelegramBridgeService {
  private client: TelegramClient | null = null;

  constructor(
    private readonly apiId: number,
    private readonly apiHash: string,
    private readonly stringSession: string
  ) {}

  private async ensureClient(): Promise<TelegramClient> {
    if (this.client) return this.client;
    const session = new StringSession(this.stringSession);
    const client = new TelegramClient(session, this.apiId, this.apiHash, {
      connectionRetries: 3,
      baseLogger: undefined
    });
    await client.connect();
    this.client = client;
    return client;
  }

  async getAuthorizedConversations(permissions: PermissionPayload): Promise<TelegramConversation[]> {
    if (!this.apiId || !this.apiHash || !this.stringSession) {
      return [];
    }

    const allowed = new Set([
      ...permissions.allowedChatIds,
      ...permissions.allowedChannelIds,
      ...permissions.allowedGroupIds
    ]);

    const client = await this.ensureClient();
    const dialogs = await client.getDialogs({ limit: 120 });

    return dialogs
      .filter((dialog) => {
        const id = String((dialog.entity as any)?.id ?? "");
        return allowed.has(id);
      })
      .map((dialog) => {
        const entity: any = dialog.entity;
        const rawDate: unknown = (dialog as any).date;
        const kind: TelegramConversation["kind"] = entity?.broadcast
          ? "channel"
          : entity?.megagroup
          ? "group"
          : "chat";
        return {
          id: String(entity?.id ?? ""),
          title: String(dialog.title ?? "Untitled"),
          kind,
          lastMessage: String((dialog.message as any)?.message ?? ""),
          updatedAt: rawDate
            ? new Date(
                typeof rawDate === "number" ? rawDate * 1000 : (rawDate as string | Date)
              ).toISOString()
            : undefined
        };
      });
  }
}
