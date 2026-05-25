type EmojiPickerProps = {
    textSelect: (e: string) => void;
}

const EmojiPicker = ({textSelect}: EmojiPickerProps) => {
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
                w-[220px] h-[175px] overflow-y-auto no-scrollbar"
            >
            <div className="grid grid-cols-5 gap-2">
                {emojisArray.map((e, index) => (
                    <button
                        key={index}
                        type="button"
                        className="text-2xl hover:scale-110 transition-transform cursor-pointer"
                        onClick={() => textSelect(e)}
                    >
                      {e}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default EmojiPicker;