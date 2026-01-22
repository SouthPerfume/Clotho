import { useState, useEffect } from 'react';
import './NewEntry.css';
import { analyzeEntry } from '../services/aiService';
import { saveEntry, getRecentEntries, deleteEntries } from '../services/entryService';
import EntryDetail from './EntryDetail';
import { clearUserEntries } from '../utils/clearData';

function NewEntry() {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [recentEntries, setRecentEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // 임시 사용자 ID (추후 Firebase Auth로 대체)
  const TEMP_USER_ID = 'temp_user_001';

  // 최근 기록 불러오기
  useEffect(() => {
    loadRecentEntries();
  }, []);

  const loadRecentEntries = async () => {
    try {
      setIsLoading(true);
      const entries = await getRecentEntries(TEMP_USER_ID, 3);
      setRecentEntries(entries);
    } catch (error) {
      console.error('Error loading recent entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      // 1. AI 분석
      console.log('AI 분석 중...');
      const analysis = await analyzeEntry(content);
      console.log('분석 결과:', analysis);

      // 2. Firebase에 저장
      console.log('저장 중...');
      const savedEntry = await saveEntry(TEMP_USER_ID, content, analysis);
      console.log('저장 완료:', savedEntry);

      // 3. UI 업데이트
      alert(`저장되었습니다!\n\n카테고리: ${analysis.category}\n감정: ${analysis.sentiment}\n키워드: ${analysis.keywords.join(', ')}`);
      setContent('');

      // 4. 최근 기록 새로고침
      await loadRecentEntries();
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('저장 중 오류가 발생했습니다.\n\n' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    // Cmd/Ctrl + Enter로 저장
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSave();
    }
  };

  const handleClearData = async () => {
    if (!confirm('정말 모든 기록을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const count = await clearUserEntries(TEMP_USER_ID);
      alert(`${count}개의 기록이 삭제되었습니다.`);
      await loadRecentEntries();
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
  };

  const toggleSelectEntry = (entryId) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      alert('삭제할 기록을 선택해주세요.');
      return;
    }

    if (!confirm(`${selectedIds.size}개의 기록을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteEntries(Array.from(selectedIds));
      alert(`${selectedIds.size}개의 기록이 삭제되었습니다.`);
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      await loadRecentEntries();
    } catch (error) {
      console.error('Error deleting entries:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEntryClick = (entry) => {
    if (isSelectionMode) {
      toggleSelectEntry(entry.id);
    } else {
      setSelectedEntry(entry);
    }
  };

  return (
    <div className="new-entry-page">
      <div className="new-entry-container">
        <header className="entry-header">
          <h1 className="entry-title">오늘의 기록</h1>
          <p className="entry-subtitle">
            자유롭게 적어보세요. AI가 자동으로 분석해드릴게요.
          </p>
          {/* 개발용 삭제 버튼 */}
          <button
            onClick={handleClearData}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            🗑️ 모든 기록 삭제 (개발용)
          </button>
        </header>

        <div className="entry-input-wrapper">
          <textarea
            className="entry-textarea"
            placeholder="무슨 일이 있었나요? 어떤 생각이 들었나요?
오늘 꿈은 어땠나요? 운동은 하셨나요?

자유롭게 줄글로 적어주세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            autoFocus
          />

          <div className="entry-footer">
            <div className="entry-info">
              <span className="char-count">
                {content.length}자
              </span>
              <span className="keyboard-hint">
                ⌘ + Enter로 저장
              </span>
            </div>

            <button
              className="save-button"
              onClick={handleSave}
              disabled={isSaving || !content.trim()}
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>

        {/* 최근 기록 미리보기 */}
        <section className="recent-entries-preview">
          <div className="section-header">
            <h2 className="section-title">최근 기록</h2>
            {recentEntries.length > 0 && (
              <div className="section-actions">
                <button
                  className={`selection-toggle-button ${isSelectionMode ? 'active' : ''}`}
                  onClick={toggleSelectionMode}
                >
                  {isSelectionMode ? '취소' : '선택'}
                </button>
                {isSelectionMode && (
                  <button
                    className="delete-selected-button"
                    onClick={handleDeleteSelected}
                    disabled={selectedIds.size === 0}
                  >
                    삭제 ({selectedIds.size})
                  </button>
                )}
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="empty-state">
              <p>불러오는 중...</p>
            </div>
          ) : recentEntries.length === 0 ? (
            <div className="empty-state">
              <p>아직 기록이 없습니다.</p>
              <p className="empty-state-hint">첫 번째 기록을 작성해보세요!</p>
            </div>
          ) : (
            <div className="recent-entries-list">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`entry-preview-card ${isSelectionMode ? 'selection-mode' : ''} ${selectedIds.has(entry.id) ? 'selected' : ''}`}
                  onClick={() => handleEntryClick(entry)}
                >
                  {isSelectionMode && (
                    <div className="entry-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(entry.id)}
                        onChange={() => toggleSelectEntry(entry.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  <div className="entry-preview-header">
                    <div className="category-badges">
                      {entry.analysis?.primaryCategory && (
                        <span className={`category-badge primary-badge`}>
                          {entry.analysis.primaryCategory}
                        </span>
                      )}
                      <span className={`category-badge sub-badge category-${entry.analysis?.subCategory || entry.analysis?.category || '일상'}`}>
                        {entry.analysis?.subCategory || entry.analysis?.category || '일상'}
                      </span>
                    </div>
                    <span className="entry-date">
                      {entry.timestamp?.toDate ?
                        new Date(entry.timestamp.toDate()).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }) :
                        '방금 전'
                      }
                    </span>
                  </div>
                  <p className="entry-preview-content">
                    {entry.content.substring(0, 100)}
                    {entry.content.length > 100 ? '...' : ''}
                  </p>
                  {entry.analysis?.keywords && (
                    <div className="entry-keywords">
                      {entry.analysis.keywords.map((keyword, idx) => (
                        <span key={idx} className="keyword-tag">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 상세 화면 모달 */}
      {selectedEntry && (
        <EntryDetail
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onUpdate={(updatedEntry) => {
            // 업데이트된 엔트리로 리스트 갱신
            setRecentEntries(prev =>
              prev.map(e => e.id === updatedEntry.id ? updatedEntry : e)
            );
            setSelectedEntry(updatedEntry);
          }}
        />
      )}
    </div>
  );
}

export default NewEntry;
