const fs = require('fs');
let file = fs.readFileSync('app/actions.ts', 'utf8');

file = file.replace(
  "export async function removeTransactionAction(id: string) {",
  `export async function removeTransactionAction(id: string) {
  console.log("--> Action removeTransactionAction called with id:", id);
  try {`
).replace(
  "revalidatePath('/', 'layout');\n}",
  `revalidatePath('/', 'layout');
  console.log("--> Action removeTransactionAction success!");
  } catch(e) {
    console.error("--> Action removeTransactionAction error:", e);
    throw e;
  }
}`
);

fs.writeFileSync('app/actions.ts', file);
