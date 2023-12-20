const express = require("express");
const router = express.Router();
const chartsController = require("../controllers/charts");

const { ensureAuth, ensureGuest } = require("../middleware/auth");

//Chart Routes - simplified for now
router.get("/:id", ensureAuth, chartsController.getChart);

router.get("/addNewChart/:chartMode", ensureAuth, chartsController.getAddNewChart);

router.post("/createChart/:chartMode", chartsController.createChart);

router.get("/getColorScheme/:color", chartsController.getColorScheme);

// router.put("/likeChart/:id", chartsController.likeChart);

// router.delete("/deleteChart/:id", chartsController.deleteChart);


module.exports = router;
