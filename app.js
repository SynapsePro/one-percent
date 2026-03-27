// --- FIREBASE IMPORTE (Module) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// --- DEINE FIREBASE KEYS ---
const firebaseConfig = {
    apiKey: "AIzaSyD7Dj7mmVjVf8tYLwUrwWl0BQWmjkMbamY",
    authDomain: "one-percent-8716b.firebaseapp.com",
    projectId: "one-percent-8716b",
    storageBucket: "one-percent-8716b.firebasestorage.app",
    messagingSenderId: "921238071309",
    appId: "1:921238071309:web:1e360aa53751aa0105cd44"
};

// --- INIT FIREBASE ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// --- LOKALE VARIABLEN ---
let goalsData = [];
let trackedFoods = [];
let recipes = [];
let exercises = [];
let dailyTargets = { pro: 160 };
let bodyStats = {};

const todayDateString = new Date().toISOString().split('T')[0];

// --- APP START ---
document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('.nav-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const targetId = this.getAttribute('data-target');
            document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });

    document.getElementById('avatar-gif').addEventListener('click', function() {
        this.src = this.src.split('?')[0] + '?t=' + new Date().getTime();
    });

    await fetchAllData();
});

// --- DATEN AUS FIREBASE LADEN ---
async function fetchAllData() {
    try {
        const goalsSnap = await getDocs(collection(db, "goals"));
        goalsData = goalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderGoals();

        const recipesSnap = await getDocs(collection(db, "recipes"));
        recipes = recipesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderRecipes();

        const trainSnap = await getDocs(collection(db, "exercises"));
        exercises = trainSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderTraining();

        const settingsSnap = await getDoc(doc(db, "user", "settings"));
        if (settingsSnap.exists()) {
            const data = settingsSnap.data();
            if(data.proteinTarget) dailyTargets.pro = data.proteinTarget;
            if(data.bodyStats) bodyStats = data.bodyStats;
        }
        renderBodyStats();

        const qProtein = query(collection(db, "trackedFoods"), where("date", "==", todayDateString));
        const proSnap = await getDocs(qProtein);
        trackedFoods = proSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        updateNutritionUI();

    } catch (error) {
        console.error("Fehler beim Laden:", error);
    }
}

// --- HILFSFUNKTION FÜR BILDER-UPLOAD ---
async function uploadImageFile(file, folderName) {
    if (!file) return null;
    const fileName = `${folderName}/${Date.now()}_${file.name}`;
    const storageReference = ref(storage, fileName);
    await uploadBytes(storageReference, file);
    return await getDownloadURL(storageReference);
}

// ================= GOALS LOGIC =================
function renderGoals() {
    const container = document.getElementById('goals-list-container');
    container.innerHTML = ''; 
    let total = 0;

    if(goalsData.length === 0) {
        container.innerHTML = '<div style="color:#888; text-align:center;">No goals yet.</div>';
        document.getElementById('total-progress-text').innerText = '0%';
        return;
    }

    goalsData.forEach(g => {
        let pct = Math.min(Math.round((g.best / g.target) * 100), 100) || 0;
        total += pct;
        
        // Bild links
        let imgHtml = g.imgUrl 
            ? `<img src="${g.imgUrl}" class="item-thumb" alt="Goal">` 
            : `<div class="item-thumb placeholder-thumb"></div>`;

        container.insertAdjacentHTML('beforeend', `
            <div class="goal-item" onclick="openGoalModal('${g.id}')">
                ${imgHtml}
                <div class="goal-info">
                    <div class="goal-title">${g.name}</div>
                    <div class="goal-stats"><span>Goal: ${g.target}</span><span class="divider">|</span><span>Best: ${g.best}</span></div>
                </div>
                <div class="goal-pct-right">${pct}%</div>
            </div>
        `);
    });
    document.getElementById('total-progress-text').innerText = Math.round(total / goalsData.length) + '%';
}

