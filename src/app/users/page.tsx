"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Loader2, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";

interface UserRow {
  uid: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: string;
  status: string;
  createdAt: string;
}

type FilterTab = "all" | "pending" | "approved" | "rejected";

export default function UsersPage() {
  const { userData } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const router = useRouter();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (userData && userData.role !== "admin") {
      router.push("/");
    }
  }, [userData, router]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
      return;
    }

    const mapped: UserRow[] = (data || [])
      .filter((row: any) => row.status !== "deleted")
      .map((row: any) => ({
        uid: row.uid,
        email: row.email,
        fullName: row.full_name || "",
        phoneNumber: row.phone_number || "",
        role: row.role || "user",
        status: row.status || "pending",
        createdAt: row.created_at || "",
      }));

    setUsers(mapped);
    setLoading(false);
  };

  useEffect(() => {
    if (userData?.role === "admin") {
      fetchUsers();
    }
  }, [userData]);

  const handleApprove = async (uid: string) => {
    const { error } = await supabase
      .from("users")
      .update({
        status: "approved",
        approved_by: userData?.uid,
        approved_at: new Date().toISOString(),
      })
      .eq("uid", uid);

    if (error) {
      console.error("Error approving user:", error);
      showAlert("Error", "Failed to approve user.", "danger");
    } else {
      showAlert("Success", "User approved.", "success");
      fetchUsers();
    }
  };

  const handleReject = (uid: string) => {
    if (!window.confirm("Are you sure you want to reject this user?")) return;

    (async () => {
      const { error } = await supabase
        .from("users")
        .update({ status: "rejected" })
        .eq("uid", uid);

      if (error) {
        console.error("Error rejecting user:", error);
        showAlert("Error", "Failed to reject user.", "danger");
      } else {
        showAlert("Success", "User rejected.", "success");
        fetchUsers();
      }
    })();
  };

  const handleDelete = async (uid: string) => {
    const { error } = await supabase
      .from("users")
      .update({ status: "deleted" })
      .eq("uid", uid);

    if (error) {
      console.error("Error deleting user:", error);
      return;
    }

    await fetch(`/api/users/${uid}`, { method: "DELETE" });
    fetchUsers();
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;

    showConfirm(
      "Delete Users",
      `Are you sure you want to delete ${selectedIds.size} selected user(s)?`,
      async () => {
        for (const uid of selectedIds) {
          await handleDelete(uid);
        }
        setSelectedIds(new Set());
        showAlert("Success", "Selected users deleted.", "success");
      },
      "danger"
    );
  };

  const toggleSelect = (uid: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map((u) => u.uid)));
    }
  };

  const filteredUsers = users.filter((user) => {
    if (filter === "all") return true;
    return user.status === filter;
  });

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          colors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  if (userData && userData.role !== "admin") {
    return null;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        {selectedIds.size > 0 && (
          <Button variant="destructive" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "pending", "approved", "rejected"] as FilterTab[]).map(
          (tab) => (
            <Button
              key={tab}
              variant={filter === tab ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter(tab);
                setSelectedIds(new Set());
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          )
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={
                    filteredUsers.length > 0 &&
                    selectedIds.size === filteredUsers.length
                  }
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.uid)}
                      onChange={() => toggleSelect(user.uid)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.fullName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phoneNumber}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>{statusBadge(user.status)}</TableCell>
                  <TableCell>
                    {user.createdAt
                      ? format(new Date(user.createdAt), "MMM d, yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {user.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApprove(user.uid)}
                            title="Approve"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReject(user.uid)}
                            title="Reject"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          showConfirm(
                            "Delete User",
                            "Are you sure you want to delete this user?",
                            () => handleDelete(user.uid),
                            "danger"
                          );
                        }}
                        title="Delete"
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
