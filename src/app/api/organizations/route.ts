// app/api/organizations/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateAdminKey } from "@/lib/utils"; // Add this import

import { OrganizationType, OrganizationSize } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type") as OrganizationType | null
    const size = searchParams.get("size") as OrganizationSize | null
    
    // Get user role to determine permissions
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Build where clause based on user role
    const whereClause: any = {}
    
    // Add search conditions if provided
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { industry: { contains: search, mode: "insensitive" } }
      ]
    }
    
    // Add type filter if provided
    if (type) {
      whereClause.type = type
    }
    
    // Add size filter if provided
    if (size) {
      whereClause.size = size
    }
    
    // Add permission-based filtering
    if (user.role !== "ADMIN") {
      // For regular users, only show organizations they're members of
      if (whereClause.OR) {
        // If there are already OR conditions (from search), we need to add the member filter
        whereClause.AND = [
          {
            members: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      } else {
        // If no OR conditions, just add the member filter directly
        whereClause.members = {
          some: {
            userId: session.user.id
          }
        }
      }
    }
    
    const organizations = await db.organization.findMany({
      where: whereClause,
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        projects: {
          select: { id: true, name: true, key: true }
        },
        teams: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            projects: true,
            teams: true,
            members: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    
    return NextResponse.json(organizations)
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user already has organizations
    const userOrganizations = await db.organizationMember.findMany({
      where: { userId: session.user.id }
    });
    
    if (session.user.role !== "ADMIN" && userOrganizations.length > 0) {
      return NextResponse.json({ error: "You can only create one organization" }, { status: 403 });
    }
    
    const body = await request.json();
    const { 
      name, 
      description, 
      type,
      industry,
      size,
      website,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      timezone,
      memberIds = [] 
    } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }
    
    // Generate admin key for security
    const adminKey = generateAdminKey(); // This should now work
    
    // Create the organization
    const organization = await db.organization.create({
      data: {
        name,
        description,
        type: type || "COMPANY",
        industry,
        size,
        website,
        phone,
        address,
        city,
        state,
        country,
        postalCode,
        timezone,
        adminKey
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        _count: {
          select: {
            projects: true,
            teams: true,
            members: true
          }
        }
      }
    });
    
    // Add the creator as an owner
    await db.organizationMember.create({
      data: {
        userId: session.user.id,
        organizationId: organization.id,
        role: "OWNER"
      }
    });
    
    // Add additional members if provided
    if (memberIds.length > 0) {
      await db.organizationMember.createMany({
        data: memberIds.map((userId: string) => ({
          userId,
          organizationId: organization.id,
          role: "MEMBER"
        }))
      });
    }
    
    return NextResponse.json({
      ...organization,
      adminKey: session.user.role === "ADMIN" || userOrganizations.length === 0 ? organization.adminKey : undefined
    });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}