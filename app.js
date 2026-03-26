// --- 1. GENERAL EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('avatar-gif').addEventListener('click', function() {
        this.src = this.src.split('?')[0] + '?t=' + new Date().getTime();
    });

    document.querySelectorAll('.nav-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const targetId = this.getAttribute('data-target');
            document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });

    renderGoals();
    updateNutritionUI();
});

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// --- 2. GOALS LOGIC ---
let goalsData = [
    { id: 1, name: "Dips", target: 40, best: 20 },
    { id: 2, name: "Pullups", target: 20, best: 10 }
];

function renderGoals() {
    const container = document.getElementById('goals-list-container');
    container.innerHTML = '';
    let total = 0;
    goalsData.forEach(g => {
        let pct = Math.min(Math.round((g.best / g.target) * 100), 100) || 0;
        total += pct;
        container.insertAdjacentHTML('beforeend', `
            <div class="goal-item" onclick="openGoalModal(${g.id})">
                <div class="goal-circle">${pct}%</div>
                <div class="goal-info">
                    <div class="goal-title">${g.name}</div>
                    <div class="goal-stats"><span>Goal: ${g.target}</span><span class="divider">|</span><span>Best: ${g.best}</span></div>
                </div>
            </div>
        `);
    });
    document.getElementById('total-progress-text').innerText = goalsData.length ? Math.round(total / goalsData.length) + '%' : '0%';
}

