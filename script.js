/**
 * マジつなぐ - 就活支援Webアプリ
 * バニラJavaScript実装
 */

// LINE設定（差し替え可能）
const LINE_ADD_URL = "https://lin.ee/xxxxx";
const LINE_PROFILE_URL = "https://page.line.biz/account-page/xxxxxxxx/profile";
const LINE_QR_IMG = "";

// DOM ユーティリティ
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const g = (id) => document.getElementById(id);

// グローバル状態
let activeYear = 'all';
let filters = {
    q: '',
    jobType: '',
    mode: '',
    startDate: '',
    endDate: '',
    onlyOpen: false,
    favOnly: false,
    activeYear: 'all'
};

// ヒーローテキストのローテーション
const heroTexts = [
    "就活相談、ゆるっと受け付けてます",
    "まずは話そ。就活の相談口、ここです",
    "進路相談（個別対応）受付中"
];

// サンプルデータ
const sampleJobs = [
    {
        id: 1,
        title: "IT業界研究セミナー",
        company: "テックカンパニー株式会社",
        year: "2026",
        jobType: "セミナー",
        mode: "オンライン",
        place: "Zoom",
        dateStart: "2024-02-15",
        dateEnd: "2024-02-15",
        tags: ["IT", "エンジニア", "初心者歓迎"],
        desc: "IT業界の最新動向と求められるスキルについて詳しく解説します。現役エンジニアとの座談会も予定しています。",
        applyUrl: "https://example.com/apply/1",
        image: "",
        approved: true,
        createdAt: "2024-01-15T10:00:00Z"
    },
    {
        id: 2,
        title: "金融業界インターンシップ説明会",
        company: "メガバンク",
        year: "2027",
        jobType: "インターン",
        mode: "対面",
        place: "東京本社",
        dateStart: "2024-02-20",
        dateEnd: "2024-02-22",
        tags: ["金融", "銀行", "インターン"],
        desc: "3日間の集中インターンシップの説明会です。実際の業務体験や先輩社員との交流があります。",
        applyUrl: "https://example.com/apply/2",
        image: "",
        approved: true,
        createdAt: "2024-01-16T10:00:00Z"
    },
    {
        id: 3,
        title: "商社業界座談会",
        company: "総合商社ABC",
        year: "2028",
        jobType: "座談会",
        mode: "対面",
        place: "大阪支社",
        dateStart: "2024-03-01",
        dateEnd: "2024-03-01",
        tags: ["商社", "グローバル", "座談会"],
        desc: "商社の仕事内容や海外勤務について、現役社員が詳しくお話しします。",
        applyUrl: "https://example.com/apply/3",
        image: "",
        approved: true,
        createdAt: "2024-01-17T10:00:00Z"
    }
];

/**
 * 初期化処理
 */
function init() {
    // サンプルデータの初期化
    if (!localStorage.getItem('submissions')) {
        saveSubmits(sampleJobs);
    }
    
    // 初回ポップアップの表示判定
    if (!localStorage.getItem('firstPopupDismissed')) {
        g('firstPopup').classList.remove('hidden');
    } else {
        g('firstPopup').classList.add('hidden');
    }
    
    // ヒーローテキストのランダム表示
    const randomText = heroTexts[Math.floor(Math.random() * heroTexts.length)];
    g('heroText').textContent = randomText;
    
    // イベントリスナーの設定
    setupEventListeners();
    
    // 初期表示
    renderYearChips();
    loadAndRender();
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    // 卒年チップ
    $$('.year-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            activeYear = e.target.dataset.year;
            filters.activeYear = activeYear;
            renderYearChips();
            loadAndRender();
        });
    });
    
    // ヘッダーボタン
    g('searchBtn').addEventListener('click', () => openSearchModal());
    g('loginBtn').addEventListener('click', () => openLoginModal());
    g('registerBtn').addEventListener('click', () => openRegisterModal());
    g('menuBtn').addEventListener('click', () => openDrawer());
    
    // 検索ランチャー
    g('searchLauncher').addEventListener('click', () => openSearchModal());
    
    // ドロワー
    g('closeDrawer').addEventListener('click', () => closeDrawer());
    
    // ドロワーメニュー
    g('homeBtn').addEventListener('click', () => {
        closeDrawer();
        resetFilters();
        loadAndRender();
    });
    g('profileBtn').addEventListener('click', () => openProfileModal());
    g('contactBtn').addEventListener('click', () => openContactModal());
    g('adminBtn').addEventListener('click', () => openAdminModal());
    g('termsBtn').addEventListener('click', () => openTermsModal());
    g('privacyBtn').addEventListener('click', () => openPrivacyModal());
    g('companyBtn').addEventListener('click', () => openCompanyModal());
    g('lineBtn').addEventListener('click', () => openLineProfile());
    
    // 初回ポップアップ
    g('closeFirstPopup').addEventListener('click', () => closeFirstPopup());
    g('lineAddBtn').addEventListener('click', () => {
        window.open(LINE_ADD_URL, '_blank');
        closeFirstPopup();
    });
    g('skipPopup').addEventListener('click', () => closeFirstPopup());
    
    // モーダル
    g('modalBackdrop').addEventListener('click', () => closeModal());
    
    // ESCキーでモーダル/ドロワーを閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeDrawer();
        }
    });
}

