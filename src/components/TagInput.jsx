import React, { useState, useRef } from "react";

export default function TagInput({ tags, setTags, placeholder = "Add a tag...", disabled = false }) {
  const [input, setInput] = useState("");
  const inputRef = useRef();

  // Prop validation for tags
  if (!Array.isArray(tags)) {
    console.warn("TagInput received invalid or undefined tags data.", tags);
    return <div>Loading tags...</div>;
  }

  const handleAddTag = (value) => {
    const cleaned = value.trim().replace(/,$/, "");
    if (cleaned && !tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
    }
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(input);
    } else if (e.key === "Backspace" && input === "") {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (index) => {
    if (!disabled) {
      setTags(tags.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="border p-2 rounded flex flex-wrap gap-2 mb-4 bg-white">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center text-sm"
        >
          #{tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-1 text-blue-500 hover:text-red-500"
            >
              ×
            </button>
          )}
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-grow min-w-[100px] outline-none text-sm p-1"
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
