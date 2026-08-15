import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

console.log("DATABASE_URL:", url);
const parsed = new URL(url);
console.log("host:", parsed.hostname);
console.log("port:", parsed.port);
console.log("user:", decodeURIComponent(parsed.username));
console.log("password:", decodeURIComponent(parsed.password));
console.log("database:", parsed.pathname.replace("/", ""));

const pool = mysql.createPool({
  host: parsed.hostname,
  port: Number(parsed.port) || 3306,
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: parsed.pathname.replace("/", ""),
});

try {
  const [rows] = await pool.execute("SELECT 1 AS ok");
  console.log("Connected!", rows);
  const [courses] = await pool.execute("SELECT COUNT(*) AS count FROM courses");
  console.log("Courses:", courses);
  await pool.end();
} catch (err) {
  console.error("DB ERROR:", err.message);
  await pool.end();
}
