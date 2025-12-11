"use client";

import { useState, useEffect } from 'react';
import { getBillboards, Billboard } from '@/lib/firestore-data';
import { generateTrafficReport, fetchTrafficReport, TrafficReport } from '@/lib/ai-analytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, ReferenceLine } from 'recharts';
import { Loader2, TrendingUp, AlertTriangle, Users, Calendar, Clock } from 'lucide-react';

export default function ReportsPage() {
    const [billboards, setBillboards] = useState<Billboard[]>([]);
    const [selectedBillboardId, setSelectedBillboardId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [converting, setConverting] = useState(false);
    const [report, setReport] = useState<TrafficReport | null>(null);
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        async function loadBillboards() {
            try {
                const data = await getBillboards();
                setBillboards(data);
                if (data.length > 0) setSelectedBillboardId(data[0].id);
            } catch (error) {
                console.error("Failed to load billboards", error);
            } finally {
                setLoading(false);
            }
        }
        loadBillboards();
    }, []);

    const handleGenerate = () => {
        const billboard = billboards.find(b => b.id === selectedBillboardId);
        if (!billboard) return;

        setConverting(true);
        // Simulate "AI Processing" delay for effect
        // Simulate "AI Processing" delay for effect, but now also fetch real data
        setTimeout(async () => {
            // Default volume if not set or invalid
            const traffic = billboard.trafficDaily || 50000;
            const profile = billboard.trafficProfile || 'commuter';

            // Switch to async fetch
            // const result = generateTrafficReport(traffic, profile, new Date(date), billboard.id);
            const result = await fetchTrafficReport(traffic, profile, new Date(date), billboard.id);

            setReport(result);
            setConverting(false);
        }, 500); // Reduced artificial delay since we have real network latency now
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-teal-600" /></div>;

    const selectedBillboard = billboards.find(b => b.id === selectedBillboardId);

    // Determine Report Type & Current Hour
    const reportDate = new Date(date);
    const today = new Date();
    const isToday = reportDate.toISOString().split('T')[0] === today.toISOString().split('T')[0];
    const isFuture = reportDate > today && !isToday;
    const currentHour = isToday ? today.getHours() : undefined;
    const reportType = isFuture || isToday ? 'Predictive Forecast' : 'Historical Analysis';

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 p-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                    Campaign Analytics (AI)
                </h2>
                <p className="text-muted-foreground">
                    Generate predictive traffic reports for proposals and post-campaign analysis.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Report Configuration</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Media Asset</label>
                        <select
                            className="w-full rounded-md border border-gray-300 p-2"
                            value={selectedBillboardId}
                            onChange={(e) => {
                                setSelectedBillboardId(e.target.value);
                                setReport(null);
                            }}
                        >
                            {billboards.map(b => (
                                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Campaign Date</label>
                        <input
                            type="date"
                            className="w-full rounded-md border border-gray-300 p-2"
                            value={date}
                            onChange={(e) => {
                                setDate(e.target.value);
                                setReport(null);
                            }}
                        />
                    </div>
                    <div className="flex items-end">
                        <Button
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                            onClick={handleGenerate}
                            disabled={converting || !selectedBillboardId}
                        >
                            {converting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : 'Generate AI Report'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {report && selectedBillboard && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">

                    {/* Report Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${reportType.includes('Forecast') ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                {reportType}
                            </span>
                            {isToday && (
                                <span className="flex items-center gap-1 text-xs text-red-600 font-medium animate-pulse">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                    Live Projection
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Daily Traffic</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{report.dailyTotal.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">
                                    Base Volume: {selectedBillboard.trafficDaily?.toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Peak Hour Volume</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-teal-600">{report.peakVolume.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">
                                    at {report.peakHour}:00 ({report.peakHour < 12 ? 'AM' : 'PM'})
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Congestion Impact</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600">+{report.congestionImpactScore}%</div>
                                <p className="text-xs text-muted-foreground">
                                    Impression Bonus from Dwell Time
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Profile Type</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold capitalize">{selectedBillboard.trafficProfile || 'Commuter'}</div>
                                <p className="text-xs text-muted-foreground">
                                    Behavior Model Used
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Graphs */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Hourly Traffic & Congestion</CardTitle>
                                <CardDescription>Volume (Bars) vs Impression Quality (Line)</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={report.hourlyBreakdown}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="hour" fontSize={12} tickFormatter={(val) => `${val}:00`} />
                                        <YAxis fontSize={12} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            labelFormatter={(val) => `${val}:00`}
                                        />
                                        <Legend />
                                        <Bar dataKey="trafficVolume" name="Traffic Vol" fill="#0d9488" radius={[4, 4, 0, 0]} />
                                        {isToday && (
                                            <ReferenceLine x={currentHour} stroke="red" strokeDasharray="3 3" label="Now" />
                                        )}
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Impression Quality Score</CardTitle>
                                <CardDescription>Higher score = Slower traffic (Better Visibility)</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={report.hourlyBreakdown}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="hour" fontSize={12} tickFormatter={(val) => `${val}:00`} />
                                        <YAxis fontSize={12} />
                                        <Tooltip labelFormatter={(val) => `${val}:00`} />
                                        <Legend />
                                        <Line type="monotone" dataKey="impressionScore" name="Impression Score" stroke="#f59e0b" strokeWidth={3} dot={false} />
                                        <Line type="monotone" dataKey="trafficVolume" name="Raw Volume" stroke="#cbd5e1" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                        {isToday && (
                                            <ReferenceLine x={currentHour} stroke="red" strokeDasharray="3 3" label="Now" />
                                        )}
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Hourly Data Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Peak Analysis (Top Hours)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-700 font-semibold uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Time</th>
                                            <th className="px-4 py-3">Traffic Volume</th>
                                            <th className="px-4 py-3">Congestion</th>
                                            <th className="px-4 py-3">Speed (km/h)</th>
                                            <th className="px-4 py-3">Impression Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {[...report.hourlyBreakdown]
                                            .sort((a, b) => b.impressionScore - a.impressionScore)
                                            .slice(0, 8) // Top 8 hours
                                            .map((hour) => (
                                                <tr key={hour.hour} className="hover:bg-gray-50/50">
                                                    <td className="px-4 py-3 font-medium">{hour.hour}:00 - {hour.hour + 1}:00</td>
                                                    <td className="px-4 py-3">{hour.trafficVolume.toLocaleString()}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${hour.congestionLevel === 'Severe' ? 'bg-red-100 text-red-800' :
                                                            hour.congestionLevel === 'High' ? 'bg-orange-100 text-orange-800' :
                                                                hour.congestionLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-green-100 text-green-800'
                                                            }`}>
                                                            {hour.congestionLevel}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500">{hour.averageSpeed} km/h</td>
                                                    <td className="px-4 py-3 font-bold text-teal-600">{hour.impressionScore.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button variant="outline" onClick={() => window.print()}>
                            Export PDF Report
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
