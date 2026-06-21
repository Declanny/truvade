import { redirect } from "next/navigation";

export default async function SignupAliasPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/invitations/${token}`);
}
