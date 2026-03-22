import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  try {
    const psCommand = `
      $app = New-Object -ComObject Shell.Application
      $folder = $app.BrowseForFolder(0, "Select AlgoForge repository folder", 0, 0)
      if ($folder) { Write-Output $folder.Self.Path }
    `;
    
    const { stdout } = await execAsync(`powershell -NoProfile -Command "${psCommand.replace(/\n/g, ';')}"`);
    const path = stdout.trim();
    
    if (!path) {
      return NextResponse.json({ error: "No folder selected" }, { status: 400 });
    }
    
    return NextResponse.json({ path });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
