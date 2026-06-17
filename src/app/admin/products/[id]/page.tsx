import { AdminCmsClient } from "../../AdminCmsClient";

export const dynamic = "force-dynamic";

type ProductAdminPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductAdminPage({ params }: ProductAdminPageProps) {
  const { id } = await params;
  return <AdminCmsClient initialResource="products" initialItemId={id} />;
}
