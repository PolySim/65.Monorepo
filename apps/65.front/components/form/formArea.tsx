"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Textarea } from "../ui/textarea";

type FormAreaProps = React.ComponentProps<"textarea"> & {
  name: string;
  label?: string;
  description?: string;
  onChange?: (value: string) => void;
};

const FormArea = ({
  name,
  label,
  description,
  disabled,
  onChange,
  className,
  ...props
}: FormAreaProps) => {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Textarea
              disabled={disabled}
              {...field}
              onChange={(e) => {
                field.onChange(e);
                onChange?.(e.target.value);
              }}
              className={className}
              {...props}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export { FormArea };