function openGoalModal(id = null) {
    const m = document.getElementById('goal-modal');
    const d = document.getElementById('btn-delete');
    ['edit-goal-id','goal-name-input','goal-target-input','goal-best-input'].forEach(i => document.getElementById(i).value = '');

    if (id) {
        const g = goalsData.find(x => x.id === id);
        if(g) {
            document.getElementById('modal-title').innerText = "Edit Goal";
            document.getElementById('edit-goal-id').value = g.id;
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

function saveGoal() {
    const id = document.getElementById('edit-goal-id').value;
    const name = document.getElementById('goal-name-input').value;
    const target = parseInt(document.getElementById('goal-target-input').value) || 0;
    const best = parseInt(document.getElementById('goal-best-input').value) || 0;
    if (!name.trim()) return alert('Enter a name.');

    if (id) {
        const idx = goalsData.findIndex(g => g.id == id);
        if (idx > -1) { goalsData[idx] = {id: parseInt(id), name, target, best}; }
    } else {
        goalsData.push({ id: Date.now(), name, target, best });
    }
    closeModal('goal-modal');
    renderGoals();
}

function deleteGoal() {
    const id = document.getElementById('edit-goal-id').value;
    if (id && confirm('Delete?')) {
        goalsData = goalsData.filter(g => g.id != id);
        closeModal('goal-modal');
        renderGoals();
    }
}

// --- 3. NUTRITION LOGIC ---
let dailyTargets = { cal: 2500, pro: 160, carb: 300, fat: 80 };
let trackedFoods = [];
let currentSearchResults = [];
let foodPendingAmount = null;

function updateNutritionUI() {
    let sCal = 0, sPro = 0, sCarb = 0, sFat = 0;
    trackedFoods.forEach(f => { sCal += f.cal; sPro += f.pro; sCarb += f.carb; sFat += f.fat; });

    document.getElementById('ui-cal-val').innerText = `${Math.round(sCal)} cal`;
    document.getElementById('ui-pro-val').innerText = `${Math.round(sPro)} g`;
    document.getElementById('ui-carb-val').innerText = `${Math.round(sCarb)} g`;
    document.getElementById('ui-fat-val').innerText = `${Math.round(sFat)} g`;

    document.getElementById('ui-cal-pct').innerText = dailyTargets.cal ? Math.min(Math.round((sCal/dailyTargets.cal)*100),999)+'%' : '0%';
    document.getElementById('ui-pro-pct').innerText = dailyTargets.pro ? Math.min(Math.round((sPro/dailyTargets.pro)*100),999)+'%' : '0%';
    document.getElementById('ui-carb-pct').innerText = dailyTargets.carb ? Math.min(Math.round((sCarb/dailyTargets.carb)*100),999)+'%' : '0%';
    document.getElementById('ui-fat-pct').innerText = dailyTargets.fat ? Math.min(Math.round((sFat/dailyTargets.fat)*100),999)+'%' : '0%';

    const list = document.getElementById('food-list');
    list.innerHTML = trackedFoods.length ? '' : '<div style="color:#888;text-align:center;margin-top:30px;">No food tracked today.</div>';

    trackedFoods.forEach(f => {
        list.insertAdjacentHTML('beforeend', `
            <div class="food-item">
                <div class="food-item-info">
                    <span class="food-item-name">${f.name} (${f.amount}g)</span>
                    <span class="food-item-macros">Pro: ${Math.round(f.pro)}g | Carb: ${Math.round(f.carb)}g | Fat: ${Math.round(f.fat)}g</span>
                </div>
                <div class="food-item-cal">${Math.round(f.cal)} kcal</div>
            </div>
        `);
    });
}

function openMacroConfigModal() {
    document.getElementById('cfg-cal').value = dailyTargets.cal;
    document.getElementById('cfg-pro').value = dailyTargets.pro;
    document.getElementById('cfg-carb').value = dailyTargets.carb;
    document.getElementById('cfg-fat').value = dailyTargets.fat;
    document.getElementById('macro-config-modal').classList.add('active');
}

function saveMacroGoals() {
    dailyTargets.cal = parseInt(document.getElementById('cfg-cal').value)||0;
    dailyTargets.pro = parseInt(document.getElementById('cfg-pro').value)||0;
    dailyTargets.carb = parseInt(document.getElementById('cfg-carb').value)||0;
    dailyTargets.fat = parseInt(document.getElementById('cfg-fat').value)||0;
    closeModal('macro-config-modal');
    updateNutritionUI();
}

function openTrackModal() {
    switchTrackTab('search', document.getElementById('btn-tab-search'));
    document.getElementById('api-search-input').value = '';
    document.getElementById('api-barcode-input').value = '';
    document.getElementById('api-results-container').innerHTML = '';
    document.getElementById('barcode-results-container').innerHTML = '';
    document.getElementById('track-modal').classList.add('active');
}

function switchTrackTab(tabId, btnElement) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
}

// --- 4. API LOGIC MIT CLOUDFLARE WORKER ---
const WORKER_URL = 'https://cool-silence-3652.help-synapse-pro.workers.dev';

async function safeFetchJSON(offUrl) {
    const proxyUrl = `${WORKER_URL}?url=${encodeURIComponent(offUrl)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const res = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) throw new Error(`Server Fehler: ${res.status}`);

        const text = await res.text();
        if (!text || text.trim().startsWith('<')) throw new Error('Ungültige Antwort');

        return JSON.parse(text);

    } catch (e) {
        clearTimeout(timeout);
        if (e.name === 'AbortError') throw new Error('Zeitüberschreitung — bitte erneut versuchen.');
        throw e;
    }
}

// --- 5. SEARCH & BARCODE ---

async function searchFoodAPI() {
    const q = document.getElementById('api-search-input').value.trim();
    const c = document.getElementById('api-results-container');
    if (!q) return;

    c.innerHTML = '<div style="text-align:center; padding: 20px; color:#888;"><i>Searching database...</i></div>';

    try {
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,product_name_de,generic_name,brands,nutriments,image_front_thumb_url`;
        const data = await safeFetchJSON(url);

        if (data && data.products && data.products.length > 0) {
            renderAPIResults(data.products, c);
        } else {
            c.innerHTML = '<div style="text-align:center; padding: 20px; color:#888;"><i>No products found. Try another keyword.</i></div>';
        }
    } catch(e) {
        c.innerHTML = `<div style="color:red; font-size:0.85rem; padding: 10px; background:#ffebeb; border-radius:8px;">⚠️ ${e.message}</div>`;
    }
}

async function searchBarcodeAPI() {
    const code = document.getElementById('api-barcode-input').value.trim();
    const c = document.getElementById('barcode-results-container');
    if (!code) return;

    c.innerHTML = '<div style="text-align:center; padding: 20px; color:#888;"><i>Looking up barcode...</i></div>';

    try {
        const url = `https://world.openfoodfacts.org/api/v2/product/${code}?fields=product_name,product_name_de,generic_name,brands,nutriments,image_front_thumb_url`;
        const data = await safeFetchJSON(url);

        if (data && data.product) {
            renderAPIResults([data.product], c);
        } else {
            c.innerHTML = '<div style="text-align:center; padding: 20px; color:#888;"><i>Barcode not found in database.</i></div>';
        }
    } catch(e) {
        c.innerHTML = `<div style="color:red; font-size:0.85rem; padding: 10px; background:#ffebeb; border-radius:8px;">⚠️ ${e.message}</div>`;
    }
}

function renderAPIResults(products, container) {
    currentSearchResults = [];
    container.innerHTML = '';

    const validProducts = products.filter(p =>
        (p.product_name || p.product_name_de || p.generic_name) && p.nutriments
    );

    if (validProducts.length > 0) {
        validProducts.forEach((p, idx) => {
            const nameFallback = p.product_name_de || p.product_name || p.generic_name || 'Unknown Food';
            const brand = p.brands ? ` (${p.brands.split(',')[0].trim()})` : '';
            const finalName = nameFallback + brand;

            const cal  = p.nutriments['energy-kcal_100g'] || 0;
            const pro  = p.nutriments['proteins_100g']     || 0;
            const carb = p.nutriments['carbohydrates_100g']|| 0;
            const fat  = p.nutriments['fat_100g']          || 0;

            const fallbackImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80';
            const imgUrl = p.image_front_thumb_url || fallbackImg;

            currentSearchResults.push({ name: finalName, cal, pro, carb, fat });

            container.insertAdjacentHTML('beforeend', `
                <div class="api-result-item" onclick="promptAmount(${idx})">
                    <img src="${imgUrl}" alt="Food" class="api-result-img" loading="lazy"
                         onerror="this.src='${fallbackImg}'">
                    <div class="api-result-info">
                        <span class="api-result-title">${finalName}</span>
                        <span class="api-result-macros">${Math.round(cal)} kcal | P:${Math.round(pro)}g | C:${Math.round(carb)}g | F:${Math.round(fat)}g</span>
                    </div>
                </div>
            `);
        });
    } else {
        container.innerHTML = '<div style="text-align:center; padding: 20px; color:#888;"><i>No valid products with nutritional data found.</i></div>';
    }
}

// --- 6. MANUAL & AMOUNT ---

function submitManualFood() {
    const name = document.getElementById('man-name').value || 'Custom Food';
    const cal  = parseFloat(document.getElementById('man-cal').value)  || 0;
    const pro  = parseFloat(document.getElementById('man-pro').value)  || 0;
    const carb = parseFloat(document.getElementById('man-carb').value) || 0;
    const fat  = parseFloat(document.getElementById('man-fat').value)  || 0;

    foodPendingAmount = { name, cal, pro, carb, fat };
    document.getElementById('amount-food-name').innerText = name;
    document.getElementById('food-amount-input').value = 100;
    closeModal('track-modal');
    document.getElementById('amount-modal').classList.add('active');
}

function promptAmount(index) {
    foodPendingAmount = currentSearchResults[index];
    document.getElementById('amount-food-name').innerText = foodPendingAmount.name;
    document.getElementById('food-amount-input').value = 100;
    closeModal('track-modal');
    document.getElementById('amount-modal').classList.add('active');
}

function confirmAddFood() {
    const amount = parseFloat(document.getElementById('food-amount-input').value) || 100;
    const multiplier = amount / 100;

    trackedFoods.push({
        name:   foodPendingAmount.name,
        amount: amount,
        cal:    foodPendingAmount.cal  * multiplier,
        pro:    foodPendingAmount.pro  * multiplier,
        carb:   foodPendingAmount.carb * multiplier,
        fat:    foodPendingAmount.fat  * multiplier
    });

    closeModal('amount-modal');
    updateNutritionUI();
}
