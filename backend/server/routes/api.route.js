import express from 'express';
import passport from 'passport';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import apiCtrl from '../controllers/api.controller';
import auth from '../services/Permissions/index';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/suppliers')
   /** POST /api/suppliers - Create new supplier */
  .post(validate(paramValidation.APIcreateSupplier), apiCtrl.supplierCreate);

router.route('/customers')
   /** POST /api/suppliers - Create new supplier */
  .post(validate(paramValidation.APIcreateCustomer), apiCtrl.customerCreate);

/** Load supplier when API with supplierId route parameter is hit */
router.param('supplierId', apiCtrl.load);

export default router;
