'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';
import MapPicker from '@/components/MapPicker';
import {
  Save,
  Send,
  Globe,
  Plus,
  Trash2,
  Upload,
  X,
  MapPin,
  Image as ImageIcon,
} from 'lucide-react';

interface RentalRate {
  id: string;
  duration: string;
  rentalPrice: number;
  productionCost: number;
  sst: number;
  total: number;
  discount: number;
  rateType: string;
  targetPanel: string;
}

interface FormData {
  skuId: string;
  name: string;
  location: string;
  type: 'Static' | 'LED Screen' | 'Roadside Bunting' | 'Car Wrap';
  available: boolean;
  availabilityStatus: string;
  verificationStatus: string;
  totalPanel: number;
  panelNames: string[];
  width: number;
  height: number;
  unit: string;
  image: string;
  operatingTime: string;
  durationPerAd: number;
  noOfAdvertiser: number;
  loopPerHr: number;
  minLoopPerDay: number;
  fileFormat: string;
  description: string;
  gps: string;
  startPoint: string;
  endPoint: string;
  district: string;
  landmark: string;
  targetMarket: string;
  traffic: string;
  trafficProfile: string;
  rentalRates: RentalRate[];
  region: string;
  code: string;
}

const INITIAL_FORM: FormData = {
  skuId: '',
  name: '',
  location: '',
  type: 'Static',
  available: true,
  availabilityStatus: 'available',
  verificationStatus: 'draft',
  totalPanel: 1,
  panelNames: [],
  width: 0,
  height: 0,
  unit: 'ft',
  image: '',
  operatingTime: '',
  durationPerAd: 0,
  noOfAdvertiser: 0,
  loopPerHr: 0,
  minLoopPerDay: 0,
  fileFormat: '',
  description: '',
  gps: '',
  startPoint: '',
  endPoint: '',
  district: '',
  landmark: '',
  targetMarket: '',
  traffic: '',
  trafficProfile: '',
  rentalRates: [],
  region: '',
  code: '',
};

const TARGET_MARKET_SUGGESTIONS = [
  'Urban commuters',
  'Highway travelers',
  'Residential area',
  'Commercial district',
  'Shopping mall visitors',
  'Industrial zone workers',
  'University students',
  'Tourist area',
  'Airport travelers',
  'Public transport users',
];

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11);
}

