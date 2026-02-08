interface ControlButtonProps {
  onClick: () => void;
  active: boolean;
  label: string;
  children: React.ReactNode;
}

const ControlButton = ({ onClick, active, label, children }: ControlButtonProps) => (
  <button
    onClick={onClick}
    aria-label={label}
    className={`
      w-12 h-12 rounded-full flex items-center justify-center
      transition-all active:scale-95 cursor-pointer
      ${active
        ? "bg-gray-700 text-white"
        : "bg-gray-300 text-gray-700"}
    `}
  >
    {children}
  </button>
);

export default ControlButton;
