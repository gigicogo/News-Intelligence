'use strict';

/*
 * FASE 1: applicazione statica, senza chiamate API e senza raccolta RSS.
 * La sola notizia di esempio deriva dal materiale fornito dal committente.
 * NON usare i risultati demo come se fossero ricerca reale.
 */
const FEED_KEY = 'news-intelligence-v2-feeds';
const ARTICLES = [
  {
    id: 'dday-59344',
    title: 'Il prossimo operatore di telemarketing potrebbe non essere umano. OpenAI apre le telefonate agli agenti IA',
    url: 'https://www.dday.it/redazione/59344/il-prossimo-operatore-di-telemarketing-potrebbe-non-essere-umano-openai-apre-le-telefonate-agli-agenti-ia',
    source: 'DDay.it',
    date: '2026-11-05',
    area: 'mondo',
    type: 'novita',
    tags: 'openai novità agenti ia agenti vocali telefonate call center telemarketing',
    abstract: 'OpenAI permette agli agenti vocali di chiamare numeri fissi e cellulari e rispondere alle telefonate. Per i call center si apre la possibilità di automatizzare le conversazioni a pochi centesimi al minuto.',
    demo: true
  }
];

const filters = { periodo: '7', area: 'tutte', tipo: 'tutti' };
let feeds = readFeeds();
let selectedIds = new Set();
let visibleResults = [];
let generatedArticles = [];
let generatedTitle = '';

