import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateLearningHints } from './learningService';

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// 한국어 조사 및 어미 제거 함수
const cleanKeywords = (keywords) => {
  // 일반 조사 목록
  const particles = [
    '이랑', '에서', '에게', '한테', '으로', '로', '까지', '부터', '처럼', '같이',
    '이', '가', '을', '를', '은', '는', '도', '만', '의', '와', '과', '나', '이나',
    '보니까', '보니', '에도', '라도', '마저', '조차', '밖에'
  ];

  // 동사/형용사 어미 목록
  const endings = [
    '했다', '한다', '했어', '해서', '하고', '하지', '하는', '하던',
    '았다', '었다', '이다', '였다', '였어', '았어', '었어',
    '습니다', '입니다', '세요', '어요', '아요',
    '울었다', '웃었다', '갔다', '왔다', '봤다', '먹었다'
  ];

  // 제외할 일반 단어 (시간, 부사 등)
  const excludeWords = [
    '오늘', '어제', '내일', '그냥', '정말', '진짜', '완전', '너무', '매우',
    '조금', '많이', '아주', '좀', '더', '덜', '때', '일', '것', '수'
  ];

  return keywords
    .map(keyword => {
      let cleaned = keyword.trim();

      // 1. 조사 제거 (가장 긴 것부터 매칭)
      const sortedParticles = [...particles].sort((a, b) => b.length - a.length);
      for (const particle of sortedParticles) {
        if (cleaned.endsWith(particle)) {
          cleaned = cleaned.slice(0, -particle.length);
          break;
        }
      }

      // 2. 동사/형용사 어미 제거
      const sortedEndings = [...endings].sort((a, b) => b.length - a.length);
      for (const ending of sortedEndings) {
        if (cleaned.endsWith(ending)) {
          cleaned = cleaned.slice(0, -ending.length);
          break;
        }
      }

      return cleaned;
    })
    .filter(keyword => {
      // 3. 제외 단어 필터링
      if (excludeWords.includes(keyword)) return false;
      // 4. 너무 짧은 키워드 제거 (1글자)
      if (keyword.length < 2) return false;
      // 5. 빈 문자열 제거
      if (!keyword.trim()) return false;
      return true;
    })
    // 6. 중복 제거
    .filter((keyword, index, self) => self.indexOf(keyword) === index);
};

