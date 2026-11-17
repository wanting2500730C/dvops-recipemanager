const updateButton = document.getElementById('updateButton');
const updateMessage = document.getElementById('updateMessage');

// Send the changed recipe to the server
function updateRecipe() {
  const id = document.getElementById('updateId').value;
  const name = document.getElementById('updateName').value;
  const ingredients = document.getElementById('updateIngredients').value;
  const instructions = document.getElementById('updateInstructions').value;

  if (id === '' || name === '' || ingredients === '' || instructions === '') {
    updateMessage.textContent = 'Please fill in all fields';
    return;
  }

  fetch('/update-recipe/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name,
      ingredients: ingredients,
      instructions: instructions
    })
  })
    .then(function (response) {
      if (response.status === 404) {
        updateMessage.textContent = 'No recipe found with that ID';
        return;
      }

      updateMessage.textContent = 'Recipe updated';
      document.getElementById('updateId').value = '';
      document.getElementById('updateName').value = '';
      document.getElementById('updateIngredients').value = '';
      document.getElementById('updateInstructions').value = '';
    });
}

updateButton.addEventListener('click', updateRecipe);