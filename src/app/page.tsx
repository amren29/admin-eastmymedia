'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Map, FileText, Users, TrendingUp, Plus, ArrowRight } from 'lucide-react';

interface DashboardStats {
  totalMedia: number;
  activeProposals: number;
  totalCustomers: number;
  revenue: number;
}

interface RecentProposal {
  id: string;
  clientName: string;
  createdAt: string;
  status: string;
}

const FINANCIAL_ROLES = ['administrator', 'director', 'chief', 'manager'];

export default function DashboardPage() {
  const { userData } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMedia: 0,
    activeProposals: 0,
    totalCustomers: 0,
    revenue: 0,
  });
  const [recentProposals, setRecentProposals] = useState<RecentProposal[]>([]);
  const [loading, setLoading] = useState(true);

  const canViewFinancials = userData
    ? FINANCIAL_ROLES.includes(userData.role)
    : false;

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [mediaRes, customersRes, proposalsRes] = await Promise.all([
          supabase
            .from('billboards')
            .select('id', { count: 'exact', head: true }),
          supabase
            .from('customers')
            .select('id', { count: 'exact', head: true }),
          supabase
            .from('proposals')
            .select('*'),
        ]);

        const proposals = proposalsRes.data || [];
        const activeProposals = proposals.filter(
          (p: any) => p.status !== 'draft'
        ).length;
        const totalRevenue = proposals.reduce(
          (sum: number, p: any) => sum + (Number(p.total_amount) || 0),
          0
        );

        setStats({
          totalMedia: mediaRes.count ?? 0,
          totalCustomers: customersRes.count ?? 0,
          activeProposals,
          revenue: totalRevenue,
        });

        const recent = [...proposals]
          .sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          .slice(0, 5);

        setRecentProposals(
          recent.map((p: any) => ({
            id: p.id,
            clientName: p.client_name || 'Unknown',
            createdAt: p.created_at,
            status: p.status || 'draft',
          }))
        );
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [canViewFinancials]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Media',
      value: stats.totalMedia,
      icon: <Map className="h-6 w-6 text-blue-600" />,
      bg: 'bg-blue-50',
      show: true,
    },
    {
      label: 'Active Proposals',
      value: stats.activeProposals,
      icon: <FileText className="h-6 w-6 text-amber-600" />,
      bg: 'bg-amber-50',
      show: true,
    },
    {
      label: 'Total Customers',
      value: stats.totalCustomers,
      icon: <Users className="h-6 w-6 text-green-600" />,
      bg: 'bg-green-50',
      show: true,
    },
    {
      label: 'Revenue',
      value: `RM ${stats.revenue.toLocaleString()}`,
      icon: <TrendingUp className="h-6 w-6 text-purple-600" />,
      bg: 'bg-purple-50',
      show: canViewFinancials,
    },
  ];

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welcome back, {userData?.fullName || 'User'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards
          .filter((s) => s.show)
          .map((card) => (
            <div
              key={card.label}
              className="rounded-lg border bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {card.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>
                <div className={`rounded-lg p-3 ${card.bg}`}>{card.icon}</div>
              </div>
            </div>
          ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-lg border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
            <Link
              href="/proposals"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y">
            {recentProposals.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No proposals yet
              </div>
            ) : (
              recentProposals.map((proposal) => (
                <Link
                  key={proposal.id}
                  href={`/proposals/${proposal.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {proposal.clientName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[proposal.status] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {proposal.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(proposal.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Quick Actions
            </h2>
          </div>
          <div className="space-y-2 p-4">
            <Link
              href="/proposals/new"
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700"
            >
              <Plus className="h-5 w-5" />
              Create New Proposal
            </Link>
            <Link
              href="/media/new"
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-green-50 hover:border-green-200 hover:text-green-700"
            >
              <Plus className="h-5 w-5" />
              Add New Media
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
