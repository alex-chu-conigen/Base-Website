import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ExcelProcessor from './excel-processing/ExcelProcessor';
import MultipleTriadRuns from './multiple-triad-runs/MultipleTriadRuns';
import SelectedItems from './pages/SelectedItems/SelectedItems';
import Summary from './pages/Summary/Summary';
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
            
            <Link to="/uniprot-search" className="nav-link">UniProt Search</Link>
          </div>
        </nav>
        <div className="main-content">
          <Routes>
            <Route path="/" element={
              <div ></div>
            } />
            <Route path="/excel-processor" element={<ExcelProcessor />} />
            <Route path="/multiple-triad-runs" element={<MultipleTriadRuns />} />
            <Route path="/selected-items" element={<SelectedItems />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="/entry-details" element={<EntryDetails />} />
            <Route path="/uniprot-search" element={<UniProtSearch />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
