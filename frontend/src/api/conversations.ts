import { apiClient } from "./client";

export type Conversation = {
  id: string;
  buyerId: string;
  vendorId: string;
  productId: string;
  product: { title: string; photos: string[] };
  messages: ChatMessage[];
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  offerPrice: number | null;
  createdAt: string;
};

export const conversationsApi = {
  start: (productId: string) => apiClient.post<{ conversation: Conversation }>("/api/conversations", { productId }),
  listMine: () => apiClient.get<{ conversations: Conversation[] }>("/api/conversations/mine"),
  listMessages: (conversationId: string) =>
    apiClient.get<{ messages: ChatMessage[] }>(`/api/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, text: string, offerPrice?: number) =>
    apiClient.post<{ message: ChatMessage }>(`/api/conversations/${conversationId}/messages`, { text, offerPrice }),
};
