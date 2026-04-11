export type LayerCategory = "clusters" | "incidents" | "roads" | "utilities" | "medical";

export type ClusterFeature = {
  id: string;
  title: string;
  category: LayerCategory;
  coordinates: [number, number];
  details?: string;
};

export type ClusterPayload = {
  updatedAt: string;
  features: ClusterFeature[];
};

export type PermissionPayload = {
  sessionId: string;
  allowedChatIds: string[];
  allowedChannelIds: string[];
  allowedGroupIds: string[];
};

export type TelegramConversation = {
  id: string;
  title: string;
  kind: "chat" | "channel" | "group";
  lastMessage?: string;
  updatedAt?: string;
};
