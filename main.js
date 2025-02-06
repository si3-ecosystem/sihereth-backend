const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const imageRoutes = require("./routes/image.routes");
const webpageRoutes = require("./routes/webpage.routes");
const subdomainRoutes = require("./routes/subdomain.routes");
const videoRoutes = require("./routes/video.routes");

const app = express();
app.use(express.json());
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

mongoose
  .connect(process.env.DB_URL || "mongodb://127.0.0.1:27017/siher")
  .then(() => console.log("MongoDB connected"));

app.use("/api/auth", authRoutes);
app.use("/api/image", imageRoutes);
app.use("/api/webpage", webpageRoutes);
app.use("/api/subdomain", subdomainRoutes);
app.use("/api/video", videoRoutes);

app.get("/", (_, res) => {
  return res.send("App");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

module.exports = app;
