
// pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/dashboard/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div className="dashboard">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your RFP automation system</p>
      </header>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats?.total_products || 0}</h3>
            <p>OEM Products</p>
          </div>
          <button onClick={() => navigate('/catalog')}>Manage →</button>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>{stats?.active_sessions || 0}</h3>
            <p>Active Sessions</p>
          </div>
          <button onClick={() => navigate('/chat')}>Chat →</button>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔬</div>
          <div className="stat-content">
            <h3>{stats?.test_types || 0}</h3>
            <p>Test Types</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats?.system_status || 'N/A'}</h3>
            <p>System Status</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <button 
            className="action-btn primary"
            onClick={() => navigate('/chat')}
          >
            <span className="icon">🚀</span>
            <div>
              <h3>Start New RFP</h3>
              <p>Scan and analyze RFPs</p>
            </div>
          </button>

          <button 
            className="action-btn secondary"
            onClick={() => navigate('/catalog')}
          >
            <span className="icon">➕</span>
            <div>
              <h3>Add Products</h3>
              <p>Update OEM catalog</p>
            </div>
          </button>

          <button className="action-btn tertiary">
            <span className="icon">📊</span>
            <div>
              <h3>View Reports</h3>
              <p>Analysis & insights</p>
            </div>
          </button>
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="getting-started">
        <h2>Getting Started</h2>
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <div>
              <h3>Upload OEM Catalog</h3>
              <p>Add your product datasheets to the catalog manager</p>
            </div>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <div>
              <h3>Initiate Chat</h3>
              <p>Start conversation with AI assistant to scan RFPs</p>
            </div>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <div>
              <h3>Review & Submit</h3>
              <p>Get automated RFP response with pricing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
