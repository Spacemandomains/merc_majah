import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/", (_req, res) => {
  const item = {
    name: process.env.MERCH_ITEM_NAME ?? "Majah Life Tee Shirt",
    price: Number(process.env.MERCH_ITEM_PRICE ?? "25"),
    currency: "USD",
    description: process.env.MERCH_ITEM_DESCRIPTION ?? "More than a garment; it's a manifesto. The Majah Life Essential Tee is the physical manifestation",
    paymentLink: process.env.STRIPE_MERCH_PAYMENT_LINK ?? "",
    available: true,
  };
  res.json(item);
});

export default router;
