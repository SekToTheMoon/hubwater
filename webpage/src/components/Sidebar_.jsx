import { useEffect, useState } from "react";
import { useRef } from "react";
import { MoreVertical, ChevronLast, ChevronFirst } from "lucide-react";
import SubMenu from "./SubMenu";
import { NavLink, useLocation, useRoutes, Link } from "react-router-dom";
function Sidebar_() {
  const baseClasses =
    "text-base-content  relative flex items-center py-2 px-3 my-1 font-medium rounded-md cursor-pointer transition-colors group";
  const [open, setOpen] = useState(true);
  const [openSub, setOpensub] = useState(false);

  const Menus = [
    { title: "Dashboard", icon: <MoreVertical size={24} />, page: "dashboard" },
    { title: "พนักงาน", icon: <MoreVertical size={24} />, page: "employee" },
    { title: "ลูกค้า", icon: <MoreVertical size={24} />, page: "customer" },
    {
      title: "เอกสารขาย",
      icon: <MoreVertical size={24} />,
      submenu: true,
      submenuItem: [
        {
          title: "ใบเสนอราคา",
          page: "quotation",
          icon: <MoreVertical size={24} />,
        },
        {
          title: "ใบวางบิล",
          page: "billing",
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
    { title: "สินค้า", icon: <MoreVertical size={24} />, page: "product" },
    {
      title: "ค่าคงที่สินค้า",
      icon: <MoreVertical size={24} />,
      submenu: true,
      submenuItem: [
        {
          title: "ยี่ห้อสินค้า",
          icon: <MoreVertical size={24} />,
          page: "brand",
        },
        {
          title: "ประเภทค่าใช้จ่าย",
          icon: <MoreVertical size={24} />,
          page: "expensetype",
        },
        {
          title: "ประเภทสินค้า",
          icon: <MoreVertical size={24} />,
          page: "type",
        },
        {
          title: "ประเภทหน่วยวัด",
          icon: <MoreVertical size={24} />,
          page: "unit_m",
        },
        {
          title: "ประเภทหน่วยนับ",
          icon: <MoreVertical size={24} />,
          page: "unit",
        },
      ],
    },
    {
      title: "ขายหน้าร้าน",
      icon: <MoreVertical size={24} />,
      page: "receiptcash",
    },
    { title: "แผนก", icon: <MoreVertical size={24} />, page: "department" },
    { title: "ตำแหน่ง", icon: <MoreVertical size={24} />, page: "position" },
  ];

  return (
    <aside className="h-screen  flex flex-col bg-base-100  shadow-sm">
      <div className="p-4 pb-2 flex justify-between items-center">
        <img
          src="https://img.logoipsum.com/243.svg"
          className={`overflow-hidden transition-all ${open ? "w-32" : "w-0"}`}
          alt=""
        />
        <button
          onClick={() => setOpen(!open)}
          className="p-1.5 rounded-lg  hover:bg-primary/20"
        >
          {open ? <ChevronFirst /> : <ChevronLast />}
        </button>
      </div>
      <ul className="menu">
        {Menus.map((menu, index) => {
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
                             absolute left-full rounded-md px-2 ml-6 h-full flex items-center 
                             bg-indigo-100 text-sm 
                             invisible -translate-x-3 -translate-y-full transition-all 
                              group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                           `}
                          style={{ whiteSpace: "nowrap", top: topPosition }}
                        >
                          {menusub.title}
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
                  {alert && (
                    <div
                      className={`absolute right-2 w-2 h-2 rounded  ${
                        open ? "" : "top-2"
                      }`}
                    />
                  )}
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
        })}
      </ul>
      ;
      <div className="border-t flex p-4 mt-auto ">
        <img
          src="https://ui-avatars.com/api/?background=c7d2fe&color=3730a3&bold=true"
          alt=""
          className="w-10 h-10 rounded-md"
        />
        <div
          className={`
              flex justify-between items-center
              overflow-hidden transition-all ${open ? "w-52 ml-3" : "w-0"}
          `}
        >
          <div className="leading-4">
            <h4 className="font-semibold">John Doe</h4>
            <span className="text-xs">johndoe@gmail.com</span>
          </div>
          <MoreVertical size={20} />
        </div>
      </div>
    </aside>
  );
}

export default Sidebar_;
