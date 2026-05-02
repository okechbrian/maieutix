import { redirect } from "next/navigation";

export default async function StudentAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/?assignment=${id}`);
}
