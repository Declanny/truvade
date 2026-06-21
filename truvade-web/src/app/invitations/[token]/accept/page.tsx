import { redirect } from "next/navigation";

export default async function AcceptAliasPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/invitations/${token}`);
}
