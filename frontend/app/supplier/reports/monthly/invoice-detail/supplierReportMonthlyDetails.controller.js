export default class SupplierReportMonthlyDetailsCtrl {
    constructor(MonthlyService, $stateParams, SupplierService) {
        this.$stateParams = $stateParams;
        this._SupplierService = SupplierService;
        this._MonthlyService = MonthlyService;
    }
    $onInit() {
        $.Pages.init();
        this.searchCriteria = { id: this.$stateParams.id };
        this.getInvoice(this.searchCriteria);
    }

    getInvoice(searchCriteria) {
        const _onSuccess = (res) => {
            this.invoice = res.data.data;
        };

        const _onError = (err) => {
            this.errors = err.data.data;
        };

        this._MonthlyService.getInvoice(searchCriteria).then(_onSuccess, _onError);
    }
    exportFile() {
        this._MonthlyService.exportInvoiceDetailsFile(this.searchCriteria);
    }
    printFile(query) {
        this._SupplierService.printFile(this.$stateParams.id, query);
    }
}

SupplierReportMonthlyDetailsCtrl.$inject = ['MonthlyService', '$stateParams', 'SupplierService'];
