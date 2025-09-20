
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { PanelLeft, X } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "../icons/logo"


type SidebarContext = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  isMobile: boolean
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

const SidebarProvider = ({
  children,
  initialOpen = true,
}: {
  children: React.ReactNode
  initialOpen?: boolean
}) => {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = React.useState(isMobile ? false : initialOpen)

  React.useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    } else {
      setIsOpen(initialOpen)
    }
  }, [isMobile, initialOpen])

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, isMobile }}>
      {children}
    </SidebarContext.Provider>
  )
}

const Sidebar = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const { isOpen, isMobile, setIsOpen } = useSidebar()

  const sidebarContent = (
    <>
      <SheetHeader className="p-4 border-b">
         <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <Logo className="h-8 w-8 text-primary" />
              <p className="font-cursive text-primary -mt-1 tracking-widest">home</p>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Organiza+
            </h1>
          </div>
      </SheetHeader>
      <nav className="flex flex-col p-4 space-y-2">{children}</nav>
    </>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-72 p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-card transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-20",
        className
      )}
    >
      {sidebarContent}
    </aside>
  )
}

const SidebarTrigger = () => {
  const { isOpen, setIsOpen } = useSidebar()
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={() => setIsOpen(!isOpen)}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

const sidebarItemVariants = cva(
  "flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted",
  {
    variants: {
      isActive: {
        true: "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
      },
    },
  }
)

const SidebarItem = ({
  icon,
  children,
  isActive,
  onClick,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  isActive: boolean
  onClick: () => void
}) => {
  const { isOpen } = useSidebar()

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(sidebarItemVariants({ isActive }), "w-full justify-start")}
    >
      <div className="w-5">{icon}</div>
      <span className={cn("truncate", !isOpen && "md:hidden")}>{children}</span>
    </Button>
  )
}

export {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarItem,
}
