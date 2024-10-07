import React from "react";

function SearchInput({ search, setSearch, handleSearch }) {
  return (
    <div className="join">
      <input
        type="text"
        value={search}
        className="input input-bordered join-item w-full"
        placeholder="ค้นหา"
        onChange={(e) => setSearch(e.target.value)}
      />
      <button className="btn btn-primary join-item " onClick={handleSearch}>
        <i className="fa-solid fa-magnifying-glass"></i>
      </button>
    </div>
  );
}

export default SearchInput;
