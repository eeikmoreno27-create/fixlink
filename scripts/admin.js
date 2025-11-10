// scripts/admin.js - Panel técnico FixLink completo
import { db, storage, ADMIN_CODE } from '../firebase.js';
import {
  collection, addDoc, doc, onSnapshot, updateDoc, serverTimestamp,
  query, orderBy, getDocs, deleteDoc
} from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';
import { ref as sRef, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js';

const adminCodeInput = document.getElementById('adminCodeInput');
const btnLogin = document.getElementById('btnLogin');
const ticketForm = document.getElementById('ticketForm');
const ticketsList = document.getElementById('ticketsList');
const detailArea = document.getElementById('detailArea');
const filterStatus = document.getElementById('filterStatus');
const btnDeleteAll = document.getElementById('btnDeleteAll');
const btnClear = document.getElementById('btnClear');

let ticketsUnsub = null;
let messagesUnsub = null;

// Login técnico
btnLogin.onclick = () => {
  if(adminCodeInput.value.trim() === ADMIN_CODE){
    adminCodeInput.disabled = true;
    btnLogin.disabled = true;
    startListeningTickets();
    autoCleanupFinished();
  } else alert('Código incorrecto');
};

// Limpiar formulario
btnClear.onclick = () => ticketForm.reset();

// Escapar HTML
function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }

// Crear ticket
ticketForm.onsubmit = async e => {
  e.preventDefault();
  if(adminCodeInput.disabled !== true) return alert('Acceso denegado');

  const data = {
    categoria: document.getElementById('categoria').value.trim(),
    cliente: document.getElementById('cliente').value.trim(),
    producto: document.getElementById('producto').value.trim(),
    marca: document.getElementById('marca').value.trim(),
    serie: document.getElementById('serie').value.trim(),
    observaciones: document.getElementById('observaciones').value.trim(),
    precio: document.getElementById('precio').value.trim(),
    prioridad: document.getElementById('prioridad').value,
    status: document.getElementById('status').value,
    motivo: document.getElementById('motivo').value.trim(),
    images: [],
    createdAt: serverTimestamp()
  };

  // Guardar ticket
  const docRef = await addDoc(collection(db,'tickets'), data);
  const id = docRef.id;

  // Subir imágenes si hay
  const files = Array.from(document.getElementById('images').files).slice(0,6);
  const uploaded = [];
  for(const f of files){
    const path = `tickets/${id}/${Date.now()}_${f.name}`;
    const sRefPath = sRef(storage, path);
    await uploadBytes(sRefPath, f);
    const url = await getDownloadURL(sRefPath);
    uploaded.push({url, path});
  }
  if(uploaded.length) await updateDoc(doc(db,'tickets',id), { images: uploaded });

  // Copiar link cliente
  const link = window.location.origin + window.location.pathname.replace('admin.html','client.html') + '?id=' + id;
  navigator.clipboard.writeText(link).catch(()=>{});
  alert('Ticket creado. Link copiado:\n' + link);
  ticketForm.reset();
};

