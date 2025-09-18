import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateAdminKey } from "@/lib/utils"; // Make sure this import is correct

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if the organization exists and user has permission
    const organization = await db.organization.findUnique({
      where: { id: params.id },
      include: {
        members: {
          select: {
            userId: true,
            role: true
          }
        }
      }
    });
    
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    
    // Check if user has permission to regenerate the key
    const userMembership = organization.members.find(member => member.userId === session.user.id);
    const hasPermission = session.user.role === "ADMIN" || 
                         (userMembership && (userMembership.role === "OWNER" || userMembership.role === "ADMIN"));
    
    if (!hasPermission) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    // Generate a new admin key
    const newAdminKey = generateAdminKey(); // This should now work
    
    // Update the organization with the new key
    await db.organization.update({
      where: { id: params.id },
      data: { adminKey: newAdminKey }
    });
    
    return NextResponse.json({ adminKey: newAdminKey });
  } catch (error) {
    console.error("Error regenerating admin key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}