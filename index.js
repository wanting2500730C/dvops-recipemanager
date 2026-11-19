const express = require('express');
const path = require('node:path');
const { createRecipe, uploadRecipePhoto } = require('./utils/XIAOTONG');
const { updateRecipe } = require('./utils/Jansen-Utils.js');
const { readRecipes, readRecipeById } = require('./utils/WantingUtil.js');

const app = express();
const PORT = process.env.PORT || 5050;

app.use(express.json());

// Set read.html as the default homepage.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'read.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.post('/add-recipe', uploadRecipePhoto, createRecipe);
app.put('/update-recipe/:id', updateRecipe);

app.get('/recipes', readRecipes);
app.get('/recipes/:id', readRecipeById);

const server = app.listen(PORT, function () {
    console.log(`Recipe Manager running at http://localhost:${PORT}`);
});

module.exports = { app, server };