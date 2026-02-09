import confetti from "https://cdn.skypack.dev/canvas-confetti";

document.addEventListener('DOMContentLoaded', () => {
    const dateAujourdhui = new Date();
    let vueMois = dateAujourdhui.getMonth();
    let vueAnnee = dateAujourdhui.getFullYear();
    let jourEnModification = null; 
    let mesObjectifs = JSON.parse(localStorage.getItem('mesObjectifs')) || [];
    let mesCauses = JSON.parse(localStorage.getItem('mesCauses')) || ["🏢 Travail", "❤️ Amour", "🥗 Santé", "🎮 Loisirs"];
    let humeurDuJour = "";
    let causeChoisie = "";

    const obtenirIdMois = (m, a) => `histo-${a}-${m}`;

    // --- GESTION MODE SOMBRE ---
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) { document.body.classList.add('dark-mode'); darkModeToggle.checked = true; }
    darkModeToggle.onchange = () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', darkModeToggle.checked);
    };

    // --- SPLASH SCREEN ---
    const splash = document.getElementById('splash-screen-koach');
    const splashText = document.querySelector('.carte-accueil');
    const h = dateAujourdhui.getHours();
    splashText.innerText = (h >= 5 && h < 12) ? "Bien dormi ? 🐨" : (h >= 12 && h < 18) ? "Bon après-midi ! ✨" : "Prends une minute pour souffler... 🌙";
    setTimeout(() => splashText.classList.add('reveal-text'), 500);
    setTimeout(() => { splash.style.opacity = '0'; setTimeout(() => splash.style.display = 'none', 800); }, 2200);

    // --- NAVIGATION ---
    window.switchMainTab = function(target, element) {
        document.querySelectorAll('.tab-content').forEach(s => s.classList.add('cache'));
        document.getElementById('section-' + target).classList.remove('cache');
        document.querySelectorAll('.tab-item').forEach(item => item.classList.remove('active'));
        element.classList.add('active');
        if (target === 'goals') afficherObjectifs();
    };

    // --- LOGIQUE HUMEUR ---
    window.choisirHumeur = function(h) {
        humeurDuJour = h;
        confetti({ particleCount: 30, colors: h === 'content' ? ['#A8E6CF'] : ['#FF8B94'], origin: { y: 0.7 } });
        document.querySelectorAll('.ecran-accueil').forEach(e => e.classList.add('cache'));
        document.getElementById('ecran-raisons').classList.remove('cache');
        chargerCauses();
    };

    function chargerCauses() {
        const cont = document.getElementById('container-raisons');
        cont.innerHTML = "";
        mesCauses.forEach((r, index) => {
            const div = document.createElement('div');
            div.style.display = "flex"; div.style.gap = "8px"; div.style.marginBottom = "8px";
            div.innerHTML = `<button class="btn-raison" style="flex:1; padding:16px; border:none; border-radius:15px; background:var(--card-bg); text-align:left; color:inherit; font-weight:600;">${r}</button>
                             <button class="btn-suppr" style="background:var(--card-bg); border:none; border-radius:15px; padding:0 12px; color:var(--rouge);">×</button>`;
            div.querySelector('.btn-raison').onclick = () => { causeChoisie = r; document.getElementById('modal-note').classList.remove('cache'); };
            div.querySelector('.btn-suppr').onclick = () => { mesCauses.splice(index, 1); localStorage.setItem('mesCauses', JSON.stringify(mesCauses)); chargerCauses(); };
            cont.appendChild(div);
        });
    }

    document.getElementById('btn-valider-note').onclick = () => {
        const note = document.getElementById('input-note').value;
        const jS = jourEnModification || dateAujourdhui.getDate();
        const mS = (jourEnModification !== null) ? vueMois : dateAujourdhui.getMonth();
        const aS = (jourEnModification !== null) ? vueAnnee : dateAujourdhui.getFullYear();
        const histo = JSON.parse(localStorage.getItem(obtenirIdMois(mS, aS))) || {};
        histo[jS] = { humeur: humeurDuJour, raison: causeChoisie, note: note };
        localStorage.setItem(obtenirIdMois(mS, aS), JSON.stringify(histo));
        document.getElementById('modal-note').classList.add('cache');
        confetti({ particleCount: 150, spread: 70, colors: humeurDuJour === 'content' ? ['#A8E6CF'] : ['#FF8B94'] });
        jourEnModification = null;
        afficherFinal();
    };

    function afficherFinal() {
        document.querySelectorAll('.ecran-accueil').forEach(e => e.classList.add('cache'));
        document.getElementById('ecran-confirmation').classList.remove('cache');
        const nomMoisClair = new Date(vueAnnee, vueMois).toLocaleDateString('fr-FR', {month:'long', year:'numeric'});
        document.getElementById('nom-du-mois').innerText = nomMoisClair;
        dessinerGrille();
        calculerStats();
    }

    function dessinerGrille() {
        const grille = document.getElementById('grille-pixels');
        grille.innerHTML = "";
        const histo = JSON.parse(localStorage.getItem(obtenirIdMois(vueMois, vueAnnee))) || {};
        const nbJours = new Date(vueAnnee, vueMois + 1, 0).getDate();
        for(let i=1; i<=nbJours; i++) {
            const p = document.createElement('div');
            p.className = "pixel " + (histo[i] ? (histo[i].humeur === 'content' ? 'vert' : 'rouge') : '');
            p.innerText = i;
            if(histo[i]) {
                p.onclick = () => {
                    document.getElementById('modal-emoji').innerText = histo[i].humeur === 'content' ? '😊' : '😕';
                    document.getElementById('modal-date').innerText = i + " " + new Date(vueAnnee, vueMois).toLocaleDateString('fr-FR', {month:'long'});
                    document.getElementById('modal-raison').innerHTML = `<strong>${histo[i].raison}</strong>` + (histo[i].note ? `<br>"${histo[i].note}"` : "");
                    document.getElementById('modal-detail').classList.remove('cache');
                };
            }
            grille.appendChild(p);
        }
    }

    function calculerStats() {
        const histo = JSON.parse(localStorage.getItem(obtenirIdMois(vueMois, vueAnnee))) || {};
        const jours = Object.values(histo);
        // Streak simplified
        document.getElementById('streak-count').innerText = jours.length + " jours";
        if(jours.length > 0) {
            const contents = jours.filter(j => j.humeur === 'content').length;
            const pourcentage = Math.round((contents / jours.length) * 100);
            document.getElementById('score-bonheur').innerText = pourcentage + "%";
            document.getElementById('bar-vert').style.width = pourcentage + "%";
            document.getElementById('bar-rouge').style.width = (100 - pourcentage) + "%";
        }
    }

    // --- MISSIONS ---
    window.ajouterObjectif = function(type) {
        const inputId = type === 'daily' ? 'input-daily-goal' : 'input-long-goal';
        const text = document.getElementById(inputId).value;
        if (!text.trim()) return;
        mesObjectifs.push({ id: Date.now(), type, texte: text, statut: 'en-cours' });
        localStorage.setItem('mesObjectifs', JSON.stringify(mesObjectifs));
        document.getElementById(inputId).value = "";
        afficherObjectifs();
    };

    function afficherObjectifs() {
        const contDaily = document.getElementById('liste-goals-du-jour');
        const contLong = document.getElementById('liste-goals-long');
        contDaily.innerHTML = ""; contLong.innerHTML = "";
        mesObjectifs.forEach(obj => {
            const html = `<div class="goal-item"><span>${obj.texte}</span></div>`;
            if (obj.type === 'daily') contDaily.insertAdjacentHTML('beforeend', html);
            else contLong.insertAdjacentHTML('beforeend', html);
        });
    }

    // Initialisation
    const idInit = obtenirIdMois(dateAujourdhui.getMonth(), dateAujourdhui.getFullYear());
    if(JSON.parse(localStorage.getItem(idInit))?.[dateAujourdhui.getDate()]) afficherFinal();
    
    // Fermeture modales
    document.getElementById('modal-close-btn').onclick = () => document.getElementById('modal-detail').classList.add('cache');
    document.getElementById('btn-retour-choix').onclick = () => { document.getElementById('ecran-raisons').classList.add('cache'); document.getElementById('ecran-choix').classList.remove('cache'); };
});
