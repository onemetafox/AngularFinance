import async from 'async';
import httpStatus from 'http-status';
import momentHijri from 'moment-hijri';
import EmailHandler from '../../config/emailHandler';
import appSettings from '../../appSettings';
import Supplier from '../models/supplier.model';
import User from '../models/user.model';
import UserService from '../services/user.service';
import Response from '../services/response.service';
import Role from '../models/role.model';
import notificationCtrl from '../controllers/notification.controller';

// const debug = require('debug')('app:supplier');
const moment = require('moment-timezone');

/**
 * Create new supplier
 * @property {string} req.query.representativeName - The representativeName of supplier.
 * @property {string} req.query.commercialRegister - The commercial register of supplier.
 * @property {string} req.query.commercialRegisterPhoto - The commercial register photo of supplier.
 * @property {string} req.query.userEmail - The supplier admin user's email.
 * @property {string} req.query.userMobilePhone - The supplier admin user's mobile phone.
 * @property {string} req.query.userFirstName - The supplier admin user's first name.
 * @property {string} req.query.userLastName - The supplier admin user's last name.
 * @property {string} req.query.userPassword - The supplier admin user's password.
 * @returns {Supplier}
 */
function create(req, res) {
  
  const user = new User({
    email: req.query.userEmail.toLowerCase(),
    mobileNumber: req.query.userMobilePhone,
    password: req.query.userPassword,
    firstName: req.query.userFirstName.toLowerCase(),
    lastName: req.query.userLastName.toLowerCase(),
    language: req.query.language,
    type: 'Supplier',
    createdAt: moment().tz(appSettings.timeZone).format(appSettings.momentFormat)
  });
  const todayDate = moment().tz(appSettings.timeZone);
  let futureDate = '';
  let days = 0;
  if (req.body.paymentInterval) {
    if (req.body.paymentInterval === 'Month') {
      futureDate = moment(todayDate).tz(appSettings.timeZone).add(Number(req.body.paymentFrequency), 'M');
    } else if (req.body.paymentInterval === 'Week') {
      futureDate = moment(todayDate).tz(appSettings.timeZone).add(Number(req.body.paymentFrequency) * 7, 'days');
    } else {
      futureDate = moment(todayDate).tz(appSettings.timeZone).add(Number(req.body.paymentFrequency), 'days');
    }
    days = futureDate.diff(todayDate, 'days');
  } else {
    days = moment().tz(appSettings.timeZone).add(1, 'M').diff(moment(), 'days');
  }

  let supplierStatus = '';
  // if (req.user.type === 'Admin') {
  //   supplierStatus = 'Active';
  // } else {
  //   supplierStatus = 'Suspended';
  // }
  if (req.query.admin) {
    supplierStatus = 'Active';
    user.status = 'Active';
  } else {
    supplierStatus = 'Suspended';
    user.status = 'Suspended';
  }
  const supplier = new Supplier({
    photo: req.query.photo,
    coverPhoto: req.query.coverPhoto,
    representativeName: req.query.representativeName.toLowerCase(),
    location: {
      // coordinates: [req.query.latitude, req.query.longitude]
      coordinates: req.query.coordinates,
      address: req.query.address
    },
    commercialRegister: req.query.commercialRegister,
    commercialRegisterPhoto: req.query.commercialRegisterPhoto,
    commercialRegisterExpireDate: req.query.commercialRegisterExpireDate ? moment(req.query.commercialRegisterExpireDate) : '',
    commercialRegisterExpireDateIslamic: req.query.commercialRegisterExpireDateIslamic ? momentHijri(req.query.commercialRegisterExpireDateIslamic) : '',
    staff: [user._id],
    paymentFrequency: req.query.paymentFrequency,
    paymentInterval: req.query.paymentInterval,
    address: req.query.address,
    days,
    status: supplierStatus,
    createdAt: moment().tz(appSettings.timeZone).format(appSettings.momentFormat),
    startPaymentDate: moment().tz(appSettings.timeZone).format(appSettings.momentFormat),
    VATRegisterNumber: req.query.VATRegisterNumber ? Number(req.query.VATRegisterNumber) : 0,
    VATRegisterPhoto: req.query.VATRegisterPhoto ? req.query.VATRegisterPhoto : null
  });
  
  if (req.query.commercialRegisterExpireDate && (moment(req.query.commercialRegisterExpireDate).diff(moment(), 'days') > appSettings.dateExpireValidation)) {
    res.status(httpStatus.BAD_REQUEST).json(Response.failure(20));
  } else if (req.query.commercialRegisterExpireDate && (moment(req.query.commercialRegisterExpireDate).diff(moment(), 'days') <= 0)) {
    res.status(httpStatus.BAD_REQUEST).json(Response.failure(21));
  } else if (req.query.commercialRegisterExpireDateIslamic && (momentHijri(req.query.commercialRegisterExpireDateIslamic).diff(momentHijri().format('iYYYY/iM/iD'), 'days') > appSettings.dateExpireValidation)) {
    res.status(httpStatus.BAD_REQUEST).json(Response.failure(22));
  } else if (req.query.commercialRegisterExpireDateIslamic && (momentHijri(req.query.commercialRegisterExpireDateIslamic).diff(momentHijri().format('iYYYY/iM/iD'), 'days') <= 0)) {
    res.status(httpStatus.BAD_REQUEST).json(Response.failure(23));
  } else {
    // Find the supplier admin role and assign it to user.
    Role.findOne()
      .where('englishName').equals('Supplier Admin')
      .then((mainRole) => {
        const role = new Role({
          userType: 'Supplier',
          permissions: mainRole.permissions,
          arabicName: mainRole.arabicName,
          englishName: mainRole.englishName
        });
        async.waterfall([
          function passParameter(callback) {
            callback(null, supplier, user, role);
          },
          createSupplier,
          createRole,
          createUser // (supplier, user, callback)
        ],
          (err, result, user) => {
            if (err) {
              res.status(httpStatus.NOT_FOUND).json(Response.failure(err));
            } else {
              result.photo = `${appSettings.imagesUrl}${result.photo}`;
              result.coverPhoto = `${appSettings.imagesUrl}${result.coverPhoto}`;
              if (appSettings.emailSwitch) {
                if (req.query.admin) {
                  const content = {
                    recipientName: UserService.toTitleCase(req.query.userFirstName),
                    loginPageUrl: `<a href=\'${appSettings.mainUrl}/auth/login\'>${appSettings.mainUrl}/auth/login</a>`, // eslint-disable-line no-useless-escape
                    userName: req.query.userEmail,
                    password: req.query.userPassword
                  };
                  EmailHandler.sendEmail(req.query.userEmail, content, 'INVITESUPPLIER', req.query.language);
                } else {
                  const content = {
                    recipientName: UserService.toTitleCase(result.representativeName),
                    loginPageUrl: `<a href=\'${appSettings.mainUrl}/auth/login\'>${appSettings.mainUrl}/auth/login</a>`, // eslint-disable-line no-useless-escape
                    userName: req.query.userEmail,
                    password: req.query.userPassword
                  };
                  EmailHandler.sendEmail(req.query.userEmail, content, 'NEWUSER', req.query.language);
                  User.findOne({ email: appSettings.superAdmin })
                    .then((superAdmin) => {
                      const notification = {
                        refObjectId: user,
                        level: 'info',
                        user: superAdmin,
                        userType: 'Admin',
                        key: 'newSupplierRequest',
                        stateParams: 'supplier'
                      };
                      notificationCtrl.createNotification('user', notification, null, null, null, result._id);
                    });
                }
              }
              res.json(Response.success(result));
            }
          });
      });
  }
}

