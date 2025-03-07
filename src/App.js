import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ExcelProcessor from './Excel-Processing/ExcelProcessor';
import './App.css';

function App() {
  return (
    <Router basename="/Base-Website">
      <div className="App">
        <Routes>
          <Route path="/" element={
            <div className="homepage">
              <h1>Welcome to the Homepage</h1>
              <div className="button-container">
                <Link to="/excel-processor">
                  <button className="nav-button">Go to Excel Processor</button>
                </Link>
                <a 
                  href="https://reactjs.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <button className="nav-button">Visit External Site</button>
                </a>
              </div>
            </div>
          } />
          <Route path="/excel-processor" element={<ExcelProcessor />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
