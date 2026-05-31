import { useEffect, useState } from "react";
import { Dropdown } from "../common/Dropdown.jsx";
import { HISTORY_CATEGORY_SLUG } from "../../store/appStore.js";

export function Header({
  sources,
  activeSourceId,
  onSourceChange,
  keyword,
  onSearch,
  categories,
  activeCategory,
  onCategorySelect,
}) {
  const [searchInput, setSearchInput] = useState(keyword || "");

  useEffect(() => {
    setSearchInput(keyword || "");
  }, [keyword]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    onSearch(searchInput);
  }

  const sourceOptions = sources.map((source) => ({
    value: source.id,
    label: source.label,
    enabled: source.enabled,
  }));

  if (!categories) {
    categories = [];
  }

  const categoryItems = [
    { slug: HISTORY_CATEGORY_SLUG, label: "Lịch sử" },
  ].concat(categories);

  return (
    <header className="header">
      {/* Row 1: Search + Provider Dropdown */}
      <div className="header-row-1">
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <input
            className="search-input"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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

      {/* Row 2: Category Tabs */}
      {categories.length > 0 && (
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
