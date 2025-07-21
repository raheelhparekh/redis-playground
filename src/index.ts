import express from "express";
import axios from "axios";
import Redis from "ioredis";

const redis = new Redis({ host: "localhost", port: Number(6379) });

const app = express();

const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
  return res.json({ status: "success" });
});

// rate limiting using redis
app.use(async (req, res, next) => {
  const key = "rate-limit";
  const value = await redis.get("rate-limit");

  if (value === null) {
    await redis.set("rate-limit", 0);
    await redis.expire("rate-limit", 60); // after 60 seconds expire
  }
  if (Number(value) > 10) {
    return res.status(429).json({ message: "Too many requests" });
  }

  await redis.incr("rate-limit");
  next();
});

app.get("/books", async (req, res) => {
  // check cache in redis
  const cachedValue = await redis.get("totalPageCount");
  if (cachedValue) {
    {
      console.log("Cache hitt");
      return res.json({ totalPageCount: Number(cachedValue) });
    }
  }

  const response = await axios.get(
    "https://api.freeapi.app/api/v1/public/books"
  );
  const total = response.data.data.data.reduce(
    (acc: number, curr: { volumeInfo?: { pageCount?: number } }) =>
      !curr.volumeInfo?.pageCount ? 0 : curr.volumeInfo?.pageCount + acc,
    0
  );

  // set cache
  console.log("Cache miss");
  await redis.set("totalPageCount", total);

  return res.json({ totalPageCount: total });
});

app.listen(PORT, () => console.log("Server is running at port", PORT));
