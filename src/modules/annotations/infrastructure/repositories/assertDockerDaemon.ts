import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function assertDockerIsRunning() {
  try {
    await execAsync("docker info");
  } catch (err) {
    throw new Error(
      "Docker daemon is not running. Please start Docker before running the tests."
    );
  }
}
