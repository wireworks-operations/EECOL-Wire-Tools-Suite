// Multi-Cut Planner - Standalone Rebuild

document.addEventListener('DOMContentLoaded', function() {
    console.log('Multi-Cut Planner JS loaded');

    const addReelBtn = document.getElementById('addReelBtn');
    const addCutBtn = document.getElementById('addCutBtn');
    const reelList = document.getElementById('reelList');
    const cutList = document.getElementById('cutList');

    addReelBtn.addEventListener('click', function() {
        const reelId = Date.now();
        const reelEl = document.createElement('div');
        reelEl.classList.add('flex', 'space-x-2');
        reelEl.innerHTML = `
            <input type="text" placeholder="Reel Name" class="flex-1 p-2 border border-gray-300 rounded-lg shadow-inner text-sm">
            <input type="number" placeholder="Length" class="w-24 p-2 border border-gray-300 rounded-lg shadow-inner text-sm">
            <input type="number" placeholder="Cost" class="w-24 p-2 border border-gray-300 rounded-lg shadow-inner text-sm">
            <button class="removeReelBtn bg-red-500 hover:bg-red-600 text-white font-bold p-2 rounded-lg shadow-md">-</button>
        `;
        reelList.appendChild(reelEl);
    });

    addCutBtn.addEventListener('click', function() {
        const cutId = Date.now();
        const cutEl = document.createElement('div');
        cutEl.classList.add('flex', 'space-x-2');
        cutEl.innerHTML = `
            <input type="number" placeholder="Length" class="flex-1 p-2 border border-gray-300 rounded-lg shadow-inner text-sm">
            <button class="removeCutBtn bg-red-500 hover:bg-red-600 text-white font-bold p-2 rounded-lg shadow-md">-</button>
        `;
        cutList.appendChild(cutEl);
    });

    reelList.addEventListener('click', function(e) {
        if (e.target.classList.contains('removeReelBtn')) {
            e.target.parentElement.remove();
        }
    });

    cutList.addEventListener('click', function(e) {
        if (e.target.classList.contains('removeCutBtn')) {
            e.target.parentElement.remove();
        }
    const calculateBtn = document.getElementById('calculateBtn');

    calculateBtn.addEventListener('click', function() {
        const wireDiameter = document.getElementById('wireDiameter').value;
        const wireDiameterUnit = document.getElementById('wireDiameterUnit').value;

        const reels = [];
        const reelElements = reelList.querySelectorAll('.flex');
        reelElements.forEach(reelEl => {
            const inputs = reelEl.querySelectorAll('input');
            reels.push({
                name: inputs[0].value,
                length: inputs[1].value,
                cost: inputs[2].value
            });
        });

        const cuts = [];
        const cutElements = cutList.querySelectorAll('.flex');
        cutElements.forEach(cutEl => {
            const input = cutEl.querySelector('input');
            cuts.push(input.value);
        });

        const data = {
            wire: {
                diameter: wireDiameter,
                unit: wireDiameterUnit
            },
            reels: reels,
            cuts: cuts
        };

        console.log(data);

        const plan = generateCutPlan(data);
        const plan = generateCutPlan(data);
        displayCutPlan(plan);
    });

    function displayCutPlan(plan) {
        const resultsContainer = document.getElementById('results-container');
        resultsContainer.innerHTML = '';

        for (const reelName in plan) {
            const reelEl = document.createElement('div');
            reelEl.classList.add('mb-4');
            let cutsHTML = '';
            if (plan[reelName].length > 0) {
                cutsHTML = `<ul>${plan[reelName].map(cut => `<li>${cut}</li>`).join('')}</ul>`;
            }
            reelEl.innerHTML = `
                <h4 class="font-bold">${reelName}</h4>
                ${cutsHTML}
            `;
            resultsContainer.appendChild(reelEl);
        }
    }

    function generateCutPlan(data) {
        const plan = {};
        const reels = JSON.parse(JSON.stringify(data.reels));
        const cuts = JSON.parse(JSON.stringify(data.cuts)).sort((a, b) => b - a); // Sort cuts descending

        reels.forEach(reel => {
            plan[reel.name] = [];
        });

        cuts.forEach(cut => {
            let bestFitReel = null;
            let minWaste = Infinity;

            for (const reel of reels) {
                if (reel.length >= cut) {
                    const waste = reel.length - cut;
                    if (waste < minWaste) {
                        minWaste = waste;
                        bestFitReel = reel;
                    }
                }
            }

            if (bestFitReel) {
                plan[bestFitReel.name].push(cut);
                bestFitReel.length -= cut;
            } else {
                console.warn(`Could not assign cut of length ${cut}`);
            }
        });

        return plan;
    }
