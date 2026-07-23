"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Plus,
  Loader2,
  Trash2,
  FileSpreadsheet,
} from "lucide-react";
import * as React from "react";

import { GlassCard } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

type Report = {
  id: string;
  org_id: string;
  branch_id: string | null;
  title: string;
  type: "reconciliation" | "variance" | "summary";
  status: "generating" | "ready" | "failed";
  file_type: "pdf" | "csv" | null;
  file_path: string | null;
  date_range_start: string | null;
  date_range_end: string | null;
  created_at: string;
  created_by: string;
};

type OrgInfo = {
  org_id: string;
  org_name: string;
  role: string;
};

export default function ReportsPage() {
  const [reports, setReports] = React.useState<Report[]>([]);
  const [orgs, setOrgs] = React.useState<OrgInfo[]>([]);
  const [selectedOrgId, setSelectedOrgId] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [showGenerate, setShowGenerate] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newType, setNewType] = React.useState<"reconciliation" | "variance" | "summary">("reconciliation");
  const [newBranchId, setNewBranchId] = React.useState("");
  const [branches, setBranches] = React.useState<{ id: string; name: string; org_id: string }[]>([]);

  React.useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch orgs
      const { data: memberships } = await supabase
        .from("org_members")
        .select("org_id, role, organizations(name)")
        .eq("user_id", user.id);

      if (memberships) {
        const orgInfo: OrgInfo[] = memberships.map((m) => {
          const org = m.organizations as unknown as { name: string };
          return {
            org_id: m.org_id,
            org_name: org?.name || "",
            role: m.role,
          };
        });
        setOrgs(orgInfo);
        if (orgInfo.length > 0 && !selectedOrgId) {
          setSelectedOrgId(orgInfo[0].org_id);
        }
      }

      // Fetch reports
      const res = await fetch("/api/reports");
      const data = await res.json();
      setReports(data.reports || []);

      // Fetch branches for the generate form
      const brRes = await fetch("/api/branches");
      const brData = await brRes.json();
      setBranches(brData.branches || []);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !selectedOrgId) return;

    setGenerating(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: selectedOrgId,
          branch_id: newBranchId || null,
          title: newTitle.trim(),
          type: newType,
        }),
      });

      if (res.ok) {
        setNewTitle("");
        setNewBranchId("");
        setShowGenerate(false);
        await loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to generate report");
      }
    } catch (err) {
      console.error("Generate report error:", err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(reportId: string) {
    if (!confirm("Delete this report?")) return;

    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      }
    } catch (err) {
      console.error("Delete report error:", err);
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "text-emerald-400";
      case "generating":
        return "text-amber-400";
      case "failed":
        return "text-aura-pink";
      default:
        return "text-aura-muted";
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "reconciliation":
        return "Reconciliation";
      case "variance":
        return "Variance";
      case "summary":
        return "Summary";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Reports
          </h1>
          <p className="mt-1 text-sm text-aura-muted">
            Generate and export reconciliation reports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {orgs.length > 1 && (
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white/[0.16]"
            >
              {orgs.map((o) => (
                <option key={o.org_id} value={o.org_id}>
                  {o.org_name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => setShowGenerate(!showGenerate)}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90"
          >
            <Plus className="h-4 w-4" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Generate form */}
      {showGenerate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <GlassCard padding="md">
            <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-aura-muted">
                  Report Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Weekly Reconciliation Summary"
                  required
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-aura-muted outline-none transition-colors focus:border-white/[0.16]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-aura-muted">
                  Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white/[0.16]"
                >
                  <option value="reconciliation">Reconciliation</option>
                  <option value="variance">Variance</option>
                  <option value="summary">Summary</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-aura-muted">
                  Branch (optional)
                </label>
                <select
                  value={newBranchId}
                  onChange={(e) => setNewBranchId(e.target.value)}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white/[0.16]"
                >
                  <option value="">All Branches</option>
                  {branches
                    .filter((b) => b.org_id === selectedOrgId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={generating}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                Generate
              </button>
            </form>
          </GlassCard>
        </motion.div>
      )}

      {/* Reports list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-aura-muted" />
        </div>
      ) : reports.length === 0 ? (
        <GlassCard padding="lg">
          <div className="flex flex-col items-center py-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-aura-muted" />
            <h3 className="text-lg font-medium text-white">No reports yet</h3>
            <p className="mt-2 max-w-sm text-sm text-aura-muted">
              Generate your first report from reconciliation data to export
              variance flags as CSV.
            </p>
            <button
              type="button"
              onClick={() => setShowGenerate(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90"
            >
              <Plus className="h-4 w-4" />
              Generate Report
            </button>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <GlassCard key={report.id} padding="sm">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-aura-pink">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {report.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-aura-muted">
                      <span>{typeLabel(report.type)}</span>
                      <span>·</span>
                      <span className={statusColor(report.status)}>
                        {report.status}
                      </span>
                      <span>·</span>
                      <span>
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                      {report.file_type && (
                        <>
                          <span>·</span>
                          <span className="uppercase">{report.file_type}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {report.status === "ready" && (
                    <a
                      href={`/api/reports/${report.id}/csv`}
                      download
                      className="rounded-md p-2 text-aura-muted transition-colors hover:bg-white/[0.04] hover:text-emerald-400"
                      aria-label="Download CSV"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(report.id)}
                    className="rounded-md p-2 text-aura-muted transition-colors hover:bg-white/[0.04] hover:text-aura-pink"
                    aria-label="Delete report"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
