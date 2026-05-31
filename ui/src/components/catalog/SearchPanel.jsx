import { useState } from "react";

export function SearchPanel({ onSearch }) {
  const [keyword, setKeyword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onSearch(keyword);
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Search</h2>
      </div>
      <form className="search-form" onSubmit={handleSubmit}>
        <input
          className="search-input"
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm tên phim"
        />
        <button className="search-button" type="submit">
          Tìm
        </button>
      </form>
    </section>
  );
}
