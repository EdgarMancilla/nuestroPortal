import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.sidebar li');
    const pages = document.querySelectorAll('.page');

    const toggleBtn = document.getElementById('toggle-btn');
    const sidebar = document.getElementById('sidebar');

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // Dentro de tu evento 'DOMContentLoaded'

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // 1. Ocultar todas las páginas
            pages.forEach(page => page.style.display = 'none');

            // 2. Mostrar la página cuyo ID coincide con el data-target del botón
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).style.display = 'block';
        });
    });

    // --- LÓGICA DE SUBIDA DE FOTOS (Método Base64) ---
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    const photoGrid = document.getElementById('photo-grid');

    // 1. Al hacer clic, abrimos el selector de archivos
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // 2. Al seleccionar la foto, la convertimos y la guardamos
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = async () => {
                // Crear un canvas para redimensionar
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; // Ancho máximo
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Convertir a base64 con calidad reducida (0.7 = 70%)
                const base64Image = canvas.toDataURL('image/jpeg', 0.7);

                try {
                    await addDoc(collection(window.db, "galeria"), {
                        imagen: base64Image,
                        fecha: new Date()
                    });
                    alert("¡Foto subida con éxito! 😘");
                } catch (e) {
                    console.error("Error al guardar: ", e);
                    alert("La foto es muy pesada, dile a Edgar para que la comprima 😁.");
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    // 3. Escuchar la galería en tiempo real para mostrar las fotos
    const qGaleria = query(collection(window.db, "galeria"), orderBy("fecha", "desc"));

    onSnapshot(qGaleria, (snapshot) => {
        photoGrid.innerHTML = ""; // Limpiar grid antes de dibujar
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const div = document.createElement('div');
            div.className = 'photo-item';
            // Insertamos la imagen usando el código Base64
            div.innerHTML = `<img src="${data.imagen}" style="width: 100%; border-radius: 10px; margin-bottom: 10px;">`;
            photoGrid.appendChild(div);
        });
    });
    // --- LÓGICA PARA PLANES (Cosas por hacer) ---
    const planInput = document.getElementById('plan-input');
    const addPlanBtn = document.getElementById('add-plan-btn');
    const planList = document.getElementById('plan-list');

    // 1. Guardar nuevo plan en Firestore
    addPlanBtn.addEventListener('click', async () => {
        const text = planInput.value;
        if (text === "") return;

        try {
            await addDoc(collection(window.db, "planes"), {
                texto: text,
                completado: false, // Valor inicial
                fecha: new Date()
            });
            planInput.value = "";
        } catch (e) {
            console.error("Error al guardar plan: ", e);
        }
    });

    // 2. Escuchar los planes en tiempo real
    const qPlanes = query(collection(window.db, "planes"), orderBy("fecha", "asc"));

    onSnapshot(qPlanes, (snapshot) => {
        planList.innerHTML = ""; // Limpiar lista antes de redibujar

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;

            const li = document.createElement('li');
            li.className = 'todo-item' + (data.completado ? ' completed' : '');
            li.innerHTML = `<span>${data.texto}</span> <button>✕</button>`;

            // Evento para marcar como completado (puedes expandirlo después)
            li.addEventListener('click', () => {
                li.classList.toggle('completed');
            });

            // Evento para eliminar
            li.querySelector('button').addEventListener('click', async (e) => {
                e.stopPropagation(); // Evita que se dispare el evento del 'li' al borrar
                try {
                    // Borramos el documento de la base de datos usando su ID
                    await deleteDoc(doc(window.db, "planes", id));
                } catch (e) {
                    console.error("Error al borrar: ", e);
                }
            });

            planList.appendChild(li);
        });
    });

    // --- LÓGICA PARA NOTAS ---
    const noteText = document.getElementById('note-text');
    const addNoteBtn = document.getElementById('add-note-btn');
    const notesGrid = document.getElementById('notes-grid');

    // 1. ESTO LO DEJAS: Es lo que envía la nota a Firebase
    addNoteBtn.addEventListener('click', async () => {
        const text = noteText.value;
        if (text === "") return;

        try {
            await addDoc(collection(window.db, "notas"), {
                contenido: text,
                fecha: new Date()
            });
            noteText.value = "";
            // Opcional: Quita el alert si quieres que sea más rápido
        } catch (e) {
            console.error("Error al guardar: ", e);
        }
    });

    // 2. ESTO LO AGREGAS: Es lo que escucha a Firebase y pinta las notas automáticamente
    // Asegúrate de importar 'onSnapshot', 'query', y 'orderBy' al inicio de tu archivo
    const q = query(collection(window.db, "notas"), orderBy("fecha", "desc"));

    onSnapshot(q, (snapshot) => {
        notesGrid.innerHTML = ""; // Limpiar el muro para no duplicar
        snapshot.forEach((doc) => {
            const data = doc.data();
            const note = document.createElement('div');
            note.className = 'note-card';
            note.innerHTML = `<p>${data.contenido}</p>`;
            notesGrid.appendChild(note);
        });
    });
});

