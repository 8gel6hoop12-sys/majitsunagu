'use client';

import { useEffect, useMemo, useRef, useState, startTransition } from 'react';
import Header from '../../components/feature/Header';
import Hero from '../../components/feature/Hero';
import SearchLauncher from '../../components/feature/SearchLauncher';
import JobCard from '../../components/feature/JobCard';
import Footer from '../../components/feature/Footer';
import Modal from '../../components/base/Modal';
import Button from '../../components/base/Button';
import Input from '../../components/base/Input';
import { useLocalStorage } from '../../hooks/useLocalStorage';

/* ================================
   設定（URLはここだけ触ればOK）
   ================================ */
const SUBMISSIONS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjQOVT36ZHz4MOPiXzd7JBWe5AHv27xcYs4x8DDMXuPiooVaIOsESJMn2zjQMorB8iPxgeQu4XpIGO/pub?gid=0&single=true&output=csv';
const PROFILES_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjQOVT36ZHz4MOPiXzd7JBWe5AHv27xcYs4x8DDMXuPiooVaIOsESJMn2zjQMorB8iPxgeQu4XpIGO/pub?gid=896826220&single=true&output=csv';
/** GAS Webアプリ（「全員」アクセス可でデプロイした最新の /exec URL） */
const WRITE_BASE =
  'https://script.google.com/macros/s/AKfycbw_5VtO-qTJj-OnK9TGN0LBSj9mfx4dAsOn7UfTcoLh62c8vG6_HXJzKIeDr85WgPaX/exec';

const LINE_ADD_URL = 'https://lin.ee/GrVcrFQ';

/* ================================
   型
   ================================ */
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
  email: string;        // 表示用（入力そのまま）
  name: string;
  university: string;
  password: string;
  createdAt: string;
  updatedAt: string;
  emailKey?: string;    // 判定用（lower/全半角正規化）
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

/* ================================
   ユーティリティ（正規化・CSV）
   ================================ */
const toAsciiBasic = (s: string) => {
  if (!s) return s;
  const map: Record<string, string> = {
    '＠': '@','．': '.','，': ',','：': ':','；': ';','（': '(','）': ')','［': '[','］': ']','｛': '{','｝': '}',
    '！': '!','？': '?','＋': '+','−': '-','ー': '-','＿': '_','　': ' '
  };
  s = s.replace(/[＠．，：；（）［］｛｝！？＋−ー＿　]/g, ch => map[ch] ?? ch);
  return s.replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
};
const normEmail = (s: string) => toAsciiBasic((s || '').trim()).toLowerCase();
const normText  = (s: string) => (s || '').trim();
const emailValid = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const cb = (url: string) => `${url}${url.includes('?') ? '&' : '?'}cb=${Date.now()}`;
const deepEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

/** CSV → rows */
function parseCsvToObjects(text: string): Record<string, string>[] {
  if (!text) return [];
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows: string[][] = [];
  let cur = '', q = false, r: string[] = [];
  const pushCell = () => { r.push(cur); cur = ''; };
  const pushRow = () => { rows.push(r.slice()); r = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (c === '"' && q && n === '"') { cur += '"'; i++; continue; }
    if (c === '"') { q = !q; continue; }
    if (c === ',' && !q) { pushCell(); continue; }
    if ((c === '\n' || c === '\r') && !q) { pushCell(); if (r.length > 1 || r[0] !== '') pushRow(); if (c === '\r' && n === '\n') i++; continue; }
    cur += c;
  }
  pushCell(); if (r.length > 1 || r[0] !== '') pushRow();
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(row => {
    const o: Record<string, string> = {};
    headers.forEach((h, i) => (o[h] = (row[i] ?? '').trim()));
    return o;
  });
}

