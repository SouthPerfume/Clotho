import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

// 모든 기록 삭제
export const clearAllEntries = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'entries'));

    const deletePromises = [];
    querySnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });

    await Promise.all(deletePromises);

    console.log(`✅ ${deletePromises.length}개의 기록이 삭제되었습니다.`);
    return deletePromises.length;
  } catch (error) {
    console.error('❌ 삭제 중 오류:', error);
    throw error;
  }
};

// 특정 사용자의 기록만 삭제
export const clearUserEntries = async (userId) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'entries'));

    const deletePromises = [];
    querySnapshot.forEach((doc) => {
      if (doc.data().userId === userId) {
        deletePromises.push(deleteDoc(doc.ref));
      }
    });

    await Promise.all(deletePromises);

    console.log(`✅ ${deletePromises.length}개의 기록이 삭제되었습니다.`);
    return deletePromises.length;
  } catch (error) {
    console.error('❌ 삭제 중 오류:', error);
    throw error;
  }
};
