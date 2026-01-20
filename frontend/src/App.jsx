
// App.jsx - Main Application Component
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CatalogManager from './pages/CatalogManager';
import ChatInterface from './pages/ChatInterface';
import RFPWorkflow from './pages/RFPWorkflow';
import './App.css';

function App() {
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    // Check system health on mount
    fetch('http://localhost:8000/health')
      .then(res => res.json())
      .then(data => setSystemStatus(data))
      .catch(err => console.error('Health check failed:', err));
  }, []);

  return (
    <Router>
      <div className="app">
        {/* Sidebar Navigation */}
        <aside className="sidebar">
          <div className="logo">
            <h2>🤖 RFP Assistant</h2>
            <p className="tagline">AI-Powered B2B Automation</p>
          </div>

          <nav className="nav-menu">
            <Link to="/" className="nav-item">
              <span className="icon">📊</span>
              Dashboard
            </Link>
            <Link to="/catalog" className="nav-item">
              <span className="icon">📦</span>
              OEM Catalog
            </Link>
            <Link to="/chat" className="nav-item">
              <span className="icon">💬</span>
              Chat Assistant
            </Link>
            <Link to="/workflow" className="nav-item">
              <span className="icon">⚙️</span>
              RFP Workflow
            </Link>
          </nav>

          {systemStatus && (
            <div className="system-status">
              <div className="status-indicator">
                <span className={`dot ${systemStatus.status === 'healthy' ? 'green' : 'red'}`}></span>
                <span>System {systemStatus.status}</span>
              </div>
              <div className="status-details">
                <p>Catalog: {systemStatus.catalog_items} items</p>
                <p>Tests: {systemStatus.test_types} types</p>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/catalog" element={<CatalogManager />} />
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/workflow" element={<RFPWorkflow />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
