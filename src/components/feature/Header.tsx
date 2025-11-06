import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  activeYear: string;
  onYearChange: (year: string) => void;
  onSearchClick: () => void;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onMenuClick: () => void;
  currentUser: string | null;
}

export default function Header({
  activeYear,
  onYearChange,
  onSearchClick,
  onLoginClick,
  onRegisterClick,
  onMenuClick,
  currentUser,
}: HeaderProps) {
  const years = ['すべて', '2026', '2027', '2028'];
  const navigate = useNavigate();

  // ← 重要: BASE_URL を先頭につける（dev: "/", 本番: "/majitunagu/" など）
  const logoSrc = `${import.meta.env.BASE_URL}assets/logo.png`;

  const goHome = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/', { replace: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* ロゴ（クリックでホーム） */}
          <a href={`${import.meta.env.BASE_URL}`} onClick={goHome} className="flex items-center space-x-3 group cursor-pointer">
            <img
              src={logoSrc}
              alt="マジツナグ"
              className="h-30 sm:h-14 md:h-16 w-auto object-contain drop-shadow-sm transition-transform duration-150 group-hover:scale-[1.02]"
              loading="eager"
              decoding="async"
            />
          </a>

          {/* 卒年チップ（中央） */}
          <div className="hidden md:flex items-center space-x-2">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => onYearChange(year)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  activeYear === year
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-700'
                }`}
              >
                {year === 'すべて' ? 'すべて' : `${year}卒`}
              </button>
            ))}
          </div>

          {/* モバイル用卒年チップ */}
          <div className="flex md:hidden items-center space-x-1">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => onYearChange(year)}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  activeYear === year
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-700'
                }`}
              >
                {year === 'すべて' ? 'すべて' : `${year}卒`}
              </button>
            ))}
          </div>

          {/* 右側アクション */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onSearchClick}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-600 rounded-full transition-all duration-200 cursor-pointer"
              title="検索"
            >
              <i className="ri-search-line text-lg"></i>
            </button>

            {currentUser ? (
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-sm text-gray-600 max-w-24 truncate">{currentUser}</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <button
                  onClick={onLoginClick}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors duration-200 cursor-pointer"
                >
                  ログイン
                </button>
                <button
                  onClick={onRegisterClick}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer whitespace-nowrap"
                >
                  新規登録
                </button>
              </div>
            )}

            <button
              onClick={onMenuClick}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-600 rounded-full transition-all duration-200 cursor-pointer"
              title="メニュー"
            >
              <i className="ri-menu-line text-lg"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
