import { type UsersInRoomProps } from "../types/custom";

const UsersInRoom = ({ currentRoomUsers }: UsersInRoomProps) => {
  return (
    <div className="flex flex-col w-2/5 max-w-xs bg-component-background border-l border-border-line">
      <header className="text-foreground p-4">
        Room members
      </header>
      <div className="p-4">
        {Array.isArray(currentRoomUsers) && currentRoomUsers.map((user) => (
          <div key={user.id} className="bg-surface m-2 rounded-md p-2 text-foreground">
            <p>{user.username}</p>
            <p className="text-sm text-foreground">{user.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersInRoom;
