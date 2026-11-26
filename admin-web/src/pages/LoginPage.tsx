import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

import { useSignIn } from "@/api/mutations";
import { BrandLogo } from "@/components/common/BrandLogo";
import { TextField } from "@/components/common/Fields";
import { Icon } from "@/components/common/Icon";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authErrorMessages } from "@/constants/feedback";
import { type LoginValues, loginSchema } from "@/schemas/forms";
import { AuthError } from "@/services/moderation";

export default function LoginPage() {
  const navigate = useNavigate();
  const signIn = useSignIn();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  // el motivo del rechazo reemplaza el lema bajo el titulo
  const rejection = signIn.error
    ? signIn.error instanceof AuthError
      ? authErrorMessages[signIn.error.reason]
      : "Couldn't sign in. Please try again."
    : null;

  const onSubmit = form.handleSubmit(async (values) => {
    await signIn.mutateAsync(values).then(
      () => navigate("/dashboard", { replace: true }),
      () => {
        // el error queda en signIn.error y se muestra arriba
      },
    );
  });

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-7 bg-canvas p-4">
      <div className="absolute top-8 right-10">
        <ThemeToggle />
      </div>

      <Card className="w-[464px] max-w-full gap-7 rounded-3xl p-10">
        <div className="flex flex-col items-center gap-[9px] text-center">
          <BrandLogo size={40} />
          <h1 className="text-[27px] leading-8 font-bold">Moderation panel</h1>
          {rejection ? (
            <p role="alert" className="text-base font-bold text-on-notice-soft">
              {rejection}
            </p>
          ) : (
            <p className="text-base text-muted-foreground">A safe space starts with you.</p>
          )}
        </div>

        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
          <TextField
            label="Email"
            type="email"
            autoComplete="username"
            autoCapitalize="none"
            error={errors.email?.message}
            {...form.register("email")}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...form.register("password")}
          />
          {/* todavia no hay flujo de recuperacion definido */}
          <span className="self-start text-sm text-link">Forgot your password?</span>
          <Button
            type="submit"
            variant="default"
            // al pasar el cursor se eleva con sombra; sin movimiento si el sistema pide reducir animaciones
            className="w-full duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-0 hover:shadow-action/35 active:translate-y-0 active:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="flex items-center justify-center gap-2 text-[13px] text-muted-foreground">
          <Icon name="shield-check" className="text-faint" />
          For the FriendFrame team only
        </p>
      </Card>

      <p className="text-[13px] text-muted-foreground">FriendFrame · Moderation with context and empathy</p>
    </div>
  );
}
