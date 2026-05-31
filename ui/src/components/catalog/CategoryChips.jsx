export function CategoryChips({ categories, activeCategory, onSelect }) {
  if (!categories.length) {
    return null;
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Categories</h2>
      </div>
      <div className="chip-row">
        {categories.map((category) => {
          const isActive = category.slug === activeCategory;
          return (
            <button
              key={category.slug}
              type="button"
              className={isActive ? "chip is-active" : "chip"}
              onClick={() => onSelect(category.slug)}
            >
              {category.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
