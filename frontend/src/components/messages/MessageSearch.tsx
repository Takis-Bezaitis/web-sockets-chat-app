import { useState } from "react";
import { type Message, type User } from "../../types/custom";
import SearchResults from "./SearchResults";
import { useMediaQuery } from "../../hooks/useMediaQuery";

type MessageSearchProps = {
    user: User | null;
    messages: Message[];
    loading: boolean;
    onScrollToMessage: (id: number) => void;
}

const MessageSearch = ({user, messages, loading, onScrollToMessage}: MessageSearchProps) => {
  const [searchText, setSearchText] = useState<string>('');
  const [results, setResults] = useState<Message[] | null>(null);
  const [tokens, setTokens] = useState<string[]>([]);

  const isSmall = useMediaQuery("(max-width: 768px)");

  const normalizeText = (text: string) =>
    text.toLowerCase().normalize("NFKC").replace(/[’‘]/g, "'");

  const handleSearch = () => {
    if (!searchText.trim()) return;

    const tokens = normalizeText(searchText).split(/\s+/).filter(Boolean);

    const results = messages.filter(message =>
        tokens.every(token => normalizeText(message.text).includes(token))
    );

    setResults(results);
    setTokens(tokens)
    
  };

  const onCloseResults = () => {
    setResults(null);
    setTokens([]);
    setSearchText('');
  };

  return (
    <div className={`flex items-center gap-2 mr-3 
          border border-border-line rounded-lg px-2 h-9 bg-component-background 
          ${isSmall ? 'w-40 text-base' : 'w-56 text-lg'}`}>
        <span className="opacity-60 select-none">🔍</span>
        <input 
            disabled={loading}
            autoFocus
            placeholder="Search channel"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    handleSearch();
                }
            }}
            className={`bg-transparent outline-none text-foreground flex-1 placeholder-gray-600
              ${isSmall ? 'w-24 text-base' : 'w-40 text-lg'}`}
        />
        {results && <SearchResults user={user} results={results} tokens={tokens} searchText={searchText}
        onCloseResults={onCloseResults} onScrollToMessage={onScrollToMessage} />}
    </div>
  )
}

export default MessageSearch;