import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '@algoforge/database';

export async function GET(req: Request) {
  try {
    const nodes = await prisma.providerNode.findMany({
      include: {
        provider: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ nodes });
  } catch (error) {
    console.error('Failed to fetch nodes:', error);
    return NextResponse.json({ error: 'Failed to fetch nodes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { endpointUrl, cpuCoreCount, ramGb, bidRateMicroAlgos } = body;

    if (!endpointUrl || !cpuCoreCount || !ramGb || !bidRateMicroAlgos) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const email = session.user.email;
    const name = session.user.name || email;

    // Find or create the Provider
    const provider = await prisma.provider.upsert({
      where: { githubId: email },
      update: {},
      create: {
        githubId: email,
        name: name,
        reputation: 100,
      },
    });

    // Create the Node
    const node = await prisma.providerNode.create({
      data: {
        providerId: provider.id,
        endpointUrl,
        cpuCoreCount: Number(cpuCoreCount),
        ramGb: Number(ramGb),
        bidRateMicroAlgos: Number(bidRateMicroAlgos),
        status: 'active',
      },
    });

    return NextResponse.json({ node });
  } catch (error) {
    console.error('Failed to create node:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
