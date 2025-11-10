// scripts/admin.js - lógica del panel técnico con Storage y limpieza 7 días
import { db, storage } from '../firebase.js';
import {
  collection, addDoc, doc, onSnapshot, updateDoc, serverTimestamp,
  query, orderBy, deleteDoc, getDoc, getDocs
} from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';
import { ref as sRef, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js';

const adminCodeInput = document.getElementById('adminCodeInput');
const btnLogin = document.getElementById('btnLogin');
const ticketForm = document.getElementById('ticketForm');
const ticketsList = document.getElementById('ticketsList');
const btnClear = document.getElementById('btnClear');
const detailArea = document.getElementById('detailArea');
const filterStatus = document.getElementById('filterStatus');
const btnDeleteAll = document.getElementById('btnDeleteAll');

import { ADMIN_CODE } from '../firebase.js';

let ticketsUnsub = null;
let messagesUnsub = null;

btnLogin.onclick = () => {
  const v = adminCodeInput.value.trim();
  if (v === ADMIN_CODE) {
    adminCodeInput.placeholder = 'Conectado';
    adminCodeInput.disabled = true;
    btnLogin.disabled = true;
    startListeningTickets();
    autoCleanupFinished();
  } else {
    alert('Código incorrecto');
  }
};

btnClear.onclick = () => ticketForm.reset();

function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, (m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }

async function readFilesAsDataURLs(files, limit=6){
  const arr = Array.from(files).slice(0, limit);
  return await Promise.all(arr.map(f => new Promise(res=>{
    const r = new FileReader();
    r.onload = ()=>res(r.result);
    r.readAsDataURL(f);
  })));
}

ticketForm.onsubmit = async (e) => {
  e.preventDefault();
  if (adminCodeInput.disabled !== true) return alert('Acceso denegado. Ingresa el código técnico.');
  const categoria = document.getElementById('categoria').value.trim();
  const cliente = document.getElementById('cliente').value.trim();
  const producto = document.getElementById('producto').value.trim();
  const marca = document.getElementById('marca').value.trim();
  const serie = document.getElementById('serie').value.trim();
  const observaciones = document.getElementById('observaciones').value.trim();
  const precio = document.getElementById('precio').value.trim();
  const prioridad = document.getElementById('prioridad').value;
  const status = document.getElementById('status').value;
  const motivo = document.getElementById('motivo').value.trim();
  const imagesInput = document.getElementById('images');

  // create ticket first
  const docRef = await addDoc(collection(db, 'tickets'), {
    categoria, cliente, producto, marca, serie, observaciones, precio, prioridad, status, motivo, images: [], createdAt: serverTimestamp()
  });
  const id = docRef.id;

  // upload images to storage and update doc with urls and paths
  const files = Array.from(imagesInput.files).slice(0,6);
  const uploaded = [];
  for (const f of files) {
    const path = `tickets/${id}/${Date.now()}_${f.name}`;
    const storageRef = sRef(storage, path);
    await uploadBytes(storageRef, f);
    const url = await getDownloadURL(storageRef);
    uploaded.push({ url, path });
  }
  if (uploaded.length) await updateDoc(doc(db, 'tickets', id), { images: uploaded });

  const link = window.location.origin + window.location.pathname.replace('admin.html','client.html') + '?id=' + id;
  navigator.clipboard?.writeText(link).catch(()=>{});
  alert('Ticket creado. Link copiado:\n' + link);
  ticketForm.reset();
};

function renderTickets(docs){
  ticketsList.innerHTML = '';
  if (!docs || docs.length === 0) { ticketsList.innerHTML = '<div class="note">No hay tickets</div>'; return; }
  docs.forEach(docSnap => {
    const t = { id: docSnap.id, ...docSnap.data() };
    if (filterStatus.value !== 'all' && t.status !== filterStatus.value) return;
    const el = document.createElement('div'); el.className = 'tickets-item';
    const img = (t.images && t.images[0]) ? `<img src="${t.images[0].url}" alt="img">` : '<div style="width:72px;height:72px;background:#07122a;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa7bf">No img</div>';
    el.innerHTML = `
      <div style="display:flex;gap:10px;align-items:flex-start">
        ${img}
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div><strong>${escapeHtml(t.producto)}</strong><div class="meta">${escapeHtml(t.cliente)}</div></div>
            <div style="text-align:right">
              <div>${escapeHtml(t.status)}</div>
              <div class="meta">${t.id.slice(0,6)}</div>
            </div>
          </div>
          <div class="note">${escapeHtml((t.observaciones||'').slice(0,120))}</div>
        </div>
      </div>
      <div style="margin-top:8px;display:flex;gap:8px">
        <button data-id="${t.id}" class="btn-copy">Copiar link</button>
        <button data-id="${t.id}" class="btn-open">Abrir</button>
        <button data-id="${t.id}" class="btn-delete">Eliminar</button>
      </div>
    `;
    ticketsList.appendChild(el);
  });

  ticketsList.querySelectorAll('.btn-copy').forEach(b=>{
    b.onclick = ()=>{ const id=b.dataset.id; const link = window.location.origin + window.location.pathname.replace('admin.html','client.html') + '?id=' + id; navigator.clipboard?.writeText(link); alert('Link copiado:\n'+link); };
  });
  ticketsList.querySelectorAll('.btn-open').forEach(b=>{ b.onclick = ()=>{ openDetail(b.dataset.id); }; });
  ticketsList.querySelectorAll('.btn-delete').forEach(async b=>{
    b.onclick = async ()=>{
      if (!confirm('Eliminar ticket?')) return;
      await deleteTicketAndStorage(b.dataset.id);
      alert('Ticket eliminado');
    };
  });
}

function startListeningTickets(){
  const q = query(collection(db, 'tickets'), orderBy('createdAt','desc'));
  ticketsUnsub = onSnapshot(q, (snap)=>{ renderTickets(snap.docs); });
}

async function openDetail(ticketId){
  const docRef = doc(db, 'tickets', ticketId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()){ detailArea.innerHTML = 'Ticket no encontrado'; return; }
  const t = { id: docSnap.id, ...docSnap.data() };
  renderDetail(t);

  // listen messages
  if (messagesUnsub) messagesUnsub();
  const msgsCol = collection(db, 'tickets', ticketId, 'messages');
  const q = query(msgsCol, orderBy('createdAt','asc'));
  messagesUnsub = onSnapshot(q, snap=>{
    const msgs = snap.docs.map(d=>({id:d.id, ...d.data()}));
    renderMessages(msgs);
  });
}

function renderDetail(t){
  const imgs = (t.images||[]).map(s=>`<img src="${s.url}" style="width:100%;max-width:180px;border-radius:8px;margin-right:6px">`).join('');
  detailArea.innerHTML = `
    <div><strong>${escapeHtml(t.producto)}</strong></div>
    <div class="meta">${escapeHtml(t.cliente)}</div>
    <div class="note">${escapeHtml(t.observaciones||'')}</div>
    <div style="margin-top:8px">${imgs}</div>
    <div style="margin-top:8px">Estado:
      <select id="detailStatus">
        <option ${"En espera"}>En espera</option>
        <option ${"En revisión"}>En revisión</option>
        <option ${"Detenido"}>Detenido</option>
        <option ${"Finalizado"}>Finalizado</option>
        <option ${"Listo para recoger"}>Listo para recoger</option>
      </select>
    </div>
    <div style="margin-top:8px">
      <input id="detailMotivo" placeholder="Motivo de detención (breve)" value="${escapeHtml('')} />
    </div>
    <div style="margin-top:8px">
      <button id="btnSaveDetail">Guardar cambios</button>
      <button id="btnCopyLink">Copiar link</button>
    </div>
    <div style="margin-top:12px"><strong>Chat</strong><div id="messagesArea"></div>
      <div style="margin-top:8px">
        <input id="techMessage" placeholder="Escribe una respuesta..." />
        <button id="btnSendTech">Enviar</button>
      </div>
    </div>
  `;
  document.getElementById('btnSaveDetail').onclick = async ()=>{
    const newStatus = document.getElementById('detailStatus').value;
    const newMotivo = document.getElementById('detailMotivo').value.trim();
    const update = { status: newStatus, motivo: newMotivo };
    if (newStatus === 'Finalizado') update.finalizedAt = serverTimestamp();
    await updateDoc(doc(db, 'tickets', t.id), update);
    alert('Guardado');
  };
  document.getElementById('btnCopyLink').onclick = ()=>{
    const link = window.location.origin + window.location.pathname.replace('admin.html','client.html') + '?id=' + t.id;
    navigator.clipboard?.writeText(link);
    alert('Link copiado:\n'+link);
  };
  document.getElementById('btnSendTech').onclick = async ()=>{
    const text = document.getElementById('techMessage').value.trim();
    if (!text) return;
    await addDoc(collection(db, 'tickets', t.id, 'messages'), { sender: 'Técnico', text, createdAt: serverTimestamp() });
    document.getElementById('techMessage').value = '';
  };
}

function renderMessages(msgs){
  const area = document.getElementById('messagesArea');
  if (!area) return;
  area.innerHTML = msgs.map(m=>`<div style="margin-bottom:6px"><strong>${escapeHtml(m.sender)}:</strong> ${escapeHtml(m.text)}</div>`).join('');
}

async function deleteTicketAndStorage(ticketId){
  const docRef = doc(db, 'tickets', ticketId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const imgs = data.images || [];
  for (const im of imgs){
    try{ await deleteObject(sRef(storage, im.path)); } catch(e){ console.warn('no se pudo borrar', im.path, e); }
  }
  const msgsSnap = await getDocs(collection(db, 'tickets', ticketId, 'messages'));
  for (const m of msgsSnap.docs) await deleteDoc(doc(db, 'tickets', ticketId, 'messages', m.id));
  await deleteDoc(doc(db, 'tickets', ticketId));
}

async function autoCleanupFinished(){
  const snaps = await getDocs(collection(db, 'tickets'));
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  let count = 0;
  for (const d of snaps.docs){
    const data = d.data();
    if (data.status === 'Finalizado' && data.finalizedAt){
      let ts = data.finalizedAt;
      let tms = null;
      try{
        if (ts && ts.toMillis) tms = ts.toMillis();
        else tms = new Date(ts).getTime();
      }catch(e){ tms = null; }
      if (tms && (now - tms) > sevenDays){
        await deleteTicketAndStorage(d.id);
        count++;
      }
    }
  }
  if (count) alert(`🧹 ${count} tickets finalizados fueron eliminados (>=7 días).`);
}

btnDeleteAll.onclick = async ()=>{
  if (!confirm('Borrar TODOS los tickets?')) return;
  const snaps = await getDocs(collection(db, 'tickets'));
  for (const d of snaps.docs) await deleteTicketAndStorage(d.id);
  alert('Todos los tickets borrados');
};
