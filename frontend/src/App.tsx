import { useEffect, lazy, Suspense, type ReactElement } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ScrollToTop } from "./components/ScrollToTop";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PrivateRoute } from "./routes/PrivateRoute";
import { AdminRoute } from "./routes/AdminRoute";
import { VendorBlockedRoute } from "./routes/VendorBlockedRoute";
import { VendorRoute } from "./routes/VendorRoute";
import { Layout } from "./components/Layout";
import { LaunchGate } from "./components/LaunchGate";
import { Waitlist } from "./pages/Waitlist";
import { initAnalytics, trackPageview, setAnalyticsAuthToken } from "./lib/analytics";
// Pages publiques : chargées immédiatement (premier rendu + indexation SEO).
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { RegisterVendeur } from "./pages/RegisterVendeur";
import { LandingVendeur } from "./pages/LandingVendeur";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Marche } from "./pages/Marche";
import { ProductDetail } from "./pages/ProductDetail";
import { VendeurProfil } from "./pages/VendeurProfil";
import { CommentCaMarche } from "./pages/CommentCaMarche";
import { APropos } from "./pages/APropos";
import { Contact } from "./pages/Contact";
import { FAQ } from "./pages/FAQ";
import { CGU } from "./pages/CGU";
import { Confidentialite } from "./pages/Confidentialite";
import { MentionsLegales } from "./pages/MentionsLegales";
import { NotFound } from "./pages/NotFound";
// Pages authentifiées : chargées à la demande pour garder le bundle initial léger.
const Catalogue = lazy(() => import("./pages/Catalogue").then((m) => ({ default: m.Catalogue })));
const Panier = lazy(() => import("./pages/Panier").then((m) => ({ default: m.Panier })));
const Checkout = lazy(() => import("./pages/Checkout").then((m) => ({ default: m.Checkout })));
const Paiement = lazy(() => import("./pages/Paiement").then((m) => ({ default: m.Paiement })));
const Messagerie = lazy(() => import("./pages/Messagerie").then((m) => ({ default: m.Messagerie })));
const Commandes = lazy(() => import("./pages/Commandes").then((m) => ({ default: m.Commandes })));
const Verification = lazy(() => import("./pages/Verification").then((m) => ({ default: m.Verification })));
const Abonnement = lazy(() => import("./pages/Abonnement").then((m) => ({ default: m.Abonnement })));
const BoutiqueSettings = lazy(() => import("./pages/BoutiqueSettings").then((m) => ({ default: m.BoutiqueSettings })));
const VendeurDashboard = lazy(() => import("./pages/vendeur/VendeurDashboard").then((m) => ({ default: m.VendeurDashboard })));
const VendeurRecherche = lazy(() => import("./pages/vendeur/VendeurRecherche").then((m) => ({ default: m.VendeurRecherche })));
const AdminVerifications = lazy(() => import("./pages/admin/AdminVerifications").then((m) => ({ default: m.AdminVerifications })));
const AdminWaitlist = lazy(() => import("./pages/admin/AdminWaitlist").then((m) => ({ default: m.AdminWaitlist })));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview").then((m) => ({ default: m.AdminOverview })));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics").then((m) => ({ default: m.AdminAnalytics })));
const AdminDisputes = lazy(() => import("./pages/admin/AdminDisputes").then((m) => ({ default: m.AdminDisputes })));
const AdminReports = lazy(() => import("./pages/admin/AdminReports").then((m) => ({ default: m.AdminReports })));
const AdminEmails = lazy(() => import("./pages/admin/AdminEmails").then((m) => ({ default: m.AdminEmails })));
const Parrainage = lazy(() => import("./pages/Parrainage").then((m) => ({ default: m.Parrainage })));

function RouteFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="size-8 animate-spin rounded-full border-[3px] border-secondary border-t-primary" />
    </div>
  );
}

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
  if (user?.accountType === "vendeur") return <Navigate to="/vendeur/dashboard" replace />;
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

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageview(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}

function AnalyticsAuthSync() {
  const { accessToken } = useAuth();
  useEffect(() => {
    setAnalyticsAuthToken(accessToken);
  }, [accessToken]);
  return null;
}

export function App() {
  useEffect(() => {
    return initAnalytics();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
        <ScrollToTop />
        <PageTracker />
        <AnalyticsAuthSync />
        <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
        <LaunchGate>
        <Routes>
          <Route path="/liste-attente" element={<Waitlist />} />
          <Route path="/" element={<Home />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<Register />} />
          <Route path="/inscription-vendeur" element={<RegisterVendeur />} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
          <Route path="/reinitialiser-mot-de-passe/:token" element={<ResetPassword />} />
          <Route path="/vendre" element={<Layout contained={false}><LandingVendeur /></Layout>} />
          <Route
            path="/marche"
            element={
              <VendorBlockedRoute>
                <Marche />
              </VendorBlockedRoute>
            }
          />
          <Route path="/produit/:id" element={withLayout(<ProductDetail />)} />
          <Route path="/vendeur/:id" element={withLayout(<VendeurProfil />)} />
          <Route
            path="/panier"
            element={
              <VendorBlockedRoute>
                <Panier />
              </VendorBlockedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <VendorBlockedRoute>
                <Checkout />
              </VendorBlockedRoute>
            }
          />
          <Route
            path="/paiement/:reference"
            element={
              <VendorBlockedRoute>
                <Paiement />
              </VendorBlockedRoute>
            }
          />
          <Route path="/comment-ca-marche" element={withLayout(<CommentCaMarche />)} />
          <Route path="/a-propos" element={withLayout(<APropos />)} />
          <Route path="/contact" element={withLayout(<Contact />)} />
          <Route path="/faq" element={withLayout(<FAQ />)} />
          <Route path="/cgu" element={withLayout(<CGU />)} />
          <Route path="/politique-de-confidentialite" element={withLayout(<Confidentialite />)} />
          <Route path="/mentions-legales" element={withLayout(<MentionsLegales />)} />
          <Route path="/parrainage" element={withLayout(<Parrainage />)} />
          <Route
            path="/catalogue"
            element={
              <VendorRoute>
                <Catalogue />
              </VendorRoute>
            }
          />
          <Route
            path="/vendeur/dashboard"
            element={
              <VendorRoute>
                <VendeurDashboard />
              </VendorRoute>
            }
          />
          <Route
            path="/vendeur/recherche"
            element={
              <VendorRoute>
                <VendeurRecherche />
              </VendorRoute>
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
            path="/boutique"
            element={
              <VendorRoute>
                <BoutiqueSettings />
              </VendorRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminOverview />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <AdminRoute>
                <AdminAnalytics />
              </AdminRoute>
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
          <Route
            path="/admin/liste-attente"
            element={
              <AdminRoute>
                <AdminWaitlist />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/litiges"
            element={
              <AdminRoute>
                <AdminDisputes />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/signalements"
            element={
              <AdminRoute>
                <AdminReports />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/emails"
            element={
              <AdminRoute>
                <AdminEmails />
              </AdminRoute>
            }
          />
          <Route path="*" element={withLayout(<NotFound />)} />
        </Routes>
        </LaunchGate>
        </Suspense>
        </ErrorBoundary>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
