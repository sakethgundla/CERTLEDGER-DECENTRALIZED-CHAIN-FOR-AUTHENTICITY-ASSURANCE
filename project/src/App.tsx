import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import InstitutePortal from './pages/InstitutePortal';
import StudentPortal from './pages/StudentPortal';
import VerifyPortal from './pages/VerifyPortal';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/institute" element={<InstitutePortal />} />
          <Route path="/student" element={<StudentPortal />} />
          <Route path="/verify" element={<VerifyPortal />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;