import { MoreVertical, ChevronLast, ChevronFirst } from "lucide-react";
import { useContext, createContext, useState } from "react";
import { Link, NavLink } from "react-router-dom";

const SidebarContext = createContext();

export default function SubMenu({ children }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <aside className="h-screen ">
      <nav className="h-full flex flex-col bg-base-100  shadow-sm">
        <div className="p-4 pb-2 flex justify-between items-center">
          <img
            src="https://img.logoipsum.com/243.svg"
            className={`overflow-hidden transition-all ${
              expanded ? "w-32" : "w-0"
            }`}
            alt=""
          />
          <button
            onClick={() => setExpanded((curr) => !curr)}
            className="p-1.5 rounded-lg  hover:bg-primary/20"
          >
            {expanded ? <ChevronFirst /> : <ChevronLast />}
          </button>
        </div>

        <SidebarContext.Provider value={{ expanded }}>
          <ul className="flex-1 px-3">{children}</ul>
        </SidebarContext.Provider>

        <div className="border-t flex p-3">
          <img
            src="https://ui-avatars.com/api/?background=c7d2fe&color=3730a3&bold=true"
            alt=""
            className="w-10 h-10 rounded-md"
          />
          <div
            className={`
              flex justify-between items-center
              overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"}
          `}
          >
            <div className="leading-4">
              <h4 className="font-semibold">John Doe</h4>
              <span className="text-xs">johndoe@gmail.com</span>
            </div>
            <MoreVertical size={20} />
          </div>
        </div>
      </nav>
    </aside>
  );
}

export function SidebarItem({ icon, text, active, alert, page }) {
  const { expanded } = useContext(SidebarContext);
  const baseClasses =
    "relative flex items-center py-2 px-3 my-1 font-medium rounded-md cursor-pointer transition-colors group";
  return (
    <li>
      <NavLink
        to={page}
        className={({ isActive }) => {
          return isActive
            ? `bg-primary color text-primary-content ${baseClasses}`
            : ` hover:bg-primary/20   ${baseClasses}`;
        }}
      >
        {icon}
        {expanded && (
          <span className={`overflow-hidden transition-all ml-3`}>{text}</span>
        )}
        {alert && (
          <div
            className={`absolute right-2 w-2 h-2 rounded  ${
              expanded ? "" : "top-2"
            }`}
          />
        )}
        {!expanded && (
          <div
            className={`
          absolute left-full rounded-md px-2 ml-6 h-full flex items-center 
          bg-indigo-100 text-sm 
          invisible opacity-20 -translate-x-3 transition-all
          group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
        `}
            style={{ whiteSpace: "nowrap" }}
          >
            {text}
          </div>
        )}
      </NavLink>
    </li>
  );
}
