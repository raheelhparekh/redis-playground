"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default({ host: "localhost", port: Number(6379) });
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
app.get("/", (req, res) => {
    return res.json({ status: "success" });
});
// rate limiting using redis
app.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const key = "rate-limit";
    const value = yield redis.get("rate-limit");
    if (value === null) {
        yield redis.set("rate-limit", 0);
        yield redis.expire("rate-limit", 60); // after 60 seconds expire
    }
    if (Number(value) > 10) {
        return res.status(429).json({ message: "Too many requests" });
    }
    yield redis.incr("rate-limit");
    next();
}));
app.get("/books", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // check cache in redis
    const cachedValue = yield redis.get("totalPageCount");
    if (cachedValue) {
        {
            console.log("Cache hitt");
            return res.json({ totalPageCount: Number(cachedValue) });
        }
    }
    const response = yield axios_1.default.get("https://api.freeapi.app/api/v1/public/books");
    const total = response.data.data.data.reduce((acc, curr) => { var _a, _b; return !((_a = curr.volumeInfo) === null || _a === void 0 ? void 0 : _a.pageCount) ? 0 : ((_b = curr.volumeInfo) === null || _b === void 0 ? void 0 : _b.pageCount) + acc; }, 0);
    // set cache
    console.log("Cache miss");
    yield redis.set("totalPageCount", total);
    return res.json({ totalPageCount: total });
}));
app.listen(PORT, () => console.log("Server is running at port", PORT));
