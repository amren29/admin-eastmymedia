"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getPackage, PackageItem } from "@/lib/packages";
import PackageForm from "@/components/PackageForm";

export default function EditPackagePage() {
  const params = useParams();
  const [pkg, setPkg] = useState<PackageItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const id = params.id as string;
      const data = await getPackage(id);
      setPkg(data);
      setLoading(false);
    };

    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="p-8 text-center text-gray-500">Package not found.</div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PackageForm initialData={pkg} isEditing={true} />
    </div>
  );
}
