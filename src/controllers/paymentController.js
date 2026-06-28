import Stripe from "stripe";
import Payment from "../models/Payment.js";
import Recipe from "../models/Recipe.js";
import User from "../models/User.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PREMIUM_PRICE_USD = 15;

// POST /api/payments/create-intent  (protected)
// body: { type: "recipe" | "premium", recipeId? }
// IMPORTANT: amount is always derived server-side, never trusted from the client.
export const createPaymentIntent = async (req, res) => {
  try {
    const { type, recipeId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    let amount; // in dollars
    let recipe = null;

    if (type === "recipe") {
      if (!recipeId) return res.status(400).json({ message: "recipeId is required" });
      recipe = await Recipe.findById(recipeId);
      if (!recipe) return res.status(404).json({ message: "Recipe not found" });
      amount = recipe.price;
    } else if (type === "premium") {
      if (user.isPremium) {
        return res.status(400).json({ message: "You already have a premium membership" });
      }
      amount = PREMIUM_PRICE_USD;
    } else {
      return res.status(400).json({ message: "Invalid payment type" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: String(user._id),
        userEmail: user.email,
        purchaseType: type,
        recipeId: recipeId || "",
      },
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount,
    });
  } catch (error) {
    console.error("createPaymentIntent error:", error);
    return res.status(500).json({ message: "Server error creating payment" });
  }
};

// POST /api/payments/confirm  (protected)
// Called by client after stripe.confirmPayment resolves successfully.
// Re-verifies the PaymentIntent status directly with Stripe before
// writing anything — never trust the client's say-so alone.
export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) {
      return res.status(400).json({ message: "paymentIntentId is required" });
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== "succeeded") {
      return res.status(400).json({ message: `Payment not completed (status: ${intent.status})` });
    }

    if (String(intent.metadata.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Payment does not belong to this user" });
    }

    // Idempotency: avoid recording the same transaction twice
    const existing = await Payment.findOne({ transactionId: intent.id });
    if (existing) {
      return res.status(200).json({ message: "Payment already recorded", payment: existing });
    }

    const user = await User.findById(req.user.id);
    const purchaseType = intent.metadata.purchaseType;
    const amount = intent.amount / 100;

    const payment = await Payment.create({
      userEmail: user.email,
      userId: user._id,
      amount,
      recipeId: intent.metadata.recipeId || null,
      purchaseType,
      transactionId: intent.id,
      paymentStatus: "succeeded",
      paidAt: new Date(),
    });

    if (purchaseType === "premium") {
      user.isPremium = true;
      await user.save();
    }

    return res.status(201).json({ payment, message: "Payment confirmed successfully" });
  } catch (error) {
    console.error("confirmPayment error:", error);
    return res.status(500).json({ message: "Server error confirming payment" });
  }
};

// GET /api/payments/mine  (protected) - my purchased recipes
export const getMyPurchasedRecipes = async (req, res) => {
  try {
    const payments = await Payment.find({
      userId: req.user.id,
      purchaseType: "recipe",
      paymentStatus: "succeeded",
    }).sort({ paidAt: -1 });

    const recipeIds = payments.map((p) => p.recipeId).filter(Boolean);
    const recipes = await Recipe.find({ _id: { $in: recipeIds } });
    const recipeMap = new Map(recipes.map((r) => [String(r._id), r]));

    const result = payments
      .map((p) => {
        const r = recipeMap.get(String(p.recipeId));
        if (!r) return null;
        return { ...r.toObject(), purchasedAt: p.paidAt, transactionId: p.transactionId };
      })
      .filter(Boolean);

    return res.status(200).json({ purchasedRecipes: result });
  } catch (error) {
    console.error("getMyPurchasedRecipes error:", error);
    return res.status(500).json({ message: "Server error fetching purchases" });
  }
};

// GET /api/payments/check/:recipeId (protected)
export const checkPurchased = async (req, res) => {
  try {
    const existing = await Payment.findOne({
      userId: req.user.id,
      recipeId: req.params.recipeId,
      purchaseType: "recipe",
      paymentStatus: "succeeded",
    });
    return res.status(200).json({ purchased: !!existing });
  } catch (error) {
    return res.status(500).json({ message: "Server error checking purchase" });
  }
};

// GET /api/payments (protected, admin only) - all transactions
export const getAllTransactions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find().sort({ paidAt: -1 }).skip(skip).limit(limit),
      Payment.countDocuments(),
    ]);

    return res.status(200).json({
      transactions: payments,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching transactions" });
  }
};
