"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import React from "react";
import { useFormContext } from "react-hook-form";

type FormSelectType = React.ComponentProps<"select"> & {
  description?: string;
  label?: string;
  placeholder?: string;
  options: {
    value: string;
    label: string;
    disabled?: boolean;
  }[];
  name: string;
  onValueChange?: (value: string) => void;
  itemClassName?: string;
};

const FormSelect = ({
  name,
  description,
  label,
  placeholder,
  disabled,
  options,
  className,
  onValueChange,
  itemClassName,
}: FormSelectType) => {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={itemClassName}>
          {label && <FormLabel>{label}</FormLabel>}
          <Select
            disabled={disabled}
            onValueChange={(value) => {
              if (onValueChange) {
                onValueChange(value);
              }
              field.onChange(value);
            }}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger
                className={cn("rounded-lg shadow-none", className)}
              >
                <SelectValue placeholder={placeholder}>
                  {options.find((option) => option.value === field.value)
                    ?.label || field.value}
                </SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export { FormSelect };
