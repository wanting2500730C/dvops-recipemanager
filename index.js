const express = require('express');
const path = require('node:path');
const { createRecipe } = require('./utils/XIAOTONG');
const { updateRecipe } = require('./utils/Jansen-Utils.js');

const app = express();
const PORT = process.env.PORT || 5050;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/add-recipe', createRecipe);
app.put('/update-recipe/:id', updateRecipe);

const server = app.listen(PORT, function () {
    console.log(`Recipe Manager running at http://localhost:${PORT}`);
});

module.exports = { app, server };