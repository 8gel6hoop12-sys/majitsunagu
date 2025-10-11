/* ========= 設定 ========= */
const ADMIN_PASS = "Maji2025";

/* 訴求（差し替えOK） */
const HERO_IMG_URL = "";                       // 上部ヒーロー画像（空ならグレー）
const HERO_LINK    = "https://example.com";    // ヒーローリンク
const AD_IMG_URL   = "";                       // 下段広告画像
const AD_LINK      = "https://example.com/ad"; // 下段広告リンク

/* LINE 公式（必ず差し替え） */
const LINE_PROFILE_URL = "https://page.line.me/xxxxx/profile"; // 公式プロフィールURL
const LINE_ADD_URL     = "https://lin.ee/xxxxxxx";              // 友だち追加URL（短縮URL）
const LINE_QR_IMAGE    = "";                                    // 任意: QR画像URL（空でOK）

/* ========= DOM util ========= */
const g = (id)=>document.getElementById(id);

/* ========= Keys / Storage ========= */
const FAV_KEY="maj_fav", USERS_KEY="maj_users", SESSION_KEY="maj_session",
      SUBMIT_KEY="maj_submits", CONTACT_KEY="maj_contacts";
const load=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch{return d}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

/* ========= Year Chips ========= */
let activeYear='all'; const years=['all','2026','2027','2028'];
function renderYearChips(){ g('yearChipsHdr').innerHTML = years.map(y=>`<button type="button" class="year-chip ${y===activeYear?'is-active':''}" data-year="${y}">${y==='all'?'すべて':`${y}卒`}</button>`).join(''); }
function bindYearChips(){ g('yearChipsHdr').onclick=(e)=>{const b=e.target.closest('[data-year]'); if(!b)return; activeYear=b.dataset.year; renderYearChips(); applyFilters(1);} }

/* ========= ベース求人 ========= */
const baseJobs = [
  {id:1,title:"長期インターン/エンジニア",company:"マジつなぐラボ",year:"2026",wage:1300,open:true,mode:"オンライン",jobType:"エンジニア",dateStart:"2025-11-01",dateEnd:"2025-11-30",place:"リモート",tags:"React,API",img:"",applyUrl:"https://example.com/apply",desc:"React/JSの長期インターン。週2〜OK。"},
  {id:2,title:"企画/マーケ インターン",company:"MZ Works",year:"2027",wage:1200,open:true,mode:"対面",jobType:"マーケ",dateStart:"2025-10-10",dateEnd:"2025-12-10",place:"東京",tags:"SNS,分析",img:"",applyUrl:"https://example.com/apply2",desc:"SNS運用とレポート。"}
];

/* ========= 投稿/承認 ========= */
function loadSubmits(){ return load(SUBMIT_KEY,[]); }
function saveSubmits(a){ save(SUBMIT_KEY,a); }
function allJobs(){
  const extra=loadSubmits().filter(x=>x.approved).map(x=>({
    id:x.id,title:x.title,company:x.company,year:x.year||"2026",wage:+(x.wage||0),open:true,
    mode:x.mode||'オンライン',jobType:x.jobType||'',place:x.place||'',
    dateStart:x.dateStart||x.date||'',dateEnd:x.dateEnd||x.date||'',
    tags:x.tags||'',img:x.image||'',applyUrl:x.applyUrl||'',desc:x.desc||''
  }));
  return baseJobs.concat(extra);
}

/* ========= 検索状態 ========= */
const state={ q:'', jobType:'', modeOnline:false, modeOffline:false, onlyOpen:true, favOnly:false, start:'', end:'', sort:'new', size:6 };
const favSet=new Set(load(FAV_KEY,[]));

