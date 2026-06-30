export interface ChatMessage {
  id: string;
  orderId?: string; // Optional if it's support chat
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'vendor' | 'driver' | 'support' | 'admin';
  content: string;
  timestamp: string; // ISO string
  readBy: string[]; // User IDs who have read the message
}

export interface ChatThread {
  id: string; // usually same as orderId, or a unique ID for support
  orderId?: string;
  participants: string[]; // User IDs (customer, driver, vendor)
  participantRoles: Record<string, string>; // mapping user ID to role
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: Record<string, number>;
  type: 'order' | 'support';
  status: 'active' | 'closed';
  createdAt: string;
}
