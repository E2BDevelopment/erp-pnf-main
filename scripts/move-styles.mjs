import { readFileSync, writeFileSync, unlinkSync } from "node:fs";

const original = readFileSync("src/styles.css", "utf8");
const body = original.replace(
  /^@import "tailwindcss" source\(none\);\r?\n@source "\.\.\/src";\r?\n@import "tw-animate-css";\r?\n/,
  "",
);
const header = '@import "tailwindcss" source(none);\n@source "../";\n@import "tw-animate-css";\n\n';
writeFileSync("src/app/globals.css", header + body, "utf8");
unlinkSync("src/styles.css");
console.log("globals.css created from styles.css");
