const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const app = express();

app.use(helmet());
app.use(express.json());
const corsOptions = {
  origin: ["*", "http://localhost:3000", "https://siher.si3.space"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Routes
app.use("/auth", require("./routes/auth.routes"));
app.use("/image", require("./routes/image.routes"));
app.use("/webpage", require("./routes/webpage.routes"));
app.use("/subdomain", require("./routes/subdomain.routes"));
app.use("/video", require("./routes/video.routes"));
app.get("/", (_, res) => {
  return res.send("Server is running");
});

mongoose.connect(process.env.DB_URL).then(() => console.log("MongoDB connected"));
app.listen(5000, () => console.log(`Listening on port 5000`));
