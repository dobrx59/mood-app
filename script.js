import confetti from "https://cdn.skypack.dev/canvas-confetti";

document.addEventListener('DOMContentLoaded', () => {
    const date = new Date();
    const idMois = `${date.getFullYear()}-${date.getMonth()}`;
    let humeurDuJour = "";
    let causeChoisie = ""; 
    let mesCauses = JSON.parse(localStorage.getItem('mesCauses')) || ["🏢 Travail", "❤️ Amour", "🥗 Santé", "🎮 Loisirs"];

    // Splash Screen Koach
    const splash = document.getElementById('splash-screen-koach');
    const splashText = document.querySelector('.carte-accueil');
    const h = date.getHours();
    splashText.innerText = (h >= 5 && h < 12) ? "Bien dormi ? 🐨" : (h >= 12 && h < 18) ? "Bon après-midi ! ✨" : "Prends une minute pour souffler... 🌙";
    
    setTimeout(() => splashText.classList.add('reveal-text'), 500);
    setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => splash.style.display = 'none', 800);
    }, 2200);

    function naviguer(id) {
        document.querySelectorAll('.ecran-accueil').forEach(e => e.classList.add('cache'));
        document.getElementById(id).classList.remove('cache');
    }

    window.choisirHumeur = function(h) {
        humeurDuJour = h;
        confetti({ particleCount: 30, colors: h === 'content' ? ['#A8E6CF'] : ['#FF8B94'], origin: { y: 0.7 } });
        naviguer('ecran-raisons');
        chargerCauses();
    }

    function chargerCauses() {
        const cont = document.getElementById('container-raisons');
        cont.innerHTML = "";
        mesCauses.forEach((r, index) => {
            const div = document.createElement('div');
            div.style.display = "flex"; div.style.gap = "8px";
            div.innerHTML = `<button class="btn-raison">${r}</button><button class="btn-suppr">×</button>`;
            div.querySelector('.btn-raison').onclick = () => { causeChoisie = r; document.getElementById('modal-note').classList.remove('cache'); };
            div.querySelector('.btn-suppr').onclick = () => { mesCauses.splice(index, 1); localStorage.setItem('mesCauses', JSON.stringify(mesCauses)); chargerCauses(); };
            cont.appendChild(div);
        });
    }

    document.getElementById('btn-valider-note').onclick = () => {
        const note = document.getElementById('input-note').value;
        const histo = JSON.parse(localStorage.getItem(`histo-${idMois}`)) || {};
        histo[date.getDate()] = { humeur: humeurDuJour, raison: causeChoisie, note: note };
        localStorage.setItem(`histo-${idMois}`, JSON.stringify(histo));
        document.getElementById('modal-note').classList.add('cache');
        confetti({ particleCount: 150, spread: 70, colors: humeurDuJour === 'content' ? ['#A8E6CF'] : ['#FF8B94'] });
        afficherFinal();
    };

    function afficherFinal() {
        naviguer('ecran-confirmation');
        document.getElementById('nom-du-mois').innerText = date.toLocaleDateString('fr-FR', {month:'long'});
        dessinerGrille(); 
        calculerStats();
        switchTab('grille');
    }

    function dessinerGrille() {
        const grille = document.getElementById('grille-pixels');
        grille.innerHTML = "";
        const histo = JSON.parse(localStorage.getItem(`histo-${idMois}`)) || {};
        const nbJours = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        for(let i=1; i<=nbJours; i++) {
            const p = document.createElement('div');
            p.className = "pixel " + (histo[i] ? (histo[i].humeur === 'content' ? 'vert' : 'rouge') : '');
            p.innerText = i;
            if(histo[i]) {
                p.onclick = () => {
                    document.getElementById('modal-emoji').innerText = histo[i].humeur === 'content' ? '😊' : '😕';
                    document.getElementById('modal-date').innerText = "Le " + i;
                    document.getElementById('modal-raison').innerHTML = `<strong>${histo[i].raison}</strong>` + (histo[i].note ? `<br>"${histo[i].note}"` : "");
                    document.getElementById('modal-detail').classList.remove('cache');
                };
            }
            grille.appendChild(p);
        }
    }

    function calculerStats() {
        const histo = JSON.parse(localStorage.getItem(`histo-${idMois}`)) || {};
        const jours = Object.values(histo);
        
        let streak = 0, jourCheck = new Date(); 
        if (!histo[jourCheck.getDate()]) jourCheck.setDate(jourCheck.getDate() - 1);
        while (histo[jourCheck.getDate()]) { streak++; jourCheck.setDate(jourCheck.getDate() - 1); if (jourCheck.getMonth() !== date.getMonth()) break; }
        document.getElementById('streak-count').innerText = streak + " jour(s)";

        const container = document.getElementById('mood-trend-container');
        container.innerHTML = "";
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(date.getDate() - i);
            const dataJ = histo[d.getDate()];
            const barre = document.createElement('div');
            barre.className = "barre-trend";
            barre.style.height = !dataJ ? "8px" : (dataJ.humeur === 'content' ? "100%" : "40%");
            barre.style.background = !dataJ ? "#eee" : (dataJ.humeur === 'content' ? "#A8E6CF" : "#FF8B94");
            container.appendChild(barre);
        }

        if(jours.length > 0) {
            const positifs = jours.filter(j => j.humeur === 'content').length;
            document.getElementById('score-bonheur').innerText = Math.round((positifs/jours.length)*100) + "% positif";
            const counts = {};
            jours.forEach(j => counts[j.raison] = (counts[j.raison] || 0) + 1);
            const top = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
            document.getElementById('cause-majeure').innerText = "Source majeure : " + top;
        }
    }

    function switchTab(tab) {
        const isGrille = tab === 'grille';
        const histo = JSON.parse(localStorage.getItem(`histo-${idMois}`)) || {};
        const humeurJour = histo[date.getDate()]?.humeur || 'content';
        const classeActif = humeurJour === 'content' ? 'actif-vert' : 'actif-rouge';

        document.getElementById('grille-pixels').classList.toggle('cache', !isGrille);
        document.getElementById('section-stats').classList.toggle('cache', isGrille);
        
        const btnG = document.getElementById('btn-tab-grille');
        const btnS = document.getElementById('btn-tab-stats');
        
        btnG.classList.remove('actif-vert', 'actif-rouge');
        btnS.classList.remove('actif-vert', 'actif-rouge');
        
        if(isGrille) btnG.classList.add(classeActif);
        else btnS.classList.add(classeActif);
    }

    document.getElementById('btn-retour-choix').onclick = () => naviguer('ecran-choix');
    document.getElementById('btn-tab-grille').onclick = () => switchTab('grille');
    document.getElementById('btn-tab-stats').onclick = () => switchTab('stats');
    document.getElementById('modal-close-btn').onclick = () => document.getElementById('modal-detail').classList.add('cache');
    document.getElementById('btn-modifier-jour').onclick = () => { document.getElementById('modal-detail').classList.add('cache'); naviguer('ecran-choix'); };
    
    document.getElementById('real-reset-btn').onclick = () => {
        if(confirm("Effacer les données ?")) { localStorage.removeItem(`histo-${idMois}`); naviguer('ecran-choix'); }
    };

    document.getElementById('btn-ajouter-cause').onclick = () => {
        const val = document.getElementById('input-nouvelle-cause').value;
        if(val.trim()) { mesCauses.push(val.trim()); localStorage.setItem('mesCauses', JSON.stringify(mesCauses)); chargerCauses(); document.getElementById('input-nouvelle-cause').value = ""; }
    };

    const histoInit = JSON.parse(localStorage.getItem(`histo-${idMois}`)) || {};
    if(histoInit[date.getDate()]) afficherFinal();
});