/**
 * 卒年チップの描画
 */
function renderYearChips() {
    $$('.year-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.year === activeYear);
    });
}

/**
 * データ読み込みと描画
 */
function loadAndRender() {
    const jobs = loadSubmits();
    const filteredJobs = applyFilters(jobs);
    render(filteredJobs);
}

/**
 * 求人リストの描画
 * @param {Array} list - 求人リスト
 */
function render(list) {
    const container = g('jobList');
    const count = g('resultsCount');
    
    count.textContent = `${list.length}件の求人`;
    
    if (list.length === 0) {
        container.innerHTML = '<div class="text-center" style="padding: 2rem; color: var(--mut);">該当する求人が見つかりませんでした</div>';
        return;
    }
    
    container.innerHTML = list.map(job => `
        <div class="job-card" data-job-id="${job.id}">
            <div class="job-image">
                ${job.image ? `<img src="${job.image}" alt="${job.title}" style="width: 100%; height: 100%; object-fit: cover;">` : '📷 画像なし'}
            </div>
            <div class="job-content">
                <div class="job-header">
                    <h3 class="job-title">${job.title}</h3>
                    <button class="job-favorite ${isFavorite(job.id) ? 'active' : ''}" data-job-id="${job.id}">★</button>
                </div>
                <div class="job-company">${job.company}</div>
                <div class="job-tags">
                    ${job.tags.map(tag => `<span class="job-tag">${tag}</span>`).join('')}
                </div>
                <div class="job-date">${formatDate(job.dateStart)} - ${formatDate(job.dateEnd)}</div>
            </div>
        </div>
    `).join('');
    
    // カードクリックイベント
    $$('.job-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('job-favorite')) {
                const jobId = parseInt(card.dataset.jobId);
                const job = list.find(j => j.id === jobId);
                if (job) openJobModal(job);
            }
        });
    });
    
    // お気に入りボタンイベント
    $$('.job-favorite').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const jobId = parseInt(btn.dataset.jobId);
            toggleFavorite(jobId);
            btn.classList.toggle('active');
        });
    });
}

/**
 * フィルタ適用
 * @param {Array} jobs - 求人リスト
 * @returns {Array} フィルタ済み求人リスト
 */
function applyFilters(jobs) {
    return jobs.filter(job => {
        if (!job.approved) return false;
        
        // 卒年フィルタ
        if (filters.activeYear !== 'all' && job.year !== filters.activeYear) {
            return false;
        }
        
        // キーワード検索
        if (filters.q) {
            const query = filters.q.toLowerCase();
            const searchText = `${job.title} ${job.company} ${job.desc} ${job.tags.join(' ')}`.toLowerCase();
            if (!searchText.includes(query)) return false;
        }
        
        // 職種フィルタ
        if (filters.jobType && job.jobType !== filters.jobType) {
            return false;
        }
        
        // 開催形式フィルタ
        if (filters.mode && job.mode !== filters.mode) {
            return false;
        }
        
        // 期間フィルタ
        if (filters.startDate && filters.endDate) {
            if (!inPeriod(job.dateStart, job.dateEnd, filters.startDate, filters.endDate)) {
                return false;
            }
        }
        
        // お気に入りのみ
        if (filters.favOnly && !isFavorite(job.id)) {
            return false;
        }
        
        return true;
    });
}

/**
 * 期間重なり判定（1日でも重なればtrue）
 * @param {string} st - 開始日1
 * @param {string} en - 終了日1
 * @param {string} s - 開始日2
 * @param {string} e - 終了日2
 * @returns {boolean} 重なりがあるかどうか
 */
function inPeriod(st, en, s, e) {
    const start1 = new Date(st);
    const end1 = new Date(en);
    const start2 = new Date(s);
    const end2 = new Date(e);
    
    return start1 <= end2 && end1 >= start2;
}

/**
 * 求人詳細モーダルを開く
 * @param {Object} job - 求人データ
 */
function openJobModal(job) {
    const content = `
        <div class="flex-between mb-md">
            <h2 style="margin: 0; font-size: var(--font-xl);">${job.title}</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <div class="job-detail">
            <div class="job-image" style="height: 300px; margin-bottom: var(--spacing-md);">
                ${job.image ? `<img src="${job.image}" alt="${job.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius);">` : '📷 画像なし'}
            </div>
            <div class="mb-md">
                <strong>企業名:</strong> ${job.company}
            </div>
            <div class="mb-md">
                <strong>対象:</strong> ${job.year}年卒
            </div>
            <div class="mb-md">
                <strong>種別:</strong> ${job.jobType}
            </div>
            <div class="mb-md">
                <strong>開催形式:</strong> ${job.mode}
            </div>
            <div class="mb-md">
                <strong>場所:</strong> ${job.place}
            </div>
            <div class="mb-md">
                <strong>開催期間:</strong> ${formatDate(job.dateStart)} - ${formatDate(job.dateEnd)}
            </div>
            <div class="mb-md">
                <strong>タグ:</strong> ${job.tags.map(tag => `<span class="job-tag">${tag}</span>`).join(' ')}
            </div>
            <div class="mb-md">
                <strong>詳細:</strong><br>
                <p style="margin-top: var(--spacing-xs); line-height: 1.6;">${job.desc}</p>
            </div>
            <div class="flex gap-sm" style="margin-top: var(--spacing-lg);">
                <button class="btn-primary" onclick="participate(${job.id}, '${job.company}', '${job.applyUrl}')">参加申込</button>
                <button class="btn-secondary ${isFavorite(job.id) ? 'active' : ''}" onclick="toggleFavorite(${job.id}); this.classList.toggle('active')">
                    ${isFavorite(job.id) ? '★ お気に入り済み' : '☆ お気に入り'}
                </button>
            </div>
        </div>
    `;
    
    g('modalContent').innerHTML = content;
    g('modalDialog').classList.add('is-job-detail');
    openModal();
}

