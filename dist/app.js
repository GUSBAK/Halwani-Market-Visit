
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

const defaultProductRange = [
  { id: 'mez-tahina-9kg', name: 'MEZ Tahina 9kg', code: 'HT001' },
  { id: 'al-shola-tahina-9kg', name: 'Al Shola Tahina 9kg', code: 'HT002' },
  { id: 'mez-fries-9x9', name: 'MEZ Fries 9x9', code: 'HF001' },
  { id: 'mez-fries-6x6', name: 'MEZ Fries 6x6', code: 'HF002' },
  { id: 'mez-ketchup', name: 'MEZ Ketchup', code: 'HC001' },
  { id: 'mez-hot-sauce', name: 'MEZ Hot Sauce', code: 'HC002' },
  { id: 'mez-mayo', name: 'MEZ Mayo', code: 'HC003' },
  { id: 'halwani-garlic-mayo-sachet', name: 'Halwani Garlic Mayo Sachet', code: 'HP001' },
  { id: 'mez-salt-700g', name: 'MEZ Salt 700g', code: 'HS001' },
  { id: 'halwani-maamoul', name: 'Halwani Maamoul', code: 'HB001' },
  { id: 'jammy-25g', name: 'Jammy 25g x100', code: 'HJ001' },
  { id: 'halwani-mozzarella', name: 'Halwani Mozzarella', code: 'HZ001' },
  { id: 'mez-mortadella', name: 'MEZ Mortadella', code: 'HM001' },
  { id: 'mez-smoked-turkey', name: 'MEZ Smoked Turkey', code: 'HM002' },
  { id: 'halwani-halawa', name: 'Halwani Halawa', code: 'HH001' }
];

const state = {
  visits: JSON.parse(localStorage.getItem('halwaniVisits') || '[]'),
  productRange: loadProductRange(),
  currentVisit: null,
  photos: [],
  gps: null,
  lastScreenBeforeProducts: 'dashboard'
};

const $ = (id) => document.getElementById(id);

function loadProductRange() {
  try {
    const stored = JSON.parse(localStorage.getItem('halwaniProductRange') || 'null');
    if (Array.isArray(stored) && stored.length) {
      return stored.map(item => ({
        id: item.id || uid(),
        name: item.name || '',
        code: item.code || item.category || ''
      }));
    }
  } catch {}
  return [...defaultProductRange];
}

function saveState() {
  localStorage.setItem('halwaniVisits', JSON.stringify(state.visits));
  renderDashboard();
}

