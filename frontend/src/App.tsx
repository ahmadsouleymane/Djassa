import { useEffect, type ReactElement } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ScrollToTop } from "./components/ScrollToTop";
import { PrivateRoute } from "./routes/PrivateRoute";
import { AdminRoute } from "./routes/AdminRoute";
import { Layout } from "./components/Layout";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { RegisterVendeur } from "./pages/RegisterVendeur";
import { LandingVendeur } from "./pages/LandingVendeur";
import { Catalogue } from "./pages/Catalogue";
import { Marche } from "./pages/Marche";
import { ProductDetail } from "./pages/ProductDetail";
import { Messagerie } from "./pages/Messagerie";
import { Commandes } from "./pages/Commandes";
import { Verification } from "./pages/Verification";
import { Abonnement } from "./pages/Abonnement";
import { AdminVerifications } from "./pages/admin/AdminVerifications";
import { CommentCaMarche } from "./pages/CommentCaMarche";
import { APropos } from "./pages/APropos";
import { Contact } from "./pages/Contact";
import { FAQ } from "./pages/FAQ";
import { CGU } from "./pages/CGU";
import { Confidentialite } from "./pages/Confidentialite";
import { MentionsLegales } from "./pages/MentionsLegales";
import { VendeurProfil } from "./pages/VendeurProfil";
import { Panier } from "./pages/Panier";
import { Checkout } from "./pages/Checkout";
import { Paiement } from "./pages/Paiement";
import { NotFound } from "./pages/NotFound";

function Home() {
  const { user, isLoading } = useAuth();
  // First visit → show the buyer Landing. Returning visitors go straight to the
  // Marché (products). The flag is set once the Landing is actually shown.
  const seenLanding =
    typeof window !== "undefined" && localStorage.getItem("djassa_seen_landing") === "1";

  useEffect(() => {
    if (!user && !isLoading) localStorage.setItem("djassa_seen_landing", "1");
  }, [user, isLoading]);

  if (isLoading)
    return (
      <div className="grid min-h-[100dvh] place-items-center">
        <div className="size-8 animate-spin rounded-full border-[3px] border-secondary border-t-primary" />
      </div>
    );
  if (user || seenLanding) return <Navigate to="/marche" replace />;
  return (
    <Layout contained={false}>
      <Landing />
    </Layout>
  );
}

function withLayout(element: ReactElement) {
  return <Layout>{element}</Layout>;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<Register />} />
          <Route path="/inscription-vendeur" element={<RegisterVendeur />} />
          <Route path="/vendre" element={<Layout contained={false}><LandingVendeur /></Layout>} />
          <Route path="/marche" element={withLayout(<Marche />)} />
          <Route path="/produit/:id" element={withLayout(<ProductDetail />)} />
          <Route path="/vendeur/:id" element={withLayout(<VendeurProfil />)} />
          <Route path="/panier" element={withLayout(<Panier />)} />
          <Route
            path="/checkout"
            element={
              <PrivateRoute>
                <Checkout />
              </PrivateRoute>
            }
          />
          <Route
            path="/paiement/:reference"
            element={
              <PrivateRoute>
                <Paiement />
              </PrivateRoute>
            }
          />
          <Route path="/comment-ca-marche" element={withLayout(<CommentCaMarche />)} />
          <Route path="/a-propos" element={withLayout(<APropos />)} />
          <Route path="/contact" element={withLayout(<Contact />)} />
          <Route path="/faq" element={withLayout(<FAQ />)} />
          <Route path="/cgu" element={withLayout(<CGU />)} />
          <Route path="/politique-de-confidentialite" element={withLayout(<Confidentialite />)} />
          <Route path="/mentions-legales" element={withLayout(<MentionsLegales />)} />
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
              <AdminRoute>
                <AdminVerifications />
              </AdminRoute>
            }
          />
          <Route path="*" element={withLayout(<NotFound />)} />
        </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
