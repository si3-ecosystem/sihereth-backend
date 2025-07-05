exports.corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:5500",
      "http://127.0.0.1:5500/temp/Kara-Howard.html",
      "https://siher.si3.space",
      "https://backend.si3.space",
    ];
    const allowedDomainSuffixes = [".siher.eth.link", ".siher.eth.limo"];
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      allowedDomainSuffixes.some((suffix) => origin.endsWith(suffix))
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  exposedHeaders: ["Set-Cookie"],
};
