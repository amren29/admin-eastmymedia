
export interface HourlyData {
    hour: number; // 0-23
    trafficVolume: number;
    congestionLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
    averageSpeed: number; // km/h
    impressionScore: number; // Weighted score based on dwell time
}

export interface TrafficReport {
    dailyTotal: number;
    peakHour: number;
    peakVolume: number;
    congestionImpactScore: number; // Percentage increase in value due to jams
    hourlyBreakdown: HourlyData[];
}

// Traffic Distribution Curves (Percentage of daily traffic per hour)
const PROFILES: Record<string, number[]> = {
    // Spikes at 8AM and 6PM
    commuter: [
        0.01, 0.01, 0.01, 0.01, 0.02, 0.05, 0.10, 0.12, 0.08, 0.05, // 0-9 AM
        0.04, 0.04, 0.05, 0.05, 0.04, 0.05, 0.07, 0.12, 0.06, 0.03, // 10AM-7PM
        0.02, 0.02, 0.01, 0.01 // 8PM-11PM
    ],
    // Spikes at lunch and late afternoon/evening
    retail: [
        0.00, 0.00, 0.00, 0.00, 0.00, 0.01, 0.02, 0.03, 0.04, 0.05, // 0-9 AM
        0.08, 0.09, 0.10, 0.10, 0.09, 0.10, 0.11, 0.12, 0.09, 0.08, // 10AM-7PM
        0.05, 0.03, 0.01, 0.00 // 8PM-11PM
    ],
    // Steady flow with minor peaks
    highway: [
        0.02, 0.01, 0.01, 0.01, 0.02, 0.04, 0.06, 0.08, 0.07, 0.06, // 0-9 AM
        0.06, 0.06, 0.06, 0.06, 0.06, 0.07, 0.08, 0.09, 0.07, 0.05, // 10AM-7PM
        0.04, 0.03, 0.03, 0.02 // 8PM-11PM
    ],
    // Late morning + Late night spikes
    tourist: [
        0.01, 0.00, 0.00, 0.00, 0.00, 0.01, 0.03, 0.05, 0.07, 0.09, // 0-9 AM
        0.10, 0.10, 0.08, 0.08, 0.07, 0.08, 0.09, 0.09, 0.10, 0.10, // 10AM-7PM
        0.09, 0.08, 0.06, 0.04 // 8PM-11PM
    ],
    // Default Flat-ish
    residential: [
        0.01, 0.00, 0.00, 0.00, 0.01, 0.03, 0.08, 0.10, 0.06, 0.04, // 0-9 AM
        0.03, 0.03, 0.03, 0.04, 0.03, 0.04, 0.06, 0.09, 0.07, 0.04, // 10AM-7PM
        0.03, 0.02, 0.01, 0.01 // 8PM-11PM
    ]
};

// Base speeds (km/h) for congestion logic
const SPEED_LOGIC = {
    freeFlow: 80,
    moderate: 40,
    heavy: 15,
    severe: 5
};

// Pseudo-random number generator (Seeded)
// This ensures that "Random Noise" is consistent for the same billboard + date, 
// so the report doesn't change every time you refresh.
function seededRandom(seed: number) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

