"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type ActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/masked-input";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initialState: ActionState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="responsibleName">Seu nome</Label>
        <Input id="responsibleName" name="responsibleName" placeholder="Nome completo" required />
        {state.fieldErrors?.responsibleName && (
          <p className="text-sm text-destructive">{state.fieldErrors.responsibleName[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="clinicName">Nome da clínica</Label>
        <Input id="clinicName" name="clinicName" placeholder="Ex: Clínica Bella Estética" required />
        {state.fieldErrors?.clinicName && (
          <p className="text-sm text-destructive">{state.fieldErrors.clinicName[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="voce@clinica.com"
          autoCapitalize="none"
          autoCorrect="off"
          required
        />
        {state.fieldErrors?.email && (
          <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <MaskedInput
          mask="phone"
          id="phone"
          name="phone"
          type="tel"
          placeholder="(11) 99999-9999"
          required
        />
        {state.fieldErrors?.phone && (
          <p className="text-sm text-destructive">{state.fieldErrors.phone[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <PasswordInput id="password" name="password" minLength={8} required />
        {state.fieldErrors?.password ? (
          <p className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <PasswordInput id="confirmPassword" name="confirmPassword" minLength={8} required />
        {state.fieldErrors?.confirmPassword && (
          <p className="text-sm text-destructive">{state.fieldErrors.confirmPassword[0]}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Criando conta..." : "Criar conta"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </form>
  );
}
