import mongoose from 'mongoose';
import moment from 'moment-timezone';
// import sequenceGenerator from 'mongoose-sequence-plugin';
import appSettings from '../../appSettings';

/**
 * Invoice Schema
 */
const MonthlyInvoice = new mongoose.Schema({
  invoices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  }],
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: false
  },
  createdAt: {
    type: Date,
    default: moment().tz(appSettings.timeZone).format(appSettings.momentFormat)
  },
  startDate: {
    type: Date,
    required: false
  },
  endDate: {
    type: Date,
    required: false
  },
  invoiceId: {
    type: String,
    required: false
  },
  total: {
    type: Number,
    required: false,
    default: 0
  },
  price: {
    type: Number,
    required: false,
    default: 0
  },
  VAT: {
    type: Number,
    required: false,
    default: 0
  }
});

// Invoice.plugin(sequenceGenerator, {
//   field: 'invoiceId',
//   startAt: 'SUPIv150000001'
// });
/**
 * @typedef MonthlyInvoice
 */
export default mongoose.model('MontlyInvoice', MonthlyInvoice);
