const fs = require('node:fs');
const path = require('node:path');

const recipesFile = path.join(__dirname, 'recipes.json');
const uploadFolder = path.join(__dirname, '..', 'public', 'uploads');

const cuisines = ['Indian', 'Chinese', 'Japanese', 'Korean', 'Italian', 'Other'];

// Check the first bytes of the file to see if it is really a PNG or JPG
function getPhotoExtension(buffer) {
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  let isPng = true;

  for (let i = 0; i < pngSignature.length; i++) {
    if (buffer[i] !== pngSignature[i]) {
      isPng = false;
    }
  }

  if (isPng) {
    return 'png';
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }

  return null;
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// PUT /update-recipe/:id
function updateRecipe(req, res) {
  const body = req.body || {};
  const name = body.name;
  const category = body.category;
  const ingredients = body.ingredients;
  const instructions = body.instructions;

  // Check the details
  if (!hasText(name)) {
    return res.status(400).json({ message: 'Enter a recipe name.' });
  }

  if (!cuisines.includes(category)) {
    return res.status(400).json({ message: 'Select a valid cuisine.' });
  }

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ message: 'Add at least one ingredient.' });
  }

  for (let i = 0; i < ingredients.length; i++) {
    const ingredient = ingredients[i];
    if (
      !hasText(ingredient.name) ||
      !hasText(ingredient.unit) ||
      !Number.isFinite(ingredient.quantity) ||
      ingredient.quantity <= 0
    ) {
      return res.status(400).json({
        message: 'Each ingredient needs a name, unit, and quantity greater than 0.'
      });
    }
  }

  if (!Array.isArray(instructions) || instructions.length === 0) {
    return res.status(400).json({ message: 'Enter at least one cooking step.' });
  }

  // Check the new photo (if there is one)
  const photo = req.file;
  let extension = null;

  if (photo) {
    extension = getPhotoExtension(photo.buffer);
    if (extension === null) {
      return res.status(400).json({ message: 'Choose a JPG or PNG photo.' });
    }
  }

  // Find the recipe
  const recipes = JSON.parse(fs.readFileSync(recipesFile, 'utf8'));
  let recipe = null;

  for (let i = 0; i < recipes.length; i++) {
    if (recipes[i].id === req.params.id) {
      recipe = recipes[i];
    }
  }

  if (recipe === null) {
    return res.status(404).json({ message: 'Recipe not found.' });
  }

  // Replace the details
  recipe.name = name.trim();
  recipe.category = category;
  recipe.instructions = instructions;
  recipe.ingredients = [];

  for (let i = 0; i < ingredients.length; i++) {
    recipe.ingredients.push({
      name: ingredients[i].name.trim(),
      quantity: ingredients[i].quantity,
      unit: ingredients[i].unit.trim()
    });
  }

  // Replace the photo only if a new one was chosen
  if (photo) {
    if (recipe.image) {
      const oldPhoto = path.join(__dirname, '..', 'public', recipe.image);
      if (fs.existsSync(oldPhoto)) {
        fs.unlinkSync(oldPhoto);
      }
    }

    // Date.now() gives a new file name, so the browser doesn't show the old cached photo
    const fileName = recipe.id + '-' + Date.now() + '.' + extension;
    fs.mkdirSync(uploadFolder, { recursive: true });
    fs.writeFileSync(path.join(uploadFolder, fileName), photo.buffer);
    recipe.image = '/uploads/' + fileName;
  }

  fs.writeFileSync(recipesFile, JSON.stringify(recipes, null, 2) + '\n');
  res.json({ message: 'Recipe updated successfully.', recipe: recipe });
}

module.exports = { updateRecipe };