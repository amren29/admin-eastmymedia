"use client";

import { useState } from "react";

const FORMATTING_ITEMS = [
  { syntax: "# Heading 1", description: "Large heading" },
  { syntax: "## Heading 2", description: "Medium heading" },
  { syntax: "### Heading 3", description: "Small heading" },
  { syntax: "**bold text**", description: "Bold" },
  { syntax: "*italic text*", description: "Italic" },
  { syntax: "[link text](url)", description: "Link" },
  { syntax: "![alt text](image-url)", description: "Image" },
  { syntax: "- item", description: "Unordered list" },
  { syntax: "1. item", description: "Ordered list" },
  { syntax: "> quote", description: "Blockquote" },
];

export default function FormattingHelp() {
  const [visible, setVisible] = useState(false);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="text-xs font-medium text-blue-600 hover:text-blue-800"
      >
        {visible ? "Hide formatting help" : "Show formatting help"}
      </button>
      {visible && (
        <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3">
          <p className="mb-2 text-xs font-semibold text-gray-600">
            Markdown Formatting
          </p>
          <div className="space-y-1">
            {FORMATTING_ITEMS.map((item) => (
              <div key={item.syntax} className="flex gap-4 text-xs">
                <code className="w-48 shrink-0 rounded bg-gray-200 px-1.5 py-0.5 font-mono text-gray-800">
                  {item.syntax}
                </code>
                <span className="text-gray-500">{item.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
