import { useMediaQuery } from "../../hooks/useMediaQuery";

type EmojiPickerProps = {
    textSelect: (e: string) => void;
}

const EmojiPicker = ({textSelect}: EmojiPickerProps) => {
    const isSmall = useMediaQuery("(max-width: 768px)");

    const emojisArray = [
    "😀","😂","🤣","😊","😍",
    "😎","🥳","😭","😡","👍",
    "👎","🙏","❤️","🔥","🎉",
    "💯","✨","🤔","👀","🚀"
    ];

    return (
        <div 
            className="bg-component-background text-foreground rounded-lg
                border border-border-line shadow-lg p-2
                 overflow-y-auto no-scrollbar"
            >
            <div className={`grid ${isSmall ? 'grid-cols-8' : 'grid-cols-5'} gap-2`}>
                {emojisArray.map((emoji, index) => (
                    <button
                        key={index}
                        type="button"
                        className="text-2xl hover:scale-110 transition-transform cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            textSelect(emoji);
                        }}
                    >
                      {emoji}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default EmojiPicker;