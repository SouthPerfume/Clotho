import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// 기록 저장
export const saveEntry = async (userId, content, analysis = null) => {
  try {
    const entryData = {
      userId,
      content,
      timestamp: serverTimestamp(),
      analysis: analysis || null,
      metadata: {
        createdAt: new Date().toISOString(),
      }
    };

    const docRef = await addDoc(collection(db, 'entries'), entryData);

    return {
      id: docRef.id,
      ...entryData,
      timestamp: new Date(), // 로컬에서는 실제 Date 객체 반환
    };
  } catch (error) {
    console.error('Error saving entry:', error);
    throw error;
  }
};

// 최근 기록 가져오기
export const getRecentEntries = async (userId, limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'entries'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const entries = [];

    querySnapshot.forEach((doc) => {
      entries.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return entries;
  } catch (error) {
    console.error('Error getting entries:', error);
    throw error;
  }
};

// 카테고리별 기록 개수 가져오기
export const getCategoryCount = async (userId, category) => {
  try {
    const q = query(collection(db, 'entries'));
    const querySnapshot = await getDocs(q);

    let count = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId === userId && data.analysis?.category === category) {
        count++;
      }
    });

    return count;
  } catch (error) {
    console.error('Error getting category count:', error);
    throw error;
  }
};

// 선택한 기록 삭제
export const deleteEntries = async (entryIds) => {
  try {
    const deletePromises = entryIds.map(id =>
      deleteDoc(doc(db, 'entries', id))
    );
    await Promise.all(deletePromises);
    return entryIds.length;
  } catch (error) {
    console.error('Error deleting entries:', error);
    throw error;
  }
};

// 기록 수정
export const updateEntry = async (entryId, updates) => {
  try {
    const entryRef = doc(db, 'entries', entryId);
    await updateDoc(entryRef, updates);
    return { id: entryId, ...updates };
  } catch (error) {
    console.error('Error updating entry:', error);
    throw error;
  }
};
