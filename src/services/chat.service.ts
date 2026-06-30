import { collection, doc, setDoc, getDoc, updateDoc, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { ChatMessage, ChatThread } from '../types/chat.types';

export const chatService = {
  // Initialize or get an existing thread for an order
  async getOrCreateOrderThread(orderId: string, participants: string[], participantRoles: Record<string, string>): Promise<string> {
    const threadRef = doc(db, 'chatThreads', orderId); // Use orderId as threadId for order chats
    const threadSnap = await getDoc(threadRef);

    if (!threadSnap.exists()) {
      const newThread: Omit<ChatThread, 'id'> = {
        orderId,
        participants,
        participantRoles,
        type: 'order',
        status: 'active',
        createdAt: new Date().toISOString()
      };
      await setDoc(threadRef, newThread);
    }
    return orderId;
  },

  // Send a message
  async sendMessage(threadId: string, senderId: string, senderName: string, senderRole: any, content: string): Promise<void> {
    const messagesRef = collection(db, 'chatThreads', threadId, 'messages');
    
    const newMessage = {
      senderId,
      senderName,
      senderRole,
      content,
      timestamp: new Date().toISOString(),
      readBy: [senderId],
      createdAt: serverTimestamp() // For exact ordering
    };

    await addDoc(messagesRef, newMessage);

    // Update thread last message
    const threadRef = doc(db, 'chatThreads', threadId);
    await updateDoc(threadRef, {
      lastMessage: content,
      lastMessageTime: new Date().toISOString()
    });
  },

  // Subscribe to messages
  subscribeToMessages(threadId: string, callback: (messages: ChatMessage[]) => void) {
    const messagesRef = collection(db, 'chatThreads', threadId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    
    return onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      callback(messages);
    });
  },

  // Mark messages as read
  async markAsRead(threadId: string, messageIds: string[], userId: string) {
    // A more advanced implementation would use batch writes
    for (const msgId of messageIds) {
      const msgRef = doc(db, 'chatThreads', threadId, 'messages', msgId);
      const snap = await getDoc(msgRef);
      if (snap.exists()) {
        const data = snap.data();
        if (!data.readBy.includes(userId)) {
          await updateDoc(msgRef, {
            readBy: [...data.readBy, userId]
          });
        }
      }
    }
  }
};
