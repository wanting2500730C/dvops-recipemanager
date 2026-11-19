const addRecipeForm = document.getElementById('addRecipeForm');
const ingredientRows = document.getElementById('recipeIngredients');
const ingredientTemplate = document.getElementById('ingredientRowTemplate');
const addIngredientButton = document.getElementById('addIngredientButton');
const saveRecipeButton = document.getElementById('saveRecipeButton');
const recipeMessage = document.getElementById('addRecipeMessage');
const recipePhotoInput = document.getElementById('recipePhoto');
const recipePhotoPreview = document.getElementById('recipePhotoPreview');

let photoPreviewUrl;

function clearPhotoPreview() {
    if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
        photoPreviewUrl = undefined;
    }

    recipePhotoPreview.removeAttribute('src');
    recipePhotoPreview.hidden = true;
}

recipePhotoInput.addEventListener('change', function () {
    clearPhotoPreview();

    const photo = recipePhotoInput.files[0];

    if (photo) {
        photoPreviewUrl = URL.createObjectURL(photo);
        recipePhotoPreview.src = photoPreviewUrl;
        recipePhotoPreview.hidden = false;
    }
});

function addIngredientRow() {
    const row = ingredientTemplate.content.firstElementChild.cloneNode(true);
    const removeButton = row.querySelector('.remove-ingredient');

    // Keep the first ingredient row available.
    removeButton.hidden = ingredientRows.children.length === 0;
    removeButton.addEventListener('click', function () {
        row.remove();
    });

    ingredientRows.appendChild(row);
}

function addRecipe(event) {
    event.preventDefault();

    const jsonData = {
        name: document.getElementById('recipeName').value.trim(),
        category: document.getElementById('recipeCategory').value,
        ingredients: Array.from(ingredientRows.children, function (row) {
            return {
                name: row.querySelector('.ingredient-name').value.trim(),
                quantity: row.querySelector('.ingredient-quantity').valueAsNumber,
                unit: row.querySelector('.ingredient-unit').value.trim()
            };
        }),
        instructions: document.getElementById('recipeInstructions').value
            .split(/\r?\n/)
            .map((step) => step.trim())
            .filter(Boolean)
    };

    if (!jsonData.name || !jsonData.category || jsonData.instructions.length === 0) {
        recipeMessage.textContent = 'Enter a recipe name, cuisine, and cooking instructions.';
        return;
    }

    if (jsonData.ingredients.some((ingredient) =>
        !ingredient.name ||
        !ingredient.unit ||
        !Number.isFinite(ingredient.quantity) ||
        ingredient.quantity <= 0
    )) {
        recipeMessage.textContent =
            'Each ingredient needs a name, unit, and quantity greater than 0.';
        return;
    }

    const formData = new FormData();
    formData.append('recipe', JSON.stringify(jsonData));

    const photo = recipePhotoInput.files[0];

    if (photo) {
        formData.append('photo', photo);
    }

    saveRecipeButton.disabled = true;
    recipeMessage.textContent = 'Saving recipe…';

    const request = new XMLHttpRequest();
    request.open('POST', '/add-recipe', true);
    request.responseType = 'json';

    request.onload = function () {
        recipeMessage.textContent = request.response?.message || 'Could not save the recipe.';

        if (request.status === 201) {
            addRecipeForm.reset();
            clearPhotoPreview();
            ingredientRows.replaceChildren();
            addIngredientRow();
        }
    };

    request.onerror = function () {
        recipeMessage.textContent = 'Could not reach the server.';
    };

    request.onloadend = function () {
        saveRecipeButton.disabled = false;
    };

    // The browser sets the multipart Content-Type when sending FormData.
    request.send(formData);
}

addIngredientButton.addEventListener('click', addIngredientRow);
addRecipeForm.addEventListener('submit', addRecipe);
addIngredientRow();