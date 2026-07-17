import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PrivateRoute } from "./routes/PrivateRoute";
import { Layout } from "./components/Layout";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Catalogue } from "./pages/Catalogue";
import { Marche } from "./pages/Marche";
import { ProductDetail } from "./pages/ProductDetail";
import { Messagerie } from "./pages/Messagerie";
import { Commandes } from "./pages/Commandes";
import { Verification } from "./pages/Verification";
import { Abonnement } from "./pages/Abonnement";
import { AdminVerifications } from "./pages/admin/AdminVerifications";

function Home() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="empty-state">Chargement...</div>;
  if (user) return <Navigate to="/marche" replace />;
  return (
    <Layout>
      <Landing />
    </Layout>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
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
            path="/produit/:id"
            element={
              <Layout>
                <ProductDetail />
              </Layout>
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
            path="/messagerie/:conversationId"
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
