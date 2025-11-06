
import { useState, useEffect } from 'react';
import Header from '../../components/feature/Header';
import Hero from '../../components/feature/Hero';
import SearchLauncher from '../../components/feature/SearchLauncher';
import JobCard from '../../components/feature/JobCard';
import Footer from '../../components/feature/Footer';
import Modal from '../../components/base/Modal';
import Button from '../../components/base/Button';
import Input from '../../components/base/Input';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface Job {
  id: number;
  title: string;
  company: string;
  year: string;
  jobType: string;
  mode: string;
  place: string;
  dateStart: string;
  dateEnd: string;
  tags: string[];
  desc: string;
  applyUrl: string;
  image?: string;
  approved: boolean;
}

interface Profile {
  email: string;
  name: string;
  university: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}

interface Filters {
  q: string;
  jobType: string;
  mode: string;
  startDate: string;
  endDate: string;
  onlyOpen: boolean;
  favOnly: boolean;
  activeYear: string;
}

export default function Home() {
  const [activeYear, setActiveYear] = useState('すべて');
  const [jobs, setJobs] = useLocalStorage<Job[]>('submissions', []);
  const [favIds, setFavIds] = useLocalStorage<number[]>('favIds', []);
  const [currentUserEmail, setCurrentUserEmail] = useLocalStorage<string>('me_email', '');
  const [profiles, setProfiles] = useLocalStorage<Profile[]>('profiles', []);
  const [firstPopupDismissed, setFirstPopupDismissed] = useLocalStorage<string>('firstPopupDismissed', '');
  
  // モーダル状態
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showFirstPopup, setShowFirstPopup] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // フォーム状態
  const [searchFilters, setSearchFilters] = useState<Filters>({
    q: '',
    jobType: '',
    mode: '',
    startDate: '',
    endDate: '',
    onlyOpen: false,
    favOnly: false,
    activeYear: 'すべて'
  });
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    name: '',
    university: ''
  });

  const [adminForm, setAdminForm] = useState({
    title: '',
    company: '',
    year: '2026',
    jobType: 'セミナー',
    mode: 'オンライン',
    place: '',
    dateStart: '',
    dateEnd: '',
    tags: '',
    desc: '',
    applyUrl: ''
  });

  const [profileForm, setProfileForm] = useState({
    name: '',
    university: ''
  });

  const [contactForm, setContactForm] = useState({
    company: '',
    person: '',
    tel: '',
    email: '',
    body: ''
  });
  
  // 初期データ設定
  useEffect(() => {
    if (jobs.length === 0) {
      const sampleJobs: Job[] = [
        {
          id: 1,
          title: 'IT業界研究セミナー',
          company: '株式会社テックイノベーション',
          year: '2026',
          jobType: 'IT・エンジニア',
          mode: 'オンライン',
          place: 'Zoom',
          dateStart: '2024-02-15',
          dateEnd: '2024-02-15',
          tags: ['IT', 'エンジニア', 'セミナー'],
          desc: 'IT業界の最新動向と求められるスキルについて詳しく解説します。現役エンジニアとの座談会も予定しています。プログラミング未経験者も大歓迎！業界の魅力や将来性について、実際に働く先輩たちから生の声を聞くことができます。',
          applyUrl: 'https://example.com/apply/1',
          image: 'https://readdy.ai/api/search-image?query=modern%20technology%20office%20with%20young%20professionals%20collaborating%20on%20computers%2C%20bright%20and%20welcoming%20workspace%20with%20natural%20lighting%2C%20diverse%20team%20of%20students%20and%20mentors%20working%20together%2C%20clean%20minimalist%20design%20with%20orange%20accents&width=400&height=240&seq=it-seminar-1&orientation=landscape',
          approved: true
        },
        {
          id: 2,
          title: '金融業界キャリアフォーラム',
          company: 'みらい銀行',
          year: '2027',
          jobType: '金融',
          mode: '対面',
          place: '東京国際フォーラム',
          dateStart: '2024-02-20',
          dateEnd: '2024-02-21',
          tags: ['金融', '銀行', 'キャリア'],
          desc: '金融業界の多様なキャリアパスをご紹介。銀行、証券、保険など幅広い分野の専門家が参加します。実際の業務内容から将来のキャリア展望まで、詳しくお話しします。個別相談ブースも設置予定です。',
          applyUrl: 'https://example.com/apply/2',
          image: 'https://readdy.ai/api/search-image?query=professional%20business%20conference%20with%20young%20people%20networking%2C%20modern%20conference%20hall%20with%20warm%20lighting%2C%20students%20talking%20with%20business%20professionals%2C%20friendly%20and%20approachable%20atmosphere%20with%20orange%20color%20scheme&width=400&height=240&seq=finance-forum-2&orientation=landscape',
          approved: true
        },
        {
          id: 3,
          title: 'マーケティング実践ワークショップ',
          company: 'クリエイティブマーケティング株式会社',
          year: '2026',
          jobType: 'マーケティング',
          mode: 'ハイブリッド',
          place: '渋谷オフィス + オンライン',
          dateStart: '2024-02-25',
          dateEnd: '2024-02-26',
          tags: ['マーケティング', 'ワークショップ', '実践'],
          desc: '実際のマーケティング課題に取り組む実践的なワークショップ。チーム戦でプレゼンテーションまで行います。SNSマーケティングからデジタル広告まで、最新のマーケティング手法を学べます。',
          applyUrl: 'https://example.com/apply/3',
          image: 'https://readdy.ai/api/search-image?query=creative%20marketing%20workshop%20with%20students%20brainstorming%2C%20colorful%20sticky%20notes%20and%20charts%20on%20walls%2C%20energetic%20young%20people%20collaborating%20in%20modern%20office%20space%2C%20bright%20and%20inspiring%20environment%20with%20orange%20highlights&width=400&height=240&seq=marketing-workshop-3&orientation=landscape',
          approved: true
        },
        {
          id: 4,
          title: 'スタートアップ企業説明会',
          company: 'イノベーション・ラボ株式会社',
          year: '2027',
          jobType: 'ベンチャー',
          mode: 'オンライン',
          place: 'Zoom',
          dateStart: '2024-03-01',
          dateEnd: '2024-03-01',
          tags: ['スタートアップ', 'ベンチャー', '説明会'],
          desc: '急成長中のスタートアップで働く魅力をお伝えします。大手企業とは違う、スピード感のある環境で成長したい方におすすめです。実際の社員との座談会もあります。',
          applyUrl: 'https://example.com/apply/4',
          image: 'https://readdy.ai/api/search-image?query=dynamic%20startup%20office%20with%20young%20entrepreneurs%2C%20modern%20open%20workspace%20with%20plants%20and%20natural%20light%2C%20diverse%20team%20of%20creative%20professionals%20collaborating%2C%20energetic%20and%20innovative%20atmosphere&width=400&height=240&seq=startup-4&orientation=landscape',
          approved: true
        },
        {
          id: 5,
          title: '商社業界座談会',
          company: '総合商社グローバル',
          year: '2028',
          jobType: '商社',
          mode: '対面',
          place: '大阪支社',
          dateStart: '2024-03-05',
          dateEnd: '2024-03-05',
          tags: ['商社', 'グローバル', '座談会'],
          desc: '商社の仕事内容や海外勤務について、現役社員が詳しくお話しします。グローバルに活躍したい方、語学力を活かしたい方におすすめです。海外駐在経験者との交流もあります。',
          applyUrl: 'https://example.com/apply/5',
          image: 'https://readdy.ai/api/search-image?query=international%20business%20meeting%20with%20diverse%20professionals%2C%20modern%20conference%20room%20with%20world%20map%2C%20young%20people%20discussing%20global%20opportunities%2C%20professional%20yet%20friendly%20atmosphere&width=400&height=240&seq=trading-5&orientation=landscape',
          approved: true
        },
        {
          id: 6,
          title: 'メーカー技術職セミナー',
          company: '日本製造株式会社',
          year: '2026',
          jobType: '製造・技術',
          mode: 'ハイブリッド',
          place: '本社工場 + オンライン',
          dateStart: '2024-03-10',
          dateEnd: '2024-03-11',
          tags: ['製造', '技術', 'ものづくり'],
          desc: '日本のものづくりを支える技術職の魅力をお伝えします。工場見学や実際の製品開発プロセスを体験できます。理系学生におすすめのイベントです。',
          applyUrl: 'https://example.com/apply/6',
          image: 'https://readdy.ai/api/search-image?query=modern%20manufacturing%20facility%20with%20young%20engineers%2C%20high-tech%20production%20line%20with%20safety%20equipment%2C%20students%20observing%20manufacturing%20processes%2C%20clean%20industrial%20environment%20with%20bright%20lighting&width=400&height=240&seq=manufacturing-6&orientation=landscape',
          approved: true
        }
      ];
      setJobs(sampleJobs);
    }
  }, [jobs.length, setJobs]);
  
  // 初回ポップアップ表示
  useEffect(() => {
    if (!firstPopupDismissed) {
      setShowFirstPopup(true);
    }
  }, [firstPopupDismissed]);

  // プロフィールフォーム初期化
  useEffect(() => {
    if (currentUserEmail && showProfileModal) {
      const user = profiles.find(p => p.email === currentUserEmail);
      if (user) {
        setProfileForm({
          name: user.name,
          university: user.university
        });
      }
    }
  }, [currentUserEmail, showProfileModal, profiles]);
  
  // フィルタリング
  const filteredJobs = jobs.filter(job => {
    if (!job.approved) return false;
    if (activeYear !== 'すべて' && job.year !== activeYear) return false;
    if (searchFilters.favOnly && !favIds.includes(job.id)) return false;
    if (searchFilters.q && !job.title.toLowerCase().includes(searchFilters.q.toLowerCase()) && 
        !job.company.toLowerCase().includes(searchFilters.q.toLowerCase())) return false;
    if (searchFilters.jobType && job.jobType !== searchFilters.jobType) return false;
    if (searchFilters.mode && job.mode !== searchFilters.mode) return false;
    
    // 期間フィルタ（1日でも重なればヒット）
    if (searchFilters.startDate && searchFilters.endDate) {
      const filterStart = new Date(searchFilters.startDate);
      const filterEnd = new Date(searchFilters.endDate);
      const jobStart = new Date(job.dateStart);
      const jobEnd = new Date(job.dateEnd);
      
      if (jobEnd < filterStart || jobStart > filterEnd) return false;
    }
    
    return true;
  });
  
  const handleFavoriteToggle = (id: number) => {
    setFavIds(prev => 
      prev.includes(id) 
        ? prev.filter(fid => fid !== id)
        : [...prev, id]
    );
  };
  
  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };
  
  const handleLogin = () => {
    const profile = profiles.find(p => p.email === loginForm.email && p.password === loginForm.password);
    if (profile) {
      setCurrentUserEmail(loginForm.email);
      setShowLoginModal(false);
      setLoginForm({ email: '', password: '' });
    } else {
      alert('メールアドレスまたはパスワードが間違っています');
    }
  };
  
  const handleRegister = () => {
    const newProfile: Profile = {
      ...registerForm,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const existingIndex = profiles.findIndex(p => p.email === registerForm.email);
    if (existingIndex >= 0) {
      const updatedProfiles = [...profiles];
      updatedProfiles[existingIndex] = { ...newProfile, createdAt: profiles[existingIndex].createdAt };
      setProfiles(updatedProfiles);
    } else {
      setProfiles([...profiles, newProfile]);
    }
    
    setCurrentUserEmail(registerForm.email);
    setShowRegisterModal(false);
    setRegisterForm({ email: '', password: '', name: '', university: '' });
  };
  
  const handleParticipate = (job: Job) => {
    if (!currentUserEmail) {
      setShowLoginModal(true);
      return;
    }
    
    // 参加記録を追加（実装は簡略化）
    alert(`${job.title}に参加申込みしました！`);
    window.open(job.applyUrl, '_blank');
  };
  
  const dismissFirstPopup = () => {
    setFirstPopupDismissed('1');
    setShowFirstPopup(false);
  };

  const handleHomeClick = () => {
    setShowDrawer(false);
    setActiveYear('すべて');
    setSearchFilters({
      q: '',
      jobType: '',
      mode: '',
      startDate: '',
      endDate: '',
      onlyOpen: false,
      favOnly: false,
      activeYear: 'すべて'
    });
  };

  const handleAdminSubmit = () => {
    const newJob: Job = {
      id: Date.now(),
      title: adminForm.title,
      company: adminForm.company,
      year: adminForm.year,
      jobType: adminForm.jobType,
      mode: adminForm.mode,
      place: adminForm.place,
      dateStart: adminForm.dateStart,
      dateEnd: adminForm.dateEnd,
      tags: adminForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      desc: adminForm.desc,
      applyUrl: adminForm.applyUrl,
      image: '',
      approved: false
    };

    setJobs(prev => [...prev, newJob]);
    setAdminForm({
      title: '',
      company: '',
      year: '2026',
      jobType: 'セミナー',
      mode: 'オンライン',
      place: '',
      dateStart: '',
      dateEnd: '',
      tags: '',
      desc: '',
      applyUrl: ''
    });
    alert('投稿しました。承認をお待ちください。');
  };

  const handleApproveJob = (jobId: number) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, approved: true } : job
    ));
    alert('承認しました');
  };

  const handleRejectJob = (jobId: number) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
    alert('却下しました');
  };

  const handleProfileUpdate = () => {
    if (!currentUserEmail) return;
    
    const updatedProfile: Profile = {
      email: currentUserEmail,
      name: profileForm.name,
      university: profileForm.university,
      password: profiles.find(p => p.email === currentUserEmail)?.password || '',
      createdAt: profiles.find(p => p.email === currentUserEmail)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingIndex = profiles.findIndex(p => p.email === currentUserEmail);
    if (existingIndex >= 0) {
      const updatedProfiles = [...profiles];
      updatedProfiles[existingIndex] = updatedProfile;
      setProfiles(updatedProfiles);
    } else {
      setProfiles([...profiles, updatedProfile]);
    }

    alert('プロフィールを更新しました');
    setShowProfileModal(false);
  };

  const handleContactSubmit = () => {
    // お問い合わせデータを保存（実装は簡略化）
    alert('お問い合わせを送信しました');
    setContactForm({
      company: '',
      person: '',
      tel: '',
      email: '',
      body: ''
    });
    setShowContactModal(false);
  };

  const handleLogout = () => {
    setCurrentUserEmail('');
    setShowDrawer(false);
    alert('ログアウトしました');
  };

  const pendingJobs = jobs.filter(job => !job.approved);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/20">
      {/* 背景装飾 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-orange-100/40 to-orange-200/20 rounded-full blur-xl"></div>
        <div className="absolute top-60 left-10 w-24 h-24 bg-gradient-to-br from-orange-200/30 to-orange-100/20 rounded-full blur-lg"></div>
        <div className="absolute bottom-40 right-20 w-40 h-40 bg-gradient-to-br from-orange-50/50 to-orange-100/30 rounded-full blur-2xl"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-gradient-to-br from-orange-200/20 to-orange-300/10 rounded-full blur-lg"></div>
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-gradient-to-br from-orange-100/30 to-orange-200/20 rounded-full blur-xl"></div>
      </div>

      <Header
        activeYear={activeYear}
        onYearChange={setActiveYear}
        onSearchClick={() => setShowSearchModal(true)}
        onLoginClick={() => setShowLoginModal(true)}
        onRegisterClick={() => setShowRegisterModal(true)}
        onMenuClick={() => setShowDrawer(true)}
        currentUser={currentUserEmail || null}
      />
      
      <Hero />
      
      <SearchLauncher onClick={() => setShowSearchModal(true)} />
      
      {/* 件数表示 */}
      <div className="flex justify-center px-4 mb-4">
        <div className="w-full max-w-[min(88vw,520px)] md:max-w-[min(70vw,560px)] lg:max-w-[min(42vw,600px)]">
          <div className="flex items-center justify-between">
            <p className="text-gray-600 text-sm">
              {filteredJobs.length}件のイベントが見つかりました
            </p>
            {activeYear !== 'すべて' && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                {activeYear}卒対象
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* 求人リスト */}
      <div className="flex justify-center px-4 pb-8">
        <div className="w-full max-w-[min(88vw,520px)] md:max-w-[min(70vw,560px)] lg:max-w-[min(42vw,600px)] space-y-4">
          {filteredJobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              isFavorite={favIds.includes(job.id)}
              onFavoriteToggle={handleFavoriteToggle}
              onCardClick={handleJobClick}
            />
          ))}
          
          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-search-line text-3xl text-orange-400"></i>
              </div>
              <p className="text-gray-600 font-medium mb-2">条件に合うイベントが見つかりませんでした</p>
              <p className="text-gray-500 text-sm">検索条件を変更してお試しください</p>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
      
      {/* ... existing modals ... */}
      
      {/* 検索モーダル */}
      <Modal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        title="条件でさがす"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">キーワード</label>
            <Input
              placeholder="イベント名や企業名で検索"
              value={searchFilters.q}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, q: e.target.value }))}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">職種</label>
              <select
                value={searchFilters.jobType}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, jobType: e.target.value }))}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff7a00] focus:border-transparent outline-none pr-8"
              >
                <option value="">すべて</option>
                <option value="IT・エンジニア">IT・エンジニア</option>
                <option value="金融">金融</option>
                <option value="マーケティング">マーケティング</option>
                <option value="営業">営業</option>
                <option value="コンサルティング">コンサルティング</option>
                <option value="ベンチャー">ベンチャー</option>
                <option value="商社">商社</option>
                <option value="製造・技術">製造・技術</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">開催形式</label>
              <select
                value={searchFilters.mode}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, mode: e.target.value }))}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff7a00] focus:border-transparent outline-none pr-8"
              >
                <option value="">すべて</option>
                <option value="オンライン">オンライン</option>
                <option value="対面">対面</option>
                <option value="ハイブリッド">ハイブリッド</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">開始日</label>
              <Input
                type="date"
                value={searchFilters.startDate}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">終了日</label>
              <Input
                type="date"
                value={searchFilters.endDate}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={searchFilters.favOnly}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, favOnly: e.target.checked }))}
                className="mr-2"
              />
              お気に入りのみ
            </label>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSearchFilters({
                  q: '',
                  jobType: '',
                  mode: '',
                  startDate: '',
                  endDate: '',
                  onlyOpen: false,
                  favOnly: false,
                  activeYear: 'すべて'
                });
              }}
              className="flex-1"
            >
              リセット
            </Button>
            <Button
              onClick={() => setShowSearchModal(false)}
              className="flex-1"
            >
              検索
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* ログインモーダル */}
      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="ログイン"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
            <Input
              type="email"
              placeholder="example@email.com"
              value={loginForm.email}
              onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
            <Input
              type="password"
              placeholder="パスワードを入力"
              value={loginForm.password}
              onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
            />
          </div>
          
          <Button onClick={handleLogin} className="w-full">
            ログイン
          </Button>
        </div>
      </Modal>
      
      {/* 新規登録モーダル */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="新規登録"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">氏名</label>
            <Input
              placeholder="山田太郎"
              value={registerForm.name}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">大学名</label>
            <Input
              placeholder="○○大学"
              value={registerForm.university}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, university: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
            <Input
              type="email"
              placeholder="example@email.com"
              value={registerForm.email}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
            <Input
              type="password"
              placeholder="パスワードを入力"
              value={registerForm.password}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
            />
          </div>
          
          <Button onClick={handleRegister} className="w-full">
            登録
          </Button>
        </div>
      </Modal>

      {/* 管理モーダル */}
      <Modal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        title="管理（承認）"
        size="xl"
      >
        <div className="space-y-6">
          {/* 新規投稿フォーム */}
          <div>
            <h3 className="text-lg font-semibold mb-4">新規投稿</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">タイトル</label>
                  <Input
                    placeholder="イベントタイトル"
                    value={adminForm.title}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">企業名</label>
                  <Input
                    placeholder="株式会社○○"
                    value={adminForm.company}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">対象年度</label>
                  <select
                    value={adminForm.year}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff7a00] focus:border-transparent outline-none pr-8"
                  >
                    <option value="2026">2026年卒</option>
                    <option value="2027">2027年卒</option>
                    <option value="2028">2028年卒</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">職種</label>
                  <select
                    value={adminForm.jobType}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, jobType: e.target.value }))}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff7a00] focus:border-transparent outline-none pr-8"
                  >
                    <option value="セミナー">セミナー</option>
                    <option value="インターン">インターン</option>
                    <option value="座談会">座談会</option>
                    <option value="説明会">説明会</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">開催形式</label>
                  <select
                    value={adminForm.mode}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, mode: e.target.value }))}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff7a00] focus:border-transparent outline-none pr-8"
                  >
                    <option value="オンライン">オンライン</option>
                    <option value="対面">対面</option>
                    <option value="ハイブリッド">ハイブリッド</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">場所</label>
                <Input
                  placeholder="開催場所"
                  value={adminForm.place}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, place: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">開始日</label>
                  <Input
                    type="date"
                    value={adminForm.dateStart}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, dateStart: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">終了日</label>
                  <Input
                    type="date"
                    value={adminForm.dateEnd}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, dateEnd: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">タグ（カンマ区切り）</label>
                <Input
                  placeholder="例: IT,エンジニア,初心者歓迎"
                  value={adminForm.tags}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, tags: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">詳細説明</label>
                <textarea
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff7a00] focus:border-transparent outline-none resize-none"
                  rows={4}
                  placeholder="イベントの詳細説明"
                  value={adminForm.desc}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, desc: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">応募URL</label>
                <Input
                  type="url"
                  placeholder="https://example.com/apply"
                  value={adminForm.applyUrl}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, applyUrl: e.target.value }))}
                />
              </div>

              <Button onClick={handleAdminSubmit} className="w-full">
                投稿
              </Button>
            </div>
          </div>

          {/* 承認待ち */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">承認待ち ({pendingJobs.length}件)</h3>
            {pendingJobs.length === 0 ? (
              <p className="text-gray-500">承認待ちの投稿はありません</p>
            ) : (
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {pendingJobs.map(job => (
                  <div key={job.id} className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">{job.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {job.company} - {job.year}年卒 - {job.jobType}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveJob(job.id)}
                      >
                        承認
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectJob(job.id)}
                      >
                        却下
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* プロフィールモーダル */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="プロフィール"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">氏名</label>
            <Input
              placeholder="山田太郎"
              value={profileForm.name}
              onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">大学名</label>
            <Input
              placeholder="○○大学"
              value={profileForm.university}
              onChange={(e) => setProfileForm(prev => ({ ...prev, university: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
            <Input
              type="email"
              value={currentUserEmail}
              disabled
              className="bg-gray-50"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button onClick={handleProfileUpdate} className="flex-1">
              更新
            </Button>
            <Button variant="outline" onClick={handleLogout} className="flex-1">
              ログアウト
            </Button>
          </div>
        </div>
      </Modal>

      {/* お問い合わせモーダル */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="資料請求・お問い合わせ"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">企業名</label>
              <Input
                placeholder="株式会社○○"
                value={contactForm.company}
                onChange={(e) => setContactForm(prev => ({ ...prev, company: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">担当者名</label>
              <Input
                placeholder="山田太郎"
                value={contactForm.person}
                onChange={(e) => setContactForm(prev => ({ ...prev, person: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">電話番号</label>
              <Input
                type="tel"
                placeholder="03-1234-5678"
                value={contactForm.tel}
                onChange={(e) => setContactForm(prev => ({ ...prev, tel: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
              <Input
                type="email"
                placeholder="example@company.com"
                value={contactForm.email}
                onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">お問い合わせ内容</label>
            <textarea
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff7a00] focus:border-transparent outline-none resize-none"
              rows={5}
              placeholder="お問い合わせ内容をご記入ください"
              value={contactForm.body}
              onChange={(e) => setContactForm(prev => ({ ...prev, body: e.target.value }))}
              maxLength={500}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {contactForm.body.length}/500文字
            </div>
          </div>

          <Button onClick={handleContactSubmit} className="w-full">
            送信
          </Button>
        </div>
      </Modal>
      
      {/* 求人詳細モーダル */}
      <Modal
        isOpen={showJobModal}
        onClose={() => setShowJobModal(false)}
        size="xl"
        className="is-job-detail"
      >
        {selectedJob && (
          <div>
            {/* 画像 */}
            <div className="h-48 sm:h-64 bg-gray-300 rounded-lg mb-6 overflow-hidden">
              {selectedJob.image ? (
                <img 
                  src={selectedJob.image} 
                  alt={selectedJob.title}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <i className="ri-image-line text-6xl text-gray-400"></i>
                </div>
              )}
            </div>
            
            {/* 詳細情報 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#ff7a00] bg-[#ff7a00]/10 px-3 py-1 rounded-full">
                  {selectedJob.year}卒対象
                </span>
                <button
                  onClick={() => handleFavoriteToggle(selectedJob.id)}
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-200 cursor-pointer"
                >
                  <i className={`${favIds.includes(selectedJob.id) ? 'ri-heart-fill text-red-500' : 'ri-heart-line text-gray-600'} text-xl`}></i>
                </button>
              </div>
              
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
              <p className="text-lg text-gray-700">{selectedJob.company}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-t border-b border-gray-200">
                <div>
                  <span className="text-sm text-gray-500">職種</span>
                  <p className="font-medium">{selectedJob.jobType}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">開催形式</span>
                  <p className="font-medium">{selectedJob.mode}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">場所</span>
                  <p className="font-medium">{selectedJob.place}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">開催期間</span>
                  <p className="font-medium">
                    {new Date(selectedJob.dateStart).toLocaleDateString()} - {new Date(selectedJob.dateEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">詳細</h3>
                <p className="text-gray-700 leading-relaxed">{selectedJob.desc}</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {selectedJob.tags.map((tag, index) => (
                  <span key={index} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              
              <Button
                onClick={() => handleParticipate(selectedJob)}
                className="w-full"
                size="lg"
              >
                参加申込み
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* 初回ポップアップ */}
      <Modal
        isOpen={showFirstPopup}
        onClose={dismissFirstPopup}
        title="マジつなぐへようこそ！"
      >
        <div className="text-center space-y-4">
          <div className="h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-200/50 to-orange-300/30"></div>
            <div className="relative">
              <span className="text-4xl">🟧</span>
              <div className="text-sm font-medium text-orange-800 mt-2">マジつなぐ</div>
            </div>
          </div>
          <p className="text-gray-700">
            就活の不安を具体的な行動に変える、あなたの相談口です。
          </p>
          <Button
            onClick={() => window.open('https://lin.ee/xxxxx', '_blank')}
            className="w-full"
          >
            LINE友だち追加
          </Button>
          <Button
            variant="outline"
            onClick={dismissFirstPopup}
            className="w-full"
          >
            後で
          </Button>
        </div>
      </Modal>
      
      {/* ドロワーメニュー */}
      {showDrawer && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDrawer(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🟧</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">メニュー</h2>
                </div>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              {currentUserEmail && (
                <div className="mt-4 p-3 bg-white/80 rounded-lg">
                  <p className="text-sm text-gray-600">ログイン中</p>
                  <p className="font-medium text-gray-900 truncate">{currentUserEmail}</p>
                </div>
              )}
            </div>
            
            <div className="p-6 space-y-2">
              <button 
                onClick={handleHomeClick}
                className="w-full text-left p-3 hover:bg-orange-50 rounded-lg transition-all duration-200 cursor-pointer flex items-center"
              >
                <i className="ri-home-line mr-3 text-orange-500"></i>
                <span className="font-medium">ホームへ</span>
              </button>
              <button 
                onClick={() => {
                  setShowDrawer(false);
                  if (!currentUserEmail) {
                    setShowLoginModal(true);
                  } else {
                    setShowProfileModal(true);
                  }
                }}
                className="w-full text-left p-3 hover:bg-orange-50 rounded-lg transition-all duration-200 cursor-pointer flex items-center"
              >
                <i className="ri-user-line mr-3 text-orange-500"></i>
                <span className="font-medium">プロフィール</span>
              </button>
              <button 
                onClick={() => {
                  setShowDrawer(false);
                  setShowContactModal(true);
                }}
                className="w-full text-left p-3 hover:bg-orange-50 rounded-lg transition-all duration-200 cursor-pointer flex items-center"
              >
                <i className="ri-mail-line mr-3 text-orange-500"></i>
                <span className="font-medium">資料請求・お問い合わせ</span>
              </button>
              <button 
                onClick={() => {
                  setShowDrawer(false);
                  setShowAdminModal(true);
                }}
                className="w-full text-left p-3 hover:bg-orange-50 rounded-lg transition-all duration-200 cursor-pointer flex items-center"
              >
                <i className="ri-settings-line mr-3 text-orange-500"></i>
                <span className="font-medium">管理（承認）</span>
              </button>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 cursor-pointer flex items-center">
                  <i className="ri-file-text-line mr-3 text-gray-500"></i>
                  <span>利用規約</span>
                </button>
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 cursor-pointer flex items-center">
                  <i className="ri-shield-line mr-3 text-gray-500"></i>
                  <span>プライバシー</span>
                </button>
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 cursor-pointer flex items-center">
                  <i className="ri-building-line mr-3 text-gray-500"></i>
                  <span>会社情報</span>
                </button>
                <button 
                  onClick={() => window.open('https://lin.ee/xxxxx', '_blank')}
                  className="w-full text-left p-3 hover:bg-green-50 rounded-lg transition-all duration-200 cursor-pointer flex items-center"
                >
                  <i className="ri-chat-3-line mr-3 text-green-500"></i>
                  <span>LINE友だち追加</span>
                </button>
              </div>
              
              {currentUserEmail && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left p-3 hover:bg-red-50 rounded-lg transition-all duration-200 text-red-600 cursor-pointer flex items-center"
                  >
                    <i className="ri-logout-box-line mr-3"></i>
                    <span>ログアウト</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
