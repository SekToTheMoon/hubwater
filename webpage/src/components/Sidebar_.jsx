import { useState, useEffect } from "react";
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
  Building2,
  GitFork,
  Menu,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useLogout from "../hooks/useLogout";

function Sidebar_() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const logout = useLogout();

  const [open, setOpen] = useState(true);
  const [openSub, setOpenSub] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const permission = auth?.posit_permission;

  const Menus = [
    { title: "หน้าแรก", icon: <Home size={20} />, page: "/home" },
    { title: "Dashboard", icon: <Gauge size={20} />, page: "/dashboard" },
    { title: "พนักงาน", icon: <Contact size={20} />, page: "/employee" },
    { title: "ลูกค้า", icon: <UsersRound size={20} />, page: "/customer" },
    {
      title: "เอกสารขาย",
      icon: <Files size={20} />,
      submenu: true,
      submenuItem: [
        {
          title: "ใบเสนอราคา",
          page: "/quotation",
          icon: <MoreVertical size={24} />,
        },
        {
          title: "ใบวางบิล",
          page: "/bill",
          icon: <MoreVertical size={24} />,
        },
        {
          title: "ใบแจ้งหนี้/ส่งสินค้า",
          page: "/invoice",
          icon: <MoreVertical size={24} />,
        },
        {
          title: "ใบเสร็จรับเงิน",
          page: "/receipt",
          icon: <MoreVertical size={24} />,
        },
      ],
    },
    {
      title: "ขายหน้าร้าน",
      icon: <HandCoins size={20} />,
      page: "/receiptcash",
    },
    {
      title: "เอกสารค่าใช้จ่าย",
      icon: <Receipt size={20} />,
      page: "/out",
    },
    { title: "สินค้า", icon: <PackageSearch size={20} />, page: "/product" },
    {
      title: "ค่าคงที่สินค้า",
      icon: <PackageOpen size={20} />,
      submenu: true,
      submenuItem: [
        {
          title: "ยี่ห้อสินค้า",
          icon: <MoreVertical size={20} />,
          page: "/brand",
        },
        {
          title: "ประเภทค่าใช้จ่าย",
          icon: <MoreVertical size={20} />,
          page: "/expensetype",
        },
        {
          title: "ประเภทสินค้า",
          icon: <MoreVertical size={20} />,
          page: "/type",
        },
        {
          title: "ประเภทหน่วยวัด",
          icon: <MoreVertical size={20} />,
          page: "/unit_m",
        },
        {
          title: "ประเภทหน่วยนับ",
          icon: <MoreVertical size={20} />,
          page: "/unit",
        },
      ],
    },
    {
      title: "ค่าคงที่บริษัท",
      icon: <Building2 size={20} />,
      page: "/company",
    },
    { title: "แผนก", icon: <GitFork size={20} />, page: "/department" },
    { title: "ตำแหน่ง", icon: <UserRoundCog size={20} />, page: "/position" },
    { title: "บัญชี", icon: <Landmark size={20} />, page: "/bank" },
  ];

  const signOut = async () => {
    await logout();
    window.location.replace("/");
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setOpen(window.innerWidth > 767);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  return (
    <div className="flex">
      <aside
        className={`h-screen flex flex-col bg-base-100 shadow-sm max-w-60  ${
          isMobile ? (sidebarOpen ? "fixed block" : "hidden") : "block"
        } `}
      >
        <div className="p-4 pb-2 justify-between items-center h-12 hidden md:flex">
          <img
            src="http://localhost:3001/img/logo/logo.png"
            className={`overflow-hidden transition-all ${
              open ? "w-12" : "hidden"
            }`}
            alt="Logo"
          />
          <span
            className={`overflow-hidden transition-all ${open ? "" : "hidden"}`}
          >
            HubWater
          </span>
          <button
            onClick={() => setOpen(!open)}
            className={`p-1.5 rounded-lg hover:bg-primary/20 ${
              isMobile ? "hidden" : "block"
            }`}
          >
            {open ? <ChevronFirst /> : <ChevronLast />}
          </button>
        </div>
        <ul className="menu">
          {Menus.map(
            (menu, index) =>
              permission &&
              permission[index] === "1" && (
                <li key={index}>
                  {menu.submenu ? (
                    <Submenu
                      open={open}
                      openSub={openSub}
                      setOpenSub={setOpenSub}
                      menu={menu}
                    />
                  ) : (
                    <NavLink
                      to={menu.page}
                      className="relative transition-colors group"
                    >
                      {menu.icon}
                      <span
                        className={`overflow-hidden transition-all ml-3 ${
                          !open && "hidden"
                        }`}
                      >
                        {menu.title}
                      </span>
                    </NavLink>
                  )}
                </li>
              )
          )}
        </ul>
        <UserSection open={open} signOut={signOut} />
      </aside>
      <button
        className="fixed top-5 left-[1.4rem] z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X /> : <Menu />}
      </button>
    </div>
  );
}

function Submenu({ open, openSub, setOpenSub, menu }) {
  return open ? (
    <details>
      <summary>
        {menu.icon}
        <span
          className={`overflow-hidden transition-all ml-3 ${!open && "hidden"}`}
        >
          {menu.title}
        </span>
      </summary>
      <ul>
        {menu.submenuItem.map((submenu, subIndex) => (
          <li key={subIndex}>
            <NavLink
              to={submenu.page}
              className="relative transition-colors group"
            >
              <span
                className={`overflow-hidden transition-all ml-3 ${
                  !open && "hidden"
                }`}
              >
                {submenu.title}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </details>
  ) : (
    <nav className="relative transition-colors group">
      {menu.icon}
      {menu.submenuItem.map((submenu, subIndex) => {
        const topPosition = (subIndex + 1) * 2 - 2 + "rem";
        return (
          <NavLink
            key={subIndex}
            to={submenu.page}
            className={`absolute left-full pl-6 h-full text-sm invisible -translate-x-3 -translate-y-full transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0`}
            style={{ top: topPosition, whiteSpace: "nowrap" }}
          >
            <div className="px-2 bg-indigo-100 w-full h-full rounded-md flex items-center">
              {submenu.title}
            </div>
          </NavLink>
        );
      })}
    </nav>
  );
}

function UserSection({ open, signOut }) {
  return (
    <div className={`${open ? "mt-auto" : ""} border-t flex p-4 `}>
      <div className={`${open ? "avatar" : "hidden"}`}>
        <div className="w-10 rounded-full">
          <img
            src={`http://localhost:3001/img/avatar/${localStorage.getItem(
              "employee_img"
            )}`}
            alt="User Avatar"
          />
        </div>
      </div>
      <div
        className={`flex justify-between items-center overflow-hidden transition-all ${
          open ? "w-52" : "m-auto"
        }`}
      >
        <div className={`leading-4 p-1 ${open ? "" : "hidden"}`}>
          <h3 className="font-semibold">
            {`${localStorage.getItem("employee_fname")} ${localStorage.getItem(
              "employee_lname"
            )}`}
          </h3>
        </div>
        <div className="cursor-pointer" onClick={signOut}>
          <LogOut size={20} />
        </div>
      </div>
    </div>
  );
}

export default Sidebar_;
