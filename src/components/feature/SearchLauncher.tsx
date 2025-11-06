// src/components/feature/SearchLauncher.tsx
'use client';

interface SearchLauncherProps {
  onClick: () => void;
  instagramUrl?: string;
  lineUrl?: string;
}

export default function SearchLauncher({
  onClick,
  instagramUrl = 'https://www.instagram.com/majitsunagu?igsh=bm5nMG96ZGJ6ZjM1&utm_source=ig_contact_invite',
  lineUrl = 'https://lin.ee/GrVcrFQ',
}: SearchLauncherProps) {
  return (
    <div className="flex justify-center px-4 mb-6">
      <div className="w-full max-w-[min(88vw,520px)] md:max-w-[min(70vw,560px)] lg:max-w-[min(42vw,600px)] space-y-3">
        {/* 検索ランチャー */}
        <button
          onClick={onClick}
          className="w-full bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl px-4 py-4 flex items-center space-x-3 text-left hover:shadow-lg hover:bg-white transition-all duration-300 group cursor-pointer"
          aria-label="イベントを検索"
        >
          <div className="w-10 h-10 flex items-center justify-center bg-orange-50 text-orange-500 rounded-lg group-hover:bg-orange-100 transition-colors duration-200">
            <i className="ri-search-line text-lg" />
          </div>
          <div className="flex-1">
            <p className="text-gray-600 text-sm sm:text-base font-medium">イベントを検索</p>
            <p className="text-gray-400 text-xs sm:text-sm">職種、企業名、開催形式で絞り込み</p>
          </div>
          <div className="w-8 h-8 flex items-center justify-center text-gray-400 group-hover:text-orange-500 transition-colors duration-200">
            <i className="ri-arrow-right-line text-lg" />
          </div>
        </button>

        {/* SNS 動線（Instagram / LINE） */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Instagram（ピンク） */}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 hover:from-pink-50 hover:to-white transition-all duration-300 shadow-sm hover:shadow-md"
            aria-label="Instagramへ"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-pink-200/30 blur-2xl transition-transform duration-300 group-hover:scale-110" />
            <div className="flex items-center px-4 py-3">
              {/* IGの雰囲気アイコン（グラデ） */}
              <div className="mr-3 h-10 w-10 rounded-xl ring-1 ring-pink-200 p-[2px]">
                <div className="h-full w-full rounded-[10px] bg-[conic-gradient(at_30%_30%,#ff8ab5,#ff6aa8,#ff7a7a,#ffb26b,#ffd36b,#ff8ab5)] flex items-center justify-center">
                  <i className="ri-instagram-line text-white drop-shadow-sm" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-pink-700">
                  Instagram で最新情報を見る
                </p>
              </div>
              <span className="ml-auto translate-x-0 text-pink-500 transition-transform duration-300 group-hover:translate-x-1">
                <i className="ri-arrow-right-up-line text-lg" />
              </span>
            </div>
          </a>

          {/* LINE（緑の円＋吹き出しロゴ風） */}
          <a
            href={lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl border border-green-200 bg-gradient-to-br from-white to-green-50 hover:from-green-50 hover:to-white transition-all duration-300 shadow-sm hover:shadow-md"
            aria-label="LINE 友だち追加"
          >
            <div className="pointer-events-none absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-green-200/30 blur-2xl transition-transform duration-300 group-hover:scale-110" />
            <div className="flex items-center px-4 py-3">
              {/* インラインSVG（緑の円＋白の吹き出し＋LINE文字） */}
              <div className="mr-3 h-10 w-10 rounded-xl ring-1 ring-green-200 bg-white flex items-center justify-center">
                <svg
                  viewBox="0 0 48 48"
                  className="h-7 w-7"
                  aria-hidden
                  focusable="false"
                >
                  {/* Green circle */}
                  <circle cx="24" cy="24" r="22" fill="#06C755" />
                  {/* White chat bubble */}
                  <path
                    d="M34 21c0-5.3-4.9-9-10.9-9S12 15.7 12 21c0 3.6 2.5 6.6 6.2 8.1l-.9 4.6c-.1.6.5 1.1 1.1.8l5-2.7c.2 0 .5 0 .7 0 6 0 10.9-3.6 10.9-9z"
                    fill="#fff"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-green-700">
                  LINE で友だち追加する
                </p>
              </div>
              <span className="ml-auto translate-x-0 text-green-600 transition-transform duration-300 group-hover:translate-x-1">
                <i className="ri-arrow-right-up-line text-lg" />
              </span>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}