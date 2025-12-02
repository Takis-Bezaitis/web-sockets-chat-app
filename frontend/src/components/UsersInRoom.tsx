import { type UsersInRoomProps } from "../types/custom";
import { usePresenceStore } from "../store/presenceStore";

const UsersInRoom = ({ currentRoomUsers }: UsersInRoomProps) => {
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);

  return (
    <div className="flex flex-col w-2/5 max-w-xs bg-component-background border-l border-border-line">
      <header className="text-foreground p-3 text-lg h-14">
        Room members
      </header>
      <div className="p-4">
        {Array.isArray(currentRoomUsers) && currentRoomUsers.map((user) => {
          const isPresent = onlineUsers[user.id];

          return (
            <div key={user.id} className="flex bg-surface m-2 rounded-md p-2 text-foreground items-center gap-3">

              {/* Avatar container */}
              <div className="relative text-3xl leading-none">
                <span>👤</span>

                {/* Status dot */}
                <span
                  className={`
                    absolute bottom-0 right-0 block w-3 h-3 rounded-full translate-y-1
                    ${isPresent ? "bg-green-500" : "bg-red-500"}
                  `}
                />
              </div>

              {/* User info */}
              <div className="flex flex-col text-lg">
                <p className="font-medium">{user.username}</p>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UsersInRoom;
