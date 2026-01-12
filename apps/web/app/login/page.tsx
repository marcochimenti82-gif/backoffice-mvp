"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { login } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
type FormValues = z.infer<typeof Schema>;

export default function LoginPage() {
  const router = useRouter();
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.email, values.password);
      toast.success("Login ok");
      router.replace("/");
    } catch (e: any) {
      toast.error(`Errore login: ${e.message}`);
    }
  });

  return (
    <div className="mx-auto max-w-sm rounded-xl border border-border p-4">
      <h1 className="text-xl font-semibold">Login staff</h1>
      <p className="mt-1 text-sm text-muted-foreground">Accedi al backoffice.</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div className="space-y-1">
          <Label>Email</Label>
          <Input type="email" placeholder="email@..." {...register("email")} />
          {formState.errors.email && (
            <div className="text-xs text-red-600">{formState.errors.email.message}</div>
          )}
        </div>

        <div className="space-y-1">
          <Label>Password</Label>
          <Input type="password" {...register("password")} />
          {formState.errors.password && (
            <div className="text-xs text-red-600">{formState.errors.password.message}</div>
          )}
        </div>

        <Button type="submit" disabled={formState.isSubmitting} className="w-full">
          {formState.isSubmitting ? "Accesso..." : "Accedi"}
        </Button>

        <div className="text-xs text-muted-foreground">
          Seed: <code>admin@pescheto.local</code> / <code>ChangeMe123!</code>
        </div>
      </form>
    </div>
  );
}
