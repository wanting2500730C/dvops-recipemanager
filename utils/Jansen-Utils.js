const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'recipes.json');

// PUT /update-recipe/:id
function updateRecipe(req, res) {
  const text = fs.readFileSync(filePath, 'utf8');
  const recipes = JSON.parse(text);
  const idToUpdate = Number(req.params.id);

  let found = false;
  for (let i = 0; i < recipes.length; i++) {
    if (recipes[i].id === idToUpdate) {
      recipes[i].name = req.body.name;
      recipes[i].ingredients = req.body.ingredients;
      recipes[i].instructions = req.body.instructions;
      found = true;
    }
  }

  if (found === false) {
    res.status(404).json({ message: 'Recipe not found' });
    return;
  }

  fs.writeFileSync(filePath, JSON.stringify(recipes, null, 2));
  res.json({ message: 'Recipe updated' });
}

module.exports = { updateRecipe };