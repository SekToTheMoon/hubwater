import React, { useEffect, useContext } from "react";
import Sidebar, { SidebarItem } from "./components/Sidebar";
import Sidebar_ from "./components/Sidebar_";
import { Outlet } from "react-router-dom";
import axios from "./api/axios";

function All() {
  return (
    <div className="relative">
      <div className="navbar sticky top-0  bg-base-100 md:hidden">
        <div className="mx-auto w-32 ">
          <img
            src="http://localhost:3001/img/logo/logo.png"
            className={`overflow-hidden transition-all `}
            alt="Logo"
          />
        </div>
      </div>
      <div className="flex">
        <Sidebar_ />

        <div className="detail w-full h-screen bg-neutral p-3 overflow-y-auto text-base ">
          <Outlet />
        </div>
        <label className="flex cursor-pointer gap-2 fixed top-5 right-8 ">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
          </svg>
          <input
            type="checkbox"
            value="dark"
            className="toggle theme-controller"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </label>
      </div>
    </div>
  );
}

export default All;
