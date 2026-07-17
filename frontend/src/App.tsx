import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PrivateRoute } from "./routes/PrivateRoute";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Catalogue } from "./pages/Catalogue";
import { Marche } from "./pages/Marche";
import { Messagerie } from "./pages/Messagerie";
import { Commandes } from "./pages/Commandes";
import { Verification } from "./pages/Verification";
import { Abonnement } from "./pages/Abonnement";
import { AdminVerifications } from "./pages/admin/AdminVerifications";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/connexion" replace />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<Register />} />
          <Route
            path="/marche"
            element={
              <Layout>
                <Marche />
              </Layout>
            }
          />
          <Route
            path="/tableau-de-bord"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/catalogue"
            element={
              <PrivateRoute>
                <Catalogue />
              </PrivateRoute>
            }
          />
          <Route
            path="/messagerie"
            element={
              <PrivateRoute>
                <Messagerie />
              </PrivateRoute>
            }
          />
          <Route
            path="/commandes"
            element={
              <PrivateRoute>
                <Commandes />
              </PrivateRoute>
            }
          />
          <Route
            path="/verification"
            element={
              <PrivateRoute>
                <Verification />
              </PrivateRoute>
            }
          />
          <Route
            path="/abonnement"
            element={
              <PrivateRoute>
                <Abonnement />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/verifications"
            element={
              <PrivateRoute>
                <AdminVerifications />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
