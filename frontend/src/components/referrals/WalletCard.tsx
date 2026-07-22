import { useEffect, useState, type FormEvent } from "react";
import { Wallet as WalletIcon, ArrowDownToLine, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { formatFcfa } from "@/lib/utils";
import { ApiError } from "@/api/client";
import {
  referralApi,
  MIN_WITHDRAWAL_AMOUNT,
  type Wallet,
  type Withdrawal,
  type WithdrawalMethod,
} from "@/api/referrals";

const METHOD_LABELS: Record<WithdrawalMethod, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  mtn: "MTN MoMo",
};

const STATUS_BADGE: Record<Withdrawal["status"], { label: string; variant: "warning" | "success" | "destructive" }> = {
  pending: { label: "En attente", variant: "warning" },
  paid: { label: "Payé", variant: "success" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

type Props = {
  /** Appelé après un retrait réussi pour rafraîchir les stats du parent. */
  onChange?: () => void;
};

export function WalletCard({ onChange }: Props) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<WithdrawalMethod>("wave");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function reload() {
    Promise.all([referralApi.getWallet(), referralApi.listWithdrawals()])
      .then(([w, list]) => {
        setWallet(w);
        setWithdrawals(list.withdrawals);
      })
      .catch(() => {});
  }

  useEffect(() => {
    reload();
  }, []);

  const balance = wallet?.balance ?? 0;
  const amountValue = Number(amount);
  const phoneValid = /^0\d{9}$/.test(phone);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!Number.isInteger(amountValue) || amountValue < MIN_WITHDRAWAL_AMOUNT) {
      setError(`Le retrait minimum est de ${formatFcfa(MIN_WITHDRAWAL_AMOUNT)}.`);
      return;
    }
    if (amountValue > balance) {
      setError("Montant supérieur à ta cagnotte.");
      return;
    }
    if (!phoneValid) {
      setError("Numéro invalide (10 chiffres, commence par 0).");
      return;
    }

    setSubmitting(true);
    try {
      await referralApi.createWithdrawal(amountValue, method, phone);
      setSuccess("Demande de retrait envoyée. Tu recevras ton argent sous peu.");
      setAmount("");
      setPhone("");
      reload();
      onChange?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors du retrait.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <WalletIcon className="size-5 text-primary" />
          Ma cagnotte
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Solde */}
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-primary/5 p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Solde disponible</p>
            <p className="text-3xl font-semibold text-primary">{formatFcfa(balance)}</p>
          </div>
          {wallet && (
            <p className="text-sm text-muted-foreground">
              Total gagné : <strong>{formatFcfa(wallet.totalEarned)}</strong>
            </p>
          )}
        </div>

        {/* Formulaire de retrait */}
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <p className="text-sm font-medium">Retirer en Mobile Money</p>

          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg bg-primary/10 p-2.5 text-sm text-primary">{success}</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wd-amount">Montant (FCFA)</Label>
              <Input
                id="wd-amount"
                type="number"
                inputMode="numeric"
                min={MIN_WITHDRAWAL_AMOUNT}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`min. ${MIN_WITHDRAWAL_AMOUNT}`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Opérateur</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as WithdrawalMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wave">Wave</SelectItem>
                  <SelectItem value="orange_money">Orange Money</SelectItem>
                  <SelectItem value="mtn">MTN MoMo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="wd-phone">Numéro Mobile Money</Label>
            <Input
              id="wd-phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="0700000000"
            />
          </div>

          <Button type="submit" disabled={submitting || balance < MIN_WITHDRAWAL_AMOUNT}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowDownToLine className="size-4" />
            )}
            <span className="ml-1.5">Demander le retrait</span>
          </Button>
          {balance < MIN_WITHDRAWAL_AMOUNT && (
            <p className="text-xs text-muted-foreground">
              Il te faut au moins {formatFcfa(MIN_WITHDRAWAL_AMOUNT)} pour retirer.
            </p>
          )}
        </form>

        {/* Historique */}
        {withdrawals.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Mes retraits</p>
            <ul className="flex flex-col gap-2">
              {withdrawals.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2 text-sm"
                >
                  <span>
                    <strong>{formatFcfa(w.amount)}</strong>
                    <span className="text-muted-foreground"> · {METHOD_LABELS[w.method]}</span>
                  </span>
                  <Badge variant={STATUS_BADGE[w.status].variant}>{STATUS_BADGE[w.status].label}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
