'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';
import * as XLSX from 'xlsx';
import {
  Search,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Download,
  Upload,
  ChevronUp,
  ChevronDown,
  Filter,
  X,
} from 'lucide-react';

interface Media {
  id: string;
  skuId: string;
  name: string;
  location: string;
  region: string;
  type: string;
  code: string;
  price: number;
  availabilityStatus: string;
  verificationStatus: string;
  trafficProfile: string;
  image: string;
  width: number;
  height: number;
  unit: string;
  gps: string;
  district: string;
  landmark: string;
  targetMarket: string;
  traffic: string;
  description: string;
  totalPanel: number;
  panelNames: string[];
  operatingTime: string;
  durationPerAd: number;
  noOfAdvertiser: number;
  loopPerHr: number;
  minLoopPerDay: number;
  fileFormat: string;
  startPoint: string;
  endPoint: string;
  rentalRates: any[];
  createdAt: string;
  updatedAt: string;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface Filters {
  type: string;
  region: string;
  status: string;
  verification: string;
  price: string;
  size: string;
}

function mapRowToMedia(row: any): Media {
  return {
    id: row.id,
    skuId: row.sku_id || '',
    name: row.name || '',
    location: row.location || '',
    region: row.region || '',
    type: row.type || '',
    code: row.code || '',
    price: Number(row.price) || 0,
    availabilityStatus: row.availability_status || '',
    verificationStatus: row.verification_status || '',
    trafficProfile: row.traffic_profile || '',
    image: row.image || '',
    width: Number(row.width) || 0,
    height: Number(row.height) || 0,
    unit: row.unit || 'ft',
    gps: row.gps || '',
    district: row.district || '',
    landmark: row.landmark || '',
    targetMarket: row.target_market || '',
    traffic: row.traffic || '',
    description: row.description || '',
    totalPanel: Number(row.total_panel) || 1,
    panelNames: row.panel_names || [],
    operatingTime: row.operating_time || '',
    durationPerAd: Number(row.duration_per_ad) || 0,
    noOfAdvertiser: Number(row.no_of_advertiser) || 0,
    loopPerHr: Number(row.loop_per_hr) || 0,
    minLoopPerDay: Number(row.min_loop_per_day) || 0,
    fileFormat: row.file_format || '',
    startPoint: row.start_point || '',
    endPoint: row.end_point || '',
    rentalRates: row.rental_rates || [],
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  };
}

export default function MediaPage() {
  const { userData } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const isAdmin = userData?.role === 'administrator';

  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Filters>({
    type: '',
    region: '',
    status: '',
    verification: '',
    price: '',
    size: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'name',
    direction: 'asc',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('published');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('billboards')
        .select('*');

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      if (data) {
        setMedia(data.map(mapRowToMedia));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch media');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Filtering
  const matchesSearch = (item: Media): boolean => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      item.location.toLowerCase().includes(term) ||
      item.region.toLowerCase().includes(term) ||
      item.skuId.toLowerCase().includes(term) ||
      item.code.toLowerCase().includes(term) ||
      item.type.toLowerCase().includes(term)
    );
  };

  const matchesType = (item: Media): boolean => {
    if (!filters.type) return true;
    return item.type === filters.type;
  };

  const matchesRegion = (item: Media): boolean => {
    if (!filters.region) return true;
    return item.region === filters.region;
  };

  const matchesStatus = (item: Media): boolean => {
    if (!filters.status) return true;
    const status = filters.status.toLowerCase();
    if (status === 'available')
      return item.availabilityStatus.toLowerCase() === 'available';
    if (status === 'booked')
      return item.availabilityStatus.toLowerCase() === 'booked';
    if (status === 'tbc')
      return item.availabilityStatus.toLowerCase() === 'tbc';
    return true;
  };

  const matchesVerification = (item: Media): boolean => {
    if (!filters.verification) return true;
    return item.verificationStatus === filters.verification;
  };

  const matchesPrice = (item: Media): boolean => {
    if (!filters.price) return true;
    const p = item.price;
    switch (filters.price) {
      case 'under1000':
        return p < 1000;
      case '1000-5000':
        return p >= 1000 && p <= 5000;
      case '5000-10000':
        return p >= 5000 && p <= 10000;
      case 'over10000':
        return p > 10000;
      default:
        return true;
    }
  };

  const matchesSize = (item: Media): boolean => {
    if (!filters.size) return true;
    const area = item.width * item.height;
    switch (filters.size) {
      case 'small':
        return area < 100;
      case 'medium':
        return area >= 100 && area <= 500;
      case 'large':
        return area > 500;
      default:
        return true;
    }
  };

  const filteredMedia = media.filter(
    (item) =>
      matchesSearch(item) &&
      matchesType(item) &&
      matchesRegion(item) &&
      matchesStatus(item) &&
      matchesVerification(item) &&
      matchesPrice(item) &&
      matchesSize(item)
  );

  // Sorting
  const requestSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedMedia = [...filteredMedia].sort((a: any, b: any) => {
    const aVal = a[sortConfig.key] ?? '';
    const bVal = b[sortConfig.key] ?? '';
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedMedia.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedMedia.map((m) => m.id)));
    }
  };

