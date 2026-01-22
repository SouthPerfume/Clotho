import { useState } from 'react';
import './Dashboard.css';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('self-understanding');

  const tabs = [
    { id: 'self-understanding', label: '자기이해', icon: '🧠' },
    { id: 'habits', label: '습관', icon: '✅' },
    { id: 'goals', label: '목표', icon: '🎯' },
    { id: 'relationships', label: '관계', icon: '👥' }
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1 className="dashboard-title">대시보드</h1>
          <p className="dashboard-subtitle">
            나의 성장을 한눈에 확인하세요
          </p>
        </header>

        {/* 탭 네비게이션 */}
        <div className="dashboard-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`dashboard-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 영역 (위젯이 들어갈 곳) */}
        <div className="dashboard-content">
          {activeTab === 'self-understanding' && (
            <div className="tab-content">
              <div className="widget-placeholder">
                <p>🧠 자기이해 위젯 영역</p>
              </div>
            </div>
          )}

          {activeTab === 'habits' && (
            <div className="tab-content">
              <div className="widget-placeholder">
                <p>✅ 습관 위젯 영역</p>
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="tab-content">
              <div className="widget-placeholder">
                <p>🎯 목표 위젯 영역</p>
              </div>
            </div>
          )}

          {activeTab === 'relationships' && (
            <div className="tab-content">
              <div className="widget-placeholder">
                <p>👥 관계 위젯 영역</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
