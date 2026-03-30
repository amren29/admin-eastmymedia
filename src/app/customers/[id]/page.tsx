"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useModal } from "@/context/ModalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Building2, UserCheck } from "lucide-react";

interface CustomerForm {
  companyName: string;
  registrationNo: string;
  category: string;
  address: string;
  officeNo: string;
  sst: string;
  personInCharge: string;
  position: string;
  phone: string;
  email: string;
}

const INITIAL_FORM: CustomerForm = {
  companyName: "",
  registrationNo: "",
  category: "",
  address: "",
  officeNo: "",
  sst: "",
  personInCharge: "",
  position: "",
  phone: "",
  email: "",
};

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const { showAlert } = useModal();
  const [form, setForm] = useState<CustomerForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const decodedId = decodeURIComponent(params.id as string);

  const fetchCustomer = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", decodedId)
      .single();

    if (!error && data) {
      setForm({
        companyName: data.company_name || "",
        registrationNo: data.registration_no || "",
        category: data.category || "",
        address: data.address || "",
        officeNo: data.office_no || "",
        sst: data.sst || "",
        personInCharge: data.person_in_charge || data.name || "",
        position: data.position || "",
        phone: data.phone || "",
        email: data.email || "",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (decodedId) fetchCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedId]);

  const handleChange = (field: keyof CustomerForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.personInCharge.trim() && !form.companyName.trim()) {
      showAlert(
        "Validation",
        "Please enter a company name or person in charge.",
        "warning"
      );
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from("customers")
      .update({
        company_name: form.companyName,
        registration_no: form.registrationNo,
        category: form.category,
        address: form.address,
        office_no: form.officeNo,
        sst: form.sst,
        person_in_charge: form.personInCharge,
        position: form.position,
        phone: form.phone,
        email: form.email,
        name: form.personInCharge || form.companyName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", decodedId);

    if (!error) {
      showAlert("Saved", "Customer updated successfully.", "success");
      router.push("/customers");
    } else {
      showAlert("Error", "Failed to update customer.", "danger");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/customers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Button>
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Customer</h1>

      <form onSubmit={handleSubmit}>
        {/* Company Information */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Company Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <Input
                value={form.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration No.
              </label>
              <Input
                value={form.registrationNo}
                onChange={(e) => handleChange("registrationNo", e.target.value)}
                placeholder="Registration number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Input
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                placeholder="Business category"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Office No.
              </label>
              <Input
                value={form.officeNo}
                onChange={(e) => handleChange("officeNo", e.target.value)}
                placeholder="Office phone number"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Company address"
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SST
              </label>
              <Input
                value={form.sst}
                onChange={(e) => handleChange("sst", e.target.value)}
                placeholder="SST number"
              />
            </div>
          </div>
        </div>

        {/* Person In Charge */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Person In Charge
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <Input
                value={form.personInCharge}
                onChange={(e) =>
                  handleChange("personInCharge", e.target.value)
                }
                placeholder="Person in charge name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <Input
                value={form.position}
                onChange={(e) => handleChange("position", e.target.value)}
                placeholder="Job position"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <Input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Email address"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/customers">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
