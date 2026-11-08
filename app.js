'use strict';

// Fase 2F: tutte le ricerche usano soltanto notizie reali lette da Cloudflare D1.
// L'URL del Worker è pubblico; ADMIN_TOKEN non deve mai essere scritto in questi file.
const API_KEY = 'news-intelligence-worker-url';
const filters = { periodo: '7' };
let apiBase = readApiBase();
let visibleResults = [];
const selectedArticles = new Map();
let generatedArticles = [];
let generatedTitle = '';
let queryNumber = 0;

function get(id) { return document.getElementById(id); }
function safeText(value) { return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); }
function safeUrl(input) { try { const u = new URL(String(input)); return ['https:', 'http:'].includes(u.protocol) ? u.href : '#'; } catch { return '#'; } }
function formatDate(value) {
  const date = new Date(value || '');
  return Number.isNaN(date.getTime()) ? 'Data non disponibile' : date.toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'});
}
function readApiBase() { try { return localStorage.getItem(API_KEY) || ''; } catch { return ''; } }
function normalizeBase(raw) {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash) return '';
    return u.origin + u.pathname.replace(/\/(?:health|search|articles|feeds)\/?$/, '').replace(/\/+$/, '');
  } catch { return ''; }
}
function setStatus(message, kind='') {
  get('apiStatus').textContent = message;
  get('apiStatus').className = 'form-message' + (kind ? ` ${kind}` : '');
}
function showView(name) {
  for (const section of ['ricerca','feed','rassegna']) get('view-'+section).hidden = name !== section;
  document.querySelectorAll('.nav-button').forEach(b => {
    const active = b.dataset.view === name;
    b.classList.toggle('active',active);
    if (active) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
  });
  history.replaceState(null,'','#'+name);
  if(name==='feed') loadFeeds();
  if(name==='rassegna') updateSelection();
}
function updateSelection() {
  const n = selectedArticles.size;
  get('selectionCountBadge').textContent = n;
  get('selectedSummary').textContent = n ? `${n} articol${n===1?'o selezionato':'i selezionati'}` : 'Nessun articolo selezionato';
  get('goToRassegna').disabled = n === 0;
  get('rassegnaSelection').textContent = `${n} articol${n===1?'o selezionato':'i selezionati'}`;
  get('generateRassegna').disabled = n === 0;
}
function renderResults() {
  get('resultsCount').textContent = visibleResults.length + (visibleResults.length===1?' risultato':' risultati') + (visibleResults.length===100?' (limite 100)':'');
  const container = get('results');
  if (!visibleResults.length) {
    container.innerHTML = '<div class="empty-state"><span class="empty-icon">⌕</span><h3>Nessuna notizia per questa ricerca</h3><p>Prova a cercare senza parole chiave oppure amplia il periodo. L’archivio contiene soltanto gli articoli già raccolti dai feed.</p></div>';
    updateSelection(); return;
  }
  container.innerHTML = visibleResults.map(a => `
    <article class="article-card">
      <input type="checkbox" data-article-id="${safeText(a.id)}" aria-label="Seleziona: ${safeText(a.title)}" ${selectedArticles.has(String(a.id))?'checked':''}>
      <div><div class="article-meta"><span>${safeText(a.source)}</span><span aria-hidden="true">·</span><time>${safeText(formatDate(a.published_at || a.first_seen_at))}</time></div>
        <a class="article-title" href="${safeText(safeUrl(a.url))}" target="_blank" rel="noopener noreferrer">${safeText(a.title)} ↗</a>
        <p class="article-summary">${safeText(a.abstract || 'Il feed non fornisce una descrizione.')}</p>
        <span class="article-bottom">${a.description ? 'Estratto dal feed RSS · non è un abstract IA' : 'Nessun estratto nel feed'}</span>
      </div>
    </article>`).join('');
  container.querySelectorAll('[data-article-id]').forEach(c => c.addEventListener('change',e => {
    const id = String(e.target.dataset.articleId);
    if (e.target.checked) {
      const article = visibleResults.find(a => a.id === id);
      if (article) selectedArticles.set(id,article);
    } else selectedArticles.delete(id);
    updateSelection();
  }));
  updateSelection();
}
async function fetchJson(path) {
  const response = await fetch(apiBase + path, { headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`Il Worker ha risposto HTTP ${response.status}`);
  const data = await response.json();
  if (data.ok === false) throw new Error(data.error || 'Il Worker non ha completato la richiesta');
  return data;
}
async function runSearch() {
  const myRun = ++queryNumber;
  if (!apiBase) {
    get('resultsCount').textContent = '0 risultati';
    get('results').innerHTML = '<div class="empty-state"><span class="empty-icon">≋</span><h3>Collega il Worker</h3><p>Incolla sopra il suo indirizzo HTTPS e premi Collega: compariranno le notizie realmente acquisite.</p></div>';
    return;
  }
  get('resultsCount').textContent = 'Ricerca in corso…';
  get('results').innerHTML = '<div class="empty-state"><h3>Sto consultando l’archivio RSS…</h3></div>';
  try {
    const params = new URLSearchParams({ q: get('searchQuery').value.trim(), days: filters.periodo });
    const data = await fetchJson('/search?' + params.toString());
    if (myRun !== queryNumber) return;
    visibleResults = (data.articles || []).map(a => ({
      ...a, id: String(a.id), abstract: String(a.description || '').trim().slice(0, 420)
    }));
    renderResults();
    setStatus('Collegamento riuscito. Stai cercando negli articoli veri del database.', 'success');
  } catch (error) {
    if (myRun !== queryNumber) return;
    visibleResults = [];
    get('resultsCount').textContent = 'Connessione non riuscita';
    get('results').innerHTML = '<div class="empty-state"><h3>Non riesco a leggere gli articoli</h3><p>Verifica l’indirizzo del Worker e che sia installata la versione 2F. Se hai appena pubblicato il codice, riprova a ricaricare la pagina.</p></div>';
    setStatus(`Connessione non riuscita: ${error.message}.`, 'error');
  }
}
async function connectApi(event) {
  event.preventDefault();
  const url = normalizeBase(get('workerUrl').value);
  if (!url) return setStatus('Inserisci un indirizzo HTTPS valido del Worker, senza password.', 'error');
  apiBase = url;
  try { localStorage.setItem(API_KEY,url); } catch {}
  get('workerUrl').value = url;
  await runSearch();
}
function changeFilter(button) {
  const fieldset = button.closest('fieldset');
  if (fieldset && fieldset.disabled) return;
  if (button.parentElement.dataset.group !== 'periodo') return;
  filters.periodo = button.dataset.value;
  button.parentElement.querySelectorAll('.filter-pill').forEach(b => {
    b.classList.toggle('selected',b===button);
    b.setAttribute('aria-pressed',String(b===button));
  });
  runSearch();
}
async function loadFeeds() {
  const container = get('feedList');
  if (!apiBase) {
    container.innerHTML = '<div class="empty-state"><h3>Collega il Worker</h3><p>Torna alla Ricerca e inserisci il suo indirizzo.</p></div>';
    return;
  }
  try {
    const data = await fetchJson('/feeds');
    const feeds = Array.isArray(data.feeds) ? data.feeds : [];
    get('feedCount').textContent = `${feeds.length} feed`;
    get('feedCountBadge').textContent = feeds.length;
    container.innerHTML = feeds.length ? feeds.map(f => `<div class="feed-card">
      <span class="rss-avatar" aria-hidden="true">≋</span>
      <div class="feed-details"><strong>${safeText(f.name)}${f.active===0?' (in pausa)':''}</strong>
        <a href="${safeText(safeUrl(f.url))}" target="_blank" rel="noopener noreferrer">${safeText(f.url)}</a>
        <span class="status-row">Ultimo aggiornamento riuscito: ${safeText(formatDate(f.last_success_at))}</span>
        ${f.last_error?`<div class="feed-error">Ultimo errore: ${safeText(f.last_error)}</div>`:''}
      </div></div>`).join('') : '<div class="empty-state"><h3>Nessuna fonte registrata</h3></div>';
  } catch(error) {
    container.innerHTML = '<div class="empty-state"><h3>Impossibile leggere le fonti</h3><p>Verifica che il Worker sia aggiornato alla versione 2F.</p></div>';
  }
}
function markdownRassegna() {
  const today = new Date().toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'});
  const lines = generatedArticles.map(a => `### [${a.title}](${a.url})\n\nFonte: ${a.source} · ${formatDate(a.published_at || a.first_seen_at)}\n\n> ${a.abstract || 'Descrizione non disponibile'}\n`);
  return `# ${generatedTitle}\n\nData di creazione: ${today}\n\n` + lines.join('\n') + '\n_Estratti originali dei feed RSS; non sono abstract generati da IA._\n';
}
function generateRassegna() {
  generatedArticles = [...selectedArticles.values()];
  if(!generatedArticles.length) return;
  generatedTitle = get('rassegnaTitle').value.trim() || 'Rassegna informativa';
  get('rassegnaEmpty').hidden = true;
  get('rassegnaOutput').hidden = false;
  get('rassegnaMessage').textContent = 'Rassegna pronta, con estratti RSS. Puoi copiarla, scaricarla in Markdown o stamparla in PDF.';
  get('rassegnaPreview').innerHTML = `<h2>${safeText(generatedTitle)}</h2><p class="document-date">Creata il ${safeText(new Date().toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'}))} · Estratti RSS</p>` + generatedArticles.map(a => `<section class="document-article"><h3><a href="${safeText(safeUrl(a.url))}" target="_blank" rel="noopener noreferrer">${safeText(a.title)} ↗</a></h3><small>${safeText(a.source)} · ${safeText(formatDate(a.published_at || a.first_seen_at))}</small><blockquote>${safeText(a.abstract || 'Descrizione non disponibile')}</blockquote></section>`).join('');
}
async function copyRassegna() {
  try { await navigator.clipboard.writeText(markdownRassegna()); get('rassegnaMessage').textContent='Testo copiato negli appunti.'; }
  catch { get('rassegnaMessage').textContent='Copia non riuscita. Usa Scarica .md.'; }
}
function downloadRassegna() {
  const blob = new Blob([markdownRassegna()],{type:'text/markdown;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url;a.download='rassegna-news-intelligence.md';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}

document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click',()=>showView(b.dataset.view)));
document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click',()=>showView(b.dataset.goto)));
document.querySelectorAll('.filter-pill').forEach(b => b.addEventListener('click',()=>changeFilter(b)));
get('apiForm').addEventListener('submit',connectApi);
get('searchForm').addEventListener('submit',e=>{e.preventDefault();runSearch();});
get('goToRassegna').addEventListener('click',()=>showView('rassegna'));
get('generateRassegna').addEventListener('click',generateRassegna);
get('copyRassegna').addEventListener('click',copyRassegna);
get('downloadRassegna').addEventListener('click',downloadRassegna);
get('printRassegna').addEventListener('click',()=>window.print());
get('workerUrl').value = apiBase;
updateSelection();
runSearch();
const initialView = window.location.hash.slice(1);
showView(['ricerca','feed','rassegna'].includes(initialView)?initialView:'ricerca');
