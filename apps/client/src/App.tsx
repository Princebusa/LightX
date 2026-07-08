import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Dashboard from "./pages/dashboard";
import ChatPage from "./pages/chat";




function App() {
  return (
    <BrowserRouter>

      <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat/:projectId" element={<ChatPage />} />
    

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
