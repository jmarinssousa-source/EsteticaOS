"use client";

import { useActionState } from "react";
import { updatePassword, type ActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initialState: ActionState = {};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <PasswordInput id="password" name="password" minLength={8} required />
        {state.fieldErrors?.password ? (
          <p className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
        <PasswordInput id="confirmPassword" name="confirmPassword" minLength={8} required />
        {state.fieldErrors?.confirmPassword && (
          <p className="text-sm text-destructive">{state.fieldErrors.confirmPassword[0]}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
