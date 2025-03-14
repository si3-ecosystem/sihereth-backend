const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use("/auth", require("./routes/auth.routes"));
app.use("/image", require("./routes/image.routes"));
app.use("/webpage", require("./routes/webpage.routes"));
app.use("/subdomain", require("./routes/subdomain.routes"));
app.use("/video", require("./routes/video.routes"));

app.get("/", (_, res) => {
  return res.send("App");
});

mongoose.connect(process.env.DB_URL).then(() => console.log("MongoDB connected"));
app.listen(5000, () => console.log(`Listening on port ${5000}`));

module.exports = app;
