import { AdminCmsClient } from "../../AdminCmsClient";

export const dynamic = "force-dynamic";

export default function NewProductAdminPage() {
  return <AdminCmsClient initialResource="products" />;
}
