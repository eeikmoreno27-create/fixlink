// scripts/client.js - Vista cliente FixLink funcional
import { db } from '../firebase.js';
import { doc, onSnapshot, collection, addDoc, query, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';

// Funciones auxiliares
function qs(name){ return new URLSearchParams(window.location.search).get(name); }
function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }

const ticketId = qs('id');
const ticketView = document.getElementById('ticketView');
const chatBox = document.getElementById('chat');
const chatForm = document.getElementById('chatForm');
const senderName = document.getElementById('senderName');
const messageText = document.getElementById('messageText');

if(!ticketId){
  ticketView.innerHTML='<div class="note">Link inválido. Falta id.</div>';
} else {
  const ticketRef = doc(db,'tickets',ticketId);

  // Escuchar ticket en tiempo real
  onSnapshot(ticketRef, snap=>{
    if(!snap.exists()){ ticketView.innerHTML='<div class="note">Ticket no encontrado</div>'; return; }
    renderTicket({id:snap.id, ...snap.data()});
  });

  // Escuchar chat en tiempo real
  const msgsCol = collection(db,'tickets',ticketId,'messages');
  const q = query(msgsCol, orderBy('createdAt','asc'));
  onSnapshot(q, snap=>{
    const msgs = snap.docs.map(d=>({id:d.id,...d.data()}));
    renderMessages(msgs);
  });
}

// Renderizar información del ticket
function renderTicket(t){
  const imgs = (t.images||[]).map(i=>`<img src="${i.url}" style="width:100%;max-width:180px;margin-right:6px;border-radius:8px">`).join('');
  ticketView.innerHTML=`
    <div><strong>${escapeHtml(t.producto)}</strong></div>
    <div class="meta">${escapeHtml(t.cliente)}</div>
    <div class="note">${escapeHtml(t.observaciones||'')}</div>
    <div style="margin-top:8px">${imgs}</div>
    <div style="margin-top:8px"><strong>Estado:</strong> ${escapeHtml(t.status||'')}</div>
    <div style="margin-top:6px;color:#b45309"><strong>Motivo:</strong> ${escapeHtml(t.motivo||'-')}</div>
  `;
}

// Renderizar mensajes del chat
function renderMessages(msgs){
  if(!chatBox) return;
  chatBox.innerHTML = msgs.map(m=>{
    const isTech = m.sender && (m.sender.toLowerCase().includes('técn') || m.sender.toLowerCase().includes('tech') || m.sender==='Técnico');
    const cls = isTech ? 'chat-msg tech' : 'chat-msg client';
    return `<div class="${cls}"><strong>${escapeHtml(m.sender)}:</strong> ${escapeHtml(m.text)}</div>`;
  }).join('');
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Enviar mensaje
chatForm.onsubmit = async e => {
  e.preventDefault();
  if(!ticketId) return alert('Link inválido');

  const name = senderName.value.trim() || 'Cliente';
  const text = messageText.value.trim();
  if(!text) return;

  await addDoc(collection(db,'tickets',ticketId,'messages'), {
    sender: name,
    text,
    createdAt: serverTimestamp()
  });

  messageText.value='';
};
