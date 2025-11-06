
export default function Footer() {
  return (
    <footer className="bg-white/95 backdrop-blur-sm border-t border-gray-200 mt-16">
      <div className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* メインフッターコンテンツ */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* ロゴとサービス説明 */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-white text-lg font-bold">🟧</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: '"Pacifico", serif' }}>
                  マジつなぐ
                </h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                就活の不安を具体的な行動に変える、学生の相談口です。IT業界、金融業界、商社業界など様々な業界のセミナーやインターンシップ情報を提供し、学生と企業をつなぐプラットフォームです。
              </p>
              <div className="flex items-center space-x-4">
                <a 
                  href="https://lin.ee/xxxxx" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-chat-3-line mr-2"></i>
                  LINE友だち追加
                </a>
              </div>
            </div>
            
            {/* サービス */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">サービス</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-orange-600 transition-colors cursor-pointer">就活イベント検索</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors cursor-pointer">企業セミナー</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors cursor-pointer">インターンシップ</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors cursor-pointer">キャリア相談</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors cursor-pointer">業界研究</a></li>
              </ul>
            </div>
            
            {/* サポート */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">サポート</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-orange-600 transition-colors cursor-pointer">よくある質問</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors cursor-pointer">お問い合わせ</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors cursor-pointer">利用規約</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors cursor-pointer">プライバシーポリシー</a></li>
                <li><a href="#" className="hover:text-orange-600 transition-colors cursor-pointer">会社情報</a></li>
              </ul>
            </div>
          </div>
          
          {/* 区切り線 */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="text-sm text-gray-500">
                © 2024 マジつなぐ. All rights reserved.
              </div>
              <div className="flex items-center space-x-6">
                <a 
                  href="https://readdy.ai/?origin=logo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:text-orange-600 transition-colors cursor-pointer"
                >
                  Powered by Readdy
                </a>
                <div className="flex items-center space-x-4">
                  <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors cursor-pointer">
                    <i className="ri-twitter-line text-lg"></i>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors cursor-pointer">
                    <i className="ri-instagram-line text-lg"></i>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors cursor-pointer">
                    <i className="ri-facebook-line text-lg"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
