import { useState } from 'react';
import './EntryDetail.css';
import { updateEntry } from '../services/entryService';
import { recordCorrection, recordKeywordPattern } from '../services/learningService';

function EntryDetail({ entry, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCategory, setEditedCategory] = useState(entry.analysis?.category || '일상');
  const [editedKeywords, setEditedKeywords] = useState(entry.analysis?.keywords || []);
  const [newKeyword, setNewKeyword] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  if (!entry) return null;

  const categories = ['꿈', '운동', '감정', '계획', '회고', '공부/업무', '관계', '일상'];

  const formatDate = (timestamp) => {
    if (!timestamp) return '날짜 정보 없음';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSaveEdit = async () => {
    try {
      const updates = {
        analysis: {
          ...entry.analysis,
          category: editedCategory,
          keywords: editedKeywords,
        }
      };

      await updateEntry(entry.id, updates);

      // 학습 데이터 기록
      const originalCategory = entry.analysis?.category;
      const TEMP_USER_ID = 'temp_user_001'; // TODO: Firebase Auth로 대체

      // 카테고리가 변경된 경우 패턴 기록
      if (originalCategory && originalCategory !== editedCategory) {
        await recordCorrection(TEMP_USER_ID, originalCategory, editedCategory);
      }

      // 키워드 패턴 기록
      if (editedKeywords.length > 0) {
        await recordKeywordPattern(TEMP_USER_ID, editedCategory, editedKeywords);
      }

      setIsEditing(false);

      if (onUpdate) {
        onUpdate({ ...entry, ...updates });
      }

      alert('수정되었습니다!');
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleCancelEdit = () => {
    setEditedCategory(entry.analysis?.category || '일상');
    setEditedKeywords(entry.analysis?.keywords || []);
    setNewKeyword('');
    setCustomCategory('');
    setIsAddingCategory(false);
    setIsEditing(false);
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !editedKeywords.includes(newKeyword.trim())) {
      setEditedKeywords([...editedKeywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword) => {
    setEditedKeywords(editedKeywords.filter(k => k !== keyword));
  };

  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleAddCustomCategory = () => {
    if (customCategory.trim()) {
      setEditedCategory(customCategory.trim());
      setCustomCategory('');
      setIsAddingCategory(false);
    }
  };

  const handleCustomCategoryKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomCategory();
    } else if (e.key === 'Escape') {
      setCustomCategory('');
      setIsAddingCategory(false);
    }
  };

  return (
    <div className="entry-detail-overlay" onClick={onClose}>
      <div className="entry-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="detail-header">
          <div className="detail-header-info">
            <div className="category-badges">
              {entry.analysis?.primaryCategory && (
                <span className="category-badge primary-badge">
                  {entry.analysis.primaryCategory}
                </span>
              )}
              <span className={`category-badge sub-badge category-${entry.analysis?.subCategory || entry.analysis?.category || '일상'}`}>
                {entry.analysis?.subCategory || entry.analysis?.category || '일상'}
              </span>
            </div>
            <span className="detail-date">{formatDate(entry.timestamp)}</span>
          </div>
          <div className="detail-header-actions">
            {!isEditing && (
              <button className="edit-button" onClick={() => setIsEditing(true)}>
                ✏️ 수정
              </button>
            )}
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="detail-content">
          <h2 className="detail-title">기록</h2>
          <p className="detail-text">{entry.content}</p>
        </div>

        {/* AI 분석 결과 */}
        {entry.analysis && (
          <div className="detail-analysis">
            <div className="analysis-header">
              <h3 className="analysis-title">AI 분석</h3>
              {isEditing && (
                <div className="edit-actions">
                  <button className="cancel-edit-button" onClick={handleCancelEdit}>
                    취소
                  </button>
                  <button className="save-edit-button" onClick={handleSaveEdit}>
                    저장
                  </button>
                </div>
              )}
            </div>

            {/* 카테고리 */}
            <div className="analysis-section">
              <h4>카테고리</h4>
              {isEditing ? (
                <div className="category-edit-container">
                  <div className="category-edit-grid">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        className={`category-edit-button ${editedCategory === cat ? 'selected' : ''}`}
                        onClick={() => setEditedCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                    {!categories.includes(editedCategory) && (
                      <button
                        className="category-edit-button selected custom"
                        onClick={() => setIsAddingCategory(true)}
                      >
                        {editedCategory}
                      </button>
                    )}
                    <button
                      className="category-add-button"
                      onClick={() => setIsAddingCategory(true)}
                    >
                      + 직접 입력
                    </button>
                  </div>
                  {isAddingCategory && (
                    <div className="custom-category-input">
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        onKeyDown={handleCustomCategoryKeyDown}
                        placeholder="새 카테고리 이름 (Enter로 추가, Esc로 취소)"
                        autoFocus
                      />
                      <button onClick={handleAddCustomCategory}>추가</button>
                      <button onClick={() => {
                        setCustomCategory('');
                        setIsAddingCategory(false);
                      }}>취소</button>
                    </div>
                  )}
                </div>
              ) : (
                <span className={`category-badge category-${entry.analysis?.category || '일상'}`}>
                  {entry.analysis?.category || '일상'}
                </span>
              )}
            </div>

            {/* 키워드 */}
            {((isEditing && editedKeywords) || (!isEditing && entry.analysis.keywords && entry.analysis.keywords.length > 0)) && (
              <div className="analysis-section">
                <h4>키워드</h4>
                {isEditing ? (
                  <div className="keywords-edit-container">
                    <div className="keywords-grid">
                      {editedKeywords.map((keyword, idx) => (
                        <span key={idx} className="keyword-pill editable">
                          {keyword}
                          <button
                            className="remove-keyword-button"
                            onClick={() => handleRemoveKeyword(keyword)}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="add-keyword-input">
                      <input
                        type="text"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={handleKeywordKeyDown}
                        placeholder="새 키워드 입력 (Enter로 추가)"
                      />
                      <button onClick={handleAddKeyword}>추가</button>
                    </div>
                  </div>
                ) : (
                  <div className="keywords-grid">
                    {entry.analysis.keywords.map((keyword, idx) => (
                      <span key={idx} className="keyword-pill">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 감정 점수 */}
            {entry.analysis.emotionScore !== undefined && (
              <div className="analysis-section">
                <h4>감정 점수</h4>
                <div className="emotion-bar-container">
                  <div className="emotion-bar">
                    <div
                      className="emotion-bar-fill"
                      style={{
                        width: `${((entry.analysis.emotionScore + 1) / 2) * 100}%`,
                        backgroundColor: entry.analysis.emotionScore > 0.3
                          ? '#4CAF50'
                          : entry.analysis.emotionScore < -0.3
                          ? '#F44336'
                          : '#9E9E9E'
                      }}
                    />
                  </div>
                  <span className="emotion-score">
                    {entry.analysis.sentiment} ({entry.analysis.emotionScore.toFixed(2)})
                  </span>
                </div>
              </div>
            )}

            {/* 해석 */}
            {entry.analysis.interpretation && (
              <div className="analysis-section">
                <h4>분석</h4>
                <p className="interpretation-text">{entry.analysis.interpretation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EntryDetail;
