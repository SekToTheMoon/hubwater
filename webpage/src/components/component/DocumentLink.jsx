import React from "react";
import { Link } from "react-router-dom";

const DocumentLink = ({ to, id }) => {
  if (!id) return null;

  return (
    <Link to={to} className="flex items-center hover:underline">
      <svg
        className="w-4 h-4 mr-2"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M8 12l-1.41-1.41L10.17 7H2v-2h8.17l-3.58-3.59L8 0l6 6-6 6z" />
      </svg>
      {id}
    </Link>
  );
};

export default DocumentLink;
