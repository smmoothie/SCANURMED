import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function saveUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
}): Promise<void> {
  const userRef = doc(db, 'users', user.uid);

  await runTransaction(db, async (transaction) => {
    const userSnapshot = await transaction.get(userRef);
    const profile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName,
      updatedAt: serverTimestamp(),
    };

    if (userSnapshot.exists()) {
      transaction.update(userRef, profile);
    } else {
      transaction.set(userRef, {
        ...profile,
        createdAt: serverTimestamp(),
      });
    }
  });
}
