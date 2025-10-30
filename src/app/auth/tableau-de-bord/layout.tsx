"use client"
import { useSession } from "next-auth/react"
 
export default function Dashboard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
 
  if (session?.user) {
    return <div>{children}</div>
  }
 
  return <p>You are not authorized to view this page!</p>
}