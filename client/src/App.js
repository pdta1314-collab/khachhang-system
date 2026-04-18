import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import CustomerForm from './pages/CustomerForm';
import VideoDownload from './pages/VideoDownload';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<CustomerForm />} />
            <Route path="/video/:uniqueId" element={<VideoDownload />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;
