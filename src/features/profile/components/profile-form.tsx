import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BLOOD_TYPE_OPTIONS } from "@/lib/domain/blood-type";
import {
  type ProfileFormOutput,
  type ProfileFormValues,
  profileFormSchema,
} from "../profile.schema";

export interface ProfileFormProps {
  defaultValues?: Partial<ProfileFormValues>;
  onSubmit: (values: ProfileFormOutput) => void;
  isPending?: boolean;
  submitLabel?: string;
}

export function ProfileForm({
  defaultValues,
  onSubmit,
  isPending = false,
  submitLabel = "Save",
}: ProfileFormProps) {
  const form = useForm<ProfileFormValues, unknown, ProfileFormOutput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      dateOfBirth: defaultValues?.dateOfBirth ?? "",
      bloodType: defaultValues?.bloodType ?? "",
      emergencyContact: defaultValues?.emergencyContact ?? "",
      medicaments: defaultValues?.medicaments ?? "",
      chronicHealthIssues: defaultValues?.chronicHealthIssues ?? "",
      lockScreenSummary: defaultValues?.lockScreenSummary ?? "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bloodType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Blood type</FormLabel>
                <Select
                  value={field.value && field.value.length > 0 ? field.value : undefined}
                  onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">Not specified</SelectItem>
                    {BLOOD_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="emergencyContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emergency contact</FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder="Name, phone number, or other contact details (optional)"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="medicaments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medicaments or supplements</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Medications, vitamins, or supplements you take (optional)"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="chronicHealthIssues"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chronic or persistent health issues</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Ongoing conditions not tied to a specific timeline event (optional)"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lockScreenSummary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lock screen summary</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Short summary for a future lock screen feature (optional)"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                A brief note that could appear on your device lock screen later.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
