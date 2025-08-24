import { NavLink } from "react-router-dom";

import { Navigation } from "../model/links";

export const SidebarNavigation = () => {
  const defaultClasses = "flex gap-3 py-2 px-3 items-center";

  return (
    <ul className="flex justify-between flex-col gap-3 cursor-pointer">
      {Navigation.map(({ to, icon: Icon, label }) => (
        <li key={to}>
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? defaultClasses + " bg-secondary rounded-xl"
                : defaultClasses
            }
          >
            <Icon
              width={24}
              height={24}
              className="text-primary fill-current"
            />
            <p className="text-lg">{label}</p>
          </NavLink>
        </li>
      ))}
    </ul>
  );
};
