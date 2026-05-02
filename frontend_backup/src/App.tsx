import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Roadmap from './pages/Roadmap';
import Paths from './pages/Paths';
import CyberSkillRoad from './pages/CyberSkillRoad';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/paths" element={<Paths />} />
        <Route path="/cyber-road" element={<CyberSkillRoad />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
