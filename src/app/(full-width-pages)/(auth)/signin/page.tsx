import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión | Panel de Administración - Karting League",
  description: "Accede al panel de administración de Karting League.",
};

export default function SignIn() {
  return <SignInForm />;
}
