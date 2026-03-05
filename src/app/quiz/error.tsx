'use client'

export default function QuizError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-4xl">🐛</div>
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="text-slate-400 text-sm break-all">{error.message}</p>
        <button
          onClick={() => reset()}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
