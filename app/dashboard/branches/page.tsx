"use client";

import { motion } from "framer-motion";
import {
  Building2,
  FileUp,
  CalendarPlus,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import * as React from "react";

import { GlassCard } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

type Branch = {
  id: string;
  org_id: string;
  name: string;
  region: string | null;
};

type OrgInfo = {
  org_id: string;
  org_name: string;
  role: string;
};



export default function BranchesPage() {
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [orgs, setOrgs] = React.useState<OrgInfo[]>([]);
  const [selectedOrgId, setSelectedOrgId] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newRegion, setNewRegion] = React.useState("");
  const [createLoading, setCreateLoading] = React.useState(false);

  // Upload state per branch
  const [uploadingBranch, setUploadingBranch] = React.useState<string | null>(
    null,
  );
  const [uploadType, setUploadType] = React.useState<"attendance" | "schedules" | null>(null);
  const [uploadResult, setUploadResult] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadBranches();
  }, []);

  async function loadBranches() {
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

      // Fetch branches
      const res = await fetch("/api/branches");
      const data = await res.json();
      setBranches(data.branches || []);
    } catch (err) {
      console.error("Failed to load branches:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBranch(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !selectedOrgId) return;

    setCreateLoading(true);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          region: newRegion.trim() || null,
          org_id: selectedOrgId,
        }),
      });

      if (res.ok) {
        setNewName("");
        setNewRegion("");
        setShowCreate(false);
        await loadBranches();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create branch");
      }
    } catch (err) {
      console.error("Create branch error:", err);
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDeleteBranch(branchId: string) {
    if (!confirm("Are you sure you want to delete this branch?")) return;

    try {
      const res = await fetch("/api/branches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch_id: branchId }),
      });

      if (res.ok) {
        await loadBranches();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete branch");
      }
    } catch (err) {
      console.error("Delete branch error:", err);
    }
  }

  async function handleFileUpload(
    branchId: string,
    type: "attendance" | "schedules",
    file: File,
  ) {
    setUploadingBranch(branchId);
    setUploadType(type);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("branch_id", branchId);

      const endpoint =
        type === "attendance"
          ? "/api/import/attendance"
          : "/api/import/schedules";

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setUploadResult(
          `${type === "attendance" ? "Attendance" : "Schedule"} import successful! ` +
            (data.records_imported
              ? `${data.records_imported} records imported, ${data.flags_generated || 0} flags generated.`
              : `${data.schedules_imported} schedules imported, ${data.flags_generated || 0} flags generated.`),
        );
        await loadBranches();
      } else {
        setUploadResult(
          `Import failed: ${data.error || "Unknown error"}`,
        );
      }
    } catch (err: any) {
      setUploadResult(`Upload error: ${err.message}`);
    } finally {
      setUploadingBranch(null);
      setUploadType(null);
      setTimeout(() => setUploadResult(null), 5000);
    }
  }

  const currentOrg = orgs.find((o) => o.org_id === selectedOrgId);
  const canManage = currentOrg?.role === "admin" || currentOrg?.role === "executive";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Branches
          </h1>
          <p className="mt-1 text-sm text-aura-muted">
            Manage your branches, upload attendance data, and manage shift
            schedules.
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
          {canManage && (
            <button
              type="button"
              onClick={() => setShowCreate(!showCreate)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90"
            >
              <Plus className="h-4 w-4" />
              Add Branch
            </button>
          )}
        </div>
      </div>

      {/* Create branch form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <GlassCard padding="md">
            <form
              onSubmit={handleCreateBranch}
              className="flex flex-col gap-4 sm:flex-row sm:items-end"
            >
              <div className="flex-1">
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-aura-muted">
                  Branch Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Noida Branch"
                  required
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-aura-muted outline-none transition-colors focus:border-white/[0.16]"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-aura-muted">
                  Region / Label
                </label>
                <input
                  type="text"
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  placeholder="e.g. North India"
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
                  <Plus className="h-4 w-4" />
                )}
                Create
              </button>
            </form>
          </GlassCard>
        </motion.div>
      )}

      {/* Upload result toast */}
      {uploadResult && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            uploadResult.includes("failed") || uploadResult.includes("Failed")
              ? "border-red-500/20 bg-red-500/10 text-red-300"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {uploadResult}
        </div>
      )}

      {/* Branches list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-aura-muted" />
        </div>
      ) : branches.length === 0 ? (
        <GlassCard padding="lg">
          <div className="flex flex-col items-center py-12 text-center">
            <Building2 className="mb-4 h-12 w-12 text-aura-muted" />
            <h3 className="text-lg font-medium text-white">No branches yet</h3>
            <p className="mt-2 max-w-sm text-sm text-aura-muted">
              Create your first branch to start tracking attendance and running
              reconciliations.
            </p>
            {canManage && (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90"
              >
                <Plus className="h-4 w-4" />
                Add Branch
              </button>
            )}
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <motion.div key={branch.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
              <GlassCard padding="md" className="flex flex-col gap-4">
                {/* Branch header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-cyan-300">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        {branch.name}
                      </h3>
                      {branch.region && (
                        <p className="text-[10px] uppercase tracking-widest text-aura-muted">
                          {branch.region}
                        </p>
                      )}
                    </div>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleDeleteBranch(branch.id)}
                      className="rounded-md p-1.5 text-aura-muted transition-colors hover:bg-white/[0.04] hover:text-aura-pink"
                      aria-label="Delete branch"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Upload buttons */}
                <div className="flex flex-col gap-2">
                  <label
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/[0.08] px-3 py-2.5 text-xs text-aura-muted transition-colors hover:border-white/[0.16] hover:text-white ${
                      uploadingBranch === branch.id && uploadType === "attendance"
                        ? "opacity-50 pointer-events-none"
                        : ""
                    }`}
                  >
                    {uploadingBranch === branch.id &&
                    uploadType === "attendance" ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FileUp className="h-3.5 w-3.5" />
                        Upload Attendance CSV
                      </>
                    )}
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(branch.id, "attendance", file);
                        e.target.value = "";
                      }}
                    />
                  </label>

                  <label
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/[0.08] px-3 py-2.5 text-xs text-aura-muted transition-colors hover:border-white/[0.16] hover:text-white ${
                      uploadingBranch === branch.id && uploadType === "schedules"
                        ? "opacity-50 pointer-events-none"
                        : ""
                    }`}
                  >
                    {uploadingBranch === branch.id &&
                    uploadType === "schedules" ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <CalendarPlus className="h-3.5 w-3.5" />
                        Upload Schedules CSV
                      </>
                    )}
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(branch.id, "schedules", file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
