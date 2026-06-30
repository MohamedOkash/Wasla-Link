import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, Loader2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { chatService } from '../../services/chat.service';
import { ChatMessage } from '../../types/chat.types';

interface ChatWidgetProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: 'customer' | 'vendor' | 'driver' | 'support' | 'admin';
  participants: string[];
  participantRoles: Record<string, string>;
  title?: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ 
  orderId, 
  isOpen, 
  onClose, 
  currentUserRole,
  participants,
  participantRoles,
  title
}) => {
  const { currentUser, isRTL } = useApp();
  const { t } = useTranslation();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let unsubscribe: () => void;

    const initChat = async () => {
      if (!isOpen || !currentUser || !currentUser.id) return;
      setIsInitializing(true);
      
      try {
        await chatService.getOrCreateOrderThread(orderId, participants, participantRoles);
        
        unsubscribe = chatService.subscribeToMessages(orderId, (newMessages) => {
          setMessages(newMessages);
          setIsInitializing(false);
          // Mark unread messages as read
          const unreadIds = newMessages
            .filter(m => !m.readBy.includes(currentUser.id as string))
            .map(m => m.id);
          if (unreadIds.length > 0) {
            chatService.markAsRead(orderId, unreadIds, currentUser.id as string);
          }
        });
      } catch (err) {
        console.error("Error initializing chat:", err);
        setIsInitializing(false);
      }
    };

    initChat();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [orderId, isOpen, currentUser, participants, participantRoles]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !currentUser.id || isSending) return;

    setIsSending(true);
    try {
      await chatService.sendMessage(
        orderId,
        currentUser.id,
        currentUser.name || 'User',
        currentUserRole,
        newMessage.trim()
      );
      setNewMessage('');
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-y-0 ${isRTL ? 'left-0' : 'right-0'} w-full md:w-[400px] bg-theme-bg shadow-2xl z-[100] flex flex-col animate-slide-in-right theme-transition border-l border-theme-border`}>
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <MessageSquare size={20} />
          <div>
            <h3 className="font-black text-sm">{title || t('chat')}</h3>
            <p className="text-[10px] opacity-80">{t('order')} #{orderId.slice(-6)}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-theme-bg/50">
        {isInitializing ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-theme-muted opacity-60">
            <MessageSquare size={48} className="mb-3" />
            <p className="text-sm font-black">{t('noMessagesYet') || 'لا توجد رسائل حتى الآن'}</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = currentUser?.id === msg.senderId;
            const showName = !isMe && (index === 0 || messages[index - 1].senderId !== msg.senderId);
            
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {showName && (
                  <span className="text-[10px] font-bold text-theme-muted mb-1 px-1 flex gap-1">
                    {msg.senderName} 
                    <span className="text-primary opacity-80">({msg.senderRole})</span>
                  </span>
                )}
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-primary text-white rounded-br-sm' 
                      : 'bg-theme-card border border-theme-border text-theme-text rounded-bl-sm'
                  }`}
                >
                  <p className="leading-relaxed">{msg.content}</p>
                  <span className={`text-[9px] font-bold block mt-1 ${isMe ? 'text-white/70 text-left' : 'text-theme-muted text-right'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-theme-card border-t border-theme-border">
        <form onSubmit={handleSend} className="flex gap-2 relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('typeMessage') || 'اكتب رسالتك هنا...'}
            className="flex-1 bg-theme-bg border border-theme-border rounded-full px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all pr-12"
            dir="auto"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || isSending}
            className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-2 bottom-2 w-10 bg-primary text-white rounded-full flex items-center justify-center transition-all ${
              !newMessage.trim() || isSending ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:scale-105 shadow-md shadow-primary/20'
            }`}
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className={isRTL ? 'rotate-180 -ml-1' : 'ml-1'} />}
          </button>
        </form>
      </div>
    </div>
  );
};
