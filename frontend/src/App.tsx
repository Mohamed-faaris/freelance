    x   x   import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Layout from "./layout";
import Dashboard from "./Dashboard";
import LoginPage from "./pages/login/page";
import RegisterPage from "./pages/register/page";
import HelpPage from "./pages/help/page";
import PrivacyPage from "./pages/privacy/page";
import TermsPage from "./pages/terms/page";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
