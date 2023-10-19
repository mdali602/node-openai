require("dotenv").config();
const express = require("express");
const { Configuration, OpenAIApi } = require("openai");
// import { Configuration, OpenAIAPI } from 'openai';
// const OpenAI = require("openai");

const app = express();
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});
app.use(express.json());
app.use(express.urlencoded());

const { PORT, API_KEY } = process.env;

const config = new Configuration({
  apiKey: API_KEY,
});

const openai = new OpenAIApi(config);
function safelyParseJSON(json) {
  var parsed;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    console.log(e);
  }

  return parsed; // Could be undefined!
}

app.post("/api/completion", (req, res) => {
  const response = openai.createChatCompletion(
    {
      model: "gpt-3.5-turbo",
      max_tokens: 5,
      messages: [
        {
          role: "user",
          content: req.body.prompt,
        },
      ],
      stream: true,
    },
    { responseType: "stream" }
  );
  response.then((resp) => {
    resp.data.on("data", (chunk) => {
      const payloads = chunk.toString().split("\n\n");

      for (const payload of payloads) {
        if (payload.includes("[DONE]")) {
          res.end();
          return;
        }
        if (payload.startsWith("data")) {
          const data = safelyParseJSON(payload.replace("data: ", ""));
          try {
            const text = data.choices[0].delta?.content;
            if (text) {
              console.log(text);
              res.write(text);
            }
          } catch (error) {}
        }
      }
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is live on ${PORT}`);
});
