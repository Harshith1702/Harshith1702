// scripts/update-readme.js
// fetches live LeetCode stats and swaps them into README.md between the marker comments.
// same public GraphQL endpoint leetcode-discord-reporter already uses, no auth needed.

const fs = require("fs");

const USERNAME = process.env.LEETCODE_USERNAME || "Harshith-2007";
const README_PATH = "README.md";
const START = "<!-- LEETCODE-STATS:START -->";
const END = "<!-- LEETCODE-STATS:END -->";

const QUERY = `
  query userStats($username: String!) {
    matchedUser(username: $username) {
      submitStats {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
    userContestRanking(username: $username) {
      rating
    }
  }
`;

async function main() {
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { username: USERNAME } }),
  });

  if (!res.ok) {
    throw new Error(`LeetCode API request failed: ${res.status}`);
  }

  const { data } = await res.json();

  const total = data?.matchedUser?.submitStats?.acSubmissionNum?.find(
    (d) => d.difficulty === "All"
  )?.count ?? "—";

  const rating = data?.userContestRanking?.rating
    ? Math.round(data.userContestRanking.rating)
    : "—";

  const synced = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const block = `${START}\n\`${total} solved\` · \`${rating} rating\` · synced \`${synced}\`\n${END}`;

  const readme = fs.readFileSync(README_PATH, "utf8");
  const pattern = new RegExp(`${START}[\\s\\S]*?${END}`);

  if (!pattern.test(readme)) {
    throw new Error("Marker block not found in README.md — add the START/END comments first.");
  }

  fs.writeFileSync(README_PATH, readme.replace(pattern, block));
  console.log(`updated: ${total} solved, ${rating} rating, synced ${synced}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
