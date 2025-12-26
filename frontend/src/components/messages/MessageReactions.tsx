import { type MessageReaction } from "../../types/custom.js";

interface Props {
  reactions: MessageReaction[];
}

const MessageReactions = ({ reactions }: Props) => {
  if (!reactions || reactions.length === 0) return null;

  // Group reactions by emoji
  const grouped = reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = { count: 0, users: [] };
    }
    acc[r.emoji].count += 1;
    acc[r.emoji].users.push(r.username);
    return acc;
  }, {} as Record<string, { count: number; users: string[] }>);

  return (
    <div className="absolute bottom-0 left-0 translate-x-1 translate-y-6 flex gap-0.5">
      {Object.entries(grouped).map(([emoji, info]) => (
        <div
          key={emoji}
          className="text-sm p-1 flex items-center "
          title={info.users.join(", ")} // tooltip of usernames
        >
          <span>{emoji}</span>
          <span>{info.count}</span>
        </div>
      ))}
    </div>
  );
};

export default MessageReactions;
