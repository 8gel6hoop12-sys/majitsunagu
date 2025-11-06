
interface SearchLauncherProps {
  onClick: () => void;
}

export default function SearchLauncher({ onClick }: SearchLauncherProps) {
  return (
    <div className="flex justify-center px-4 mb-6">
      <div className="w-full max-w-[min(88vw,520px)] md:max-w-[min(70vw,560px)] lg:max-w-[min(42vw,600px)]">
        <button
          onClick={onClick}
          className="w-full bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl px-4 py-4 flex items-center space-x-3 text-left hover:shadow-lg hover:bg-white transition-all duration-300 group cursor-pointer"
        >
          <div className="w-10 h-10 flex items-center justify-center bg-orange-50 text-orange-500 rounded-lg group-hover:bg-orange-100 transition-colors duration-200">
            <i className="ri-search-line text-lg"></i>
          </div>
          <div className="flex-1">
            <p className="text-gray-600 text-sm sm:text-base font-medium">
              イベントを検索
            </p>
            <p className="text-gray-400 text-xs sm:text-sm">
              職種、企業名、開催形式で絞り込み
            </p>
          </div>
          <div className="w-8 h-8 flex items-center justify-center text-gray-400 group-hover:text-orange-500 transition-colors duration-200">
            <i className="ri-arrow-right-line text-lg"></i>
          </div>
        </button>
      </div>
    </div>
  );
}