/* ========= 検索ポップ ========= */
function openSearchPop(){ const p=g('searchPop'); p.classList.add('show'); p.setAttribute('aria-hidden','false'); }
function closeSearchPop(){ const p=g('searchPop'); p.classList.remove('show'); p.setAttribute('aria-hidden','true'); }
function setupSearchPop(){
  g('openSearch').onclick=openSearchPop;
  g('searchLaunch').onclick=openSearchPop;
  g('spClose').onclick=closeSearchPop;
  g('searchPop').addEventListener('click',e=>{ if(e.target.id==='searchPop') closeSearchPop(); });
  g('spClear').onclick=()=>{ g('sp_q').value=''; g('sp_jobType').value=''; g('sp_modeOnline').checked=false; g('sp_modeOffline').checked=false; g('sp_onlyOpen').checked=true; g('sp_favOnly').checked=false; g('sp_start').value=''; g('sp_end').value=''; g('sp_sort').value='new'; g('sp_pageSize').value='6'; };
  g('searchForm').onsubmit=(e)=>{
    e.preventDefault();
    state.q=g('sp_q').value.trim();
    state.jobType=g('sp_jobType').value;
    state.modeOnline=g('sp_modeOnline').checked;
    state.modeOffline=g('sp_modeOffline').checked;
    state.onlyOpen=g('sp_onlyOpen').checked;
    state.favOnly=g('sp_favOnly').checked;
    state.start=g('sp_start').value;
    state.end=g('sp_end').value;
    state.sort=g('sp_sort').value;
    state.size=+(g('sp_pageSize').value||6);
    closeSearchPop();
    applyFilters(1);
  };
}

/* ========= 期間判定（1日でも重なればヒット） ========= */
function overlaps(js,je){ const S=state.start||'0000-01-01', E=state.end||'9999-12-31'; if(!state.start && !state.end) return true; const J1=js||'', J2=je||js||''; return (S<=J2)&&(E>=J1); }

