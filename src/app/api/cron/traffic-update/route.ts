import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getDestinationPoint(lat: number, lng: number, distanceKm: number = 1.0) {
    return { lat: lat + (distanceKm / 111), lng };
}

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing');

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey
        );

        const { data: billboards, error } = await supabase.from('billboards').select('*');
        if (error) throw error;

        const timestamp = new Date().toISOString();
        const dateKey = timestamp.split('T')[0];
        const hour = new Date().getHours();

        const updates = [];
        for (const billboard of billboards || []) {
            const lat = billboard.latitude || 0;
            const lng = billboard.longitude || 0;

            if (!lat && !lng) continue;

            // Generate simulated traffic data
            const baseTraffic = parseInt(String(billboard.traffic).replace(/[^0-9]/g, '') || '0') || 5000;
            const hourlyFraction = [0.01,0.01,0.01,0.01,0.02,0.05,0.10,0.12,0.08,0.05,0.04,0.04,0.05,0.05,0.04,0.05,0.07,0.12,0.06,0.03,0.02,0.02,0.01,0.01][hour] || 0.04;
            const volume = Math.round(baseTraffic * hourlyFraction * (0.85 + Math.random() * 0.3));

            let congestion = 'Low';
            let speed = 60;
            if (volume > baseTraffic * 0.10) { congestion = 'Severe'; speed = 15; }
            else if (volume > baseTraffic * 0.08) { congestion = 'High'; speed = 25; }
            else if (volume > baseTraffic * 0.05) { congestion = 'Moderate'; speed = 40; }

            updates.push({
                billboard_id: billboard.id,
                date: dateKey,
                hour,
                traffic_volume: volume,
                congestion_level: congestion,
                average_speed: speed,
            });
        }

        if (updates.length > 0) {
            await supabase.from('traffic_history').insert(updates);
        }

        return NextResponse.json({ updated: updates.length, timestamp });
    } catch (error: any) {
        console.error('Traffic update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
