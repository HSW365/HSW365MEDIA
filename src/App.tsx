import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import ServiceDetail from './pages/ServiceDetail';
import './index.css';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="services/:serviceId" element={<ServiceDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
