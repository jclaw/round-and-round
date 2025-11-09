//Import express
import express from 'express';

// Create the Express app
const app = express();

// Set the port used for server traffic.
const port = 3000;

// Middleware to serve static files from 'public' directory
app.use(express.static('public'));

//Run server at port
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});