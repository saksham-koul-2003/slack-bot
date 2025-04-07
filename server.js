import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import slackRoutes from "./routes/slack.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/slack", slackRoutes);

app.get("/", (req, res) => res.send("Slack Bot is running"));

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