function openGoalModal(id = null) {
    const m = document.getElementById('goal-modal');
    const d = document.getElementById('btn-delete');
    
    document.getElementById('edit-goal-id').value = '';
    document.getElementById('edit-goal-imgUrl').value = '';
    document.getElementById('goal-name-input').value = '';
    document.getElementById('goal-target-input').value = '';
    document.getElementById('goal-best-input').value = '';
    document.getElementById('goal-image-input').value = '';
    
    if (id) {
        const g = goalsData.find(x => x.id === id);
        if(g) {
            document.getElementById('modal-title').innerText = "Edit Goal";
            document.getElementById('edit-goal-id').value = g.id;
            document.getElementById('edit-goal-imgUrl').value = g.imgUrl || '';
            document.getElementById('goal-name-input').value = g.name;
            document.getElementById('goal-target-input').value = g.target;
            document.getElementById('goal-best-input').value = g.best;
            d.style.display = 'block'; 
        }
    } else {
        document.getElementById('modal-title').innerText = "New Goal";
        d.style.display = 'none'; 
    }
    m.classList.add('active');
}

async function saveGoal() {
    const id = document.getElementById('edit-goal-id').value;
    const name = document.getElementById('goal-name-input').value;
    const target = parseInt(document.getElementById('goal-target-input').value) || 0;
    const best = parseInt(document.getElementById('goal-best-input').value) || 0;
    const file = document.getElementById('goal-image-input').files[0];
    let imgUrl = document.getElementById('edit-goal-imgUrl').value;

    if (!name.trim()) return alert('Enter a name.');
    
    const btn = document.getElementById('btn-save-goal');
    btn.innerText = "Saving...";

    if (file) {
        imgUrl = await uploadImageFile(file, 'goals');
    }

    const dataObj = { name, target, best, imgUrl };

    if (id) {
        await updateDoc(doc(db, "goals", id), dataObj);
        const idx = goalsData.findIndex(g => g.id === id);
        goalsData[idx] = { id, ...dataObj };
    } else {
        const docRef = await addDoc(collection(db, "goals"), dataObj);
        goalsData.push({ id: docRef.id, ...dataObj });
    }
    
    btn.innerText = "Save";
    closeModal('goal-modal'); 
    renderGoals(); 
}

async function deleteGoal() {
    const id = document.getElementById('edit-goal-id').value;
    if (id && confirm('Delete Goal?')) { 
        await deleteDoc(doc(db, "goals", id));
        goalsData = goalsData.filter(g => g.id !== id); 
        closeModal('goal-modal'); 
        renderGoals(); 
    }
}

// ================= NUTRITION LOGIC =================
function updateNutritionUI() {
    let sPro = 0;
    trackedFoods.forEach(f => { sPro += f.pro; });

    document.getElementById('ui-pro-val').innerText = `${Math.round(sPro)} g`;
    document.getElementById('ui-pro-pct').innerText = dailyTargets.pro ? Math.min(Math.round((sPro/dailyTargets.pro)*100),999)+'%' : '0%';

    const list = document.getElementById('food-list');
    list.innerHTML = trackedFoods.length ? '' : '<div style="color:#888;text-align:center;margin-top:20px;">No protein tracked today.</div>';
    
    trackedFoods.forEach(f => {
        list.insertAdjacentHTML('beforeend', `
            <div class="food-item">
                <div class="food-item-info">
                    <span class="food-item-name">${f.name} (${f.amount}g)</span>
                </div>
                <div class="food-item-cal" style="color:#0071d3;">${Math.round(f.pro)}g Pro</div>
            </div>
        `);
    });
}

function openMacroConfigModal() {
    document.getElementById('cfg-pro').value = dailyTargets.pro;
    document.getElementById('macro-config-modal').classList.add('active');
}

async function saveMacroGoals() {
    const proVal = parseInt(document.getElementById('cfg-pro').value)||0;
    dailyTargets.pro = proVal;
    
    await setDoc(doc(db, "user", "settings"), { proteinTarget: proVal }, { merge: true });
    
    closeModal('macro-config-modal'); 
    updateNutritionUI();
}

function openTrackModal() {
    document.getElementById('man-name').value = '';
    document.getElementById('man-pro-100').value = '';
    document.getElementById('man-amount').value = '';
    document.getElementById('track-modal').classList.add('active');
}

async function submitManualFood() {
    const name = document.getElementById('man-name').value || 'Protein Source';
    const proPer100 = parseFloat(document.getElementById('man-pro-100').value) || 0;
    const amount = parseFloat(document.getElementById('man-amount').value) || 0;
    
    if(amount <= 0) return alert('Please enter an amount greater than 0');

    const calculatedPro = (proPer100 / 100) * amount;

    const dataObj = { name, amount, pro: calculatedPro, date: todayDateString, timestamp: Date.now() };
    
    const docRef = await addDoc(collection(db, "trackedFoods"), dataObj);
    trackedFoods.push({ id: docRef.id, ...dataObj });
    
    closeModal('track-modal');
    updateNutritionUI();
}

