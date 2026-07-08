

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
  } from "@/components/ui/sidebar"
  
  import {
    Home,
    BookOpen,
    Settings,
    LayoutGrid,
    Users,
  } from "lucide-react"
  
  import { Link, useNavigate } from "react-router-dom"
  import { ThemeToggle } from "@/components/theme-toggle"
  import { Button } from "@/components/ui/button"
  import { LogOut } from "lucide-react"
  
  const platformItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Models", url: "/models", icon: LayoutGrid },
    { title: "Documentation", url: "/docs", icon: BookOpen },
    { title: "Settings", url: "/settings", icon: Settings },
  ]
  
  const projectItems = [
    { title: "All Projects", url: "/design", icon: LayoutGrid },
    { title: "Starred", url: "/sales", icon: Users },
  ]
  
  export function AppSidebar() {

    return (
      <Sidebar>
        {/* Header */}
        <SidebarHeader>
          <div className="flex items-center justify-between px-2 py-1">
            <span className="font-[family-name:var(--primary-font)] text-xl font-semibold">
              LightX
            </span>
            <ThemeToggle />
          </div>
        </SidebarHeader>
  
        {/* Content */}
        <SidebarContent>
          {/* Platform */}
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
  
            <SidebarGroupContent>
              <SidebarMenu>
                {platformItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton>
                      <Link to={item.url} className="flex items-center gap-2 cursor-pointer">
                        <item.icon className="w-4 h-4" />
                        <span className="font-[family-name:var(--primary-font)] font-medium text-gray-700 dark:text-gray-200 dark:font-normal">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
  
          {/* Projects */}
          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
  
            <SidebarGroupContent>
              <SidebarMenu>
                {projectItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton>
                      <Link to={item.url} className="flex items-center gap-2 cursor-pointer">
                        <item.icon className="w-4 h-4" />
                        <span className="font-[family-name:var(--primary-font)] font-medium text-gray-700 dark:text-gray-200 dark:font-normal">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
  
          <SidebarGroup>
            <SidebarGroupLabel>Recents</SidebarGroupLabel>
  
            <SidebarGroupContent>
              <SidebarMenu>
                {projectItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton>
                      <Link to={item.url} className="flex items-center gap-2 cursor-pointer">
                        <item.icon className="w-4 h-4" />
                        <span className="font-[family-name:var(--primary-font)] font-medium text-gray-700 dark:text-gray-200 dark:font-normal">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
  
        {/* Footer */}
        <SidebarFooter>
          <div className="flex items-center justify-between gap-2 p-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                
              </div>
  
              <div className="flex min-w-0 flex-col text-sm">
                <span className="truncate font-medium"></span>
                <span className="truncate text-xs text-muted-foreground">
                 
                </span>
              </div>
            </div>
  
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
             
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
    )
  }