import Report from "../models/Report.js";
import Recipe from "../models/Recipe.js";
import User from "../models/User.js";

const VALID_REASONS = ["Spam", "Offensive Content", "Copyright Issue"];

// POST /api/reports/:recipeId (protected)
export const createReport = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { reason, details } = req.body;

    if (!VALID_REASONS.includes(reason)) {
      return res.status(400).json({ message: "Invalid report reason" });
    }

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    const user = await User.findById(req.user.id);

    const report = await Report.create({
      recipeId,
      reporterEmail: user.email,
      reason,
      details: details || "",
    });

    return res.status(201).json({ report, message: "Report submitted. Our team will review it." });
  } catch (error) {
    console.error("createReport error:", error);
    return res.status(500).json({ message: "Server error submitting report" });
  }
};

// GET /api/reports (protected, admin only)
export const getAllReports = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate("recipeId", "recipeName recipeImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Report.countDocuments(filter),
    ]);

    return res.status(200).json({
      reports,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    console.error("getAllReports error:", error);
    return res.status(500).json({ message: "Server error fetching reports" });
  }
};

// PATCH /api/reports/:id/remove-recipe (protected, admin only)
export const removeReportedRecipe = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    await Recipe.findByIdAndUpdate(report.recipeId, { status: "removed" });
    report.status = "removed";
    await report.save();

    return res.status(200).json({ message: "Recipe removed and report resolved" });
  } catch (error) {
    return res.status(500).json({ message: "Server error processing report" });
  }
};

// PATCH /api/reports/:id/dismiss (protected, admin only)
export const dismissReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: "dismissed" },
      { new: true }
    );
    if (!report) return res.status(404).json({ message: "Report not found" });

    return res.status(200).json({ message: "Report dismissed", report });
  } catch (error) {
    return res.status(500).json({ message: "Server error dismissing report" });
  }
};
