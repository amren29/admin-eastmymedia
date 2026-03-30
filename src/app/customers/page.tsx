"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
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
import {
  Search,
  Plus,
  Trash2,
  Edit,
  Link2,
  Users,
  Mail,
  Phone,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalProposals: number;
  lastActiveAt: string | null;
}

export default function CustomersPage() {
  const { userData } = useAuth();
  const { showConfirm, showAlert } = useModal();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const isAdmin = userData?.role === "administrator";

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("last_active_at", { ascending: false });

    if (!error && data) {
      setCustomers(
        data.map((row: any) => ({
          id: row.id,
          name: row.name || "",
          email: row.email || "",
          phone: row.phone || "",
          totalProposals: row.total_proposals || 0,
          lastActiveAt: row.last_active_at,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  };

  const handleDelete = (id: string) => {
    showConfirm(
      "Delete Customer",
      "Are you sure you want to delete this customer? This action cannot be undone.",
      async () => {
        const { error } = await supabase
          .from("customers")
          .delete()
          .eq("id", id);
        if (!error) {
          fetchCustomers();
          showAlert("Deleted", "Customer has been deleted.", "success");
        } else {
          showAlert("Error", "Failed to delete customer.", "danger");
        }
      },
      "danger"
    );
  };

  const handleBulkDelete = () => {
    showConfirm(
      "Delete Customers",
      `Are you sure you want to delete ${selected.size} customer(s)? This action cannot be undone.`,
      async () => {
        const ids = Array.from(selected);
        const { error } = await supabase
          .from("customers")
          .delete()
          .in("id", ids);
        if (!error) {
          setSelected(new Set());
          fetchCustomers();
          showAlert(
            "Deleted",
            `${ids.length} customer(s) deleted.`,
            "success"
          );
        } else {
          showAlert("Error", "Failed to delete customers.", "danger");
        }
      },
      "danger"
    );
  };

  const copyRegistrationLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin.replace(/admin[.-]?/i, "")}/client-form`
    );
    showAlert(
      "Link Copied",
      "Registration link has been copied to clipboard.",
      "success"
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-MY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">
            {customers.length} total customers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={copyRegistrationLink}>
            <Link2 className="h-4 w-4 mr-2" />
            Registration Link
          </Button>
          <Link href="/customers/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {isAdmin && selected.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selected.size})
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Users className="h-12 w-12 mb-3 text-gray-300" />
            <p className="font-medium">No customers found</p>
            <p className="text-sm">
              {search
                ? "Try a different search term"
                : "Add your first customer"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && (
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={
                        selected.size === filtered.length &&
                        filtered.length > 0
                      }
                      onChange={toggleAll}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                )}
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Proposals</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((customer) => (
                <TableRow key={customer.id}>
                  {isAdmin && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(customer.id)}
                        onChange={() => toggleSelect(customer.id)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium">
                        {getInitials(customer.name || "?")}
                      </div>
                      <span className="font-medium text-gray-900">
                        {customer.name || "Unnamed"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-0.5">
                      <p className="text-gray-900 flex items-center gap-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        {customer.email || "-"}
                      </p>
                      <p className="text-gray-500 flex items-center gap-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        {customer.phone || "-"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-xs font-medium">
                      {customer.totalProposals}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(customer.lastActiveAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/customers/${customer.id}`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(customer.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
