const editForm = document.getElementById('editRecipeForm');
const editIngredientRows = document.getElementById('editIngredients');
const editIngredientTemplate = document.getElementById('editIngredientTemplate');
const editAddIngredientButton = document.getElementById('editAddIngredientButton');
const editSaveButton = document.getElementById('editSaveButton');
const editMessage = document.getElementById('editMessage');
const editPhotoInput = document.getElementById('editPhoto');
const editPhotoPreview = document.getElementById('editPhotoPreview');
const editCurrentPhoto = document.getElementById('editCurrentPhoto');
const editNoPhoto = document.getElementById('editNoPhoto');

// Step 1: get the recipe id from the page link (edit.html?id=...)
const params = new URLSearchParams(window.location.search);
const recipeId = params.get('id');

// Add one ingredient row, filled in if an ingredient is given
function addEditIngredientRow(ingredient) {
  const row = editIngredientTemplate.content.firstElementChild.cloneNode(true);
  const removeButton = row.querySelector('.remove-ingredient');

  if (ingredient) {
    row.querySelector('.ingredient-name').value = ingredient.name;
    row.querySelector('.ingredient-quantity').value = ingredient.quantity;
    row.querySelector('.ingredient-unit').value = ingredient.unit;
  }

  // The first row can't be removed, so there is always at least one
  removeButton.hidden = editIngredientRows.children.length === 0;
  removeButton.addEventListener('click', function () {
    row.remove();
  });

  editIngredientRows.appendChild(row);
}

// Step 2: put the recipe's details into the form
function fillForm(recipe) {
  document.getElementById('editName').value = recipe.name;
  document.getElementById('editCategory').value = recipe.category;
  document.getElementById('editInstructions').value = recipe.instructions.join('\n');

  editIngredientRows.replaceChildren();
  for (let i = 0; i < recipe.ingredients.length; i++) {
    addEditIngredientRow(recipe.ingredients[i]);
  }

  if (recipe.image) {
    editCurrentPhoto.src = recipe.image;
    editCurrentPhoto.hidden = false;
  } else {
    editNoPhoto.hidden = false;
  }
}

// Step 3: fetch the recipe from the server
function loadRecipe() {
  if (recipeId === null) {
    editMessage.textContent = 'No recipe selected. Go back and click Edit on a recipe.';
    editSaveButton.disabled = true;
    return;
  }

  fetch('/recipes/' + recipeId)
    .then(function (response) {
      if (response.status === 404) {
        editMessage.textContent = 'Recipe not found.';
        editSaveButton.disabled = true;
        return null;
      }
      return response.json();
    })
    .then(function (data) {
      if (data === null) {
        return;
      }

      // Works whether the server sends the recipe directly or inside { recipe: ... }
      const recipe = data.recipe || data;
      fillForm(recipe);
    });
}

// Show a preview when a new photo is chosen
let photoPreviewUrl;

editPhotoInput.addEventListener('change', function () {
  if (photoPreviewUrl) {
    URL.revokeObjectURL(photoPreviewUrl);
    photoPreviewUrl = undefined;
  }

  editPhotoPreview.hidden = true;
  const photo = editPhotoInput.files[0];

  if (photo) {
    photoPreviewUrl = URL.createObjectURL(photo);
    editPhotoPreview.src = photoPreviewUrl;
    editPhotoPreview.hidden = false;
  }
});

// Read the ingredient rows into a list of objects
function readEditIngredients() {
  const ingredients = [];

  for (let i = 0; i < editIngredientRows.children.length; i++) {
    const row = editIngredientRows.children[i];

    ingredients.push({
      name: row.querySelector('.ingredient-name').value.trim(),
      quantity: row.querySelector('.ingredient-quantity').valueAsNumber,
      unit: row.querySelector('.ingredient-unit').value.trim()
    });
  }

  return ingredients;
}

// Turn the instructions textarea into a list of steps
function readEditInstructions() {
  const lines = document.getElementById('editInstructions').value.split('\n');
  const steps = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line !== '') {
      steps.push(line);
    }
  }

  return steps;
}

// Step 4: send the changes to the server
function saveChanges(event) {
  event.preventDefault();

  const recipe = {
    name: document.getElementById('editName').value.trim(),
    category: document.getElementById('editCategory').value,
    ingredients: readEditIngredients(),
    instructions: readEditInstructions()
  };

  if (recipe.name === '' || recipe.category === '' || recipe.instructions.length === 0) {
    editMessage.textContent = 'Enter a recipe name, cuisine, and cooking instructions.';
    return;
  }

  if (recipe.ingredients.length === 0) {
    editMessage.textContent = 'Add at least one ingredient.';
    return;
  }

  for (let i = 0; i < recipe.ingredients.length; i++) {
    const ingredient = recipe.ingredients[i];
    if (ingredient.name === '' || ingredient.unit === '' || !(ingredient.quantity > 0)) {
      editMessage.textContent = 'Each ingredient needs a name, unit, and quantity greater than 0.';
      return;
    }
  }

  const photo = editPhotoInput.files[0];
  if (photo && photo.size > 2 * 1024 * 1024) {
    editMessage.textContent = 'Photo must be 2 MB or smaller.';
    return;
  }

  // The server expects the details as text in "recipe", and the file in "photo"
  const formData = new FormData();
  formData.append('recipe', JSON.stringify(recipe));
  if (photo) {
    formData.append('photo', photo);
  }

  editSaveButton.disabled = true;
  editMessage.textContent = 'Saving changes...';

  // No Content-Type header here: the browser sets it for FormData
  fetch('/update-recipe/' + recipeId, {
    method: 'PUT',
    body: formData
  })
    .then(function (response) {
      return response.json().then(function (data) {
        if (response.ok) {
          editMessage.textContent = 'Recipe updated. Going back...';
          setTimeout(function () {
            window.location.href = '/';
          }, 1000);
        } else {
          editMessage.textContent = data.message || 'Could not update the recipe.';
          editSaveButton.disabled = false;
        }
      });
    });
}

editAddIngredientButton.addEventListener('click', function () {
  addEditIngredientRow();
});
editForm.addEventListener('submit', saveChanges);
loadRecipe();