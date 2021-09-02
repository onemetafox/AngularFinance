import suppliesOnHelper from "../supplieson.helper";

export default class TransactionsService {
    constructor(AppConstants, JwtService, RetryRequest) {
        this._AppConstants = AppConstants;
        this._JwtService = JwtService;
        this.retryRequest = RetryRequest;
        this.headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this._JwtService.get()}`
        };
    }
    addPayment(payment) {
        const request = {
            url: `${this._AppConstants.api}/transactions/add`,
            method: 'POST',
            data: payment,
            headers: this.headers
        };
        return this.retryRequest(request);
    }
    declarePayment(payment) {
        const request = {
            url: `${this._AppConstants.api}/transactions/declare`,
            method: 'POST',
            data: payment,
            headers: this.headers
        };
        return this.retryRequest(request);
    }
    listTransactions(query) {
        const request = {};
        request.url = `${this._AppConstants.api}/suppliers/reports/transactions?startDate=${query.startDate}&endDate=${query.endDate}&skip=${query.skip}&limit=${query.limit}`;
        if (query.supplierId) {
            if (query.supplierId !== 'All') {
                request.url = request.url.concat(`&supplierId=${query.supplierId}`);
            }
        }
        if (query.customerId) {
            if (query.customerId !== 'All') {
                request.url = request.url.concat(`&customerId=${query.customerId}`);
            }
        }
        request.url = request.url.concat(`&type=${query.type}`);
        request.method = 'GET';
        request.headers = { 'Content-Type': 'application/json' };
        request.headers.Authorization = `Bearer ${this._JwtService.get()}`;

        return this.retryRequest(request);
    }
    getTransactions(query) {
        const request = {};
        request.url = `${this._AppConstants.api}/transactions?skip=${query.skip}&limit=${query.limit}&startDate=${query.startDate}&endDate=${query.endDate}&isAdminFees=${query.isAdminFees}`;
        if (query.supplierId) {
            request.url = request.url.concat(`&supplierId=${query.supplierId}`);
        }
        if (query.customerId) {
            request.url = request.url.concat(`&customerId=${query.customerId}`);
        }
        request.method = 'GET';
        request.headers = { 'Content-Type': 'application/json' };
        request.headers.Authorization = `Bearer ${this._JwtService.get()}`;

        return this.retryRequest(request);
    }
    exportFile(type, query) {
        let url = `${this._AppConstants.api}/transactions?startDate=${query.startDate}&endDate=${query.endDate}&skip=${query.skip}&limit=${query.limit}`;
        if (type === 'pdf') {
            url = `${url}&export=${type}`;
        } else {
            url = `${url}&export=${type}`;
        }
        if (query.supplierId) {
            url = url.concat(`&supplierId=${query.supplierId}`);
        }
        if (query.customerId) {
            if (query.customerId !== 'All') {
                url = url.concat(`&customerId=${query.customerId}`);
            }
        }
        url = url.concat(`&isAdminFees=${query.isAdminFees}`);
        const request = {
            url,
            headers: this.headers,
            responseType: 'arraybuffer',
            method: 'GET',
        };

        this.retryRequest(request).then(
            (result) => {
                suppliesOnHelper.createBlob(result, 'SupOn-Report', type);
            }
        );
    }

    listInvoices(query) {
        const request = {};
        request.url = `${this._AppConstants.api}/suppliers/reports/invoices?startDate=${query.startDate}&endDate=${query.endDate}&skip=${query.skip}&limit=${query.limit}`;
        if (query.supplierId) {
            if (query.supplierId !== 'All') {
                request.url = request.url.concat(`&supplierId=${query.supplierId}`);
            }
        }
        if (query.customerId) {
            if (query.customerId !== 'All') {
                request.url = request.url.concat(`&customerId=${query.customerId}`);
            }
        }
        // request.url = request.url.concat(`&type=${query.type}`);
        request.method = 'GET';
        request.headers = { 'Content-Type': 'application/json' };
        request.headers.Authorization = `Bearer ${this._JwtService.get()}`;

        return this.retryRequest(request);        
    }
    getInvoice(query) {
        const request = {};
        request.url = `${this._AppConstants.api}/suppliers/reports/invoice/${query.id}`;
        // request.url = request.url.concat(`&type=${query.type}`);
        request.method = 'GET';
        request.headers = { 'Content-Type': 'application/json' };
        request.headers.Authorization = `Bearer ${this._JwtService.get()}`;

        return this.retryRequest(request);
    }
}

TransactionsService.$inject = ['AppConstants', 'JwtService', 'RetryRequest'];
