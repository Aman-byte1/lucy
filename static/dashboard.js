const API = { settings: "/api/settings", support: "/api/support", upload: "/api/upload", activity: "/api/activity", scan: "/api/scan-site", scrape: "/api/scrape-pages", clients: "/api/clients", appointments: "/api/appointments", conversations: "/api/conversations", analytics: "/api/analytics" };

function showToast(msg) { document.getElementById('toastMsg').innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>' + msg; new bootstrap.Toast(document.getElementById('saveToast')).show(); }

// ── Knowledge Base ──────────────────────────────────────────────────
async function scanWebsite() {
    const u = document.getElementById('scanUrl').value.trim(); if (!u) return;
    const b = document.getElementById('scanBtn'); b.innerText = "Scanning..."; b.disabled = true;
    try {
        const r = await fetch(API.scan, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: u }) });
        const d = await r.json(); if (d.error) throw new Error(d.error);
        document.getElementById('linksList').innerHTML = d.links.map((l, i) => `<div class="form-check text-truncate"><input class="form-check-input" type="checkbox" value="${l}" id="lnk${i}" checked><label class="form-check-label" for="lnk${i}" style="color:var(--muted);font-size:.82rem">${l}</label></div>`).join('');
        document.getElementById('linkSelectionArea').classList.remove('d-none');
        showToast(`Found ${d.links.length} pages!`);
    } catch (e) { alert("Scan failed: " + e.message); }
    finally { b.innerText = "Scan"; b.disabled = false; }
}

async function importSelectedLinks() {
    const cb = document.querySelectorAll('#linksList input:checked');
    if (!cb.length) { alert("Select pages."); return; }
    const urls = Array.from(cb).map(c => c.value);
    const b = document.getElementById('importLinksBtn');
    b.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Importing...'; b.disabled = true;
    try {
        const r = await fetch(API.scrape, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ urls }) });
        const d = await r.json(); if (d.error) throw new Error(d.error);
        const kb = document.getElementById('kbText');
        kb.value = (kb.value + "\n" + d.text).trim();
        document.getElementById('linkSelectionArea').classList.add('d-none');
        showToast(`Imported ${d.count} pages!`);
    } catch (e) { alert("Import failed: " + e.message); }
    finally { b.innerHTML = '<i class="bi bi-download me-2"></i>Import Selected'; b.disabled = false; }
}

async function uploadFile() {
    const f = document.getElementById('fileUpload').files[0]; if (!f) return;
    const fd = new FormData(); fd.append('file', f);
    try {
        const r = await fetch(API.upload, { method: 'POST', body: fd });
        const d = await r.json(); if (d.error) throw new Error(d.error);
        const kb = document.getElementById('kbText');
        kb.value = (kb.value + "\n\n--- " + d.filename + " ---\n" + d.extracted_text).trim();
        showToast("File imported!"); document.getElementById('fileUpload').value = "";
    } catch (e) { alert("Upload failed: " + e.message); }
}

// ── Clients ─────────────────────────────────────────────────────────
async function loadClients() {
    try {
        const r = await fetch(API.clients); const d = await r.json();
        const t = document.getElementById('clientsTable');
        if (!Object.keys(d).length) { t.innerHTML = '<tr><td colspan="6" class="text-center py-4" style="color:var(--muted)">No clients yet.</td></tr>'; return; }
        t.innerHTML = Object.entries(d).map(([id, c]) => `<tr>
            <td><code style="color:var(--p2)">${id}</code></td>
            <td>${c.name}</td>
            <td style="color:var(--muted);font-size:.82rem">${c.service || '-'}</td>
            <td><span class="badge-${c.status}">${c.status}</span></td>
            <td style="color:var(--muted);font-size:.82rem">${c.phone || '-'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editClient('${id}')"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteClient('${id}')"><i class="bi bi-trash"></i></button>
            </td></tr>`).join('');
    } catch (e) { console.error(e); }
}

function openClientModal() {
    document.getElementById('editClientId').value = '';
    document.getElementById('clientModalTitle').innerText = 'Add Client';
    ['cName', 'cEmail', 'cPhone', 'cService', 'cNotes'].forEach(f => document.getElementById(f).value = '');
    document.getElementById('cStatus').value = 'active';
    new bootstrap.Modal(document.getElementById('clientModal')).show();
}

async function editClient(id) {
    try {
        const r = await fetch(API.clients); const d = await r.json(); const c = d[id]; if (!c) return;
        document.getElementById('editClientId').value = id;
        document.getElementById('clientModalTitle').innerText = 'Edit Client';
        document.getElementById('cName').value = c.name || '';
        document.getElementById('cEmail').value = c.email || '';
        document.getElementById('cPhone').value = c.phone || '';
        document.getElementById('cService').value = c.service || '';
        document.getElementById('cStatus').value = c.status || 'active';
        document.getElementById('cNotes').value = c.notes || '';
        new bootstrap.Modal(document.getElementById('clientModal')).show();
    } catch (e) { console.error(e); }
}

