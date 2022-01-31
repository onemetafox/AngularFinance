import moment from 'moment';

export default class SupplierReportMonthlyCtrl {
    constructor(MonthlyService, CustomerService, SupplierService, $state, $rootScope,$translate) {
        this._MonthlyService = MonthlyService;
        this._CustomerService = CustomerService;
        this._SupplierService = SupplierService;
        this._$state = $state;
        this._$rootScope = $rootScope;
        this._$translate = $translate;
    }

    $onInit() {
        $.Pages.init(); // eslint-disable-line
        moment.locale('en');
        this.currentPage = 1;
        this.searchCriteria = {
            skip: 0,
            limit: 15,
            type: 'All',
            startDate: moment()
                .subtract(1, 'months')
                .format('YYYY-MM-DD'),
            endDate: moment()
                .add(1, 'day')
                .format('YYYY-MM-DD'),
            customerId: 'All',
            branchId: 'All'
        };
        this.date = moment().format('dddd, MMM DD');
        $('#daterangepicker')
            .daterangepicker({
                timePicker: true,
                timePickerIncrement: 30,
                format: 'YYYY-MM-DD',
                startDate: moment()
                    .subtract(1, 'months')
                    .format('YYYY-MM-DD'),
                endDate: moment()
                    .add(1, 'day')
                    .format('YYYY-MM-DD')
            }, (start, end, label) => {
            });
        $('#daterangepicker')
            .on('apply.daterangepicker', (ev, picker) => {
                this.searchCriteria.startDate = picker.startDate.format('YYYY-MM-DD');
                this.searchCriteria.endDate = picker.endDate.format('YYYY-MM-DD');
                this.listInvoices(this.searchCriteria);
            });
        this.listInvoices(this.searchCriteria);
        this.getCustomersLookup();
    }

    listInvoices(searchCriteria) {
        const _onSuccess = (res) => {
            var tempArray = [];
            var i;
            for(var i= 0; i<res.data.data.invoices.length;i++) {
                var inv_item = res.data.data.invoices[i];

                if(inv_item.order!==null){
                    tempArray.push(inv_item);
                }

            } 
            this.invoice = tempArray;
            this.numberOfInvoices = res.data.data.numberOfInvoices;
            this.totalRevenue = res.data.data.totalRevenue;
            this.avgDailyNumberOfInvoices = res.data.data.avgDailyNumberOfInvoices;
            this.avgDailyRevenue = res.data.data.avgDailyRevenue;
            this.totalPages = Math.ceil(res.data.data.numberOfInvoices / this.searchCriteria.limit);
        };
        const _onError = (err) => {
            this.error = err.data.data;
        };
        const _onFinal = (err) => {
            this.reportIsLoaded = true;
        };
        this._MonthlyService.listInvoices(searchCriteria).then(_onSuccess, _onError).finally(_onFinal);
    }

    getCustomersLookup() {
        this.cusSearchCriteria = {
            skip: 0,
            limit: 100,
            customerName: '',
            nameOnly: true
        };
        const _onSuccess = (res) => {
            this.customers = res.data.data.customers;
        };
        const _onError = (err) => {
            this.errors = err.data.data;
        };
        this._CustomerService.getCustomers(this.cusSearchCriteria)
            .then(_onSuccess, _onError);
    }
    getBranchesLookup(customerId) {
        const _onSuccess = (res) => {
            this.branches = res.data.data;
        };
        const _onError = (err) => {
            this.errors = err;
        };
        this._SupplierService.getBranchesByCustomerId(customerId)
            .then(_onSuccess, _onError);    
    }
    createMonthlyInvoice(){
        const _onSuccess = (res) => {
            if(res.data.status == "success"){
                this.createSuccess = true;
                this.message = 'supplier.account.profile.message.success';
                this.notify(this.message, 'danger', 5000);
            }
        };
        const _onError = (err) => {
            this.error = err.data.data;
        };
        const _onFinal = (err) => {
            this.reportIsLoaded = true;
        };
        if(this.searchCriteria.customerId == "All"){
            this.validation = true;
            this.message = 'supplier.account.profile.message.failure';
            this.notify(this.message, 'danger', 5000);
        }else{
            this._MonthlyService.createMonthlyInvoice(this.searchCriteria).then(_onSuccess, _onError).finally(_onFinal);
        }
    }
    notify(message, type, timeout) {
        this._$translate(message).then((translation) => {
            $('body')
                .pgNotification({
                    style: 'bar',
                    message: translation,
                    position: 'top',
                    timeout,
                    type
                })
                .show();
        });
    }
    openReportDetails(transactionsDetails) {
        /* $('#payment').modal('show');
        this.transactionsDetails = transactionsDetails;
        this.transactionsDetails.date = new Date(this.transactionsDetails.date);*/
        this.billItem = transactionsDetails;
        $('#view-payment').modal('show');
        this._$rootScope.$broadcast('paymentEventPopupModal', this.billItem);
    }

    onFilterChange(searchCriteria) {
        this.currentPage = 1;
        this.searchCriteria.skip = 0;
        this.listInvoices(searchCriteria);
        this.getBranchesLookup(searchCriteria.customerId);
    }
    onBranchFilterChange(searchCriteria) {
        this.currentPage = 1;
        this.searchCriteria.skip = 0;
        this.listInvoices(searchCriteria); 
    }
    setPage(pageNumber) {
        this.currentPage = pageNumber;
        this.searchCriteria.skip = (pageNumber - 1) * this.searchCriteria.limit;
        this.listInvoices(this.searchCriteria);
    }

    exportFile() {
        this._MonthlyService.exportInvoiceFile(this.searchCriteria);
    }
    selected(item) {
        const invoice = { id: item.invoice_id };
        this._$state.go('app.supplier.report.invoiceDetails', invoice);
        // if (item.type === 'debit') {
        // } else {
        //     this.openReportDetails(item);
        // }
    }
}

SupplierReportMonthlyCtrl.$inject = ['MonthlyService', 'CustomerService', 'SupplierService', '$state', '$rootScope','$translate'];