/**
 * 検索モーダルを開く
 */
function openSearchModal() {
    const content = `
        <div class="flex-between mb-md">
            <h2 style="margin: 0;">条件で検索</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <form id="searchForm">
            <div class="form-group">
                <label class="form-label">キーワード</label>
                <input type="text" class="form-input" id="searchQuery" value="${filters.q}" placeholder="企業名、職種、内容など">
            </div>
            <div class="form-group">
                <label class="form-label">職種</label>
                <select class="form-select" id="searchJobType">
                    <option value="">すべて</option>
                    <option value="セミナー" ${filters.jobType === 'セミナー' ? 'selected' : ''}>セミナー</option>
                    <option value="インターン" ${filters.jobType === 'インターン' ? 'selected' : ''}>インターン</option>
                    <option value="座談会" ${filters.jobType === '座談会' ? 'selected' : ''}>座談会</option>
                    <option value="説明会" ${filters.jobType === '説明会' ? 'selected' : ''}>説明会</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">開催形式</label>
                <select class="form-select" id="searchMode">
                    <option value="">すべて</option>
                    <option value="オンライン" ${filters.mode === 'オンライン' ? 'selected' : ''}>オンライン</option>
                    <option value="対面" ${filters.mode === '対面' ? 'selected' : ''}>対面</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">開催期間</label>
                <div class="flex gap-sm">
                    <input type="date" class="form-input" id="searchStartDate" value="${filters.startDate}">
                    <span style="align-self: center;">〜</span>
                    <input type="date" class="form-input" id="searchEndDate" value="${filters.endDate}">
                </div>
            </div>
            <div class="form-checkbox">
                <input type="checkbox" id="searchFavOnly" ${filters.favOnly ? 'checked' : ''}>
                <label for="searchFavOnly">お気に入りのみ</label>
            </div>
            <div class="flex gap-sm" style="margin-top: var(--spacing-lg);">
                <button type="submit" class="btn-primary">検索</button>
                <button type="button" class="btn-secondary" onclick="resetSearch()">リセット</button>
            </div>
        </form>
    `;
    
    g('modalContent').innerHTML = content;
    g('modalDialog').classList.remove('is-job-detail');
    openModal();
    
    // フォーム送信イベント
    g('searchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        executeSearch();
    });
}

/**
 * 検索実行
 */
function executeSearch() {
    filters.q = g('searchQuery').value;
    filters.jobType = g('searchJobType').value;
    filters.mode = g('searchMode').value;
    filters.startDate = g('searchStartDate').value;
    filters.endDate = g('searchEndDate').value;
    filters.favOnly = g('searchFavOnly').checked;
    
    saveFilters();
    closeModal();
    loadAndRender();
}

/**
 * 検索リセット
 */
function resetSearch() {
    g('searchQuery').value = '';
    g('searchJobType').value = '';
    g('searchMode').value = '';
    g('searchStartDate').value = '';
    g('searchEndDate').value = '';
    g('searchFavOnly').checked = false;
}

/**
 * ログインモーダルを開く
 */
function openLoginModal() {
    const content = `
        <div class="flex-between mb-md">
            <h2 style="margin: 0;">ログイン</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <form id="loginForm">
            <div class="form-group">
                <label class="form-label">メールアドレス</label>
                <input type="email" class="form-input" id="loginEmail" required>
            </div>
            <div class="form-group">
                <label class="form-label">パスワード</label>
                <input type="password" class="form-input" id="loginPassword" required>
            </div>
            <button type="submit" class="btn-primary" style="width: 100%;">ログイン</button>
        </form>
        <div class="text-center mt-md">
            <button class="btn-secondary" onclick="openRegisterModal()">新規登録はこちら</button>
        </div>
    `;
    
    g('modalContent').innerHTML = content;
    g('modalDialog').classList.remove('is-job-detail');
    openModal();
    
    g('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        executeLogin();
    });
}

/**
 * ログイン実行
 */
function executeLogin() {
    const email = g('loginEmail').value;
    const password = g('loginPassword').value;
    
    const profiles = JSON.parse(localStorage.getItem('profiles') || '[]');
    const user = profiles.find(p => p.email === email && p.password === password);
    
    if (user) {
        localStorage.setItem('me_email', email);
        alert('ログインしました');
        closeModal();
    } else {
        alert('メールアドレスまたはパスワードが間違っています');
    }
}

