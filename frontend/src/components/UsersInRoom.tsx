import { type UsersInRoomProps } from "../types/custom";

const UsersInRoom = ({ currentRoomUsers }: UsersInRoomProps) => {
  return (
    <div className="flex flex-col w-2/5 max-w-xs bg-component-background border-l border-border-line">
      <header className="text-foreground p-4">
        Users in the room
      </header>
      <div className="p-4">
        {Array.isArray(currentRoomUsers) && currentRoomUsers.map((user) => (
          <div key={user.id} className="text-foreground mb-2">
            <p>{user.username}</p>
            <p className="text-sm text-foreground">{user.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersInRoom;