// 개별 기록 분석 프롬프트 (영어로 작성 - 더 정확한 분석을 위해)
const ANALYSIS_PROMPT = `You are an expert psychologist specializing in journal analysis and emotional interpretation. Analyze the following Korean journal entry with deep contextual understanding.

**CORE PRINCIPLES:**
1. Understand the PRIMARY PURPOSE and CONTEXT of the entry
2. Focus on OVERALL MEANING, not just keyword matching
3. Prioritize the user's EMOTIONS and INTENTIONS

**CATEGORY CLASSIFICATION RULES (2-TIER SYSTEM):**

**STEP 1: Determine PRIMARY CATEGORY (대분류) - Choose ONE:**

1. **자기이해 (Understanding Myself)** - Self-reflection, emotions, dreams, introspection
   - Dreams about self, emotional states, self-discovery, personal insights
   - Ex: "꿈에서...", "오늘 기분이...", "나는 왜..."

2. **습관 (Building Habits)** - Routine activities, exercise, study, work
   - Daily routines, exercise, productivity, skill-building
   - Ex: "오늘 운동했다", "공부했다", "루틴 지켰다"

3. **목표 (Achieving Goals)** - Plans, aspirations, future intentions
   - Future plans, goal-setting, commitments, aspirations
   - Ex: "내일 ~할 거야", "목표는...", "이루고 싶다"

4. **관계 (Caring for Relationships)** - Interactions with people
   - Family, friends, colleagues, social interactions
   - Ex: "친구랑...", "가족과...", "동료와..."

**STEP 2: Determine SUBCATEGORY (소분류) - Choose ONE:**

For "자기이해":
- "꿈" (Dream) - Sleep dreams ONLY (MUST have "꿈을 꿨다", "꿈에서", "꿈속에서")
- "감정" (Emotion) - Emotional states, feelings
- "회고" (Reflection) - Looking back at the past

For "습관":
- "운동" (Exercise) - Physical activities
- "공부" (Study) - Learning activities
- "업무" (Work) - Work-related tasks
- "일상" (Daily Life) - Other routines

For "목표":
- "계획" (Plan) - Future intentions, goals
- "도전" (Challenge) - New challenges, experiments

For "관계":
- "가족" (Family) - Family interactions
- "친구" (Friends) - Friend interactions
- "연애" (Romance) - Romantic relationships
- "기타" (Other) - Other relationships

**KEYWORD EXTRACTION RULES (CRITICAL - MUST FOLLOW):**
⚠️ CRITICAL: Extract ONLY pure NOUNS (명사). NO particles (조사), NO verb forms, NO adjectives!

**STEP 1 - Remove particles from all words:**
- "동생이랑" → "동생" ✅
- "보니까" → REJECT (not a noun) ❌
- "문산을" → "문산" ✅
- "오늘은" → REJECT (time word) ❌
- "동생이" → "동생" ✅

**STEP 2 - Filter to ONLY nouns:**
- ✅ ACCEPT: People (동생, 엄마, 친구), Places (집, 학교, 카페), Objects (문신, 책, 차), Concepts (꿈, 사랑, 희망)
- ❌ REJECT: Verbs (울었다, 찾았다, 갔다), Time words (오늘, 어제, 내일), Particles (이랑, 보니까, 정도), Adjectives (좋은, 나쁜)

**STEP 3 - Select 3-5 most meaningful nouns**

**Examples:**
- Input: "동생이랑 문신 가게 찾았다" → ["동생", "문신"] ✅
- Input: "오늘 카페에서 친구 만났다" → ["카페", "친구"] ✅ (NOT "오늘")
- Input: "울었다" → ["감정"] ✅ (convert emotion verb to noun concept)
- Input: "행복했다" → ["행복"] ✅ (convert to noun form)

**FORBIDDEN in keywords:** 오늘, 어제, 내일, 그냥, 정말, 보니까, ~이랑, ~에서, ~했다, ~하다

**EMOTION ANALYSIS:**
- emotionScore: -1.0 (very negative) to 1.0 (very positive)
- Capture subtle emotions (0.2, -0.4, etc.)
- Neutral range: 0.0 ~ ±0.1

**INTERPRETATION (IN KOREAN):**
- interpretation: MINIMUM 5 sentences of deep psychological analysis
  - Provide DETAILED PSYCHOLOGICAL INSIGHT, not just repetition
  - Analyze the user's emotions, situation, and underlying psychology
  - Use warm, understanding, empathetic tone
  - For dreams, provide extensive symbol analysis (minimum 6-8 sentences)
  - All output in Korean
  - NO summary field - only interpretation

**SPECIAL RULE - Dream Category:**
When category is "꿈", provide DEEP PSYCHOLOGICAL DREAM INTERPRETATION (minimum 4-6 sentences):
- Identify and analyze EACH symbol (people, places, objects, actions) separately
- Explain what each symbol represents in psychology (Freud/Jung)
- Connect symbols to the dreamer's current emotional state
- Discuss unconscious desires, anxieties, or conflicts
- Provide insight into what the dream reveals about their psyche
- Use specific psychological terminology and concepts
- Symbol meanings:
  * Siblings → Family bonds, rivalry, aspects of self
  * Tattoos → Permanent decisions, identity, fear of irreversible change
  * Mother → Nurturing, protection, responsibility, emotional security
  * Old house (초가집) → Past, vulnerability, childhood, economic anxiety
  * Temporary tattoo → Relief that feared outcomes are reversible
  * Crying upon waking → Emotional catharsis, release of tension
  * Flying → Desire for freedom, escape from constraints
  * Being chased → Avoidance, stress, unresolved issues
  * Falling → Loss of control, low self-esteem
  * Water → Emotions, unconscious mind
  * House → Self, identity, mental state
  * Death → Transformation, new beginning, fear of loss

**OUTPUT FORMAT:**
{
  "primaryCategory": "자기이해" | "습관" | "목표" | "관계",
  "subCategory": "꿈" | "감정" | "회고" | "운동" | "공부" | "업무" | "일상" | "계획" | "도전" | "가족" | "친구" | "연애" | "기타",
  "keywords": ["keyword1", "keyword2", ...],
  "sentiment": "긍정" | "중립" | "부정",
  "emotionScore": -1.0 to 1.0,
  "interpretation": "5+ sentences of deep analysis in Korean"
}

**CLASSIFICATION EXAMPLES:**

Input: "오늘 동생이랑 문신할 곳 찾다가 허탕쳤다"
Output: {
  "primaryCategory": "관계",
  "subCategory": "가족",
  "keywords": ["동생", "문신"],
  "sentiment": "중립",
  "emotionScore": -0.1,
  "interpretation": "동생과 함께 시간을 보내며 문신 가게를 찾아다녔지만 원하는 곳을 찾지 못한 것 같네요. 약간의 아쉬움이 느껴지지만, 함께한 시간 자체는 의미가 있었을 거예요. 동생과의 관계에서 함께 무언가를 찾아가는 과정 자체가 중요한 경험이 되었을 것입니다. 비록 목표를 달성하지 못했지만, 이런 소소한 실패 경험도 관계를 더 끈끈하게 만드는 요소가 됩니다. 다음에는 더 나은 계획으로 성공할 수 있을 거예요."
}

Input: "오늘 아침에 우울했다"
Output: {
  "primaryCategory": "자기이해",
  "subCategory": "감정",
  "keywords": ["아침", "우울"],
  "sentiment": "부정",
  "emotionScore": -0.6,
  "interpretation": "아침부터 우울한 기분으로 하루를 시작하셨군요. 하루의 시작이 무겁게 느껴질 때는 그 감정을 있는 그대로 인정하는 것이 중요합니다. 이런 기분이 드는 것은 자연스러운 일이며, 스스로를 탓할 필요는 없습니다. 간단한 산책이나 좋아하는 음악을 듣는 것만으로도 기분 전환에 도움이 될 수 있습니다. 만약 이런 우울감이 지속된다면, 전문가의 도움을 받는 것도 좋은 선택입니다."
}

Input: "어젯밤 꿈에서 하늘을 날았다. 되게 신기했다"
Output: {
  "primaryCategory": "자기이해",
  "subCategory": "꿈",
  "keywords": ["하늘", "비행"],
  "sentiment": "긍정",
  "emotionScore": 0.5,
  "interpretation": "하늘을 나는 꿈은 심리학적으로 자유에 대한 강한 갈망과 현실의 제약으로부터 벗어나고 싶은 무의식적 욕구를 나타냅니다. 비행이 순조로웠다면 현재 상황에서 자신감과 통제력을 느끼고 있다는 의미이며, 신기함을 느낀 것은 새로운 가능성에 대한 긍정적 기대감을 반영합니다. 최근 답답했던 상황에서 벗어나고 싶거나, 새로운 도전을 앞두고 있을 수 있습니다. 프로이트 심리학에서 비행 꿈은 성적 욕구나 야망의 표현으로 해석되기도 하지만, 융 심리학에서는 자아의 성장과 초월을 상징합니다. 신기함이라는 긍정적 감정은 이러한 변화를 수용할 준비가 되어 있음을 의미합니다."
}

Input: "내일부터 매일 아침 6시에 일어나서 운동하기로 했다"
Output: {
  "primaryCategory": "목표",
  "subCategory": "계획",
  "keywords": ["아침", "운동", "습관"],
  "sentiment": "긍정",
  "emotionScore": 0.4,
  "interpretation": "건강한 습관을 만들기 위한 구체적인 계획을 세우셨네요. 아침 6시라는 명확한 시간과 운동이라는 구체적인 행동을 정한 것은 목표 달성의 첫걸음입니다. 처음에는 어렵겠지만, 작은 성공 경험들이 쌓이면서 자신감도 함께 성장할 것입니다. 목표를 이루기 위해서는 지나치게 완벽하려 하지 말고, 실수를 용인하는 유연함도 필요합니다. 꾸준함이 완벽함보다 중요하다는 것을 기억하세요."
}

Input: "오늘 헬스장에서 3km 뛰었다"
Output: {
  "primaryCategory": "습관",
  "subCategory": "운동",
  "keywords": ["헬스장", "러닝"],
  "sentiment": "긍정",
  "emotionScore": 0.6,
  "interpretation": "오늘 헬스장에서 3km를 완주하셨군요! 꾸준한 운동은 신체 건강뿐만 아니라 정신 건강에도 큰 도움이 됩니다. 러닝은 특히 엔돌핀 분비를 촉진해 기분을 좋게 만들고 스트레스를 해소하는 데 효과적입니다. 이런 작은 성취들이 모여 더 큰 변화를 만들어낼 것입니다. 스스로를 격려하고 축하하는 시간을 가져보세요. 내일도 무리하지 않는 선에서 꾸준히 이어가시길 응원합니다."
}

Journal Entry: {content}

**Output ONLY valid JSON. No explanations, just the JSON object.**`;

