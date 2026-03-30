"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useModal } from "@/context/ModalContext";
import { generatePDF } from "@/lib/generatePDF";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Download,
  Trash2,
  Mail,
  Phone,
  User,
  MessageSquare,
} from "lucide-react";

interface Proposal {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  message: string;
  billboards: any[];
  status: string;
  totalAmount: number;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 border-blue-300",
  contacted: "bg-yellow-100 text-yellow-800 border-yellow-300",
  closed: "bg-green-100 text-green-800 border-green-300",
};

const STATUS_ACTIVE: Record<string, string> = {
  new: "bg-blue-600 text-white ring-2 ring-blue-300",
  contacted: "bg-yellow-500 text-white ring-2 ring-yellow-300",
  closed: "bg-green-600 text-white ring-2 ring-green-300",
};

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showConfirm, showAlert } = useModal();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  const id = params.id as string;

  const fetchProposal = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setProposal({
        id: data.id,
        clientName: data.client_name || "",
        clientEmail: data.client_email || "",
        clientPhone: data.client_phone || "",
        message: data.message || "",
        billboards: data.billboards || [],
        status: data.status || "new",
        totalAmount: data.total_amount || 0,
        createdAt: data.created_at,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) fetchProposal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    const { error } = await supabase
      .from("proposals")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      setProposal((prev) => (prev ? { ...prev, status: newStatus } : prev));
      showAlert("Updated", `Status changed to ${newStatus}.`, "success");
    } else {
      showAlert("Error", "Failed to update status.", "danger");
    }
  };

  const handleDelete = () => {
    showConfirm(
      "Delete Proposal",
      "Are you sure you want to delete this proposal? This action cannot be undone.",
      async () => {
        const { error } = await supabase
          .from("proposals")
          .delete()
          .eq("id", id);
        if (!error) {
          router.push("/proposals");
        } else {
          showAlert("Error", "Failed to delete proposal.", "danger");
        }
      },
      "danger"
    );
  };

  const handleDownloadPDF = async () => {
    if (!proposal) return;
    const { data: settingsRow } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "company_profile")
      .single();

    const settings = settingsRow?.value || settingsRow || {};
    generatePDF(proposal, settings);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-MY", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-20">
        <p className="text-gray-500">Proposal not found.</p>
        <Link href="/proposals">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Proposals
          </Button>
        </Link>
      </div>
    );
  }

  const totalAmount =
    proposal.totalAmount ||
    proposal.billboards.reduce(
      (sum: number, b: any) => sum + Number(b.price || 0),
      0
    );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/proposals">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Proposals
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Client Info Card */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Client Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="font-medium text-gray-900">
                {proposal.clientName || "-"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-900">
                {proposal.clientEmail || "-"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">
                {proposal.clientPhone || "-"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Message</p>
              <p className="font-medium text-gray-900">
                {proposal.message || "-"}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500 mb-1">Created</p>
          <p className="text-sm text-gray-700">
            {formatDate(proposal.createdAt)}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
        <div className="flex items-center gap-3">
          {(["new", "contacted", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all ${
                proposal.status === s
                  ? STATUS_ACTIVE[s]
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Billboards Table */}
      <div className="bg-white rounded-lg border shadow-sm mb-6">
        <div className="p-6 pb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Billboards ({proposal.billboards.length})
          </h2>
        </div>
        {proposal.billboards.length === 0 ? (
          <div className="px-6 pb-6 text-sm text-gray-500">
            No billboards in this proposal.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Price (RM)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposal.billboards.map((b: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="text-gray-500">{i + 1}</TableCell>
                  <TableCell className="font-medium">
                    {b.name || "N/A"}
                  </TableCell>
                  <TableCell>{b.location || "N/A"}</TableCell>
                  <TableCell>{b.type || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    {Number(b.price || 0).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {proposal.billboards.length > 0 && (
          <div className="p-6 pt-3 border-t flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                RM {totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
