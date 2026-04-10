import { useState } from "react";
import { Layout } from "@/components/Layout";
import { User, Mail, Shield, Key, Clock, Edit2, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name ?? "Analyst");

  const handleSaveName = () => {
    if (!nameValue.trim()) return;
    setEditingName(false);
    toast({ title: "Profile updated", description: "Your display name has been saved." });
  };

  const handleCancelEdit = () => {
    setNameValue(user?.name ?? "Analyst");
    setEditingName(false);
  };

  const initials = (user?.name ?? "A")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto">

        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Profile</h2>
            <p className="text-sm text-muted-foreground">Your account details and preferences</p>
          </div>
        </div>

        {/* Avatar + name card */}
        <div className="glass-panel rounded-xl p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") handleCancelEdit(); }}
                  className="cyber-input text-sm flex-1"
                  autoFocus
                  data-testid="input-profile-name"
                />
                <button onClick={handleSaveName} className="p-1.5 rounded-md bg-primary/15 text-primary hover:bg-primary/25 transition-colors" data-testid="button-save-name">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleCancelEdit} className="p-1.5 rounded-md bg-muted/60 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-cancel-name">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">{nameValue}</h3>
                <button
                  onClick={() => setEditingName(true)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit name"
                  data-testid="button-edit-name"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">{user?.email ?? "—"}</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary shrink-0">
            Security Analyst
          </div>
        </div>

        {/* Account info */}
        <div className="glass-panel rounded-xl p-5 space-y-1">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Account Information</h3>
          <InfoRow icon={User} label="Display Name" value={nameValue} />
          <InfoRow icon={Mail} label="Email Address" value={user?.email ?? "—"} />
          <InfoRow icon={Shield} label="Role" value="Security Analyst" highlight />
          <InfoRow icon={Clock} label="Session" value="Active" highlight />
        </div>

        {/* Security */}
        <div className="glass-panel rounded-xl p-5 space-y-1">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Security</h3>
          <div className="flex items-center justify-between py-3 border-b border-border/30">
            <div className="flex items-center gap-3">
              <Key className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-foreground">Password</p>
                <p className="text-xs text-muted-foreground">Last changed: unknown</p>
              </div>
            </div>
            <button
              className="text-xs px-3 py-1.5 rounded-lg bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              data-testid="button-change-password"
              onClick={() => toast({ title: "Coming soon", description: "Password change will be available in a future update." })}
            >
              Change
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-foreground">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
              </div>
            </div>
            <button
              className="text-xs px-3 py-1.5 rounded-lg bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              data-testid="button-setup-2fa"
              onClick={() => toast({ title: "Coming soon", description: "2FA setup will be available in a future update." })}
            >
              Set up
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
};

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}

function InfoRow({ icon: Icon, label, value, highlight }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className={`text-sm font-medium ${highlight ? "text-primary" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

export default ProfilePage;
