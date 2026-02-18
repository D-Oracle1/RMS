import { redirect } from 'next/navigation';

export default async function CreateRealtorPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  const ref = params?.ref;
  const url = ref
    ? `/auth/register?role=realtor&ref=${ref}`
    : '/auth/register?role=realtor';
  redirect(url);
}
