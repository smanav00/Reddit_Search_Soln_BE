const express = require("express");
const axios = require("axios");
const router = express.Router();

const REDDIT_API = "https://oauth.reddit.com";
let accessToken = null;

// Middleware for Reddit OAuth
const authenticateReddit = async (req, res, next) => {
  if (!accessToken) {
    try {
      const response = await axios.post(
        "https://www.reddit.com/api/v1/access_token",
        "grant_type=client_credentials",
        {
          auth: {
            username: process.env.REDDIT_CLIENT_ID,
            password: process.env.REDDIT_SECRET,
          },
          headers: {
            "User-Agent": process.env.REDDIT_USER_AGENT,
          },
        }
      );
      accessToken = response.data.access_token;
    } catch (error) {
      return res.status(500).json({ error: "Authentication failed" });
    }
  }
  next();
};

// Fetch posts from Reddit
router.get("/posts", authenticateReddit, async (req, res) => {
  const {
    subreddit,
    keyword,
    sort,
    limit = 10,
    after = null,
    before = null,
  } = req.query;

  if (!subreddit || !keyword) {
    return res
      .status(400)
      .json({ error: "Subreddit and keyword are required." });
  }

  try {
    const response = await axios.get(
      `https://oauth.reddit.com/r/${subreddit}/search`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "YourApp/1.0",
        },
        params: {
          q: keyword,
          sort,
          limit,
          before,
          after,
          count: 10, // required as per documentation to get the before pointer
          restrict_sr: true,
        },
      }
    );

    // console.log(response.data.data);

    res.json({
      posts: response.data.data.children.map((child) => child.data),
      after: response.data.data.after,
      before: response.data.data.before,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
