import type { Firestore } from 'firebase/firestore';

// Use requireActual so the real Firebase classes are used even when
// firebase/firestore is mocked at the SDK-function level in test files.
// Firestore does not open a network connection until a real SDK call is made,
// so this is safe — all SDK functions in service tests are mocked.
const { initializeApp, getApps } =
  jest.requireActual<typeof import('firebase/app')>('firebase/app');
const { getFirestore } =
  jest.requireActual<typeof import('firebase/firestore')>('firebase/firestore');

const TEST_APP_NAME = 'jest-test-app';
const testApp =
  (getApps() as { name: string }[]).find((app) => app.name === TEST_APP_NAME) ??
  initializeApp({ projectId: 'demo-test' }, TEST_APP_NAME);

export const testDb: Firestore = getFirestore(testApp);
