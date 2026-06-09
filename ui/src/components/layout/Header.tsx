import { useEffect, useState } from "react";
import type { FormEvent, ReactElement } from "react";
import type { ProviderCategory } from "@shared/contracts/models";
import { Dropdown } from "../common/Dropdown";
import { FAVORITES_CATEGORY_SLUG } from "../../store/appStore";
import type { SourceOption } from "../../store/types";

interface HeaderProps {
  sources: SourceOption[];
  activeSourceId: string;
  onSourceChange: (sourceId: string) => void;
  keyword: string;
  onSearch: (keyword: string) => void;
  categories: ProviderCategory[];
  activeCategory: string;
  onCategorySelect: (slug: string) => void;
}

export function Header({
  sources,
  activeSourceId,
  onSourceChange,
  keyword,
  onSearch,
  categories,
  activeCategory,
  onCategorySelect,
}: HeaderProps): ReactElement {
  const [searchInput, setSearchInput] = useState(keyword || "");

  useEffect(() => {
    setSearchInput(keyword || "");
  }, [keyword]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSearch(searchInput);
  }

  function handleSearchInput(value: string): void {
    setSearchInput(value);
    if (!value.trim()) {
      onSearch("");
    }
  }

  const sourceOptions = sources.map((source) => ({
    value: source.id,
    label: source.label,
    enabled: source.enabled,
  }));

  const safeCategories = categories || [];
  const categoryItems = [{ slug: FAVORITES_CATEGORY_SLUG, label: "Yêu thích" }].concat(
    safeCategories,
  );

  return (
    <header className="header">
      <div className="header-row-1">
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <input
            className="search-input"
            type="search"
            value={searchInput}
            onChange={(event) => handleSearchInput(event.target.value)}
            placeholder="Tìm kiếm phim..."
          />
          <button className="search-button" type="submit">
            🔍
          </button>
        </form>

        <div className="header-actions">
          <Dropdown
            options={sourceOptions}
            activeValue={activeSourceId}
            onChange={onSourceChange}
            label="Provider"
          />
        </div>
      </div>

      {safeCategories.length > 0 && (
        <div className="header-row-2">
          <div className="category-tabs">
            {categoryItems.map((category) => (
              <button
                key={category.slug}
                type="button"
                className={
                  category.slug === activeCategory
                    ? "category-tab is-active"
                    : "category-tab"
                }
                onClick={() => onCategorySelect(category.slug)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
