import { Routes, Route } from "react-router-dom";
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Explorer from './pages/Explorer';
import Profile from './pages/Profile';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Feed />} />
      <Route path="/explorar" element={<Explorer />} />
      <Route path="/perfil" element={<Profile />} />
      
    </Routes>
  );
}

export default App;