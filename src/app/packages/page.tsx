"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPackages, deletePackage, PackageItem } from "@/lib/packages";

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [enablePackages, setEnablePackages] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const pkgs = await getPackages();
    setPackages(pkgs);

    // Fetch enablePackages setting
    const { data } = await supabase
      .from("settings")
      .select("enable_packages")
      .eq("key", "general")
      .single();

    if (data) {
      setEnablePackages(data.enable_packages ?? true);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleEnable = async () => {
    const newValue = !enablePackages;
    setEnablePackages(newValue);

    await supabase
      .from("settings")
      .upsert(
        { key: "general", enable_packages: newValue },
        { onConflict: "key" }
      );
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this package?"))
      return;

    const success = await deletePackage(id);
    if (success) {
      fetchData();
    }
  };

  const filteredPackages = packages.filter((pkg) =>
    pkg.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Packages</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enablePackages"
              checked={enablePackages}
              onChange={handleToggleEnable}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="enablePackages" className="text-sm text-gray-600">
              Enable Packages
            </label>
          </div>
          <Link href="/packages/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Package
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valid Period</TableHead>
              <TableHead>Standard Total</TableHead>
              <TableHead>Package Price</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPackages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  No packages found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPackages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">{pkg.name}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        pkg.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {pkg.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {pkg.validFrom && pkg.validTo
                      ? `${format(new Date(pkg.validFrom), "MMM d, yyyy")} - ${format(new Date(pkg.validTo), "MMM d, yyyy")}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    RM {pkg.standardTotal?.toLocaleString() || "0"}
                  </TableCell>
                  <TableCell>
                    RM {pkg.packagePrice?.toLocaleString() || "0"}
                  </TableCell>
                  <TableCell>{pkg.items?.length || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/packages/${pkg.id}`}>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(pkg.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
