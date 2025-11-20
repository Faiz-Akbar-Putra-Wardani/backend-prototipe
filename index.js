const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const router = require('./routes');
const path = require('path')

const app = express();

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

const port = 3000;

app.get('/', (req, res) => {
    res.send("Hello World!");
});

app.get('/uploads/:filename', (req, res) => {
  res.sendFile(path.join(__dirname, 'uploads', req.params.filename));
});

app.use('/api', router);

app.listen(port, () => {
     console.log(`Server started on port ${port}`);
});