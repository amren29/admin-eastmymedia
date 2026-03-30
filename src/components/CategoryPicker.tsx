"use client";

const CATEGORIES = [
  "Technology",
  "Marketing",
  "Business",
  "Industry News",
  "Case Studies",
  "Tips & Tricks",
  "Company Updates",
];

interface CategoryPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      <option value="">Select a category</option>
      {CATEGORIES.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>
  );
}
