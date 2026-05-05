import { type User, type Message } from "../../types/custom";
import { formatDate } from "../../utils/formatDate";
import MessageReactions from "./MessageReactions";

type SearchResultsProps = {
    user: User | null;
    results: Message[];
    tokens: string[];
    searchText: string;
    onCloseResults: () => void;
    onScrollToMessage: (id: number) => void;
}

const SearchResults = ({ user, results, tokens, searchText, onCloseResults, onScrollToMessage }: SearchResultsProps) => {

  const highlightText = (text: string, tokens: string[]) => {
    if (tokens.length === 0) return text;

    const regex = new RegExp(`(${tokens.join("|")})`, "gi");

    return text.split(regex).map((part, i) =>
        regex.test(part) ? (
        <span key={i} className="font-semibold">
            {part}
        </span>
        ) : (
        part
        )
    );
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
        <div className="bg-surface text-foreground rounded-lg max-w-9/12 shadow-lg text-base">
            <div className="flex justify-end p-2">
                <span className="cursor-pointer" onClick={onCloseResults}>✖</span>
            </div>

            <div className="max-h-[350px] overflow-y-auto no-scrollbar">
                {results.length === 0 && <div className="text-left px-5 pt-1.5 pb-5 break-all">{`No results found for ${searchText}`}</div>}
                
                {results.map(msg => {
                    return (
                        <div
                            key={msg.id}
                            className={`relative flex gap-2 max-w-fit text-left mt-6 mb-11 mx-5 px-3 py-2 rounded cursor-pointer ${
                                msg.userId === user?.id
                                ? "bg-message-user"
                                : "bg-message-other-user"
                            }`}
                            onClick={() => { 
                                onScrollToMessage(msg.id);
                                onCloseResults();
                            }}
                        >
                        <div className="text-3xl">👤</div>
                        <div>
                            <span className="font-semibold">
                                {msg.userId === user?.id ? "You" : msg.username}
                            </span>{" "}
                            {formatDate(msg.createdAt)}
                            <div>{highlightText(msg.text, tokens)}</div>
                        </div>
                        {msg.reactions.length > 0 && <MessageReactions reactions={msg.reactions ?? []} />}
                        </div>
                    )
                })}
            </div>
        </div>
    </div>
  )
}

export default SearchResults;