// ================= RECIPES LOGIC =================
function renderRecipes() {
    const list = document.getElementById('recipe-list-container');
    list.innerHTML = recipes.length ? '' : '<div style="color:#888;text-align:center;margin-top:10px;font-size:0.9rem;">No recipes added yet.</div>';
    
    recipes.forEach(r => {
        let imgHtml = r.imgUrl 
            ? `<img src="${r.imgUrl}" class="item-thumb" alt="Recipe Image">` 
            : `<div class="item-thumb placeholder-thumb"></div>`;
            
        list.insertAdjacentHTML('beforeend', `
            <div class="goal-item" onclick="openViewRecipeModal('${r.id}')">
                ${imgHtml}
                <div class="goal-info">
                    <div class="goal-title">${r.name}</div>
                    <div class="goal-stats"><span>Tap to view ingredients & steps</span></div>
                </div>
            </div>
        `);
    });
}

function openAddRecipeModal() {
    document.getElementById('recipe-name').value = '';
    document.getElementById('recipe-ingredients').value = '';
    document.getElementById('recipe-steps').value = '';
    document.getElementById('recipe-image-input').value = '';
    document.getElementById('recipe-add-modal').classList.add('active');
}

async function saveRecipe() {
    const name = document.getElementById('recipe-name').value;
    const ingredients = document.getElementById('recipe-ingredients').value;
    const steps = document.getElementById('recipe-steps').value;
    const file = document.getElementById('recipe-image-input').files[0];

    if (!name.trim()) return alert('Enter a recipe name.');

    const btn = document.getElementById('btn-save-recipe');
    btn.innerText = "Saving...";

    let imgUrl = null;
    if (file) {
        imgUrl = await uploadImageFile(file, 'recipes');
    }

    const dataObj = { name, ingredients, steps, imgUrl };
    const docRef = await addDoc(collection(db, "recipes"), dataObj);
    
    recipes.push({ id: docRef.id, ...dataObj });
    
    btn.innerText = "Save Recipe";
    closeModal('recipe-add-modal');
    renderRecipes();
}

function openViewRecipeModal(id) {
    const r = recipes.find(x => x.id === id);
    if (!r) return;
    
    document.getElementById('view-recipe-title').innerText = r.name;
    document.getElementById('view-recipe-ingredients').innerText = r.ingredients || 'None specified.';
    document.getElementById('view-recipe-steps').innerText = r.steps || 'None specified.';
    document.getElementById('view-recipe-id').value = r.id;

    const imgEl = document.getElementById('view-recipe-image');
    if(r.imgUrl) {
        imgEl.src = r.imgUrl;
        imgEl.style.display = 'block';
    } else {
        imgEl.style.display = 'none';
        imgEl.src = '';
    }
    
    document.getElementById('recipe-view-modal').classList.add('active');
}

async function deleteRecipe() {
    const id = document.getElementById('view-recipe-id').value;
    if (id && confirm('Delete Recipe?')) { 
        await deleteDoc(doc(db, "recipes", id));
        recipes = recipes.filter(r => r.id !== id); 
        closeModal('recipe-view-modal'); 
        renderRecipes(); 
    }
}

// ================= TRAINING LOGIC =================
function renderTraining() {
    const categories = ['Strength', 'Cardio', 'Functional'];
    
    categories.forEach(cat => {
        const list = document.getElementById(`train-list-${cat.toLowerCase()}`);
        list.innerHTML = '';
        const catEx = exercises.filter(e => e.category === cat);
        
        if (catEx.length === 0) {
            list.innerHTML = '<div style="color:#888; font-size:0.85rem; padding: 5px;">No exercises.</div>';
        } else {
            catEx.forEach(e => {
                let imgHtml = e.imgUrl 
                    ? `<img src="${e.imgUrl}" class="item-thumb" alt="Exercise">` 
                    : `<div class="item-thumb placeholder-thumb"></div>`;

                list.insertAdjacentHTML('beforeend', `
                    <div class="goal-item" style="margin-bottom: 10px;" onclick="deleteExercise('${e.id}')">
                        ${imgHtml}
                        <div class="goal-info">
                            <div class="goal-title">${e.name}</div>
                            <div class="goal-stats">
                                ${e.reps ? `<span>Reps: ${e.reps}</span><span class="divider">|</span>` : ''}
                                ${e.weight ? `<span>Weight: ${e.weight}kg</span><span class="divider">|</span>` : ''}
                                ${e.duration ? `<span>Time: ${e.duration}m</span>` : ''}
                            </div>
                            ${e.notes ? `<div style="font-size:0.8rem; color:#666; margin-top:4px;">Note: ${e.notes}</div>` : ''}
                        </div>
                    </div>
                `);
            });
        }
    });
}

