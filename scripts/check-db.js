/* eslint-disable @typescript-eslint/no-require-imports */
const mysql = require("mysql2/promise");
require("dotenv").config({ path: ".env.local" });

async function checkDb() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "ebay_clone",
    });

    const [tables] = await connection.execute("SHOW TABLES");
    console.log(`Database connected. Tables found: ${tables.length}`);
    tables.forEach((t) => console.log(`  - ${Object.values(t)[0]}`));
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
}

checkDb();