async function saveClient() {
    const id = document.getElementById('editClientId').value;
    const data = { name: document.getElementById('cName').value, email: document.getElementById('cEmail').value, phone: document.getElementById('cPhone').value, service: document.getElementById('cService').value, status: document.getElementById('cStatus').value, notes: document.getElementById('cNotes').value };
    try {
        if (id) { await fetch(API.clients + '/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); }
        else { await fetch(API.clients, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); }
        bootstrap.Modal.getInstance(document.getElementById('clientModal')).hide();
        loadClients(); showToast('Client saved!');
    } catch (e) { alert('Error: ' + e.message); }
}

async function deleteClient(id) {
    if (!confirm('Delete this client?')) return;
    try { await fetch(API.clients + '/' + id, { method: 'DELETE' }); loadClients(); showToast('Client deleted'); }
    catch (e) { alert('Error'); }
}

// ── Appointments ────────────────────────────────────────────────────
async function loadAppointments() {
    try {
        const r = await fetch(API.appointments); const d = await r.json();
        const t = document.getElementById('apptsTable');
        if (!Object.keys(d).length) { t.innerHTML = '<tr><td colspan="6" class="text-center py-4" style="color:var(--muted)">No appointments.</td></tr>'; return; }
        t.innerHTML = Object.entries(d).map(([id, a]) => `<tr>
            <td><code style="color:var(--p2)">${id}</code></td>
            <td>${a.name}${a.client_id ? ' <small style="color:var(--muted)">(' + a.client_id + ')</small>' : ''}</td>
            <td>${a.appointment || '-'}</td>
            <td style="color:var(--muted);font-size:.82rem">${a.service_type || '-'}</td>
            <td><span class="badge-${a.status || 'scheduled'}">${a.status || 'scheduled'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editAppt('${id}')"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteAppt('${id}')"><i class="bi bi-trash"></i></button>
            </td></tr>`).join('');
    } catch (e) { console.error(e); }
}

function openApptModal() {
    document.getElementById('editApptId').value = '';
    document.getElementById('apptModalTitle').innerText = 'New Appointment';
    ['aName', 'aClientId', 'aDateTime', 'aService', 'aNotes'].forEach(f => document.getElementById(f).value = '');
    document.getElementById('aStatus').value = 'scheduled';
    new bootstrap.Modal(document.getElementById('apptModal')).show();
}

async function editAppt(id) {
    try {
        const r = await fetch(API.appointments); const d = await r.json(); const a = d[id]; if (!a) return;
        document.getElementById('editApptId').value = id;
        document.getElementById('apptModalTitle').innerText = 'Edit Appointment';
        document.getElementById('aName').value = a.name || '';
        document.getElementById('aClientId').value = a.client_id || '';
        document.getElementById('aDateTime').value = a.appointment || '';
        document.getElementById('aService').value = a.service_type || '';
        document.getElementById('aStatus').value = a.status || 'scheduled';
        document.getElementById('aNotes').value = a.notes || '';
        new bootstrap.Modal(document.getElementById('apptModal')).show();
    } catch (e) { console.error(e); }
}

async function saveAppointment() {
    const id = document.getElementById('editApptId').value;
    const data = { name: document.getElementById('aName').value, client_id: document.getElementById('aClientId').value, appointment: document.getElementById('aDateTime').value, service_type: document.getElementById('aService').value, status: document.getElementById('aStatus').value, notes: document.getElementById('aNotes').value };
    try {
        if (id) { await fetch(API.appointments + '/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); }
        else { await fetch(API.appointments, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); }
        bootstrap.Modal.getInstance(document.getElementById('apptModal')).hide();
        loadAppointments(); showToast('Appointment saved!');
    } catch (e) { alert('Error: ' + e.message); }
}

async function deleteAppt(id) {
    if (!confirm('Delete this appointment?')) return;
    try { await fetch(API.appointments + '/' + id, { method: 'DELETE' }); loadAppointments(); showToast('Deleted'); }
    catch (e) { alert('Error'); }
}

// ── Conversations ───────────────────────────────────────────────────
async function loadConversations(search = '') {
    try {
        const url = API.conversations + (search ? '?search=' + encodeURIComponent(search) : '');
        const r = await fetch(url); const d = await r.json();
        const c = document.getElementById('convoList');
        if (!d.length) { c.innerHTML = '<div class="text-center py-4" style="color:var(--muted)">No conversations yet. Chat with the bot to see logs here.</div>'; return; }
        c.innerHTML = d.slice(0, 50).map(cv => `<div class="convo-item">
            <div class="convo-q"><i class="bi bi-person-fill me-1" style="color:var(--p2)"></i>${cv.user_query || ''}</div>
            <div class="convo-a"><i class="bi bi-robot me-1"></i>${(cv.bot_reply || '').substring(0, 150)}...</div>
            <div class="convo-meta">
                <span class="me-3"><i class="bi bi-clock me-1"></i>${cv.timestamp ? new Date(cv.timestamp).toLocaleString() : ''}</span>
                <span class="me-3"><i class="bi bi-translate me-1"></i>${cv.language || ''}</span>
                <span style="color:var(--green)">${cv.tokens || 0} tokens</span>
            </div></div>`).join('');
    } catch (e) { console.error(e); }
}

function searchConversations() { loadConversations(document.getElementById('convoSearch').value.trim()); }

// ── Analytics ───────────────────────────────────────────────────────
async function loadAnalytics() {
    try {
        const r = await fetch(API.analytics); const d = await r.json();
        const colors = [
            { bg: 'linear-gradient(135deg,#0066CC,#4d94ff)', icon: 'bi-people' },
            { bg: 'linear-gradient(135deg,#FF6600,#ff944d)', icon: 'bi-calendar-check' },
            { bg: 'linear-gradient(135deg,#009A44,#4dcc7a)', icon: 'bi-chat-dots' },
            { bg: 'linear-gradient(135deg,#EF3340,#ff6b6b)', icon: 'bi-lightning' }
        ];
        const stats = [
            { label: 'Total Clients', val: d.total_clients, sub: `${d.active_clients} active` },
            { label: 'Appointments', val: d.total_appointments, sub: `${d.scheduled_appointments} scheduled` },
            { label: 'Conversations', val: d.total_conversations, sub: `${d.total_tokens} tokens used` },
            { label: 'Active Clients', val: d.active_clients, sub: 'currently active' }
        ];
        document.getElementById('statsCards').innerHTML = stats.map((s, i) => `<div class="col-md-3 col-6">
            <div class="stat-card" style="background:${colors[i].bg}">
                <i class="bi ${colors[i].icon} stat-icon" style="color:#fff"></i>
                <small style="color:rgba(255,255,255,.7)">${s.label}</small>
                <h2 style="color:#fff">${s.val}</h2>
                <small style="color:rgba(255,255,255,.6)">${s.sub}</small>
            </div></div>`).join('');

        // Bar chart
        const chart = document.getElementById('chartArea');
        const days = d.conversations_per_day || {};
        const maxVal = Math.max(...Object.values(days), 1);
        if (!Object.keys(days).length) { chart.innerHTML = '<div class="text-center w-100" style="color:var(--muted)">No conversation data yet</div>'; return; }
        chart.innerHTML = Object.entries(days).map(([day, count]) => {
            const h = Math.max((count / maxVal) * 160, 4);
            return `<div style="flex:1;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:flex-end">
                <div style="font-size:.7rem;color:var(--muted);margin-bottom:4px">${count}</div>
                <div style="width:100%;max-width:40px;height:${h}px;background:linear-gradient(180deg,var(--p),var(--p2));border-radius:6px 6px 0 0;transition:height .3s"></div>
                <div style="font-size:.65rem;color:var(--muted);margin-top:6px">${day.slice(5)}</div>
            </div>`;
        }).join('');
    } catch (e) { console.error(e); }
}

// ── Activity ────────────────────────────────────────────────────────
async function loadActivity() {
    try {
        const r = await fetch(API.activity); const d = await r.json();
        const c = document.getElementById('activityList');
        if (!d.length) { c.innerHTML = '<p style="color:var(--muted)" class="text-center py-4">No recent activity.</p>'; return; }
        c.innerHTML = d.map(l => `<div class="log-item">
            <div class="log-query">${l.payload?.query || "Unknown"}</div>
            <div class="log-meta"><span class="me-2" style="color:var(--p2)">${new Date(l.timestamp * 1000).toLocaleTimeString()}</span><span style="color:var(--green)">${l.payload?.usage?.total_tokens || 0} tokens</span></div>
        </div>`).join('');
    } catch (e) { console.error(e); }
}

// ── Settings Load & Save ────────────────────────────────────────────
function updateEmbedCode(key) {
    document.getElementById('embedCode').value = `<script src="${window.location.origin}/static/widget.js"><\/script>\n<script>\n  window.__LUCY_CLIENT_KEY__ = "${key}";\n<\/script>`;
}

function generateNewKey() {
    const k = 'lucy-' + Math.random().toString(36).substr(2, 9);
    document.getElementById('apiKey').value = k;
    updateEmbedCode(k);
}

async function loadSettings() {
    try {
        const r = await fetch(API.settings);
        if (!r.ok) throw new Error();
        const d = await r.json();
        document.getElementById('kbText').value = d.knowledge_base || '';
        document.getElementById('sysPrompt').value = d.system_prompt || '';
        document.getElementById('welcomeMsg').value = d.welcome_message || '';
        document.getElementById('apiKey').value = d.client_api_key || 'lucy-dev-12345';
        document.getElementById('botName').value = d.bot_name || 'Lucy AI';
        document.getElementById('themeColor').value = d.theme_color || '#6C5CE7';
        document.getElementById('userMsgColor').value = d.user_msg_color || '#6C5CE7';
        document.getElementById('botMsgColor').value = d.bot_msg_color || '#ffffff';
        document.getElementById('sendBtnColor').value = d.send_btn_color || '#6C5CE7';
        document.getElementById('aiTemp').value = d.temperature || 0.7;
        document.getElementById('tempValue').innerText = d.temperature || 0.7;
        document.getElementById('previewName').innerText = d.bot_name || 'Lucy AI';
        updateEmbedCode(d.client_api_key || 'lucy-dev-12345');
        addMsg(d.welcome_message || 'Hello!', 'assistant');
    } catch (e) { window.location.href = '/auth'; }
}

document.getElementById('saveBtn').addEventListener('click', async () => {
    const b = document.getElementById('saveBtn'); b.innerText = "Saving..."; b.disabled = true;
    await fetch(API.settings, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
            knowledge_base: document.getElementById('kbText').value,
            system_prompt: document.getElementById('sysPrompt').value,
            welcome_message: document.getElementById('welcomeMsg').value,
            client_api_key: document.getElementById('apiKey').value,
            bot_name: document.getElementById('botName').value,
            theme_color: document.getElementById('themeColor').value,
            user_msg_color: document.getElementById('userMsgColor').value,
            bot_msg_color: document.getElementById('botMsgColor').value,
            send_btn_color: document.getElementById('sendBtnColor').value,
            temperature: document.getElementById('aiTemp').value
        })
    });
    b.innerText = "Save Changes"; b.disabled = false; showToast('Settings saved!');
});

// ── Chat Preview ────────────────────────────────────────────────────
function addMsg(text, role) {
    const d = document.createElement('div'); d.className = `msg ${role}`; d.textContent = text;
    const c = document.getElementById('messages'); c.appendChild(d); c.scrollTop = c.scrollHeight;
}

async function sendMessage() {
    const i = document.getElementById('userInput'); const t = i.value.trim(); if (!t) return;
    addMsg(t, 'user'); i.value = '';
    try {
        const r = await fetch(API.support, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-KEY': 'dashboard-demo-key' }, body: JSON.stringify({ user_query: t, language: 'auto', sector: 'admin' }) });
        const d = await r.json(); addMsg(d.reply, 'assistant');
    } catch (e) { addMsg("Connection error", 'assistant'); }
}

document.getElementById('sendBtn').addEventListener('click', () => sendMessage());
document.getElementById('userInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });
document.getElementById('clearPreviewBtn').addEventListener('click', () => {
    if (confirm("Clear chat?")) { document.getElementById('messages').innerHTML = ''; addMsg(document.getElementById('welcomeMsg').value || 'Hello!', 'assistant'); }
});
document.getElementById('botName').addEventListener('input', (e) => { document.getElementById('previewName').innerText = e.target.value || 'Lucy AI'; });

// ── Voice ───────────────────────────────────────────────────────────
const micBtn = document.getElementById('micBtn');
let mediaRecorder, audioChunks = [];
micBtn.addEventListener('click', async () => {
    if (micBtn.classList.contains('listening')) { mediaRecorder.stop(); micBtn.classList.remove('listening'); }
    else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream); audioChunks = [];
            mediaRecorder.ondataavailable = (e) => { audioChunks.push(e.data); };
            mediaRecorder.onstop = async () => {
                const blob = new Blob(audioChunks, { type: 'audio/wav' });
                try { const r = await fetch('/api/asr?lang=amh', { method: 'POST', body: blob }); const d = await r.json(); if (d.text) { document.getElementById('userInput').value = d.text; sendMessage(); } } catch (e) { console.error(e); }
            };
            mediaRecorder.start(); micBtn.classList.add('listening');
        } catch (e) { console.error(e); }
    }
});

// ── Init ────────────────────────────────────────────────────────────
loadSettings();
