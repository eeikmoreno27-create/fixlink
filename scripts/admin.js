// scripts/admin.js - admin con tickets y chat en tiempo real
import { db, storage } from '../firebase.js';
import { 
  collection, doc, setDoc, updateDoc, onSnapshot, query, orderBy, getDoc, getDocs, deleteDoc, addDoc, serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';
import { ref as sRef, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js';
import { ADMIN_CODE } from '../firebase.js';

const adminCodeInput = document.getElementById('adminCodeInput');
const btnLogin = document.getElementById('btnLogin');
const ticketForm = document.getElementById('ticketForm');
const ticketsList = document.getElementById('ticketsList');
const detailArea = document.getElementById('detailArea');
const btnDeleteAll = document.getElementById('btnDeleteAll');

let ticketsUnsub = null;
let messagesUnsub = null;

btnLogin.onclick = () => {
  if(adminCodeInput.value.trim()===ADMIN_CODE){
    adminCodeInput.disabled = true;
    btnLogin.disabled = true;
    startListeningTickets();
  } else alert('Código incorrecto');
};

ticketForm.onsubmit = async e => {
  e.preventDefault();
  if(!adminCodeInput.disabled) return alert('Acceso denegado');

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

  const docRef = doc(collection(db,'tickets'));
  await setDoc(docRef, data);

  // Subir imágenes
  const files = Array.from(document.getElementById('images').files).slice(0,6);
  const uploaded = [];
  for(const f of files){
    const path = `tickets/${docRef.id}/${Date.now()}_${f.name}`;
    const sRefFile = sRef(storage, path);
    await uploadBytes(sRefFile, f);
    const url = await getDownloadURL(sRefFile);
    uploaded.push({url,path});
  }
  if(uploaded.length) await updateDoc(docRef, { images: uploaded });

  const link = window.location.origin + window.location.pathname.replace('admin.html','client.html') + '?id=' + docRef.id;
  navigator.clipboard?.writeText(link);
  alert('Ticket creado. Link copiado:\n'+link);
  ticketForm.reset();
};

// Escuchar tickets
function startListeningTickets(){
  const q = query(collection(db,'tickets'), orderBy('createdAt','desc'));
  ticketsUnsub = onSnapshot(q, snap=>{
    ticketsList.innerHTML = '';
    snap.docs.forEach(d=>{
      const t = {id:d.id,...d.data()};
      const el = document.createElement('div');
      el.className='tickets-item';
      const img = t.images?.[0]?.url ? `<img src="${t.images[0].url}" style="width:72px;height:72px;">` : 'No img';
      el.innerHTML = `<div><strong>${t.producto}</strong> - ${t.cliente} - ${t.status}</div>
                      <button data-id="${t.id}" class="btn-open">Abrir</button>`;
      ticketsList.appendChild(el);
    });

    ticketsList.querySelectorAll('.btn-open').forEach(b=>{
      b.onclick=()=>openDetail(b.dataset.id);
    });
  });
}

// Abrir detalle ticket
async function openDetail(ticketId){
  const docRef = doc(db,'tickets',ticketId);
  onSnapshot(docRef, snap=>{
    if(!snap.exists()){ detailArea.innerHTML='Ticket no encontrado'; return; }
    const t = {id:snap.id,...snap.data()};
    renderDetail(t);
  });

  // Chat admin
  if(messagesUnsub) messagesUnsub();
  const msgsCol = collection(db,'tickets',ticketId,'messages');
  const q = query(msgsCol,orderBy('createdAt','asc'));
  messagesUnsub = onSnapshot(q=>{
    const msgs = q.docs.map(d=>({id:d.id,...d.data()}));
    renderMessages(msgs);
  });
}

function renderDetail(t){
  const imgs = t.images?.map(i=>`<img src="${i.url}" style="width:100px;margin-right:5px">`).join('')||'';
  detailArea.innerHTML = `
    <div><strong>${t.producto}</strong></div>
    <div>${t.cliente}</div>
    <div>${imgs}</div>
    <select id="detailStatus">
      <option ${t.status==='En espera'?'selected':''}>En espera</option>
      <option ${t.status==='En revisión'?'selected':''}>En revisión</option>
      <option ${t.status==='Detenido'?'selected':''}>Detenido</option>
      <option ${t.status==='Finalizado'?'selected':''}>Finalizado</option>
      <option ${t.status==='Listo para recoger'?'selected':''}>Listo para recoger</option>
    </select>
    <input id="detailMotivo" value="${t.motivo||''}" placeholder="Motivo"/>
    <button id="btnSaveDetail">Guardar</button>
    <div><strong>Chat</strong><div id="messagesArea"></div>
      <input id="techMessage" placeholder="Escribe mensaje"/>
      <button id="btnSendTech">Enviar</button>
    </div>
  `;

  document.getElementById('btnSaveDetail').onclick=async()=>{
    const status=document.getElementById('detailStatus').value;
    const motivo=document.getElementById('detailMotivo').value.trim();
    await updateDoc(doc(db,'tickets',t.id),{status,motivo,finalizedAt: status==='Finalizado'?serverTimestamp():t.finalizedAt});
    alert('Guardado');
  };

  document.getElementById('btnSendTech').onclick=async()=>{
    const text=document.getElementById('techMessage').value.trim();
    if(!text)return;
    await addDoc(collection(db,'tickets',t.id,'messages'),{sender:'Técnico',text,createdAt:new Date()});
    document.getElementById('techMessage').value='';
  };
}

// Renderizar mensajes en admin
function renderMessages(msgs){
  const area=document.getElementById('messagesArea');
  if(!area) return;
  area.innerHTML = msgs.map(m=>`<div><strong>${m.sender}:</strong> ${m.text}</div>`).join('');
}
