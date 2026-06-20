import { app, db } from './firebase';
import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

class FCMService {
  private messaging: Messaging | null = null;

  async init(): Promise<boolean> {
    const supported = await isSupported();
    if (!supported) {
      console.warn('FCM is not supported in this browser environment.');
      return false;
    }
    try {
      this.messaging = getMessaging(app);
      return true;
    } catch (err) {
      console.error('Error initializing FCM messaging:', err);
      return false;
    }
  }

  async requestPermissionAndRegisterToken(userId: string): Promise<string | null> {
    const initialized = await this.init();
    if (!initialized || !this.messaging) {
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(this.messaging, {
          vapidKey: 'BM3F1tW4U6tQeO5Hh486b1Q0Z8b5gC6z2yO9g5_D78z2V0b7W8N7t-x9Q8t8n6W8d9Z8N7t-x9Q8t'
        });
        if (token) {
          await updateDoc(doc(db, 'users', userId), {
            fcmToken: token
          });
          return token;
        } else {
          console.warn('No registration token available.');
        }
      } else {
        console.warn('Notification permission denied.');
      }
    } catch (err) {
      console.error('An error occurred while retrieving token:', err);
    }
    return null;
  }

  async subscribeToTopic(userId: string, topic: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        fcmTopics: arrayUnion(topic)
      });
    } catch (err) {
      console.error(`Error subscribing user ${userId} to topic ${topic}:`, err);
    }
  }

  async unsubscribeFromTopic(userId: string, topic: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        fcmTopics: arrayRemove(topic)
      });
    } catch (err) {
      console.error(`Error unsubscribing user ${userId} from topic ${topic}:`, err);
    }
  }

  async setupForegroundListener(onNotificationReceived: (payload: any) => void): Promise<() => void> {
    const initialized = await this.init();
    if (!initialized || !this.messaging) {
      return () => {};
    }
    return onMessage(this.messaging, (payload) => {
      onNotificationReceived(payload);
    });
  }
}

export const fcmService = new FCMService();
export default fcmService;