function mapRowsToJobs(rows: Record<string, string>[]): Job[] {
  return rows.map((r, idx) => {
    const ap = String(r.approved ?? '').toLowerCase();
    const tags = (r.tags ?? '').split(',').map(s => s.trim()).filter(Boolean);
    const id = Number(r.id) || Date.now() + idx;
    return {
      id,
      title: r.title || '',
      company: r.company || '',
      year: r.year || '',
      jobType: r.jobType || '',
      mode: r.mode || '',
      place: r.place || '',
      dateStart: r.dateStart || r.start || '',
      dateEnd: r.dateEnd || r.end || r.dateStart || '',
      tags,
      desc: r.desc || r.description || '',
      applyUrl: r.applyUrl || r.url || '',
      image: r.image || r.image_url || '',
      approved: ap === 'true' || ap === '1' || ap === 'yes'
    };
  });
}

function mapRowsToProfiles(rows: Record<string, string>[]): Profile[] {
  const out = rows
    .filter(r => (r.email ?? '').trim())
    .map(r => {
      const email = r.email || '';
      const emailKey = normEmail(email);
      return {
        email,
        name: r.name || '',
        university: r.university || '',
        password: r.password || '',
        createdAt: r.createdAt || '',
        updatedAt: r.updatedAt || '',
        emailKey
      };
    });

  // 同一 emailKey の重複を createdAt/updatedAt 新しい方で吸収
  const byKey = new Map<string, Profile>();
  for (const p of out) {
    const prev = byKey.get(p.emailKey!);
    if (!prev) { byKey.set(p.emailKey!, p); continue; }
    const newer = (a: string, b: string) => (a && b ? (a > b ? a : b) : (a || b));
    byKey.set(p.emailKey!, {
      ...prev,
      ...p,
      createdAt: prev.createdAt || p.createdAt,
      updatedAt: newer(prev.updatedAt, p.updatedAt)
    });
  }
  return Array.from(byKey.values());
}

/* ================================
   ログインの“端末分離”実装（トークン × デバイスID）
   ================================ */
const DEVICE_ID_KEY = 'mt_device_id';
const TOKEN_KEY_SS  = 'mt_login_token_ss'; // sessionStorage（既定）
const TOKEN_KEY_LS  = 'mt_login_token_ls'; // localStorage（「この端末で保持」時のみ）

type LoginToken = {
  email: string;   // 表示用メール
  deviceId: string;
  iat: number;     // 発行時刻
  rand: string;    // ランダム
};

