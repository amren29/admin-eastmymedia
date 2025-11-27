"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, Map, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { userData } = useAuth();
  const [stats, setStats] = useState([
    { name: 'Total Media', value: '...', icon: Map, change: '-', changeType: 'neutral' },
    { name: 'Active Proposals', value: '...', icon: FileText, change: '-', changeType: 'neutral' },
    { name: 'Total Customers', value: '...', icon: Users, change: '-', changeType: 'neutral' },
    { name: 'Revenue (Est)', value: '...', icon: TrendingUp, change: '-', changeType: 'neutral' },
  ]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Define roles that can see financial data
  const canViewFinancials = userData?.role && ['administrator', 'director', 'chief', 'manager'].includes(userData.role.toLowerCase());

  useEffect(() => {
    fetchDashboardData();
  }, [userData]); // Re-fetch if user data changes (though mostly static)

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Counts
      const mediaSnap = await getDocs(collection(db, 'billboards'));
      const customersSnap = await getDocs(collection(db, 'customers'));
      const proposalsSnap = await getDocs(collection(db, 'proposals'));

      const totalMedia = mediaSnap.size;
      const totalCustomers = customersSnap.size;
      const totalProposals = proposalsSnap.size;

      // Calculate Revenue (Sum of totalAmount from proposals)
      let totalRevenue = 0;
      let activeProposals = 0;
      const recent: any[] = [];

      proposalsSnap.forEach(doc => {
        const data = doc.data();
        totalRevenue += Number(data.totalAmount) || 0;
        if (data.status !== 'draft') activeProposals++;
        recent.push({ id: doc.id, ...data });
      });

      // Sort recent by date desc
      recent.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const newStats = [
        { name: 'Total Media', value: totalMedia.toString(), icon: Map, change: 'Live', changeType: 'neutral' },
        { name: 'Active Proposals', value: activeProposals.toString(), icon: FileText, change: 'Live', changeType: 'neutral' },
        { name: 'Total Customers', value: totalCustomers.toString(), icon: Users, change: 'Live', changeType: 'neutral' },
      ];

      // Only add Revenue if allowed
      if (canViewFinancials) {
        newStats.push({ name: 'Revenue (Est)', value: `RM ${(totalRevenue / 1000).toFixed(1)}k`, icon: TrendingUp, change: 'Live', changeType: 'increase' });
      }

      setStats(newStats);
      setRecentActivity(recent.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your media business.</p>
      </div>

      <div className={`grid gap-4 md:grid-cols-2 ${canViewFinancials ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-gray-500">{stat.name}</h3>
                <Icon className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <span className="text-xs font-medium text-green-600">{stat.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500">Loading activity...</p>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500">No recent activity.</p>
            ) : (
              recentActivity.map((item) => (
                <div key={item.id} className="flex items-center border-b pb-4 last:border-0 last:pb-0">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      New proposal for <span className="font-semibold">{item.clientName}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {canViewFinancials && (
                    <div className="ml-auto font-medium text-sm">
                      RM {Number(item.totalAmount).toLocaleString()}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        <div className="col-span-3 rounded-xl bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/proposals/new" className="flex items-center justify-center w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Create New Proposal
            </Link>
            <Link href="/media/new" className="flex items-center justify-center w-full rounded-md bg-white shadow px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Add New Media
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
