const express = require("express")

const router = express.Router()
const { addCustomRemark, getMyCustomRemarks, associateRemarkWithDelivery, getDeliveryRemarks } = require("../controllers/remarkController")

router.post("/custom", addCustomRemark)
router.get("/my", getMyCustomRemarks)
router.post("/associate",associateRemarkWithDelivery)
router.get("/delivery/:deliveryId",getDeliveryRemarks)

module.exports = router