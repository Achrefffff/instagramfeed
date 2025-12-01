import { useLoaderData, useActionData, data, useNavigation } from "react-router";
import { useState } from "react";
import { authenticate } from "../../shopify.server";
import prisma from "../../db.server";
import { shopifyProducts } from "../../services/shopify-products.server";
import { logger } from "../../utils/logger.server";
import { ProductSelector, LinkedPostsList, SalesStats } from "./components";

export const loader = async ({ request }) => {
  try {
    const { session, admin } = await authenticate.admin(request);
    const shop = session.shop;
    const url = new URL(request.url);
    const postId = url.searchParams.get("postId");

    const [productsData, linkedPosts, salesData] = await Promise.all([
      shopifyProducts.getProducts(admin, { first: 100 }),
      prisma.productLink.findMany({
        where: { shop, isActive: true },
        include: {
          post: true,
          sales: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.saleTracking.findMany({
        where: { shop },
      }),
    ]);

    const products = productsData.edges.map((edge) => edge.node);

    const stats = {
      totalLinkedPosts: new Set(linkedPosts.map((l) => l.postId)).size,
      totalLinkedProducts: new Set(linkedPosts.map((l) => l.productId)).size,
      totalSales: salesData.length,
      totalRevenue: salesData
        .reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0)
        .toFixed(2),
      currency: salesData[0]?.currency || "USD",
    };

    return { shop, products, linkedPosts, stats, postId };
  } catch (error) {
    logger.error("Loader error in app.products", error);
    return { shop: "unknown", products: [], linkedPosts: [], stats: {}, postId: null };
  }
};

export const action = async ({ request }) => {
  try {
    const { session, admin } = await authenticate.admin(request);
    const shop = session.shop;
    const formData = await request.formData();
    const actionType = formData.get("action");

    if (actionType === "link") {
      const postId = formData.get("postId");
      const productId = formData.get("productId");

      const product = await shopifyProducts.getProduct(admin, productId);
      if (!product) {
        return data({ error: "Produit introuvable" }, { status: 404 });
      }

      const existingLink = await prisma.productLink.findUnique({
        where: {
          postId_productId: { postId, productId },
        },
      });

      if (existingLink) {
        return data({ error: "Ce post est déjà lié à ce produit" }, { status: 400 });
      }

      await prisma.productLink.create({
        data: {
          shop,
          postId,
          productId,
          productTitle: product.title,
          productHandle: product.handle,
          productImageUrl: product.featuredImage?.url,
        },
      });

      logger.info("Product linked successfully", { shop, postId, productId });
      return data({ success: true, message: "Produit lié avec succès" });
    }

    if (actionType === "unlink") {
      const linkId = formData.get("linkId");

      await prisma.productLink.update({
        where: { id: linkId },
        data: { isActive: false },
      });

      logger.info("Product unlinked successfully", { shop, linkId });
      return data({ success: true, message: "Produit délié avec succès" });
    }

    return data({ error: "Action invalide" }, { status: 400 });
  } catch (error) {
    logger.error("Action error in app.products", error);
    return data({ error: "Une erreur est survenue" }, { status: 500 });
  }
};

export default function ProductsPage() {
  const { products, linkedPosts, stats, postId } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const [selectedPostId, setSelectedPostId] = useState(postId);
  const [showProductSelector, setShowProductSelector] = useState(!!postId);

  const isLoading = navigation.state === "submitting";

  const handleLink = async (product) => {
    if (!selectedPostId) return;

    const formData = new FormData();
    formData.append("action", "link");
    formData.append("postId", selectedPostId);
    formData.append("productId", product.id);

    const form = document.createElement("form");
    form.method = "post";
    for (const [key, value] of formData.entries()) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <s-page heading="Liaison Posts → Produits">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <SalesStats stats={stats} />

        {actionData?.error && (
          <s-section variant="critical">
            <s-text variant="bodySm">{actionData.error}</s-text>
          </s-section>
        )}

        {actionData?.success && (
          <s-section variant="success">
            <s-text variant="bodySm">{actionData.message}</s-text>
          </s-section>
        )}

        {showProductSelector && (
          <s-section heading="Sélectionner un produit">
            <ProductSelector
              products={products}
              onLink={handleLink}
              isLoading={isLoading}
            />
          </s-section>
        )}

        <s-section heading="Posts liés aux produits">
          <LinkedPostsList linkedPosts={linkedPosts} />
        </s-section>
      </div>
    </s-page>
  );
}
