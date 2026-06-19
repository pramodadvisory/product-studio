"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export type CreateModalField = {
  /** key in the form data object */
  name: string;
  label: string;
  placeholder?: string;
  /** input renders as a single line, textarea is multi-line, select is a dropdown */
  type?: "input" | "textarea" | "select";
  required?: boolean;
  /** options for select fields */
  options?: string[];
};

type CreateProductModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  fields: CreateModalField[];
  formData: Record<string, string>;
  onFieldChange: (name: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isValid: boolean;
  isLoading?: boolean;
};

export function CreateProductModal({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  fields,
  formData,
  onFieldChange,
  onSubmit,
  isValid,
  isLoading = false,
}: CreateProductModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required ? " *" : ""}
              </Label>

              {field.type === "textarea" ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  placeholder={field.placeholder}
                  value={formData[field.name] ?? ""}
                  onChange={(e) => onFieldChange(field.name, e.target.value)}
                  required={field.required}
                  className="h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                />
              ) : field.type === "select" ? (
                <Select
                  value={formData[field.name] ?? ""}
                  onValueChange={(value) => onFieldChange(field.name, value || "")}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder={field.placeholder}
                  value={formData[field.name] ?? ""}
                  onChange={(e) => onFieldChange(field.name, e.target.value)}
                  required={field.required}
                />
              )}
            </div>
          ))}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isLoading}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
