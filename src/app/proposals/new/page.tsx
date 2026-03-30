"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
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
  ArrowLeft,
  Search,
  Plus,
  X,
  User,
  ShoppingCart,
  UserPlus,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_proposals: number;
}

interface Billboard {
  id: string;
  name: string;
  location: string;
  type: string;
  price: number;
}

export default function NewProposalPage() {
  const router = useRouter();
  const { showAlert } = useModal();

  // Client fields
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [message, setMessage] = useState("");

  // Media
  const [billboards, setBillboards] = useState<Billboard[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<Billboard[]>([]);
  const [mediaSearch, setMediaSearch] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(true);

  useEffect(() => {
    fetchCustomers();
    fetchBillboards();
  }, []);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    const { data } = await supabase.from("customers").select("*");
    if (data) setCustomers(data);
    setLoadingCustomers(false);
  };

  const fetchBillboards = async () => {
    setLoadingMedia(true);
    const { data } = await supabase.from("billboards").select("*");
    if (data) {
      setBillboards(
        data.map((b: any) => ({
          id: b.id,
          name: b.name || "",
          location: b.location || "",
          type: b.type || "",
          price: Number(b.price || 0),
        }))
      );
    }
    setLoadingMedia(false);
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (customerId) {
      const c = customers.find((c) => c.id === customerId);
      if (c) {
        setClientName(c.name || "");
        setClientEmail(c.email || "");
        setClientPhone(c.phone || "");
      }
    }
  };

  const addMedia = (billboard: Billboard) => {
    if (!selectedMedia.find((m) => m.id === billboard.id)) {
      setSelectedMedia((prev) => [...prev, billboard]);
    }
  };

  const removeMedia = (id: string) => {
    setSelectedMedia((prev) => prev.filter((m) => m.id !== id));
  };

  const totalAmount = selectedMedia.reduce((sum, m) => sum + m.price, 0);

  const filteredBillboards = billboards.filter(
    (b) =>
      !selectedMedia.find((m) => m.id === b.id) &&
      (b.name.toLowerCase().includes(mediaSearch.toLowerCase()) ||
        b.location.toLowerCase().includes(mediaSearch.toLowerCase()))
  );

  const handleSubmit = async () => {
    if (!clientName.trim()) {
      showAlert("Validation", "Client name is required.", "warning");
      return;
    }
    if (!clientEmail.trim()) {
      showAlert("Validation", "Client email is required.", "warning");
      return;
    }
    if (selectedMedia.length === 0) {
      showAlert(
        "Validation",
        "Please select at least one media item.",
        "warning"
      );
      return;
    }

    setSubmitting(true);
    try {
      // Insert proposal
      const { error: proposalError } = await supabase
        .from("proposals")
        .insert({
          client_name: clientName,
          client_email: clientEmail.toLowerCase(),
          client_phone: clientPhone,
          message,
          billboards: selectedMedia,
          status: "new",
          total_amount: totalAmount,
        });

      if (proposalError) {
        showAlert("Error", "Failed to create proposal.", "danger");
        setSubmitting(false);
        return;
      }

      // Upsert customer
      const emailLower = clientEmail.toLowerCase();
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("*")
        .eq("email", emailLower)
        .single();

      if (existingCustomer) {
        await supabase
          .from("customers")
          .update({
            last_active_at: new Date().toISOString(),
            total_proposals: (existingCustomer.total_proposals || 0) + 1,
            name: clientName,
            phone: clientPhone,
          })
          .eq("id", existingCustomer.id);
      } else {
        await supabase.from("customers").insert({
          name: clientName,
          email: emailLower,
          phone: clientPhone,
          total_proposals: 1,
          last_active_at: new Date().toISOString(),
          source: "admin",
        });
      }

      showAlert("Success", "Proposal created successfully.", "success");
      router.push("/proposals");
    } catch {
      showAlert("Error", "Something went wrong.", "danger");
    }
    setSubmitting(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/proposals">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Proposals
          </Button>
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Create New Proposal
      </h1>

      {/* Step Indicators */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
            1
          </div>
          <span className="text-sm font-medium text-gray-900">
            Client Details
          </span>
        </div>
        <div className="flex-1 h-px bg-gray-300" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-sm font-medium text-gray-900">
            Media Selection
          </span>
        </div>
      </div>

      {/* Section 1: Client Details */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Client Details
          </h2>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Existing Customer
          </label>
          <div className="flex gap-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={loadingCustomers}
            >
              <option value="">-- Enter manually --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
            <Link href="/customers/new">
              <Button variant="outline" size="icon" title="Create New Customer">
                <UserPlus className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name *
            </label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Email *
            </label>
            <Input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Enter client email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Phone
            </label>
            <Input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Additional message or notes..."
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* Section 2: Media Selection */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Media Selection
          </h2>
        </div>

        {/* Selected Media */}
        {selectedMedia.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Selected Media ({selectedMedia.length})
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Price (RM)</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedMedia.map((m) => (
                    <TableRow key={m.id} className="bg-blue-50/50">
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>{m.location}</TableCell>
                      <TableCell>{m.type}</TableCell>
                      <TableCell className="text-right">
                        {m.price.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMedia(m.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 border-t bg-gray-50 flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-xl font-bold text-gray-900">
                    RM {totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Media */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Available Media
          </h3>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search media by name or location..."
              value={mediaSearch}
              onChange={(e) => setMediaSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loadingMedia ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
            </div>
          ) : filteredBillboards.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              {mediaSearch
                ? "No matching media found"
                : "All media has been selected"}
            </div>
          ) : (
            <div className="border rounded-lg max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Price (RM)</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBillboards.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell>{b.location}</TableCell>
                      <TableCell>{b.type}</TableCell>
                      <TableCell className="text-right">
                        {b.price.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => addMedia(b)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Link href="/proposals">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Proposal
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
