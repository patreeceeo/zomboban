import readline from "readline";
import { signUp } from "./src/server/auth";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

signUp(await question("username: "), await question("password: "));

rl.close();
