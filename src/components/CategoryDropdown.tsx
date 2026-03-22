import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import type { Category } from '../types';

interface CategoryDropdownProps {
  categories: Category[];
  selectedId: number | null;
  suggestedId?: number | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  onSelect: (categoryId: number) => void;
  disabled?: boolean;
}

const confidenceColors = {
  high: 'bg-primary/10 text-primary',
  medium: 'bg-tertiary-container/30 text-tertiary',
  low: 'bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant',
  none: 'bg-surface-container text-on-surface-variant',
};

export function CategoryDropdown({
  categories,
  selectedId,
  suggestedId,
  confidence,
  onSelect,
  disabled,
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusIndex, setFocusIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = categories.find((c) => c.id === selectedId);
  const suggestedCategory = suggestedId
    ? categories.find((c) => c.id === suggestedId)
    : null;

  const filteredCategories = search
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : categories;

  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'income' ? -1 : 1;
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusIndex((prev) =>
            Math.min(prev + 1, sortedCategories.length - 1)
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          event.preventDefault();
          if (focusIndex >= 0 && sortedCategories[focusIndex]) {
            handleSelect(sortedCategories[focusIndex].id);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearch('');
          break;
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusIndex, sortedCategories]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (categoryId: number) => {
    onSelect(categoryId);
    setIsOpen(false);
    setSearch('');
    setFocusIndex(-1);
  };

  const handleButtonClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setFocusIndex(-1);
    }
  };

  const handleAcceptSuggestion = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (suggestedId) {
      onSelect(suggestedId);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleButtonClick}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          selectedCategory
            ? confidenceColors[confidence]
            : suggestedCategory
            ? `${confidenceColors[confidence]} cursor-pointer opacity-60 hover:opacity-100`
            : 'border border-dashed border-primary/40 text-primary hover:bg-primary/5'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {selectedCategory ? (
          <>
            <span>{selectedCategory.icon}</span>
            <span className="truncate max-w-[100px]">
              {selectedCategory.name}
            </span>
          </>
        ) : suggestedCategory ? (
          <span
            className="flex items-center gap-1"
            onClick={handleAcceptSuggestion}
            title="Click to accept suggestion"
          >
            <span>{suggestedCategory.icon}</span>
            <span className="truncate max-w-[80px]">
              {suggestedCategory.name}
            </span>
            <span className="text-[10px]">?</span>
          </span>
        ) : (
          <>
            <Plus className="w-3 h-3" strokeWidth={2} />
            <span>Add Category</span>
          </>
        )}
        <ChevronDown className="w-3 h-3 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-56 bg-surface-container-lowest rounded-2xl shadow-lg overflow-hidden editorial-shadow">
          <div className="p-2 border-b border-outline-variant/10">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setFocusIndex(0);
              }}
              placeholder="Type to filter..."
              className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-lg border-none focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {sortedCategories.length === 0 ? (
              <div className="px-3 py-3 text-sm text-on-surface-variant">
                No categories found
              </div>
            ) : (
              sortedCategories.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => handleSelect(category.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors ${
                    index === focusIndex
                      ? 'bg-primary-container/30'
                      : 'hover:bg-surface-container-low'
                  } ${category.id === selectedId ? 'bg-primary-container/20' : ''}`}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span className="flex-1 truncate">{category.name}</span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      category.type === 'income'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-error-container/10 text-error'
                    }`}
                  >
                    {category.type}
                  </span>
                  {category.id === selectedId && (
                    <Check className="w-4 h-4 text-primary" strokeWidth={2} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryDropdown;