
import { useEffect, useState } from 'react';

export default function Hero() {
  const messages = [
    '就活相談、ゆるっと受け付けてます',
    'まずは話そ。就活の相談口、ここです',
    '進路相談（個別対応）受付中'
  ];
  
  const [currentMessage, setCurrentMessage] = useState('');
  
  useEffect(() => {
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setCurrentMessage(randomMessage);
  }, []);
  
  return (
    <section 
      className="relative py-12 sm:py-16 overflow-hidden"
      style={{
        backgroundImage: `url('https://readdy.ai/api/search-image?query=warm%20welcoming%20university%20campus%20scene%20with%20diverse%20students%20walking%20and%20talking%20together%2C%20bright%20sunny%20day%20with%20modern%20buildings%20in%20background%2C%20friendly%20atmosphere%20with%20orange%20and%20white%20color%20tones%2C%20natural%20lighting%20creating%20positive%20energy&width=1200&height=400&seq=hero-bg-1&orientation=landscape')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-orange-50/80 to-white/90"></div>
      
      {/* 装飾要素 */}
      <div className="absolute top-4 left-4 w-16 h-16 bg-gradient-to-br from-orange-200/30 to-orange-300/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-4 right-4 w-20 h-20 bg-gradient-to-br from-orange-100/40 to-orange-200/30 rounded-full blur-2xl"></div>
      
      <div className="relative flex justify-center px-4">
        <div className="w-full max-w-[min(88vw,520px)] md:max-w-[min(70vw,560px)] lg:max-w-[min(42vw,600px)] text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg border border-orange-100/50">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🟧</span>
              </div>
            </div>
            
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
              {currentMessage}
            </h1>
            <p className="text-gray-700 text-base sm:text-lg font-medium">
              本気の君を本気で繋ぐ。
            </p>
            
            {/* 装飾的な要素 */}
            <div className="flex justify-center mt-6 space-x-2">
              <div className="w-2 h-2 bg-orange-300 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