/**
 * 新規登録モーダルを開く
 */
function openRegisterModal() {
    const content = `
        <div class="flex-between mb-md">
            <h2 style="margin: 0;">新規登録</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <form id="registerForm">
            <div class="form-group">
                <label class="form-label">氏名</label>
                <input type="text" class="form-input" id="registerName" required>
            </div>
            <div class="form-group">
                <label class="form-label">大学</label>
                <input type="text" class="form-input" id="registerUniversity" required>
            </div>
            <div class="form-group">
                <label class="form-label">メールアドレス</label>
                <input type="email" class="form-input" id="registerEmail" required>
            </div>
            <div class="form-group">
                <label class="form-label">パスワード</label>
                <input type="password" class="form-input" id="registerPassword" required>
            </div>
            <button type="submit" class="btn-primary" style="width: 100%;">登録</button>
        </form>
        <div class="text-center mt-md">
            <button class="btn-secondary" onclick="openLoginModal()">ログインはこちら</button>
        </div>
    `;
    
    g('modalContent').innerHTML = content;
    g('modalDialog').classList.remove('is-job-detail');
    openModal();
    
    g('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        executeRegister();
    });
}

/**
 * 新規登録実行
 */
function executeRegister() {
    const profile = {
        email: g('registerEmail').value,
        name: g('registerName').value,
        university: g('registerUniversity').value,
        password: g('registerPassword').value,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    upsertProfile(profile);
    localStorage.setItem('me_email', profile.email);
    alert('登録が完了しました');
    closeModal();
}

/**
 * プロフィールモーダルを開く
 */
function openProfileModal() {
    closeDrawer();
    resetFilters();
    
    const email = currentUserEmail();
    if (!email) {
        openLoginModal();
        return;
    }
    
    const profiles = JSON.parse(localStorage.getItem('profiles') || '[]');
    const user = profiles.find(p => p.email === email);
    
    const content = `
        <div class="flex-between mb-md">
            <h2 style="margin: 0;">プロフィール</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <form id="profileForm">
            <div class="form-group">
                <label class="form-label">氏名</label>
                <input type="text" class="form-input" id="profileName" value="${user?.name || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">大学</label>
                <input type="text" class="form-input" id="profileUniversity" value="${user?.university || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">メールアドレス</label>
                <input type="email" class="form-input" id="profileEmail" value="${email}" readonly>
            </div>
            <div class="flex gap-sm" style="margin-top: var(--spacing-lg);">
                <button type="submit" class="btn-primary">更新</button>
                <button type="button" class="btn-secondary" onclick="logout()">ログアウト</button>
            </div>
        </form>
        
        <hr style="margin: var(--spacing-lg) 0; border: none; border-top: 1px solid var(--bd);">
        
        <h3 style="margin-bottom: var(--spacing-md);">参加履歴</h3>
        <div id="participationHistory"></div>
    `;
    
    g('modalContent').innerHTML = content;
    g('modalDialog').classList.remove('is-job-detail');
    openModal();
    
    g('profileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        updateProfile();
    });
    
    renderHistory();
}

/**
 * 参加履歴の描画
 */
function renderHistory() {
    const email = currentUserEmail();
    if (!email) return;
    
    const participants = JSON.parse(localStorage.getItem('participants') || '[]');
    const userParticipations = participants.filter(p => p.email === email);
    
    const historyContainer = g('participationHistory');
    if (!historyContainer) return;
    
    if (userParticipations.length === 0) {
        historyContainer.innerHTML = '<p style="color: var(--mut);">参加履歴がありません</p>';
        return;
    }
    
    const jobs = loadSubmits();
    const historyHtml = userParticipations.map(p => {
        const job = jobs.find(j => j.id === p.jobId);
        return `
            <div style="padding: var(--spacing-sm); border: 1px solid var(--bd); border-radius: var(--radius); margin-bottom: var(--spacing-sm);">
                <div style="font-weight: 500;">${job?.title || '削除された求人'}</div>
                <div style="color: var(--mut); font-size: var(--font-sm);">${p.company} - ${p.date}</div>
            </div>
        `;
    }).join('');
    
    historyContainer.innerHTML = historyHtml;
}

/**
 * お問い合わせモーダルを開く
 */
