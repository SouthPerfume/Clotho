import { useState } from 'react';
import NewEntry from './pages/NewEntry';
import Dashboard from './pages/Dashboard';
import './styles/global.css';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('entry');

  return (
    <div className="app">
      {/* 네비게이션 바 */}
      <nav className="main-nav">
        <button className="menu-button">
          <span className="menu-icon">☰</span>
        </button>

        <h1 className="app-logo">Clotho</h1>

        <div className="nav-buttons">
          <button
            className={`nav-button ${currentPage === 'entry' ? 'active' : ''}`}
            onClick={() => setCurrentPage('entry')}
          >
            <span className="nav-icon">📝</span>
          </button>
          <button
            className={`nav-button ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <span className="nav-icon">⊞</span>
          </button>
          <button className="nav-button">
            <span className="nav-icon">✎</span>
          </button>
        </div>
      </nav>

      {/* 페이지 콘텐츠 */}
      <main className="main-content">
        {currentPage === 'entry' && <NewEntry />}
        {currentPage === 'dashboard' && <Dashboard />}
      </main>
    </div>
  );
}

export default App;
