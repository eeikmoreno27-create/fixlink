// scripts/client.js - Cliente FixLink completo
import { db } from '../firebase.js';
import { doc, collection, onSnapshot, query, orderBy, addDoc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';

const ticketId = new URLSearchParams(window.location.search).get('id');
const ticketView = document.getElementById('ticketView');
const chatBox = document.getElementById('chat');
const chatForm = document.getElementById('chatForm');
const senderName = document.getElementById('senderName');
const messageText = document.getElementById('messageText');

if(!ticketId) {
  ticketView.innerHTML='<div class="note">Link inválido</div>';
} else {
  const ticketRef = doc(db,'tickets',ticketId);

  // Mostrar info del ticket
  const showTicket = async () => {
    const snap = await getDoc(ticketRef);
    if(!snap.exists()) {
      ticketView.innerHTML='<div class="note">Ticket no encontrado</div>';
      return;
    }
    const t = snap.data();
    const estado = t.status || 'Sin estado';
    ticketView.innerHTML = `<strong>${t.producto}</strong> - ${t.cliente} - Estado: ${estado}`;
  };

  showTicket();
  onSnapshot(ticketRef, snap=>{ showTicket(); });

  // Chat en tiempo real
  const msgsCol = collection(db,'tickets',ticketId,'messages');
  const q = query(msgsCol, orderBy('createdAt','asc'));

  onSnapshot(q, snap => {
    chatBox.innerHTML = snap.docs.map(d=>{
      const m = d.data();
      const cls = (m.sender.toLowerCase().includes('técn')||m.sender.toLowerCase().includes('tech')) ? 'tech' : 'client';
      return `<div class="chat-msg ${cls}"><strong>${m.sender}:</strong> ${m.text}</div>`;
    }).join('');
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

// Enviar mensaje
chatForm.onsubmit = async e => {
  e.preventDefault();
  const name = senderName.value.trim() || 'Cliente';
  const text = messageText.value.trim();
  if(!text) return;
  await addDoc(collection(db,'tickets',ticketId,'messages'), { sender: name, text, createdAt: serverTimestamp() });
  messageText.value = '';
};
