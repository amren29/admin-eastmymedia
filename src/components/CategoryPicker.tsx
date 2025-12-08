"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

const PREDEFINED_CATEGORIES = [
    "Industry Insights",
    "Company News",
    "Case Studies",
    "Guides",
    "Technology",
    "Marketing",
]

interface CategoryPickerProps {
    value: string
    onChange: (value: string) => void
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value
                        ? value
                        : "Select category..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Search category..."
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2">
                                <p className="text-sm text-slate-500 mb-2">No category found.</p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full h-8"
                                    onClick={() => {
                                        onChange(inputValue);
                                        setOpen(false);
                                        setInputValue("");
                                    }}
                                >
                                    <Plus className="mr-1 h-3 w-3" />
                                    Create "{inputValue}"
                                </Button>
                            </div>
                        </CommandEmpty>
                        <CommandGroup heading="Suggestions">
                            {PREDEFINED_CATEGORIES.map((category) => (
                                <CommandItem
                                    key={category}
                                    value={category}
                                    onSelect={(currentValue) => {
                                        onChange(category === value ? "" : category)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === category ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {category}
                                </CommandItem>
                            ))}
                        </CommandGroup>

                        {value && !PREDEFINED_CATEGORIES.includes(value) && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="Custom">
                                    <CommandItem value={value} onSelect={() => { }} disabled>
                                        <Check className="mr-2 h-4 w-4 opacity-100" />
                                        {value}
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
