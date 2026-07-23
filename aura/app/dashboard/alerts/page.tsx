"use client";

import { motion } from "framer-motion";
import {
  Bell,
  BellOff,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import * as React from "react";

import { GlassCard } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

type Alert = {
  id: string;
  org_id: string;
  branch_id: string | null;
  name: string;
  description: string | null;
  rule_conditions: Record<string, unknown>;
  enabled: boolean;
  last_fired_at: string | null;
  created_at: string;
};

type AlertHistoryItem = {
  id: string;
  alert_id: string;
  fired_at: string;
  details: Record<string, unknown> | null;
};

export default function AlertsPage() {
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [history, setHistory] = React.useState<AlertHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  const [newConditionType, setNewConditionType] = React.useState("late_checkin");
  const [newThreshold, setNewThreshold] = React.useState("10");
  const [orgs, setOrgs] = React.useState<{ org_id: string; org_name: string }[]>([]);
  const [selectedOrgId, setSelectedOrgId] = React.useState("");
  const [createLoading, setCreateLoading] = React.useState(false);
  const [tab, setTab] = React.useState<"rules" | "history">("rules");

  React.useEffect(() => {
    loadAlerts();
    loadOrgs();
  }, []);

  async function loadOrgs() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberships } = await (supabase
        .from("org_members")
        .select("org_id, organizations(name)")
        .eq("user_id", user.id) as any);

      if (memberships) {
        const orgList = memberships.map((m: any) => {
          const org = m.organizations as { name: string };
          return { org_id: m.org_id, org_name: org?.name || "" };
        });
        setOrgs(orgList);
        if (orgList.length > 0 && !selectedOrgId) {
          setSelectedOrgId(orgList[0].org_id);
        }
      }
    } catch {}
  }

  async function loadAlerts() {
    try {
      const [alertsRes, historyRes] = await Promise.all([
        fetch("/api/alerts"),
        fetch("/api/alerts/history"),
      ]);

      const alertsData = await alertsRes.json();
      const historyData = await historyRes.json();

      setAlerts(alertsData.alerts || []);
      setHistory(historyData.history || []);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreateLoading(true);
    try {
      if (!selectedOrgId) {
        alert("Please select an organization");
        return;
      }

      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: selectedOrgId,
          name: newName.trim(),
          description: newDesc.trim() || null,
          rule_conditions: {
            variance_type: newConditionType,
            threshold_percent: parseFloat(newThreshold),
          },
        }),
      });

      if (res.ok) {
        setNewName("");
        setNewDesc("");
        setShowCreate(false);
        await loadAlerts();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create alert");
      }
    } catch (err) {
      console.error("Create alert error:", err);
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleToggle(alert: Alert) {
    try {
      await fetch(`/api/alerts/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !alert.enabled }),
      });
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alert.id ? { ...a, enabled: !a.enabled } : a,
        ),
      );
    } catch (err) {
      console.error("Toggle alert error:", err);
    }
  }

  async function handleDelete(alertId: string) {
    if (!confirm("Delete this alert rule?")) return;

    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }
    } catch (err) {
      console.error("Delete alert error:", err);
    }
  }

  const varianceLabels: Record<string, string> = {
    late_checkin: "Late Check-In",
    early_checkout: "Early Check-Out",
    missed_shift: "Missed Shift",
    duplicate_punch: "Duplicate Punch",
    unscheduled_attendance: "Unscheduled Attendance",
  };

  const firingCount = history.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Alerts
          </h1>
          <p className="mt-1 text-sm text-aura-muted">
            Create alert rules to get notified when reconciliation flags match
            specific conditions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90"
        >
          <Plus className="h-4 w-4" />
          New Alert Rule
        </button>
      </div>

      {/* Firing count banner */}
      {firingCount > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <span className="font-medium">{firingCount}</span> alert{firingCount !== 1 ? "s" : ""} have fired. Review the history tab for details.
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <GlassCard padding="md">
            <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-aura-muted">
                  Rule Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. High Late Check-in Alert"
                  required
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-aura-muted outline-none transition-colors focus:border-white/[0.16]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-aura-muted">
                  Condition
                </label>
                <select
                  value={newConditionType}
                  onChange={(e) => setNewConditionType(e.target.value)}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white/[0.16]"
                >
                  {Object.entries(varianceLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-aura-muted">
                  Threshold %
                </label>
                <input
                  type="number"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  min={1}
                  max={100}
                  className="w-20 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white/[0.16]"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-aura-muted">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. Notify when staff check in 10+ min late"
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-aura-muted outline-none transition-colors focus:border-white/[0.16]"
                />
              </div>
              <button
                type="submit"
                disabled={createLoading}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
              >
                {createLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                Create
              </button>
            </form>
          </GlassCard>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="inline-flex rounded-full border border-white/[0.06] bg-white/[0.02] p-0.5 text-[11px]">
        <button
          className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
            tab === "rules"
              ? "bg-white text-black"
              : "text-white/60 hover:text-white"
          }`}
          onClick={() => setTab("rules")}
        >
          Rules ({alerts.length})
        </button>
        <button
          className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
            tab === "history"
              ? "bg-white text-black"
              : "text-white/60 hover:text-white"
          }`}
          onClick={() => setTab("history")}
        >
          History ({firingCount})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-aura-muted" />
        </div>
      ) : tab === "rules" ? (
        alerts.length === 0 ? (
          <GlassCard padding="lg">
            <div className="flex flex-col items-center py-12 text-center">
              <Bell className="mb-4 h-12 w-12 text-aura-muted" />
              <h3 className="text-lg font-medium text-white">
                No alert rules
              </h3>
              <p className="mt-2 max-w-sm text-sm text-aura-muted">
                Create alert rules to monitor specific variance types and get
                notified when thresholds are exceeded.
              </p>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90"
              >
                <Plus className="h-4 w-4" />
                New Alert Rule
              </button>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const conditions = alert.rule_conditions as Record<string, any>;
              return (
                <GlassCard key={alert.id} padding="sm">
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                          alert.enabled
                            ? "border-white/[0.06] bg-white/[0.02] text-amber-400"
                            : "border-white/[0.04] bg-white/[0.01] text-aura-muted"
                        }`}
                      >
                        {alert.enabled ? (
                          <Bell className="h-4 w-4" />
                        ) : (
                          <BellOff className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {alert.name}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-aura-muted">
                          {conditions.variance_type && (
                            <span>
                              {varianceLabels[conditions.variance_type] ||
                                conditions.variance_type}
                            </span>
                          )}
                          {conditions.threshold_percent && (
                            <>
                              <span>·</span>
                              <span>{conditions.threshold_percent}% threshold</span>
                            </>
                          )}
                          {alert.last_fired_at && (
                            <>
                              <span>·</span>
                              <span>
                                Last fired{" "}
                                {new Date(
                                  alert.last_fired_at,
                                ).toLocaleDateString()}
                              </span>
                            </>
                          )}
                          {!alert.enabled && (
                            <>
                              <span>·</span>
                              <span className="text-aura-muted">Disabled</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggle(alert)}
                        className="rounded-md p-2 text-aura-muted transition-colors hover:bg-white/[0.04] hover:text-white"
                        aria-label={alert.enabled ? "Disable" : "Enable"}
                      >
                        {alert.enabled ? (
                          <BellOff className="h-4 w-4" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(alert.id)}
                        className="rounded-md p-2 text-aura-muted transition-colors hover:bg-white/[0.04] hover:text-aura-pink"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )
      ) : (
        /* History tab */
        history.length === 0 ? (
          <GlassCard padding="lg">
            <div className="flex flex-col items-center py-12 text-center">
              <Clock className="mb-4 h-12 w-12 text-aura-muted" />
              <h3 className="text-lg font-medium text-white">
                No firing history
              </h3>
              <p className="mt-2 text-sm text-aura-muted">
                Alert rules that have triggered will appear here.
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {history.map((item) => {
              const details = item.details as Record<string, any> | null;
              return (
                <GlassCard key={item.id} padding="sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white">
                        Alert fired
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-aura-muted">
                        <span>
                          {new Date(item.fired_at).toLocaleString()}
                        </span>
                        {details?.variance_type && (
                          <>
                            <span>·</span>
                            <span>
                              Type: {varianceLabels[details.variance_type] || details.variance_type}
                            </span>
                          </>
                        )}
                        {details?.severity && (
                          <>
                            <span>·</span>
                            <span>Severity: {details.severity}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