// 端末IDを安全に取得（nullを排除してからset/return）
const getDeviceId = (): string => {
  try {
    const saved = localStorage.getItem(DEVICE_ID_KEY);
    if (typeof saved === 'string' && saved.length > 0) {
      return saved; // ← ここで string が確定
    }
    const newId =
      (crypto as any)?.randomUUID?.() ??
      `dev_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    localStorage.setItem(DEVICE_ID_KEY, newId); // ← newId は string
    return newId;
  } catch {
    // ブラウザ制限で localStorage が使えなくても動作継続
    return 'dev_fallback';
  }
};

// トークン読取（nullを弾いてから JSON.parse）
const readToken = (): LoginToken | null => {
  try {
    const ss = sessionStorage.getItem(TOKEN_KEY_SS);
    const ls = localStorage.getItem(TOKEN_KEY_LS);
    const raw = ss ?? ls;           // string | null
    if (!raw) return null;          // ← null を先に弾く
    const tok = JSON.parse(raw) as LoginToken;
    if (!tok?.email || !tok?.deviceId) return null;
    return tok;
  } catch {
    return null;
  }
};

const clearToken = () => {
  try { sessionStorage.removeItem(TOKEN_KEY_SS); } catch {}
  try { localStorage.removeItem(TOKEN_KEY_LS); } catch {}
};

const finalizeLogin = (email: string, remember: boolean) => {
  const token: LoginToken = {
    email,
    deviceId: getDeviceId(),
    iat: Date.now(),
    rand: Math.random().toString(36).slice(2)
  };
  try {
    sessionStorage.setItem(TOKEN_KEY_SS, JSON.stringify(token));
    if (remember) {
      localStorage.setItem(TOKEN_KEY_LS, JSON.stringify(token));
    } else {
      localStorage.removeItem(TOKEN_KEY_LS);
    }
  } catch {}
  return token;
};

const restoreLogin = (): string => {
  const tok = readToken();
  if (!tok) return '';
  // デバイス一致チェック
  if (tok.deviceId !== getDeviceId()) {
    clearToken();
    return '';
  }
  return tok.email || '';
};

const hardLogout = () => {
  clearToken();
};

/* ================================
   GAS 書き込み（4段フォールバック）
   ================================ */
async function writeProfileRobust(baseUrl: string, p: Profile) {
  // 送信は URLSearchParams の「文字列」を使う（BlobPart 型エラー回避）
  const fields: Record<string, string> = {
    type: 'profiles',
    email: p.email,
    name: p.name,
    university: p.university,
    password: p.password,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  };
  const form = new URLSearchParams(fields).toString();

  // 1) 画像ビーコン（CORS無関係にGET）
  await new Promise<void>((resolve) => {
    try {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = cb(`${baseUrl}?${form}`);
      setTimeout(() => resolve(), 900);
    } catch { resolve(); }
  });

  // 2) fetch GET (no-cors)
  try { await fetch(cb(`${baseUrl}?${form}`), { method: 'GET', mode: 'no-cors', cache: 'no-store' }); } catch {}

  // 3) fetch POST (no-cors)
  try {
    await fetch(baseUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: form,
      cache: 'no-store'
    });
  } catch {}

  // 4) sendBeacon (対応ブラウザ)
  try {
    if ('sendBeacon' in navigator) {
      const blob = new Blob([form], { type: 'application/x-www-form-urlencoded;charset=UTF-8' });
      (navigator as any).sendBeacon(baseUrl, blob);
    }
  } catch {}
}

/* ================================
   本体
   ================================ */
export default function Home() {
  const [jobs, setJobs] = useLocalStorage<Job[]>('submissions', []);
  const [profiles, setProfiles] = useLocalStorage<Profile[]>('profiles', []);
  const [favIds, setFavIds] = useLocalStorage<number[]>('favIds', []);
  const [currentUserEmail, setCurrentUserEmail] = useLocalStorage<string>('me_email', '');

  const [activeYear, setActiveYear] = useState('すべて');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // モーダル
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // 求人詳細（自前オーバーレイで「必ず」出す）
  const [showJobOverlay, setShowJobOverlay] = useState(false);

  // フォーム
  const [searchFilters, setSearchFilters] = useState<Filters>({
    q: '', jobType: '', mode: '', startDate: '', endDate: '', onlyOpen: false, favOnly: false, activeYear: 'すべて'
  });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false); // ← 追加（端末保持のON/OFF）
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', name: '', university: '' });
  const [profileForm, setProfileForm] = useState({ name: '', university: '' });
  const [contactForm, setContactForm] = useState({ company: '', person: '', tel: '', email: '', body: '' });

  // ===== 初期読込（1回だけ / 差分反映でチカチカ抑制） + ログイン復元 =====
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    // 端末IDを確定（未発行なら発行）
    getDeviceId();

    // 起動時トークン検証 → 端末一致しない/トークンなしならログアウト状態に戻す
    const restored = restoreLogin();
    if (restored) {
      setCurrentUserEmail(restored);
    } else {
      setCurrentUserEmail('');
    }

    (async () => {
      try {
        const res = await fetch(cb(SUBMISSIONS_CSV_URL), { cache: 'no-store' });
        const txt = await res.text();
        const next = mapRowsToJobs(parseCsvToObjects(txt));
        if (!deepEqual(next, jobs)) setJobs(next);
      } catch {}
      try {
        const res = await fetch(cb(PROFILES_CSV_URL), { cache: 'no-store' });
        const txt = await res.text();
        const next = mapRowsToProfiles(parseCsvToObjects(txt));
        if (!deepEqual(next, profiles)) setProfiles(next);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // プロフィール編集モーダルを開いた時だけフォームに反映（安定化）
  useEffect(() => {
    if (!currentUserEmail || !showProfileModal) return;
    const emailKey = normEmail(currentUserEmail);
    const u = profiles.find(p => (p.emailKey ?? normEmail(p.email)) === emailKey);
    if (u) setProfileForm({ name: u.name, university: u.university });
  }, [currentUserEmail, showProfileModal, profiles]);

  /* ---------- 絞り込み ---------- */
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (!job.approved) return false;
      if (activeYear !== 'すべて' && job.year !== activeYear) return false;
      if (searchFilters.favOnly && !favIds.includes(job.id)) return false;
      if (searchFilters.q) {
        const q = searchFilters.q.toLowerCase();
        if (!(`${job.title} ${job.company} ${job.desc}`.toLowerCase().includes(q))) return false;
      }
      if (searchFilters.jobType && job.jobType !== searchFilters.jobType) return false;
      if (searchFilters.mode && job.mode !== searchFilters.mode) return false;
      if (searchFilters.startDate && searchFilters.endDate) {
        const fs = new Date(searchFilters.startDate);
        const fe = new Date(searchFilters.endDate);
        const js = new Date(job.dateStart);
        const je = new Date(job.dateEnd);
        if (je < fs || js > fe) return false;
      }
      return true;
    });
  }, [jobs, favIds, searchFilters, activeYear]);

  /* ---------- 動作 ---------- */
  const handleFavoriteToggle = (id: number) => {
    setFavIds(prev => (prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]));
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setShowJobOverlay(true); // 自前オーバーレイを確実に開く
  };

  const handleLogin = () => {
    const key = normEmail(loginForm.email);
    const pass = normText(loginForm.password);
    if (!key || !pass) return alert('メールとパスワードは必須です');
    const u = profiles.find(p => (p.emailKey ?? normEmail(p.email)) === key && p.password === pass);
    if (u) {
      // トークンを発行し、rememberMe に応じて保存先を切替
      finalizeLogin(u.email, rememberMe);
      setCurrentUserEmail(u.email);
      setShowLoginModal(false);
      setLoginForm({ email: '', password: '' });
      alert('ログインしました');
    } else {
      alert('メールアドレスまたはパスワードが間違っています');
    }
  };

  /** 新規登録 → GAS robust + ローカル upsert + 遅延確認 + トークン発行 */
  const handleRegister = async () => {
    const emailInput = registerForm.email;
    const emailKey = normEmail(emailInput);
    const now = new Date().toISOString();

    const newProf: Profile = {
      email: emailInput.trim(),
      name: normText(registerForm.name),
      university: normText(registerForm.university),
      password: registerForm.password || '',
      createdAt: now,
      updatedAt: now,
      emailKey
    };
    if (!emailKey || !newProf.password) return alert('メールとパスワードは必須です');
    if (!emailValid(emailKey)) return alert('メールアドレスの形式が正しくありません');

    // 楽観反映
    setProfiles(prev => {
      const i = prev.findIndex(p => (p.emailKey ?? normEmail(p.email)) === emailKey);
      if (i >= 0) {
        const cp = [...prev];
        cp[i] = { ...cp[i], ...newProf, createdAt: cp[i].createdAt || now };
        return cp;
      }
      return [...prev, newProf];
    });

    // ログイントークンを発行（新規登録後は即ログイン）
    finalizeLogin(newProf.email, true /* 初回は端末保持ONにしてもOK。好みで false にしてもよい */);
    setCurrentUserEmail(newProf.email);

    setShowRegisterModal(false);
    setRegisterForm({ email: '', password: '', name: '', university: '' });
    alert('登録を送信しました（数秒後に同期を確認します）');

    // 送信
    await writeProfileRobust(WRITE_BASE, { ...newProf, email: emailKey });

    // 遅延確認
    setTimeout(async () => {
      try {
        const res = await fetch(cb(PROFILES_CSV_URL), { cache: 'no-store' });
        const txt = await res.text();
        const next = mapRowsToProfiles(parseCsvToObjects(txt));
        startTransition(() => { if (!deepEqual(next, profiles)) setProfiles(next); });
      } catch {}
    }, 1800);
  };

  /** プロフィール更新 → GAS robust + ローカル upsert + 遅延確認（トークンは維持） */
  const handleProfileUpdate = async () => {
    if (!currentUserEmail) return;
    const key = normEmail(currentUserEmail);
    const old = profiles.find(p => (p.emailKey ?? normEmail(p.email)) === key);
    const now = new Date().toISOString();
    const next: Profile = {
      email: old?.email || currentUserEmail,
      name: normText(profileForm.name),
      university: normText(profileForm.university),
      password: old?.password || '',
      createdAt: old?.createdAt || now,
      updatedAt: now,
      emailKey: key
    };

    setProfiles(prev => {
      const i = prev.findIndex(p => (p.emailKey ?? normEmail(p.email)) === key);
      if (i >= 0) { const cp = [...prev]; cp[i] = next; return cp; }
      return [...prev, next];
    });
    alert('更新を送信しました（数秒後に同期を確認します）');

    await writeProfileRobust(WRITE_BASE, { ...next, email: key });

    setTimeout(async () => {
      try {
        const res = await fetch(cb(PROFILES_CSV_URL), { cache: 'no-store' });
        const txt = await res.text();
        const newer = mapRowsToProfiles(parseCsvToObjects(txt));
        startTransition(() => { if (!deepEqual(newer, profiles)) setProfiles(newer); });
      } catch {}
    }, 1500);

    setShowProfileModal(false);
  };

  const handleParticipate = (job: Job) => {
    if (!currentUserEmail) { setShowLoginModal(true); return; }
    alert(`${job.title}に参加申込みしました！`);
    window.open(job.applyUrl, '_blank');
  };

  const handleLogout = () => {
    hardLogout();
    setCurrentUserEmail('');
    setShowDrawer(false);
    alert('ログアウトしました');
  };

  const handleHomeClick = () => {
    setShowDrawer(false);
    setActiveYear('すべて');
    setSearchFilters({ q:'', jobType:'', mode:'', startDate:'', endDate:'', onlyOpen:false, favOnly:false, activeYear:'すべて' });
  };

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/20">
      {/* 背景装飾 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-orange-100/40 to-orange-200/20 rounded-full blur-xl" />
        <div className="absolute top-60 left-10 w-24 h-24 bg-gradient-to-br from-orange-200/30 to-orange-100/20 rounded-full blur-lg" />
        <div className="absolute bottom-40 right-20 w-40 h-40 bg-gradient-to-br from-orange-50/50 to-orange-100/30 rounded-full blur-2xl" />
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-gradient-to-br from-orange-200/20 to-orange-300/10 rounded-full blur-lg" />
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-gradient-to-br from-orange-100/30 to-orange-200/20 rounded-full blur-xl" />
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

      {/* 件数 */}
      <div className="flex justify-center px-4 mb-4">
        <div className="w-full max-w-[min(88vw,520px)] md:max-w-[min(70vw,560px)] lg:max-w-[min(42vw,600px)]">
          <div className="flex items-center justify-between">
            <p className="text-gray-600 text-sm">{filteredJobs.length}件のイベントが見つかりました</p>
            {activeYear !== 'すべて' && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">{activeYear}卒対象</span>
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
                <i className="ri-search-line text-3xl text-orange-400" />
              </div>
              <p className="text-gray-600 font-medium mb-2">条件に合うイベントが見つかりませんでした</p>
              <p className="text-gray-500 text-sm">検索条件を変更してお試しください</p>
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* ====== 既存モーダル群 ====== */}
      {/* 検索 */}
      <Modal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} title="条件でさがす" size="lg">
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
              <Input type="date" value={searchFilters.startDate} onChange={(e) => setSearchFilters(prev => ({ ...prev, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">終了日</label>
              <Input type="date" value={searchFilters.endDate} onChange={(e) => setSearchFilters(prev => ({ ...prev, endDate: e.target.value }))} />
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
              onClick={() => setSearchFilters({ q:'', jobType:'', mode:'', startDate:'', endDate:'', onlyOpen:false, favOnly:false, activeYear:'すべて' })}
              className="flex-1"
            >
              リセット
            </Button>
            <Button onClick={() => setShowSearchModal(false)} className="flex-1">検索</Button>
          </div>
        </div>
      </Modal>

      {/* ログイン */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} title="ログイン">
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

          {/* 端末保持チェック */}
          <label className="flex items-center text-sm text-gray-700">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mr-2"
            />
            この端末でログイン状態を保持
          </label>

          <Button onClick={handleLogin} className="w-full">ログイン</Button>
        </div>
      </Modal>

      {/* 新規登録 */}
      <Modal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} title="新規登録">
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
          <Button onClick={handleRegister} className="w-full">登録</Button>
        </div>
      </Modal>

      {/* プロフィール */}
      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title="プロフィール">
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
            <label className="block text sm font-medium text-gray-700 mb-2">メールアドレス</label>
            <Input type="email" value={currentUserEmail} disabled className="bg-gray-50" />
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button onClick={handleProfileUpdate} className="flex-1">更新</Button>
            <Button variant="outline" onClick={handleLogout} className="flex-1">ログアウト</Button>
          </div>
        </div>
      </Modal>

      {/* 資料請求・お問い合わせ（復活） */}
      <Modal isOpen={showContactModal} onClose={() => setShowContactModal(false)} title="資料請求・お問い合わせ" size="lg">
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
            <div className="text-right text-sm text-gray-500 mt-1">{contactForm.body.length}/500文字</div>
          </div>
          <Button onClick={() => { alert('送信しました'); setShowContactModal(false); }} className="w-full">送信</Button>
        </div>
      </Modal>

      {/* 会社・規約モーダル */}
      <Modal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} title="利用規約" size="lg">
        <div className="space-y-4 leading-7 max-h-[70vh] overflow-auto">
          <h3 className="font-semibold">第1条（適用）</h3>
          <p>本規約は、当サービスの利用条件を定めるものです。</p>
          <h3 className="font-semibold">第2条（利用登録）</h3>
          <p>利用希望者は、本規約に同意のうえ申請します。</p>
          <h3 className="font-semibold">第3条（禁止事項）</h3>
          <ul className="list-disc pl-6">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>運営を妨害する行為</li>
          </ul>
          <h3 className="font-semibold">第4条（免責）</h3>
          <p>当サービスは利用により生じた損害について責任を負いません。</p>
        </div>
      </Modal>

      <Modal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} title="プライバシーポリシー" size="lg">
        <div className="space-y-4 leading-7 max-h-[70vh] overflow-auto">
          <h3 className="font-semibold">個人情報の収集</h3>
          <p>サービス提供のために必要な範囲で収集します。</p>
          <h3 className="font-semibold">利用目的</h3>
          <ul className="list-disc pl-6">
            <li>サービスの提供・運営</li>
            <li>お問い合わせ対応</li>
            <li>サービス改善・開発</li>
          </ul>
          <h3 className="font-semibold">第三者提供</h3>
          <p>法令に基づく場合を除き、同意なく第三者に提供しません。</p>
          <h3 className="font-semibold">安全管理</h3>
          <p>適切な安全管理措置を講じます。</p>
        </div>
      </Modal>

      <Modal isOpen={showCompanyModal} onClose={() => setShowCompanyModal(false)} title="会社情報">
        <div className="space-y-4 leading-7">
          <h3 className="font-semibold">マジツナグ</h3>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b"><td className="py-2 font-medium w-32">団体名</td><td className="py-2">学生団体マジツナグ</td></tr>
              <tr className="border-b"><td className="py-2 font-medium">代表者</td><td className="py-2">大泉颯冬</td></tr>
              <tr className="border-b"><td className="py-2 font-medium">設立</td><td className="py-2">2025年11月8日</td></tr>
              <tr><td className="py-2 font-medium">お問い合わせ</td><td className="py-2">majitsunagu279@gmail.com</td></tr>
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ====== 求人詳細（自前オーバーレイ） ====== */}
      {showJobOverlay && selectedJob && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowJobOverlay(false)} />
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,720px)] max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-6"
            role="dialog" aria-modal="true"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[#ff7a00] bg-[#ff7a00]/10 px-3 py-1 rounded-full">
                {selectedJob.year}卒対象
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFavoriteToggle(selectedJob.id)}
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-200 cursor-pointer"
                  aria-label="お気に入り"
                >
                  <i className={`${favIds.includes(selectedJob.id) ? 'ri-heart-fill text-red-500' : 'ri-heart-line text-gray-600'} text-xl`}></i>
                </button>
                <button
                  onClick={() => setShowJobOverlay(false)}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                  aria-label="閉じる"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>

            <div className="h-48 sm:h-64 bg-gray-300 rounded-lg mb-6 overflow-hidden">
              {selectedJob.image ? (
                <img src={selectedJob.image} alt={selectedJob.title} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <i className="ri-image-line text-6xl text-gray-400"></i>
                </div>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
            <p className="text-lg text-gray-700 mb-4">{selectedJob.company}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-t border-b border-gray-200">
              <div><span className="text-sm text-gray-500">職種</span><p className="font-medium">{selectedJob.jobType}</p></div>
              <div><span className="text-sm text-gray-500">開催形式</span><p className="font-medium">{selectedJob.mode}</p></div>
              <div><span className="text-sm text-gray-500">場所</span><p className="font-medium">{selectedJob.place}</p></div>
              <div>
                <span className="text-sm text-gray-500">開催期間</span>
                <p className="font-medium">
                  {new Date(selectedJob.dateStart).toLocaleDateString()} - {new Date(selectedJob.dateEnd).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-gray-900 mb-2">詳細</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedJob.desc}</p>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {selectedJob.tags.map((tag, i) => (
                <span key={i} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">{tag}</span>
              ))}
            </div>

            <Button onClick={() => handleParticipate(selectedJob)} className="w-full mt-6" size="lg">参加申込み</Button>
          </div>
        </div>
      )}

      {/* ===== ドロワー ===== */}
      {showDrawer && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDrawer(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                    <img src="/assets/logo.png" alt="マジツナグ" className="h-8 w-auto object-contain" />
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
              <button onClick={handleHomeClick} className="w-full text-left p-3 hover:bg-orange-50 rounded-lg transition-all duration-200 cursor-pointer flex items-center">
                <i className="ri-home-line mr-3 text-orange-500"></i><span className="font-medium">ホームへ</span>
              </button>
              <button
                onClick={() => { setShowDrawer(false); if (!currentUserEmail) setShowLoginModal(true); else setShowProfileModal(true); }}
                className="w-full text-left p-3 hover:bg-orange-50 rounded-lg transition-all duration-200 cursor-pointer flex items-center"
              >
                <i className="ri-user-line mr-3 text-orange-500"></i><span className="font-medium">プロフィール</span>
              </button>
              <button onClick={() => { setShowDrawer(false); setShowContactModal(true); }} className="w-full text-left p-3 hover:bg-orange-50 rounded-lg transition-all duration-200 cursor-pointer">
                <i className="ri-mail-line mr-3 text-orange-500"></i><span className="font-medium">資料請求・お問い合わせ</span>
              </button>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <button onClick={() => { setShowDrawer(false); setShowTermsModal(true); }} className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 cursor-pointer">
                  <i className="ri-file-text-line mr-2 text-gray-500"></i><span>利用規約</span>
                </button>
                <button onClick={() => { setShowDrawer(false); setShowPrivacyModal(true); }} className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 cursor-pointer">
                  <i className="ri-shield-line mr-2 text-gray-500"></i><span>プライバシー</span>
                </button>
                <button onClick={() => { setShowDrawer(false); setShowCompanyModal(true); }} className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 cursor-pointer">
                  <i className="ri-building-line mr-2 text-gray-500"></i><span>団体情報</span>
                </button>
                <button onClick={() => window.open(LINE_ADD_URL, '_blank')} className="w-full text-left p-3 hover:bg-green-50 rounded-lg transition-all duration-200 cursor-pointer">
                  <i className="ri-chat-3-line mr-2 text-green-500"></i><span>LINE友だち追加</span>
                </button>
              </div>

              {currentUserEmail && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <button onClick={handleLogout} className="w-full text左 p-3 hover:bg-red-50 rounded-lg transition-all duration-200 text-red-600 cursor-pointer">
                    <i className="ri-logout-box-line mr-2"></i><span>ログアウト</span>
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