function saveProductRange() {
  localStorage.setItem('halwaniProductRange', JSON.stringify(state.productRange));
  renderProductRange();
  renderProductPicker();
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('active');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('active'), 1800);
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
      <div class="check-row-top"><strong>${escapeHtml(item)}</strong></div>
      <div class="check-status">
        ${['Yes', 'Partial', 'No'].map(option => `
          <label><input type="radio" name="check-${index}" value="${option}" ${value === option ? 'checked' : ''}> ${option}</label>
        `).join('')}
      </div>
      <input class="check-note" data-item="${escapeHtml(item)}" placeholder="Note" value="${escapeHtml(note)}">
    `;
    container.appendChild(row);
  });
}

function skusFromProductRange() {
  return state.productRange.map(product => ({
    name: product.name,
    code: product.code || '',
    available: true
  }));
}

function renderSkus(skus = skusFromProductRange()) {
  const container = $('skuList');
  container.innerHTML = '';
  skus.forEach((sku) => {
    const row = document.createElement('div');
    row.className = 'sku-row';
    row.innerHTML = `
      <div class="sku-main-grid simple-sku-grid">
        <input class="sku-name" value="${escapeHtml(sku.name || '')}" placeholder="SKU name">
        <input class="sku-code" value="${escapeHtml(sku.code || '')}" placeholder="SKU code">
        <label><input class="sku-available" type="checkbox" ${sku.available ? 'checked' : ''}> Available</label>
      </div>
    `;
    container.appendChild(row);
  });
}

function renderProductPicker() {
  const picker = $('productPicker');
  if (!picker) return;
  picker.innerHTML = state.productRange
    .slice()
    .sort((a, b) => `${a.code}${a.name}`.localeCompare(`${b.code}${b.name}`))
    .map(product => `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)}${product.code ? ` (${escapeHtml(product.code)})` : ''}</option>`)
    .join('');
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
    card.addEventListener('click', () => openPhotoViewer(photo.dataUrl));
    gallery.appendChild(card);
  });
}

function openPhotoViewer(src) {
  $('photoViewerImage').src = src;
  $('photoViewer').classList.add('active');
}

function closePhotoViewer() {
  $('photoViewer').classList.remove('active');
  $('photoViewerImage').src = '';
}

function renderProductRange() {
  const list = $('productRangeList');
  const badge = $('productCountBadge');
  if (!list || !badge) return;
  badge.textContent = `${state.productRange.length} SKUs`;
  list.innerHTML = '';

  state.productRange
    .slice()
    .sort((a, b) => `${a.code}${a.name}`.localeCompare(`${b.code}${b.name}`))
    .forEach(product => {
      const row = document.createElement('div');
      row.className = 'product-row';
      row.innerHTML = `
        <div class="product-row-top">
          <div>
            <strong>${escapeHtml(product.name)}</strong>
            <p class="hint">SKU Code: ${escapeHtml(product.code || '')}</p>
          </div>
          <button type="button" class="ghost danger-text remove-product">Remove</button>
        </div>
      `;
      row.querySelector('.remove-product').addEventListener('click', () => {
        state.productRange = state.productRange.filter(item => item.id !== product.id);
        saveProductRange();
      });
      list.appendChild(row);
    });
}

function resetVisitForm() {
  $('marketVisitForm').reset();
  $('visitId').value = uid();
  $('visitor').value = 'Ghassan Baker';
  $('city').value = 'Jeddah';
  $('gpsStatus').textContent = 'Not captured yet.';
  state.currentVisit = null;
  state.photos = [];
  state.gps = null;
  renderChecklist();
  renderProductPicker();
  renderSkus();
  renderPhotos([]);
  renderActions([]);
}

function startNewVisit() {
  resetVisitForm();
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
  renderProductPicker();
  renderSkus(visit.skus?.length ? visit.skus : skusFromProductRange());
  renderPhotos(visit.photos || []);
  renderActions(visit.actions || []);
  showScreen('visitForm');
}

function collectVisit() {
  const checklist = {};
  checklistItems.forEach((item, index) => {
    const status = document.querySelector(`input[name="check-${index}"]:checked`)?.value || 'Yes';
    const noteInput = [...document.querySelectorAll('.check-note')].find(input => input.dataset.item === item);
    checklist[item] = { status, note: noteInput?.value || '' };
  });

  const skus = [...document.querySelectorAll('.sku-row')].map(row => ({
    name: row.querySelector('.sku-name').value,
    code: row.querySelector('.sku-code').value,
    available: row.querySelector('.sku-available').checked
  })).filter(sku => sku.name.trim() || sku.code.trim());

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
    closedAt: new Date().toISOString(),
    gps: state.gps,
    checklist,
    skus,
    photos: state.photos,
    competitorNotes: $('competitorNotes').value,
    actions,
    visitNotes: $('visitNotes').value
  };
}

function saveVisit({ close = false } = {}) {
  const visit = collectVisit();
  const existingIndex = state.visits.findIndex(v => v.id === visit.id);
  if (existingIndex >= 0) state.visits[existingIndex] = visit;
  else state.visits.unshift(visit);
  state.currentVisit = visit;
  saveState();

  if (close) {
    resetVisitForm();
    renderDashboard();
    showScreen('dashboard');
    toast('Visit closed and saved.');
  } else {
    toast('Visit saved.');
  }
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

async function handlePhotos(event) {
  const files = [...event.target.files];
  if (!files.length) return;
  const category = $('photoCategory').value;
  const note = $('photoNote').value;
  toast('Adding photos...');

  for (const file of files) {
    const dataUrl = await fileToCompressedDataUrl(file);
    state.photos.push({
      id: uid(),
      category,
      note,
      fileName: file.name,
      dataUrl,
      createdAt: new Date().toISOString()
    });
  }

  renderPhotos(state.photos);
  event.target.value = '';
  $('photoNote').value = '';
  toast('Photos added.');
}

function fileToCompressedDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSide = 1600;
        const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * ratio);
        canvas.height = Math.round(image.height * ratio);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      image.onerror = () => resolve(reader.result);
      image.src = reader.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function addProduct() {
  const name = $('newProductName').value.trim();
  const code = $('newProductCode').value.trim();
  if (!name) {
    toast('Add a SKU name first.');
    return;
  }
  const exists = state.productRange.some(product => product.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    toast('This SKU is already in the range.');
    return;
  }
  state.productRange.push({ id: uid(), name, code });
  $('newProductName').value = '';
  $('newProductCode').value = '';
  saveProductRange();
  toast('SKU added to product range.');
}

function collectCurrentSkus() {
  return [...document.querySelectorAll('.sku-row')].map(row => ({
    name: row.querySelector('.sku-name').value,
    code: row.querySelector('.sku-code').value,
    available: row.querySelector('.sku-available').checked
  })).filter(sku => sku.name.trim() || sku.code.trim());
}

function addSelectedSkuToVisit() {
  const id = $('productPicker').value;
  const product = state.productRange.find(item => item.id === id);
  if (!product) return;
  const currentSkus = collectCurrentSkus();
  const exists = currentSkus.some(sku => sku.name.toLowerCase() === product.name.toLowerCase());
  if (exists) {
    toast('SKU already exists in this visit.');
    return;
  }
  currentSkus.push({ name: product.name, code: product.code || '', available: true });
  renderSkus(currentSkus);
}

function exportCurrentVisit() {
  const visit = collectVisit();
  exportReport(visit);
}

function exportReport(visit) {
  const gpsLink = visit.gps ? `https://www.google.com/maps?q=${visit.gps.lat},${visit.gps.lng}` : '';
  const logoUrl = new URL('assets/halwani-logo.png', window.location.href).href;
  const missingSkus = (visit.skus || []).filter(sku => !sku.available);
  const photos = visit.photos || [];
  const photoHtml = photos.length
    ? photos.map(photo => `
        <article class="photo-card-report">
          <img src="${photo.dataUrl}" alt="${escapeHtml(photo.category)}">
          <p><strong>${escapeHtml(photo.category)}</strong>${photo.note ? `<br>${escapeHtml(photo.note)}` : ''}</p>
        </article>
      `).join('')
    : '<p>No photos added.</p>';

  const reportHtml = `
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visit Report - ${escapeHtml(visit.customer || 'Store')}</title>
  <style>
    :root { --green:#006b3f; --green-dark:#004d2f; --green-soft:#e6f3ee; --border:#dfe8e4; --text:#18231f; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: var(--text); margin: 24px; background: white; }
    .no-print { padding: 10px 14px; background: var(--green); color: white; border: 0; border-radius: 10px; font-weight: bold; margin-bottom: 16px; }
    .report-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
    .logo { width: 170px; height: auto; }
    h1 { color: var(--green); margin: 0 0 4px; font-size: 30px; }
    h2 { color: var(--green-dark); border-bottom: 3px solid var(--green-soft); padding-bottom: 8px; margin: 24px 0 12px; font-size: 22px; }
    p { line-height: 1.35; }
    .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 18px 0; }
    .box { border: 1px solid var(--border); border-radius: 12px; padding: 11px; min-height: 58px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid var(--border); padding: 8px; text-align: left; vertical-align: top; }
    th { background: var(--green-soft); }
    .pill { display: inline-block; padding: 4px 8px; border-radius: 99px; background: var(--green-soft); color: var(--green-dark); font-weight: bold; }
    .section { break-inside: avoid; page-break-inside: avoid; }
    .photos-section { break-before: page; page-break-before: always; }
    .photos-grid-report { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; align-items: start; }
    .photo-card-report { border: 1px solid var(--border); border-radius: 12px; overflow: hidden; break-inside: avoid; page-break-inside: avoid; }
    .photo-card-report img { width: 100%; height: auto; max-height: 240px; object-fit: contain; display: block; background: #fff; }
    .photo-card-report p { margin: 8px; min-height: 34px; }
    @page { size: A4; margin: 10mm; }
    @media print {
      body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none; }
      .photos-grid-report { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .photo-card-report, .section { break-inside: avoid !important; page-break-inside: avoid !important; }
      .photo-card-report img { max-height: 220px; }
    }
  </style>
</head>
<body>
  <button class="no-print" onclick="window.print()">Print / Save PDF</button> <button class="no-print" onclick="window.close()">Close Report / Back to App</button>

  <div class="report-header">
    <div>
      <h1>Halwani Market Visit Report</h1>
      <p>${escapeHtml(formatDate(visit.createdAt))}</p>
    </div>
    <img class="logo" src="${logoUrl}" alt="Halwani Bros">
  </div>

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

  <section class="section">
    <h2>Checklist</h2>
    <table>
      <tr><th>Area</th><th>Status</th><th>Note</th></tr>
      ${Object.entries(visit.checklist || {}).map(([area, data]) => `<tr><td>${escapeHtml(area)}</td><td><span class="pill">${escapeHtml(data.status)}</span></td><td>${escapeHtml(data.note || '')}</td></tr>`).join('')}
    </table>
  </section>

  <section class="section">
    <h2>Range Availability</h2>
    <table>
      <tr><th>SKU Code</th><th>SKU Name</th><th>Status</th></tr>
      ${(visit.skus || []).map(sku => `<tr><td>${escapeHtml(sku.code || '')}</td><td>${escapeHtml(sku.name || '')}</td><td>${sku.available ? 'Available' : 'Missing'}</td></tr>`).join('')}
    </table>
  </section>

  <section class="section">
    <h2>Missing SKUs</h2>
    ${missingSkus.length ? `<ul>${missingSkus.map(sku => `<li>${escapeHtml(sku.name)}${sku.code ? ` (${escapeHtml(sku.code)})` : ''}</li>`).join('')}</ul>` : '<p>No missing SKUs recorded.</p>'}
  </section>

  <section class="section">
    <h2>Competitor Activity</h2>
    <p>${escapeHtml(visit.competitorNotes || 'No competitor notes recorded.')}</p>
  </section>

  <section class="photos-section">
    <h2>Photos</h2>
    <div class="photos-grid-report">${photoHtml}</div>
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
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
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

$('closePhotoViewer').addEventListener('click', closePhotoViewer);
$('photoViewer').addEventListener('click', (event) => {
  if (event.target.id === 'photoViewer') closePhotoViewer();
});
$('newVisitBtn').addEventListener('click', startNewVisit);
$('startVisitHero').addEventListener('click', startNewVisit);
$('productsTopBtn').addEventListener('click', () => { state.lastScreenBeforeProducts = 'dashboard'; showScreen('productsScreen'); });
$('manageProductsHero').addEventListener('click', () => { state.lastScreenBeforeProducts = 'dashboard'; showScreen('productsScreen'); });
$('productsBackBtn').addEventListener('click', () => showScreen(state.lastScreenBeforeProducts || 'dashboard'));
$('backBtn').addEventListener('click', () => showScreen('dashboard'));
$('openProductsFromVisit').addEventListener('click', () => { state.lastScreenBeforeProducts = 'visitForm'; showScreen('productsScreen'); });
$('captureGps').addEventListener('click', captureGps);
$('cameraInput').addEventListener('change', handlePhotos);
$('libraryInput').addEventListener('change', handlePhotos);
$('addActionBtn').addEventListener('click', () => addActionRow());
$('addProductBtn').addEventListener('click', addProduct);
$('addSelectedSkuBtn').addEventListener('click', addSelectedSkuToVisit);
$('resetProductsBtn').addEventListener('click', () => {
  if (!confirm('Reset product range to the default Halwani list?')) return;
  state.productRange = [...defaultProductRange];
  saveProductRange();
  toast('Product range reset.');
});
$('addSkuBtn').addEventListener('click', () => {
  const currentSkus = collectCurrentSkus();
  currentSkus.push({ name: '', code: '', available: true });
  renderSkus(currentSkus);
});
$('exportBtn').addEventListener('click', exportCurrentVisit);
$('exportBottomBtn').addEventListener('click', exportCurrentVisit);
$('closeVisitBtn').addEventListener('click', () => saveVisit({ close: true }));
$('marketVisitForm').addEventListener('submit', (event) => {
  event.preventDefault();
  saveVisit({ close: true });
});

renderDashboard();
renderProductRange();
renderProductPicker();
renderChecklist();
renderSkus();
renderActions([]);