function openContactModal() {
    closeDrawer();
    resetFilters();
    
    const content = `
        <div class="flex-between mb-md">
            <h2 style="margin: 0;">資料請求・お問い合わせ</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <form id="contactForm">
            <div class="form-group">
                <label class="form-label">企業名</label>
                <input type="text" class="form-input" id="contactCompany" required>
            </div>
            <div class="form-group">
                <label class="form-label">担当者名</label>
                <input type="text" class="form-input" id="contactPerson" required>
            </div>
            <div class="form-group">
                <label class="form-label">電話番号</label>
                <input type="tel" class="form-input" id="contactTel">
            </div>
            <div class="form-group">
                <label class="form-label">メールアドレス</label>
                <input type="email" class="form-input" id="contactEmail" required>
            </div>
            <div class="form-group">
                <label class="form-label">お問い合わせ内容</label>
                <textarea class="form-textarea" id="contactBody" maxlength="500" required></textarea>
                <div style="text-align: right; font-size: var(--font-sm); color: var(--mut);">
                    <span id="contactBodyCount">0</span>/500文字
                </div>
            </div>
            <div class="form-checkbox">
                <input type="checkbox" id="contactAgreed" required>
                <label for="contactAgreed">プライバシーポリシーに同意する</label>
            </div>
            <button type="submit" class="btn-primary" style="width: 100%;">送信</button>
        </form>
    `;
    
    g('modalContent').innerHTML = content;
    g('modalDialog').classList.remove('is-job-detail');
    openModal();
    
    // 文字数カウント
    g('contactBody').addEventListener('input', (e) => {
        g('contactBodyCount').textContent = e.target.value.length;
    });
    
    g('contactForm').addEventListener('submit', (e) => {
        e.preventDefault();
        submitContact();
    });
}

/**
 * お問い合わせ送信
 */
function submitContact() {
    const contact = {
        id: Date.now(),
        company: g('contactCompany').value,
        person: g('contactPerson').value,
        tel: g('contactTel').value,
        email: g('contactEmail').value,
        body: g('contactBody').value,
        agreed: g('contactAgreed').checked,
        createdAt: new Date().toISOString()
    };
    
    const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    contacts.push(contact);
    localStorage.setItem('contacts', JSON.stringify(contacts));
    
    alert('お問い合わせを送信しました');
    closeModal();
}

/**
 * 管理モーダルを開く
 */
function openAdminModal() {
    closeDrawer();
    resetFilters();
    
    const content = `
        <div class="flex-between mb-md">
            <h2 style="margin: 0;">管理（承認）</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        
        <div style="margin-bottom: var(--spacing-lg);">
            <h3 style="margin-bottom: var(--spacing-md);">新規投稿</h3>
            <form id="submitForm">
                <div class="form-group">
                    <label class="form-label">タイトル</label>
                    <input type="text" class="form-input" id="submitTitle" required>
                </div>
                <div class="form-group">
                    <label class="form-label">企業名</label>
                    <input type="text" class="form-input" id="submitCompany" required>
                </div>
                <div class="form-group">
                    <label class="form-label">対象年度</label>
                    <select class="form-select" id="submitYear" required>
                        <option value="2026">2026年卒</option>
                        <option value="2027">2027年卒</option>
                        <option value="2028">2028年卒</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">職種</label>
                    <select class="form-select" id="submitJobType" required>
                        <option value="セミナー">セミナー</option>
                        <option value="インターン">インターン</option>
                        <option value="座談会">座談会</option>
                        <option value="説明会">説明会</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">開催形式</label>
                    <select class="form-select" id="submitMode" required>
                        <option value="オンライン">オンライン</option>
                        <option value="対面">対面</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">場所</label>
                    <input type="text" class="form-input" id="submitPlace" required>
                </div>
                <div class="form-group">
                    <label class="form-label">開始日</label>
                    <input type="date" class="form-input" id="submitDateStart" required>
                </div>
                <div class="form-group">
                    <label class="form-label">終了日</label>
                    <input type="date" class="form-input" id="submitDateEnd" required>
                </div>
                <div class="form-group">
                    <label class="form-label">タグ（カンマ区切り）</label>
                    <input type="text" class="form-input" id="submitTags" placeholder="例: IT,エンジニア,初心者歓迎">
                </div>
                <div class="form-group">
                    <label class="form-label">詳細説明</label>
                    <textarea class="form-textarea" id="submitDesc" required></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">応募URL</label>
                    <input type="url" class="form-input" id="submitApplyUrl" required>
                </div>
                <button type="submit" class="btn-primary">投稿</button>
            </form>
        </div>
        
        <hr style="margin: var(--spacing-lg) 0; border: none; border-top: 1px solid var(--bd);">
        
        <div style="margin-bottom: var(--spacing-lg);">
            <h3 style="margin-bottom: var(--spacing-md);">承認待ち</h3>
            <div id="pendingSubmissions"></div>
        </div>
        
        <hr style="margin: var(--spacing-lg) 0; border: none; border-top: 1px solid var(--bd);">
        
        <div>
            <h3 style="margin-bottom: var(--spacing-md);">データ管理</h3>
            <div class="flex gap-sm" style="flex-wrap: wrap;">
                <button class="btn-secondary" onclick="exportParticipants()">参加者データDL</button>
                <button class="btn-secondary" onclick="exportProfiles()">プロフィールDL</button>
                <button class="btn-secondary" onclick="exportContacts()">お問い合わせDL</button>
                <button class="btn-secondary" onclick="exportSubmissions()">投稿データDL</button>
            </div>
        </div>
    `;
    
    g('modalContent').innerHTML = content;
    g('modalDialog').classList.remove('is-job-detail');
    openModal();
    
    g('submitForm').addEventListener('submit', (e) => {
        e.preventDefault();
        submitNewJob();
    });
    
    renderPendingSubmissions();
}

