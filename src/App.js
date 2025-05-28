import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ExcelProcessor from './excel-processing/ExcelProcessor';
import MultipleTriadRuns from './multiple-triad-runs/MultipleTriadRuns';
import SelectedItems from './pages/SelectedItems/SelectedItems';
import Summary from './pages/Summary/Summary';
import TiterAnalysis from './titer-analysis/TiterAnalysis';
import EntryDetails from './pages/EntryDetails/EntryDetails';
import UniProtSearch from './pages/UniProtSearch/UniProtSearch';

import './App.css';
/*
            
*/
function App() {
  return (
    <Router basename="/Base-Website">
      <div className="App">
        <nav className="app-nav">
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/excel-processor" className="nav-link">Excel Processor</Link>
            <Link to="/multiple-triad-runs" className="nav-link">Multiple Triad Runs</Link>
            <Link to="/summary" className="nav-link">Summary Report</Link>
            <Link to="/uniprot-search" className="nav-link">UniProt Search</Link>
            <Link to="/titer-analysis" className="nav-link">Titer Analysis</Link>
            <Link to="/comp-text" className="nav-link">CompText</Link>
          </div>
        </nav>
        <div className="main-content">
          <Routes>
            <Route path="/" element={<div></div>} />
            <Route path="/excel-processor" element={<ExcelProcessor />} />
            <Route path="/multiple-triad-runs" element={<MultipleTriadRuns />} />
            <Route path="/selected-items" element={<SelectedItems />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="/entry-details" element={<EntryDetails />} />
            <Route path="/uniprot-search" element={<UniProtSearch />} />
            <Route path="/titer-analysis" element={<TiterAnalysis />} />
            <Route
              path="/comp-text"
              element={
                <div style={{ width: '100%', height: '100vh' }}>
                  <iframe
                    src={process.env.PUBLIC_URL + '/comp-text/CompText.html'}
                    title="CompText"
                    width="100%"
                    height="100%"
                    style={{ border: 'none', minHeight: '800px' }}
                  />
                </div>
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
