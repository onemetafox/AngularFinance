import express from 'express';
import passport from 'passport';
import validate from 'express-validation';

import invoiceCtrl from '../controllers/invoice.controller';
import paramValidation from '../../config/param-validation';
// import authorization from '../services/authorization.service';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
  .get(passport.authenticate('jwt', {
    session: false
  }), invoiceCtrl.list)
  .post(passport.authenticate('jwt', {
    session: false
  }), invoiceCtrl.create);

router.route('/:invoiceId')
  .get(passport.authenticate('jwt', {
    session: false
  }), validate(paramValidation.getInvoice), invoiceCtrl.get);

router.param('invoiceId', invoiceCtrl.load);

export default router;
