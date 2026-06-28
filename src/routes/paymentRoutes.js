import express from "express";
import {
  createPaymentIntent,
  confirmPayment,
  getMyPurchasedRecipes,
  checkPurchased,
  getAllTransactions,
} from "../controllers/paymentController.js";
import { verifyToken, verifyAdmin } from "../middleware/verifyToken.js";

const router = express.Router();

router.use(verifyToken);

router.post("/create-intent", createPaymentIntent);
router.post("/confirm", confirmPayment);
router.get("/mine", getMyPurchasedRecipes);
router.get("/check/:recipeId", checkPurchased);

router.get("/", verifyAdmin, getAllTransactions);

export default router;
