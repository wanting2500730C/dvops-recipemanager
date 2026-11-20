const deleteRecipeButton = document.getElementById('deleteRecipeButton');
const recipeListElement = document.getElementById('recipeList');

let deleteMode = false;
const selectedIds = new Set();

// Button text depends on the current state
function updateDeleteButton() {
    if (!deleteMode) {
        deleteRecipeButton.textContent = '🗑 Delete Recipe';
    } else if (selectedIds.size === 0) {
        deleteRecipeButton.textContent = '✖ Cancel';
    } else {
        deleteRecipeButton.textContent = `🗑 Delete ${selectedIds.size} item(s)`;
    }

    deleteRecipeButton.classList.toggle(
        'cancel-mode',
        deleteMode && selectedIds.size === 0
    );
}

// Put the red "selected" look back on the right cards
function applySelection() {
    recipeListElement.classList.toggle('delete-mode', deleteMode);

    recipeListElement.querySelectorAll('.recipe-card').forEach(card => {
        card.classList.toggle('selected', selectedIds.has(card.dataset.id));
    });
}

// Cards get redrawn on search/filter, so re-apply the selection each time
new MutationObserver(applySelection)
    .observe(recipeListElement, { childList: true });

// Click a card to select / unselect it (only in delete mode)
recipeListElement.addEventListener('click', (event) => {
    if (!deleteMode) return;

    const card = event.target.closest('.recipe-card');
    if (!card) return;

    const id = card.dataset.id;

    if (selectedIds.has(id)) {
        selectedIds.delete(id);
    } else {
        selectedIds.add(id);
    }

    applySelection();
    updateDeleteButton();
});

// DELETE - delete every selected recipe
async function deleteSelectedRecipes() {
    const count = selectedIds.size;

    if (!confirm(`Delete ${count} recipe(s)? This cannot be undone.`)) return;

    deleteRecipeButton.disabled = true;
    let failed = 0;

    // One at a time, so two requests never write recipes.json at the same moment
    for (const id of [...selectedIds]) {
        try {
            const response = await fetch('/delete-recipe/' + id, { method: 'DELETE' });

            // 404 means it's already gone, which is fine
            if (response.ok || response.status === 404) {
                selectedIds.delete(id);
            } else {
                failed++;
            }
        } catch {
            failed++;
        }
    }

    deleteRecipeButton.disabled = false;

    // Leave delete mode if everything worked; otherwise keep the failed ones selected
    if (failed === 0) deleteMode = false;

    await displayRecipes(); // Wanting's function, reloads the cards
    applySelection();
    updateDeleteButton();

    if (failed > 0) {
        alert(`${failed} recipe(s) could not be deleted. They are still selected.`);
    }
}

// The header button: start -> cancel -> delete
deleteRecipeButton.addEventListener('click', () => {
    if (!deleteMode) {
        deleteMode = true;
    } else if (selectedIds.size === 0) {
        deleteMode = false;
    } else {
        deleteSelectedRecipes();
        return;
    }

    applySelection();
    updateDeleteButton();
});