/**
 * 承認待ち投稿の描画
 */
function renderPendingSubmissions() {
    const jobs = loadSubmits();
    const pending = jobs.filter(job => !job.approved);
    
    const container = g('pendingSubmissions');
    if (!container) return;
    
    if (pending.length === 0) {
        container.innerHTML = '<p style="color: var(--mut);">承認待ちの投稿はありません</p>';
        return;
    }
    
    container.innerHTML = pending.map(job => `
        <div style="padding: var(--spacing-md); border: 1px solid var(--bd); border-radius: var(--radius); margin-bottom: var(--spacing-sm);">
            <h4 style="margin: 0 0 var(--spacing-xs) 0;">${job.title}</h4>
            <div style="color: var(--mut); font-size: var(--font-sm); margin-bottom: var(--spacing-sm);">
                ${job.company} - ${job.year}年卒 - ${job.jobType}
            </div>
            <div class="flex gap-sm">
                <button class="btn-primary" onclick="approveJob(${job.id})">承認</button>
                <button class="btn-secondary" onclick="rejectJob(${job.id})">却下</button>
            </div>
        </div>
    `).join('');
}

/**
 * 新規求人投稿
 */
function submitNewJob() {
    const job = {
        id: Date.now(),
        title: g('submitTitle').value,
        company: g('submitCompany').value,
        year: g('submitYear').value,
        jobType: g('submitJobType').value,
        mode: g('submitMode').value,
        place: g('submitPlace').value,
        dateStart: g('submitDateStart').value,
        dateEnd: g('submitDateEnd').value,
        tags: g('submitTags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
        desc: g('submitDesc').value,
        applyUrl: g('submitApplyUrl').value,
        image: '',
        approved: false,
        createdAt: new Date().toISOString()
    };
    
    const jobs = loadSubmits();
    jobs.push(job);
    saveSubmits(jobs);
    
    alert('投稿しました。承認をお待ちください。');
    g('submitForm').reset();
    renderPendingSubmissions();
}

/**
 * 求人承認
 * @param {number} jobId - 求人ID
 */
function approveJob(jobId) {
    const jobs = loadSubmits();
    const job = jobs.find(j => j.id === jobId);
    if (job) {
        job.approved = true;
        saveSubmits(jobs);
        alert('承認しました');
        renderPendingSubmissions();
        loadAndRender();
    }
}

/**
 * 求人却下
 * @param {number} jobId - 求人ID
 */
function rejectJob(jobId) {
    const jobs = loadSubmits();
    const filteredJobs = jobs.filter(j => j.id !== jobId);
    saveSubmits(filteredJobs);
    alert('却下しました');
    renderPendingSubmissions();
}

/**
 * 利用規約モーダルを開く
 */
function openTermsModal() {
    closeDrawer();
    resetFilters();
    
    const content = `
        <div class="flex-between mb-md">
            <h2 style="margin: 0;">利用規約</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <div style="line-height: 1.8;">
            <h3>第1条（適用）</h3>
            <p>本規約は、マジつなぐ（以下「当サービス」）の利用に関する条件を定めるものです。</p>
            
            <h3>第2条（利用登録）</h3>
            <p>利用希望者は、本規約に同意の上、当サービスの定める方法によって利用登録を申請するものとします。</p>
            
            <h3>第3条（禁止事項）</h3>
            <p>ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul>
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>当サービスの運営を妨害する行為</li>
            </ul>
            
            <h3>第4条（免責事項）</h3>
            <p>当サービスは、ユーザーが当サービスを利用することによって生じた損害について、一切の責任を負いません。</p>
        </div>
    `;
    
    g('modalContent').innerHTML = content;
    g('modalDialog').classList.remove('is-job-detail');
    openModal();
}

/**
 * プライバシーポリシーモーダルを開く
 */
function openPrivacyModal() {
    closeDrawer();
    resetFilters();
    
    const content = `
        <div class="flex-between mb-md">
            <h2 style="margin: 0;">プライバシーポリシー</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <div style="line-height: 1.8;">
            <h3>個人情報の収集について</h3>
            <p>当サービスでは、サービス提供のために必要な個人情報を収集いたします。</p>
            
            <h3>個人情報の利用目的</h3>
            <ul>
                <li>サービスの提供・運営のため</li>
                <li>ユーザーからのお問い合わせに回答するため</li>
                <li>サービスの改善・開発のため</li>
            </ul>
            
            <h3>個人情報の第三者提供</h3>
            <p>当サービスは、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。</p>
            
            <h3>個人情報の管理</h3>
            <p>当サービスは、個人情報の漏洩、滅失、毀損等を防止するため、適切な安全管理措置を講じます。</p>
        </div>
    `;
    
    g('modalContent').innerHTML = content;
    g('modalDialog').classList.remove('is-job-detail');
    openModal();
}

/**
 * 会社情報モーダルを開く
 */
function openCompanyModal() {
    closeDrawer();
    resetFilters();
    
    const content = `
        <div class="flex-between mb-md">
            <h2 style="margin: 0;">会社情報</h2>
            <button class="btn-close" onclick="closeModal()">×</button>
        </div>
        <div style="line-height: 1.8;">
            <h3>マジつなぐ運営会社</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid var(--bd);">
                    <td style="padding: var(--spacing-sm); font-weight: 500;">会社名</td>
                    <td style="padding: var(--spacing-sm);">株式会社マジつなぐ</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--bd);">
                    <td style="padding: var(--spacing-sm); font-weight: 500;">代表者</td>
                    <td style="padding: var(--spacing-sm);">代表取締役 山田太郎</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--bd);">
                    <td style="padding: var(--spacing-sm); font-weight: 500;">所在地</td>
                    <td style="padding: var(--spacing-sm);">〒100-0001 東京都千代田区千代田1-1-1</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--bd);">
                    <td style="padding: var(--spacing-sm); font-weight: 500;">設立</td>
                    <td style="padding: var(--spacing-sm);">2020年4月1日</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--bd);">
                    <td style="padding: var(--spacing-sm); font-weight: 500;">事業内容</td>
                    <td style="padding: var(--spacing-sm);">就活支援サービスの企画・開発・運営</td>
                </tr>
                <tr>
                    <td style="padding: var(--spacing-sm); font-weight: 500;">お問い合わせ</td>
                    <td style="padding: var(--spacing-sm);">info@majitsunagu.com</td>
                </tr>
            </table>
        </div>
    `;
    
    g('modalContent').innerHTML = content;
    g('modalDialog').classList.remove('is-job-detail');
    openModal();
}

/**
 * LINE プロフィールを開く
 */
function openLineProfile() {
    if (LINE_PROFILE_URL) {
        // iFrame で表示を試行
        const iframe = document.createElement('iframe');
        iframe.src = LINE_PROFILE_URL;
        iframe.style.width = '100%';
        iframe.style.height = '500px';
        iframe.style.border = 'none';
        
        iframe.onerror = () => {
            // iFrame が失敗した場合は新しいタブで開く
            window.open(LINE_PROFILE_URL, '_blank');
        };
        
        const content = `
            <div class="flex-between mb-md">
                <h2 style="margin: 0;">LINE友だち追加</h2>
                <button class="btn-close" onclick="closeModal()">×</button>
            </div>
            <div class="text-center mb-md">
                <p>LINEで最新の就活情報をお届けします！</p>
            </div>
            <div id="lineIframeContainer"></div>
            <div class="text-center mt-md">
                <button class="btn-primary" onclick="window.open('${LINE_ADD_URL}', '_blank')">LINEで友だち追加</button>
            </div>
        `;
        
        g('modalContent').innerHTML = content;
        g('lineIframeContainer').appendChild(iframe);
    } else {
        window.open(LINE_ADD_URL, '_blank');
    }
    
    closeDrawer();
}

/**
 * モーダルを開く
 */
function openModal() {
    g('modal').classList.add('open');
    lockScroll(true);
    
    // 初期フォーカス
    const firstInput = g('modalContent').querySelector('input, textarea, select, button');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
}

/**
 * モーダルを閉じる
 */
function closeModal() {
    g('modal').classList.remove('open');
    g('modalDialog').classList.remove('is-job-detail');
    lockScroll(false);
}

/**
 * ドロワーを開く
 */
function openDrawer() {
    g('drawer').classList.add('open');
    lockScroll(true);
}

/**
 * ドロワーを閉じる
 */
function closeDrawer() {
    g('drawer').classList.remove('open');
    lockScroll(false);
}

/**
 * スクロールロック
 * @param {boolean} lock - ロックするかどうか
 */
function lockScroll(lock) {
    document.body.classList.toggle('scroll-locked', lock);
}

/**
 * 初回ポップアップを閉じる
 */
function closeFirstPopup() {
    g('firstPopup').classList.add('hidden');
    localStorage.setItem('firstPopupDismissed', '1');
}

/**
 * 参加申込
 * @param {number} jobId - 求人ID
 * @param {string} company - 企業名
 * @param {string} applyUrl - 応募URL
 */
function participate(jobId, company, applyUrl) {
    const email = currentUserEmail();
    if (!email) {
        alert('参加申込にはログインが必要です');
        closeModal();
        openLoginModal();
        return;
    }
    
    addParticipation(email, company, jobId);
    alert('参加申込を記録しました');
    
    // 応募URLを開く
    window.open(applyUrl, '_blank');
}

/**
 * 参加記録を追加
 * @param {string} email - メールアドレス
 * @param {string} company - 企業名
 * @param {number} jobId - 求人ID
 */
function addParticipation(email, company, jobId) {
    const participants = JSON.parse(localStorage.getItem('participants') || '[]');
    const participation = {
        id: Date.now(),
        email,
        company,
        jobId,
        date: new Date().toISOString().split('T')[0]
    };
    
    participants.push(participation);
    localStorage.setItem('participants', JSON.stringify(participants));
}

/**
 * お気に入りトグル
 * @param {number} jobId - 求人ID
 */
function toggleFavorite(jobId) {
    const favIds = JSON.parse(localStorage.getItem('favIds') || '[]');
    const index = favIds.indexOf(jobId);
    
    if (index === -1) {
        favIds.push(jobId);
    } else {
        favIds.splice(index, 1);
    }
    
    localStorage.setItem('favIds', JSON.stringify(favIds));
}

/**
 * お気に入り判定
 * @param {number} jobId - 求人ID
 * @returns {boolean} お気に入りかどうか
 */
function isFavorite(jobId) {
    const favIds = JSON.parse(localStorage.getItem('favIds') || '[]');
    return favIds.includes(jobId);
}

/**
 * 現在のユーザーメールアドレスを取得
 * @returns {string|null} メールアドレス
 */
function currentUserEmail() {
    return localStorage.getItem('me_email');
}

/**
 * プロフィール更新
 */
function updateProfile() {
    const email = currentUserEmail();
    if (!email) return;
    
    const profile = {
        email,
        name: g('profileName').value,
        university: g('profileUniversity').value,
        password: '', // パスワードは保持
        createdAt: '',
        updatedAt: new Date().toISOString()
    };
    
    // 既存のパスワードと作成日時を保持
    const profiles = JSON.parse(localStorage.getItem('profiles') || '[]');
    const existing = profiles.find(p => p.email === email);
    if (existing) {
        profile.password = existing.password;
        profile.createdAt = existing.createdAt;
    }
    
    upsertProfile(profile);
    alert('プロフィールを更新しました');
}

/**
 * プロフィールのアップサート
 * @param {Object} profile - プロフィールデータ
 */
function upsertProfile(profile) {
    const profiles = JSON.parse(localStorage.getItem('profiles') || '[]');
    const index = profiles.findIndex(p => p.email === profile.email);
    
    if (index === -1) {
        profiles.push(profile);
    } else {
        profiles[index] = profile;
    }
    
    localStorage.setItem('profiles', JSON.stringify(profiles));
}

/**
 * ログアウト
 */
function logout() {
    localStorage.removeItem('me_email');
    alert('ログアウトしました');
    closeModal();
}

/**
 * 求人データの読み込み
 * @returns {Array} 求人リスト
 */
function loadSubmits() {
    return JSON.parse(localStorage.getItem('submissions') || '[]');
}

/**
 * 求人データの保存
 * @param {Array} jobs - 求人リスト
 */
function saveSubmits(jobs) {
    localStorage.setItem('submissions', JSON.stringify(jobs));
}

/**
 * フィルタの保存
 */
function saveFilters() {
    localStorage.setItem('filters', JSON.stringify(filters));
}

/**
 * フィルタのリセット
 */
function resetFilters() {
    filters = {
        q: '',
        jobType: '',
        mode: '',
        startDate: '',
        endDate: '',
        onlyOpen: false,
        favOnly: false,
        activeYear: activeYear
    };
    saveFilters();
}

/**
 * 日付フォーマット
 * @param {string} dateString - 日付文字列
 * @returns {string} フォーマット済み日付
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * CSV エクスポート
 * @param {Array} rows - データ行
 * @param {Array} headers - ヘッダー行
 * @param {string} fileBaseName - ファイル名ベース
 */
function exportCSV(rows, headers, fileBaseName) {
    const csv = toCSV(rows, headers);
    const bom = '\uFEFF'; // BOM for UTF-8
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `${fileBaseName}_${today}.csv`;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(link.href);
}

/**
 * CSV 変換
 * @param {Array} rows - データ行
 * @param {Array} headers - ヘッダー行
 * @returns {string} CSV文字列
 */
function toCSV(rows, headers) {
    const csvRows = [headers];
    
    rows.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] || '';
            // CSV エスケープ
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvRows.push(values);
    });
    
    return csvRows.map(row => row.join(',')).join('\n');
}

