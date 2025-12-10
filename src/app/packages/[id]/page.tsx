"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPackage, PackageItem } from '@/lib/packages';
import PackageForm from '@/components/PackageForm';

export default function EditPackagePage() {
    const params = useParams();
    const [pkg, setPkg] = useState<PackageItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (params.id) {
                const data = await getPackage(params.id as string);
                setPkg(data);
                setLoading(false);
            }
        };
        load();
    }, [params.id]);

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!pkg) return <div className="p-8 text-center text-red-500">Package not found</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <PackageForm initialData={pkg} isEditing={true} />
        </div>
    );
}
