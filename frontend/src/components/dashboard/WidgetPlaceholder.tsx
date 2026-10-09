type WidgetPlaceholderProps = {
  title: string
  message: string
  isError?: boolean
  loginLabel?: string
  onLogin?: () => void
}

function WidgetPlaceholder({ title, message, isError = false, loginLabel, onLogin }: WidgetPlaceholderProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[4cqmin] overflow-hidden p-[7cqmin] text-center text-gray-900 [container-type:size]">
      <span
        className={`max-w-full truncate font-semibold leading-none text-gray-700 ${
          isError ? 'text-[8cqmin]' : 'text-[10cqmin]'
        }`}
      >
        {title}
      </span>
      {onLogin ? (
        <button
          type="button"
          onClick={onLogin}
          className="rounded-sm bg-gray-900 px-[4cqmin] py-[2.5cqmin] text-[7cqmin] font-semibold leading-tight text-white shadow-sm transition hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          {loginLabel}
        </button>
      ) : (
        <span
          className={`leading-tight ${isError ? 'text-[12cqmin] font-bold text-red-800' : 'text-[8cqmin] text-gray-700'}`}
        >
          {message}
        </span>
      )}
    </div>
  )
}

export default WidgetPlaceholder