// 개별 기록 분석
export const analyzeEntry = async (content, userId = 'temp_user_001') => {
  try {
    console.log('🔍 [AI Analysis] Starting analysis...');
    console.log('📝 Content:', content);

    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      console.warn('⚠️ Gemini API key not found. Using mock data.');
      return getMockAnalysis(content);
    }

    console.log('✅ API Key found. Calling Gemini API...');

    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview', // 최신 Gemini 3 Flash (Pro급 성능, Flash급 속도)
      generationConfig: {
        temperature: 0.4, // 꿈 해석 같은 창의적 분석을 위해 적당히 상향
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048, // 더 긴 해석을 위해 토큰 제한 상향
      },
    });

    // 사용자 학습 데이터 가져오기
    const learningHints = await generateLearningHints(userId);
    console.log('📚 Learning hints:', learningHints ? 'Available' : 'None');

    // 학습 힌트를 프롬프트에 추가
    let prompt = ANALYSIS_PROMPT.replace('{content}', content);
    if (learningHints) {
      prompt = prompt.replace('Journal Entry: {content}', `${learningHints}\n\nJournal Entry: ${content}`);
    }

    console.log('🚀 Sending request to Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('📥 Raw AI Response:', text);

    // JSON 파싱 (더 견고한 방식)
    let analysis;
    try {
      // 1. 코드 블록 제거 (```json ... ```)
      let cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      // 2. JSON 객체 추출
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ No JSON found in response');
        throw new Error('Invalid JSON response from AI');
      }

      // 3. JSON 파싱
      analysis = JSON.parse(jsonMatch[0]);
      console.log('✨ Parsed analysis:', analysis);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('❌ Failed text:', text);
      throw new Error('Failed to parse AI response');
    }

    // 검증
    if (!analysis.keywords || !analysis.primaryCategory || !analysis.subCategory || !analysis.emotionScore) {
      console.error('❌ Invalid analysis structure:', analysis);
      throw new Error('Invalid analysis structure');
    }

    // 하위 호환성: category 필드 추가 (기존 코드 대응)
    analysis.category = analysis.subCategory;

    // 키워드 후처리: 조사 제거
    console.log('🔧 Keywords before cleaning:', analysis.keywords);
    analysis.keywords = cleanKeywords(analysis.keywords);
    console.log('✅ Keywords after cleaning:', analysis.keywords);

    console.log('✅ Analysis complete! Using REAL AI data');
    return analysis;
  } catch (error) {
    console.error('❌ Error analyzing entry:', error);
    console.log('🔄 Falling back to mock analysis');
    // 에러 발생 시 기본 분석 반환
    return getMockAnalysis(content);
  }
};

