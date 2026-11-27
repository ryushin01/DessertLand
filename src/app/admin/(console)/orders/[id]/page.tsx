import { AdminOrderView } from "@/_pages/admin-order";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `주문 ${decodeURIComponent(id).slice(0, 24)}` };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <AdminOrderView id={decodeURIComponent(id)} />;
}
