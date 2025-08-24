import type { FC } from "react";
import { useUserStore } from "../model/user.store";

export const UserMiniProfile: FC = () => {
  const user = useUserStore((state) => state.user);

  // TODO: add Chainstalker logo as default pfp
  return (
    <div className="flex items-center">
      <img className="w-12 h-12 mr-2.5 rounded-xl" src={user?.pfp} />
      <div className="flex flex-col">
        <p className="text-xl">{user?.firstName}</p>
        <p className="text-sm  text-secondary">@{user?.username}</p>
      </div>
    </div>
  );
};
