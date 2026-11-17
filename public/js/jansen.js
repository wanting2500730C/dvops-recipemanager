const updateRecipeForm = document.getElementById('updateRecipeForm');
const updateIngredientRows = document.getElementById('updateIngredients');
const updateIngredientTemplate = document.getElementById('updateIngredientTemplate');
const updateAddIngredientButton = document.getElementById('updateAddIngredientButton');
const updateButton = document.getElementById('updateButton');
const updateMessage = document.getElementById('updateMessage');

// Add one empty ingredient row to the form
function addUpdateIngredientRow() {
  const row = updateIngredientTemplate.content.firstElementChild.cloneNode(true);
  const removeButton = row.querySelector('.remove-ingredient');

  // The first row can't be removed, so there is always at least one
  removeButton.hidden = updateIngredientRows.children.length === 0;
  removeButton.addEventListener('click', function () {
    row.remove();
  });

  updateIngredientRows.appendChild(row);
}

// Read all ingredient rows into a list of objects
function readUpdateIngredients() {
  const ingredients = [];

  for (let i = 0; i < updateIngredientRows.children.length; i++) {
    const row = updateIngredientRows.children[i];

    ingredients.push({
      name: row.querySelector('.ingredient-name').value.trim(),
      quantity: row.querySelector('.ingredient-quantity').valueAsNumber,
      unit: row.querySelector('.ingredient-unit').value.trim()
    });
  }

  return ingredients;
}

// Turn the instructions textarea into a list of steps
function readUpdateInstructions() {
  const lines = document.getElementById('updateInstructions').value.split('\n');
  const steps = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line !== '') {
      steps.push(line);
    }
  }

  return steps;
}

// Send the changed recipe to the server
function updateRecipe(event) {
  event.preventDefault();

  const id = document.getElementById('updateId').value.trim();
  const name = document.getElementById('updateName').value.trim();
  const category = document.getElementById('updateCategory').value.trim();
  const ingredients = readUpdateIngredients();
  const instructions = readUpdateInstructions();

  if (id === '' || name === '' || category === '' || instructions.length === 0) {
    updateMessage.textContent = 'Please fill in the ID, name, category and instructions';
    return;
  }

  for (let i = 0; i < ingredients.length; i++) {
    const ingredient = ingredients[i];
    if (ingredient.name === '' || ingredient.unit === '' || !(ingredient.quantity > 0)) {
      updateMessage.textContent = 'Each ingredient needs a name, unit, and quantity above 0';
      return;
    }
  }

  updateButton.disabled = true;
  updateMessage.textContent = 'Updating recipe...';

  fetch('/update-recipe/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name,
      category: category,
      ingredients: ingredients,
      instructions: instructions
    })
  })
    .then(function (response) {
      updateButton.disabled = false;

      if (response.status === 404) {
        updateMessage.textContent = 'No recipe found with that ID';
        return;
      }

      updateMessage.textContent = 'Recipe updated';
      updateRecipeForm.reset();
      updateIngredientRows.replaceChildren();
      addUpdateIngredientRow();
    });
}

updateAddIngredientButton.addEventListener('click', addUpdateIngredientRow);
updateRecipeForm.addEventListener('submit', updateRecipe);
addUpdateIngredientRow();