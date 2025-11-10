FixLink - Paquete Profesional (lista para GitHub Pages)

Contenido:
- index.html (redirige a admin.html)
- admin.html (panel técnico)
- client.html (vista del cliente)
- style.css (diseño oscuro, responsive)
- firebase.js (config con Firestore + Storage)  <-- revisa ADMIN_CODE si quieres cambiarlo
- scripts/admin.js  (panel técnico: crear, upload a Storage, chat, limpieza 7 días)
- scripts/client.js (vista cliente: ver ticket y chat)
- assets/ (carpeta para logos o archivos adicionales)

Pasos para publicar:
1) Descomprime esta carpeta y sube todos los archivos a la raíz de tu repo en GitHub.
2) En Firebase Console asegúrate de tener Firestore y Storage habilitados.
3) En Firebase Console > Firestore, crea la colección 'tickets' (no es obligatorio crear docs manualmente).
4) En Firebase Console > Storage, configura reglas (modo prueba para pruebas).
5) En GitHub: Settings -> Pages -> Branch: main, Folder: / (root) -> Save.
6) Abre https://TUUSUARIO.github.io/TU_REPO/admin.html, introduce ADMIN_CODE ('erik2025') y prueba crear tickets.

Notas de seguridad:
- Actualmente el código usa modo prueba para Firestore/Storage. No dejar en modo prueba indefinidamente en producción.
- Cambia ADMIN_CODE en firebase.js por una contraseña segura antes de subir.
- La limpieza automática se ejecuta al iniciar sesión en el panel técnico y elimina tickets Finalizado con más de 7 días (incluye borrado de imágenes del Storage).

