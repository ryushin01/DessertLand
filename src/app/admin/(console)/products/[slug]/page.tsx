import { AdminProductView } from "@/_pages/admin-product";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: `${slug} 상품 수정` };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <AdminProductView slug={slug} />;
}
