import { supabase } from './supabase';

export interface HourlyData {
    hour: number;
    trafficVolume: number;
    congestionLevel: number;
    averageSpeed: number;
    impressionScore: number;
}

export interface TrafficReport {
    dailyTotal: number;
    peakHour: number;
    peakVolume: number;
    congestionImpactScore: number;
    hourlyBreakdown: HourlyData[];
}

export interface CampaignReport {
    billboardId: string;
    billboardName: string;
    totalImpressions: number;
    averageDailyTraffic: number;
    peakHours: number[];
    congestionScore: number;
    reachEstimate: number;
    frequencyEstimate: number;
    dailyReports: TrafficReport[];
}

// Realistic 24-hour traffic distribution profiles (percentage of daily traffic per hour)
const PROFILES: Record<string, number[]> = {
    commuter: [
        1.2, 0.8, 0.5, 0.4, 0.6, 2.0,   // 00-05: very low overnight
        5.5, 9.5, 10.0, 7.0, 5.0, 4.5,   // 06-11: morning rush peak at 08:00
        5.0, 4.5, 4.0, 4.5, 6.0, 9.0,    // 12-17: afternoon build, evening rush
        8.5, 6.0, 4.5, 3.0, 2.0, 1.5,    // 18-23: evening decline
    ],
    retail: [
        0.5, 0.3, 0.2, 0.2, 0.3, 0.5,   // 00-05: minimal
        1.5, 2.5, 3.5, 5.5, 7.5, 9.0,   // 06-11: gradual morning build
        9.5, 8.5, 8.0, 8.5, 9.0, 8.0,   // 12-17: sustained midday peak
        7.0, 5.5, 4.5, 3.5, 2.5, 1.5,   // 18-23: evening decline
    ],
    highway: [
        2.0, 1.5, 1.2, 1.5, 2.5, 4.0,   // 00-05: some overnight traffic
        6.5, 8.5, 8.0, 6.0, 5.0, 5.0,   // 06-11: morning rush
        5.5, 5.0, 5.5, 6.0, 7.0, 8.0,   // 12-17: steady afternoon
        6.5, 5.0, 3.5, 2.8, 2.0, 1.5,   // 18-23: evening decline
    ],
    tourist: [
        0.8, 0.5, 0.3, 0.3, 0.4, 0.7,   // 00-05: minimal
        1.5, 2.5, 4.0, 6.0, 7.5, 8.5,   // 06-11: late morning build
        9.0, 8.5, 8.0, 8.5, 9.0, 8.5,   // 12-17: broad midday peak
        7.5, 6.0, 4.5, 3.0, 2.0, 1.0,   // 18-23: evening decline
    ],
    residential: [
        1.0, 0.6, 0.4, 0.3, 0.5, 1.5,   // 00-05: very quiet
        4.0, 8.0, 9.5, 6.5, 4.5, 4.0,   // 06-11: morning school/work rush
        4.5, 4.0, 5.0, 6.5, 8.0, 9.0,   // 12-17: school pickup, return home
        7.5, 6.0, 5.0, 4.0, 3.0, 1.7,   // 18-23: evening settle
    ],
};

function normalizeProfile(profile: number[]): number[] {
    const sum = profile.reduce((a, b) => a + b, 0);
    return profile.map((v) => v / sum);
}

function getCongestionLevel(hour: number, profileType: string): number {
    // Returns a congestion level 0-1 based on hour and profile
    const peakHours: Record<string, number[]> = {
        commuter: [7, 8, 9, 17, 18, 19],
        retail: [11, 12, 13, 14, 15, 16],
        highway: [7, 8, 17, 18],
        tourist: [10, 11, 12, 13, 14, 15, 16],
        residential: [7, 8, 9, 17, 18],
    };
    const peaks = peakHours[profileType] || peakHours.commuter;
    if (peaks.includes(hour)) return 0.7 + Math.random() * 0.3;
    return 0.1 + Math.random() * 0.4;
}

function getAverageSpeed(congestionLevel: number): number {
    // Higher congestion = lower speed (km/h)
    const baseSpeed = 60;
    return Math.round(baseSpeed * (1 - congestionLevel * 0.7) + Math.random() * 5);
}

function getImpressionScore(volume: number, congestionLevel: number): number {
    // Higher congestion means more dwell time = more impressions per vehicle
    const dwellMultiplier = 1 + congestionLevel * 0.5;
    return Math.round(volume * dwellMultiplier);
}

