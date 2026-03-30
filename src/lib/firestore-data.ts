import { supabase } from './supabase';
import { Billboard } from './data';

export type { Billboard };

// Helper to safely process a single billboard row
// Admin version: does NOT filter by verification_status (shows all billboards including drafts)
function processBillboardRow(row: any): Billboard | null {
    try {
        if (!row) return null;

        // safe defaults
        const width = row.width || 0;
        const height = row.height || 0;
        const unit = row.unit || 'ft';

        // Safer traffic parsing
        let trafficDaily = 0;
        if (typeof row.traffic === 'number') {
            trafficDaily = row.traffic;
        } else if (typeof row.traffic === 'string') {
            trafficDaily = parseInt(row.traffic.replace(/[^0-9]/g, '') || '0');
        }

        // Safer GPS parsing
        let lat = row.latitude || 0;
        let lng = row.longitude || 0;
        if (!lat && !lng && row.gps && typeof row.gps === 'string') {
            const parts = row.gps.split(',');
            if (parts.length === 2) {
                lat = parseFloat(parts[0].trim());
                lng = parseFloat(parts[1].trim());
            }
        }

        return {
            id: row.id,
            name: row.name || 'Untitled',
            location: row.location || 'Unknown Location',
            type: row.type || 'Static',
            image: row.image || '',
            code: row.sku_id || row.code || 'N/A',
            size: row.size || (width && height ? `${width}${unit} × ${height}${unit}` : 'N/A'),
            price: row.price,
            priceMonthly: row.price ? `RM ${Number(row.price).toLocaleString()}/mo` : 'Contact for Price',
            trafficDaily: trafficDaily,
            region: row.region || 'Sabah',
            traffic: row.traffic || 'N/A',
            latitude: lat,
            longitude: lng,
            width,
            height,
            unit,
            available: row.available ?? true,
            availabilityStatus: row.availability_status,
            verificationStatus: row.verification_status || 'draft',
            featured: row.featured,
            trafficProfile: row.traffic_profile || 'commuter',
            skuId: row.sku_id,
            totalPanel: row.total_panel,
            panelNames: row.panel_names,
            gps: row.gps,
            landmark: row.landmark,
            targetMarket: row.target_market,
            resolution: row.resolution,
            operatingTime: row.operating_time,
            durationPerAd: row.duration_per_ad,
            noOfAdvertiser: row.no_of_advertiser,
            loopPerHr: row.loop_per_hr,
            minLoopPerDay: row.min_loop_per_day,
            fileFormat: row.file_format,
            description: row.description,
            startPoint: row.start_point || '',
            endPoint: row.end_point || '',
            district: row.district,
            rentalRates: row.rental_rates || [],
        } as Billboard;
    } catch (err) {
        console.error(`Error processing billboard row ${row?.id}:`, err);
        return null;
    }
}

export async function getBillboards(): Promise<Billboard[]> {
    try {
        const { data, error } = await supabase
            .from('billboards')
            .select('*');

        if (error) throw error;

        const billboards: Billboard[] = [];
        for (const row of data || []) {
            const processed = processBillboardRow(row);
            if (processed) {
                billboards.push(processed);
            }
        }

        return billboards;
    } catch (error) {
        console.error("Error fetching billboards:", error);
        return [];
    }
}

export async function getBillboardById(id: string): Promise<Billboard | null> {
    try {
        const { data, error } = await supabase
            .from('billboards')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return processBillboardRow(data);
    } catch (error) {
        console.error("Error fetching billboard:", error);
        return null;
    }
}
