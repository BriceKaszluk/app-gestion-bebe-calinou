"use client"

import * as React from "react"
import { AuthButton } from "@/components/auth/AuthButton";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"

export function Navbar() {
  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <AuthButton />
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

