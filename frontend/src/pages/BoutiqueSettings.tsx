import { useEffect, useState } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { boutiqueApi, type BoutiqueInfo } from "@/api/boutique";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { usePageTitle } from "@/hooks/usePageTitle";

export function BoutiqueSettings() {
  usePageTitle("Ma boutique");
  const { user } = useAuth();
  const [boutique, setBoutique] = useState<BoutiqueInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [storeLogoUrl, setStoreLogoUrl] = useState("");
  const [storeBannerUrl, setStoreBannerUrl] = useState("");

  useEffect(() => {
    boutiqueApi
      .get()
      .then((res) => {
        setBoutique(res.boutique);
        setStoreName(res.boutique.storeName ?? "");
        setStoreDescription(res.boutique.storeDescription ?? "");
        setStoreLogoUrl(res.boutique.storeLogoUrl ?? "");
        setStoreBannerUrl(res.boutique.storeBannerUrl ?? "");
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await boutiqueApi.update({
        storeName: storeName || undefined,
        storeDescription: storeDescription || undefined,
        storeLogoUrl: storeLogoUrl || null,
        storeBannerUrl: storeBannerUrl || null,
      });
      setBoutique(res.boutique);
      toast.success("Boutique mise à jour");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  }

  const isPro = user?.accountType === "vendeur" && boutique?.canCustomize;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold md:text-4xl">Ma boutique</h1>
          {isPro && (
            <Badge variant="ink" className="gap-1">
              <Sparkles className="size-3" /> Pro
            </Badge>
          )}
        </div>
        <p className="mt-1 text-muted-foreground">
          {isPro
            ? "Personnalise l'apparence de ta boutique visible par les acheteurs."
            : "La boutique personnalisable est réservée aux vendeurs Pro."}
        </p>
      </header>

      {isLoading ? (
        <div className="grid min-h-[20vh] place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : !isPro ? (
        <Card>
          <CardHeader>
            <CardTitle>Passe au palier Pro</CardTitle>
            <CardDescription>
              La boutique personnalisable est un avantage exclusif du palier Pro.
              Tu pourras y ajouter un nom, une description, un logo et une bannière
              pour donner une identité à ta page vendeur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/abonnement">
                <Sparkles className="size-4" /> Voir les paliers
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Aperçu */}
          {boutique?.storeName && (
            <Card>
              <CardHeader>
                <CardTitle>Aperçu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
                  {boutique.storeBannerUrl && (
                    <div className="-mx-5 -mt-5 h-32 overflow-hidden rounded-t-2xl">
                      <img
                        src={boutique.storeBannerUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    {boutique.storeLogoUrl ? (
                      <div className="size-12 shrink-0 overflow-hidden rounded-xl border">
                        <img
                          src={boutique.storeLogoUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-ink text-lg font-bold text-brand-300">
                        {boutique.storeName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{boutique.storeName}</p>
                      {boutique.storeDescription && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {boutique.storeDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Formulaire */}
          <Card>
            <CardHeader>
              <CardTitle>Paramètres</CardTitle>
              <CardDescription>
                Ces informations apparaîtront sur ta page vendeur.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="store-name">Nom de la boutique</Label>
                <Input
                  id="store-name"
                  placeholder="Ma boutique Djassa"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="store-desc">Description</Label>
                <Textarea
                  id="store-desc"
                  placeholder="Décris ta boutique en quelques phrases…"
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  maxLength={2000}
                  rows={4}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="store-logo">URL du logo</Label>
                <Input
                  id="store-logo"
                  placeholder="https://…"
                  type="url"
                  value={storeLogoUrl}
                  onChange={(e) => setStoreLogoUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Logo carré, idéalement 200×200 px. Visible sur ta page vendeur.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="store-banner">URL de la bannière</Label>
                <Input
                  id="store-banner"
                  placeholder="https://…"
                  type="url"
                  value={storeBannerUrl}
                  onChange={(e) => setStoreBannerUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Bannière large, idéalement 1200×400 px. Visible en haut de ta page vendeur.
                </p>
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-fit">
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Sauvegarde…
                  </>
                ) : (
                  <>
                    <Check className="size-4" /> Enregistrer
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
