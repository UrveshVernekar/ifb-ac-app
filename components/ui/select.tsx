"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, Search } from "lucide-react"

import { cn } from "@/lib/utils"

const SelectSearchContext = React.createContext<{
  searchQuery: string;
  setSearchQuery: (query: string) => void;
} | null>(null);

const extractText = (node: React.ReactNode): string => {
  if (node == null) return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (React.isValidElement(node)) {
    return extractText((node.props as any).children)
  }
  return ""
}

const nodeMatchesQuery = (node: React.ReactNode, query: string): boolean => {
  if (!query) return true
  if (node == null) return false
  if (typeof node === "string" || typeof node === "number") {
    return String(node).toLowerCase().includes(query.toLowerCase())
  }
  if (React.isValidElement(node)) {
    const props = node.props as any
    if (props["data-slot"] === "select-item" || props["value"] !== undefined) {
      const text = extractText(props.children || props.label || "").toLowerCase()
      return text.includes(query.toLowerCase())
    }
    if (props.children) {
      if (Array.isArray(props.children)) {
        return props.children.some((child: React.ReactNode) => nodeMatchesQuery(child, query))
      }
      return nodeMatchesQuery(props.children, query)
    }
  }
  return false
}

const countItems = (node: React.ReactNode): number => {
  if (node == null) return 0
  if (Array.isArray(node)) {
    return node.reduce((acc: number, child: React.ReactNode) => acc + countItems(child), 0)
  }
  if (React.isValidElement(node)) {
    const props = node.props as any
    if (props["data-slot"] === "select-item" || props["value"] !== undefined) {
      return 1
    }
    if (props.children) {
      return countItems(props.children)
    }
  }
  return 0
}

function Select({
  children,
  open,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [localOpen, setLocalOpen] = React.useState(false)

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : localOpen

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSearchQuery("")
    }
    if (isControlled) {
      onOpenChange?.(nextOpen)
    } else {
      setLocalOpen(nextOpen)
    }
  }

  return (
    <SelectSearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      <SelectPrimitive.Root open={isOpen} onOpenChange={handleOpenChange} {...props}>
        {children}
      </SelectPrimitive.Root>
    </SelectSearchContext.Provider>
  )
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-xs whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  const context = React.useContext(SelectSearchContext)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const totalItems = countItems(children)
  const showSearch = totalItems > 5

  React.useEffect(() => {
    if (context && showSearch && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [context, showSearch])

  const query = context?.searchQuery || ""
  const childrenArray = React.Children.toArray(children)
  const hasVisibleItems = !query || childrenArray.some(child => nodeMatchesQuery(child, query))

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-card/98 backdrop-blur-md text-popover-foreground border-border/80 shadow-lg shadow-black/5 dark:shadow-black/20 rounded-xl border relative z-50 max-h-[350px] min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-hidden flex flex-col p-1.5 duration-100 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        align={align}
        {...props}
      >
        {context && showSearch && (
          <div 
            className="flex items-center gap-2 border-b border-border/40 px-2.5 pb-2 pt-1 flex-shrink-0" 
            onKeyDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
            <input
              ref={inputRef}
              placeholder="Search..."
              value={context.searchQuery}
              onChange={(e) => context.setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none border-none focus:ring-0 focus:outline-hidden py-0"
            />
          </div>
        )}

        <SelectScrollUpButton />
        
        <SelectPrimitive.Viewport
          className={cn(
            "p-0.5 overflow-y-auto max-h-[260px] flex-grow",
            position === "popper" &&
              "w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
          
          {!hasVisibleItems && (
            <div className="text-muted-foreground/60 px-4 py-8 text-center text-xs flex flex-col items-center justify-center gap-1.5 animate-in fade-in-50 duration-200">
              <Search className="h-5 w-5 text-muted-foreground/30 stroke-[1.5]" />
              <span>No options match "{query}"</span>
            </div>
          )}
        </SelectPrimitive.Viewport>

        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground/80 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  const context = React.useContext(SelectSearchContext)
  
  if (context && context.searchQuery) {
    const text = extractText(children).toLowerCase()
    const query = context.searchQuery.toLowerCase()
    if (!text.includes(query)) {
      return null
    }
  }

  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-blue-50/80 focus:text-blue-900 dark:focus:bg-blue-950/30 dark:focus:text-blue-200 [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-md py-1.5 pr-8 pl-3 text-xs outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors duration-150 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span className="absolute right-2.5 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-3.5 text-blue-600 dark:text-blue-400" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border/60 pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-muted-foreground/60 hover:text-foreground",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-muted-foreground/60 hover:text-foreground",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
