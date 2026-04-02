import React, { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value = [], onChange, placeholder }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !value.includes(newTag)) {
        onChange([...value, newTag]);
      }
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      e.preventDefault();
      const newValues = [...value];
      newValues.pop();
      onChange(newValues);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 border border-border/50 bg-background/50 rounded-md min-h-[2.5rem] focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider bg-secondary/60 hover:bg-secondary/80 text-foreground/90 border border-border/50 py-1 pl-2 pr-1 rounded-sm">
          {tag}
          <button
            type="button"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-0.5 rounded-full transition-colors outline-none focus:ring-1 focus:ring-destructive"
            onClick={() => removeTag(tag)}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[140px] text-sm font-mono h-7 px-1"
      />
    </div>
  );
}