// Mock 분석 (API 키 없을 때 또는 에러 시)
const getMockAnalysis = (content) => {
  const keywords = extractSimpleKeywords(content);
  const subCategory = guessSubCategory(content);
  const primaryCategory = guessPrimaryCategory(subCategory);
  const emotionScore = guessEmotion(content);

  return {
    primaryCategory,
    subCategory,
    category: subCategory, // 하위 호환성
    keywords,
    sentiment: emotionScore > 0.3 ? '긍정' : emotionScore < -0.3 ? '부정' : '중립',
    emotionScore,
    interpretation: `이 기록은 ${subCategory} 관련 내용으로 분류되었습니다. ${
      emotionScore > 0 ? '긍정적인' : emotionScore < 0 ? '부정적인' : '중립적인'
    } 감정이 느껴집니다. 기록하신 내용을 통해 현재 상황과 감정 상태를 이해할 수 있었습니다. 이러한 경험들이 쌓여 자기 이해와 성장의 밑거름이 될 것입니다. 앞으로도 꾸준히 기록하며 자신을 돌아보는 시간을 가져보세요.`,
  };
};

// 간단한 키워드 추출 (공백 기준)
const extractSimpleKeywords = (text) => {
  const words = text
    .replace(/[^\w\sㄱ-ㅎ가-힣]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 1);

  // 빈도수 기반 상위 5개
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
};

