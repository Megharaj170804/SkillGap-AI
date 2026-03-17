const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { globalSearch } = require('../controllers/search.controller');

router.get('/', verifyToken, globalSearch);

module.exports = router;
