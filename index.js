const express = require('express');
const app = express();

const { updateRecipe } = require('./utils/Jansen-Utils.js');

app.use(express.json());
app.use(express.static('public'));

app.put('/update-recipe/:id', updateRecipe);

const PORT = 5000;
app.listen(PORT, function () {
  console.log('Server running at http://localhost:' + PORT);
});