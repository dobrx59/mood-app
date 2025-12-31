import confetti from "https://cdn.skypack.dev/canvas-confetti";

document.addEventListener('DOMContentLoaded', () => {
    const dateAujourdhui = new Date();
    let vueMois = dateAujourdhui.getMonth();
    let vueAnnee = dateAujourdhui.getFullYear();
    
    // VARIABLE CORRECTIVE : pour savoir quel jour on modifie
    let jourEnModification = null; 
    
    const obtenirIdMois = (m, a) => `histo-${a}-${m}`;
    
    let humeurDuJour = "";
    let causeChoisie = ""; 
    let mesCauses = JSON.parse(localStorage.getItem('mesCauses')) || ["🏢 Travail", "❤️ Amour", "🥗 Santé", "🎮 Loisirs"];

    const splash = document.getElementById('splash-screen-koach');
    const splashText = document.querySelector('.carte-accueil');
    const h = dateAujourdhui.getHours();
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
        
        // CORRECTION : On utilise jourEnModification s'il existe, sinon la date du jour
        const jourASauver = jourEnModification || dateAujourdhui.getDate();
        const moisASauver = (jourEnModification) ? vueMois : dateAujourdhui.getMonth();
        const anneeASauver = (jourEnModification) ? vueAnnee : dateAujourdhui.getFullYear();
        
        const idCible = obtenirIdMois(moisASauver, anneeASauver);
        const histo = JSON.parse(localStorage.getItem(idCible)) || {};
        
        histo[jourASauver] = { humeur: humeurDuJour, raison: causeChoisie, note: note };
        localStorage.setItem(idCible, JSON.stringify(histo));
        
        document.getElementById('modal-note').classList.add('cache');
        confetti({ particleCount: 150, spread: 70, colors: humeurDuJour === 'content' ? ['#A8E6CF'] : ['#FF8B94'] });
        
        // On remet à zéro après la sauvegarde
        jourEnModification = null;
        afficherFinal();
    };

    function afficherFinal() {
        naviguer('ecran-confirmation');
        const nomMoisClair = new Date(vueAnnee, vueMois).toLocaleDateString('fr-FR', {month:'long', year:'numeric'});
        document.getElementById('nom-du-mois').innerHTML = `
            <span id="prev-mois" style="cursor:pointer; padding:10px;">‹</span>
            ${nomMoisClair}
            <span id="next-mois" style="cursor:pointer; padding:10px;">›</span>
        `;
        
        document.getElementById('prev-mois').onclick = () => {
            if(vueMois === 0) { vueMois = 11; vueAnnee--; } else { vueMois--; }
            afficherFinal();
        };
        document.getElementById('next-mois').onclick = () => {
            if(vueMois === 11) { vueMois = 0; vueAnnee++; } else { vueMois++; }
            afficherFinal();
        };

        dessinerGrille(); 
        calculerStats();
        switchTab('grille');
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
                    // ON RETIENT LE JOUR CLIQUÉ
                    jourEnModification = i; 
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
        
        let streak = 0;
        let jourCheck = new Date(dateAujourdhui);
        let idCheck = obtenirIdMois(jourCheck.getMonth(), jourCheck.getFullYear());
        let histoCheck = JSON.parse(localStorage.getItem(idCheck)) || {};

        if (!histoCheck[jourCheck.getDate()]) jourCheck.setDate(jourCheck.getDate() - 1);
        
        while (true) {
            idCheck = obtenirIdMois(jourCheck.getMonth(), jourCheck.getFullYear());
            histoCheck = JSON.parse(localStorage.getItem(idCheck)) || {};
            if (histoCheck[jourCheck.getDate()]) {
                streak++;
                jourCheck.setDate(jourCheck.getDate() - 1);
            } else {
                break;
            }
        }
        document.getElementById('streak-count').innerText = streak + " jour(s)";

        const container = document.getElementById('mood-trend-container');
        container.innerHTML = "";
        for (let i = 6; i >= 0; i--) {
            const d = new Date(dateAujourdhui); d.setDate(dateAujourdhui.getDate() - i);
            const hTrend = JSON.parse(localStorage.getItem(obtenirIdMois(d.getMonth(), d.getFullYear()))) || {};
            const dataJ = hTrend[d.getDate()];
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
        } else {
            document.getElementById('score-bonheur').innerText = "--";
            document.getElementById('cause-majeure').innerText = "Aucune donnée ce mois";
        }
    }

    function switchTab(tab) {
        const isGrille = tab === 'grille';
        const idActuel = obtenirIdMois(dateAujourdhui.getMonth(), dateAujourdhui.getFullYear());
        const histoActuel = JSON.parse(localStorage.getItem(idActuel)) || {};
        const humeurJour = histoActuel[dateAujourdhui.getDate()]?.humeur || 'content';
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

    document.getElementById('btn-retour-choix').onclick = () => {
        jourEnModification = null; // Reset si on revient en arrière
        naviguer('ecran-choix');
    };
    
    document.getElementById('btn-tab-grille').onclick = () => switchTab('grille');
    document.getElementById('btn-tab-stats').onclick = () => switchTab('stats');
    document.getElementById('modal-close-btn').onclick = () => {
        jourEnModification = null;
        document.getElementById('modal-detail').classList.add('cache');
    };
    
    document.getElementById('btn-modifier-jour').onclick = () => {
        document.getElementById('modal-detail').classList.add('cache');
        naviguer('ecran-choix');
    };
    
    document.getElementById('real-reset-btn').onclick = () => {
        if(confirm("Effacer les données de ce mois uniquement ?")) { 
            localStorage.removeItem(obtenirIdMois(vueMois, vueAnnee)); 
            afficherFinal(); 
        }
    };

    document.getElementById('btn-ajouter-cause').onclick = () => {
        const val = document.getElementById('input-nouvelle-cause').value;
        if(val.trim()) { mesCauses.push(val.trim()); localStorage.setItem('mesCauses', JSON.stringify(mesCauses)); chargerCauses(); document.getElementById('input-nouvelle-cause').value = ""; }
    };

    const idInit = obtenirIdMois(dateAujourdhui.getMonth(), dateAujourdhui.getFullYear());
    const histoInit = JSON.parse(localStorage.getItem(idInit)) || {};
    if(histoInit[dateAujourdhui.getDate()]) {
        vueMois = dateAujourdhui.getMonth();
        vueAnnee = dateAujourdhui.getFullYear();
        afficherFinal();
    }
});
