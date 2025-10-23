import express from "express";
import cors from "cors";
import pokemonRoutes from "./routes/pokemon.js";
import battleRoutes from "./routes/battle.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/pokemon", pokemonRoutes);
app.use("/battle", battleRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Backend rodando na porta ${PORT}`));
