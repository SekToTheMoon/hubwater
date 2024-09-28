import React from "react";

function SearchInput({ setSearch, handleSearch }) {
  return (
    <div className="join">
      <input
        type="text"
        className="input input-bordered join-item"
        placeholder="ค้นหา"
        onChange={(e) => setSearch(e.target.value)}
      />
      <button className="btn btn-primary join-item " onClick={handleSearch}>
        <i class="fa-solid fa-magnifying-glass"></i>
      </button>
    </div>
  );
}

export default SearchInput;
