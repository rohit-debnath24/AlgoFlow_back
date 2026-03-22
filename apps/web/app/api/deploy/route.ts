import { NextResponse } from "next/server";
import { spawn, execSync } from "child_process";
import path from "path";
import os from "os";
import fs from "fs";

export async function POST(request: Request) {
  try {
    const { repoUrl, backendPath } = await request.json();
    
    // Legacy support for direct path (local)
    let finalPath = backendPath;

    // Remote Repo Support: Git Clone into a Temp Directory
    if (repoUrl) {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "algoforge-deploy-"));
      console.log(`Cloning ${repoUrl} into ${tmpDir}...`);
      
      try {
        execSync(`git clone ${repoUrl} .`, { cwd: tmpDir, stdio: 'pipe' });
        finalPath = tmpDir;
      } catch (cloneErr) {
        return NextResponse.json({ error: "Failed to clone repository" }, { status: 500 });
      }
    }

    if (!finalPath) {
      return NextResponse.json({ error: "No path or repoUrl provided" }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), "../../deploy-backend.ps1");
    
    // Spawn docker-compose deployment script in the background pointing to the new folder
    const powershell = spawn("powershell.exe", ["-ExecutionPolicy", "Bypass", "-File", scriptPath, "-BackendPath", finalPath], {
      detached: true,
      stdio: "ignore"
    });
    
    powershell.unref();

    return NextResponse.json({ success: true, message: "Deployment started in the background." });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