function openAddExerciseModal() {
    document.getElementById('ex-name').value = '';
    document.getElementById('ex-reps').value = '';
    document.getElementById('ex-weight').value = '';
    document.getElementById('ex-duration').value = '';
    document.getElementById('ex-notes').value = '';
    document.getElementById('ex-image-input').value = '';
    document.getElementById('training-add-modal').classList.add('active');
}

async function saveExercise() {
    const name = document.getElementById('ex-name').value;
    const category = document.getElementById('ex-category').value;
    const reps = document.getElementById('ex-reps').value;
    const weight = document.getElementById('ex-weight').value;
    const duration = document.getElementById('ex-duration').value;
    const notes = document.getElementById('ex-notes').value;
    const file = document.getElementById('ex-image-input').files[0];

    if (!name.trim()) return alert('Enter exercise name.');

    const btn = document.getElementById('btn-save-ex');
    btn.innerText = "Saving...";

    let imgUrl = null;
    if (file) {
        imgUrl = await uploadImageFile(file, 'training');
    }

    const dataObj = { name, category, reps, weight, duration, notes, imgUrl };
    const docRef = await addDoc(collection(db, "exercises"), dataObj);
    
    exercises.push({ id: docRef.id, ...dataObj });
    
    btn.innerText = "Save";
    closeModal('training-add-modal');
    renderTraining();
}

async function deleteExercise(id) {
    if(confirm('Delete this exercise?')) {
        await deleteDoc(doc(db, "exercises", id));
        exercises = exercises.filter(e => e.id !== id);
        renderTraining();
    }
}

// ================= BODY STATS LOGIC =================
function renderBodyStats() {
    for(let key in bodyStats) {
        const el = document.getElementById(`stat-${key}`);
        if(el) el.innerText = bodyStats[key] || 0;
    }
}

function openBodyStatsModal() {
    for(let key in bodyStats) {
        const el = document.getElementById(`input-${key}`);
        if(el) el.value = bodyStats[key];
    }
    document.getElementById('body-stats-modal').classList.add('active');
}

async function saveBodyStats() {
    const keys = ['height','weight','bodyFat','bmi','muscleMass','fatMass','visceralFat','water','bioAge','cellFitness','o2uptake','co2emission','o2saturation','calReq','detWater','detMusclePro','detPassive','fatEssential','fatReserves','fatExcess','musTotal','musTorso','musRightArm','musLeftArm','musRightLeg','musLeftLeg','visceralKg','waterKg','waterBalIntra','waterBalExtra','waterBalPct'];
    
    let newStats = {};
    keys.forEach(k => {
        const val = parseFloat(document.getElementById(`input-${k}`)?.value) || 0;
        newStats[k] = val;
    });

    bodyStats = newStats;
    await setDoc(doc(db, "user", "settings"), { bodyStats: newStats }, { merge: true });

    closeModal('body-stats-modal');
    renderBodyStats();
}

// --- FUNKTIONEN FÜR HTML GLOBALE SICHTBARKEIT ---
window.closeModal = (id) => document.getElementById(id).classList.remove('active');
window.openGoalModal = openGoalModal;
window.saveGoal = saveGoal;
window.deleteGoal = deleteGoal;
window.openMacroConfigModal = openMacroConfigModal;
window.saveMacroGoals = saveMacroGoals;
window.openTrackModal = openTrackModal;
window.submitManualFood = submitManualFood;
window.openAddRecipeModal = openAddRecipeModal;
window.saveRecipe = saveRecipe;
window.openViewRecipeModal = openViewRecipeModal;
window.deleteRecipe = deleteRecipe;
window.openAddExerciseModal = openAddExerciseModal;
window.saveExercise = saveExercise;
window.deleteExercise = deleteExercise;
window.openBodyStatsModal = openBodyStatsModal;
window.saveBodyStats = saveBodyStats;
