type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  fullWidth?: boolean;
};

const Button = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  fullWidth = false,
}: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${fullWidth ? "w-full" : ""}
        bg-blue-600
        text-white
        px-4
        py-2
        rounded
        hover:bg-blue-700
        transition
        cursor-pointer
        disabled:opacity-50
      `}
    >
      {children}
    </button>
  );
};

export default Button;