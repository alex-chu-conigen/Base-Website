import React, { useState } from 'react';
import QuickbaseReport from '../components/QuickbaseReport';
import { quickbaseService } from '../services/quickbaseService';
import './MultipleTriadRuns.css';

function MultipleTriadRuns() {
  const [currentUser, setCurrentUser] = useState(quickbaseService.getCurrentUser());

  const handleUserChange = (user) => {
    if (quickbaseService.setCurrentUser(user)) {
      setCurrentUser(user);
    }
  };

  return (
    <div className="multiple-triad-runs">
      <div className="user-selection">
        <button 
          className={`user-button ${currentUser === 'user1' ? 'active' : ''}`}
          onClick={() => handleUserChange('user1')}
        >
          User 1
        </button>
        <button 
          className={`user-button ${currentUser === 'user2' ? 'active' : ''}`}
          onClick={() => handleUserChange('user2')}
        >
          User 2
        </button>
        <button 
          className={`user-button ${currentUser === 'user3' ? 'active' : ''}`}
          onClick={() => handleUserChange('user3')}
        >
          User 3
        </button>
      </div>
      <div className="content">
        <div className="report-section">
          <QuickbaseReport key={currentUser} />
        </div>
      </div>
    </div>
  );
}

export default MultipleTriadRuns; 