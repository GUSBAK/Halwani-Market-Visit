const checklistItems = [
  'Planogram implemented',
  'Full range available',
  'Promotion implemented',
  'Price tags correct',
  'POSM available',
  'Off-shelf display available',
  'Competitor activity checked',
  'Damaged products checked',
  'Expiry checked',
  'Stockroom checked'
];

const defaultSkus = [
  'MEZ Tahina 9kg',
  'Al Shola Tahina 9kg',
  'MEZ Fries 9x9',
  'MEZ Fries 6x6',
  'MEZ Ketchup',
  'MEZ Hot Sauce',
  'MEZ Salt 700g',
  'Halwani Maamoul'
];

const state = {
  visits: JSON.parse(localStorage.getItem('halwaniVisits') || '[]'),
  currentVisit: null,
  photos: [],
  gps: null
};

const $ = (id) => document.getElementById(id);

function saveState() {
  localStorage.setItem('halwaniVisits', JSON.stringify(state.visits));
  renderDashboard();
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderChecklist(data = {}) {
  const container = $('checklist');
  container.innerHTML = '';
  checklistItems.forEach((item, index) => {
    const value = data[item]?.status || 'Yes';
    const note = data[item]?.note || '';
    const row = document.createElement('div');
    row.className = 'check-row';
    row.innerHTML = `
      <div class="check-row-top"><strong>${item}</strong></div>
      <div class="check-status">
        ${['Yes', 'Partial', 'No'].map(option => `
          <label><input type="radio" name="check-${index}" value="${option}" ${value === option ? 'checked' : ''}> ${option}</label>
        `).join('')}
      </div>
      <input class="check-note" data-item="${item}" placeholder="Note" value="${escapeHtml(note)}">
    `;
    container.appendChild(row);
  });
}

function renderSkus(skus = defaultSkus.map(name => ({ name, available: true, note: '' }))) {
  const container = $('skuList');
  container.innerHTML = '';
  skus.forEach((sku, index) => {
    const row = document.createElement('div');
    row.className = 'sku-row';
    row.innerHTML = `
      <div class="sku-row-top">
        <input class="sku-name" value="${escapeHtml(sku.name)}" placeholder="SKU name">
        <label><input class="sku-available" type="checkbox" ${sku.available ? 'checked' : ''}> Available</label>
      </div>
      <input class="sku-note" placeholder="Note, facings, issue, or missing reason" value="${escapeHtml(sku.note || '')}">
    `;
    container.appendChild(row);
  });
}

function renderActions(actions = []) {
  const container = $('actionsList');
  container.innerHTML = '';
  actions.forEach(action => addActionRow(action));
}

function addActionRow(action = {}) {
  const row = document.createElement('div');
  row.className = 'action-row';
  row.innerHTML = `
    <div class="action-grid">
      <input class="action-title" placeholder="Action required" value="${escapeHtml(action.title || '')}">
      <input class="action-owner" placeholder="Owner" value="${escapeHtml(action.owner || '')}">
      <select class="action-priority">
        ${['High', 'Medium', 'Low'].map(p => `<option ${action.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
      </select>
      <input class="action-due" type="date" value="${escapeHtml(action.dueDate || '')}">
      <select class="action-status">
        ${['Open', 'In progress', 'Done', 'Cancelled'].map(s => `<option ${action.status === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
      <button type="button" class="ghost remove-action">Remove</button>
      <textarea class="action-description" rows="2" placeholder="Action details">${escapeHtml(action.description || '')}</textarea>
    </div>
  `;
  row.querySelector('.remove-action').addEventListener('click', () => row.remove());
  $('actionsList').appendChild(row);
}

function renderPhotos(photos = []) {
  state.photos = photos;
  const gallery = $('photoGallery');
  gallery.innerHTML = '';
  photos.forEach(photo => {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.innerHTML = `
      <img src="${photo.dataUrl}" alt="${escapeHtml(photo.category)}">
      <div class="photo-meta">
        <strong>${escapeHtml(photo.category)}</strong>
        <span>${escapeHtml(photo.note || '')}</span>
      </div>
    `;
    gallery.appendChild(card);
  });
}

function startNewVisit() {
  state.currentVisit = null;
  state.gps = null;
  state.photos = [];
  $('marketVisitForm').reset();
  $('visitId').value = uid();
  $('visitor').value = 'Ghassan Baker';
  $('city').value = 'Jeddah';
  $('gpsStatus').textContent = 'Not captured yet.';
  renderChecklist();
  renderSkus();
  renderPhotos([]);
  renderActions([]);
  showScreen('visitForm');
}

function openVisit(visit) {
  state.currentVisit = visit;
  state.gps = visit.gps || null;
  state.photos = visit.photos || [];
  $('visitId').value = visit.id;
  $('customer').value = visit.customer || '';
  $('branch').value = visit.branch || '';
  $('city').value = visit.city || '';
  $('channel').value = visit.channel || 'Modern Trade';
  $('visitor').value = visit.visitor || '';
  $('visitType').value = visit.visitType || 'Routine Visit';
  $('competitorNotes').value = visit.competitorNotes || '';
  $('visitNotes').value = visit.visitNotes || '';
  $('gpsStatus').textContent = visit.gps ? `${visit.gps.lat.toFixed(6)}, ${visit.gps.lng.toFixed(6)}` : 'Not captured yet.';
  renderChecklist(visit.checklist || {});
  renderSkus(visit.skus || undefined);
  renderPhotos(visit.photos || []);
  renderActions(visit.actions || []);
  showScreen('visitForm');
}

function collectVisit() {
  const checklist = {};
  checklistItems.forEach((item, index) => {
    const status = document.querySelector(`input[name="check-${index}"]:checked`)?.value || 'Yes';
    const note = document.querySelector(`.check-note[data-item="${CSS.escape(item)}"]`)?.value || '';
    checklist[item] = { status, note };
  });

  const skus = [...document.querySelectorAll('.sku-row')].map(row => ({
    name: row.querySelector('.sku-name').value,
    available: row.querySelector('.sku-available').checked,
    note: row.querySelector('.sku-note').value
  })).filter(sku => sku.name.trim());

  const actions = [...document.querySelectorAll('.action-row')].map(row => ({
    title: row.querySelector('.action-title').value,
    owner: row.querySelector('.action-owner').value,
    priority: row.querySelector('.action-priority').value,
    dueDate: row.querySelector('.action-due').value,
    status: row.querySelector('.action-status').value,
    description: row.querySelector('.action-description').value
  })).filter(action => action.title.trim());

  return {
    id: $('visitId').value || uid(),
    customer: $('customer').value,
    branch: $('branch').value,
    city: $('city').value,
    channel: $('channel').value,
    visitor: $('visitor').value,
    visitType: $('visitType').value,
    createdAt: state.currentVisit?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    gps: state.gps,
    checklist,
    skus,
    photos: state.photos,
    competitorNotes: $('competitorNotes').value,
    actions,
    visitNotes: $('visitNotes').value
  };
}

function saveVisit() {
  const visit = collectVisit();
  const existingIndex = state.visits.findIndex(v => v.id === visit.id);
  if (existingIndex >= 0) state.visits[existingIndex] = visit;
  else state.visits.unshift(visit);
  state.currentVisit = visit;
  saveState();
  alert('Visit saved.');
}

function renderDashboard() {
  $('totalVisits').textContent = state.visits.length;
  $('openActions').textContent = state.visits.flatMap(v => v.actions || []).filter(a => a.status !== 'Done' && a.status !== 'Cancelled').length;
  $('photoCount').textContent = state.visits.flatMap(v => v.photos || []).length;

  const list = $('visitList');
  if (!state.visits.length) {
    list.className = 'visit-list empty-state';
    list.textContent = 'No visits yet. Start your first visit.';
    return;
  }
  list.className = 'visit-list';
  list.innerHTML = '';
  state.visits.forEach(visit => {
    const tpl = $('visitCardTemplate').content.cloneNode(true);
    tpl.querySelector('h4').textContent = `${visit.customer || 'Unnamed'} - ${visit.branch || 'Branch'}`;
    tpl.querySelector('p').textContent = `${visit.city || ''} • ${formatDate(visit.createdAt)} • ${visit.actions?.length || 0} actions • ${visit.photos?.length || 0} photos`;
    tpl.querySelector('.open-visit').addEventListener('click', () => openVisit(visit));
    tpl.querySelector('.export-visit').addEventListener('click', () => exportReport(visit));
    list.appendChild(tpl);
  });
}

function captureGps() {
  if (!navigator.geolocation) {
    $('gpsStatus').textContent = 'GPS not supported by this device.';
    return;
  }
  $('gpsStatus').textContent = 'Capturing GPS...';
  navigator.geolocation.getCurrentPosition(position => {
    state.gps = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      capturedAt: new Date().toISOString()
    };
    $('gpsStatus').textContent = `${state.gps.lat.toFixed(6)}, ${state.gps.lng.toFixed(6)} • accuracy ${Math.round(state.gps.accuracy)}m`;
  }, error => {
    $('gpsStatus').textContent = `GPS failed: ${error.message}`;
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
}

function handlePhotos(event) {
  const files = [...event.target.files];
  const category = $('photoCategory').value;
  const note = $('photoNote').value;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      state.photos.push({
        id: uid(),
        category,
        note,
        fileName: file.name,
        dataUrl: reader.result,
        createdAt: new Date().toISOString()
      });
      renderPhotos(state.photos);
    };
    reader.readAsDataURL(file);
  });
  event.target.value = '';
  $('photoNote').value = '';
}

function exportCurrentVisit() {
  const visit = collectVisit();
  exportReport(visit);
}

function exportReport(visit) {
  const gpsLink = visit.gps ? `https://www.google.com/maps?q=${visit.gps.lat},${visit.gps.lng}` : '';
  const missingSkus = (visit.skus || []).filter(sku => !sku.available);
  const photos = visit.photos || [];
  const photoHtml = photos.length
    ? photos.reduce((html, photo, index) => {
        const openRow = index % 2 === 0 ? '<div class="photo-row">' : '';
        const closeRow = index % 2 === 1 || index === photos.length - 1 ? '</div>' : '';
        return html + `${openRow}<div class="photo"><img src="${photo.dataUrl}" alt="${escapeHtml(photo.category)}"><p><strong>${escapeHtml(photo.category)}</strong><br>${escapeHtml(photo.note || '')}</p></div>${closeRow}`;
      }, '')
    : '<p>No photos added.</p>';
  const reportHtml = `
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Visit Report - ${escapeHtml(visit.customer || 'Store')}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #18231f; margin: 28px; }
    h1 { color: #006b3f; margin-bottom: 4px; }
    h2 { color: #004d2f; border-bottom: 2px solid #e6f3ee; padding-bottom: 8px; margin-top: 28px; }
    .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 18px 0; }
    .box { border: 1px solid #dfe8e4; border-radius: 12px; padding: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #dfe8e4; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #e6f3ee; }
    .section { break-inside: avoid; page-break-inside: avoid; }
    .photo-section { break-before: page; page-break-before: always; }
    .photo-grid { display: block; }
    .photo-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 14px; break-inside: avoid; page-break-inside: avoid; }
    .photo { border: 1px solid #dfe8e4; border-radius: 12px; overflow: hidden; break-inside: avoid; page-break-inside: avoid; }
    .photo img { width: 100%; height: 245px; object-fit: cover; display: block; }
    .photo p { margin: 8px; min-height: 38px; }
    .pill { display: inline-block; padding: 4px 8px; border-radius: 99px; background: #e6f3ee; color: #004d2f; font-weight: bold; }
    @page { size: A4; margin: 12mm; }
    @media print {
      button { display: none; }
      body { margin: 0; }
      h1 { font-size: 28px; }
      h2 { font-size: 21px; margin-top: 18px; }
      th, td { padding: 6px; }
      .summary { gap: 8px; }
      .box { padding: 9px; }
      .photo-section { break-before: page; page-break-before: always; }
      .photo-row, .photo { break-inside: avoid; page-break-inside: avoid; }
      .photo img { height: 205px; }
    }
  </style>
</head>
<body>
  <button onclick="window.print()" style="padding:10px 14px;background:#006b3f;color:white;border:0;border-radius:10px;font-weight:bold;">Print / Save PDF</button>
  <h1>Halwani Market Visit Report</h1>
  <p>${escapeHtml(formatDate(visit.createdAt))}</p>

  <div class="summary">
    <div class="box"><strong>Customer</strong><br>${escapeHtml(visit.customer || '')}</div>
    <div class="box"><strong>Branch</strong><br>${escapeHtml(visit.branch || '')}</div>
    <div class="box"><strong>City</strong><br>${escapeHtml(visit.city || '')}</div>
    <div class="box"><strong>Channel</strong><br>${escapeHtml(visit.channel || '')}</div>
    <div class="box"><strong>Visitor</strong><br>${escapeHtml(visit.visitor || '')}</div>
    <div class="box"><strong>Visit Type</strong><br>${escapeHtml(visit.visitType || '')}</div>
    <div class="box"><strong>GPS</strong><br>${gpsLink ? `<a href="${gpsLink}">${visit.gps.lat.toFixed(6)}, ${visit.gps.lng.toFixed(6)}</a>` : 'Not captured'}</div>
    <div class="box"><strong>Open Actions</strong><br>${(visit.actions || []).filter(a => a.status !== 'Done' && a.status !== 'Cancelled').length}</div>
  </div>

  <h2>Checklist</h2>
  <table>
    <tr><th>Area</th><th>Status</th><th>Note</th></tr>
    ${Object.entries(visit.checklist || {}).map(([area, data]) => `<tr><td>${escapeHtml(area)}</td><td><span class="pill">${escapeHtml(data.status)}</span></td><td>${escapeHtml(data.note || '')}</td></tr>`).join('')}
  </table>

  <h2>Range Availability</h2>
  <table>
    <tr><th>SKU</th><th>Status</th><th>Note</th></tr>
    ${(visit.skus || []).map(sku => `<tr><td>${escapeHtml(sku.name)}</td><td>${sku.available ? 'Available' : 'Missing'}</td><td>${escapeHtml(sku.note || '')}</td></tr>`).join('')}
  </table>

  <h2>Missing SKUs</h2>
  ${missingSkus.length ? `<ul>${missingSkus.map(sku => `<li>${escapeHtml(sku.name)} ${sku.note ? `- ${escapeHtml(sku.note)}` : ''}</li>`).join('')}</ul>` : '<p>No missing SKUs recorded.</p>'}

  <h2>Competitor Activity</h2>
  <p>${escapeHtml(visit.competitorNotes || 'No competitor notes recorded.')}</p>

  <section class="photo-section">
    <h2>Photos</h2>
    <div class="photo-grid">${photoHtml}</div>
  </section>

  <section class="section">
  <h2>Actions Required</h2>
  <table>
    <tr><th>Action</th><th>Owner</th><th>Priority</th><th>Due Date</th><th>Status</th><th>Details</th></tr>
    ${(visit.actions || []).map(action => `<tr><td>${escapeHtml(action.title)}</td><td>${escapeHtml(action.owner || '')}</td><td>${escapeHtml(action.priority || '')}</td><td>${escapeHtml(action.dueDate || '')}</td><td>${escapeHtml(action.status || '')}</td><td>${escapeHtml(action.description || '')}</td></tr>`).join('') || '<tr><td colspan="6">No actions recorded.</td></tr>'}
  </table>
  </section>

  <section class="section">
  <h2>Visit Notes</h2>
  <p>${escapeHtml(visit.visitNotes || 'No visit notes recorded.')}</p>
  </section>
</body>
</html>`;

  const reportWindow = window.open('', '_blank');
  reportWindow.document.open();
  reportWindow.document.write(reportHtml);
  reportWindow.document.close();
}

function formatDate(dateString) {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-SA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(dateString));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

$('newVisitBtn').addEventListener('click', startNewVisit);
$('startVisitHero').addEventListener('click', startNewVisit);
$('backBtn').addEventListener('click', () => showScreen('dashboard'));
$('captureGps').addEventListener('click', captureGps);
$('photoInput').addEventListener('change', handlePhotos);
$('addActionBtn').addEventListener('click', () => addActionRow());
$('addSkuBtn').addEventListener('click', () => {
  const currentSkus = [...document.querySelectorAll('.sku-row')].map(row => ({
    name: row.querySelector('.sku-name').value,
    available: row.querySelector('.sku-available').checked,
    note: row.querySelector('.sku-note').value
  }));
  currentSkus.push({ name: '', available: true, note: '' });
  renderSkus(currentSkus);
});
$('exportBtn').addEventListener('click', exportCurrentVisit);
$('exportBottomBtn').addEventListener('click', exportCurrentVisit);
$('marketVisitForm').addEventListener('submit', (event) => {
  event.preventDefault();
  saveVisit();
});

renderDashboard();
renderChecklist();
renderSkus();
renderActions([]);
