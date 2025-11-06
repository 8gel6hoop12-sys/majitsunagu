import { useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';

/** ここだけ変えれば遷移先を差し替えできます */
const HERO_LINK = 'https://docs.google.com/forms/d/e/1FAIpQLSekH8hINDzZRVzax7hiAiPnul5UP-Xc09TezGAtPQ3N5M5DvQ/viewform?fbclid=PAdGRleANv-jdleHRuA2FlbQIxMQABp-rCbtWcZSvoEMvmY-SV4LIc4v5-RcwaHNZMC-4VejMyC1B30s3tdQ4qjJAV_aem_Q1zprmisxr7WfjMfwfehAg'; // ←行き先URL

export default function Hero() {
  const messages = [
    '就活相談、ゆるっと受け付けてます',
    'まずは話そ。就活の相談口、ここです',
    '進路相談（個別対応）受付中',
  ];
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    setCurrentMessage(messages[Math.floor(Math.random() * messages.length)]);
  }, []);

  const go = () => {
    // 新しいタブで開く。 同タブ遷移にしたいなら window.location.href = HERO_LINK;
    window.open(HERO_LINK, '_blank', 'noopener,noreferrer');
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      go();
    }
  };

  return (
    <section
      className="relative py-12 sm:py-16 overflow-hidden"
      style={{
        backgroundImage:
          "url('https://readdy.ai/api/search-image?query=warm%20welcoming%20university%20campus%20scene%20with%20diverse%20students%20walking%20and%20talking%20together%2C%20bright%20sunny%20day%20with%20modern%20buildings%20in%20background%2C%20friendly%20atmosphere%20with%20orange%20and%20white%20color%20tones%2C%20natural%20lighting%20creating%20positive%20energy&width=1200&height=400&seq=hero-bg-1&orientation=landscape')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-orange-50/80 to-white/90"></div>

      {/* 装飾 */}
      <div className="absolute top-4 left-4 w-16 h-16 bg-gradient-to-br from-orange-200/30 to-orange-300/20 rounded-full blur-xl" />
      <div className="absolute bottom-4 right-4 w-20 h-20 bg-gradient-to-br from-orange-100/40 to-orange-200/30 rounded-full blur-2xl" />

      {/* クリック領域（カード） */}
      <div className="relative flex justify-center px-4">
        <div className="w-full max-w-[min(88vw,520px)] md:max-w-[min(70vw,560px)] lg:max-w-[min(42vw,600px)]">
          <div
            role="link"
            tabIndex={0}
            onClick={go}
            onKeyDown={onKey}
            className="
              group cursor-pointer select-none
              bg-white/80 backdrop-blur-sm rounded-2xl
              p-6 sm:p-8 shadow-lg border border-orange-100/50
              transition-transform duration-150 hover:scale-[1.01] hover:shadow-xl
              focus:outline-none focus:ring-4 focus:ring-orange-200
            "
          >
            <div className="flex items-center justify-center mb-4">
              <img
                src="/assets/logo.png"
                alt="マジツナグ"
                className="h-8 sm:h-10 w-auto object-contain drop-shadow-sm transition-transform duration-150 group-hover:scale-[1.02]"
                loading="eager"
                decoding="async"
              />
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
              {currentMessage}
            </h1>

            <p className="text-gray-700 text-base sm:text-lg font-medium">
              就活の不安や疑問、なんでも気軽に相談してください。経験豊富な先輩たちがあなたの話を親身に聞き、的確なアドバイスを提供します。
            </p>

            {/* 装飾点 */}
            <div className="flex justify-center mt-6 space-x-2">
              <div className="w-2 h-2 bg-orange-300 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>

            {/* 右下に「外部へ」アイコン（視覚的にわかるように） */}
            <div className="absolute right-4 bottom-4 opacity-70 group-hover:opacity-100 transition-opacity">
              <i className="ri-external-link-line text-lg text-orange-500" aria-hidden="true"></i>
              <span className="sr-only">外部ページへ移動</span>
            </div>
          </div>
        </div>
      </div>

      {/* 全面クリックにしたい場合は、下の透明リンクを有効化してもOK */}
      {/* <a href={HERO_LINK} target="_blank" rel="noopener noreferrer" className="absolute inset-0" aria-label="外部ページへ" /> */}
    </section>
  );
}