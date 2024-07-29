import React, { useEffect } from "react";
import Sidebar, { SidebarItem } from "./components/Sidebar";
import Sidebar_ from "./components/Sidebar_";
import { Outlet } from "react-router-dom";
import axios from "./api/axios";

function All() {
  const checkTokenValidity = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/auth",
        {},
        {
          headers: { Authorization: "Bearer " + token },
        }
      );

      if (response.status === 200) {
      } else {
        window.location = "/";
      }
    } catch (error) {
      console.error("Error occurred:", error);
      window.location = "/";
    }
  };
  //การขอ access token ใหม่ทุก 5วิ ปิดไวก่อนยังไม่ต้องใช้ เหลือการ auth ทุกครับที่เข้าไปดึง แก้ไข ลบ ในdatabase และก็ protectroute
  // setInterval(async () => {
  //   try {
  //     const response = await axios.post("http://localhost:3001/token", {
  //       refreshToken: localStorage.getItem("refreshToken"),
  //     });

  //     if (response.status === 200) {
  //       const newToken = response.data.token;
  //       localStorage.setItem("token", newToken);
  //       console.log("New token is received: " + newToken);
  //     }
  //   } catch (error) {
  //     console.error("Error while refreshing token:", error);
  //   }
  // }, 5000);

  useEffect(() => {
    checkTokenValidity();
  }, []);
  return (
    <div className="flex">
      <Sidebar_ />
      <div className="detail w-full h-screen bg-neutral p-3 overflow-y-auto text-base ">
        <Outlet />
      </div>
      <label className="flex cursor-pointer gap-2 absolute top-5 right-10 ">
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
  );
}

export default All;
