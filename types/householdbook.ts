import type { Timestamp } from 'firebase/firestore';

export interface Householdbook {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  archived: boolean;
  createdAt: Timestamp;
  members: string[];
}