  // Actions
  const handleApprove = async (id: string) => {
    const { error: updateError } = await supabase
      .from('billboards')
      .update({
        verification_status: 'published',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      showAlert('Error', updateError.message, 'danger');
    } else {
      showAlert('Success', 'Media approved successfully', 'success');
      fetchMedia();
    }
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) return;
    showConfirm(
      'Delete Media',
      'Are you sure you want to delete this media? This action cannot be undone.',
      async () => {
        const { error: deleteError } = await supabase
          .from('billboards')
          .delete()
          .eq('id', id);

        if (deleteError) {
          showAlert('Error', deleteError.message, 'danger');
        } else {
          showAlert('Success', 'Media deleted successfully', 'success');
          fetchMedia();
        }
      },
      'danger'
    );
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedIds.size === 0) return;
    const { error: updateError } = await supabase
      .from('billboards')
      .update({
        verification_status: bulkStatus,
        updated_at: new Date().toISOString(),
      })
      .in('id', [...selectedIds]);

    if (updateError) {
      showAlert('Error', updateError.message, 'danger');
    } else {
      showAlert(
        'Success',
        `${selectedIds.size} media updated successfully`,
        'success'
      );
      setSelectedIds(new Set());
      fetchMedia();
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0 || !isAdmin) return;
    showConfirm(
      'Bulk Delete',
      `Are you sure you want to delete ${selectedIds.size} media items? This action cannot be undone.`,
      async () => {
        const { error: deleteError } = await supabase
          .from('billboards')
          .delete()
          .in('id', [...selectedIds]);

        if (deleteError) {
          showAlert('Error', deleteError.message, 'danger');
        } else {
          showAlert(
            'Success',
            `${selectedIds.size} media deleted successfully`,
            'success'
          );
          setSelectedIds(new Set());
          fetchMedia();
        }
      },
      'danger'
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

      const rows = jsonData.map((row: any) => ({
        sku_id: row['SKU ID'] || row['sku_id'] || row['skuId'] || '',
        name: row['Name'] || row['name'] || '',
        location: row['Location'] || row['location'] || '',
        region: row['Region'] || row['region'] || '',
        type: row['Type'] || row['type'] || '',
        code: row['Code'] || row['code'] || '',
        price: Number(row['Price'] || row['price']) || 0,
        availability_status:
          row['Availability Status'] ||
          row['availability_status'] ||
          row['availabilityStatus'] ||
          'available',
        verification_status:
          row['Verification Status'] ||
          row['verification_status'] ||
          row['verificationStatus'] ||
          'draft',
        traffic_profile:
          row['Traffic Profile'] ||
          row['traffic_profile'] ||
          row['trafficProfile'] ||
          '',
        width: Number(row['Width'] || row['width']) || 0,
        height: Number(row['Height'] || row['height']) || 0,
        unit: row['Unit'] || row['unit'] || 'ft',
        gps: row['GPS'] || row['gps'] || '',
        district: row['District'] || row['district'] || '',
        landmark: row['Landmark'] || row['landmark'] || '',
        target_market:
          row['Target Market'] ||
          row['target_market'] ||
          row['targetMarket'] ||
          '',
        traffic: row['Traffic'] || row['traffic'] || '',
        description: row['Description'] || row['description'] || '',
        total_panel: Number(row['Total Panel'] || row['total_panel']) || 1,
        panel_names: row['Panel Names'] || row['panel_names'] || [],
        operating_time:
          row['Operating Time'] ||
          row['operating_time'] ||
          row['operatingTime'] ||
          '',
        duration_per_ad:
          Number(
            row['Duration Per Ad'] ||
              row['duration_per_ad'] ||
              row['durationPerAd']
          ) || 0,
        no_of_advertiser:
          Number(
            row['No Of Advertiser'] ||
              row['no_of_advertiser'] ||
              row['noOfAdvertiser']
          ) || 0,
        loop_per_hr:
          Number(
            row['Loop Per Hr'] || row['loop_per_hr'] || row['loopPerHr']
          ) || 0,
        min_loop_per_day:
          Number(
            row['Min Loop Per Day'] ||
              row['min_loop_per_day'] ||
              row['minLoopPerDay']
          ) || 0,
        file_format:
          row['File Format'] || row['file_format'] || row['fileFormat'] || '',
        start_point:
          row['Start Point'] ||
          row['start_point'] ||
          row['startPoint'] ||
          '',
        end_point:
          row['End Point'] || row['end_point'] || row['endPoint'] || '',
        rental_rates: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('billboards')
        .insert(rows);

      if (insertError) {
        showAlert('Import Error', insertError.message, 'danger');
      } else {
        showAlert(
          'Import Success',
          `${rows.length} media items imported successfully`,
          'success'
        );
        fetchMedia();
      }
    } catch (err: any) {
      showAlert('Import Error', err.message || 'Failed to import file', 'danger');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    const exportData = media.map((m) => ({
      'SKU ID': m.skuId,
      Name: m.name,
      Location: m.location,
      Region: m.region,
      Type: m.type,
      Code: m.code,
      Price: m.price,
      'Availability Status': m.availabilityStatus,
      'Verification Status': m.verificationStatus,
      'Traffic Profile': m.trafficProfile,
      Width: m.width,
      Height: m.height,
      Unit: m.unit,
      GPS: m.gps,
      District: m.district,
      Landmark: m.landmark,
      'Target Market': m.targetMarket,
      Traffic: m.traffic,
      Description: m.description,
      'Total Panel': m.totalPanel,
      'Operating Time': m.operatingTime,
      'Duration Per Ad': m.durationPerAd,
      'No Of Advertiser': m.noOfAdvertiser,
      'Loop Per Hr': m.loopPerHr,
      'Min Loop Per Day': m.minLoopPerDay,
      'File Format': m.fileFormat,
      'Start Point': m.startPoint,
      'End Point': m.endPoint,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Media');
    XLSX.writeFile(wb, `media_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Unique values for filter dropdowns
  const uniqueTypes = [...new Set(media.map((m) => m.type).filter(Boolean))];
  const uniqueRegions = [...new Set(media.map((m) => m.region).filter(Boolean))];

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="inline h-4 w-4" />
    ) : (
      <ChevronDown className="inline h-4 w-4" />
    );
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      booked: 'bg-red-100 text-red-800',
      tbc: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}
      >
        {status}
      </span>
    );
  };

  const approvalBadge = (status: string) => {
    const colors: Record<string, string> = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}
      >
        {status}
      </span>
    );
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      region: '',
      status: '',
      verification: '',
      price: '',
      size: '',
    });
    setSearchTerm('');
  };

  const hasActiveFilters = Object.values(filters).some(Boolean) || searchTerm;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media</h1>
          <p className="text-sm text-gray-500">
            {filteredMedia.length} of {media.length} media items
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {importing ? 'Importing...' : 'Import'}
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <Link
            href="/media/new"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Media
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, location, SKU, code, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${
              hasActiveFilters
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, type: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">All Types</option>
                {uniqueTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Region
              </label>
              <select
                value={filters.region}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, region: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">All Regions</option>
                {uniqueRegions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, status: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="tbc">TBC</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Verification
              </label>
              <select
                value={filters.verification}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, verification: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Price Range
              </label>
              <select
                value={filters.price}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, price: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">All Prices</option>
                <option value="under1000">Under RM 1,000</option>
                <option value="1000-5000">RM 1,000 - 5,000</option>
                <option value="5000-10000">RM 5,000 - 10,000</option>
                <option value="over10000">Over RM 10,000</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Size
              </label>
              <select
                value={filters.size}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, size: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">All Sizes</option>
                <option value="small">Small (&lt;100 sq)</option>
                <option value="medium">Medium (100-500 sq)</option>
                <option value="large">Large (&gt;500 sq)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="text-sm font-medium text-blue-800">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={handleBulkStatusUpdate}
              className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
            >
              Update Status
            </button>
          </div>
          {isAdmin && (
            <button
              onClick={handleBulkDelete}
              className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete Selected
            </button>
          )}
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    sortedMedia.length > 0 &&
                    selectedIds.size === sortedMedia.length
                  }
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th
                className="cursor-pointer px-3 py-3 text-left font-medium text-gray-600 hover:text-gray-900"
                onClick={() => requestSort('skuId')}
              >
                SKU <SortIcon column="skuId" />
              </th>
              <th
                className="cursor-pointer px-3 py-3 text-left font-medium text-gray-600 hover:text-gray-900"
                onClick={() => requestSort('name')}
              >
                Name <SortIcon column="name" />
              </th>
              <th
                className="cursor-pointer px-3 py-3 text-left font-medium text-gray-600 hover:text-gray-900"
                onClick={() => requestSort('location')}
              >
                Location <SortIcon column="location" />
              </th>
              <th
                className="cursor-pointer px-3 py-3 text-left font-medium text-gray-600 hover:text-gray-900"
                onClick={() => requestSort('type')}
              >
                Type <SortIcon column="type" />
              </th>
              <th
                className="cursor-pointer px-3 py-3 text-left font-medium text-gray-600 hover:text-gray-900"
                onClick={() => requestSort('price')}
              >
                Price <SortIcon column="price" />
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">
                Status
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">
                Approval
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedMedia.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-8 text-center text-gray-500"
                >
                  {hasActiveFilters
                    ? 'No media matching your filters'
                    : 'No media found'}
                </td>
              </tr>
            ) : (
              sortedMedia.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-gray-50 ${selectedIds.has(item.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-gray-500">
                    {item.skuId || '-'}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-3 font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-3 text-gray-600">
                    {item.location}
                  </td>
                  <td className="px-3 py-3 text-gray-600">{item.type}</td>
                  <td className="px-3 py-3 text-gray-600">
                    RM {item.price.toLocaleString()}
                  </td>
                  <td className="px-3 py-3">
                    {statusBadge(item.availabilityStatus || 'tbc')}
                  </td>
                  <td className="px-3 py-3">
                    {approvalBadge(item.verificationStatus || 'draft')}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/media/${item.id}`}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      {isAdmin &&
                        item.verificationStatus !== 'published' && (
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-green-600"
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