/**
 * 参加者データエクスポート
 */
function exportParticipants() {
    const participants = JSON.parse(localStorage.getItem('participants') || '[]');
    const headers = ['id', 'email', 'company', 'jobId', 'date'];
    exportCSV(participants, headers, 'participants');
}

/**
 * プロフィールデータエクスポート
 */
function exportProfiles() {
    const profiles = JSON.parse(localStorage.getItem('profiles') || '[]');
    const headers = ['email', 'name', 'university', 'password', 'createdAt', 'updatedAt'];
    exportCSV(profiles, headers, 'profiles');
}

/**
 * お問い合わせデータエクスポート
 */
function exportContacts() {
    const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    const headers = ['id', 'company', 'person', 'tel', 'email', 'body', 'agreed', 'createdAt'];
    exportCSV(contacts, headers, 'contacts');
}

/**
 * 投稿データエクスポート
 */
function exportSubmissions() {
    const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
    const headers = ['id', 'title', 'company', 'year', 'jobType', 'mode', 'place', 'dateStart', 'dateEnd', 'tags', 'desc', 'applyUrl', 'image', 'approved', 'createdAt'];
    
    // tags配列を文字列に変換
    const processedSubmissions = submissions.map(sub => ({
        ...sub,
        tags: Array.isArray(sub.tags) ? sub.tags.join(',') : sub.tags
    }));
    
    exportCSV(processedSubmissions, headers, 'submissions');
}

// 初期化実行
document.addEventListener('DOMContentLoaded', init);