export function generateTrafficReport(dailyVolume: number, profileType: string = 'commuter', date?: Date, billboardId: string = 'default'): TrafficReport {
    // Normalize profile key
    const profileKey = profileType.toLowerCase();
    const distribution = PROFILES[profileKey] || PROFILES['commuter'];

    // Create a unique seed based on Billboard ID + Date
    // If no date, use today. 
    const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const seedString = `${billboardId}-${dateStr}`;
    let seed = 0;
    for (let i = 0; i < seedString.length; i++) {
        seed += seedString.charCodeAt(i);
    }

    // Adjust for Weekend (Simplify: -20% volume for commuter, +20% for retail/tourist)
    const isWeekend = date ? (date.getDay() === 0 || date.getDay() === 6) : false;
    let volumeMultiplier = 1.0;

    if (isWeekend) {
        if (profileKey === 'commuter') volumeMultiplier = 0.8;
        if (profileKey === 'retail' || profileKey === 'tourist') volumeMultiplier = 1.25;
    }

    // Add "Daily Variance" (Some days are just busier by +/- 10%)
    const dailyVariance = 0.9 + (seededRandom(seed) * 0.2); // 0.9 to 1.1
    const adjustedDailyVolume = Math.round(dailyVolume * volumeMultiplier * dailyVariance);

    const hourlyBreakdown: HourlyData[] = distribution.map((percentage, hour) => {
        // Add "Hourly Noise" (Each hour varies by +/- 15% from the curve)
        const hourlyNoise = 0.85 + (seededRandom(seed + hour + 100) * 0.3); // 0.85 to 1.15

        let volume = Math.round(adjustedDailyVolume * percentage * hourlyNoise);

        // Ensure strictly non-negative
        if (volume < 0) volume = 0;

        // Determine Congestion based on "Volume density" (Simulated)
        // Assume capacity is roughly 8% of daily volume per hour.
        const capacityThreshold = adjustedDailyVolume * 0.08;

        let speed = SPEED_LOGIC.freeFlow;
        let congestion: HourlyData['congestionLevel'] = 'Low';
        let congestionMultiplier = 1.0;

        if (volume > capacityThreshold * 1.2) {
            speed = SPEED_LOGIC.severe;
            congestion = 'Severe';
            congestionMultiplier = 2.5; // High dwell time bonus
        } else if (volume > capacityThreshold * 0.9) {
            speed = SPEED_LOGIC.heavy;
            congestion = 'High';
            congestionMultiplier = 1.8;
            speed = Math.floor(SPEED_LOGIC.moderate - (seededRandom(seed + hour) * 10)); // Variable speed
        } else if (volume > capacityThreshold * 0.5) {
            speed = SPEED_LOGIC.moderate;
            congestion = 'Moderate';
            congestionMultiplier = 1.2;
        }

        return {
            hour,
            trafficVolume: volume,
            congestionLevel: congestion,
            averageSpeed: speed,
            impressionScore: Math.round(volume * congestionMultiplier)
        };
    });

    // Calculate Summary Metrics
    const peakHourData = hourlyBreakdown.reduce((max, current) => current.trafficVolume > max.trafficVolume ? current : max, hourlyBreakdown[0]);
    const totalImpressionScore = hourlyBreakdown.reduce((sum, item) => sum + item.impressionScore, 0);

    // "Congestion Impact" = How much more value did we get vs raw volume?
    // If flow was free all day, score = volume. 
    // Impact = (Score - Volume) / Volume * 100
    const impactScore = Math.round(((totalImpressionScore - adjustedDailyVolume) / adjustedDailyVolume) * 100);

    return {
        dailyTotal: adjustedDailyVolume,
        peakHour: peakHourData.hour,
        peakVolume: peakHourData.trafficVolume,
        congestionImpactScore: impactScore,
        hourlyBreakdown
    };
}

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export async function fetchTrafficReport(dailyVolume: number, profileType: string, date: Date, billboardId: string = 'default'): Promise<TrafficReport> {
    const simulatedReport = generateTrafficReport(dailyVolume, profileType, date, billboardId);

    // Safety check for client-side DB
    if (!db) return simulatedReport;

    try {
        const dateStr = date.toISOString().split('T')[0];
        const q = query(
            collection(db, 'billboards', billboardId, 'traffic_history'),
            where('date', '==', dateStr)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return simulatedReport;
        }

        // Merge Real Data
        const realDataMap = new Map();
        snapshot.forEach(doc => {
            const data = doc.data();
            // Ensure we have required fields
            if (typeof data.hour === 'number') {
                realDataMap.set(data.hour, data);
            }
        });

        const updatedBreakdown = simulatedReport.hourlyBreakdown.map(item => {
            if (realDataMap.has(item.hour)) {
                const real = realDataMap.get(item.hour);

                // Recalculate multiplier for score
                let multiplier = 1.0;
                if (real.congestionLevel === 'Severe') multiplier = 2.5;
                else if (real.congestionLevel === 'High') multiplier = 1.8;
                else if (real.congestionLevel === 'Moderate') multiplier = 1.2;

                return {
                    ...item,
                    trafficVolume: real.trafficVolume,
                    congestionLevel: real.congestionLevel as any,
                    averageSpeed: real.averageSpeed,
                    impressionScore: Math.round(real.trafficVolume * multiplier)
                };
            }
            return item;
        });

        // Recalculate Totals based on merged data
        const newTotalVolume = updatedBreakdown.reduce((sum, item) => sum + item.trafficVolume, 0);
        const newTotalScore = updatedBreakdown.reduce((sum, item) => sum + item.impressionScore, 0);
        const newPeak = updatedBreakdown.reduce((max, current) => current.trafficVolume > max.trafficVolume ? current : max, updatedBreakdown[0]);

        return {
            dailyTotal: newTotalVolume,
            peakHour: newPeak.hour,
            peakVolume: newPeak.trafficVolume,
            congestionImpactScore: Math.round(((newTotalScore - newTotalVolume) / newTotalVolume) * 100) || 0,
            hourlyBreakdown: updatedBreakdown
        };

    } catch (error) {
        console.error("Error fetching real traffic data:", error);
        return simulatedReport;
    }
}