// 소카테고리 추측
const guessSubCategory = (text) => {
  const dreamKeywords = ['꿈', '악몽', '꿈에서', '꿈속'];
  const exerciseKeywords = ['운동', '헬스', '달리기', '러닝', '요가', '필라테스', '스쿼트'];
  const emotionKeywords = ['기분', '감정', '느낌', '슬프', '기쁘', '화나', '우울'];
  const planKeywords = ['할 거', '하려고', '예정', '목표'];
  const relationshipKeywords = ['친구', '가족', '동생', '엄마', '아빠', '언니', '오빠', '형', '누나'];

  const lower = text.toLowerCase();

  if (dreamKeywords.some(kw => lower.includes(kw))) return '꿈';
  if (exerciseKeywords.some(kw => lower.includes(kw))) return '운동';
  if (emotionKeywords.some(kw => lower.includes(kw))) return '감정';
  if (planKeywords.some(kw => lower.includes(kw))) return '계획';
  if (relationshipKeywords.some(kw => lower.includes(kw))) return '가족';

  return '일상';
};

// 대카테고리 추측
const guessPrimaryCategory = (subCategory) => {
  const understanding = ['꿈', '감정', '회고'];
  const habit = ['운동', '공부', '업무', '일상'];
  const goal = ['계획', '도전'];
  const relationship = ['가족', '친구', '연애', '기타'];

  if (understanding.includes(subCategory)) return '자기이해';
  if (habit.includes(subCategory)) return '습관';
  if (goal.includes(subCategory)) return '목표';
  if (relationship.includes(subCategory)) return '관계';

  return '자기이해';
};

// 감정 점수 추측
const guessEmotion = (text) => {
  const positiveWords = ['좋', '행복', '기쁨', '즐거', '감사', '사랑', '완벽', '최고'];
  const negativeWords = ['나쁨', '슬픔', '우울', '화', '짜증', '스트레스', '힘들', '싫'];

  let score = 0;

  positiveWords.forEach(word => {
    if (text.includes(word)) score += 0.2;
  });

  negativeWords.forEach(word => {
    if (text.includes(word)) score -= 0.2;
  });

  return Math.max(-1, Math.min(1, score));
};

export default {
  analyzeEntry,
};
