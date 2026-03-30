"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Download, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MediaBackupPage() {
  const [backupCount, setBackupCount] = useState<number | null>(null);
  const [restoreCount, setRestoreCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [clearConfirmStep, setClearConfirmStep] = useState(0);

  const handleBackup = async () => {
    setLoading(true);
    setStatusMessage("Creating backup...");

    try {
      const { data, error } = await supabase.from("billboards").select("*");

      if (error) {
        setStatusMessage("Error creating backup: " + error.message);
        setLoading(false);
        return;
      }

      const items = data || [];
      setBackupCount(items.length);

      const blob = new Blob([JSON.stringify(items, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `media-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage(`Backup complete. ${items.length} items exported.`);
    } catch (err) {
      console.error("Backup error:", err);
      setStatusMessage("Backup failed.");
    }

    setLoading(false);
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage("Restoring from backup...");

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        setStatusMessage("Invalid backup file: expected an array.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("billboards").insert(data);

      if (error) {
        setStatusMessage("Restore error: " + error.message);
      } else {
        setRestoreCount(data.length);
        setStatusMessage(`Restore complete. ${data.length} items imported.`);
      }
    } catch (err) {
      console.error("Restore error:", err);
      setStatusMessage("Restore failed. Make sure the file is valid JSON.");
    }

    setLoading(false);
    // Reset file input
    e.target.value = "";
  };

  const handleClearAll = async () => {
    if (clearConfirmStep === 0) {
      setClearConfirmStep(1);
      setStatusMessage(
        "WARNING: This will delete ALL billboard data. Click again to confirm."
      );
      return;
    }

    setClearConfirmStep(0);
    setLoading(true);
    setStatusMessage("Clearing all data...");

    try {
      const { error } = await supabase
        .from("billboards")
        .delete()
        .neq("id", "");

      if (error) {
        setStatusMessage("Clear error: " + error.message);
      } else {
        setStatusMessage("All billboard data has been cleared.");
      }
    } catch (err) {
      console.error("Clear error:", err);
      setStatusMessage("Clear failed.");
    }

    setLoading(false);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Media Backup</h1>

      <div className="space-y-8">
        {/* Backup Section */}
        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Backup</h2>
          <p className="text-sm text-gray-500 mb-4">
            Export all billboard data as a JSON file.
          </p>
          <Button onClick={handleBackup} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download Backup
          </Button>
          {backupCount !== null && (
            <p className="mt-2 text-sm text-gray-600">
              {backupCount} items backed up.
            </p>
          )}
        </section>

        {/* Restore Section */}
        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Restore</h2>
          <p className="text-sm text-gray-500 mb-4">
            Import billboard data from a JSON backup file.
          </p>
          <div className="space-y-2">
            <Label htmlFor="restoreFile">Select backup file</Label>
            <Input
              id="restoreFile"
              type="file"
              accept=".json"
              onChange={handleRestore}
              disabled={loading}
            />
          </div>
          {restoreCount !== null && (
            <p className="mt-2 text-sm text-gray-600">
              {restoreCount} items restored.
            </p>
          )}
        </section>

        {/* Clear All Section */}
        <section className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Clear All Data
          </h2>
          <p className="text-sm text-red-600 mb-4">
            Permanently delete all billboard data. This action cannot be undone.
          </p>
          <Button
            variant="destructive"
            onClick={handleClearAll}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {clearConfirmStep === 1
              ? "Click Again to Confirm Delete"
              : "Clear All Data"}
          </Button>
        </section>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`rounded-lg border p-4 text-sm ${
              statusMessage.includes("WARNING") ||
              statusMessage.includes("error") ||
              statusMessage.includes("failed")
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-green-200 bg-green-50 text-green-800"
            }`}
          >
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
}
