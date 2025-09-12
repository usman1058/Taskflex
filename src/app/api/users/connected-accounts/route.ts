// app/api/users/connected-accounts/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get connected accounts from the Account model
    const accounts = await db.account.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        provider: true,
        providerAccountId: true
      }
    })
    
    // Format for the frontend
    const formattedAccounts = accounts.map(account => ({
      id: account.provider,
      provider: account.provider.charAt(0).toUpperCase() + account.provider.slice(1),
      email: session.user.email || "",
      connected: true
    }))
    
    // Add common providers that aren't connected
    const commonProviders = ["github", "google", "twitter", "linkedin"]
    const connectedProviders = accounts.map(a => a.provider)
    
    for (const provider of commonProviders) {
      if (!connectedProviders.includes(provider)) {
        formattedAccounts.push({
          id: provider,
          provider: provider.charAt(0).toUpperCase() + provider.slice(1),
          email: session.user.email || "",
          connected: false
        })
      }
    }
    
    return NextResponse.json(formattedAccounts)
  } catch (error) {
    console.error("Error fetching connected accounts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { id } = request.params
    
    // Delete the account connection
    await db.account.deleteMany({
      where: {
        userId: session.user.id,
        provider: id
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error disconnecting account:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}