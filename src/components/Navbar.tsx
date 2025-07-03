"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogIn } from 'lucide-react';
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
            <Button variant="outline" size="sm">
              <div className="flex items-center">
                <LogIn color="green" className="mr-1" /> Connexion
              </div>
            </Button>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

