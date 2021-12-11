export default class adminCustomerListCtrl {
    constructor(CustomerService, SupplierService, $rootScope, $translate) {
        this._CustomerService = CustomerService;
        this._SupplierService = SupplierService;
        this.$rootScope = $rootScope;
        this.$translate = $translate;
    }

    $onInit() {
        $.Pages.init(); // eslint-disable-line
        const ctrl = this;
        this.status = ['Active', 'Suspended', 'Blocked', 'Deleted'];
        this.searchCriteria = {
            skip: 0,
            limit: 10,
            status: ['Active', 'Suspended', 'Blocked', 'Deleted'],
            supplierName: '',
            payingSoon: false,
            missedPayment: false
        };
        this.currentPage = 1;
        this.getSuppliers(this.searchCriteria);
        this.getCustomers();
        this.$rootScope.$on('getSuppliers', () => {
            ctrl.getSuppliers(ctrl.searchCriteria);
        });
    }
    getCustomers(){
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
    getSuppliers(searchCriteria) {
        const _onSuccess = (res) => {
            this.suppliers = res.data.data.suppliers;

            this.totalPages = Math.ceil(res.data.data.count / this.searchCriteria.limit);
        };
        const _onError = (err) => {
            this.errors = err.data.data;
        };
        const _onFinal = () => {
            this.suppliersAreLoaded = true;
        };
        this._SupplierService.getSuppliers(searchCriteria).then(_onSuccess, _onError).finally(_onFinal);
    }

    setPage(pageNumber) {
        this.currentPage = pageNumber;
        this.searchCriteria.skip = (pageNumber - 1) * this.searchCriteria.limit;
        this.getSuppliers(this.searchCriteria);
    }

    check(value, checked) {
        this.currentPage = 1;
        this.searchCriteria.skip = 0;
        const idx = this.searchCriteria.status.indexOf(value);
        if (idx >= 0 && !checked) {
            this.searchCriteria.status.splice(idx, 1);
        }
        if (idx < 0 && checked) {
            this.searchCriteria.status.push(value);
        }
        this.getSuppliers(this.searchCriteria);
    }

    checkPayment() {
        this.getSuppliers(this.searchCriteria);
    }

    openSupplierFormPoup() {
        this.formData = {};
        this.mode = 'new';
        $('#supplierFormModal').modal('show');
        $.Pages.init();
    }

    exportSupplierList(type) {
        this._SupplierService.exportSupplierList(type, this.searchCriteria);
    }
}
adminCustomerListCtrl.$inject = ['CustomerService', 'SupplierService', '$rootScope', '$translate'];
