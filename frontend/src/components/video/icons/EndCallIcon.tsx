const EndCallIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="60"
      height="60"
      className="cursor-pointer text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
    >
      <circle cx="12" cy="13" r="9.6" fill="currentColor" />
      <g transform="translate(2.1, 1)">
        <path
          fill="white"
          d="M7.6 10.3c.3-.3.4-.7.3-1.1l-.6-2.3c-.1-.4-.5-.7-.9-.7H4.8c-.5 0-.9.4-.9.9
            0 5.7 4.6 10.3 10.3 10.3.5 0 .9-.4.9-.9v-1.6
            c0-.4-.3-.8-.7-.9l-2.3-.6c-.4-.1-.8 0-1.1.3l-1.1 1.1
            c-1.8-.9-3.3-2.4-4.2-4.2l1.1-1.1z"
        />
      </g>
    </svg>
  )
}

export default EndCallIcon;