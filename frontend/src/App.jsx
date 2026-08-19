import { Routes, Route } from "react-router-dom";
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Explorer from './pages/Explorer';
import Profile from './pages/Profile';
import TestSolicitudes from './pages/TestSolicitudes';
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPassword from './pages/ForgotPassword';
import AccountSettings from './pages/AccountSettings';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/recuperar" element={<ForgotPassword />} />
      <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
      <Route path="/explorar" element={<ProtectedRoute><Explorer /></ProtectedRoute>} />
      <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/perfil/:uid" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/configuracion" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
      <Route path="/test-solicitudes" element={<ProtectedRoute><TestSolicitudes /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