export function generateTrafficReport(
    dailyVolume: number,
    profileType: string = 'commuter',
    date?: string,
    billboardId?: string
): TrafficReport {
    const profile = PROFILES[profileType] || PROFILES.commuter;
    const normalized = normalizeProfile(profile);

    // Add slight daily variation (+/- 10%)
    const dayVariation = 0.9 + Math.random() * 0.2;
    const adjustedDaily = Math.round(dailyVolume * dayVariation);

    const hourlyBreakdown: HourlyData[] = normalized.map((pct, hour) => {
        const baseVolume = Math.round(adjustedDaily * pct);
        // Add per-hour noise (+/- 8%)
        const noise = 0.92 + Math.random() * 0.16;
        const trafficVolume = Math.round(baseVolume * noise);
        const congestionLevel = getCongestionLevel(hour, profileType);
        const averageSpeed = getAverageSpeed(congestionLevel);
        const impressionScore = getImpressionScore(trafficVolume, congestionLevel);

        return {
            hour,
            trafficVolume,
            congestionLevel: Math.round(congestionLevel * 100) / 100,
            averageSpeed,
            impressionScore,
        };
    });

    const peakEntry = hourlyBreakdown.reduce((max, entry) =>
        entry.trafficVolume > max.trafficVolume ? entry : max
    );

    const totalVolume = hourlyBreakdown.reduce((sum, entry) => sum + entry.trafficVolume, 0);
    const avgCongestion =
        hourlyBreakdown.reduce((sum, entry) => sum + entry.congestionLevel, 0) / 24;

    return {
        dailyTotal: totalVolume,
        peakHour: peakEntry.hour,
        peakVolume: peakEntry.trafficVolume,
        congestionImpactScore: Math.round(avgCongestion * 100) / 100,
        hourlyBreakdown,
    };
}

export async function fetchTrafficReport(
    dailyVolume: number,
    profileType: string = 'commuter',
    date?: string,
    billboardId?: string
): Promise<TrafficReport> {
    // Try to fetch historical data from supabase
    if (billboardId && date) {
        try {
            const { data, error } = await supabase
                .from('traffic_history')
                .select('*')
                .eq('billboard_id', billboardId)
                .eq('date', date)
                .single();

            if (!error && data && data.hourly_breakdown) {
                // Merge stored data with simulated data
                const storedBreakdown: HourlyData[] = data.hourly_breakdown;
                const simulated = generateTrafficReport(dailyVolume, profileType, date, billboardId);

                // Use stored data where available, fill gaps with simulated
                const merged = simulated.hourlyBreakdown.map((sim, hour) => {
                    const stored = storedBreakdown.find((s) => s.hour === hour);
                    return stored || sim;
                });

                const peakEntry = merged.reduce((max, entry) =>
                    entry.trafficVolume > max.trafficVolume ? entry : max
                );

                return {
                    dailyTotal: merged.reduce((sum, e) => sum + e.trafficVolume, 0),
                    peakHour: peakEntry.hour,
                    peakVolume: peakEntry.trafficVolume,
                    congestionImpactScore:
                        Math.round(
                            (merged.reduce((sum, e) => sum + e.congestionLevel, 0) / 24) * 100
                        ) / 100,
                    hourlyBreakdown: merged,
                };
            }
        } catch (err) {
            console.error('Error fetching traffic history:', err);
        }
    }

    // Fall back to fully simulated data
    return generateTrafficReport(dailyVolume, profileType, date, billboardId);
}

export async function fetchCampaignReport(
    billboardId: string,
    billboardName: string,
    dailyVolume: number,
    profileType: string = 'commuter',
    startDate: string,
    endDate: string
): Promise<CampaignReport> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    const dailyReports: TrafficReport[] = [];
    let totalImpressions = 0;
    let totalTraffic = 0;
    const peakHourCounts: Record<number, number> = {};

    for (let i = 0; i < days; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];

        const report = await fetchTrafficReport(dailyVolume, profileType, dateStr, billboardId);
        dailyReports.push(report);

        totalImpressions += report.hourlyBreakdown.reduce((sum, h) => sum + h.impressionScore, 0);
        totalTraffic += report.dailyTotal;
        peakHourCounts[report.peakHour] = (peakHourCounts[report.peakHour] || 0) + 1;
    }

    // Find most common peak hours
    const sortedPeaks = Object.entries(peakHourCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));

    const avgDailyTraffic = Math.round(totalTraffic / days);
    const avgCongestion =
        dailyReports.reduce((sum, r) => sum + r.congestionImpactScore, 0) / days;

    // Estimate reach and frequency
    // Assume ~2.5 people per vehicle, with 30% repeat rate
    const uniqueReachPerDay = Math.round(avgDailyTraffic * 2.5 * 0.7);
    const reachEstimate = Math.round(uniqueReachPerDay * Math.min(days, 30)); // Cap at 30-day unique reach
    const frequencyEstimate = Math.round((totalImpressions / reachEstimate) * 100) / 100;

    return {
        billboardId,
        billboardName,
        totalImpressions,
        averageDailyTraffic: avgDailyTraffic,
        peakHours: sortedPeaks,
        congestionScore: Math.round(avgCongestion * 100) / 100,
        reachEstimate,
        frequencyEstimate,
        dailyReports,
    };
}
