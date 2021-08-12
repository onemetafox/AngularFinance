import async from 'async';
import httpStatus from 'http-status';
import moment from 'moment-timezone';
import appSettings from '../../appSettings';
import Response from '../services/response.service';
import Invoice from '../models/invoice.model';
import Payments from '../models/pendingPayment.model';
import Supplier from '../models/supplier.model';
import Customer from '../models/customer.model';
import ExportService from './exportFileService';
import OrderProduct from '../models/orderProduct.model';

// const moment = require('moment-timezone');

function get(req, res) {
  const invoice = req.invoice;

  const transactionTotal = invoice.transactions.map(c => c.amount).reduce((sum, value) => sum + value, 0);
  const products = [];
  async.waterfall([
    function passParameter(callback) {
      let transIndex = 0;
      invoice.transactions.forEach((transactionObject) => {
        OrderProduct.find({ order: transactionObject.order })
          .populate({
            path: 'product',
            select: '_id englishName arabicName englishDescription arabicDescription unit',
            populate: {
              path: 'unit'
            }
          })
          .then((orderProducts) => {
            orderProducts.forEach((productObject) => {
              products.push(productObject);
              transIndex += 1;
              if (transIndex === invoice.transactions.length) {
                callback(null, products);
              }
            });
          });
      });
    }
  ], (err, result) => {
    if (err) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json(Response.failure(err));
    } else
      if (req.query.export) {
        if (req.user.language === 'en') {
          ExportService.exportReceiptFile('report_template/main_header/english_header.html',
            'report_template/invoice/invoice-body-english.html', { invoice, products: result, transactionTotal },
            'Invoice', `${moment().tz(appSettings.timeZone).format('DD-MM-YYYY')}`, 'pdf', res);
          // res.download(`report.${req.query.export}`, `SUPReport.${req.query.export}`);
        } else {
          ExportService.exportReceiptFile('report_template/main_header/arabic_header.html',
            'report_template/invoice/invoice-body-arabic.html', { invoice, products: result, transactionTotal },
            'فاتورة', `${moment().tz(appSettings.timeZone).format('DD-MM-YYYY')}`, 'pdf', res);
          // res.download(`report.${req.query.export}`, `SUPReport.${req.query.export}`);
        }
      } else {
        res.json(Response.success({ invoice, products: result, transactionTotal }));
      }
  });
}

function list(req, res) {
  Invoice.find()
    .sort({
      createdAt: -1
    })
    .then((invoices) => {
      res.json(Response.success(invoices));
    });
}

function create(req, res) {
  if (req.user.type === 'Admin') {
    Payments.find({ $and: [{ status: 'Pending' }, { customer: null }, { supplier: req.query.supplierId }] })
      .populate({
        path: 'supplier',
        select: '_id representativeName'
      })
      .then((payments) => {
        const invoiceObject = new Invoice({
          payments,
          supplier: payments[0].supplier,
          dueDate: moment().add(Number(appSettings.duePaymentDays), 'days').tz(appSettings.timeZone).format(appSettings.momentFormat),
          createdAt: moment().tz(appSettings.timeZone).format(appSettings.momentFormat)
        });
        invoiceObject.save()
          .then((invoiceSaved) => {
            payments.forEach((paymentObj) => {
              paymentObj.invoice = invoiceSaved._id;
              paymentObj.save();
            });
            res.json(Response.success(invoiceSaved));
          })
          .catch(e => res.status(httpStatus.INTERNAL_SERVER_ERROR).json(e));
      });
  }
  if (req.user.type === 'Supplier') {
    async.waterfall([
      function passParameter(callback) {
        callback(null, req.user._id);
      },
      getSupplierFromUser
    ], (err, result) => {
      Payments.find({ $and: [{ status: 'Pending' }, { supplier: result }, { customer: req.query.customerId }] })
        .populate({
          path: 'supplier',
          select: '_id representativeName'
        })
        .populate({
          path: 'customer',
          select: '_id representativeName'
        })
        .then((payments) => {
          Customer.findById(req.query.customerId)
            .select('_id representativeName')
            .then((customer) => {
              const invoiceObject = new Invoice({
                payments,
                supplier: result,
                customer,
                dueDate: moment().add(Number(appSettings.duePaymentDays), 'days').tz(appSettings.timeZone).format(appSettings.momentFormat),
                createdAt: moment().tz(appSettings.timeZone).format(appSettings.momentFormat)
              });
              invoiceObject.save()
                .then((invoiceSaved) => {
                  payments.forEach((paymentObj) => {
                    paymentObj.invoice = invoiceSaved._id;
                    paymentObj.save();
                  });
                  res.json(Response.success(invoiceSaved));
                })
                .catch(e => res.status(httpStatus.INTERNAL_SERVER_ERROR).json(e));
            });
        });
    });
  }
}

function load(req, res, next, id) {
  Invoice.findById(id)
    .populate({
      path: 'supplier',
      select: '_id representativeName staff',
      populate: {
        path: 'staff',
        select: '_id email mobileNumber firstName lastName address'
      }
    })
    .populate({
      path: 'customer',
      select: '_id representativeName user',
      populate: {
        path: 'user',
        select: '_id email mobileNumber firstName lastName address'
      }
    })
    .populate({
      path: 'transactions',
      populate: {
        path: 'order'
      }
    })
    .then((invoice) => {
      if (invoice) {
        req.invoice = invoice;
        return next();
      }
      return res.status(httpStatus.BAD_REQUEST).json(Response.failure(2));
    })
    .catch(e => res.status(httpStatus.INTERNAL_SERVER_ERROR).json(Response.failure(e)));
}

/**
 * Helper Function
 * Get supplier using the user.
 * @property {string} userId - The id of the supplier user.
 * @returns {Supplier}
 */
function getSupplierFromUser(userId, callback) {
  Supplier.findOne()
    .select('_id representativeName')
    .where('staff').in([userId])
    .exec((err, supplier) => callback(err, supplier));
}

export default {
  load,
  get,
  list,
  create
};
