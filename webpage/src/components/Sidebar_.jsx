import { useEffect, useState } from "react";
import {
  MoreVertical,
  ChevronLast,
  ChevronFirst,
  Gauge,
  PackageSearch,
  Files,
  PackageOpen,
  Landmark,
  UsersRound,
  Contact,
  Home,
  UserRoundCog,
  HandCoins,
  LogOut,
  Receipt,
} from "lucide-react";
import { NavLink, useLocation, Link } from "react-router-dom";
import axios from "../api/axios";

function Sidebar_() {
  const [open, setOpen] = useState(true);
  const [openSub, setOpensub] = useState(false);
  const permission = localStorage.getItem("posit_permission");
  const permissionArray = permission ? permission.split("") : [];
  permissionArray.splice(0, 0, "1");
  console.log(permissionArray);
  const Menus = [
    { title: "หน้าแรก", icon: <Home size={20} />, page: "home" },
    { title: "Dashboard", icon: <Gauge size={20} />, page: "dashboard" },
    { title: "พนักงาน", icon: <Contact size={20} />, page: "employee" },
    { title: "ลูกค้า", icon: <UsersRound size={20} />, page: "customer" },
    {
      title: "เอกสารขาย",
      icon: <Files size={20} />,
      submenu: true,
      submenuItem: [
        {
          title: "ใบเสนอราคา",
          page: "quotation",
          icon: <MoreVertical size={24} />,
        },
        {
          title: "ใบวางบิล",
          page: "bill",
          icon: <MoreVertical size={24} />,
        },
        {
          title: "ใบแจ้งหนี้/ส่งสินค้า",
          page: "invoice",
          icon: <MoreVertical size={24} />,
        },
        {
          title: "ใบเสร็จรับเงิน",
          page: "receipt",
          icon: <MoreVertical size={24} />,
        },
      ],
    },
    {
      title: "ขายหน้าร้าน",
      icon: <HandCoins size={20} />,
      page: "receiptcash",
    },
    {
      title: "เอกสารค่าใช้จ่าย",
      icon: <Receipt size={20} />,
      page: "out",
    },
    { title: "สินค้า", icon: <PackageSearch size={20} />, page: "product" },
    {
      title: "ค่าคงที่สินค้า",
      icon: <PackageOpen size={20} />,
      submenu: true,
      submenuItem: [
        {
          title: "ยี่ห้อสินค้า",
          icon: <MoreVertical size={20} />,
          page: "brand",
        },
        {
          title: "ประเภทค่าใช้จ่าย",
          icon: <MoreVertical size={20} />,
          page: "expensetype",
        },
        {
          title: "ประเภทสินค้า",
          icon: <MoreVertical size={20} />,
          page: "type",
        },
        {
          title: "ประเภทหน่วยวัด",
          icon: <MoreVertical size={20} />,
          page: "unit_m",
        },
        {
          title: "ประเภทหน่วยนับ",
          icon: <MoreVertical size={20} />,
          page: "unit",
        },
      ],
    },
    { title: "ค่าคงที่บริษัท", icon: <Home size={20} />, page: "company" },
    { title: "แผนก", icon: <Home size={20} />, page: "department" },
    { title: "ตำแหน่ง", icon: <UserRoundCog size={20} />, page: "position" },
    { title: "บัญชี", icon: <Landmark size={20} />, page: "bank" },
  ];

  return (
    <aside className="h-screen  flex flex-col bg-base-100  shadow-sm max-w-60">
      <div className="p-4 pb-2 flex justify-between items-center h-12 ">
        <img
          src="http://localhost:3001/img/logo/logo.png"
          className={`overflow-hidden transition-all ${
            open ? "w-12" : "hidden"
          }`}
          alt=""
        />
        <span
          className={`overflow-hidden transition-all ${open ? "" : "hidden"}`}
        >
          HubWater
        </span>
        <button
          onClick={() => setOpen(!open)}
          className="p-1.5 rounded-lg  hover:bg-primary/20"
        >
          {open ? <ChevronFirst /> : <ChevronLast />}
        </button>
      </div>
      <ul className="menu">
        {Menus.map((menu, index) => {
          if (permissionArray[index] === "1") {
            return (
              <li key={index}>
                {menu.submenu ? (
                  open ? (
                    <details>
                      <summary>
                        {menu.icon}
                        <span
                          className={`overflow-hidden transition-all ml-3 ${
                            !open && "hidden"
                          }`}
                        >
                          {menu.title}
                        </span>
                      </summary>
                      <ul>
                        {menu.submenuItem.map((menusub, subIndex) => {
                          return (
                            <li key={subIndex}>
                              <NavLink
                                to={menusub.page}
                                className={`relative transition-colors group`}
                              >
                                <span
                                  className={`overflow-hidden transition-all ml-3 ${
                                    !open && "hidden"
                                  }`}
                                >
                                  {menusub.title}
                                </span>
                                {alert && (
                                  <div
                                    className={`absolute right-2 w-2 h-2 rounded  ${
                                      open ? "" : "top-2"
                                    }`}
                                  />
                                )}
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  ) : (
                    <nav className={`relative transition-colors group `}>
                      {menu.icon}
                      {menu.submenuItem.map((menusub, subIndex) => {
                        const topPosition = (subIndex + 1) * 2 - 2 + "rem"; // Adjust the top position as needed
                        return (
                          <NavLink
                            key={subIndex}
                            to={menusub.page}
                            className={`${!openSub && "visible"}
                             absolute left-full  pl-6  h-full 
                              text-sm 
                             invisible -translate-x-3 -translate-y-full transition-all 
                              group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                           `}
                            style={{ whiteSpace: "nowrap", top: topPosition }}
                          >
                            <div className="px-2 bg-indigo-100 w-full h-full rounded-md flex items-center ">
                              {menusub.title}
                            </div>
                          </NavLink>
                        );
                      })}
                    </nav>
                  )
                ) : (
                  <NavLink
                    to={menu.page}
                    className={`relative transition-colors group`}
                  >
                    {menu.icon}
                    <span
                      className={`overflow-hidden transition-all ml-3 ${
                        !open && "hidden"
                      }`}
                    >
                      {menu.title}
                    </span>
                    {!open && (
                      <div
                        className={`
                  absolute left-full rounded-md px-2 ml-6 h-full flex items-center 
                  bg-indigo-100 text-sm 
                  invisible opacity-20 -translate-x-3 transition-all
                  group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                `}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {menu.title}
                      </div>
                    )}
                  </NavLink>
                )}
              </li>
            );
          } else {
            return null;
          }
        })}
      </ul>

      <div className="border-t flex p-4 mt-auto ">
        <div className={`${open ? "avatar" : "hidden"}`}>
          <div className="w-10 rounded-full">
            <img
              src={`http://localhost:3001/img/avatar/${localStorage.getItem(
                "employee_img"
              )}`}
              alt=""
            />
          </div>
        </div>
        <div
          className={`
              flex justify-between items-center
              overflow-hidden transition-all ${open ? "w-52" : "m-auto"}
          `}
        >
          <div
            className={`leading-4 p-1  ${open ? "" : "hidden"}
          `}
          >
            <h3 className="font-semibold">
              {localStorage.getItem("employee_fname") +
                " " +
                localStorage.getItem("employee_lname")}
            </h3>
          </div>
          <div
            className="cursor-pointer"
            onClick={async () => {
              await axios.post("/logout", {
                refreshToken: localStorage.getItem("refreshToken"),
              });

              localStorage.clear();
              window.location = "/";
            }}
          >
            <LogOut size={20} />
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar_;
