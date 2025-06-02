const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const auth = require("./middlewares/auth");
const { corsOptions } = require("./utils/cors");
require("dotenv").config();

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

app.use("/auth", require("./routes/auth.routes"));
app.use("/users", require("./routes/users.routes"));
app.use("/webcontent", auth, require("./routes/webcontent.routes"));
app.use("/domain", auth, require("./routes/domain.routes"));
app.get("/", (_, res) => {
  return res.send("Server is running");
});

mongoose.connect(process.env.DB_URL).then(() => console.log("MongoDB connected"));
app.listen(5000, () => console.log("Listening on port 5000"));
