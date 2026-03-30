"use client";

import { useEffect, useState } from "react";
import { Loader2, ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBillboards } from "@/lib/firestore-data";
import {
  fetchTrafficReport,
  fetchCampaignReport,
  TrafficReport,
  CampaignReport,
} from "@/lib/ai-analytics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";
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
import { cn } from "@/lib/utils";

interface BillboardOption {
  id: string;
  name: string;
  trafficDaily: number;
  trafficProfile: string;
}

export default function ReportsPage() {
  const [billboards, setBillboards] = useState<BillboardOption[]>([]);
  const [selectedBillboard, setSelectedBillboard] =
    useState<BillboardOption | null>(null);
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingBillboards, setLoadingBillboards] = useState(true);

  const [trafficReport, setTrafficReport] = useState<TrafficReport | null>(
    null
  );
  const [campaignReport, setCampaignReport] = useState<CampaignReport | null>(
    null
  );

  useEffect(() => {
    const loadBillboards = async () => {
      const data = await getBillboards();
      setBillboards(
        data.map((b) => ({
          id: b.id,
          name: b.name,
          trafficDaily: b.trafficDaily || 5000,
          trafficProfile: b.trafficProfile || "commuter",
        }))
      );
      setLoadingBillboards(false);
    };
    loadBillboards();
  }, []);

  const handleGenerate = async () => {
    if (!selectedBillboard || !startDate || !endDate) return;

    setLoading(true);
    setTrafficReport(null);
    setCampaignReport(null);

    try {
      const [traffic, campaign] = await Promise.all([
        fetchTrafficReport(
          selectedBillboard.trafficDaily,
          selectedBillboard.trafficProfile,
          startDate,
          selectedBillboard.id
        ),
        fetchCampaignReport(
          selectedBillboard.id,
          selectedBillboard.name,
          selectedBillboard.trafficDaily,
          selectedBillboard.trafficProfile,
          startDate,
          endDate
        ),
      ]);

      setTrafficReport(traffic);
      setCampaignReport(campaign);
    } catch (err) {
      console.error("Error generating reports:", err);
    }

    setLoading(false);
  };

  const hourlyChartData =
    trafficReport?.hourlyBreakdown.map((h) => ({
      hour: `${h.hour.toString().padStart(2, "0")}:00`,
      trafficVolume: h.trafficVolume,
      impressionScore: h.impressionScore,
    })) || [];

  const dailyChartData =
    campaignReport?.dailyReports.map((d, i) => ({
      day: `Day ${i + 1}`,
      totalVolume: d.dailyTotal,
      impressionScore: d.hourlyBreakdown.reduce(
        (sum, h) => sum + h.impressionScore,
        0
      ),
    })) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="space-y-2">
          <Label>Billboard</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={loadingBillboards}
              >
                {selectedBillboard
                  ? selectedBillboard.name
                  : "Select billboard..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder="Search billboards..." />
                <CommandList>
                  <CommandEmpty>No billboard found.</CommandEmpty>
                  <CommandGroup>
                    {billboards.map((b) => (
                      <CommandItem
                        key={b.id}
                        value={b.name}
                        onSelect={() => {
                          setSelectedBillboard(b);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedBillboard?.id === b.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {b.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <Button
            onClick={handleGenerate}
            disabled={!selectedBillboard || !startDate || !endDate || loading}
            className="w-full"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Generate Report
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Stats Cards */}
      {trafficReport && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Daily Total</p>
              <p className="text-2xl font-bold">
                {trafficReport.dailyTotal.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Peak Hour</p>
              <p className="text-2xl font-bold">
                {trafficReport.peakHour.toString().padStart(2, "0")}:00
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Peak Volume</p>
              <p className="text-2xl font-bold">
                {trafficReport.peakVolume.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">Congestion Impact Score</p>
              <p className="text-2xl font-bold">
                {trafficReport.congestionImpactScore}
              </p>
            </div>
          </div>

          {/* Hourly Traffic BarChart */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">
              Hourly Traffic Breakdown
            </h2>
            <div className="rounded-lg border bg-white p-4">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={hourlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" fontSize={12} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="trafficVolume"
                    fill="#3b82f6"
                    name="Traffic Volume"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="impressionScore"
                    stroke="#f59e0b"
                    name="Impression Score"
                    strokeWidth={2}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Campaign Daily Trend */}
      {campaignReport && dailyChartData.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Campaign Daily Trend</h2>
          <div className="rounded-lg border bg-white p-4">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalVolume"
                  fill="#3b82f6"
                  fillOpacity={0.1}
                  stroke="#3b82f6"
                  name="Total Volume"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="impressionScore"
                  stroke="#f59e0b"
                  name="Impression Score"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
