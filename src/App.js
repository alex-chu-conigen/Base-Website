import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ExcelProcessor from './excel-processing/ExcelProcessor';
import MultipleTriadRuns from './multiple-triad-runs/MultipleTriadRuns';
import SelectedItems from './pages/SelectedItems/SelectedItems';
import Summary from './pages/Summary/Summary';
import TiterAnalysis from './titer-analysis/TiterAnalysis';
import EntryDetails from './pages/EntryDetails/EntryDetails';
import UniProtSearch from './pages/UniProtSearch/UniProtSearch';
import SequenceScoring from './sequence-scoring/SequenceScoring';
import CompoundDR from './compound-dr/CompoundDR';
import SnakeplotPage from './snakeplot/SnakeplotPage';

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
            <Link to="/uniprot-search" className="nav-link">UniProt Search</Link>
            <Link to="/titer-analysis" className="nav-link">Titer Analysis</Link>
            <Link to="/sequence-scoring" className="nav-link">Sequence Scoring</Link>
            <Link to="/snakeplot" className="nav-link">Snakeplot</Link>
            <Link to="/compound-dr" className="nav-link">Bradley test</Link>



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
            <Route path="/sequence-scoring" element={<SequenceScoring />} />
            <Route path="/snakeplot" element={<SnakeplotPage />} />
            <Route path="/compound-dr" element={<CompoundDR />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