function get(id) { return document.getElementById(id); }
function safeText(value) { return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); }
function normalize(value) { return String(value ?? '').toLocaleLowerCase('it').normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function formatDate(value) { return new Date(value + 'T12:00:00').toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'}); }
function readFeeds() {
  try {const data = JSON.parse(localStorage.getItem(FEED_KEY) || '[]'); return Array.isArray(data) ? data.filter(x => x && typeof x.url === 'string' && typeof x.name === 'string') : [];}
  catch {return [];}
}
function saveFeeds() {
  try {localStorage.setItem(FEED_KEY, JSON.stringify(feeds)); return true;} catch {return false;}
}
function showView(name) {
  for (const section of ['ricerca','feed','rassegna']) get('view-'+section).hidden = name !== section;
  document.querySelectorAll('.nav-button').forEach(button => {
    const active = button.dataset.view === name;
    button.classList.toggle('active', active);
    if(active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
  });
  history.replaceState(null,'','#'+name);
  if(name === 'rassegna') updateRassegnaCount();
}
function changeFilter(button) {
  const group = button.parentElement.dataset.group;
  filters[group] = button.dataset.value;
  button.parentElement.querySelectorAll('.filter-pill').forEach(item => {
    const active = item === button;
    item.classList.toggle('selected',active); item.setAttribute('aria-pressed',String(active));
  });
  runSearch();
}
function matchesDate(article, days) {
  // Calendar days, not milliseconds: 5 Nov is included on 8 Nov for "3 giorni".
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() - Number(days));
  const published = new Date(article.date + 'T12:00:00');
  return published >= cutoff && published <= new Date(today.getTime() + 86400000);
}
function runSearch() {
  const query = normalize(get('searchQuery').value.trim());
  // Commas separate individual desired concepts; all phrases must be present.
  const keywords = query.split(',').map(x => x.trim()).filter(Boolean);
  visibleResults = ARTICLES.filter(article => {
    const haystack = normalize([article.title,article.abstract,article.tags].join(' '));
    return keywords.every(word => haystack.includes(word)) && matchesDate(article,filters.periodo)
      && (filters.area === 'tutte' || article.area === filters.area)
      && (filters.tipo === 'tutti' || article.type === filters.tipo);
  });
  get('resultsCount').textContent = visibleResults.length + (visibleResults.length === 1 ? ' risultato' : ' risultati');
  const container = get('results');
  if (!visibleResults.length) {
    container.innerHTML = '<div class="empty-state"><span class="empty-icon">⌕</span><h3>Nessun risultato nella dimostrazione</h3><p>Questa fase contiene soltanto l’articolo di esempio del 5 novembre 2026. Con il motore RSS, nella fase 2, arriveranno i risultati reali dai feed che avrai configurato.</p></div>';
  } else {
    container.innerHTML = visibleResults.map(article => `
      <article class="article-card">
        <input type="checkbox" aria-label="Seleziona per la rassegna: ${safeText(article.title)}" data-article-id="${safeText(article.id)}" ${selectedIds.has(article.id)?'checked':''}>
        <div><div class="article-meta"><span>${safeText(article.source)}</span><span aria-hidden="true">·</span><time datetime="${article.date}">${formatDate(article.date)}</time><span class="demo-tag">ESEMPIO, NON FEED LIVE</span></div>
          <a class="article-title" href="${safeText(article.url)}" target="_blank" rel="noopener noreferrer">${safeText(article.title)} ↗</a>
          <p class="article-summary">${safeText(article.abstract)}</p><span class="article-bottom">Abstract dimostrativo fornito dall'utente</span></div>
      </article>`).join('');
    container.querySelectorAll('[data-article-id]').forEach(checkbox => checkbox.addEventListener('change',e => {
      const id = e.target.dataset.articleId;
      if(e.target.checked) selectedIds.add(id); else selectedIds.delete(id);
      updateSelection();
    }));
  }
  updateSelection();
}
function updateSelection() {
  get('selectionCountBadge').textContent = selectedIds.size;
  get('selectedSummary').textContent = selectedIds.size ? `${selectedIds.size} articolo${selectedIds.size===1?'':'i'} selezionato${selectedIds.size===1?'':'i'}` : 'Nessun articolo selezionato';
  get('goToRassegna').disabled = selectedIds.size === 0;
  updateRassegnaCount();
}
function updateRassegnaCount() {
  get('rassegnaSelection').textContent = selectedIds.size + (selectedIds.size===1?' articolo selezionato':' articoli selezionati');
  get('generateRassegna').disabled = selectedIds.size === 0;
}
function validateFeedUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { return null; }
  if(url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null;
  url.hash = '';
  return url.toString();
}
function displayFeedMessage(message, kind = '') {
  get('feedMessage').textContent = message;
  get('feedMessage').className = 'form-message' + (kind ? ' '+kind : '');
}
function renderFeeds() {
  get('feedCount').textContent = feeds.length + (feeds.length===1?' feed':' feed');
  get('feedCountBadge').textContent = feeds.length;
  if(!feeds.length) {
    get('feedList').innerHTML = '<div class="empty-state"><span class="empty-icon">≋</span><h3>Nessun feed inserito</h3><p>Per iniziare, aggiungi qui sopra l’indirizzo HTTPS di un feed RSS.</p></div>';
    return;
  }
  get('feedList').innerHTML = feeds.map((feed,i) => `
    <div class="feed-card"><span class="rss-avatar" aria-hidden="true">≋</span><div class="feed-details"><strong>${safeText(feed.name)}</strong><a href="${safeText(feed.url)}" target="_blank" rel="noopener noreferrer">${safeText(feed.url)}</a></div>
    <button class="remove-button" data-remove-feed="${i}" type="button" aria-label="Rimuovi ${safeText(feed.name)}">Rimuovi</button></div>`).join('');
  get('feedList').querySelectorAll('[data-remove-feed]').forEach(button => button.addEventListener('click',()=>{
    feeds.splice(Number(button.dataset.removeFeed),1);
    if (!saveFeeds()) displayFeedMessage('Impossibile salvare le modifiche: memoria locale non disponibile.','error');
    renderFeeds();
  }));
}
function addFeed(event) {
  event.preventDefault();
  const name = get('feedName').value.trim();
  const url = validateFeedUrl(get('feedUrl').value.trim());
  if(!name || !url) return displayFeedMessage('Inserisci un nome e un indirizzo RSS HTTPS valido.','error');
  if(feeds.some(feed => feed.url.toLowerCase() === url.toLowerCase())) return displayFeedMessage('Questo feed è già nell’elenco.','error');
  if(feeds.length >= 100) return displayFeedMessage('Limite dimostrativo di 100 feed raggiunto.','error');
  feeds.push({name,url});
  if(!saveFeeds()) {
    feeds.pop();
    return displayFeedMessage('Memoria locale non disponibile. Non è stato possibile salvare il feed.','error');
  }
  event.target.reset();
  displayFeedMessage('Feed salvato nel browser. Sarà attivato quando collegheremo il motore RSS.','success');
  renderFeeds();
}
function markdownRassegna() {
  const today = new Date().toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'});
  return `# ${generatedTitle}\n\nData di creazione: ${today}\n\n` + generatedArticles.map(a => `### [${a.title}](${a.url})\n\nFonte: ${a.source} · ${formatDate(a.date)}\n\n> ${a.abstract}\n`).join('\n') + '\n_Anteprima dimostrativa: l’articolo è stato fornito dall’utente, non recuperato automaticamente dai feed._\n';
}
function generateRassegna() {
  generatedArticles = ARTICLES.filter(article => selectedIds.has(article.id));
  if(!generatedArticles.length) return;
  generatedTitle = get('rassegnaTitle').value.trim() || 'Rassegna informativa';
  get('rassegnaEmpty').hidden = true;
  get('rassegnaOutput').hidden = false;
  get('rassegnaMessage').textContent = 'Rassegna pronta. Puoi copiarla, scaricarla in Markdown oppure stamparla in PDF dal browser.';
  get('rassegnaPreview').innerHTML = `<h2>${safeText(generatedTitle)}</h2><p class="document-date">Creata il ${safeText(new Date().toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'}))} · Anteprima dimostrativa</p>` + generatedArticles.map(a => `<section class="document-article"><h3><a href="${safeText(a.url)}" target="_blank" rel="noopener noreferrer">${safeText(a.title)} ↗</a></h3><small>${safeText(a.source)} · ${formatDate(a.date)}</small><blockquote>${safeText(a.abstract)}</blockquote></section>`).join('');
}
async function copyRassegna() {
  try { await navigator.clipboard.writeText(markdownRassegna()); get('rassegnaMessage').textContent = 'Rassegna copiata negli appunti.'; }
  catch { get('rassegnaMessage').textContent = 'Copia non riuscita. Prova da un browser HTTPS oppure usa “Scarica .md”.'; }
}
function downloadRassegna() {
  const blob = new Blob([markdownRassegna()],{type:'text/markdown;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');link.href=url;link.download='rassegna-news-intelligence.md';
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}

document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click',()=>showView(button.dataset.view)));
document.querySelectorAll('[data-goto]').forEach(button => button.addEventListener('click',()=>showView(button.dataset.goto)));
document.querySelectorAll('.filter-pill').forEach(button => button.addEventListener('click',()=>changeFilter(button)));
get('searchForm').addEventListener('submit', event => {event.preventDefault();runSearch();});
get('feedForm').addEventListener('submit',addFeed);
get('goToRassegna').addEventListener('click',()=>showView('rassegna'));
get('generateRassegna').addEventListener('click',generateRassegna);
get('copyRassegna').addEventListener('click',copyRassegna);
get('downloadRassegna').addEventListener('click',downloadRassegna);
get('printRassegna').addEventListener('click',()=>window.print());
renderFeeds();runSearch();
const initialView = window.location.hash.slice(1);
showView(['ricerca','feed','rassegna'].includes(initialView)?initialView:'ricerca');