export default function MediaFormPage({
  params,
}: {
  params?: Promise<{ id?: string }>;
}) {
  const resolvedParams = params ? use(params) : { id: undefined };
  const isEditMode = !!resolvedParams.id;
  const router = useRouter();
  const { userData } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const isAdmin = userData?.role === 'administrator';

  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showMapPicker, setShowMapPicker] = useState<
    'gps' | 'startPoint' | 'endPoint' | null
  >(null);
  const [showTargetSuggestions, setShowTargetSuggestions] = useState(false);

  const uploadCancelledRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing media data
  useEffect(() => {
    if (!isEditMode || !resolvedParams.id) return;

    async function fetchMedia() {
      const { data, error } = await supabase
        .from('billboards')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (error || !data) {
        showAlert('Error', 'Media not found', 'danger');
        router.push('/media');
        return;
      }

      setFormData({
        skuId: data.sku_id || '',
        name: data.name || '',
        location: data.location || '',
        type: data.type || 'Static',
        available: data.available !== false,
        availabilityStatus: data.availability_status || 'available',
        verificationStatus: data.verification_status || 'draft',
        totalPanel: Number(data.total_panel) || 1,
        panelNames: data.panel_names || [],
        width: Number(data.width) || 0,
        height: Number(data.height) || 0,
        unit: data.unit || 'ft',
        image: data.image || '',
        operatingTime: data.operating_time || '',
        durationPerAd: Number(data.duration_per_ad) || 0,
        noOfAdvertiser: Number(data.no_of_advertiser) || 0,
        loopPerHr: Number(data.loop_per_hr) || 0,
        minLoopPerDay: Number(data.min_loop_per_day) || 0,
        fileFormat: data.file_format || '',
        description: data.description || '',
        gps: data.gps || '',
        startPoint: data.start_point || '',
        endPoint: data.end_point || '',
        district: data.district || '',
        landmark: data.landmark || '',
        targetMarket: data.target_market || '',
        traffic: data.traffic || '',
        trafficProfile: data.traffic_profile || '',
        rentalRates: (data.rental_rates || []).map((r: any) => ({
          id: r.id || generateId(),
          duration: r.duration || '',
          rentalPrice: Number(r.rentalPrice ?? r.rental_price) || 0,
          productionCost: Number(r.productionCost ?? r.production_cost) || 0,
          sst: Number(r.sst) || 0,
          total: Number(r.total) || 0,
          discount: Number(r.discount) || 0,
          rateType: r.rateType ?? r.rate_type ?? '',
          targetPanel: r.targetPanel ?? r.target_panel ?? '',
        })),
        region: data.region || '',
        code: data.code || '',
      });
      setLoading(false);
    }

    fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, resolvedParams.id]);

  // Field update helper
  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Image upload with compression
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    uploadCancelledRef.current = false;

    try {
      // Compress image
      const img = document.createElement('img');
      const objectUrl = URL.createObjectURL(file);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = objectUrl;
      });

      const maxDim = 1920;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(objectUrl);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to compress image'));
          },
          'image/jpeg',
          0.9
        );
      });

      if (uploadCancelledRef.current) {
        setUploading(false);
        return;
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        if (uploadCancelledRef.current) {
          clearInterval(progressInterval);
          return;
        }
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `media/${Date.now()}_${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadCancelledRef.current) {
        setUploading(false);
        return;
      }

      if (uploadError) {
        showAlert('Upload Error', uploadError.message, 'danger');
        setUploading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('media').getPublicUrl(filePath);

      setUploadProgress(100);
      updateField('image', publicUrl);

      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err: any) {
      if (!uploadCancelledRef.current) {
        showAlert(
          'Upload Error',
          err.message || 'Failed to upload image',
          'danger'
        );
      }
      setUploading(false);
      setUploadProgress(0);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cancelUpload = () => {
    uploadCancelledRef.current = true;
    setUploading(false);
    setUploadProgress(0);
  };

  // Rental rates
  const addRentalRate = () => {
    const newRate: RentalRate = {
      id: generateId(),
      duration: '1 Month',
      rentalPrice: 0,
      productionCost: 0,
      sst: 0,
      total: 0,
      discount: 0,
      rateType: 'standard',
      targetPanel: '',
    };
    updateField('rentalRates', [...formData.rentalRates, newRate]);
  };

  const removeRentalRate = (id: string) => {
    updateField(
      'rentalRates',
      formData.rentalRates.filter((r) => r.id !== id)
    );
  };

  const updateRentalRate = (
    id: string,
    field: keyof RentalRate,
    value: any
  ) => {
    updateField(
      'rentalRates',
      formData.rentalRates.map((r) => {
        if (r.id !== id) return r;

        const updated = { ...r, [field]: value };
        const rentalPrice = Number(updated.rentalPrice) || 0;
        const productionCost = Number(updated.productionCost) || 0;
        const subtotal = rentalPrice + productionCost;

        // SST 8%
        updated.sst = Math.round(subtotal * 0.08 * 100) / 100;

        // Discount by rate type
        let discountRate = 0;
        switch (updated.rateType) {
          case 'bulk':
            discountRate = 0.15;
            break;
          case 'annual':
            discountRate = 0.2;
            break;
          case 'quarterly':
            discountRate = 0.1;
            break;
          case 'long-term':
            discountRate = 0.25;
            break;
          default:
            discountRate = 0;
        }
        updated.discount =
          Math.round(subtotal * discountRate * 100) / 100;
        updated.total =
          Math.round(
            (subtotal + updated.sst - updated.discount) * 100
          ) / 100;

        return updated;
      })
    );
  };

  // Panel names
  const updatePanelName = (index: number, value: string) => {
    const names = [...formData.panelNames];
    names[index] = value;
    updateField('panelNames', names);
  };

  // Ensure panelNames array length matches totalPanel
  useEffect(() => {
    if (formData.totalPanel > 1) {
      const current = formData.panelNames.length;
      if (current < formData.totalPanel) {
        const newNames = [...formData.panelNames];
        for (let i = current; i < formData.totalPanel; i++) {
          newNames.push(`Panel ${i + 1}`);
        }
        updateField('panelNames', newNames);
      } else if (current > formData.totalPanel) {
        updateField(
          'panelNames',
          formData.panelNames.slice(0, formData.totalPanel)
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.totalPanel]);

  // Target market suggestions based on GPS
  const getTargetSuggestions = (): string[] => {
    if (!formData.gps) return TARGET_MARKET_SUGGESTIONS;
    // Simple heuristic based on GPS presence
    return TARGET_MARKET_SUGGESTIONS;
  };

  // Map picker handlers
  const handleMapSelect = (lat: number, lng: number) => {
    const coordStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    if (showMapPicker === 'gps') {
      updateField('gps', coordStr);
    } else if (showMapPicker === 'startPoint') {
      updateField('startPoint', coordStr);
    } else if (showMapPicker === 'endPoint') {
      updateField('endPoint', coordStr);
    }
  };

  const parseGpsCoords = (
    gps: string
  ): { lat: number; lng: number } | null => {
    if (!gps) return null;
    const parts = gps.split(',').map((s) => parseFloat(s.trim()));
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
    return null;
  };

  // Submit
  const handleSubmit = async (
    submitType: 'draft' | 'submit' | 'publish'
  ) => {
    if (!formData.name.trim()) {
      showAlert('Validation Error', 'Name is required', 'warning');
      return;
    }

    setSaving(true);

    try {
      // Parse GPS
      let lat: number | null = null;
      let lng: number | null = null;
      const gpsCoords = parseGpsCoords(formData.gps);
      if (gpsCoords) {
        lat = gpsCoords.lat;
        lng = gpsCoords.lng;
      }

      // Get base price from first rental rate
      const basePrice =
        formData.rentalRates.length > 0
          ? formData.rentalRates[0].rentalPrice
          : 0;

      // Determine verification status based on role and submit type
      let finalStatus = formData.verificationStatus;
      if (submitType === 'draft') {
        finalStatus = 'draft';
      } else if (submitType === 'submit') {
        finalStatus = 'pending';
      } else if (submitType === 'publish') {
        finalStatus = isAdmin ? 'published' : 'pending';
      }

      const dbData: any = {
        sku_id: formData.skuId,
        name: formData.name,
        location: formData.location,
        type: formData.type,
        available: formData.available,
        availability_status: formData.availabilityStatus,
        verification_status: finalStatus,
        total_panel: formData.totalPanel,
        panel_names: formData.panelNames,
        width: formData.width,
        height: formData.height,
        unit: formData.unit,
        image: formData.image,
        operating_time: formData.operatingTime,
        duration_per_ad: formData.durationPerAd,
        no_of_advertiser: formData.noOfAdvertiser,
        loop_per_hr: formData.loopPerHr,
        min_loop_per_day: formData.minLoopPerDay,
        file_format: formData.fileFormat,
        description: formData.description,
        gps: formData.gps,
        lat,
        lng,
        start_point: formData.startPoint,
        end_point: formData.endPoint,
        district: formData.district,
        landmark: formData.landmark,
        target_market: formData.targetMarket,
        traffic: formData.traffic,
        traffic_profile: formData.trafficProfile,
        rental_rates: formData.rentalRates,
        region: formData.region,
        code: formData.code,
        price: basePrice,
        updated_at: new Date().toISOString(),
      };

      if (isEditMode && resolvedParams.id) {
        const { error } = await supabase
          .from('billboards')
          .update(dbData)
          .eq('id', resolvedParams.id);

        if (error) {
          showAlert('Error', error.message, 'danger');
          setSaving(false);
          return;
        }

        showAlert('Success', 'Media updated successfully', 'success');
      } else {
        dbData.created_at = new Date().toISOString();
        const { error } = await supabase.from('billboards').insert(dbData);

        if (error) {
          showAlert('Error', error.message, 'danger');
          setSaving(false);
          return;
        }

        showAlert('Success', 'Media created successfully', 'success');
      }

      router.push('/media');
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to save media', 'danger');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  const isLED = formData.type === 'LED Screen';
  const isBunting = formData.type === 'Roadside Bunting';
  const isCarWrap = formData.type === 'Car Wrap';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Media' : 'Add New Media'}
          </h1>
          <p className="text-sm text-gray-500">
            {isEditMode
              ? 'Update media information'
              : 'Fill in the details to add new media'}
          </p>
        </div>
        <button
          onClick={() => router.push('/media')}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      {/* Basic Info */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Basic Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              SKU ID
            </label>
            <input
              type="text"
              value={formData.skuId}
              onChange={(e) => updateField('skuId', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., EMM-001"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Media name"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => updateField('type', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Static">Static</option>
              <option value="LED Screen">LED Screen</option>
              <option value="Roadside Bunting">Roadside Bunting</option>
              <option value="Car Wrap">Car Wrap</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Code
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => updateField('code', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Media code"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => updateField('location', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Full address or location description"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Region
            </label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) => updateField('region', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Selangor, KL"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Availability Status
            </label>
            <select
              value={formData.availabilityStatus}
              onChange={(e) =>
                updateField('availabilityStatus', e.target.value)
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="tbc">TBC</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Description of the media"
            />
          </div>
        </div>
      </div>

      {/* Image Upload */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Media Image
        </h2>
        <div className="space-y-3">
          {formData.image && (
            <div className="relative inline-block">
              <img
                src={formData.image}
                alt="Media"
                className="h-48 w-auto rounded-lg border object-cover"
              />
              <button
                onClick={() => updateField('image', '')}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            {uploading ? (
              <div className="space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Uploading... {uploadProgress}%
                  </span>
                  <button
                    onClick={cancelUpload}
                    className="text-red-600 hover:text-red-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Upload className="h-4 w-4" />
                {formData.image ? 'Change Image' : 'Upload Image'}
              </button>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Or enter image URL
            </label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => updateField('image', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Dimensions & Panels */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Dimensions & Panels
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Width
            </label>
            <input
              type="number"
              value={formData.width || ''}
              onChange={(e) =>
                updateField('width', Number(e.target.value) || 0)
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0"
              min={0}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Height
            </label>
            <input
              type="number"
              value={formData.height || ''}
              onChange={(e) =>
                updateField('height', Number(e.target.value) || 0)
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0"
              min={0}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Unit
            </label>
            <select
              value={formData.unit}
              onChange={(e) => updateField('unit', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ft">Feet (ft)</option>
              <option value="m">Meters (m)</option>
              <option value="cm">Centimeters (cm)</option>
              <option value="inch">Inches (inch)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Total Panels
            </label>
            <input
              type="number"
              value={formData.totalPanel}
              onChange={(e) =>
                updateField(
                  'totalPanel',
                  Math.max(1, Number(e.target.value) || 1)
                )
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              min={1}
            />
          </div>
        </div>

        {/* Panel Names Editor */}
        {formData.totalPanel > 1 && (
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Panel Names
            </label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {formData.panelNames.map((name, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={name}
                  onChange={(e) => updatePanelName(idx, e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={`Panel ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Screen Info (LED Screen only) */}
      {isLED && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Screen Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Operating Time
              </label>
              <input
                type="text"
                value={formData.operatingTime}
                onChange={(e) =>
                  updateField('operatingTime', e.target.value)
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., 6:00 AM - 12:00 AM"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Duration Per Ad (seconds)
              </label>
              <input
                type="number"
                value={formData.durationPerAd || ''}
                onChange={(e) =>
                  updateField('durationPerAd', Number(e.target.value) || 0)
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                min={0}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                No. of Advertisers
              </label>
              <input
                type="number"
                value={formData.noOfAdvertiser || ''}
                onChange={(e) =>
                  updateField(
                    'noOfAdvertiser',
                    Number(e.target.value) || 0
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                min={0}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Loops Per Hour
              </label>
              <input
                type="number"
                value={formData.loopPerHr || ''}
                onChange={(e) =>
                  updateField('loopPerHr', Number(e.target.value) || 0)
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                min={0}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Min Loops Per Day
              </label>
              <input
                type="number"
                value={formData.minLoopPerDay || ''}
                onChange={(e) =>
                  updateField(
                    'minLoopPerDay',
                    Number(e.target.value) || 0
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                min={0}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                File Format
              </label>
              <input
                type="text"
                value={formData.fileFormat}
                onChange={(e) =>
                  updateField('fileFormat', e.target.value)
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., MP4, JPG"
              />
            </div>
          </div>
        </div>
      )}

      {/* Location & GPS */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Location & GPS
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              GPS Coordinates
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.gps}
                onChange={(e) => updateField('gps', e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="lat, lng (e.g., 3.1390, 101.6869)"
              />
              <button
                onClick={() => setShowMapPicker('gps')}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <MapPin className="h-4 w-4" />
                Pick
              </button>
            </div>
          </div>

          {/* Start/End Point for Roadside Bunting */}
          {isBunting && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Start Point
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.startPoint}
                    onChange={(e) =>
                      updateField('startPoint', e.target.value)
                    }
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="lat, lng"
                  />
                  <button
                    onClick={() => setShowMapPicker('startPoint')}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <MapPin className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  End Point
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.endPoint}
                    onChange={(e) =>
                      updateField('endPoint', e.target.value)
                    }
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="lat, lng"
                  />
                  <button
                    onClick={() => setShowMapPicker('endPoint')}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <MapPin className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* District for Car Wrap */}
          {isCarWrap && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                District
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => updateField('district', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Operating district"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Landmark
            </label>
            <input
              type="text"
              value={formData.landmark}
              onChange={(e) => updateField('landmark', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Nearby landmark"
            />
          </div>
        </div>

        {/* Map Picker Modal */}
        {showMapPicker && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Pick location for:{' '}
                <span className="text-blue-600">
                  {showMapPicker === 'gps'
                    ? 'GPS'
                    : showMapPicker === 'startPoint'
                      ? 'Start Point'
                      : 'End Point'}
                </span>
              </span>
            </div>
            <MapPicker
              onSelect={handleMapSelect}
              initialLat={
                parseGpsCoords(
                  showMapPicker === 'gps'
                    ? formData.gps
                    : showMapPicker === 'startPoint'
                      ? formData.startPoint
                      : formData.endPoint
                )?.lat ?? 4.2105
              }
              initialLng={
                parseGpsCoords(
                  showMapPicker === 'gps'
                    ? formData.gps
                    : showMapPicker === 'startPoint'
                      ? formData.startPoint
                      : formData.endPoint
                )?.lng ?? 101.9758
              }
              onClose={() => setShowMapPicker(null)}
            />
          </div>
        )}
      </div>

      {/* Traffic & Target Market */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Traffic & Market
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Traffic
            </label>
            <input
              type="text"
              value={formData.traffic}
              onChange={(e) => updateField('traffic', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., High, Medium, Low"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Traffic Profile
            </label>
            <input
              type="text"
              value={formData.trafficProfile}
              onChange={(e) =>
                updateField('trafficProfile', e.target.value)
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., 50,000 vehicles/day"
            />
          </div>
          <div className="relative sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Target Market
            </label>
            <input
              type="text"
              value={formData.targetMarket}
              onChange={(e) =>
                updateField('targetMarket', e.target.value)
              }
              onFocus={() => setShowTargetSuggestions(true)}
              onBlur={() =>
                setTimeout(() => setShowTargetSuggestions(false), 200)
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Target audience"
            />
            {showTargetSuggestions && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                {getTargetSuggestions().map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const current = formData.targetMarket;
                      const newVal = current
                        ? `${current}, ${suggestion}`
                        : suggestion;
                      updateField('targetMarket', newVal);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rental Rates */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Rental Rates
          </h2>
          <button
            onClick={addRentalRate}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Rate
          </button>
        </div>

        {formData.rentalRates.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">
            No rental rates added yet. Click &quot;Add Rate&quot; to add one.
          </p>
        ) : (
          <div className="space-y-4">
            {formData.rentalRates.map((rate, idx) => (
              <div
                key={rate.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Rate #{idx + 1}
                  </span>
                  <button
                    onClick={() => removeRentalRate(rate.id)}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={rate.duration}
                      onChange={(e) =>
                        updateRentalRate(rate.id, 'duration', e.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g., 1 Month"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Rental Price (RM)
                    </label>
                    <input
                      type="number"
                      value={rate.rentalPrice || ''}
                      onChange={(e) =>
                        updateRentalRate(
                          rate.id,
                          'rentalPrice',
                          Number(e.target.value) || 0
                        )
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Production Cost (RM)
                    </label>
                    <input
                      type="number"
                      value={rate.productionCost || ''}
                      onChange={(e) =>
                        updateRentalRate(
                          rate.id,
                          'productionCost',
                          Number(e.target.value) || 0
                        )
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Rate Type
                    </label>
                    <select
                      value={rate.rateType}
                      onChange={(e) =>
                        updateRentalRate(rate.id, 'rateType', e.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="standard">Standard</option>
                      <option value="bulk">Bulk (15% off)</option>
                      <option value="quarterly">Quarterly (10% off)</option>
                      <option value="annual">Annual (20% off)</option>
                      <option value="long-term">Long-term (25% off)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Target Panel
                    </label>
                    <input
                      type="text"
                      value={rate.targetPanel}
                      onChange={(e) =>
                        updateRentalRate(
                          rate.id,
                          'targetPanel',
                          e.target.value
                        )
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g., Panel A"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      SST (8%)
                    </label>
                    <input
                      type="text"
                      value={`RM ${rate.sst.toFixed(2)}`}
                      readOnly
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Discount
                    </label>
                    <input
                      type="text"
                      value={`RM ${rate.discount.toFixed(2)}`}
                      readOnly
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Total
                    </label>
                    <input
                      type="text"
                      value={`RM ${rate.total.toFixed(2)}`}
                      readOnly
                      className="w-full rounded-md border border-gray-200 bg-green-50 px-2 py-1.5 text-sm font-medium text-green-700"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-6 shadow-sm">
        <button
          onClick={() => handleSubmit('draft')}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          Save Draft
        </button>
        <button
          onClick={() => handleSubmit('submit')}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Submit for Approval
        </button>
        {isAdmin && (
          <button
            onClick={() => handleSubmit('publish')}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Globe className="h-4 w-4" />
            Publish
          </button>
        )}
        {saving && (
          <span className="text-sm text-gray-500">Saving...</span>
        )}
      </div>
    </div>
  );
}
