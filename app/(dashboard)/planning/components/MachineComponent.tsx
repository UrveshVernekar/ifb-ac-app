// app/(dashboard)/planning/components/MachineComponent.tsx
import React from "react";
import { Button } from "@/components/ui/button";

interface MachineComponentProps {
    selectedMachine: string;
    onMachineChange: (machine: string) => void;
}

export default function MachineComponent({ selectedMachine, onMachineChange }: MachineComponentProps) {
    const options = [
        { value: "ODU", label: "ODU LINE" },
        { value: "IDU", label: "IDU LINE" }
    ];

    return (
        <div className="flex flex-wrap gap-2.5">
            {options.map((option) => {
                const active = selectedMachine === option.value;
                return (
                    <Button
                        key={option.value}
                        variant={active ? "default" : "outline"}
                        size="sm"
                        onClick={() => onMachineChange(option.value)}
                        className={`font-semibold text-xs h-9 transition-all duration-200 ${
                            active 
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" 
                                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                    >
                        {option.label}
                    </Button>
                );
            })}
        </div>
    );
}
