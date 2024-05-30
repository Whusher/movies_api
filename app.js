const express = require("express"); //Utilizando Common JS
const movies = require("./movies.json");
const crypto = require("node:crypto");
const { validateMovie, validatePartialMovie } = require("./schemas/movies");

const app = express();
app.disable("x-powered-by"); //Deshabilitar flag de entorno
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hola desde el backend" });
});

app.get("/movies", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");

  const { genre, title } = req.query;
  if (genre) {
    const filteredMovies = movies.filter((movie) =>
      movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
    );
    return res.json(filteredMovies);
  }
  if (title) {
    const movieByTitle = movies.find((movie) => movie.title === title);
    return res.json(movieByTitle);
  }
  res.json(movies);
});

app.get("/movies/:id", (req, res) => {
  const { id } = req.params; //podemos extraerlo del query URL para capturar esa parte
  const movie = movies.find((movie) => movie.id === id);
  if (movie) return res.json(movie);
  res.status(404).json({ message: "Movie not found" });
});

app.post("/movies", (req, res) => {
  const result = validateMovie(req.body); //Validacion del input de la movie
  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }
  //Ya que validamos con zod podemos usar todo el objeto del body si es correcto
  const newMovie = {
    id: crypto.randomUUID(), //uuid v4
    ...result.data,
  };
  //Esto no es rest a falta de DB
  movies.push(newMovie);
  res.status(201).json(newMovie); //Actualizar la cache del cliente
});

app.delete("/movies/:id", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*")
  const { id } = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ message: "Movie not found" });
  }

  movies.splice(movieIndex, 1);

  return res.json({ message: "Movie deleted" });
});

app.patch("/movies/:id", (req, res) => {
  const result = validatePartialMovie(req.body);

  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  const { id } = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ message: "Movie not found" });
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data,
  };

  movies[movieIndex] = updateMovie;

  return res.json(updateMovie);
});

//PARA METODOS COMPLEJOS COMO PATH/PUT/DELETE SE REQUIERE OPTIONS
app.options('/movies/:id',(req, res) => {
  // Se permite el acceso al origen
  res.header("Access-Control-Allow-Origin", "*")
  //Se le permite el uso de los metodos 
  res.header('Access-Control-Allow-Methods','GET, PUT, PATCH, POST, DELETE')
  res.sendStatus(200)
})

const PORT = process.env.PORT ?? 1234;

app.listen(PORT, () => {
  console.log(`API is listening on port: ${PORT}`);
});
