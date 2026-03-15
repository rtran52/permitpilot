"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2 } from "lucide-react";

export type SettingsFormState = { success: boolean; error?: string } | null;

export function SettingsEditForm({
  action,
  fieldName,
  label,
  defaultValue,
  placeholder,
}: {
  action: (
    prevState: SettingsFormState,
    formData: FormData
  ) => Promise<SettingsFormState>;
  fieldName: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, null);

  // Track both the "last saved" baseline and the live input value
  const [savedValue, setSavedValue] = useState(defaultValue);
  const [inputValue, setInputValue] = useState(defaultValue);
  const [showSaved, setShowSaved] = useState(false);

  // Ref always holds the latest input value so the success effect
  // captures the correct string without needing it as a dep
  const inputRef = useRef(defaultValue);

  const isDirty = inputValue.trim() !== savedValue.trim();
  const hasError = !isPending && !!state?.error;

  // On successful save: update baseline, flash the "Saved" confirmation
  useEffect(() => {
    if (!state?.success) return;
    setSavedValue(inputRef.current);
    setShowSaved(true);
    const t = setTimeout(() => setShowSaved(false), 3000);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <div className="px-5 py-4">
      {/* Label row — "Saved ✓" appears on the right when applicable */}
      <div className="flex items-center justify-between mb-1.5">
        <Label
          htmlFor={fieldName}
          className="text-xs font-medium text-gray-500"
        >
          {label}
        </Label>
        {showSaved && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Saved
          </span>
        )}
      </div>

      <form action={formAction}>
        <div className="flex items-center gap-2">
          <Input
            id={fieldName}
            name={fieldName}
            value={inputValue}
            onChange={(e) => {
              inputRef.current = e.target.value;
              setInputValue(e.target.value);
            }}
            placeholder={placeholder}
            disabled={isPending}
            className={[
              "flex-1 h-8 text-sm",
              hasError
                ? "border-red-300 focus-visible:ring-red-300"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />

          {/* Cancel — only visible when the field is dirty and not pending */}
          {isDirty && !isPending && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs text-gray-500 hover:text-gray-700 shrink-0"
              onClick={() => {
                setInputValue(savedValue);
                inputRef.current = savedValue;
              }}
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={isPending || !isDirty}
            className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0 disabled:opacity-50 flex items-center gap-1.5"
          >
            {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>

        {/* Inline validation / server error */}
        {hasError && (
          <p className="mt-1.5 text-xs text-red-500">{state!.error}</p>
        )}
      </form>
    </div>
  );
}