/**
 * Helper Function
 * Creates the user
 * @property {User} user - The user.
 * @returns {User}
 */
function createUser(supplier, user, role, callback) {
  if (role === null) {
    user.role = user.role;
  } else {
    user.role = role._id;
  }
  async.waterfall([
    function passParameters(outerCallback) {
      outerCallback(null, supplier, user);
    },
    roleEligible,
    function passParameters(supplierData, userData, innerCallback) {
      innerCallback(null, userData);
    },
    UserService.isEmailMobileNumberDuplicate,
    UserService.hashPasswordAndSave
  ],
    (err, savedUser) => {
      if (err) {
        supplier.remove();
      }
      callback(err, supplier, savedUser);
    });
}
/**
 * Helper Function
 * Creates supplier's role
 * @property {Supplier} supplier - The supplier.
 * @property {Role} role - supplier's role.
 * @returns {Supplier}
 */
 function createRole(supplier, user, role, callback) {
  role.supplier = supplier._id;
  role.save()
    .then(savedRole => callback(null, supplier, user, savedRole));
}

/**
 * Helper Function
 * Creates the supplier
 * @property {Supplier} supplier - The supplier.
 * @returns {Supplier}
 */
 function createSupplier(supplier, user, role, callback) {
  async.waterfall([
    function passParameters(innerCallback) {
      innerCallback(null, supplier, null);
    },
    UserService.isCommercialRegisterDuplicate
  ],
    (err, createdSupplier) => {
      if (err) {
        callback(32, null);
      } else {
        createdSupplier.save()
          .then((savedSupplier) => {
            const newDriverRole = new Role({
              userType: 'Supplier',
              permissions: [],
              arabicName: 'سائق مورد',
              englishName: 'SupplierDriver',
              supplier: savedSupplier
            });
            newDriverRole.save()
              .catch(e => callback(null, e));
            callback(null, savedSupplier, user, role);
          })
          .catch(e => callback(e, null));
      }
    });
  // supplier.save()
  // .then(savedSupplier => callback(null, savedSupplier, user, role))
  // .catch(e => callback(e, null));
}

/**
 * Load supplier and append to req.
 */
function load(req, res, next, id) {
  Supplier.findById(id)
    .select('_id representativeName commercialRegister commercialRegisterPhoto commercialRegisterExpireDate VATRegisterNumber VATRegisterPhoto coverPhoto location status photo staff')
    .populate({
      path: 'staff',
      select: '_id email mobileNumber firstName lastName language status'
    })
    .then((supplier) => {
      if (supplier) {
        supplier.photo = `${appSettings.imagesUrl}${supplier.photo}`;
        supplier.coverPhoto = `${appSettings.imagesUrl}${supplier.coverPhoto}`;
        req.supplier = supplier;
        return next();
      }
      return res.status(httpStatus.BAD_REQUEST).json(Response.failure(2));
    })
    .catch(e => res.status(httpStatus.INTERNAL_SERVER_ERROR).json(Response.failure(e)));
}


export default {
  load,
  create
};
