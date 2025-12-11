"use client";

import { useState, useEffect } from 'react';
import { getBillboards, Billboard } from '@/lib/firestore-data';
import { generateTrafficReport, fetchTrafficReport, TrafficReport, fetchCampaignReport, CampaignReport } from '@/lib/ai-analytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, ReferenceLine, AreaChart, Area } from 'recharts';
import { Loader2, TrendingUp, AlertTriangle, Users, Calendar, Clock, BarChart2 } from 'lucide-react';


import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
    const [billboards, setBillboards] = useState<Billboard[]>([]);
    const [selectedBillboardId, setSelectedBillboardId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [converting, setConverting] = useState(false);
    const [report, setReport] = useState<TrafficReport | null>(null);
    const [campaignReport, setCampaignReport] = useState<CampaignReport | null>(null);
    const [open, setOpen] = useState(false); // State for Popover

    // Date Range State
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

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
        setReport(null);
        setCampaignReport(null);

        setTimeout(async () => {
            const traffic = billboard.trafficDaily || 50000;
            const profile = billboard.trafficProfile || 'commuter';

            if (startDate === endDate) {
                // Single Day Report
                const result = await fetchTrafficReport(traffic, profile, new Date(startDate), billboard.id);
                setReport(result);
            } else {
                // Multi-Day Campaign Report
                const result = await fetchCampaignReport(traffic, profile, new Date(startDate), new Date(endDate), billboard.id);
                setCampaignReport(result);
            }

            setConverting(false);
        }, 500);
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-teal-600" /></div>;

    const selectedBillboard = billboards.find(b => b.id === selectedBillboardId);
    const isSingleDay = startDate === endDate;

    // Determine Report Type labels
    const today = new Date().toISOString().split('T')[0];
    const isToday = startDate === today && endDate === today;
    const isProjection = startDate > today;

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
                <CardContent className="grid gap-6 md:grid-cols-4">
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">Select Media Asset</label>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="w-full justify-between truncate"
                                >
                                    <span className="truncate">
                                        {selectedBillboard
                                            ? `${selectedBillboard.name} (${selectedBillboard.code})`
                                            : "Select billboard..."}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search billboard..." />
                                    <CommandList className="max-h-[300px]">
                                        <CommandEmpty>No billboard found.</CommandEmpty>
                                        <CommandGroup>
                                            {billboards.map((b) => (
                                                <CommandItem
                                                    key={b.id}
                                                    value={b.name}
                                                    onSelect={() => {
                                                        setSelectedBillboardId(b.id);
                                                        setReport(null);
                                                        setCampaignReport(null);
                                                        setOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedBillboardId === b.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <span className="truncate capitalize">
                                                        {b.name.toLowerCase()} <span className="text-muted-foreground ml-1 normal-case">({b.code})</span>
                                                    </span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Start Date</label>
                        <input
                            type="date"
                            className="w-full rounded-md border border-gray-300 p-2"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                // Auto-adjust end date if needed
                                if (e.target.value > endDate) setEndDate(e.target.value);
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">End Date</label>
                        <input
                            type="date"
                            className="w-full rounded-md border border-gray-300 p-2"
                            value={endDate}
                            min={startDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-4 flex justify-end">
                        <Button
                            className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white min-w-[200px]"
                            onClick={handleGenerate}
                            disabled={converting || !selectedBillboardId}
                        >
                            {converting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : 'Generate Report'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* SINGLE DAY VIEW */}
            {report && selectedBillboard && isSingleDay && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    {/* (Existing Single Day Layout - Preserved) */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-700">
                                {isProjection ? 'Predictive Forecast' : 'Daily Analysis'}
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
                                <p className="text-xs text-muted-foreground">Impression Bonus</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Profile Type</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold capitalize">{selectedBillboard.trafficProfile || 'Commuter'}</div>
                                <p className="text-xs text-muted-foreground">Behavior Model</p>
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
                                            <ReferenceLine x={new Date().getHours()} stroke="red" strokeDasharray="3 3" label="Now" />
                                        )}
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Impression Quality Score</CardTitle>
                                <CardDescription>Score based on volume + dwell time</CardDescription>
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
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* MULTI DAY CAMPAIGN VIEW */}
            {campaignReport && selectedBillboard && !isSingleDay && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-purple-100 text-purple-700">
                                Multi-Day Campaign Analysis
                            </span>
                            <span className="text-sm text-gray-500">
                                {campaignReport.startDate} to {campaignReport.endDate}
                            </span>
                        </div>
                    </div>

                    {/* Campaign Summary */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-slate-50 border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">Total Campaign Traffic</CardTitle>
                                <Users className="h-4 w-4 text-slate-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900">{campaignReport.totalCampaignVolume.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">Aggregated Volume</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
                                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-teal-600">{campaignReport.averageDailyVolume.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">Vs Base: {selectedBillboard.trafficDaily?.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Busiest Day</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-purple-600">{campaignReport.peakDay}</div>
                                <p className="text-xs text-muted-foreground">{campaignReport.peakDayVolume.toLocaleString()} vehicles</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Impression Score</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600">{campaignReport.totalImpressionScore.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">Cumulative Value</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Daily Trend Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Traffic Trend</CardTitle>
                            <CardDescription>Volume fluctuation over the campaign period</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={campaignReport.dailyTrend}>
                                    <defs>
                                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis
                                        dataKey="date"
                                        fontSize={12}
                                        tickFormatter={(val) => val.split('-').slice(1).join('/')} // Show MM/DD
                                    />
                                    <YAxis fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="totalVolume" name="Daily Volume" stroke="#0d9488" fillOpacity={1} fill="url(#colorVolume)" />
                                    <Line type="monotone" dataKey="impressionScore" name="Impression Score" stroke="#f59e0b" strokeWidth={2} dot={true} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Daily Breakdown Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-700 font-semibold uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Total Volume</th>
                                            <th className="px-4 py-3">Traffic Condition</th>
                                            <th className="px-4 py-3">Avg Speed</th>
                                            <th className="px-4 py-3">Performance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {campaignReport.dailyTrend.map((day) => (
                                            <tr key={day.date} className="hover:bg-gray-50/50">
                                                <td className="px-4 py-3 font-medium">{day.date}</td>
                                                <td className="px-4 py-3">{day.totalVolume.toLocaleString()}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${day.avgCongestion === 'Severe' ? 'bg-red-100 text-red-800' :
                                                        day.avgCongestion === 'High' ? 'bg-orange-100 text-orange-800' :
                                                            day.avgCongestion === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-green-100 text-green-800'
                                                        }`}>
                                                        {day.avgCongestion || 'Low'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500">{day.avgSpeed} km/h</td>
                                                <td className="px-4 py-3 font-bold text-teal-600">{day.impressionScore.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button variant="outline" onClick={() => window.print()}>
                            Export Campaign Report (PDF)
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
