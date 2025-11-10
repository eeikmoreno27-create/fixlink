import { db, storage, ADMIN_CODE } from '../firebase.js';
import { collection, addDoc, doc, onSnapshot, updateDoc, serverTimestamp, query, orderBy, getDocs, deleteDoc } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';
import { ref as sRef, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js';

const adminCodeInput = document.getElementById('adminCodeInput');
const btnLogin = document.getElementById('btnLogin');
const ticketForm = document.getElementById('ticketForm');
const ticketsList = document.getElementById('ticketsList');

btnLogin.onclick = () => {
  if(adminCodeInput.value.trim() === ADMIN_CODE){
    adminCodeInput.disabled = true;
    btnLogin.disabled = true;
    startListeningTickets();
  } else alert('Código incorrecto');
};

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

  const docRef = await addDoc(collection(db,'tickets'), data);
  const id = docRef.id;

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

  const link = window.location.origin + window.location.pathname.replace('admin.html','client.html') + '?id=' + id;
  navigator.clipboard.writeText(link).catch(()=>{});
  alert('Ticket creado. Link copiado:\n' + link);
  ticketForm.reset();
};

function startListeningTickets(){
  const q = query(collection(db,'tickets'), orderBy('createdAt','desc'));
  onSnapshot(q, snap => {
    ticketsList.innerHTML = '';
    snap.docs.forEach(d=>{
      const t = {id:d.id, ...d.data()};
      const el = document.createElement('div');
      el.innerHTML = `<strong>${t.producto}</strong> - ${t.cliente} - ${t.status} <button onclick="copyLink('${t.id}')">Link</button>`;
      ticketsList.appendChild(el);
    });
  });
}

window.copyLink = (id) => {
  const link = window.location.origin + window.location.pathname.replace('admin.html','client.html') + '?id=' + id;
  navigator.clipboard.writeText(link).catch(()=>{});
  alert('Link copiado:\n' + link);
};
