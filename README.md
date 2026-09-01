# Patico Wrapped 🌻 — Kevin & Wendy

> «“Hay historias que se escriben hablando. La nuestra también florece.”»

**Patico Wrapped** es una experiencia web interactiva, artesanal y emocional, diseñada como un diario compartido para Kevin y Wendy. Inspirada en la estética de *Spotify Wrapped*, la magia de Disney y la calidez de un campo de girasoles nocturno.

---

## ✨ Características Principales

1. **100% Vanilla (HTML5, CSS3, JavaScript)**: Sin frameworks pesados ni dependencias externas obligatorias.
2. **Listo para GitHub Pages**: Compatible con rutas estáticas y navegable mediante *hash routing* (`#portada`, `#historia`, `#noches`, `#elementos`, `#palabras`, `#recuerdos`, `#cine`, `#muro`, `#suenos`, `#final`).
3. **Persistencia Total con LocalStorage**: Recuerdos, biblioteca de cine, muro de notas y frasco de sueños se conservan tras recargas.
4. **Presencia Compartida Verificada**:
   - Selector de perfil: **Kevin** / **Wendy**.
   - **Modo Local** transparente y honesto cuando no hay backend configurado.
   - Conector modular en `js/config.js` y `js/presence.js` listo para Firebase Realtime Database u APIs REST.
5. **Cifras y Estadísticas Rigurosas**:
   - Total mensajes: `25.039`
   - Kevin: `14.239` (56,87 %)
   - Wendy: `10.800` (43,13 %)
   - Formateadas con `Intl.NumberFormat('es-ES')` e `Intl.DateTimeFormat('es-ES')`.
6. **Animaciones y Canvas Cinematográficos**:
   - Fondo de cielo estrellado con partículas doradas.
   - Girasol en floración animada.
   - Fusión de elementos (partículas azul y naranja floreciendo).
   - Lluvia de pétalos de girasol al cumplir un sueño.

---

## 🚀 Despliegue en GitHub Pages

1. Sube este repositorio a tu cuenta de GitHub.
2. En GitHub, ve a **Settings** > **Pages**.
3. En **Branch**, selecciona `main` (o `master`) y carpeta `/ (root)`.
4. Haz clic en **Save**. ¡Tu diario estará en línea en segundos!

---

## 🛠️ Configuración de Presencia Compartida en Tiempo Real

Para sincronizar la presencia entre diferentes dispositivos en tiempo real:

1. Abre el archivo `js/config.js`.
2. Cambia `presence.provider` a `'firebase'`.
3. Añade tus credenciales en `presence.firebaseConfig`:
   ```javascript
   presence: {
     provider: 'firebase',
     roomId: 'kevin-wendy-room',
     heartbeatIntervalMs: 15000,
     presenceTimeoutMs: 60000,
     firebaseConfig: {
       apiKey: "TU_API_KEY",
       databaseURL: "https://tu-proyecto.firebaseio.com",
       projectId: "tu-proyecto"
     }
   }
   ```