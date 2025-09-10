import { Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ThemeBackground } from "./components/ThemeBackground";

export default function RootLayout() {
  return (
    <div className="antialiased h-full font-nunito">
      <AuthProvider>
        <ThemeProvider>
          <ThemeBackground>
            <Outlet />
          </ThemeBackground>
        </ThemeProvider>
      </AuthProvider>
    </div>
  );
}
