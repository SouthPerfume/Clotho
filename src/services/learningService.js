import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// 사용자별 학습 패턴 문서 구조:
// {
//   userId: "temp_user_001",
//   corrections: {
//     "계획→목표": 5,  // AI가 "계획"으로 분류했는데 사용자가 "목표"로 수정한 횟수
//     "운동→건강": 3
//   },
//   preferredKeywords: {
//     "운동": ["헬스", "건강", "피트니스"],  // 자주 사용하는 키워드
//     "공부": ["학습", "독서", "강의"]
//   },
//   lastUpdated: "2026-01-20T10:00:00Z"
// }

// 학습 데이터 가져오기
export const getUserLearning = async (userId) => {
  try {
    const learningRef = doc(db, 'userLearning', userId);
    const learningDoc = await getDoc(learningRef);

    if (learningDoc.exists()) {
      return learningDoc.data();
    }

    // 문서가 없으면 초기 구조 생성
    const initialData = {
      userId,
      corrections: {},
      preferredKeywords: {},
      lastUpdated: new Date().toISOString()
    };

    await setDoc(learningRef, initialData);
    return initialData;
  } catch (error) {
    console.error('Error getting user learning:', error);
    return {
      userId,
      corrections: {},
      preferredKeywords: {},
      lastUpdated: new Date().toISOString()
    };
  }
};

// 수정 패턴 기록
export const recordCorrection = async (userId, originalCategory, correctedCategory) => {
  try {
    const learningRef = doc(db, 'userLearning', userId);
    const learningDoc = await getDoc(learningRef);

    const correctionKey = `${originalCategory}→${correctedCategory}`;

    if (learningDoc.exists()) {
      const currentData = learningDoc.data();
      const currentCount = currentData.corrections[correctionKey] || 0;

      await updateDoc(learningRef, {
        [`corrections.${correctionKey}`]: currentCount + 1,
        lastUpdated: new Date().toISOString()
      });
    } else {
      // 첫 수정인 경우 문서 생성
      await setDoc(learningRef, {
        userId,
        corrections: { [correctionKey]: 1 },
        preferredKeywords: {},
        lastUpdated: new Date().toISOString()
      });
    }

    console.log(`✅ 학습 기록: ${correctionKey} (${(await getDoc(learningRef)).data().corrections[correctionKey]}회)`);
  } catch (error) {
    console.error('Error recording correction:', error);
  }
};

// 키워드 패턴 기록
export const recordKeywordPattern = async (userId, category, keywords) => {
  try {
    const learningRef = doc(db, 'userLearning', userId);
    const learningDoc = await getDoc(learningRef);

    if (learningDoc.exists()) {
      const currentData = learningDoc.data();
      const existingKeywords = currentData.preferredKeywords[category] || [];

      // 새 키워드를 기존 키워드에 추가 (중복 제거)
      const updatedKeywords = [...new Set([...existingKeywords, ...keywords])];

      await updateDoc(learningRef, {
        [`preferredKeywords.${category}`]: updatedKeywords,
        lastUpdated: new Date().toISOString()
      });
    } else {
      await setDoc(learningRef, {
        userId,
        corrections: {},
        preferredKeywords: { [category]: keywords },
        lastUpdated: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error recording keyword pattern:', error);
  }
};

// 학습 데이터를 프롬프트에 추가할 힌트 생성
export const generateLearningHints = async (userId) => {
  try {
    const learningData = await getUserLearning(userId);
    const hints = [];

    // 카테고리 수정 패턴
    if (Object.keys(learningData.corrections).length > 0) {
      const topCorrections = Object.entries(learningData.corrections)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // 상위 5개만

      if (topCorrections.length > 0) {
        hints.push('\n사용자 선호 카테고리 패턴:');
        topCorrections.forEach(([pattern, count]) => {
          const [from, to] = pattern.split('→');
          hints.push(`- "${from}"보다 "${to}" 선호 (${count}회 수정)`);
        });
      }
    }

    // 키워드 패턴
    if (Object.keys(learningData.preferredKeywords).length > 0) {
      hints.push('\n사용자가 자주 사용하는 키워드:');
      Object.entries(learningData.preferredKeywords).forEach(([category, keywords]) => {
        if (keywords.length > 0) {
          hints.push(`- ${category}: ${keywords.slice(0, 5).join(', ')}`);
        }
      });
    }

    return hints.join('\n');
  } catch (error) {
    console.error('Error generating learning hints:', error);
    return '';
  }
};