/* ========= 一覧描画 ========= */
const cards=g('cards'), count=g('count'), pager=g('pager'), chips=g('activeChips'); let page=1;
function chipRender(){ const a=[]; if(activeYear!=='all')a.push(`${activeYear}卒`); if(state.q)a.push(`KW:${state.q}`); if(state.jobType)a.push(state.jobType); if(state.modeOnline)a.push('オンライン'); if(state.modeOffline)a.push('対面'); if(state.favOnly)a.push('★お気に入り'); if(state.onlyOpen)a.push('募集中のみ'); if(state.start||state.end)a.push(`開催期間:${state.start||'...'}〜${state.end||'...'}`); chips.innerHTML=a.map(s=>`<span class="chip">${s}</span>`).join(''); }
function cardHTML(item){
  const noImg=!item.img, favOn=favSet.has(item.id)?'is-on':''; 
  const dateLabel=item.dateStart?(item.dateEnd&&item.dateEnd!==item.dateStart?`${item.dateStart}〜${item.dateEnd}`:item.dateStart):'';
  return `<article class="card-item" data-id="${item.id}">
    <figure class="card-photo ${noImg?'noimg':''}">
      ${item.img?`<img src="${item.img}" alt="">`:''}
      <figcaption class="overlay">
        <div style="font-weight:800;margin:0 0 4px">${item.title}</div>
        <div class="meta"><span class="badge">${item.company}</span><span class="badge">${item.year}卒</span><span class="badge">${item.jobType||'-'}</span><span class="badge">${item.mode||'-'}</span><span class="badge">${item.place||'-'}</span><span class="badge">${dateLabel}</span></div>
        <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn pill ${favOn}" data-fav="${item.id}">★ お気に入り</button>
          <a class="btn pill fill" data-join="${item.id}" href="${item.applyUrl||'#'}" target="_blank" rel="noopener">参加</a>
        </div>
      </figcaption>
    </figure>
  </article>`;
}
function render(list){
  cards.innerHTML=list.length?list.map(cardHTML).join(''):`<div class="card"><strong>投稿・承認された求人が表示されます。</strong></div>`;
  cards.querySelectorAll('[data-fav]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();const id=+b.dataset.fav;if(favSet.has(id))favSet.delete(id);else favSet.add(id);save(FAV_KEY,[...favSet]);applyFilters(page);});
  cards.querySelectorAll('.card-item').forEach(card=>card.onclick=()=>{const id=+card.dataset.id;const job=allJobs().find(j=>j.id===id);if(job)openJobModal(job);});
}
function renderPager(pages){ if(pages<=1){pager.innerHTML='';return;} let html='';for(let i=1;i<=pages;i++) html+=`<button class="${i===page?'is-active':''}" data-page="${i}">${i}</button>`; pager.innerHTML=html; pager.querySelectorAll('button').forEach(b=>b.onclick=()=>applyFilters(+b.dataset.page)); }
function applyFilters(goPage=page){
  page=goPage;
  let list=allJobs().filter(j=>{
    const text=`${j.title} ${j.company} ${j.tags}`.toLowerCase();
    const kw=!state.q||text.includes(state.q.toLowerCase());
    const yr=(activeYear==='all')?true:j.year===activeYear;
    const jt=!state.jobType||j.jobType===state.jobType;
    const modeOK=(!state.modeOnline&&!state.modeOffline) || (state.modeOnline&&/オンライン|ﾊｲﾌﾞﾘｯﾄﾞ|ハイブリッド/.test(j.mode)) || (state.modeOffline&&/対面|オフライン|ﾊｲﾌﾞﾘｯﾄﾞ|ハイブリッド/.test(j.mode));
    const openOK=!state.onlyOpen||j.open; const favOK=!state.favOnly||favSet.has(j.id); const rangeOK=overlaps(j.dateStart,j.dateEnd);
    return kw&&yr&&jt&&modeOK&&openOK&&favOK&&rangeOK;
  });
  list.sort((a,b)=>({new:(b.dateStart||'').localeCompare(a.dateStart||''),old:(a.dateStart||'').localeCompare(b.dateStart||''),wageDesc:(b.wage||0)-(a.wage||0),wageAsc:(a.wage||0)-(b.wage||0)})[state.sort]||0);
  count.textContent=String(list.length); chipRender();
  const size=+(state.size||6); const pages=Math.max(1,Math.ceil(list.length/size)); if(page>pages) page=pages;
  render(list.slice((page-1)*size, page*size)); renderPager(pages);
}

/* ========= 求人詳細 ========= */
const jobModal={ wrap:g('jobModal'), close:g('jobModalClose'), img:g('jobModalImg'), title:g('jobModalTitle'), meta:g('jobModalMeta'), desc:g('jobModalDesc'), fav:g('jobModalFav'), join:g('jobModalJoin') };
function openJobModal(job){ jobModal.img.src=job.img||''; jobModal.img.style.display=job.img?'':'none'; const dateLabel=job.dateStart?(job.dateEnd&&job.dateEnd!==job.dateStart?`${job.dateStart}〜${job.dateEnd}`:job.dateStart):''; jobModal.title.textContent=`${job.title} / ${job.company}`; jobModal.meta.innerHTML=`<span class="badge">${job.year}卒</span><span class="badge">${job.jobType||'-'}</span><span class="badge">${job.mode||'-'}</span><span class="badge">${job.place||'-'}</span><span class="badge">${dateLabel}</span>`; jobModal.desc.textContent=(job.desc||job.tags||'').toString(); jobModal.join.href=job.applyUrl||'#'; jobModal.fav.onclick=()=>{const id=allJobs().find(j=>j.title===job.title&&j.company===job.company).id; if(favSet.has(id))favSet.delete(id);else favSet.add(id); save(FAV_KEY,[...favSet]); applyFilters(page);}; jobModal.wrap.classList.add('show'); jobModal.wrap.setAttribute('aria-hidden','false'); }
jobModal.close.onclick=()=>{ jobModal.wrap.classList.remove('show'); jobModal.wrap.setAttribute('aria-hidden','true'); };
jobModal.wrap.addEventListener('click',e=>{ if(e.target===jobModal.wrap) jobModal.close.click(); });

/* ========= 認証 / ユーザー ========= */
function users(){ return load(USERS_KEY,[]); }
function saveUsers(U){ save(USERS_KEY,U); refreshCSVs(); }
function sessionEmail(){ return (load(SESSION_KEY,null)||{}).email||""; }
function setSession(email){ if(email){save(SESSION_KEY,{email});} else {localStorage.removeItem(SESSION_KEY);} syncAuthUI(); }
function syncAuthUI(){ const email=sessionEmail(), logged=!!email; g('btnLogin').hidden=g('btnSignup').hidden=logged; g('btnLogout').hidden=!logged; const who=g('who'); if(who){who.hidden=!logged; who.textContent=logged?email:"";} }

g('btnSignup').onclick=()=>openFull('authModal');
g('btnLogin').onclick =()=>openFull('authModal');
g('btnLogout').onclick=()=>{ setSession(""); alert('ログアウトしました'); };

g('doSignup').onclick =()=>{ const name=g('sgName').value.trim(), univ=g('sgUniv').value.trim(), email=g('sgEmail').value.trim(), pass=g('sgPass').value.trim(); if(!name||!univ||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||pass.length<8){g('authHint').textContent='入力を確認してください';return;} const U=users(); if(U.find(u=>u.email===email)){g('authHint').textContent='このメールは登録済みです';return;} const u={email,pass,profile:{name,univ,grade:"2026",role:"",links:"",pr:""},joined:[]}; U.push(u); saveUsers(U); setSession(email); fillProfile(); alert('登録しました。プロフィールも保存しました'); closeFull('authModal'); };

g('doLogin').onclick  =()=>{ const email=g('authEmail').value.trim(), pass=g('authPass').value.trim(); const u=users().find(x=>x.email===email&&x.pass===pass); g('authHint').textContent=u?'':'メール/パスワードが違います'; if(u){ setSession(email); closeFull('authModal'); alert('ログインしました'); } };
g('authClose').onclick=()=>closeFull('authModal');
g('openForgot').onclick=()=>{ closeFull('authModal'); openFull('forgotModal'); };

/* パスワード再設定 */
let fgTargetEmail="";
g('doVerify').onclick=()=>{ const name=g('fgName').value.trim(), univ=g('fgUniv').value.trim(), email=g('fgEmail').value.trim(); const u=users().find(x=>x.email===email && (x.profile?.name||"")===name && (x.profile?.univ||"")===univ); if(!u){ g('fgHint').textContent="一致するユーザーが見つかりません"; return; } fgTargetEmail=email; g('verifyBox').style.display='none'; g('resetBox').style.display='grid'; g('fgHint').textContent='本人確認OK。新しいパスワードを設定してください。'; };
g('doReset').onclick=()=>{ const pw=g('fgNewPass').value.trim(); if(pw.length<8){ g('fgHint').textContent='8文字以上で入力してください'; return; } const U=users(); const u=U.find(x=>x.email===fgTargetEmail); if(!u){ g('fgHint').textContent='エラーが発生しました'; return; } u.pass=pw; saveUsers(U); alert('再設定しました。ログインしてください。'); closeFull('forgotModal'); openFull('authModal'); };

/* 参加実績 */
function addParticipation(email,company){ if(!email)return; const U=users(); const u=U.find(x=>x.email===email); if(!u)return; u.joined.push(company); saveUsers(U); }

/* プロフィール */
function fillProfile(){ const email=sessionEmail(); if(!email) return; const u=users().find(x=>x.email===email); if(!u) return; g('pfName').value=u.profile?.name||''; g('pfUniv').value=u.profile?.univ||''; g('pfGrade').value=u.profile?.grade||'2026'; g('pfRole').value=u.profile?.role||''; g('pfLinks').value=u.profile?.links||''; g('pfPR').value=u.profile?.pr||''; }
g('pfSave').onclick=()=>{ const email=sessionEmail(); if(!email){alert('先にログインしてください');return;} const U=users(); const u=U.find(x=>x.email===email); if(!u)return; u.profile={ name:g('pfName').value.trim(), univ:g('pfUniv').value.trim(), grade:g('pfGrade').value, role:g('pfRole').value.trim(), links:g('pfLinks').value.trim(), pr:g('pfPR').value.trim() }; saveUsers(U); alert('保存しました'); closeFull('profileModal'); };

/* ========= お問い合わせ ========= */
function contacts(){ return load(CONTACT_KEY,[]); }
function addContact(rec){ const arr=contacts(); arr.push({...rec, id:arr.length?Math.max(...arr.map(x=>x.id))+1:1, created:new Date().toISOString()}); save(CONTACT_KEY,arr); refreshCSVs(); }
g('mtSend').onclick=()=>{ if(!g('mtAgree').checked){alert('プライバシーポリシーに同意が必要です');return;} const rec={ company:g('mtCompany').value.trim(), person:g('mtPerson').value.trim(), phone:g('mtPhone').value.trim(), email:g('mtEmail').value.trim(), body:g('mtBody').value.trim() }; if(!rec.email||!rec.person){alert('担当者名/メールは必須です');return;} addContact(rec); alert('送信しました（CSVに追記）'); closeFull('materialsModal'); };

/* ========= 管理（投稿/承認/CSV） ========= */
g('enterAdmin').onclick=()=>{ if(g('adminPass').value===ADMIN_PASS){ g('adminGate').style.display='none'; g('adminBody').style.display='block'; renderAdmin(); } else alert('パスワードが違います'); };
g('submitJob').onclick=()=>{ 
  const item={ 
    id:Date.now(),
    company:g('sCompany').value.trim(),
    title:g('sTitle').value.trim(),
    jobType:g('sJobType').value,
    mode:g('sMode').value,
    place:g('sPlace').value.trim(),
    dateStart: g('sDateStart').value,
    dateEnd:   g('sDateEnd').value || g('sDateStart').value,
    wage:g('sWage').value,
    week:g('sWeek').value,
    tags:g('sTags').value.trim(),
    desc:g('sDesc').value.trim(),
    applyUrl:g('sApply').value.trim(),
    image:g('sImage').value.trim(),
    year:'2026',
    approved:false
  };
  const arr=loadSubmits(); arr.push(item); saveSubmits(arr);
  renderAdmin(); alert('投稿しました。承認で公開されます。');
};
function renderAdmin(){ const arr=loadSubmits(); const w=g('adminList'); w.innerHTML = arr.length? arr.map(x=>`<label class="admin-item"><input type="checkbox" data-id="${x.id}" ${x.approved?'checked':''}/> <span><strong>${x.title}</strong> / ${x.company} <span class="small" style="color:#6b7280">(${x.dateStart}〜${x.dateEnd} / ${x.mode} / ${x.jobType})</span></span></label>`).join('') : '<div class="small" style="color:#6b7280">投稿はまだありません</div>'; w.querySelectorAll('input[type="checkbox"]').forEach(ch=>ch.onchange=()=>{ const id=+ch.dataset.id; const list=loadSubmits(); const row=list.find(r=>r.id===id); if(row){row.approved=ch.checked; saveSubmits(list); applyFilters();} }); refreshCSVs(); }
/* CSVリンク */
function refreshCSVs(){ const u=users(); const uCsv=[["email","name","univ","grade","role","links","pr","joined_count","joined_list"], ...u.map(x=>[x.email,x.profile?.name||"",x.profile?.univ||"",x.profile?.grade||"",x.profile?.role||"",x.profile?.links||"", (x.profile?.pr||"").replace(/\n/g," "), x.joined.length, x.joined.join("|") ])].map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n"); g('csvUsers').href=URL.createObjectURL(new Blob([uCsv],{type:"text/csv"}));
  const c=contacts(); const cCsv=[["id","company","person","phone","email","body","created"], ...c.map(x=>[x.id,x.company,x.person,x.phone,x.email,(x.body||"").replace(/\n/g," "),x.created])].map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n"); g('csvContacts').href=URL.createObjectURL(new Blob([cCsv],{type:"text/csv"})); }

/* ========= メニュー（全画面） ========= */
const menu=g('menu'), menuBtn=g('menuBtn');
menuBtn.onclick=()=>menu.classList.toggle('show');
document.addEventListener('click',(e)=>{ if(!menu.contains(e.target) && e.target!==menuBtn) menu.classList.remove('show'); });

menu.onclick=(e)=>{
  const v=e.target.getAttribute('data-open'); if(!v) return;
  menu.classList.remove('show');
  if(v==='home'){ homeReset(); return; }
  if(v==='profile'){ fillProfile(); openFull('profileModal'); return; }
  if(v==='materials'){ openFull('materialsModal'); return; }
  if(v==='admin'){ openFull('adminModal'); return; }
  if(v==='terms'){ openFull('termsModal'); return; }
  if(v==='privacy'){ openFull('privacyModal'); return; }
  if(v==='about'){ openFull('aboutModal'); return; }
};

/* 全画面の開閉 */
function openFull(id){ document.body.classList.add('full-open'); const m=g(id); m.classList.add('show'); m.setAttribute('aria-hidden','false'); }
function closeFull(id){ const m=g(id); m.classList.remove('show'); m.setAttribute('aria-hidden','true'); if(document.querySelectorAll('.modal.modal--full.show').length===0){ document.body.classList.remove('full-open'); } }
document.querySelectorAll('[data-fullhome]').forEach(b=>b.onclick=()=>homeReset());
document.querySelectorAll('.modal__close,[data-close]').forEach(b=>b.addEventListener('click',()=>{ const m=b.closest('.modal'); if(m.classList.contains('modal--full')) closeFull(m.id); else { m.classList.remove('show'); m.setAttribute('aria-hidden','true'); } }));
document.querySelectorAll('.modal.modal--full').forEach(m=>m.addEventListener('click',e=>{ if(e.target.classList.contains('modal')) closeFull(m.id); }));

function homeReset(){ activeYear='all'; renderYearChips(); Object.assign(state,{ q:'', jobType:'', modeOnline:false, modeOffline:false, onlyOpen:true, favOnly:false, start:'', end:'', sort:'new', size:6 }); document.body.classList.remove('full-open'); document.querySelectorAll('.modal.modal--full').forEach(x=>{x.classList.remove('show'); x.setAttribute('aria-hidden','true');}); applyFilters(1); window.scrollTo({top:0,behavior:'smooth'}); }

/* ========= LINE 友だち追加（ボタン＋ポップ） ========= */
function openLine(){ 
  const m=g('lineModal');
  m.classList.add('show'); m.setAttribute('aria-hidden','false');
  g('lineFrame').src = LINE_PROFILE_URL || "about:blank";
  g('lineLink').href = LINE_ADD_URL || LINE_PROFILE_URL || "#";
  if(LINE_QR_IMAGE){ g('lineQR').src = LINE_QR_IMAGE; g('lineQR').style.display='block'; } else { g('lineQR').style.display='none'; }
}
function closeLine(){ const m=g('lineModal'); m.classList.remove('show'); m.setAttribute('aria-hidden','true'); }
g('openLine').onclick=openLine;
g('lineModal').addEventListener('click',e=>{ if(e.target.id==='lineModal') closeLine(); });
document.querySelectorAll('[data-close="lineModal"]').forEach(b=>b.onclick=closeLine);

/* ========= ヒーロー/広告の適用 ========= */
(function(){
  const hero=g('heroLink'); if(HERO_IMG_URL){ hero.style.backgroundImage=`url('${HERO_IMG_URL}')`; } hero.href=HERO_LINK||'#';
  const ad=g('adImg'); if(AD_IMG_URL){ ad.style.backgroundImage=`url('${AD_IMG_URL}')`; ad.style.backgroundSize='cover'; ad.style.backgroundPosition='center'; }
  const adL=g('adLink'); adL.href=AD_LINK||'#';
})();

/* ========= ロゴ → ホーム ========= */
g('brand').onclick=homeReset;

/* ========= 初期化 ========= */
function init(){ renderYearChips(); bindYearChips(); setupSearchPop(); syncAuthUI(); applyFilters(1); refreshCSVs(); }
document.addEventListener('DOMContentLoaded', init);
