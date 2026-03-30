"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PackageItem,
  MediaItem,
  getMediaItems,
  createPackage,
  updatePackage,
} from "@/lib/packages";

interface PackageFormProps {
  initialData?: PackageItem;
  isEditing?: boolean;
}

export default function PackageForm({ initialData, isEditing }: PackageFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [validFrom, setValidFrom] = useState(initialData?.validFrom || "");
  const [validTo, setValidTo] = useState(initialData?.validTo || "");
  const [status, setStatus] = useState<"active" | "inactive">(
    initialData?.status || "active"
  );
  const [packagePrice, setPackagePrice] = useState<number>(
    initialData?.packagePrice || 0
  );
  const [image, setImage] = useState(initialData?.image || "");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    initialData?.items || []
  );

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaSearch, setMediaSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(true);

  useEffect(() => {
    const fetchMedia = async () => {
      const items = await getMediaItems();
      setMediaItems(items);
      setLoadingMedia(false);
    };
    fetchMedia();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `packages/${Date.now()}_${filename}`;

    const { error } = await supabase.storage.from("media").upload(path, file);

    if (error) {
      console.error("Error uploading image:", error);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(path);

    setImage(urlData.publicUrl);
    setUploading(false);
  };

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const removeItem = (id: string) => {
    setSelectedItemIds((prev) => prev.filter((i) => i !== id));
  };

  const standardTotal = selectedItemIds.reduce((sum, id) => {
    const item = mediaItems.find((m) => m.id === id);
    return sum + (item?.price || 0);
  }, 0);

  const filteredMedia = mediaItems.filter(
    (item) =>
      item.name?.toLowerCase().includes(mediaSearch.toLowerCase()) ||
      item.location?.toLowerCase().includes(mediaSearch.toLowerCase()) ||
      item.type?.toLowerCase().includes(mediaSearch.toLowerCase())
  );

  const selectedItems = mediaItems.filter((item) =>
    selectedItemIds.includes(item.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      name,
      description,
      validFrom,
      validTo,
      status,
      packagePrice,
      image,
      items: selectedItemIds,
      standardTotal,
    };

    let result;
    if (isEditing && initialData) {
      result = await updatePackage(initialData.id, data);
    } else {
      result = await createPackage(data);
    }

    if (result) {
      router.push("/packages");
    } else {
      console.error("Error saving package");
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/packages">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {isEditing ? "Edit Package" : "New Package"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as "active" | "inactive")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="validFrom">Valid From</Label>
            <Input
              id="validFrom"
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validTo">Valid To</Label>
            <Input
              id="validTo"
              type="date"
              value={validTo}
              onChange={(e) => setValidTo(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="packagePrice">Package Price (RM)</Label>
          <Input
            id="packagePrice"
            type="number"
            value={packagePrice}
            onChange={(e) => setPackagePrice(Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Image</Label>
          <div className="flex items-center gap-4">
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
            {uploading && <Loader2 className="h-5 w-5 animate-spin" />}
          </div>
          {image && (
            <div className="mt-2">
              <img
                src={image}
                alt="Preview"
                className="h-40 w-auto rounded-md border object-cover"
              />
            </div>
          )}
        </div>

        {/* Media Selector */}
        <div className="space-y-4 border rounded-lg p-4">
          <h3 className="text-lg font-semibold">Media Items</h3>

          <div className="flex items-center justify-between">
            <Input
              placeholder="Search media items..."
              value={mediaSearch}
              onChange={(e) => setMediaSearch(e.target.value)}
              className="max-w-sm"
            />
            <p className="text-sm text-gray-500">
              Standard Total:{" "}
              <span className="font-semibold">
                RM {standardTotal.toLocaleString()}
              </span>
            </p>
          </div>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Selected ({selectedItems.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                  >
                    {item.name}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="ml-1 hover:text-blue-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Items */}
          {loadingMedia ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto border rounded-md">
              {filteredMedia.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500">
                  No media items found.
                </p>
              ) : (
                filteredMedia.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 border-b px-4 py-2 hover:bg-gray-50 cursor-pointer last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItemIds.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.location} &middot; {item.type}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-600">
                      RM {item.price?.toLocaleString() || "0"}
                    </p>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? "Save Package" : "Create Package"}
          </Button>
        </div>
      </form>
    </div>
  );
}
