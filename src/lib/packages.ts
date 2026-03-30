import { supabase } from './supabase';

export interface MediaItem {
    id: string;
    name: string;
    location: string;
    type: string;
    price: number;
    width: number;
    height: number;
    unit: string;
    image: string;
    [key: string]: any;
}

export interface PackageItem {
    id: string;
    name: string;
    description: string;
    validFrom: string;
    validTo: string;
    items: string[];
    standardTotal: number;
    packagePrice: number;
    status: 'active' | 'inactive';
    image?: string;
    createdAt: string;
    updatedAt?: string;
}

export async function getMediaItems(): Promise<MediaItem[]> {
    try {
        const { data, error } = await supabase
            .from('billboards')
            .select('*');

        if (error) throw error;

        return (data || []).map((row: any) => ({
            id: row.id,
            name: row.name || 'Untitled',
            location: row.location || 'Unknown',
            type: row.type || 'Static',
            price: row.price || 0,
            width: row.width || 0,
            height: row.height || 0,
            unit: row.unit || 'ft',
            image: row.image || '',
            ...row,
        }));
    } catch (error) {
        console.error("Error fetching media items:", error);
        return [];
    }
}

export async function getPackages(): Promise<PackageItem[]> {
    try {
        const { data, error } = await supabase
            .from('packages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            description: row.description,
            validFrom: row.valid_from,
            validTo: row.valid_to,
            items: row.items || [],
            standardTotal: row.standard_total,
            packagePrice: row.package_price,
            status: row.status,
            image: row.image,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    } catch (error) {
        console.error("Error fetching packages:", error);
        return [];
    }
}

export async function getPackage(id: string): Promise<PackageItem | null> {
    try {
        const { data, error } = await supabase
            .from('packages')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            description: data.description,
            validFrom: data.valid_from,
            validTo: data.valid_to,
            items: data.items || [],
            standardTotal: data.standard_total,
            packagePrice: data.package_price,
            status: data.status,
            image: data.image,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    } catch (error) {
        console.error("Error fetching package:", error);
        return null;
    }
}

export async function createPackage(data: Omit<PackageItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<PackageItem | null> {
    try {
        const snakeCaseData = {
            name: data.name,
            description: data.description,
            valid_from: data.validFrom,
            valid_to: data.validTo,
            items: data.items,
            standard_total: data.standardTotal,
            package_price: data.packagePrice,
            status: data.status,
            image: data.image,
        };

        const { data: result, error } = await supabase
            .from('packages')
            .insert(snakeCaseData)
            .select()
            .single();

        if (error) throw error;

        return {
            id: result.id,
            name: result.name,
            description: result.description,
            validFrom: result.valid_from,
            validTo: result.valid_to,
            items: result.items || [],
            standardTotal: result.standard_total,
            packagePrice: result.package_price,
            status: result.status,
            image: result.image,
            createdAt: result.created_at,
            updatedAt: result.updated_at,
        };
    } catch (error) {
        console.error("Error creating package:", error);
        return null;
    }
}

export async function updatePackage(id: string, data: Partial<PackageItem>): Promise<PackageItem | null> {
    try {
        const snakeCaseData: Record<string, any> = {};

        if (data.name !== undefined) snakeCaseData.name = data.name;
        if (data.description !== undefined) snakeCaseData.description = data.description;
        if (data.validFrom !== undefined) snakeCaseData.valid_from = data.validFrom;
        if (data.validTo !== undefined) snakeCaseData.valid_to = data.validTo;
        if (data.items !== undefined) snakeCaseData.items = data.items;
        if (data.standardTotal !== undefined) snakeCaseData.standard_total = data.standardTotal;
        if (data.packagePrice !== undefined) snakeCaseData.package_price = data.packagePrice;
        if (data.status !== undefined) snakeCaseData.status = data.status;
        if (data.image !== undefined) snakeCaseData.image = data.image;

        const { data: result, error } = await supabase
            .from('packages')
            .update(snakeCaseData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: result.id,
            name: result.name,
            description: result.description,
            validFrom: result.valid_from,
            validTo: result.valid_to,
            items: result.items || [],
            standardTotal: result.standard_total,
            packagePrice: result.package_price,
            status: result.status,
            image: result.image,
            createdAt: result.created_at,
            updatedAt: result.updated_at,
        };
    } catch (error) {
        console.error("Error updating package:", error);
        return null;
    }
}

export async function deletePackage(id: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('packages')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error("Error deleting package:", error);
        return false;
    }
}
