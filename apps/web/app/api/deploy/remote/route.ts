import { NextResponse } from "next/server";
import { prisma } from "@algoforge/database";

export async function POST(req: Request) {
  try {
    const { repoUrl, directory, nodeId, token } = await req.json();

    if (!repoUrl || !nodeId) {
      return NextResponse.json({ error: "Missing repoUrl or nodeId" }, { status: 400 });
    }

    const node = await prisma.providerNode.findUnique({
      where: { id: nodeId },
    });

    if (!node) {
      return NextResponse.json({ error: "Provider Node not found" }, { status: 404 });
    }

    // Forward deployment request to the specific chosen node
    const nodeEndpoint = new URL("/deploy-repo", node.endpointUrl).toString();

    const response = await fetch(nodeEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ repoUrl, directory, token }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Node failed to process deployment");
    }

    return NextResponse.json({ success: true, message: data.message });
  } catch (error: any) {
    console.error("Remote deployment error:", error);
    
    // Better user feedback if the node URL is unreachable
    let errorMessage = error.message || "Unknown error occurred";
    if (error.cause?.code === "ENOTFOUND") {
      errorMessage = `The node's endpoint address (${error.cause.hostname}) could not be resolved. The provider might be offline or registered an invalid URL.`;
    } else if (error.cause?.code === "ECONNREFUSED") {
      errorMessage = `Connection refused. The node's server at port ${error.cause.port} is down or unresponsive.`;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
