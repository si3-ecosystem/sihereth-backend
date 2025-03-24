const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const auth = require("./middlewares/auth");
require("dotenv").config();

const app = express();

app.use(helmet());
app.use(express.json());
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://siher.si3.space",
      "https://backend.si3.space",
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

// Routes
app.use("/auth", require("./routes/auth.routes"));
app.use("/users", auth, require("./routes/users.routes"));
app.use("/image", auth, require("./routes/image.routes"));
app.use("/webpage", auth, require("./routes/webpage.routes"));
app.use("/domain", auth, require("./routes/domain.routes"));
app.use("/video", auth, require("./routes/video.routes"));
app.get("/", (_, res) => {
  return res.send("Server is running");
});

mongoose.connect(process.env.DB_URL).then(() => console.log("MongoDB connected"));
app.listen(5000, () => console.log(`Listening on port 5000`));