// Render tickets
function renderTickets(docs){
  ticketsList.innerHTML = '';
  if(!docs || docs.length === 0){ ticketsList.innerHTML='<div class="note">No hay tickets</div>'; return; }
  
  docs.forEach(d=>{
    const t = {id:d.id, ...d.data()};
    if(filterStatus.value !== 'all' && t.status !== filterStatus.value) return;
    const el = document.createElement('div'); 
    el.className = 'tickets-item';
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

  ticketsList.querySelectorAll('.btn-copy').forEach(b=>{ b.onclick=()=>{ const id=b.dataset.id; const link=window.location.origin+window.location.pathname.replace('admin.html','client.html')+'?id='+id; navigator.clipboard.writeText(link); alert('Link copiado:\n'+link); }; });
  ticketsList.querySelectorAll('.btn-open').forEach(b=>{ b.onclick=()=>openDetail(b.dataset.id); });
  ticketsList.querySelectorAll('.btn-delete').forEach(b=>{ b.onclick=async()=>{ if(!confirm('Eliminar ticket?')) return; await deleteTicketAndStorage(b.dataset.id); alert('Ticket eliminado'); }; });
}

// Escuchar tickets en tiempo real
function startListeningTickets(){
  const q = query(collection(db,'tickets'), orderBy('createdAt','desc'));
  ticketsUnsub = onSnapshot(q, snap=>{ renderTickets(snap.docs); });
}

// Abrir detalle y chat
async function openDetail(ticketId){
  const docRef = doc(db,'tickets',ticketId);
  const docSnap = await getDoc(docRef);
  if(!docSnap.exists()){ detailArea.innerHTML='Ticket no encontrado'; return; }
  const t = {id:docSnap.id, ...docSnap.data()};
  renderDetail(t);

  // escuchar mensajes
  if(messagesUnsub) messagesUnsub();
  const msgsCol = collection(db,'tickets',ticketId,'messages');
  const q = query(msgsCol, orderBy('createdAt','asc'));
  messagesUnsub = onSnapshot(q, snap=>{
    const msgs = snap.docs.map(d=>({id:d.id,...d.data()}));
    renderMessages(msgs);
  });
}

// Render detalle
function renderDetail(t){
  const imgs = (t.images||[]).map(s=>`<img src="${s.url}" style="width:100%;max-width:180px;border-radius:8px;margin-right:6px">`).join('');
  detailArea.innerHTML = `
    <div><strong>${escapeHtml(t.producto)}</strong></div>
    <div class="meta">${escapeHtml(t.cliente)}</div>
    <div class="note">${escapeHtml(t.observaciones||'')}</div>
    <div style="margin-top:8px">${imgs}</div>
    <div style="margin-top:8px">Estado:
      <select id="detailStatus">
        <option>En espera</option>
        <option>En revisión</option>
        <option>Detenido</option>
        <option>Finalizado</option>
        <option>Listo para recoger</option>
      </select>
    </div>
    <div style="margin-top:8px">
      <input id="detailMotivo" placeholder="Motivo de detención (breve)" value="${escapeHtml(t.motivo||'')}" />
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

  // Guardar cambios
  document.getElementById('btnSaveDetail').onclick = async ()=>{
    const newStatus = document.getElementById('detailStatus').value;
    const newMotivo = document.getElementById('detailMotivo').value.trim();
    const update = { status:newStatus, motivo:newMotivo };
    if(newStatus==='Finalizado') update.finalizedAt = serverTimestamp();
    await updateDoc(doc(db,'tickets',t.id),update);
    alert('Guardado');
  };

  // Copiar link
  document.getElementById('btnCopyLink').onclick = ()=>{
    const link=window.location.origin+window.location.pathname.replace('admin.html','client.html')+'?id='+t.id;
    navigator.clipboard.writeText(link); alert('Link copiado:\n'+link);
  };

  // Enviar mensaje técnico
  document.getElementById('btnSendTech').onclick = async ()=>{
    const text=document.getElementById('techMessage').value.trim();
    if(!text) return;
    await addDoc(collection(db,'tickets',t.id,'messages'),{sender:'Técnico',text,createdAt:serverTimestamp()});
    document.getElementById('techMessage').value='';
  };
}

// Render mensajes
function renderMessages(msgs){
  const area=document.getElementById('messagesArea');
  if(!area) return;
  area.innerHTML = msgs.map(m=>`<div class="chat-msg ${m.sender.toLowerCase().includes('técn')||m.sender.toLowerCase().includes('tech')?'tech':'client'}"><strong>${escapeHtml(m.sender)}:</strong> ${escapeHtml(m.text)}</div>`).join('');
  area.scrollTop = area.scrollHeight;
}

// Borrar ticket e imágenes
async function deleteTicketAndStorage(ticketId){
  const docRef = doc(db,'tickets',ticketId);
  const snap = await getDoc(docRef);
  if(!snap.exists()) return;
  const data = snap.data();
  const imgs = data.images||[];
  for(const im of imgs){ try{ await deleteObject(sRef(storage,im.path)); }catch(e){console.warn(e);} }
  const msgsSnap = await getDocs(collection(db,'tickets',ticketId,'messages'));
  for(const m of msgsSnap.docs) await deleteDoc(doc(db,'tickets',ticketId,'messages',m.id));
  await deleteDoc(doc(db,'tickets',ticketId));
}

// Auto limpieza tickets finalizados >7 días
async function autoCleanupFinished(){
  const snaps = await getDocs(collection(db,'tickets'));
  const now = Date.now();
  const sevenDays = 7*24*60*60*1000;
  for(const d of snaps.docs){
    const data=d.data();
    if(data.status==='Finalizado' && data.finalizedAt){
      let tms = data.finalizedAt?.toMillis ? data.finalizedAt.toMillis() : new Date(data.finalizedAt).getTime();
      if(tms && now-tms>sevenDays) await deleteTicketAndStorage(d.id);
    }
  }
}

// Borrar todos los tickets
btnDeleteAll.onclick = async ()=>{
  if(!confirm('Borrar TODOS los tickets?')) return;
  const snaps = await getDocs(collection(db,'tickets'));
  for(const d of snaps.docs) await deleteTicketAndStorage(d.id);
  alert('Todos los tickets borrados');
};
