export interface PointsHistoryEntry {
  id: string;
  userId: string;
  orderId?: string;
  points: number;
  type: 'earn' | 'redeem' | 'referral_inviter' | 'referral_invited';
  createdAt: string;
}

export interface Referral {
  id: string;
  inviterId: string;
  invitedId: string;
  invitedName: string;
  pointsAwarded: number;
  status: 'registered' | 'completed';
  createdAt: string;
}
